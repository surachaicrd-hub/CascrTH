const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create avatars directory if it doesn't exist
const avatarsDir = path.join(__dirname, '../public/uploads/avatars');
if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}

// Helper: Download and cache avatar locally
const downloadAndCacheAvatar = async (url, googleId) => {
    try {
        if (!url) return null;
        if (url.startsWith('/uploads')) return url; // Already local

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch avatar: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const filename = `avatar-google-${googleId}-${Date.now()}.webp`;
        const filepath = path.join(avatarsDir, filename);

        await sharp(buffer)
            .resize(200, 200, { fit: 'cover' })
            .webp({ quality: 80 })
            .toFile(filepath);

        return `/uploads/avatars/${filename}`;
    } catch (error) {
        console.error('Error caching avatar:', error);
        return url; // fallback to original URL
    }
};

const router = express.Router();

// ==========================================
// 🛡️ Security: Rate Limiters
// ==========================================
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10, // Limit each IP to 10 requests per windowMs
    message: { success: false, error: 'พยายามเข้าสู่ระบบ/สมัครสมาชิกมากเกินไป กรุณารอ 15 นาที' },
    skip: (req, res) => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
});

// ==========================================
// 📧 Email Services
// ==========================================
const { 
    sendVerificationEmail, 
    sendForgotPasswordEmail, 
    sendLoginNotification,
    sendPasswordChangedEmail,
    sendPasswordResetSuccessEmail
} = require('../services/emailService');

// ==========================================
// 🔑 Helper Functions
// ==========================================
const generateToken = (userId, role = 'customer') => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

const verifyCustomer = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'ไม่พบ Token กรุณาเข้าสู่ระบบ' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role !== 'customer') {
            return res.status(403).json({ success: false, error: 'สิทธิ์ไม่เพียงพอ (ไม่ใช่ Customer)' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};

// ==========================================
// 🚀 Routes
// ==========================================

// [POST] /api/users/register - สมัครสมาชิกลูกค้า (ด้วย Email)
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone, source } = req.body;

        if (!email || !password || !first_name) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (Email, Password, First Name)' });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'อีเมลนี้มีอยู่ในระบบแล้ว กรุณาไปที่หน้าเข้าสู่ระบบ' });
        }

        const id = uuidv4();
        const verificationToken = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO users (id, email, password, first_name, last_name, phone, verification_token, is_email_verified, registration_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, email, hashedPassword, first_name, last_name, phone || null, verificationToken, false, source || 'organic']
        );

        // Send email asynchronously
        const frontendBaseUrl = req.headers.origin || 'http://localhost:5173';
        sendVerificationEmail(email, verificationToken, frontendBaseUrl);

        const token = generateToken(id);

        res.status(201).json({
            success: true,
            data: {
                id, email, first_name, last_name, token, is_email_verified: 0
            },
            message: 'สมัครสมาชิกสำเร็จ ตรวจสอบกล่องข้อความเพื่อยืนยันอีเมล'
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
    }
});

