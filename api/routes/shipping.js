const express = require('express');
const router = express.Router();
const db = require('../config/database');

// -------------------------------------------------------------
// Core Shipping Rules & Pricing Configuration (Zone Database)
// In a real production app, this could be stored in the DB (`settings`), 
// but for performance, we map provinces to zones linearly here.
// -------------------------------------------------------------

// Thailand Province to Zone Mapping
const PROVINCE_ZONES = {
    // โซนกรุงเทพและปริมณฑล (Bangkok & Vicinities)
    'กรุงเทพมหานคร': 'BKK', 'นนทบุรี': 'BKK', 'ปทุมธานี': 'BKK', 'สมุทรปราการ': 'BKK',

    // โซนภาคตะวันออก
    'ชลบุรี': 'EAST', 'ระยอง': 'EAST', 'จันทบุรี': 'EAST', 'ตราด': 'EAST', 'ฉะเชิงเทรา': 'EAST', 'ปราจีนบุรี': 'EAST', 'สระแก้ว': 'EAST',

    // โซนภาคตะวันตก
    'กาญจนบุรี': 'WEST', 'ราชบุรี': 'WEST', 'เพชรบุรี': 'WEST', 'ประจวบคีรีขันธ์': 'WEST', 'ตาก': 'WEST',

    // โซนภาคอิสาน (Northeastern)
    'อุบลราชธานี': 'NE', 'นครราชสีมา': 'NE', 'ขอนแก่น': 'NE', 'อุดรธานี': 'NE', 'ร้อยเอ็ด': 'NE', 'บุรีรัมย์': 'NE',
    'สุรินทร์': 'NE', 'ศรีสะเกษ': 'NE', 'มหาสารคาม': 'NE', 'สกลนคร': 'NE', 'นครพนม': 'NE', 'มุกดาหาร': 'NE',
    'ยโสธร': 'NE', 'อำนาจเจริญ': 'NE', 'หนองคาย': 'NE', 'หนองบัวลำภู': 'NE', 'เลย': 'NE', 'กาฬสินธุ์': 'NE', 'บึงกาฬ': 'NE', 'ชัยภูมิ': 'NE',

    // โซนภาคเหนือ (North)
    'เชียงใหม่': 'NORTH', 'เชียงราย': 'NORTH', 'ลำปาง': 'NORTH', 'ลำพูน': 'NORTH', 'แม่ฮ่องสอน': 'NORTH',
    'พะเยา': 'NORTH', 'แพร่': 'NORTH', 'น่าน': 'NORTH', 'อุตรดิตถ์': 'NORTH',

    // โซนภาคกลาง (Central)
    'นครสวรรค์': 'CENTRAL', 'พิษณุโลก': 'CENTRAL', 'สุโขทัย': 'CENTRAL', 'พิจิตร': 'CENTRAL', 'กำแพงเพชร': 'CENTRAL', 'เพชรบูรณ์': 'CENTRAL',
    'พระนครศรีอยุธยา': 'CENTRAL', 'สระบุรี': 'CENTRAL', 'ลพบุรี': 'CENTRAL', 'สิงห์บุรี': 'CENTRAL', 'ชัยนาท': 'CENTRAL', 'อุทัยธานี': 'CENTRAL',
    'อ่างทอง': 'CENTRAL', 'นครนายก': 'CENTRAL', 'สุพรรณบุรี': 'CENTRAL', 'นครปฐม': 'CENTRAL', 'สมุทรสาคร': 'CENTRAL', 'สมุทรสงคราม': 'CENTRAL',

    // โซนภาคใต้ (South)
    'ภูเก็ต': 'SOUTH_ISLAND', // Special Island zone for Phuket
    'สุราษฎร์ธานี': 'SOUTH', // Exclude islands handled later
    'นครศรีธรรมราช': 'SOUTH', 'ตรัง': 'SOUTH', 'พัทลุง': 'SOUTH', 'สงขลา': 'SOUTH', 'ชุมพร': 'SOUTH',
    'พังงา': 'SOUTH', 'กระบี่': 'SOUTH', 'ระนอง': 'SOUTH', 'ปัตตานี': 'SOUTH', 'ยะลา': 'SOUTH', 'นราธิวาส': 'SOUTH', 'สตูล': 'SOUTH'
}

