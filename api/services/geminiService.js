const { Agent, setGlobalDispatcher } = require('undici');
setGlobalDispatcher(new Agent({
    headersTimeout: 120000, // 2 minutes to allow long Gemini AI responses
    bodyTimeout: 240000,    // 4 minutes
}));

const db = require('../config/database');
const { GoogleGenAI } = require('@google/genai');

// In-memory tracking of failed keys to avoid retrying them within a short window
const failedKeys = new Map(); // key -> { timestamp, reason }
const FAILED_KEY_COOLDOWN = 60000; // 1 minute cooldown for failed keys

// Hardcoded fallback models if database settings are empty or fail to load
const BACKUP_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'เสถียร คุ้มค่า แนะนำ', tier: 'recommended' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'ความเร็วสูง', tier: 'recommended' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'โมเดลหลัก', tier: 'stable' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'ขั้นสูง เหมาะงานซับซ้อน', tier: 'premium' },
];

/**
 * Get available models from database. Fallbacks to BACKUP_MODELS.
 */
async function getAvailableModels() {
    try {
        const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['gemini_available_models']);
        if (rows.length > 0 && rows[0].setting_value) {
            const parsed = JSON.parse(rows[0].setting_value);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.warn('[GeminiService] Failed to load available models from DB, using fallback list:', e.message);
    }
    return BACKUP_MODELS;
}

/**
 * Get default models for fallback chain.
 */
async function getDefaultModels() {
    const models = await getAvailableModels();
    const ids = models.map(m => m.id);
    return ids.length > 0 ? ids : ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
}

/**
 * Get all available Gemini API keys from the database.
 * Supports comma-separated keys in the `gemini_api_key` setting.
 * @returns {Promise<string[]>} Array of API keys
 */
async function getApiKeys() {
    const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['gemini_api_key']);
    if (rows.length === 0 || !rows[0].setting_value) {
        return [];
    }

    // Support comma-separated keys
    const keys = rows[0].setting_value
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

    // Filter out recently failed keys (but keep at least one to try)
    const now = Date.now();
    const availableKeys = keys.filter(k => {
        const failed = failedKeys.get(k);
        return !failed || (now - failed.timestamp) > FAILED_KEY_COOLDOWN;
    });

    return availableKeys.length > 0 ? availableKeys : keys;
}

/**
 * Mark an API key as temporarily failed
 */
function markKeyFailed(apiKey, reason = 'unknown') {
    failedKeys.set(apiKey, { timestamp: Date.now(), reason });
}

/**
 * Check if an error is a quota/rate limit/unavailable error that should trigger key rotation
 */
function getErrorType(error) {
    const msg = (error?.message || error?.toString() || '').toLowerCase();
    const status = error?.status || error?.code || 0;
    
    if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('too many requests')) {
        return 'QUOTA';
    }
    if (status === 503 || msg.includes('503') || msg.includes('resource exhausted') || msg.includes('unavailable') || msg.includes('high demand') || msg.includes('overloaded')) {
        return 'UNAVAILABLE';
    }
    return 'OTHER';
}

/**
 * Get preferred models from DB settings, with fallback chain.
 * @returns {Promise<string[]>} Ordered list of models to try
 */
async function getPreferredModels() {
    const defaults = await getDefaultModels();
    try {
        const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['gemini_preferred_model']);
        if (rows.length > 0 && rows[0].setting_value) {
            const preferred = rows[0].setting_value.trim();
            // Build fallback chain: preferred model first, then defaults (excluding preferred to avoid duplication)
            const fallbacks = defaults.filter(m => m !== preferred);
            return [preferred, ...fallbacks];
        }
    } catch (e) {
        console.warn('[GeminiService] Failed to read preferred model from DB, using defaults:', e.message);
    }
    return defaults;
}

/**
 * Get the status of all API keys (for admin dashboard).
 * @returns {Promise<Object>} Key status summary
 */
async function getKeyStatus() {
    const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', ['gemini_api_key']);
    if (rows.length === 0 || !rows[0].setting_value) {
        return { total: 0, active: 0, cooldown: 0, keys: [] };
    }

    const allKeys = rows[0].setting_value
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

    const now = Date.now();
    const keyDetails = allKeys.map((key, index) => {
        const masked = key.substring(0, 6) + '...' + key.substring(key.length - 4);
        const failed = failedKeys.get(key);
        const isCooldown = failed && (now - failed.timestamp) <= FAILED_KEY_COOLDOWN;
        const cooldownRemaining = isCooldown ? Math.ceil((FAILED_KEY_COOLDOWN - (now - failed.timestamp)) / 1000) : 0;

        return {
            index: index + 1,
            masked,
            status: isCooldown ? 'cooldown' : 'active',
            reason: isCooldown ? failed.reason : null,
            cooldownRemaining // seconds remaining
        };
    });

    return {
        total: allKeys.length,
        active: keyDetails.filter(k => k.status === 'active').length,
        cooldown: keyDetails.filter(k => k.status === 'cooldown').length,
        keys: keyDetails
    };
}

