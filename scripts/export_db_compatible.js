const fs = require('fs');
const path = require('path');
const mysql = require(path.join(__dirname, '..', 'api', 'node_modules', 'mysql2', 'promise'));

async function dumpDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cascr_th',
    charset: 'utf8mb4'
  });

  console.log('Connected to local database...');
  const [tables] = await connection.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
  
  let sql = `-- MySQL / MariaDB Compatible Database Dump
-- Generated on ${new Date().toISOString()}
-- Compatible with MySQL 5.7, 8.0, MariaDB 10.x

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

`;

  for (const tableRow of tables) {
    const tableName = Object.values(tableRow)[0];
    console.log(`Dumping table: ${tableName}`);

    // Drop table
    sql += `\n-- --------------------------------------------------------\n`;
    sql += `-- Table structure for table \`${tableName}\`\n`;
    sql += `-- --------------------------------------------------------\n`;
    sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;

    // Create table schema
    const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    let createSql = createTableResult[0]['Create Table'];

    // Replace MySQL 8 collation with universally compatible collation
    createSql = createSql
      .replace(/utf8mb4_0900_ai_ci/g, 'utf8mb4_unicode_ci')
      .replace(/utf8mb4_0900_as_cs/g, 'utf8mb4_unicode_ci')
      .replace(/utf8_0900_ai_ci/g, 'utf8_unicode_ci')
      .replace(/COLLATE=utf8mb4_0900_ai_ci/g, 'COLLATE=utf8mb4_unicode_ci');

    sql += `${createSql};\n\n`;

    // Dump data
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      sql += `-- Dumping data for table \`${tableName}\`\n`;
      
      const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
      
      // Batch inserts
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const valueStrings = batch.map(row => {
          const values = Object.values(row).map((val, idx) => {
            const colName = Object.keys(row)[idx];
            // Mask secrets for security
            if (tableName === 'settings' && row.setting_key === 'gemini_api_key' && colName === 'setting_value') {
              val = '';
            }
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 1 : 0;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            if (typeof val === 'object') return connection.escape(JSON.stringify(val));
            return connection.escape(val);
          });
          return `(${values.join(', ')})`;
        });

        sql += `INSERT INTO \`${tableName}\` (${columns}) VALUES\n${valueStrings.join(',\n')};\n`;
      }
      sql += `\n`;
    }
  }

  sql += `SET FOREIGN_KEY_CHECKS=1;\n`;

  const outputPath = path.join(__dirname, '..', 'cascr_th_compatible.sql');
  fs.writeFileSync(outputPath, sql, 'utf8');
  console.log(`✅ Dump finished! Saved to: ${outputPath} (${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB)`);

  await connection.end();
}

dumpDatabase().catch(err => {
  console.error('Error dumping database:', err);
  process.exit(1);
});
