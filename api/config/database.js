const mysql = require('mysql2/promise');
const migrationService = require('../services/migrationService');

const isProduction = process.env.NODE_ENV === 'production';

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || (isProduction ? 'localhost' : '127.0.0.1'),
  user: process.env.DB_USER || (isProduction ? 'khaotom_cascr' : 'root'),
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (isProduction ? 'Morespace15*' : ''),
  database: process.env.DB_NAME || (isProduction ? 'khaotom_cascr' : 'cascr_th'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

/**
 * Initialize Database and run pending migrations
 */
async function initDB() {
  try {
    console.log('🔄 Checking database migrations...');
    await migrationService.runMigrations(pool);
  } catch (error) {
    console.error('❌ Database initialization / migration failed:', error.message);
  }
}

// Auto-run migrations on startup
initDB();

module.exports = pool;
