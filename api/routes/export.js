const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin } = require('./auth');

// ============================================
// 📥 Export Orders CSV
// GET /api/export/orders?start_date=&end_date=&status=&payment_status=
// ============================================
router.get('/orders', verifyAdmin, async (req, res) => {
    try {
        const { status, payment_status, start_date, end_date, search } = req.query;

        let whereConditions = ['1=1'];
        let queryParams = [];

        if (status && status !== 'all') {
            whereConditions.push('o.order_status = ?');
            queryParams.push(status);
        }
        if (payment_status && payment_status !== 'all') {
            whereConditions.push('o.payment_status = ?');
            queryParams.push(payment_status);
        }
        if (start_date) {
            whereConditions.push('o.created_at >= ?');
            queryParams.push(`${start_date} 00:00:00`);
        }
        if (end_date) {
            whereConditions.push('o.created_at <= ?');
            queryParams.push(`${end_date} 23:59:59`);
        }
        if (search) {
            whereConditions.push('(o.id LIKE ? OR o.shipping_address LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        const whereClause = whereConditions.join(' AND ');

        // Fetch orders with customer info
        const [orders] = await db.query(
            `SELECT o.id, o.created_at, o.total_amount, o.shipping_cost, o.order_status, o.payment_status, 
                    o.payment_method, o.tracking_number, o.shipping_provider, o.shipping_address,
                    o.coupon_code, o.coupon_discount,
                    u.first_name as user_first_name, u.last_name as user_last_name, 
                    u.email as user_email, u.phone as user_phone
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             WHERE ${whereClause}
             ORDER BY o.created_at DESC`,
            queryParams
        );

        // Fetch all items for these orders
        let itemsMap = {};
        if (orders.length > 0) {
            const orderIds = orders.map(o => o.id);
            const [items] = await db.query(
                `SELECT oi.order_id, oi.product_name, oi.quantity, oi.price_at_purchase
                 FROM order_items oi
                 WHERE oi.order_id IN (?)`,
                [orderIds]
            );
            items.forEach(item => {
                if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
                itemsMap[item.order_id].push(item);
            });
        }

        // Status label mapping
        const orderStatusMap = {
            pending: 'รอดำเนินการ', confirmed: 'ยืนยันแล้ว', processing: 'กำลังจัดเตรียม',
            shipped: 'จัดส่งแล้ว', delivered: 'ส่งถึงแล้ว', cancelled: 'ยกเลิก', refunded: 'คืนเงินแล้ว'
        };
        const paymentStatusMap = {
            pending: 'รอชำระ', reviewing: 'รอตรวจสอบ', paid: 'ชำระแล้ว',
            failed: 'ชำระไม่สำเร็จ', rejected: 'ปฏิเสธ', refunded: 'คืนเงินแล้ว', cancelled: 'ยกเลิก'
        };

        // Build CSV
        const BOM = '\uFEFF'; // UTF-8 BOM for Excel Thai support
        const headers = [
            'Order ID', 'วันที่สั่งซื้อ', 'ชื่อลูกค้า', 'เบอร์โทร', 'อีเมล',
            'รายการสินค้า', 'ยอดสินค้า', 'ค่าส่ง', 'ส่วนลดคูปอง', 'คูปอง',
            'ยอดรวม', 'สถานะคำสั่งซื้อ', 'สถานะการชำระ', 'วิธีชำระเงิน',
            'ขนส่ง', 'เลขพัสดุ', 'จังหวัด'
        ];

        let csvRows = [headers.join(',')];

        for (const order of orders) {
            // Parse shipping address for province
            let province = '';
            let customerName = '';
            let customerPhone = '';
            try {
                if (order.shipping_address) {
                    const addr = JSON.parse(order.shipping_address);
                    province = addr.province || '';
                    if (!order.user_first_name && addr.first_name) {
                        customerName = `${addr.first_name} ${addr.last_name || ''}`.trim();
                    }
                    if (!order.user_phone && addr.phone) {
                        customerPhone = addr.phone;
                    }
                }
            } catch (e) {}

            if (!customerName) {
                customerName = order.user_first_name ? `${order.user_first_name} ${order.user_last_name || ''}`.trim() : 'Guest';
            }
            if (!customerPhone) {
                customerPhone = order.user_phone || '';
            }

            // Format items
            const orderItems = itemsMap[order.id] || [];
            const itemsText = orderItems.map(i => `${i.product_name} x${i.quantity}`).join(' / ');
            const itemsTotal = orderItems.reduce((sum, i) => sum + (i.price_at_purchase * i.quantity), 0);

            const row = [
                escapeCSV(order.id.substring(0, 8).toUpperCase()),
                escapeCSV(formatDate(order.created_at)),
                escapeCSV(customerName),
                escapeCSV(customerPhone),
                escapeCSV(order.user_email || ''),
                escapeCSV(itemsText),
                itemsTotal.toFixed(2),
                (order.shipping_cost || 0).toFixed(2),
                (order.coupon_discount || 0).toFixed(2),
                escapeCSV(order.coupon_code || ''),
                (order.total_amount || 0).toFixed(2),
                escapeCSV(orderStatusMap[order.order_status] || order.order_status),
                escapeCSV(paymentStatusMap[order.payment_status] || order.payment_status),
                escapeCSV(order.payment_method || ''),
                escapeCSV(order.shipping_provider || ''),
                escapeCSV(order.tracking_number || ''),
                escapeCSV(province)
            ];

            csvRows.push(row.join(','));
        }

        const csvContent = BOM + csvRows.join('\n');
        const filename = `orders_report_${formatFilenameDate(new Date())}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);

    } catch (error) {
        console.error('Export orders error:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการ export' });
    }
});


// ============================================
// 📥 Export Customers CSV
// GET /api/export/customers?search=&source=&is_blacklisted=
// ============================================
router.get('/customers', verifyAdmin, async (req, res) => {
    try {
        const { search, source, is_blacklisted } = req.query;

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
        if (is_blacklisted === 'true') {
            whereConditions.push(`u.is_blacklisted = 1`);
        } else if (is_blacklisted === 'false') {
            whereConditions.push(`u.is_blacklisted = 0`);
        }

        let whereClause = whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '';

        const [customers] = await db.query(`
            SELECT 
                u.id, u.email, u.first_name, u.last_name, u.phone, 
                u.registration_source, u.created_at, u.is_email_verified, u.is_blacklisted,
                COUNT(o.id) as orders_count,
                COALESCE(SUM(o.total_amount), 0) as total_spent
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id AND o.payment_status = 'paid'
            ${whereClause}
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `, params);

        // Source label mapping
        const sourceMap = {
            organic: 'เข้าชมโดยตรง',
            facebook_ad: 'โฆษณา Facebook'
        };

        // Build CSV
        const BOM = '\uFEFF';
        const headers = [
            'ID', 'ชื่อ', 'นามสกุล', 'อีเมล', 'เบอร์โทร',
            'ช่องทางสมัคร', 'วันที่สมัคร', 'ยืนยันอีเมล',
            'จำนวน Orders', 'ยอดรวม (บาท)', 'สถานะบัญชี'
        ];

        let csvRows = [headers.join(',')];

        for (const c of customers) {
            const row = [
                escapeCSV(c.id ? c.id.toString() : ''),
                escapeCSV(c.first_name || ''),
                escapeCSV(c.last_name || ''),
                escapeCSV(c.email || ''),
                escapeCSV(c.phone || ''),
                escapeCSV(sourceMap[c.registration_source] || c.registration_source || 'ไม่ระบุ'),
                escapeCSV(formatDate(c.created_at)),
                c.is_email_verified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน',
                c.orders_count,
                (c.total_spent || 0).toFixed(2),
                c.is_blacklisted ? 'บัญชีดำ' : 'ปกติ'
            ];
            csvRows.push(row.join(','));
        }

        const csvContent = BOM + csvRows.join('\n');
        const filename = `customers_report_${formatFilenameDate(new Date())}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);

    } catch (error) {
        console.error('Export customers error:', error);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการ export' });
    }
});


// ============================================
// Helpers
// ============================================
function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    let str = String(value);
    // Prevent CSV Formula Injection / DDE Execution in spreadsheet software
    if (/^[=\+\-\@\t\r]/.test(str)) {
        str = "'" + str;
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function formatDate(d) {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleString('th-TH', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatFilenameDate(d) {
    return d.toISOString().slice(0, 10).replace(/-/g, '');
}

module.exports = router;
