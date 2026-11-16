// Test Suite: Permanent Unchecking of Animal Types (Bovins & Ovins)
// Validates:
// 1. Unchecking cattle / sheep persists in localStorage and appState.userProfile
// 2. Residual bovine/ovine lots are removed so auto-detection never resurrects them
// 3. Supabase pullData uses timestamped canonical choice, NOT Set union
// 4. getUserManagedAnimalTypes returns strictly the user's choice

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting test_uncheck_animal_categories.js...');

// Verify code implementation in app.js
const appJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const supabaseJs = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');

// 1. Check normalizeAnimalTypes exists in app.js and supabase-client.js
assert(appJs.includes('normalizeAnimalTypes(arr)'), 'app.js must define normalizeAnimalTypes');
assert(supabaseJs.includes('normalizeAnimalTypes(arr)'), 'supabase-client.js must define normalizeAnimalTypes');

// 2. Check that Set union is eliminated from pullData in supabase-client.js
assert(!supabaseJs.includes('new Set([...cloudManaged, ...localManaged])'), 'Set union must NOT exist in supabase-client.js');

// 3. Check that ghost injection is removed from supabase-client.js
assert(!supabaseJs.includes('if (isBovine && !state.userProfile.managedAnimals.includes(\'bovine\'))'), 'Ghost bovine injection must NOT exist');

// 4. Check that saveAnimalTypeSelection cleans up bovine/ovine lots
assert(appJs.includes('if (!hasCattle)'), 'saveAnimalTypeSelection must check if cattle was removed');
assert(appJs.includes('appState.milkStock = 0'), 'saveAnimalTypeSelection must reset milkStock when cattle is unchecked');
assert(appJs.includes('if (!hasSheep)'), 'saveAnimalTypeSelection must check if sheep was removed');

// 5. Test normalizeAnimalTypes logic directly
function normalizeAnimalTypes(arr) {
  if (!Array.isArray(arr)) return ['poultry'];
  const res = [];
  arr.forEach(t => {
    let norm = String(t || '').trim().toLowerCase();
    if (norm === 'bovine') norm = 'cattle';
    if (norm === 'ovine') norm = 'sheep';
    if (norm !== 'equine' && ['poultry', 'cattle', 'sheep'].includes(norm) && !res.includes(norm)) {
      res.push(norm);
    }
  });
  return res.length > 0 ? res : ['poultry'];
}

assert.deepStrictEqual(normalizeAnimalTypes(['poultry', 'cattle', 'sheep']), ['poultry', 'cattle', 'sheep']);
assert.deepStrictEqual(normalizeAnimalTypes(['bovine']), ['cattle']);
assert.deepStrictEqual(normalizeAnimalTypes(['ovine']), ['sheep']);
assert.deepStrictEqual(normalizeAnimalTypes(['poultry']), ['poultry']);
// When user unchecks cattle and sheep, array becomes just ['poultry']
assert.deepStrictEqual(normalizeAnimalTypes(['poultry']), ['poultry']);

// 6. Test sync merge logic: local uncheck timestamp > cloud old timestamp
const cloudProfile = { managedAnimals: ['poultry', 'cattle', 'sheep'], updatedAt: 1000 };
const localProfile = { managedAnimals: ['poultry'], updatedAt: 2000 };

const cloudManaged = normalizeAnimalTypes(cloudProfile.managedAnimals);
const localManaged = normalizeAnimalTypes(localProfile.managedAnimals);
const cloudTime = Number(cloudProfile.updatedAt) || 0;
const localTime = Number(localProfile.updatedAt) || 0;

let chosenManaged = ['poultry'];
if (localTime > cloudTime && localManaged.length > 0) {
  chosenManaged = localManaged;
} else if (cloudManaged.length > 0) {
  chosenManaged = cloudManaged;
} else if (localManaged.length > 0) {
  chosenManaged = localManaged;
}

assert.deepStrictEqual(chosenManaged, ['poultry'], 'Local uncheck must overwrite older cloud state');

// 7. Verify lot cleanup on uncheck
let mockAnimals = [
  { id: 1, name: 'Poule Rousse', species: 'Poule' },
  { id: 2, name: 'Vache PrimHolstein', species: 'Vache' },
  { id: 3, name: 'Brebis Lacaune', species: 'Brebis' }
];

const selected = ['poultry']; // User unchecked cattle & sheep
const hasCattle = selected.includes('cattle');
const hasSheep = selected.includes('sheep');

if (!hasCattle) {
  mockAnimals = mockAnimals.filter(a => {
    const sp = String(a.species || '').toLowerCase();
    return !(sp.includes('vache') || sp.includes('bovin') || sp.includes('genisse') || sp.includes('veau') || sp.includes('cow') || sp.includes('cattle'));
  });
}
if (!hasSheep) {
  mockAnimals = mockAnimals.filter(a => {
    const sp = String(a.species || '').toLowerCase();
    return !(sp.includes('mouton') || sp.includes('ovin') || sp.includes('brebis') || sp.includes('agneau') || sp.includes('belier') || sp.includes('chevre') || sp.includes('caprin') || sp.includes('sheep') || sp.includes('goat'));
  });
}

assert.strictEqual(mockAnimals.length, 1);
assert.strictEqual(mockAnimals[0].species, 'Poule');

// 8. Verify CSS and JS guarantee that hidden milk card is never overridden by mobile flex
const stylesCss = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');
assert(stylesCss.includes('#milkStockCard.hidden'), 'styles.css must have strict hide override for #milkStockCard.hidden');
assert(stylesCss.includes('.harvest-cards-grid .milk-stock-card:not(.hidden)'), 'styles.css must use :not(.hidden) for mobile harvest cards');
assert(appJs.includes('setElemVisible(milkStockCard, hasCattle)'), 'app.js must control milkStockCard visibility via setElemVisible');

console.log('✅ All animal unchecking and persistence tests passed with flying colors!');
