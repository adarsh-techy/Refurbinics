const router = require('express').Router();
const partController = require('../controllers/part.controller');
const { requireAuth, requirePermission, requireRole } = require('../middlewares/auth');

router.use(requireAuth);
// Read is open to any authenticated user: the Repairs form needs part names
// and stock levels for its dropdown regardless of who can manage inventory.
router.get('/', partController.list);
router.get('/:id', partController.getById);
router.post('/', requirePermission('parts'), partController.create);
// Full edit/delete is super_admin only, distinct from the 'parts' permission
// (which only covers adding new parts). Stock quantity can only be changed
// by editing the part.
router.patch('/:id', requireRole('super_admin'), partController.update);
router.delete('/:id', requireRole('super_admin'), partController.remove);

module.exports = router;
