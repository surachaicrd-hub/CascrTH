const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin } = require('./auth');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendAdminPasswordChangedNotification } = require('../services/emailService');

// Get all admin users
router.get('/', verifyAdmin, async (req, res) => {
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
            ORDER BY a.created_at ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Fetch admin users error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch admin users' });
    }
});

// Create a new admin user
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { username, password, name, profile_image_url, notification_email, notify_quotation, notify_contact, notify_order } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, error: 'Username and password required' });
        }

        // Check if username already exists
        const [existing] = await db.query('SELECT id FROM admins WHERE username = ?', [username]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Username already taken' });
        }

        const id = crypto.randomUUID();
        const hashedPassword = await bcrypt.hash(password, 12);
        await db.query(
            'INSERT INTO admins (id, username, password, name, profile_image_url) VALUES (?, ?, ?, ?, ?)',
            [id, username, hashedPassword, name || username, profile_image_url || null]
        );

        if (notification_email) {
            await db.query(
                'INSERT INTO admin_notification_settings (admin_id, email, notify_quotation, notify_contact, notify_order) VALUES (?, ?, ?, ?, ?)',
                [id, notification_email.trim(), notify_quotation ? 1 : 0, notify_contact ? 1 : 0, notify_order ? 1 : 0]
            );
        }

        res.status(201).json({ success: true, message: 'Admin user created' });
    } catch (error) {
        console.error('Create admin user error:', error);
        res.status(500).json({ success: false, error: 'Failed to create admin user' });
    }
});

// Update an admin user
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { password, name, profile_image_url, notification_email, notify_quotation, notify_contact, notify_order } = req.body;

        // Fetch user to edit
        const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }

        const targetAdmin = rows[0];

        // Protect main admin account from being edited by others unless they ARE the main admin
        // Even then, we only allow updating through the /profile route for the main admin. 
        // Here we just block editing the main admin from the user management interface totally.
        if (targetAdmin.username === 'admin') {
            return res.status(403).json({ success: false, error: 'ไม่สามารถแก้ไขบัญชีผู้ดูแลระบบหลักได้จากหน้านี้' });
        }

        let updateQuery = 'UPDATE admins SET name = ?, profile_image_url = ?';
        const queryParams = [name || targetAdmin.name, profile_image_url || targetAdmin.profile_image_url];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 12);
            updateQuery += ', password = ?';
            queryParams.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(id);

        await db.query(updateQuery, queryParams);

        // Update or insert notification settings
        if (notification_email !== undefined) {
            const [exist] = await db.query('SELECT id FROM admin_notification_settings WHERE admin_id = ?', [id]);
            if (exist.length > 0) {
                await db.query(
                    'UPDATE admin_notification_settings SET email = ?, notify_quotation = ?, notify_contact = ?, notify_order = ? WHERE admin_id = ?',
                    [notification_email.trim(), notify_quotation ? 1 : 0, notify_contact ? 1 : 0, notify_order ? 1 : 0, id]
                );
            } else if (notification_email) {
                await db.query(
                    'INSERT INTO admin_notification_settings (admin_id, email, notify_quotation, notify_contact, notify_order) VALUES (?, ?, ?, ?, ?)',
                    [id, notification_email.trim(), notify_quotation ? 1 : 0, notify_contact ? 1 : 0, notify_order ? 1 : 0]
                );
            }
        }

        // Send admin password changed email notification asynchronously
        if (password) {
            try {
                const [settingsRows] = await db.query(
                    "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('notify_email_enabled', 'notify_email_address')"
                );
                const settings = {};
                settingsRows.forEach(r => settings[r.setting_key] = r.setting_value);
                
                if (settings.notify_email_enabled === 'true' && settings.notify_email_address) {
                    let recipientEmails = settings.notify_email_address;
                    if (targetAdmin.username && targetAdmin.username.includes('@')) {
                        recipientEmails += `,${targetAdmin.username}`;
                    }
                    sendAdminPasswordChangedNotification(targetAdmin.username, targetAdmin.name || 'ผู้ดูแลระบบ', recipientEmails, false);
                }
            } catch (err) {
                console.error('Failed to trigger admin password change notification email:', err.message);
            }
        }

        res.json({ success: true, message: 'Admin user updated' });
    } catch (error) {
        console.error('Update admin user error:', error);
        res.status(500).json({ success: false, error: 'Failed to update admin user' });
    }
});

// Delete an admin user
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch user to delete
        const [rows] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Admin not found' });
        }

        const targetAdmin = rows[0];

        // Prevent deleting the main admin
        if (targetAdmin.username === 'admin') {
            return res.status(403).json({ success: false, error: 'ไม่สามารถลบบัญชีผู้ดูแลระบบหลักได้' });
        }

        // Prevent self-deletion
        if (id === req.admin.id) {
            return res.status(403).json({ success: false, error: 'คุณไม่สามารถลบบัญชีของตัวเองได้' });
        }

        await db.query('DELETE FROM admins WHERE id = ?', [id]);
        res.json({ success: true, message: 'Admin user deleted' });
    } catch (error) {
        console.error('Delete admin user error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete admin user' });
    }
});

module.exports = router;
