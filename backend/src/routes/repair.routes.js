const router = require('express').Router();
const repairController = require('../controllers/repair.controller');
const { requireAuth, requirePermission, requireRole } = require('../middlewares/auth');

// Technicians log repairs from their own scan-and-repair flow (no
// 'repairs' permission needed for that one action); everyone else needs
// the usual module permission.
function requireRepairsAccess(req, res, next) {
  if (req.user.role === 'technician') return next();
  return requirePermission('repairs')(req, res, next);
}

router.use(requireAuth);
router.get('/', requirePermission('repairs'), repairController.list);
router.post('/', requireRepairsAccess, repairController.create);
// Editing/removing a logged repair (with stock reversal) is super_admin only.
router.patch('/:id', requireRole('super_admin'), repairController.update);
router.delete('/:id', requireRole('super_admin'), repairController.remove);

module.exports = router;
