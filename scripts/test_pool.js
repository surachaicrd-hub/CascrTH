const path = require('path');
const pool = require(path.join(__dirname, '..', 'api', 'config', 'database'));

async function test() {
  console.log('Testing pool query...');
  try {
    const [rows] = await pool.query('SELECT DATABASE() as db, CURRENT_USER() as user');
    console.log('SUCCESS:', rows);
  } catch (err) {
    console.error('FAILED:', err.message);
  }
  process.exit(0);
}

test();
