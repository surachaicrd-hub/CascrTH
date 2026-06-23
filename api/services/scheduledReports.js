const db = require('../config/database');

const getSetting = async (key) => {
    const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = ?", [key]);
    return rows.length > 0 ? rows[0].setting_value : null;
};

const sendTelegramMessage = async (token, chatId, message) => {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        })
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.description || 'Telegram API Error');
    return data;
};


/**
 * Generate and send a daily stats report via Telegram
 */
const generateDailyReport = async () => {
    try {
        const telegramEnabled = await getSetting('notify_telegram_enabled') === 'true';
        const token = await getSetting('notify_telegram_token');
        const chatId = await getSetting('notify_telegram_chat_id');

        if (!telegramEnabled || !token || !chatId) return;

        // Today's date
        const today = new Date();
        const dateStr = today.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

        // Page visits today
        const [pvToday] = await db.query(
            `SELECT COUNT(*) as views, COUNT(DISTINCT session_id) as sessions,
                    ROUND(AVG(time_on_page)) as avg_time,
                    ROUND(AVG(scroll_depth)) as avg_scroll,
                    ROUND(SUM(is_bounce)/COUNT(*)*100) as bounce_rate
             FROM page_visits WHERE DATE(created_at) = CURDATE()`
        );

        // Page visits yesterday for comparison
        const [pvYesterday] = await db.query(
            `SELECT COUNT(*) as views, COUNT(DISTINCT session_id) as sessions
             FROM page_visits WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
        );

        // Top pages today
        const [topPages] = await db.query(
            `SELECT page_path, COUNT(*) as views 
             FROM page_visits WHERE DATE(created_at) = CURDATE()
             GROUP BY page_path ORDER BY views DESC LIMIT 5`
        );

        // Top products viewed today
        const [topProducts] = await db.query(
            `SELECT JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.productName')) as name, COUNT(*) as views
             FROM customer_behavior 
             WHERE event_type = 'view_product' AND DATE(created_at) = CURDATE()
             GROUP BY name ORDER BY views DESC LIMIT 5`
        );

        // New contacts today
        const [contacts] = await db.query(
            `SELECT COUNT(*) as count FROM contact_submissions WHERE DATE(created_at) = CURDATE()`
        );

        // New quotations today
        const [quotations] = await db.query(
            `SELECT COUNT(*) as count FROM quotation_requests WHERE DATE(created_at) = CURDATE()`
        );

        // New newsletter subs today
        const [newsletter] = await db.query(
            `SELECT COUNT(*) as count FROM newsletter_subscribers WHERE DATE(subscribed_at) = CURDATE()`
        );

        // Device breakdown
        const [devices] = await db.query(
            `SELECT device_type, COUNT(*) as count FROM page_visits 
             WHERE DATE(created_at) = CURDATE() GROUP BY device_type`
        );

        // Calculate trends
        const viewsTrend = pvYesterday[0].views > 0
            ? Math.round(((pvToday[0].views - pvYesterday[0].views) / pvYesterday[0].views) * 100)
            : 0;
        const trendIcon = viewsTrend > 0 ? '📈' : viewsTrend < 0 ? '📉' : '➡️';
        const trendText = viewsTrend > 0 ? `+${viewsTrend}%` : `${viewsTrend}%`;

        // Format device text
        const deviceText = devices.map(d => {
            const icon = d.device_type === 'mobile' ? '📱' : d.device_type === 'tablet' ? '📋' : '🖥';
            return `${icon} ${d.device_type}: ${d.count}`;
        }).join(' | ') || 'ไม่มีข้อมูล';

        // Format top pages 
        const topPagesText = topPages.length > 0
            ? topPages.map((p, i) => `   ${i + 1}. ${p.page_path} (${p.views} ครั้ง)`).join('\n')
            : '   ไม่มีข้อมูล';

        // Format top products
        const topProductsText = topProducts.length > 0
            ? topProducts.map((p, i) => `   ${i + 1}. ${p.name || 'Unknown'} (${p.views} ครั้ง)`).join('\n')
            : '   ไม่มีข้อมูล';

        const message = `
<b>📊 รายงานประจำวัน — ${dateStr}</b>

<b>👁 การเข้าชม</b>
   เข้าชม: <b>${pvToday[0].views}</b> ครั้ง ${trendIcon} ${trendText} จากเมื่อวาน
   เซสชัน: <b>${pvToday[0].sessions}</b> คน
   เวลาเฉลี่ย: <b>${pvToday[0].avg_time || 0}</b> วินาที
   เลื่อนหน้าเฉลี่ย: <b>${pvToday[0].avg_scroll || 0}%</b>
   Bounce Rate: <b>${pvToday[0].bounce_rate || 0}%</b>

<b>📱 อุปกรณ์</b>
   ${deviceText}

<b>🔝 หน้ายอดนิยม</b>
${topPagesText}

<b>🛍 สินค้ายอดนิยม</b>
${topProductsText}

<b>📬 กิจกรรมจากลูกค้า</b>
   ข้อความติดต่อ: <b>${contacts[0].count}</b> รายการ
   ใบเสนอราคา: <b>${quotations[0].count}</b> รายการ
   สมัครข่าวสาร: <b>${newsletter[0].count}</b> คน
        `.trim();

        await sendTelegramMessage(token, chatId, message);
        console.log('✅ Daily report sent to Telegram');
    } catch (error) {
        console.error('Error generating daily report:', error);
    }
};

/**
 * Generate and send a weekly stats report via Telegram
 */
const generateWeeklyReport = async () => {
    try {
        const telegramEnabled = await getSetting('notify_telegram_enabled') === 'true';
        const token = await getSetting('notify_telegram_token');
        const chatId = await getSetting('notify_telegram_chat_id');

        if (!telegramEnabled || !token || !chatId) return;

        const today = new Date();
        const dateStr = today.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

        // This week stats
        const [thisWeek] = await db.query(
            `SELECT COUNT(*) as views, COUNT(DISTINCT session_id) as sessions,
                    ROUND(AVG(time_on_page)) as avg_time,
                    ROUND(AVG(scroll_depth)) as avg_scroll
             FROM page_visits WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        // Last week stats
        const [lastWeek] = await db.query(
            `SELECT COUNT(*) as views, COUNT(DISTINCT session_id) as sessions
             FROM page_visits WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 14 DAY) AND DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        // Top 5 pages this week
        const [topPages] = await db.query(
            `SELECT page_path, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors
             FROM page_visits WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY page_path ORDER BY views DESC LIMIT 5`
        );

        // Top 5 products this week
        const [topProducts] = await db.query(
            `SELECT JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.productName')) as name, COUNT(*) as views
             FROM customer_behavior 
             WHERE event_type = 'view_product' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY name ORDER BY views DESC LIMIT 5`
        );

        // Contacts & quotations this week
        const [contacts] = await db.query(
            `SELECT COUNT(*) as count FROM contact_submissions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );
        const [quotations] = await db.query(
            `SELECT COUNT(*) as count FROM quotation_requests WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );
        const [newsletter] = await db.query(
            `SELECT COUNT(*) as count FROM newsletter_subscribers WHERE subscribed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
        );

        // Daily breakdown
        const [daily] = await db.query(
            `SELECT DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT session_id) as sessions
             FROM page_visits WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             GROUP BY DATE(created_at) ORDER BY date`
        );

        const viewsTrend = lastWeek[0].views > 0
            ? Math.round(((thisWeek[0].views - lastWeek[0].views) / lastWeek[0].views) * 100)
            : 0;
        const trendIcon = viewsTrend > 0 ? '📈' : viewsTrend < 0 ? '📉' : '➡️';

        const dailyText = daily.map(d => {
            const dayName = new Date(d.date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' });
            const bar = '█'.repeat(Math.min(20, Math.round(d.views / Math.max(...daily.map(x => x.views)) * 20)));
            return `   ${dayName} ${bar} ${d.views}`;
        }).join('\n');

        const topPagesText = topPages.map((p, i) =>
            `   ${i + 1}. ${p.page_path} — ${p.views} ครั้ง (${p.visitors} คน)`
        ).join('\n') || '   ไม่มีข้อมูล';

        const topProductsText = topProducts.map((p, i) =>
            `   ${i + 1}. ${p.name || 'Unknown'} — ${p.views} ครั้ง`
        ).join('\n') || '   ไม่มีข้อมูล';

        const message = `
<b>📈 สรุปประจำสัปดาห์ — ${dateStr}</b>

<b>👁 ภาพรวม</b>
   เข้าชม: <b>${thisWeek[0].views}</b> ครั้ง ${trendIcon} ${viewsTrend > 0 ? '+' : ''}${viewsTrend}% จากสัปดาห์ก่อน
   เซสชัน: <b>${thisWeek[0].sessions}</b> คน
   เวลาเฉลี่ย: <b>${thisWeek[0].avg_time || 0}</b> วินาที

<b>📅 รายวัน</b>
${dailyText}

<b>🔝 หน้ายอดนิยม</b>
${topPagesText}

<b>🛍 สินค้ายอดนิยม</b>
${topProductsText}

<b>📬 ลูกค้า</b>
   ข้อความ: <b>${contacts[0].count}</b> | ใบเสนอราคา: <b>${quotations[0].count}</b> | ข่าวสาร: <b>${newsletter[0].count}</b>
        `.trim();

        await sendTelegramMessage(token, chatId, message);
        console.log('✅ Weekly report sent to Telegram');
    } catch (error) {
        console.error('Error generating weekly report:', error);
    }
};

/**
 * Generate and send a monthly stats report via Telegram
 */
const generateMonthlyReport = async () => {
    try {
        const telegramEnabled = await getSetting('notify_telegram_enabled') === 'true';
        const token = await getSetting('notify_telegram_token');
        const chatId = await getSetting('notify_telegram_chat_id');

        if (!telegramEnabled || !token || !chatId) return;

        const today = new Date();
        const monthStr = today.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

        // This month
        const [thisMonth] = await db.query(
            `SELECT COUNT(*) as views, COUNT(DISTINCT session_id) as sessions,
                    ROUND(AVG(time_on_page)) as avg_time,
                    ROUND(AVG(scroll_depth)) as avg_scroll,
                    ROUND(SUM(is_bounce)/COUNT(*)*100) as bounce_rate
             FROM page_visits WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );

        // Last month
        const [lastMonth] = await db.query(
            `SELECT COUNT(*) as views, COUNT(DISTINCT session_id) as sessions
             FROM page_visits WHERE created_at BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );

        // Top 10 pages
        const [topPages] = await db.query(
            `SELECT page_path, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors
             FROM page_visits WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY page_path ORDER BY views DESC LIMIT 10`
        );

        // Top 10 products
        const [topProducts] = await db.query(
            `SELECT JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.productName')) as name, COUNT(*) as views
             FROM customer_behavior 
             WHERE event_type = 'view_product' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY name ORDER BY views DESC LIMIT 10`
        );

        // Total sums
        const [contacts] = await db.query(
            `SELECT COUNT(*) as count FROM contact_submissions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );
        const [quotations] = await db.query(
            `SELECT COUNT(*) as count FROM quotation_requests WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );
        const [newsletter] = await db.query(
            `SELECT COUNT(*) as count FROM newsletter_subscribers WHERE subscribed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
        );

        // Total products
        const [totalProducts] = await db.query(`SELECT COUNT(*) as count FROM products`);

        // Weekly trend
        const [weeklyTrend] = await db.query(
            `SELECT WEEK(created_at) as wk, COUNT(*) as views
             FROM page_visits WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY WEEK(created_at) ORDER BY wk`
        );

        const viewsTrend = lastMonth[0].views > 0
            ? Math.round(((thisMonth[0].views - lastMonth[0].views) / lastMonth[0].views) * 100)
            : 0;
        const trendIcon = viewsTrend > 0 ? '📈' : viewsTrend < 0 ? '📉' : '➡️';

        const topPagesText = topPages.map((p, i) =>
            `   ${i + 1}. ${p.page_path} — ${p.views} (${p.visitors} คน)`
        ).join('\n') || '   ไม่มีข้อมูล';

        const topProductsText = topProducts.map((p, i) =>
            `   ${i + 1}. ${p.name || 'Unknown'} — ${p.views} ครั้ง`
        ).join('\n') || '   ไม่มีข้อมูล';

        const message = `
<b>📉 สรุปประจำเดือน — ${monthStr}</b>

<b>👁 ภาพรวม 30 วัน</b>
   เข้าชมทั้งหมด: <b>${thisMonth[0].views}</b> ครั้ง ${trendIcon} ${viewsTrend > 0 ? '+' : ''}${viewsTrend}%
   เซสชัน: <b>${thisMonth[0].sessions}</b> คน
   เวลาเฉลี่ย: <b>${thisMonth[0].avg_time || 0}s</b> | เลื่อน: <b>${thisMonth[0].avg_scroll || 0}%</b>
   Bounce Rate: <b>${thisMonth[0].bounce_rate || 0}%</b>

<b>🔝 10 หน้ายอดนิยม</b>
${topPagesText}

<b>🛍 10 สินค้ายอดนิยม</b>
${topProductsText}

<b>📬 สรุปลูกค้า</b>
   ข้อความ: <b>${contacts[0].count}</b>
   ใบเสนอราคา: <b>${quotations[0].count}</b>
   สมัครข่าวสาร: <b>${newsletter[0].count}</b>
   สินค้าทั้งหมดในระบบ: <b>${totalProducts[0].count}</b>
        `.trim();

        await sendTelegramMessage(token, chatId, message);
        console.log('✅ Monthly report sent to Telegram');
    } catch (error) {
        console.error('Error generating monthly report:', error);
    }
};

module.exports = {
    generateDailyReport,
    generateWeeklyReport,
    generateMonthlyReport
};
