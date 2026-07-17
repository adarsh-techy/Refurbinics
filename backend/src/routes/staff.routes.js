const router = require('express').Router();
const staffController = require('../controllers/staff.controller');
const { requireAuth, requirePermission, requireRole } = require('../middlewares/auth');

router.use(requireAuth);
// Read is open to any authenticated user: the Repairs form needs the staff
// list to populate its dropdown regardless of who's logged the repair.
router.get('/', staffController.list);
// Must come before /:id or it would be swallowed as an id param.
router.get('/me', staffController.myProfile);
router.get('/:id', staffController.getById);
router.post('/', requirePermission('staff'), staffController.create);
// Editing/removing staff records is super_admin only, distinct from the
// 'staff' permission (which only covers adding new staff).
router.patch('/:id', requireRole('super_admin'), staffController.update);
router.delete('/:id', requireRole('super_admin'), staffController.remove);

module.exports = router;
