-- Lets a super admin hide a battery from every list in the app (Batteries,
-- Generate QR Code, typeahead suggestions, etc.) without deleting its
-- record or history. Blocked batteries are excluded by default and only
-- surface again when explicitly requested (e.g. a "Show blocked" toggle).
ALTER TABLE batteries ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;
