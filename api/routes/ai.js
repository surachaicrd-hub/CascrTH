const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { GoogleGenAI } = require('@google/genai');
const gemini = require('../services/geminiService');
const { verifyAdmin } = require('./auth');

// Safe JSON parser for AI responses - extracts and parses JSON even if wrapped in extra text or markdown
function safeJsonParse(text) {
    if (!text || typeof text !== 'string') return null;
    let cleaned = text.replace(/```json\s*|```\s*/gi, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Try extracting object
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);
            try {
                return JSON.parse(jsonSubstring);
            } catch (e2) {
                try {
                    const sanitized = jsonSubstring.replace(/[\u0000-\u001F]+/g, (m) => {
                        if (m.includes('\n')) return '\\n';
                        if (m.includes('\r')) return '';
                        if (m.includes('\t')) return '\\t';
                        return ' ';
                    });
                    return JSON.parse(sanitized);
                } catch (e3) {}
            }
        }
        // Try extracting array
        const firstBracket = cleaned.indexOf('[');
        const lastBracket = cleaned.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            const jsonSubstring = cleaned.substring(firstBracket, lastBracket + 1);
            try {
                return JSON.parse(jsonSubstring);
            } catch (e4) {
                try {
                    const sanitized = jsonSubstring.replace(/[\u0000-\u001F]+/g, (m) => {
                        if (m.includes('\n')) return '\\n';
                        if (m.includes('\r')) return '';
                        if (m.includes('\t')) return '\\t';
                        return ' ';
                    });
                    return JSON.parse(sanitized);
                } catch (e5) {}
            }
        }
        throw new Error('Failed to parse AI response as JSON: ' + text.substring(0, 200));
    }
}

router.post('/generate-seo', verifyAdmin, async (req, res) => {
    try {
        const { productName, category, description } = req.body;

        if (!productName) {
            return res.status(400).json({ success: false, error: 'Product name is required' });
        }

        let storeName = 'CR Distribution';
        let companyLegalName = 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        try {
            const [sRows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'contact_company_name', 'company_legal_name')");
            const sMap = {};
            sRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            storeName = sMap['store_name'] || sMap['contact_company_name'] || 'CR Distribution';
            companyLegalName = sMap['company_legal_name'] || sMap['contact_company_name'] || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        } catch (e) {}

        const prompt = `
You are an expert SEO (Search Engine Optimization) and GEO (Generative Engine Optimization) specialist for ${storeName} (operated by ${companyLegalName}), the leading e-commerce site for storage sheds, greenhouses, and outdoor storage solutions in Thailand.
Please generate localized Thai SEO and AI-search optimized content for the following product:
Product Name: ${productName}
Category: ${category}
Description: ${description}

Return the response strictly as a JSON object with the following keys and no markdown formatting or extra text:
- title: A catchy, search-optimized SEO title (max 60 characters)
- keywords: A comma-separated list of relevant SEO keywords in Thai and English (focus on high-intent terms like "บ้านเก็บของสำเร็จรูป", "ตู้เก็บของกลางแจ้ง", product categories, and specs)
- description: A compelling, optimized meta description (max 160 characters) that outlines the product's primary utility and specifications.
- llm_context: A deep, factual, and data-dense description written in THAI. This is designed for AI search engine scrapers (ChatGPT, Perplexity, Gemini) to read.
  GEO Optimization Rules for llm_context:
  1. Use an objective, authoritative, and non-marketing tone (avoid hype words like "ดีที่สุด", "ปฏิวัติวงการ").
  2. Focus on concrete data points: materials (e.g. โครงเหล็กกัลวาไนซ์กันสนิม, ผนังเมทัลชีท), durability factors (weather-proof, wind resistance), warranty, dimensions, and weight.
  3. Formulate the explanation as a clear entity relationship mapping: associate the product name with brand "${storeName}", operator "${companyLegalName}", and shipping/installation details in Thailand.
  4. Ensure it reads naturally for LLMs to extract direct answers for conversational and voice queries (e.g. "ขนาดเท่าไหร่?", "ติดตั้งอย่างไร?").
`;

        const response = await gemini.generateContent({
            prompt,
            label: 'AI Request'
        });

        // Strip out markdown block if Gemini wraps it
        const cleanedText = response.text.replace(/```json\n?|```\n?/g, '').trim();

        const result = safeJsonParse(cleanedText);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('AI SEO Generation error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to generate SEO content' });
    }
});

router.post('/generate-full-seo-geo', verifyAdmin, async (req, res) => {
    try {
        const { productName, category, description, size, sku, price } = req.body;

        if (!productName) {
            return res.status(400).json({ success: false, error: 'Product name is required' });
        }

        let storeName = 'CR Distribution';
        let companyLegalName = 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        try {
            const [sRows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'contact_company_name', 'company_legal_name')");
            const sMap = {};
            sRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            storeName = sMap['store_name'] || sMap['contact_company_name'] || 'CR Distribution';
            companyLegalName = sMap['company_legal_name'] || sMap['contact_company_name'] || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        } catch (e) {}

        const prompt = `
You are an elite 12-Layer SEO (Search Engine Optimization) and GEO (Generative Engine Optimization) AI Agent for ${storeName} (${companyLegalName}).
You optimize products for both traditional Google/Bing crawlers and AI Search Engines (ChatGPT, Perplexity, Claude, Gemini, Google AI Overviews).

Product Input:
- Name: ${productName}
- Category: ${category || 'สินค้าทั่วไป'}
- SKU: ${sku || 'N/A'}
- Size/Dimensions: ${size || 'N/A'}
- Price: ${price || 'N/A'}
- Description Context: ${description || ''}

Generate a comprehensive SEO & GEO Payload strictly as a valid JSON object (no markdown wrappers) containing:
1. "seo_title": SEO title (under 60 characters, captivating with key terms & brand).
2. "seo_description": Meta description (under 160 characters, with key specs & call-to-action).
3. "seo_keywords": High-intent keywords list in Thai & English separated by commas.
4. "llm_context": Data-rich factual narrative (in Thai) specifically formatted for LLMs (ChatGPT/Perplexity) explaining product entities, materials, resistance, warranty, supplier (${companyLegalName}), and usage scenarios.
5. "image_alt": Optimized image alt text describing the product appearance, material, and function.
6. "search_intent": A string summarizing primary intent (e.g. "Transactional / Commercial Investigation").
7. "information_gain_tips": Array of 2-3 specific optimization suggestions to outperform competitors on Google/AI.

Strict Output Format:
Return ONLY the JSON object without markdown code block wrappers.
`;

        const response = await gemini.generateContent({
            prompt,
            label: 'Full 12-Layer SEO GEO Request'
        });

        const cleanedText = response.text.replace(/```json\n?|```\n?/g, '').trim();
        const result = safeJsonParse(cleanedText);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('AI Full SEO GEO Generation error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to generate 12-Layer SEO/GEO payload' });
    }
});

