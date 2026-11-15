// scripts/test_feed_types_recovery.js
// Verification of multi-feed types separation:
// Ensuring multiple feed purchases are NEVER squashed into a single feed type!

const assert = require('assert');

function cleanExpenseTitle(title) {
  return (title || '')
    .replace(/^(achat|شراء|buy|purchase)\s*[:\-]?\s*/i, '')
    .replace(/\(\d+.*?\)/g, '')
    .trim();
}

function reconcileExpenses(expenses, existingFeedTypes = []) {
  const feedTypes = [...existingFeedTypes];
  const foodExpenses = (expenses || []).filter(e => e.category === 'nourriture' && !e.feedStockDetached);
  
  // 1. Group expenses by identity: strictly by feedTypeId if valid, or by exact cleaned title
  const feedGroups = {};
  foodExpenses.forEach(exp => {
    const cleanTitle = cleanExpenseTitle(exp.title);
    let groupKey = '';
    if (exp.feedTypeId && feedTypes.some(f => f.id === exp.feedTypeId)) {
      groupKey = `id_${exp.feedTypeId}`;
    } else if (cleanTitle) {
      groupKey = `title_${cleanTitle.toLowerCase()}`;
    } else {
      groupKey = `exp_${exp.id}`;
    }

    if (!feedGroups[groupKey]) {
      feedGroups[groupKey] = {
        cleanTitle: cleanTitle || 'Aliment',
        feedTypeId: exp.feedTypeId,
        totalAddedKg: 0,
        totalCost: 0,
        expenses: []
      };
    }
    const addedKg = Number(exp.feedStockAddedKg) || 0;
    const cost = Number(exp.total) || 0;
    feedGroups[groupKey].totalAddedKg += addedKg;
    feedGroups[groupKey].totalCost += cost;
    feedGroups[groupKey].expenses.push(exp);
  });

  // 2. Reconcile with feedTypes using EXACT matching (NO greedy substring includes)
  Object.values(feedGroups).forEach(group => {
    let ft = null;
    if (group.feedTypeId) {
      ft = feedTypes.find(f => f.id === group.feedTypeId);
    }
    if (!ft && group.cleanTitle) {
      const ct = group.cleanTitle.toLowerCase();
      ft = feedTypes.find(f => (f.name || '').toLowerCase().trim() === ct);
    }

    const unitPrice = group.totalAddedKg > 0 ? parseFloat((group.totalCost / group.totalAddedKg).toFixed(3)) : 0;

    if (!ft) {
      ft = {
        id: group.feedTypeId || ('feed-' + Math.random().toString(36).substr(2, 9)),
        name: group.cleanTitle,
        stockKg: group.totalAddedKg,
        pricePerKg: unitPrice,
        texture: 'grain',
        kgPerCan: 0.70,
        manuallyAdjusted: true,
        updatedAt: Date.now()
      };
      feedTypes.push(ft);
    } else {
      // If feed exists, update stock from total additions minus distributions
      ft.stockKg = group.totalAddedKg;
      if (unitPrice > 0) ft.pricePerKg = unitPrice;
    }

    // Attach canonical feedTypeId to expenses
    group.expenses.forEach(e => {
      e.feedTypeId = ft.id;
    });
  });

  return feedTypes;
}

console.log('=== TEST SUITE: MULTI-FEED TYPES SEPARATION & PRESERVATION ===\n');

// Test 1: User bought "Aliment 1" and "Aliment 2"
console.log('--- TEST 1: User buys "Aliment 1" and "Aliment 2" ---');
const exps1 = [
  { id: 'e1', category: 'nourriture', title: 'Achat Aliment 1', feedStockAddedKg: 50, total: 60 },
  { id: 'e2', category: 'nourriture', title: 'Achat Aliment 2', feedStockAddedKg: 50, total: 65 }
];
const res1 = reconcileExpenses(exps1, []);
console.log('Feeds created:', res1.map(f => `"${f.name}" (${f.stockKg}kg)`));
assert.strictEqual(res1.length, 2, 'Must create exactly 2 distinct feed types!');
assert.strictEqual(res1[0].name, 'Aliment 1', 'First feed must be "Aliment 1", NOT "1"!');
assert.strictEqual(res1[1].name, 'Aliment 2', 'Second feed must be "Aliment 2", NOT "2"!');
console.log('✔ Test 1 Passed: "Aliment 1" and "Aliment 2" preserved with exact noble names without collapsing!\n');

