const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin } = require('./auth');
const Joi = require('joi');

const productSchema = Joi.object({
    name: Joi.string().allow('', null).optional(),
    category: Joi.string().allow('', null).optional(),
    categories: Joi.alternatives().try(Joi.array(), Joi.string().allow('', null)).optional(),
    price: Joi.alternatives().try(Joi.number(), Joi.string().allow('', null)).optional(),
    original_price: Joi.alternatives().try(Joi.number(), Joi.string().allow('', null)).optional(),
    size: Joi.string().allow('', null).optional(),
    image_url: Joi.string().allow('', null).optional(),
    description: Joi.string().allow('', null).optional(),
    images: Joi.alternatives().try(Joi.array(), Joi.string().allow('', null)).optional(),
    is_active: Joi.boolean().allow(null).optional(),
    is_out_of_stock: Joi.boolean().allow(null).optional(),
    seo_title: Joi.string().allow('', null).optional(),
    seo_description: Joi.string().allow('', null).optional(),
    seo_keywords: Joi.string().allow('', null).optional(),
    shopee_link: Joi.string().allow('', null).optional(),
    lazada_link: Joi.string().allow('', null).optional(),
    tiktok_link: Joi.string().allow('', null).optional(),
    llm_context: Joi.string().allow('', null).optional(),
    short_description: Joi.string().allow('', null).optional(),
    remarks: Joi.string().allow('', null).optional(),
    slug: Joi.string().allow('', null).optional(),
    image_alt: Joi.string().allow('', null).optional(),
    attributes: Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
    faq: Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
    related_products: Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
    badge_free_shipping: Joi.boolean().optional(),
    badge_warranty: Joi.boolean().optional(),
    badge_installation: Joi.boolean().optional(),
    badge_new: Joi.boolean().optional(),
    badge_bestseller: Joi.boolean().optional(),
    badge_recommended: Joi.boolean().optional(),
    badges: Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
    limit_one_per_order: Joi.boolean().optional(),
    rating: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    review_count: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    stock_quantity: Joi.alternatives().try(Joi.number(), Joi.string().allow('', null)).optional(),
    sale_end_date: Joi.alternatives().try(Joi.string().allow('', null), Joi.date()).optional(),
    card_features: Joi.alternatives().try(Joi.object(), Joi.string()).allow('', null).optional(),
    has_installation_fee: Joi.boolean().allow(null).optional(),
    free_install_bkk: Joi.boolean().allow(null).optional(),
    free_shipping_bkk: Joi.boolean().allow(null).optional(),
    requires_foundation: Joi.boolean().allow(null).optional(),
    compare_enabled: Joi.boolean().allow(null).optional(),
    installation_fee: Joi.alternatives().try(Joi.number(), Joi.string().allow('', null)).optional(),
    weight_kg: Joi.alternatives().try(Joi.number(), Joi.string().allow('', null)).optional(),
    width_cm: Joi.alternatives().try(Joi.number(), Joi.string().allow('', null)).optional(),
    length_cm: Joi.alternatives().try(Joi.number(), Joi.string().allow('', null)).optional(),
    height_cm: Joi.alternatives().try(Joi.number(), Joi.string().allow('', null)).optional()
}).unknown(true);

const validateProduct = (req, res, next) => {
    // 1. Manually coerce boolean fields to prevent Joi validation errors from empty strings/numbers
    const boolFields = ['is_active', 'is_out_of_stock', 'badge_free_shipping', 'badge_warranty', 'badge_installation', 'badge_new', 'badge_bestseller', 'badge_recommended', 'limit_one_per_order', 'has_installation_fee', 'free_install_bkk', 'free_shipping_bkk', 'requires_foundation', 'compare_enabled'];
    boolFields.forEach(f => {
        if (req.body[f] !== undefined && req.body[f] !== null) {
            req.body[f] = req.body[f] === 'true' || req.body[f] === true || req.body[f] === 1 || req.body[f] === '1';
        } else {
            req.body[f] = false; // Default to false if missing
        }
    });
    
    // 2. Convert empty strings to null for numeric fields to make Joi and MySQL happy
    const numFields = ['price', 'original_price', 'rating', 'review_count', 'stock_quantity', 'weight_kg', 'width_cm', 'length_cm', 'height_cm', 'installation_fee'];
    numFields.forEach(f => {
        if (req.body[f] === '') {
            req.body[f] = null;
        } else if (typeof req.body[f] === 'string') {
            // Remove non-numeric characters for price fields
            req.body[f] = Number(req.body[f].replace(/[^\d.-]/g, ''));
        }
    });

    const { error, value } = productSchema.validate(req.body);
    if (error) {
        console.error('Validation Error on Product Save:', error.details[0].message, 'Received:', req.body);
        return res.status(400).json({ success: false, error: 'Validation Error: ' + error.details[0].message });
    }
    req.body = value;
    next();
};