router.post('/format-description', verifyAdmin, async (req, res) => {
    try {
        const { productName, category, categories, sku, size, description } = req.body;

        if (!description) {
            return res.status(400).json({ success: false, error: 'Description is required to format' });
        }

        let storeName = 'CAS-CR';
        let companyLegalName = 'บริษัท แคส-ซีอาร์ จำกัด';
        try {
            const [settingsRows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'company_legal_name', 'contact_company_name')");
            const sMap = {};
            settingsRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            storeName = sMap['store_name'] || sMap['contact_company_name'] || 'CAS-CR';
            companyLegalName = sMap['company_legal_name'] || storeName;
        } catch (e) {}

        const categoryName = category || (Array.isArray(categories) && categories.length > 0 ? categories.join(', ') : 'ทั่วไป');

        const prompt = `You are an elite Technical Copywriter and SEO Specialist in Thailand representing ${storeName} (${companyLegalName}).
Your task is to re-organize, format, and elevate the provided product description into a world-class, clean, beautiful, and SEO-optimized HTML article ready for CKEditor.

Product Info:
- Name: ${productName || 'สินค้า'}
- Category: ${categoryName}
- SKU / Model: ${sku || ''}
- Size / Dimensions: ${size || ''}

Raw / Current Content to Format:
${description}

Formatting & Quality Rules:
1. **Semantic HTML Only**: Return ONLY clean HTML structure using <h2>, <h3>, <p>, <strong>, <ul><li>, and <table> inside <figure class="table">.
   - Do NOT wrap in \`\`\`html or markdown ticks.
   - Do NOT include <html>, <head>, or <body> tags.
2. **Standard Document Layout**:
   - **Headline (<h2>)**: Catchy, professional title featuring product name & core industrial/commercial benefit.
   - **Overview Paragraphs (<p>)**: Engaging, factual overview of core capabilities, precision, and value proposition.
   - **Key Features / จุดเด่น (<h3> & <ul><li>)**: Bullet points highlighting key advantages with <strong> bold lead-ins.
   - **Performance & Functions (<h3> & <p>)**: Deep-dive into technical features, durability, materials, and mechanisms.
   - **Technical Specifications Table (<h3> & <table>)**: Organize all specs, numbers, tolerances, and dimensions into a clean HTML table (<figure class="table"><table><thead><tr><th>รายการ</th><th>รายละเอียด</th></tr></thead><tbody>...</tbody></table></figure>).
   - **Target Applications (<h3> & <p>)**: Best suited use-cases, industries, workshops, or user scenarios.
3. **Data Integrity**: PRESERVE all factual data, tolerances (e.g. ±(0.1 + 0.0005 × L) มม.), units, numbers, wire gauges (AWG), models, electrical parameters, and materials from the original text with 100% accuracy.
4. **Readability & Spacing**: Avoid giant walls of text. Wrap every paragraph in <p>...</p> tags with proper breathing room.`;

        const response = await gemini.generateContent({
            prompt,
            responseMimeType: 'text/plain',
            label: 'Format Description'
        });

        let htmlResponse = response.text;
        htmlResponse = htmlResponse.replace(/```html\n?|```\n?/g, '').trim();
        htmlResponse = htmlResponse.replace(/\\n/g, '<br/>');
        if (!htmlResponse.match(/<p>|<div>|<ul>|<li>|<h2>|<h3>|<table/i)) {
            htmlResponse = htmlResponse.replace(/\n/g, '<br/>');
        }

        res.status(200).json({ success: true, data: htmlResponse });
    } catch (error) {
        console.error('AI Formatting error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to format description' });
    }
});

router.post('/generate-description', verifyAdmin, async (req, res) => {
    try {
        const {
            productName,
            category,
            categories,
            sku,
            size,
            shortDescription,
            attributes,
            keywords,
            highlights,
            tone = 'luxury',
            length = 'standard',
            includeSEO = true,
            currentDescription = ''
        } = req.body;

        if (!productName) {
            return res.status(400).json({ success: false, error: 'Product name is required' });
        }

        let storeName = 'CAS-CR';
        let companyLegalName = 'บริษัท แคส-ซีอาร์ จำกัด';
        try {
            const [settingsRows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'company_legal_name', 'contact_company_name')");
            const sMap = {};
            settingsRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            storeName = sMap['store_name'] || sMap['contact_company_name'] || 'CAS-CR';
            companyLegalName = sMap['company_legal_name'] || storeName;
        } catch (e) {}

        const categoryName = category || (Array.isArray(categories) && categories.length > 0 ? categories.join(', ') : 'ทั่วไป');

        const toneGuide = tone === 'luxury'
            ? 'Professional, authoritative, premium, and trustworthy (ภาษาสุภาพ เป็นทางการ น่าเชื่อถือ)'
            : tone === 'friendly'
            ? 'Friendly, warm, and highly informative (เป็นมิตร อบอุ่น อ่านง่ายและให้ข้อมูลครบถ้วน)'
            : 'Sales-driven, persuasive, value-focused (เน้นชูความคุ้มค่า ปิดการขาย กระตุ้นการตัดสินใจ)';

        const lengthGuide = length === 'short'
            ? 'Concise (approx 300 words)'
            : length === 'comprehensive'
            ? 'In-depth and comprehensive (approx 900-1200 words)'
            : 'Standard balanced SEO length (approx 600-800 words)';

        const attrText = Array.isArray(attributes)
            ? attributes.filter(a => a && (a.key || a.label) && a.value).map(a => `- ${a.label || a.key}: ${a.value}`).join('\n')
            : '';

        const prompt = `You are a Master Technical Copywriter and E-commerce SEO Specialist in Thailand representing ${storeName} (${companyLegalName}).
Write a complete, highly persuasive, technically accurate, and SEO-optimized product presentation article in Thai for:

Product Details:
- Product Name: ${productName}
- Category: ${categoryName}
- SKU / Model: ${sku || 'N/A'}
- Dimensions / Size: ${size || 'N/A'}
- Target SEO Keywords: ${keywords || 'สินค้าคุณภาพ, สเปกมาตรฐาน'}
- Key Highlights & Notes:
${highlights || ''}
${shortDescription ? `Short Summary: ${shortDescription}` : ''}
${attrText ? `Specifications List:\n${attrText}` : ''}
${currentDescription ? `Existing Context:\n${currentDescription}` : ''}

Writing Requirements:
- Tone: ${toneGuide}
- Length: ${lengthGuide}
- Structure:
  1. <h2> Main Title: Compelling headline with Product Name and key benefit.
  2. <p> Introduction: Overview emphasizing industrial reliability, utility, and superior build quality.
  3. <h3> จุดเด่นและคุณสมบัติพิเศษ: Bullet points (<ul><li>) with <strong> bold key terms.
  4. <h3> ประสิทธิภาพและการใช้งาน: Detailed paragraphs explaining technical capabilities, operation, and advantages.
  5. <h3> ข้อมูลจำเพาะทางเทคนิค: Clean HTML table (<figure class="table"><table><thead><tr><th>รายการ</th><th>รายละเอียด</th></tr></thead><tbody>...</tbody></table></figure>) containing all specs, numbers, models, and dimensions.
  6. <h3> เหมาะสำหรับกลุ่มงานและอุตสาหกรรม: Application scenarios and closing statement.

Strict Output Format:
Return ONLY a valid JSON object with the following keys and NO markdown wrappers (\`\`\`json):
{
  "description": "Full HTML description string without markdown wrappers",
  "seo_title": "SEO Title under 60 characters with primary keyword and brand",
  "seo_description": "Meta description under 160 characters summarizing specs & call to action",
  "seo_keywords": "Comma-separated SEO keywords in Thai and English"
}`;

        const response = await gemini.generateContent({
            prompt,
            responseMimeType: 'application/json',
            label: 'Generate Description'
        });

        const result = safeJsonParse(response.text);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('AI Description Generation error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to generate product description' });
    }
});

