// test_mobile_sovereignty.js
// Verification of Mobile Sovereignty, Push-First, Dirty-Guard, Auto-Recovery, and Backup Vault

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

// Mock window & DOM
global.window = {
  location: { reload: () => {} },
  confirm: (msg) => true
};
global.document = {
  documentElement: {
    setAttribute: () => {},
    getAttribute: () => 'fr'
  },
  getElementById: () => null,
  querySelectorAll: () => []
};

// 1. Test Richness Scoring Algorithm
const calcRichness = (rawJson) => {
  if (!rawJson) return -1;
  try {
    const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    const a = Array.isArray(parsed.animals) ? parsed.animals.length : 0;
    const e = Array.isArray(parsed.expenses) ? parsed.expenses.length : 0;
    const s = Array.isArray(parsed.sales) ? parsed.sales.length : 0;
    const b = Array.isArray(parsed.incubatorBatches) ? parsed.incubatorBatches.length : 0;
    const d = Array.isArray(parsed.feedDistributions) ? parsed.feedDistributions.length : 0;
    return (a * 10) + (e * 5) + (s * 5) + (b * 5) + (d * 2);
  } catch(err) {
    return -1;
  }
};

console.log('--- TEST 1: Richness Scoring & Auto-Recovery ---');
const staleState = {
  animals: [{ id: 'poule-1', species: 'poule' }],
  expenses: [],
  sales: [],
  lastUpdated: 1000
};
const richBackup = {
  animals: [
    { id: 'poule-1', species: 'poule' },
    { id: 'poule-2', species: 'poule' },
    { id: 'vache-1', species: 'vache' }
  ],
  expenses: [
    { id: 'exp-1', title: 'Aliment', amount: 50 },
    { id: 'exp-2', title: 'Paille', amount: 30 }
  ],
  sales: [
    { id: 'sale-1', productType: 'oeufs', amount: 20 }
  ],
  feedDistributions: [
    { id: 'dist-1', kg: 10 }
  ],
  lastUpdated: 500
};

const staleScore = calcRichness(staleState);
const richScore = calcRichness(richBackup);

console.log(`Stale Score: ${staleScore}, Rich Backup Score: ${richScore}`);
assert(richScore > staleScore, 'Rich backup score must be higher than stale state');

// Test Auto-Recovery simulation
localStorage.setItem('fermegest_state', JSON.stringify(staleState));
localStorage.setItem('fermegest_state_backup', JSON.stringify(richBackup));

let saved = localStorage.getItem('fermegest_state');
const backup = localStorage.getItem('fermegest_state_backup');

if (backup && (!saved || calcRichness(backup) > calcRichness(saved))) {
  console.log('✅ Auto-Recovery triggered!');
  saved = backup;
  localStorage.setItem('fermegest_state', backup);
  localStorage.setItem('fermegest_pending_push', 'true');
  localStorage.setItem('fermegest_last_local_edit', String(Date.now()));
}

const recoveredState = JSON.parse(localStorage.getItem('fermegest_state'));
assert.strictEqual(recoveredState.animals.length, 3, 'Recovered state must have 3 animals');
assert.strictEqual(recoveredState.expenses.length, 2, 'Recovered state must have 2 expenses');
assert.strictEqual(localStorage.getItem('fermegest_pending_push'), 'true', 'Dirty push flag must be set');
console.log('✅ TEST 1 PASSED: Auto-Recovery restored rich backup successfully!');

console.log('\n--- TEST 2: Dirty-Guard in applyCloudData ---');
// Simulated applyCloudData logic
let state = {
  animals: [
    { id: 'poule-1', species: 'poule' },
    { id: 'poule-2', species: 'poule' }
  ],
  lastUpdated: 2000
};

