const cron = require('node-cron');
const db = require('../config/database');
const gemini = require('./geminiService');

let currentTask = null;

// Helper function to safely parse AI JSON responses
function parseAiJson(rawText) {
    if (!rawText) return null;
    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (e1) {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e2) {
                const sanitized = jsonMatch[0].replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
                    return match.replace(/[\r\n]+/g, '\\n').replace(/\t/g, '\\t');
                });
                try {
                    return JSON.parse(sanitized);
                } catch (e3) { }
            }
        }
        return null;
    }
}

/**
 * Auto-generate an article from a product using AI
 */
const processArticleGeneration = async (isTest = false) => {
    try {
        console.log('[Article Cron] Starting process...');

        // 1. Get config
        const [settings] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'article_automation_config'");
        let config = { enabled: false, time: '08:00', style: 'educational', product_ids: [], last_sent_index: -1, last_generated_date: null };
        if (settings && settings.length > 0) {
            try { config = { ...config, ...JSON.parse(settings[0].setting_value) }; } catch (e) {}
        }

        if (!config.enabled && !isTest) return { success: false, error: 'ระบบ AI Auto-Pilot ปิดใช้งานอยู่' };

        // 2. Fetch all active products
        const [allActiveProducts] = await db.query('SELECT * FROM products WHERE is_active = 1');
        if (allActiveProducts.length === 0) return { success: false, error: 'ไม่พบรายการสินค้าที่เปิดใช้งานในระบบ' };

        // Match config.product_ids with actual active products
        let eligibleProducts = [];
        if (Array.isArray(config.product_ids) && config.product_ids.length > 0) {
            eligibleProducts = allActiveProducts.filter(p => config.product_ids.includes(p.id));
        }
        // If none of the selected IDs exist in active products, use all active products
        if (eligibleProducts.length === 0) {
            eligibleProducts = allActiveProducts;
        }

        // 3. Pick next product (round-robin)
        let nextIndex = (config.last_sent_index !== undefined ? config.last_sent_index + 1 : 0) % eligibleProducts.length;
        const product = eligibleProducts[nextIndex];
        console.log(`[Article Cron] Selected product: "${product.name}" (ID: ${product.id})`);

        // 4. Generate article with AI
        const style = config.style || 'educational';
        const stylePrompts = {
            educational: 'เขียนบทความให้ความรู้เชิงลึก อธิบายละเอียด ใช้ภาษาเข้าใจง่าย มีหัวข้อย่อยชัดเจน ความยาว 800-1200 คำ',
            sales: 'เขียนบทความโปรโมตสินค้า เน้นจุดเด่น คุณสมบัติ ความคุ้มค่า มี Call-to-Action กระตุ้นการตัดสินใจ ความยาว 600-800 คำ',
            howto: 'เขียนบทความแนว How-to / Tips เป็นขั้นตอน มี checklist มีเคล็ดลับ ใช้ numbered list ความยาว 800-1000 คำ',
            review: 'เขียนในสไตล์รีวิวประสบการณ์ใช้งานจริง บอกข้อดี-ข้อจำกัด ให้คะแนน ความยาว 600-800 คำ'
        };

        let attrText = '';
        try { const attrs = JSON.parse(product.attributes || '[]'); attrText = attrs.map(a => `${a.key}: ${a.value}`).join(', '); } catch (e) {}

        let storeName = 'KODERA Wire Processing Machines';
        let companyLegalName = 'บริษัท แคส-ซีอาร์ จำกัด';
        try {
            const [sRows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'contact_company_name', 'company_legal_name')");
            const sMap = {};
            sRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            storeName = sMap['store_name'] || sMap['contact_company_name'] || 'KODERA Wire Processing Machines';
            companyLegalName = sMap['company_legal_name'] || sMap['contact_company_name'] || 'บริษัท แคส-ซีอาร์ จำกัด';
        } catch (e) {}

        const prompt = `คุณเป็นนักเขียนบทความวิศวกรรมอุตสาหการและผู้เชี่ยวชาญด้าน SEO/GEO (Generative Engine Optimization) สำหรับ ${storeName} (ดำเนินการโดย ${companyLegalName}) ผู้นำเข้าและจัดจำหน่ายเครื่องตัดปอกสายไฟอัตโนมัติ (Automatic Wire Stripping & Crimping Machine), เครื่องย้ำหัวสายไฟ, เครื่องเข้าหัวเทอร์มินอล แบรนด์ KODERA (CASTING) คุณภาพมาตรฐานญี่ปุ่นชั้นนำในประเทศไทย

สไตล์การเขียน: ${stylePrompts[style] || stylePrompts.educational}

ข้อมูลสินค้าอ้างอิง:
- ชื่อรุ่น/สินค้า: ${product.name}
- หมวดหมู่: ${product.category || 'เครื่องตัดปอกสายไฟอัตโนมัติ'}
- ราคา: ${product.price ? Number(product.price).toLocaleString() + ' บาท' : 'ติดต่อสอบถามราคาพิเศษ'}
- คำอธิบาย: ${product.short_description || product.description?.substring(0, 500) || '-'}
- คุณสมบัติ/สเปกทางเทคนิค: ${attrText || '-'}
- ข้อมูลเพิ่มเติม: ${product.llm_context || '-'}

กฎการเขียนบทความสำหรับการค้นหาด้วย AI (GEO Rules):
1. ใช้ภาษาเชิงเทคนิคที่แม่นยำ น่าเชื่อถือ เข้าใจง่าย เน้นข้อมูลที่เป็นประโยชน์ต่อโรงงานอุตสาหกรรม การประกอบสายไฟรถยนต์ (Automotive Wire Harness), เครื่องใช้ไฟฟ้า และแผงวงจรควบคุม
2. ใส่ข้อมูลเชิงตัวเลขและข้อมูลจำเพาะ เช่น ขนาดสายไฟที่รองรับ (sq mm / AWG), ความยาวตัด, ความยาวปอกหัว-ท้าย, ความเร็วรอบการผลิต, ความแม่นยำของใบมีดทังสเตนคาร์ไบด์
3. จัดระเบียบเนื้อหาให้มีโครงสร้างชัดเจน: ใช้ <h2> และ <h3> ในการแบ่งหัวข้อ, ใช้ <ul> และ <li> สำหรับข้อดี/จุดเด่น และสร้างตารางสรุปข้อมูลจำเพาะทางเทคนิคโดยใช้แท็ก <table> ในเนื้อหาอย่างน้อย 1 ตาราง
4. สร้างความเชื่อมโยงของชื่อสินค้า แบรนด์ KODERA และ ${storeName} (${companyLegalName}) ในฐานะศูนย์รวมเครื่องจักรและอะไหล่แท้ พร้อมทีมวิศวกรผู้เชี่ยวชาญดูแลติดตั้งและบริการหลังการขายทั่วประเทศไทย

กรุณาตอบเป็น JSON เท่านั้น ไม่ต้องมี markdown code block:
{
  "title": "หัวข้อบทความ (SEO & GEO friendly ดึงดูดและเน้นชื่อรุ่นสินค้า)",
  "excerpt": "สรุปเนื้อหา 2-3 บรรทัด สำหรับบทนำ",
  "content": "เนื้อหา HTML เต็มรูปแบบ ใช้ <p>, <h2>, <h3>, <ul><li>, <table> อย่างสวยงาม",
  "seo_title": "SEO Title (ยาวไม่เกิน 60 ตัวอักษร)",
  "seo_description": "SEO Meta Description (ยาวไม่เกิน 160 ตัวอักษร)",
  "seo_keywords": "เครื่องตัดปอกสายไฟ,KODERA,ตัดปอกสายไฟอัตโนมัติ,wire harness,ย้ำเทอร์มินอล",
  "tags": "เครื่องตัดปอกสายไฟ,KODERA,Wire Harness,เครื่องจักรโรงงาน",
  "category": "เทคโนโลยี & นวัตกรรม",
  "llm_context": "ข้อความสรุปบริบทเชิงลึก 3-4 ประโยคสำหรับ AI/LLM เกี่ยวกับสเปกเครื่องรุ่นนี้ การใช้งานในโรงงาน และการจัดจำหน่ายโดย ${companyLegalName}",
  "faq": [
    { "question": "เครื่องรุ่นนี้เหมาะกับสายไฟประเภทใดบ้าง?", "answer": "..." },
    { "question": "ความแม่นยำในการตัดและปอกสายไฟอยู่ที่เท่าไหร่?", "answer": "..." },
    { "question": "มีบริการทดสอบชิ้นงานสายไฟ (Sample Test) ก่อนสั่งซื้อหรือไม่?", "answer": "..." }
  ]
}`;

        let articleData;
        try {
            const response = await gemini.generateContent({
                prompt: prompt,
                label: 'Auto Article Generate'
            });
            articleData = parseAiJson(response.text);
            if (!articleData || !articleData.title || !articleData.content) {
                throw new Error('ไม่สามารถแยกโครงสร้าง JSON จากการตอบกลับของ AI ได้');
            }
        } catch (err) {
            console.error('[Article Cron] AI generation failed:', err.message);
            return { success: false, error: 'AI generation failed: ' + err.message };
        }

        // 5. Set cover image from product directly
        const coverImageUrl = product.image_url || '';

        // 6. Generate slug
        const slug = (articleData.title || product.name)
            .toLowerCase().replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 200);
        let finalSlug = slug;
        let counter = 1;
        while (true) {
            const [existing] = await db.query('SELECT id FROM articles WHERE slug = ?', [finalSlug]);
            if (existing.length === 0) break;
            finalSlug = `${slug}-${counter++}`;
        }

        // 7. Save article to DB (auto-publish)
        let tagsValue = articleData.tags || '';
        if (Array.isArray(tagsValue)) tagsValue = tagsValue.join(',');
        tagsValue = String(tagsValue).replace(/^\[|\]$/g, '').replace(/"/g, '');

        let faqJson = '[]';
        try {
            if (Array.isArray(articleData.faq) && articleData.faq.length > 0) {
                faqJson = JSON.stringify(articleData.faq);
            }
        } catch (e) {}

        const [result] = await db.query(`
            INSERT INTO articles (title, slug, excerpt, content, cover_image, category, tags, seo_title, seo_description, seo_keywords, llm_context, faq, is_published, is_featured, author, product_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'AI Auto', ?)
        `, [
            articleData.title || product.name,
            finalSlug,
            articleData.excerpt || '',
            articleData.content || '',
            coverImageUrl,
            articleData.category || 'ทั่วไป',
            tagsValue,
            articleData.seo_title || articleData.title || '',
            articleData.seo_description || articleData.excerpt || '',
            articleData.seo_keywords || '',
            articleData.llm_context || '',
            faqJson,
            product.id
        ]);

        console.log(`[Article Cron] Article saved: ID=${result.insertId}, slug=${finalSlug}`);

        // 8. Update config index
        if (!isTest) {
            config.last_sent_index = nextIndex;
            config.last_generated_date = new Date().toISOString().slice(0, 10);
            await db.query("UPDATE settings SET setting_value = ? WHERE setting_key = 'article_automation_config'", [JSON.stringify(config)]);
        }

        return { 
            success: true, 
            articleId: result.insertId, 
            slug: finalSlug, 
            product: product.name, 
            title: articleData.title 
        };

    } catch (error) {
        console.error('[Article Cron] Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Initialize the article auto-generation cron
 */
const initArticleCron = async () => {
    if (currentTask) { currentTask.stop(); currentTask = null; }

    try {
        const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'article_automation_config'");
        if (!rows || rows.length === 0) return;

        const config = JSON.parse(rows[0].setting_value);
        if (!config.enabled || !config.time) return;

        const [hour, minute] = config.time.split(':');
        const cronStr = `${minute} ${hour} * * *`;

        console.log(`[Article Cron] Scheduled daily at ${config.time} (Cron: ${cronStr})`);

        currentTask = cron.schedule(cronStr, () => {
            processArticleGeneration(false);
        }, { scheduled: true, timezone: "Asia/Bangkok" });

    } catch (e) {
        console.error('[Article Cron] Init failed:', e.message);
    }
};

module.exports = { initArticleCron, processArticleGeneration };