// [POST] /api/users/login - เข้าสู่ระบบ (Email)
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0 || !users[0].password) {
            return res.status(401).json({ success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง (หรือล็อกอินด้วย Social)' });
        }

        const user = users[0];

        // Check if user is blacklisted
        if (user.is_blacklisted) {
            return res.status(403).json({ success: false, error: 'บัญชีผู้ใช้ของคุณถูกระงับการใช้งาน กรุณาติดต่อเจ้าหน้าที่' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const token = generateToken(user.id);

        sendLoginNotification(user.email, user.first_name, 'Email');

        res.json({
            success: true,
            data: {
                id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, avatar_url: user.avatar_url, is_email_verified: user.is_email_verified, token
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
});

// [POST] /api/users/verify-email
router.post('/verify-email', authLimiter, async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, error: 'ไม่พบรหัสยืนยัน' });

        const [users] = await db.query('SELECT id, is_email_verified FROM users WHERE verification_token = ?', [token]);
        if (users.length === 0) return res.status(400).json({ success: false, error: 'รหัสยืนยันไม่ถูกต้องหรือใช้งานไปแล้ว' });

        if (users[0].is_email_verified) {
            return res.status(200).json({ success: true, message: 'อีเมลนี้ได้รับการยืนยันเรียบร้อยแล้ว' });
        }

        await db.query('UPDATE users SET is_email_verified = ?, verification_token = NULL WHERE id = ?', [true, users[0].id]);

        res.json({ success: true, message: 'ยืนยันอีเมลสำเร็จ ขอบคุณที่เข้าร่วมกับเรา' });
    } catch (err) {
        console.error('Email verification error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการยืนยันอีเมล' });
    }
});

// [POST] /api/users/resend-verification
router.post('/resend-verification', authLimiter, verifyCustomer, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, email, is_email_verified FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้' });

        const user = users[0];
        if (user.is_email_verified) return res.status(400).json({ success: false, error: 'อีเมลนี้ถูกยืนยันไปแล้ว' });
        if (!user.email) return res.status(400).json({ success: false, error: 'โปรดเพิ่มอีเมลก่อนส่งลิงก์ยืนยัน' });

        const verificationToken = uuidv4();
        await db.query('UPDATE users SET verification_token = ? WHERE id = ?', [verificationToken, req.user.id]);

        const frontendBaseUrl = req.headers.origin || 'http://localhost:5173';
        sendVerificationEmail(user.email, verificationToken, frontendBaseUrl);

        res.json({ success: true, message: 'ส่งลิงก์ยืนยันอีเมลไปอีกครั้งเรียบร้อยแล้ว' });
    } catch (err) {
        console.error('Resend verification error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการส่งอีเมล' });
    }
});

// [PUT] /api/users/email - เพิ่ม/เปลี่ยนอีเมล (สำหรับ Social Login หรือเปลี่ยนอีเมลใหม่)
router.put('/email', authLimiter, verifyCustomer, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว' });
        }

        const verificationToken = uuidv4();
        await db.query('UPDATE users SET email = ?, verification_token = ?, is_email_verified = 0 WHERE id = ?', [email, verificationToken, req.user.id]);

        const frontendBaseUrl = req.headers.origin || 'http://localhost:5173';
        sendVerificationEmail(email, verificationToken, frontendBaseUrl);

        // Fetch user profile again to return updated data
        const [updatedUsers] = await db.query('SELECT id, email, first_name, last_name, avatar_url, is_email_verified FROM users WHERE id = ?', [req.user.id]);
        const user = updatedUsers[0];
        const token = generateToken(user.id);

        res.json({
            success: true,
            message: 'เพิ่มอีเมลเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมายเพื่อยืนยันตัวตน',
            data: { ...user, token }
        });
    } catch (err) {
        console.error('Update email error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตอีเมล' });
    }
});

