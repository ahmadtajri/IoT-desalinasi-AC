const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
    process.env.DB_NAME || 'iot_desalinasi',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Database connection state
let isDatabaseConnected = false;

// Test database connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        isDatabaseConnected = true;
        console.log('✅ Database connection established successfully.');
        return true;
    } catch (error) {
        isDatabaseConnected = false;

        // Check for specific error: Unknown database
        if (error.original && error.original.code === 'ER_BAD_DB_ERROR') {
            console.error('\n❌ ERROR: Database "iot_desalinasi" belum dibuat!');
            console.error('   Silakan buat database terlebih dahulu di phpMyAdmin atau jalankan script setup.\n');
        }

        if (isProduction) {
            console.error('❌ PRODUCTION MODE: Database connection failed!', error.message);
            throw error; // In production, throw error - database is required
        } else {
            console.warn('⚠️  DEVELOPMENT MODE: Database unavailable, using mock data.');
            console.warn('   Error:', error.message);
            return false;
        }
    }
}

// Check if database is available
function isConnected() {
    return isDatabaseConnected;
}

// Check if should use mock data
function shouldUseMockData() {
    // In production, always use real database (never mock)
    if (isProduction) return false;
    // In development, use mock data if database is not connected
    return !isDatabaseConnected;
}

module.exports = sequelize;
module.exports.testConnection = testConnection;
module.exports.isConnected = isConnected;
module.exports.shouldUseMockData = shouldUseMockData;
module.exports.isProduction = isProduction;
