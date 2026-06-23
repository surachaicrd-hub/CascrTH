const fs = require('fs');

const content = fs.readFileSync('frontend/src/pages/Home.vue', 'utf8');
const lines = content.split('\n');

console.log('Searching color values in Home.vue...');
lines.forEach((line, idx) => {
  if (line.includes('#ff7a00') || line.includes('#ff8c2a') || line.includes('#f07100') || line.includes('#f06200') || line.includes('#ff5c00')) {
    console.log('  Line ' + (idx + 1) + ': ' + line.trim());
  }
});
