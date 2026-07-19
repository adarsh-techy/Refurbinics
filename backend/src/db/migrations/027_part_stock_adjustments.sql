-- Records every manual stock top-up (e.g. restocking an out-of-stock part)
-- so Part Detail can show who added how much and when, plus a monthly
-- restocked-vs-used breakdown, instead of silently overwriting `quantity`
-- on every edit with no history.
CREATE TABLE IF NOT EXISTS part_stock_adjustments (
  id SERIAL PRIMARY KEY,
  part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  quantity_added INTEGER NOT NULL,
  adjusted_by_user_id INTEGER REFERENCES users(id),
  note TEXT,
  adjusted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
