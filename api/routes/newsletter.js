const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin, verifyApiToken } = require('./auth');

// POST - Subscribe to newsletter (public)
router.post('/', async (req, res) => {
    try {
        const { email, honeypot, timestamp } = req.body;

        if (honeypot) {
            return res.status(200).json({ success: true, message: 'Subscribed' });
        }

        if (timestamp) {
            const elapsed = Date.now() - Number(timestamp);
            if (elapsed < 2000) {
                return res.status(200).json({ success: true, message: 'Subscribed' });
            }
        }

        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุอีเมล' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [existing] = await db.query(
            'SELECT id FROM newsletter_subscribers WHERE email = ?',
            [normalizedEmail]
        );

        if (existing.length > 0) {
            return res.json({ success: true, message: 'อีเมลนี้ได้สมัครรับข่าวสารแล้ว' });
        }

        await db.execute(
            'INSERT INTO newsletter_subscribers (email, ip_address, subscribed_at) VALUES (?, ?, NOW())',
            [normalizedEmail, req.ip || req.connection?.remoteAddress || 'unknown']
        );

        res.json({ success: true, message: 'สมัครรับข่าวสารเรียบร้อยแล้ว!' });

        // Send confirmation email to subscriber asynchronously
        const { sendNewsletterSubscriptionEmail } = require('../services/emailService');
        sendNewsletterSubscriptionEmail(normalizedEmail).catch(console.error);

        // Notify admins asynchronously
        const { notifyAdmins } = require('../services/notificationService');
        notifyAdmins('newsletter', { email: normalizedEmail }).catch(console.error);
    } catch (error) {
        console.error('Newsletter subscribe error:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

// GET - Admin: list subscribers with pagination & search
router.get('/admin', verifyAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search?.trim() || '';

        let whereClause = '';
        let params = [];

        if (search) {
            whereClause = 'WHERE email LIKE ?';
            params.push(`%${search}%`);
        }

        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM newsletter_subscribers ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        const [statsResult] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
                SUM(CASE WHEN subscribed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as this_week
            FROM newsletter_subscribers
        `);

        const [rows] = await db.query(
            `SELECT * FROM newsletter_subscribers ${whereClause} ORDER BY subscribed_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({
            success: true,
            data: rows,
            total,
            totalPages: Math.ceil(total / limit),
            page,
            stats: statsResult[0]
        });
    } catch (error) {
        console.error('Admin newsletter list error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch subscribers' });
    }
});

// DELETE - Admin: remove subscriber
router.delete('/admin/:id', verifyAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM newsletter_subscribers WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบรายการนี้' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Delete subscriber error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete subscriber' });
    }
});

// PATCH - Admin: toggle active status
router.patch('/admin/:id/toggle', verifyAdmin, async (req, res) => {
    try {
        await db.query('UPDATE newsletter_subscribers SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Toggle subscriber error:', error);
        res.status(500).json({ success: false, error: 'Failed to toggle subscriber' });
    }
});

// GET - Admin: export all emails as CSV
router.get('/admin/export', verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT email, is_active, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC');
        const csv = 'email,is_active,subscribed_at\n' + rows.map(r => `${r.email},${r.is_active},${r.subscribed_at}`).join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=newsletter_subscribers.csv');
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, error: 'Failed to export' });
    }
});

// GET /api/newsletter/export
// Export newsletter subscribers to external systems with apikey auth
router.get('/export', verifyApiToken, async (req, res) => {
    try {
        const { startDate, endDate, isActive } = req.query;

        let query = 'SELECT * FROM newsletter_subscribers WHERE 1=1';
        const queryParams = [];

        if (isActive !== undefined) {
            query += ' AND is_active = ?';
            queryParams.push(isActive === 'true' || isActive === '1' ? 1 : 0);
        }

        if (startDate) {
            query += ' AND subscribed_at >= ?';
            queryParams.push(`${startDate} 00:00:00`);
        }

        if (endDate) {
            query += ' AND subscribed_at <= ?';
            queryParams.push(`${endDate} 23:59:59`);
        }

        query += ' ORDER BY subscribed_at DESC';

        const [rows] = await db.query(query, queryParams);

        res.json({
            success: true,
            count: rows.length,
            generated_at: new Date(),
            subscribers: rows
        });

    } catch (error) {
        console.error('Export Newsletters Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error during export' });
    }
});

// ═══════════════════════════════════════════════
// Automated Campaign Routes (Admin Only)
// ═══════════════════════════════════════════════

router.get('/admin/automation', verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'newsletter_automation_config'");
        let config = { enabled: false, time: '09:00', product_ids: [], last_sent_index: 0 };
        if (rows.length > 0) {
            config = { ...config, ...JSON.parse(rows[0].setting_value) };
        }
        res.json({ success: true, config });
    } catch (error) {
        console.error('Get automation config error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch automation config' });
    }
});

router.post('/admin/automation', verifyAdmin, async (req, res) => {
    try {
        const { enabled, time, product_ids, last_sent_index } = req.body;
        
        // Ensure format is stringified correctly
        const configStr = JSON.stringify({
            enabled: !!enabled,
            time: time || '09:00',
            product_ids: Array.isArray(product_ids) ? product_ids : [],
            last_sent_index: last_sent_index || 0
        });

        // Insert or update
        const [existing] = await db.query("SELECT setting_key FROM settings WHERE setting_key = 'newsletter_automation_config'");
        if (existing.length > 0) {
            await db.query("UPDATE settings SET setting_value = ? WHERE setting_key = 'newsletter_automation_config'", [configStr]);
        } else {
            await db.query("INSERT INTO settings (setting_key, setting_value) VALUES ('newsletter_automation_config', ?)", [configStr]);
        }

        // Re-init cron if enabled
        const { initNewsletterCron } = require('../services/newsletterCronService');
        await initNewsletterCron();

        res.json({ success: true, message: 'Settings saved' });
    } catch (error) {
        console.error('Save automation config error:', error);
        res.status(500).json({ success: false, error: 'Failed to save config' });
    }
});

router.post('/admin/automation/test', verifyAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, error: 'Test email required' });

        const { processNewsletter } = require('../services/newsletterCronService');
        const result = await processNewsletter(true, email);
        
        if (result.success) {
            res.json({ success: true, message: 'Test email sent successfully', ...result });
        } else {
            res.status(400).json({ success: false, error: result.error || 'Failed to send test email' });
        }
    } catch (error) {
        console.error('Test automation error:', error);
        res.status(500).json({ success: false, error: 'Failed to trigger test' });
    }
});

module.exports = router;
