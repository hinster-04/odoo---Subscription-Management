const { query, transaction } = require('../../config/db');

// ── Payment reference generator ────────────────────────────────────────────────
async function generatePaymentRef(client) {
    const year = new Date().getFullYear();
    const res = await client.query(
        `SELECT COUNT(*) FROM payments WHERE payment_reference LIKE $1`,
        [`PAY-${year}-%`]
    );
    const seq = String(parseInt(res.rows[0].count) + 1).padStart(4, '0');
    return `PAY-${year}-${seq}`;
}

// ── List payments ─────────────────────────────────────────────────────────────
async function listPayments(queryParams) {
    const page = Math.max(1, parseInt(queryParams.page || 1));
    const pageSize = Math.min(100, Math.max(1, parseInt(queryParams.pageSize || 20)));
    const offset = (page - 1) * pageSize;
    const sortBy = ['payment_date', 'amount', 'created_at', 'payment_reference'].includes(queryParams.sortBy)
        ? `p.${queryParams.sortBy}` : 'p.payment_date';
    const sortDir = queryParams.sortDir === 'asc' ? 'ASC' : 'DESC';

    const conditions = [];
    const params = [];
    let idx = 1;

    if (queryParams.search) {
        conditions.push(`(p.payment_reference ILIKE $${idx}
      OR i.invoice_number ILIKE $${idx}
      OR CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) ILIKE $${idx}
      OR u.business_name ILIKE $${idx})`);
        params.push(`%${queryParams.search}%`); idx++;
    }
    if (queryParams.payment_method) {
        conditions.push(`p.payment_method = $${idx}`);
        params.push(queryParams.payment_method); idx++;
    }
    if (queryParams.customer_id) {
        conditions.push(`p.customer_id = $${idx}`);
        params.push(queryParams.customer_id); idx++;
    }
    if (queryParams.invoice_id) {
        conditions.push(`p.invoice_id = $${idx}`);
        params.push(queryParams.invoice_id); idx++;
    }
    if (queryParams.date_from) {
        conditions.push(`p.payment_date >= $${idx}`);
        params.push(queryParams.date_from); idx++;
    }
    if (queryParams.date_to) {
        conditions.push(`p.payment_date <= $${idx}`);
        params.push(queryParams.date_to); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const joinSql = `
    FROM payments p
    JOIN invoices i ON i.id = p.invoice_id
    JOIN users u    ON u.id = p.customer_id
  `;

    const countRes = await query(`SELECT COUNT(*) ${joinSql} ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const rows = await query(
        `SELECT
       p.id, p.payment_reference, p.payment_method, p.amount,
       p.payment_date, p.notes, p.created_at,
       p.invoice_id, i.invoice_number,
       p.customer_id,
       CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS customer_name,
       u.business_name
     ${joinSql}
     ${where}
     ORDER BY ${sortBy} ${sortDir}
     LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, pageSize, offset]
    );

    // Stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const som = startOfMonth.toISOString().split('T')[0];

    const stats = await query(
        `SELECT
       COUNT(*)                                    AS total_payments,
       COALESCE(SUM(amount),0)                     AS total_received,
       COUNT(*)  FILTER (WHERE payment_date >= $1) AS payments_this_month,
       COALESCE(SUM(amount) FILTER (WHERE payment_date >= $1),0) AS amount_this_month
     FROM payments`,
        [som]
    );

    const outstanding = await query(
        `SELECT COALESCE(SUM(balance_due),0) AS outstanding
     FROM invoices
     WHERE status NOT IN ('paid','cancelled')`
    );

    return {
        items: rows.rows,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        stats: { ...stats.rows[0], outstanding_amount: outstanding.rows[0].outstanding }
    };
}

// ── Get single payment ─────────────────────────────────────────────────────────
async function getPaymentById(id) {
    const res = await query(
        `SELECT p.*,
       i.invoice_number, i.total_amount AS invoice_total, i.status AS invoice_status,
       CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS customer_name,
       u.business_name, a.email AS customer_email
     FROM payments p
     JOIN invoices i ON i.id = p.invoice_id
     JOIN users u    ON u.id = p.customer_id
     LEFT JOIN auth a ON a.id = u.auth_id
     WHERE p.id = $1`,
        [id]
    );
    return res.rows[0] || null;
}

// ── Record a payment ───────────────────────────────────────────────────────────
async function recordPayment(data) {
    const { invoice_id, payment_method, amount, payment_date, notes } = data;

    if (!invoice_id) throw Object.assign(new Error('invoice_id is required.'), { statusCode: 400 });
    if (!payment_method) throw Object.assign(new Error('payment_method is required.'), { statusCode: 400 });
    if (!amount || amount <= 0) throw Object.assign(new Error('amount must be greater than 0.'), { statusCode: 400 });

    const validMethods = ['bank_transfer', 'credit_card', 'upi', 'cash', 'cheque', 'other'];
    if (!validMethods.includes(payment_method))
        throw Object.assign(new Error(`payment_method must be one of: ${validMethods.join(', ')}.`), { statusCode: 400 });

    return transaction(async (client) => {
        // Lock the invoice row to prevent race conditions
        const invRes = await client.query(
            `SELECT * FROM invoices WHERE id=$1 FOR UPDATE`, [invoice_id]
        );
        const invoice = invRes.rows[0];
        if (!invoice) throw Object.assign(new Error('Invoice not found.'), { statusCode: 404 });
        if (invoice.status === 'cancelled')
            throw Object.assign(new Error('Cannot record payment on a cancelled invoice.'), { statusCode: 422 });
        if (invoice.status === 'paid')
            throw Object.assign(new Error('Invoice is already fully paid.'), { statusCode: 422 });

        const balance = parseFloat(invoice.balance_due);
        const pay = parseFloat(amount);

        if (pay > balance + 0.005) // 0.005 rounding tolerance
            throw Object.assign(
                new Error(`Payment of ${pay} exceeds outstanding balance of ${balance.toFixed(2)}.`),
                { statusCode: 422 }
            );

        const payment_reference = await generatePaymentRef(client);

        const payRes = await client.query(
            `INSERT INTO payments
         (payment_reference, invoice_id, customer_id, payment_method, amount, payment_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
            [payment_reference, invoice_id, invoice.customer_id,
                payment_method, pay,
                payment_date || new Date().toISOString().split('T')[0],
                notes || null]
        );

        const new_paid = parseFloat(invoice.amount_paid) + pay;
        const new_status = new_paid >= parseFloat(invoice.total_amount) - 0.005 ? 'paid' : invoice.status;

        await client.query(
            `UPDATE invoices
       SET amount_paid=$1, status=$2, updated_at=NOW()
       WHERE id=$3`,
            [parseFloat(new_paid.toFixed(2)), new_status, invoice_id]
        );

        return { ...payRes.rows[0], new_invoice_status: new_status };
    });
}

module.exports = { listPayments, getPaymentById, recordPayment };
