const { query, transaction } = require('../../config/db');
const { incrementUsageCount } = require('./discounts.service');

// ── Invoice number generator ───────────────────────────────────────────────────
async function generateInvoiceNumber(client) {
    const year = new Date().getFullYear();
    const res = await client.query(
        `SELECT COUNT(*) FROM invoices
     WHERE invoice_number LIKE $1`,
        [`INV-${year}-%`]
    );
    const seq = String(parseInt(res.rows[0].count) + 1).padStart(4, '0');
    return `INV-${year}-${seq}`;
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateInvoice(data) {
    const errors = [];
    if (!data.customer_id) errors.push('customer_id is required.');
    if (!data.due_date) errors.push('due_date is required.');
    if (!Array.isArray(data.lines) || data.lines.length === 0)
        errors.push('At least one invoice line is required.');
    if (errors.length) throw Object.assign(new Error(errors.join(' ')), { statusCode: 400 });
}

// ── Totals calculator ──────────────────────────────────────────────────────────
function calcLineTotals(line) {
    const qty = parseFloat(line.quantity) || 1;
    const unit = parseFloat(line.unit_price) || 0;
    const taxPct = parseFloat(line.tax_percentage) || 0;
    const discAmt = parseFloat(line.discount_amount) || 0;
    const gross = qty * unit;
    const taxAmount = ((gross - discAmt) * taxPct) / 100;
    const line_total = gross - discAmt + taxAmount;
    return {
        quantity: qty,
        unit_price: unit,
        tax_percentage: taxPct,
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        discount_amount: parseFloat(discAmt.toFixed(2)),
        line_total: parseFloat(line_total.toFixed(2))
    };
}

function calcInvoiceTotals(lines) {
    let subtotal = 0, tax_amount = 0, discount_amount = 0, total_amount = 0;
    for (const l of lines) {
        const qty = parseFloat(l.quantity) || 1;
        const unit = parseFloat(l.unit_price) || 0;
        subtotal += qty * unit;
        tax_amount += parseFloat(l.tax_amount) || 0;
        discount_amount += parseFloat(l.discount_amount) || 0;
        total_amount += parseFloat(l.line_total) || 0;
    }
    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax_amount: parseFloat(tax_amount.toFixed(2)),
        discount_amount: parseFloat(discount_amount.toFixed(2)),
        total_amount: parseFloat(total_amount.toFixed(2))
    };
}

