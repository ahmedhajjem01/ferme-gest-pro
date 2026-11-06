const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: FEED EXPENSE PURCHASE FLOW ===');

// Setup mock DOM & window
const elements = {};
global.document = {
  readyState: 'loading', // Prevents app.init() from auto-running on eval
  documentElement: {
    setAttribute: () => {},
    getAttribute: () => 'dark'
  },
  getElementById: (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        value: '',
        style: {},
        options: [{ value: '', text: '', getAttribute: () => null }],
        selectedIndex: 0,
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false,
          toggle: () => {}
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        removeAttribute: () => {},
        setAttribute: () => {},
        reset: () => {},
        remove: () => {},
        addEventListener: () => {}
      };
    }
    return elements[id];
  },
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {}
};

global.window = {
  addEventListener: () => {},
  appAuth: {
    removeDeletedId: (id) => {},
    pushData: () => {}
  }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Load app.js and expose global.app
let appCode = fs.readFileSync('app.js', 'utf8');
appCode = appCode.replace('const app = {', 'global.app = {');

// Evaluate app definition
eval(appCode);

// Set deletedFeedIds on window.appState
window.appState.deletedFeedIds = ['feed-mais'];
window.appState.deletedFeedFamilies = ['mais'];
window.appState.currentFeedPurchaseMode = 'sac';

// Mock UI methods to avoid DOM rendering issues
app.renderAll = () => {};
app.renderFeedDistributionModal = () => {};
app.renderFeedStockAdjustModal = () => {};
app.showToast = (msg) => { console.log('Toast:', msg); };
app.closeModal = () => {};
app.saveState = () => {};

// Test 1: Simulate buying 2 bags of 50kg corn at 55 DT per bag
document.getElementById('expenseCategory').value = 'nourriture';
document.getElementById('expenseDate').value = '2026-11-06';
document.getElementById('expenseTitle').value = 'Achat maïs concassé';
document.getElementById('expenseAddToFeedStock').checked = true;
document.getElementById('expenseAnimalLot').value = 'general';
document.getElementById('feedBagCount').value = '2';
document.getElementById('feedBagWeight').value = '50';
document.getElementById('feedBagPrice').value = '55';
document.getElementById('expenseFeedTypeSelect').value = '__new__';

// Call handleSaveExpense
app.handleSaveExpense({ preventDefault: () => {} });

// Check results
assert.strictEqual(window.appState.expenses.length, 1, 'Expense should have been saved');
const savedExp = window.appState.expenses[0];
assert.strictEqual(savedExp.category, 'nourriture');
assert.strictEqual(savedExp.total, 110, 'Total should be 2 * 55 = 110 DT');
assert.strictEqual(savedExp.feedStockAddedKg, 100, 'Feed stock added should be 2 * 50 = 100 kg');

// Check feedTypes
assert.strictEqual(window.appState.feedTypes.length, 1, 'New feed type should have been added');
const savedFeed = window.appState.feedTypes[0];
console.log('Saved feed:', savedFeed.name, 'Stock:', savedFeed.stockKg, 'kg, Price:', savedFeed.pricePerKg, 'DT/kg');
assert.strictEqual(savedFeed.stockKg, 100, 'Feed stock should be 100 kg');
assert.strictEqual(savedFeed.pricePerKg, 1.1, 'Price per kg should be 110 / 100 = 1.1 DT/kg');

// Check untombstoning: mais should NO LONGER be in deletedFeedIds or deletedFeedFamilies
assert(!window.appState.deletedFeedIds.includes('feed-mais'), 'feed-mais should be untombstoned');
assert(!window.appState.deletedFeedFamilies.includes('mais'), 'family mais should be untombstoned');
console.log('✔ Test 1 passed: Feed expense with detected family "mais" created, stock added, untombstoned!');

// Test 2: Feed expense with empty title (auto-generated)
document.getElementById('expenseTitle').value = '';
document.getElementById('feedBagCount').value = '1';
document.getElementById('feedBagWeight').value = '50';
document.getElementById('feedBagPrice').value = '40';
document.getElementById('expenseFeedTypeSelect').value = '__new__';

app.handleSaveExpense({ preventDefault: () => {} });

assert.strictEqual(window.appState.expenses.length, 2);
const secondExp = window.appState.expenses[0];
assert(secondExp.title.includes('50kg'), `Auto-generated title should contain "50kg", got "${secondExp.title}"`);
console.log('✔ Test 2 passed: Empty title correctly auto-generates description:', secondExp.title);

console.log('\n🎉 ALL EXPENSE PURCHASE TESTS PASSED SUCCESSFULLY!');
