const express = require('express');
const router = express.Router();
const db = require('../config/database');
const gemini = require('../services/geminiService');
const { verifyAdmin } = require('./auth');

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

// GET all articles (Admin - includes drafts, with pagination)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const status = req.query.status || ''; // 'published', 'draft', or ''

        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (title LIKE ? OR category LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status === 'published') {
            whereClause += ' AND is_published = 1';
        } else if (status === 'draft') {
            whereClause += ' AND is_published = 0';
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

        let whereClause = 'WHERE is_published = 1';
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
            `SELECT id, title, slug, excerpt, cover_image, category, tags, author, view_count, is_featured, product_id, gallery_images, created_at 
             FROM articles ${whereClause} ORDER BY is_featured DESC, created_at DESC LIMIT ? OFFSET ?`,
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
            `SELECT category, COUNT(*) as count FROM articles WHERE is_published = 1 GROUP BY category ORDER BY count DESC`
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
            seo_title, seo_description, seo_keywords, faq, llm_context, is_published, is_featured, author, product_id,
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
            (title, slug, excerpt, content, cover_image, category, tags, seo_title, seo_description, seo_keywords, faq, llm_context, is_published, is_featured, author, product_id, gallery_images, image_prompt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            seo_title, seo_description, seo_keywords, faq, llm_context, is_published, is_featured, author, product_id,
            gallery_images, image_prompt
        } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        let slug = customSlug || generateSlug(title);
        const tagsJson = typeof tags === 'string' ? tags : JSON.stringify(tags || []);
        const galleryJson = typeof gallery_images === 'string' ? gallery_images : JSON.stringify(gallery_images || []);
        const faqJson = typeof faq === 'string' ? faq : JSON.stringify(faq || []);

        const [result] = await db.query(
            `UPDATE articles SET title=?, slug=?, excerpt=?, content=?, cover_image=?, category=?, tags=?, seo_title=?, seo_description=?, seo_keywords=?, faq=?, llm_context=?, is_published=?, is_featured=?, author=?, product_id=?, gallery_images=?, image_prompt=?
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
                name: 'ให้ความรู้',
                prompt: `เขียนบทความให้ความรู้แบบเชิงลึก อธิบายข้อมูลอย่างละเอียด ใช้ภาษาเข้าใจง่าย เป็นกันเอง มีหัวข้อย่อยชัดเจน ให้ข้อมูลที่ผู้อ่านนำไปใช้ได้จริง ความยาว 800-1200 คำ`
            },
            sales: {
                name: 'ขายของ',
                prompt: `เขียนบทความโปรโมตสินค้า เน้นจุดเด่น คุณสมบัติพิเศษ ความคุ้มค่า มี Call-to-Action ชัดเจน กระตุ้นการตัดสินใจซื้อ ใช้ภาษาน่าสนใจ ดึงดูด สร้างความน่าเชื่อถือ ความยาว 600-800 คำ`
            },
            howto: {
                name: 'วิธีใช้/ดูแลรักษา',
                prompt: `เขียนบทความแนว How-to / Tips เป็นขั้นตอนชัดเจน มีรายการ checklist มีเคล็ดลับที่เป็นประโยชน์ อ่านง่าย ใช้ numbered list และ bullet points ความยาว 800-1000 คำ`
            },
            comparison: {
                name: 'เปรียบเทียบ',
                prompt: `เขียนบทความเปรียบเทียบสินค้า/ตัวเลือกต่างๆ อย่างเป็นกลาง ใส่ตาราง pros/cons วิเคราะห์จุดแข็ง-จุดอ่อน ช่วยผู้อ่านตัดสินใจ ความยาว 800-1000 คำ`
            },
            review: {
                name: 'รีวิว',
                prompt: `เขียนในสไตล์รีวิวประสบการณ์ใช้งานจริง เล่าเรื่องเหมือนลูกค้าจริงรีวิว บอกข้อดี-ข้อจำกัด ให้คะแนน มีรูปแบบที่น่าเชื่อถือ ความยาว 600-800 คำ`
            }
        };

        const selectedStyle = stylePrompts[style] || stylePrompts.educational;

        const systemPrompt = `คุณเป็นนักเขียนบทความมืออาชีพสำหรับ Morespace บริษัทจำหน่ายบ้านเก็บของสำเร็จรูป ตู้เก็บของ และโกดังเก็บของ

สไตล์การเขียน: ${selectedStyle.name}
${selectedStyle.prompt}

${productInfo ? productInfo : 'ไม่มีสินค้าอ้างอิง ให้เขียนบทความทั่วไปเกี่ยวกับบ้านเก็บของ/ตู้เก็บของกลางแจ้ง'}
${additionalPrompt ? '\nคำแนะนำเพิ่มเติม: ' + additionalPrompt : ''}

กรุณาตอบเป็น JSON format เท่านั้น ไม่ต้องมี markdown code block ห่อ:
{
  "title": "หัวข้อบทความ (SEO friendly ให้น่าสนใจ)",
  "excerpt": "สรุปเนื้อหาสั้นๆ 2-3 บรรทัด",
  "content": "เนื้อหาบทความเต็มเป็น HTML string. กฎเหล็ก: [1] ห้ามใช้ \\n ธรรมดา ให้ใช้แท็ก <p>...</p> หุ้มทุกย่อหน้าเพื่อแบ่งบรรทัดเสมอ [2] ใช้แท็ก <h2>, <h3> สำหรับหัวข้อ [3] ใช้ <ul><li> สำหรับหัวข้อย่อย [4] สำคัญมาก: ข้อมูลจำเพาะ วัสดุ หรือข้อเปรียบเทียบ ต้องถูกจัดรูปแบบด้วยแท็ก <table><tr><th><td> เสมอ เพื่อให้อ่านง่ายและสวยงาม",
  "seo_title": "SEO Title (60 ตัวอักษร)",
  "seo_description": "SEO Meta Description (160 ตัวอักษร)",
  "seo_keywords": "keyword1,keyword2,keyword3 (คั่นด้วย comma)",
  "tags": "tag1,tag2,tag3,tag4,tag5",
  "category": "หมวดหมู่ที่เหมาะ (เลือกจาก: ทั่วไป, บ้านเก็บของ, เคล็ดลับ, การดูแลรักษา, ข่าวสาร, โปรโมชั่น)",
  "llm_context": "ข้อความอธิบายบริบทสั้นๆ (2-3 ประโยค) เพื่อบอกให้ AI อื่นรู้ว่าหน้านี้เกี่ยวข้องกับอะไร",
  "image_prompt": "A descriptive, high-quality, photorealistic English prompt for an image generator (like Midjourney or DALL-E) representing the cover of this article. Keep it under 30 words. Format: 'A photorealistic image of [subject], 8k resolution, highly detailed'",
  "faq": [
    {
      "question": "คำถามที่ 1",
      "answer": "คำตอบที่ 1"
    }
  ]
}`;

        const response = await gemini.generateContent({
            prompt: systemPrompt,
            label: 'Article Generate'
        });

        let aiText = response.text || '';

        // Clean up markdown code blocks if present
        aiText = aiText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        // Strip raw newlines or tabs that could break JSON.parse in string literals
        aiText = aiText.replace(/[\n\r\t]+/g, ' ');

        try {
            const articleData = JSON.parse(aiText);
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
        } catch (parseError) {
            console.error('AI JSON parse error:', parseError, 'Raw:', aiText.substring(0, 200));
            res.status(500).json({ success: false, error: 'AI สร้างข้อมูลไม่สมบูรณ์ กรุณาลองใหม่' });
        }
    } catch (error) {
        console.error('Generate article error:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการสร้างบทความ: ' + error.message });
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

        let aiText = response.text || '';
        aiText = aiText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        aiText = aiText.replace(/[\n\r\t]+/g, ' '); // simple sanitization

        try {
            const generatedData = JSON.parse(aiText);
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
        } catch (parseError) {
            console.error('AI JSON parse error:', parseError, 'Raw:', aiText.substring(0, 200));
            res.status(500).json({ success: false, error: 'AI สร้างข้อมูลไม่สมบูรณ์ กรุณาลองใหม่' });
        }
    } catch (error) {
        console.error('Generate All SEO error:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการสร้างข้อมูล: ' + error.message });
    }
});

// POST generate Cover Image Prompt with AI (Admin)
router.post('/generate-prompt', verifyAdmin, async (req, res) => {
    try {
        const { title, prompt: userPrompt } = req.body;

        if (!title && !userPrompt) {
            return res.status(400).json({ success: false, error: 'ต้องมีหัวข้อหรือข้อมูลสำหรับสร้าง Prompt' });
        }

        // Translate the Thai title to an English image prompt
        const systemPrompt = `You are an expert AI prompt engineer.
Convert the following article topic/title into a descriptive, high-quality, photorealistic English prompt for an image generator like Midjourney or DALL-E.
Keep it under 30 words. No text, no words in the image. Just pure visual description.
Format: "A photorealistic image of [subject], [environment/lighting], 8k resolution, highly detailed, professional photography"

Topic: "${title || userPrompt}"
`;
        
        const aiResponse = await gemini.generateContent({
            prompt: systemPrompt,
            responseMimeType: 'text/plain',
            label: 'Article Image Prompt'
        });

        let englishPrompt = aiResponse.text || '';
        englishPrompt = englishPrompt.trim().replace(/^"|"$/g, ''); // Remove quotes

        res.json({
            success: true,
            prompt: englishPrompt
        });
    } catch (error) {
        console.error('Generate AI Image Prompt error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate prompt: ' + error.message });
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
