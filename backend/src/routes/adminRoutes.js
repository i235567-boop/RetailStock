const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/role');

const guard = [authenticate, requireAdmin];

router.get('/dashboard', ...guard, adminController.getDashboard);
router.get('/users', ...guard, adminController.listUsers);
router.get('/users/:id', ...guard, adminController.getUserById);
router.patch('/users/:id/block', ...guard, adminController.blockUser);
router.patch('/users/:id/unblock', ...guard, adminController.unblockUser);
router.get('/wallets', ...guard, adminController.listWallets);
router.get('/transactions', ...guard, adminController.listAllTransactions);
router.get('/transactions/flagged', ...guard, adminController.getFlaggedTransactions);
router.get('/financing', ...guard, adminController.getFinancingPortfolio);
router.get('/risk-dashboard', ...guard, adminController.getFinancingPortfolio);
router.get('/reports/transaction-volume', ...guard, adminController.getSystemReports);
router.get('/reports/system-balance', ...guard, adminController.getSystemReports);
router.post('/categories', ...guard, adminController.createCategory);
router.put('/categories/:id', ...guard, adminController.updateCategory);
router.patch('/categories/:id/disable', ...guard, adminController.disableCategory);
router.get('/audit-logs', ...guard, adminController.listAuditLogs);

module.exports = router;
