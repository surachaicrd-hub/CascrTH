const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * Helper to fetch site settings map
 */
async function getSettingsMap() {
    const sMap = {
        store_name: 'บ้านเก็บของ',
        store_description: 'จำหน่ายและติดตั้งบ้านเก็บของ ตู้เก็บของกลางแจ้ง และโกดังสำเร็จรูปคุณภาพสูง',
        company_legal_name: 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
        contact_phone: '',
        contact_email: '',
        contact_line: '',
        contact_address: ''
    };

    try {
        const [rows] = await db.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'store_description', 'company_legal_name', 'contact_phone', 'contact_email', 'contact_line', 'contact_address')"
        );
        rows.forEach(r => {
            if (r.setting_value) sMap[r.setting_key] = r.setting_value;
        });
    } catch (e) {
        console.error('[LLMs Route] Failed to fetch settings:', e.message);
    }
    return sMap;
}

/**
 * GET /llms.txt & /api/llms.txt
 * Standard LLMs.txt knowledge index for AI engines (ChatGPT, Perplexity, Claude, Gemini)
 */
router.get('/', async (req, res) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
        const siteUrl = (process.env.SITE_URL || `${protocol}://${host}`).replace(/\/$/, '');

        const sMap = await getSettingsMap();

        // 1. Fetch categories
        let categories = [];
        try {
            const [catRows] = await db.query("SELECT id, name, description FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC");
            categories = catRows;
        } catch (e) {}

        // 2. Fetch active products
        let products = [];
        try {
            const [prodRows] = await db.query(
                `SELECT id, name, slug, price, original_price, short_description, sku, is_out_of_stock 
                 FROM products 
                 WHERE is_active = 1 
                 ORDER BY is_bestseller DESC, sort_order ASC, id DESC LIMIT 20`
            );
            products = prodRows;
        } catch (e) {}

        // 3. Fetch published articles
        let articles = [];
        try {
            const [artRows] = await db.query("SELECT id, title, slug, excerpt FROM articles WHERE is_published = 1 ORDER BY created_at DESC LIMIT 10");
            articles = artRows;
        } catch (e) {}

        // Build llms.txt Markdown content
        let md = `# ${sMap.store_name}\n\n`;
        md += `> ${sMap.store_description}\n\n`;
        md += `## About & Contact\n`;
        md += `- **Company Legal Name**: ${sMap.company_legal_name}\n`;
        md += `- **Official Website**: ${siteUrl}\n`;
        if (sMap.contact_phone) md += `- **Phone**: ${sMap.contact_phone}\n`;
        if (sMap.contact_line) md += `- **LINE Official**: ${sMap.contact_line}\n`;
        if (sMap.contact_email) md += `- **Email**: ${sMap.contact_email}\n`;
        if (sMap.contact_address) md += `- **Address**: ${sMap.contact_address}\n`;
        md += `\n`;

        if (categories.length > 0) {
            md += `## Product Categories\n`;
            for (const cat of categories) {
                md += `- [${cat.name}](${siteUrl}/products?category=${encodeURIComponent(cat.name)}): ${cat.description || cat.name}\n`;
            }
            md += `\n`;
        }

        if (products.length > 0) {
            md += `## Featured Products & Solutions\n`;
            for (const p of products) {
                const url = `${siteUrl}/products/${p.slug || p.id}`;
                const priceText = p.price ? `฿${Number(p.price).toLocaleString()}` : 'สอบถามราคา';
                const stockText = p.is_out_of_stock ? '(สินค้าหมดชั่วคราว)' : '(พร้อมจำหน่ายและจัดส่ง)';
                const desc = p.short_description ? ` - ${p.short_description.replace(/\n/g, ' ')}` : '';
                md += `- [${p.name}](${url}): ${priceText} ${stockText}${desc}\n`;
            }
            md += `\n`;
        }

        if (articles.length > 0) {
            md += `## Knowledge Base & Articles\n`;
            for (const a of articles) {
                const url = `${siteUrl}/blog/${a.slug || a.id}`;
                const excerpt = a.excerpt ? `: ${a.excerpt.replace(/\n/g, ' ')}` : '';
                md += `- [${a.title}](${url})${excerpt}\n`;
            }
            md += `\n`;
        }

        md += `## Important Pages & Tools\n`;
        md += `- [หน้าหลัก / Home](${siteUrl}/)\n`;
        md += `- [รายการสินค้า / All Products](${siteUrl}/products)\n`;
        md += `- [ขอใบเสนอราคา / Request Quotation](${siteUrl}/quotation)\n`;
        md += `- [ผลงานติดตั้ง / Projects & Portfolio](${siteUrl}/projects)\n`;
        md += `- [บริการส่งมอบและบำรุงรักษา / Services](${siteUrl}/services)\n`;
        md += `- [เกี่ยวกับเรา / About Us](${siteUrl}/about)\n`;
        md += `- [ติดต่อเรา / Contact Us](${siteUrl}/contact)\n`;
        md += `\n`;
        md += `## Complete Knowledge Base\n`;
        md += `- [Full Text Knowledge Specification](${siteUrl}/llms-full.txt)\n`;

        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(md);

    } catch (error) {
        console.error('llms.txt generation error:', error);
        return res.status(500).send('# Error generating llms.txt');
    }
});

