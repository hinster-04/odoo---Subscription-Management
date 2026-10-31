const db = require('../../config/db');

/**
 * List quotation templates with search, filtering, and item previews
 */
async function getTemplates({
  search = '',
  status = 'all',
  page = 1,
  limit = 20
}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const whereConditions = [];
  const queryParams = [];

  if (search && search.trim()) {
    queryParams.push(`%${search.trim()}%`);
    const idx = queryParams.length;
    whereConditions.push(`(
      qt.template_name ILIKE $${idx} OR
      qt.description ILIKE $${idx} OR
      qt.customer_notes ILIKE $${idx}
    )`);
  }

  if (status !== 'all' && status !== '' && status !== undefined) {
    const isActiveBool = status === 'true' || status === true || status === 'active';
    queryParams.push(isActiveBool);
    whereConditions.push(`qt.is_active = $${queryParams.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Count
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM quotation_templates qt
    ${whereClause}
  `;
  const countRes = await db.query(countQuery, queryParams);
  const total = parseInt(countRes.rows[0].total, 10);
  const totalPages = Math.ceil(total / limitNum) || 1;

  // Data
  const dataParams = [...queryParams, limitNum, offset];
  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;

  const dataQuery = `
    SELECT
      qt.id,
      qt.template_name,
      qt.description,
      qt.validity_days,
      qt.customer_notes,
      qt.internal_notes,
      qt.is_active,
      qt.created_by,
      qt.created_at,
      qt.updated_at,
      adm.first_name AS creator_first_name,
      adm.last_name AS creator_last_name,
      COALESCE(items_summary.item_count, 0) AS item_count,
      COALESCE(items_summary.total_price, 0)::float AS total_price,
      items_summary.product_names
    FROM quotation_templates qt
    LEFT JOIN admin adm ON qt.created_by = adm.id
    LEFT JOIN (
      SELECT
        template_id,
        COUNT(*) AS item_count,
        SUM(quantity * unit_price) AS total_price,
        STRING_AGG(product_name, ' + ') AS product_names
      FROM quotation_template_items
      GROUP BY template_id
    ) items_summary ON items_summary.template_id = qt.id
    ${whereClause}
    ORDER BY qt.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const dataRes = await db.query(dataQuery, dataParams);

  return {
    data: dataRes.rows,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: totalPages
    }
  };
}

/**
 * Get single template with full items and addons
 */
async function getTemplateById(id) {
  const query = `
    SELECT
      qt.id,
      qt.template_name,
      qt.description,
      qt.validity_days,
      qt.customer_notes,
      qt.internal_notes,
      qt.is_active,
      qt.created_by,
      qt.created_at,
      qt.updated_at,
      adm.first_name AS creator_first_name,
      adm.last_name AS creator_last_name
    FROM quotation_templates qt
    LEFT JOIN admin adm ON qt.created_by = adm.id
    WHERE qt.id = $1
  `;

  const result = await db.query(query, [id]);
  if (result.rows.length === 0) {
    const error = new Error('Quotation template not found.');
    error.statusCode = 404;
    throw error;
  }

  const template = result.rows[0];

  const itemsQuery = `
    SELECT
      qti.id,
      qti.template_id,
      qti.product_id,
      qti.plan_id,
      qti.variant_id,
      qti.product_name,
      qti.plan_name,
      qti.variant_name,
      qti.quantity::float,
      qti.unit_price::float,
      qti.tax_rate::float,
      qti.discount_type,
      qti.discount_value::float,
      qti.sort_order,
      qti.created_at
    FROM quotation_template_items qti
    WHERE qti.template_id = $1
    ORDER BY qti.sort_order ASC, qti.created_at ASC
  `;
  const itemsRes = await db.query(itemsQuery, [id]);
  const items = itemsRes.rows;

  if (items.length > 0) {
    const itemIds = items.map(i => i.id);
    const addonsQuery = `
      SELECT
        qtia.id,
        qtia.template_item_id,
        qtia.addon_id,
        qtia.addon_name,
        qtia.quantity::float,
        qtia.unit_price::float,
        qtia.created_at
      FROM quotation_template_item_addons qtia
      WHERE qtia.template_item_id = ANY($1)
      ORDER BY qtia.created_at ASC
    `;
    const addonsRes = await db.query(addonsQuery, [itemIds]);
    const addonsMap = {};
    addonsRes.rows.forEach(a => {
      if (!addonsMap[a.template_item_id]) addonsMap[a.template_item_id] = [];
      addonsMap[a.template_item_id].push(a);
    });

    items.forEach(i => {
      i.addons = addonsMap[i.id] || [];
    });
  }

  return {
    ...template,
    items
  };
}

/**
 * Create a new quotation template in an atomic transaction
 */
async function createTemplate(data, creatorAuthId = null) {
  const {
    template_name,
    description = '',
    validity_days = 30,
    customer_notes = '',
    internal_notes = '',
    is_active = true,
    items = []
  } = data;

  if (!template_name || !template_name.trim()) {
    const error = new Error('Template name is required.');
    error.statusCode = 400;
    throw error;
  }

  const validity = parseInt(validity_days, 10);
  if (isNaN(validity) || validity <= 0) {
    const error = new Error('Validity days must be a positive integer.');
    error.statusCode = 400;
    throw error;
  }

  return db.transaction(async (client) => {
    let adminId = null;
    if (creatorAuthId) {
      const adm = await client.query('SELECT id FROM admin WHERE auth_id = $1', [creatorAuthId]);
      if (adm.rows.length > 0) adminId = adm.rows[0].id;
    }
    if (!adminId) {
      const defaultAdmin = await client.query('SELECT id FROM admin LIMIT 1');
      if (defaultAdmin.rows.length > 0) adminId = defaultAdmin.rows[0].id;
    }

    const insertTemplateQuery = `
      INSERT INTO quotation_templates (
        template_name,
        description,
        validity_days,
        customer_notes,
        internal_notes,
        is_active,
        created_by,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const tmplRes = await client.query(insertTemplateQuery, [
      template_name.trim(),
      description ? description.trim() : null,
      validity,
      customer_notes ? customer_notes.trim() : null,
      internal_notes ? internal_notes.trim() : null,
      is_active !== false,
      adminId
    ]);

    const createdTemplate = tmplRes.rows[0];
    const createdItems = [];

    if (Array.isArray(items) && items.length > 0) {
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const productName = (item.product_name || item.name || '').trim();
        if (productName) {
          const qty = Math.max(1, parseFloat(item.quantity) || 1);
          const price = Math.max(0, parseFloat(item.unit_price) || 0);
          const tax = Math.max(0, parseFloat(item.tax_rate) || 0);

          const itemRes = await client.query(
            `INSERT INTO quotation_template_items (
              template_id, product_id, plan_id, variant_id,
              product_name, plan_name, variant_name,
              quantity, unit_price, tax_rate, discount_type, discount_value,
              sort_order, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
            RETURNING *`,
            [
              createdTemplate.id,
              item.product_id || null,
              item.plan_id || null,
              item.variant_id || null,
              productName,
              item.plan_name ? item.plan_name.trim() : null,
              item.variant_name ? item.variant_name.trim() : null,
              qty,
              price,
              tax,
              item.discount_type === 'percentage' ? 'percentage' : 'fixed',
              parseFloat(item.discount_value) || 0,
              idx
            ]
          );

          const createdItem = itemRes.rows[0];
          const createdAddons = [];

          if (Array.isArray(item.addons)) {
            for (const addon of item.addons) {
              const addonName = (addon.addon_name || addon.name || '').trim();
              if (addonName) {
                const aRes = await client.query(
                  `INSERT INTO quotation_template_item_addons (
                    template_item_id, addon_id, addon_name,
                    quantity, unit_price, created_at
                  )
                  VALUES ($1, $2, $3, $4, $5, NOW())
                  RETURNING *`,
                  [
                    createdItem.id,
                    addon.addon_id || null,
                    addonName,
                    Math.max(1, parseFloat(addon.quantity) || 1),
                    Math.max(0, parseFloat(addon.unit_price || addon.price) || 0)
                  ]
                );
                createdAddons.push(aRes.rows[0]);
              }
            }
          }

          createdItems.push({
            ...createdItem,
            addons: createdAddons
          });
        }
      }
    }

    return {
      ...createdTemplate,
      items: createdItems
    };
  });
}

