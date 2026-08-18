const express = require('express');
const router = express.Router();
const db = require('../config/database');
const gemini = require('../services/geminiService');
const { verifyAdmin } = require('./auth');

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

function handleGeminiError(error, defaultMsg) {
    const msg = (error.message || error.toString() || '');
    if (error.status === 401 || msg.includes('UNAUTHENTICATED') || msg.includes('authentication credentials') || msg.includes('API Key')) {
        return 'Gemini API Key ไม่ถูกต้อง หรือยังไม่ได้ตั้งค่า กรุณาตรวจสอบหรืออัปเดต API Key ในหน้าตั้งค่าระบบ (/admin/settings)';
    }
    if (error.status === 429 || msg.includes('QUOTA') || msg.includes('quota') || msg.includes('rate limit')) {
        return 'Gemini API Key ถูกใช้งานเกินโควต้าชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง';
    }
    return defaultMsg + ': ' + msg;
}

// Auto-create articles table
const initTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS articles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                slug VARCHAR(500) UNIQUE,
                excerpt TEXT,
                content LONGTEXT,
                cover_image VARCHAR(1000),
                category VARCHAR(200) DEFAULT 'ทั่วไป',
                tags TEXT,
                seo_title VARCHAR(500),
                seo_description TEXT,
                seo_keywords TEXT,
                faq JSON,
                llm_context TEXT,
                is_published TINYINT(1) DEFAULT 0,
                is_featured TINYINT(1) DEFAULT 0,
                view_count INT DEFAULT 0,
                author VARCHAR(200) DEFAULT 'Admin',
                product_id VARCHAR(36) DEFAULT NULL,
                gallery_images TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('articles table ready');
    } catch (error) {
        console.error('Error creating articles table:', error);
    }

    // Ensure columns exist (if table existed before changes)
    try {
        await db.query(`ALTER TABLE articles ADD COLUMN seo_keywords TEXT AFTER seo_description`);
    } catch (e) { /* Column likely exists */ }

    try {
        await db.query(`ALTER TABLE articles ADD COLUMN faq JSON`);
    } catch (e) { /* Column likely exists */ }

    try {
        await db.query(`ALTER TABLE articles ADD COLUMN llm_context TEXT`);
    } catch (e) { /* Column likely exists */ }

    try {
        await db.query(`ALTER TABLE articles ADD COLUMN published_at DATETIME NULL AFTER is_published`);
    } catch (e) { /* Column likely exists */ }
};
initTable();

// Helper: Generate slug from title
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '') // keep Thai, English, numbers
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 200);
};

// GET all articles (Admin - includes drafts, scheduled, with pagination)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || ''; // 'published', 'scheduled', 'draft', or ''

        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (title LIKE ? OR category LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status === 'published') {
            whereClause += ' AND is_published = 1 AND (published_at IS NULL OR published_at <= NOW())';
        } else if (status === 'scheduled') {
            whereClause += ' AND (published_at IS NOT NULL AND published_at > NOW())';
        } else if (status === 'draft') {
            whereClause += ' AND is_published = 0 AND (published_at IS NULL OR published_at <= NOW())';
        }

        const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM articles WHERE ${whereClause}`, params);

        const [rows] = await db.query(
            `SELECT * FROM articles WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const articles = rows.map(row => ({
            ...row,
            gallery_images: typeof row.gallery_images === 'string' ? JSON.parse(row.gallery_images || '[]') : (row.gallery_images || [])
        }));

        res.json({
            success: true,
            data: articles,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Fetch articles error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch articles' });
    }
});

