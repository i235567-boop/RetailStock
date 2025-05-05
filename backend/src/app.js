const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { generalLimiter, authLimiter } = require('./middlewares/rateLimiter');
const { errorHandler, notFound }       = require('./middlewares/error');
const { requestLogger }                = require('./middlewares/logging');

const authRoutes     = require('./routes/authRoutes');
const userRoutes     = require('./routes/userRoutes');
const walletRoutes   = require('./routes/walletRoutes');
const txnRoutes      = require('./routes/transactionRoutes');
const financingRoutes = require('./routes/financingRoutes');
const repaymentRoutes = require('./routes/repaymentRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const partnerRoutes  = require('./routes/partnerRoutes');
const { expenseRouter, budgetRouter, notifRouter, reportsRouter, categoryRouter } = require('./routes/otherRoutes');

const app = express();

// ── Security headers (helmet) ────────────────────────────────────
app.use(helmet());

// ── CORS — restricted to deployed frontend ───────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── HTTP request logging (morgan — dev format) ───────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Custom structured request logger ────────────────────────────
app.use(requestLogger);

// ── Body parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── General rate limiting on all /api routes ─────────────────────
app.use('/api', generalLimiter);

// ── Health check ─────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:      'success',
    message:     'RetailStock API is running.',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version:     '1.0.0',
  });
});

// ── Routes ───────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/wallet',       walletRoutes);
app.use('/api/transactions', txnRoutes);
app.use('/api/financing',    financingRoutes);
app.use('/api/repayments',   repaymentRoutes);
app.use('/api/expenses',     expenseRouter);
app.use('/api/budgets',      budgetRouter);
app.use('/api/notifications', notifRouter);
app.use('/api/reports',      reportsRouter);
app.use('/api/categories',   categoryRouter);
app.use('/api/admin',        adminRoutes);

// Partner B2B API (HMAC-SHA256 authenticated)
app.use('/api/v1/partners',  partnerRoutes);

// ── 404 + error handling ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
