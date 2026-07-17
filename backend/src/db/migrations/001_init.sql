-- Users who can log in to the admin dashboard (super_admin, admin)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Repair staff (not dashboard users, just people who repair batteries)
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Truck deliveries bringing batteries in for repair
CREATE TABLE IF NOT EXISTS truck_intakes (
  id SERIAL PRIMARY KEY,
  truck_number VARCHAR(40) NOT NULL,
  driver_name VARCHAR(120) NOT NULL,
  battery_count INTEGER NOT NULL DEFAULT 0,
  intake_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each physical battery gets a unique tracking code
CREATE TABLE IF NOT EXISTS batteries (
  id SERIAL PRIMARY KEY,
  battery_code VARCHAR(40) UNIQUE NOT NULL,
  truck_intake_id INTEGER REFERENCES truck_intakes(id),
  status VARCHAR(20) NOT NULL DEFAULT 'in_repair'
    CHECK (status IN ('in_repair', 'repaired', 'returned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parts inventory used for battery repairs
CREATE TABLE IF NOT EXISTS parts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  sku VARCHAR(60) UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  in_stock BOOLEAN GENERATED ALWAYS AS (quantity > 0) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per part changed during a battery repair
CREATE TABLE IF NOT EXISTS repairs (
  id SERIAL PRIMARY KEY,
  battery_id INTEGER NOT NULL REFERENCES batteries(id),
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  part_id INTEGER NOT NULL REFERENCES parts(id),
  quantity_used INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  repaired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Outgoing shipments of repaired batteries back to the customer
CREATE TABLE IF NOT EXISTS returns (
  id SERIAL PRIMARY KEY,
  truck_number VARCHAR(40) NOT NULL,
  driver_name VARCHAR(120) NOT NULL,
  battery_count INTEGER NOT NULL DEFAULT 0,
  returned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which batteries went out in a given return shipment
CREATE TABLE IF NOT EXISTS return_batteries (
  return_id INTEGER NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  battery_id INTEGER NOT NULL REFERENCES batteries(id),
  PRIMARY KEY (return_id, battery_id)
);

-- Audit trail of actions taken across the system
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(60) NOT NULL,
  entity VARCHAR(60) NOT NULL,
  entity_id INTEGER,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
