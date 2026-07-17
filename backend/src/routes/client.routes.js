const router = require('express').Router();
const clientController = require('../controllers/client.controller');
const { requireAuth, requirePermission, requireRole } = require('../middlewares/auth');

router.use(requireAuth);
// Read is open to any authenticated user: the Truck Intake form needs the
// client list for its dropdown regardless of who can manage clients.
router.get('/', clientController.list);
router.get('/me/dashboard', requireRole('client'), clientController.myDashboard);
router.get('/me/batteries', requireRole('client'), clientController.myBatteries);
router.get('/me/transactions', requireRole('client'), clientController.myTransactions);
router.get('/:id', clientController.getById);
router.post('/', requirePermission('clients'), clientController.create);
// Editing/removing clients is super_admin only, distinct from the 'clients'
// permission (which only covers adding new clients).
router.patch('/:id', requireRole('super_admin'), clientController.update);
router.delete('/:id', requireRole('super_admin'), clientController.remove);

module.exports = router;
