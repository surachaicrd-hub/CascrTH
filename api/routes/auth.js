const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const {
    sendAdminLoginNotification,
    sendAdminPasswordChangedNotification
} = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET;

const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
    message: { success: false, error: 'Too many login attempts from this IP, please try again after 15 minutes' },
    skip: (req, res) => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
});

// Login route
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password required' });
        }

        const [rows] = await db.query('SELECT * FROM admins WHERE username = ?', [username]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const admin = rows[0];

        // Check password with bcrypt (supports auto-migration from plaintext)
        let passwordValid = false;
        if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
            // Already hashed — use bcrypt.compare
            passwordValid = await bcrypt.compare(password, admin.password);
        } else {
            // Legacy plaintext — compare directly then auto-migrate to hashed
            passwordValid = (password === admin.password);
            if (passwordValid) {
                const hashedPassword = await bcrypt.hash(password, 12);
                await db.query('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, admin.id]);
                console.log(`🔒 Auto-migrated admin "${admin.username}" password to bcrypt hash`);
            }
        }

        if (!passwordValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: admin.id, username: admin.username, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send admin login email notification asynchronously
        try {
            const [settingsRows] = await db.query(
                "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('notify_email_enabled', 'notify_email_address')"
            );
            const settings = {};
            settingsRows.forEach(r => settings[r.setting_key] = r.setting_value);
            
            if (settings.notify_email_enabled === 'true' && settings.notify_email_address) {
                let recipientEmails = settings.notify_email_address;
                if (admin.username && admin.username.includes('@')) {
                    recipientEmails += `,${admin.username}`;
                }
                sendAdminLoginNotification(admin.username, admin.name || 'ผู้ดูแลระบบ', recipientEmails);
            }
        } catch (err) {
            console.error('Failed to trigger admin login notification email:', err.message);
        }

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                name: admin.name || 'ผู้ดูแลระบบ',
                profile_image_url: admin.profile_image_url
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

// Middleware to verify JWT (Can be imported and used on protected API endpoints)
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ success: false, error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
};

// Get Profile
router.get('/profile', verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                a.id, a.username, a.name, a.profile_image_url, a.created_at,
                ans.email AS notification_email,
                COALESCE(ans.notify_quotation, 0) AS notify_quotation,
                COALESCE(ans.notify_contact, 0) AS notify_contact,
                COALESCE(ans.notify_order, 0) AS notify_order
            FROM admins a
            LEFT JOIN admin_notification_settings ans ON a.id = ans.admin_id
            WHERE a.id = ?
        `, [req.admin.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Fetch profile error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch profile' });
    }
});

// Update Profile
router.put('/profile', verifyAdmin, async (req, res) => {
    try {
        const { name, profile_image_url, password, new_password, notification_email, notify_quotation, notify_contact, notify_order } = req.body;

        // Fetch current admin to verify old password if trying to change it
        const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [req.admin.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }
        const admin = rows[0];

        let updateQuery = 'UPDATE admins SET name = ?, profile_image_url = ?';
        const queryParams = [name || admin.name, profile_image_url || null];

        // Handle password change
        if (new_password) {
            // Verify old password (supports both hashed and plaintext)
            let oldPasswordValid = false;
            if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
                oldPasswordValid = await bcrypt.compare(password, admin.password);
            } else {
                oldPasswordValid = (password === admin.password);
            }
            if (!password || !oldPasswordValid) {
                return res.status(401).json({ success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
            }
            const hashedNewPassword = await bcrypt.hash(new_password, 12);
            updateQuery += ', password = ?';
            queryParams.push(hashedNewPassword);
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(req.admin.id);

        await db.query(updateQuery, queryParams);

        // Update or insert notification settings
        if (notification_email !== undefined) {
            const [exist] = await db.query('SELECT id FROM admin_notification_settings WHERE admin_id = ?', [req.admin.id]);
            if (exist.length > 0) {
                await db.query(
                    'UPDATE admin_notification_settings SET email = ?, notify_quotation = ?, notify_contact = ?, notify_order = ? WHERE admin_id = ?',
                    [notification_email.trim(), notify_quotation ? 1 : 0, notify_contact ? 1 : 0, notify_order ? 1 : 0, req.admin.id]
                );
            } else if (notification_email) {
                await db.query(
                    'INSERT INTO admin_notification_settings (admin_id, email, notify_quotation, notify_contact, notify_order) VALUES (?, ?, ?, ?, ?)',
                    [req.admin.id, notification_email.trim(), notify_quotation ? 1 : 0, notify_contact ? 1 : 0, notify_order ? 1 : 0]
                );
            }
        }

        // Send admin password changed email notification asynchronously
        if (new_password) {
            try {
                const [settingsRows] = await db.query(
                    "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('notify_email_enabled', 'notify_email_address')"
                );
                const settings = {};
                settingsRows.forEach(r => settings[r.setting_key] = r.setting_value);
                
                if (settings.notify_email_enabled === 'true' && settings.notify_email_address) {
                    let recipientEmails = settings.notify_email_address;
                    if (admin.username && admin.username.includes('@')) {
                        recipientEmails += `,${admin.username}`;
                    }
                    sendAdminPasswordChangedNotification(admin.username, admin.name || 'ผู้ดูแลระบบ', recipientEmails, true);
                }
            } catch (err) {
                console.error('Failed to trigger admin password change notification email:', err.message);
            }
        }

        // Return updated admin info (excluding password)
        const [updatedRows] = await db.query(`
            SELECT 
                a.id, a.username, a.name, a.profile_image_url,
                ans.email AS notification_email,
                COALESCE(ans.notify_quotation, 0) AS notify_quotation,
                COALESCE(ans.notify_contact, 0) AS notify_contact,
                COALESCE(ans.notify_order, 0) AS notify_order
            FROM admins a
            LEFT JOIN admin_notification_settings ans ON a.id = ans.admin_id
            WHERE a.id = ?
        `, [req.admin.id]);

        res.json({
            success: true,
            message: 'อัปเดตข้อมูลโปรไฟล์เรียบร้อย',
            data: updatedRows[0]
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
});

// POST /api/admin/api-token
// Exchange API Key for a JWT token (temporary or permanent) for external systems
router.post('/api-token', async (req, res) => {
    try {
        const { api_key, type, name } = req.body;
        const EXPECTED_API_KEY = process.env.EXPORT_API_KEY;
        
        if (!api_key || api_key !== EXPECTED_API_KEY) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API Key' });
        }

        if (!name) {
            return res.status(400).json({ success: false, error: 'Token name is required' });
        }

        let tokenOptions = {};
        let expiresInValue = 'Permanent';
        let dbExpiresAt = null;

        if (type !== 'permanent') {
            // Default is temporary (2 hours)
            tokenOptions.expiresIn = '2h';
            expiresInValue = 7200; // 2 hours in seconds
            dbExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
        }

        const crypto = require('crypto');
        const tokenId = crypto.randomUUID();

        // Generate JWT for API access - include tokenId in payload
        const token = jwt.sign(
            { role: 'api_client', system: 'external', jti: tokenId },
            JWT_SECRET,
            tokenOptions
        );

        // Save token to database to allow tracking and revoking
        await db.query(
            'INSERT INTO api_tokens (id, name, token, type, expires_at) VALUES (?, ?, ?, ?, ?)',
            [tokenId, name, token, type || 'temporary', dbExpiresAt]
        );

        res.status(200).json({
            success: true,
            token: token,
            expires_in: expiresInValue,
            token_type: 'Bearer'
        });
    } catch (error) {
        console.error('API Token error:', error);
        res.status(500).json({ success: false, error: 'Token generation failed' });
    }
});

// GET /api/admin/api-tokens
// List all generated API tokens
router.get('/api-tokens', verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, token, type, created_at, expires_at FROM api_tokens ORDER BY created_at DESC'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch API tokens error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch tokens' });
    }
});

// DELETE /api/admin/api-tokens/:id
// Revoke an API token
router.delete('/api-tokens/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM api_tokens WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Token not found' });
        }
        
        res.json({ success: true, message: 'Token revoked successfully' });
    } catch (error) {
        console.error('Revoke API token error:', error);
        res.status(500).json({ success: false, error: 'Failed to revoke token' });
    }
});

// Middleware to verify API JWT token or query apikey
const verifyApiToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const queryApiKey = req.query.apikey;
    const EXPECTED_API_KEY = process.env.EXPORT_API_KEY;

    // Allow backward compatible query param auth
    if (queryApiKey && queryApiKey === EXPECTED_API_KEY) {
        return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Missing or Invalid Authorization Token. Provide Bearer token or ?apikey=' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.role !== 'api_client' && decoded.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Insufficient permissions' });
        }
        
        // Check if token exists in database whitelist (revocation check)
        // If the token corresponds to an api_client and has a jti, it must be in the db.
        if (decoded.role === 'api_client' && decoded.jti) {
            const [rows] = await db.query('SELECT id FROM api_tokens WHERE id = ?', [decoded.jti]);
            if (rows.length === 0) {
                 return res.status(401).json({ success: false, error: 'Token has been revoked or is invalid.' });
            }
        }

        req.api_client = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Token expired or invalid' });
    }
};

module.exports = { router, verifyAdmin, verifyApiToken, JWT_SECRET };
