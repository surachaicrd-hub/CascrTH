const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { verifyAdmin } = require('./auth');
const db = require('../config/database');


// GET /api/system/info
router.get('/info', (req, res) => {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      res.json({
        success: true,
        version: packageData.version || '1.0.0',
        name: packageData.name || 'StorageShed API'
      });
    } else {
      res.json({ success: true, version: '1.0.0' });
    }
  } catch (error) {
    console.error('Error reading system info:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve system info' });
  }
});

// GET /api/system/logs
router.get('/logs', verifyAdmin, (req, res) => {
  try {
    const { page = 1, limit = 50, level = '', query = '' } = req.query;
    const combinedLogPath = path.join(__dirname, '..', 'logs', 'combined.log');
    
    if (!fs.existsSync(combinedLogPath)) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      });
    }

    // Read Winston combined.log
    const logData = fs.readFileSync(combinedLogPath, 'utf8');
    const lines = logData.trim().split('\n');
    
    const logs = [];
    // Read from the bottom (newest logs first)
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const line = lines[i].trim();
        if (line) {
          logs.push(JSON.parse(line));
        }
      } catch (e) {
        // Skip malformed log lines
      }
    }

    // Apply filters
    let filteredLogs = logs;
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level.toLowerCase());
    }
    if (query) {
      const q = query.toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        (log.message && log.message.toLowerCase().includes(q)) ||
        (log.level && log.level.toLowerCase().includes(q)) ||
        (log.timestamp && log.timestamp.includes(q))
      );
    }

    // Paginate
    const total = filteredLogs.length;
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 50;
    const startIndex = (pageInt - 1) * limitInt;
    const endIndex = pageInt * limitInt;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt)
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve system logs' });
  }
});

// DELETE /api/system/logs
router.delete('/logs', verifyAdmin, (req, res) => {
  try {
    const combinedLogPath = path.join(__dirname, '..', 'logs', 'combined.log');
    const errorLogPath = path.join(__dirname, '..', 'logs', 'error.log');
    
    if (fs.existsSync(combinedLogPath)) {
      fs.writeFileSync(combinedLogPath, '');
    }
    if (fs.existsSync(errorLogPath)) {
      fs.writeFileSync(errorLogPath, '');
    }
    
    res.json({ success: true, message: 'เคลียร์ประวัติ Log เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ success: false, message: 'Failed to clear system logs' });
  }
});

// GET /api/system/order-activities
router.get('/order-activities', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, query = '' } = req.query;
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 50;
    const offset = (pageInt - 1) * limitInt;

    let whereClause = '1=1';
    const params = [];

    if (query) {
      whereClause += ' AND (action LIKE ? OR details LIKE ? OR performed_by LIKE ? OR order_id LIKE ?)';
      const q = `%${query}%`;
      params.push(q, q, q, q);
    }

    // Count total
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM order_activity_log WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Fetch logs
    const [logs] = await db.query(
      `SELECT * FROM order_activity_log WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitInt, offset]
    );

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt)
      }
    });
  } catch (error) {
    console.error('Error fetching order activities:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve order activities' });
  }
});

// DELETE /api/system/order-activities
router.delete('/order-activities', verifyAdmin, async (req, res) => {
  try {
    await db.query('TRUNCATE TABLE order_activity_log');
    res.json({ success: true, message: 'เคลียร์ประวัติกิจกรรมคำสั่งซื้อเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error clearing order activities:', error);
    res.status(500).json({ success: false, message: 'Failed to clear order activities' });
  }
});

// GET /api/system/email-logs
router.get('/email-logs', verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status = '', query = '' } = req.query;
    const pageInt = parseInt(page) || 1;
    const limitInt = parseInt(limit) || 50;
    const offset = (pageInt - 1) * limitInt;

    let whereClause = '1=1';
    const params = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (query) {
      whereClause += ' AND (recipient LIKE ? OR subject LIKE ? OR email_type LIKE ? OR error_message LIKE ?)';
      const q = `%${query}%`;
      params.push(q, q, q, q);
    }

    // Count total
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM email_logs WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Fetch logs
    const [logs] = await db.query(
      `SELECT * FROM email_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitInt, offset]
    );

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(total / limitInt)
      }
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve email logs' });
  }
});

