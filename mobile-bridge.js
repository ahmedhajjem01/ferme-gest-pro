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
      if (!App) return;

      App.addListener('backButton', ({ canGoBack }) => {
        // A) If a modal is currently open, close the modal first
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

  // 5. Local Notifications for Incubator Milestones
  async requestNotificationPermissions() {
    try {
      const LocalNotifications = this.plugins.LocalNotifications;
      if (!LocalNotifications) return;

      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }
    } catch (e) {
      console.warn('[MobileBridge] Notification permission request error:', e);
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
