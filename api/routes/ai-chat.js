const express = require('express');
const router = express.Router();
const db = require('../config/database');
const gemini = require('../services/geminiService');

// In-memory conversation history keyed by sessionId (simple, resets on server restart)
const conversationHistory = new Map();
const MAX_HISTORY = 20; // Keep last 20 messages per session
const HISTORY_TTL = 30 * 60 * 1000; // 30 min TTL

// Cleanup old sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of conversationHistory) {
        if (now - val.lastActive > HISTORY_TTL) {
            conversationHistory.delete(key);
        }
    }
}, 5 * 60 * 1000);

// Build system context from DB
async function buildSystemContext() {
    const [products] = await db.query(
        `SELECT name, category, price, short_description, llm_context, slug, image_url, original_price, sku
         FROM products WHERE is_active = 1 
           AND NOT EXISTS (
               SELECT 1 FROM categories c
               WHERE c.is_active = false
                 AND (category = c.name OR (categories IS NOT NULL AND JSON_CONTAINS(categories, JSON_QUOTE(c.name))))
           )
         ORDER BY category, name LIMIT 100`
    );

    const [settingsRows] = await db.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    settingsRows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    // Build product catalog text with slug references
    let productCatalog = '';
    const productMap = new Map(); // slug -> product data
    if (products.length > 0) {
        productCatalog = products.map(p => {
            productMap.set(p.slug, p);
            let desc = p.llm_context || p.short_description || '';
            return `- [slug:${p.slug}] ${p.name} (รหัส: ${p.sku || '-'}, หมวด: ${p.category || 'ทั่วไป'}, ราคา: ${p.price ? Number(p.price).toLocaleString() + ' บาท' : 'สอบถาม'}) ${desc ? '— ' + desc : ''}`.trim();
        }).join('\n');
    }

    // Build contact info text
    let contactInfo = '';
    try {
        const companyName = settings.contact_company_name || 'Morespace';
        const address = settings.contact_address || '';
        const workingHours = settings.contact_working_hours || 'จันทร์-ศุกร์ 08:00-17:00';

        let phoneList = '';
        if (settings.contact_phones) {
            const phones = JSON.parse(settings.contact_phones);
            phoneList = phones.map(p => `${p.name ? p.name + ': ' : ''}${p.value}`).join(', ');
        }

        let emailList = '';
        if (settings.contact_emails) {
            const emails = JSON.parse(settings.contact_emails);
            emailList = emails.map(e => `${e.name ? e.name + ': ' : ''}${e.value}`).join(', ');
        }

        let lineList = '';
        if (settings.contact_lines) {
            const lines = JSON.parse(settings.contact_lines);
            lineList = lines.map(l => `${l.name ? l.name + ': ' : ''}LINE ID ${l.value}`).join(', ');
        }

        const fb = settings.contact_facebook_url || '';
        const tiktok = settings.contact_tiktok_url || '';
        const youtube = settings.contact_youtube_url || '';

        contactInfo = `
ชื่อบริษัท: ${companyName}
ที่อยู่: ${address}
เวลาทำการ: ${workingHours}
${phoneList ? 'โทรศัพท์: ' + phoneList : ''}
${emailList ? 'อีเมล: ' + emailList : ''}
${lineList ? 'LINE: ' + lineList : ''}
${fb ? 'Facebook: ' + fb : ''}
${tiktok ? 'TikTok: ' + tiktok : ''}
${youtube ? 'YouTube: ' + youtube : ''}
`.trim();
    } catch (e) {
        contactInfo = 'ติดต่อ Morespace ผ่านหน้าเว็บไซต์';
    }

    return { productCatalog, contactInfo, settings, productMap };
}

