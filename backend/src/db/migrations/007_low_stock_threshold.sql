-- Redefine "out of stock" as 5 units or fewer (a low-stock warning
-- threshold), not strictly zero. Generated column expressions can't be
-- altered in place, so drop and recreate it.
ALTER TABLE parts DROP COLUMN in_stock;
ALTER TABLE parts ADD COLUMN in_stock BOOLEAN GENERATED ALWAYS AS (quantity > 5) STORED;
