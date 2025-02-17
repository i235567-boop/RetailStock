const mongoose = require('mongoose');

const financingRecordSchema = new mongoose.Schema({
  financingUuid: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
  orderReference: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'defaulted', 'cancelled'],
    default: 'pending'
  },
  purpose: {
    type: String,
    enum: ['inventory', 'seasonal', 'new_product', 'emergency'],
    default: 'inventory'
  },
  productCategory: { type: String, default: 'General' },
  costPrice: { type: Number, required: true, min: 1 },
  profitMarkup: { type: Number, required: true, min: 0 },
  totalRepaymentAmount: { type: Number, required: true },
  financingDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  durationDays: { type: Number, enum: [7, 14, 21, 30], required: true },
  remainingBalance: { type: Number },
  repaidAmount: { type: Number, default: 0 },
  contractPdfUrl: { type: String, default: '' },
  digitalSignature: { type: String, default: '' },
  markupRate: { type: Number },
}, { timestamps: true });

financingRecordSchema.index({ userId: 1, status: 1 });
financingRecordSchema.index({ dueDate: 1 });

module.exports = mongoose.model('FinancingRecord', financingRecordSchema);
