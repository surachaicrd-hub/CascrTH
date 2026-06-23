const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Simple in-memory rate limiter by IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // max 3 submissions per minute per IP
const MIN_SUBMIT_TIME = 3000; // form must be open at least 3 seconds

// Cleanup rate limit map periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap) {
        if (now - val.firstAttempt > RATE_LIMIT_WINDOW) {
            rateLimitMap.delete(key);
        }
    }
}, 60 * 1000);

router.post('/', async (req, res) => {
    try {
        const { name, email, phone, message, website, _ts, captchaAnswer, captchaConfig } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

        // 0. CAPTCHA Validation
        if (!captchaAnswer || !captchaConfig) {
            return res.status(400).json({ success: false, error: 'กรุณายืนยันว่าคุณไม่ใช่บอท' });
        }

        const expectedAnswer = Number(captchaConfig.num1) + Number(captchaConfig.num2);
        if (Number(captchaAnswer) !== expectedAnswer) {
            return res.status(400).json({ success: false, error: 'คำตอบการยืนยันไม่ถูกต้อง' });
        }

        // 1. Honeypot check — if "website" field is filled, it's a bot
        if (website) {
            // Respond with success to avoid tipping off bot
            console.log(`[SPAM BLOCKED] Honeypot triggered from IP: ${ip}`);
            return res.status(200).json({ success: true });
        }

        // 2. Time-based check — form was submitted too quickly
        if (_ts) {
            const elapsed = Date.now() - Number(_ts);
            if (elapsed < MIN_SUBMIT_TIME) {
                console.log(`[SPAM BLOCKED] Too fast (${elapsed}ms) from IP: ${ip}`);
                return res.status(200).json({ success: true });
            }
        }

        // 3. Rate limiting by IP
        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, { count: 1, firstAttempt: Date.now() });
        } else {
            const entry = rateLimitMap.get(ip);
            if (Date.now() - entry.firstAttempt < RATE_LIMIT_WINDOW) {
                entry.count++;
                if (entry.count > RATE_LIMIT_MAX) {
                    console.log(`[SPAM BLOCKED] Rate limit exceeded from IP: ${ip}`);
                    return res.status(429).json({ success: false, error: 'กรุณารอสักครู่ก่อนส่งข้อความอีกครั้ง' });
                }
            } else {
                // Reset window
                rateLimitMap.set(ip, { count: 1, firstAttempt: Date.now() });
            }
        }

        // 4. Basic validation
        if (!name || !email || !phone || !message) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        if (name.length > 200 || email.length > 200 || phone.length > 100 || message.length > 5000) {
            return res.status(400).json({ success: false, error: 'ข้อมูลเกินขนาดที่กำหนด' });
        }

        // 5. Simple content checks
        const spamPatterns = /\b(viagra|casino|porn|xxx|crypto|bitcoin|lottery|winner|click here|free money)\b/i;
        if (spamPatterns.test(message) || spamPatterns.test(name)) {
            console.log(`[SPAM BLOCKED] Content pattern match from IP: ${ip}`);
            return res.status(200).json({ success: true });
        }

        // URL spam check — too many URLs in message is suspicious
        const urlCount = (message.match(/https?:\/\//g) || []).length;
        if (urlCount > 3) {
            console.log(`[SPAM BLOCKED] Too many URLs (${urlCount}) from IP: ${ip}`);
            return res.status(200).json({ success: true });
        }

        // 6. Save to database
        await db.execute(
            'INSERT INTO contact_submissions (name, email, phone, message, ip_address, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [name.trim(), email.trim(), phone.trim(), message.trim(), ip]
        );

        // Notify admins asynchronously (don't block the response)
        const { notifyAdmins } = require('../services/notificationService');
        notifyAdmins('contact', { name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() }).catch(console.error);

        res.status(200).json({ success: true, message: 'ส่งข้อความสำเร็จ' });

    } catch (error) {
        console.error('Contact submit error:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง' });
    }
});

module.exports = router;
