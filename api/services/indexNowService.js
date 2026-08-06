const fs = require('fs');
const path = require('path');

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'morespace2026indexnowkey8888';

/**
 * Ensure the IndexNow key verification file exists in the public directory
 */
const ensureKeyFile = () => {
    try {
        const publicDir = path.join(__dirname, '../public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        const keyFilePath = path.join(publicDir, `${INDEXNOW_KEY}.txt`);
        if (!fs.existsSync(keyFilePath)) {
            fs.writeFileSync(keyFilePath, INDEXNOW_KEY, 'utf8');
        }
    } catch (e) {
        console.error('[IndexNow] Failed to ensure key file:', e.message);
    }
};

/**
 * Send instant IndexNow ping to Bing, Yandex, Naver, and Seznam
 */
const notifyIndexNow = async (urls = []) => {
    ensureKeyFile();
    if (!urls || urls.length === 0) return { success: false, message: 'No URLs provided' };

    try {
        const firstUrl = urls[0];
        const urlObj = new URL(firstUrl);
        const host = urlObj.host;
        const protocol = urlObj.protocol;

        const payload = {
            host: host,
            key: INDEXNOW_KEY,
            keyLocation: `${protocol}//${host}/${INDEXNOW_KEY}.txt`,
            urlList: urls
        };

        const res = await fetch('https://api.indexnow.org/indexnow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(payload)
        });

        console.log(`🚀 IndexNow Bing Ping Sent for ${urls.length} URLs (Host: ${host}, Status: ${res.status})`);
        return { success: res.status === 200 || res.status === 202, status: res.status };
    } catch (e) {
        console.error('[IndexNow] Ping Failed:', e.message);
        return { success: false, error: e.message };
    }
};

module.exports = { INDEXNOW_KEY, ensureKeyFile, notifyIndexNow };
