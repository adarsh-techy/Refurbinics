const router = require('express').Router();
const auditLogController = require('../controllers/audit-log.controller');
const { requireAuth, requirePermission } = require('../middlewares/auth');

router.use(requireAuth, requirePermission('audit_logs'));
router.get('/', auditLogController.list);

module.exports = router;
