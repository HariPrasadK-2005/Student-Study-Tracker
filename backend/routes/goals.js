const express = require('express');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Get goals
router.get('/', (req, res) => {
    const sql = `
        SELECT g.*, s.name as subject_name
        FROM goals g
        LEFT JOIN subjects s ON g.subject_id = s.id
        WHERE g.user_id = ?
        ORDER BY g.week_start DESC
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(results);
    });
});

// Add goal
router.post('/', (req, res) => {
    const { subject_id, target_hours, week_start } = req.body;
    if (!target_hours || !week_start) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const sql = 'INSERT INTO goals (user_id, subject_id, target_hours, week_start) VALUES (?, ?, ?, ?)';
    db.query(sql, [req.user.id, subject_id || null, target_hours, week_start], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.status(201).json({ message: '✅ Goal added!', id: result.insertId });
    });
});

module.exports = router;