/**
 * GET /llms-full.txt & /api/llms-full.txt
 * Full detailed knowledge text for deeper ingestion by LLM models
 */
router.get('/full', async (req, res) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
        const siteUrl = (process.env.SITE_URL || `${protocol}://${host}`).replace(/\/$/, '');

        const sMap = await getSettingsMap();

        // Fetch detailed product info
        let products = [];
        try {
            const [prodRows] = await db.query(
                `SELECT id, name, slug, price, original_price, short_description, description, sku, llm_context, faq, categories 
                 FROM products 
                 WHERE is_active = 1 
                 ORDER BY id DESC`
            );
            products = prodRows;
        } catch (e) {}

        // Fetch detailed articles
        let articles = [];
        try {
            const [artRows] = await db.query("SELECT id, title, slug, excerpt, content, llm_context, faq FROM articles WHERE is_published = 1 ORDER BY created_at DESC");
            articles = artRows;
        } catch (e) {}

        let md = `# Complete Knowledge Base & Product Directory - ${sMap.store_name}\n\n`;
        md += `Company Legal Name: ${sMap.company_legal_name}\n`;
        md += `Website: ${siteUrl}\n\n`;
        md += `Overview: ${sMap.store_description}\n\n`;

        md += `===========================================\n`;
        md += `PRODUCTS & SOLUTIONS CATALOG\n`;
        md += `===========================================\n\n`;

        for (const p of products) {
            const plainDesc = p.description ? p.description.replace(/<[^>]*>?/gm, '').substring(0, 500) : '';
            md += `### ${p.name}\n`;
            md += `- URL: ${siteUrl}/products/${p.slug || p.id}\n`;
            md += `- SKU: ${p.sku || p.id}\n`;
            md += `- Price: ฿${p.price ? Number(p.price).toLocaleString() : 'N/A'}\n`;
            if (p.short_description) md += `- Summary: ${p.short_description}\n`;
            if (p.llm_context) md += `- AI/GEO Context: ${p.llm_context}\n`;
            if (plainDesc) md += `- Detailed Description: ${plainDesc}\n`;

            if (p.faq) {
                try {
                    const faqs = typeof p.faq === 'string' ? JSON.parse(p.faq) : p.faq;
                    if (Array.isArray(faqs) && faqs.length > 0) {
                        md += `- FAQ:\n`;
                        faqs.forEach(f => {
                            md += `  * Q: ${f.question}\n    A: ${f.answer}\n`;
                        });
                    }
                } catch (e) {}
            }
            md += `\n---\n\n`;
        }

        if (articles.length > 0) {
            md += `===========================================\n`;
            md += `ARTICLES & KNOWLEDGE BASE\n`;
            md += `===========================================\n\n`;

            for (const a of articles) {
                const plainContent = a.content ? a.content.replace(/<[^>]*>?/gm, '').substring(0, 600) : '';
                md += `### ${a.title}\n`;
                md += `- URL: ${siteUrl}/blog/${a.slug || a.id}\n`;
                if (a.excerpt) md += `- Summary: ${a.excerpt}\n`;
                if (a.llm_context) md += `- AI Context: ${a.llm_context}\n`;
                if (plainContent) md += `- Article Preview: ${plainContent}\n`;
                md += `\n---\n\n`;
            }
        }

        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=3600');
        return res.status(200).send(md);

    } catch (error) {
        console.error('llms-full.txt generation error:', error);
        return res.status(500).send('# Error generating llms-full.txt');
    }
});

module.exports = router;
