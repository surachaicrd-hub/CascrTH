const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { calculateShippingCost } = require('./shipping');
const { verifyApiToken, verifyAdmin } = require('./auth');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../services/emailService');
const { calculateDiscount } = require('./coupons');
const { notifyAdmins } = require('../services/notificationService');

const JWT_SECRET = process.env.JWT_SECRET;

const verifyCustomerOptional = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return next();
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        // Invalid token, just proceed as guest
    }
    next();
};

const verifyCustomer = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'ไม่พบ Token กรุณาเข้าสู่ระบบ' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'customer') {
            return res.status(403).json({ success: false, error: 'สิทธิ์ไม่เพียงพอ (ไม่ใช่ Customer)' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};

// GET /api/orders/user
// Fetch order history for the authenticated user
router.get('/user', verifyCustomer, async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch all orders for this user, ordered by creation date descending
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );

        if (orders.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const orderIds = orders.map(o => o.id);

        // Fetch all items belonging to these orders and join with products table to get the image_url
        const [orderItems] = await db.query(
            `SELECT oi.*, p.image_url as product_image,
               (SELECT COUNT(*) FROM product_reviews pr WHERE pr.order_id = oi.order_id AND pr.product_id = oi.product_id) > 0 as is_reviewed
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id IN (?)`,
            [orderIds]
        );

        // Map items back to their parent order
        const formattedOrders = orders.map(order => {
            const items = orderItems.filter(item => item.order_id === order.id);
            let parsedShipping = null;
            try {
                parsedShipping = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
            } catch (e) {
                parsedShipping = order.shipping_address;
            }

            return {
                ...order,
                shipping_address: parsedShipping,
                items
            };
        });

        res.json({ success: true, data: formattedOrders });

    } catch (err) {
        console.error('Fetch User Orders Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper to fetch current product price
async function getProductPrice(productId) {
    const [products] = await db.query('SELECT price, name FROM products WHERE id = ?', [productId]);
    if (products.length === 0) return null;
    return products[0];
}

// POST /api/orders
// Create a new order (Works for both guest and authenticated users)
router.post('/', verifyCustomerOptional, async (req, res) => {
    try {
        const { items, shippingAddress, taxInvoice, paymentMethod, saveShippingAddress, saveTaxAddress, couponCode, customerEmail } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'ไม่พบสินค้าคำสั่งซื้อ' });
        }
        if (!shippingAddress) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุที่อยู่จัดส่ง' });
        }
        if (!paymentMethod) {
            return res.status(400).json({ success: false, error: 'กรุณาเลือกช่องทางการชำระเงิน' });
        }

        // 0. Check for Restricted Shipping Province
        const [restrictionsRow] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'shipping_restricted_provinces'");
        let restrictedProvinces = [];
        if (restrictionsRow.length > 0 && restrictionsRow[0].setting_value) {
            try {
                restrictedProvinces = JSON.parse(restrictionsRow[0].setting_value);
                if (!Array.isArray(restrictedProvinces)) restrictedProvinces = [];
            } catch (e) { }
        }

        const targetProvince = shippingAddress.province.trim().replace('จ.', '').replace('จังหวัด', '');
        const isRestricted = restrictedProvinces.some(p => targetProvince.includes(p.trim()) || p.trim().includes(targetProvince));

        if (isRestricted) {
            return res.status(400).json({ success: false, error: `ขออภัย ไม่มีบริการจัดส่งในพื้นที่ ${shippingAddress.province}` });
        }

        // 1. Calculate the product total independently on the backend for security
        let totalAmount = 0;
        const processedItems = [];

        // Preload DB info for weight and dimensions for the items
        const itemIds = items.map(i => i.product_id);
        const [dbProducts] = await db.query(
            'SELECT id, name, price, weight_kg, width_cm, length_cm, height_cm, badge_free_shipping, limit_one_per_order, stock_quantity FROM products WHERE id IN (?)',
            [itemIds]
        );

        for (const item of items) {
            const product = dbProducts.find(p => p.id === item.product_id);
            if (!product) {
                return res.status(400).json({ success: false, error: `ไม่พบสินค้า ID: ${item.product_id}` });
            }

            const quantity = parseInt(item.quantity) || 1;

            if (product.limit_one_per_order && quantity > 1) {
                return res.status(400).json({ success: false, error: `สินค้ารายการ "${product.name}" จำกัดการสั่งซื้อ 1 ชิ้นต่อ 1 คำสั่งซื้อเนื่องจากเป็นสินค้าขนาดใหญ่พิเศษ` });
            }

            if (product.stock_quantity !== null && quantity > product.stock_quantity) {
                return res.status(400).json({ success: false, error: `สินค้ารายการ "${product.name}" มีจำนวนในสต๊อกไม่เพียงพอ (เหลือ ${product.stock_quantity} ชิ้น)` });
            }

            const price = parseFloat(product.price) || 0;
            totalAmount += (price * quantity);

            processedItems.push({
                product_id: item.product_id,
                product_name: product.name,
                quantity: quantity,
                price_at_purchase: price,
                // Add physical properties for shipping calculator
                weight_kg: product.weight_kg,
                width_cm: product.width_cm,
                length_cm: product.length_cm,
                height_cm: product.height_cm,
                badge_free_shipping: product.badge_free_shipping
            });
        }

        // Fetch custom shipping formula config
        const [configRows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'shipping_formula_config'");
        let shippingConfig = null;
        if (configRows.length > 0 && configRows[0].setting_value) {
            try {
                shippingConfig = JSON.parse(configRows[0].setting_value);
            } catch (e) {
                console.error('Failed to parse shipping_formula_config:', e);
            }
        }

        // 2. Calculate Shipping Cost based on enriched items
        const shippingCalc = calculateShippingCost(
            processedItems,
            shippingAddress.province,
            shippingAddress.district || shippingAddress.subdistrict,
            shippingConfig
        );

        const shippingCost = shippingCalc.cost || 0;
        totalAmount += shippingCost;

        // 3. Validate and apply coupon
        let appliedCouponCode = null;
        let couponDiscount = 0;
        let couponRow = null;

        if (couponCode) {
            const [coupons] = await db.query(
                'SELECT * FROM coupon_codes WHERE code = ? AND is_active = 1',
                [couponCode.trim().toUpperCase()]
            );
            if (coupons.length > 0) {
                couponRow = coupons[0];
                const now = new Date();
                const notExpired = !couponRow.expires_at || new Date(couponRow.expires_at) > now;
                const hasUsage = couponRow.usage_limit === null || couponRow.used_count < couponRow.usage_limit;
                const meetsMinimum = (totalAmount - shippingCost) >= parseFloat(couponRow.min_order_amount);

                if (notExpired && hasUsage && meetsMinimum) {
                    couponDiscount = calculateDiscount(couponRow, totalAmount - shippingCost);
                    totalAmount -= couponDiscount;
                    appliedCouponCode = couponRow.code;
                }
            }
        }

        // 4. Determine guest email
        const guestEmail = (!userId && customerEmail) ? customerEmail.trim() : null;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 5. Create the Order
            const orderId = uuidv4();
            await connection.query(
                `INSERT INTO orders 
                (id, user_id, customer_email, total_amount, payment_method, shipping_address, tax_invoice, shipping_cost, coupon_code, coupon_discount) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    userId,
                    guestEmail,
                    totalAmount,
                    paymentMethod,
                    JSON.stringify(shippingAddress),
                    taxInvoice ? JSON.stringify(taxInvoice) : null,
                    shippingCost,
                    appliedCouponCode,
                    couponDiscount
                ]
            );

            // 6. Insert Order Items and Update Stock
            for (const pItem of processedItems) {
                await connection.query(
                    `INSERT INTO order_items 
                    (order_id, product_id, product_name, quantity, price_at_purchase) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [orderId, pItem.product_id, pItem.product_name, pItem.quantity, pItem.price_at_purchase]
                );

                // Reduce stock if it's being tracked
                await connection.query(
                    `UPDATE products 
                     SET stock_quantity = stock_quantity - ?,
                         is_out_of_stock = IF(stock_quantity - ? <= 0, 1, 0)
                     WHERE id = ? AND stock_quantity IS NOT NULL`,
                    [pItem.quantity, pItem.quantity, pItem.product_id]
                );
            }

            // 5. Clear the Cart if it's an authenticated user
            if (userId) {
                await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

                // 6. Handle Address Auto-Save
                if (saveShippingAddress && shippingAddress) {
                    await connection.query(
                        `INSERT INTO user_addresses 
                        (id, user_id, type, title, first_name, last_name, phone, address_line, subdistrict, district, province, postal_code, is_default)
                        VALUES (?, ?, 'shipping', 'ที่อยู่จัดส่งล่าสุด', ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                        [
                            uuidv4(), userId,
                            shippingAddress.first_name, shippingAddress.last_name, shippingAddress.phone,
                            shippingAddress.address_line, shippingAddress.subdistrict, shippingAddress.district,
                            shippingAddress.province, shippingAddress.postal_code
                        ]
                    );
                }

                if (saveTaxAddress && taxInvoice) {
                    await connection.query(
                        `INSERT INTO user_addresses 
                        (id, user_id, type, title, first_name, last_name, company_name, tax_id, branch, address_line, subdistrict, district, province, postal_code, is_default)
                        VALUES (?, ?, 'tax', 'ใบกำกับภาษีล่าสุด', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
                        [
                            uuidv4(), userId,
                            shippingAddress ? shippingAddress.first_name : '-',
                            shippingAddress ? shippingAddress.last_name : '-',
                            taxInvoice.company_name, taxInvoice.tax_id, taxInvoice.branch,
                            taxInvoice.address_line, taxInvoice.subdistrict, taxInvoice.district,
                            taxInvoice.province, taxInvoice.postal_code
                        ]
                    );
                }
            }

            await connection.commit();

            // Increment coupon used_count (non-blocking)
            if (couponRow) {
                db.query('UPDATE coupon_codes SET used_count = used_count + 1 WHERE id = ?', [couponRow.id])
                    .catch(e => console.error('[Coupon] Failed to increment used_count:', e.message));
            }

            // Send Email Confirmation (Non-blocking) — supports both logged-in and guest
            sendOrderConfirmation(
                { id: orderId, user_id: userId, total_amount: totalAmount, coupon_code: appliedCouponCode, coupon_discount: couponDiscount },
                processedItems,
                shippingAddress,
                guestEmail
            ).catch(e => console.error('[Auto] Silent email error:', e.message));

            // Notify Admin (Non-blocking)
            notifyAdmins('order', {
                orderId,
                totalAmount,
                itemCount: processedItems.length,
                paymentMethod: paymentMethod || 'N/A',
                customerName: shippingAddress ? `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim() : (guestEmail || 'Guest')
            }).catch(e => console.error('[Auto] Silent notification error:', e.message));

            res.status(201).json({
                success: true,
                message: 'สั่งซื้อสำเร็จ',
                order_id: orderId,
                total_amount: totalAmount,
                shipping_cost: shippingCost
            });

        } catch (txnErr) {
            await connection.rollback();
            console.error('Transaction Error in Order creation:', txnErr);
            throw txnErr;
        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Create Order Error:', err);
        console.error('Create Order Error (stack):', err.stack);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' });
    }
});

// ========== ADMIN ENDPOINTS ==========

// GET /api/orders/admin/all — List all orders with filters
router.get('/admin/all', verifyAdmin, async (req, res) => {
    try {
        const { status, payment_status, search, start_date, end_date, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

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

        // Count total
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM orders o WHERE ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;

        // Fetch orders
        const [orders] = await db.query(
            `SELECT o.*, u.first_name as user_first_name, u.last_name as user_last_name, u.email as user_email, u.phone as user_phone
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             WHERE ${whereClause}
             ORDER BY o.created_at DESC
             LIMIT ? OFFSET ?`,
            [...queryParams, parseInt(limit), offset]
        );

        // Fetch items for these orders
        if (orders.length > 0) {
            const orderIds = orders.map(o => o.id);
            const [items] = await db.query(
                `SELECT oi.*, p.image_url as product_image
                 FROM order_items oi
                 LEFT JOIN products p ON oi.product_id = p.id
                 WHERE oi.order_id IN (?)`,
                [orderIds]
            );

            for (const order of orders) {
                order.items = items.filter(i => i.order_id === order.id);
                try { order.shipping_address_parsed = JSON.parse(order.shipping_address); } catch(e) { order.shipping_address_parsed = {}; }
                try { order.tax_invoice_parsed = JSON.parse(order.tax_invoice); } catch(e) { order.tax_invoice_parsed = null; }
            }
        }

        // Summary stats
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payment,
                SUM(CASE WHEN payment_status = 'reviewing' THEN 1 ELSE 0 END) as reviewing_payment,
                SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
                SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
                COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0) as total_revenue
            FROM orders
        `);

        res.json({
            success: true,
            data: orders,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
            stats: stats[0]
        });
    } catch (err) {
        console.error('Admin Fetch Orders Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper: log order activity
const logActivity = async (orderId, action, details, performedBy = 'admin') => {
    try {
        await db.query(
            'INSERT INTO order_activity_log (order_id, action, details, performed_by) VALUES (?, ?, ?, ?)',
            [orderId, action, details, performedBy]
        );
    } catch (e) {
        console.error('Log activity error:', e.message);
    }
};

// Status label maps
const orderStatusLabels = { pending: 'รอดำเนินการ', confirmed: 'ยืนยันแล้ว', processing: 'กำลังจัดเตรียม', shipped: 'จัดส่งแล้ว', delivered: 'ส่งถึงแล้ว', cancelled: 'ยกเลิก', refunded: 'คืนเงินแล้ว' };
const paymentStatusLabels = { pending: 'รอชำระ', reviewing: 'รอตรวจสอบ', paid: 'ชำระแล้ว', failed: 'ชำระไม่สำเร็จ', rejected: 'ปฏิเสธการชำระ', refunded: 'คืนเงินแล้ว', cancelled: 'ยกเลิก' };

// PUT /api/orders/admin/:id/status — Update order/payment status with activity log
router.put('/admin/:id/status', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { order_status, payment_status, cancel_reason } = req.body;

        const [orders] = await db.query('SELECT id, order_status, payment_status FROM orders WHERE id = ?', [id]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบคำสั่งซื้อ' });
        }
        const prev = orders[0];

        const updates = [];
        const params = [];

        if (order_status && order_status !== prev.order_status) {
            updates.push('order_status = ?');
            params.push(order_status);
            // Auto-set timestamps
            if (order_status === 'shipped') { updates.push('shipped_at = NOW()'); }
            if (order_status === 'delivered') { updates.push('delivered_at = NOW()'); }
            if (order_status === 'cancelled') {
                updates.push('cancelled_at = NOW()');
                if (cancel_reason) { updates.push('cancel_reason = ?'); params.push(cancel_reason); }

                // Restore stock quantities when order is cancelled
                try {
                    const [orderItems] = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
                    for (const item of orderItems) {
                        await db.query(
                            `UPDATE products 
                             SET stock_quantity = stock_quantity + ?,
                                 is_out_of_stock = 0
                             WHERE id = ? AND stock_quantity IS NOT NULL`,
                            [item.quantity, item.product_id]
                        );
                    }
                    console.log(`[Stock] Restored stock for ${orderItems.length} items from cancelled order ${id}`);
                } catch (stockErr) {
                    console.error('[Stock] Failed to restore stock on cancel:', stockErr.message);
                }
            }
            await logActivity(id, 'status_change', `เปลี่ยนสถานะคำสั่งซื้อ: ${orderStatusLabels[prev.order_status] || prev.order_status} → ${orderStatusLabels[order_status] || order_status}`);
        }
        if (payment_status && payment_status !== prev.payment_status) {
            updates.push('payment_status = ?');
            params.push(payment_status);
            await logActivity(id, 'payment_change', `เปลี่ยนสถานะการชำระ: ${paymentStatusLabels[prev.payment_status] || prev.payment_status} → ${paymentStatusLabels[payment_status] || payment_status}`);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'ไม่มีข้อมูลที่ต้องอัปเดต' });
        }

        params.push(id);
        await db.query(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);

        // Send Email Update (Non-blocking)
        sendOrderStatusUpdate(id, order_status, payment_status)
            .catch(e => console.error('[Auto] Silent email error on update:', e.message));

        res.json({ success: true, message: 'อัปเดตสถานะเรียบร้อยแล้ว' });
    } catch (err) {
        console.error('Admin Update Order Status Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/orders/admin/:id/notes — Add admin notes
router.put('/admin/:id/notes', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_notes } = req.body;

        await db.query('UPDATE orders SET admin_notes = ? WHERE id = ?', [admin_notes, id]);
        await logActivity(id, 'note_updated', 'อัปเดตหมายเหตุภายใน');
        res.json({ success: true, message: 'บันทึกหมายเหตุเรียบร้อยแล้ว' });
    } catch (err) {
        console.error('Admin Update Notes Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/orders/admin/:id/tracking — Update tracking info
router.put('/admin/:id/tracking', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { tracking_number, shipping_provider } = req.body;

        await db.query('UPDATE orders SET tracking_number = ?, shipping_provider = ? WHERE id = ?', [tracking_number || null, shipping_provider || null, id]);
        if (tracking_number) {
            await logActivity(id, 'tracking_updated', `เพิ่มเลขพัสดุ: ${tracking_number} (${shipping_provider || '-'})`);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/orders/admin/:id/print-label — Toggle printed shipping label
router.put('/admin/:id/print-label', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { printed } = req.body;
        await db.query('UPDATE orders SET printed_shipping_label = ? WHERE id = ?', [printed ? 1 : 0, id]);
        if (printed) await logActivity(id, 'label_printed', 'พิมพ์ใบปะหน้าพัสดุ');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/orders/admin/:id/activity — Fetch activity log
router.get('/admin/:id/activity', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [logs] = await db.query(
            'SELECT * FROM order_activity_log WHERE order_id = ? ORDER BY created_at DESC LIMIT 50',
            [id]
        );
        res.json({ success: true, data: logs });
    } catch (err) {
        res.status(500).json({ success: true, data: [] });
    }
});

// GET /api/orders/admin/company-settings — Fetch company info for documents
router.get('/admin/company-settings', verifyAdmin, async (req, res) => {
    try {
        const [rows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'contact_%'");
        const settings = {};
        for (const row of rows) {
            settings[row.setting_key] = row.setting_value;
        }
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/orders/:id
// Fetch a single order with its items
// - Authenticated users: must own the order
// - Unauthenticated: receives limited data (no shipping/tax details) to support order-success page
router.get('/:id', verifyCustomerOptional, async (req, res) => {
    try {
        const orderId = req.params.id;

        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบคำสั่งซื้อ' });
        }

        const order = orders[0];

        // Ownership check for authenticated users
        if (req.user) {
            if (order.user_id && order.user_id !== req.user.id) {
                return res.status(403).json({ success: false, error: 'คุณไม่มีสิทธิ์ดูคำสั่งซื้อนี้' });
            }
        }

        // Fetch order items with product images and review status
        const [items] = await db.query(
            `SELECT oi.*, p.image_url as product_image,
               (SELECT COUNT(*) FROM product_reviews pr WHERE pr.order_id = oi.order_id AND pr.product_id = oi.product_id) > 0 as is_reviewed
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        // Parse JSON fields
        let parsedShipping = null;
        let parsedTax = null;
        try { parsedShipping = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address; } catch(e) {}
        try { parsedTax = typeof order.tax_invoice === 'string' ? JSON.parse(order.tax_invoice) : order.tax_invoice; } catch(e) {}

        // For unauthenticated requests, strip sensitive PII fields
        if (!req.user) {
            const { shipping_address, tax_invoice, ...safeOrder } = order;
            return res.json({ success: true, data: { ...safeOrder, items } });
        }

        res.json({ success: true, data: { ...order, shipping_address: parsedShipping, tax_invoice: parsedTax, items } });
    } catch (err) {
        console.error('Fetch Single Order Error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ' });
    }
});

// POST /api/orders/:id/payment-slip
// Upload payment proof for an order
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const slipUploadDir = path.join(__dirname, '../public/uploads/slips');
if (!fs.existsSync(slipUploadDir)) {
    fs.mkdirSync(slipUploadDir, { recursive: true });
}

const slipStorage = multer.memoryStorage();
const slipUpload = multer({ storage: slipStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/:id/payment-slip', slipUpload.single('slip'), async (req, res) => {
    try {
        const orderId = req.params.id;

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'กรุณาแนบรูปหลักฐานการชำระเงิน' });
        }

        // Verify the order exists
        const [orders] = await db.query('SELECT id, payment_status, total_amount FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบคำสั่งซื้อ' });
        }

        const order = orders[0];

        // Convert & save the slip image
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'slip-' + uniqueSuffix + '.webp';
        const filepath = path.join(slipUploadDir, filename);

        await sharp(req.file.buffer)
            .resize(800, null, { withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(filepath);

        const slipUrl = `/uploads/slips/${filename}`;

        // Update the order with slip URL and change payment status to reviewing
        await db.query(
            'UPDATE orders SET payment_slip_url = ?, payment_status = ? WHERE id = ?',
            [slipUrl, 'reviewing', orderId]
        );

        // Notify Admin (Non-blocking)
        notifyAdmins('payment_slip', {
            orderId: orderId,
            totalAmount: order.total_amount,
            slipUrl: slipUrl
        }).catch(e => console.error('[Auto] Silent notification error:', e.message));

        res.json({
            success: true,
            message: 'อัปโหลดหลักฐานเรียบร้อยแล้ว กรุณารอการตรวจสอบ',
            slip_url: slipUrl,
            payment_status: 'reviewing'
        });

    } catch (err) {
        console.error('Upload Payment Slip Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/orders/:id/cancel
// Cancel an order (only if payment_status is still 'pending')
// Requires authentication — user must own the order (or be a guest with matching session)
router.put('/:id/cancel', verifyCustomerOptional, async (req, res) => {
    try {
        const orderId = req.params.id;

        const [orders] = await db.query(
            'SELECT id, user_id, payment_status, order_status FROM orders WHERE id = ?',
            [orderId]
        );
        if (orders.length === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบคำสั่งซื้อ' });
        }

        const order = orders[0];

        // Ownership check: authenticated users must own the order
        // Guest orders (user_id IS NULL) cannot be cancelled via API to prevent abuse
        if (req.user) {
            if (order.user_id !== req.user.id) {
                return res.status(403).json({ success: false, error: 'คุณไม่มีสิทธิ์ยกเลิกคำสั่งซื้อนี้' });
            }
        } else {
            // Guest without token — block cancellation to prevent unauthorized access
            return res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบก่อนยกเลิกคำสั่งซื้อ' });
        }

        if (order.payment_status !== 'pending') {
            return res.status(400).json({ success: false, error: 'ไม่สามารถยกเลิกคำสั่งซื้อที่ชำระเงินแล้วหรืออยู่ระหว่างตรวจสอบ' });
        }

        await db.query(
            'UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?',
            ['cancelled', 'cancelled', orderId]
        );

        res.json({ success: true, message: 'ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว' });
    } catch (err) {
        console.error('Cancel Order Error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ' });
    }
});

// GET /api/orders/export
// Export orders to external systems (ERP/Accounting) with apikey auth
router.get('/export', verifyApiToken, async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;

        let query = 'SELECT * FROM orders WHERE 1=1';
        const queryParams = [];

        if (status) {
            query += ' AND order_status = ?';
            queryParams.push(status);
        }

        if (startDate) {
            query += ' AND created_at >= ?';
            queryParams.push(`${startDate} 00:00:00`);
        }

        if (endDate) {
            query += ' AND created_at <= ?';
            queryParams.push(`${endDate} 23:59:59`);
        }

        query += ' ORDER BY created_at DESC';

        const [orders] = await db.query(query, queryParams);

        if (orders.length === 0) {
            return res.json({ success: true, count: 0, orders: [] });
        }

        // Fetch all items for these orders
        const orderIds = orders.map(o => o.id);
        const [orderItems] = await db.query(
            `SELECT oi.*, p.sku, p.weight_kg 
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id IN (?)`,
            [orderIds]
        );

        // Format payload
        const formattedOrders = orders.map(order => {
            let shippingAddress = {};
            let taxInvoice = {};
            try { shippingAddress = JSON.parse(order.shipping_address) || {}; } catch(e){}
            try { taxInvoice = JSON.parse(order.tax_invoice) || {}; } catch(e){}

            const items = orderItems.filter(item => item.order_id === order.id).map(item => ({
                product_id: item.product_id,
                sku: item.sku || '-',
                name: item.product_name,
                quantity: item.quantity,
                unit_price: item.price_at_purchase,
                total_price: item.price_at_purchase * item.quantity,
                weight_kg: item.weight_kg || 0
            }));

            return {
                order_id: order.id,
                customer_id: order.user_id,
                status: order.order_status,
                payment_status: order.payment_status,
                payment_method: order.payment_method,
                shipping_cost: order.shipping_cost || 0,
                total_amount: order.total_amount,
                created_at: order.created_at,
                customer_details: {
                    name: `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim(),
                    phone: shippingAddress.phone || '',
                    company_name: taxInvoice.company_name || '',
                    tax_id: taxInvoice.tax_id || ''
                },
                shipping_address: shippingAddress,
                tax_invoice: taxInvoice,
                items: items
            };
        });

        res.json({
            success: true,
            count: formattedOrders.length,
            generated_at: new Date(),
            orders: formattedOrders
        });

    } catch (err) {
        console.error('Export Orders Error:', err);
        res.status(500).json({ success: false, error: 'Internal Server Error during export' });
    }
});

// GET /api/orders/export/:id
// Export a single order details by ID with apikey auth
router.get('/export/:id', verifyApiToken, async (req, res) => {
    try {
        const orderId = req.params.id;

        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        const order = orders[0];

        const [orderItems] = await db.query(
            `SELECT oi.*, p.sku, p.weight_kg 
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        let shippingAddress = {};
        let taxInvoice = {};
        try { shippingAddress = JSON.parse(order.shipping_address) || {}; } catch(e){}
        try { taxInvoice = JSON.parse(order.tax_invoice) || {}; } catch(e){}

        const items = orderItems.map(item => ({
            product_id: item.product_id,
            sku: item.sku || '-',
            name: item.product_name,
            quantity: item.quantity,
            unit_price: item.price_at_purchase,
            total_price: item.price_at_purchase * item.quantity,
            weight_kg: item.weight_kg || 0
        }));

        const formattedOrder = {
            order_id: order.id,
            customer_id: order.user_id,
            status: order.order_status,
            payment_status: order.payment_status,
            payment_method: order.payment_method,
            shipping_cost: order.shipping_cost || 0,
            total_amount: order.total_amount,
            created_at: order.created_at,
            customer_details: {
                name: `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim(),
                phone: shippingAddress.phone || '',
                company_name: taxInvoice.company_name || '',
                tax_id: taxInvoice.tax_id || ''
            },
            shipping_address: shippingAddress,
            tax_invoice: taxInvoice,
            items: items
        };

        res.json({
            success: true,
            generated_at: new Date(),
            data: formattedOrder
        });

    } catch (err) {
        console.error('Export Single Order Error:', err);
        res.status(500).json({ success: false, error: 'Internal Server Error during export' });
    }
});



// DELETE /api/orders/admin/bulk-delete
// Bulk delete orders
router.delete('/admin/bulk-delete', verifyAdmin, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            connection.release();
            return res.status(400).json({ success: false, error: 'กรุณาระบุคำสั่งซื้อที่ต้องการลบ' });
        }

        await connection.beginTransaction();

        // Delete related logs, items, and unlink reviews
        await connection.query('DELETE FROM order_activity_log WHERE order_id IN (?)', [ids]);
        await connection.query('UPDATE product_reviews SET order_id = NULL WHERE order_id IN (?)', [ids]);
        await connection.query('DELETE FROM order_items WHERE order_id IN (?)', [ids]);

        // Delete orders
        const [result] = await connection.query('DELETE FROM orders WHERE id IN (?)', [ids]);

        await connection.commit();
        connection.release();

        res.json({
            success: true,
            message: `ลบคำสั่งซื้อเรียบร้อยแล้ว (${result.affectedRows} รายการ)`,
            deletedCount: result.affectedRows
        });
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Bulk Delete Orders Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/orders/admin/:id
// Delete single order by ID
router.delete('/admin/:id', verifyAdmin, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;

        const [orders] = await connection.query('SELECT id FROM orders WHERE id = ?', [id]);
        if (orders.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, error: 'ไม่พบคำสั่งซื้อนี้' });
        }

        await connection.beginTransaction();

        // Delete related logs, items, and unlink reviews
        await connection.query('DELETE FROM order_activity_log WHERE order_id = ?', [id]);
        await connection.query('UPDATE product_reviews SET order_id = NULL WHERE order_id = ?', [id]);
        await connection.query('DELETE FROM order_items WHERE order_id = ?', [id]);

        // Delete order
        await connection.query('DELETE FROM orders WHERE id = ?', [id]);

        await connection.commit();
        connection.release();

        res.json({
            success: true,
            message: 'ลบคำสั่งซื้อเรียบร้อยแล้ว'
        });
    } catch (err) {
        await connection.rollback();
        connection.release();
        console.error('Delete Order Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

