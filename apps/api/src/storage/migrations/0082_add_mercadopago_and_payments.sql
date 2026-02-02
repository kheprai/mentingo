-- Add mercadopago_product_id to courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS mercadopago_product_id TEXT;

-- Create unified payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  provider VARCHAR(20) NOT NULL,
  provider_payment_id VARCHAR(100) NOT NULL,

  amount_in_cents INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL,

  status VARCHAR(30) NOT NULL,
  status_detail TEXT,

  payment_method VARCHAR(50),
  installments INTEGER DEFAULT 1,

  UNIQUE(provider, provider_payment_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_course_id ON payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
