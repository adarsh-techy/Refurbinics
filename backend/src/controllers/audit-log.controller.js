const auditLogModel = require('../models/audit-log.model');

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 100;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Paginated for infinite scroll: ?limit=15&offset=0.
// ?date=YYYY-MM-DD narrows to log entries recorded that day.
async function list(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const date = DATE_PATTERN.test(req.query.date) ? req.query.date : undefined;

    const { rows, hasMore } = await auditLogModel.findPage({ limit, offset, date });
    res.json({ data: rows, hasMore });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
