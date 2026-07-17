-- Snapshot of the amount charged for this repair (quantity_used x the
-- part's sell price at the time), so invoices stay accurate even if a
-- part's price changes later.
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0;
