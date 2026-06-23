const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../config/database');
const lineService = require('../services/lineService');

/**
 * LINE Webhook endpoint
 * Receives events from LINE Platform (follow, unfollow, message, etc.)
 * This route must NOT require admin auth — LINE servers need access.
 */

/**
 * Verify LINE webhook signature
 */
function verifySignature(channelSecret, body, signature) {
    if (!channelSecret || !signature) return false;
    const hash = crypto
        .createHmac('SHA256', channelSecret)
        .update(body)
        .digest('base64');
    return hash === signature;
}

// POST /api/line/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        // Get channel secret for verification
        const [credRows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'line_credentials'");
        let channelSecret = '';
        if (credRows.length > 0) {
            try {
                const creds = JSON.parse(credRows[0].setting_value);
                channelSecret = creds.channel_secret || '';
            } catch (e) {}
        }

        // Verify signature if channel secret is configured
        if (channelSecret) {
            const signature = req.headers['x-line-signature'];
            const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            if (!verifySignature(channelSecret, rawBody, signature)) {
                console.warn('[LINE Webhook] Invalid signature');
                return res.status(403).json({ error: 'Invalid signature' });
            }
        }

        // Parse body (may already be parsed or raw)
        let body;
        if (typeof req.body === 'string') {
            body = JSON.parse(req.body);
        } else if (Buffer.isBuffer(req.body)) {
            body = JSON.parse(req.body.toString());
        } else {
            body = req.body;
        }

        const events = body.events || [];
        console.log(`[LINE Webhook] Received ${events.length} event(s)`);

        // Process events asynchronously
        for (const event of events) {
            lineService.handleWebhookEvent(event).catch(err => {
                console.error('[LINE Webhook] Event processing error:', err.message);
            });
        }

        // Always respond 200 to LINE
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('[LINE Webhook] Error:', error.message);
        // Still respond 200 to prevent LINE from retrying
        res.status(200).json({ success: true });
    }
});

// ═══════════════════════════════════════════════
// Admin Routes (require authentication)
// ═══════════════════════════════════════════════
const { verifyAdmin } = require('./auth');

// GET /api/line/admin/credentials — get LINE credentials
router.get('/admin/credentials', verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'line_credentials'");
        let creds = { channel_id: '', channel_secret: '', channel_access_token: '' };
        if (rows.length > 0) {
            try { creds = { ...creds, ...JSON.parse(rows[0].setting_value) }; } catch (e) {}
        }
        
        res.json({ success: true, credentials: {
            channel_id: creds.channel_id || '',
            channel_secret: creds.channel_secret || '',
            channel_access_token: creds.channel_access_token || '',
            is_configured: !!(creds.channel_access_token)
        } });
    } catch (error) {
        console.error('Get LINE credentials error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch credentials' });
    }
});

// POST /api/line/admin/credentials — save LINE credentials
router.post('/admin/credentials', verifyAdmin, async (req, res) => {
    try {
        const { channel_id, channel_secret, channel_access_token } = req.body;

        // Read existing and merge (so user can update partially)
        const [existing] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'line_credentials'");
        let current = { channel_id: '', channel_secret: '', channel_access_token: '' };
        if (existing.length > 0) {
            try { current = JSON.parse(existing[0].setting_value); } catch (e) {}
        }

        const updated = {
            channel_id: channel_id !== undefined ? channel_id : current.channel_id,
            channel_secret: channel_secret !== undefined ? channel_secret : current.channel_secret,
            channel_access_token: channel_access_token !== undefined ? channel_access_token : current.channel_access_token
        };

        await db.query(
            "INSERT INTO settings (setting_key, setting_value) VALUES ('line_credentials', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [JSON.stringify(updated), JSON.stringify(updated)]
        );

        res.json({ success: true, message: 'LINE credentials saved' });
    } catch (error) {
        console.error('Save LINE credentials error:', error);
        res.status(500).json({ success: false, error: 'Failed to save credentials' });
    }
});

// GET /api/line/admin/automation — get automation config
router.get('/admin/automation', verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'line_automation_config'");
        let config = { enabled: false, frequency_days: 15, time: '10:00', last_sent_date: null };
        if (rows.length > 0) {
            try { config = { ...config, ...JSON.parse(rows[0].setting_value) }; } catch (e) {}
        }
        res.json({ success: true, config });
    } catch (error) {
        console.error('Get LINE automation config error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch config' });
    }
});

// POST /api/line/admin/automation — save automation config
router.post('/admin/automation', verifyAdmin, async (req, res) => {
    try {
        const { enabled, frequency_days, time } = req.body;

        const [existing] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'line_automation_config'");
        let current = { enabled: false, frequency_days: 15, time: '10:00', last_sent_date: null };
        if (existing.length > 0) {
            try { current = JSON.parse(existing[0].setting_value); } catch (e) {}
        }

        const updated = {
            enabled: enabled !== undefined ? !!enabled : current.enabled,
            frequency_days: frequency_days || current.frequency_days || 15,
            time: time || current.time || '10:00',
            last_sent_date: current.last_sent_date
        };

        await db.query(
            "INSERT INTO settings (setting_key, setting_value) VALUES ('line_automation_config', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [JSON.stringify(updated), JSON.stringify(updated)]
        );

        // Re-init cron
        const { initLineCron } = require('../services/lineCronService');
        await initLineCron();

        res.json({ success: true, message: 'LINE automation config saved' });
    } catch (error) {
        console.error('Save LINE automation config error:', error);
        res.status(500).json({ success: false, error: 'Failed to save config' });
    }
});

// POST /api/line/admin/automation/test — send test broadcast
router.post('/admin/automation/test', verifyAdmin, async (req, res) => {
    try {
        const { user_id } = req.body;
        const { processLineBroadcast } = require('../services/lineCronService');
        const result = await processLineBroadcast(true, user_id || null);

        if (result.success) {
            res.json({ success: true, message: 'Test broadcast processed', ...result });
        } else {
            res.status(400).json({ success: false, error: result.error || 'Failed' });
        }
    } catch (error) {
        console.error('Test LINE broadcast error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/line/admin/users — list LINE users stored in our DB
router.get('/admin/users', verifyAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search?.trim() || '';
        const status = req.query.status || '';

        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (display_name LIKE ? OR line_user_id LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (status === 'active') {
            whereClause += ' AND is_active = 1';
        } else if (status === 'inactive') {
            whereClause += ' AND is_active = 0';
        }

        const [countResult] = await db.query(`SELECT COUNT(*) as total FROM line_users ${whereClause}`, params);
        const total = countResult[0].total;

        const [rows] = await db.query(
            `SELECT * FROM line_users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const [statsResult] = await db.query(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
                SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as this_week
            FROM line_users
        `);

        res.json({
            success: true,
            data: rows,
            total,
            totalPages: Math.ceil(total / limit),
            page,
            stats: statsResult[0]
        });
    } catch (error) {
        console.error('List LINE users error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch LINE users' });
    }
});

// DELETE /api/line/admin/users/:id — remove a LINE user
router.delete('/admin/users/:id', verifyAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM line_users WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบรายการนี้' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Delete LINE user error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
});

// GET /api/line/admin/quota — get LINE message quota info
router.get('/admin/quota', verifyAdmin, async (req, res) => {
    try {
        const quota = await lineService.getMessageQuota();
        const followerCount = await lineService.getFollowerCount();
        res.json({ success: true, quota, followerCount });
    } catch (error) {
        console.error('Get LINE quota error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
