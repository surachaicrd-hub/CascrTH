const db = require('./config/database');
const gemini = require('./services/geminiService');

async function runTest() {
    try {
        const productId = 'f19aa1a8-31aa-4bd9-ae5e-06be44c918e5';
        const style = 'educational';
        const additionalPrompt = '';

        console.log("Fetching product from DB...");
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
        if (products.length === 0) {
            console.error("Product not found in DB!");
            process.exit(1);
        }

        const p = products[0];
        const productCategory = p.category || 'ทั่วไป';
        
        let attrText = '';
        try {
            const attrs = JSON.parse(p.attributes || '[]');
            attrText = attrs.map(a => `${a.key}: ${a.value}`).join(', ');
        } catch (e) {
            console.warn("Could not parse product attributes:", e.message);
        }

        const productInfo = `
ข้อมูลสินค้าอ้างอิง:
- ชื่อ: ${p.name}
- SKU: ${p.sku || '-'}
- หมวดหมู่: ${p.category || '-'}
- ราคา: ${p.price ? Number(p.price).toLocaleString() + ' บาท' : 'สอบถาม'}
- ราคาเดิม: ${p.original_price ? Number(p.original_price).toLocaleString() + ' บาท' : '-'}
- ขนาด: ${p.size || '-'}
- รายละเอียดสั้น: ${p.short_description || '-'}
- รายละเอียดเพิ่มเติม: ${p.llm_context || p.description || '-'}
- Badges: ${[p.badge_free_shipping && 'ส่งฟรี', p.badge_warranty && 'รับประกัน', p.badge_installation && 'ติดตั้ง', p.badge_new && 'ใหม่', p.badge_bestseller && 'ขายดี'].filter(Boolean).join(', ') || '-'}
- FAQ: ${p.faq ? JSON.stringify(p.faq) : '-'}
`.trim();

        // Style-specific prompts
        const stylePrompts = {
            educational: {
                name: 'ให้ความรู้',
                prompt: `เขียนบทความให้ความรู้แบบเชิงลึก อธิบายข้อมูลอย่างละเอียด ใช้ภาษาเข้าใจง่าย เป็นกันเอง มีหัวข้อย่อยชัดเจน ให้ข้อมูลที่ผู้อ่านนำไปใช้ได้จริง ความยาว 800-1200 คำ`
            }
        };

        const selectedStyle = stylePrompts[style];

        const systemPrompt = `คุณเป็นนักเขียนบทความมืออาชีพสำหรับบริษัทจำหน่ายบ้านเก็บของสำเร็จรูป ตู้เก็บของ และโกดังเก็บของ

สไตล์การเขียน: ${selectedStyle.name}
${selectedStyle.prompt}

${productInfo}
${additionalPrompt ? '\nคำแนะนำเพิ่มเติม: ' + additionalPrompt : ''}

กรุณาตอบเป็น JSON format เท่านั้น ไม่ต้องมี markdown code block ห่อ:
{
  "title": "หัวข้อบทความ (SEO friendly ให้น่าสนใจ)",
  "excerpt": "สรุปเนื้อหาสั้นๆ 2-3 บรรทัด",
  "content": "เนื้อหาบทความเต็มเป็น HTML string. กฎเหล็ก: [1] ห้ามใช้ \\n ธรรมดา ให้ใช้แท็ก <p>...</p> หุ้มทุกย่อหน้าเพื่อแบ่งบรรทัดเสมอ [2] ใช้แท็ก <h2>, <h3> สำหรับหัวข้อ [3] ใช้ <ul><li> สำหรับหัวข้อย่อย [4] สำคัญมาก: ข้อมูลจำเพาะ วัสดุ หรือข้อเปรียบเทียบ ต้องถูกจัดรูปแบบด้วยแท็ก <table><tr><th><td> เสมอ เพื่อให้อ่านง่ายและสวยงาม",
  "seo_title": "SEO Title (60 ตัวอักษร)",
  "seo_description": "SEO Meta Description (160 ตัวอักษร)",
  "seo_keywords": "keyword1,keyword2,keyword3 (คั่นด้วย comma)",
  "tags": "tag1,tag2,tag3,tag4,tag5",
  "category": "หมวดหมู่ที่เหมาะ (เลือกจาก: ทั่วไป, บ้านเก็บของ, เคล็ดลับ, การดูแลรักษา, ข่าวสาร, โปรโมชั่น)",
  "llm_context": "ข้อความอธิบายบริบทสั้นๆ (2-3 ประโยค) เพื่อบอกให้ AI อื่นรู้ว่าหน้านี้เกี่ยวข้องกับอะไร",
  "image_prompt": "A descriptive, high-quality, photorealistic English prompt for an image generator (like Midjourney or DALL-E) representing the cover of this article. Keep it under 30 words. Format: 'A photorealistic image of [subject], 8k resolution, highly detailed'",
  "faq": [
    {
      "question": "คำถามที่ 1",
      "answer": "คำตอบที่ 1"
    }
  ]
}`;

        console.log("Calling Gemini service...");
        const response = await gemini.generateContent({
            prompt: systemPrompt,
            label: 'Article Generate Test'
        });

        console.log("Response text length:", response.text ? response.text.length : 0);
        
        let aiText = response.text || '';
        aiText = aiText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        aiText = aiText.replace(/[\n\r\t]+/g, ' ');

        console.log("Attempting to parse JSON...");
        const articleData = JSON.parse(aiText);
        console.log("Successfully parsed JSON! Title:", articleData.title);

    } catch (error) {
        console.error("DIAGNOSTIC ERROR DETECTED:", error);
    }
    process.exit();
}

runTest();
