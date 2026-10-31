const db = require('../../config/db');

/**
 * Generate the next sequential subscription number in format SUB-YYYY-XXXX
 */
async function generateNextSubscriptionNumber(client = db) {
  const currentYear = new Date().getFullYear();
  const prefix = `SUB-${currentYear}-`;

  const result = await client.query(
    `SELECT subscription_number 
     FROM subscriptions 
     WHERE subscription_number LIKE $1 
     ORDER BY subscription_number DESC 
     LIMIT 1`,
    [`${prefix}%`]
  );

  if (result.rows.length === 0) {
    return `${prefix}0001`;
  }

  const lastNumber = result.rows[0].subscription_number;
  const match = lastNumber.match(/(\d+)$/);
  if (!match) {
    return `${prefix}0001`;
  }

  const nextSeq = parseInt(match[1], 10) + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Get all subscriptions with search, filtering, sorting, pagination, and KPI metrics
 */
async function getSubscriptions({
  search = '',
  status = 'all',
  billing_frequency = 'all',
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
    subscription_number: 's.subscription_number',
    customer: 'u.first_name',
    business_name: 'u.business_name',
    start_date: 's.start_date',
    expiry_date: 's.expiry_date',
    total_amount: 's.total_amount',
    status: 's.status',
    billing_frequency: 's.billing_frequency',
    created_at: 's.created_at'
  };

  const sortColumn = allowedSortColumns[sort_by] || 's.created_at';
  const sortDirection = (sort_order || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const whereConditions = [];
  const queryParams = [];

  if (search && search.trim()) {
    queryParams.push(`%${search.trim()}%`);
    const idx = queryParams.length;
    whereConditions.push(`(
      s.subscription_number ILIKE $${idx} OR
      u.first_name ILIKE $${idx} OR
      u.last_name ILIKE $${idx} OR
      u.business_name ILIKE $${idx} OR
      a.email ILIKE $${idx} OR
      q.quotation_number ILIKE $${idx}
    )`);
  }

  if (status && status !== 'all') {
    queryParams.push(status.toLowerCase().trim());
    whereConditions.push(`LOWER(s.status) = $${queryParams.length}`);
  }

  if (billing_frequency && billing_frequency !== 'all') {
    queryParams.push(billing_frequency.toLowerCase().trim());
    whereConditions.push(`LOWER(s.billing_frequency) = $${queryParams.length}`);
  }

  if (customer_id && customer_id.trim()) {
    queryParams.push(customer_id.trim());
    whereConditions.push(`s.customer_id = $${queryParams.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 1. Total count
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM subscriptions s
    JOIN users u ON s.customer_id = u.id
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN quotations q ON s.quotation_id = q.id
    ${whereClause}
  `;
  const countResult = await db.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].total, 10);
  const totalPages = Math.ceil(total / limitNum) || 1;

  // 2. Data
  const dataParams = [...queryParams, limitNum, offset];
  const limitIdx = queryParams.length + 1;
  const offsetIdx = queryParams.length + 2;

  const dataQuery = `
    SELECT
      s.id,
      s.subscription_number,
      s.customer_id,
      s.quotation_id,
      s.created_by,
      TO_CHAR(s.start_date, 'YYYY-MM-DD') AS start_date,
      TO_CHAR(s.expiry_date, 'YYYY-MM-DD') AS expiry_date,
      s.billing_frequency,
      TO_CHAR(s.next_billing_date, 'YYYY-MM-DD') AS next_billing_date,
      s.payment_terms,
      s.subtotal::float,
      s.discount_amount::float,
      s.tax_amount::float,
      s.total_amount::float,
      s.status,
      s.notes,
      s.activated_at,
      s.closed_at,
      s.created_at,
      s.updated_at,
      u.first_name AS customer_first_name,
      u.last_name AS customer_last_name,
      u.business_name,
      a.email AS customer_email,
      u.phone AS customer_phone,
      u.city AS customer_city,
      q.quotation_number AS related_quotation_number,
      COALESCE(items_summary.item_count, 0) AS item_count
    FROM subscriptions s
    JOIN users u ON s.customer_id = u.id
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN quotations q ON s.quotation_id = q.id
    LEFT JOIN (
      SELECT subscription_id, COUNT(*) AS item_count
      FROM subscription_items
      GROUP BY subscription_id
    ) items_summary ON items_summary.subscription_id = s.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const dataResult = await db.query(dataQuery, dataParams);

  // 3. Summary KPIs
  const summaryQuery = `
    SELECT
      COUNT(*) AS total_subscriptions,
      COUNT(*) FILTER (WHERE status = 'active') AS active_count,
      COUNT(*) FILTER (WHERE status = 'paused') AS paused_count,
      COUNT(*) FILTER (WHERE status = 'expired') AS expired_count,
      COUNT(*) FILTER (WHERE status = 'closed') AS closed_count,
      COALESCE(SUM(total_amount) FILTER (WHERE status = 'active'), 0)::float AS active_revenue_total
    FROM subscriptions
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
 * Get single subscription with complete details, line items, and item addons
 */
async function getSubscriptionById(id) {
  const query = `
    SELECT
      s.id,
      s.subscription_number,
      s.customer_id,
      s.quotation_id,
      s.created_by,
      TO_CHAR(s.start_date, 'YYYY-MM-DD') AS start_date,
      TO_CHAR(s.expiry_date, 'YYYY-MM-DD') AS expiry_date,
      s.billing_frequency,
      TO_CHAR(s.next_billing_date, 'YYYY-MM-DD') AS next_billing_date,
      s.payment_terms,
      s.subtotal::float,
      s.discount_amount::float,
      s.tax_amount::float,
      s.total_amount::float,
      s.status,
      s.notes,
      s.activated_at,
      s.closed_at,
      s.created_at,
      s.updated_at,
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
      q.quotation_number AS related_quotation_number,
      adm.first_name AS creator_first_name,
      adm.last_name AS creator_last_name
    FROM subscriptions s
    JOIN users u ON s.customer_id = u.id
    LEFT JOIN auth a ON u.auth_id = a.id
    LEFT JOIN quotations q ON s.quotation_id = q.id
    LEFT JOIN admin adm ON s.created_by = adm.id
    WHERE s.id = $1
  `;

  const result = await db.query(query, [id]);
  if (result.rows.length === 0) {
    const error = new Error('Subscription not found.');
    error.statusCode = 404;
    throw error;
  }

  const subscription = result.rows[0];

  // Fetch line items
  const itemsQuery = `
    SELECT
      si.id,
      si.subscription_id,
      si.product_id,
      si.plan_id,
      si.variant_id,
      si.product_name,
      si.plan_name,
      si.variant_name,
      si.billing_frequency,
      si.quantity::float,
      si.unit_price::float,
      si.tax_rate::float,
      si.tax_amount::float,
      si.discount_type,
      si.discount_value::float,
      si.discount_amount::float,
      si.total_amount::float,
      si.created_at,
      si.updated_at
    FROM subscription_items si
    WHERE si.subscription_id = $1
    ORDER BY si.created_at ASC
  `;
  const itemsResult = await db.query(itemsQuery, [id]);
  const items = itemsResult.rows;

  if (items.length > 0) {
    const itemIds = items.map(i => i.id);
    const addonsQuery = `
      SELECT
        sia.id,
        sia.subscription_item_id,
        sia.addon_id,
        sia.addon_name,
        sia.quantity::float,
        sia.unit_price::float,
        sia.tax_rate::float,
        sia.tax_amount::float,
        sia.total_amount::float,
        sia.created_at
      FROM subscription_item_addons sia
      WHERE sia.subscription_item_id = ANY($1)
      ORDER BY sia.created_at ASC
    `;
    const addonsResult = await db.query(addonsQuery, [itemIds]);
    const addonsMap = {};
    addonsResult.rows.forEach(a => {
      if (!addonsMap[a.subscription_item_id]) {
        addonsMap[a.subscription_item_id] = [];
      }
      addonsMap[a.subscription_item_id].push(a);
    });

    items.forEach(i => {
      i.addons = addonsMap[i.id] || [];
    });
  }

  return {
    ...subscription,
    items
  };
}

/**
 * Create a new subscription in an atomic transaction
 */
async function createSubscription(data, creatorAuthId = null) {
  const {
    customer_id,
    start_date = new Date().toISOString().split('T')[0],
    expiry_date = null,
    billing_frequency = 'monthly',
    next_billing_date = null,
    payment_terms = 'Net 30',
    notes = '',
    status = 'active',
    items = []
  } = data;

  if (!customer_id) {
    const error = new Error('Customer is required.');
    error.statusCode = 400;
    throw error;
  }

  const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
  if (!validFrequencies.includes((billing_frequency || '').toLowerCase())) {
    const error = new Error(`Billing frequency must be one of: ${validFrequencies.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (expiry_date && new Date(expiry_date) < new Date(start_date)) {
    const error = new Error('Expiry date cannot be earlier than start date.');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('At least one item is required in the subscription.');
    error.statusCode = 400;
    throw error;
  }

  return db.transaction(async (client) => {
    // 1. Verify customer
    const custRes = await client.query('SELECT id FROM users WHERE id = $1', [customer_id]);
    if (custRes.rows.length === 0) {
      const error = new Error('Customer not found.');
      error.statusCode = 400;
      throw error;
    }

    // 2. Creator admin
    let adminId = null;
    if (creatorAuthId) {
      const adm = await client.query('SELECT id FROM admin WHERE auth_id = $1', [creatorAuthId]);
      if (adm.rows.length > 0) adminId = adm.rows[0].id;
    }
    if (!adminId) {
      const defaultAdmin = await client.query('SELECT id FROM admin LIMIT 1');
      if (defaultAdmin.rows.length > 0) adminId = defaultAdmin.rows[0].id;
    }

    // 3. Compute amounts
    let calculatedSubtotal = 0;
    let calculatedDiscountTotal = 0;
    let calculatedTaxTotal = 0;

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
        billing_frequency: item.billing_frequency || billing_frequency,
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

    const subscriptionTotal = Math.max(0, calculatedSubtotal - calculatedDiscountTotal + calculatedTaxTotal);

    // 4. Calculate next billing date if not specified
    let computedNextBilling = next_billing_date;
    if (!computedNextBilling) {
      const dt = new Date(start_date);
      if (billing_frequency === 'yearly') dt.setFullYear(dt.getFullYear() + 1);
      else if (billing_frequency === 'weekly') dt.setDate(dt.getDate() + 7);
      else if (billing_frequency === 'daily') dt.setDate(dt.getDate() + 1);
      else dt.setMonth(dt.getMonth() + 1);
      computedNextBilling = dt.toISOString().split('T')[0];
    }

    // 5. Generate subscription number
    const subNumber = await generateNextSubscriptionNumber(client);

    // 6. Insert subscription
    const insertSubQuery = `
      INSERT INTO subscriptions (
        subscription_number,
        customer_id,
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
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        CASE WHEN $12 = 'active' THEN NOW() ELSE NULL END,
        $14, NOW(), NOW()
      )
      RETURNING *
    `;

    const subRes = await client.query(insertSubQuery, [
      subNumber,
      customer_id,
      start_date,
      expiry_date || null,
      billing_frequency.toLowerCase(),
      computedNextBilling,
      payment_terms,
      parseFloat(calculatedSubtotal.toFixed(2)),
      parseFloat(calculatedDiscountTotal.toFixed(2)),
      parseFloat(calculatedTaxTotal.toFixed(2)),
      parseFloat(subscriptionTotal.toFixed(2)),
      status.toLowerCase(),
      notes,
      adminId
    ]);

    const createdSub = subRes.rows[0];

    // 7. Insert items & addons
    const createdItems = [];
    for (const item of processedItems) {
      const itemRes = await client.query(
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
            `INSERT INTO subscription_item_addons (
              subscription_item_id, addon_id, addon_name,
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
      ...createdSub,
      items: createdItems
    };
  });
}

/**
 * Update an existing subscription
 */
async function updateSubscription(id, data) {
  const existing = await db.query('SELECT * FROM subscriptions WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    const error = new Error('Subscription not found.');
    error.statusCode = 404;
    throw error;
  }

  const current = existing.rows[0];
  const {
    customer_id = current.customer_id,
    start_date = current.start_date,
    expiry_date = current.expiry_date,
    billing_frequency = current.billing_frequency,
    next_billing_date = current.next_billing_date,
    payment_terms = current.payment_terms,
    notes = current.notes,
    status = current.status,
    items
  } = data;

  return db.transaction(async (client) => {
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
          billing_frequency: item.billing_frequency || billing_frequency,
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

      // Remove old items (addons cascade delete)
      await client.query('DELETE FROM subscription_items WHERE subscription_id = $1', [id]);

      // Insert new items
      for (const item of processedItems) {
        const itemRes = await client.query(
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
              `INSERT INTO subscription_item_addons (
                subscription_item_id, addon_id, addon_name,
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

    const updateQuery = `
      UPDATE subscriptions
      SET
        customer_id = $1,
        start_date = $2,
        expiry_date = $3,
        billing_frequency = $4,
        next_billing_date = $5,
        payment_terms = $6,
        subtotal = $7,
        discount_amount = $8,
        tax_amount = $9,
        total_amount = $10,
        status = $11,
        notes = $12,
        updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `;

    const subRes = await client.query(updateQuery, [
      customer_id,
      start_date,
      expiry_date || null,
      billing_frequency.toLowerCase(),
      next_billing_date,
      payment_terms,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      status.toLowerCase(),
      notes,
      id
    ]);

    return subRes.rows[0];
  });
}

/**
 * Update subscription status (active, paused, closed, expired, confirmed, draft)
 */
async function updateSubscriptionStatus(id, newStatus) {
  const validStatuses = ['draft', 'confirmed', 'active', 'paused', 'closed', 'expired'];
  const normalized = (newStatus || '').toLowerCase().trim();

  if (!validStatuses.includes(normalized)) {
    const error = new Error(`Invalid status "${newStatus}". Must be one of: ${validStatuses.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const query = `
    UPDATE subscriptions
    SET
      status = $1,
      activated_at = CASE WHEN $1 = 'active' AND activated_at IS NULL THEN NOW() ELSE activated_at END,
      closed_at = CASE WHEN $1 = 'closed' AND closed_at IS NULL THEN NOW() ELSE closed_at END,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `;

  const result = await db.query(query, [normalized, id]);
  if (result.rows.length === 0) {
    const error = new Error('Subscription not found.');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}

/**
 * Delete a subscription
 */
async function deleteSubscription(id) {
  const check = await db.query('SELECT id FROM subscriptions WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    const error = new Error('Subscription not found.');
    error.statusCode = 404;
    throw error;
  }

  await db.query('DELETE FROM subscriptions WHERE id = $1', [id]);
  return { success: true, message: 'Subscription deleted successfully.' };
}

module.exports = {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  updateSubscriptionStatus,
  deleteSubscription
};
