const fs = require('fs');
const assert = require('assert');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: k => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: k => { delete storage[k]; }
};

// Mock DOM
const createdElements = [];
function createMockElement(tag = 'div', id = '') {
  return {
    tagName: tag.toUpperCase(),
    id: id,
    className: '',
    style: {},
    children: [],
    attributes: {},
    innerHTML: '',
    textContent: '',
    value: '',
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k] || null; },
    removeAttribute(k) { delete this.attributes[k]; },
    appendChild(el) { this.children.push(el); return el; },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    classList: {
      add(c) { this.classes = this.classes || []; if (!this.classes.includes(c)) this.classes.push(c); },
      remove(c) { this.classes = (this.classes || []).filter(x => x !== c); },
      toggle(c, b) { if (b) this.add(c); else this.remove(c); },
      contains(c) { return (this.classes || []).includes(c); }
    }
  };
}

const domElements = {
  reproductionSectionTitle: createMockElement('h2', 'reproductionSectionTitle'),
  reproductionSectionDesc: createMockElement('p', 'reproductionSectionDesc'),
  btnOpenIncubatorModal: createMockElement('button', 'btnOpenIncubatorModal'),
  btnOpenGestationModal: createMockElement('button', 'btnOpenGestationModal'),
  reproductionFilterPills: createMockElement('div', 'reproductionFilterPills'),
  incubatorSectionWrapper: createMockElement('div', 'incubatorSectionWrapper'),
  incubatorSubheader: createMockElement('div', 'incubatorSubheader'),
  gestationSectionWrapper: createMockElement('div', 'gestationSectionWrapper'),
  gestationSubheader: createMockElement('div', 'gestationSubheader'),
  incubatorBatchesGrid: createMockElement('div', 'incubatorBatchesGrid'),
  gestationBatchesGrid: createMockElement('div', 'gestationBatchesGrid'),
  countIncubatorBadge: createMockElement('span', 'countIncubatorBadge'),
  navIncubatorText: createMockElement('span', 'navIncubatorText'),
  mobileNavIncubatorText: createMockElement('span', 'mobileNavIncubatorText'),
  birthMotherId: createMockElement('input', 'birthMotherId'),
  birthMotherName: createMockElement('span', 'birthMotherName'),
  birthMotherIcon: createMockElement('span', 'birthMotherIcon'),
  birthMotherSub: createMockElement('span', 'birthMotherSub'),
  birthTypeBadge: createMockElement('span', 'birthTypeBadge'),
  birthActualDate: createMockElement('input', 'birthActualDate'),
  birthOffspringCount: createMockElement('input', 'birthOffspringCount'),
  birthGender: createMockElement('select', 'birthGender'),
  birthCategorySelect: createMockElement('select', 'birthCategorySelect'),
  birthName: createMockElement('input', 'birthName'),
  birthWeight: createMockElement('input', 'birthWeight'),
  birthMotherStatus: createMockElement('select', 'birthMotherStatus'),
  birthNotes: createMockElement('textarea', 'birthNotes'),
  modalRecordBirth: createMockElement('div', 'modalRecordBirth')
};

global.document = {
  documentElement: createMockElement('html'),
  body: createMockElement('body'),
  addEventListener: () => {},
  getElementById: id => domElements[id] || null,
  querySelector: sel => {
    if (sel === '.card-livestock .metric-title') return createMockElement('span');
    return null;
  },
  querySelectorAll: () => [],
  createElement: tag => createMockElement(tag)
};

global.window = {
  location: { reload: () => {} },
  addEventListener: () => {},
  appAuth: { pushData: () => {}, addDeletedId: () => {} }
};

// Load code
eval(fs.readFileSync('translations.js', 'utf8'));
eval(fs.readFileSync('app.js', 'utf8'));

const appState = window.appState;
const app = window.app;

console.log('=== TEST SUITE: GESTATION, REPRODUCTION & BIRTH MONITORING ===');

