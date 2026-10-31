const { query, transaction } = require('../../config/db');

// ── Helpers ──────────────────────────────────────────────────────────────────
function validate(data) {
    const errors = [];
    if (!data.name || !data.name.trim()) errors.push('Name is required.');
    if (!['fixed', 'percentage'].includes(data.discount_type)) errors.push("discount_type must be 'fixed' or 'percentage'.");
    const val = parseFloat(data.discount_value);
    if (isNaN(val) || val < 0) errors.push('discount_value must be >= 0.');
    if (data.discount_type === 'percentage' && val > 100) errors.push('Percentage discount cannot exceed 100.');
    if (data.end_date && data.start_date && new Date(data.end_date) < new Date(data.start_date))
        errors.push('end_date cannot be before start_date.');
    if (data.usage_limit !== undefined && data.usage_limit !== null && parseInt(data.usage_limit) <= 0)
        errors.push('usage_limit must be a positive integer.');
    if (errors.length) throw Object.assign(new Error(errors.join(' ')), { statusCode: 400 });
}

async function listDiscounts(queryParams) {
    const page = Math.max(1, parseInt(queryParams.page || 1));
    const pageSize = Math.min(100, Math.max(1, parseInt(queryParams.pageSize || 20)));
    const offset = (page - 1) * pageSize;
    const sortBy = ['name', 'discount_type', 'discount_value', 'usage_count', 'created_at', 'end_date'].includes(queryParams.sortBy)
        ? queryParams.sortBy : 'created_at';
    const sortDir = queryParams.sortDir === 'asc' ? 'ASC' : 'DESC';

    const conditions = [];
    const params = [];
    let idx = 1;

    if (queryParams.search) {
        conditions.push(`(d.name ILIKE $${idx} OR d.description ILIKE $${idx})`);
        params.push(`%${queryParams.search}%`); idx++;
    }
    if (queryParams.status === 'active') conditions.push(`d.is_active = TRUE`);
    if (queryParams.status === 'inactive') conditions.push(`d.is_active = FALSE`);
    if (queryParams.type) {
        conditions.push(`d.discount_type = $${idx}`);
        params.push(queryParams.type); idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) FROM discounts d ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    const rows = await query(
        `SELECT d.*,
       COALESCE(
         json_agg(dp.product_id) FILTER (WHERE dp.product_id IS NOT NULL),
         '[]'
       ) AS product_ids
     FROM discounts d
     LEFT JOIN discount_products dp ON dp.discount_id = d.id
     ${where}
     GROUP BY d.id
     ORDER BY d.${sortBy} ${sortDir}
     LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, pageSize, offset]
    );

    const stats = await query(`
    SELECT
      COUNT(*)                                                AS total,
      COUNT(*) FILTER (WHERE is_active)                       AS active,
      COUNT(*) FILTER (WHERE NOT is_active)                   AS expired,
      COALESCE(SUM(usage_count), 0)                           AS total_usage
    FROM discounts
  `);

    return {
        items: rows.rows,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        stats: stats.rows[0]
    };
}

async function getDiscountById(id) {
    const res = await query(
        `SELECT d.*,
       COALESCE(
         json_agg(json_build_object('product_id', dp.product_id, 'name', p.name))
         FILTER (WHERE dp.product_id IS NOT NULL), '[]'
       ) AS products
     FROM discounts d
     LEFT JOIN discount_products dp ON dp.discount_id = d.id
     LEFT JOIN products p ON p.id = dp.product_id
     WHERE d.id = $1
     GROUP BY d.id`,
        [id]
    );
    return res.rows[0] || null;
}

async function createDiscount(data) {
    validate(data);
    const {
        name, description, discount_type, discount_value,
        min_purchase_amount = 0, min_quantity = 1,
        start_date = null, end_date = null, usage_limit = null,
        applies_to = 'all', is_active = true,
        product_ids = []
    } = data;

    return transaction(async (client) => {
        const res = await client.query(
            `INSERT INTO discounts
         (name,description,discount_type,discount_value,min_purchase_amount,
          min_quantity,start_date,end_date,usage_limit,applies_to,is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
            [name.trim(), description || null, discount_type, parseFloat(discount_value),
            parseFloat(min_purchase_amount), parseInt(min_quantity) || 1,
            start_date || null, end_date || null,
            usage_limit ? parseInt(usage_limit) : null,
                applies_to, Boolean(is_active)]
        );
        const discount = res.rows[0];

        if (applies_to === 'products' && Array.isArray(product_ids) && product_ids.length) {
            for (const pid of product_ids) {
                await client.query(
                    `INSERT INTO discount_products (discount_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
                    [discount.id, pid]
                );
            }
        }
        return discount;
    });
}

async function updateDiscount(id, data) {
    const existing = await getDiscountById(id);
    if (!existing) throw Object.assign(new Error('Discount not found.'), { statusCode: 404 });
    validate({ ...existing, ...data });

    const {
        name = existing.name,
        description = existing.description,
        discount_type = existing.discount_type,
        discount_value = existing.discount_value,
        min_purchase_amount = existing.min_purchase_amount,
        min_quantity = existing.min_quantity,
        start_date = existing.start_date,
        end_date = existing.end_date,
        usage_limit = existing.usage_limit,
        applies_to = existing.applies_to,
        is_active = existing.is_active,
        product_ids = []
    } = data;

    return transaction(async (client) => {
        const res = await client.query(
            `UPDATE discounts SET
         name=$1, description=$2, discount_type=$3, discount_value=$4,
         min_purchase_amount=$5, min_quantity=$6, start_date=$7, end_date=$8,
         usage_limit=$9, applies_to=$10, is_active=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
            [name.trim(), description || null, discount_type, parseFloat(discount_value),
            parseFloat(min_purchase_amount), parseInt(min_quantity) || 1,
            start_date || null, end_date || null,
            usage_limit ? parseInt(usage_limit) : null,
                applies_to, Boolean(is_active), id]
        );

        // Refresh product links
        await client.query(`DELETE FROM discount_products WHERE discount_id=$1`, [id]);
        if (applies_to === 'products' && Array.isArray(product_ids) && product_ids.length) {
            for (const pid of product_ids) {
                await client.query(
                    `INSERT INTO discount_products (discount_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
                    [id, pid]
                );
            }
        }
        return res.rows[0];
    });
}

async function deleteDiscount(id) {
    // Check if referenced by any invoice line
    const used = await query(
        `SELECT COUNT(*) FROM invoice_lines WHERE discount_id = $1`, [id]
    );
    if (parseInt(used.rows[0].count) > 0)
        throw Object.assign(
            new Error('Cannot delete: discount is referenced on existing invoice lines.'),
            { statusCode: 409 }
        );
    const res = await query(`DELETE FROM discounts WHERE id=$1 RETURNING *`, [id]);
    if (!res.rows[0]) throw Object.assign(new Error('Discount not found.'), { statusCode: 404 });
    return res.rows[0];
}

/**
 * Find an applicable discount for a given product/amount/quantity.
 * Used by invoice generation service.
 */
async function findApplicableDiscount({ product_id, amount, quantity = 1 }) {
    const today = new Date().toISOString().split('T')[0];
    const res = await query(
        `SELECT d.* FROM discounts d
     LEFT JOIN discount_products dp ON dp.discount_id = d.id
     WHERE d.is_active = TRUE
       AND (d.start_date IS NULL OR d.start_date <= $1)
       AND (d.end_date   IS NULL OR d.end_date   >= $1)
       AND (d.usage_limit IS NULL OR d.usage_count < d.usage_limit)
       AND (d.min_purchase_amount <= $2)
       AND (d.min_quantity <= $3)
       AND (d.applies_to = 'all' OR dp.product_id = $4)
     ORDER BY d.discount_value DESC
     LIMIT 1`,
        [today, parseFloat(amount), parseInt(quantity), product_id]
    );
    return res.rows[0] || null;
}

async function incrementUsageCount(id, client) {
    const q = client ? client.query.bind(client) : query;
    await q(`UPDATE discounts SET usage_count = usage_count + 1 WHERE id = $1`, [id]);
}

module.exports = {
    listDiscounts, getDiscountById, createDiscount,
    updateDiscount, deleteDiscount,
    findApplicableDiscount, incrementUsageCount
};
