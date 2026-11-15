// scripts/test_reserve_stock_feed.js
// Verification of the Stock de Réserve (Feed / Aliment) 0kg preservation & double-entry accounting

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

console.log('=== TEST SUITE: STOCK DE RÉSERVE (FEED / ALIMENT) 0KG & DOUBLE-ENTRY ACCOUNTING ===\n');

// --- TEST 1: Distributed to 0kg does NOT resurrect legacy globalStock ---
console.log('--- TEST 1: Distributed feed reaching 0kg does NOT resurrect legacy globalStock ---');
// Emulate app logic for legacy migration guard
function runLegacyMigrationCheck(appState) {
  const list = appState.feedTypes;
  const globalStock = Number(appState.feedStockKg) || 0;
  const currentTotalStock = list.reduce((sum, ft) => sum + (Number(ft.stockKg) || 0), 0);
  const isLegacyMigration = globalStock > 0 && currentTotalStock === 0 && list.length > 0 &&
    list.every(f => !f.updatedAt && !f.manuallyAdjusted && !f.isClosed);
  if (isLegacyMigration) {
    const perFeed = Math.round((globalStock / list.length) * 10) / 10;
    list.forEach((f) => {
      f.stockKg = perFeed;
      f.updatedAt = Date.now();
    });
  }
}

// Case A: User has feed that was distributed down to 0kg (has updatedAt or isClosed)
const userStateDistributedToZero = {
  feedStockKg: 0,
  feedTypes: [
    { id: 'feed-ble', name: 'Blé', stockKg: 0, updatedAt: 1700000000000, isClosed: true }
  ]
};
// Suppose globalStock had a legacy 500kg leftover in feedStockKg
userStateDistributedToZero.feedStockKg = 500;
runLegacyMigrationCheck(userStateDistributedToZero);

assert.strictEqual(userStateDistributedToZero.feedTypes[0].stockKg, 0, 'Distributed feed with updatedAt must NOT be resurrected to 500kg!');
console.log('✔ Test 1A Passed: Distributed feed at 0kg with history was NOT resurrected by legacy migration guard.');

// Case B: Brand new uninitialized legacy migration (never updated, pristine v1.0 migration)
const pristineLegacyState = {
  feedStockKg: 500,
  feedTypes: [
    { id: 'feed-default', name: 'Aliment Général', stockKg: 0 } // No updatedAt, no manuallyAdjusted, not closed
  ]
};
runLegacyMigrationCheck(pristineLegacyState);
assert.strictEqual(pristineLegacyState.feedTypes[0].stockKg, 500, 'Pristine legacy migration should initialize feedTypes from global stock.');
console.log('✔ Test 1B Passed: Pristine legacy migration properly initialized feedTypes when no edit history existed.');


// --- TEST 2: Cloud Sync with 0kg feed stock is accepted (cloudStock >= 0) ---
console.log('\n--- TEST 2: Cloud sync with 0kg feed stock is accepted cleanly ---');
let localPhoneFeed = {
  feedStockKg: 50,
  feedStockUpdatedAt: 1000,
  feedTypes: [
    { id: 'feed-orge', name: 'Orge', stockKg: 50, updatedAt: 1000 }
  ],
  feedDistributions: [],
  lastUpdated: 1000
};

// Cloud state after partner distributed all 50kg (stock is now 0kg)
const cloudZeroFeed = {
  feedStockKg: 0,
  feedStockUpdatedAt: 2000,
  feedTypes: [
    { id: 'feed-orge', name: 'Orge', stockKg: 0, updatedAt: 2000 }
  ],
  feedDistributions: [
    { id: 'dist-1', totalKg: 50, items: [{ feedTypeId: 'feed-orge', kg: 50 }], updatedAt: 2000 }
  ],
  lastUpdated: 2000
};

appAuth.applyCloudData.call({
  getAppState: () => localPhoneFeed,
  getDeletedIds: () => new Set(),
  mergeCollections: appAuth.mergeCollections.bind(appAuth)
}, cloudZeroFeed, true);

console.log('Local feedStockKg after syncing cloud 0kg:', localPhoneFeed.feedStockKg);
console.log('Local feedTypes[0].stockKg:', localPhoneFeed.feedTypes[0].stockKg);
assert.strictEqual(localPhoneFeed.feedTypes[0].stockKg, 0, 'Feed type stock must be 0kg!');
assert.strictEqual(localPhoneFeed.feedStockKg, 0, 'feedStockKg must be 0kg, NOT 50kg!');
console.log('✔ Test 2 Passed: 0kg cloud feed stock was accepted cleanly without falling back to stale local stock.');


// --- TEST 3: Double-Entry Exact Calculation (Purchases - Distributions = Exact Stock) ---
console.log('\n--- TEST 3: Double-Entry Accounting Formula per feed type ---');
const simulatedAppState = {
  feedStockKg: 0,
  feedTypes: [
    { id: 'feed-ble', name: 'Blé', stockKg: 0 },
    { id: 'feed-mais', name: 'Maïs', stockKg: 0 }
  ],
  expenses: [
    // 100kg Blé bought
    { id: 'exp-1', category: 'nourriture', title: 'Achat Blé', feedStockAddedKg: 100, feedTypeId: 'feed-ble' },
    // 50kg Maïs bought
    { id: 'exp-2', category: 'nourriture', title: 'Achat Maïs', feedStockAddedKg: 50, feedTypeId: 'feed-mais' }
  ],
  feedDistributions: [
    // 60kg Blé distributed
    { id: 'dist-1', totalKg: 60, items: [{ feedTypeId: 'feed-ble', name: 'Blé', kg: 60 }] },
    // 50kg Maïs distributed (completely exhausted!)
    { id: 'dist-2', totalKg: 50, items: [{ feedTypeId: 'feed-mais', name: 'Maïs', kg: 50 }] }
  ]
};

