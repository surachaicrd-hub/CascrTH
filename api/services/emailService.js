const nodemailer = require('nodemailer');
const db = require('../config/database');

// Create transporter reading SMTP config from DB first, fallback to .env
const getTransporter = async () => {
    try {
        const result = await db.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('smtp_host','smtp_port','smtp_user','smtp_password','smtp_secure','smtp_from_name')"
        );
        const rows = Array.isArray(result?.[0]) ? result[0] : [];
        const s = {};
        for (const r of rows) s[r.setting_key] = r.setting_value;

        const host = s.smtp_host || process.env.SMTP_HOST;
        const port = s.smtp_port || process.env.SMTP_PORT || '587';
        const user = s.smtp_user || process.env.SMTP_USER;
        const pass = s.smtp_password || process.env.SMTP_PASS;
        const secure = s.smtp_secure === 'true' || process.env.SMTP_SECURE === 'true' || parseInt(port) === 465;

        if (!host || !user || !pass) return null;

        return { 
            transport: nodemailer.createTransport({ 
                host, 
                port: parseInt(port), 
                secure, 
                auth: { user, pass },
                tls: { rejectUnauthorized: false } // Bypass untrusted certificate issues
            }),
            fromName: s.smtp_from_name || process.env.SMTP_FROM_NAME || s.store_name || 'CR Distribution',
            fromEmail: user
        };
    } catch (e) {
        if (process.env.NODE_ENV !== 'test') {
            console.warn('[Email] Failed to read SMTP from DB, falling back to .env', e.message);
        }
        const host = process.env.SMTP_HOST;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const port = process.env.SMTP_PORT || '587';
        if (!host || !user || !pass) return null;
        return {
            transport: nodemailer.createTransport({ 
                host, 
                port: parseInt(port), 
                secure: parseInt(port) === 465, 
                auth: { user, pass },
                tls: { rejectUnauthorized: false } // Bypass untrusted certificate issues
            }),
            fromName: process.env.SMTP_FROM_NAME || 'CR Distribution',
            fromEmail: user
        };
    }
};

const getStoreSettings = async () => {
    try {
        const [rows] = await db.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'store_logo', 'contact_email', 'contact_phones', 'contact_emails', 'contact_lines', 'store_url')"
        );
        const s = {};
        for (const r of rows) s[r.setting_key] = r.setting_value;
        return { 
            storeName: s.store_name || 'CR Distribution', 
            storeLogo: s.store_logo || '', 
            contactEmail: s.contact_email || '',
            contactEmails: s.contact_emails || '',
            contactPhones: s.contact_phones || '',
            contactLines: s.contact_lines || '',
            storeUrl: s.store_url || process.env.FRONTEND_URL || 'http://localhost:5173'
        };
    } catch (e) {
        return { 
            storeName: 'CR Distribution', 
            storeLogo: '', 
            contactEmail: '', 
            contactEmails: '',
            contactPhones: '',
            contactLines: '',
            storeUrl: process.env.FRONTEND_URL || 'http://localhost:5173' 
        };
    }
};

const emailTemplate = (content, store) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr><td style="background-color:#ffffff;padding:32px 40px 24px;text-align:center;border-bottom:1px solid #f3f4f6;">
          ${store.storeLogo ? `<img src="${store.storeLogo}" alt="${store.storeName}" style="height:40px;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;">` : ''}
          <h1 style="margin:0;color:#111827;font-size:20px;font-weight:800;letter-spacing:-0.5px;">${store.storeName}</h1>
        </td></tr>
        
        <!-- Content -->
        <tr><td style="padding:40px;">${content}</td></tr>
        
        <!-- Footer -->
        <tr><td style="padding:32px 40px;background-color:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;">
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
            © ${new Date().getFullYear()} ${store.storeName}. All rights reserved.<br>
            ${store.contactEmail ? `หากมีข้อสงสัยติดต่อเราได้ที่ <a href="mailto:${store.contactEmail}" style="color:#059669;text-decoration:none;">${store.contactEmail}</a>` : ''}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const formatPrice = (amount) => `฿${Number(amount || 0).toLocaleString('th-TH')}`;

const orderStatusLabels = {
    pending: 'รอดำเนินการ', confirmed: 'ยืนยันแล้ว', processing: 'กำลังจัดเตรียม',
    shipped: 'จัดส่งแล้ว', delivered: 'ส่งถึงแล้ว', completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก', refunded: 'คืนเงินแล้ว'
};
const paymentStatusLabels = {
    pending: 'รอชำระเงิน', reviewing: 'รอตรวจสอบ', paid: 'ชำระเงินแล้ว',
    failed: 'ชำระไม่สำเร็จ', rejected: 'ปฏิเสธ', refunded: 'คืนเงินแล้ว', cancelled: 'ยกเลิก'
};

// Helper to insert email logs into the database, with automatic self-healing table creation
const insertLog = async (recipient, subject, emailType, status, errorMessage = null) => {
    const runInsert = () => db.query(
        "INSERT INTO email_logs (recipient, subject, email_type, status, error_message) VALUES (?, ?, ?, ?, ?)",
        [recipient, subject, emailType, status, errorMessage]
    );

    try {
        await runInsert();
    } catch (e) {
        // If the table doesn't exist, create it and retry once
        if (e.code === 'ER_NO_SUCH_TABLE' || e.errno === 1146) {
            console.log('[Email Log] email_logs table does not exist. Creating it now...');
            try {
                await db.query(`
                  CREATE TABLE IF NOT EXISTS email_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    recipient VARCHAR(255) NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    email_type VARCHAR(50) NOT NULL,
                    status ENUM('success', 'failed') NOT NULL,
                    error_message TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                `);
                console.log('[Email Log] email_logs table created successfully. Retrying insert...');
                await runInsert();
            } catch (createErr) {
                console.error('[Email Log] Failed to create table on retry:', createErr.message);
            }
        } else {
            console.error('[Email Log] DB Error:', e.message);
        }
    }
};