// Test 2: User bought "Aliment ponte" and "Aliment pondeuse" (same family keywords)
console.log('--- TEST 2: Two feeds with similar agronomic context ("Aliment ponte" & "Aliment pondeuse") ---');
const exps2 = [
  { id: 'e1', category: 'nourriture', title: 'Aliment ponte', feedStockAddedKg: 100, total: 110 },
  { id: 'e2', category: 'nourriture', title: 'Aliment pondeuse', feedStockAddedKg: 50, total: 55 }
];
const res2 = reconcileExpenses(exps2, []);
console.log('Feeds created:', res2.map(f => `"${f.name}" (${f.stockKg}kg)`));
assert.strictEqual(res2.length, 2, 'Must create 2 distinct feeds, NOT collapse into one!');
console.log('✔ Test 2 Passed: Feeds with similar agronomic context remain separated!\n');

// Test 3: Tunisian Arabic purchases: "شراء علف بياضة" and "شراء علف دجاج"
console.log('--- TEST 3: Tunisian Arabic purchases ---');
const exps3 = [
  { id: 'e1', category: 'nourriture', title: 'شراء علف بياضة', feedStockAddedKg: 50, total: 55 },
  { id: 'e2', category: 'nourriture', title: 'شراء علف دجاج', feedStockAddedKg: 50, total: 50 }
];
const res3 = reconcileExpenses(exps3, []);
console.log('Feeds created:', res3.map(f => `"${f.name}" (${f.stockKg}kg)`));
assert.strictEqual(res3.length, 2, 'Must create 2 distinct Arabic feed types!');
assert.strictEqual(res3[0].name, 'علف بياضة');
assert.strictEqual(res3[1].name, 'علف دجاج');
console.log('✔ Test 3 Passed: Arabic feed types preserved cleanly without mangling!\n');

// Test 4: Whole grain vs Milled grain: "Blé grain" and "Blé concassé"
console.log('--- TEST 4: "Blé grain" vs "Blé concassé" ---');
const exps4 = [
  { id: 'e1', category: 'nourriture', title: 'Achat Blé grain', feedStockAddedKg: 80, total: 80 },
  { id: 'e2', category: 'nourriture', title: 'Achat Blé concassé', feedStockAddedKg: 40, total: 45 }
];
const res4 = reconcileExpenses(exps4, []);
console.log('Feeds created:', res4.map(f => `"${f.name}" (${f.stockKg}kg)`));
assert.strictEqual(res4.length, 2, 'Must create 2 distinct feeds for grain vs concassé!');
console.log('✔ Test 4 Passed: Distinct grain textures remain separate!\n');

console.log('🎉 ALL MULTI-FEED SEPARATION TESTS PASSED 100%!');

// Test 5: Full Integration with real app.js methods
console.log('\n--- TEST 5: Integration with app.js reconcileFeedTypesFromExpenses() & autoRepairFeedStock() ---');
const fs = require('fs');

