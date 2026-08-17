/**
 * Migration 004: Seed Initial Data
 * Seeds default categories, system badges, default admin (if none exists), and default site settings
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = {
  up: async (connection) => {
    // 1. Seed Default Admin if none exists
    const [existingAdmins] = await connection.query('SELECT COUNT(*) as count FROM admins');
    if (existingAdmins[0].count === 0) {
      const defaultPassword = crypto.randomBytes(12).toString('base64url');
      const hashedDefaultPassword = await bcrypt.hash(defaultPassword, 12);
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

    // 2. Seed Default Categories
    const [catCount] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (catCount[0].count === 0) {
      const defaultCategories = [
        'PP/HDPE Sheds',
        'Metal Sheds',
        'Greenhouses',
        'ตู้เก็บของอเนกประสงค์',
        'โรงจอดรถ',
        'กล่องเครื่องมือช่าง',
        'บริการติดตั้ง'
      ];
      for (const cat of defaultCategories) {
        await connection.query(
          'INSERT IGNORE INTO categories (id, name) VALUES (?, ?)',
          [crypto.randomUUID(), cat]
        );
      }
    }

    // 3. Seed Default System Badges
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

    // 4. Seed Default Site & Contact Settings
    const defaultSettings = [
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
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'เสถียร คุ้มค่า แนะนำ (หลัก)', tier: 'recommended' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'ขั้นสูง เหมาะงานซับซ้อน', tier: 'premium' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'ความเร็วสูง', tier: 'stable' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'โมเดลสำรอง', tier: 'stable' }
      ])],
      ['home_banner_tag', 'JAPANESE ENGINEERING'],
      ['home_banner_title', 'เครื่องตัดปอกสายไฟ KODERA แท้จากประเทศญี่ปุ่น'],
      ['home_banner_subtitle', 'ความแม่นยำสูง ทนทาน คุ้มค่าการลงทุนระยะยาว'],
      ['home_banner_image', '/logo.webp'],
      ['home_banner_badge_text', 'มาตรฐานสากล'],
      ['home_banner_badge_sub', 'JAPAN QUALITY'],
      ['home_banner_bullets', JSON.stringify(['ความแม่นยำสูง ±0.1mm', 'มาตรฐานญี่ปุ่น 100%', 'รองรับสายไฟหลากหลายขนาด', 'บริการ On-site และฝึกอบรม'])],
      ['home_why_choose_us_title', 'ทำไมโรงงานชั้นนำถึงเลือก KODERA จาก CR Distribution?'],
      ['home_why_choose_us_bullets', JSON.stringify(['ผู้นำเข้าแบรนด์ KODERA แท้', 'ความเร็วและความแม่นยำระดับไมครอน', 'บริการจัดส่งและติดตั้งถึงหน้างาน', 'สต็อกอะไหล่แท้ครบวงจร', 'ทีมวิศวกรผู้เชี่ยวชาญให้คำปรึกษา', 'รับประกันคุณภาพสินค้า'])],
      ['home_promo_tag', 'Wire Harness Solutions'],
      ['home_promo_title', 'โซลูชันระบบตัดปอกและย้ำสายไฟ ครบวงจรในที่เดียว'],
      ['home_promo_desc', 'ยกระดับประสิทธิภาพการผลิตด้วยเครื่องจักรคุณภาพสูง'],
      ['home_promo_btn_text', 'ดูสินค้าทั้งหมด'],
      ['home_promo_btn_link', '/products'],
      ['home_promo_image', '/logo.webp'],
      ['store_name', 'CR Distribution (Thailand) - เครื่องตัดปอกสายไฟ KODERA'],
      ['store_description', 'ผู้นำเข้าและจำหน่ายเครื่องตัดปอกสายไฟอัตโนมัติ KODERA เครื่องย้ำคอร์เนคเตอร์ และโซลูชันระบบ Wire Harness ครบวงจร พร้อมบริการติดตั้งและหลังการขายระดับมืออาชีพ'],
      ['store_keywords', 'เครื่องตัดปอกสายไฟ, เครื่องตัดสายไฟอัตโนมัติ, KODERA, Wire Stripping Machine, เครื่องย้ำคอนเนคเตอร์, Wire Harness'],
      ['store_og_title', 'CR Distribution | เครื่องตัดปอกสายไฟ KODERA และ Wire Harness Automation'],
      ['store_og_description', 'ศูนย์รวมเครื่องตัดปอกสายไฟ KODERA จากญี่ปุ่น เครื่องตัดสายไฟอัตโนมัติ คุณภาพสูง ความแม่นยำระดับไมครอน พร้อมทีมช่างผู้เชี่ยวชาญบริการทั่วประเทศ'],
      ['company_legal_name', 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด']
    ];

    for (const [key, value] of defaultSettings) {
      await connection.query('INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
    }
  }
};
