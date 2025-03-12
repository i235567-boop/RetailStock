const Notification = require('../models/Notification');

const createNotification = async (userId, title, message, type = 'system', relatedTransactionId = null, relatedFinancingId = null) => {
  try {
    await Notification.create({
      userId,
      title,
      message,
      type,
      relatedTransactionId,
      relatedFinancingId,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

const NOTIFICATION_TYPES = {
  transactionSuccess: (amount, type) => ({
    title: 'Transaction Successful',
    message: `Your ${type} of PKR ${amount.toLocaleString()} was successful.`,
    type: 'transaction'
  }),
  transactionFailed: (amount, type, reason) => ({
    title: 'Transaction Failed',
    message: `Your ${type} of PKR ${amount.toLocaleString()} failed. ${reason || ''}`,
    type: 'transaction'
  }),
  lowBalance: (balance) => ({
    title: 'Low Wallet Balance',
    message: `Your wallet balance is low: PKR ${balance.toLocaleString()}. Consider depositing funds.`,
    type: 'account'
  }),
  budgetWarning: (category, percent) => ({
    title: 'Budget Warning',
    message: `You have used ${percent}% of your ${category} budget. Review your spending.`,
    type: 'budget'
  }),
  budgetExceeded: (category) => ({
    title: 'Budget Exceeded',
    message: `Your ${category} budget limit has been exceeded this month.`,
    type: 'budget'
  }),
  accountBlocked: () => ({
    title: 'Account Blocked',
    message: 'Your account has been blocked. Please contact support for assistance.',
    type: 'account'
  }),
  financingApproved: (amount, dueDate) => ({
    title: 'Murabaha Financing Approved',
    message: `Your Murabaha financing of PKR ${amount.toLocaleString()} has been approved. Due date: ${new Date(dueDate).toLocaleDateString()}.`,
    type: 'financing'
  }),
  repaymentDue: (amount, dueDate) => ({
    title: 'Repayment Due in 3 Days',
    message: `PKR ${amount.toLocaleString()} repayment due on ${new Date(dueDate).toLocaleDateString()}. Ensure funds are available.`,
    type: 'financing'
  }),
  repaymentConfirmed: (amount) => ({
    title: 'Repayment Confirmed',
    message: `Your Murabaha repayment of PKR ${amount.toLocaleString()} has been received. Credit restored.`,
    type: 'financing'
  }),
  suspiciousActivity: (reason) => ({
    title: 'Suspicious Activity Detected',
    message: `A transaction on your account has been flagged: ${reason}`,
    type: 'security'
  }),
};

module.exports = { createNotification, NOTIFICATION_TYPES };