// Special Remote Areas / Islands overrides using keywords if province is not enough
const ISLAND_KEYWORDS = ['พะงัน', 'สมุย', 'เต่า', 'พีพี', 'ช้าง', 'กูด', 'หมาก', 'ล้าน'];

// Calculate Price per Kg per Zone based on the provided reference Data.
// Ref Data: Product 43Kg (Vol weight: (165*68*12)/5000 = 26.9Kg) -> Chargeable = 43Kg
// Chonburi: 330 / 43 = 7.67 THB/Kg
// Kanchanaburi: 330 / 43 = 7.67 THB/Kg
// Nakhon Sawan: 375 / 43 = 8.72 THB/Kg
// Ubon / Korat: 357 / 43 = 8.3 THB/Kg
// Prachuap: 412 / 43 = 9.58 THB/Kg
// Phuket: 412 / 43 =  9.58 THB/Kg
// Phangan: 490 / 43 = 11.4 THB/Kg
const ZONE_RATES = {
    'BKK': 7.00,        // กรุงเทพ-ปริมณฑล (Base rate assumed slightly lower than Chonburi)
    'EAST': 7.67,       // ตะวันออก (Chonburi ref: 330/43)
    'WEST': 7.67,       // ตะวันตก (Kanchanaburi ref: 330/43) 
    'CENTRAL': 8.72,    // กลาง (Nakhon Sawan ref: 375/43)
    'NE': 8.30,         // อีสาน (Ubon/Korat ref: 357/43)
    'SOUTH': 9.58,      // ใต้ (Prachuap ref: 412/43)
    'NORTH': 9.00,      // เหนือ (Assumed between Central and South)
    'SOUTH_ISLAND': 9.58, // ภูเก็ต (Phuket ref: 412/43)
    'ISLAND_REMOTE': 11.40 // เกาะพะงัน ฯลฯ (Phangan ref: 490/43)
}

// -------------------------------------------------------------
// Calculation Helper
// -------------------------------------------------------------
const calculateShippingCost = (items, province, district = '', config = null) => {
    // 1. Determine Zone
    let zone = 'BKK'; // Default
    if (province) {
        // Clean Province String
        const cleanProv = province.trim().replace('จ.', '').replace('จังหวัด', '');
        zone = PROVINCE_ZONES[cleanProv] || 'CENTRAL'; // Fallback to central if unknown

        // Check for islands based on district/subdistrict context
        const isIsland = ISLAND_KEYWORDS.some(kw => district.includes(kw) || cleanProv.includes(kw));
        if (isIsland) {
            zone = 'ISLAND_REMOTE';
        }
    }

    // Default configuration fallback
    const effectiveConfig = {
        volumetricDivisor: config?.volumetricDivisor || 5000,
        defaultWeightPerItem: config?.defaultWeightPerItem || 5,
        zoneRates: config?.zoneRates || ZONE_RATES
    };

    const ratePerKg = effectiveConfig.zoneRates[zone] || ZONE_RATES[zone] || 7.00;

    // 2. Calculate Total Chargeable Weight
    let totalChargeableWeight = 0;

    items.forEach(item => {
        const qty = parseInt(item.quantity) || 1;

        const bkkVicinities = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม'];
        const isBkkVicinity = province && bkkVicinities.some(bkk => province.includes(bkk));

        // Free Shipping bypass
        if (item.badge_free_shipping) {
            return; // 0 chargeable weight for this item
        }
        
        if (item.free_shipping_bkk && isBkkVicinity) {
            return; // 0 chargeable weight for this item (Free shipping for BKK & Vicinities)
        }

        // Ensure defaults if not set in DB
        const w = parseFloat(item.weight_kg) || 0;
        const width = parseFloat(item.width_cm) || 0;
        const length = parseFloat(item.length_cm) || 0;
        const height = parseFloat(item.height_cm) || 0;

        // Formula: Volumetric = (W x L x H) / divisor
        const volumetricWeight = (width * length * height) / effectiveConfig.volumetricDivisor;

        // Standard rule: Chargeable weight is the greater of Actual vs Volumetric
        let chargeable = Math.max(w, volumetricWeight);

        // If entirely 0 (DB missing data), assign a fallback dummy weight per item
        if (chargeable === 0) chargeable = effectiveConfig.defaultWeightPerItem;

        totalChargeableWeight += (chargeable * qty);
    });

    // 3. Final Cost Calculation
    // Base fee is omitted in this model, purely rate * weight.
    const rawCost = totalChargeableWeight * ratePerKg;

    return {
        zone,
        totalChargeableWeight: parseFloat(totalChargeableWeight.toFixed(2)),
        ratePerKg: ratePerKg,
        cost: Math.ceil(rawCost) // Round up to nearest integer THB
    };
};