// DELETE /api/system/email-logs
router.delete('/email-logs', verifyAdmin, async (req, res) => {
  try {
    await db.query('TRUNCATE TABLE email_logs');
    res.json({ success: true, message: 'เคลียร์ประวัติการส่งอีเมลเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error clearing email logs:', error);
    res.status(500).json({ success: false, message: 'Failed to clear email logs' });
  }
});

// ═══════════════════════════════════════════════
// Cronjob & Automation Trigger Routes
// ═══════════════════════════════════════════════

const getOrCreateCronSecretKey = async () => {
  const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'cron_secret_key'");
  if (rows.length === 0) {
    const crypto = require('crypto');
    const newKey = 'cron_' + crypto.randomBytes(16).toString('hex');
    await db.query("INSERT INTO settings (setting_key, setting_value) VALUES ('cron_secret_key', ?)", [newKey]);
    return newKey;
  }
  return rows[0].setting_value;
};

const verifyCronKey = async (req, res, next) => {
  try {
    const providedKey = req.query.key || req.headers.authorization?.split(' ')[1];
    if (!providedKey) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing cron secret key' });
    }
    const secretKey = await getOrCreateCronSecretKey();
    if (providedKey !== secretKey) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid cron secret key' });
    }
    next();
  } catch (error) {
    console.error('Error verifying cron key:', error);
    res.status(500).json({ success: false, error: 'Internal server error during authentication' });
  }
};

