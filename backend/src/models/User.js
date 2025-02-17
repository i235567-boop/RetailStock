const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'blocked', 'suspended', 'pending'], default: 'active' },
  phone: { type: String, required: true },
  cnicNumber: { type: String, unique: true, sparse: true },
  businessName: { type: String, default: '' },
  businessType: { type: String, enum: ['kirana', 'general', 'mini_mart', 'departmental', 'other'], default: 'kirana' },
  businessAddress: { type: String, default: '' },
  businessLat: { type: Number },
  businessLong: { type: Number },
  bankIban: { type: String, default: '' },
  bankVerified: { type: Boolean, default: false },
  totalCreditLimit: { type: Number, default: 50000 },
  availableCredit: { type: Number, default: 50000 },
  riskTier: { type: String, enum: ['low', 'medium', 'high', 'prohibited'], default: 'low' },
  kycStatus: { type: String, enum: ['pending', 'verified', 'failed', 'under_review'], default: 'pending' },
  lastLogin: { type: Date },
  passwordChangedAt: { type: Date },
}, { timestamps: true });

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
