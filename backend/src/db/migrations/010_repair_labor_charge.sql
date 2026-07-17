-- Optional labor/service charge added once per repair job. Parts aren't
-- job-level (each part is its own row), so this is attributed to the first
-- part logged in a given Log Repair submission rather than split across all
-- of them.
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS labor_charge NUMERIC(10, 2) NOT NULL DEFAULT 0;
