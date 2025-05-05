const router = require('express').Router();
const financingController = require('../controllers/financingController');
const { authenticate } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validation');
const { repaymentSchema } = require('../validations/schemas');

router.post('/pay', authenticate, validateBody(repaymentSchema), financingController.makeRepayment);

module.exports = router;
