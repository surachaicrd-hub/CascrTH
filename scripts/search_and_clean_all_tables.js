const path = require('path');
const mysql = require(path.join(__dirname, '..', 'api', 'node_modules', 'mysql2', 'promise'));

async function scanAndCleanDatabase() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'cascr_th',
    charset: 'utf8mb4'
  });

  console.log('Scanning all database tables for old branding words...\n');

  const [tables] = await connection.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
  
  for (const tableRow of tables) {
    const tableName = Object.values(tableRow)[0];
    const [cols] = await connection.query(`DESCRIBE \`${tableName}\``);
    
    // Find text/varchar/json columns
    const textCols = cols.filter(c => 
      c.Type.includes('varchar') || c.Type.includes('text') || c.Type.includes('json') || c.Type.includes('char')
    ).map(c => c.Field);

    if (textCols.length === 0) continue;

    for (const col of textCols) {
      const queryStr = `SELECT \`${col}\` FROM \`${tableName}\` WHERE \`${col}\` LIKE '%บ้านเก็บของ%' OR \`${col}\` LIKE '%morespace%' OR \`${col}\` LIKE '%STORAGE HOUSE%' OR \`${col}\` LIKE '%storage-shed%'`;
      try {
        const [matches] = await connection.query(queryStr);
        if (matches.length > 0) {
          console.log(`[MATCH FOUND] Table: ${tableName}, Column: ${col} (${matches.length} rows)`);
        }
      } catch (err) {
        // Ignore JSON search error if any
      }
    }
  }

  // 1. Clean Articles table if any old articles exist
  console.log('\nChecking articles table...');
  const [articles] = await connection.query('SELECT id, title, category FROM articles');
  console.log(`Total articles: ${articles.length}`);
  for (const a of articles) {
    console.log(` - [${a.id}] ${a.title} (${a.category})`);
  }

  // 2. Clean Projects table
  console.log('\nChecking projects table...');
  const [projects] = await connection.query('SELECT id, title, category FROM projects');
  console.log(`Total projects: ${projects.length}`);
  for (const p of projects) {
    console.log(` - [${p.id}] ${p.title} (${p.category})`);
  }

  // 3. Clean Categories table
  console.log('\nChecking categories table...');
  const [categories] = await connection.query('SELECT id, name FROM categories');
  console.log(`Total categories: ${categories.length}`);
  for (const c of categories) {
    console.log(` - [${c.id}] ${c.name}`);
  }

  await connection.end();
}

scanAndCleanDatabase().catch(console.error);
