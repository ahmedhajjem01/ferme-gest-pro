/**
 * FermeGest PRO - Application Logic & Calculation Engine
 * Mobile-First & Desktop Agrarian Management PWA
 */

// Central App State
const appState = {
  currency: 'TND',
  lang: 'fr',
  theme: 'dark',
  currentTab: 'dashboard',
  calendarDate: new Date(),
  expenseSortField: 'date',
  expenseSortOrder: 'desc',
  saleSortField: 'date',
  saleSortOrder: 'desc',
  eggStock: 0,
  eggHarvests: [],
  feedStockKg: null,
  feedStockDate: null,
  feedStockCostPerKg: 1.0,
  feedRationMode: 'custom',
  customDailyFeedKg: null,
  sicamCansCount: null,
  feedDistributions: [],
  feedTypes: [
    { id: 'feed-ble', name: 'Blé', stockKg: 0, pricePerKg: 1.10 },
    { id: 'feed-bouchon', name: 'Aliment ponte (Bouchon)', stockKg: 0, pricePerKg: 1.50 }
  ],
  
  animals: [],
  expenses: [],
  sales: [],
  incubatorBatches: [],
  dismissedSaleAlerts: [],
  savedFavoriteFeedRoutine: null
};

// Expose appState on global window for multi-device sync
window.appState = appState;

// Currency symbols and formats per language
const CURRENCY_SYMBOLS = {
  fr: {
    TND: 'DT',
    DZD: 'DA',
    MAD: 'DH',
    EUR: '€',
    USD: '$',
    FCFA: 'FCFA'
  },
  ar: {
    TND: 'د.ت',
    DZD: 'د.ج',
    MAD: 'د.م',
    EUR: '€',
    USD: '$',
    FCFA: 'ف.إ'
  },
  en: {
    TND: 'DT',
    DZD: 'DA',
    MAD: 'DH',
    EUR: '€',
    USD: '$',
    FCFA: 'FCFA'
  }
};

// Initial Demo Dataset (Authentic & Realistic)
const SAMPLE_DATA = {
  animals: [
    {
      id: 'lot-p-01',
      species: 'poulet',
      breed: 'Sasso XL Fermier',
      name: 'Bande Poulet Chair #12',
      initialQuantity: 250,
      currentQuantity: 242,
      mortality: 8,
      birthDate: '2026-09-07', // 35 jours
      costPerHead: 1.800,
      stage: 'Finition',
      notes: 'Bâtiment Sud. Excellente croissance, poids moyen 2.1kg.'
    },
    {
      id: 'lot-p-02',
      species: 'pondeuse',
      breed: 'Lohmann Brown',
      name: 'Bande Pondeuses #03',
      initialQuantity: 120,
      currentQuantity: 118,
      mortality: 2,
      birthDate: '2026-04-15', // ~6 mois
      costPerHead: 14.500,
      stage: 'Ponte',
      notes: 'Ponte quotidienne moyenne: 105 œufs/jour (Taux 89%).'
    },
    {
      id: 'lot-p-03',
      species: 'poussin',
      breed: 'Cou Nu Goliath',
      name: 'Lot Poussins Éleveuse #08',
      initialQuantity: 100,
      currentQuantity: 98,
      mortality: 2,
      birthDate: '2026-10-04', // 8 jours
      costPerHead: 1.400,
      stage: 'Démarrage',
      notes: 'Sous lampe chauffante 32°C. Vitamines anti-stress administrées.'
    },
    {
      id: 'lot-p-04',
      species: 'adulte',
      breed: 'Coqs Beldi Reproducteurs',
      name: 'Bande Coqs Adultes Reproducteurs',
      initialQuantity: 45,
      currentQuantity: 44,
      mortality: 1,
      birthDate: '2026-03-01', // ~7 mois
      costPerHead: 22.000,
      stage: 'Reproduction',
      notes: 'Parc plein air, coqs reproducteurs vigoureux (> 6 mois).'
    },
    {
      id: 'lot-p-05',
      species: 'poussin',
      breed: 'Poussins 1 jour Éclosion',
      name: 'Bande Poussins 1J Couveuse',
      initialQuantity: 150,
      currentQuantity: 148,
      mortality: 2,
      birthDate: '2026-10-12', // 1 jour
      costPerHead: 1.200,
      stage: 'Démarrage',
      notes: 'Poussins éclos hier, sous éleveuse chauffée à 33°C.'
    },
    {
      id: 'lot-p-06',
      species: 'pintade',
      breed: 'Pintade Numida Meleagris (Beldi)',
      name: 'Bande Pintades Fermières #01',
      initialQuantity: 60,
      currentQuantity: 58,
      mortality: 2,
      birthDate: '2026-06-15', // ~4 mois
      costPerHead: 4.500,
      stage: 'Finition',
      notes: 'Pintades robustes, élevage plein air mixte, plumage perlé.'
    },
    {
      id: 'lot-p-07',
      species: 'canard',
      breed: 'Canard de Barbarie Fermier',
      name: 'Bande Canards de Barbarie #01',
      initialQuantity: 40,
      currentQuantity: 39,
      mortality: 1,
      birthDate: '2026-07-01', // ~3.5 mois
      costPerHead: 6.000,
      stage: 'Finition',
      notes: 'Canards de Barbarie rustiques, plumage noir & blanc, croissance rapide.'
    }
  ],

  expenses: [
    {
      id: 'exp-01',
      date: '2026-09-08',
      category: 'nourriture',
      title: '10 Sacs Aliment Démarrage Poulet (50kg)',
      quantity: 10,
      unitPrice: 75.000,
      total: 750.000,
      linkedLotId: 'lot-p-01'
    },
    {
      id: 'exp-02',
      date: '2026-09-22',
      category: 'nourriture',
      title: '15 Sacs Aliment Croissance / Finition (50kg)',
      quantity: 15,
      unitPrice: 72.000,
      total: 1080.000,
      linkedLotId: 'lot-p-01'
    },
    {
      id: 'exp-03',
      date: '2026-09-25',
      category: 'nourriture',
      title: 'Aliment Pondeuse Granulés Spécial Ponte',
      quantity: 8,
      unitPrice: 68.000,
      total: 544.000,
      linkedLotId: 'lot-p-02'
    },
    {
      id: 'exp-04',
      date: '2026-09-12',
      category: 'veterinaire',
      title: 'Vaccin Newcastle + Gumboro (1000 doses)',
      quantity: 1,
      unitPrice: 55.000,
      total: 55.000,
      linkedLotId: 'lot-p-01'
    },
    {
      id: 'exp-05',
      date: '2026-10-01',
      category: 'electricite',
      title: 'Facture Électricité STEG Exploitation',
      quantity: 1,
      unitPrice: 220.000,
      total: 220.000,
      linkedLotId: 'general'
    },
    {
      id: 'exp-06',
      date: '2026-10-01',
      category: 'eau',
      title: 'Facture Eau SONEDE Abreuvoirs & Nettoyage',
      quantity: 1,
      unitPrice: 65.000,
      total: 65.000,
      linkedLotId: 'general'
    },
    {
      id: 'exp-07',
      date: '2026-09-30',
      category: 'salaire',
      title: 'Salaire Ouvrier Agricole (Mois de Septembre)',
      quantity: 1,
      unitPrice: 750.000,
      total: 750.000,
      linkedLotId: 'general'
    },
    {
      id: 'exp-08',
      date: '2026-10-05',
      category: 'autre',
      title: 'Litière de copeaux & Chauffage éleveuse poussins',
      quantity: 5,
      unitPrice: 18.000,
      total: 90.000,
      linkedLotId: 'lot-p-05'
    }
  ],

  sales: [
    {
      id: 'sale-01',
      date: '2026-09-28',
      productType: 'oeufs',
      description: 'Vente 50 Plateaux d\'œufs frais (Marché de Gros)',
      format: 'plateau',
      quantity: 50,
      unitPrice: 13.500,
      total: 675.000,
      linkedLotId: 'lot-p-02'
    },
    {
      id: 'sale-02',
      date: '2026-10-06',
      productType: 'oeufs',
      description: 'Vente 15 Haras d\'œufs frais (60 œufs au marché)',
      format: 'hara',
      quantity: 15,
      unitPrice: 2.000,
      total: 30.000,
      linkedLotId: 'lot-p-02'
    },
    {
      id: 'sale-03',
      date: '2026-10-08',
      productType: 'oeufs',
      description: 'Vente 12 œufs à l\'unité (3 Haras)',
      format: 'oeuf-unite',
      quantity: 12,
      unitPrice: 0.500,
      total: 6.000,
      linkedLotId: 'lot-p-02'
    },
    {
      id: 'sale-04',
      date: '2026-10-09',
      productType: 'poulet-croissance',
      description: 'Vente 25 Poulets fermiers (âge 3 mois - par sujet)',
      format: 'unite',
      quantity: 25,
      unitPrice: 18.500,
      total: 462.500,
      linkedLotId: 'lot-p-01'
    },
    {
      id: 'sale-05',
      date: '2026-10-10',
      productType: 'poussin-1j',
      description: 'Vente 40 Poussins 1 jour éclos (par sujet)',
      format: 'unite',
      quantity: 40,
      unitPrice: 2.200,
      total: 88.000,
      linkedLotId: 'lot-p-05'
    },
    {
      id: 'sale-06',
      date: '2026-10-11',
      productType: 'poulet-adulte',
      description: 'Vente 6 Coqs adultes reproducteurs (> 6 mois - par tête)',
      format: 'unite',
      quantity: 6,
      unitPrice: 28.000,
      total: 168.000,
      linkedLotId: 'lot-p-04'
    },
    {
      id: 'sale-07',
      date: '2026-10-12',
      productType: 'pintade',
      description: 'Vente 10 Pintades fermières prêtes à cuire (par sujet)',
      format: 'unite',
      quantity: 10,
      unitPrice: 24.000,
      total: 240.000,
      linkedLotId: 'lot-p-06'
    },
    {
      id: 'sale-08',
      date: '2026-10-12',
      productType: 'canard',
      description: 'Vente 5 Canards de Barbarie fermiers (par tête)',
      format: 'unite',
      quantity: 5,
      unitPrice: 35.000,
      total: 175.000,
      linkedLotId: 'lot-p-07'
    }
  ],

  incubatorBatches: [
    {
      id: 'batch-01',
      eggSpecies: 'poule',
      speciesDurationDays: 21,
      breed: 'Sasso XL & Fermière',
      name: 'Couvée Poussins Automne #03',
      eggsCount: 150,
      startDate: '2026-10-02', // Mis en couveuse il y a 10 jours
      hatchDate: '2026-10-23', // Éclosion prévue le 23 Octobre
      candling1Date: '2026-10-09',
      candling2Date: '2026-10-16',
      lockdownDate: '2026-10-20',
      temp: 37.7,
      humidity: 48,
      notes: '1er mirage effectué à J+7 : 142 œufs fertiles confirmés (94.6% fertilité).'
    },
    {
      id: 'batch-02',
      eggSpecies: 'caille',
      speciesDurationDays: 17,
      breed: 'Caille du Japon',
      name: 'Couvée Cailleteaux #01',
      eggsCount: 80,
      startDate: '2026-09-28', // Mis il y a 14 jours
      hatchDate: '2026-10-15', // Éclosion dans 3 jours !
      candling1Date: '2026-10-04',
      candling2Date: '2026-10-11',
      lockdownDate: '2026-10-13',
      temp: 37.6,
      humidity: 55,
      notes: 'Transfert à l\'éclosoir fait. Arrêt du retournement automatique.'
    },
    {
      id: 'batch-03',
      eggSpecies: 'pintade',
      speciesDurationDays: 27,
      breed: 'Pintade Commune Perlée',
      name: 'Couvée Œufs Pintade #01',
      eggsCount: 45,
      startDate: '2026-10-05',
      hatchDate: '2026-11-01',
      candling1Date: '2026-10-14',
      candling2Date: '2026-10-23',
      lockdownDate: '2026-10-29',
      temp: 37.5,
      humidity: 50,
      notes: 'Œufs à coquille très dure, mirage prévu à J+9.'
    },
    {
      id: 'batch-04',
      eggSpecies: 'canard_barbarie',
      speciesDurationDays: 35,
      breed: 'Canard de Barbarie Blanc & Pie',
      name: 'Couvée Œufs Canard Barbarie #01',
      eggsCount: 30,
      startDate: '2026-09-25',
      hatchDate: '2026-10-30',
      candling1Date: '2026-10-05',
      candling2Date: '2026-10-19',
      lockdownDate: '2026-10-27',
      temp: 37.5,
      humidity: 55,
      notes: 'Incubation 35 jours. Brumisation tiède et refroidissement quotidien dès J+14.'
    }
  ]
};

