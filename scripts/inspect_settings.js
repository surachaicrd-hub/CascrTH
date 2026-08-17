const path = require('path');
const mysql = require(path.join(__dirname, '..', 'api', 'node_modules', 'mysql2', 'promise'));

async function inspectSettings() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'cascr_th',
    charset: 'utf8mb4'
  });

  const [rows] = await connection.query('SELECT `setting_key`, `setting_value` FROM `settings`');
  console.log(`Total settings count: ${rows.length}\n`);
  for (const r of rows) {
    const k = r.setting_key;
    const v = r.setting_value || '';
    if (
      k.includes('logo') || k.includes('name') || k.includes('favicon') || k.includes('slide') ||
      k.includes('title') || k.includes('hero') || k.includes('banner') || k.includes('header') ||
      k.includes('about') || k.includes('contact') || k.includes('seo') ||
      v.toLowerCase().includes('storage') || v.includes('บ้านเก็บของ') || v.toLowerCase().includes('shed')
    ) {
      console.log(`[KEY]: ${k}`);
      console.log(`[VAL]: ${v.slice(0, 180)}...\n`);
    }
  }

  await connection.end();
}

inspectSettings().catch(console.error);
