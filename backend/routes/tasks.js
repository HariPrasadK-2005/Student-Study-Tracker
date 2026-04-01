const express = require('express');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);

// 1. Get all tasks
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC';
    db.query(sql, [req.user.id], (err, results) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            return res.status(500).json({ message: 'Database error occurred' });
        }
        res.json(results);
    });
});

// 2. Create a new task
router.post('/', (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Task title is required' });
    }

    const sql = "INSERT INTO tasks (user_id, title, status) VALUES (?, ?, 'todo')";
    db.query(sql, [req.user.id, title], (err, result) => {
        if (err) {
            console.error('Error creating task:', err);
            return res.status(500).json({ message: 'Database error occurred' });
        }
        res.status(201).json({ message: '✅ Task created!', id: result.insertId, status: 'todo' });
    });
});

// 3. Update task status (for drag and drop)
router.put('/:id', (req, res) => {
    const { status } = req.body;
    
    if (!['todo', 'inprogress', 'done'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    const sql = 'UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?';
    db.query(sql, [status, req.params.id, req.user.id], (err, result) => {
        if (err) {
            console.error('Error updating task status:', err);
            return res.status(500).json({ message: 'Database error occurred' });
        }
        // Verify it affected a row (meaning task belongs to user)
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found or access denied' });
        }
        res.json({ message: '✅ Task status updated!' });
    });
});

// 4. Delete a task
router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
    db.query(sql, [req.params.id, req.user.id], (err, result) => {
        if (err) {
            console.error('Error deleting task:', err);
            return res.status(500).json({ message: 'Database error occurred' });
        }
        res.json({ message: '✅ Task deleted!' });
    });
});

module.exports = router;
