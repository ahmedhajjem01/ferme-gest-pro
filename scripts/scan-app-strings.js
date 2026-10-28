const fs = require('fs');
const appJs = fs.readFileSync('app.js', 'utf8');

console.log('=== DYNAMIC STRINGS CHECK IN APP.JS ===');

const lines = appJs.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('this.showToast(')) {
    if (!line.includes('this.t(') && !line.includes('isAr') && !line.includes('lang') && !line.includes('toastMsg')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
  if (line.includes('this.confirmDialog(')) {
    // print line
    const snippet = lines.slice(idx, idx + 8).join(' ');
    if (!snippet.includes('isAr') && !snippet.includes('this.t(') && !snippet.includes('lang')) {
      console.log(`Line ${idx + 1} Confirm: ${line.trim()}`);
    }
  }
});