router.post('/generate-attributes', verifyAdmin, async (req, res) => {
    try {
        const { productName, category, categories, shortDescription, description, sku, size, price, remarks } = req.body;

        if (!description && !shortDescription && !productName) {
            return res.status(400).json({ success: false, error: 'Product Name or Description is required' });
        }

        let categoryList = [];
        if (Array.isArray(categories) && categories.length > 0) {
            categoryList = categories.filter(Boolean);
        } else if (category) {
            categoryList = [category];
        }

        let templates = [];
        if (categoryList.length > 0) {
            const [rows] = await db.query(
                'SELECT * FROM category_attribute_templates WHERE category_name IN (?) ORDER BY sort_order ASC',
                [categoryList]
            );
            templates = rows || [];
        }

        let templateInstruction = '';
        if (templates.length > 0) {
            const keysList = templates.map(t => `- Key: "${t.attribute_key}" | ความหมายภาษาไทย: "${t.attribute_label}"`).join('\n');
            templateInstruction = `
CRITICAL CATEGORY TEMPLATE MATCHING RULES:
This product category has predefined attribute keys:
${keysList}

1. For information that matches any predefined template key above, you MUST use the exact "attribute_key" string as the "key" (e.g., "${templates[0]?.attribute_key || 'external_dimensions'}").
2. Extract accurate values for all matching template keys. If a template key has no data found in the text, you may omit it or leave value as "".
3. For all OTHER technical specifications, measurements, features, and electrical/mechanical parameters found in the product text that do NOT match any predefined template key:
   - Extract them as extra custom attributes.
   - For these extra custom attributes, the "key" MUST be a clear, professional Thai technical title (e.g. "รุ่นสินค้า", "ขนาดสายไฟที่รองรับ", "ความยาวในการตัด", "ระบบขับเคลื่อน", "วัสดุใบมีด", "แหล่งจ่ายไฟ", "กำลังไฟฟ้า").`;
        } else {
            templateInstruction = `
SPECIFICATION NAMING RULES:
1. Every attribute "key" MUST be in formal, standard Thai technical language (e.g., "รุ่นสินค้า", "ขนาดสายไฟที่รองรับ", "เส้นผ่านศูนย์กลางสายไฟสูงสุด", "ความยาวในการตัด", "ความยาวปอกสายไฟด้านหน้า", "ความยาวปอกสายไฟด้านหลัง", "ค่าความคลาดเคลื่อนในการตัด", "ระบบขับเคลื่อน", "วัสดุใบมีด", "แหล่งจ่ายไฟ", "กำลังไฟฟ้า", "ขนาดตัวเครื่อง (กxลxส)", "น้ำหนักตัวเครื่อง", "ชนิดสายไฟที่รองรับ", "ความเร็วการป้อนสาย").
2. DO NOT use raw untranslated English keys like "model", "weight", "size", "material", "power" unless they are standard acronyms (e.g. "SKU", "IP Rating").`;
        }

        const prompt = `You are a Senior Industrial & Commercial Product Data Analyst and Technical Specification Specialist in Thailand.
Your mission is to extract an accurate, highly thorough, and perfectly structured list of technical specifications (Product Attributes) from the provided product information.

Product Input:
- Product Name: ${productName || ''}
- Category: ${categoryList.join(', ') || category || ''}
- SKU / Model: ${sku || ''}
- Size / Dimensions: ${size || ''}
- Short Summary: ${shortDescription || ''}
- Price / Other Notes: ${price || ''} ${remarks || ''}
- Full Description (HTML/Text): ${description || ''}

Extraction Guidelines:
1. **Thorough Spec Extraction**: Parse all HTML elements (tables <table>, lists <ul>/<ol>/<li>, headers <h3>/<h4>, bold text <strong>, paragraphs) carefully. Extract EVERY technical parameter, specification, capacity, dimension, and performance metric present in the data.
2. **Values Precision**:
   - Keep complete units, symbols, ranges, and technical formats intact (e.g. "0.1–99,999 มม.", "AWG#7 (10 sq) ถึง AWG#28 (0.08 sq)", "AC100–240V, 1 เฟส, 50/60Hz", "±(0.1 + 0.0005 × L) มม.", "W430 × D420 × H270 มม.", "27 กก.").
   - Do NOT abbreviate or truncate important values.
   - Clean up any raw HTML tags inside values (e.g., convert "<strong>C371G</strong>" to "C371G").
3. **Deduplication & Logical Organization**:
   - Merge duplicate or redundant rows into a single, comprehensive specification.
   - Order the attributes logically: Model/Series -> Core Technical Capabilities (Size/Capacity/Speed/Length) -> Mechanical/Drive/Blade Specs -> Electrical/Power Specs -> Dimensions & Weight -> Supported Materials/Types -> Standards/Certifications/Origin.
${templateInstruction}

Strict Output Format:
Return the response STRICTLY as a valid JSON array of objects with exactly two keys: "key" and "value". No markdown formatting, code block wrappers (\`\`\`json), or conversational text.
Example format:
[
  { "key": "รุ่นสินค้า", "value": "..." },
  { "key": "ขนาดสายไฟที่รองรับ", "value": "..." }
]`;

        const response = await gemini.generateContent({
            prompt,
            label: 'Generate Product Attributes Request'
        });

        const cleanedText = response.text.replace(/```json\n?|```\n?/g, '').trim();
        const result = safeJsonParse(cleanedText);

        res.status(200).json({ success: true, data: Array.isArray(result) ? result : [] });
    } catch (error) {
        console.error('AI Attributes Generation error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to generate attributes' });
    }
});

router.post('/generate-faq', verifyAdmin, async (req, res) => {
    try {
        const { productName, category, description } = req.body;

        if (!description && !productName) {
            return res.status(400).json({ success: false, error: 'Product Name or Description is required' });
        }

        const prompt = `
You are an expert sales representative and SEO specialist in Thailand.
Generate 3 to 5 frequently asked questions (FAQs) and their persuasive, informative answers based on this product.
Think about what a Thai buyer would most likely ask before purchasing this specific item.

Product Name: ${productName || 'Unknown'}
Category: ${category || 'Unknown'}
Raw Description: ${description || ''}

Return the response STRICTLY as a JSON array of objects with exactly two keys: "question" and "answer". No markdown formatting or extra text.
Example: [{"question": "ทนแดดทนฝนไหม?", "answer": "ทนทานแน่นอนครับ เพราะ..."}]
        `;

        const response = await gemini.generateContent({
            prompt,
            label: 'AI Request'
        });

        const cleanedText = response.text.replace(/```json\n?|```\n?/g, '').trim();
        const result = safeJsonParse(cleanedText);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('AI FAQ Generation error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to generate FAQ' });
    }
});

