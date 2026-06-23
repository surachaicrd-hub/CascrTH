const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin } = require('./auth');

// Get all categories
router.get('/', async (req, res) => {
    try {
        let isAdmin = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
                try {
                    const { JWT_SECRET } = require('./auth');
                    const jwt = require('jsonwebtoken');
                    jwt.verify(token, JWT_SECRET);
                    isAdmin = true;
                } catch (e) {
                    // Invalid token, treat as public
                }
            }
        }

        let query = 'SELECT * FROM categories';
        if (!isAdmin) {
            query += ' WHERE is_active = true OR is_active IS NULL';
        }
        query += ' ORDER BY sort_order ASC, id DESC';

        const [rows] = await db.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch categories' });
    }
});

// Get single category
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (id === 'reorder') return; // skip

        let isAdmin = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
                try {
                    const { JWT_SECRET } = require('./auth');
                    const jwt = require('jsonwebtoken');
                    jwt.verify(token, JWT_SECRET);
                    isAdmin = true;
                } catch (e) {
                    // Invalid token, treat as public
                }
            }
        }

        let query = 'SELECT * FROM categories WHERE id = ?';
        const params = [id];
        if (!isAdmin) {
            query += ' AND (is_active = true OR is_active IS NULL)';
        }

        const [rows] = await db.query(query, params);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }
        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch category' });
    }
});

// Reorder categories
router.put('/reorder', verifyAdmin, async (req, res) => {
    try {
        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ success: false, error: 'Invalid data format' });
        }

        // Update each category sort_order
        for (let i = 0; i < orderedIds.length; i++) {
            await db.query('UPDATE categories SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
        }
        res.status(200).json({ success: true, message: 'Categories reordered' });
    } catch (error) {
        console.error('Error reordering categories:', error);
        res.status(500).json({ success: false, error: 'Failed to reorder categories' });
    }
});

// Create new category
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { name, description, image_url, icon_url, features, is_active } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Category name is required' });

        const id = require('crypto').randomUUID();
        const featuresJson = features ? JSON.stringify(features) : null;
        const isActiveVal = (is_active === false || is_active === 0 || is_active === 'false') ? 0 : 1;
        await db.query(
            'INSERT INTO categories (id, name, description, image_url, icon_url, features, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, description || null, image_url || null, icon_url || null, featuresJson, isActiveVal]
        );
        res.status(201).json({ success: true, data: { id, name, description, image_url, icon_url, features, is_active: isActiveVal === 1 } });
    } catch (error) {
        console.error('Error creating category:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'Category already exists' });
        }
        res.status(500).json({ success: false, error: 'Failed to create category' });
    }
});

// Update category
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image_url, icon_url, features, is_active } = req.body;

        // Ensure /reorder is not caught here
        if (id === 'reorder') return;

        if (!name) return res.status(400).json({ success: false, error: 'Category name is required' });

        const featuresJson = features ? JSON.stringify(features) : null;
        const isActiveVal = (is_active === false || is_active === 0 || is_active === 'false') ? 0 : 1;
        await db.query(
            'UPDATE categories SET name = ?, description = ?, image_url = ?, icon_url = ?, features = ?, is_active = ? WHERE id = ?',
            [name, description || null, image_url || null, icon_url || null, featuresJson, isActiveVal, id]
        );
        res.status(200).json({ success: true, data: { id, name, description, image_url, icon_url, features, is_active: isActiveVal === 1 } });
    } catch (error) {
        console.error('Error updating category:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'Category already exists' });
        }
        res.status(500).json({ success: false, error: 'Failed to update category' });
    }
});

// Delete category
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, error: 'Failed to delete category' });
    }
});

module.exports = router;
