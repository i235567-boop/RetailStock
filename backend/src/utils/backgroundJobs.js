const cron = require('node-cron');
const FinancingRecord = require('../models/FinancingRecord');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const CreditLimitHistory = require('../models/CreditLimitHistory');
const { createNotification, NOTIFICATION_TYPES } = require('./notificationHelper');
const { generateTransactionId } = require('./helpers');
const { recalculateCreditLimit } = require('./creditEngine');

/**
 * CRON JOB 1: Send 3-day repayment reminders (runs daily at 8 AM)
 * Requirement: "Send 3-day prior repayment reminders via notification"
 */
const scheduleRepaymentReminders = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Running 3-day repayment reminder job...');
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const dayStart = new Date(threeDaysFromNow);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(threeDaysFromNow);
      dayEnd.setHours(23, 59, 59, 999);

      const dueRecords = await FinancingRecord.find({
        status: 'active',
        dueDate: { $gte: dayStart, $lte: dayEnd },
      });

      for (const record of dueRecords) {
        const notif = NOTIFICATION_TYPES.repaymentDue(record.remainingBalance, record.dueDate);
        await createNotification(record.userId, notif.title, notif.message, notif.type, null, record._id.toString());
        console.log(`[CRON] Reminder sent for financing ${record.financingUuid}`);
      }
      console.log(`[CRON] Sent ${dueRecords.length} repayment reminders.`);
    } catch (err) {
      console.error('[CRON] Repayment reminder error:', err.message);
    }
  });
};

/**
 * CRON JOB 2: Auto-debit on due date (runs daily at 9 AM)
 * Requirement: "The system shall attempt auto-debit on repayment due date"
 */
const scheduleAutoDebit = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running auto-debit job...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const overdueRecords = await FinancingRecord.find({
        status: 'active',
        dueDate: { $lte: todayEnd },
      });

      for (const record of overdueRecords) {
        try {
          const wallet = await Wallet.findOne({ userId: record.userId });
          if (!wallet || wallet.balance < record.remainingBalance) {
            // Auto-debit failed — notify user
            await createNotification(
              record.userId,
              'Auto-Debit Failed',
              `Auto-debit of PKR ${record.remainingBalance.toLocaleString()} failed for ${record.financingUuid}. Please make a manual repayment to avoid default.`,
              'financing',
              null,
              record._id.toString()
            );
            console.log(`[CRON] Auto-debit FAILED for ${record.financingUuid} — insufficient balance`);
            continue;
          }

          // Deduct from wallet
          wallet.balance -= record.remainingBalance;
          await wallet.save();

          // Update financing record
          const repaidAmount = record.remainingBalance;
          record.repaidAmount += repaidAmount;
          record.remainingBalance = 0;
          record.status = 'completed';
          await record.save();

          // Restore credit
          await User.findByIdAndUpdate(record.userId, {
            $inc: { availableCredit: repaidAmount }
          });

          await CreditLimitHistory.create({
            userId: record.userId,
            previousLimit: 0,
            newLimit: repaidAmount,
            changeReason: 'repayment',
            triggeredBy: 'auto_debit_cron',
          });

          // Create transaction record
          const txnId = generateTransactionId();
          await Transaction.create({
            transactionId: txnId,
            senderId: record.userId,
            amount: repaidAmount,
            type: 'repayment',
            status: 'successful',
            category: 'Repayment',
            description: `Auto-debit repayment for ${record.financingUuid}`,
            relatedFinancingId: record._id,
          });

          const notif = NOTIFICATION_TYPES.repaymentConfirmed(repaidAmount);
          await createNotification(record.userId, notif.title, notif.message, notif.type, txnId, record._id.toString());
          console.log(`[CRON] Auto-debit SUCCESS for ${record.financingUuid}`);
        } catch (innerErr) {
          console.error(`[CRON] Auto-debit error for ${record.financingUuid}:`, innerErr.message);
        }
      }
      console.log(`[CRON] Auto-debit job completed. Processed ${overdueRecords.length} records.`);
    } catch (err) {
      console.error('[CRON] Auto-debit job error:', err.message);
    }
  });
};

/**
 * CRON JOB 3: Daily risk recalculation (runs daily at midnight)
 * Requirement: "Daily batch: red/yellow/green risk score"
 */
const scheduleDailyRiskScoring = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running daily risk scoring...');
    try {
      const activeFinancing = await FinancingRecord.find({ status: 'active' });
      const now = new Date();
      const processedUsers = new Set();

      for (const record of activeFinancing) {
        const daysOverdue = (now - new Date(record.dueDate)) / (1000 * 60 * 60 * 24);
        let riskTier = 'low';
        if (daysOverdue > 0) riskTier = 'high';
        else if (daysOverdue > -3) riskTier = 'medium';

        await User.findByIdAndUpdate(record.userId, { riskTier });

        // Recalculate credit limit for each unique user once
        if (!processedUsers.has(record.userId.toString())) {
          processedUsers.add(record.userId.toString());
          await recalculateCreditLimit(record.userId);
        }
      }
      console.log(`[CRON] Risk scoring updated for ${activeFinancing.length} records.`);
    } catch (err) {
      console.error('[CRON] Risk scoring error:', err.message);
    }
  });
};

/**
 * Start all background jobs
 */
const startBackgroundJobs = () => {
  scheduleRepaymentReminders();
  scheduleAutoDebit();
  scheduleDailyRiskScoring();
  console.log('✅ Background jobs scheduled (3-day reminders, auto-debit, risk scoring)');
};

module.exports = { startBackgroundJobs };