router.post('/test-key', verifyAdmin, async (req, res) => {
    try {
        const { apiKey } = req.body;
        if (!apiKey) {
            return res.status(400).json({ success: false, error: 'API Key is required to test' });
        }

        const firstKey = apiKey.split(',').map(k => k.trim()).filter(k => k.length > 0)[0];
        if (!firstKey) {
            return res.status(400).json({ success: false, error: 'API Key is invalid' });
        }

        const ai = new GoogleGenAI({ apiKey: firstKey });

        // Minimal prompt just to see if the key authenticates and returns successfully
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello',
        });

        res.status(200).json({ success: true, message: 'API Key is valid and working correctly.' });
    } catch (error) {
        console.error('Test API Key error:', error);
        res.status(400).json({ success: false, error: 'Invalid API Key or connection failed: ' + error.message });
    }
});

router.post('/generate-about', verifyAdmin, async (req, res) => {
    try {
        const { prompt: userPrompt, contextData } = req.body;

        if (!userPrompt && Object.keys(contextData || {}).length === 0) {
            return res.status(400).json({ success: false, error: 'Prompt or Context Data is required' });
        }

        let contextString = '';
        if (contextData) {
            contextString = `\nExisting Content Context:\n` + JSON.stringify(contextData, null, 2);
        }

        const prompt = `
You are an expert corporate copywriter, SEO specialist, and company historian in Thailand.
I need you to generate a full "About Us" page content for a company based on the instructions provided.

User Instructions/Prompt: "${userPrompt}"
${contextString}

Requirements:
- Ensure the tone is professional, trustworthy, and engaging.
- The content must be in Thai.
- Follow the structure required by the target JSON schema precisely.

Instructions for "about_content_rich":
- This must be detailed HTML content meant for a Rich Text Editor (CKEditor) at the bottom of the page.
- Do NOT wrap the HTML in markdown ticks (\`\`\`html...).
- Use proper tags like <h2>, <h3>, <p>, <ul>, and <li>, and <strong>. 
- You can include a detailed company history, milestones, or team descriptions here.

Return the response STRICTLY as a valid JSON object with the following keys exactly:
{
  "about_hero_title": "Main Hero Title (Can use <br/> for line breaks if needed)",
  "about_hero_subtitle": "Short punchy uppercase subtitle",
  "about_hero_desc": "Engaging description for the hero section (2-3 sentences max)",
  "about_quote_title": "A short, inspiring message or motto",
  "about_quote_text": "A slightly longer expansion of the motto or quote",
  "about_core_1_title": "Core value 1 title (e.g. คุณภาพ (Quality))",
  "about_core_1_desc": "Description for value 1",
  "about_core_2_title": "Core value 2 title",
  "about_core_2_desc": "Description for value 2",
  "about_core_3_title": "Core value 3 title",
  "about_core_3_desc": "Description for value 3",
  "about_vision_title": "The vision statement heading",
  "about_vision_desc": "The longer vision description",
  "about_content_rich": "The heavy HTML formatted history or additional details"
}
No markdown formatting (like \`\`\`json) outside the JSON block. Just pure JSON.
        `;

        const response = await gemini.generateContent({
            prompt,
            label: 'AI Request'
        });

        const cleanedText = response.text.replace(/```json\n?|```\n?/g, '').trim();
        const result = safeJsonParse(cleanedText);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('AI About Generation error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to generate About Us content' });
    }
});

router.post('/generate-services', verifyAdmin, async (req, res) => {
    try {
        const { prompt: userPrompt, contextData } = req.body;

        if (!userPrompt && Object.keys(contextData || {}).length === 0) {
            return res.status(400).json({ success: false, error: 'Prompt or Context Data is required' });
        }

        let contextString = '';
        if (contextData) {
            contextString = `\nExisting Content Context:\n` + JSON.stringify(contextData, null, 2);
        }

        const prompt = `
You are an expert corporate copywriter and service designer in Thailand.
I need you to generate content for a "Services" page based on the instructions provided.

User Instructions/Prompt: "${userPrompt}"
${contextString}

Requirements:
- Ensure the tone is professional, trustworthy, and engaging.
- The content must be in Thai.
- Follow the structure required by the target JSON schema precisely.
- For the "icon" in services_items, provide a valid generic SVG path (d="") that matches the service description (e.g. "M12..." for a building or gear). Do NOT wrap it in <svg>, just provide the "d" string. Or use generic icons if unsure.

Return the response STRICTLY as a valid JSON object with the following keys exactly:
{
  "services_hero_title": "Main Hero Title (Can use <br/> for line breaks)",
  "services_hero_subtitle": "Short punchy uppercase subtitle",
  "services_hero_desc": "Engaging description for the hero section",
  "services_items": [
    {
      "title": "Service 1 Name",
      "desc": "Service 1 Description",
      "icon": "SVG d path string"
    }
  ],
  "services_cta_title": "Call to action banner title",
  "services_cta_desc": "Call to action banner description",
  "services_content_rich": "Detailed HTML content for Rich Text Editor (No markdown ticks, use proper HTML tags)"
}
Make sure "services_items" has at least 4 items, ideally 6 if the context/prompt supports it.
No markdown formatting (like \`\`\`json) outside the JSON block. Just pure JSON.
        `;

        const response = await gemini.generateContent({
            prompt,
            label: 'AI Request'
        });

        const cleanedText = response.text.replace(/```json\n?|```\n?/g, '').trim();
        const result = safeJsonParse(cleanedText);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('AI Services Generation error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to generate Services content' });
    }
});

