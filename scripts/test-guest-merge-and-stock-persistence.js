/**
 * Test guest data adoption, safe stock merge, and session persistence
 */
const assert = require('assert');

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

global.window = {
  localStorage: global.localStorage,
  document: global.document,
  addEventListener: () => {},
  appState: {},
  app: {
    updateCurrencySymbols: () => {},
    updateUserHeaderUI: () => {},
    updateLivestockUIThemeAndVisibility: () => {},
    renderAll: () => {},
    closeModal: () => {}
  }
};

// Load supabase-client
require('../supabase-client.js');
const appAuth = global.window.appAuth;

console.log('--- TEST 1: Stock Protection (Cloud 50kg, Local 0kg) ---');
const localFeed = [
  { id: 'feed-ponte', name: 'Aliment ponte', stockKg: 0, pricePerKg: 1.2 }
];
const cloudFeed = [
  { id: 'feed-ponte', name: 'Aliment ponte', stockKg: 50, pricePerKg: 1.2, updatedAt: Date.now() - 3600000 }
];

const mergedFeeds = appAuth.mergeCollections(localFeed, cloudFeed, 'id');
console.log('Merged Feed stockKg:', mergedFeeds[0].stockKg);
assert.strictEqual(mergedFeeds[0].stockKg, 50, 'Cloud stock 50kg must NOT be overwritten by local uninitialized 0kg!');
console.log('✔ Test 1 Passed: 50kg stock safely preserved!');

console.log('--- TEST 2: Guest Data Adoption on Login ---');
const localGuestAnimals = [
  { id: 'lot-guest-1', name: 'Lot Frère Invité', species: 'poule_pondeuse', initialQuantity: 20, currentQuantity: 20, updatedAt: Date.now() }
];
const cloudAnimals = [
  { id: 'lot-cloud-1', name: 'Lot Initial Cloud', species: 'vache_laitiere', initialQuantity: 2, currentQuantity: 2, updatedAt: Date.now() - 100000 }
];

const mergedAnimals = appAuth.mergeCollections(localGuestAnimals, cloudAnimals, 'id');
assert.strictEqual(mergedAnimals.length, 2, 'Both guest animal and cloud animal must be retained!');
console.log('✔ Test 2 Passed: Guest animal and Cloud animal merged perfectly (count = 2)!');

console.log('--- TEST 3: Incubator Batches Preservation ---');
const localGuestBatches = [
  { id: 'batch-guest-1', name: 'Couvée Frère', eggsCount: 50, startDate: '2026-11-14', updatedAt: Date.now() }
];
const cloudBatches = [
  { id: 'batch-cloud-1', name: 'Couvée Cloud', eggsCount: 30, startDate: '2026-11-01', updatedAt: Date.now() - 500000 }
];

const mergedBatches = appAuth.mergeCollections(localGuestBatches, cloudBatches, 'id');
assert.strictEqual(mergedBatches.length, 2, 'Both incubator batches must be retained!');
console.log('✔ Test 3 Passed: Both incubator batches merged perfectly (count = 2)!');

console.log('--- TEST 4: Session Disconnect Does NOT Wipe Local Farm Data ---');
window.appState = {
  animals: [{ id: 'lot-1', name: 'Mes Poules' }],
  eggStock: 100,
  feedTypes: [{ id: 'feed-1', stockKg: 40 }]
};
localStorage.setItem('fermegest_state', JSON.stringify(window.appState));

// Simulate handleAuthStateChange with session = null
appAuth.currentUser = { id: 'user-123', email: 'harounahajjem@gmail.com' };
appAuth.handleAuthStateChange('SIGNED_OUT', null);

const stateAfter = JSON.parse(localStorage.getItem('fermegest_state'));
assert(stateAfter.animals.length === 1, 'Local animals must NOT be erased on session null!');
assert.strictEqual(stateAfter.eggStock, 100, 'Egg stock must NOT be wiped!');
console.log('✔ Test 4 Passed: Offline / session null did NOT wipe farm data!');

console.log('🎉 ALL PERSISTENCE AND SYNC TESTS PASSED 100%!');
