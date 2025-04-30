const Joi = require('joi');

// ── Auth ─────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name:            Joi.string().trim().min(2).max(100).required(),
  email:           Joi.string().email().lowercase().required(),
  password:        Joi.string().min(6).max(100).required(),
  phone:           Joi.string().min(10).max(15).required(),
  businessName:    Joi.string().max(200).optional().allow(''),
  businessType:    Joi.string().valid('kirana','general','mini_mart','departmental','other').optional(),
  businessAddress: Joi.string().max(300).optional().allow(''),
  cnicNumber:      Joi.string().pattern(/^\d{5}-\d{7}-\d$/).optional().allow(''),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(6).max(100).required(),
});

// ── Wallet ───────────────────────────────────────────────────────
const depositSchema = Joi.object({
  amount:      Joi.number().positive().required(),
  description: Joi.string().max(300).optional().allow(''),
  category:    Joi.string().max(100).optional().allow(''),
});

const withdrawSchema = Joi.object({
  amount:      Joi.number().positive().required(),
  description: Joi.string().max(300).optional().allow(''),
  category:    Joi.string().max(100).optional().allow(''),
});

const transferSchema = Joi.object({
  receiverEmail: Joi.string().email().required(),
  amount:        Joi.number().positive().required(),
  description:   Joi.string().max(300).optional().allow(''),
  category:      Joi.string().max(100).optional().allow(''),
});

// ── Financing ────────────────────────────────────────────────────
const financingApplySchema = Joi.object({
  amount:          Joi.number().positive().required(),
  durationDays:    Joi.number().valid(7, 14, 21, 30).required(),
  purpose:         Joi.string().valid('inventory','seasonal','new_product','emergency').optional(),
  productCategory: Joi.string().max(100).optional().allow(''),
  orderReference:  Joi.string().max(200).optional().allow(''),
});

const repaymentSchema = Joi.object({
  financingId:   Joi.string().hex().length(24).required(),
  amount:        Joi.number().positive().optional(),
  paymentMethod: Joi.string().valid('auto_debit','jazzcash','easypaisa','cash_deposit').optional(),
});

// ── Expenses ─────────────────────────────────────────────────────
const expenseSchema = Joi.object({
  title:         Joi.string().trim().min(1).max(200).required(),
  amount:        Joi.number().positive().required(),
  category:      Joi.string().max(100).required(),
  paymentMethod: Joi.string().valid('Cash','Wallet','JazzCash','EasyPaisa','Bank').optional(),
  date:          Joi.date().optional(),
  notes:         Joi.string().max(500).optional().allow(''),
});

// ── Budgets ──────────────────────────────────────────────────────
const budgetSchema = Joi.object({
  month:             Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  totalLimit:        Joi.number().positive().required(),
  warningThreshold:  Joi.number().min(1).max(99).optional(),
  categoryLimits:    Joi.array().items(Joi.object({
    category: Joi.string().required(),
    limit:    Joi.number().positive().required(),
  })).optional(),
});

// ── Categories ───────────────────────────────────────────────────
const categorySchema = Joi.object({
  name:        Joi.string().trim().min(1).max(100).required(),
  type:        Joi.string().valid('transaction','expense','budget').required(),
  description: Joi.string().max(300).optional().allow(''),
});

module.exports = {
  registerSchema, loginSchema, changePasswordSchema,
  depositSchema, withdrawSchema, transferSchema,
  financingApplySchema, repaymentSchema,
  expenseSchema, budgetSchema, categorySchema,
};
