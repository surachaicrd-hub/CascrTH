const db = require('./config/database');

async function find() {
  try {
    const [products] = await db.query("SELECT id, name FROM products WHERE name LIKE '%NH140%' OR id LIKE '%2ae424d1%'");
    console.log("Matching Products in DB:");
    products.forEach(p => {
      console.log(`- ID: ${p.id} | Name: ${p.name}`);
    });
  } catch (error) {
    console.error("Search failed:", error);
  }
  process.exit();
}

find();
