const express = require('express');
const router = express.Router();
const db = require('../config/database');
const gemini = require('../services/geminiService');
const { verifyAdmin, verifyApiToken } = require('./auth');

// Initialize page_visits table
(async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS page_visits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(100) NOT NULL,
                page_path VARCHAR(500) NOT NULL,
                page_title VARCHAR(500),
                referrer VARCHAR(1000),
                utm_source VARCHAR(200),
                utm_medium VARCHAR(200),
                utm_campaign VARCHAR(200),
                device_type ENUM('desktop','tablet','mobile') DEFAULT 'desktop',
                browser VARCHAR(100),
                os VARCHAR(100),
                screen_width INT,
                screen_height INT,
                language VARCHAR(20),
                country VARCHAR(100),
                time_on_page INT DEFAULT 0,
                scroll_depth INT DEFAULT 0,
                is_bounce BOOLEAN DEFAULT TRUE,
                ip_address VARCHAR(100),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_session (session_id),
                INDEX idx_created (created_at),
                INDEX idx_page (page_path),
                INDEX idx_device (device_type)
            )
        `);
        console.log('page_visits table ready');
    } catch (error) {
        console.error('Error creating page_visits table:', error);
    }
})();

// POST - Record a page visit (public, no auth)
router.post('/pageview', async (req, res) => {
    try {
        const {
            sessionId, pagePath, pageTitle, referrer,
            utmSource, utmMedium, utmCampaign,
            deviceType, browser, os,
            screenWidth, screenHeight, language
        } = req.body || {};

        if (!sessionId || !pagePath) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || '';

        await db.execute(
            `INSERT INTO page_visits 
             (session_id, page_path, page_title, referrer, utm_source, utm_medium, utm_campaign,
              device_type, browser, os, screen_width, screen_height, language, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                sessionId, pagePath, pageTitle || null, referrer || null,
                utmSource || null, utmMedium || null, utmCampaign || null,
                deviceType || 'desktop', browser || null, os || null,
                screenWidth || null, screenHeight || null, language || null,
                ip, userAgent
            ]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Analytics pageview error:', error);
        res.status(500).json({ success: false });
    }
});

