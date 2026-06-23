const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin } = require('./auth');

// ─── Helper: calculate discount ────────────────────────────────────────────
const calculateDiscount = (coupon, orderAmount) => {
    let discount = 0;
    if (coupon.type === 'percent') {
        discount = (orderAmount * coupon.value) / 100;
        if (coupon.max_discount_amount) {
            discount = Math.min(discount, parseFloat(coupon.max_discount_amount));
        }
    } else { // fixed
        discount = parseFloat(coupon.value);
    }
    return Math.min(discount, orderAmount); // ส่วนลดต้องไม่มากกว่ายอดสั่งซื้อ
};

// ─── PUBLIC: POST /api/coupons/validate ─────────────────────────────────────
// Body: { code, order_amount }
router.post('/validate', async (req, res) => {
    try {
        const { code, order_amount } = req.body;
        if (!code || !order_amount) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุโค้ดและยอดสั่งซื้อ' });
        }

        const [rows] = await db.query(
            'SELECT * FROM coupon_codes WHERE code = ? AND is_active = 1',
            [code.trim().toUpperCase()]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบโค้ดส่วนลดนี้หรือโค้ดถูกปิดใช้งานแล้ว' });
        }

        const coupon = rows[0];

        // Check expiry
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(400).json({ success: false, error: 'โค้ดส่วนลดนี้หมดอายุแล้ว' });
        }

        // Check usage limit
        if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ success: false, error: 'โค้ดส่วนลดนี้ถูกใช้ครบจำนวนแล้ว' });
        }

        // Check minimum order amount
        const amount = parseFloat(order_amount);
        if (amount < parseFloat(coupon.min_order_amount)) {
            return res.status(400).json({
                success: false,
                error: `ยอดสั่งซื้อขั้นต่ำสำหรับโค้ดนี้คือ ฿${Number(coupon.min_order_amount).toLocaleString('th-TH')}`
            });
        }

        const discount = calculateDiscount(coupon, amount);

        res.json({
            success: true,
            coupon: {
                code: coupon.code,
                type: coupon.type,
                value: coupon.value,
                description: coupon.description,
                min_order_amount: coupon.min_order_amount,
                max_discount_amount: coupon.max_discount_amount
            },
            discount_amount: discount,
            message: `ใช้โค้ดสำเร็จ! ส่วนลด ฿${discount.toLocaleString('th-TH')}`
        });
    } catch (err) {
        console.error('Coupon validate error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบโค้ด' });
    }
});

// ─── ADMIN: GET /api/coupons/admin ──────────────────────────────────────────
router.get('/admin', verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM coupon_codes ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── ADMIN: POST /api/coupons/admin ─────────────────────────────────────────
router.post('/admin', verifyAdmin, async (req, res) => {
    try {
        const { code, description, type, value, min_order_amount, max_discount_amount, usage_limit, expires_at, is_active } = req.body;
        if (!code || !type || !value) {
            return res.status(400).json({ success: false, error: 'กรุณากรอก code, type และ value' });
        }

        await db.query(
            `INSERT INTO coupon_codes (code, description, type, value, min_order_amount, max_discount_amount, usage_limit, expires_at, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                code.trim().toUpperCase(),
                description || null,
                type,
                value,
                min_order_amount || 0,
                max_discount_amount || null,
                usage_limit || null,
                expires_at || null,
                is_active !== undefined ? is_active : 1
            ]
        );
        res.status(201).json({ success: true, message: 'สร้างโค้ดส่วนลดสำเร็จ' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: `โค้ด "${req.body.code}" มีอยู่แล้วในระบบ` });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── ADMIN: PUT /api/coupons/admin/:id ──────────────────────────────────────
router.put('/admin/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { description, type, value, min_order_amount, max_discount_amount, usage_limit, expires_at, is_active } = req.body;

        await db.query(
            `UPDATE coupon_codes SET
                description = ?, type = ?, value = ?,
                min_order_amount = ?, max_discount_amount = ?,
                usage_limit = ?, expires_at = ?, is_active = ?
             WHERE id = ?`,
            [
                description || null, type, value,
                min_order_amount || 0, max_discount_amount || null,
                usage_limit || null, expires_at || null,
                is_active !== undefined ? is_active : 1,
                id
            ]
        );
        res.json({ success: true, message: 'อัปเดตโค้ดส่วนลดสำเร็จ' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ─── ADMIN: DELETE /api/coupons/admin/:id ───────────────────────────────────
router.delete('/admin/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM coupon_codes WHERE id = ?', [id]);
        res.json({ success: true, message: 'ลบโค้ดส่วนลดสำเร็จ' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
module.exports.calculateDiscount = calculateDiscount;