// Helper: Send mail and log results in database
const sendMailLogged = async ({ recipient, subject, emailType, html, attachments = [], bcc = [] }) => {
    const mailer = await getTransporter();
    if (!mailer) {
        const errorMsg = 'SMTP not configured';
        if (process.env.NODE_ENV !== 'test') {
            console.warn(`[Email] ${errorMsg} - emails will be skipped.`);
        }
        await insertLog(recipient, subject, emailType, 'failed', errorMsg);
        return;
    }
    
    try {
        await mailer.transport.sendMail({
            from: `"${mailer.fromName}" <${mailer.fromEmail}>`,
            to: recipient,
            bcc: bcc,
            subject,
            html,
            attachments
        });
        
        await insertLog(recipient, subject, emailType, 'success');
        console.log(`[Email] ${emailType} sent successfully to ${recipient}`);
    } catch (err) {
        console.error(`[Email] Failed to send ${emailType}:`, err.message);
        await insertLog(recipient, subject, emailType, 'failed', err.message);
    }
};

/**
 * Send order confirmation email
 * Supports both logged-in users (via user_id) and guests (via guestEmail param)
 */
const sendOrderConfirmation = async (order, items, shippingAddress, guestEmail = null) => {
    let customerEmail = guestEmail || null;
    if (order.user_id) {
        try {
            const [users] = await db.query('SELECT email FROM users WHERE id = ?', [order.user_id]);
            if (users.length > 0 && users[0].email) customerEmail = users[0].email;
        } catch (e) {}
    }
    if (!customerEmail) return;

    const store = await getStoreSettings();
    const orderId = order.id || order.order_id;
    const shortId = orderId.split('-')[0].toUpperCase();

    const itemsHtml = items.map(item => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
            <strong style="color:#111827;">${item.product_name || item.name}</strong>
            <br><span style="font-size:13px;color:#6b7280;">จำนวน ${item.quantity} ชิ้น</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#059669;">
            ${formatPrice((item.price_at_purchase || item.price) * item.quantity)}
          </td>
        </tr>`).join('');

    const couponHtml = (order.coupon_code && order.coupon_discount > 0) ? `
        <tr>
          <td style="padding:8px 0;color:#059669;">🎟️ โค้ดส่วนลด (${order.coupon_code})</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;color:#059669;">- ${formatPrice(order.coupon_discount)}</td>
        </tr>` : '';

    const addressHtml = shippingAddress ? `
        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-top:20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;">ที่อยู่จัดส่ง</p>
          <p style="margin:0;color:#374151;font-size:14px;">
            ${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}<br>
            ${shippingAddress.address_line || ''}<br>
            ต.${shippingAddress.subdistrict || ''} อ.${shippingAddress.district || ''}<br>
            จ.${shippingAddress.province || ''} ${shippingAddress.postal_code || ''}<br>
            โทร: ${shippingAddress.phone || '-'}
          </p>
        </div>` : '';

    const content = `
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">ขอบคุณสำหรับคำสั่งซื้อ! 🎉</h2>
        <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">เราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว</p>
        <div style="background:#ecfdf5;border-radius:12px;padding:16px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#059669;font-weight:700;">หมายเลขคำสั่งซื้อ</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:900;color:#065f46;letter-spacing:1px;">#${shortId}</p>
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:8px 0;border-bottom:2px solid #e5e7eb;font-weight:700;color:#374151;">สินค้า</td>
            <td style="padding:8px 0;border-bottom:2px solid #e5e7eb;font-weight:700;color:#374151;text-align:right;">จำนวนเงิน</td>
          </tr>
          ${itemsHtml}
          ${couponHtml}
          <tr>
            <td style="padding:16px 0 0;font-weight:900;font-size:16px;color:#111827;">ยอดรวมสุทธิ</td>
            <td style="padding:16px 0 0;font-weight:900;font-size:18px;color:#059669;text-align:right;">${formatPrice(order.total_amount)}</td>
          </tr>
        </table>
        ${addressHtml}
        <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">หากมีข้อสงสัยสามารถติดต่อทีมงานของเราได้ตลอดเวลา</p>`;

    await sendMailLogged({
        recipient: customerEmail,
        subject: `ยืนยันคำสั่งซื้อ #${shortId} — ${store.storeName}`,
        emailType: 'OrderConfirmation',
        html: emailTemplate(content, store)
    });
};

/**
 * Send order status update email (supports both logged-in users and guests)
 */
const sendOrderStatusUpdate = async (orderId, newOrderStatus, newPaymentStatus) => {
    try {
        const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (orders.length === 0) return;
        const order = orders[0];

        // Find customer email: user account first, then guest email saved in order
        let customerEmail = order.customer_email || null;
        let firstName = 'ลูกค้า';

        if (order.user_id) {
            const [users] = await db.query('SELECT email, first_name FROM users WHERE id = ?', [order.user_id]);
            if (users.length > 0 && users[0].email) {
                customerEmail = users[0].email;
                firstName = users[0].first_name || 'ลูกค้า';
            }
        }
        if (!customerEmail) return;

        const store = await getStoreSettings();
        const shortId = orderId.split('-')[0].toUpperCase();

        let statusMessage = '';
        let emoji = '📋';

        if (newOrderStatus) {
            const label = orderStatusLabels[newOrderStatus] || newOrderStatus;
            switch (newOrderStatus) {
                case 'confirmed': emoji = '✅'; statusMessage = `คำสั่งซื้อของคุณได้รับการยืนยันแล้ว`; break;
                case 'processing': emoji = '📦'; statusMessage = `คำสั่งซื้อของคุณกำลังถูกจัดเตรียมเพื่อจัดส่ง`; break;
                case 'shipped': emoji = '🚚'; statusMessage = `คำสั่งซื้อของคุณจัดส่งแล้ว!${order.tracking_number ? ` เลขพัสดุ: ${order.tracking_number}` : ''}`; break;
                case 'delivered': emoji = '🏠'; statusMessage = `คำสั่งซื้อของคุณส่งถึงที่หมายแล้ว`; break;
                case 'completed': emoji = '🎉'; statusMessage = `คำสั่งซื้อเสร็จสิ้นเรียบร้อย ขอบคุณที่ไว้วางใจ!`; break;
                case 'cancelled': emoji = '❌'; statusMessage = `คำสั่งซื้อถูกยกเลิกแล้ว${order.cancel_reason ? ` เหตุผล: ${order.cancel_reason}` : ''}`; break;
                default: statusMessage = `สถานะคำสั่งซื้อเปลี่ยนเป็น: ${label}`;
            }
        }
        if (newPaymentStatus) {
            const label = paymentStatusLabels[newPaymentStatus] || newPaymentStatus;
            switch (newPaymentStatus) {
                case 'paid': emoji = '💚'; statusMessage = `การชำระเงินสำเร็จเรียบร้อยแล้ว`; break;
                case 'rejected': emoji = '⚠️'; statusMessage = `หลักฐานการชำระเงินถูกปฏิเสธ กรุณาติดต่อทีมงาน`; break;
                default: if (!statusMessage) statusMessage = `สถานะการชำระเงินเปลี่ยนเป็น: ${label}`;
            }
        }
        if (!statusMessage) return;

        const trackingHtml = order.tracking_number && (newOrderStatus === 'shipped') ? `
            <div style="background:#eff6ff;border-radius:12px;padding:16px;margin:20px 0;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#3b82f6;">🚚 เลขพัสดุ</p>
              <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#1e40af;letter-spacing:1px;">${order.tracking_number}</p>
              ${order.shipping_provider ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">ขนส่ง: ${order.shipping_provider}</p>` : ''}
            </div>` : '';

        const content = `
            <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">${emoji} อัปเดตคำสั่งซื้อ #${shortId}</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">สวัสดีคุณ${firstName}</p>
            <div style="background:#f9fafb;border-radius:12px;padding:20px;border-left:4px solid #10b981;">
              <p style="margin:0;font-size:16px;color:#374151;font-weight:600;">${statusMessage}</p>
            </div>
            ${trackingHtml}
            <div style="text-align:center;margin-top:24px;">
              <p style="margin:0;color:#9ca3af;font-size:13px;">ยอดรวมสุทธิ: <strong style="color:#059669;">${formatPrice(order.total_amount)}</strong></p>
            </div>
            <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">หากมีข้อสงสัยสามารถติดต่อทีมงานได้ตลอดเวลา</p>`;

        await sendMailLogged({
            recipient: customerEmail,
            subject: `${emoji} อัปเดตคำสั่งซื้อ #${shortId} — ${store.storeName}`,
            emailType: 'OrderStatusUpdate',
            html: emailTemplate(content, store)
        });
    } catch (err) {
        console.error('[Email] Failed to process status update:', err.message);
    }
};

