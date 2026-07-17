-- Groups repairs logged together in one Log Repair submission (multiple
-- parts changed on the same battery visit), so the Repairs list can show
-- them as a single row instead of one row per part. Existing rows each get
-- their own unique batch so they still behave as a "batch of one".
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS batch_id VARCHAR(40);
UPDATE repairs SET batch_id = 'legacy-' || id WHERE batch_id IS NULL;
ALTER TABLE repairs ALTER COLUMN batch_id SET NOT NULL;