router.post('/generate-project', verifyAdmin, async (req, res) => {
    try {
        const { prompt: userPrompt, style: userStyle } = req.body;

        if (!userPrompt) {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }

        // Fetch products list from DB for context
        let productsList = 'No products available in database.';
        try {
            const [products] = await db.query(
                'SELECT id, name, sku, category FROM products WHERE is_active = 1 LIMIT 100'
            );
            if (products.length > 0) {
                productsList = products.map(p => `- ID: ${p.id} | Name: ${p.name} | SKU: ${p.sku || 'N/A'} | Category: ${p.category || 'N/A'}`).join('\n');
            }
        } catch (dbErr) {
            console.error('Failed to fetch products for generate-project:', dbErr.message);
        }

        const prompt = `
You are an expert corporate copywriter and customer relationship manager in Thailand.
I need you to generate a professional "Project Showcase" (ผลงานการติดตั้ง) based on a short note from an installer.

User Note/Prompt: "${userPrompt}"

Available Products in Database:
${productsList || "No products available in database."}

Requirements:
- The tone must be professional, trustworthy, and express gratitude to the customer for their trust in our products/services.
- Important Style Override: The user has requested the writing style to be "${userStyle || 'Professional'}". Adjust your language, tone, and vocabulary in the \`content_rich\` and \`description\` fields to match this style (e.g., if "Friendly", use more conversational/approachable Thai; if "Sales", emphasize value and persuasion; if "Storytelling", format it like a short engaging case study).
- The content must be in Thai.
- Follow the structure required by the target JSON schema precisely.

Instructions for fields:
- title: A formal, clean title summarizing the project (e.g., "งานติดตั้งบ้านเก็บของเมทัลชีท รุ่น MS-M003 เขตปากเกร็ด")
- client_name: Extract the client name if provided. If not, just put a generic professional placeholder like "ลูกค้าคนสำคัญ" or leave empty string if completely unknown.
- location: Extract the location from the prompt (e.g., "ปากเกร็ด นนทบุรี")
- description: A short 1-2 sentence description summarizing the work and thanking the customer for choosing us.
- content_rich: This must be detailed HTML content meant for a Rich Text Editor (CKEditor). It should expand on the short note into 2-3 well-written paragraphs.
  - Describe the product/model installed.
  - Talk about the quality, durability, or usefulness of the product.
  - Conclude with a strong, warm "Thank you" paragraph to the customer for trusting the company.
  - Do NOT wrap the HTML in markdown ticks (\`\`\`html...). Use proper tags like <h2>, <p>, <strong>, etc.
- product_id: Analyze the "User Note" and see if it mentions any product name or SKU that matches the "Available Products in Database" list above. If you find a strong match, return that product's ID. If no match is found, return null or empty string.
- service_date: Extract the date mentioned in the user note (if any) and format it directly as YYYY-MM-DD. For example, if it says "18 ก.พ. 2569", return "2026-02-18". If no date is found, return null or empty string.

Return the response STRICTLY as a valid JSON object with the following keys exactly:
{
  "title": "",
  "client_name": "",
  "location": "",
  "description": "",
  "content_rich": "",
  "product_id": "",
  "service_date": ""
}
No markdown formatting (like \`\`\`json) outside the JSON block. Just pure JSON.
        `;

        const response = await gemini.generateContent({
            prompt,
            label: 'AI Request'
        });

        const cleanedText = response.text.replace(/```json\n?|```\n?/g, '').trim();
        const result = safeJsonParse(cleanedText);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('AI Project Generation error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to generate Project content' });
    }
});

