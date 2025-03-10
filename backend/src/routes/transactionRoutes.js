const router = require('express').Router();
const txnController = require('../controllers/transactionController');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, txnController.listTransactions);
router.get('/summary/monthly', authenticate, txnController.getMonthlySummary);
router.get('/:id', authenticate, txnController.getTransaction);
router.get('/:id/receipt', authenticate, txnController.getTransaction);

module.exports = router;
