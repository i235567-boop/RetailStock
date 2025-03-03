const router = require('express').Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validation');
const { depositSchema, withdrawSchema, transferSchema } = require('../validations/schemas');

router.get('/',          authenticate, walletController.getWallet);
router.get('/summary',   authenticate, walletController.getWalletSummary);
router.post('/deposit',  authenticate, validateBody(depositSchema),  walletController.deposit);
router.post('/withdraw', authenticate, validateBody(withdrawSchema), walletController.withdraw);
router.post('/transfer', authenticate, validateBody(transferSchema), walletController.transfer);

module.exports = router;
