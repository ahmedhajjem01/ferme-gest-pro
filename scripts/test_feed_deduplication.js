const fs = require('fs');
const path = require('path');

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] !== undefined ? store[k] : null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

const domElements = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    innerHTML: '',
    style: {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    },
    setAttribute() {},
    getAttribute() { return null; },
    removeAttribute() {},
    appendChild(child) { return child; },
    remove() {},
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null
  };
}

global.document = {
  documentElement: { setAttribute: () => {}, getAttribute: () => 'fr' },
  getElementById: (id) => {
    if (!domElements[id]) domElements[id] = createMockElement(id);
    return domElements[id];
  },
  querySelector: (sel) => {
    const idMatch = sel.match(/#([\w\-]+)/);
    if (idMatch) return document.getElementById(idMatch[1]);
    return createMockElement('sel_' + Math.random().toString(36).substr(2, 4));
  },
  querySelectorAll: () => [],
  createElement: (tag) => createMockElement('created_' + Math.random().toString(36).substr(2, 4), tag),
  addEventListener: () => {}
};

global.window = {
  addEventListener: () => {},
  location: { origin: 'http://localhost', pathname: '/' },
  appAuth: {
    getDeletedIds: () => new Set(),
    addDeletedId: () => {},
    removeDeletedId: () => {},
    pushData: () => {}
  }
};

// Load app.js without auto app.init()
const appJsPath = path.join(__dirname, '..', 'app.js');
let appJsCode = fs.readFileSync(appJsPath, 'utf8');
appJsCode = appJsCode.replace('const appState =', 'global.appState =');
appJsCode = appJsCode.replace(/app\.init\(\);/g, "// no init");
appJsCode = appJsCode.replace('const app = {', 'global.app = {');
eval(appJsCode);

console.log('='.repeat(70));
console.log('🧪 TEST SUITE: DEDUPLICATION CANONIQUE ET NETTOYAGE BANNIÈRE (SCÉNARIO 15 DOUBLONS)');
console.log('='.repeat(70));

// Setup initial corrupted state matching user screenshot
const corruptedFeedTypes = [
  { id: 'feed-orge-1', name: 'Orge', stockKg: 50.0, pricePerKg: 1.0, texture: 'grain' },
  { id: 'feed-ponte-active', name: 'Aliment ponte', stockKg: 50.0, pricePerKg: 1.2, texture: 'grain' }
];

// Add 15 ghost duplicates of 'Aliment ponte' with 0 kg
for (let i = 1; i <= 15; i++) {
  corruptedFeedTypes.push({
    id: `feed-ponte-ghost-${i}`,
    name: 'Aliment ponte',
    stockKg: 0.0,
    pricePerKg: 1.2,
    texture: 'grain'
  });
}
// Add legacy Bouchon variation
corruptedFeedTypes.push({
  id: 'feed-ponte-bouchon',
  name: 'Aliment ponte (Bouchon)',
  stockKg: 0.0,
  pricePerKg: 1.2,
  texture: 'grain'
});

appState.feedTypes = corruptedFeedTypes;
appState.feedStockKg = 100.0;
appState.expenses = [
  { id: 'exp-1', title: 'Achat Orge', feedTypeId: 'feed-orge-1', feedStockAddedKg: 50, total: 50 },
  { id: 'exp-2', title: 'Achat Aliment ponte', feedTypeId: 'feed-ponte-active', feedStockAddedKg: 50, total: 60 },
  { id: 'exp-3', title: 'Achat ponte ancien', feedTypeId: 'feed-ponte-ghost-5', feedStockAddedKg: 0, total: 0 }
];
appState.feedDistributions = [
  { id: 'dist-1', items: [{ feedTypeId: 'feed-ponte-ghost-3', name: 'Aliment ponte', kg: 5 }] }
];

console.log(`Initial feed count: ${appState.feedTypes.length} (expected 18 items)`);

// 1. Run sanitizeFeedTypes
const sanitized = app.sanitizeFeedTypes(appState.feedTypes);

console.log(`\n--- TEST 1: Canonical Deduplication to exact distinct types ---`);
console.log(`Sanitized feed count: ${sanitized.length}`);
sanitized.forEach(f => console.log(`  - ${f.name} (id: ${f.id}): ${f.stockKg} kg @ ${f.pricePerKg} DT/kg`));

if (sanitized.length === 2) {
  console.log('✔ TEST 1 PASSED: Exactly 2 distinct feeds remain (Orge and Aliment ponte)!');
} else {
  console.error(`❌ TEST 1 FAILED: Expected 2 feeds, got ${sanitized.length}`);
  process.exit(1);
}

console.log(`\n--- TEST 2: Preservation of total stock (100.0 kg) ---`);
const totalStock = sanitized.reduce((s, f) => s + f.stockKg, 0);
console.log(`Total stock: ${totalStock} kg (expected 100.0 kg)`);
if (totalStock === 100.0) {
  console.log('✔ TEST 2 PASSED: Total stock is strictly preserved at 100.0 kg!');
} else {
  console.error(`❌ TEST 2 FAILED: Expected 100.0 kg, got ${totalStock}`);
  process.exit(1);
}

console.log(`\n--- TEST 3: ID Redirection of Expenses and Distributions ---`);
console.log(`Expense 3 feedTypeId: ${appState.expenses[2].feedTypeId}`);
console.log(`Distribution item feedTypeId: ${appState.feedDistributions[0].items[0].feedTypeId}`);

const masterPonteId = sanitized.find(f => f.name.toLowerCase().includes('ponte')).id;
if (appState.expenses[2].feedTypeId === masterPonteId && appState.feedDistributions[0].items[0].feedTypeId === masterPonteId) {
  console.log('✔ TEST 3 PASSED: Orphaned feedTypeIds successfully remapped to Master ID!');
} else {
  console.error(`❌ TEST 3 FAILED: Redirection failed!`);
  process.exit(1);
}

console.log(`\n--- TEST 4: Dashboard Summary Banner Filtering of Depleted Feeds ---`);
// Inject an additional exhausted feed (e.g., 'Son de blé' with 0 kg)
sanitized.push({ id: 'feed-son-0', name: 'Son de blé', stockKg: 0.0, pricePerKg: 0.8 });
appState.feedTypes = sanitized;

const breakdownEl = document.getElementById('farmFeedLotsBreakdown');
app.renderFarmFeedSummary();

const bannerHtml = breakdownEl.innerHTML;
console.log('Generated Banner Snippet:\n', bannerHtml);

const containsZeroKg = bannerHtml.includes(': 0.0 kg') || bannerHtml.includes(': 0.0 كغ');
const containsOrge = bannerHtml.includes('Orge : 50.0 kg') || bannerHtml.includes('Orge : 50.0');
const containsPonte = bannerHtml.includes('Aliment ponte : 50.0 kg') || bannerHtml.includes('Aliment ponte : 50.0');

if (!containsZeroKg && containsOrge && containsPonte) {
  console.log('✔ TEST 4 PASSED: Banner displays ONLY active feeds (50kg Orge & 50kg Aliment ponte) with 0kg feeds strictly hidden!');
} else {
  console.error(`❌ TEST 4 FAILED: Banner contains invalid text! zeroKg: ${containsZeroKg}, orge: ${containsOrge}, ponte: ${containsPonte}`);
  process.exit(1);
}

console.log('\n🎉 ALL 4 DEDUPLICATION & BANNER TESTS PASSED 100%!');
