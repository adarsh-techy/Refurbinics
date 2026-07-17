-- The manufacturer's serial number physically printed on the battery —
-- distinct from battery_code, which is our own internal ID (e.g.
-- "UBE-0001", generated from the client + a sequence number).
ALTER TABLE batteries ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
