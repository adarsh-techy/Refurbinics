-- Track cost (buy) and revenue (sell) price separately per part, so profit
-- can be computed from repairs that consume it.
ALTER TABLE parts RENAME COLUMN price TO buy_price;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS sell_price NUMERIC(10, 2) NOT NULL DEFAULT 0;
