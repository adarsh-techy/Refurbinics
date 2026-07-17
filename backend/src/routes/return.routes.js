const router = require('express').Router();
const returnController = require('../controllers/return.controller');
const { requireAuth, requirePermission, requireRole } = require('../middlewares/auth');

router.use(requireAuth, requirePermission('returns'));
router.get('/', returnController.list);
router.get('/:id', returnController.getById);
router.post('/', returnController.create);
// Editing/removing a return (with battery status reversal) is super_admin only.
router.patch('/:id', requireRole('super_admin'), returnController.update);
router.delete('/:id', requireRole('super_admin'), returnController.remove);

module.exports = router;
