const db = require('../config/db');

// Joins in the linked login account's email (if any) so the Staff page can
// show whether a given staff member has technician login access yet.
async function findAll() {
  const { rows } = await db.query(
    `SELECT s.*, u.email AS login_email
     FROM staff s
     LEFT JOIN users u ON u.id = s.user_id
     ORDER BY s.name`
  );
  return rows;
}

async function findByUserId(userId) {
  const { rows } = await db.query('SELECT * FROM staff WHERE user_id = $1', [userId]);
  return rows[0];
}

// email/passwordHash are optional — when given, also creates a linked
// `users` login account (role 'technician', forced to set its own password
// on first login) in the same transaction, so a staff member and its login
// can never end up out of sync with each other.
async function create({ name, phone, salary, role, email, passwordHash }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: staffRows } = await client.query(
      'INSERT INTO staff (name, phone, salary, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, phone, salary || 0, role || null]
    );
    let staffRow = staffRows[0];

    if (email && passwordHash) {
      const { rows: userRows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role, permissions, must_change_password)
         VALUES ($1, $2, $3, 'technician', '[]', true)
         RETURNING id`,
        [name, email, passwordHash]
      );
      const { rows: linkedRows } = await client.query(
        'UPDATE staff SET user_id = $2 WHERE id = $1 RETURNING *',
        [staffRow.id, userRows[0].id]
      );
      staffRow = linkedRows[0];
    }

    await client.query('COMMIT');
    return staffRow;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function update(id, { name, phone, active, salary, role }) {
  const { rows } = await db.query(
    `UPDATE staff SET name = $2, phone = $3, active = $4, salary = $5, role = $6 WHERE id = $1 RETURNING *`,
    [id, name, phone, active, salary || 0, role || null]
  );
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM staff WHERE id = $1', [id]);
}

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM staff WHERE id = $1', [id]);
  return rows[0];
}

// Every repair *visit* this staff member has ever logged, newest first —
// the basis for their detail page's work history and per-day totals.
// Grouped by batch_id (same pattern as repair.model.js's findPage): every
// part changed in one Log Repair / Submit for Testing submission is one
// visit, not one row per part, so a 3-part job reads as one card, not
// three (part_name comes back comma-joined). Includes the battery's
// current status so the work-history list can show whether that battery
// has since moved on or is still in progress.
async function findRepairs(staffId) {
  const { rows } = await db.query(
    `SELECT
       MIN(r.id) AS id,
       array_agg(r.id ORDER BY r.id) AS repair_ids,
       r.batch_id,
       MAX(b.battery_code) AS battery_code,
       MAX(b.status) AS battery_status,
       string_agg(p.name, ', ' ORDER BY p.name) AS part_name,
       SUM(r.price) AS price,
       SUM(r.labor_charge) AS labor_charge,
       MIN(r.notes) AS notes,
       MIN(r.repaired_at) AS repaired_at,
       MIN(r.duration_seconds) AS duration_seconds
     FROM repairs r
     JOIN batteries b ON b.id = r.battery_id
     JOIN parts p ON p.id = r.part_id
     WHERE r.staff_id = $1
     GROUP BY r.batch_id
     ORDER BY MIN(r.repaired_at) DESC`,
    [staffId]
  );
  return rows;
}

module.exports = { findAll, findByUserId, create, update, remove, findById, findRepairs };