/**
 * Execute a Gemini AI request with automatic key rotation and model fallback.
 * 
 * @param {Object} options
 * @param {string} [options.prompt] - The text prompt to send (simple string mode)
 * @param {Array} [options.contents] - Full contents array for multi-turn conversations
 * @param {string} [options.responseMimeType='application/json'] - Response MIME type
 * @param {string[]} [options.models] - Models to try in order (if not provided, reads from DB settings)
 * @param {string} [options.label='AI Request'] - Label for logging
 * @returns {Promise<{text: string, model: string, keyIndex: number}>} The response text and metadata
 */
async function generateContent(options) {
    const {
        prompt,
        contents,
        responseMimeType = 'application/json',
        models,
        label = 'AI Request'
    } = options;

    // Get models to try: explicit > DB setting > defaults
    const modelsToTry = models || await getPreferredModels();

    const apiKeys = await getApiKeys();
    if (apiKeys.length === 0) {
        throw new Error('Gemini API Key ยังไม่ได้ตั้งค่า กรุณาไปที่หน้าตั้งค่าเพื่อเพิ่ม API Key');
    }

    // Build the contents payload
    let contentPayload;
    if (contents) {
        // Multi-turn conversation mode
        contentPayload = contents;
    } else if (prompt) {
        // Simple prompt mode
        contentPayload = prompt;
    } else {
        throw new Error('Either prompt or contents must be provided');
    }

    let lastError = null;

    // Try each key with each model
    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
        const apiKey = apiKeys[keyIndex];
        const ai = new GoogleGenAI({ apiKey });

        for (const modelName of modelsToTry) {
            try {
                console.log(`[${label}] Key #${keyIndex + 1}/${apiKeys.length}, Model: ${modelName}`);

                const requestConfig = {
                    model: modelName,
                    contents: contentPayload,
                };

                // Only add config with responseMimeType for non-contents (simple prompt) mode
                // Multi-turn conversations shouldn't force JSON response type
                if (!contents) {
                    requestConfig.config = { responseMimeType };
                }

                // Add a strict timeout to prevent the SDK from retrying for minutes
                let timeoutId;
                const timeoutPromise = new Promise((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error('TIMEOUT_EXCEEDED: Model took too long to respond'));
                    }, 50000); // 50 seconds max per attempt to allow full article generation
                });

                let response;
                try {
                    response = await Promise.race([
                        ai.models.generateContent(requestConfig),
                        timeoutPromise
                    ]);
                } finally {
                    clearTimeout(timeoutId);
                }

                if (response && response.text) {
                    console.log(`[${label}] ✅ Success with Key #${keyIndex + 1}, Model: ${modelName}`);
                    return {
                        text: response.text,
                        model: modelName,
                        keyIndex: keyIndex
                    };
                }
            } catch (error) {
                console.warn(`[${label}] ❌ Key #${keyIndex + 1} + ${modelName} failed:`, error.message || error);
                lastError = error;

                const errType = getErrorType(error);
                if (errType === 'QUOTA') {
                    markKeyFailed(apiKey, error.message?.substring(0, 100) || 'quota/rate limit');
                    // Skip remaining models for this key, try next key
                    break;
                }
                if (errType === 'UNAVAILABLE') {
                    // Just model is unavailable (503 High Demand), but key might be fine.
                    // Continue to try the next model on the SAME KEY.
                    continue;
                }
                // For non-quota errors (e.g. invalid prompt), try next model but same key
            }
        }
    }

    // All keys and models exhausted
    if (lastError) {
        if (getErrorType(lastError) === 'QUOTA' || getErrorType(lastError) === 'UNAVAILABLE') {
            const err = new Error('API Key ทั้งหมดถูกจำกัดการใช้งาน (Quota/Rate Limit) กรุณารอสักครู่แล้วลองใหม่ หรือเพิ่ม API Key ใหม่ในหน้าตั้งค่า');
            err.statusCode = 429;
            throw err;
        }
        throw lastError;
    }

    throw new Error('AI ไม่สามารถสร้างผลลัพธ์ได้ กรุณาลองใหม่อีกครั้ง');
}

/**
 * Parse JSON response from Gemini, with cleanup of markdown blocks
 */
function parseJsonResponse(text) {
    const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleaned);
}

module.exports = {
    getApiKeys,
    generateContent,
    parseJsonResponse,
    getPreferredModels,
    getKeyStatus,
    getAvailableModels
};
