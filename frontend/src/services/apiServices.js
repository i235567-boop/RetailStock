import api from './api';

// Auth
export const authService = {
  login: (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (d) => api.put('/auth/change-password', d),
};

// User
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (d) => api.put('/users/profile', d),
};

// Wallet
export const walletService = {
  getWallet: () => api.get('/wallet'),
  getSummary: () => api.get('/wallet/summary'),
  deposit: (d) => api.post('/wallet/deposit', d),
  withdraw: (d) => api.post('/wallet/withdraw', d),
  transfer: (d) => api.post('/wallet/transfer', d),
};

// Transactions
export const txnService = {
  list: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  getMonthlySummary: () => api.get('/transactions/summary/monthly'),
};

// Financing
export const financingService = {
  getQuote: (params) => api.get('/financing/quote', { params }),
  apply: (d) => api.post('/financing/apply', d),
  getActive: () => api.get('/financing/active'),
  getHistory: () => api.get('/financing'),
  getById: (id) => api.get(`/financing/${id}`),
  makeRepayment: (d) => api.post('/repayments/pay', d),
};

// Expenses
export const expenseService = {
  create: (d) => api.post('/expenses', d),
  list: (params) => api.get('/expenses', { params }),
  getMonthlySummary: (params) => api.get('/expenses/summary/monthly', { params }),
  getCategorySummary: (params) => api.get('/expenses/summary/categories', { params }),
  update: (id, d) => api.put(`/expenses/${id}`, d),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Budgets
export const budgetService = {
  create: (d) => api.post('/budgets', d),
  list: () => api.get('/budgets'),
  getCurrent: () => api.get('/budgets/current'),
  update: (id, d) => api.put(`/budgets/${id}`, d),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// Notifications
export const notifService = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Reports
export const reportService = {
  getDashboard: () => api.get('/reports/user-dashboard'),
  getIncomeExpense: () => api.get('/reports/income-expense'),
  getBudgetUsage: () => api.get('/reports/budget-usage'),
  getFinancingHistory: () => api.get('/reports/financing-history'),
};

// Categories
export const categoryService = {
  list: (params) => api.get('/categories', { params }),
};

// Admin
export const adminService = {
  getDashboard: () => api.get('/admin/dashboard'),
  listUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  blockUser: (id, d) => api.patch(`/admin/users/${id}/block`, d),
  unblockUser: (id) => api.patch(`/admin/users/${id}/unblock`),
  listWallets: (params) => api.get('/admin/wallets', { params }),
  listTransactions: (params) => api.get('/admin/transactions', { params }),
  getFlaggedTransactions: (params) => api.get('/admin/transactions/flagged', { params }),
  getFinancingPortfolio: () => api.get('/admin/financing'),
  getSystemReports: () => api.get('/admin/reports/transaction-volume'),
  createCategory: (d) => api.post('/admin/categories', d),
  updateCategory: (id, d) => api.put(`/admin/categories/${id}`, d),
  disableCategory: (id) => api.patch(`/admin/categories/${id}/disable`),
  getAuditLogs: () => api.get('/admin/audit-logs'),
};
