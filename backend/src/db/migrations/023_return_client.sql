-- Which client a return delivery belongs to — mirrors truck_intakes.client_id,
-- so Record a Return can scope its battery scan to one client's own
-- work-completed batteries, same as Truck Intake's Scan Batteries step.
ALTER TABLE returns ADD COLUMN IF NOT EXISTS client_id INTEGER REFERENCES clients(id);
