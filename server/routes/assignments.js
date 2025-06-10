import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Get all assignments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, personnelId } = req.query;
    const offset = (page - 1) * limit;

    let baseFilter = '';
    let params = [];
    
    if (req.user.role !== 'admin') {
      baseFilter = 'AND a.base_id = $1';
      params.push(req.user.base_id);
    }

    let filters = [];
    if (status) {
      filters.push(`a.status = $${params.length + 1}`);
      params.push(status);
    }
    if (personnelId) {
      filters.push(`a.personnel_id = $${params.length + 1}`);
      params.push(personnelId);
    }

    const whereClause = filters.length > 0 ? 'AND ' + filters.join(' AND ') : '';

    const query = `
      SELECT 
        a.*,
        at.name as asset_name,
        at.category as asset_category,
        at.unit as asset_unit,
        p.service_number,
        p.first_name || ' ' || p.last_name as personnel_name,
        p.rank,
        p.unit as personnel_unit,
        b.name as base_name,
        u.first_name || ' ' || u.last_name as assigned_by_name
      FROM assignments a
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN personnel p ON a.personnel_id = p.id
      JOIN bases b ON a.base_id = b.id
      JOIN users u ON a.assigned_by = u.id
      WHERE 1=1 ${baseFilter} ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM assignments a
      WHERE 1=1 ${baseFilter} ${whereClause}
    `;
    
    const countParams = params.slice(0, -2);
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      assignments: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
        totalItems: parseInt(countResult.rows[0].total),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create new assignment
router.post('/', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      asset_type_id,
      personnel_id,
      base_id,
      quantity,
      assigned_date,
      purpose,
      serial_numbers,
      notes
    } = req.body;

    // Check base access
    if (req.user.role !== 'admin' && base_id !== req.user.base_id) {
      return res.status(403).json({ error: 'Access denied to this base' });
    }

    // Check inventory availability
    const inventoryQuery = `
      SELECT quantity FROM assets 
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

    const insertQuery = `
      INSERT INTO assignments (
        asset_type_id, personnel_id, base_id, quantity, 
        assigned_date, purpose, assigned_by, serial_numbers, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      asset_type_id, personnel_id, base_id, quantity,
      assigned_date, purpose, req.user.id, serial_numbers, notes
    ]);

    // Update inventory (decrease available quantity)
    await client.query(`
      UPDATE assets 
      SET quantity = quantity - $1, last_updated = CURRENT_TIMESTAMP
      WHERE asset_type_id = $2 AND base_id = $3
    `, [quantity, asset_type_id, base_id]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  } finally {
    client.release();
  }
});

// Return assignment
router.patch('/:id/return', authenticateToken, checkRole(['admin', 'base_commander']), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { return_date, status = 'returned', notes } = req.body;

    // Get assignment details
    const assignmentQuery = 'SELECT * FROM assignments WHERE id = $1';
    const assignmentResult = await client.query(assignmentQuery, [id]);
    
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignmentResult.rows[0];

    // Check base access
    if (req.user.role !== 'admin' && assignment.base_id !== req.user.base_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update assignment status
    const updateQuery = `
      UPDATE assignments 
      SET status = $1, return_date = $2, notes = COALESCE($3, notes)
      WHERE id = $4
      RETURNING *
    `;

    const result = await client.query(updateQuery, [
      status, return_date, notes, id
    ]);

    // If returned successfully, update inventory
    if (status === 'returned') {
      await client.query(`
        UPDATE assets 
        SET quantity = quantity + $1, last_updated = CURRENT_TIMESTAMP
        WHERE asset_type_id = $2 AND base_id = $3
      `, [assignment.quantity, assignment.asset_type_id, assignment.base_id]);
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Return assignment error:', error);
    res.status(500).json({ error: 'Failed to return assignment' });
  } finally {
    client.release();
  }
});

export default router;