// [POST] /api/users/auth/google
router.post('/auth/google', authLimiter, async (req, res) => {
    try {
        const { credential, source } = req.body; // credential is the JWT from Google Identity Services

        // Fetch dynamic settings for Google Login
        const [settingsRows] = await db.query('SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?, ?)', ['google_login_enabled', 'google_client_id']);
        const settings = {};
        settingsRows.forEach(r => settings[r.setting_key] = r.setting_value);

        if (settings.google_login_enabled !== 'true') {
            return res.status(403).json({ success: false, error: 'ระบบเข้าสู่ระบบด้วย Google ปิดใช้งานอยู่' });
        }

        const clientId = settings.google_client_id;
        if (!clientId) {
            return res.status(500).json({ success: false, error: 'ระบบทำงานผิดพลาด: ไม่พบ Google Client ID ในการตั้งค่า กรุณาติดต่อแอดมิน' });
        }

        const googleClient = new OAuth2Client(clientId);

        let payload;

        // ถ้ามีความยาวเป็น JWT 3 ท่อน (id_token) ให้ตรวจสอบลายเซ็น
        if (credential.split('.').length === 3) {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: clientId,
            });
            payload = ticket.getPayload();
        } else {
            // ถ้ารูปแบบไม่ตรง JWT คาดการณ์ว่าเป็น access_token ให้ Fetch ข้อมูลจาก Google
            const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${credential}` }
            });
            if (!userResponse.ok) {
                return res.status(401).json({ success: false, error: 'Google Access Token ไม่ถูกต้องหรือหมดอายุ' });
            }
            payload = await userResponse.json();
        }

        const { sub: googleId, email, given_name, family_name, picture } = payload;

        // 2. Check if user exists by Google ID or Email
        let [users] = await db.query('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]);
        let userId;
        let userRecord;

        if (users.length > 0) {
            userRecord = users[0];
            userId = userRecord.id;

            let updates = [];
            let updateParams = [];

            // Link Google ID if signing in with Google for the first time but email exists
            if (!userRecord.google_id) {
                updates.push('google_id = ?', 'is_email_verified = 1');
                updateParams.push(googleId);
                userRecord.is_email_verified = 1;
            }

            // Cache avatar if it's still from Google, missing, or the local file is missing from disk
            const isLocalMissing = userRecord.avatar_url && userRecord.avatar_url.startsWith('/uploads') && !fs.existsSync(path.join(__dirname, '../public', userRecord.avatar_url));
            if (picture && (!userRecord.avatar_url || userRecord.avatar_url.includes('googleusercontent.com') || isLocalMissing)) {
                const localAvatar = await downloadAndCacheAvatar(picture, googleId);
                if (localAvatar !== userRecord.avatar_url && localAvatar.startsWith('/uploads')) {
                    updates.push('avatar_url = ?');
                    updateParams.push(localAvatar);
                    userRecord.avatar_url = localAvatar;
                }
            }

            if (updates.length > 0) {
                updateParams.push(userId);
                await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, updateParams);
            }
        } else {
            // Create new user automatically
            userId = uuidv4();
            const localAvatar = await downloadAndCacheAvatar(picture, googleId) || picture;

            await db.query(
                `INSERT INTO users (id, email, password, first_name, last_name, avatar_url, google_id, is_email_verified, registration_source) VALUES (?, ?, NULL, ?, ?, ?, ?, 1, ?)`,
                [userId, email, given_name, family_name, localAvatar, googleId, source || 'organic']
            );
            userRecord = { id: userId, email, first_name: given_name, last_name: family_name, avatar_url: localAvatar, google_id: googleId, is_email_verified: 1 };
        }

        const token = generateToken(userId);

        sendLoginNotification(userRecord.email, userRecord.first_name, 'Google');

        res.json({
            success: true,
            data: {
                id: userRecord.id, email: userRecord.email, first_name: userRecord.first_name, last_name: userRecord.last_name, avatar_url: userRecord.avatar_url, google_id: userRecord.google_id, is_email_verified: userRecord.is_email_verified, token
            }
        });

    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(500).json({ success: false, error: 'ล้มเหลวในการเชื่อมต่อกับบัญชี Google' });
    }
});

// [GET] /api/users/profile - ดึงข้อมูลส่วนตัว
router.get('/profile', verifyCustomer, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, first_name, last_name, phone, avatar_url, created_at, is_email_verified, google_id, line_id FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้' });
        res.json({ success: true, data: users[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลส่วนตัว' });
    }
});

// [PUT] /api/users/profile - เเก้ไขข้อมูลส่วนตัว
router.put('/profile', verifyCustomer, async (req, res) => {
    try {
        const { first_name, last_name, phone, email } = req.body;

        if (!first_name || !last_name) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกชื่อและนามสกุล' });
        }

        // Fetch current user details to check if email is already set
        const [currentUsers] = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
        if (currentUsers.length === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้' });
        }
        
        const currentUser = currentUsers[0];
        let emailUpdate = false;
        
        if (email && email !== currentUser.email) {
            // Only allow updating email if the current email is empty/null
            if (currentUser.email) {
                return res.status(400).json({ success: false, error: 'ไม่สามารถเปลี่ยนอีเมลที่ระบุไว้แล้วได้' });
            }
            
            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' });
            }
            
            // Check if email is already taken
            const [existing] = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, error: 'อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว' });
            }
            
            emailUpdate = true;
        }

        if (emailUpdate) {
            const verificationToken = uuidv4();
            await db.query(
                'UPDATE users SET first_name = ?, last_name = ?, phone = ?, email = ?, verification_token = ?, is_email_verified = 0 WHERE id = ?',
                [first_name, last_name, phone || null, email, verificationToken, req.user.id]
            );
            
            // Send verification email
            const frontendBaseUrl = req.headers.origin || 'http://localhost:5173';
            try {
                sendVerificationEmail(email, verificationToken, frontendBaseUrl);
            } catch (emailErr) {
                console.error('Failed to send verification email during profile update:', emailErr.message);
            }
        } else {
            await db.query(
                'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
                [first_name, last_name, phone || null, req.user.id]
            );
        }

        res.json({ 
            success: true, 
            message: emailUpdate ? 'บันทึกข้อมูลสำเร็จ และส่งลิงก์ยืนยันตัวตนไปยังอีเมลของคุณเรียบร้อยแล้ว' : 'บันทึกข้อมูลส่วนตัวสำเร็จ',
            emailUpdated: emailUpdate
        });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
});

// [POST] /api/users/avatar - อัปโหลดรูปโปรไฟล์
router.post('/avatar', verifyCustomer, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'กรุณาเลือกไฟล์รูปภาพ' });
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = `avatar-${req.user.id}-${uniqueSuffix}.webp`;
        const filepath = path.join(avatarsDir, filename);

        // Resize and convert to webp
        await sharp(req.file.buffer)
            .resize(400, 400, { fit: 'cover' })
            .webp({ quality: 80 })
            .toFile(filepath);

        const newAvatarUrl = `/uploads/avatars/${filename}`;

        // Get old avatar url to optionally clean up
        const [users] = await db.query('SELECT avatar_url FROM users WHERE id = ?', [req.user.id]);
        const oldAvatar = users[0]?.avatar_url;

        await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [newAvatarUrl, req.user.id]);

        // Clean up old avatar if it's local
        if (oldAvatar && oldAvatar.startsWith('/uploads/avatars/')) {
            const oldFilepath = path.join(__dirname, '../public', oldAvatar);
            if (fs.existsSync(oldFilepath)) {
                try { fs.unlinkSync(oldFilepath); } catch (e) { console.error('Failed to delete old avatar', e); }
            }
        }

        res.json({ success: true, message: 'อัปโหลดรูปโปรไฟล์สำเร็จ', avatar_url: newAvatarUrl });
    } catch (err) {
        console.error('Upload avatar error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์' });
    }
});

// ==========================================
// 📦 Address Management
// ==========================================

// [GET] /api/users/addresses - ดึงที่อยู่ทั้งหมด
router.get('/addresses', verifyCustomer, async (req, res) => {
    try {
        const [addresses] = await db.query(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY type, is_default DESC, created_at DESC',
            [req.user.id]
        );
        res.json({ success: true, data: addresses });
    } catch (err) {
        console.error('Fetch addresses error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลที่อยู่' });
    }
});

// [POST] /api/users/addresses - เพิ่มที่อยู่ใหม่
router.post('/addresses', verifyCustomer, async (req, res) => {
    try {
        const {
            type, is_default, title, first_name, last_name, phone,
            address_line, subdistrict, district, province, postal_code,
            company_name, tax_id, branch
        } = req.body;

        if (!first_name || !last_name || !phone || !address_line || !subdistrict || !district || !province || !postal_code) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
        }

        const addressType = type === 'tax' ? 'tax' : 'shipping';

        // ถ้าตั้งให้เป็นค่าเริ่มต้น ให้เอาค่าเริ่มต้นของอันอื่นออกก่อน (แยกตาม type)
        if (is_default) {
            await db.query(
                'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND type = ?',
                [req.user.id, addressType]
            );
        }

        // ป้องกันกรณีที่อยู่นี้เป็นที่อยู่แรก ให้บังคับเป็น default
        const [existing] = await db.query('SELECT id FROM user_addresses WHERE user_id = ? AND type = ?', [req.user.id, addressType]);
        const shouldBeDefault = existing.length === 0 ? true : Boolean(is_default);

        const id = uuidv4();
        await db.query(
            `INSERT INTO user_addresses 
            (id, user_id, type, is_default, title, first_name, last_name, company_name, tax_id, branch, phone, address_line, subdistrict, district, province, postal_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, req.user.id, addressType, shouldBeDefault, title || null, first_name, last_name,
                company_name || null, tax_id || null, branch || null, phone, address_line, subdistrict, district, province, postal_code
            ]
        );

        res.status(201).json({ success: true, message: 'เพิ่มที่อยู่สำเร็จ', id });
    } catch (err) {
        console.error('Add address error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเพิ่มที่อยู่' });
    }
});

