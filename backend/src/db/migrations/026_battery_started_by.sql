-- Tracks which logged-in user (technician) claimed a battery via
-- start-work, so a re-scan can tell "you're still on this one" apart from
-- "someone else already claimed it" while it's in_progress.
ALTER TABLE batteries ADD COLUMN IF NOT EXISTS started_by_user_id INTEGER REFERENCES users(id);
