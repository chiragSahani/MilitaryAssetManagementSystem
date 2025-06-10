import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    // Get user from database
    const userQuery = `
      SELECT u.*, b.name as base_name, b.code as base_code
      FROM users u
      LEFT JOIN bases b ON u.base_id = b.id
      WHERE u.username = $1 AND u.is_active = true
    `;
    
    const result = await pool.query(userQuery, [username]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // For demo purposes, we'll use plain text comparison
    // In production, use bcrypt.compare(password, user.password_hash)
    const validPassword = password === 'Demo123!' || password === user.username + '123!';
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.role,
        baseId: user.base_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password hash from response
    delete user.password_hash;

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        baseId: user.base_id,
        baseName: user.base_name,
        baseCode: user.base_code
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  const user = { ...req.user };
  delete user.password_hash;
  res.json(user);
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

export default router;