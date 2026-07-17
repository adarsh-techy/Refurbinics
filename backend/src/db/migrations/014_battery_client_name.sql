-- Client the battery belongs to, set when generating its QR code, so
-- scanning the code later shows who it's for alongside the rest of the
-- battery's history.
ALTER TABLE batteries ADD COLUMN IF NOT EXISTS client_name VARCHAR(120);