router.get('/', async (req, res) => {
    try {
        const { category, admin, search } = req.query;
        let query = 'SELECT id, name, sku, category, categories, price, original_price, size, image_url, images, is_active, is_out_of_stock, slug, rating, review_count, sort_order, stock_quantity, sale_end_date, created_at, card_features, has_installation_fee, free_install_bkk, free_shipping_bkk, installation_fee, requires_foundation, compare_enabled, badge_bestseller, badge_free_shipping, badge_warranty, badge_installation, badge_new, badge_recommended, badges FROM products';
        let params = [];
        let isAdminVerified = false;
        let conditions = [];

        if (category && category !== 'all') {
            conditions.push('(category = ? OR JSON_CONTAINS(categories, ?))');
            params.push(category, `"${category}"`);
        }

        if (search && search.trim()) {
            conditions.push('name LIKE ?');
            params.push(`%${search.trim()}%`);
        }

        // Hide inactive products from public users
        // Only allow showing inactive products if admin token is valid
        if (admin === 'true') {
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                try {
                    const { JWT_SECRET } = require('./auth');
                    const jwt = require('jsonwebtoken');
                    jwt.verify(token, JWT_SECRET);
                    isAdminVerified = true;
                } catch (e) { /* invalid token, treat as public */ }
            }
        }
        if (!isAdminVerified) {
            conditions.push('is_active = true');
            conditions.push(`NOT EXISTS (
                SELECT 1 FROM categories c 
                WHERE c.is_active = false 
                  AND (products.category = c.name OR (products.categories IS NOT NULL AND JSON_CONTAINS(products.categories, JSON_QUOTE(c.name))))
            )`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Sort by sort_order ascending, then by ID descending
        query += ' ORDER BY sort_order ASC, id DESC';

        const [rows] = await db.query(query, params);

        // MySQL DECIMAL columns return as strings — parse to proper numbers
        const parsed = rows.map(r => ({
            ...r,
            price: r.price != null ? Number(r.price) : 0,
            original_price: r.original_price != null ? Number(r.original_price) : null,
            rating: r.rating != null ? Number(r.rating) : 5.0,
            review_count: r.review_count != null ? Number(r.review_count) : 0,
            stock_quantity: r.stock_quantity != null ? Number(r.stock_quantity) : null,
            installation_fee: r.installation_fee != null ? Number(r.installation_fee) : null,
            card_features: (() => { try { return typeof r.card_features === 'string' ? JSON.parse(r.card_features) : r.card_features; } catch { return null; } })(),
            categories: (() => { try { return typeof r.categories === 'string' ? JSON.parse(r.categories) : (r.categories || []); } catch { return []; } })(),
            compare_enabled: r.compare_enabled !== 0 && r.compare_enabled !== false,
            badge_bestseller: r.badge_bestseller === 1 || r.badge_bestseller === true || r.badge_bestseller === 'true',
            badge_free_shipping: r.badge_free_shipping === 1 || r.badge_free_shipping === true || r.badge_free_shipping === 'true',
            badge_warranty: r.badge_warranty === 1 || r.badge_warranty === true || r.badge_warranty === 'true',
            badge_installation: r.badge_installation === 1 || r.badge_installation === true || r.badge_installation === 'true',
            badge_new: r.badge_new === 1 || r.badge_new === true || r.badge_new === 'true',
            badge_recommended: r.badge_recommended === 1 || r.badge_recommended === true || r.badge_recommended === 'true',
            badges: (() => { try { return typeof r.badges === 'string' ? JSON.parse(r.badges) : (r.badges || []); } catch { return []; } })()
        }));

        res.status(200).json({ success: true, data: parsed });
    } catch (error) {
        console.error('Fetch products error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let isAdminVerified = false;
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const { JWT_SECRET } = require('./auth');
                const jwt = require('jsonwebtoken');
                jwt.verify(token, JWT_SECRET);
                isAdminVerified = true;
            } catch (e) { /* invalid token, treat as public */ }
        }

        let rows;
        if (isAdminVerified) {
            [rows] = await db.query('SELECT * FROM products WHERE id = ? OR slug = ?', [id, id]);
        } else {
            [rows] = await db.query(`
                SELECT p.* FROM products p
                WHERE (p.id = ? OR p.slug = ?)
                  AND p.is_active = true
                  AND NOT EXISTS (
                      SELECT 1 FROM categories c
                      WHERE c.is_active = false
                        AND (p.category = c.name OR (p.categories IS NOT NULL AND JSON_CONTAINS(p.categories, JSON_QUOTE(c.name))))
                  )
            `, [id, id]);
        }

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // MySQL DECIMAL columns return as strings — parse to proper numbers
        const product = { ...rows[0] };
        product.price = product.price != null ? Number(product.price) : 0;
        product.original_price = product.original_price != null ? Number(product.original_price) : null;
        product.rating = product.rating != null ? Number(product.rating) : 5.0;
        product.review_count = product.review_count != null ? Number(product.review_count) : 0;
        product.stock_quantity = product.stock_quantity != null ? Number(product.stock_quantity) : null;
        product.installation_fee = product.installation_fee != null ? Number(product.installation_fee) : null;
        product.weight_kg = product.weight_kg != null ? Number(product.weight_kg) : null;
        product.width_cm = product.width_cm != null ? Number(product.width_cm) : null;
        product.length_cm = product.length_cm != null ? Number(product.length_cm) : null;
        product.height_cm = product.height_cm != null ? Number(product.height_cm) : null;
        if (typeof product.card_features === 'string') {
            try { product.card_features = JSON.parse(product.card_features); } catch (e) { product.card_features = null; }
        }
        if (typeof product.categories === 'string') {
            try { product.categories = JSON.parse(product.categories); } catch (e) { product.categories = []; }
        } else if (!product.categories) {
            product.categories = [];
        }
        if (typeof product.badges === 'string') {
            try { product.badges = JSON.parse(product.badges); } catch (e) { product.badges = []; }
        } else if (!product.badges) {
            product.badges = [];
        }

        // Fetch related products data if IDs exist
        product.related_products_data = [];
        let relatedProductIds = [];
        if (typeof product.related_products === 'string') {
            try { relatedProductIds = JSON.parse(product.related_products); } catch (e) { relatedProductIds = []; }
        } else if (Array.isArray(product.related_products)) {
            relatedProductIds = product.related_products;
        }

        if (Array.isArray(relatedProductIds) && relatedProductIds.length > 0) {
            try {
                // Filter out non-numbers
                const ids = relatedProductIds.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id));
                if (ids.length > 0) {
                    const placeholders = ids.map(() => '?').join(',');
                    const [relatedRows] = await db.query(
                        `SELECT id, name, slug, image_url, price, original_price, is_out_of_stock, rating, review_count 
                         FROM products WHERE id IN (${placeholders}) AND is_active = 1
                           AND NOT EXISTS (
                               SELECT 1 FROM categories c
                               WHERE c.is_active = false
                                 AND (category = c.name OR (categories IS NOT NULL AND JSON_CONTAINS(categories, JSON_QUOTE(c.name))))
                           )`, 
                        ids
                    );
                    
                    // Format correctly for frontend
                    product.related_products_data = relatedRows.map(rp => ({
                        ...rp,
                        title: rp.name,
                        image: rp.image_url || 'https://via.placeholder.com/400x300?text=No+Image',
                        price: rp.price != null ? Number(rp.price) : 0,
                        original_price: rp.original_price != null ? Number(rp.original_price) : null,
                        rating: rp.rating != null ? Number(rp.rating) : 5.0,
                        reviews: rp.review_count != null ? Number(rp.review_count) : 0
                    }));
                }
            } catch (e) {
                console.error('Error fetching related products data:', e);
            }
        }

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        console.error('Fetch product detail error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch product detail' });
    }
});

