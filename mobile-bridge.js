/**
 * FermeGest PRO - Mobile Native Bridge (Capacitor for iOS & Android)
 * Seamlessly interfaces with native device capabilities:
 * - Haptics feedback on taps & actions
 * - Dynamic Status Bar theme synchronization
 * - Local Notifications for incubator milestones (Mirage, Éclosion)
 * - Android Hardware Back Button navigation
 * - Native sharing (WhatsApp, Drive, Email, etc.)
 * - Safe Area insets detection & handling
 */

const MobileBridge = {
  isNative: false,
  plugins: {},

  async init() {
    this.isNative = typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform();
    console.log(`[MobileBridge] Initialized. Native platform: ${this.isNative ? window.Capacitor.getPlatform() : 'Web/PWA'}`);

    if (this.isNative && window.Capacitor.Plugins) {
      this.plugins = window.Capacitor.Plugins;
      await this.initStatusBar();
      await this.initSplashScreen();
      await this.initBackButton();
      await this.requestNotificationPermissions();
    }

    this.attachHapticsToUI();
    this.observeThemeChanges();

    // Schedule daily 17h egg collection notification in active language
    const currentLang = (typeof appState !== 'undefined' && appState.lang) || localStorage.getItem('fermegest_lang') || 'fr';
    await this.scheduleDailyEggNotification(currentLang);
  },

  // 1. Status Bar Sync
  async initStatusBar() {
    try {
      const StatusBar = this.plugins.StatusBar;
      if (!StatusBar) return;

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      await StatusBar.setStyle({ style: isDark ? 'DARK' : 'LIGHT' });
      await StatusBar.setBackgroundColor({ color: isDark ? '#0b1120' : '#ffffff' });
    } catch (e) {
      console.warn('[MobileBridge] StatusBar setup error:', e);
    }
  },

  // Update status bar when user toggles dark/light theme
  async updateTheme(theme) {
    if (!this.isNative || !this.plugins.StatusBar) return;
    try {
      const isDark = theme !== 'light';
      await this.plugins.StatusBar.setStyle({ style: isDark ? 'DARK' : 'LIGHT' });
      await this.plugins.StatusBar.setBackgroundColor({ color: isDark ? '#0b1120' : '#ffffff' });
    } catch (e) {
      console.warn('[MobileBridge] StatusBar theme update error:', e);
    }
  },

  observeThemeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          this.updateTheme(newTheme);
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  },

  // 2. Splash Screen
  async initSplashScreen() {
    try {
      const SplashScreen = this.plugins.SplashScreen;
      if (SplashScreen) {
        setTimeout(async () => {
          await SplashScreen.hide({ fadeOutDuration: 300 });
        }, 400);
      }
    } catch (e) {
      console.warn('[MobileBridge] SplashScreen hide error:', e);
    }
  },

  // 3. Haptics / Vibration Feedback
  async hapticImpact(style = 'LIGHT') {
    try {
      if (this.isNative && this.plugins.Haptics) {
        // STYLE: 'LIGHT', 'MEDIUM', 'HEAVY'
        await this.plugins.Haptics.impact({ style });
      } else if (navigator.vibrate) {
        const duration = style === 'HEAVY' ? 40 : (style === 'MEDIUM' ? 25 : 12);
        navigator.vibrate(duration);
      }
    } catch (e) {
      // Ignore vibration errors
    }
  },

  async hapticSuccess() {
    try {
      if (this.isNative && this.plugins.Haptics) {
        await this.plugins.Haptics.notification({ type: 'SUCCESS' });
      } else if (navigator.vibrate) {
        navigator.vibrate([15, 60, 20]);
      }
    } catch (e) {
      // Ignore
    }
  },

  async hapticWarning() {
    try {
      if (this.isNative && this.plugins.Haptics) {
        await this.plugins.Haptics.notification({ type: 'WARNING' });
      } else if (navigator.vibrate) {
        navigator.vibrate([30, 80, 30]);
      }
    } catch (e) {
      // Ignore
    }
  },

  attachHapticsToUI() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('button, .nav-item, .mobile-nav-btn, .fab-button, .fab-item, .chip, .modal-close');
      if (target) {
        if (target.classList.contains('btn-emerald') || target.classList.contains('btn-danger') || target.classList.contains('fab-button')) {
          this.hapticImpact('MEDIUM');
        } else {
          this.hapticImpact('LIGHT');
        }
      }
    }, { passive: true });
  },

  // 4. Android Hardware Back Button
  async initBackButton() {
    try {
      const App = this.plugins.App;
      if (!App || !App.addListener) return;

      App.addListener('backButton', () => {
        // A) If mobile settings drawer is open, close it
        const mobileDrawer = document.getElementById('mobileMenuDrawer');
        if (mobileDrawer && !mobileDrawer.classList.contains('hidden')) {
          mobileDrawer.classList.add('hidden');
          return;
        }

        // B) If a modal is currently open, close the modal first
        const openModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (openModal) {
          openModal.classList.add('hidden');
          return;
        }

        // B) If FAB menu is open, close it
        const fabMenu = document.getElementById('fabMenu');
        if (fabMenu && fabMenu.classList.contains('active')) {
          if (typeof app !== 'undefined' && app.toggleFabMenu) {
            app.toggleFabMenu();
            return;
          }
        }

        // C) If not on dashboard tab, return to dashboard
        if (typeof appState !== 'undefined' && appState.currentTab !== 'dashboard') {
          if (typeof app !== 'undefined' && app.switchTab) {
            app.switchTab('dashboard');
            return;
          }
        }

        // D) Otherwise, exit app or minimize
        App.exitApp();
      });
    } catch (e) {
      console.warn('[MobileBridge] BackButton setup error:', e);
    }
  },

  // 5. Local Notifications & Daily 17h Egg Collection Alert
  async requestNotificationPermissions() {
    try {
      if (this.isNative && this.plugins && this.plugins.LocalNotifications) {
        const perm = await this.plugins.LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') {
          await this.plugins.LocalNotifications.requestPermissions();
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          try { await Notification.requestPermission(); } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('[MobileBridge] Notification permission request error:', e);
    }
  },

  getDailyEggStrings(lang) {
    const l = ['fr', 'ar', 'en'].includes(lang) ? lang : 'fr';
    if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[l]) {
      return {
        title: TRANSLATIONS[l].notif_daily_eggs_title || "🥚🌾 FermeGest Pro - Récolte & Alimentation",
        body: TRANSLATIONS[l].notif_daily_eggs_body || "17h00 : Avez-vous nourri les animaux et récolté les œufs du jour ?"
      };
    }
    const fallback = {
      fr: { title: "🥚🌾 FermeGest Pro - Récolte & Alimentation", body: "17h00 : Avez-vous nourri les animaux et récolté les œufs du jour ?" },
      ar: { title: "🥚🌾 فيرم-جست برو - جمع البيض والتغذية", body: "17:00 : هل قمت بتغذية الحيوانات وجمع بيض اليوم؟" },
      en: { title: "🥚🌾 FermeGest Pro - Harvest & Feeding", body: "5:00 PM: Did you feed the animals and collect today's eggs?" }
    };
    return fallback[l] || fallback.fr;
  },

  async scheduleDailyEggNotification(lang) {
    const currentLang = lang || (typeof appState !== 'undefined' ? appState.lang : null) || localStorage.getItem('fermegest_lang') || 'fr';
    const { title, body } = this.getDailyEggStrings(currentLang);

    // A) Native Capacitor Local Notifications (Android APK & iOS)
    if (this.isNative && this.plugins && this.plugins.LocalNotifications) {
      try {
        const LocalNotifications = this.plugins.LocalNotifications;
        await this.requestNotificationPermissions();

        // High importance notification channel (Android 8+ heads-up popup like a message)
        if (LocalNotifications.createChannel) {
          try {
            await LocalNotifications.createChannel({
              id: 'fermegest_daily_alerts',
              name: 'Rappels Quotidiens (17h)',
              description: 'Alertes prioritaires pour la récolte des œufs et alimentation des animaux',
              importance: 5, // IMPORTANCE_HIGH (pops up banner on screen with sound)
              visibility: 1, // VISIBILITY_PUBLIC (shown on lock screen)
              sound: 'beep.wav',
              vibration: true,
              lights: true,
              lightColor: '#10b981'
            });
          } catch (channelErr) {
            console.warn('[MobileBridge] Channel creation error:', channelErr);
          }
        }

        // Register action buttons (Dismiss / Enter Harvest)
        if (LocalNotifications.registerActionTypes) {
          try {
            const dismissTitle = currentLang === 'ar' ? 'حذف الإشعار' : (currentLang === 'en' ? 'Dismiss' : 'Supprimer');
            const enterTitle = currentLang === 'ar' ? 'تسجيل البيض 🥚' : (currentLang === 'en' ? 'Record Harvest 🥚' : 'Saisir récolte 🥚');
            await LocalNotifications.registerActionTypes({
              types: [
                {
                  id: 'EGG_COLLECTION_ACTIONS',
                  actions: [
                    {
                      id: 'dismiss_alert',
                      title: dismissTitle,
                      destructive: true
                    },
                    {
                      id: 'enter_harvest',
                      title: enterTitle,
                      foreground: true
                    }
                  ]
                }
              ]
            });
          } catch (actionErr) {
            console.warn('[MobileBridge] registerActionTypes error:', actionErr);
          }
        }

        // Cancel previous ID 1700 to update language / text
        try {
          await LocalNotifications.cancel({ notifications: [{ id: 1700 }] });
        } catch (e) {}

        // Schedule daily recurring at 17:00 (5:00 PM)
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1700,
              title: title,
              body: body,
              channelId: 'fermegest_daily_alerts',
              schedule: {
                on: {
                  hour: 17,
                  minute: 0
                },
                allowWhileIdle: true
              },
              sound: 'beep.wav',
              smallIcon: 'ic_stat_icon_config_sample',
              extra: { type: 'daily_egg_collection' },
              actionTypeId: 'EGG_COLLECTION_ACTIONS'
            }
          ]
        });

        // Add action listener when tapped or button clicked
        if (!this._notifListenerAttached && LocalNotifications.addListener) {
          this._notifListenerAttached = true;
          LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            const actionId = action && action.actionId;
            if (actionId === 'dismiss_alert') {
              if (window.app && app.dismissDailyEggAlert) {
                app.dismissDailyEggAlert();
              }
            } else {
              // Clicked notification body or 'enter_harvest' action
              if (window.app && app.openDailyEggModal) {
                app.openDailyEggModal();
              }
            }
          });
        }
        console.log(`[MobileBridge] Native 17h egg & feed notification active in (${currentLang}) with high-priority channel`);
      } catch (err) {
        console.warn('[MobileBridge] scheduleDailyEggNotification native error:', err);
      }
    }

    // B) Web & PWA Browser Notification Scheduling
    this.scheduleWebDailyEggNotification(currentLang, title, body);
  },

  scheduleWebDailyEggNotification(lang, title, body) {
    if (typeof window === 'undefined') return;

    // Check immediately if we need to trigger for today (if current hour >= 17)
    this.checkAndTriggerDailyEggNotification(title, body);

    // Setup periodic 60-second check
    if (this._dailyEggInterval) clearInterval(this._dailyEggInterval);
    this._dailyEggInterval = setInterval(() => {
      const strings = this.getDailyEggStrings(typeof appState !== 'undefined' ? appState.lang : lang);
      this.checkAndTriggerDailyEggNotification(strings.title, strings.body);
      if (window.app && app.checkDailyEggInAppAlert) {
        app.checkDailyEggInAppAlert();
      }
    }, 60000);
  },

  checkAndTriggerDailyEggNotification(title, body) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const lastNotifiedDate = localStorage.getItem('fermegest_last_egg_notif_date');

    // Trigger at 17:00 or if opened after 17:00 and not yet notified today
    if (now.getHours() >= 17 && lastNotifiedDate !== todayStr) {
      localStorage.setItem('fermegest_last_egg_notif_date', todayStr);
      this.showBrowserNotification(title, body);
    }

    // Always update in-app alert banner
    if (window.app && app.checkDailyEggInAppAlert) {
      app.checkDailyEggInAppAlert();
    }
  },

  showBrowserNotification(title, body) {
    const lang = (typeof appState !== 'undefined' && appState.lang) || 'fr';
    const dismissTitle = lang === 'ar' ? 'حذف الإشعار' : (lang === 'en' ? 'Dismiss' : 'Supprimer');
    const enterTitle = lang === 'ar' ? 'تسجيل البيض 🥚' : (lang === 'en' ? 'Record Harvest 🥚' : 'Saisir récolte 🥚');

    // 1. Service Worker Notification (works in background & mobile Chrome)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body: body,
          icon: './icon-192.png',
          badge: './icon-192.png',
          vibrate: [200, 100, 200],
          tag: 'daily-egg-collection',
          data: { type: 'daily_egg_collection' },
          actions: [
            { action: 'dismiss', title: dismissTitle },
            { action: 'record', title: enterTitle }
          ]
        });
      }).catch(() => this.fallbackWebNotification(title, body));
    } else {
      this.fallbackWebNotification(title, body);
    }

    // 2. Refresh In-App interactive alert banner
    if (window.app && app.checkDailyEggInAppAlert) {
      app.checkDailyEggInAppAlert();
    }
  },

  fallbackWebNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: body,
          icon: './icon-192.png'
        });
        notif.onclick = () => {
          window.focus();
          if (window.app && app.openDailyEggModal) {
            app.openDailyEggModal();
          }
        };
      } catch (e) {}
    }
  },

  async scheduleIncubatorNotification({ id, title, body, scheduleDate }) {
    try {
      const LocalNotifications = this.plugins.LocalNotifications;
      if (!LocalNotifications || !scheduleDate) return;

      const targetTime = new Date(scheduleDate).getTime();
      const now = Date.now();

      // Only schedule if date is in the future
      if (targetTime <= now) return;

      await LocalNotifications.schedule({
        notifications: [
          {
            title: title || 'FermeGest Pro - Couveuse',
            body: body || 'Événement d\'incubation imminent !',
            id: Math.abs(this.hashCode(id || title + scheduleDate)),
            schedule: { at: new Date(targetTime) },
            sound: 'beep.wav',
            smallIcon: 'ic_stat_icon_config_sample',
            actionTypeId: '',
            extra: null
          }
        ]
      });
      console.log(`[MobileBridge] Scheduled notification for ${scheduleDate}: ${title}`);
    } catch (e) {
      console.warn('[MobileBridge] Schedule notification error:', e);
    }
  },

  // 6. Native Share API (WhatsApp, Gmail, Files, etc.)
  async shareData({ title, text, url, dialogTitle }) {
    try {
      if (this.isNative && this.plugins.Share) {
        await this.plugins.Share.share({
          title: title || 'FermeGest Pro',
          text: text || '',
          url: url || undefined,
          dialogTitle: dialogTitle || 'Partager via...'
        });
        return true;
      } else if (navigator.share) {
        await navigator.share({
          title: title || 'FermeGest Pro',
          text: text || '',
          url: url || undefined
        });
        return true;
      }
    } catch (e) {
      console.log('[MobileBridge] Share cancelled or failed:', e);
    }
    return false;
  },

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 2147483647;
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MobileBridge.init());
} else {
  MobileBridge.init();
}

window.MobileBridge = MobileBridge;
