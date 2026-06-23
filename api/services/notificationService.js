const db = require('../config/database');

const notifyAdmins = async (type, data) => {
    console.log(`[Notification] Admin notified of ${type}`, data);
    try {
        const title = type === 'order' ? 'คำสั่งซื้อใหม่' : 
                      type === 'contact' ? 'ข้อความติดต่อใหม่' : 
                      type === 'newsletter' ? 'สมาชิกจดหมายข่าวใหม่' : 
                      type === 'quotation' ? 'คำขอใบเสนอราคาใหม่' : 'การแจ้งเตือนใหม่';
                      
        const message = type === 'order' ? `มีคำสั่งซื้อใหม่ #${data.orderId || data.order_id}` :
                        type === 'contact' ? `มีข้อความจาก ${data.name}` :
                        type === 'newsletter' ? `มีผู้สมัครรับข่าวสารใหม่: ${data.email}` : 
                        type === 'quotation' ? `มีคำขอใบเสนอราคาจาก ${data.customerName}` : 'มีการเคลื่อนไหวในระบบ';
                        
        const link = type === 'order' ? `/admin/orders/${data.orderId || data.order_id}` :
                     type === 'contact' ? '/admin/contact' :
                     type === 'newsletter' ? '/admin/newsletter' : 
                     type === 'quotation' ? '/admin/quotations' : '/admin';

        await db.query(
            'INSERT INTO admin_notifications (title, message, type, reference_id, link, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [title, message, type, data.id || data.order_id || data.orderId || null, link]
        );

        // Check if there are administrators subscribed to this email notification
        let columnName = '';
        if (type === 'quotation') columnName = 'notify_quotation';
        else if (type === 'contact') columnName = 'notify_contact';
        else if (type === 'order') columnName = 'notify_order';

        if (columnName) {
            const [subscribers] = await db.query(
                `SELECT email FROM admin_notification_settings WHERE ${columnName} = 1 AND email IS NOT NULL AND email != ''`
            );
            if (subscribers.length > 0) {
                const notifyEmails = subscribers.map(s => s.email.trim()).join(',');
                const emailService = require('./emailService');
                
                if (type === 'quotation') {
                    emailService.sendNewQuotationNotificationEmail(notifyEmails, data).catch(err => {
                        console.error('[Notification] Error sending admin quotation email:', err.message);
                    });
                } else if (type === 'contact') {
                    emailService.sendNewContactNotificationEmail(notifyEmails, data).catch(err => {
                        console.error('[Notification] Error sending admin contact email:', err.message);
                    });
                } else if (type === 'order') {
                    emailService.sendNewOrderNotificationEmail(notifyEmails, data).catch(err => {
                        console.error('[Notification] Error sending admin order email:', err.message);
                    });
                }
            }
        }
    } catch (e) {
        console.error('[Notification] Error saving notification:', e.message);
    }
};

module.exports = { notifyAdmins };