// --- Admin Routes ---

// Create Product
router.post('/', verifyAdmin, validateProduct, async (req, res) => {
    try {
        const {
            name, sku, category, price, original_price, size, image_url,
            description, images, is_active, is_out_of_stock,
            seo_title, seo_description, seo_keywords,
            shopee_link, lazada_link, tiktok_link, short_description, remarks,
            slug, image_alt, attributes, faq, related_products,
            badge_free_shipping, badge_warranty, badge_installation,
            badge_new, badge_bestseller, badge_recommended,
            badges, limit_one_per_order, rating, review_count,
            stock_quantity, sale_end_date, weight_kg, width_cm, length_cm, height_cm,
            card_features, has_installation_fee, free_install_bkk, free_shipping_bkk, installation_fee, requires_foundation,
            compare_enabled, categories
        } = req.body;

        const id = require('crypto').randomUUID();

        // Generate slug if not provided
        let finalSlug = slug;
        if (!finalSlug && name) {
            const baseSlug = String(name).toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-ก-๙]+/g, '')
                .replace(/\u0e4d/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
            finalSlug = baseSlug || `product-${id.substring(0, 8)}`;
        } else if (!finalSlug) {
            finalSlug = `product-${id.substring(0, 8)}`;
        }

        // Check if slug exists in creation
        if (finalSlug) {
            let counter = 1;
            let isUnique = false;
            let currentSlug = finalSlug;
            while (!isUnique) {
                const [existing] = await db.query('SELECT id FROM products WHERE slug = ?', [currentSlug]);
                if (existing.length === 0) {
                    isUnique = true;
                    finalSlug = currentSlug;
                } else {
                    currentSlug = `${finalSlug}-${counter}`;
                    counter++;
                }
            }
        }

        const query = `
            INSERT INTO products
            (id, name, sku, category, categories, price, original_price, size, image_url, description, images, is_active, is_out_of_stock, seo_title, seo_description, seo_keywords, shopee_link, lazada_link, tiktok_link, llm_context, short_description, remarks, slug, image_alt, attributes, faq, related_products,
             badge_free_shipping, badge_warranty, badge_installation, badge_new, badge_bestseller, badge_recommended, badges, limit_one_per_order, rating, review_count, stock_quantity, sale_end_date, weight_kg, width_cm, length_cm, height_cm, card_features, has_installation_fee, free_install_bkk, free_shipping_bkk, installation_fee, requires_foundation, compare_enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Prepare categories array
        let finalCategories = [];
        if (Array.isArray(categories) && categories.length > 0) {
            finalCategories = categories;
        } else if (category) {
            finalCategories = [category];
        }
        const finalCategory = finalCategories.length > 0 ? finalCategories[0] : '';
        
        const params = [
            id, name || '', sku || '', finalCategory, JSON.stringify(finalCategories), price === '' ? 0 : price || 0, original_price === '' ? null : original_price || null, size || '', image_url || '',
            description || '', JSON.stringify(images || []), is_active !== undefined ? is_active : true, is_out_of_stock || false,
            seo_title || '', seo_description || '', seo_keywords || '',
            shopee_link || '', lazada_link || '', tiktok_link || '', req.body.llm_context || '',
            short_description || '', remarks || '',
            finalSlug || '', image_alt || '', JSON.stringify(attributes || []), JSON.stringify(faq || []), JSON.stringify(related_products || []),
            badge_free_shipping || false, badge_warranty || false, badge_installation || false,
            badge_new || false, badge_bestseller || false, badge_recommended || false,
            JSON.stringify(badges || []), limit_one_per_order || false, rating || 5.0, review_count || 0,
            (stock_quantity === '' || stock_quantity === undefined) ? null : stock_quantity,
            (sale_end_date === '' || sale_end_date === undefined) ? null : sale_end_date,
            (weight_kg === '' || weight_kg === undefined) ? null : weight_kg,
            (width_cm === '' || width_cm === undefined) ? null : width_cm,
            (length_cm === '' || length_cm === undefined) ? null : length_cm,
            (height_cm === '' || height_cm === undefined) ? null : height_cm,
            card_features ? JSON.stringify(card_features) : null,
            has_installation_fee || false,
            free_install_bkk || false,
            free_shipping_bkk || false,
            (installation_fee === '' || installation_fee === undefined) ? null : installation_fee,
            requires_foundation !== false, // Default to true if not explicitly false
            compare_enabled !== false // Default to true if not explicitly false
        ];



        const [result] = await db.query(query, params);
        res.status(201).json({ success: true, id: id });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, error: 'Failed to create product: ' + error.message });
    }
});

// Update Product Sort Orders (Bulk)
router.put('/reorder', verifyAdmin, async (req, res) => {
    try {
        const { orderedIds } = req.body;
        if (!orderedIds || !Array.isArray(orderedIds)) {
            return res.status(400).json({ success: false, error: 'orderedIds array is required' });
        }

        for (let i = 0; i < orderedIds.length; i++) {
            const id = orderedIds[i];
            await db.query('UPDATE products SET sort_order = ? WHERE id = ?', [i, id]);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Reorder products error:', error);
        res.status(500).json({ success: false, error: 'Failed to reorder products: ' + error.message });
    }
});

// Update Product
router.put('/:id', verifyAdmin, validateProduct, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, sku, category, price, original_price, size, image_url,
            description, images, is_active, is_out_of_stock,
            seo_title, seo_description, seo_keywords,
            shopee_link, lazada_link, tiktok_link,
            short_description, remarks,
            slug, image_alt, attributes, faq, related_products,
            badge_free_shipping, badge_warranty, badge_installation,
            badge_new, badge_bestseller, badge_recommended,
            badges, limit_one_per_order, rating, review_count,
            stock_quantity, sale_end_date, weight_kg, width_cm, length_cm, height_cm,
            card_features, has_installation_fee, free_install_bkk, free_shipping_bkk, installation_fee, requires_foundation,
            compare_enabled, categories
        } = req.body;

        // Generate slug if not provided
        let finalSlug = slug;
        if (!finalSlug && name) {
            const baseSlug = name.toString().toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-ก-๙]+/g, '')
                .replace(/\u0e4d/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');
            finalSlug = baseSlug || `product-${id.substring(0, 8)}`;
        }

        // Check if slug exists in update
        if (finalSlug) {
            let counter = 1;
            let isUnique = false;
            let currentSlug = finalSlug;
            while (!isUnique) {
                const [existing] = await db.query('SELECT id FROM products WHERE slug = ? AND id != ?', [currentSlug, id]);
                if (existing.length === 0) {
                    isUnique = true;
                    finalSlug = currentSlug;
                } else {
                    currentSlug = `${finalSlug}-${counter}`;
                    counter++;
                }
            }
        }

        const query = `
            UPDATE products SET 
            name = ?, sku = ?, category = ?, categories = ?, price = ?, original_price = ?, size = ?, image_url = ?, 
            description = ?, images = ?, is_active = ?, is_out_of_stock = ?, 
            seo_title = ?, seo_description = ?, seo_keywords = ?, 
            shopee_link = ?, lazada_link = ?, tiktok_link = ?, llm_context = ?,
            short_description = ?, remarks = ?,
            slug = ?, image_alt = ?, attributes = ?, faq = ?, related_products = ?,
            badge_free_shipping = ?, badge_warranty = ?, badge_installation = ?,
            badge_new = ?, badge_bestseller = ?, badge_recommended = ?,
            badges = ?, limit_one_per_order = ?, rating = ?, review_count = ?,
            stock_quantity = ?, sale_end_date = ?, weight_kg = ?, width_cm = ?, length_cm = ?, height_cm = ?, card_features = ?, has_installation_fee = ?, free_install_bkk = ?, free_shipping_bkk = ?, installation_fee = ?, requires_foundation = ?, compare_enabled = ?
            WHERE id = ?
        `;
        
        // Prepare categories array
        let finalCategories = [];
        if (Array.isArray(categories) && categories.length > 0) {
            finalCategories = categories;
        } else if (category) {
            finalCategories = [category];
        }
        const finalCategory = finalCategories.length > 0 ? finalCategories[0] : '';
        
        const params = [
            name, sku || '', finalCategory, JSON.stringify(finalCategories), price === '' ? 0 : price, original_price === '' ? null : original_price || null, size, image_url,
            description || '', JSON.stringify(images || []), is_active !== undefined ? is_active : true, is_out_of_stock || false,
            seo_title || '', seo_description || '', seo_keywords || '',
            shopee_link || '', lazada_link || '', tiktok_link || '', req.body.llm_context || '',
            short_description || '', remarks || '',
            finalSlug || '', image_alt || '', JSON.stringify(attributes || []), JSON.stringify(faq || []), JSON.stringify(related_products || []),
            badge_free_shipping || false, badge_warranty || false, badge_installation || false,
            badge_new || false, badge_bestseller || false, badge_recommended || false,
            JSON.stringify(badges || []), limit_one_per_order || false, rating || 5.0, review_count || 0,
            (stock_quantity === '' || stock_quantity === undefined) ? null : stock_quantity,
            (sale_end_date === '' || sale_end_date === undefined) ? null : sale_end_date,
            (weight_kg === '' || weight_kg === undefined) ? null : weight_kg,
            (width_cm === '' || width_cm === undefined) ? null : width_cm,
            (length_cm === '' || length_cm === undefined) ? null : length_cm,
            (height_cm === '' || height_cm === undefined) ? null : height_cm,
            card_features ? JSON.stringify(card_features) : null,
            has_installation_fee || false,
            free_install_bkk || false,
            free_shipping_bkk || false,
            (installation_fee === '' || installation_fee === undefined) ? null : installation_fee,
            requires_foundation !== false,
            compare_enabled !== false,
            id
        ];

        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ success: false, error: 'Failed to update product: ' + error.message });
    }
});

// Delete Product
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete product' });
    }
});

module.exports = router;
