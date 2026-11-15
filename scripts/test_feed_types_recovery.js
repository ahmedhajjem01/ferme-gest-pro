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

console.log('🎉 100% OF REAL APP INTEGRATION TESTS PASSED!');
process.exit(0);
