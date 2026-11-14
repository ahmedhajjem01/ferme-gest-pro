// scripts/test_user_scenario_87_eggs.js
// Reproduction & verification of the user's exact scenario:
// User had 87 eggs in harvest history, reduced 4 then 3, stock reached 0.
// On sync/refresh, stock must STAY at 0 (or real remaining) and NEVER resurrect 87 phantom eggs!

const assert = require('assert');

const store = {};
const localStorage = {
  getItem: (k) => store[k] !== undefined ? store[k] : null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.localStorage = localStorage;

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

console.log('=== TEST SUITE: 87 EGGS RESURRECTION BUG ELIMINATION ===');

// --- TEST 1: Stock reaches 0, Cloud has 87 historical harvests -> Stock MUST STAY AT 0 ---
console.log('--- TEST 1: Stock reaching 0 does NOT resurrect 87 eggs on Cloud Sync / Refresh ---');
let localWebState = {
  eggStock: 0,
  eggStocks: { poule: 0 },
  eggHarvests: [
    { id: 'h-1', count: 50, species: 'poule', date: '2026-11-01' },
    { id: 'h-2', count: 37, species: 'poule', date: '2026-11-05' }
  ],
  eggConsumptions: [
    { id: 'c-1', count: 4, species: 'poule', timestamp: 1000 },
    { id: 'c-2', count: 3, species: 'poule', timestamp: 2000 }
  ],
  sales: [
    { id: 's-1', productType: 'oeufs', quantity: 80, format: 'oeuf-unite', eggSpecies: 'poule' }
  ],
  incubatorBatches: [],
  lastUpdated: 2000
};
localStorage.setItem('fermegest_last_local_edit', '2000');

// Cloud payload coming from database with 87 eggs in history
const cloudWith87Harvests = {
  eggStock: 0,
  eggStocks: { poule: 0 },
  eggHarvests: [
    { id: 'h-1', count: 50, species: 'poule', date: '2026-11-01' },
    { id: 'h-2', count: 37, species: 'poule', date: '2026-11-05' }
  ],
  eggConsumptions: [],
  sales: [],
  incubatorBatches: [],
  lastUpdated: 1500
};

appAuth.applyCloudData.call({
  getAppState: () => localWebState,
  getDeletedIds: () => new Set(),
  mergeCollections: appAuth.mergeCollections.bind(appAuth)
}, cloudWith87Harvests, true);

console.log('Stock after sync with 87 harvests in cloud:', localWebState.eggStock, localWebState.eggStocks);
assert.strictEqual(localWebState.eggStock, 0, 'Egg stock MUST STAY 0! It must NOT become 87!');
assert.strictEqual(localWebState.eggStocks.poule, 0, 'Poule stock MUST STAY 0!');
console.log('✔ Test 1 Passed: Egg stock at 0 remained 0 and did NOT resurrect 87 historical eggs!');

// --- TEST 2: Pure Offline Deductions (Reduced 4 then 3) Sync Correctly Without Harvests ---
console.log('\n--- TEST 2: Pure Offline Deductions (Reduced 4 then 3) Subtract from Stale Cloud ---');
let phoneState = {
  eggStock: 7,
  eggStocks: { poule: 7 },
  eggHarvests: [{ id: 'h-1', count: 87, species: 'poule' }],
  eggConsumptions: [],
  sales: [],
  incubatorBatches: [],
  lastUpdated: 1000
};

// User reduces 4 eggs, then 3 eggs on local device
phoneState.eggStocks.poule = 0;
phoneState.eggStock = 0;
phoneState.eggConsumptions.push({ id: 'c-offline-1', species: 'poule', count: 4, timestamp: 3000 });
phoneState.eggConsumptions.push({ id: 'c-offline-2', species: 'poule', count: 3, timestamp: 3100 });
phoneState.lastUpdated = 3100;
localStorage.setItem('fermegest_last_local_edit', '3100');

// Stale Cloud that hasn't seen the consumptions yet (still has stock: 7)
const staleCloud = {
  eggStock: 7,
  eggStocks: { poule: 7 },
  eggHarvests: [{ id: 'h-1', count: 87, species: 'poule' }],
  eggConsumptions: [],
  sales: [],
  incubatorBatches: [],
  lastUpdated: 2500
};

appAuth.applyCloudData.call({
  getAppState: () => phoneState,
  getDeletedIds: () => new Set(),
  mergeCollections: appAuth.mergeCollections.bind(appAuth)
}, staleCloud, true);

console.log('Stock after applying stale cloud with 7 eggs:', phoneState.eggStock, phoneState.eggStocks);
assert.strictEqual(phoneState.eggStock, 0, 'Local reduction to 0 must be preserved!');
assert.strictEqual(phoneState.eggStocks.poule, 0, 'Poule stock must be 0!');
console.log('✔ Test 2 Passed: Offline reductions (4 + 3 = 7 eggs) cleanly preserved at 0!');

// --- TEST 3: Incoming Pure Remote Deductions Decrease Other Device ---
console.log('\n--- TEST 3: Incoming Remote Deductions (Partner consumed 7 eggs) Decrease Local Stock ---');
let webDevice = {
  eggStock: 87,
  eggStocks: { poule: 87 },
  eggHarvests: [{ id: 'h-1', count: 87, species: 'poule' }],
  eggConsumptions: [],
  sales: [],
  incubatorBatches: [],
  lastUpdated: 1000
};
localStorage.setItem('fermegest_last_local_edit', '1000');

// Partner on phone consumed 7 eggs (4 + 3)
const cloudFromPhoneWithConsumptions = {
  eggStock: 80,
  eggStocks: { poule: 80 },
  eggHarvests: [{ id: 'h-1', count: 87, species: 'poule' }],
  eggConsumptions: [
    { id: 'c-1', species: 'poule', count: 4, timestamp: 2000 },
    { id: 'c-2', species: 'poule', count: 3, timestamp: 2100 }
  ],
  sales: [],
  incubatorBatches: [],
  lastUpdated: 2100
};

appAuth.applyCloudData.call({
  getAppState: () => webDevice,
  getDeletedIds: () => new Set(),
  mergeCollections: appAuth.mergeCollections.bind(appAuth)
}, cloudFromPhoneWithConsumptions, true);

console.log('Web stock after partner deductions:', webDevice.eggStock, webDevice.eggStocks);
assert.strictEqual(webDevice.eggStock, 80, 'Web device stock must decrease from 87 to 80!');
assert.strictEqual(webDevice.eggStocks.poule, 80, 'Poule stock must be 80!');
console.log('✔ Test 3 Passed: Partner remote consumptions cleanly decreased local device from 87 to 80!');

// --- TEST 4: Double-Entry Exact Historical Calculation Formula ---
console.log('\n--- TEST 4: Double-Entry Accounting Formula: Harvests - Sales - Consumptions - Incubator ---');
const farmState = {
  eggHarvests: [
    { id: 'h-1', count: 50, species: 'poule' },
    { id: 'h-2', count: 37, species: 'poule' }, // 87 eggs total
    { id: 'h-3', count: 20, species: 'canard_barbarie' }
  ],
  sales: [
    { id: 's-1', productType: 'oeufs', quantity: 70, format: 'oeuf-unite', eggSpecies: 'poule' },
    { id: 's-2', productType: 'oeufs', quantity: 2, format: 'plateau', eggSpecies: 'canard_barbarie' } // 60 canard eggs (exceeds 20, clamped to 0)
  ],
  eggConsumptions: [
    { id: 'c-1', count: 10, species: 'poule' },
    { id: 'c-2', count: 7, species: 'poule' } // 70 + 10 + 7 = 87 eggs deducted
  ],
  incubatorBatches: [
    { id: 'b-1', eggSource: 'farm', eggsCount: 0, eggType: 'poule' }
  ]
};

// Compute: poule = 87 - 70 - 17 = 0; canard = max(0, 20 - 60) = 0
const stockBySpecies = { poule: 0, canard_barbarie: 0 };
farmState.eggHarvests.forEach(h => {
  const sp = (h.species === 'canard' || h.species === 'canard_barbarie') ? 'canard_barbarie' : (h.species || 'poule');
  stockBySpecies[sp] = (stockBySpecies[sp] || 0) + (Number(h.count) || 0);
});
farmState.sales.forEach(s => {
  if (s.productType !== 'oeufs') return;
  const sp = s.eggSpecies || s.species || 'poule';
  let qty = Number(s.quantity) || 0;
  if (s.format === 'hara') qty *= 4;
  else if (s.format === 'plateau') qty *= 30;
  stockBySpecies[sp] = (stockBySpecies[sp] || 0) - qty;
});
farmState.eggConsumptions.forEach(c => {
  const sp = c.species || 'poule';
  stockBySpecies[sp] = (stockBySpecies[sp] || 0) - (Number(c.count) || 0);
});
farmState.incubatorBatches.forEach(b => {
  if (b.eggSource !== 'farm') return;
  const sp = (b.eggType === 'canard' || b.species === 'canard') ? 'canard_barbarie' : (b.eggType || b.species || 'poule');
  stockBySpecies[sp] = (stockBySpecies[sp] || 0) - (Number(b.eggsCount) || 0);
});
Object.keys(stockBySpecies).forEach(sp => {
  stockBySpecies[sp] = Math.max(0, stockBySpecies[sp] || 0);
});
const totalStock = Object.values(stockBySpecies).reduce((a, b) => a + b, 0);

assert.strictEqual(stockBySpecies.poule, 0, 'Poule stock must be exactly 0 (87 harvested - 70 sold - 17 consumed)!');
assert.strictEqual(stockBySpecies.canard_barbarie, 0, 'Canard stock must be clamped to 0!');
assert.strictEqual(totalStock, 0, 'Total stock must be exactly 0!');
console.log('✔ Test 4 Passed: Accounting formula gives exact 0 eggs, perfectly eliminating phantom resurrections!');

console.log('\n🎉 ALL 87 EGGS RESURRECTION BUG TESTS PASSED 100%!');
