const path = require('path');
const mysql = require(path.join(__dirname, '..', 'api', 'node_modules', 'mysql2', 'promise'));

async function cleanBranding() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'cascr_th',
    charset: 'utf8mb4'
  });

  console.log('Connected to cascr_th database for brand cleanup...');

  // 1. Check products for KODERA images to use for slides and logo
  const [products] = await connection.query('SELECT id, name, sku, image_url, images, price FROM products ORDER BY sort_order ASC, id ASC');
  console.log(`Found ${products.length} products:`);
  products.forEach(p => console.log(` - [${p.id}] ${p.name} (${p.sku}): ${p.image_url}`));

  // 2. Prepare high quality KODERA slides
  const koderaSlides = [
    {
      id: 1,
      image: products[0]?.image_url || '/uploads/image-1786948628325-701752613.webp',
      tag: 'CASTING • KODERA JAPAN',
      titleLine1: 'KODERA C371G CASTING',
      titleLine2: 'เครื่องตัดปอกสายไฟอัตโนมัติ รุ่นมาตรฐานอุตสาหกรรม',
      desc: 'ความเร็วสูงสุด 10,000 ชิ้น/ชม. รองรับสายไฟขนาด 0.08 - 6.0 mm² พร้อมระบบใบมีดตัด 4 ด้านและการปอกสายแบบ Step Stripping แม่นยำระดับไมครอน',
      ctaText: 'ดูรายละเอียดสินค้า',
      ctaLink: products[0] ? `/products/${products[0].id}` : '/products',
      ctaAction: 'view_product',
      ctaText2: 'ขอใบเสนอราคาด่วน',
      ctaLink2: '/quotation',
      ctaAction2: 'quotation',
      badgeHighlight: 'กำลังการผลิตสูง',
      badgeHighlightIcon: 'zap',
      badgeHighlightLabel: 'จุดเด่น',
      badgeFeature: 'ระบบขับเคลื่อน 4 ลูกกลิ้ง',
      badgeFeatureIcon: 'cpu',
      badgeFeatureLabel: 'เทคโนโลยี',
      badgeSpecial: 'รับประกัน 1 ปี พร้อมทีมช่าง On-site'
    },
    {
      id: 2,
      image: products[1]?.image_url || '/uploads/image-1786948834606-258661882.webp',
      tag: 'HIGH PRECISION • KODERA JAPAN',
      titleLine1: 'KODERA C370G CASTING',
      titleLine2: 'เครื่องตัดปอกสายไฟความแม่นยำสูง สำหรับอิเล็กทรอนิกส์',
      desc: 'ออกแบบพิเศษสำหรับสายไฟขนาดเล็กถึงปานกลาง (0.05 - 2.5 mm²) เหมาะสำหรับงานผลิตชุดสายไฟยานยนต์ ชิ้นส่วนเครื่องใช้ไฟฟ้า และอุปกรณ์สื่อสาร',
      ctaText: 'ดูรายละเอียดสินค้า',
      ctaLink: products[1] ? `/products/${products[1].id}` : '/products',
      ctaAction: 'view_product',
      ctaText2: 'ขอใบเสนอราคาด่วน',
      ctaLink2: '/quotation',
      ctaAction2: 'quotation',
      badgeHighlight: 'ความแม่นยำสูง ±0.1mm',
      badgeHighlightIcon: 'target',
      badgeHighlightLabel: 'ความแม่นยำ',
      badgeFeature: 'หน้าจอสัมผัส Touch Screen',
      badgeFeatureIcon: 'monitor',
      badgeFeatureLabel: 'การควบคุม',
      badgeSpecial: 'ส่งมอบพร้อมฝึกอบรมฟรี'
    },
    {
      id: 3,
      image: products[2]?.image_url || '/uploads/image-1786948957813-742299723.webp',
      tag: 'HEAVY DUTY • KODERA JAPAN',
      titleLine1: 'KODERA C300A CASTING',
      titleLine2: 'เครื่องตัดปอกสายไฟขนาดใหญ่และสายไฟกำลัง (Power Cable)',
      desc: 'รองรับสายไฟขนาดใหญ่สูงสุด 38 mm² (AWG #2) มอเตอร์ทรงพลัง ตัดสายไฟฉนวนหนา ฉนวนสองชั้น และสายเคเบิลอุตสาหกรรมได้อย่างง่ายดาย',
      ctaText: 'ดูรายละเอียดสินค้า',
      ctaLink: products[2] ? `/products/${products[2].id}` : '/products',
      ctaAction: 'view_product',
      ctaText2: 'ขอใบเสนอราคาด่วน',
      ctaLink2: '/quotation',
      ctaAction2: 'quotation',
      badgeHighlight: 'รองรับสายไฟถึง 38 mm²',
      badgeHighlightIcon: 'shield',
      badgeHighlightLabel: 'กำลังตัด',
      badgeFeature: 'ใบมีดทังสเตนคาร์ไบด์',
      badgeFeatureIcon: 'tool',
      badgeFeatureLabel: 'ความทนทาน',
      badgeSpecial: 'อะไหล่แท้พร้อมส่งทันที'
    },
    {
      id: 4,
      image: products[3]?.image_url || products[0]?.image_url || '/uploads/image-1786948628325-701752613.webp',
      tag: 'FLAT CABLE SPECIALIST • KODERA',
      titleLine1: 'KODERA C371AF CASTING',
      titleLine2: 'เครื่องตัดปอกสายแพและสายไฟหลายคอร์อัตโนมัติ',
      desc: 'ประสิทธิภาพสูงสุดในการประมวลผล Flat Ribbon Cable, Multi-core Cable และสายไฟเฉพาะทาง แยกสายและปอกหัวท้ายอัตโนมัติ',
      ctaText: 'ดูรายละเอียดสินค้า',
      ctaLink: products[3] ? `/products/${products[3].id}` : '/products',
      ctaAction: 'view_product',
      ctaText2: 'ขอใบเสนอราคาด่วน',
      ctaLink2: '/quotation',
      ctaAction2: 'quotation',
      badgeHighlight: 'สำหรับสายแพ & Multi-core',
      badgeHighlightIcon: 'layers',
      badgeHighlightLabel: 'ความสามารถ',
      badgeFeature: 'ระบบปอกแยกคอร์แม่นยำ',
      badgeFeatureIcon: 'settings',
      badgeFeatureLabel: 'ฟังก์ชัน',
      badgeSpecial: 'มีเครื่องสาธิตให้ทดลอง'
    }
  ];

  // 3. Update Settings Table with real CascrTH / KODERA brand details
  const settingsToUpdate = {
    'store_name': 'CR Distribution (Thailand) - เครื่องตัดปอกสายไฟ KODERA',
    'store_logo': '/logo.webp',
    'store_favicon': '/favicon.ico',
    'store_tagline': 'ตัวแทนจำหน่ายเครื่องตัดปอกสายไฟ KODERA อย่างเป็นทางการในประเทศไทย',
    'store_description': 'ผู้นำเข้าและจำหน่ายเครื่องตัดปอกสายไฟอัตโนมัติ KODERA เครื่องย้ำคอร์เนคเตอร์ และโซลูชันระบบ Wire Harness ครบวงจร พร้อมบริการติดตั้งและหลังการขายระดับมืออาชีพ',
    'store_og_title': 'CR Distribution | เครื่องตัดปอกสายไฟ KODERA และ Wire Harness Automation',
    'store_og_description': 'ศูนย์รวมเครื่องตัดปอกสายไฟ KODERA จากญี่ปุ่น เครื่องตัดสายไฟอัตโนมัติ คุณภาพสูง ความแม่นยำระดับไมครอน พร้อมทีมช่างผู้เชี่ยวชาญบริการทั่วประเทศ',
    'store_og_image': '/logo.webp',
    'home_slides': JSON.stringify(koderaSlides),
    'home_hero_feature_badges': JSON.stringify([
      { icon: 'shield', title: 'มาตรฐานญี่ปุ่น 100%', desc: 'แบรนด์ KODERA แท้ นำเข้าโดยตรง' },
      { icon: 'target', title: 'ความแม่นยำ ±0.1mm', desc: 'ระบบขับเคลื่อน Stepping Motor ความเร็วสูง' },
      { icon: 'tool', title: 'บริการ On-site Service', desc: 'ทีมวิศวกรส่งมอบ ติดตั้ง และฝึกอบรมฟรี' },
      { icon: 'wrench', title: 'อะไหล่แท้พร้อมส่ง', desc: 'สต็อกใบมีดและอะไหล่ครบครันตลอดอายุการใช้งาน' }
    ]),
    'home_features_heading': 'KODERA EXCELLENCE',
    'home_features_title': 'เทคโนโลยีการแปรรูปสายไฟระดับสากล<br>เพื่อสายการผลิตที่แม่นยำและรวดเร็ว',
    'home_features_desc': 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด คือผู้นำเข้าและจัดจำหน่ายเครื่องตัดปอกสายไฟอัตโนมัติ KODERA ประเทศญี่ปุ่น ตอบสนองทุกมาตรฐานอุตสาหกรรมยานยนต์ อิเล็กทรอนิกส์ และเครื่องใช้ไฟฟ้า',
    'home_why_choose_us_title': 'ทำไมโรงงานชั้นนำถึงเลือก KODERA จาก CR Distribution?',
    'home_banner_title': 'เครื่องตัดปอกสายไฟ KODERA แท้จากประเทศญี่ปุ่น',
    'home_banner_subtitle': 'ความแม่นยำสูง ทนทาน คุ้มค่าการลงทุนระยะยาว',
    'home_banner_tag': 'JAPANESE ENGINEERING',
    'home_banner_image': products[0]?.image_url || '/logo.webp',
    'home_promo_title': 'โซลูชันระบบตัดปอกและย้ำสายไฟ ครบวงจรในที่เดียว',
    'home_promo_image': products[1]?.image_url || '/logo.webp',
    'services_hero_title': 'บริการส่งมอบ ติดตั้ง และบำรุงรักษาเครื่องจักร KODERA',
    'services_hero_subtitle': 'ความเชี่ยวชาญระดับวิศวกรรมที่คุณวางใจได้',
    'services_hero_desc': 'เรามีทีมวิศวกรและช่างผู้เชี่ยวชาญพร้อมให้คำปรึกษา ออกแบบสเปกตามตัวอย่างสายไฟจริง ส่งมอบ ติดตั้ง ฝึกอบรมการใช้งาน และบริการบำรุงรักษาเชิงป้องกันทั่วประเทศ',
    'services_hero_bg': '/logo.webp',
    'services_cta_title': 'ยกระดับสายการผลิตสายไฟของคุณสู่มาตรฐานสากลด้วยเครื่องจักร KODERA',
    'seo_default_llm_context': 'ผู้นำเข้าและจัดจำหน่ายเครื่องตัดปอกสายไฟอัตโนมัติ KODERA จากญี่ปุ่น เครื่องย้ำคอนเนคเตอร์ และอุปกรณ์สำหรับงาน Wire Harness ครบวงจร พร้อมบริการติดตั้ง ฝึกอบรม และบริการหลังการขายทั่วประเทศไทย',
    'smtp_from_name': 'CR Distribution (Thailand)',
    'payment_bank_account_name': 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
    'payment_bank_name': 'ธนาคารกสิกรไทย'
  };

  for (const [key, value] of Object.entries(settingsToUpdate)) {
    await connection.query(
      'INSERT INTO `settings` (`setting_key`, `setting_value`, `updated_at`) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`), `updated_at` = NOW()',
      [key, value]
    );
    console.log(`Updated setting: ${key}`);
  }

  // 4. Clean category names and descriptions if any old shed data exists
  const [categories] = await connection.query('SELECT * FROM categories');
  console.log(`\nCategories check (${categories.length}):`);
  categories.forEach(c => console.log(` - ${c.name}`));

  await connection.end();
  console.log('\n✅ Branding cleanup complete!');
}

cleanBranding().catch(err => {
  console.error('Error cleaning branding:', err);
  process.exit(1);
});
