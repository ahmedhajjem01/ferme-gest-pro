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
      unitPrice: 1.800,
      total: 27.000,
      linkedLotId: 'lot-p-02'
    },
    {
      id: 'sale-03',
      date: '2026-10-08',
      productType: 'oeufs',
      description: 'Vente 12 œufs à l\'unité (3 Haras)',
      format: 'oeuf-unite',
      quantity: 12,
      unitPrice: 0.450,
      total: 5.400,
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
    this.renderAll();
    this.runSimulator();
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
        } else if (val.includes('<') || el.hasAttribute('data-i18n-html') || el.id === 'expenseFeedNotice') {
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
    this.runSimulator();

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
        savedFavoriteFeedRoutine: appState.savedFavoriteFeedRoutine || null
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
          animalNameInput.placeholder = `Par défaut : ${nextId}`;
        }
        const costInput = document.getElementById('animalCostPerHead');
        if (costInput && (!costInput.value || costInput.value === '20')) {
          costInput.value = '0';
        }
        const stageSelect = document.getElementById('animalStage');
        if (stageSelect && !stageSelect.value) {
          stageSelect.value = 'Adulte';
        }
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
      qtyInput.value = Math.min(stock, 30);
      qtyInput.max = stock;
    }
    const formatSel = document.getElementById('sellEggFormat');
    if (formatSel) formatSel.value = 'oeuf-unite';

    const priceInput = document.getElementById('sellEggUnitPrice');
    if (priceInput) priceInput.value = appState.currency === 'TND' ? '0.450' : '0.25';

    this.calcSellEggTotal();
  },

  handleSellEggFormatChange() {
    const format = document.getElementById('sellEggFormat')?.value;
    const priceInput = document.getElementById('sellEggUnitPrice');
    const isTND = appState.currency === 'TND';
    if (priceInput) {
      if (format === 'hara') {
        priceInput.value = isTND ? '1.800' : '0.90';
      } else if (format === 'plateau') {
        priceInput.value = isTND ? '13.500' : '6.50';
      } else {
        priceInput.value = isTND ? '0.450' : '0.25';
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
      alert(`La quantité à vendre (${totalEggs} œufs) dépasse votre stock disponible (${stock} œufs).`);
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
    if (batchEggsInput && stock > 0) {
      batchEggsInput.value = Math.min(stock, 60);
    }
    const notesInput = document.getElementById('batchNotes');
    if (notesInput && !notesInput.value && stock > 0) {
      notesInput.value = `Prélevé du stock d'œufs de la ferme (Stock initial: ${stock})`;
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
      input.value = Math.min(stock, 5);
      input.max = stock;
    }
  },

  handleSaveConsumeEggStock(e) {
    if (e && e.preventDefault) e.preventDefault();
    const qty = parseInt(document.getElementById('consumeEggQty')?.value, 10) || 0;
    const stock = Number(appState.eggStock) || 0;
    if (qty <= 0) return;
    if (qty > stock) {
      alert(`La quantité dépasse le stock actuel (${stock}).`);
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
        html += `<option value="${a.id}" ${isSelected}>[${getSpeciesLabel(a.species)}] ${a.name} (${a.breed})</option>`;
      });
      expenseLotSelect.innerHTML = html;
    }

    if (saleLotSelect) {
      let html = `<option value="none">${this.t('opt_no_lot')}</option>`;
      const remWord = lang === 'ar' ? 'المتبقي' : (lang === 'en' ? 'Remaining' : 'Restant');
      appState.animals.forEach(a => {
        html += `<option value="${a.id}">[${getSpeciesLabel(a.species)}] ${a.name} (${remWord}: ${a.currentQuantity})</option>`;
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

    // Incubation Highlight Bar
    this.renderDashboardIncubationBanner();

    // Alerts for critical farm events
    this.renderDashboardAlerts();

    // Breakdown Bars (Revenue & Expenses)
    this.renderBreakdowns(totalRevenue, totalExpenses);

    // Recent Transactions
    this.renderRecentTransactions();
  },

  renderDashboardIncubationBanner() {
    const title = document.getElementById('incubationBannerTitle');
    const sub = document.getElementById('incubationBannerSub');
    if (!title || !sub) return;

    const activeBatches = appState.incubatorBatches.filter(b => b.status !== 'hatched');
    if (activeBatches.length === 0) {
      title.textContent = this.t('incubation_banner_default_title');
      sub.textContent = this.t('incubation_banner_default_sub');
      return;
    }

    // Find closest batch to hatch
    const now = this.getTodayDate();
    let closest = activeBatches[0];
    let minDays = 999;

    activeBatches.forEach(b => {
      const hatch = new Date(b.hatchDate);
      const diffDays = Math.ceil((hatch - now) / (1000 * 60 * 60 * 24));
      if (diffDays < minDays) {
        minDays = diffDays;
        closest = b;
      }
    });

    if (minDays <= 0) {
      title.textContent = this.t('hatch_ongoing_title', { name: closest.name });
      sub.textContent = this.t('hatch_ongoing_sub', { count: closest.eggsCount, breed: closest.breed });
    } else {
      title.textContent = this.t('incubation_progress_title', { name: closest.name, count: closest.eggsCount });
      sub.textContent = this.t('incubation_progress_sub', { days: minDays, date: this.formatDateFR(closest.hatchDate), temp: closest.temp });
    }
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

    // Check animal stages ready for sale (poulet chair > 35 days and <= 70 days, not dismissed, living subjects)
    const dismissed = Array.isArray(appState.dismissedSaleAlerts) ? appState.dismissedSaleAlerts : [];
    appState.animals.forEach(a => {
      if (a.species === 'poulet' && (Number(a.currentQuantity) || 0) > 0 && !dismissed.includes(a.id)) {
        const age = this.calculateAgeInDays(a.birthDate) + (Number(a.arrivalAgeDays) || 0);
        // Only notify during typical broiler harvest window (35 to 70 days)
        if (age >= 35 && age <= 70 && a.stage !== 'Ponte' && a.stage !== 'Reproduction') {
          const div = document.createElement('div');
          div.className = 'alert-card alert-info';
          div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:0.5rem;">
              <div>
                <strong>Bande prête pour la vente (${a.name || a.id}) :</strong> Âge: ${age} jours (${a.currentQuantity} sujets prêts).
              </div>
              <button class="btn btn-sm btn-outline" style="border:none; cursor:pointer; font-size:1.1rem; line-height:1;" title="Ne plus afficher" onclick="app.dismissSaleAlert('${a.id}')">&times;</button>
            </div>
          `;
          container.appendChild(div);
        }
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
  // AGRONOMIC FEED ENGINE & BIOLOGICAL MATRIX
  // (Base de données scientifique & table d'alimentation)
  // ==========================================

  getAgronomicFeedData(species = 'poulet', ageDays = 30, stage = '', breed = '') {
    const sp = (species || '').toLowerCase();
    const stg = (stage || '').toLowerCase();
    const brd = (breed || '').toLowerCase();
    const days = Math.max(1, Math.round(ageDays));

    const isDuck = sp === 'canard' || sp === 'canard_barbarie' || sp.includes('duck');
    const isPintade = sp === 'pintade' || sp.includes('guinea');

    if (isDuck) {
      // 1. كتاكيت بط مسكوفي: من 1 إلى 4 أسابيع -> 30 إلى 60 غرام
      if (days <= 28) {
        return {
          minGrams: 30,
          maxGrams: 60,
          avgGrams: 45,
          dailyGrams: 45,
          stageKey: 'duck_chick',
          labelAr: 'كتاكيت بط مسكوفي (1-4 أسابيع)',
          labelFr: 'Canetons de Barbarie (1-4 sem.)',
          labelEn: 'Muscovy Ducklings (1-4 wks)'
        };
      }
      // 2. بط مسكوفي نامي: من 5 إلى 10 أسابيع -> 100 إلى 140 غرام
      if (days <= 70) {
        return {
          minGrams: 100,
          maxGrams: 140,
          avgGrams: 120,
          dailyGrams: 120,
          stageKey: 'duck_grower',
          labelAr: 'بط مسكوفي نامي (5-10 أسابيع)',
          labelFr: 'Canards Barbarie Croissance (5-10 sem.)',
          labelEn: 'Muscovy Grower Ducks (5-10 wks)'
        };
      }
      // 3. بط مسكوفي بالغ (> 10 أسابيع / > 70 يوماً)
      const isMale = stg.includes('mâle') || stg.includes('male') || stg.includes('ذكور') || stg.includes('تسمين') || stg.includes('engraiss') || brd.includes('mâle') || brd.includes('male') || brd.includes('ذكور');
      if (isMale) {
        // بط مسكوفي بالغ (ذكور): تسمين / ذكور مخصبة -> 180 إلى 220 غرام
        return {
          minGrams: 180,
          maxGrams: 220,
          avgGrams: 200,
          dailyGrams: 200,
          stageKey: 'duck_adult_male',
          labelAr: 'بط مسكوفي بالغ (ذكور - تسمين / مخصبة)',
          labelFr: 'Canard Barbarie Adulte Mâle (Finition / Reprod.)',
          labelEn: 'Adult Muscovy Drake (Male / Fattening)'
        };
      } else {
        // بط مسكوفي بالغ (إناث): بياض / أمهات -> 130 إلى 160 غرام
        return {
          minGrams: 130,
          maxGrams: 160,
          avgGrams: 145,
          dailyGrams: 145,
          stageKey: 'duck_adult_female',
          labelAr: 'بط مسكوفي بالغ (إناث - بياض / أمهات)',
          labelFr: 'Canard Barbarie Adulte Femelle (Ponte / Mères)',
          labelEn: 'Adult Muscovy Duck (Female / Laying)'
        };
      }
    }

    if (isPintade) {
      if (days <= 28) {
        return {
          minGrams: 18,
          maxGrams: 35,
          avgGrams: 26.5,
          dailyGrams: 26.5,
          stageKey: 'pintade_chick',
          labelAr: 'كتاكيت دجاج الوادي (1-4 أسابيع)',
          labelFr: 'Pintadeaux Démarrage (1-4 sem.)',
          labelEn: 'Guinea Keets (1-4 wks)'
        };
      }
      if (days <= 84) {
        return {
          minGrams: 50,
          maxGrams: 75,
          avgGrams: 62.5,
          dailyGrams: 62.5,
          stageKey: 'pintade_grower',
          labelAr: 'دجاج الوادي نامي (5-12 أسبوعاً)',
          labelFr: 'Pintades Croissance (5-12 sem.)',
          labelEn: 'Growing Guinea Fowls (5-12 wks)'
        };
      }
      return {
        minGrams: 95,
        maxGrams: 120,
        avgGrams: 107.5,
        dailyGrams: 107.5,
        stageKey: 'pintade_adult',
        labelAr: 'دجاج الوادي بالغ (> 12 أسبوعاً)',
        labelFr: 'Pintades Adultes (> 12 sem.)',
        labelEn: 'Adult Guinea Fowls (> 12 wks)'
      };
    }

    // Default: Chickens (الدجاج بمراحله الأربعة)
    // 1. كتاكيت دجاج (فلالس): من 1 إلى 4 أسابيع -> 15 إلى 35 غرام
    if (days <= 28) {
      return {
        minGrams: 15,
        maxGrams: 35,
        avgGrams: 25,
        dailyGrams: 25,
        stageKey: 'chicken_chick',
        labelAr: 'كتاكيت دجاج / فلالس (1-4 أسابيع)',
        labelFr: 'Poussins Démarrage (1-4 sem.)',
        labelEn: 'Chicks / Starter (1-4 wks)'
      };
    }
    // 2. دجاج نامي (صغير/فرارج): من 5 إلى 12 أسبوعاً -> 45 إلى 70 غرام
    if (days <= 84) {
      return {
        minGrams: 45,
        maxGrams: 70,
        avgGrams: 57.5,
        dailyGrams: 57.5,
        stageKey: 'chicken_grower',
        labelAr: 'دجاج نامي - صغير/فرارج (5-12 أسبوعاً)',
        labelFr: 'Poulets Nami / Croissance (5-12 sem.)',
        labelEn: 'Growing Chickens (5-12 wks)'
      };
    }
    // 3. دجاج مقبل على البيض (بشاير): من 13 إلى 18 أسبوعاً -> 75 إلى 90 غرام
    if (days <= 126) {
      return {
        minGrams: 75,
        maxGrams: 90,
        avgGrams: 82.5,
        dailyGrams: 82.5,
        stageKey: 'chicken_prelay',
        labelAr: 'دجاج مقبل على البيض - بشاير (13-18 أسبوعاً)',
        labelFr: 'Poulettes Pré-Ponte / Bchayer (13-18 sem.)',
        labelEn: 'Pre-Layer Pullets (13-18 wks)'
      };
    }
    // 4. دجاج بياض بالغ (كبير): من عمر 19 أسبوعاً فما فوق -> 110 إلى 125 غرام
    return {
      minGrams: 110,
      maxGrams: 125,
      avgGrams: 117.5,
      dailyGrams: 117.5,
      stageKey: 'chicken_adult_layer',
      labelAr: 'دجاج بياض بالغ - كبير (19 أسبوعاً فما فوق)',
      labelFr: 'Poules Pondeuses / Adultes (> 19 sem.)',
      labelEn: 'Adult Layers (> 19 wks)'
    };
  },

  calculateCumulativeFeedKg(species = 'poulet', ageDays = 30, stage = '', breed = '', startAgeDays = 0) {
    const calcFromZero = (d) => {
      const days = Math.max(0, Math.round(d));
      if (days === 0) return 0;
      const sp = (species || '').toLowerCase();
      const isDuck = sp === 'canard' || sp === 'canard_barbarie' || sp.includes('duck');
      const isPintade = sp === 'pintade' || sp.includes('guinea');

      if (isDuck) {
        if (days <= 28) return (days * 0.045);
        if (days <= 70) return 1.260 + ((days - 28) * 0.120);
        const stg = (stage || '').toLowerCase();
        const brd = (breed || '').toLowerCase();
        const isMale = stg.includes('mâle') || stg.includes('male') || stg.includes('ذكور') || stg.includes('تسمين') || brd.includes('mâle') || brd.includes('male');
        const adultDailyKg = isMale ? 0.200 : 0.145;
        return 6.300 + ((days - 70) * adultDailyKg);
      }

      if (isPintade) {
        if (days <= 28) return (days * 0.0265);
        if (days <= 84) return 0.742 + ((days - 28) * 0.0625);
        return 4.242 + ((days - 84) * 0.1075);
      }

      // Chickens (Table agronomique par palier d'âge):
      // Palier 1: 1 à 4 semaines (28 jours) @ 25g/j (15-35g) = 0.700 kg
      if (days <= 28) {
        return (days * 0.025);
      }
      // Palier 2: 5 à 12 semaines (56 jours) @ 57.5g/j (45-70g) = 3.220 kg (cumul à 84j = 3.920 kg)
      if (days <= 84) {
        return 0.700 + ((days - 28) * 0.0575);
      }
      // Palier 3: 13 à 18 semaines (42 jours) @ 82.5g/j (75-90g) = 3.465 kg (cumul à 126j = 7.385 kg)
      if (days <= 126) {
        return 3.920 + ((days - 84) * 0.0825);
      }
      // Palier 4: 19+ semaines (adulte / pondeuse) @ 117.5g/j (110-125g) = 0.1175 kg/j
      return 7.385 + ((days - 126) * 0.1175);
    };

    const totalDays = Math.max(1, Math.round(ageDays));
    const startDays = Math.max(0, Math.round(startAgeDays || 0));

    let rawKg = 0;
    if (startDays > 0 && totalDays > startDays) {
      rawKg = Math.max(0, calcFromZero(totalDays) - calcFromZero(startDays));
    } else {
      rawKg = calcFromZero(totalDays);
    }

    const scalingRatio = (typeof this.getFeedScalingRatio === 'function') ? this.getFeedScalingRatio() : 1.0;
    return rawKg * scalingRatio;
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
    if (!Array.isArray(feedTypes)) return [];
    return feedTypes.map(ft => {
      let name = ft.name || '';
      if (name.includes('بليه') || name === 'قمح / بليه') {
        name = 'Blé';
      }
      return { ...ft, name };
    });
  },

  renderSmartFeedPresets() {
    const container = document.getElementById('feedSmartPresetsContainer');
    if (!container) return;

    const hasHistory = Array.isArray(appState.feedDistributions) && appState.feedDistributions.length > 0;
    const favorite = appState.savedFavoriteFeedRoutine;
    const routine = favorite || (hasHistory ? appState.feedDistributions[0] : null);

    if (!routine || !Array.isArray(routine.items) || routine.items.length === 0) {
      // Mode de démarrage : boutons propres + conseil d'apprentissage
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <label class="form-label" style="font-weight: 700; font-size: 0.8rem; margin: 0;">
            ${this.t('feed_smart_starter_title')}
          </label>
          <span class="badge-pill" style="font-size: 0.68rem; color: var(--accent-amber); background: rgba(245, 158, 11, 0.1);">
            ${this.t('feed_smart_starter_badge')}
          </span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem;">
          <button type="button" class="btn btn-outline" style="padding: 0.45rem 0.25rem; font-size: 0.74rem; font-weight: 700;" onclick="app.applyDistribPreset('half_can')">
            🥫 0.5 ${appState.lang === 'ar' ? 'علبة' : (appState.lang === 'en' ? 'can' : 'boîte')}<br><span style="font-size: 0.66rem; color: var(--text-muted);">~0.33 ${appState.lang === 'ar' ? 'كغ / نوع' : (appState.lang === 'en' ? 'kg / feed' : 'kg / aliment')}</span>
          </button>
          <button type="button" class="btn btn-outline" style="padding: 0.45rem 0.25rem; font-size: 0.74rem; font-weight: 700;" onclick="app.applyDistribPreset('one_can')">
            🥫 1 ${appState.lang === 'ar' ? 'علبة' : (appState.lang === 'en' ? 'can' : 'boîte')}<br><span style="font-size: 0.66rem; color: var(--text-muted);">~0.67 ${appState.lang === 'ar' ? 'كغ / نوع' : (appState.lang === 'en' ? 'kg / feed' : 'kg / aliment')}</span>
          </button>
          <button type="button" class="btn btn-outline btn-emerald" style="padding: 0.45rem 0.25rem; font-size: 0.74rem; font-weight: 800;" onclick="app.applyDistribPreset('clear')">
            ${this.t('feed_smart_clear')}<br><span style="font-size: 0.66rem; color: var(--text-muted);">${appState.lang === 'ar' ? '0 كغ في الكل' : (appState.lang === 'en' ? '0 kg everywhere' : '0 kg partout')}</span>
          </button>
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.35;">
          ${this.t('feed_smart_learning_tip')}
        </div>
      `;
      return;
    }

    // Mode adaptatif : L'application a analysé les distributions réelles du fermier
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const summaryItems = routine.items
      .map(it => `${it.kg} ${unitKg} ${this.getFeedShortName(it)}`)
      .slice(0, 3)
      .join(' + ');
    const totalKg = routine.totalKg || routine.items.reduce((sum, it) => sum + (Number(it.kg) || 0), 0);
    const halfKg = (totalKg * 0.5).toFixed(2);

    const halfLabel = isAr ? `${halfKg} كغ إجمالي` : (isEn ? `${halfKg} kg total` : `${halfKg} kg total`);
    const zeroLabel = isAr ? '0 كغ في الكل' : (isEn ? '0 kg everywhere' : '0 kg partout');
    const statsLabel = isAr 
      ? `📊 ${totalKg.toFixed(2)} كغ معتادة (~${(totalKg / 0.667).toFixed(1)} علبة سيكام)`
      : (isEn ? `📊 ${totalKg.toFixed(2)} kg routine (~${(totalKg / 0.667).toFixed(1)} Sicam cans)` : `📊 ${totalKg.toFixed(2)} kg habituels (~${(totalKg / 0.667).toFixed(1)} boîtes Sicam)`);

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
        <label class="form-label" style="font-weight: 700; font-size: 0.8rem; margin: 0;">
          ${this.t('feed_smart_title')}
        </label>
        <span class="badge-pill text-emerald" style="font-size: 0.68rem; background: rgba(16, 185, 129, 0.1);">
          ${this.t('feed_smart_learned_badge')}
        </span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.4rem;">
        <!-- Bouton 1: Répéter la routine habituelle -->
        <button type="button" class="btn btn-outline btn-emerald" style="padding: 0.45rem 0.25rem; font-size: 0.74rem; font-weight: 800; border-color: var(--accent-emerald);" onclick="app.applyLearnedRoutine('repeat')">
          ${this.t('feed_smart_repeat')}<br>
          <span style="font-size: 0.66rem; color: var(--accent-emerald); font-weight: 700;">${summaryItems || totalKg.toFixed(1) + ' ' + unitKg}</span>
        </button>

        <!-- Bouton 2: Demi-ration (50%) -->
        <button type="button" class="btn btn-outline" style="padding: 0.45rem 0.25rem; font-size: 0.74rem; font-weight: 700;" onclick="app.applyLearnedRoutine('half')">
          ${this.t('feed_smart_half')}<br>
          <span style="font-size: 0.66rem; color: var(--text-muted);">${halfLabel}</span>
        </button>

        <!-- Bouton 3: Remettre à zéro -->
        <button type="button" class="btn btn-outline" style="padding: 0.45rem 0.25rem; font-size: 0.74rem; font-weight: 700;" onclick="app.applyDistribPreset('clear')">
          ${this.t('feed_smart_clear')}<br>
          <span style="font-size: 0.66rem; color: var(--text-muted);">${zeroLabel}</span>
        </button>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.35rem; flex-wrap: wrap; gap: 0.3rem;">
        <small style="font-size: 0.7rem; color: var(--text-muted);">
          ${statsLabel}
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
      this.applyDistribPreset('one_can');
      return;
    }

    const ratio = mode === 'half' ? 0.5 : 1.0;

    // Réinitialiser les champs à zéro d'abord
    (appState.feedTypes || []).forEach(ft => {
      const input = document.getElementById(`distribKg_${ft.id}`);
      if (input) input.value = '0.00';
    });

    // Remplir chaque aliment selon la routine mémorisée
    routine.items.forEach(it => {
      const targetKg = (Number(it.kg) * ratio).toFixed(2);
      const input = document.getElementById(`distribKg_${it.feedTypeId}`);
      if (input) {
        input.value = targetKg;
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
        items.push({ feedTypeId: ft.id, name: ft.name, kg: parseFloat(kg.toFixed(2)) });
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
      nameInput.placeholder = isAr ? 'مثال: ذرة مرحية، نخالة، بياض...' : (isEn ? 'Ex: Cracked corn, Wheat bran...' : 'Ex: Maïs concassé, Son de blé, Tournesol...');
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
    this.renderSmartFeedPresets();

    const container = document.getElementById('feedDistribItemsContainer');
    if (!container) return;

    if (!Array.isArray(appState.feedTypes) || appState.feedTypes.length === 0) {
      appState.feedTypes = [
        { id: 'feed-ble', name: 'Blé', stockKg: 0, pricePerKg: 1.10 },
        { id: 'feed-bouchon', name: 'Aliment ponte (Bouchon)', stockKg: 0, pricePerKg: 1.50 }
      ];
    }

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const inStockPrefix = isAr ? 'في المخزون :' : (isEn ? 'In stock:' : 'En stock :');
    const bteLabel = isAr ? 'علبة' : (isEn ? 'can' : 'bte');
    const btesLabel = isAr ? 'علب' : (isEn ? 'cans' : 'btes');
    const sicamCansLabel = isAr ? 'علبة سيكام' : (isEn ? 'Sicam can(s)' : 'boîte(s) Sicam');

    let html = '';
    appState.feedTypes.forEach((ft) => {
      const defaultKg = '0.0';
      const defaultCans = '0';
      const stockKg = Number(ft.stockKg) || 0;
      const displayName = this.getFeedDisplayName(ft);

      html += `
        <div class="feed-distrib-card" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.75rem; margin-bottom: 0.65rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
            <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main);">
              🌾 ${displayName}
            </div>
            <span class="badge-pill" style="font-size: 0.72rem; color: var(--accent-emerald); background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25);">
              ${inStockPrefix} <strong>${stockKg.toFixed(1)} ${unitKg}</strong>
            </span>
          </div>

          <!-- Raccourcis Boîtes Sicam rapides pour cet aliment -->
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.3rem; margin-bottom: 0.45rem;">
            <button type="button" class="btn btn-outline" style="padding: 0.3rem 0.1rem; font-size: 0.72rem; font-weight: 700;" onclick="app.setFeedTypeDistribSicam('${ft.id}', 0)">
              0
            </button>
            <button type="button" class="btn btn-outline" style="padding: 0.3rem 0.1rem; font-size: 0.72rem; font-weight: 700;" onclick="app.setFeedTypeDistribSicam('${ft.id}', 0.5)">
              🥫 0.5 ${bteLabel}<br><span style="font-size: 0.65rem; color: var(--text-muted);">~0.3 ${unitKg}</span>
            </button>
            <button type="button" class="btn btn-outline" style="padding: 0.3rem 0.1rem; font-size: 0.72rem; font-weight: 700;" onclick="app.setFeedTypeDistribSicam('${ft.id}', 1.0)">
              🥫 1 ${bteLabel}<br><span style="font-size: 0.65rem; color: var(--text-muted);">~0.7 ${unitKg}</span>
            </button>
            <button type="button" class="btn btn-outline" style="padding: 0.3rem 0.1rem; font-size: 0.72rem; font-weight: 700;" onclick="app.setFeedTypeDistribSicam('${ft.id}', 1.5)">
              🥫 1.5 ${bteLabel}<br><span style="font-size: 0.65rem; color: var(--text-muted);">~1.0 ${unitKg}</span>
            </button>
            <button type="button" class="btn btn-outline" style="padding: 0.3rem 0.1rem; font-size: 0.72rem; font-weight: 700;" onclick="app.setFeedTypeDistribSicam('${ft.id}', 2.0)">
              🥫 2 ${btesLabel}<br><span style="font-size: 0.65rem; color: var(--text-muted);">~1.3 ${unitKg}</span>
            </button>
          </div>

          <!-- Saisie en kg et affichage équivalent Sicam -->
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <input type="number" id="distribKg_${ft.id}" class="input-field distrib-kg-input" step="0.05" min="0" value="${defaultKg}" data-feed-id="${ft.id}" data-price="${ft.pricePerKg || 1}" style="font-weight: 800; font-size: 1.15rem; color: var(--accent-amber); max-width: 120px;" oninput="app.recalcDistribTotal()">
            <span style="font-weight: 700; color: var(--text-secondary); font-size: 0.95rem;">${unitKg}</span>
            <span id="distribHint_${ft.id}" style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto;">
              ~${defaultCans} ${sicamCansLabel}
            </span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    this.recalcDistribTotal();
  },

  setFeedTypeDistribSicam(feedId, cans) {
    const cansNum = Number(cans) || 0;
    const kg = (cansNum * 0.667).toFixed(2);
    const input = document.getElementById(`distribKg_${feedId}`);
    if (input) {
      input.value = kg;
    }
    const hint = document.getElementById(`distribHint_${feedId}`);
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const canWord = isAr ? 'علبة سيكام' : (isEn ? 'Sicam can(s)' : 'boîte(s) Sicam');
    const zeroWord = isAr ? '0 علبة' : (isEn ? '0 can' : '0 boîte');
    if (hint) {
      hint.textContent = cansNum > 0 ? `~${cansNum} ${canWord}` : zeroWord;
    }
    this.recalcDistribTotal();
  },

  applyDistribPreset(presetName) {
    (appState.feedTypes || []).forEach((ft) => {
      if (presetName === 'half_can') {
        this.setFeedTypeDistribSicam(ft.id, 0.5);
      } else if (presetName === 'one_can') {
        this.setFeedTypeDistribSicam(ft.id, 1.0);
      } else if (presetName === 'clear') {
        this.setFeedTypeDistribSicam(ft.id, 0);
      }
    });
    this.recalcDistribTotal();
  },

  recalcDistribTotal() {
    let totalKg = 0;
    let totalCost = 0;
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const canWord = isAr ? 'علبة سيكام' : (isEn ? 'Sicam can(s)' : 'boîte(s) Sicam');
    const zeroWord = isAr ? '0 علبة' : (isEn ? '0 can' : '0 boîte');

    (appState.feedTypes || []).forEach(ft => {
      const input = document.getElementById(`distribKg_${ft.id}`);
      const kg = parseFloat(input?.value) || 0;
      const cans = (kg / 0.667).toFixed(1);
      const hint = document.getElementById(`distribHint_${ft.id}`);
      if (hint) {
        hint.textContent = kg > 0 ? `~${cans} ${canWord}` : zeroWord;
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
    e.preventDefault();
    const date = document.getElementById('distribDate')?.value || this.getTodayStr();

    let totalKg = 0;
    let totalCost = 0;
    const items = [];

    (appState.feedTypes || []).forEach(ft => {
      const input = document.getElementById(`distribKg_${ft.id}`);
      const kg = parseFloat(input?.value) || 0;
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
      this.showToast('Veuillez indiquer au moins une quantité distribuée.', 'warning');
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

    // Mettre à jour la moyenne mobile de consommation journalière
    const recent = appState.feedDistributions.slice(0, 14);
    if (recent.length > 0) {
      const avgKg = recent.reduce((sum, d) => sum + (Number(d.totalKg || d.kg) || 0), 0) / recent.length;
      appState.customDailyFeedKg = parseFloat(avgKg.toFixed(2));
      appState.sicamCansCount = parseFloat((avgKg / 0.667).toFixed(1));
    }

    this.saveState();
    this.closeModal('modalFeedDistribution');
    this.renderAll();

    const details = items.map(it => `${it.kg}kg ${this.getFeedDisplayName(it).split(' ')[0]}`).join(' + ');
    this.showToast(`🌾 Distribution enregistrée : ${details} (Total ${totalKg.toFixed(1)} kg) !`);
  },

  renderFeedStockAdjustModal() {
    const container = document.getElementById('feedStockTypesContainer');
    if (!container) return;

    if (!Array.isArray(appState.feedTypes) || appState.feedTypes.length === 0) {
      appState.feedTypes = [
        { id: 'feed-ble', name: 'Blé', stockKg: 0, pricePerKg: 1.10 },
        { id: 'feed-bouchon', name: 'Aliment ponte (Bouchon)', stockKg: 0, pricePerKg: 1.50 }
      ];
    }

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const currSym = this.getCurrencySymbol();
    const unitKg = isAr ? 'كغ' : 'kg';
    const btnDeleteText = isAr ? '🗑️ حذف' : (isEn ? '🗑️ Delete' : '🗑️ Supprimer');
    const lblStockText = isAr ? 'المخزون بالمستودع (كغ)' : (isEn ? 'Stock in reserve (kg)' : 'Stock en réserve (kg)');
    const lblPriceText = isAr ? `سعر الكيلوغرام (${currSym}/${unitKg})` : (isEn ? `Price per kg (${currSym}/${unitKg})` : `Prix au kg (${currSym}/kg)`);
    const valStockText = isAr ? 'قيمة المخزون :' : (isEn ? 'Stock value:' : 'Valeur du stock :');

    let html = '';
    appState.feedTypes.forEach(ft => {
      const stockKg = Number(ft.stockKg) || 0;
      const priceKg = Number(ft.pricePerKg) || 1.0;
      const subtotal = stockKg * priceKg;
      const displayName = this.getFeedDisplayName(ft);

      html += `
        <div class="feed-stock-row" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.75rem; margin-bottom: 0.65rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
            <strong style="color: var(--text-main); font-size: 0.95rem;">🌾 ${displayName}</strong>
            ${appState.feedTypes.length > 1 ? `
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
    const ft = (appState.feedTypes || []).find(f => f.id === id);
    if (!ft) return;
    if (!confirm(`Voulez-vous vraiment supprimer l'aliment "${ft.name}" ?`)) return;

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

    const breakdownEl = document.getElementById('farmFeedLotsBreakdown');
    const todayKgEl = document.getElementById('farmFeedTodayKg');
    const todayCostEl = document.getElementById('farmFeedTodayCost');
    const stockKgEl = document.getElementById('farmFeedStockKg');

    const feedPriceKg = this.getAverageFeedPricePerKg();
    let totalFarmDailyGrams = 0;
    let lotsHtml = '';

    if (Array.isArray(appState.animals)) {
      appState.animals.forEach(animal => {
        const qty = Number(animal.currentQuantity) || 0;
        if (qty <= 0) return;
        const ageDays = this.calculateAgeInDays(animal.birthDate) + (Number(animal.arrivalAgeDays) || 0);
        const feedData = this.getAgronomicFeedData(animal.species, ageDays, animal.stage, animal.breed);
        totalFarmDailyGrams += qty * feedData.avgGrams;
      });
    }

    const isCustom = appState.feedRationMode !== 'industrial' && appState.customDailyFeedKg > 0;
    const totalFarmDailyKg = isCustom ? appState.customDailyFeedKg : (totalFarmDailyGrams / 1000);
    const totalFarmDailyCost = totalFarmDailyKg * feedPriceKg;

    if (todayKgEl) {
      const isAr = appState.lang === 'ar';
      const cansText = (appState.sicamCansCount !== undefined && appState.sicamCansCount !== null)
        ? (isAr ? ` (~${appState.sicamCansCount} علبة سيكام)` : ` (~${appState.sicamCansCount} boîtes Sicam)`)
        : '';
      const unit = isAr ? 'كغ / يوم' : 'kg / j';
      todayKgEl.textContent = `${totalFarmDailyKg.toFixed(2)} ${unit}${cansText}`;
    }
    if (todayCostEl) {
      const unitCost = appState.lang === 'ar' ? ' / يوم' : ' / j';
      todayCostEl.textContent = `${this.formatMoney(totalFarmDailyCost)}${unitCost}`;
    }

    // Calcul du stock d'aliment restant en réserve
    const totalPurchasedFeedCost = (appState.expenses || [])
      .filter(e => e.category === 'nourriture')
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);

    const feedStockRemainingKg = this.getAvailableFeedStockKg();
    const unitFeedVal = appState.feedStockCostPerKg || feedPriceKg;
    const feedStockRemaining = feedStockRemainingKg * unitFeedVal;

    if (feedStockRemainingKg > 0 || totalPurchasedFeedCost > 0) {
      const isAr = appState.lang === 'ar';
      const isEn = appState.lang === 'en';
      const unit = isAr ? 'كغ' : 'kg';

      const typesBreakdown = (appState.feedTypes || [])
        .map(ft => {
          const shortName = this.getFeedShortName(ft);
          const stock = (Number(ft.stockKg) || 0).toFixed(1);
          return `<span style="white-space: nowrap; display: inline-block;">${shortName} : ${stock} ${unit}</span>`;
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
            <button class="btn btn-sm btn-outline" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; font-weight: 800; color: var(--accent-amber);" onclick="app.openModal('modalFeedDistribution')">
              ${btnDistribText}
            </button>
            <button class="btn btn-sm btn-emerald" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; font-weight: 800;" onclick="app.openModal('modalAdjustFeedStock')">
              ${btnStockText}
            </button>
          </div>
        </div>
      `;
    } else {
      const isAr = appState.lang === 'ar';
      const isEn = appState.lang === 'en';
      const emptyMsg = isAr 
        ? '📦 <strong>مخزون العلف :</strong> لا يوجد أكياس مسجلة في المخزن.'
        : (isEn ? '📦 <strong>Feed stock:</strong> No bags recorded in warehouse.' : '📦 <strong>Stock d\'aliment :</strong> Aucun sac déclaré en réserve.');
      const emptyBtn = isAr
        ? '➕ إدخال مخزون المستودع (مثال: 65 كغ)'
        : (isEn ? '➕ Declare Warehouse Stock (e.g. 65 kg)' : '➕ Déclarer Stock de Réserve (ex: 65 kg)');

      lotsHtml += `
        <div style="grid-column: 1 / -1; background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 0.55rem 0.85rem; font-size: 0.78rem; color: var(--text-main); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <span>${emptyMsg}</span>
          <button class="btn btn-sm btn-primary" style="padding: 0.25rem 0.65rem; font-size: 0.76rem; font-weight: 800;" onclick="app.openModal('modalAdjustFeedStock')">
            ${emptyBtn}
          </button>
        </div>
      `;
    }

    if (stockKgEl) {
      const unit = appState.lang === 'ar' ? 'كغ' : 'kg';
      stockKgEl.textContent = feedStockRemainingKg > 0
        ? `${feedStockRemainingKg.toFixed(1)} ${unit} (${this.formatMoney(feedStockRemaining)})`
        : (appState.lang === 'ar' ? '0.0 كغ بالمخزن' : '0.0 kg en stock');
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
        return name.includes(searchQuery) || breed.includes(searchQuery) || notes.includes(searchQuery) || species.includes(searchQuery) || id.includes(searchQuery);
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
      if (sortMode === 'name_asc') return (a.name || '').localeCompare(b.name || '');
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

      // Calcul du Prix de Vente Conseillé avec +40% de Marge Nette Garantie
      const costHeadNum = parseFloat(costPerCurrentHead) || cumulFeedCost;
      const minMarginFloor = (animal.species === 'poussin') ? 1.500 : ((animal.species === 'canard' || animal.species === 'canard_barbarie') ? 6.000 : 3.500);
      const recommendedSellPrice = Math.max(costHeadNum > 0 ? (costHeadNum / 0.60) : (cumulFeedCost * 1.5 + minMarginFloor), costHeadNum + minMarginFloor);

      const avatarIcon = this.getSpeciesIcon(animal.species);
      const stageBadgeClass = this.getStageBadgeClass(animal.stage);
      const lossesWord = appState.lang === 'ar' ? 'خسائر' : (appState.lang === 'en' ? 'losses' : 'pertes');
      const defaultNotes = appState.lang === 'ar' ? 'لا توجد ملاحظات' : (appState.lang === 'en' ? 'No specific notes' : 'Aucune note particulière');
      const agronomicStageLabel = appState.lang === 'ar' ? feedData.labelAr : (appState.lang === 'en' ? feedData.labelEn : feedData.labelFr);

      const card = document.createElement('div');
      card.className = 'animal-card';
      card.innerHTML = `
        <div class="animal-card-header">
          <div class="animal-title-group">
            <div class="animal-avatar">${avatarIcon}</div>
            <div>
              <h3 class="animal-name">${animal.name}</h3>
              <p class="animal-breed">${animal.breed} &bull; <span class="text-muted">${agronomicStageLabel}</span></p>
            </div>
          </div>
          <span class="stage-badge ${stageBadgeClass}">${this.translateStage(animal.stage)}</span>
        </div>

        <!-- Agronomic Feed & Consumption Header Bar -->
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: var(--radius-md); padding: 0.45rem 0.75rem; margin-bottom: 0.6rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.4rem; font-size: 0.76rem;">
          <span style="color: var(--accent-amber); font-weight: 700;">
            🌾 ${feedData.avgGrams} g / j (${feedData.minGrams} - ${feedData.maxGrams} g)
          </span>
          <span style="color: var(--text-secondary);">
            ${this.t('feed_cumul_label') || 'Cumul mangé'}: <strong class="text-amber">~${cumulFeedKg.toFixed(2)} kg</strong> (~${this.formatMoney(cumulFeedCost)})
          </span>
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
          <div class="animal-stat-col" style="cursor: pointer;" onclick="app.openEditAnimalModal('${animal.id}')" title="Cliquer pour modifier le lot ou le coût initial">
            <span class="lbl">${this.t('card_cost_head')} ✏️</span>
            <span class="val text-amber">${this.formatMoney(costPerCurrentHead)}</span>
            <span style="font-size:0.67rem; color:var(--text-muted); display:block; margin-top:1px;">
              ${appState.lang === 'ar' ? `(إجمالي الدفعة: ${this.formatMoney(totalInvested)})` : (appState.lang === 'en' ? `(Total flock: ${this.formatMoney(totalInvested)})` : `(Total lot: ${this.formatMoney(totalInvested)})`)}
            </span>
            <div style="font-size:0.68rem; color:var(--text-secondary); margin-top:2px;">
              ${Number(animal.costPerHead) > 0 
                ? `🏷️ Achat: ${this.formatMoney(animal.costPerHead)}` 
                : (appState.lang === 'ar' ? '🎁 شراء: 0 د.ت (مجاني)' : '🎁 Achat: 0 DT (Gratuit)')}
            </div>
            ${cumulFeedCost > 0 ? `
              <div style="font-size:0.68rem; color:var(--text-secondary); margin-top:1px; font-weight:600;">
                🌾 +${this.formatMoney(feedPerSubject)} mangé (~${cumulFeedKg.toFixed(2)} kg)
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Recommended Selling Price with +40% Profit -->
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--radius-md); padding: 0.45rem 0.75rem; margin-top: 0.45rem; display: flex; align-items: center; justify-content: space-between; font-size: 0.76rem;">
          <span style="color: var(--text-secondary); font-weight: 600;">🎯 Prix conseillé (+40% marge) :</span>
          <strong style="color: var(--accent-emerald); font-size: 0.95rem;">${this.formatMoney(recommendedSellPrice)} / sujet</strong>
        </div>

        <div class="animal-notes-bar" style="margin-top: 0.5rem;">
          <small class="text-muted">${animal.notes || defaultNotes}</small>
        </div>

        <!-- Actions Rapides Immédiates (-1 Mort / +1 Achat) -->
        <div class="animal-quick-counter-row" style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; background:var(--bg-card); padding:0.5rem 0.75rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle); margin-top:0.4rem;">
          <span style="font-size:0.75rem; font-weight:700; color:var(--text-secondary);">${this.t('card_immediate_action')}</span>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn btn-sm btn-danger" style="padding:0.25rem 0.65rem; font-size:0.78rem; font-weight:800;" title="Déclarer 1 mort" onclick="app.quickMortality('${animal.id}', 1)">
              ${this.t('btn_mortality_one')}
            </button>
            <button class="btn btn-sm btn-primary" style="padding:0.25rem 0.65rem; font-size:0.78rem; font-weight:800;" title="Déclarer 1 achat / naissance" onclick="app.quickAddAnimal('${animal.id}', 1)">
              ${this.t('btn_add_one')}
            </button>
          </div>
        </div>

        <div class="animal-card-actions">
          <button class="btn btn-sm btn-outline flex-1" onclick="app.recordMortalityPrompt('${animal.id}')" title="Déclarer plusieurs pertes">
            ${this.t('btn_mortalities_custom')}
          </button>
          <button class="btn btn-sm btn-outline flex-1" onclick="app.recordPurchasePrompt('${animal.id}')" title="Acheter et ajouter à ce lot">
            ${this.t('btn_purchases_custom')}
          </button>
          <button class="btn btn-sm btn-emerald flex-1" onclick="app.quickSellFromLot('${animal.id}')">
            ${this.t('btn_sell_lot')}
          </button>
          <button class="btn btn-sm btn-secondary" title="Modifier le lot ou le coût" onclick="app.openEditAnimalModal('${animal.id}')" style="display:inline-flex; align-items:center; gap:0.25rem;">
            ✏️
          </button>
          <button class="btn btn-sm btn-danger-outline" title="Supprimer le lot" onclick="app.deleteAnimal('${animal.id}')">
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
    const nameInput = document.getElementById('editAnimalName');
    const breedInput = document.getElementById('editAnimalBreed');
    const qtyInput = document.getElementById('editAnimalQuantity');
    const birthDateInput = document.getElementById('editAnimalBirthDate');
    const arrivalAgeInput = document.getElementById('editAnimalArrivalAgeDays');
    const stageInput = document.getElementById('editAnimalStage');
    const costInput = document.getElementById('editAnimalCostPerHead');
    const notesInput = document.getElementById('editAnimalNotes');

    if (idInput) idInput.value = animal.id;
    if (nameInput) nameInput.value = animal.name || '';
    if (breedInput) breedInput.value = animal.breed || '';
    if (qtyInput) qtyInput.value = animal.currentQuantity || animal.initialQuantity || 1;
    if (birthDateInput) birthDateInput.value = animal.birthDate || this.getTodayStr();
    if (arrivalAgeInput) arrivalAgeInput.value = (animal.arrivalAgeDays !== undefined) ? animal.arrivalAgeDays : 0;
    if (stageInput) stageInput.value = animal.stage || 'Croissance';
    if (costInput) costInput.value = (Number(animal.costPerHead) || 0).toString();
    if (notesInput) notesInput.value = animal.notes || '';

    this.openModal('modalEditAnimal');
  },

  handleSaveEditAnimal(e) {
    e.preventDefault();
    const id = document.getElementById('editAnimalId').value;
    const animal = (appState.animals || []).find(a => a.id === id);
    if (!animal) return;

    const name = document.getElementById('editAnimalName').value.trim();
    const breed = document.getElementById('editAnimalBreed').value.trim() || '-';
    const quantity = parseInt(document.getElementById('editAnimalQuantity').value, 10);
    const birthDate = document.getElementById('editAnimalBirthDate')?.value;
    const arrivalAgeVal = document.getElementById('editAnimalArrivalAgeDays')?.value;
    const arrivalAgeDays = (arrivalAgeVal === '' || isNaN(parseInt(arrivalAgeVal, 10))) ? 0 : Math.max(0, parseInt(arrivalAgeVal, 10));
    const stage = document.getElementById('editAnimalStage')?.value;
    const costVal = document.getElementById('editAnimalCostPerHead').value;
    const costPerHead = (costVal === '' || isNaN(parseFloat(costVal))) ? 0 : Math.max(0, parseFloat(costVal));
    const notes = document.getElementById('editAnimalNotes').value.trim();

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
    this.showToast(isAr ? `تم تحديث "${animal.name}" بنجاح` : `Lot "${animal.name}" mis à jour avec succès !`);

    if (window.appAuth && appAuth.pushData) {
      appAuth.pushData();
    }
  },

  // Calcule automatiquement le prochain identifiant (ex: 1, 2, 3...)
  getNextAnimalId() {
    let maxId = 0;
    (appState.animals || []).forEach(a => {
      const fullText = `${a.name || ''} ${a.id || ''}`;
      const matches = fullText.match(/\d+/g);
      if (matches) {
        matches.forEach(m => {
          const val = parseInt(m, 10);
          if (!isNaN(val) && val > maxId && val < 100000) {
            maxId = val;
          }
        });
      }
    });
    return maxId + 1;
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

    const stage = document.getElementById('animalStage').value || 'Adulte';
    const notes = document.getElementById('animalNotes').value.trim();

    if (!quantity || !birthDate) {
      alert('Veuillez renseigner le nombre de têtes et la date.');
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
    this.showToast(this.t('toast_lot_saved', { name }));
    document.getElementById('formAddAnimal').reset();
    document.getElementById('animalCostPerHead').value = '0';
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

  recordMortalityPrompt(lotId) {
    const lot = appState.animals.find(a => a.id === lotId);
    if (!lot) return;

    const countStr = prompt(`Signaler mortalité pour ${lot.name} (Effectif actuel: ${lot.currentQuantity})\nCombien de pertes à enregistrer ?`, "1");
    if (countStr === null) return;
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count <= 0) {
      alert('Veuillez entrer un nombre positif valide.');
      return;
    }
    if (count > lot.currentQuantity) {
      alert(`Impossible d'enregistrer plus de pertes (${count}) que l'effectif actuel (${lot.currentQuantity}) !`);
      return;
    }

    lot.currentQuantity -= count;
    lot.mortality = (lot.mortality || 0) + count;
    this.saveState();
    this.renderAll();
    this.showToast(this.t('toast_mortality_recorded', { n: count, name: lot.name }), 'error');
  },

  // Action Rapide Immédiate : Déclarer 1 Mort (Le count fait -1 immédiatement)
  quickMortality(lotId, count = 1) {
    const lot = appState.animals.find(a => a.id === lotId);
    if (!lot) return;
    if (lot.currentQuantity < count) {
      this.showToast(`Impossible : effectif actuel (${lot.currentQuantity}) inférieur à ${count}`, 'error');
      return;
    }
    lot.currentQuantity -= count;
    lot.mortality = (lot.mortality || 0) + count;
    this.saveState();
    this.renderAll();
    this.showToast(this.t('toast_quick_mortality', { n: count, name: lot.name, rem: lot.currentQuantity }), 'error');
  },

  // Action Rapide Immédiate : Déclarer 1 Achat / Naissance (Le count fait +1 immédiatement)
  quickAddAnimal(lotId, count = 1) {
    const lot = appState.animals.find(a => a.id === lotId);
    if (!lot) return;
    lot.currentQuantity += count;
    lot.initialQuantity += count;
    this.saveState();
    this.renderAll();
    this.showToast(this.t('toast_quick_add', { n: count, name: lot.name, tot: lot.currentQuantity }));
  },

  // Saisie Achat de Groupe (+X sujets achetés)
  recordPurchasePrompt(lotId) {
    const lot = appState.animals.find(a => a.id === lotId);
    if (!lot) return;
    const countStr = prompt(`Achat de nouveaux animaux pour ${lot.name}\nCombien de sujets achetés à ajouter ?`, "10");
    if (countStr === null) return;
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count <= 0) return;
    const priceStr = prompt(`Prix d'achat unitaire (${CURRENCY_SYMBOLS[appState.currency] || '€'}) :`, (lot.costPerHead || 1.20).toString());
    const unitPrice = parseFloat(priceStr) || 0;

    lot.currentQuantity += count;
    lot.initialQuantity += count;

    if (unitPrice > 0) {
      appState.expenses.unshift({
        id: 'exp-' + Date.now().toString(36),
        date: '2026-10-12',
        category: 'nourriture',
        title: `Achat de ${count} sujets (${lot.breed} - ${lot.name})`,
        quantity: count,
        unitPrice: unitPrice,
        total: count * unitPrice,
        linkedLotId: lot.id
      });
    }

    this.saveState();
    this.renderAll();
    this.showToast(this.t('toast_purchases_recorded', { n: count, breed: lot.breed, tot: lot.currentQuantity }));
  },



  quickSellFromLot(lotId) {
    this.openModal('modalAddSale');
    const select = document.getElementById('saleLotLinked');
    if (select) select.value = lotId;
    this.handleSaleLotSelection(lotId);
  },

  deleteAnimal(lotId) {
    if (confirm('Voulez-vous vraiment supprimer ce lot d\'animaux ?')) {
      if (window.appAuth && typeof appAuth.addDeletedId === 'function') {
        appAuth.addDeletedId(lotId);
      }
      appState.animals = appState.animals.filter(a => a.id !== lotId);
      this.saveState();
      this.renderAll();
      this.showToast('Lot supprimé avec succès.');
    }
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

      tr.innerHTML = `
        <td>${this.formatDateFR(exp.date)}</td>
        <td>${catBadge}</td>
        <td><strong>${displayTitle}</strong></td>
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

  reassignExpenseLot(expId) {
    const exp = (appState.expenses || []).find(e => e.id === expId);
    if (!exp) return;

    const options = [{ id: 'general', name: this.t('opt_general_farm') || 'Frais Généraux (Réparti sur tous les animaux)' }];
    (appState.animals || []).forEach(a => {
      options.push({ id: a.id, name: `[${a.species}] ${a.name} (${a.breed})` });
    });

    const isAr = appState.lang === 'ar';
    const choiceStr = options.map((o, idx) => `${idx + 1}. ${o.name}`).join('\n');
    const msg = isAr 
      ? `اختر الدفعة التي تريد ربط هذه المصاريف بها "${exp.title}" (${this.formatMoney(exp.total)}) :\n\n${choiceStr}\n\nأدخل رقم الخيار :`
      : `Affecter la dépense "${exp.title}" (${this.formatMoney(exp.total)}) à quel lot d'animaux ?\n\n${choiceStr}\n\nEntrez le numéro du lot :`;
    
    const ans = prompt(msg, "1");
    if (!ans) return;

    const idx = parseInt(ans.trim(), 10) - 1;
    if (options[idx]) {
      exp.linkedLotId = options[idx].id;
      this.saveState();
      this.renderAll();
      this.showToast(isAr ? `تم ربط المصاريف بـ : ${options[idx].name}` : `Dépense affectée à : ${options[idx].name}`);
      if (window.appAuth && appAuth.pushData) {
        appAuth.pushData();
      }
    }
  },

  calcExpenseTotal() {
    const q = parseFloat(document.getElementById('expenseQuantity').value) || 0;
    const p = parseFloat(document.getElementById('expenseUnitPrice').value) || 0;
    const totalEl = document.getElementById('expenseTotalCalculated');
    const decimals = appState.currency === 'TND' ? 3 : 2;
    if (totalEl) totalEl.value = (q * p).toFixed(decimals);
  },

  handleExpenseCatChange() {
    const cat = document.getElementById('expenseCategory').value;
    const title = document.getElementById('expenseTitle');
    const feedNotice = document.getElementById('expenseFeedNotice');
    if (feedNotice) {
      feedNotice.style.display = (cat === 'nourriture') ? 'block' : 'none';
      const noticeHtml = this.t('expense_feed_notice');
      if (noticeHtml) feedNotice.innerHTML = noticeHtml;
    }

    if (title) {
      const isAr = appState.lang === 'ar';
      const isEn = appState.lang === 'en';
      if (cat === 'nourriture') {
        title.placeholder = isAr ? 'مثال: 5 أكياس علف بداية، قمح...' : (isEn ? 'e.g. 5 bags starter feed, wheat...' : 'Ex: 5 sacs d\'aliment Démarrage, Blé...');
      } else if (cat === 'veterinaire') {
        title.placeholder = isAr ? 'مثال: تلقيح نيوكاسل، فيتامينات...' : (isEn ? 'e.g. Newcastle vaccine, vitamins...' : 'Ex: Vaccin Newcastle, Vitamines...');
      } else if (cat === 'electricite') {
        title.placeholder = isAr ? 'فاتورة الكهرباء (STEG)' : (isEn ? 'Electricity bill (STEG)' : 'Facture Électricité (STEG)');
      } else if (cat === 'eau') {
        title.placeholder = isAr ? 'فاتورة المياه (SONEDE)' : (isEn ? 'Water bill (SONEDE)' : 'Facture Eau (SONEDE)');
      } else if (cat === 'salaire') {
        title.placeholder = isAr ? 'أجر عامل فلاحي' : (isEn ? 'Farm worker wages' : 'Salaire Ouvrier Agricole');
      } else {
        title.placeholder = isAr ? 'مصاريف صيانة، نشارة...' : (isEn ? 'Maintenance, bedding shavings...' : 'Entretien, copeaux de litière...');
      }
    }
  },

  handleSaveExpense(e) {
    e.preventDefault();
    const category = document.getElementById('expenseCategory').value;
    const date = document.getElementById('expenseDate').value;
    const title = document.getElementById('expenseTitle').value.trim();
    const quantity = parseFloat(document.getElementById('expenseQuantity').value) || 1;
    const unitPrice = parseFloat(document.getElementById('expenseUnitPrice').value) || 0;
    const total = parseFloat(document.getElementById('expenseTotalCalculated').value) || (quantity * unitPrice);
    const linkedLotId = document.getElementById('expenseAnimalLot').value;

    if (!title || !date) {
      alert('Veuillez remplir l\'intitulé et la date.');
      return;
    }

    const newExp = {
      id: 'exp-' + Date.now().toString(36),
      date,
      category,
      title,
      quantity,
      unitPrice,
      total,
      linkedLotId
    };

    appState.expenses.unshift(newExp);
    this.saveState();
    this.closeModal('modalAddExpense');
    this.renderAll();
    this.showToast(this.t('toast_expense_saved', { amount: this.formatMoney(total) }));
    document.getElementById('formAddExpense').reset();
    document.getElementById('expenseQuantity').value = 1;
    document.getElementById('expenseUnitPrice').value = 15;
    this.calcExpenseTotal();
  },

  deleteExpense(expId) {
    if (confirm('Confirmer la suppression de cette dépense ?')) {
      if (window.appAuth && typeof appAuth.addDeletedId === 'function') {
        appAuth.addDeletedId(expId);
      }
      appState.expenses = appState.expenses.filter(e => e.id !== expId);
      this.saveState();
      this.renderAll();
      this.showToast(this.t('toast_expense_deleted'));
    }
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
    const recPriceValEl = document.getElementById('smartRecPriceVal');

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

    // CALCUL DU PRIX DE VENTE CONSEILLÉ POUR GAGNER BEAUCOUP D'ARGENT (+40% marge nette garantie)
    const minProfitMargin = (prodType === 'poussin') ? 1.500 : ((prodType === 'canard') ? 8.000 : 4.500);
    const targetRecPrice = Math.max(costPricePerHead > 0 ? (costPricePerHead / 0.60) : (feedCostPerHead * 1.5 + minProfitMargin), costPricePerHead + minProfitMargin);
    this._lastRecommendedPrice = targetRecPrice;

    // Affichage dans le modal
    if (recPriceValEl) {
      recPriceValEl.textContent = `${this.formatMoney(targetRecPrice)} / sujet (+40% net)`;
    }

    if (stageBadge) {
      const stageName = lang === 'ar' ? feedData.labelAr : (lang === 'en' ? feedData.labelEn : feedData.labelFr);
      stageBadge.textContent = `${stageName} [${days} j]`;
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
        calcNoteEl.textContent = `💡 الجدول العلمي: معدل الاستهلاك اليومي ${feedData.avgGrams} غ/يوم (${feedData.minGrams}-${feedData.maxGrams}غ). التراكمي: ${cumulFeedKg.toFixed(2)} كغ/طائر (~${this.formatMoney(feedCostPerHead)} علف). السعر المقترح يضمن لك ربحاً صافياً ممتازاً.`;
      } else if (lang === 'en') {
        calcNoteEl.textContent = `💡 Scientific table: ${feedData.avgGrams} g/day (${feedData.minGrams}-${feedData.maxGrams}g). Cumulative: ${cumulFeedKg.toFixed(2)} kg/head (~${this.formatMoney(feedCostPerHead)} feed). Recommended price guarantees high profit.`;
      } else {
        calcNoteEl.textContent = `💡 Table agronomique : ${feedData.avgGrams} g/j (${feedData.minGrams}-${feedData.maxGrams}g). Cumul mangé : ${cumulFeedKg.toFixed(2)} kg/sujet (~${this.formatMoney(feedCostPerHead)} aliment). Le prix conseillé assure un gain garanti.`;
      }
    }
  },

  applySmartRecommendedPrice() {
    if (!this._lastRecommendedPrice || this._lastRecommendedPrice <= 0) return;
    const priceInput = document.getElementById('saleUnitPrice');
    if (priceInput) {
      const decimals = appState.currency === 'TND' ? 3 : 2;
      priceInput.value = this._lastRecommendedPrice.toFixed(decimals);
      this.calcSaleTotal();
      const msg = appState.lang === 'ar'
        ? `🎯 تم تطبيق السعر المقترح الممتاز: ${this.formatMoney(this._lastRecommendedPrice)} للرأس!`
        : `🎯 Prix conseillé optimal appliqué : ${this.formatMoney(this._lastRecommendedPrice)} / sujet !`;
      this.showToast(msg);
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
      ageInput.placeholder = 'Automatiquement Adulte (> 6 mois)';
      ageInput.disabled = true;
    } else {
      ageInput.disabled = false;
      if (ageUnit === 'jours') {
        ageInput.placeholder = 'Ex: 21 (jours)';
        if (!ageInput.value) ageInput.value = '21';
      } else if (ageUnit === 'semaines') {
        ageInput.placeholder = 'Ex: 3 (semaines)';
        if (!ageInput.value) ageInput.value = '3';
      } else if (ageUnit === 'mois') {
        ageInput.placeholder = 'Ex: 2 (entre 1 et 6 mois)';
        if (!ageInput.value) ageInput.value = '2';
      }
    }
    this.calcSaleTotal();
  },

  // Egg Quick Buttons (HARA / Unités / Plateaux)
  quickAddEgg(qty, mode) {
    const formatSelect = document.getElementById('saleUnitFormat');
    const qtyInput = document.getElementById('saleQuantity');
    const priceInput = document.getElementById('saleUnitPrice');
    const isTND = appState.currency === 'TND';

    if (mode === 'oeuf') {
      if (formatSelect) formatSelect.value = 'oeuf-unite';
      const cur = parseFloat(qtyInput.value) || 0;
      if (qtyInput) qtyInput.value = (formatSelect.value === 'oeuf-unite' && cur < 20) ? cur + qty : qty;
      if (priceInput && (!priceInput.value || parseFloat(priceInput.value) > 2)) {
        priceInput.value = isTND ? 0.450 : 0.20;
      }
    } else if (mode === 'hara') {
      if (formatSelect) formatSelect.value = 'hara';
      if (qtyInput) qtyInput.value = qty;
      if (priceInput) priceInput.value = isTND ? 1.800 : 0.80;
    } else if (mode === 'plateau') {
      if (formatSelect) formatSelect.value = 'plateau';
      if (qtyInput) qtyInput.value = qty;
      if (priceInput) priceInput.value = isTND ? 13.500 : 5.50;
    }

    this.handleFormatChange();
  },

  quickResetEgg() {
    const qtyInput = document.getElementById('saleQuantity');
    if (qtyInput) qtyInput.value = 0;
    this.calcSaleTotal();
  },

  prefillSale(type) {
    this.openModal('modalAddSale');
    const typeSelect = document.getElementById('saleProductType');
    const formatSelect = document.getElementById('saleUnitFormat');
    const descInput = document.getElementById('saleDescription');
    const priceInput = document.getElementById('saleUnitPrice');
    const qtyInput = document.getElementById('saleQuantity');
    const ageInput = document.getElementById('saleAgeValue');
    const ageUnit = document.getElementById('saleAgeUnit');

    const isTND = appState.currency === 'TND';

    if (type === 'oeufs') {
      typeSelect.value = 'oeufs';
      formatSelect.value = 'hara';
      descInput.value = 'Vente œufs frais de ferme (par HARA de 4 œufs)';
      qtyInput.value = 5; // 5 Haras = 20 eggs
      priceInput.value = isTND ? 1.800 : 0.80;
    } else if (type === 'poussin') {
      typeSelect.value = 'poussin';
      formatSelect.value = 'unite';
      descInput.value = 'Vente poussins démarrés (âge 21 jours)';
      qtyInput.value = 50;
      priceInput.value = isTND ? 3.500 : 1.70;
      if (ageInput) ageInput.value = 21;
      if (ageUnit) ageUnit.value = 'jours';
    } else if (type === 'poulet') {
      typeSelect.value = 'poulet';
      formatSelect.value = 'unite';
      descInput.value = 'Vente poulets fermiers (âge 2 mois)';
      qtyInput.value = 20;
      priceInput.value = isTND ? 18.000 : 8.50;
      if (ageInput) ageInput.value = 2;
      if (ageUnit) ageUnit.value = 'mois';
    }

    this.handleSaleTypeChange();
  },

  handleSaleTypeChange() {
    const type = document.getElementById('saleProductType').value;
    const format = document.getElementById('saleUnitFormat');
    const price = document.getElementById('saleUnitPrice');
    const eggBox = document.getElementById('eggHelperBox');
    const ageRow = document.getElementById('saleAgeRow');
    const smartBox = document.getElementById('saleSmartCalcBox');
    const unitLabel = document.getElementById('saleQtyUnitLabel');
    const ageUnit = document.getElementById('saleAgeUnit');
    const ageInput = document.getElementById('saleAgeValue');
    const isTND = appState.currency === 'TND';

    if (type === 'oeufs') {
      if (eggBox) eggBox.classList.remove('hidden');
      if (ageRow) ageRow.classList.add('hidden');
      if (smartBox) smartBox.classList.add('hidden');
      if (unitLabel) unitLabel.textContent = '(Haras / Plateaux)';
      if (format && !['hara', 'plateau', 'oeuf-unite'].includes(format.value)) {
        format.value = 'hara';
      }
      if (format.value === 'hara') {
        price.value = isTND ? 1.800 : 0.80;
      } else if (format.value === 'plateau') {
        price.value = isTND ? 13.500 : 5.50;
      } else {
        price.value = isTND ? 0.450 : 0.20;
      }
    } else if (type === 'poussin') {
      if (eggBox) eggBox.classList.add('hidden');
      if (ageRow) ageRow.classList.remove('hidden');
      if (smartBox) smartBox.classList.remove('hidden');
      if (unitLabel) unitLabel.textContent = '(Poussins / Sujets)';
      if (format) format.value = 'unite';

      // Options d'âge pour Poussin : Jours ou Semaines
      if (ageUnit) {
        ageUnit.innerHTML = `
          <option value="jours">${this.t('opt_age_days') || 'Jours (ex: 1j, 21j...)'}</option>
          <option value="semaines">${this.t('opt_age_weeks') || 'Semaines (ex: 2 sem...)'}</option>
        `;
        ageUnit.value = 'jours';
      }
      if (ageInput) {
        ageInput.disabled = false;
        ageInput.placeholder = 'Ex: 21 (jours)';
        if (!ageInput.value) ageInput.value = '21';
      }
      price.value = isTND ? 3.500 : 1.70;

    } else if (type === 'poulet') {
      if (eggBox) eggBox.classList.add('hidden');
      if (ageRow) ageRow.classList.remove('hidden');
      if (smartBox) smartBox.classList.remove('hidden');
      if (unitLabel) unitLabel.textContent = '(Poulets / Sujets)';
      if (format) format.value = 'unite';

      // Options d'âge pour Poulet : Mois ou Adulte (> 6 mois)
      if (ageUnit) {
        ageUnit.innerHTML = `
          <option value="mois">${this.t('opt_age_months') || 'Mois (ex: 1 à 6 mois)'}</option>
          <option value="adulte">${this.t('opt_age_adult') || 'Adulte (> 6 mois) [Par défaut si vide]'}</option>
        `;
        ageUnit.value = 'mois';
      }
      if (ageInput) {
        ageInput.disabled = false;
        ageInput.placeholder = 'Âge en mois (ex: 2) ou vide pour Adulte';
      }
      price.value = isTND ? 18.000 : 8.50;

    } else if (type === 'pintade') {
      if (eggBox) eggBox.classList.add('hidden');
      if (ageRow) ageRow.classList.remove('hidden');
      if (smartBox) smartBox.classList.remove('hidden');
      const unitPintade = appState.lang === 'ar' ? '(دجاج الوادي / غرغر)' : (appState.lang === 'en' ? '(Guinea Fowls)' : '(Pintades / Sujets)');
      if (unitLabel) unitLabel.textContent = unitPintade;
      if (format) format.value = 'unite';

      if (ageUnit) {
        ageUnit.innerHTML = `
          <option value="mois">${this.t('opt_age_months') || 'Mois (ex: 1 à 6 mois)'}</option>
          <option value="adulte">${this.t('opt_age_adult') || 'Adulte (> 6 mois) [Par défaut si vide]'}</option>
        `;
        ageUnit.value = 'mois';
      }
      if (ageInput) {
        ageInput.disabled = false;
        ageInput.placeholder = 'Âge en mois (ex: 4) ou vide pour Adulte';
        if (!ageInput.value) ageInput.value = '4';
      }
      price.value = isTND ? 24.000 : 12.00;
    } else if (type === 'canard') {
      if (eggBox) eggBox.classList.add('hidden');
      if (ageRow) ageRow.classList.remove('hidden');
      if (smartBox) smartBox.classList.remove('hidden');
      const unitCanard = appState.lang === 'ar' ? '(البط المسكوفي / بالرأس)' : (appState.lang === 'en' ? '(Muscovy Ducks)' : '(Canards de Barbarie / Sujets)');
      if (unitLabel) unitLabel.textContent = unitCanard;
      if (format) format.value = 'unite';

      if (ageUnit) {
        ageUnit.innerHTML = `
          <option value="mois">${this.t('opt_age_months') || 'Mois (ex: 1 à 6 mois)'}</option>
          <option value="adulte">${this.t('opt_age_adult') || 'Adulte (> 6 mois) [Par défaut si vide]'}</option>
        `;
        ageUnit.value = 'mois';
      }
      if (ageInput) {
        ageInput.disabled = false;
        ageInput.placeholder = 'Âge en mois (ex: 3) ou vide pour Adulte';
        if (!ageInput.value) ageInput.value = '3';
      }
      price.value = isTND ? 32.000 : 16.00;
    }

    this.calcSaleTotal();
  },

  handleFormatChange() {
    const type = document.getElementById('saleProductType').value;
    const format = document.getElementById('saleUnitFormat').value;
    const price = document.getElementById('saleUnitPrice');
    const isTND = appState.currency === 'TND';

    if (type === 'oeufs') {
      if (format === 'hara') {
        price.value = isTND ? 1.800 : 0.80;
      } else if (format === 'plateau') {
        price.value = isTND ? 13.500 : 5.50;
      } else if (format === 'oeuf-unite' || format === 'unite') {
        price.value = isTND ? 0.450 : 0.20;
      }
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
    if (productType === 'poussin') {
      const days = (!isNaN(rawAge) && rawAge > 0) ? (ageUnit === 'semaines' ? rawAge * 7 : rawAge) : 21;
      ageText = `${days} jours`;
    } else if (productType === 'poulet' || productType === 'pintade' || productType === 'canard') {
      const isAdult = ageUnit === 'adulte' || isNaN(rawAge) || rawAge <= 0;
      ageText = isAdult ? 'Adulte (> 6 mois)' : `${rawAge} mois`;
    }

    if (!description || !date) {
      alert('Veuillez renseigner la description et la date.');
      return;
    }

    // Déduction automatique du lot lié
    if (linkedLotId && linkedLotId !== 'none') {
      const lot = appState.animals.find(a => a.id === linkedLotId);
      if (lot && (productType === 'poulet' || productType === 'poussin' || productType === 'pintade' || productType === 'canard' || productType.startsWith('poulet') || productType.startsWith('poussin'))) {
        if (quantity > lot.currentQuantity) {
          if (!confirm(`Attention: La quantité vendue (${quantity} sujets) dépasse l'effectif actuel (${lot.currentQuantity}). Voulez-vous continuer ?`)) {
            return;
          }
        }
        lot.currentQuantity = Math.max(0, lot.currentQuantity - quantity);
      }
    }

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
  },

  deleteSale(saleId) {
    if (confirm('Supprimer cette vente ?')) {
      if (window.appAuth && typeof appAuth.addDeletedId === 'function') {
        appAuth.addDeletedId(saleId);
      }
      appState.sales = appState.sales.filter(s => s.id !== saleId);
      this.saveState();
      this.renderAll();
      this.showToast(this.t('toast_sale_deleted'));
    }
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
    // 1. Cost per Egg
    const layingLots = appState.animals.filter(a => a.species === 'pondeuse').map(a => a.id);
    const eggFeedCost = appState.expenses
      .filter(e => layingLots.includes(e.linkedLotId))
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);
    const totalEggsSold = appState.sales
      .filter(s => s.productType === 'oeufs')
      .reduce((sum, s) => {
        let factor = 1;
        if (s.format === 'plateau') factor = 30;
        else if (s.format === 'hara') factor = 4;
        return sum + (s.quantity * factor);
      }, 0);

    const costEgg = totalEggsSold > 0 ? (eggFeedCost / totalEggsSold).toFixed(2) : '0.12';
    const eggPriceEl = document.getElementById('costPerEgg');
    const eggMarginEl = document.getElementById('marginPerEgg');
    if (eggPriceEl) eggPriceEl.textContent = this.formatMoney(costEgg);
    if (eggMarginEl) eggMarginEl.textContent = this.t('unit_egg_margin');

    // 2. Cost per Chicken (1-6 mois)
    const chickenLots = appState.animals.filter(a => a.species === 'poulet').map(a => a.id);
    const chickenFeedCost = appState.expenses
      .filter(e => chickenLots.includes(e.linkedLotId))
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);
    const chickensSold = appState.sales
      .filter(s => s.productType === 'poulet' || s.productType === 'poulet-croissance')
      .reduce((sum, s) => sum + s.quantity, 0);

    const costChicken = chickensSold > 0 ? (chickenFeedCost / chickensSold).toFixed(2) : '3.80';
    const chickenPriceEl = document.getElementById('costPerChicken');
    const chickenMarginEl = document.getElementById('marginPerChicken');
    if (chickenPriceEl) chickenPriceEl.textContent = this.formatMoney(costChicken);
    if (chickenMarginEl) chickenMarginEl.textContent = this.t('unit_chicken_margin');

    // 3. Cost per Chick (Poussins Démarrage)
    const chickLots = appState.animals.filter(a => a.species === 'poussin').map(a => a.id);
    const chickFeedCost = appState.expenses
      .filter(e => chickLots.includes(e.linkedLotId))
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);
    const chicksSold = appState.sales
      .filter(s => s.productType === 'poussin' || s.productType === 'poussin-1j' || s.productType === 'poussin-demarre')
      .reduce((sum, s) => sum + s.quantity, 0);

    const costChicks = chicksSold > 0 ? (chickFeedCost / chicksSold).toFixed(2) : '0.85';
    const chicksPriceEl = document.getElementById('costPerChicks');
    const chicksMarginEl = document.getElementById('marginPerChicks');
    if (chicksPriceEl) chicksPriceEl.textContent = this.formatMoney(costChicks);
    if (chicksMarginEl) chicksMarginEl.textContent = this.t('unit_chicks_margin');
  },

  handleSimTypeChange() {
    const type = document.getElementById('simType')?.value;
    const saleInput = document.getElementById('simSalePrice');
    const costInput = document.getElementById('simUnitCost');
    const qtyInput = document.getElementById('simQuantity');
    const isTND = appState.currency === 'TND';

    if (!saleInput || !costInput) return;

    if (type === 'poulet-croissance' || type === 'poulet') {
      if (qtyInput) qtyInput.value = 100;
      saleInput.value = isTND ? 18.000 : 8.50;
      costInput.value = isTND ? 10.500 : 4.80;
    } else if (type === 'poulet-adulte') {
      if (qtyInput) qtyInput.value = 50;
      saleInput.value = isTND ? 25.000 : 12.00;
      costInput.value = isTND ? 14.000 : 6.50;
    } else if (type === 'pintade') {
      if (qtyInput) qtyInput.value = 50;
      saleInput.value = isTND ? 24.000 : 12.00;
      costInput.value = isTND ? 13.500 : 6.50;
    } else if (type === 'canard') {
      if (qtyInput) qtyInput.value = 30;
      saleInput.value = isTND ? 32.000 : 16.00;
      costInput.value = isTND ? 16.500 : 8.00;
    } else if (type === 'poussin-1j') {
      if (qtyInput) qtyInput.value = 200;
      saleInput.value = isTND ? 2.200 : 1.10;
      costInput.value = isTND ? 0.900 : 0.45;
    } else if (type === 'poussin-demarre' || type === 'poussin') {
      if (qtyInput) qtyInput.value = 150;
      saleInput.value = isTND ? 3.800 : 1.90;
      costInput.value = isTND ? 1.800 : 0.90;
    } else if (type === 'oeuf-plateau' || type === 'oeuf') {
      if (qtyInput) qtyInput.value = 50;
      saleInput.value = isTND ? 13.500 : 5.00;
      costInput.value = isTND ? 7.200 : 2.75;
    } else if (type === 'oeuf-hara') {
      if (qtyInput) qtyInput.value = 100;
      saleInput.value = isTND ? 1.800 : 0.75;
      costInput.value = isTND ? 0.950 : 0.35;
    } else if (type === 'oeuf-unite') {
      if (qtyInput) qtyInput.value = 300;
      saleInput.value = isTND ? 0.450 : 0.20;
      costInput.value = isTND ? 0.240 : 0.10;
    }
    this.runSimulator();
  },

  // Interactive Live Simulator
  runSimulator() {
    const q = parseFloat(document.getElementById('simQuantity')?.value) || 0;
    const saleP = parseFloat(document.getElementById('simSalePrice')?.value) || 0;
    const costP = parseFloat(document.getElementById('simUnitCost')?.value) || 0;

    const totalRev = q * saleP;
    const totalCost = q * costP;
    const netProfit = totalRev - totalCost;
    const marginPct = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : 0;

    const revEl = document.getElementById('simTotalRev');
    const costEl = document.getElementById('simTotalCost');
    const profitEl = document.getElementById('simNetProfit');
    const marginEl = document.getElementById('simMarginPct');

    if (revEl) revEl.textContent = this.formatMoney(totalRev);
    if (costEl) costEl.textContent = this.formatMoney(totalCost);
    if (profitEl) {
      profitEl.textContent = (netProfit >= 0 ? '+' : '') + this.formatMoney(netProfit);
      profitEl.className = `sim-res-val bold ${netProfit >= 0 ? 'text-emerald' : 'text-rose'}`;
    }
    if (marginEl) {
      marginEl.textContent = `${marginPct}%`;
      marginEl.style.color = marginPct >= 0 ? 'var(--primary)' : 'var(--accent-rose)';
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
    const machineRow = document.getElementById('machineParamsRow');
    const notes = document.getElementById('batchNotes');
    if (method === 'poule') {
      if (machineRow) machineRow.style.display = 'none';
      if (notes && !notes.value) notes.value = 'Incubation naturelle (21 jours +/- 2j)';
    } else {
      if (machineRow) machineRow.style.display = 'flex';
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
    const temp = parseFloat(document.getElementById('batchTemp')?.value) || 37.7;
    const humidity = parseInt(document.getElementById('batchHumidity')?.value, 10) || 48;
    const notes = document.getElementById('batchNotes')?.value.trim() || '';

    if (!breed || !name || !eggsCount || !startDate) {
      alert('Veuillez remplir les informations obligatoires.');
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
      alert('Veuillez entrer un nombre positif de poussins.');
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
    if (confirm('Voulez-vous supprimer ce lot d\'incubation ?')) {
      if (window.appAuth && typeof appAuth.addDeletedId === 'function') {
        appAuth.addDeletedId(batchId);
      }
      appState.incubatorBatches = appState.incubatorBatches.filter(b => b.id !== batchId);
      this.saveState();
      this.renderAll();
      this.showToast(this.t('toast_batch_deleted'));
    }
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
    const lang = appState.lang || 'fr';
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
    const lang = appState.lang || 'fr';
    if (lang === 'ar') {
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

    const lang = appState.lang || 'fr';

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
      const translatedLotName = this.getTranslatedLotName(flock.name);
      const translatedBreed = this.getTranslatedBreed(flock.breed);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${translatedLotName}</strong></td>
        <td>${translatedBreed}</td>
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
    const lang = appState.lang || 'fr';
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
    if (confirm(this.t('modal_settings_desc') || 'Voulez-vous charger les données de démonstration ?')) {
      appState.animals = JSON.parse(JSON.stringify(SAMPLE_DATA.animals));
      appState.expenses = JSON.parse(JSON.stringify(SAMPLE_DATA.expenses));
      appState.sales = JSON.parse(JSON.stringify(SAMPLE_DATA.sales));
      appState.incubatorBatches = JSON.parse(JSON.stringify(SAMPLE_DATA.incubatorBatches));
      this.saveState();
      this.closeModal('modalDataOptions');
      this.renderAll();
      this.showToast(this.t('toast_demo_loaded') || 'Données de démonstration chargées !');
    }
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
    if (confirm('ATTENTION: Cette action va supprimer toutes vos données. Continuer ?')) {
      appState.animals = [];
      appState.expenses = [];
      appState.sales = [];
      appState.incubatorBatches = [];
      this.saveState();
      this.closeModal('modalDataOptions');
      this.renderAll();
      this.showToast(this.t('toast_data_reset'));
    }
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

  translateStage(stage) {
    if (!stage) return '';
    const lang = appState.lang || 'fr';
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
    return lot ? this.getTranslatedLotName(lot.name) : (this.t('opt_general_farm') || 'Exploitation Générale');
  }
};

// Expose app on global window
window.app = app;
window.appState = appState;

// Initialize Application on DOM Ready or immediately if DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
} else {
  app.init();
}
