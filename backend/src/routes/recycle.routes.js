const router = require('express').Router();
const recycleController = require('../controllers/recycle.controller');
const { requireAuth, requirePermission, requireRole } = require('../middlewares/auth');

router.use(requireAuth, requirePermission('recycle'));
router.get('/', recycleController.list);
router.get('/:id', recycleController.getById);
router.post('/', recycleController.create);
// Editing/removing a recycle batch (with battery status reversal) is super_admin only.
router.patch('/:id', requireRole('super_admin'), recycleController.update);
router.delete('/:id', requireRole('super_admin'), recycleController.remove);

module.exports = router;
