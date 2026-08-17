const express = require('express');
const router = express.Router();
const db = require('../config/database');
const cacheService = require('../services/cacheService');
const jwt = require('jsonwebtoken');
const { verifyAdmin, JWT_SECRET } = require('./auth');

// GET public settings (No Auth Required) - MUST be before /:key route
router.get('/public', async (req, res) => {
    try {
        // Check cache first
        const cachedSettings = await cacheService.get('settings:public');
        if (cachedSettings) {
            res.setHeader('X-Cache', 'HIT');
            res.setHeader('X-Cache-Engine', cacheService.isRedisReady ? 'Redis' : 'In-Memory');
            return res.status(200).json({ success: true, data: cachedSettings });
        }

        // Prevent browser caching for settings to ensure admin updates show immediately
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Engine', cacheService.isRedisReady ? 'Redis' : 'In-Memory');

        const publicKeys = [
            'google_login_enabled', 'google_client_id',
            'line_login_enabled', 'line_channel_id',
            'online_shopping_enabled',
            'payment_promptpay_enabled', 'payment_bank_transfer_enabled',
            'wishlist_enabled',
            'compare_enabled',
            'payment_ipay_enabled', 'payment_ipay_merchant_id',
            'payment_bank_accounts', 'payment_promptpay_number',
            'shipping_restricted_provinces',
            'free_install_provinces',
            'store_name', 'store_description', 'store_keywords', 'store_og_title', 'store_og_description', 'company_legal_name', 'store_logo', 'store_favicon', 
            'store_address', 'store_tax_id', 'store_phone', 
            'warehouse_lat', 'warehouse_lng',
            'home_category_showcase', 'show_product_rating', 'show_product_review',
            'home_highlight_categories', 'home_show_highlight_categories',
            'home_section_titles', 'home_how_it_works', 'home_faq', 'home_projects_cta',
            'home_slides', 'home_hero_feature_badges', 'home_stats', 'home_features_items',
            'home_testimonials', 'home_partners', 'home_corporate_reviews', 'home_affiliates',
            'maintenance_mode_enabled', 'maintenance_message',
            'holiday_mode_enabled', 'holiday_message', 'holiday_name',
            'holiday_start_date', 'holiday_end_date', 'holiday_image',
            'contact_company_name', 'contact_address', 'contact_map_embed', 'contact_working_hours',
            'contact_phones', 'contact_emails', 'contact_lines',
            'contact_facebook_url', 'contact_tiktok_url', 'contact_youtube_url',
            'terms_of_service', 'privacy_policy', 'cookie_policy', 
            'payment_guide', 'warranty_policy', 'shipping_policy',
            'home_banner_tag', 'home_banner_title', 'home_banner_subtitle', 'home_banner_image', 
            'home_banner_badge_text', 'home_banner_badge_sub', 'home_banner_bullets',
            'home_why_choose_us_title', 'home_why_choose_us_bullets',
            'home_promo_tag', 'home_promo_title', 'home_promo_desc', 
            'home_promo_btn_text', 'home_promo_btn_link', 'home_promo_image',
            'about_hero_title', 'about_hero_subtitle', 'about_hero_desc', 'about_hero_bg',
            'about_main_img', 'about_quote_title', 'about_quote_text',
            'about_core_1_title', 'about_core_1_desc', 'about_core_1_img',
            'about_core_2_title', 'about_core_2_desc', 'about_core_2_img',
            'about_core_3_title', 'about_core_3_desc', 'about_core_3_img',
            'about_core_4_title', 'about_core_4_desc', 'about_core_4_img',
            'about_vision_title', 'about_vision_desc', 'about_vision_img',
            'about_mission_title', 'about_mission_desc',
            'about_stat_1_val', 'about_stat_1_label',
            'about_stat_2_val', 'about_stat_2_label',
            'about_stat_3_val', 'about_stat_3_label',
            'about_stat_4_val', 'about_stat_4_label',
            'about_cta_title', 'about_cta_desc', 'about_content_rich',
            'services_hero_title', 'services_hero_subtitle', 'services_hero_desc', 'services_hero_bg',
            'services_items', 'services_stats', 'services_cta_title', 'services_cta_desc', 'services_content_rich',
            'products_hero_bg', 'contact_hero_bg', 'blog_hero_bg', 'projects_hero_bg', 'quotation_hero_bg',
            'footer_newsletter_title', 'footer_newsletter_subtitle', 'footer_newsletter_privacy',
            'footer_trust_badges', 'footer_distributor_label', 'footer_distributor_url',
            'footer_sitemap_label', 'footer_sitemap_url',
            'seo_default_llm_context', 'seo_ai_crawling_enabled',
            'wire_master_types', 'wire_presets'
        ];

        const placeholders = publicKeys.map(() => '?').join(',');
        const [rows] = await db.query(`SELECT setting_key, setting_value FROM settings WHERE setting_key IN (${placeholders})`, publicKeys);

        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        // Cache for 10 minutes (600s)
        await cacheService.set('settings:public', settings, 600);

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error('Fetch public settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch public settings' });
    }
});

