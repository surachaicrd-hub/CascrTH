const http = require('http');

const API_URL = 'http://localhost:3000/api';

const tests = [
    // 1. Unprotected routes shouldn't require auth
    { name: 'GET Public Products', url: '/products', method: 'GET', expectedStatus: 200 },
    { name: 'GET Settings', url: '/settings', method: 'GET', expectedStatus: 200 },

    // 2. Protected routes MUST require auth (and fail without it)
    { name: 'POST Product (No Auth)', url: '/products', method: 'POST', body: '{}', expectedStatus: 403 },
    { name: 'PUT Product (No Auth)', url: '/products/1', method: 'PUT', body: '{}', expectedStatus: 403 },
    { name: 'DELETE Product (No Auth)', url: '/products/1', method: 'DELETE', expectedStatus: 403 },

    { name: 'POST Category (No Auth)', url: '/categories', method: 'POST', body: '{}', expectedStatus: 403 },
    { name: 'PUT Category (No Auth)', url: '/categories/1', method: 'PUT', body: '{}', expectedStatus: 403 },
    { name: 'DELETE Category (No Auth)', url: '/categories/1', method: 'DELETE', expectedStatus: 403 },

    { name: 'POST Settings (No Auth)', url: '/settings/batch', method: 'POST', body: '{}', expectedStatus: 403 },

    { name: 'POST Upload (No Auth)', url: '/upload', method: 'POST', body: '{}', expectedStatus: 403 },
];

async function runTest(test) {
    return new Promise((resolve) => {
        const options = {
            method: test.method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(API_URL + test.url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const passed = res.statusCode === test.expectedStatus;
                if (passed) {
                    console.log(`✅ PASS: ${test.name} (Got ${res.statusCode})`);
                } else {
                    console.error(`❌ FAIL: ${test.name} (Expected ${test.expectedStatus}, Got ${res.statusCode}) - Response: ${data}`);
                }
                resolve(passed);
            });
        });

        req.on('error', (e) => {
            console.error(`❌ ERROR: ${test.name} - ${e.message}`);
            resolve(false);
        });

        if (test.body) {
            req.write(test.body);
        }
        req.end();
    });
}

async function runAll() {
    console.log("Starting Security Audit Tests...");
    console.log("----------------------------------");
    let passedCount = 0;
    for (const test of tests) {
        const passed = await runTest(test);
        if (passed) passedCount++;
    }

    console.log("----------------------------------");
    console.log(`Results: ${passedCount} / ${tests.length} tests passed.`);

    if (passedCount === tests.length) {
        console.log("🎉 ALL SECURITY TESTS PASSED!");
        process.exit(0);
    } else {
        console.error("⚠️ SOME TESTS FAILED. Please review the output above.");
        process.exit(1);
    }
}

runAll();