// Application Controller Object
const app = {
  
  getTodayDate() {
    return new Date();
  },

  getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // Translation engine helper
  t(key, params = {}) {
    const lang = appState.lang || 'fr';
    const dict = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang]) ? TRANSLATIONS[lang] : (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS['fr'] ? TRANSLATIONS['fr'] : {});
    let str = (dict && dict[key] !== undefined) ? dict[key] : ((typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS['fr'] && TRANSLATIONS['fr'][key] !== undefined) ? TRANSLATIONS['fr'][key] : key);
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(k => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
      });
    }
    return str;
  },

  // Language switcher
  setLanguage(newLang) {
    if (!['fr', 'ar', 'en'].includes(newLang)) return;
    appState.lang = newLang;
    const isRtl = newLang === 'ar';
    document.documentElement.setAttribute('lang', newLang);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    
    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = newLang;
    const mobileLang = document.getElementById('mobileLangSelect');
    if (mobileLang) mobileLang.value = newLang;

    this.saveState();
    this.updateCurrencySymbols();
    this.updateCurrencyDropdownOptions();
    this.updateMobileMenuControls();
    this.applyTranslations();
    const addSp = document.getElementById('animalSpecies')?.value || 'poulet';
    this.handleAnimalSpeciesChange(addSp, 'animal');
    const editSp = document.getElementById('editAnimalSpecies')?.value || 'poulet';
    this.handleAnimalSpeciesChange(editSp, 'editAnimal');
    this.renderAll();
    this.calcHatchPreview();

    // Reschedule daily 17h egg notification in the selected language
    if (window.MobileBridge && window.MobileBridge.scheduleDailyEggNotification) {
      window.MobileBridge.scheduleDailyEggNotification(newLang);
    }

    this.showToast(this.t('toast_lang_changed'));
  },

  // Apply translations to all tagged DOM nodes
  applyTranslations() {
    const lang = appState.lang || 'fr';
    const isRtl = lang === 'ar';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.t(key);
      if (val && val !== key) {
        if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
          el.value = val;
        } else if (val.includes('<') || el.hasAttribute('data-i18n-html')) {
          el.innerHTML = val;
        } else if (el.children.length === 0) {
          el.textContent = val;
        } else {
          let replaced = false;
          for (let i = 0; i < el.childNodes.length; i++) {
            const node = el.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
              node.textContent = (isRtl ? ' ' : ' ') + val + (isRtl ? ' ' : ' ');
              replaced = true;
              break;
            }
          }
          if (!replaced) {
            const innerSpan = el.querySelector('[data-i18n]');
            if (innerSpan && innerSpan !== el) {
              innerSpan.textContent = this.t(innerSpan.getAttribute('data-i18n'));
            } else {
              el.textContent = val;
            }
          }
        }
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });

    // Translate calendar weekdays header if present
    const weekdaysContainer = document.getElementById('calendarWeekdaysHeader');
    if (weekdaysContainer && typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang].cal_days_short) {
      const days = TRANSLATIONS[lang].cal_days_short;
      weekdaysContainer.innerHTML = days.map(d => `<span>${d}</span>`).join('');
    }

    this.renderFeedSuggestions();
  },

  // Initialization
  init() {
    this.loadState();
    this.setupListeners();
    this.updateCurrencySymbols();
    this.applyTranslations();
    this.renderAll();
    document.querySelectorAll('#animalPortionBanner, [id*="PortionBanner"]').forEach(el => el.remove());

    // Schedule 17h daily egg collection notification in active language
    if (window.MobileBridge && window.MobileBridge.scheduleDailyEggNotification) {
      window.MobileBridge.scheduleDailyEggNotification(appState.lang || 'fr');
    }

    // Listen for Service Worker notification clicks (PWA / Web)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'open_daily_eggs') {
          this.openDailyEggModal();
        }
      });
    }

    // Deep link or action parameter from notification click
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'daily_eggs') {
        setTimeout(() => this.openDailyEggModal(), 600);
      }
    } catch (e) {}
  },

  // State Persistence
  saveState() {
    try {
      localStorage.setItem('fermegest_state', JSON.stringify({
        version: '2.2.0-poultry',
        currency: appState.currency,
        lang: appState.lang || 'fr',
        theme: appState.theme,
        eggStock: Number(appState.eggStock) || 0,
        eggHarvests: appState.eggHarvests || [],
        feedStockKg: appState.feedStockKg !== undefined ? appState.feedStockKg : null,
        feedStockDate: appState.feedStockDate || null,
        feedStockCostPerKg: appState.feedStockCostPerKg || 1.0,
        feedRationMode: appState.feedRationMode || 'custom',
        customDailyFeedKg: (appState.customDailyFeedKg !== undefined && appState.customDailyFeedKg !== null) ? Number(appState.customDailyFeedKg) : null,
        sicamCansCount: (appState.sicamCansCount !== undefined && appState.sicamCansCount !== null) ? Number(appState.sicamCansCount) : null,
        feedDistributions: Array.isArray(appState.feedDistributions) ? appState.feedDistributions : [],
        feedTypes: Array.isArray(appState.feedTypes) ? appState.feedTypes : [],
        animals: appState.animals,
        expenses: appState.expenses,
        sales: appState.sales,
        incubatorBatches: appState.incubatorBatches,
        dismissedSaleAlerts: Array.isArray(appState.dismissedSaleAlerts) ? appState.dismissedSaleAlerts : [],
        savedFavoriteFeedRoutine: appState.savedFavoriteFeedRoutine || null,
        _zeroInitialized: true
      }));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    // Debounced automatic Cloud Sync push for authenticated user
    if (window.appAuth && typeof window.appAuth.schedulePush === 'function') {
      window.appAuth.schedulePush();
    }
  },

  loadState() {
    try {
      const saved = localStorage.getItem('fermegest_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        appState.currency = 'TND'; // Verrouillé définitivement au Dinar Tunisien (TND)
        appState.lang = parsed.lang || 'fr';
        appState.theme = parsed.theme || 'dark';
        appState.eggStock = Number(parsed.eggStock) || 0;
        appState.eggHarvests = Array.isArray(parsed.eggHarvests) ? parsed.eggHarvests : [];
        appState.feedStockKg = parsed.feedStockKg !== undefined ? parsed.feedStockKg : null;
        appState.feedStockDate = parsed.feedStockDate || null;
        appState.feedStockCostPerKg = parsed.feedStockCostPerKg ? Number(parsed.feedStockCostPerKg) : 1.0;
        appState.feedRationMode = parsed.feedRationMode || 'custom';
        appState.customDailyFeedKg = (parsed.customDailyFeedKg !== undefined && parsed.customDailyFeedKg !== null) ? Number(parsed.customDailyFeedKg) : null;
        appState.sicamCansCount = (parsed.sicamCansCount !== undefined && parsed.sicamCansCount !== null) ? Number(parsed.sicamCansCount) : null;
        if (appState.customDailyFeedKg !== null && (appState.customDailyFeedKg < 1.0 || isNaN(appState.customDailyFeedKg))) {
          appState.customDailyFeedKg = null;
          appState.sicamCansCount = null;
        }
        appState.feedDistributions = Array.isArray(parsed.feedDistributions) ? parsed.feedDistributions : [];
        if (!Array.isArray(parsed.feedTypes) || parsed.feedTypes.length === 0) {
          appState.feedTypes = [
            { id: 'feed-ble', name: 'Blé', stockKg: 0, pricePerKg: 1.10 },
            { id: 'feed-bouchon', name: 'Aliment ponte (Bouchon)', stockKg: 0, pricePerKg: 1.50 }
          ];
        } else {
          appState.feedTypes = this.sanitizeFeedTypes(parsed.feedTypes);
        }
        if (parsed.savedFavoriteFeedRoutine && Array.isArray(parsed.savedFavoriteFeedRoutine.items)) {
          parsed.savedFavoriteFeedRoutine.items.forEach(it => {
            if (it.name && (it.name.includes('بليه') || it.name === 'قمح / بليه')) {
              it.name = 'Blé';
            }
          });
        }
        appState.savedFavoriteFeedRoutine = parsed.savedFavoriteFeedRoutine || null;

        // Strict aviculture sanitization (remove any bovine / ovine / milk residues)
        const rawAnimals = Array.isArray(parsed.animals) ? parsed.animals : [];
        appState.animals = rawAnimals.filter(a => a.species !== 'bovin' && a.species !== 'ovin');

        const rawSales = Array.isArray(parsed.sales) ? parsed.sales : [];
        appState.sales = rawSales.filter(s => s.productType !== 'lait' && s.productType !== 'bovin' && s.productType !== 'ovin');

        const rawExpenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
        appState.expenses = rawExpenses.filter(e => e.linkedLotId !== 'lot-b-01' && e.linkedLotId !== 'lot-o-01');

        appState.incubatorBatches = Array.isArray(parsed.incubatorBatches) ? parsed.incubatorBatches : [];

        // Mise à 0 automatique des données de démo selon la consigne de l'utilisateur
        if (!parsed._zeroInitialized) {
          appState.animals = [];
          appState.expenses = [];
          appState.sales = [];
          appState.incubatorBatches = [];
          appState.eggHarvests = [];
          appState.eggStock = 0;
          appState.feedDistributions = [];
          appState._zeroInitialized = true;
        } else {
          appState._zeroInitialized = true;
        }

        if (!appState.animals || appState.animals.length === 0) {
          appState.customDailyFeedKg = null;
          appState.sicamCansCount = null;
        }
        this.saveState();
      } else {
        // Nouveau projet vierge pour le nouvel utilisateur (tout commence à zéro)
        appState.currency = 'TND';
        appState.lang = 'fr';
        appState.eggStock = 0;
        appState.eggHarvests = [];
        appState.animals = [];
        appState.expenses = [];
        appState.sales = [];
        appState.incubatorBatches = [];
        appState._zeroInitialized = true;
        this.saveState();
      }
    } catch (e) {
      console.warn('Failed to load state, starting clean at zero:', e);
      appState.currency = 'TND';
      appState.lang = 'fr';
      appState.animals = [];
      appState.expenses = [];
      appState.sales = [];
      appState.incubatorBatches = [];
      this.saveState();
    }

    // Apply saved theme & language
    document.documentElement.setAttribute('data-theme', appState.theme);
    const isRtl = appState.lang === 'ar';
    document.documentElement.setAttribute('lang', appState.lang);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');



    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = appState.lang;

    this.updateThemeIcons();
  },

  forceHardReload() {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => r.unregister());
        });
      }
      if ('caches' in window) {
        caches.keys().then(keys => {
          keys.forEach(k => caches.delete(k));
        });
      }
    } catch (e) {
      console.warn('Cache clear error:', e);
    }
    setTimeout(() => {
      window.location.reload(true);
    }, 200);
  },

  // Event Listeners setup
  setupListeners() {
    // Navigation Tabs (Desktop & Mobile)
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Language Selector (Desktop & Mobile)
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        this.setLanguage(e.target.value);
      });
    }
    const mobileLang = document.getElementById('mobileLangSelect');
    if (mobileLang) {
      mobileLang.addEventListener('change', (e) => {
        this.setLanguage(e.target.value);
      });
    }

    // Theme toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }



    // Mobile Hamburger Menu Button
    const mobileMenuBtn = document.getElementById('mobileHeaderMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.onclick = (e) => this.toggleMobileMenu(e);
    }

    // Data options modal
    const dataBtn = document.getElementById('dataOptionsBtn');
    if (dataBtn) {
      dataBtn.addEventListener('click', () => this.openModal('modalDataOptions'));
    }

    // Floating Action Button
    const fabBtn = document.getElementById('fabMainBtn');
    if (fabBtn) {
      fabBtn.addEventListener('click', () => this.toggleFabMenu());
    }

    // Animals Filter Chips
    document.querySelectorAll('[data-filter-animal]').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-animal]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.renderAnimals(chip.getAttribute('data-filter-animal'));
      });
    });

    // Expenses Search & Filter
    const expSearch = document.getElementById('expenseSearchInput');
    const expFilter = document.getElementById('expenseCategoryFilter');
    if (expSearch) expSearch.addEventListener('input', () => this.renderExpenses());
    if (expFilter) expFilter.addEventListener('change', () => this.renderExpenses());

    // Calendar Navigation
    const prevMonthBtn = document.getElementById('calPrevMonthBtn');
    const nextMonthBtn = document.getElementById('calNextMonthBtn');
    if (prevMonthBtn) {
      prevMonthBtn.onclick = () => this.prevMonth();
    }
    if (nextMonthBtn) {
      nextMonthBtn.onclick = () => this.nextMonth();
    }

    // Default dates for modals to today
    const todayStr = this.getTodayStr();
    ['animalBirthDate', 'expenseDate', 'saleDate', 'batchStartDate'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = todayStr;
    });

    // Sale Flock / Lot Selection Link
    const saleLotSelect = document.getElementById('saleLotLinked');
    if (saleLotSelect) {
      saleLotSelect.addEventListener('change', (e) => {
        this.handleSaleLotSelection(e.target.value);
      });
    }

    this.calcHatchPreview();
  },

  // Tab switching
  switchTab(tabId) {
    appState.currentTab = tabId;
    
    // Update content visibility
    document.querySelectorAll('.content-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) targetTab.classList.add('active');

    // Update active nav items
    document.querySelectorAll('[data-tab]').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Close FAB menu if open
    const fabMenu = document.getElementById('fabMenu');
    if (fabMenu) fabMenu.classList.add('hidden');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Re-render target tab specifics if needed
    if (tabId === 'calendar') this.renderCalendar();
    if (tabId === 'smart-calc') this.renderSmartCalculations();
  },

  // Toggle Dark/Light Theme
  toggleTheme() {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', appState.theme);
    this.updateThemeIcons();
    this.saveState();
  },

  updateThemeIcons() {
    const sun = document.getElementById('themeIconSun');
    const moon = document.getElementById('themeIconMoon');
    if (appState.theme === 'dark') {
      if (sun) sun.classList.remove('hidden');
      if (moon) moon.classList.add('hidden');
    } else {
      if (sun) sun.classList.add('hidden');
      if (moon) moon.classList.remove('hidden');
    }
    this.updateMobileMenuControls();
  },

  getCurrencySymbol() {
    const lang = appState.lang || 'fr';
    const dict = CURRENCY_SYMBOLS[lang] || CURRENCY_SYMBOLS.fr;
    return dict[appState.currency] || (lang === 'ar' ? 'د.ت' : 'DT');
  },

  updateCurrencySymbols() {
    const sym = this.getCurrencySymbol();
    document.querySelectorAll('.currency-label').forEach(el => {
      el.textContent = sym;
    });
  },

  updateCurrencyDropdownOptions() {
    const sel = document.getElementById('currencySelect');
    if (!sel) return;
    const isAr = appState.lang === 'ar';
    const optLabels = isAr ? {
      TND: 'دينار تونسي (د.ت)',
      DZD: 'دينار جزائري (د.ج)',
      MAD: 'درهم مغربي (د.م)',
      EUR: 'يورو (€)',
      USD: 'دولار ($)',
      FCFA: 'فرنك إفريقي (FCFA)'
    } : {
      TND: 'TND (DT)',
      DZD: 'DZD (DA)',
      MAD: 'MAD (DH)',
      EUR: 'EUR (€)',
      USD: 'USD ($)',
      FCFA: 'FCFA'
    };
    Array.from(sel.options).forEach(opt => {
      if (optLabels[opt.value]) {
        opt.textContent = optLabels[opt.value];
      }
    });
  },

  formatMoney(amount) {
    const sym = this.getCurrencySymbol();
    const num = Number(amount) || 0;
    const decimals = appState.currency === 'TND' ? 3 : 2;
    const formattedNum = num.toLocaleString('fr-TN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return `${formattedNum} ${sym}`;
  },

  toggleFabMenu() {
    const menu = document.getElementById('fabMenu');
    if (menu) menu.classList.toggle('hidden');
  },

  // Modal handlers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      const modalBody = modal.querySelector('.modal-body');
      if (modalBody) {
        modalBody.scrollTop = 0;
        modalBody.scrollLeft = 0;
      }
      this.populateLotDropdowns();

      if (modalId === 'modalAddAnimal') {
        const nextId = this.getNextAnimalId();
        const animalNameInput = document.getElementById('animalName');
        if (animalNameInput) {
          animalNameInput.value = nextId;
          animalNameInput.placeholder = '';
        }
        const costInput = document.getElementById('animalCostPerHead');
        if (costInput) {
          costInput.value = '';
          costInput.placeholder = '';
        }
        const qtyInput = document.getElementById('animalQuantity');
        if (qtyInput) {
          qtyInput.value = '';
          qtyInput.placeholder = '';
        }
        const breedInput = document.getElementById('animalBreed');
        if (breedInput) {
          breedInput.value = '';
          breedInput.placeholder = '';
        }
        const notesInput = document.getElementById('animalNotes');
        if (notesInput) {
          notesInput.value = '';
          notesInput.placeholder = '';
        }
        const ageInput = document.getElementById('animalArrivalAgeDays');
        if (ageInput) {
          ageInput.value = '';
          ageInput.placeholder = '';
        }
        const birthDateInput = document.getElementById('animalBirthDate');
        if (birthDateInput && !birthDateInput.value) {
          birthDateInput.value = this.getTodayStr();
        }
        const sp = document.getElementById('animalSpecies')?.value || 'poulet';
        this.handleAnimalSpeciesChange(sp, 'animal');
      }

      if (modalId === 'modalDailyEggs') {
        const input = document.getElementById('dailyEggCount');
        if (input) {
          input.value = '';
          input.placeholder = '';
          input.removeAttribute('placeholder');
        }
      }

      if (modalId === 'modalSellEggStock') {
        const qtyInput = document.getElementById('sellEggQty');
        if (qtyInput) {
          qtyInput.value = '';
          qtyInput.placeholder = '';
          qtyInput.removeAttribute('placeholder');
        }
        const priceInput = document.getElementById('sellEggUnitPrice');
        if (priceInput) {
          priceInput.value = '';
          priceInput.placeholder = '';
          priceInput.removeAttribute('placeholder');
        }
      }

      if (modalId === 'modalConsumeEggStock') {
        const input = document.getElementById('consumeEggQty');
        if (input) {
          input.value = '';
          input.placeholder = '';
          input.removeAttribute('placeholder');
        }
      }

      if (modalId === 'modalAddBatch') {
        const batchEggsInput = document.getElementById('batchEggsCount');
        if (batchEggsInput) {
          batchEggsInput.value = '';
          batchEggsInput.placeholder = '';
          batchEggsInput.removeAttribute('placeholder');
        }
        const breed = document.getElementById('batchBreed');
        if (breed) { breed.value = ''; breed.placeholder = ''; breed.removeAttribute('placeholder'); }
        const name = document.getElementById('batchName');
        if (name) { name.value = ''; name.placeholder = ''; name.removeAttribute('placeholder'); }
      }

      if (modalId === 'modalAdjustFeedStock') {
        this.renderFeedStockAdjustModal();
      }

      if (modalId === 'modalDailyFeedRation') {
        const customKgInput = document.getElementById('feedCustomKgInput');
        const sicamInput = document.getElementById('feedSicamCansInput');
        const customRadio = document.getElementById('feedModeCustomRadio');
        const industrialRadio = document.getElementById('feedModeIndustrialRadio');
        const isCustom = appState.feedRationMode !== 'industrial';
        if (customRadio) customRadio.checked = isCustom;
        if (industrialRadio) industrialRadio.checked = !isCustom;
        if (customKgInput) customKgInput.value = (appState.customDailyFeedKg !== undefined && appState.customDailyFeedKg !== null) ? appState.customDailyFeedKg : '';
        if (sicamInput) sicamInput.value = (appState.sicamCansCount !== undefined && appState.sicamCansCount !== null) ? appState.sicamCansCount : '';
        this.toggleFeedRationModeUI();
      }

      if (modalId === 'modalFeedDistribution') {
        const dateInput = document.getElementById('distribDate');
        if (dateInput) dateInput.value = this.getTodayStr();
        this.renderFeedDistributionModal();
      }

      if (modalId === 'modalAddFeedType') {
        this.renderFeedSuggestions();
      }

      if (modalId === 'modalAddSale') {
        this.validateSaleQuantityAgainstLot();
      }

      if (modalId === 'modalAddExpense') {
        this.handleExpenseCatChange();
      }
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
  },

  // ==========================================
  // EGG STOCK & HARVEST ACCUMULATION MODULE
  // ==========================================
  renderEggStock() {
    const stock = Number(appState.eggStock) || 0;
    const mainCountEl = document.getElementById('eggStockMainCount');
    if (mainCountEl) mainCountEl.textContent = stock;

    const equivEl = document.getElementById('eggStockEquiv');
    if (equivEl) {
      const haras = (stock / 4).toFixed(1);
      const plates = (stock / 30).toFixed(1);
      const lang = appState.lang || 'fr';
      if (lang === 'ar') {
        equivEl.textContent = `~${haras} حارة • ~${plates} طبق (30 بيضة)`;
      } else if (lang === 'en') {
        equivEl.textContent = `~${haras} Haras • ~${plates} Trays (30 eggs)`;
      } else {
        equivEl.textContent = `~${haras} Haras • ~${plates} Plateaux (30 œufs)`;
      }
    }

    const curStockVal = document.getElementById('dailyEggCurrentStockVal');
    if (curStockVal) {
      curStockVal.textContent = stock + ' ' + this.t('unit_eggs');
    }
  },

  openDailyEggModal() {
    this.openModal('modalDailyEggs');
    const input = document.getElementById('dailyEggCount');
    if (input) {
      input.value = '';
      input.placeholder = '';
      input.removeAttribute('placeholder');
      setTimeout(() => input.focus(), 150);
    }
    this.updateDailyEggPreview();
  },

  updateDailyEggPreview() {
    const current = Number(appState.eggStock) || 0;
    const input = document.getElementById('dailyEggCount');
    const count = parseInt(input?.value, 10) || 0;

    const curStockVal = document.getElementById('dailyEggCurrentStockVal');
    if (curStockVal) curStockVal.textContent = current + ' ' + this.t('unit_eggs');

    const newStockVal = document.getElementById('dailyEggNewStockVal');
    if (newStockVal) newStockVal.textContent = (current + count) + ' ' + this.t('unit_eggs');

    const btnText = document.getElementById('dailyEggBtnText');
    if (btnText) {
      const lang = appState.lang || 'fr';
      if (count > 0) {
        if (lang === 'ar') btnText.textContent = `إضافة +${count} بيضة إلى الرصيد`;
        else if (lang === 'en') btnText.textContent = `Add +${count} Eggs to Farm Stock`;
        else btnText.textContent = `Ajouter +${count} œufs au Stock`;
      } else {
        btnText.textContent = this.t('daily_eggs_btn_save') || 'Ajouter au Stock de la Ferme';
      }
    }
  },

  handleSaveDailyEggs(e) {
    if (e && e.preventDefault) e.preventDefault();
    const countInput = document.getElementById('dailyEggCount');
    const count = parseInt(countInput?.value, 10);
    if (!count || count <= 0) {
      this.showToast(this.t('err_fill_required') || 'Veuillez saisir un nombre valide.');
      return;
    }

    const todayStr = this.getTodayStr();
    appState.eggStock = (Number(appState.eggStock) || 0) + count;
    appState.eggHarvests = appState.eggHarvests || [];
    appState.eggHarvests.unshift({
      id: 'harvest-' + Date.now().toString(36),
      date: todayStr,
      count: count
    });

    localStorage.setItem('fermegest_last_egg_notif_date', todayStr);

    this.saveState();
    this.closeModal('modalDailyEggs');
    this.renderEggStock();
    this.showToast(this.t('daily_eggs_toast_success', { count: count, total: appState.eggStock }));

    if (countInput) countInput.value = '';
  },

  openSellEggsModal() {
    const stock = Number(appState.eggStock) || 0;
    if (stock <= 0) {
      this.showToast(appState.lang === 'ar' ? '⚠️ رصيد البيض فارغ حالياً. سجل جمعاً جديداً أولاً.' : (appState.lang === 'en' ? '⚠️ Egg stock is empty. Record a harvest first.' : '⚠️ Votre stock d\'œufs est vide. Enregistrez une récolte d\'abord.'));
      return;
    }
    this.openModal('modalSellEggStock');
    const availEl = document.getElementById('sellEggStockAvailable');
    if (availEl) availEl.textContent = `${stock} ${this.t('unit_eggs')}`;

    const qtyInput = document.getElementById('sellEggQty');
    if (qtyInput) {
      qtyInput.value = '';
      qtyInput.placeholder = '';
      qtyInput.removeAttribute('placeholder');
      qtyInput.max = stock;
    }

    this.setStockEggFormat('oeuf-unite');

    const priceInput = document.getElementById('sellEggUnitPrice');
    if (priceInput) {
      priceInput.value = '';
      priceInput.placeholder = '';
      priceInput.removeAttribute('placeholder');
    }

    this.calcSellEggTotal();
  },

  setStockEggFormat(format) {
    const input = document.getElementById('sellEggFormat');
    if (input) input.value = format;

    const btnOeuf = document.getElementById('btnStockEggFormatOeuf');
    const btnHara = document.getElementById('btnStockEggFormatHara');
    const btnPlateau = document.getElementById('btnStockEggFormatPlateau');

    if (btnOeuf) btnOeuf.classList.toggle('active-egg-format-btn', format === 'oeuf-unite');
    if (btnHara) btnHara.classList.toggle('active-egg-format-btn', format === 'hara');
    if (btnPlateau) btnPlateau.classList.toggle('active-egg-format-btn', format === 'plateau');

    this.handleSellEggFormatChange();
  },

  handleSellEggFormatChange() {
    const format = document.getElementById('sellEggFormat')?.value;
    const priceInput = document.getElementById('sellEggUnitPrice');
    const isTND = appState.currency === 'TND';
    if (priceInput) {
      if (format === 'hara') {
        priceInput.value = isTND ? '2.000' : '1.00';
      } else if (format === 'plateau') {
        priceInput.value = isTND ? '15.000' : '7.50';
      } else {
        priceInput.value = isTND ? '0.500' : '0.25';
      }
    }
    this.calcSellEggTotal();
  },

  calcSellEggTotal() {
    const format = document.getElementById('sellEggFormat')?.value || 'oeuf-unite';
    const q = parseFloat(document.getElementById('sellEggQty')?.value) || 0;
    const p = parseFloat(document.getElementById('sellEggUnitPrice')?.value) || 0;
    const stock = Number(appState.eggStock) || 0;

    let totalEggs = q;
    if (format === 'hara') totalEggs = q * 4;
    else if (format === 'plateau') totalEggs = q * 30;

    const hintEl = document.getElementById('sellEggEquivHint');
    if (hintEl) {
      const lang = appState.lang || 'fr';
      if (totalEggs > stock) {
        hintEl.innerHTML = `<span class="text-rose bold">⚠️ ${totalEggs} ${this.t('unit_eggs')} (${lang === 'ar' ? 'يتجاوز الرصيد المتوفر' : 'dépasse le stock disponible'}) !</span>`;
      } else {
        hintEl.textContent = `🥚 ${totalEggs} ${this.t('unit_eggs')} (${stock - totalEggs} ${lang === 'ar' ? 'سيبقى بالرصيد' : 'restants après vente'})`;
      }
    }

    const totalRevenue = q * p;
    const revEl = document.getElementById('sellEggTotalRevenue');
    if (revEl) revEl.textContent = this.formatMoney(totalRevenue);
  },

  handleSaveSellEggStock(e) {
    if (e && e.preventDefault) e.preventDefault();
    const format = document.getElementById('sellEggFormat')?.value || 'oeuf-unite';
    const q = parseFloat(document.getElementById('sellEggQty')?.value) || 0;
    const unitPrice = parseFloat(document.getElementById('sellEggUnitPrice')?.value) || 0;
    const total = q * unitPrice;
    const stock = Number(appState.eggStock) || 0;

    let totalEggs = q;
    if (format === 'hara') totalEggs = q * 4;
    else if (format === 'plateau') totalEggs = q * 30;

    if (totalEggs <= 0) {
      this.showToast('Veuillez saisir une quantité valide.');
      return;
    }
    if (totalEggs > stock) {
      const isAr = appState.lang === 'ar';
      this.showToast(isAr 
        ? `الكمية المراد بيعها (${totalEggs} بيضة) تتجاوز الرصيد المتوفر (${stock} بيضة)` 
        : `La quantité à vendre (${totalEggs} œufs) dépasse votre stock disponible (${stock} œufs).`, 'warning');
      return;
    }

    const todayStr = this.getTodayStr();
    const lang = appState.lang || 'fr';
    let desc = `Vente d'œufs frais depuis stock (${totalEggs} œufs)`;
    if (lang === 'ar') desc = `بيع بيض طازج من الرصيد (${totalEggs} بيضة)`;
    else if (lang === 'en') desc = `Farm egg sale from stock (${totalEggs} eggs)`;

    const newSale = {
      id: 'sale-' + Date.now().toString(36),
      date: todayStr,
      productType: 'oeufs',
      description: desc,
      format: format,
      quantity: q,
      unitPrice: unitPrice,
      total: total,
      linkedLotId: 'none',
      ageText: ''
    };

    appState.sales.unshift(newSale);
    appState.eggStock = Math.max(0, stock - totalEggs);

    this.saveState();
    this.closeModal('modalSellEggStock');
    this.renderAll();
    this.showToast(this.t('sell_eggs_toast_success', {
      count: totalEggs,
      amount: this.formatMoney(total),
      remaining: appState.eggStock
    }));
  },

  openIncubateEggsModal() {
    const stock = Number(appState.eggStock) || 0;
    this.switchTab('incubator');
    this.openModal('modalAddIncubator');
    const batchEggsInput = document.getElementById('batchEggsCount');
    if (batchEggsInput) {
      batchEggsInput.value = '';
      batchEggsInput.placeholder = '';
      batchEggsInput.removeAttribute('placeholder');
    }
  },

  openConsumeEggsModal() {
    const stock = Number(appState.eggStock) || 0;
    if (stock <= 0) {
      this.showToast('⚠️ Aucun œuf en stock.');
      return;
    }
    this.openModal('modalConsumeEggStock');
    const input = document.getElementById('consumeEggQty');
    if (input) {
      input.value = '';
      input.placeholder = '';
      input.removeAttribute('placeholder');
      input.max = stock;
    }
  },

  handleSaveConsumeEggStock(e) {
    if (e && e.preventDefault) e.preventDefault();
    const qty = parseInt(document.getElementById('consumeEggQty')?.value, 10) || 0;
    const stock = Number(appState.eggStock) || 0;
    if (qty <= 0) return;
    if (qty > stock) {
      const isAr = appState.lang === 'ar';
      this.showToast(isAr ? `الكمية تتجاوز الرصيد الحالي (${stock})` : `La quantité dépasse le stock actuel (${stock}).`, 'warning');
      return;
    }
    appState.eggStock = Math.max(0, stock - qty);
    this.saveState();
    this.closeModal('modalConsumeEggStock');
    this.renderEggStock();
    this.showToast(this.t('consume_eggs_toast_success', { count: qty, remaining: appState.eggStock }));
  },

  // Populate dynamic select options in modals
  populateLotDropdowns() {
    const expenseLotSelect = document.getElementById('expenseAnimalLot');
    const saleLotSelect = document.getElementById('saleLotLinked');
    const lang = appState.lang || 'fr';

    const getSpeciesLabel = (sp) => {
      if (sp === 'poulet') return this.t('chip_poulet') || 'Poulet';
      if (sp === 'pondeuse') return this.t('chip_pondeuse') || 'Pondeuse';
      if (sp === 'poussin') return this.t('chip_poussin') || 'Poussin';
      if (sp === 'adulte') return this.t('chip_poulet_adulte') || 'Coqs Adultes';
      if (sp === 'pintade') return this.t('chip_pintade') || 'Pintade';
      if (sp === 'canard' || sp === 'canard_barbarie') return this.t('chip_canard') || 'Canard de Barbarie';
      return sp;
    };

    if (expenseLotSelect) {
      const defaultGeneralSelected = (appState.animals.length === 1) ? '' : 'selected';
      let html = `<option value="general" ${defaultGeneralSelected}>${this.t('opt_general_farm')}</option>`;
      appState.animals.forEach((a, idx) => {
        const isSelected = (appState.animals.length === 1) ? 'selected' : '';
        const displayName = this.getAnimalDisplayName(a);
        const lotPrefix = (a.name && a.name.toString().trim() !== '') ? (lang === 'ar' ? `دفعة #${a.name} - ` : `Lot #${a.name} - `) : '';
        html += `<option value="${a.id}" ${isSelected}>${lotPrefix}${displayName}</option>`;
      });
      expenseLotSelect.innerHTML = html;
    }

    if (saleLotSelect) {
      let html = `<option value="none">${this.t('opt_no_lot')}</option>`;
      const remWord = lang === 'ar' ? 'المتبقي' : (lang === 'en' ? 'Remaining' : 'Restant');
      appState.animals.forEach(a => {
        const displayName = this.getAnimalDisplayName(a);
        const lotPrefix = (a.name && a.name.toString().trim() !== '') ? (lang === 'ar' ? `دفعة #${a.name} - ` : `Lot #${a.name} - `) : '';
        html += `<option value="${a.id}">${lotPrefix}${displayName} (${remWord}: ${a.currentQuantity})</option>`;
      });
      saleLotSelect.innerHTML = html;
    }
  },

  // Toast notifications
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    if (window.MobileBridge) {
      if (type === 'success') window.MobileBridge.hapticSuccess();
      else if (type === 'danger' || type === 'error') window.MobileBridge.hapticWarning();
      else window.MobileBridge.hapticImpact('LIGHT');
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  // ==========================================
  // IN-APP DIALOGS (100% sans alert/confirm/prompt de navigateur)
  // ==========================================
  confirmDialog(options) {
    return new Promise((resolve) => {
      let cfg = typeof options === 'string' ? { message: options } : (options || {});
      const isAr = appState.lang === 'ar';
      const isEn = appState.lang === 'en';

      const titleEl = document.getElementById('appConfirmTitleText');
      const iconEl = document.getElementById('appConfirmIcon');
      const msgEl = document.getElementById('appConfirmMessage');
      const cancelBtn = document.getElementById('appConfirmCancelBtn');
      const okBtn = document.getElementById('appConfirmOkBtn');
      const extraBox = document.getElementById('appConfirmExtra');

      if (titleEl) titleEl.textContent = cfg.title || (isAr ? 'تأكيد العملية' : (isEn ? 'Confirmation' : 'Confirmation'));
      if (iconEl) iconEl.textContent = cfg.icon || '⚠️';
      if (msgEl) msgEl.textContent = cfg.message || '';
      if (extraBox) extraBox.style.display = 'none';

      const defaultCancel = isAr ? 'إلغاء' : (isEn ? 'Cancel' : 'Annuler');
      const defaultConfirm = isAr ? 'تأكيد' : (isEn ? 'Confirm' : 'Confirmer');

      if (cancelBtn) cancelBtn.textContent = cfg.cancelText || defaultCancel;
      if (okBtn) {
        okBtn.textContent = cfg.confirmText || defaultConfirm;
        if (cfg.isDanger === false) {
          okBtn.className = 'btn btn-primary flex-1';
        } else {
          okBtn.className = 'btn btn-danger flex-1';
        }
      }

      this._confirmCallback = (res) => {
        if (res) {
          if (typeof cfg.onConfirm === 'function') cfg.onConfirm();
          resolve(true);
        } else {
          if (typeof cfg.onCancel === 'function') cfg.onCancel();
          resolve(false);
        }
      };

      this.openModal('modalAppConfirm');
    });
  },

  closeAppConfirm(accepted) {
    this.closeModal('modalAppConfirm');
    if (typeof this._confirmCallback === 'function') {
      const cb = this._confirmCallback;
      this._confirmCallback = null;
      cb(Boolean(accepted));
    }
  },

  promptDialog(options) {
    return new Promise((resolve) => {
      let cfg = typeof options === 'string' ? { message: options } : (options || {});
      const isAr = appState.lang === 'ar';
      const isEn = appState.lang === 'en';

      const titleEl = document.getElementById('appPromptTitleText');
      const iconEl = document.getElementById('appPromptIcon');
      const msgEl = document.getElementById('appPromptMessage');
      const labelEl = document.getElementById('appPromptInputLabel');
      const inputEl = document.getElementById('appPromptInput');
      const cancelBtn = document.getElementById('appPromptCancelBtn');
      const okBtn = document.getElementById('appPromptOkBtn');

      if (titleEl) titleEl.textContent = cfg.title || (isAr ? 'إدخال بيانات' : (isEn ? 'Input' : 'Saisie'));
      if (iconEl) iconEl.textContent = cfg.icon || '📝';
      if (msgEl) msgEl.textContent = cfg.message || '';
      if (labelEl) {
        labelEl.textContent = cfg.label || '';
        labelEl.style.display = cfg.label ? 'block' : 'none';
      }
      if (inputEl) {
        inputEl.type = cfg.inputType || 'text';
        inputEl.value = cfg.defaultValue !== undefined ? cfg.defaultValue : '';
        inputEl.placeholder = cfg.placeholder || '';
        if (cfg.min !== undefined) inputEl.min = cfg.min;
        if (cfg.max !== undefined) inputEl.max = cfg.max;
        if (cfg.step !== undefined) inputEl.step = cfg.step;
      }

      const defaultCancel = isAr ? 'إلغاء' : (isEn ? 'Cancel' : 'Annuler');
      const defaultConfirm = isAr ? 'تأكيد' : (isEn ? 'Confirm' : 'Valider');

      if (cancelBtn) cancelBtn.textContent = cfg.cancelText || defaultCancel;
      if (okBtn) okBtn.textContent = cfg.confirmText || defaultConfirm;

      this._promptCallback = (val) => {
        if (val !== null && val !== undefined) {
          if (typeof cfg.onConfirm === 'function') cfg.onConfirm(val);
          resolve(val);
        } else {
          if (typeof cfg.onCancel === 'function') cfg.onCancel();
          resolve(null);
        }
      };

      this.openModal('modalAppPrompt');
      setTimeout(() => {
        if (inputEl) {
          inputEl.focus();
          if (inputEl.select) inputEl.select();
        }
      }, 120);
    });
  },

  submitAppPrompt(e) {
    if (e && e.preventDefault) e.preventDefault();
    const inputEl = document.getElementById('appPromptInput');
    const val = inputEl ? inputEl.value : '';
    this.closeAppPrompt(val);
  },

  closeAppPrompt(val) {
    this.closeModal('modalAppPrompt');
    if (typeof this._promptCallback === 'function') {
      const cb = this._promptCallback;
      this._promptCallback = null;
      cb(val);
    }
  },

  reassignExpenseLot(expId) {
    const exp = (appState.expenses || []).find(e => e.id === expId);
    if (!exp) return;

    const idInput = document.getElementById('reassignExpenseId');
    const titleEl = document.getElementById('reassignExpenseTitle');
    const amountEl = document.getElementById('reassignExpenseAmount');
    const selectEl = document.getElementById('reassignExpenseLotSelect');

    if (idInput) idInput.value = exp.id;
    if (titleEl) titleEl.textContent = exp.title || 'Dépense';
    if (amountEl) amountEl.textContent = `${this.formatMoney(exp.total || 0)}`;

    if (selectEl) {
      let optionsHtml = `<option value="general">${this.t('opt_general_farm') || 'Frais Généraux (Réparti sur tous les animaux)'}</option>`;
      (appState.animals || []).forEach(a => {
        const displayName = this.getAnimalDisplayName(a);
        const lotNum = (a.name && a.name.toString().trim() !== '') ? (appState.lang === 'ar' ? `دفعة #${a.name}` : `Lot #${a.name}`) : '';
        const label = lotNum ? `${displayName} (${lotNum})` : displayName;
        const selected = (exp.linkedLotId === a.id) ? 'selected' : '';
        optionsHtml += `<option value="${a.id}" ${selected}>${label}</option>`;
      });
      selectEl.innerHTML = optionsHtml;
      selectEl.value = exp.linkedLotId || 'general';
    }

    this.openModal('modalReassignExpenseLot');
  },

  submitReassignExpenseLot(e) {
    if (e && e.preventDefault) e.preventDefault();
    const idInput = document.getElementById('reassignExpenseId');
    const selectEl = document.getElementById('reassignExpenseLotSelect');
    if (!idInput || !selectEl) return;

    const exp = (appState.expenses || []).find(e => e.id === idInput.value);
    if (!exp) return;

    exp.linkedLotId = selectEl.value;
    this.saveState();
    this.closeModal('modalReassignExpenseLot');
    this.renderAll();

    const isAr = appState.lang === 'ar';
    const lotName = selectEl.options[selectEl.selectedIndex]?.text || '';
    this.showToast(isAr ? `تم ربط المصاريف بـ : ${lotName}` : `Dépense affectée à : ${lotName}`);
    if (window.appAuth && appAuth.pushData) {
      appAuth.pushData();
    }
  },

  // ==========================================
  // RENDER MASTER
  // ==========================================
  renderAll() {
    this.renderDashboard();
    this.renderEggStock();
    this.renderFarmFeedSummary();
    this.renderAnimals();
    this.renderExpenses();
    this.renderSales();
    this.renderSmartCalculations();
    this.renderIncubator();
    this.renderCalendar();
    this.updateBadges();
  },

  updateBadges() {
    const totalAnimals = appState.animals.reduce((sum, a) => sum + (Number(a.currentQuantity) || 0), 0);
    const animalsBadge = document.getElementById('countAnimalsBadge');
    if (animalsBadge) animalsBadge.textContent = totalAnimals;

    const activeIncubators = appState.incubatorBatches.filter(b => b.status !== 'hatched').length;
    const incubatorBadge = document.getElementById('countIncubatorBadge');
    if (incubatorBadge) incubatorBadge.textContent = activeIncubators;
  },

  // ==========================================
  // DASHBOARD RENDERING & CALCULATIONS
  // ==========================================
  renderDashboard() {
    // Financial calculations
    const totalRevenue = appState.sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalExpenses = appState.expenses.reduce((sum, e) => sum + (Number(e.total) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const marginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

    // Animal head count
    const totalAnimals = appState.animals.reduce((sum, a) => sum + (Number(a.currentQuantity) || 0), 0);

    // Feed expenses share
    const feedExpenses = appState.expenses
      .filter(e => e.category === 'nourriture')
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);
    const feedShare = totalExpenses > 0 ? Math.round((feedExpenses / totalExpenses) * 100) : 0;

    // Update KPI UI
    const kpiRev = document.getElementById('kpiTotalRevenue');
    if (kpiRev) kpiRev.textContent = this.formatMoney(totalRevenue);
    
    const kpiRevCount = document.getElementById('kpiRevenueCount');
    if (kpiRevCount) kpiRevCount.textContent = this.t('kpi_revenue_sub', { n: appState.sales.length });

    const kpiExp = document.getElementById('kpiTotalExpenses');
    if (kpiExp) kpiExp.textContent = this.formatMoney(totalExpenses);

    const kpiFeed = document.getElementById('kpiFeedShare');
    if (kpiFeed) kpiFeed.textContent = this.t('kpi_feed_share', { p: feedShare });

    const kpiProfit = document.getElementById('kpiNetProfit');
    if (kpiProfit) {
      kpiProfit.textContent = (netProfit >= 0 ? '+' : '') + this.formatMoney(netProfit);
      kpiProfit.className = `metric-value ${netProfit >= 0 ? 'text-emerald' : 'text-rose'}`;
    }

    const kpiBadge = document.getElementById('kpiMarginBadge');
    if (kpiBadge) {
      kpiBadge.textContent = this.t('kpi_margin_badge', { m: `${marginPercent >= 0 ? '+' : ''}${marginPercent}` });
      kpiBadge.style.color = marginPercent >= 0 ? 'var(--primary)' : 'var(--accent-rose)';
    }

    const kpiAnimals = document.getElementById('kpiTotalAnimals');
    if (kpiAnimals) kpiAnimals.textContent = this.t('kpi_animals_unit', { n: totalAnimals });

    // Sidebar Summary Box
    const sideMargin = document.getElementById('sidebarMarginVal');
    const sideProfit = document.getElementById('sidebarProfitVal');
    const sideProgress = document.getElementById('sidebarProgressBar');
    if (sideMargin) sideMargin.textContent = `${marginPercent >= 0 ? '+' : ''}${marginPercent}%`;
    if (sideProfit) sideProfit.textContent = this.formatMoney(netProfit);
    if (sideProgress) {
      const positivePercent = Math.min(Math.max(Number(marginPercent) + 30, 10), 100);
      sideProgress.style.width = `${positivePercent}%`;
    }

    // Alerts for critical farm events
    this.renderDashboardAlerts();

    // Breakdown Bars (Revenue & Expenses)
    this.renderBreakdowns(totalRevenue, totalExpenses);

    // Recent Transactions
    this.renderRecentTransactions();
  },

  renderDashboardAlerts() {
    const container = document.getElementById('dashboardAlerts');
    if (!container) return;
    container.innerHTML = '';

    const now = this.getTodayDate();

    // Vérifier les couvées arrivées à l'éclosion (21 jours +/- 2 jours)
    appState.incubatorBatches.forEach(b => {
      const hatch = new Date(b.hatchDate);
      const diff = Math.ceil((hatch - now) / (1000 * 60 * 60 * 24));
      
      // Dans la fenêtre d'éclosion (entre -2 jours et +2 jours, ou dépassé)
      if (diff <= 2 && b.status !== 'hatched') {
        const div = document.createElement('div');
        div.className = 'alert-card alert-warning';
        div.style.cssText = 'padding: 1.1rem; border: 2px solid var(--accent-amber); background: linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(217, 119, 6, 0.12)); display: flex; flex-direction: column; gap: 0.6rem; align-items: stretch;';
        div.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.95rem; font-weight:800; color:var(--accent-amber);">
              ${this.t('hatch_alert_title')}
            </span>
            <span class="badge-pill">${b.method === 'poule' ? this.t('hatch_alert_method_hen') : this.t('hatch_alert_method_machine')}</span>
          </div>
          <div style="font-size:0.875rem;">
            ${this.t('hatch_alert_text', { name: b.name, count: b.eggsCount, breed: b.breed })}
          </div>
          <div style="display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap; margin-top:0.2rem;">
            <button class="btn btn-sm btn-amber bold" onclick="app.triggerHatchNotification('${b.id}')">
              ${this.t('btn_declare_hatched_action')}
            </button>
            <small class="text-muted">${this.t('hatch_alert_note') || this.t('hatch_alert_helper') || "Le nombre de poulets/animaux s'ajoutera automatiquement."}</small>
          </div>
        `;
        container.appendChild(div);
      }
    });

    // Welcome banner when user starts from 0 with no animals yet
    if (container.children.length === 0 && appState.animals.length === 0) {
      const div = document.createElement('div');
      div.className = 'alert-card alert-info';
      div.style.cssText = 'padding: 1.2rem; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08)); border: 1px solid var(--primary-glow); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.8rem;';
      div.innerHTML = `
        <div>
          <h4 style="margin: 0 0 0.3rem; color: var(--primary); font-size: 1rem; font-weight: 800;">${this.t('welcome_title')}</h4>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${this.t('welcome_desc')}</p>
        </div>
        <button class="btn btn-sm btn-primary bold" onclick="app.openModal('modalAddAnimal')">
          ${this.t('btn_declare_first_animal')}
        </button>
      `;
      container.appendChild(div);
    }
  },

  dismissSaleAlert(animalId) {
    if (!Array.isArray(appState.dismissedSaleAlerts)) {
      appState.dismissedSaleAlerts = [];
    }
    if (!appState.dismissedSaleAlerts.includes(animalId)) {
      appState.dismissedSaleAlerts.push(animalId);
      this.saveState();
    }
    this.renderDashboardAlerts();
  },

  renderBreakdowns(totalRev, totalExp) {
    // Revenue breakdown by product type
    const revContainer = document.getElementById('revenueBreakdownList');
    if (revContainer) {
      revContainer.innerHTML = '';
      const revByCategory = {};
      appState.sales.forEach(s => {
        revByCategory[s.productType] = (revByCategory[s.productType] || 0) + (Number(s.total) || 0);
      });

      const catLabels = {
        oeufs: this.t('preset_eggs') || 'Œufs (Haras / Plateaux)',
        'poulet-croissance': this.t('preset_chicken_growth') || 'Poulets (1 à 6 mois)',
        poulet: this.t('preset_chicken_growth') || 'Poulets (1 à 6 mois)',
        'poussin-1j': this.t('preset_chicks_1d') || 'Poussins 1 jour',
        'poussin-demarre': this.t('preset_chicks_started') || 'Poussins démarrés',
        poussin: this.t('preset_chicks_started') || 'Poussins démarrés',
        'poulet-adulte': this.t('preset_chicken_adult') || '🐓 Coqs Adultes',
        pintade: this.t('opt_sale_pintade') || '🪶 Pintades',
        canard: this.t('opt_sale_canard') || '🦆 Canards de Barbarie',
        autre: this.t('opt_sale_other') || 'Autres volailles'
      };

      const entries = Object.entries(revByCategory).sort((a, b) => b[1] - a[1]);
      if (entries.length === 0) {
        revContainer.innerHTML = `<p class="text-muted text-center">${this.t('breakdown_revenue_empty')}</p>`;
      } else {
        entries.forEach(([type, amount]) => {
          const pct = totalRev > 0 ? Math.round((amount / totalRev) * 100) : 0;
          revContainer.innerHTML += `
            <div class="breakdown-item">
              <div class="breakdown-info">
                <span>${catLabels[type] || type}</span>
                <span class="text-emerald">${this.formatMoney(amount)} (${pct}%)</span>
              </div>
              <div class="breakdown-bar-bg">
                <div class="breakdown-bar-fill" style="width: ${pct}%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
              </div>
            </div>
          `;
        });
      }
    }

    // Expense breakdown by category
    const expContainer = document.getElementById('expenseBreakdownList');
    if (expContainer) {
      expContainer.innerHTML = '';
      const expByCategory = {};
      appState.expenses.forEach(e => {
        expByCategory[e.category] = (expByCategory[e.category] || 0) + (Number(e.total) || 0);
      });

      const catLabels = {
        nourriture: this.t('exp_cat_food') || 'Aliments',
        veterinaire: this.t('exp_cat_vet') || 'Vétérinaire',
        electricite: this.t('exp_cat_elec') || 'Électricité',
        eau: this.t('exp_cat_water') || 'Eau',
        salaire: this.t('exp_cat_sal') || 'Salaires',
        autre: this.t('exp_cat_other') || 'Autres'
      };

      const colors = {
        nourriture: '#f59e0b',
        veterinaire: '#8b5cf6',
        electricite: '#06b6d4',
        eau: '#3b82f6',
        salaire: '#10b981',
        autre: '#64748b'
      };

      const entries = Object.entries(expByCategory).sort((a, b) => b[1] - a[1]);
      if (entries.length === 0) {
        expContainer.innerHTML = `<p class="text-muted text-center">${this.t('breakdown_expense_empty')}</p>`;
      } else {
        entries.forEach(([cat, amount]) => {
          const pct = totalExp > 0 ? Math.round((amount / totalExp) * 100) : 0;
          const barColor = colors[cat] || '#10b981';
          expContainer.innerHTML += `
            <div class="breakdown-item">
              <div class="breakdown-info">
                <span>${catLabels[cat] || cat}</span>
                <span class="text-rose">${this.formatMoney(amount)} (${pct}%)</span>
              </div>
              <div class="breakdown-bar-bg">
                <div class="breakdown-bar-fill" style="width: ${pct}%; background: ${barColor};"></div>
              </div>
            </div>
          `;
        });
      }
    }
  },

  renderRecentTransactions() {
    const tableBody = document.getElementById('recentTransactionsTable');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    // Merge sales and expenses with a type tag
    const items = [
      ...appState.sales.map(s => ({ ...s, isSale: true, dateObj: new Date(s.date) })),
      ...appState.expenses.map(e => ({ ...e, isSale: false, dateObj: new Date(e.date) }))
    ].sort((a, b) => b.dateObj - a.dateObj).slice(0, 7);

    if (items.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">${this.t('no_transaction')}</td></tr>`;
      return;
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      const isSale = item.isSale;
      const typeBadge = isSale
        ? `<span class="badge-tag text-emerald">${this.t('badge_income')}</span>`
        : `<span class="badge-tag text-rose" style="background:var(--accent-rose-light);">${this.t('badge_expense')}</span>`;
      
      const desc = isSale ? item.description : item.title;
      const lotName = this.getLotNameById(item.linkedLotId);
      const amount = (isSale ? '+' : '-') + this.formatMoney(item.total);
      const amountClass = isSale ? 'text-emerald bold' : 'text-rose bold';

      tr.innerHTML = `
        <td>${this.formatDateFR(item.date)}</td>
        <td>${typeBadge}</td>
        <td><strong>${desc}</strong></td>
        <td><small class="text-muted">${lotName}</small></td>
        <td class="${amountClass}">${amount}</td>
        <td><span class="badge-pill">${isSale ? this.t('status_received') : this.t('status_paid')}</span></td>
      `;
      tableBody.appendChild(tr);
    });
  },

  // ==========================================
  // AGRONOMIC FEED ENGINE & OFFICIAL PORTIONS MATRIX
  // (Barème zootechnique officiel - Poule & Canard)
  // ==========================================

  getDailyGramsForAge(species = 'poulet', day = 1, stage = '', breed = '') {
    const sp = (species || '').toLowerCase();
    const d = Math.max(1, Math.round(Number(day) || 1));
    const stg = (stage || '').toLowerCase();
    const brd = (breed || '').toLowerCase();

    // 1. CANARD / PALMIPÈDES (Table officielle)
    if (sp === 'canard' || sp === 'canard_barbarie' || sp.includes('duck')) {
      if (d <= 21) return 40;   // 0 à 3 sem (J1–J21): ~40 g (Ci 1.3)
      if (d <= 49) return 90;   // 4 à 7 sem (J22–J49): ~90 g (Ci 3.0)
      if (d <= 84) return 140;  // 8 à 12 sem (J50–J84): ~140 g (Ci 4.7)
      if (d <= 112) return 170; // 13 à 16 sem (J85–J112): ~170 g (Ci 5.7)
      
      // Adulte (> 112j / > 16 sem / > 4 mois)
      const isMale = stg.includes('mâle') || stg.includes('male') || stg.includes('ذكر') || brd.includes('mâle') || brd.includes('male');
      const isFemale = stg.includes('femelle') || stg.includes('female') || stg.includes('أنثى') || stg.includes('canne') || brd.includes('canne');
      if (isMale) return 170;   // Canard adulte mâle: ~170 g (Ci 5.7)
      if (isFemale) return 130; // Canne adulte femelle: ~130 g (Ci 4.3)
      return 150;               // Moyenne adulte mixte: ~150 g (Ci 5.0)
    }

    // 2. PINTADE
    if (sp === 'pintade' || sp.includes('guinea')) {
      if (d <= 28) return 26.5;
      if (d <= 84) return 62.5;
      return 107.5;
    }

    // 3. AUTRE VOLAILLE (Dinde, etc.)
    if (sp === 'autre' || sp === 'dinde' || sp.includes('turkey')) {
      if (d <= 28) return 35;
      if (d <= 84) return 75;
      return 120;
    }

    // 4. POULE & POULET / GALLINACÉS (Table officielle)
    if (d <= 28) return 30;   // 0 à 4 sem (J1–J28): ~30 g (Ci 1.0)
    if (d <= 70) return 60;   // 5 à 10 sem (J29–J70): ~60 g (Ci 2.0)
    if (d <= 112) return 80;  // 11 à 16 sem (J71–J112): ~80 g (Ci 2.7)
    if (d <= 154) return 95;  // 17 à 22 sem (J113–J154): ~95 g (Ci 3.2)

    // Adulte (> 154j / > 22 sem / > 5 mois)
    const isRooster = stg.includes('coq') || stg.includes('rooster') || stg.includes('سردوك') || stg.includes('فحل') || brd.includes('coq');
    if (isRooster) return 130; // Coq adulte: ~130 g (Ci 4.3)
    return 115;                // Poule pondeuse adulte: ~115 g (Ci 3.8)
  },

  getAgronomicFeedData(species = 'poulet', ageDays = 30, stage = '', breed = '') {
    const sp = (species || '').toLowerCase();
    const stg = (stage || '').toLowerCase();
    const brd = (breed || '').toLowerCase();
    const days = Math.max(1, Math.round(Number(ageDays) || 1));

    if (sp === 'canard' || sp === 'canard_barbarie' || sp.includes('duck')) {
      if (days <= 21) {
        return {
          minGrams: 35,
          maxGrams: 45,
          avgGrams: 40,
          dailyGrams: 40,
          ci: 1.3,
          stageKey: 'duck_starter',
          labelFr: 'Caneton démarrage',
          labelAr: 'فراخ بط بداية',
          labelEn: 'Duckling starter',
          notesFr: 'Miettes démarrage',
          notesAr: 'حبيبات بداية'
        };
      }
      if (days <= 49) {
        return {
          minGrams: 80,
          maxGrams: 100,
          avgGrams: 90,
          dailyGrams: 90,
          ci: 3.0,
          stageKey: 'duck_grower_1',
          labelFr: 'Caneton croissance',
          labelAr: 'بط نمو',
          labelEn: 'Duckling grower',
          notesFr: 'Croissance osseuse rapide',
          notesAr: 'نمو عظمي سريع'
        };
      }
      if (days <= 84) {
        return {
          minGrams: 125,
          maxGrams: 155,
          avgGrams: 140,
          dailyGrams: 140,
          ci: 4.7,
          stageKey: 'duck_grower_2',
          labelFr: 'Jeune canard croissance',
          labelAr: 'بط نمو',
          labelEn: 'Young duck grower',
          notesFr: 'Pic d\'appétit / plumage',
          notesAr: 'ذروة الشهية واكتمال الريش'
        };
      }
      if (days <= 112) {
        return {
          minGrams: 155,
          maxGrams: 185,
          avgGrams: 170,
          dailyGrams: 170,
          ci: 5.7,
          stageKey: 'duck_finishing',
          labelFr: 'Canard en finition',
          labelAr: 'بط مرحلة تسمين نهائي',
          labelEn: 'Duck finishing',
          notesFr: 'Prise de gras et masse',
          notesAr: 'اكتساب الوزن واللحم'
        };
      }
      
      const isMale = stg.includes('mâle') || stg.includes('male') || stg.includes('ذكر') || brd.includes('mâle') || brd.includes('male');
      const isFemale = stg.includes('femelle') || stg.includes('female') || stg.includes('أنثى') || stg.includes('canne') || brd.includes('canne');
      if (isMale) {
        return {
          minGrams: 160,
          maxGrams: 180,
          avgGrams: 170,
          dailyGrams: 170,
          ci: 5.7,
          stageKey: 'duck_adult_male',
          labelFr: 'Canard adulte mâle',
          labelAr: 'ذكر بط بالغ',
          labelEn: 'Adult Drake',
          notesFr: 'Pèse souvent le double',
          notesAr: 'يزن غالباً ضعف الأنثى'
        };
      }
      if (isFemale) {
        return {
          minGrams: 120,
          maxGrams: 140,
          avgGrams: 130,
          dailyGrams: 130,
          ci: 4.3,
          stageKey: 'duck_adult_female',
          labelFr: 'Canne adulte femelle',
          labelAr: 'أنثى بط بالغة',
          labelEn: 'Adult Female Duck',
          notesFr: 'Plus légère que le mâle (ponte)',
          notesAr: 'أخف وزناً من الذكر (إنتاج بيض)'
        };
      }
      return {
        minGrams: 135,
        maxGrams: 165,
        avgGrams: 150,
        dailyGrams: 150,
        ci: 5.0,
        stageKey: 'duck_adult_mixed',
        labelFr: 'Canard adulte',
        labelAr: 'بط بالغ',
        labelEn: 'Adult duck',
        notesFr: 'Si mâles et femelles mélangés',
        notesAr: 'في حالة خلط الذكور والإناث معاً'
      };
    }

    if (sp === 'pintade' || sp.includes('guinea')) {
      if (days <= 28) {
        return {
          minGrams: 20, maxGrams: 32, avgGrams: 26.5, dailyGrams: 26.5, ci: 0.9,
          stageKey: 'pintade_chick',
          labelFr: 'Pintadeaux démarrage',
          labelAr: 'كتاكيت دجاج الوادي',
          labelEn: 'Guinea Keets'
        };
      }
      if (days <= 84) {
        return {
          minGrams: 50, maxGrams: 75, avgGrams: 62.5, dailyGrams: 62.5, ci: 2.1,
          stageKey: 'pintade_grower',
          labelFr: 'Pintades croissance',
          labelAr: 'دجاج الوادي نمو',
          labelEn: 'Growing Guinea'
        };
      }
      return {
        minGrams: 95, maxGrams: 120, avgGrams: 107.5, dailyGrams: 107.5, ci: 3.6,
        stageKey: 'pintade_adult',
        labelFr: 'Pintades adultes',
        labelAr: 'دجاج الوادي بالغ',
        labelEn: 'Adult Guinea'
      };
    }

    if (sp === 'autre' || sp === 'dinde' || sp.includes('turkey')) {
      if (days <= 28) {
        return { minGrams: 25, maxGrams: 45, avgGrams: 35, dailyGrams: 35, ci: 1.2, stageKey: 'other_start', labelFr: 'Démarrage', labelAr: 'بداية', labelEn: 'Starter' };
      }
      if (days <= 84) {
        return { minGrams: 60, maxGrams: 90, avgGrams: 75, dailyGrams: 75, ci: 2.5, stageKey: 'other_grow', labelFr: 'Croissance', labelAr: 'نمو', labelEn: 'Grower' };
      }
      return { minGrams: 100, maxGrams: 140, avgGrams: 120, dailyGrams: 120, ci: 4.0, stageKey: 'other_adult', labelFr: 'Adulte', labelAr: 'بالغ', labelEn: 'Adult' };
    }

    // POULE & POULET / GALLINACÉS (Table officielle de l'éleveur)
    if (days <= 28) {
      return {
        minGrams: 25,
        maxGrams: 35,
        avgGrams: 30,
        dailyGrams: 30,
        ci: 1.0,
        stageKey: 'chicken_starter',
        labelFr: 'Poussin démarrage',
        labelAr: 'كتكوت بداية',
        labelEn: 'Chick starter',
        notesFr: 'Miettes / démarrage (protéines 20-22%)',
        notesAr: 'علف بادي 20-22% بروتين'
      };
    }
    if (days <= 70) {
      return {
        minGrams: 50,
        maxGrams: 70,
        avgGrams: 60,
        dailyGrams: 60,
        ci: 2.0,
        stageKey: 'chicken_grower',
        labelFr: 'Poulet croissance',
        labelAr: 'دجاج نمو',
        labelEn: 'Growing chicken',
        notesFr: 'Croissance soutenue',
        notesAr: 'نمو هيكلي سريع وترييش'
      };
    }
    if (days <= 112) {
      return {
        minGrams: 70,
        maxGrams: 90,
        avgGrams: 80,
        dailyGrams: 80,
        ci: 2.7,
        stageKey: 'chicken_young',
        labelFr: 'Poulet croissance',
        labelAr: 'دجاج نمو',
        labelEn: 'Young chicken',
        notesFr: 'Transition vers ponte / engraissement',
        notesAr: 'مرحلة البلوغ الأولي والتحضير'
      };
    }
    if (days <= 154) {
      return {
        minGrams: 85,
        maxGrams: 105,
        avgGrams: 95,
        dailyGrams: 95,
        ci: 3.2,
        stageKey: 'chicken_prelay',
        labelFr: 'Poulette finition',
        labelAr: 'بشاير مقبلة على البيض',
        labelEn: 'Pre-layer',
        notesFr: 'Aliment pré-ponte riche en calcium',
        notesAr: 'علف غني بالكالسيوم والبروتين'
      };
    }

    const isRooster = stg.includes('coq') || stg.includes('rooster') || stg.includes('سردوك') || stg.includes('فحل') || brd.includes('coq');
    if (isRooster) {
      return {
        minGrams: 120,
        maxGrams: 140,
        avgGrams: 130,
        dailyGrams: 130,
        ci: 4.3,
        stageKey: 'chicken_rooster',
        labelFr: 'Coq adulte',
        labelAr: 'سردوك بالغ',
        labelEn: 'Adult rooster',
        notesFr: 'Maintien de condition reproducteur',
        notesAr: 'فحول مخصبة للتلقيح'
      };
    }

    return {
      minGrams: 110,
      maxGrams: 120,
      avgGrams: 115,
      dailyGrams: 115,
      ci: 3.8,
      stageKey: 'chicken_adult_layer',
      labelFr: 'Poule pondeuse',
      labelAr: 'دجاجة بياضة',
      labelEn: 'Laying hen',
      notesFr: 'Plein pic de ponte (bouchon ponte)',
      notesAr: 'إنتاج البيض اليومي المستمر'
    };
  },

  calculateCumulativeFeedKg(species = 'poulet', ageDays = 30, stage = '', breed = '', startAgeDays = 0) {
    const totalDays = Math.max(0, Math.round(Number(ageDays) || 0));
    const startDays = Math.max(0, Math.round(Number(startAgeDays) || 0));
    if (totalDays <= startDays) return 0;

    let totalGrams = 0;
    for (let d = startDays + 1; d <= totalDays; d++) {
      totalGrams += this.getDailyGramsForAge(species, d, stage, breed);
    }
    return parseFloat((totalGrams / 1000).toFixed(3));
  },

  getAverageFeedPricePerKg() {
    // 1. Si l'éleveur a déclaré son prix d'aliment en stock de réserve (ex: 1.00 DT/kg pour 45 DT / 45 kg)
    if (appState.feedStockCostPerKg && Number(appState.feedStockCostPerKg) > 0) {
      return Number(appState.feedStockCostPerKg);
    }

    // 2. Si des dépenses d'aliments avec quantités réelles en kg existent
    const feedExpenses = (appState.expenses || []).filter(e => e.category === 'nourriture' && Number(e.total) > 0);
    let totalKg = 0;
    let totalCost = 0;
    feedExpenses.forEach(e => {
      const q = Number(e.quantity) || 0;
      const t = Number(e.total) || 0;
      if (q >= 5) {
        totalKg += q;
        totalCost += t;
      }
    });
    if (totalKg > 0 && totalCost > 0) {
      return totalCost / totalKg;
    }

    if (Array.isArray(appState.feedTypes) && appState.feedTypes.length > 0) {
      let totalKg = 0;
      let totalVal = 0;
      appState.feedTypes.forEach(ft => {
        const k = Number(ft.stockKg) || 0;
        const p = Number(ft.pricePerKg) || 1.0;
        totalKg += k;
        totalVal += k * p;
      });
      if (totalKg > 0) return totalVal / totalKg;
      const sumPrices = appState.feedTypes.reduce((s, ft) => s + (Number(ft.pricePerKg) || 1.0), 0);
      return sumPrices / appState.feedTypes.length;
    }

    const cur = appState.currency || 'TND';
    if (cur === 'EUR') return 0.50;
    if (cur === 'USD') return 0.55;
    if (cur === 'DZD') return 85.0;
    if (cur === 'MAD') return 5.50;
    if (cur === 'FCFA') return 350.0;
    // Standard TND (Tunisia: sac 50kg = ~74 DT -> 1.480 DT/kg)
    return 1.480;
  },

  getAvailableFeedStockKg() {
    if (Array.isArray(appState.feedTypes) && appState.feedTypes.length > 0) {
      return appState.feedTypes.reduce((sum, ft) => sum + (Number(ft.stockKg) || 0), 0);
    }

    const feedPriceKg = this.getAverageFeedPricePerKg();

    // 1. Si l'éleveur a déclaré manuellement son inventaire physique (ex: 65 kg)
    if (appState.feedStockKg !== null && appState.feedStockKg !== undefined) {
      const baseStock = Number(appState.feedStockKg) || 0;
      if (!appState.feedStockDate) return baseStock;
      
      const daysSince = Math.max(0, this.calculateAgeInDays(appState.feedStockDate));
      if (daysSince === 0) return baseStock;

      let dailyGrams = 0;
      (appState.animals || []).forEach(a => {
        const qty = Number(a.currentQuantity) || 0;
        if (qty <= 0) return;
        const aAge = this.calculateAgeInDays(a.birthDate) + (Number(a.arrivalAgeDays) || 0);
        const feedData = this.getAgronomicFeedData(a.species, aAge, a.stage, a.breed);
        dailyGrams += qty * feedData.avgGrams;
      });
      const dailyKg = dailyGrams / 1000;
      return Math.max(0, baseStock - (daysSince * dailyKg));
    }

    // 2. Sinon, calcul automatique (Total acheté - Total mangé)
    const totalPurchasedFeedCost = (appState.expenses || [])
      .filter(e => e.category === 'nourriture')
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);

    const totalConsumedFeedCost = (appState.animals || []).reduce((sum, a) => {
      const aAge = this.calculateAgeInDays(a.birthDate) + (Number(a.arrivalAgeDays) || 0);
      const aStartAge = Number(a.arrivalAgeDays) || 0;
      const cKg = this.calculateCumulativeFeedKg(a.species, aAge, a.stage, a.breed, aStartAge);
      return sum + ((Number(a.currentQuantity) || 0) * cKg * feedPriceKg);
    }, 0);

    const feedStockRemaining = Math.max(0, totalPurchasedFeedCost - totalConsumedFeedCost);
    return feedPriceKg > 0 ? (feedStockRemaining / feedPriceKg) : 0;
  },

  getFeedDisplayName(ft) {
    if (!ft) return '';
    const lang = appState.lang || 'fr';
    const name = String(ft.name || '');
    const id = String(ft.id || ft.feedTypeId || '');
    const lower = name.toLowerCase();

    // Blé / قمح (Notice: "بليه" is permanently excluded from display and replaced by Blé / قمح)
    if (id === 'feed-ble' || lower.includes('blé') || lower.includes('ble') || name.includes('قمح') || name.includes('بليه')) {
      if (lang === 'ar') return 'قمح';
      if (lang === 'en') return 'Wheat';
      return 'Blé';
    }
    // Bouchon / Aliment ponte
    if (id === 'feed-bouchon' || name.includes('بوشون') || lower.includes('ponte') || lower.includes('bouchon')) {
      if (lang === 'ar') return 'علف بياضة (بوشون)';
      if (lang === 'en') return 'Layer Feed (Pellets)';
      return 'Aliment ponte (Bouchon)';
    }
    // Maïs
    if (lower.includes('maïs') || lower.includes('mais') || name.includes('ذرَة') || name.includes('ذرة')) {
      if (lang === 'ar') return 'ذرة مرحية';
      if (lang === 'en') return 'Cracked Corn';
      return 'Maïs concassé';
    }
    // Son
    if (lower.includes('son') || name.includes('نخالة')) {
      if (lang === 'ar') return 'نخالة القمح';
      if (lang === 'en') return 'Wheat Bran';
      return 'Son de blé';
    }
    // Démarrage
    if (lower.includes('démarrage') || lower.includes('demarrage') || name.includes('بداية')) {
      if (lang === 'ar') return 'علف بداية';
      if (lang === 'en') return 'Starter Feed';
      return 'Aliment démarrage';
    }
    // Féverole
    if (lower.includes('feverole') || lower.includes('féverole') || name.includes('فول')) {
      if (lang === 'ar') return 'فول مدشش';
      if (lang === 'en') return 'Faba Beans';
      return 'Féverole';
    }
    return name;
  },

  getFeedShortName(ft) {
    if (!ft) return '';
    const lang = appState.lang || 'fr';
    const name = String(ft.name || '');
    const id = String(ft.id || ft.feedTypeId || '');
    const lower = name.toLowerCase();

    // Blé / قمح
    if (id === 'feed-ble' || lower.includes('blé') || lower.includes('ble') || name.includes('قمح') || name.includes('بليه')) {
      if (lang === 'ar') return 'قمح';
      if (lang === 'en') return 'Wheat';
      return 'Blé';
    }
    // Bouchon
    if (id === 'feed-bouchon' || name.includes('بوشون') || lower.includes('ponte') || lower.includes('bouchon')) {
      if (lang === 'ar') return 'بوشون';
      if (lang === 'en') return 'Pellets';
      return 'Bouchon';
    }
    // Maïs
    if (lower.includes('maïs') || lower.includes('mais') || name.includes('ذرَة') || name.includes('ذرة')) {
      if (lang === 'ar') return 'ذرة';
      if (lang === 'en') return 'Corn';
      return 'Maïs';
    }
    // Son
    if (lower.includes('son') || name.includes('نخالة')) {
      if (lang === 'ar') return 'نخالة';
      if (lang === 'en') return 'Bran';
      return 'Son';
    }
    // Démarrage
    if (lower.includes('démarrage') || lower.includes('demarrage') || name.includes('بداية')) {
      if (lang === 'ar') return 'علف بداية';
      if (lang === 'en') return 'Starter';
      return 'Démarrage';
    }
    // Féverole
    if (lower.includes('feverole') || lower.includes('féverole') || name.includes('فول')) {
      if (lang === 'ar') return 'فول';
      if (lang === 'en') return 'Beans';
      return 'Féverole';
    }
    return name.split(' ')[0] || name;
  },

  sanitizeFeedTypes(feedTypes) {
    if (!Array.isArray(feedTypes) || feedTypes.length === 0) {
      return [
        { id: 'feed-ble', name: 'Blé', stockKg: 0, pricePerKg: 1.10 },
        { id: 'feed-bouchon', name: 'Aliment ponte (Bouchon)', stockKg: 0, pricePerKg: 1.50 }
      ];
    }
    let list = feedTypes.map(ft => {
      let name = ft.name || '';
      if (name.includes('بليه') || name === 'قمح / بليه') {
        name = 'Blé';
      }
      return { ...ft, name };
    });

    const hasBle = list.some(ft => ft.id === 'feed-ble' || (ft.name && (ft.name.toLowerCase().includes('blé') || ft.name.toLowerCase().includes('ble') || ft.name.includes('قمح'))));
    const hasBouchon = list.some(ft => ft.id === 'feed-bouchon' || (ft.name && (ft.name.toLowerCase().includes('bouchon') || ft.name.toLowerCase().includes('ponte') || ft.name.includes('بوشون'))));

    if (!hasBle) {
      list.unshift({ id: 'feed-ble', name: 'Blé', stockKg: 0, pricePerKg: 1.10 });
    }
    if (!hasBouchon) {
      list.push({ id: 'feed-bouchon', name: 'Aliment ponte (Bouchon)', stockKg: 0, pricePerKg: 1.50 });
    }
    return list;
  },

  renderSmartFeedPresets() {
    const container = document.getElementById('feedSmartPresetsContainer');
    if (!container) return;

    const hasHistory = Array.isArray(appState.feedDistributions) && appState.feedDistributions.length > 0;
    const favorite = appState.savedFavoriteFeedRoutine;
    const routine = favorite || (hasHistory ? appState.feedDistributions[0] : null);

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';

    let routineHtml = '';
    if (routine && Array.isArray(routine.items) && routine.items.length > 0) {
      const summaryItems = routine.items
        .map(it => `${it.kg} ${unitKg} ${this.getFeedShortName(it)}`)
        .slice(0, 3)
        .join(' + ');
      const totalKg = routine.totalKg || routine.items.reduce((sum, it) => sum + (Number(it.kg) || 0), 0);
      const halfKg = (totalKg * 0.5).toFixed(2);
      const halfLabel = isAr ? `${halfKg} كغ إجمالي` : `${halfKg} kg total`;

      routineHtml = `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 0.55rem; margin-bottom: 0.55rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span style="font-weight: 800; font-size: 0.78rem; color: var(--accent-emerald);">
              ${this.t('feed_smart_title')}
            </span>
            <span class="badge-pill text-emerald" style="font-size: 0.68rem; background: rgba(16, 185, 129, 0.15);">
              ${this.t('feed_smart_learned_badge')}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 0.35rem;">
            <button type="button" class="btn btn-outline btn-emerald" style="padding: 0.45rem 0.3rem; font-size: 0.75rem; font-weight: 800; border-color: var(--accent-emerald);" onclick="app.applyLearnedRoutine('repeat')">
              ⭐ ${this.t('feed_smart_repeat')}<br>
              <span style="font-size: 0.66rem; color: var(--accent-emerald); font-weight: 700;">${summaryItems || totalKg.toFixed(1) + ' ' + unitKg}</span>
            </button>
            <button type="button" class="btn btn-outline" style="padding: 0.45rem 0.3rem; font-size: 0.75rem; font-weight: 700;" onclick="app.applyLearnedRoutine('half')">
              ☀️ ${this.t('feed_smart_half')}<br>
              <span style="font-size: 0.66rem; color: var(--text-muted);">${halfLabel}</span>
            </button>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
        <label class="form-label" style="font-weight: 700; font-size: 0.8rem; margin: 0;">
          ${this.t('feed_smart_starter_title')}
        </label>
        <span class="badge-pill" style="font-size: 0.68rem; color: var(--accent-amber); background: rgba(245, 158, 11, 0.1);">
          ⚡ 1-Clic
        </span>
      </div>

      ${routineHtml}

      <!-- Combos 1-clic Blé + Bouchon -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.4rem; margin-bottom: 0.4rem;">
        <button type="button" class="btn btn-outline btn-preset-combo" onclick="app.applyDistribPreset('ble_1_bouchon_1')">
          <div style="font-weight: 800; font-size: 0.8rem; color: var(--accent-emerald);">${this.t('feed_preset_combo_1_1')}</div>
          <div style="font-size: 0.67rem; color: var(--text-muted);">${this.t('feed_preset_combo_1_1_sub')}</div>
        </button>
        <button type="button" class="btn btn-outline btn-preset-combo" onclick="app.applyDistribPreset('ble_1_bouchon_half')">
          <div style="font-weight: 800; font-size: 0.8rem; color: var(--accent-amber);">${this.t('feed_preset_combo_1_half')}</div>
          <div style="font-size: 0.67rem; color: var(--text-muted);">${this.t('feed_preset_combo_1_half_sub')}</div>
        </button>
      </div>

      <!-- Raccourcis individuels + Reset -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35rem;">
        <button type="button" class="btn btn-outline" style="padding: 0.38rem 0.2rem; font-size: 0.72rem; font-weight: 700;" onclick="app.applyDistribPreset('ble_1_only')">
          ${this.t('feed_preset_ble_only')}
        </button>
        <button type="button" class="btn btn-outline" style="padding: 0.38rem 0.2rem; font-size: 0.72rem; font-weight: 700;" onclick="app.applyDistribPreset('bouchon_1_only')">
          ${this.t('feed_preset_bouchon_only')}
        </button>
        <button type="button" class="btn btn-outline btn-emerald" style="padding: 0.38rem 0.2rem; font-size: 0.72rem; font-weight: 800;" onclick="app.applyDistribPreset('clear')">
          ${this.t('feed_smart_clear')}
        </button>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.35rem; flex-wrap: wrap; gap: 0.3rem;">
        <small style="font-size: 0.7rem; color: var(--text-muted);">
          ${this.t('feed_smart_learning_tip')}
        </small>
        <button type="button" class="btn btn-xs btn-outline" style="font-size: 0.68rem; padding: 0.15rem 0.45rem; font-weight: 700;" onclick="app.saveCurrentDistributionAsFavorite()">
          ${this.t('btn_save_favorite_routine')}
        </button>
      </div>
    `;
  },

  applyLearnedRoutine(mode) {
    const routine = appState.savedFavoriteFeedRoutine || (appState.feedDistributions && appState.feedDistributions[0]);
    if (!routine || !Array.isArray(routine.items)) {
      this.applyDistribPreset('ble_1_bouchon_1');
      return;
    }

    const ratio = mode === 'half' ? 0.5 : 1.0;

    // Réinitialiser les champs à zéro d'abord
    (appState.feedTypes || []).forEach(ft => {
      this.setFeedTypeDistribSicam(ft.id, 0);
    });

    // Remplir chaque aliment selon la routine mémorisée
    routine.items.forEach(it => {
      const cans = it.cans !== undefined ? Number(it.cans) * ratio : (Number(it.kg) * ratio) / 0.667;
      const feed = (appState.feedTypes || []).find(ft => ft.id === it.feedTypeId || ft.name === it.name || (it.name && ft.name && ft.name.toLowerCase().includes(it.name.toLowerCase())));
      if (feed) {
        this.setFeedTypeDistribSicam(feed.id, Math.round(cans * 2) / 2);
      }
    });

    this.recalcDistribTotal();
  },

  saveCurrentDistributionAsFavorite() {
    const items = [];
    let totalKg = 0;
    (appState.feedTypes || []).forEach(ft => {
      const input = document.getElementById(`distribKg_${ft.id}`);
      const kg = parseFloat(input?.value) || 0;
      if (kg > 0) {
        const cans = parseFloat((kg / 0.667).toFixed(1));
        items.push({ feedTypeId: ft.id, name: ft.name, kg: parseFloat(kg.toFixed(2)), cans });
        totalKg += kg;
      }
    });

    if (totalKg <= 0) {
      this.showToast('Veuillez indiquer les quantités distribuées avant de mémoriser.', 'warning');
      return;
    }

    appState.savedFavoriteFeedRoutine = {
      totalKg: parseFloat(totalKg.toFixed(2)),
      items
    };
    this.saveState();
    this.renderSmartFeedPresets();
    this.showToast(`⭐ Routine favorite mémorisée : ${totalKg.toFixed(2)} kg/j !`);
  },

  renderFeedSuggestions() {
    const container = document.getElementById('feedSuggestionsButtonsContainer');
    if (!container) return;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    const suggestions = [
      { key: 'mais', label: isAr ? '🌽 ذرة مرحية' : (isEn ? '🌽 Cracked corn' : '🌽 Maïs concassé'), val: isAr ? 'ذرة مرحية' : (isEn ? 'Cracked corn' : 'Maïs concassé') },
      { key: 'son', label: isAr ? '🌾 نخالة القمح' : (isEn ? '🌾 Wheat bran' : '🌾 Son de blé'), val: isAr ? 'نخالة القمح' : (isEn ? 'Wheat bran' : 'Son de blé') },
      { key: 'ponte', label: isAr ? '🥚 علف بياضة' : (isEn ? '🥚 Layer feed' : '🥚 Aliment ponte'), val: isAr ? 'علف بياضة' : (isEn ? 'Layer feed' : 'Aliment ponte') },
      { key: 'demarrage', label: isAr ? '🐥 علف بداية' : (isEn ? '🐥 Starter feed' : '🐥 Aliment démarrage'), val: isAr ? 'علف بداية' : (isEn ? 'Starter feed' : 'Aliment démarrage') },
      { key: 'feverole', label: isAr ? '🌱 فول مدشش' : (isEn ? '🌱 Faba beans' : '🌱 Féverole'), val: isAr ? 'فول مدشش' : (isEn ? 'Faba beans' : 'Féverole') }
    ];

    container.innerHTML = suggestions.map(s => `
      <button type="button" class="btn btn-xs btn-outline" onclick="document.getElementById('newFeedTypeName').value = '${s.val}'">
        ${s.label}
      </button>
    `).join('');

    const nameInput = document.getElementById('newFeedTypeName');
    if (nameInput) {
      nameInput.placeholder = '';
    }
  },

  setQuickFeedSuggestion(type) {
    const isAr = appState.lang === 'ar';
    const names = {
      mais: isAr ? 'ذرة مرحية' : 'Maïs concassé',
      son: isAr ? 'نخالة القمح' : 'Son de blé',
      ponte: isAr ? 'علف بياضة' : 'Aliment ponte',
      demarrage: isAr ? 'علف بداية' : 'Aliment démarrage',
      feverole: isAr ? 'فول مدشش' : 'Féverole concassée'
    };
    const input = document.getElementById('newFeedTypeName');
    if (input) input.value = names[type] || '';
  },

  renderFeedDistributionModal() {
    appState.feedTypes = this.sanitizeFeedTypes(appState.feedTypes);
    this.renderSmartFeedPresets();

    const container = document.getElementById('feedDistribItemsContainer');
    if (!container) return;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const inStockPrefix = isAr ? 'في المخزون :' : (isEn ? 'In stock:' : 'En stock :');
    const bteLabel = isAr ? 'علبة' : (isEn ? 'can' : 'bte');
    const sicamCansLabel = isAr ? 'علبة سيكام' : (isEn ? 'Sicam can(s)' : 'boîte(s) Sicam');

    let html = '';
    appState.feedTypes.forEach((ft) => {
      const defaultKg = '0.00';
      const stockKg = Number(ft.stockKg) || 0;
      const displayName = this.getFeedDisplayName(ft);

      html += `
        <div class="feed-distrib-card" style="background: var(--bg-surface); border: 1.5px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.75rem;">
          <!-- Titre & Badge Stock / Sélection -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.55rem; flex-wrap: wrap; gap: 0.35rem;">
            <div style="font-weight: 800; font-size: 1rem; color: var(--text-main); display: flex; align-items: center; gap: 0.35rem;">
              <span>🌾</span> <span>${displayName}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span id="distribCanBadge_${ft.id}" class="badge-pill text-muted" style="font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.55rem; background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                0 ${bteLabel}
              </span>
              <span class="badge-pill" style="font-size: 0.72rem; color: var(--accent-emerald); background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25);">
                ${inStockPrefix} <strong>${stockKg.toFixed(1)} ${unitKg}</strong>
              </span>
            </div>
          </div>

          <!-- Stepper [-] + Raccourcis Clic Rapide + Stepper [+] -->
          <div style="display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.55rem;">
            <button type="button" class="btn btn-outline" style="width: 38px; height: 38px; padding: 0; font-size: 1.25rem; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: var(--radius-sm);" onclick="app.adjustFeedTypeDistribSicamStep('${ft.id}', -0.5)" title="-0.5 can">
              −
            </button>
            <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.25rem; flex: 1;">
              <button type="button" class="btn btn-outline sicam-btn-${ft.id} active-sicam-btn" data-cans="0" style="padding: 0.4rem 0.1rem; font-size: 0.75rem; font-weight: 700; border-radius: var(--radius-sm);" onclick="app.setFeedTypeDistribSicam('${ft.id}', 0)">
                0
              </button>
              <button type="button" class="btn btn-outline sicam-btn-${ft.id}" data-cans="0.5" style="padding: 0.4rem 0.1rem; font-size: 0.72rem; font-weight: 700; border-radius: var(--radius-sm);" onclick="app.setFeedTypeDistribSicam('${ft.id}', 0.5)">
                0.5
              </button>
              <button type="button" class="btn btn-outline sicam-btn-${ft.id}" data-cans="1" style="padding: 0.4rem 0.1rem; font-size: 0.72rem; font-weight: 700; border-radius: var(--radius-sm);" onclick="app.setFeedTypeDistribSicam('${ft.id}', 1.0)">
                1
              </button>
              <button type="button" class="btn btn-outline sicam-btn-${ft.id}" data-cans="1.5" style="padding: 0.4rem 0.1rem; font-size: 0.72rem; font-weight: 700; border-radius: var(--radius-sm);" onclick="app.setFeedTypeDistribSicam('${ft.id}', 1.5)">
                1.5
              </button>
              <button type="button" class="btn btn-outline sicam-btn-${ft.id}" data-cans="2" style="padding: 0.4rem 0.1rem; font-size: 0.72rem; font-weight: 700; border-radius: var(--radius-sm);" onclick="app.setFeedTypeDistribSicam('${ft.id}', 2.0)">
                2
              </button>
            </div>
            <button type="button" class="btn btn-outline" style="width: 38px; height: 38px; padding: 0; font-size: 1.25rem; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: var(--radius-sm);" onclick="app.adjustFeedTypeDistribSicamStep('${ft.id}', 0.5)" title="+0.5 can">
              +
            </button>
          </div>

          <!-- Saisie directe en kg et équivalence -->
          <div style="display: flex; gap: 0.5rem; align-items: center; background: var(--bg-card); padding: 0.45rem 0.65rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
            <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700;">⚖️ ${isAr ? 'الوزن بالكغ :' : (isEn ? 'Weight (kg):' : 'Poids (kg) :')}</span>
            <input type="number" id="distribKg_${ft.id}" class="input-field distrib-kg-input" step="any" min="0" value="${defaultKg}" data-feed-id="${ft.id}" data-price="${ft.pricePerKg || 1}" style="font-weight: 800; font-size: 1.15rem; color: var(--accent-emerald); max-width: 110px; padding: 0.3rem 0.5rem;" oninput="app.recalcDistribTotal()">
            <span style="font-weight: 800; color: var(--text-main); font-size: 0.95rem;">${unitKg}</span>
            <span id="distribHint_${ft.id}" style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto; font-weight: 600;">
              0 ${bteLabel}
            </span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.recalcDistribTotal();
  },

  adjustFeedTypeDistribSicamStep(feedId, delta) {
    const input = document.getElementById(`distribKg_${feedId}`);
    const rawVal = String(input?.value || '').replace(',', '.');
    const currentKg = parseFloat(rawVal) || 0;
    const currentCans = currentKg / 0.667;
    let nextCans = Math.round((currentCans + delta) * 2) / 2;
    if (nextCans < 0) nextCans = 0;
    this.setFeedTypeDistribSicam(feedId, nextCans);
  },

  setFeedTypeDistribSicam(feedId, cans) {
    const cansNum = Math.max(0, Number(cans) || 0);
    const kg = (cansNum * 0.667).toFixed(2);
    const input = document.getElementById(`distribKg_${feedId}`);
    if (input) {
      input.value = kg;
    }

    // Mettre à jour l'état actif sur les boutons de cet aliment
    document.querySelectorAll(`.sicam-btn-${feedId}`).forEach(btn => {
      const btnCans = parseFloat(btn.getAttribute('data-cans'));
      if (Math.abs(btnCans - cansNum) < 0.05) {
        btn.classList.add('active-sicam-btn');
      } else {
        btn.classList.remove('active-sicam-btn');
      }
    });

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const canWord = isAr ? 'علبة' : (isEn ? 'can' : 'boîte');
    const cansWord = isAr ? 'علب' : (isEn ? 'cans' : 'boîtes');

    const badge = document.getElementById(`distribCanBadge_${feedId}`);
    if (badge) {
      badge.textContent = cansNum > 0 ? `🥫 ${cansNum} ${cansNum > 1 ? cansWord : canWord} (${kg} ${unitKg})` : (isAr ? '0 علبة' : '0 boîte');
      badge.className = cansNum > 0 ? 'badge-pill text-emerald' : 'badge-pill text-muted';
      badge.style.background = cansNum > 0 ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)';
    }

    const hint = document.getElementById(`distribHint_${feedId}`);
    if (hint) {
      hint.textContent = cansNum > 0 ? `~${cansNum} ${cansNum > 1 ? cansWord : canWord}` : (isAr ? '0 علبة' : '0 boîte');
    }

    this.recalcDistribTotal();
  },

  applyDistribPreset(presetName) {
    appState.feedTypes = this.sanitizeFeedTypes(appState.feedTypes);
    const bleFeed = (appState.feedTypes || []).find(ft => ft.id === 'feed-ble' || ft.name?.toLowerCase().includes('blé') || ft.name?.toLowerCase().includes('ble') || ft.name?.includes('قمح'));
    const bouchonFeed = (appState.feedTypes || []).find(ft => ft.id === 'feed-bouchon' || ft.name?.toLowerCase().includes('bouchon') || ft.name?.toLowerCase().includes('ponte') || ft.name?.includes('بوشون'));

    if (presetName === 'ble_1_bouchon_1') {
      (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 0));
      if (bleFeed) this.setFeedTypeDistribSicam(bleFeed.id, 1.0);
      if (bouchonFeed) this.setFeedTypeDistribSicam(bouchonFeed.id, 1.0);
    } else if (presetName === 'ble_1_bouchon_half') {
      (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 0));
      if (bleFeed) this.setFeedTypeDistribSicam(bleFeed.id, 1.0);
      if (bouchonFeed) this.setFeedTypeDistribSicam(bouchonFeed.id, 0.5);
    } else if (presetName === 'ble_1_only') {
      (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 0));
      if (bleFeed) this.setFeedTypeDistribSicam(bleFeed.id, 1.0);
    } else if (presetName === 'bouchon_1_only') {
      (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 0));
      if (bouchonFeed) this.setFeedTypeDistribSicam(bouchonFeed.id, 1.0);
    } else if (presetName === 'half_can') {
      (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 0.5));
    } else if (presetName === 'one_can') {
      (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 1.0));
    } else if (presetName === 'clear') {
      (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 0));
    }
    this.recalcDistribTotal();
  },

  recalcDistribTotal() {
    let totalKg = 0;
    let totalCost = 0;
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const canWord = isAr ? 'علبة' : (isEn ? 'can' : 'boîte');
    const cansWord = isAr ? 'علب' : (isEn ? 'cans' : 'boîtes');

    (appState.feedTypes || []).forEach(ft => {
      const input = document.getElementById(`distribKg_${ft.id}`);
      const rawVal = String(input?.value || '').replace(',', '.');
      const kg = parseFloat(rawVal) || 0;
      const cans = Math.round((kg / 0.667) * 2) / 2;
      const exactCans = (kg / 0.667).toFixed(1);

      // Synchroniser les classes actives des boutons
      document.querySelectorAll(`.sicam-btn-${ft.id}`).forEach(btn => {
        const btnCans = parseFloat(btn.getAttribute('data-cans'));
        if (kg > 0 && Math.abs(btnCans - cans) < 0.05) {
          btn.classList.add('active-sicam-btn');
        } else if (kg === 0 && btnCans === 0) {
          btn.classList.add('active-sicam-btn');
        } else {
          btn.classList.remove('active-sicam-btn');
        }
      });

      const badge = document.getElementById(`distribCanBadge_${ft.id}`);
      if (badge) {
        badge.textContent = kg > 0 ? `🥫 ${exactCans} ${isAr ? 'علبة' : 'boîte'} (${kg.toFixed(2)} ${unitKg})` : (isAr ? '0 علبة' : '0 boîte');
        badge.className = kg > 0 ? 'badge-pill text-emerald' : 'badge-pill text-muted';
        badge.style.background = kg > 0 ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)';
      }

      const hint = document.getElementById(`distribHint_${ft.id}`);
      if (hint) {
        hint.textContent = kg > 0 ? `~${exactCans} ${isAr ? 'علبة' : 'boîte'}` : (isAr ? '0 علبة' : '0 boîte');
      }

      totalKg += kg;
      totalCost += kg * (Number(ft.pricePerKg) || 1.0);
    });

    const totalCans = (totalKg / 0.667).toFixed(1);
    const totalKgEl = document.getElementById('distribTotalKg');
    const totalCansEl = document.getElementById('distribTotalCans');
    const totalCostEl = document.getElementById('distribTotalCost');

    if (totalKgEl) totalKgEl.textContent = `${totalKg.toFixed(2)} ${unitKg}`;
    if (totalCansEl) totalCansEl.textContent = `${totalCans} ${isAr ? 'علبة' : (isEn ? 'can(s)' : 'boîte(s)')}`;
    if (totalCostEl) totalCostEl.textContent = this.formatMoney(totalCost);
  },

  handleSaveFeedDistribution(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const dateInput = document.getElementById('distribDate');
    const date = (dateInput && dateInput.value) ? dateInput.value : this.getTodayStr();
    if (dateInput && !dateInput.value) dateInput.value = date;

    let totalKg = 0;
    let totalCost = 0;
    const items = [];

    (appState.feedTypes || []).forEach(ft => {
      const input = document.getElementById(`distribKg_${ft.id}`);
      const rawVal = String(input?.value || '').replace(',', '.');
      const kg = parseFloat(rawVal) || 0;
      if (kg > 0) {
        const cans = parseFloat((kg / 0.667).toFixed(1));
        const cost = kg * (Number(ft.pricePerKg) || 1.0);
        totalKg += kg;
        totalCost += cost;

        items.push({
          feedTypeId: ft.id,
          name: ft.name,
          kg: parseFloat(kg.toFixed(2)),
          cans: cans,
          cost: parseFloat(cost.toFixed(3))
        });

        // Déduire du stock de cet aliment spécifique
        ft.stockKg = Math.max(0, (Number(ft.stockKg) || 0) - kg);
      }
    });

    if (totalKg <= 0) {
      const isAr = appState.lang === 'ar';
      const isEn = appState.lang === 'en';
      const msg = isAr 
        ? 'يرجى اختيار كمية علف واحدة على الأقل قبل التأكيد (حدد علبة سيكام أو أدخل الكيلوغرام).' 
        : (isEn ? 'Please choose at least one feed quantity before confirming (select a can or enter kg).' : 'Veuillez indiquer au moins une quantité distribuée avant de valider (choisissez une boîte ou entrez les kg).');
      this.showToast(msg, 'warning');
      return;
    }

    const distrib = {
      id: 'distrib-' + Date.now().toString(36),
      date,
      totalKg: parseFloat(totalKg.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(3)),
      cans: parseFloat((totalKg / 0.667).toFixed(1)),
      items
    };

    if (!Array.isArray(appState.feedDistributions)) {
      appState.feedDistributions = [];
    }
    appState.feedDistributions.unshift(distrib);

    // Mettre à jour le stock global en kg
    appState.feedStockKg = (appState.feedTypes || []).reduce((sum, ft) => sum + (Number(ft.stockKg) || 0), 0);
    appState.feedStockDate = date;

    this.saveState();
    this.closeModal('modalFeedDistribution');
    this.renderAll();

    const details = items.map(it => `${it.kg}kg ${this.getFeedDisplayName(it).split(' ')[0]}`).join(' + ');
    this.showToast(`🌾 Distribution enregistrée : ${details} (Total ${totalKg.toFixed(1)} kg) !`);
  },

  renderFeedStockAdjustModal() {
    appState.feedTypes = this.sanitizeFeedTypes(appState.feedTypes);
    const container = document.getElementById('feedStockTypesContainer');
    if (!container) return;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const currSym = this.getCurrencySymbol();
    const unitKg = isAr ? 'كغ' : 'kg';
    const btnDeleteText = isAr ? '🗑️ حذف' : (isEn ? '🗑️ Delete' : '🗑️ Supprimer');
    const lblStockText = isAr ? 'المخزون بالمستودع (كغ)' : (isEn ? 'Stock in reserve (kg)' : 'Stock en réserve (kg)');
    const lblPriceText = isAr ? `سعر الكيلوغرام (${currSym}/${unitKg})` : (isEn ? `Price per kg (${currSym}/${unitKg})` : `Prix au kg (${currSym}/kg)`);
    const valStockText = isAr ? 'قيمة المخزون :' : (isEn ? 'Stock value:' : 'Valeur du stock :');

    const uncredited = (appState.expenses || []).filter(e => e.category === 'nourriture' && !e.feedStockAddedKg);
    let bannerHtml = '';
    if (uncredited.length > 0) {
      const alertTitle = isAr
        ? `💡 لديك ${uncredited.length} مشتريات أعلاف مسجلة لم تضاف بعد للمخزون الاحتياطي.`
        : (isEn
            ? `💡 You have ${uncredited.length} recorded feed purchase(s) not yet added to reserve stock.`
            : `💡 Vous avez ${uncredited.length} achat(s) d'aliments enregistré(s) non encore ajouté(s) au stock réserve.`);
      const btnText = isAr ? '📥 إضافة الكل للمخزون' : (isEn ? '📥 Add all to stock' : '📥 Mettre en stock');
      bannerHtml = `
        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: var(--radius-md); padding: 0.65rem 0.85rem; margin-bottom: 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <div style="font-size: 0.8rem; color: var(--text-main); font-weight: 600;">
            ${alertTitle}
          </div>
          <button type="button" class="btn btn-xs btn-emerald" style="font-weight: 700; padding: 4px 10px;" onclick="app.quickImportFoodExpensesToStock()">
            ${btnText}
          </button>
        </div>
      `;
    }

    let html = bannerHtml;
    appState.feedTypes.forEach(ft => {
      const stockKg = Number(ft.stockKg) || 0;
      const priceKg = Number(ft.pricePerKg) || 1.0;
      const subtotal = stockKg * priceKg;
      const displayName = this.getFeedDisplayName(ft);
      const isBaseFeed = ft.id === 'feed-ble' || ft.id === 'feed-bouchon';

      html += `
        <div class="feed-stock-row" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.75rem; margin-bottom: 0.65rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
            <strong style="color: var(--text-main); font-size: 0.95rem;">🌾 ${displayName}</strong>
            ${!isBaseFeed ? `
              <button type="button" class="btn btn-xs btn-outline" style="color: var(--accent-rose); padding: 0.15rem 0.45rem; font-size: 0.7rem;" onclick="app.deleteFeedType('${ft.id}')">
                ${btnDeleteText}
              </button>
            ` : ''}
          </div>
          <div class="form-row" style="margin-bottom: 0; gap: 0.5rem;">
            <div class="form-group flex-1" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.72rem; font-weight: 700;">${lblStockText}</label>
              <input type="number" id="stockKg_${ft.id}" class="input-field" step="0.5" min="0" value="${stockKg.toFixed(1)}" style="font-weight: 800; font-size: 1.1rem; color: var(--accent-amber);" oninput="app.recalcStockAdjustValuation()">
            </div>
            <div class="form-group flex-1" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.72rem; font-weight: 700;">${lblPriceText}</label>
              <input type="number" id="priceKg_${ft.id}" class="input-field" step="0.01" min="0" value="${priceKg.toFixed(2)}" style="font-weight: 700; font-size: 1.05rem;" oninput="app.recalcStockAdjustValuation()">
            </div>
          </div>
          <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 0.35rem; text-align: right;">
            ${valStockText} <strong style="color: var(--accent-emerald);" id="subtotalVal_${ft.id}">${this.formatMoney(subtotal)}</strong>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.recalcStockAdjustValuation();
  },

  recalcStockAdjustValuation() {
    let totalKg = 0;
    let totalVal = 0;

    (appState.feedTypes || []).forEach(ft => {
      const kg = parseFloat(document.getElementById(`stockKg_${ft.id}`)?.value) || 0;
      const price = parseFloat(document.getElementById(`priceKg_${ft.id}`)?.value) || 0;
      const subtotal = kg * price;
      totalKg += kg;
      totalVal += subtotal;

      const subEl = document.getElementById(`subtotalVal_${ft.id}`);
      if (subEl) subEl.textContent = this.formatMoney(subtotal);
    });

    const totalKgEl = document.getElementById('stockAdjustTotalKgDisplay');
    const totalValEl = document.getElementById('stockAdjustTotalValDisplay');
    const unitKg = appState.lang === 'ar' ? 'كغ' : 'kg';
    if (totalKgEl) totalKgEl.textContent = `${totalKg.toFixed(1)} ${unitKg}`;
    if (totalValEl) totalValEl.textContent = this.formatMoney(totalVal);
  },

  handleSaveFeedStockAdjustment(e) {
    e.preventDefault();

    let totalKg = 0;
    let totalVal = 0;

    (appState.feedTypes || []).forEach(ft => {
      const kg = parseFloat(document.getElementById(`stockKg_${ft.id}`)?.value) || 0;
      const price = parseFloat(document.getElementById(`priceKg_${ft.id}`)?.value) || 1.0;
      ft.stockKg = Math.max(0, kg);
      ft.pricePerKg = Math.max(0, price);
      totalKg += ft.stockKg;
      totalVal += ft.stockKg * ft.pricePerKg;
    });

    appState.feedStockKg = totalKg;
    appState.feedStockDate = this.getTodayStr();
    appState.feedStockCostPerKg = totalKg > 0 ? (totalVal / totalKg) : 1.48;

    this.saveState();
    this.closeModal('modalAdjustFeedStock');
    this.renderAll();
    this.showToast(`✅ Stocks magasins mis à jour : ${totalKg.toFixed(1)} kg au total (~${this.formatMoney(totalVal)})`);
  },

  handleSaveNewFeedType(e) {
    e.preventDefault();
    const name = document.getElementById('newFeedTypeName')?.value.trim();
    if (!name) return;
    const stockKg = parseFloat(document.getElementById('newFeedTypeStockKg')?.value) || 0;
    const priceKg = parseFloat(document.getElementById('newFeedTypePriceKg')?.value) || 1.0;
    const recordExpense = document.getElementById('newFeedTypeRecordExpense')?.checked;

    const newType = {
      id: 'feed-' + Date.now().toString(36),
      name: name,
      stockKg: Math.max(0, stockKg),
      pricePerKg: Math.max(0, priceKg)
    };

    if (!Array.isArray(appState.feedTypes)) {
      appState.feedTypes = [];
    }
    appState.feedTypes.push(newType);

    if (recordExpense && stockKg > 0 && priceKg > 0) {
      const totalCost = stockKg * priceKg;
      const isAr = appState.lang === 'ar';
      const isEn = appState.lang === 'en';
      const feedTitlePrefix = isAr ? 'شراء علف' : (isEn ? 'Feed purchase' : 'Achat aliment');
      const unitKg = isAr ? 'كغ' : 'kg';
      const newExp = {
        id: 'exp-' + Date.now().toString(36),
        date: this.getTodayStr(),
        category: 'nourriture',
        title: `${feedTitlePrefix} : ${name} (${stockKg} ${unitKg})`,
        quantity: stockKg,
        unitPrice: priceKg,
        total: totalCost,
        linkedLotId: 'general'
      };
      appState.expenses.unshift(newExp);
    }

    appState.feedStockKg = appState.feedTypes.reduce((sum, ft) => sum + (Number(ft.stockKg) || 0), 0);
    appState.feedStockDate = this.getTodayStr();

    this.saveState();
    this.closeModal('modalAddFeedType');

    // Rafraîchir les modals et l'interface
    this.renderFeedDistributionModal();
    this.renderFeedStockAdjustModal();
    this.renderAll();

    this.showToast(`✅ Nouvel aliment "${name}" ajouté avec succès (${stockKg} kg en stock) !`);
  },

  deleteFeedType(id) {
    if (id === 'feed-ble' || id === 'feed-bouchon') {
      const isAr = appState.lang === 'ar';
      const isEn = appState.lang === 'en';
      const msg = isAr 
        ? 'هذا العلف الأساسي (قمح / بوشون) ضروري للمزرعة ولا يمكن حذفه.' 
        : (isEn ? 'Base feed (Wheat / Layer Pellets) is essential and cannot be deleted.' : 'Cet aliment de base (Blé / Bouchon) est indispensable et ne peut être supprimé.');
      this.showToast(msg, 'warning');
      return;
    }
    const ft = (appState.feedTypes || []).find(f => f.id === id);
    if (!ft) return;

    this.confirmDialog({
      title: isAr ? 'حذف العلف' : 'Supprimer l\'aliment',
      message: isAr 
        ? `هل تريد بالتأكيد حذف العلف "${ft.name}" ؟`
        : `Voulez-vous vraiment supprimer l'aliment "${ft.name}" ?`,
      isDanger: true,
      confirmText: isAr ? 'حذف' : 'Supprimer',
      onConfirm: () => {
        if (window.appAuth && typeof appAuth.addDeletedId === 'function') {
          appAuth.addDeletedId(id);
        }

        appState.feedTypes = (appState.feedTypes || []).filter(f => f.id !== id);
        appState.feedStockKg = (appState.feedTypes || []).reduce((sum, f) => sum + (Number(f.stockKg) || 0), 0);

        this.saveState();
        this.renderFeedStockAdjustModal();
        this.renderFeedDistributionModal();
        this.renderAll();
        this.showToast(`Aliment "${ft.name}" supprimé.`);
      }
    });
  },

  calcSicamToKg() {
    const cans = parseFloat(document.getElementById('feedSicamCansInput')?.value) || 0;
    const kgEl = document.getElementById('feedCustomKgInput');
    if (kgEl) kgEl.value = (cans * 0.667).toFixed(1);
  },

  calcKgToSicam() {
    const kg = parseFloat(document.getElementById('feedCustomKgInput')?.value) || 0;
    const cansEl = document.getElementById('feedSicamCansInput');
    if (cansEl) cansEl.value = (kg / 0.667).toFixed(1);
  },

  toggleFeedRationModeUI() {
    // Mode is consistently tailored to real farm ration
  },

  handleSaveDailyFeedRation(e) {
    e.preventDefault();
    appState.feedRationMode = 'custom';
    const kg = parseFloat(document.getElementById('feedCustomKgInput')?.value) || 2.0;
    const cans = parseFloat(document.getElementById('feedSicamCansInput')?.value) || 3;
    appState.customDailyFeedKg = Math.max(0.1, kg);
    appState.sicamCansCount = Math.max(0.5, cans);

    this.saveState();
    this.closeModal('modalDailyFeedRation');
    this.renderAll();
    this.showToast(`✅ Ration fermière appliquée : ${appState.customDailyFeedKg} kg/j (~${appState.sicamCansCount} boîtes Sicam)`);
  },

  getFeedScalingRatio() {
    if (appState.feedRationMode === 'industrial') return 1.0;
    if (appState.customDailyFeedKg === null || appState.customDailyFeedKg === undefined || appState.customDailyFeedKg <= 0) return 1.0;

    let theoreticalDailyKg = 0;
    (appState.animals || []).forEach(a => {
      const qty = Number(a.currentQuantity) || 0;
      if (qty <= 0) return;
      const aAge = this.calculateAgeInDays(a.birthDate) + (Number(a.arrivalAgeDays) || 0);
      const feedData = this.getAgronomicFeedData(a.species, aAge, a.stage, a.breed);
      theoreticalDailyKg += (qty * feedData.avgGrams) / 1000;
    });

    if (theoreticalDailyKg <= 0) return 1.0;
    const ratio = appState.customDailyFeedKg / theoreticalDailyKg;
    return Math.max(0.15, Math.min(2.5, ratio));
  },

  renderFarmFeedSummary() {
    const card = document.getElementById('farmFeedSummaryCard');
    if (!card) return;

    const fullSection = document.getElementById('farmFeedSummaryFull');
    const diminishedSection = document.getElementById('farmFeedSummaryDiminished');

    const breakdownEl = document.getElementById('farmFeedLotsBreakdown');
    const todayKgEl = document.getElementById('farmFeedTodayKg');
    const todayCostEl = document.getElementById('farmFeedTodayCost');
    const stockKgEl = document.getElementById('farmFeedStockKg');

    const todayKgCompact = document.getElementById('farmFeedTodayKgCompact');
    const todayCostCompact = document.getElementById('farmFeedTodayCostCompact');
    const stockKgCompact = document.getElementById('farmFeedStockKgCompact');

    const feedPriceKg = this.getAverageFeedPricePerKg();
    let totalFarmDailyGrams = 0;
    let totalLivingAnimals = 0;

    if (Array.isArray(appState.animals)) {
      appState.animals.forEach(animal => {
        const qty = Number(animal.currentQuantity) || 0;
        if (qty <= 0) return;
        totalLivingAnimals += qty;
        const ageDays = this.calculateAgeInDays(animal.birthDate) + (Number(animal.arrivalAgeDays) || 0);
        const feedData = this.getAgronomicFeedData(animal.species, ageDays, animal.stage, animal.breed);
        totalFarmDailyGrams += qty * feedData.avgGrams;
      });
    }

    // Calcul du stock d'aliment restant en réserve
    const totalPurchasedFeedCost = (appState.expenses || [])
      .filter(e => e.category === 'nourriture')
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);

    let feedStockRemainingKg = Math.max(0, this.getAvailableFeedStockKg() || 0);
    const unitFeedVal = appState.feedStockCostPerKg || feedPriceKg;
    let feedStockRemaining = feedStockRemainingKg * unitFeedVal;

    const hasDistributions = Array.isArray(appState.feedDistributions) && appState.feedDistributions.length > 0;

    // Détermination de l'état : Aucune donnée saisie au début
    const hasData = (totalLivingAnimals > 0) || (feedStockRemainingKg > 0.05) || (totalPurchasedFeedCost > 0) || hasDistributions;

    // Calcul des valeurs avec garantie stricte de 0 si aucun animal ou aucune donnée
    let totalFarmDailyKg = 0;
    let totalFarmDailyCost = 0;

    if (totalLivingAnimals > 0) {
      const isCustom = appState.feedRationMode !== 'industrial' && appState.customDailyFeedKg > 0;
      totalFarmDailyKg = isCustom ? appState.customDailyFeedKg : (totalFarmDailyGrams / 1000);
      totalFarmDailyCost = totalFarmDailyKg * feedPriceKg;
    }

    if (!hasData) {
      totalFarmDailyKg = 0;
      totalFarmDailyCost = 0;
      feedStockRemainingKg = 0;
      feedStockRemaining = 0;
    }

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKgDay = isAr ? 'كغ / يوم' : (isEn ? 'kg / day' : 'kg / j');
    const unitCostDay = isAr ? ' / يوم' : (isEn ? ' / day' : ' / j');
    const unitKg = isAr ? 'كغ' : 'kg';

    // Remplissage des métriques compactes (Diminished mode)
    if (todayKgCompact) {
      todayKgCompact.textContent = `${totalFarmDailyKg.toFixed(2)} ${unitKgDay}`;
    }
    if (todayCostCompact) {
      todayCostCompact.textContent = `${this.formatMoney(totalFarmDailyCost)}${unitCostDay}`;
    }
    if (stockKgCompact) {
      stockKgCompact.textContent = `${feedStockRemainingKg.toFixed(1)} ${unitKg} (${this.formatMoney(feedStockRemaining)})`;
    }

    // Remplissage des métriques de la vue complète
    if (todayKgEl) {
      const cansText = (totalLivingAnimals > 0 && appState.sicamCansCount !== undefined && appState.sicamCansCount !== null)
        ? (isAr ? ` (~${appState.sicamCansCount} علبة سيكام)` : ` (~${appState.sicamCansCount} boîtes Sicam)`)
        : '';
      todayKgEl.textContent = `${totalFarmDailyKg.toFixed(2)} ${unitKgDay}${cansText}`;
    }
    if (todayCostEl) {
      todayCostEl.textContent = `${this.formatMoney(totalFarmDailyCost)}${unitCostDay}`;
    }
    if (stockKgEl) {
      stockKgEl.textContent = feedStockRemainingKg > 0
        ? `${feedStockRemainingKg.toFixed(1)} ${unitKg} (${this.formatMoney(feedStockRemaining)})`
        : (isAr ? '0.0 كغ بالمخزن' : (isEn ? '0.0 kg in stock' : '0.0 kg en stock'));
    }

    // Basculement visuel entre mode Diminué et mode Complet
    if (!hasData) {
      card.classList.add('is-diminished');
      if (diminishedSection) diminishedSection.style.display = 'block';
      if (fullSection) fullSection.style.display = 'none';
      if (breakdownEl) breakdownEl.innerHTML = '';
      return;
    }

    // Mode Complet
    card.classList.remove('is-diminished');
    if (diminishedSection) diminishedSection.style.display = 'none';
    if (fullSection) fullSection.style.display = 'block';

    let lotsHtml = '';
    if (feedStockRemainingKg > 0 || totalPurchasedFeedCost > 0) {
      const typesBreakdown = (appState.feedTypes || [])
        .map(ft => {
          const shortName = this.getFeedShortName(ft);
          const stock = (Number(ft.stockKg) || 0).toFixed(1);
          return `<span style="white-space: nowrap; display: inline-block;">${shortName} : ${stock} ${unitKg}</span>`;
        })
        .join(' &bull; ');

      const stockBadgeAr = `📦 مخزون العلف المتوفر بالمستودع: ~${this.formatMoney(feedStockRemaining)} (~${feedStockRemainingKg.toFixed(1)} كغ)${typesBreakdown ? ' &bull; ' + typesBreakdown : ''}`;
      const stockBadgeFr = `📦 Réserve d'aliment en magasin : ~${this.formatMoney(feedStockRemaining)} (~${feedStockRemainingKg.toFixed(1)} kg)${typesBreakdown ? ' &bull; ' + typesBreakdown : ''}`;
      const stockBadgeEn = `📦 Warehouse feed stock in reserve: ~${this.formatMoney(feedStockRemaining)} (~${feedStockRemainingKg.toFixed(1)} kg)${typesBreakdown ? ' &bull; ' + typesBreakdown : ''}`;
      const stockLabel = isAr ? stockBadgeAr : (isEn ? stockBadgeEn : stockBadgeFr);

      const subText = isAr 
        ? '(غير محتسب على الكتاكيت حتى يتم استهلاكه)' 
        : (isEn ? '(Not charged to chicks until consumed)' : '(Non imputé aux poussins tant que non consommé)');

      const btnDistribText = isAr ? '🥫 توزيع' : (isEn ? '🥫 Distribute' : '🥫 Distribuer');
      const btnStockText = isAr ? '📦 مخزون المستودع' : (isEn ? '📦 Warehouse Stock' : '📦 Stock Magasin');

      lotsHtml += `
        <div style="grid-column: 1 / -1; background: rgba(16, 185, 129, 0.1); border: 1px dashed rgba(16, 185, 129, 0.35); border-radius: var(--radius-md); padding: 0.55rem 0.85rem; font-size: 0.78rem; font-weight: 700; color: var(--accent-emerald); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
            <span>${stockLabel}</span>
            <span style="font-size: 0.72rem; color: var(--text-secondary); font-weight: 500;">${subText}</span>
          </div>
          <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-outline" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; font-weight: 800; color: var(--accent-amber);" onclick="app.openModal('modalFeedDistribution')">
              ${btnDistribText}
            </button>
            <button type="button" class="btn btn-sm btn-emerald" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; font-weight: 800;" onclick="app.openModal('modalAdjustFeedStock')">
              ${btnStockText}
            </button>
          </div>
        </div>
      `;
    } else {
      const emptyMsg = isAr 
        ? '📦 <strong>مخزون العلف :</strong> لا يوجد أكياس مسجلة في المخزن.'
        : (isEn ? '📦 <strong>Feed stock:</strong> No bags recorded in warehouse.' : '📦 <strong>Stock d\'aliment :</strong> Aucun sac déclaré en réserve.');
      const emptyBtn = isAr
        ? '➕ إدخال مخزون المستودع (مثال: 65 كغ)'
        : (isEn ? '➕ Declare Warehouse Stock (e.g. 65 kg)' : '➕ Déclarer Stock de Réserve (ex: 65 kg)');

      lotsHtml += `
        <div style="grid-column: 1 / -1; background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 0.55rem 0.85rem; font-size: 0.78rem; color: var(--text-main); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <span>${emptyMsg}</span>
          <button type="button" class="btn btn-sm btn-primary" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; font-weight: 800;" onclick="app.openModal('modalAdjustFeedStock')">
            ${emptyBtn}
          </button>
        </div>
      `;
    }

    if (breakdownEl) breakdownEl.innerHTML = lotsHtml;
  },

  // ==========================================
  // ANIMALS (CHEPTEL & RACES) MODULE
  // ==========================================
  renderAnimals(filter = null) {
    const grid = document.getElementById('animalsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (filter !== null && filter !== undefined) {
      this.currentAnimalFilter = filter;
    }
    const activeSpecies = this.currentAnimalFilter || 'all';

    // Filter count chips
    const counts = { all: appState.animals.length, poulet: 0, pondeuse: 0, poussin: 0, adulte: 0, pintade: 0, canard: 0 };
    appState.animals.forEach(a => {
      if (counts[a.species] !== undefined) counts[a.species]++;
      else if (a.species === 'canard_barbarie') counts.canard++;
    });

    const setChip = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setChip('chipAllCount', counts.all);
    setChip('chipPouletCount', counts.poulet);
    setChip('chipPondeuseCount', counts.pondeuse);
    setChip('chipPoussinCount', counts.poussin);
    setChip('chipAdulteCount', counts.adulte);
    setChip('chipPintadeCount', counts.pintade);
    setChip('chipCanardCount', counts.canard);

    const sortMode = document.getElementById('animalSortSelect')?.value || 'default';
    const ageFilter = document.getElementById('animalAgeFilterSelect')?.value || 'all';
    const qtyFilter = document.getElementById('animalQtyFilterSelect')?.value || 'all';
    const searchQuery = (document.getElementById('animalSearchInput')?.value || '').trim().toLowerCase();

    // 1. Filtrer par espèce (chips)
    let filtered = activeSpecies === 'all'
      ? appState.animals
      : appState.animals.filter(a => a.species === activeSpecies || (activeSpecies === 'canard' && a.species === 'canard_barbarie'));

    // 2. Filtrer par recherche textuelle
    if (searchQuery) {
      filtered = filtered.filter(a => {
        const name = (a.name || '').toLowerCase();
        const breed = (a.breed || '').toLowerCase();
        const notes = (a.notes || '').toLowerCase();
        const species = (a.species || '').toLowerCase();
        const id = (a.id || '').toLowerCase();
        const displayName = this.getAnimalDisplayName(a).toLowerCase();
        return name.includes(searchQuery) || breed.includes(searchQuery) || notes.includes(searchQuery) || species.includes(searchQuery) || id.includes(searchQuery) || displayName.includes(searchQuery);
      });
    }

    // 3. Filtrer par tranche d'âge
    if (ageFilter !== 'all') {
      filtered = filtered.filter(a => {
        const days = this.calculateAgeInDays(a.birthDate) + (Number(a.arrivalAgeDays) || 0);
        if (ageFilter === 'chick') return days < 30;
        if (ageFilter === 'growing') return days >= 30 && days <= 180;
        if (ageFilter === 'adult') return days > 180;
        return true;
      });
    }

    // 4. Filtrer par effectif / nombre
    if (qtyFilter !== 'all') {
      filtered = filtered.filter(a => {
        const qty = Number(a.currentQuantity) || 0;
        if (qtyFilter === 'large') return qty > 50;
        if (qtyFilter === 'medium') return qty >= 10 && qty <= 50;
        if (qtyFilter === 'small') return qty < 10;
        return true;
      });
    }

    // 5. Tri (par Âge croissant/décroissant, Nombre croissant/décroissant, Nom, ou défaut)
    filtered = [...filtered].sort((a, b) => {
      const ageA = this.calculateAgeInDays(a.birthDate) + (Number(a.arrivalAgeDays) || 0);
      const ageB = this.calculateAgeInDays(b.birthDate) + (Number(b.arrivalAgeDays) || 0);
      const qtyA = Number(a.currentQuantity) || 0;
      const qtyB = Number(b.currentQuantity) || 0;

      if (sortMode === 'age_asc') return ageA - ageB;
      if (sortMode === 'age_desc') return ageB - ageA;
      if (sortMode === 'qty_desc') return qtyB - qtyA;
      if (sortMode === 'qty_asc') return qtyA - qtyB;
      if (sortMode === 'name_asc') return (this.getAnimalDisplayName(a)).localeCompare(this.getAnimalDisplayName(b));
      return 0;
    });

    if (filtered.length === 0) {
      if (appState.animals.length === 0) {
        grid.innerHTML = `
          <div class="empty-state-card" style="grid-column: 1/-1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 2px dashed var(--border-subtle);">
            <div style="font-size: 3rem; margin-bottom: 0.8rem;">🐔</div>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem;">${this.t('empty_animals_title')}</h3>
            <p class="text-muted" style="max-width: 480px; margin: 0 auto 1.5rem; font-size: 0.9rem;">
              ${this.t('empty_animals_desc')}
            </p>
            <button class="btn btn-primary bold" onclick="app.openModal('modalAddAnimal')">
              ${this.t('btn_declare_my_first_lot')}
            </button>
          </div>
        `;
      } else {
        const noMatch = appState.lang === 'ar' ? 'لا توجد دفعات طيور مطابقة لمعايير البحث والفرز.' : (appState.lang === 'en' ? 'No animal batches found matching these filter and sort criteria.' : 'Aucun lot d\'animaux ne correspond à vos critères de recherche et filtrage.');
        grid.innerHTML = `
          <div class="panel-card" style="grid-column: 1/-1; text-align: center; padding: 2.5rem;">
            <p class="text-muted" style="margin-bottom: 1rem; font-size: 0.95rem;">${noMatch}</p>
            <button class="btn btn-sm btn-outline" onclick="app.resetAnimalFilters()">
              ${this.t('btn_reset_filters') || '🔄 Réinitialiser'}
            </button>
          </div>
        `;
      }
      return;
    }

    // Total farm daily feed consumption in grams for biological expense weighting
    const totalFarmDailyGrams = (appState.animals || []).reduce((sum, a) => {
      const aAge = this.calculateAgeInDays(a.birthDate) + (Number(a.arrivalAgeDays) || 0);
      const feedData = this.getAgronomicFeedData(a.species, aAge, a.stage, a.breed);
      return sum + ((Number(a.currentQuantity) || 0) * feedData.avgGrams);
    }, 0);
    const totalLivingAnimals = (appState.animals || []).reduce((sum, a) => sum + (Number(a.currentQuantity) || 0), 0);

    const generalFeedExpenses = appState.expenses
      .filter(e => (!e.linkedLotId || e.linkedLotId === 'general') && e.category === 'nourriture')
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);

    const generalVetExpenses = appState.expenses
      .filter(e => (!e.linkedLotId || e.linkedLotId === 'general') && e.category !== 'nourriture')
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);

    const feedPriceKg = this.getAverageFeedPricePerKg();

    filtered.forEach(animal => {
      const daysSinceArrival = this.calculateAgeInDays(animal.birthDate);
      const arrivalAgeDays = Number(animal.arrivalAgeDays) || 0;
      const ageDays = daysSinceArrival + arrivalAgeDays;
      const ageText = this.formatAgeText(ageDays);
      const mortalityRate = animal.initialQuantity > 0 
        ? ((animal.mortality / animal.initialQuantity) * 100).toFixed(1) 
        : 0;

      // Agronomic table profile (progressive feeding & deduction of pre-acquisition feed)
      const feedData = this.getAgronomicFeedData(animal.species, ageDays, animal.stage, animal.breed);
      const cumulFeedKg = this.calculateCumulativeFeedKg(animal.species, ageDays, animal.stage, animal.breed, arrivalAgeDays);
      const cumulFeedCost = cumulFeedKg * feedPriceKg;

      // 1. Dépenses directement affectées à ce lot
      const directLotExpenses = appState.expenses
        .filter(e => e.linkedLotId === animal.id)
        .reduce((sum, e) => sum + (Number(e.total) || 0), 0);

      // 2. Coût d'aliment réellement consommé à ce jour (selon la table zootechnique biologique)
      // Note agronomique essentielle : Un poussin de 44j a mangé 1.62 kg (~2.40 DT).
      // Les factures globales de sacs en avance (ex: 360 DT) constituent du stock d'inventaire en réserve
      // et ne doivent JAMAIS être imputées immédiatement dans l'estomac d'un poussin qui ne peut physiquement pas les avoir avalés !
      const lotBiologicalFeedCost = (Number(animal.currentQuantity) || 0) * cumulFeedCost;

      // 3. Répartition des autres frais généraux réels (véto, santé, litière) par tête
      const headShare = totalLivingAnimals > 0 ? (Number(animal.currentQuantity) || 0) / totalLivingAnimals : 0;
      const allocatedVet = generalVetExpenses * headShare;

      // Total des dépenses engagées pour ce lot à ce jour
      const totalLotExpenses = directLotExpenses + lotBiologicalFeedCost + allocatedVet;
      const totalAcquisition = animal.initialQuantity * (Number(animal.costPerHead) || 0);
      const totalInvested = totalAcquisition + totalLotExpenses;
      
      const costPerCurrentHead = animal.currentQuantity > 0 ? (totalInvested / animal.currentQuantity).toFixed(2) : '0';
      const feedPerSubject = cumulFeedCost.toFixed(2);

      const avatarIcon = this.getSpeciesIcon(animal.species);
      const stageBadgeClass = this.getStageBadgeClass(animal.stage);
      const lossesWord = appState.lang === 'ar' ? 'خسائر' : (appState.lang === 'en' ? 'losses' : 'pertes');
      const defaultNotes = appState.lang === 'ar' ? 'لا توجد ملاحظات' : (appState.lang === 'en' ? 'No specific notes' : 'Aucune note particulière');
      const agronomicStageLabel = appState.lang === 'ar' ? feedData.labelAr : (appState.lang === 'en' ? feedData.labelEn : feedData.labelFr);

      const cardTitle = this.getAnimalDisplayName(animal);
      const breed = (animal.breed || '').toString().trim();
      const hasBreed = breed !== '' && breed !== '-';
      const speciesLabel = this.translateSpecies(animal.species);
      const lotIdentifierLabel = (animal.name && animal.name.toString().trim() !== '')
        ? (appState.lang === 'ar' ? `دفعة #${animal.name}` : `Lot #${animal.name}`)
        : '';

      const subtitleItems = [];
      if (hasBreed) {
        subtitleItems.push(speciesLabel);
      }
      if (lotIdentifierLabel) {
        subtitleItems.push(lotIdentifierLabel);
      }
      subtitleItems.push(`<span class="text-muted">${agronomicStageLabel}</span>`);
      const cardSubtitle = subtitleItems.join(' &bull; ');

      const card = document.createElement('div');
      card.className = 'animal-card';
      card.innerHTML = `
        <div class="animal-card-header">
          <div class="animal-title-group">
            <div class="animal-avatar">${avatarIcon}</div>
            <div>
              <h3 class="animal-name">${cardTitle}</h3>
              <p class="animal-breed">${cardSubtitle}</p>
            </div>
          </div>
          <span class="stage-badge ${stageBadgeClass}">${this.translateStage(animal.stage)}</span>
        </div>

        <div class="animal-stats-grid">
          <div class="animal-stat-col">
            <span class="lbl">${this.t('card_age_real')}</span>
            <span class="val text-emerald">${ageText}</span>
          </div>
          <div class="animal-stat-col">
            <span class="lbl">${this.t('card_current_count')}</span>
            <span class="val">${animal.currentQuantity} / ${animal.initialQuantity}</span>
          </div>
          <div class="animal-stat-col">
            <span class="lbl">${this.t('card_survival_rate')}</span>
            <span class="val text-cyan">${(100 - mortalityRate).toFixed(1)}% (${animal.mortality} ${lossesWord})</span>
          </div>
          <div class="animal-stat-col" style="cursor: pointer;" onclick="app.openEditAnimalModal('${animal.id}')" title="Cliquer pour modifier le lot ou le coût">
            <span class="lbl">${this.t('card_cost_head')} ✏️</span>
            <span class="val text-amber">${this.formatMoney(costPerCurrentHead)}</span>
            <div style="font-size: 0.74rem; font-weight: 700; margin-top: 3px; color: var(--text-secondary);">
              <span>${this.t('card_total_cost') || (appState.lang === 'ar' ? 'التكلفة الإجمالية:' : 'Coût Total :')}</span>
              <strong style="color: var(--accent-amber); font-weight: 800; display: inline-block; margin-inline-start: 3px;">${this.formatMoney(totalInvested)}</strong>
            </div>
          </div>
        </div>

        <div class="animal-notes-bar" style="margin-top: 0.5rem;">
          <small class="text-muted">${animal.notes || defaultNotes}</small>
        </div>

        <div class="animal-card-actions" style="margin-top: 0.65rem;">
          <button type="button" class="btn btn-sm btn-outline flex-1" onclick="app.openMortalityModal('${animal.id}')" title="Déclarer plusieurs pertes">
            ${this.t('btn_mortalities_custom')}
          </button>
          <button type="button" class="btn btn-sm btn-outline flex-1" onclick="app.openPurchaseModal('${animal.id}')" title="Acheter et ajouter à ce lot">
            ${this.t('btn_purchases_custom')}
          </button>
          <button type="button" class="btn btn-sm btn-emerald flex-1" onclick="app.quickSellFromLot('${animal.id}')">
            ${this.t('btn_sell_lot')}
          </button>
          <button type="button" class="btn btn-sm btn-secondary" title="Modifier le lot ou le coût" onclick="app.openEditAnimalModal('${animal.id}')" style="display:inline-flex; align-items:center; gap:0.25rem;">
            ✏️
          </button>
          <button type="button" class="btn btn-sm btn-danger-outline" title="Supprimer le lot" onclick="app.openDeleteAnimalModal('${animal.id}')">
            🗑️
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  },

  handleAnimalFilterChange() {
    this.renderAnimals(this.currentAnimalFilter || 'all');
  },

  resetAnimalFilters() {
    const searchInput = document.getElementById('animalSearchInput');
    const sortSelect = document.getElementById('animalSortSelect');
    const ageSelect = document.getElementById('animalAgeFilterSelect');
    const qtySelect = document.getElementById('animalQtyFilterSelect');
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'default';
    if (ageSelect) ageSelect.value = 'all';
    if (qtySelect) qtySelect.value = 'all';
    this.currentAnimalFilter = 'all';
    document.querySelectorAll('[data-filter-animal]').forEach(c => {
      if (c.getAttribute('data-filter-animal') === 'all') c.classList.add('active');
      else c.classList.remove('active');
    });
    this.renderAnimals('all');
  },

  // Ouvre le modal HTML d'édition du lot (100% compatible iPhone PWA sans window.prompt)
  openEditAnimalModal(animalId) {
    const animal = (appState.animals || []).find(a => a.id === animalId);
    if (!animal) return;

    const idInput = document.getElementById('editAnimalId');
    const speciesSelect = document.getElementById('editAnimalSpecies');
    const nameInput = document.getElementById('editAnimalName');
    const breedInput = document.getElementById('editAnimalBreed');
    const qtyInput = document.getElementById('editAnimalQuantity');
    const birthDateInput = document.getElementById('editAnimalBirthDate');
    const arrivalAgeInput = document.getElementById('editAnimalArrivalAgeDays');
    const costInput = document.getElementById('editAnimalCostPerHead');
    const notesInput = document.getElementById('editAnimalNotes');

    if (idInput) idInput.value = animal.id;
    if (nameInput) nameInput.value = animal.name || '';
    if (breedInput) breedInput.value = (animal.breed && animal.breed !== '-') ? animal.breed : '';
    if (qtyInput) qtyInput.value = animal.currentQuantity || animal.initialQuantity || 1;
    if (birthDateInput) birthDateInput.value = animal.birthDate || this.getTodayStr();
    if (arrivalAgeInput) arrivalAgeInput.value = (animal.arrivalAgeDays !== undefined) ? animal.arrivalAgeDays : 0;
    if (costInput) costInput.value = (Number(animal.costPerHead) || 0).toString();
    if (notesInput) notesInput.value = animal.notes || '';

    const sp = animal.species || 'poulet';
    if (speciesSelect) {
      speciesSelect.value = sp;
      this.handleAnimalSpeciesChange(sp, 'editAnimal');
    }

    // Pré-sélectionner le statut le plus proche
    const stagePresetSelect = document.getElementById('editAnimalStageSelect');
    if (stagePresetSelect) {
      const ageDays = Number(animal.arrivalAgeDays) || 0;
      if (sp === 'canard') {
        if (ageDays <= 21) stagePresetSelect.value = 'caneton_demarrage';
        else if (ageDays <= 112) stagePresetSelect.value = 'canard_croissance';
        else stagePresetSelect.value = 'canard_adulte';
      } else if (sp === 'poulet') {
        if (ageDays <= 28) stagePresetSelect.value = 'poussin';
        else if (ageDays <= 154) stagePresetSelect.value = 'croissance';
        else stagePresetSelect.value = 'pondeuse';
      }
      this.handleAnimalStagePresetChange(stagePresetSelect.value, 'editAnimal');
      if (arrivalAgeInput) arrivalAgeInput.value = ageDays; // Restaurer l'âge exact de l'animal
    }

    this.openModal('modalEditAnimal');
  },

  handleSaveEditAnimal(e) {
    e.preventDefault();
    const id = document.getElementById('editAnimalId').value;
    const animal = (appState.animals || []).find(a => a.id === id);
    if (!animal) return;

    const species = document.getElementById('editAnimalSpecies')?.value || animal.species || 'poulet';
    const name = document.getElementById('editAnimalName').value.trim();
    const breed = document.getElementById('editAnimalBreed').value.trim() || '-';
    const quantity = parseInt(document.getElementById('editAnimalQuantity').value, 10);
    const birthDate = document.getElementById('editAnimalBirthDate')?.value;
    const arrivalAgeVal = document.getElementById('editAnimalArrivalAgeDays')?.value;
    const arrivalAgeDays = (arrivalAgeVal === '' || isNaN(parseInt(arrivalAgeVal, 10))) ? 0 : Math.max(0, parseInt(arrivalAgeVal, 10));
    const stage = document.getElementById('editAnimalStage')?.value || animal.stage || 'Croissance';
    const costVal = document.getElementById('editAnimalCostPerHead').value;
    const costPerHead = (costVal === '' || isNaN(parseFloat(costVal))) ? 0 : Math.max(0, parseFloat(costVal));
    const notes = document.getElementById('editAnimalNotes').value.trim();

    animal.species = species;
    animal.name = name || animal.name;
    animal.breed = breed;
    if (birthDate) animal.birthDate = birthDate;
    animal.arrivalAgeDays = arrivalAgeDays;
    if (stage) animal.stage = stage;
    if (!isNaN(quantity) && quantity > 0) {
      animal.currentQuantity = quantity;
    }
    animal.costPerHead = costPerHead;
    animal.notes = notes;

    this.saveState();
    this.closeModal('modalEditAnimal');
    this.renderAll();

    const isAr = appState.lang === 'ar';
    const displayName = this.getAnimalDisplayName(animal);
    this.showToast(isAr ? `تم تحديث "${displayName}" بنجاح` : `Lot "${displayName}" mis à jour avec succès !`);

    if (window.appAuth && appAuth.pushData) {
      appAuth.pushData();
    }
  },

  // Calcule automatiquement le prochain identifiant (commence à 1, puis 2, 3...)
  getNextAnimalId() {
    let maxId = 0;
    (appState.animals || []).forEach(a => {
      if (a && a.name !== undefined && a.name !== null) {
        const str = a.name.toString().trim();
        const directNum = parseInt(str, 10);
        if (!isNaN(directNum) && directNum > maxId && directNum < 100000) {
          maxId = directNum;
        } else {
          const m = str.match(/\d+/);
          if (m) {
            const num = parseInt(m[0], 10);
            if (!isNaN(num) && num > maxId && num < 100000) maxId = num;
          }
        }
      }
    });
    return maxId + 1;
  },

  // Gère le changement de l'espèce (1ère sélection)
  handleAnimalSpeciesChange(speciesVal = 'poulet', formPrefix = 'animal') {
    const stageSelect = document.getElementById(`${formPrefix}StageSelect`);
    if (!stageSelect) return;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const sp = (speciesVal || 'poulet').toLowerCase();

    let options = [];
    if (sp === 'canard' || sp === 'canard_barbarie') {
      options = [
        {
          key: 'caneton_demarrage',
          days: 0,
          label: isAr ? '🐣 فراخ بط بداية' : (isEn ? '🐣 Duckling starter' : '🐣 Caneton démarrage')
        },
        {
          key: 'canard_croissance',
          days: 22,
          label: isAr ? '🦆 بط نمو' : (isEn ? '🦆 Growing duck' : '🦆 Canard croissance')
        },
        {
          key: 'canard_adulte',
          days: 120,
          label: isAr ? '🦆 بط بالغ' : (isEn ? '🦆 Adult duck' : '🦆 Canard adulte')
        }
      ];
    } else if (sp === 'pintade') {
      options = [
        {
          key: 'pintadeau',
          days: 0,
          label: isAr ? '🐣 كتاكيت دجاج الوادي' : (isEn ? '🐣 Guinea keets' : '🐣 Pintadeau démarrage')
        },
        {
          key: 'pintade_croissance',
          days: 30,
          label: isAr ? '🪶 دجاج الوادي نمو' : (isEn ? '🪶 Growing guinea' : '🪶 Pintade croissance')
        },
        {
          key: 'pintade_adulte',
          days: 90,
          label: isAr ? '🪶 دجاج الوادي بالغ' : (isEn ? '🪶 Adult guinea' : '🪶 Pintade adulte')
        }
      ];
    } else if (sp === 'autre') {
      options = [
        {
          key: 'autre_demarrage',
          days: 0,
          label: isAr ? '🐣 مرحلة البداية' : (isEn ? '🐣 Starter' : '🐣 Démarrage')
        },
        {
          key: 'autre_croissance',
          days: 30,
          label: isAr ? '🐥 مرحلة النمو' : (isEn ? '🐥 Growing' : '🐥 Croissance')
        },
        {
          key: 'autre_adulte',
          days: 180,
          label: isAr ? '🦃 طيور بالغة' : (isEn ? '🦃 Adult' : '🦃 Adulte')
        }
      ];
    } else {
      // Default: Poule / Poulet (Gallinacés)
      options = [
        {
          key: 'poussin',
          days: 0,
          label: isAr ? '🐣 كتاكيت / فلالس بداية' : (isEn ? '🐣 Chick starter' : '🐣 Poussin démarrage')
        },
        {
          key: 'croissance',
          days: 30,
          label: isAr ? '🐥 دجاج نمو / فرارج' : (isEn ? '🐥 Growing chicken' : '🐥 Poulet croissance')
        },
        {
          key: 'pondeuse',
          days: 180,
          label: isAr ? '🐓 دجاجة بياضة' : (isEn ? '🐓 Laying hen' : '🐓 Poule pondeuse')
        },
        {
          key: 'coq',
          days: 180,
          label: isAr ? '🐓 سردوك بالغ' : (isEn ? '🐓 Adult rooster' : '🐓 Coq adulte')
        }
      ];
    }

    stageSelect.innerHTML = options.map(opt => `<option value="${opt.key}" data-days="${opt.days}">${opt.label}</option>`).join('');
    this.handleAnimalStagePresetChange(options[0].key, formPrefix);
  },

  // Gère le choix du statut (2ème sélection) et pré-remplit l'âge de départ
  handleAnimalStagePresetChange(presetKey, formPrefix = 'animal') {
    const arrivalAgeInput = document.getElementById(`${formPrefix}ArrivalAgeDays`);
    const hiddenStage = document.getElementById(`${formPrefix}Stage`);

    let defaultDays = 0;
    let stageName = 'Croissance';

    if (presetKey === 'poussin' || presetKey === 'caneton_demarrage' || (presetKey && presetKey.includes('demarrage')) || presetKey === 'pintadeau') {
      defaultDays = 0;
      stageName = 'Démarrage';
    } else if (presetKey === 'croissance' || (presetKey && presetKey.includes('croissance'))) {
      defaultDays = 30;
      stageName = 'Croissance';
    } else if (presetKey === 'canard_croissance') {
      defaultDays = 22;
      stageName = 'Croissance';
    } else if (presetKey === 'pondeuse') {
      defaultDays = 180;
      stageName = 'Ponte';
    } else if (presetKey === 'coq') {
      defaultDays = 180;
      stageName = 'Adulte';
    } else if (presetKey === 'canard_adulte') {
      defaultDays = 120;
      stageName = 'Adulte';
    } else {
      defaultDays = 120;
      stageName = 'Adulte';
    }

    if (arrivalAgeInput) {
      arrivalAgeInput.value = '';
      arrivalAgeInput.placeholder = '';
    }
    if (hiddenStage) {
      hiddenStage.value = stageName;
    }

    const banner = document.getElementById(`${formPrefix}PortionBanner`);
    if (banner) banner.remove();
  },

  handleSaveAnimal(e) {
    e.preventDefault();
    const species = document.getElementById('animalSpecies').value;
    const breedInput = document.getElementById('animalBreed').value.trim();
    const nameInput = document.getElementById('animalName').value.trim();
    const quantity = parseInt(document.getElementById('animalQuantity').value, 10);
    const birthDate = document.getElementById('animalBirthDate').value;
    const arrivalAgeVal = document.getElementById('animalArrivalAgeDays')?.value;
    const arrivalAgeDays = (arrivalAgeVal === '' || isNaN(parseInt(arrivalAgeVal, 10))) ? 0 : Math.max(0, parseInt(arrivalAgeVal, 10));
    
    // Accepte explicitement 0 pour les animaux gratuits / éclos
    const rawCost = document.getElementById('animalCostPerHead').value;
    const parsedCost = parseFloat(rawCost);
    const costPerHead = (rawCost === '' || isNaN(parsedCost)) ? 0 : Math.max(0, parsedCost);

    const stage = document.getElementById('animalStage')?.value || 'Croissance';
    const notes = document.getElementById('animalNotes').value.trim();

    if (!quantity || !birthDate) {
      const isAr = appState.lang === 'ar';
      this.showToast(isAr ? 'يرجى إدخال عدد الرؤوس والتاريخ.' : 'Veuillez renseigner le nombre de têtes et la date.', 'warning');
      return;
    }

    // Race optionnelle: '-' par défaut si vide
    const breed = breedInput || '-';

    // Identifiant optionnel: auto-incrémentation (ex: 1, 2, 3...)
    const autoId = this.getNextAnimalId();
    const name = nameInput || `${autoId}`;

    const newAnimal = {
      id: 'lot-' + Date.now().toString(36),
      species,
      breed,
      name,
      initialQuantity: quantity,
      currentQuantity: quantity,
      mortality: 0,
      birthDate,
      arrivalAgeDays,
      costPerHead,
      stage,
      notes
    };

    appState.animals.unshift(newAnimal);
    this.saveState();
    this.closeModal('modalAddAnimal');
    this.renderAll();
    this.showToast(this.t('toast_lot_saved', { name: this.getAnimalDisplayName(newAnimal) }));
    document.getElementById('formAddAnimal').reset();
    const costHead = document.getElementById('animalCostPerHead');
    if (costHead) { costHead.value = ''; costHead.placeholder = ''; }
    const arrAge = document.getElementById('animalArrivalAgeDays');
    if (arrAge) { arrAge.value = ''; arrAge.placeholder = ''; }
  },

  // Toggle & gestion du menu mobile (3 lignes dans la barre haute)
  toggleMobileMenu(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const drawer = document.getElementById('mobileMenuDrawer');
    if (!drawer) return;

    // Protection anti-rebond (anti-bounce debounce 250ms)
    const now = Date.now();
    if (this._lastMenuToggle && now - this._lastMenuToggle < 250) {
      return;
    }
    this._lastMenuToggle = now;

    const isHidden = drawer.classList.contains('hidden') || drawer.style.display === 'none';
    if (isHidden) {
      this.openMobileMenu();
    } else {
      this.closeMobileMenu();
    }
  },

  openMobileMenu() {
    const drawer = document.getElementById('mobileMenuDrawer');
    if (!drawer) return;
    drawer.classList.remove('hidden');
    drawer.style.display = 'flex';
    this.updateMobileMenuControls();
  },

  closeMobileMenu() {
    const drawer = document.getElementById('mobileMenuDrawer');
    if (!drawer) return;
    drawer.classList.add('hidden');
    drawer.style.display = 'none';
  },

  updateMobileMenuControls() {
    const mobileLang = document.getElementById('mobileLangSelect');
    if (mobileLang) mobileLang.value = appState.lang || 'fr';

    const mobileCurrency = document.getElementById('mobileCurrencySelect');
    if (mobileCurrency) mobileCurrency.value = appState.currency || 'TND';

    const isDark = appState.theme !== 'light';
    const mobileThemeIcon = document.getElementById('mobileThemeIcon');
    const mobileThemeText = document.getElementById('mobileThemeText');
    if (mobileThemeIcon) mobileThemeIcon.textContent = isDark ? '☀️' : '🌙';
    if (mobileThemeText) {
      mobileThemeText.textContent = isDark
        ? (this.t('mode_dark_active') || 'Mode Sombre Activé')
        : (this.t('mode_light_active') || 'Mode Clair Activé');
    }
  },

  // --- Modales Dédiées : Suppression, Pertes, Achat (100% Mobile & PWA sans prompt/confirm) ---
  openDeleteAnimalModal(lotId) {
    const lot = appState.animals.find(a => a.id === lotId);
    if (!lot) return;
    const targetIdEl = document.getElementById('deleteAnimalTargetId');
    const targetNameEl = document.getElementById('deleteAnimalTargetName');
    const targetInfoEl = document.getElementById('deleteAnimalTargetInfo');
    if (targetIdEl) targetIdEl.value = lot.id;
    const displayName = this.getAnimalDisplayName(lot);
    const lotNum = (lot.name && lot.name.toString().trim() !== '') ? (appState.lang === 'ar' ? `دفعة #${lot.name}` : `Lot #${lot.name}`) : '';
    if (targetNameEl) targetNameEl.textContent = lotNum ? `${displayName} (${lotNum})` : displayName;
    if (targetInfoEl) {
      const isAr = appState.lang === 'ar';
      targetInfoEl.textContent = isAr 
        ? `العدد الحالي: ${lot.currentQuantity} طائر | العمر: ${this.translateStage(lot.stage)}`
        : `Effectif actuel : ${lot.currentQuantity} têtes | Stade : ${this.translateStage(lot.stage)}`;
    }
    this.openModal('modalDeleteAnimalConfirm');
  },

  executeDeleteAnimal() {
    const targetIdEl = document.getElementById('deleteAnimalTargetId');
    const lotId = targetIdEl ? targetIdEl.value : null;
    if (!lotId) {
      this.closeModal('modalDeleteAnimalConfirm');
      return;
    }
    if (window.appAuth && typeof appAuth.addDeletedId === 'function') {
      appAuth.addDeletedId(lotId);
    }
    appState.animals = appState.animals.filter(a => a.id !== lotId);
    this.saveState();
    this.closeModal('modalDeleteAnimalConfirm');
    this.renderAll();
    this.showToast(this.t('toast_lot_deleted') || 'Lot supprimé avec succès.');
  },

  deleteAnimal(lotId) {
    this.openDeleteAnimalModal(lotId);
  },

  openMortalityModal(lotId) {
    const lot = appState.animals.find(a => a.id === lotId);
    if (!lot) return;
    const idEl = document.getElementById('mortalityLotId');
    const nameEl = document.getElementById('mortalityLotName');
    const breedEl = document.getElementById('mortalityLotBreed');
    const countInput = document.getElementById('mortalityCountInput');
    const flockEl = document.getElementById('mortalityCurrentFlock');
    if (idEl) idEl.value = lot.id;
    const displayName = this.getAnimalDisplayName(lot);
    if (nameEl) nameEl.textContent = displayName;
    if (breedEl) {
      const lotNum = (lot.name && lot.name.toString().trim() !== '') ? (appState.lang === 'ar' ? `دفعة #${lot.name}` : `Lot #${lot.name}`) : '';
      const stageStr = this.translateStage(lot.stage);
      breedEl.textContent = lotNum ? `${lotNum} • ${stageStr}` : stageStr;
    }
    if (flockEl) flockEl.textContent = `${lot.currentQuantity} ${appState.lang === 'ar' ? 'طائر' : 'sujets'}`;
    if (countInput) {
      countInput.value = '';
      countInput.placeholder = '';
      countInput.max = lot.currentQuantity;
    }
    this.openModal('modalRecordMortality');
  },

  stepMortalityInput(delta) {
    const input = document.getElementById('mortalityCountInput');
    if (!input) return;
    let val = parseInt(input.value, 10) || 0;
    val = Math.max(1, val + delta);
    const max = parseInt(input.max, 10);
    if (!isNaN(max) && max > 0 && val > max) val = max;
    input.value = val;
  },

  setMortalityCount(val) {
    const input = document.getElementById('mortalityCountInput');
    if (!input) return;
    const max = parseInt(input.max, 10);
    if (!isNaN(max) && max > 0 && val > max) val = max;
    input.value = Math.max(1, val);
  },

  submitMortalityModal(e) {
    if (e && e.preventDefault) e.preventDefault();
    const idEl = document.getElementById('mortalityLotId');
    const countInput = document.getElementById('mortalityCountInput');
    if (!idEl || !countInput) return;
    const lot = appState.animals.find(a => a.id === idEl.value);
    if (!lot) return;
    const count = parseInt(countInput.value, 10);
    if (isNaN(count) || count <= 0) {
      this.showToast('Veuillez entrer un nombre positif valide', 'error');
      return;
    }
    if (count > lot.currentQuantity) {
      this.showToast(`Impossible : ${count} dépasse l'effectif (${lot.currentQuantity})`, 'error');
      return;
    }
    lot.currentQuantity -= count;
    lot.mortality = (lot.mortality || 0) + count;
    this.saveState();
    this.closeModal('modalRecordMortality');
    this.renderAll();
    const displayName = this.getAnimalDisplayName(lot);
    this.showToast(this.t('toast_mortality_recorded', { n: count, name: displayName }) || `${count} pertes enregistrées`, 'error');
  },

  recordMortalityPrompt(lotId) {
    this.openMortalityModal(lotId);
  },

  openPurchaseModal(lotId) {
    const lot = appState.animals.find(a => a.id === lotId);
    if (!lot) return;
    const idEl = document.getElementById('purchaseLotId');
    const nameEl = document.getElementById('purchaseLotName');
    const breedEl = document.getElementById('purchaseLotBreed');
    const flockEl = document.getElementById('purchaseCurrentFlock');
    const countInput = document.getElementById('purchaseCountInput');
    const priceInput = document.getElementById('purchaseUnitPriceInput');
    if (idEl) idEl.value = lot.id;
    const displayName = this.getAnimalDisplayName(lot);
    if (nameEl) nameEl.textContent = displayName;
    if (breedEl) {
      const lotNum = (lot.name && lot.name.toString().trim() !== '') ? (appState.lang === 'ar' ? `دفعة #${lot.name}` : `Lot #${lot.name}`) : '';
      const stageStr = this.translateStage(lot.stage);
      breedEl.textContent = lotNum ? `${lotNum} • ${stageStr}` : stageStr;
    }
    if (flockEl) flockEl.textContent = `${lot.currentQuantity} ${appState.lang === 'ar' ? 'طائر' : 'sujets'}`;
    if (countInput) {
      countInput.value = '';
      countInput.placeholder = '';
    }
    if (priceInput) {
      priceInput.value = '';
      priceInput.placeholder = '';
    }
    this.calcPurchaseModalTotal();
    this.openModal('modalRecordPurchase');
  },

  setPurchaseCount(val) {
    const input = document.getElementById('purchaseCountInput');
    if (!input) return;
    input.value = Math.max(1, val);
    this.calcPurchaseModalTotal();
  },

  calcPurchaseModalTotal() {
    const countInput = document.getElementById('purchaseCountInput');
    const priceInput = document.getElementById('purchaseUnitPriceInput');
    const displayEl = document.getElementById('purchaseTotalCostDisplay');
    const count = Math.max(0, parseInt(countInput?.value, 10) || 0);
    const unitPrice = Math.max(0, parseFloat(priceInput?.value) || 0);
    const total = count * unitPrice;
    if (displayEl) {
      displayEl.textContent = this.formatMoney(total);
    }
  },

  submitPurchaseModal(e) {
    if (e && e.preventDefault) e.preventDefault();
    const idEl = document.getElementById('purchaseLotId');
    const countInput = document.getElementById('purchaseCountInput');
    const priceInput = document.getElementById('purchaseUnitPriceInput');
    if (!idEl || !countInput) return;
    const lot = appState.animals.find(a => a.id === idEl.value);
    if (!lot) return;
    const count = parseInt(countInput.value, 10);
    if (isNaN(count) || count <= 0) {
      this.showToast('Veuillez entrer une quantité positive', 'error');
      return;
    }
    const unitPrice = Math.max(0, parseFloat(priceInput?.value) || 0);
    lot.currentQuantity += count;
    lot.initialQuantity += count;
    if (unitPrice > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      appState.expenses.unshift({
        id: 'exp-' + Date.now().toString(36),
        date: todayStr,
        category: 'nourriture',
        title: `Achat de ${count} sujets (${this.getAnimalDisplayName(lot)}${lot.name ? ' - Lot #' + lot.name : ''})`,
        quantity: count,
        unitPrice: unitPrice,
        total: count * unitPrice,
        linkedLotId: lot.id
      });
    }
    this.saveState();
    this.closeModal('modalRecordPurchase');
    this.renderAll();
    const displayName = this.getAnimalDisplayName(lot);
    this.showToast(this.t('toast_purchases_recorded', { n: count, breed: displayName, tot: lot.currentQuantity }) || `+${count} sujets ajoutés`);
  },

  recordPurchasePrompt(lotId) {
    this.openPurchaseModal(lotId);
  },

  quickSellFromLot(lotId) {
    this.openModal('modalAddSale');
    const select = document.getElementById('saleLotLinked');
    if (select) select.value = lotId;
    this.handleSaleLotSelection(lotId);
  },

  // ==========================================
  // EXPENSES MODULE
  // ==========================================
  renderExpenses() {
    const tbody = document.getElementById('expensesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const search = (document.getElementById('expenseSearchInput')?.value || '').toLowerCase();
    const catFilter = document.getElementById('expenseCategoryFilter')?.value || 'all';

    // Update expense summary bars
    let feedTot = 0, vetTot = 0, utilTot = 0, salTot = 0;
    appState.expenses.forEach(e => {
      const t = Number(e.total) || 0;
      if (e.category === 'nourriture') feedTot += t;
      else if (e.category === 'veterinaire') vetTot += t;
      else if (e.category === 'electricite' || e.category === 'eau') utilTot += t;
      else if (e.category === 'salaire') salTot += t;
    });

    const feedEl = document.getElementById('expenseFeedTotal');
    const vetEl = document.getElementById('expenseVetTotal');
    const utilEl = document.getElementById('expenseUtilitiesTotal');
    const salEl = document.getElementById('expenseSalariesTotal');

    if (feedEl) feedEl.textContent = this.formatMoney(feedTot);
    if (vetEl) vetEl.textContent = this.formatMoney(vetTot);
    if (utilEl) utilEl.textContent = this.formatMoney(utilTot);
    if (salEl) salEl.textContent = this.formatMoney(salTot);

    const filtered = appState.expenses.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(search) || this.getTranslatedExpenseTitle(e.title).toLowerCase().includes(search);
      const matchesCat = catFilter === 'all' || e.category === catFilter;
      return matchesSearch && matchesCat;
    }).sort((a, b) => {
      const order = appState.expenseSortOrder === 'asc' ? 1 : -1;
      if (appState.expenseSortField === 'date') {
        return (new Date(a.date) - new Date(b.date)) * order;
      }
      if (appState.expenseSortField === 'qty') {
        return ((Number(a.quantity) || 0) - (Number(b.quantity) || 0)) * order;
      }
      if (appState.expenseSortField === 'price') {
        return ((Number(a.unitPrice) || 0) - (Number(b.unitPrice) || 0)) * order;
      }
      if (appState.expenseSortField === 'total') {
        return ((Number(a.total) || 0) - (Number(b.total) || 0)) * order;
      }
      if (appState.expenseSortField === 'title') {
        return (a.title || '').localeCompare(b.title || '') * order;
      }
      return (new Date(b.date) - new Date(a.date));
    });

    // Update sort arrow indicators in the table header
    const expFields = ['date', 'title', 'qty', 'price', 'total'];
    expFields.forEach(f => {
      const arrowEl = document.getElementById(`sortArrowExp${f.charAt(0).toUpperCase() + f.slice(1)}`);
      if (arrowEl) {
        if (appState.expenseSortField === f) {
          arrowEl.textContent = appState.expenseSortOrder === 'asc' ? '▲' : '▼';
          arrowEl.style.color = 'var(--primary)';
        } else {
          arrowEl.textContent = '↕';
          arrowEl.style.color = 'var(--text-muted)';
        }
      }
    });

    if (filtered.length === 0) {
      if (appState.expenses.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="8" style="text-align: center; padding: 2.5rem;" class="text-muted">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📉</div>
            <strong style="font-size: 1.05rem; color: var(--text-primary); display:block; margin-bottom: 0.3rem;">${this.t('empty_expenses_title')}</strong>
            <p style="font-size: 0.85rem; margin-bottom: 1rem;">${this.t('empty_expenses_desc')}</p>
            <button class="btn btn-sm btn-danger bold" onclick="app.openModal('modalAddExpense')">
              ➕ ${this.t('btn_new_expense')}
            </button>
          </td></tr>
        `;
      } else {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">${this.t('no_transaction')}</td></tr>`;
      }
      return;
    }

    filtered.forEach(exp => {
      const tr = document.createElement('tr');
      const catBadge = this.getExpenseCategoryBadge(exp.category);
      const lotName = this.getLotNameById(exp.linkedLotId);
      const displayTitle = this.getTranslatedExpenseTitle(exp.title);

      let feedStockTag = '';
      if (exp.category === 'nourriture') {
        if (exp.feedStockAddedKg > 0) {
          feedStockTag = `<div style="margin-top: 3px;"><span class="badge" style="background: rgba(16, 185, 129, 0.12); color: var(--accent-emerald); font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">📦 +${Number(exp.feedStockAddedKg).toFixed(1)} kg en réserve</span></div>`;
        } else {
          feedStockTag = `<div style="margin-top: 3px;"><button type="button" class="btn btn-xs btn-outline" style="color: var(--accent-emerald); border-color: rgba(16, 185, 129, 0.4); font-size: 0.68rem; padding: 1px 6px;" onclick="app.addExistingExpenseToFeedStock('${exp.id}')" title="Ajouter cette quantité dans le stock d'aliment en réserve">📦 ${this.t('btn_add_to_feed_stock') || 'Mettre en stock'}</button></div>`;
        }
      }

      tr.innerHTML = `
        <td>${this.formatDateFR(exp.date)}</td>
        <td>${catBadge}</td>
        <td><strong>${displayTitle}</strong>${feedStockTag}</td>
        <td>
          <button type="button" class="badge-pill btn-subtle" onclick="app.reassignExpenseLot('${exp.id}')" title="Cliquer pour changer le lot affecté" style="cursor:pointer; border:1px solid var(--border-color); background:var(--bg-card); padding:3px 8px; font-size:0.75rem;">
            ${lotName} ✏️
          </button>
        </td>
        <td>${exp.quantity}</td>
        <td>${this.formatMoney(exp.unitPrice)}</td>
        <td class="text-rose bold">${this.formatMoney(exp.total)}</td>
        <td>
          <button class="btn btn-sm btn-danger-outline" style="padding:2px 8px;" onclick="app.deleteExpense('${exp.id}')">
            🗑️
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  calcExpenseTotal() {
    const q = parseFloat(document.getElementById('expenseQuantity').value) || 0;
    const p = parseFloat(document.getElementById('expenseUnitPrice').value) || 0;
    const totalEl = document.getElementById('expenseTotalCalculated');
    const decimals = appState.currency === 'TND' ? 3 : 2;
    if (totalEl) totalEl.value = (q * p).toFixed(decimals);
  },

  handleExpenseCatChange() {
    const cat = document.getElementById('expenseCategory')?.value;
    const title = document.getElementById('expenseTitle');
    if (title) {
      title.placeholder = '';
    }

    const feedPurchaseBlock = document.getElementById('expenseFeedPurchaseBlock');
    const standardRow = document.getElementById('expenseStandardRow');
    const expQty = document.getElementById('expenseQuantity');
    const expPrice = document.getElementById('expenseUnitPrice');

    if (cat === 'nourriture') {
      if (feedPurchaseBlock) feedPurchaseBlock.style.display = 'block';
      if (standardRow) standardRow.style.display = 'none';
      if (expQty) expQty.removeAttribute('required');
      if (expPrice) expPrice.removeAttribute('required');

      this.populateExpenseFeedTypes();
      this.setFeedPurchaseMode(appState.currentFeedPurchaseMode || 'sac');
    } else {
      if (feedPurchaseBlock) feedPurchaseBlock.style.display = 'none';
      if (standardRow) standardRow.style.display = 'flex';
      if (expQty) expQty.setAttribute('required', 'required');
      if (expPrice) expPrice.setAttribute('required', 'required');
      this.calcExpenseTotal();
    }
  },

  setFeedPurchaseMode(mode) {
    appState.currentFeedPurchaseMode = mode;

    const btnSac = document.getElementById('btnFeedModeSac');
    const btnKg = document.getElementById('btnFeedModeKg');
    const btnBoite = document.getElementById('btnFeedModeBoite');

    if (btnSac) btnSac.classList.toggle('active-feed-mode-btn', mode === 'sac');
    if (btnKg) btnKg.classList.toggle('active-feed-mode-btn', mode === 'kg');
    if (btnBoite) btnBoite.classList.toggle('active-feed-mode-btn', mode === 'boite');

    const subSac = document.getElementById('subformFeedSac');
    const subKg = document.getElementById('subformFeedKg');
    const subBoite = document.getElementById('subformFeedBoite');

    if (subSac) subSac.style.display = (mode === 'sac') ? 'block' : 'none';
    if (subKg) subKg.style.display = (mode === 'kg') ? 'block' : 'none';
    if (subBoite) subBoite.style.display = (mode === 'boite') ? 'block' : 'none';

    this.calcFeedPurchaseFields();
  },

  setFeedBagWeightQuick(w) {
    const input = document.getElementById('feedBagWeight');
    if (input) {
      input.value = w;
      this.calcFeedPurchaseFields();
    }
  },

  setFeedBoiteCountQuick(c) {
    const input = document.getElementById('feedBoiteCount');
    if (input) {
      input.value = c;
      this.calcFeedPurchaseFields();
    }
  },

  calcFeedPurchaseFields() {
    const mode = appState.currentFeedPurchaseMode || 'sac';
    let total = 0;
    let addedKg = 0;
    let unitPrice = 0;
    let quantity = 0;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';

    if (mode === 'sac') {
      const bagCount = parseFloat(document.getElementById('feedBagCount')?.value) || 0;
      const bagWeight = parseFloat(document.getElementById('feedBagWeight')?.value) || 50;
      const bagPrice = parseFloat(document.getElementById('feedBagPrice')?.value) || 0;

      total = bagCount * bagPrice;
      addedKg = bagCount * bagWeight;
      quantity = bagCount;
      unitPrice = bagPrice;
    } else if (mode === 'kg') {
      const kgCount = parseFloat(document.getElementById('feedKgCount')?.value) || 0;
      const kgPrice = parseFloat(document.getElementById('feedKgPrice')?.value) || 0;

      total = kgCount * kgPrice;
      addedKg = kgCount;
      quantity = kgCount;
      unitPrice = kgPrice;
    } else if (mode === 'boite') {
      const boiteCount = parseFloat(document.getElementById('feedBoiteCount')?.value) || 0;
      const boiteTotalPrice = parseFloat(document.getElementById('feedBoiteTotalPrice')?.value) || 0;

      total = boiteTotalPrice;
      addedKg = Number((boiteCount * 0.667).toFixed(2));
      quantity = boiteCount;
      unitPrice = boiteCount > 0 ? (total / boiteCount) : 0;
    }

    const expQty = document.getElementById('expenseQuantity');
    const expPrice = document.getElementById('expenseUnitPrice');
    const expTot = document.getElementById('expenseTotalCalculated');

    if (expQty) expQty.value = quantity;
    if (expPrice) expPrice.value = unitPrice.toFixed(3);
    if (expTot) expTot.value = total.toFixed(3);

    const recapTotal = document.getElementById('feedPurchaseRecapTotal');
    const recapKg = document.getElementById('feedPurchaseRecapKg');

    if (recapTotal) recapTotal.textContent = this.formatMoney(total);
    if (recapKg) {
      let extraNote = '';
      if (mode === 'boite') {
        extraNote = isAr ? ' (حكك سيكام)' : ' (boîtes Sicam)';
      } else if (mode === 'sac') {
        extraNote = isAr ? ' (أكياس)' : ' (sacs)';
      }
      recapKg.textContent = `${addedKg.toFixed(1)} ${unitKg}${extraNote}`;
    }
  },

  populateExpenseFeedTypes() {
    const select = document.getElementById('expenseFeedTypeSelect');
    if (!select) return;

    appState.feedTypes = this.sanitizeFeedTypes(appState.feedTypes);
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const stockLabel = isAr ? 'المخزون' : 'Stock';

    let html = '';
    (appState.feedTypes || []).forEach(ft => {
      const stock = Number(ft.stockKg) || 0;
      const name = this.getFeedDisplayName(ft);
      html += `<option value="${ft.id}">🌾 ${name} (${stockLabel}: ${stock.toFixed(1)} ${unitKg})</option>`;
    });

    const newLabel = isAr
      ? '➕ إنشاء علف جديد حسب اسم المصروف'
      : (isEn ? '➕ Create new feed type from title' : '➕ Créer un nouvel aliment selon l\'intitulé');
    html += `<option value="__new__">${newLabel}</option>`;

    select.innerHTML = html;
  },

  toggleExpenseFeedOptions() {
    const chk = document.getElementById('expenseAddToFeedStock');
    const grp = document.getElementById('expenseFeedTypeSelectGroup');
    if (grp) {
      grp.style.display = (chk && chk.checked) ? 'block' : 'none';
    }
    this.calcFeedPurchaseFields();
  },

  onExpenseFeedTypeSelectChange() {
    const select = document.getElementById('expenseFeedTypeSelect');
    const titleInput = document.getElementById('expenseTitle');
    if (!select || !titleInput) return;

    if (select.value !== '__new__') {
      const ft = (appState.feedTypes || []).find(f => f.id === select.value);
      if (ft && (!titleInput.value || titleInput.value.trim() === '')) {
        const isAr = appState.lang === 'ar';
        const isEn = appState.lang === 'en';
        const prefix = isAr ? 'شراء علف' : (isEn ? 'Feed purchase' : 'Achat');
        titleInput.value = `${prefix} ${this.getFeedDisplayName(ft)}`;
      }
    }
    this.calcFeedPurchaseFields();
  },

  onExpenseTitleInput() {
    const titleInput = document.getElementById('expenseTitle');
    const select = document.getElementById('expenseFeedTypeSelect');
    if (!titleInput || !select) return;

    const val = titleInput.value.trim().toLowerCase();
    if (val.length >= 2) {
      const match = (appState.feedTypes || []).find(ft => {
        const name = (ft.name || '').toLowerCase();
        return val.includes(name) || name.includes(val);
      });
      if (match && select.value !== match.id) {
        select.value = match.id;
      }
    }
    this.calcFeedPurchaseFields();
  },

  handleSaveExpense(e) {
    e.preventDefault();
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;
    const titleInput = document.getElementById('expenseTitle');
    let title = titleInput?.value.trim();
    const linkedLotId = document.getElementById('expenseAnimalLot').value;

    if (!date) {
      const isAr = appState.lang === 'ar';
      this.showToast(isAr ? 'يرجى إدخال التاريخ.' : 'Veuillez renseigner la date.', 'warning');
      return;
    }

    let quantity = 1;
    let unitPrice = 0;
    let total = 0;
    let addedKg = 0;
    let feedStockAddedKg = 0;
    let feedTypeId = null;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    if (category === 'nourriture') {
      const mode = appState.currentFeedPurchaseMode || 'sac';
      const addToStock = document.getElementById('expenseAddToFeedStock')?.checked;

      if (mode === 'sac') {
        const bagCount = parseFloat(document.getElementById('feedBagCount')?.value) || 1;
        const bagWeight = parseFloat(document.getElementById('feedBagWeight')?.value) || 50;
        const bagPrice = parseFloat(document.getElementById('feedBagPrice')?.value) || 0;

        quantity = bagCount;
        unitPrice = bagPrice;
        total = bagCount * bagPrice;
        addedKg = bagCount * bagWeight;

        if (!title) {
          const sacWord = isAr ? 'أكياس' : (isEn ? 'Bags' : 'Sacs');
          title = `${bagCount} ${sacWord} (${bagWeight}kg)`;
        }
      } else if (mode === 'kg') {
        const kgCount = parseFloat(document.getElementById('feedKgCount')?.value) || 1;
        const kgPrice = parseFloat(document.getElementById('feedKgPrice')?.value) || 0;

        quantity = kgCount;
        unitPrice = kgPrice;
        total = kgCount * kgPrice;
        addedKg = kgCount;

        if (!title) {
          const kgWord = isAr ? 'كغ' : 'kg';
          title = `${kgCount} ${kgWord}`;
        }
      } else if (mode === 'boite') {
        const boiteCount = parseFloat(document.getElementById('feedBoiteCount')?.value) || 1;
        const boiteTotalPrice = parseFloat(document.getElementById('feedBoiteTotalPrice')?.value) || 0;

        quantity = boiteCount;
        total = boiteTotalPrice;
        unitPrice = boiteCount > 0 ? (total / boiteCount) : 0;
        addedKg = Number((boiteCount * 0.667).toFixed(2));

        if (!title) {
          const boiteWord = isAr ? 'حكك طماطم' : (isEn ? 'Tomato cans' : 'Boîtes tomate (Sicam)');
          title = `${boiteCount} ${boiteWord}`;
        }
      }

      if (addToStock && addedKg > 0) {
        appState.feedTypes = this.sanitizeFeedTypes(appState.feedTypes);
        const selectedFeedId = document.getElementById('expenseFeedTypeSelect')?.value;
        let targetFeed = (appState.feedTypes || []).find(f => f.id === selectedFeedId);

        if (!targetFeed || selectedFeedId === '__new__') {
          const cleanName = title.trim();
          targetFeed = (appState.feedTypes || []).find(f => f.name.toLowerCase().trim() === cleanName.toLowerCase().trim());
          if (!targetFeed) {
            targetFeed = {
              id: 'feed-' + Date.now().toString(36),
              name: cleanName || (isAr ? 'علف جديد' : 'Nouvel aliment'),
              stockKg: 0,
              pricePerKg: (total / (addedKg || 1)) || 1.2
            };
            appState.feedTypes.push(targetFeed);
          }
        }

        targetFeed.stockKg = Math.max(0, (Number(targetFeed.stockKg) || 0) + addedKg);
        if (total > 0 && addedKg > 0) {
          targetFeed.pricePerKg = Math.max(0.1, total / addedKg);
        }

        appState.feedStockKg = (appState.feedTypes || []).reduce((sum, f) => sum + (Number(f.stockKg) || 0), 0);
        appState.feedStockDate = this.getTodayStr();
        appState.feedStockCostPerKg = this.getAverageFeedPricePerKg();

        feedStockAddedKg = addedKg;
        feedTypeId = targetFeed.id;
      }
    } else {
      quantity = parseFloat(document.getElementById('expenseQuantity')?.value) || 1;
      unitPrice = parseFloat(document.getElementById('expenseUnitPrice')?.value) || 0;
      total = parseFloat(document.getElementById('expenseTotalCalculated')?.value) || (quantity * unitPrice);

      if (!title) {
        const isAr = appState.lang === 'ar';
        this.showToast(isAr ? 'يرجى إدخال بيان المصروف.' : 'Veuillez renseigner l\'intitulé de la dépense.', 'warning');
        return;
      }
    }

    const newExp = {
      id: 'exp-' + Date.now().toString(36),
      date,
      category,
      title: title || 'Dépense',
      quantity,
      unitPrice,
      total,
      linkedLotId,
      feedStockAddedKg,
      feedTypeId
    };

    appState.expenses.unshift(newExp);
    this.saveState();
    this.closeModal('modalAddExpense');
    this.renderAll();

    let toastMsg = this.t('toast_expense_saved', { amount: this.formatMoney(total) });
    if (feedStockAddedKg > 0) {
      toastMsg += isAr 
        ? ` (+${feedStockAddedKg.toFixed(1)} كغ في مخزون الأعلاف)` 
        : ` (+${feedStockAddedKg.toFixed(1)} kg ajoutés au stock)`;
    }
    this.showToast(toastMsg);

    document.getElementById('formAddExpense').reset();
    const expQty = document.getElementById('expenseQuantity');
    const expPrice = document.getElementById('expenseUnitPrice');
    if (expQty) { expQty.value = ''; expQty.placeholder = ''; }
    if (expPrice) { expPrice.value = ''; expPrice.placeholder = ''; }
    this.calcExpenseTotal();
  },

  deleteExpense(expId) {
    const isAr = appState.lang === 'ar';
    this.confirmDialog({
      title: isAr ? 'حذف المصروف' : 'Supprimer la dépense',
      message: isAr ? 'هل تريد بالتأكيد حذف هذا المصروف ؟' : 'Confirmer la suppression de cette dépense ?',
      isDanger: true,
      confirmText: isAr ? 'حذف' : 'Supprimer',
      onConfirm: () => {
        const exp = (appState.expenses || []).find(e => e.id === expId);
        if (exp && exp.feedStockAddedKg && exp.feedTypeId) {
          const ft = (appState.feedTypes || []).find(f => f.id === exp.feedTypeId);
          if (ft) {
            ft.stockKg = Math.max(0, (Number(ft.stockKg) || 0) - Number(exp.feedStockAddedKg));
            appState.feedStockKg = (appState.feedTypes || []).reduce((sum, f) => sum + (Number(f.stockKg) || 0), 0);
          }
        }
        if (window.appAuth && typeof appAuth.addDeletedId === 'function') {
          appAuth.addDeletedId(expId);
        }
        appState.expenses = appState.expenses.filter(e => e.id !== expId);
        this.saveState();
        this.renderAll();
        this.showToast(this.t('toast_expense_deleted'));
      }
    });
  },

  addExistingExpenseToFeedStock(expId) {
    const exp = (appState.expenses || []).find(e => e.id === expId);
    if (!exp) return;

    appState.feedTypes = this.sanitizeFeedTypes(appState.feedTypes);
    const isAr = appState.lang === 'ar';
    const unitKg = isAr ? 'كغ' : 'kg';

    let defaultKg = Number(exp.quantity) || 1;
    const titleLower = (exp.title || '').toLowerCase();
    if (titleLower.includes('50kg') || (titleLower.includes('sac') && !titleLower.includes('25kg'))) {
      defaultKg = defaultKg * 50;
    } else if (titleLower.includes('25kg')) {
      defaultKg = defaultKg * 25;
    }

    const promptMsg = isAr
      ? `كم كيلوغرام من العلف تريد إضافته للمخزون الاحتياطي للمصروف "${exp.title}" ؟`
      : `Combien de kilos d'aliments ajouter au stock réserve pour la dépense "${exp.title}" ?`;

    this.promptDialog({
      title: isAr ? 'إضافة إلى مخزون العلف' : 'Ajouter au Stock Réserve',
      message: promptMsg,
      label: isAr ? 'الكمية بالكيلوغرام (كغ) :' : 'Quantité en kilogrammes (kg) :',
      inputType: 'number',
      defaultValue: defaultKg,
      min: 0.1,
      step: 0.5,
      confirmText: isAr ? 'إضافة للمخزون' : 'Ajouter au Stock',
      onConfirm: (val) => {
        const addedKg = parseFloat(val) || 0;
        if (addedKg <= 0) return;

        // Match or ask which feed
        let ft = appState.feedTypes.find(f => {
          const fn = (f.name || '').toLowerCase();
          return titleLower.includes(fn) || fn.includes(titleLower);
        });

        if (!ft) {
          if (titleLower.includes('blé') || titleLower.includes('ble') || titleLower.includes('قمح')) {
            ft = appState.feedTypes.find(f => f.id === 'feed-ble');
          } else if (titleLower.includes('bouchon') || titleLower.includes('ponte') || titleLower.includes('بوشون')) {
            ft = appState.feedTypes.find(f => f.id === 'feed-bouchon');
          }
        }

        if (!ft) {
          ft = {
            id: 'feed-' + Date.now().toString(36),
            name: exp.title.replace(/\(\d+.*?\)/g, '').trim() || (isAr ? 'علف جديد' : 'Nouvel aliment'),
            stockKg: 0,
            pricePerKg: (Number(exp.total) / (addedKg || 1)) || 1.2
          };
          appState.feedTypes.push(ft);
        }

        ft.stockKg = Math.max(0, (Number(ft.stockKg) || 0) + addedKg);
        if (exp.total > 0 && addedKg > 0) {
          ft.pricePerKg = Number(exp.total) / addedKg;
        }
        exp.feedStockAddedKg = addedKg;
        exp.feedTypeId = ft.id;

        appState.feedStockKg = (appState.feedTypes || []).reduce((sum, f) => sum + (Number(f.stockKg) || 0), 0);
        appState.feedStockDate = this.getTodayStr();
        appState.feedStockCostPerKg = this.getAverageFeedPricePerKg();

        this.saveState();
        this.renderAll();
        this.showToast(`✅ +${addedKg.toFixed(1)} ${unitKg} ajoutés au stock (${this.getFeedDisplayName(ft)}) !`);
      }
    });
  },

  quickImportFoodExpensesToStock() {
    const uncredited = (appState.expenses || []).filter(e => e.category === 'nourriture' && !e.feedStockAddedKg);
    if (uncredited.length === 0) {
      this.showToast('Tous les achats d\'aliments sont déjà comptabilisés dans le stock !');
      return;
    }

    appState.feedTypes = this.sanitizeFeedTypes(appState.feedTypes);
    let totalAdded = 0;

    uncredited.forEach(exp => {
      const titleLower = (exp.title || '').toLowerCase();
      let addedKg = Number(exp.quantity) || 0;
      if (titleLower.includes('50kg') || (titleLower.includes('sac') && !titleLower.includes('25kg'))) {
        addedKg = addedKg * 50;
      } else if (titleLower.includes('25kg')) {
        addedKg = addedKg * 25;
      }

      let ft = appState.feedTypes.find(f => {
        const fn = (f.name || '').toLowerCase();
        return titleLower.includes(fn) || fn.includes(titleLower);
      });

      if (!ft) {
        if (titleLower.includes('blé') || titleLower.includes('ble') || titleLower.includes('قمح')) {
          ft = appState.feedTypes.find(f => f.id === 'feed-ble');
        } else if (titleLower.includes('bouchon') || titleLower.includes('ponte') || titleLower.includes('بوشون')) {
          ft = appState.feedTypes.find(f => f.id === 'feed-bouchon');
        }
      }

      if (!ft) {
        ft = {
          id: 'feed-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
          name: exp.title.replace(/\(\d+.*?\)/g, '').trim() || 'Aliment',
          stockKg: 0,
          pricePerKg: (Number(exp.total) / (addedKg || 1)) || 1.2
        };
        appState.feedTypes.push(ft);
      }

      ft.stockKg = Math.max(0, (Number(ft.stockKg) || 0) + addedKg);
      if (exp.total > 0 && addedKg > 0) {
        ft.pricePerKg = Number(exp.total) / addedKg;
      }
      exp.feedStockAddedKg = addedKg;
      exp.feedTypeId = ft.id;
      totalAdded += addedKg;
    });

    appState.feedStockKg = (appState.feedTypes || []).reduce((sum, f) => sum + (Number(f.stockKg) || 0), 0);
    appState.feedStockDate = this.getTodayStr();
    appState.feedStockCostPerKg = this.getAverageFeedPricePerKg();

    this.saveState();
    this.renderAll();
    if (document.getElementById('modalAdjustFeedStock') && !document.getElementById('modalAdjustFeedStock').classList.contains('hidden')) {
      this.renderFeedStockAdjustModal();
    }
    this.showToast(`✅ +${totalAdded.toFixed(1)} kg ajoutés avec succès dans vos stocks d'aliments en réserve !`);
  },

  // ==========================================
  // SALES & COMMERCE MODULE
  // ==========================================
  renderSales() {
    const tbody = document.getElementById('salesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const sorted = [...appState.sales].sort((a, b) => {
      const order = appState.saleSortOrder === 'asc' ? 1 : -1;
      if (appState.saleSortField === 'date') {
        return (new Date(a.date) - new Date(b.date)) * order;
      }
      if (appState.saleSortField === 'qty') {
        return ((Number(a.quantity) || 0) - (Number(b.quantity) || 0)) * order;
      }
      if (appState.saleSortField === 'price') {
        return ((Number(a.unitPrice) || 0) - (Number(b.unitPrice) || 0)) * order;
      }
      if (appState.saleSortField === 'total') {
        return ((Number(a.total) || 0) - (Number(b.total) || 0)) * order;
      }
      if (appState.saleSortField === 'title') {
        return (a.description || '').localeCompare(b.description || '') * order;
      }
      return (new Date(b.date) - new Date(a.date));
    });

    // Update sort arrow indicators in the table header
    const saleFields = ['date', 'title', 'qty', 'price', 'total'];
    saleFields.forEach(f => {
      const arrowEl = document.getElementById(`sortArrowSale${f.charAt(0).toUpperCase() + f.slice(1)}`);
      if (arrowEl) {
        if (appState.saleSortField === f) {
          arrowEl.textContent = appState.saleSortOrder === 'asc' ? '▲' : '▼';
          arrowEl.style.color = 'var(--primary)';
        } else {
          arrowEl.textContent = '↕';
          arrowEl.style.color = 'var(--text-muted)';
        }
      }
    });

    if (sorted.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="9" style="text-align: center; padding: 2.5rem;" class="text-muted">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💰</div>
          <strong style="font-size: 1.05rem; color: var(--text-primary); display:block; margin-bottom: 0.3rem;">${this.t('empty_sales_title')}</strong>
          <p style="font-size: 0.85rem; margin-bottom: 1rem;">${this.t('empty_sales_desc')}</p>
          <button class="btn btn-sm btn-emerald bold" onclick="app.openModal('modalAddSale')">
            ➕ ${this.t('btn_new_sale')}
          </button>
        </td></tr>
      `;
      return;
    }

    sorted.forEach(sale => {
      const tr = document.createElement('tr');
      const prodBadge = this.getSaleProductBadge(sale.productType);
      const lotName = this.getLotNameById(sale.linkedLotId);
      const displayDesc = this.getTranslatedSaleDescription(sale.description);
      
      // Calculate estimated net margin for this sale based on linked lot feed costs
      const estimatedMargin = this.calcSaleEstimatedMargin(sale);

      tr.innerHTML = `
        <td>${this.formatDateFR(sale.date)}</td>
        <td>${prodBadge}</td>
        <td><strong>${displayDesc}</strong></td>
        <td>${this.formatSaleQuantityDisplay(sale)}</td>
        <td>${this.formatMoney(sale.unitPrice)}</td>
        <td class="text-emerald bold">${this.formatMoney(sale.total)}</td>
        <td><small class="badge-pill">${lotName}</small></td>
        <td><span class="badge-tag text-emerald">${estimatedMargin}</span></td>
        <td>
          <button class="btn btn-sm btn-danger-outline" style="padding:2px 8px;" onclick="app.deleteSale('${sale.id}')">
            🗑️
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  formatSaleQuantityDisplay(sale) {
    const qty = Number(sale.quantity) || 0;
    const lang = appState.lang || 'fr';
    if (sale.productType === 'oeufs') {
      if (sale.format === 'hara') {
        if (lang === 'ar') return `<strong>${qty} حارة</strong> <span class="text-muted">(${qty * 4} بيضة)</span>`;
        if (lang === 'en') return `<strong>${qty} Haras</strong> <span class="text-muted">(${qty * 4} eggs)</span>`;
        return `<strong>${qty} Haras</strong> <span class="text-muted">(${qty * 4} œufs)</span>`;
      }
      if (sale.format === 'plateau') {
        const haras = (qty * 30 / 4).toFixed(1);
        if (lang === 'ar') return `<strong>${qty} طبق</strong> <span class="text-muted">(${qty * 30} بيضة / ${haras} حارة)</span>`;
        if (lang === 'en') return `<strong>${qty} Trays</strong> <span class="text-muted">(${qty * 30} eggs / ${haras} Haras)</span>`;
        return `<strong>${qty} Plateaux</strong> <span class="text-muted">(${qty * 30} œufs / ${haras} Haras)</span>`;
      }
      if (sale.format === 'oeuf-unite') {
        const haras = (qty / 4).toFixed(1);
        if (lang === 'ar') return `<strong>${qty} بيضة</strong> <span class="text-muted">(${haras} حارة)</span>`;
        if (lang === 'en') return `<strong>${qty} eggs</strong> <span class="text-muted">(${haras} Haras)</span>`;
        return `<strong>${qty} œufs</strong> <span class="text-muted">(${haras} Haras)</span>`;
      }
    }
    const ageTag = sale.ageText ? `<span class="badge-pill">${sale.ageText}</span>` : '';
    const unitWord = lang === 'ar' ? 'طائر (بالرأس)' : (lang === 'en' ? 'birds (per head)' : 'sujets (par tête)');
    return `<strong>${qty}</strong> <span class="text-muted">${unitWord}</span> ${ageTag}`;
  },

  calcSaleTotal() {
    this.validateSaleQuantityAgainstLot();
    const q = parseFloat(document.getElementById('saleQuantity')?.value) || 0;
    const p = parseFloat(document.getElementById('saleUnitPrice')?.value) || 0;
    const totalEl = document.getElementById('saleTotalCalculated');
    const decimals = appState.currency === 'TND' ? 3 : 2;
    const total = q * p;
    if (totalEl) totalEl.value = total.toFixed(decimals);

    const prodType = document.getElementById('saleProductType')?.value;
    const format = document.getElementById('saleUnitFormat')?.value;
    const lang = appState.lang || 'fr';

    // 1. Œufs : Calculateur Dynamique HARA (حارة = 4 œufs) & Plateaux (30)
    if (prodType === 'oeufs') {
      const badge = document.getElementById('eggConversionSummary');
      if (badge) {
        let eggs = 0, haras = 0, plates = 0;
        if (format === 'hara') {
          haras = q;
          eggs = q * 4;
          plates = (eggs / 30).toFixed(2);
        } else if (format === 'plateau') {
          plates = q;
          eggs = q * 30;
          haras = (eggs / 4).toFixed(1);
        } else {
          eggs = q;
          haras = (eggs / 4).toFixed(2);
          plates = (eggs / 30).toFixed(2);
        }
        if (lang === 'ar') {
          badge.textContent = `🥚 ${eggs} بيضة = ${haras} حارة | ~${plates} طبق`;
        } else if (lang === 'en') {
          badge.textContent = `🥚 ${eggs} egg(s) = ${haras} HARA(s) | ~${plates} Tray(s)`;
        } else {
          badge.textContent = `🥚 ${eggs} œuf(s) = ${haras} HARA(s) | ~${plates} Plateau(x)`;
        }
      }
      return;
    }

    // 2. Volailles (Table Agronomique Réelle & Calcul de Prix Optimisé)
    const stageBadge = document.getElementById('smartStageBadge');
    const feedKgEl = document.getElementById('smartFeedKg');
    const feedCostEl = document.getElementById('smartFeedCost');
    const netProfitEl = document.getElementById('smartNetProfit');
    const marginPctEl = document.getElementById('smartMarginPct');
    const calcNoteEl = document.getElementById('smartCalcNote');

    const rawAge = parseFloat(document.getElementById('saleAgeValue')?.value);
    const ageUnit = document.getElementById('saleAgeUnit')?.value || 'jours';
    const linkedLotId = document.getElementById('saleLotLinked')?.value;
    const linkedLot = (linkedLotId && linkedLotId !== 'none') ? (appState.animals || []).find(a => a.id === linkedLotId) : null;

    const arrivalAgeDays = linkedLot ? (Number(linkedLot.arrivalAgeDays) || 0) : 0;

    // Déterminer l'âge exact en jours (depuis éclosion)
    let days = 21;
    if (linkedLot && linkedLot.birthDate) {
      days = this.calculateAgeInDays(linkedLot.birthDate) + arrivalAgeDays;
    } else if (ageUnit === 'adulte') {
      days = (prodType === 'canard') ? 140 : 180;
    } else if (!isNaN(rawAge) && rawAge > 0) {
      if (ageUnit === 'semaines') days = Math.round(rawAge * 7);
      else if (ageUnit === 'mois') days = Math.round(rawAge * 30.5);
      else days = Math.round(rawAge);
    } else {
      days = (prodType === 'poussin') ? 21 : ((prodType === 'canard') ? 140 : 180);
    }

    // Espèce et profil
    const species = linkedLot ? linkedLot.species : prodType;
    const stage = linkedLot ? linkedLot.stage : '';
    const breed = linkedLot ? linkedLot.breed : '';

    // Données de la table agronomique
    const feedData = this.getAgronomicFeedData(species, days, stage, breed);
    const cumulFeedKg = this.calculateCumulativeFeedKg(species, days, stage, breed, arrivalAgeDays);
    const feedPriceKg = this.getAverageFeedPricePerKg();

    const totalFeedKg = q * cumulFeedKg;
    const totalFeedCost = totalFeedKg * feedPriceKg;
    const feedCostPerHead = cumulFeedKg * feedPriceKg;

    // Coût d'acquisition du sujet (0 DT si gratuit ou éclosion)
    const acqCostPerHead = linkedLot ? (Number(linkedLot.costPerHead) || 0) : 0;
    const totalAcqCost = q * acqCostPerHead;

    // Frais généraux & soins par tête
    const vetBufferPerHead = (prodType === 'poussin') ? 0.150 : 0.350;
    const costPricePerHead = acqCostPerHead + feedCostPerHead + vetBufferPerHead;

    // Bénéfice net projeté
    const netProfit = total - (totalFeedCost + totalAcqCost);
    const marginPct = total > 0 ? ((netProfit / total) * 100).toFixed(1) : 0;

    if (stageBadge) {
      const stageName = lang === 'ar' ? feedData.labelAr : (lang === 'en' ? feedData.labelEn : feedData.labelFr);
      const daySuffix = lang === 'ar' ? 'ي' : (lang === 'en' ? 'd' : 'j');
      stageBadge.textContent = `${stageName} [${days} ${daySuffix}]`;
    }

    if (feedKgEl) {
      const perUnit = lang === 'ar' ? 'كغ/طائر' : (lang === 'en' ? 'kg/head' : 'kg/sujet');
      feedKgEl.textContent = `${totalFeedKg.toFixed(1)} kg (~${cumulFeedKg.toFixed(2)} ${perUnit})`;
    }

    if (feedCostEl) {
      feedCostEl.textContent = this.formatMoney(totalFeedCost);
    }

    if (netProfitEl) {
      netProfitEl.textContent = (netProfit >= 0 ? '+' : '') + this.formatMoney(netProfit);
      netProfitEl.className = `stat-val bold ${netProfit >= 0 ? 'text-emerald' : 'text-rose'}`;
    }

    if (marginPctEl) {
      marginPctEl.textContent = `${marginPct}%`;
    }

    if (calcNoteEl) {
      if (lang === 'ar') {
        calcNoteEl.textContent = `💡 الجدول العلمي: معدل الاستهلاك اليومي ${feedData.avgGrams} غ/يوم (${feedData.minGrams}-${feedData.maxGrams}غ). التراكمي: ${cumulFeedKg.toFixed(2)} كغ/طائر (~${this.formatMoney(feedCostPerHead)} علف).`;
      } else if (lang === 'en') {
        calcNoteEl.textContent = `💡 Agronomic rate: ${feedData.avgGrams} g/day (${feedData.minGrams}-${feedData.maxGrams}g). Cumulative: ${cumulFeedKg.toFixed(2)} kg/head (~${this.formatMoney(feedCostPerHead)} feed).`;
      } else {
        calcNoteEl.textContent = `💡 Table agronomique : ${feedData.avgGrams} g/j (${feedData.minGrams}-${feedData.maxGrams}g). Cumul mangé : ${cumulFeedKg.toFixed(2)} kg/sujet (~${this.formatMoney(feedCostPerHead)} aliment).`;
      }
    }
  },

  validateSaleQuantityAgainstLot() {
    const qtyInput = document.getElementById('saleQuantity');
    const warningEl = document.getElementById('saleQtyWarning');
    const linkedLotId = document.getElementById('saleLotLinked')?.value;
    if (!qtyInput) return true;

    if (!linkedLotId || linkedLotId === 'none') {
      qtyInput.classList.remove('has-error', 'input-error');
      if (warningEl) {
        warningEl.style.display = 'none';
        warningEl.textContent = '';
      }
      return true;
    }

    const lot = (appState.animals || []).find(a => a.id === linkedLotId);
    if (!lot) {
      qtyInput.classList.remove('has-error', 'input-error');
      if (warningEl) {
        warningEl.style.display = 'none';
        warningEl.textContent = '';
      }
      return true;
    }

    const remaining = Number(lot.currentQuantity) || 0;
    const requested = parseFloat(qtyInput.value) || 0;

    if (requested > remaining) {
      // Dépassement de stock -> Bordure rouge visible et alerte immédiate !
      qtyInput.classList.add('has-error', 'input-error');
      if (warningEl) {
        const isAr = appState.lang === 'ar';
        const isEn = appState.lang === 'en';
        warningEl.style.display = 'block';
        if (isAr) {
          warningEl.textContent = `⚠️ تنبيه: الكمية المطلوبة (${requested}) تتجاوز العدد المتبقي في الدفعة (${remaining} طائر)!`;
        } else if (isEn) {
          warningEl.textContent = `⚠️ Warning: Requested quantity (${requested}) exceeds remaining flock count (${remaining} birds)!`;
        } else {
          warningEl.textContent = `⚠️ Attention : La quantité demandée (${requested}) dépasse l'effectif restant du lot (${remaining} sujets) !`;
        }
      }
      return false;
    } else {
      // Conforme -> Bordure normale
      qtyInput.classList.remove('has-error', 'input-error');
      if (warningEl) {
        warningEl.style.display = 'none';
        warningEl.textContent = '';
      }
      return true;
    }
  },

  handleSaleLotSelection(lotId) {
    const qtyInput = document.getElementById('saleQuantity');
    if (!lotId || lotId === 'none') {
      if (qtyInput) qtyInput.removeAttribute('max');
      this.validateSaleQuantityAgainstLot();
      this.calcSaleTotal();
      return;
    }
    const lot = (appState.animals || []).find(a => a.id === lotId);
    if (!lot) return;

    // 1. Définir automatiquement la quantité avec le reste de la bande !
    const remaining = Number(lot.currentQuantity) || 0;
    if (qtyInput) {
      qtyInput.value = remaining;
      qtyInput.max = remaining;
    }

    const typeSelect = document.getElementById('saleProductType');
    const ageUnit = document.getElementById('saleAgeUnit');
    const ageInput = document.getElementById('saleAgeValue');

    if (lot.species === 'canard' || lot.species === 'canard_barbarie') {
      if (typeSelect) typeSelect.value = 'canard';
    } else if (lot.species === 'pintade') {
      if (typeSelect) typeSelect.value = 'pintade';
    } else if (lot.species === 'poussin') {
      if (typeSelect) typeSelect.value = 'poussin';
    } else if (lot.species === 'pondeuse') {
      if (typeSelect && typeSelect.value !== 'oeufs') typeSelect.value = 'poulet';
    } else {
      if (typeSelect) typeSelect.value = 'poulet';
    }
    this.handleSaleTypeChange();

    // Remplir l'âge d'après sa date de naissance réelle + âge d'achat
    const arrivalAgeDays = Number(lot.arrivalAgeDays) || 0;
    const ageDays = this.calculateAgeInDays(lot.birthDate) + arrivalAgeDays;
    if (ageInput && ageUnit) {
      if (ageDays <= 28) {
        ageUnit.value = 'jours';
        ageInput.value = ageDays;
        ageInput.disabled = false;
      } else if (ageDays <= 126) {
        ageUnit.value = 'semaines';
        ageInput.value = Math.round(ageDays / 7);
        ageInput.disabled = false;
      } else {
        ageUnit.value = 'adulte';
        ageInput.value = '';
        ageInput.disabled = true;
      }
    }
    this.validateSaleQuantityAgainstLot();
    this.calcSaleTotal();
  },

  handleAgeUnitChange() {
    const ageUnit = document.getElementById('saleAgeUnit')?.value;
    const ageInput = document.getElementById('saleAgeValue');
    if (!ageInput) return;

    if (ageUnit === 'adulte') {
      ageInput.value = '';
      ageInput.placeholder = '';
      ageInput.disabled = true;
    } else {
      ageInput.disabled = false;
      ageInput.placeholder = '';
    }
    this.calcSaleTotal();
  },

  setSaleEggFormat(format) {
    const input = document.getElementById('saleUnitFormat');
    if (input) input.value = format;

    const btnOeuf = document.getElementById('btnEggFormatOeuf');
    const btnHara = document.getElementById('btnEggFormatHara');
    const btnPlateau = document.getElementById('btnEggFormatPlateau');

    if (btnOeuf) btnOeuf.classList.toggle('active-egg-format-btn', format === 'oeuf-unite');
    if (btnHara) btnHara.classList.toggle('active-egg-format-btn', format === 'hara');
    if (btnPlateau) btnPlateau.classList.toggle('active-egg-format-btn', format === 'plateau');

    const unitLabel = document.getElementById('saleQtyUnitLabel');
    if (unitLabel) {
      if (format === 'hara') {
        unitLabel.textContent = appState.lang === 'ar' ? '(حارات - 4 بيضات)' : '(Haras - 4 œufs)';
      } else if (format === 'plateau') {
        unitLabel.textContent = appState.lang === 'ar' ? '(أطباق - 30 بيضة)' : '(Plateaux - 30 œufs)';
      } else {
        unitLabel.textContent = appState.lang === 'ar' ? '(بالبيضة / حبات)' : '(Par œuf / Unités)';
      }
    }

    // Prix suggéré d'après le cours en Tunisie (0.500 DT l'œuf, 2.000 DT la Hara, 15.000 DT le plateau)
    const priceInput = document.getElementById('saleUnitPrice');
    if (priceInput && (!priceInput.value || ['0.450', '0.45', '0.500', '0.5', '1.800', '1.8', '2.000', '2', '13.500', '13.5', '15.000', '15'].includes(priceInput.value))) {
      const isTND = appState.currency === 'TND';
      if (format === 'hara') {
        priceInput.value = isTND ? '2.000' : '1.00';
      } else if (format === 'plateau') {
        priceInput.value = isTND ? '15.000' : '7.50';
      } else {
        priceInput.value = isTND ? '0.500' : '0.25';
      }
    }

    this.handleFormatChange();
  },

  // Egg Quick Buttons (HARA / Unités / Plateaux)
  quickAddEgg(qty, mode) {
    const qtyInput = document.getElementById('saleQuantity');
    const priceInput = document.getElementById('saleUnitPrice');
    const isTND = appState.currency === 'TND';

    if (mode === 'oeuf') {
      this.setSaleEggFormat('oeuf-unite');
      const cur = parseFloat(qtyInput?.value) || 0;
      if (qtyInput) qtyInput.value = (cur < 20) ? cur + qty : qty;
      if (priceInput && (!priceInput.value || parseFloat(priceInput.value) > 2)) {
        priceInput.value = isTND ? 0.500 : 0.25;
      }
    } else if (mode === 'hara') {
      this.setSaleEggFormat('hara');
      if (qtyInput) qtyInput.value = qty;
      if (priceInput) priceInput.value = isTND ? 2.000 : 1.00;
    } else if (mode === 'plateau') {
      this.setSaleEggFormat('plateau');
      if (qtyInput) qtyInput.value = qty;
      if (priceInput) priceInput.value = isTND ? 15.000 : 7.50;
    }

    this.calcSaleTotal();
  },

  quickResetEgg() {
    const qtyInput = document.getElementById('saleQuantity');
    if (qtyInput) qtyInput.value = 0;
    this.calcSaleTotal();
  },

  prefillSale(type) {
    this.openModal('modalAddSale');
    const typeSelect = document.getElementById('saleProductType');
    const descInput = document.getElementById('saleDescription');
    const priceInput = document.getElementById('saleUnitPrice');
    const qtyInput = document.getElementById('saleQuantity');

    if (type === 'oeufs') {
      typeSelect.value = 'oeufs';
      this.setSaleEggFormat('hara');
      descInput.value = 'Vente œufs frais de ferme';
      qtyInput.value = '';
      qtyInput.placeholder = '';
      priceInput.value = '2.000';
      priceInput.placeholder = '2.000';
    } else if (type === 'poussin') {
      typeSelect.value = 'poussin';
      const formatSelect = document.getElementById('saleUnitFormat');
      if (formatSelect) formatSelect.value = 'unite';
      descInput.value = 'Vente poussins';
      qtyInput.value = '';
      qtyInput.placeholder = '';
      priceInput.value = '';
      priceInput.placeholder = '';
    } else if (type === 'poulet') {
      typeSelect.value = 'poulet';
      const formatSelect = document.getElementById('saleUnitFormat');
      if (formatSelect) formatSelect.value = 'unite';
      descInput.value = 'Vente poulets fermiers';
      qtyInput.value = '';
      qtyInput.placeholder = '';
      priceInput.value = '';
      priceInput.placeholder = '';
    }

    this.handleSaleTypeChange();
  },

  handleSaleTypeChange() {
    const type = document.getElementById('saleProductType').value;
    const format = document.getElementById('saleUnitFormat');
    const price = document.getElementById('saleUnitPrice');
    const unitLabel = document.getElementById('saleQtyUnitLabel');
    const eggFormatGroup = document.getElementById('eggFormatButtonGroup');

    if (type === 'oeufs') {
      if (eggFormatGroup) eggFormatGroup.style.display = 'block';
      let curFmt = format ? format.value : 'hara';
      if (!['hara', 'plateau', 'oeuf-unite'].includes(curFmt)) {
        curFmt = 'hara';
      }
      this.setSaleEggFormat(curFmt);
    } else {
      if (eggFormatGroup) eggFormatGroup.style.display = 'none';
      if (format) format.value = 'unite';

      if (type === 'poussin') {
        const unitPoussin = appState.lang === 'ar' ? '(كتاكيت / بالرأس)' : (appState.lang === 'en' ? '(Chicks / Birds)' : '(Poussins / Sujets)');
        if (unitLabel) unitLabel.textContent = unitPoussin;
      } else if (type === 'poulet') {
        const unitPoulet = appState.lang === 'ar' ? '(دجاج / بالرأس)' : (appState.lang === 'en' ? '(Chickens / Birds)' : '(Poulets / Sujets)');
        if (unitLabel) unitLabel.textContent = unitPoulet;
      } else if (type === 'pintade') {
        const unitPintade = appState.lang === 'ar' ? '(دجاج الوادي / غرغر)' : (appState.lang === 'en' ? '(Guinea Fowls)' : '(Pintades / Sujets)');
        if (unitLabel) unitLabel.textContent = unitPintade;
      } else if (type === 'canard') {
        const unitCanard = appState.lang === 'ar' ? '(بط مسكوفي / بالرأس)' : (appState.lang === 'en' ? '(Muscovy Ducks)' : '(Canards de Barbarie / Sujets)');
        if (unitLabel) unitLabel.textContent = unitCanard;
      } else {
        if (unitLabel) unitLabel.textContent = '(Sujets / Unités)';
      }
    }

    if (price) price.placeholder = '';
    this.calcSaleTotal();
  },

  handleFormatChange() {
    const type = document.getElementById('saleProductType').value;
    const format = document.getElementById('saleUnitFormat').value;
    const price = document.getElementById('saleUnitPrice');

    if (type === 'oeufs' && price) {
      price.placeholder = '';
    }
    this.calcSaleTotal();
  },

  handleSaveSale(e) {
    e.preventDefault();
    const productType = document.getElementById('saleProductType').value;
    const date = document.getElementById('saleDate').value;
    const description = document.getElementById('saleDescription').value.trim();
    const format = document.getElementById('saleUnitFormat').value;
    const quantity = parseFloat(document.getElementById('saleQuantity').value) || 1;
    const unitPrice = parseFloat(document.getElementById('saleUnitPrice').value) || 0;
    const total = parseFloat(document.getElementById('saleTotalCalculated').value) || (quantity * unitPrice);
    const linkedLotId = document.getElementById('saleLotLinked').value;

    const rawAge = parseFloat(document.getElementById('saleAgeValue')?.value);
    const ageUnit = document.getElementById('saleAgeUnit')?.value || '';

    let ageText = '';
    if (!isNaN(rawAge) && rawAge > 0) {
      if (productType === 'poussin') {
        const days = (ageUnit === 'semaines') ? rawAge * 7 : rawAge;
        ageText = `${days} jours`;
      } else if (['poulet', 'pintade', 'canard'].includes(productType)) {
        ageText = (ageUnit === 'adulte') ? 'Adulte (> 6 mois)' : `${rawAge} mois`;
      }
    }

    if (!description || !date) {
      const isAr = appState.lang === 'ar';
      this.showToast(isAr ? 'يرجى إدخال الوصف والتاريخ.' : 'Veuillez renseigner la description et la date.', 'warning');
      return;
    }

    const finalizeSaleSave = () => {
      const newSale = {
        id: 'sale-' + Date.now().toString(36),
        date,
        productType,
        description,
        format,
        quantity,
        unitPrice,
        total,
        linkedLotId,
        ageText
      };

      appState.sales.unshift(newSale);

      // Déduction automatique du stock d'œufs si c'est une vente d'œufs
      if (productType === 'oeufs' && appState.eggStock > 0) {
        let soldEggs = quantity;
        if (format === 'hara') soldEggs = quantity * 4;
        else if (format === 'plateau') soldEggs = quantity * 30;
        appState.eggStock = Math.max(0, appState.eggStock - soldEggs);
      }

      this.saveState();
      this.closeModal('modalAddSale');
      this.renderAll();
      this.showToast(this.t('toast_sale_saved', { amount: this.formatMoney(total) }));
      document.getElementById('formAddSale').reset();
    };

    // Déduction automatique du lot lié
    if (linkedLotId && linkedLotId !== 'none') {
      const lot = appState.animals.find(a => a.id === linkedLotId);
      if (lot && (productType === 'poulet' || productType === 'poussin' || productType === 'pintade' || productType === 'canard' || productType.startsWith('poulet') || productType.startsWith('poussin'))) {
        if (quantity > lot.currentQuantity) {
          const isAr = appState.lang === 'ar';
          this.confirmDialog({
            title: isAr ? 'تنبيه كمية المبيعات' : 'Attention Effectif',
            message: isAr 
              ? `الكمية المباعة (${quantity} طائر) تتجاوز العدد الحالي للدفعة (${lot.currentQuantity}). هل ترغب في المتابعة ؟` 
              : `Attention: La quantité vendue (${quantity} sujets) dépasse l'effectif actuel (${lot.currentQuantity}). Voulez-vous continuer ?`,
            isDanger: true,
            confirmText: isAr ? 'متابعة' : 'Continuer',
            onConfirm: () => {
              lot.currentQuantity = Math.max(0, lot.currentQuantity - quantity);
              finalizeSaleSave();
            }
          });
          return;
        }
        lot.currentQuantity = Math.max(0, lot.currentQuantity - quantity);
      }
    }

    finalizeSaleSave();
  },

  deleteSale(saleId) {
    const isAr = appState.lang === 'ar';
    this.confirmDialog({
      title: isAr ? 'حذف البيع' : 'Supprimer la vente',
      message: isAr ? 'هل تريد بالتأكيد حذف هذه العملية ؟' : 'Supprimer cette vente ?',
      isDanger: true,
      confirmText: isAr ? 'حذف' : 'Supprimer',
      onConfirm: () => {
        if (window.appAuth && typeof appAuth.addDeletedId === 'function') {
          appAuth.addDeletedId(saleId);
        }
        appState.sales = appState.sales.filter(s => s.id !== saleId);
        this.saveState();
        this.renderAll();
        this.showToast(this.t('toast_sale_deleted'));
      }
    });
  },

  calcSaleEstimatedMargin(sale) {
    const lang = appState.lang || 'fr';
    const marginWord = lang === 'ar' ? 'هامش' : (lang === 'en' ? 'margin' : 'marge');
    const estWord = lang === 'ar' ? 'تقديري' : (lang === 'en' ? 'est.' : 'est.');
    // Determine net profitability percentage
    if (!sale.total || sale.total <= 0) return `+0% ${marginWord}`;
    
    // If linked to a specific lot, compute real feed cost ratio
    if (sale.linkedLotId && sale.linkedLotId !== 'none') {
      const lotExp = appState.expenses
        .filter(e => e.linkedLotId === sale.linkedLotId)
        .reduce((sum, e) => sum + (Number(e.total) || 0), 0);
      const lotSales = appState.sales
        .filter(s => s.linkedLotId === sale.linkedLotId)
        .reduce((sum, s) => sum + (Number(s.total) || 0), 0);
      
      if (lotSales > 0 && lotExp > 0) {
        const net = lotSales - lotExp;
        const pct = Math.round((net / lotSales) * 100);
        return `${pct >= 0 ? '+' : ''}${pct}% ${marginWord}`;
      }
    }

    // Default industry average margin estimation
    const defaultMargins = {
      oeufs: 45,
      'poulet-croissance': 38,
      poulet: 38,
      'poussin-1j': 55,
      'poussin-demarre': 48,
      poussin: 50,
      'poulet-adulte': 42,
      pintade: 45,
      canard: 48
    };
    const m = defaultMargins[sale.productType] || 40;
    return `+${m}% ${estWord}`;
  },

  // ==========================================
  // SMART FINANCIAL CALCULATIONS & MATRIX
  // ==========================================
  renderSmartCalculations() {
    const tbody = document.getElementById('smartProfitTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Calculate production matrix per category
    const categories = ['poulet-croissance', 'oeufs', 'poussin', 'poulet-adulte', 'pintade', 'canard'];
    const catLabels = {
      'poulet-croissance': this.t('matrix_cat_poulet_croissance') || '🍗 Poulets (1 à 6 mois)',
      'oeufs': this.t('matrix_cat_oeufs') || '🥚 Production d\'Œufs (Haras/Plateaux)',
      'poussin': this.t('matrix_cat_poussin') || '🐣 Poussins (1j & démarrés)',
      'poulet-adulte': this.t('matrix_cat_poulet_adulte') || '🐓 Coqs Adultes',
      'pintade': this.t('matrix_cat_pintade') || '🪶 Pintades (Chair & Repro)',
      'canard': this.t('matrix_cat_canard') || '🦆 Canards de Barbarie (Chair & Élevage)'
    };

    categories.forEach(cat => {
      // Find matching sales
      const catSales = appState.sales
        .filter(s => {
          if (cat === 'poulet-croissance') return s.productType === 'poulet-croissance' || s.productType === 'poulet';
          if (cat === 'oeufs') return s.productType === 'oeufs';
          if (cat === 'poussin') return s.productType === 'poussin-1j' || s.productType === 'poussin-demarre' || s.productType === 'poussin';
          if (cat === 'poulet-adulte') return s.productType === 'poulet-adulte';
          if (cat === 'pintade') return s.productType === 'pintade';
          if (cat === 'canard') return s.productType === 'canard';
          return false;
        })
        .reduce((sum, s) => sum + (Number(s.total) || 0), 0);

      // Find matching animal lots for this category
      const matchingLots = appState.animals
        .filter(a => {
          if (cat === 'oeufs' && a.species === 'pondeuse') return true;
          if (cat === 'poulet-croissance' && a.species === 'poulet') return true;
          if (cat === 'poussin' && a.species === 'poussin') return true;
          if (cat === 'poulet-adulte' && a.species === 'adulte') return true;
          if (cat === 'pintade' && a.species === 'pintade') return true;
          if (cat === 'canard' && (a.species === 'canard' || a.species === 'canard_barbarie')) return true;
          return false;
        })
        .map(a => a.id);

      // Feed cost for these lots
      const feedCost = appState.expenses
        .filter(e => e.category === 'nourriture' && matchingLots.includes(e.linkedLotId))
        .reduce((sum, e) => sum + (Number(e.total) || 0), 0);

      // Other healthcare / vet costs
      const otherCost = appState.expenses
        .filter(e => e.category !== 'nourriture' && matchingLots.includes(e.linkedLotId))
        .reduce((sum, e) => sum + (Number(e.total) || 0), 0);

      const netProfit = catSales - feedCost - otherCost;
      const marginPct = catSales > 0 ? ((netProfit / catSales) * 100).toFixed(1) : '0';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${catLabels[cat]}</strong></td>
        <td class="text-emerald bold">${this.formatMoney(catSales)}</td>
        <td class="text-warning">${this.formatMoney(feedCost)}</td>
        <td class="text-violet">${this.formatMoney(otherCost)}</td>
        <td class="${netProfit >= 0 ? 'text-emerald' : 'text-rose'} bold">${(netProfit >= 0 ? '+' : '') + this.formatMoney(netProfit)}</td>
        <td>
          <span class="badge-pill ${Number(marginPct) >= 0 ? 'text-emerald' : 'text-rose'}">
            ${Number(marginPct) >= 0 ? '+' : ''}${marginPct}%
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Update Unit Cost metrics
    this.updateUnitCostCards();
  },

  updateUnitCostCards() {
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    const zeroHint = isAr ? 'الربح الصافي: 0% (في انتظار تسجيل بيع)' : (isEn ? 'Net margin: 0% (Awaiting sales)' : 'Marge nette: 0% (En attente de vente)');
    const marginLbl = isAr ? 'الربح الصافي :' : (isEn ? 'Net margin:' : 'Marge nette :');

    // 1. Cost per Egg (Coût de revient par Œuf)
    const layingLots = (appState.animals || []).filter(a => a.species === 'pondeuse');
    const layingLotIds = layingLots.map(a => a.id);
    const eggFeedCost = (appState.expenses || [])
      .filter(e => layingLotIds.includes(e.linkedLotId) || e.linkedLotId === 'lot-pondeuses')
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);

    const totalEggsCollected = (appState.eggCollections || appState.eggHarvests || [])
      .reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
    const currentEggStock = Number(appState.eggStock) || 0;
    const eggSales = (appState.sales || []).filter(s => s.productType === 'oeufs');
    const totalEggsSold = eggSales.reduce((sum, s) => {
      let factor = 1;
      if (s.format === 'plateau') factor = 30;
      else if (s.format === 'hara') factor = 4;
      return sum + ((Number(s.quantity) || 0) * factor);
    }, 0);
    const totalEggsRevenue = eggSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

    const eggPriceEl = document.getElementById('costPerEgg');
    const eggMarginEl = document.getElementById('marginPerEgg');

    if (totalEggsSold > 0 && totalEggsRevenue > 0) {
      // Une vente d'œufs a eu lieu : calcul du coût unitaire réel et de la marge nette
      const totalEggsBase = Math.max(totalEggsSold, totalEggsCollected, currentEggStock);
      const costEgg = eggFeedCost > 0 ? (eggFeedCost / totalEggsBase) : 0;
      const netProfit = totalEggsRevenue - (costEgg * totalEggsSold);
      const marginPct = ((netProfit / totalEggsRevenue) * 100).toFixed(1);

      if (eggPriceEl) eggPriceEl.textContent = this.formatMoney(costEgg);
      if (eggMarginEl) {
        const sign = Number(marginPct) >= 0 ? '+' : '';
        eggMarginEl.textContent = `${marginLbl} ${sign}${marginPct}% (${totalEggsSold} ${isAr ? 'بيضة مباعة' : (isEn ? 'eggs sold' : 'œufs vendus')})`;
        eggMarginEl.className = Number(marginPct) >= 0 ? 'text-emerald bold' : 'text-rose bold';
      }
    } else {
      // 0 vente enregistrée : compteur strictement à zéro
      if (eggPriceEl) eggPriceEl.textContent = this.formatMoney(0);
      if (eggMarginEl) {
        eggMarginEl.textContent = zeroHint;
        eggMarginEl.className = 'text-muted';
      }
    }

    // 2. Cost per Chicken (Coût de revient par Poulet)
    const chickenLots = (appState.animals || []).filter(a => a.species === 'poulet' || a.species === 'poulet-croissance');
    const chickenLotIds = chickenLots.map(a => a.id);
    const chickenPurchaseCost = chickenLots.reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0);
    const chickenDirectExpenses = (appState.expenses || [])
      .filter(e => chickenLotIds.includes(e.linkedLotId))
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);
    const totalChickenCost = chickenPurchaseCost + chickenDirectExpenses;

    const livingChickens = chickenLots.reduce((sum, a) => sum + (Number(a.currentQuantity) || 0), 0);
    const chickenSales = (appState.sales || []).filter(s => s.productType === 'poulet' || s.productType === 'poulet-croissance');
    const chickensSold = chickenSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    const chickenRevenue = chickenSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalChickensCount = livingChickens + chickensSold;

    const chickenPriceEl = document.getElementById('costPerChicken');
    const chickenMarginEl = document.getElementById('marginPerChicken');

    if (chickensSold > 0 && chickenRevenue > 0) {
      const costChicken = totalChickenCost > 0 ? (totalChickenCost / Math.max(totalChickensCount, chickensSold)) : 0;
      const netProfit = chickenRevenue - (costChicken * chickensSold);
      const marginPct = ((netProfit / chickenRevenue) * 100).toFixed(1);

      if (chickenPriceEl) chickenPriceEl.textContent = this.formatMoney(costChicken);
      if (chickenMarginEl) {
        const sign = Number(marginPct) >= 0 ? '+' : '';
        chickenMarginEl.textContent = `${marginLbl} ${sign}${marginPct}% (${chickensSold} ${isAr ? 'طائر مباع' : (isEn ? 'birds sold' : 'sujets vendus')})`;
        chickenMarginEl.className = Number(marginPct) >= 0 ? 'text-emerald bold' : 'text-rose bold';
      }
    } else {
      // 0 vente enregistrée : compteur strictement à zéro
      if (chickenPriceEl) chickenPriceEl.textContent = this.formatMoney(0);
      if (chickenMarginEl) {
        chickenMarginEl.textContent = zeroHint;
        chickenMarginEl.className = 'text-muted';
      }
    }

    // 3. Cost per Chick (Coût de revient par Poussin)
    const chickLots = (appState.animals || []).filter(a => a.species === 'poussin');
    const chickLotIds = chickLots.map(a => a.id);
    const chickPurchaseCost = chickLots.reduce((sum, a) => sum + (Number(a.purchaseCost) || 0), 0);
    const chickDirectExpenses = (appState.expenses || [])
      .filter(e => chickLotIds.includes(e.linkedLotId))
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);
    const totalChickCost = chickPurchaseCost + chickDirectExpenses;

    const livingChicks = chickLots.reduce((sum, a) => sum + (Number(a.currentQuantity) || 0), 0);
    const chickSales = (appState.sales || []).filter(s => s.productType === 'poussin' || s.productType === 'poussin-1j' || s.productType === 'poussin-demarre');
    const chicksSold = chickSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    const chickRevenue = chickSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalChicksCount = livingChicks + chicksSold;

    const chicksPriceEl = document.getElementById('costPerChicks');
    const chicksMarginEl = document.getElementById('marginPerChicks');

    if (chicksSold > 0 && chickRevenue > 0) {
      const costChick = totalChickCost > 0 ? (totalChickCost / Math.max(totalChicksCount, chicksSold)) : 0;
      const netProfit = chickRevenue - (costChick * chicksSold);
      const marginPct = ((netProfit / chickRevenue) * 100).toFixed(1);

      if (chicksPriceEl) chicksPriceEl.textContent = this.formatMoney(costChick);
      if (chicksMarginEl) {
        const sign = Number(marginPct) >= 0 ? '+' : '';
        chicksMarginEl.textContent = `${marginLbl} ${sign}${marginPct}% (${chicksSold} ${isAr ? 'كتكوت مباع' : (isEn ? 'chicks sold' : 'poussins vendus')})`;
        chicksMarginEl.className = Number(marginPct) >= 0 ? 'text-emerald bold' : 'text-rose bold';
      }
    } else {
      // 0 vente enregistrée : compteur strictement à zéro
      if (chicksPriceEl) chicksPriceEl.textContent = this.formatMoney(0);
      if (chicksMarginEl) {
        chicksMarginEl.textContent = zeroHint;
        chicksMarginEl.className = 'text-muted';
      }
    }
  },

  // ==========================================
  // INCUBATOR & HATCHING MODULE
  // ==========================================
  renderIncubator() {
    const grid = document.getElementById('incubatorBatchesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (appState.incubatorBatches.length === 0) {
      grid.innerHTML = `
        <div class="empty-state-card" style="grid-column: 1/-1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 2px dashed var(--border-subtle);">
          <div style="font-size: 3rem; margin-bottom: 0.8rem;">🥚</div>
          <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem;">${this.t('empty_incubator_title')}</h3>
          <p class="text-muted" style="max-width: 480px; margin: 0 auto 1.5rem; font-size: 0.9rem;">
            ${this.t('empty_incubator_desc')}
          </p>
          <button class="btn btn-amber bold" onclick="app.openModal('modalAddBatch')">
            🐣 ${this.t('btn_put_in_incubator')}
          </button>
        </div>
      `;
      return;
    }

    const now = this.getTodayDate();

    appState.incubatorBatches.forEach(batch => {
      const start = new Date(batch.startDate);
      const hatch = new Date(batch.hatchDate);
      const totalDays = batch.speciesDurationDays || 21;

      // Elapsed days
      const daysElapsed = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, Math.ceil((hatch - now) / (1000 * 60 * 60 * 24)));
      const progressPct = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

      // Determine current critical stage description
      const stageInfo = this.getIncubationCurrentStage(daysElapsed, totalDays);

      const card = document.createElement('div');
      card.className = 'batch-card';
      card.innerHTML = `
        <div class="batch-header">
          <div class="batch-icon-title">
            <span class="icon">🥚</span>
            <div>
              <h3 class="batch-name">${batch.name}</h3>
              <p class="batch-species">${batch.breed} &bull; ${batch.eggsCount} (${batch.eggSpecies.toUpperCase()})</p>
            </div>
          </div>
          <span class="badge-pill">${daysElapsed >= totalDays ? '🐣 ' + (this.t('stage_header_hatch') || 'Éclosion') : 'J ' + daysElapsed + '/' + totalDays}</span>
        </div>

        <div class="batch-progress-wrapper">
          <div class="batch-progress-header">
            <span>${this.t('incubation_banner_default_title') || 'Progression Incubation'}</span>
            <span class="text-amber bold">${progressPct}%</span>
          </div>
          <div class="batch-progress-bar">
            <div class="batch-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
        </div>

        <div class="batch-countdown-box">
          <div>
            <span class="countdown-label">${this.t('table_col_stage')} :</span>
            <p class="bold" style="font-size: 0.9rem;">${stageInfo.title}</p>
            <small class="text-muted">${stageInfo.desc}</small>
          </div>
          <div style="text-align: right;">
            <span class="countdown-label">${this.t('countdown_days_remaining')}</span>
            <p class="countdown-value">${daysRemaining === 0 ? this.t('countdown_ready') : daysRemaining + ' j'}</p>
            <small class="text-muted">${this.formatDateFR(batch.hatchDate)}</small>
          </div>
        </div>

        <div class="batch-parameters-row" style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-secondary);">
          <span>🌡️ <strong>${batch.temp}°C</strong></span>
          <span>💧 <strong>${batch.humidity}%</strong></span>
          <span>📅 <strong>${this.formatDateFR(batch.startDate)}</strong></span>
        </div>

        <div class="batch-card-actions" style="display: flex; gap: 0.5rem; margin-top: auto;">
          <button class="btn btn-sm btn-amber flex-1" onclick="app.convertBatchToFlock('${batch.id}')">
            ${this.t('btn_declare_hatched_action')}
          </button>
          <button class="btn btn-sm btn-danger-outline" onclick="app.deleteIncubatorBatch('${batch.id}')">
            🗑️
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
  },

  getIncubationCurrentStage(elapsed, total) {
    if (elapsed === 0) {
      return { title: this.t('stage_header_start'), desc: 'T° 37.7°C, Hum 45%' };
    }
    if (elapsed < 7) {
      return { title: this.t('stage_header_start'), desc: '2x/jour' };
    }
    if (elapsed === 7) {
      return { title: this.t('stage_header_candling1'), desc: 'Mirage 1' };
    }
    if (elapsed < 14) {
      return { title: this.t('stage_header_development'), desc: 'Embryo' };
    }
    if (elapsed === 14) {
      return { title: this.t('stage_header_candling2'), desc: 'Mirage 2' };
    }
    if (elapsed >= 18 && elapsed < total) {
      return { title: this.t('stage_header_lockdown'), desc: 'Hum 65-70%' };
    }
    return { title: this.t('stage_header_hatch'), desc: '24h' };
  },

  handleEggSpeciesChange() {
    const select = document.getElementById('batchEggType');
    const opt = select.options[select.selectedIndex];
    this.calcHatchPreview();
  },

  handleIncubationMethodChange() {
    const method = document.getElementById('batchMethod')?.value;
    const notes = document.getElementById('batchNotes');
    if (method === 'poule') {
      if (notes && !notes.value) notes.value = 'Incubation naturelle (21 jours +/- 2j)';
    } else {
      if (notes && notes.value.includes('naturelle')) notes.value = '';
    }
    this.calcHatchPreview();
  },

  calcHatchPreview() {
    const startDateVal = document.getElementById('batchStartDate')?.value;
    const speciesSelect = document.getElementById('batchEggType');
    const previewEl = document.getElementById('batchHatchPreview');
    const method = document.getElementById('batchMethod')?.value || 'machine';
    if (!startDateVal || !speciesSelect || !previewEl) return;

    const selectedOpt = speciesSelect.options[speciesSelect.selectedIndex];
    const durationDays = parseInt(selectedOpt.getAttribute('data-days'), 10) || 21;

    const start = new Date(startDateVal);
    const hatch = new Date(start);
    hatch.setDate(hatch.getDate() + durationDays);

    const winMin = new Date(hatch); winMin.setDate(winMin.getDate() - 2);
    const winMax = new Date(hatch); winMax.setDate(winMax.getDate() + 2);

    const pad = n => String(n).padStart(2, '0');
    const minStr = `${pad(winMin.getDate())}/${pad(winMin.getMonth() + 1)}`;
    const maxStr = `${pad(winMax.getDate())}/${pad(winMax.getMonth() + 1)}`;
    const hatchStr = `${pad(hatch.getDate())}/${pad(hatch.getMonth() + 1)}/${hatch.getFullYear()}`;

    const lang = appState.lang || 'fr';
    let windowText = '';
    if (lang === 'ar') {
      windowText = `${hatchStr} (النافذة: من ${minStr} إلى ${maxStr} - ${durationDays} يوماً)`;
    } else if (lang === 'en') {
      windowText = `${hatchStr} (Window: ${minStr} to ${maxStr} - ${durationDays}d)`;
    } else {
      windowText = `${hatchStr} (Fenêtre : du ${minStr} au ${maxStr} - ${durationDays}j)`;
    }
    previewEl.textContent = windowText;
  },

  handleSaveIncubationBatch(e) {
    e.preventDefault();
    const method = document.getElementById('batchMethod')?.value || 'machine';
    const speciesSelect = document.getElementById('batchEggType');
    const eggSpecies = speciesSelect.value;
    const durationDays = parseInt(speciesSelect.options[speciesSelect.selectedIndex].getAttribute('data-days'), 10) || 21;
    const breed = document.getElementById('batchBreed').value.trim();
    const name = document.getElementById('batchName').value.trim();
    const eggsCount = parseInt(document.getElementById('batchEggsCount').value, 10);
    const startDate = document.getElementById('batchStartDate').value;
    const temp = 37.7;
    const humidity = 48;
    const notes = document.getElementById('batchNotes')?.value.trim() || '';

    if (!breed || !name || !eggsCount || !startDate) {
      const isAr = appState.lang === 'ar';
      this.showToast(isAr ? 'يرجى ملء جميع الحقول الإلزامية.' : 'Veuillez remplir les informations obligatoires.', 'warning');
      return;
    }

    const start = new Date(startDate);
    const hatch = new Date(start);
    hatch.setDate(hatch.getDate() + durationDays);

    const newBatch = {
      id: 'batch-' + Date.now().toString(36),
      method, // 'poule' ou 'machine'
      eggSpecies,
      speciesDurationDays: durationDays,
      breed,
      name,
      eggsCount,
      startDate,
      hatchDate: hatch.toISOString().split('T')[0],
      temp: method === 'poule' ? 38.0 : temp,
      humidity: method === 'poule' ? 55 : humidity,
      notes,
      status: 'incubating'
    };

    appState.incubatorBatches.unshift(newBatch);

    // Déduction automatique du stock d'œufs de la ferme si disponible
    if (appState.eggStock && appState.eggStock > 0) {
      const deducted = Math.min(appState.eggStock, eggsCount);
      appState.eggStock = Math.max(0, appState.eggStock - deducted);
    }

    this.saveState();

    // Planifier la notification mobile native pour l'éclosion
    if (window.MobileBridge) {
      window.MobileBridge.scheduleIncubatorNotification({
        id: newBatch.id + '-hatch',
        title: `🐣 Éclosion : ${newBatch.name}`,
        body: `Les ${newBatch.eggsCount} œufs de ${newBatch.breed} arrivent à terme aujourd'hui !`,
        scheduleDate: newBatch.hatchDate + 'T08:00:00'
      });
    }

    this.closeModal('modalAddBatch');
    this.renderAll();
    this.showToast(this.t('toast_batch_saved', { name, days: durationDays }));
    document.getElementById('formAddBatch').reset();
  },

  // Ouvrir la notification interactive d'éclosion
  triggerHatchNotification(batchId) {
    const batch = appState.incubatorBatches.find(b => b.id === batchId);
    if (!batch) return;

    document.getElementById('hatchPromptBatchId').value = batch.id;
    document.getElementById('hatchPromptBatchTitle').textContent = `${this.t('hatch_alert_title')} : ${batch.name} (${batch.breed})`;
    const methodTxt = batch.method === 'poule' ? this.t('opt_method_hen') : this.t('opt_method_machine');
    document.getElementById('hatchPromptBatchDesc').textContent = `${this.t('lbl_eggs_count')}: ${batch.eggsCount} (${methodTxt}).`;
    
    // Proposer une estimation par défaut (80% des œufs)
    document.getElementById('hatchLiveCount').value = Math.max(1, Math.round(batch.eggsCount * 0.8));
    this.openModal('modalHatchPrompt');
  },

  // Valider la sortie de l'œuf : Ajoute AUTOMATIQUEMENT au cheptel et aux poulets !
  handleConfirmHatch(e) {
    e.preventDefault();
    const batchId = document.getElementById('hatchPromptBatchId').value;
    const liveCount = parseInt(document.getElementById('hatchLiveCount').value, 10);
    const choice = document.getElementById('hatchTargetFlock').value;

    const batch = appState.incubatorBatches.find(b => b.id === batchId);
    if (!batch) return;

    if (isNaN(liveCount) || liveCount < 0) {
      const isAr = appState.lang === 'ar';
      this.showToast(isAr ? 'يرجى إدخال عدد صحيح موجب من الفراخ.' : 'Veuillez entrer un nombre positif de poussins.', 'warning');
      return;
    }

    if (liveCount > 0) {
      if (choice === 'first_chick') {
        // Chercher une bande de poussins ou poulets existante
        const existingFlock = appState.animals.find(a => a.species === 'poussin' || a.species === 'poulet');
        if (existingFlock) {
          existingFlock.currentQuantity += liveCount;
          existingFlock.initialQuantity += liveCount;
          const hatchDate = batch.hatchDate || this.getTodayStr();
          existingFlock.notes = (existingFlock.notes || '') + ` [Ajout +${liveCount} poussins nés le ${this.formatDateFR(hatchDate)} de ${batch.name}]`;
        } else {
          this.createNewFlockFromHatch(batch, liveCount);
        }
      } else {
        this.createNewFlockFromHatch(batch, liveCount);
      }
    }

    // Retirer ou archiver la couvée de l'incubateur
    appState.incubatorBatches = appState.incubatorBatches.filter(b => b.id !== batchId);

    this.saveState();
    this.closeModal('modalHatchPrompt');
    this.renderAll();
    
    this.showToast(this.t('toast_hatch_confirmed', { n: liveCount }));
  },

  createNewFlockFromHatch(batch, liveCount) {
    const methodTag = batch.method === 'poule' ? 'Poule' : 'Machine';
    const hatchDate = batch.hatchDate || this.getTodayStr();
    const newFlock = {
      id: 'lot-chick-' + Date.now().toString(36),
      species: batch.eggSpecies === 'poule' ? 'poussin' : (batch.eggSpecies === 'pintade' ? 'pintade' : ((batch.eggSpecies === 'canard' || batch.eggSpecies === 'canard_barbarie') ? 'canard' : 'autre')),
      breed: batch.breed || 'Beldi',
      name: `Génération Éclose (${batch.name} - ${methodTag})`,
      initialQuantity: liveCount,
      currentQuantity: liveCount,
      mortality: 0,
      birthDate: hatchDate,
      costPerHead: batch.method === 'poule' ? 0.20 : 0.40,
      stage: 'Démarrage',
      notes: `Éclos le ${this.formatDateFR(hatchDate)} (${liveCount} poussins sortis de ${batch.eggsCount} œufs mis à couver via ${methodTag}).`
    };
    appState.animals.unshift(newFlock);
  },

  convertBatchToFlock(batchId) {
    this.triggerHatchNotification(batchId);
  },

  deleteIncubatorBatch(batchId) {
    const isAr = appState.lang === 'ar';
    this.confirmDialog({
      title: isAr ? 'حذف دفعة الحضانة' : 'Supprimer le lot d\'incubation',
      message: isAr ? 'هل تريد بالتأكيد حذف دفعة الحضانة هذه ؟' : 'Voulez-vous supprimer ce lot d\'incubation ?',
      isDanger: true,
      confirmText: isAr ? 'حذف' : 'Supprimer',
      onConfirm: () => {
        if (window.appAuth && typeof appAuth.addDeletedId === 'function') {
          appAuth.addDeletedId(batchId);
        }
        appState.incubatorBatches = appState.incubatorBatches.filter(b => b.id !== batchId);
        this.saveState();
        this.renderAll();
        this.showToast(this.t('toast_batch_deleted'));
      }
    });
  },

  // ==========================================
  // CALENDAR NAVIGATION & SORTING METHODS
  // ==========================================
  prevMonth() {
    if (!appState.calendarDate || !(appState.calendarDate instanceof Date) || isNaN(appState.calendarDate.getTime())) {
      appState.calendarDate = new Date();
    }
    const curYear = appState.calendarDate.getFullYear();
    const curMonth = appState.calendarDate.getMonth();
    appState.calendarDate = new Date(curYear, curMonth - 1, 1);
    this.renderCalendar();
  },

  nextMonth() {
    if (!appState.calendarDate || !(appState.calendarDate instanceof Date) || isNaN(appState.calendarDate.getTime())) {
      appState.calendarDate = new Date();
    }
    const curYear = appState.calendarDate.getFullYear();
    const curMonth = appState.calendarDate.getMonth();
    appState.calendarDate = new Date(curYear, curMonth + 1, 1);
    this.renderCalendar();
  },

  toggleExpenseSort(field) {
    if (appState.expenseSortField === field) {
      appState.expenseSortOrder = appState.expenseSortOrder === 'desc' ? 'asc' : 'desc';
    } else {
      appState.expenseSortField = field;
      appState.expenseSortOrder = 'desc';
    }
    this.renderExpenses();
  },

  toggleSaleSort(field) {
    if (appState.saleSortField === field) {
      appState.saleSortOrder = appState.saleSortOrder === 'desc' ? 'asc' : 'desc';
    } else {
      appState.saleSortField = field;
      appState.saleSortOrder = 'desc';
    }
    this.renderSales();
  },

  getTranslatedExpenseTitle(title) {
    if (!title) return '';
    const lang = appState.lang || 'fr';

    if (lang === 'ar') {
      let t = title;
      t = t.replace(/Achat aliment\s*:\s*/gi, 'شراء علف : ');
      t = t.replace(/Achat aliment\s*\/\s*Stock r[eé]serve/gi, 'شراء علف / مخزون احتياطي بالمستودع');
      t = t.replace(/Achat aliment/gi, 'شراء علف');
      t = t.replace(/Stock r[eé]serve/gi, 'مخزون المستودع');
      t = t.replace(/(\d+)\s*Sacs?\s*Aliment Croissance\s*\/\s*Finition\s*\(50kg\)/gi, '$1 أكياس علف نمو وتسمين (50 كغ)');
      t = t.replace(/sacs?\s*d['\s]?alimentation/gi, 'أكياس علف');
      t = t.replace(/sac\s*d['\s]?aliment/gi, 'كيس علف');
      t = t.replace(/Aliment Pondeuse Granul[eé]s Sp[eé]cial Ponte/gi, 'علف دجاج بياض حبيبات (خاص بالإنتاج)');
      t = t.replace(/Aliment D[eé]marrage Poussins\s*\(Miettes 1er [AÂ]ge\)/gi, 'علف بادي كتاكيت (مفتت مرحلة أولى)');
      t = t.replace(/Vaccin Newcastle\s*\+\s*Gumboro\s*\(1000 doses\)/gi, 'تلقيح نيوكاسل + غومبورو (1000 جرعة)');
      t = t.replace(/Facture [EÉ]lectricit[eé] STEG Exploitation/gi, 'فاتورة كهرباء الستاغ (STEG) للمزرعة');
      t = t.replace(/Facture Eau SONEDE Abreuvoirs\s*&\s*Nettoyage/gi, 'فاتورة مياه الصوناد (SONEDE) للمزرعة');
      t = t.replace(/Salaire Ouvrier Agricole\s*\(Mois de Septembre\)/gi, 'أجر عامل فلاحي (شهر سبتمبر)');
      t = t.replace(/Liti[eè]re de copeaux\s*&\s*Chauffage [eé]leveuse poussins/gi, 'فرشة نشارة وتدفئة حاضنة الكتاكيت');
      t = t.replace(/(\d+(?:\.\d+)?)\s*kg/gi, '$1 كغ');
      return t;
    }

    if (lang === 'en') {
      let t = title;
      t = t.replace(/Achat aliment\s*:\s*/gi, 'Feed Purchase: ');
      t = t.replace(/Achat aliment\s*\/\s*Stock r[eé]serve/gi, 'Feed Purchase / Reserve Stock');
      t = t.replace(/Achat aliment/gi, 'Feed Purchase');
      t = t.replace(/sacs?\s*d['\s]?alimentation/gi, 'feed bags');
      t = t.replace(/Aliment Pondeuse Granul[eé]s Sp[eé]cial Ponte/gi, 'Laying Pellet Feed Special Production');
      t = t.replace(/Aliment D[eé]marrage Poussins/gi, 'Chick Starter Crumble');
      t = t.replace(/Facture [EÉ]lectricit[eé] STEG Exploitation/gi, 'STEG Electricity Bill');
      t = t.replace(/Facture Eau SONEDE Abreuvoirs\s*&\s*Nettoyage/gi, 'SONEDE Water Bill');
      t = t.replace(/Salaire Ouvrier Agricole/gi, 'Farm Worker Salary');
      t = t.replace(/Liti[eè]re de copeaux\s*&\s*Chauffage/gi, 'Wood Shavings Bedding & Brooder Heating');
      return t;
    }

    let t = title;
    t = t.replace(/شراء علف\s*:\s*/gi, 'Achat aliment : ');
    t = t.replace(/شراء علف\s*\/\s*مخزون احتياطي بالمستودع/gi, 'Achat aliment / Stock réserve');
    t = t.replace(/أكياس علف/gi, 'Sacs d\'alimentation');
    t = t.replace(/(\d+(?:\.\d+)?)\s*كغ/gi, '$1 kg');
    return t;
  },

  getTranslatedSaleDescription(desc) {
    if (!desc) return '';
    const lang = appState.lang || 'fr';

    if (lang === 'ar') {
      let d = desc;
      d = d.replace(/Vente 50 Plateaux d['’]œufs frais\s*\(March[eé] de Gros\)/gi, 'بيع 50 طبق بيض طازج (سوق الجملة)');
      d = d.replace(/Vente 35 Poulets fermiers pr[eê]ts [aà] l['’]abattage\s*\(3\.5 mois\)/gi, 'بيع 35 دجاجة لحم بلدية جاهزة للذبح (3.5 أشهر)');
      d = d.replace(/Vente 80 Poussins d[eé]marr[eé]s 21 jours vaccin[eé]s/gi, 'بيع 80 كتكوت بادي 21 يوماً ملقحة');
      d = d.replace(/Vente 6 Coqs adultes reproducteurs\s*\(>\s*6 mois\s*-\s*par t[eê]te\)/gi, 'بيع 6 ديوك بالغة أمهات (> 6 أشهر - بالرأس)');
      d = d.replace(/Vente 6 Poulets adultes reproducteurs\s*\(>\s*6 mois\s*-\s*par t[eê]te\)/gi, 'بيع 6 ديوك بالغة أمهات (> 6 أشهر - بالرأس)');
      d = d.replace(/Vente\s+/gi, 'بيع ');
      d = d.replace(/Plateau(?:x)? d['’]œufs/gi, 'طبق بيض');
      d = d.replace(/par t[eê]te/gi, 'بالرأس');
      return d;
    }

    if (lang === 'en') {
      let d = desc;
      d = d.replace(/Vente 50 Plateaux d['’]œufs frais\s*\(March[eé] de Gros\)/gi, 'Sale of 50 fresh egg trays (Wholesale)');
      d = d.replace(/Vente 35 Poulets fermiers/gi, 'Sale of 35 farm broilers');
      d = d.replace(/Vente 80 Poussins d[eé]marr[eé]s/gi, 'Sale of 80 started chicks');
      d = d.replace(/Vente 6 Coqs adultes/gi, 'Sale of 6 adult roosters');
      d = d.replace(/Vente\s+/gi, 'Sale of ');
      return d;
    }

    return desc;
  },

  getTranslatedLotName(name) {
    if (!name) return '';
    const isArabic = (appState.lang === 'ar' || document.documentElement.getAttribute('dir') === 'rtl');
    const lang = isArabic ? 'ar' : (appState.lang || 'fr');
    if (lang === 'ar') {
      let n = name;
      n = n.replace(/Bande Poussins 1J Couveuse/gi, 'دفعة كتاكيت عمر 1 يوم فقاسة');
      n = n.replace(/Bande Poussins D[eé]marr[eé]s #01/gi, 'دفعة كتاكيت بادئة #01');
      n = n.replace(/Bande Poulets Fermiers Croissance/gi, 'دفعة دجاج بلدي مرحلة النمو');
      n = n.replace(/Bande Pondeuses #03/gi, 'دفعة دجاج بياض #03');
      n = n.replace(/Bande Coqs Adultes Reproducteurs/gi, 'دفعة ديوك بالغة أمهات');
      n = n.replace(/Bande Poulets Adultes Reproducteurs/gi, 'دفعة ديوك بالغة أمهات');
      n = n.replace(/Bande\s+/gi, 'دفعة ');
      return n;
    }
    return name;
  },

  getTranslatedAgeText(ageText) {
    if (!ageText) return '';
    const lang = appState.lang || 'fr';
    if (lang === 'ar') {
      let t = ageText;
      t = t.replace(/Adulte\s*\(>\s*6\s*mois\)/gi, 'بالغ (> 6 أشهر)');
      t = t.replace(/Adulte/gi, 'بالغ');
      t = t.replace(/(\d+)\s*mois/gi, '$1 أشهر');
      t = t.replace(/(\d+)\s*jours?/gi, '$1 أيام');
      t = t.replace(/(\d+)\s*semaines?/gi, '$1 أسابيع');
      return t;
    }
    if (lang === 'en') {
      let t = ageText;
      t = t.replace(/Adulte\s*\(>\s*6\s*mois\)/gi, 'Adult (> 6 months)');
      t = t.replace(/Adulte/gi, 'Adult');
      t = t.replace(/(\d+)\s*mois/gi, '$1 months');
      t = t.replace(/(\d+)\s*jours?/gi, '$1 days');
      t = t.replace(/(\d+)\s*semaines?/gi, '$1 weeks');
      return t;
    }
    return ageText;
  },

  // ==========================================
  // CALENDAR & GENERATIONS LIFECYCLE
  // ==========================================
  renderCalendar() {
    this.renderGenerationsTable();
    this.renderMonthlyCalendarGrid();
  },

  getTranslatedBreed(breed) {
    if (!breed || breed === '-') return '-';
    const isArabic = (appState.lang === 'ar' || document.documentElement.getAttribute('dir') === 'rtl');
    if (isArabic) {
      let b = breed;
      b = b.replace(/Fermier/gi, 'بلدي');
      b = b.replace(/Pondeuse/gi, 'بياض');
      b = b.replace(/Chair/gi, 'لحم');
      b = b.replace(/Barbarie/gi, 'بربري');
      b = b.replace(/Local/gi, 'محلي');
      return b;
    }
    return breed;
  },

  renderGenerationsTable() {
    const tbody = document.getElementById('generationsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const poultry = appState.animals.filter(a => a.species === 'poulet' || a.species === 'pondeuse' || a.species === 'poussin' || a.species === 'pintade' || a.species === 'canard' || a.species === 'adulte');

    const isArabic = (appState.lang === 'ar' || document.documentElement.getAttribute('dir') === 'rtl');
    const lang = isArabic ? 'ar' : (appState.lang || 'fr');

    if (poultry.length === 0) {
      const emptyMsg = (lang === 'ar') 
        ? 'لا توجد أجيال دواجن مسجلة حالياً.' 
        : ((lang === 'en') ? 'No poultry generations recorded.' : 'Aucune génération de volailles enregistrée.');
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">${emptyMsg}</td></tr>`;
      return;
    }

    poultry.forEach(flock => {
      const daysSinceArrival = this.calculateAgeInDays(flock.birthDate);
      const arrivalAgeDays = Number(flock.arrivalAgeDays) || 0;
      const ageDays = daysSinceArrival + arrivalAgeDays;
      const stageInfo = this.getPoultryDevelopmentStage(ageDays, flock.species);

      const weeks = Math.floor(ageDays / 7);
      let ageDisplay = '';
      if (lang === 'ar') {
        ageDisplay = weeks > 0 
          ? `${ageDays} يوماً (${weeks} أسبوع)` 
          : `${ageDays} يوماً`;
      } else if (lang === 'en') {
        ageDisplay = weeks > 0 
          ? `${ageDays} days (${weeks} wks)` 
          : `${ageDays} days`;
      } else {
        ageDisplay = weeks > 0 
          ? `${ageDays} jours (${weeks} sem.)` 
          : `${ageDays} jours`;
      }

      const translatedStage = this.translateStage(flock.stage);
      const stageClass = this.getStageBadgeClass(flock.stage);
      const displayName = this.getAnimalDisplayName(flock);
      const lotNum = (flock.name && flock.name.toString().trim() !== '') ? (lang === 'ar' ? `دفعة #${flock.name}` : `Lot #${flock.name}`) : '';
      const translatedBreed = this.getTranslatedBreed(flock.breed);
      const breedDisplay = (translatedBreed && translatedBreed !== '-') ? translatedBreed : '<span class="text-muted">-</span>';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${displayName}</strong> ${lotNum ? `<small class="text-muted" style="display:block; font-size: 0.74rem;">${lotNum}</small>` : ''}</td>
        <td>${breedDisplay}</td>
        <td>${this.formatDateFR(flock.birthDate)}</td>
        <td><span class="badge-tag text-emerald" dir="auto">${ageDisplay}</span></td>
        <td><span class="stage-badge ${stageClass}">${translatedStage}</span></td>
        <td><small class="text-muted">${stageInfo.feed}</small></td>
        <td><small class="bold text-amber">${stageInfo.nextEvent}</small></td>
      `;
      tbody.appendChild(tr);
    });
  },

  getPoultryDevelopmentStage(ageDays, species) {
    const isArabic = (appState.lang === 'ar' || document.documentElement.getAttribute('dir') === 'rtl');
    const lang = isArabic ? 'ar' : (appState.lang || 'fr');
    if (species === 'pondeuse') {
      if (ageDays < 42) {
        if (lang === 'ar') return { feed: 'علف بادي للدجاجات', nextEvent: 'تلقيح نيوكاسل (اليوم 28)' };
        if (lang === 'en') return { feed: 'Pullet Starter Feed', nextEvent: 'Newcastle Vaccine D28' };
        return { feed: 'Démarrage Poulette', nextEvent: 'Vaccin Newcastle J28' };
      }
      if (ageDays < 140) {
        if (lang === 'ar') return { feed: 'علف نامي / نمو وتطوير', nextEvent: 'النقل لعنبر البيض (~20 أسبوع)' };
        if (lang === 'en') return { feed: 'Grower / Development Feed', nextEvent: 'Transfer to laying shed (~20 wks)' };
        return { feed: 'Croissance / Développement', nextEvent: 'Transfert bâtiment de ponte (~20 sem.)' };
      }
      if (lang === 'ar') return { feed: 'علف بياض غني بالكالسيوم', nextEvent: 'ذروة الإنتاج اليومي (85-95%)' };
      if (lang === 'en') return { feed: 'Layer Feed with Calcium', nextEvent: 'Daily Laying Peak (85-95%)' };
      return { feed: 'Aliment Ponte avec Calcium', nextEvent: 'Pic de ponte quotidien (85-95%)' };
    }

    if (species === 'adulte') {
      if (lang === 'ar') return { feed: 'علف حبوب وصيانة للديوك', nextEvent: 'متابعة الخصوبة والتلقيح' };
      if (lang === 'en') return { feed: 'Maintenance & Grain Feed', nextEvent: 'Fertility & Mating Monitor' };
      return { feed: 'Aliment Entretien & Céréales', nextEvent: 'Suivi fertilité & reproduction' };
    }

    // Poulet de chair & autres
    if (ageDays <= 14) {
      if (lang === 'ar') return { feed: 'علف بادي مفتت (21% بروتين)', nextEvent: 'تذكير لقاح غامبورو (اليوم 14)' };
      if (lang === 'en') return { feed: 'Starter Crumbs (21% Protein)', nextEvent: 'Gumboro Booster D14' };
      return { feed: 'Aliment Démarrage Miette (21% Protéines)', nextEvent: 'Rappel Vaccin Gumboro J14' };
    }
    if (ageDays <= 35) {
      if (lang === 'ar') return { feed: 'علف نامي محبب (19% بروتين)', nextEvent: 'وزن المراقبة (الهدف 1.8 كغ)' };
      if (lang === 'en') return { feed: 'Grower Pellets (19% Protein)', nextEvent: 'Target Weight Check (1.8kg)' };
      return { feed: 'Aliment Croissance Granulés (19% Protéines)', nextEvent: 'Pesée de contrôle (Cible 1.8kg)' };
    }
    if (ageDays <= 55) {
      if (lang === 'ar') return { feed: 'علف ناهي بدون أدوية', nextEvent: 'الموعد المثالي للبيع/الذبح (40-45 يوماً)' };
      if (lang === 'en') return { feed: 'Finisher Feed (Withdrawal)', nextEvent: 'Optimal Harvest Date (D+40 to D+45)' };
      return { feed: 'Aliment Finition sans médicament', nextEvent: 'Date optimale d\'abattage / Vente (J+40 à J+45)' };
    }
    if (lang === 'ar') return { feed: 'علف حبوب وصيانة', nextEvent: 'جاهز تماماً للذبح / استهلاك المزرعة' };
    if (lang === 'en') return { feed: 'Maintenance & Grain Feed', nextEvent: 'Mature / Ready for farm consumption' };
    return { feed: 'Aliment Entretien & Céréales', nextEvent: 'Maturité complète / Consommation ferme' };
  },

  renderMonthlyCalendarGrid() {
    const grid = document.getElementById('calendarDaysGrid');
    const label = document.getElementById('calCurrentMonthLabel');
    if (!grid || !label) return;
    grid.innerHTML = '';

    const lang = appState.lang || 'fr';
    const year = appState.calendarDate.getFullYear();
    const month = appState.calendarDate.getMonth();

    const monthNames = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang] && TRANSLATIONS[lang].cal_months)
      ? TRANSLATIONS[lang].cal_months
      : ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    label.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Adjust for Monday start (0=Sun -> 6, 1=Mon -> 0, etc.)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const totalDays = lastDay.getDate();

    // Fill blank cells from previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(year, month, 0 - (startDayOfWeek - 1 - i));
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell other-month';
      cell.innerHTML = `<span class="day-number">${prevDate.getDate()}</span>`;
      grid.appendChild(cell);
    }

    // Today's real dynamic date
    const todayStr = this.getTodayStr();

    // Fill days of current month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const cell = document.createElement('div');
      cell.className = 'calendar-day-cell' + (dateStr === todayStr ? ' today' : '');
      
      let dayHtml = `<span class="day-number">${day}</span>`;

      // 1. Check Hatching events (Date d'éclosion des couveuses)
      appState.incubatorBatches.forEach(b => {
        if (b.hatchDate === dateStr) {
          dayHtml += `<div class="day-event-tag event-hatch" title="${this.t('cal_legend_hatch')} ${b.name}">🐣 ${this.t('cal_legend_hatch')} ${b.name}</div>`;
        }
        if (b.startDate === dateStr) {
          dayHtml += `<div class="day-event-tag event-mirage" title="${this.t('stage_header_start')}">🥚 ${this.t('stage_header_start')}</div>`;
        }
        if (b.candling1Date === dateStr) {
          dayHtml += `<div class="day-event-tag event-mirage" title="${this.t('stage_header_candling1')}">🔍 ${this.t('stage_header_candling1')}</div>`;
        }
        if (b.lockdownDate === dateStr) {
          dayHtml += `<div class="day-event-tag event-mirage" title="${this.t('stage_header_lockdown')}">🛑 ${this.t('stage_header_lockdown')}</div>`;
        }
      });

      // 2. Check Vaccination / Flock events (Vaccin Newcastle / Gumboro for chicks)
      appState.animals.forEach(a => {
        if (a.species === 'poulet' || a.species === 'poussin') {
          const bDate = new Date(a.birthDate);
          const j14 = new Date(bDate); j14.setDate(j14.getDate() + 14);
          const j35 = new Date(bDate); j35.setDate(j35.getDate() + 35);

          if (j14.toISOString().split('T')[0] === dateStr) {
            dayHtml += `<div class="day-event-tag event-vaccine" title="${this.t('cal_legend_vaccine')}">💉 ${this.t('cal_legend_vaccine')} (${a.name})</div>`;
          }
          if (j35.toISOString().split('T')[0] === dateStr) {
            dayHtml += `<div class="day-event-tag event-sale" title="${this.t('cal_legend_sale')}">🍗 ${a.name}</div>`;
          }
        }
      });

      // 3. Check Sales recorded on this date
      appState.sales.forEach(s => {
        if (s.date === dateStr) {
          dayHtml += `<div class="day-event-tag event-sale" title="${s.description}">💰 ${this.t('cal_legend_sale')} (${this.formatMoney(s.total)})</div>`;
        }
      });

      cell.innerHTML = dayHtml;
      grid.appendChild(cell);
    }
  },

  // ==========================================
  // DATA IMPORT / EXPORT & BACKUP
  // ==========================================
  loadSampleData() {
    const isAr = appState.lang === 'ar';
    this.confirmDialog({
      title: isAr ? 'بيانات توضيحية' : 'Données Démo',
      message: this.t('modal_settings_desc') || 'Voulez-vous charger les données de démonstration ?',
      isDanger: false,
      confirmText: isAr ? 'تحميل' : 'Charger',
      onConfirm: () => {
        appState.animals = JSON.parse(JSON.stringify(SAMPLE_DATA.animals));
        appState.expenses = JSON.parse(JSON.stringify(SAMPLE_DATA.expenses));
        appState.sales = JSON.parse(JSON.stringify(SAMPLE_DATA.sales));
        appState.incubatorBatches = JSON.parse(JSON.stringify(SAMPLE_DATA.incubatorBatches));
        this.saveState();
        this.closeModal('modalDataOptions');
        this.renderAll();
        this.showToast(this.t('toast_demo_loaded') || 'Données de démonstration chargées !');
      }
    });
  },

  // Export officiel vers Excel (Classeur Multi-Onglets .xlsx avec fallback XML Spreadsheet)
  exportExcel() {
    const currency = appState.currency || 'TND';
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const fileDate = now.toISOString().split('T')[0];

    const totalRev = appState.sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const totalExp = appState.expenses.reduce((sum, e) => sum + (Number(e.total) || 0), 0);
    const netProfit = totalRev - totalExp;
    const totalAnimals = appState.animals.reduce((sum, a) => sum + (Number(a.currentQuantity) || 0), 0);

    // =========================================================================
    // OPTION 1 : Génération directe via SheetJS (Fichier binaire officiel .xlsx)
    // =========================================================================
    if (typeof window.XLSX !== 'undefined' && window.XLSX.utils) {
      try {
        const wb = window.XLSX.utils.book_new();

        // 1. Onglet : Bilan & Résumé
        const wsBilan = window.XLSX.utils.aoa_to_sheet([
          ["RAPPORT DE GESTION & BILAN DE L'EXPLOITATION"],
          ["Application", "FermeGest PRO (Gestion d'Élevage & Volailles)"],
          ["Date d'exportation", `${dateStr} à ${now.toLocaleTimeString('fr-FR')}`],
          ["Devise officielle", currency],
          [],
          ["INDICATEUR CLÉ", "VALEUR", "DÉTAIL"],
          ["Cheptel Total Actuel", totalAnimals, "Volailles / Têtes vivantes"],
          ["Chiffre d'Affaires Total (Ventes)", totalRev, `${currency} encaissés`],
          ["Charges Totales (Dépenses)", totalExp, `${currency} déboursés`],
          ["Bénéfice Net Réel", netProfit, `${currency} de résultat net`],
          ["Marge Nette de l'Exploitation", totalRev > 0 ? Number(((netProfit / totalRev) * 100).toFixed(1)) : 0, "% de marge nette"]
        ]);
        wsBilan['!cols'] = [{ wch: 32 }, { wch: 20 }, { wch: 30 }];
        window.XLSX.utils.book_append_sheet(wb, wsBilan, "Bilan & Résumé");

        // 2. Onglet : Cheptel & Volailles
        const animalRows = [
          [
            "Bande / Nom du Lot",
            "Espèce",
            "Race",
            "Date d'Arrivée ou Éclosion",
            "Effectif Initial",
            "Pertes (Mortalité)",
            "Effectif Actuel Restant",
            `Coût Achat Unitaire (${currency})`,
            `Valeur Totale du Lot (${currency})`,
            "Stade / Notes"
          ]
        ];
        if (appState.animals && appState.animals.length > 0) {
          appState.animals.forEach(a => {
            const initial = Number(a.initialQuantity) || 0;
            const mort = Number(a.mortality) || 0;
            const current = Number(a.currentQuantity) || 0;
            const cost = Number(a.costPerHead) || 0;
            animalRows.push([
              a.name || '',
              a.species || '',
              a.breed || '',
              a.birthDate || '',
              initial,
              mort,
              current,
              cost,
              Number((current * cost).toFixed(3)),
              a.notes || a.stage || ''
            ]);
          });
        }
        const wsAnimals = window.XLSX.utils.aoa_to_sheet(animalRows);
        wsAnimals['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 35 }];
        window.XLSX.utils.book_append_sheet(wb, wsAnimals, "Cheptel & Volailles");

        // 3. Onglet : Ventes & Recettes
        const saleRows = [
          [
            "Date de Vente",
            "Type de Produit",
            "Détail / Format Vendu",
            "Quantité Vendue",
            `Prix Unitaire (${currency})`,
            `Montant Total Encaissé (${currency})`,
            "Lot / Bande Concerné"
          ]
        ];
        if (appState.sales && appState.sales.length > 0) {
          appState.sales.forEach(s => {
            saleRows.push([
              s.date || '',
              s.productType || '',
              s.description || s.format || '',
              Number(s.quantity) || 0,
              Number(s.unitPrice) || 0,
              Number(s.total) || 0,
              this.getLotNameById(s.linkedLotId)
            ]);
          });
        }
        const wsSales = window.XLSX.utils.aoa_to_sheet(saleRows);
        wsSales['!cols'] = [{ wch: 15 }, { wch: 18 }, { wch: 32 }, { wch: 16 }, { wch: 18 }, { wch: 24 }, { wch: 26 }];
        window.XLSX.utils.book_append_sheet(wb, wsSales, "Ventes & Recettes");

        // 4. Onglet : Dépenses & Charges
        const expRows = [
          [
            "Date de Dépense",
            "Catégorie de Charge",
            "Libellé / Désignation de la Dépense",
            "Quantité",
            `Prix Unitaire (${currency})`,
            `Montant Total Payé (${currency})`,
            "Lot / Bande Associé"
          ]
        ];
        if (appState.expenses && appState.expenses.length > 0) {
          appState.expenses.forEach(e => {
            expRows.push([
              e.date || '',
              e.category || '',
              e.title || '',
              Number(e.quantity) || 1,
              Number(e.unitPrice) || Number(e.total) || 0,
              Number(e.total) || 0,
              this.getLotNameById(e.linkedLotId)
            ]);
          });
        }
        const wsExp = window.XLSX.utils.aoa_to_sheet(expRows);
        wsExp['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 35 }, { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 26 }];
        window.XLSX.utils.book_append_sheet(wb, wsExp, "Dépenses & Charges");

        // 5. Onglet : Couveuse & Incubation
        const incRows = [
          [
            "Nom de la Couvée",
            "Espèce d'Œufs",
            "Méthode (Poule ou Machine)",
            "Nombre d'Œufs",
            "Date de Début",
            "Date d'Éclosion Prévue (J+21)",
            "Température (°C)",
            "Humidité (%)",
            "Notes & Observations"
          ]
        ];
        if (appState.incubatorBatches && appState.incubatorBatches.length > 0) {
          appState.incubatorBatches.forEach(b => {
            incRows.push([
              b.name || '',
              b.eggSpecies || b.breed || '',
              b.method || 'machine',
              Number(b.eggsCount) || 0,
              b.startDate || '',
              b.hatchDate || '',
              b.temp || '',
              b.humidity || '',
              b.notes || ''
            ]);
          });
        }
        const wsInc = window.XLSX.utils.aoa_to_sheet(incRows);
        wsInc['!cols'] = [{ wch: 26 }, { wch: 18 }, { wch: 24 }, { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 35 }];
        window.XLSX.utils.book_append_sheet(wb, wsInc, "Couveuse & Incubation");

        const filename = `fermegest_tableau_excel_${fileDate}.xlsx`;
        window.XLSX.writeFile(wb, filename);

        this.showToast(this.t('toast_excel_downloaded') || 'Tableau Excel (.xlsx) téléchargé avec succès !');
        return;
      } catch (err) {
        console.warn('SheetJS export error, falling back to SpreadsheetML:', err);
      }
    }

    // =========================================================================
    // OPTION 2 (Fallback) : Excel XML SpreadsheetML (Multi-onglets universel .xls)
    // 100% UTF-8 natif : aucun problème d'accentuation sur Windows et Mac
    // =========================================================================
    this.exportSpreadsheetML(currency, dateStr, fileDate, totalAnimals, totalRev, totalExp, netProfit);
  },

  exportSpreadsheetML(currency, dateStr, fileDate, totalAnimals, totalRev, totalExp, netProfit) {
    const esc = (str) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0f172a"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#10b981" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="BoldCell">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="CurrencyCell">
   <NumberFormat ss:Format="#,##0.000"/>
  </Style>
  <Style ss:ID="IntegerCell">
   <NumberFormat ss:Format="#,##0"/>
  </Style>
 </Styles>

 <!-- 1. Onglet : Bilan Général -->
 <Worksheet ss:Name="Bilan Général">
  <Table ss:DefaultColumnWidth="140">
   <Column ss:Width="220"/>
   <Column ss:Width="140"/>
   <Column ss:Width="200"/>
   <Row>
    <Cell ss:StyleID="Title"><Data ss:Type="String">FERMEGEST PRO - BILAN &amp; GESTION D'ÉLEVAGE</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="BoldCell"><Data ss:Type="String">Date d'exportation :</Data></Cell>
    <Cell><Data ss:Type="String">${esc(dateStr)}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="BoldCell"><Data ss:Type="String">Devise :</Data></Cell>
    <Cell><Data ss:Type="String">${esc(currency)}</Data></Cell>
   </Row>
   <Row/>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Indicateur Clé</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Montant / Valeur</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Unité / Détail</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="BoldCell"><Data ss:Type="String">Cheptel Total Actuel</Data></Cell>
    <Cell ss:StyleID="IntegerCell"><Data ss:Type="Number">${totalAnimals}</Data></Cell>
    <Cell><Data ss:Type="String">Volailles vivantes</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="BoldCell"><Data ss:Type="String">Chiffre d'Affaires (Ventes Totales)</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${totalRev.toFixed(3)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(currency)}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="BoldCell"><Data ss:Type="String">Charges Totales (Dépenses)</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${totalExp.toFixed(3)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(currency)}</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="BoldCell"><Data ss:Type="String">Bénéfice Net Réel</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${netProfit.toFixed(3)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(currency)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- 2. Onglet : Cheptel & Volailles -->
 <Worksheet ss:Name="Cheptel &amp; Volailles">
  <Table ss:DefaultColumnWidth="120">
   <Column ss:Width="180"/>
   <Column ss:Width="100"/>
   <Column ss:Width="140"/>
   <Column ss:Width="130"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="120"/>
   <Column ss:Width="130"/>
   <Column ss:Width="130"/>
   <Column ss:Width="220"/>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Bande / Nom du Lot</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Espèce</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Race</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Date d'Arrivée / Éclosion</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Effectif Initial</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Pertes</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Effectif Restant</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Coût Unitaire (${esc(currency)})</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Valeur Totale (${esc(currency)})</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Stade / Notes</Data></Cell>
   </Row>`;

    appState.animals.forEach(a => {
      const initial = Number(a.initialQuantity) || 0;
      const mort = Number(a.mortality) || 0;
      const current = Number(a.currentQuantity) || 0;
      const cost = Number(a.costPerHead) || 0;
      const val = (current * cost).toFixed(3);
      xml += `
   <Row>
    <Cell ss:StyleID="BoldCell"><Data ss:Type="String">${esc(a.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(a.species)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(a.breed)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(a.birthDate)}</Data></Cell>
    <Cell ss:StyleID="IntegerCell"><Data ss:Type="Number">${initial}</Data></Cell>
    <Cell ss:StyleID="IntegerCell"><Data ss:Type="Number">${mort}</Data></Cell>
    <Cell ss:StyleID="IntegerCell"><Data ss:Type="Number">${current}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${cost.toFixed(3)}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${val}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(a.notes || a.stage)}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>

 <!-- 3. Onglet : Ventes & Recettes -->
 <Worksheet ss:Name="Ventes &amp; Recettes">
  <Table ss:DefaultColumnWidth="130">
   <Column ss:Width="110"/>
   <Column ss:Width="130"/>
   <Column ss:Width="200"/>
   <Column ss:Width="110"/>
   <Column ss:Width="130"/>
   <Column ss:Width="150"/>
   <Column ss:Width="180"/>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Date de Vente</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Type de Produit</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Description / Format</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Quantité Vendue</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Prix Unitaire (${esc(currency)})</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Montant Total (${esc(currency)})</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Lot Lié</Data></Cell>
   </Row>`;

    appState.sales.forEach(s => {
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${esc(s.date)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(s.productType)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(s.description || s.format)}</Data></Cell>
    <Cell ss:StyleID="IntegerCell"><Data ss:Type="Number">${Number(s.quantity) || 0}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${(Number(s.unitPrice) || 0).toFixed(3)}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${(Number(s.total) || 0).toFixed(3)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(this.getLotNameById(s.linkedLotId))}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>

 <!-- 4. Onglet : Dépenses & Charges -->
 <Worksheet ss:Name="Dépenses &amp; Charges">
  <Table ss:DefaultColumnWidth="130">
   <Column ss:Width="110"/>
   <Column ss:Width="140"/>
   <Column ss:Width="230"/>
   <Column ss:Width="100"/>
   <Column ss:Width="130"/>
   <Column ss:Width="150"/>
   <Column ss:Width="180"/>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Date de Dépense</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Catégorie</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Libellé de la Dépense</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Quantité</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Prix Unitaire (${esc(currency)})</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Montant Total (${esc(currency)})</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Lot Associé</Data></Cell>
   </Row>`;

    appState.expenses.forEach(e => {
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${esc(e.date)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(e.category)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(e.title)}</Data></Cell>
    <Cell ss:StyleID="IntegerCell"><Data ss:Type="Number">${Number(e.quantity) || 1}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${(Number(e.unitPrice) || Number(e.total) || 0).toFixed(3)}</Data></Cell>
    <Cell ss:StyleID="CurrencyCell"><Data ss:Type="Number">${(Number(e.total) || 0).toFixed(3)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(this.getLotNameById(e.linkedLotId))}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>

 <!-- 5. Onglet : Couveuse & Incubation -->
 <Worksheet ss:Name="Couveuse &amp; Incubation">
  <Table ss:DefaultColumnWidth="130">
   <Column ss:Width="180"/>
   <Column ss:Width="130"/>
   <Column ss:Width="140"/>
   <Column ss:Width="110"/>
   <Column ss:Width="130"/>
   <Column ss:Width="140"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="220"/>
   <Row>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nom de la Couvée</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Espèce d'Œufs</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Méthode</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nombre d'Œufs</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Date de Début</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Éclosion Estimée (J+21)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Température (°C)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Humidité (%)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Notes &amp; Observations</Data></Cell>
   </Row>`;

    appState.incubatorBatches.forEach(b => {
      xml += `
   <Row>
    <Cell ss:StyleID="BoldCell"><Data ss:Type="String">${esc(b.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(b.eggSpecies || b.breed)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(b.method || 'machine')}</Data></Cell>
    <Cell ss:StyleID="IntegerCell"><Data ss:Type="Number">${Number(b.eggsCount) || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(b.startDate)}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(b.hatchDate)}</Data></Cell>
    <Cell ss:StyleID="IntegerCell"><Data ss:Type="Number">${b.temp || 0}</Data></Cell>
    <Cell ss:StyleID="IntegerCell"><Data ss:Type="Number">${b.humidity || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${esc(b.notes)}</Data></Cell>
   </Row>`;
    });

    xml += `
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const filename = `fermegest_tableau_excel_${fileDate}.xls`;

    if (window.MobileBridge && window.MobileBridge.isNative) {
      window.MobileBridge.shareData({
        title: 'Tableau Excel FermeGest PRO',
        text: xml,
        dialogTitle: 'Partager le Tableau Excel'
      });
      this.showToast(this.t('toast_excel_downloaded') || 'Tableau Excel prêt au partage.');
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast(this.t('toast_excel_downloaded') || 'Tableau Excel (.xls) téléchargé avec succès !');
  },

  resetAllData() {
    const isAr = appState.lang === 'ar';
    this.confirmDialog({
      title: isAr ? 'إعادة ضبط شاملة' : 'Suppression Totale',
      message: isAr 
        ? 'تحذير هام: سيتم مسح كافة البيانات المسجلة نهائياً. هل ترغب في المتابعة؟'
        : 'ATTENTION: Cette action va supprimer toutes vos données. Continuer ?',
      isDanger: true,
      confirmText: isAr ? 'مسح الكل' : 'Tout supprimer',
      onConfirm: () => {
        appState.animals = [];
        appState.expenses = [];
        appState.sales = [];
        appState.incubatorBatches = [];
        appState.eggHarvests = [];
        appState.eggStock = 0;
        appState.feedDistributions = [];
        appState._zeroInitialized = true;
        this.saveState();
        this.closeModal('modalDataOptions');
        this.renderAll();
        this.showToast(this.t('toast_data_reset'));
      }
    });
  },

  // ==========================================
  // HELPER FORMATTERS & UTILITIES
  // ==========================================
  calculateAgeInDays(birthDateStr) {
    if (!birthDateStr) return 0;
    const now = this.getTodayDate();
    const birth = new Date(birthDateStr);
    const diffTime = Math.max(0, now - birth);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  },

  formatAgeText(days) {
    const lang = appState.lang || 'fr';
    if (lang === 'ar') {
      if (days < 7) return `${days} يوم`;
      const weeks = Math.floor(days / 7);
      const remDays = days % 7;
      if (days > 90) {
        const months = Math.floor(days / 30.5);
        return `${months} شهر (${days} يوم)`;
      }
      return `${days} يوم (${weeks} أسبوع${remDays > 0 ? ' +' + remDays + 'ي' : ''})`;
    }
    if (lang === 'en') {
      if (days < 7) return `${days} d`;
      const weeks = Math.floor(days / 7);
      const remDays = days % 7;
      if (days > 90) {
        const months = Math.floor(days / 30.5);
        return `${months} mos (${days} d)`;
      }
      return `${days} d (${weeks} wks${remDays > 0 ? ' +' + remDays + 'd' : ''})`;
    }
    if (days < 7) return `${days} j`;
    const weeks = Math.floor(days / 7);
    const remDays = days % 7;
    if (days > 90) {
      const months = Math.floor(days / 30.5);
      return `${months} mois (${days} j)`;
    }
    return `${days} j (${weeks} sem.${remDays > 0 ? ' +' + remDays + 'j' : ''})`;
  },

  formatDateFR(dateStr) {
    if (!dateStr) return '--/--/----';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  },

  getSpeciesIcon(species) {
    switch (species) {
      case 'poulet': return '🍗';
      case 'pondeuse': return '🥚';
      case 'poussin': return '🐣';
      case 'adulte': return '🐓';
      case 'pintade': return '🪶';
      case 'canard':
      case 'canard_barbarie': return '🦆';
      default: return '🐤';
    }
  },

  translateSpecies(species) {
    if (!species) return 'Poulet / Coq';
    const isArabic = (appState.lang === 'ar' || document.documentElement.getAttribute('dir') === 'rtl');
    const lang = isArabic ? 'ar' : (appState.lang || 'fr');
    const sp = species.toString().toLowerCase().trim();

    if (lang === 'ar') {
      if (sp === 'poulet' || sp === 'coq') return 'دجاج / ديوك';
      if (sp === 'pondeuse') return 'دجاج بياض';
      if (sp === 'poussin') return 'كتكوت';
      if (sp === 'adulte') return 'دجاج / ديوك';
      if (sp === 'pintade') return 'دجاج الوادي';
      if (sp === 'canard' || sp === 'canard_barbarie') return 'بط';
      if (sp === 'caille') return 'سمان';
      return 'دواجن';
    }

    if (lang === 'en') {
      if (sp === 'poulet' || sp === 'coq') return 'Chicken / Rooster';
      if (sp === 'pondeuse') return 'Laying hen';
      if (sp === 'poussin') return 'Chick';
      if (sp === 'adulte') return 'Adult chicken / rooster';
      if (sp === 'pintade') return 'Guinea fowl';
      if (sp === 'canard' || sp === 'canard_barbarie') return 'Duck';
      if (sp === 'caille') return 'Quail';
      return 'Poultry';
    }

    // French
    if (sp === 'poulet' || sp === 'coq') return 'Poulet / Coq';
    if (sp === 'pondeuse') return 'Poule pondeuse';
    if (sp === 'poussin') return 'Poussin';
    if (sp === 'adulte') return 'Poulet / Coq adulte';
    if (sp === 'pintade') return 'Pintade';
    if (sp === 'canard' || sp === 'canard_barbarie') return 'Canard';
    if (sp === 'caille') return 'Caille';
    return 'Volaille';
  },

  getAnimalDisplayName(animal) {
    if (!animal) return '';
    const breed = (animal.breed || '').toString().trim();
    const hasBreed = breed !== '' && breed !== '-';
    if (hasBreed) {
      return breed;
    }
    const speciesLabel = this.translateSpecies(animal.species);
    const stageLabel = this.translateStage(animal.stage);
    return stageLabel ? `${speciesLabel} (${stageLabel})` : speciesLabel;
  },

  translateStage(stage) {
    if (!stage) return '';
    const isArabic = (appState.lang === 'ar' || document.documentElement.getAttribute('dir') === 'rtl');
    const lang = isArabic ? 'ar' : (appState.lang || 'fr');
    const s = stage.toString().trim();
    const sLower = s.toLowerCase();

    if (lang === 'ar') {
      if (sLower.includes('démarrage') || sLower.includes('demarrage') || sLower.includes('start') || sLower.includes('بداية') || sLower.includes('تحضين')) {
        return 'بداية / تحضين';
      }
      if (sLower.includes('croissance') || sLower.includes('growth') || sLower.includes('نمو')) {
        return 'نمو';
      }
      if (sLower.includes('finition') || sLower.includes('finish') || sLower.includes('engraissement') || sLower.includes('تسمين')) {
        return 'تسمين';
      }
      if (sLower.includes('ponte') || sLower.includes('lay') || sLower.includes('بيض')) {
        return 'إنتاج بيض';
      }
      if (sLower.includes('reproduction') || sLower.includes('repro') || sLower.includes('أمهات') || sLower.includes('تكاثر')) {
        return 'أمهات / تكاثر';
      }
      if (sLower.includes('adulte') || sLower.includes('adult') || sLower.includes('بالغ')) {
        return 'بالغ';
      }
      return stage;
    }

    if (lang === 'en') {
      if (sLower.includes('démarrage') || sLower.includes('demarrage') || sLower.includes('start') || sLower.includes('بداية')) {
        return 'Starter';
      }
      if (sLower.includes('croissance') || sLower.includes('growth') || sLower.includes('نمو')) {
        return 'Grower';
      }
      if (sLower.includes('finition') || sLower.includes('finish') || sLower.includes('engraissement') || sLower.includes('تسمين')) {
        return 'Finisher';
      }
      if (sLower.includes('ponte') || sLower.includes('lay')) {
        return 'Laying';
      }
      if (sLower.includes('reproduction') || sLower.includes('repro')) {
        return 'Breeder';
      }
      if (sLower.includes('adulte') || sLower.includes('adult') || sLower.includes('بالغ')) {
        return 'Adult';
      }
      return stage;
    }

    // French
    if (sLower.includes('démarrage') || sLower.includes('demarrage')) return 'Démarrage';
    if (sLower.includes('croissance')) return 'Croissance';
    if (sLower.includes('finition')) return 'Finition';
    if (sLower.includes('ponte')) return 'Ponte';
    if (sLower.includes('reproduction')) return 'Reproduction';
    if (sLower.includes('adulte')) return 'Adulte';
    return stage;
  },

  getStageBadgeClass(stage) {
    if (!stage) return 'badge-stage-growth';
    const s = stage.toString().toLowerCase().trim();
    if (s.includes('démarrage') || s.includes('demarrage') || s.includes('start') || s.includes('بداية') || s.includes('تحضين')) return 'badge-stage-start';
    if (s.includes('croissance') || s.includes('growth') || s.includes('نمو')) return 'badge-stage-growth';
    if (s.includes('finition') || s.includes('finish') || s.includes('تسمين')) return 'badge-stage-finish';
    if (s.includes('ponte') || s.includes('lay') || s.includes('بيض')) return 'badge-stage-laying';
    if (s.includes('adulte') || s.includes('adult') || s.includes('repro') || s.includes('بالغ') || s.includes('أمهات') || s.includes('تكاثر')) return 'badge-stage-repro';
    return 'badge-stage-growth';
  },

  getExpenseCategoryBadge(cat) {
    switch (cat) {
      case 'nourriture': return `<span class="badge-tag text-warning">${this.t('exp_cat_food')}</span>`;
      case 'veterinaire': return `<span class="badge-tag text-violet">${this.t('exp_cat_vet')}</span>`;
      case 'electricite': return `<span class="badge-tag text-cyan">${this.t('exp_cat_elec')}</span>`;
      case 'eau': return `<span class="badge-tag text-cyan">${this.t('exp_cat_water')}</span>`;
      case 'salaire': return `<span class="badge-tag text-emerald">${this.t('exp_cat_sal')}</span>`;
      default: return `<span class="badge-tag text-muted">${this.t('exp_cat_other')}</span>`;
    }
  },

  getSaleProductBadge(type) {
    switch (type) {
      case 'oeufs': return `<span class="badge-tag text-warning">🥚 ${this.t('preset_eggs')}</span>`;
      case 'poussin-1j': return `<span class="badge-tag text-warning">🐣 ${this.t('preset_chicks_1d')}</span>`;
      case 'poussin-demarre':
      case 'poussin': return `<span class="badge-tag text-warning">🐥 ${this.t('preset_chicks_started')}</span>`;
      case 'poulet-croissance':
      case 'poulet': return `<span class="badge-tag text-emerald">🍗 ${this.t('preset_chicken_growth')}</span>`;
      case 'poulet-adulte': return `<span class="badge-tag text-emerald">🐓 ${this.t('preset_chicken_adult')}</span>`;
      case 'pintade': return `<span class="badge-tag text-emerald">🪶 ${this.t('opt_sale_pintade')}</span>`;
      case 'canard': return `<span class="badge-tag text-emerald">🦆 ${this.t('opt_sale_canard')}</span>`;
      default: return `<span class="badge-tag">📦 ${this.t('opt_sale_other')}</span>`;
    }
  },

  getLotNameById(lotId) {
    if (!lotId || lotId === 'general' || lotId === 'none') {
      return this.t('opt_general_farm') || 'Exploitation Générale';
    }
    const lot = appState.animals.find(a => a.id === lotId);
    if (!lot) return this.t('opt_general_farm') || 'Exploitation Générale';
    const displayName = this.getAnimalDisplayName(lot);
    const lotNum = (lot.name && lot.name.toString().trim() !== '') ? (appState.lang === 'ar' ? `دفعة #${lot.name}` : `Lot #${lot.name}`) : '';
    return lotNum ? `${displayName} (${lotNum})` : displayName;
  }
};

// Expose app on global window
window.app = app;
window.appState = appState;

// Safe in-app replacement for native browser alert (empêche les boîtes d'alerte Google/navigateur)
window.alert = function(msg) {
  if (window.app && typeof window.app.showToast === 'function') {
    window.app.showToast(msg, 'warning');
  } else {
    console.warn('[InAppAlert]', msg);
  }
};

// Initialize Application on DOM Ready or immediately if DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
} else {
  app.init();
}
