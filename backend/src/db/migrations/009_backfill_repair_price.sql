-- One-time backfill: repairs logged before the price column existed default
-- to 0; recompute their charge from the part's current sell price.
UPDATE repairs r
SET price = r.quantity_used * p.sell_price
FROM parts p
WHERE p.id = r.part_id AND r.price = 0;
