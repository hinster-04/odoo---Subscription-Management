const db = require('../../config/db');

/**
 * Generate the next sequential quotation number in the format QUO-YYYY-XXXX
 */
async function generateNextQuotationNumber(client = db) {
  const currentYear = new Date().getFullYear();
  const prefix = `QUO-${currentYear}-`;

  const result = await client.query(
    `SELECT quotation_number 
     FROM quotations 
     WHERE quotation_number LIKE $1 
     ORDER BY quotation_number DESC 
     LIMIT 1`,
    [`${prefix}%`]
  );

  if (result.rows.length === 0) {
    return `${prefix}0001`;
  }

  const lastNumber = result.rows[0].quotation_number;
  const match = lastNumber.match(/(\d+)$/);
  if (!match) {
    return `${prefix}0001`;
  }

  const nextSeq = parseInt(match[1], 10) + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

/**
 * List quotations with search, filters, pagination, sorting and KPIs
 */
async function getQuotations({
  search = '',
  status = 'all',
  customer_id = '',
  sort_by = 'created_at',
  sort_order = 'desc',
  page = 1,
  limit = 10
}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;

  const allowedSortColumns = {
    quotation_number: 'q.quotation_number',
    customer: 'u.first_name',
    business_name: 'u.business_name',
    date: 'q.quotation_date',
    valid_until: 'q.valid_until',
    total_amount: 'q.total_amount',
    status: 'q.status',
    created_at: 'q.created_at'
  };

  const sortColumn = allowedSortColumns[sort_by] || 'q.created_at';
  const sortDirection = (sort_order || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereConditions = [];
  const queryParams = [];

  if (search && search.trim()) {
    queryParams.push(`%${search.trim()}%`);
    const idx = queryParams.length;
    whereConditions.push(`(
      q.quotation_number ILIKE $${idx} OR
      u.first_name ILIKE $${idx} OR
      u.last_name ILIKE $${idx} OR
      u.business_name ILIKE $${idx} OR
      a.email ILIKE $${idx}
    )`);
  }

  if (status && status !== 'all') {
    queryParams.push(status.toLowerCase().trim());
    whereConditions.push(`LOWER(q.status) = $${queryParams.length}`);
  }

  if (customer_id && customer_id.trim()) {
    queryParams.push(customer_id.trim());
    whereConditions.push(`q.customer_id = $${queryParams.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 1. Total count
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM quotations q
    JOIN users u ON q.customer_id = u.id
    LEFT JOIN auth a ON u.auth_id = a.id
    ${whereClause}
  `;
  const countResult = await db.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(total / limitNum) || 1;

  // 2. Data list
  const dataParams = [...queryParams, limitNum, offset];
  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;

  const dataQuery = `
    SELECT
      q.id,
      q.quotation_number,
      q.customer_id,
      q.template_id,
      q.created_by,
      TO_CHAR(q.quotation_date, 'YYYY-MM-DD') AS quotation_date,
      TO_CHAR(q.valid_until, 'YYYY-MM-DD') AS valid_until,
      q.payment_terms,
      q.subtotal::float,
      q.discount_amount::float,
      q.tax_amount::float,
      q.total_amount::float,
      q.status,
      q.customer_notes,
      q.internal_notes,
      q.sent_at,
      q.accepted_at,
      q.rejected_at,
      q.created_at,
      q.updated_at,
      u.first_name AS customer_first_name,
      u.last_name AS customer_last_name,
      u.business_name,
      a.email AS customer_email,
      u.phone AS customer_phone,
      u.city AS customer_city,
      COALESCE(items_summary.item_count, 0) AS item_count,
      s.id AS converted_subscription_id,
      s.subscription_number AS converted_subscription_number
    FROM quotations q
    JOIN users u ON q.customer_id = u.id
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN (
      SELECT quotation_id, COUNT(*) AS item_count
      FROM quotation_items
      GROUP BY quotation_id
    ) items_summary ON items_summary.quotation_id = q.id
    LEFT JOIN subscriptions s ON s.quotation_id = q.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const dataResult = await db.query(dataQuery, dataParams);

  // 3. Status summary metrics
  const summaryQuery = `
    SELECT
      COUNT(*) AS total_quotations,
      COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
      COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
      COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_count,
      COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
      COUNT(*) FILTER (WHERE status = 'expired') AS expired_count,
      COUNT(*) FILTER (WHERE status = 'converted') AS converted_count,
      COALESCE(SUM(total_amount), 0)::float AS total_pipeline_value
    FROM quotations
  `;
  const summaryResult = await db.query(summaryQuery);

  return {
    data: dataResult.rows,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: totalPages,
      summary: summaryResult.rows[0]
    }
  };
}

/**
 * Get single quotation with complete details, line items and item add-ons
 */
async function getQuotationById(id) {
  const query = `
    SELECT
      q.id,
      q.quotation_number,
      q.customer_id,
      q.template_id,
      q.created_by,
      TO_CHAR(q.quotation_date, 'YYYY-MM-DD') AS quotation_date,
      TO_CHAR(q.valid_until, 'YYYY-MM-DD') AS valid_until,
      q.payment_terms,
      q.subtotal::float,
      q.discount_amount::float,
      q.tax_amount::float,
      q.total_amount::float,
      q.status,
      q.customer_notes,
      q.internal_notes,
      q.sent_at,
      q.accepted_at,
      q.rejected_at,
      q.created_at,
      q.updated_at,
      u.first_name AS customer_first_name,
      u.last_name AS customer_last_name,
      u.business_name,
      a.email AS customer_email,
      u.phone AS customer_phone,
      u.address AS customer_address,
      u.city AS customer_city,
      u.state AS customer_state,
      u.country AS customer_country,
      u.postal_code AS customer_postal_code,
      adm.first_name AS creator_first_name,
      adm.last_name AS creator_last_name,
      s.id AS converted_subscription_id,
      s.subscription_number AS converted_subscription_number
    FROM quotations q
    JOIN users u ON q.customer_id = u.id
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN admin adm ON q.created_by = adm.id
    LEFT JOIN subscriptions s ON s.quotation_id = q.id
    WHERE q.id = $1
  `;

  const result = await db.query(query, [id]);
  if (result.rows.length === 0) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  const quotation = result.rows[0];

  // Fetch line items
  const itemsQuery = `
    SELECT
      qi.id,
      qi.quotation_id,
      qi.product_id,
      qi.plan_id,
      qi.variant_id,
      qi.product_name,
      qi.plan_name,
      qi.variant_name,
      qi.billing_frequency,
      qi.quantity::float,
      qi.unit_price::float,
      qi.tax_rate::float,
      qi.tax_amount::float,
      qi.discount_type,
      qi.discount_value::float,
      qi.discount_amount::float,
      qi.total_amount::float,
      qi.created_at,
      qi.updated_at
    FROM quotation_items qi
    WHERE qi.quotation_id = $1
    ORDER BY qi.created_at ASC
  `;
  const itemsResult = await db.query(itemsQuery, [id]);
  const items = itemsResult.rows;

  // Fetch add-ons for all items
  if (items.length > 0) {
    const itemIds = items.map(i => i.id);
    const addonsQuery = `
      SELECT
        qia.id,
        qia.quotation_item_id,
        qia.addon_id,
        qia.addon_name,
        qia.quantity::float,
        qia.unit_price::float,
        qia.tax_rate::float,
        qia.tax_amount::float,
        qia.total_amount::float,
        qia.created_at
      FROM quotation_item_addons qia
      WHERE qia.quotation_item_id = ANY($1)
      ORDER BY qia.created_at ASC
    `;
    const addonsResult = await db.query(addonsQuery, [itemIds]);

    const addonsMap = {};
    addonsResult.rows.forEach(a => {
      if (!addonsMap[a.quotation_item_id]) {
        addonsMap[a.quotation_item_id] = [];
      }
      addonsMap[a.quotation_item_id].push(a);
    });

    items.forEach(i => {
      i.addons = addonsMap[i.id] || [];
    });
  }

  return {
    ...quotation,
    items
  };
}

/**
 * Create a new quotation in an atomic transaction
 */
async function createQuotation(data, creatorAuthId = null) {
  const {
    customer_id,
    template_id = null,
    quotation_date = new Date().toISOString().split('T')[0],
    valid_until,
    payment_terms = 'Net 30',
    customer_notes = '',
    internal_notes = '',
    status = 'draft',
    items = []
  } = data;

  if (!customer_id) {
    const error = new Error('Customer is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!valid_until) {
    const error = new Error('Valid until date is required.');
    error.statusCode = 400;
    throw error;
  }

  if (new Date(valid_until) < new Date(quotation_date)) {
    const error = new Error('Valid until date cannot be earlier than quotation date.');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('At least one item is required in the quotation.');
    error.statusCode = 400;
    throw error;
  }

  return db.transaction(async (client) => {
    // 1. Verify customer exists
    const customerCheck = await client.query('SELECT id FROM users WHERE id = $1', [customer_id]);
    if (customerCheck.rows.length === 0) {
      const error = new Error('Selected customer does not exist.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Resolve creator admin ID if available
    let adminId = null;
    if (creatorAuthId) {
      const adminRes = await client.query('SELECT id FROM admin WHERE auth_id = $1', [creatorAuthId]);
      if (adminRes.rows.length > 0) {
        adminId = adminRes.rows[0].id;
      }
    }
    if (!adminId) {
      // Default to first admin in system if not found
      const defaultAdmin = await client.query('SELECT id FROM admin LIMIT 1');
      if (defaultAdmin.rows.length > 0) {
        adminId = defaultAdmin.rows[0].id;
      }
    }

    // 3. Compute item totals & quotation amounts
    let calculatedSubtotal = 0;
    let calculatedTaxTotal = 0;
    let calculatedDiscountTotal = 0;

    const processedItems = items.map((item, idx) => {
      const productName = (item.product_name || item.name || '').trim();
      if (!productName) {
        const err = new Error(`Item at row ${idx + 1} must have a product name.`);
        err.statusCode = 400;
        throw err;
      }

      const qty = Math.max(1, parseFloat(item.quantity) || 1);
      const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
      const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);
      const discountType = item.discount_type === 'percentage' ? 'percentage' : 'fixed';
      const discountValue = Math.max(0, parseFloat(item.discount_value) || 0);

      const itemBase = qty * unitPrice;
      let itemDiscount = 0;
      if (discountType === 'percentage') {
        itemDiscount = (itemBase * Math.min(100, discountValue)) / 100;
      } else {
        itemDiscount = Math.min(itemBase, discountValue);
      }

      const itemTaxable = Math.max(0, itemBase - itemDiscount);
      const itemTax = (itemTaxable * taxRate) / 100;
      const itemTotal = itemTaxable + itemTax;

      calculatedSubtotal += itemBase;
      calculatedDiscountTotal += itemDiscount;
      calculatedTaxTotal += itemTax;

      return {
        product_id: item.product_id || null,
        plan_id: item.plan_id || null,
        variant_id: item.variant_id || null,
        product_name: productName,
        plan_name: item.plan_name ? item.plan_name.trim() : null,
        variant_name: item.variant_name ? item.variant_name.trim() : null,
        billing_frequency: item.billing_frequency || 'monthly',
        quantity: qty,
        unit_price: unitPrice,
        tax_rate: taxRate,
        tax_amount: parseFloat(itemTax.toFixed(2)),
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: parseFloat(itemDiscount.toFixed(2)),
        total_amount: parseFloat(itemTotal.toFixed(2)),
        addons: Array.isArray(item.addons) ? item.addons : []
      };
    });

    const quotationTotal = Math.max(0, calculatedSubtotal - calculatedDiscountTotal + calculatedTaxTotal);

    // 4. Generate quotation number
    const quotationNumber = await generateNextQuotationNumber(client);

    // 5. Insert quotation header
    const insertQuotationQuery = `
      INSERT INTO quotations (
        quotation_number,
        customer_id,
        template_id,
        created_by,
        quotation_date,
        valid_until,
        payment_terms,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        status,
        customer_notes,
        internal_notes,
        sent_at,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        CASE WHEN $12 = 'sent' THEN NOW() ELSE NULL END,
        NOW(), NOW()
      )
      RETURNING *
    `;

    const quoteRes = await client.query(insertQuotationQuery, [
      quotationNumber,
      customer_id,
      template_id,
      adminId,
      quotation_date,
      valid_until,
      payment_terms,
      parseFloat(calculatedSubtotal.toFixed(2)),
      parseFloat(calculatedDiscountTotal.toFixed(2)),
      parseFloat(calculatedTaxTotal.toFixed(2)),
      parseFloat(quotationTotal.toFixed(2)),
      status,
      customer_notes,
      internal_notes
    ]);

    const createdQuotation = quoteRes.rows[0];

    // 6. Insert items & add-ons
    const createdItems = [];
    for (const item of processedItems) {
      const itemRes = await client.query(
        `INSERT INTO quotation_items (
          quotation_id, product_id, plan_id, variant_id,
          product_name, plan_name, variant_name, billing_frequency,
          quantity, unit_price, tax_rate, tax_amount,
          discount_type, discount_value, discount_amount, total_amount,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        RETURNING *`,
        [
          createdQuotation.id,
          item.product_id,
          item.plan_id,
          item.variant_id,
          item.product_name,
          item.plan_name,
          item.variant_name,
          item.billing_frequency,
          item.quantity,
          item.unit_price,
          item.tax_rate,
          item.tax_amount,
          item.discount_type,
          item.discount_value,
          item.discount_amount,
          item.total_amount
        ]
      );

      const createdItem = itemRes.rows[0];
      const createdAddons = [];

      for (const addon of item.addons) {
        const addonName = (addon.addon_name || addon.name || '').trim();
        if (addonName) {
          const aQty = Math.max(1, parseFloat(addon.quantity) || 1);
          const aPrice = Math.max(0, parseFloat(addon.unit_price || addon.price) || 0);
          const aTaxRate = Math.max(0, parseFloat(addon.tax_rate) || 0);
          const aTaxAmount = (aQty * aPrice * aTaxRate) / 100;
          const aTotal = (aQty * aPrice) + aTaxAmount;

          const addRes = await client.query(
            `INSERT INTO quotation_item_addons (
              quotation_item_id, addon_id, addon_name,
              quantity, unit_price, tax_rate, tax_amount, total_amount,
              created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING *`,
            [
              createdItem.id,
              addon.addon_id || null,
              addonName,
              aQty,
              aPrice,
              aTaxRate,
              parseFloat(aTaxAmount.toFixed(2)),
              parseFloat(aTotal.toFixed(2))
            ]
          );
          createdAddons.push(addRes.rows[0]);
        }
      }

      createdItems.push({
        ...createdItem,
        addons: createdAddons
      });
    }

    return {
      ...createdQuotation,
      items: createdItems
    };
  });
}

/**
 * Update quotation header and line items
 */
async function updateQuotation(id, data) {
  const existing = await db.query('SELECT * FROM quotations WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  const current = existing.rows[0];
  if (current.status === 'converted') {
    const error = new Error('Cannot edit a quotation that has already been converted to a subscription.');
    error.statusCode = 400;
    throw error;
  }

  const {
    customer_id = current.customer_id,
    template_id = current.template_id,
    quotation_date = current.quotation_date,
    valid_until = current.valid_until,
    payment_terms = current.payment_terms,
    customer_notes = current.customer_notes,
    internal_notes = current.internal_notes,
    status = current.status,
    items
  } = data;

  return db.transaction(async (client) => {
    // If items are provided, recalculate amounts and replace items
    let subtotal = current.subtotal;
    let discountAmount = current.discount_amount;
    let taxAmount = current.tax_amount;
    let totalAmount = current.total_amount;

    if (Array.isArray(items) && items.length > 0) {
      let calculatedSubtotal = 0;
      let calculatedTaxTotal = 0;
      let calculatedDiscountTotal = 0;

      const processedItems = items.map((item, idx) => {
        const productName = (item.product_name || item.name || '').trim();
        if (!productName) {
          const err = new Error(`Item at row ${idx + 1} must have a product name.`);
          err.statusCode = 400;
          throw err;
        }

        const qty = Math.max(1, parseFloat(item.quantity) || 1);
        const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
        const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);
        const discountType = item.discount_type === 'percentage' ? 'percentage' : 'fixed';
        const discountValue = Math.max(0, parseFloat(item.discount_value) || 0);

        const itemBase = qty * unitPrice;
        let itemDiscount = 0;
        if (discountType === 'percentage') {
          itemDiscount = (itemBase * Math.min(100, discountValue)) / 100;
        } else {
          itemDiscount = Math.min(itemBase, discountValue);
        }

        const itemTaxable = Math.max(0, itemBase - itemDiscount);
        const itemTax = (itemTaxable * taxRate) / 100;
        const itemTotal = itemTaxable + itemTax;

        calculatedSubtotal += itemBase;
        calculatedDiscountTotal += itemDiscount;
        calculatedTaxTotal += itemTax;

        return {
          product_id: item.product_id || null,
          plan_id: item.plan_id || null,
          variant_id: item.variant_id || null,
          product_name: productName,
          plan_name: item.plan_name ? item.plan_name.trim() : null,
          variant_name: item.variant_name ? item.variant_name.trim() : null,
          billing_frequency: item.billing_frequency || 'monthly',
          quantity: qty,
          unit_price: unitPrice,
          tax_rate: taxRate,
          tax_amount: parseFloat(itemTax.toFixed(2)),
          discount_type: discountType,
          discount_value: discountValue,
          discount_amount: parseFloat(itemDiscount.toFixed(2)),
          total_amount: parseFloat(itemTotal.toFixed(2)),
          addons: Array.isArray(item.addons) ? item.addons : []
        };
      });

      subtotal = parseFloat(calculatedSubtotal.toFixed(2));
      discountAmount = parseFloat(calculatedDiscountTotal.toFixed(2));
      taxAmount = parseFloat(calculatedTaxTotal.toFixed(2));
      totalAmount = parseFloat((subtotal - discountAmount + taxAmount).toFixed(2));

      // Delete old items (quotation_item_addons cascade delete)
      await client.query('DELETE FROM quotation_items WHERE quotation_id = $1', [id]);

      // Re-insert items
      for (const item of processedItems) {
        const itemRes = await client.query(
          `INSERT INTO quotation_items (
            quotation_id, product_id, plan_id, variant_id,
            product_name, plan_name, variant_name, billing_frequency,
            quantity, unit_price, tax_rate, tax_amount,
            discount_type, discount_value, discount_amount, total_amount,
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
          RETURNING *`,
          [
            id,
            item.product_id,
            item.plan_id,
            item.variant_id,
            item.product_name,
            item.plan_name,
            item.variant_name,
            item.billing_frequency,
            item.quantity,
            item.unit_price,
            item.tax_rate,
            item.tax_amount,
            item.discount_type,
            item.discount_value,
            item.discount_amount,
            item.total_amount
          ]
        );

        const createdItem = itemRes.rows[0];

        for (const addon of item.addons) {
          const addonName = (addon.addon_name || addon.name || '').trim();
          if (addonName) {
            const aQty = Math.max(1, parseFloat(addon.quantity) || 1);
            const aPrice = Math.max(0, parseFloat(addon.unit_price || addon.price) || 0);
            const aTaxRate = Math.max(0, parseFloat(addon.tax_rate) || 0);
            const aTaxAmount = (aQty * aPrice * aTaxRate) / 100;
            const aTotal = (aQty * aPrice) + aTaxAmount;

            await client.query(
              `INSERT INTO quotation_item_addons (
                quotation_item_id, addon_id, addon_name,
                quantity, unit_price, tax_rate, tax_amount, total_amount,
                created_at
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
              [
                createdItem.id,
                addon.addon_id || null,
                addonName,
                aQty,
                aPrice,
                aTaxRate,
                parseFloat(aTaxAmount.toFixed(2)),
                parseFloat(aTotal.toFixed(2))
              ]
            );
          }
        }
      }
    }

    // Update header
    const updateHeaderQuery = `
      UPDATE quotations
      SET
        customer_id = $1,
        template_id = $2,
        quotation_date = $3,
        valid_until = $4,
        payment_terms = $5,
        subtotal = $6,
        discount_amount = $7,
        tax_amount = $8,
        total_amount = $9,
        status = $10,
        customer_notes = $11,
        internal_notes = $12,
        updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `;

    const updatedQuoteRes = await client.query(updateHeaderQuery, [
      customer_id,
      template_id,
      quotation_date,
      valid_until,
      payment_terms,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      status,
      customer_notes,
      internal_notes,
      id
    ]);

    return updatedQuoteRes.rows[0];
  });
}

/**
 * Update quotation status with timestamp records
 */
async function updateQuotationStatus(id, newStatus) {
  const allowed = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'];
  const normalized = (newStatus || '').toLowerCase().trim();

  if (!allowed.includes(normalized)) {
    const error = new Error(`Invalid status "${newStatus}". Must be one of: ${allowed.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const query = `
    UPDATE quotations
    SET
      status = $1,
      sent_at = CASE WHEN $1 = 'sent' AND sent_at IS NULL THEN NOW() ELSE sent_at END,
      accepted_at = CASE WHEN $1 = 'accepted' AND accepted_at IS NULL THEN NOW() ELSE accepted_at END,
      rejected_at = CASE WHEN $1 = 'rejected' AND rejected_at IS NULL THEN NOW() ELSE rejected_at END,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;

  const result = await db.query(query, [normalized, id]);
  if (result.rows.length === 0) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

/**
 * Delete a quotation (only if not converted)
 */
async function deleteQuotation(id) {
  const check = await db.query('SELECT status FROM quotations WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    const error = new Error('Quotation not found.');
    error.statusCode = 404;
    throw error;
  }

  if (check.rows[0].status === 'converted') {
    const error = new Error('Cannot delete a quotation that has been converted to an active subscription.');
    error.statusCode = 400;
    throw error;
  }

  await db.query('DELETE FROM quotations WHERE id = $1', [id]);
  return { success: true, message: 'Quotation deleted successfully.' };
}

/**
 * Convert an accepted quotation directly into a Subscription!
 */
async function convertQuotationToSubscription(quotationId, creatorAuthId = null) {
  return db.transaction(async (client) => {
    // 1. Fetch quotation
    const quoteRes = await client.query('SELECT * FROM quotations WHERE id = $1', [quotationId]);
    if (quoteRes.rows.length === 0) {
      const error = new Error('Quotation not found.');
      error.statusCode = 404;
      throw error;
    }

    const quotation = quoteRes.rows[0];

    // Check if already converted
    if (quotation.status === 'converted') {
      const subCheck = await client.query('SELECT * FROM subscriptions WHERE quotation_id = $1', [quotationId]);
      if (subCheck.rows.length > 0) {
        return {
          alreadyConverted: true,
          subscription: subCheck.rows[0]
        };
      }
    }

    // 2. Fetch quotation items & addons
    const itemsRes = await client.query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY created_at ASC',
      [quotationId]
    );
    const items = itemsRes.rows;

    if (items.length === 0) {
      const error = new Error('Quotation has no line items to convert.');
      error.statusCode = 400;
      throw error;
    }

    // 3. Resolve creator admin
    let adminId = quotation.created_by;
    if (creatorAuthId) {
      const adm = await client.query('SELECT id FROM admin WHERE auth_id = $1', [creatorAuthId]);
      if (adm.rows.length > 0) adminId = adm.rows[0].id;
    }

    // 4. Generate subscription number
    const subYear = new Date().getFullYear();
    const subPrefix = `SUB-${subYear}-`;
    const lastSubRes = await client.query(
      'SELECT subscription_number FROM subscriptions WHERE subscription_number LIKE $1 ORDER BY subscription_number DESC LIMIT 1',
      [`${subPrefix}%`]
    );
    let nextSeq = 1;
    if (lastSubRes.rows.length > 0) {
      const match = lastSubRes.rows[0].subscription_number.match(/(\d+)$/);
      if (match) nextSeq = parseInt(match[1], 10) + 1;
    }
    const subscriptionNumber = `${subPrefix}${String(nextSeq).padStart(4, '0')}`;

    // 5. Billing frequency from items or default monthly
    const billingFrequency = items[0].billing_frequency || 'monthly';

    // Calculate dates
    const startDate = new Date().toISOString().split('T')[0];
    const nextBillingDateObj = new Date();
    if (billingFrequency === 'yearly') {
      nextBillingDateObj.setFullYear(nextBillingDateObj.getFullYear() + 1);
    } else if (billingFrequency === 'weekly') {
      nextBillingDateObj.setDate(nextBillingDateObj.getDate() + 7);
    } else {
      nextBillingDateObj.setMonth(nextBillingDateObj.getMonth() + 1);
    }
    const nextBillingDate = nextBillingDateObj.toISOString().split('T')[0];

    const expiryDateObj = new Date();
    expiryDateObj.setFullYear(expiryDateObj.getFullYear() + 1);
    const expiryDate = expiryDateObj.toISOString().split('T')[0];

    // 6. Insert subscription
    const insertSubQuery = `
      INSERT INTO subscriptions (
        subscription_number,
        customer_id,
        quotation_id,
        start_date,
        expiry_date,
        billing_frequency,
        next_billing_date,
        payment_terms,
        subtotal,
        discount_amount,
        tax_amount,
        total_amount,
        status,
        notes,
        activated_at,
        created_by,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active', $13, NOW(), $14, NOW(), NOW())
      RETURNING *
    `;

    const subRes = await client.query(insertSubQuery, [
      subscriptionNumber,
      quotation.customer_id,
      quotation.id,
      startDate,
      expiryDate,
      billingFrequency,
      nextBillingDate,
      quotation.payment_terms || 'Net 30',
      quotation.subtotal,
      quotation.discount_amount,
      quotation.tax_amount,
      quotation.total_amount,
      `Converted from quotation ${quotation.quotation_number}`,
      adminId
    ]);

    const createdSub = subRes.rows[0];

    // 7. Insert subscription items & addons
    for (const qi of items) {
      const subItemRes = await client.query(
        `INSERT INTO subscription_items (
          subscription_id, product_id, plan_id, variant_id,
          product_name, plan_name, variant_name, billing_frequency,
          quantity, unit_price, tax_rate, tax_amount,
          discount_type, discount_value, discount_amount, total_amount,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        RETURNING *`,
        [
          createdSub.id,
          qi.product_id,
          qi.plan_id,
          qi.variant_id,
          qi.product_name,
          qi.plan_name,
          qi.variant_name,
          qi.billing_frequency || billingFrequency,
          qi.quantity,
          qi.unit_price,
          qi.tax_rate,
          qi.tax_amount,
          qi.discount_type || 'fixed',
          qi.discount_value,
          qi.discount_amount,
          qi.total_amount
        ]
      );

      const createdSubItem = subItemRes.rows[0];

      // Copy item addons
      const addonsRes = await client.query(
        'SELECT * FROM quotation_item_addons WHERE quotation_item_id = $1',
        [qi.id]
      );
      for (const qia of addonsRes.rows) {
        await client.query(
          `INSERT INTO subscription_item_addons (
            subscription_item_id, addon_id, addon_name,
            quantity, unit_price, tax_rate, tax_amount, total_amount,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [
            createdSubItem.id,
            qia.addon_id,
            qia.addon_name,
            qia.quantity,
            qia.unit_price,
            qia.tax_rate,
            qia.tax_amount,
            qia.total_amount
          ]
        );
      }
    }

    // 8. Update quotation status to converted
    await client.query(
      `UPDATE quotations 
       SET status = 'converted', accepted_at = COALESCE(accepted_at, NOW()), updated_at = NOW() 
       WHERE id = $1`,
      [quotationId]
    );

    return {
      success: true,
      subscription: createdSub
    };
  });
}

module.exports = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  updateQuotationStatus,
  deleteQuotation,
  convertQuotationToSubscription
};