// -------------------------------------------------------------
// Endpoint: POST /api/shipping/calculate
// -------------------------------------------------------------
router.post('/calculate', async (req, res) => {
    try {
        const { items, address } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, error: 'ไม่พบรายการสินค้า' });
        }
        if (!address || !address.province) {
            return res.json({ success: true, data: { cost: 0, zone: 'UNKNOWN', message: 'กรุณาเลือกจังหวัด' } });
        }

        // Fetch restricted regions
        const [restrictionsRow] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'shipping_restricted_provinces'");
        let restrictedProvinces = [];
        if (restrictionsRow.length > 0 && restrictionsRow[0].setting_value) {
            try {
                restrictedProvinces = JSON.parse(restrictionsRow[0].setting_value);
                if (!Array.isArray(restrictedProvinces)) restrictedProvinces = [];
            } catch (e) {
                console.error('Failed to parse restricted provinces:', e);
            }
        }

        const targetProvince = address.province.trim().replace('จ.', '').replace('จังหวัด', '');
        const isRestricted = restrictedProvinces.some(p => targetProvince.includes(p.trim()) || p.trim().includes(targetProvince));

        if (isRestricted) {
            return res.json({
                success: true,
                data: {
                    cost: 0,
                    zone: 'RESTRICTED',
                    is_restricted: true,
                    message: `ไม่มีบริการจัดส่งในพื้นที่ ${address.province}`
                }
            });
        }

        // Fetch physical dimensions for items from DB robustly
        const productIds = items.map(i => i.product_id || i.id);
        const [dbProducts] = await db.query(
            'SELECT id, weight_kg, width_cm, length_cm, height_cm, badge_free_shipping, free_shipping_bkk FROM products WHERE id IN (?)',
            [productIds]
        );

        // Fetch custom shipping formula config
        const [configRows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'shipping_formula_config'");
        let shippingConfig = null;
        if (configRows.length > 0 && configRows[0].setting_value) {
            try {
                shippingConfig = JSON.parse(configRows[0].setting_value);
            } catch (e) {
                console.error('Failed to parse shipping_formula_config:', e);
            }
        }

        // Merge DB data with requested quantities
        const enrichedItems = items.map(item => {
            const dbRef = dbProducts.find(p => p.id === (item.product_id || item.id));
            return {
                ...item,
                weight_kg: dbRef?.weight_kg || 0,
                width_cm: dbRef?.width_cm || 0,
                length_cm: dbRef?.length_cm || 0,
                height_cm: dbRef?.height_cm || 0,
                badge_free_shipping: dbRef?.badge_free_shipping || 0,
                free_shipping_bkk: dbRef?.free_shipping_bkk || 0,
            };
        });

        const result = calculateShippingCost(enrichedItems, address.province, address.district || address.subdistrict, shippingConfig);

        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Shipping calculation error:', err);
        res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการคำนวณค่าจัดส่ง' });
    }
});

// Export the internal function for use in the orders route securely
module.exports = {
    router,
    calculateShippingCost
};
