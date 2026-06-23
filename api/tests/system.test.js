const request = require('supertest');
const app = require('../index');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Mock database globally for these tests
jest.mock('../config/database', () => {
  return {
    query: jest.fn(),
    execute: jest.fn(),
    getConnection: jest.fn().mockResolvedValue({
      query: jest.fn(),
      release: jest.fn(),
    }),
  };
});

// Setup mock token
const JWT_SECRET = 'test-secret';
const adminToken = jwt.sign(
  { id: 'admin-uuid', username: 'test-admin', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const logsDir = path.join(__dirname, '..', 'logs');
const combinedLogPath = path.join(logsDir, 'combined.log');
const errorLogPath = path.join(logsDir, 'error.log');

// Setup directories and mock files
beforeAll(() => {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
});

// Clean up log files and clear mocks after testing
afterEach(() => {
  if (fs.existsSync(combinedLogPath)) {
    fs.unlinkSync(combinedLogPath);
  }
  if (fs.existsSync(errorLogPath)) {
    fs.unlinkSync(errorLogPath);
  }
  jest.clearAllMocks();
});

describe('System API Endpoints', () => {
  describe('GET /api/system/info', () => {
    it('should return system version and info successfully', async () => {
      const res = await request(app).get('/api/system/info');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.version).toBeDefined();
    });
  });

  describe('GET /api/system/logs', () => {
    it('should return 403 if no authorization header is provided', async () => {
      const res = await request(app).get('/api/system/logs');
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No token provided');
    });

    it('should return 401 if invalid authorization token is provided', async () => {
      const res = await request(app)
        .get('/api/system/logs')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('should return empty logs data if log file does not exist', async () => {
      const res = await request(app)
        .get('/api/system/logs')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination).toMatchObject({
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0
      });
    });

    it('should retrieve, parse, and filter log files properly', async () => {
      // Create mock log data in JSON lines format (newest last in file, to be read backwards)
      const mockLogs = [
        JSON.stringify({ timestamp: '2026-05-21T07:00:00Z', level: 'info', message: 'First log line' }),
        JSON.stringify({ timestamp: '2026-05-21T07:01:00Z', level: 'warn', message: 'Warning alert' }),
        JSON.stringify({ timestamp: '2026-05-21T07:02:00Z', level: 'error', message: 'Severe system failure' }),
        JSON.stringify({ timestamp: '2026-05-21T07:03:00Z', level: 'info', message: 'Last log line' }),
      ].join('\n');

      fs.writeFileSync(combinedLogPath, mockLogs);

      // Fetch all logs
      const res = await request(app)
        .get('/api/system/logs')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(4);
      
      // Newest logs first
      expect(res.body.data[0].message).toBe('Last log line');
      expect(res.body.data[1].message).toBe('Severe system failure');
      expect(res.body.data[3].message).toBe('First log line');

      // Filter by level
      const resLevel = await request(app)
        .get('/api/system/logs?level=error')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(resLevel.statusCode).toBe(200);
      expect(resLevel.body.data.length).toBe(1);
      expect(resLevel.body.data[0].level).toBe('error');
      expect(resLevel.body.data[0].message).toBe('Severe system failure');

      // Filter by text search query
      const resSearch = await request(app)
        .get('/api/system/logs?query=alert')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(resSearch.statusCode).toBe(200);
      expect(resSearch.body.data.length).toBe(1);
      expect(resSearch.body.data[0].message).toBe('Warning alert');
    });
  });

  describe('DELETE /api/system/logs', () => {
    it('should return 403 if unauthorized user attempts to delete logs', async () => {
      const res = await request(app).delete('/api/system/logs');
      expect(res.statusCode).toBe(403);
    });

    it('should successfully truncate combined and error logs', async () => {
      fs.writeFileSync(combinedLogPath, 'info log data');
      fs.writeFileSync(errorLogPath, 'error log data');

      const res = await request(app)
        .delete('/api/system/logs')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('เคลียร์ประวัติ Log เรียบร้อยแล้ว');

      // Check files are truncated
      expect(fs.readFileSync(combinedLogPath, 'utf8')).toBe('');
      expect(fs.readFileSync(errorLogPath, 'utf8')).toBe('');
    });
  });

  // DB-Driven Order Activity Log tests
  describe('GET /api/system/order-activities', () => {
    it('should return 403 if unauthorized', async () => {
      const res = await request(app).get('/api/system/order-activities');
      expect(res.statusCode).toBe(403);
    });

    it('should fetch order activity logs with pagination and mock query successfully', async () => {
      // 1. Mock DB count query
      db.query.mockResolvedValueOnce([[{ total: 2 }]]);
      // 2. Mock DB select data query
      const mockDbRows = [
        { id: 1, order_id: 'ord-100', action: 'status_change', details: 'Confirmed order', performed_by: 'admin', created_at: '2026-05-21T08:00:00Z' },
        { id: 2, order_id: 'ord-101', action: 'payment_change', details: 'Paid successfully', performed_by: 'system', created_at: '2026-05-21T08:05:00Z' }
      ];
      db.query.mockResolvedValueOnce([mockDbRows]);

      const res = await request(app)
        .get('/api/system/order-activities?page=1&limit=20&query=change')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].order_id).toBe('ord-100');
      expect(res.body.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1
      });
      expect(db.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('DELETE /api/system/order-activities', () => {
    it('should truncate order activity log table', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app)
        .delete('/api/system/order-activities')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('เคลียร์ประวัติกิจกรรมคำสั่งซื้อเรียบร้อยแล้ว');
      expect(db.query).toHaveBeenCalledWith('TRUNCATE TABLE order_activity_log');
    });
  });

  // DB-Driven Email Log tests
  describe('GET /api/system/email-logs', () => {
    it('should return 403 if unauthorized', async () => {
      const res = await request(app).get('/api/system/email-logs');
      expect(res.statusCode).toBe(403);
    });

    it('should fetch email logs with filters and pagination successfully', async () => {
      db.query.mockResolvedValueOnce([[{ total: 1 }]]);
      const mockEmailRows = [
        { id: 10, recipient: 'client@example.com', subject: 'Receipt', email_type: 'receipt', status: 'success', error_message: null, created_at: '2026-05-21T09:00:00Z' }
      ];
      db.query.mockResolvedValueOnce([mockEmailRows]);

      const res = await request(app)
        .get('/api/system/email-logs?page=1&limit=50&status=success&query=client')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].recipient).toBe('client@example.com');
      expect(res.body.pagination.total).toBe(1);
      expect(db.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('DELETE /api/system/email-logs', () => {
    it('should truncate email log table', async () => {
      db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const res = await request(app)
        .delete('/api/system/email-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('เคลียร์ประวัติการส่งอีเมลเรียบร้อยแล้ว');
      expect(db.query).toHaveBeenCalledWith('TRUNCATE TABLE email_logs');
    });
  });
});