// GET published articles (Public)
router.get('/published', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        const category = req.query.category;
        const search = req.query.search || '';

        let whereClause = 'WHERE is_published = 1 AND (published_at IS NULL OR published_at <= NOW())';
        const params = [];

        if (category && category !== 'all') {
            whereClause += ' AND category = ?';
            params.push(category);
        }

        if (search) {
            whereClause += ' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        const [countResult] = await db.query(`SELECT COUNT(*) as total FROM articles ${whereClause}`, params);
        const total = countResult[0].total;

        const [rows] = await db.query(
            `SELECT id, title, slug, excerpt, cover_image, category, tags, author, view_count, is_featured, product_id, gallery_images, published_at, created_at 
             FROM articles ${whereClause} ORDER BY is_featured DESC, COALESCE(published_at, created_at) DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const articles = rows.map(row => ({
            ...row,
            gallery_images: typeof row.gallery_images === 'string' ? JSON.parse(row.gallery_images || '[]') : (row.gallery_images || [])
        }));

        res.json({
            success: true,
            data: articles,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Fetch published articles error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch articles' });
    }
});

// GET article categories (Public)
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT category, COUNT(*) as count FROM articles WHERE is_published = 1 AND (published_at IS NULL OR published_at <= NOW()) GROUP BY category ORDER BY count DESC`
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
});

// GET single article by slug or id (Public)
router.get('/:slugOrId', async (req, res) => {
    try {
        const param = req.params.slugOrId;
        let query, queryParams;

        if (isNaN(param)) {
            query = 'SELECT * FROM articles WHERE slug = ?';
            queryParams = [param];
        } else {
            query = 'SELECT * FROM articles WHERE id = ?';
            queryParams = [parseInt(param)];
        }

        const [rows] = await db.query(query, queryParams);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Article not found' });
        }

        // Increment view count (non-blocking)
        db.query('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [rows[0].id]).catch(() => { });

        const article = {
            ...rows[0],
            gallery_images: typeof rows[0].gallery_images === 'string' ? JSON.parse(rows[0].gallery_images || '[]') : (rows[0].gallery_images || [])
        };

        if (article.product_id) {
            const [prodRows] = await db.query('SELECT * FROM products WHERE id = ? LIMIT 1', [article.product_id]);
            if (prodRows.length > 0) {
                const product = prodRows[0];
                if (product.images && typeof product.images === 'string') {
                    product.images = JSON.parse(product.images);
                } else {
                    product.images = [];
                }
                article.product = product;
            }
        }

        res.json({ success: true, data: article });
    } catch (error) {
        console.error('Fetch article error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch article' });
    }
});

// POST create article (Admin)
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const {
            title, excerpt, content, cover_image, category, tags,
            seo_title, seo_description, seo_keywords, faq, llm_context, is_published, published_at, is_featured, author, product_id,
            gallery_images, image_prompt
        } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        let slug = generateSlug(title);
        // Check if slug exists, if so, append a number
        let finalSlug = slug;
        let counter = 1;
        while (true) {
            const [existing] = await db.query('SELECT id FROM articles WHERE slug = ?', [finalSlug]);
            if (existing.length === 0) break;
            finalSlug = `${slug}-${counter}`;
            counter++;
        }

        const insertQuery = `
            INSERT INTO articles
            (title, slug, excerpt, content, cover_image, category, tags, seo_title, seo_description, seo_keywords, faq, llm_context, is_published, published_at, is_featured, author, product_id, gallery_images, image_prompt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const galleryJson = Array.isArray(gallery_images) ? JSON.stringify(gallery_images) : '[]';
        const faqJson = Array.isArray(faq) ? JSON.stringify(faq) : '[]';
        let tagsJson = tags;
        if (typeof tags === 'string') {
            tagsJson = JSON.stringify(tags.split(',').map(t => t.trim()).filter(t => t));
        } else if (Array.isArray(tags)) {
            tagsJson = JSON.stringify(tags);
        } else {
            tagsJson = '[]'; // Default to empty array JSON
        }

        const publishedAtVal = published_at ? new Date(published_at) : null;

        const [result] = await db.query(insertQuery, [
            title, finalSlug,
            excerpt || '',
            content || '',
            cover_image || '',
            category || 'ทั่วไป',
            tagsJson,
            seo_title || title,
            seo_description || excerpt || '',
            seo_keywords || '',
            faqJson,
            llm_context || '',
            is_published ? 1 : 0,
            publishedAtVal,
            is_featured ? 1 : 0,
            author || 'Admin',
            product_id || null,
            galleryJson,
            image_prompt || null
        ]);

        res.status(201).json({ success: true, message: 'Article created', id: result.insertId, slug: finalSlug });
    } catch (error) {
        console.error('Create article error:', error);
        res.status(500).json({ success: false, error: 'Failed to create article' });
    }
});

// PUT update article (Admin)
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const {
            title, slug: customSlug, excerpt, content, cover_image, category, tags,
            seo_title, seo_description, seo_keywords, faq, llm_context, is_published, published_at, is_featured, author, product_id,
            gallery_images, image_prompt
        } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        let slug = customSlug || generateSlug(title);
        const tagsJson = typeof tags === 'string' ? tags : JSON.stringify(tags || []);
        const galleryJson = typeof gallery_images === 'string' ? gallery_images : JSON.stringify(gallery_images || []);
        const faqJson = typeof faq === 'string' ? faq : JSON.stringify(faq || []);
        const publishedAtVal = published_at ? new Date(published_at) : null;

        const [result] = await db.query(
            `UPDATE articles SET title=?, slug=?, excerpt=?, content=?, cover_image=?, category=?, tags=?, seo_title=?, seo_description=?, seo_keywords=?, faq=?, llm_context=?, is_published=?, published_at=?, is_featured=?, author=?, product_id=?, gallery_images=?, image_prompt=?
             WHERE id=?`,
            [
                title, slug,
                excerpt || '',
                content || '',
                cover_image || '',
                category || 'ทั่วไป',
                tagsJson,
                seo_title || title,
                seo_description || excerpt || '',
                seo_keywords || '',
                faqJson,
                llm_context || '',
                is_published ? 1 : 0,
                publishedAtVal,
                is_featured ? 1 : 0,
                author || 'Admin',
                product_id || null,
                galleryJson,
                image_prompt || null,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Article not found' });
        }

        res.json({ success: true, message: 'Article updated' });
    } catch (error) {
        console.error('Update article error:', error);
        res.status(500).json({ success: false, error: 'Failed to update article' });
    }
});

// DELETE article (Admin)
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Article not found' });
        }
        res.json({ success: true, message: 'Article deleted' });
    } catch (error) {
        console.error('Delete article error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete article' });
    }
});

// POST generate article with AI (Admin)
router.post('/generate', verifyAdmin, async (req, res) => {
    try {
        const { productId, style, additionalPrompt } = req.body;

        if (!style) {
            return res.status(400).json({ success: false, error: 'Style is required' });
        }

        // Fetch product data if selected
        let productInfo = '';
        let productCategory = 'ทั่วไป';
        if (productId) {
            const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
            if (products.length > 0) {
                const p = products[0];
                productCategory = p.category || 'ทั่วไป';
                productInfo = `
