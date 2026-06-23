const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyAdmin } = require('./auth');

// Get all messages
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const [messages] = await db.query(
            'SELECT * FROM contact_submissions ORDER BY created_at DESC'
        );
        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error('Fetch contact messages error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
});

// Mark message as read
router.patch('/:id/read', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_read } = req.body;

        await db.execute(
            'UPDATE contact_submissions SET is_read = ? WHERE id = ?',
            [is_read ? 1 : 0, id]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Update message status error:', error);
        res.status(500).json({ success: false, error: 'Failed to update status' });
    }
});

// Delete message
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM contact_submissions WHERE id = ?', [id]);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete message' });
    }
});

module.exports = router;
