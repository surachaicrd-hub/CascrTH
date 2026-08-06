const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware to verify customer token (matches cart.js pattern)
const verifyCustomer = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'ไม่พบ Token กรุณาเข้าสู่ระบบ' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'storage-shed-secret-key-2024');
        if (decoded.role !== 'customer') {
            return res.status(403).json({ success: false, error: 'สิทธิ์ไม่เพียงพอ (ไม่ใช่ Customer)' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};

// [GET] /api/wishlists - Fetch user's wishlist items
router.get('/', verifyCustomer, async (req, res) => {
    try {
        const [items] = await db.query(`
            SELECT w.id as wishlist_id, p.* 
            FROM wishlists w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `, [req.user.id]);

        // Parse images JSON for each product
        const formattedItems = items.map(item => ({
            ...item,
            images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [],
            price: parseFloat(item.price)
        }));

        res.json({ success: true, data: formattedItems });
    } catch (err) {
        console.error('Fetch wishlist error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายการโปรด' });
    }
});

// [POST] /api/wishlists - Add item to wishlist
router.post('/', verifyCustomer, async (req, res) => {
    try {
        const { product_id } = req.body;

        if (!product_id) return res.status(400).json({ success: false, error: 'ไม่พบรหัสสินค้า' });

        // Check if product exists
        const [products] = await db.query('SELECT id FROM products WHERE id = ?', [product_id]);
        if (products.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบสินค้าในระบบ' });

        // Insert ignoring duplicate combinations
        await db.query(`
            INSERT IGNORE INTO wishlists (user_id, product_id) 
            VALUES (?, ?)
        `, [req.user.id, product_id]);

        res.json({ success: true, message: 'เพิ่มสินค้าลงในรายการโปรดแล้ว' });
    } catch (err) {
        console.error('Add to wishlist error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเพิ่มรายการโปรด' });
    }
});

// [DELETE] /api/wishlists/:productId - Remove item from wishlist
router.delete('/:productId', verifyCustomer, async (req, res) => {
    try {
        const productId = req.params.productId;

        const [result] = await db.query('DELETE FROM wishlists WHERE product_id = ? AND user_id = ?', [productId, req.user.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบสินค้าในรายการโปรด' });
        }

        res.json({ success: true, message: 'ลบสินค้าออกจากรายการโปรดแล้ว' });
    } catch (err) {
        console.error('Delete wishlist item error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการลบรายการโปรด' });
    }
});

module.exports = router;
