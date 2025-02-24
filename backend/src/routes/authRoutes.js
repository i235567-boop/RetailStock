const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const { validateBody } = require('../middlewares/validation');
const { registerSchema, loginSchema, changePasswordSchema } = require('../validations/schemas');

router.post('/register',        authLimiter, validateBody(registerSchema),        authController.register);
router.post('/login',           authLimiter, validateBody(loginSchema),            authController.login);
router.post('/logout',          authenticate,                                       authController.logout);
router.get('/me',               authenticate,                                       authController.getMe);
router.post('/refresh',                                                             authController.refreshToken);
router.put('/change-password',  authenticate, validateBody(changePasswordSchema),  authController.changePassword);

module.exports = router;
