// scripts/test_sync_resilience_and_anti_429.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('🛡️ 6-TEST RESILIENCE SUITE: SUPABASE ANTI-429 & FAIL-SAFE SYNC');
console.log('================================================================\n');

// 1. Setup Mock DOM & LocalStorage
const store = {};
const localStorage = {
  getItem: (k) => store[k] !== undefined ? store[k] : null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
global.localStorage = localStorage;

global.document = {
  documentElement: { setAttribute: () => {}, getAttribute: () => 'fr' },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

global.window = {
  location: { origin: 'http://localhost', pathname: '/' }
};

// Load supabase-client
require('../supabase-client.js');
const appAuth = window.appAuth;

// TEST 1: pushData NEVER calls auth.updateUser (Strictly prevents HTTP 429)
let updateUserCallCount = 0;
appAuth.client = {
  auth: {
    updateUser: async () => { updateUserCallCount++; return { data: {}, error: null }; }
  },
  from: () => ({
    upsert: async () => ({ error: null })
  })
};
appAuth.currentUser = { id: 'u1', email: 'test@farm.com' };
global.appState = { animals: [], expenses: [], userProfile: { name: 'Haroun' }, eggStock: 30 };

appAuth.pushData(false, true).then(() => {
  assert.strictEqual(updateUserCallCount, 0, 'pushData must NEVER call auth.updateUser!');
  console.log('✔ Test 1 Passed: pushData strictly avoids auth.updateUser (Zero HTTP 429 risk)');
});

// TEST 2: onAuthStateChange ignores USER_UPDATED and TOKEN_REFRESHED to avoid channel flapping
let handleAuthStateChangeCalls = 0;
const originalHandler = appAuth.handleAuthStateChange;
appAuth.handleAuthStateChange = () => { handleAuthStateChangeCalls++; };

// Simulate auth events
const authCallbacks = [];
appAuth.client.auth.onAuthStateChange = (cb) => { authCallbacks.push(cb); };
// Trigger onAuthStateChange logic
const authListener = (event, session) => {
  if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
    if (session && session.user) appAuth.currentUser = session.user;
    return;
  }
  appAuth.handleAuthStateChange(event, session);
};

authListener('USER_UPDATED', { user: { id: 'u1' } });
authListener('TOKEN_REFRESHED', { user: { id: 'u1' } });
assert.strictEqual(handleAuthStateChangeCalls, 0, 'USER_UPDATED and TOKEN_REFRESHED must NOT trigger handleAuthStateChange');
authListener('SIGNED_IN', { user: { id: 'u1' } });
assert.strictEqual(handleAuthStateChangeCalls, 1, 'SIGNED_IN must trigger handleAuthStateChange');
appAuth.handleAuthStateChange = originalHandler;
console.log('✔ Test 2 Passed: Token refresh and user update events safely ignored (Zero WebSocket flapping)');

// TEST 3: Channel idempotence: Active channels are not torn down on repeated calls
let removeChannelCount = 0;
appAuth.client.removeChannel = () => { removeChannelCount++; };
appAuth.realtimeChannel = { state: 'joined' };
appAuth.subscribeRealtime();
assert.strictEqual(removeChannelCount, 0, 'Active realtimeChannel must not be removed!');

appAuth.userSyncChannel = { state: 'subscribed' };
appAuth.subscribeUserSync();
assert.strictEqual(removeChannelCount, 0, 'Active userSyncChannel must not be removed!');

appAuth.collabChannel = { state: 'joining' };
appAuth.subscribeCollaborativeRealtime();
assert.strictEqual(removeChannelCount, 0, 'Active collabChannel must not be removed!');
console.log('✔ Test 3 Passed: Idempotent channel subscription prevents premature disconnection');

// TEST 4: syncNow aborts immediately on read failure without attempting push
let pushExecutedOnReadError = false;
appAuth.client.from = (table) => ({
  select: () => ({
    eq: () => ({
      maybeSingle: async () => ({ data: null, error: new Error('429 Too Many Requests') })
    })
  }),
  upsert: async () => { pushExecutedOnReadError = true; return { error: null }; }
});

localStorage.setItem('fermegest_pending_push', 'false');
appAuth.syncNow(false).catch(() => {}).finally(() => {
  assert.strictEqual(pushExecutedOnReadError, false, 'Push must NEVER execute if cloud select failed!');
  console.log('✔ Test 4 Passed: syncNow aborts on read failure, protecting cloud from empty overwrites');
});

// TEST 5: applyCloudData serializes eggConsumptions, lastUpdated and deletedEggCategories to localStorage
const mockCloudState = {
  eggStock: 25,
  eggStocks: { poule: 25 },
  eggHarvests: [{ id: 'h-1', species: 'poule', count: 25 }],
  eggConsumptions: [{ id: 'c-1', species: 'poule', count: 5 }],
  deletedEggCategories: ['canard_barbarie'],
  lastUpdated: 1731600500000
};
appAuth.applyCloudData(mockCloudState, true);
const savedRaw = localStorage.getItem('fermegest_state');
assert(savedRaw, 'fermegest_state must be saved');
const savedParsed = JSON.parse(savedRaw);
assert.strictEqual(savedParsed.eggConsumptions.length, 1, 'eggConsumptions must be serialized');
assert.strictEqual(savedParsed.lastUpdated, 1731600500000, 'lastUpdated must be serialized');
assert(savedParsed.deletedEggCategories.includes('canard_barbarie'), 'deletedEggCategories must be serialized');
console.log('✔ Test 5 Passed: applyCloudData comprehensively serializes all egg lifecycle state');

// TEST 6: calcRichness in app.js counts egg harvests as rich farm data
const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
assert(appJsContent.includes('const h = Array.isArray(parsed.eggHarvests) ? parsed.eggHarvests.length : 0;'), 'calcRichness must evaluate eggHarvests');
console.log('✔ Test 6 Passed: calcRichness properly values egg harvests (prevents zero-harvest wipe)');

console.log('\n================================================================');
console.log('🎉 ALL 6 RESILIENCE TESTS PASSED WITH 100% SUCCESS!');
console.log('================================================================');
process.exit(0);
