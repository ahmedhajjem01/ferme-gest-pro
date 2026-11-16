/**
 * Test Suite: Synchronisation Collaborative Souveraine & Bouton Déconnexion
 * Rôles vérifiés :
 * 1. Invité Mode Invité (non connecté) -> Reçoit 100% données proprio, 0 écriture Cloud
 * 2. Invité Mode Connecté -> Adopte 100% données proprio avant tout upsert
 * 3. Protection anti-écrasement -> Partenaire ne peut jamais pousser ni diffuser un cheptel vide
 * 4. Bouton Déconnexion (leaveSharedFarm) -> Quitte la ferme partagée proprement, redevient owner indépendant
 * 5. updateProfileModalUI -> Bascule correcte des sections (masquage formulaire de join quand partner, etc.)
 */

const assert = require('assert');

// Mock localStorage
const localStorageStore = {};
global.localStorage = {
  getItem: (k) => (k in localStorageStore ? localStorageStore[k] : null),
  setItem: (k, v) => { localStorageStore[k] = String(v); },
  removeItem: (k) => { delete localStorageStore[k]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

// Mock DOM
const domElements = {};
function mockElement(id) {
  if (!domElements[id]) {
    domElements[id] = {
      id: id,
      value: '',
      textContent: '',
      className: '',
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); }
      },
      style: {}
    };
  }
  return domElements[id];
}

global.document = {
  getElementById: (id) => mockElement(id)
};

// Mock window & app
global.window = {
  localStorage: global.localStorage,
  document: global.document,
  appState: {
    animals: [],
    eggStocks: { poule: 0, canard_barbarie: 0 },
    eggStock: 0,
    expenses: [],
    sales: [],
    feedDistributions: [],
    feedTypes: [],
    incubatorBatches: [],
    lastUpdated: 1000
  },
  app: {
    showToast: (msg, type) => {
      window.lastToast = { msg, type };
    },
    t: (k) => k,
    confirmDialog: ({ onConfirm }) => {
      if (onConfirm) onConfirm();
    },
    renderAll: () => {
      window.renderAllCalled = true;
    }
  }
};
global.app = global.window.app;
global.appState = global.window.appState;

// Load supabase-client.js
const fs = require('fs');
const content = fs.readFileSync('supabase-client.js', 'utf8');

// Extraire l'objet appAuth / SupabaseAuth
let authModuleCode = content
  .replace(/window\.supabaseClient\s*=\s*/g, 'global.mockSupabaseClientRef = ')
  .replace(/window\.appAuth\s*=\s*/g, 'global.testAppAuth = ');

eval(authModuleCode);
const appAuth = global.testAppAuth;