ข้อมูลสินค้าอ้างอิง:
- ชื่อ: ${p.name}
- SKU: ${p.sku || '-'}
- หมวดหมู่: ${p.category || '-'}
- ราคา: ${p.price ? Number(p.price).toLocaleString() + ' บาท' : 'สอบถาม'}
- ราคาเดิม: ${p.original_price ? Number(p.original_price).toLocaleString() + ' บาท' : '-'}
- ขนาด: ${p.size || '-'}
- รายละเอียดสั้น: ${p.short_description || '-'}
- รายละเอียดเพิ่มเติม: ${p.llm_context || p.description || '-'}
- Badges: ${[p.badge_free_shipping && 'ส่งฟรี', p.badge_warranty && 'รับประกัน', p.badge_installation && 'ติดตั้ง', p.badge_new && 'ใหม่', p.badge_bestseller && 'ขายดี'].filter(Boolean).join(', ') || '-'}
- FAQ: ${p.faq ? JSON.stringify(p.faq) : '-'}
`.trim();
            }
        }

        // Style-specific prompts
        const stylePrompts = {
            educational: {
                name: 'ให้ความรู้เชิงลึก (Deep Dive)',
                prompt: `เขียนบทความให้ความรู้แบบเป็นทางการ น่าเชื่อถือ อธิบายหลักการ เหตุผล และวิธีพิจารณาเลือกซื้ออย่างเป็นกลาง ให้ข้อมูลจริง ไม่โอ้อวด ใช้ภาษาสุภาพ ความยาว 800-1200 คำ`
            },
            sales: {
                name: 'แนะนำและเจาะลึกความคุ้มค่า (Value Proposition)',
                prompt: `เขียนบทความแนะนำความคุ้มค่าและจุดเด่นของสินค้า วิเคราะห์ฟังก์ชันการใช้งานและการแก้ไขปัญหาให้ลูกค้า มี Call-to-Action ชัดเจน หลีกเลี่ยงคำอวยเกินจริง ความยาว 600-800 คำ`
            },
            howto: {
                name: 'คู่มือและวิธีการ (How-To & Tips)',
                prompt: `เขียนบทความแนวแนะนำขั้นตอนการใช้งาน การประกอบ หรือการดูแลรักษาอย่างถูกวิธี มี Checklist และข้อควรระวัง ใช้โครงสร้างอ่านง่าย ความยาว 800-1000 คำ`
            },
            comparison: {
                name: 'วิเคราะห์เปรียบเทียบอย่างเป็นกลาง (Comparison)',
                prompt: `เขียนบทความเปรียบเทียบตัวเลือก/วัสดุ/ขนาด อย่างเป็นกลาง มีตารางเปรียบเทียบ ข้อดี-ข้อพิจารณา ช่วยให้ผู้อ่านตัดสินใจได้ถูกต้อง ความยาว 800-1000 คำ`
            },
            review: {
                name: 'การใช้งานจริงและกรณีศึกษา (Practical Review)',
                prompt: `เขียนในรูปแบบกรณีศึกษาหรือประสบการณ์ใช้งานจริง นำเสนอภาพรวมการใช้งานในสภาพแวดล้อมจริง ข้อดีและข้อจำกัด ความยาว 600-800 คำ`
            }
        };

        const selectedStyle = stylePrompts[style] || stylePrompts.educational;

        let storeName = 'STORAGE HOUSE';
        let companyLegalName = 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        try {
            const [sRows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'contact_company_name', 'company_legal_name')");
            const sMap = {};
            sRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            storeName = sMap['store_name'] || sMap['contact_company_name'] || 'STORAGE HOUSE';
            companyLegalName = sMap['company_legal_name'] || sMap['contact_company_name'] || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        } catch (e) {}

        const systemPrompt = `คุณเป็นนักเขียนบทความมืออาชีพและผู้เชี่ยวชาญด้าน SEO / GEO (Generative Engine Optimization) สำหรับ "${storeName}" (ดำเนินการโดย ${companyLegalName}) ผู้จัดจำหน่ายบ้านเก็บของสำเร็จรูป ตู้เก็บของกลางแจ้ง และโกดังสำเร็จรูปชั้นนำในไทย

