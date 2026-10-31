# Finance Module — Setup Guide

## 1. Create your backend `.env` file

Copy `.env.example` to `.env` in the `backend/` directory and fill in your actual Neon credentials:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@POOLER_HOST/brightloop?sslmode=require&channel_binding=require"
DIRECT_URL="postgresql://USER:PASSWORD@DIRECT_HOST/brightloop?sslmode=require"
PORT=5000
NODE_ENV=development
JWT_SECRET=your_long_random_secret_here_at_least_32_chars
```

---

## 2. Run the database migration

This creates all Finance tables on Neon PostgreSQL (safe to run multiple times):

```bash
cd backend
node src/modules/finance/finance.migrate.js
```

Tables created:
- `tax_rates`
- `discounts`
- `discount_products`
- `invoices`
- `invoice_lines`
- `payments`
- `billing_records`

---

## 3. Start the backend

```bash
cd backend
npm run dev        # or: npm start
```

Backend runs on `http://localhost:5000`

Finance API endpoints are at `/api/finance/*`:
- `GET/POST /api/finance/taxes`
- `GET/POST /api/finance/discounts`
- `GET/POST /api/finance/invoices`
- `PATCH   /api/finance/invoices/:id/confirm`
- `PATCH   /api/finance/invoices/:id/cancel`
- `GET/POST /api/finance/payments`

---

## 4. Start the frontend

```bash
npm run dev        # in the project root
```

Navigate to:
- `/admin/invoices`
- `/admin/payments`
- `/admin/discounts`
- `/admin/taxes`

---

## 5. Subscription billing integration

The `invoices.service.js` exports `generateSubscriptionInvoice()`:

```js
const { generateSubscriptionInvoice } = require('./modules/finance/invoices.service');

// Call this when a subscription billing period comes due:
await generateSubscriptionInvoice({
  subscription_id,        // UUID of the subscription
  customer_id,            // UUID from users table
  billing_period_start,   // 'YYYY-MM-DD'
  billing_period_end,     // 'YYYY-MM-DD'
  due_date,               // 'YYYY-MM-DD'
  lines: [
    {
      product_id,
      description: 'Monthly subscription — Plan Name',
      quantity: 1,
      unit_price: 999.00,
      tax_rate_id,         // optional UUID from tax_rates
      tax_percentage: 18,
      discount_id: null,
      discount_amount: 0
    }
  ],
  notes: 'Subscription invoice for billing period.'
});
```

**Built-in protections:**
- Duplicate invoice prevention: same `subscription_id + billing_period` raises 409
- Creates a `billing_records` audit row automatically
- Invoice is auto-confirmed (status = `confirmed`) on creation
- Discount usage counts are atomically incremented

---

## Finance Module Architecture

```
backend/src/modules/finance/
  finance.migrate.sql      ← PostgreSQL DDL (run once)
  finance.migrate.js       ← Migration runner script
  finance.routes.js        ← Express router (/api/finance/*)
  taxes.service.js         ← Tax CRUD + validation
  taxes.controller.js
  discounts.service.js     ← Discount CRUD + findApplicableDiscount()
  discounts.controller.js
  invoices.service.js      ← Invoice lifecycle + billing integration
  invoices.controller.js
  payments.service.js      ← Payment recording + balance update (SELECT FOR UPDATE)
  payments.controller.js

src/admin/
  services/financeApi.js   ← Frontend API client
  pages/TaxesPage.jsx
  pages/DiscountsPage.jsx
  pages/InvoicesPage.jsx
  pages/PaymentsPage.jsx
```
