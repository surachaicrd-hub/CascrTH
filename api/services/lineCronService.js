const cron = require('node-cron');
const db = require('../config/database');
const gemini = require('./geminiService');
const lineService = require('./lineService');
const { getStoreSettings, formatPrice } = require('./emailService');

let currentTask = null;

/**
 * Main function: Process LINE automated broadcast
 * @param {boolean} isTest - If true, sends to admin only (push) instead of broadcast
 * @param {string} testUserId - LINE user ID to send test message to (optional)
 * @param {boolean} bypassFrequency - If true, bypasses the frequency check
 */
const processLineBroadcast = async (isTest = false, testUserId = null, bypassFrequency = false) => {
    try {
        console.log('[LINE Cron] Starting process...');

        // 1. Get Settings
        const [settings] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'line_automation_config'");
        if (!settings || settings.length === 0) {
            console.log('[LINE Cron] No config found. Aborting.');
            return { success: false, error: 'No config found' };
        }

        let config = {};
        try {
            config = JSON.parse(settings[0].setting_value);
        } catch (e) {
            return { success: false, error: 'Invalid config format' };
        }

        if (!config.enabled && !isTest && !bypassFrequency) {
            console.log('[LINE Cron] Automation is disabled. Aborting.');
            return { success: false, error: 'Automation is disabled' };
        }

        // Check frequency (skip if last sent was less than frequency_days ago)
        if (!isTest && !bypassFrequency && config.last_sent_date) {
            const lastSent = new Date(config.last_sent_date);
            const now = new Date();
            const daysDiff = Math.floor((now - lastSent) / (1000 * 60 * 60 * 24));
            if (daysDiff < (config.frequency_days || 15)) {
                console.log(`[LINE Cron] Last sent ${daysDiff} days ago. Frequency is ${config.frequency_days} days. Skipping.`);
                return { success: false, error: `Next broadcast in ${(config.frequency_days || 15) - daysDiff} days` };
            }
        }

        // 2. Select a random product from active products
        const [allProducts] = await db.query('SELECT * FROM products WHERE is_active = 1 ORDER BY RAND() LIMIT 1');
        if (allProducts.length === 0) {
            console.log('[LINE Cron] No active products found.');
            return { success: false, error: 'No active products available' };
        }

        const product = allProducts[0];
        console.log(`[LINE Cron] Selected product: ${product.name}`);

        // 3. Generate AI Content for LINE message
        let attrText = '';
        try {
            const attrs = JSON.parse(product.attributes || '[]');
            attrText = attrs.map(a => `${a.key}: ${a.value}`).join(', ');
        } catch (e) {}

        const prompt = `
คุณเป็นนักการตลาดผู้เชี่ยวชาญด้านแชทมาร์เก็ตติ้ง กำลังเขียนข้อความแนะนำสินค้าส่งผ่าน LINE Official Account
ข้อมูลสินค้า:
- ชื่อ: ${product.name}
- หมวดหมู่: ${product.category}
- ราคา: ${product.price} บาท
- คำอธิบายสั้น: ${product.short_description || product.description?.substring(0, 300) || 'สินค้าคุณภาพยอดเยี่ยม'}
- คุณสมบัติ: ${attrText}
- ข้อมูลเพิ่มเติม: ${product.llm_context || ''}

เขียนข้อความสั้นๆ กระชับ สำหรับส่งเป็น LINE message เพื่อแนะนำสินค้า:
- ใช้ภาษาไทยเป็นกันเอง สนุก มี emoji ที่เหมาะสม (ไม่เยอะเกินไป)
- ข้อความต้องสั้นกระชับ อ่านง่าย กระตุ้นความสนใจ
- เน้น benefit ไม่ใช่แค่ feature

ตอบเป็น JSON เท่านั้น:
{
  "headline": "หัวข้อหลักสั้นๆ (ไม่เกิน 40 ตัวอักษร)",
  "intro": "คำบรรยาย 1-2 ประโยค กระตุ้นให้อยากคลิกดู",
  "call_to_action": "ข้อความปุ่ม เช่น 'ดูรายละเอียดเลย'"
}
`;
        let aiContent;
        try {
            const response = await gemini.generateContent({
                prompt,
                responseMimeType: 'application/json',
                label: 'LINE Broadcast Content'
            });
            aiContent = JSON.parse(response.text);
        } catch (err) {
            console.warn('[LINE Cron] AI generation failed, using fallback.', err.message);
            aiContent = {
                headline: `แนะนำ: ${product.name}`,
                intro: `สินค้าคุณภาพเยี่ยมที่คัดสรรมาเพื่อคุณ ด้วยวัสดุเกรดพรีเมียมและดีไซน์ทันสมัย`,
                call_to_action: 'ดูรายละเอียดเพิ่มเติม'
            };
        }

        // 4. Build Flex Message
        const store = await getStoreSettings();
        const flexMessage = lineService.buildProductFlexMessage(product, aiContent, store.storeUrl);

        // 5. Send
        if (isTest && testUserId) {
            // Test mode: push to a specific user
            await lineService.sendPush(testUserId, [flexMessage]);
            console.log(`[LINE Cron] Test message sent to user: ${testUserId}`);
        } else if (isTest) {
            // Test mode without user ID: just return the generated content
            return { success: true, message: 'Test content generated (no user ID to send to)', product: product.name, aiContent, flexMessage };
        } else {
            // Production: broadcast to all followers
            await lineService.sendBroadcast([flexMessage]);
            console.log('[LINE Cron] Broadcast sent successfully.');
            
            // Update last_sent_date
            config.last_sent_date = new Date().toISOString().slice(0, 10);
            await db.query("UPDATE settings SET setting_value = ? WHERE setting_key = 'line_automation_config'", [JSON.stringify(config)]);
        }

        return { success: true, message: isTest ? 'Test sent' : 'Broadcast sent', product: product.name };

    } catch (error) {
        console.error('[LINE Cron] Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Initialize the LINE cron job
 * Reads config from DB and schedules the broadcast
 */
const initLineCron = async () => {
    // Destroy existing task
    if (currentTask) {
        currentTask.stop();
        currentTask = null;
    }

    try {
        const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'line_automation_config'");
        if (!rows || rows.length === 0) return;

        const config = JSON.parse(rows[0].setting_value);
        if (!config.enabled || !config.time) return;

        const [hour, minute] = config.time.split(':');
        if (hour === undefined || minute === undefined) return;

        // Run daily at the specified time, but the processLineBroadcast function
        // will internally check the frequency_days to decide whether to actually send
        const cronStr = `${minute} ${hour} * * *`;

        console.log(`[LINE Cron] Scheduled daily check at ${config.time} (every ${config.frequency_days || 15} days) (Cron: ${cronStr})`);

        currentTask = cron.schedule(cronStr, () => {
            processLineBroadcast(false);
        }, {
            scheduled: true,
            timezone: "Asia/Bangkok"
        });

    } catch (e) {
        console.error('[LINE Cron] Init failed:', e.message);
    }
};

module.exports = {
    initLineCron,
    processLineBroadcast
};
