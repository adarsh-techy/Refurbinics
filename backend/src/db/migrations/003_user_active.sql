-- Soft-delete flag for admin accounts. A hard DELETE would be blocked by
-- every audit_logs row the account has ever generated, so "deleting" an
-- admin means deactivating it instead — it also blocks that account from
-- logging in, while preserving audit history and attribution.
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
