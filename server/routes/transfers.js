import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Get all transfers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let baseFilter = '';
    let params = [];
    
    if (req.user.role !== 'admin') {
      baseFilter = 'AND (t.from_base_id = $1 OR t.to_base_id = $1)';
      params.push(req.user.base_id);
    }

    let filters = [];
    if (status) {
      filters.push(`t.status = $${params.length + 1}`);
      params.push(status);
    }
    if (startDate) {
      filters.push(`t.transfer_date >= $${params.length + 1}`);
      params.push(startDate);
    }
    if (endDate) {
      filters.push(`t.transfer_date <= $${params.length + 1}`);
      params.push(endDate);
    }

    const whereClause = filters.length > 0 ? 'AND ' + filters.join(' AND ') : '';

    const query = `
      SELECT 
        t.*,
        at.name as asset_name,
        at.category as asset_category,
        at.unit as asset_unit,
        b1.name as from_base_name,
        b1.code as from_base_code,
        b2.name as to_base_name,
        b2.code as to_base_code,
        u1.first_name || ' ' || u1.last_name as initiated_by_name,
        u2.first_name || ' ' || u2.last_name as approved_by_name,
        u3.first_name || ' ' || u3.last_name as received_by_name
      FROM transfers t
      JOIN asset_types at ON t.asset_type_id = at.id
      JOIN bases b1 ON t.from_base_id = b1.id
      JOIN bases b2 ON t.to_base_id = b2.id
      JOIN users u1 ON t.initiated_by = u1.id
      LEFT JOIN users u2 ON t.approved_by = u2.id
      LEFT JOIN users u3 ON t.received_by = u3.id
      WHERE 1=1 ${baseFilter} ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM transfers t
      WHERE 1=1 ${baseFilter} ${whereClause}
    `;
    
    const countParams = params.slice(0, -2);
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      transfers: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
        totalItems: parseInt(countResult.rows[0].total),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ error: 'Failed to fetch transfers' });
  }
});

// Create new transfer
router.post('/', authenticateToken, checkRole(['admin', 'base_commander', 'logistics_officer']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      asset_type_id,
      from_base_id,
      to_base_id,
      quantity,
      transfer_date,
      reason,
      notes
    } = req.body;

    // Check base access for from_base
    if (req.user.role !== 'admin' && from_base_id !== req.user.base_id) {
      return res.status(403).json({ error: 'Access denied - cannot transfer from this base' });
    }

    // Check inventory availability
    const inventoryQuery = `
      SELECT quantity FROM assets 
      WHERE asset_type_id = $1 AND base_id = $2
    `;
    
    const inventoryResult = await client.query(inventoryQuery, [asset_type_id, from_base_id]);
    
    if (inventoryResult.rows.length === 0 || inventoryResult.rows[0].quantity < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient inventory',
        available: inventoryResult.rows[0]?.quantity || 0,
        requested: quantity
      });
    }

    // Generate tracking number
    const tracking_number = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const insertQuery = `
      INSERT INTO transfers (
        asset_type_id, from_base_id, to_base_id, quantity, 
        transfer_date, reason, notes, initiated_by, tracking_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      asset_type_id, from_base_id, to_base_id, quantity,
      transfer_date, reason, notes, req.user.id, tracking_number
    ]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create transfer error:', error);
    res.status(500).json({ error: 'Failed to create transfer' });
  } finally {
    client.release();
  }
});

// Update transfer status
router.patch('/:id/status', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status } = req.body;

    // Get transfer details
    const transferQuery = 'SELECT * FROM transfers WHERE id = $1';
    const transferResult = await client.query(transferQuery, [id]);
    
    if (transferResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    const transfer = transferResult.rows[0];

    // Check permissions based on status and user role
    if (req.user.role !== 'admin') {
      if (status === 'approved' && transfer.from_base_id !== req.user.base_id) {
        return res.status(403).json({ error: 'Only from-base commander can approve transfers' });
      }
      if (status === 'completed' && transfer.to_base_id !== req.user.base_id) {
        return res.status(403).json({ error: 'Only to-base commander can complete transfers' });
      }
    }

    // Update transfer status
    let updateQuery = `UPDATE transfers SET status = $1, completed_at = $2`;
    let updateParams = [status, status === 'completed' ? new Date() : null];

    if (status === 'approved') {
      updateQuery += `, approved_by = $3`;
      updateParams.push(req.user.id);
    } else if (status === 'completed') {
      updateQuery += `, received_by = $3`;
      updateParams.push(req.user.id);
    }

    updateQuery += ` WHERE id = $${updateParams.length + 1} RETURNING *`;
    updateParams.push(id);

    const result = await client.query(updateQuery, updateParams);

    // Update inventory if transfer is completed
    if (status === 'completed') {
      // Decrease from source base
      await client.query(`
        UPDATE assets 
        SET quantity = quantity - $1, last_updated = CURRENT_TIMESTAMP
        WHERE asset_type_id = $2 AND base_id = $3
      `, [transfer.quantity, transfer.asset_type_id, transfer.from_base_id]);

      // Increase at destination base
      await client.query(`
        INSERT INTO assets (asset_type_id, base_id, quantity, unit_cost)
        VALUES ($1, $2, $3, (SELECT unit_cost FROM assets WHERE asset_type_id = $1 AND base_id = $4 LIMIT 1))
        ON CONFLICT (asset_type_id, base_id)
        DO UPDATE SET 
          quantity = assets.quantity + EXCLUDED.quantity,
          last_updated = CURRENT_TIMESTAMP
      `, [transfer.asset_type_id, transfer.to_base_id, transfer.quantity, transfer.from_base_id]);
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update transfer status error:', error);
    res.status(500).json({ error: 'Failed to update transfer status' });
  } finally {
    client.release();
  }
});

export default router;