function buildSystemPrompt(productCatalog, contactInfo) {
    return `คุณคือ "Morespace AI Consultant" ผู้ช่วย AI สถาปนิกและผู้เชี่ยวชาญด้านการจัดการพื้นที่ของ Morespace ผู้เชี่ยวชาญด้านบ้านเก็บของ และโซลูชันจัดเก็บสินค้า

บทบาทและความเชี่ยวชาญของคุณ:
- วิเคราะห์ความต้องการของลูกค้า: หากลูกค้าให้ข้อมูลมาไม่ครบถ้วน (เช่น บอกแค่ว่า "อยากได้ตู้เก็บของ") ให้ตั้งคำถามกลับเพื่อเจาะลึกความต้องการ เช่น พื้นที่กว้างยาวเท่าไหร่? นำไปใช้งานอะไร? ติดตั้งภายนอกหรือภายใน?
- ให้คำปรึกษาเชิงลึก: แนะนำสินค้าที่ตอบโจทย์จริงๆ พร้อมอธิบายเหตุผลว่าทำไมถึงเหมาะสม ประเมินงบประมาณเบื้องต้น
- สไตล์การตอบ: มืออาชีพ (Professional), ล้ำสมัย (Modern), สุภาพและใส่ใจ (Empathetic) เหมือนได้คุยกับสถาปนิกผู้เชี่ยวชาญ
- ขอบเขต: หากคำถามอยู่นอกเหนือสินค้า/บริการของ Morespace ให้ตอบอย่างสุภาพว่าไม่เชี่ยวชาญ และโยงกลับมาที่โซลูชันของเรา
- การโอนสาย: หากลูกค้ายืนยันต้องการคุยกับพนักงาน (มนุษย์) ให้แจ้งข้อมูลติดต่อจากส่วน "ข้อมูลติดต่อ" ด้านล่าง

== รูปแบบการตอบ (Formatting Rules) ==
- อนุญาตและส่งเสริมให้ใช้ Markdown Formatting เพื่อให้อ่านง่าย เช่น:
  - ใช้ **ตัวหนา** สำหรับเน้นคำสำคัญ ราคา หรือชื่อรุ่นสินค้า
  - ใช้ - (Bullet points) หรือ 1. 2. 3. เพื่อแจกแจงรายละเอียดให้ชัดเจน
- **ห้ามใช้เครื่องหมายขีดเส้นคั่น (--- หรือ ***) โดยเด็ดขาด** ให้ใช้วิธีเว้นบรรทัดแบ่งเนื้อหาให้เป็นระเบียบแทน
- อย่าเขียนยาวเกินไป ให้แบ่งเป็นย่อหน้าสั้นๆ กระชับและได้ใจความ
- ราคาที่แจ้งคือราคาประเมินเบื้องต้น

== กฎสำคัญเรื่องการแนะนำสินค้า ==
เมื่อคุณแนะนำสินค้า ให้แนบ tag [PRODUCT:slug] (slug คือรหัสสินค้าจากแคตตาล็อก) ไว้ที่บรรทัดใหม่ ท้ายสุดของข้อความแนะนำนั้นๆ 
ตัวอย่าง: 
ผมแนะนำเป็นรุ่นนี้ครับ พื้นที่กว้างขวางและทนแดดทนฝน ราคาประเมินอยู่ที่ **15,900 บาท**
[PRODUCT:premium-hdpe-outdoor-storage-cabinet-ms-sc004-beige]

แนบ tag เฉพาะสินค้าที่คุณแนะนำจริงๆ (สูงสุด 3 รายการต่อคำตอบ) และตรวจสอบให้แน่ใจว่า slug ตรงกับแคตตาล็อกด้านล่างทุกตัวอักษร

== แคตตาล็อกสินค้า ==
${productCatalog || 'ยังไม่มีข้อมูลสินค้าในระบบ'}

== ข้อมูลติดต่อ ==
${contactInfo}

กรุณาตอบเป็นภาษาไทยเสมอ และใช้ Markdown จัดรูปแบบให้ดูพรีเมียมและอ่านง่าย`;
}

