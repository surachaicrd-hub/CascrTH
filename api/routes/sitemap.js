const express = require('express');
const router = express.Router();
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.SITE_URL || 'https://บ้านเก็บของ.com';

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/products', changefreq: 'daily', priority: '0.9' },
    { path: '/services', changefreq: 'monthly', priority: '0.8' },
    { path: '/projects', changefreq: 'weekly', priority: '0.8' },
    { path: '/about', changefreq: 'yearly', priority: '0.7' },
    { path: '/contact', changefreq: 'yearly', priority: '0.8' },
    { path: '/quotation', changefreq: 'monthly', priority: '0.9' },
    { path: '/installation-guide', changefreq: 'monthly', priority: '0.7' },
    { path: '/blog', changefreq: 'daily', priority: '0.8' },
    { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
    { path: '/terms', changefreq: 'yearly', priority: '0.3' },
];

// Helper: format date to W3C format (YYYY-MM-DD)
const formatDate = (date) => {
    if (!date) return new Date().toISOString().split('T')[0];
    return new Date(date).toISOString().split('T')[0];
};

// GET /api/sitemap.xml — Dynamic sitemap
router.get('/', async (req, res) => {
    try {
        // Dynamically determine domain from request to match GSC property host
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'บ้านเก็บของ.com';
        const siteUrl = process.env.SITE_URL || `${protocol}://${host}`;

        // 1. Fetch all active products
        const [products] = await db.query(
            `SELECT slug, id, name, image_url, updated_at FROM products WHERE is_active = 1 
               AND NOT EXISTS (
                   SELECT 1 FROM categories c
                   WHERE c.is_active = false
                     AND (category = c.name OR (categories IS NOT NULL AND JSON_CONTAINS(categories, JSON_QUOTE(c.name))))
               )
             ORDER BY sort_order ASC, id DESC`
        );

        // 2. Fetch active categories
        let categories = [];
        try {
            const [catRows] = await db.query(`SELECT name FROM categories WHERE is_active = 1`);
            categories = catRows;
        } catch (e) {}

        // 3. Fetch all published projects
        const [projects] = await db.query(
            `SELECT id, title, cover_image, updated_at FROM projects WHERE is_published = 1 ORDER BY created_at DESC`
        );

        // 4. Fetch all published articles
        let articles = [];
        try {
            const [articleRows] = await db.query(
                `SELECT slug, id, title, cover_image, updated_at FROM articles WHERE is_published = 1 ORDER BY created_at DESC`
            );
            articles = articleRows;
        } catch (e) {}

        // 5. Build XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
        xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

        // Static pages
        for (const page of STATIC_PAGES) {
            xml += `  <url>\n`;
            xml += `    <loc>${siteUrl}${page.path}</loc>\n`;
            xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
            xml += `    <priority>${page.priority}</priority>\n`;
            xml += `  </url>\n`;
        }

        // Category pages
        for (const cat of categories) {
            xml += `  <url>\n`;
            xml += `    <loc>${siteUrl}/products?category=${encodeURIComponent(cat.name)}</loc>\n`;
            xml += `    <changefreq>daily</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += `  </url>\n`;
        }

        // Product pages
        for (const product of products) {
            const productPath = product.slug || product.id;
            xml += `  <url>\n`;
            xml += `    <loc>${siteUrl}/products/${encodeURI(productPath)}</loc>\n`;
            if (product.updated_at) {
                xml += `    <lastmod>${formatDate(product.updated_at)}</lastmod>\n`;
            }
            xml += `    <changefreq>weekly</changefreq>\n`;
            xml += `    <priority>0.9</priority>\n`;
            if (product.image_url) {
                const imgLoc = product.image_url.startsWith('http') ? product.image_url : `${siteUrl}${product.image_url}`;
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${imgLoc}</image:loc>\n`;
                xml += `      <image:title>${product.name.replace(/[<>&'"]/g, '')}</image:title>\n`;
                xml += `    </image:image>\n`;
            }
            xml += `  </url>\n`;
        }

        // Project pages
        for (const project of projects) {
            xml += `  <url>\n`;
            xml += `    <loc>${siteUrl}/projects/${project.id}</loc>\n`;
            xml += `    <lastmod>${formatDate(project.updated_at)}</lastmod>\n`;
            xml += `    <changefreq>monthly</changefreq>\n`;
            xml += `    <priority>0.7</priority>\n`;
            if (project.cover_image) {
                const imgLoc = project.cover_image.startsWith('http') ? project.cover_image : `${siteUrl}${project.cover_image}`;
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${imgLoc}</image:loc>\n`;
                xml += `      <image:title>${project.title.replace(/[<>&'"]/g, '')}</image:title>\n`;
                xml += `    </image:image>\n`;
            }
            xml += `  </url>\n`;
        }

        // Article pages
        for (const article of articles) {
            const articlePath = article.slug || article.id;
            xml += `  <url>\n`;
            xml += `    <loc>${siteUrl}/blog/${encodeURI(articlePath)}</loc>\n`;
            xml += `    <lastmod>${formatDate(article.updated_at)}</lastmod>\n`;
            xml += `    <changefreq>monthly</changefreq>\n`;
            xml += `    <priority>0.8</priority>\n`;
            if (article.cover_image) {
                const imgLoc = article.cover_image.startsWith('http') ? article.cover_image : `${siteUrl}${article.cover_image}`;
                xml += `    <image:image>\n`;
                xml += `      <image:loc>${imgLoc}</image:loc>\n`;
                xml += `      <image:title>${article.title.replace(/[<>&'"]/g, '')}</image:title>\n`;
                xml += `    </image:image>\n`;
            }
            xml += `  </url>\n`;
        }

        xml += `</urlset>`;

        // Save physical sitemap.xml to public folder as a static fallback for Nginx / cPanel static file serving
        try {
            const publicPath = path.join(__dirname, '../public/sitemap.xml');
            fs.writeFileSync(publicPath, xml, 'utf8');
        } catch (fsErr) {
            // Ignore write errors if directory is read-only
        }

        // Ensure IndexNow key file exists for Bing Webmaster Tools
        try {
            const { ensureKeyFile } = require('../services/indexNowService');
            ensureKeyFile();
        } catch (e) {}

        // Set headers
        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 hour
        res.status(200).send(xml);

        console.log(`📍 Sitemap generated: ${STATIC_PAGES.length} static + ${products.length} products + ${projects.length} projects + ${articles.length} articles`);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>');
    }
});

// GET /api/sitemap/ping-bing — Ping Bing via IndexNow API
router.get(['/ping-bing', '/api/sitemap/ping-bing'], async (req, res) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'บ้านเก็บของ.com';
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

module.exports = router;
