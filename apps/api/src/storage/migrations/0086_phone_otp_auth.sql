-- Add phone column to users table
ALTER TABLE users ADD COLUMN phone text;
ALTER TABLE users ADD CONSTRAINT users_phone_unique UNIQUE (phone);

-- Make email nullable (phone becomes primary auth identifier)
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- Add payment_url to orders table for async payment links
ALTER TABLE orders ADD COLUMN payment_url text;