สไตล์การเขียน: ${selectedStyle.name}
แนวทางการเขียน: ${selectedStyle.prompt}

${productInfo ? productInfo : 'ไม่มีสินค้าเฉพาะเจาะจง ให้เขียนบทความให้ความรู้เกี่ยวกับบ้านเก็บของสำเร็จรูป/ตู้เก็บของกลางแจ้ง/การจัดเก็บพื้นที่'}
${additionalPrompt ? '\nเนื้อหา/ตัวอย่าง/คำแนะนำเพิ่มเติมจากผู้ใช้ (ให้นำข้อมูลและตัวอย่างนี้ไปวิเคราะห์ เรียบเรียง และสังเคราะห์เข้าในบทความอย่างเป็นธรรมชาติ):\n' + additionalPrompt : ''}

กฎเหล็กในการเขียน (Professional & SEO/GEO Rules):
1. [โทนเสียงระดับมืออาชีพ]: ให้ข้อมูลที่เป็นจริง น่าเชื่อถือ อ้างอิงตัวเลขหรือสเปกวัสดุ (เช่น เหล็กกัลวาไนซ์, เมทัลชีท, การทนแดดทนฝน, การรับประกัน) ห้ามใช้คำโฆษณาเกินจริง (เช่น "ดีที่สุดในจักรวาล", "ปฏิวัติวงการอย่างที่ไม่เคยมีมาก่อน")
2. [โครงสร้างบทความสวยงาม]:
   - ใช้แท็ก <h2> สำหรับหัวข้อหลัก และ <h3> สำหรับหัวข้อย่อย
   - ใช้แท็ก <p> หุ้มย่อหน้าอย่างสวยงาม หลีกเลี่ยงข้อความยาวเป็นตับ
   - ใช้แท็ก <ul> และ <li> สำหรับรายการคุณสมบัติหรือข้อดี
   - บังคับใส่แท็ก <table><tr><th>...</th></tr><tr><td>...</td></tr></table> อย่างน้อย 1 ตาราง สำหรับสรุปตารางสเปก ตัวเลข หรือข้อเปรียบเทียบ ให้สวยงามอ่านง่าย
