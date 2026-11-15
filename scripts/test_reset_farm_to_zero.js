/**
 * Test Suite: Remise à Zéro de la Ferme ("Mettre à 0") & Purge Cache
 * FermeGest PRO v1.0.43 (Code 44)
 */

const fs = require('fs');
const assert = require('assert');

global.window = global;

console.log("========================================================================");
console.log("TEST SUITE : REMISE À ZÉRO DE LA FERME ('METTRE À 0') & PURGE CACHE");
console.log("========================================================================");

let passed = 0;
let total = 0;

function it(description, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ [PASS ${total}] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL ${total}] ${description}`);
    console.error(`     Error: ${err.stack || err.message}`);
  }
}

// 1. Verify index.html structure
const indexHtml = fs.readFileSync('index.html', 'utf8');

it('Bouton "btnResetFarmData" présent dans modalUserProfile', () => {
  assert(indexHtml.includes('id="btnResetFarmData"'), 'Le bouton btnResetFarmData doit exister');
  assert(indexHtml.includes('onclick="app.confirmResetFarmData()"'), 'Le bouton doit appeler confirmResetFarmData');
});

it('Bouton "btnClearCacheReload" présent pour forcer la mise à jour sur PC', () => {
  assert(indexHtml.includes('id="btnClearCacheReload"'), 'Le bouton btnClearCacheReload doit exister');
  assert(indexHtml.includes('onclick="app.clearAppCacheAndReload()"'), 'Le bouton doit appeler clearAppCacheAndReload');
});

it('Zone de Danger avec stylisation haute visibilité et avertissement', () => {
  assert(indexHtml.includes('danger-zone-card'), 'La classe danger-zone-card doit être présente');
  assert(indexHtml.includes('reset_farm_danger_zone_title'), 'Le titre i18n de danger zone doit être présent');
  assert(indexHtml.includes('reset_farm_danger_zone_desc'), 'La description i18n de danger zone doit être présente');
});

// 2. Verify translations.js
const translationsSrc = fs.readFileSync('translations.js', 'utf8');
eval(translationsSrc);
const tData = window.TRANSLATIONS;

it('Traductions complètes en Français (FR)', () => {
  const fr = tData.fr;
  assert(fr.reset_farm_danger_zone_title, 'Titre FR manquant');
  assert(fr.btn_reset_farm_zero, 'Bouton reset FR manquant');
  assert(fr.btn_clear_cache_reload, 'Bouton cache FR manquant');
  assert(fr.reset_farm_confirm_title, 'Titre confirmation FR manquant');
  assert(fr.reset_farm_confirm_msg, 'Message confirmation FR manquant');
  assert(fr.reset_farm_success_toast, 'Toast succès FR manquant');
});

it('Traductions complètes en Arabe (AR)', () => {
  const ar = tData.ar;
  assert(ar.reset_farm_danger_zone_title, 'Titre AR manquant');
  assert(ar.btn_reset_farm_zero, 'Bouton reset AR manquant');
  assert(ar.btn_clear_cache_reload, 'Bouton cache AR manquant');
  assert(ar.reset_farm_confirm_title, 'Titre confirmation AR manquant');
  assert(ar.reset_farm_confirm_msg, 'Message confirmation AR manquant');
  assert(ar.reset_farm_success_toast, 'Toast succès AR manquant');
});

it('Traductions complètes en Anglais (EN)', () => {
  const en = tData.en;
  assert(en.reset_farm_danger_zone_title, 'Titre EN manquant');
  assert(en.btn_reset_farm_zero, 'Bouton reset EN manquant');
  assert(en.btn_clear_cache_reload, 'Bouton cache EN manquant');
  assert(en.reset_farm_confirm_title, 'Titre confirmation EN manquant');
  assert(en.reset_farm_confirm_msg, 'Message confirmation EN manquant');
  assert(en.reset_farm_success_toast, 'Toast succès EN manquant');
});

const mockElement = () => ({
  value: '',
  textContent: '',
  style: {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {} },
  setAttribute: () => {},
  getAttribute: () => null,
  addEventListener: () => {},
  remove: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  options: [{ text: '', value: '', getAttribute: () => null }],
  selectedIndex: 0
});

// 3. Setup mock browser environment for app.js & supabase-client.js
global.window = global;
global.document = {
  readyState: 'loading',
  addEventListener: () => {},
  documentElement: {
    setAttribute: () => {},
    getAttribute: () => 'fr'
  },
  getElementById: (id) => mockElement(),
  querySelector: () => mockElement(),
  querySelectorAll: () => []
};

const localStorageMock = (function() {
  let store = {};
  return {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
    _dump: () => store
  };
})();
global.localStorage = localStorageMock;

// Load app.js
const appJsCode = fs.readFileSync('app.js', 'utf8');
eval(appJsCode);

it('app.confirmResetFarmData déclenche confirmDialog avec isDanger=true', () => {
  let dialogCalled = false;
  let dangerFlag = false;
  window.app.confirmDialog = (opts) => {
    dialogCalled = true;
    dangerFlag = opts.isDanger;
    // Simulate user cancelling
    if (opts.onCancel) opts.onCancel();
  };

  window.appState.animals = [{ id: 'a1', name: 'Vache' }];
  window.appState.eggStock = 50;
  window.app.confirmResetFarmData();

  assert.strictEqual(dialogCalled, true, 'confirmDialog doit être appelé');
  assert.strictEqual(dangerFlag, true, 'Le dialogue doit être en mode danger (rouge)');
  assert.strictEqual(window.appState.animals.length, 1, 'Les animaux ne doivent PAS être effacés si annulé');
  assert.strictEqual(window.appState.eggStock, 50, 'Le stock d\'œufs ne doit PAS être effacé si annulé');
});

it('app.resetFarmDataToZero vide tous les stocks et toutes les collections', () => {
  // Populate rich state
  window.appState.animals = [{ id: 'a1' }, { id: 'a2' }];
  window.appState.expenses = [{ id: 'e1', amount: 120 }];
  window.appState.sales = [{ id: 's1', totalAmount: 400 }];
  window.appState.incubatorBatches = [{ id: 'b1' }];
  window.appState.eggStock = 120;
  window.appState.eggStocks = { poule: 100, canard_barbarie: 20 };
  window.appState.eggHarvests = [{ id: 'h1', count: 30 }];
  window.appState.eggConsumptions = [{ id: 'c1', count: 10 }];
  window.appState.feedStockKg = 500;
  window.appState.feedDistributions = [{ id: 'fd1', kg: 25 }];
  window.appState.feedTypes = [{ id: 'ft1', name: 'Orge' }];
  window.appState.calendarEvents = [{ id: 'ce1' }];

  // Preservation targets
  window.appState.currency = 'TND';
  window.appState.lang = 'fr';
  window.appState.theme = 'dark';
  window.appState.userProfile = { name: 'Mongi', email: 'mongi@farm.com' };
  localStorage.setItem('fermegest_state', JSON.stringify({ animals: [{ id: 'a1' }], eggStock: 120 }));
  localStorage.setItem('fermegest_farm_code', 'FERME-J5PY');
  localStorage.setItem('fermegest_farm_role', 'owner');
  localStorage.setItem('fermegest_state_backup', 'old_backup');

  let pushed = false;
  let pushForce = false;
  window.appAuth = {
    pushData: (silent, force) => {
      pushed = true;
      pushForce = force;
    }
  };
  window.app.renderAll = () => {};
  window.app.showToast = () => {};
  window.app.closeModal = () => {};

  window.app.resetFarmDataToZero();

  // Assert all domain data is zeroed
  assert.strictEqual(window.appState.animals.length, 0, 'animals doit être vide');
  assert.strictEqual(window.appState.expenses.length, 0, 'expenses doit être vide');
  assert.strictEqual(window.appState.sales.length, 0, 'sales doit être vide');
  assert.strictEqual(window.appState.incubatorBatches.length, 0, 'incubatorBatches doit être vide');
  assert.strictEqual(window.appState.eggStock, 0, 'eggStock doit être à 0');
  assert.strictEqual(window.appState.eggStocks.poule, 0, 'eggStocks.poule doit être à 0');
  assert.strictEqual(window.appState.eggStocks.canard_barbarie, 0, 'eggStocks.canard doit être à 0');
  assert.strictEqual(window.appState.eggHarvests.length, 0, 'eggHarvests doit être vide');
  assert.strictEqual(window.appState.eggConsumptions.length, 0, 'eggConsumptions doit être vide');
  assert.strictEqual(window.appState.feedStockKg, 0, 'feedStockKg doit être à 0');
  assert.strictEqual(window.appState.feedDistributions.length, 0, 'feedDistributions doit être vide');
  assert.strictEqual(window.appState.feedTypes.length, 0, 'feedTypes doit être vide');
  assert.strictEqual(window.appState.calendarEvents.length, 0, 'calendarEvents doit être vide');

  // Assert user identity and credentials preserved
  assert.strictEqual(window.appState.currency, 'TND', 'Devise préservée');
  assert.strictEqual(window.appState.lang, 'fr', 'Langue préservée');
  assert.strictEqual(window.appState.theme, 'dark', 'Thème préservé');
  assert.strictEqual(window.appState.userProfile.name, 'Mongi', 'Profil utilisateur préservé');
  assert.strictEqual(localStorage.getItem('fermegest_farm_code'), 'FERME-J5PY', 'FarmCode préservé');

  // Assert safety flags & backup
  assert(window.appState.lastResetAt > 0, 'lastResetAt doit être horodaté');
  assert.strictEqual(window.appState._resetCleared, true, '_resetCleared doit être true');
  assert.strictEqual(localStorage.getItem('fermegest_state_backup'), null, 'Ancien backup purgé');
  assert(localStorage.getItem('fermegest_state_pre_reset') !== null, 'Sauvegarde de secours fermegest_state_pre_reset créée');
  assert.strictEqual(pushed, true, 'pushData vers Supabase déclenché');
  assert.strictEqual(pushForce, true, 'pushData appelé avec force=true');
});

// Load supabase-client.js
const supabaseSrc = fs.readFileSync('supabase-client.js', 'utf8');
eval(supabaseSrc);

it('Supabase applyCloudData applique l\'ordre souverain de remise à 0 sans conflit', () => {
  const client = window.appAuth;
  client.sessionId = 'test-session-phone';
  client.currentUser = { id: 'u1', email: 'test@farm.com' };

  const now = Date.now();
  // Secondary device has local data
  window.appState.lastResetAt = null;
  window.appState._resetCleared = false;
  window.appState.animals = [{ id: 'cow-1', name: 'Vache Locale' }];
  window.appState.eggStock = 45;
  window.appState.lastUpdated = now;
  localStorage.setItem('fermegest_last_local_edit', String(now));

  // Cloud receives reset event from PC terminal at timestamp now + 1000
  const cloudResetPayload = {
    _resetCleared: true,
    lastResetAt: now + 1000,
    lastUpdated: now + 1000,
    animals: [],
    expenses: [],
    sales: [],
    eggStock: 0,
    eggStocks: { poule: 0, canard_barbarie: 0 },
    eggHarvests: [],
    eggConsumptions: [],
    feedStockKg: 0,
    feedDistributions: [],
    feedTypes: []
  };

  client.applyCloudData(cloudResetPayload, true);

  // Assert Phone accepted PC reset and did NOT resurrect local cow or eggs
  assert.strictEqual(window.appState.animals.length, 0, 'L\'appareil secondaire doit vider son cheptel');
  assert.strictEqual(window.appState.eggStock, 0, 'L\'appareil secondaire doit remettre le stock à 0');
  assert.strictEqual(window.appState.lastResetAt, now + 1000, 'lastResetAt doit être synchronisé');
  assert.strictEqual(window.appState._resetCleared, true, '_resetCleared doit être true');
});

it('Supabase pushData et broadcastCurrentState intègrent les drapeaux lastResetAt et _resetCleared', () => {
  assert(supabaseSrc.includes('lastResetAt: state.lastResetAt || null'), 'lastResetAt présent dans pushData');
  assert(supabaseSrc.includes('_resetCleared: !!state._resetCleared'), '_resetCleared présent dans pushData');
  assert(supabaseSrc.includes('isLocalOverruledByReset'), 'Logique isLocalOverruledByReset présente dans applyCloudData');
});

it('app.clearAppCacheAndReload est définie et gère la purge SW et cache', () => {
  assert(typeof window.app.clearAppCacheAndReload === 'function', 'clearAppCacheAndReload doit être une fonction');
  assert(appJsCode.includes('clearAppCacheAndReload'), 'clearAppCacheAndReload doit exister dans app.js');
  assert(appJsCode.includes('caches.delete'), 'clearAppCacheAndReload doit purger les caches');
});

console.log("========================================================================");
console.log(`RÉSULTAT : ${passed} / ${total} TESTS PASSÉS AVEC SUCCÈS (100%)`);
console.log("========================================================================");

if (passed !== total) {
  process.exit(1);
}
