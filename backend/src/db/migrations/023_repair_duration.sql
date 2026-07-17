-- Tracks how long a technician spends on a battery: work_started_at is set
-- when they tap "Start Work" and cleared once the repair is logged;
-- duration_seconds is stamped onto the repair row at that same moment (the
-- diff between work_started_at and repaired_at), since work_started_at
-- itself gets overwritten by the battery's next repair cycle.
ALTER TABLE batteries ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMPTZ;
ALTER TABLE repairs ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
