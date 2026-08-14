const express = require('express');
const router = express.Router();
const db = require('../config/database');
const gemini = require('../services/geminiService');
const { verifyAdmin } = require('./auth');

// Get all templates for a specific category
router.get('/:categoryName', async (req, res) => {
    try {
        const { categoryName } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM category_attribute_templates WHERE category_name = ? ORDER BY sort_order ASC, id ASC',
            [categoryName]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching category attributes:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch category attributes' });
    }
});

// AI Auto-Generate Attribute Templates for Category
router.post('/ai-generate-template', verifyAdmin, async (req, res) => {
    try {
        const { category_name, custom_text } = req.body;
        if (!category_name) {
            return res.status(400).json({ success: false, error: 'Category name is required' });
        }

        // Fetch category info and sample products
        const [catRows] = await db.query('SELECT * FROM categories WHERE name = ?', [category_name]);
        const cat = catRows[0] || {};

        const [products] = await db.query(
            'SELECT name, description, attributes, sku FROM products WHERE category = ? OR JSON_CONTAINS(categories, ?) LIMIT 5',
            [category_name, JSON.stringify(category_name)]
        );

        let productContext = '';
        if (products.length > 0) {
            productContext = `\nSample Products in this Category:\n` + products.map(p => `- ${p.name} (SKU: ${p.sku || 'N/A'}) | Existing Specs: ${p.attributes || ''}`).join('\n');
        }

        let customInfoSection = '';
        if (custom_text && custom_text.trim()) {
            customInfoSection = `\nUser Provided Product Catalog / Brochure / Raw Specifications (PRIMARY SOURCE TO EXTRACT SPECS FROM):\n"""\n${custom_text.trim()}\n"""\n`;
        }

        const prompt = `You are an elite Industrial Equipment Specification Engineer and E-Commerce Data Architect in Thailand.
Your task is to generate a comprehensive, highly accurate, and standardized set of Product Specification Attribute Templates for the category "${category_name}".

Category Details:
- Name: ${category_name}
- Description: ${cat.description || ''}
${productContext}
${customInfoSection}

Requirements:
1. Generate between 6 to 16 essential, realistic, and highly practical technical specification templates for this category.
2. If User Provided Product Catalog / Raw Specifications is given above, you MUST prioritize extracting all technical specification headers and parameters directly from it.
3. DO NOT make up fake, generic, or non-technical specifications. They must reflect true industrial parameters (e.g. wire size, cutting length, strip length, crimping force, blade material, speed, dimensions, weight, power supply, air pressure).
4. Each item MUST have:
   - "attribute_key": English snake_case string (e.g. "model", "wire_size_range", "cutting_length", "power_supply", "machine_dimensions", "machine_weight").
   - "attribute_label": Professional Thai label with units in parentheses where applicable (e.g. "รุ่นสินค้า", "ขนาดสายไฟที่รองรับ (sq mm / AWG)", "ความยาวในการตัด (มม.)", "แหล่งจ่ายไฟ (Power Supply)", "ขนาดตัวเครื่อง (กว้าง x ลึก x สูง มม.)", "น้ำหนักตัวเครื่อง (กก.)").
   - "attribute_type": "text", "number", or "select".
   - "is_required": true/false (true for core specs like model or capacity).

Strict Output Format:
Return a valid JSON array of objects with keys: "attribute_key", "attribute_label", "attribute_type", "is_required".
No markdown wrappers.`;

        const response = await gemini.generateContent({
            prompt,
            responseMimeType: 'application/json',
            label: 'AI Category Attribute Generator'
        });

        let generatedList;
        try {
            const cleaned = response.text.replace(/```json\s*|```\s*/gi, '').trim();
            generatedList = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('Failed to parse AI attributes template:', response.text);
            return res.status(500).json({ success: false, error: 'AI ส่งข้อมูลกลับมาในรูปแบบที่ไม่ถูกต้อง' });
        }

        if (!Array.isArray(generatedList) || generatedList.length === 0) {
            return res.status(500).json({ success: false, error: 'AI ไม่สามารถสร้างรายการคุณสมบัติได้' });
        }

        // Save generated templates into database
        await db.query('DELETE FROM category_attribute_templates WHERE category_name = ?', [category_name]);

        for (let i = 0; i < generatedList.length; i++) {
            const item = generatedList[i];
            const key = item.attribute_key ? String(item.attribute_key).trim().toLowerCase().replace(/\s+/g, '_') : `attr_${i + 1}`;
            const label = item.attribute_label ? String(item.attribute_label).trim() : key;
            const type = ['text', 'number', 'select'].includes(item.attribute_type) ? item.attribute_type : 'text';
            const isReq = item.is_required === true || item.is_required === 1;

            await db.query(
                `INSERT INTO category_attribute_templates 
                 (category_name, attribute_key, attribute_label, sort_order, is_required, attribute_type) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [category_name, key, label, i, isReq, type]
            );
        }

        const [savedRows] = await db.query(
            'SELECT * FROM category_attribute_templates WHERE category_name = ? ORDER BY sort_order ASC',
            [category_name]
        );

        res.status(200).json({ success: true, data: savedRows });
    } catch (error) {
        console.error('AI Category Attribute Generator Error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to generate category attribute templates' });
    }
});

// Reorder templates
router.put('/reorder', verifyAdmin, async (req, res) => {
    try {
        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ success: false, error: 'Invalid data format' });
        }

        // Update each template's sort_order
        for (let i = 0; i < orderedIds.length; i++) {
            await db.query('UPDATE category_attribute_templates SET sort_order = ? WHERE id = ?', [i, orderedIds[i]]);
        }
        res.status(200).json({ success: true, message: 'Attributes reordered' });
    } catch (error) {
        console.error('Error reordering category attributes:', error);
        res.status(500).json({ success: false, error: 'Failed to reorder category attributes' });
    }
});

// Create new template
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { category_name, attribute_key, attribute_label, is_required, attribute_type, options } = req.body;
        
        if (!category_name || !attribute_key || !attribute_label) {
            return res.status(400).json({ success: false, error: 'Category name, attribute key, and attribute label are required' });
        }

        // Auto-assign sort_order
        const [maxSort] = await db.query('SELECT IFNULL(MAX(sort_order), -1) + 1 as next_sort FROM category_attribute_templates WHERE category_name = ?', [category_name]);
        const nextSortOrder = maxSort[0].next_sort;

        const [result] = await db.query(
            `INSERT INTO category_attribute_templates 
             (category_name, attribute_key, attribute_label, sort_order, is_required, attribute_type, options) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [category_name, attribute_key, attribute_label, nextSortOrder, is_required || false, attribute_type || 'text', options ? JSON.stringify(options) : null]
        );
        
        res.status(201).json({ 
            success: true, 
            data: { id: result.insertId, category_name, attribute_key, attribute_label, sort_order: nextSortOrder, is_required, attribute_type, options } 
        });
    } catch (error) {
        console.error('Error creating category attribute:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'This attribute key already exists for this category' });
        }
        res.status(500).json({ success: false, error: 'Failed to create category attribute' });
    }
});

// Update template
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prevent catching /reorder
        if (id === 'reorder') return;

        const { attribute_key, attribute_label, is_required, attribute_type, options } = req.body;

        if (!attribute_key || !attribute_label) {
            return res.status(400).json({ success: false, error: 'Attribute key and label are required' });
        }

        await db.query(
            `UPDATE category_attribute_templates 
             SET attribute_key = ?, attribute_label = ?, is_required = ?, attribute_type = ?, options = ? 
             WHERE id = ?`,
            [attribute_key, attribute_label, is_required || false, attribute_type || 'text', options ? JSON.stringify(options) : null, id]
        );
        
        res.status(200).json({ success: true, message: 'Attribute updated successfully' });
    } catch (error) {
        console.error('Error updating category attribute:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'This attribute key already exists for this category' });
        }
        res.status(500).json({ success: false, error: 'Failed to update category attribute' });
    }
});

