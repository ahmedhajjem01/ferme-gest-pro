const fs = require('fs');
const assert = require('assert');

console.log('=== TEST: MODAL DAILY MILK & KPI DYNAMICS ===');

// Mock DOM
const elements = {};
global.document = {
  readyState: 'loading',
  createElement: () => ({ style: {}, appendChild: () => {}, textContent: '' }),
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
        children: [],
        options: [{ value: 'all', text: 'All', getAttribute: () => null }],
        selectedIndex: 0,
        classList: {
          classes: new Set(['hidden']),
          add: function(c) { this.classes.add(c); },
          remove: function(c) { this.classes.delete(c); },
          contains: function(c) { return this.classes.has(c); },
          toggle: function(c, val) { if (val) this.classes.add(c); else this.classes.delete(c); }
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        removeAttribute: () => {},
        setAttribute: () => {},
        reset: () => {},
        remove: () => {},
        focus: () => {},
        select: () => {},
        addEventListener: () => {}
      };
    }
    return elements[id];
  },
  querySelector: (sel) => {
    return document.getElementById(sel.replace(/[^a-zA-Z0-9_-]/g, ''));
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.window = {
  addEventListener: () => {},
  appAuth: {
    removeDeletedId: () => {},
    pushData: () => {}
  }
};
global.localStorage = {
  store: {},
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = String(v); },
  removeItem: function(k) { delete this.store[k]; }
};

// Load app.js and translations.js
let appCode = fs.readFileSync('app.js', 'utf8');
appCode = appCode.replace('const app = {', 'global.app = {');
eval(appCode);

let transCode = fs.readFileSync('translations.js', 'utf8');
transCode = transCode.replace('const TRANSLATIONS =', 'global.TRANSLATIONS =');
eval(transCode);
window.TRANSLATIONS = global.TRANSLATIONS;
app.t = function(key, params) {
  const lang = window.appState.lang || 'fr';
  let str = (global.TRANSLATIONS[lang] && global.TRANSLATIONS[lang][key]) || key;
  if (params) {
    Object.keys(params).forEach(k => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
    });
  }
  return str;
};
app.showToast = () => {};

// Test 1: User with both Cattle and Poultry
window.appState.userProfile = { managedAnimals: ['poultry', 'cattle'] };
window.appState.animals = [
  { id: 'lot-1', species: 'vache_laitiere', currentQuantity: 10, name: 'Vaches Noires' },
  { id: 'lot-2', species: 'poule_pondeuse', currentQuantity: 50, name: 'Pondeuses ISA' }
];

const managed = app.getUserManagedAnimalTypes();
assert(managed.includes('poultry'), 'Should include poultry');
assert(managed.includes('cattle'), 'Should include cattle');
console.log('✔ Test 1 passed: getUserManagedAnimalTypes correctly includes both poultry and cattle:', managed);

// Test 2: UI Visibility for both
app.updateLivestockUIThemeAndVisibility();
const eggCard = document.getElementById('eggStockCard');
const milkCard = document.getElementById('milkStockCard');
assert.strictEqual(eggCard.style.display, '', 'Egg card should be visible');
assert.strictEqual(milkCard.style.display, '', 'Milk card should be visible');
console.log('✔ Test 2 passed: Both eggStockCard and milkStockCard are visible when both species selected!');

// Test 3: Open Daily Milk Modal
const milkModal = document.getElementById('modalDailyMilk');
assert(milkModal.classList.contains('hidden'), 'Milk modal initially hidden');
app.openDailyMilkModal();
assert(!milkModal.classList.contains('hidden'), 'Milk modal must be visible (hidden class removed)');
console.log('✔ Test 3 passed: openDailyMilkModal() successfully displays modalDailyMilk!');

// Test 4: Save Daily Milk Harvest (25 Liters)
document.getElementById('dailyMilkLiters').value = '25';
document.getElementById('dailyMilkDate').value = '2026-11-06';
document.getElementById('dailyMilkingSession').value = 'matin';
document.getElementById('dailyMilkTargetLot').value = 'lot-1';

app.handleSaveDailyMilk({ preventDefault: () => {} });
assert.strictEqual(window.appState.milkStock, 25, 'Milk stock should be 25 Liters');
assert.strictEqual(window.appState.milkHarvests.length, 1, 'Should have 1 milk harvest record');
assert.strictEqual(window.appState.milkHarvests[0].liters, 25);
console.log('✔ Test 4 passed: handleSaveDailyMilk() successfully recorded 25 L milk harvest!');

// Test 5: Check KPI unit for cattle only
window.appState.userProfile = { managedAnimals: ['cattle'] };
window.appState.animals = [
  { id: 'lot-1', species: 'vache_laitiere', currentQuantity: 10, name: 'Vaches Noires' }
];
window.appState.lang = 'ar';
app.renderDashboard();
const kpiAnimals = document.getElementById('kpiTotalAnimals');
console.log('KPI Animals text in Arabic for Cattle:', kpiAnimals.textContent);
assert(!kpiAnimals.textContent.includes('طائر'), 'Should NOT say "طائر" for cattle!');
assert(kpiAnimals.textContent.includes('رأس'), 'Should say "رأس" for cattle!');
console.log('✔ Test 5 passed: KPI text in Arabic displays "10 رأس" and NOT "10 طائر"!');

// Test 6: Check Day Events Modal Couveuse Button
app.showDayEvents('2026-11-06');
const btnIncubator = document.getElementById('btnDayEventIncubator');
// With only cattle, incubator button is hidden
assert.strictEqual(btnIncubator.style.display, 'none');

// With poultry, incubator button is visible
window.appState.userProfile = { managedAnimals: ['poultry'] };
app.showDayEvents('2026-11-06');
assert.strictEqual(btnIncubator.style.display, '');
console.log('✔ Test 6 passed: btnDayEventIncubator dynamically toggles based on poultry ownership!');

console.log('\n🎉 ALL 6 HARVEST, KPI & CALENDAR TESTS PASSED SUCCESSFULLY!');
