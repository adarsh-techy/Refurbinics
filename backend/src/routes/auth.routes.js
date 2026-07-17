const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth');

router.post('/login', authController.login);
// TEMPORARY, see comment on authController.register — remove before production.
router.post('/register', authController.register);
router.get('/me', requireAuth, authController.me);
router.patch('/change-password', requireAuth, authController.changePassword);

module.exports = router;
