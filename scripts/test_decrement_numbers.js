// scratch/test_decrement_numbers.js
// Verification that egg stock and feed stock properly decrease and NEVER artificially rebound

const assert = require('assert');

// Mock localStorage
const store = {};
const localStorage = {
  getItem: (k) => store[k] !== undefined ? store[k] : null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.localStorage = localStorage;

// 1. Load supabase-client.js
global.window = {
  location: { origin: 'http://localhost', pathname: '/' }
};
global.document = {
  documentElement: { setAttribute: () => {}, getAttribute: () => 'fr' },
  getElementById: () => null,
  querySelectorAll: () => []
};

require('../supabase-client.js');
const appAuth = window.appAuth;

console.log('=== TEST SUITE: DECREASING NUMBERS (EGGS & FEED STOCK) ===');

// --- SCENARIO 1: Egg Consumption Decrement & Sync Preservation ---
console.log('--- TEST 1: Egg Consumption Decreases Stock & Stays Decreased ---');
let phoneEggState = {
  eggStock: 50,
  eggStocks: { poule: 50 },
  eggHarvests: [],
  eggConsumptions: [],
  sales: [],
  incubatorBatches: [],
  lastUpdated: 1000
};

// User consumes 15 eggs on Phone
phoneEggState.eggStocks.poule -= 15;
phoneEggState.eggStock = 35;
phoneEggState.eggConsumptions.push({
  id: 'cons-1',
  species: 'poule',
  count: 15,
  timestamp: 2000
});
phoneEggState.lastUpdated = 2000;
localStorage.setItem('fermegest_last_local_edit', '2000');

// Stale Cloud arrives with 50 eggs (before consumption was pushed)
const staleCloudWith50Eggs = {
  eggStock: 50,
  eggStocks: { poule: 50 },
  eggHarvests: [],
  eggConsumptions: [],
  sales: [],
  incubatorBatches: [],
  lastUpdated: 1500
};

appAuth.applyCloudData.call({
  getAppState: () => phoneEggState,
  getDeletedIds: () => new Set(),
  mergeCollections: appAuth.mergeCollections.bind(appAuth)
}, staleCloudWith50Eggs, true);

console.log('Egg stock after sync with stale cloud:', phoneEggState.eggStock, phoneEggState.eggStocks);
assert.strictEqual(phoneEggState.eggStock, 35, 'Egg stock MUST remain decreased at 35, not bounce back to 50!');
assert.strictEqual(phoneEggState.eggStocks.poule, 35, 'Poule egg stock MUST remain 35!');
console.log('✔ Test 1 Passed: Egg consumption decreased stock from 50 to 35 and did NOT bounce back!');

// --- SCENARIO 2: Remote Egg Consumption Decreases Other Device ---
console.log('\n--- TEST 2: Partner Consumes Eggs on Cloud -> Decreases Local Device ---');
let partnerEggState = {
  eggStock: 35,
  eggStocks: { poule: 35 },
  eggHarvests: [],
  eggConsumptions: [{ id: 'cons-1', species: 'poule', count: 15, timestamp: 2000 }],
  sales: [],
  incubatorBatches: [],
  lastUpdated: 2000
};

// Brother consumes 10 more eggs on Cloud
const cloudWithNewConsumption = {
  eggStock: 25,
  eggStocks: { poule: 25 },
  eggHarvests: [],
  eggConsumptions: [
    { id: 'cons-1', species: 'poule', count: 15, timestamp: 2000 },
    { id: 'cons-2', species: 'poule', count: 10, timestamp: 3000 }
  ],
  sales: [],
  incubatorBatches: [],
  lastUpdated: 3000
};

appAuth.applyCloudData.call({
  getAppState: () => partnerEggState,
  getDeletedIds: () => new Set(),
  mergeCollections: appAuth.mergeCollections.bind(appAuth)
}, cloudWithNewConsumption, true);

console.log('Partner egg stock after receiving brother consumption:', partnerEggState.eggStock, partnerEggState.eggStocks);
assert.strictEqual(partnerEggState.eggStock, 25, 'Egg stock MUST decrease to 25 from brother consumption!');
assert.strictEqual(partnerEggState.eggStocks.poule, 25, 'Poule egg stock MUST decrease to 25!');
console.log('✔ Test 2 Passed: Remote consumption properly decreased local stock from 35 to 25!');

// --- SCENARIO 3: Incubator Batch Decreases Egg Stock & Stays Decreased ---
console.log('\n--- TEST 3: Incubator Batch Decreases Egg Stock & Stays Decreased ---');
let incubationState = {
  eggStock: 25,
  eggStocks: { poule: 25 },
  eggHarvests: [],
  eggConsumptions: [{ id: 'cons-1' }, { id: 'cons-2' }],
  sales: [],
  incubatorBatches: [],
  lastUpdated: 3000
};

// Put 12 eggs into incubator
incubationState.eggStocks.poule -= 12;
incubationState.eggStock = 13;
incubationState.incubatorBatches.push({
  id: 'batch-farm-1',
  eggSource: 'farm',
  species: 'poule',
  eggsCount: 12,
  stockDeducted: true,
  timestamp: 4000
});
incubationState.lastUpdated = 4000;
localStorage.setItem('fermegest_last_local_edit', '4000');

// Cloud without batch arrives
const cloudBeforeIncubation = {
  eggStock: 25,
  eggStocks: { poule: 25 },
  eggHarvests: [],
  eggConsumptions: [{ id: 'cons-1' }, { id: 'cons-2' }],
  sales: [],
  incubatorBatches: [],
  lastUpdated: 3500
};

appAuth.applyCloudData.call({
  getAppState: () => incubationState,
  getDeletedIds: () => new Set(),
  mergeCollections: appAuth.mergeCollections.bind(appAuth)
}, cloudBeforeIncubation, true);

console.log('Egg stock after incubation sync:', incubationState.eggStock, incubationState.eggStocks);
assert.strictEqual(incubationState.eggStock, 13, 'Egg stock MUST remain decreased at 13 after incubation!');
assert.strictEqual(incubationState.eggStocks.poule, 13, 'Poule eggs MUST be 13!');
console.log('✔ Test 3 Passed: Incubation decreased eggs from 25 to 13 and stayed at 13!');

// --- SCENARIO 4: Feed Distribution Decrements Feed Stock & Stays Decreased ---
console.log('\n--- TEST 4: Feed Distribution Decrements Feed Stock & Stays Decreased ---');
let phoneFeedState = {
  feedStockKg: 200,
  feedTypes: [
    { id: 'feed-ble', name: 'Blé', stockKg: 200, updatedAt: 5000 }
  ],
  feedDistributions: [],
  lastUpdated: 5000
};

// User distributes 25kg of feed
phoneFeedState.feedTypes[0].stockKg = 175;
phoneFeedState.feedTypes[0].updatedAt = 6000;
phoneFeedState.feedStockKg = 175;
phoneFeedState.feedStockUpdatedAt = 6000;
phoneFeedState.feedDistributions.push({
  id: 'dist-1',
  totalKg: 25,
  items: [{ feedTypeId: 'feed-ble', name: 'Blé', kg: 25 }],
  updatedAt: 6000
});
phoneFeedState.lastUpdated = 6000;
localStorage.setItem('fermegest_last_local_edit', '6000');

// Old cloud with 200kg arrives
const staleCloudFeed = {
  feedStockKg: 200,
  feedTypes: [
    { id: 'feed-ble', name: 'Blé', stockKg: 200, updatedAt: 5000 }
  ],
  feedDistributions: [],
  lastUpdated: 5500
};

appAuth.applyCloudData.call({
  getAppState: () => phoneFeedState,
  getDeletedIds: () => new Set(),
  mergeCollections: appAuth.mergeCollections.bind(appAuth)
}, staleCloudFeed, true);

console.log('Feed stock after distribution sync:', phoneFeedState.feedStockKg, phoneFeedState.feedTypes[0].stockKg);
assert.strictEqual(phoneFeedState.feedStockKg, 175, 'Feed stock MUST remain decreased at 175kg!');
assert.strictEqual(phoneFeedState.feedTypes[0].stockKg, 175, 'Blé stock MUST remain decreased at 175kg!');
console.log('✔ Test 4 Passed: Feed distribution decreased stock from 200kg to 175kg and stayed at 175kg!');

console.log('\n🎉 ALL DECREMENTATION AND DECREASE TESTS PASSED 100%!');
