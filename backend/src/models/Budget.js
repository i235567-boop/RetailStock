const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // Format: YYYY-MM
  totalLimit: { type: Number, required: true, min: 1 },
  categoryLimits: [{
    category: { type: String, required: true },
    limit: { type: Number, required: true, min: 1 }
  }],
  spentAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['safe', 'nearLimit', 'exceeded'], default: 'safe' },
  warningThreshold: { type: Number, default: 80 }, // percentage
}, { timestamps: true });

budgetSchema.index({ userId: 1, month: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
