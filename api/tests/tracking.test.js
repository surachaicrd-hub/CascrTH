const request = require('supertest');
const app = require('../index');
const db = require('../config/database');

jest.mock('../config/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
}));

describe('Tracking & Smart Recommendation API Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear recommendation cache by requiring the router and manually resetting or triggering gc
        // The cache is in-memory inside routes/tracking.js.
    });

    describe('GET /api/track-interest/smart-recommendation', () => {
        it('should return 400 if sessionId is missing', async () => {
            const res = await request(app).get('/api/track-interest/smart-recommendation');
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('sessionId is required');
        });

        it('should return popular products if user has no viewing history', async () => {
            // 1. Mock user history query returning empty array (no views)
            db.query.mockResolvedValueOnce([[]]);

            // 2. Mock fetch all active products
            const mockProducts = [
                { id: 'p1', name: 'Product 1', category: 'Sheds', price: '1000', original_price: '1200', view_count: 10, is_active: 1, is_out_of_stock: 0 },
                { id: 'p2', name: 'Product 2', category: 'Sheds', price: '2000', original_price: null, view_count: 5, is_active: 1, is_out_of_stock: 0 }
            ];
            db.query.mockResolvedValueOnce([mockProducts]);

            const res = await request(app).get('/api/track-interest/smart-recommendation?sessionId=test-sess-1&limit=2');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.source).toBe('popular');
            expect(res.body.products).toHaveLength(2);
            expect(res.body.products[0].id).toBe('p1');
        });

        it('should cache recommendations using contextual cacheKey and hit cache on subsequent requests', async () => {
            // First Request: Cache Miss
            // 1. Mock user history query
            db.query.mockResolvedValueOnce([[
                { event_data: JSON.stringify({ productId: 'p1' }) }
            ]]);
            // 2. Mock fetch active products
            const mockProducts = [
                { id: 'p1', name: 'Product 1', category: 'Sheds', price: '1000', view_count: 10, is_active: 1, is_out_of_stock: 0 },
                { id: 'p2', name: 'Product 2', category: 'Sheds', price: '2000', view_count: 5, is_active: 1, is_out_of_stock: 0 }
            ];
            db.query.mockResolvedValueOnce([mockProducts]);
            // 3. Mock co-view query
            db.query.mockResolvedValueOnce([[]]);

            const res1 = await request(app).get('/api/track-interest/smart-recommendation?sessionId=test-sess-2&currentProductId=p1&limit=2');
            expect(res1.statusCode).toBe(200);
            expect(res1.body.success).toBe(true);
            expect(res1.body.source).toBe('scoring');

            // Second Request: Cache Hit
            // It should hit cache because we search with the same sessionId and currentProductId.
            // If it hits the cache, no database queries should be triggered.
            const res2 = await request(app).get('/api/track-interest/smart-recommendation?sessionId=test-sess-2&currentProductId=p1&limit=2');
            expect(res2.statusCode).toBe(200);
            expect(res2.body.success).toBe(true);
            expect(res2.body.source).toBe('cache');
            expect(res2.body.products).toHaveLength(1); // p2 (since p1 is viewed/excluded)
        });

        it('should execute co-view SQL query with JSON_UNQUOTE(JSON_EXTRACT(...))', async () => {
            // Mock user history
            db.query.mockResolvedValueOnce([[
                { event_data: JSON.stringify({ productId: 'p1' }) }
            ]]);
            // Mock fetch active products
            const mockProducts = [
                { id: 'p1', name: 'Product 1', category: 'Sheds', price: '1000', view_count: 10, is_active: 1, is_out_of_stock: 0 },
                { id: 'p2', name: 'Product 2', category: 'Sheds', price: '2000', view_count: 5, is_active: 1, is_out_of_stock: 0 }
            ];
            db.query.mockResolvedValueOnce([mockProducts]);
            // Mock co-view query
            db.query.mockResolvedValueOnce([[]]);

            await request(app).get('/api/track-interest/smart-recommendation?sessionId=test-sess-3&currentProductId=p1');

            // Verify db.query was called for co-view with JSON_UNQUOTE
            const coViewQueryCall = db.query.mock.calls.find(call => 
                typeof call[0] === 'string' && call[0].includes('JSON_UNQUOTE(JSON_EXTRACT')
            );
            expect(coViewQueryCall).toBeDefined();
            expect(coViewQueryCall[0]).toContain('JSON_UNQUOTE(JSON_EXTRACT(cb1.event_data, \'$.productId\'))');
        });
    });
});
