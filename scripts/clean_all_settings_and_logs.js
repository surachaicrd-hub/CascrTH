const path = require('path');
const mysql = require(path.join(__dirname, '..', 'api', 'node_modules', 'mysql2', 'promise'));

async function cleanSettingsAndLogs() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'cascr_th',
    charset: 'utf8mb4'
  });

  console.log('Inspecting all matched settings rows...\n');
  const [rows] = await connection.query(`
    SELECT setting_key, setting_value 
    FROM settings 
    WHERE setting_value LIKE '%บ้านเก็บของ%' OR setting_value LIKE '%morespace%' OR setting_value LIKE '%STORAGE HOUSE%' OR setting_value LIKE '%storage-shed%' OR setting_value LIKE '%shed%'
  `);

  console.log(`Found ${rows.length} settings with legacy words:`);
  for (const r of rows) {
    console.log(`- ${r.setting_key}: ${r.setting_value.slice(0, 100)}...`);
  }

  // Clean specific settings keys
  const replacements = {
    'about_title': 'เกี่ยวกับ CR Distribution (Thailand)',
    'about_subtitle': 'ผู้นำเข้าและจัดจำหน่ายเครื่องตัดปอกสายไฟ KODERA จากประเทศญี่ปุ่น',
    'about_desc': 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด มุ่งมั่นส่งมอบเทคโนโลยีและเครื่องจักรอุตสาหกรรมแปรรูปสายไฟ Wire Harness มาตรฐานระดับสากล พร้อมบริการให้คำปรึกษา ออกแบบ ส่งมอบ ติดตั้ง และบำรุงรักษาครบวงจร',
    'about_core_1_title': 'เครื่องจักรคุณภาพสูง มาตรฐานญี่ปุ่น 100%',
    'about_core_1_desc': 'เราคัดสรรเครื่องตัดปอกสายไฟและเครื่องย้ำคอนเนคเตอร์ KODERA แท้จากประเทศญี่ปุ่น เพื่อประสิทธิภาพสูงสุดในสายการผลิต ความแม่นยำระดับไมครอน',
    'about_core_2_title': 'ทีมวิศวกรผู้เชี่ยวชาญ และบริการ On-site',
    'about_core_2_desc': 'บริการให้คำปรึกษา ออกแบบสเปกตามตัวอย่างสายไฟจริง ส่งมอบ ติดตั้ง และฝึกอบรมการใช้งานถึงโรงงานทั่วประเทศ',
    'about_core_3_title': 'สต็อกอะไหล่แท้ และบริการหลังการขายครบวงจร',
    'about_core_3_desc': 'พร้อมสนับสนุนทุกสายการผลิตด้วยอะไหล่แท้ ใบมีด และการบำรุงรักษาเชิงป้องกัน เพื่อให้เครื่องจักรทำงานได้อย่างต่อเนื่อง',
    'about_stat_1_label': 'เครื่องจักรที่ส่งมอบแล้ว (เครื่อง)',
    'about_stat_2_label': 'โรงงานอุตสาหกรรมที่ไว้วางใจ',
    'about_stat_3_label': 'ความแม่นยำในการตัดปอก (±mm)',
    'about_stat_4_label': 'ทีมวิศวกรและช่างผู้เชี่ยวชาญ',
    'home_faq': JSON.stringify([
      { q: "เครื่องตัดปอกสายไฟ KODERA รองรับสายไฟประเภทใดบ้าง?", a: "เครื่องจักร KODERA รองรับสายไฟหลากหลายชนิด ทั้งสายไฟเดี่ยว (Single Core), สายเคเบิลหลายคอร์ (Multi-Core), สายแพ (Flat Ribbon Cable), สายไฟทนความร้อน (Teflon/Silicone) และสายไฟกำลังขนาดใหญ่ถึง 38 mm²" },
      { q: "สามารถทดสอบตัดปอกสายไฟตัวอย่างก่อนตัดสินใจได้หรือไม่?", a: "ได้ครับ เรามีบริการทดสอบตัวอย่างสายไฟจริง (Sample Testing) ในห้องปฏิบัติการ พร้อมจัดทำรายงานผลการทดสอบและแนะนำรุ่นเครื่องจักรที่เหมาะสมที่สุดให้ฟรี" },
      { q: "มีบริการส่งมอบและฝึกอบรมการใช้งานหรือไม่?", a: "มีครับ เรามีทีมวิศวกรและช่างผู้เชี่ยวชาญเดินทางไปส่งมอบ ติดตั้ง และฝึกอบรมการตั้งค่าเครื่องและการบำรุงรักษาถึงโรงงานของท่านทั่วประเทศ" },
      { q: "การรับประกันและการดูแลหลังการขายเป็นอย่างไร?", a: "เครื่องจักร KODERA ทุกเครื่องรับประกัน 1 ปีเต็ม พร้อมบริการ On-site Service ตรวจเช็กสภาพเครื่อง และสต็อกอะไหล่แท้พร้อมส่งทันที" }
    ]),
    'home_showcase_slider': JSON.stringify([
      { image: '/uploads/image-1786691339402-741858740.webp', title: 'KODERA C371G CASTING', subtitle: 'เครื่องตัดปอกสายไฟอัตโนมัติ รุ่นมาตรฐานอุตสาหกรรม', desc: 'ความเร็วสูงสุด 10,000 ชิ้น/ชม. ความแม่นยำสูง' },
      { image: '/uploads/image-1786691881332-574111794.webp', title: 'KODERA C370G CASTING', subtitle: 'เครื่องตัดปอกสายไฟสำหรับอิเล็กทรอนิกส์', desc: 'ขนาดกะทัดรัด แม่นยำสูง ควบคุมด้วย Touch Screen' },
      { image: '/uploads/image-1786692070588-209545977.webp', title: 'KODERA C300A CASTING', subtitle: 'เครื่องตัดปอกสายไฟกำลัง Power Cable', desc: 'รองรับสายไฟขนาดใหญ่ถึง 38 mm² มอเตอร์ทรงพลัง' }
    ]),
    'home_partners': JSON.stringify([
      { name: 'KODERA', logo_url: '/logo.webp' },
      { name: 'CR Distribution', logo_url: '/logo.webp' }
    ]),
    'installation_guide': `<h2>คู่มือการเตรียมความพร้อมและติดตั้งเครื่องจักร KODERA</h2><p>เพื่อให้การส่งมอบและติดตั้งเครื่องตัดปอกสายไฟ KODERA เป็นไปอย่างราบรื่นและได้ประสิทธิภาพสูงสุด บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด ขอแนะนำขั้นตอนการเตรียมพื้นที่และการติดตั้งดังนี้:</p><h3>1. การเตรียมพื้นที่และโต๊ะปฏิบัติงาน</h3><p>จัดเตรียมโต๊ะทำงานที่มั่นคง แข็งแรง สามารถรับน้ำหนักเครื่องจักรได้ และอยู่ในระดับความสูงที่เหมาะสมกับผู้ปฏิบัติงาน</p><h3>2. การเตรียมระบบไฟฟ้าและลม (Air Supply)</h3><p>เตรียมปลั๊กไฟมาตรฐาน AC 220V พร้อมสายดิน (Grounding) และท่อจ่ายลมแรงดันตามสเปกที่รุ่นเครื่องจักรกำหนด (สำหรับรุ่นที่มีระบบลม)</p><h3>3. การติดตั้งและการฝึกอบรม</h3><p>ทีมวิศวกรของบริษัทฯ จะเข้าดำเนินการติดตั้ง Set-up ใบมีด ทดสอบการตัดสายไฟจริง และฝึกอบรมการใช้งานให้แก่ผู้ปฏิบัติงานของท่าน</p>`,
    'warranty_policy': `<h2>นโยบายและเงื่อนไขการรับประกันเครื่องจักร KODERA</h2><p>บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด รับประกันคุณภาพเครื่องตัดปอกสายไฟ KODERA เป็นระยะเวลา 1 ปีเต็ม นับจากวันส่งมอบและติดตั้ง</p><h3>ขอบเขตการรับประกัน</h3><ul><li>ครอบคลุมความชำรุดบกพร่องของชิ้นส่วนกลไก ระบบขับเคลื่อน และระบบควบคุมอิเล็กทรอนิกส์ที่เกิดจากการผลิตตามปกติ</li><li>บริการตรวจเช็กและซ่อมบำรุง On-site Service โดยทีมวิศวกรผู้เชี่ยวชาญ</li><li>ไม่ครอบคลุมชิ้นส่วนสิ้นเปลืองตามอายุการใช้งาน (เช่น ใบมีด ยางลูกกลิ้ง) หรือความเสียหายจากการใช้งานผิดวิธี</li></ul>`,
    'privacy_policy': `<h2>นโยบายความเป็นส่วนตัว (Privacy Policy)</h2><p>บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด ให้ความสำคัญสูงสุดกับการคุ้มครองข้อมูลส่วนบุคคลของลูกค้าและผู้ติดต่อทุกท่านตามมาตรฐาน PDPA</p><p>ข้อมูลที่จัดเก็บ เช่น ชื่อ เบอร์โทรศัพท์ อีเมล และชื่อบริษัท จะถูกนำมาใช้เพื่อวัตถุประสงค์ในการเสนอราคา การส่งมอบสินค้า และการให้บริการหลังการขายเท่านั้น</p>`,
    'terms_of_service': `<h2>เงื่อนไขการให้บริการ (Terms of Service)</h2><p>ข้อกำหนดและเงื่อนไขในการสั่งซื้อเครื่องจักร อะไหล่ และการรับบริการจาก บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด</p>`,
    'company_name': 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
    'company_legal_name': 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
    'contact_email': 'info@crdistribution.co.th',
    'admin_email': 'admin@crdistribution.co.th'
  };

  for (const [k, v] of Object.entries(replacements)) {
    await connection.query('INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`), `updated_at` = NOW()', [k, v]);
    console.log(`Updated setting: ${k}`);
  }

  // Update admin notification email
  await connection.query("UPDATE `admin_notification_settings` SET `email` = 'info@crdistribution.co.th' WHERE `email` LIKE '%morespace%'");

  // Clear legacy visit logs and behavior tables
  await connection.query("TRUNCATE TABLE `page_visits`");
  await connection.query("TRUNCATE TABLE `customer_behavior`");
  await connection.query("TRUNCATE TABLE `tracking_tag_logs`");
  await connection.query("TRUNCATE TABLE `email_logs`");
  await connection.query("TRUNCATE TABLE `newsletter_subscribers`");

  console.log('\n✅ Cleaned all settings and truncated legacy logs successfully!');

  await connection.end();
}

cleanSettingsAndLogs().catch(console.error);
