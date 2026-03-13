// =============================================
// STUDENT STUDY TRACKER — BACKEND SERVER
// =============================================

const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');

// Load environment variables
dotenv.config();

const app  = express();
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
    res.json({
        message: '🎓 Student Study Tracker API is running!',
        status: 'success'
    });
});

// =============================================
// AUTH ROUTES
// =============================================

// Register
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
        return res.status(400).json({
            message: 'Please fill in all fields'
        });
    }

    if (password.length < 4) {
        return res.status(400).json({
            message: 'Password must be at least 4 characters'
        });
    }

    // TODO: Save to database (Week 3)
    res.status(201).json({
        message: '✅ User registered successfully!',
        user: { name, email }
    });
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({
            message: 'Please fill in all fields'
        });
    }

    // TODO: Check database (Week 3)
    res.status(200).json({
        message: '✅ Login successful!',
        user: { email }
    });
});

// =============================================
// STUDY LOG ROUTES
// =============================================

// Get all study logs
app.get('/api/logs', (req, res) => {
    // TODO: Get from database (Week 3)
    res.json({
        message: '✅ Study logs fetched!',
        logs: [
            { subject: 'Mathematics', hours: 2.5, date: '2026-03-12' },
            { subject: 'Physics',     hours: 1.5, date: '2026-03-11' },
            { subject: 'Chemistry',   hours: 2.0, date: '2026-03-10' }
        ]
    });
});

// Add new study log
app.post('/api/logs', (req, res) => {
    const { subject, hours, date, notes } = req.body;

    if (!subject || !hours || !date) {
        return res.status(400).json({
            message: 'Please fill in all required fields'
        });
    }

    // TODO: Save to database (Week 3)
    res.status(201).json({
        message: '✅ Study log added successfully!',
        log: { subject, hours, date, notes }
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