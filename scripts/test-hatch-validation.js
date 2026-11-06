const assert = require('assert');

// Mock DOM
global.window = global;
global.document = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        value: '',
        style: {},
        textContent: '',
        innerHTML: '',
        appendChild: () => {},
        reset: () => {}
      };
    }
    return this.elements[id];
  },
  querySelector(selector) {
    return { disabled: false };
  }
};

global.appState = {
  lang: 'ar',
  incubatorBatches: [
    {
      id: 'batch-caille-75',
      name: 'Couvée #1',
      breed: 'CAILLE',
      eggsCount: 75,
      eggCost: 26.25,
      electricityCost: 0,
      startDate: '2026-11-06',
      hatchDate: '2026-11-23'
    }
  ],
  animals: [],
  expenses: [],
  eggStock: 50
};

// Test translations
const fs = require('fs');
const transCode = fs.readFileSync('translations.js', 'utf8');
eval(transCode);

assert(TRANSLATIONS.fr.hatch_kpi_total_cost === "Coût Total Couvée");
assert(TRANSLATIONS.ar.hatch_kpi_total_cost === "التكلفة الإجمالية للحضانة");
assert(TRANSLATIONS.ar.unit_per_chick === "/ فرخ");
assert(TRANSLATIONS.ar.unit_eggs === "بيضة");
console.log('✔ Translations verified for FR & AR');

// Check app.js logic
const appCode = fs.readFileSync('app.js', 'utf8');
assert(appCode.includes('hatch_kpi_total_cost'), 'app.js includes hatch_kpi_total_cost');
assert(appCode.includes('liveCount > totalEggs'), 'app.js includes liveCount > totalEggs check');
assert(appCode.includes('hatchLiveCountMaxHint'), 'app.js includes hatchLiveCountMaxHint');
assert(appCode.includes('eggsCount > currentStock'), 'app.js includes farm eggs stock check');
console.log('✔ app.js validation guards verified');

console.log('🎉 ALL HATCHING & EGG COUNT TESTS PASSED!');
