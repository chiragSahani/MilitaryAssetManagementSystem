import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Get all personnel
router.get('/', authenticateToken, async (req, res) => {
  try {
    let baseFilter = '';
    let params = [];
    
    if (req.user.role !== 'admin') {
      baseFilter = 'WHERE p.base_id = $1';
      params.push(req.user.base_id);
    }

    const query = `
      SELECT 
        p.*,
        b.name as base_name,
        b.code as base_code
      FROM personnel p
      JOIN bases b ON p.base_id = b.id
      ${baseFilter}
      ORDER BY p.rank, p.last_name, p.first_name
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get personnel error:', error);
    res.status(500).json({ error: 'Failed to fetch personnel' });
  }
});

// Create new personnel record
router.post('/', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  try {
    const {
      service_number,
      first_name,
      last_name,
      rank,
      unit,
      base_id
    } = req.body;

    // Check base access
    if (req.user.role !== 'admin' && base_id !== req.user.base_id) {
      return res.status(403).json({ error: 'Access denied to this base' });
    }

    const insertQuery = `
      INSERT INTO personnel (service_number, first_name, last_name, rank, unit, base_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      service_number, first_name, last_name, rank, unit, base_id
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create personnel error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: 'Service number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create personnel record' });
    }
  }
});

export default router;