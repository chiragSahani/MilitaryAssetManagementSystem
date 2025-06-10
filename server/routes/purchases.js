import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkRole, checkBaseAccess } from '../middleware/auth.js';

const router = express.Router();

// Get all purchases
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate, assetType } = req.query;
    const offset = (page - 1) * limit;

    let baseFilter = '';
    let params = [];
    
    if (req.user.role !== 'admin') {
      baseFilter = 'AND p.base_id = $' + (params.length + 1);
      params.push(req.user.base_id);
    }

    let filters = [];
    if (status) {
      filters.push(`p.status = $${params.length + 1}`);
      params.push(status);
    }
    if (startDate) {
      filters.push(`p.purchase_date >= $${params.length + 1}`);
      params.push(startDate);
    }
    if (endDate) {
      filters.push(`p.purchase_date <= $${params.length + 1}`);
      params.push(endDate);
    }
    if (assetType) {
      filters.push(`at.category = $${params.length + 1}`);
      params.push(assetType);
    }

    const whereClause = filters.length > 0 ? 'AND ' + filters.join(' AND ') : '';

    const query = `
      SELECT 
        p.*,
        at.name as asset_name,
        at.category as asset_category,
        at.unit as asset_unit,
        b.name as base_name,
        b.code as base_code,
        u1.first_name || ' ' || u1.last_name as created_by_name,
        u2.first_name || ' ' || u2.last_name as approved_by_name
      FROM purchases p
      JOIN asset_types at ON p.asset_type_id = at.id
      JOIN bases b ON p.base_id = b.id
      JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.approved_by = u2.id
      WHERE 1=1 ${baseFilter} ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM purchases p
      JOIN asset_types at ON p.asset_type_id = at.id
      WHERE 1=1 ${baseFilter} ${whereClause}
    `;
    
    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      purchases: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
        totalItems: parseInt(countResult.rows[0].total),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

// Create new purchase
router.post('/', authenticateToken, checkRole(['admin', 'base_commander', 'logistics_officer']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      asset_type_id,
      base_id,
      quantity,
      unit_cost,
      supplier,
      purchase_date,
      purchase_order_number,
      notes
    } = req.body;

    // Check base access
    if (req.user.role !== 'admin' && base_id !== req.user.base_id) {
      return res.status(403).json({ error: 'Access denied to this base' });
    }

    const total_cost = quantity * unit_cost;

    const insertQuery = `
      INSERT INTO purchases (
        asset_type_id, base_id, quantity, unit_cost, total_cost, 
        supplier, purchase_date, purchase_order_number, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      asset_type_id, base_id, quantity, unit_cost, total_cost,
      supplier, purchase_date, purchase_order_number, notes, req.user.id
    ]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create purchase error:', error);
    res.status(500).json({ error: 'Failed to create purchase' });
  } finally {
    client.release();
  }
});

// Update purchase status
router.patch('/:id/status', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, received_date } = req.body;

    // Get purchase to check permissions
    const purchaseQuery = 'SELECT * FROM purchases WHERE id = $1';
    const purchaseResult = await client.query(purchaseQuery, [id]);
    
    if (purchaseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const purchase = purchaseResult.rows[0];
    
    // Check base access
    if (req.user.role !== 'admin' && purchase.base_id !== req.user.base_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update purchase status
    const updateQuery = `
      UPDATE purchases 
      SET status = $1, received_date = $2, approved_by = $3
      WHERE id = $4
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      status, 
      status === 'received' ? received_date : null,
      req.user.id,
      id
    ]);

    // If status is 'received', update inventory
    if (status === 'received') {
      const inventoryQuery = `
        INSERT INTO assets (asset_type_id, base_id, quantity, unit_cost)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (asset_type_id, base_id)
        DO UPDATE SET 
          quantity = assets.quantity + EXCLUDED.quantity,
          unit_cost = (assets.unit_cost * assets.quantity + EXCLUDED.unit_cost * EXCLUDED.quantity) / (assets.quantity + EXCLUDED.quantity),
          last_updated = CURRENT_TIMESTAMP
      `;

      await client.query(inventoryQuery, [
        purchase.asset_type_id,
        purchase.base_id,
        purchase.quantity,
        purchase.unit_cost
      ]);
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update purchase status error:', error);
    res.status(500).json({ error: 'Failed to update purchase status' });
  } finally {
    client.release();
  }
});

export default router;