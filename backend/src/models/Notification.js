const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['transaction', 'budget', 'security', 'account', 'financing', 'system'],
    default: 'system'
  },
  readStatus: { type: Boolean, default: false },
  relatedTransactionId: { type: String },
  relatedFinancingId: { type: String },
}, { timestamps: true });

notificationSchema.index({ userId: 1, readStatus: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
