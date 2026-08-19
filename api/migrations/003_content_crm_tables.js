/**
 * Migration 003: Content and CRM Tables
 * Creates articles, article_products, projects, quotation_requests,
 * customer_behavior, admin_notifications, admin_notification_settings,
 * email_logs, contact_submissions, newsletter_subscribers
 */

module.exports = {
  up: async (connection) => {
    // 1. Articles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(191) UNIQUE NOT NULL,
        excerpt TEXT,
        content LONGTEXT,
        cover_image VARCHAR(1000),
        image_url TEXT,
        category VARCHAR(200) DEFAULT 'ทั่วไป',
        tags TEXT,
        seo_title VARCHAR(500),
        seo_description TEXT,
        seo_keywords TEXT,
        faq JSON,
        llm_context TEXT,
        is_published TINYINT(1) DEFAULT 0,
        is_featured TINYINT(1) DEFAULT 0,
        view_count INT DEFAULT 0,
        author VARCHAR(200) DEFAULT 'Admin',
        product_id VARCHAR(36) DEFAULT NULL,
        gallery_images TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Helper to ensure columns exist if articles table was previously created with fewer columns
    const [cols] = await connection.query("SHOW COLUMNS FROM articles");
    const existingColNames = cols.map(c => c.Field);
    const ensureColumn = async (colName, colDef) => {
      if (!existingColNames.includes(colName)) {
        await connection.query(`ALTER TABLE articles ADD COLUMN ${colName} ${colDef}`);
      }
    };
    await ensureColumn('excerpt', 'TEXT');
    await ensureColumn('cover_image', 'VARCHAR(1000)');
    await ensureColumn('category', "VARCHAR(200) DEFAULT 'ทั่วไป'");
    await ensureColumn('tags', 'TEXT');
    await ensureColumn('faq', 'JSON');
    await ensureColumn('llm_context', 'TEXT');
    await ensureColumn('is_featured', 'TINYINT(1) DEFAULT 0');
    await ensureColumn('view_count', 'INT DEFAULT 0');
    await ensureColumn('author', "VARCHAR(200) DEFAULT 'Admin'");
    await ensureColumn('product_id', 'VARCHAR(36) DEFAULT NULL');
    await ensureColumn('gallery_images', 'TEXT');

    // 2. Article Products Link
    await connection.query(`
      CREATE TABLE IF NOT EXISTS article_products (
        article_id INT,
        product_id VARCHAR(36),
        PRIMARY KEY (article_id, product_id),
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 3. Projects
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
        product_id VARCHAR(36),
        service_date DATE,
        badge_size VARCHAR(100),
        badge_tag VARCHAR(100),
        is_published BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 4. Quotation Requests
    await connection.query(`
      CREATE TABLE IF NOT EXISTS quotation_requests (
        id VARCHAR(36) PRIMARY KEY,
        request_type VARCHAR(20) DEFAULT 'individual',
        customer_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        company_name VARCHAR(255),
        tax_id VARCHAR(50),
        location VARCHAR(255),
        usage_type VARCHAR(100),
        project_scale VARCHAR(50),
        area_size INT,
        budget VARCHAR(100),
        details TEXT,
        attached_product VARCHAR(36),
        need_installation BOOLEAN,
        status VARCHAR(50) DEFAULT 'ใหม่',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 5. Customer Behavior
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customer_behavior (
        id VARCHAR(36) PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data LONGTEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_event (session_id, event_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 6. Admin Notifications
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

    // 7. Admin Notification Settings
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

    // 8. Email Logs
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

    // 9. Contact Submissions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 10. Newsletter Subscribers
    await connection.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        status ENUM('active', 'unsubscribed') DEFAULT 'active',
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 11. Page Visits Analytics
    await connection.query(`
      CREATE TABLE IF NOT EXISTS page_visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(100) NOT NULL,
        page_path VARCHAR(500) NOT NULL,
        page_title VARCHAR(500),
        referrer VARCHAR(1000),
        utm_source VARCHAR(200),
        utm_medium VARCHAR(200),
        utm_campaign VARCHAR(200),
        device_type ENUM('desktop','tablet','mobile') DEFAULT 'desktop',
        browser VARCHAR(100),
        os VARCHAR(100),
        screen_width INT,
        screen_height INT,
        language VARCHAR(20),
        country VARCHAR(100),
        time_on_page INT DEFAULT 0,
        scroll_depth INT DEFAULT 0,
        is_bounce BOOLEAN DEFAULT TRUE,
        ip_address VARCHAR(100),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session (session_id),
        INDEX idx_created (created_at),
        INDEX idx_page (page_path(255)),
        INDEX idx_device (device_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }
};