/**
 * Parse contact settings array/string securely.
 */
const parseContactSettings = (rawSetting) => {
    if (!rawSetting) return [];
    try {
        const parsed = typeof rawSetting === 'string' ? JSON.parse(rawSetting) : rawSetting;
        if (Array.isArray(parsed)) {
            return parsed.map(item => {
                if (typeof item === 'string') return item;
                if (item && typeof item === 'object') {
                    return item.value || item.label || '';
                }
                return '';
            }).filter(Boolean);
        }
        if (typeof parsed === 'string') {
            return [parsed];
        }
    } catch (e) {
        if (typeof rawSetting === 'string') {
            return rawSetting.split(',').map(s => s.trim()).filter(Boolean);
        }
    }
    return [];
};

/**
 * Send Quotation received confirmation to customer (No PDF attached)
 */
const sendQuotationEmail = async (customerEmail, data) => {
    if (!customerEmail) return;

    const store = await getStoreSettings();
    const shortId = (data.id || '').split('-')[0].toUpperCase();

    const phones = parseContactSettings(store.contactPhones);
    const emails = parseContactSettings(store.contactEmails);
    const lines = parseContactSettings(store.contactLines);

    let contactHtml = '';
    if (phones.length > 0 || emails.length > 0 || lines.length > 0) {
        contactHtml += `
        <div style="background:#f9fafb;border-radius:12px;padding:24px;border:1px solid #e5e7eb;margin-top:24px;text-align:left;">
          <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#374151;">ช่องทางติดต่อและสอบถามเพิ่มเติม:</p>`;
        
        if (phones.length > 0) {
            contactHtml += `<p style="margin:0 0 8px;font-size:14px;color:#4b5563;">📞 <strong>เบอร์โทรศัพท์:</strong> ${phones.join(', ')}</p>`;
        }
        if (emails.length > 0) {
            contactHtml += `<p style="margin:0 0 8px;font-size:14px;color:#4b5563;">✉️ <strong>อีเมล:</strong> ${emails.map(e => `<a href="mailto:${e}" style="color:#059669;text-decoration:none;">${e}</a>`).join(', ')}</p>`;
        }
        if (lines.length > 0) {
            contactHtml += `<p style="margin:0;font-size:14px;color:#4b5563;">🟢 <strong>Line Official Account:</strong> ${lines.join(', ')}</p>`;
        }
        contactHtml += `</div>`;
    }

    const content = `
        <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:bold;">ทางเราได้รับข้อมูลคำขอใบเสนอราคาของท่านเรียบร้อยแล้ว 🎉</h2>
        <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;text-align:left;">เรียนคุณ <strong>${data.customerName}</strong>,</p>
        <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;text-align:left;">ขอบพระคุณอย่างยิ่งสำหรับความไว้วางใจที่ท่านเลือกใช้บริการของเรา ทางเราได้รับข้อมูลของท่านเรียบร้อยแล้ว ขณะนี้ทีมงานและเจ้าหน้าที่ที่เกี่ยวข้องกำลังดำเนินการตรวจสอบรายละเอียดความต้องการของท่านอย่างละเอียด เพื่อจัดทำใบเสนอราคาที่สมบูรณ์ที่สุด โดยเราจะรีบติดต่อกลับและนำส่งเอกสารใบเสนอราคาอย่างเป็นทางการให้ท่านผ่านทางอีเมลฉบับนี้โดยเร็วที่สุด</p>
        
        <div style="background:#ecfdf5;border-radius:12px;padding:16px;border-left:4px solid #059669;margin-bottom:24px;text-align:left;">
          <p style="margin:0;font-size:14px;color:#065f46;line-height:1.5;">
            📌 <strong>หมายเลขคำขอใบเสนอราคา:</strong> QT-${shortId}<br>
            📞 <strong>หมายเลขโทรศัพท์สำหรับติดต่อกลับ:</strong> ${data.phone || '-'}
          </p>
        </div>

        ${contactHtml}

        <p style="margin:32px 0 0;color:#111827;font-size:15px;text-align:left;line-height:1.6;">
          ขอแสดงความนับถืออย่างสูง,<br>
          <strong>ทีมงาน ${store.storeName}</strong>
        </p>`;

    await sendMailLogged({
        recipient: customerEmail,
        subject: `ทางเราได้รับข้อมูลการขอใบเสนอราคาของท่านเรียบร้อยแล้ว QT-${shortId} — ${store.storeName}`,
        emailType: 'Quotation',
        html: emailTemplate(content, store)
    });
};

