// scripts/test_image_scenario_50kg.js
// Automated verification for Image Scenario 50kg (60,000 DT)
// Reconciles and materializes reserve feed stock to eliminate empty modal & desynchronization

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('======================================================================');
console.log('🧪 TEST SUITE: FERMEGEST PRO - IMAGE SCENARIO 50.0 KG (60,000 DT)');
console.log('======================================================================\n');

// 1. Setup Mock DOM and Environment
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
  documentElement: {
    setAttribute: () => {},
    getAttribute: () => 'fr'
  },
  getElementById: (id) => {
    if (!domElements[id]) {
      domElements[id] = createMockElement(id);
    }
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

// Load supabase-client.js
const sbPath = path.join(__dirname, '..', 'supabase-client.js');
require(sbPath);
const appAuth = window.appAuth;

// Load app.js
const appJsPath = path.join(__dirname, '..', 'app.js');
let appJsCode = fs.readFileSync(appJsPath, 'utf8');
appJsCode = appJsCode.replace(/app\.init\(\);/g, "// no init");
appJsCode = appJsCode.replace('const app = {', 'global.app = {');
eval(appJsCode);

// Mock UI rendering methods that depend on extensive HTML structures
global.app.renderAll = () => {};
global.app.renderExpensesTable = () => {};
global.app.showToast = () => {};
global.app.closeModal = () => {};
global.app.updateLivestockUIThemeAndVisibility = () => {};
global.app.renderEggProductionChart = () => {};
global.app.renderEggStock = () => {};
global.app.renderFarmFeedSummary = () => {};

// -----------------------------------------------------------------------------------------
// TEST 1: sanitizeFeedTypes immediately materializes 50kg (60,000 DT) when feedTypes is empty
// -----------------------------------------------------------------------------------------
console.log('--- TEST 1: sanitizeFeedTypes materializes 50.0 kg / 60,000 DT feed from global stock ---');
window.appState.feedStockKg = 50.0;
window.appState.feedStockCostPerKg = 1.2; // 50kg * 1.2 DT = 60.000 DT
window.appState.feedTypes = [];
window.appState.lang = 'fr';

const sanitized = global.app.sanitizeFeedTypes(window.appState.feedTypes);

console.log('Sanitized feed types count:', sanitized.length);
assert.strictEqual(sanitized.length, 1, 'Must materialize exactly 1 feed type from the 50kg global stock!');
const matFeed = sanitized[0];
console.log(`Materialized Feed: "${matFeed.name}", Stock: ${matFeed.stockKg} kg, Price: ${matFeed.pricePerKg} DT/kg`);
assert.strictEqual(matFeed.stockKg, 50.0, 'Materialized feed must have exactly 50.0 kg!');
assert.strictEqual(matFeed.pricePerKg, 1.2, 'Materialized feed must have unit price 1.200 DT/kg!');
const valCalc = matFeed.stockKg * matFeed.pricePerKg;
assert.strictEqual(valCalc, 60.0, 'Materialized feed total value must equal 60,000 DT!');
assert.strictEqual(window.appState.feedStockKg, 50.0, 'appState.feedStockKg must remain 50.0 kg!');
console.log('✔ TEST 1 PASSED: sanitizeFeedTypes correctly materialized the full 50kg / 60,000 DT feed!\n');

// -----------------------------------------------------------------------------------------
// TEST 2: renderFeedStockAdjustModal does NOT show empty state, renders 50.0 kg & 60,000 DT
// -----------------------------------------------------------------------------------------
console.log('--- TEST 2: renderFeedStockAdjustModal displays card with 50.0 kg & 60,000 DT ---');
// Prepare DOM containers for the modal
const adjustContainer = document.getElementById('feedStockTypesContainer');
const totalKgDisplay = document.getElementById('stockAdjustTotalKgDisplay');
const totalValDisplay = document.getElementById('stockAdjustTotalValDisplay');

// Simulate state matching the screenshot: feedStockKg = 50, but feedTypes desynchronized/empty
window.appState.feedStockKg = 50.0;
window.appState.feedStockCostPerKg = 1.2;
window.appState.feedTypes = [];

global.app.renderFeedStockAdjustModal();

console.log('Container HTML length:', adjustContainer.innerHTML.length);
console.log('Total Kg Display Text:', totalKgDisplay.textContent);
console.log('Total Val Display Text:', totalValDisplay.textContent);

// Verify that the empty state message is NOT shown
assert.ok(!adjustContainer.innerHTML.includes('Aucun aliment actuellement enregistré dans le stock en réserve'),
  'Modal must NOT display the empty state message when feedStockKg is 50.0 kg!');
assert.ok(!adjustContainer.innerHTML.includes('📭'), 'Modal must not contain empty box icon!');

// Verify that the materialized feed card is rendered
assert.ok(adjustContainer.innerHTML.includes('Aliment complet') || adjustContainer.innerHTML.includes('feed-stock-'),
  'Modal must render the feed card for Aliment complet!');
assert.ok(adjustContainer.innerHTML.includes('50.0'), 'Modal must render 50.0 kg input value!');

// Verify summary displays
assert.strictEqual(totalKgDisplay.textContent, '50.0 kg', 'Summary must show 50.0 kg!');
assert.ok(totalValDisplay.textContent.includes('60,000') || totalValDisplay.textContent.includes('60.000'),
  'Summary must show 60,000 DT valuation!');
console.log('✔ TEST 2 PASSED: renderFeedStockAdjustModal rendered the complete 50.0 kg / 60,000 DT card!\n');

// -----------------------------------------------------------------------------------------
// TEST 3: renderFeedDistributionModal enables immediate distribution of the 50kg feed
// -----------------------------------------------------------------------------------------
console.log('--- TEST 3: renderFeedDistributionModal allows immediate distribution ---');
const distribContainer = document.getElementById('feedDistribItemsContainer');
const submitBtn = document.getElementById('feedDistribSubmitBtn');
const presetsContainer = document.getElementById('feedSmartPresetsContainer');
const totalsCard = document.getElementById('feedDistribTotalsCard');

// State with 50kg feed
window.appState.feedStockKg = 50.0;
window.appState.feedStockCostPerKg = 1.2;
window.appState.feedTypes = [];

global.app.renderFeedDistributionModal();

console.log('Distrib Container HTML length:', distribContainer.innerHTML.length);
assert.ok(!distribContainer.innerHTML.includes('Aucun aliment disponible en réserve pour la distribution'),
  'Distribution modal must NOT show empty distribution warning!');
assert.ok(distribContainer.innerHTML.includes('50.0 kg') || distribContainer.innerHTML.includes('50.0'),
  'Distribution modal must show 50.0 kg in stock badge!');
assert.strictEqual(submitBtn.style.display, 'block', 'Submit distribution button must be visible (block)!');
console.log('✔ TEST 3 PASSED: renderFeedDistributionModal renders ready-to-distribute feed!\n');

// -----------------------------------------------------------------------------------------
// TEST 4: handleSaveFeedStockAdjustment saves accurately and NEVER resets to 0
// -----------------------------------------------------------------------------------------
console.log('--- TEST 4: handleSaveFeedStockAdjustment preserves 50.0 kg without resetting to 0 ---');
// Mock input elements in DOM
const ftId = window.appState.feedTypes[0].id;
const stockInp = document.getElementById(`stockKg_${ftId}`);
const priceInp = document.getElementById(`priceKg_${ftId}`);
stockInp.value = '50.0';
priceInp.value = '1.20';

global.app.handleSaveFeedStockAdjustment({ preventDefault: () => {} });

console.log('appState.feedStockKg after save:', window.appState.feedStockKg);
console.log('appState.feedStockCostPerKg after save:', window.appState.feedStockCostPerKg);
assert.strictEqual(window.appState.feedStockKg, 50.0, 'feedStockKg must remain 50.0 kg after saving!');
assert.strictEqual(window.appState.feedStockCostPerKg, 1.2, 'feedStockCostPerKg must remain 1.2 after saving!');
assert.strictEqual(window.appState.feedTypes[0].stockKg, 50.0, 'feedTypes[0].stockKg must remain 50.0 kg!');
assert.strictEqual(window.appState.feedTypes[0].isClosed, false, 'Feed must not be closed!');
console.log('✔ TEST 4 PASSED: handleSaveFeedStockAdjustment preserved 50.0 kg and 60 DT valuation!\n');

// -----------------------------------------------------------------------------------------
// TEST 5: supabase-client.js Cloud Sync without dissociation
// -----------------------------------------------------------------------------------------
console.log('--- TEST 5: supabase-client.js Cloud Sync protects and materializes stock ---');

// Case 5A: Incoming cloud has 50kg, local was 0 / empty
console.log('  Case 5A: Cloud has 50kg global stock, local device merges cleanly');
const localEmpty = {
  feedStockKg: 0,
  feedStockCostPerKg: 0,
  feedStockUpdatedAt: 100,
  feedTypes: [],
  feedDistributions: [],
  expenses: [],
  animals: [],
  lastUpdated: 100
};

const cloud50kg = {
  feedStockKg: 50.0,
  feedStockCostPerKg: 1.2,
  feedStockUpdatedAt: 500,
  feedTypes: [],
  feedDistributions: [],
  expenses: [],
  animals: [],
  lastUpdated: 500
};

appAuth.applyCloudData.call({
  getAppState: () => localEmpty,
  mergeCollections: appAuth.mergeCollections.bind(appAuth),
  getDeletedIds: () => new Set()
}, cloud50kg, true);

console.log('Local after 5A merge - feedStockKg:', localEmpty.feedStockKg, 'feedTypes count:', localEmpty.feedTypes.length);
assert.strictEqual(localEmpty.feedStockKg, 50.0, 'Local feedStockKg must be updated to 50.0 kg from cloud!');
assert.strictEqual(localEmpty.feedTypes.length, 1, 'Local feedTypes must materialize 1 feed type!');
assert.strictEqual(localEmpty.feedTypes[0].stockKg, 50.0, 'Materialized feed must have 50.0 kg!');
assert.strictEqual(localEmpty.feedTypes[0].pricePerKg, 1.2, 'Materialized feed must have 1.2 DT/kg!');

// Case 5B: Local has 50kg, cloud has feedTypes with 0kg
console.log('  Case 5B: Local has 50kg, cloud has uninitialized 0kg feedTypes');
const local50kg = {
  feedStockKg: 50.0,
  feedStockCostPerKg: 1.2,
  feedStockUpdatedAt: 1000,
  feedTypes: [{ id: 'feed-uninit', name: 'Aliment complet', stockKg: 0 }],
  feedDistributions: [],
  expenses: [],
  animals: [],
  lastUpdated: 1000
};

const cloudUninit = {
  feedStockKg: null,
  feedStockUpdatedAt: 500,
  feedTypes: [{ id: 'feed-uninit', name: 'Aliment complet', stockKg: 0 }],
  feedDistributions: [],
  expenses: [],
  animals: [],
  lastUpdated: 500
};

appAuth.applyCloudData.call({
  getAppState: () => local50kg,
  mergeCollections: appAuth.mergeCollections.bind(appAuth),
  getDeletedIds: () => new Set()
}, cloudUninit, true);

console.log('Local after 5B merge - feedStockKg:', local50kg.feedStockKg, 'feedTypes[0].stockKg:', local50kg.feedTypes[0].stockKg);
assert.strictEqual(local50kg.feedStockKg, 50.0, 'Local 50kg must NOT be crushed to 0kg!');
assert.strictEqual(local50kg.feedTypes[0].stockKg, 50.0, 'Feed type stock must be reconciled to 50.0 kg!');

console.log('✔ TEST 5 PASSED: supabase-client.js never dissociates nor empties feed stocks!\n');

console.log('======================================================================');
console.log('🎉 ALL 5 TEST SCENARIOS PASSED 100% WITH ZERO REGRESSIONS!');
console.log('======================================================================');