3. [SEO & GEO Optimization]:
   - ใส่ Keyword สำคัญ (เช่น บ้านเก็บของสำเร็จรูป, ตู้เก็บของกลางแจ้ง, ${storeName}) อย่างเป็นธรรมชาติ
   - เชื่อมโยงแบรนด์ ${storeName} และ ${companyLegalName} กับบริการจัดส่งและติดตั้งทั่วประเทศ

กรุณาตอบเป็น JSON format เท่านั้น ห้ามมี markdown code block ห่อหุ้ม:
{
  "title": "หัวข้อบทความ (SEO friendly น่าสนใจ และตรงประเด็น)",
  "excerpt": "สรุปเนื้อหาสั้นๆ 2-3 บรรทัด สำหรับเกริ่นนำ",
  "content": "เนื้อหาบทความเต็มรูปแบบ HTML string ห้ามใช้ \\n ให้ใช้แท็ก <p>, <h2>, <h3>, <ul><li>, <table> เท่านั้น",
  "seo_title": "SEO Title (ยาวไม่เกิน 60 ตัวอักษร)",
  "seo_description": "SEO Meta Description (ยาวไม่เกิน 160 ตัวอักษร)",
  "seo_keywords": "keyword1,keyword2,keyword3,keyword4",
  "tags": "tag1,tag2,tag3,tag4,tag5",
  "category": "หมวดหมู่ที่เหมาะสม (เลือกจาก: ทั่วไป, บ้านเก็บของ, เคล็ดลับ, การดูแลรักษา, ข่าวสาร, โปรโมชั่น)",
  "llm_context": "บริบทเชิงลึก 2-3 ประโยค สรุปคุณสมบัติ สเปกวัสดุ แบรนด์ ${storeName} และบริการ สำหรับ AI Scraper (ChatGPT/Perplexity) อ่านโดยเฉพาะ",
  "image_prompt": "An exquisite Midjourney v6 / DALL-E 3 English prompt for editorial magazine cover photo matching the article topic, specifying lighting, composition, Architectural Digest photography style, 8k, photorealistic, no text --ar 16:9",
  "faq": [
    { "question": "คำถามที่พบบ่อย 1", "answer": "คำตอบที่ระบุข้อเท็จจริงชัดเจน 1" },
    { "question": "คำถามที่พบบ่อย 2", "answer": "คำตอบที่ระบุข้อเท็จจริงชัดเจน 2" }
  ]
}`;

        const response = await gemini.generateContent({
            prompt: systemPrompt,
            label: 'Article Generate'
        });

        const articleData = parseAiJson(response.text);
        if (!articleData) {
            console.error('AI JSON parse error. Raw:', (response.text || '').substring(0, 300));
            return res.status(500).json({ success: false, error: 'AI สร้างข้อมูลไม่สมบูรณ์ กรุณาลองใหม่อีกครั้ง' });
        }

        res.json({
            success: true,
            data: {
                title: articleData.title || '',
                excerpt: articleData.excerpt || '',
                content: articleData.content || '',
                seo_title: articleData.seo_title || '',
                seo_description: articleData.seo_description || '',
                seo_keywords: articleData.seo_keywords || '',
                tags: articleData.tags || '',
                category: articleData.category || productCategory,
                llm_context: articleData.llm_context || '',
                image_prompt: articleData.image_prompt || '',
                faq: Array.isArray(articleData.faq) ? articleData.faq : []
            }
        });
    } catch (error) {
        console.error('Generate article error:', error);
        res.status(500).json({ success: false, error: handleGeminiError(error, 'เกิดข้อผิดพลาดในการสร้างบทความ') });
    }
});

// NOTE: generate-seo endpoint removed — frontend now uses generate-all-seo below

// POST generate ALL SEO and AI fields (Admin)
router.post('/generate-all-seo', verifyAdmin, async (req, res) => {
    try {
        const { title, excerpt, content, tags } = req.body;

        if (!title && !content) {
            return res.status(400).json({ success: false, error: 'ต้องมีหัวข้อหรือเนื้อหาสำหรับวิเคราะห์ข้อมูล' });
        }

        const systemPrompt = `คุณเป็นผู้เชี่ยวชาญด้าน SEO และ AI Data Structuring หน้าที่ของคุณคือสร้างข้อมูล Meta tags และ Context เสริมสำหรับบทความนี้ให้ครอบคลุมที่สุด

