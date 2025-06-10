import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkBaseAccess } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { baseId, startDate, endDate, assetType } = req.query;
    
    // Build base filter based on user role
    let baseFilter = '';
    let baseParams = [];
    
    if (req.user.role !== 'admin') {
      baseFilter = 'AND base_id = $1';
      baseParams = [req.user.base_id];
    } else if (baseId) {
      baseFilter = 'AND base_id = $1';
      baseParams = [baseId];
    }

    // Get current inventory (opening balance)
    const inventoryQuery = `
      SELECT 
        at.name as asset_name,
        at.category,
        at.unit,
        a.base_id,
        b.name as base_name,
        SUM(a.quantity) as current_quantity,
        AVG(a.unit_cost) as avg_unit_cost
      FROM assets a
      JOIN asset_types at ON a.asset_type_id = at.id
      JOIN bases b ON a.base_id = b.id
      WHERE a.quantity > 0 ${baseFilter}
      ${assetType ? 'AND at.category = $' + (baseParams.length + 1) : ''}
      GROUP BY at.id, at.name, at.category, at.unit, a.base_id, b.name
      ORDER BY at.category, at.name
    `;
    
    if (assetType) baseParams.push(assetType);
    const inventory = await pool.query(inventoryQuery, baseParams);

    // Get purchases in date range
    const purchasesQuery = `
      SELECT 
        COUNT(*) as total_purchases,
        SUM(quantity) as total_quantity,
        SUM(total_cost) as total_cost
      FROM purchases p
      WHERE status = 'received' ${baseFilter}
      ${startDate ? 'AND purchase_date >= $' + (baseParams.length + 1) : ''}
      ${endDate ? 'AND purchase_date <= $' + (baseParams.length + 2) : ''}
    `;
    
    let purchaseParams = [...baseParams];
    if (startDate) purchaseParams.push(startDate);
    if (endDate) purchaseParams.push(endDate);
    
    const purchases = await pool.query(purchasesQuery, purchaseParams);

    // Get transfers in date range
    const transfersOutQuery = `
      SELECT 
        COUNT(*) as total_transfers,
        SUM(quantity) as total_quantity
      FROM transfers t
      WHERE status = 'completed' AND from_base_id ${req.user.role === 'admin' ? (baseId ? '= $1' : 'IS NOT NULL') : '= $1'}
      ${startDate ? 'AND transfer_date >= $' + (baseParams.length + 1) : ''}
      ${endDate ? 'AND transfer_date <= $' + (baseParams.length + 2) : ''}
    `;

    const transfersInQuery = `
      SELECT 
        COUNT(*) as total_transfers,
        SUM(quantity) as total_quantity
      FROM transfers t
      WHERE status = 'completed' AND to_base_id ${req.user.role === 'admin' ? (baseId ? '= $1' : 'IS NOT NULL') : '= $1'}
      ${startDate ? 'AND transfer_date >= $' + (baseParams.length + 1) : ''}
      ${endDate ? 'AND transfer_date <= $' + (baseParams.length + 2) : ''}
    `;

    let transferParams = [...baseParams];
    if (startDate) transferParams.push(startDate);
    if (endDate) transferParams.push(endDate);

    const transfersOut = await pool.query(transfersOutQuery, transferParams);
    const transfersIn = await pool.query(transfersInQuery, transferParams);

    // Get expenditures in date range
    const expendituresQuery = `
      SELECT 
        COUNT(*) as total_expenditures,
        SUM(quantity) as total_quantity,
        SUM(total_cost) as total_cost
      FROM expenditures e
      WHERE 1=1 ${baseFilter}
      ${startDate ? 'AND expenditure_date >= $' + (baseParams.length + 1) : ''}
      ${endDate ? 'AND expenditure_date <= $' + (baseParams.length + 2) : ''}
    `;

    let expenditureParams = [...baseParams];
    if (startDate) expenditureParams.push(startDate);
    if (endDate) expenditureParams.push(endDate);

    const expenditures = await pool.query(expendituresQuery, expenditureParams);

    // Get assignments
    const assignmentsQuery = `
      SELECT 
        COUNT(*) as total_assignments,
        SUM(quantity) as total_quantity
      FROM assignments a
      WHERE status = 'active' ${baseFilter}
    `;

    const assignments = await pool.query(assignmentsQuery, baseParams);

    // Calculate metrics
    const purchaseData = purchases.rows[0];
    const transferOutData = transfersOut.rows[0];
    const transferInData = transfersIn.rows[0];
    const expenditureData = expenditures.rows[0];
    const assignmentData = assignments.rows[0];

    const netMovement = {
      purchases: parseInt(purchaseData.total_quantity) || 0,
      transferIn: parseInt(transferInData.total_quantity) || 0,
      transferOut: parseInt(transferOutData.total_quantity) || 0,
      total: (parseInt(purchaseData.total_quantity) || 0) + 
             (parseInt(transferInData.total_quantity) || 0) - 
             (parseInt(transferOutData.total_quantity) || 0)
    };

    res.json({
      inventory: inventory.rows,
      metrics: {
        openingBalance: inventory.rows.reduce((sum, item) => sum + parseInt(item.current_quantity), 0),
        purchases: parseInt(purchaseData.total_quantity) || 0,
        transfersIn: parseInt(transferInData.total_quantity) || 0,
        transfersOut: parseInt(transferOutData.total_quantity) || 0,
        expenditures: parseInt(expenditureData.total_quantity) || 0,
        assignments: parseInt(assignmentData.total_quantity) || 0,
        netMovement: netMovement,
        totalCost: {
          purchases: parseFloat(purchaseData.total_cost) || 0,
          expenditures: parseFloat(expenditureData.total_cost) || 0
        }
      }
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// Get recent activities
router.get('/activities', authenticateToken, async (req, res) => {
  try {
    let baseFilter = '';
    let baseParams = [];
    
    if (req.user.role !== 'admin') {
      baseFilter = 'WHERE base_id = $1';
      baseParams = [req.user.base_id];
    }

    const activitiesQuery = `
      (SELECT 'purchase' as type, id, created_at, 
              CONCAT('Purchased ', quantity, ' ', (SELECT name FROM asset_types WHERE id = asset_type_id)) as description,
              base_id
       FROM purchases ${baseFilter}
       ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'transfer' as type, id, created_at,
              CONCAT('Transferred ', quantity, ' ', (SELECT name FROM asset_types WHERE id = asset_type_id), 
                     ' from ', (SELECT name FROM bases WHERE id = from_base_id),
                     ' to ', (SELECT name FROM bases WHERE id = to_base_id)) as description,
              from_base_id as base_id
       FROM transfers ${baseFilter.replace('base_id', 'from_base_id')}
       ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'expenditure' as type, id, created_at,
              CONCAT('Expended ', quantity, ' ', (SELECT name FROM asset_types WHERE id = asset_type_id), ' for ', purpose) as description,
              base_id
       FROM expenditures ${baseFilter}
       ORDER BY created_at DESC LIMIT 5)
      ORDER BY created_at DESC LIMIT 10
    `;

    const activities = await pool.query(activitiesQuery, [...baseParams, ...baseParams, ...baseParams]);

    res.json(activities.rows);
  } catch (error) {
    console.error('Dashboard activities error:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

export default router;