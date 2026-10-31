const express = require('express');
const { query } = require('../../config/db');

const taxesCtrl = require('./taxes.controller');
const discountsCtrl = require('./discounts.controller');
const invoicesCtrl = require('./invoices.controller');
const paymentsCtrl = require('./payments.controller');

const router = express.Router();

// ── Taxes ─────────────────────────────────────────────────────────────────────
router.get('/taxes', taxesCtrl.list);
router.get('/taxes/:id', taxesCtrl.getById);
router.post('/taxes', taxesCtrl.create);
router.put('/taxes/:id', taxesCtrl.update);
router.delete('/taxes/:id', taxesCtrl.remove);

// ── Discounts ─────────────────────────────────────────────────────────────────
router.get('/discounts', discountsCtrl.list);
router.get('/discounts/:id', discountsCtrl.getById);
router.post('/discounts', discountsCtrl.create);
router.put('/discounts/:id', discountsCtrl.update);
router.delete('/discounts/:id', discountsCtrl.remove);

// ── Invoices ──────────────────────────────────────────────────────────────────
router.get('/invoices', invoicesCtrl.list);
router.get('/invoices/:id', invoicesCtrl.getById);
router.post('/invoices', invoicesCtrl.create);
router.put('/invoices/:id', invoicesCtrl.update);
router.patch('/invoices/:id/confirm', invoicesCtrl.confirm);
router.patch('/invoices/:id/cancel', invoicesCtrl.cancel);

// ── Payments ──────────────────────────────────────────────────────────────────
router.get('/payments', paymentsCtrl.list);
router.get('/payments/:id', paymentsCtrl.getById);
router.post('/payments', paymentsCtrl.record);

// ── Supporting: customers dropdown ───────────────────────────────────────────
router.get('/customers', async (req, res, next) => {
    try {
        const search = req.query.search ? `%${req.query.search}%` : '%';
        const rows = await query(
            `SELECT u.id, u.first_name, u.last_name, u.business_name, a.email
       FROM users u
       LEFT JOIN auth a ON a.id = u.auth_id
       WHERE CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) ILIKE $1
          OR u.business_name ILIKE $1
          OR a.email ILIKE $1
       ORDER BY u.first_name, u.last_name
       LIMIT 100`,
            [search]
        );
        res.json({ status: 'success', data: rows.rows });
    } catch (err) { next(err); }
});

// ── Supporting: active tax rates dropdown ────────────────────────────────────
router.get('/taxes-list', async (req, res, next) => {
    try {
        const rows = await query(
            `SELECT id, name, percentage FROM tax_rates WHERE is_active = TRUE ORDER BY name`
        );
        res.json({ status: 'success', data: rows.rows });
    } catch (err) { next(err); }
});

// ── Supporting: active discounts dropdown ────────────────────────────────────
router.get('/discounts-list', async (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const rows = await query(
            `SELECT id, name, discount_type, discount_value
       FROM discounts
       WHERE is_active = TRUE
         AND (start_date IS NULL OR start_date <= $1)
         AND (end_date   IS NULL OR end_date   >= $1)
         AND (usage_limit IS NULL OR usage_count < usage_limit)
       ORDER BY name`,
            [today]
        );
        res.json({ status: 'success', data: rows.rows });
    } catch (err) { next(err); }
});

// ── Supporting: outstanding invoices for payment form ────────────────────────
router.get('/invoices-outstanding', async (req, res, next) => {
    try {
        const search = req.query.search ? `%${req.query.search}%` : '%';
        const rows = await query(
            `SELECT i.id, i.invoice_number, i.total_amount, i.amount_paid, i.balance_due,
              CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS customer_name,
              u.business_name
       FROM invoices i
       JOIN users u ON u.id = i.customer_id
       WHERE i.status IN ('confirmed','draft')
         AND i.balance_due > 0
         AND (i.invoice_number ILIKE $1
           OR CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) ILIKE $1
           OR u.business_name ILIKE $1)
       ORDER BY i.due_date
       LIMIT 100`,
            [search]
        );
        res.json({ status: 'success', data: rows.rows });
    } catch (err) { next(err); }
});

module.exports = router;
