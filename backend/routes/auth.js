const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please fill in all fields' });
    }

    if (password.length < 4) {
        return res.status(400).json({ message: 'Password must be at least 4 characters' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
        
        db.query(sql, [name, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Email already registered' });
                }
                console.error('Registration Error:', err);
                return res.status(500).json({ message: 'Database error occurred' });
            }
            res.status(201).json({ message: '✅ User registered successfully!' });
        });
    } catch (err) {
        console.error('Server error during registration:', err);
        res.status(500).json({ message: 'Server error occurred' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error('Login Error:', err);
            return res.status(500).json({ message: 'Database error occurred' });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

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

module.exports = router;
