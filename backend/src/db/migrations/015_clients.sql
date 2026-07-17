-- Clients batteries are repaired for, managed as their own list so Truck
-- Intake can tag a delivery against one via a dropdown instead of free text.
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Optional: which client a truck delivery belongs to. Separate from
-- batteries.client_name (set per-battery at QR-generation time) — this just
-- tags the intake record itself.
ALTER TABLE truck_intakes ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);
