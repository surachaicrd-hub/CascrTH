const express = require('express');
const db = require('../config/database');
const { verifyAdmin } = require('./auth'); // Assuming there's a verifyAdmin middleware in auth.js

const router = express.Router();

// ==========================================
// 🧑‍🤝‍🧑 Customer Management (Admin Only)
// ==========================================

// [GET] /api/admin/customers - Get list of customers with stats
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const source = req.query.source || '';
        const isBlacklisted = req.query.is_blacklisted; // 'true', 'false', 'all'
        const minSpent = req.query.min_spent || '';
        const maxSpent = req.query.max_spent || '';
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let params = [];

        if (search) {
            const searchPattern = `%${search}%`;
            whereConditions.push(`(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`);
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }
        if (source) {
            whereConditions.push(`u.registration_source = ?`);
            params.push(source);
        }
        if (isBlacklisted === 'true') {
            whereConditions.push(`u.is_blacklisted = 1`);
        } else if (isBlacklisted === 'false') {
            whereConditions.push(`u.is_blacklisted = 0`);
        }

        let whereClause = whereConditions.length > 0 ? ` WHERE ` + whereConditions.join(' AND ') : '';

        let havingConditions = [];
        if (minSpent) {
            havingConditions.push(`total_spent >= ?`);
            params.push(parseFloat(minSpent));
        }
        if (maxSpent) {
            havingConditions.push(`total_spent <= ?`);
            params.push(parseFloat(maxSpent));
        }
        let havingClause = havingConditions.length > 0 ? ` HAVING ` + havingConditions.join(' AND ') : '';

        let query = `
            SELECT 
                u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.registration_source, u.created_at, u.is_email_verified, u.is_blacklisted,
                COUNT(o.id) as orders_count,
                COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id AND o.payment_status = 'paid'
            ${whereClause}
            GROUP BY u.id
            ${havingClause}
            ORDER BY u.created_at DESC 
            LIMIT ? OFFSET ?
        `;

        let countQuery = `
            SELECT COUNT(*) as total FROM (
                SELECT u.id, COALESCE(SUM(o.total_amount), 0) as total_spent
                FROM users u
                LEFT JOIN orders o ON u.id = o.user_id AND o.payment_status = 'paid'
                ${whereClause}
                GROUP BY u.id
                ${havingClause}
            ) as t
        `;
        
        let countParams = [...params]; // params without limit and offset
        params.push(limit, offset);

        const [customers] = await db.query(query, params);
        const [totalRows] = await db.query(countQuery, countParams);
        const total = totalRows[0].total;

        res.json({
            success: true,
            data: customers,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Fetch customers error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า' });
    }
});

// [GET] /api/admin/customers/:id - Get detailed customer profile
router.get('/:id', verifyAdmin, async (req, res) => {
    try {
        // 1. Get basic info & stats
        const [users] = await db.query(`
            SELECT 
                u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, 
                u.registration_source, u.created_at, u.is_email_verified, u.google_id, u.line_id, u.is_blacklisted,
                COUNT(o.id) as orders_count,
                COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id AND o.payment_status = 'paid'
            WHERE u.id = ?
            GROUP BY u.id
        `, [req.params.id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบลูกค้า' });
        }
        const user = users[0];

        // 2. Get recent orders
        const [orders] = await db.query(`
            SELECT id, total_amount, payment_method, payment_status, order_status, created_at, tracking_number, shipping_provider
            FROM orders 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `, [user.id]);

        // 3. Get saved addresses
        const [addresses] = await db.query(`
            SELECT * FROM user_addresses WHERE user_id = ? ORDER BY type, is_default DESC
        `, [user.id]);

        res.json({
            success: true,
            data: {
                profile: user,
                orders: orders,
                addresses: addresses
            }
        });
    } catch (err) {
        console.error('Fetch customer detail error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงรายละเอียดลูกค้า' });
    }
});

// [DELETE] /api/admin/customers/:id - Delete customer
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Remove addresses first (it might cascade, but being safe)
        await db.query('DELETE FROM user_addresses WHERE user_id = ?', [userId]);
        
        // Delete user
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบลูกค้า' });
        }
        
        res.json({ success: true, message: 'ลบข้อมูลลูกค้าสำเร็จ' });
    } catch (err) {
        console.error('Delete customer error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการลบลูกค้า' });
    }
});

// [POST] /api/admin/customers/:id/blacklist - Toggle Blacklist Status
router.post('/:id/blacklist', verifyAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        const { is_blacklisted } = req.body;
        
        const [result] = await db.query('UPDATE users SET is_blacklisted = ? WHERE id = ?', [is_blacklisted ? 1 : 0, userId]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบลูกค้า' });
        }
        
        res.json({ success: true, message: is_blacklisted ? 'เพิ่มเข้ารายชื่อบัญชีดำเรียบร้อยแล้ว' : 'ปลดบัญชีดำเรียบร้อยแล้ว' });
    } catch (err) {
        console.error('Toggle blacklist customer error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะบัญชีดำ' });
    }
});

module.exports = router;