// GET /api/system/cron/info - Admin only
router.get('/cron/info', verifyAdmin, async (req, res) => {
  try {
    const secretKey = await getOrCreateCronSecretKey();
    
    // Fetch configuration details from settings table
    const [settingsRows] = await db.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('article_automation_config', 'line_automation_config', 'newsletter_automation_config', 'notify_telegram_enabled', 'notify_telegram_token', 'notify_telegram_chat_id')"
    );
    
    const configs = {};
    settingsRows.forEach(r => configs[r.setting_key] = r.setting_value);
    
    // Helper to parse JSON settings
    const parseConfig = (key, defaultVal) => {
      try {
        return configs[key] ? JSON.parse(configs[key]) : defaultVal;
      } catch (e) {
        return defaultVal;
      }
    };
    
    const articleConfig = parseConfig('article_automation_config', { enabled: false, time: '08:00', style: 'educational', product_ids: [] });
    const lineConfig = parseConfig('line_automation_config', { enabled: false, time: '12:00', frequency_days: 15 });
    const newsletterConfig = parseConfig('newsletter_automation_config', { enabled: false, time: '09:00', product_ids: [] });
    const telegramEnabled = configs.notify_telegram_enabled === 'true';

    const tasks = [
      {
        id: 'abandoned_cart',
        name: 'ระบบกู้คืนตะกร้าสินค้า (Abandoned Cart Recovery)',
        description: 'ตรวจสอบตะกร้าสินค้าที่ลูกค้าใส่ของทิ้งไว้เกิน 24 ชั่วโมง แล้วส่งอีเมลแจ้งเตือนกลับไปเพื่อกระตุ้นยอดขาย',
        schedule: 'ทุกวัน เวลา 10:00 น.',
        cron_expr: '0 10 * * *',
        enabled: true
      },
      {
        id: 'co_purchase',
        name: 'ระบบวิเคราะห์การซื้อร่วมกัน (Co-purchase Aggregation)',
        description: 'คำนวณและจับคู่สินค้าที่ลูกค้ามักจะสั่งซื้อร่วมกัน เพื่อแสดงในส่วนสินค้าแนะนำและกระตุ้นการขายแบบ Cross-selling',
        schedule: 'ทุกๆ 6 ชั่วโมง',
        cron_expr: '0 */6 * * *',
        enabled: true
      },
      {
        id: 'view_count',
        name: 'ระบบอัปเดตยอดการเข้าชมสินค้า (Product View Refresh)',
        description: 'คำนวณจำนวนการเข้าชมสินค้าของแต่ละรายการในช่วง 90 วันที่ผ่านมา จากประวัติพฤติกรรมลูกค้า เพื่อนำไปจัดอันดับสินค้ายอดนิยม',
        schedule: 'ทุกวัน เวลา 03:00 น.',
        cron_expr: '0 3 * * *',
        enabled: true
      },
      {
        id: 'article_generation',
        name: 'ระบบสร้างบทความด้วย AI อัตโนมัติ (AI Article Generator)',
        description: 'สุ่มนำข้อมูลสินค้าในระบบมาให้ AI เขียนบทความแนะนำเชิงลึกที่เป็นประโยชน์ต่อลูกค้าและดีต่อ SEO ลงในหน้าบทความของเว็บไซต์',
        schedule: `ทุกวัน เวลา ${articleConfig.time || '08:00'} น.`,
        cron_expr: articleConfig.time ? `${articleConfig.time.split(':')[1]} ${articleConfig.time.split(':')[0]} * * *` : '0 8 * * *',
        enabled: !!articleConfig.enabled
      },
      {
        id: 'line_broadcast',
        name: 'ระบบส่งข่าวสารทาง LINE OA (AI LINE OA Broadcast)',
        description: 'นำเสนอสินค้าในระบบให้ AI เขียนข้อความกระตุ้นความสนใจ และสร้าง Flex Message ส่งบรอดแคสต์หาลูกค้าบน LINE Official Account',
        schedule: `ทุกวัน เวลา ${lineConfig.time || '12:00'} น. (ความถี่ทุกๆ ${lineConfig.frequency_days || 15} วัน)`,
        cron_expr: lineConfig.time ? `${lineConfig.time.split(':')[1]} ${lineConfig.time.split(':')[0]} * * *` : '0 12 * * *',
        enabled: !!lineConfig.enabled
      },
      {
        id: 'newsletter',
        name: 'ระบบส่งอีเมลจดหมายข่าวสาร (Email Newsletter)',
        description: 'รวบรวมสินค้าเด่นและสินค้าอื่นๆ ที่น่าสนใจให้ AI จัดวางเนื้อหาและส่งอีเมลจดหมายข่าวถึงสมาชิกผู้ติดตามทั้งหมด',
        schedule: `ทุกวัน เวลา ${newsletterConfig.time || '09:00'} น.`,
        cron_expr: newsletterConfig.time ? `${newsletterConfig.time.split(':')[1]} ${newsletterConfig.time.split(':')[0]} * * *` : '0 9 * * *',
        enabled: !!newsletterConfig.enabled
      },
      {
        id: 'report_daily',
        name: 'รายงานสถิติประจำวันทาง Telegram (Daily Reports)',
        description: 'สรุปข้อมูลยอดคนดูหน้าเว็บ ยอดสั่งซื้อ รายการขอใบเสนอราคา และพฤติกรรมลูกค้าในวันนี้ ส่งรายงานให้ผู้บริหารทาง Telegram',
        schedule: 'ทุกวัน เวลา 08:00 น.',
        cron_expr: '0 8 * * *',
        enabled: telegramEnabled
      },
      {
        id: 'report_weekly',
        name: 'รายงานสถิติประจำสัปดาห์ทาง Telegram (Weekly Reports)',
        description: 'สรุปการเติบโตของการเข้าชม และประเด็นที่น่าสนใจรอบสัปดาห์ พร้อมกราฟสรุปรายวันทาง Telegram',
        schedule: 'ทุกวันจันทร์ เวลา 09:00 น.',
        cron_expr: '0 9 * * 1',
        enabled: telegramEnabled
      },
      {
        id: 'report_monthly',
        name: 'รายงานสถิติประจำเดือนทาง Telegram (Monthly Reports)',
        description: 'วิเคราะห์ภาพรวมการเข้าชม 30 วันที่ผ่านมา เปรียบเทียบกับเดือนก่อนหน้า และสรุปข้อมูลยอดผู้สมัครรับข่าวสาร',
        schedule: 'ทุกวันที่ 1 ของเดือน เวลา 09:00 น.',
        cron_expr: '0 9 1 * *',
        enabled: telegramEnabled
      }
    ];

    res.json({
      success: true,
      secretKey,
      tasks
    });
  } catch (error) {
    console.error('Error fetching cron info:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch cron info' });
  }
});

