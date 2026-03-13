const express = require('express');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Get all study logs
router.get('/', (req, res) => {
    const sql = `
        SELECT sl.*, s.name as subject_name, s.color
        FROM study_logs sl
        JOIN subjects s ON sl.subject_id = s.id
        WHERE sl.user_id = ?
        ORDER BY sl.date DESC
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error('Error fetching logs:', err);
            return res.status(500).json({ message: 'Database error occurred' });
        }
        res.json(results);
    });
});

// Add study log
router.post('/', (req, res) => {
    const { subject_id, date, duration, notes } = req.body;
    if (!subject_id || !date || !duration) {
        return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const sql = 'INSERT INTO study_logs (user_id, subject_id, date, duration, notes) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [req.user.id, subject_id, date, duration, notes || null], (err, result) => {
        if (err) {
            console.error('Error adding log:', err);
            return res.status(500).json({ message: 'Database error occurred' });
        }
        res.status(201).json({ message: '✅ Study log added!', id: result.insertId });
    });
});

// Delete study log
router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM study_logs WHERE id = ? AND user_id = ?';
    db.query(sql, [req.params.id, req.user.id], (err) => {
        if (err) {
            console.error('Error deleting log:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json({ message: '✅ Study log deleted!' });
    });
});

module.exports = router;
