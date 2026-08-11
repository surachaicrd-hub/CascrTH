const mysql = require('mysql2/promise');

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'khaotom_storageshed',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    const connection = await pool.getConnection();

    // Auto-create tables if they don't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        name TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        size VARCHAR(100),
        image_url TEXT,
        limit_one_per_order BOOLEAN DEFAULT FALSE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS quotation_requests (
        id VARCHAR(36) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        location VARCHAR(255),
        project_scale VARCHAR(50),
        area_size INT,
        budget VARCHAR(100),
        need_installation BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS customer_behavior (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default admin ONLY if no admins exist — generates a random password
    const [existingAdmins] = await connection.query('SELECT COUNT(*) as count FROM admins');
    if (existingAdmins[0].count === 0) {
      const bcryptForSeed = require('bcryptjs');
      const defaultPassword = require('crypto').randomBytes(12).toString('base64url');
      const hashedDefaultPassword = await bcryptForSeed.hash(defaultPassword, 12);
      await connection.query(
        'INSERT INTO admins (id, username, password) VALUES (?, ?, ?)',
        ['default-admin-uuid-1234', 'admin', hashedDefaultPassword]
      );
      console.log('\n⚠️  ===== DEFAULT ADMIN CREATED =====');
      console.log(`   Username: admin`);
      console.log(`   Password: ${defaultPassword}`);
      console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
      console.log('   ====================================\n');
    }

    // Create admin_notification_settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_notification_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id VARCHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        email VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        notify_quotation TINYINT(1) DEFAULT 0,
        notify_contact TINYINT(1) DEFAULT 0,
        notify_order TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create admin_notifications table for logging/in-app notifications
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        reference_id VARCHAR(36),
        link VARCHAR(255),
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create articles table (dependency for article_products)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(191) UNIQUE NOT NULL,
        content LONGTEXT,
        image_url TEXT,
        seo_title VARCHAR(255),
        seo_description TEXT,
        seo_keywords TEXT,
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS article_products (
        article_id INT,
        product_id VARCHAR(36),
        PRIMARY KEY (article_id, product_id),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      )
    `);

    // Create users table (must be before user_addresses due to FK)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(191) UNIQUE,
        password VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        avatar_url TEXT,
        google_id VARCHAR(100),
        line_id VARCHAR(100),
        verification_token VARCHAR(36),
        is_email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Add user_addresses table for profile expansion
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        type ENUM('shipping', 'tax') DEFAULT 'shipping',
        is_default BOOLEAN DEFAULT FALSE,
        title VARCHAR(50),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        company_name VARCHAR(255),
        tax_id VARCHAR(50),
        branch VARCHAR(100),
        phone VARCHAR(20) NOT NULL,
        address_line TEXT NOT NULL,
        subdistrict VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        province VARCHAR(100) NOT NULL,
        postal_code VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY user_product (user_id, product_id)
      )
    `);

    // Added Wishlists table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY user_product_wishlist (user_id, product_id)
      )
    `);

    // Added Checkout System tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        order_status VARCHAR(50) DEFAULT 'pending',
        shipping_address LONGTEXT,
        tax_invoice LONGTEXT,
        payment_slip_url TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price_at_purchase DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(191) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Category Attribute Templates for standardized product comparisons
    await connection.query(`
      CREATE TABLE IF NOT EXISTS category_attribute_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_name VARCHAR(191) NOT NULL,
        attribute_key VARCHAR(255) NOT NULL,
        attribute_label VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        is_required BOOLEAN DEFAULT FALSE,
        attribute_type ENUM('text', 'number', 'select') DEFAULT 'text',
        options TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_cat_attr (category_name, attribute_key(100))
      )
    `);

    // Insert default categories only if the table is completely empty
    const [catCount] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (catCount[0].count === 0) {
      const defaultCategories = ['PP/HDPE Sheds', 'Metal Sheds', 'Greenhouses', 'ตู้เก็บของอเนกประสงค์', 'โรงจอดรถ', 'กล่องเครื่องมือช่าง', 'บริการติดตั้ง'];
      const crypto = require('crypto');
      for (const cat of defaultCategories) {
        await connection.query('INSERT IGNORE INTO categories (id, name) VALUES (?, ?)', [crypto.randomUUID(), cat]);
      }
    }

    // Create API Tokens table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS api_tokens (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        token TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'temporary',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL
      )
    `);

    // Create Settings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Seed default contact settings
    const defaultContactSettings = [
      ['contact_company_name', 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด'],
      ['contact_address', '75/110 หมู่ 11 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120'],
      ['contact_phone', '02-908-1348 ต่อ 9'],
      ['contact_phone2', '089-199-3873 / 090-886-5389'],
      ['contact_email', ''],
      ['contact_email2', ''],
      ['contact_line_id', ''],
      ['contact_line_url', ''],
      ['contact_map_embed', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3873.0!2d100.64!3d14.07!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDA0JzEyLjAiTiAxMDDCsDM4JzI0LjAiRQ!5e0!3m2!1sth!2sth!4v1600000000000'],
      ['contact_working_hours', 'จันทร์ - ศุกร์ 08:00 - 17:00 น.'],
      // About Us Defaults
      ['about_hero_title', 'ประวัติความเป็นมาของ <br/> บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด'],
      ['about_hero_subtitle', 'เรื่องราวความสำเร็จของเรา'],
      ['about_hero_desc', 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด เป็นผู้นำในการนำเข้าและตัวแทนจำหน่ายสินค้าอเนกประสงค์ ด้วยประสบการณ์ความเชี่ยวชาญกว่า 20 ปี เรามุ่งมั่นสรรหาสินค้าคุณภาพสูงสุดเพื่อตอบโจทย์ทุกความต้องการของคุณ'],
      ['about_main_img', 'https://images.unsplash.com/photo-1541888086925-920a0eb46de2?q=80&w=2000&auto=format&fit=crop'],
      ['about_quote_title', 'แรงบันดาลใจที่ส่งต่อสู่พันธกิจ'],
      ['about_quote_text', '"เราเชื่อว่าทุกตารางเมตรมีความหมาย และคุณคู่ควรกับสิ่งที่ดีที่สุดเสมอ"'],
      ['about_core_1_title', 'คุณภาพคือหัวใจ'],
      ['about_core_1_desc', 'ทุกชิ้นส่วนถูกคัดสรรจากวัสดุเกรดอุตสาหกรรมสูงสุด ไม่ประนีประนอมกับมาตรฐานที่ส่งผลต่อความคุ้มค่าและความปลอดภัยของคุณ'],
      ['about_core_2_title', 'นวัตกรรมไม่หยุดนิ่ง'],
      ['about_core_2_desc', 'เทคโนโลยี AI และสถาปัตยกรรมระดับซอฟต์แวร์ช่วยให้ข้อผิดพลาดกลายเป็นศูนย์ และย่นระยะเวลาการทำงานให้เหลือเพียง 48 ชั่วโมง'],
      ['about_core_3_title', 'ความพึงพอใจเหนือความคาดหมาย'],
      ['about_core_3_desc', 'เราไม่เคยทิ้งลูกค้า และยินดีมอบการรับประกันพร้อมบริการหลังการขายที่รวดเร็ว ราวกับคุณคือแขกคนสำคัญของเรา'],
      ['about_vision_title', 'เพราะเรามุ่งมั่นให้บริการที่ดีที่สุด'],
      ['about_vision_desc', 'จากประสบการณ์ยาวนานกว่า 20 ปี เราเข้าใจถึงความสำคัญของการจัดเก็บและการใช้ประโยชน์จากพื้นที่ว่างให้เกิดประสิทธิภาพสูงสุด ด้วยสินค้าคุณภาพที่เชื่อถือได้'],
      ['about_stat_1_val', '20+'],
      ['about_stat_1_label', 'ปีแห่งประสบการณ์'],
      ['about_stat_2_val', '100%'],
      ['about_stat_2_label', 'คัดสรรคุณภาพ'],
      ['gemini_available_models', JSON.stringify([
        { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', description: 'รุ่นใหม่ล่าสุด เร็วและฉลาดที่สุด (แนะนำ)', tier: 'recommended' },
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'พรีวิวรุ่นที่ 3', tier: 'stable' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'เสถียร คุ้มค่า Fallback อัตโนมัติ', tier: 'stable' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'ขั้นสูง เหมาะงานซับซ้อน', tier: 'premium' },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', description: 'เบาที่สุด ประหยัด quota', tier: 'economy' }
      ])],
      // Homepage Banner settings
      ['home_banner_tag', 'คัดสรรสินค้าคุณภาพ'],
      ['home_banner_title', 'บ้านเก็บของ ที่แข็งแรง ทนทาน'],
      ['home_banner_subtitle', 'ใช้งานได้ยาวนาน คุ้มค่าคุ้มราคา'],
      ['home_banner_image', '/images/home/banner-sheds.webp'],
      ['home_banner_badge_text', 'สินค้าขายดี'],
      ['home_banner_badge_sub', 'อันดับ 1'],
      ['home_banner_bullets', JSON.stringify(['กันแดด กันฝน', 'วัสดุแข็งแรง', 'ประกอบง่าย', 'ดีไซน์สวย'])],
      // Homepage Why Choose Us settings
      ['home_why_choose_us_title', 'ทำไมต้องเลือกเรา?'],
      ['home_why_choose_us_bullets', JSON.stringify(['ดีไซน์สวย ทันสมัย', 'วัสดุแข็งแรง ทนทาน', 'กันแดด กันฝน 100%', 'ประกอบง่าย รวดเร็ว', 'เพิ่มพื้นที่ใช้บ้านเป็นระเบียบ', 'คุ้มค่า คุ้มราคา'])],
      // Homepage Promo Banner Card settings
      ['home_promo_tag', 'Premium Quality'],
      ['home_promo_title', 'โซลูชันจัดเก็บ ครบจบในที่เดียว'],
      ['home_promo_desc', 'แข็งแรง ทนทาน ใช้งานได้นาน ดีไซน์สไตล์โมเดิร์น'],
      ['home_promo_btn_text', 'ดูเพิ่มเติม'],
      ['home_promo_btn_link', '/products'],
      ['home_promo_image', '/images/home/hdpe-shed-promo.webp'],
      ['store_name', 'บ้านเก็บของ'],
      ['store_description', 'STORAGE HOUSE จำหน่ายและติดตั้งบ้านเก็บของ โรงเรือน และโกดังสำเร็จรูปคุณภาพสูง รับประกัน 10 ปี'],
      ['store_keywords', 'บ้านเก็บของ, ตู้เก็บของกลางแจ้ง, โกดังเก็บของ, บ้านเก็บของสำเร็จรูป, ห้องเก็บของ, บ้านโลหะ'],
      ['store_og_title', 'STORAGE HOUSE - บ้านเก็บของและโรงเรือนสำเร็จรูประดับพรีเมียม'],
      ['store_og_description', 'STORAGE HOUSE จำหน่ายและติดตั้งบ้านเก็บของ โรงเรือน และโกดังสำเร็จรูปคุณภาพสูง รับประกัน 10 ปี'],
      ['company_legal_name', 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด']
    ];
    for (const [key, value] of defaultContactSettings) {
      await connection.query('INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
    }

    const addColumn = async (table, colDef) => {
      try {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
      } catch (e) {
        // Ignore Duplicate column name error
        if (e.code !== 'ER_DUP_FIELDNAME') console.error(`Error adding column to ${table}:`, colDef, e.message);
      }
    };

    const addIndex = async (table, indexName, columns) => {
      try {
        await connection.query(`ALTER TABLE ${table} ADD INDEX ${indexName} (${columns})`);
        console.log(`Index ${indexName} verified/created on ${table}`);
      } catch (e) {
        // 1061 is ER_DUP_KEYNAME in MySQL
        if (e.errno !== 1061 && e.code !== 'ER_DUP_KEYNAME') {
          console.error(`Error adding index ${indexName} to ${table}:`, e.message);
        }
      }
    };


    // Users new fields (Tracking & Blacklist)
    await addColumn('users', 'registration_source VARCHAR(255) DEFAULT "organic"');
    await addColumn('users', 'is_blacklisted BOOLEAN DEFAULT false');

    // Forgot/Reset Password fields
    await addColumn('users', 'reset_token VARCHAR(36)');
    await addColumn('users', 'reset_token_expires DATETIME');

    await addColumn('products', 'categories JSON');
    // Migrate old category string to categories JSON array
    try {
      await connection.query('UPDATE products SET categories = JSON_ARRAY(category) WHERE categories IS NULL AND category IS NOT NULL AND category != ""');
    } catch(e) {}

    await addColumn('products', 'description LONGTEXT');
    await addColumn('products', 'images LONGTEXT');
    await addColumn('products', 'is_active BOOLEAN DEFAULT true');
    await addColumn('products', 'seo_title TEXT');
    await addColumn('products', 'seo_description TEXT');
    await addColumn('products', 'seo_keywords TEXT');
    await addColumn('products', 'shopee_link TEXT');
    await addColumn('products', 'lazada_link TEXT');
    await addColumn('products', 'tiktok_link TEXT');
    await addColumn('products', 'sort_order INT DEFAULT 0');
    await addColumn('products', 'sku VARCHAR(100)');
    await addColumn('products', 'original_price DECIMAL(10, 2)');
    await addColumn('products', 'llm_context TEXT');
    await addColumn('products', 'short_description TEXT');
    await addColumn('products', 'remarks TEXT');
    await addColumn('products', 'stock_quantity INT DEFAULT NULL');
    await addColumn('products', 'sale_end_date DATETIME DEFAULT NULL');

    // Physical dimensions for shipping
    await addColumn('products', 'weight_kg DECIMAL(10, 2) DEFAULT 0');
    await addColumn('products', 'width_cm DECIMAL(10, 2) DEFAULT 0');
    await addColumn('products', 'length_cm DECIMAL(10, 2) DEFAULT 0');
    await addColumn('products', 'height_cm DECIMAL(10, 2) DEFAULT 0');
    await addColumn('products', 'limit_one_per_order BOOLEAN DEFAULT FALSE');

    // New SEO & AI fields
    await addColumn('products', 'slug VARCHAR(191) UNIQUE');
    await addColumn('products', 'image_alt TEXT');
    await addColumn('products', 'attributes LONGTEXT');
    await addColumn('products', 'faq LONGTEXT');
    await addColumn('products', 'related_products LONGTEXT');

    // Product feature badges
    await addColumn('products', 'badge_free_shipping BOOLEAN DEFAULT false');
    await addColumn('products', 'badge_warranty BOOLEAN DEFAULT false');
    await addColumn('products', 'badge_installation BOOLEAN DEFAULT false');
    await addColumn('products', 'badge_new BOOLEAN DEFAULT false');
    await addColumn('products', 'badge_bestseller BOOLEAN DEFAULT false');
    await addColumn('products', 'badge_recommended BOOLEAN DEFAULT false');
    await addColumn('products', 'badges LONGTEXT');

    // Product review aggregates
    await addColumn('products', 'rating DECIMAL(2, 1) DEFAULT 0');
    await addColumn('products', 'review_count INT DEFAULT 0');
    await addColumn('products', 'is_out_of_stock BOOLEAN DEFAULT false');

    // Product timestamps
    await addColumn('products', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await addColumn('products', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // UI Features
    await addColumn('products', 'card_features JSON');

    // Dynamic product badges table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_badges (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(20) DEFAULT 'tag',
        color VARCHAR(20) DEFAULT 'gray',
        is_system BOOLEAN DEFAULT false,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default system badges
    const defaultBadges = [
      ['badge-free-shipping', 'ส่งฟรีทั่วประเทศ', 'check', 'emerald', true, 1],
      ['badge-warranty', 'รับประกันสินค้า', 'shield', 'blue', true, 2],
      ['badge-installation', 'พร้อมบริการติดตั้ง', 'cog', 'teal', true, 3],
      ['badge-new', 'สินค้าใหม่', 'star', 'amber', true, 4],
      ['badge-bestseller', 'สินค้าขายดี', 'fire', 'rose', true, 5],
      ['badge-recommended', 'สินค้าแนะนำ', 'thumbsup', 'indigo', true, 6],
    ];
    for (const [id, name, icon, color, isSystem, sortOrder] of defaultBadges) {
      await connection.query(
        'INSERT IGNORE INTO product_badges (id, name, icon, color, is_system, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, icon, color, isSystem, sortOrder]
      );
    }

    // Orders new fields
    await addColumn('orders', 'shipping_cost DECIMAL(10, 2) DEFAULT 0');
    await addColumn('orders', 'admin_notes TEXT');
    await addColumn('orders', 'tracking_number VARCHAR(100)');
    await addColumn('orders', 'shipping_provider VARCHAR(100)');
    await addColumn('orders', 'printed_shipping_label BOOLEAN DEFAULT false');
    await addColumn('orders', 'shipped_at TIMESTAMP NULL');
    await addColumn('orders', 'delivered_at TIMESTAMP NULL');
    await addColumn('orders', 'cancelled_at TIMESTAMP NULL');
    await addColumn('orders', 'cancel_reason TEXT');
    await addColumn('orders', 'customer_email VARCHAR(255) DEFAULT NULL');
    await addColumn('orders', 'coupon_code VARCHAR(50) DEFAULT NULL');
    await addColumn('orders', 'coupon_discount DECIMAL(10,2) DEFAULT 0');

    // Coupon codes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS coupon_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255) DEFAULT NULL,
        type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
        value DECIMAL(10,2) NOT NULL,
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        max_discount_amount DECIMAL(10,2) DEFAULT NULL,
        usage_limit INT DEFAULT NULL,
        used_count INT DEFAULT 0,
        expires_at DATETIME DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Order activity log
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_activity_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        performed_by VARCHAR(100) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_order_id (order_id)
      )
    `);

    // Quotation requests new fields
    await addColumn('quotation_requests', 'request_type VARCHAR(20) DEFAULT "individual"');
    await addColumn('quotation_requests', 'company_name VARCHAR(255)');
    await addColumn('quotation_requests', 'tax_id VARCHAR(50)');
    await addColumn('quotation_requests', 'email VARCHAR(255)');
    await addColumn('quotation_requests', 'usage_type VARCHAR(100)');
    await addColumn('quotation_requests', 'details TEXT');
    await addColumn('quotation_requests', 'attached_product VARCHAR(36)');
    await addColumn('quotation_requests', 'project_scale VARCHAR(50)');
    await addColumn('quotation_requests', 'status VARCHAR(50) DEFAULT "ใหม่"');

    // Projects table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description LONGTEXT,
        client_name VARCHAR(255),
        location VARCHAR(255),
        cover_image TEXT,
        gallery_images LONGTEXT,
        content_rich LONGTEXT,
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await addColumn('projects', 'product_id VARCHAR(36)');
    await addColumn('projects', 'service_date DATE');
    await addColumn('projects', 'badge_size VARCHAR(100)');
    await addColumn('projects', 'badge_tag VARCHAR(100)');

    await addColumn('categories', 'description TEXT');
    await addColumn('categories', 'image_url VARCHAR(255)');
    await addColumn('categories', 'sort_order INT DEFAULT 0');
    await addColumn('categories', 'features JSON');
    await addColumn('categories', 'is_active BOOLEAN DEFAULT true');

    // Cart items — abandoned cart email tracking
    await addColumn('cart_items', 'abandoned_email_sent BOOLEAN DEFAULT false');

    // Product Reviews table (centralized)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id VARCHAR(36) PRIMARY KEY,
        product_id VARCHAR(36) NOT NULL,
        order_id VARCHAR(36),
        user_id VARCHAR(36) NOT NULL,
        rating TINYINT NOT NULL DEFAULT 5,
        comment TEXT,
        images JSON,
        is_approved TINYINT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_product (product_id),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ──────────────────────────────────────────────
    // Ensure ALL tables have proper timestamp columns
    // ──────────────────────────────────────────────

    // quotation_requests: has created_at, missing updated_at
    await addColumn('quotation_requests', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // admins: has created_at, missing updated_at
    await addColumn('admins', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // categories: has created_at, missing updated_at
    await addColumn('categories', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // category_attribute_templates: has created_at, missing updated_at
    await addColumn('category_attribute_templates', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // api_tokens: has created_at, missing updated_at
    await addColumn('api_tokens', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // settings: has updated_at, missing created_at
    await addColumn('settings', 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    // product_badges: has created_at, missing updated_at
    await addColumn('product_badges', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // projects: has created_at, missing updated_at
    await addColumn('projects', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // newsletter_subscribers: has subscribed_at, missing updated_at
    await addColumn('newsletter_subscribers', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // contact_submissions: has created_at (via INSERT), missing updated_at
    await addColumn('contact_submissions', 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    // Smart Recommendation: Co-purchase index table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS product_co_purchases (
        product_id VARCHAR(36) NOT NULL,
        co_product_id VARCHAR(36) NOT NULL,
        co_count INT DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (product_id, co_product_id),
        INDEX idx_product (product_id),
        INDEX idx_count (co_count DESC)
      )
    `);

    // Smart Recommendation: Product popularity tracking
    await addColumn('products', 'view_count INT DEFAULT 0');

    // Create email_logs table for outgoing email tracking
    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        email_type VARCHAR(50) NOT NULL,
        status ENUM('success', 'failed') NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Optimize recommendations queries
    await addIndex('customer_behavior', 'idx_session_event', 'session_id, event_type');

    console.log('Database tables initialized successfully');

    connection.release();
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// Initialize tables on startup
initDB();

module.exports = pool;
