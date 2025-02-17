const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: { type: Number, required: true, min: 0.01 },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'financing_settlement', 'repayment', 'refund', 'fee', 'bill_payment'],
    required: true
  },
  status: { type: String, enum: ['pending', 'successful', 'failed', 'flagged'], default: 'pending' },
  category: { type: String, default: 'General' },
  description: { type: String, default: '' },
  suspiciousFlag: { type: Boolean, default: false },
  suspiciousReasons: [{ type: String }],
  relatedFinancingId: { type: mongoose.Schema.Types.ObjectId, ref: 'FinancingRecord' },
}, { timestamps: true });

transactionSchema.index({ senderId: 1, status: 1 });
transactionSchema.index({ receiverId: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
