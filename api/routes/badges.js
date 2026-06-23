const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin } = require('./auth');

// GET - List all badges (public)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM product_badges ORDER BY sort_order ASC, created_at ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('List badges error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch badges' });
    }
});

// POST - Create badge (admin)
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { name, icon, color } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'กรุณาระบุชื่อป้ายกำกับ' });
        }

        const id = require('crypto').randomUUID();
        const [maxOrder] = await db.query('SELECT MAX(sort_order) as maxSort FROM product_badges');
        const sortOrder = (maxOrder[0].maxSort || 0) + 1;

        await db.execute(
            'INSERT INTO product_badges (id, name, icon, color, is_system, sort_order) VALUES (?, ?, ?, ?, false, ?)',
            [id, name.trim(), icon || 'tag', color || 'gray', sortOrder]
        );

        res.status(201).json({ success: true, id });
    } catch (error) {
        console.error('Create badge error:', error);
        res.status(500).json({ success: false, error: 'Failed to create badge' });
    }
});

// PUT - Update badge (admin, non-system only)
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, color } = req.body;

        // Check if system badge
        const [badge] = await db.query('SELECT is_system FROM product_badges WHERE id = ?', [id]);
        if (badge.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบป้ายกำกับนี้' });
        if (badge[0].is_system) return res.status(403).json({ success: false, error: 'ไม่สามารถแก้ไขป้ายกำกับเริ่มต้นได้' });

        await db.execute(
            'UPDATE product_badges SET name = ?, icon = ?, color = ? WHERE id = ? AND is_system = false',
            [name?.trim() || '', icon || 'tag', color || 'gray', id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Update badge error:', error);
        res.status(500).json({ success: false, error: 'Failed to update badge' });
    }
});

// DELETE - Delete badge (admin, non-system only)
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [badge] = await db.query('SELECT is_system FROM product_badges WHERE id = ?', [id]);
        if (badge.length === 0) return res.status(404).json({ success: false, error: 'ไม่พบป้ายกำกับนี้' });
        if (badge[0].is_system) return res.status(403).json({ success: false, error: 'ไม่สามารถลบป้ายกำกับเริ่มต้นได้' });

        await db.execute('DELETE FROM product_badges WHERE id = ? AND is_system = false', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Delete badge error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete badge' });
    }
});

module.exports = router;
