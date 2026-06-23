import { reactive } from 'vue'

export function useCalculator() {
  
  // Default Pricing Rates (Fallback values)
  const RATES = {
    installationPerSqm: 500, // THB per square meter
    distancePerKm: 15,       // THB per kilometer
    slabPrice: 60,           // THB per slab (40x40cm)
    slabSizeM: 0.4,          // 40cm
    concretePerSqm: 800      // THB per square meter for concrete pouring
  };

  /**
   * Extract Width, Length, Height in meters from product data.
   * Uses multiple strategies to maximize parsing success:
   * 1. Keyword-based extraction from size string (กว้าง/ลึก/สูง)
   * 2. Dimension pattern from size string (WxLxH)
   * 3. Dimension pattern from product name
   * 4. Fallback: just find 3 numbers
   */
  const parseProductDimensions = (sizeStr, productName = '') => {
    // Try all strategies in order
    let result = null;
    
    // Strategy 1: Parse from size field with Thai keywords
    if (sizeStr) {
      result = parseWithKeywords(sizeStr);
      if (result) return result;
      
      result = parseDimensionPattern(sizeStr);
      if (result) return result;
    }
    
    // Strategy 2: Parse from product name (often has dimensions)
    if (productName) {
      result = parseDimensionPattern(productName);
      if (result) return result;
      
      result = parseFromNameSimple(productName);
      if (result) return result;
    }
    
    // Strategy 3: Last resort - extract numbers from size string
    if (sizeStr) {
      result = parseRawNumbers(sizeStr);
      if (result) return result;
    }
    
    return null;
  };

  /**
   * Parse dimensions using Thai keywords: กว้าง, ลึก/ยาว, สูง
   */
  const parseWithKeywords = (str) => {
    if (!str) return null;
    
    const kwPatterns = [
      // กว้าง X ซม./ม.
      { key: 'w', regex: /กว้าง\s*([\d.]+)\s*(ซม\.|เซนติเมตร|cm|ม\.|เมตร|m)?/i },
      // ลึก/ยาว X ซม./ม.
      { key: 'l', regex: /(?:ลึก|ยาว)\s*([\d.]+)\s*(ซม\.|เซนติเมตร|cm|ม\.|เมตร|m)?/i },
      // สูง X ซม./ม.
      { key: 'h', regex: /สูง\s*([\d.]+)\s*(ซม\.|เซนติเมตร|cm|ม\.|เมตร|m)?/i },
    ];
    
    const dims = {};
    let found = 0;
    
    for (const kw of kwPatterns) {
      const m = str.match(kw.regex);
      if (m) {
        let val = parseFloat(m[1]);
        const unit = (m[2] || '').toLowerCase();
        
        // Convert to meters
        if (unit.includes('ซม') || unit.includes('cm') || unit.includes('เซนติ')) {
          val = val / 100;
        } else if (!unit || unit.includes('ม') || unit.includes('m') || unit.includes('เมตร')) {
          // If no unit and value > 10, likely cm
          if (!unit && val > 10) val = val / 100;
        }
        
        dims[kw.key] = val;
        found++;
      }
    }
    
    if (found >= 2) {
      return {
        w: dims.w || dims.l || 1,
        l: dims.l || dims.w || 1,
        h: dims.h || 2.5
      };
    }
    
    return null;
  };

  /**
   * Parse dimension patterns like "3x3", "2.44 x 5.10 x 2.27", "122x182x204"
   * Also handles patterns in parentheses like "(ขนาด 3x3 เมตร)"
   */
  const parseDimensionPattern = (str) => {
    if (!str) return null;
    
    // Pattern: W x L x H with optional units
    // Matches: 2.44 x 5.10 x 2.27, 122x182x204, 3.0 x 4.0, 3x3
    const patterns = [
      // 3-dimension pattern: W x L x H
      /(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)\s*(ซม\.|เซนติเมตร|cm|ม\.|เมตร|m)?/i,
      // 2-dimension pattern: W x L (common for greenhouses etc)
      /(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)\s*(ซม\.|เซนติเมตร|cm|ม\.|เมตร|m)?/i,
    ];
    
    for (const pattern of patterns) {
      const m = str.match(pattern);
      if (m) {
        let w = parseFloat(m[1]);
        let l = parseFloat(m[2]);
        let h = m[3] && !isNaN(parseFloat(m[3])) ? parseFloat(m[3]) : null;
        const unitStr = h !== null ? (m[4] || '') : (m[3] || '');
        const unit = unitStr.toLowerCase();
        
        // Determine if values are in cm or m
        const isCm = unit.includes('ซม') || unit.includes('cm') || unit.includes('เซนติ');
        const isM = unit.includes('ม') || unit.includes('m') || unit.includes('เมตร');
        
        if (isCm || (!isM && w > 10)) {
          w = w / 100;
          l = l / 100;
          if (h !== null) h = h / 100;
        }
        
        // Sanity check: dimensions should be between 0.1m and 30m
        if (w > 0.1 && w < 30 && l > 0.1 && l < 30) {
          return {
            w,
            l,
            h: (h !== null && h > 0.1 && h < 10) ? h : 2.5
          };
        }
      }
    }
    
    return null;
  };

  /**
   * Parse simple patterns from product name like "ขนาด X.XX เมตร" or "(ขนาด WxLxH เมตร)"
   */
  const parseFromNameSimple = (name) => {
    if (!name) return null;
    
    // Look for ขนาด followed by dimensions
    const sizeMatch = name.match(/ขนาด\s*(\d+(?:\.\d+)?)\s*[x×X]\s*(\d+(?:\.\d+)?)\s*(?:[x×X]\s*(\d+(?:\.\d+)?))?\s*(ซม\.|เซนติเมตร|cm|ม\.|เมตร|m)?/i);
    if (sizeMatch) {
      let w = parseFloat(sizeMatch[1]);
      let l = parseFloat(sizeMatch[2]);
      let h = sizeMatch[3] ? parseFloat(sizeMatch[3]) : null;
      const unit = (sizeMatch[4] || '').toLowerCase();
      
      const isCm = unit.includes('ซม') || unit.includes('cm') || unit.includes('เซนติ');
      if (isCm || (!unit.includes('ม') && !unit.includes('m') && w > 10)) {
        w = w / 100;
        l = l / 100;
        if (h !== null) h = h / 100;
      }
      
      if (w > 0.1 && w < 30 && l > 0.1 && l < 30) {
        return { w, l, h: (h && h > 0.1 && h < 10) ? h : 2.5 };
      }
    }
    
    return null;
  };

  /**
   * Last resort: extract first 3 numbers and use heuristic
   */
  const parseRawNumbers = (str) => {
    if (!str) return null;
    
    const matches = str.match(/(\d+(?:\.\d+)?)/g);
    if (matches && matches.length >= 3) {
      let w = parseFloat(matches[0]);
      let l = parseFloat(matches[1]);
      let h = parseFloat(matches[2]);
      
      // Check if string contains cm indicator
      const isCm = /ซม\.|cm|เซนติ/i.test(str);
      
      if (isCm || (w > 10 && l > 10)) {
        w = w / 100;
        l = l / 100;
        h = h / 100;
      }
      
      if (w > 0.05 && w < 30 && l > 0.05 && l < 30 && h > 0.05 && h < 10) {
        return { w, l, h };
      }
    }
    
    return null;
  };

  /**
   * Evaluate if a product fits in user space with multi-tier results
   * Returns: { level: 'perfect'|'tight'|'close'|'no_fit', reason, extraNeeded }
   */
  const checkFit = (productDims, userSpace) => {
    if (!productDims) return { level: 'no_fit', fits: false, reason: 'ไม่พบข้อมูลขนาดสินค้า' };
    if (!userSpace) return { level: 'no_fit', fits: false, reason: 'ไม่มีข้อมูลพื้นที่ผู้ใช้' };

    const SLACK_PERFECT = 0.5; // 50cm ideal slack
    const SLACK_TIGHT = 0.2;   // 20cm minimum workable slack
    const HEIGHT_SLACK = 0.1;  // 10cm height slack

    const pw = productDims.w;
    const pl = productDims.l;
    const ph = productDims.h;
    
    const uw = userSpace.w;
    const ul = userSpace.l;
    const uh = userSpace.h;

    // Height check - Only fail if product is STRICTLY taller than user ceiling
    // Handle cases where uh might be null/undefined (e.g., user didn't enter height)
    if (uh && ph > uh) {
      const extraH = ph - uh;
      return { 
        level: 'no_fit', 
        fits: false, 
        reason: `ความสูงเกิน (ต้องการ ${ph.toFixed(2)} ม. แต่มี ${uh.toFixed(2)} ม.)`,
        extraNeeded: { h: extraH }
      };
    }

    // Area Mode Calculation
    if (userSpace.inputType === 'area') {
      const productArea = pw * pl;
      const userArea = userSpace.area;
      
      if (!userArea) {
        return { level: 'no_fit', fits: false, reason: 'กรุณาระบุตารางเมตร' };
      }

      const ratio = productArea / userArea;
      
      if (ratio <= 0.85) return { level: 'perfect', fits: true, reason: 'พอดีสมบูรณ์แบบ เหลือพื้นที่เดินรอบได้สบาย' };
      if (ratio <= 1.0) return { level: 'tight', fits: true, reason: 'ตารางเมตรพอดี แต่ต้องระวังรูปทรงอาจไม่เข้ากัน' };
      
      return {
        level: 'no_fit',
        fits: false,
        reason: `พื้นที่ไม่พอ (ต้องการอย่างน้อย ${productArea.toFixed(2)} ตร.ม.)`,
        extraNeeded: { area: productArea - userArea }
      };
    }

    // Dimensions Mode Calculation
    // Check both orientations
    const checkOrientation = (prodW, prodL) => {
      const perfectW = prodW + SLACK_PERFECT;
      const perfectL = prodL + SLACK_PERFECT;
      const tightW = prodW + SLACK_TIGHT;
      const tightL = prodL + SLACK_TIGHT;
      const bareW = prodW;
      const bareL = prodL;
      
      if (perfectW <= uw && perfectL <= ul) return 'perfect';
      if (tightW <= uw && tightL <= ul) return 'tight';
      if (bareW <= uw && bareL <= ul) return 'close';
      return 'no_fit';
    };
    
    const normalFit = checkOrientation(pw, pl);
    const rotatedFit = checkOrientation(pl, pw);
    
    // Pick best fit
    const fitLevels = { 'perfect': 3, 'tight': 2, 'close': 1, 'no_fit': 0 };
    const bestFit = fitLevels[normalFit] >= fitLevels[rotatedFit] ? normalFit : rotatedFit;
    
    const fitMessages = {
      'perfect': 'พอดีสมบูรณ์แบบ เหลือพื้นที่เดินรอบได้สบาย',
      'tight': 'ใส่ได้พอดี แต่พื้นที่ค่อนข้างตึง',
      'close': 'ใส่ได้แบบพอดิบพอดี ไม่เหลือระยะช่างติดตั้ง',
    };
    
    if (bestFit !== 'no_fit') {
      return { 
        level: bestFit, 
        fits: true, 
        reason: fitMessages[bestFit] 
      };
    }
    
    // Calculate how much extra space needed
    const neededW = Math.min(pw, pl) + SLACK_TIGHT;
    const neededL = Math.max(pw, pl) + SLACK_TIGHT;
    const extraW = Math.max(0, neededW - uw);
    const extraL = Math.max(0, neededL - ul);
    
    return { 
      level: 'no_fit', 
      fits: false, 
      reason: `พื้นที่ไม่พอ (ต้องการ ${neededW.toFixed(2)} x ${neededL.toFixed(2)} ม.)`,
      extraNeeded: { w: extraW, l: extraL }
    };
  };

  /**
   * Calculate foundation requirements and cost
   */
  const calculateFoundation = (productDims, floorType, product = null) => {
    if (!productDims) return { cost: 0, details: null };

    // Default: foundation is OFF. Only calculate if product explicitly requires it.
    // requires_foundation must be explicitly true/1/'1' to enable foundation cost.
    const needsFoundation = product && (product.requires_foundation === true || product.requires_foundation === 1 || product.requires_foundation === '1');
    if (!needsFoundation) {
      return {
        cost: 0,
        needsPrep: false,
        details: null
      };
    }

    const area = productDims.w * productDims.l;
    
    // If Floor is Concrete/Tiles -> Ready to install
    if (floorType === 'concrete' || floorType === 'tile') {
      return { 
        cost: 0, 
        needsPrep: false,
        details: 'พื้นแข็งอยู่แล้วพร้อมติดตั้ง' 
      };
    }

    // If Floor is Earth/Grass -> Need Paving slabs or Concrete pour
    // Estimate slabs (40x40cm = 0.16 sqm area per slab)
    if (floorType === 'earth' || floorType === 'grass') {
      // How many slabs physically needed? width / 0.4 * length / 0.4
      const slabsW = Math.ceil(productDims.w / RATES.slabSizeM);
      const slabsL = Math.ceil(productDims.l / RATES.slabSizeM);
      const totalSlabs = slabsW * slabsL;
      const slabCost = totalSlabs * RATES.slabPrice;
      const concreteCost = Math.ceil(area) * RATES.concretePerSqm;
      
      return {
        cost: slabCost,
        optConcreteCost: concreteCost,
        needsPrep: true,
        details: `ต้องใช้แผ่นพื้นสำเร็จรูป ${slabsW}x${slabsL} = ${totalSlabs} แผ่น`,
        slabs: totalSlabs
      };
    }

    return { cost: 0, details: null };
  };

  /**
   * Estimate installation & travel cost
   */
  const estimateInstallation = (productDims, distanceKm, product = null, provinceName = '', freeInstallProvinces = null) => {
    if (!productDims) return { installCost: 0, travelCost: 0, isFixedCost: false };
    
    let installCost = 0;
    let isFixedCost = false;
    let isFreeInstallBkk = false;
    
    // Use dynamic provinces from settings, fallback to default BKK vicinities
    const freeProvinces = (Array.isArray(freeInstallProvinces) && freeInstallProvinces.length > 0)
      ? freeInstallProvinces
      : ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 'นครปฐม'];
    
    // Default: installation fee is OFF (0). Only charge if product explicitly has it enabled.
    if (product && product.free_install_bkk && freeProvinces.includes(provinceName)) {
      installCost = 0;
      isFixedCost = true;
      isFreeInstallBkk = true;
    } else if (product && product.has_installation_fee && product.installation_fee !== null) {
      // Explicit fixed installation fee from product settings
      installCost = Number(product.installation_fee);
      isFixedCost = true;
    } else {
      // No installation fee configured -> default to 0
      installCost = 0;
    }
    // Travel cost is now calculated dynamically via API based on weight and zone
    let travelCost = 0;
    
    return { installCost, travelCost, isFixedCost, isFreeInstallBkk };
  };

  return {
    parseProductDimensions,
    checkFit,
    calculateFoundation,
    estimateInstallation,
    RATES
  };
}
