-- Two batteries can't share the same manufacturer serial number. Empty
-- strings are normalized to NULL first so multiple blanks (from batteries
-- created before this field existed) don't collide — Postgres treats NULLs
-- as distinct under a unique constraint.
UPDATE batteries SET serial_number = NULL WHERE serial_number = '';
ALTER TABLE batteries ADD CONSTRAINT batteries_serial_number_unique UNIQUE (serial_number);
