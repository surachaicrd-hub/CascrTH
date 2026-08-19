const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin, verifyApiToken } = require('./auth');

// GET quotation requests with pagination & search (admin only)
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 15));
        const offset = (page - 1) * limit;
        const search = (req.query.search || '').trim();
        const status = (req.query.status || '').trim();

        let where = [];
        let params = [];

        if (search) {
            where.push(`(customer_name LIKE ? OR phone LIKE ? OR email LIKE ? OR company_name LIKE ? OR location LIKE ?)`);
            const like = `%${search}%`;
            params.push(like, like, like, like, like);
        }
        if (status && status !== 'all') {
            where.push(`(status = ? OR (? = 'ใหม่' AND (status IS NULL OR status = '')))`);
            params.push(status, status);
        }

        const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

        // Get total count
        const [countRows] = await db.query(
            `SELECT COUNT(*) as total FROM quotation_requests ${whereClause}`,
            params
        );
        const total = countRows[0].total;

        // Get paginated data
        const [rows] = await db.query(
            `SELECT id, request_type, company_name, tax_id, customer_name, phone, email, 
                    location, project_scale, area_size, budget, need_installation, 
                    usage_type, details, attached_product, status, created_at 
             FROM quotation_requests ${whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        // Stats (always unfiltered for the stat cards)
        const [statsRows] = await db.query(
            `SELECT 
               COUNT(*) as total,
               SUM(CASE WHEN status IS NULL OR status = '' OR status = 'ใหม่' THEN 1 ELSE 0 END) as new_count,
               SUM(CASE WHEN status = 'ติดต่อแล้ว' THEN 1 ELSE 0 END) as contacted_count,
               SUM(CASE WHEN status = 'ปิดการขาย' THEN 1 ELSE 0 END) as closed_count
             FROM quotation_requests`
        );

        res.json({
            success: true,
            data: rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            limit,
            stats: {
                total: statsRows[0].total,
                new: statsRows[0].new_count,
                contacted: statsRows[0].contacted_count,
                closed: statsRows[0].closed_count,
            }
        });
    } catch (error) {
        console.error('Error fetching quotations:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch quotations' });
    }
});

// PATCH update quotation status (admin only)
router.patch('/:id/status', verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        const allowed = ['ใหม่', 'ติดต่อแล้ว', 'ปิดการขาย'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status value' });
        }
        await db.execute('UPDATE quotation_requests SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating quotation status:', error);
        res.status(500).json({ success: false, error: 'Failed to update status' });
    }
});

router.post('/', async (req, res) => {
    try {
        const {
            requestType,
            companyName,
            taxId,
            email,
            customerName,
            phone,
            location,
            projectScale,
            areaSize,
            budget,
            needInstallation,
            usageType,
            details,
            attachedProduct,
            botHoneypot,
            captchaAnswer,
            captchaConfig,
            sessionId
        } = req.body;

        // --- BOT PROTECTION ---
        // 1. Honeypot check (if it's filled, it's a bot)
        // 2. Dynamic Math check
        let isBot = !!botHoneypot;

        if (!customerName || !phone) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อและเบอร์โทรศัพท์สำหรับติดต่อกลับ' });
        }

        if (!isBot && (!captchaConfig || typeof captchaConfig.num1 !== 'number' || typeof captchaConfig.num2 !== 'number' || captchaConfig.num1 < 1 || captchaConfig.num1 > 20 || captchaConfig.num2 < 1 || captchaConfig.num2 > 20)) {
            isBot = true;
        } else if (!isBot) {
            const expectedAnswer = captchaConfig.num1 + captchaConfig.num2;
            if (parseInt(captchaAnswer) !== expectedAnswer) {
                isBot = true;
            }
        }

        if (isBot) {
            console.log('Bot detected in quotation form. Reason:', {
                botHoneypot,
                hasConfig: !!captchaConfig,
                answer: captchaAnswer,
                expected: captchaConfig ? (captchaConfig.num1 + captchaConfig.num2) : null
            });
            // Return fake success to the bot
            const fakeId = require('crypto').randomUUID();
            return res.status(201).json({
                success: true,
                message: 'Quotation submitted successfully',
                id: 'FAKE-' + fakeId
            });
        }
        // --- END BOT PROTECTION ---

        console.log('Inserting valid request into DB...');

        const id = require('crypto').randomUUID();
        const query = `
      INSERT INTO quotation_requests 
      (id, request_type, company_name, tax_id, email, customer_name, phone, location, project_scale, area_size, budget, need_installation, usage_type, details, attached_product) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        await db.execute(query, [
            id,
            requestType || 'individual',
            companyName || null,
            taxId || null,
            email || null,
            customerName,
            phone,
            location || null,
            projectScale || null,
            areaSize ? parseInt(areaSize, 10) : null,
            budget || null,
            needInstallation ? 1 : 0,
            usageType || null,
            details || null,
            attachedProduct || null
        ]);

        // Track this conversion event if sessionId exists
        if (sessionId) {
            const trackingId = require('crypto').randomUUID();
            const trackingQuery = `
        INSERT INTO customer_behavior (id, session_id, event_type, event_data)
        VALUES (?, ?, 'submit_quotation', ?)
      `;
            await db.execute(trackingQuery, [
                trackingId,
                sessionId,
                JSON.stringify({ lead_id: id, value: budget })
            ]);
        }

        // Notify admins asynchronously (don't block the response)
        const { notifyAdmins } = require('../services/notificationService');
        notifyAdmins('quotation', {
            requestType,
            companyName,
            customerName,
            phone,
            usageType,
            areaSize,
            budget
        }).catch(console.error);

        // Send email asynchronously (no PDF generated or attached)
        if (email) {
            const { sendQuotationEmail } = require('../services/emailService');
            sendQuotationEmail(email, {
                id: id,
                customerName: customerName,
                phone: phone
            }).catch(emailErr => {
                console.error('Failed to send quotation confirmation email:', emailErr);
            });
        }

        res.status(201).json({
            success: true,
            message: 'Quotation submitted successfully',
            id: id
        });
    } catch (error) {
        console.error('Error submitting quotation:', error);
        if (error.sqlMessage) console.error('SQL Error:', error.sqlMessage);
        res.status(500).json({ success: false, error: 'Failed to process quotation' });
    }
});

// DELETE a quotation (admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check quotation exists
        const [existing] = await db.query(
            'SELECT id FROM quotation_requests WHERE id = ?',
            [id]
        );
        if (existing.length === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบรายการที่ต้องการลบ' });
        }

        await db.execute('DELETE FROM quotation_requests WHERE id = ?', [id]);
        res.json({ success: true, message: 'ลบรายการเรียบร้อยแล้ว' });

    } catch (error) {
        console.error('Error deleting quotation:', error);
        res.status(500).json({ success: false, error: 'Failed to delete quotation' });
    }
});

// GET /api/quotation/export
// Export quotation leads to external systems with apikey auth
router.get('/export', verifyApiToken, async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;

        let query = 'SELECT * FROM quotation_requests WHERE 1=1';
        const queryParams = [];

        if (status) {
            query += ' AND status = ?';
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

        const [rows] = await db.query(query, queryParams);

        res.json({
            success: true,
            count: rows.length,
            generated_at: new Date(),
            leads: rows
        });

    } catch (error) {
        console.error('Export Quotations Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error during export' });
    }
});

module.exports = router;
