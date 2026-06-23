const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const { verifyAdmin, JWT_SECRET } = require('./auth');

// GET public settings (No Auth Required) - MUST be before /:key route
router.get('/public', async (req, res) => {
    try {
        // Prevent browser caching for settings to ensure admin updates show immediately
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

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
            'store_name', 'store_description', 'store_logo', 'store_favicon', 
            'store_address', 'store_tax_id', 'store_phone', 
            'warehouse_lat', 'warehouse_lng',
            'home_category_showcase', 'show_product_rating', 'show_product_review',
            'home_highlight_categories', 'home_show_highlight_categories',
            'home_section_titles', 'home_how_it_works', 'home_faq', 'home_projects_cta',
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
            'footer_newsletter_title', 'footer_newsletter_subtitle', 'footer_newsletter_privacy',
            'footer_trust_badges', 'footer_distributor_label', 'footer_distributor_url',
            'footer_sitemap_label', 'footer_sitemap_url',
            'ai_consultant_enabled'
        ];

        const placeholders = publicKeys.map(() => '?').join(',');
        const [rows] = await db.query(`SELECT setting_key, setting_value FROM settings WHERE setting_key IN (${placeholders})`, publicKeys);

        const settings = {};
        rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error('Fetch public settings error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch public settings' });
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

        let title = '🧪 ข้อความทดสอบจากระบบ Morespace';
        let text = 'นี่คือข้อความทดสอบเพื่อยืนยันว่าการตั้งค่าการแจ้งเตือนของคุณทำงานได้อย่างถูกต้องแล้ว 🎉';
        let htmlText = `
            <h2>${title}</h2>
            <p>${text}</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">ส่งจากระบบจัดการหลังบ้าน Morespace</p>
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
        const fromName = from || 'Morespace'
        await transporter.sendMail({
            from: `"${fromName}" <${user}>`,
            to: to || user,
            subject: '✅ ทดสอบ SMTP จากระบบ Morespace Admin',
            html: `
                <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
                    <h2 style="color:#059669">✅ การตั้งค่า SMTP ทำงานได้ปกติ!</h2>
                    <p>Email นี้ถูกส่งจากระบบจัดการหลังบ้าน Morespace เพื่อยืนยันว่าการตั้งค่า SMTP ของคุณถูกต้อง</p>
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
