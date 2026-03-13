const express = require('express');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Get todos
router.get('/', (req, res) => {
    const sql = `
        SELECT t.*, s.name as subject_name
        FROM todos t
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE t.user_id = ?
        ORDER BY t.created_at DESC
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(results);
    });
});

// Add todo
router.post('/', (req, res) => {
    const { title, subject_id, due_date } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const sql = 'INSERT INTO todos (user_id, subject_id, title, due_date) VALUES (?, ?, ?, ?)';
    db.query(sql, [req.user.id, subject_id || null, title, due_date || null], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.status(201).json({ message: '✅ Todo added!', id: result.insertId });
    });
});

// Mark todo as done / undone
router.patch('/:id', (req, res) => {
    const { is_done } = req.body;
    const sql = 'UPDATE todos SET is_done = ? WHERE id = ? AND user_id = ?';
    db.query(sql, [is_done, req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: '✅ Todo updated!' });
    });
});

// Delete todo
router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM todos WHERE id = ? AND user_id = ?';
    db.query(sql, [req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: '✅ Todo deleted!' });
    });
});

module.exports = router;