router.post('/', async (req, res) => {
    try {
        // Check if AI Consultant is enabled
        const [settingsRows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'ai_consultant_enabled'");
        const isAiConsultantEnabled = settingsRows.length === 0 || settingsRows[0].setting_value !== 'false';
        if (!isAiConsultantEnabled) {
            return res.status(403).json({ success: false, error: 'AI Consultant is currently disabled' });
        }

        const { message, sessionId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Build context from DB
        const { productCatalog, contactInfo, productMap } = await buildSystemContext();
        const systemPrompt = buildSystemPrompt(productCatalog, contactInfo);

        // Get/create conversation history
        const sid = sessionId || 'anonymous';
        if (!conversationHistory.has(sid)) {
            conversationHistory.set(sid, { messages: [], lastActive: Date.now() });
        }
        const session = conversationHistory.get(sid);
        session.lastActive = Date.now();

        // Add user message to history
        session.messages.push({ role: 'user', parts: [{ text: message }] });

        // Trim history to keep within limits
        if (session.messages.length > MAX_HISTORY) {
            session.messages = session.messages.slice(-MAX_HISTORY);
        }

        // Build contents for Gemini
        const contents = [
            { role: 'user', parts: [{ text: systemPrompt + '\n\nนี่คือข้อความแรกของลูกค้า ให้ทักทายด้วย' }] },
            { role: 'model', parts: [{ text: 'สวัสดีครับ ผมคือ **Morespace AI Consultant** ผู้เชี่ยวชาญด้านการจัดการพื้นที่และการเลือกโซลูชันจัดเก็บสินค้า วันนี้มีโปรเจกต์แบบไหน หรือต้องการให้ผมช่วยวิเคราะห์พื้นที่สำหรับการติดตั้งบ้านเก็บของ แจ้งได้เลยครับ' }] },
            ...session.messages
        ];

        const response = await gemini.generateContent({
            contents: contents,
            label: 'AI Chat'
        });

        let aiReply = response.text || 'ขออภัยครับ ผมยังตอบคำถามนี้ไม่ได้ในตอนนี้ ลองถามใหม่อีกครั้งนะครับ';

        // Extract product slugs from [PRODUCT:slug] tags
        const productTagRegex = /\[PRODUCT:([^\]]+)\]/g;
        const recommendedSlugs = [];
        let match;
        while ((match = productTagRegex.exec(aiReply)) !== null) {
            recommendedSlugs.push(match[1].trim());
        }

        // Remove [PRODUCT:xxx] tags from the display text
        const cleanReply = aiReply.replace(/\s*\[PRODUCT:[^\]]+\]/g, '').trim();

        // Build product cards data from slugs
        const recommendedProducts = [];
        for (const slug of recommendedSlugs) {
            const p = productMap.get(slug);
            if (p) {
                recommendedProducts.push({
                    name: p.name,
                    slug: p.slug,
                    price: p.price ? Number(p.price) : null,
                    originalPrice: p.original_price ? Number(p.original_price) : null,
                    image: p.image_url || '',
                    category: p.category || '',
                    sku: p.sku || ''
                });
            }
        }

        // Add AI response to history (keep original with tags for context)
        session.messages.push({ role: 'model', parts: [{ text: aiReply }] });

        // Track AI interaction
        if (sessionId) {
            try {
                await db.execute(
                    'INSERT INTO customer_behavior (session_id, event_type, event_data) VALUES (?, ?, ?)',
                    [sessionId, 'ai_chat', JSON.stringify({ user_message: message, ai_response: cleanReply, recommended: recommendedSlugs })]
                );
            } catch (trackErr) {
                console.error('Failed to track AI chat:', trackErr);
            }
        }

        res.status(200).json({
            success: true,
            reply: cleanReply,
            products: recommendedProducts
        });

    } catch (error) {
        console.error('AI Chat error:', error);
        res.status(200).json({
            success: true,
            reply: 'ขออภัยครับ ตอนนี้ระบบ AI มีปัญหาขัดข้องชั่วคราว รบกวนลองใหม่อีกครั้ง หรือติดต่อทีมงานโดยตรงนะครับ 🙏',
            products: []
        });
    }
});

module.exports = router;
