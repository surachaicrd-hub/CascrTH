const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { GoogleGenAI } = require('@google/genai');
const gemini = require('../services/geminiService');
const { verifyAdmin } = require('./auth');

// Safe JSON parser for AI responses - extracts JSON even if wrapped in extra text
function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
        // Try to extract JSON object from the text
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try { return JSON.parse(match[0]); } catch (e2) { /* ignore */ }
        }
        // Try to extract JSON array
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            try { return JSON.parse(arrayMatch[0]); } catch (e3) { /* ignore */ }
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

        let storeName = 'STORAGE HOUSE';
        let companyLegalName = 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        try {
            const [sRows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'contact_company_name', 'company_legal_name')");
            const sMap = {};
            sRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            storeName = sMap['store_name'] || sMap['contact_company_name'] || 'STORAGE HOUSE';
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
        res.status(500).json({ success: false, error: 'Failed to generate SEO content: ' + error.message });
    }
});

router.post('/generate-full-seo-geo', verifyAdmin, async (req, res) => {
    try {
        const { productName, category, description, size, sku, price } = req.body;

        if (!productName) {
            return res.status(400).json({ success: false, error: 'Product name is required' });
        }

        let storeName = 'STORAGE HOUSE';
        let companyLegalName = 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด';
        try {
            const [sRows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('store_name', 'contact_company_name', 'company_legal_name')");
            const sMap = {};
            sRows.forEach(r => { sMap[r.setting_key] = r.setting_value; });
            storeName = sMap['store_name'] || sMap['contact_company_name'] || 'STORAGE HOUSE';
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

Generate a comprehensive 12-Layer SEO & GEO Payload strictly as a valid JSON object (no markdown wrappers) containing:
1. "seo_title": SEO title (under 60 characters, captivating with key terms & brand).
2. "seo_description": Meta description (under 160 characters, with key specs & call-to-action).
3. "seo_keywords": High-intent keywords list in Thai & English separated by commas.
4. "llm_context": Data-rich factual narrative (in Thai) specifically formatted for LLMs (ChatGPT/Perplexity) explaining product entities, materials, resistance, warranty, supplier (${companyLegalName}), and usage scenarios.
5. "image_alt": Optimized image alt text describing the product appearance, material, and function.
6. "attributes": Array of key-value objects [{ "name": "...", "value": "..." }] mapping specs (materials, durability, usage, UV protection, suitable for, warranty).
7. "faq": Array of 3 to 4 Question-Answer objects [{ "q": "...", "a": "..." }] addressing primary search intent (material/durability, delivery/installation in Thailand, warranty/care).
8. "search_intent": A string summarizing primary intent (e.g. "Transactional / Commercial Investigation").
9. "information_gain_tips": Array of 2-3 specific optimization suggestions to outperform competitors on Google/AI.

Strict Output Format:
Return ONLY the JSON object. Do not include markdown code block syntax (\`\`\`json).
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
        res.status(500).json({ success: false, error: 'Failed to generate 12-Layer SEO/GEO payload: ' + error.message });
    }
});

router.post('/format-description', verifyAdmin, async (req, res) => {
    try {
        const { productName, category, description } = req.body;

        if (!description) {
            return res.status(400).json({ success: false, error: 'Description is required to format' });
        }

        const prompt = `
You are an expert SEO specialist and web copywriter in Thailand.
I will provide you with a product's raw description, name, and category.
Your task is to rewrite, organize, and format this description to be comprehensive, highly organized, engaging, and SEO-optimized.
Critically, you must present the information in distinct, well-spaced sections so it is very easy and comfortable to read.

Key Formatting Rules:
1. Return ONLY valid HTML that can be rendered inside a rich text editor (CKEditor). No markdown block wrappers like \`\`\`html.
2. Structure the content beautifully into logical sections using <h2> and <h3> tags.
3. If there is technical data, dimensions, or specifications, you MUST organize them into a clean <table> instead of plain text. Keep the table simple (<th> for headers, <td> for data).
4. Use <ul> and <li> for lists of features, benefits, or included items.
5. Use <strong> to highlight key selling points.
6. Provide good spacing by wrapping paragraphs in <p> tags and avoid creating massive blocks of text. Give enough breathing room between sections for visual comfort.
7. Tone should be professional, persuasive, and targeted at a Thai audience.
8. Do NOT include <html>, <head>, or <body> tags.

Product Name: ${productName || 'Unknown'}
Category: ${category || 'Unknown'}
Raw Description: ${description}
        `;

        const response = await gemini.generateContent({
            prompt,
            responseMimeType: 'text/plain',
            label: 'Format Description'
        });

        let htmlResponse = response.text;
        // Clean up markdown ticks if Gemini accidentally added them
        htmlResponse = htmlResponse.replace(/```html\n?|```\n?/g, '').trim();
        // Remove literal \n output generated by Gemini
        htmlResponse = htmlResponse.replace(/\\n/g, '<br/>');
        // If it failed to output HTML paragraphs entirely, convert newlines to <br/>
        if (!htmlResponse.match(/<p>|<div>|<ul>|<li>|<h2>|<h3>/i)) {
            htmlResponse = htmlResponse.replace(/\n/g, '<br/>');
        }

        res.status(200).json({ success: true, data: htmlResponse });
    } catch (error) {
        console.error('AI Formatting error:', error);
        res.status(500).json({ success: false, error: 'Failed to format description: ' + error.message });
    }
});

router.post('/generate-attributes', verifyAdmin, async (req, res) => {
    try {
        const { productName, category, description } = req.body;

        if (!description && !productName) {
            return res.status(400).json({ success: false, error: 'Product Name or Description is required' });
        }

        let templateInstruction = '';
        if (category) {
            const [templates] = await db.query('SELECT * FROM category_attribute_templates WHERE category_name = ? ORDER BY sort_order ASC', [category]);
            if (templates.length > 0) {
                const keysList = templates.map(t => `- "${t.attribute_key}" (ความหมาย: ${t.attribute_label})`).join('\n');
                templateInstruction = `
CRITICAL RULES: The category '${category}' has these EXACT predefined attribute keys:
${keysList}

1. You MUST copy these key strings EXACTLY into the "key" field. Do NOT paraphrase, translate, abbreviate, or create synonyms.
2. Even if the template key is in English (e.g. "external_dimensions"), you MUST use the exact string (e.g. "external_dimensions") as the key.
3. Extract data for ALL template keys based on their meaning. If no data found, set value to "".
4. You may add extra custom keys ONLY for data that truly doesn't fit ANY template key. These EXTRA custom keys MUST be in Thai language (e.g. "รุ่นสินค้า" not "model", "อุปกรณ์เสริม" not "accessories").`;
            }
        }

        const prompt = `
You are an expert product data analyst in Thailand.
Please extract a clean, structured list of technical specifications or key attributes from the following product information.
If the description is short, infer the most common important attributes for this category of product.
${templateInstruction}

Product Name: ${productName || 'Unknown'}
Category: ${category || 'Unknown'}
Raw Description: ${description || ''}

Return the response STRICTLY as a JSON array of objects with exactly two keys: "key" and "value". No markdown formatting or extra text.
Use the EXACT predefined template keys listed above.
IMPORTANT: For any custom attributes you create that are NOT in the predefined template keys, you MUST use Thai language for the keys. Do NOT use English keys like "model", "accessories", "material", etc. Use Thai equivalents like "รุ่นสินค้า", "อุปกรณ์เสริม", "วัสดุ" instead. But for predefined template keys, keep them exactly as listed (even if they are English).
        `;

        const response = await gemini.generateContent({
            prompt,
            label: 'AI Request'
        });

        const cleanedText = response.text.replace(/```json\n?|```\n?/g, '').trim();
        const result = safeJsonParse(cleanedText);

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('AI Attributes Generation error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate attributes: ' + error.message });
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
        res.status(500).json({ success: false, error: 'Failed to generate FAQ: ' + error.message });
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
        res.status(500).json({ success: false, error: 'Failed to generate About Us content: ' + error.message });
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
        res.status(500).json({ success: false, error: 'Failed to generate Services content: ' + error.message });
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
        res.status(500).json({ success: false, error: 'Failed to generate Project content: ' + error.message });
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
        console.error('AI Generate Policy error:', error);
        res.status(500).json({ success: false, error: 'Failed to generate policy: ' + error.message });
    }
});

router.post('/extract-product-all', verifyAdmin, async (req, res) => {
    try {
        let { rawText, knownCategory } = req.body;

        if (!rawText) {
            return res.status(400).json({ success: false, error: 'Raw text is required' });
        }

        // Strip HTML tags and truncate to prevent Gemini token overflow
        rawText = rawText.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        if (rawText.length > 15000) {
            rawText = rawText.substring(0, 15000) + '... (ตัดข้อความที่เหลือ)';
        }

        const [categoryRows] = await db.query('SELECT name FROM categories');
        const validCategories = categoryRows.map(r => r.name).join(', ');

        let templateInstruction = '';
        if (knownCategory) {
            // Known category: load only that category's templates
            const [templates] = await db.query('SELECT * FROM category_attribute_templates WHERE category_name = ? ORDER BY sort_order ASC', [knownCategory]);
            if (templates.length > 0) {
                const keysList = templates.map(t => `- "${t.attribute_key}" (ความหมาย: ${t.attribute_label})`).join('\n');
                templateInstruction = `
CRITICAL RULES FOR "attributes" FIELD:
The category '${knownCategory}' has these EXACT predefined attribute keys:
${keysList}

You MUST follow these rules strictly:
1. Copy these key strings EXACTLY into the "key" field of each attribute object. Do NOT paraphrase, translate, abbreviate, or create synonyms.
2. Even if the template key is in English (e.g. "external_dimensions"), you MUST use the exact string "external_dimensions" as the key.
3. If data in the raw text matches a template key's meaning, fill in its value. If no matching data exists, set value to empty string "".
4. You may add extra custom keys ONLY for data that truly doesn't fit ANY of the template keys above. These EXTRA custom keys MUST be in Thai language (e.g. "รุ่นสินค้า" not "model", "อุปกรณ์เสริม" not "accessories").`;
            }
        } else {
            // No category selected: load ALL category templates so AI can pick the right one
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
After you determine the product category, you MUST use the EXACT predefined attribute keys for that category from this list:

${allKeysList}

You MUST follow these rules strictly:
1. Copy the key strings EXACTLY as listed above. Do NOT paraphrase, translate, abbreviate, or create synonyms.
2. Even if the template key is in English, you MUST use the exact string as the key.
3. If data matches a template key's meaning, fill in its value. If no matching data exists, set value to empty string.
4. You may add extra custom keys ONLY for data that truly doesn't fit ANY template key. These EXTRA custom keys MUST be in Thai language (e.g. "รุ่นสินค้า" not "model").`;
            }
        }

        const prompt = `
You are an expert product data analyst, SEO (Search Engine Optimization), and GEO (Generative Engine Optimization) specialist in Thailand.
The user has provided raw, unformatted text copied from a website or catalog.
${templateInstruction}
Your task is to analyze this raw text and extract/format all relevant product data into a strict JSON structure.

Raw Text:
"""
${rawText}
"""

Requirements:
1. The extracted text MUST be in Thai language (translate naturally if the source is English, but keep model names or technical terms intact).
2. "category": You MUST select ONE exact category from the following list that best matches the product: [${validCategories}]. If none matches perfectly, pick the closest one verbatim.
3. Infer missing information intelligently if it makes sense, but do not invent fake numbers for dimensions or prices.
4. Keep the output strictly as a JSON object (no markdown block wrappers).
5. "description": This MUST be high-quality, professional, persuasive, and highly factual copy in Thai.
   GEO Rules for description:
   - Organize beautifully into HTML using <h2>, <p> (with good line breaks), <ul>, and <table> for technical specs.
   - Do NOT use plain sentences for specs; always organize them in a clean <table>.
   - Include specific references to materials (e.g. โครงสร้างเหล็กกัลวาไนซ์กันสนิมหนา 0.5 มม.), wind resistance, rainwater drainage, and durability certifications.
   - Maintain a highly professional, trustworthy, and authoritative tone (do not use generic marketing hyperbole like "มหัศจรรย์", "สุดยอด").
   - Explicitly mention the brand "${storeName}" and manufacturer/operator "${companyLegalName}" to bind local authority entities.
6. "attributes": You MUST use the predefined template keys listed above (copy them EXACTLY as written). Map extracted data into them. Only add NEW custom keys for data that doesn't fit any template key. ALL custom keys MUST be in Thai language — do NOT use English keys like "model", "accessories", "material", etc. For predefined template keys, keep them exactly as listed (even if they are English).

Return the response STRICTLY as a valid JSON object with the following keys exactly:
{
  "name": "Extracted product name or your best creative title",
  "sku": "Extracted SKU or model number, leave empty string if completely none",
  "price": number (the discounted or main selling price, e.g. 27900),
  "original_price": number (the original crossed-out price, e.g. 59000. If none, put null),
  "category": "Extracted category EXACTLY from the list provided",
  "seo_title": "A catchy, search-optimized title (max 60 characters)",
  "seo_description": "A compelling SEO meta description (max 160 characters)",
  "seo_keywords": "Comma-separated highly searched SEO keywords in Thai and English",
  "slug": "url-friendly-slug-in-english-or-thai-with-dashes",
  "llm_context": "Deep, factual, data-dense context in Thai for AI search engines (Perplexity, ChatGPT, Gemini). GEO-optimized: objective/factual tone, explicit structural specifications (size, thickness, lock mechanism, wind capacity), brand/company relationship mapping, and clear target use-cases. Avoid fluff or subjective marketing adjectives.",
  "description": "Premium, structured, and factual HTML content (no markdown ticks) using <h2>, <p>, <ul>, and <table> for specs. Relate brand '${storeName}' and '${companyLegalName}' with product details.",
  "short_description": "A very compelling short summary/subtitle (1-2 sentences)",
  "remarks": "Any special notes, conditions, or warnings mentioned in the text (if none, leave blank)",
  "attributes": [
    // USE EXACT template keys from the predefined list above!
    {"key": "(exact template key)", "value": "extracted value"}
  ],
  "faq": [
    // Generate 3-5 persuasive and highly factual FAQs directly answering voice and AI search queries (e.g., 'จัดส่งอย่างไร', 'ทนแดดทนฝนไหม', 'ต้องเตรียมพื้นอย่างไร')
    {"question": "คำถามที่พบบ่อย (เช่น มีบริการติดตั้งไหม?)", "answer": "คำตอบเชิงลึกและตรงประเด็น"}
  ],
  "size": "Extracted dimensions string (e.g. W240 x L246 x H240)",
  "weight_kg": number (extract if present, otherwise null),
  "width_cm": number (extract if present, otherwise null. If W240, put 240),
  "length_cm": number (extract if present, otherwise null. If L240, put 240),
  "height_cm": number (extract if present, otherwise null. If H240, put 240),
  "image_url": "Primary image URL if found in the text, otherwise empty",
  "images": ["Array of any other image URLs found in the text"],
  "badge_free_shipping": boolean (true if raw text mentions free shipping / ส่งฟรี),
  "badge_warranty": boolean (true if raw text mentions warranty / รับประกัน),
  "badge_installation": boolean (true if raw text mentions installation / ติดตั้งฟรี หรือบริการติดตั้ง),
  "badge_new": boolean (true if raw text mentions new / ใหม่),
  "badge_bestseller": boolean (true if raw text mentions best seller / ขายดี / ขายไปแล้วเยอะ)
}
        `;

        const response = await gemini.generateContent({
            prompt,
            label: 'Extract Product All'
        });

        let result;
        try {
            result = gemini.parseJsonResponse(response.text);
            
            // Fix literal newlines in description and context fields that might break CKEditor
            const cleanText = (text) => {
                if (!text || typeof text !== 'string') return text;
                // Remove leading or trailing literal quotes if Gemini added them by mistake
                let fixed = text.replace(/^"|"$/g, '').trim();
                fixed = fixed.replace(/\\n/g, '<br/>');
                // If there are no HTML tags, convert regular newlines to <br/>
                if (!fixed.match(/<p>|<div>|<ul>|<li>|<h2>|<h3>/i)) {
                    fixed = fixed.replace(/\n/g, '<br/>');
                }
                return fixed;
            };

            if (result.description) result.description = cleanText(result.description);
            if (result.short_description) result.short_description = cleanText(result.short_description);
            if (result.llm_context) result.llm_context = cleanText(result.llm_context);

        } catch (parseError) {
            console.error('AI JSON parse error:', parseError, 'Raw:', response.text.substring(0, 500));
            return res.status(500).json({ success: false, error: 'AI ส่งข้อมูลกลับมาในรูปแบบที่ไม่ถูกต้อง กรุณาลองใหม่' });
        }

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('AI Extract Product error:', error);
        const statusCode = error.statusCode || 500;
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