// GET /api/settings/seo-preview - Live real-data SEO & GEO preview for Admin
router.get('/seo-preview', async (req, res) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
        const siteUrl = (process.env.SITE_URL || `${protocol}://${host}`).replace(/\/$/, '');

        const type = req.query.type || 'home';
        const targetId = req.query.id || '';

        // 1. Fetch site settings map
        const [sRows] = await db.query("SELECT setting_key, setting_value FROM settings");
        const sMap = {};
        sRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });

        const storeName = sMap['store_name'] || '';
        const companyLegalName = sMap['company_legal_name'] || storeName;
        const defaultDesc = sMap['store_description'] || '';
        const defaultKeywords = sMap['store_keywords'] || '';
        const defaultOgTitle = sMap['store_og_title'] || storeName;
        const defaultOgDesc = sMap['store_og_description'] || defaultDesc;
        const defaultLlmContext = sMap['seo_default_llm_context'] || '';

        // 2. Fetch list of real products, articles, projects for dropdown selector
        let productsList = [];
        let articlesList = [];
        let projectsList = [];
        try {
            const [pRows] = await db.query("SELECT id, name, slug FROM products WHERE is_active = 1 ORDER BY id DESC LIMIT 50");
            productsList = pRows;
        } catch (e) {}

        try {
            const [aRows] = await db.query("SELECT id, title, slug FROM articles WHERE is_published = 1 ORDER BY id DESC LIMIT 50");
            articlesList = aRows;
        } catch (e) {}

        try {
            const [prjRows] = await db.query("SELECT id, title FROM projects WHERE is_published = 1 ORDER BY id DESC LIMIT 50");
            projectsList = prjRows;
        } catch (e) {}

        // 3. Compile target preview payload
        let title = defaultOgTitle;
        let description = defaultDesc;
        let keywords = defaultKeywords;
        let llmContext = defaultLlmContext;
        let image = `${siteUrl}/og-image.jpg`;
        let canonicalUrl = siteUrl;
        let rating = 4.9;
        let reviewCount = 128;
        let inStock = true;
        let price = null;
        let schemaList = [];

        if (type === 'product' && (targetId || productsList.length > 0)) {
            const pid = targetId || (productsList[0] ? productsList[0].id : '');
            const [pRows] = await db.query(
                "SELECT id, name, slug, short_description, description, price, image_url, seo_title, seo_description, seo_keywords, llm_context, sku, is_out_of_stock, rating, review_count, faq FROM products WHERE id = ? OR slug = ?",
                [pid, pid]
            );
            if (pRows.length > 0) {
                const prod = pRows[0];
                title = prod.seo_title || `${prod.name} | ${storeName}`;
                description = prod.seo_description || prod.short_description || prod.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || defaultDesc;
                keywords = prod.seo_keywords || defaultKeywords;
                llmContext = prod.llm_context || defaultLlmContext;
                if (prod.image_url) {
                    image = prod.image_url.startsWith('http') ? prod.image_url : `${siteUrl}${prod.image_url}`;
                }
                canonicalUrl = `${siteUrl}/products/${prod.slug || prod.id}`;
                inStock = !prod.is_out_of_stock;
                price = prod.price;
                rating = prod.rating || 4.9;
                reviewCount = prod.review_count || 35;

                schemaList.push({
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": prod.name,
                    "image": [image],
                    "description": description,
                    "sku": prod.sku || `PROD-${prod.id}`,
                    "brand": { "@type": "Brand", "name": storeName },
                    "offers": {
                        "@type": "Offer",
                        "url": canonicalUrl,
                        "priceCurrency": "THB",
                        "price": String(prod.price || 0),
                        "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                        "seller": { "@type": "Organization", "name": companyLegalName }
                    },
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": String(rating),
                        "reviewCount": String(reviewCount)
                    }
                });
            }
        } else if (type === 'article' && (targetId || articlesList.length > 0)) {
            const aid = targetId || (articlesList[0] ? articlesList[0].id : '');
            const [aRows] = await db.query(
                "SELECT id, title, slug, excerpt, content, cover_image, author, created_at, updated_at, seo_title, seo_description, seo_keywords, llm_context FROM articles WHERE id = ? OR slug = ?",
                [aid, aid]
            );
            if (aRows.length > 0) {
                const art = aRows[0];
                title = art.seo_title || `${art.title} | ${storeName} Blog`;
                description = art.seo_description || art.excerpt || art.content?.replace(/<[^>]*>?/gm, '').substring(0, 160) || defaultDesc;
                keywords = art.seo_keywords || defaultKeywords;
                llmContext = art.llm_context || defaultLlmContext;
                if (art.cover_image) {
                    image = art.cover_image.startsWith('http') ? art.cover_image : `${siteUrl}${art.cover_image}`;
                }
                canonicalUrl = `${siteUrl}/blog/${art.slug || art.id}`;

                schemaList.push({
                    "@context": "https://schema.org",
                    "@type": "Article",
                    "headline": art.title,
                    "description": description,
                    "image": image,
                    "author": { "@type": "Person", "name": art.author || "Admin" },
                    "publisher": { "@type": "Organization", "name": storeName, "url": siteUrl },
                    "datePublished": art.created_at,
                    "dateModified": art.updated_at
                });
            }
        } else if (type === 'project' && (targetId || projectsList.length > 0)) {
            const prjid = targetId || (projectsList[0] ? projectsList[0].id : '');
            const [prjRows] = await db.query(
                "SELECT id, title, description, cover_image, location FROM projects WHERE id = ?",
                [prjid]
            );
            if (prjRows.length > 0) {
                const prj = prjRows[0];
                title = `${prj.title} | ผลงานของเรา ${storeName}`;
                description = prj.description?.replace(/<[^>]*>?/gm, '').substring(0, 160) || defaultDesc;
                if (prj.cover_image) {
                    image = prj.cover_image.startsWith('http') ? prj.cover_image : `${siteUrl}${prj.cover_image}`;
                }
                canonicalUrl = `${siteUrl}/projects/${prj.id}`;

                schemaList.push({
                    "@context": "https://schema.org",
                    "@type": "CreativeWork",
                    "name": prj.title,
                    "description": description,
                    "image": image,
                    "provider": { "@type": "LocalBusiness", "name": storeName }
                });
            }
        } else {
            // Default Home schema
            schemaList.push({
                "@context": "https://schema.org",
                "@type": "Organization",
                "name": companyLegalName,
                "alternateName": storeName,
                "url": siteUrl,
                "logo": `${siteUrl}/logo.png`,
                "description": defaultDesc
            });
            schemaList.push({
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": storeName,
                "url": siteUrl,
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": `${siteUrl}/products?search={search_term_string}`,
                    "query-input": "required name=search_term_string"
                }
            });
        }

        return res.json({
            success: true,
            type,
            targetId,
            productsList,
            articlesList,
            projectsList,
            data: {
                title,
                description,
                keywords,
                llmContext,
                image,
                canonicalUrl,
                googleSnippet: {
                    title,
                    url: canonicalUrl,
                    description,
                    rating,
                    reviewCount,
                    inStock,
                    priceFormatted: price ? `฿${Number(price).toLocaleString()}` : null
                },
                socialCard: {
                    title,
                    description,
                    image,
                    domain: host
                },
                aiPreview: {
                    llmContext,
                    knowledgeFeedSnippet: `### ${title}\n- URL: ${canonicalUrl}\n- Context: ${llmContext}\n- Summary: ${description}`
                },
                jsonLdSchema: JSON.stringify(schemaList, null, 2)
            }
        });

    } catch (error) {
        console.error('SEO Preview Endpoint Error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

// Sensitive keys that should NEVER be exposed without admin auth
const SENSITIVE_KEY_PATTERNS = [
    'api_key', 'secret', 'token', 'smtp', 'password',
    'line_channel_secret', 'gemini_api_key',
    'telegram_bot_token', 'telegram_chat_id',
    'notification_email'
];
const isSensitiveKey = (key) => SENSITIVE_KEY_PATTERNS.some(p => key.toLowerCase().includes(p));

// Helper: try to verify admin token (non-blocking)
const tryVerifyAdmin = (req) => {
    const authToken = req.headers.authorization?.split(' ')[1];
    if (!authToken) return false;
    try {
        const decoded = jwt.verify(authToken, JWT_SECRET);
        return decoded.role === 'admin';
    } catch (e) {
        return false;
    }
};

// GET all settings
router.get('/', async (req, res) => {
    try {
        // Prevent browser caching for settings to ensure admin updates show immediately
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        const isAdmin = tryVerifyAdmin(req);
        const [rows] = await db.query('SELECT * FROM settings');
        const settings = {};
        rows.forEach(row => {
            // Filter out sensitive keys for non-admins
            if (!isAdmin && isSensitiveKey(row.setting_key)) {
                return;
            }
            settings[row.setting_key] = row.setting_value;
        });
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error('Fetch settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
});

// GET specific setting by key - MUST be after /public
router.get('/:key', async (req, res) => {
    try {
        const isAdmin = tryVerifyAdmin(req);
        const { key } = req.params;

        if (!isAdmin && isSensitiveKey(key)) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
        if (rows.length === 0) {
            return res.status(200).json({ success: true, data: null });
        }
        res.status(200).json({ success: true, data: rows[0].setting_value });
    } catch (error) {
        console.error('Fetch setting error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch setting' });
    }
});

// UPDATE or INSERT setting
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) {
            return res.status(400).json({ success: false, error: 'Setting key is required' });
        }

        const query = `
            INSERT INTO settings (setting_key, setting_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE setting_value = ?
        `;
        await db.query(query, [key, value || '', value || '']);

        // Invalidate settings cache
        await cacheService.delPattern('settings:*');

        res.status(200).json({ success: true, message: 'Setting saved successfully' });
    } catch (error) {
        console.error('Save setting error:', error);
        res.status(500).json({ success: false, error: 'Failed to save setting' });
    }
});

