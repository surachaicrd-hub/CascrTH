const https = require('https');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: data.substring(0, 500) });
                }
            });
        }).on('error', reject);
    });
}

async function checkLive() {
    const punycodeDomain = 'xn--12cfj6ce1b3axad7f3ae7cub7e7hud0c4a2g.com'; // เครื่องตัดปอกย้ำสายไฟ.com
    console.log('Fetching live settings from:', punycodeDomain);
    const settings = await fetchJson(`https://${punycodeDomain}/api/settings/public`);
    console.log('Live Settings Status:', settings.status);
    if (settings.data && settings.data.data) {
        const d = settings.data.data;
        console.log('store_logo:', d.store_logo);
        console.log('store_favicon:', d.store_favicon);
        console.log('store_name:', d.store_name);
        
        // Test fetching the logo image directly
        if (d.store_logo) {
            const logoRes = await new Promise(res => {
                https.get(`https://${punycodeDomain}${d.store_logo}`, r => res(r.statusCode)).on('error', () => res('error'));
            });
            console.log(`Live Logo (${d.store_logo}) HTTP Status:`, logoRes);
        }
        if (d.store_favicon) {
            const favRes = await new Promise(res => {
                https.get(`https://${punycodeDomain}${d.store_favicon}`, r => res(r.statusCode)).on('error', () => res('error'));
            });
            console.log(`Live Favicon (${d.store_favicon}) HTTP Status:`, favRes);
        }
    } else {
        console.log('Response:', settings);
    }
}

checkLive();