// Emulate the updated autoRepairFeedStock() logic
simulatedAppState.feedTypes.forEach(ft => {
  const boughtKg = (simulatedAppState.expenses || [])
    .filter(e => e && e.category === 'nourriture' && !e.feedStockDetached)
    .reduce((sum, exp) => {
      const isMatch = (exp.feedTypeId && exp.feedTypeId === ft.id) ||
        ((exp.title || '').toLowerCase().includes((ft.name || '').toLowerCase()));
      if (!isMatch) return sum;
      return sum + (Number(exp.feedStockAddedKg) || 0);
    }, 0);

  const distributedKg = (simulatedAppState.feedDistributions || []).reduce((sum, dist) => {
    if (!Array.isArray(dist.items)) return sum;
    const matchingItems = dist.items.filter(it =>
      (it.feedTypeId && it.feedTypeId === ft.id) ||
      ((it.name || '').toLowerCase().includes((ft.name || '').toLowerCase()))
    );
    return sum + matchingItems.reduce((s, it) => s + (Number(it.kg) || 0), 0);
  }, 0);

  if (boughtKg > 0) {
    ft.stockKg = Math.max(0, parseFloat((boughtKg - distributedKg).toFixed(2)));
    ft.updatedAt = Date.now();
    ft.isClosed = ft.stockKg <= 0;
  }
});

const calculatedTotal = parseFloat(simulatedAppState.feedTypes.reduce((s, ft) => s + (Number(ft.stockKg) || 0), 0).toFixed(2));
simulatedAppState.feedStockKg = calculatedTotal;

console.log('Calculated feed stocks:', simulatedAppState.feedTypes.map(f => `${f.name}: ${f.stockKg}kg (isClosed: ${f.isClosed})`));
console.log('Total reserve stock:', simulatedAppState.feedStockKg, 'kg');

assert.strictEqual(simulatedAppState.feedTypes[0].stockKg, 40, 'Blé stock must be exactly 40kg (100 - 60)!');
assert.strictEqual(simulatedAppState.feedTypes[1].stockKg, 0, 'Maïs stock must be exactly 0kg (50 - 50)!');
assert.strictEqual(simulatedAppState.feedTypes[1].isClosed, true, 'Exhausted Maïs must have isClosed=true!');
assert.strictEqual(simulatedAppState.feedStockKg, 40, 'Total reserve stock must be exactly 40kg!');
console.log('✔ Test 3 Passed: Double-entry accounting accurately computed 40kg Blé and 0kg Maïs without reviving exhausted stock.');


// --- TEST 4: Offline Distribution to 0kg Synchronizes Differential Cleanly ---
console.log('\n--- TEST 4: Offline Distribution to 0kg Synchronizes Differential Cleanly ---');
let offlineDeviceState = {
  feedStockKg: 80,
  feedTypes: [
    { id: 'feed-son', name: 'Son de blé', stockKg: 80, updatedAt: 1000 }
  ],
  feedDistributions: [],
  lastUpdated: 1000
};

// Offline user distributes all 80kg
offlineDeviceState.feedStockKg = 0;
offlineDeviceState.feedTypes[0].stockKg = 0;
offlineDeviceState.feedTypes[0].updatedAt = 3000;
offlineDeviceState.feedDistributions.push({
  id: 'dist-offline-all',
  totalKg: 80,
  items: [{ feedTypeId: 'feed-son', name: 'Son de blé', kg: 80 }],
  updatedAt: 3000
});
offlineDeviceState.lastUpdated = 3000;
localStorage.setItem('fermegest_last_local_edit', '3000');

// Cloud that still had 80kg (not yet synced)
const staleCloudWith80 = {
  feedStockKg: 80,
  feedStockUpdatedAt: 2000,
  feedTypes: [
    { id: 'feed-son', name: 'Son de blé', stockKg: 80, updatedAt: 1000 }
  ],
  feedDistributions: [],
  lastUpdated: 2000
};

appAuth.applyCloudData.call({
  getAppState: () => offlineDeviceState,
  getDeletedIds: () => new Set(),
  mergeCollections: appAuth.mergeCollections.bind(appAuth)
}, staleCloudWith80, true);

console.log('Feed stock after offline distribution to 0kg and sync:', offlineDeviceState.feedStockKg, offlineDeviceState.feedTypes[0].stockKg);
assert.strictEqual(offlineDeviceState.feedStockKg, 0, 'Global feed stock must be 0kg!');
assert.strictEqual(offlineDeviceState.feedTypes[0].stockKg, 0, 'Feed type stock must be 0kg!');
console.log('✔ Test 4 Passed: Offline distribution to 0kg cleanly preserves 0kg upon sync with stale cloud.');

console.log('\n🎉 ALL STOCK DE RÉSERVE (FEED / ALIMENT) TESTS PASSED 100%!');
process.exit(0);