// BATCH UPDATE or INSERT multiple settings
router.post('/batch', verifyAdmin, async (req, res) => {
    try {
        const { settings } = req.body;
        if (!settings || !Array.isArray(settings)) {
            return res.status(400).json({ success: false, error: 'Settings array is required' });
        }

        const query = `
            INSERT INTO settings (setting_key, setting_value) 
            VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE setting_value = ?
        `;

        for (const item of settings) {
            if (item.key) {
                await db.query(query, [item.key, item.value || '', item.value || '']);
            }
        }

        // Invalidate settings cache
        await cacheService.delPattern('settings:*');

        res.status(200).json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Batch save settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to save settings' });
    }
});

// POST test notification
router.post('/test-notification', verifyAdmin, async (req, res) => {
    try {
        const { type, token, chatId, emails } = req.body;

        let storeName = 'STORAGE HOUSE';
        try {
            const [sRows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'store_name'");
            if (sRows.length > 0 && sRows[0].setting_value) storeName = sRows[0].setting_value;
        } catch (e) {}

        let title = `🧪 ข้อความทดสอบจากระบบ ${storeName}`;
        let text = 'นี่คือข้อความทดสอบเพื่อยืนยันว่าการตั้งค่าการแจ้งเตือนของคุณทำงานได้อย่างถูกต้องแล้ว 🎉';
        let htmlText = `
            <h2>${title}</h2>
            <p>${text}</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">ส่งจากระบบจัดการหลังบ้าน ${storeName}</p>
        `;

        if (type === 'telegram') {
            if (!token || !chatId) {
                return res.status(400).json({ success: false, error: 'Token and Chat ID are required for Telegram test' });
            }
            const url = `https://api.telegram.org/bot${token}/sendMessage`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: `<b>${title}</b>\n${text}`,
                    parse_mode: 'HTML'
                })
            });
            const data = await response.json();
            if (!data.ok) throw new Error(data.description);
        } else if (type === 'lineoa') {
            const { userId } = req.body;
            if (!token || !userId) {
                return res.status(400).json({ success: false, error: 'Token and User ID are required for LINE OA test' });
            }
            const url = `https://api.line.me/v2/bot/message/push`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    to: userId,
                    messages: [{
                        type: 'text',
                        text: `${title}\n\n${text}`
                    }]
                })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error('LINE API Error Response:', data);
                throw new Error(data.message || 'Failed to send LINE message');
            }
        } else if (type === 'email') {
            if (!emails || !Array.isArray(emails) || emails.length === 0) {
                return res.status(400).json({ success: false, error: 'At least one email is required for Email test' });
            }

            const { getTransporter, getStoreSettings, emailTemplate } = require('../services/emailService');
            const mailer = await getTransporter();
            if (!mailer) {
                return res.status(400).json({ success: false, error: 'SMTP ยังไม่ได้ถูกตั้งค่าในระบบหลังบ้าน กรุณากรอกข้อมูลและทดสอบในแถบตั้งค่า SMTP ก่อน' });
            }

            const store = await getStoreSettings();
            const mailOptions = {
                from: `"${mailer.fromName}" <${mailer.fromEmail}>`,
                to: emails.join(', '),
                subject: title,
                html: emailTemplate(`
                    <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">${title}</h2>
                    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">${text}</p>
                    <p style="color:#6b7280;font-size:12px;margin-top:24px;border-top:1px solid #f3f4f6;padding-top:16px;">ส่งจากระบบจัดการหลังบ้าน ${store.storeName}</p>
                `, store)
            };

            await mailer.transport.sendMail(mailOptions);
        } else {
            return res.status(400).json({ success: false, error: 'Invalid test type' });
        }

        res.status(200).json({ success: true, message: 'Test notification sent successfully' });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to send test notification' });
    }
});

