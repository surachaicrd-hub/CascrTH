const db = require('./config/database');
const { GoogleGenAI } = require('@google/genai');

async function run() {
    try {
        const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'gemini_api_key'");
        const apiKey = rows[0].setting_value.trim();
        const ai = new GoogleGenAI({ apiKey });

        const modelsToTest = [
            'gemini-2.5-flash-lite',
            'gemini-2.0-flash-lite',
            'gemini-2.0-flash-001',
            'gemini-3.1-flash-lite',
            'gemini-3-flash-preview',
            'gemini-2.5-flash',
            'gemini-2.5-pro'
        ];

        for (const model of modelsToTest) {
            const start = Date.now();
            console.log(`Testing model: ${model}...`);
            try {
                const response = await ai.models.generateContent({
                    model: model,
                    contents: 'Say only the word Hello in English',
                    config: { responseMimeType: 'text/plain' }
                });
                const duration = ((Date.now() - start) / 1000).toFixed(2);
                console.log(`✅ Success for ${model}: "${response.text.trim()}" in ${duration}s`);
            } catch (err) {
                const duration = ((Date.now() - start) / 1000).toFixed(2);
                console.log(`❌ Failed for ${model} after ${duration}s: ${err.message}`);
            }
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
    process.exit();
}

run();
