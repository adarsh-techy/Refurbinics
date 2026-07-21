-- Outgoing shipments of unserviceable batteries sent out for recycling.
CREATE TABLE IF NOT EXISTS recycle_batches (
  id SERIAL PRIMARY KEY,
  vehicle_number VARCHAR(40) NOT NULL,
  driver_name VARCHAR(120) NOT NULL,
  battery_count INTEGER NOT NULL DEFAULT 0,
  recycled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which batteries went out in a given recycle shipment.
CREATE TABLE IF NOT EXISTS recycle_batteries (
  recycle_id INTEGER NOT NULL REFERENCES recycle_batches(id) ON DELETE CASCADE,
  battery_id INTEGER NOT NULL REFERENCES batteries(id),
  PRIMARY KEY (recycle_id, battery_id)
);

ALTER TABLE batteries DROP CONSTRAINT batteries_status_check;
ALTER TABLE batteries ADD CONSTRAINT batteries_status_check
  CHECK (status IN ('in_repair', 'in_progress', 'in_testing', 'repaired', 'returned', 'unserviceable', 'recycled'));
