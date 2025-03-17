const express = require('express');
const expenseController  = require('../controllers/expenseController');
const budgetController   = require('../controllers/budgetController');
const notifController    = require('../controllers/notificationController');
const reportsController  = require('../controllers/reportsController');
const categoryController = require('../controllers/categoryController');
const { authenticate }   = require('../middlewares/auth');
const { validateBody }   = require('../middlewares/validation');
const { expenseSchema, budgetSchema } = require('../validations/schemas');

// ── Expenses ─────────────────────────────────────────────────────
const expenseRouter = express.Router();
expenseRouter.post('/',                    authenticate, validateBody(expenseSchema), expenseController.createExpense);
expenseRouter.get('/',                     authenticate, expenseController.listExpenses);
expenseRouter.get('/summary/monthly',      authenticate, expenseController.getMonthlySummary);
expenseRouter.get('/summary/categories',   authenticate, expenseController.getCategorySummary);
expenseRouter.put('/:id',                  authenticate, expenseController.updateExpense);
expenseRouter.delete('/:id',               authenticate, expenseController.deleteExpense);

// ── Budgets ──────────────────────────────────────────────────────
const budgetRouter = express.Router();
budgetRouter.post('/',        authenticate, budgetController.createBudget);
budgetRouter.get('/',         authenticate, budgetController.listBudgets);
budgetRouter.get('/current',  authenticate, budgetController.getCurrentBudget);
budgetRouter.put('/:id',      authenticate, budgetController.updateBudget);
budgetRouter.delete('/:id',   authenticate, budgetController.deleteBudget);

// ── Notifications ────────────────────────────────────────────────
const notifRouter = express.Router();
notifRouter.get('/',              authenticate, notifController.listNotifications);
notifRouter.patch('/read-all',    authenticate, notifController.markAllRead);
notifRouter.patch('/:id/read',    authenticate, notifController.markAsRead);

// ── Reports ──────────────────────────────────────────────────────
const reportsRouter = express.Router();
reportsRouter.get('/user-dashboard',   authenticate, reportsController.getUserDashboard);
reportsRouter.get('/income-expense',   authenticate, reportsController.getIncomeExpense);
reportsRouter.get('/budget-usage',     authenticate, reportsController.getBudgetUsage);
reportsRouter.get('/financing-history',authenticate, reportsController.getFinancingHistory);

// ── Categories ───────────────────────────────────────────────────
const categoryRouter = express.Router();
categoryRouter.get('/', authenticate, categoryController.listCategories);

module.exports = { expenseRouter, budgetRouter, notifRouter, reportsRouter, categoryRouter };
