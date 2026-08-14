/**
 * Migration 001: Initial Core Tables
 * Creates products, categories, admins, users, user_addresses, orders, order_items, settings, api_tokens
 */

const addColumn = async (connection, table, colDef) => {
  try {
    await connection.query(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') throw e;
  }
};

const addIndex = async (connection, table, indexName, columns) => {
  try {
    await connection.query(`ALTER TABLE ${table} ADD INDEX ${indexName} (${columns})`);
  } catch (e) {
    if (e.errno !== 1061 && e.code !== 'ER_DUP_KEYNAME') throw e;
  }
};

module.exports = {
  up: async (connection) => {
    // 1. Categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(191) UNIQUE NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        sort_order INT DEFAULT 0,
        features JSON,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 2. Products
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        name TEXT NOT NULL,
        sku VARCHAR(100),
        category VARCHAR(100) NOT NULL,
        categories JSON,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        size VARCHAR(100),
        image_url TEXT,
        images LONGTEXT,
        description LONGTEXT,
        short_description TEXT,
        remarks TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        is_out_of_stock BOOLEAN DEFAULT FALSE,
        stock_quantity INT DEFAULT NULL,
        sale_end_date DATETIME DEFAULT NULL,
        slug VARCHAR(191) UNIQUE,
        image_alt TEXT,
        attributes LONGTEXT,
        faq LONGTEXT,
        related_products LONGTEXT,
        card_features JSON,
        weight_kg DECIMAL(10, 2) DEFAULT 0,
        width_cm DECIMAL(10, 2) DEFAULT 0,
        length_cm DECIMAL(10, 2) DEFAULT 0,
        height_cm DECIMAL(10, 2) DEFAULT 0,
        limit_one_per_order BOOLEAN DEFAULT FALSE,
        badge_free_shipping BOOLEAN DEFAULT FALSE,
        badge_warranty BOOLEAN DEFAULT FALSE,
        badge_installation BOOLEAN DEFAULT FALSE,
        badge_new BOOLEAN DEFAULT FALSE,
        badge_bestseller BOOLEAN DEFAULT FALSE,
        badge_recommended BOOLEAN DEFAULT FALSE,
        badges LONGTEXT,
        rating DECIMAL(2, 1) DEFAULT 0,
        review_count INT DEFAULT 0,
        view_count INT DEFAULT 0,
        seo_title TEXT,
        seo_description TEXT,
        seo_keywords TEXT,
        llm_context TEXT,
        shopee_link TEXT,
        lazada_link TEXT,
        tiktok_link TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 3. Admins
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 4. Users
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
        reset_token VARCHAR(36),
        reset_token_expires DATETIME,
        registration_source VARCHAR(255) DEFAULT 'organic',
        is_blacklisted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 5. User Addresses
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 6. Orders
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        shipping_cost DECIMAL(10, 2) DEFAULT 0,
        coupon_code VARCHAR(50) DEFAULT NULL,
        coupon_discount DECIMAL(10, 2) DEFAULT 0,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        order_status VARCHAR(50) DEFAULT 'pending',
        shipping_address LONGTEXT,
        tax_invoice LONGTEXT,
        payment_slip_url TEXT NULL,
        tracking_number VARCHAR(100),
        shipping_provider VARCHAR(100),
        printed_shipping_label BOOLEAN DEFAULT FALSE,
        customer_email VARCHAR(255) DEFAULT NULL,
        admin_notes TEXT,
        shipped_at TIMESTAMP NULL,
        delivered_at TIMESTAMP NULL,
        cancelled_at TIMESTAMP NULL,
        cancel_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 7. Order Items
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 8. Settings
    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 9. API Tokens
    await connection.query(`
      CREATE TABLE IF NOT EXISTS api_tokens (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        token TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'temporary',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
};
