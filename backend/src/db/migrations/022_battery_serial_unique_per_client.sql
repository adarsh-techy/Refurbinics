-- Different clients can legitimately have batteries sharing the same
-- manufacturer serial number (their manufacturers aren't coordinated with
-- each other) — the previous global UNIQUE(serial_number) was too strict.
-- Uniqueness only needs to hold within one client.
ALTER TABLE batteries DROP CONSTRAINT IF EXISTS batteries_serial_number_unique;
ALTER TABLE batteries ADD CONSTRAINT batteries_client_serial_unique UNIQUE (client_name, serial_number);
