const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require(path.join(__dirname, '..', 'api', 'node_modules', 'jsonwebtoken'));

const JWT_SECRET = 'CascrSecret2026ChangeThisToLongRandomText';
const adminToken = jwt.sign({ id: 1, email: 'admin@cascr.com', role: 'admin' }, JWT_SECRET);

async function testUpload() {
    console.log('Testing image upload API...');
    
    // Create a 1x1 dummy PNG buffer
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    const header = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="image"; filename="test_logo.png"\r\n` +
        `Content-Type: image/png\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, pngBuffer, footer]);

    const req = http.request({
        hostname: 'localhost',
        port: 8201,
        path: '/api/upload',
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length,
            'Authorization': `Bearer ${adminToken}`
        }
    }, (res) => {
        let respData = '';
        res.on('data', chunk => respData += chunk);
        res.on('end', () => {
            console.log(`Upload Response (${res.statusCode}):`, respData);
            try {
                const json = JSON.parse(respData);
                if (json.success && json.url) {
                    console.log('Verifying uploaded image URL via GET:', json.url);
                    http.get(`http://localhost:8201${json.url}`, (imgRes) => {
                        console.log(`GET ${json.url} Status:`, imgRes.statusCode, imgRes.headers['content-type']);
                        process.exit(imgRes.statusCode === 200 ? 0 : 1);
                    });
                }
            } catch (e) {
                console.error('Parse error:', e);
                process.exit(1);
            }
        });
    });

    req.on('error', err => {
        console.error('Request error:', err.message);
        process.exit(1);
    });

    req.write(body);
    req.end();
}

testUpload();
