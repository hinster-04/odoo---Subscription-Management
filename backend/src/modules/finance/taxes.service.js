const { query } = require('../../config/db');

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildWhereClause(filters) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (filters.search) {
        conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
        params.push(`%${filters.search}%`);
        idx++;
    }
    if (filters.status === 'active') { conditions.push(`is_active = TRUE`); }
    if (filters.status === 'inactive') { conditions.push(`is_active = FALSE`); }

    return {
        where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
        params,
        nextIdx: idx
    };
}

// ── Service Functions ─────────────────────────────────────────────────────────
async function listTaxRates(queryParams) {
    const page = Math.max(1, parseInt(queryParams.page || 1));
    const pageSize = Math.min(100, Math.max(1, parseInt(queryParams.pageSize || 20)));
    const offset = (page - 1) * pageSize;
    const sortBy = ['name', 'percentage', 'created_at'].includes(queryParams.sortBy)
        ? queryParams.sortBy : 'created_at';
    const sortDir = queryParams.sortDir === 'asc' ? 'ASC' : 'DESC';

    const { where, params, nextIdx } = buildWhereClause(queryParams);

    const countRes = await query(
        `SELECT COUNT(*) FROM tax_rates ${where}`, params
    );
    const total = parseInt(countRes.rows[0].count);

    const rows = await query(
        `SELECT id, name, percentage, description, is_active, created_at, updated_at
     FROM tax_rates ${where}
     ORDER BY ${sortBy} ${sortDir}
     LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
        [...params, pageSize, offset]
    );

    // Summary stats
    const stats = await query(`
    SELECT
      COUNT(*)                              AS total,
      COUNT(*) FILTER (WHERE is_active)     AS active,
      COUNT(*) FILTER (WHERE NOT is_active) AS inactive
    FROM tax_rates
  `);

    return {
        items: rows.rows,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        stats: stats.rows[0]
    };
}

async function getTaxRateById(id) {
    const res = await query(
        `SELECT * FROM tax_rates WHERE id = $1`, [id]
    );
    return res.rows[0] || null;
}

async function createTaxRate(data) {
    const { name, percentage, description, is_active = true } = data;
    if (!name || name.trim() === '') throw Object.assign(new Error('Tax name is required.'), { statusCode: 400 });
    if (percentage == null || isNaN(percentage)) throw Object.assign(new Error('Percentage is required.'), { statusCode: 400 });
    const pct = parseFloat(percentage);
    if (pct < 0 || pct > 100) throw Object.assign(new Error('Percentage must be 0–100.'), { statusCode: 400 });

    const res = await query(
        `INSERT INTO tax_rates (name, percentage, description, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
        [name.trim(), pct, description || null, Boolean(is_active)]
    );
    return res.rows[0];
}

async function updateTaxRate(id, data) {
    const existing = await getTaxRateById(id);
    if (!existing) throw Object.assign(new Error('Tax rate not found.'), { statusCode: 404 });

    const name = data.name !== undefined ? data.name.trim() : existing.name;
    const percentage = data.percentage !== undefined ? parseFloat(data.percentage) : parseFloat(existing.percentage);
    const description = data.description !== undefined ? data.description : existing.description;
    const is_active = data.is_active !== undefined ? Boolean(data.is_active) : existing.is_active;

    if (!name) throw Object.assign(new Error('Tax name is required.'), { statusCode: 400 });
    if (percentage < 0 || percentage > 100) throw Object.assign(new Error('Percentage must be 0–100.'), { statusCode: 400 });

    const res = await query(
        `UPDATE tax_rates
     SET name=$1, percentage=$2, description=$3, is_active=$4, updated_at=NOW()
     WHERE id=$5 RETURNING *`,
        [name, percentage, description || null, is_active, id]
    );
    return res.rows[0];
}

async function deleteTaxRate(id) {
    // Check if used in any invoice line
    const used = await query(
        `SELECT COUNT(*) FROM invoice_lines WHERE tax_rate_id = $1`, [id]
    );
    if (parseInt(used.rows[0].count) > 0) {
        throw Object.assign(
            new Error('Cannot delete: this tax rate is referenced on existing invoice lines.'),
            { statusCode: 409 }
        );
    }
    const res = await query(
        `DELETE FROM tax_rates WHERE id=$1 RETURNING *`, [id]
    );
    if (!res.rows[0]) throw Object.assign(new Error('Tax rate not found.'), { statusCode: 404 });
    return res.rows[0];
}

module.exports = { listTaxRates, getTaxRateById, createTaxRate, updateTaxRate, deleteTaxRate };
