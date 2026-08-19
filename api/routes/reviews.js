const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { verifyAdmin } = require('./auth');

const JWT_SECRET = process.env.JWT_SECRET;

// Basic Thai Profanity Filter 
const profanityList = ['ควย', 'สัส', 'เหี้ย', 'เย็ด', 'หี', 'แตด', 'พ่อง', 'แม่ง', 'ส้นตีน'];
const containsProfanity = (text) => {
    if (!text) return false;
    return profanityList.some(word => text.includes(word));
};

// Auto-create product_reviews table
const initReviewsTable = async () => {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS product_reviews (
                id VARCHAR(36) PRIMARY KEY,
                product_id VARCHAR(36) NOT NULL,
                order_id VARCHAR(36),
                user_id VARCHAR(36) NOT NULL,
                rating TINYINT NOT NULL DEFAULT 5,
                comment TEXT,
                images JSON,
                is_approved TINYINT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_product (product_id),
                INDEX idx_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    } catch (e) {
        console.error('[Reviews] Table init error:', e.message);
    }
};
initReviewsTable();

// Verify customer middleware
const verifyCustomer = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'กรุณาเข้าสู่ระบบ' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
};

// GET /api/reviews/:productId — Get approved reviews for a product with pagination
router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // 1. Fetch summary stats via Aggregate SQL
        const [stats] = await db.query(
            `SELECT rating, COUNT(*) as count 
             FROM product_reviews 
             WHERE product_id = ? AND is_approved = 1
             GROUP BY rating`,
            [productId]
        );

        let totalReviews = 0;
        let sumRating = 0;
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        
        stats.forEach(s => {
            const count = parseInt(s.count);
            // Default 0 if it's external, otherwise map
            if (distribution[s.rating] !== undefined) {
                distribution[s.rating] = count;
            }
            totalReviews += count;
            sumRating += (s.rating * count);
        });

        const avgRating = totalReviews > 0 ? (sumRating / totalReviews).toFixed(1) : 0;
        
        // 2. Fetch paginated reviews
        const [reviews] = await db.query(
            `SELECT r.id, r.rating, r.comment, r.images, r.created_at, 
                    u.first_name, u.last_name, u.avatar_url
             FROM product_reviews r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.product_id = ? AND r.is_approved = 1
             ORDER BY r.created_at DESC
             LIMIT ? OFFSET ?`,
            [productId, limit, offset]
        );
        
        const hasMore = (offset + reviews.length) < totalReviews;

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    page,
                    limit,
                    total: totalReviews,
                    hasMore
                },
                summary: {
                    total: totalReviews,
                    average: parseFloat(avgRating),
                    distribution
                }
            }
        });
    } catch (err) {
        console.error('Fetch Reviews Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/reviews/me/:productId — Get the logged-in user's review for a product
router.get('/me/:productId', verifyCustomer, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;
        
        const [reviews] = await db.query(
            `SELECT id, rating, comment, images, is_approved, created_at
             FROM product_reviews
             WHERE product_id = ? AND user_id = ?
             LIMIT 1`,
            [productId, userId]
        );
        
        if (reviews.length === 0) {
            return res.json({ success: true, has_review: false });
        }
        
        const review = reviews[0];
        // Parse images if needed
        let images = [];
        if (typeof review.images === 'string') {
            try { images = JSON.parse(review.images); } catch (e) { images = []; }
        } else if (Array.isArray(review.images)) {
            images = review.images;
        }
        review.images = images;
        
        res.json({ success: true, has_review: true, data: review });
    } catch (err) {
        console.error('Fetch My Review Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/reviews — Create a new review (must be logged in + have purchased the product in this order)
router.post('/', verifyCustomer, async (req, res) => {
    try {
        const { product_id, order_id, rating, comment, images } = req.body;
        const userId = req.user.id;
        
        if (!product_id) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุสินค้า' });
        }
        if (!order_id) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุคำสั่งซื้อ' });
        }
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: 'กรุณาให้คะแนน 1-5 ดาว' });
        }
        
        // Check if user has purchased this product in this SPECIFIC order and order is completed
        const [purchaseCheck] = await db.query(
            `SELECT oi.id FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE o.user_id = ? AND oi.product_id = ? AND o.id = ?
               AND o.payment_status = 'paid' 
               AND o.order_status IN ('completed', 'delivered')
             LIMIT 1`,
            [userId, product_id, order_id]
        );
        
        if (purchaseCheck.length === 0) {
            return res.status(403).json({ success: false, error: 'คุณสามารถรีวิวได้เฉพาะสินค้าที่ได้รับแล้วและคำสั่งซื้อเสร็จสมบูรณ์เท่านั้น' });
        }
        
        // Check if user already reviewed this product for THIS order
        // Note: New rule states they can review once per order and CANNOT edit
        const [existingReview] = await db.query(
            'SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ? AND order_id = ?',
            [userId, product_id, order_id]
        );
        
        if (existingReview.length > 0) {
            return res.status(400).json({ success: false, error: 'คุณทำการรีวิวสินค้ารายการนี้ในคำสั่งซื้อนี้เรียบร้อยแล้ว และไม่สามารถแก้ไขได้' });
        }

        // Auto check profanity
        const isApproved = containsProfanity(comment) ? 0 : 1;
        
        // Format images
        let imagesJson = null;
        if (Array.isArray(images) && images.length > 0) {
            imagesJson = JSON.stringify(images.slice(0, 3)); // Max 3 images
        }
        
        // Create new review
        const reviewId = uuidv4();
        await db.query(
            'INSERT INTO product_reviews (id, product_id, order_id, user_id, rating, comment, images, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [reviewId, product_id, order_id, userId, rating, comment || '', imagesJson, isApproved]
        );
        
        // Update product aggregate rating
        await updateProductRating(product_id);
        
        if (isApproved === 0) {
            return res.status(201).json({ success: true, message: 'บันทึกรีวิวแล้ว (รอการตรวจสอบเนื้อหาจากผู้ดูแลระบบ)' });
        }
        res.status(201).json({ success: true, message: 'ขอบคุณสำหรับรีวิวของคุณ! รีวิวไม่สามารถแก้ไขได้อีก' });
    } catch (err) {
        console.error('Create Review Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/reviews/:id — Delete own review
router.delete('/:id', verifyCustomer, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const [review] = await db.query('SELECT product_id FROM product_reviews WHERE id = ? AND user_id = ?', [id, userId]);
        if (review.length === 0) {
            return res.status(404).json({ success: false, error: 'ไม่พบรีวิว' });
        }
        
        const productId = review[0].product_id;
        await db.query('DELETE FROM product_reviews WHERE id = ? AND user_id = ?', [id, userId]);
        
        await updateProductRating(productId);
        
        res.json({ success: true, message: 'ลบรีวิวเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper: Update aggregate rating on the products table
async function updateProductRating(productId) {
    try {
        const [result] = await db.query(
            `SELECT COUNT(*) as count, COALESCE(AVG(rating), 0) as avg_rating 
             FROM product_reviews WHERE product_id = ? AND is_approved = 1`,
            [productId]
        );
        const { count, avg_rating } = result[0];
        await db.query(
            'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
            [parseFloat(avg_rating).toFixed(1), count, productId]
        );

        // Invalidate product caches immediately
        try {
            const cacheService = require('../services/cacheService');
            await cacheService.delPattern('products:*');
        } catch (cErr) {}
    } catch (e) {
        console.error('[Reviews] Update product rating error:', e.message);
    }
}

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

// GET /api/reviews/admin/all — Get all reviews (for admin)
router.get('/admin/all', verifyAdmin, async (req, res) => {
    try {
        const [reviews] = await db.query(
            `SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.images, r.is_approved, r.created_at,
                    p.name as product_name, p.image_url as product_image,
                    u.first_name, u.last_name, u.email
             FROM product_reviews r
             JOIN products p ON r.product_id = p.id
             LEFT JOIN users u ON r.user_id = u.id
             ORDER BY r.created_at DESC`
        );
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/reviews/admin/:id/status — Approve/Reject a review
router.put('/admin/:id/status', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_approved } = req.body;
        
        const [review] = await db.query('SELECT product_id FROM product_reviews WHERE id = ?', [id]);
        if (review.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบรีวิว' });
        
        await db.query('UPDATE product_reviews SET is_approved = ? WHERE id = ?', [is_approved ? 1 : 0, id]);
        await updateProductRating(review[0].product_id);
        
        res.json({ success: true, message: 'อัปเดตสถานะเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/reviews/admin/:id — Admin delete review
router.delete('/admin/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [review] = await db.query('SELECT product_id FROM product_reviews WHERE id = ?', [id]);
        if (review.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบรีวิว' });
        
        await db.query('DELETE FROM product_reviews WHERE id = ?', [id]);
        await updateProductRating(review[0].product_id);
        
        res.json({ success: true, message: 'ลบรีวิวเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
