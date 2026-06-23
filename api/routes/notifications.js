const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin } = require('./auth');

// GET notification counts for admin
router.get('/', verifyAdmin, async (req, res) => {
    try {
        // Unread contact messages
        const [msgRows] = await db.query(
            `SELECT COUNT(*) as count FROM contact_submissions WHERE is_read = 0 OR is_read IS NULL`
        );

        // New quotation requests (status = 'ใหม่' or NULL or empty)
        const [quotRows] = await db.query(
            `SELECT COUNT(*) as count FROM quotation_requests WHERE status IS NULL OR status = '' OR status = 'ใหม่'`
        );

        // Pending orders (payment_status = pending or reviewing)
        const [orderRows] = await db.query(
            `SELECT COUNT(*) as count FROM orders WHERE payment_status IN ('pending', 'reviewing') AND order_status != 'cancelled'`
        );

        const pendingOrders = orderRows[0].count || 0;
        res.json({
            success: true,
            notifications: {
                unreadMessages: msgRows[0].count || 0,
                newQuotations: quotRows[0].count || 0,
                pendingOrders,
                total: (msgRows[0].count || 0) + (quotRows[0].count || 0) + pendingOrders,
            }
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
    }
});

module.exports = router;
