const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin } = require('./auth');

// ── Auto-migrate: ensure slug column exists ──
const initTable = async () => {
    try {
        await db.query(`ALTER TABLE projects ADD COLUMN slug VARCHAR(500) UNIQUE`);
        console.log('projects: slug column added');
    } catch (e) { /* Column already exists */ }

    // Back-fill slugs for existing rows that don't have one
    try {
        const [rows] = await db.query(`SELECT id, title FROM projects WHERE slug IS NULL OR slug = ''`);
        for (const row of rows) {
            const slug = await generateUniqueSlug(row.title, row.id);
            await db.query(`UPDATE projects SET slug = ? WHERE id = ?`, [slug, row.id]);
        }
        if (rows.length) console.log(`projects: back-filled ${rows.length} slugs`);
    } catch (e) {
        console.error('projects slug back-fill error:', e.message);
    }
};
initTable();

// ── Helper: generate URL-safe slug (supports Thai + English) ──
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 200);
};

// ── Helper: ensure slug is unique (append -2, -3 … if needed) ──
const generateUniqueSlug = async (title, excludeId = null) => {
    const base = generateSlug(title) || `project-${Date.now()}`;
    let slug = base;
    let counter = 2;
    while (true) {
        const query = excludeId
            ? `SELECT id FROM projects WHERE slug = ? AND id != ? LIMIT 1`
            : `SELECT id FROM projects WHERE slug = ? LIMIT 1`;
        const params = excludeId ? [slug, excludeId] : [slug];
        const [rows] = await db.query(query, params);
        if (rows.length === 0) break;
        slug = `${base}-${counter++}`;
    }
    return slug;
};

// ── Helper: parse a param — numeric = ID lookup, otherwise = slug lookup ──
const buildLookup = (param) => {
    if (/^\d+$/.test(param)) {
        return { column: 'id', value: Number(param) };
    }
    return { column: 'slug', value: param };
};

// ── GET all projects (Admin) ──
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
        const projects = rows.map(row => ({
            ...row,
            gallery_images: typeof row.gallery_images === 'string'
                ? JSON.parse(row.gallery_images || '[]')
                : (row.gallery_images || [])
        }));
        res.status(200).json({ success: true, data: projects });
    } catch (error) {
        console.error('Fetch projects error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch projects' });
    }
});

// ── GET published projects (Public) ──
router.get('/published', async (req, res) => {
    try {
        let queryStr = `
            SELECT p.*, prod.name AS product_name, prod.sku AS product_sku
            FROM projects p
            LEFT JOIN products prod ON p.product_id = prod.id
            WHERE p.is_published = 1
            ORDER BY p.created_at DESC
        `;
        const queryParams = [];
        if (req.query.limit) {
            const limitVal = parseInt(req.query.limit, 10);
            if (!isNaN(limitVal)) {
                queryStr += ` LIMIT ?`;
                queryParams.push(limitVal);
            }
        }
        const [rows] = await db.query(queryStr, queryParams);
        const projects = rows.map(row => ({
            ...row,
            gallery_images: typeof row.gallery_images === 'string'
                ? JSON.parse(row.gallery_images || '[]')
                : (row.gallery_images || [])
        }));
        res.status(200).json({ success: true, data: projects });
    } catch (error) {
        console.error('Fetch published projects error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch published projects' });
    }
});

// ── GET single project by ID or Slug ──
router.get('/:id', async (req, res) => {
    try {
        const { column, value } = buildLookup(req.params.id);
        const [rows] = await db.query(
            `SELECT * FROM projects WHERE ${column} = ? LIMIT 1`,
            [value]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const project = {
            ...rows[0],
            gallery_images: typeof rows[0].gallery_images === 'string'
                ? JSON.parse(rows[0].gallery_images || '[]')
                : (rows[0].gallery_images || [])
        };

        // Fetch linked product if exists
        if (project.product_id) {
            const [prodRows] = await db.query(
                'SELECT * FROM products WHERE id = ? LIMIT 1',
                [project.product_id]
            );
            if (prodRows.length > 0) {
                const product = prodRows[0];
                product.images = product.images && typeof product.images === 'string'
                    ? JSON.parse(product.images)
                    : [];
                product.price = product.price != null ? Number(product.price) : 0;
                product.original_price = product.original_price != null ? Number(product.original_price) : null;
                project.product = product;
            }
        }

        res.status(200).json({ success: true, data: project });
    } catch (error) {
        console.error('Fetch project error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch project details' });
    }
});

// ── POST new project (Admin Only) ──
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const {
            title, description, client_name, location, cover_image,
            gallery_images, content_rich, is_published, product_id,
            service_date, badge_size, badge_tag
        } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const galleryJson = typeof gallery_images === 'string'
            ? gallery_images
            : JSON.stringify(gallery_images || []);

        let formattedServiceDate = service_date || null;
        if (formattedServiceDate && formattedServiceDate.includes('T')) {
            formattedServiceDate = formattedServiceDate.split('T')[0];
        }

        // Auto-generate slug
        const slug = await generateUniqueSlug(title);

        const [result] = await db.query(`
            INSERT INTO projects
                (title, slug, description, client_name, location, cover_image,
                 gallery_images, content_rich, is_published, product_id,
                 service_date, badge_size, badge_tag)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title, slug,
            description || '',
            client_name || '',
            location || '',
            cover_image || '',
            galleryJson,
            content_rich || '',
            is_published !== undefined ? is_published : true,
            product_id || null,
            formattedServiceDate,
            badge_size || '',
            badge_tag || ''
        ]);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            id: result.insertId,
            slug
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ success: false, error: 'Failed to create project' });
    }
});

// ── PUT update project (Admin Only) ──
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const {
            title, description, client_name, location, cover_image,
            gallery_images, content_rich, is_published, product_id,
            service_date, badge_size, badge_tag, slug: customSlug
        } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        const galleryJson = typeof gallery_images === 'string'
            ? gallery_images
            : JSON.stringify(gallery_images || []);

        let formattedServiceDate = service_date || null;
        if (formattedServiceDate && formattedServiceDate.includes('T')) {
            formattedServiceDate = formattedServiceDate.split('T')[0];
        }

        // Re-generate slug (or use custom one if provided)
        const slug = customSlug
            ? await generateUniqueSlug(customSlug, req.params.id)
            : await generateUniqueSlug(title, req.params.id);

        const [result] = await db.query(`
            UPDATE projects
            SET title = ?, slug = ?, description = ?, client_name = ?, location = ?,
                cover_image = ?, gallery_images = ?, content_rich = ?, is_published = ?,
                product_id = ?, service_date = ?, badge_size = ?, badge_tag = ?
            WHERE id = ?
        `, [
            title, slug,
            description || '',
            client_name || '',
            location || '',
            cover_image || '',
            galleryJson,
            content_rich || '',
            is_published !== undefined ? is_published : true,
            product_id || null,
            formattedServiceDate,
            badge_size || '',
            badge_tag || '',
            req.params.id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        res.status(200).json({ success: true, message: 'Project updated successfully', slug });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ success: false, error: 'Failed to update project: ' + error.message });
    }
});

// ── DELETE project (Admin Only) ──
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }
        res.status(200).json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete project' });
    }
});

module.exports = router;
