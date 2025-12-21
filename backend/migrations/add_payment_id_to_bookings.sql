-- Add payment_id column to bookings table for Razorpay integration
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);

-- Index for looking up bookings by payment_id
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON bookings(payment_id) WHERE payment_id IS NOT NULL;
