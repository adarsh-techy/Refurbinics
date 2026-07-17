-- Every battery gets a battery_visits row the moment it's created (see
-- battery.model.js create()), so without ON DELETE CASCADE here, a freshly
-- created battery with zero actual repair/return history could never be
-- deleted (correcting a mistaken intake, say) — it would always look like it
-- "has history" purely because of its own creation-time visit row. Deleting
-- a battery with REAL history is still blocked, via the separate repairs/
-- return_batteries foreign keys, which are unaffected by this change.
ALTER TABLE battery_visits DROP CONSTRAINT battery_visits_battery_id_fkey;
ALTER TABLE battery_visits ADD CONSTRAINT battery_visits_battery_id_fkey
  FOREIGN KEY (battery_id) REFERENCES batteries(id) ON DELETE CASCADE;
