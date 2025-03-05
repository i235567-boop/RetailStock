const { v4: uuidv4 } = require('uuid');

// Consistent API response format
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200, meta = {}) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    meta,
  });
};

const sendError = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  const response = { status: 'error', message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

// Generate unique transaction ID
const generateTransactionId = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `TXN-${dateStr}-${random}`;
};

// Generate financing UUID
const generateFinancingUuid = () => {
  const date = new Date();
  return `FIN-${date.getFullYear()}-${uuidv4().split('-')[0].toUpperCase()}`;
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Get start of month
const getMonthStart = (monthStr) => {
  const [year, month] = monthStr.split('-');
  return new Date(year, month - 1, 1);
};

const getMonthEnd = (monthStr) => {
  const [year, month] = monthStr.split('-');
  return new Date(year, month, 0, 23, 59, 59);
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
};

module.exports = {
  sendSuccess,
  sendError,
  generateTransactionId,
  generateFinancingUuid,
  isValidObjectId,
  getMonthStart,
  getMonthEnd,
  getCurrentMonth,
};