ข้อมูลบทความที่จะวิเคราะห์:
หัวข้อ: ${title || '-'}
เนื้อหาสรุปย่อ: ${excerpt || '-'}
เนื้อหาเต็ม (บางส่วน): ${(content || '').substring(0, 2000)}
Tags ปัจจุบัน: ${tags || '-'}

คำสั่ง:
ให้สร้าง JSON กลับมาดังนี้ (ต้องเป็นรูปแบบ JSON ที่ถูกต้องเท่านั้น ห้ามมี syntax error):
{
  "seo_title": "หัวข้อสำหรับ SEO ควรกระชับ น่าสนใจ (ไม่เกิน 60 ตัวอักษร)",
  "seo_description": "คำบรรยายสำหรับ SEO สรุปเนื้อหา มี Keywords ธรรมชาติ (ไม่เกิน 160 ตัวอักษร)",
  "seo_keywords": "keyword1, keyword2, keyword3 (คั่นด้วย comma)",
  "llm_context": "ข้อความอธิบายบริบทสั้นๆ (2-3 ประโยค) เพื่อบอกให้ AI (เช่น ChatGPT) รู้ว่าหน้านี้เกี่ยวข้องกับอะไร ควรดึงข้อมูลส่วนไหนไปตอบคำถามผู้ใช้",
  "faq": [
    {
      "question": "คำถามที่ 1 ที่คนมักสงสัยจากเนื้อหานี้",
      "answer": "คำตอบที่กระชับ ตรงประเด็น"
    },
    {
      "question": "คำถามที่ 2...",
      "answer": "คำตอบ..."
    }
  ]
}`;

        const response = await gemini.generateContent({
            prompt: systemPrompt,
            label: 'Article All-SEO Generate'
        });

        const generatedData = parseAiJson(response.text);
        if (!generatedData) {
            console.error('AI JSON parse error. Raw:', (response.text || '').substring(0, 300));
            return res.status(500).json({ success: false, error: 'AI สร้างข้อมูลไม่สมบูรณ์ กรุณาลองใหม่อีกครั้ง' });
        }

        res.json({
            success: true,
            data: {
                seo_title: generatedData.seo_title || title || '',
                seo_description: generatedData.seo_description || excerpt || '',
                seo_keywords: generatedData.seo_keywords || tags || '',
                llm_context: generatedData.llm_context || '',
                faq: Array.isArray(generatedData.faq) ? generatedData.faq : []
            }
        });
    } catch (error) {
        console.error('Generate All SEO error:', error);
        res.status(500).json({ success: false, error: handleGeminiError(error, 'เกิดข้อผิดพลาดในการสร้างข้อมูล') });
    }
});

// POST generate Cover Image Prompt with AI (Admin)
router.post('/generate-prompt', verifyAdmin, async (req, res) => {
    try {
        const { title, prompt: userPrompt } = req.body;

        if (!title && !userPrompt) {
            return res.status(400).json({ success: false, error: 'ต้องมีหัวข้อหรือข้อมูลสำหรับสร้าง Prompt' });
        }

        const systemPrompt = `คุณเป็นพรอทพ์เอ็นจิเนียร์ (AI Prompt Engineer) ระดับมืออาชีพสำหรับการวาดรูปปกบทความนิตยสาร/เว็บไซต์ไฮเอนด์ (Editorial Magazine Cover Photography)
หน้าที่ของคุณคือแปลงหัวข้อบทความต่อไปนี้ ให้เป็นคำสั่งภาษาอังกฤษ (Midjourney v6 / DALL-E 3 Prompt) สำหรับสร้างรูปภาพหน้าปกบทความที่สวยงาม สมจริง ตรงกับเนื้อหา และน่าดึงดูด

หัวข้อบทความ / บริบท: "${title || userPrompt}"

