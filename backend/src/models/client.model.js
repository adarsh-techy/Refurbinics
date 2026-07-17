const db = require('../config/db');

// Joins in the linked login account's email (if any) so the Clients page
// can show whether a given client has login access yet.
async function findAll() {
  const { rows } = await db.query(
    `SELECT c.*, u.email AS login_email
     FROM clients c
     LEFT JOIN users u ON u.id = c.user_id
     ORDER BY c.name`
  );
  return rows;
}

async function findByUserId(userId) {
  const { rows } = await db.query('SELECT * FROM clients WHERE user_id = $1', [userId]);
  return rows[0];
}

// Same login-email join as findAll, for the admin-facing client detail page.
async function findById(id) {
  const { rows } = await db.query(
    `SELECT c.*, u.email AS login_email
     FROM clients c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0];
}

// A battery belongs to a client through either of two independent paths
// that were never reconciled: an older one where the *truck intake* it
// arrived on is tagged with a client_id, and the current one (Generate QR
// Code) where the *battery itself* just carries the client's name as text.
// Every client-scoped query needs both, or a client whose batteries were
// all registered through Generate QR Code sees nothing at all.
const CLIENT_BATTERY_IDS_CTE = `
  client_battery_ids AS (
    SELECT b.id
    FROM batteries b
    JOIN truck_intakes ti ON ti.id = b.truck_intake_id
    WHERE ti.client_id = $1
    UNION
    SELECT b.id
    FROM batteries b
    WHERE lower(b.client_name) = lower($2)
  )
`;

// Battery counts by status plus total repair visits and balance owed
// (price + labor_charge summed across every part logged, same math as the
// "Total Repair Cost" shown on a battery's own detail page) for every
// battery belonging to this client (see CLIENT_BATTERY_IDS_CTE above).
async function getDashboardStats(clientId, clientName) {
  const { rows } = await db.query(
    `WITH ${CLIENT_BATTERY_IDS_CTE}
     SELECT
       COUNT(DISTINCT b.id) AS battery_count,
       COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'in_repair') AS in_repair_count,
       COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'in_progress') AS in_progress_count,
       COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'in_testing') AS in_testing_count,
       COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'repaired') AS repaired_count,
       COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'returned') AS returned_count,
       COUNT(DISTINCT r.batch_id) AS repair_visit_count,
       COALESCE(SUM(r.price + r.labor_charge), 0) AS balance
     FROM client_battery_ids cb
     JOIN batteries b ON b.id = cb.id
     LEFT JOIN repairs r ON r.battery_id = b.id`,
    [clientId, clientName]
  );
  return rows[0];
}

// email/passwordHash are optional — when given, also creates a linked
// `users` login account (role 'client', forced to set its own password on
// first login) in the same transaction, so a client and its login can never
// end up out of sync with each other.
async function create({ name, email, passwordHash }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: clientRows } = await client.query(
      'INSERT INTO clients (name) VALUES ($1) RETURNING *',
      [name]
    );
    let clientRow = clientRows[0];

    if (email && passwordHash) {
      const { rows: userRows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role, permissions, must_change_password)
         VALUES ($1, $2, $3, 'client', '[]', true)
         RETURNING id`,
        [name, email, passwordHash]
      );
      const { rows: linkedRows } = await client.query(
        'UPDATE clients SET user_id = $2 WHERE id = $1 RETURNING *',
        [clientRow.id, userRows[0].id]
      );
      clientRow = linkedRows[0];
    }

    await client.query('COMMIT');
    return clientRow;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function update(id, { name }) {
  const { rows } = await db.query(
    'UPDATE clients SET name = $2 WHERE id = $1 RETURNING *',
    [id, name]
  );
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM clients WHERE id = $1', [id]);
}

// Which battery statuses fall into each of the client dashboard's 3 lists.
// Every status maps to exactly one bucket: 'packed' (just arrived, not
// started), 'pending' (work started or finished but not yet shipped back),
// 'received' (physically back with the client).
const BUCKET_STATUSES = {
  packed: ['in_repair'],
  pending: ['in_progress', 'in_testing', 'repaired'],
  received: ['returned'],
};

async function findMyBatteries(clientId, clientName, bucket) {
  const statuses = BUCKET_STATUSES[bucket];
  if (!statuses) return [];
  const { rows } = await db.query(
    `WITH ${CLIENT_BATTERY_IDS_CTE}
     SELECT b.id, b.battery_code, b.status, b.created_at, ti.truck_number, ti.intake_at
     FROM client_battery_ids cb
     JOIN batteries b ON b.id = cb.id
     LEFT JOIN truck_intakes ti ON ti.id = b.truck_intake_id
     WHERE b.status = ANY($3::text[])
     ORDER BY b.created_at DESC`,
    [clientId, clientName, statuses]
  );
  return rows;
}

// Every repair charge across every battery belonging to this client, one row
// per repair visit (batch_id — the same grouping the Repairs page uses) so a
// multi-part visit reads as one billing line, not several.
async function findMyTransactions(clientId, clientName) {
  const { rows } = await db.query(
    `WITH ${CLIENT_BATTERY_IDS_CTE}
     SELECT
       MIN(r.id) AS id,
       r.batch_id,
       MAX(b.battery_code) AS battery_code,
       string_agg(p.name, ', ' ORDER BY p.name) AS part_name,
       MAX(s.name) AS staff_name,
       SUM(r.price + r.labor_charge) AS amount,
       MIN(r.repaired_at) AS repaired_at
     FROM client_battery_ids cb
     JOIN batteries b ON b.id = cb.id
     JOIN repairs r ON r.battery_id = b.id
     JOIN parts p ON p.id = r.part_id
     JOIN staff s ON s.id = r.staff_id
     GROUP BY r.batch_id
     ORDER BY MIN(r.repaired_at) DESC`,
    [clientId, clientName]
  );
  return rows;
}

module.exports = {
  findAll,
  findById,
  findByUserId,
  getDashboardStats,
  findMyBatteries,
  findMyTransactions,
  create,
  update,
  remove,
};
