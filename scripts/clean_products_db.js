const db = require('../api/config/database');
const fs = require('fs');
const path = require('path');

async function cleanProducts() {
  console.log('Cleaning products from database...');
  try {
    // Delete all products
    const [result] = await db.query('DELETE FROM products');
    console.log(`Successfully deleted ${result.affectedRows} products.`);

    // Delete wishlists
    const [wishlistsResult] = await db.query('DELETE FROM wishlists');
    console.log(`Successfully deleted ${wishlistsResult.affectedRows} wishlists.`);

    // Delete cart items
    const [cartResult] = await db.query('DELETE FROM cart_items');
    console.log(`Successfully deleted ${cartResult.affectedRows} cart items.`);
    
    // Clean up images in /uploads that start with product-
    const uploadsDir = path.join(__dirname, '../api/public/uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      let deletedImages = 0;
      for (const file of files) {
        if (file.startsWith('product-')) {
           fs.unlinkSync(path.join(uploadsDir, file));
           deletedImages++;
        }
      }
      console.log(`Deleted ${deletedImages} product images from /uploads.`);
    }

  } catch (error) {
    console.error('Error cleaning products:', error);
  } finally {
    process.exit(0);
  }
}

cleanProducts();
