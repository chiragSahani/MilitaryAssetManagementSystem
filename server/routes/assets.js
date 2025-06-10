import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get asset types
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM asset_types 
      WHERE is_active = true 
      ORDER BY category, name
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Get asset types error:', error);
    res.status(500).json({ error: 'Failed to fetch asset types' });
  }
});

// Get bases
router.get('/bases', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT b.*, u.first_name || ' ' || u.last_name as commander_name
      FROM bases b
      LEFT JOIN users u ON b.commander_id = u.id
      WHERE b.is_active = true
    `;
    let params = [];

    // Non-admin users can only see their own base
    if (req.user.role !== 'admin') {
      query += ' AND b.id = $1';
      params.push(req.user.base_id);
    }

    query += ' ORDER BY b.name';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get bases error:', error);
    res.status(500).json({ error: 'Failed to fetch bases' });
  }
});

// Get current inventory
router.get('/inventory', authenticateToken, async (req, res) => {
  try {
    let baseFilter = '';
    let params = [];
    
    if (req.user.role !== 'admin') {
      baseFilter = 'WHERE a.base_id = $1';
      params.push(req.user.base_id);
    }

    const query = `
      SELECT 
        a.*,
        at.name as asset_name,
        at.category as asset_category,
        at.unit as asset_unit,
        b.name as base_name,
        b.code as base_code
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN bases b ON a.base_id = b.id
      ${baseFilter}
      ORDER BY at.category, at.name, b.name
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

export default router;