const fs = require('fs');
const path = require('path');

/**
 * Migration Service
 * Manages database schema migrations with automated tracking in `schema_migrations`.
 */
class MigrationService {
  constructor() {
    this.migrationsDir = path.join(__dirname, '..', 'migrations');
    this._runningPromise = null;
  }

  /**
   * Ensure schema_migrations tracking table exists
   */
  async ensureMigrationTable(connection) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  /**
   * Get all applied migrations from the database
   */
  async getAppliedMigrations(connection) {
    await this.ensureMigrationTable(connection);
    const [rows] = await connection.query('SELECT name, applied_at FROM schema_migrations ORDER BY id ASC');
    return rows;
  }

  /**
   * Get all migration files from the migrations directory
   */
  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
      return [];
    }

    return fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.js') || file.endsWith('.sql'))
      .sort(); // Sort alphabetically/numerically
  }

  /**
   * Run pending migrations
   */
  async runMigrations(pool) {
    if (this._runningPromise) {
      return this._runningPromise;
    }

    this._runningPromise = (async () => {
      if (!pool) {
        pool = require('../config/database');
      }

      const connection = await pool.getConnection();
      try {
        await this.ensureMigrationTable(connection);
        const appliedRows = await this.getAppliedMigrations(connection);
        const appliedSet = new Set(appliedRows.map(r => r.name));

        const files = this.getMigrationFiles();
        const pendingFiles = files.filter(f => !appliedSet.has(f));

        if (pendingFiles.length === 0) {
          console.log('✅ Database is up to date. No pending migrations.');
          return { applied: [], pending: 0 };
        }

        console.log(`🚀 Found ${pendingFiles.length} pending migration(s)...`);
        const executed = [];

        for (const file of pendingFiles) {
          const filePath = path.join(this.migrationsDir, file);
          console.log(`⏳ Applying migration: ${file}...`);
          const startTime = Date.now();

          if (file.endsWith('.js')) {
            const migration = require(filePath);
            if (typeof migration.up === 'function') {
              await migration.up(connection);
            } else if (typeof migration === 'function') {
              await migration(connection);
            }
          } else if (file.endsWith('.sql')) {
            const sql = fs.readFileSync(filePath, 'utf8');
            const statements = sql
              .split(';')
              .map(s => s.trim())
              .filter(s => s.length > 0);
            for (const statement of statements) {
              await connection.query(statement);
            }
          }

          // Record successful migration
          await connection.query('INSERT IGNORE INTO schema_migrations (name) VALUES (?)', [file]);
          const elapsed = Date.now() - startTime;
          console.log(`✅ Applied migration: ${file} (${elapsed}ms)`);
          executed.push(file);
        }

        console.log(`🎉 Successfully applied ${executed.length} migration(s).`);
        return { applied: executed, pending: 0 };
      } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
      } finally {
        connection.release();
        this._runningPromise = null;
      }
    })();

    return this._runningPromise;
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(pool) {
    if (!pool) {
      pool = require('../config/database');
    }
    const connection = await pool.getConnection();
    try {
      await this.ensureMigrationTable(connection);
      const appliedRows = await this.getAppliedMigrations(connection);
      const appliedMap = new Map(appliedRows.map(r => [r.name, r.applied_at]));
      const allFiles = this.getMigrationFiles();

      const status = allFiles.map(file => ({
        name: file,
        status: appliedMap.has(file) ? 'APPLIED' : 'PENDING',
        applied_at: appliedMap.get(file) || null
      }));

      return status;
    } finally {
      connection.release();
    }
  }
}

module.exports = new MigrationService();
