const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING BLE PERSISTENCE & DELETION FIX ===');

// Test 1: Test regex detection in detectFeedTypeFromText
const appCode = fs.readFileSync('app.js', 'utf8');

// Extract detectFeedTypeFromText function definition
const detectMatch = appCode.match(/detectFeedTypeFromText\(text\)\s*\{([\s\S]*?)\n\s*\},/);
assert(detectMatch, 'detectFeedTypeFromText function not found');
const detectFeedTypeFromText = new Function('text', detectMatch[1]);

// Test negative matches (must return null)
const negatives = [
  'table', 'Table', 'Étable', 'étable', 'double', 'Double',
  'comptable', 'câble', 'sable', 'responsable', 'rentable',
  'livraison nourriture', 'maison', 'poisson', 'boisson'
];
negatives.forEach(word => {
  const result = detectFeedTypeFromText(word);
  assert.strictEqual(result, null, `Expected null for "${word}", got "${result}"`);
});
console.log('✔ Test 1 passed: Substring false positives eliminated (table, étable, livraison, etc.)');

// Test positive matches
const positives = [
  ['blé', 'ble'],
  ['achat blé', 'ble'],
  ['Achat Blé pour volailles', 'ble'],
  ['ble', 'ble'],
  ['قمح', 'ble'],
  ['القمح', 'ble'],
  ['بليه', 'ble'],
  ['bouchon', 'bouchon'],
  ['aliment ponte', 'bouchon'],
  ['son', 'son'],
  ['son de blé', 'son'],
  ['maïs', 'mais'],
  ['ذرة', 'mais']
];
positives.forEach(([word, expected]) => {
  const result = detectFeedTypeFromText(word);
  assert.strictEqual(result, expected, `Expected "${expected}" for "${word}", got "${result}"`);
});
console.log('✔ Test 2 passed: Genuine feed names detected accurately in French & Arabic');

// Test 3: Test getDeletedIds in supabase-client.js
// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

const sbCode = fs.readFileSync('supabase-client.js', 'utf8');
const getDeletedIdsMatch = sbCode.match(/getDeletedIds\(\)\s*\{([\s\S]*?)\n\s*\},/);
assert(getDeletedIdsMatch, 'getDeletedIds not found in supabase-client.js');
const getDeletedIds = new Function(getDeletedIdsMatch[1]);

// Add feed-ble to localStorage
localStorage.setItem('fermegest_deleted_ids', JSON.stringify(['feed-ble', 'feed-bouchon', 'animal-123']));
const deletedSet = getDeletedIds();
assert(deletedSet.has('feed-ble'), 'getDeletedIds MUST retain feed-ble in deletedIds set');
assert(deletedSet.has('feed-bouchon'), 'getDeletedIds MUST retain feed-bouchon');
console.log('✔ Test 3 passed: supabase-client.js getDeletedIds retains feed-ble tombstone');

// Test 4: mergeCollections with feed-ble in cloudData
const appAuthMock = {
  getDeletedIds: getDeletedIds
};
const mergeMatch = sbCode.match(/mergeCollections\(localList = \[\], cloudList = \[\], idKey = 'id'\)\s*\{([\s\S]*?)\n\s*\},/);
assert(mergeMatch, 'mergeCollections not found');
const mergeFn = new Function('localList', 'cloudList', 'idKey', `
  ${mergeMatch[1]}
`);

const localFeeds = []; // User deleted feed-ble locally
const cloudFeeds = [{ id: 'feed-ble', name: 'Blé', stockKg: 10 }]; // Cloud still had it

const merged = mergeFn.call(appAuthMock, localFeeds, cloudFeeds, 'id');
assert.strictEqual(merged.length, 0, 'Cloud feed-ble MUST NOT be revived when deletedIds contains feed-ble');
console.log('✔ Test 4 passed: mergeCollections does NOT revive deleted feed-ble from cloud');

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The "Blé" resurrection bug is fully solved.');
