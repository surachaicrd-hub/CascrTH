const db = require('../api/config/database');
const fs = require('fs');
const path = require('path');

async function updateRealProducts() {
  console.log('🔄 Updating real products with exact card features and authentic data...');
  try {
    const productsData = [
      {
        sku: 'C300A',
        name: 'เครื่องตัดปอกสายไฟอัตโนมัติ รุ่น C300A KODERA CASTING',
        category: 'CASTING',
        categories: JSON.stringify(['CASTING', 'เครื่องตัดปอกสายไฟ']),
        image_url: '/uploads/products/c300a.png',
        short_description: 'เครื่องตัดปลอกสายไฟที่มีขนาดเล็ก และน้ำหนักเบา ซึ่งพัฒนาจากรุ่น C300 สามารถตัดสายไฟได้หลายแบบ',
        card_features: JSON.stringify({
          top_badge: 'CASTING',
          model_name: 'C300A',
          subtitle: 'เครื่องตัดปลอกสายไฟ KODERA',
          spec_range: 'AWG#16 (1.25sq) ~ AWG#36 (0.01sq)',
          capabilities: [
            { id: 'cut', label: 'ตัด', icon: 'cut', enabled: true },
            { id: 'strip_end', label: 'ปอกปลาย', icon: 'strip_end', enabled: true },
            { id: 'strip_mid', label: 'ปอกกลางสาย', icon: 'strip_mid', enabled: true }
          ],
          summary: 'เครื่องตัดปลอกสายไฟที่มีขนาดเล็ก และน้ำหนักเบา ซึ่งพัฒนาจากรุ่น C300 สามารถตัดสายไฟได้หลายแบบ',
          wire_samples: [
            { type: 'single_black', title: 'สายเดี่ยวสีดำ' },
            { type: 'single_blue', title: 'สายเดี่ยวสีน้ำเงิน' },
            { type: 'single_grey', title: 'สายเดี่ยวสีเทา' }
          ],
          service_call: '084-1022297',
          hotline: '089-7710627'
        }),
        sort_order: 1
      },
      {
        sku: 'C370G',
        name: 'เครื่องตัดปอกสายไฟอัตโนมัติ KODERA รุ่น C370G CASTING',
        category: 'CASTING',
        categories: JSON.stringify(['CASTING', 'เครื่องตัดปอกสายไฟ']),
        image_url: '/uploads/products/c370g.png',
        short_description: 'ตัวเครื่องขนาดกระทัดรัด ให้ประสิทธิภาพและความแม่นยำสูง รองรับขนาดสายไฟที่หลากหลาย',
        card_features: JSON.stringify({
          top_badge: 'CASTING',
          model_name: 'C370G',
          subtitle: 'เครื่องตัดปลอกสายไฟ KODERA',
          spec_range: 'AWG#10 (5.5sq) ~ AWG#32 (0.03sq)',
          capabilities: [
            { id: 'cut', label: 'ตัด', icon: 'cut', enabled: true },
            { id: 'strip_end', label: 'ปอกปลาย', icon: 'strip_end', enabled: true },
            { id: 'strip_mid', label: 'ปอกกลางสาย', icon: 'strip_mid', enabled: true }
          ],
          summary: 'ตัวเครื่องขนาดกระทัดรัด ให้ประสิทธิภาพและความแม่นยำสูง รองรับขนาดสายไฟที่หลากหลาย',
          wire_samples: [
            { type: 'single_black', title: 'สายเดี่ยวสีดำ' },
            { type: 'single_grey', title: 'สายเดี่ยวสีเทา' },
            { type: 'ground_yellow_green', title: 'สายดินเขียว-เหลือง' }
          ],
          service_call: '084-1022297',
          hotline: '089-7710627'
        }),
        sort_order: 2
      },
      {
        sku: 'C371G',
        name: 'เครื่องตัดปอกสายไฟ KODERA รุ่น C371G CASTING',
        category: 'CASTING',
        categories: JSON.stringify(['CASTING', 'เครื่องตัดปอกสายไฟ']),
        image_url: '/uploads/products/c371g.png',
        short_description: 'รุ่นมาตรฐาน สามารถติดตั้งออฟฟังก์ชั่นเสริมได้หลายแบบ รองรับงานหลากหลายประเภท',
        card_features: JSON.stringify({
          top_badge: 'CASTING',
          model_name: 'C371G',
          subtitle: 'เครื่องตัดปลอกสายไฟ KODERA',
          spec_range: 'AWG#7 (10sq) ~ AWG#28 (0.08sq)',
          capabilities: [
            { id: 'cut', label: 'ตัด', icon: 'cut', enabled: true },
            { id: 'strip_end', label: 'ปอกปลาย', icon: 'strip_end', enabled: true },
            { id: 'strip_mid', label: 'ปอกกลางสาย', icon: 'strip_mid', enabled: true },
            { id: 'twist', label: 'ปั่นเกลียว', icon: 'twist', enabled: true }
          ],
          summary: 'รุ่นมาตรฐาน สามารถติดตั้งออฟฟังก์ชั่นเสริมได้หลายแบบ รองรับงานหลากหลายประเภท',
          wire_samples: [
            { type: 'single_black', title: 'สายเดี่ยวสีดำ' },
            { type: 'single_grey', title: 'สายเดี่ยวสีเทา' },
            { type: 'twisted_pair', title: 'สายตีเกลียว' }
          ],
          service_call: '084-1022297',
          hotline: '089-7710627'
        }),
        sort_order: 3
      },
      {
        sku: 'C371AF',
        name: 'เครื่องตัดปอกสายไฟอัตโนมัติ CASTING รุ่น C371AF KODERA',
        category: 'CASTING',
        categories: JSON.stringify(['CASTING', 'เครื่องตัดปอกสายไฟ']),
        image_url: '/uploads/products/c371af.png',
        short_description: 'เครื่องตัดปลอกสายไฟแบบสายแบนและสายแพ รองรับงานเฉพาะทางได้อย่างมีประสิทธิภาพ',
        card_features: JSON.stringify({
          top_badge: 'CASTING',
          model_name: 'C371AF',
          subtitle: 'เครื่องตัดปลอกสายไฟ KODERA',
          spec_range: 'AWG#7 (10sq) ~ AWG#28 (0.08sq)',
          capabilities: [
            { id: 'cut', label: 'ตัด', icon: 'cut', enabled: true },
            { id: 'strip_end', label: 'ปอกปลาย', icon: 'strip_end', enabled: true },
            { id: 'strip_mid', label: 'ปอกกลางสาย', icon: 'strip_mid', enabled: true },
            { id: 'twist', label: 'ปั่นเกลียว', icon: 'twist', enabled: true },
            { id: 'ribbon', label: 'แยกสายแพ', icon: 'ribbon', enabled: true }
          ],
          summary: 'เครื่องตัดปลอกสายไฟแบบสายแบนและสายแพ รองรับงานเฉพาะทางได้อย่างมีประสิทธิภาพ',
          wire_samples: [
            { type: 'flat_ribbon_grey', title: 'สายแพแบนสีเทา' },
            { type: 'flat_ribbon_rainbow', title: 'สายแพแบนสีรุ้ง' }
          ],
          service_call: '084-1022297',
          hotline: '089-7710627'
        }),
        sort_order: 4
      }
    ];

    for (const item of productsData) {
      // Check if product exists by SKU or partial SKU (e.g. C371AG / C371AF)
      const [existing] = await db.query(
        'SELECT id FROM products WHERE sku = ? OR sku LIKE ? OR name LIKE ?',
        [item.sku, item.sku === 'C371AF' ? '%C371A%' : item.sku, `%${item.sku}%`]
      );

      if (existing.length > 0) {
        const prodId = existing[0].id;
        await db.query(
          `UPDATE products SET 
            sku = ?,
            name = ?,
            category = ?,
            categories = ?,
            image_url = ?,
            short_description = ?,
            card_features = ?,
            sort_order = ?,
            is_active = true
          WHERE id = ?`,
          [
            item.sku,
            item.name,
            item.category,
            item.categories,
            item.image_url,
            item.short_description,
            item.card_features,
            item.sort_order,
            prodId
          ]
        );
        console.log(`✅ Updated existing product [${item.sku}] (ID: ${prodId})`);
      } else {
        const crypto = require('crypto');
        const prodId = crypto.randomUUID();
        await db.query(
          `INSERT INTO products (
            id, sku, name, category, categories, price, image_url, short_description, card_features, sort_order, is_active
          ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, true)`,
          [
            prodId,
            item.sku,
            item.name,
            item.category,
            item.categories,
            item.image_url,
            item.short_description,
            item.card_features,
            item.sort_order
          ]
        );
        console.log(`✅ Inserted new product [${item.sku}] (ID: ${prodId})`);
      }
    }

    console.log('🎉 All real products successfully updated with genuine industrial card specifications!');
  } catch (error) {
    console.error('❌ Error updating products:', error);
  } finally {
    process.exit(0);
  }
}

updateRealProducts();
