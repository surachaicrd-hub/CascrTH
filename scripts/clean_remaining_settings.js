const path = require('path');
const mysql = require(path.join(__dirname, '..', 'api', 'node_modules', 'mysql2', 'promise'));

async function cleanRemainingSettings() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'cascr_th',
    charset: 'utf8mb4'
  });

  const updates = {
    'about_hero_title': 'ผู้นำเข้าและจัดจำหน่ายเครื่องตัดปอกสายไฟ KODERA',
    'about_hero_desc': 'เราเป็นตัวแทนจำหน่ายเครื่องตัดปอกสายไฟอัตโนมัติ KODERA ประเทศญี่ปุ่น และโซลูชันระบบ Wire Harness ครบวงจร มุ่งมั่นส่งมอบเทคโนโลยีความแม่นยำสูงพร้อมบริการระดับมืออาชีพ',
    'about_mission_desc': 'มุ่งมั่นส่งมอบเครื่องจักรคุณภาพสูงและบริการวิศวกรรมที่ยอดเยี่ยม เพื่อเพิ่มผลผลิต ลดการสูญเสีย และยกระดับมาตรฐานอุตสาหกรรมการผลิตสายไฟในประเทศไทย',
    'about_vision_desc': 'ก้าวสู่การเป็นผู้นำอันดับหนึ่งด้านโซลูชันเครื่องตัดปอกสายไฟและระบบอัตโนมัติ Wire Harness ในประเทศไทยและภูมิภาคอาเซียน',
    'contact_email2': 'sales@crdistribution.co.th',
    'contact_emails': JSON.stringify([
      { name: 'ฝ่ายขายและบริการลูกค้า', value: 'sales@crdistribution.co.th' },
      { name: 'ฝ่ายวิศวกรรมและเทคนิค', value: 'service@crdistribution.co.th' }
    ]),
    'contact_facebook_url': '',
    'contact_line_id': '@crdistribution',
    'contact_line_url': 'https://line.me/ti/p/~@crdistribution',
    'contact_lines': JSON.stringify([
      { name: 'CR Distribution Official', value: '@crdistribution', url: 'https://line.me/ti/p/~@crdistribution' }
    ]),
    'contact_tiktok_url': '',
    'cookie_policy': `<h2>นโยบายการใช้คุกกี้ (Cookie Policy)</h2><p>บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด ใช้คุกกี้เพื่อเพิ่มประสิทธิภาพและมอบประสบการณ์ที่ดีที่สุดในการใช้งานเว็บไซต์</p>`,
    'home_affiliates': JSON.stringify([
      { name: 'KODERA MFG. CO., LTD.', description: 'ผู้ผลิตเครื่องตัดปอกสายไฟอัตโนมัติชั้นนำจากประเทศญี่ปุ่น มาตรฐานระดับโลก' },
      { name: 'CR Distribution (Thailand)', description: 'ตัวแทนจำหน่ายและศูนย์บริการเครื่องจักร KODERA อย่างเป็นทางการในประเทศไทย' }
    ]),
    'home_highlight_categories': JSON.stringify({
      title: "ค้นหาเครื่องจักร",
      titleHighlight: "ตามหมวดหมู่การใช้งาน",
      subtitle: "หมวดหมู่เครื่องจักร KODERA : ",
      items: []
    }),
    'home_testimonials': JSON.stringify([
      { name: 'ผู้จัดการฝ่ายผลิต โรงงานผลิตสายไฟยานยนต์', text: 'เครื่องตัดปอกสายไฟ KODERA C371G มีความแม่นยำสูงมาก ปอกสายไฟได้คมกริบ ไม่กินแกนทองแดง ช่วยเพิ่มความเร็วในไลน์ผลิตได้มากกว่า 30% ประทับใจการบริการของทีมวิศวกร CR Distribution มากครับ', rating: 5 },
      { name: 'หัวหน้าแผนกซ่อมบำรุง โรงงานชิ้นส่วนอิเล็กทรอนิกส์', text: 'เครื่อง KODERA C370G ใช้งานง่าย หน้าจอสัมผัสควบคุมสะดวก ตัดสายไฟขนาดเล็กได้อย่างแม่นยำ อะไหล่และใบมีดมีสต็อกพร้อมเปลี่ยนตลอดเวลา', rating: 5 }
    ]),
    'notify_email_address': 'sales@crdistribution.co.th,surachai@crtech.co.th',
    'payment_guide': `<h2>ข้อตกลงและเงื่อนไขการสั่งซื้อและชำระเงิน (Ordering and Payment Methods)</h2><p>บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด มีขั้นตอนการสั่งซื้อและชำระเงินที่โปร่งใสและได้มาตรฐานสำหรับภาคอุตสาหกรรม:</p><h3>1. การขอใบเสนอราคาและการทดสอบชิ้นงานตัวอย่าง</h3><p>ลูกค้าสามารถส่งตัวอย่างสายไฟจริงมาทดสอบในห้องปฏิบัติการเพื่อรับใบเสนอราคาพร้อมผลทดสอบ</p><h3>2. การสั่งซื้อและเงื่อนไขการชำระเงิน</h3><p>สั่งซื้อผ่านใบสั่งซื้อ (PO) อย่างเป็นทางการ พร้อมเงื่อนไขการชำระเงินตามที่ระบุในสัญญาซื้อขาย</p><h3>3. การส่งมอบและการรับประกัน</h3><p>ส่งมอบเครื่องจักร ติดตั้ง และฝึกอบรมการใช้งาน พร้อมเอกสารรับประกันคุณภาพสินค้า</p>`,
    'smtp_host': '',
    'smtp_user': ''
  };

  for (const [k, v] of Object.entries(updates)) {
    await connection.query(
      'INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`), `updated_at` = NOW()',
      [k, v]
    );
    console.log(`Cleaned remaining setting: ${k}`);
  }

  // Scan again to confirm 0 legacy words in settings
  const [rows] = await connection.query(`
    SELECT setting_key, setting_value 
    FROM settings 
    WHERE setting_value LIKE '%บ้านเก็บของ%' OR setting_value LIKE '%morespace%' OR setting_value LIKE '%STORAGE HOUSE%' OR setting_value LIKE '%storage-shed%'
  `);
  console.log(`\nRemaining legacy settings count: ${rows.length}`);
  for (const r of rows) {
    console.log(`- ${r.setting_key}: ${r.setting_value.slice(0, 100)}...`);
  }

  await connection.end();
}

cleanRemainingSettings().catch(console.error);