// [PUT] /api/users/addresses/:id - เเก้ไขที่อยู่
router.put('/addresses/:id', verifyCustomer, async (req, res) => {
    try {
        const addressId = req.params.id;
        const {
            is_default, title, first_name, last_name, phone,
            address_line, subdistrict, district, province, postal_code,
            company_name, tax_id, branch
        } = req.body;

        // เช็คว่า Address นี้เป็นของผู้ใช้จริงๆ
        const [existing] = await db.query('SELECT id, type FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, req.user.id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบที่อยู่ หรือไม่มีสิทธิ์แก้ไข' });
        }

        if (is_default) {
            await db.query(
                'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND type = ?',
                [req.user.id, existing[0].type]
            );
        }

        await db.query(
            `UPDATE user_addresses 
            SET is_default = ?, title = ?, first_name = ?, last_name = ?, company_name = ?, tax_id = ?, branch = ?, 
                phone = ?, address_line = ?, subdistrict = ?, district = ?, province = ?, postal_code = ?
            WHERE id = ? AND user_id = ?`,
            [
                Boolean(is_default), title || null, first_name, last_name, company_name || null, tax_id || null, branch || null,
                phone, address_line, subdistrict, district, province, postal_code, addressId, req.user.id
            ]
        );

        res.json({ success: true, message: 'อัปเดตที่อยู่สำเร็จ' });
    } catch (err) {
        console.error('Update address error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการแก้ไขที่อยู่' });
    }
});

