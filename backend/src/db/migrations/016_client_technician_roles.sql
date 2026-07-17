-- Widens users.role to support client/technician login accounts, adds a
-- forced-password-change flag for their admin-issued temp passwords, and
-- bridges the existing staff/clients rosters to an optional login account
-- (one login per roster row). Also adds an "in_progress" battery status,
-- set the moment a technician starts work, before any part is logged.
ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('super_admin', 'admin', 'client', 'technician'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE staff ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE REFERENCES users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id INTEGER UNIQUE REFERENCES users(id);

ALTER TABLE batteries DROP CONSTRAINT batteries_status_check;
ALTER TABLE batteries ADD CONSTRAINT batteries_status_check
  CHECK (status IN ('in_repair', 'in_progress', 'repaired', 'returned'));