router.post('/generate-policy', verifyAdmin, async (req, res) => {
    try {
        const { prompt: userPrompt, type, customPrompt } = req.body;

        if (!userPrompt && !type && !customPrompt) {
            return res.status(400).json({ success: false, error: 'Prompt or policy type is required' });
        }

        // 1. Fetch All Corporate Information (About Us & Contact Us) from Database
        let sMap = {};
        try {
            const [sRows] = await db.query(`
                SELECT setting_key, setting_value FROM settings 
                WHERE setting_key LIKE 'about_%' 
                   OR setting_key LIKE 'contact_%' 
                   OR setting_key LIKE 'store_%' 
                   OR setting_key LIKE 'company_%'
            `);
            sRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
        } catch (e) {
            console.error('Failed to load settings for policy generation:', e);
        }

        const companyLegalName = sMap['company_legal_name'] || sMap['company_name'] || sMap['contact_company_name'] || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        const storeName = sMap['store_name'] || 'CR Distribution (Thailand) - เครื่องตัดปอกสายไฟ KODERA';
        const storeTagline = sMap['store_tagline'] || 'ตัวแทนจำหน่ายเครื่องตัดปอกสายไฟ KODERA อย่างเป็นทางการในประเทศไทย';
        const storeDescription = sMap['store_description'] || 'ผู้นำเข้าและจำหน่ายเครื่องตัดปอกสายไฟอัตโนมัติ KODERA เครื่องย้ำคอร์เนคเตอร์ และโซลูชันระบบ Wire Harness ครบวงจร พร้อมบริการติดตั้งและหลังการขายระดับมืออาชีพ';
        const storeUrl = sMap['store_url'] || 'https://เครื่องตัดปอกย้ำสายไฟ.com';
        const storeAddress = sMap['contact_address'] || sMap['store_address'] || '75/110 หมู่ 11 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120';
        const workingHours = sMap['contact_working_hours'] || 'จันทร์ - ศุกร์ 08:00 - 17:00 น.';
        const taxId = sMap['store_tax_id'] || '';

        // Parse Contact Phones
        let phoneList = [];
        if (sMap['contact_phones']) {
            try {
                const parsed = JSON.parse(sMap['contact_phones']);
                if (Array.isArray(parsed)) {
                    phoneList = parsed.map(p => typeof p === 'string' ? p : `${p.name || 'โทร'}: ${p.value}`).filter(Boolean);
                }
            } catch(e) {}
        }
        if (phoneList.length === 0) {
            if (sMap['contact_phone']) phoneList.push(`สำนักงาน: ${sMap['contact_phone']}`);
            if (sMap['contact_phone2']) phoneList.push(`เบอร์โทร: ${sMap['contact_phone2']}`);
            if (sMap['store_phone']) phoneList.push(`เบอร์หลัก: ${sMap['store_phone']}`);
        }
        const phoneString = phoneList.length > 0 ? phoneList.join(', ') : '02-9081348-9, 089-1993873, 090-8865389';

        // Parse Contact Emails
        let emailList = [];
        if (sMap['contact_emails']) {
            try {
                const parsed = JSON.parse(sMap['contact_emails']);
                if (Array.isArray(parsed)) {
                    emailList = parsed.map(e => typeof e === 'string' ? e : `${e.name || 'อีเมล'}: ${e.value}`).filter(Boolean);
                }
            } catch(e) {}
        }
        if (emailList.length === 0) {
            if (sMap['contact_email']) emailList.push(sMap['contact_email']);
            if (sMap['contact_email2']) emailList.push(sMap['contact_email2']);
        }
        const emailString = emailList.length > 0 ? emailList.join(', ') : 'sales@crdistribution.co.th, service@crdistribution.co.th';

        // Parse Contact Lines
        let lineList = [];
        if (sMap['contact_lines']) {
            try {
                const parsed = JSON.parse(sMap['contact_lines']);
                if (Array.isArray(parsed)) {
                    lineList = parsed.map(l => typeof l === 'string' ? l : `${l.name || 'Line'}: ${l.value || ''} (${l.url || ''})`).filter(Boolean);
                }
            } catch(e) {}
        }
        if (lineList.length === 0 && sMap['contact_line_id']) {
            lineList.push(`Line ID: ${sMap['contact_line_id']}`);
        }
        const lineString = lineList.length > 0 ? lineList.join(', ') : 'Line ID: @crdistribution';

        // About Us highlights
        const aboutStory = [sMap['about_story_p1'], sMap['about_story_p2'], sMap['about_vision_desc']].filter(Boolean).join(' ') || 'ผู้นำเข้าและจำหน่ายเครื่องตัดปอกสายไฟ KODERA จากประเทศญี่ปุ่น ประสบการณ์และความเชี่ยวชาญกว่า 20 ปี พร้อมทีมวิศวกรผู้เชี่ยวชาญ On-site Service ทั่วประเทศ';

        // Policy Type specific prompt instructions
        let policySpecificInstruction = '';
        const policyType = type || 'privacy';

        if (policyType === 'privacy') {
            policySpecificInstruction = `
เอกสาร: "นโยบายความเป็นส่วนตัว (Privacy Policy)" ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
โครงสร้างเนื้อหาที่ต้องมี:
1. บทนำและเจตนารมณ์: ระบุชื่อผู้ควบคุมข้อมูลส่วนบุคคล (${companyLegalName}) และเว็บไซต์ (${storeUrl})
2. ข้อมูลส่วนบุคคลที่มีการเก็บรวบรวม: ข้อมูลระบุตัวตน (ชื่อ-นามสกุล, ชื่อบริษัท/โรงงาน), ข้อมูลการติดต่อ (เบอร์โทร, อีเมล, ที่อยู่จัดส่ง/ติดตั้ง), ข้อมูลการสั่งซื้อเครื่องจักร KODERA และประวัติการขอใบเสนอราคา
3. วัตถุประสงค์ในการประมวลผลข้อมูล: การออกใบเสนอราคา, การจัดทำสัญญาซื้อขาย, การส่งมอบและติดตั้งเครื่องจักรหน้างาน, การฝึกอบรม, การรับประกันและบริการหลังการขาย
4. ฐานในการประมวลผลข้อมูลตามกฎหมาย (Lawful Basis)
5. ระยะเวลาในการเก็บรักษาข้อมูลส่วนบุคคล (Data Retention Period: 5-10 ปีตามความจำเป็นทางธุรกิจและกฎหมายภาษี)
6. การเปิดเผยหรือถ่ายโอนข้อมูล (เช่น ผู้ให้บริการขนส่งเครื่องจักร, สถาบันการเงิน)
7. มาตรการรักษาความปลอดภัยของข้อมูลส่วนบุคคล (Technical and Organizational Measures)
8. สิทธิของเจ้าของข้อมูลส่วนบุคคลตาม PDPA (สิทธิเข้าถึง, ขอแก้ไข, ขอลบ, ขอระงับ, ถอนความยินยอม)
9. ช่องทางการติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO / Data Controller) โดยระบุชื่อบริษัท: ${companyLegalName}, ที่อยู่: ${storeAddress}, เบอร์โทรศัพท์: ${phoneString}, อีเมล: ${emailString}, Line: ${lineString}, เวลาทำการ: ${workingHours}
`;
        } else if (policyType === 'terms') {
            policySpecificInstruction = `
เอกสาร: "เงื่อนไขและข้อตกลงการให้บริการ (Terms of Service)"
โครงสร้างเนื้อหาที่ต้องมี:
1. ขอบเขตการให้บริการ: การจัดจำหน่ายเครื่องตัดปอกสายไฟอัตโนมัติ KODERA, เครื่องย้ำเทอร์มินอล, อุปกรณ์ Wire Harness, ใบมีด และอะไหล่แท้จากประเทศญี่ปุ่น พร้อมบริการติดตั้งและฝึกอบรม
2. เงื่อนไขการสั่งซื้อและเสนอราคา (Quotation & Purchase Order): ความถูกต้องของใบเสนอราคา, การยืนยันคำสั่งซื้อ, การชำระเงิน, และการออกใบกำกับภาษีถูกต้องตามกฎหมาย
3. การส่งมอบ การติดตั้ง และการทดสอบเครื่องจักร (Delivery, On-site Installation & Testing)
4. การรับประกันและบริการหลังการขาย (Warranty & Support): อ้างอิงเงื่อนไขการรับประกันมาตรฐาน 1 ปี
5. ทรัพย์สินทางปัญญา (Intellectual Property): เครื่องหมายการค้า KODERA, เอกสารคู่มือ, รูปภาพ, และเนื้อหาบนเว็บไซต์เป็นลิขสิทธิ์ของบริษัทและเจ้าของสิทธิ์
6. ข้อจำกัดความรับผิด (Limitation of Liability) และเหตุสุดวิสัย (Force Majeure)
7. กฎหมายที่ใช้บังคับและเขตอำนาจศาล (Governing Law): กฎหมายแห่งราชอาณาจักรไทย
8. ข้อมูลติดต่ออย่างเป็นทางการ: ${companyLegalName}, ที่อยู่: ${storeAddress}, เบอร์โทรศัพท์: ${phoneString}, อีเมล: ${emailString}, เวลาทำการ: ${workingHours}
`;
        } else if (policyType === 'cookie') {
            policySpecificInstruction = `
เอกสาร: "นโยบายการใช้คุกกี้ (Cookie Policy)"
โครงสร้างเนื้อหาที่ต้องมี:
1. คุกกี้คืออะไร และทำไมเว็บไซต์ ${storeUrl} ของ ${companyLegalName} จึงจำเป็นต้องใช้คุกกี้
2. ประเภทของคุกกี้ที่ใช้งานบนเว็บไซต์:
   - คุกกี้ที่จำเป็นอย่างยิ่ง (Strictly Necessary Cookies): สำหรับระบบความปลอดภัย, ตะกร้าสินค้า, การเข้าสู่ระบบ
   - คุกกี้เพื่อการวิเคราะห์และวัดผล (Analytics / Performance Cookies): สำหรับสถิติผู้เข้าชมเพื่อนำไปปรับปรุงประสิทธิภาพ
   - คุกกี้เพื่อการทำงานของเว็บไซต์ (Functional Cookies): จดจำสินค้าที่ดูล่าสุด และการเปรียบเทียบสเปกเครื่องจักร
3. การตั้งค่าและการจัดการคุกกี้: วิธีการปฏิเสธหรือลบคุกกี้ผ่านเว็บบราวเซอร์หลัก (Google Chrome, Safari, Microsoft Edge, Firefox)
4. การแก้ไขเปลี่ยนแปลงนโยบายคุกกี้
5. ช่องทางการติดต่อสอบถามเรื่องคุกกี้: ${companyLegalName}, เบอร์โทรศัพท์: ${phoneString}, อีเมล: ${emailString}
`;
        } else if (policyType === 'warranty') {
            policySpecificInstruction = `
เอกสาร: "นโยบายและเงื่อนไขการรับประกันเครื่องจักร (Machine Warranty Policy)"
โครงสร้างเนื้อหาที่ต้องมี:
1. ขอบเขตการรับประกัน (Warranty Coverage):
   - รับประกันตัวเครื่องตัดปอกสายไฟ KODERA และระบบควบคุมไฟฟ้า/เซอร์โวมอเตอร์ 1 ปีเต็ม นับตั้งแต่วันส่งมอบและผ่านการทดสอบหน้างาน
   - บริการตรวจสอบ ซ่อมแซม และ On-site Service โดยทีมวิศวกรผู้เชี่ยวชาญของ ${companyLegalName}
   - ใช้อะไหล่แท้มาตรฐานตรงรุ่นจากโรงงานผู้ผลิต KODERA ประเทศญี่ปุ่น
2. สิทธิประโยชน์และการบริการหลังการขาย:
   - การอบรมการใช้งานและบำรุงรักษาเบื้องต้นให้แก่ทีมช่างของผู้ซื้อ
   - ให้คำปรึกษาทางเทคนิคตลอดอายุการใช้งาน
3. ขั้นตอนการแจ้งซ่อมหรือขอรับบริการเคลมประกัน (Claim Procedure):
   - แจ้งรุ่นเครื่องจักร (Model), หมายเลขเครื่อง (Serial No.), และอาการผิดปกติ
   - ติดต่อฝ่ายวิศวกรรมและบริการ: ${phoneString}, อีเมล: ${emailString}, Line: ${lineString} (เวลาทำการ: ${workingHours})
4. ข้อยกเว้นการรับประกัน (Warranty Exclusions):
   - ชิ้นส่วนสิ้นเปลืองตามอายุการใช้งาน (Consumables) เช่น ใบมีดตัดปอก (Blades), ลูกกลิ้งยาง/ยูรีเทน (Feed Rollers), สายพานลำเลียง ซึ่งขึ้นอยู่กับปริมาณและประเภทสายไฟที่ใช้งาน
   - ความเสียหายที่เกิดจากการใช้งานผิดประเภท, ใช้งานเกินกำลังสเปกเครื่อง, การตัดสายไฟที่มีโลหะแปลกปลอม
   - การดัดแปลง แก้ไข หรือซ่อมแซมโดยบุคคลที่ไม่ได้รับอนุญาตจาก ${companyLegalName}
   - ความเสียหายจากปัจจัยภายนอก เช่น ไฟตก ไฟกระชาก ฟ้าผ่า หรือภัยธรรมชาติ
5. ช่องทางติดต่อฝ่ายบริการหลังการขาย: ${companyLegalName}, ที่อยู่: ${storeAddress}, เบอร์โทรศัพท์: ${phoneString}, อีเมล: ${emailString}, Line: ${lineString}
`;
        }

        const finalPrompt = `
คุณคือที่ปรึกษากฎหมาย ผู้เชี่ยวชาญด้าน PDPA และนักเขียนเอกสารทางกฎหมายระดับองค์กร (Enterprise Legal Counsel & Compliance Expert) ประจำประเทศไทย
กรุณาร่างเอกสารฉบับสมบูรณ์สำหรับเว็บไซต์และธุรกิจตามข้อมูลจริงของบริษัท ดังนี้:

ข้อมูลองค์กร (Corporate Data):
- นิติบุคคล (Legal Name): ${companyLegalName}
- ชื่อแบรนด์/ร้านค้า: ${storeName}
- สโลแกน/จุดเด่น: ${storeTagline}
- ลักษณะธุรกิจ: ${storeDescription}
- ประวัติและความเชี่ยวชาญ: ${aboutStory}
- ที่อยู่สำนักงาน/คลังสินค้า: ${storeAddress}
- เลขประจำตัวผู้เสียภาษี: ${taxId || 'ตามที่ระบุในใบกำกับภาษี'}
- เบอร์โทรศัพท์ติดต่อ: ${phoneString}
- อีเมลติดต่อ: ${emailString}
- LINE Official: ${lineString}
- เว็บไซต์: ${storeUrl}
- เวลาทำการ: ${workingHours}

ข้อกำหนดเฉพาะของเอกสารประเภทนี้:
${policySpecificInstruction}

คำสั่งเพิ่มเติมจากผู้ใช้งาน:
"${customPrompt || userPrompt || ''}"

เกณฑ์การจัดทำเอกสาร (Strict Output Requirements):
1. เขียนเนื้อหาภาษาไทยที่ถูกต้อง เป็นทางการ สละสลวย ชัดเจน และถูกต้องตามหลักกฎหมายไทย 100%
2. ใช้ข้อมูลจริงของบริษัท (ชื่อบริษัท, ที่อยู่, เบอร์โทร, อีเมล, ไลน์) ที่ระบุข้างต้นเท่านั้น ห้ามเว้นว่างหรือใส่ข้อความ placeholder เช่น [ชื่อบริษัท], [ที่อยู่], [xxx]
3. จัดโครงสร้างเป็นโค้ด HTML ที่สะอาด สำหรับใส่ลง CKEditor:
   - ใช้ <h2> สำหรับหัวข้อหลักแต่ละมาตรา/หมวด
   - ใช้ <h3> สำหรับหัวข้อย่อย
   - ใช้ <p> สำหรับย่อหน้าอธิบายความ
   - ใช้ <ul> และ <li> สำหรับแจกแจงรายการเงื่อนไขและสิทธิประโยชน์
   - ใช้ <strong> สำหรับเน้นคำสำคัญทางกฎหมาย หรือระยะเวลา
   - สามารถใช้ <table>, <thead>, <tbody>, <tr>, <th>, <td> ได้หากมีตารางสรุป
4. ห้ามตอบกลับเป็น JSON หรือครอบด้วย JSON เด็ดขาด (DO NOT return JSON format) ห้ามใส่ key เช่น "document_title" หรือ "content_html" ให้ส่งเฉพาะแท็ก HTML เริ่มต้นด้วย <h2> หรือ <p> โดยตรงเท่านั้น
5. ห้ามครอบโค้ดด้วย markdown code block (ห้ามใส่ \`\`\`html หรือ \`\`\`) ส่งเฉพาะเนื้อหา HTML ล้วนๆ
`;

        const response = await gemini.generateContent({
            prompt: finalPrompt,
            label: 'AI Policy Request'
        });

        let textResponse = response.text || '';
        textResponse = textResponse.replace(/^```(?:html|json)?\s*/i, '').replace(/```\s*$/, '').trim();

        // If Gemini returned a JSON string, extract the actual HTML content
        try {
            const parsed = safeJsonParse(textResponse);
            if (parsed && typeof parsed === 'object') {
                const extractedHtml = parsed.content_html || parsed.content || parsed.html || parsed.policy_html || parsed.policy_content || parsed.body || parsed.text;
                if (extractedHtml && typeof extractedHtml === 'string') {
                    const title = parsed.document_title || parsed.title;
                    if (title && !extractedHtml.includes(title)) {
                        textResponse = `<h2>${title}</h2>\n` + extractedHtml;
                    } else {
                        textResponse = extractedHtml;
                    }
                }
            }
        } catch (e) {
            // Not a full JSON object, check for partial JSON artifact wrapper
        }

        // Clean any stray JSON wrapper artifacts if model outputted literal JSON strings
        if (textResponse.startsWith('{') && textResponse.includes('"content_html"')) {
            textResponse = textResponse
                .replace(/^\{[\s\S]*?"content_html"\s*:\s*"/i, '')
                .replace(/"\s*\}\s*$/i, '')
                .replace(/\\"/g, '"')
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t');
        }

        textResponse = textResponse.trim();

        res.status(200).json({ success: true, data: textResponse });
    } catch (error) {
        console.error('AI Policy Generation error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to generate policy content' });
    }
});

router.post('/generate', verifyAdmin, async (req, res) => {
    try {
        const { prompt, systemPrompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }

        const fullPrompt = systemPrompt
            ? `${systemPrompt}\n\nUser Request: ${prompt}`
            : prompt;

        const response = await gemini.generateContent({
            prompt: fullPrompt,
            responseMimeType: 'text/plain',
            label: 'Generate Content'
        });

        let textResponse = response.text;
        textResponse = response.text.replace(/```html\n?|```\n?/g, '').trim();

        res.status(200).json({ success: true, data: textResponse });
    } catch (error) {
        console.error('AI Generate Content error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'Failed to generate content' });
    }
});

router.post('/extract-product-all', verifyAdmin, async (req, res) => {
    try {
        let { rawText, knownCategory } = req.body;

        if (!rawText) {
            return res.status(400).json({ success: false, error: 'Raw text is required' });
        }

        let storeName = 'CAS-CR';
        let companyLegalName = 'บริษัท แคส-ซีอาร์ จำกัด';
        try {
            const [settingsRows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'company_legal_name', 'contact_company_name')");
            const sMap = {};
            settingsRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            storeName = sMap['store_name'] || sMap['contact_company_name'] || 'CAS-CR';
            companyLegalName = sMap['company_legal_name'] || storeName;
        } catch (e) {}

        // Truncate if exceptionally huge to prevent token exhaustion, but keep HTML tables and structure
        if (rawText.length > 25000) {
            rawText = rawText.substring(0, 25000) + '... (ตัดข้อความที่เหลือ)';
        }

        const [categoryRows] = await db.query('SELECT name FROM categories');
        const validCategories = categoryRows.map(r => r.name).join(', ');

        let templateInstruction = '';
        if (knownCategory) {
            const [templates] = await db.query('SELECT * FROM category_attribute_templates WHERE category_name = ? ORDER BY sort_order ASC', [knownCategory]);
            if (templates.length > 0) {
                const keysList = templates.map(t => `- "${t.attribute_key}" (ความหมาย: ${t.attribute_label})`).join('\n');
                templateInstruction = `
CRITICAL RULES FOR "attributes" FIELD:
The category '${knownCategory}' has these predefined attribute keys:
${keysList}

1. For specifications that match any predefined template key above, copy the exact "attribute_key" string into the "key" field.
2. Extract accurate values for matching template keys.
3. For all other specifications found in the raw text, add them as custom attributes with clear Thai keys (e.g. "รุ่นสินค้า", "ขนาดสายไฟที่รองรับ", "ความยาวในการตัด", "ระบบขับเคลื่อน", "วัสดุใบมีด", "แหล่งจ่ายไฟ", "กำลังไฟฟ้า").`;
            }
        } else {
            const [allTemplates] = await db.query('SELECT category_name, attribute_key, attribute_label FROM category_attribute_templates ORDER BY category_name, sort_order ASC');
            if (allTemplates.length > 0) {
                const grouped = {};
                allTemplates.forEach(t => {
                    if (!grouped[t.category_name]) grouped[t.category_name] = [];
                    grouped[t.category_name].push(`  - key: "${t.attribute_key}" (ความหมาย: "${t.attribute_label}")`);
                });
                const allKeysList = Object.entries(grouped)
                    .map(([cat, keys]) => `[${cat}]\n${keys.join('\n')}`)
                    .join('\n\n');
                templateInstruction = `
CRITICAL RULES FOR "attributes" FIELD:
After you determine the product category, use matching predefined attribute keys from this list:
${allKeysList}
For all other technical parameters, extract them with formal Thai keys.`;
            }
        }

        const prompt = `You are an elite Product Data Analyst, SEO, and Technical Specification Specialist in Thailand representing ${storeName} (${companyLegalName}).
Your task is to analyze the provided raw product text/HTML and extract all details into a structured, highly accurate JSON object.

Raw Product Text / HTML:
"""
${rawText}
"""

${templateInstruction}

Requirements:
1. All extracted text MUST be in standard Thai language (keep exact brand names, models, tolerances, and technical codes intact).
2. "category": Select ONE exact category from this list that best matches: [${validCategories}]. If none matches, pick the closest one verbatim.
3. "description": Must be high-quality, professional, beautifully organized HTML (using <h2>, <h3>, <p>, <ul><li>, and <table> inside <figure class="table">) describing the product thoroughly.
4. "attributes": Extract a comprehensive list of technical specifications. Ensure EVERY measurement, unit, tolerance (e.g. ±(0.1 + 0.0005 × L) มม.), wire size (AWG), dimension, voltage, and material is fully preserved.
5. "faq": Generate 3 to 5 realistic, high-value FAQs with accurate answers answering customer search intent.
6. Do NOT invent fake numbers for specifications or prices if not present in the raw text.

Strict Output Format:
Return ONLY a valid JSON object with the following keys and NO markdown code block wrappers:
{
  "name": "Product name in Thai with model",
  "sku": "SKU or model number",
  "price": number (selling price, or 0 / null if not mentioned),
  "original_price": number (original price if discounted, or null),
  "category": "Extracted category from list",
  "seo_title": "Optimized SEO title under 60 chars",
  "seo_description": "Compelling meta description under 160 chars",
  "seo_keywords": "Comma-separated Thai and English keywords",
  "slug": "url-friendly-slug-with-dashes",
  "llm_context": "Deep factual context in Thai for AI Search Engines (Perplexity, ChatGPT)",
  "description": "Structured HTML description for CKEditor",
  "short_description": "Short compelling summary (1-2 sentences)",
  "remarks": "Special conditions or notes (or empty string)",
  "attributes": [
    {"key": "ชื่อสเปกภาษาไทย หรือ template key", "value": "ค่าสเปกที่ครบถ้วน"}
  ],
  "faq": [
    {"question": "คำถาม", "answer": "คำตอบ"}
  ],
  "size": "Dimensions string (e.g. W430 x D420 x H270 mm)",
  "weight_kg": number (or null),
  "width_cm": number (or null),
  "length_cm": number (or null),
  "height_cm": number (or null),
  "image_url": "Image URL if found, else empty string",
  "images": [],
  "badge_free_shipping": boolean,
  "badge_warranty": boolean,
  "badge_installation": boolean,
  "badge_new": boolean,
  "badge_bestseller": boolean
}`;

        const response = await gemini.generateContent({
            prompt,
            responseMimeType: 'application/json',
            label: 'Extract Product All'
        });

        const result = safeJsonParse(response.text);

        if (!result) {
            return res.status(500).json({ success: false, error: 'AI ส่งข้อมูลกลับมาในรูปแบบที่ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('AI Extract Product error:', error);
        const statusCode = error.statusCode || 400;
        res.status(statusCode).json({ success: false, error: error.message || 'ไม่สามารถดึงข้อมูลสินค้าได้' });
    }
});

// Get all available API key status
router.get('/key-status', verifyAdmin, async (req, res) => {
    try {
        const status = await gemini.getKeyStatus();
        res.json({ success: true, ...status });
    } catch (error) {
        console.error('API Key Status Error:', error);
        res.status(500).json({ success: false, error: 'ไม่สามารถโหลดสถานะ API Key ได้' });
    }
});

// Get available Gemini models
router.get('/available-models', verifyAdmin, async (req, res) => {
    try {
        const models = await gemini.getAvailableModels();
        res.json({ success: true, models });
    } catch (error) {
        console.error('Fetch available models error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch available models: ' + error.message });
    }
});

module.exports = router;
