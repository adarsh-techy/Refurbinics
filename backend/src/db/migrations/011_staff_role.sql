-- Job title/role for a staff member (e.g. "Technician", "Senior Technician"),
-- shown on the Staff list and detail page. Optional — free text, not an enum,
-- since job titles vary by shop and aren't used for permission checks.
ALTER TABLE staff ADD COLUMN IF NOT EXISTS role VARCHAR(60);
