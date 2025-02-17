const mongoose = require('mongoose');

const creditLimitHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  previousLimit: { type: Number, required: true },
  newLimit: { type: Number, required: true },
  changeReason: {
    type: String,
    enum: ['initial', 'repayment', 'manual', 'risk', 'default'],
    required: true
  },
  triggeredBy: { type: String, default: 'system' },
}, { timestamps: true });

module.exports = mongoose.model('CreditLimitHistory', creditLimitHistorySchema);
