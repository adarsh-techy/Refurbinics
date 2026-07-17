-- Monthly salary per staff member, used to compute total labor cost on the
-- Finance page.
ALTER TABLE staff ADD COLUMN IF NOT EXISTS salary NUMERIC(10, 2) NOT NULL DEFAULT 0;
