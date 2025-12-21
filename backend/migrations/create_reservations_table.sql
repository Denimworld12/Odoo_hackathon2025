-- =========================
-- SLOT RESERVATIONS (Temporary holds for 5 minutes)
-- =========================

CREATE TABLE IF NOT EXISTS slot_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_type_id UUID NOT NULL REFERENCES appointment_types(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,  -- Can be NULL if no resource linked
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one reservation per customer per appointment type per time slot
-- Using a partial unique index to handle NULL resource_id properly
CREATE UNIQUE INDEX IF NOT EXISTS idx_slot_reservations_unique_with_resource 
  ON slot_reservations(appointment_type_id, resource_id, customer_id, start_time) 
  WHERE resource_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_slot_reservations_unique_without_resource 
  ON slot_reservations(appointment_type_id, customer_id, start_time) 
  WHERE resource_id IS NULL;

-- Index for efficient cleanup of expired reservations
CREATE INDEX IF NOT EXISTS idx_slot_reservations_expires_at ON slot_reservations(expires_at);

-- Index for checking available capacity
CREATE INDEX IF NOT EXISTS idx_slot_reservations_time_slot ON slot_reservations(appointment_type_id, start_time, end_time);