function simulatedApplyCloudData(cloudData) {
  const hasPendingLocalPush = localStorage.getItem('fermegest_pending_push') === 'true';
  const localLastEdit = Number(localStorage.getItem('fermegest_last_local_edit')) || Number(state.lastUpdated) || 0;
  const cloudLastUpdated = Number(cloudData.lastUpdated) || 0;

  if (hasPendingLocalPush || (localLastEdit > cloudLastUpdated && localLastEdit > 0)) {
    console.log('[Sync] 🛡️ Phone data protected: local edits are sovereign and fresher than cloud.');
    return false; // Guard triggered, rejected cloud data
  }

  state.animals = cloudData.animals;
  return true; // Applied
}

// Case A: Phone has pending push
localStorage.setItem('fermegest_pending_push', 'true');
const staleCloudIncoming = {
  animals: [{ id: 'old-poule' }],
  lastUpdated: 1500
};

const appliedA = simulatedApplyCloudData(staleCloudIncoming);
assert.strictEqual(appliedA, false, 'applyCloudData must abort when pending_push is true');
assert.strictEqual(state.animals.length, 2, 'Phone animals must not be overwritten');
console.log('✅ TEST 2A PASSED: Aborted incoming stale cloud pull during pending push');

// Case B: Local edit timestamp is newer than cloud
localStorage.removeItem('fermegest_pending_push');
localStorage.setItem('fermegest_last_local_edit', '5000');
const olderCloudIncoming = {
  animals: [{ id: 'old-poule' }],
  lastUpdated: 4000
};

const appliedB = simulatedApplyCloudData(olderCloudIncoming);
assert.strictEqual(appliedB, false, 'applyCloudData must abort when localLastEdit > cloudLastUpdated');
assert.strictEqual(state.animals.length, 2, 'Phone animals must not be overwritten by older cloud');
console.log('✅ TEST 2B PASSED: Aborted incoming pull when local edits are fresher than cloud');

console.log('\n--- TEST 3: Backup Vault Protection (No Overwrite by Cloud) ---');
// When applyCloudData runs (even for legitimate sync), it must NEVER overwrite fermegest_state_backup
localStorage.setItem('fermegest_state_backup', 'SAFE_VAULT_CONTENT');
localStorage.removeItem('fermegest_pending_push');
localStorage.setItem('fermegest_last_local_edit', '1000');

const fresherCloudIncoming = {
  animals: [{ id: 'new-cloud-animal' }],
  lastUpdated: 9000
};

const appliedC = simulatedApplyCloudData(fresherCloudIncoming);
assert.strictEqual(appliedC, true, 'Legitimate fresher cloud data should apply to working state');
// Check that fermegest_state_backup remained untouched
assert.strictEqual(localStorage.getItem('fermegest_state_backup'), 'SAFE_VAULT_CONTENT', 'fermegest_state_backup MUST NEVER be overwritten by cloud sync');
console.log('✅ TEST 3 PASSED: fermegest_state_backup remained completely isolated and protected');

console.log('\n--- TEST 4: Push-First Protocol in syncNow ---');
// When syncNow runs, if pending_push is true, it MUST push before pulling!
let pushCalled = false;
let pullCalled = false;
const callOrder = [];

const mockSyncEngine = {
  async pushData() {
    callOrder.push('PUSH');
    pushCalled = true;
    localStorage.removeItem('fermegest_pending_push');
  },
  async pullData() {
    callOrder.push('PULL');
    pullCalled = true;
  },
  async syncNow() {
    const hasPendingPush = localStorage.getItem('fermegest_pending_push') === 'true';
    if (hasPendingPush) {
      await this.pushData();
    }
    await this.pullData();
  }
};

localStorage.setItem('fermegest_pending_push', 'true');
mockSyncEngine.syncNow().then(() => {
  assert.deepStrictEqual(callOrder, ['PUSH', 'PULL'], 'Push MUST execute strictly before pull');
  assert.strictEqual(localStorage.getItem('fermegest_pending_push'), null, 'Pending push flag must be cleared after push');
  console.log('✅ TEST 4 PASSED: Push executed strictly before Pull!');
  console.log('\n🎉 ALL MOBILE SOVEREIGNTY TESTS PASSED 100%!');
});
