const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if quotations or subscriptions already exist
    const qCount = await client.query('SELECT COUNT(*) FROM quotations');
    const sCount = await client.query('SELECT COUNT(*) FROM subscriptions');
    const tCount = await client.query('SELECT COUNT(*) FROM quotation_templates');

    if (parseInt(qCount.rows[0].count, 10) > 0 || parseInt(sCount.rows[0].count, 10) > 0) {
      console.log('Quotations / Subscriptions already have records. Skipping initial seed.');
      await client.query('COMMIT');
      return;
    }

    // Get admin
    const adminRes = await client.query('SELECT id FROM admin LIMIT 1');
    const adminId = adminRes.rows.length > 0 ? adminRes.rows[0].id : null;

    // Get customers
    const customersRes = await client.query('SELECT id, first_name, last_name, business_name FROM users ORDER BY created_at ASC LIMIT 5');
    const customers = customersRes.rows;

    if (customers.length === 0) {
      console.log('No customers found. Cannot seed sales without customers.');
      await client.query('COMMIT');
      return;
    }

    // Get products
    const productsRes = await client.query('SELECT id, name, sales_price FROM products LIMIT 5');
    const products = productsRes.rows;

    // 1. Seed Templates if none exist
    if (parseInt(tCount.rows[0].count, 10) === 0) {
      const t1 = await client.query(
        `INSERT INTO quotation_templates (
          template_name, description, validity_days, customer_notes, internal_notes, is_active, created_by, created_at, updated_at
        ) VALUES (
          'Enterprise ERP Cloud Bundle',
          'Standard proposal package for mid-market and enterprise ERP deployments including annual licenses and implementation.',
          30,
          'Payment terms: Net 30 from invoice receipt. Includes 99.9% uptime SLA.',
          'Standard enterprise discount pre-applied (10%). Approved for regional sales.',
          true,
          $1,
          NOW(), NOW()
        ) RETURNING id`,
        [adminId]
      );

      if (products.length > 0) {
        await client.query(
          `INSERT INTO quotation_template_items (
            template_id, product_id, product_name, quantity, unit_price, tax_rate, discount_type, discount_value, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, 1, $4, 18, 'percentage', 10, 0, NOW(), NOW())`,
          [t1.rows[0].id, products[0].id, products[0].name, products[0].sales_price]
        );
      }

      const t2 = await client.query(
        `INSERT INTO quotation_templates (
          template_name, description, validity_days, customer_notes, internal_notes, is_active, created_by, created_at, updated_at
        ) VALUES (
          'Growth CRM & Automation Package',
          'Sales acceleration suite designed for scaling tech and service businesses.',
          15,
          'Pricing valid for 15 calendar days.',
          'Requires sales manager approval for extensions beyond 15 days.',
          true,
          $1,
          NOW(), NOW()
        ) RETURNING id`,
        [adminId]
      );

      if (products.length > 1) {
        await client.query(
          `INSERT INTO quotation_template_items (
            template_id, product_id, product_name, quantity, unit_price, tax_rate, discount_type, discount_value, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, 5, $4, 18, 'fixed', 50, 0, NOW(), NOW())`,
          [t2.rows[0].id, products[1].id, products[1].name, products[1].sales_price]
        );
      }
    }

    // 2. Seed Quotations
    const q1 = await client.query(
      `INSERT INTO quotations (
        quotation_number, customer_id, created_by, quotation_date, valid_until,
        payment_terms, subtotal, discount_amount, tax_amount, total_amount,
        status, customer_notes, internal_notes, created_at, updated_at
      ) VALUES (
        'QUO-2026-0001', $1, $2, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days',
        'Net 30', 398.00, 39.80, 64.48, 422.68,
        'draft', 'Please review the software suite deployment scope.', 'Sent preliminary numbers to CTO.', NOW() - INTERVAL '10 days', NOW()
      ) RETURNING id`,
      [customers[0].id, adminId]
    );

    if (products.length > 0) {
      await client.query(
        `INSERT INTO quotation_items (
          quotation_id, product_id, product_name, billing_frequency, quantity, unit_price, tax_rate, tax_amount, discount_type, discount_value, discount_amount, total_amount, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'monthly', 2, $4, 18, 64.48, 'percentage', 10, 39.80, 422.68, NOW() - INTERVAL '10 days', NOW()
        )`,
        [q1.rows[0].id, products[0].id, products[0].name, products[0].sales_price]
      );
    }

    const q2Customer = customers.length > 1 ? customers[1].id : customers[0].id;
    const q2 = await client.query(
      `INSERT INTO quotations (
        quotation_number, customer_id, created_by, quotation_date, valid_until,
        payment_terms, subtotal, discount_amount, tax_amount, total_amount,
        status, customer_notes, sent_at, created_at, updated_at
      ) VALUES (
        'QUO-2026-0002', $1, $2, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days',
        'Advance', 447.00, 0.00, 80.46, 527.46,
        'sent', 'Annual agreement covering full support.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW()
      ) RETURNING id`,
      [q2Customer, adminId]
    );

    if (products.length > 1) {
      await client.query(
        `INSERT INTO quotation_items (
          quotation_id, product_id, product_name, billing_frequency, quantity, unit_price, tax_rate, tax_amount, discount_type, discount_value, discount_amount, total_amount, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'monthly', 3, $4, 18, 80.46, 'fixed', 0, 0.00, 527.46, NOW() - INTERVAL '5 days', NOW()
        )`,
        [q2.rows[0].id, products[1].id, products[1].name, products[1].sales_price]
      );
    }

    const q3Customer = customers.length > 2 ? customers[2].id : customers[0].id;
    const q3 = await client.query(
      `INSERT INTO quotations (
        quotation_number, customer_id, created_by, quotation_date, valid_until,
        payment_terms, subtotal, discount_amount, tax_amount, total_amount,
        status, customer_notes, accepted_at, created_at, updated_at
      ) VALUES (
        'QUO-2026-0003', $1, $2, CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days',
        'Net 15', 199.00, 20.00, 32.22, 211.22,
        'accepted', 'Accepted and awaiting subscription activation.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '15 days', NOW()
      ) RETURNING id`,
      [q3Customer, adminId]
    );

    if (products.length > 0) {
      await client.query(
        `INSERT INTO quotation_items (
          quotation_id, product_id, product_name, billing_frequency, quantity, unit_price, tax_rate, tax_amount, discount_type, discount_value, discount_amount, total_amount, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'monthly', 1, $4, 18, 32.22, 'fixed', 20, 20.00, 211.22, NOW() - INTERVAL '15 days', NOW()
        )`,
        [q3.rows[0].id, products[0].id, products[0].name, products[0].sales_price]
      );
    }

    // 3. Seed Subscriptions
    const subCustomer1 = customers.length > 3 ? customers[3].id : customers[0].id;
    const sub1 = await client.query(
      `INSERT INTO subscriptions (
        subscription_number, customer_id, start_date, expiry_date, billing_frequency,
        next_billing_date, payment_terms, subtotal, discount_amount, tax_amount, total_amount,
        status, notes, activated_at, created_by, created_at, updated_at
      ) VALUES (
        'SUB-2026-0001', $1, CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days', 'monthly',
        CURRENT_DATE + INTERVAL '5 days', 'Net 30', 398.00, 0.00, 71.64, 469.64,
        'active', 'Primary ERP cloud subscription with priority phone support.', NOW() - INTERVAL '60 days', $2, NOW() - INTERVAL '60 days', NOW()
      ) RETURNING id`,
      [subCustomer1, adminId]
    );

    if (products.length > 0) {
      await client.query(
        `INSERT INTO subscription_items (
          subscription_id, product_id, product_name, billing_frequency, quantity, unit_price, tax_rate, tax_amount, discount_type, discount_value, discount_amount, total_amount, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'monthly', 2, $4, 18, 71.64, 'fixed', 0, 0.00, 469.64, NOW() - INTERVAL '60 days', NOW()
        )`,
        [sub1.rows[0].id, products[0].id, products[0].name, products[0].sales_price]
      );
    }

    const subCustomer2 = customers.length > 4 ? customers[4].id : customers[1]?.id || customers[0].id;
    const sub2 = await client.query(
      `INSERT INTO subscriptions (
        subscription_number, customer_id, start_date, expiry_date, billing_frequency,
        next_billing_date, payment_terms, subtotal, discount_amount, tax_amount, total_amount,
        status, notes, activated_at, created_by, created_at, updated_at
      ) VALUES (
        'SUB-2026-0002', $1, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days', 'monthly',
        CURRENT_DATE + INTERVAL '10 days', 'Net 30', 149.00, 15.00, 24.12, 158.12,
        'active', 'Brightloop CRM Pro corporate account.', NOW() - INTERVAL '30 days', $2, NOW() - INTERVAL '30 days', NOW()
      ) RETURNING id`,
      [subCustomer2, adminId]
    );

    if (products.length > 1) {
      await client.query(
        `INSERT INTO subscription_items (
          subscription_id, product_id, product_name, billing_frequency, quantity, unit_price, tax_rate, tax_amount, discount_type, discount_value, discount_amount, total_amount, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'monthly', 1, $4, 18, 24.12, 'fixed', 15, 15.00, 158.12, NOW() - INTERVAL '30 days', NOW()
        )`,
        [sub2.rows[0].id, products[1].id, products[1].name, products[1].sales_price]
      );
    }

    const sub3 = await client.query(
      `INSERT INTO subscriptions (
        subscription_number, customer_id, start_date, expiry_date, billing_frequency,
        next_billing_date, payment_terms, subtotal, discount_amount, tax_amount, total_amount,
        status, notes, created_by, created_at, updated_at
      ) VALUES (
        'SUB-2026-0003', $1, CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days', 'yearly',
        CURRENT_DATE + INTERVAL '275 days', 'Advance', 1788.00, 178.80, 289.66, 1898.86,
        'paused', 'Client requested temporary pause during corporate restructuring.', $2, NOW() - INTERVAL '90 days', NOW()
      ) RETURNING id`,
      [customers[0].id, adminId]
    );

    if (products.length > 1) {
      await client.query(
        `INSERT INTO subscription_items (
          subscription_id, product_id, product_name, billing_frequency, quantity, unit_price, tax_rate, tax_amount, discount_type, discount_value, discount_amount, total_amount, created_at, updated_at
        ) VALUES (
          $1, $2, $3, 'yearly', 12, $4, 18, 289.66, 'percentage', 10, 178.80, 1898.86, NOW() - INTERVAL '90 days', NOW()
        )`,
        [sub3.rows[0].id, products[1].id, products[1].name, products[1].sales_price]
      );
    }

    await client.query('COMMIT');
    console.log('Successfully seeded initial real quotations and subscriptions in Neon PostgreSQL!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
