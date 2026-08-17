const https = require('https');

function checkUrl(urlPath) {
  return new Promise((resolve) => {
    const req = https.get(`https://xn--12cfj6ce1b3axad7f3ae7cub7e7hud0c4a2g.com${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n=== Testing ${urlPath} ===`);
        console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
        console.log(`Full Body:\n${data}`);
        resolve();
      });
    });
    req.on('error', (e) => {
      console.error(`Request error on ${urlPath}:`, e.message);
      resolve();
    });
  });
}

async function main() {
  await checkUrl('/api/health');
  await checkUrl('/api/settings/public');
}

main();