/**
 * Send Abandoned Cart Reminder Email
 */
const sendAbandonedCartEmail = async (customerEmail, firstName, cartItems) => {
    if (!customerEmail) return;

    const store = await getStoreSettings();

    const itemsHtml = cartItems.map(item => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
            <strong style="color:#111827;">${item.product_name || item.name}</strong>
            <br><span style="font-size:13px;color:#6b7280;">จำนวน ${item.quantity} ชิ้น</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:700;color:#059669;">
            ${formatPrice(item.price * item.quantity)}
          </td>
        </tr>`).join('');

    const content = `
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">ตะกร้าสินค้ายังรอคุณอยู่ 🛒</h2>
        <p style="margin:0 0 16px;color:#6b7280;font-size:15px;">สวัสดีคุณ ${firstName}</p>
        <p style="margin:0 0 24px;color:#374151;font-size:15px;">เราพบว่าคุณได้เลือกสินค้าใส่ตะกร้าทิ้งไว้ แต่ยังไม่ได้ดำเนินการสั่งซื้อให้เสร็จสิ้น เพื่อไม่ให้พลาดสินค้าดีๆ ที่คุณสนใจ โปรดกลับมาทำรายการต่อได้ทันที</p>
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
            <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
            </table>
        </div>
        <div style="text-align:center;margin-top:24px;margin-bottom:24px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart" style="display:inline-block;padding:12px 32px;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;font-size:16px;">กลับไปที่ตะกร้าสินค้า</a>
        </div>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">หากมีข้อส่งสัยหรือต้องการความช่วยเหลือ ติดต่อเราได้ทันที</p>`;

    await sendMailLogged({
        recipient: customerEmail,
        subject: `คุณมีสินค้าในตะกร้าที่ยังไม่ได้ชำระเงิน — ${store.storeName}`,
        emailType: 'AbandonedCart',
        html: emailTemplate(content, store)
    });
};

/**
 * Send Email Verification Link
 */
const sendVerificationEmail = async (email, token, frontendUrl) => {
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    
    // Always log the link for local testing and recovery if SMTP is not configured/offline
    console.log(`✉️ [Email] Email verification link for ${email}: ${verifyUrl}`);

    const store = await getStoreSettings();

    const content = `
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">ยินดีต้อนรับสู่ ${store.storeName}! 🎉</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">กรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันบัญชีอีเมลของคุณ และเปิดใช้งานการเข้าถึงสิทธิพิเศษต่างๆ:</p>
        <div style="text-align:center;margin-top:24px;margin-bottom:24px;">
            <a href="${verifyUrl}" style="display:inline-block;padding:12px 32px;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;font-size:16px;">ยืนยันอีเมลของฉัน</a>
        </div>
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-align:center;">หรือคัดลอกลิงก์นี้เพื่อเปิดในเบราว์เซอร์: <a href="${verifyUrl}" style="color:#059669;">${verifyUrl}</a></p>
        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;text-align:center;">หากคุณไม่ได้สมัครสมาชิก กรุณาละเว้นอีเมลฉบับนี้</p>
    `;

    await sendMailLogged({
        recipient: email,
        subject: `ยินดีต้อนรับสู่ ${store.storeName} - กรุณายืนยันอีเมลของคุณ`,
        emailType: 'Verification',
        html: emailTemplate(content, store)
    });
};

/**
 * Send Forgot Password Link
 */
const sendForgotPasswordEmail = async (email, firstName, resetToken, frontendUrl) => {
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    // Always log the link for local testing and recovery if SMTP is not configured/offline
    console.log(`🔑 [Email] Password reset link for ${email}: ${resetUrl}`);

    const store = await getStoreSettings();

    const content = `
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">รีเซ็ตรหัสผ่านบัญชีของคุณ 🔑</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">สวัสดีคุณ ${firstName || 'ลูกค้า'},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ คุณสามารถกดที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ได้ทันที (ลิงก์มีอายุการใช้งาน 1 ชั่วโมง):</p>
        <div style="text-align:center;margin-top:24px;margin-bottom:24px;">
            <a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;font-size:16px;">ตั้งรหัสผ่านใหม่</a>
        </div>
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-align:center;">หรือคัดลอกลิงก์นี้เพื่อเปิดในเบราว์เซอร์: <a href="${resetUrl}" style="color:#059669;">${resetUrl}</a></p>
        <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;text-align:center;">หากคุณไม่ได้ส่งคำขอนี้ คุณไม่จำเป็นต้องดำเนินการใดๆ และรหัสผ่านของคุณจะยังคงปลอดภัยตามเดิม</p>
    `;

    await sendMailLogged({
        recipient: email,
        subject: `ตั้งรหัสผ่านใหม่บัญชีผู้ใช้ — ${store.storeName}`,
        emailType: 'ForgotPassword',
        html: emailTemplate(content, store)
    });
};

/**
 * Send Login Notification
 */
const sendLoginNotification = async (email, firstName, loginType = 'Email') => {
    const store = await getStoreSettings();
    const loginTime = new Date().toLocaleString('th-TH', { 
        timeZone: 'Asia/Bangkok',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const content = `
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">แจ้งเตือนการเข้าสู่ระบบสำเร็จ 🔒</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">สวัสดีคุณ ${firstName || 'ลูกค้า'},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">ระบบตรวจพบการเข้าสู่ระบบบัญชีของคุณด้วยวิธี: <strong>${loginType}</strong></p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;border-left:4px solid #10b981;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#374151;">⏰ วันเวลา: ${loginTime} (เวลาประเทศไทย)</p>
        </div>
        <p style="margin:0;color:#ef4444;font-size:13px;font-weight:bold;">หากไม่ใช่คุณที่ทำรายการเข้าสู่ระบบ กรุณาเปลี่ยนรหัสผ่านทันทีหรือติดต่อเจ้าหน้าที่</p>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">ระบบรักษาความปลอดภัยบัญชีผู้ใช้งาน — ${store.storeName}</p>
    `;

    await sendMailLogged({
        recipient: email,
        subject: `แจ้งเตือนการเข้าสู่ระบบ — ${store.storeName}`,
        emailType: 'LoginNotification',
        html: emailTemplate(content, store)
    });
};

/**
 * Send Password Changed Notification
 */
const sendPasswordChangedEmail = async (email, firstName) => {
    if (!email) return;

    const store = await getStoreSettings();
    const changeTime = new Date().toLocaleString('th-TH', { 
        timeZone: 'Asia/Bangkok',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const content = `
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว 🔒</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">สวัสดีคุณ ${firstName || 'ลูกค้า'},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">ระบบตรวจพบการเปลี่ยนแปลงรหัสผ่านสำหรับบัญชีผู้ใช้งานของคุณสำเร็จแล้ว</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;border-left:4px solid #10b981;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#374151;">⏰ วันเวลาที่ดำเนินการ: ${changeTime} (เวลาประเทศไทย)</p>
        </div>
        <p style="margin:0;color:#ef4444;font-size:13px;font-weight:bold;">หากคุณไม่ได้เป็นผู้ทำรายการนี้ กรุณาติดต่อเจ้าหน้าที่ดูแลระบบทันที</p>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">ระบบรักษาความปลอดภัยบัญชีผู้ใช้งาน — ${store.storeName}</p>
    `;

    await sendMailLogged({
        recipient: email,
        subject: `แจ้งเตือนการเปลี่ยนรหัสผ่านสำเร็จ — ${store.storeName}`,
        emailType: 'PasswordChanged',
        html: emailTemplate(content, store)
    });
};

/**
 * Send Password Reset Success Notification
 */
const sendPasswordResetSuccessEmail = async (email, firstName) => {
    if (!email) return;

    const store = await getStoreSettings();
    const resetTime = new Date().toLocaleString('th-TH', { 
        timeZone: 'Asia/Bangkok',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const content = `
        <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">ตั้งรหัสผ่านใหม่สำเร็จ 🔑</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">สวัสดีคุณ ${firstName || 'ลูกค้า'},</p>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">รหัสผ่านบัญชีผู้ใช้งานของคุณได้รับการตั้งค่าใหม่เรียบร้อยแล้ว ตอนนี้คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ของคุณได้ทันที</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;border-left:4px solid #10b981;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#374151;">⏰ วันเวลาที่ดำเนินการ: ${resetTime} (เวลาประเทศไทย)</p>
        </div>
        <p style="margin:0;color:#ef4444;font-size:13px;font-weight:bold;">หากคุณไม่ได้เป็นผู้ทำรายการนี้ กรุณาติดต่อเจ้าหน้าที่ดูแลระบบทันที</p>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">ระบบรักษาความปลอดภัยบัญชีผู้ใช้งาน — ${store.storeName}</p>
    `;

    await sendMailLogged({
        recipient: email,
        subject: `ตั้งรหัสผ่านใหม่สำเร็จ — ${store.storeName}`,
        emailType: 'PasswordResetSuccess',
        html: emailTemplate(content, store)
    });
};

/**
 * Send Admin Login Notification
 */
const sendAdminLoginNotification = async (adminUsername, adminName, notifyEmails) => {
    if (!notifyEmails) return;

    const store = await getStoreSettings();
    const loginTime = new Date().toLocaleString('th-TH', { 
        timeZone: 'Asia/Bangkok',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const content = `
        <h2 style="margin:0 0 8px;color:#ef4444;font-size:20px;">🚨 แจ้งเตือนความปลอดภัย: มีการล็อกอินเข้าระบบหลังบ้าน (Admin)</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">ระบบตรวจพบการเข้าสู่ระบบส่วนการจัดการหลังบ้าน (${store.storeName} Admin Panel) สำเร็จด้วยข้อมูลดังต่อไปนี้:</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;border-left:4px solid #ef4444;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">👤 <strong>ชื่อผู้ใช้งาน:</strong> ${adminUsername}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">📛 <strong>ชื่อแอดมิน:</strong> ${adminName}</p>
            <p style="margin:0;font-size:14px;color:#374151;">⏰ <strong>วันเวลา:</strong> ${loginTime} (เวลาประเทศไทย)</p>
        </div>
        <p style="margin:0;color:#374151;font-size:13px;">หากการล็อกอินนี้ไม่ได้มาจากเจ้าหน้าที่หรือทีมงานที่เกี่ยวข้อง โปรดดำเนินการตรวจสอบและเปลี่ยนรหัสผ่านในระบบทันทีเพื่อความปลอดภัย</p>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">ระบบรักษาความปลอดภัยเซิร์ฟเวอร์หลังบ้าน — ${store.storeName}</p>
    `;

    await sendMailLogged({
        recipient: notifyEmails,
        subject: `🚨 แจ้งเตือน: มีการล็อกอินเข้าระบบแอดมิน — ${store.storeName}`,
        emailType: 'AdminLogin',
        html: emailTemplate(content, store)
    });
};

/**
 * Send Admin Password Changed Notification
 */
const sendAdminPasswordChangedNotification = async (adminUsername, adminName, notifyEmails, isSelfUpdate = true) => {
    if (!notifyEmails) return;

    const store = await getStoreSettings();
    const updateTime = new Date().toLocaleString('th-TH', { 
        timeZone: 'Asia/Bangkok',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const updateType = isSelfUpdate 
        ? 'โดยการอัปเดตโปรไฟล์ของตัวเอง' 
        : 'โดยผู้ดูแลระบบหลักผ่านหน้าจัดการผู้ใช้';

    const content = `
        <h2 style="margin:0 0 8px;color:#ef4444;font-size:20px;">🚨 แจ้งเตือนความปลอดภัย: มีการเปลี่ยนรหัสผ่านแอดมิน (Admin)</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">ระบบตรวจพบการเปลี่ยนแปลงรหัสผ่านของบัญชีผู้ดูแลระบบ (Admin) สำเร็จด้วยข้อมูลดังต่อไปนี้:</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;border-left:4px solid #ef4444;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">👤 <strong>ชื่อผู้ใช้งานแอดมิน:</strong> ${adminUsername}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">📛 <strong>ชื่อแอดมิน:</strong> ${adminName}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">🛠️ <strong>ลักษณะการแก้ไข:</strong> ${updateType}</p>
            <p style="margin:0;font-size:14px;color:#374151;">⏰ <strong>วันเวลา:</strong> ${updateTime} (เวลาประเทศไทย)</p>
        </div>
        <p style="margin:0;color:#ef4444;font-size:13px;font-weight:bold;">หากรายการนี้ไม่ได้ถูกกระทำโดยได้รับอนุญาตหรือไม่ได้มาจากทีมงานของท่าน โปรดระงับการใช้งานและเปลี่ยนรหัสผ่านบัญชีหลักในระบบทันที</p>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">ระบบรักษาความปลอดภัยเซิร์ฟเวอร์หลังบ้าน — ${store.storeName}</p>
    `;

    await sendMailLogged({
        recipient: notifyEmails,
        subject: `🚨 แจ้งเตือน: มีการเปลี่ยนรหัสผ่านผู้ดูแลระบบ — ${store.storeName}`,
        emailType: 'AdminPasswordChanged',
        html: emailTemplate(content, store)
    });
};

/**
 * Send New Quotation Request Notification to Admins
 */
const sendNewQuotationNotificationEmail = async (notifyEmails, data) => {
    if (!notifyEmails) return;

    const store = await getStoreSettings();
    const submitTime = new Date().toLocaleString('th-TH', { 
        timeZone: 'Asia/Bangkok',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const requestTypeLabel = data.requestType === 'company' ? 'นิติบุคคล / บริษัท' : 'บุคคลธรรมดา';

    const content = `
        <h2 style="margin:0 0 8px;color:#3b82f6;font-size:20px;">📋 มีคำขอใบเสนอราคาใหม่จากหน้าเว็บ</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">ระบบได้รับคำขอใบเสนอราคาใหม่จากลูกค้าผ่านหน้าเว็บไซต์ รายละเอียดมีดังนี้:</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;border-left:4px solid #3b82f6;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">👤 <strong>ชื่อลูกค้า:</strong> ${data.customerName || '-'}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">📞 <strong>โทรศัพท์:</strong> ${data.phone || '-'}</p>
            ${data.email ? `<p style="margin:0 0 8px;font-size:14px;color:#374151;">📧 <strong>อีเมล:</strong> ${data.email}</p>` : ''}
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">🏷️ <strong>ประเภท:</strong> ${requestTypeLabel}</p>
            ${data.companyName ? `<p style="margin:0 0 8px;font-size:14px;color:#374151;">🏢 <strong>ชื่อบริษัท:</strong> ${data.companyName}</p>` : ''}
            ${data.usageType ? `<p style="margin:0 0 8px;font-size:14px;color:#374151;">🔧 <strong>ลักษณะการใช้งาน:</strong> ${data.usageType}</p>` : ''}
            ${data.areaSize ? `<p style="margin:0 0 8px;font-size:14px;color:#374151;">📐 <strong>พื้นที่:</strong> ${data.areaSize} ตร.ม.</p>` : ''}
            ${data.budget ? `<p style="margin:0 0 8px;font-size:14px;color:#374151;">💰 <strong>งบประมาณ:</strong> ${data.budget}</p>` : ''}
            ${data.projectScale ? `<p style="margin:0 0 8px;font-size:14px;color:#374151;">📊 <strong>ขนาดโครงการ:</strong> ${data.projectScale}</p>` : ''}
            ${data.details ? `<p style="margin:0 0 8px;font-size:14px;color:#374151;">📝 <strong>รายละเอียดเพิ่มเติม:</strong> ${data.details}</p>` : ''}
            <p style="margin:0;font-size:14px;color:#374151;">⏰ <strong>วันเวลา:</strong> ${submitTime} (เวลาประเทศไทย)</p>
        </div>
        <div style="text-align:center;margin-top:24px;margin-bottom:24px;">
            <a href="${store.storeUrl}/admin/quotations" style="display:inline-block;padding:12px 32px;background:#3b82f6;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;font-size:16px;">ดูรายละเอียดในระบบหลังบ้าน</a>
        </div>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">ระบบแจ้งเตือนอัตโนมัติ — ${store.storeName}</p>
    `;

    await sendMailLogged({
        recipient: notifyEmails,
        subject: `📋 คำขอใบเสนอราคาใหม่จาก ${data.customerName || 'ลูกค้า'} — ${store.storeName}`,
        emailType: 'NewQuotationAdminNotification',
        html: emailTemplate(content, store)
    });
};

/**
 * Send New Contact Message Notification to Admins
 */
const sendNewContactNotificationEmail = async (notifyEmails, data) => {
    if (!notifyEmails) return;

    const store = await getStoreSettings();
    const submitTime = new Date().toLocaleString('th-TH', { 
        timeZone: 'Asia/Bangkok',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const content = `
        <h2 style="margin:0 0 8px;color:#8b5cf6;font-size:20px;">💬 มีข้อความติดต่อใหม่จากหน้าเว็บ</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">มีลูกค้าส่งข้อความผ่านแบบฟอร์ม "ติดต่อเรา" บนหน้าเว็บไซต์ รายละเอียดมีดังนี้:</p>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;border-left:4px solid #8b5cf6;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">👤 <strong>ชื่อผู้ติดต่อ:</strong> ${data.name || '-'}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">📧 <strong>อีเมล:</strong> ${data.email || '-'}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">📞 <strong>โทรศัพท์:</strong> ${data.phone || '-'}</p>
            <p style="margin:0;font-size:14px;color:#374151;">⏰ <strong>วันเวลา:</strong> ${submitTime} (เวลาประเทศไทย)</p>
        </div>
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;">ข้อความจากลูกค้า</p>
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${data.message || '-'}</p>
        </div>
        <div style="text-align:center;margin-top:24px;margin-bottom:24px;">
            <a href="${store.storeUrl}/admin/contact" style="display:inline-block;padding:12px 32px;background:#8b5cf6;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;font-size:16px;">ดูรายละเอียดในระบบหลังบ้าน</a>
        </div>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">ระบบแจ้งเตือนอัตโนมัติ — ${store.storeName}</p>
    `;

    await sendMailLogged({
        recipient: notifyEmails,
        subject: `💬 ข้อความติดต่อใหม่จาก ${data.name || 'ลูกค้า'} — ${store.storeName}`,
        emailType: 'NewContactAdminNotification',
        html: emailTemplate(content, store)
    });
};

/**
 * Send New Order Notification to Admins
 */
const sendNewOrderNotificationEmail = async (notifyEmails, data) => {
    if (!notifyEmails) return;

    const store = await getStoreSettings();
    const orderTime = new Date().toLocaleString('th-TH', { 
        timeZone: 'Asia/Bangkok',
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const shortId = (data.orderId || '').split('-')[0].toUpperCase();
    const paymentMethodLabel = {
        'bank_transfer': 'โอนเงินผ่านธนาคาร',
        'credit_card': 'บัตรเครดิต',
        'promptpay': 'พร้อมเพย์',
        'cod': 'เก็บเงินปลายทาง',
        'installment': 'ผ่อนชำระ'
    }[data.paymentMethod] || data.paymentMethod || '-';

    const content = `
        <h2 style="margin:0 0 8px;color:#059669;font-size:20px;">🛒 มีคำสั่งซื้อใหม่เข้ามาในระบบ!</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;">ลูกค้าได้สั่งซื้อสินค้าผ่านหน้าเว็บไซต์เรียบร้อยแล้ว รายละเอียดมีดังนี้:</p>
        <div style="background:#ecfdf5;border-radius:12px;padding:16px;margin-bottom:24px;">
            <p style="margin:0;font-size:13px;color:#059669;font-weight:700;">หมายเลขคำสั่งซื้อ</p>
            <p style="margin:4px 0 0;font-size:24px;font-weight:900;color:#065f46;letter-spacing:1px;">#${shortId}</p>
        </div>
        <div style="background:#f9fafb;border-radius:12px;padding:20px;border-left:4px solid #059669;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">👤 <strong>ชื่อลูกค้า:</strong> ${data.customerName || '-'}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">📦 <strong>จำนวนรายการ:</strong> ${data.itemCount || 0} รายการ</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">💳 <strong>ช่องทางชำระ:</strong> ${paymentMethodLabel}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#374151;">💰 <strong>ยอดรวมสุทธิ:</strong> <span style="color:#059669;font-weight:900;font-size:18px;">${formatPrice(data.totalAmount)}</span></p>
            <p style="margin:0;font-size:14px;color:#374151;">⏰ <strong>วันเวลา:</strong> ${orderTime} (เวลาประเทศไทย)</p>
        </div>
        <div style="text-align:center;margin-top:24px;margin-bottom:24px;">
            <a href="${store.storeUrl}/admin/orders" style="display:inline-block;padding:12px 32px;background:#059669;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;font-size:16px;">ดูคำสั่งซื้อในระบบหลังบ้าน</a>
        </div>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">ระบบแจ้งเตือนอัตโนมัติ — ${store.storeName}</p>
    `;

    await sendMailLogged({
        recipient: notifyEmails,
        subject: `🛒 คำสั่งซื้อใหม่ #${shortId} — ${formatPrice(data.totalAmount)} — ${store.storeName}`,
        emailType: 'NewOrderAdminNotification',
        html: emailTemplate(content, store)
    });
};

/**
 * Send Newsletter Subscription Confirmation Email
 */
const sendNewsletterSubscriptionEmail = async (email) => {
    if (!email) return;

    const store = await getStoreSettings();

    const content = `
        <h2 style="margin:0 0 12px;color:#059669;font-size:20px;font-weight:bold;">ขอบคุณสำหรับการสมัครรับข่าวสาร! 🎉</h2>
        <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;text-align:left;">สวัสดีครับ/ค่ะ,</p>
        <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.6;text-align:left;">ยินดีต้อนรับเข้าสู่จดหมายข่าวของเรา ทางเราได้รับข้อมูลการลงทะเบียนเพื่อรับข่าวสารของท่านเรียบร้อยแล้ว</p>
        
        <div style="background:#f9fafb;border-radius:12px;padding:20px;border-left:4px solid #10b981;margin-bottom:24px;text-align:left;">
            <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#374151;">สิ่งที่คุณจะได้รับจากจดหมายข่าวของเรา:</p>
            <ul style="margin:0;padding-left:20px;font-size:14px;color:#4b5563;line-height:1.6;">
                <li style="margin-bottom:8px;">📢 <strong>ข้อมูลข่าวสารและอัปเดตใหม่ๆ:</strong> ติดตามเทรนด์ นวัตกรรม และเรื่องราวที่น่าสนใจก่อนใคร</li>
                <li style="margin-bottom:8px;">🎁 <strong>สิทธิพิเศษและโปรโมชันเฉพาะสมาชิก:</strong> รับโค้ดส่วนลด ดีลพิเศษ และข้อเสนอสุดพิเศษสำหรับคุณเท่านั้น</li>
                <li style="margin-bottom:8px;">💡 <strong>สาระน่ารู้และบทความแนะนำ:</strong> เคล็ดลับ คำแนะนำดีๆ และเนื้อหาที่เป็นประโยชน์สำหรับผู้ติดตามโดยเฉพาะ</li>
                <li style="margin-bottom:0;">🎯 <strong>กิจกรรมและข่าวประชาสัมพันธ์:</strong> ไม่พลาดข่าวสารกิจกรรม งานสัมมนา หรือแคมเปญดีๆ จากเรา</li>
            </ul>
        </div>

        <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;text-align:left;">เราจะคอยส่งมอบข้อมูลและข้อเสนอที่ดีที่สุดให้กับคุณโดยตรงผ่านอีเมลฉบับนี้ หากในอนาคตคุณไม่ต้องการรับอีเมลเหล่านี้แล้ว คุณสามารถยกเลิกการสมัครได้ตลอดเวลา</p>

        <p style="margin:32px 0 0;color:#111827;font-size:15px;text-align:left;line-height:1.6;">
            ขอแสดงความนับถืออย่างสูง,<br>
            <strong>ทีมงาน ${store.storeName}</strong>
        </p>
    `;

    await sendMailLogged({
        recipient: email,
        subject: `ยืนยันการสมัครรับข่าวสาร — ${store.storeName}`,
        emailType: 'NewsletterSubscription',
        html: emailTemplate(content, store)
    });
};

module.exports = { 
    sendOrderConfirmation, 
    sendOrderStatusUpdate, 
    sendQuotationEmail, 
    sendAbandonedCartEmail,
    sendVerificationEmail,
    sendForgotPasswordEmail,
    sendLoginNotification,
    sendPasswordChangedEmail,
    sendPasswordResetSuccessEmail,
    sendAdminLoginNotification,
    sendAdminPasswordChangedNotification,
    sendNewQuotationNotificationEmail,
    sendNewContactNotificationEmail,
    sendNewOrderNotificationEmail,
    sendNewsletterSubscriptionEmail,
    getTransporter,
    getStoreSettings,
    emailTemplate,
    formatPrice,
    insertLog
};
