-- =============================================================================
-- BRIGHTLOOP FINANCE MODULE — PostgreSQL Migration
-- Run once against Neon PostgreSQL.
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS).
-- =============================================================================

-- ── Tax Rates ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_rates (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(100) NOT NULL,
  percentage   DECIMAL(6,3) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  description  TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tax_rates_active ON tax_rates (is_active);

-- ── Discounts ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discounts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(200) NOT NULL,
  description          TEXT,
  discount_type        VARCHAR(20) NOT NULL CHECK (discount_type IN ('fixed','percentage')),
  discount_value       DECIMAL(12,2) NOT NULL CHECK (discount_value >= 0),
  min_purchase_amount  DECIMAL(12,2) DEFAULT 0,
  min_quantity         INTEGER DEFAULT 1,
  start_date           DATE,
  end_date             DATE,
  usage_limit          INTEGER,
  usage_count          INTEGER NOT NULL DEFAULT 0,
  applies_to           VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','products')),
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_discount_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CONSTRAINT chk_usage_limit CHECK (usage_limit IS NULL OR usage_limit > 0)
);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts (is_active);
CREATE INDEX IF NOT EXISTS idx_discounts_dates  ON discounts (start_date, end_date);

-- ── Discount ↔ Products link table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS discount_products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES discounts (id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products  (id) ON DELETE CASCADE,
  UNIQUE (discount_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_dp_discount ON discount_products (discount_id);
CREATE INDEX IF NOT EXISTS idx_dp_product  ON discount_products (product_id);

-- ── Invoices ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number       VARCHAR(40) NOT NULL UNIQUE,
  customer_id          UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  subscription_id      UUID,                        -- nullable; FK added after subscriptions table exists
  invoice_date         DATE        NOT NULL DEFAULT CURRENT_DATE,
  due_date             DATE        NOT NULL,
  subtotal             DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_amount           DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_amount      DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_amount         DECIMAL(14,2) NOT NULL DEFAULT 0,
  amount_paid          DECIMAL(14,2) NOT NULL DEFAULT 0,
  balance_due          DECIMAL(14,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  status               VARCHAR(20) NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','confirmed','paid','cancelled')),
  notes                TEXT,
  billing_period_start DATE,
  billing_period_end   DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_customer    ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status      ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_date        ON invoices (invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due         ON invoices (due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices (subscription_id) WHERE subscription_id IS NOT NULL;

-- ── Invoice Lines ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_lines (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id       UUID        NOT NULL REFERENCES invoices (id) ON DELETE CASCADE,
  product_id       UUID        REFERENCES products (id) ON DELETE SET NULL,
  description      VARCHAR(500) NOT NULL,
  quantity         DECIMAL(10,4) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price       DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax_rate_id      UUID        REFERENCES tax_rates (id) ON DELETE SET NULL,
  tax_percentage   DECIMAL(6,3) NOT NULL DEFAULT 0,
  tax_amount       DECIMAL(14,2) NOT NULL DEFAULT 0,
  discount_id      UUID        REFERENCES discounts (id) ON DELETE SET NULL,
  discount_amount  DECIMAL(14,2) NOT NULL DEFAULT 0,
  line_total       DECIMAL(14,2) NOT NULL DEFAULT 0,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines (invoice_id);

-- ── Payments ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference VARCHAR(60) NOT NULL UNIQUE,
  invoice_id       UUID        NOT NULL REFERENCES invoices (id) ON DELETE RESTRICT,
  customer_id      UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  payment_method   VARCHAR(50) NOT NULL DEFAULT 'bank_transfer'
                     CHECK (payment_method IN ('bank_transfer','credit_card','upi','cash','cheque','other')),
  amount           DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  payment_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_invoice  ON payments (invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date     ON payments (payment_date DESC);

-- ── Billing Records (subscription billing audit trail) ────────────────────────
CREATE TABLE IF NOT EXISTS billing_records (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id      UUID        NOT NULL,       -- FK to subscriptions when that module exists
  invoice_id           UUID        REFERENCES invoices (id) ON DELETE SET NULL,
  billing_period_start DATE        NOT NULL,
  billing_period_end   DATE        NOT NULL,
  amount               DECIMAL(14,2) NOT NULL,
  status               VARCHAR(20) NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','invoiced','paid','failed')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subscription_id, billing_period_start, billing_period_end)
);
CREATE INDEX IF NOT EXISTS idx_billing_subscription ON billing_records (subscription_id);
CREATE INDEX IF NOT EXISTS idx_billing_status       ON billing_records (status);

-- ── updated_at trigger function (reuse if already exists) ─────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN VALUES ('tax_rates'),('discounts'),('invoices'),('payments'),('billing_records')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_'||t||'_updated_at'
        AND tgrelid = t::regclass
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t
      );
    END IF;
  END LOOP;
END $$;