global.window = { 
  addEventListener: () => {},
  appAuth: {
    removeDeletedId: () => {},
    addDeletedId: () => {},
    getDeletedIds: () => new Set(),
    pushData: () => {}
  }
};
global.document = { 
  documentElement: { setAttribute: () => {}, getAttribute: () => 'fr' },
  getElementById: () => null, 
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

let realAppCode = fs.readFileSync('app.js', 'utf8');
realAppCode = realAppCode.replace("document.addEventListener('DOMContentLoaded', () => app.init());", "// no init");
realAppCode = realAppCode.replace('const app = {', 'global.app = {');
eval(realAppCode);

global.app.renderAll = () => {};
global.app.renderExpensesTable = () => {};
global.app.renderFeedDistributionModal = () => {};
global.app.renderFeedStockAdjustModal = () => {};
global.app.showToast = () => {};
global.app.closeModal = () => {};
global.app.saveState = () => {};

// User has 2 purchases: "Achat Blé" (100kg) and "Achat Maïs" (50kg)
window.appState.expenses = [
  { id: 'exp-1', category: 'nourriture', title: 'Achat Blé', feedStockAddedKg: 100, total: 100 },
  { id: 'exp-2', category: 'nourriture', title: 'Achat Maïs', feedStockAddedKg: 50, total: 60 }
];
window.appState.feedDistributions = [
  { id: 'dist-1', totalKg: 20, items: [{ name: 'Blé', kg: 20 }] }
];
window.appState.feedTypes = [];
window.appState.feedStockKg = 0;

global.app.reconcileFeedTypesFromExpenses();
console.log('Feeds after real reconcile:', window.appState.feedTypes.map(f => `"${f.name}" (${f.stockKg}kg)`));
assert.strictEqual(window.appState.feedTypes.length, 2, 'Must reconcile 2 distinct feeds!');
assert.strictEqual(window.appState.feedTypes[0].name, 'Blé');
assert.strictEqual(window.appState.feedTypes[1].name, 'Maïs');

// Call autoRepairFeedStock()
global.app.autoRepairFeedStock();
console.log('Feeds after real autoRepair:', window.appState.feedTypes.map(f => `"${f.name}" (${f.stockKg}kg)`));
assert.strictEqual(window.appState.feedTypes[0].stockKg, 80, 'Blé should be 100 - 20 = 80kg!');
assert.strictEqual(window.appState.feedTypes[1].stockKg, 50, 'Maïs should be 50kg!');
assert.strictEqual(window.appState.feedStockKg, 130, 'Total reserve stock must be 80 + 50 = 130kg!');
console.log('✔ Test 5 Passed: Real app.js autoRepairFeedStock() accurately calculated 80kg Blé and 50kg Maïs without squashing!\n');

// Test 6: getFeedDisplayName & getFeedShortName preserving distinct feeds
console.log('--- TEST 6: Feed Display Names for Distinguishable and Numbered Feeds ---');
const ft1 = { id: 'feed-1', name: 'Aliment 1', stockKg: 50 };
const ft2 = { id: 'feed-2', name: 'Aliment 2', stockKg: 60 };
const ftP1 = { id: 'feed-p1', name: 'Aliment ponte 1', stockKg: 40 };
const ftP2 = { id: 'feed-p2', name: 'Aliment ponte 2', stockKg: 45 };
const ftBio = { id: 'feed-bio', name: 'Aliment bio', stockKg: 30 };

assert.strictEqual(global.app.getFeedDisplayName(ft1), 'Aliment 1');
assert.strictEqual(global.app.getFeedDisplayName(ft2), 'Aliment 2');
assert.strictEqual(global.app.getFeedDisplayName(ftP1), 'Aliment ponte 1');
assert.strictEqual(global.app.getFeedDisplayName(ftP2), 'Aliment ponte 2');
assert.strictEqual(global.app.getFeedDisplayName(ftBio), 'Aliment bio');
assert.strictEqual(global.app.getFeedShortName(ft1), 'Aliment 1');
assert.strictEqual(global.app.getFeedShortName(ft2), 'Aliment 2');
console.log('✔ Test 6 Passed: getFeedDisplayName and getFeedShortName never truncate numbered or distinguished feeds!\n');

// Test 7: Manual warehouse feed with 0 purchase expenses preserved in autoRepairFeedStock
console.log('--- TEST 7: Manual Warehouse Feed (0 expense) preserved during auto-repair ---');
window.appState.feedTypes = [
  { id: 'feed-custom-1', name: 'Aliment Manuel Magasin', stockKg: 75, updatedAt: Date.now() },
  { id: 'feed-custom-2', name: 'Grain Concassé', stockKg: 30, updatedAt: Date.now() }
];
window.appState.expenses = [];
window.appState.feedDistributions = [
  { id: 'dist-x', totalKg: 10, items: [{ name: 'Aliment Manuel Magasin', kg: 10 }] }
];
global.app.autoRepairFeedStock();
assert.strictEqual(window.appState.feedTypes.length, 2, 'Both manual warehouse feeds must remain in state!');
const manualFt = window.appState.feedTypes.find(f => f.id === 'feed-custom-1');
assert.strictEqual(manualFt.stockKg, 65, 'Manual feed should be reduced by 10kg distribution: 75 - 10 = 65kg!');
console.log('✔ Test 7 Passed: Manual warehouse feeds are preserved and properly decremented!\n');

// Test 8: deleteFeedType isolation (does NOT delete other feeds in same family)
console.log('--- TEST 8: deleteFeedType Isolation ---');
window.appState.feedTypes = [
  { id: 'feed-ponte-a', name: 'Aliment ponte A', stockKg: 40 },
  { id: 'feed-ponte-b', name: 'Aliment ponte B', stockKg: 50 }
];
window.appState.expenses = [
  { id: 'e-a', category: 'nourriture', feedTypeId: 'feed-ponte-a', feedStockAddedKg: 40, title: 'Aliment ponte A' },
  { id: 'e-b', category: 'nourriture', feedTypeId: 'feed-ponte-b', feedStockAddedKg: 50, title: 'Aliment ponte B' }
];
global.app.confirmDialog = (opts) => { if (opts && opts.onConfirm) opts.onConfirm(); };
global.app.openConfirmModal = (opts) => { if (opts && opts.onConfirm) opts.onConfirm(); };
global.app.deleteFeedType('feed-ponte-a');

assert.strictEqual(window.appState.feedTypes.length, 1, 'Only one feed should remain after deleting feed-ponte-a!');
assert.strictEqual(window.appState.feedTypes[0].id, 'feed-ponte-b', 'Remaining feed must be feed-ponte-b!');
assert.strictEqual(window.appState.expenses.find(e => e.id === 'e-b').feedStockDetached, undefined, 'Expense for feed-ponte-b must NOT be detached!');
assert.strictEqual(window.appState.expenses.find(e => e.id === 'e-a').feedStockDetached, true, 'Expense for feed-ponte-a must be detached!');
console.log('✔ Test 8 Passed: deleteFeedType successfully isolated to target feed only!\n');

// Test 9: Cross-device mergeCollections in supabase-client.js
console.log('--- TEST 9: Cross-device mergeCollections feed deduplication by clean name ---');
let clientCode = fs.readFileSync('supabase-client.js', 'utf8');
eval(clientCode);

const auth = global.window.appAuth;
const localFeeds = [
  { id: 'feed-mobile-123', name: 'Aliment ponte', stockKg: 45, updatedAt: 1000 }
];
const cloudFeeds = [
  { id: 'feed-web-999', name: 'Aliment Ponte', stockKg: 45, updatedAt: 2000 }
];
const mergedFeeds = auth.mergeCollections(localFeeds, cloudFeeds);
console.log('Merged Feeds count:', mergedFeeds.length, mergedFeeds.map(f => f.name));
assert.strictEqual(mergedFeeds.length, 1, 'Same feed name across mobile & web must merge cleanly instead of duplicating or overwriting!');
console.log('✔ Test 9 Passed: Cross-device feeds with different random IDs merge cleanly by exact name!\n');

// Test 10: applyCloudData respects effectiveDoMerge when doMerge = false
console.log('--- TEST 10: applyCloudData with doMerge = false respects effectiveDoMerge ---');
const localState = {
  animals: [{ id: 'a1', species: 'poule' }],
  expenses: [{ id: 'e1', category: 'nourriture' }],
  feedTypes: [
    { id: 'ft-1', name: 'Aliment 1', stockKg: 50 },
    { id: 'ft-2', name: 'Aliment 2', stockKg: 70 }
  ],
  feedDistributions: [],
  lastUpdated: 5000
};
auth.getAppState = () => localState;
auth.getDeletedIds = () => new Set();

const cloudSnapshot = {
  animals: [{ id: 'a1', species: 'poule' }],
  expenses: [{ id: 'e1', category: 'nourriture' }],
  feedTypes: [
    { id: 'ft-1', name: 'Aliment 1', stockKg: 50 } // Cloud only has 1 feed from older snapshot
  ],
  feedDistributions: [],
  lastUpdated: 4000
};

// Even if doMerge = false is passed (e.g. fresh pull), effectiveDoMerge becomes true and preserves ft-2
auth.applyCloudData(cloudSnapshot, false);
console.log('Local feeds after cloud apply with doMerge=false:', localState.feedTypes.map(f => f.name));
assert.strictEqual(localState.feedTypes.length, 2, 'Must NOT wipe ft-2 when local state has active data!');
console.log('✔ Test 10 Passed: applyCloudData correctly uses effectiveDoMerge to protect feedTypes collection!\n');

console.log('🎉 100% OF ALL 10 TESTS PASSED WITH FLYING COLORS!');
process.exit(0);
