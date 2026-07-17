-- Tracks whether a battery's QR code has already been generated, so a
-- battery can only ever get one QR code (set once, never cleared).
ALTER TABLE batteries ADD COLUMN IF NOT EXISTS qr_generated_at TIMESTAMPTZ;
