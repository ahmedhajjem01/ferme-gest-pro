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
  
  animals: [],
  expenses: [],
  sales: [],
  incubatorBatches: []
};

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
      breed: 'Poulets Beldi Fermiers & Coqs',
      name: 'Bande Poulets Adultes Reproducteurs',
      initialQuantity: 45,
      currentQuantity: 44,
      mortality: 1,
      birthDate: '2026-03-01', // ~7 mois
      costPerHead: 22.000,
      stage: 'Reproduction',
      notes: 'Parc plein air, reproducteurs adultes vigoureux (> 6 mois).'
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
      description: 'Vente 6 Poulets adultes reproducteurs (> 6 mois - par tête)',
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
  },

  // Initialization
  init() {
    this.loadState();
    this.setupListeners();
    this.updateCurrencySymbols();
    this.applyTranslations();
    this.renderAll();
    this.runSimulator();
    if (this.cloudSync) {
      this.cloudSync.init();
    }
  },

  // State Persistence
  saveState() {
    try {
      localStorage.setItem('fermegest_state', JSON.stringify({
        version: '2.2.0-poultry',
        currency: appState.currency,
        lang: appState.lang || 'fr',
        theme: appState.theme,
        animals: appState.animals,
        expenses: appState.expenses,
        sales: appState.sales,
        incubatorBatches: appState.incubatorBatches
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
        appState.currency = parsed.currency || 'TND';
        appState.lang = parsed.lang || 'fr';
        appState.theme = parsed.theme || 'dark';

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

    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) currencySelect.value = appState.currency;

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

    // Currency selector (Desktop & Mobile)
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => {
        appState.currency = e.target.value;
        const mobCur = document.getElementById('mobileCurrencySelect');
        if (mobCur) mobCur.value = e.target.value;
        this.updateCurrencySymbols();
        this.saveState();
        this.renderAll();
        this.runSimulator();
        this.showToast(this.t('toast_currency_changed', { c: appState.currency }));
      });
    }
    const mobileCurrency = document.getElementById('mobileCurrencySelect');
    if (mobileCurrency) {
      mobileCurrency.addEventListener('change', (e) => {
        appState.currency = e.target.value;
        const cur = document.getElementById('currencySelect');
        if (cur) cur.value = e.target.value;
        this.updateCurrencySymbols();
        this.saveState();
        this.renderAll();
        this.runSimulator();
        this.showToast(this.t('toast_currency_changed', { c: appState.currency }));
      });
    }

    // Mobile Hamburger Menu Button
    const mobileMenuBtn = document.getElementById('mobileHeaderMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
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
      prevMonthBtn.addEventListener('click', () => {
        appState.calendarDate.setMonth(appState.calendarDate.getMonth() - 1);
        this.renderCalendar();
      });
    }
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        appState.calendarDate.setMonth(appState.calendarDate.getMonth() + 1);
        this.renderCalendar();
      });
    }

    // Default dates for modals to today
    const todayStr = this.getTodayStr();
    ['animalBirthDate', 'expenseDate', 'saleDate', 'batchStartDate'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = todayStr;
    });

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
      this.populateLotDropdowns();

      if (modalId === 'modalAddAnimal') {
        const nextId = this.getNextAnimalId();
        const animalNameInput = document.getElementById('animalName');
        if (animalNameInput) {
          animalNameInput.placeholder = `Par défaut : ${nextId}`;
        }
        const costInput = document.getElementById('animalCostPerHead');
        if (costInput && (!costInput.value || costInput.value === '0.8' || costInput.value === '0.80')) {
          costInput.value = '20';
        }
        const stageSelect = document.getElementById('animalStage');
        if (stageSelect && !stageSelect.value) {
          stageSelect.value = 'Adulte';
        }
      }
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('hidden');
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
      if (sp === 'adulte') return this.t('chip_poulet_adulte') || 'Adulte';
      if (sp === 'pintade') return this.t('chip_pintade') || 'Pintade';
      if (sp === 'canard' || sp === 'canard_barbarie') return this.t('chip_canard') || 'Canard de Barbarie';
      return sp;
    };

    if (expenseLotSelect) {
      let html = `<option value="general">${this.t('opt_general_farm')}</option>`;
      appState.animals.forEach(a => {
        html += `<option value="${a.id}">[${getSpeciesLabel(a.species)}] ${a.name} (${a.breed})</option>`;
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

    // Check animal stages ready for sale (poulet chair > 35 days)
    appState.animals.forEach(a => {
      if (a.species === 'poulet') {
        const age = this.calculateAgeInDays(a.birthDate);
        if (age >= 35) {
          const div = document.createElement('div');
          div.className = 'alert-card alert-info';
          div.innerHTML = `
            <div>
              <strong>Bande prête pour la vente (${a.name}) :</strong> Âge: ${age} jours (${a.currentQuantity} sujets prêts).
            </div>
            <button class="btn btn-sm btn-outline" style="border:none;" onclick="this.parentElement.remove()">&times;</button>
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
        'poulet-adulte': this.t('preset_chicken_adult') || 'Poulets adultes / Pondeuses',
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
  // ANIMALS (CHEPTEL & RACES) MODULE
  // ==========================================
  renderAnimals(filter = 'all') {
    const grid = document.getElementById('animalsGrid');
    if (!grid) return;
    grid.innerHTML = '';

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

    const filtered = filter === 'all'
      ? appState.animals
      : appState.animals.filter(a => a.species === filter || (filter === 'canard' && a.species === 'canard_barbarie'));

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
        const noMatch = appState.lang === 'ar' ? 'لا توجد دفعات طيور مطابقة لهذا التصنيف.' : (appState.lang === 'en' ? 'No animal batches found for this filter.' : 'Aucun lot d\'animaux trouvé pour ce filtre.');
        grid.innerHTML = `<div class="panel-card" style="grid-column: 1/-1; text-align: center; padding: 2.5rem;"><p class="text-muted">${noMatch}</p></div>`;
      }
      return;
    }

    filtered.forEach(animal => {
      const ageDays = this.calculateAgeInDays(animal.birthDate);
      const ageText = this.formatAgeText(ageDays);
      const mortalityRate = animal.initialQuantity > 0 
        ? ((animal.mortality / animal.initialQuantity) * 100).toFixed(1) 
        : 0;

      // Calculate total feed & expense dedicated to this specific animal lot
      const lotExpenses = appState.expenses
        .filter(e => e.linkedLotId === animal.id)
        .reduce((sum, e) => sum + (Number(e.total) || 0), 0);
      
      const totalAcquisition = animal.initialQuantity * (Number(animal.costPerHead) || 0);
      const totalInvested = totalAcquisition + lotExpenses;
      const costPerCurrentHead = animal.currentQuantity > 0 ? (totalInvested / animal.currentQuantity).toFixed(2) : '0';

      const avatarIcon = this.getSpeciesIcon(animal.species);
      const stageBadgeClass = this.getStageBadgeClass(animal.stage);
      const lossesWord = appState.lang === 'ar' ? 'خسائر' : (appState.lang === 'en' ? 'losses' : 'pertes');
      const defaultNotes = appState.lang === 'ar' ? 'لا توجد ملاحظات' : (appState.lang === 'en' ? 'No specific notes' : 'Aucune note particulière');

      const card = document.createElement('div');
      card.className = 'animal-card';
      card.innerHTML = `
        <div class="animal-card-header">
          <div class="animal-title-group">
            <div class="animal-avatar">${avatarIcon}</div>
            <div>
              <h3 class="animal-name">${animal.name}</h3>
              <p class="animal-breed">${animal.breed} &bull; <span class="text-muted">${this.translateStage(animal.stage)}</span></p>
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
          <div class="animal-stat-col">
            <span class="lbl">${this.t('card_cost_head')}</span>
            <span class="val text-amber">${this.formatMoney(costPerCurrentHead)}</span>
          </div>
        </div>

        <div class="animal-notes-bar">
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
          <button class="btn btn-sm btn-danger-outline" title="Supprimer le lot" onclick="app.deleteAnimal('${animal.id}')">
            🗑️
          </button>
        </div>
      `;
      grid.appendChild(card);
    });
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
    const costPerHead = parseFloat(document.getElementById('animalCostPerHead').value) || 20;
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
    document.getElementById('animalCostPerHead').value = '20';
  },

  // Toggle & gestion du menu mobile (3 lignes dans la barre haute)
  toggleMobileMenu() {
    const drawer = document.getElementById('mobileMenuDrawer');
    if (!drawer) return;
    const isHidden = drawer.classList.contains('hidden');
    if (isHidden) {
      drawer.classList.remove('hidden');
      this.updateMobileMenuControls();
    } else {
      drawer.classList.add('hidden');
    }
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
    const lot = appState.animals.find(a => a.id === lotId);
    if (lot) {
      const typeSelect = document.getElementById('saleProductType');
      if (lot.species === 'poulet' && typeSelect) typeSelect.value = 'poulet-croissance';
      if (lot.species === 'pondeuse' && typeSelect) typeSelect.value = 'oeufs';
      if (lot.species === 'poussin' && typeSelect) typeSelect.value = 'poussin-1j';
      if (lot.species === 'adulte' && typeSelect) typeSelect.value = 'poulet-adulte';
      if (lot.species === 'pintade' && typeSelect) typeSelect.value = 'pintade';
      if ((lot.species === 'canard' || lot.species === 'canard_barbarie') && typeSelect) typeSelect.value = 'canard';
      this.handleSaleTypeChange();
    }
  },

  deleteAnimal(lotId) {
    if (confirm('Voulez-vous vraiment supprimer ce lot d\'animaux ?')) {
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
      const matchesSearch = e.title.toLowerCase().includes(search);
      const matchesCat = catFilter === 'all' || e.category === catFilter;
      return matchesSearch && matchesCat;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

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

      tr.innerHTML = `
        <td>${this.formatDateFR(exp.date)}</td>
        <td>${catBadge}</td>
        <td><strong>${exp.title}</strong></td>
        <td><small class="badge-pill">${lotName}</small></td>
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
    const cat = document.getElementById('expenseCategory').value;
    const title = document.getElementById('expenseTitle');
    if (cat === 'electricite' && title) title.placeholder = this.t('opt_exp_elec');
    else if (cat === 'eau' && title) title.placeholder = this.t('opt_exp_water');
    else if (cat === 'salaire' && title) title.placeholder = this.t('opt_exp_sal');
    else if (cat === 'nourriture' && title) title.placeholder = this.t('opt_exp_food');
    else if (cat === 'veterinaire' && title) title.placeholder = this.t('opt_exp_vet');
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

    const sorted = [...appState.sales].sort((a, b) => new Date(b.date) - new Date(a.date));

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
      
      // Calculate estimated net margin for this sale based on linked lot feed costs
      const estimatedMargin = this.calcSaleEstimatedMargin(sale);

      tr.innerHTML = `
        <td>${this.formatDateFR(sale.date)}</td>
        <td>${prodBadge}</td>
        <td><strong>${sale.description}</strong></td>
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
    const q = parseFloat(document.getElementById('saleQuantity')?.value) || 0;
    const p = parseFloat(document.getElementById('saleUnitPrice')?.value) || 0;
    const totalEl = document.getElementById('saleTotalCalculated');
    const decimals = appState.currency === 'TND' ? 3 : 2;
    const total = q * p;
    if (totalEl) totalEl.value = total.toFixed(decimals);

    const prodType = document.getElementById('saleProductType')?.value;
    const format = document.getElementById('saleUnitFormat')?.value;

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
        const lang = appState.lang || 'fr';
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

    // 2. Volailles (Poussins & Poulets) : Calcul Intelligent d'Alimentation & Marge Réelle
    const rawAge = parseFloat(document.getElementById('saleAgeValue')?.value);
    const ageUnit = document.getElementById('saleAgeUnit')?.value || 'jours';
    const lang = appState.lang || 'fr';

    const stageBadge = document.getElementById('smartStageBadge');
    const feedKgEl = document.getElementById('smartFeedKg');
    const feedCostEl = document.getElementById('smartFeedCost');
    const netProfitEl = document.getElementById('smartNetProfit');
    const marginPctEl = document.getElementById('smartMarginPct');
    const calcNoteEl = document.getElementById('smartCalcNote');

    // Prix moyen de l'aliment en Tunisie (~1.500 DT/kg)
    const feedPricePerKg = 1.500;

    if (prodType === 'poussin') {
      // Âge en jours
      let days = 21;
      if (!isNaN(rawAge) && rawAge > 0) {
        days = ageUnit === 'semaines' ? Math.round(rawAge * 7) : Math.round(rawAge);
      }

      // Consommation cumulative standard d'aliment par poussin selon l'âge
      let feedKgPerChick = 0;
      if (days <= 1) {
        feedKgPerChick = 0.00; // Sac vitellin
      } else if (days <= 7) {
        feedKgPerChick = days * 0.015;
      } else if (days <= 14) {
        feedKgPerChick = 0.105 + (days - 7) * 0.035;
      } else if (days <= 21) {
        // À 21 jours (~3 semaines) : environ 0.70 - 0.75 kg mangé par poussin
        feedKgPerChick = 0.350 + (days - 14) * 0.055;
      } else if (days <= 28) {
        feedKgPerChick = 0.735 + (days - 21) * 0.075;
      } else {
        feedKgPerChick = 1.260 + (days - 28) * 0.090;
      }

      const totalFeedKg = q * feedKgPerChick;
      const totalFeedCost = totalFeedKg * feedPricePerKg;
      const netProfit = total - totalFeedCost;
      const marginPct = total > 0 ? ((netProfit / total) * 100).toFixed(1) : 0;

      if (stageBadge) {
        if (lang === 'ar') stageBadge.textContent = `🐣 كتكوت: ${days} يوم [${Math.floor(days / 7)} أسابيع]`;
        else if (lang === 'en') stageBadge.textContent = `🐣 Chick: ${days} day(s) [${Math.floor(days / 7)} wks]`;
        else stageBadge.textContent = `🐣 Poussin : ${days} jour(s) [${Math.floor(days / 7)} sem.]`;
      }
      if (feedKgEl) {
        const perUnit = lang === 'ar' ? 'كغ/كتكوت' : (lang === 'en' ? 'kg/chick' : 'kg/poussin');
        feedKgEl.textContent = `${totalFeedKg.toFixed(1)} kg (~${feedKgPerChick.toFixed(2)} ${perUnit})`;
      }
      if (feedCostEl) feedCostEl.textContent = this.formatMoney(totalFeedCost);
      if (netProfitEl) {
        netProfitEl.textContent = (netProfit >= 0 ? '+' : '') + this.formatMoney(netProfit);
        netProfitEl.className = `stat-val bold ${netProfit >= 0 ? 'text-emerald' : 'text-rose'}`;
      }
      if (marginPctEl) marginPctEl.textContent = `${marginPct}%`;
      if (calcNoteEl) {
        if (lang === 'ar') calcNoteEl.textContent = `💡 استهلك ${q} من الكتاكيت عمر ${days} يوم حوالي ~${totalFeedKg.toFixed(1)} كغ من العلف (~${this.formatMoney(totalFeedCost)}).`;
        else if (lang === 'en') calcNoteEl.textContent = `💡 For ${q} chicks aged ${days} days, estimated feed consumed is ~${totalFeedKg.toFixed(1)} kg (~${this.formatMoney(totalFeedCost)}).`;
        else calcNoteEl.textContent = `💡 Pour ${q} poussins âgés de ${days} jours, ils ont consommé ~${totalFeedKg.toFixed(1)} kg d'aliment (~${this.formatMoney(totalFeedCost)}).`;
      }

    } else if (prodType === 'poulet' || prodType === 'pintade' || prodType === 'canard') {
      const isPintade = prodType === 'pintade';
      const isCanard = prodType === 'canard';
      // Si aucun âge n'est précisé, AUTOMATIQUEMENT considéré comme ADULTE (> 6 mois)
      const isAdult = ageUnit === 'adulte' || isNaN(rawAge) || rawAge <= 0;
      let months = isAdult ? 6 : Math.min(Math.max(rawAge, 1), 6);

      let feedKgPerSubject = 0;
      if (isAdult) {
        feedKgPerSubject = isCanard ? 13.5 : (isPintade ? 10.0 : 11.5);
      } else if (months <= 1) {
        feedKgPerSubject = isCanard ? 1.80 : 1.30;
      } else if (months <= 2) {
        feedKgPerSubject = isCanard ? 4.80 : 3.60;
      } else if (months <= 3) {
        feedKgPerSubject = isCanard ? 8.20 : 6.20;
      } else if (months <= 4) {
        feedKgPerSubject = isCanard ? 10.80 : 8.50;
      } else if (months <= 5) {
        feedKgPerSubject = isCanard ? 12.20 : 9.50;
      } else {
        feedKgPerSubject = isCanard ? 13.50 : 10.00;
      }

      const totalFeedKg = q * feedKgPerSubject;
      const totalFeedCost = totalFeedKg * 1.450;
      const netProfit = total - totalFeedCost;
      const marginPct = total > 0 ? ((netProfit / total) * 100).toFixed(1) : 0;

      if (stageBadge) {
        if (lang === 'ar') stageBadge.textContent = isCanard ? (isAdult ? '🦆 بط مسكوفي بالغ (> 6 أشهر)' : `🦆 بط مسكوفي: ${months} أشهر`) : (isPintade ? (isAdult ? '🪶 دجاج الوادي بالغ (> 6 أشهر)' : `🪶 دجاج الوادي: ${months} أشهر`) : (isAdult ? '🐔 دجاج بالغ / أمهات (> 6 أشهر)' : `🍗 دجاج: ${months} أشهر`));
        else if (lang === 'en') stageBadge.textContent = isCanard ? (isAdult ? '🦆 Adult Muscovy Duck (> 6 mos)' : `🦆 Muscovy Duck: ${months} months`) : (isPintade ? (isAdult ? '🪶 Adult Guinea Fowl (> 6 mos)' : `🪶 Guinea Fowl: ${months} months`) : (isAdult ? '🐔 Adult Chicken (> 6 months)' : `🍗 Chicken: ${months} months`));
        else stageBadge.textContent = isCanard ? (isAdult ? '🦆 Canard Barbarie Adulte (> 6 mois)' : `🦆 Canard Barbarie : ${months} mois`) : (isPintade ? (isAdult ? '🪶 Pintade Adulte (> 6 mois)' : `🪶 Pintade : ${months} mois`) : (isAdult ? '🐔 Poulet Adulte (> 6 mois)' : `🍗 Poulet : ${months} mois`));
      }
      if (feedKgEl) {
        const perSubject = lang === 'ar' ? (isCanard ? 'كغ/بطة' : (isPintade ? 'كغ/طائر' : 'كغ/دجاجة')) : (lang === 'en' ? (isCanard ? 'kg/duck' : 'kg/bird') : (isCanard ? 'kg/canard' : (isPintade ? 'kg/pintade' : 'kg/poulet')));
        feedKgEl.textContent = `${totalFeedKg.toFixed(1)} kg (~${feedKgPerSubject.toFixed(2)} ${perSubject})`;
      }
      if (feedCostEl) feedCostEl.textContent = this.formatMoney(totalFeedCost);
      if (netProfitEl) {
        netProfitEl.textContent = (netProfit >= 0 ? '+' : '') + this.formatMoney(netProfit);
        netProfitEl.className = `stat-val bold ${netProfit >= 0 ? 'text-emerald' : 'text-rose'}`;
      }
      if (marginPctEl) marginPctEl.textContent = `${marginPct}%`;
      if (calcNoteEl) {
        const subjName = isCanard ? (lang === 'ar' ? 'بط مسكوفي' : (lang === 'en' ? 'Muscovy Duck' : 'Canard de Barbarie')) : (isPintade ? (lang === 'ar' ? 'دجاج الوادي' : (lang === 'en' ? 'Guinea Fowl' : 'Pintade')) : (lang === 'ar' ? 'دجاج' : (lang === 'en' ? 'Chicken' : 'Poulet')));
        if (lang === 'ar') {
          calcNoteEl.textContent = isAdult
            ? `💡 لم يُحدد العمر: حساب آلي لـ ${subjName} بالغ (> 6 أشهر، ~${feedKgPerSubject} كغ علف/طائر).`
            : `💡 حساب ذكي لـ ${subjName} عمر ${months} أشهر: استهلاك مقدر بـ ~${totalFeedKg.toFixed(1)} كغ من العلف.`;
        } else if (lang === 'en') {
          calcNoteEl.textContent = isAdult
            ? `💡 No age specified: automatic calculation for Adult ${subjName} (> 6 months, ~${feedKgPerSubject} kg feed/bird).`
            : `💡 Smart calculation for ${months} mo. ${subjName}: ~${totalFeedKg.toFixed(1)} kg feed consumed.`;
        } else {
          calcNoteEl.textContent = isAdult
            ? `💡 Aucun âge précisé : calcul automatique pour ${subjName} Adulte (> 6 mois, ~${feedKgPerSubject} kg aliment/sujet).`
            : `💡 Calcul intelligent pour ${subjName}s de ${months} mois : ~${totalFeedKg.toFixed(1)} kg d'aliments consommés.`;
        }
      }
    }
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
    this.saveState();
    this.closeModal('modalAddSale');
    this.renderAll();
    this.showToast(this.t('toast_sale_saved', { amount: this.formatMoney(total) }));
    document.getElementById('formAddSale').reset();
  },

  deleteSale(saleId) {
    if (confirm('Supprimer cette vente ?')) {
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
      'poulet-adulte': this.t('matrix_cat_poulet_adulte') || '🐔 Poulets Adultes & Pondeuses',
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
          existingFlock.notes = (existingFlock.notes || '') + ` [Ajout +${liveCount} poussins nés le 12/10/2026 de ${batch.name}]`;
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
    const newFlock = {
      id: 'lot-chick-' + Date.now().toString(36),
      species: batch.eggSpecies === 'poule' ? 'poussin' : (batch.eggSpecies === 'pintade' ? 'pintade' : ((batch.eggSpecies === 'canard' || batch.eggSpecies === 'canard_barbarie') ? 'canard' : 'autre')),
      breed: batch.breed,
      name: `Génération Éclose (${batch.name} - ${methodTag})`,
      initialQuantity: liveCount,
      currentQuantity: liveCount,
      mortality: 0,
      birthDate: '2026-10-12',
      costPerHead: batch.method === 'poule' ? 0.20 : 0.40,
      stage: 'Démarrage',
      notes: `Éclos le 12/10/2026 (${liveCount} poussins sortis de ${batch.eggsCount} œufs mis à couver via ${methodTag}).`
    };
    appState.animals.unshift(newFlock);
  },

  convertBatchToFlock(batchId) {
    this.triggerHatchNotification(batchId);
  },

  deleteIncubatorBatch(batchId) {
    if (confirm('Voulez-vous supprimer ce lot d\'incubation ?')) {
      appState.incubatorBatches = appState.incubatorBatches.filter(b => b.id !== batchId);
      this.saveState();
      this.renderAll();
      this.showToast(this.t('toast_batch_deleted'));
    }
  },

  // ==========================================
  // CALENDAR & GENERATIONS LIFECYCLE
  // ==========================================
  renderCalendar() {
    this.renderGenerationsTable();
    this.renderMonthlyCalendarGrid();
  },

  renderGenerationsTable() {
    const tbody = document.getElementById('generationsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const poultry = appState.animals.filter(a => a.species === 'poulet' || a.species === 'pondeuse' || a.species === 'poussin' || a.species === 'pintade' || a.species === 'canard');

    if (poultry.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Aucune génération de volailles enregistrée.</td></tr>';
      return;
    }

    poultry.forEach(flock => {
      const ageDays = this.calculateAgeInDays(flock.birthDate);
      const stageInfo = this.getPoultryDevelopmentStage(ageDays, flock.species);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${flock.name}</strong></td>
        <td>${flock.breed}</td>
        <td>${this.formatDateFR(flock.birthDate)}</td>
        <td><span class="badge-tag text-emerald">${ageDays} jours (${Math.floor(ageDays / 7)} sem.)</span></td>
        <td><span class="stage-badge ${this.getStageBadgeClass(flock.stage)}">${flock.stage}</span></td>
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

    // Poulet de chair
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
    if (lang === 'ar') return { feed: 'علف ناهي بدون أدوية', nextEvent: 'الموعد المثالي للبيع/الذبح (40-45 يوماً)' };
    if (lang === 'en') return { feed: 'Finisher Feed (Withdrawal)', nextEvent: 'Optimal Harvest Date (D+40 to D+45)' };
    return { feed: 'Aliment Finition sans médicament', nextEvent: 'Date optimale d\'abattage / Vente (J+40 à J+45)' };
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

  exportExcelCSV() {
    this.exportExcel();
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

  exportDataJSON() {
    const data = {
      exportDate: new Date().toISOString(),
      currency: appState.currency,
      lang: appState.lang,
      animals: appState.animals,
      expenses: appState.expenses,
      sales: appState.sales,
      incubatorBatches: appState.incubatorBatches
    };

    const jsonStr = JSON.stringify(data, null, 2);

    if (window.MobileBridge && window.MobileBridge.isNative) {
      window.MobileBridge.shareData({
        title: 'Sauvegarde FermeGest PRO',
        text: jsonStr,
        dialogTitle: 'Partager / Sauvegarder FermeGest PRO'
      });
      this.showToast(this.t('toast_backup_exported') || 'Fichier de sauvegarde prêt au partage.');
      return;
    }

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fermegest_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast(this.t('toast_backup_exported') || 'Fichier de sauvegarde téléchargé.');
  },

  importDataJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.animals && parsed.expenses && parsed.sales) {
          appState.animals = parsed.animals;
          appState.expenses = parsed.expenses;
          appState.sales = parsed.sales;
          appState.incubatorBatches = parsed.incubatorBatches || [];
          if (parsed.currency) appState.currency = parsed.currency;
          if (parsed.lang) appState.lang = parsed.lang;

          this.saveState();
          this.closeModal('modalDataOptions');
          this.renderAll();
          this.showToast('✅ Data restored successfully!');
        } else {
          alert('Fichier JSON invalide. Structure non reconnue.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON : ' + err.message);
      }
    };
    reader.readAsText(file);
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
      case 'adulte': return '🐔';
      case 'pintade': return '🪶';
      case 'canard':
      case 'canard_barbarie': return '🦆';
      default: return '🐤';
    }
  },

  translateStage(stage) {
    if (!stage) return '';
    switch (stage) {
      case 'Démarrage': return (this.t('opt_stage_start') || 'Démarrage').split(' (')[0];
      case 'Croissance': return (this.t('opt_stage_growth') || 'Croissance').split(' (')[0];
      case 'Finition': return (this.t('opt_stage_finish') || 'Finition').split(' /')[0];
      case 'Adulte':
      case 'Ponte':
      case 'Reproduction': return (this.t('opt_stage_adulte') || 'Adulte');
      default: return stage;
    }
  },

  getStageBadgeClass(stage) {
    switch (stage) {
      case 'Démarrage': return 'badge-stage-start';
      case 'Croissance': return 'badge-stage-growth';
      case 'Finition': return 'badge-stage-finish';
      case 'Adulte':
      case 'Ponte':
      case 'Reproduction': return 'badge-stage-repro';
      default: return 'badge-stage-growth';
    }
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
      case 'poulet-adulte': return `<span class="badge-tag text-emerald">🐔 ${this.t('preset_chicken_adult')}</span>`;
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
    return lot ? lot.name : (this.t('opt_general_farm') || 'Exploitation Générale');
  },

  // =========================================================================
  // Cloud Sync Controller (Supabase Multi-Device Realtime Engine)
  // =========================================================================
  cloudSync: {
    client: null,
    realtimeChannel: null,
    config: {
      enabled: false,
      url: '',
      key: '',
      farmCode: 'ferme-principale',
      autoSync: true
    },
    lastSyncedAt: null,
    isSyncing: false,

    init() {
      this.loadConfig();
      this.populateForm();
      this.updateStatusUI();

      if (this.config.enabled && this.config.url && this.config.key) {
        this.initClient();
      }

      // Re-sync on network reconnect or when switching back to tab
      window.addEventListener('online', () => {
        if (this.config.enabled) {
          this.pullFromCloud(true);
        }
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.config.enabled) {
          this.pullFromCloud(true);
        }
      });
    },

    loadConfig() {
      try {
        const saved = localStorage.getItem('fermegest_cloud_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.config = Object.assign({}, this.config, parsed);
        }
      } catch (e) {
        console.warn('Could not read cloud config:', e);
      }
    },

    saveConfig() {
      try {
        localStorage.setItem('fermegest_cloud_config', JSON.stringify(this.config));
      } catch (e) {
        console.warn('Could not save cloud config:', e);
      }
    },

    populateForm() {
      const urlInput = document.getElementById('cloudSupabaseUrl');
      const keyInput = document.getElementById('cloudSupabaseKey');
      const codeInput = document.getElementById('cloudFarmCode');
      const autoSyncCheck = document.getElementById('cloudAutoSync');

      if (urlInput) urlInput.value = this.config.url || '';
      if (keyInput) keyInput.value = this.config.key || '';
      if (codeInput) codeInput.value = this.config.farmCode || 'ferme-principale';
      if (autoSyncCheck) autoSyncCheck.checked = this.config.autoSync !== false;
    },

    openModal() {
      this.populateForm();
      this.updateStatusUI();
      app.openModal('modalCloudSync');
    },

    initClient() {
      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        console.warn('Supabase JS SDK not loaded yet');
        return;
      }
      try {
        this.client = window.supabase.createClient(this.config.url, this.config.key, {
          auth: { persistSession: false }
        });
        this.subscribeRealtime();
        this.pullFromCloud(true);
      } catch (e) {
        console.error('Failed to create Supabase client:', e);
        this.updateStatusUI('error');
      }
    },

    subscribeRealtime() {
      if (!this.client || !this.config.farmCode) return;
      if (this.realtimeChannel) {
        try { this.client.removeChannel(this.realtimeChannel); } catch (e) {}
      }

      try {
        this.realtimeChannel = this.client
          .channel(`farm_sync_${this.config.farmCode}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'farm_sync',
              filter: `farm_id=eq.${this.config.farmCode}`
            },
            (payload) => {
              if (payload.new && payload.new.data) {
                this.applyCloudData(payload.new.data, payload.new.updated_at);
                this.lastSyncedAt = new Date();
                this.updateStatusUI('connected');
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('Realtime subscription error:', e);
      }
    },

    async saveAndConnect() {
      const urlInput = document.getElementById('cloudSupabaseUrl');
      const keyInput = document.getElementById('cloudSupabaseKey');
      const codeInput = document.getElementById('cloudFarmCode');
      const autoSyncCheck = document.getElementById('cloudAutoSync');

      const url = urlInput ? urlInput.value.trim().replace(/\/+$/, '') : '';
      const key = keyInput ? keyInput.value.trim() : '';
      const farmCode = codeInput ? codeInput.value.trim() : 'ferme-principale';
      const autoSync = autoSyncCheck ? autoSyncCheck.checked : true;

      if (!url || !key || !farmCode) {
        app.showToast('Veuillez remplir l\'URL, la Clé et le Code Ferme.', 'danger');
        return;
      }

      this.config.url = url;
      this.config.key = key;
      this.config.farmCode = farmCode;
      this.config.autoSync = autoSync;
      this.config.enabled = true;
      this.saveConfig();

      if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        app.showToast('Le SDK Supabase n\'a pas pu être chargé. Vérifiez votre connexion Internet.', 'danger');
        return;
      }

      this.updateStatusUI('syncing');

      try {
        this.client = window.supabase.createClient(url, key, {
          auth: { persistSession: false }
        });

        // Test connection by attempting to read table
        const { data, error } = await this.client
          .from('farm_sync')
          .select('farm_id, data, updated_at')
          .eq('farm_id', farmCode)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data && data.data) {
          this.applyCloudData(data.data, data.updated_at);
          app.showToast(app.t('toast_cloud_connected') || 'Connecté avec succès au Cloud !');
        } else {
          // Push current state to initialize cloud record
          await this.pushToCloud(false);
          app.showToast(app.t('toast_cloud_connected') || 'Connecté ! Données initialisées sur le Cloud.');
        }

        this.lastSyncedAt = new Date();
        this.updateStatusUI('connected');
        this.subscribeRealtime();
      } catch (err) {
        console.error('Supabase connection test failed:', err);
        this.updateStatusUI('error');
        const msg = err.message ? `Erreur Supabase: ${err.message}` : (app.t('toast_cloud_error') || 'Erreur de connexion');
        app.showToast(msg, 'danger');
      }
    },

    async pushToCloud(showToast = false) {
      if (!this.client || !this.config.enabled || !this.config.farmCode) return;
      if (this.isSyncing) return;
      this.isSyncing = true;
      this.updateStatusUI('syncing');

      const payload = {
        version: '2.2.0-poultry',
        currency: appState.currency,
        lang: appState.lang || 'fr',
        theme: appState.theme,
        animals: appState.animals,
        expenses: appState.expenses,
        sales: appState.sales,
        incubatorBatches: appState.incubatorBatches,
        timestamp: Date.now()
      };

      try {
        const { error } = await this.client
          .from('farm_sync')
          .upsert({
            farm_id: this.config.farmCode,
            data: payload,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        this.lastSyncedAt = new Date();
        this.updateStatusUI('connected');
        if (showToast) {
          app.showToast(app.t('toast_cloud_pushed') || 'Données envoyées au Cloud avec succès !');
        }
      } catch (err) {
        console.error('Push to cloud error:', err);
        this.updateStatusUI('error');
        if (showToast) {
          app.showToast(app.t('toast_cloud_error') || 'Erreur d\'envoi vers le Cloud', 'danger');
        }
      } finally {
        this.isSyncing = false;
      }
    },

    async pullFromCloud(isSilent = false) {
      if (!this.client || !this.config.enabled || !this.config.farmCode) return;
      this.updateStatusUI('syncing');

      try {
        const { data, error } = await this.client
          .from('farm_sync')
          .select('*')
          .eq('farm_id', this.config.farmCode)
          .maybeSingle();

        if (error) throw error;

        if (data && data.data) {
          this.applyCloudData(data.data, data.updated_at);
          this.lastSyncedAt = new Date();
          this.updateStatusUI('connected');
          if (!isSilent) {
            app.showToast(app.t('toast_cloud_pulled') || 'Dernières données du Cloud téléchargées !');
          }
        } else {
          this.updateStatusUI('connected');
          if (!isSilent) {
            app.showToast('Aucune donnée trouvée sur le Cloud pour ce Code Ferme.');
          }
        }
      } catch (err) {
        console.error('Pull from cloud error:', err);
        this.updateStatusUI('error');
        if (!isSilent) {
          app.showToast(app.t('toast_cloud_error') || 'Erreur de téléchargement', 'danger');
        }
      }
    },

    applyCloudData(cloudData, updatedAt) {
      if (!cloudData) return;

      if (cloudData.currency) appState.currency = cloudData.currency;
      if (Array.isArray(cloudData.animals)) {
        appState.animals = cloudData.animals.filter(a => a.species !== 'bovin' && a.species !== 'ovin');
      }
      if (Array.isArray(cloudData.expenses)) {
        appState.expenses = cloudData.expenses;
      }
      if (Array.isArray(cloudData.sales)) {
        appState.sales = cloudData.sales;
      }
      if (Array.isArray(cloudData.incubatorBatches)) {
        appState.incubatorBatches = cloudData.incubatorBatches;
      }

      try {
        localStorage.setItem('fermegest_state', JSON.stringify({
          version: '2.2.0-poultry',
          currency: appState.currency,
          lang: appState.lang || 'fr',
          theme: appState.theme,
          animals: appState.animals,
          expenses: appState.expenses,
          sales: appState.sales,
          incubatorBatches: appState.incubatorBatches
        }));
      } catch (e) {}

      app.updateCurrencySymbols();
      app.renderAll();
      app.runSimulator();
    },

    disconnectCloud() {
      if (confirm('Voulez-vous désactiver la synchronisation Cloud ? Vos données actuelles resteront enregistrées sur cet appareil.')) {
        this.config.enabled = false;
        this.saveConfig();
        if (this.realtimeChannel && this.client) {
          try { this.client.removeChannel(this.realtimeChannel); } catch (e) {}
        }
        this.client = null;
        this.updateStatusUI('offline');
        app.showToast(app.t('toast_cloud_disconnected') || 'Synchronisation Cloud désactivée.');
        app.closeModal('modalCloudSync');
      }
    },

    copySqlScript() {
      const codeEl = document.getElementById('cloudSqlCode');
      const text = codeEl ? codeEl.innerText : '';
      if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text).then(() => {
          app.showToast('✅ Script SQL copié dans le presse-papier !');
        }).catch(() => {
          this.fallbackCopy(text);
        });
      } else {
        this.fallbackCopy(text);
      }
    },

    fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        app.showToast('✅ Script SQL copié !');
      } catch (e) {
        alert('Veuillez copier le script manuellement depuis l\'encadré.');
      }
      document.body.removeChild(ta);
    },

    updateStatusUI(forcedState) {
      const state = forcedState || (this.config.enabled && this.client ? 'connected' : 'offline');

      const headerDot = document.getElementById('headerCloudDot');
      const headerText = document.getElementById('headerCloudText');
      const drawerDot = document.getElementById('drawerCloudDot');
      const drawerText = document.getElementById('drawerCloudText');

      const banner = document.getElementById('cloudStatusBanner');
      const bannerIcon = document.getElementById('cloudBannerIcon');
      const bannerTitle = document.getElementById('cloudBannerTitle');
      const bannerSub = document.getElementById('cloudBannerSub');

      const timeStr = this.lastSyncedAt
        ? `${String(this.lastSyncedAt.getHours()).padStart(2, '0')}:${String(this.lastSyncedAt.getMinutes()).padStart(2, '0')}`
        : '';

      if (state === 'connected') {
        if (headerDot) headerDot.className = 'cloud-dot connected';
        if (headerText) headerText.textContent = timeStr ? `☁️ Cloud (${timeStr})` : '☁️ Cloud Actif';
        if (drawerDot) drawerDot.className = 'cloud-dot connected';
        if (drawerText) drawerText.textContent = timeStr ? `Connecté (${timeStr})` : 'Connecté au Cloud';

        if (banner) banner.className = 'cloud-status-banner is-connected';
        if (bannerIcon) bannerIcon.textContent = '🟢';
        if (bannerTitle) bannerTitle.textContent = app.t('cloud_status_connected') || '🟢 Connecté au Cloud (Synchronisé)';
        if (bannerSub) bannerSub.textContent = `Ferme ID: "${this.config.farmCode}" • Dernière synchronisation: ${timeStr || 'À l\'instant'}`;
      } else if (state === 'syncing') {
        if (headerDot) headerDot.className = 'cloud-dot syncing';
        if (headerText) headerText.textContent = '🔄 Synchro...';
        if (drawerDot) drawerDot.className = 'cloud-dot syncing';
        if (drawerText) drawerText.textContent = 'Synchronisation...';

        if (banner) banner.className = 'cloud-status-banner is-syncing';
        if (bannerIcon) bannerIcon.textContent = '🔄';
        if (bannerTitle) bannerTitle.textContent = app.t('cloud_status_syncing') || '🔄 Synchronisation en cours...';
        if (bannerSub) bannerSub.textContent = 'Transfert des données vers/depuis Supabase...';
      } else if (state === 'error') {
        if (headerDot) headerDot.className = 'cloud-dot offline';
        if (headerText) headerText.textContent = '⚠️ Erreur Cloud';
        if (drawerDot) drawerDot.className = 'cloud-dot offline';
        if (drawerText) drawerText.textContent = 'Erreur de connexion';

        if (banner) banner.className = 'cloud-status-banner is-offline';
        if (bannerIcon) bannerIcon.textContent = '⚠️';
        if (bannerTitle) bannerTitle.textContent = 'Erreur de connexion Cloud';
        if (bannerSub) bannerSub.textContent = 'Vérifiez l\'URL, la clé Anon et l\'existence de la table farm_sync.';
      } else {
        if (headerDot) headerDot.className = 'cloud-dot offline';
        if (headerText) headerText.textContent = app.t('nav_cloud_sync') || '☁️ Synchro Cloud';
        if (drawerDot) drawerDot.className = 'cloud-dot offline';
        if (drawerText) drawerText.textContent = 'Mode Local (Non connecté)';

        if (banner) banner.className = 'cloud-status-banner is-offline';
        if (bannerIcon) bannerIcon.textContent = '🟠';
        if (bannerTitle) bannerTitle.textContent = app.t('cloud_status_offline') || '🟠 Mode Local (Sauvegardé sur cet appareil)';
        if (bannerSub) bannerSub.textContent = 'Vos données sont stockées en local sur cet appareil. Activez Supabase pour synchroniser.';
      }
    }
  }
};

// Expose app on global window
window.app = app;

// Initialize Application on DOM Ready or immediately if DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
} else {
  app.init();
}
