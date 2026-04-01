// =============================================
// STUDENT STUDY TRACKER — BACKEND SERVER
// =============================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

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
// SERVE FRONTEND STATIC FILES
// =============================================
app.use(express.static(path.join(__dirname, '../frontend')));

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
