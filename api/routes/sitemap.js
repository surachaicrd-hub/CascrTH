const express = require('express');
const router = express.Router();
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Static pages for CR Distribution (Thailand) - cascr-th
const STATIC_PAGES = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/products', changefreq: 'daily', priority: '0.9' },
    { path: '/services', changefreq: 'weekly', priority: '0.8' },
    { path: '/projects', changefreq: 'weekly', priority: '0.8' },
    { path: '/blog', changefreq: 'daily', priority: '0.8' },
    { path: '/about', changefreq: 'monthly', priority: '0.7' },
    { path: '/contact', changefreq: 'monthly', priority: '0.8' },
    { path: '/quotation', changefreq: 'weekly', priority: '0.9' },
    { path: '/installation-guide', changefreq: 'monthly', priority: '0.7' },
    { path: '/payment-methods', changefreq: 'monthly', priority: '0.7' },
    { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
    { path: '/terms', changefreq: 'yearly', priority: '0.3' },
    { path: '/cookie-policy', changefreq: 'yearly', priority: '0.3' },
    { path: '/warranty', changefreq: 'monthly', priority: '0.6' },
    { path: '/sitemap', changefreq: 'weekly', priority: '0.5' },
];

// Helper: format date to W3C format (YYYY-MM-DD)
const formatDate = (date) => {
    if (!date) return new Date().toISOString().split('T')[0];
    try {
        return new Date(date).toISOString().split('T')[0];
    } catch (e) {
        return new Date().toISOString().split('T')[0];
    }
};

/**
 * Generate sitemap XML string and sync to static public directories
 */
