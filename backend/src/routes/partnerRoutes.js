const router = require('express').Router();
const partnerController = require('../controllers/partnerController');
const { authenticatePartner } = require('../middlewares/partnerAuth');

// All partner routes require HMAC-SHA256 signed API key
router.post('/quote',   authenticatePartner, partnerController.partnerQuote);
router.post('/execute', authenticatePartner, partnerController.partnerExecute);

module.exports = router;
