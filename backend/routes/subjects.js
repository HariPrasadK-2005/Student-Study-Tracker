const express = require('express');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(authenticateToken);

// Get all subjects
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at DESC';
    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error('Error fetching subjects:', err);
            return res.status(500).json({ message: 'Database error occurred' });
        }
        res.json(results);
    });
});

// Add subject
router.post('/', (req, res) => {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Subject name is required' });

    const sql = 'INSERT INTO subjects (user_id, name, color) VALUES (?, ?, ?)';
    db.query(sql, [req.user.id, name, color || '#4F46E5'], (err, result) => {
        if (err) {
            console.error('Error adding subject:', err);
            return res.status(500).json({ message: 'Database error occurred' });
        }
        res.status(201).json({ message: '✅ Subject added!', id: result.insertId });
    });
});

// Delete subject
router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM subjects WHERE id = ? AND user_id = ?';
    db.query(sql, [req.params.id, req.user.id], (err) => {
        if (err) {
            console.error('Error deleting subject:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json({ message: '✅ Subject deleted!' });
    });
});

module.exports = router;