// POST /api/system/cron/secret-key - Admin only
router.post('/cron/secret-key', verifyAdmin, async (req, res) => {
  try {
    const crypto = require('crypto');
    const newKey = 'cron_' + crypto.randomBytes(16).toString('hex');
    await db.query(
      "INSERT INTO settings (setting_key, setting_value) VALUES ('cron_secret_key', ?) ON DUPLICATE KEY UPDATE setting_value = ?",
      [newKey, newKey]
    );
    res.json({ success: true, secretKey: newKey, message: 'เปลี่ยนรหัสความปลอดภัย Cron Job สำเร็จ' });
  } catch (error) {
    console.error('Error updating cron secret key:', error);
    res.status(500).json({ success: false, message: 'Failed to update cron secret key' });
  }
});

// GET/POST /api/system/cron/run - Public (Secure via token)
router.all('/cron/run', verifyCronKey, async (req, res) => {
  const task = req.query.task || req.body?.task;
  const force = req.query.force === 'true' || req.body?.force === true;

  if (!task) {
    return res.status(400).json({ success: false, error: 'Missing task parameter' });
  }

  try {
    let result;
    switch (task) {
      case 'abandoned_cart': {
        const { runAbandonedCartRecovery } = require('../services/cronService');
        result = await runAbandonedCartRecovery();
        break;
      }
      case 'co_purchase': {
        const { runCoPurchaseAggregation } = require('../services/cronService');
        result = await runCoPurchaseAggregation();
        break;
      }
      case 'view_count': {
        const { runProductViewCountRefresh } = require('../services/cronService');
        result = await runProductViewCountRefresh();
        break;
      }
      case 'article_generation': {
        const { processArticleGeneration } = require('../services/articleCronService');
        result = await processArticleGeneration(true);
        break;
      }
      case 'line_broadcast': {
        const { processLineBroadcast } = require('../services/lineCronService');
        result = await processLineBroadcast(false, null, force);
        break;
      }
      case 'newsletter': {
        const { processNewsletter } = require('../services/newsletterCronService');
        result = await processNewsletter(false, null, force);
        break;
      }
      case 'report_daily': {
        const { generateDailyReport } = require('../services/scheduledReports');
        await generateDailyReport();
        result = { success: true, message: 'Daily report triggered successfully' };
        break;
      }
      case 'report_weekly': {
        const { generateWeeklyReport } = require('../services/scheduledReports');
        await generateWeeklyReport();
        result = { success: true, message: 'Weekly report triggered successfully' };
        break;
      }
      case 'report_monthly': {
        const { generateMonthlyReport } = require('../services/scheduledReports');
        await generateMonthlyReport();
        result = { success: true, message: 'Monthly report triggered successfully' };
        break;
      }
      default:
        return res.status(400).json({ success: false, error: `Unknown task: ${task}` });
    }

    res.json({
      success: true,
      task,
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error(`Error running cron task "${task}":`, error);
    res.status(500).json({
      success: false,
      task,
      error: error.message || 'Internal server error while running task'
    });
  }
});

// GET/POST /api/system/cron/pulse - Public (Secure via token)
router.all('/cron/pulse', verifyCronKey, async (req, res) => {
  const logMessages = [];
  const runTasks = [];

  try {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    logMessages.push(`Pulse at ${now.toISOString()} - Server Time: ${timeStr}, DayOfWeek: ${dayOfWeek}, DayOfMonth: ${dayOfMonth}`);

    const [settingsRows] = await db.query(
      "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('article_automation_config', 'line_automation_config', 'newsletter_automation_config', 'notify_telegram_enabled')"
    );
    const configs = {};
    settingsRows.forEach(r => configs[r.setting_key] = r.setting_value);

    const parseConfig = (key, defaultVal) => {
      try { return configs[key] ? JSON.parse(configs[key]) : defaultVal; } catch (e) { return defaultVal; }
    };

    const articleConfig = parseConfig('article_automation_config', { enabled: false, time: '08:00' });
    const lineConfig = parseConfig('line_automation_config', { enabled: false, time: '12:00' });
    const newsletterConfig = parseConfig('newsletter_automation_config', { enabled: false, time: '09:00' });
    const telegramEnabled = configs.notify_telegram_enabled === 'true';

    if (hour === 10 && minute === 0) {
      runTasks.push('abandoned_cart');
    }

    if (hour % 6 === 0 && minute === 0) {
      runTasks.push('co_purchase');
    }

    if (hour === 3 && minute === 0) {
      runTasks.push('view_count');
    }

    const timeMatches = (configTime, enabledFlag) => {
      if (!enabledFlag || !configTime) return false;
      const [h, m] = configTime.split(':');
      return parseInt(h) === hour && parseInt(m) === minute;
    };

    if (timeMatches(articleConfig.time, articleConfig.enabled)) {
      runTasks.push('article_generation');
    }

    if (timeMatches(lineConfig.time, lineConfig.enabled)) {
      runTasks.push('line_broadcast');
    }

    if (timeMatches(newsletterConfig.time, newsletterConfig.enabled)) {
      runTasks.push('newsletter');
    }

    if (telegramEnabled && hour === 8 && minute === 0) {
      runTasks.push('report_daily');
    }

    if (telegramEnabled && dayOfWeek === 1 && hour === 9 && minute === 0) {
      runTasks.push('report_weekly');
    }

    if (telegramEnabled && dayOfMonth === 1 && hour === 9 && minute === 0) {
      runTasks.push('report_monthly');
    }

    const executedResults = [];
    for (const task of runTasks) {
      logMessages.push(`Pulse: Triggering scheduled task "${task}"`);
      try {
        let result;
        if (task === 'abandoned_cart') {
          const { runAbandonedCartRecovery } = require('../services/cronService');
          result = await runAbandonedCartRecovery();
        } else if (task === 'co_purchase') {
          const { runCoPurchaseAggregation } = require('../services/cronService');
          result = await runCoPurchaseAggregation();
        } else if (task === 'view_count') {
          const { runProductViewCountRefresh } = require('../services/cronService');
          result = await runProductViewCountRefresh();
        } else if (task === 'article_generation') {
          const { processArticleGeneration } = require('../services/articleCronService');
          result = await processArticleGeneration(false);
        } else if (task === 'line_broadcast') {
          const { processLineBroadcast } = require('../services/lineCronService');
          result = await processLineBroadcast(false, null, false);
        } else if (task === 'newsletter') {
          const { processNewsletter } = require('../services/newsletterCronService');
          result = await processNewsletter(false);
        } else if (task === 'report_daily') {
          const { generateDailyReport } = require('../services/scheduledReports');
          await generateDailyReport();
          result = { success: true };
        } else if (task === 'report_weekly') {
          const { generateWeeklyReport } = require('../services/scheduledReports');
          await generateWeeklyReport();
          result = { success: true };
        } else if (task === 'report_monthly') {
          const { generateMonthlyReport } = require('../services/scheduledReports');
          await generateMonthlyReport();
          result = { success: true };
        }
        executedResults.push({ task, success: true, result });
      } catch (err) {
        console.error(`Pulse failed to execute task "${task}":`, err);
        executedResults.push({ task, success: false, error: err.message });
      }
    }

    res.json({
      success: true,
      pulse_time: now.toISOString(),
      tasks_evaluated: runTasks.length,
      executed: executedResults,
      logs: logMessages
    });
  } catch (error) {
    console.error('Cron pulse error:', error);
    res.status(500).json({ success: false, error: error.message, logs: logMessages });
  }
});

module.exports = router;

