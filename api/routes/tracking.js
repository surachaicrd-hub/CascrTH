const express = require('express');
const router = express.Router();
const db = require('../config/database');
const gemini = require('../services/geminiService');

// ═══════════════════════════════════════════════
// In-memory cache for smart recommendations
// ═══════════════════════════════════════════════
const recommendationCache = new Map(); // sessionId -> { data, timestamp }
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedRecommendation(sessionId) {
    const cached = recommendationCache.get(sessionId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.data;
    }
    recommendationCache.delete(sessionId);
    return null;
}

function setCachedRecommendation(sessionId, data) {
    recommendationCache.set(sessionId, { data, timestamp: Date.now() });
    // Cleanup old entries periodically
    if (recommendationCache.size > 500) {
        const now = Date.now();
        for (const [key, val] of recommendationCache) {
            if (now - val.timestamp > CACHE_TTL) recommendationCache.delete(key);
        }
    }
}

// ═══════════════════════════════════════════════
// POST / — Track events (batch + single)
// ═══════════════════════════════════════════════
router.post('/', async (req, res) => {
    try {
        if (req.body.batch && Array.isArray(req.body.batch)) {
            const values = [];
            const flatData = [];
            for (const event of req.body.batch) {
                const { sessionId, type, ...eventData } = event;
                if (sessionId && type) {
                    values.push(`(UUID(), ?, ?, ?)`);
                    flatData.push(sessionId, type, JSON.stringify(eventData || {}));
                }
            }
            if (values.length > 0) {
                 await db.query(`INSERT INTO customer_behavior (id, session_id, event_type, event_data) VALUES ${values.join(',')}`, flatData);
            }
            return res.status(200).json({ success: true, count: values.length });
        }

        // Fallback for single events
        const { sessionId, type, ...eventData } = req.body;
        if (!sessionId || !type) {
            return res.status(400).json({ error: 'Missing required tracking fields', receivedBody: req.body });
        }

        await db.execute(
            `INSERT INTO customer_behavior (id, session_id, event_type, event_data) VALUES (UUID(), ?, ?, ?)`,
            [sessionId, type, JSON.stringify(eventData)]
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Tracking error:', error);
        res.status(500).json({ success: false, error: 'Failed to track event' });
    }
});

// ═══════════════════════════════════════════════
// Multi-Signal Scoring Algorithm
// ═══════════════════════════════════════════════
function calculateProductScore(candidate, viewedProducts, coViewMap, maxViewCount, currentProduct = null) {
    let score = 0;

    // 1. Category Match (30%) — products in the same category as what user viewed
    const viewedCategories = [...new Set(viewedProducts.map(p => p.category).filter(Boolean))];
    if (viewedCategories.includes(candidate.category)) {
        score += 30;
    }

    // Strong Boost for Current Product Category Context
    if (currentProduct && candidate.category === currentProduct.category) {
        score += 50; // Heavy boost for the category they are currently looking at
    }

    // 2. Price Range Similarity (20%) — within 50% price range of viewed products
    const viewedPrices = viewedProducts.map(p => Number(p.price)).filter(p => p > 0);
    if (viewedPrices.length > 0) {
        const avgPrice = viewedPrices.reduce((a, b) => a + b, 0) / viewedPrices.length;
        const candidatePrice = Number(candidate.price) || 0;
        if (candidatePrice > 0 && avgPrice > 0) {
            const ratio = Math.min(candidatePrice, avgPrice) / Math.max(candidatePrice, avgPrice);
            score += ratio * 20; // 0-20 points based on price similarity
        }
    }

    // 3. Co-view Frequency (30%) — how often this product is viewed with the same products
    const coViewScore = coViewMap.get(candidate.id) || 0;
    if (coViewScore > 0) {
        score += Math.min(coViewScore * 5, 30); // Cap at 30, 5 pts per co-view
    }

    // 4. Popularity (20%) — based on view_count
    if (maxViewCount > 0) {
        const popularityRatio = (candidate.view_count || 0) / maxViewCount;
        score += popularityRatio * 20;
    }

    // Small random factor (0-3) to add variety
    score += Math.random() * 3;

    return score;
}

// ═══════════════════════════════════════════════
// GET /smart-recommendation — Multi-signal smart recommendations
// Returns multiple products (3-6) ranked by scoring algorithm
// ═══════════════════════════════════════════════
router.get('/smart-recommendation', async (req, res) => {
    try {
        const { sessionId, limit: rawLimit, currentProductId } = req.query;
        const limit = Math.min(parseInt(rawLimit) || 4, 8);

        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'sessionId is required' });
        }

        // Check cache first using contextual key
        const cacheKey = currentProductId ? `${sessionId}_${currentProductId}` : sessionId;
        const cached = getCachedRecommendation(cacheKey);
        if (cached) {
            return res.status(200).json({ success: true, source: 'cache', products: cached.slice(0, limit) });
        }

        // 1. Fetch user viewing history
        const [historyRows] = await db.query(
            'SELECT event_data FROM customer_behavior WHERE session_id = ? AND event_type = "view_product" ORDER BY created_at DESC LIMIT 20',
            [sessionId]
        );

        // Parse viewed product IDs
        const viewedProductIds = historyRows.map(r => {
            try {
                const data = typeof r.event_data === 'string' ? JSON.parse(r.event_data) : r.event_data;
                return data.productId;
            } catch { return null; }
        }).filter(Boolean);
        const uniqueViewedIds = [...new Set(viewedProductIds)];

        // Ensure currentProductId is considered even if not in history yet
        if (currentProductId && !uniqueViewedIds.includes(currentProductId)) {
            uniqueViewedIds.push(currentProductId);
        }

        // 2. Fetch all active products with view_count
        const [allProducts] = await db.query(
            `SELECT id, name, sku, category, categories, price, slug, image_url, original_price, view_count, card_features 
             FROM products 
             WHERE is_active = 1 AND is_out_of_stock = 0 
               AND NOT EXISTS (
                   SELECT 1 FROM categories c
                   WHERE c.is_active = false
                     AND (category = c.name OR (categories IS NOT NULL AND JSON_CONTAINS(categories, JSON_QUOTE(c.name))))
               )
             ORDER BY view_count DESC LIMIT 100`
        );

        if (allProducts.length === 0) {
            return res.status(200).json({ success: true, source: 'empty', products: [] });
        }

        // No history — return popular products
        if (uniqueViewedIds.length === 0) {
            const popular = allProducts.slice(0, limit).map(p => ({
                ...p, price: p.price != null ? Number(p.price) : 0,
                original_price: p.original_price != null ? Number(p.original_price) : null,
                card_features: p.card_features ? (typeof p.card_features === 'string' ? JSON.parse(p.card_features) : p.card_features) : null,
                categories: p.categories ? (typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories) : []
            }));
            setCachedRecommendation(cacheKey, popular);
            return res.status(200).json({ success: true, source: 'popular', products: popular });
        }

        // 3. Build co-view map: how often each product is viewed by users who viewed the same products
        let coViewMap = new Map();
        try {
            // Find other sessions that viewed the same products
            if (uniqueViewedIds.length > 0) {
                const placeholders = uniqueViewedIds.map(() => '?').join(',');
                const [coViewRows] = await db.query(
                    `SELECT cb2.event_data FROM customer_behavior cb1
                     INNER JOIN customer_behavior cb2 ON cb1.session_id = cb2.session_id
                     WHERE cb1.session_id != ?
                       AND cb1.event_type = 'view_product'
                       AND cb2.event_type = 'view_product'
                       AND JSON_UNQUOTE(JSON_EXTRACT(cb1.event_data, '$.productId')) IN (${placeholders})
                       AND cb1.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                     LIMIT 200`,
                    [sessionId, ...uniqueViewedIds]
                );

                for (const row of coViewRows) {
                    try {
                        const data = typeof row.event_data === 'string' ? JSON.parse(row.event_data) : row.event_data;
                        if (data.productId && !uniqueViewedIds.includes(data.productId)) {
                            coViewMap.set(data.productId, (coViewMap.get(data.productId) || 0) + 1);
                        }
                    } catch { /* skip malformed data */ }
                }
            }
        } catch (e) {
            console.warn('Co-view query failed, continuing without:', e.message);
        }

        // 4. Get viewed products details for scoring context
        // Ensure currentProductId is considered even if not in history yet
        if (currentProductId && !uniqueViewedIds.includes(currentProductId)) {
            uniqueViewedIds.push(currentProductId);
        }

        const viewedProducts = allProducts.filter(p => uniqueViewedIds.includes(p.id));
        const unviewedProducts = allProducts.filter(p => !uniqueViewedIds.includes(p.id));
        
        const currentProduct = currentProductId ? allProducts.find(p => p.id === currentProductId) : null;

        if (unviewedProducts.length === 0) {
            // All products viewed, return most popular
            const popular = allProducts.slice(0, limit).map(p => ({
                ...p, price: p.price != null ? Number(p.price) : 0,
                original_price: p.original_price != null ? Number(p.original_price) : null,
                card_features: p.card_features ? (typeof p.card_features === 'string' ? JSON.parse(p.card_features) : p.card_features) : null,
                categories: p.categories ? (typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories) : []
            }));
            setCachedRecommendation(cacheKey, popular);
            return res.status(200).json({ success: true, source: 'all_viewed', products: popular });
        }

        // 5. Score and rank all unviewed products
        const maxViewCount = Math.max(...allProducts.map(p => p.view_count || 0), 1);
        const scored = unviewedProducts.map(p => ({
            ...p,
            price: p.price != null ? Number(p.price) : 0,
            original_price: p.original_price != null ? Number(p.original_price) : null,
            card_features: p.card_features ? (typeof p.card_features === 'string' ? JSON.parse(p.card_features) : p.card_features) : null,
            categories: p.categories ? (typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories) : [],
            _score: calculateProductScore(p, viewedProducts, coViewMap, maxViewCount, currentProduct)
        }));

        scored.sort((a, b) => b._score - a._score);

        // 6. Optionally enhance with Gemini for users with rich history
        let source = 'scoring';
        if (uniqueViewedIds.length >= 5) {
            try {
                const topCandidates = scored.slice(0, 12);
                const historyText = viewedProducts.slice(0, 5).map(p => `- ${p.name} (${p.category}, ฿${Number(p.price).toLocaleString()})`).join('\n');
                const catalogText = topCandidates.map(p => `ID:${p.id}|${p.name}|${p.category}`).join('\n');

                const prompt = `You are a product recommendation engine. User viewed:\n${historyText}\n\nRank these products by purchase likelihood. Return ONLY comma-separated IDs in order, nothing else:\n${catalogText}`;

                const response = await gemini.generateContent({
                    prompt,
                    responseMimeType: 'text/plain',
                    label: 'Smart Recommendation',
                    models: ['gemini-2.5-flash-lite', 'gemini-2.5-flash'] // Use lite model for speed
                });

                const aiIds = response.text.trim().split(',').map(id => id.trim()).filter(Boolean);
                if (aiIds.length >= 2) {
                    // Reorder scored list based on AI ranking
                    const aiRanked = [];
                    for (const id of aiIds) {
                        const found = scored.find(p => p.id === id);
                        if (found) aiRanked.push(found);
                    }
                    // Append any scored items not mentioned by AI
                    for (const p of scored) {
                        if (!aiRanked.find(r => r.id === p.id)) aiRanked.push(p);
                    }
                    scored.length = 0;
                    scored.push(...aiRanked);
                    source = 'ai_enhanced';
                }
            } catch (aiError) {
                console.warn('Gemini enhancement failed, using scoring only:', aiError.message);
            }
        }

        // Clean internal fields and limit
        const results = scored.slice(0, limit).map(({ _score, view_count, ...rest }) => rest);
        setCachedRecommendation(cacheKey, results);

        return res.status(200).json({ success: true, source, products: results });

    } catch (error) {
        console.error('Smart Recommendation Error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate recommendations' });
    }
});

