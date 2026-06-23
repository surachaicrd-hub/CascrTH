const request = require('supertest');
const app = require('../index');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Mock external services
jest.mock('../config/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
}));
jest.mock('../config/database');

describe('Auth API Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/users/login', () => {
        it('should return 400 if email or password is missing', async () => {
            const res = await request(app)
                .post('/api/users/login')
                .send({ email: 'test@example.com' });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('กรุณากรอกอีเมลและรหัสผ่าน');
        });

        it('should return 401 for invalid credentials', async () => {
            // Mock DB returning no user
            db.query.mockResolvedValueOnce([[]]);

            const res = await request(app)
                .post('/api/users/login')
                .send({ email: 'wrong@example.com', password: 'password' });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        });

        it('should login successfully with valid credentials', async () => {
            // Mock a user with a hashed password
            const password = 'validpassword1';
            const hashedPassword = await bcrypt.hash(password, 10);
            
            db.query.mockResolvedValueOnce([[{
                id: 'user-uuid-1',
                email: 'test@example.com',
                password: hashedPassword,
                first_name: 'John',
                last_name: 'Doe'
            }]]);

            const res = await request(app)
                .post('/api/users/login')
                .send({ email: 'test@example.com', password });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
            expect(res.body.data).toMatchObject({
                id: 'user-uuid-1',
                email: 'test@example.com',
                first_name: 'John',
                last_name: 'Doe'
            });
        });
    });

    describe('POST /api/users/register', () => {
        it('should register a new user successfully', async () => {
            db.query
                // 1st query: Check if email exists -> returns empty array
                .mockResolvedValueOnce([[]])
                // 2nd query: Insert user
                .mockResolvedValueOnce([{ affectedRows: 1 }]);

            const res = await request(app)
                .post('/api/users/register')
                .send({
                    email: 'newuser@example.com',
                    password: 'password123',
                    first_name: 'New',
                    last_name: 'User',
                    phone: '0812345678'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toBeDefined();
        });

        it('should fail if email is already registered', async () => {
            db.query.mockResolvedValueOnce([[{ id: 'existing-id' }]]);

            const res = await request(app)
                .post('/api/users/register')
                .send({
                    email: 'existing@example.com',
                    password: 'password123',
                    first_name: 'Old',
                    last_name: 'User',
                    phone: '0812345678'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('อีเมลนี้มีอยู่ในระบบแล้ว');
        });
    });
});
