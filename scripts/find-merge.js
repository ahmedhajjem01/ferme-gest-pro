const fs = require('fs');
const js = fs.readFileSync('supabase-client.js', 'utf8');
const lines = js.split('\n');
lines.forEach((l, i) => {
  if (l.includes('mergeCollections')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