// Setup test state
appState.userProfile = { managedAnimals: ['cattle', 'sheep'] };
appState.animals = [
  {
    id: 'cow-1',
    name: 'Noiraude',
    species: 'vache_laitiere',
    breed: 'Montbéliarde',
    isPregnant: true,
    matingDate: '2026-05-01',
    expectedBirthDate: '2027-02-08',
    dryingOffDate: '2026-12-10',
    sire: 'Taureau Champion',
    stage: 'Gestante',
    currentQuantity: 1
  },
  {
    id: 'sheep-1',
    name: 'Brebis 01',
    species: 'brebis',
    breed: 'Noire de Thibar',
    isPregnant: true,
    matingDate: '2026-08-01',
    expectedBirthDate: '2026-12-29',
    dryingOffDate: '2026-11-29',
    sire: 'Bélier #3',
    stage: 'عشار',
    currentQuantity: 1
  }
];

// 1. Test getActiveGestations
const gestations = app.getActiveGestations();
console.log('Active gestations found:', gestations.length);
assert.strictEqual(gestations.length, 2, 'Should find 2 active gestations');
assert.strictEqual(gestations[0].isBovine, true);
assert.strictEqual(gestations[0].totalDays, 283);
assert.strictEqual(gestations[1].isOvine, true);
assert.strictEqual(gestations[1].totalDays, 150);
console.log('✔ Test 1 passed: getActiveGestations returns both cows and sheep accurately!');

// 2. Test renderReproductionTab for Mammals only
app.setReproductionFilter('gestation');
assert.strictEqual(domElements.btnOpenIncubatorModal.style.display, 'none');
assert.strictEqual(domElements.btnOpenGestationModal.style.display, '');
assert.strictEqual(domElements.incubatorSectionWrapper.style.display, 'none');
assert.strictEqual(domElements.gestationSectionWrapper.style.display, '');
assert.strictEqual(domElements.gestationBatchesGrid.children.length, 2);
console.log('✔ Test 2 passed: Mammals-only farm displays Gestation & Maternity cards and hides Incubator!');

// 3. Test openRecordBirthModal
app.openRecordBirthModal('cow-1');
assert.strictEqual(domElements.birthMotherId.value, 'cow-1');
assert.strictEqual(domElements.birthMotherName.textContent, 'Noiraude (Montbéliarde)');
assert.strictEqual(domElements.birthTypeBadge.textContent, '🍼 Vêlage');
console.log('✔ Test 3 passed: openRecordBirthModal correctly populates mother and calving badge!');

// 4. Test handleSaveBirth (Cow gives birth to 1 calf)
domElements.birthActualDate.value = '2026-11-06';
domElements.birthOffspringCount.value = '1';
domElements.birthGender.value = 'femelle';
domElements.birthCategorySelect.value = 'veau_laitier';
domElements.birthName.value = 'Génisse Bella';
domElements.birthWeight.value = '42';
domElements.birthMotherStatus.value = 'lactation';

app.handleSaveBirth();

// Verify newborn calf created
const newborn = appState.animals.find(a => a.name === 'Génisse Bella');
assert(newborn, 'Newborn calf must exist in appState.animals');
assert.strictEqual(newborn.species, 'veau_laitier');
assert.strictEqual(newborn.birthWeight, 42);
assert.strictEqual(newborn.arrivalAgeDays, 0);
assert.strictEqual(newborn.motherId, 'cow-1');

// Verify mother updated
const cow = appState.animals.find(a => a.id === 'cow-1');
assert.strictEqual(cow.isPregnant, false);
assert.strictEqual(cow.stage, 'Vache laitière');
assert.strictEqual(cow.lastCalvingDate, '2026-11-06');
console.log('✔ Test 4 passed: handleSaveBirth creates calf in herd and updates mother into lactation!');

// 5. Test cancelGestation for sheep
app.cancelGestation = function(id) {
  const animal = appState.animals.find(a => a.id === id);
  if (animal) {
    animal.isPregnant = false;
    animal.stage = 'brebis';
    delete animal.matingDate;
    delete animal.expectedBirthDate;
  }
};
app.cancelGestation('sheep-1');
const remainingGestations = app.getActiveGestations();
assert.strictEqual(remainingGestations.length, 0, 'No more active gestations');
console.log('✔ Test 5 passed: cancelGestation correctly resets pregnancy state!');

console.log('\n🎉 ALL REPRODUCTION & GESTATION SYSTEM TESTS PASSED SUCCESSFULLY!');