/**
 * Update an existing quotation template
 */
async function updateTemplate(id, data) {
  const existing = await db.query('SELECT * FROM quotation_templates WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    const error = new Error('Quotation template not found.');
    error.statusCode = 404;
    throw error;
  }

  const current = existing.rows[0];
  const {
    template_name = current.template_name,
    description = current.description,
    validity_days = current.validity_days,
    customer_notes = current.customer_notes,
    internal_notes = current.internal_notes,
    is_active = current.is_active,
    items
  } = data;

  return db.transaction(async (client) => {
    const updateHeaderQuery = `
      UPDATE quotation_templates
      SET
        template_name = $1,
        description = $2,
        validity_days = $3,
        customer_notes = $4,
        internal_notes = $5,
        is_active = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;

    const updatedTmplRes = await client.query(updateHeaderQuery, [
      template_name.trim(),
      description ? description.trim() : null,
      parseInt(validity_days, 10) || current.validity_days,
      customer_notes ? customer_notes.trim() : null,
      internal_notes ? internal_notes.trim() : null,
      is_active !== false,
      id
    ]);

    if (Array.isArray(items)) {
      // Replace items
      await client.query('DELETE FROM quotation_template_items WHERE template_id = $1', [id]);

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const productName = (item.product_name || item.name || '').trim();
        if (productName) {
          const qty = Math.max(1, parseFloat(item.quantity) || 1);
          const price = Math.max(0, parseFloat(item.unit_price) || 0);
          const tax = Math.max(0, parseFloat(item.tax_rate) || 0);

          const itemRes = await client.query(
            `INSERT INTO quotation_template_items (
              template_id, product_id, plan_id, variant_id,
              product_name, plan_name, variant_name,
              quantity, unit_price, tax_rate, discount_type, discount_value,
              sort_order, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
            RETURNING *`,
            [
              id,
              item.product_id || null,
              item.plan_id || null,
              item.variant_id || null,
              productName,
              item.plan_name ? item.plan_name.trim() : null,
              item.variant_name ? item.variant_name.trim() : null,
              qty,
              price,
              tax,
              item.discount_type === 'percentage' ? 'percentage' : 'fixed',
              parseFloat(item.discount_value) || 0,
              idx
            ]
          );

          const createdItem = itemRes.rows[0];

          if (Array.isArray(item.addons)) {
            for (const addon of item.addons) {
              const addonName = (addon.addon_name || addon.name || '').trim();
              if (addonName) {
                await client.query(
                  `INSERT INTO quotation_template_item_addons (
                    template_item_id, addon_id, addon_name,
                    quantity, unit_price, created_at
                  )
                  VALUES ($1, $2, $3, $4, $5, NOW())`,
                  [
                    createdItem.id,
                    addon.addon_id || null,
                    addonName,
                    Math.max(1, parseFloat(addon.quantity) || 1),
                    Math.max(0, parseFloat(addon.unit_price || addon.price) || 0)
                  ]
                );
              }
            }
          }
        }
      }
    }

    return updatedTmplRes.rows[0];
  });
}

/**
 * Toggle template active status
 */
async function toggleTemplateStatus(id, isActive) {
  const query = `
    UPDATE quotation_templates
    SET is_active = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;
  const result = await db.query(query, [Boolean(isActive), id]);
  if (result.rows.length === 0) {
    const error = new Error('Quotation template not found.');
    error.statusCode = 404;
    throw error;
  }
  return result.rows[0];
}

/**
 * Delete a quotation template
 */
async function deleteTemplate(id) {
  const check = await db.query('SELECT id FROM quotation_templates WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    const error = new Error('Quotation template not found.');
    error.statusCode = 404;
    throw error;
  }

  // quotation_template_items and quotation_template_item_addons will cascade delete
  await db.query('DELETE FROM quotation_templates WHERE id = $1', [id]);
  return { success: true, message: 'Template deleted successfully.' };
}

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  toggleTemplateStatus,
  deleteTemplate
};