async function runTests() {
  console.log('🧪 DÉBUT DE LA SUITE DE TESTS : SYNCHRO COLLABORATIVE & BOUTON DÉCONNEXION');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ Test ${total} : ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ Test ${total} FAILED : ${name}`);
      console.error(err);
      process.exit(1);
    }
  }

  // Initialisation du mock client Supabase
  let dbRows = [];
  let upsertCalls = [];
  let realtimeBroadcasts = [];

  const mockClient = {
    from: (table) => {
      return {
        select: (cols) => {
          let filtered = [...dbRows];
          const query = {
            contains: (col, val) => {
              if (col === 'data' && val && val.farmCode) {
                filtered = filtered.filter(r => r.data && r.data.farmCode === val.farmCode);
              }
              return query;
            },
            eq: (col, val) => {
              filtered = filtered.filter(r => r[col] === val);
              return query;
            },
            order: (col, opts) => query,
            maybeSingle: async () => ({ data: filtered[0] || null, error: null }),
            then: (resolve) => resolve({ data: filtered, error: null })
          };
          return query;
        },
        upsert: async (payload, opts) => {
          upsertCalls.push(payload);
          const idx = dbRows.findIndex(r => r.user_id === payload.user_id);
          if (idx >= 0) dbRows[idx] = payload;
          else dbRows.push(payload);
          return { data: payload, error: null };
        }
      };
    },
    channel: (chName) => {
      return {
        on: function() { return this; },
        subscribe: function(cb) {
          if (cb) cb('SUBSCRIBED');
          return this;
        },
        send: function(msg) {
          realtimeBroadcasts.push(msg);
          return this;
        }
      };
    },
    removeChannel: () => {}
  };

  appAuth.client = mockClient;

  // Données de test : Ferme du Propriétaire
  const OWNER_FARM_DATA = {
    farmCode: 'FERME-7777',
    farmRole: 'owner',
    ownerEmail: 'proprio@fermegest.com',
    animals: [
      { id: 'anim-1', species: 'poulet', count: 120, name: 'Bande Pondeuses' },
      { id: 'anim-2', species: 'canard', count: 45, name: 'Canards Barbarie' }
    ],
    eggStocks: { poule: 350, canard_barbarie: 80 },
    eggStock: 430,
    expenses: [{ id: 'exp-1', amount: 150, category: 'Aliment' }],
    sales: [{ id: 'sale-1', amount: 300, productType: 'oeufs' }],
    lastUpdated: 5000
  };

  dbRows = [
    {
      user_id: 'owner-uuid-1234',
      data: OWNER_FARM_DATA,
      updated_at: '2026-11-15T10:00:00Z'
    }
  ];

  // ==========================================
  // TEST 1 : Code inexistant -> Arrêt propre sans modification
  // ==========================================
  await (async () => {
    localStorage.clear();
    window.appState.animals = [];
    window.appState.eggStock = 0;
    mockElement('teamJoinCodeInput').value = 'FERME-9999';

    const ok = await appAuth.joinFarmWithCode();
    test('Code inexistant doit échouer sans toucher au local ni au Cloud', () => {
      assert.strictEqual(ok, false);
      assert.strictEqual(localStorage.getItem('fermegest_farm_role'), null);
      assert.strictEqual(localStorage.getItem('fermegest_farm_code'), null);
    });
  })();

  // ==========================================
  // TEST 2 : Mode Invité (currentUser == null) rejoint la ferme
  // -> Doit adopter 100% des données du proprio avec STRICTEMENT 0 écriture DB
  // ==========================================
  await (async () => {
    localStorage.clear();
    upsertCalls = [];
    appAuth.currentUser = null; // MODE INVITÉ
    window.appState.animals = [];
    window.appState.eggStock = 0;
    mockElement('teamJoinCodeInput').value = 'FERME-7777';

    const ok = await appAuth.joinFarmWithCode();
    test('Mode Invité adopte 100% de la ferme propriétaire sans aucune écriture Supabase', () => {
      assert.strictEqual(ok, true);
      assert.strictEqual(localStorage.getItem('fermegest_farm_role'), 'partner');
      assert.strictEqual(localStorage.getItem('fermegest_farm_code'), 'FERME-7777');
      assert.strictEqual(localStorage.getItem('fermegest_farm_owner_email'), 'proprio@fermegest.com');
      assert.strictEqual(window.appState.animals.length, 2, 'Doit avoir reçu les 2 lots du proprio');
      assert.strictEqual(window.appState.eggStock, 430, 'Doit avoir reçu les 430 œufs du proprio');
      assert.strictEqual(upsertCalls.length, 0, 'ZÉRO écriture dans user_farms en Mode Invité !');
    });
  })();

  // ==========================================
  // TEST 3 : Mode Connecté (currentUser != null) rejoint la ferme
  // -> Adopte d\'abord les données puis écrit une ligne MIROIR (jamais vide)
  // ==========================================
  await (async () => {
    localStorage.clear();
    upsertCalls = [];
    appAuth.currentUser = { id: 'partner-uuid-5678', email: 'associe@gmail.com' };
    window.appState.animals = []; // localement vide
    window.appState.eggStock = 0;
    mockElement('teamJoinCodeInput').value = '7777'; // sans préfixe, doit normaliser

    const ok = await appAuth.joinFarmWithCode();
    test('Mode Connecté adopte les données propriétaire avant d\'enregistrer sa ligne partenaire', () => {
      assert.strictEqual(ok, true);
      assert.strictEqual(localStorage.getItem('fermegest_farm_role'), 'partner');
      assert.strictEqual(localStorage.getItem('fermegest_farm_code'), 'FERME-7777');
      assert.strictEqual(upsertCalls.length, 1, 'Doit avoir enregistré l\'adhésion');
      const saved = upsertCalls[0];
      assert.strictEqual(saved.user_id, 'partner-uuid-5678');
      assert.strictEqual(saved.data.farmRole, 'partner');
      assert.strictEqual(saved.data.animals.length, 2, 'La ligne cloud de l\'associé doit contenir les 2 animaux du proprio (JAMAIS VIDE)');
      assert.strictEqual(saved.data.eggStock, 430, 'La ligne cloud doit contenir les 430 œufs');
    });
  })();

  // ==========================================
  // TEST 4 : Guardrail Push - Un partenaire avec cheptel local à 0 ne peut JAMAIS pousser du vide
  // ==========================================
  await (async () => {
    upsertCalls = [];
    localStorage.setItem('fermegest_farm_role', 'partner');
    window.appState.animals = []; // Supposons anomalie ou cheptel local vidé
    window.appState._resetCleared = false;

    await appAuth.pushData(false, true);
    test('Guardrail pushData: Partenaire avec 0 animaux ne peut pas envoyer de push destructif', () => {
      assert.strictEqual(upsertCalls.length, 0, 'Le push destructif doit être bloqué net');
    });
  })();

  // ==========================================
  // TEST 5 : Guardrail Broadcast - Un partenaire avec cheptel local à 0 ne peut JAMAIS diffuser du vide
  // ==========================================
  await (async () => {
    realtimeBroadcasts = [];
    localStorage.setItem('fermegest_farm_role', 'partner');
    window.appState.animals = [];
    window.appState._resetCleared = false;

    appAuth.broadcastCurrentState();
    test('Guardrail broadcastCurrentState: Partenaire avec 0 animaux ne peut pas diffuser de cheptel vide', () => {
      assert.strictEqual(realtimeBroadcasts.length, 0, 'La diffusion destructive doit être bloquée');
    });
  })();

  // ==========================================
  // TEST 6 : Synchronisation Propriétaire - Protégé contre tout écrasement par une ligne partenaire vide
  // ==========================================
  await (async () => {
    localStorage.setItem('fermegest_farm_role', 'owner');
    localStorage.setItem('fermegest_farm_code', 'FERME-7777');
    appAuth.currentUser = { id: 'owner-uuid-1234', email: 'proprio@fermegest.com' };
    window.appState.animals = [...OWNER_FARM_DATA.animals];
    window.appState.eggStock = 430;

    // Simulation d'une ligne partenaire corrompue/vide dans la base
    dbRows.push({
      user_id: 'bad-partner-999',
      data: {
        farmCode: 'FERME-7777',
        farmRole: 'partner',
        animals: [], // CHEPTEL VIDE !
        eggStock: 0,
        expenses: [{ id: 'exp-partner-1', amount: 50, category: 'Vétérinaire' }]
      },
      updated_at: '2026-11-16T12:00:00Z' // Plus récent
    });

    await appAuth.syncNow(false);
    test('syncNow Propriétaire : Rejette le cheptel vide du partenaire tout en intégrant ses dépenses', () => {
      assert.strictEqual(window.appState.animals.length, 2, 'Les 2 animaux du propriétaire doivent être 100% préservés !');
      const hasExpense = (window.appState.expenses || []).some(e => e.id === 'exp-partner-1');
      assert.strictEqual(hasExpense, true, 'La dépense de l\'associé a été intégrée collaborativement');
    });
  })();

  // ==========================================
  // TEST 7 : Bouton Déconnexion (leaveSharedFarm)
  // -> Quitte la ferme partagée, redevient owner, nouveau code, UI actualisée
  // ==========================================
  await (async () => {
    upsertCalls = [];
    localStorage.setItem('fermegest_farm_role', 'partner');
    localStorage.setItem('fermegest_farm_code', 'FERME-7777');
    localStorage.setItem('fermegest_farm_owner_email', 'proprio@fermegest.com');
    appAuth.currentUser = { id: 'partner-uuid-5678', email: 'associe@gmail.com' };

    await appAuth.leaveSharedFarm();
    test('leaveSharedFarm: Déconnexion propre de la ferme partagée et retour en propriétaire individuel', () => {
      assert.strictEqual(localStorage.getItem('fermegest_farm_role'), 'owner');
      const newCode = localStorage.getItem('fermegest_farm_code');
      assert.notStrictEqual(newCode, 'FERME-7777', 'Le code doit avoir changé');
      assert.strictEqual(newCode.startsWith('FERME-'), true);
      assert.strictEqual(localStorage.getItem('fermegest_farm_owner_email'), null, 'Email proprio supprimé');
      assert.strictEqual(upsertCalls.length, 1, 'Doit avoir mis à jour sa ligne personnelle');
      assert.strictEqual(upsertCalls[0].data.farmRole, 'owner');
      assert.strictEqual(upsertCalls[0].data.farmCode, newCode);
    });
  })();

  // ==========================================
  // TEST 8 : updateProfileModalUI - Toggling parfait des conteneurs
  // ==========================================
  (() => {
    const ownerSec = mockElement('teamOwnerSection');
    const partnerSec = mockElement('teamPartnerSection');
    const joinCont = mockElement('teamJoinContainer');

    // Cas 1 : Rôle = partner
    localStorage.setItem('fermegest_farm_role', 'partner');
    appAuth.updateProfileModalUI();
    test('updateProfileModalUI en Mode Partner : Affiche teamPartnerSection, masque ownerSec et joinCont', () => {
      assert.strictEqual(partnerSec.classList.contains('hidden'), false, 'Partner section visible');
      assert.strictEqual(ownerSec.classList.contains('hidden'), true, 'Owner section masquée');
      assert.strictEqual(joinCont.classList.contains('hidden'), true, 'Formulaire join masqué pour éviter toute confusion');
    });

    // Cas 2 : Rôle = owner
    localStorage.setItem('fermegest_farm_role', 'owner');
    appAuth.updateProfileModalUI();
    test('updateProfileModalUI en Mode Owner : Masque teamPartnerSection, affiche ownerSec et joinCont', () => {
      assert.strictEqual(partnerSec.classList.contains('hidden'), true, 'Partner section masquée');
      assert.strictEqual(ownerSec.classList.contains('hidden'), false, 'Owner section visible');
      assert.strictEqual(joinCont.classList.contains('hidden'), false, 'Formulaire join visible');
    });
  })();

  console.log(`\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS : ${passed}/${total} !`);
  process.exit(0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
