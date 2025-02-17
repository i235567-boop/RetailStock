const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  partnerUuid: { type: String, required: true, unique: true },
  partnerName: { type: String, required: true },
  partnerType: { type: String, enum: ['b2b_platform', 'distributor', 'aggregator'], default: 'b2b_platform' },
  apiKeyHash: { type: String, required: true, unique: true },
  webhookUrl: { type: String, required: true },
  commissionRate: { type: Number, required: true, min: 0.01 },
  settlementAccountIban: { type: String, default: '' },
  status: { type: String, enum: ['active', 'suspended', 'terminated'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Partner', partnerSchema);
