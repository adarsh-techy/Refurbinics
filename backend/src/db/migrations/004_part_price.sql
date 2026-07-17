-- Unit price for each part, so repair/inventory cost can be tracked.
ALTER TABLE parts ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) NOT NULL DEFAULT 0;
