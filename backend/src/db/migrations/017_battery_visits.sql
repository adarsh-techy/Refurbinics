-- Every truck intake a battery has ever been part of. batteries.truck_intake_id
-- keeps pointing at the battery's very first intake and is never overwritten
-- — when a battery already has a QR code and is scanned in on a NEW truck
-- intake (returning for another repair round), this table gets a new row
-- instead, so the battery's full history (every visit, every truck) survives.
-- Backfilled with each battery's original intake so "every truck that's
-- brought this battery in" queries never need to special-case the first one.
CREATE TABLE IF NOT EXISTS battery_visits (
  id SERIAL PRIMARY KEY,
  battery_id INTEGER NOT NULL REFERENCES batteries(id),
  truck_intake_id INTEGER NOT NULL REFERENCES truck_intakes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO battery_visits (battery_id, truck_intake_id, created_at)
SELECT b.id, b.truck_intake_id, b.created_at
FROM batteries b
WHERE b.truck_intake_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM battery_visits bv
    WHERE bv.battery_id = b.id AND bv.truck_intake_id = b.truck_intake_id
  );