// POST - Update time on page / scroll depth (heartbeat)
router.post('/heartbeat', async (req, res) => {
    try {
        const { sessionId, pagePath, timeOnPage, scrollDepth } = req.body || {};

        if (!sessionId || !pagePath) {
            return res.status(400).json({ success: false });
        }

        await db.execute(
            `UPDATE page_visits 
             SET time_on_page = GREATEST(COALESCE(time_on_page, 0), ?), 
                 scroll_depth = GREATEST(COALESCE(scroll_depth, 0), ?),
                 is_bounce = FALSE
             WHERE session_id = ? AND page_path = ?
             ORDER BY created_at DESC LIMIT 1`,
            [timeOnPage || 0, scrollDepth || 0, sessionId, pagePath]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Analytics heartbeat error:', error);
        res.status(500).json({ success: false });
    }
});

// GET - Admin dashboard stats
router.get('/stats', verifyAdmin, async (req, res) => {
    try {
        const period = req.query.period || 'today';
        let dateFilter = '';

        switch (period) {
            case 'today':
                dateFilter = 'AND DATE(created_at) = CURDATE()';
                break;
            case 'week':
                dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
                break;
            case 'month':
                dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
                break;
            default:
                dateFilter = '';
        }

        // Total pageviews
        const [pvRows] = await db.query(
            `SELECT COUNT(*) as total_pageviews, 
                    COUNT(DISTINCT session_id) as unique_sessions,
                    AVG(time_on_page) as avg_time_on_page,
                    AVG(scroll_depth) as avg_scroll_depth,
                    SUM(is_bounce) / COUNT(*) * 100 as bounce_rate
             FROM page_visits WHERE 1=1 ${dateFilter}`
        );

        // Top pages
        const [topPages] = await db.query(
            `SELECT page_path, page_title, COUNT(*) as views, 
                    COUNT(DISTINCT session_id) as unique_visitors
             FROM page_visits WHERE 1=1 ${dateFilter}
             GROUP BY page_path, page_title ORDER BY views DESC LIMIT 10`
        );

        // Top products (Interest)
        const [topProducts] = await db.query(
            `SELECT page_path, page_title, COUNT(*) as views, 
                    COUNT(DISTINCT session_id) as unique_visitors
             FROM page_visits WHERE 1=1 ${dateFilter}
             AND page_path LIKE '/products/%' AND page_path != '/products'
             GROUP BY page_path, page_title ORDER BY views DESC LIMIT 10`
        );

        // Top wishlisted products
        let wishlistDateFilter = dateFilter.replace(/created_at/g, 'w.created_at');
        const [topWishlisted] = await db.query(
            `SELECT p.id, p.name as page_title, p.category, p.image_url as image, COUNT(w.product_id) as saves 
             FROM wishlists w 
             JOIN products p ON w.product_id = p.id 
             WHERE 1=1 ${wishlistDateFilter} 
             GROUP BY p.id, p.name, p.category, p.image_url 
             ORDER BY saves DESC LIMIT 10`
        );

        // Device breakdown
        const [devices] = await db.query(
            `SELECT device_type, COUNT(*) as count 
             FROM page_visits WHERE 1=1 ${dateFilter}
             GROUP BY device_type ORDER BY count DESC`
        );

        // Browser breakdown
        const [browsers] = await db.query(
            `SELECT browser, COUNT(*) as count 
             FROM page_visits WHERE 1=1 ${dateFilter}
             GROUP BY browser ORDER BY count DESC LIMIT 5`
        );

        // Referrer breakdown
        const [referrers] = await db.query(
            `SELECT COALESCE(referrer, 'Direct') as source, COUNT(*) as count 
             FROM page_visits WHERE 1=1 ${dateFilter}
             GROUP BY referrer ORDER BY count DESC LIMIT 10`
        );

        // Hourly distribution (for today)
        const [hourly] = await db.query(
            `SELECT HOUR(created_at) as hour, COUNT(*) as count
             FROM page_visits WHERE DATE(created_at) = CURDATE()
             GROUP BY HOUR(created_at) ORDER BY hour`
        );

        res.json({
            success: true,
            data: {
                summary: pvRows[0],
                topPages,
                topProducts,
                topWishlisted,
                devices,
                browsers,
                referrers,
                hourly
            }
        });
    } catch (error) {
        console.error('Analytics stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});

// POST - Generate AI Insights from stats
router.post('/ai-insights', verifyAdmin, async (req, res) => {
    try {
        const { stats, period } = req.body || {};
        if (!stats) return res.status(400).json({ success: false, error: 'Stats data is required' });

        const prompt = `
        You are an expert AI Marketing Consultant for an e-commerce platform called "Morespace".
        Analyze the following analytics data for the period "${period}" and provide insightful, actionable marketing advice in Thai.
        
        Data:
        ${JSON.stringify(stats, null, 2)}
        
        Focus on:
        1. "trends": 2-3 positive or interesting observations (e.g., high traffic sources, popular products).
        2. "warnings": 1-2 points of concern (e.g., high bounce rate on specific pages, low mobile engagement).
        3. "recommendations": 2-3 specific, actionable marketing strategies the admin should apply based on this exact data.
        
        Format your response EXACTLY as the following JSON structure without markdown wrappers:
        {
          "trends": ["trend 1...", "trend 2..."],
          "warnings": ["warning 1..."],
          "recommendations": ["recommendation 1...", "recommendation 2..."]
        }
        `;

        const response = await gemini.generateContent({
            prompt,
            label: 'AI Request'
        });

        
        const cleanedText = response.text.replace(/`|json/g, '').trim();
        
        try {
            const insights = JSON.parse(cleanedText);
            res.json({ success: true, data: insights });
        } catch (parseError) {
            console.error("Failed to parse AI response:", cleanedText);
            res.status(500).json({ success: false, error: 'Invalid AI response format' });
        }

    } catch (error) {
        console.error('AI Insights generation error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate insights: ' + error.message });
    }
});

// GET /api/analytics/export
// Export raw website analytics to external systems with apikey auth
router.get('/export', verifyApiToken, async (req, res) => {
    try {
        const { startDate, endDate, pagePath } = req.query;

        let query = 'SELECT * FROM page_visits WHERE 1=1';
        const queryParams = [];

        if (pagePath) {
            query += ' AND page_path LIKE ?';
            queryParams.push(`%${pagePath}%`);
        }

        if (startDate) {
            query += ' AND created_at >= ?';
            queryParams.push(`${startDate} 00:00:00`);
        }

        if (endDate) {
            query += ' AND created_at <= ?';
            queryParams.push(`${endDate} 23:59:59`);
        }

        query += ' ORDER BY created_at DESC LIMIT 5000';

        const [rows] = await db.query(query, queryParams);

        res.json({
            success: true,
            count: rows.length,
            generated_at: new Date(),
            analytics: rows
        });

    } catch (error) {
        console.error('Export Analytics Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error during export' });
    }
});

module.exports = router;
