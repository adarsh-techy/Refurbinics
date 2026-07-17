const router = require('express').Router();
const batteryController = require('../controllers/battery.controller');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);
router.get('/', batteryController.list);
// Must precede '/:code' below, or these would be swallowed as battery code
// lookups.
router.get('/count-by-client', batteryController.countByClient);
router.get('/serial-numbers', batteryController.listSerialNumbers);
router.get('/repeat-intakes-this-month', batteryController.repeatIntakesThisMonth);
router.get('/:code', batteryController.getByCode);
// Registering a battery from the Generate QR Code page is a routine
// front-desk action, open to any authenticated user.
router.post('/generate', batteryController.generate);
// Assigning a client (for the Generate QR Code page) is a routine
// front-desk action, open to any authenticated user.
router.patch('/:id/client', batteryController.updateClient);
// A technician claiming a battery to start work on — before any part is
// logged, so it shows as actively being worked on rather than just queued.
router.patch('/:id/start-work', requireRole('technician'), batteryController.startWork);
// A technician confirming a battery works after its parts were replaced.
router.patch('/:id/complete-testing', requireRole('technician'), batteryController.completeTesting);
// Editing/removing batteries (manual status correction) is super_admin only.
router.patch('/:id', requireRole('super_admin'), batteryController.update);
router.delete('/:id', requireRole('super_admin'), batteryController.remove);
// Hides/restores a battery app-wide without deleting it — super_admin only.
router.patch('/:id/block', requireRole('super_admin'), batteryController.setBlocked);

module.exports = router;
