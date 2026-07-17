-- Collapse buy_price/sell_price into a single repair_cost: the amount
-- charged when this part is used in a repair. Cost-basis (buy_price)
-- tracking is dropped — Finance no longer computes a parts profit margin,
-- only repair revenue against staff salary.
ALTER TABLE parts RENAME COLUMN sell_price TO repair_cost;
ALTER TABLE parts DROP COLUMN buy_price;
