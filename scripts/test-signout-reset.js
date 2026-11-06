const fs = require('fs');

console.log('=== TEST: Sign-Out Zero-Reset & Privacy Isolation ===');

// Mock localStorage
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// Mock DOM elements
const mockElements = {
  headerUserText: { textContent: 'Ahmed Hajjem' },
  headerUserInitial: { innerHTML: 'AH' },
  mobileUserInitial: { innerHTML: 'AH' },
  badgeAnimals: { textContent: '38' },
  badgeExpenses: { textContent: '12' },
  badgeSales: { textContent: '5' },
  badgeIncubator: { textContent: '2' },
  kpiNetProfit: { textContent: '1,250.000 DT' },
  kpiTotalAnimals: { textContent: '38' }
};

global.document = {
  getElementById: (id) => mockElements[id] || null,
  querySelectorAll: () => []
};

// Mock appState
global.window = global;
global.appState = {
  userProfile: { name: 'Ahmed', email: 'ahmed@test.com', avatar: '👨‍🌾' },
  animals: [{ id: 'a1', species: 'poule', quantity: 30 }, { id: 'a2', species: 'vache_laitiere', quantity: 8 }],
  expenses: [{ id: 'e1', amount: 450 }],
  sales: [{ id: 's1', amount: 800 }],
  incubatorBatches: [{ id: 'b1', name: 'Couvée Nov' }],
  eggStock: 15,
  milkStock: 40,
  feedStockKg: 250,
  calendarEvents: [{ id: 'ev1', title: 'Vaccin' }]
};

// Store items in localStorage
localStorage.setItem('fermegest_state', JSON.stringify({ eggStock: 15, milkStock: 40 }));
localStorage.setItem('fermegest_user_profile', JSON.stringify({ name: 'Ahmed' }));
localStorage.setItem('fermegest_farm_code', 'FARM-9988');

// Mock app
global.app = {
  renderAll: () => {
    // Renders KPIs based on appState
    mockElements.badgeAnimals.textContent = String((window.appState.animals || []).length);
    mockElements.badgeIncubator.textContent = String((window.appState.incubatorBatches || []).length);
    mockElements.kpiTotalAnimals.textContent = String((window.appState.animals || []).reduce((sum, a) => sum + (a.quantity || 0), 0));
  },
  updateLivestockUIThemeAndVisibility: () => {},
  switchTab: (tab) => { console.log(`   [UI] Switched to tab: ${tab}`); },
  showToast: (msg) => { console.log(`   [Toast]: ${msg}`); }
};

// Load supabase-client.js
const supaCode = fs.readFileSync('supabase-client.js', 'utf8');
eval(supaCode);

console.log('1. Verifying initial authenticated state...');
if (window.appState.animals.length === 2 && window.appState.eggStock === 15) {
  console.log('   ✔ User has active farm data: 2 animal groups, 15 eggs stock, 40L milk');
} else {
  throw new Error('Initial state mismatch');
}

// Call resetLocalDataToZero
console.log('2. Executing appAuth.resetLocalDataToZero()...');
window.appAuth.resetLocalDataToZero();

// Verifications
console.log('3. Checking memory wipe:');
const state = window.appState;
if (state.animals.length === 0 && state.expenses.length === 0 && state.sales.length === 0 &&
    state.incubatorBatches.length === 0 && state.eggStock === 0 && state.milkStock === 0 &&
    state.userProfile === null && state.feedStockKg === null && state.calendarEvents.length === 0) {
  console.log('   ✔ All in-memory farm data reset cleanly to 0 / null / empty array');
} else {
  throw new Error('Memory was not reset to 0: ' + JSON.stringify(state));
}

console.log('4. Checking localStorage wipe:');
if (!localStorage.getItem('fermegest_state') &&
    !localStorage.getItem('fermegest_user_profile') &&
    !localStorage.getItem('fermegest_farm_code')) {
  console.log('   ✔ Private farm localStorage keys successfully removed');
} else {
  throw new Error('LocalStorage still contains private keys');
}

console.log('5. Checking UI reset:');
if (mockElements.headerUserText.textContent === '' &&
    mockElements.headerUserInitial.innerHTML === '👤' &&
    mockElements.badgeAnimals.textContent === '0' &&
    mockElements.kpiTotalAnimals.textContent === '0') {
  console.log('   ✔ UI cards, badges, and user header successfully reset to 0 / 👤');
} else {
  throw new Error('UI elements not reset to 0');
}

console.log('6. Checking cloud safety (Tombstone check):');
if (!window.appAuth._deletedIds || window.appAuth._deletedIds.size === 0) {
  console.log('   ✔ NO cloud deletion tombstones were created (Cloud data is safe in Supabase!)');
} else {
  throw new Error('Tombstones were created! This would risk cloud data deletion on sync!');
}

console.log('\n🎉 ALL ZERO-RESET TESTS PASSED 100%!');
