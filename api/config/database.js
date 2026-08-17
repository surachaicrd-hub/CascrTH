const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const migrationService = require('../services/migrationService');

// Ensure dotenv is loaded
const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'api', '.env')
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
    break;
  }
}
require('dotenv').config();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || (process.env.NODE_ENV === 'production' ? 'localhost' : '127.0.0.1'),
  user: process.env.DB_USER !== undefined ? process.env.DB_USER : (process.env.NODE_ENV === 'production' ? 'khaotom_cascr' : 'root'),
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.NODE_ENV === 'production' ? 'Morespace15*' : ''),
  database: process.env.DB_NAME !== undefined ? process.env.DB_NAME : (process.env.NODE_ENV === 'production' ? 'khaotom_cascr' : 'cascr_th'),
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
