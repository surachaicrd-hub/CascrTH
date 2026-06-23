const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware to verify customer token
const verifyCustomer = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'ไม่พบ Token กรุณาเข้าสู่ระบบ' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'morespace-secret-key-2024');
        if (decoded.role !== 'customer') {
            return res.status(403).json({ success: false, error: 'สิทธิ์ไม่เพียงพอ (ไม่ใช่ Customer)' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};

// [GET] /api/cart - Fetch user's cart items
router.get('/', verifyCustomer, async (req, res) => {
    try {
        const [items] = await db.query(`
            SELECT c.id as cart_item_id, c.quantity, p.* 
            FROM cart_items c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
            ORDER BY c.created_at DESC
        `, [req.user.id]);

        // Parse images JSON for each product
        const formattedItems = items.map(item => ({
            ...item,
            images: item.images ? (typeof item.images === 'string' ? JSON.parse(item.images) : item.images) : [],
            price: parseFloat(item.price)
        }));

        res.json({ success: true, data: formattedItems });
    } catch (err) {
        console.error('Fetch cart error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลตะกร้าสินค้า' });
    }
});

// [POST] /api/cart - Add item to cart
router.post('/', verifyCustomer, async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;

        if (!product_id) return res.status(400).json({ success: false, error: 'ไม่พบรหัสสินค้า' });

        // Check if product exists
        const [products] = await db.query('SELECT id FROM products WHERE id = ?', [product_id]);
        if (products.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบสินค้าในระบบ' });

        // Insert or Update Quantity
        await db.query(`
            INSERT INTO cart_items (user_id, product_id, quantity) 
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `, [req.user.id, product_id, quantity]);

        res.json({ success: true, message: 'เพิ่มสินค้าลงตะกร้าแล้ว' });
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า' });
    }
});

// [PUT] /api/cart/:id - Update quantity
router.put('/:id', verifyCustomer, async (req, res) => {
    try {
        const { quantity } = req.body;
        const cartItemId = req.params.id;

        if (quantity === undefined || quantity < 1) {
            return res.status(400).json({ success: false, error: 'จำนวนสินค้าต้องมากกว่า 0' });
        }

        const [result] = await db.query('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?', [quantity, cartItemId, req.user.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบรายการในตะกร้า' });
        }

        res.json({ success: true, message: 'อัปเดตจำนวนสินค้าแล้ว' });
    } catch (err) {
        console.error('Update cart item error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตจำนวนสินค้า' });
    }
});

// [DELETE] /api/cart/:id - Remove item
router.delete('/:id', verifyCustomer, async (req, res) => {
    try {
        const cartItemId = req.params.id;

        const [result] = await db.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [cartItemId, req.user.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบรายการในตะกร้า' });
        }

        res.json({ success: true, message: 'ลบสินค้าออกจากตะกร้าแล้ว' });
    } catch (err) {
        console.error('Delete cart item error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการลบสินค้า' });
    }
});

// [POST] /api/cart/sync - Sync local storage to database on login
router.post('/sync', verifyCustomer, async (req, res) => {
    try {
        const { items } = req.body; // Array of { product_id, quantity }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.json({ success: true, message: 'ไม่มีสินค้าต้องซิงค์' });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const item of items) {
                if (item.product_id && item.quantity > 0) {
                    await connection.query(`
                        INSERT INTO cart_items (user_id, product_id, quantity) 
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
                    `, [req.user.id, item.product_id, item.quantity]);
                }
            }
            await connection.commit();
            res.json({ success: true, message: 'ซิงค์ข้อมูลตะกร้าสินค้าสำเร็จ' });
        } catch (dbErr) {
            await connection.rollback();
            throw dbErr;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Sync cart error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการซิงค์ข้อมูลตะกร้าสินค้า' });
    }
});

module.exports = router;