// ═══════════════════════════════════════════════
// GET /recently-viewed — Products user recently viewed
// Pure SQL, no AI cost
// ═══════════════════════════════════════════════
router.get('/recently-viewed', async (req, res) => {
    try {
        const { sessionId } = req.query;
        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'sessionId is required' });
        }

        // Get distinct viewed product IDs in order
        const [historyRows] = await db.query(
            `SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.productId')) as product_id,
                    MAX(created_at) as last_viewed
             FROM customer_behavior
             WHERE session_id = ? AND event_type = 'view_product'
             GROUP BY product_id
             ORDER BY last_viewed DESC
             LIMIT 12`,
            [sessionId]
        );

        if (historyRows.length === 0) {
            return res.status(200).json({ success: true, products: [] });
        }

        const productIds = historyRows.map(r => r.product_id).filter(Boolean);
        if (productIds.length === 0) {
            return res.status(200).json({ success: true, products: [] });
        }

        const placeholders = productIds.map(() => '?').join(',');
        const [products] = await db.query(
            `SELECT id, name, sku, slug, price, original_price, image_url, category, categories, rating, review_count, card_features
             FROM products WHERE id IN (${placeholders}) AND is_active = 1
               AND NOT EXISTS (
                   SELECT 1 FROM categories c
                   WHERE c.is_active = false
                     AND (category = c.name OR (categories IS NOT NULL AND JSON_CONTAINS(categories, JSON_QUOTE(c.name))))
               )`,
            productIds
        );

        // Re-order products to match viewing history order
        const productMap = new Map(products.map(p => [p.id, {
            ...p,
            price: p.price != null ? Number(p.price) : 0,
            original_price: p.original_price != null ? Number(p.original_price) : null,
            rating: p.rating != null ? Number(p.rating) : 5.0,
            review_count: p.review_count != null ? Number(p.review_count) : 0,
            card_features: p.card_features ? (typeof p.card_features === 'string' ? JSON.parse(p.card_features) : p.card_features) : null,
            categories: p.categories ? (typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories) : []
        }]));

        const ordered = productIds.map(id => productMap.get(id)).filter(Boolean);

        return res.status(200).json({ success: true, products: ordered });

    } catch (error) {
        console.error('Recently Viewed Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch recently viewed' });
    }
});

