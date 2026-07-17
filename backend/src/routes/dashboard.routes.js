const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middlewares/auth');

router.use(requireAuth);
router.get('/summary', dashboardController.summary);

module.exports = router;