// POST test-report (trigger daily report on demand)
router.post('/test-report', verifyAdmin, async (req, res) => {
    try {
        const { generateDailyReport } = require('../services/scheduledReports');
        await generateDailyReport();
        res.status(200).json({ success: true, message: 'Daily report sent to Telegram' });
    } catch (error) {
        console.error('Test report error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to generate report' });
    }
});

// POST test-smtp — test SMTP config from DB/request body
router.post('/test-smtp', verifyAdmin, async (req, res) => {
    try {
        const { host, port, user, pass, secure, from, to } = req.body;
        if (!host || !user || !pass) {
            return res.status(400).json({ success: false, error: 'Host, User และ Password จำเป็นต้องกรอก' });
        }
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host,
            port: parseInt(port) || 587,
            secure: secure === true || secure === 'true',
            auth: { user, pass }
        });
        let storeName = 'STORAGE HOUSE';
        try {
            const [sRows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'store_name'");
            if (sRows.length > 0 && sRows[0].setting_value) storeName = sRows[0].setting_value;
        } catch (e) {}

        const fromName = from || storeName;
        await transporter.sendMail({
            from: `"${fromName}" <${user}>`,
            to: to || user,
            subject: `✅ ทดสอบ SMTP จากระบบ ${storeName} Admin`,
            html: `
                <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
                    <h2 style="color:#059669">✅ การตั้งค่า SMTP ทำงานได้ปกติ!</h2>
                    <p>Email นี้ถูกส่งจากระบบจัดการหลังบ้าน ${storeName} เพื่อยืนยันว่าการตั้งค่า SMTP ของคุณถูกต้อง</p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
                    <p style="color:#6b7280;font-size:12px">SMTP Host: <code>${host}:${port}</code> | Secure: ${secure}</p>
                </div>
            `
        });
        res.status(200).json({ success: true, message: `ส่ง Email ทดสอบไปที่ ${to || user} สำเร็จ` });
    } catch (error) {
        console.error('Test SMTP error:', error);
        res.status(500).json({ success: false, error: error.message || 'SMTP connection failed' });
    }
});

module.exports = router;
