const app = require('./app');
const sequelize = require('./config/database');
const { testConnection, isProduction, shouldUseMockData } = require('./config/database');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3000;

// Test database connection and start server
async function startServer() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🌊 IoT Desalinasi Backend Server');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📌 Environment: ' + (isProduction ? 'PRODUCTION' : 'DEVELOPMENT'));
  console.log('');

  try {
    // Test database connection using our new function
    const dbConnected = await testConnection();

    if (dbConnected) {
      console.log('');
      console.log('📊 Database Info:');
      console.log('   - Host: ' + (process.env.DB_HOST || 'localhost'));
      console.log('   - Database: ' + (process.env.DB_NAME || 'iot_desalinasi'));
      console.log('   - User: ' + (process.env.DB_USER || 'root'));
      console.log('');

      // Sync database (create tables if they don't exist)
      await sequelize.sync({ alter: true });
      console.log('✅ Database synced');
    }

    // Start server regardless of database status (in development)
    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🚀 Server is running on http://localhost:' + PORT);
      console.log('📡 API available at http://localhost:' + PORT + '/api');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('');

      if (shouldUseMockData()) {
        console.log('📦 DATA MODE: Mock Data (In-Memory)');
        console.log('   ⚠️  Data will NOT be persisted!');
        console.log('   ℹ️  Start MySQL/XAMPP and restart for persistent storage');
      } else {
        console.log('💾 DATA MODE: MySQL Database (Persistent)');
        console.log('   ✅ All CRUD operations will be saved to database');
      }

      console.log('');
      console.log('✅ Ready to accept requests!');
      console.log('');
    });

  } catch (error) {
    // This only happens in production mode when database fails
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('❌ FATAL: Database connection failed in PRODUCTION mode!');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('');
    console.error('⚠️  Please check:');
    console.error('   1. MySQL server is running');
    console.error('   2. Database "iot_desalinasi" exists');
    console.error('   3. Credentials in .env are correct');
    console.error('   4. MySQL port 3306 is accessible');
    console.error('');
    console.error('═══════════════════════════════════════════════════════════════');
    console.error('');
    process.exit(1);
  }
}

// Start the server
startServer();
