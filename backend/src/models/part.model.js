const db = require('../config/db');

async function findAll() {
  const { rows } = await db.query('SELECT * FROM parts ORDER BY name');
  return rows;
}

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM parts WHERE id = $1', [id]);
  return rows[0];
}

// Every repair that's ever used this part, newest first — for the part
// detail page's usage history, same pattern as staff.model.js's
// findRepairs (which repairs a staff member logged) but filtered the other
// way around (which repairs used this part).
async function findUsageHistory(partId) {
  const { rows } = await db.query(
    `SELECT r.id, r.batch_id, r.quantity_used, r.notes, r.repaired_at, r.price, r.labor_charge,
            r.duration_seconds, b.battery_code, b.status AS battery_status, s.name AS staff_name
     FROM repairs r
     JOIN batteries b ON b.id = r.battery_id
     JOIN staff s ON s.id = r.staff_id
     WHERE r.part_id = $1
     ORDER BY r.repaired_at DESC`,
    [partId]
  );
  return rows;
}

async function create({ name, sku, quantity, repairCost }) {
  const { rows } = await db.query(
    `INSERT INTO parts (name, sku, quantity, repair_cost) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, sku, quantity, repairCost]
  );
  return rows[0];
}

async function update(id, { name, sku, quantity, repairCost }) {
  const { rows } = await db.query(
    `UPDATE parts SET name = $2, sku = $3, quantity = $4, repair_cost = $5 WHERE id = $1 RETURNING *`,
    [id, name, sku, quantity, repairCost]
  );
  return rows[0];
}

async function remove(id) {
  await db.query('DELETE FROM parts WHERE id = $1', [id]);
}

async function decrementStock(id, amount, client = db) {
  const { rows } = await client.query(
    'UPDATE parts SET quantity = quantity - $2 WHERE id = $1 RETURNING *',
    [id, amount]
  );
  return rows[0];
}

module.exports = { findAll, findById, findUsageHistory, create, update, remove, decrementStock };
