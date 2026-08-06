const cron = require('node-cron');
const db = require('../config/database');
const gemini = require('./geminiService');

let currentTask = null;

/**
 * Auto-generate an article from a product using AI
 */
const processArticleGeneration = async (isTest = false) => {
    try {
        console.log('[Article Cron] Starting process...');

        // 1. Get config
        const [settings] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'article_automation_config'");
        if (!settings || settings.length === 0) return { success: false, error: 'No config found' };

        let config = {};
        try { config = JSON.parse(settings[0].setting_value); } catch (e) { return { success: false, error: 'Invalid config' }; }

        if (!config.enabled && !isTest) return { success: false, error: 'Disabled' };

        const productIds = config.product_ids || [];
        if (productIds.length === 0) {
            // Fallback: pick random active product
            const [randProducts] = await db.query('SELECT id FROM products WHERE is_active = 1 ORDER BY RAND() LIMIT 1');
            if (randProducts.length === 0) return { success: false, error: 'No active products' };
            productIds.push(randProducts[0].id);
        }

        // 2. Pick next product (round-robin, no repeat until all used)
        let nextIndex = (config.last_sent_index !== undefined ? config.last_sent_index + 1 : 0) % productIds.length;
        const selectedId = productIds[nextIndex];

        const [products] = await db.query('SELECT * FROM products WHERE id = ? AND is_active = 1', [selectedId]);
        if (products.length === 0) return { success: false, error: 'Product not found or inactive' };

        const product = products[0];
        console.log(`[Article Cron] Selected product: ${product.name}`);

        // 3. Generate article with AI
        const style = config.style || 'educational';
        const stylePrompts = {
            educational: 'เขียนบทความให้ความรู้แบบเชิงลึก อธิบายอย่างละเอียด ใช้ภาษาเข้าใจง่าย มีหัวข้อย่อยชัดเจน ความยาว 800-1200 คำ',
            sales: 'เขียนบทความโปรโมตสินค้า เน้นจุดเด่น คุณสมบัติ ความคุ้มค่า มี Call-to-Action กระตุ้นการตัดสินใจ ความยาว 600-800 คำ',
            howto: 'เขียนบทความแนว How-to / Tips เป็นขั้นตอน มี checklist มีเคล็ดลับ ใช้ numbered list ความยาว 800-1000 คำ',
            review: 'เขียนในสไตล์รีวิวประสบการณ์ใช้งานจริง บอกข้อดี-ข้อจำกัด ให้คะแนน ความยาว 600-800 คำ'
        };

        let attrText = '';
        try { const attrs = JSON.parse(product.attributes || '[]'); attrText = attrs.map(a => `${a.key}: ${a.value}`).join(', '); } catch (e) {}

        let storeName = 'STORAGE HOUSE';
        let companyLegalName = 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        try {
            const [sRows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'contact_company_name', 'company_legal_name')");
            const sMap = {};
            sRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            storeName = sMap['store_name'] || sMap['contact_company_name'] || 'STORAGE HOUSE';
            companyLegalName = sMap['company_legal_name'] || sMap['contact_company_name'] || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        } catch (e) {}

        const prompt = `คุณเป็นนักเขียนบทความมืออาชีพและผู้เชี่ยวชาญด้าน SEO/GEO (Generative Engine Optimization) สำหรับ ${storeName} (ดำเนินการโดย ${companyLegalName}) ผู้จัดจำหน่ายบ้านเก็บของสำเร็จรูป ตู้เก็บของกลางแจ้ง และโกดังสำเร็จรูปคุณภาพพรีเมียมในไทย

สไตล์: ${stylePrompts[style] || stylePrompts.educational}

ข้อมูลสินค้าอ้างอิง:
- ชื่อ: ${product.name}
- หมวดหมู่: ${product.category || '-'}
- ราคา: ${product.price ? Number(product.price).toLocaleString() + ' บาท' : 'สอบถาม'}
- คำอธิบาย: ${product.short_description || product.description?.substring(0, 500) || '-'}
- คุณสมบัติ: ${attrText || '-'}
- ข้อมูลเพิ่มเติม: ${product.llm_context || '-'}

กฎการเขียนบทความสำหรับการค้นหาด้วย AI (GEO Rules):
1. ใช้โทนเสียงที่น่าเชื่อถือ เป็นทางการ และเน้นข้อมูลเชิงเท็จจริงจริง (Objective & Factual) มากกว่าการใช้คำโฆษณาชวนเชื่อทั่วไป หลีกเลี่ยงคำอวยเกินจริง
2. ใส่ข้อมูลเชิงตัวเลขและข้อมูลจำเพาะทางเทคนิค เช่น ความหนาของเหล็ก (เช่น เหล็กกัลวาไนซ์หนา 0.5 มม.), ขนาดที่แท้จริง, น้ำหนัก, ความสูง และการรับประกันโครงสร้าง (เช่น รับประกัน 10 ปี)
3. จัดระเบียบเนื้อหาให้มีโครงสร้างชัดเจน: ใช้ <h2> และ <h3> ในการแบ่งกลุ่มเนื้อหา, ใช้ <ul> และ <li> สำหรับข้อดี/คุณสมบัติเด่น และบังคับให้เขียนสรุปตารางคุณสมบัติจำเพาะทางเทคนิคโดยใช้แท็ก <table> ในเนื้อหาอย่างน้อย 1 ตาราง เพื่อให้บอท AI (เช่น Perplexity, ChatGPT) ดึงไปแสดงเปรียบเทียบได้ง่าย
4. สร้างความเชื่อมโยงของชื่อแบรนด์ "${storeName}" และบริษัทผู้ดูแลคือ "${companyLegalName}" เข้ากับข้อมูลการส่งมอบสินค้าและบริการติดตั้งทั่วประเทศ (โดยเฉพาะกรุงเทพฯ และปริมณฑล)

กรุณาตอบเป็น JSON เท่านั้น ไม่ต้องมี markdown code block:
{
  "title": "หัวข้อบทความ (SEO & GEO friendly น่าดึงดูดและเน้นความต้องการของผู้ใช้งาน)",
  "excerpt": "สรุปเนื้อหาสั้นๆ 2-3 บรรทัด สำหรับใช้แสดงเป็นเกริ่นนำ",
  "content": "เนื้อหา HTML เต็มรูปแบบ ใช้ <p>, <h2>, <h3>, <ul><li>, <table> ห้ามใช้ \\n ให้ใช้แท็ก HTML แบ่งย่อหน้าอย่างสวยงาม",
  "seo_title": "SEO Title (ยาวไม่เกิน 60 ตัวอักษรสำหรับการแสดงผลของ Google)",
  "seo_description": "SEO Meta Description (ยาวไม่เกิน 160 ตัวอักษร สรุปเนื้อหาที่กระชับได้ใจความ)",
  "seo_keywords": "keyword1,keyword2,keyword3,keyword4",
  "tags": "tag1,tag2,tag3,tag4,tag5",
  "category": "หมวดหมู่ (เลือกจาก: ทั่วไป, บ้านเก็บของ, เคล็ดลับ, การดูแลรักษา, ข่าวสาร)",
  "llm_context": "ข้อความอธิบายบริบทเชิงลึกแบบย่อเพื่อวัตถุประสงค์ GEO เขียนสำหรับบอท AI/LLM อ่านโดยเฉพาะ (ความยาว 3-4 ประโยค เน้นสรุปคุณสมบัติทางเทคนิค วัสดุ แบรนด์ ${storeName} และบริการจัดส่งติดตั้งในไทย หลีกเลี่ยงคำบรรยายเชิงโฆษณา)",
  "image_prompt": "English prompt for cover image, photorealistic, under 30 words",
  "faq": [
    { "question": "คำถามเชิงโครงสร้างเสียง/คำถามยาวๆ ที่ลูกค้ามักถาม AI (เช่น บ้านเก็บของ ${storeName} กันสนิมได้นานแค่ไหน?)", "answer": "คำตอบที่ระบุข้อเท็จจริงและสถิติอ้างอิงชัดเจน ตรงประเด็น" },
    { "question": "คำถามที่ 2", "answer": "คำตอบที่ 2" },
    { "question": "คำถามที่ 3", "answer": "คำตอบที่ 3" }
  ]
}`;

        let articleData;
        try {
            const response = await gemini.generateContent({
                prompt: prompt,
                label: 'Auto Article Generate'
            });
            let aiText = (response.text || '').replace(/```json\s*/g, '').replace(/```\s*/g, '').trim().replace(/[\n\r\t]+/g, ' ');
            articleData = JSON.parse(aiText);
        } catch (err) {
            console.error('[Article Cron] AI generation failed:', err.message);
            return { success: false, error: 'AI generation failed: ' + err.message };
        }

        // 4. Set cover image from product directly (AI image generation removed to save cost)
        const coverImageUrl = product.image_url || '';

        // 5. Generate slug
        const slug = (articleData.title || product.name)
            .toLowerCase().replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 200);
        let finalSlug = slug;
        let counter = 1;
        while (true) {
            const [existing] = await db.query('SELECT id FROM articles WHERE slug = ?', [finalSlug]);
            if (existing.length === 0) break;
            finalSlug = `${slug}-${counter++}`;
        }

        // 6. Save article to DB (auto-publish)
        // Tags: ensure proper comma-separated string format
        let tagsValue = articleData.tags || '';
        if (Array.isArray(tagsValue)) tagsValue = tagsValue.join(',');
        // Remove any JSON array brackets if AI returned them
        tagsValue = tagsValue.replace(/^\[|\]$/g, '').replace(/"/g, '');

        // FAQ: ensure proper JSON
        let faqJson = '[]';
        try {
            if (Array.isArray(articleData.faq) && articleData.faq.length > 0) {
                faqJson = JSON.stringify(articleData.faq);
            }
        } catch (e) {}

        const [result] = await db.query(`
            INSERT INTO articles (title, slug, excerpt, content, cover_image, category, tags, seo_title, seo_description, seo_keywords, llm_context, faq, is_published, is_featured, author, product_id, image_prompt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'AI Auto', ?, ?)
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
            product.id,
            articleData.image_prompt || ''
        ]);

        console.log(`[Article Cron] Article saved: ID=${result.insertId}, slug=${finalSlug}`);

        // 7. Update config index
        if (!isTest) {
            config.last_sent_index = nextIndex;
            config.last_generated_date = new Date().toISOString().slice(0, 10);
            await db.query("UPDATE settings SET setting_value = ? WHERE setting_key = 'article_automation_config'", [JSON.stringify(config)]);
        }

        return { success: true, articleId: result.insertId, slug: finalSlug, product: product.name, title: articleData.title };

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
