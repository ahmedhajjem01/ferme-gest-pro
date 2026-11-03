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
  eggChartPeriod: '7d',
  milkStock: 0,
  milkHarvests: [],
  milkChartPeriod: '7d',
  feedStockKg: null,
  feedStockDate: null,
  feedStockCostPerKg: 0,
  feedStockUpdatedAt: null,
  feedRationMode: 'custom',
  customDailyFeedKg: null,
  sicamCansCount: null,
  feedDistributions: [],
  feedTypes: [],
  
  animals: [],
  expenses: [],
  sales: [],
  incubatorBatches: [],
  calendarEvents: [],
  dismissedSaleAlerts: [],
  savedFavoriteFeedRoutine: null,
  userProfile: null
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

// Clean Initial Empty Dataset (Fresh application state)
const SAMPLE_DATA = {
  animals: [],
  expenses: [],
  sales: [],
  incubatorBatches: [],
  feedStockKg: 0,
  feedStockCostPerKg: 0,
  feedTypes: []
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
    this.updateLivestockUIThemeAndVisibility();
    const addSp = document.getElementById('animalSpecies')?.value || 'poulet';
    this.handleAnimalSpeciesChange(addSp, 'animal');
    const editSp = document.getElementById('editAnimalSpecies')?.value || 'poulet';
    this.handleAnimalSpeciesChange(editSp, 'editAnimal');
    this.renderAll();
    this.calcHatchPreview();

    // Reschedule daily reminders (16h feed & 17h eggs) in the selected language
    if (window.MobileBridge && window.MobileBridge.scheduleAllDailyReminders) {
      window.MobileBridge.scheduleAllDailyReminders(newLang);
    } else if (window.MobileBridge && window.MobileBridge.scheduleDailyEggNotification) {
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
    this.updateLivestockUIThemeAndVisibility();
    this.renderAll();
    document.querySelectorAll('#animalPortionBanner, [id*="PortionBanner"]').forEach(el => el.remove());

    // First-time User Onboarding & Animal Types check
    const onboardingDone = localStorage.getItem('fermegest_onboarding_completed') === 'true';
    const animalsDone = localStorage.getItem('fermegest_animals_selection_completed') === 'true';
    if (!onboardingDone) {
      this.openOnboardingModal();
    } else if (!animalsDone) {
      this.updateUserHeaderUI();
      setTimeout(() => this.openAnimalSelectionModal(), 400);
    } else {
      this.updateUserHeaderUI();
    }

    // Schedule daily notifications (16h feed & 17h egg collection) in active language
    if (window.MobileBridge && window.MobileBridge.scheduleAllDailyReminders) {
      window.MobileBridge.scheduleAllDailyReminders(appState.lang || 'fr');
    } else if (window.MobileBridge && window.MobileBridge.scheduleDailyEggNotification) {
      window.MobileBridge.scheduleDailyEggNotification(appState.lang || 'fr');
    }

    // Listen for Service Worker notification clicks (PWA / Web)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'open_feed_distribution') {
          this.openModal('modalFeedDistribution');
        } else if (event.data && event.data.action === 'open_daily_eggs') {
          this.openDailyEggModal();
        }
      });
    }

    // Deep link or action parameter from notification click
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'feed_distribution') {
        setTimeout(() => this.openModal('modalFeedDistribution'), 600);
      } else if (urlParams.get('action') === 'daily_eggs') {
        setTimeout(() => this.openDailyEggModal(), 600);
      }
    } catch (e) {}

    // Check Daily 16h Feed & 17h Egg In-App Notification alert banners
    this.checkDailyFeedInAppAlert();
    this.checkDailyEggInAppAlert();
    window.addEventListener('focus', () => {
      this.checkDailyFeedInAppAlert();
      this.checkDailyEggInAppAlert();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkDailyFeedInAppAlert();
        this.checkDailyEggInAppAlert();
      }
    });
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
        eggChartPeriod: appState.eggChartPeriod || '7d',
        milkStock: Number(appState.milkStock) || 0,
        milkHarvests: Array.isArray(appState.milkHarvests) ? appState.milkHarvests : [],
        milkChartPeriod: appState.milkChartPeriod || '7d',
        feedStockKg: appState.feedStockKg !== undefined ? appState.feedStockKg : null,
        feedStockDate: appState.feedStockDate || null,
        feedStockCostPerKg: (appState.feedStockCostPerKg !== undefined && appState.feedStockCostPerKg !== null) ? Number(appState.feedStockCostPerKg) : 0,
        feedStockUpdatedAt: appState.feedStockUpdatedAt || null,
        feedRationMode: appState.feedRationMode || 'custom',
        customDailyFeedKg: (appState.customDailyFeedKg !== undefined && appState.customDailyFeedKg !== null) ? Number(appState.customDailyFeedKg) : null,
        sicamCansCount: (appState.sicamCansCount !== undefined && appState.sicamCansCount !== null) ? Number(appState.sicamCansCount) : null,
        feedDistributions: Array.isArray(appState.feedDistributions) ? appState.feedDistributions : [],
        feedTypes: Array.isArray(appState.feedTypes) ? appState.feedTypes : [],
        animals: appState.animals,
        expenses: appState.expenses,
        sales: appState.sales,
        incubatorBatches: appState.incubatorBatches,
        calendarEvents: Array.isArray(appState.calendarEvents) ? appState.calendarEvents : [],
        dismissedSaleAlerts: Array.isArray(appState.dismissedSaleAlerts) ? appState.dismissedSaleAlerts : [],
        savedFavoriteFeedRoutine: appState.savedFavoriteFeedRoutine || null,
        userProfile: appState.userProfile || null,
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
        appState.eggChartPeriod = parsed.eggChartPeriod || '7d';
        appState.milkStock = Number(parsed.milkStock) || 0;
        appState.milkHarvests = Array.isArray(parsed.milkHarvests) ? parsed.milkHarvests : [];
        appState.milkChartPeriod = parsed.milkChartPeriod || '7d';
        appState.feedStockKg = parsed.feedStockKg !== undefined ? parsed.feedStockKg : null;
        appState.feedStockDate = parsed.feedStockDate || null;
        appState.feedStockCostPerKg = (parsed.feedStockCostPerKg !== undefined && parsed.feedStockCostPerKg !== null) ? Number(parsed.feedStockCostPerKg) : 0;
        appState.feedStockUpdatedAt = parsed.feedStockUpdatedAt || null;
        appState.customDailyFeedKg = null;
        appState.sicamCansCount = null;
        if (!Array.isArray(parsed.feedDistributions)) {
          appState.feedDistributions = [];
        } else {
          appState.feedDistributions = parsed.feedDistributions;
        }
        if (!Array.isArray(parsed.feedTypes) || parsed.feedTypes.length === 0) {
          appState.feedTypes = [];
        } else {
          appState.feedTypes = this.sanitizeFeedTypes(parsed.feedTypes);
        }
        if (Array.isArray(appState.feedTypes)) {
          appState.feedTypes = appState.feedTypes.filter(ft => 
            ft && ft.id !== 'feed-principal' &&
            !(ft.name || '').toLowerCase().includes('principal') &&
            !(ft.name || '').includes('علف رئيسي')
          );
        }
        if (parsed.savedFavoriteFeedRoutine && Array.isArray(parsed.savedFavoriteFeedRoutine.items)) {
          parsed.savedFavoriteFeedRoutine.items.forEach(it => {
            if (it.name && (it.name.includes('بليه') || it.name === 'قمح / بليه')) {
              it.name = 'Blé';
            }
            if (it.name && (it.name.includes('بوشون') || it.name.includes('Bouchon') || it.name.includes('bouchon'))) {
              it.name = it.name.replace(/[\/\s]*\b(bouchon)\b[\/\s]*/gi, ' ')
                               .replace(/[\/\s]*بوشون[\/\s]*/g, ' ')
                               .replace(/\(\s*\)/g, '')
                               .replace(/\s+/g, ' ')
                               .trim() || 'Aliment ponte';
            }
          });
        }
        appState.savedFavoriteFeedRoutine = parsed.savedFavoriteFeedRoutine || null;

        if (parsed.userProfile) {
          appState.userProfile = parsed.userProfile;
        } else {
          try {
            const rawProf = localStorage.getItem('fermegest_user_profile');
            if (rawProf) appState.userProfile = JSON.parse(rawProf);
          } catch (e) {}
        }

        // Nettoyer tout timestamp dans le futur
        const now = Date.now();
        if (Number(appState.feedStockUpdatedAt) > now + 1000) {
          appState.feedStockUpdatedAt = now;
        }
        if (Array.isArray(appState.feedTypes)) {
          appState.feedTypes.forEach(f => {
            if (Number(f.updatedAt) > now + 1000) f.updatedAt = now;
          });
        }

        // Strict aviculture sanitization & purge legacy simulation data
        const legacySimLotIds = new Set(['lot-p-01', 'lot-p-02', 'lot-p-03', 'lot-p-04', 'lot-p-05', 'lot-p-06', 'lot-p-07']);
        const legacySimBatchIds = new Set(['batch-01', 'batch-02', 'batch-03', 'batch-04']);
        const legacySimExpIds = new Set(['exp-01', 'exp-02', 'exp-03', 'exp-04', 'exp-05', 'exp-06', 'exp-07', 'exp-08']);
        const legacySimSaleIds = new Set(['sale-01', 'sale-02', 'sale-03', 'sale-04', 'sale-05', 'sale-06', 'sale-07', 'sale-08']);

        const rawAnimals = Array.isArray(parsed.animals) ? parsed.animals : [];
        appState.animals = rawAnimals.filter(a => a.species !== 'bovin' && a.species !== 'ovin' && !legacySimLotIds.has(a.id));

        const rawSales = Array.isArray(parsed.sales) ? parsed.sales : [];
        appState.sales = rawSales.filter(s => s.productType !== 'lait' && s.productType !== 'bovin' && s.productType !== 'ovin' && !legacySimSaleIds.has(s.id) && !legacySimLotIds.has(s.linkedLotId));

        const rawExpenses = Array.isArray(parsed.expenses) ? parsed.expenses : [];
        appState.expenses = rawExpenses.filter(e => e.linkedLotId !== 'lot-b-01' && e.linkedLotId !== 'lot-o-01' && !legacySimExpIds.has(e.id) && !legacySimLotIds.has(e.linkedLotId));

        const rawBatches = Array.isArray(parsed.incubatorBatches) ? parsed.incubatorBatches : [];
        appState.incubatorBatches = rawBatches.filter(b => !legacySimBatchIds.has(b.id));

        if (appState.feedStockKg === 290) {
          appState.feedStockKg = null;
          appState.feedTypes = [];
        }

        appState._zeroInitialized = true;

        if (!appState.animals || appState.animals.length === 0) {
          appState.customDailyFeedKg = null;
          appState.sicamCansCount = null;
          if (!appState.expenses || appState.expenses.length === 0) {
            appState.feedTypes = [];
            appState.feedStockKg = null;
            appState.feedDistributions = [];
            appState.savedFavoriteFeedRoutine = null;
          }
        }

        // Purge any residual blacklist arrays from previous sessions to guarantee new purchases are never blocked
        appState.deletedFeedFamilies = [];
        appState.deletedFeedNames = [];
        appState.deletedFeedIds = [];

        this.synchronizeAnimalStages();
        this.reconcileFeedTypesFromExpenses();
      } else {
        // Nouveau projet vierge pour le nouvel utilisateur (tout commence à zéro)
        appState.currency = 'TND';
        appState.lang = 'fr';
        appState.eggStock = 0;
        appState.milkStock = 0;
        appState.milkHarvests = [];
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

    // Animals Filter Chips (Event Delegation)
    const chipsRow = document.getElementById('animalFilterChipsRow');
    if (chipsRow) {
      chipsRow.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-filter-animal]');
        if (!chip) return;
        chipsRow.querySelectorAll('[data-filter-animal]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filterVal = chip.getAttribute('data-filter-animal');
        this.currentAnimalFilter = filterVal;
        this.renderAnimals(filterVal);
      });
    }

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
        const ageValInput = document.getElementById('animalArrivalAgeValue');
        if (ageValInput) {
          ageValInput.value = '';
        }
        const ageInput = document.getElementById('animalArrivalAgeDays');
        if (ageInput) {
          ageInput.value = '';
        }
        const birthDateInput = document.getElementById('animalBirthDate');
        if (birthDateInput && !birthDateInput.value) {
          birthDateInput.value = this.getTodayStr();
        }
        this.populateAnimalSpeciesOptions('animalSpecies');
        const sp = document.getElementById('animalSpecies')?.value || 'poulet';
        this.handleAnimalSpeciesChange(sp, 'animal');
        this.updateArrivalAgePreview('animal');

        const existingAlert = document.getElementById('modalAddAnimalFeedWarning');
        if (existingAlert) existingAlert.remove();

        const availableStock = this.getAvailableFeedStockKg();
        if (availableStock <= 0) {
          const isAr = appState.lang === 'ar';
          const isEn = appState.lang === 'en';
          const bannerDiv = document.createElement('div');
          bannerDiv.id = 'modalAddAnimalFeedWarning';
          bannerDiv.style.cssText = 'background: rgba(245, 158, 11, 0.12); border: 1.5px solid rgba(245, 158, 11, 0.35); border-radius: var(--radius-md); padding: 0.75rem 0.9rem; margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; flex-wrap: wrap;';
          bannerDiv.innerHTML = `
            <div style="font-size: 0.82rem; color: var(--accent-amber); font-weight: 700; display: flex; align-items: center; gap: 0.4rem; flex: 1; min-width: 220px;">
              <span style="font-size: 1.1rem;">⚠️</span>
              <span>${isAr ? 'تنبيه: مخزون الأعلاف فارغ حالياً (0 كغ). جميع الأكياس السابقة مغلقة.' : (isEn ? 'Notice: Feed stock is empty (0 kg). All previous stocks are closed.' : 'Attention : Aucun stock d\'aliment disponible (0 kg en réserve). Tous les stocks précédents sont épuisés.')}</span>
            </div>
            <button type="button" class="btn btn-sm btn-primary bold" style="padding: 0.3rem 0.75rem; font-size: 0.78rem;" onclick="app.closeModal('modalAddAnimal'); app.openFeedPurchaseModal();">
              🛒 ${isAr ? 'شراء علف' : (isEn ? 'Buy feed' : 'Acheter de l\'aliment')}
            </button>
          `;
          const form = document.getElementById('formAddAnimal');
          const modalBody = form ? form.querySelector('.modal-body') : null;
          if (modalBody) {
            modalBody.prepend(bannerDiv);
          }
        }
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



      if (modalId === 'modalFeedDistribution') {
        const dateInput = document.getElementById('distribDate');
        if (dateInput) dateInput.value = this.getTodayStr();
        this.renderFeedDistributionModal();
      }

      if (modalId === 'modalAddGestation') {
        this.renderAddGestationModal();
      }

      if (modalId === 'modalAddVaccine') {
        this.renderAddVaccineModal();
      }

      if (modalId === 'modalAddGestation') {
        this.renderAddGestationModal();
      }

      if (modalId === 'modalAddVaccine') {
        this.renderAddVaccineModal();
      }

      if (modalId === 'modalAddGestation') {
        this.renderAddGestationModal();
      }

      if (modalId === 'modalAddVaccine') {
        this.renderAddVaccineModal();
      }

      if (modalId === 'modalAddFeedType') {
        this.openFeedPurchaseModal();
        return;
      }

      if (modalId === 'modalAddSale') {
        this.populateSaleProductOptions();
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
    if (modalId === 'modalAddExpense') {
      const titleHeader = document.getElementById('modalAddExpenseTitle');
      if (titleHeader) titleHeader.textContent = this.t('modal_add_expense_title') || 'Enregistrer une Dépense';
      const submitBtn = document.getElementById('expenseSubmitBtn');
      if (submitBtn) {
        submitBtn.textContent = this.t('btn_validate_expense') || 'Valider la Dépense';
        submitBtn.className = 'btn btn-danger';
      }
      const expCatRow = document.getElementById('expenseCategoryRow');
      if (expCatRow) expCatRow.style.display = 'flex';
      const feedSuggRow = document.getElementById('expenseFeedSuggestionsRow');
      if (feedSuggRow) feedSuggRow.style.display = 'none';
      const multiBlock = document.getElementById('expenseAddMultipleLotsBlock');
      if (multiBlock) multiBlock.style.display = 'none';
    }
  },

  // ==========================================
  // ONBOARDING & USER PROFILE FLOW
  // ==========================================
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  parseBirthDate(birthDateStr) {
    if (!birthDateStr || typeof birthDateStr !== 'string') return null;
    const s = birthDateStr.trim();
    // 1. ISO YYYY-MM-DD
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (m) {
      const y = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10);
      const d = parseInt(m[3], 10);
      return {
        year: y,
        month: mo,
        day: d,
        iso: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      };
    }
    // 2. DD/MM/YYYY or DD-MM-YYYY
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (m) {
      const y = parseInt(m[3], 10);
      const mo = parseInt(m[2], 10);
      const d = parseInt(m[1], 10);
      return {
        year: y,
        month: mo,
        day: d,
        iso: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      };
    }
    return null;
  },

  calculateAge(birthDateStr) {
    const parsed = this.parseBirthDate(birthDateStr);
    if (!parsed) return null;
    const { year, month, day } = parsed;
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1; // 1-12
    const curDay = today.getDate();

    let age = curYear - year;
    if (curMonth < month || (curMonth === month && curDay < day)) {
      age--;
    }
    return age;
  },

  getMaxAdultBirthDate() {
    const today = new Date();
    const maxYear = today.getFullYear() - 18;
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${maxYear}-${m}-${d}`;
  },

  handleBirthDateChange(dateVal) {
    const badge = document.getElementById('onboardingCalculatedAge');
    const errBirth = document.getElementById('onboardingBirthDateError');
    const errUnder18 = document.getElementById('onboardingUnder18Error');
    const age = this.calculateAge(dateVal);

    if (!dateVal) {
      if (badge) badge.classList.add('hidden');
      if (errBirth) errBirth.classList.add('hidden');
      if (errUnder18) errUnder18.classList.add('hidden');
      return;
    }

    if (age === null) {
      if (badge) badge.classList.add('hidden');
      return;
    }

    const yearsText = this.t('onboarding_preview_years') || 'ans';

    if (age < 18) {
      if (badge) {
        const under18Note = this.t('onboarding_age_under18_badge') || 'Moins de 18 ans';
        badge.textContent = `(${age} ${yearsText} - ⚠️ ${under18Note})`;
        badge.classList.remove('hidden');
        badge.classList.add('under-18');
      }
      if (errBirth) errBirth.classList.add('hidden');
      if (errUnder18) errUnder18.classList.remove('hidden');
    } else if (age > 120) {
      if (badge) badge.classList.add('hidden');
      if (errBirth) errBirth.classList.remove('hidden');
      if (errUnder18) errUnder18.classList.add('hidden');
    } else {
      if (badge) {
        badge.textContent = `(${age} ${yearsText})`;
        badge.classList.remove('hidden');
        badge.classList.remove('under-18');
      }
      if (errBirth) errBirth.classList.add('hidden');
      if (errUnder18) errUnder18.classList.add('hidden');
    }
  },

  handleEditProfileBirthDateChange(dateVal) {
    const badge = document.getElementById('editProfileCalculatedAge');
    const age = this.calculateAge(dateVal);
    if (badge) {
      const yearsText = this.t('onboarding_preview_years') || 'ans';
      if (age !== null && age >= 18 && age <= 120) {
        badge.textContent = `(${age} ${yearsText})`;
        badge.classList.remove('hidden');
        badge.classList.remove('under-18');
      } else if (age !== null && age < 18) {
        const under18Note = this.t('onboarding_age_under18_badge') || 'Moins de 18 ans';
        badge.textContent = `(${age} ${yearsText} - ⚠️ ${under18Note})`;
        badge.classList.remove('hidden');
        badge.classList.add('under-18');
      } else {
        badge.classList.add('hidden');
      }
    }
  },

  openOnboardingModal() {
    const modal = document.getElementById('modalOnboarding');
    if (!modal) return;

    const existingProfile = appState.userProfile || (function() {
      try { return JSON.parse(localStorage.getItem('fermegest_user_profile') || 'null'); } catch(e) { return null; }
    })();

    const nameInput = document.getElementById('onboardingNameInput');
    const birthInput = document.getElementById('onboardingBirthDateInput');
    const hiddenAvatar = document.getElementById('onboardingSelectedAvatar');

    // Dynamically enforce 18 years old maximum date limit
    if (birthInput) {
      birthInput.max = this.getMaxAdultBirthDate();
      birthInput.min = '1920-01-01';
    }

    const defaultAvatar = existingProfile ? (existingProfile.avatar || 'avatar-m1') : 'avatar-m1';
    if (nameInput) nameInput.value = existingProfile ? (existingProfile.name || '') : '';
    if (birthInput) {
      if (existingProfile && existingProfile.birthDate) {
        birthInput.value = existingProfile.birthDate;
      } else if (existingProfile && existingProfile.age) {
        const estYear = new Date().getFullYear() - existingProfile.age;
        birthInput.value = `${estYear}-01-01`;
      } else {
        birthInput.value = '';
      }
      this.handleBirthDateChange(birthInput.value);
    }
    if (hiddenAvatar) hiddenAvatar.value = defaultAvatar;

    this.filterOnboardingAvatars('all', defaultAvatar);
    modal.classList.remove('hidden');

    setTimeout(() => {
      if (nameInput) nameInput.focus();
    }, 200);
  },

  filterOnboardingAvatars(gender = 'all', currentSelected = null) {
    const grid = document.getElementById('onboardingAvatarGrid');
    if (!grid || !window.AppAvatars) return;

    const selected = currentSelected || document.getElementById('onboardingSelectedAvatar')?.value || 'avatar-m1';
    grid.innerHTML = window.AppAvatars.renderGridHtml(selected, gender);

    // Update gender tab buttons active state
    ['All', 'Male', 'Female'].forEach(g => {
      const btn = document.getElementById('genderTab' + g);
      if (btn) {
        if ((gender === 'all' && g === 'All') || (gender === 'male' && g === 'Male') || (gender === 'female' && g === 'Female')) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    this.applyTranslations();
  },

  selectOnboardingAvatar(avatarId) {
    const hidden = document.getElementById('onboardingSelectedAvatar');
    if (hidden) hidden.value = avatarId;

    const grid = document.getElementById('onboardingAvatarGrid');
    if (grid) {
      grid.querySelectorAll('.avatar-card-item').forEach(el => {
        if (el.getAttribute('data-avatar-id') === avatarId) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      });
    }
  },

  handleOnboardingSubmit(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const nameInput = document.getElementById('onboardingNameInput');
    const birthInput = document.getElementById('onboardingBirthDateInput');
    const hiddenAvatar = document.getElementById('onboardingSelectedAvatar');

    const name = (nameInput?.value || '').trim();
    const birthDateRaw = (birthInput?.value || '').trim();
    const parsed = this.parseBirthDate(birthDateRaw);
    const birthDate = parsed ? parsed.iso : birthDateRaw;
    const age = this.calculateAge(birthDate);
    const avatarId = hiddenAvatar?.value || 'avatar-m1';

    const errName = document.getElementById('onboardingNameError');
    const errBirth = document.getElementById('onboardingBirthDateError');
    const errUnder18 = document.getElementById('onboardingUnder18Error');

    let hasError = false;
    if (!name || name.length < 2) {
      if (errName) errName.classList.remove('hidden');
      if (nameInput) nameInput.focus();
      hasError = true;
    } else {
      if (errName) errName.classList.add('hidden');
    }

    if (!birthDate) {
      if (errBirth) errBirth.classList.remove('hidden');
      if (errUnder18) errUnder18.classList.add('hidden');
      if (!hasError && birthInput) birthInput.focus();
      hasError = true;
    } else if (age === null || age < 18) {
      if (errBirth) errBirth.classList.add('hidden');
      if (errUnder18) errUnder18.classList.remove('hidden');
      if (!hasError && birthInput) birthInput.focus();
      hasError = true;
    } else if (age > 120) {
      if (errBirth) errBirth.classList.remove('hidden');
      if (errUnder18) errUnder18.classList.add('hidden');
      if (!hasError && birthInput) birthInput.focus();
      hasError = true;
    } else {
      if (errBirth) errBirth.classList.add('hidden');
      if (errUnder18) errUnder18.classList.add('hidden');
    }

    if (hasError) return;

    const avatar = window.AppAvatars ? window.AppAvatars.getById(avatarId) : null;
    const profile = {
      name: name,
      birthDate: birthDate,
      age: age,
      avatar: avatarId,
      gender: avatar ? avatar.gender : 'male',
      updatedAt: Date.now()
    };

    appState.userProfile = profile;
    try {
      localStorage.setItem('fermegest_user_profile', JSON.stringify(profile));
      localStorage.setItem('fermegest_onboarding_completed', 'true');
    } catch (err) {}

    this.saveState();
    this.closeModal('modalOnboarding');
    this.updateUserHeaderUI();
    this.switchTab('dashboard');

    // Open second step: Auth / Cloud Backup prompt
    setTimeout(() => {
      this.openAuthPromptModal();
    }, 400);
  },

  openAuthPromptModal() {
    const modal = document.getElementById('modalAuthPrompt');
    if (!modal) return;

    const name = (appState.userProfile && appState.userProfile.name) || '';
    const subtitleEl = document.getElementById('authPromptSubtitle');
    if (subtitleEl) {
      const tpl = this.t('auth_prompt_welcome') || 'Ravi de vous compter parmi nous, <strong>{name}</strong> !';
      subtitleEl.innerHTML = tpl.replace('{name}', this.escapeHtml(name));
    }

    modal.classList.remove('hidden');
  },

  showGuestWarningConfirmation() {
    const modal = document.getElementById('modalGuestWarning');
    if (modal) modal.classList.remove('hidden');
  },

  confirmGuestMode() {
    this.closeModal('modalGuestWarning');
    this.closeModal('modalAuthPrompt');
    try {
      localStorage.setItem('fermegest_guest_acknowledged', 'true');
      localStorage.setItem('fermegest_guest_mode', 'true');
    } catch (e) {}

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const msg = isAr 
      ? '👤 تم تفعيل وضع الضيف. يمكنك ربط حسابك لاحقاً من ملفك الشخصي لتأمين المزرعة.' 
      : (isEn ? '👤 Guest Mode active. You can link your account anytime to back up your farm.' : '👤 Mode Invité activé. Vous pouvez lier votre compte à tout moment depuis votre profil pour sauvegarder votre élevage.');
    this.showToast(msg);

    this.updateUserHeaderUI();
    if (window.appAuth && typeof appAuth.updateUI === 'function') {
      appAuth.updateUI();
    }

    // Step 3: Open animal selection modal after guest confirmation
    setTimeout(() => {
      this.openAnimalSelectionModal();
    }, 400);
  },

  openAnimalSelectionModal(isEditMode = false) {
    const modal = document.getElementById('modalAnimalSelection');
    if (!modal) return;

    this.isEditingAnimalTypes = !!isEditMode;

    const currentTypes = (appState.userProfile && Array.isArray(appState.userProfile.managedAnimals) && appState.userProfile.managedAnimals.length > 0)
      ? appState.userProfile.managedAnimals.filter(t => t !== 'equine')
      : (function() {
          try {
            const raw = JSON.parse(localStorage.getItem('fermegest_managed_animal_types') || 'null');
            return Array.isArray(raw) && raw.length > 0 ? raw.filter(t => t !== 'equine') : ['poultry'];
          } catch(e) { return ['poultry']; }
        })();

    this.tempSelectedAnimalTypes = currentTypes.length > 0 ? [...currentTypes] : ['poultry'];
    this.updateAnimalTypesSelectionUI();

    const err = document.getElementById('animalSelectionError');
    if (err) err.classList.add('hidden');

    this.applyTranslations();
    modal.classList.remove('hidden');
  },

  toggleAnimalTypeSelection(animalType) {
    if (!this.tempSelectedAnimalTypes) {
      this.tempSelectedAnimalTypes = ['poultry'];
    }

    const idx = this.tempSelectedAnimalTypes.indexOf(animalType);
    if (idx > -1) {
      if (this.tempSelectedAnimalTypes.length > 1) {
        this.tempSelectedAnimalTypes.splice(idx, 1);
      } else {
        const err = document.getElementById('animalSelectionError');
        if (err) {
          err.classList.remove('hidden');
          setTimeout(() => err.classList.add('hidden'), 2500);
        }
        return;
      }
    } else {
      this.tempSelectedAnimalTypes.push(animalType);
    }

    const err = document.getElementById('animalSelectionError');
    if (err) err.classList.add('hidden');

    this.updateAnimalTypesSelectionUI();
  },

  updateAnimalTypesSelectionUI() {
    const selected = this.tempSelectedAnimalTypes || ['poultry'];
    const cards = document.querySelectorAll('#animalTypesSelectionGrid .animal-type-card');
    cards.forEach(card => {
      const type = card.getAttribute('data-animal-type');
      if (selected.includes(type)) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });
  },

  saveAnimalTypeSelection() {
    const selected = this.tempSelectedAnimalTypes || ['poultry'];
    if (!Array.isArray(selected) || selected.length === 0) {
      const err = document.getElementById('animalSelectionError');
      if (err) err.classList.remove('hidden');
      return;
    }

    if (!appState.userProfile) appState.userProfile = {};
    appState.userProfile.managedAnimals = [...selected];

    try {
      localStorage.setItem('fermegest_managed_animal_types', JSON.stringify(selected));
      localStorage.setItem('fermegest_animals_selection_completed', 'true');
      localStorage.setItem('fermegest_user_profile', JSON.stringify(appState.userProfile));
    } catch(e) {}

    this.saveState();
    this.closeModal('modalAnimalSelection');
    this.updateUserHeaderUI();

    if (window.appAuth && typeof appAuth.updateUserProfileMetadata === 'function') {
      appAuth.updateUserProfileMetadata(appState.userProfile);
    }

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const msg = isAr 
      ? '✅ تم حفظ أنواع الحيوانات بنجاح !' 
      : (isEn ? '✅ Managed animal types saved successfully!' : '✅ Types d\'animaux enregistrés avec succès !');
    this.showToast(msg);

    this.updateLivestockUIThemeAndVisibility();
    this.renderAll();
  },

  getUserManagedAnimalTypes() {
    if (appState.userProfile && Array.isArray(appState.userProfile.managedAnimals) && appState.userProfile.managedAnimals.length > 0) {
      const filtered = appState.userProfile.managedAnimals.filter(t => t !== 'equine');
      if (filtered.length > 0) return filtered;
    }
    try {
      const raw = JSON.parse(localStorage.getItem('fermegest_managed_animal_types') || 'null');
      if (Array.isArray(raw) && raw.length > 0) {
        const filtered = raw.filter(t => t !== 'equine');
        if (filtered.length > 0) return filtered;
      }
    } catch(e) {}
    return ['poultry'];
  },

  updateLivestockUIThemeAndVisibility() {
    const managed = this.getUserManagedAnimalTypes();
    const hasPoultry = managed.includes('poultry');
    const hasCattle = managed.includes('cattle');
    const hasSheep = managed.includes('sheep');

    // 1. Navigation items (Incubator tab in sidebar & mobile footer)
    const incNavItems = document.querySelectorAll('[data-tab="incubator"]');
    incNavItems.forEach(el => {
      el.style.display = hasPoultry ? '' : 'none';
    });

    // 2. Overview cards: Daily egg alert, Egg stock card, Egg production chart
    const dailyEggBanner = document.getElementById('dailyEggAlertBanner');
    if (dailyEggBanner && !hasPoultry) {
      dailyEggBanner.style.display = 'none';
    }

    const eggStockCard = document.querySelector('.egg-stock-card');
    if (eggStockCard) {
      eggStockCard.style.display = hasPoultry ? '' : 'none';
    }

    const eggChartCard = document.getElementById('eggProductionChartCard');
    if (eggChartCard) {
      eggChartCard.style.display = hasPoultry ? '' : 'none';
    }

    const milkStockCard = document.getElementById('milkStockCard');
    if (milkStockCard) {
      milkStockCard.style.display = hasCattle ? '' : 'none';
    }

    const milkChartCard = document.getElementById('milkProductionChartCard');
    if (milkChartCard) {
      milkChartCard.style.display = hasCattle ? '' : 'none';
    }

    const drawerMilkBtn = document.getElementById('drawerMilkHarvestBtn');
    if (drawerMilkBtn) {
      drawerMilkBtn.style.display = hasCattle ? '' : 'none';
    }


    // 3. KPI Livestock Subtitle
    const kpiAnimalsSub = document.getElementById('kpiAnimalsBreakdown');
    if (kpiAnimalsSub) {
      if (hasPoultry && hasCattle && hasSheep) {
        kpiAnimalsSub.setAttribute('data-i18n', 'kpi_animals_sub_all');
        kpiAnimalsSub.textContent = this.t('kpi_animals_sub_all');
      } else if (hasCattle && !hasPoultry && !hasSheep) {
        kpiAnimalsSub.setAttribute('data-i18n', 'kpi_animals_sub_bovins');
        kpiAnimalsSub.textContent = this.t('kpi_animals_sub_bovins');
      } else if (hasSheep && !hasPoultry && !hasCattle) {
        kpiAnimalsSub.setAttribute('data-i18n', 'kpi_animals_sub_ovins');
        kpiAnimalsSub.textContent = this.t('kpi_animals_sub_ovins');
      } else if ((hasCattle && hasPoultry) || (hasSheep && hasPoultry) || (hasCattle && hasSheep)) {
        kpiAnimalsSub.setAttribute('data-i18n', 'kpi_animals_sub_mixed');
        kpiAnimalsSub.textContent = this.t('kpi_animals_sub_mixed');
      } else {
        kpiAnimalsSub.setAttribute('data-i18n', 'kpi_animals_sub');
        kpiAnimalsSub.textContent = this.t('kpi_animals_sub');
      }
    }

    // 4. Modal Add Animal Title
    const modalAddAnimalTitle = document.querySelector('#modalAddAnimal .modal-header h3');
    if (modalAddAnimalTitle) {
      if (hasCattle && !hasPoultry && !hasSheep) {
        modalAddAnimalTitle.setAttribute('data-i18n', 'modal_add_bovin_title');
        modalAddAnimalTitle.textContent = this.t('modal_add_bovin_title');
      } else if (hasSheep && !hasPoultry && !hasCattle) {
        modalAddAnimalTitle.setAttribute('data-i18n', 'modal_add_ovin_title');
        modalAddAnimalTitle.textContent = this.t('modal_add_ovin_title');
      } else {
        modalAddAnimalTitle.setAttribute('data-i18n', 'modal_add_animal_title');
        modalAddAnimalTitle.textContent = this.t('modal_add_animal_title');
      }
    }

    // 5. Populate species & sales selects, filter chips, and feed suggestions
    this.populateAnimalSpeciesOptions('animalSpecies');
    this.populateAnimalSpeciesOptions('editAnimalSpecies');
    this.populateSaleProductOptions();
    this.renderAnimalFilterChips();
    this.renderFeedExpenseSuggestions();
  },

  populateAnimalSpeciesOptions(selectId = 'animalSpecies', defaultVal = null) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const managed = this.getUserManagedAnimalTypes();
    const hasPoultry = managed.includes('poultry');
    const hasCattle = managed.includes('cattle');
    const hasSheep = managed.includes('sheep');
    const currentVal = defaultVal || select.value;

    const cattleOptions = [
      { val: 'vache_laitiere', key: 'opt_species_vache_laitiere', label: '🐄 Vache Laitière' },
      { val: 'taurillon', key: 'opt_species_taurillon', label: '🐂 Taurillon / Bovin Viande' },
      { val: 'veau', key: 'opt_species_veau', label: '🐂 Veau d\'Élevage' },
      { val: 'bovin_autre', key: 'opt_species_bovin_autre', label: '🌾 Autre Bovin' }
    ];

    const sheepOptions = [
      { val: 'mouton', key: 'opt_species_mouton', label: '🐑 Mouton / Bélier (Viande)' },
      { val: 'brebis', key: 'opt_species_brebis', label: '🐑 Brebis (Laitière / Repro)' },
      { val: 'agneau', key: 'opt_species_agneau', label: '🐑 Agneau d\'Engraissement' },
      { val: 'chevre', key: 'opt_species_chevre', label: '🐐 Chèvre Laitière / Repro' },
      { val: 'chevreau', key: 'opt_species_chevreau', label: '🐐 Chevreau d\'Élevage' },
      { val: 'ovin_autre', key: 'opt_species_ovin_autre', label: '🌾 Autre Ovin / Caprin' }
    ];

    const poultryOptions = [
      { val: 'poulet', key: 'opt_species_poulet', label: '🐔 Poulet / Coq' },
      { val: 'canard', key: 'opt_species_canard', label: '🦆 Canard' },
      { val: 'pintade', key: 'opt_species_pintade', label: '🪶 Pintade' },
      { val: 'caille', key: 'opt_species_caille', label: '🐦 Caille' },
      { val: 'dinde', key: 'opt_species_dinde', label: '🦃 Dinde' },
      { val: 'autre', key: 'opt_species_other', label: '🌾 Autre volaille' }
    ];

    const activeCount = (hasCattle ? 1 : 0) + (hasSheep ? 1 : 0) + (hasPoultry ? 1 : 0);
    let html = '';

    if (activeCount > 1) {
      if (hasCattle) {
        html += `<optgroup label="${this.t('optgroup_bovins') || '🐄 Élevage Bovin'}">`;
        html += cattleOptions.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
        html += `</optgroup>`;
      }
      if (hasSheep) {
        html += `<optgroup label="${this.t('optgroup_ovins') || '🐑 Élevage Ovin & Caprin'}">`;
        html += sheepOptions.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
        html += `</optgroup>`;
      }
      if (hasPoultry) {
        html += `<optgroup label="${this.t('optgroup_volailles') || '🐔 Élevage Avicole (Volailles)'}">`;
        html += poultryOptions.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
        html += `</optgroup>`;
      }
    } else if (hasCattle) {
      html += cattleOptions.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
    } else if (hasSheep) {
      html += sheepOptions.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
    } else {
      html += poultryOptions.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
    }

    select.innerHTML = html;

    const allActiveOptions = [];
    if (hasCattle) allActiveOptions.push(...cattleOptions.map(o => o.val));
    if (hasSheep) allActiveOptions.push(...sheepOptions.map(o => o.val));
    if (hasPoultry || allActiveOptions.length === 0) allActiveOptions.push(...poultryOptions.map(o => o.val));

    if (currentVal && allActiveOptions.includes(currentVal)) {
      select.value = currentVal;
    } else if (allActiveOptions.length > 0) {
      select.value = allActiveOptions[0];
    }

    const formPrefix = selectId.startsWith('edit') ? 'editAnimal' : 'animal';
    this.handleAnimalSpeciesChange(select.value, formPrefix);
  },

  populateSaleProductOptions(defaultVal = null) {
    const select = document.getElementById('saleProductType');
    if (!select) return;

    const managed = this.getUserManagedAnimalTypes();
    const hasPoultry = managed.includes('poultry');
    const hasCattle = managed.includes('cattle');
    const hasSheep = managed.includes('sheep');
    const currentVal = defaultVal || select.value;

    const cattleSales = [
      { val: 'lait', key: 'opt_sale_lait', label: '🥛 Lait Frais (Litres)' },
      { val: 'veau', key: 'opt_sale_veau', label: '🐂 Veau sur pied' },
      { val: 'bovin_viande', key: 'opt_sale_bovin_viande', label: '🥩 Taurillon / Viande' },
      { val: 'vache_reforme', key: 'opt_sale_vache_reforme', label: '🐄 Vache de Réforme' },
      { val: 'fumier_bovin', key: 'opt_sale_fumier_bovin', label: '🚜 Fumier Bovin Organique' }
    ];

    const sheepSales = [
      { val: 'agneau', key: 'opt_sale_agneau', label: '🐑 Agneaux sur pied' },
      { val: 'mouton', key: 'opt_sale_mouton', label: '🥩 Mouton / Viande ovine' },
      { val: 'lait_brebis_chevre', key: 'opt_sale_lait_brebis_chevre', label: '🥛 Lait de Brebis / Chèvre' },
      { val: 'chevreau', key: 'opt_sale_chevreau', label: '🐐 Chevreau sur pied' },
      { val: 'laine', key: 'opt_sale_laine', label: '🧶 Laine & Toisons' },
      { val: 'fumier_ovin', key: 'opt_sale_fumier_ovin', label: '🚜 Fumier Ovin & Caprin' }
    ];

    const poultrySales = [
      { val: 'oeufs', key: 'opt_sale_eggs', label: '🥚 Œufs' },
      { val: 'poussin', key: 'opt_sale_poussin', label: '🐣 Poussins' },
      { val: 'poulet', key: 'opt_sale_poulet', label: '🍗 Poulets' },
      { val: 'pintade', key: 'opt_sale_pintade', label: '🪶 Pintades' },
      { val: 'canard', key: 'opt_sale_canard', label: '🦆 Canards de Barbarie' },
      { val: 'autre', key: 'opt_sale_other', label: '📦 Autre produit avicole' }
    ];

    const activeCount = (hasCattle ? 1 : 0) + (hasSheep ? 1 : 0) + (hasPoultry ? 1 : 0);
    let html = '';

    if (activeCount > 1) {
      if (hasCattle) {
        html += `<optgroup label="${this.t('optgroup_bovins') || '🐄 Bovins'}">`;
        html += cattleSales.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
        html += `</optgroup>`;
      }
      if (hasSheep) {
        html += `<optgroup label="${this.t('optgroup_ovins') || '🐑 Ovins & Caprins'}">`;
        html += sheepSales.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
        html += `</optgroup>`;
      }
      if (hasPoultry) {
        html += `<optgroup label="${this.t('optgroup_volailles') || '🐔 Volailles'}">`;
        html += poultrySales.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
        html += `</optgroup>`;
      }
    } else if (hasCattle) {
      html += cattleSales.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
    } else if (hasSheep) {
      html += sheepSales.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
    } else {
      html += poultrySales.map(o => `<option value="${o.val}" data-i18n="${o.key}">${this.t(o.key) || o.label}</option>`).join('');
    }

    select.innerHTML = html;

    const allActiveSales = [];
    if (hasCattle) allActiveSales.push(...cattleSales.map(o => o.val));
    if (hasSheep) allActiveSales.push(...sheepSales.map(o => o.val));
    if (hasPoultry || allActiveSales.length === 0) allActiveSales.push(...poultrySales.map(o => o.val));

    if (currentVal && allActiveSales.includes(currentVal)) {
      select.value = currentVal;
    } else if (allActiveSales.length > 0) {
      select.value = allActiveSales[0];
    }

    this.handleSaleTypeChange();
  },

  renderAnimalFilterChips() {
    const container = document.getElementById('animalFilterChipsRow');
    if (!container) return;

    const managed = this.getUserManagedAnimalTypes();
    const hasPoultry = managed.includes('poultry');
    const hasCattle = managed.includes('cattle');
    const hasSheep = managed.includes('sheep');
    const activeFilter = this.currentAnimalFilter || 'all';

    const activeAnimals = (appState.animals || []).filter(a => (Number(a.currentQuantity) || 0) > 0);
    const counts = {
      all: activeAnimals.length,
      vache_laitiere: 0,
      taurillon: 0,
      veau: 0,
      bovin_autre: 0,
      mouton: 0,
      brebis: 0,
      agneau: 0,
      chevre: 0,
      chevreau: 0,
      ovin_autre: 0,
      poulet: 0,
      pondeuse: 0,
      poussin: 0,
      adulte: 0,
      pintade: 0,
      canard: 0
    };

    activeAnimals.forEach(a => {
      const sp = (a.species || '').toLowerCase();
      if (sp === 'vache_laitiere' || sp === 'vache') counts.vache_laitiere++;
      else if (sp === 'taurillon' || sp === 'bovin_viande' || sp === 'taureau') counts.taurillon++;
      else if (sp === 'veau' || sp === 'broutard') counts.veau++;
      else if (sp === 'bovin' || sp === 'bovin_autre') counts.bovin_autre++;
      else if (sp === 'mouton' || sp === 'belier') counts.mouton++;
      else if (sp === 'brebis') counts.brebis++;
      else if (sp === 'agneau') counts.agneau++;
      else if (sp === 'chevre' || sp === 'bouc') counts.chevre++;
      else if (sp === 'chevreau') counts.chevreau++;
      else if (sp === 'ovin' || sp === 'caprin' || sp === 'ovin_autre') counts.ovin_autre++;
      else if (sp === 'canard' || sp === 'canard_barbarie') counts.canard++;
      else if (counts[sp] !== undefined) counts[sp]++;
    });

    const chips = [];
    chips.push({ id: 'all', key: 'chip_all', defaultLabel: 'Tous', count: counts.all });

    if (hasCattle) {
      chips.push({ id: 'vache_laitiere', key: 'chip_vache_laitiere', defaultLabel: '🐄 Vaches Laitières', count: counts.vache_laitiere });
      chips.push({ id: 'taurillon', key: 'chip_taurillon', defaultLabel: '🐂 Taurillons', count: counts.taurillon });
      chips.push({ id: 'veau', key: 'chip_veau', defaultLabel: '🐂 Veaux', count: counts.veau });
      chips.push({ id: 'bovin_autre', key: 'chip_bovin_autre', defaultLabel: '🌾 Autres Bovins', count: counts.bovin_autre });
    }

    if (hasSheep) {
      chips.push({ id: 'mouton', key: 'chip_mouton', defaultLabel: '🐑 Moutons', count: counts.mouton });
      chips.push({ id: 'brebis', key: 'chip_brebis', defaultLabel: '🐑 Brebis', count: counts.brebis });
      chips.push({ id: 'agneau', key: 'chip_agneau', defaultLabel: '🐑 Agneaux', count: counts.agneau });
      chips.push({ id: 'chevre', key: 'chip_chevre', defaultLabel: '🐐 Chèvres', count: counts.chevre });
      chips.push({ id: 'chevreau', key: 'chip_chevreau', defaultLabel: '🐐 Chevreaux', count: counts.chevreau });
      chips.push({ id: 'ovin_autre', key: 'chip_ovin_autre', defaultLabel: '🌾 Autres Ovins', count: counts.ovin_autre });
    }

    if (hasPoultry) {
      chips.push({ id: 'poulet', key: 'chip_poulet', defaultLabel: '🍗 Poulets', count: counts.poulet });
      chips.push({ id: 'pondeuse', key: 'chip_pondeuse', defaultLabel: '🥚 Pondeuses', count: counts.pondeuse });
      chips.push({ id: 'poussin', key: 'chip_poussin', defaultLabel: '🐣 Poussins', count: counts.poussin });
      chips.push({ id: 'adulte', key: 'chip_poulet_adulte', defaultLabel: '🐓 Coqs', count: counts.adulte });
      chips.push({ id: 'pintade', key: 'chip_pintade', defaultLabel: '🪶 Pintades', count: counts.pintade });
      chips.push({ id: 'canard', key: 'chip_canard', defaultLabel: '🦆 Canards', count: counts.canard });
    }

    const validIds = chips.map(c => c.id);
    if (!validIds.includes(activeFilter)) {
      this.currentAnimalFilter = 'all';
    }

    container.innerHTML = chips.map(c => {
      const isAct = (c.id === this.currentAnimalFilter);
      return `<button class="chip ${isAct ? 'active' : ''}" data-filter-animal="${c.id}"><span data-i18n="${c.key}">${this.t(c.key) || c.defaultLabel}</span> (<span id="chipCount_${c.id}">${c.count}</span>)</button>`;
    }).join('\n');
  },

  getManagedAnimalsBadgesHtml(managedArray) {
    const list = Array.isArray(managedArray) && managedArray.length > 0 ? managedArray.filter(t => t !== 'equine') : ['poultry'];
    const map = {
      poultry: { icon: '🐔', label: this.t('animal_cat_poultry_title') || 'Volailles' },
      cattle: { icon: '🐄', label: this.t('animal_cat_cattle_title') || 'Bovins' },
      sheep: { icon: '🐑', label: this.t('animal_cat_sheep_title') || 'Ovins & Caprins' }
    };
    return list.map(t => {
      const item = map[t] || { icon: '🐾', label: t };
      return `<span class="managed-animal-badge">${item.icon} ${item.label}</span>`;
    }).join(' ');
  },

  openEditProfileModal() {
    const modal = document.getElementById('modalEditProfile');
    if (!modal) return;

    const profile = appState.userProfile || (function() {
      try { return JSON.parse(localStorage.getItem('fermegest_user_profile') || 'null'); } catch(e) { return null; }
    })();

    const nameInput = document.getElementById('editProfileNameInput');
    const birthInput = document.getElementById('editProfileBirthDateInput');
    const hiddenAvatar = document.getElementById('editProfileSelectedAvatar');
    const grid = document.getElementById('editProfileAvatarGrid');

    const curAvatar = profile ? (profile.avatar || 'avatar-m1') : 'avatar-m1';
    if (nameInput) nameInput.value = profile ? (profile.name || '') : '';
    if (birthInput) {
      birthInput.max = this.getMaxAdultBirthDate();
      birthInput.min = '1920-01-01';
      if (profile && profile.birthDate) {
        birthInput.value = profile.birthDate;
      } else if (profile && profile.age) {
        const estYear = new Date().getFullYear() - profile.age;
        birthInput.value = `${estYear}-01-01`;
      } else {
        birthInput.value = '';
      }
      this.handleEditProfileBirthDateChange(birthInput.value);
    }
    if (hiddenAvatar) hiddenAvatar.value = curAvatar;

    if (grid && window.AppAvatars) {
      grid.innerHTML = window.AppAvatars.list.map(a => {
        const isSel = (a.id === curAvatar);
        return `
          <div class="avatar-card-item ${isSel ? 'selected' : ''}" 
               data-avatar-id="${a.id}" 
               onclick="app.selectEditProfileAvatar('${a.id}')"
               title="${a.defaultName}">
            <div class="avatar-card-svg-wrap">
              ${window.AppAvatars.getSvg(a.id, 48)}
              <div class="avatar-card-check">✓</div>
            </div>
            <div class="avatar-card-name" data-i18n="${a.nameKey}">${a.defaultName}</div>
          </div>
        `;
      }).join('');
    }

    const managedEl = document.getElementById('editProfileManagedAnimalsList');
    if (managedEl) {
      const managed = (profile && profile.managedAnimals) || (function() {
        try { return JSON.parse(localStorage.getItem('fermegest_managed_animal_types') || 'null'); } catch(e) { return null; }
      })() || ['poultry'];
      managedEl.innerHTML = this.getManagedAnimalsBadgesHtml(managed);
    }

    this.applyTranslations();
    modal.classList.remove('hidden');
  },

  selectEditProfileAvatar(avatarId) {
    const hidden = document.getElementById('editProfileSelectedAvatar');
    if (hidden) hidden.value = avatarId;

    const grid = document.getElementById('editProfileAvatarGrid');
    if (grid) {
      grid.querySelectorAll('.avatar-card-item').forEach(el => {
        if (el.getAttribute('data-avatar-id') === avatarId) {
          el.classList.add('selected');
        } else {
          el.classList.remove('selected');
        }
      });
    }
  },

  handleSaveProfileEdit(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    const nameInput = document.getElementById('editProfileNameInput');
    const birthInput = document.getElementById('editProfileBirthDateInput');
    const hiddenAvatar = document.getElementById('editProfileSelectedAvatar');

    const name = (nameInput?.value || '').trim();
    const birthDateRaw = (birthInput?.value || '').trim();
    const parsed = this.parseBirthDate(birthDateRaw);
    const birthDate = parsed ? parsed.iso : birthDateRaw;
    const age = this.calculateAge(birthDate);
    const avatarId = hiddenAvatar?.value || 'avatar-m1';

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    if (!name || name.length < 2) {
      const msg = isAr ? 'الرجاء إدخال اسمك.' : (isEn ? 'Please enter your name.' : 'Veuillez saisir votre nom.');
      this.showToast(msg);
      if (nameInput) nameInput.focus();
      return;
    }

    if (!birthDate) {
      const msg = isAr ? 'الرجاء تحديد تاريخ ميلادك.' : (isEn ? 'Please select your date of birth.' : 'Veuillez sélectionner votre date de naissance.');
      this.showToast(msg);
      if (birthInput) birthInput.focus();
      return;
    }

    if (age === null || age < 18) {
      const msg = isAr 
        ? 'يجب أن يكون عمرك 18 عاماً على الأقل لإنشاء وإدارة المزرعة.' 
        : (isEn ? 'You must be at least 18 years old to create and manage a farm.' : 'Vous devez avoir au moins 18 ans pour créer et gérer un élevage.');
      this.showToast(msg);
      if (birthInput) birthInput.focus();
      return;
    }

    if (age > 120) {
      const msg = isAr ? 'عمر غير صالح. الحد الأدنى للعمر هو 18 عاماً.' : (isEn ? 'Invalid age. The minimum required age is 18 years.' : 'Âge invalide. L\'âge minimum requis est de 18 ans.');
      this.showToast(msg);
      if (birthInput) birthInput.focus();
      return;
    }

    const avatar = window.AppAvatars ? window.AppAvatars.getById(avatarId) : null;
    const profile = {
      name: name,
      birthDate: birthDate,
      age: age,
      avatar: avatarId,
      gender: avatar ? avatar.gender : 'male',
      updatedAt: Date.now()
    };

    appState.userProfile = profile;
    try {
      localStorage.setItem('fermegest_user_profile', JSON.stringify(profile));
    } catch (err) {}

    this.saveState();
    this.closeModal('modalEditProfile');
    this.updateUserHeaderUI();

    if (window.appAuth) {
      if (typeof appAuth.openProfileModal === 'function') {
        appAuth.openProfileModal();
      }
      if (typeof appAuth.pushData === 'function' && appAuth.currentUser) {
        appAuth.pushData(false, true);
      }
    }

    this.showToast(isAr ? '✅ تم تحديث بياناتك بنجاح !' : (isEn ? '✅ Profile updated successfully!' : '✅ Profil mis à jour avec succès !'));
  },

  updateUserHeaderUI() {
    const profile = appState.userProfile || (function() {
      try { return JSON.parse(localStorage.getItem('fermegest_user_profile') || 'null'); } catch(e) { return null; }
    })();

    if (!profile) return;

    const avatarId = profile.avatar || 'avatar-m1';
    const name = profile.name || '';

    // Desktop header user name and avatar
    const headerUserText = document.getElementById('headerUserText');
    const headerUserInitial = document.getElementById('headerUserInitial');
    if (headerUserText && name) {
      headerUserText.textContent = name;
    }
    if (headerUserInitial && window.AppAvatars) {
      headerUserInitial.innerHTML = window.AppAvatars.getSvg(avatarId, 28);
    }

    // Mobile header button
    const mobileUserInitial = document.getElementById('mobileUserInitial');
    if (mobileUserInitial && window.AppAvatars) {
      mobileUserInitial.innerHTML = window.AppAvatars.getSvg(avatarId, 32);
    }

    // Mobile drawer profile avatar and name if appAuth exists
    if (window.appAuth && typeof appAuth.updateUI === 'function') {
      appAuth.updateUI();
    }
  },

  openFeedPurchaseModal(presetFeedName = null) {
    this.closeModal('modalFeedDistribution');
    this.closeModal('modalAdjustFeedStock');
    this.closeModal('modalAddFeedType');

    const catEl = document.getElementById('expenseCategory');
    if (catEl) catEl.value = 'nourriture';

    const dateEl = document.getElementById('expenseDate');
    if (dateEl) dateEl.value = this.getTodayStr();

    const titleEl = document.getElementById('expenseTitle');
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    if (titleEl) {
      if (presetFeedName) {
        titleEl.value = presetFeedName.startsWith('Achat') || presetFeedName.startsWith('شراء') ? presetFeedName : (isAr ? `شراء ${presetFeedName}` : (isEn ? `Purchase ${presetFeedName}` : `Achat ${presetFeedName}`));
      } else {
        titleEl.value = '';
      }
    }

    const titleHeader = document.getElementById('modalAddExpenseTitle');
    if (titleHeader) {
      titleHeader.textContent = this.t('modal_buy_feed_title') || '🌾 Acheter / Approvisionner un Aliment';
    }

    const submitBtn = document.getElementById('expenseSubmitBtn');
    if (submitBtn) {
      submitBtn.textContent = this.t('btn_validate_feed_purchase') || 'Valider l\'Achat et le Stock';
      submitBtn.className = 'btn btn-emerald bold';
    }

    this.handleExpenseCatChange();
    this.renderFeedExpenseSuggestions();

    if (presetFeedName) {
      this.selectFeedSuggestion(presetFeedName);
    }

    this.openModal('modalAddExpense');
  },

  renderFeedExpenseSuggestions() {
    const container = document.getElementById('expenseFeedSuggestionsContainer');
    if (!container) return;

    const lang = appState.lang || 'fr';
    const managed = this.getUserManagedAnimalTypes();
    const hasPoultry = managed.includes('poultry');
    const hasCattle = managed.includes('cattle');
    const hasSheep = managed.includes('sheep');

    let cattleSuggestions = [];
    let sheepSuggestions = [];
    let poultrySuggestions = [];

    if (lang === 'ar') {
      cattleSuggestions = [
        { id: 'foin', name: 'قرط فصة', icon: '🌿' },
        { id: 'ensilage', name: 'سيلاج ذرة', icon: '🌽' },
        { id: 'concentre_lait', name: 'علف بقر حلوب 18%', icon: '🥛' },
        { id: 'concentre_engrais', name: 'علف تسمين عجول', icon: '🐂' },
        { id: 'poudre_lait', name: 'حليب بودرة للعجول', icon: '🍼' },
        { id: 'paille', name: 'تبن قمح', icon: '🌾' },
        { id: 'sel_mineraux', name: 'حجر ملح ومعادن CMV', icon: '🧂' }
      ];
      sheepSuggestions = [
        { id: 'orge', name: 'شعير مرحي', icon: '🌾' },
        { id: 'foin_ovin', name: 'قرط فصة وقصيبة', icon: '🌿' },
        { id: 'concentre_ovin', name: 'علف خراف تسمين 16%', icon: '🐑' },
        { id: 'concentre_brebis', name: 'علف نعاج وماعز 18%', icon: '🥛' },
        { id: 'poudre_lait_agneau', name: 'بديل حليب للحملان', icon: '🍼' },
        { id: 'pierre_sel', name: 'حجر ملح ولعق ومعادن', icon: '🧂' },
        { id: 'paille_ovin', name: 'تبن ليتيير', icon: '🌾' }
      ];
      poultrySuggestions = [
        { id: 'ble', name: 'قمح', icon: '🌾' },
        { id: 'bouchon', name: 'علف بياضة', icon: '🥚' },
        { id: 'mais', name: 'ذرة مرحية', icon: '🌽' },
        { id: 'son', name: 'نخالة القمح', icon: '🌾' },
        { id: 'tournesol', name: 'قلوب عباد الشمس', icon: '🌻' },
        { id: 'melange', name: 'خلطة حبوب', icon: '🥣' },
        { id: 'demarrage', name: 'علف بداية', icon: '🐣' }
      ];
    } else if (lang === 'en') {
      cattleSuggestions = [
        { id: 'foin', name: 'Alfalfa Hay', icon: '🌿' },
        { id: 'ensilage', name: 'Corn Silage', icon: '🌽' },
        { id: 'concentre_lait', name: 'Dairy Concentrate 18%', icon: '🥛' },
        { id: 'concentre_engrais', name: 'Fattening Concentrate', icon: '🐂' },
        { id: 'poudre_lait', name: 'Calf Milk Replacer', icon: '🍼' },
        { id: 'paille', name: 'Bedding Straw', icon: '🌾' },
        { id: 'sel_mineraux', name: 'Mineral Lick Block (CMV)', icon: '🧂' }
      ];
      sheepSuggestions = [
        { id: 'orge', name: 'Crushed Barley', icon: '🌾' },
        { id: 'foin_ovin', name: 'Alfalfa & Oat Hay', icon: '🌿' },
        { id: 'concentre_ovin', name: 'Sheep Fattening Feed 16%', icon: '🐑' },
        { id: 'concentre_brebis', name: 'Dairy Sheep/Goat Feed 18%', icon: '🥛' },
        { id: 'poudre_lait_agneau', name: 'Lamb Milk Replacer', icon: '🍼' },
        { id: 'pierre_sel', name: 'Mineral Salt Lick Block', icon: '🧂' },
        { id: 'paille_ovin', name: 'Bedding Straw', icon: '🌾' }
      ];
      poultrySuggestions = [
        { id: 'ble', name: 'Wheat', icon: '🌾' },
        { id: 'bouchon', name: 'Layer Feed', icon: '🥚' },
        { id: 'mais', name: 'Cracked Corn', icon: '🌽' },
        { id: 'son', name: 'Wheat Bran', icon: '🌾' },
        { id: 'tournesol', name: 'Sunflower Seeds', icon: '🌻' },
        { id: 'melange', name: 'Grain Mixture', icon: '🥣' },
        { id: 'demarrage', name: 'Starter Feed', icon: '🐣' }
      ];
    } else {
      cattleSuggestions = [
        { id: 'foin', name: 'Foin de luzerne', icon: '🌿' },
        { id: 'ensilage', name: 'Ensilage de maïs', icon: '🌽' },
        { id: 'concentre_lait', name: 'Concentré laitier 18%', icon: '🥛' },
        { id: 'concentre_engrais', name: 'Concentré engraissement', icon: '🐂' },
        { id: 'poudre_lait', name: 'Poudre de lait veau', icon: '🍼' },
        { id: 'paille', name: 'Paille de litière', icon: '🌾' },
        { id: 'sel_mineraux', name: 'Bloc de sel / CMV', icon: '🧂' }
      ];
      sheepSuggestions = [
        { id: 'orge', name: 'Orge concassée', icon: '🌾' },
        { id: 'foin_ovin', name: 'Foin de luzerne / avoine', icon: '🌿' },
        { id: 'concentre_ovin', name: 'Concentré ovin engraissement 16%', icon: '🐑' },
        { id: 'concentre_brebis', name: 'Concentré brebis/chèvre 18%', icon: '🥛' },
        { id: 'poudre_lait_agneau', name: 'Lait d\'allaitement agneaux', icon: '🍼' },
        { id: 'pierre_sel', name: 'Pierre à lécher / Minéraux', icon: '🧂' },
        { id: 'paille_ovin', name: 'Paille de litière', icon: '🌾' }
      ];
      poultrySuggestions = [
        { id: 'ble', name: 'Blé', icon: '🌾' },
        { id: 'bouchon', name: 'Aliment ponte', icon: '🥚' },
        { id: 'mais', name: 'Maïs concassé', icon: '🌽' },
        { id: 'son', name: 'Son de blé (Sedari)', icon: '🌾' },
        { id: 'tournesol', name: 'Tournesol', icon: '🌻' },
        { id: 'melange', name: 'Mélange graines', icon: '🥣' },
        { id: 'demarrage', name: 'Aliment démarrage', icon: '🐣' }
      ];
    }

    let suggestions = [];
    if (hasCattle) suggestions.push(...cattleSuggestions);
    if (hasSheep) suggestions.push(...sheepSuggestions);
    if (hasPoultry) suggestions.push(...poultrySuggestions);
    if (suggestions.length === 0) suggestions = poultrySuggestions;

    container.innerHTML = suggestions.map(s => `
      <button type="button" class="btn btn-xs btn-outline" style="font-size: 0.74rem; padding: 3px 9px; border-radius: var(--radius-pill); font-weight: 700;" onclick="app.selectFeedSuggestion('${s.name}')">
        ${s.icon || '🌾'} ${s.name}
      </button>
    `).join('');
  },

  selectFeedSuggestion(feedName) {
    const titleEl = document.getElementById('expenseTitle');
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const prefix = isAr ? 'شراء' : (isEn ? 'Purchase' : 'Achat');

    if (titleEl) {
      titleEl.value = `${prefix} ${feedName}`;
    }

    const select = document.getElementById('expenseFeedTypeSelect');
    if (select) {
      const family = this.detectFeedTypeFromText(feedName);
      let matchedIndex = -1;
      for (let i = 0; i < select.options.length; i++) {
        const opt = select.options[i];
        if (opt.value !== '__new__') {
          const ft = (appState.feedTypes || []).find(f => f.id === opt.value);
          if (ft && family && this.isFeedInFamily(ft, family)) {
            matchedIndex = i;
            break;
          }
          if (feedName && opt.textContent.toLowerCase().includes(feedName.toLowerCase())) {
            matchedIndex = i;
            break;
          }
        }
      }
      if (matchedIndex >= 0) {
        select.selectedIndex = matchedIndex;
      } else {
        select.value = '__new__';
      }
    }

    this.calcFeedPurchaseFields();
  },

  // ==========================================
  // EGG STOCK & HARVEST ACCUMULATION MODULE
  // ==========================================
  
  // ==========================================
  // MILK STOCK & HARVEST MANAGEMENT (BOVINS)
  // ==========================================
  renderMilkStock() {
    const stock = Number(appState.milkStock) || 0;
    const formattedStock = Number.isInteger(stock) ? stock : stock.toFixed(1);

    const mainCountEl = document.getElementById('milkStockMainCount');
    if (mainCountEl) mainCountEl.textContent = formattedStock;

    const equivEl = document.getElementById('milkStockEquiv');
    if (equivEl) {
      const cans20L = (stock / 20).toFixed(1);
      const tanks500L = (stock / 500).toFixed(2);
      const lang = appState.lang || 'fr';
      if (lang === 'ar') {
        equivEl.textContent = `~${cans20L} برميل (20 لتر) • ~${tanks500L} خزان (500 لتر)`;
      } else if (lang === 'en') {
        equivEl.textContent = `~${cans20L} Cans (20L) • ~${tanks500L} Tanks (500L)`;
      } else {
        equivEl.textContent = `~${cans20L} Bidons (20L) • ~${tanks500L} Citernes (500L)`;
      }
    }

    const curStockVal = document.getElementById('dailyMilkCurrentStockVal');
    if (curStockVal) {
      curStockVal.textContent = formattedStock + ' ' + (this.t('unit_liters_short') || 'L');
    }
  },

  openDailyMilkModal() {
    this.openModal('modalDailyMilk');
    const input = document.getElementById('dailyMilkLiters');
    const dateInput = document.getElementById('dailyMilkDate');
    if (dateInput) {
      dateInput.value = this.getTodayStr();
    }
    if (input) {
      input.value = '';
      input.placeholder = '';
      input.removeAttribute('placeholder');
      setTimeout(() => {
        input.focus();
        input.select();
      }, 150);
    }

    // Populate target lot dropdown with cattle lots
    const lotSelect = document.getElementById('dailyMilkTargetLot');
    if (lotSelect) {
      const cattleLots = (appState.animals || []).filter(a => {
        if (!a || (Number(a.currentQuantity) || 0) <= 0) return false;
        const sp = String(a.species || '').toLowerCase();
        return sp === 'vache_laitiere' || sp === 'taurillon' || sp === 'veau' || sp.includes('bovin');
      });

      let optionsHtml = `<option value="all" data-i18n="opt_all_milking_cows" selected>${this.t('opt_all_milking_cows') || '🐄 Toutes les vaches en lactation'}</option>`;
      cattleLots.forEach(lot => {
        const qty = lot.currentQuantity || 0;
        optionsHtml += `<option value="${lot.id}">🐄 ${lot.name || 'Lot Bovin'} (${qty} têtes)</option>`;
      });
      lotSelect.innerHTML = optionsHtml;
    }

    this.updateDailyMilkPreview();
  },

  updateDailyMilkPreview() {
    const current = Number(appState.milkStock) || 0;
    const input = document.getElementById('dailyMilkLiters');
    const liters = parseFloat(input?.value) || 0;

    const curStockVal = document.getElementById('dailyMilkCurrentStockVal');
    if (curStockVal) curStockVal.textContent = (Number.isInteger(current) ? current : current.toFixed(1)) + ' ' + (this.t('unit_liters_short') || 'L');

    const newStockVal = document.getElementById('dailyMilkNewStockVal');
    const total = current + liters;
    if (newStockVal) newStockVal.textContent = (Number.isInteger(total) ? total : total.toFixed(1)) + ' ' + (this.t('unit_liters_short') || 'L');

    const btnText = document.getElementById('dailyMilkBtnText');
    if (btnText) {
      const lang = appState.lang || 'fr';
      if (liters > 0) {
        if (lang === 'ar') btnText.textContent = `إضافة +${liters} لتر إلى خزان الحليب`;
        else if (lang === 'en') btnText.textContent = `Add +${liters} L to Milk Tank`;
        else btnText.textContent = `Ajouter +${liters} L au Tank à Lait`;
      } else {
        btnText.textContent = this.t('btn_save_milk') || 'Ajouter au Tank à Lait';
      }
    }
  },

  handleSaveDailyMilk(e) {
    if (e && e.preventDefault) e.preventDefault();
    const litersInput = document.getElementById('dailyMilkLiters');
    const liters = parseFloat(litersInput?.value);
    if (!liters || liters <= 0) {
      this.showToast(this.t('err_fill_required') || 'Veuillez saisir un volume valide.');
      return;
    }

    const dateInput = document.getElementById('dailyMilkDate');
    const harvestDate = (dateInput && dateInput.value) ? dateInput.value : this.getTodayStr();
    const session = document.getElementById('dailyMilkingSession')?.value || 'total';
    const targetLotId = document.getElementById('dailyMilkTargetLot')?.value || 'all';

    appState.milkStock = (Number(appState.milkStock) || 0) + liters;
    appState.milkHarvests = appState.milkHarvests || [];
    appState.milkHarvests.unshift({
      id: 'harvest-milk-' + Date.now().toString(36),
      date: harvestDate,
      liters: liters,
      session: session,
      targetLotId: targetLotId,
      timestamp: Date.now()
    });

    this.saveState();
    this.closeModal('modalDailyMilk');
    this.renderMilkStock();
    this.renderMilkProductionChart();
    this.showToast(this.t('toast_milk_saved', { liters: liters, total: Number.isInteger(appState.milkStock) ? appState.milkStock : appState.milkStock.toFixed(1) }));

    if (litersInput) litersInput.value = '';
  },

  // ==========================================
  // MILK PRODUCTION STATISTICS & LINE CHART
  // ==========================================
  setMilkChartPeriod(period) {
    appState.milkChartPeriod = period || '7d';
    this.saveState();
    const card = document.getElementById('milkProductionChartCard');
    if (card) {
      card.querySelectorAll('.milk-period-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-period') === appState.milkChartPeriod);
      });
    }
    this.renderMilkProductionChart();
  },

  renderMilkProductionChart() {
    const card = document.getElementById('milkProductionChartCard');
    const strip = document.getElementById('milkChartMetricsStrip');
    const chartBox = document.getElementById('milkChartContainer');
    if (!card || !chartBox) return;

    const period = appState.milkChartPeriod || '7d';

    // Synchroniser l'état actif des boutons de période
    card.querySelectorAll('.milk-period-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-period') === period);
    });

    const harvests = Array.isArray(appState.milkHarvests) ? appState.milkHarvests : [];

    // Agréger les traites par date (somme matin + soir si plusieurs traites)
    const dailyMap = {};
    harvests.forEach(h => {
      if (!h || !h.date) return;
      const d = String(h.date).trim().split('T')[0];
      if (d) {
        dailyMap[d] = (dailyMap[d] || 0) + (Number(h.liters) || 0);
      }
    });

    const allHarvestDates = Object.keys(dailyMap).sort();
    const hasAnyHarvest = allHarvestDates.length > 0;

    // Déterminer la liste chronologique continue des dates pour la période choisie
    const todayStr = this.getTodayStr();
    const todayParts = todayStr.split('-').map(Number);
    const todayDate = new Date(todayParts[0], todayParts[1] - 1, todayParts[2], 12, 0, 0);

    let datesList = [];

    if (period === 'all') {
      if (allHarvestDates.length === 0) {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(todayDate);
          d.setDate(d.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          datesList.push(`${y}-${m}-${day}`);
        }
      } else {
        const firstStr = allHarvestDates[0];
        const lastStr = allHarvestDates[allHarvestDates.length - 1] > todayStr ? allHarvestDates[allHarvestDates.length - 1] : todayStr;
        const fp = firstStr.split('-').map(Number);
        const lp = lastStr.split('-').map(Number);
        const cur = new Date(fp[0], fp[1] - 1, fp[2], 12, 0, 0);
        const end = new Date(lp[0], lp[1] - 1, lp[2], 12, 0, 0);

        if (cur.getTime() === end.getTime()) {
          cur.setDate(cur.getDate() - 3);
          end.setDate(end.getDate() + 3);
        }

        while (cur <= end) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const day = String(cur.getDate()).padStart(2, '0');
          datesList.push(`${y}-${m}-${day}`);
          cur.setDate(cur.getDate() + 1);
        }
      }
    } else {
      const numDays = period === '30d' ? 30 : (period === '14d' ? 14 : 7);
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(todayDate);
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        datesList.push(`${y}-${m}-${day}`);
      }
    }

    // Points de données avec format JJ/MM
    const points = datesList.map((dt, idx) => {
      const liters = dailyMap[dt] || 0;
      const parts = dt.split('-');
      const label = (parts.length === 3) ? `${parts[2]}/${parts[1]}` : dt;
      return {
        date: dt,
        label: label,
        liters: liters,
        index: idx
      };
    });

    // Métriques clés
    const totalHarvested = points.reduce((sum, p) => sum + p.liters, 0);
    const daysCount = points.length || 1;
    const avgDaily = (totalHarvested / daysCount).toFixed(1);

    let peakLiters = 0;
    let peakDateLabel = '-';
    points.forEach(p => {
      if (p.liters > peakLiters) {
        peakLiters = p.liters;
        peakDateLabel = p.label;
      }
    });

    // Vaches en lactation actives
    const lactatingCows = (appState.animals || [])
      .filter(a => {
        if (!a || (Number(a.currentQuantity) || 0) <= 0) return false;
        const sp = String(a.species || '').toLowerCase();
        const stg = String(a.stage || '').toLowerCase();
        return sp === 'vache_laitiere' || stg.includes('lactation') || stg.includes('traite');
      })
      .reduce((sum, a) => sum + (Number(a.currentQuantity) || 0), 0);

    const lang = appState.lang || 'fr';
    const unitDaysShort = lang === 'ar' ? 'يوم' : (lang === 'en' ? 'd' : 'j');
    const unitLitersShort = this.t('unit_liters_short') || 'L';

    let avgPerCowStr = '-';
    if (lactatingCows > 0) {
      const perCow = (Number(avgDaily) / lactatingCows).toFixed(1);
      avgPerCowStr = `${perCow} ${unitLitersShort}/${lang === 'ar' ? 'بقرة' : 'vache'} (${lactatingCows} 🐄)`;
    } else {
      const activeDays = points.filter(p => p.liters > 0).length;
      avgPerCowStr = `${activeDays}/${daysCount} ${unitDaysShort}`;
    }

    // Affichage métriques clés
    if (strip) {
      strip.innerHTML = `
        <div class="egg-chart-metric-card">
          <span class="egg-chart-metric-lbl" data-i18n="milk_chart_total">${this.t('milk_chart_total')}</span>
          <span class="egg-chart-metric-val" style="color: #0284c7;">
            ${Number.isInteger(totalHarvested) ? totalHarvested.toLocaleString() : totalHarvested.toFixed(1)} <small style="font-size: 0.72rem; font-weight: normal; color: var(--text-muted);">${unitLitersShort}</small>
          </span>
        </div>
        <div class="egg-chart-metric-card">
          <span class="egg-chart-metric-lbl" data-i18n="milk_chart_avg">${this.t('milk_chart_avg')}</span>
          <span class="egg-chart-metric-val" style="color: #38bdf8;">
            ${avgDaily} <small style="font-size: 0.72rem; font-weight: normal; color: var(--text-muted);">${unitLitersShort}/${unitDaysShort}</small>
          </span>
        </div>
        <div class="egg-chart-metric-card">
          <span class="egg-chart-metric-lbl" data-i18n="milk_chart_peak">${this.t('milk_chart_peak')}</span>
          <span class="egg-chart-metric-val" style="color: #f59e0b;">
            ${peakLiters > 0 ? (Number.isInteger(peakLiters) ? peakLiters.toLocaleString() : peakLiters.toFixed(1)) : 0} 
            ${peakLiters > 0 ? `<small style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">(${peakDateLabel})</small>` : ''}
          </span>
        </div>
        <div class="egg-chart-metric-card">
          <span class="egg-chart-metric-lbl" data-i18n="milk_chart_per_cow">${this.t('milk_chart_per_cow')}</span>
          <span class="egg-chart-metric-val" style="color: #a855f7; font-size: 0.95rem;">
            ${avgPerCowStr}
          </span>
        </div>
      `;
    }

    // Si aucune traite dans la base
    if (!hasAnyHarvest) {
      chartBox.innerHTML = `
        <div style="text-align: center; padding: 2.2rem 1rem;">
          <div style="font-size: 2.6rem; margin-bottom: 0.6rem;">🥛</div>
          <div style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.35rem; color: var(--text-main);" data-i18n="milk_chart_empty_title">${this.t('milk_chart_empty_title')}</div>
          <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 440px; margin: 0 auto 1.25rem; line-height: 1.45;" data-i18n="milk_chart_empty_desc">${this.t('milk_chart_empty_desc')}</p>
          <button type="button" class="btn btn-sky" onclick="app.openDailyMilkModal()" style="font-weight: 700; padding: 0.45rem 1.1rem; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 0.4rem;">
            <span>➕</span> <span data-i18n="btn_record_milking">${this.t('btn_record_milking')}</span>
          </button>
        </div>
      `;
      return;
    }

    // SVG Line Chart (ViewBox 680 x 230)
    const svgW = 680;
    const svgH = 230;
    const padL = 46;
    const padR = 25;
    const padT = 28;
    const padB = 42;
    const chartW = svgW - padL - padR;
    const chartH = svgH - padT - padB;

    // Échelle axe Y (Litres)
    const maxVal = Math.max(...points.map(p => p.liters), 0);
    let yMax = 20;
    if (maxVal > 0) {
      yMax = Math.max(20, Math.ceil((maxVal * 1.25) / 10) * 10);
    }

    const n = points.length;
    points.forEach((p, i) => {
      p.cx = n <= 1 ? padL + chartW / 2 : padL + (i / (n - 1)) * chartW;
      p.cy = padT + chartH - (p.liters / yMax) * chartH;
    });

    // Lignes de grille horizontales
    let gridLinesSvg = '';
    const gridSteps = 4;
    for (let s = 0; s <= gridSteps; s++) {
      const ratio = s / gridSteps;
      const yVal = Math.round(ratio * yMax);
      const yPos = padT + chartH - (ratio * chartH);
      gridLinesSvg += `
        <line x1="${padL}" y1="${yPos.toFixed(1)}" x2="${padL + chartW}" y2="${yPos.toFixed(1)}" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="3,3" />
        <text x="${padL - 8}" y="${(yPos + 4).toFixed(1)}" text-anchor="end" font-size="10.5" font-weight="600" fill="var(--text-muted, #94a3b8)">${yVal}L</text>
      `;
    }

    // Courbe Bézier
    let linePath = '';
    if (points.length === 1) {
      linePath = `M ${points[0].cx} ${points[0].cy} L ${points[0].cx + 1} ${points[0].cy}`;
    } else {
      linePath = `M ${points[0].cx.toFixed(1)} ${points[0].cy.toFixed(1)}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : p2;
        const cp1x = p1.cx + (p2.cx - p0.cx) / 6;
        const cp1y = p1.cy + (p2.cy - p0.cy) / 6;
        const cp2x = p2.cx - (p3.cx - p1.cx) / 6;
        const cp2y = p2.cy - (p3.cy - p1.cy) / 6;
        linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.cx.toFixed(1)} ${p2.cy.toFixed(1)}`;
      }
    }

    // Area Gradient
    const baselineY = padT + chartH;
    const areaPath = `${linePath} L ${points[points.length - 1].cx.toFixed(1)} ${baselineY} L ${points[0].cx.toFixed(1)} ${baselineY} Z`;

    // Graduations Axe X
    let xLabelsSvg = '';
    let step = 1;
    if (n > 20) step = 4;
    else if (n > 12) step = 2;

    points.forEach((p, i) => {
      const isFirst = i === 0;
      const isLast = i === n - 1;
      const shouldShow = (i % step === 0) || isFirst || isLast;
      if (shouldShow) {
        xLabelsSvg += `
          <text x="${p.cx.toFixed(1)}" y="${(baselineY + 20).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--text-muted, #94a3b8)">${p.label}</text>
        `;
      }
    });

    // Points interactifs
    let dotsSvg = '';
    points.forEach((p, i) => {
      const isZero = p.liters === 0;
      const dotColor = isZero ? '#64748b' : '#0284c7';
      const r = isZero ? 3.5 : 5.5;

      dotsSvg += `
        <circle cx="${p.cx.toFixed(1)}" cy="${p.cy.toFixed(1)}" r="16" fill="transparent" style="cursor: pointer;" onclick="app.showMilkPointTooltip(${i}, ${p.liters}, '${p.label}', '${p.date}')" onmouseenter="app.showMilkPointTooltip(${i}, ${p.liters}, '${p.label}', '${p.date}')" />
      `;

      dotsSvg += `
        <circle id="milkDot_${i}" class="milk-chart-dot" data-idx="${i}" cx="${p.cx.toFixed(1)}" cy="${p.cy.toFixed(1)}" r="${r}" fill="${dotColor}" stroke="#ffffff" stroke-width="2" style="cursor: pointer;" onclick="app.showMilkPointTooltip(${i}, ${p.liters}, '${p.label}', '${p.date}')" onmouseenter="app.showMilkPointTooltip(${i}, ${p.liters}, '${p.label}', '${p.date}')" />
      `;

      if (p.liters > 0 && (n <= 14 || p.liters === peakLiters)) {
        const displayVal = Number.isInteger(p.liters) ? p.liters : p.liters.toFixed(1);
        dotsSvg += `
          <g class="egg-point-badge">
            <rect x="${(p.cx - 15).toFixed(1)}" y="${(p.cy - 22).toFixed(1)}" width="30" height="15" rx="3.5" fill="rgba(2, 132, 199, 0.9)" />
            <text x="${p.cx.toFixed(1)}" y="${(p.cy - 11).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#ffffff">${displayVal}</text>
          </g>
        `;
      }
    });

    chartBox.innerHTML = `
      <div style="position: relative; width: 100%;">
        <svg class="milk-chart-svg" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="milkAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0284c7" stop-opacity="0.38"/>
              <stop offset="85%" stop-color="#0284c7" stop-opacity="0.04"/>
              <stop offset="100%" stop-color="#0284c7" stop-opacity="0.0"/>
            </linearGradient>
            <filter id="milkLineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0284c7" flood-opacity="0.35"/>
            </filter>
          </defs>

          <!-- Axes et Grille -->
          <line x1="${padL}" y1="${baselineY}" x2="${padL + chartW}" y2="${baselineY}" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.5" />
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${baselineY}" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.5" />
          ${gridLinesSvg}
          ${xLabelsSvg}

          <!-- Remplissage dégradé -->
          <path d="${areaPath}" fill="url(#milkAreaGrad)" />

          <!-- Ligne de courbe -->
          <path d="${linePath}" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#milkLineGlow)" />

          <!-- Ligne repère verticale active -->
          <line id="milkChartActiveLine" x1="0" y1="${padT}" x2="0" y2="${baselineY}" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3,3" stroke-opacity="0.5" style="display: none; transition: x1 0.2s ease, x2 0.2s ease;" />

          <!-- Points et valeurs -->
          ${dotsSvg}
        </svg>

        <!-- Détails interactifs sous le graphique -->
        <div id="milkChartPointDetails" class="milk-chart-point-details"></div>
      </div>
    `;

    // Mémorisation des points pour les interactions et sélection par défaut du dernier jour
    this._milkChartPoints = points;
    if (points && points.length > 0) {
      const lastIdx = points.length - 1;
      this.showMilkPointTooltip(lastIdx, points[lastIdx].liters, points[lastIdx].label, points[lastIdx].date);
    }
  },

  showMilkPointTooltip(idx, liters, dateLabel, fullDate) {
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitLiters = this.t('unit_liters_short') || 'L';
    const cansLabel = this.t('milk_equiv_cans') || 'Bidons (20L)';
    const zeroLabel = this.t('milk_chart_zero_harvest') || (isAr ? 'لا يوجد حلب هذا اليوم' : (isEn ? 'No milking this day' : 'Aucune traite ce jour'));

    const cans = (liters / 20).toFixed(1);

    // 1. Mise à jour de la surbrillance
    const dots = document.querySelectorAll('.milk-chart-dot');
    dots.forEach(d => d.classList.remove('active-dot'));
    const activeDot = document.getElementById('milkDot_' + idx);
    if (activeDot) {
      activeDot.classList.add('active-dot');
    }

    // 2. Positionner la ligne verticale de repère
    const activeLine = document.getElementById('milkChartActiveLine');
    if (activeLine && this._milkChartPoints && this._milkChartPoints[idx]) {
      const pt = this._milkChartPoints[idx];
      activeLine.setAttribute('x1', pt.cx.toFixed(1));
      activeLine.setAttribute('x2', pt.cx.toFixed(1));
      activeLine.style.display = 'block';
    }

    // 3. Formatage date
    let dateDisplay = fullDate || dateLabel;
    try {
      if (fullDate) {
        const parts = fullDate.split('-');
        if (parts.length === 3) {
          const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          const locale = isAr ? 'ar-TN' : (isEn ? 'en-US' : 'fr-FR');
          dateDisplay = dateObj.toLocaleDateString(locale, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        }
      }
    } catch (e) {
      dateDisplay = fullDate || dateLabel;
    }

    // 4. Détails inline
    const detailsEl = document.getElementById('milkChartPointDetails');
    if (!detailsEl) return;

    if (liters <= 0) {
      detailsEl.innerHTML = `
        <div class="egg-chart-point-details-left">
          <span style="font-size: 1.15rem;">📅</span>
          <span class="egg-chart-point-date-badge" style="background: rgba(2, 132, 199, 0.15); color: #0284c7;">${dateLabel}</span>
          <span class="egg-chart-point-date-full">${dateDisplay}</span>
        </div>
        <div class="egg-chart-point-details-right">
          <span class="egg-chart-pill milk-chart-pill pill-milk-zero">🥛 0 ${unitLiters} (${zeroLabel})</span>
        </div>
      `;
    } else {
      const valStr = Number.isInteger(liters) ? liters : liters.toFixed(1);
      detailsEl.innerHTML = `
        <div class="egg-chart-point-details-left">
          <span style="font-size: 1.15rem;">📅</span>
          <span class="egg-chart-point-date-badge" style="background: rgba(2, 132, 199, 0.15); color: #0284c7;">${dateLabel}</span>
          <span class="egg-chart-point-date-full">${dateDisplay}</span>
        </div>
        <div class="egg-chart-point-details-right">
          <span class="egg-chart-pill milk-chart-pill pill-milk">🥛 <strong>${valStr}</strong> ${unitLiters}</span>
          <span class="egg-chart-pill pill-haras">~<strong>${cans}</strong> ${cansLabel}</span>
        </div>
      `;
    }
  },

  // ==========================================
  // MILK SALES FROM TANK
  // ==========================================
  openSellMilkModal() {
    const stock = Number(appState.milkStock) || 0;
    if (stock <= 0) {
      this.showToast(appState.lang === 'ar' ? '⚠️ رصيد الحليب فارغ حالياً. سجل حلب جديد أولاً.' : (appState.lang === 'en' ? '⚠️ Milk stock is empty. Record a milking first.' : '⚠️ Votre stock de lait est vide. Enregistrez une traite d\'abord.'));
      return;
    }
    this.openModal('modalSellMilkStock');
    const availEl = document.getElementById('sellMilkStockAvailable');
    if (availEl) availEl.textContent = `${Number.isInteger(stock) ? stock : stock.toFixed(1)} ${this.t('unit_liters_short') || 'L'}`;

    const qtyInput = document.getElementById('sellMilkQty');
    if (qtyInput) {
      qtyInput.value = '';
      qtyInput.max = stock;
    }

    const priceInput = document.getElementById('sellMilkUnitPrice');
    if (priceInput) {
      const isTND = appState.currency === 'TND';
      priceInput.value = isTND ? '1.450' : '1.20';
    }

    this.calcSellMilkTotal();
  },

  calcSellMilkTotal() {
    const q = parseFloat(document.getElementById('sellMilkQty')?.value) || 0;
    const p = parseFloat(document.getElementById('sellMilkUnitPrice')?.value) || 0;
    const stock = Number(appState.milkStock) || 0;

    const hintEl = document.getElementById('sellMilkEquivHint');
    if (hintEl) {
      const lang = appState.lang || 'fr';
      const unitL = this.t('unit_liters_short') || 'L';
      if (q > stock) {
        hintEl.innerHTML = `<span class="text-rose bold">⚠️ ${q} ${unitL} (${lang === 'ar' ? 'يتجاوز الرصيد المتوفر' : 'dépasse le tank disponible'}) !</span>`;
      } else {
        const remaining = stock - q;
        const remStr = Number.isInteger(remaining) ? remaining : remaining.toFixed(1);
        hintEl.textContent = `🥛 ${q} ${unitL} (${remStr} ${unitL} ${lang === 'ar' ? 'سيبقى بالخزان' : 'restants après vente'})`;
      }
    }

    const totalRevenue = q * p;
    const revEl = document.getElementById('sellMilkTotalRevenue');
    if (revEl) revEl.textContent = this.formatMoney(totalRevenue);
  },

  handleSaveSellMilkStock(e) {
    if (e && e.preventDefault) e.preventDefault();
    const q = parseFloat(document.getElementById('sellMilkQty')?.value) || 0;
    const unitPrice = parseFloat(document.getElementById('sellMilkUnitPrice')?.value) || 0;
    const total = q * unitPrice;
    const stock = Number(appState.milkStock) || 0;

    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';

    if (q <= 0) {
      this.showToast(isAr ? 'يرجى إدخال كمية صحيحة.' : (isEn ? 'Please enter a valid quantity.' : 'Veuillez saisir une quantité valide.'));
      return;
    }
    if (q > stock) {
      this.showToast(isAr 
        ? `الكمية المراد بيعها (${q} لتر) تتجاوز الرصيد المتوفر (${stock} لتر)` 
        : (isEn ? `The quantity to sell (${q} L) exceeds available stock (${stock} L).` : `La quantité à vendre (${q} L) dépasse votre stock disponible (${stock} L).`), 'warning');
      return;
    }

    const todayStr = this.getTodayStr();
    const lang = appState.lang || 'fr';
    let desc = `Vente de lait frais depuis le tank (${q} Litres)`;
    if (lang === 'ar') desc = `بيع حليب طازج من الخزان (${q} لتر)`;
    else if (lang === 'en') desc = `Fresh milk sale from tank (${q} Liters)`;

    const newSale = {
      id: 'sale-' + Date.now().toString(36),
      date: todayStr,
      productType: 'lait',
      description: desc,
      quantity: q,
      unitPrice: unitPrice,
      total: total,
      linkedLotId: 'none',
      ageText: ''
    };

    appState.sales.unshift(newSale);
    appState.milkStock = Math.max(0, stock - q);

    this.saveState();
    this.closeModal('modalSellMilkStock');
    this.renderAll();
    this.showToast(this.t('toast_milk_sold', {
      liters: q,
      amount: this.formatMoney(total),
      remaining: Number.isInteger(appState.milkStock) ? appState.milkStock : appState.milkStock.toFixed(1)
    }));
  },

  // ==========================================
  // MILK ALLOCATION TO CALVES (ALLAITEMENT)
  // ==========================================
  openCalfMilkModal() {
    const stock = Number(appState.milkStock) || 0;
    if (stock <= 0) {
      this.showToast(appState.lang === 'ar' ? '⚠️ لا يوجد حليب في الخزان.' : (appState.lang === 'en' ? '⚠️ No milk in tank.' : '⚠️ Aucun lait dans le tank.'));
      return;
    }
    this.openModal('modalCalfMilkStock');
    const availEl = document.getElementById('calfMilkStockAvailable');
    if (availEl) availEl.textContent = `${Number.isInteger(stock) ? stock : stock.toFixed(1)} ${this.t('unit_liters_short') || 'L'}`;

    const input = document.getElementById('calfMilkQty');
    if (input) {
      input.value = '';
      input.max = stock;
    }
  },

  handleSaveCalfMilkStock(e) {
    if (e && e.preventDefault) e.preventDefault();
    const q = parseFloat(document.getElementById('calfMilkQty')?.value) || 0;
    const stock = Number(appState.milkStock) || 0;
    if (q <= 0) return;
    if (q > stock) {
      const isAr = appState.lang === 'ar';
      this.showToast(isAr ? `الكمية تتجاوز الرصيد الحالي (${stock} لتر)` : `La quantité dépasse le stock actuel (${stock} L).`, 'warning');
      return;
    }

    appState.milkStock = Math.max(0, stock - q);
    this.saveState();
    this.closeModal('modalCalfMilkStock');
    this.renderMilkStock();
    this.renderMilkProductionChart();
    this.showToast(this.t('toast_milk_calves', {
      liters: q,
      remaining: Number.isInteger(appState.milkStock) ? appState.milkStock : appState.milkStock.toFixed(1)
    }));
  },

  // ==========================================
  // MILK CONSUMPTION / CHEESE / LOSSES
  // ==========================================
  openConsumeMilkModal() {
    const stock = Number(appState.milkStock) || 0;
    if (stock <= 0) {
      this.showToast(appState.lang === 'ar' ? '⚠️ لا يوجد حليب في الخزان.' : (appState.lang === 'en' ? '⚠️ No milk in tank.' : '⚠️ Aucun lait dans le tank.'));
      return;
    }
    this.openModal('modalConsumeMilkStock');
    const availEl = document.getElementById('consumeMilkStockAvailable');
    if (availEl) availEl.textContent = `${Number.isInteger(stock) ? stock : stock.toFixed(1)} ${this.t('unit_liters_short') || 'L'}`;

    const input = document.getElementById('consumeMilkQty');
    if (input) {
      input.value = '';
      input.max = stock;
    }
  },

  handleSaveConsumeMilkStock(e) {
    if (e && e.preventDefault) e.preventDefault();
    const q = parseFloat(document.getElementById('consumeMilkQty')?.value) || 0;
    const stock = Number(appState.milkStock) || 0;
    const reasonSelect = document.getElementById('consumeMilkReason');
    const reasonKey = reasonSelect ? reasonSelect.options[reasonSelect.selectedIndex]?.getAttribute('data-i18n') : null;
    const reasonText = (reasonKey ? this.t(reasonKey) : null) || reasonSelect?.value || 'Consommation';

    if (q <= 0) return;
    if (q > stock) {
      const isAr = appState.lang === 'ar';
      this.showToast(isAr ? `الكمية تتجاوز الرصيد الحالي (${stock} لتر)` : `La quantité dépasse le stock actuel (${stock} L).`, 'warning');
      return;
    }

    appState.milkStock = Math.max(0, stock - q);
    this.saveState();
    this.closeModal('modalConsumeMilkStock');
    this.renderMilkStock();
    this.renderMilkProductionChart();
    this.showToast(this.t('toast_milk_consumed', {
      liters: q,
      reason: reasonText,
      remaining: Number.isInteger(appState.milkStock) ? appState.milkStock : appState.milkStock.toFixed(1)
    }));
  },

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
    const dateInput = document.getElementById('dailyEggDate');
    if (dateInput) {
      dateInput.value = this.getTodayStr();
    }
    if (input) {
      input.value = '';
      input.placeholder = '';
      input.removeAttribute('placeholder');
      setTimeout(() => {
        input.focus();
        input.select();
      }, 150);
    }
    this.updateDailyEggPreview();
  },

  dismissDailyEggAlert() {
    const todayStr = this.getTodayStr();
    localStorage.setItem('fermegest_egg_banner_dismissed', todayStr);
    const banner = document.getElementById('dailyEggAlertBanner');
    if (banner) {
      banner.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-10px) scale(0.98)';
      setTimeout(() => {
        banner.style.display = 'none';
        banner.style.opacity = '1';
        banner.style.transform = 'none';
      }, 300);
    }
  },

  checkDailyEggInAppAlert() {
    const banner = document.getElementById('dailyEggAlertBanner');
    if (!banner) return;
    const now = new Date();
    const todayStr = this.getTodayStr();
    const isAfter17 = now.getHours() >= 17;
    const isDismissed = localStorage.getItem('fermegest_egg_banner_dismissed') === todayStr;
    const alreadyHarvestedToday = (appState.eggHarvests || []).some(h => {
      if (!h || !h.date) return false;
      return String(h.date).split('T')[0] === todayStr && (Number(h.count) || 0) > 0;
    });

    if (isAfter17 && !isDismissed && !alreadyHarvestedToday) {
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  },

  checkDailyFeedInAppAlert() {
    const banner = document.getElementById('dailyFeedAlertBanner');
    if (!banner) return;
    const now = new Date();
    const todayStr = this.getTodayStr();
    const isAfter16 = now.getHours() >= 16;
    const isDismissed = localStorage.getItem('fermegest_feed_banner_dismissed') === todayStr;
    const todayDistributions = (appState.feedDistributions || []).filter(d => d && (d.date === todayStr || (d.date && String(d.date).split('T')[0] === todayStr)));
    const alreadyFedToday = todayDistributions.reduce((s, d) => s + (Number(d.totalKg) || Number(d.quantityKg) || 0), 0) > 0;

    if (isAfter16 && !isDismissed && !alreadyFedToday) {
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  },

  dismissDailyFeedAlert() {
    const banner = document.getElementById('dailyFeedAlertBanner');
    if (banner) {
      banner.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-10px) scale(0.98)';
      setTimeout(() => {
        banner.style.display = 'none';
        banner.style.opacity = '1';
        banner.style.transform = 'none';
      }, 300);
    }
    const todayStr = this.getTodayStr();
    localStorage.setItem('fermegest_feed_banner_dismissed', todayStr);
    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';
    this.showToast(isAr ? 'تم إخفاء تذكير العلف لليوم.' : (isEn ? 'Daily feed reminder dismissed for today.' : 'Rappel nourriture masqué pour aujourd\'hui.'));
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

    const dateInput = document.getElementById('dailyEggDate');
    const harvestDate = (dateInput && dateInput.value) ? dateInput.value : this.getTodayStr();

    appState.eggStock = (Number(appState.eggStock) || 0) + count;
    appState.eggHarvests = appState.eggHarvests || [];
    appState.eggHarvests.unshift({
      id: 'harvest-' + Date.now().toString(36),
      date: harvestDate,
      count: count
    });

    localStorage.setItem('fermegest_last_egg_notif_date', harvestDate);

    this.saveState();
    this.closeModal('modalDailyEggs');
    this.dismissDailyEggAlert();
    this.renderEggStock();
    this.renderEggProductionChart();
    this.showToast(this.t('daily_eggs_toast_success', { count: count, total: appState.eggStock }));

    if (countInput) countInput.value = '';
  },

  // ==========================================
  // EGG PRODUCTION STATISTICS & LINE CHART
  // ==========================================
  setEggChartPeriod(period) {
    appState.eggChartPeriod = period || '7d';
    this.saveState();
    const card = document.getElementById('eggProductionChartCard');
    if (card) {
      card.querySelectorAll('.egg-period-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-period') === appState.eggChartPeriod);
      });
    }
    this.renderEggProductionChart();
  },

  renderEggProductionChart() {
    const card = document.getElementById('eggProductionChartCard');
    const strip = document.getElementById('eggChartMetricsStrip');
    const chartBox = document.getElementById('eggChartContainer');
    if (!card || !chartBox) return;

    const period = appState.eggChartPeriod || '7d';

    // Synchroniser l'état actif des boutons de période
    card.querySelectorAll('.egg-period-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-period') === period);
    });

    const harvests = Array.isArray(appState.eggHarvests) ? appState.eggHarvests : [];

    // Agréger les récoltes par date (somme si plusieurs ramassages le même jour)
    const dailyMap = {};
    harvests.forEach(h => {
      if (!h || !h.date) return;
      const d = String(h.date).trim().split('T')[0];
      if (d) {
        dailyMap[d] = (dailyMap[d] || 0) + (Number(h.count) || 0);
      }
    });

    const allHarvestDates = Object.keys(dailyMap).sort();
    const hasAnyHarvest = allHarvestDates.length > 0;

    // Déterminer la liste chronologique continue des dates pour la période choisie
    const todayStr = this.getTodayStr();
    const todayParts = todayStr.split('-').map(Number);
    const todayDate = new Date(todayParts[0], todayParts[1] - 1, todayParts[2], 12, 0, 0);

    let datesList = [];

    if (period === 'all') {
      if (allHarvestDates.length === 0) {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(todayDate);
          d.setDate(d.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          datesList.push(`${y}-${m}-${day}`);
        }
      } else {
        const firstStr = allHarvestDates[0];
        const lastStr = allHarvestDates[allHarvestDates.length - 1] > todayStr ? allHarvestDates[allHarvestDates.length - 1] : todayStr;
        const fp = firstStr.split('-').map(Number);
        const lp = lastStr.split('-').map(Number);
        const cur = new Date(fp[0], fp[1] - 1, fp[2], 12, 0, 0);
        const end = new Date(lp[0], lp[1] - 1, lp[2], 12, 0, 0);

        if (cur.getTime() === end.getTime()) {
          cur.setDate(cur.getDate() - 3);
          end.setDate(end.getDate() + 3);
        }

        while (cur <= end) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const day = String(cur.getDate()).padStart(2, '0');
          datesList.push(`${y}-${m}-${day}`);
          cur.setDate(cur.getDate() + 1);
        }
      }
    } else {
      const numDays = period === '30d' ? 30 : (period === '14d' ? 14 : 7);
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(todayDate);
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        datesList.push(`${y}-${m}-${day}`);
      }
    }

    // Points de données avec format d'axe X demandé (JJ/MM ex: 12/01)
    const points = datesList.map((dt, idx) => {
      const count = dailyMap[dt] || 0;
      const parts = dt.split('-');
      const label = (parts.length === 3) ? `${parts[2]}/${parts[1]}` : dt;
      return {
        date: dt,
        label: label,
        count: count,
        index: idx
      };
    });

    // Métriques clés de production
    const totalHarvested = points.reduce((sum, p) => sum + p.count, 0);
    const daysCount = points.length || 1;
    const avgDaily = (totalHarvested / daysCount).toFixed(1);

    let peakCount = 0;
    let peakDateLabel = '-';
    points.forEach(p => {
      if (p.count > peakCount) {
        peakCount = p.count;
        peakDateLabel = p.label;
      }
    });

    // Taux de ponte basé sur les poules pondeuses actives
    const layingFemales = (appState.animals || [])
      .filter(a => {
        if (!a || (Number(a.currentQuantity) || 0) <= 0) return false;
        const sp = String(a.species || '').toLowerCase();
        const brd = String(a.breed || '').toLowerCase();
        const stg = String(a.stage || '').toLowerCase();
        return sp === 'pondeuse' || brd.includes('ponte') || stg.includes('ponte') || stg.includes('lay') || (sp === 'poulet' && (a.gender === 'femelle' || a.gender === 'female'));
      })
      .reduce((sum, a) => sum + (Number(a.currentQuantity) || 0), 0);

    const lang = appState.lang || 'fr';
    const unitDaysShort = lang === 'ar' ? 'يوم' : (lang === 'en' ? 'd' : 'j');
    let layRateStr = '-';
    if (layingFemales > 0) {
      const ratePct = Math.min(100, Math.round((Number(avgDaily) / layingFemales) * 100));
      layRateStr = `${ratePct}% (${layingFemales} ${this.t('chip_pondeuse') || 'pondeuses'})`;
    } else {
      const activeDays = points.filter(p => p.count > 0).length;
      layRateStr = `${activeDays}/${daysCount} ${unitDaysShort}`;
    }

    // Affichage du bandeau de métriques
    if (strip) {
      const unitEggs = this.t('unit_eggs') || 'œufs';
      strip.innerHTML = `
        <div class="egg-chart-metric-card">
          <span class="egg-chart-metric-lbl" data-i18n="egg_chart_total">${this.t('egg_chart_total')}</span>
          <span class="egg-chart-metric-val" style="color: var(--accent-emerald);">
            ${totalHarvested.toLocaleString()} <small style="font-size: 0.72rem; font-weight: normal; color: var(--text-muted);">${unitEggs}</small>
          </span>
        </div>
        <div class="egg-chart-metric-card">
          <span class="egg-chart-metric-lbl" data-i18n="egg_chart_avg">${this.t('egg_chart_avg')}</span>
          <span class="egg-chart-metric-val" style="color: #38bdf8;">
            ${avgDaily} <small style="font-size: 0.72rem; font-weight: normal; color: var(--text-muted);">${unitEggs}/${unitDaysShort}</small>
          </span>
        </div>
        <div class="egg-chart-metric-card">
          <span class="egg-chart-metric-lbl" data-i18n="egg_chart_peak">${this.t('egg_chart_peak')}</span>
          <span class="egg-chart-metric-val" style="color: #f59e0b;">
            ${peakCount > 0 ? peakCount.toLocaleString() : 0} 
            ${peakCount > 0 ? `<small style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">(${peakDateLabel})</small>` : ''}
          </span>
        </div>
        <div class="egg-chart-metric-card">
          <span class="egg-chart-metric-lbl" data-i18n="egg_chart_rate">${this.t('egg_chart_rate')}</span>
          <span class="egg-chart-metric-val" style="color: #a855f7; font-size: 0.95rem;">
            ${layRateStr}
          </span>
        </div>
      `;
    }

    // Si aucune récolte dans la base
    if (!hasAnyHarvest) {
      chartBox.innerHTML = `
        <div style="text-align: center; padding: 2.2rem 1rem;">
          <div style="font-size: 2.6rem; margin-bottom: 0.6rem;">🥚</div>
          <div style="font-weight: 800; font-size: 1.05rem; margin-bottom: 0.35rem; color: var(--text-main);" data-i18n="egg_chart_empty_title">${this.t('egg_chart_empty_title')}</div>
          <p style="font-size: 0.85rem; color: var(--text-muted); max-width: 440px; margin: 0 auto 1.25rem; line-height: 1.45;" data-i18n="egg_chart_empty_desc">${this.t('egg_chart_empty_desc')}</p>
          <button type="button" class="btn btn-emerald" onclick="app.openDailyEggModal()" style="font-weight: 700; padding: 0.45rem 1.1rem; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 0.4rem;">
            <span>➕</span> <span data-i18n="daily_eggs_btn_save">${this.t('daily_eggs_btn_save')}</span>
          </button>
        </div>
      `;
      return;
    }

    // Génération du SVG Line Chart (ViewBox 680 x 230)
    const svgW = 680;
    const svgH = 230;
    const padL = 46;
    const padR = 25;
    const padT = 28;
    const padB = 42;
    const chartW = svgW - padL - padR;
    const chartH = svgH - padT - padB;

    // Échelle axe Y (nombre d'œufs)
    const maxVal = Math.max(...points.map(p => p.count), 0);
    let yMax = 10;
    if (maxVal > 0) {
      yMax = Math.max(10, Math.ceil((maxVal * 1.25) / 5) * 5);
    }

    const n = points.length;
    points.forEach((p, i) => {
      p.cx = n <= 1 ? padL + chartW / 2 : padL + (i / (n - 1)) * chartW;
      p.cy = padT + chartH - (p.count / yMax) * chartH;
    });

    // Lignes de grille horizontales
    let gridLinesSvg = '';
    const gridSteps = 4;
    for (let s = 0; s <= gridSteps; s++) {
      const ratio = s / gridSteps;
      const yVal = Math.round(ratio * yMax);
      const yPos = padT + chartH - (ratio * chartH);
      gridLinesSvg += `
        <line x1="${padL}" y1="${yPos.toFixed(1)}" x2="${padL + chartW}" y2="${yPos.toFixed(1)}" stroke="currentColor" stroke-opacity="0.1" stroke-dasharray="3,3" />
        <text x="${padL - 8}" y="${(yPos + 4).toFixed(1)}" text-anchor="end" font-size="10.5" font-weight="600" fill="var(--text-muted, #94a3b8)">${yVal}</text>
      `;
    }

    // Courbe lissée Bézier
    let linePath = '';
    if (points.length === 1) {
      linePath = `M ${points[0].cx} ${points[0].cy} L ${points[0].cx + 1} ${points[0].cy}`;
    } else {
      linePath = `M ${points[0].cx.toFixed(1)} ${points[0].cy.toFixed(1)}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : p2;
        const cp1x = p1.cx + (p2.cx - p0.cx) / 6;
        const cp1y = p1.cy + (p2.cy - p0.cy) / 6;
        const cp2x = p2.cx - (p3.cx - p1.cx) / 6;
        const cp2y = p2.cy - (p3.cy - p1.cy) / 6;
        linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.cx.toFixed(1)} ${p2.cy.toFixed(1)}`;
      }
    }

    // Remplissage sous la courbe (Area Gradient)
    const baselineY = padT + chartH;
    const areaPath = `${linePath} L ${points[points.length - 1].cx.toFixed(1)} ${baselineY} L ${points[0].cx.toFixed(1)} ${baselineY} Z`;

    // Graduations Axe X (JJ/MM, ex : 12/01)
    let xLabelsSvg = '';
    let step = 1;
    if (n > 20) step = 4;
    else if (n > 12) step = 2;

    points.forEach((p, i) => {
      const isFirst = i === 0;
      const isLast = i === n - 1;
      const shouldShow = (i % step === 0) || isFirst || isLast;
      if (shouldShow) {
        xLabelsSvg += `
          <text x="${p.cx.toFixed(1)}" y="${(baselineY + 20).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--text-muted, #94a3b8)">${p.label}</text>
        `;
      }
    });

    // Points interactifs & pastilles de valeur
    let dotsSvg = '';
    points.forEach((p, i) => {
      const isZero = p.count === 0;
      const dotColor = isZero ? '#64748b' : '#10b981';
      const r = isZero ? 3.5 : 5.5;

      dotsSvg += `
        <circle cx="${p.cx.toFixed(1)}" cy="${p.cy.toFixed(1)}" r="16" fill="transparent" style="cursor: pointer;" onclick="app.showEggPointTooltip(${i}, ${p.count}, '${p.label}', '${p.date}')" onmouseenter="app.showEggPointTooltip(${i}, ${p.count}, '${p.label}', '${p.date}')" />
      `;

      dotsSvg += `
        <circle id="eggDot_${i}" class="egg-chart-dot" data-idx="${i}" cx="${p.cx.toFixed(1)}" cy="${p.cy.toFixed(1)}" r="${r}" fill="${dotColor}" stroke="#ffffff" stroke-width="2" style="cursor: pointer;" onclick="app.showEggPointTooltip(${i}, ${p.count}, '${p.label}', '${p.date}')" onmouseenter="app.showEggPointTooltip(${i}, ${p.count}, '${p.label}', '${p.date}')" />
      `;

      if (p.count > 0 && (n <= 14 || p.count === peakCount)) {
        dotsSvg += `
          <g class="egg-point-badge">
            <rect x="${(p.cx - 14).toFixed(1)}" y="${(p.cy - 22).toFixed(1)}" width="28" height="15" rx="3.5" fill="rgba(16, 185, 129, 0.9)" />
            <text x="${p.cx.toFixed(1)}" y="${(p.cy - 11).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#ffffff">${p.count}</text>
          </g>
        `;
      }
    });

    chartBox.innerHTML = `
      <div style="position: relative; width: 100%;">
        <svg class="egg-chart-svg" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="eggAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.38"/>
              <stop offset="85%" stop-color="#10b981" stop-opacity="0.04"/>
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.0"/>
            </linearGradient>
            <filter id="eggLineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#10b981" flood-opacity="0.35"/>
            </filter>
          </defs>

          <!-- Axes et Grille -->
          <line x1="${padL}" y1="${baselineY}" x2="${padL + chartW}" y2="${baselineY}" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.5" />
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${baselineY}" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.5" />
          ${gridLinesSvg}
          ${xLabelsSvg}

          <!-- Remplissage dégradé -->
          <path d="${areaPath}" fill="url(#eggAreaGrad)" />

          <!-- Ligne de courbe -->
          <path d="${linePath}" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#eggLineGlow)" />

          <!-- Ligne repère verticale active -->
          <line id="eggChartActiveLine" x1="0" y1="${padT}" x2="0" y2="${baselineY}" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3,3" stroke-opacity="0.5" style="display: none; transition: x1 0.2s ease, x2 0.2s ease;" />

          <!-- Points et valeurs -->
          ${dotsSvg}
        </svg>

        <!-- Détails interactifs sous le graphique (sans toast) -->
        <div id="eggChartPointDetails" class="egg-chart-point-details"></div>
      </div>
    `;

    // Mémorisation des points pour les interactions et sélection par défaut du dernier jour
    this._eggChartPoints = points;
    if (points && points.length > 0) {
      const lastIdx = points.length - 1;
      this.showEggPointTooltip(lastIdx, points[lastIdx].count, points[lastIdx].label, points[lastIdx].date);
    }
  },

  showEggPointTooltip(idx, count, dateLabel, fullDate) {
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitEggs = this.t('unit_eggs') || (isAr ? 'بيضة' : (isEn ? 'eggs' : 'œufs'));
    const harasLabel = this.t('egg_chart_hara_unit') || (isAr ? 'حارة (×4)' : (isEn ? 'Haras (×4)' : 'Haras (×4)'));
    const platesLabel = this.t('egg_chart_tray_unit') || (isAr ? 'أطباق (×30)' : (isEn ? 'Trays (×30)' : 'Plateaux (×30)'));
    const zeroLabel = this.t('egg_chart_zero_harvest') || (isAr ? 'لا يوجد بيض تم جمعه' : (isEn ? 'No eggs harvested' : 'Aucun œuf récolté'));

    const haras = (count / 4).toFixed(1);
    const plates = (count / 30).toFixed(1);

    // 1. Mise à jour de la surbrillance des points dans le SVG
    const dots = document.querySelectorAll('.egg-chart-dot');
    dots.forEach(d => d.classList.remove('active-dot'));
    const activeDot = document.getElementById('eggDot_' + idx);
    if (activeDot) {
      activeDot.classList.add('active-dot');
    }

    // 2. Positionner la ligne verticale de repère
    const activeLine = document.getElementById('eggChartActiveLine');
    if (activeLine && this._eggChartPoints && this._eggChartPoints[idx]) {
      const pt = this._eggChartPoints[idx];
      activeLine.setAttribute('x1', pt.cx.toFixed(1));
      activeLine.setAttribute('x2', pt.cx.toFixed(1));
      activeLine.style.display = 'block';
    }

    // 3. Formatage de la date conviviale
    let dateDisplay = fullDate || dateLabel;
    try {
      if (fullDate) {
        const parts = fullDate.split('-');
        if (parts.length === 3) {
          const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          const locale = isAr ? 'ar-TN' : (isEn ? 'en-US' : 'fr-FR');
          dateDisplay = dateObj.toLocaleDateString(locale, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        }
      }
    } catch (e) {
      dateDisplay = fullDate || dateLabel;
    }

    // 4. Affichage inline dans le conteneur du graphique
    const detailsEl = document.getElementById('eggChartPointDetails');
    if (!detailsEl) return;

    if (count <= 0) {
      detailsEl.innerHTML = `
        <div class="egg-chart-point-details-left">
          <span style="font-size: 1.15rem;">📅</span>
          <span class="egg-chart-point-date-badge">${dateLabel}</span>
          <span class="egg-chart-point-date-full">${dateDisplay}</span>
        </div>
        <div class="egg-chart-point-details-right">
          <span class="egg-chart-pill pill-eggs-zero">🥚 0 ${unitEggs} (${zeroLabel})</span>
        </div>
      `;
    } else {
      detailsEl.innerHTML = `
        <div class="egg-chart-point-details-left">
          <span style="font-size: 1.15rem;">📅</span>
          <span class="egg-chart-point-date-badge">${dateLabel}</span>
          <span class="egg-chart-point-date-full">${dateDisplay}</span>
        </div>
        <div class="egg-chart-point-details-right">
          <span class="egg-chart-pill pill-eggs">🥚 <strong>${count}</strong> ${unitEggs}</span>
          <span class="egg-chart-pill pill-haras">~<strong>${haras}</strong> ${harasLabel}</span>
          <span class="egg-chart-pill pill-plates">~<strong>${plates}</strong> ${platesLabel}</span>
        </div>
      `;
    }
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

    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';

    if (totalEggs <= 0) {
      this.showToast(isAr ? 'يرجى إدخال كمية صحيحة.' : (isEn ? 'Please enter a valid quantity.' : 'Veuillez saisir une quantité valide.'));
      return;
    }
    if (totalEggs > stock) {
      this.showToast(isAr 
        ? `الكمية المراد بيعها (${totalEggs} بيضة) تتجاوز الرصيد المتوفر (${stock} بيضة)` 
        : (isEn ? `The quantity to sell (${totalEggs} eggs) exceeds available stock (${stock} eggs).` : `La quantité à vendre (${totalEggs} œufs) dépasse votre stock disponible (${stock} œufs).`), 'warning');
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
      const isAr = (appState.lang || this.currentLang) === 'ar';
      const isEn = (appState.lang || this.currentLang) === 'en';
      this.showToast(isAr ? '⚠️ لا يوجد بيض في المخزون.' : (isEn ? '⚠️ No eggs in stock.' : '⚠️ Aucun œuf en stock.'));
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
      let html = `<option value="general" ${defaultGeneralSelected}>${this.t('opt_general_farm') || "🏢 Frais Généraux de l'Exploitation (Tous les lots)"}</option>`;
      if (appState.animals && appState.animals.length > 1) {
        html += `<option value="__multiple__">${lang === 'ar' ? '🎯 تحديد عدة دفعات معاً (2 أو 3 دفعات...)' : '🎯 Sélectionner plusieurs lots (2 ou 3 lots...)'}</option>`;
      }
      appState.animals.forEach((a, idx) => {
        const isSelected = (appState.animals.length === 1) ? 'selected' : '';
        const displayName = this.getAnimalDisplayName(a);
        const lotPrefix = (a.name && a.name.toString().trim() !== '') ? (lang === 'ar' ? `دفعة #${a.name} - ` : `Lot #${a.name} - `) : '';
        html += `<option value="${a.id}" ${isSelected}>${lotPrefix}${displayName}</option>`;
      });
      expenseLotSelect.innerHTML = html;
      this.onExpenseLotSelectChange(expenseLotSelect.value);
    }

    if (saleLotSelect) {
      let html = `<option value="none">${this.t('opt_no_lot')}</option>`;
      const remWord = lang === 'ar' ? 'المتبقي' : (lang === 'en' ? 'Remaining' : 'Restant');
      const activeAnimals = (appState.animals || []).filter(a => (Number(a.currentQuantity) || 0) > 0);
      activeAnimals.forEach(a => {
        const displayName = this.getAnimalDisplayName(a);
        const lotPrefix = (a.name && a.name.toString().trim() !== '') ? (lang === 'ar' ? `دفعة #${a.name} - ` : `Lot #${a.name} - `) : '';
        html += `<option value="${a.id}">${lotPrefix}${displayName} (${remWord}: ${a.currentQuantity})</option>`;
      });
      saleLotSelect.innerHTML = html;
    }
  },

  onExpenseLotSelectChange(val) {
    const multiBlock = document.getElementById('expenseAddMultipleLotsBlock');
    if (multiBlock) {
      if (val === '__multiple__') {
        multiBlock.style.display = 'block';
        this.renderAddExpenseLotsList();
      } else {
        multiBlock.style.display = 'none';
      }
    }
    const cat = document.getElementById('expenseCategory')?.value;
    if (cat === 'electricite_couveuse') {
      this.updateIncubatorElecLiveCalc();
    }
  },

  renderAddExpenseLotsList() {
    const listEl = document.getElementById('expenseAddLotsList');
    if (!listEl) return;
    listEl.innerHTML = '';

    const isAr = appState.lang === 'ar';
    const animals = appState.animals || [];

    if (animals.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding: 0.8rem; color: var(--text-muted); font-size: 0.8rem;">${isAr ? 'لا توجد دفعات طيور مسجلة' : 'Aucun lot enregistré'}</div>`;
      return;
    }

    animals.forEach(a => {
      const icon = this.getSpeciesIcon(a.species);
      const displayName = this.getAnimalDisplayName(a);
      const lotNum = (a.name && a.name.toString().trim() !== '') ? (isAr ? `دفعة #${a.name}` : `Lot #${a.name}`) : '';
      const daysSinceArrival = this.calculateAgeInDays(a.birthDate);
      const arrivalAgeDays = Number(a.arrivalAgeDays) || 0;
      const totalAgeDays = daysSinceArrival + arrivalAgeDays;
      const ageText = this.formatAgeText(totalAgeDays);
      const effStage = this.getEffectiveAnimalStage(a);
      const stageLabel = this.translateStage(effStage);

      const card = document.createElement('div');
      card.className = 'multi-lot-card';
      card.setAttribute('data-lot-id', a.id);
      card.onclick = (ev) => {
        if (ev.target.tagName !== 'INPUT') {
          const chk = card.querySelector('.add-expense-lot-checkbox');
          if (chk) {
            chk.checked = !chk.checked;
            chk.dispatchEvent(new Event('change'));
          }
        }
      };

      card.innerHTML = `
        <input type="checkbox" class="add-expense-lot-checkbox" value="${a.id}" onchange="app.onAddExpenseLotCheckboxChange(this)">
        <span style="font-size: 1.2rem;">${icon}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
            <strong style="font-size: 0.83rem; color: var(--text-primary);">${displayName}</strong>
            ${lotNum ? `<span class="badge" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-violet); font-size: 0.68rem; font-weight: 700; padding: 1px 5px; border-radius: 4px;">${lotNum}</span>` : ''}
            <span class="badge-pill" style="font-size: 0.65rem; padding: 1px 5px;">${stageLabel}</span>
          </div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 1px;">
            <span>${a.currentQuantity} ${isAr ? 'طير حي' : 'sujets'}</span> &bull; 
            <span>${ageText}</span>
          </div>
        </div>
      `;
      listEl.appendChild(card);
    });

    this.updateAddExpenseLotsSummary();
  },

  onAddExpenseLotCheckboxChange(chk) {
    const card = chk.closest('.multi-lot-card');
    if (card) {
      if (chk.checked) card.classList.add('selected');
      else card.classList.remove('selected');
    }
    this.updateAddExpenseLotsSummary();
  },

  toggleAllAddExpenseLots(checkAll = true) {
    document.querySelectorAll('.add-expense-lot-checkbox').forEach(chk => {
      chk.checked = checkAll;
      const card = chk.closest('.multi-lot-card');
      if (card) {
        if (checkAll) card.classList.add('selected');
        else card.classList.remove('selected');
      }
    });
    this.updateAddExpenseLotsSummary();
  },

  updateAddExpenseLotsSummary() {
    const summaryEl = document.getElementById('expenseAddLotsSummary');
    if (!summaryEl) return;
    const isAr = appState.lang === 'ar';

    const checkedBoxes = Array.from(document.querySelectorAll('.add-expense-lot-checkbox:checked'));
    const count = checkedBoxes.length;

    if (count === 0) {
      summaryEl.style.color = 'var(--accent-rose)';
      summaryEl.innerHTML = isAr 
        ? `⚠️ يرجى تحديد دفعة واحدة على الأقل` 
        : `⚠️ Cochez au moins 1 lot (ex: Lot #4 + Lot #5)`;
      return;
    }

    const selectedAnimals = checkedBoxes.map(cb => (appState.animals || []).find(a => a.id === cb.value)).filter(Boolean);
    const totalHeads = selectedAnimals.reduce((s, a) => s + (Number(a.currentQuantity) || 0), 0);
    const names = selectedAnimals.map(a => {
      const num = a.name ? (isAr ? `#${a.name}` : `#${a.name}`) : '';
      const disp = this.getAnimalDisplayName(a);
      return num ? `${disp} (${num})` : disp;
    });

    summaryEl.style.color = 'var(--accent-violet)';
    if (count === 1) {
      summaryEl.innerHTML = isAr 
        ? `🎯 دفعة واحدة : ${names[0]} (${totalHeads} طير) &bull; 100% للتكلفة`
        : `🎯 1 lot sélectionné : ${names[0]} (${totalHeads} sujets) &bull; 100% de la dépense`;
    } else {
      summaryEl.innerHTML = isAr 
        ? `🎯 ${count} دفعات محددة (${totalHeads} طير) : ${names.join(' + ')}<br>• التكلفة ستقسم حصرياً بين هذه الدفعات دون غيرها.`
        : `🎯 ${count} lots sélectionnés (${totalHeads} sujets) : ${names.join(' + ')}<br>• Coût réparti exclusivement entre ces ${count} lots (0 DT pour les autres).`;
    }
  },

  // Toast notifications
  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container || !message) return;

    // Protection anti-spam : ignorer le même message s'il a été affiché il y a moins de 3.5 secondes
    const now = Date.now();
    this._recentToasts = this._recentToasts || {};
    if (this._recentToasts[message] && (now - this._recentToasts[message] < 3500)) {
      return;
    }
    this._recentToasts[message] = now;

    // Ne jamais accumuler plus de 2 notifications simultanées pour ne pas masquer les formulaires
    while (container.children.length >= 2) {
      if (container.firstElementChild) container.firstElementChild.remove();
    }

    if (window.MobileBridge) {
      if (type === 'success') window.MobileBridge.hapticSuccess();
      else if (type === 'danger' || type === 'error') window.MobileBridge.hapticWarning();
      else window.MobileBridge.hapticImpact('LIGHT');
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : (type === 'danger' || type === 'error' ? '❌' : '⚠️');
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    toast.style.cursor = 'pointer';
    toast.title = 'Cliquer pour fermer';
    toast.onclick = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 200);
    };
    container.appendChild(toast);

    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 2800);
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

  getExpenseLinkedLotIds(e) {
    if (!e) return [];
    if (Array.isArray(e.linkedLotIds) && e.linkedLotIds.length > 0) {
      return e.linkedLotIds.filter(id => id && id !== 'general' && id !== 'none');
    }
    if (e.linkedLotId && typeof e.linkedLotId === 'string') {
      if (e.linkedLotId === 'general' || e.linkedLotId === 'none') return [];
      if (e.linkedLotId.includes(',')) {
        return e.linkedLotId.split(',').map(s => s.trim()).filter(id => id && id !== 'general' && id !== 'none');
      }
      return [e.linkedLotId];
    }
    return [];
  },

  getExpenseLinkedLotsDisplay(exp) {
    if (!exp) return this.t('opt_general_farm') || 'Frais Généraux';
    const ids = this.getExpenseLinkedLotIds(exp);
    const isAr = appState.lang === 'ar';
    if (ids.length === 0) {
      return isAr ? '🏢 مصاريف عامة للمزرعة' : '🏢 Frais Généraux';
    }
    if (ids.length === 1) {
      return this.getLotNameById(ids[0]);
    }
    // Multiple lots (2, 3 lots ou plus)
    const lotNames = ids.map(id => {
      const a = (appState.animals || []).find(x => x.id === id);
      if (!a) return '';
      const num = a.name ? (isAr ? `#${a.name}` : `#${a.name}`) : '';
      const disp = this.getAnimalDisplayName(a);
      return num ? `${disp} (${num})` : disp;
    }).filter(Boolean);

    if (isAr) {
      return `🏷️ ${ids.length} دفعات: ` + lotNames.join(' + ');
    }
    return `🏷️ ${ids.length} Lots : ` + lotNames.join(' + ');
  },

  reassignExpenseLot(expId) {
    const exp = (appState.expenses || []).find(e => e.id === expId);
    if (!exp) return;

    const idInput = document.getElementById('reassignExpenseId');
    const titleEl = document.getElementById('reassignExpenseTitle');
    const amountEl = document.getElementById('reassignExpenseAmount');
    const dateEl = document.getElementById('reassignExpenseDate');
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    if (idInput) idInput.value = exp.id;
    if (titleEl) titleEl.textContent = this.getTranslatedExpenseTitle(exp.title) || exp.title || 'Dépense';
    if (amountEl) amountEl.textContent = `${this.formatMoney(exp.total || 0)}`;
    if (dateEl) dateEl.textContent = isAr ? `📅 تاريخ المعاملة: ${this.formatDateFR(exp.date)}` : `📅 Date : ${this.formatDateFR(exp.date)}`;

    const currentLinkedIds = this.getExpenseLinkedLotIds(exp);
    const mode = currentLinkedIds.length > 0 ? 'specific' : 'general';
    this.currentReassignMode = mode;

    this.renderReassignLotsList(currentLinkedIds, exp.date);
    this.setReassignExpenseMode(mode);

    this.openModal('modalReassignExpenseLot');
  },

  setReassignExpenseMode(mode = 'general') {
    this.currentReassignMode = mode;
    const genBtn = document.getElementById('reassignModeGeneralBtn');
    const specBtn = document.getElementById('reassignModeSpecificBtn');
    const specBlock = document.getElementById('reassignSpecificLotsBlock');

    if (mode === 'general') {
      if (genBtn) {
        genBtn.className = 'btn btn-sm btn-primary';
        genBtn.style.background = 'var(--primary)';
        genBtn.style.color = '#fff';
      }
      if (specBtn) {
        specBtn.className = 'btn btn-sm btn-outline';
        specBtn.style.background = 'transparent';
        specBtn.style.color = 'var(--text-secondary)';
      }
      if (specBlock) specBlock.style.display = 'none';
    } else {
      if (genBtn) {
        genBtn.className = 'btn btn-sm btn-outline';
        genBtn.style.background = 'transparent';
        genBtn.style.color = 'var(--text-secondary)';
      }
      if (specBtn) {
        specBtn.className = 'btn btn-sm btn-primary';
        specBtn.style.background = 'var(--accent-violet)';
        specBtn.style.color = '#fff';
      }
      if (specBlock) specBlock.style.display = 'block';
    }
    this.updateReassignLiveSummary();
  },

  renderReassignLotsList(selectedIds = [], expDate = '') {
    const listEl = document.getElementById('reassignLotsList');
    if (!listEl) return;
    listEl.innerHTML = '';

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const animals = appState.animals || [];

    if (animals.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding: 1.2rem; color: var(--text-muted); font-size: 0.82rem;">${isAr ? 'لا توجد دفعات طيور مسجلة' : 'Aucun lot enregistré'}</div>`;
      return;
    }

    animals.forEach(a => {
      const isSelected = selectedIds.includes(a.id);
      const icon = this.getSpeciesIcon(a.species);
      const displayName = this.getAnimalDisplayName(a);
      const lotNum = (a.name && a.name.toString().trim() !== '') ? (isAr ? `دفعة #${a.name}` : `Lot #${a.name}`) : '';
      const daysSinceArrival = this.calculateAgeInDays(a.birthDate);
      const arrivalAgeDays = Number(a.arrivalAgeDays) || 0;
      const totalAgeDays = daysSinceArrival + arrivalAgeDays;
      const ageText = this.formatAgeText(totalAgeDays);
      const effStage = this.getEffectiveAnimalStage(a);
      const stageLabel = this.translateStage(effStage);

      // Warning si le lot n'était pas encore arrivé à la date de la dépense
      const isBeforeArrival = expDate && a.birthDate && expDate < a.birthDate;

      const card = document.createElement('div');
      card.className = `multi-lot-card ${isSelected ? 'selected' : ''}`;
      card.setAttribute('data-lot-id', a.id);
      card.onclick = (ev) => {
        if (ev.target.tagName !== 'INPUT') {
          const chk = card.querySelector('.reassign-lot-checkbox');
          if (chk) {
            chk.checked = !chk.checked;
            chk.dispatchEvent(new Event('change'));
          }
        }
      };

      card.innerHTML = `
        <input type="checkbox" class="reassign-lot-checkbox" value="${a.id}" ${isSelected ? 'checked' : ''} onchange="app.onReassignLotCheckboxChange(this)">
        <span style="font-size: 1.3rem;">${icon}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
            <strong style="font-size: 0.85rem; color: var(--text-primary);">${displayName}</strong>
            ${lotNum ? `<span class="badge" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-violet); font-size: 0.7rem; font-weight: 700; padding: 1px 5px; border-radius: 4px;">${lotNum}</span>` : ''}
            <span class="badge-pill" style="font-size: 0.68rem; padding: 1px 6px;">${stageLabel}</span>
          </div>
          <div style="font-size: 0.73rem; color: var(--text-muted); margin-top: 1px;">
            <span>${a.currentQuantity} ${isAr ? 'طير حي' : 'sujets'}</span> &bull; 
            <span>${ageText}</span>
            ${isBeforeArrival ? `<span style="color: var(--accent-amber); font-weight: 700;"> ⚠️ (${isAr ? 'وصل بعد المعاملة' : 'Arrivé après cette dépense'})</span>` : ''}
          </div>
        </div>
      `;
      listEl.appendChild(card);
    });

    this.updateReassignLiveSummary();
  },

  onReassignLotCheckboxChange(chk) {
    const card = chk.closest('.multi-lot-card');
    if (card) {
      if (chk.checked) card.classList.add('selected');
      else card.classList.remove('selected');
    }
    this.updateReassignLiveSummary();
  },

  toggleAllReassignLots(checkAll = true) {
    document.querySelectorAll('.reassign-lot-checkbox').forEach(chk => {
      chk.checked = checkAll;
      const card = chk.closest('.multi-lot-card');
      if (card) {
        if (checkAll) card.classList.add('selected');
        else card.classList.remove('selected');
      }
    });
    this.updateReassignLiveSummary();
  },

  updateReassignLiveSummary() {
    const summaryEl = document.getElementById('reassignLiveSummary');
    if (!summaryEl) return;
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    if (this.currentReassignMode === 'general') {
      summaryEl.style.display = 'block';
      summaryEl.style.background = 'rgba(59, 130, 246, 0.08)';
      summaryEl.style.borderColor = 'rgba(59, 130, 246, 0.3)';
      summaryEl.style.color = 'var(--accent-blue)';
      summaryEl.innerHTML = isAr 
        ? `🏢 <strong>مصاريف عامة للمزرعة :</strong> سيتم توزيع التكلفة تلقائياً على جميع الطيور النشطة في المزرعة.`
        : (isEn 
          ? `🏢 <strong>General Farm Expense:</strong> Cost is automatically distributed across all active farm flocks.`
          : `🏢 <strong>Frais Généraux :</strong> Le coût est réparti proportionnellement sur l'ensemble du cheptel actif.`);
      return;
    }

    const checkedBoxes = Array.from(document.querySelectorAll('.reassign-lot-checkbox:checked'));
    const count = checkedBoxes.length;

    if (count === 0) {
      summaryEl.style.display = 'block';
      summaryEl.style.background = 'rgba(239, 68, 68, 0.08)';
      summaryEl.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      summaryEl.style.color = 'var(--accent-rose)';
      summaryEl.innerHTML = isAr 
        ? `⚠️ <strong>يرجى تحديد دفعة واحدة على الأقل</strong> (أو اختر "جميع الدفعات" للأعلى).`
        : `⚠️ <strong>Veuillez cocher au moins 1 lot</strong> (ou cliquez sur "Tous les lots" ci-dessus).`;
      return;
    }

    const selectedAnimals = checkedBoxes.map(cb => (appState.animals || []).find(a => a.id === cb.value)).filter(Boolean);
    const totalHeads = selectedAnimals.reduce((s, a) => s + (Number(a.currentQuantity) || 0), 0);
    const names = selectedAnimals.map(a => {
      const num = a.name ? (isAr ? `#${a.name}` : `#${a.name}`) : '';
      const disp = this.getAnimalDisplayName(a);
      return num ? `${disp} (${num})` : disp;
    });

    summaryEl.style.display = 'block';
    summaryEl.style.background = 'rgba(139, 92, 246, 0.1)';
    summaryEl.style.borderColor = 'rgba(139, 92, 246, 0.35)';
    summaryEl.style.color = 'var(--accent-violet)';

    if (count === 1) {
      summaryEl.innerHTML = isAr 
        ? `🎯 <strong>دفعة واحدة محددة :</strong> ${names[0]} (${totalHeads} طير)<br>• 100% من هذا المصروف سيسجل حصرياً على هذه الدفعة.`
        : `🎯 <strong>1 lot sélectionné :</strong> ${names[0]} (${totalHeads} sujets)<br>• 100% de la dépense sera supportée exclusivement par ce lot.`;
    } else {
      summaryEl.innerHTML = isAr 
        ? `🎯 <strong>${count} دفعات محددة (${totalHeads} طير إجمالي) :</strong><br>${names.join(' + ')}<br>• سيتم اقتسام هذا المصروف <u>فقط</u> بين هذه الدفعات دون غيرها.`
        : `🎯 <strong>${count} lots sélectionnés (${totalHeads} sujets au total) :</strong><br>${names.join(' + ')}<br>• La dépense sera répartie <u>exclusivement</u> entre ces lots selon leur consommation. Les autres lots de la ferme ne paieront rien !`;
    }
  },

  submitReassignExpenseLot(e) {
    if (e && e.preventDefault) e.preventDefault();
    const idInput = document.getElementById('reassignExpenseId');
    if (!idInput) return;

    const exp = (appState.expenses || []).find(x => x.id === idInput.value);
    if (!exp) return;

    const isAr = appState.lang === 'ar';

    if (this.currentReassignMode === 'general') {
      exp.linkedLotId = 'general';
      exp.linkedLotIds = [];
    } else {
      const checkedBoxes = Array.from(document.querySelectorAll('.reassign-lot-checkbox:checked'));
      const checkedIds = checkedBoxes.map(cb => cb.value);

      if (checkedIds.length === 0) {
        this.showToast(isAr ? 'يرجى تحديد دفعة واحدة على الأقل' : 'Veuillez sélectionner au moins un lot', 'warning');
        return;
      }

      if (checkedIds.length === 1) {
        exp.linkedLotId = checkedIds[0];
        exp.linkedLotIds = [checkedIds[0]];
      } else {
        exp.linkedLotId = checkedIds.join(',');
        exp.linkedLotIds = checkedIds;
      }
    }

    this.saveState();
    this.closeModal('modalReassignExpenseLot');
    this.renderAll();

    const displayLabel = this.getExpenseLinkedLotsDisplay(exp);
    this.showToast(isAr ? `تم تحديث التوزيع : ${displayLabel}` : `Affectation mise à jour : ${displayLabel}`);
    if (window.appAuth && appAuth.pushData) {
      appAuth.pushData();
    }
  },

  // ==========================================
  // RENDER MASTER
  // ==========================================
  renderAll() {
    try { this.renderDashboard(); } catch (e) { console.warn('renderDashboard error:', e); }
    try { this.renderEggStock(); } catch (e) { console.warn('renderEggStock error:', e); }
    try { this.renderEggProductionChart(); } catch (e) { console.warn('renderEggProductionChart error:', e); }
    try { this.renderMilkStock(); } catch (e) { console.warn('renderMilkStock error:', e); }
    try { this.renderMilkProductionChart(); } catch (e) { console.warn('renderMilkProductionChart error:', e); }
    try { this.renderFarmFeedSummary(); } catch (e) { console.warn('renderFarmFeedSummary error:', e); }
    try { this.renderAnimals(); } catch (e) { console.warn('renderAnimals error:', e); }
    try { this.renderExpenses(); } catch (e) { console.warn('renderExpenses error:', e); }
    try { this.renderSales(); } catch (e) { console.warn('renderSales error:', e); }
    try { this.renderSmartCalculations(); } catch (e) { console.warn('renderSmartCalculations error:', e); }
    try { this.renderIncubator(); } catch (e) { console.warn('renderIncubator error:', e); }
    try { this.renderCalendar(); } catch (e) { console.warn('renderCalendar error:', e); }
    try { this.updateBadges(); } catch (e) { console.warn('updateBadges error:', e); }
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
    this.checkDailyFeedInAppAlert();
    this.checkDailyEggInAppAlert();

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

    // Sidebar Summary Box (Santé de l'Exploitation)
    const sideMargin = document.getElementById('sidebarMarginVal');
    const sideProfit = document.getElementById('sidebarProfitVal');
    const sideProgress = document.getElementById('sidebarProgressBar');
    const summaryDot = document.querySelector('.sidebar-summary-card .summary-dot');
    const marginNum = parseFloat(marginPercent) || 0;
    const isNegative = marginNum < 0 || netProfit < 0;

    if (sideMargin) {
      sideMargin.textContent = `${marginNum >= 0 ? '+' : ''}${marginPercent}%`;
      sideMargin.className = `mini-val ${marginNum >= 0 ? 'text-emerald' : 'text-rose'} bold`;
      sideMargin.style.color = marginNum >= 0 ? 'var(--accent-emerald, #10b981)' : 'var(--accent-rose, #f43f5e)';
    }

    if (sideProfit) {
      sideProfit.textContent = (netProfit >= 0 ? '+' : '') + this.formatMoney(netProfit);
      sideProfit.className = `mini-val ${netProfit >= 0 ? 'text-emerald' : 'text-rose'} bold`;
      sideProfit.style.color = netProfit >= 0 ? 'var(--accent-emerald, #10b981)' : 'var(--accent-rose, #f43f5e)';
    }

    if (summaryDot) {
      summaryDot.style.backgroundColor = isNegative ? 'var(--accent-rose, #f43f5e)' : 'var(--accent-emerald, #10b981)';
      summaryDot.style.boxShadow = isNegative ? '0 0 8px rgba(244, 63, 94, 0.7)' : '0 0 8px rgba(16, 185, 129, 0.7)';
    }

    if (sideProgress) {
      if (marginNum < 0) {
        sideProgress.style.background = 'linear-gradient(90deg, #f43f5e, #fb7185)';
        sideProgress.style.width = '100%';
      } else {
        sideProgress.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
        const positivePercent = Math.min(Math.max(marginNum, 10), 100);
        sideProgress.style.width = `${positivePercent}%`;
      }
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
            ${this.t('hatch_alert_text', { name: b.name, count: b.eggsCount, breed: (b.breed && b.breed !== '-') ? b.breed : (this.t('opt_egg_' + (b.eggSpecies || 'hen')) || 'volaille') })}
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
        electricite_couveuse: this.t('exp_cat_elec_incubator') || '⚡ Élec. Couveuse',
        eau: this.t('exp_cat_water') || 'Eau',
        salaire: this.t('exp_cat_sal') || 'Salaires',
        autre: this.t('exp_cat_other') || 'Autres'
      };

      const colors = {
        nourriture: '#f59e0b',
        veterinaire: '#8b5cf6',
        electricite: '#06b6d4',
        electricite_couveuse: '#f59e0b',
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

    // ── 0. BOVINS (Vaches Laitières, Taurillons, Veaux) - Portions Zootechniques Journalières ──
    const isBovine = sp === 'vache_laitiere' || sp === 'taurillon' || sp === 'veau' || sp === 'bovin' || sp === 'bovin_autre' || sp === 'bovin_viande' || sp.includes('vache') || sp.includes('bovin') || sp.includes('taurillon') || sp.includes('veau') || sp.includes('cattle') || sp.includes('cow');
    if (isBovine) {
      // A. Veau d'élevage
      if (sp === 'veau' || sp.includes('veau') || stg.includes('veau')) {
        if (d <= 21)  return 1200; // J1-J21: 1.2 kg/j (Allaitement colostrum / lait)
        if (d <= 60)  return 2200; // J22-J60: 2.2 kg/j (Pré-sevrage lait + starter 18% + foin)
        if (d <= 120) return 3500; // J61-J120: 3.5 kg/j (Sevrage concentré croissance + foin)
        if (d <= 180) return 5000; // J121-J180: 5.0 kg/j (Broutard 4-6 mois)
        return 6800;               // > 180j: 6.8 kg/j (Jeune bovin)
      }

      // B. Taurillon / Bovin Viande (Engraissement)
      if (sp === 'taurillon' || sp === 'bovin_viande' || sp.includes('taurillon') || sp.includes('bull') || stg.includes('engraissement') || stg.includes('finition') || stg.includes('taureau')) {
        const isTaureau = stg.includes('taureau') || stg.includes('reproducteur') || brd.includes('taureau');
        if (isTaureau) return 12500; // Taureau reproducteur: ~12.5 kg/j

        const isFinition = stg.includes('finition') || stg.includes('finish') || d > 480;
        if (isFinition) return 11500; // Finition viande haute densité: ~11.5 kg/j

        const isEngraissement = stg.includes('engraissement') || d > 365;
        if (isEngraissement) return 10500; // Engraissement actif 12-16 mois: ~10.5 kg/j

        if (d <= 180) return 5000;  // Veau taurillon 0-6 mois: ~5.0 kg/j
        return 8500;                 // Taurillon croissance 6-12 mois: ~8.5 kg/j
      }

      // C. Vache Laitière / Bovin générique
      const isTarie = stg.includes('tarie') || stg.includes('dry') || stg.includes('شايحة') || stg.includes('راحة');
      if (isTarie) return 10500; // Vache tarie repos pré-vêlage: ~10.5 kg/j

      const isReforme = stg.includes('reforme') || stg.includes('cull') || stg.includes('ذبح') || stg.includes('تفريط');
      if (isReforme) return 11800; // Vache de réforme finition: ~11.8 kg/j

      const isLactation = stg.includes('lactation') || stg.includes('lait') || stg.includes('حليب') || stg.includes('حلوب') || d >= 720;
      if (isLactation) return 18000; // Vache laitière en lactation: ~18.0 kg MS/j

      if (d <= 180) return 4500; // Génisse sevrée 0-6 mois: ~4.5 kg/j
      if (d <= 450) return 7500; // Génisse croissance 6-15 mois: ~7.5 kg/j
      return 9800;               // Génisse gestante 15-24 mois: ~9.8 kg/j
    }

    // ── 0b. OVINS & CAPRINS (Moutons, Brebis, Agneaux, Chèvres, Chevreaux) - Portions Zootechniques ──
    const isSheep = sp === 'mouton' || sp === 'brebis' || sp === 'agneau' || sp === 'chevre' || sp === 'chevreau' || sp === 'belier' || sp === 'bouc' || sp === 'ovin' || sp === 'caprin' || sp === 'ovin_autre' || sp.includes('mouton') || sp.includes('brebis') || sp.includes('agneau') || sp.includes('chevre') || sp.includes('sheep') || sp.includes('goat') || sp.includes('ram') || sp.includes('lamb');
    if (isSheep) {
      // A. Agneau & Chevreau
      if (sp === 'agneau' || sp === 'chevreau' || sp.includes('agneau') || sp.includes('chevreau') || sp.includes('lamb') || sp.includes('kid') || stg.includes('agneau') || stg.includes('chevreau')) {
        if (d <= 30)  return 350;  // J1-J30: 350 g/j (Allaitement colostrum / lait maternel + starter)
        if (d <= 70)  return 850;  // J31-J70: 850 g/j (Pré-sevrage & sevrage starter 18% + foin)
        if (d <= 120) return 1400; // J71-J120: 1.4 kg/j (Engraissement actif concentré 16% + foin)
        if (d <= 180) return 1800; // J121-J180: 1.8 kg/j (Finition agneau lourd / chevreau)
        return 1900;               // > 180j: 1.9 kg/j
      }

      // B. Mouton / Bélier / Ovin Viande
      if (sp === 'mouton' || sp === 'belier' || sp.includes('mouton') || sp.includes('belier') || sp.includes('ram') || stg.includes('engraissement') || stg.includes('belier')) {
        const isBelier = stg.includes('belier') || stg.includes('reproducteur') || brd.includes('belier');
        if (isBelier) return 2200; // Bélier reproducteur adulte: ~2.2 kg MS/j

        const isFinition = stg.includes('finition') || stg.includes('finish') || d > 300;
        if (isFinition) return 2000; // Finition viande ovin: ~2.0 kg MS/j

        if (d <= 120) return 1200; // Jeune ovin démarrage: ~1.2 kg MS/j
        if (d <= 240) return 1600; // Mouton croissance: ~1.6 kg MS/j
        return 1800;               // Mouton adulte / engraissement: ~1.8 kg MS/j
      }

      // C. Brebis / Chèvre (Laitière & Reproductrice)
      const isTarie = stg.includes('tarie') || stg.includes('dry') || stg.includes('شايحة') || stg.includes('راحة');
      if (isTarie) return 1300; // Repos mammaire / entretien: ~1.3 kg MS/j

      const isReforme = stg.includes('reforme') || stg.includes('cull') || stg.includes('ذبح') || stg.includes('تفريط');
      if (isReforme) return 1400; // Réforme viande: ~1.4 kg MS/j

      const isGestante = stg.includes('gestante') || stg.includes('pregnant') || stg.includes('عشار');
      if (isGestante) return 1800; // Fin de gestation (2 derniers mois): ~1.8 kg MS/j

      const isLactation = stg.includes('lactation') || stg.includes('lait') || stg.includes('حليب') || stg.includes('حلوب') || d >= 420;
      if (isLactation) return 2600; // Brebis / Chèvre en lactation (1.5-3L lait/j): ~2.6 kg MS/j

      if (d <= 120) return 900;  // Agnela / Chevrette jeune: ~900 g/j
      if (d <= 300) return 1300; // Agnela / Chevrette croissance: ~1.3 kg MS/j
      return 1500;               // Génisse ovine avant saillie: ~1.5 kg MS/j
    }

    // 1. CANARD DE BARBARIE / PALMIPÈDES (Table zootechnique officielle)
    if (sp === 'canard' || sp === 'canard_barbarie' || sp.includes('duck')) {
      if (d <= 7)   return 22;  // Sem 1: ~22 g/j (Ci 0.73)
      if (d <= 14)  return 40;  // Sem 2: ~40 g/j (Ci 1.33)
      if (d <= 21)  return 58;  // Sem 3: ~58 g/j (Ci 1.93)
      if (d <= 35)  return 80;  // Sem 4-5: ~80 g/j (Ci 2.67)
      if (d <= 49)  return 100; // Sem 6-7: ~100 g/j (Ci 3.33)
      if (d <= 70)  return 132; // Sem 8-10: ~132 g/j (Ci 4.40)
      if (d <= 84)  return 150; // Sem 11-12: ~150 g/j (Ci 5.00)
      if (d <= 112) return 170; // Sem 13-16: ~170 g/j (Ci 5.67)

      // Adulte (> 112j / > 16 sem / > 4 mois)
      const isMale = stg.includes('mâle') || stg.includes('male') || stg.includes('ذكر') || brd.includes('mâle') || brd.includes('male');
      const isFemale = stg.includes('femelle') || stg.includes('female') || stg.includes('أنثى') || stg.includes('canne') || brd.includes('canne');
      if (isMale) return 170;   // Canard de Barbarie adulte mâle (5 kg): ~170 g (Ci 5.67)
      if (isFemale) return 130; // Canne adulte femelle (2.5-3 kg ponte): ~130 g (Ci 4.33)
      return 150;               // Moyenne adulte mixte: ~150 g (Ci 5.00)
    }

    // 2. PINTADE (Numida meleagris - Table zootechnique)
    if (sp === 'pintade' || sp.includes('guinea')) {
      if (d <= 7)   return 15;  // Sem 1: ~15 g/j (Ci 0.50)
      if (d <= 14)  return 22;  // Sem 2: ~22 g/j (Ci 0.73)
      if (d <= 21)  return 28;  // Sem 3: ~28 g/j (Ci 0.93)
      if (d <= 28)  return 35;  // Sem 4: ~35 g/j (Ci 1.17)
      if (d <= 42)  return 50;  // Sem 5-6: ~50 g/j (Ci 1.67)
      if (d <= 56)  return 60;  // Sem 7-8: ~60 g/j (Ci 2.00)
      if (d <= 70)  return 72;  // Sem 9-10: ~72 g/j (Ci 2.40)
      if (d <= 84)  return 80;  // Sem 11-12: ~80 g/j (Ci 2.67)
      if (d <= 112) return 95;  // Sem 13-16: ~95 g/j (Ci 3.17)
      if (d <= 140) return 110; // Sem 17-20: ~110 g/j (Ci 3.67)

      // Adulte (> 140j / > 20 sem)
      const isLaying = stg.includes('ponte') || stg.includes('lay') || brd.includes('ponte');
      if (isLaying) return 130; // Pintade pondeuse en production: ~130 g (Ci 4.33)
      return 115;               // Pintade adulte chair / entretien: ~115 g (Ci 3.83)
    }

    // 3. CAILLE (Coturnix japonica - Cycle très rapide, ponte à 42j)
    if (sp === 'caille' || sp.includes('quail')) {
      if (d <= 7)  return 6;   // Sem 1: ~6 g/j (Ci 0.20)
      if (d <= 14) return 10;  // Sem 2: ~10 g/j (Ci 0.33)
      if (d <= 21) return 14;  // Sem 3: ~14 g/j (Ci 0.47)
      if (d <= 35) return 18;  // Sem 4-5: ~18 g/j (Ci 0.60)
      const isLaying = stg.includes('ponte') || stg.includes('lay') || brd.includes('ponte');
      if (isLaying) return 25; // Caille pondeuse adulte: ~25 g/j (Ci 0.83)
      return 22;               // Caille adulte chair: ~22 g/j (Ci 0.73)
    }

    // 4. DINDE (Meleagris gallopavo)
    if (sp === 'dinde' || sp.includes('turkey')) {
      if (d <= 14)  return 40;  // Sem 1-2: ~40 g/j (Ci 1.33)
      if (d <= 28)  return 70;  // Sem 3-4: ~70 g/j (Ci 2.33)
      if (d <= 56)  return 130; // Sem 5-8: ~130 g/j (Ci 4.33)
      if (d <= 84)  return 180; // Sem 9-12: ~180 g/j (Ci 6.00)
      if (d <= 112) return 220; // Sem 13-16: ~220 g/j (Ci 7.33)
      const isMale = stg.includes('mâle') || stg.includes('male') || stg.includes('ذكر');
      if (isMale) return 320;   // Dindon mâle adulte (18 kg): ~320 g/j (Ci 10.67)
      return 250;               // Dinde femelle adulte: ~250 g/j (Ci 8.33)
    }

    // 5. OIE (Anser anser)
    if (sp === 'oie' || sp.includes('goose')) {
      if (d <= 21) return 60;
      if (d <= 60) return 150;
      return 220;
    }

    // 6. AUTRE VOLAILLE générique
    if (sp === 'autre') {
      if (d <= 28)  return 30;
      if (d <= 84)  return 65;
      if (d <= 154) return 95;
      return 120;
    }

    // 7. POULE & POULET / GALLINACÉS (Table zootechnique officielle)
    if (d <= 7)   return 14;  // Sem 1: ~14 g/j (Ci 0.47)
    if (d <= 14)  return 22;  // Sem 2: ~22 g/j (Ci 0.73)
    if (d <= 21)  return 28;  // Sem 3: ~28 g/j (Ci 0.93)
    if (d <= 28)  return 34;  // Sem 4: ~34 g/j (Ci 1.13)
    if (d <= 42)  return 50;  // Sem 5-6: ~50 g/j (Ci 1.67)
    if (d <= 56)  return 65;  // Sem 7-8: ~65 g/j (Ci 2.17)
    if (d <= 70)  return 75;  // Sem 9-10: ~75 g/j (Ci 2.50)
    if (d <= 84)  return 82;  // Sem 11-12: ~82 g/j (Ci 2.73)
    if (d <= 112) return 90;  // Sem 13-16: ~90 g/j (Ci 3.00)
    if (d <= 140) return 100; // Sem 17-20: ~100 g/j (Ci 3.33)
    if (d <= 154) return 108; // Sem 21-22: ~108 g/j (Ci 3.60)

    // Adulte (> 154j / > 22 sem / > 5 mois)
    const isRooster = stg.includes('coq') || stg.includes('rooster') || stg.includes('سردوك') || stg.includes('فحل') || brd.includes('coq');
    if (isRooster) return 130; // Coq adulte: ~130 g (Ci 4.33)
    return 115;                // Poule pondeuse adulte: ~115 g (Ci 3.83)
  },

  getAgronomicFeedData(species = 'poulet', ageDays = 30, stage = '', breed = '') {
    const sp = (species || '').toLowerCase();
    const stg = (stage || '').toLowerCase();
    const brd = (breed || '').toLowerCase();
    const days = Math.max(1, Math.round(Number(ageDays) || 1));

    // ── 0. BOVINS (Vaches Laitières, Taurillons, Veaux) - Référentiel Zootechnique ──
    const isBovine = sp === 'vache_laitiere' || sp === 'taurillon' || sp === 'veau' || sp === 'bovin' || sp === 'bovin_autre' || sp === 'bovin_viande' || sp.includes('vache') || sp.includes('bovin') || sp.includes('taurillon') || sp.includes('veau') || sp.includes('cattle') || sp.includes('cow');
    if (isBovine) {
      // A. VEAU D'ÉLEVAGE (Phases allaitement, pré-sevrage, sevrage, broutard)
      if (sp === 'veau' || sp.includes('veau') || stg.includes('veau')) {
        if (days <= 21) {
          return {
            minGrams: 1000, maxGrams: 1400, avgGrams: 1200, dailyGrams: 1200, ci: 1.20,
            stageKey: 'bovin_veau_laitier',
            labelFr: 'Veau au lait (J1–J21)', labelAr: 'عجل رضيع باللتر (ي1-21)', labelEn: 'Nursing calf (d1-21)',
            notesFr: 'Colostrum J1-J3 puis lait maternel/poudre 6-8L/j + eau tiède', notesAr: 'لبأ ي1-3 ثم حليب أم أو بديل 6-8 لتر/يوم + ماء دافئ'
          };
        }
        if (days <= 60) {
          return {
            minGrams: 1800, maxGrams: 2600, avgGrams: 2200, dailyGrams: 2200, ci: 1.80,
            stageKey: 'bovin_veau_pre_sevrage',
            labelFr: 'Veau pré-sevrage (J22–J60)', labelAr: 'عجل قبل الفطام (ي22-60)', labelEn: 'Pre-weaning calf (d22-60)',
            notesFr: 'Lait dégressif + concentré starter 18% + foin sec', notesAr: 'حليب متناقص + علف بادي 18% + قرط فصة جاف'
          };
        }
        if (days <= 120) {
          return {
            minGrams: 3000, maxGrams: 4000, avgGrams: 3500, dailyGrams: 3500, ci: 2.80,
            stageKey: 'bovin_veau_sevre',
            labelFr: 'Veau sevré (J61–J120)', labelAr: 'عجل مفطوم (ي61-120)', labelEn: 'Weaned calf (d61-120)',
            notesFr: 'Concentré croissance 2.5-3.5 kg/j + foin à volonté', notesAr: 'علف مركب نمو 2.5-3.5 كغ/يوم + قرط فصة'
          };
        }
        if (days <= 180) {
          return {
            minGrams: 4500, maxGrams: 5500, avgGrams: 5000, dailyGrams: 5000, ci: 3.80,
            stageKey: 'bovin_broutard',
            labelFr: 'Broutard / Veau 4-6 mois', labelAr: 'عجل مفطوم نمو (ي121-180)', labelEn: 'Feeder calf 4-6 mos',
            notesFr: 'Ration de croissance: foin de luzerne + concentré 3.5 kg', notesAr: 'عليقة نمو: قرط فصة + علف مركب 3.5 كغ'
          };
        }
        return {
          minGrams: 6000, maxGrams: 7500, avgGrams: 6800, dailyGrams: 6800, ci: 4.50,
          stageKey: 'bovin_jeune',
          labelFr: 'Jeune bovin (>6 mois)', labelAr: 'عجل نمو متقدم (>6 أشهر)', labelEn: 'Young cattle (>6 mos)',
          notesFr: 'Ration d\'élevage 6.8 kg/j', notesAr: 'عليقة تربية 6.8 كغ/يوم'
        };
      }

      // B. TAURILLON / BOVIN VIANDE (Engraissement & Finition)
      if (sp === 'taurillon' || sp === 'bovin_viande' || sp.includes('taurillon') || sp.includes('bull') || stg.includes('engraissement') || stg.includes('finition') || stg.includes('taureau')) {
        const isTaureau = stg.includes('taureau') || stg.includes('reproducteur') || brd.includes('taureau');
        if (isTaureau) {
          return {
            minGrams: 11500, maxGrams: 14000, avgGrams: 12500, dailyGrams: 12500, ci: 7.20,
            stageKey: 'taureau_reproducteur',
            labelFr: 'Taureau reproducteur adulte', labelAr: 'ثور تلقيح فحل بالغ', labelEn: 'Adult breeding bull',
            notesFr: 'Ration d\'entretien: foin de qualité + minéraux', notesAr: 'عليقة صيانة للفحل: قرط ممتاز وأملاح'
          };
        }

        const isFinition = stg.includes('finition') || stg.includes('finish') || days > 480;
        if (isFinition) {
          return {
            minGrams: 10500, maxGrams: 12500, avgGrams: 11500, dailyGrams: 11500, ci: 7.50,
            stageKey: 'taurillon_finition',
            labelFr: 'Taurillon en finition (>16 mois)', labelAr: 'عجل مرحلة تشطيب اللحم (>16 شهر)', labelEn: 'Finished bull (>16 mos)',
            notesFr: 'Ration finition forte densité musculaire', notesAr: 'عليقة تشطيب نهائية عالية البروتين والطاقة'
          };
        }

        const isEngraissement = stg.includes('engraissement') || days > 365;
        if (isEngraissement) {
          return {
            minGrams: 9500, maxGrams: 11500, avgGrams: 10500, dailyGrams: 10500, ci: 6.80,
            stageKey: 'taurillon_engraissement',
            labelFr: 'Taurillon engraissement actif (12–16 mois)', labelAr: 'عجل تسمين مكثف (12-16 شهر)', labelEn: 'Active fattening bull (12-16 mos)',
            notesFr: 'Concentré haute énergie + paille / ensilage', notesAr: 'علف تسمين عالي الطاقة + تبن / سيلاج'
          };
        }

        if (days <= 180) {
          return {
            minGrams: 4500, maxGrams: 5500, avgGrams: 5000, dailyGrams: 5000, ci: 3.80,
            stageKey: 'taurillon_veau',
            labelFr: 'Veau taurillon (0–6 mois)', labelAr: 'عجل تسمين بداية (0-6 أشهر)', labelEn: 'Starter bull calf (0-6 mos)',
            notesFr: 'Foin sec + concentré starter', notesAr: 'قرط فصة + علف مركب بداية'
          };
        }

        return {
          minGrams: 7500, maxGrams: 9500, avgGrams: 8500, dailyGrams: 8500, ci: 5.50,
          stageKey: 'taurillon_croissance',
          labelFr: 'Taurillon croissance (6–12 mois)', labelAr: 'عجل تسمين نمو (6-12 شهر)', labelEn: 'Growing steer (6-12 mos)',
          notesFr: 'Ensilage / foin + concentré engraissement 4-5 kg/j', notesAr: 'سيلاج ذرة / قرط + علف تسمين 4-5 كغ/يوم'
        };
      }

      // C. VACHE LAITIÈRE / BOVIN GÉNÉRIQUE (Génisses, Lactation, Tarissement, Réforme)
      const isTarie = stg.includes('tarie') || stg.includes('dry') || stg.includes('شايحة') || stg.includes('راحة');
      if (isTarie) {
        return {
          minGrams: 9500, maxGrams: 12000, avgGrams: 10500, dailyGrams: 10500, ci: 6.50,
          stageKey: 'vache_tarie',
          labelFr: 'Vache tarie (repos pré-vêlage)', labelAr: 'بقرة شايحة (طور الراحة قبل الولادة)', labelEn: 'Dry cow (pre-calving rest)',
          notesFr: 'Foin, paille, minéraux sans excès d\'énergie', notesAr: 'قرط، تبن، وأملاح بدون طاقة مفرطة'
        };
      }

      const isReforme = stg.includes('reforme') || stg.includes('cull') || stg.includes('ذبح') || stg.includes('تفريط');
      if (isReforme) {
        return {
          minGrams: 10500, maxGrams: 13000, avgGrams: 11800, dailyGrams: 11800, ci: 7.20,
          stageKey: 'vache_reforme',
          labelFr: 'Vache de réforme (finition)', labelAr: 'بقرة تفريط (تسمين للذبح)', labelEn: 'Cull cow (finishing)',
          notesFr: 'Ration de finition de réforme', notesAr: 'عليقة تسمين الأبقار المعدة للذبح'
        };
      }

      const isLactation = stg.includes('lactation') || stg.includes('lait') || stg.includes('حليب') || stg.includes('حلوب') || days >= 720;
      if (isLactation) {
        return {
          minGrams: 16000, maxGrams: 20000, avgGrams: 18000, dailyGrams: 18000, ci: 8.50,
          stageKey: 'vache_lactation',
          labelFr: 'Vache laitière en lactation', labelAr: 'بقرة حلوب في فترة إنتاج الحليب', labelEn: 'Dairy cow in lactation',
          notesFr: 'Ration complète: 18 kg MS (ensilage maïs, luzerne, concentré 18%)', notesAr: 'عليقة كاملة: 18 كغ مادة جافة (سيلاج ذرة، فصة، علف 18%)'
        };
      }

      if (days <= 180) {
        return {
          minGrams: 4000, maxGrams: 5000, avgGrams: 4500, dailyGrams: 4500, ci: 3.50,
          stageKey: 'genisse_sevre',
          labelFr: 'Génisse sevrée (0–6 mois)', labelAr: 'عجلة مفطومة (0-6 أشهر)', labelEn: 'Weaned heifer (0-6 mos)',
          notesFr: 'Concentré génisse 2 kg/j + foin à volonté', notesAr: 'علف مركب + قرط فصة'
        };
      }
      if (days <= 450) {
        return {
          minGrams: 6500, maxGrams: 8500, avgGrams: 7500, dailyGrams: 7500, ci: 5.00,
          stageKey: 'genisse_croissance',
          labelFr: 'Génisse de croissance (6–15 mois)', labelAr: 'عجلة نمو (6-15 شهر)', labelEn: 'Growing heifer (6-15 mos)',
          notesFr: 'Fourrage grossier de qualité + 2.5 kg concentré', notesAr: 'أعلاف خشنة ممتازة + 2.5 كغ علف مركّز'
        };
      }

      return {
        minGrams: 8500, maxGrams: 11000, avgGrams: 9800, dailyGrams: 9800, ci: 6.20,
        stageKey: 'genisse_gestante',
        labelFr: 'Génisse gestante (15–24 mois)', labelAr: 'عجلة عشار (15-24 شهر)', labelEn: 'Pregnant heifer (15-24 mos)',
        notesFr: 'Préparation au vêlage, minéraux CMV', notesAr: 'تحضير للولادة، أملاح ومعادن CMV'
      };
    }

    // ── 0b. OVINS & CAPRINS (Moutons, Brebis, Agneaux, Chèvres, Chevreaux) ──
    const isSheep = sp === 'mouton' || sp === 'brebis' || sp === 'agneau' || sp === 'chevre' || sp === 'chevreau' || sp === 'belier' || sp === 'bouc' || sp === 'ovin' || sp === 'caprin' || sp === 'ovin_autre' || sp.includes('mouton') || sp.includes('brebis') || sp.includes('agneau') || sp.includes('chevre') || sp.includes('sheep') || sp.includes('goat') || sp.includes('ram') || sp.includes('lamb');
    if (isSheep) {
      // A. AGNEAU & CHEVREAU
      if (sp === 'agneau' || sp === 'chevreau' || sp.includes('agneau') || sp.includes('chevreau') || sp.includes('lamb') || sp.includes('kid') || stg.includes('agneau') || stg.includes('chevreau')) {
        if (days <= 30) {
          return {
            minGrams: 280, maxGrams: 420, avgGrams: 350, dailyGrams: 350, ci: 0.35,
            stageKey: 'ovin_agneau_lait',
            labelFr: 'Agneau / Chevreau au lait (J1–J30)', labelAr: 'خروف / جدي رضيع باللتر (ي1-30)', labelEn: 'Nursing lamb/kid (d1-30)',
            notesFr: 'Allaitement maternel ou 1.5L lait/j + starter 18% + foin sec', notesAr: 'رضاعة طبيعية أو 1.5 لتر حليب + علف بادي 18% + قرط فصة'
          };
        }
        if (days <= 70) {
          return {
            minGrams: 700, maxGrams: 1000, avgGrams: 850, dailyGrams: 850, ci: 0.85,
            stageKey: 'ovin_agneau_sevre',
            labelFr: 'Agneau / Chevreau sevré (J31–J70)', labelAr: 'خروف / جدي مفطوم (ي31-70)', labelEn: 'Weaned lamb/kid (d31-70)',
            notesFr: 'Concentré ovin 18% (400-600g) + foin de luzerne à volonté', notesAr: 'علف مركب 18% (400-600غ) + قرط فصة ممتاز'
          };
        }
        if (days <= 120) {
          return {
            minGrams: 1200, maxGrams: 1600, avgGrams: 1400, dailyGrams: 1400, ci: 1.40,
            stageKey: 'ovin_agneau_engraissement',
            labelFr: 'Agneau engraissement actif (3–4 mois)', labelAr: 'خروف تسمين مكثف (3-4 أشهر)', labelEn: 'Active fattening lamb (3-4 mos)',
            notesFr: 'Concentré ovin 16% + orge concassée + foin', notesAr: 'علف تسمين 16% + شعير مرحي + قرط'
          };
        }
        return {
          minGrams: 1500, maxGrams: 2100, avgGrams: 1800, dailyGrams: 1800, ci: 1.80,
          stageKey: 'ovin_agneau_finition',
          labelFr: 'Agneau / Chevreau finition (>4 mois)', labelAr: 'خروف / جدي تشطيب نهائي للذبح (>4 أشهر)', labelEn: 'Finished market lamb/kid (>4 mos)',
          notesFr: 'Finition haute énergie musculaire', notesAr: 'عليقة تشطيب نهائية عالية الطاقة'
        };
      }

      // B. MOUTON / BÉLIER / OVIN VIANDE
      if (sp === 'mouton' || sp === 'belier' || sp.includes('mouton') || sp.includes('belier') || sp.includes('ram') || stg.includes('engraissement') || stg.includes('belier')) {
        const isBelier = stg.includes('belier') || stg.includes('reproducteur') || brd.includes('belier');
        if (isBelier) {
          return {
            minGrams: 1900, maxGrams: 2500, avgGrams: 2200, dailyGrams: 2200, ci: 2.20,
            stageKey: 'belier_reproducteur',
            labelFr: 'Bélier adulte reproducteur', labelAr: 'كبش فحل للتلقيح والتكاثر', labelEn: 'Adult breeding ram',
            notesFr: 'Ration entretien + minéraux et sel oligo-éléments', notesAr: 'عليقة صيانة + أملاح وحجر لعق'
          };
        }

        const isFinition = stg.includes('finition') || stg.includes('finish') || days > 300;
        if (isFinition) {
          return {
            minGrams: 1800, maxGrams: 2200, avgGrams: 2000, dailyGrams: 2000, ci: 2.00,
            stageKey: 'mouton_finition',
            labelFr: 'Mouton en finition (viande)', labelAr: 'خروف تسمين نهائي للذبح', labelEn: 'Finished mutton',
            notesFr: 'Ration d\'engraissement orge + concentré 16%', notesAr: 'عليقة تسمين شعير + علف مركب 16%'
          };
        }

        if (days <= 150) {
          return {
            minGrams: 1100, maxGrams: 1400, avgGrams: 1250, dailyGrams: 1250, ci: 1.25,
            stageKey: 'mouton_demarrage',
            labelFr: 'Jeune ovin démarrage', labelAr: 'خروف نمو أولي', labelEn: 'Starter young sheep',
            notesFr: 'Foin sec + concentré', notesAr: 'قرط فصة + علف مركب'
          };
        }

        return {
          minGrams: 1500, maxGrams: 1900, avgGrams: 1700, dailyGrams: 1700, ci: 1.70,
          stageKey: 'mouton_croissance',
          labelFr: 'Mouton en croissance / engraissement', labelAr: 'خروف نمو وتسمين', labelEn: 'Growing / fattening sheep',
          notesFr: 'Foin luzerne/avoine + 800g concentré', notesAr: 'قرط قصيبة/فصة + 800غ علف مركب'
        };
      }

      // C. BREBIS & CHÈVRE (Laitière & Mère)
      const isTarie = stg.includes('tarie') || stg.includes('dry') || stg.includes('شايحة') || stg.includes('راحة');
      if (isTarie) {
        return {
          minGrams: 1100, maxGrams: 1500, avgGrams: 1300, dailyGrams: 1300, ci: 1.30,
          stageKey: 'brebis_tarie',
          labelFr: 'Brebis / Chèvre tarie (repos)', labelAr: 'نعجة / معزة شايحة طور الراحة', labelEn: 'Dry ewe/goat',
          notesFr: 'Foin, paille, minéraux sans excès', notesAr: 'قرط، تبن، وأملاح بدون طاقة مفرطة'
        };
      }

      const isReforme = stg.includes('reforme') || stg.includes('cull') || stg.includes('ذبح') || stg.includes('تفريط');
      if (isReforme) {
        return {
          minGrams: 1200, maxGrams: 1600, avgGrams: 1400, dailyGrams: 1400, ci: 1.40,
          stageKey: 'brebis_reforme',
          labelFr: 'Brebis / Chèvre de réforme (boucherie)', labelAr: 'نعجة / معزة تفريط للذبح', labelEn: 'Cull ewe/goat',
          notesFr: 'Finition modérée', notesAr: 'تشطيب للتفريط والذبح'
        };
      }

      const isGestante = stg.includes('gestante') || stg.includes('pregnant') || stg.includes('عشار');
      if (isGestante) {
        return {
          minGrams: 1600, maxGrams: 2000, avgGrams: 1800, dailyGrams: 1800, ci: 1.80,
          stageKey: 'brebis_gestante',
          labelFr: 'Brebis / Chèvre gestante (fin de gestation)', labelAr: 'نعجة / معزة عشار (أواخر الحمل)', labelEn: 'Pregnant ewe/goat',
          notesFr: 'Renforcement énergétique et minéral pré-agnelage', notesAr: 'تقوية الطاقة والأملاح قبل الولادة'
        };
      }

      const isLactation = stg.includes('lactation') || stg.includes('lait') || stg.includes('حليب') || stg.includes('حلوب') || days >= 420;
      if (isLactation) {
        return {
          minGrams: 2300, maxGrams: 2900, avgGrams: 2600, dailyGrams: 2600, ci: 2.60,
          stageKey: 'brebis_lactation',
          labelFr: 'Brebis / Chèvre en lactation (1.5–3 L/j)', labelAr: 'نعجة / معزة حلوب في إنتاج الحليب (1.5-3 لتر/يوم)', labelEn: 'Lactating ewe/goat (1.5-3 L/d)',
          notesFr: 'Foin luzerne 1.2 kg + concentré 18% 1 kg + orge 400g + sel', notesAr: 'قرط فصة 1.2 كغ + علف حلوب 1 كغ + شعير 400غ + ملح'
        };
      }

      if (days <= 150) {
        return {
          minGrams: 800, maxGrams: 1100, avgGrams: 950, dailyGrams: 950, ci: 0.95,
          stageKey: 'agnela_jeune',
          labelFr: 'Agnela / Chevrette jeune', labelAr: 'بركوسة / سخلة نمو بداية', labelEn: 'Young ewe lamb / doeling',
          notesFr: 'Foin de luzerne + starter', notesAr: 'قرط فصة + علف مركب'
        };
      }

      return {
        minGrams: 1200, maxGrams: 1600, avgGrams: 1400, dailyGrams: 1400, ci: 1.40,
        stageKey: 'agnela_croissance',
        labelFr: 'Agnela / Chevrette de renouvellement', labelAr: 'بركوسة / سخلة تربية وتجديد القطيع', labelEn: 'Replacement ewe lamb / doeling',
        notesFr: 'Fourrage de qualité + concentré modéré', notesAr: 'أعلاف خشنة ممتازة + علف مركب معتدل'
      };
    }

    // ── 1. CANARD DE BARBARIE / PALMIPÈDES (Barème zootechnique) ──────────────
    if (sp === 'canard' || sp === 'canard_barbarie' || sp.includes('duck')) {
      if (days <= 7) {
        return {
          minGrams: 18, maxGrams: 26, avgGrams: 22, dailyGrams: 22, ci: 0.73,
          stageKey: 'duck_starter_1',
          labelFr: 'Caneton J1–J7', labelAr: 'فراخ بط الأسبوع الأول', labelEn: 'Duckling day 1-7',
          notesFr: 'Miettes haute protéine (21-22%)', notesAr: 'علف ابتدائي 21-22% بروتين'
        };
      }
      if (days <= 14) {
        return {
          minGrams: 34, maxGrams: 46, avgGrams: 40, dailyGrams: 40, ci: 1.33,
          stageKey: 'duck_starter_2',
          labelFr: 'Caneton J8–J14', labelAr: 'فراخ بط الأسبوع الثاني', labelEn: 'Duckling day 8-14',
          notesFr: 'Démarrage actif', notesAr: 'نمو بادي نشط'
        };
      }
      if (days <= 21) {
        return {
          minGrams: 52, maxGrams: 64, avgGrams: 58, dailyGrams: 58, ci: 1.93,
          stageKey: 'duck_starter_3',
          labelFr: 'Caneton J15–J21', labelAr: 'فراخ بط الأسبوع الثالث', labelEn: 'Duckling day 15-21',
          notesFr: 'Fin de démarrage', notesAr: 'نهاية مرحلة البداية'
        };
      }
      if (days <= 35) {
        return {
          minGrams: 70, maxGrams: 90, avgGrams: 80, dailyGrams: 80, ci: 2.67,
          stageKey: 'duck_grower_early',
          labelFr: 'Caneton croissance (J22–J35)', labelAr: 'بط نمو مبكر', labelEn: 'Duckling early grower',
          notesFr: 'Croissance osseuse rapide', notesAr: 'نمو عظمي وهيكلي سريع'
        };
      }
      if (days <= 49) {
        return {
          minGrams: 90, maxGrams: 110, avgGrams: 100, dailyGrams: 100, ci: 3.33,
          stageKey: 'duck_grower_mid',
          labelFr: 'Canard croissance (J36–J49)', labelAr: 'بط نمو متوسط', labelEn: 'Duck mid grower',
          notesFr: 'Développement musculaire soutenu', notesAr: 'تطور عضلي نشط'
        };
      }
      if (days <= 70) {
        return {
          minGrams: 120, maxGrams: 145, avgGrams: 132, dailyGrams: 132, ci: 4.40,
          stageKey: 'duck_grower_late',
          labelFr: 'Jeune canard croissance (J50–J70)', labelAr: 'بط نمو متقدم', labelEn: 'Young duck grower',
          notesFr: 'Pic d\'appétit et plumage', notesAr: 'ذروة الشهية واكتمال الريش'
        };
      }
      if (days <= 84) {
        return {
          minGrams: 140, maxGrams: 160, avgGrams: 150, dailyGrams: 150, ci: 5.00,
          stageKey: 'duck_grower_fin',
          labelFr: 'Canard en transition (J71–J84)', labelAr: 'بط مرحلة انتقالية', labelEn: 'Duck transition',
          notesFr: 'Finition progressive', notesAr: 'تسمين تدريجي'
        };
      }
      if (days <= 112) {
        return {
          minGrams: 155, maxGrams: 185, avgGrams: 170, dailyGrams: 170, ci: 5.67,
          stageKey: 'duck_finishing',
          labelFr: 'Canard en finition (J85–J112)', labelAr: 'بط تسمين نهائي', labelEn: 'Duck finishing',
          notesFr: 'Prise de gras et masse corporelle', notesAr: 'اكتساب الوزن واللحم'
        };
      }
      
      const isMale = stg.includes('mâle') || stg.includes('male') || stg.includes('ذكر') || brd.includes('mâle') || brd.includes('male');
      const isFemale = stg.includes('femelle') || stg.includes('female') || stg.includes('أنثى') || stg.includes('canne') || brd.includes('canne');
      if (isMale) {
        return {
          minGrams: 160, maxGrams: 180, avgGrams: 170, dailyGrams: 170, ci: 5.67,
          stageKey: 'duck_adult_male',
          labelFr: 'Canard adulte mâle (>112j)', labelAr: 'ذكر بط بالغ', labelEn: 'Adult Drake',
          notesFr: 'Reproducteur lourd (4.5–5.5 kg)', notesAr: 'فحل تلقيح يزن 4.5-5.5 كغ'
        };
      }
      if (isFemale) {
        return {
          minGrams: 120, maxGrams: 140, avgGrams: 130, dailyGrams: 130, ci: 4.33,
          stageKey: 'duck_adult_female',
          labelFr: 'Canne adulte femelle (>112j)', labelAr: 'أنثى بط بالغة (بياضة)', labelEn: 'Adult Female Duck',
          notesFr: 'Canne pondeuse (2.5–3 kg)', notesAr: 'أنثى بياضة تزن 2.5-3 كغ'
        };
      }
      return {
        minGrams: 135, maxGrams: 165, avgGrams: 150, dailyGrams: 150, ci: 5.00,
        stageKey: 'duck_adult_mixed',
        labelFr: 'Canard adulte mixte (>112j)', labelAr: 'بط بالغ مختلط', labelEn: 'Adult duck (mixed)',
        notesFr: 'Troupeau mixte mâles et femelles', notesAr: 'قطيع مختلط ذكور وإناث'
      };
    }

    // ── 2. PINTADE (Numida meleagris - Barème zootechnique) ───────────────────
    if (sp === 'pintade' || sp.includes('guinea')) {
      if (days <= 7) {
        return {
          minGrams: 12, maxGrams: 18, avgGrams: 15, dailyGrams: 15, ci: 0.50,
          stageKey: 'pintade_keet_1',
          labelFr: 'Pintadeaux J1–J7', labelAr: 'كتاكيت الوادي الأسبوع 1', labelEn: 'Guinea keet day 1-7',
          notesFr: 'Miettes démarrage 24% protéine', notesAr: 'علف ابتدائي 24% بروتين'
        };
      }
      if (days <= 14) {
        return {
          minGrams: 18, maxGrams: 26, avgGrams: 22, dailyGrams: 22, ci: 0.73,
          stageKey: 'pintade_keet_2',
          labelFr: 'Pintadeaux J8–J14', labelAr: 'كتاكيت الوادي الأسبوع 2', labelEn: 'Guinea keet day 8-14',
          notesFr: 'Haute sensibilité thermique', notesAr: 'حساسية عالية للحرارة'
        };
      }
      if (days <= 21) {
        return {
          minGrams: 24, maxGrams: 32, avgGrams: 28, dailyGrams: 28, ci: 0.93,
          stageKey: 'pintade_keet_3',
          labelFr: 'Pintadeaux J15–J21', labelAr: 'كتاكيت الوادي الأسبوع 3', labelEn: 'Guinea keet day 15-21',
          notesFr: 'Croissance osseuse', notesAr: 'نمو هيكلي متسارع'
        };
      }
      if (days <= 28) {
        return {
          minGrams: 30, maxGrams: 40, avgGrams: 35, dailyGrams: 35, ci: 1.17,
          stageKey: 'pintade_keet_4',
          labelFr: 'Pintadeaux J22–J28', labelAr: 'كتاكيت الوادي الأسبوع 4', labelEn: 'Guinea keet day 22-28',
          notesFr: 'Fin de démarrage', notesAr: 'نهاية مرحلة البداية'
        };
      }
      if (days <= 42) {
        return {
          minGrams: 45, maxGrams: 55, avgGrams: 50, dailyGrams: 50, ci: 1.67,
          stageKey: 'pintade_grower_1',
          labelFr: 'Pintades croissance 1 (J29–J42)', labelAr: 'دجاج الوادي نمو مبكر', labelEn: 'Guinea grower 1',
          notesFr: 'Aliment croissance 19-20%', notesAr: 'علف نمو 19-20% بروتين'
        };
      }
      if (days <= 56) {
        return {
          minGrams: 55, maxGrams: 68, avgGrams: 60, dailyGrams: 60, ci: 2.00,
          stageKey: 'pintade_grower_2',
          labelFr: 'Pintades croissance 2 (J43–J56)', labelAr: 'دجاج الوادي نمو متوسط', labelEn: 'Guinea grower 2',
          notesFr: 'Croissance vive', notesAr: 'نمو نشط واكتمال ريش'
        };
      }
      if (days <= 70) {
        return {
          minGrams: 65, maxGrams: 78, avgGrams: 72, dailyGrams: 72, ci: 2.40,
          stageKey: 'pintade_grower_3',
          labelFr: 'Pintades croissance 3 (J57–J70)', labelAr: 'دجاج الوادي نمو متقدم', labelEn: 'Guinea grower 3',
          notesFr: 'Aliment 18% protéine', notesAr: 'علف نمو 18% بروتين'
        };
      }
      if (days <= 84) {
        return {
          minGrams: 75, maxGrams: 88, avgGrams: 80, dailyGrams: 80, ci: 2.67,
          stageKey: 'pintade_grower_4',
          labelFr: 'Pintades croissance 4 (J71–J84)', labelAr: 'دجاج الوادي نمو متأخر', labelEn: 'Guinea grower 4',
          notesFr: 'Bonne conformation', notesAr: 'بنية جسدية ممتازة'
        };
      }
      if (days <= 112) {
        return {
          minGrams: 85, maxGrams: 105, avgGrams: 95, dailyGrams: 95, ci: 3.17,
          stageKey: 'pintade_sub_adult',
          labelFr: 'Pintade finition chair (J85–J112)', labelAr: 'دجاج الوادي تسمين', labelEn: 'Guinea finisher',
          notesFr: 'Finition pour abattage ou élevage', notesAr: 'تسمين للذبح أو تربية'
        };
      }
      if (days <= 140) {
        return {
          minGrams: 100, maxGrams: 120, avgGrams: 110, dailyGrams: 110, ci: 3.67,
          stageKey: 'pintade_prelay',
          labelFr: 'Pintade pré-ponte (J113–J140)', labelAr: 'دجاج الوادي قبل البيض', labelEn: 'Pre-laying guinea',
          notesFr: 'Enrichi en calcium et minéraux', notesAr: 'غني بالكالسيوم والمعادن'
        };
      }

      const isLaying = stg.includes('ponte') || stg.includes('lay') || brd.includes('ponte');
      if (isLaying) {
        return {
          minGrams: 120, maxGrams: 140, avgGrams: 130, dailyGrams: 130, ci: 4.33,
          stageKey: 'pintade_laying',
          labelFr: 'Pintade pondeuse adulte (>140j)', labelAr: 'دجاج الوادي بياضة بالغة', labelEn: 'Laying guinea fowl',
          notesFr: 'Ponte saisonnière (80–120 œufs/an)', notesAr: 'إنتاج بيض موسمي 80-120 بيضة/سنة'
        };
      }
      return {
        minGrams: 105, maxGrams: 125, avgGrams: 115, dailyGrams: 115, ci: 3.83,
        stageKey: 'pintade_adult',
        labelFr: 'Pintade adulte chair (>140j)', labelAr: 'دجاج الوادي بالغ (لحم)', labelEn: 'Adult guinea fowl (meat)',
        notesFr: 'Adulte 1.5–2 kg vif', notesAr: 'بالغ لحم يزن 1.5-2 كغ'
      };
    }

    // ── 3. CAILLE (Coturnix japonica - Cycle très court) ──────────────────────
    if (sp === 'caille' || sp.includes('quail')) {
      if (days <= 7) {
        return {
          minGrams: 4, maxGrams: 8, avgGrams: 6, dailyGrams: 6, ci: 0.20,
          stageKey: 'quail_starter_1',
          labelFr: 'Cailleteau J1–J7', labelAr: 'فرخ السمان الأسبوع 1', labelEn: 'Quail chick day 1-7',
          notesFr: 'Miettes fines 28% protéine', notesAr: 'علف بادي دقيق 28% بروتين'
        };
      }
      if (days <= 14) {
        return {
          minGrams: 8, maxGrams: 12, avgGrams: 10, dailyGrams: 10, ci: 0.33,
          stageKey: 'quail_starter_2',
          labelFr: 'Cailleteau J8–J14', labelAr: 'فرخ السمان الأسبوع 2', labelEn: 'Quail chick day 8-14',
          notesFr: 'Croissance rapide 24% protéine', notesAr: 'نمو سريع 24% بروتين'
        };
      }
      if (days <= 21) {
        return {
          minGrams: 12, maxGrams: 16, avgGrams: 14, dailyGrams: 14, ci: 0.47,
          stageKey: 'quail_grower',
          labelFr: 'Jeune caille (J15–J21)', labelAr: 'سمان شاب', labelEn: 'Young quail',
          notesFr: 'Développement vigoureux', notesAr: 'تطور سريع وترييش'
        };
      }
      if (days <= 35) {
        return {
          minGrams: 16, maxGrams: 20, avgGrams: 18, dailyGrams: 18, ci: 0.60,
          stageKey: 'quail_finisher',
          labelFr: 'Caille pré-ponte / finition (J22–J35)', labelAr: 'سمان تحضير البيض/تسمين', labelEn: 'Quail pre-layer / finisher',
          notesFr: 'Transition maturité sexuelle', notesAr: 'مرحلة البلوغ الجنسي السريع'
        };
      }

      const isLaying = stg.includes('ponte') || stg.includes('lay') || brd.includes('ponte');
      if (isLaying) {
        return {
          minGrams: 23, maxGrams: 27, avgGrams: 25, dailyGrams: 25, ci: 0.83,
          stageKey: 'quail_layer',
          labelFr: 'Caille pondeuse adulte (>J35)', labelAr: 'سمان بياضة بالغة', labelEn: 'Adult laying quail',
          notesFr: 'Plein pic de ponte (250–300 œufs/an)', notesAr: 'ذروة إنتاج البيض 250-300 بيضة/سنة'
        };
      }
      return {
        minGrams: 20, maxGrams: 24, avgGrams: 22, dailyGrams: 22, ci: 0.73,
        stageKey: 'quail_adult_meat',
        labelFr: 'Caille adulte chair (>J35)', labelAr: 'سمان بالغ (لحم)', labelEn: 'Adult meat quail',
        notesFr: 'Poids adulte 160–200 g', notesAr: 'وزن بالغ 160-200 غرام'
      };
    }

    // ── 4. DINDE (Meleagris gallopavo - Grande volaille) ─────────────────────
    if (sp === 'dinde' || sp.includes('turkey')) {
      if (days <= 14) {
        return {
          minGrams: 30, maxGrams: 50, avgGrams: 40, dailyGrams: 40, ci: 1.33,
          stageKey: 'turkey_starter_1',
          labelFr: 'Dindonneau démarrage (J1–J14)', labelAr: 'ديك رومي بداية', labelEn: 'Turkey poult starter',
          notesFr: 'Démarrage haute protéine (28%)', notesAr: 'علف بادي 28% بروتين'
        };
      }
      if (days <= 28) {
        return {
          minGrams: 60, maxGrams: 80, avgGrams: 70, dailyGrams: 70, ci: 2.33,
          stageKey: 'turkey_starter_2',
          labelFr: 'Dindonneau 2e stade (J15–J28)', labelAr: 'ديك رومي صغير', labelEn: 'Turkey poult 2',
          notesFr: 'Aliment démarrage 24%', notesAr: 'علف نمو 24% بروتين'
        };
      }
      if (days <= 56) {
        return {
          minGrams: 110, maxGrams: 150, avgGrams: 130, dailyGrams: 130, ci: 4.33,
          stageKey: 'turkey_grower_1',
          labelFr: 'Dindonneau croissance 1 (J29–J56)', labelAr: 'ديك رومي نمو مبكر', labelEn: 'Turkey grower 1',
          notesFr: 'Forte ossification', notesAr: 'بناء عظمي ضخم'
        };
      }
      if (days <= 84) {
        return {
          minGrams: 160, maxGrams: 200, avgGrams: 180, dailyGrams: 180, ci: 6.00,
          stageKey: 'turkey_grower_2',
          labelFr: 'Dindonneau croissance 2 (J57–J84)', labelAr: 'ديك رومي نمو متقدم', labelEn: 'Turkey grower 2',
          notesFr: 'Aliment 20% protéine', notesAr: 'علف نمو 20% بروتين'
        };
      }
      if (days <= 112) {
        return {
          minGrams: 200, maxGrams: 240, avgGrams: 220, dailyGrams: 220, ci: 7.33,
          stageKey: 'turkey_finisher',
          labelFr: 'Dindon finition (J85–J112)', labelAr: 'ديك رومي تسمين', labelEn: 'Turkey finisher',
          notesFr: 'Engraissement final', notesAr: 'تسمين نهائي واكتساب وزن'
        };
      }

      const isMale = stg.includes('mâle') || stg.includes('male') || stg.includes('ذكر');
      if (isMale) {
        return {
          minGrams: 300, maxGrams: 340, avgGrams: 320, dailyGrams: 320, ci: 10.67,
          stageKey: 'turkey_adult_male',
          labelFr: 'Dindon adulte mâle (>112j)', labelAr: 'ديك رومي فحل بالغ', labelEn: 'Adult Tom Turkey',
          notesFr: 'Reproducteur lourd (15–20 kg)', notesAr: 'فحل تلقيح يزن 15-20 كغ'
        };
      }
      return {
        minGrams: 230, maxGrams: 270, avgGrams: 250, dailyGrams: 250, ci: 8.33,
        stageKey: 'turkey_adult_female',
        labelFr: 'Dinde adulte femelle (>112j)', labelAr: 'دجاج رومي أنثى بالغة', labelEn: 'Adult Hen Turkey',
        notesFr: 'Femelle reproductrice (8–12 kg)', notesAr: 'أنثى للتفريخ تزن 8-12 كغ'
      };
    }

    // ── 5. AUTRE VOLAILLE générique ──────────────────────────────────────────
    if (sp === 'autre') {
      if (days <= 28) {
        return {
          minGrams: 25, maxGrams: 35, avgGrams: 30, dailyGrams: 30, ci: 1.00,
          stageKey: 'other_starter',
          labelFr: 'Démarrage (J1–J28)', labelAr: 'مرحلة البداية', labelEn: 'Starter (d1-28)',
          notesFr: 'Aliment premier âge', notesAr: 'علف بادي'
        };
      }
      if (days <= 84) {
        return {
          minGrams: 55, maxGrams: 75, avgGrams: 65, dailyGrams: 65, ci: 2.17,
          stageKey: 'other_grower',
          labelFr: 'Croissance (J29–J84)', labelAr: 'مرحلة النمو', labelEn: 'Grower (d29-84)',
          notesFr: 'Aliment croissance standard', notesAr: 'علف نمو قياسي'
        };
      }
      if (days <= 154) {
        return {
          minGrams: 85, maxGrams: 105, avgGrams: 95, dailyGrams: 95, ci: 3.17,
          stageKey: 'other_finisher',
          labelFr: 'Finition / Développement (J85–J154)', labelAr: 'تسمين وبلوغ', labelEn: 'Finisher / Development',
          notesFr: 'Transition adulte', notesAr: 'مرحلة البلوغ'
        };
      }
      return {
        minGrams: 110, maxGrams: 130, avgGrams: 120, dailyGrams: 120, ci: 4.00,
        stageKey: 'other_adult',
        labelFr: 'Volaille adulte (>154j)', labelAr: 'طيور بالغة', labelEn: 'Adult poultry',
        notesFr: 'Maintien adulte', notesAr: 'تغذية صيانة وبلوغ'
      };
    }

    // ── 6. POULE & POULET / GALLINACÉS (Barème zootechnique officiel) ───────────
    if (days <= 7) {
      return {
        minGrams: 11, maxGrams: 17, avgGrams: 14, dailyGrams: 14, ci: 0.47,
        stageKey: 'chicken_day1_7',
        labelFr: 'Poussin J1–J7', labelAr: 'كتكوت الأسبوع 1', labelEn: 'Chick day 1-7',
        notesFr: 'Miettes démarrage 22% protéine', notesAr: 'علف ابتدائي 22% بروتين'
      };
    }
    if (days <= 14) {
      return {
        minGrams: 18, maxGrams: 26, avgGrams: 22, dailyGrams: 22, ci: 0.73,
        stageKey: 'chicken_day8_14',
        labelFr: 'Poussin J8–J14', labelAr: 'كتكوت الأسبوع 2', labelEn: 'Chick day 8-14',
        notesFr: 'Démarrage actif', notesAr: 'بداية نشطة واكتمال ترييش'
      };
    }
    if (days <= 21) {
      return {
        minGrams: 24, maxGrams: 32, avgGrams: 28, dailyGrams: 28, ci: 0.93,
        stageKey: 'chicken_day15_21',
        labelFr: 'Poussin J15–J21', labelAr: 'كتكوت الأسبوع 3', labelEn: 'Chick day 15-21',
        notesFr: 'Croissance rapide', notesAr: 'نمو سريع'
      };
    }
    if (days <= 28) {
      return {
        minGrams: 30, maxGrams: 38, avgGrams: 34, dailyGrams: 34, ci: 1.13,
        stageKey: 'chicken_starter',
        labelFr: 'Poussin J22–J28', labelAr: 'كتكوت الأسبوع 4', labelEn: 'Chick day 22-28',
        notesFr: 'Fin de phase démarrage', notesAr: 'نهاية مرحلة البداية'
      };
    }
    if (days <= 42) {
      return {
        minGrams: 44, maxGrams: 56, avgGrams: 50, dailyGrams: 50, ci: 1.67,
        stageKey: 'chicken_grower_early',
        labelFr: 'Poulet croissance précoce (J29–J42)', labelAr: 'دجاج نمو مبكر', labelEn: 'Early grower chicken',
        notesFr: 'Aliment croissance 19% protéine', notesAr: 'علف نمو 19% بروتين'
      };
    }
    if (days <= 56) {
      return {
        minGrams: 58, maxGrams: 72, avgGrams: 65, dailyGrams: 65, ci: 2.17,
        stageKey: 'chicken_grower_mid',
        labelFr: 'Poulet croissance milieu (J43–J56)', labelAr: 'دجاج نمو متوسط', labelEn: 'Mid grower chicken',
        notesFr: 'Développement vigoureux (18% protéine)', notesAr: 'نمو نشط 18% بروتين'
      };
    }
    if (days <= 70) {
      return {
        minGrams: 68, maxGrams: 82, avgGrams: 75, dailyGrams: 75, ci: 2.50,
        stageKey: 'chicken_grower',
        labelFr: 'Poulet croissance (J57–J70)', labelAr: 'دجاج نمو', labelEn: 'Grower chicken',
        notesFr: 'Aliment croissance soutenue (17% protéine)', notesAr: 'علف نمو 17% بروتين'
      };
    }
    if (days <= 84) {
      return {
        minGrams: 74, maxGrams: 90, avgGrams: 82, dailyGrams: 82, ci: 2.73,
        stageKey: 'chicken_young',
        labelFr: 'Jeune poulet (J71–J84)', labelAr: 'دجاج شاب', labelEn: 'Young chicken',
        notesFr: 'Transition pré-adulte (16% protéine)', notesAr: 'مرحلة تحضير البلوغ 16% بروتين'
      };
    }
    if (days <= 112) {
      return {
        minGrams: 82, maxGrams: 98, avgGrams: 90, dailyGrams: 90, ci: 3.00,
        stageKey: 'chicken_sub_adult',
        labelFr: 'Poulet sub-adulte (J85–J112)', labelAr: 'دجاج شبه بالغ', labelEn: 'Sub-adult chicken',
        notesFr: 'Finition chair ou élevage', notesAr: 'تسمين أو تحضير إنتاج'
      };
    }
    if (days <= 140) {
      return {
        minGrams: 90, maxGrams: 110, avgGrams: 100, dailyGrams: 100, ci: 3.33,
        stageKey: 'chicken_transition',
        labelFr: 'Poulette transition (J113–J140)', labelAr: 'بشاير انتقال', labelEn: 'Transition pullet',
        notesFr: 'Transition ponte (16% protéine)', notesAr: 'انتقال للبيض 16% بروتين'
      };
    }
    if (days <= 154) {
      return {
        minGrams: 100, maxGrams: 116, avgGrams: 108, dailyGrams: 108, ci: 3.60,
        stageKey: 'chicken_prelay',
        labelFr: 'Poulette pré-ponte (J141–J154)', labelAr: 'بشاير مقبلة على البيض', labelEn: 'Pre-layer pullet',
        notesFr: 'Aliment pré-ponte riche en calcium', notesAr: 'علف غني بالكالسيوم لبدء البيض'
      };
    }

    const isRooster = stg.includes('coq') || stg.includes('rooster') || stg.includes('سردوك') || stg.includes('فحل') || brd.includes('coq');
    if (isRooster) {
      return {
        minGrams: 120, maxGrams: 140, avgGrams: 130, dailyGrams: 130, ci: 4.33,
        stageKey: 'chicken_rooster',
        labelFr: 'Coq adulte (>154j)', labelAr: 'سردوك بالغ', labelEn: 'Adult rooster',
        notesFr: 'Maintien de condition reproducteur', notesAr: 'فحول مخصبة للتلقيح'
      };
    }

    return {
      minGrams: 110, maxGrams: 120, avgGrams: 115, dailyGrams: 115, ci: 3.83,
      stageKey: 'chicken_adult_layer',
      labelFr: 'Poule pondeuse adulte (>154j)', labelAr: 'دجاجة بياضة', labelEn: 'Laying hen',
      notesFr: 'Plein pic de ponte (aliment ponte)', notesAr: 'إنتاج البيض اليومي المستمر'
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
    // 1. Priorité absolue : moyenne pondérée réelle des types d'aliments déclarés en stock
    if (Array.isArray(appState.feedTypes) && appState.feedTypes.length > 0) {
      let totalKg = 0;
      let totalVal = 0;
      appState.feedTypes.forEach(ft => {
        const k = Number(ft.stockKg) || 0;
        const p = Number(ft.pricePerKg) || 0;
        if (k > 0 && p > 0) {
          totalKg += k;
          totalVal += k * p;
        }
      });
      if (totalKg > 0 && totalVal > 0) {
        return parseFloat((totalVal / totalKg).toFixed(3));
      }
      const declaredPrices = appState.feedTypes.map(ft => Number(ft.pricePerKg) || 0).filter(p => p > 0);
      if (declaredPrices.length > 0) {
        return parseFloat((declaredPrices.reduce((a, b) => a + b, 0) / declaredPrices.length).toFixed(3));
      }
    }

    // 2. Si des dépenses d'aliments avec quantités réelles en kg existent
    const feedExpenses = (appState.expenses || []).filter(e => e.category === 'nourriture' && Number(e.total) > 0);
    let expTotalKg = 0;
    let expTotalCost = 0;
    feedExpenses.forEach(e => {
      const addedKg = Number(e.feedStockAddedKg) || 0;
      let q = addedKg > 0 ? addedKg : (Number(e.quantity) || 0);
      const titleLower = (e.title || '').toLowerCase();
      if (addedKg <= 0 && (titleLower.includes('50kg') || (titleLower.includes('sac') && !titleLower.includes('25kg')))) {
        q = q * 50;
      } else if (addedKg <= 0 && titleLower.includes('25kg')) {
        q = q * 25;
      }
      const t = Number(e.total) || 0;
      if (q > 0 && t > 0) {
        expTotalKg += q;
        expTotalCost += t;
      }
    });
    if (expTotalKg > 0 && expTotalCost > 0) {
      return parseFloat((expTotalCost / expTotalKg).toFixed(3));
    }

    // 3. Fallback sur feedStockCostPerKg si renseigné
    if (appState.feedStockCostPerKg && Number(appState.feedStockCostPerKg) > 0) {
      return Number(appState.feedStockCostPerKg);
    }

    // 4. Aucun prix inventé : 0 par défaut
    return 0;
  },

  getAvailableFeedStockKg() {
    if (Array.isArray(appState.feedTypes) && appState.feedTypes.length > 0) {
      return parseFloat(appState.feedTypes.reduce((acc, ft) => acc + (Number(ft.stockKg) || 0), 0).toFixed(2));
    }

    if (appState.feedStockKg !== null && appState.feedStockKg !== undefined) {
      return Math.max(0, parseFloat((Number(appState.feedStockKg) || 0).toFixed(2)));
    }

    return 0;
  },

  getFeedDisplayName(ft) {
    if (!ft) return '';
    const lang = appState.lang || 'fr';
    const name = String(ft.name || '');
    const id = String(ft.id || ft.feedTypeId || '');
    const lower = name.toLowerCase();
    const isMoulu = ft.texture === 'moulu';

    // Blé / قمح (Notice: "بليه" is permanently excluded from display and replaced by Blé / قمح)
    if (id === 'feed-ble' || lower.includes('blé') || lower.includes('ble') || name.includes('قمح') || name.includes('بليه')) {
      if (lang === 'ar') return isMoulu ? 'قمح مرحي' : 'قمح كعب';
      if (lang === 'en') return isMoulu ? 'Wheat (ground)' : 'Wheat (grain)';
      return isMoulu ? 'Blé (moulu)' : 'Blé (grain)';
    }
    // Aliment ponte / علف بياضة
    if (id === 'feed-bouchon' || name.includes('بوشون') || lower.includes('ponte') || lower.includes('bouchon')) {
      if (lang === 'ar') return isMoulu ? 'علف بياضة (مرحي)' : 'علف بياضة';
      if (lang === 'en') return isMoulu ? 'Layer Feed (Mash)' : 'Layer Feed';
      return isMoulu ? 'Aliment ponte (farine)' : 'Aliment ponte';
    }
    // Maïs
    if (lower.includes('maïs') || lower.includes('mais') || name.includes('ذرَة') || name.includes('ذرة')) {
      if (lang === 'ar') return isMoulu ? 'ذرة مرحية' : 'ذرة كعب';
      if (lang === 'en') return isMoulu ? 'Cracked Corn' : 'Whole Corn';
      return isMoulu ? 'Maïs concassé' : 'Maïs grains';
    }
    // Son
    if (lower.includes('son') || name.includes('نخالة')) {
      if (lang === 'ar') return 'نخالة القمح';
      if (lang === 'en') return 'Wheat Bran';
      return 'Son de blé';
    }
    // Démarrage
    if (lower.includes('démarrage') || lower.includes('demarrage') || name.includes('بداية')) {
      if (lang === 'ar') return isMoulu ? 'علف بداية (مرحي)' : 'علف بداية (حبيبات)';
      if (lang === 'en') return isMoulu ? 'Starter Feed (Mash)' : 'Starter Feed (Crumbles)';
      return isMoulu ? 'Aliment démarrage (farine)' : 'Aliment démarrage (miettes)';
    }
    // Féverole
    if (lower.includes('feverole') || lower.includes('féverole') || name.includes('فول')) {
      if (lang === 'ar') return isMoulu ? 'فول مدشش (مرحي)' : 'فول كعب';
      if (lang === 'en') return isMoulu ? 'Cracked Faba Beans' : 'Whole Faba Beans';
      return isMoulu ? 'Féverole concassée' : 'Féverole entière';
    }
    // Orge
    if (id === 'feed-orge' || lower.includes('orge') || name.includes('شعير')) {
      if (lang === 'ar') return isMoulu ? 'شعير مرحي' : 'شعير كعب';
      if (lang === 'en') return isMoulu ? 'Ground Barley' : 'Whole Barley';
      return isMoulu ? 'Orge (moulu)' : 'Orge (grain)';
    }
    // Tournesol
    if (id === 'feed-tournesol' || lower.includes('tournesol') || name.includes('عباد') || name.includes('قلوب')) {
      if (lang === 'ar') return 'قلوب عباد الشمس';
      if (lang === 'en') return 'Sunflower Seeds';
      return 'Tournesol';
    }
    // Mélange
    if (id === 'feed-melange' || lower.includes('mélange') || lower.includes('melange') || name.includes('خلطة')) {
      if (lang === 'ar') return 'خلطة حبوب';
      if (lang === 'en') return 'Grain Mixture';
      return 'Mélange graines';
    }
    // Soja
    if (id === 'feed-soja' || lower.includes('soja') || name.includes('صويا')) {
      if (lang === 'ar') return 'صويا مرحية';
      if (lang === 'en') return 'Soybean Meal';
      return 'Tourteau de soja';
    }
    // Concentré / CMV
    if (id === 'feed-concentre' || lower.includes('concentré') || lower.includes('concentre') || name.includes('مركز') || name.includes('cmv')) {
      if (lang === 'ar') return 'علف مركز (CMV)';
      if (lang === 'en') return 'Feed Concentrate';
      return 'Concentré (CMV)';
    }
    // Croissance / Engraissement
    if (id === 'feed-croissance' || lower.includes('croissance') || lower.includes('engraissement') || name.includes('تسمين') || name.includes('نمو')) {
      if (lang === 'ar') return 'علف نمو وتسمين';
      if (lang === 'en') return 'Grower / Finisher Feed';
      return 'Aliment croissance';
    }
    return isMoulu ? `${name} (مرحي)` : name;
  },

  getFeedShortName(ft) {
    if (!ft) return '';
    const lang = appState.lang || 'fr';
    const name = String(ft.name || '');
    const id = String(ft.id || ft.feedTypeId || '');
    const lower = name.toLowerCase();
    const isMoulu = ft.texture === 'moulu';

    // Blé / قمح
    if (id === 'feed-ble' || lower.includes('blé') || lower.includes('ble') || name.includes('قمح') || name.includes('بليه')) {
      if (lang === 'ar') return isMoulu ? 'قمح مرحي' : 'قمح كعب';
      if (lang === 'en') return isMoulu ? 'Wheat (gr)' : 'Wheat';
      return isMoulu ? 'Blé moulu' : 'Blé';
    }
    // Aliment ponte / علف بياضة
    if (id === 'feed-bouchon' || name.includes('بوشون') || lower.includes('ponte') || lower.includes('bouchon')) {
      if (lang === 'ar') return isMoulu ? 'علف بياضة مرحي' : 'علف بياضة';
      if (lang === 'en') return isMoulu ? 'Layer Mash' : 'Layer Feed';
      return isMoulu ? 'Farine ponte' : 'Aliment ponte';
    }
    // Maïs
    if (lower.includes('maïs') || lower.includes('mais') || name.includes('ذرَة') || name.includes('ذرة')) {
      if (lang === 'ar') return isMoulu ? 'ذرة مرحية' : 'ذرة كعب';
      if (lang === 'en') return isMoulu ? 'Cracked Corn' : 'Corn';
      return isMoulu ? 'Maïs concassé' : 'Maïs grains';
    }
    // Son
    if (lower.includes('son') || name.includes('نخالة')) {
      if (lang === 'ar') return 'نخالة';
      if (lang === 'en') return 'Bran';
      return 'Son';
    }
    // Démarrage
    if (lower.includes('démarrage') || lower.includes('demarrage') || name.includes('بداية')) {
      if (lang === 'ar') return isMoulu ? 'بداية مرحي' : 'بداية';
      if (lang === 'en') return 'Starter';
      return isMoulu ? 'Démarrage farine' : 'Démarrage';
    }
    // Féverole
    if (lower.includes('feverole') || lower.includes('féverole') || name.includes('فول')) {
      if (lang === 'ar') return isMoulu ? 'فول مدشش' : 'فول كعب';
      if (lang === 'en') return 'Beans';
      return isMoulu ? 'Féverole conc.' : 'Féverole';
    }
    // Orge
    if (id === 'feed-orge' || lower.includes('orge') || name.includes('شعير')) {
      if (lang === 'ar') return isMoulu ? 'شعير مرحي' : 'شعير';
      if (lang === 'en') return 'Barley';
      return isMoulu ? 'Orge moulu' : 'Orge';
    }
    // Tournesol
    if (id === 'feed-tournesol' || lower.includes('tournesol') || name.includes('عباد') || name.includes('قلوب')) {
      if (lang === 'ar') return 'قلوب';
      if (lang === 'en') return 'Sunflower';
      return 'Tournesol';
    }
    // Mélange
    if (id === 'feed-melange' || lower.includes('mélange') || lower.includes('melange') || name.includes('خلطة')) {
      if (lang === 'ar') return 'خلطة';
      if (lang === 'en') return 'Mix';
      return 'Mélange';
    }
    // Soja
    if (id === 'feed-soja' || lower.includes('soja') || name.includes('صويا')) {
      if (lang === 'ar') return 'صويا';
      if (lang === 'en') return 'Soy';
      return 'Soja';
    }
    // Concentré
    if (id === 'feed-concentre' || lower.includes('concentré') || lower.includes('concentre') || name.includes('مركز')) {
      if (lang === 'ar') return 'مركز';
      if (lang === 'en') return 'Conc.';
      return 'Concentré';
    }
    // Croissance
    if (id === 'feed-croissance' || lower.includes('croissance') || lower.includes('engraissement') || name.includes('تسمين')) {
      if (lang === 'ar') return 'تسمين';
      if (lang === 'en') return 'Grower';
      return 'Croissance';
    }
    return name.split(' ')[0] || name;
  },

  sanitizeFeedTypes(feedTypes) {
    if (!Array.isArray(feedTypes)) return [];
    let list = feedTypes.map(ft => {
      let name = ft.name || '';
      // Strip any "بليه" or "/ بليه"
      name = name.replace(/[\/\s]*بليه[\/\s]*/g, ' ').replace(/\s+/g, ' ').trim();
      // Strip any "Bouchon", "(Bouchon)", "بوشون"
      name = name.replace(/[\/\s]*\b(bouchon)\b[\/\s]*/gi, ' ')
                 .replace(/[\/\s]*بوشون[\/\s]*/g, ' ')
                 .replace(/\(\s*\)/g, '')
                 .replace(/\s+/g, ' ')
                 .trim();
      if (!name || name === 'قمح /' || name === 'Blé /') {
        name = 'Blé';
      }

      const family = this.detectFeedTypeFromText(name) || this.detectFeedTypeFromText(ft.id) || 'general';
      const texture = ft.texture || (family === 'mais' || family === 'son' ? 'moulu' : 'grain');
      const kgPerCan = Number(ft.kgPerCan) > 0 ? Number(ft.kgPerCan) : this.getFeedDefaultDensity(family, texture);

      return {
        ...ft,
        id: ft.id || 'feed-' + Math.random().toString(36).substr(2, 9),
        name: name,
        stockKg: Math.max(0, Number(ft.stockKg) || 0),
        pricePerKg: Math.max(0, Number(ft.pricePerKg) || 0),
        texture: texture,
        kgPerCan: kgPerCan,
        manuallyAdjusted: ft.manuallyAdjusted !== undefined ? ft.manuallyAdjusted : true,
        updatedAt: ft.updatedAt || Date.now()
      };
    });

    // Eradicate any synthetic feed-principal
    list = list.filter(ft => 
      ft.id !== 'feed-principal' &&
      !(ft.name || '').toLowerCase().includes('principal') &&
      !(ft.name || '').includes('علف رئيسي')
    );

    // Auto-reconcile stock if global feedStockKg exists but feedTypes have 0 kg
    const globalStock = Number(appState.feedStockKg) || 0;
    const currentTotalStock = list.reduce((sum, ft) => sum + (Number(ft.stockKg) || 0), 0);
    if (globalStock > 0 && currentTotalStock === 0 && list.length > 0) {
      const perFeed = Math.round((globalStock / list.length) * 10) / 10;
      let runningTotal = 0;
      list.forEach((f, idx) => {
        if (idx === list.length - 1) {
          f.stockKg = Math.max(0, Math.round((globalStock - runningTotal) * 10) / 10);
        } else {
          f.stockKg = perFeed;
          runningTotal += perFeed;
        }
      });
    }

    return list;
  },

  detectFeedTypeFromText(text) {
    if (!text) return null;
    const t = String(text).toLowerCase();
    if (t.includes('bouchon') || t.includes('ponte') || t.includes('بوشون') || t.includes('بياض')) return 'bouchon';
    if (t.includes('blé') || t.includes('ble') || t.includes('قمح') || t.includes('بليه')) return 'ble';
    if (t.includes('maïs') || t.includes('mais') || t.includes('ذرة') || t.includes('ذرَة')) return 'mais';
    if (t.includes('son') || t.includes('نخالة') || t.includes('sedari') || t.includes('سداري')) return 'son';
    if (t.includes('démarrage') || t.includes('demarrage') || t.includes('بداية') || t.includes('starter')) return 'demarrage';
    if (t.includes('feverole') || t.includes('féverole') || t.includes('فول')) return 'feverole';
    if (t.includes('orge') || t.includes('شعير') || t.includes('barley')) return 'orge';
    if (t.includes('tournesol') || t.includes('عباد') || t.includes('قلوب') || t.includes('sunflower')) return 'tournesol';
    if (t.includes('mélange') || t.includes('melange') || t.includes('خلطة') || t.includes('mixture')) return 'melange';
    if (t.includes('soja') || t.includes('صويا') || t.includes('soy')) return 'soja';
    if (t.includes('concentré') || t.includes('concentre') || t.includes('مركز') || t.includes('cmv')) return 'concentre';
    if (t.includes('croissance') || t.includes('engraissement') || t.includes('تسمين') || t.includes('نمو') || t.includes('grower')) return 'croissance';
    return null;
  },

  isFeedInFamily(ft, family) {
    if (!ft || !family) return false;
    const id = String(ft.id || '').toLowerCase();
    const name = String(ft.name || '').toLowerCase();
    if (family === 'bouchon') return id === 'feed-bouchon' || name.includes('bouchon') || name.includes('ponte') || name.includes('بوشون') || name.includes('بياض');
    if (family === 'ble') return id === 'feed-ble' || name.includes('blé') || name.includes('ble') || name.includes('قمح') || name.includes('بليه');
    if (family === 'mais') return id === 'feed-mais' || name.includes('maïs') || name.includes('mais') || name.includes('ذرة');
    if (family === 'son') return id === 'feed-son' || name.includes('son') || name.includes('نخالة') || name.includes('sedari');
    if (family === 'demarrage') return id === 'feed-demarrage' || name.includes('démarrage') || name.includes('demarrage') || name.includes('بداية') || name.includes('starter');
    if (family === 'feverole') return id === 'feed-feverole' || name.includes('feverole') || name.includes('féverole') || name.includes('فول');
    if (family === 'orge') return id === 'feed-orge' || name.includes('orge') || name.includes('شعير');
    if (family === 'tournesol') return id === 'feed-tournesol' || name.includes('tournesol') || name.includes('عباد') || name.includes('قلوب');
    if (family === 'melange') return id === 'feed-melange' || name.includes('mélange') || name.includes('melange') || name.includes('خلطة');
    if (family === 'soja') return id === 'feed-soja' || name.includes('soja') || name.includes('صويا');
    if (family === 'concentre') return id === 'feed-concentre' || name.includes('concentré') || name.includes('concentre') || name.includes('مركز') || name.includes('cmv');
    if (family === 'croissance') return id === 'feed-croissance' || name.includes('croissance') || name.includes('engraissement') || name.includes('تسمين') || name.includes('نمو');
    return false;
  },

  getFeedDefaultDensity(family, texture = 'grain') {
    const isMoulu = texture === 'moulu';
    switch (family) {
      case 'ble': // Blé / قمح
        return isMoulu ? 0.58 : 0.72; // كعب ~0.72 kg, مرحي ~0.58 kg
      case 'mais': // Maïs / ذرة
        return isMoulu ? 0.60 : 0.68; // كعب ~0.68 kg, مرحي ~0.60 kg
      case 'bouchon': // Aliment ponte / بوشون
        return isMoulu ? 0.52 : 0.65; // كعب ~0.65 kg, مرحي ~0.52 kg
      case 'son': // Son de blé / نخالة
        return 0.35; // Léger volumineux
      case 'demarrage': // Démarrage / بداية
        return isMoulu ? 0.50 : 0.65; // كعب ~0.65 kg, مرحي ~0.50 kg
      case 'orge': // Orge / شعير
        return isMoulu ? 0.48 : 0.60; // كعب ~0.60 kg, مرحي ~0.48 kg
      case 'feverole': // Féverole / فول
        return isMoulu ? 0.62 : 0.75; // كعب ~0.75 kg, مرحي ~0.62 kg
      case 'tournesol': // Tournesol / قلوب
        return 0.45;
      case 'melange': // Mélange graines / خلطة
        return isMoulu ? 0.55 : 0.68;
      case 'soja': // Tourteau de soja / صويا
        return 0.58;
      case 'concentre': // Concentré / مركز
        return 0.65;
      case 'croissance': // Aliment croissance / تسمين
        return isMoulu ? 0.52 : 0.65;
      default:
        return isMoulu ? 0.55 : 0.70;
    }
  },

  getFeedKgPerCan(ft) {
    if (!ft) return 0.667;
    if (ft && Number(ft.kgPerCan) > 0) {
      return Number(ft.kgPerCan);
    }
    const family = this.detectFeedTypeFromText(ft.name) || this.detectFeedTypeFromText(ft.id) || 'general';
    const texture = ft.texture || (family === 'mais' || family === 'son' ? 'moulu' : 'grain');
    return this.getFeedDefaultDensity(family, texture);
  },

  setFeedTypeTexture(feedId, texture) {
    const ft = (appState.feedTypes || []).find(f => f.id === feedId);
    if (!ft) return;

    const normalizedTexture = texture === 'moulu' ? 'moulu' : 'grain';
    ft.texture = normalizedTexture;
    const family = this.detectFeedTypeFromText(ft.name) || this.detectFeedTypeFromText(ft.id) || 'general';
    ft.kgPerCan = this.getFeedDefaultDensity(family, normalizedTexture);
    ft.manuallyAdjusted = true;
    ft.updatedAt = Date.now();
    this.saveState();

    const isGrain = normalizedTexture === 'grain';
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const bteLabel = isAr ? 'علبة' : (isEn ? 'can' : 'boîte');
    const kgPerCan = this.getFeedKgPerCan(ft);

    // Mettre à jour immédiatement les boutons et l'équivalence dans le modal Distribution
    const dBtnGrain = document.getElementById(`distribTextureBtnGrain_${feedId}`);
    const dBtnMoulu = document.getElementById(`distribTextureBtnMoulu_${feedId}`);
    const dDensity = document.getElementById(`distribDensityBadge_${feedId}`);
    if (dBtnGrain && dBtnMoulu) {
      if (isGrain) {
        dBtnGrain.className = 'btn btn-xs btn-emerald';
        dBtnGrain.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        dBtnGrain.style.color = '#ffffff';
        dBtnGrain.style.fontWeight = '800';
        dBtnGrain.style.border = '1px solid #10b981';

        dBtnMoulu.className = 'btn btn-xs btn-outline';
        dBtnMoulu.style.background = 'transparent';
        dBtnMoulu.style.color = 'var(--text-main)';
        dBtnMoulu.style.fontWeight = '600';
        dBtnMoulu.style.border = '1px solid var(--border-color)';
      } else {
        dBtnGrain.className = 'btn btn-xs btn-outline';
        dBtnGrain.style.background = 'transparent';
        dBtnGrain.style.color = 'var(--text-main)';
        dBtnGrain.style.fontWeight = '600';
        dBtnGrain.style.border = '1px solid var(--border-color)';

        dBtnMoulu.className = 'btn btn-xs btn-emerald';
        dBtnMoulu.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        dBtnMoulu.style.color = '#ffffff';
        dBtnMoulu.style.fontWeight = '800';
        dBtnMoulu.style.border = '1px solid #10b981';
      }
    }
    if (dDensity) {
      dDensity.innerHTML = `🥫 1 ${bteLabel} ≈ <strong>${kgPerCan.toFixed(2)} ${unitKg}</strong>`;
    }

    // Mettre à jour immédiatement les boutons et l'équivalence dans le modal Stock
    const sBtnGrain = document.getElementById(`stockTextureBtnGrain_${feedId}`);
    const sBtnMoulu = document.getElementById(`stockTextureBtnMoulu_${feedId}`);
    const sDensity = document.getElementById(`stockDensityBadge_${feedId}`);
    if (sBtnGrain && sBtnMoulu) {
      if (isGrain) {
        sBtnGrain.className = 'btn btn-xs btn-emerald';
        sBtnGrain.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        sBtnGrain.style.color = '#ffffff';
        sBtnGrain.style.fontWeight = '800';
        sBtnGrain.style.border = '1px solid #10b981';

        sBtnMoulu.className = 'btn btn-xs btn-outline';
        sBtnMoulu.style.background = 'transparent';
        sBtnMoulu.style.color = 'var(--text-main)';
        sBtnMoulu.style.fontWeight = '600';
        sBtnMoulu.style.border = '1px solid var(--border-color)';
      } else {
        sBtnGrain.className = 'btn btn-xs btn-outline';
        sBtnGrain.style.background = 'transparent';
        sBtnGrain.style.color = 'var(--text-main)';
        sBtnGrain.style.fontWeight = '600';
        sBtnGrain.style.border = '1px solid var(--border-color)';

        sBtnMoulu.className = 'btn btn-xs btn-emerald';
        sBtnMoulu.style.background = 'linear-gradient(135deg, #059669, #10b981)';
        sBtnMoulu.style.color = '#ffffff';
        sBtnMoulu.style.fontWeight = '800';
        sBtnMoulu.style.border = '1px solid #10b981';
      }
    }
    if (sDensity) {
      sDensity.innerHTML = `🥫 1 ${isAr ? 'علبة' : 'bte'} ≈ <strong>${kgPerCan.toFixed(2)} ${unitKg}</strong>`;
    }

    // Si des boîtes sont sélectionnées, recalculer le poids kg avec la nouvelle densité
    const activeBtn = document.querySelector(`.sicam-btn-${feedId}.active-sicam-btn`);
    if (activeBtn) {
      const cans = parseFloat(activeBtn.getAttribute('data-cans'));
      if (!isNaN(cans) && cans > 0) {
        this.setFeedTypeDistribSicam(feedId, cans);
        return;
      }
    }
    this.recalcDistribTotal();
  },

  selectNewFeedTexture(texture) {
    const grainRadio = document.querySelector('input[name="newFeedTexture"][value="grain"]');
    const mouluRadio = document.querySelector('input[name="newFeedTexture"][value="moulu"]');
    if (texture === 'moulu') {
      if (grainRadio) grainRadio.checked = false;
      if (mouluRadio) mouluRadio.checked = true;
    } else {
      if (grainRadio) grainRadio.checked = true;
      if (mouluRadio) mouluRadio.checked = false;
    }
    this.onNewFeedTextureChange();
  },

  onNewFeedTextureChange() {
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const mouluRadio = document.querySelector('input[name="newFeedTexture"][value="moulu"]');
    const isMoulu = mouluRadio ? mouluRadio.checked : false;
    const isGrain = !isMoulu;
    const texture = isGrain ? 'grain' : 'moulu';

    // Style des boutons radio
    const lblGrain = document.getElementById('lblNewFeedTextureGrain');
    const lblMoulu = document.getElementById('lblNewFeedTextureMoulu');
    if (lblGrain && lblMoulu) {
      if (isGrain) {
        lblGrain.style.border = '2px solid var(--accent-emerald)';
        lblGrain.style.background = 'rgba(16, 185, 129, 0.12)';
        lblMoulu.style.border = '1.5px solid var(--border-subtle)';
        lblMoulu.style.background = 'var(--bg-card)';
      } else {
        lblGrain.style.border = '1.5px solid var(--border-subtle)';
        lblGrain.style.background = 'var(--bg-card)';
        lblMoulu.style.border = '2px solid var(--accent-emerald)';
        lblMoulu.style.background = 'rgba(16, 185, 129, 0.12)';
      }
    }

    const name = document.getElementById('newFeedTypeName')?.value || '';
    const family = this.detectFeedTypeFromText(name) || 'general';
    const density = this.getFeedDefaultDensity(family, texture);

    const kgPerCanInput = document.getElementById('newFeedKgPerCan');
    if (kgPerCanInput) {
      kgPerCanInput.value = density.toFixed(2);
    }

    const hint = document.getElementById('newFeedDensityHint');
    if (hint) {
      const texStr = isGrain 
        ? (isAr ? 'حبوب كاملة / كعب' : (isEn ? 'Whole grain' : 'Grain entier (كعب)'))
        : (isAr ? 'مطحون / مرحي' : (isEn ? 'Ground / Milled' : 'Moulu / Concassé (مرحي)'));
      hint.textContent = `🥫 1 boîte Sicam ≈ ${density.toFixed(2)} kg (${texStr})`;
    }
  },

  onNewFeedNameInput() {
    this.onNewFeedTextureChange();
  },

  createDefaultFeedForFamily(family, pricePerKg = 0) {
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const numPrice = Math.max(0, Number(pricePerKg) || 0);
    if (family === 'bouchon') {
      return {
        id: 'feed-bouchon',
        name: isAr ? 'علف بياضة' : (isEn ? 'Layer Feed' : 'Aliment ponte'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'grain',
        kgPerCan: 0.65
      };
    }
    if (family === 'ble') {
      return {
        id: 'feed-ble',
        name: isAr ? 'قمح' : (isEn ? 'Wheat' : 'Blé'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'grain',
        kgPerCan: 0.72
      };
    }
    if (family === 'mais') {
      return {
        id: 'feed-mais',
        name: isAr ? 'ذرة مرحية' : (isEn ? 'Cracked Corn' : 'Maïs concassé'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'moulu',
        kgPerCan: 0.60
      };
    }
    if (family === 'son') {
      return {
        id: 'feed-son',
        name: isAr ? 'نخالة القمح' : (isEn ? 'Wheat Bran' : 'Son de blé'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'moulu',
        kgPerCan: 0.35
      };
    }
    if (family === 'demarrage') {
      return {
        id: 'feed-demarrage',
        name: isAr ? 'علف بداية' : (isEn ? 'Starter Feed' : 'Aliment démarrage'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'grain',
        kgPerCan: 0.65
      };
    }
    if (family === 'feverole') {
      return {
        id: 'feed-feverole',
        name: isAr ? 'فول كعب' : (isEn ? 'Faba Beans' : 'Féverole'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'grain',
        kgPerCan: 0.75
      };
    }
    if (family === 'orge') {
      return {
        id: 'feed-orge',
        name: isAr ? 'شعير' : (isEn ? 'Barley' : 'Orge'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'grain',
        kgPerCan: 0.60
      };
    }
    if (family === 'tournesol') {
      return {
        id: 'feed-tournesol',
        name: isAr ? 'قلوب عباد الشمس' : (isEn ? 'Sunflower Seeds' : 'Tournesol'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'grain',
        kgPerCan: 0.45
      };
    }
    if (family === 'melange') {
      return {
        id: 'feed-melange',
        name: isAr ? 'خلطة حبوب' : (isEn ? 'Grain Mixture' : 'Mélange graines'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'grain',
        kgPerCan: 0.68
      };
    }
    if (family === 'soja') {
      return {
        id: 'feed-soja',
        name: isAr ? 'صويا مرحية' : (isEn ? 'Soybean Meal' : 'Soja'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'moulu',
        kgPerCan: 0.58
      };
    }
    if (family === 'concentre') {
      return {
        id: 'feed-concentre',
        name: isAr ? 'علف مركز (CMV)' : (isEn ? 'Feed Concentrate' : 'Concentré (CMV)'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'moulu',
        kgPerCan: 0.65
      };
    }
    if (family === 'croissance') {
      return {
        id: 'feed-croissance',
        name: isAr ? 'علف نمو وتسمين' : (isEn ? 'Grower / Finisher Feed' : 'Aliment croissance'),
        stockKg: 0,
        pricePerKg: numPrice,
        texture: 'grain',
        kgPerCan: 0.65
      };
    }
    return {
      id: 'feed-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4),
      name: isAr ? 'علف جديد' : (isEn ? 'New Feed' : 'Nouvel aliment'),
      stockKg: 0,
      pricePerKg: numPrice,
      texture: 'grain',
      kgPerCan: 0.70
    };
  },

  reconcileFeedTypesFromExpenses() {
    if (!Array.isArray(appState.expenses)) return;
    appState.feedTypes = this.sanitizeFeedTypes(appState.feedTypes);

    const foodExpenses = appState.expenses.filter(e => e.category === 'nourriture' && !e.feedStockDetached);
    if (foodExpenses.length === 0) return;

    let changed = false;
    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';

    // 1. S'assurer que chaque dépense de nourriture a sa quantité en kg calculée (feedStockAddedKg)
    foodExpenses.forEach(exp => {
      let addedKg = Number(exp.feedStockAddedKg) || 0;
      if (addedKg <= 0) {
        const titleLower = (exp.title || '').toLowerCase();
        let q = Number(exp.quantity) || 1;
        if (titleLower.includes('50kg') || (titleLower.includes('sac') && !titleLower.includes('25kg'))) {
          addedKg = q * 50;
        } else if (titleLower.includes('25kg')) {
          addedKg = q * 25;
        } else if (titleLower.includes('10kg')) {
          addedKg = q * 10;
        } else if (Number(exp.unitPrice) >= 15 && q > 0) {
          // Prix unitaire >= 15 DT correspond à des sacs de 50kg en Tunisie (~40-60 DT)
          addedKg = q * 50;
        } else if (q > 0) {
          addedKg = q;
        }
        if (addedKg <= 0 && exp.total > 0) {
          addedKg = exp.unitPrice > 0 ? (exp.total / exp.unitPrice) : Math.round(exp.total);
        }
        if (addedKg > 0) {
          exp.feedStockAddedKg = addedKg;
          changed = true;
        }
      }
    });

    // 2. Détecter l'identité de chaque dépense et délier celles qui avaient été rattachées par erreur au mauvais aliment
    foodExpenses.forEach(exp => {
      const family = this.detectFeedTypeFromText(exp.title);
      if (exp.feedTypeId) {
        const linkedFt = (appState.feedTypes || []).find(f => f.id === exp.feedTypeId);
        if (linkedFt) {
          const linkedFamily = this.detectFeedTypeFromText(linkedFt.name) || this.detectFeedTypeFromText(linkedFt.id);
          if (family && linkedFamily && family !== linkedFamily) {
            delete exp.feedTypeId;
            changed = true;
          }
        }
      }
    });

    // 3. Grouper les dépenses par identité d'aliment distincte
    const feedGroups = {};
    foodExpenses.forEach(exp => {
      const family = this.detectFeedTypeFromText(exp.title);

      const cleanTitle = (exp.title || '')
        .replace(/^(achat|شراء|buy|purchase|feed|aliment)\s*[:\-]?\s*/i, '')
        .replace(/[\/\s]*بليه[\/\s]*/g, ' ')
        .replace(/[\/\s]*\b(bouchon)\b[\/\s]*/gi, ' ')
        .replace(/[\/\s]*بوشون[\/\s]*/g, ' ')
        .replace(/\(\d+.*?\)/g, '')
        .trim();

      let groupKey = '';
      if (exp.feedTypeId && (appState.feedTypes || []).some(f => f.id === exp.feedTypeId)) {
        groupKey = `id_${exp.feedTypeId}`;
      } else if (family) {
        groupKey = `family_${family}`;
      } else if (cleanTitle) {
        groupKey = `title_${cleanTitle.toLowerCase()}`;
      } else {
        groupKey = `exp_${exp.id}`;
      }

      if (!feedGroups[groupKey]) {
        feedGroups[groupKey] = {
          family,
          cleanTitle: cleanTitle || (isAr ? 'علف' : (isEn ? 'Feed' : 'Aliment')),
          feedTypeId: exp.feedTypeId,
          totalAddedKg: 0,
          totalCost: 0,
          expenses: []
        };
      }
      const addedKg = Number(exp.feedStockAddedKg) || 0;
      const cost = Number(exp.total) || 0;
      feedGroups[groupKey].totalAddedKg += addedKg;
      feedGroups[groupKey].totalCost += cost;
      feedGroups[groupKey].expenses.push(exp);
    });

    // 4. Synchroniser chaque groupe avec appState.feedTypes
    Object.values(feedGroups).forEach(group => {
      let ft = null;
      if (group.feedTypeId) {
        ft = (appState.feedTypes || []).find(f => f.id === group.feedTypeId);
      }
      if (!ft && group.family) {
        ft = (appState.feedTypes || []).find(f => this.isFeedInFamily(f, group.family));
      }
      if (!ft && group.cleanTitle) {
        ft = (appState.feedTypes || []).find(f => {
          const fn = (f.name || '').toLowerCase();
          const ct = group.cleanTitle.toLowerCase();
          return fn === ct || fn.includes(ct) || ct.includes(fn);
        });
      }

      const unitPrice = group.totalAddedKg > 0 ? parseFloat((group.totalCost / group.totalAddedKg).toFixed(3)) : 0;

      if (!ft) {
        let initialStock = Math.max(0, parseFloat(group.totalAddedKg.toFixed(2)));

        if (group.family) {
          ft = this.createDefaultFeedForFamily(group.family, unitPrice);
        } else {
          ft = {
            id: group.feedTypeId || ('feed-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4)),
            name: group.cleanTitle,
            stockKg: initialStock,
            pricePerKg: unitPrice,
            texture: 'grain',
            kgPerCan: 0.70
          };
        }
        ft.stockKg = initialStock;
        ft.manuallyAdjusted = false;
        ft.updatedAt = Date.now();
        appState.feedTypes.push(ft);
        changed = true;
      } else {
        if (unitPrice > 0 && (!ft.pricePerKg || Number(ft.pricePerKg) === 0)) {
          ft.pricePerKg = unitPrice;
          changed = true;
        }
      }

      // Associer le feedTypeId officiel à toutes les dépenses du groupe
      group.expenses.forEach(e => {
        if (e.feedTypeId !== ft.id) {
          e.feedTypeId = ft.id;
          changed = true;
        }
      });
    });

    // Mettre à jour appState.feedStockKg pour qu'il soit TOUJOURS la somme exacte des stocks vivants
    if (Array.isArray(appState.feedTypes) && appState.feedTypes.length > 0) {
      appState.feedStockKg = parseFloat(appState.feedTypes.reduce((sum, f) => sum + (Number(f.stockKg) || 0), 0).toFixed(2));
    } else {
      appState.feedStockKg = 0;
    }

    if (changed) {
      this.saveState();
    }
  },

  renderSmartFeedPresets() {
    const container = document.getElementById('feedSmartPresetsContainer');
    if (!container) return;

    const declaredFeeds = (appState.feedTypes || []).filter(ft => (Number(ft.stockKg) || 0) > 0);
    if (declaredFeeds.length === 0) {
      container.innerHTML = '';
      return;
    }

    const hasHistory = Array.isArray(appState.feedDistributions) && appState.feedDistributions.length > 0;
    const favorite = appState.savedFavoriteFeedRoutine;
    const routine = favorite || (hasHistory ? appState.feedDistributions[0] : null);

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const bteLabel = isAr ? 'علبة' : (isEn ? 'can' : 'boîte');
    const btesLabel = isAr ? 'علب' : (isEn ? 'cans' : 'boîtes');

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

    let presetsGridHtml = '';

    if (declaredFeeds.length === 1) {
      // 1 seul aliment en stock (ex: uniquement Blé) -> raccourcis 100% dédiés à cet aliment sans aucun autre aliment mentionné !
      const f = declaredFeeds[0];
      const name = this.getFeedShortName(f);
      const kgPerCan = this.getFeedKgPerCan(f);

      presetsGridHtml = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.4rem; margin-bottom: 0.4rem;">
          <button type="button" class="btn btn-outline btn-preset-combo" onclick="app.setSingleFeedDistribCans('${f.id}', 1.0)">
            <div style="font-weight: 800; font-size: 0.8rem; color: var(--accent-emerald);">🌾 1 ${bteLabel} ${name}</div>
            <div style="font-size: 0.67rem; color: var(--text-muted);">~${kgPerCan.toFixed(2)} ${unitKg}</div>
          </button>
          <button type="button" class="btn btn-outline btn-preset-combo" onclick="app.setSingleFeedDistribCans('${f.id}', 2.0)">
            <div style="font-weight: 800; font-size: 0.8rem; color: var(--accent-amber);">🌾 2 ${btesLabel} ${name}</div>
            <div style="font-size: 0.67rem; color: var(--text-muted);">~${(kgPerCan * 2).toFixed(2)} ${unitKg}</div>
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35rem;">
          <button type="button" class="btn btn-outline" style="padding: 0.38rem 0.2rem; font-size: 0.72rem; font-weight: 700;" onclick="app.setSingleFeedDistribCans('${f.id}', 0.5)">
            0.5 ${bteLabel}
          </button>
          <button type="button" class="btn btn-outline" style="padding: 0.38rem 0.2rem; font-size: 0.72rem; font-weight: 700;" onclick="app.setSingleFeedDistribCans('${f.id}', 1.5)">
            1.5 ${bteLabel}
          </button>
          <button type="button" class="btn btn-outline btn-emerald" style="padding: 0.38rem 0.2rem; font-size: 0.72rem; font-weight: 800;" onclick="app.applyDistribPreset('clear')">
            ${this.t('feed_smart_clear')}
          </button>
        </div>
      `;
    } else {
      // 2 ou plusieurs aliments déclarés en stock (ex: Blé + Bouchon, ou Blé + Maïs)
      const feedA = declaredFeeds[0];
      const feedB = declaredFeeds[1];
      const nameA = this.getFeedShortName(feedA);
      const nameB = this.getFeedShortName(feedB);
      const kgPerCanA = this.getFeedKgPerCan(feedA);
      const kgPerCanB = this.getFeedKgPerCan(feedB);
      const comboTwoKg = (kgPerCanA + kgPerCanB).toFixed(2);
      const comboOneAndHalfKg = (kgPerCanA + kgPerCanB * 0.5).toFixed(2);

      presetsGridHtml = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.4rem; margin-bottom: 0.4rem;">
          <button type="button" class="btn btn-outline btn-preset-combo" onclick="app.setTwoFeedsDistribCans('${feedA.id}', 1.0, '${feedB.id}', 1.0)">
            <div style="font-weight: 800; font-size: 0.8rem; color: var(--accent-emerald);">1 ${nameA} + 1 ${nameB}</div>
            <div style="font-size: 0.67rem; color: var(--text-muted);">2 ${btesLabel} (~${comboTwoKg} ${unitKg})</div>
          </button>
          <button type="button" class="btn btn-outline btn-preset-combo" onclick="app.setTwoFeedsDistribCans('${feedA.id}', 1.0, '${feedB.id}', 0.5)">
            <div style="font-weight: 800; font-size: 0.8rem; color: var(--accent-amber);">1 ${nameA} + 0.5 ${nameB}</div>
            <div style="font-size: 0.67rem; color: var(--text-muted);">1.5 ${bteLabel} (~${comboOneAndHalfKg} ${unitKg})</div>
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.35rem;">
          <button type="button" class="btn btn-outline" style="padding: 0.38rem 0.2rem; font-size: 0.72rem; font-weight: 700;" onclick="app.setSingleFeedDistribCans('${feedA.id}', 1.0)">
            1 ${bteLabel} ${nameA}
          </button>
          <button type="button" class="btn btn-outline" style="padding: 0.38rem 0.2rem; font-size: 0.72rem; font-weight: 700;" onclick="app.setSingleFeedDistribCans('${feedB.id}', 1.0)">
            1 ${bteLabel} ${nameB}
          </button>
          <button type="button" class="btn btn-outline btn-emerald" style="padding: 0.38rem 0.2rem; font-size: 0.72rem; font-weight: 800;" onclick="app.applyDistribPreset('clear')">
            ${this.t('feed_smart_clear')}
          </button>
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
      ${presetsGridHtml}

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

  setSingleFeedDistribCans(feedId, cans) {
    (appState.feedTypes || []).forEach(ft => {
      this.setFeedTypeDistribSicam(ft.id, ft.id === feedId ? cans : 0);
    });
  },

  setTwoFeedsDistribCans(feedAId, cansA, feedBId, cansB) {
    (appState.feedTypes || []).forEach(ft => {
      if (ft.id === feedAId) this.setFeedTypeDistribSicam(ft.id, cansA);
      else if (ft.id === feedBId) this.setFeedTypeDistribSicam(ft.id, cansB);
      else this.setFeedTypeDistribSicam(ft.id, 0);
    });
  },

  applyLearnedRoutine(mode) {
    const routine = appState.savedFavoriteFeedRoutine || (appState.feedDistributions && appState.feedDistributions[0]);
    if (!routine || !Array.isArray(routine.items)) {
      const declaredFeeds = (appState.feedTypes || []).filter(ft => (Number(ft.stockKg) || 0) > 0);
      if (declaredFeeds.length > 0) {
        this.setSingleFeedDistribCans(declaredFeeds[0].id, 1.0);
      }
      return;
    }

    const ratio = mode === 'half' ? 0.5 : 1.0;

    // Réinitialiser les champs à zéro d'abord
    (appState.feedTypes || []).forEach(ft => {
      this.setFeedTypeDistribSicam(ft.id, 0);
    });

    // Remplir chaque aliment selon la routine mémorisée
    routine.items.forEach(it => {
      const feed = (appState.feedTypes || []).find(ft => ft.id === it.feedTypeId || ft.name === it.name || (it.name && ft.name && ft.name.toLowerCase().includes(it.name.toLowerCase())));
      const kgPerCan = feed ? this.getFeedKgPerCan(feed) : (it.kgPerCan || 0.667);
      const cans = it.cans !== undefined ? Number(it.cans) * ratio : (Number(it.kg) * ratio) / kgPerCan;
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
        const kgPerCan = this.getFeedKgPerCan(ft);
        const cans = parseFloat((kg / kgPerCan).toFixed(1));
        items.push({ feedTypeId: ft.id, name: ft.name, texture: ft.texture || 'grain', kgPerCan: kgPerCan, kg: parseFloat(kg.toFixed(2)), cans });
        totalKg += kg;
      }
    });

    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';

    if (totalKg <= 0) {
      this.showToast(isAr ? 'يرجى تحديد الكميات الموزعة قبل الحفظ.' : (isEn ? 'Please specify distributed quantities before saving.' : 'Veuillez indiquer les quantités distribuées avant de mémoriser.'), 'warning');
      return;
    }

    appState.savedFavoriteFeedRoutine = {
      totalKg: parseFloat(totalKg.toFixed(2)),
      items
    };
    this.saveState();
    this.renderSmartFeedPresets();
    this.showToast(isAr 
      ? `⭐ تم حفظ الروتين المفضل : ${totalKg.toFixed(2)} كغ/يوم !` 
      : (isEn ? `⭐ Favorite routine saved: ${totalKg.toFixed(2)} kg/day!` : `⭐ Routine favorite mémorisée : ${totalKg.toFixed(2)} kg/j !`));
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

  setFeedDistribMode(mode = 'total') {
    const hidden = document.getElementById('feedDistribMode');
    const btnTotal = document.getElementById('distribModeBtn_total');
    const btnLot = document.getElementById('distribModeBtn_lot');
    const lotGroup = document.getElementById('distribTargetLotGroup');
    const hint = document.getElementById('distribModeHint');

    if (hidden) hidden.value = mode;

    if (mode === 'lot') {
      if (btnTotal) { btnTotal.className = 'btn btn-sm btn-outline bold'; }
      if (btnLot) { btnLot.className = 'btn btn-sm btn-primary bold'; }
      if (lotGroup) lotGroup.classList.remove('hidden');
      if (hint) {
        hint.setAttribute('data-i18n', 'distrib_mode_lot_hint');
        hint.textContent = this.t('distrib_mode_lot_hint') || 'Attribué à 100% au lot sélectionné et divisé par son nombre de têtes';
        hint.style.color = 'var(--accent-amber)';
      }
    } else {
      if (btnTotal) { btnTotal.className = 'btn btn-sm btn-primary bold'; }
      if (btnLot) { btnLot.className = 'btn btn-sm btn-outline bold'; }
      if (lotGroup) lotGroup.classList.add('hidden');
      if (hint) {
        hint.setAttribute('data-i18n', 'distrib_mode_total_hint');
        hint.textContent = this.t('distrib_mode_total_hint') || 'Répartition calculée selon les coefficients de chaque animal (vaches, moutons...)';
        hint.style.color = 'var(--accent-emerald)';
      }
    }
  },

  renderFeedDistributionModal() {
    appState.feedTypes = this.sanitizeFeedTypes(appState.feedTypes);

    // Initialiser les options de lots pour le mode "Distribution par Lot"
    const targetLotSelect = document.getElementById('distribTargetLotId');
    if (targetLotSelect) {
      const activeLots = (appState.animals || []).filter(a => (Number(a.currentQuantity) || 0) > 0);
      if (activeLots.length > 0) {
        const curLotVal = targetLotSelect.value;
        targetLotSelect.innerHTML = activeLots.map(a => {
          const icon = this.getSpeciesIcon(a.species);
          const name = this.getAnimalDisplayName(a);
          const headsLabel = (appState.lang === 'ar') ? 'رأس' : 'têtes';
          return `<option value="${a.id}">${icon} ${name} (${a.currentQuantity} ${headsLabel})</option>`;
        }).join('');
        if (curLotVal && activeLots.some(a => a.id === curLotVal)) {
          targetLotSelect.value = curLotVal;
        }
      } else {
        const noLotLabel = (appState.lang === 'ar') ? 'لا توجد دفعات نشطة' : 'Aucun lot actif';
        targetLotSelect.innerHTML = `<option value="">${noLotLabel}</option>`;
      }
    }
    const curMode = document.getElementById('feedDistribMode')?.value || 'total';
    this.setFeedDistribMode(curMode);

    const container = document.getElementById('feedDistribItemsContainer');
    const presetsContainer = document.getElementById('feedSmartPresetsContainer');
    const addAnotherWrapper = document.getElementById('feedDistribAddAnotherWrapper');
    const totalsCard = document.getElementById('feedDistribTotalsCard');
    const submitBtn = document.getElementById('feedDistribSubmitBtn');

    if (!container) return;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const currSym = this.getCurrencySymbol();
    const unitKg = isAr ? 'كغ' : 'kg';
    const inStockPrefix = isAr ? 'في المخزون :' : (isEn ? 'In stock:' : 'En stock :');
    const pricePrefix = isAr ? 'السعر :' : (isEn ? 'Price:' : 'Prix :');
    const bteLabel = isAr ? 'علبة' : (isEn ? 'can' : 'bte');
    const sicamCansLabel = isAr ? 'علبة سيكام' : (isEn ? 'Sicam can(s)' : 'boîte(s) Sicam');

    // S'assurer que les aliments d'élevage existent et sont cohérents avec le stock réserve
    const hasFoodExpenses = (appState.expenses || []).some(e => e.category === 'nourriture' && !e.feedStockDetached);
    if (hasFoodExpenses) {
      this.reconcileFeedTypesFromExpenses();
    }
    if (!Array.isArray(appState.feedTypes) || appState.feedTypes.length === 0) {
      appState.feedTypes = [];
      container.innerHTML = `
        <div style="text-align: center; padding: 1.5rem 1rem; color: var(--text-muted); background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
          <div style="font-size: 1.8rem; margin-bottom: 0.4rem;">🌾</div>
          <div style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.85rem;">
            ${isAr ? 'لا يوجد أي نوع علف مسجل في المخزون للتوزيع.' : (isEn ? 'No feed available in stock for distribution.' : 'Aucun aliment disponible en réserve pour la distribution.')}
          </div>
          <button type="button" class="btn btn-xs btn-primary" onclick="app.closeModal('modalFeedDistribution'); app.openModal('modalAdjustFeedStock');">
            ${isAr ? '📦 ضبط مخزون المستودع' : (isEn ? '📦 Manage Warehouse Stock' : '📦 Gérer le Stock Magasin')}
          </button>
        </div>
      `;
      if (presetsContainer) presetsContainer.innerHTML = '';
      if (addAnotherWrapper) addAnotherWrapper.style.display = 'none';
      if (totalsCard) totalsCard.style.display = 'none';
      if (submitBtn) submitBtn.style.display = 'none';
      return;
    } else {
      const globalStock = Number(appState.feedStockKg) || 0;
      const currentTotal = appState.feedTypes.reduce((s, f) => s + (Number(f.stockKg) || 0), 0);
      if (globalStock > 0 && currentTotal === 0 && appState.feedTypes.length > 0) {
        const perFeed = Math.round((globalStock / appState.feedTypes.length) * 10) / 10;
        let runningTotal = 0;
        appState.feedTypes.forEach((f, idx) => {
          if (idx === appState.feedTypes.length - 1) {
            f.stockKg = Math.max(0, Math.round((globalStock - runningTotal) * 10) / 10);
          } else {
            f.stockKg = perFeed;
            runningTotal += perFeed;
          }
        });
      }
    }

    // Afficher chaque nourriture ajoutée avec son stock propre, son prix et sa quantité à distribuer
    this.renderSmartFeedPresets();
    if (addAnotherWrapper) addAnotherWrapper.style.display = 'block';
    if (totalsCard) totalsCard.style.display = 'flex';
    if (submitBtn) submitBtn.style.display = 'block';

    const prevValues = {};
    (appState.feedTypes || []).forEach(f => {
      const inp = document.getElementById(`distribKg_${f.id}`);
      if (inp && inp.value !== undefined && inp.value !== '') {
        prevValues[f.id] = inp.value;
      }
    });

    let html = '';
    appState.feedTypes.forEach((ft) => {
      const defaultKg = prevValues[ft.id] !== undefined ? prevValues[ft.id] : '0.00';
      const stockKg = Number(ft.stockKg) || 0;
      const priceKg = Number(ft.pricePerKg) || 0;
      const displayName = this.getFeedDisplayName(ft);
      const isGrain = ft.texture !== 'moulu';
      const kgPerCan = this.getFeedKgPerCan(ft);

      html += `
        <div class="feed-distrib-card" style="background: var(--bg-surface); border: 1.5px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.75rem;">
          <!-- Titre & Badges Stock + Prix -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.55rem; flex-wrap: wrap; gap: 0.35rem;">
            <div style="font-weight: 800; font-size: 1rem; color: var(--text-main); display: flex; align-items: center; gap: 0.35rem;">
              <span>🌾</span> <span>${displayName}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
              <span class="badge-pill" style="font-size: 0.72rem; font-weight: 700; color: var(--accent-emerald); background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25);">
                📦 ${inStockPrefix} <strong>${stockKg.toFixed(1)} ${unitKg}</strong>
              </span>
              <span class="badge-pill" style="font-size: 0.72rem; font-weight: 700; color: #f59e0b; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25);">
                💰 ${pricePrefix} <strong>${priceKg.toFixed(3)} ${currSym}/${unitKg}</strong>
              </span>
              <span id="distribCanBadge_${ft.id}" class="badge-pill text-muted" style="font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.55rem; background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                0 ${bteLabel}
              </span>
            </div>
          </div>

          <!-- Choix Texture : كعب vs مرحي (avec poids agronomique de la boîte Sicam) -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.55rem; background: var(--bg-card); padding: 0.35rem 0.55rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <span style="font-size: 0.76rem; font-weight: 700; color: var(--text-secondary);">${this.t('feed_texture_label')}</span>
              <div style="display: inline-flex; gap: 0.25rem;">
                <button type="button" id="distribTextureBtnGrain_${ft.id}" class="btn btn-xs ${isGrain ? 'btn-emerald' : 'btn-outline'}" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; font-weight: ${isGrain ? '800' : '600'}; border-radius: var(--radius-sm);" onclick="app.setFeedTypeTexture('${ft.id}', 'grain')">
                  🌾 ${this.t('feed_texture_grain')}
                </button>
                <button type="button" id="distribTextureBtnMoulu_${ft.id}" class="btn btn-xs ${!isGrain ? 'btn-emerald' : 'btn-outline'}" style="padding: 0.25rem 0.55rem; font-size: 0.75rem; font-weight: ${!isGrain ? '800' : '600'}; border-radius: var(--radius-sm);" onclick="app.setFeedTypeTexture('${ft.id}', 'moulu')">
                  🥣 ${this.t('feed_texture_moulu')}
                </button>
              </div>
            </div>
            <div id="distribDensityBadge_${ft.id}" style="font-size: 0.74rem; color: var(--accent-emerald); font-weight: 700;">
              🥫 1 ${bteLabel} ≈ <strong>${kgPerCan.toFixed(2)} ${unitKg}</strong>
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
            <input type="number" id="distribKg_${ft.id}" class="input-field distrib-kg-input" step="any" min="0" value="${defaultKg}" data-feed-id="${ft.id}" data-price="${priceKg}" style="font-weight: 800; font-size: 1.15rem; color: var(--accent-emerald); max-width: 110px; padding: 0.3rem 0.5rem;" oninput="app.recalcDistribTotal()">
            <span style="font-weight: 800; color: var(--text-main); font-size: 0.95rem;">${unitKg}</span>
            <span id="distribHint_${ft.id}" style="font-size: 0.75rem; color: var(--text-muted); margin-left: auto; font-weight: 600;">
              0 ${bteLabel}
            </span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Pré-sélectionner intelligemment 1 boîte ou la routine favorite si pas de saisie en cours
    const hasExistingInput = Object.values(prevValues).some(v => parseFloat(v) > 0);
    if (hasExistingInput) {
      this.recalcDistribTotal();
    } else if (appState.savedFavoriteFeedRoutine) {
      this.applyLearnedRoutine('repeat');
    } else if (appState.feedTypes.length === 1) {
      this.setFeedTypeDistribSicam(appState.feedTypes[0].id, 1.0);
    } else {
      this.recalcDistribTotal();
    }
  },

  adjustFeedTypeDistribSicamStep(feedId, delta) {
    const ft = (appState.feedTypes || []).find(f => f.id === feedId);
    const kgPerCan = this.getFeedKgPerCan(ft);
    const input = document.getElementById(`distribKg_${feedId}`);
    const rawVal = String(input?.value || '').replace(',', '.');
    const currentKg = parseFloat(rawVal) || 0;
    const currentCans = currentKg / kgPerCan;
    let nextCans = Math.round((currentCans + delta) * 2) / 2;
    if (nextCans < 0) nextCans = 0;
    this.setFeedTypeDistribSicam(feedId, nextCans);
  },

  setFeedTypeDistribSicam(feedId, cans) {
    const ft = (appState.feedTypes || []).find(f => f.id === feedId);
    const kgPerCan = this.getFeedKgPerCan(ft);
    const cansNum = Math.max(0, Number(cans) || 0);
    const kg = (cansNum * kgPerCan).toFixed(2);
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
    if (presetName === 'clear') {
      (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 0));
    } else {
      const declaredFeeds = (appState.feedTypes || []).filter(ft => (Number(ft.stockKg) || 0) > 0);
      const bleFeed = declaredFeeds.find(ft => ft.id === 'feed-ble' || ft.name?.toLowerCase().includes('blé') || ft.name?.toLowerCase().includes('ble') || ft.name?.includes('قمح'));
      const bouchonFeed = declaredFeeds.find(ft => ft.id === 'feed-bouchon' || ft.name?.toLowerCase().includes('bouchon') || ft.name?.toLowerCase().includes('ponte') || ft.name?.includes('بوشون'));

      if (presetName === 'ble_1_bouchon_1' && bleFeed && bouchonFeed) {
        (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 0));
        this.setFeedTypeDistribSicam(bleFeed.id, 1.0);
        this.setFeedTypeDistribSicam(bouchonFeed.id, 1.0);
      } else if (presetName === 'ble_1_bouchon_half' && bleFeed && bouchonFeed) {
        (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 0));
        this.setFeedTypeDistribSicam(bleFeed.id, 1.0);
        this.setFeedTypeDistribSicam(bouchonFeed.id, 0.5);
      } else if (presetName === 'ble_1_only' && bleFeed) {
        (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 0));
        this.setFeedTypeDistribSicam(bleFeed.id, 1.0);
      } else if (presetName === 'bouchon_1_only' && bouchonFeed) {
        (appState.feedTypes || []).forEach(ft => this.setFeedTypeDistribSicam(ft.id, 0));
        this.setFeedTypeDistribSicam(bouchonFeed.id, 1.0);
      } else if (declaredFeeds.length > 0) {
        this.setSingleFeedDistribCans(declaredFeeds[0].id, 1.0);
      }
    }
    this.recalcDistribTotal();
  },

  recalcDistribTotal() {
    let totalKg = 0;
    let totalCost = 0;
    let totalCans = 0;
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const canWord = isAr ? 'علبة' : (isEn ? 'can' : 'boîte');
    const cansWord = isAr ? 'علب' : (isEn ? 'cans' : 'boîtes');

    (appState.feedTypes || []).forEach(ft => {
      const input = document.getElementById(`distribKg_${ft.id}`);
      const rawVal = String(input?.value || '').replace(',', '.');
      const kg = parseFloat(rawVal) || 0;
      const kgPerCan = this.getFeedKgPerCan(ft);
      const cans = Math.round((kg / kgPerCan) * 2) / 2;
      const exactCans = (kg / kgPerCan).toFixed(1);

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
      totalCost += kg * (Number(ft.pricePerKg) || 0);
      totalCans += kg / kgPerCan;
    });

    const totalKgEl = document.getElementById('distribTotalKg');
    const totalCansEl = document.getElementById('distribTotalCans');
    const totalCostEl = document.getElementById('distribTotalCost');

    if (totalKgEl) totalKgEl.textContent = `${totalKg.toFixed(2)} ${unitKg}`;
    if (totalCansEl) totalCansEl.textContent = `${totalCans.toFixed(1)} ${isAr ? 'علبة' : (isEn ? 'can(s)' : 'boîte(s)')}`;
    if (totalCostEl) totalCostEl.textContent = this.formatMoney(totalCost);
  },

  handleSaveFeedDistribution(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const dateInput = document.getElementById('distribDate');
    const date = (dateInput && dateInput.value) ? dateInput.value : this.getTodayStr();
    if (dateInput && !dateInput.value) dateInput.value = date;

    let totalKg = 0;
    let totalCost = 0;
    let totalCans = 0;
    const items = [];

    (appState.feedTypes || []).forEach(ft => {
      const input = document.getElementById(`distribKg_${ft.id}`);
      const rawVal = String(input?.value || '').replace(',', '.');
      const kg = parseFloat(rawVal) || 0;
      if (kg > 0) {
        const kgPerCan = this.getFeedKgPerCan(ft);
        const cans = parseFloat((kg / kgPerCan).toFixed(1));
        const cost = kg * (Number(ft.pricePerKg) || 0);
        totalKg += kg;
        totalCost += cost;
        totalCans += cans;

        items.push({
          feedTypeId: ft.id,
          name: ft.name,
          texture: ft.texture || 'grain',
          kgPerCan: kgPerCan,
          kg: parseFloat(kg.toFixed(2)),
          cans: cans,
          cost: parseFloat(cost.toFixed(3))
        });

        // Déduire du stock de cet aliment spécifique et clôturer le cycle si épuisé
        const prevStock = Number(ft.stockKg) || 0;
        ft.stockKg = Math.max(0, parseFloat((prevStock - kg).toFixed(2)));
        ft.manuallyAdjusted = true;
        ft.updatedAt = Date.now();
        if (ft.stockKg <= 0) {
          ft.stockKg = 0;
          ft.isClosed = true;
          ft.closedDate = date;
        }
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

    const targetMode = document.getElementById('feedDistribMode')?.value || 'total';
    const linkedLotId = (targetMode === 'lot') 
      ? (document.getElementById('distribTargetLotId')?.value || 'all') 
      : 'all';

    const distrib = {
      id: 'distrib-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4),
      date,
      targetMode,
      linkedLotId,
      totalKg: parseFloat(totalKg.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(3)),
      cans: parseFloat(totalCans.toFixed(1)),
      items
    };

    if (!Array.isArray(appState.feedDistributions)) {
      appState.feedDistributions = [];
    }
    appState.feedDistributions.unshift(distrib);

    // Mettre à jour le stock global en kg
    appState.feedStockKg = parseFloat((appState.feedTypes || []).reduce((sum, ft) => sum + (Number(ft.stockKg) || 0), 0).toFixed(2));
    appState.feedStockDate = date;
    appState.feedStockUpdatedAt = Date.now();

    this.saveState();

    if (window.appAuth && typeof window.appAuth.pushData === 'function') {
      window.appAuth.pushData(false, true);
    }
    this.closeModal('modalFeedDistribution');
    this.checkDailyFeedInAppAlert();
    this.renderAll();
    this.renderFeedDistributionModal();
    this.renderFeedStockAdjustModal();

    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const details = items.map(it => `${it.kg}${unitKg} ${this.getFeedDisplayName(it).split(' ')[0]}`).join(' + ');

    let lotSuffix = '';
    if (targetMode === 'lot' && linkedLotId && linkedLotId !== 'all') {
      const targetLot = (appState.animals || []).find(a => a.id === linkedLotId);
      if (targetLot) {
        const lotName = this.getAnimalDisplayName(targetLot);
        lotSuffix = isAr ? ` ➔ الدفعة: ${lotName}` : (isEn ? ` ➔ Lot: ${lotName}` : ` ➔ Lot : ${lotName}`);
      }
    } else {
      lotSuffix = isAr ? ' ➔ (توزيع كلي حسب المعاملات)' : (isEn ? ' ➔ (Total by zootechnical coef)' : ' ➔ (Répartition par coefficient)');
    }

    this.showToast(isAr 
      ? `🌾 تم تسجيل التوزيع: ${details} (المجموع ${totalKg.toFixed(1)} ${unitKg})${lotSuffix} !` 
      : (isEn ? `🌾 Distribution saved: ${details} (Total ${totalKg.toFixed(1)} kg)${lotSuffix}!` : `🌾 Distribution enregistrée : ${details} (Total ${totalKg.toFixed(1)} kg)${lotSuffix} !`));
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

    const uncredited = (appState.expenses || []).filter(e => e.category === 'nourriture' && !e.feedStockAddedKg && !e.feedStockDetached);
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

    const hasFoodExpenses = (appState.expenses || []).some(e => e.category === 'nourriture' && !e.feedStockDetached);
    if (hasFoodExpenses) {
      this.reconcileFeedTypesFromExpenses();
    }
    if (!Array.isArray(appState.feedTypes) || appState.feedTypes.length === 0) {
      appState.feedTypes = [];
      const emptyStateMsg = isAr
        ? '📭 لا يوجد أي نوع علف مسجل حالياً في المخزن الاحتياطي.'
        : (isEn 
            ? '📭 No feed currently recorded in reserve stock.'
            : '📭 Aucun aliment actuellement enregistré dans le stock en réserve.');
      const addFeedBtnText = isAr ? '➕ إضافة نوع علف جديد' : (isEn ? '➕ Add New Feed' : '➕ Ajouter un aliment');
      container.innerHTML = bannerHtml + `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); background: var(--bg-surface); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 0.85rem;">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🌾</div>
          <div style="font-size: 0.9rem; font-weight: 600; margin-bottom: 1.1rem; color: var(--text-main);">${emptyStateMsg}</div>
          <button type="button" class="btn btn-sm btn-emerald" style="font-weight: 700; padding: 0.45rem 1rem;" onclick="app.openModal('modalNewFeedType')">
            ${addFeedBtnText}
          </button>
        </div>
      `;
      this.recalcStockAdjustValuation();
      return;
    } else {
      const globalStock = Number(appState.feedStockKg) || 0;
      const currentTotal = appState.feedTypes.reduce((s, f) => s + (Number(f.stockKg) || 0), 0);
      if (globalStock > 0 && currentTotal === 0 && appState.feedTypes.length > 0) {
        const perFeed = Math.round((globalStock / appState.feedTypes.length) * 10) / 10;
        let runningTotal = 0;
        appState.feedTypes.forEach((f, idx) => {
          if (idx === appState.feedTypes.length - 1) {
            f.stockKg = Math.max(0, Math.round((globalStock - runningTotal) * 10) / 10);
          } else {
            f.stockKg = perFeed;
            runningTotal += perFeed;
          }
        });
      }
    }

    let html = bannerHtml;
    appState.feedTypes.forEach(ft => {
      const stockKg = Number(ft.stockKg) || 0;
      const priceKg = Number(ft.pricePerKg) || 0;
      const subtotal = stockKg * priceKg;
      const displayName = this.getFeedDisplayName(ft);

      const isClosedStock = stockKg <= 0;
      const statusBadge = isClosedStock
        ? `<span class="badge-pill" style="font-size: 0.68rem; font-weight: 700; background: rgba(239, 68, 68, 0.12); color: var(--accent-rose); border: 1px solid rgba(239, 68, 68, 0.25);">📦 ${isAr ? 'منتهي (دورة مغلقة)' : 'Épuisé (Cycle clôturé)'}</span>`
        : `<span class="badge-pill" style="font-size: 0.68rem; font-weight: 700; background: rgba(16, 185, 129, 0.12); color: var(--accent-emerald); border: 1px solid rgba(16, 185, 129, 0.25);">🟢 ${isAr ? 'متوفر' : 'En stock'}</span>`;

      const isGrain = ft.texture !== 'moulu';
      const kgPerCan = this.getFeedKgPerCan(ft);

      html += `
        <div class="feed-stock-row" style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.75rem; margin-bottom: 0.65rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem; flex-wrap: wrap; gap: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 0.45rem;">
              <strong style="color: var(--text-main); font-size: 0.95rem;">🌾 ${displayName}</strong>
              ${statusBadge}
            </div>
            <button type="button" class="btn btn-xs btn-outline" style="color: var(--accent-rose); padding: 0.15rem 0.45rem; font-size: 0.7rem;" onclick="app.deleteFeedType('${ft.id}')">
              ${btnDeleteText}
            </button>
          </div>

          <!-- Choix Texture : كعب vs مرحي -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; background: var(--bg-card); padding: 0.35rem 0.55rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); flex-wrap: wrap; gap: 0.35rem;">
            <div style="display: flex; align-items: center; gap: 0.3rem;">
              <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-secondary);">${this.t('feed_texture_label')}</span>
              <div style="display: inline-flex; gap: 0.25rem;">
                <button type="button" id="stockTextureBtnGrain_${ft.id}" class="btn btn-xs ${isGrain ? 'btn-emerald' : 'btn-outline'}" style="padding: 0.2rem 0.5rem; font-size: 0.73rem; font-weight: ${isGrain ? '800' : '600'}; border-radius: var(--radius-sm);" onclick="app.setFeedTypeTexture('${ft.id}', 'grain')">
                  🌾 ${this.t('feed_texture_grain')}
                </button>
                <button type="button" id="stockTextureBtnMoulu_${ft.id}" class="btn btn-xs ${!isGrain ? 'btn-emerald' : 'btn-outline'}" style="padding: 0.2rem 0.5rem; font-size: 0.73rem; font-weight: ${!isGrain ? '800' : '600'}; border-radius: var(--radius-sm);" onclick="app.setFeedTypeTexture('${ft.id}', 'moulu')">
                  🥣 ${this.t('feed_texture_moulu')}
                </button>
              </div>
            </div>
            <div id="stockDensityBadge_${ft.id}" style="font-size: 0.73rem; color: var(--accent-emerald); font-weight: 700;">
              🥫 1 ${isAr ? 'علبة' : 'bte'} ≈ <strong>${kgPerCan.toFixed(2)} ${unitKg}</strong>
            </div>
          </div>

          <div class="form-row" style="margin-bottom: 0; gap: 0.5rem;">
            <div class="form-group flex-1" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.72rem; font-weight: 700;">${lblStockText}</label>
              <input type="number" id="stockKg_${ft.id}" class="input-field" step="any" min="0" value="${stockKg.toFixed(1)}" style="font-weight: 800; font-size: 1.1rem; color: var(--accent-amber);" oninput="app.recalcStockAdjustValuation()">
            </div>
            <div class="form-group flex-1" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.72rem; font-weight: 700;">${lblPriceText}</label>
              <input type="number" id="priceKg_${ft.id}" class="input-field" step="any" min="0" value="${priceKg.toFixed(2)}" style="font-weight: 700; font-size: 1.05rem;" oninput="app.recalcStockAdjustValuation()">
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
      const kgEl = document.getElementById(`stockKg_${ft.id}`);
      const priceEl = document.getElementById(`priceKg_${ft.id}`);
      const rawKg = String(kgEl?.value || '').replace(',', '.').trim();
      const rawPrice = String(priceEl?.value || '').replace(',', '.').trim();
      const kg = parseFloat(rawKg) || 0;
      const price = parseFloat(rawPrice) || 0;
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
    if (e && typeof e.preventDefault === 'function') e.preventDefault();

    let totalKg = 0;
    let totalVal = 0;
    const now = Date.now();

    (appState.feedTypes || []).forEach(ft => {
      const kgInput = document.getElementById(`stockKg_${ft.id}`);
      const priceInput = document.getElementById(`priceKg_${ft.id}`);
      const rawKg = String(kgInput?.value || '').replace(',', '.').trim();
      const rawPrice = String(priceInput?.value || '').replace(',', '.').trim();
      const parsedKg = parseFloat(rawKg);
      const parsedPrice = parseFloat(rawPrice);

      const kg = (!isNaN(parsedKg) && parsedKg >= 0) ? parsedKg : (Number(ft.stockKg) || 0);
      const price = (!isNaN(parsedPrice) && parsedPrice >= 0) ? parsedPrice : (Number(ft.pricePerKg) || 0);

      ft.stockKg = Math.max(0, parseFloat(kg.toFixed(2)));
      ft.pricePerKg = Math.max(0, parseFloat(price.toFixed(3)));
      ft.manuallyAdjusted = true;
      ft.updatedAt = now;
      if (ft.stockKg <= 0) {
        ft.isClosed = true;
        ft.closedDate = this.getTodayStr();
      } else {
        ft.isClosed = false;
        delete ft.closedDate;
      }
      totalKg += ft.stockKg;
      totalVal += ft.stockKg * ft.pricePerKg;
    });

    appState.feedStockKg = parseFloat(totalKg.toFixed(2));
    appState.feedStockDate = this.getTodayStr();
    appState.feedStockUpdatedAt = now;
    appState.feedStockCostPerKg = totalKg > 0 ? (totalVal / totalKg) : (this.getAverageFeedPricePerKg() || 0);

    this.saveState();

    // Synchronisation Cloud immédiate forcée pour éviter toute perte ou écrasement
    if (window.appAuth && typeof window.appAuth.pushData === 'function') {
      window.appAuth.pushData(false, true);
    }

    this.closeModal('modalAdjustFeedStock');
    this.renderAll();
    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    this.showToast(isAr 
      ? `✅ تم تحديث مخزون المستودع: ${totalKg.toFixed(1)} ${unitKg} إجمالاً (~${this.formatMoney(totalVal)})` 
      : (isEn ? `✅ Feed stocks updated: ${totalKg.toFixed(1)} ${unitKg} in total (~${this.formatMoney(totalVal)})` : `✅ Stocks magasins mis à jour : ${totalKg.toFixed(1)} kg au total (~${this.formatMoney(totalVal)})`));
  },

  handleSaveNewFeedType(e) {
    e.preventDefault();
    const name = document.getElementById('newFeedTypeName')?.value.trim();
    const rawStock = String(document.getElementById('newFeedTypeStockKg')?.value || '').replace(',', '.').trim();
    const rawPrice = String(document.getElementById('newFeedTypePriceKg')?.value || '').replace(',', '.').trim();
    const stockKg = parseFloat(rawStock) || 0;
    const priceKg = !isNaN(parseFloat(rawPrice)) ? Math.max(0, parseFloat(rawPrice)) : 0;
    const recordExpense = document.getElementById('newFeedTypeRecordExpense')?.checked;

    const grainRadio = document.querySelector('input[name="newFeedTexture"][value="grain"]');
    const isGrain = grainRadio ? grainRadio.checked : true;
    const texture = isGrain ? 'grain' : 'moulu';

    const family = this.detectFeedTypeFromText(name);
    const kgPerCanVal = parseFloat(document.getElementById('newFeedKgPerCan')?.value);
    const kgPerCan = kgPerCanVal > 0 ? kgPerCanVal : this.getFeedDefaultDensity(family, texture);

    const newType = {
      id: 'feed-' + Date.now().toString(36),
      name: name,
      stockKg: Math.max(0, stockKg),
      pricePerKg: Math.max(0, priceKg),
      texture: texture,
      kgPerCan: kgPerCan,
      manuallyAdjusted: true,
      updatedAt: Date.now()
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
        linkedLotId: 'general',
        feedStockAddedKg: stockKg,
        feedTypeId: newType.id
      };
      appState.expenses.unshift(newExp);
    }

    appState.feedStockKg = appState.feedTypes.reduce((sum, ft) => sum + (Number(ft.stockKg) || 0), 0);
    appState.feedStockDate = this.getTodayStr();
    appState.feedStockCostPerKg = this.getAverageFeedPricePerKg();

    this.saveState();
    this.closeModal('modalAddFeedType');

    // Rafraîchir les modals et l'interface
    this.renderFeedDistributionModal();
    this.renderFeedStockAdjustModal();
    this.renderAll();

    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    this.showToast(isAr 
      ? `✅ تمت إضافة العلف "${name}" بنجاح (${stockKg} ${unitKg} في المخزون) !` 
      : (isEn ? `✅ New feed "${name}" added successfully (${stockKg} ${unitKg} in stock)!` : `✅ Nouvel aliment "${name}" ajouté avec succès (${stockKg} kg en stock) !`));
  },

  deleteFeedType(id) {
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const ft = (appState.feedTypes || []).find(f => f.id === id);
    if (!ft) return;

    const displayName = this.getFeedDisplayName(ft);

    this.confirmDialog({
      title: isAr ? 'حذف العلف' : 'Supprimer l\'aliment',
      message: isAr 
        ? `هل تريد بالتأكيد حذف العلف "${displayName}" من مخزون المستودع ؟`
        : `Voulez-vous vraiment supprimer l'aliment "${displayName}" du stock en réserve ?`,
      isDanger: true,
      confirmText: isAr ? 'حذف' : 'Supprimer',
      onConfirm: () => {
        const family = this.detectFeedTypeFromText(ft.name) || this.detectFeedTypeFromText(ft.id);

        // Détacher les dépenses liées à cet aliment pour qu'elles n'apparaissent plus comme actives dans ce stock
        (appState.expenses || []).forEach(e => {
          if (e.feedTypeId === id || (family && this.detectFeedTypeFromText(e.title) === family)) {
            e.feedStockDetached = true;
            e.feedStockAddedKg = 0;
            delete e.feedTypeId;
          }
        });

        // Supprimer définitivement de feedTypes
        appState.feedTypes = (appState.feedTypes || []).filter(f => f.id !== id);
        appState.feedStockKg = parseFloat((appState.feedTypes || []).reduce((sum, f) => sum + (Number(f.stockKg) || 0), 0).toFixed(2));
        appState.feedStockCostPerKg = this.getAverageFeedPricePerKg();

        this.saveState();

        if (window.appAuth && typeof window.appAuth.pushData === 'function') {
          window.appAuth.pushData(false, true);
        }

        this.renderFeedStockAdjustModal();
        this.renderFeedDistributionModal();
        this.renderExpensesTable();
        this.renderAll();
        this.showToast(isAr ? `تم حذف العلف "${displayName}".` : (isEn ? `Feed "${displayName}" deleted.` : `Aliment "${displayName}" supprimé.`));
      }
    });
  },

  getFeedScalingRatio() {
    return 1.0;
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

    const feedStockRemainingKg = Math.max(0, this.getAvailableFeedStockKg() || 0);
    let feedStockRemaining = 0;
    if (Array.isArray(appState.feedTypes) && appState.feedTypes.length > 0) {
      feedStockRemaining = appState.feedTypes.reduce((sum, ft) => sum + ((Number(ft.stockKg) || 0) * (Number(ft.pricePerKg) || 0)), 0);
    } else {
      const unitFeedVal = appState.feedStockCostPerKg || feedPriceKg;
      feedStockRemaining = feedStockRemainingKg * unitFeedVal;
    }

    const hasDistributions = Array.isArray(appState.feedDistributions) && appState.feedDistributions.length > 0;
    const feedPurchasesExist = (appState.expenses || []).some(e => e.category === 'nourriture' && Number(e.total) > 0);
    const feedStockDeclared = (Number(appState.feedStockKg) > 0) || (Array.isArray(appState.feedTypes) && appState.feedTypes.some(ft => Number(ft.stockKg) > 0));

    // Activité d'aliment réelle déclarée par l'éleveur (stricte : aucun chiffre simulé de tête !)
    const hasRealFeedData = feedPurchasesExist || hasDistributions || feedStockDeclared;

    // Calcul des distributions effectuées aujourd'hui
    const todayStr = this.getTodayStr();
    const todayDistributions = (appState.feedDistributions || []).filter(d => d.date === todayStr);
    const todayDistributedKg = todayDistributions.reduce((s, d) => s + (Number(d.totalKg) || Number(d.quantityKg) || 0), 0);
    const todayDistributedCost = todayDistributions.reduce((s, d) => s + (Number(d.totalCost) || 0), 0);
    const todayDistributedCans = todayDistributions.reduce((s, d) => s + (Number(d.cans) || 0), 0);

    // Détermination de l'état : dès que des données d'aliment existent (stock en réserve, achat ou distribution)
    const hasData = hasRealFeedData && (totalLivingAnimals > 0 || todayDistributedKg > 0 || feedStockRemainingKg > 0);

    // AUCUNE DÉDUCTION AUTOMATIQUE !
    // Si l'éleveur n'a pas validé de distribution manuelle aujourd'hui, le compteur "Distribué aujourd'hui" est STRICTEMENT 0.00 kg (0,000 DT).
    // Le stock en réserve ne diminue JAMAIS automatiquement.
    const totalFarmDailyKg = todayDistributedKg;
    const totalFarmDailyCost = todayDistributedCost > 0 ? todayDistributedCost : (todayDistributedKg * feedPriceKg);

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';

    // Remplissage des métriques compactes (Diminished mode)
    if (todayKgCompact) {
      todayKgCompact.textContent = `${totalFarmDailyKg.toFixed(2)} ${unitKg}`;
    }
    if (todayCostCompact) {
      todayCostCompact.textContent = `${this.formatMoney(totalFarmDailyCost)}`;
    }
    if (stockKgCompact) {
      stockKgCompact.textContent = `${feedStockRemainingKg.toFixed(1)} ${unitKg} (${this.formatMoney(feedStockRemaining)})`;
    }

    // Remplissage des métriques de la vue complète
    if (todayKgEl) {
      todayKgEl.textContent = `${totalFarmDailyKg.toFixed(2)} ${unitKg}`;
    }
    if (todayCostEl) {
      todayCostEl.textContent = `${this.formatMoney(totalFarmDailyCost)}`;
    }
    if (stockKgEl) {
      stockKgEl.textContent = feedStockRemainingKg > 0
        ? `${feedStockRemainingKg.toFixed(1)} ${unitKg} (${this.formatMoney(feedStockRemaining)})`
        : (isAr ? '0.0 كغ بالمخزن (0,000 د.ت)' : (isEn ? '0.0 kg in stock (0,000 DT)' : '0.0 kg en réserve (0,000 DT)'));
    }

    // Statut de distribution du jour sous la carte
    const statusHintEl = document.getElementById('farmFeedTodayStatusHint');
    if (statusHintEl) {
      if (todayDistributedKg > 0) {
        statusHintEl.textContent = isAr 
          ? `✅ تم التوزيع اليوم: ${todayDistributedKg.toFixed(2)} كغ (${todayDistributedCans.toFixed(1)} علبة)`
          : (isEn ? `✅ Distributed today: ${todayDistributedKg.toFixed(2)} kg (${todayDistributedCans.toFixed(1)} cans)` : `✅ Distribué aujourd'hui : ${todayDistributedKg.toFixed(2)} kg (${todayDistributedCans.toFixed(1)} boîtes)`);
        statusHintEl.style.color = 'var(--accent-emerald)';
      } else {
        statusHintEl.textContent = isAr 
          ? '🥫 توزيع اليوم: اضغط لتسجيل العلف' 
          : (isEn ? '🥫 Today distribution: Click to log' : '🥫 Distribution du jour : Cliquer pour enregistrer');
        statusHintEl.style.color = 'var(--text-secondary)';
      }
    }

    // Basculement visuel entre mode Diminué et mode Complet
    if (!hasData) {
      card.classList.add('is-diminished');
      if (diminishedSection) diminishedSection.style.display = 'block';
      if (fullSection) fullSection.style.display = 'none';
      if (breakdownEl) breakdownEl.innerHTML = '';
      const moyCardEl = document.getElementById('farmFeedMoyConclusionCard');
      if (moyCardEl) moyCardEl.innerHTML = '';
      return;
    }

    // Mode Complet
    card.classList.remove('is-diminished');
    if (diminishedSection) diminishedSection.style.display = 'none';
    if (fullSection) fullSection.style.display = 'block';

    const btnDistribText = isAr ? '🥫 توزيع العلف' : (isEn ? '🥫 Distribute Feed' : '🥫 Distribuer l\'aliment');
    const btnStockText = isAr ? '📦 مخزون المستودع' : (isEn ? '📦 Warehouse Stock' : '📦 Stock Magasin');

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

      lotsHtml += `
        <div style="grid-column: 1 / -1; background: rgba(16, 185, 129, 0.1); border: 1px dashed rgba(16, 185, 129, 0.35); border-radius: var(--radius-md); padding: 0.55rem 0.85rem; font-size: 0.78rem; font-weight: 700; color: var(--accent-emerald); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
            <span>${stockLabel}</span>
          </div>
          <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-outline" style="padding: 0.3rem 0.65rem; font-size: 0.78rem; font-weight: 800;" onclick="app.openModal('modalAdjustFeedStock')">
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
        ? '➕ إدخال مخزون المستودع'
        : (isEn ? '➕ Declare Stock' : '➕ Déclarer Stock de Réserve');

      lotsHtml += `
        <div style="grid-column: 1 / -1; background: rgba(245, 158, 11, 0.08); border: 1px dashed rgba(245, 158, 11, 0.3); border-radius: var(--radius-md); padding: 0.55rem 0.85rem; font-size: 0.78rem; color: var(--text-main); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
          <span>${emptyMsg}</span>
          <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-primary" style="padding: 0.3rem 0.65rem; font-size: 0.76rem; font-weight: 800;" onclick="app.openModal('modalAdjustFeedStock')">
              ${emptyBtn}
            </button>
          </div>
        </div>
      `;
    }

    if (breakdownEl) breakdownEl.innerHTML = lotsHtml;

    // Rendu du bloc Commentaire & Conclusion Moyenne Journalière (Moy Conclusion Daily Food)
    const moyCardEl = document.getElementById('farmFeedMoyConclusionCard');
    if (moyCardEl) {
      this.renderFarmFeedMoyConclusion(moyCardEl, {
        totalLivingAnimals,
        totalFarmDailyGrams,
        todayDistributedKg,
        todayDistributedCost,
        todayDistributedCans,
        feedStockRemainingKg,
        feedPriceKg
      });
    }
  },

  renderFarmFeedMoyConclusion(container, data) {
    if (!container) return;
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    const bteLabel = isAr ? 'علبة' : (isEn ? 'can' : 'bte');

    const {
      totalLivingAnimals,
      totalFarmDailyGrams,
      todayDistributedKg,
      feedStockRemainingKg
    } = data;

    // Calcul de la moyenne réelle depuis le début du projet (première distribution)
    const allDistributions = appState.feedDistributions || [];

    const dailyMap = {};
    allDistributions.forEach(d => {
      if (d.date) {
        if (!dailyMap[d.date]) dailyMap[d.date] = 0;
        dailyMap[d.date] += Number(d.totalKg) || Number(d.quantityKg) || 0;
      }
    });

    // Trouver la première date de distribution (début du projet)
    const allDates = Object.keys(dailyMap).sort();
    let avgDailyKg = 0;

    if (allDates.length > 0) {
      const sumKg = allDates.reduce((acc, dt) => acc + dailyMap[dt], 0);
      // Diviser par nombre de jours réels depuis la première distribution jusqu'à aujourd'hui
      const firstDate = allDates[0];
      const todayStr = this.getTodayStr();
      const totalCalendarDays = Math.max(1, this.calculateDaysBetween(firstDate, todayStr) + 1);
      // Utiliser le nombre de jours calendaires pour la moyenne globale
      avgDailyKg = sumKg / totalCalendarDays;
    } else if (todayDistributedKg > 0) {
      avgDailyKg = todayDistributedKg;
    } else if (totalFarmDailyGrams > 0) {
      avgDailyKg = totalFarmDailyGrams / 1000;
    }

    const avgDailyCans = avgDailyKg / 0.65;
    const avgGramsPerAnimal = totalLivingAnimals > 0 ? Math.round((avgDailyKg * 1000) / totalLivingAnimals) : 115;

    let autonomyDays = 0;
    if (feedStockRemainingKg > 0 && avgDailyKg > 0) {
      autonomyDays = Math.floor(feedStockRemainingKg / avgDailyKg);
    }

    // Nombre de jours depuis le début du projet pour affichage
    const allDatesForDisplay = Object.keys(dailyMap).sort();
    let projectDaysLabel = '';
    if (allDatesForDisplay.length > 0) {
      const firstDate = allDatesForDisplay[0];
      const todayStr2 = this.getTodayStr();
      const projectDays = this.calculateDaysBetween(firstDate, todayStr2) + 1;
      projectDaysLabel = isAr 
        ? `(${projectDays} يوم منذ البداية)` 
        : (isEn ? `(${projectDays} days since start)` : `(${projectDays} j depuis le début)`);
    }

    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.65rem 0.85rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
          <span style="font-size: 1.1rem;">📊</span>
          <span style="font-weight: 700; font-size: 0.85rem; color: var(--text-main);">
            ${isAr ? 'المعدل اليومي :' : (isEn ? 'Daily average:' : 'Moyenne par journée :')}
          </span>
          <strong style="color: var(--accent-emerald); font-size: 1.05rem; font-weight: 800;">
            ${avgDailyKg.toFixed(2)} ${unitKg}/j
          </strong>
          <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">
            (~${avgDailyCans.toFixed(1)} ${bteLabel}/j${totalLivingAnimals > 0 ? ` • ~${avgGramsPerAnimal} g/sujet` : ''})
          </span>
          ${projectDaysLabel ? `<span style="font-size: 0.73rem; color: var(--text-muted);">${projectDaysLabel}</span>` : ''}
        </div>
        ${autonomyDays > 0 ? `
          <span class="badge-pill" style="font-size: 0.72rem; font-weight: 700; color: var(--accent-emerald); background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25);">
            ⏳ ${isAr ? `المخزون يكفي: ~${autonomyDays} يوم` : (isEn ? `Runway: ~${autonomyDays} d` : `Autonomie: ~${autonomyDays} j`)}
          </span>
        ` : ''}
      </div>
    `;
  },

  openFeedConsumptionCommentModal() {},
  setCommentFeedQuickValues() {},
  recalcCommentFeedPreview() {},
  handleSaveFeedConsumptionComment() {},
  promptEditTodayFeedComment() {},

  // ==========================================
  // ANIMALS (CHEPTEL & RACES) MODULE
  // ==========================================
  setAnimalQtyFilter(val) {
    const select = document.getElementById('animalQtyFilterSelect');
    if (select) select.value = val;
    this.handleAnimalFilterChange();
  },

  calculateDaysBetween(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return 0;
    const sParts = startDateStr.split('-').map(Number);
    const eParts = endDateStr.split('-').map(Number);
    if (sParts.length !== 3 || eParts.length !== 3) return 0;
    const sUtc = Date.UTC(sParts[0], sParts[1] - 1, sParts[2]);
    const eUtc = Date.UTC(eParts[0], eParts[1] - 1, eParts[2]);
    const diff = eUtc - sUtc;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  },

  getLotExitDate(animal) {
    if (!animal) return this.getTodayStr();
    const isClosed = (Number(animal.currentQuantity) || 0) <= 0;
    if (!isClosed) return this.getTodayStr();
    const lotSales = (appState.sales || []).filter(s => s.linkedLotId === animal.id && s.date);
    const maxSaleDate = lotSales.length > 0 
      ? lotSales.reduce((max, s) => (s.date > max ? s.date : max), '') 
      : '';
    if (animal.exitDate && maxSaleDate) {
      return animal.exitDate > maxSaleDate ? animal.exitDate : maxSaleDate;
    }
    return animal.exitDate || maxSaleDate || animal.birthDate || this.getTodayStr();
  },

  // Algorithme strict d'imputation temporelle par jour selon la fenêtre de présence du lot :
  // Cout_Total(L) = Somme_{d in [date_arrivee, exitDate]} Cout_Journalier_Alloue(L, d)
  // Tout stock acheté et entièrement consommé après la sortie ou avant l'arrivée a un impact strictement nul (0,000 DT)
  calculateAllLotsFinancials() {
    const todayStr = this.getTodayStr();
    const lotMap = {};

    // 1. Initialiser chaque lot avec sa fenêtre temporelle de présence stricte
    (appState.animals || []).forEach(a => {
      const arrivalDate = a.birthDate || todayStr;
      const isClosed = (Number(a.currentQuantity) || 0) <= 0;
      const exitDate = this.getLotExitDate(a);
      const initialQty = Number(a.initialQuantity) || 1;
      const currentQty = Number(a.currentQuantity) || 0;
      const activeHeads = isClosed ? initialQty : Math.max(1, currentQty);

      lotMap[a.id] = {
        animal: a,
        arrivalDate,
        exitDate,
        isClosed,
        initialQty,
        currentQty,
        activeHeads,
        directExpenses: 0,
        allocatedFeed: 0,
        allocatedOther: 0
      };
    });

    // Helper: calcul précis de l'effectif vivant présent sur la ferme le jour d
    const getLivingHeadsOnDate = (info, d) => {
      if (d < info.arrivalDate || d > info.exitDate) return 0;
      // Ventes ayant eu lieu strictement après la date d pour ce lot
      const salesAfterD = (appState.sales || [])
        .filter(s => s.linkedLotId === info.animal.id && s.date && s.date > d)
        .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
      const livingOnD = (Number(info.animal.currentQuantity) || 0) + salesAfterD;
      return Math.max(1, Math.min(info.initialQty, livingOnD));
    };

    // 2. Dépenses directes affectées à un ou plusieurs lots spécifiques (ex: 2 ou 3 lots achetés ensemble)
    (appState.expenses || []).forEach(e => {
      const expTotal = Number(e.total) || 0;
      if (expTotal <= 0) return;
      const linkedIds = this.getExpenseLinkedLotIds(e);
      if (linkedIds.length === 0) return; // Frais généraux traités à l'étape 4 ci-dessous

      // Identifier tous les lots cibles choisis par l'éleveur
      const targetLots = linkedIds.map(id => lotMap[id]).filter(Boolean);
      if (targetLots.length === 0) return;

      if (targetLots.length === 1) {
        // 1 seul lot actif : 100% direct à ce lot
        if (e.category === 'nourriture') {
          targetLots[0].allocatedFeed += expTotal;
        } else {
          targetLots[0].directExpenses += expTotal;
        }
      } else {
        // Plusieurs lots sélectionnés (2, 3 lots ou tous les lots de la ferme) :
        // Répartition agronomique équitable selon la durée de présence et la consommation réelle sur la ferme !
        if (e.category === 'nourriture') {
          let totalWeight = 0;
          const targetPortions = targetLots.map(info => {
            const daysOnFarm = Math.max(1, this.calculateDaysBetween(info.arrivalDate, info.exitDate || todayStr));
            const arrivalAge = Number(info.animal.arrivalAgeDays) || 0;
            const totalAgeDays = arrivalAge + daysOnFarm;
            const cumulKg = this.calculateCumulativeFeedKg(info.animal.species, totalAgeDays, info.animal.stage, info.animal.breed, arrivalAge);
            const minDailyGrams = this.getDailyGramsForAge(info.animal.species, arrivalAge, info.animal.stage, info.animal.breed);
            const weightKg = Math.max(minDailyGrams / 1000, cumulKg, 0.05);
            const portion = info.activeHeads * weightKg;
            totalWeight += portion;
            return { info, portion };
          });

          if (totalWeight > 0) {
            targetPortions.forEach(tp => {
              tp.info.allocatedFeed += expTotal * (tp.portion / totalWeight);
            });
          } else {
            const totalHeads = targetLots.reduce((s, info) => s + info.activeHeads, 0);
            targetLots.forEach(info => {
              info.allocatedFeed += expTotal * (info.activeHeads / (totalHeads || 1));
            });
          }
        } else {
          const totalHeads = targetLots.reduce((s, info) => s + info.activeHeads, 0);
          if (totalHeads > 0) {
            targetLots.forEach(info => {
              info.directExpenses += expTotal * (info.activeHeads / totalHeads);
            });
          }
        }
      }
    });

    // 3. Récupérer toutes les dates distinctes d'activité générale (distributions ou dépenses générales)
    const distinctDates = new Set();
    (appState.feedDistributions || []).forEach(d => {
      if (d.date) distinctDates.add(d.date);
    });
    (appState.expenses || []).forEach(e => {
      if (e.date && this.getExpenseLinkedLotIds(e).length === 0) {
        distinctDates.add(e.date);
      }
    });

    const sortedDates = Array.from(distinctDates).sort();

    // 4. Parcourir chaque jour d pour ventiler la dépense réelle distribuée au prorata strict des parts actives de la journée d
    sortedDates.forEach(d => {
      // Identifier les lots actifs ce jour-là : arrivalDate <= d <= exitDate
      const activeLotsOnD = Object.values(lotMap).filter(info => d >= info.arrivalDate && d <= info.exitDate);

      // 4a. Distributions réelles d'aliment effectuées le jour d
      const distribsOnD = (appState.feedDistributions || []).filter(dist => dist.date === d);

      // Séparer les distributions par lot (100% au lot désigné) et les distributions totales (selon coefficients)
      let generalFeedDistCost = 0;
      distribsOnD.forEach(dist => {
        const cost = Number(dist.totalCost) || 0;
        if (cost <= 0) return;
        if (dist.targetMode === 'lot' && dist.linkedLotId && dist.linkedLotId !== 'all') {
          if (lotMap[dist.linkedLotId]) {
            // Attribué directement et intégralement au lot choisi
            lotMap[dist.linkedLotId].allocatedFeed += cost;
          } else {
            // Repli sécurisé si le lot n'est plus actif ou introuvable
            generalFeedDistCost += cost;
          }
        } else {
          // Distribution totale générale par coefficients zootechniques
          generalFeedDistCost += cost;
        }
      });

      if (generalFeedDistCost > 0) {
        const targetLots = (activeLotsOnD.length > 0) ? activeLotsOnD : Object.values(lotMap);
        let totalFeedPortions = 0;
        const lotPortions = targetLots.map(info => {
          const daysSinceArrival = this.calculateDaysBetween(info.arrivalDate, d);
          const ageOnD = daysSinceArrival + (Number(info.animal.arrivalAgeDays) || 0);
          const feedData = this.getAgronomicFeedData(info.animal.species, ageOnD, info.animal.stage, info.animal.breed);
          const coef = feedData.avgGrams || 100;
          const headsOnD = getLivingHeadsOnDate(info, d);
          const portion = headsOnD * coef;
          totalFeedPortions += portion;
          return { info, portion, headsOnD };
        });

        if (totalFeedPortions > 0) {
          lotPortions.forEach(lp => {
            lp.info.allocatedFeed += generalFeedDistCost * (lp.portion / totalFeedPortions);
          });
        }
      }

      // 4b. Dépenses générales d'aliment le jour d (achats de sacs / stock d'aliment pour le cheptel)
      const hasAnyDistributions = Array.isArray(appState.feedDistributions) && appState.feedDistributions.length > 0;
      const feedExpsOnD = (appState.expenses || []).filter(e => 
        e.date === d && 
        e.category === 'nourriture' && 
        (!hasAnyDistributions || !e.feedStockAddedKg) &&
        (this.getExpenseLinkedLotIds(e).length === 0)
      );

      // Les achats généraux d'aliment nourrissent le cheptel actif à la date d'achat :
      // Les lots déjà vendus (exitDate < d) ne reçoivent STRICTEMENT RIEN (0,000 DT)
      if (feedExpsOnD.length > 0) {
        const dayFeedExpCost = feedExpsOnD.reduce((s, e) => s + (Number(e.total) || 0), 0);
        if (dayFeedExpCost > 0) {
          const allLots = Object.values(lotMap);
          const targetLots = (activeLotsOnD.length > 0) ? activeLotsOnD : allLots;

          let totalCumulWeight = 0;
          const lotExpPortions = targetLots.map(info => {
            const headsOnD = getLivingHeadsOnDate(info, d);
            const daysOnFarm = Math.max(1, this.calculateDaysBetween(info.arrivalDate, info.exitDate || todayStr));
            const arrivalAge = Number(info.animal.arrivalAgeDays) || 0;
            const ageOnD = arrivalAge + daysOnFarm;
            const cumulKg = this.calculateCumulativeFeedKg(info.animal.species, ageOnD, info.animal.stage, info.animal.breed, arrivalAge);
            const minDailyGrams = this.getDailyGramsForAge(info.animal.species, arrivalAge, info.animal.stage, info.animal.breed);
            const weightKg = Math.max(minDailyGrams / 1000, cumulKg, 0.05);
            const portion = headsOnD * weightKg;
            totalCumulWeight += portion;
            return { info, portion, headsOnD };
          });

          if (totalCumulWeight > 0) {
            lotExpPortions.forEach(lp => {
              lp.info.allocatedFeed += dayFeedExpCost * (lp.portion / totalCumulWeight);
            });
          }
        }
      }

      // 4c. Dépenses générales hors aliment réparties au prorata strict des têtes vivantes à la date d
      const otherExpsOnD = (appState.expenses || []).filter(e => 
        e.date === d && 
        e.category !== 'nourriture' && 
        (this.getExpenseLinkedLotIds(e).length === 0)
      );
      const dayOtherCost = otherExpsOnD.reduce((s, e) => s + (Number(e.total) || 0), 0);

      if (dayOtherCost > 0) {
        const allLots = Object.values(lotMap);
        const targetLots = (activeLotsOnD.length > 0) ? activeLotsOnD : allLots;
        let totalLivingHeads = 0;
        const lotHeads = targetLots.map(info => {
          const headsOnD = getLivingHeadsOnDate(info, d);
          totalLivingHeads += headsOnD;
          return { info, headsOnD };
        });

        if (totalLivingHeads > 0) {
          lotHeads.forEach(lh => {
            lh.info.allocatedOther += dayOtherCost * (lh.headsOnD / totalLivingHeads);
          });
        }
      }
    });

    // 5. Consolidation financière pour chaque lot
    const results = {};
    Object.keys(lotMap).forEach(lotId => {
      const info = lotMap[lotId];
      const a = info.animal;
      const acqCostPerHead = Number(a.costPerHead) || 0;
      const totalAcquisition = (Number(a.initialQuantity) || info.activeHeads) * acqCostPerHead;
      const currentLivingAcquisition = info.currentQty * acqCostPerHead;

      const totalLotExpenses = info.directExpenses + info.allocatedFeed + info.allocatedOther;
      const totalInvested = (info.isClosed ? totalAcquisition : currentLivingAcquisition) + totalLotExpenses;

      const costPerCurrentHead = (!info.isClosed && info.currentQty > 0 && totalInvested > 0)
        ? (totalInvested / info.currentQty)
        : (totalInvested / (Number(a.initialQuantity) || 1));

      results[lotId] = {
        animal: a,
        isClosed: info.isClosed,
        arrivalDate: info.arrivalDate,
        exitDate: info.exitDate,
        acquisitionCostPerHead: acqCostPerHead,
        totalAcquisition,
        currentLivingAcquisition,
        directLotExpenses: info.directExpenses,
        allocatedFeed: info.allocatedFeed,
        allocatedOther: info.allocatedOther,
        totalLotExpenses,
        totalInvested,
        costPerCurrentHead
      };
    });

    return results;
  },

  calculateLotFinancials(targetAnimal) {
    if (!targetAnimal) return null;
    const all = this.calculateAllLotsFinancials();
    return all[targetAnimal.id] || null;
  },

  renderAnimals(filter = null) {
    this.synchronizeAnimalStages();
    const grid = document.getElementById('animalsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (filter !== null && filter !== undefined) {
      this.currentAnimalFilter = filter;
    }
    const activeSpecies = this.currentAnimalFilter || 'all';

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    // Separate active lots from closed/sold-out lots
    const activeAnimals = (appState.animals || []).filter(a => (Number(a.currentQuantity) || 0) > 0);
    const closedAnimals = (appState.animals || []).filter(a => (Number(a.currentQuantity) || 0) <= 0);
    const closedCount = closedAnimals.length;

    // Filter count chips: accurately reflect active batches on the farm
    const counts = { all: activeAnimals.length, poulet: 0, pondeuse: 0, poussin: 0, adulte: 0, pintade: 0, canard: 0 };
    activeAnimals.forEach(a => {
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
    const qtyFilter = document.getElementById('animalQtyFilterSelect')?.value || 'active';
    const searchQuery = (document.getElementById('animalSearchInput')?.value || '').trim().toLowerCase();

    // 1. Filtrer par espèce (chips)
    let filtered = activeSpecies === 'all'
      ? appState.animals
      : appState.animals.filter(a => a.species === activeSpecies || (activeSpecies === 'canard' && a.species === 'canard_barbarie'));

    // 2. Filtrer par effectif / statut (Défaut : uniquement les lots actifs > 0 !)
    if (qtyFilter === 'active') {
      filtered = filtered.filter(a => (Number(a.currentQuantity) || 0) > 0);
    } else if (qtyFilter === 'closed') {
      filtered = filtered.filter(a => (Number(a.currentQuantity) || 0) <= 0);
    } else if (qtyFilter === 'large') {
      filtered = filtered.filter(a => (Number(a.currentQuantity) || 0) > 50);
    } else if (qtyFilter === 'medium') {
      filtered = filtered.filter(a => {
        const qty = Number(a.currentQuantity) || 0;
        return qty >= 10 && qty <= 50;
      });
    } else if (qtyFilter === 'small') {
      filtered = filtered.filter(a => {
        const qty = Number(a.currentQuantity) || 0;
        return qty > 0 && qty < 10;
      });
    }
    // si qtyFilter === 'all', affiche tout (actifs et clôturés)

    // 3. Filtrer par recherche textuelle
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

    // 4. Filtrer par tranche d'âge
    if (ageFilter !== 'all') {
      filtered = filtered.filter(a => {
        const days = this.calculateAgeInDays(a.birthDate) + (Number(a.arrivalAgeDays) || 0);
        if (ageFilter === 'chick') return days < 30;
        if (ageFilter === 'growing') return days >= 30 && days <= 180;
        if (ageFilter === 'adult') return days > 180;
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

    // Bandeau d'information sur les lots clôturés / vendus
    if (qtyFilter === 'active' && closedCount > 0) {
      const banner = document.createElement('div');
      banner.style.cssText = 'grid-column: 1 / -1; background: rgba(59, 130, 246, 0.08); border: 1px dashed rgba(59, 130, 246, 0.3); border-radius: var(--radius-md); padding: 0.55rem 0.85rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--text-main);">
          <span>📦</span>
          <span><strong>${closedCount} ${isAr ? 'دفعة مباعة بالكامل / منتهية (0 طائر)' : 'lot(s) clôturé(s) / vendu(s) (0 tête)'}</strong> ${isAr ? 'تم إخفاؤها من القائمة النشطة لتفادي الازدحام مع الاحتفاظ بكامل السجلات.' : 'masqué(s) de la vue active (historique et bénéfices conservés).'}</span>
        </div>
        <button type="button" class="btn btn-xs btn-outline" onclick="app.setAnimalQtyFilter('closed')" style="font-weight: 700; padding: 4px 10px;">
          👁️ ${isAr ? `عرض الدفعات المنتهية (${closedCount})` : `Afficher les lots clôturés (${closedCount})`}
        </button>
      `;
      grid.appendChild(banner);
    } else if (qtyFilter === 'closed') {
      const banner = document.createElement('div');
      banner.style.cssText = 'grid-column: 1 / -1; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 0.55rem 0.85rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;';
      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--accent-emerald); font-weight: 700;">
          <span>📦</span>
          <span>${isAr ? 'عرض الدفعات المنتهية والمباعة (السجلات المالية والمداخيل والأرباح محفوظة بالكامل).' : 'Affichage des lots clôturés et vendus (historique financier, ventes et marges conservés).'}</span>
        </div>
        <button type="button" class="btn btn-xs btn-emerald" onclick="app.setAnimalQtyFilter('active')" style="font-weight: 700; padding: 4px 10px;">
          🐔 ${isAr ? `العودة للدفعات النشطة (${activeAnimals.length})` : `Revenir aux lots actifs (${activeAnimals.length})`}
        </button>
      `;
      grid.appendChild(banner);
    }

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
        const noMatch = isAr ? 'لا توجد دفعات طيور مطابقة لمعايير البحث والفرز.' : (isEn ? 'No animal batches found matching these filter and sort criteria.' : 'Aucun lot d\'animaux ne correspond à vos critères de recherche et filtrage.');
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'panel-card';
        emptyDiv.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 2.5rem;';
        emptyDiv.innerHTML = `
          <p class="text-muted" style="margin-bottom: 1rem; font-size: 0.95rem;">${noMatch}</p>
          <button class="btn btn-sm btn-outline" onclick="app.resetAnimalFilters()">
            ${this.t('btn_reset_filters') || '🔄 Réinitialiser'}
          </button>
        `;
        grid.appendChild(emptyDiv);
      }
      return;
    }

    // Imputation financière rigoureusement calculée selon la fenêtre temporelle de présence de chaque lot
    const allFinancials = this.calculateAllLotsFinancials();

    filtered.forEach(animal => {
      const fin = allFinancials[animal.id] || {};
      const isClosed = fin.isClosed !== undefined ? fin.isClosed : ((Number(animal.currentQuantity) || 0) <= 0);
      const daysSinceArrival = isClosed
        ? Math.max(1, this.calculateDaysBetween(fin.arrivalDate || animal.birthDate, fin.exitDate || animal.exitDate || this.getTodayStr()))
        : this.calculateAgeInDays(animal.birthDate);
      const arrivalAgeDays = Number(animal.arrivalAgeDays) || 0;
      const ageDays = daysSinceArrival + arrivalAgeDays;
      const ageText = this.formatAgeText(ageDays);
      const mortalityRate = animal.initialQuantity > 0 
        ? ((animal.mortality / animal.initialQuantity) * 100).toFixed(1) 
        : 0;
      const feedData = this.getAgronomicFeedData(animal.species, ageDays, animal.stage, animal.breed);

      // Valeurs financières rigoureusement imputées :
      // Tout stock épuisé ou distribué avant arrivalDate a un impact strictement nul (0,000 DT)
      const directLotExpenses = fin.directLotExpenses || 0;
      const allocatedGeneral = (fin.allocatedFeed || 0) + (fin.allocatedOther || 0);
      const totalAcquisition = fin.totalAcquisition || 0;
      const currentLivingAcquisition = fin.currentLivingAcquisition || 0;
      const totalLotExpenses = fin.totalLotExpenses || 0;
      const totalInvested = fin.totalInvested || 0;
      const costPerCurrentHead = fin.costPerCurrentHead || 0;
      const feedCostPerHead = (Number(animal.currentQuantity) > 0) ? ((fin.allocatedFeed || 0) / Number(animal.currentQuantity)) : 0;
      const acqCostPerHead = Number(animal.costPerHead) || 0;
      const otherCostPerHead = (Number(animal.currentQuantity) > 0) ? (((fin.directLotExpenses || 0) + (fin.allocatedOther || 0)) / Number(animal.currentQuantity)) : 0;

      const avatarIcon = this.getSpeciesIcon(animal.species);
      const effectiveStage = this.getEffectiveAnimalStage(animal);
      const stageBadgeClass = this.getStageBadgeClass(effectiveStage);
      const lossesWord = isAr ? 'خسائر' : (isEn ? 'losses' : 'pertes');
      const agronomicStageLabel = isAr ? feedData.labelAr : (isEn ? feedData.labelEn : feedData.labelFr);

      const cardTitle = this.getAnimalDisplayName(animal);
      const breed = (animal.breed || '').toString().trim();
      const hasBreed = breed !== '' && breed !== '-';
      const speciesLabel = this.translateSpecies(animal.species);
      const lotIdentifierLabel = (animal.name && animal.name.toString().trim() !== '')
        ? (isAr ? `دفعة #${animal.name}` : `Lot #${animal.name}`)
        : '';

      const subtitleItems = [];
      if (hasBreed) {
        subtitleItems.push(speciesLabel);
      }
      if (lotIdentifierLabel) {
        subtitleItems.push(lotIdentifierLabel);
      }
      const cardSubtitle = subtitleItems.join(' &bull; ');

      const card = document.createElement('div');

      if (isClosed) {
        // Vue Lot Clôturé / Vendu
        const lotSales = (appState.sales || []).filter(s => s.linkedLotId === animal.id);
        const totalSoldQty = lotSales.reduce((s, x) => s + (Number(x.quantity) || 0), 0);
        const totalRevenue = lotSales.reduce((s, x) => s + (Number(x.total) || 0), 0);
        const netProfit = totalRevenue - totalInvested;
        const marginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

        card.className = 'animal-card animal-card-closed';
        card.innerHTML = `
          <div class="animal-card-header">
            <div class="animal-title-group">
              <div class="animal-avatar">${avatarIcon}</div>
              <div>
                <h3 class="animal-name">${cardTitle}</h3>
                ${cardSubtitle ? `<p class="animal-breed">${cardSubtitle}</p>` : ''}
              </div>
            </div>
            <span class="badge-pill" style="background: rgba(148, 163, 184, 0.15); color: var(--text-muted); font-size: 0.72rem; font-weight: 700;">
              📦 ${isAr ? 'دفعة منتهية (مباعة 100%)' : 'Lot clôturé (100% Vendu)'}
            </span>
          </div>

          <div class="animal-stats-grid">
            <div class="animal-stat-col">
              <span class="lbl">${isAr ? 'مدة التربية' : 'Durée d\'élevage'}</span>
              <span class="val text-muted">${ageText}</span>
            </div>
            <div class="animal-stat-col">
              <span class="lbl">${this.t('card_current_count')}</span>
              <span class="val text-muted">0 / ${animal.initialQuantity}</span>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                ${totalSoldQty} ${isAr ? 'مباع' : 'vendus'} • ${animal.mortality || 0} ${lossesWord}
              </div>
            </div>
            <div class="animal-stat-col">
              <span class="lbl">${isAr ? 'مجموع المبيعات' : 'Recette totale'}</span>
              <span class="val text-emerald bold">${this.formatMoney(totalRevenue)}</span>
            </div>
            <div class="animal-stat-col" style="cursor: pointer;" onclick="app.openEditAnimalModal('${animal.id}')" title="Modifier le lot">
              <span class="lbl">${isAr ? 'الربح الصافي المحقق' : 'Bénéfice réalisé'}</span>
              <span class="val ${netProfit >= 0 ? 'text-emerald' : 'text-rose'} bold">
                ${(netProfit >= 0 ? '+' : '') + this.formatMoney(netProfit)}
              </span>
              <div style="font-size: 0.72rem; font-weight: 700; margin-top: 3px; color: var(--text-secondary);">
                <span>${this.t('card_total_cost') || (isAr ? 'التكلفة الإجمالية:' : 'Coût Total :')}</span>
                <strong style="color: var(--accent-amber);">${this.formatMoney(totalInvested)}</strong> (${Number(marginPct) >= 0 ? '+' : ''}${marginPct}%)
              </div>
            </div>
          </div>

          <div class="animal-notes-bar" style="margin-top: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <small class="text-muted">✅ ${isAr ? 'تم بيع هذه الدفعة بالكامل. جميع المعاملات المالية محفوظة.' : 'Lot entièrement vendu. Données financières et historiques conservées.'}</small>
          </div>

          <div class="animal-card-actions" style="margin-top: 0.65rem;">
            <button type="button" class="btn btn-sm btn-secondary flex-1" title="Modifier le lot" onclick="app.openEditAnimalModal('${animal.id}')">
              ✏️ ${isAr ? 'تعديل' : 'Modifier'}
            </button>
            <button type="button" class="btn btn-sm btn-danger-outline" title="Supprimer définitivement" onclick="app.openDeleteAnimalModal('${animal.id}')">
              🗑️
            </button>
          </div>
        `;
      } else {
        // Vue Lot Actif standard
        card.className = 'animal-card';
        card.innerHTML = `
          <div class="animal-card-header">
            <div class="animal-title-group">
              <div class="animal-avatar">${avatarIcon}</div>
              <div>
                <h3 class="animal-name">${cardTitle}</h3>
                ${cardSubtitle ? `<p class="animal-breed">${cardSubtitle}</p>` : ''}
              </div>
            </div>
            <span class="stage-badge ${stageBadgeClass}">${this.translateStage(effectiveStage)}</span>
          </div>

          <div class="animal-stats-grid">
            <div class="animal-stat-col">
              <span class="lbl">${this.t('card_age_real')}</span>
              <span class="val text-emerald">${ageText}</span>
              ${arrivalAgeDays > 0 ? `<div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 1px;">${isAr ? `${daysSinceArrival} يوماً بالمزرعة (وصل بعمر ${arrivalAgeDays} يوم)` : (isEn ? `${daysSinceArrival} d on farm (arrived at ${arrivalAgeDays} d)` : `${daysSinceArrival} j sur ferme (arrivé à ${arrivalAgeDays} j)`)}</div>` : ''}
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
              <div style="font-size: 0.69rem; color: var(--text-muted); margin-top: 2px; line-height: 1.35; display: flex; flex-direction: column;">
                <span>${isAr ? `شراء: ${this.formatMoney(acqCostPerHead)}` : (isEn ? `Purchase: ${this.formatMoney(acqCostPerHead)}` : `Achat: ${this.formatMoney(acqCostPerHead)}`)}</span>
                <span>${isAr ? `علف: ${this.formatMoney(feedCostPerHead)}` : (isEn ? `Feed: ${this.formatMoney(feedCostPerHead)}` : `Alim: ${this.formatMoney(feedCostPerHead)}`)}</span>
                ${otherCostPerHead > 0.001 ? `<span>${isAr ? `أخرى: ${this.formatMoney(otherCostPerHead)}` : (isEn ? `Other: ${this.formatMoney(otherCostPerHead)}` : `Autre: ${this.formatMoney(otherCostPerHead)}`)}</span>` : ''}
              </div>
              <div style="font-size: 0.74rem; font-weight: 700; margin-top: 2px; color: var(--text-secondary);">
                <span>${this.t('card_total_cost') || (isAr ? 'التكلفة الإجمالية:' : 'Coût Total :')}</span>
                <strong style="color: var(--accent-amber); font-weight: 800; display: inline-block; margin-inline-start: 3px;">${this.formatMoney(totalInvested)}</strong>
              </div>
            </div>
          </div>

          ${(animal.notes && animal.notes.toString().trim() !== '' && animal.notes.toString().trim() !== '-' && animal.notes.toString().trim().toLowerCase() !== 'aucune note particulière' && animal.notes.toString().trim().toLowerCase() !== 'no specific notes' && animal.notes.toString().trim() !== 'لا توجد ملاحظات') ? `
          <div class="animal-notes-bar" style="margin-top: 0.5rem;">
            <small class="text-muted">${animal.notes.toString().trim()}</small>
          </div>` : ''}

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
      }
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
    if (qtySelect) qtySelect.value = 'active';
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
    this.populateAnimalSpeciesOptions('editAnimalSpecies', sp);

    // Pré-sélectionner le statut d'arrivée selon l'âge à l'achat d'origine du lot (arrivalAgeDays)
    const stagePresetSelect = document.getElementById('editAnimalStageSelect');
    if (stagePresetSelect) {
      const arrivalAgeDays = (animal.arrivalAgeDays !== undefined && animal.arrivalAgeDays !== null)
        ? Math.max(0, parseInt(animal.arrivalAgeDays, 10) || 0)
        : 0;

      if (sp === 'vache_laitiere') {
        if (animal.stage === 'Tarie') stagePresetSelect.value = 'vache_tarie';
        else if (animal.stage === 'Gestante') stagePresetSelect.value = 'genisse_gestante';
        else if (animal.stage === 'Réforme') stagePresetSelect.value = 'vache_reforme';
        else if (arrivalAgeDays <= 90) stagePresetSelect.value = 'veau_femelle';
        else if (arrivalAgeDays < 450) stagePresetSelect.value = 'genisse_croissance';
        else stagePresetSelect.value = 'vache_lactation';
      } else if (sp === 'taurillon' || sp === 'bovin_viande') {
        if (animal.stage === 'Reproducteur') stagePresetSelect.value = 'taureau_reproducteur';
        else if (arrivalAgeDays <= 90) stagePresetSelect.value = 'veau_male';
        else if (arrivalAgeDays < 270) stagePresetSelect.value = 'taurillon_croissance';
        else if (arrivalAgeDays < 450) stagePresetSelect.value = 'taurillon_engraissement';
        else stagePresetSelect.value = 'taurillon_finition';
      } else if (sp === 'veau') {
        if (arrivalAgeDays <= 21) stagePresetSelect.value = 'veau_lactation';
        else if (arrivalAgeDays <= 60) stagePresetSelect.value = 'veau_pre_sevrage';
        else if (arrivalAgeDays <= 120) stagePresetSelect.value = 'veau_sevre';
        else stagePresetSelect.value = 'broutard';
      } else if (sp === 'bovin_autre' || sp === 'bovin') {
        if (arrivalAgeDays <= 60) stagePresetSelect.value = 'bovin_veau';
        else if (arrivalAgeDays < 365) stagePresetSelect.value = 'bovin_croissance';
        else stagePresetSelect.value = 'bovin_adulte';
      } else if (sp === 'mouton' || sp === 'belier') {
        if (animal.stage === 'Reproducteur') stagePresetSelect.value = 'belier_reproducteur';
        else if (arrivalAgeDays < 200) stagePresetSelect.value = 'mouton_engraissement';
        else stagePresetSelect.value = 'mouton_finition';
      } else if (sp === 'brebis') {
        if (animal.stage === 'Tarie') stagePresetSelect.value = 'brebis_tarie';
        else if (animal.stage === 'Gestante') stagePresetSelect.value = 'brebis_gestante';
        else if (animal.stage === 'Réforme') stagePresetSelect.value = 'brebis_reforme';
        else if (arrivalAgeDays < 300) stagePresetSelect.value = 'agnela_renouvellement';
        else stagePresetSelect.value = 'brebis_lactation';
      } else if (sp === 'agneau') {
        if (arrivalAgeDays <= 30) stagePresetSelect.value = 'agneau_lait';
        else if (arrivalAgeDays <= 90) stagePresetSelect.value = 'agneau_sevre';
        else stagePresetSelect.value = 'agneau_engraissement';
      } else if (sp === 'chevre') {
        if (animal.stage === 'Tarie') stagePresetSelect.value = 'chevre_tarie';
        else if (animal.stage === 'Gestante') stagePresetSelect.value = 'chevre_gestante';
        else if (animal.stage === 'Réforme') stagePresetSelect.value = 'chevre_reforme';
        else if (arrivalAgeDays < 300) stagePresetSelect.value = 'chevrette_croissance';
        else stagePresetSelect.value = 'chevre_lactation';
      } else if (sp === 'chevreau') {
        if (arrivalAgeDays <= 30) stagePresetSelect.value = 'chevreau_lait';
        else if (arrivalAgeDays <= 90) stagePresetSelect.value = 'chevreau_sevre';
        else stagePresetSelect.value = 'chevreau_engraissement';
      } else if (sp === 'canard' || sp === 'canard_barbarie') {
        if (arrivalAgeDays <= 21) stagePresetSelect.value = 'caneton_demarrage';
        else if (arrivalAgeDays < 150) stagePresetSelect.value = 'canard_croissance';
        else stagePresetSelect.value = 'canard_adulte';
      } else if (sp === 'poulet') {
        if (arrivalAgeDays <= 28) stagePresetSelect.value = 'poussin';
        else if (arrivalAgeDays < 180) stagePresetSelect.value = 'croissance';
        else if (animal.stage === 'Coq' || (animal.breed && animal.breed.toLowerCase().includes('coq'))) stagePresetSelect.value = 'coq';
        else stagePresetSelect.value = 'pondeuse';
      } else if (sp === 'pintade') {
        if (arrivalAgeDays <= 28) stagePresetSelect.value = 'pintadeau';
        else if (arrivalAgeDays < 180) stagePresetSelect.value = 'pintade_croissance';
        else stagePresetSelect.value = 'pintade_adulte';
      } else {
        if (arrivalAgeDays <= 28) stagePresetSelect.value = 'autre_demarrage';
        else if (arrivalAgeDays < 180) stagePresetSelect.value = 'autre_croissance';
        else stagePresetSelect.value = 'autre_adulte';
      }
      this.handleAnimalStagePresetChange(stagePresetSelect.value, 'editAnimal');

      // Remplir rigoureusement l'ÂGE À L'ACHAT (arrivalAgeDays) d'origine, JAMAIS l'âge total actuel
      const editAgeVal = document.getElementById('editAnimalArrivalAgeValue');
      const editAgeUnit = document.getElementById('editAnimalArrivalAgeUnit');
      const hiddenDays = document.getElementById('editAnimalArrivalAgeDays');
      if (editAgeVal && editAgeUnit) {
        if (arrivalAgeDays === 0) {
          editAgeUnit.value = 'jours';
          editAgeVal.value = '0';
        } else if (arrivalAgeDays >= 365) {
          editAgeUnit.value = 'ans';
          const yrs = (arrivalAgeDays / 365).toFixed(1);
          editAgeVal.value = yrs.endsWith('.0') ? parseInt(yrs, 10) : yrs;
        } else if (arrivalAgeDays >= 30) {
          editAgeUnit.value = 'mois';
          const mos = (arrivalAgeDays / 30.5).toFixed(1);
          editAgeVal.value = mos.endsWith('.0') ? parseInt(mos, 10) : mos;
        } else {
          editAgeUnit.value = 'jours';
          editAgeVal.value = arrivalAgeDays;
        }
      }
      if (hiddenDays) {
        hiddenDays.value = arrivalAgeDays;
      }
      this.updateArrivalAgePreview('editAnimal');
    }

    this.openModal('modalEditAnimal');
  },

  handleSaveEditAnimal(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const id = document.getElementById('editAnimalId')?.value;
      const animal = (appState.animals || []).find(a => a.id === id);
      if (!animal) return;

      const species = document.getElementById('editAnimalSpecies')?.value || animal.species || 'poulet';
      const name = (document.getElementById('editAnimalName')?.value || '').trim();
      const breed = (document.getElementById('editAnimalBreed')?.value || '').trim() || '-';
      const quantity = Math.max(1, parseInt(document.getElementById('editAnimalQuantity')?.value, 10) || animal.currentQuantity || 1);
      const birthDate = document.getElementById('editAnimalBirthDate')?.value || animal.birthDate;
      const arrivalAgeVal = document.getElementById('editAnimalArrivalAgeDays')?.value;
      const editStagePresetSelect = document.getElementById('editAnimalStageSelect');
      let editPresetDefaultDays = 0;
      if (editStagePresetSelect) {
        const opt = editStagePresetSelect.options[editStagePresetSelect.selectedIndex];
        if (opt && opt.getAttribute('data-days') !== null) {
          editPresetDefaultDays = parseInt(opt.getAttribute('data-days'), 10) || 0;
        }
      }
      const arrivalAgeDays = (arrivalAgeVal !== '' && !isNaN(parseInt(arrivalAgeVal, 10))) 
        ? Math.max(0, parseInt(arrivalAgeVal, 10)) 
        : (animal.arrivalAgeDays !== undefined && animal.arrivalAgeDays !== null && animal.arrivalAgeDays > 0 ? animal.arrivalAgeDays : editPresetDefaultDays);
      const stage = document.getElementById('editAnimalStage')?.value || animal.stage || 'Croissance';
      const costVal = document.getElementById('editAnimalCostPerHead')?.value;
      const costPerHead = (costVal === '' || isNaN(parseFloat(costVal))) ? 0 : Math.max(0, parseFloat(costVal));
      const notes = (document.getElementById('editAnimalNotes')?.value || '').trim();

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
    } catch (err) {
      console.error('handleSaveEditAnimal failed:', err);
      const isAr = (appState.lang || this.currentLang) === 'ar';
      const isEn = (appState.lang || this.currentLang) === 'en';
      const errPrefix = isAr ? 'خطأ: ' : (isEn ? 'Error: ' : 'Erreur : ');
      this.showToast(errPrefix + err.message, 'danger');
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

  // Met à jour en direct le calcul de l'âge d'arrivée (jours / mois / années)
  updateArrivalAgePreview(formPrefix = 'animal') {
    const valInput = document.getElementById(`${formPrefix}ArrivalAgeValue`);
    const unitSelect = document.getElementById(`${formPrefix}ArrivalAgeUnit`);
    const hiddenDays = document.getElementById(`${formPrefix}ArrivalAgeDays`);
    const hintEl = document.getElementById(`${formPrefix}ArrivalAgeHint`);
    const stagePresetSelect = document.getElementById(`${formPrefix}StageSelect`);
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    let presetDefaultDays = 0;
    if (stagePresetSelect) {
      const opt = stagePresetSelect.options[stagePresetSelect.selectedIndex];
      if (opt && opt.getAttribute('data-days') !== null) {
        presetDefaultDays = parseInt(opt.getAttribute('data-days'), 10) || 0;
      }
    }

    const rawVal = valInput ? valInput.value.trim() : '';
    const unit = unitSelect ? unitSelect.value : 'mois';

    let totalDays = 0;
    let isCalculated = false;

    if (rawVal !== '' && !isNaN(parseFloat(rawVal))) {
      const num = Math.max(0, parseFloat(rawVal));
      if (unit === 'ans') {
        totalDays = Math.round(num * 365);
      } else if (unit === 'mois') {
        totalDays = Math.round(num * 30.5);
      } else {
        totalDays = Math.round(num);
      }
      isCalculated = true;
    } else {
      totalDays = presetDefaultDays;
    }

    if (hiddenDays) {
      hiddenDays.value = totalDays;
    }

    if (hintEl) {
      if (isCalculated) {
        const inMonths = (totalDays / 30.5).toFixed(1);
        const inYears = (totalDays / 365).toFixed(1);
        let baseMsg = '';
        if (totalDays >= 365) {
          baseMsg = isAr 
            ? `💡 محسوب عند الوصول: ${totalDays} يوم (~${inMonths} شهر / ~${inYears} سنة)` 
            : (isEn ? `💡 At arrival: ${totalDays} days (~${inMonths} mos / ~${inYears} yrs)` : `💡 À l'arrivée : ${totalDays} jours (~${inMonths} mois / ~${inYears} an)`);
        } else if (totalDays >= 30) {
          baseMsg = isAr 
            ? `💡 محسوب عند الوصول: ${totalDays} يوم (~${inMonths} شهر)` 
            : (isEn ? `💡 At arrival: ${totalDays} days (~${inMonths} mos)` : `💡 À l'arrivée : ${totalDays} jours (~${inMonths} mois)`);
        } else {
          baseMsg = isAr 
            ? `💡 محسوب عند الوصول: ${totalDays} يوم` 
            : (isEn ? `💡 At arrival: ${totalDays} days` : `💡 À l'arrivée : ${totalDays} jours`);
        }

        if (formPrefix === 'editAnimal') {
          const editId = document.getElementById('editAnimalId')?.value;
          const editAnimal = (appState.animals || []).find(a => a.id === editId);
          if (editAnimal) {
            const birthDate = document.getElementById('editAnimalBirthDate')?.value || editAnimal.birthDate;
            const daysSince = this.calculateAgeInDays(birthDate);
            const currentRealAge = daysSince + totalDays;
            const realAgeText = this.formatAgeText(currentRealAge);
            baseMsg += isAr 
              ? ` • 🟢 العمر الفعلي اليوم: ${realAgeText}` 
              : (isEn ? ` • 🟢 Current real age: ${realAgeText}` : ` • 🟢 Âge réel actuel : ${realAgeText}`);
          }
        }

        hintEl.textContent = baseMsg;
        hintEl.style.color = 'var(--accent-emerald)';
      } else {
        if (totalDays > 0) {
          const m = Math.round(totalDays / 30);
          hintEl.textContent = isAr 
            ? `✨ تقدير ذكي تلقائي: ${totalDays} يوم (~${m} أشهر)` 
            : (isEn ? `✨ Smart auto-estimate: ${totalDays} days (~${m} mos)` : `✨ Estimation intelligente par défaut : ${totalDays} j (~${m} mois)`);
        } else {
          hintEl.textContent = isAr ? '✨ البداية: 0 يوم' : (isEn ? '✨ Starter: 0 days' : '✨ Âge de départ : 0 jour');
        }
        hintEl.style.color = 'var(--text-muted)';
      }
    }
  },

  // Gère le changement de l'espèce (1ère sélection)
  handleAnimalSpeciesChange(speciesVal = 'poulet', formPrefix = 'animal') {
    const stageSelect = document.getElementById(`${formPrefix}StageSelect`);
    if (!stageSelect) return;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const sp = (speciesVal || 'poulet').toLowerCase();

    let options = [];
    if (sp === 'vache_laitiere') {
      options = [
        {
          key: 'vache_lactation',
          days: 720,
          label: isAr ? '🐄 بقرة حلوب في إنتاج الحليب (~24 شهر)' : (isEn ? '🐄 Dairy cow in lactation (~24 mos)' : '🐄 Vache laitière en lactation (~24 mois)')
        },
        {
          key: 'vache_tarie',
          days: 720,
          label: isAr ? '🐄 بقرة شايحة / راحة قبل الولادة' : (isEn ? '🐄 Dry cow (pre-calving rest)' : '🐄 Vache tarie (repos pré-vêlage)')
        },
        {
          key: 'genisse_gestante',
          days: 540,
          label: isAr ? '🐄 عجلة عشار حامل (~18 شهر)' : (isEn ? '🐄 Pregnant heifer (~18 mos)' : '🐄 Génisse gestante (~18 mois)')
        },
        {
          key: 'genisse_croissance',
          days: 300,
          label: isAr ? '🐄 عجلة نمو وتكاثر (~10 أشهر)' : (isEn ? '🐄 Growing heifer (~10 mos)' : '🐄 Génisse de croissance (~10 mois)')
        },
        {
          key: 'veau_femelle',
          days: 60,
          label: isAr ? '🐄 عجل أنثى / ولة مفطومة (~2 شهر)' : (isEn ? '🐄 Weaned female calf (~2 mos)' : '🐄 Veau femelle sevrée (~2 mois)')
        },
        {
          key: 'vache_reforme',
          days: 720,
          label: isAr ? '🐄 بقرة تفريط / تسمين للذبح' : (isEn ? '🐄 Cull cow for meat' : '🐄 Vache de réforme (viande)')
        }
      ];
    } else if (sp === 'taurillon' || sp === 'bovin_viande') {
      options = [
        {
          key: 'taurillon_engraissement',
          days: 365,
          label: isAr ? '🐂 عجل تسمين مكثف (~12 شهر)' : (isEn ? '🐂 Fattening steer (~12 mos)' : '🐂 Taurillon engraissement (~12 mois)')
        },
        {
          key: 'taurillon_croissance',
          days: 180,
          label: isAr ? '🐂 عجل نمو أولي (~6 أشهر)' : (isEn ? '🐂 Growing steer (~6 mos)' : '🐂 Taurillon croissance (~6 mois)')
        },
        {
          key: 'taurillon_finition',
          days: 480,
          label: isAr ? '🐂 عجل مرحلة تشطيب اللحم (>16 شهر)' : (isEn ? '🐂 Finished bull (>16 mos)' : '🐂 Taurillon finition (>16 mois)')
        },
        {
          key: 'veau_male',
          days: 90,
          label: isAr ? '🐂 عجل فتي مفطوم (~3 أشهر)' : (isEn ? '🐂 Weaned bull calf (~3 mos)' : '🐂 Broutard / Veau sevré (~3 mois)')
        },
        {
          key: 'taureau_reproducteur',
          days: 720,
          label: isAr ? '🐂 ثور فحل للتلقيح (~24 شهر)' : (isEn ? '🐂 Breeding bull (~24 mos)' : '🐂 Taureau reproducteur (~24 mois)')
        }
      ];
    } else if (sp === 'veau') {
      options = [
        {
          key: 'veau_lactation',
          days: 0,
          label: isAr ? '🐂 عجل رضيع باللتر (0-21 يوم)' : (isEn ? '🐂 Nursing calf (0-21 days)' : '🐂 Veau au lait (0-21 jours)')
        },
        {
          key: 'veau_pre_sevrage',
          days: 30,
          label: isAr ? '🐂 عجل قبل الفطام (~1 شهر)' : (isEn ? '🐂 Pre-weaning calf (~1 mo)' : '🐂 Veau pré-sevrage (~1 mois)')
        },
        {
          key: 'veau_sevre',
          days: 90,
          label: isAr ? '🐂 عجل مفطوم أولي (~3 أشهر)' : (isEn ? '🐂 Weaned calf (~3 mos)' : '🐂 Veau sevré (~3 mois)')
        },
        {
          key: 'broutard',
          days: 150,
          label: isAr ? '🐂 عجل مفطوم نمو 4-6 أشهر' : (isEn ? '🐂 Feeder calf (4-6 mos)' : '🐂 Broutard 4-6 mois')
        }
      ];
    } else if (sp === 'bovin_autre' || sp === 'bovin') {
      options = [
        {
          key: 'bovin_adulte',
          days: 365,
          label: isAr ? '🐄 رأس بقر بالغ (>1 سنة)' : (isEn ? '🐄 Adult cattle (>1 yr)' : '🐄 Bovin adulte (>1 an)')
        },
        {
          key: 'bovin_croissance',
          days: 180,
          label: isAr ? '🐄 عجل نمو (~6 أشهر)' : (isEn ? '🐄 Growing cattle (~6 mos)' : '🐄 Jeune bovin croissance (~6 mois)')
        },
        {
          key: 'bovin_veau',
          days: 0,
          label: isAr ? '🐂 عجل رضيع بداية' : (isEn ? '🐂 Starter calf' : '🐂 Veau démarrage')
        }
      ];
    } else if (sp === 'mouton' || sp === 'belier') {
      options = [
        {
          key: 'mouton_engraissement',
          days: 180,
          label: isAr ? '🐑 خروف تسمين مكثف (~6 أشهر)' : (isEn ? '🐑 Fattening sheep (~6 mos)' : '🐑 Mouton engraissement (~6 mois)')
        },
        {
          key: 'mouton_finition',
          days: 270,
          label: isAr ? '🐑 خروف تشطيب لحم عيد / مذبح (~9 أشهر)' : (isEn ? '🐑 Market sheep (~9 mos)' : '🐑 Mouton finition boucherie (~9 mois)')
        },
        {
          key: 'belier_reproducteur',
          days: 720,
          label: isAr ? '🐑 كبش فحل للتلقيح (~24 شهر)' : (isEn ? '🐑 Adult breeding ram (~24 mos)' : '🐑 Bélier adulte reproducteur (~24 mois)')
        }
      ];
    } else if (sp === 'brebis') {
      options = [
        {
          key: 'brebis_lactation',
          days: 540,
          label: isAr ? '🐑 نعجة حلوب في إنتاج الحليب (~18 شهر)' : (isEn ? '🐑 Lactating dairy ewe (~18 mos)' : '🐑 Brebis en lactation (~18 mois)')
        },
        {
          key: 'brebis_gestante',
          days: 480,
          label: isAr ? '🐑 نعجة عشار حامل (~16 شهر)' : (isEn ? '🐑 Pregnant ewe (~16 mos)' : '🐑 Brebis gestante (~16 mois)')
        },
        {
          key: 'brebis_tarie',
          days: 420,
          label: isAr ? '🐑 نعجة شايحة / راحة قبل الولادة' : (isEn ? '🐑 Dry ewe (pre-lambing rest)' : '🐑 Brebis tarie (repos pré-agnelage)')
        },
        {
          key: 'agnela_renouvellement',
          days: 240,
          label: isAr ? '🐑 بركوسة تربية وتجديد القطيع (~8 أشهر)' : (isEn ? '🐑 Replacement ewe lamb (~8 mos)' : '🐑 Agnela renouvellement (~8 mois)')
        },
        {
          key: 'brebis_reforme',
          days: 720,
          label: isAr ? '🐑 نعجة تفريط للذبح' : (isEn ? '🐑 Cull ewe for meat' : '🐑 Brebis de réforme')
        }
      ];
    } else if (sp === 'agneau') {
      options = [
        {
          key: 'agneau_lait',
          days: 0,
          label: isAr ? '🐑 خروف رضيع باللتر (0-30 يوم)' : (isEn ? '🐑 Nursing lamb (0-30 days)' : '🐑 Agneau au lait (0-30 jours)')
        },
        {
          key: 'agneau_sevre',
          days: 60,
          label: isAr ? '🐑 خروف مفطوم (~2 شهر)' : (isEn ? '🐑 Weaned lamb (~2 mos)' : '🐑 Agneau sevré (~2 mois)')
        },
        {
          key: 'agneau_engraissement',
          days: 120,
          label: isAr ? '🐑 علوش تسمين مكثف (~4 أشهر)' : (isEn ? '🐑 Fattening lamb (~4 mos)' : '🐑 Agneau engraissement (~4 mois)')
        }
      ];
    } else if (sp === 'chevre') {
      options = [
        {
          key: 'chevre_lactation',
          days: 540,
          label: isAr ? '🐐 معزة حلوب في إنتاج الحليب (~18 شهر)' : (isEn ? '🐐 Lactating dairy goat (~18 mos)' : '🐐 Chèvre en lactation (~18 mois)')
        },
        {
          key: 'chevre_gestante',
          days: 480,
          label: isAr ? '🐐 معزة عشار حامل (~16 شهر)' : (isEn ? '🐐 Pregnant doe (~16 mos)' : '🐐 Chèvre gestante (~16 mois)')
        },
        {
          key: 'chevre_tarie',
          days: 420,
          label: isAr ? '🐐 معزة شايحة / راحة قبل الولادة' : (isEn ? '🐐 Dry doe (rest)' : '🐐 Chèvre tarie (repos)')
        },
        {
          key: 'chevrette_croissance',
          days: 240,
          label: isAr ? '🐐 سخلة نمو وتربية (~8 أشهر)' : (isEn ? '🐐 Growing doeling (~8 mos)' : '🐐 Chevrette croissance (~8 mois)')
        },
        {
          key: 'chevre_reforme',
          days: 720,
          label: isAr ? '🐐 معزة تفريط للذبح' : (isEn ? '🐐 Cull goat for meat' : '🐐 Chèvre de réforme')
        }
      ];
    } else if (sp === 'chevreau') {
      options = [
        {
          key: 'chevreau_lait',
          days: 0,
          label: isAr ? '🐐 جدي رضيع باللتر (0-30 يوم)' : (isEn ? '🐐 Nursing kid (0-30 days)' : '🐐 Chevreau au lait (0-30 jours)')
        },
        {
          key: 'chevreau_sevre',
          days: 60,
          label: isAr ? '🐐 جدي مفطوم (~2 شهر)' : (isEn ? '🐐 Weaned kid (~2 mos)' : '🐐 Chevreau sevré (~2 mois)')
        },
        {
          key: 'chevreau_engraissement',
          days: 120,
          label: isAr ? '🐐 جدي تسمين ولحم (~4 أشهر)' : (isEn ? '🐐 Fattening kid (~4 mos)' : '🐐 Chevreau engraissement (~4 mois)')
        }
      ];
    } else if (sp === 'ovin_autre' || sp === 'ovin' || sp === 'caprin') {
      options = [
        {
          key: 'ovin_adulte',
          days: 365,
          label: isAr ? '🌾 رأس غنم بالغ (>1 سنة)' : (isEn ? '🌾 Adult sheep/goat (>1 yr)' : '🌾 Ovin adulte (>1 an)')
        },
        {
          key: 'ovin_croissance',
          days: 180,
          label: isAr ? '🌾 خروف نمو (~6 أشهر)' : (isEn ? '🌾 Growing sheep (~6 mos)' : '🌾 Ovin croissance (~6 mois)')
        },
        {
          key: 'ovin_jeune',
          days: 0,
          label: isAr ? '🌾 خروف/جدي بداية' : (isEn ? '🌾 Starter lamb/kid' : '🌾 Agneau/Chevreau démarrage')
        }
      ];
    } else if (sp === 'canard' || sp === 'canard_barbarie') {
      options = [
        {
          key: 'caneton_demarrage',
          days: 0,
          label: isAr ? '🐣 فراخ بط بداية (J1–J21)' : (isEn ? '🐣 Duckling starter (d1-21)' : '🐣 Caneton démarrage (J1–J21)')
        },
        {
          key: 'canard_croissance',
          days: 30,
          label: isAr ? '🦆 بط نمو (~1 شهر)' : (isEn ? '🦆 Growing duck (~1 mo)' : '🦆 Canard croissance (~1 mois)')
        },
        {
          key: 'canard_adulte_mâle',
          days: 150,
          label: isAr ? '🦆 ذكر بط بالغ (فحل)' : (isEn ? '🦆 Adult Drake (male)' : '🦆 Canard adulte mâle (5kg)')
        },
        {
          key: 'canard_ponte',
          days: 150,
          label: isAr ? '🦆 أنثى بط بالغة (بياضة)' : (isEn ? '🦆 Adult Female Duck (layer)' : '🦆 Canne adulte femelle (ponte)')
        }
      ];
    } else if (sp === 'pintade') {
      options = [
        {
          key: 'pintadeau',
          days: 0,
          label: isAr ? '🐣 كتاكيت دجاج الوادي (J1–J28)' : (isEn ? '🐣 Guinea keets (d1-28)' : '🐣 Pintadeau démarrage (J1–J28)')
        },
        {
          key: 'pintade_croissance',
          days: 30,
          label: isAr ? '🪶 دجاج الوادي نمو (~1 شهر)' : (isEn ? '🪶 Growing guinea (~1 mo)' : '🪶 Pintade croissance (~1 mois)')
        },
        {
          key: 'pintade_ponte',
          days: 180,
          label: isAr ? '🪶 دجاج الوادي بياضة (~6 أشهر)' : (isEn ? '🪶 Laying guinea fowl (~6 mos)' : '🪶 Pintade pondeuse (~6 mois)')
        },
        {
          key: 'pintade_adulte',
          days: 150,
          label: isAr ? '🪶 دجاج الوادي بالغ لحم (~5 أشهر)' : (isEn ? '🪶 Adult guinea meat (~5 mos)' : '🪶 Pintade adulte chair (~5 mois)')
        }
      ];
    } else if (sp === 'caille') {
      options = [
        {
          key: 'cailleteau',
          days: 0,
          label: isAr ? '🐣 فرخ السمان بداية (J1–J14)' : (isEn ? '🐣 Quail chick (d1-14)' : '🐣 Cailleteau démarrage (J1–J14)')
        },
        {
          key: 'caille_croissance',
          days: 15,
          label: isAr ? '🐦 سمان نمو (~2 أسبوع)' : (isEn ? '🐦 Growing quail (~2 wks)' : '🐦 Caille croissance (~2 sem)')
        },
        {
          key: 'caille_ponte',
          days: 45,
          label: isAr ? '🥚 سمان بياضة بالغة (~1.5 شهر)' : (isEn ? '🥚 Laying quail (~1.5 mos)' : '🥚 Caille pondeuse (~1.5 mois)')
        },
        {
          key: 'caille_adulte',
          days: 45,
          label: isAr ? '🐦 سمان بالغ لحم (~1.5 شهر)' : (isEn ? '🐦 Adult meat quail (~1.5 mos)' : '🐦 Caille adulte chair (~1.5 mois)')
        }
      ];
    } else if (sp === 'dinde') {
      options = [
        {
          key: 'dindonneau',
          days: 0,
          label: isAr ? '🐣 كتكوت رومي بداية' : (isEn ? '🐣 Turkey poult starter' : '🐣 Dindonneau démarrage')
        },
        {
          key: 'dinde_croissance',
          days: 30,
          label: isAr ? '🦃 ديك رومي نمو (~1 شهر)' : (isEn ? '🦃 Growing turkey (~1 mo)' : '🦃 Dinde croissance (~1 mois)')
        },
        {
          key: 'dinde_adulte',
          days: 150,
          label: isAr ? '🦃 ديك رومي بالغ (~5 أشهر)' : (isEn ? '🦃 Adult turkey (~5 mos)' : '🦃 Dinde adulte (~5 mois)')
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
          label: isAr ? '🐥 مرحلة النمو (~1 شهر)' : (isEn ? '🐥 Growing (~1 mo)' : '🐥 Croissance (~1 mois)')
        },
        {
          key: 'autre_adulte',
          days: 180,
          label: isAr ? '🦃 طيور بالغة (~6 أشهر)' : (isEn ? '🦃 Adult (~6 mos)' : '🦃 Adulte (~6 mois)')
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
          label: isAr ? '🐥 دجاج نمو / فرارج (~1 شهر)' : (isEn ? '🐥 Growing chicken (~1 mo)' : '🐥 Poulet croissance (~1 mois)')
        },
        {
          key: 'pondeuse',
          days: 180,
          label: isAr ? '🐓 دجاجة بياضة (~6 أشهر)' : (isEn ? '🐓 Laying hen (~6 mos)' : '🐓 Poule pondeuse (~6 mois)')
        },
        {
          key: 'coq',
          days: 210,
          label: isAr ? '🐓 سردوك بالغ (~7 أشهر)' : (isEn ? '🐓 Adult rooster (~7 mos)' : '🐓 Coq adulte (~7 mois)')
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
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    let defaultDays = 0;
    let stageName = 'Croissance';

    if (presetKey === 'veau_lactation' || presetKey === 'bovin_veau' || presetKey === 'poussin' || presetKey === 'caneton_demarrage' || presetKey === 'cailleteau' || presetKey === 'dindonneau' || (presetKey && presetKey.includes('demarrage')) || presetKey === 'pintadeau') {
      defaultDays = 0;
      stageName = 'Démarrage';
    } else if (presetKey === 'veau_pre_sevrage') {
      defaultDays = 30;
      stageName = 'Pré-sevrage';
    } else if (presetKey === 'veau_sevre' || presetKey === 'veau_male' || presetKey === 'veau_femelle') {
      defaultDays = 90;
      stageName = 'Croissance';
    } else if (presetKey === 'broutard' || presetKey === 'taurillon_croissance' || presetKey === 'bovin_croissance') {
      defaultDays = 180;
      stageName = 'Croissance';
    } else if (presetKey === 'genisse_croissance') {
      defaultDays = 300;
      stageName = 'Croissance';
    } else if (presetKey === 'taurillon_engraissement') {
      defaultDays = 365;
      stageName = 'Finition';
    } else if (presetKey === 'taurillon_finition') {
      defaultDays = 480;
      stageName = 'Finition';
    } else if (presetKey === 'genisse_gestante') {
      defaultDays = 540;
      stageName = 'Gestante';
    } else if (presetKey === 'vache_tarie') {
      defaultDays = 720;
      stageName = 'Tarie';
    } else if (presetKey === 'vache_lactation') {
      defaultDays = 720;
      stageName = 'Lactation';
    } else if (presetKey === 'taureau_reproducteur') {
      defaultDays = 720;
      stageName = 'Reproducteur';
    } else if (presetKey === 'vache_reforme') {
      defaultDays = 720;
      stageName = 'Réforme';
    } else if (presetKey === 'bovin_adulte') {
      defaultDays = 365;
      stageName = 'Adulte';
    } else if (presetKey === 'agneau_lait' || presetKey === 'chevreau_lait' || presetKey === 'ovin_jeune') {
      defaultDays = 0;
      stageName = 'Démarrage';
    } else if (presetKey === 'agneau_sevre' || presetKey === 'chevreau_sevre') {
      defaultDays = 60;
      stageName = 'Croissance';
    } else if (presetKey === 'agneau_engraissement' || presetKey === 'chevreau_engraissement') {
      defaultDays = 120;
      stageName = 'Finition';
    } else if (presetKey === 'mouton_engraissement') {
      defaultDays = 180;
      stageName = 'Finition';
    } else if (presetKey === 'mouton_finition') {
      defaultDays = 270;
      stageName = 'Finition';
    } else if (presetKey === 'belier_reproducteur') {
      defaultDays = 720;
      stageName = 'Reproducteur';
    } else if (presetKey === 'brebis_lactation' || presetKey === 'chevre_lactation') {
      defaultDays = 540;
      stageName = 'Lactation';
    } else if (presetKey === 'brebis_gestante' || presetKey === 'chevre_gestante') {
      defaultDays = 480;
      stageName = 'Gestante';
    } else if (presetKey === 'brebis_tarie' || presetKey === 'chevre_tarie') {
      defaultDays = 420;
      stageName = 'Tarie';
    } else if (presetKey === 'agnela_renouvellement' || presetKey === 'chevrette_croissance') {
      defaultDays = 240;
      stageName = 'Croissance';
    } else if (presetKey === 'brebis_reforme' || presetKey === 'chevre_reforme') {
      defaultDays = 720;
      stageName = 'Réforme';
    } else if (presetKey === 'ovin_adulte') {
      defaultDays = 365;
      stageName = 'Adulte';
    } else if (presetKey === 'caille_croissance') {
      defaultDays = 15;
      stageName = 'Croissance';
    } else if (presetKey === 'caille_ponte') {
      defaultDays = 45;
      stageName = 'Ponte';
    } else if (presetKey === 'caille_adulte') {
      defaultDays = 45;
      stageName = 'Adulte';
    } else if (presetKey === 'croissance' || (presetKey && presetKey.includes('croissance'))) {
      defaultDays = 30;
      stageName = 'Croissance';
    } else if (presetKey === 'pondeuse' || presetKey === 'pintade_ponte' || presetKey === 'canard_ponte') {
      defaultDays = 180;
      stageName = 'Ponte';
    } else if (presetKey === 'coq') {
      defaultDays = 210;
      stageName = 'Adulte';
    } else if (presetKey === 'canard_adulte' || presetKey === 'canard_adulte_mâle' || presetKey === 'pintade_adulte' || presetKey === 'dinde_adulte' || presetKey === 'autre_adulte') {
      defaultDays = 180;
      stageName = 'Adulte';
    } else {
      defaultDays = 180;
      stageName = 'Adulte';
    }

    if (arrivalAgeInput) {
      if (defaultDays > 0) {
        const months = Math.round(defaultDays / 30);
        arrivalAgeInput.placeholder = isAr 
          ? `تلقائياً: ${defaultDays} يوم (~${months} أشهر إذا ترك فارغاً)`
          : (isEn ? `Default: ${defaultDays} days (~${months} mos if empty)` : `Par défaut : ${defaultDays} j (~${months} mois si vide)`);
      } else {
        arrivalAgeInput.placeholder = isAr ? '0 يوم (كتاكيت بداية)' : (isEn ? '0 days (chicks)' : '0 jour (poussin démarrage)');
      }
    }
    if (hiddenStage) {
      hiddenStage.value = stageName;
    }

    const valInput = document.getElementById(`${formPrefix}ArrivalAgeValue`);
    const unitSelect = document.getElementById(`${formPrefix}ArrivalAgeUnit`);
    if (valInput && valInput.value === '') {
      if (defaultDays >= 365) {
        if (unitSelect) unitSelect.value = 'ans';
      } else if (defaultDays >= 30) {
        if (unitSelect) unitSelect.value = 'mois';
      } else {
        if (unitSelect) unitSelect.value = 'jours';
      }
    }
    this.updateArrivalAgePreview(formPrefix);

    const banner = document.getElementById(`${formPrefix}PortionBanner`);
    if (banner) banner.remove();
  },

  handleSaveAnimal(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const species = document.getElementById('animalSpecies')?.value || 'poulet';
      const breedInput = (document.getElementById('animalBreed')?.value || '').trim();
      const nameInput = (document.getElementById('animalName')?.value || '').trim();
      const rawQty = document.getElementById('animalQuantity')?.value;
      const quantity = Math.max(1, parseInt(rawQty, 10) || 1);
      const birthDate = document.getElementById('animalBirthDate')?.value || this.getTodayStr();

      this.updateArrivalAgePreview('animal');
      const arrivalAgeDays = parseInt(document.getElementById('animalArrivalAgeDays')?.value, 10) || 0;
      
      // Accepte explicitement 0 pour les animaux gratuits / éclos
      const rawCost = document.getElementById('animalCostPerHead')?.value || '';
      const parsedCost = parseFloat(rawCost);
      const costPerHead = (rawCost === '' || isNaN(parsedCost)) ? 0 : Math.max(0, parsedCost);

      const stage = document.getElementById('animalStage')?.value || 'Croissance';
      const notes = (document.getElementById('animalNotes')?.value || '').trim();

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

      const availableStock = this.getAvailableFeedStockKg();
      if (availableStock <= 0) {
        const isAr = appState.lang === 'ar';
        const isEn = appState.lang === 'en';
        this.confirmDialog({
          title: isAr ? '⚠️ مخزون الأعلاف فارغ (0 كغ)' : (isEn ? '⚠️ Feed Stock Empty (0 kg)' : '⚠️ Stock d\'aliment épuisé (0 kg)'),
          message: isAr 
            ? `تم حفظ الدفعة "${this.getAnimalDisplayName(newAnimal)}" بنجاح. لا يوجد حالياً أي مخزون علف في المستودع (جميع الأكياس السابقة مغلقة ومستهلكة).\n\nهل ترغب في تسجيل شراء علف لتغذية هذا الفوج الآن ؟` 
            : (isEn 
                ? `Batch "${this.getAnimalDisplayName(newAnimal)}" was saved successfully. There is currently 0 kg of feed stock in reserve (all previous stocks are closed).\n\nWould you like to record a feed purchase to feed this batch now?` 
                : `Le lot "${this.getAnimalDisplayName(newAnimal)}" a été enregistré avec succès. Il n'existe actuellement aucun stock d'aliment en réserve (0 kg, les cycles précédents étant épuisés).\n\nSouhaitez-vous enregistrer un achat d'aliment pour approvisionner le stock dès maintenant ?`),
          confirmText: isAr ? '🛒 شراء وتزويد العلف' : (isEn ? '🛒 Record Feed Purchase' : '🛒 Enregistrer un Achat d\'Aliment'),
          cancelText: isAr ? 'لاحقاً' : (isEn ? 'Later' : 'Plus tard'),
          onConfirm: () => {
            this.openFeedPurchaseModal();
          }
        });
      }

      const form = document.getElementById('formAddAnimal');
      if (form) form.reset();
      const costHead = document.getElementById('animalCostPerHead');
      if (costHead) { costHead.value = ''; costHead.placeholder = ''; }
      const arrAge = document.getElementById('animalArrivalAgeDays');
      if (arrAge) { arrAge.value = ''; arrAge.placeholder = ''; }
      const arrAgeVal = document.getElementById('animalArrivalAgeValue');
      if (arrAgeVal) { arrAgeVal.value = ''; arrAgeVal.placeholder = ''; }
    } catch (err) {
      console.error('handleSaveAnimal failed:', err);
      const isAr = (appState.lang || this.currentLang) === 'ar';
      const isEn = (appState.lang || this.currentLang) === 'en';
      const errMsg = isAr 
        ? 'خطأ أثناء تسجيل الدفعة: ' 
        : (isEn ? 'Error while saving batch: ' : 'Erreur lors de l\'enregistrement du lot : ');
      this.showToast(errMsg + err.message, 'danger');
    }
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
    if ((Number(lot.currentQuantity) || 0) <= 0) {
      this.showToast(appState.lang === 'ar' ? 'هذه الدفعة منتهية، لا توجد طيور لتسجيل خسائر عليها.' : 'Ce lot est clôturé (0 tête restante).', 'warning');
      return;
    }
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
    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';
    if (isNaN(count) || count <= 0) {
      this.showToast(isAr ? 'يرجى إدخال عدد إيجابي صحيح' : (isEn ? 'Please enter a valid positive number' : 'Veuillez entrer un nombre positif valide'), 'error');
      return;
    }
    if (count > lot.currentQuantity) {
      this.showToast(isAr 
        ? `غير ممكن: ${count} يتجاوز العدد الحالي (${lot.currentQuantity})` 
        : (isEn ? `Impossible: ${count} exceeds flock count (${lot.currentQuantity})` : `Impossible : ${count} dépasse l'effectif (${lot.currentQuantity})`), 'error');
      return;
    }
    lot.currentQuantity -= count;
    lot.mortality = (lot.mortality || 0) + count;
    if (lot.currentQuantity <= 0 && !lot.exitDate) {
      lot.exitDate = this.getTodayStr();
    }
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
      const isAr = (appState.lang || this.currentLang) === 'ar';
      const isEn = (appState.lang || this.currentLang) === 'en';
      this.showToast(isAr ? 'يرجى إدخال كمية إيجابية' : (isEn ? 'Please enter a positive quantity' : 'Veuillez entrer une quantité positive'), 'error');
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
    const lot = appState.animals.find(a => a.id === lotId);
    if (!lot || (Number(lot.currentQuantity) || 0) <= 0) {
      this.showToast(appState.lang === 'ar' ? 'هذه الدفعة مباعة بالكامل، لا توجد طيور متبقية للبيع.' : 'Ce lot est déjà entièrement vendu (0 sujet restant).', 'warning');
      return;
    }
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
      else if (e.category === 'electricite' || e.category === 'electricite_couveuse' || e.category === 'eau') utilTot += t;
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
      const lotDisplay = this.getExpenseLinkedLotsDisplay(exp);
      const displayTitle = this.getTranslatedExpenseTitle(exp.title);

      let feedStockTag = '';
      if (exp.category === 'nourriture') {
        if (exp.feedStockAddedKg > 0) {
          feedStockTag = `<div style="margin-top: 3px;"><span class="badge" style="background: rgba(16, 185, 129, 0.12); color: var(--accent-emerald); font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">📦 +${Number(exp.feedStockAddedKg).toFixed(1)} kg en réserve</span></div>`;
        } else {
          feedStockTag = `<div style="margin-top: 3px;"><button type="button" class="btn btn-xs btn-outline" style="color: var(--accent-emerald); border-color: rgba(16, 185, 129, 0.4); font-size: 0.68rem; padding: 1px 6px;" onclick="app.addExistingExpenseToFeedStock('${exp.id}')" title="Ajouter cette quantité dans le stock d'aliment en réserve">📦 ${this.t('btn_add_to_feed_stock') || 'Mettre en stock'}</button></div>`;
        }
      } else if (exp.category === 'electricite_couveuse' && exp.addedCostPerHead) {
        feedStockTag = `<div style="margin-top: 3px;"><span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">⚡ +${this.formatMoney(exp.addedCostPerHead)}/poussin au lot</span></div>`;
      }

      tr.innerHTML = `
        <td style="white-space: nowrap; font-weight: 600;">${this.formatDateFR(exp.date)}</td>
        <td style="white-space: nowrap;">${catBadge}</td>
        <td><strong style="color: var(--text-primary); font-size: 0.88rem;">${displayTitle}</strong>${feedStockTag}</td>
        <td style="white-space: nowrap;">
          <button type="button" class="btn-subtle" onclick="app.reassignExpenseLot('${exp.id}')" title="Cliquer pour changer le ou les lots affectés" style="cursor: pointer; border: 1px solid var(--border-color); background: var(--bg-surface); padding: 4px 10px; font-size: 0.78rem; font-weight: 600; border-radius: var(--radius-pill); color: var(--text-primary); display: inline-flex; align-items: center; gap: 4px; max-width: 220px;">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${lotDisplay}</span> ✏️
          </button>
        </td>
        <td style="white-space: nowrap; font-variant-numeric: tabular-nums;">${exp.quantity}</td>
        <td style="white-space: nowrap; font-variant-numeric: tabular-nums;">${this.formatMoney(exp.unitPrice)}</td>
        <td class="text-rose bold" style="white-space: nowrap; font-variant-numeric: tabular-nums;">${this.formatMoney(exp.total)}</td>
        <td style="white-space: nowrap;">
          <button class="btn btn-sm btn-danger-outline" style="padding:2px 8px;" onclick="app.deleteExpense('${exp.id}')">
            🗑️
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  calcExpenseTotal() {
    const q = parseFloat(document.getElementById('expenseQuantity')?.value) || 0;
    const p = parseFloat(document.getElementById('expenseUnitPrice')?.value) || 0;
    const totalEl = document.getElementById('expenseTotalCalculated');
    const decimals = appState.currency === 'TND' ? 3 : 2;
    if (totalEl) totalEl.value = (q * p).toFixed(decimals);

    const cat = document.getElementById('expenseCategory')?.value;
    if (cat === 'electricite_couveuse') {
      this.updateIncubatorElecLiveCalc();
    }
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
    const feedSuggRow = document.getElementById('expenseFeedSuggestionsRow');
    const elecBox = document.getElementById('expenseIncubatorElecBox');

    if (cat === 'nourriture') {
      if (feedPurchaseBlock) feedPurchaseBlock.style.display = 'block';
      if (standardRow) standardRow.style.display = 'none';
      if (feedSuggRow) feedSuggRow.style.display = 'block';
      if (elecBox) elecBox.style.display = 'none';
      if (expQty) {
        expQty.removeAttribute('required');
        expQty.removeAttribute('readonly');
      }
      if (expPrice) expPrice.removeAttribute('required');

      this.populateExpenseFeedTypes();
      this.renderFeedExpenseSuggestions();
      this.setFeedPurchaseMode(appState.currentFeedPurchaseMode || 'sac');
    } else if (cat === 'electricite_couveuse') {
      if (feedPurchaseBlock) feedPurchaseBlock.style.display = 'none';
      if (standardRow) standardRow.style.display = 'flex';
      if (feedSuggRow) feedSuggRow.style.display = 'none';
      if (elecBox) elecBox.style.display = 'block';

      if (expQty) {
        expQty.value = '1';
        expQty.setAttribute('readonly', 'readonly');
        expQty.setAttribute('required', 'required');
      }
      if (expPrice) expPrice.setAttribute('required', 'required');

      if (title && (!title.value || title.value === 'Dépense générale' || title.value === 'مصروف عام')) {
        const isAr = appState.lang === 'ar';
        const isEn = appState.lang === 'en';
        title.value = isAr ? 'فاتورة كهرباء الفقاسة' : (isEn ? 'Incubator electricity bill' : 'Facture électricité couveuse');
      }
      this.calcExpenseTotal();
      this.updateIncubatorElecLiveCalc();
    } else {
      if (feedPurchaseBlock) feedPurchaseBlock.style.display = 'none';
      if (standardRow) standardRow.style.display = 'flex';
      if (feedSuggRow) feedSuggRow.style.display = 'none';
      if (elecBox) elecBox.style.display = 'none';
      if (expQty) {
        expQty.removeAttribute('readonly');
        expQty.setAttribute('required', 'required');
      }
      if (expPrice) expPrice.setAttribute('required', 'required');
      this.calcExpenseTotal();
    }
  },

  updateIncubatorElecLiveCalc() {
    const box = document.getElementById('expenseIncubatorElecLiveCalc');
    if (!box) return;

    const total = parseFloat(document.getElementById('expenseTotalCalculated')?.value) || 
                  (parseFloat(document.getElementById('expenseUnitPrice')?.value) || 0);
    const selectedLotId = document.getElementById('expenseAnimalLot')?.value;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    if (!selectedLotId || selectedLotId === 'general' || selectedLotId === '__multiple__') {
      box.innerHTML = `
        <div style="color: #f59e0b; display: flex; align-items: center; gap: 0.45rem;">
          <span style="font-size: 1.1rem;">⚠️</span>
          <span>${isAr ? 'يرجى اختيار دفعة الفراخ المستفيدة أعلاه لإدراج الكهرباء في تكلفتها.' : (isEn ? 'Please select the specific chick flock above to allocate electricity.' : 'Veuillez sélectionner le lot de poussins bénéficiaire ci-dessus pour lui imputer l\'électricité.')}</span>
        </div>
      `;
      return;
    }

    const lot = (appState.animals || []).find(a => a.id === selectedLotId);
    if (!lot) return;

    const initQty = Number(lot.initialQuantity) || Number(lot.currentQuantity) || 1;
    const curQty = Number(lot.currentQuantity) || 0;
    const currentCost = Number(lot.costPerHead) || 0;
    const addPerHead = total > 0 ? (total / initQty) : 0;
    const newCost = currentCost + addPerHead;

    const chicksWord = isAr ? 'فرخ خرج حياً' : (isEn ? 'hatched chicks' : 'poussins éclos');
    const remWord = isAr ? 'المتبقي حالياً' : (isEn ? 'current' : 'actuels');

    box.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.35rem; width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed var(--border-subtle); padding-bottom: 0.35rem;">
          <span style="font-weight: 800; color: var(--text-main);">🐣 ${lot.name || 'Lot'}</span>
          <span class="text-muted" style="font-size: 0.76rem;">${initQty} ${chicksWord} (${curQty} ${remWord})</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 2px;">
          <div>
            <span style="font-size: 0.74rem; color: var(--text-muted);">${isAr ? 'التكلفة المضافة للفرخ:' : (isEn ? 'Added cost / chick:' : 'Coût ajouté / poussin :')}</span>
            <strong style="color: #f59e0b; margin-left: 4px; font-size: 0.95rem;">+${this.formatMoney(addPerHead)}</strong>
          </div>
          <div>
            <span style="font-size: 0.74rem; color: var(--text-muted);">${isAr ? 'التكلفة الجديدة للرأس:' : (isEn ? 'New cost / head:' : 'Nouveau coût / tête :')}</span>
            <strong style="color: var(--accent-emerald, #10b981); margin-left: 4px; font-size: 1rem;">${this.formatMoney(newCost)}</strong>
          </div>
        </div>
      </div>
    `;
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

  updateQuickWeightButtonsState(activeWeight) {
    [50, 25, 10].forEach(val => {
      const btn = document.getElementById(`quickWeightBtn_${val}`);
      if (btn) {
        if (Number(activeWeight) === val) {
          btn.classList.remove('btn-outline');
          btn.classList.add('btn-emerald');
        } else {
          btn.classList.add('btn-outline');
          btn.classList.remove('btn-emerald');
        }
      }
    });
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
      this.updateQuickWeightButtonsState(bagWeight);

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

      const selectedFeedId = document.getElementById('expenseFeedTypeSelect')?.value;
      const selectedFeed = (appState.feedTypes || []).find(f => f.id === selectedFeedId);
      const kgPerCan = this.getFeedKgPerCan(selectedFeed);

      total = boiteTotalPrice;
      addedKg = Number((boiteCount * kgPerCan).toFixed(2));
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

    this.reconcileFeedTypesFromExpenses();
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

    const val = titleInput.value.trim();
    if (val.length >= 2) {
      const family = this.detectFeedTypeFromText(val);
      let matchedIndex = -1;
      for (let i = 0; i < select.options.length; i++) {
        const opt = select.options[i];
        if (opt.value !== '__new__') {
          const ft = (appState.feedTypes || []).find(f => f.id === opt.value);
          if (ft && family && this.isFeedInFamily(ft, family)) {
            matchedIndex = i;
            break;
          }
          if (opt.textContent.toLowerCase().includes(val.toLowerCase())) {
            matchedIndex = i;
            break;
          }
        }
      }
      if (matchedIndex >= 0) {
        select.selectedIndex = matchedIndex;
      } else {
        select.value = '__new__';
      }
    }
    this.calcFeedPurchaseFields();
  },

  handleSaveExpense(e) {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const category = document.getElementById('expenseCategory')?.value || 'autre';
      const date = document.getElementById('expenseDate')?.value || this.getTodayStr();
      const titleInput = document.getElementById('expenseTitle');
      let title = (titleInput?.value || '').trim();
      const rawLotVal = document.getElementById('expenseAnimalLot')?.value || 'general';
      let linkedLotId = 'general';
      let linkedLotIds = [];

      if (rawLotVal === '__multiple__') {
        const checkedBoxes = Array.from(document.querySelectorAll('.add-expense-lot-checkbox:checked'));
        const checkedIds = checkedBoxes.map(cb => cb.value);
        if (checkedIds.length === 0) {
          const isArLang = appState.lang === 'ar';
          this.showToast(isArLang ? 'يرجى تحديد دفعة واحدة على الأقل' : 'Veuillez sélectionner au moins un lot', 'warning');
          return;
        }
        if (checkedIds.length === 1) {
          linkedLotId = checkedIds[0];
          linkedLotIds = [checkedIds[0]];
        } else {
          linkedLotId = checkedIds.join(',');
          linkedLotIds = checkedIds;
        }
      } else if (rawLotVal && rawLotVal !== 'general' && rawLotVal !== 'none') {
        linkedLotId = rawLotVal;
        linkedLotIds = [rawLotVal];
      } else {
        linkedLotId = 'general';
        linkedLotIds = [];
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
        const addToStockEl = document.getElementById('expenseAddToFeedStock');
        const addToStock = addToStockEl ? addToStockEl.checked : true;

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

          const selectedFeedId = document.getElementById('expenseFeedTypeSelect')?.value;
          const selectedFeed = (appState.feedTypes || []).find(f => f.id === selectedFeedId);
          const kgPerCan = this.getFeedKgPerCan(selectedFeed);

          quantity = boiteCount;
          total = boiteTotalPrice;
          unitPrice = boiteCount > 0 ? (total / boiteCount) : 0;
          addedKg = Number((boiteCount * kgPerCan).toFixed(2));

          if (!title) {
            const boiteWord = isAr ? 'حكك طماطم' : (isEn ? 'Tomato cans' : 'Boîtes tomate (Sicam)');
            title = `${boiteCount} ${boiteWord}`;
          }
        }

        // Robust fallbacks if total or addedKg weren't computed from subform
        if (total === 0) {
          const expTotal = parseFloat(document.getElementById('expenseTotalCalculated')?.value) || 0;
          const expPrice = parseFloat(document.getElementById('expenseUnitPrice')?.value) || 0;
          const expQty = parseFloat(document.getElementById('expenseQuantity')?.value) || 0;
          if (expTotal > 0) {
            total = expTotal;
            if (unitPrice === 0 && quantity > 0) unitPrice = total / quantity;
          } else if (expPrice > 0) {
            unitPrice = expPrice;
            total = (quantity || 1) * unitPrice;
          }
        }
        if (addedKg <= 0) {
          const expQty = parseFloat(document.getElementById('expenseQuantity')?.value) || 0;
          if (expQty > 0) {
            addedKg = (unitPrice >= 15 || quantity <= 5) ? expQty * 50 : expQty;
          }
        }

        if (addToStock && addedKg > 0) {
          appState.feedTypes = this.sanitizeFeedTypes(appState.feedTypes);
          const selectedFeedId = document.getElementById('expenseFeedTypeSelect')?.value;
          const detectedFamily = this.detectFeedTypeFromText(title);

          let targetFeed = null;
          // Priorité absolue à la famille détectée dans l'intitulé (ex: Bouchon ne va JAMAIS dans Blé !)
          if (detectedFamily) {
            targetFeed = (appState.feedTypes || []).find(f => this.isFeedInFamily(f, detectedFamily));
            if (!targetFeed) {
              targetFeed = this.createDefaultFeedForFamily(detectedFamily, total / (addedKg || 1));
              appState.feedTypes.push(targetFeed);
            }
          } else if (selectedFeedId && selectedFeedId !== '__new__') {
            targetFeed = (appState.feedTypes || []).find(f => f.id === selectedFeedId);
          }

          if (!targetFeed) {
            const rawTitle = (title || '').trim();
            let feedCleanName = rawTitle.replace(/^(achat|شراء|buy|purchase|feed|aliment)\s*[:\-]?\s*/i, '').replace(/\(\d+.*?\)/g, '').trim();
            if (!feedCleanName) feedCleanName = rawTitle || (isAr ? 'علف جديد' : (isEn ? 'New Feed' : 'Nouvel aliment'));

            targetFeed = (appState.feedTypes || []).find(f => 
              f.name.toLowerCase().trim() === feedCleanName.toLowerCase().trim() ||
              (this.getFeedDisplayName(f) || '').toLowerCase().trim() === feedCleanName.toLowerCase().trim()
            );
            if (!targetFeed) {
              targetFeed = {
                id: 'feed-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4),
                name: feedCleanName,
                stockKg: 0,
                pricePerKg: (addedKg > 0) ? parseFloat((total / addedKg).toFixed(3)) : 0,
                texture: 'grain',
                kgPerCan: 0.70
              };
              appState.feedTypes.push(targetFeed);
            }
          }

          targetFeed.stockKg = Math.max(0, parseFloat(((Number(targetFeed.stockKg) || 0) + addedKg).toFixed(2)));
          targetFeed.manuallyAdjusted = true;
          targetFeed.updatedAt = Date.now();
          if (targetFeed.stockKg > 0) {
            targetFeed.isClosed = false;
            delete targetFeed.closedDate;
          }
          if (total > 0 && addedKg > 0) {
            targetFeed.pricePerKg = Math.max(0.01, parseFloat((total / addedKg).toFixed(3)));
          }

          appState.feedStockKg = parseFloat((appState.feedTypes || []).reduce((sum, f) => sum + (Number(f.stockKg) || 0), 0).toFixed(2));
          appState.feedStockDate = this.getTodayStr();
          appState.feedStockUpdatedAt = Date.now();
          appState.feedStockCostPerKg = this.getAverageFeedPricePerKg();

          feedStockAddedKg = addedKg;
          feedTypeId = targetFeed.id;

          if (window.appAuth && typeof appAuth.removeDeletedId === 'function') {
            appAuth.removeDeletedId(targetFeed.id);
          }
        }
      } else {
        quantity = parseFloat(document.getElementById('expenseQuantity')?.value) || 1;
        unitPrice = parseFloat(document.getElementById('expenseUnitPrice')?.value) || 0;
        total = parseFloat(document.getElementById('expenseTotalCalculated')?.value) || (quantity * unitPrice);

        if (!title) {
          title = isAr ? 'مصروف عام' : 'Dépense générale';
        }
      }

      if (category === 'electricite_couveuse') {
        if (!linkedLotId || linkedLotId === 'general' || linkedLotId === '__multiple__') {
          this.showToast(isAr ? 'يرجى اختيار دفعة الفراخ التي ستتحمل فاتورة الكهرباء.' : (isEn ? 'Please select the specific chick flock that receives this electricity bill.' : 'Veuillez sélectionner le lot de poussins qui reçoit cette facture d\'électricité.'), 'warning');
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
        linkedLotIds,
        feedStockAddedKg,
        feedTypeId
      };

      if (category === 'electricite_couveuse') {
        const targetLot = (appState.animals || []).find(a => a.id === linkedLotId);
        if (targetLot) {
          const initQty = Number(targetLot.initialQuantity) || Number(targetLot.currentQuantity) || 1;
          const addCostPerChick = Number((total / initQty).toFixed(3));
          const prevCost = Number(targetLot.costPerHead) || 0;
          const newCost = Number((prevCost + addCostPerChick).toFixed(3));

          targetLot.costPerHead = newCost;
          const noteEntry = ` [⚡ Facture électricité couveuse du ${this.formatDateFR(date)} : +${this.formatMoney(total)} (+${this.formatMoney(addCostPerChick)}/poussin sur ${initQty} poussins sortis)]`;
          targetLot.notes = (targetLot.notes || '') + noteEntry;

          newExp.incubatorLotId = targetLot.id;
          newExp.incubatorLotName = targetLot.name || targetLot.id;
          newExp.addedCostPerHead = addCostPerChick;
          newExp.incubatorInitQty = initQty;
        }
      }

      appState.expenses.unshift(newExp);
      this.saveState();

      if (window.appAuth && typeof window.appAuth.pushData === 'function') {
        window.appAuth.pushData();
      }
      this.closeModal('modalAddExpense');
      this.renderAll();
      this.renderFeedDistributionModal();
      this.renderFeedStockAdjustModal();

      let toastMsg = this.t('toast_expense_saved', { amount: this.formatMoney(total) });
      if (category === 'electricite_couveuse' && newExp.addedCostPerHead && newExp.incubatorLotName) {
        const targetLot = (appState.animals || []).find(a => a.id === linkedLotId);
        toastMsg = this.t('toast_elec_incubator_applied', {
          add: this.formatMoney(newExp.addedCostPerHead),
          lot: newExp.incubatorLotName,
          cost: this.formatMoney(targetLot ? targetLot.costPerHead : 0)
        });
      } else if (feedStockAddedKg > 0) {
        toastMsg += isAr 
          ? ` (+${feedStockAddedKg.toFixed(1)} كغ في مخزون الأعلاف)` 
          : ` (+${feedStockAddedKg.toFixed(1)} kg ajoutés au stock)`;
      }
      this.showToast(toastMsg);

      const form = document.getElementById('formAddExpense');
      if (form) form.reset();
      const multiBlock = document.getElementById('expenseAddMultipleLotsBlock');
      if (multiBlock) multiBlock.style.display = 'none';
      const elecBox = document.getElementById('expenseIncubatorElecBox');
      if (elecBox) elecBox.style.display = 'none';
      const expQty = document.getElementById('expenseQuantity');
      if (expQty) { expQty.value = ''; expQty.placeholder = ''; expQty.removeAttribute('readonly'); }
      const expPrice = document.getElementById('expenseUnitPrice');
      if (expQty) { expQty.value = ''; expQty.placeholder = ''; }
      if (expPrice) { expPrice.value = ''; expPrice.placeholder = ''; }
      this.calcExpenseTotal();
    } catch (err) {
      console.error('handleSaveExpense failed:', err);
      const isAr = (appState.lang || this.currentLang) === 'ar';
      const isEn = (appState.lang || this.currentLang) === 'en';
      const errMsg = isAr 
        ? 'خطأ أثناء تسجيل المصروف: ' 
        : (isEn ? 'Error while saving expense: ' : 'Erreur lors de l\'enregistrement de la dépense : ');
      this.showToast(errMsg + err.message, 'danger');
    }
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
        if (exp && exp.category === 'electricite_couveuse' && exp.incubatorLotId && exp.addedCostPerHead) {
          const lot = (appState.animals || []).find(a => a.id === exp.incubatorLotId);
          if (lot) {
            lot.costPerHead = Math.max(0, Number(((Number(lot.costPerHead) || 0) - Number(exp.addedCostPerHead)).toFixed(3)));
            lot.notes = (lot.notes || '') + ` [⚡ Annulation facture électricité couveuse (-${this.formatMoney(exp.addedCostPerHead)}/tête)]`;
          }
        }
        if (exp && exp.category === 'nourriture' && (Number(exp.feedStockAddedKg) > 0 || Number(exp.quantity) > 0)) {
          const addedKg = Number(exp.feedStockAddedKg) || (Number(exp.quantity) > 0 ? (Number(exp.unitPrice) >= 15 ? Number(exp.quantity) * 50 : Number(exp.quantity)) : 0);
          let ft = exp.feedTypeId ? (appState.feedTypes || []).find(f => f.id === exp.feedTypeId) : null;
          if (!ft) {
            const fam = this.detectFeedTypeFromText(exp.title);
            if (fam) ft = (appState.feedTypes || []).find(f => this.isFeedInFamily(f, fam));
          }
          if (ft && addedKg > 0) {
            ft.stockKg = Math.max(0, parseFloat(((Number(ft.stockKg) || 0) - addedKg).toFixed(2)));
            ft.updatedAt = Date.now();
          }
          appState.feedStockKg = parseFloat((appState.feedTypes || []).reduce((sum, f) => sum + (Number(f.stockKg) || 0), 0).toFixed(2));
          appState.feedStockUpdatedAt = Date.now();
        }
        if (window.appAuth && typeof appAuth.addDeletedId === 'function') {
          appAuth.addDeletedId(expId);
        }
        appState.expenses = appState.expenses.filter(e => e.id !== expId);
        this.saveState();
        if (window.appAuth && typeof appAuth.pushData === 'function') {
          appAuth.pushData(false);
        }
        this.renderAll();
        this.renderFeedStockAdjustModal();
        this.renderFeedDistributionModal();
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
      step: 'any',
      confirmText: isAr ? 'إضافة للمخزون' : 'Ajouter au Stock',
      onConfirm: (val) => {
        const addedKg = parseFloat(String(val || '').replace(',', '.')) || 0;
        if (addedKg <= 0) return;

        // Match or ask which feed
        const family = this.detectFeedTypeFromText(exp.title);
        let ft = null;
        if (family) {
          ft = (appState.feedTypes || []).find(f => this.isFeedInFamily(f, family));
          if (!ft) {
            ft = this.createDefaultFeedForFamily(family, (addedKg > 0 ? (Number(exp.total) / addedKg) : 0));
            appState.feedTypes.push(ft);
          }
        }

        if (!ft) {
          ft = appState.feedTypes.find(f => {
            const fn = (f.name || '').toLowerCase();
            return titleLower.includes(fn) || fn.includes(titleLower);
          });
        }

        if (!ft) {
          ft = {
            id: 'feed-' + Date.now().toString(36),
            name: exp.title.replace(/\(\d+.*?\)/g, '').trim() || (isAr ? 'علف جديد' : 'Nouvel aliment'),
            stockKg: 0,
            pricePerKg: (addedKg > 0) ? parseFloat((Number(exp.total) / addedKg).toFixed(3)) : 0
          };
          appState.feedTypes.push(ft);
        }

        ft.stockKg = Math.max(0, parseFloat(((Number(ft.stockKg) || 0) + addedKg).toFixed(2)));
        if (exp.total > 0 && addedKg > 0) {
          ft.pricePerKg = Math.max(0.01, parseFloat((Number(exp.total) / addedKg).toFixed(3)));
        }
        exp.feedStockAddedKg = addedKg;
        exp.feedTypeId = ft.id;
        delete exp.feedStockDetached;

        appState.feedStockKg = parseFloat((appState.feedTypes || []).reduce((sum, f) => sum + (Number(f.stockKg) || 0), 0).toFixed(2));
        appState.feedStockDate = this.getTodayStr();
        appState.feedStockCostPerKg = this.getAverageFeedPricePerKg();

        this.saveState();
        this.renderAll();
        const isAr = (appState.lang || this.currentLang) === 'ar';
        const isEn = (appState.lang || this.currentLang) === 'en';
        this.showToast(isAr 
          ? `✅ +${addedKg.toFixed(1)} ${unitKg} تمت إضافتها إلى المخزون (${this.getFeedDisplayName(ft)}) !` 
          : (isEn ? `✅ +${addedKg.toFixed(1)} ${unitKg} added to stock (${this.getFeedDisplayName(ft)})!` : `✅ +${addedKg.toFixed(1)} ${unitKg} ajoutés au stock (${this.getFeedDisplayName(ft)}) !`));
      }
    });
  },

  quickImportFoodExpensesToStock() {
    const uncredited = (appState.expenses || []).filter(e => e.category === 'nourriture' && !e.feedStockAddedKg && !e.feedStockDetached);
    if (uncredited.length === 0) {
      const isAr = (appState.lang || this.currentLang) === 'ar';
      const isEn = (appState.lang || this.currentLang) === 'en';
      this.showToast(isAr 
        ? 'جميع مشتريات الأعلاف مسجلة بالفعل في المخزون !' 
        : (isEn ? 'All feed purchases are already accounted for in stock!' : 'Tous les achats d\'aliments sont déjà comptabilisés dans le stock !'));
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

      const family = this.detectFeedTypeFromText(exp.title);
      let ft = null;
      if (family) {
        ft = (appState.feedTypes || []).find(f => this.isFeedInFamily(f, family));
        if (!ft) {
          ft = this.createDefaultFeedForFamily(family, (addedKg > 0 ? (Number(exp.total) / addedKg) : 0));
          appState.feedTypes.push(ft);
        }
      }

      if (!ft) {
        ft = appState.feedTypes.find(f => {
          const fn = (f.name || '').toLowerCase();
          return titleLower.includes(fn) || fn.includes(titleLower);
        });
      }

      if (!ft) {
        ft = {
          id: 'feed-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
          name: exp.title.replace(/\(\d+.*?\)/g, '').trim() || 'Aliment',
          stockKg: 0,
          pricePerKg: (addedKg > 0) ? parseFloat((Number(exp.total) / addedKg).toFixed(3)) : 0
        };
        appState.feedTypes.push(ft);
      }

      ft.stockKg = Math.max(0, parseFloat(((Number(ft.stockKg) || 0) + addedKg).toFixed(2)));
      if (exp.total > 0 && addedKg > 0) {
        ft.pricePerKg = Math.max(0.01, parseFloat((Number(exp.total) / addedKg).toFixed(3)));
      }
      exp.feedStockAddedKg = addedKg;
      exp.feedTypeId = ft.id;
      totalAdded += addedKg;
    });

    appState.feedStockKg = parseFloat((appState.feedTypes || []).reduce((sum, f) => sum + (Number(f.stockKg) || 0), 0).toFixed(2));
    appState.feedStockDate = this.getTodayStr();
    appState.feedStockCostPerKg = this.getAverageFeedPricePerKg();

    this.saveState();
    this.renderAll();
    if (document.getElementById('modalAdjustFeedStock') && !document.getElementById('modalAdjustFeedStock').classList.contains('hidden')) {
      this.renderFeedStockAdjustModal();
    }
    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';
    const unitKg = isAr ? 'كغ' : 'kg';
    this.showToast(isAr 
      ? `✅ +${totalAdded.toFixed(1)} ${unitKg} تمت إضافتها بنجاح إلى مخزون الأعلاف بالاحتياط !` 
      : (isEn ? `✅ +${totalAdded.toFixed(1)} ${unitKg} added successfully to your feed reserve stock!` : `✅ +${totalAdded.toFixed(1)} kg ajoutés avec succès dans vos stocks d'aliments en réserve !`));
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
      const isNegMargin = String(estimatedMargin).trim().startsWith('-');

      tr.innerHTML = `
        <td>${this.formatDateFR(sale.date)}</td>
        <td>${prodBadge}</td>
        <td><strong>${displayDesc}</strong></td>
        <td>${this.formatSaleQuantityDisplay(sale)}</td>
        <td>${this.formatMoney(sale.unitPrice)}</td>
        <td class="text-emerald bold">${this.formatMoney(sale.total)}</td>
        <td><small class="badge-pill">${lotName}</small></td>
        <td><span class="badge-tag ${isNegMargin ? 'text-rose' : 'text-emerald'}">${estimatedMargin}</span></td>
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
    const directExpenses = linkedLot ? (appState.expenses || []).filter(e => e.linkedLotId === linkedLot.id).reduce((s, e) => s + (Number(e.total) || 0), 0) : 0;
    const lotQty = linkedLot ? (Number(linkedLot.currentQuantity) || 1) : 1;
    const realCostPerHead = acqCostPerHead + (directExpenses / lotQty);
    const totalCostPrice = q * realCostPerHead;

    // Bénéfice net projeté
    const netProfit = total - totalCostPrice;
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
        calcNoteEl.textContent = `💡 الاستهلاك التقديري: ${cumulFeedKg.toFixed(2)} كغ/طائر (~${this.formatMoney(feedCostPerHead)} علف).`;
      } else if (lang === 'en') {
        calcNoteEl.textContent = `💡 Estimated consumption: ${cumulFeedKg.toFixed(2)} kg/head (~${this.formatMoney(feedCostPerHead)} feed).`;
      } else {
        calcNoteEl.textContent = `💡 Consommation estimée : ${cumulFeedKg.toFixed(2)} kg/sujet (~${this.formatMoney(feedCostPerHead)} aliment).`;
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
    const arrivalAgeDays = Number(lot.arrivalAgeDays) || 0;
    const ageDays = this.calculateAgeInDays(lot.birthDate) + arrivalAgeDays;
    const stage = (lot.stage || '').toLowerCase();

    if (lot.species === 'canard' || lot.species === 'canard_barbarie') {
      if (typeSelect) typeSelect.value = 'canard';
    } else if (lot.species === 'pintade') {
      if (typeSelect) typeSelect.value = 'pintade';
    } else if (lot.species === 'poussin' || ageDays <= 30 || stage.includes('poussin') || stage.includes('demarrage')) {
      if (typeSelect) typeSelect.value = 'poussin';
    } else if (lot.species === 'pondeuse') {
      if (typeSelect && typeSelect.value !== 'oeufs') typeSelect.value = 'poulet';
    } else if (ageDays > 180 || stage.includes('adulte') || stage.includes('reproducteur')) {
      if (typeSelect) typeSelect.value = 'poulet';
    } else {
      if (typeSelect) typeSelect.value = 'poulet';
    }
    this.handleSaleTypeChange();

    // Remplir l'âge d'après sa date de naissance réelle + âge d'achat
    const ageUnit = document.getElementById('saleAgeUnit');
    const ageInput = document.getElementById('saleAgeValue');
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

      if (type === 'lait') {
        const unitLait = appState.lang === 'ar' ? '(لتر حليب طازج)' : (appState.lang === 'en' ? '(Liters of Milk)' : '(Litres de lait)');
        if (unitLabel) unitLabel.textContent = unitLait;
        if (price) price.placeholder = '1.400';
      } else if (type === 'veau') {
        const unitVeau = appState.lang === 'ar' ? '(عجول / بالرأس)' : (appState.lang === 'en' ? '(Calves / Heads)' : '(Veaux / Têtes)');
        if (unitLabel) unitLabel.textContent = unitVeau;
      } else if (type === 'bovin_viande') {
        const unitViande = appState.lang === 'ar' ? '(عجول تسمين / بالرأس)' : (appState.lang === 'en' ? '(Beef cattle / Heads)' : '(Taurillons / Têtes)');
        if (unitLabel) unitLabel.textContent = unitViande;
      } else if (type === 'vache_reforme') {
        const unitReforme = appState.lang === 'ar' ? '(أبقار تفريط / بالرأس)' : (appState.lang === 'en' ? '(Cull cows / Heads)' : '(Vaches réforme / Têtes)');
        if (unitLabel) unitLabel.textContent = unitReforme;
      } else if (type === 'fumier_bovin') {
        const unitFumier = appState.lang === 'ar' ? '(مقطورة / أكياس سماد)' : (appState.lang === 'en' ? '(Trailers / Bags)' : '(Remorques / Sacs)');
        if (unitLabel) unitLabel.textContent = unitFumier;
      } else if (type === 'lait_brebis_chevre') {
        const unitLaitOvin = appState.lang === 'ar' ? '(لتر حليب نعاج وماعز)' : (appState.lang === 'en' ? '(Liters of Sheep/Goat Milk)' : '(Litres de lait de brebis / chèvre)');
        if (unitLabel) unitLabel.textContent = unitLaitOvin;
        if (price) price.placeholder = '2.200';
      } else if (type === 'agneau') {
        const unitAgneau = appState.lang === 'ar' ? '(خراف / علوش بالرأس)' : (appState.lang === 'en' ? '(Lambs / Heads)' : '(Agneaux / Têtes)');
        if (unitLabel) unitLabel.textContent = unitAgneau;
      } else if (type === 'mouton') {
        const unitMouton = appState.lang === 'ar' ? '(خراف وكباش / بالرأس)' : (appState.lang === 'en' ? '(Sheep / Heads)' : '(Moutons / Têtes)');
        if (unitLabel) unitLabel.textContent = unitMouton;
      } else if (type === 'chevreau') {
        const unitChevreau = appState.lang === 'ar' ? '(جديان / بالرأس)' : (appState.lang === 'en' ? '(Kids / Heads)' : '(Chevreaux / Têtes)');
        if (unitLabel) unitLabel.textContent = unitChevreau;
      } else if (type === 'laine') {
        const unitLaine = appState.lang === 'ar' ? '(جزات صوف / كغ)' : (appState.lang === 'en' ? '(Fleeces / Kg)' : '(Toisons / Kg de laine)');
        if (unitLabel) unitLabel.textContent = unitLaine;
      } else if (type === 'fumier_ovin') {
        const unitFumierOvin = appState.lang === 'ar' ? '(مقطورة / أكياس غبار أغنام)' : (appState.lang === 'en' ? '(Sheep Manure Bags)' : '(Sacs / Remorques fumier ovin)');
        if (unitLabel) unitLabel.textContent = unitFumierOvin;
      } else if (type === 'poussin') {
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
              if (lot.currentQuantity <= 0 && !lot.exitDate) {
                lot.exitDate = date;
              }
              finalizeSaleSave();
            }
          });
          return;
        }
        lot.currentQuantity = Math.max(0, lot.currentQuantity - quantity);
        if (lot.currentQuantity <= 0 && !lot.exitDate) {
          lot.exitDate = date;
        }
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
        const saleToDelete = (appState.sales || []).find(s => s.id === saleId);
        if (saleToDelete) {
          // Si vente d'animaux liée à un lot, restituer l'effectif
          if (saleToDelete.linkedLotId && saleToDelete.linkedLotId !== 'none') {
            const lot = (appState.animals || []).find(a => a.id === saleToDelete.linkedLotId);
            if (lot) {
              const qty = Number(saleToDelete.quantity) || 0;
              lot.currentQuantity = Math.min(Number(lot.initialQuantity) || 9999, (Number(lot.currentQuantity) || 0) + qty);
              if (lot.currentQuantity > 0) {
                lot.exitDate = null;
              }
            }
          }
          // Si vente d'œufs, restituer le stock d'œufs
          if (saleToDelete.productType === 'oeufs') {
            let eggsToAdd = Number(saleToDelete.quantity) || 0;
            if (saleToDelete.format === 'hara') eggsToAdd *= 4;
            else if (saleToDelete.format === 'plateau') eggsToAdd *= 30;
            appState.eggStock = (Number(appState.eggStock) || 0) + eggsToAdd;
          }
        }
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
    
    // If linked to a specific lot, compute real margin based on temporal cost
    if (sale.linkedLotId && sale.linkedLotId !== 'none') {
      const lot = (appState.animals || []).find(a => a.id === sale.linkedLotId);
      const fin = lot ? this.calculateLotFinancials(lot) : null;
      const lotExp = fin ? (fin.totalInvested || 0) : appState.expenses
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
  getLotProductionCategory(lot) {
    if (!lot) return 'poulet-croissance';
    const species = (lot.species || '').toLowerCase();
    if (species === 'canard' || species === 'canard_barbarie') return 'canard';
    if (species === 'pintade') return 'pintade';
    if (species === 'pondeuse') return 'oeufs';

    const arrivalAge = Number(lot.arrivalAgeDays) || 0;
    const daysSinceArrival = this.calculateAgeInDays(lot.birthDate);
    const ageDays = daysSinceArrival + arrivalAge;
    const stage = (lot.stage || '').toLowerCase();

    if (species === 'poussin' || ageDays <= 30 || stage.includes('poussin') || stage.includes('demarrage')) {
      return 'poussin';
    }
    if (ageDays > 180 || stage.includes('adulte') || stage.includes('reproducteur')) {
      return 'poulet-adulte';
    }
    return 'poulet-croissance';
  },

  getSaleProductionCategory(sale) {
    if (!sale) return 'poulet-croissance';
    const prodType = (sale.productType || '').toLowerCase();
    if (prodType === 'oeufs') return 'oeufs';
    if (prodType === 'canard' || prodType === 'canard_barbarie') return 'canard';
    if (prodType === 'pintade') return 'pintade';

    if (sale.linkedLotId && sale.linkedLotId !== 'none') {
      const lot = (appState.animals || []).find(a => a.id === sale.linkedLotId);
      if (lot) {
        return this.getLotProductionCategory(lot);
      }
    }

    if (prodType === 'poussin' || prodType === 'poussin-1j' || prodType === 'poussin-demarre') return 'poussin';
    if (prodType === 'poulet-adulte') return 'poulet-adulte';

    const ageText = (sale.ageText || '').toLowerCase();
    if (ageText.includes('jour')) {
      const matchDays = parseInt(ageText);
      if (!isNaN(matchDays) && matchDays <= 30) return 'poussin';
    }
    if (ageText.includes('adulte') || ageText.includes('> 6')) return 'poulet-adulte';

    return 'poulet-croissance';
  },

  renderSmartCalculations() {
    const tbody = document.getElementById('smartProfitTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const allFinancials = this.calculateAllLotsFinancials();

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
      // 1. Ventes appartenant à cette catégorie
      const catSalesList = (appState.sales || []).filter(s => this.getSaleProductionCategory(s) === cat);
      const catSales = catSalesList.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

      // 2. Lots appartenant à cette catégorie
      const catLots = (appState.animals || []).filter(a => this.getLotProductionCategory(a) === cat);

      let feedCost = 0;
      let otherCost = 0;

      if (cat === 'oeufs') {
        const layingLots = catLots.map(a => a.id);
        const eggExps = (appState.expenses || []).filter(e => 
          layingLots.includes(e.linkedLotId) || 
          e.linkedLotId === 'lot-pondeuses' || 
          (e.category === 'oeufs')
        );
        feedCost = catLots.reduce((sum, lot) => sum + (allFinancials[lot.id]?.allocatedFeed || 0), 0) +
          eggExps.filter(e => e.category === 'nourriture').reduce((sum, e) => sum + (Number(e.total) || 0), 0);
        otherCost = catLots.reduce((sum, lot) => sum + (allFinancials[lot.id]?.allocatedOther || 0) + (allFinancials[lot.id]?.directLotExpenses || 0), 0) +
          eggExps.filter(e => e.category !== 'nourriture').reduce((sum, e) => sum + (Number(e.total) || 0), 0);
      } else {
        catLots.forEach(lot => {
          const fin = allFinancials[lot.id];
          if (!fin) return;
          const initialQty = Number(lot.initialQuantity) || 1;
          const lotSales = (appState.sales || []).filter(s => s.linkedLotId === lot.id);
          const totalSoldQty = lotSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

          if (totalSoldQty > 0 || fin.isClosed) {
            const ratio = fin.isClosed ? 1 : Math.min(1, totalSoldQty / initialQty);
            const lotFeed = (fin.allocatedFeed || 0) * ratio;
            const lotOther = Math.max(0, (fin.totalInvested || 0) - (fin.allocatedFeed || 0)) * ratio;
            feedCost += lotFeed;
            otherCost += lotOther;
          }
        });
      }

      const totalCost = feedCost + otherCost;
      const netProfit = catSales - totalCost;
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
    const allFinancials = this.calculateAllLotsFinancials();

    // 1. Cost per Egg (Coût de revient par Œuf)
    const eggSales = (appState.sales || []).filter(s => s.productType === 'oeufs');
    const totalEggsSold = eggSales.reduce((sum, s) => {
      let factor = 1;
      if (s.format === 'plateau') factor = 30;
      else if (s.format === 'hara') factor = 4;
      return sum + ((Number(s.quantity) || 0) * factor);
    }, 0);
    const totalEggsRevenue = eggSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

    const layingLots = (appState.animals || []).filter(a => a.species === 'pondeuse');
    const layingLotIds = layingLots.map(a => a.id);
    const eggFeedCost = (appState.expenses || [])
      .filter(e => layingLotIds.includes(e.linkedLotId) || e.linkedLotId === 'lot-pondeuses')
      .reduce((sum, e) => sum + (Number(e.total) || 0), 0);
    const totalEggsCollected = (appState.eggCollections || appState.eggHarvests || [])
      .reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
    const currentEggStock = Number(appState.eggStock) || 0;

    const eggPriceEl = document.getElementById('costPerEgg');
    const eggMarginEl = document.getElementById('marginPerEgg');

    if (totalEggsSold > 0 && totalEggsRevenue > 0) {
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
      if (eggPriceEl) eggPriceEl.textContent = this.formatMoney(0);
      if (eggMarginEl) {
        eggMarginEl.textContent = zeroHint;
        eggMarginEl.className = 'text-muted';
      }
    }

    // 2. Cost per Chicken (Coût de revient par Poulet 1-6 mois)
    const chickenSales = (appState.sales || []).filter(s => this.getSaleProductionCategory(s) === 'poulet-croissance');
    const chickensSold = chickenSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    const chickenRevenue = chickenSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

    const chickenLots = (appState.animals || []).filter(a => this.getLotProductionCategory(a) === 'poulet-croissance');
    let totalChickenCost = 0;
    chickenLots.forEach(lot => {
      const fin = allFinancials[lot.id];
      if (!fin) return;
      const lotSales = (appState.sales || []).filter(s => s.linkedLotId === lot.id);
      const soldQty = lotSales.reduce((s, x) => s + (Number(x.quantity) || 0), 0);
      if (soldQty > 0 || fin.isClosed) {
        const ratio = fin.isClosed ? 1 : Math.min(1, soldQty / (Number(lot.initialQuantity) || 1));
        totalChickenCost += (fin.totalInvested || 0) * ratio;
      }
    });

    const chickenPriceEl = document.getElementById('costPerChicken');
    const chickenMarginEl = document.getElementById('marginPerChicken');

    if (chickensSold > 0 && chickenRevenue > 0) {
      const costChicken = totalChickenCost > 0 ? (totalChickenCost / chickensSold) : 0;
      const netProfit = chickenRevenue - totalChickenCost;
      const marginPct = ((netProfit / chickenRevenue) * 100).toFixed(1);

      if (chickenPriceEl) chickenPriceEl.textContent = this.formatMoney(costChicken);
      if (chickenMarginEl) {
        const sign = Number(marginPct) >= 0 ? '+' : '';
        chickenMarginEl.textContent = `${marginLbl} ${sign}${marginPct}% (${chickensSold} ${isAr ? 'طائر مباع' : (isEn ? 'birds sold' : 'sujets vendus')})`;
        chickenMarginEl.className = Number(marginPct) >= 0 ? 'text-emerald bold' : 'text-rose bold';
      }
    } else {
      if (chickenPriceEl) chickenPriceEl.textContent = this.formatMoney(0);
      if (chickenMarginEl) {
        chickenMarginEl.textContent = zeroHint;
        chickenMarginEl.className = 'text-muted';
      }
    }

    // 3. Cost per Chick (Coût de revient par Poussin)
    const chickSales = (appState.sales || []).filter(s => this.getSaleProductionCategory(s) === 'poussin');
    const chicksSold = chickSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    const chickRevenue = chickSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);

    const chickLots = (appState.animals || []).filter(a => this.getLotProductionCategory(a) === 'poussin');
    let totalChickCost = 0;
    chickLots.forEach(lot => {
      const fin = allFinancials[lot.id];
      if (!fin) return;
      const lotSales = (appState.sales || []).filter(s => s.linkedLotId === lot.id);
      const soldQty = lotSales.reduce((s, x) => s + (Number(x.quantity) || 0), 0);
      if (soldQty > 0 || fin.isClosed) {
        const ratio = fin.isClosed ? 1 : Math.min(1, soldQty / (Number(lot.initialQuantity) || 1));
        totalChickCost += (fin.totalInvested || 0) * ratio;
      }
    });

    const chicksPriceEl = document.getElementById('costPerChicks');
    const chicksMarginEl = document.getElementById('marginPerChicks');

    if (chicksSold > 0 && chickRevenue > 0) {
      const costChick = totalChickCost > 0 ? (totalChickCost / chicksSold) : 0;
      const netProfit = chickRevenue - totalChickCost;
      const marginPct = ((netProfit / chickRevenue) * 100).toFixed(1);

      if (chicksPriceEl) chicksPriceEl.textContent = this.formatMoney(costChick);
      if (chicksMarginEl) {
        const sign = Number(marginPct) >= 0 ? '+' : '';
        chicksMarginEl.textContent = `${marginLbl} ${sign}${marginPct}% (${chicksSold} ${isAr ? 'كتكوت مباع' : (isEn ? 'chicks sold' : 'poussins vendus')})`;
        chicksMarginEl.className = Number(marginPct) >= 0 ? 'text-emerald bold' : 'text-rose bold';
      }
    } else {
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
              <h3 class="batch-name">${batch.name || 'Couvée'}</h3>
              <p class="batch-species">${(batch.breed && batch.breed !== '-') ? batch.breed + ' &bull; ' : ''}${batch.eggsCount} (${(batch.eggSpecies || 'poule').toUpperCase()})</p>
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

  handleBatchEggSourceChange() {
    const src = document.getElementById('batchEggSource')?.value || 'purchased';
    const lblCost = document.getElementById('lblBatchEggCost');
    const costInput = document.getElementById('batchEggCost');
    if (!lblCost) return;

    if (src === 'purchased') {
      lblCost.textContent = this.t('lbl_egg_cost_total') || 'Coût d\'achat total des œufs (DT)';
      if (costInput) costInput.placeholder = 'ex: 120.000 DT';
    } else {
      lblCost.textContent = this.t('lbl_farm_egg_val') || 'Valeur / Coût des œufs de la ferme (DT)';
      if (costInput && (!costInput.value || Number(costInput.value) === 0)) {
        const count = parseInt(document.getElementById('batchEggsCount')?.value, 10) || 0;
        if (count > 0) costInput.value = (count * 0.350).toFixed(3);
      }
    }
  },

  handleBatchEggsCountChange() {
    const src = document.getElementById('batchEggSource')?.value;
    const count = parseInt(document.getElementById('batchEggsCount')?.value, 10) || 0;
    const costInput = document.getElementById('batchEggCost');
    if (src === 'farm' && costInput && (!costInput.value || Number(costInput.value) === 0)) {
      costInput.value = (count * 0.350).toFixed(3);
    }
  },

  handleIncubationMethodChange() {
    const method = document.getElementById('batchMethod')?.value || 'machine';
    const elecInput = document.getElementById('batchElectricityCost');
    if (method === 'poule') {
      if (elecInput) {
        elecInput.value = '0';
        elecInput.disabled = true;
      }
    } else {
      if (elecInput) {
        elecInput.disabled = false;
        if (!elecInput.value) elecInput.placeholder = 'ex: 15.000 DT';
      }
    }
  },

  handleSaveIncubationBatch(e) {
    e.preventDefault();
    const method = document.getElementById('batchMethod')?.value || 'machine';
    const speciesSelect = document.getElementById('batchEggType');
    const eggSpecies = speciesSelect.value;
    const durationDays = parseInt(speciesSelect.options[speciesSelect.selectedIndex].getAttribute('data-days'), 10) || 21;
    const breedInput = document.getElementById('batchBreed')?.value.trim();
    const nameInput = document.getElementById('batchName')?.value.trim();
    const eggsCount = parseInt(document.getElementById('batchEggsCount')?.value, 10);
    const startDate = document.getElementById('batchStartDate')?.value;
    const eggSource = document.getElementById('batchEggSource')?.value || 'purchased';
    const eggCost = parseFloat(document.getElementById('batchEggCost')?.value) || 0;
    const electricityCost = method === 'poule' ? 0 : (parseFloat(document.getElementById('batchElectricityCost')?.value) || 0);
    const temp = 37.7;
    const humidity = 48;
    const notes = document.getElementById('batchNotes')?.value.trim() || '';

    if (!eggsCount || eggsCount <= 0 || !startDate) {
      const isAr = appState.lang === 'ar';
      this.showToast(isAr ? 'يرجى إدخال عدد البيض وتاريخ البداية.' : 'Veuillez renseigner le nombre d\'œufs et la date de début.', 'warning');
      return;
    }

    const breed = breedInput || '-';
    const autoBatchNum = (appState.incubatorBatches?.length || 0) + 1;
    const name = nameInput || `Couvée #${autoBatchNum}`;

    const start = new Date(startDate);
    const hatch = new Date(start);
    hatch.setDate(hatch.getDate() + durationDays);

    const newBatch = {
      id: 'batch-' + Date.now().toString(36),
      method,
      eggSpecies,
      speciesDurationDays: durationDays,
      breed,
      name,
      eggsCount,
      eggSource,
      eggCost,
      electricityCost,
      startDate,
      hatchDate: hatch.toISOString().split('T')[0],
      temp: method === 'poule' ? 38.0 : temp,
      humidity: method === 'poule' ? 55 : humidity,
      notes,
      status: 'incubating'
    };

    // Déduire du stock uniquement si ce sont les œufs de la ferme
    if (eggSource === 'farm') {
      const currentStock = Number(appState.eggStock) || 0;
      appState.eggStock = Math.max(0, currentStock - eggsCount);
    } else if (eggSource === 'purchased' && eggCost > 0) {
      // Enregistrer automatiquement la dépense d'achat d'œufs
      appState.expenses = appState.expenses || [];
      appState.expenses.unshift({
        id: 'exp-oac-' + Date.now().toString(36),
        title: `Achat œufs fécondés (${eggsCount} œufs - ${name})`,
        category: 'autre',
        total: eggCost,
        date: startDate,
        notes: `Achat d'œufs à couver pour incubation ${name}`
      });
    }

    appState.incubatorBatches.unshift(newBatch);
    this.saveState();

    if (window.MobileBridge) {
      window.MobileBridge.scheduleIncubatorNotification({
        id: newBatch.id + '-hatch',
        title: `🐣 Éclosion : ${newBatch.name}`,
        body: `Les ${newBatch.eggsCount} œufs${(newBatch.breed && newBatch.breed !== '-') ? ' de ' + newBatch.breed : ''} arrivent à terme aujourd'hui !`,
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
    const breedDisplay = (batch.breed && batch.breed !== '-') ? ` (${batch.breed})` : '';
    document.getElementById('hatchPromptBatchTitle').textContent = `${this.t('hatch_alert_title')} : ${batch.name}${breedDisplay}`;
    const methodTxt = batch.method === 'poule' ? this.t('opt_method_hen') : this.t('opt_method_machine');
    document.getElementById('hatchPromptBatchDesc').textContent = `${this.t('lbl_eggs_count')}: ${batch.eggsCount} (${methodTxt}).`;

    // Pré-remplir les coûts réels depuis la couvée
    const eggCostInput = document.getElementById('hatchEggCostActual');
    if (eggCostInput) {
      eggCostInput.value = (Number(batch.eggCost) || 0).toFixed(3);
    }
    const elecCostInput = document.getElementById('hatchElectricityCostActual');
    if (elecCostInput) {
      elecCostInput.value = (Number(batch.electricityCost) || 0).toFixed(3);
    }

    // Proposer une estimation par défaut (80% des œufs)
    const liveInput = document.getElementById('hatchLiveCount');
    if (liveInput) {
      liveInput.value = Math.max(1, Math.round(batch.eggsCount * 0.8));
    }

    // Réinitialiser le sélecteur de destination
    const targetSelect = document.getElementById('hatchTargetFlock');
    if (targetSelect) targetSelect.value = 'new';
    const existingGroup = document.getElementById('hatchExistingLotGroup');
    if (existingGroup) existingGroup.style.display = 'none';

    // Remplir la liste des lots existants
    const existingSelect = document.getElementById('hatchExistingLotSelect');
    if (existingSelect) {
      existingSelect.innerHTML = '';
      const lots = (appState.animals || []).filter(a => (Number(a.currentQuantity) || 0) > 0);
      lots.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = `${l.name || l.id} (${l.currentQuantity} têtes - ${l.species || ''})`;
        existingSelect.appendChild(opt);
      });
    }

    this.updateHatchCalculationsPreview();
    this.openModal('modalHatchPrompt');
  },

  handleHatchTargetFlockChange() {
    const val = document.getElementById('hatchTargetFlock')?.value;
    const group = document.getElementById('hatchExistingLotGroup');
    if (group) {
      group.style.display = val === 'existing' ? 'block' : 'none';
    }
  },

  updateHatchCalculationsPreview() {
    const batchId = document.getElementById('hatchPromptBatchId')?.value;
    const batch = appState.incubatorBatches.find(b => b.id === batchId);
    const card = document.getElementById('hatchSummaryCard');
    if (!card) return;

    const totalEggs = batch ? (Number(batch.eggsCount) || 1) : 1;
    const liveCount = parseInt(document.getElementById('hatchLiveCount')?.value, 10) || 0;
    const eggCost = parseFloat(document.getElementById('hatchEggCostActual')?.value) || 0;
    const elecCost = parseFloat(document.getElementById('hatchElectricityCostActual')?.value) || 0;
    const totalCost = eggCost + elecCost;

    const hatchRate = Math.min(100, Math.round((liveCount / totalEggs) * 100));
    const losses = Math.max(0, totalEggs - liveCount);
    const costPerChick = liveCount > 0 ? (totalCost / liveCount) : 0;

    const rateBadgeColor = hatchRate >= 70 ? 'var(--accent-emerald, #10b981)' : (hatchRate >= 50 ? '#f59e0b' : '#ef4444');

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.4rem;">
        <span style="font-weight: 800; font-size: 0.88rem; color: var(--text-main);" data-i18n="lbl_hatch_calc_summary">
          ${this.t('lbl_hatch_calc_summary') || 'Bilan Financier & Zootechnique'}
        </span>
        <span class="badge-pill" style="background: ${rateBadgeColor}; color: #ffffff; font-weight: 800; font-size: 0.76rem; padding: 0.15rem 0.55rem;">
          ${hatchRate}% ${this.t('hatch_kpi_rate') || 'Taux d\'éclosion'}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.5rem; margin-bottom: 0.65rem;">
        <div style="background: var(--bg-card); padding: 0.45rem 0.65rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <small class="text-muted" style="font-size: 0.72rem;" data-i18n="hatch_kpi_losses">${this.t('hatch_kpi_losses') || 'Pertes (non éclos)'}</small>
          <div style="font-weight: 800; color: #f87171; font-size: 1.05rem;">
            ${losses} <small style="font-size: 0.75rem; font-weight: normal;">œufs</small>
          </div>
        </div>
        <div style="background: var(--bg-card); padding: 0.45rem 0.65rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
          <small class="text-muted" style="font-size: 0.72rem;">Coût Total Couvée</small>
          <div style="font-weight: 800; color: #38bdf8; font-size: 1.05rem;">
            ${this.formatMoney(totalCost)}
          </div>
        </div>
        <div style="background: var(--bg-card); padding: 0.45rem 0.65rem; border-radius: var(--radius-sm); border: 1.5px solid var(--accent-emerald);">
          <small class="text-muted" style="font-size: 0.72rem; font-weight: 700; color: var(--accent-emerald);" data-i18n="hatch_kpi_cost_per_chick">${this.t('hatch_kpi_cost_per_chick') || 'Coût de revient / poussin'}</small>
          <div style="font-weight: 900; color: var(--accent-emerald); font-size: 1.15rem;">
            ${this.formatMoney(costPerChick)} <small style="font-size: 0.72rem; font-weight: 600;">/ tête</small>
          </div>
        </div>
      </div>

      <div style="font-size: 0.76rem; color: var(--text-muted); line-height: 1.35; background: rgba(0,0,0,0.15); padding: 0.4rem 0.6rem; border-radius: var(--radius-xs);" data-i18n="hatch_cost_absorption_note">
        ${this.t('hatch_cost_absorption_note')}
      </div>
    `;
  },

  handleConfirmHatch(e) {
    e.preventDefault();
    const batchId = document.getElementById('hatchPromptBatchId').value;
    const liveCount = parseInt(document.getElementById('hatchLiveCount').value, 10);
    const choice = document.getElementById('hatchTargetFlock').value;
    const eggCost = parseFloat(document.getElementById('hatchEggCostActual')?.value) || 0;
    const elecCost = parseFloat(document.getElementById('hatchElectricityCostActual')?.value) || 0;
    const totalCost = eggCost + elecCost;

    const batch = appState.incubatorBatches.find(b => b.id === batchId);
    if (!batch) return;

    if (isNaN(liveCount) || liveCount < 0) {
      const isAr = appState.lang === 'ar';
      this.showToast(isAr ? 'يرجى إدخال عدد صحيح موجب من الفراخ.' : 'Veuillez entrer un nombre positif de poussins.', 'warning');
      return;
    }

    const costPerChick = liveCount > 0 ? Number((totalCost / liveCount).toFixed(3)) : 0;
    const hatchDate = batch.hatchDate || this.getTodayStr();

    // Enregistrer la dépense d'électricité si renseignée (>0)
    if (elecCost > 0) {
      appState.expenses = appState.expenses || [];
      appState.expenses.unshift({
        id: 'exp-elec-' + Date.now().toString(36),
        title: `Électricité couveuse (${batch.name})`,
        category: 'electricite_couveuse',
        total: elecCost,
        date: hatchDate,
        notes: `Électricité couveuse pour incubation de ${batch.eggsCount} œufs`
      });
    }

    if (liveCount > 0) {
      if (choice === 'existing') {
        const targetLotId = document.getElementById('hatchExistingLotSelect')?.value;
        const targetLot = (appState.animals || []).find(a => a.id === targetLotId);
        if (targetLot) {
          const prevQty = Number(targetLot.currentQuantity) || 0;
          const prevCost = Number(targetLot.costPerHead) || 0;
          const newQty = prevQty + liveCount;
          const weightedCost = newQty > 0 ? ((prevQty * prevCost) + (liveCount * costPerChick)) / newQty : costPerChick;

          targetLot.currentQuantity = newQty;
          targetLot.initialQuantity = (Number(targetLot.initialQuantity) || prevQty) + liveCount;
          targetLot.costPerHead = Number(weightedCost.toFixed(3));
          targetLot.notes = (targetLot.notes || '') + ` [Ajout +${liveCount} poussins éclos de ${batch.name} (coût éclosion: ${this.formatMoney(costPerChick)}/tête)]`;
        } else {
          this.createNewFlockFromHatch(batch, liveCount, costPerChick, totalCost);
        }
      } else {
        this.createNewFlockFromHatch(batch, liveCount, costPerChick, totalCost);
      }
    }

    // Retirer ou archiver la couvée de l'incubateur
    appState.incubatorBatches = appState.incubatorBatches.filter(b => b.id !== batchId);

    this.saveState();
    this.closeModal('modalHatchPrompt');
    this.renderAll();

    this.showToast(this.t('toast_hatch_confirmed', { n: liveCount }));
  },

  createNewFlockFromHatch(batch, liveCount, costPerChick, totalCost) {
    const methodTag = batch.method === 'poule' ? 'Poule' : 'Machine';
    const hatchDate = batch.hatchDate || this.getTodayStr();
    const finalCost = costPerChick !== undefined ? costPerChick : (batch.method === 'poule' ? 0.20 : 0.40);
    const hatchRate = batch.eggsCount > 0 ? Math.round((liveCount / batch.eggsCount) * 100) : 0;

    const newFlock = {
      id: 'lot-chick-' + Date.now().toString(36),
      species: batch.eggSpecies === 'poule' ? 'poussin' : (batch.eggSpecies === 'pintade' ? 'pintade' : ((batch.eggSpecies === 'canard' || batch.eggSpecies === 'canard_barbarie') ? 'canard' : (batch.eggSpecies === 'caille' ? 'caille' : 'autre'))),
      breed: batch.breed || 'Beldi',
      name: `Génération Éclose (${batch.name} - ${methodTag})`,
      initialQuantity: liveCount,
      currentQuantity: liveCount,
      mortality: 0,
      birthDate: hatchDate,
      costPerHead: Number(finalCost.toFixed(3)),
      stage: 'Démarrage',
      notes: `Éclos le ${this.formatDateFR(hatchDate)} : ${liveCount} poussins sur ${batch.eggsCount} œufs (Taux d'éclosion: ${hatchRate}%). Coût total engagé: ${this.formatMoney(totalCost || 0)} (${this.formatMoney(finalCost)}/poussin absorbant électricité et pertes).`
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

  goToCurrentMonth() {
    appState.calendarDate = new Date();
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
      t = t.replace(/Facture [eé]lectricit[eé] couveuse/gi, 'فاتورة كهرباء الفقاسة');
      t = t.replace(/[EÉ]lectricit[eé] couveuse/gi, 'كهرباء الفقاسة');
      t = t.replace(/Achat aliment\s*:\s*/gi, 'شراء علف : ');
      t = t.replace(/Achat aliment\s*\/\s*Stock r[eé]serve/gi, 'شراء علف / مخزون احتياطي');
      t = t.replace(/Achat aliment/gi, 'شراء علف');
      t = t.replace(/Stock r[eé]serve/gi, 'مخزون احتياطي');
      t = t.replace(/sacs?\s*d['\s]?alimentation/gi, 'أكياس علف');
      t = t.replace(/sac\s*d['\s]?aliment/gi, 'كيس علف');
      t = t.replace(/(\d+(?:\.\d+)?)\s*kg/gi, '$1 كغ');
      return t;
    }

    if (lang === 'en') {
      let t = title;
      t = t.replace(/Facture [eé]lectricit[eé] couveuse/gi, 'Incubator electricity bill');
      t = t.replace(/[EÉ]lectricit[eé] couveuse/gi, 'Incubator electricity');
      t = t.replace(/Achat aliment\s*:\s*/gi, 'Feed Purchase: ');
      t = t.replace(/Achat aliment\s*\/\s*Stock r[eé]serve/gi, 'Feed Purchase / Reserve Stock');
      t = t.replace(/Achat aliment/gi, 'Feed Purchase');
      t = t.replace(/sacs?\s*d['\s]?alimentation/gi, 'feed bags');
      return t;
    }

    let t = title;
    t = t.replace(/فاتورة كهرباء الفقاسة/gi, 'Facture électricité couveuse');
    t = t.replace(/كهرباء الفقاسة/gi, 'Électricité couveuse');
    t = t.replace(/شراء علف\s*:\s*/gi, 'Achat aliment : ');
    t = t.replace(/شراء علف\s*\/\s*مخزون احتياطي/gi, 'Achat aliment / Stock réserve');
    t = t.replace(/أكياس علف/gi, 'Sacs d\'alimentation');
    t = t.replace(/(\d+(?:\.\d+)?)\s*كغ/gi, '$1 kg');
    return t;
  },

  getTranslatedSaleDescription(desc) {
    return desc || '';
  },

  getTranslatedLotName(name) {
    return name || '';
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


  addDays(dateStr, numDays) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + numDays);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch (e) {
      return dateStr;
    }
  },

  renderAddGestationModal(defaultAnimalId = null, defaultDate = null) {
    const animalSelect = document.getElementById('gestationAnimalId');
    if (!animalSelect) return;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    // Filter female reproductive animals / lots:
    // Cows, heifers, ewes, goats, or any active herd
    const femaleAnimals = (appState.animals || []).filter(a => {
      const sp = (a.species || '').toLowerCase();
      const st = (a.stage || '').toLowerCase();
      return (
        sp === 'vache_laitiere' || sp === 'genisse' || sp === 'brebis' || sp === 'chevre' ||
        sp.includes('vache') || sp.includes('brebis') || sp.includes('chevre') ||
        st.includes('lactation') || st.includes('tarie') || st.includes('gestante') ||
        st.includes('femelle') || st.includes('reproduct') ||
        Number(a.currentQuantity) > 0
      );
    });

    if (femaleAnimals.length > 0) {
      animalSelect.innerHTML = femaleAnimals.map(a => {
        const icon = this.getSpeciesIcon(a.species);
        const name = this.getAnimalDisplayName(a);
        const stage = this.translateStage(a.stage);
        const qty = a.currentQuantity || a.quantity || 1;
        const headsLabel = isAr ? 'رأس' : (isEn ? 'heads' : 'têtes');
        return `<option value="${a.id}">${icon} ${name} (${stage} • ${qty} ${headsLabel})</option>`;
      }).join('');
      if (defaultAnimalId && femaleAnimals.some(a => a.id === defaultAnimalId)) {
        animalSelect.value = defaultAnimalId;
      }
    } else {
      animalSelect.innerHTML = `<option value="">${isAr ? 'لا توجد إناث أو مواشي مسجلة' : (isEn ? 'No female animals registered' : 'Aucune femelle ou cheptel enregistré')}</option>`;
    }

    const dateInput = document.getElementById('gestationMatingDate');
    if (dateInput) {
      dateInput.value = defaultDate || this.getTodayStr();
    }
    this.updateGestationPreview();
  },

  handleGestationAnimalChange(animalId) {
    this.updateGestationPreview();
  },

  updateGestationPreview() {
    const animalId = document.getElementById('gestationAnimalId')?.value;
    const matingDate = document.getElementById('gestationMatingDate')?.value || this.getTodayStr();
    const container = document.getElementById('gestationMilestonesContent');
    if (!container) return;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    const animal = (appState.animals || []).find(a => a.id === animalId);
    const sp = (animal?.species || 'vache_laitiere').toLowerCase();
    const isBovine = (sp.includes('vache') || sp.includes('bovin') || sp.includes('genisse'));

    const totalGestationDays = isBovine ? 283 : 150;
    const echoDays = isBovine ? 60 : 50;
    const dryOffDays = isBovine ? 223 : 120; // 60d before calving (cow) or 30d pre-lambing booster (sheep)

    const echoDate = this.addDays(matingDate, echoDays);
    const dryDate = this.addDays(matingDate, dryOffDays);
    const birthDate = this.addDays(matingDate, totalGestationDays);

    let html = '';
    if (isBovine) {
      html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.5rem; margin-top: 0.35rem;">
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-sm); padding: 0.45rem;">
            <div style="font-weight: 700; color: #38bdf8;">🔍 ${isAr ? 'فحص الإيكوغرافيا' : (isEn ? 'Ultrasound Check' : 'Échographie')}</div>
            <div style="font-size: 0.82rem; font-weight: 700; margin-top: 2px;">${this.formatDateFR(echoDate)}</div>
            <small class="text-muted">${isAr ? 'اليوم +60' : (isEn ? 'Day +60' : 'À J+60')}</small>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-sm); padding: 0.45rem;">
            <div style="font-weight: 700; color: #f59e0b;">🥛 ${isAr ? 'موعد التجفيف' : (isEn ? 'Dry-off Date' : 'Tarissement')}</div>
            <div style="font-size: 0.82rem; font-weight: 700; margin-top: 2px;">${this.formatDateFR(dryDate)}</div>
            <small class="text-muted">${isAr ? 'قبل الولادة بشهرين' : (isEn ? '60d pre-calving' : 'À J+223 (-60j)')}</small>
          </div>
          <div style="background: rgba(236,72,153,0.12); border: 1px solid rgba(236,72,153,0.3); border-radius: var(--radius-sm); padding: 0.45rem;">
            <div style="font-weight: 700; color: #f472b6;">🍼 ${isAr ? 'موعد الولادة (الفطام)' : (isEn ? 'Expected Calving' : 'Vêlage prévu')}</div>
            <div style="font-size: 0.82rem; font-weight: 700; margin-top: 2px;">${this.formatDateFR(birthDate)}</div>
            <small style="color: #f472b6; font-weight: 600;">${isAr ? 'مدة العشار 283 يوماً (~9 أشهر)' : (isEn ? '283 days gestation (~9 mos)' : '283 jours (~9 mois)')}</small>
          </div>
        </div>
      `;
    } else {
      html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.5rem; margin-top: 0.35rem;">
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-sm); padding: 0.45rem;">
            <div style="font-weight: 700; color: #38bdf8;">🔍 ${isAr ? 'فحص الإيكوغرافيا' : (isEn ? 'Ultrasound Check' : 'Constat écho')}</div>
            <div style="font-size: 0.82rem; font-weight: 700; margin-top: 2px;">${this.formatDateFR(echoDate)}</div>
            <small class="text-muted">${isAr ? 'اليوم +50' : (isEn ? 'Day +50' : 'À J+50')}</small>
          </div>
          <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--radius-sm); padding: 0.45rem;">
            <div style="font-weight: 700; color: #a78bfa;">💉 ${isAr ? 'تطعيم قبل الولادة' : (isEn ? 'Pre-lambing Vaccine' : 'Vaccin pré-agnelage')}</div>
            <div style="font-size: 0.82rem; font-weight: 700; margin-top: 2px;">${this.formatDateFR(dryDate)}</div>
            <small class="text-muted">${isAr ? 'قبل الولادة بشهر' : (isEn ? '30d pre-lambing' : 'À J+120 (-30j)')}</small>
          </div>
          <div style="background: rgba(236,72,153,0.12); border: 1px solid rgba(236,72,153,0.3); border-radius: var(--radius-sm); padding: 0.45rem;">
            <div style="font-weight: 700; color: #f472b6;">🍼 ${isAr ? 'موعد ولادة الخراف' : (isEn ? 'Expected Lambing' : 'Agnelage prévu')}</div>
            <div style="font-size: 0.82rem; font-weight: 700; margin-top: 2px;">${this.formatDateFR(birthDate)}</div>
            <small style="color: #f472b6; font-weight: 600;">${isAr ? 'مدة العشار 150 يوماً (~5 أشهر)' : (isEn ? '150 days gestation (~5 mos)' : '150 jours (~5 mois)')}</small>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  },

  handleSaveGestation(e) {
    if (e && e.preventDefault) e.preventDefault();

    const animalId = document.getElementById('gestationAnimalId')?.value;
    const gestType = document.getElementById('gestationType')?.value || 'saillie_naturelle';
    const matingDate = document.getElementById('gestationMatingDate')?.value || this.getTodayStr();
    const sire = document.getElementById('gestationSire')?.value?.trim() || '';
    const notes = document.getElementById('gestationNotes')?.value?.trim() || '';

    if (!animalId) {
      this.showToast(this.t('lbl_gestation_animal'), 'warning');
      return;
    }

    const animal = (appState.animals || []).find(a => a.id === animalId);
    if (!animal) return;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const sp = (animal.species || 'vache_laitiere').toLowerCase();
    const isBovine = (sp.includes('vache') || sp.includes('bovin') || sp.includes('genisse'));
    const animalName = this.getAnimalDisplayName(animal);

    const totalDays = isBovine ? 283 : 150;
    const echoDays = isBovine ? 60 : 50;
    const dryDays = isBovine ? 223 : 120;

    const echoDate = this.addDays(matingDate, echoDays);
    const dryDate = this.addDays(matingDate, dryDays);
    const birthDate = this.addDays(matingDate, totalDays);

    const gestGroupId = 'gest-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4);

    const events = [
      {
        id: gestGroupId + '-mating',
        groupId: gestGroupId,
        type: 'saillie',
        date: matingDate,
        title: `${isAr ? 'تلقيح / ضراب' : (isEn ? 'Breeding / AI' : 'Saillie / IA')} (${animalName})`,
        linkedAnimalId: animalId,
        animalName,
        details: sire ? `${isAr ? 'الفحل:' : (isEn ? 'Sire:' : 'Reproducteur :')} ${sire}` : (notes || ''),
        isDone: true
      },
      {
        id: gestGroupId + '-echo',
        groupId: gestGroupId,
        type: 'echographie',
        date: echoDate,
        title: `🔍 ${isAr ? 'فحص الإيكوغرافيا' : (isEn ? 'Ultrasound Check' : 'Échographie')} (${animalName})`,
        linkedAnimalId: animalId,
        animalName,
        details: isAr ? 'تأكيد ثبوت الحمل' : (isEn ? 'Pregnancy confirmation' : 'Confirmation de gestation'),
        isDone: false
      },
      {
        id: gestGroupId + '-dry',
        groupId: gestGroupId,
        type: isBovine ? 'tarissement' : 'vaccin',
        date: dryDate,
        title: isBovine 
          ? `🥛 ${isAr ? 'تجفيف وراحة' : (isEn ? 'Dry-off' : 'Tarissement')} (${animalName})`
          : `💉 ${isAr ? 'تطعيم ما قبل الولادة' : (isEn ? 'Pre-lambing vaccine' : 'Vaccin pré-agnelage')} (${animalName})`,
        linkedAnimalId: animalId,
        animalName,
        details: isBovine 
          ? (isAr ? 'إيقاف الحلب للراحة وتجهيز الضرع' : (isEn ? 'Stop milking for pre-calving rest' : 'Arrêt de la traite 60j avant vêlage'))
          : (isAr ? 'تحصين النعجة لمناعة اللبأ للحملان' : (isEn ? 'Ewe booster for lamb colostral immunity' : 'Rappel entérotoxémie pour immunité colostrale')),
        isDone: false
      },
      {
        id: gestGroupId + '-birth',
        groupId: gestGroupId,
        type: 'mise_bas',
        date: birthDate,
        title: isBovine 
          ? `🍼 ${isAr ? 'موعد الولادة (فطام العجل)' : (isEn ? 'Expected Calving' : 'Vêlage prévu')} (${animalName})`
          : `🍼 ${isAr ? 'موعد ولادة الخراف' : (isEn ? 'Expected Lambing' : 'Agnelage prévu')} (${animalName})`,
        linkedAnimalId: animalId,
        animalName,
        details: `${isAr ? 'مدة العشار الكاملة:' : (isEn ? 'Full gestation:' : 'Gestation totale :')} ${totalDays} ${isAr ? 'يوماً' : (isEn ? 'days' : 'jours')}`,
        isDone: false
      }
    ];

    if (!Array.isArray(appState.calendarEvents)) {
      appState.calendarEvents = [];
    }
    appState.calendarEvents.push(...events);

    // Update Animal status
    animal.isPregnant = true;
    animal.matingDate = matingDate;
    animal.expectedBirthDate = birthDate;
    animal.dryingOffDate = dryDate;
    animal.sire = sire;
    if (notes) animal.reproductionNotes = notes;
    animal.stage = isAr ? 'عشار / حامل' : (isEn ? 'Pregnant' : 'Gestante');

    this.saveState();
    if (window.appAuth && typeof window.appAuth.pushData === 'function') {
      window.appAuth.pushData(false, true);
    }

    this.closeModal('modalAddGestation');
    this.renderAll();
    this.showToast(this.t('toast_gestation_saved') || '🤰 Gestation enregistrée et jalons ajoutés au calendrier !');
  },

  renderAddVaccineModal(defaultTargetId = null, defaultDate = null) {
    const targetSelect = document.getElementById('vaccineTargetLotId');
    if (!targetSelect) return;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    const activeLots = (appState.animals || []).filter(a => (Number(a.currentQuantity) || 0) > 0);
    let optionsHtml = `<option value="all">${isAr ? '🌐 كامل القطيع (جميع الحظائر)' : (isEn ? '🌐 Entire Herd / All Flocks' : '🌐 Toute la ferme (Tous les cheptels)')}</option>`;
    optionsHtml += activeLots.map(a => {
      const icon = this.getSpeciesIcon(a.species);
      const name = this.getAnimalDisplayName(a);
      const qty = a.currentQuantity || 1;
      const headsLabel = isAr ? 'رأس' : (isEn ? 'heads' : 'têtes');
      return `<option value="${a.id}">${icon} ${name} (${qty} ${headsLabel})</option>`;
    }).join('');

    targetSelect.innerHTML = optionsHtml;
    if (defaultTargetId) targetSelect.value = defaultTargetId;

    const dateInput = document.getElementById('vaccineDate');
    if (dateInput) {
      dateInput.value = defaultDate || this.getTodayStr();
    }

    this.handleVaccineTargetChange(targetSelect.value);
  },

  handleVaccineTargetChange(targetId) {
    const container = document.getElementById('vaccinePresetsContainer');
    if (!container) return;

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    let presets = [];
    let sp = 'general';
    if (targetId !== 'all') {
      const a = (appState.animals || []).find(an => an.id === targetId);
      sp = (a?.species || '').toLowerCase();
    }

    if (sp.includes('vache') || sp.includes('bovin') || sp.includes('veau') || sp.includes('taurillon')) {
      presets = [
        { name: isAr ? '💉 لقاح التسمم المعوي والكلستريديا' : (isEn ? '💉 Enterotoxemia / Clostridial Vaccine' : '💉 Vaccin Entérotoxémie / Clostridioses'), color: 'btn-emerald' },
        { name: isAr ? '💉 لقاح الحمى القلاعية' : (isEn ? '💉 Foot-and-Mouth Vaccine' : '💉 Vaccin Fièvre Aphteuse'), color: 'btn-outline' },
        { name: isAr ? '💉 لقاح الباستوريلا والتنفسي' : (isEn ? '💉 Pasteurella / Respiratory Vaccine' : '💉 Vaccin Pasteurellose / Respiratoire'), color: 'btn-outline' },
        { name: isAr ? '🪱 مضاد الطفيليات والديدان' : (isEn ? '🪱 Dewormer / Antiparasitic' : '🪱 Déparasitage / Vermifuge complet'), color: 'btn-amber' }
      ];
    } else if (sp.includes('mouton') || sp.includes('brebis') || sp.includes('agneau') || sp.includes('chevre')) {
      presets = [
        { name: isAr ? '💉 لقاح الكلية الرخوة والتسمم المعوي' : (isEn ? '💉 Enterotoxemia / Pulpy Kidney' : '💉 Vaccin Entérotoxémie (Rein pulpeux)'), color: 'btn-emerald' },
        { name: isAr ? '💉 لقاح انقطاع الحليب المعدي' : (isEn ? '💉 Contagious Agalactia Vaccine' : '💉 Vaccin Agalaxie Contagieuse'), color: 'btn-outline' },
        { name: isAr ? '💉 لقاح جدري الأغنام (الجدري)' : (isEn ? '💉 Sheep Pox Vaccine' : '💉 Vaccin Clavelée (Variole ovine)'), color: 'btn-outline' },
        { name: isAr ? '🪱 علاج الجرب والديدان الكبدية' : (isEn ? '🪱 Dewormer & Scabies Treatment' : '🪱 Déparasitage Gale, Douve & Strongles'), color: 'btn-amber' }
      ];
    } else {
      presets = [
        { name: isAr ? '💉 لقاح النيوكاسل (طاعون الدجاج)' : (isEn ? '💉 Newcastle Disease Vaccine' : '💉 Vaccin Newcastle (HB1 / Clone 30)'), color: 'btn-emerald' },
        { name: isAr ? '💉 لقاح الجمبورو (التهاب الجراب)' : (isEn ? '💉 Gumboro Vaccine' : '💉 Vaccin Gumboro (Bursite)'), color: 'btn-outline' },
        { name: isAr ? '💉 لقاح التهاب الشعب الهوائية المعدي' : (isEn ? '💉 Infectious Bronchitis (IB)' : '💉 Vaccin Bronchite Infectieuse (H120)'), color: 'btn-outline' },
        { name: isAr ? '🪱 مضاد الديدان المعوية وفيتامينات' : (isEn ? '🪱 Dewormer & Anti-Stress Vitamins' : '🪱 Vermifuge aviaire & Vitamines AD3E'), color: 'btn-amber' }
      ];
    }

    container.innerHTML = presets.map(p => `
      <button type="button" class="btn btn-sm ${p.color}" style="font-size: 0.74rem; padding: 0.3rem 0.55rem; font-weight: 600;" onclick="app.selectVaccinePreset('${p.name.replace(/'/g, "\\'")}')">
        ${p.name}
      </button>
    `).join('');
  },

  selectVaccinePreset(name) {
    const input = document.getElementById('vaccineName');
    if (input) input.value = name;
  },

  handleSaveVaccine(e) {
    if (e && e.preventDefault) e.preventDefault();

    const targetLotId = document.getElementById('vaccineTargetLotId')?.value || 'all';
    const vaccineName = document.getElementById('vaccineName')?.value?.trim();
    const vaccineDate = document.getElementById('vaccineDate')?.value || this.getTodayStr();
    const booster = document.getElementById('vaccineBoosterSelect')?.value || 'none';
    const notes = document.getElementById('vaccineNotes')?.value?.trim() || '';

    if (!vaccineName) {
      this.showToast(this.t('lbl_vaccine_name'), 'warning');
      return;
    }

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    let animalName = isAr ? 'كامل المزرعة' : (isEn ? 'Whole Farm' : 'Toute la ferme');
    if (targetLotId !== 'all') {
      const a = (appState.animals || []).find(an => an.id === targetLotId);
      if (a) animalName = this.getAnimalDisplayName(a);
    }

    const vacGroupId = 'vac-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4);

    const primaryEvent = {
      id: vacGroupId + '-dose1',
      groupId: vacGroupId,
      type: 'vaccin',
      date: vaccineDate,
      title: `${vaccineName} (${animalName})`,
      linkedAnimalId: targetLotId,
      animalName,
      details: notes,
      isDone: false
    };

    if (!Array.isArray(appState.calendarEvents)) {
      appState.calendarEvents = [];
    }
    appState.calendarEvents.push(primaryEvent);

    if (booster !== 'none') {
      let boosterDays = 21;
      if (booster === '1m') boosterDays = 30;
      if (booster === '6m') boosterDays = 182;
      if (booster === '1y') boosterDays = 365;

      const boosterDate = this.addDays(vaccineDate, boosterDays);
      const boosterLabel = isAr ? 'جرعة تذكيرية' : (isEn ? 'Booster' : 'Rappel');
      const boosterEvent = {
        id: vacGroupId + '-booster',
        groupId: vacGroupId,
        type: 'vaccin',
        date: boosterDate,
        title: `💉 ${boosterLabel} : ${vaccineName} (${animalName})`,
        linkedAnimalId: targetLotId,
        animalName,
        details: `${isAr ? 'جرعة تذكيرية بعد' : (isEn ? 'Booster after' : 'Rappel après')} ${boosterDays} ${isAr ? 'يوماً' : (isEn ? 'days' : 'jours')}`,
        isDone: false
      };
      appState.calendarEvents.push(boosterEvent);
    }

    this.saveState();
    if (window.appAuth && typeof window.appAuth.pushData === 'function') {
      window.appAuth.pushData(false, true);
    }

    this.closeModal('modalAddVaccine');
    this.renderAll();
    this.showToast(this.t('toast_vaccine_saved') || '💉 Vaccin / Soin programmé avec succès !');
  },

  showDayEvents(dateStr) {
    const modal = document.getElementById('modalDayEventsDetail');
    const titleLabel = document.getElementById('dayEventsDateLabel');
    const container = document.getElementById('dayEventsListContainer');
    if (!modal || !container) return;

    titleLabel.textContent = this.formatDateFR(dateStr);
    modal.setAttribute('data-current-date', dateStr);

    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';

    // 1. Gather calendarEvents
    const dayCalendarEvents = (appState.calendarEvents || []).filter(e => e.date === dateStr);

    // 2. Incubator hatches & candlings
    const dayIncubator = [];
    (appState.incubatorBatches || []).forEach(b => {
      if (b.hatchDate === dateStr) {
        dayIncubator.push({ id: b.id, type: 'hatch', title: `🐣 ${this.t('cal_legend_hatch')} ${b.name}`, details: `${b.eggCount || 0} ${this.t('unit_eggs')}` });
      }
      if (b.candling1Date === dateStr) {
        dayIncubator.push({ id: b.id, type: 'mirage', title: `🔍 ${this.t('stage_header_candling1')} (${b.name})`, details: '' });
      }
      if (b.lockdownDate === dateStr) {
        dayIncubator.push({ id: b.id, type: 'lockdown', title: `🛑 ${this.t('stage_header_lockdown')} (${b.name})`, details: '' });
      }
    });

    // 3. Sales
    const daySales = (appState.sales || []).filter(s => s.date === dateStr);

    let html = '';

    if (dayCalendarEvents.length === 0 && dayIncubator.length === 0 && daySales.length === 0) {
      html = `
        <div style="text-align: center; padding: 1.5rem 1rem; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md);">
          <div style="font-size: 1.8rem; margin-bottom: 0.3rem;">📅</div>
          <div style="font-weight: 600;">${isAr ? 'لا توجد مواعيد مسجلة في هذا اليوم' : (isEn ? 'No events scheduled on this day' : 'Aucun événement programmé ce jour-là')}</div>
          <div style="font-size: 0.78rem; margin-top: 0.25rem;">${isAr ? 'يمكنك إضافة موعد تلقيح أو تطعيم بالأزرار أدناه.' : (isEn ? 'You can add a breeding milestone or vaccine using the buttons below.' : 'Utilisez les boutons ci-dessous pour programmer un vêlage ou un vaccin.')}</div>
        </div>
      `;
    } else {
      // Render calendarEvents
      dayCalendarEvents.forEach(evt => {
        const isDone = Boolean(evt.isDone);
        const icon = evt.type === 'mise_bas' ? '🍼' : (evt.type === 'tarissement' ? '🥛' : (evt.type === 'echographie' ? '🔍' : '💉'));
        const badgeColor = evt.type === 'mise_bas' ? '#ec4899' : (evt.type === 'tarissement' ? '#f59e0b' : '#a78bfa');

        html += `
          <div class="panel-card" style="padding: 0.75rem 0.9rem; margin: 0; border: 1.5px solid ${isDone ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}; background: ${isDone ? 'rgba(16,185,129,0.05)' : 'var(--bg-surface)'}; border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
              <div>
                <div style="font-weight: 700; font-size: 0.88rem; color: ${badgeColor}; display: flex; align-items: center; gap: 0.35rem;">
                  <span>${icon}</span>
                  <span style="${isDone ? 'text-decoration: line-through; opacity: 0.8;' : ''}">${evt.title}</span>
                </div>
                ${evt.details ? `<div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.2rem;">${evt.details}</div>` : ''}
              </div>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <button type="button" class="btn btn-sm ${isDone ? 'btn-emerald' : 'btn-outline'}" style="font-size: 0.72rem; padding: 0.25rem 0.55rem;" onclick="app.toggleEventDone('${evt.id}', '${dateStr}')">
                  ${isDone ? (isAr ? '✓ تم' : (isEn ? '✓ Done' : '✓ Fait')) : (isAr ? 'تحديد كمنجز' : (isEn ? 'Mark done' : 'Marquer fait'))}
                </button>
                <button type="button" class="btn btn-sm btn-outline text-rose" style="font-size: 0.72rem; padding: 0.25rem 0.45rem;" onclick="app.deleteCalendarEvent('${evt.id}', '${dateStr}')">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        `;
      });

      // Render Incubator
      dayIncubator.forEach(b => {
        html += `
          <div class="panel-card" style="padding: 0.75rem 0.9rem; margin: 0; border: 1px solid rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.05); border-radius: var(--radius-md);">
            <div style="font-weight: 700; font-size: 0.88rem; color: var(--accent-amber);">${b.title}</div>
            ${b.details ? `<div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.2rem;">${b.details}</div>` : ''}
          </div>
        `;
      });

      // Render Sales
      daySales.forEach(s => {
        html += `
          <div class="panel-card" style="padding: 0.75rem 0.9rem; margin: 0; border: 1px solid rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.05); border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent-emerald);">💰 ${s.description || this.t('cal_legend_sale')}</div>
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--accent-emerald);">${this.formatMoney(s.total)}</div>
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = html;
    this.openModal('modalDayEventsDetail');
  },

  toggleEventDone(eventId, dateStr) {
    const evt = (appState.calendarEvents || []).find(e => e.id === eventId);
    if (evt) {
      evt.isDone = !evt.isDone;
      this.saveState();
      this.renderAll();
      this.showDayEvents(dateStr);
    }
  },

  deleteCalendarEvent(eventId, dateStr) {
    if (Array.isArray(appState.calendarEvents)) {
      appState.calendarEvents = appState.calendarEvents.filter(e => e.id !== eventId);
      this.saveState();
      this.renderAll();
      this.showDayEvents(dateStr);
      this.showToast(this.t('toast_event_deleted') || 'Événement supprimé !');
    }
  },

  openAddEventForDate(type, dateStr = null) {
    const modal = document.getElementById('modalDayEventsDetail');
    const curDate = dateStr || modal?.getAttribute('data-current-date') || this.getTodayStr();
    this.closeModal('modalDayEventsDetail');
    if (type === 'gestation') {
      this.openModal('modalAddGestation');
      const dInput = document.getElementById('gestationMatingDate');
      if (dInput) dInput.value = curDate;
      this.updateGestationPreview();
    } else {
      this.openModal('modalAddVaccine');
      const dInput = document.getElementById('vaccineDate');
      if (dInput) dInput.value = curDate;
    }
  },

  renderGenerationsTable() {
    const tbody = document.getElementById('generationsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const activeAnimals = (appState.animals || []).filter(a => (Number(a.currentQuantity) || 0) > 0);

    const isArabic = (appState.lang === 'ar' || document.documentElement.getAttribute('dir') === 'rtl');
    const lang = isArabic ? 'ar' : (appState.lang || 'fr');
    const todayStr = this.getTodayStr();

    if (activeAnimals.length === 0) {
      const emptyMsg = (lang === 'ar') 
        ? 'لا توجد دفعات أو مواشي نشطة مسجلة حالياً في المزرعة.' 
        : ((lang === 'en') ? 'No active livestock flocks or animals recorded.' : 'Aucun animal ou cheptel actif enregistré sur la ferme.');
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">${emptyMsg}</td></tr>`;
      return;
    }

    activeAnimals.forEach(flock => {
      const daysSinceArrival = this.calculateAgeInDays(flock.birthDate);
      const arrivalAgeDays = Number(flock.arrivalAgeDays) || 0;
      const ageDays = daysSinceArrival + arrivalAgeDays;
      const sp = (flock.species || '').toLowerCase();
      const isPoultry = (sp === 'poulet' || sp === 'pondeuse' || sp === 'poussin' || sp === 'pintade' || sp === 'canard' || sp === 'caille' || sp === 'dinde' || sp === 'adulte');
      const isBovine = (sp.includes('vache') || sp.includes('bovin') || sp.includes('veau') || sp.includes('taurillon'));

      let ageDisplay = '';
      if (isPoultry || ageDays < 90) {
        const weeks = Math.floor(ageDays / 7);
        if (lang === 'ar') {
          ageDisplay = weeks > 0 ? `${ageDays} يوماً (${weeks} أسابيع)` : `${ageDays} يوماً`;
        } else if (lang === 'en') {
          ageDisplay = weeks > 0 ? `${ageDays} days (${weeks} wks)` : `${ageDays} days`;
        } else {
          ageDisplay = weeks > 0 ? `${ageDays} jours (${weeks} sem.)` : `${ageDays} jours`;
        }
      } else if (ageDays < 730) {
        const months = Math.round(ageDays / 30.4);
        ageDisplay = (lang === 'ar') ? `${months} شهر` : ((lang === 'en') ? `${months} mos` : `${months} mois`);
      } else {
        const years = (ageDays / 365.25).toFixed(1);
        ageDisplay = (lang === 'ar') ? `${years} سنة` : ((lang === 'en') ? `${years} yrs` : `${years} ans`);
      }

      const translatedStage = this.translateStage(flock.stage);
      const stageClass = this.getStageBadgeClass(flock.stage);
      const displayName = this.getAnimalDisplayName(flock);
      const lotNum = (flock.name && flock.name.toString().trim() !== '') ? (lang === 'ar' ? `دفعة #${flock.name}` : `Lot #${flock.name}`) : '';
      const translatedBreed = this.getTranslatedBreed(flock.breed);
      const breedDisplay = (translatedBreed && translatedBreed !== '-') ? translatedBreed : '<span class="text-muted">-</span>';

      let stageBadgeHtml = `<span class="stage-badge ${stageClass}">${translatedStage}</span>`;
      if (flock.isPregnant && flock.expectedBirthDate) {
        const birthDateFormatted = this.formatDateFR(flock.expectedBirthDate);
        const birthLbl = isBovine ? (lang === 'ar' ? 'ولادة:' : (lang === 'en' ? 'Calving:' : 'Vêlage :')) : (lang === 'ar' ? 'ولادة:' : (lang === 'en' ? 'Lambing:' : 'Agnelage :'));
        stageBadgeHtml += `<small style="display:block; color: #f472b6; font-size: 0.72rem; font-weight: 700; margin-top: 2px;">${birthLbl} ${birthDateFormatted}</small>`;
      }

      // Feed & Next Event
      let feedAdvice = '';
      let nextEventText = '';

      if (isPoultry) {
        const stageInfo = this.getPoultryDevelopmentStage(ageDays, flock.species);
        feedAdvice = stageInfo.feed;
        nextEventText = stageInfo.nextEvent;
      } else {
        const feedData = this.getAgronomicFeedData(flock.species, ageDays, flock.stage, flock.breed);
        feedAdvice = `${(feedData.avgGrams / 1000).toFixed(2)} kg/j (${feedData.description})`;

        // Search calendarEvents for upcoming event for this animal
        const upcoming = (appState.calendarEvents || []).find(e => e.linkedAnimalId === flock.id && e.date >= todayStr);
        if (upcoming) {
          nextEventText = `${upcoming.title} (${this.formatDateFR(upcoming.date)})`;
        } else if (flock.expectedBirthDate && flock.expectedBirthDate >= todayStr) {
          nextEventText = isBovine 
            ? (lang === 'ar' ? `🍼 ولادة عجل: ${this.formatDateFR(flock.expectedBirthDate)}` : `🍼 Vêlage prévu: ${this.formatDateFR(flock.expectedBirthDate)}`)
            : (lang === 'ar' ? `🍼 ولادة خراف: ${this.formatDateFR(flock.expectedBirthDate)}` : `🍼 Agnelage prévu: ${this.formatDateFR(flock.expectedBirthDate)}`);
        } else if (isBovine) {
          nextEventText = (lang === 'ar') ? '💉 لقاح الكلستريديا / فحص دوري' : '💉 Vaccin Clostridiose annuel';
        } else {
          nextEventText = (lang === 'ar') ? '💉 لقاح الكلية الرخوة / تجريع' : '💉 Vaccin Entérotoxémie / Soin';
        }
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${displayName}</strong> ${lotNum ? `<small class="text-muted" style="display:block; font-size: 0.74rem;">${lotNum}</small>` : ''}</td>
        <td>${breedDisplay}</td>
        <td>${this.formatDateFR(flock.birthDate)}</td>
        <td><span class="badge-tag text-emerald" dir="auto">${ageDisplay}</span></td>
        <td>${stageBadgeHtml}</td>
        <td><small class="text-muted">${feedAdvice}</small></td>
        <td><small class="bold text-amber">${nextEventText}</small></td>
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

    // Highlight or style Today button if viewing current month
    const todayBtn = document.getElementById('calTodayJumpBtn');
    if (todayBtn) {
      const now = new Date();
      const isCurrentMonth = (year === now.getFullYear() && month === now.getMonth());
      if (isCurrentMonth) {
        todayBtn.classList.add('active-current-month');
      } else {
        todayBtn.classList.remove('active-current-month');
      }
    }

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

      // 3. Check Custom Calendar Events (Gestation, Calvings, Lambings, Dry-offs, Vaccines)
      (appState.calendarEvents || []).forEach(evt => {
        if (evt.date === dateStr) {
          const isDone = Boolean(evt.isDone);
          const doneStyle = isDone ? 'opacity: 0.65; text-decoration: line-through;' : '';
          if (evt.type === 'mise_bas') {
            dayHtml += `<div class="day-event-tag event-gestation" style="${doneStyle}" title="${evt.title}">🍼 ${evt.title}</div>`;
          } else if (evt.type === 'tarissement') {
            dayHtml += `<div class="day-event-tag event-dryoff" style="${doneStyle}" title="${evt.title}">🥛 ${evt.title}</div>`;
          } else if (evt.type === 'echographie') {
            dayHtml += `<div class="day-event-tag event-mirage" style="${doneStyle}" title="${evt.title}">🔍 ${evt.title}</div>`;
          } else {
            dayHtml += `<div class="day-event-tag event-vaccine" style="${doneStyle}" title="${evt.title}">💉 ${evt.title}</div>`;
          }
        }
      });

      // 4. Check Sales recorded on this date
      appState.sales.forEach(s => {
        if (s.date === dateStr) {
          dayHtml += `<div class="day-event-tag event-sale" title="${s.description}">💰 ${this.t('cal_legend_sale')} (${this.formatMoney(s.total)})</div>`;
        }
      });

      cell.style.cursor = 'pointer';
      cell.setAttribute('onclick', `app.showDayEvents('${dateStr}')`);
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
      title: isAr ? 'تهيئة مزرعة جديدة' : 'Nouvelle Ferme Vierge',
      message: isAr 
        ? 'هل ترغب في تهيئة التطبيق بحالة نظيفة وفارغة تماماً لبدء مزرعتك الخاصة؟' 
        : 'Voulez-vous initialiser une ferme neuve et propre avec toutes les données à zéro ?',
      isDanger: false,
      confirmText: isAr ? 'تأكيد' : 'Initialiser',
      onConfirm: () => {
        appState.animals = [];
        appState.expenses = [];
        appState.sales = [];
        appState.incubatorBatches = [];
        appState.feedTypes = [];
        appState.feedDistributions = [];
        appState.feedStockKg = null;
        appState.feedStockCostPerKg = 0;
        appState.feedStockDate = null;
        appState.eggStock = 0;
        appState.milkStock = 0;
        appState.milkHarvests = [];
        appState.eggHarvests = [];
        appState._zeroInitialized = true;
        this.saveState();
        this.closeModal('modalDataOptions');
        this.renderAll();
        this.showToast(isAr ? 'تم تهيئة المزرعة بنجاح !' : 'Application initialisée à zéro avec succès !');
      }
    });
  },

  // Export officiel vers Excel (Classeur Multi-Onglets .xlsx avec fallback XML Spreadsheet)  exportExcel() {
    if (window.MobileBridge && typeof window.MobileBridge.promptRewardedAd === 'function') {
      window.MobileBridge.promptRewardedAd('excel_export', () => {
        this._doExportExcel();
      });
      return;
    }
    this._doExportExcel();
  },

  _doExportExcel() {
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
        ? 'تحذير هام: سيتم مسح كافة البيانات المسجلة نهائياً (الحيوانات، المصاريف، المبيعات، ومخزون الأعلاف بالكامل). هل ترغب في المتابعة؟'
        : 'ATTENTION: Cette action va réinitialiser absolument toutes vos données à 0 (animaux, dépenses, ventes, récoltes, stocks d\'aliments et rations). Continuer ?',
      isDanger: true,
      confirmText: isAr ? 'مسح الكل' : 'Tout supprimer',
      onConfirm: () => {
        // Enregistrer tous les identifiants supprimés dans les tombstones Cloud pour éviter toute résurrection
        if (window.appAuth && typeof appAuth.addDeletedId === 'function') {
          (appState.animals || []).forEach(a => a && a.id && appAuth.addDeletedId(a.id));
          (appState.expenses || []).forEach(e => e && e.id && appAuth.addDeletedId(e.id));
          (appState.sales || []).forEach(s => s && s.id && appAuth.addDeletedId(s.id));
          (appState.incubatorBatches || []).forEach(b => b && b.id && appAuth.addDeletedId(b.id));
          (appState.eggHarvests || []).forEach(h => h && h.id && appAuth.addDeletedId(h.id));
          (appState.feedDistributions || []).forEach(d => d && d.id && appAuth.addDeletedId(d.id));
          (appState.feedTypes || []).forEach(ft => ft && ft.id && appAuth.addDeletedId(ft.id));
        }

        // Remise à zéro totale de toutes les collections et compteurs
        appState.animals = [];
        appState.expenses = [];
        appState.sales = [];
        appState.incubatorBatches = [];
        appState.eggHarvests = [];
        appState.eggStock = 0;
        appState.milkStock = 0;
        appState.milkHarvests = [];

        // Remise à zéro intégrale de l'alimentation, du stock magasin et des rations
        appState.feedDistributions = [];
        appState.feedTypes = [];
        appState.feedStockKg = null;
        appState.feedStockDate = null;
        appState.feedStockCostPerKg = 0;
        appState.customDailyFeedKg = null;
        appState.sicamCansCount = null;
        appState.feedRationMode = 'custom';
        appState.savedFavoriteFeedRoutine = null;
        appState.deletedFeedFamilies = [];
        appState.deletedFeedIds = [];

        appState._zeroInitialized = true;
        this.saveState();

        // Propager immédiatement l'état vide au cloud et aux autres appareils
        if (window.appAuth) {
          if (typeof appAuth.pushData === 'function') appAuth.pushData(false);
          if (typeof appAuth.broadcastCurrentState === 'function') appAuth.broadcastCurrentState();
        }

        this.closeModal('modalDataOptions');
        this.renderAll();
        this.showToast(this.t('toast_data_reset'));
      }
    });
  },

  // ==========================================
  // HELPER FORMATTERS & UTILITIES
  // ==========================================
  calculateAgeInDays(birthDateStr, targetDateStr = null) {
    if (!birthDateStr) return 0;
    const target = targetDateStr || this.getTodayStr();
    return this.calculateDaysBetween(birthDateStr, target);
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
      case 'vache_laitiere':
      case 'vache': return '🐄';
      case 'taurillon':
      case 'bovin_viande':
      case 'taureau': return '🐂';
      case 'veau':
      case 'broutard': return '🐂';
      case 'bovin':
      case 'bovin_autre': return '🐄';
      case 'mouton':
      case 'belier':
      case 'brebis':
      case 'agneau':
      case 'ovin': return '🐑';
      case 'chevre':
      case 'chevreau':
      case 'bouc':
      case 'caprin': return '🐐';
      case 'ovin_autre': return '🌾';
      case 'poulet': return '🍗';
      case 'pondeuse': return '🥚';
      case 'poussin': return '🐣';
      case 'coq':
      case 'adulte': return '🐓';
      case 'pintade': return '🪶';
      case 'canard':
      case 'canard_barbarie': return '🦆';
      case 'caille': return '🐦';
      case 'dinde': return '🦃';
      case 'oie': return '🪿';
      default: return '🐤';
    }
  },

  translateSpecies(species) {
    if (!species) return 'Poulet / Coq';
    const isArabic = (appState.lang === 'ar' || document.documentElement.getAttribute('dir') === 'rtl');
    const lang = isArabic ? 'ar' : (appState.lang || 'fr');
    const sp = species.toString().toLowerCase().trim();

    if (lang === 'ar') {
      if (sp === 'vache_laitiere' || sp === 'vache') return 'بقرة حلوب';
      if (sp === 'taurillon' || sp === 'bovin_viande' || sp === 'taureau') return 'عجل تسمين / لحم';
      if (sp === 'veau' || sp === 'broutard') return 'عجل رضيع / مفطوم';
      if (sp === 'bovin' || sp === 'bovin_autre') return 'أبقار ومواشي';
      if (sp === 'mouton' || sp === 'belier') return 'خروف / كبش';
      if (sp === 'brebis') return 'نعجة';
      if (sp === 'agneau') return 'حمل / علوش';
      if (sp === 'chevre' || sp === 'bouc') return 'ماعز / عنزة';
      if (sp === 'chevreau') return 'جدي';
      if (sp === 'ovin' || sp === 'caprin' || sp === 'ovin_autre') return 'أغنام وماعز';
      if (sp === 'poulet' || sp === 'coq') return 'دجاج / ديوك';
      if (sp === 'pondeuse') return 'دجاج بياض';
      if (sp === 'poussin') return 'كتكوت';
      if (sp === 'adulte') return 'دجاج / ديوك';
      if (sp === 'pintade') return 'دجاج الوادي';
      if (sp === 'canard' || sp === 'canard_barbarie') return 'بط';
      if (sp === 'caille') return 'سمان';
      if (sp === 'dinde') return 'ديك رومي';
      if (sp === 'oie') return 'إوز';
      return 'دواجن';
    }

    if (lang === 'en') {
      if (sp === 'vache_laitiere' || sp === 'vache') return 'Dairy cow';
      if (sp === 'taurillon' || sp === 'bovin_viande' || sp === 'taureau') return 'Beef cattle / Bull';
      if (sp === 'veau' || sp === 'broutard') return 'Calf';
      if (sp === 'bovin' || sp === 'bovin_autre') return 'Cattle';
      if (sp === 'mouton' || sp === 'belier') return 'Sheep / Ram';
      if (sp === 'brebis') return 'Ewe';
      if (sp === 'agneau') return 'Lamb';
      if (sp === 'chevre' || sp === 'bouc') return 'Goat';
      if (sp === 'chevreau') return 'Kid';
      if (sp === 'ovin' || sp === 'caprin' || sp === 'ovin_autre') return 'Sheep & Goats';
      if (sp === 'poulet' || sp === 'coq') return 'Chicken / Rooster';
      if (sp === 'pondeuse') return 'Laying hen';
      if (sp === 'poussin') return 'Chick';
      if (sp === 'adulte') return 'Adult chicken / rooster';
      if (sp === 'pintade') return 'Guinea fowl';
      if (sp === 'canard' || sp === 'canard_barbarie') return 'Duck';
      if (sp === 'caille') return 'Quail';
      if (sp === 'dinde') return 'Turkey';
      if (sp === 'oie') return 'Goose';
      return 'Poultry';
    }

    // French
    if (sp === 'vache_laitiere' || sp === 'vache') return 'Vache laitière';
    if (sp === 'taurillon' || sp === 'bovin_viande' || sp === 'taureau') return 'Taurillon / Bovin viande';
    if (sp === 'veau' || sp === 'broutard') return 'Veau d\'élevage';
    if (sp === 'bovin' || sp === 'bovin_autre') return 'Bovin';
    if (sp === 'mouton' || sp === 'belier') return 'Mouton / Bélier';
    if (sp === 'brebis') return 'Brebis';
    if (sp === 'agneau') return 'Agneau';
    if (sp === 'chevre' || sp === 'bouc') return 'Chèvre';
    if (sp === 'chevreau') return 'Chevreau';
    if (sp === 'ovin' || sp === 'caprin' || sp === 'ovin_autre') return 'Ovin & Caprin';
    if (sp === 'poulet' || sp === 'coq') return 'Poulet / Coq';
    if (sp === 'pondeuse') return 'Poule pondeuse';
    if (sp === 'poussin') return 'Poussin';
    if (sp === 'adulte') return 'Poulet / Coq adulte';
    if (sp === 'pintade') return 'Pintade';
    if (sp === 'canard' || sp === 'canard_barbarie') return 'Canard';
    if (sp === 'caille') return 'Caille';
    if (sp === 'dinde') return 'Dinde';
    if (sp === 'oie') return 'Oie';
    return 'Volaille';
  },

  getEffectiveAnimalStage(animal) {
    if (!animal) return 'Adulte';
    const sp = (animal.species || 'poulet').toLowerCase();
    const stg = (animal.stage || '').toLowerCase();
    const brd = (animal.breed || '').toLowerCase();
    const notes = (animal.notes || '').toLowerCase();

    const daysSince = this.calculateAgeInDays(animal.birthDate);
    const startAge = Number(animal.arrivalAgeDays) || 0;
    const ageDays = Math.max(0, daysSince + startAge);

    // 0. Bovins (Vaches, Taurillons, Veaux)
    if (sp === 'vache_laitiere' || sp === 'bovin' || sp === 'bovin_autre' || sp.includes('vache') || sp.includes('cow')) {
      if (stg.includes('tarie') || stg.includes('dry') || stg.includes('شايحة') || stg.includes('راحة')) return 'Tarie';
      if (stg.includes('reforme') || stg.includes('cull') || stg.includes('تفريط')) return 'Réforme';
      if (ageDays >= 720) return 'Lactation';
      if (ageDays >= 450) return 'Gestante';
      if (ageDays >= 180) return 'Croissance';
      return 'Démarrage';
    }
    if (sp === 'taurillon' || sp === 'bovin_viande' || sp.includes('taurillon') || sp.includes('bull')) {
      if (stg.includes('taureau') || stg.includes('reproducteur') || brd.includes('taureau')) return 'Reproducteur';
      if (ageDays >= 480) return 'Finition';
      if (ageDays >= 365) return 'Engraissement';
      if (ageDays >= 180) return 'Croissance';
      return 'Démarrage';
    }
    if (sp === 'veau' || sp.includes('veau')) {
      if (ageDays >= 120) return 'Croissance';
      if (ageDays >= 60) return 'Pré-sevrage';
      return 'Démarrage';
    }

    // 0b. Ovins & Caprins (Moutons, Brebis, Agneaux, Chèvres, Chevreaux)
    if (sp === 'mouton' || sp === 'belier' || sp === 'brebis' || sp === 'agneau' || sp === 'chevre' || sp === 'chevreau' || sp === 'bouc' || sp === 'ovin' || sp === 'caprin' || sp === 'ovin_autre' || sp.includes('mouton') || sp.includes('brebis') || sp.includes('agneau') || sp.includes('chevre')) {
      if (stg.includes('tarie') || stg.includes('dry') || stg.includes('شايحة') || stg.includes('راحة')) return 'Tarie';
      if (stg.includes('reforme') || stg.includes('cull') || stg.includes('تفريط')) return 'Réforme';
      if (stg.includes('belier') || stg.includes('reproducteur') || brd.includes('belier')) return 'Reproducteur';
      if (stg.includes('gestante') || stg.includes('عشار')) return 'Gestante';
      if (sp === 'brebis' || sp === 'chevre') {
        if (stg.includes('lactation') || ageDays >= 420) return 'Lactation';
        if (ageDays >= 150) return 'Croissance';
        return 'Démarrage';
      }
      if (sp === 'agneau' || sp === 'chevreau') {
        if (ageDays >= 120) return 'Finition';
        if (ageDays >= 60) return 'Croissance';
        return 'Démarrage';
      }
      if (sp === 'mouton' || sp === 'belier') {
        if (ageDays >= 240) return 'Finition';
        if (ageDays >= 90) return 'Engraissement';
        return 'Démarrage';
      }
      if (ageDays >= 365) return 'Adulte';
      if (ageDays >= 90) return 'Croissance';
      return 'Démarrage';
    }

    const isLaying = stg.includes('ponte') || stg.includes('lay') || brd.includes('ponte') || brd.includes('pondeuse') || notes.includes('ponte') || notes.includes('pondeuse') || sp === 'pondeuse';
    const isRooster = stg.includes('coq') || stg.includes('rooster') || brd.includes('coq') || notes.includes('coq') || stg.includes('سردوك') || notes.includes('سردوك');

    // 1. Poulets / Gallinacés / Poules
    if (sp === 'poulet' || sp === 'coq' || sp === 'pondeuse' || sp === 'adulte' || sp === 'poussin') {
      if (ageDays >= 180) {
        if (isLaying && (stg.includes('ponte') || brd.includes('pondeuse') || notes.includes('pondeuse') || sp === 'pondeuse')) {
          return 'Ponte';
        }
        return 'Adulte';
      }
      if (ageDays >= 30) {
        if (isLaying && ageDays >= 140) return 'Ponte';
        return 'Croissance';
      }
      return 'Démarrage';
    }

    // 2. Canards / Canards de Barbarie (Adulte à 5 mois / 150 jours)
    if (sp === 'canard' || sp === 'canard_barbarie') {
      if (ageDays >= 150) return isLaying ? 'Ponte' : 'Adulte';
      if (ageDays >= 28) return 'Croissance';
      return 'Démarrage';
    }

    // 3. Pintades (Adulte à 5-6 mois / 150-180 jours)
    if (sp === 'pintade') {
      if (ageDays >= 150) return isLaying ? 'Ponte' : 'Adulte';
      if (ageDays >= 28) return 'Croissance';
      return 'Démarrage';
    }

    // 4. Cailles (Adulte ponte très précoce à 45 jours / 1.5 mois)
    if (sp === 'caille') {
      if (ageDays >= 45) return isLaying ? 'Ponte' : 'Adulte';
      if (ageDays >= 14) return 'Croissance';
      return 'Démarrage';
    }

    // 5. Dindes (Adulte à 5 mois / 150 jours)
    if (sp === 'dinde') {
      if (ageDays >= 150) return isLaying ? 'Ponte' : 'Adulte';
      if (ageDays >= 28) return 'Croissance';
      return 'Démarrage';
    }

    // 6. Autre volaille
    if (ageDays >= 180) return isLaying ? 'Ponte' : 'Adulte';
    if (ageDays >= 30) return 'Croissance';
    return 'Démarrage';
  },

  synchronizeAnimalStages() {
    if (!Array.isArray(appState.animals)) return;
    let changed = false;
    appState.animals.forEach(a => {
      const effStage = this.getEffectiveAnimalStage(a);
      if (a.stage !== effStage && (a.stage === 'Croissance' || a.stage === 'Démarrage' || !a.stage)) {
        a.stage = effStage;
        changed = true;
      }
    });
    if (changed) {
      this.saveState();
    }
  },

  getAnimalDisplayName(animal) {
    if (!animal) return '';
    const breed = (animal.breed || '').toString().trim();
    const hasBreed = breed !== '' && breed !== '-';
    if (hasBreed) {
      return breed;
    }
    const speciesLabel = this.translateSpecies(animal.species);
    const effStage = this.getEffectiveAnimalStage(animal);
    const stageLabel = this.translateStage(effStage);
    return stageLabel ? `${speciesLabel} (${stageLabel})` : speciesLabel;
  },

  translateStage(stage) {
    if (!stage) return '';
    const isArabic = (appState.lang === 'ar' || document.documentElement.getAttribute('dir') === 'rtl');
    const lang = isArabic ? 'ar' : (appState.lang || 'fr');
    const s = stage.toString().trim();
    const sLower = s.toLowerCase();

    if (lang === 'ar') {
      if (sLower.includes('lactation') || sLower.includes('حليب')) return 'إنتاج الحليب';
      if (sLower.includes('tarie') || sLower.includes('dry') || sLower.includes('شايحة') || sLower.includes('راحة')) return 'طور الراحة / شايحة';
      if (sLower.includes('gestante') || sLower.includes('عشار')) return 'عشار / حامل';
      if (sLower.includes('reforme') || sLower.includes('تفريط')) return 'تفريط / مذبح';
      if (sLower.includes('pre-sevrage') || sLower.includes('pré-sevrage')) return 'قبل الفطام';
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
      if (sLower.includes('lactation')) return 'Lactation / Milk';
      if (sLower.includes('tarie') || sLower.includes('dry')) return 'Dry Cow';
      if (sLower.includes('gestante') || sLower.includes('pregnant')) return 'Pregnant';
      if (sLower.includes('reforme') || sLower.includes('cull')) return 'Cull';
      if (sLower.includes('pre-sevrage') || sLower.includes('pre-weaning')) return 'Pre-weaning';
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
    if (sLower.includes('lactation')) return 'Lactation';
    if (sLower.includes('tarie')) return 'Tarie';
    if (sLower.includes('gestante')) return 'Gestante';
    if (sLower.includes('reforme')) return 'Réforme';
    if (sLower.includes('pre-sevrage') || sLower.includes('pré-sevrage')) return 'Pré-sevrage';
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
    if (s.includes('lactation') || s.includes('حليب')) return 'badge-stage-finish';
    if (s.includes('tarie') || s.includes('شايحة')) return 'badge-stage-start';
    if (s.includes('gestante') || s.includes('عشار')) return 'badge-stage-growth';
    if (s.includes('reforme') || s.includes('تفريط')) return 'badge-stage-repro';
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
      case 'electricite_couveuse': return `<span class="badge-tag" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.35); font-weight: 700;">⚡ ${this.t('exp_cat_elec_incubator')}</span>`;
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
  },

  shareApkLink() {
    const isAr = appState.lang === 'ar';
    const apkUrl = 'https://fermegestpro.vercel.app/FermeGestPro.apk';
    const webUrl = 'https://fermegestpro.vercel.app';
    const title = 'FermeGest PRO - Application Mobile Android';
    const text = isAr 
      ? `حمّل تطبيق FermeGest PRO لهواتف الأندرويد مباشرة من هذا الرابط:\n${apkUrl}\n\nأو افتح التطبيق مباشرة في المتصفح:\n${webUrl}`
      : `Téléchargez l'application officielle FermeGest PRO pour Android directement ici :\n${apkUrl}\n\nOu ouvrez-la sur votre navigateur :\n${webUrl}`;

    if (navigator.share) {
      navigator.share({
        title,
        text,
        url: apkUrl
      }).catch(() => {});
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(apkUrl);
        this.showToast(this.t('mobile_share_toast_copied') || (isAr ? 'تم نسخ رابط التحميل!' : 'Lien de téléchargement copié !'));
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    }
  }
};

// Expose app on global window
window.app = app;
window.appState = appState;

// Safe in-app replacement for native browser alert / confirm / prompt (100% sans popup navigateur Chrome)
window.alert = function(msg) {
  if (window.app && typeof window.app.showToast === 'function') {
    window.app.showToast(msg, 'warning');
  } else {
    console.warn('[InAppAlert]', msg);
  }
};
window.confirm = function(msg) {
  if (window.app && typeof window.app.confirmDialog === 'function') {
    window.app.confirmDialog({ message: msg });
  }
  return false;
};
window.prompt = function(msg, defaultVal) {
  if (window.app && typeof window.app.promptDialog === 'function') {
    window.app.promptDialog({ message: msg, defaultValue: defaultVal });
  }
  return null;
};

// Initialize Application on DOM Ready or immediately if DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });
} else {
  app.init();
}
