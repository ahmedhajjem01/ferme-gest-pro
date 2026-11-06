const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

console.log('=== AUDIT 1: ALL TABS IN INDEX.HTML ===');
// Find all data-tab attributes
const tabMatches = html.match(/data-tab=\"([^\"]+)\"/g) || [];
const tabs = new Set(tabMatches.map(m => m.replace(/data-tab=\"|\"/g, '')));
console.log('Found navigation tabs:', Array.from(tabs));

// Check corresponding sections
tabs.forEach(tab => {
  const sectionId = tab.startsWith('tab-') ? tab : ('tab-' + tab);
  const exists = html.includes(`id="${sectionId}"`) || html.includes(`id="${tab}"`);
  console.log(`Tab [${tab}] -> section [${sectionId}] exists: ${exists ? '✔ YES' : '❌ NO'}`);
});

console.log('\n=== AUDIT 2: ALL BUTTONS & ONCLICK HANDLERS ===');
const onclickRegex = /onclick="([^"]+)"/g;
let match;
const handlers = new Set();
while ((match = onclickRegex.exec(html)) !== null) {
  handlers.add(match[1].trim());
}
console.log('Found unique onclick handlers:', handlers.size);

let missingHandlers = 0;
handlers.forEach(h => {
  // Extract function call: app.openModal('modalAddSale') -> openModal
  const appCallMatch = h.match(/app\.([a-zA-Z0-9_]+)\s*\(/);
  if (appCallMatch) {
    const fnName = appCallMatch[1];
    // Check if function exists in app.js
    const fnExists = js.includes(`${fnName}(`) || js.includes(`${fnName} (`) || js.includes(`${fnName}:`);
    if (!fnExists) {
      console.error(`❌ Missing method in app.js: app.${fnName} (from handler: "${h}")`);
      missingHandlers++;
    }
  }
});

if (missingHandlers === 0) {
  console.log('✔ ALL app.* onclick handlers mapped cleanly to actual methods in app.js!');
}

console.log('\n=== AUDIT 3: ALL MODALS & FORMS ===');
const modalMatches = html.match(/id="(modal[a-zA-Z0-9]+)"/g) || [];
const modals = modalMatches.map(m => m.replace(/id="|"/g, ''));
console.log('Found modals in index.html (' + modals.length + '):', modals);

const formMatches = html.match(/id="(form[a-zA-Z0-9]+)"/g) || [];
const forms = formMatches.map(m => m.replace(/id="|"/g, ''));
console.log('Found forms in index.html (' + forms.length + '):', forms);
