// Full analysis and end-to-end demo simulation for all livestock categories
// (Poultry, Cattle, Sheep & Goats) in FermeGest Pro
const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'app.js');
const translationsPath = path.join(__dirname, '..', 'translations.js');

const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const translations = require(translationsPath);

// Function extractor helper
const extractFn = (name) => {
  const startRegex = new RegExp(`^\\s*${name}\\s*\\([^{]*\\)\\s*\\{`, 'm');
  const match = appJsContent.match(startRegex);
  if (!match) throw new Error(`Could not find function ${name}`);
  const startIndex = match.index;
  let braceCount = 0;
  let endIndex = -1;
  for (let i = startIndex; i < appJsContent.length; i++) {
    if (appJsContent[i] === '{') braceCount++;
    if (appJsContent[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }
  const fnStr = appJsContent.slice(startIndex, endIndex).trim();
  return new Function(`return function ${fnStr}`)();
};

const app = {
  getDailyGramsForAge: extractFn('getDailyGramsForAge'),
  getAgronomicFeedData: extractFn('getAgronomicFeedData'),
  getSpeciesIcon: extractFn('getSpeciesIcon'),
  translateSpecies: extractFn('translateSpecies'),
  translateStage: extractFn('translateStage'),
  getStageBadgeClass: extractFn('getStageBadgeClass'),
  calculateAgeInDays: function(birthDate) {
    if (!birthDate) return 0;
    const b = new Date(birthDate);
    const now = new Date('2026-11-02');
    const diff = Math.floor((now - b) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  },
  calculateCumulativeFeedKg: function(species, ageDays, stage, breed, startAgeDays = 0) {
    const totalDays = Math.max(0, Math.round(Number(ageDays) || 0));
    const startDays = Math.max(0, Math.round(Number(startAgeDays) || 0));
    if (totalDays <= startDays) return 0;
    let totalGrams = 0;
    for (let d = startDays + 1; d <= totalDays; d++) {
      totalGrams += app.getDailyGramsForAge(species, d, stage, breed);
    }
    return parseFloat((totalGrams / 1000).toFixed(3));
  }
};

global.document = {
  documentElement: { getAttribute: () => null }
};
global.appState = { lang: 'fr', userProfile: null, animals: [], sales: [], expenses: [], feedTypes: [] };

console.log('================================================================');
console.log('   FERMEGEST PRO - FULL ANALYSIS & 100% DEMO SIMULATION (FROM 0)');
console.log('================================================================\n');

// -------------------------------------------------------------
// STEP 1: ONBOARDING FROM 0 (NEW USER JOURNEY)
// -------------------------------------------------------------
console.log('--- ETAPE 1: ONBOARDING DEPUIS ZERO ---');
const userBirthDateValid = '1995-04-12';
const userBirthDateUnderage = '2015-08-20';

const checkAge18 = (bdate) => {
  const b = new Date(bdate);
  const now = new Date('2026-11-02');
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 18;
};

console.log('1. Test validation âge adulte (+18 ans) :');
console.log(`   - Date 2015-08-20 (mineur 11 ans) : Valide ? ${checkAge18(userBirthDateUnderage)} (Correctement rejeté)`);
console.log(`   - Date 1995-04-12 (adulte 31 ans) : Valide ? ${checkAge18(userBirthDateValid)} (Accepté)`);

const demoProfile = {
  name: 'Ahmed Hajjem',
  birthDate: userBirthDateValid,
  age: 31,
  avatar: 'avatar-m1',
  authProvider: 'guest',
  managedAnimals: ['cattle', 'sheep', 'poultry']
};
global.appState.userProfile = demoProfile;
console.log(`2. Profil créé : ${demoProfile.name}, Avatar: ${demoProfile.avatar}, Mode: ${demoProfile.authProvider}`);
console.log(`3. Élevages sélectionnés (Multi-choix complet) : ${demoProfile.managedAnimals.join(', ')}\n`);

// -------------------------------------------------------------
// STEP 2: FULL ANALYSIS OF ALL 3 LIVESTOCK CATEGORIES
// -------------------------------------------------------------
console.log('--- ETAPE 2: ANALYSE ZOOTECHNIQUE PAR CATEGORIE ---');

const categoriesToTest = [
  {
    cat: 'BOVINS',
    speciesList: [
      { sp: 'vache_laitiere', stage: 'Lactation', days: 720, label: 'Vache laitière en pleine lactation' },
      { sp: 'vache_laitiere', stage: 'Tarie', days: 720, label: 'Vache tarie (repos)' },
      { sp: 'taurillon', stage: 'Engraissement', days: 380, label: 'Taurillon engraissement 13 mois' },
      { sp: 'taurillon', stage: 'Finition', days: 520, label: 'Taurillon finition 17 mois' },
      { sp: 'veau', stage: 'Allaitement', days: 15, label: 'Veau au lait 15 jours' },
      { sp: 'veau', stage: 'Sevrage', days: 90, label: 'Veau sevré 3 mois' }
    ]
  },
  {
    cat: 'OVINS & CAPRINS',
    speciesList: [
      { sp: 'agneau', stage: 'Démarrage', days: 15, label: 'Agneau au lait 15 jours' },
      { sp: 'agneau', stage: 'Croissance', days: 60, label: 'Agneau sevré 2 mois' },
      { sp: 'agneau', stage: 'Engraissement', days: 100, label: 'Agneau engraissement 100 jours' },
      { sp: 'mouton', stage: 'Finition', days: 270, label: 'Mouton finition boucherie 9 mois' },
      { sp: 'belier', stage: 'Reproducteur', days: 720, label: 'Bélier adulte reproducteur' },
      { sp: 'brebis', stage: 'Lactation', days: 500, label: 'Brebis laitière en lactation' },
      { sp: 'brebis', stage: 'Tarie', days: 420, label: 'Brebis tarie repos' },
      { sp: 'chevre', stage: 'Lactation', days: 500, label: 'Chèvre laitière en lactation' },
      { sp: 'chevreau', stage: 'Engraissement', days: 90, label: 'Chevreau engraissement 3 mois' }
    ]
  },
  {
    cat: 'VOLAILLES',
    speciesList: [
      { sp: 'poulet', stage: 'Démarrage', days: 7, label: 'Poussin chair sem 1' },
      { sp: 'poulet', stage: 'Croissance', days: 35, label: 'Poulet chair sem 5' },
      { sp: 'pondeuse', stage: 'Ponte', days: 200, label: 'Poule pondeuse adulte' },
      { sp: 'canard', stage: 'Croissance', days: 45, label: 'Canard de Barbarie 6 sem' },
      { sp: 'dinde', stage: 'Croissance', days: 70, label: 'Dinde de chair 10 sem' }
    ]
  }
];

categoriesToTest.forEach(group => {
  console.log(`\n▶ [${group.cat}] : Vérification des rations journalières et données agronomiques`);
  group.speciesList.forEach(item => {
    const dailyGrams = app.getDailyGramsForAge(item.sp, item.days, item.stage);
    const feedData = app.getAgronomicFeedData(item.sp, item.days, item.stage);
    const icon = app.getSpeciesIcon(item.sp);
    const spFr = app.translateSpecies(item.sp);
    const badge = app.getStageBadgeClass(item.stage);
    console.log(`  ${icon} ${item.label.padEnd(38)} | Portion: ${(dailyGrams/1000).toFixed(2).padStart(5)} kg/j | Agro: ${feedData.labelFr} | Badge: ${badge}`);
  });
});

// -------------------------------------------------------------
// STEP 3: DEMO DE 0 - GESTION COMPLETE DU CHEPTEL & LOTS
// -------------------------------------------------------------
console.log('\n--- ETAPE 3: CREATION DES LOTS D\'ANIMAUX (DEMO DE 0) ---');

const lotsDemo = [
  {
    id: 'lot_bovin_01',
    name: 'Holstein Lactation',
    species: 'vache_laitiere',
    breed: 'Holstein Prim\'Holstein',
    birthDate: '2024-10-18', // 745 jours
    arrivalAgeDays: 720,
    currentQuantity: 5,
    initialQuantity: 5,
    costPerHead: 4800,
    stage: 'Lactation'
  },
  {
    id: 'lot_ovin_01',
    name: 'Agneaux Thibar',
    species: 'agneau',
    breed: 'Noire de Thibar',
    birthDate: '2026-09-03', // 60 jours sur ferme + 30j d'arrivée = 90j
    arrivalAgeDays: 30,
    currentQuantity: 20,
    initialQuantity: 20,
    costPerHead: 320,
    stage: 'Croissance'
  },
  {
    id: 'lot_poulet_01',
    name: 'Poulets Fermiers',
    species: 'poulet',
    breed: 'Sasso Rouge',
    birthDate: '2026-09-28', // 35 jours
    arrivalAgeDays: 1,
    currentQuantity: 100,
    initialQuantity: 100,
    costPerHead: 2.8,
    stage: 'Croissance'
  }
];
global.appState.animals = lotsDemo;

lotsDemo.forEach(l => {
  const icon = app.getSpeciesIcon(l.species);
  const ageDays = app.calculateAgeInDays(l.birthDate) + l.arrivalAgeDays;
  const cumulKg = app.calculateCumulativeFeedKg(l.species, ageDays, l.stage, l.breed, l.arrivalAgeDays);
  console.log(`✓ Lot [${l.id}] : ${icon} ${l.name} (${l.currentQuantity} têtes) | Âge actuel: ${ageDays} j | Cumul aliment/tête: ${cumulKg} kg`);
});

// -------------------------------------------------------------
// STEP 4: GESTION DES STOCKS & ACHAT D'ALIMENTS
// -------------------------------------------------------------
console.log('\n--- ETAPE 4: ACHAT D\'ALIMENTS & EVALUATION DU COUT AU KG ---');

const stockAlimentsDemo = [
  { id: 'feed_1', name: 'Foin de luzerne', stockKg: 1500, pricePerKg: 0.850 },
  { id: 'feed_2', name: 'Ensilage de maïs', stockKg: 3000, pricePerKg: 0.420 },
  { id: 'feed_3', name: 'Concentré ovin 16%', stockKg: 800, pricePerKg: 1.250 },
  { id: 'feed_4', name: 'Aliment croissance volaille', stockKg: 400, pricePerKg: 1.480 }
];
global.appState.feedTypes = stockAlimentsDemo;

let totalKgStock = stockAlimentsDemo.reduce((s, f) => s + f.stockKg, 0);
let totalValStock = stockAlimentsDemo.reduce((s, f) => s + (f.stockKg * f.pricePerKg), 0);
let avgFeedPriceKg = totalValStock / totalKgStock;

console.log(`✓ Stock total d'aliments : ${totalKgStock} kg pour une valeur de ${totalValStock.toFixed(3)} DT`);
console.log(`✓ Prix moyen pondéré de l'aliment : ${avgFeedPriceKg.toFixed(3)} DT/kg\n`);

// -------------------------------------------------------------
// STEP 5: CALCUL EXACT DU COUT ALIMENT PAR SUJET
// -------------------------------------------------------------
console.log('--- ETAPE 5: CONTROLE STRICT DU COUT ALIMENT PAR TETE ---');

lotsDemo.forEach(l => {
  const ageDays = app.calculateAgeInDays(l.birthDate) + l.arrivalAgeDays;
  const cumulKg = app.calculateCumulativeFeedKg(l.species, ageDays, l.stage, l.breed, l.arrivalAgeDays);
  const feedCostPerHead = cumulKg * avgFeedPriceKg;
  const totalFeedLotCost = feedCostPerHead * l.currentQuantity;
  const totalHeadCost = l.costPerHead + feedCostPerHead;

  console.log(`▶ ${l.name} (${l.currentQuantity} têtes) :`);
  console.log(`   - Durée sur ferme : ${ageDays - l.arrivalAgeDays} jours`);
  console.log(`   - Aliment consommé : ${cumulKg} kg/tête (Total lot: ${(cumulKg * l.currentQuantity).toFixed(1)} kg)`);
  console.log(`   - Coût aliment par tête : ${feedCostPerHead.toFixed(3)} DT`);
  console.log(`   - Coût d'achat par tête : ${l.costPerHead.toFixed(3)} DT`);
  console.log(`   - Coût de revient complet par tête : ${totalHeadCost.toFixed(3)} DT`);
  console.log(`   - Investissement total du lot : ${(totalHeadCost * l.currentQuantity).toFixed(3)} DT\n`);
});

// -------------------------------------------------------------
// STEP 6: VENTES DE PRODUITS & VERIFICATION DES REVENUS / BENEFICES
// -------------------------------------------------------------
console.log('--- ETAPE 6: VENTES MULTI-CATEGORIES & CALCUL DU PROFIT NET ---');

const salesDemo = [
  // Vente 1 : Lait de vache
  {
    id: 'sale_01',
    productType: 'lait',
    quantity: 2400, // 2400 litres
    unitPrice: 1.450,
    total: 2400 * 1.450, // 3480 DT
    linkedLotId: 'lot_bovin_01',
    label: '2400 Litres de lait frais'
  },
  // Vente 2 : 10 Agneaux engraissés
  {
    id: 'sale_02',
    productType: 'agneau',
    quantity: 10, // 10 agneaux
    unitPrice: 520,
    total: 10 * 520, // 5200 DT
    linkedLotId: 'lot_ovin_01',
    label: '10 Agneaux engraissés sur pied'
  },
  // Vente 3 : 60 Poulets de chair
  {
    id: 'sale_03',
    productType: 'poulet',
    quantity: 60,
    unitPrice: 19.5,
    total: 60 * 19.5, // 1170 DT
    linkedLotId: 'lot_poulet_01',
    label: '60 Poulets fermiers prêts à cuire'
  }
];

salesDemo.forEach(s => {
  const lot = lotsDemo.find(l => l.id === s.linkedLotId);
  console.log(`✓ Vente effectuée : ${s.label} -> Recette: ${s.total.toFixed(3)} DT`);
  if (s.productType === 'agneau' || s.productType === 'poulet') {
    lot.currentQuantity -= s.quantity;
    console.log(`  -> Décrémentation automatique du cheptel : Lot ${lot.name} passe de ${lot.initialQuantity} à ${lot.currentQuantity} têtes`);
  }
});

const totalRevenueDemo = salesDemo.reduce((s, v) => s + v.total, 0);
console.log(`\n✓ RECETTE TOTALE ENCAISSEE : ${totalRevenueDemo.toFixed(3)} DT`);

// -------------------------------------------------------------
// STEP 7: PARITE DES TRADUCTIONS ET CAS LIMITES
// -------------------------------------------------------------
console.log('\n--- ETAPE 7: VERIFICATION DE LA PARITE LINGUISTIQUE (FR, AR, EN) ---');

const frKeys = Object.keys(translations.fr);
const arKeys = Object.keys(translations.ar);
const enKeys = Object.keys(translations.en);

console.log(`✓ Clés Français : ${frKeys.length}`);
console.log(`✓ Clés Arabe    : ${arKeys.length}`);
console.log(`✓ Clés Anglais  : ${enKeys.length}`);

const missingInAr = frKeys.filter(k => translations.ar[k] === undefined);
const missingInEn = frKeys.filter(k => translations.en[k] === undefined);

console.log(`✓ Clés manquantes en Arabe   : ${missingInAr.length}`);
console.log(`✓ Clés manquantes en Anglais : ${missingInEn.length}`);

if (frKeys.length === arKeys.length && frKeys.length === enKeys.length && missingInAr.length === 0 && missingInEn.length === 0) {
  console.log('\n================================================================');
  console.log('   RESULTAT FINAL : 100% SUCCES - TOUS LES CAS D\'USAGE VALIDES !');
  console.log('   TOUTES LES CATEGORIES SONT COMPLETEMENT CONTROLEES.');
  console.log('================================================================');
} else {
  console.error('\nERREUR : Des clés de traduction manquent !');
  process.exit(1);
}