// ═══════════════════════════════════════════════
// GET /frequently-bought-together — Co-purchase recommendations
// Pure SQL from pre-computed table + live order_items fallback
// ═══════════════════════════════════════════════
router.get('/frequently-bought-together', async (req, res) => {
    try {
        const { productId } = req.query;
        if (!productId) {
            return res.status(400).json({ success: false, error: 'productId is required' });
        }

        // 1. Try pre-computed co-purchase table first
        let products = [];
        try {
            const [coRows] = await db.query(
                `SELECT p.id, p.name, p.sku, p.slug, p.price, p.original_price, p.image_url, p.category, p.categories, p.rating, p.review_count, p.card_features,
                        cp.co_count
                 FROM product_co_purchases cp
                 JOIN products p ON cp.co_product_id = p.id
                 WHERE cp.product_id = ? AND p.is_active = 1 AND p.is_out_of_stock = 0
                 ORDER BY cp.co_count DESC
                 LIMIT 4`,
                [productId]
            );

            products = coRows.map(p => ({
                ...p,
                price: p.price != null ? Number(p.price) : 0,
                original_price: p.original_price != null ? Number(p.original_price) : null,
                rating: p.rating != null ? Number(p.rating) : 5.0,
                review_count: p.review_count != null ? Number(p.review_count) : 0,
                card_features: p.card_features ? (typeof p.card_features === 'string' ? JSON.parse(p.card_features) : p.card_features) : null,
                categories: p.categories ? (typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories) : []
            }));
        } catch (e) {
            console.warn('Co-purchase table query failed:', e.message);
        }

        // 2. Fallback: live query from order_items if pre-computed data is empty
        if (products.length === 0) {
            try {
                const [liveRows] = await db.query(
                    `SELECT p.id, p.name, p.sku, p.slug, p.price, p.original_price, p.image_url, p.category, p.categories, p.rating, p.review_count, p.card_features,
                            COUNT(*) as co_count
                     FROM order_items oi1
                     JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi1.product_id != oi2.product_id
                     JOIN products p ON oi2.product_id = p.id
                     WHERE oi1.product_id = ? AND p.is_active = 1 AND p.is_out_of_stock = 0
                     GROUP BY p.id
                     ORDER BY co_count DESC
                     LIMIT 4`,
                    [productId]
                );

                products = liveRows.map(p => ({
                    ...p,
                    price: p.price != null ? Number(p.price) : 0,
                    original_price: p.original_price != null ? Number(p.original_price) : null,
                    rating: p.rating != null ? Number(p.rating) : 5.0,
                    review_count: p.review_count != null ? Number(p.review_count) : 0,
                    card_features: p.card_features ? (typeof p.card_features === 'string' ? JSON.parse(p.card_features) : p.card_features) : null,
                    categories: p.categories ? (typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories) : []
                }));
            } catch (e) {
                console.warn('Live co-purchase query failed:', e.message);
            }
        }

        return res.status(200).json({ success: true, products });

    } catch (error) {
        console.error('Frequently Bought Together Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch co-purchase data' });
    }
});