// Delete template
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM category_attribute_templates WHERE id = ?', [id]);
        res.status(200).json({ success: true, message: 'Attribute deleted successfully' });
    } catch (error) {
        console.error('Error deleting category attribute:', error);
        res.status(500).json({ success: false, error: 'Failed to delete category attribute' });
    }
});
// Migrate existing product attributes using AI
router.post('/migrate-category', verifyAdmin, async (req, res) => {
    try {
        const { category_name } = req.body;
        if (!category_name) return res.status(400).json({ success: false, error: 'Category name is required' });

        // 1. Get template for category
        const [templates] = await db.query('SELECT * FROM category_attribute_templates WHERE category_name = ?', [category_name]);
        if (templates.length === 0) {
            return res.status(400).json({ success: false, error: 'No templates found for this category to migrate against.' });
        }
        
        // AI key is managed by geminiService — no manual key fetching needed
        // 3. Get all products in category
        const [products] = await db.query('SELECT id, name, attributes FROM products WHERE category = ? OR JSON_CONTAINS(categories, ?)', [category_name, JSON.stringify(category_name)]);
        
        const results = [];
        const templateKeysList = templates.map(t => `- "${t.attribute_key}" (Label: "${t.attribute_label}")`).join('\n');
        
        for (const p of products) {
            let currentAttrs = [];
            if (typeof p.attributes === 'string') {
                try { currentAttrs = JSON.parse(p.attributes) || []; } catch { currentAttrs = []; }
            } else if (Array.isArray(p.attributes)) {
                currentAttrs = p.attributes;
            }
            // filter out empty
            currentAttrs = currentAttrs.filter(a => a.key && a.value);
            
            if (currentAttrs.length === 0) {
                results.push({ id: p.id, name: p.name, status: 'skipped', reason: 'No attributes' });
                continue;
            }
            
            const prompt = `
You are a data migration assistant. We are normalizing product attributes to a standard template.
Category: ${category_name}
Standard Template Keys:
${templateKeysList}

Current Attributes for Product "${p.name}":
${JSON.stringify(currentAttrs, null, 2)}

Your task: Map the current attributes to the Standard Template Keys where they match in meaning.
For example, if the current key is "model" and the standard template key is "product_model", you MUST map the value to the key "product_model".
Keep any current attributes that DO NOT match any standard key, but TRANSLATE these custom keys to Thai if they are in English.
IMPORTANT RULES:
1. For predefined standard template keys, you MUST use the exact string provided (e.g. "external_dimensions", "material"), even if it is in English. Do NOT translate standard template keys to Thai.
2. Only translate keys to Thai if they are custom attributes that do NOT match any standard template key.

Return STRICTLY a JSON array of objects with "key" and "value". No markdown or extra text.
`;
            
            try {
                const response = await gemini.generateContent({
            prompt,
            label: 'AI Request'
        });
                
                const cleanedText = response.text.replace(/```json\n?|```\n?/g, '').trim();
                const newAttrs = JSON.parse(cleanedText);
                
                await db.query('UPDATE products SET attributes = ? WHERE id = ?', [JSON.stringify(newAttrs), p.id]);
                results.push({ id: p.id, name: p.name, status: 'success' });
            } catch (err) {
                results.push({ id: p.id, name: p.name, status: 'failed', error: err.message });
            }
        }
        
        res.status(200).json({ success: true, results });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ success: false, error: 'Migration failed: ' + error.message });
    }
});

