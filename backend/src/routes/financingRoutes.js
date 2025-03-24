const router = require('express').Router();
const financingController = require('../controllers/financingController');
const { authenticate } = require('../middlewares/auth');
const { financingLimiter } = require('../middlewares/rateLimiter');
const { validateBody } = require('../middlewares/validation');
const { financingApplySchema } = require('../validations/schemas');

router.get('/quote',   authenticate, financingController.getQuote);
router.post('/apply',  authenticate, financingLimiter, validateBody(financingApplySchema), financingController.applyFinancing);
router.get('/active',  authenticate, financingController.getActiveFinancing);
router.get('/',        authenticate, financingController.getFinancingHistory);
router.get('/:id',     authenticate, financingController.getFinancingById);

module.exports = router;
