const cron = require('node-cron');
const db = require('../config/database');
const gemini = require('./geminiService');
const { getTransporter, getStoreSettings, emailTemplate, formatPrice, insertLog } = require('./emailService');

let currentTask = null;

// The main function to process the automated newsletter
const processNewsletter = async (isTest = false, testEmail = null, bypassEnabledCheck = false) => {
    try {
        console.log('[Newsletter Cron] Starting process...');
        
        // 1. Get Settings
        const [settings] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'newsletter_automation_config'");
        if (!settings || settings.length === 0) {
            console.log('[Newsletter Cron] No config found. Aborting.');
            return { success: false, error: 'No config found' };
        }
        
        let config = {};
        try {
            config = JSON.parse(settings[0].setting_value);
        } catch (e) {
            return { success: false, error: 'Invalid config format' };
        }

        if (!config.enabled && !isTest && !bypassEnabledCheck) {
            console.log('[Newsletter Cron] Automation is disabled. Aborting.');
            return { success: false, error: 'Automation is disabled' };
        }

        const productIds = config.product_ids || [];
        if (productIds.length === 0) {
            console.log('[Newsletter Cron] No products selected. Aborting.');
            return { success: false, error: 'No products selected' };
        }

        // 2. Select next products (2-4 items)
        let nextIndex = config.last_sent_index !== undefined ? config.last_sent_index + 1 : 0;
        if (nextIndex >= productIds.length) nextIndex = 0;
        
        let numToSelect = Math.min(productIds.length, 4); // Select up to 4 items
        numToSelect = Math.max(1, numToSelect); 

        let selectedIds = [];
        for (let i = 0; i < numToSelect; i++) {
            let idx = (nextIndex + i) % productIds.length;
            if (!selectedIds.includes(productIds[idx])) {
                selectedIds.push(productIds[idx]);
            }
        }
        
        let advanceCount = selectedIds.length;

        const [unsortedProducts] = await db.query('SELECT * FROM products WHERE id IN (?) AND is_active = 1', [selectedIds]);
        
        // Sort to match selectedIds order
        const products = [];
        for (const sid of selectedIds) {
            const p = unsortedProducts.find(x => x.id === sid);
            if (p) products.push(p);
        }
        
        if (products.length === 0) {
            console.log(`[Newsletter Cron] Selected products not found or inactive.`);
            // Update index and skip
            if (!isTest) {
                config.last_sent_index = (nextIndex + advanceCount - 1) % productIds.length;
                await db.query("UPDATE settings SET setting_value = ? WHERE setting_key = 'newsletter_automation_config'", [JSON.stringify(config)]);
            }
            return { success: false, error: 'Selected products not available' };
        }

        const mainProduct = products[0];
        const secondaryProducts = products.slice(1);

        // 3. Generate AI Content for the email
        console.log(`[Newsletter Cron] Generating AI content for ${mainProduct.name}...`);
        
        // Parse attributes to provide better context
        let attrText = '';
        try {
            const attrs = JSON.parse(mainProduct.attributes || '[]');
            attrText = attrs.map(a => `${a.key}: ${a.value}`).join(', ');
        } catch (e) {}

        const prompt = `
You are an expert email marketer writing an engaging, modern e-commerce newsletter.
Product Name: ${mainProduct.name}
Category: ${mainProduct.category}
Price: ${mainProduct.price} THB
Description: ${mainProduct.short_description || mainProduct.description?.substring(0, 300) || 'สินค้าคุณภาพยอดเยี่ยม'}
Features: ${attrText}
AI Context: ${mainProduct.llm_context || ''}

Write a short, engaging email copy to sell this product. The tone should be professional, welcoming, and persuasive. Use Thai language. 
Return ONLY a valid JSON object with the following exact keys:
{
  "subject": "The email subject line (catchy, max 60 chars)",
  "headline": "A short, punchy headline (e.g., 'ยกระดับพื้นที่ของคุณด้วย...')",
  "intro": "1-2 sentences of engaging introductory text highlighting the main pain point it solves.",
  "bullet_points": ["benefit 1", "benefit 2", "benefit 3"],
  "call_to_action": "Short text for the button (e.g., 'ดูรายละเอียดและสั่งซื้อเลย')"
}
Do not use markdown formatting. Output raw JSON only.
`;
        
        let aiContent;
        try {
            const response = await gemini.generateContent({
                prompt,
                responseMimeType: 'application/json',
                label: 'Newsletter Content Generation'
            });
            aiContent = JSON.parse(response.text);
        } catch (err) {
            console.warn('[Newsletter Cron] AI generation failed, using fallback.', err);
            aiContent = {
                subject: `แนะนำสินค้าใหม่: ${mainProduct.name}`,
                headline: `พบกับ ${mainProduct.name} ที่จะตอบโจทย์คุณ`,
                intro: `เราขอแนะนำสินค้าคุณภาพเยี่ยมที่คัดสรรมาเพื่อคุณโดยเฉพาะ ด้วยวัสดุเกรดพรีเมียมและดีไซน์ที่ทันสมัย`,
                bullet_points: ['ดีไซน์สวยงามทันสมัย', 'ใช้งานได้หลากหลาย', 'ราคาคุ้มค่า'],
                call_to_action: 'ดูรายละเอียดเพิ่มเติม'
            };
        }

        // 4. Build Email HTML
        const store = await getStoreSettings();
        const mainProductUrl = `${store.storeUrl}/products/${mainProduct.slug || mainProduct.id}`;
        
        // Pick primary image
        let primaryImage = mainProduct.image_url;
        if (!primaryImage && mainProduct.images) {
            try {
                const parsed = JSON.parse(mainProduct.images);
                if (parsed.length > 0) primaryImage = parsed[0];
            } catch (e) {}
        }
        
        const bulletHtml = aiContent.bullet_points.map(b => `<li style="margin-bottom:12px;color:#4b5563;font-size:16px;">${b}</li>`).join('');

        let secondaryHtml = '';
        if (secondaryProducts.length > 0) {
            const secondaryCards = secondaryProducts.map(sp => {
                let spImg = sp.image_url;
                if (!spImg && sp.images) {
                    try {
                        const parsed = JSON.parse(sp.images);
                        if (parsed.length > 0) spImg = parsed[0];
                    } catch (e) {}
                }
                const spUrl = `${store.storeUrl}/products/${sp.slug || sp.id}`;
                return `
                    <td width="50%" style="padding:10px;vertical-align:top;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#ffffff;height:100%;">
                            <tr><td style="background:#f9fafb;text-align:center;">
                                <a href="${spUrl}"><img src="${spImg}" alt="${sp.name}" style="width:100%;height:140px;object-fit:cover;display:block;"></a>
                            </td></tr>
                            <tr><td style="padding:16px;">
                                <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#111827;line-height:1.4;height:40px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${sp.name}</p>
                                <p style="margin:0 0 12px;font-size:16px;font-weight:900;color:#059669;">
                                    ${sp.original_price ? `<span style="color:#9ca3af;text-decoration:line-through;margin-right:6px;font-size:13px;font-weight:normal;">${formatPrice(sp.original_price)}</span>` : ''}
                                    ${formatPrice(sp.price)}
                                </p>
                                <a href="${spUrl}" style="display:block;background:#f3f4f6;color:#374151;text-align:center;padding:8px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:700;">ดูรายละเอียด</a>
                            </td></tr>
                        </table>
                    </td>
                `;
            });
            
            // Chunk by 2 for table rows
            let rowsHtml = '';
            for (let i = 0; i < secondaryCards.length; i += 2) {
                rowsHtml += `<tr>${secondaryCards[i]}${secondaryCards[i+1] || '<td width="50%" style="padding:10px;"></td>'}</tr>`;
            }

            secondaryHtml = `
                <div style="margin-top:40px;padding-top:40px;border-top:1px solid #f3f4f6;">
                    <h3 style="margin:0 0 20px;font-size:18px;font-weight:800;color:#111827;text-align:center;">สินค้าอื่นๆ ที่น่าสนใจ</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 -10px;">
                        ${rowsHtml}
                    </table>
                </div>
            `;
        }

        const emailBody = `
            <!-- Hero Section -->
            ${primaryImage ? `<div style="text-align:center;margin-bottom:32px;border-radius:16px;overflow:hidden;background:#f9fafb;"><a href="${mainProductUrl}"><img src="${primaryImage}" alt="${mainProduct.name}" style="max-width:100%;height:auto;display:block;margin:0 auto;max-height:400px;object-fit:cover;"></a></div>` : ''}
            
            <h2 style="color:#111827;font-size:26px;font-weight:900;margin:0 0 16px;text-align:center;line-height:1.3;letter-spacing:-0.5px;">
                ${aiContent.headline}
            </h2>
            
            <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 32px;text-align:center;">
                ${aiContent.intro}
            </p>
            
            <div style="background:#f9fafb;border-radius:16px;padding:24px 32px;margin-bottom:32px;border-left:4px solid #10b981;">
                <ul style="margin:0;padding-left:16px;">
                    ${bulletHtml}
                </ul>
            </div>
            
            <div style="text-align:center;margin-bottom:16px;">
                <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">ราคาพิเศษ</p>
                ${mainProduct.original_price ? `<span style="color:#9ca3af;text-decoration:line-through;margin-right:8px;font-size:16px;">${formatPrice(mainProduct.original_price)}</span>` : ''}
                <span style="color:#059669;font-weight:900;font-size:28px;">${formatPrice(mainProduct.price)}</span>
            </div>
            
            <div style="text-align:center;">
                <a href="${mainProductUrl}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;padding:16px 40px;font-size:16px;font-weight:800;border-radius:10px;text-align:center;width:100%;max-width:300px;box-sizing:border-box;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                    ${aiContent.call_to_action}
                </a>
            </div>
            
            ${secondaryHtml}
            
            <div style="margin-top:48px;text-align:center;">
                <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6;">
                    คุณได้รับอีเมลนี้เนื่องจากได้สมัครรับข่าวสารจาก ${store.storeName}<br>
                    หากไม่ต้องการรับข่าวสาร <a href="${store.storeUrl}/unsubscribe" style="color:#6b7280;text-decoration:underline;">คลิกที่นี่เพื่อยกเลิกการติดตาม</a>
                </p>
            </div>
        `;

        const htmlTemplate = emailTemplate(emailBody, store);

        // 5. Send Emails
        const mailer = await getTransporter();
        if (!mailer) return { success: false, error: 'SMTP not configured' };

        let targets = [];
        if (isTest && testEmail) {
            targets = [testEmail];
        } else {
            const [subs] = await db.query('SELECT email FROM newsletter_subscribers WHERE is_active = 1');
            targets = subs.map(s => s.email);
        }

        if (targets.length === 0) {
            console.log('[Newsletter Cron] No active subscribers found.');
            return { success: true, message: 'No subscribers to send to' };
        }

        console.log(`[Newsletter Cron] Sending to ${targets.length} emails...`);
        
        // Bcc strategy to hide emails from each other
        // Batch in groups of 50 to prevent SMTP rejection
        const batchSize = 50;
        let successCount = 0;
        
        for (let i = 0; i < targets.length; i += batchSize) {
            const batch = targets.slice(i, i + batchSize);
            const batchRecipient = isTest ? testEmail : batch.join(', ');
            try {
                await mailer.transport.sendMail({
                    from: `"${mailer.fromName}" <${mailer.fromEmail}>`,
                    to: isTest ? testEmail : mailer.fromEmail, // Primary 'to'
                    bcc: isTest ? [] : batch,
                    subject: aiContent.subject,
                    html: htmlTemplate
                });
                successCount += batch.length;
                // Log success
                await insertLog(batchRecipient.substring(0, 255), aiContent.subject, 'Newsletter', 'success');
            } catch (err) {
                console.error(`[Newsletter Cron] Batch send error:`, err.message);
                // Log failure
                await insertLog(batchRecipient.substring(0, 255), aiContent.subject, 'Newsletter', 'failed', err.message);
            }
        }

        // 6. Update index
        if (!isTest) {
            config.last_sent_index = (nextIndex + advanceCount - 1) % productIds.length;
            await db.query("UPDATE settings SET setting_value = ? WHERE setting_key = 'newsletter_automation_config'", [JSON.stringify(config)]);
            console.log(`[Newsletter Cron] Successfully processed and sent to ${successCount} subscribers.`);
        }

        return { success: true, message: `Sent to ${successCount} emails.`, product: mainProduct.name };
        
    } catch (error) {
        console.error('[Newsletter Cron] Error:', error);
        return { success: false, error: error.message };
    }
};

const initNewsletterCron = async () => {
    // 1. Destroy existing task if any
    if (currentTask) {
        currentTask.stop();
        currentTask = null;
    }

    // 2. Fetch config
    try {
        const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'newsletter_automation_config'");
        if (!rows || rows.length === 0) return;
        
        const config = JSON.parse(rows[0].setting_value);
        if (!config.enabled || !config.time) return;

        // Parse time (e.g. "09:00")
        const [hour, minute] = config.time.split(':');
        if (hour === undefined || minute === undefined) return;

        const cronStr = `${minute} ${hour} * * *`;
        
        console.log(`[Newsletter Cron] Scheduled at ${config.time} (Cron: ${cronStr})`);
        
        currentTask = cron.schedule(cronStr, () => {
            processNewsletter(false);
        }, {
            scheduled: true,
            timezone: "Asia/Bangkok"
        });
        
    } catch (e) {
        console.error('[Newsletter Cron] Init failed:', e.message);
    }
};

module.exports = {
    initNewsletterCron,
    processNewsletter
};