// Migrate ALL products: translate English attribute keys to Thai
router.post('/migrate-english-keys', verifyAdmin, async (req, res) => {
    try {
        // Get all products that have attributes
        const [products] = await db.query('SELECT id, name, category, attributes FROM products WHERE attributes IS NOT NULL AND attributes != "" AND attributes != "[]"');
        
        const results = [];
        let migratedCount = 0;
        let skippedCount = 0;
        
        for (const p of products) {
            let currentAttrs = [];
            if (typeof p.attributes === 'string') {
                try { currentAttrs = JSON.parse(p.attributes) || []; } catch { currentAttrs = []; }
            } else if (Array.isArray(p.attributes)) {
                currentAttrs = p.attributes;
            }
            currentAttrs = currentAttrs.filter(a => a.key && a.value);
            
            if (currentAttrs.length === 0) {
                skippedCount++;
                continue;
            }
            
            // Check if any key contains English characters (a-zA-Z)
            const hasEnglishKeys = currentAttrs.some(a => /[a-zA-Z]/.test(a.key));
            if (!hasEnglishKeys) {
                skippedCount++;
                continue;
            }

            // Fetch template for this product's category
            let templateInstruction = '';
            if (p.category) {
                const [templates] = await db.query('SELECT attribute_key, attribute_label FROM category_attribute_templates WHERE category_name = ? ORDER BY sort_order ASC', [p.category]);
                if (templates.length > 0) {
                    const keysList = templates.map(t => `- "${t.attribute_key}" (${t.attribute_label})`).join('\n');
                    templateInstruction = `\nCategory "${p.category}" has these standard template keys:\n${keysList}\nIf any current attribute matches a template key in meaning, map it to the EXACT template key.\n`;
                }
            }
            
            const prompt = `
You are a data migration assistant. We are normalizing attribute keys.
${templateInstruction}
Product: "${p.name}"
Current Attributes:
${JSON.stringify(currentAttrs, null, 2)}

Rules:
1. If a current attribute matches a standard template key in meaning, you MUST use the EXACT template key string (e.g. "external_dimensions", "material"), even if it is in English.
2. For custom attributes that do NOT match any template key, translate their keys from English to natural Thai. Examples: "model" → "รุ่นสินค้า", "accessories" → "อุปกรณ์เสริม".
3. Keep values unchanged — do NOT modify any values.
4. Custom keys already in Thai should remain unchanged.

Return STRICTLY a JSON array of objects with "key" and "value". No markdown or extra text.
`;
            
            try {
                const response = await gemini.generateContent({
                    prompt,
                    label: 'Migrate English Keys'
                });
                
                const cleanedText = response.text.replace(/```json\n?|```\n?/g, '').trim();
                const newAttrs = JSON.parse(cleanedText);
                
                await db.query('UPDATE products SET attributes = ? WHERE id = ?', [JSON.stringify(newAttrs), p.id]);
                results.push({ id: p.id, name: p.name, status: 'success', keysTranslated: currentAttrs.filter(a => /[a-zA-Z]/.test(a.key)).map(a => a.key) });
                migratedCount++;
            } catch (err) {
                results.push({ id: p.id, name: p.name, status: 'failed', error: err.message });
            }
        }
        
        res.status(200).json({ 
            success: true, 
            summary: { total: products.length, migrated: migratedCount, skipped: skippedCount, failed: results.filter(r => r.status === 'failed').length },
            results 
        });
    } catch (error) {
        console.error('English key migration error:', error);
        res.status(500).json({ success: false, error: 'Migration failed: ' + error.message });
    }
});

module.exports = router;
