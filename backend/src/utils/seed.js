require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

const seed = async () => {
  await connectDB();

  // Clear existing
  await User.deleteMany({});
  await Wallet.deleteMany({});
  await Category.deleteMany({});
  await Transaction.deleteMany({});

  const passwordHash = await bcrypt.hash('Admin@123', 12);

  // Create admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@retailstock.pk',
    passwordHash,
    role: 'admin',
    status: 'active',
    phone: '03001234567',
    businessName: 'RetailStock HQ',
    kycStatus: 'verified',
    totalCreditLimit: 0,
    availableCredit: 0,
  });
  await Wallet.create({ userId: admin._id, balance: 0 });

  // Create demo users
  const users = [
    { name: 'Ahmed Khan', email: 'ahmed@kirana.pk', phone: '03011234567', businessName: 'Ahmed Kirana Store', businessAddress: 'Faisalabad', totalCreditLimit: 50000, availableCredit: 50000 },
    { name: 'Fatima Bibi', email: 'fatima@store.pk', phone: '03021234567', businessName: 'Fatima General Store', businessAddress: 'Multan', totalCreditLimit: 75000, availableCredit: 75000 },
    { name: 'Zaid Merchant', email: 'zaid@mini.pk', phone: '03031234567', businessName: 'Zaid Mini Mart', businessAddress: 'Lahore', totalCreditLimit: 30000, availableCredit: 30000 },
  ];

  for (const u of users) {
    const userHash = await bcrypt.hash('User@123', 12);
    const user = await User.create({ ...u, passwordHash: userHash, role: 'user', status: 'active', kycStatus: 'verified' });
    await Wallet.create({ userId: user._id, balance: Math.floor(Math.random() * 50000) + 10000 });
  }

  // Create default categories
  const categories = [
    { name: 'Inventory', type: 'transaction' }, { name: 'Transfer', type: 'transaction' },
    { name: 'General', type: 'transaction' }, { name: 'Repayment', type: 'transaction' },
    { name: 'Food', type: 'expense' }, { name: 'Transport', type: 'expense' },
    { name: 'Utilities', type: 'expense' }, { name: 'Rent', type: 'expense' },
    { name: 'Miscellaneous', type: 'expense' }, { name: 'Supplies', type: 'expense' },
    { name: 'Food', type: 'budget' }, { name: 'Transport', type: 'budget' },
    { name: 'Utilities', type: 'budget' }, { name: 'Supplies', type: 'budget' },
  ];
  await Category.insertMany(categories.map(c => ({ ...c, isActive: true, createdBy: admin._id })));

  console.log('✅ Database seeded successfully!');
  console.log('👤 Admin: admin@retailstock.pk / Admin@123');
  console.log('👤 User:  ahmed@kirana.pk / User@123');
  console.log('👤 User:  fatima@store.pk / User@123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
