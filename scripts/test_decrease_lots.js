const fs = require('fs');
const path = require('path');

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] !== undefined ? store[k] : null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

const domElements = {};
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    value: '',
    textContent: '',
    innerHTML: '',
    style: {},
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); }
    },
    setAttribute() {},
    getAttribute() { return null; },
    removeAttribute() {},
    appendChild(child) { return child; },
    remove() {},
    addEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null
  };
}

global.document = {
  documentElement: { setAttribute: () => {}, getAttribute: () => 'fr' },
  getElementById: (id) => {
    if (!domElements[id]) domElements[id] = createMockElement(id);
    return domElements[id];
  },
  querySelector: (sel) => {
    const idMatch = sel.match(/#([\w\-]+)/);
    if (idMatch) return document.getElementById(idMatch[1]);
    return createMockElement('sel_' + Math.random().toString(36).substr(2, 4));
  },
  querySelectorAll: () => [],
  createElement: (tag) => createMockElement('created_' + Math.random().toString(36).substr(2, 4), tag),
  addEventListener: () => {}
};

let pushDataCalled = false;
global.window = {
  addEventListener: () => {},
  location: { origin: 'http://localhost', pathname: '/' },
  appAuth: {
    getDeletedIds: () => new Set(),
    pushData: async () => { pushDataCalled = true; }
  }
};

// Load app.js
const appJsPath = path.join(__dirname, '..', 'app.js');
let appJsCode = fs.readFileSync(appJsPath, 'utf8');
appJsCode = appJsCode.replace('const appState =', 'global.appState =');
appJsCode = appJsCode.replace(/app\.init\(\);/g, "// no init");
appJsCode = appJsCode.replace('const app = {', 'global.app = {');
eval(appJsCode);

console.log('='.repeat(70));
console.log('🧪 TEST: DECREASE ALL LOTS COST BY 4 DT & CLOUD SYNC');
console.log('='.repeat(70));

appState.animals = [
  { id: 'lot-1', name: 'Poules Pondeuses A', quantity: 100, initialQuantity: 100, costPerHead: 15.0, totalCost: 1500.0 },
  { id: 'lot-2', name: 'Poulets Chair B', quantity: 50, initialQuantity: 50, costPerHead: 8.5, totalCost: 425.0 },
  { id: 'lot-3', name: 'Poussins C', quantity: 200, initialQuantity: 200, costPerHead: 3.0, totalCost: 600.0 } // Under 4 DT -> should become 0 DT
];

appState.expenses = [
  { id: 'exp-1', category: 'animaux', animalLotId: 'lot-1', title: 'Achat Poules Pondeuses A', unitPrice: 15.0, total: 1500.0 },
  { id: 'exp-2', category: 'animaux', animalLotId: 'lot-2', title: 'Achat Poulets Chair B', unitPrice: 8.5, total: 425.0 }
];

// Mock confirmDialog to auto-confirm
app.confirmDialog = function(opts) {
  if (opts && typeof opts.onConfirm === 'function') {
    opts.onConfirm();
  }
};
app.renderAll = function() {};
app.showToast = function() {};

// Execute action
app.decreaseAllLotsCostBy4DT().then(() => {
  console.log('Lot 1 new cost:', appState.animals[0].costPerHead, 'Total:', appState.animals[0].totalCost);
  console.log('Lot 2 new cost:', appState.animals[1].costPerHead, 'Total:', appState.animals[1].totalCost);
  console.log('Lot 3 new cost:', appState.animals[2].costPerHead, 'Total:', appState.animals[2].totalCost);

  if (appState.animals[0].costPerHead === 11.0 && appState.animals[0].totalCost === 1100.0) {
    console.log('✔ Lot 1 decreased from 15 DT to 11 DT (Total 1100 DT)');
  } else {
    console.error('❌ Lot 1 failed');
    process.exit(1);
  }

  if (appState.animals[1].costPerHead === 4.5 && appState.animals[1].totalCost === 225.0) {
    console.log('✔ Lot 2 decreased from 8.5 DT to 4.5 DT (Total 225 DT)');
  } else {
    console.error('❌ Lot 2 failed');
    process.exit(1);
  }

  if (appState.animals[2].costPerHead === 0.0 && appState.animals[2].totalCost === 0.0) {
    console.log('✔ Lot 3 decreased from 3.0 DT to 0 DT floor (Total 0 DT)');
  } else {
    console.error('❌ Lot 3 failed');
    process.exit(1);
  }

  if (appState.expenses[0].unitPrice === 11.0 && appState.expenses[0].total === 1100.0) {
    console.log('✔ Expense 1 updated in treasury');
  } else {
    console.error('❌ Expense 1 update failed');
    process.exit(1);
  }

  if (pushDataCalled) {
    console.log('✔ pushDataCalled successfully triggered to sync on Supabase!');
  } else {
    console.error('❌ pushData was not called');
    process.exit(1);
  }

  console.log('\n🎉 TEST PASSED 100%!');
});