กฎในการเขียน Image Prompt:
1. [สไตล์และแนวภาพ]: เป็นภาพถ่ายสถาปัตยกรรม/อินทีเรียร์/ไลฟ์สไตล์ระดับมืออาชีพ (Professional Architectural & Editorial Photography) 
2. [องค์ประกอบแสงและมุมมอง]: ระบุแสงธรรมชาติที่สวยงาม (เช่น Golden hour, warm diffused daylight, cinematic lighting), มุมกล้องระดับสายตา หรือ 45-degree angle shot ที่ดูสะอาดตา หรูหรา
3. [รายละเอียดฉาก]: อธิบายสภาพแวดล้อมที่สอดคล้องกับเนื้อหา เช่น บ้านเก็บของสำเร็จรูปในสวนสีเขียวชอุ่ม, การจัดระเบียบตู้เก็บของกลางแจ้งอย่างเป็นระเบียบ, หรือเครื่องมือช่างที่จัดวางอย่างพิถีพิถัน
4. [ข้อห้าม]: ห้ามมีตัวหนังสือ ห้ามมีข้อความ ห้ามมีโลโก้ ห้ามมีตัวละครการ์ตูน
5. [พารามิเตอร์]: ลงท้ายด้วยคำว่า "shot on 35mm lens, 8k resolution, photorealistic, architectural digest style, highly detailed, no text, no letters --ar 16:9"

ตอบเฉพาะคำสั่งภาษาอังกฤษบรรทัดเดียว ห้ามใส่เครื่องหมายอัญประกาศ ห้ามมีข้อความเกริ่นนำใดๆ`;
        
        const aiResponse = await gemini.generateContent({
            prompt: systemPrompt,
            responseMimeType: 'text/plain',
            label: 'Article Image Prompt'
        });

        let englishPrompt = aiResponse.text || '';
        englishPrompt = englishPrompt.trim().replace(/^"|"$/g, '').replace(/```\s*/g, '');

        res.json({
            success: true,
            prompt: englishPrompt
        });
    } catch (error) {
        console.error('Generate AI Image Prompt error:', error);
        res.status(500).json({ success: false, error: handleGeminiError(error, 'เกิดข้อผิดพลาดในการสร้าง Image Prompt') });
    }
});

// ═══════════════════════════════════════════════
// Article Auto-Generation Routes (Admin Only)
// ═══════════════════════════════════════════════

router.get('/admin/article-automation', verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'article_automation_config'");
        let config = { enabled: false, time: '08:00', style: 'educational', product_ids: [], last_sent_index: -1, last_generated_date: null };
        if (rows.length > 0) {
            try { config = { ...config, ...JSON.parse(rows[0].setting_value) }; } catch (e) {}
        }

        // Clean out stale non-existent product IDs from config
        const [allProds] = await db.query("SELECT id FROM products WHERE is_active = 1");
        const activeIds = allProds.map(p => p.id);
        if (Array.isArray(config.product_ids)) {
            config.product_ids = config.product_ids.filter(id => activeIds.includes(id));
            if (config.product_ids.length === 0) {
                config.product_ids = activeIds;
            }
        }

        res.json({ success: true, config });
    } catch (error) {
        console.error('Get article automation config error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch config' });
    }
});

router.post('/admin/article-automation', verifyAdmin, async (req, res) => {
    try {
        const { enabled, time, style, product_ids } = req.body;

        const [existing] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'article_automation_config'");
        let current = { enabled: false, time: '08:00', style: 'educational', product_ids: [], last_sent_index: -1, last_generated_date: null };
        if (existing.length > 0) {
            try { current = JSON.parse(existing[0].setting_value); } catch (e) {}
        }

        const updated = {
            enabled: enabled !== undefined ? !!enabled : current.enabled,
            time: time || current.time,
            style: style || current.style,
            product_ids: Array.isArray(product_ids) ? product_ids : current.product_ids,
            last_sent_index: current.last_sent_index,
            last_generated_date: current.last_generated_date
        };

        await db.query(
            "INSERT INTO settings (setting_key, setting_value) VALUES ('article_automation_config', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [JSON.stringify(updated), JSON.stringify(updated)]
        );

        const { initArticleCron } = require('../services/articleCronService');
        await initArticleCron();

        res.json({ success: true, message: 'Config saved' });
    } catch (error) {
        console.error('Save article automation config error:', error);
        res.status(500).json({ success: false, error: 'Failed to save config' });
    }
});

router.post('/admin/article-automation/test', verifyAdmin, async (req, res) => {
    try {
        const { processArticleGeneration } = require('../services/articleCronService');
        const result = await processArticleGeneration(true);
        if (result.success) {
            res.json({ success: true, message: `บทความ "${result.title}" สร้างสำเร็จ`, ...result });
        } else {
            res.status(400).json({ success: false, error: result.error || 'Failed' });
        }
    } catch (error) {
        console.error('Test article generation error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
