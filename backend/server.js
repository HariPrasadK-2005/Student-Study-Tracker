// =============================================
// STUDENT STUDY TRACKER — BACKEND SERVER
// =============================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Routes
const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const logRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors());
app.use(express.json());

// =============================================
// TEST ROUTE
// =============================================
app.get('/', (req, res) => {
    res.json({ message: '🎓 Student Study Tracker API is running!', status: 'success' });
});

app.get('/api/setup-db', (req, res) => {
    const db = require('./config/db');
    const q1 = `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
    const q2 = `CREATE TABLE IF NOT EXISTS subjects (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(255) NOT NULL, color VARCHAR(50) DEFAULT '#4F46E5', start_date DATE, end_date DATE, daily_goal DECIMAL(5,2) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`;
    const q3 = `CREATE TABLE IF NOT EXISTS study_logs (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, subject_id INT NOT NULL, date DATE NOT NULL, duration DECIMAL(5,2) NOT NULL, notes TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE)`;

    db.query(q1, (err) => {
        if(err) return res.send('Error 1: ' + err.message);
        db.query(q2, (err) => {
            if(err) return res.send('Error 2: ' + err.message);
            db.query(q3, (err) => {
                if(err) return res.send('Error 3: ' + err.message);
                res.send('<h1 style="color:green; font-family:sans-serif; text-align:center; margin-top:50px;">✅ Database Setup Complete! Refresh your frontend app and register a new user!</h1>');
            });
        });
    });
});

// =============================================
// API ROUTES
// =============================================
app.use('/api', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/logs', logRoutes);

// =============================================
// GLOBAL ERROR HANDLER
// =============================================
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
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
