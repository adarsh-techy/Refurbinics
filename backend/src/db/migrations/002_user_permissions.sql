-- Per-admin module permissions, selected by a super_admin when creating the
-- account. super_admin users implicitly have every permission and ignore
-- this column; it only constrains 'admin' accounts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;
