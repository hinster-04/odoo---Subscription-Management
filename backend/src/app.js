require('dotenv').config();

const express = require('express');
const cors = require('cors');

const healthRouter = require('./routes/health.routes');
const authRouter = require('./routes/auth.routes');
const testRouter = require('./routes/test.routes');
const financeRouter = require('./modules/finance/finance.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production, replace the origin with your actual frontend domain
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') ?? []
      : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // guard against oversized payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/finance', financeRouter);

// Products & Subscription Plans Module APIs
const productRouter = require('./modules/products/products.routes');
const plansRouter = require('./modules/plans/plans.routes');
app.use('/api/products', productRouter);
app.use('/api/subscription-plans', plansRouter);

// People Module APIs: Customers & Staff
const customersRouter = require('./modules/customers/customers.routes');
const staffRouter = require('./modules/staff/staff.routes');
app.use('/api/customers', customersRouter);
app.use('/api/staff', staffRouter);

// Sales Module APIs: Quotations, Quotation Templates & Subscriptions
const quotationsRouter = require('./modules/quotations/quotations.routes');
const quotationTemplatesRouter = require('./modules/quotations/quotationTemplates.routes');
const subscriptionsRouter = require('./modules/subscriptions/subscriptions.routes');
app.use('/api/quotations', quotationsRouter);
app.use('/api/quotation-templates', quotationTemplatesRouter);
app.use('/api/subscriptions', subscriptionsRouter);

// DEV ONLY — remove before production
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRouter);
}

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// ── Global Error Handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
