// =============================================
// STUDENT STUDY TRACKER — BACKEND SERVER
// =============================================

const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const mysql      = require('mysql2');
const bcrypt     = require('bcrypt');
const jwt        = require('jsonwebtoken');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors());
app.use(express.json());

// =============================================
// DATABASE CONNECTION
// =============================================
const db = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Connected to MySQL database!');
    }
});

// =============================================
// AUTH MIDDLEWARE
// =============================================
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied. No token.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token.' });
        req.user = user;
        next();
    });
};

// =============================================
// TEST ROUTE
// =============================================
app.get('/', (req, res) => {
    res.json({ message: '🎓 Student Study Tracker API is running!', status: 'success' });
});

// =============================================
// AUTH ROUTES
// =============================================

// Register
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ message: 'Please fill in all fields' });

    if (password.length < 4)
        return res.status(400).json({ message: 'Password must be at least 4 characters' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY')
                    return res.status(409).json({ message: 'Email already registered' });
                return res.status(500).json({ message: 'Database error', error: err.message });
            }
            res.status(201).json({ message: '✅ User registered successfully!' });
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: 'Please fill in all fields' });

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0)
            return res.status(401).json({ message: 'Invalid email or password' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: '✅ Login successful!',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    });
});

// =============================================
// SUBJECTS ROUTES
// =============================================

// Get all subjects
app.get('/api/subjects', authenticateToken, (req, res) => {
    const sql = 'SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at DESC';
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(results);
    });
});

// Add subject
app.post('/api/subjects', authenticateToken, (req, res) => {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ message: 'Subject name is required' });

    const sql = 'INSERT INTO subjects (user_id, name, color) VALUES (?, ?, ?)';
    db.query(sql, [req.user.id, name, color || '#4F46E5'], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.status(201).json({ message: '✅ Subject added!', id: result.insertId });
    });
});

// Delete subject
app.delete('/api/subjects/:id', authenticateToken, (req, res) => {
    const sql = 'DELETE FROM subjects WHERE id = ? AND user_id = ?';
    db.query(sql, [req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: '✅ Subject deleted!' });
    });
});

// =============================================
// STUDY LOG ROUTES
// =============================================

// Get all study logs
app.get('/api/logs', authenticateToken, (req, res) => {
    const sql = `
        SELECT sl.*, s.name as subject_name, s.color
        FROM study_logs sl
        JOIN subjects s ON sl.subject_id = s.id
        WHERE sl.user_id = ?
        ORDER BY sl.date DESC
    `;
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json(results);
    });
});

// Add study log
app.post('/api/logs', authenticateToken, (req, res) => {
    const { subject_id, date, duration, notes } = req.body;
    if (!subject_id || !date || !duration)
        return res.status(400).json({ message: 'Please fill in all required fields' });

    const sql = 'INSERT INTO study_logs (user_id, subject_id, date, duration, notes) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [req.user.id, subject_id, date, duration, notes || null], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.status(201).json({ message: '✅ Study log added!', id: result.insertId });
    });
});

// Delete study log
app.delete('/api/logs/:id', authenticateToken, (req, res) => {
    const sql = 'DELETE FROM study_logs WHERE id = ? AND user_id = ?';
    db.query(sql, [req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: '✅ Study log deleted!' });
    });
});

// =============================================
// GOALS ROUTES
// =============================================

// Get goals
app.get('/api/goals', authenticateToken, (req, res) => {
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
app.post('/api/goals', authenticateToken, (req, res) => {
    const { subject_id, target_hours, week_start } = req.body;
    if (!target_hours || !week_start)
        return res.status(400).json({ message: 'Please fill in all required fields' });

    const sql = 'INSERT INTO goals (user_id, subject_id, target_hours, week_start) VALUES (?, ?, ?, ?)';
    db.query(sql, [req.user.id, subject_id || null, target_hours, week_start], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.status(201).json({ message: '✅ Goal added!', id: result.insertId });
    });
});

// =============================================
// TODO ROUTES
// =============================================

// Get todos
app.get('/api/todos', authenticateToken, (req, res) => {
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
app.post('/api/todos', authenticateToken, (req, res) => {
    const { title, subject_id, due_date } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const sql = 'INSERT INTO todos (user_id, subject_id, title, due_date) VALUES (?, ?, ?, ?)';
    db.query(sql, [req.user.id, subject_id || null, title, due_date || null], (err, result) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.status(201).json({ message: '✅ Todo added!', id: result.insertId });
    });
});

// Mark todo as done / undone
app.patch('/api/todos/:id', authenticateToken, (req, res) => {
    const { is_done } = req.body;
    const sql = 'UPDATE todos SET is_done = ? WHERE id = ? AND user_id = ?';
    db.query(sql, [is_done, req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: '✅ Todo updated!' });
    });
});

// Delete todo
app.delete('/api/todos/:id', authenticateToken, (req, res) => {
    const sql = 'DELETE FROM todos WHERE id = ? AND user_id = ?';
    db.query(sql, [req.params.id, req.user.id], (err) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        res.json({ message: '✅ Todo deleted!' });
    });
});

// =============================================
// START SERVER
// =============================================
app.listen(PORT, () => {
    console.log(`
====================================
🎓 Student Study Tracker Server
====================================
✅ Server running on port ${PORT}
🌐 URL: http://localhost:${PORT}
====================================
    `);
});
