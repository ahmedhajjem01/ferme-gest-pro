const fs = require('fs');
const js = fs.readFileSync('app.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (l.includes('feedTypes') && (l.includes('=') || l.includes('push') || l.includes('default') || l.includes('new'))) {
    console.log((i+1) + ': ' + l.trim());
  }
});
