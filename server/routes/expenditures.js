import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Get all expenditures
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, operation } = req.query;
    const offset = (page - 1) * limit;

    let baseFilter = '';
    let params = [];
    
    if (req.user.role !== 'admin') {
      baseFilter = 'AND e.base_id = $1';
      params.push(req.user.base_id);
    }

    let filters = [];
    if (startDate) {
      filters.push(`e.expenditure_date >= $${params.length + 1}`);
      params.push(startDate);
    }
    if (endDate) {
      filters.push(`e.expenditure_date <= $${params.length + 1}`);
      params.push(endDate);
    }
    if (operation) {
      filters.push(`e.operation_name ILIKE $${params.length + 1}`);
      params.push(`%${operation}%`);
    }

    const whereClause = filters.length > 0 ? 'AND ' + filters.join(' AND ') : '';

    const query = `
      SELECT 
        e.*,
        at.name as asset_name,
        at.category as asset_category,
        at.unit as asset_unit,
        b.name as base_name,
        u1.first_name || ' ' || u1.last_name as authorized_by_name,
        u2.first_name || ' ' || u2.last_name as recorded_by_name
      FROM expenditures e
      JOIN asset_types at ON e.asset_type_id = at.id
      JOIN bases b ON e.base_id = b.id
      JOIN users u1 ON e.authorized_by = u1.id
      JOIN users u2 ON e.recorded_by = u2.id
      WHERE 1=1 ${baseFilter} ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM expenditures e
      WHERE 1=1 ${baseFilter} ${whereClause}
    `;
    
    const countParams = params.slice(0, -2);
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      expenditures: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
        totalItems: parseInt(countResult.rows[0].total),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get expenditures error:', error);
    res.status(500).json({ error: 'Failed to fetch expenditures' });
  }
});

// Create new expenditure
router.post('/', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      asset_type_id,
      base_id,
      quantity,
      expenditure_date,
      purpose,
      operation_name,
      authorized_by,
      unit_cost,
      justification
    } = req.body;

    // Check base access
    if (req.user.role !== 'admin' && base_id !== req.user.base_id) {
      return res.status(403).json({ error: 'Access denied to this base' });
    }

    // Check inventory availability
    const inventoryQuery = `
      SELECT quantity, unit_cost FROM assets 
      WHERE asset_type_id = $1 AND base_id = $2
    `;
    
    const inventoryResult = await client.query(inventoryQuery, [asset_type_id, base_id]);
    
    if (inventoryResult.rows.length === 0 || inventoryResult.rows[0].quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient inventory',
        available: inventoryResult.rows[0]?.quantity || 0,
        requested: quantity
      });
    }

    const actualUnitCost = unit_cost || inventoryResult.rows[0].unit_cost;
    const total_cost = quantity * actualUnitCost;

    const insertQuery = `
      INSERT INTO expenditures (
        asset_type_id, base_id, quantity, expenditure_date, 
        purpose, operation_name, authorized_by, recorded_by,
        unit_cost, total_cost, justification
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      asset_type_id, base_id, quantity, expenditure_date,
      purpose, operation_name, authorized_by || req.user.id, req.user.id,
      actualUnitCost, total_cost, justification
    ]);

    // Update inventory (decrease quantity)
    await client.query(`
      UPDATE assets 
      SET quantity = quantity - $1, last_updated = CURRENT_TIMESTAMP
      WHERE asset_type_id = $2 AND base_id = $3
    `, [quantity, asset_type_id, base_id]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create expenditure error:', error);
    res.status(500).json({ error: 'Failed to create expenditure' });
  } finally {
    client.release();
  }
});

export default router;