// [DELETE] /api/users/addresses/:id - ลบที่อยู่
router.delete('/addresses/:id', verifyCustomer, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบที่อยู่ หรือไม่มีสิทธิ์ลบ' });
        }
        res.json({ success: true, message: 'ลบที่อยู่สำเร็จ' });
    } catch (err) {
        console.error('Delete address error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการลบที่อยู่' });
    }
});


// [POST] /api/users/auth/line
router.post('/auth/line', authLimiter, async (req, res) => {
    try {
        const { code, redirectUri, source } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: 'Authorization code is required' });
        }

        // Fetch dynamic settings
        const [settingsRows] = await db.query('SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?, ?, ?)', ['line_login_enabled', 'line_channel_id', 'line_channel_secret']);
        const settings = {};
        settingsRows.forEach(r => settings[r.setting_key] = r.setting_value);

        if (settings.line_login_enabled !== 'true') {
            return res.status(403).json({ success: false, error: 'ระบบเข้าสู่ระบบด้วย LINE ปิดใช้งานอยู่' });
        }

        const channelId = settings.line_channel_id;
        const channelSecret = settings.line_channel_secret;

        if (!channelId || !channelSecret) {
            return res.status(500).json({ success: false, error: 'LINE Channel ID or Secret is not configured.' });
        }

        // 1. Exchange auth code for access token
        const tokenParams = new URLSearchParams();
        tokenParams.append('grant_type', 'authorization_code');
        tokenParams.append('code', code);
        tokenParams.append('redirect_uri', redirectUri);
        tokenParams.append('client_id', channelId);
        tokenParams.append('client_secret', channelSecret);

        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: tokenParams
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('[LINE Auth] Token exchange failed:', tokenData);
            return res.status(400).json({ success: false, error: `ไม่สามารถแลกเปลี่ยนคีย์ของ LINE ได้: ${tokenData.error_description || tokenData.error || 'Unknown'}` });
        }

        const { id_token, access_token } = tokenData;

        // 2. Verify ID token to get profile data
        const verifyParams = new URLSearchParams();
        verifyParams.append('id_token', id_token);
        verifyParams.append('client_id', channelId);

        const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: verifyParams
        });

        const verifyData = await verifyResponse.json();
        if (!verifyResponse.ok) {
            console.error('[LINE Auth] ID token verification failed:', verifyData);
            return res.status(400).json({ success: false, error: 'ไม่สามารถยืนยันตัวตนกับ LINE ได้' });
        }

        const { sub: lineId, email, name, picture } = verifyData;

        // 3. User check and link / create
        // Handle null email properly - don't query with null email to avoid false matches
        let users;
        if (email) {
            [users] = await db.query('SELECT * FROM users WHERE line_id = ? OR email = ?', [lineId, email]);
        } else {
            [users] = await db.query('SELECT * FROM users WHERE line_id = ?', [lineId]);
        }

        let userId;
        let userRecord;

        if (users.length > 0) {
            userRecord = users[0];
            userId = userRecord.id;

            let updates = [];
            let updateParams = [];

            if (!userRecord.line_id) {
                updates.push('line_id = ?');
                updateParams.push(lineId);
                if (email && !userRecord.is_email_verified) {
                    updates.push('is_email_verified = 1');
                    userRecord.is_email_verified = 1;
                }
            }

            // Cache avatar if it's missing, external, or the local file is missing from disk
            const isLocalMissing = userRecord.avatar_url && userRecord.avatar_url.startsWith('/uploads') && !fs.existsSync(path.join(__dirname, '../public', userRecord.avatar_url));
            if (picture && (!userRecord.avatar_url || userRecord.avatar_url.includes('line-scdn.net') || userRecord.avatar_url.includes('googleusercontent.com') || isLocalMissing)) {
                try {
                    const localAvatar = await downloadAndCacheAvatar(picture, `line - ${lineId}`);
                    if (localAvatar && localAvatar !== userRecord.avatar_url && localAvatar.startsWith('/uploads')) {
                        updates.push('avatar_url = ?');
                        updateParams.push(localAvatar);
                        userRecord.avatar_url = localAvatar;
                    }
                } catch (avatarErr) {
                    console.error('[LINE Auth] Avatar download failed (non-fatal):', avatarErr.message);
                }
            }

            if (updates.length > 0) {
                updateParams.push(userId);
                await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ? `, updateParams);
            }
        } else {
            userId = uuidv4();

            let localAvatar = picture || null;
            try {
                if (picture) {
                    localAvatar = await downloadAndCacheAvatar(picture, `line - ${lineId}`) || picture;
                }
            } catch (avatarErr) {
                console.error('[LINE Auth] Avatar download failed (non-fatal):', avatarErr.message);
            }

            const first_name = name || 'LINE User';
            const last_name = '';

            await db.query(
                'INSERT INTO users(id, email, password, first_name, last_name, avatar_url, line_id, is_email_verified, registration_source) VALUES(?, ?, NULL, ?, ?, ?, ?, ?, ?)',
                [userId, email || null, first_name, last_name, localAvatar, lineId, email ? 1 : 0, source || 'organic']
            );
            userRecord = { id: userId, email: email || null, first_name, last_name, avatar_url: localAvatar, line_id: lineId, is_email_verified: email ? 1 : 0 };
        }

        const token = generateToken(userId);

        if (userRecord.email) {
            sendLoginNotification(userRecord.email, userRecord.first_name, 'LINE');
        }

        res.json({
            success: true,
            data: {
                id: userRecord.id, email: userRecord.email, first_name: userRecord.first_name, last_name: userRecord.last_name, avatar_url: userRecord.avatar_url, line_id: userRecord.line_id, is_email_verified: userRecord.is_email_verified, token
            }
        });
    } catch (err) {
        console.error('[LINE Auth] FATAL ERROR:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE: ' + (err.message || 'Unknown') });
    }
});

// ==========================================
// 🔑 Forgot / Reset Password
// ==========================================

// [POST] /api/users/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, error: 'กรุณากรอกอีเมล' });

        const [users] = await db.query('SELECT id, email, first_name FROM users WHERE email = ?', [email]);
        // Always return success to avoid email enumeration
        if (users.length === 0) {
            return res.json({ success: true, message: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้' });
        }

        const user = users[0];
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?', [resetToken, expiresAt, user.id]);

        // Send reset email
        const frontendBaseUrl = req.headers.origin || 'http://localhost:5173';
        sendForgotPasswordEmail(user.email, user.first_name, resetToken, frontendBaseUrl);

        res.json({ success: true, message: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

// [GET] /api/users/verify-reset-token
router.get('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ success: false, error: 'ไม่พบรหัสยืนยัน' });
        }

        const [users] = await db.query(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [token]
        );
        if (users.length === 0) {
            return res.json({ success: false, error: 'ลิงก์นี้หมดอายุหรือเปลี่ยนรหัสผ่านสำเร็จแล้ว' });
        }

        res.json({ success: true, message: 'ลิงก์ใช้งานได้' });
    } catch (err) {
        console.error('Verify reset token error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบลิงก์' });
    }
});

// [POST] /api/users/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
    try {
        const { token, new_password } = req.body;
        if (!token || !new_password) {
            return res.status(400).json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบ' });
        }
        if (new_password.length < 6) {
            return res.status(400).json({ success: false, error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
        }

        const [users] = await db.query(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [token]
        );
        if (users.length === 0) {
            return res.status(400).json({ success: false, error: 'ลิงก์รีเซ็ตไม่ถูกต้องหรือหมดอายุแล้ว' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await db.query(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [hashedPassword, users[0].id]
        );

        // Send reset success email asynchronously
        try {
            const [userRows] = await db.query('SELECT email, first_name FROM users WHERE id = ?', [users[0].id]);
            if (userRows.length > 0 && userRows[0].email) {
                sendPasswordResetSuccessEmail(userRows[0].email, userRows[0].first_name);
            }
        } catch (emailErr) {
            console.error('Failed to trigger password reset success email:', emailErr.message);
        }

        res.json({ success: true, message: 'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

// ==========================================
// 🔒 Security & PDPA
// ==========================================

// [PUT] /api/users/password - เปลี่ยนรหัสผ่าน
router.put('/password', verifyCustomer, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ success: false, error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
        }

        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบผู้ใช้งาน' });
        }

        const user = users[0];

        // ถ้าผู้ใช้เคยมีรหัสผ่านเดี่ยวในระบบ จะต้องตรวจสอบรหัสผ่านเดิมก่อน
        if (user.password) {
            if (!current_password) {
                return res.status(400).json({ success: false, error: 'กรุณากรอกรหัสผ่านปัจจุบัน' });
            }
            const isMatch = await bcrypt.compare(current_password, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
            }
        }

        // แฮชรหัสผ่านใหม่และบันทึกลงฐานข้อมูล
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        // Send password changed email asynchronously
        try {
            const [userRows] = await db.query('SELECT email, first_name FROM users WHERE id = ?', [req.user.id]);
            if (userRows.length > 0 && userRows[0].email) {
                sendPasswordChangedEmail(userRows[0].email, userRows[0].first_name);
            }
        } catch (emailErr) {
            console.error('Failed to trigger password changed email:', emailErr.message);
        }

        res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    }
});

// [DELETE] /api/users/account - ลบบัญชีผู้ใช้ (PDPA)
router.delete('/account', verifyCustomer, async (req, res) => {
    try {
        const userId = req.user.id;

        // ลบข้อมูลที่เกี่ยวข้องทั้งหมดเพื่อความเป็นส่วนตัวตามกฎหมาย PDPA
        // 1. ลบที่อยู่ทั้งหมด (Shipping/Tax)
        await db.query('DELETE FROM user_addresses WHERE user_id = ?', [userId]);

        // 2. ลบตะกร้าสินค้า
        await db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

        // 3. ลบ wishlists
        await db.query('DELETE FROM wishlists WHERE user_id = ?', [userId]);

        // 4. ลบรีวิวสินค้า
        await db.query('DELETE FROM product_reviews WHERE user_id = ?', [userId]);

        // 5. ตัดความสัมพันธ์กับ orders (แทนลบ เพื่อเก็บประวัติ)
        await db.query('UPDATE orders SET user_id = NULL WHERE user_id = ?', [userId]);

        // 6. ลบบัญชีผู้ใช้
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบบัญชีผู้ใช้' });
        }

        res.json({ success: true, message: 'ลบบัญชีผู้ใช้สำเร็จ' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการลบบัญชี' });
    }
});

module.exports = router;
