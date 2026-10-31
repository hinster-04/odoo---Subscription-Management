const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedPlans() {
  const client = await pool.connect();
  try {
    const pRes = await client.query('SELECT id, name FROM products LIMIT 2');
    if (pRes.rows.length === 0) {
      console.log('No products to link plans to.');
      return;
    }
    const erp = pRes.rows[0];
    const crm = pRes.rows.length > 1 ? pRes.rows[1] : pRes.rows[0];

    const countRes = await client.query('SELECT count(*) FROM subscription_plans');
    if (parseInt(countRes.rows[0].count, 10) > 0) {
      console.log('Plans already exist. Skipping seed.');
      return;
    }

    const plans = [
      {
        product_id: erp.id,
        name: 'Enterprise Annual License',
        description: 'Full-featured enterprise ERP deployment with dedicated database instance, 99.9% uptime SLA, and 24/7 priority response.',
        price: 1990.00,
        billing_frequency: 'yearly',
        minimum_quantity: 1,
        available_from: '2026-01-01',
        available_until: '2027-12-31',
        auto_close_on_end: false,
        auto_close_days: 30,
        allow_early_closure: true,
        allow_pause: true,
        allow_renewal: true,
        is_active: true
      },
      {
        product_id: erp.id,
        name: 'Professional Monthly Plan',
        description: 'Flexible month-to-month ERP operations package for growing mid-market business teams.',
        price: 199.00,
        billing_frequency: 'monthly',
        minimum_quantity: 2,
        available_from: '2026-01-01',
        available_until: null,
        auto_close_on_end: false,
        auto_close_days: 30,
        allow_early_closure: true,
        allow_pause: true,
        allow_renewal: true,
        is_active: true
      },
      {
        product_id: crm.id,
        name: 'CRM Pro Team Monthly',
        description: 'High-velocity sales pipeline tracking, lead automation, and omnichannel customer communication suite.',
        price: 149.00,
        billing_frequency: 'monthly',
        minimum_quantity: 1,
        available_from: '2026-01-01',
        available_until: null,
        auto_close_on_end: false,
        auto_close_days: 30,
        allow_early_closure: true,
        allow_pause: true,
        allow_renewal: true,
        is_active: true
      },
      {
        product_id: crm.id,
        name: 'CRM Enterprise Growth Annual',
        description: 'Annual CRM package including unlimited integrations, AI pipeline scoring, and executive reporting.',
        price: 1490.00,
        billing_frequency: 'yearly',
        minimum_quantity: 1,
        available_from: '2026-01-01',
        available_until: '2027-06-30',
        auto_close_on_end: true,
        auto_close_days: 14,
        allow_early_closure: false,
        allow_pause: true,
        allow_renewal: true,
        is_active: true
      }
    ];

    for (const p of plans) {
      await client.query(
        `INSERT INTO subscription_plans (
          product_id, name, description, price, billing_frequency, minimum_quantity,
          available_from, available_until, auto_close_on_end, auto_close_days,
          allow_early_closure, allow_pause, allow_renewal, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
        [
          p.product_id,
          p.name,
          p.description,
          p.price,
          p.billing_frequency,
          p.minimum_quantity,
          p.available_from,
          p.available_until,
          p.auto_close_on_end,
          p.auto_close_days,
          p.allow_early_closure,
          p.allow_pause,
          p.allow_renewal,
          p.is_active
        ]
      );
    }

    console.log('Successfully seeded 4 subscription plans!');
  } catch (err) {
    console.error('Seeding plans failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

seedPlans();
