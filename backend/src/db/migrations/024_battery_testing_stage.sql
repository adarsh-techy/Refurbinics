-- Adds an "in_testing" stage between "in_progress" (parts being replaced)
-- and "repaired" (verified working) — every repair must now pass through a
-- testing step before it's marked done. testing_started_at/duration mirror
-- work_started_at/repairs.duration_seconds (added in 023) for the same
-- reason: so admins can see how long each stage takes, not just the total.
ALTER TABLE batteries DROP CONSTRAINT batteries_status_check;
ALTER TABLE batteries ADD CONSTRAINT batteries_status_check
  CHECK (status IN ('in_repair', 'in_progress', 'in_testing', 'repaired', 'returned'));

ALTER TABLE batteries ADD COLUMN IF NOT EXISTS testing_started_at TIMESTAMPTZ;
ALTER TABLE batteries ADD COLUMN IF NOT EXISTS testing_duration_seconds INTEGER;
