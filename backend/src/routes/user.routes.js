const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { requireAuth, requireRole } = require('../middlewares/auth');

// Only super_admin can manage admin accounts, per spec.
router.use(requireAuth, requireRole('super_admin'));
router.get('/', userController.list);
router.post('/', userController.create);
router.patch('/:id', userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
