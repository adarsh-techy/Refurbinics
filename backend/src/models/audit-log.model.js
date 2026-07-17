const db = require('../config/db');

async function record({ userId, action, entity, entityId, details }) {
  await db.query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, entity, entityId, details ? JSON.stringify(details) : null]
  );
}

async function findPage({ limit, offset, date }) {
  const whereClause = date ? 'WHERE al.created_at::date = $3' : '';
  const params = date ? [limit + 1, offset, date] : [limit + 1, offset];

  const { rows } = await db.query(
    `SELECT al.*, u.name AS user_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${whereClause}
     ORDER BY al.created_at DESC, al.id DESC
     LIMIT $1 OFFSET $2`,
    params
  );

  const hasMore = rows.length > limit;
  return { rows: rows.slice(0, limit), hasMore };
}

module.exports = { record, findPage };