// ═══════════════════════════════════════════════
// GET /recommendation — Legacy endpoint (redirects to smart)
// Kept for backward compatibility with existing widget
// ═══════════════════════════════════════════════
router.get('/recommendation', async (req, res) => {
    try {
        const { sessionId } = req.query;
        if (!sessionId) {
            return res.status(400).json({ success: false, error: 'sessionId is required' });
        }

        // Use smart recommendation and return first product in old format
        const cached = getCachedRecommendation(sessionId);
        let products = cached;

        if (!products) {
            // Fetch user history
            const [historyRows] = await db.query(
                'SELECT event_data FROM customer_behavior WHERE session_id = ? AND event_type = "view_product" ORDER BY created_at DESC LIMIT 10',
                [sessionId]
            );

            const viewedProductIds = historyRows.map(r => {
                try {
                    const data = typeof r.event_data === 'string' ? JSON.parse(r.event_data) : r.event_data;
                    return data.productId;
                } catch { return null; }
            }).filter(Boolean);
            const uniqueViewedIds = [...new Set(viewedProductIds)];

            if (uniqueViewedIds.length === 0) {
                const [randomProd] = await db.query(`
                    SELECT * FROM products WHERE is_active = 1 AND is_out_of_stock = 0 
                      AND NOT EXISTS (
                          SELECT 1 FROM categories c
                          WHERE c.is_active = false
                            AND (category = c.name OR (categories IS NOT NULL AND JSON_CONTAINS(categories, JSON_QUOTE(c.name))))
                      )
                    ORDER BY RAND() LIMIT 1
                `);
                if (randomProd.length > 0) {
                    return res.status(200).json({ success: true, is_random: true, product: randomProd[0] });
                }
                return res.status(404).json({ success: false, error: 'No products available' });
            }

            // Use scoring for legacy endpoint too
            const [allProducts] = await db.query(`
                SELECT id, name, sku, category, categories, price, slug, image_url, original_price, view_count, card_features 
                FROM products WHERE is_active = 1 AND is_out_of_stock = 0 
                  AND NOT EXISTS (
                      SELECT 1 FROM categories c
                      WHERE c.is_active = false
                        AND (category = c.name OR (categories IS NOT NULL AND JSON_CONTAINS(categories, JSON_QUOTE(c.name))))
                  )
                LIMIT 100
            `);
            const viewedProducts = allProducts.filter(p => uniqueViewedIds.includes(p.id));
            const unviewedProducts = allProducts.filter(p => !uniqueViewedIds.includes(p.id));

            if (unviewedProducts.length === 0) {
                const [randomProd] = await db.query(`
                    SELECT * FROM products WHERE is_active = 1 AND is_out_of_stock = 0 
                      AND NOT EXISTS (
                          SELECT 1 FROM categories c
                          WHERE c.is_active = false
                            AND (category = c.name OR (categories IS NOT NULL AND JSON_CONTAINS(categories, JSON_QUOTE(c.name))))
                      )
                    ORDER BY RAND() LIMIT 1
                `);
                return res.status(200).json({ success: true, is_random: true, product: randomProd[0] });
            }

            const maxViewCount = Math.max(...allProducts.map(p => p.view_count || 0), 1);
            const scored = unviewedProducts.map(p => ({
                ...p,
                card_features: p.card_features ? (typeof p.card_features === 'string' ? JSON.parse(p.card_features) : p.card_features) : null,
                categories: p.categories ? (typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories) : [],
                _score: calculateProductScore(p, viewedProducts, new Map(), maxViewCount)
            }));
            scored.sort((a, b) => b._score - a._score);
            products = scored;
        }

        if (products && products.length > 0) {
            const { _score, view_count, ...product } = products[0];
            return res.status(200).json({ success: true, is_ai: true, product });
        }

        const [randomProd] = await db.query(`
            SELECT * FROM products WHERE is_active = 1 AND is_out_of_stock = 0 
              AND NOT EXISTS (
                  SELECT 1 FROM categories c
                  WHERE c.is_active = false
                    AND (category = c.name OR (categories IS NOT NULL AND JSON_CONTAINS(categories, JSON_QUOTE(c.name))))
              )
            ORDER BY RAND() LIMIT 1
        `);
        return res.status(200).json({ success: true, is_random: true, product: randomProd[0] });

    } catch (error) {
        console.error('Legacy Recommendation Error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate recommendation' });
    }
});

module.exports = router;

