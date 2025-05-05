require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startBackgroundJobs } = require('./utils/backgroundJobs');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB Atlas
  await connectDB();

  // Start background cron jobs (auto-debit, 3-day reminders, daily risk scoring)
  startBackgroundJobs();

  app.listen(PORT, () => {
    console.log(`\n🚀 RetailStock Backend running on port ${PORT}`);
    console.log(`📡 Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🏦 Partner API : http://localhost:${PORT}/api/v1/partners`);
    console.log(`👤 Admin API   : http://localhost:${PORT}/api/admin`);
  });
};

startServer();