// ── List ───────────────────────────────────────────────────────────────────────
async function listInvoices(queryParams) {
    const page = Math.max(1, parseInt(queryParams.page || 1));
    const pageSize = Math.min(100, Math.max(1, parseInt(queryParams.pageSize || 20)));
    const offset = (page - 1) * pageSize;
    const sortBy = ['invoice_date', 'due_date', 'total_amount', 'created_at', 'invoice_number'].includes(queryParams.sortBy)
        ? `i.${queryParams.sortBy}` : 'i.invoice_date';
    const sortDir = queryParams.sortDir === 'asc' ? 'ASC' : 'DESC';

    const conditions = [];
    const params = [];
    let idx = 1;

    if (queryParams.search) {
        conditions.push(`(i.invoice_number ILIKE $${idx}
      OR CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) ILIKE $${idx}
      OR u.business_name ILIKE $${idx})`);
        params.push(`%${queryParams.search}%`); idx++;
    }
    if (queryParams.status) {
        conditions.push(`i.status = $${idx}`);
        params.push(queryParams.status); idx++;
    }
    if (queryParams.customer_id) {
        conditions.push(`i.customer_id = $${idx}`);
        params.push(queryParams.customer_id); idx++;
    }
    if (queryParams.date_from) {
        conditions.push(`i.invoice_date >= $${idx}`);
        params.push(queryParams.date_from); idx++;
    }
    if (queryParams.date_to) {
        conditions.push(`i.invoice_date <= $${idx}`);
        params.push(queryParams.date_to); idx++;
    }
    if (queryParams.overdue === 'true') {
        conditions.push(`i.status NOT IN ('paid','cancelled') AND i.due_date < CURRENT_DATE`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const joinSql = `
    FROM invoices i
    JOIN users u ON u.id = i.customer_id
  `;

    const countRes = await query(`SELECT COUNT(*) ${joinSql} ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const rows = await query(
        `SELECT
       i.id, i.invoice_number, i.invoice_date, i.due_date,
       i.subtotal, i.tax_amount, i.discount_amount, i.total_amount,
       i.amount_paid, i.balance_due, i.status, i.notes,
       i.billing_period_start, i.billing_period_end,
       i.subscription_id, i.created_at, i.updated_at,
       u.id AS customer_id,
       CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS customer_name,
       u.business_name, u.email AS customer_email
     ${joinSql}
     LEFT JOIN auth a ON a.id = u.auth_id
     ${where}
     ORDER BY ${sortBy} ${sortDir}
     LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, pageSize, offset]
    );

    const stats = await query(`
    SELECT
      COUNT(*)                                                      AS total,
      COUNT(*) FILTER (WHERE status='paid')                         AS paid,
      COUNT(*) FILTER (WHERE status NOT IN ('paid','cancelled'))    AS outstanding,
      COUNT(*) FILTER (WHERE status NOT IN ('paid','cancelled')
                         AND due_date < CURRENT_DATE)               AS overdue,
      COALESCE(SUM(total_amount),0)                                 AS total_amount,
      COALESCE(SUM(amount_paid),0)                                  AS total_paid,
      COALESCE(SUM(balance_due),0)                                  AS total_outstanding
    FROM invoices
  `);

    return {
        items: rows.rows,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        stats: stats.rows[0]
    };
}

// ── Get single invoice with lines ─────────────────────────────────────────────
async function getInvoiceById(id) {
    const inv = await query(
        `SELECT i.*,
       CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS customer_name,
       u.business_name, a.email AS customer_email,
       u.phone AS customer_phone, u.address AS customer_address,
       u.city AS customer_city, u.country AS customer_country
     FROM invoices i
     JOIN users u ON u.id = i.customer_id
     LEFT JOIN auth a ON a.id = u.auth_id
     WHERE i.id = $1`,
        [id]
    );
    if (!inv.rows[0]) return null;

    const lines = await query(
        `SELECT il.*, p.name AS product_name, tr.name AS tax_name, d.name AS discount_name
     FROM invoice_lines il
     LEFT JOIN products p  ON p.id = il.product_id
     LEFT JOIN tax_rates tr ON tr.id = il.tax_rate_id
     LEFT JOIN discounts d  ON d.id = il.discount_id
     WHERE il.invoice_id = $1
     ORDER BY il.sort_order, il.created_at`,
        [id]
    );

    const payments = await query(
        `SELECT p.*, CONCAT(u.first_name,' ',COALESCE(u.last_name,'')) AS customer_name
     FROM payments p
     JOIN users u ON u.id = p.customer_id
     WHERE p.invoice_id = $1
     ORDER BY p.payment_date DESC`,
        [id]
    );

    return { ...inv.rows[0], lines: lines.rows, payments: payments.rows };
}

// ── Create invoice (draft) ────────────────────────────────────────────────────
async function createInvoice(data) {
    validateInvoice(data);
    const {
        customer_id, subscription_id = null,
        invoice_date = new Date().toISOString().split('T')[0],
        due_date, notes,
        billing_period_start = null, billing_period_end = null,
        lines
    } = data;

    return transaction(async (client) => {
        // Verify customer exists
        const custCheck = await client.query(`SELECT id FROM users WHERE id=$1`, [customer_id]);
        if (!custCheck.rows[0]) throw Object.assign(new Error('Customer not found.'), { statusCode: 404 });

        const invoice_number = await generateInvoiceNumber(client);

        // Calculate line totals
        const calculatedLines = lines.map((l, i) => ({
            ...l,
            ...calcLineTotals(l),
            sort_order: i
        }));

        const totals = calcInvoiceTotals(calculatedLines);

        const invRes = await client.query(
            `INSERT INTO invoices
         (invoice_number, customer_id, subscription_id, invoice_date, due_date,
          subtotal, tax_amount, discount_amount, total_amount, status,
          notes, billing_period_start, billing_period_end)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,$11,$12)
       RETURNING *`,
            [invoice_number, customer_id, subscription_id || null,
                invoice_date, due_date,
                totals.subtotal, totals.tax_amount, totals.discount_amount, totals.total_amount,
                notes || null, billing_period_start || null, billing_period_end || null]
        );
        const invoice = invRes.rows[0];

        for (const l of calculatedLines) {
            await client.query(
                `INSERT INTO invoice_lines
           (invoice_id, product_id, description, quantity, unit_price,
            tax_rate_id, tax_percentage, tax_amount, discount_id, discount_amount,
            line_total, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
                [invoice.id, l.product_id || null, l.description, l.quantity, l.unit_price,
                l.tax_rate_id || null, l.tax_percentage, l.tax_amount,
                l.discount_id || null, l.discount_amount,
                l.line_total, l.sort_order]
            );
            // Increment discount usage if applied
            if (l.discount_id) await incrementUsageCount(l.discount_id, client);
        }

        return { ...invoice, lines: calculatedLines };
    });
}

// ── Update invoice (draft only) ────────────────────────────────────────────────
async function updateInvoice(id, data) {
    const existing = await getInvoiceById(id);
    if (!existing) throw Object.assign(new Error('Invoice not found.'), { statusCode: 404 });
    if (existing.status !== 'draft')
        throw Object.assign(
            new Error('Only draft invoices can be edited. To correct a confirmed or paid invoice, cancel it and create a new one.'),
            { statusCode: 422 }
        );

    const {
        due_date = existing.due_date,
        notes = existing.notes,
        billing_period_start = existing.billing_period_start,
        billing_period_end = existing.billing_period_end,
        lines
    } = data;

    return transaction(async (client) => {
        let totals = {
            subtotal: existing.subtotal, tax_amount: existing.tax_amount,
            discount_amount: existing.discount_amount, total_amount: existing.total_amount
        };

        if (Array.isArray(lines) && lines.length > 0) {
            await client.query(`DELETE FROM invoice_lines WHERE invoice_id=$1`, [id]);
            const calculatedLines = lines.map((l, i) => ({ ...l, ...calcLineTotals(l), sort_order: i }));
            totals = calcInvoiceTotals(calculatedLines);

            for (const l of calculatedLines) {
                await client.query(
                    `INSERT INTO invoice_lines
             (invoice_id, product_id, description, quantity, unit_price,
              tax_rate_id, tax_percentage, tax_amount, discount_id, discount_amount,
              line_total, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
                    [id, l.product_id || null, l.description, l.quantity, l.unit_price,
                        l.tax_rate_id || null, l.tax_percentage, l.tax_amount,
                        l.discount_id || null, l.discount_amount, l.line_total, l.sort_order]
                );
            }
        }

        const res = await client.query(
            `UPDATE invoices SET
         due_date=$1, notes=$2, billing_period_start=$3, billing_period_end=$4,
         subtotal=$5, tax_amount=$6, discount_amount=$7, total_amount=$8,
         updated_at=NOW()
       WHERE id=$9 RETURNING *`,
            [due_date, notes || null, billing_period_start || null, billing_period_end || null,
                totals.subtotal, totals.tax_amount, totals.discount_amount, totals.total_amount, id]
        );
        return res.rows[0];
    });
}

// ── Status transitions ─────────────────────────────────────────────────────────
async function confirmInvoice(id) {
    const inv = await getInvoiceById(id);
    if (!inv) throw Object.assign(new Error('Invoice not found.'), { statusCode: 404 });
    if (inv.status !== 'draft') throw Object.assign(new Error('Only draft invoices can be confirmed.'), { statusCode: 422 });

    const res = await query(
        `UPDATE invoices SET status='confirmed', updated_at=NOW() WHERE id=$1 RETURNING *`, [id]
    );
    return res.rows[0];
}

async function cancelInvoice(id) {
    const inv = await getInvoiceById(id);
    if (!inv) throw Object.assign(new Error('Invoice not found.'), { statusCode: 404 });
    if (inv.status === 'paid')
        throw Object.assign(new Error('Paid invoices cannot be cancelled directly. Issue a credit note instead.'), { statusCode: 422 });
    if (inv.status === 'cancelled')
        throw Object.assign(new Error('Invoice is already cancelled.'), { statusCode: 422 });

    const res = await query(
        `UPDATE invoices SET status='cancelled', updated_at=NOW() WHERE id=$1 RETURNING *`, [id]
    );
    return res.rows[0];
}

// ── Subscription billing generation (public API for billing integration) ───────
async function generateSubscriptionInvoice({
    subscription_id, customer_id,
    billing_period_start, billing_period_end,
    due_date, lines, notes
}) {
    // Duplicate prevention
    const dup = await query(
        `SELECT id FROM billing_records
     WHERE subscription_id=$1
       AND billing_period_start=$2
       AND billing_period_end=$3
       AND status != 'failed'`,
        [subscription_id, billing_period_start, billing_period_end]
    );
    if (dup.rows[0])
        throw Object.assign(
            new Error('An invoice for this billing period already exists.'),
            { statusCode: 409 }
        );

    return transaction(async (client) => {
        const today = new Date().toISOString().split('T')[0];
        const calcLines = lines.map((l, i) => ({ ...l, ...calcLineTotals(l), sort_order: i }));
        const totals = calcInvoiceTotals(calcLines);
        const inv_num = await generateInvoiceNumber(client);

        const invRes = await client.query(
            `INSERT INTO invoices
         (invoice_number, customer_id, subscription_id, invoice_date, due_date,
          subtotal, tax_amount, discount_amount, total_amount, status,
          notes, billing_period_start, billing_period_end)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed',$10,$11,$12)
       RETURNING *`,
            [inv_num, customer_id, subscription_id, today, due_date,
                totals.subtotal, totals.tax_amount, totals.discount_amount, totals.total_amount,
                notes || null, billing_period_start, billing_period_end]
        );
        const invoice = invRes.rows[0];

        for (const l of calcLines) {
            await client.query(
                `INSERT INTO invoice_lines
           (invoice_id, product_id, description, quantity, unit_price,
            tax_rate_id, tax_percentage, tax_amount, discount_id, discount_amount,
            line_total, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
                [invoice.id, l.product_id || null, l.description, l.quantity, l.unit_price,
                l.tax_rate_id || null, l.tax_percentage, l.tax_amount,
                l.discount_id || null, l.discount_amount, l.line_total, l.sort_order]
            );
            if (l.discount_id) await incrementUsageCount(l.discount_id, client);
        }

        // Record billing record
        await client.query(
            `INSERT INTO billing_records
         (subscription_id, invoice_id, billing_period_start, billing_period_end, amount, status)
       VALUES ($1,$2,$3,$4,$5,'invoiced')`,
            [subscription_id, invoice.id, billing_period_start, billing_period_end, totals.total_amount]
        );

        return invoice;
    });
}

module.exports = {
    listInvoices, getInvoiceById, createInvoice,
    updateInvoice, confirmInvoice, cancelInvoice,
    generateSubscriptionInvoice
};