async function generateSitemapXml(siteUrlOverride = null) {
    let siteUrl = siteUrlOverride;

    if (!siteUrl) {
        try {
            const [urlRows] = await db.query(
                "SELECT setting_value FROM settings WHERE setting_key IN ('store_url', 'site_url')"
            );
            if (urlRows.length > 0 && urlRows[0].setting_value) {
                siteUrl = urlRows[0].setting_value.replace(/\/+$/, '');
            }
        } catch (e) {}
    }

    if (!siteUrl) {
        siteUrl = process.env.SITE_URL || 'https://เครื่องตัดปอกย้ำสายไฟ.com';
    }
    siteUrl = siteUrl.replace(/\/+$/, '');

    // 1. Fetch active products
    let products = [];
    try {
        const [prodRows] = await db.query(
            `SELECT slug, id, name, image_url, updated_at, created_at FROM products WHERE is_active = 1 
               AND NOT EXISTS (
                   SELECT 1 FROM categories c
                   WHERE c.is_active = false
                     AND (category = c.name OR (categories IS NOT NULL AND JSON_CONTAINS(categories, JSON_QUOTE(c.name))))
               )
             ORDER BY sort_order ASC, id DESC`
        );
        products = prodRows;
    } catch (e) {
        console.error('Error querying products for sitemap:', e);
    }

    // 2. Fetch active categories
    let categories = [];
    try {
        const [catRows] = await db.query(`SELECT name, slug FROM categories WHERE is_active = 1`);
        categories = catRows;
    } catch (e) {}

    // 3. Fetch projects if enabled
    let projectsEnabled = true;
    try {
        const [pSetting] = await db.query(`SELECT setting_value FROM settings WHERE setting_key = 'projects_enabled'`);
        if (pSetting.length > 0 && String(pSetting[0].setting_value) === 'false') {
            projectsEnabled = false;
        }
    } catch (e) {}

    let projects = [];
    if (projectsEnabled) {
        try {
            const [projRows] = await db.query(
                `SELECT id, slug, title, cover_image, updated_at, created_at FROM projects WHERE is_published = 1 ORDER BY created_at DESC`
            );
            projects = projRows;
        } catch (e) {}
    }

    // 4. Fetch published articles
    let articles = [];
    try {
        const [artRows] = await db.query(
            `SELECT slug, id, title, cover_image, updated_at, created_at FROM articles WHERE is_published = 1 ORDER BY created_at DESC`
        );
        articles = artRows;
    } catch (e) {}

    // 5. Build XML Structure
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // Static pages
    for (const page of STATIC_PAGES) {
        if (page.path === '/projects' && !projectsEnabled) continue;
        xml += `  <url>\n`;
        xml += `    <loc>${siteUrl}${page.path}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `  </url>\n`;
    }

    // Category pages
    for (const cat of categories) {
        const catParam = encodeURIComponent(cat.name);
        xml += `  <url>\n`;
        xml += `    <loc>${siteUrl}/products?category=${catParam}</loc>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
    }

    // Product pages
    for (const product of products) {
        const productPath = product.slug || product.id;
        const lastMod = formatDate(product.updated_at || product.created_at);
        xml += `  <url>\n`;
        xml += `    <loc>${siteUrl}/products/${encodeURI(productPath)}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.9</priority>\n`;
        if (product.image_url) {
            const imgLoc = product.image_url.startsWith('http') ? product.image_url : `${siteUrl}${product.image_url.startsWith('/') ? '' : '/'}${product.image_url}`;
            const cleanTitle = (product.name || '').replace(/[<>&'"]/g, '');
            xml += `    <image:image>\n`;
            xml += `      <image:loc>${imgLoc}</image:loc>\n`;
            if (cleanTitle) {
                xml += `      <image:title>${cleanTitle}</image:title>\n`;
            }
            xml += `    </image:image>\n`;
        }
        xml += `  </url>\n`;
    }

    // Project pages
    if (projectsEnabled) {
        for (const project of projects) {
            const projectPath = project.slug || project.id;
            const lastMod = formatDate(project.updated_at || project.created_at);
            xml += `  <url>\n`;
            xml += `    <loc>${siteUrl}/projects/${encodeURI(projectPath)}</loc>\n`;
            xml += `    <lastmod>${lastMod}</lastmod>\n`;
            xml += `    <changefreq>monthly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            if (project.cover_image) {
                const imgLoc = project.cover_image.startsWith('http') ? project.cover_image : `${siteUrl}${project.cover_image.startsWith('/') ? '' : '/'}${project.cover_image}`;
                const cleanTitle = (project.title || '').replace(/[<>&'"]/g, '');
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${imgLoc}</image:loc>\n`;
                if (cleanTitle) {
                    xml += `      <image:title>${cleanTitle}</image:title>\n`;
                }
                xml += `    </image:image>\n`;
            }
            xml += `  </url>\n`;
        }
    }

    // Article pages
    for (const article of articles) {
        const articlePath = article.slug || article.id;
        const lastMod = formatDate(article.updated_at || article.created_at);
        xml += `  <url>\n`;
        xml += `    <loc>${siteUrl}/blog/${encodeURI(articlePath)}</loc>\n`;
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        if (article.cover_image) {
            const imgLoc = article.cover_image.startsWith('http') ? article.cover_image : `${siteUrl}${article.cover_image.startsWith('/') ? '' : '/'}${article.cover_image}`;
            const cleanTitle = (article.title || '').replace(/[<>&'"]/g, '');
            xml += `    <image:image>\n`;
            xml += `      <image:loc>${imgLoc}</image:loc>\n`;
            if (cleanTitle) {
                xml += `      <image:title>${cleanTitle}</image:title>\n`;
            }
            xml += `    </image:image>\n`;
        }
        xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    // Save physical sitemap.xml to all public folders as static fallback
    const targetDirs = [
        path.resolve(__dirname, '../../public'),
        path.resolve(__dirname, '../public'),
        path.resolve(__dirname, '../../frontend/public'),
        path.resolve(__dirname, '../../frontend/dist')
    ];

    for (const dir of targetDirs) {
        try {
            if (fs.existsSync(dir)) {
                fs.writeFileSync(path.join(dir, 'sitemap.xml'), xml, 'utf8');
            }
        } catch (err) {}
    }

    // Ensure IndexNow key file exists for Bing & Yandex instant indexing
    try {
        const { ensureKeyFile } = require('../services/indexNowService');
        ensureKeyFile();
    } catch (e) {}

    return xml;
}

// Handler for all sitemap requests
const handleSitemapRequest = async (req, res) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'เครื่องตัดปอกย้ำสายไฟ.com';
        const siteUrl = process.env.SITE_URL || `${protocol}://${host}`;

        const xml = await generateSitemapXml(siteUrl);

        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 hour
        return res.status(200).send(xml);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.set('Content-Type', 'application/xml; charset=utf-8');
        return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>');
    }
};

router.get('/', handleSitemapRequest);
router.get('/sitemap.xml', handleSitemapRequest);
router.get('/index.xml', handleSitemapRequest);

// GET /api/sitemap/ping-bing — Ping Bing via IndexNow API
router.get(['/ping-bing', '/api/sitemap/ping-bing'], async (req, res) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'เครื่องตัดปอกย้ำสายไฟ.com';
        const siteUrl = process.env.SITE_URL || `${protocol}://${host}`;

        const { notifyIndexNow } = require('../services/indexNowService');
        const result = await notifyIndexNow([
            `${siteUrl}/sitemap.xml`,
            `${siteUrl}/`,
            `${siteUrl}/products`,
            `${siteUrl}/projects`,
            `${siteUrl}/blog`
        ]);

        return res.json({
            success: true,
            message: 'ส่งสัญญาณ Bing IndexNow เรียบร้อยแล้ว (Bing & Yandex Instant Indexing Triggered)',
            result
        });
    } catch (error) {
        console.error('Bing IndexNow error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = {
    router,
    generateSitemapXml,
    handleSitemapRequest
};
