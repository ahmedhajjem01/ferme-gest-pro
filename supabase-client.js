/**
 * FermeGest PRO - Supabase Authentication & Multi-Device Realtime Engine
 * Handles Google / Gmail OAuth, Email login, Row Level Security data sync, and offline resilience.
 */

(function(window) {
  'use strict';

  const SUPABASE_CONFIG = {
    url: 'https://ggzkutzsuxnfvggfgpmc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnemt1dHpzdXhuZnZnZ2ZncG1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMDAxMzEsImV4cCI6MjEwNzU3NjEzMX0.GZURCMV_wAGP7cQzH7DKyylaIrHt6QxrzihG92vzxqo'
  };

  const appAuth = {
    client: null,
    currentUser: null,
    sessionId: 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7),
    realtimeChannel: null,
    userSyncChannel: null,
    collabChannel: null,
    isSyncing: false,
    lastSyncedAt: null,
    _pushTimer: null,

    normalizeAnimalTypes(arr) {
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
    },

    // Safe retrieval of current state
    getAppState() {
      if (window.appState) return window.appState;
      try {
        const raw = localStorage.getItem('fermegest_state');
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return {
        currency: 'TND',
        lang: 'fr',
        theme: 'dark',
        eggStock: 0,
        eggStocks: { poule: 0, canard_barbarie: 0 },
        milkStock: 0,
        milkHarvests: [],
        eggHarvests: [],
        animals: [],
        expenses: [],
        sales: [],
        incubatorBatches: [],
        feedDistributions: [],
        feedTypes: []
      };
    },

    // Tombstone deletion tracking to prevent ghost data resurrecting during cloud sync
    getDeletedIds() {
      try {
        const raw = localStorage.getItem('fermegest_deleted_ids');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            return new Set(list.map(String));
          }
        }
      } catch (e) {}
      return new Set();
    },

    addDeletedId(id) {
      if (!id) return;
      try {
        const set = this.getDeletedIds();
        set.add(String(id));
        let arr = Array.from(set);
        if (arr.length > 500) arr = arr.slice(-300);
        localStorage.setItem('fermegest_deleted_ids', JSON.stringify(arr));
      } catch (e) {}
    },

    removeDeletedId(id) {
      if (!id) return;
      try {
        const raw = localStorage.getItem('fermegest_deleted_ids');
        if (raw) {
          const list = JSON.parse(raw);
          const filtered = list.filter(item => String(item) !== String(id));
          localStorage.setItem('fermegest_deleted_ids', JSON.stringify(filtered));
        }
      } catch (e) {}
    },

    // Bidirectional smart merge: merges records by ID without losing locally created or cloud created items
    mergeCollections(localList = [], cloudList = [], idKey = 'id') {
      const merged = [];
      const seenIds = new Set();
      const deletedIds = this.getDeletedIds();

      const getTs = (item) => {
        if (!item) return 0;
        if (item.updatedAt && !isNaN(Number(item.updatedAt))) return Number(item.updatedAt);
        if (item.timestamp && !isNaN(Number(item.timestamp))) return Number(item.timestamp);
        if (item.createdAt && !isNaN(Number(item.createdAt))) return Number(item.createdAt);
        if (item.startDate) {
          const d = new Date(item.startDate).getTime();
          if (!isNaN(d)) return d;
        }
        if (item.date) {
          const d = new Date(item.date).getTime();
          if (!isNaN(d)) return d;
        }
        if (typeof item.id === 'string') {
          const numMatch = item.id.match(/\d{10,13}/);
          if (numMatch) return Number(numMatch[0]);
          const base36Match = item.id.match(/^[a-z]+-([0-9a-z]{7,10})$/i);
          if (base36Match) {
            const parsed = parseInt(base36Match[1], 36);
            if (parsed > 1600000000000 && parsed < 2500000000000) return parsed;
          }
        }
        return 0;
      };

      const localMap = new Map();
      (localList || []).forEach(item => {
        if (item && item[idKey]) {
          const key = String(item[idKey]);
          if (!deletedIds.has(key)) {
            localMap.set(key, item);
          }
        }
      });

      (cloudList || []).forEach(cloudItem => {
        if (!cloudItem || !cloudItem[idKey]) return;
        const key = String(cloudItem[idKey]);
        if (deletedIds.has(key)) return; // Do not revive deleted items

        // Vérifier si un aliment local correspond par nom exact même si les IDs diffèrent entre terminaux
        let localKeyToUse = localMap.has(key) ? key : null;
        const isFeedType = key.startsWith('feed-') || cloudItem.stockKg !== undefined;
        if (!localKeyToUse && isFeedType && cloudItem.name) {
          const cName = String(cloudItem.name).trim().toLowerCase();
          for (const [lKey, lItem] of localMap.entries()) {
            if (lItem && lItem.name && String(lItem.name).trim().toLowerCase() === cName) {
              localKeyToUse = lKey;
              break;
            }
          }
        }

        seenIds.add(key);
        if (localKeyToUse) {
          seenIds.add(localKeyToUse);
          const localItem = localMap.get(localKeyToUse);
          const now = Date.now();
          const cloudTs = Math.min(getTs(cloudItem), now);
          const localTs = Math.min(getTs(localItem), now);

          // Protection absolue des stocks d'aliments et synchronisation intelligente :
          // Ne JAMAIS écraser un stock existant (> 0) par 0 kg d'un feed par défaut non initialisé !
          if (isFeedType) {
            const localStock = Number(localItem.stockKg) || 0;
            const cloudStock = Number(cloudItem.stockKg) || 0;

            if (cloudStock > 0 && localStock === 0 && (!localItem.updatedAt || localTs <= 0)) {
              merged.push({ ...localItem, ...cloudItem });
            } else if (localStock > 0 && cloudStock === 0 && (!cloudItem.updatedAt || cloudTs <= 0)) {
              merged.push({ ...cloudItem, ...localItem });
            } else if (localTs && cloudTs) {
              if (localTs >= cloudTs) {
                merged.push({ ...cloudItem, ...localItem });
              } else {
                merged.push({ ...localItem, ...cloudItem });
              }
            } else if (localTs > 0 && !cloudTs) {
              merged.push({ ...cloudItem, ...localItem });
            } else if (cloudTs > 0 && !localTs) {
              merged.push({ ...localItem, ...cloudItem });
            } else {
              // En cas d'égalité ou d'absence de timestamp distinct : conserver l'aliment local pour respecter les distributions effectuées sur cet appareil
              merged.push({ ...cloudItem, ...localItem });
            }
          } else if (localItem.manuallyAdjusted && localTs >= cloudTs) {
            merged.push({ ...cloudItem, ...localItem });
          } else if (cloudTs && localTs) {
            merged.push(cloudTs >= localTs ? { ...localItem, ...cloudItem } : { ...cloudItem, ...localItem });
          } else if (cloudTs && !localTs) {
            merged.push({ ...localItem, ...cloudItem });
          } else if (localTs && !cloudTs) {
            merged.push({ ...cloudItem, ...localItem });
          } else {
            // Priorité aux données du cloud (frère/associé) si timestamps identiques ou absents
            merged.push({ ...localItem, ...cloudItem });
          }
        } else {
          // Exists on cloud, add to local
          merged.push(cloudItem);
        }
      });

      // Keep local items that are not yet on cloud
      for (const [key, localItem] of localMap.entries()) {
        if (!seenIds.has(key)) {
          merged.push(localItem);
        }
      }

      return merged;
    },

    init() {
      if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
        console.warn('[SupabaseAuth] Supabase SDK not found yet, retrying in 200ms...');
        if (!this._initRetries) this._initRetries = 0;
        if (this._initRetries < 25) {
          this._initRetries++;
          setTimeout(() => this.init(), 200);
        }
        return;
      }
      this._initRetries = 0;

      try {
        this.client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });

        // Listen for authentication changes (ignorer les rafraîchissements mineurs pour éliminer les boucles 429 et le flapping des WebSockets)
        this.client.auth.onAuthStateChange((event, session) => {
          if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            if (session && session.user) {
              this.currentUser = session.user;
            }
            return;
          }
          this.handleAuthStateChange(event, session);
        });

        // Initialize collaborative room for shared farm
        this.subscribeCollaborativeRealtime();

        // Check active session on startup
        this.client.auth.getSession().then(({ data }) => {
          if (data && data.session) {
            this.handleAuthStateChange('INITIAL_SESSION', data.session);
          } else {
            // Check if we have a cached user session before falling back to guest mode
            try {
              const cached = JSON.parse(localStorage.getItem('fermegest_cached_auth_user') || 'null');
              if (cached && cached.id) {
                this.currentUser = cached;
              }
            } catch (e) {}
            this.updateUI();
            if (this.currentUser) {
              this.syncNow(false);
            }
            if (window.app) {
              if (typeof app.updateUserHeaderUI === 'function') app.updateUserHeaderUI();
              if (typeof app.updateLivestockUIThemeAndVisibility === 'function') app.updateLivestockUIThemeAndVisibility();
              if (typeof app.closeModal === 'function') {
                app.closeModal('modalOnboarding');
                app.closeModal('modalAnimalSelection');
                app.closeModal('modalAuthPrompt');
                app.closeModal('modalAuth');
              }
            }
          }
        }).catch(err => {
          console.warn('[SupabaseAuth] getSession error:', err);
          try {
            const cached = JSON.parse(localStorage.getItem('fermegest_cached_auth_user') || 'null');
            if (cached && cached.id) {
              this.currentUser = cached;
            }
          } catch (e) {}
          this.updateUI();
        });

        let wakeupDebounceTimer = null;
        const handleWakeup = () => {
          clearTimeout(wakeupDebounceTimer);
          wakeupDebounceTimer = setTimeout(async () => {
            if (this.isSyncing) return;
            if (!this.currentUser && this.client) {
              try {
                const { data } = await this.client.auth.getSession();
                if (data && data.session) this.currentUser = data.session.user;
                else {
                  const cached = JSON.parse(localStorage.getItem('fermegest_cached_auth_user') || 'null');
                  if (cached && cached.id) this.currentUser = cached;
                }
              } catch (e) {}
            }
            if (this.currentUser) {
              console.log('[AutoSync] 🌐 Network/Wakeup: Automatic background sync starting...');
              await this.syncNow(false);
              this.reconnectRealtimeIfNeeded();
            }
          }, 300);
        };

        // Multi-device wake-up listeners (Mobile screen unlock, returning to tab, reconnecting)
        window.addEventListener('online', () => {
          this.updateSyncBadge('online');
          handleWakeup();
        });
        window.addEventListener('offline', () => {
          this.updateSyncBadge('offline');
        });
        window.addEventListener('focus', handleWakeup);
        window.addEventListener('pageshow', handleWakeup);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            handleWakeup();
          }
        });

        // Capacitor app lifecycle (Android / iOS)
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
          try {
            window.Capacitor.Plugins.App.addListener('appStateChange', (state) => {
              if (state && state.isActive) {
                handleWakeup();
              }
            });
          } catch (e) {}
        }

        // Active foreground heartbeat (every 20s) to keep PC and phone 100% in sync
        if (!this._heartbeatInterval) {
          this._heartbeatInterval = setInterval(() => {
            if (this.currentUser && !document.hidden && !this.isSyncing) {
              this.syncNow(false);
            }
          }, 15000);
        }

      } catch (e) {
        console.error('[SupabaseAuth] Init error:', e);
      }
    },

    reconnectRealtimeIfNeeded() {
      if (!this.client || !this.currentUser) return;
      const now = Date.now();
      if (this._lastReconnectTime && (now - this._lastReconnectTime < 10000)) return;
      this._lastReconnectTime = now;

      // Only reconnect if channels are not currently joined or connected
      const isChannelActive = (ch) => ch && (ch.state === 'joined' || ch.state === 'joining');
      if (!isChannelActive(this.realtimeChannel)) {
        this.subscribeRealtime();
      }
      if (!isChannelActive(this.userSyncChannel)) {
        this.subscribeUserSync();
      }
      if (!isChannelActive(this.collabChannel)) {
        this.subscribeCollaborativeRealtime();
      }
    },

    async updateUserProfileMetadata(profile) {
      if (!profile || typeof profile !== 'object') return;
      try {
        if (this.client && this.currentUser) {
          await this.client.auth.updateUser({
            data: {
              farmer_name: profile.name,
              avatar: profile.avatar,
              birth_date: profile.birthDate,
              age: profile.age,
              managed_animals: profile.managedAnimals
            }
          });
        }
      } catch (err) {
        console.warn('[Supabase] updateUserProfileMetadata notice:', err);
      }
    },

    async handleAuthStateChange(event, session) {
      if (session && session.user) {
        this.currentUser = session.user;
        try {
          localStorage.setItem('fermegest_cached_auth_user', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata
          }));
        } catch (e) {}

        // Cache user profile locally (sans appeler updateUser pour protéger les quotas d'authentification)
        const profile = (window.appState && window.appState.userProfile) || (function() {
          try { return JSON.parse(localStorage.getItem('fermegest_user_profile') || 'null'); } catch(e) { return null; }
        })();

        // Close all onboarding and auth prompt modals
        if (window.app && typeof app.closeModal === 'function') {
          app.closeModal('modalOnboarding');
          app.closeModal('modalAnimalSelection');
          app.closeModal('modalAuthPrompt');
          app.closeModal('modalGuestWarning');
          app.closeModal('modalAuth');
        }
        try {
          localStorage.setItem('fermegest_onboarding_completed', 'true');
          localStorage.setItem('fermegest_animals_selection_completed', 'true');
        } catch (e) {}
        this.updateUI();
        await this.syncNow(false);
        this.subscribeRealtime();
        this.subscribeUserSync();
        this.subscribeCollaborativeRealtime();
      } else {
        this.currentUser = null;
        if (this.realtimeChannel && this.client) {
          try { this.client.removeChannel(this.realtimeChannel); } catch (e) {}
        }
        if (this.userSyncChannel && this.client) {
          try { this.client.removeChannel(this.userSyncChannel); } catch (e) {}
        }
        if (this.collabChannel && this.client) {
          try { this.client.removeChannel(this.collabChannel); } catch (e) {}
        }
        this.realtimeChannel = null;
        this.userSyncChannel = null;
        this.collabChannel = null;
        // CRITICAL BUG FIX: NE JAMAIS écraser les données locales lors d'une déconnexion réseau ou expiration de token !
        this.updateUI();
      }
    },

    // 1. Google / Gmail 1-Click Sign-In
    async signInWithGoogle() {
      if (!this.client) return;
      try {
        const redirectUrl = window.location.origin + window.location.pathname;
        const { error } = await this.client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl
          }
        });
        if (error) throw error;
      } catch (err) {
        console.error('Google sign-in error:', err);
        const errEl = document.getElementById('authErrorMessage');
        if (errEl) {
          const msg = ((err.message || '') + ' ' + (err.msg || '')).toLowerCase();
          if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
            errEl.innerHTML = `
              <strong>⚠️ Google n'est pas encore activé dans votre Supabase :</strong><br>
              1. Allez sur <strong>Supabase &gt; Authentication &gt; Providers</strong>.<br>
              2. Activez le bouton <strong>Google</strong>.<br>
              <em>👉 Astuce : Vous pouvez créer un compte immédiatement avec l'onglet "Créer un Compte" ci-dessous !</em>
            `;
          } else {
            errEl.textContent = err.message || err.msg || 'Erreur lors de la connexion Google.';
          }
          errEl.style.color = '#ef4444';
          errEl.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          errEl.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          errEl.classList.remove('hidden');
        } else {
          if (window.app && app.showToast) {
            app.showToast('Erreur Google: ' + (err.message || err), 'error');
          } else {
            console.error('Erreur Google:', err);
          }
        }
      }
    },

    // 1b. Facebook 1-Click Sign-In
    async signInWithFacebook() {
      if (!this.client) return;
      try {
        const redirectUrl = window.location.origin + window.location.pathname;
        const { error } = await this.client.auth.signInWithOAuth({
          provider: 'facebook',
          options: {
            redirectTo: redirectUrl
          }
        });
        if (error) throw error;
      } catch (err) {
        console.error('Facebook sign-in error:', err);
        const errEl = document.getElementById('authErrorMessage');
        if (errEl) {
          const msg = ((err.message || '') + ' ' + (err.msg || '')).toLowerCase();
          if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
            errEl.innerHTML = `
              <strong>⚠️ Facebook n'est pas encore activé dans votre Supabase :</strong><br>
              1. Allez sur <strong>Supabase &gt; Authentication &gt; Providers</strong>.<br>
              2. Activez le bouton <strong>Facebook</strong>.<br>
              <em>👉 Astuce : Vous pouvez créer un compte immédiatement avec l'onglet "Créer un Compte" ci-dessous !</em>
            `;
          } else {
            errEl.textContent = err.message || err.msg || 'Erreur lors de la connexion Facebook.';
          }
          errEl.style.color = '#ef4444';
          errEl.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          errEl.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          errEl.classList.remove('hidden');
        } else {
          if (window.app && app.showToast) {
            app.showToast('Erreur Facebook: ' + (err.message || err), 'error');
          } else {
            console.error('Erreur Facebook:', err);
          }
        }
      }
    },

    // 2. Email & Password Sign-In
    async signInWithEmail(email, password) {
      if (!this.client) return;
      try {
        const { data, error } = await this.client.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });
        if (error) throw error;
        this.closeModal();
        if (window.app && app.showToast) {
          app.showToast('✅ Connecté avec succès !');
        }
      } catch (err) {
        console.error('Email sign-in error:', err);
        const errEl = document.getElementById('authErrorMessage');
        if (errEl) {
          errEl.style.color = '#ef4444';
          errEl.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          errEl.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          errEl.textContent = err.message || 'Identifiants incorrects.';
          errEl.classList.remove('hidden');
        }
      }
    },

    // 3. Email & Password Sign-Up
    async signUpWithEmail(email, password) {
      if (!this.client) return;
      try {
        const { data, error } = await this.client.auth.signUp({
          email: email.trim(),
          password: password
        });
        if (error) throw error;

        if (data && data.user && (!data.session)) {
          // Email confirmation is active in Supabase project settings
          const errEl = document.getElementById('authErrorMessage');
          if (errEl) {
            errEl.style.color = '#10b981';
            errEl.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            errEl.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
            errEl.innerHTML = '✉️ <strong>Compte créé !</strong> Vérifiez votre boîte mail pour confirmer votre compte, ou connectez-vous.';
            errEl.classList.remove('hidden');
          }
          if (window.app && app.showToast) {
            app.showToast('✉️ Vérifiez vos emails pour valider le compte.');
          }
        } else {
          this.closeModal();
          if (window.app && app.showToast) {
            app.showToast('✅ Compte créé avec succès !');
          }
        }
      } catch (err) {
        console.error('Email sign-up error:', err);
        const errEl = document.getElementById('authErrorMessage');
        if (errEl) {
          errEl.style.color = '#ef4444';
          errEl.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          errEl.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          errEl.textContent = err.message || 'Erreur lors de la création du compte.';
          errEl.classList.remove('hidden');
        }
      }
    },

    // 4. Sign Out
        // Reset all local memory and storage to 0 upon sign-out to protect user privacy
    resetLocalDataToZero() {
      if (window.appState) {
        window.appState.userProfile = null;
        window.appState.animals = [];
        window.appState.expenses = [];
        window.appState.sales = [];
        window.appState.incubatorBatches = [];
        window.appState.eggHarvests = [];
        window.appState.eggStock = 0;
        window.appState.milkStock = 0;
        window.appState.milkHarvests = [];
        window.appState.feedDistributions = [];
        window.appState.feedTypes = [];
        window.appState.feedStockKg = null;
        window.appState.feedStockDate = null;
        window.appState.feedStockCostPerKg = 1.0;
        window.appState.feedStockUpdatedAt = null;
        window.appState.feedRationMode = 'custom';
        window.appState.customDailyFeedKg = null;
        window.appState.sicamCansCount = null;
        window.appState.calendarEvents = [];
        window.appState.deletedFeedIds = [];
        window.appState.deletedFeedFamilies = [];
      }

      try {
        // Préserver le backup de sécurité de l'appareil en cas de reconnexion
        const b = localStorage.getItem('fermegest_state_backup') || localStorage.getItem('fermegest_state');
        if (b) localStorage.setItem('fermegest_state_pre_signout', b);
        localStorage.removeItem('fermegest_state');
        // Ne pas détruire fermegest_state_backup pour permettre la restauration d'urgence
        localStorage.removeItem('fermegest_user_profile');
        localStorage.removeItem('fermegest_farm_code');
        localStorage.removeItem('fermegest_farm_role');
        localStorage.removeItem('fermegest_farm_owner_email');
        localStorage.removeItem('fermegest_managed_animal_types');
        localStorage.removeItem('fermegest_guest_acknowledged');
        localStorage.removeItem('fermegest_guest_mode');
      } catch (e) {}

      const headerUserText = document.getElementById('headerUserText');
      if (headerUserText) headerUserText.textContent = '';
      const headerUserInitial = document.getElementById('headerUserInitial');
      if (headerUserInitial) headerUserInitial.innerHTML = '👤';
      const mobileUserInitial = document.getElementById('mobileUserInitial');
      if (mobileUserInitial) mobileUserInitial.innerHTML = '👤';

      if (window.app) {
        if (typeof app.updateLivestockUIThemeAndVisibility === 'function') {
          app.updateLivestockUIThemeAndVisibility();
        }
        if (typeof app.renderAll === 'function') {
          app.renderAll();
        }
        if (typeof app.switchTab === 'function') {
          app.switchTab('dashboard');
        }
      }

      this.updateUI();
    },

    async signOut() {
      if (!this.client) return;
      const doSignOut = async () => {
        try {
          await this.client.auth.signOut();
          this.currentUser = null;
          try {
            localStorage.removeItem('fermegest_cached_auth_user');
          } catch (e) {}
          this.updateUI();
          this.closeProfileModal();
          if (window.app && app.showToast) {
            app.showToast('Déconnecté.');
          }
        } catch (err) {
          console.error('Sign-out error:', err);
        }
      };

      if (window.app && typeof app.confirmDialog === 'function') {
        const isAr = (window.appState && appState.lang === 'ar');
        app.confirmDialog({
          title: isAr ? 'تسجيل الخروج' : 'Déconnexion',
          message: isAr ? 'هل تريد تسجيل الخروج من حسابك ؟' : 'Voulez-vous vous déconnecter de votre compte ?',
          confirmText: isAr ? 'خروج' : 'Se déconnecter',
          isDanger: true,
          onConfirm: doSignOut
        });
      } else {
        doSignOut();
      }
    },

    // 5. Pull Cloud Data from 'user_farms' with Smart Multi-Account Merging
    async pullData(isSilent = false) {
      if (!this.client || !this.currentUser || this.isSyncing) return;
      this.isSyncing = true;

      try {
        const farmCode = this.getFarmCode();

        let rows = [];
        if (farmCode) {
          // Charger toutes les lignes associées à ce code de ferme (propriétaire + associés)
          // ordonnées par updated_at croissant pour replier les modifications de chaque compte dans l'ordre chronologique
          const { data, error } = await this.client
            .from('user_farms')
            .select('data, updated_at, user_id')
            .contains('data', { farmCode: farmCode })
            .order('updated_at', { ascending: true });

          if (!error && Array.isArray(data) && data.length > 0) {
            rows = data;
          }
        }

        // Repli : si aucun enregistrement trouvé avec farmCode, charger par user_id
        if (rows.length === 0) {
          const { data, error } = await this.client
            .from('user_farms')
            .select('data, updated_at, user_id')
            .eq('user_id', this.currentUser.id)
            .maybeSingle();

          if (!error && data) {
            rows = [data];
          }
        }

        if (rows.length > 0) {
          let hasNewData = false;
          for (const row of rows) {
            if (row && row.data && Object.keys(row.data).length > 0) {
              const cloudUpdatedAt = row.updated_at || (row.data && row.data.lastUpdated);
              this.applyCloudData(row.data, true);
              hasNewData = true;
              this._lastCloudTimestamp = cloudUpdatedAt;
            }
          }
          if (hasNewData) {
            this.lastSyncedAt = new Date();
            this.updateUI();
            if (!isSilent && window.app && app.showToast) {
              app.showToast('☁️ Données synchronisées avec votre élevage !');
            }
          }
        } else {
          // Initialize cloud row with current local data
          await this.pushData(false);
          this.lastSyncedAt = new Date();
          this.updateUI();
        }
      } catch (err) {
        console.warn('[SupabaseAuth] Pull error:', err);
      } finally {
        this.isSyncing = false;
        if (this._needPushAgain) {
          this._needPushAgain = false;
          setTimeout(() => this.pushData(false), 300);
        }
      }
    },

    // 5b. Smart Manual Sync: 100% direct, free and instant (Zero Ad blocking)
    async syncNow(showToast = true) {
      if (!this.client || !this.currentUser) {
        if (showToast && window.app && app.showToast) {
          app.showToast('Veuillez vous connecter pour synchroniser vos appareils.');
        }
        return;
      }

      if (this.isSyncing) return;
      this.isSyncing = true;
      this.updateSyncBadge('syncing');

      try {
        // 0. Si le terminal local possède des saisies en attente de push, POUSSER D'ABORD !
        // Interdiction absolue de faire un pull qui écraserait les modifications locales fraîches.
        const hasPendingPush = localStorage.getItem('fermegest_pending_push') === 'true';
        if (hasPendingPush) {
          console.log('[Sync] 🚀 Envoi prioritaire des saisies locales avant synchronisation...');
          await this.pushData(false, true);
        }

        // 1. Priorité absolue : interroger la ligne canonique du compte connecté (user_id)
        let ownRow = null;
        const { data: userRow, error: userRowErr } = await this.client
          .from('user_farms')
          .select('data, updated_at, user_id')
          .eq('user_id', this.currentUser.id)
          .maybeSingle();

        if (userRowErr) {
          console.warn('[Sync] ⚠️ Échec de lecture Cloud (réseau ou quota), arrêt immédiat pour interdire tout écrasement destructif :', userRowErr);
          throw userRowErr;
        }

        if (userRow && userRow.data) {
          ownRow = userRow;
        }

        // 2. Déterminer et verrouiller le code de ferme canonique du compte
        let farmCode = (ownRow && ownRow.data && ownRow.data.farmCode) || this.getFarmCode();
        if (ownRow && ownRow.data && ownRow.data.farmCode) {
          farmCode = ownRow.data.farmCode;
          try {
            localStorage.setItem('fermegest_farm_code', farmCode);
            if (ownRow.data.farmRole) localStorage.setItem('fermegest_farm_role', ownRow.data.farmRole);
            if (ownRow.data.ownerEmail) localStorage.setItem('fermegest_farm_owner_email', ownRow.data.ownerEmail);
          } catch(e) {}
        }

        // 3. Récupérer toutes les lignes associées à ce farmCode (partenaire / multi-comptes)
        let rows = ownRow ? [ownRow] : [];
        if (farmCode) {
          const { data: sharedRows, error: sharedErr } = await this.client
            .from('user_farms')
            .select('data, updated_at, user_id')
            .contains('data', { farmCode: farmCode })
            .order('updated_at', { ascending: true });

          if (!sharedErr && Array.isArray(sharedRows) && sharedRows.length > 0) {
            rows = sharedRows;
          }
        }

        if (rows.length > 0) {
          const isPartner = this.getFarmRole() === 'partner';
          const ownerRow = rows.find(r => r.data && (r.data.farmRole === 'owner' || !r.data.farmRole));
          const localState = this.getAppState();
          const localHasData = (localState.animals && localState.animals.length > 0) || (localState.expenses && localState.expenses.length > 0);

          if (isPartner && ownerRow && ownerRow.data) {
            // RÈGLE SOUVERAINE : Si l'utilisateur est un associé, la ferme du Propriétaire est la vérité absolue
            console.log('[Sync] 👑 Adoption des données canoniques du Propriétaire pour l\'associé.');
            this.applyCloudData(ownerRow.data, localHasData ? true : false);
          } else {
            // RÈGLE SOUVERAINE : Si l'utilisateur est le Propriétaire (ou compte individuel)
            for (const row of rows) {
              if (row && row.data && Object.keys(row.data).length > 0) {
                const isPartnerRow = (row.data.farmRole === 'partner' && row.user_id !== this.currentUser.id);
                // Si une ligne partenaire contient un cheptel vide alors que le propriétaire a des animaux,
                // INTERDICTION FORMELLE d'écraser le cheptel du propriétaire avec du vide !
                if (isPartnerRow && (!row.data.animals || row.data.animals.length === 0) && localHasData) {
                  console.log('[Sync] 🛡️ Protection: Cheptel vide de l\'associé ignoré pour préserver le propriétaire.');
                  const sanitizedRowData = { ...row.data };
                  delete sanitizedRowData.animals;
                  this.applyCloudData(sanitizedRowData, true);
                  continue;
                }

                const isDirectOwnerSelf = (row.user_id === this.currentUser.id);
                const cloudHasData = (row.data.animals && row.data.animals.length > 0) || (row.data.expenses && row.data.expenses.length > 0);
                const shouldDirectHydrate = isDirectOwnerSelf && !localHasData && cloudHasData;

                this.applyCloudData(row.data, !shouldDirectHydrate);
              }
            }
          }

          if (window.app && typeof app.renderAll === 'function') {
            app.renderAll();
          }
        }

        // 2. Push unified merged data back to user_farms
        // Uniquement si des données locales fraîches existent (hasPendingPush) ou si l'utilisateur synchronise manuellement
        const mustPushBack = showToast || hasPendingPush || !ownRow;
        if (!mustPushBack) {
          this.lastSyncedAt = new Date();
          this.updateSyncBadge('connected');
          return;
        }

        const state = this.getAppState();
        const farmRole = this.getFarmRole();

        // Guardrail souverain : Partenaire avec cheptel vide ne pousse jamais de cheptel vide destructif
        if (farmRole === 'partner' && (!state.animals || state.animals.length === 0) && !state._resetCleared) {
          console.warn('[Sync] 🛡️ Guardrail: Partenaire avec 0 animaux, push annulé pour protéger le propriétaire.');
          this.lastSyncedAt = new Date();
          this.updateSyncBadge('connected');
          return;
        }
        const ownerEmail = farmRole === 'owner'
          ? (this.currentUser ? this.currentUser.email : '')
          : this.getFarmOwnerEmail();

        const payload = {
          version: '2.5.0-pro',
          _senderSessionId: this.sessionId,
          farmCode: farmCode,
          farmRole: farmRole,
          ownerEmail: ownerEmail,
          currency: state.currency || 'TND',
          lang: state.lang || 'fr',
          theme: state.theme || 'dark',
          userProfile: state.userProfile || (function() {
            try { return JSON.parse(localStorage.getItem('fermegest_user_profile') || 'null'); } catch(e) { return null; }
          })(),
          eggStock: Number(state.eggStock) || 0,
        eggStocks: state.eggStocks || { poule: Number(state.eggStock) || 0, canard_barbarie: 0 },
          milkStock: Number(state.milkStock) || 0,
          milkHarvests: Array.isArray(state.milkHarvests) ? state.milkHarvests : [],
          eggHarvests: Array.isArray(state.eggHarvests) ? state.eggHarvests : [],
          eggConsumptions: Array.isArray(state.eggConsumptions) ? state.eggConsumptions : [],
          feedStockKg: state.feedStockKg !== undefined ? state.feedStockKg : null,
          feedStockDate: state.feedStockDate || null,
          feedStockCostPerKg: state.feedStockCostPerKg || 1.0,
          feedStockUpdatedAt: state.feedStockUpdatedAt || Date.now(),
          feedRationMode: state.feedRationMode || 'custom',
          customDailyFeedKg: (state.customDailyFeedKg !== undefined && state.customDailyFeedKg !== null) ? state.customDailyFeedKg : null,
          sicamCansCount: (state.sicamCansCount !== undefined && state.sicamCansCount !== null) ? state.sicamCansCount : null,
          feedDistributions: Array.isArray(state.feedDistributions) ? state.feedDistributions : [],
          feedTypes: Array.isArray(state.feedTypes) ? state.feedTypes : [],
          animals: Array.isArray(state.animals) ? state.animals : [],
          expenses: Array.isArray(state.expenses) ? state.expenses : [],
          sales: Array.isArray(state.sales) ? state.sales : [],
          incubatorBatches: Array.isArray(state.incubatorBatches) ? state.incubatorBatches : [],
          calendarEvents: Array.isArray(state.calendarEvents) ? state.calendarEvents : [],
          deletedIds: Array.from(this.getDeletedIds()),
          lastResetAt: state.lastResetAt || null,
          _resetCleared: !!state._resetCleared,
          lastUpdated: Number(state.lastUpdated) || Date.now()
        };

        const { error: upsertErr } = await this.client
          .from('user_farms')
          .upsert({
            user_id: this.currentUser.id,
            data: payload,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (upsertErr) throw upsertErr;

        localStorage.removeItem('fermegest_pending_push');
        this.lastSyncedAt = new Date();
        this.updateSyncBadge('connected');
        this.updateProfileModalUI();

        // Broadcast to other sessions/devices
        this.broadcastCurrentState();

        if (showToast && window.app && app.showToast) {
          const animalsCount = (state.animals || []).length;
          const expensesCount = (state.expenses || []).length;
          const lang = (window.appState && window.appState.lang) || 'fr';
          const msg = lang === 'ar'
            ? `✅ تمّت المزامنة بنجاح ! (${animalsCount} قطيع، ${expensesCount} مصاريف)`
            : `✅ Synchronisation réussie ! (${animalsCount} lot(s), ${expensesCount} dépense(s))`;
          app.showToast(msg);
        }
      } catch (err) {
        console.error('[SupabaseAuth] Sync error:', err);
        this.updateSyncBadge('error');
        if (showToast && window.app && app.showToast) {
          app.showToast('⚠️ Erreur de synchronisation Cloud. Vérifiez votre connexion.', 'danger');
        }
      } finally {
        this.isSyncing = false;
        if (this._needPushAgain) {
          this._needPushAgain = false;
          setTimeout(() => this.pushData(false), 300);
        }
      }
    },

    // 6. Push Cloud Data to 'user_farms'
    async pushData(showToast = false, force = false) {
      if (!this.client || !this.currentUser) return;
      if (this.isSyncing && !force) {
        this._needPushAgain = true;
        return;
      }

      const farmCode = this.getFarmCode();
      const farmRole = this.getFarmRole();
      const state = this.getAppState();

      // Guardrail souverain : Partenaire avec cheptel vide ne pousse jamais de cheptel vide destructif
      if (farmRole === 'partner' && (!state.animals || state.animals.length === 0) && !state._resetCleared) {
        console.warn('[PushData] 🛡️ Guardrail: Partenaire avec 0 animaux, push annulé pour protéger le propriétaire.');
        this.updateSyncBadge('connected');
        return;
      }

      this.isSyncing = true;
      this.updateSyncBadge('syncing');

      const ownerEmail = farmRole === 'owner'
        ? (this.currentUser ? this.currentUser.email : '')
        : this.getFarmOwnerEmail();
      const payload = {
        version: '2.5.0-pro',
        _senderSessionId: this.sessionId,
        farmCode: farmCode,
        farmRole: farmRole,
        ownerEmail: ownerEmail,
        currency: state.currency || 'TND',
        lang: state.lang || 'fr',
        theme: state.theme || 'dark',
        userProfile: state.userProfile || (function() {
          try { return JSON.parse(localStorage.getItem('fermegest_user_profile') || 'null'); } catch(e) { return null; }
        })(),
        eggStock: Number(state.eggStock) || 0,
        eggStocks: state.eggStocks || { poule: Number(state.eggStock) || 0, canard_barbarie: 0 },
          milkStock: Number(state.milkStock) || 0,
          milkHarvests: Array.isArray(state.milkHarvests) ? state.milkHarvests : [],
        eggHarvests: Array.isArray(state.eggHarvests) ? state.eggHarvests : [],
        eggConsumptions: Array.isArray(state.eggConsumptions) ? state.eggConsumptions : [],
        feedStockKg: state.feedStockKg !== undefined ? state.feedStockKg : null,
        feedStockDate: state.feedStockDate || null,
        feedStockCostPerKg: state.feedStockCostPerKg || 1.0,
        feedStockUpdatedAt: Math.min(Number(state.feedStockUpdatedAt) || Date.now(), Date.now()),
        feedRationMode: state.feedRationMode || 'custom',
        customDailyFeedKg: (state.customDailyFeedKg !== undefined && state.customDailyFeedKg !== null) ? state.customDailyFeedKg : null,
        sicamCansCount: (state.sicamCansCount !== undefined && state.sicamCansCount !== null) ? state.sicamCansCount : null,
        feedDistributions: Array.isArray(state.feedDistributions) ? state.feedDistributions : [],
        feedTypes: Array.isArray(state.feedTypes) ? state.feedTypes : [],
        animals: Array.isArray(state.animals) ? state.animals : [],
        expenses: Array.isArray(state.expenses) ? state.expenses : [],
        sales: Array.isArray(state.sales) ? state.sales : [],
        incubatorBatches: Array.isArray(state.incubatorBatches) ? state.incubatorBatches : [],
        deletedIds: Array.from(this.getDeletedIds()),
        lastResetAt: state.lastResetAt || null,
        _resetCleared: !!state._resetCleared,
        lastUpdated: Number(state.lastUpdated) || Date.now()
      };

      try {
        const { error } = await this.client
          .from('user_farms')
          .upsert({
            user_id: this.currentUser.id,
            data: payload,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

        if (error) throw error;

        localStorage.removeItem('fermegest_pending_push');
        try {
          localStorage.setItem('fermegest_last_pushed_edit', String(payload.lastUpdated));
        } catch(e) {}
        this.lastSyncedAt = new Date();
        this.updateSyncBadge('connected');

        // Real-time instant broadcast to all other open sessions/devices
        this.broadcastCurrentState();

        if (showToast && window.app && app.showToast) {
          app.showToast('☁️ Données sauvegardées sur le Cloud !');
        }
      } catch (err) {
        console.error('[SupabaseAuth] Push error:', err);
        localStorage.setItem('fermegest_pending_push', 'true');
        this.updateSyncBadge('error');
      } finally {
        this.isSyncing = false;
        if (this._needPushAgain) {
          this._needPushAgain = false;
          setTimeout(() => this.pushData(false), 300);
        }
      }
    },

    // Auto-save debouncer triggered whenever app.saveState() runs:
    // PUSH-FIRST STRICT : Envoie directement les modifications locales vers Supabase sans jamais faire de pull préalable
    schedulePush() {
      if (!this.currentUser) return;
      try {
        localStorage.setItem('fermegest_pending_push', 'true');
      } catch (e) {}
      clearTimeout(this._pushTimer);
      this._pushTimer = setTimeout(() => {
        this.pushData(false, true);
      }, 250);
    },

    // 7. Subscribe to Postgres Realtime changes across devices and shared farm members
    subscribeRealtime() {
      if (!this.client || !this.currentUser) return;
      const isChannelActive = (ch) => ch && (ch.state === 'joined' || ch.state === 'joining' || ch.state === 'subscribed');
      if (isChannelActive(this.realtimeChannel)) return;

      if (this.realtimeChannel) {
        try { this.client.removeChannel(this.realtimeChannel); } catch (e) {}
      }

      try {
        const farmCode = this.getFarmCode();
        const chanName = farmCode ? `shared_farm_realtime_${farmCode}` : `user_farm_realtime_${this.currentUser.id}`;
        this.realtimeChannel = this.client
          .channel(chanName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_farms'
            },
            (payload) => {
              if (payload.new && payload.new.data) {
                const incomingData = payload.new.data;
                const currentCode = this.getFarmCode();
                const isSameFarm = currentCode && incomingData.farmCode === currentCode;
                const isOwnRow = payload.new.user_id === this.currentUser.id;

                if (isSameFarm || isOwnRow) {
                  const incomingSession = incomingData._senderSessionId || incomingData.senderSessionId;
                  const isFromThisSession = incomingSession && incomingSession === this.sessionId;
                  if (!isFromThisSession) {
                    console.log('[Realtime] 🔄 Mise à jour Cloud reçue d\'un autre appareil / session :', payload.new.user_id);
                    this.applyCloudData(incomingData, true);
                    this.lastSyncedAt = new Date();
                    this.updateUI();
                    if (window.app && typeof app.renderAll === 'function') app.renderAll();
                  }
                }
              }
            }
          )
          .subscribe((status) => {
            console.log(`[Realtime] Subscription status for ${chanName}:`, status);
          });
      } catch (e) {
        console.warn('[SupabaseAuth] Realtime subscribe error:', e);
      }
    },

    // 7b. Dedicated Realtime Channel between devices of the SAME user account
    subscribeUserSync() {
      if (!this.client || !this.currentUser) return;
      const isChannelActive = (ch) => ch && (ch.state === 'joined' || ch.state === 'joining' || ch.state === 'subscribed');
      if (isChannelActive(this.userSyncChannel)) return;

      if (this.userSyncChannel) {
        try { this.client.removeChannel(this.userSyncChannel); } catch (e) {}
        this.userSyncChannel = null;
      }

      try {
        const channelName = `user_device_sync_${this.currentUser.id}`;
        this.userSyncChannel = this.client
          .channel(channelName, {
            config: { broadcast: { self: false } }
          })
          .on('broadcast', { event: 'device_state_update' }, (payload) => {
            const raw = (payload && payload.payload) ? payload.payload : payload;
            if (!raw) return;
            const data = raw;
            // Ignore echoes from this exact tab/session
            if (data.senderSessionId && data.senderSessionId === this.sessionId) return;

            console.log('[UserSync] Realtime broadcast received from another device session:', data.senderSessionId);
            if (data.farmData) {
              const localState = this.getAppState();
              const localHasAnimals = localState.animals && localState.animals.length > 0;
              const incomingHasAnimals = data.farmData.animals && data.farmData.animals.length > 0;
              const isExplicitReset = data.farmData._resetCleared === true;

              // Guardrail anti-écrasement destructif du cheptel
              if (localHasAnimals && !incomingHasAnimals && !isExplicitReset) {
                console.warn('[CollabRoom] 🛡️ Guardrail: Message Realtime avec cheptel vide ignoré pour protéger les animaux locaux.');
                const safeFarmData = { ...data.farmData };
                delete safeFarmData.animals;
                this.applyCloudData(safeFarmData, true);
              } else {
                this.applyCloudData(data.farmData, true);
              }

              this.lastSyncedAt = new Date();
              this.updateUI();
            }
          })
          .on('broadcast', { event: 'request_state' }, (payload) => {
            const raw = (payload && payload.payload) ? payload.payload : payload;
            if (!raw) return;
            if (raw.senderSessionId && raw.senderSessionId === this.sessionId) return;
            this.broadcastCurrentState();
          })
          .subscribe((status) => {
            console.log(`[UserSync] Subscribed to ${channelName}:`, status);
            if (status === 'SUBSCRIBED') {
              try {
                this.userSyncChannel.send({
                  type: 'broadcast',
                  event: 'request_state',
                  payload: { senderSessionId: this.sessionId }
                });
              } catch (e) {}
            }
          });
      } catch (e) {
        console.warn('[UserSync] Subscribe error:', e);
      }
    },

    // 8. Apply incoming cloud data into local state & re-render
    applyCloudData(cloudData, doMerge = true) {
      if (!cloudData) return;
      const state = this.getAppState();

      const hasPendingLocalPush = (typeof localStorage !== 'undefined') && localStorage.getItem('fermegest_pending_push') === 'true';
      const localLastEdit = Number(state.lastUpdated) || (hasPendingLocalPush && typeof localStorage !== 'undefined' ? Number(localStorage.getItem('fermegest_last_local_edit')) || 0 : 0);
      const cloudLastUpdated = Number(cloudData.lastUpdated) || 0;

      // Protection souveraine : si le terminal local a des modifications en attente de push,
      // ou si l'horodatage local est strictement plus récent qu'un cloud valide, le cloud n'est PAS plus frais
      const isCloudFresher = (cloudLastUpdated > localLastEdit) && !hasPendingLocalPush;

      // Détection de l'ordre souverain de remise à zéro de la ferme ("Mettre à 0")
      const isCloudReset = cloudData._resetCleared === true && Number(cloudData.lastResetAt) >= Number(state.lastResetAt || 0);
      const isLocalOverruledByReset = isCloudReset && (Number(cloudData.lastResetAt) >= localLastEdit || isCloudFresher);

      // Protection anti-écrasement destructive :
      // Interdire le mode destructif (doMerge = false) si le terminal local possède déjà des données réelles
      // SAUF si le Cloud transmet un ordre explicite de réinitialisation ("Mettre à 0") plus récent que les données locales
      const localDataCount = (state.animals || []).length + 
                             (state.expenses || []).length + 
                             (state.feedTypes || []).length + 
                             (state.sales || []).length + 
                             (state.eggHarvests || []).length + 
                             (state.feedDistributions || []).length;
      let effectiveDoMerge = doMerge || (localDataCount > 0) || hasPendingLocalPush;
      if (isLocalOverruledByReset) {
        effectiveDoMerge = false;
        state.lastResetAt = Number(cloudData.lastResetAt);
        state._resetCleared = true;
        try {
          localStorage.removeItem('fermegest_pending_push');
        } catch(e) {}
      }

      // Ingest deletedIds if provided by cloud
      if (Array.isArray(cloudData.deletedIds)) {
        cloudData.deletedIds.forEach(id => this.addDeletedId(id));
      }

      if (cloudData.currency) state.currency = cloudData.currency;
      if (cloudData.lang && !localStorage.getItem('fermegest_lang_manual')) {
        state.lang = cloudData.lang;
      }

      // Restore userProfile if provided by cloud (canonical source of truth for this account)
      if (cloudData.userProfile && typeof cloudData.userProfile === 'object' && cloudData.userProfile.name) {
        const cloudManaged = Array.isArray(cloudData.userProfile.managedAnimals) 
          ? this.normalizeAnimalTypes(cloudData.userProfile.managedAnimals) 
          : [];
        const localManaged = (state.userProfile && Array.isArray(state.userProfile.managedAnimals)) 
          ? this.normalizeAnimalTypes(state.userProfile.managedAnimals) 
          : [];
        const cloudTime = Number(cloudData.userProfile.updatedAt) || 0;
        const localTime = Number(state.userProfile?.updatedAt) || 0;

        let chosenManaged = ['poultry'];
        if (localTime > cloudTime && localManaged.length > 0) {
          chosenManaged = localManaged;
        } else if (cloudManaged.length > 0) {
          chosenManaged = cloudManaged;
        } else if (localManaged.length > 0) {
          chosenManaged = localManaged;
        }

        state.userProfile = {
          ...cloudData.userProfile,
          managedAnimals: chosenManaged,
          avatar: cloudData.userProfile.avatar || 'avatar-m1'
        };
        try {
          localStorage.setItem('fermegest_user_profile', JSON.stringify(state.userProfile));
          localStorage.setItem('fermegest_onboarding_completed', 'true');
          if (Array.isArray(state.userProfile.managedAnimals) && state.userProfile.managedAnimals.length > 0) {
            localStorage.setItem('fermegest_managed_animal_types', JSON.stringify(state.userProfile.managedAnimals));
            localStorage.setItem('fermegest_animals_selection_completed', 'true');
          }
        } catch (e) {}
      } else if (this.currentUser && this.currentUser.user_metadata && (this.currentUser.user_metadata.full_name || this.currentUser.user_metadata.farmer_name || this.currentUser.user_metadata.name)) {
        const meta = this.currentUser.user_metadata;
        const metaName = meta.farmer_name || meta.full_name || meta.name || (this.currentUser.email ? this.currentUser.email.split('@')[0] : 'Éleveur');
        const metaAvatar = meta.avatar || 'avatar-m1';
        const metaBirth = meta.birth_date || meta.birthDate || null;
        const metaAge = meta.age ? Number(meta.age) : (metaBirth && window.app && typeof app.calculateAge === 'function' ? app.calculateAge(metaBirth) : null);

        state.userProfile = {
          name: metaName,
          birthDate: metaBirth,
          age: metaAge,
          avatar: metaAvatar,
          gender: (metaAvatar && metaAvatar.includes('-f')) ? 'female' : 'male',
          managedAnimals: state.userProfile?.managedAnimals || ['poultry'],
          updatedAt: Date.now()
        };
        try {
          localStorage.setItem('fermegest_user_profile', JSON.stringify(state.userProfile));
          localStorage.setItem('fermegest_onboarding_completed', 'true');
        } catch (e) {}
      }

      // 1. Egg & feed stock handling (multi-species support: poule, canard de barbarie, etc.)
      if (!state.eggStocks || typeof state.eggStocks !== 'object') {
        state.eggStocks = { poule: Number(state.eggStock) || 0, canard_barbarie: 0 };
      }
      // Ingestion et consolidation des tombstones des catégories d'œufs supprimées
      const deletedEggCats = new Set([
        ...(Array.isArray(state.deletedEggCategories) ? state.deletedEggCategories : []),
        ...(Array.isArray(cloudData.deletedEggCategories) ? cloudData.deletedEggCategories : [])
      ]);
      const currentDeletedIds = this.getDeletedIds();
      currentDeletedIds.forEach(id => {
        if (typeof id === 'string' && id.startsWith('egg-cat-')) {
          deletedEggCats.add(id.replace('egg-cat-', ''));
        }
      });
      state.deletedEggCategories = Array.from(deletedEggCats);

      if (cloudLastUpdated > 0 && !hasPendingLocalPush) {
        state.lastUpdated = Math.max(Number(state.lastUpdated) || 0, cloudLastUpdated);
        try {
          localStorage.setItem('fermegest_last_local_edit', String(state.lastUpdated));
        } catch (e) {}
      }

      // EVENT-SOURCING DELTA RECONCILIATION FOR EGGS & FEED (Add-Only Offline Preservation)
      const cloudHarvestIds = new Set((cloudData.eggHarvests || []).map(h => h && h.id).filter(Boolean));
      const localOfflineHarvests = (state.eggHarvests || []).filter(h => h && h.id && !cloudHarvestIds.has(h.id));
      const offlineHarvestBySpecies = {};
      localOfflineHarvests.forEach(h => {
        const sp = (h.species === 'canard' || h.species === 'canard_barbarie') ? 'canard_barbarie' : (h.species || 'poule');
        offlineHarvestBySpecies[sp] = (offlineHarvestBySpecies[sp] || 0) + (Number(h.count) || 0);
      });

      const cloudSaleIds = new Set((cloudData.sales || []).map(s => s && s.id).filter(Boolean));
      const localOfflineSales = (state.sales || []).filter(s => s && s.id && !cloudSaleIds.has(s.id));
      const offlineEggSalesBySpecies = {};
      localOfflineSales.forEach(s => {
        if (s && s.productType === 'oeufs') {
          const sp = s.eggSpecies || s.species || 'poule';
          let qty = Number(s.quantity) || 0;
          if (s.format === 'hara') qty *= 4;
          else if (s.format === 'plateau') qty *= 30;
          offlineEggSalesBySpecies[sp] = (offlineEggSalesBySpecies[sp] || 0) + qty;
        }
      });

      // Inclure les consommations locales non encore envoyées au Cloud
      const cloudConsIds = new Set((cloudData.eggConsumptions || []).map(c => c && c.id).filter(Boolean));
      const localOfflineCons = (state.eggConsumptions || []).filter(c => c && c.id && !cloudConsIds.has(c.id));
      localOfflineCons.forEach(c => {
        const sp = c.species || 'poule';
        offlineEggSalesBySpecies[sp] = (offlineEggSalesBySpecies[sp] || 0) + (Number(c.count) || 0);
      });

      // Inclure les œufs locaux mis en couveuse non encore synchronisés
      const cloudBatchIds = new Set((cloudData.incubatorBatches || []).map(b => b && b.id).filter(Boolean));
      const localOfflineBatches = (state.incubatorBatches || []).filter(b => b && b.id && b.eggSource === 'farm' && !cloudBatchIds.has(b.id));
      localOfflineBatches.forEach(b => {
        const sp = (b.eggType === 'canard' || b.species === 'canard') ? 'canard_barbarie' : (b.eggType || b.species || 'poule');
        offlineEggSalesBySpecies[sp] = (offlineEggSalesBySpecies[sp] || 0) + (Number(b.eggsCount) || 0);
      });

      // Récoltes & Ventes distantes reçues du Cloud (ex: saisies par le frère) non encore intégrées localement
      const localHarvestIds = new Set((state.eggHarvests || []).map(h => h && h.id).filter(Boolean));
      const incomingCloudHarvests = (cloudData.eggHarvests || []).filter(h => h && h.id && !localHarvestIds.has(h.id));
      const incomingHarvestBySpecies = {};
      incomingCloudHarvests.forEach(h => {
        const sp = (h.species === 'canard' || h.species === 'canard_barbarie') ? 'canard_barbarie' : (h.species || 'poule');
        incomingHarvestBySpecies[sp] = (incomingHarvestBySpecies[sp] || 0) + (Number(h.count) || 0);
      });

      const localSaleIds = new Set((state.sales || []).map(s => s && s.id).filter(Boolean));
      const incomingCloudSales = (cloudData.sales || []).filter(s => s && s.id && !localSaleIds.has(s.id));
      const incomingEggSalesBySpecies = {};
      incomingCloudSales.forEach(s => {
        if (s && s.productType === 'oeufs') {
          const sp = s.eggSpecies || s.species || 'poule';
          let qty = Number(s.quantity) || 0;
          if (s.format === 'hara') qty *= 4;
          else if (s.format === 'plateau') qty *= 30;
          incomingEggSalesBySpecies[sp] = (incomingEggSalesBySpecies[sp] || 0) + qty;
        }
      });

      // Inclure les consommations distantes arrivées du Cloud
      const localConsIds = new Set((state.eggConsumptions || []).map(c => c && c.id).filter(Boolean));
      const incomingCloudCons = (cloudData.eggConsumptions || []).filter(c => c && c.id && !localConsIds.has(c.id));
      incomingCloudCons.forEach(c => {
        const sp = c.species || 'poule';
        incomingEggSalesBySpecies[sp] = (incomingEggSalesBySpecies[sp] || 0) + (Number(c.count) || 0);
      });

      // Inclure les couvées distantes déduisant les œufs de la ferme
      const localBatchIds = new Set((state.incubatorBatches || []).map(b => b && b.id).filter(Boolean));
      const incomingCloudBatches = (cloudData.incubatorBatches || []).filter(b => b && b.id && b.eggSource === 'farm' && !localBatchIds.has(b.id));
      incomingCloudBatches.forEach(b => {
        const sp = (b.eggType === 'canard' || b.species === 'canard') ? 'canard_barbarie' : (b.eggType || b.species || 'poule');
        incomingEggSalesBySpecies[sp] = (incomingEggSalesBySpecies[sp] || 0) + (Number(b.eggsCount) || 0);
      });

      if (cloudData.eggStocks && typeof cloudData.eggStocks === 'object') {
        if (!effectiveDoMerge) {
          state.eggStocks = { ...cloudData.eggStocks };
        } else {
          // Fusion additive par événement : Base Cloud + Récoltes Offline - Ventes Offline
          const allSpecies = new Set([
            ...Object.keys(state.eggStocks),
            ...Object.keys(cloudData.eggStocks),
            ...Object.keys(offlineHarvestBySpecies)
          ]);
          allSpecies.forEach(sp => {
            const cloudVal = Number(cloudData.eggStocks[sp]) || 0;
            const localVal = Number(state.eggStocks[sp]) || 0;
            const offlineAdded = Number(offlineHarvestBySpecies[sp]) || 0;
            const incomingAdded = Number(incomingHarvestBySpecies[sp]) || 0;
            const offlineSold = Number(offlineEggSalesBySpecies[sp]) || 0;
            const incomingSold = Number(incomingEggSalesBySpecies[sp]) || 0;

            if (offlineAdded > 0 || offlineSold > 0 || incomingAdded > 0 || incomingSold > 0) {
              if (offlineAdded > 0 && incomingAdded > 0) {
                // Concurrence bidirectionnelle : Base Cloud + Récoltes Offline locales - Ventes locales
                state.eggStocks[sp] = Math.max(0, cloudVal + offlineAdded - offlineSold);
              } else if (offlineAdded > 0 || offlineSold > 0) {
                // Actions locales faites hors-ligne (récoltes, ventes ou consommations) :
                if (localLastEdit >= cloudLastUpdated && localLastEdit > 0) {
                  state.eggStocks[sp] = localVal;
                } else {
                  state.eggStocks[sp] = Math.max(0, cloudVal + offlineAdded - offlineSold);
                }
              } else if (incomingAdded > 0 || incomingSold > 0) {
                // Nouvelles récoltes ou déductions distantes arrivées de l'associé : appliquées au stock local
                state.eggStocks[sp] = Math.max(0, localVal + incomingAdded - incomingSold);
              }
            } else if (isCloudFresher) {
              // Si le Cloud a 0 mais que le local a du stock valide et aucune déduction, préserver le stock légitime
              state.eggStocks[sp] = (cloudVal === 0 && localVal > 0 && offlineSold === 0) ? localVal : cloudVal;
            } else {
              // Si localLastEdit >= cloudLastUpdated mais localVal est 0 et cloudVal > 0 sans vente locale : préserver cloudVal !
              state.eggStocks[sp] = (localVal === 0 && cloudVal > 0 && offlineSold === 0) ? cloudVal : ((localLastEdit >= cloudLastUpdated && localLastEdit > 0) ? localVal : cloudVal);
            }
          });
        }
      } else if (cloudData.eggStock !== undefined) {
        const cloudEggs = Number(cloudData.eggStock) || 0;
        const offlineAdded = Number(offlineHarvestBySpecies['poule']) || 0;
        const offlineSold = Number(offlineEggSalesBySpecies['poule']) || 0;
        if (!effectiveDoMerge) {
          state.eggStocks.poule = cloudEggs;
        } else if (offlineAdded > 0 || offlineSold > 0) {
          if (localLastEdit >= cloudLastUpdated && localLastEdit > 0) {
            state.eggStocks.poule = Number(state.eggStocks.poule) || 0;
          } else {
            state.eggStocks.poule = Math.max(0, cloudEggs + offlineAdded - offlineSold);
          }
        } else if (isCloudFresher) {
          state.eggStocks.poule = (cloudEggs === 0 && (Number(state.eggStocks.poule) || 0) > 0 && offlineSold === 0) ? (Number(state.eggStocks.poule) || 0) : cloudEggs;
        } else {
          const localEggs = Number(state.eggStocks.poule) || Number(state.eggStock) || 0;
          state.eggStocks.poule = (localEggs === 0 && cloudEggs > 0 && offlineSold === 0) ? cloudEggs : ((localLastEdit >= cloudLastUpdated && localLastEdit > 0) ? localEggs : cloudEggs);
        }
      }

      // Purger immédiatement toute catégorie supprimée
      state.deletedEggCategories.forEach(delCat => {
        if (delCat !== 'poule' && state.eggStocks && state.eggStocks[delCat] !== undefined) {
          delete state.eggStocks[delCat];
        }
      });
      // Réconcilier le total eggStock agrégé (un stock de 0 est 100% valide et ne doit JAMAIS être réécrasé par l'historique)
      state.eggStock = Object.values(state.eggStocks).reduce((sum, v) => sum + (Number(v) || 0), 0);

      if (cloudData.milkStock !== undefined) {
        const cloudMilk = Number(cloudData.milkStock) || 0;
        const localMilk = Number(state.milkStock) || 0;
        state.milkStock = isCloudFresher ? cloudMilk : ((localLastEdit >= cloudLastUpdated && localLastEdit > 0) ? localMilk : cloudMilk);
      }
      const now = Date.now();
      const cloudBaseTs = Number(cloudData.lastUpdated) || (now - 10000);
      // Nettoyer tout timestamp dans le futur (utiliser l'horodatage réel passé de cloudData)
      if (Number(cloudData.feedStockUpdatedAt) > now + 1000) {
        cloudData.feedStockUpdatedAt = cloudBaseTs;
      }
      if (Array.isArray(cloudData.feedTypes)) {
        cloudData.feedTypes.forEach(f => {
          if (Number(f.updatedAt) > now + 1000) f.updatedAt = cloudBaseTs;
        });
      }
      if (Number(state.feedStockUpdatedAt) > now + 1000) {
        state.feedStockUpdatedAt = now;
      }
      if (Array.isArray(state.feedTypes)) {
        state.feedTypes.forEach(f => {
          if (Number(f.updatedAt) > now + 1000) f.updatedAt = now;
        });
      }

      if (cloudData.feedStockKg !== undefined) {
        // Ne JAMAIS utiliser cloudData.lastUpdated comme fallback pour feedStockUpdatedAt :
        // lastUpdated change à chaque enregistrement d'œufs/dépenses et provoquait l'écrasement intempestif du stock.
        const cloudTs = Number(cloudData.feedStockUpdatedAt) || 0;
        const localTs = Number(state.feedStockUpdatedAt) || 0;
        const cloudStock = cloudData.feedStockKg !== null ? Number(cloudData.feedStockKg) : null;
        const cloudDistIds = new Set((cloudData.feedDistributions || []).map(d => d && d.id).filter(Boolean));
        const localOfflineDists = (state.feedDistributions || []).filter(d => d && d.id && !cloudDistIds.has(d.id));
        const offlineFeedDeductedKg = localOfflineDists.reduce((s, d) => s + (Number(d.totalKg) || Number(d.kg) || 0), 0);

        const shouldAcceptCloud = !effectiveDoMerge || isCloudFresher || (cloudTs > localTs && cloudStock !== null);
        if (shouldAcceptCloud) {
          const finalCloudStock = (cloudStock !== null && cloudStock >= 0) ? Math.max(0, cloudStock - offlineFeedDeductedKg) : (Number(state.feedStockKg) || 0);
          state.feedStockKg = finalCloudStock;
          state.feedStockDate = cloudData.feedStockDate || null;
          state.feedStockCostPerKg = cloudData.feedStockCostPerKg ? Number(cloudData.feedStockCostPerKg) : 1.0;
          state.feedStockUpdatedAt = cloudTs;
        }
      }
      state.customDailyFeedKg = null;
      state.sicamCansCount = null;

      if (effectiveDoMerge) {
        // Réconciliation différentielle des distributions multi-appareils (Event Sourcing)
        if (Array.isArray(cloudData.feedDistributions) && Array.isArray(state.feedDistributions)) {
          const localDistribIds = new Set(state.feedDistributions.map(d => String(d.id)));
          const incomingNewDistribs = cloudData.feedDistributions.filter(d => d && d.id && !localDistribIds.has(String(d.id)));
          
          if (incomingNewDistribs.length > 0 && Array.isArray(state.feedTypes)) {
            incomingNewDistribs.forEach(dist => {
              if (Array.isArray(dist.items)) {
                dist.items.forEach(it => {
                  const targetFt = state.feedTypes.find(f => f && (f.id === it.feedTypeId || (f.name && it.name && f.name.trim().toLowerCase() === it.name.trim().toLowerCase())));
                  if (targetFt && Number(targetFt.stockKg) > 0) {
                    const deductKg = Number(it.kg) || 0;
                    targetFt.stockKg = Math.max(0, parseFloat((Number(targetFt.stockKg) - deductKg).toFixed(2)));
                    targetFt.updatedAt = Date.now();
                  }
                });
              }
            });
          }
        }

        state.animals = this.mergeCollections(state.animals, cloudData.animals || []);
        state.expenses = this.mergeCollections(state.expenses, cloudData.expenses || []);
        state.sales = this.mergeCollections(state.sales, cloudData.sales || []);
        state.incubatorBatches = this.mergeCollections(state.incubatorBatches, cloudData.incubatorBatches || []);
        state.eggHarvests = this.mergeCollections(state.eggHarvests, cloudData.eggHarvests || []);
        state.eggConsumptions = this.mergeCollections(state.eggConsumptions || [], cloudData.eggConsumptions || []);
        state.milkHarvests = this.mergeCollections(state.milkHarvests, cloudData.milkHarvests || []);
        state.calendarEvents = this.mergeCollections(state.calendarEvents, cloudData.calendarEvents || []);
        state.feedDistributions = this.mergeCollections(state.feedDistributions, cloudData.feedDistributions || []);
        state.feedTypes = this.mergeCollections(state.feedTypes, cloudData.feedTypes || []);
      } else {
        if (Array.isArray(cloudData.animals)) state.animals = cloudData.animals;
        if (Array.isArray(cloudData.expenses)) state.expenses = cloudData.expenses;
        if (Array.isArray(cloudData.sales)) state.sales = cloudData.sales;
        if (Array.isArray(cloudData.incubatorBatches)) state.incubatorBatches = cloudData.incubatorBatches;
        if (Array.isArray(cloudData.eggHarvests)) state.eggHarvests = cloudData.eggHarvests;
        if (Array.isArray(cloudData.eggConsumptions)) state.eggConsumptions = cloudData.eggConsumptions;
        if (Array.isArray(cloudData.milkHarvests)) state.milkHarvests = cloudData.milkHarvests;
        if (Array.isArray(cloudData.feedDistributions)) state.feedDistributions = cloudData.feedDistributions;
        if (Array.isArray(cloudData.feedTypes)) state.feedTypes = cloudData.feedTypes;
      }

      // Double-entry accounting reconciliation safety net for eggs:
      // If harvests exist, ensure eggStocks accurately reflects the true balance (Harvests - Deductions)
      if (Array.isArray(state.eggHarvests) && state.eggHarvests.length > 0) {
        const stockBySp = { poule: 0, canard_barbarie: 0 };
        state.eggHarvests.forEach(h => {
          if (!h) return;
          const sp = (h.species === 'canard' || h.species === 'canard_barbarie') ? 'canard_barbarie' : (h.species || 'poule');
          stockBySp[sp] = (stockBySp[sp] || 0) + (Number(h.count) || 0);
        });
        (state.sales || []).forEach(s => {
          if (!s || s.productType !== 'oeufs') return;
          const sp = s.eggSpecies || s.species || 'poule';
          let qty = Number(s.quantity) || 0;
          if (s.format === 'hara') qty *= 4;
          else if (s.format === 'plateau') qty *= 30;
          stockBySp[sp] = (stockBySp[sp] || 0) - qty;
        });
        (state.eggConsumptions || []).forEach(c => {
          if (!c) return;
          const sp = c.species || 'poule';
          stockBySp[sp] = (stockBySp[sp] || 0) - (Number(c.count) || 0);
        });
        (state.incubatorBatches || []).forEach(b => {
          if (!b || b.eggSource !== 'farm') return;
          const sp = (b.eggType === 'canard' || b.species === 'canard') ? 'canard_barbarie' : (b.eggType || b.species || 'poule');
          stockBySp[sp] = (stockBySp[sp] || 0) - (Number(b.eggsCount) || 0);
        });
        Object.keys(stockBySp).forEach(sp => {
          stockBySp[sp] = Math.max(0, stockBySp[sp] || 0);
          const hasOfflineDeductions = (offlineEggSalesBySpecies[sp] || 0) > 0;
          if (!state.eggStocks) state.eggStocks = {};
          if (!hasOfflineDeductions && !state._resetCleared && stockBySp[sp] > 0 && ((Number(state.eggStocks[sp]) || 0) === 0 || (Number(state.eggStocks[sp]) || 0) < stockBySp[sp])) {
            state.eggStocks[sp] = stockBySp[sp];
          }
        });
        (state.deletedEggCategories || []).forEach(delCat => {
          if (delCat !== 'poule' && state.eggStocks && state.eggStocks[delCat] !== undefined) {
            delete state.eggStocks[delCat];
          }
        });
        state.eggStock = Object.values(state.eggStocks || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);
      }

      // Keep feedTypes clean, modernized, and in strict parity with total warehouse stock
      if (Array.isArray(state.feedTypes)) {
        const deletedIds = this.getDeletedIds();
        state.feedTypes = state.feedTypes.map(ft => {
          if (!ft) return null;
          let id = String(ft.id || '');
          let name = String(ft.name || '');
          if (id === 'feed-principal' || name.toLowerCase().includes('principal') || name.includes('علف رئيسي')) {
            if (id === 'feed-principal') id = 'feed-complet-' + Math.random().toString(36).substr(2, 6);
            name = name.replace(/aliment\s+principal/i, 'Aliment complet').replace(/principal/gi, 'complet').replace(/علف\s+رئيسي/g, 'علف مركب').replace(/رئيسي/g, 'مركب').trim() || 'Aliment complet';
            ft.id = id;
            ft.name = name;
          }
          return ft;
        }).filter(ft => ft && !deletedIds.has(String(ft.id)));

        // Déduplication canonique par nom propre normalisé (élimination des fantômes)
        const canonicalFeedMap = new Map();
        state.feedTypes.forEach(ft => {
          const normKey = (ft.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
          if (!normKey) return;
          if (!canonicalFeedMap.has(normKey)) {
            canonicalFeedMap.set(normKey, { ...ft });
          } else {
            const existing = canonicalFeedMap.get(normKey);
            const existingStock = Number(existing.stockKg) || 0;
            const currentStock = Number(ft.stockKg) || 0;
            if (currentStock > 0 && existingStock === 0) {
              existing.id = ft.id;
              existing.name = ft.name;
            }
            existing.stockKg = parseFloat((existingStock + currentStock).toFixed(2));
            if ((!existing.pricePerKg || Number(existing.pricePerKg) === 0) && Number(ft.pricePerKg) > 0) {
              existing.pricePerKg = Number(ft.pricePerKg);
            }
            existing.updatedAt = Math.max(Number(existing.updatedAt) || 0, Number(ft.updatedAt) || 0);
          }
        });
        state.feedTypes = Array.from(canonicalFeedMap.values());

        const calculatedFeedStock = state.feedTypes.reduce((sum, ft) => sum + (Number(ft.stockKg) || 0), 0);

        if (state.feedTypes.length === 0) {
          const globalStockToReconcile = Math.max(
            0,
            Number(cloudData.feedStockKg) > 0 ? Number(cloudData.feedStockKg) : (Number(state.feedStockKg) || 0)
          );
          if (globalStockToReconcile > 0) {
            state.feedStockKg = globalStockToReconcile;
            const defaultName = (state.lang === 'ar') ? 'علف مركب' : 'Aliment complet';
            const defaultPrice = Number(cloudData.feedStockCostPerKg) > 0 ? Number(cloudData.feedStockCostPerKg) : (Number(state.feedStockCostPerKg) || 1.2);
            state.feedTypes = [{
              id: 'feed-stock-' + Date.now().toString(36),
              name: defaultName,
              stockKg: state.feedStockKg,
              pricePerKg: defaultPrice,
              texture: 'grain',
              kgPerCan: 0.70,
              manuallyAdjusted: true,
              updatedAt: Date.now()
            }];
            state.feedStockCostPerKg = defaultPrice;
          } else {
            state.feedStockKg = 0;
          }
        } else {
          // Des aliments existent dans state.feedTypes
          const isPristineMigration = calculatedFeedStock === 0 && 
            (Number(cloudData.feedStockKg) > 0 || Number(state.feedStockKg) > 0) &&
            state.feedTypes.every(f => !f.updatedAt && !f.manuallyAdjusted && !f.isClosed);
          
          if (isPristineMigration) {
            const globalStockToReconcile = Math.max(0, Number(cloudData.feedStockKg) > 0 ? Number(cloudData.feedStockKg) : Number(state.feedStockKg));
            if (state.feedTypes.length === 1) {
              state.feedTypes[0].stockKg = globalStockToReconcile;
              state.feedTypes[0].isClosed = false;
              state.feedTypes[0].updatedAt = Date.now();
            } else {
              const perFeed = Math.round((globalStockToReconcile / state.feedTypes.length) * 10) / 10;
              let runningTotal = 0;
              state.feedTypes.forEach((f, idx) => {
                f.isClosed = false;
                if (idx === state.feedTypes.length - 1) {
                  f.stockKg = Math.max(0, Math.round((globalStockToReconcile - runningTotal) * 10) / 10);
                } else {
                  f.stockKg = perFeed;
                  runningTotal += perFeed;
                }
                f.updatedAt = Date.now();
              });
            }
            state.feedStockKg = globalStockToReconcile;
          } else {
            // Le stock global est exactement égal à la somme des aliments (même si 0 kg)
            state.feedStockKg = parseFloat(calculatedFeedStock.toFixed(2));
          }
        }
      }

      // Preserve animal species
      state.animals = Array.isArray(state.animals) ? state.animals : [];
      if (state.userProfile && state.userProfile.managedAnimals) {
        state.userProfile.managedAnimals = this.normalizeAnimalTypes(state.userProfile.managedAnimals);
      }

      // Synchroniser impérativement le code de ferme avec la valeur canonique du Cloud
      if (cloudData.farmCode) {
        localStorage.setItem('fermegest_farm_code', cloudData.farmCode);
      }
      if (cloudData.farmRole) {
        localStorage.setItem('fermegest_farm_role', cloudData.farmRole);
      }
      if (cloudData.ownerEmail) {
        localStorage.setItem('fermegest_farm_owner_email', cloudData.ownerEmail);
      }

      // Sync window.appState
      if (window.appState) {
        window.appState.lastUpdated = state.lastUpdated;
        window.appState.userProfile = state.userProfile;
        window.appState.currency = state.currency;
        window.appState.lang = state.lang;
        window.appState.theme = state.theme;
        window.appState.eggStock = state.eggStock;
        window.appState.eggStocks = state.eggStocks ? { ...state.eggStocks } : { poule: state.eggStock, canard_barbarie: 0 };
        window.appState.deletedEggCategories = state.deletedEggCategories;
        window.appState.milkStock = state.milkStock;
        window.appState.milkHarvests = state.milkHarvests;
        window.appState.eggHarvests = state.eggHarvests;
        window.appState.eggConsumptions = state.eggConsumptions;
        window.appState.feedStockKg = state.feedStockKg;
        window.appState.feedStockDate = state.feedStockDate;
        window.appState.feedStockCostPerKg = state.feedStockCostPerKg;
        window.appState.feedRationMode = state.feedRationMode;
        window.appState.customDailyFeedKg = state.customDailyFeedKg;
        window.appState.sicamCansCount = state.sicamCansCount;
        window.appState.feedDistributions = state.feedDistributions;
        window.appState.feedTypes = state.feedTypes;
        window.appState.animals = state.animals;
        window.appState.expenses = state.expenses;
        window.appState.sales = state.sales;
        window.appState.incubatorBatches = state.incubatorBatches;
        window.appState.calendarEvents = state.calendarEvents;
        window.appState.lastResetAt = state.lastResetAt || null;
        window.appState._resetCleared = !!state._resetCleared;
      }

      // Persist to local device storage as well (offline fallback)
      try {
        const serialized = JSON.stringify({
          version: '2.5.0-pro',
          lastUpdated: state.lastUpdated,
          currency: state.currency,
          lang: state.lang,
          theme: state.theme,
          userProfile: state.userProfile,
          eggStock: state.eggStock,
          eggStocks: state.eggStocks,
          deletedEggCategories: state.deletedEggCategories,
          milkStock: state.milkStock,
          milkHarvests: state.milkHarvests,
          eggHarvests: state.eggHarvests,
          eggConsumptions: state.eggConsumptions,
          feedStockKg: state.feedStockKg,
          feedStockDate: state.feedStockDate,
          feedStockCostPerKg: state.feedStockCostPerKg,
          feedRationMode: state.feedRationMode,
          customDailyFeedKg: state.customDailyFeedKg,
          sicamCansCount: state.sicamCansCount,
          feedDistributions: state.feedDistributions,
          feedTypes: state.feedTypes,
          animals: state.animals,
          expenses: state.expenses,
          sales: state.sales,
          incubatorBatches: state.incubatorBatches,
          calendarEvents: state.calendarEvents,
          lastResetAt: state.lastResetAt || null,
          _resetCleared: !!state._resetCleared
        });
        localStorage.setItem('fermegest_state', serialized);
        // PROTECTION CRITIQUE : NE JAMAIS ÉCRASER fermegest_state_backup lors d'une synchro Cloud !
        // fermegest_state_backup est strictement réservé aux saisies manuelles directes de l'utilisateur sur son appareil.
        localStorage.setItem('fermegest_cloud_snapshot', serialized);
      } catch (e) {}

      if (window.app) {
        if (typeof window.app.reconcileFeedTypesFromExpenses === 'function') window.app.reconcileFeedTypesFromExpenses();
        if (typeof window.app.renderEggStock === 'function') window.app.renderEggStock();
        if (typeof window.app.renderEggProductionChart === 'function') window.app.renderEggProductionChart();
        if (typeof window.app.renderFarmFeedSummary === 'function') window.app.renderFarmFeedSummary();
        if (typeof window.app.updateCurrencySymbols === 'function') window.app.updateCurrencySymbols();
        if (typeof window.app.updateUserHeaderUI === 'function') window.app.updateUserHeaderUI();
        if (typeof window.app.updateLivestockUIThemeAndVisibility === 'function') window.app.updateLivestockUIThemeAndVisibility();
        if (typeof window.app.closeModal === 'function') {
          window.app.closeModal('modalOnboarding');
          window.app.closeModal('modalAnimalSelection');
          window.app.closeModal('modalAuthPrompt');
          window.app.closeModal('modalAuth');
        }
        if (typeof window.app.renderAll === 'function') window.app.renderAll();
      }
    },

    // 8b. Force Fresh Pull from Cloud (Directly adopt owner's state on partner's phone)
    async forcePullFromCloud(showToast = true) {
      if (!this.client || !this.currentUser) {
        if (showToast && window.app && app.showToast) app.showToast('Veuillez vous connecter.');
        return;
      }
      const farmCode = this.getFarmCode();
      if (!farmCode) {
        if (showToast && window.app && app.showToast) app.showToast('Aucun code de ferme configuré.');
        return;
      }
      this.isSyncing = true;
      this.updateSyncBadge('syncing');

      try {
        // 1. Vérifier si notre propre ligne en base existe sans écraser les données distantes
        const { data: existingOwn } = await this.client
          .from('user_farms')
          .select('data, updated_at, user_id')
          .eq('user_id', this.currentUser.id)
          .maybeSingle();

        if (!existingOwn) {
          await this.client.from('user_farms').upsert({
            user_id: this.currentUser.id,
            data: {
              farmCode: farmCode,
              farmRole: this.getFarmRole()
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        }

        // 2. Récupérer toutes les lignes associées à ce code de ferme
        const { data, error } = await this.client
          .from('user_farms')
          .select('data, updated_at, user_id')
          .contains('data', { farmCode: farmCode })
          .order('updated_at', { ascending: true });

        if (error) throw error;

        if (Array.isArray(data) && data.length > 0) {
          // Trouver la ligne de l'autre compte (ex: le propriétaire de la ferme)
          const otherRows = data.filter(r => r.user_id !== this.currentUser.id && r.data);
          const targetRow = otherRows.find(r => r.data && r.data.farmRole === 'owner') || otherRows[otherRows.length - 1] || data[0];

          if (targetRow && targetRow.data) {
            console.log('[ForcePull] Application directe des données du compte :', targetRow.user_id);
            this.applyCloudData(targetRow.data, false);
            this.lastSyncedAt = new Date();
            this.updateUI();
            if (window.app && typeof app.renderAll === 'function') app.renderAll();
            if (showToast && window.app && app.showToast) {
              const lang = (window.appState && appState.lang) || 'fr';
              const msg = lang === 'ar'
                ? '✅ تم تحديث بيانات المزرعة بنجاح من الحساب المرتبط !'
                : '✅ Ferme synchronisée avec succès depuis le compte associé !';
              app.showToast(msg);
            }
          }
        } else {
          if (showToast && window.app && app.showToast) {
            app.showToast('ℹ️ Aucune donnée trouvée sur le Cloud pour ce code.');
          }
        }
      } catch (err) {
        console.error('[ForcePull] Erreur :', err);
        if (showToast && window.app && app.showToast) {
          app.showToast('Erreur de synchronisation : ' + (err.message || err), 'danger');
        }
      } finally {
        this.isSyncing = false;
        this.updateSyncBadge('online');
      }
    },

    // 9. UI Updates (Header, Drawer, Modals)
    updateUI() {
      const headerAuthBtn = document.getElementById('headerAuthBtn');
      const headerUserChip = document.getElementById('headerUserChip');
      const headerUserText = document.getElementById('headerUserText');
      const drawerAuthSection = document.getElementById('drawerAuthSection');

      const isAuth = !!this.currentUser;
      const profile = (window.appState && window.appState.userProfile) || (function() {
        try { return JSON.parse(localStorage.getItem('fermegest_user_profile') || 'null'); } catch(e) { return null; }
      })();

      const email = this.currentUser ? (this.currentUser.email || 'Utilisateur') : '';
      const farmerName = profile ? profile.name : (email ? email.split('@')[0] : 'Éleveur');
      const avatarId = profile ? (profile.avatar || 'avatar-m1') : 'avatar-m1';
      const initial = email ? email[0].toUpperCase() : '👤';
      const hasAvatar = typeof window.AppAvatars !== 'undefined';
      const avatarSvgSmall = hasAvatar ? window.AppAvatars.getSvg(avatarId, 32) : initial;

      if (headerAuthBtn) {
        headerAuthBtn.style.display = isAuth ? 'none' : 'inline-flex';
      }
      if (headerUserChip) {
        headerUserChip.style.display = isAuth ? 'inline-flex' : 'none';
        if (headerUserText) {
          headerUserText.textContent = farmerName;
        }
        const initialEl = document.getElementById('headerUserInitial');
        if (initialEl) {
          if (hasAvatar) {
            initialEl.innerHTML = window.AppAvatars.getSvg(avatarId, 28);
          } else {
            initialEl.textContent = initial;
          }
        }
      }

      // Mobile header profile button update
      const mobileUserInitial = document.getElementById('mobileUserInitial');
      const mobileUserSyncDot = document.getElementById('mobileUserSyncDot');
      const mobileHeaderUserBtn = document.getElementById('mobileHeaderUserBtn');

      if (mobileUserInitial) {
        if (hasAvatar) {
          mobileUserInitial.innerHTML = window.AppAvatars.getSvg(avatarId, 32);
        } else {
          mobileUserInitial.textContent = isAuth ? initial : '👤';
        }
      }
      if (mobileUserSyncDot) {
        mobileUserSyncDot.style.display = isAuth ? 'block' : 'none';
      }
      if (mobileHeaderUserBtn) {
        mobileHeaderUserBtn.title = isAuth ? `${farmerName} (${email})` : `${farmerName} (Mode Invité)`;
        if (isAuth) {
          mobileHeaderUserBtn.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1))';
          mobileHeaderUserBtn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        } else {
          mobileHeaderUserBtn.style.background = 'var(--bg-surface)';
          mobileHeaderUserBtn.style.borderColor = 'var(--border-color)';
        }
      }

      if (drawerAuthSection) {
        if (isAuth) {
          const role = this.getFarmRole();
          const roleText = role === 'partner' ? '🤝 Associé' : '👑 Propriétaire';
          drawerAuthSection.innerHTML = `
            <div class="drawer-user-card" onclick="if(window.app && app.closeMobileMenu) app.closeMobileMenu(); appAuth.openProfileModal();">
              <div class="user-avatar" style="width:42px; height:42px; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center;">${avatarSvgSmall}</div>
              <div class="user-details">
                <span class="user-email-text" style="font-weight:700;">${farmerName}</span>
                <span class="user-sync-status">🟢 En ligne &bull; ${roleText}</span>
              </div>
            </div>
          `;
        } else {
          drawerAuthSection.innerHTML = `
            <div class="drawer-user-card" onclick="if(window.app && app.closeMobileMenu) app.closeMobileMenu(); appAuth.openProfileModal();">
              <div class="user-avatar" style="width:42px; height:42px; border-radius:50%; overflow:hidden; display:flex; align-items:center; justify-content:center;">${avatarSvgSmall}</div>
              <div class="user-details">
                <span class="user-email-text" style="font-weight:700;">${farmerName}</span>
                <span class="user-sync-status" style="color: #f59e0b; font-size:0.75rem;">⚠️ Mode Invité &bull; Non sauvegardé</span>
              </div>
            </div>
            <button type="button" class="btn btn-primary btn-full drawer-btn" style="margin-top: 8px;" onclick="if(window.app && app.closeMobileMenu) app.closeMobileMenu(); app.openAuthPromptModal();">
              <span>☁️</span>
              <span>Sauvegarder dans le Cloud</span>
            </button>
          `;
        }
      }
    },

    updateSyncBadge(status) {
      const dot = document.getElementById('userSyncDot');
      if (dot) dot.className = 'user-status-dot ' + (status || 'online');
      const mobileDot = document.getElementById('mobileUserSyncDot');
      if (mobileDot) mobileDot.className = 'mobile-sync-dot ' + (status || 'online');
    },

    authMode: 'login',

    switchTab(mode) {
      this.authMode = mode;
      const tabLogin = document.getElementById('authTabLogin');
      const tabSignup = document.getElementById('authTabSignup');
      const submitText = document.getElementById('authSubmitText');
      const errBox = document.getElementById('authErrorMessage');
      if (errBox) errBox.classList.add('hidden');

      if (mode === 'signup') {
        if (tabSignup) tabSignup.classList.add('active');
        if (tabLogin) tabLogin.classList.remove('active');
        if (submitText) submitText.textContent = (window.app && app.t) ? app.t('auth_tab_signup') : 'Créer un Compte';
      } else {
        if (tabLogin) tabLogin.classList.add('active');
        if (tabSignup) tabSignup.classList.remove('active');
        if (submitText) submitText.textContent = (window.app && app.t) ? app.t('auth_tab_login') : 'Connexion';
      }
    },

    async handleSubmit(e) {
      if (e && e.preventDefault) e.preventDefault();
      const emailInput = document.getElementById('authEmailInput');
      const passInput = document.getElementById('authPasswordInput');
      if (!emailInput || !passInput) return;

      const email = emailInput.value.trim();
      const password = passInput.value;

      if (!email || !password) return;

      if (this.authMode === 'signup') {
        await this.signUpWithEmail(email, password);
      } else {
        await this.signInWithEmail(email, password);
      }
    },

    // Team & Shared Farm methods (2 Accounts Collaboration)
    getFarmCode() {
      let code = localStorage.getItem('fermegest_farm_code');
      if (!code) {
        // Check backup first before generating a random new code
        try {
          const raw = localStorage.getItem('fermegest_state') || localStorage.getItem('fermegest_state_backup');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.farmCode) {
              code = parsed.farmCode;
              localStorage.setItem('fermegest_farm_code', code);
              if (parsed.farmRole) localStorage.setItem('fermegest_farm_role', parsed.farmRole);
            }
          }
        } catch (e) {}
      }
      if (!code) {
        code = this.generateFarmCode();
        localStorage.setItem('fermegest_farm_code', code);
      }
      return code;
    },

    generateFarmCode() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let rand = '';
      for (let i = 0; i < 4; i++) {
        rand += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return 'FERME-' + rand;
    },

    getFarmRole() {
      return localStorage.getItem('fermegest_farm_role') || 'owner';
    },

    getFarmOwnerEmail() {
      return localStorage.getItem('fermegest_farm_owner_email') || (this.currentUser ? this.currentUser.email : '');
    },

    copyFarmCode() {
      const code = this.getFarmCode();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
          if (window.app && app.showToast) {
            app.showToast((window.app && app.t) ? app.t('team_toast_code_copied') : 'Code copié dans le presse-papier !');
          }
        }).catch(() => this.fallbackCopy(code));
      } else {
        this.fallbackCopy(code);
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
        if (window.app && app.showToast) {
          app.showToast((window.app && app.t) ? app.t('team_toast_code_copied') : 'Code copié dans le presse-papier !');
        }
      } catch (e) {}
      document.body.removeChild(ta);
    },

    shareFarmInvite() {
      const code = this.getFarmCode();
      const joinUrl = `https://fermegestpro.vercel.app/?join=${encodeURIComponent(code)}`;
      const apkUrl = 'https://fermegestpro.vercel.app/FermeGestPro.apk';
      const webUrl = 'https://fermegestpro.vercel.app';
      const lang = (window.appState && window.appState.lang) || 'fr';

      let title = '🌾 Invitation FermeGest Pro';
      let inviteMsg = '';

      if (lang === 'ar') {
        title = '🌾 دعوة للانضمام إلى مزرعة مشتركة - FermeGest Pro';
        inviteMsg = `🌾 مرحباً! أدعوك لمشاركتي إدارة المزرعة على تطبيق FermeGest Pro.\n\n🔑 رمز المزرعة الخاص بنا: ${code}\n\n📲 اضغط هنا للانضمام بضغطة واحدة:\n${joinUrl}\n\n📥 لتحميل تطبيق الأندرويد (APK):\n${apkUrl}\n\n🌐 أو افتح التطبيق في المتصفح:\n${webUrl}`;
      } else if (lang === 'en') {
        title = '🌾 FermeGest Pro - Shared Farm Invitation';
        inviteMsg = `🌾 Hello! Join our farm management on FermeGest Pro.\n\n🔑 Farm Code: ${code}\n\n📲 One-click Join Link:\n${joinUrl}\n\n📥 Download Android App (APK):\n${apkUrl}\n\n🌐 Or open on the web:\n${webUrl}`;
      } else {
        inviteMsg = `🌾 Salut ! Rejoins la gestion de notre élevage sur FermeGest Pro.\n\n🔑 Code de notre ferme : ${code}\n\n📲 Rejoindre en un clic :\n${joinUrl}\n\n📥 Télécharger l'application Android (APK) :\n${apkUrl}\n\n🌐 Ou ouvrir sur le web :\n${webUrl}`;
      }

      if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('Share')) {
        try {
          window.Capacitor.Plugins.Share.share({
            title: title,
            text: inviteMsg,
            url: joinUrl,
            dialogTitle: title
          });
          return;
        } catch (e) {}
      }

      if (navigator.share) {
        navigator.share({
          title: title,
          text: inviteMsg,
          url: joinUrl
        }).catch(() => {
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMsg)}`, '_blank');
        });
      } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMsg)}`, '_blank');
      }
    },

    async handleDeepLinkJoin(code) {
      if (!code) return;
      code = code.trim().toUpperCase().replace(/\s+/g, '');
      if (!code.startsWith('FERME-')) code = 'FERME-' + code;

      const currentCode = this.getFarmCode();
      if (currentCode === code && this.getFarmRole() === 'partner') {
        if (window.app && app.showToast) {
          app.showToast(`🌾 Vous êtes déjà connecté à la ferme ${code} !`, 'info');
        }
        return;
      }

      this.openProfileModal();
      const input = document.getElementById('teamJoinCodeInput');
      if (input) input.value = code;

      const isAr = (window.appState && window.appState.lang) === 'ar';
      const isEn = (window.appState && window.appState.lang) === 'en';

      const promptTitle = isAr ? '🌾 الانضمام إلى مزرعة مشتركة' : (isEn ? '🌾 Join Shared Farm' : '🌾 Rejoindre la Ferme Partagée');
      const promptMsg = isAr 
        ? `تمت دعوتك للانضمام إلى المزرعة برمز: <strong>${code}</strong>.<br><br>هل تريد استقبال ومزامنة بيانات هذه المزرعة؟`
        : (isEn 
            ? `You have been invited to join the farm with code: <strong>${code}</strong>.<br><br>Do you want to adopt and synchronize with this farm's data?`
            : `Vous avez été invité à rejoindre la ferme avec le code : <strong>${code}</strong>.<br><br>Voulez-vous synchroniser et adopter les données de cette ferme ?`);

      let confirm = false;
      if (window.app && typeof app.confirmDialog === 'function') {
        confirm = await app.confirmDialog({
          title: promptTitle,
          message: promptMsg,
          confirmText: isAr ? 'انضمام للمزرعة' : (isEn ? 'Join Farm' : 'Rejoindre la ferme'),
          cancelText: isAr ? 'إلغاء' : (isEn ? 'Cancel' : 'Annuler'),
          type: 'primary'
        });
      } else {
        confirm = window.confirm(promptMsg.replace(/<[^>]+>/g, ''));
      }

      if (confirm) {
        await this.joinFarmWithCode(code);
      }
    },

    async joinFarmWithCode(rawCode = null) {
      const input = document.getElementById('teamJoinCodeInput');
      let code = (rawCode || (input ? input.value : '')).trim().toUpperCase().replace(/\s+/g, '');
      if (!code) {
        if (window.app && app.showToast) app.showToast('Veuillez entrer un code de ferme valide.');
        return false;
      }
      if (!code.startsWith('FERME-')) {
        code = 'FERME-' + code;
      }

      if (!this.client) {
        if (window.app && app.showToast) app.showToast('Erreur: Connexion réseau ou service indisponible.');
        return false;
      }

      this.updateSyncBadge('syncing');

      try {
        // 1. RECHERCHE CLOUD DE LA FERME AVANT TOUTE MODIFICATION LOCALE OU DISTANTE
        const { data: farmRows, error: searchErr } = await this.client
          .from('user_farms')
          .select('user_id, data, updated_at')
          .contains('data', { farmCode: code });

        if (searchErr || !Array.isArray(farmRows) || farmRows.length === 0) {
          console.warn('[JoinFarm] Code de ferme introuvable :', code, searchErr);
          this.updateSyncBadge('connected');
          if (window.app && app.showToast) {
            app.showToast('❌ Code de ferme introuvable. Demandez le code exact au propriétaire.', 'danger');
          }
          return false;
        }

        // 2. EXTRACTION DU PROPRIÉTAIRE CANONIQUE DE LA FERME
        const ownerRow = farmRows.find(r => r.data && (r.data.farmRole === 'owner' || !r.data.farmRole)) || farmRows[0];
        if (!ownerRow || !ownerRow.data || typeof ownerRow.data !== 'object') {
          this.updateSyncBadge('connected');
          if (window.app && app.showToast) {
            app.showToast('❌ Données de la ferme propriétaire indisponibles ou vides.', 'danger');
          }
          return false;
        }

        const ownerData = ownerRow.data;
        const ownerEmail = ownerData.ownerEmail || ownerData.email || 'Propriétaire';

        // 3. ADOPTION SOUVERAINE : L'INVITÉ REÇOIT 100% DES DONNÉES DU PROPRIÉTAIRE (doMerge = false)
        this.applyCloudData(ownerData, false);

        // 4. VERROUILLAGE DES MÉTADONNÉES LOCALES
        localStorage.setItem('fermegest_farm_code', code);
        localStorage.setItem('fermegest_farm_role', 'partner');
        localStorage.setItem('fermegest_farm_owner_email', ownerEmail);
        localStorage.removeItem('fermegest_pending_push'); // Éliminer tout push en attente de l'ancien état vide

        // 5. GESTION STRICTE DU MODE INVITÉ vs MODE CONNECTÉ
        if (!this.currentUser) {
          // MODE INVITÉ : ZÉRO écriture dans Supabase !
          console.log('[JoinFarm] Adhésion en Mode Invité réussie (0 écriture DB).');
        } else {
          // MODE CONNECTÉ : Enregistrer l'associé dans user_farms avec les données ADOPTÉES du propriétaire
          const adoptedState = this.getAppState();
          await this.client.from('user_farms').upsert({
            user_id: this.currentUser.id,
            data: {
              ...adoptedState,
              farmCode: code,
              farmRole: 'partner',
              ownerEmail: ownerEmail
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
          console.log('[JoinFarm] Adhésion en Mode Connecté enregistrée dans user_farms.');
        }

        // 6. ABONNEMENT AU CANAL REALTIME COLLABORATIF
        this.subscribeCollaborativeRealtime();

        // 7. DEMANDER UN RAFRAÎCHISSEMENT TEMPS RÉEL (SANS ÉMETTRE D'ÉTAT VIDE)
        if (this.collabChannel) {
          try {
            this.collabChannel.send({
              type: 'broadcast',
              event: 'request_state',
              payload: {
                senderSessionId: this.sessionId,
                requesterEmail: this.currentUser ? this.currentUser.email : 'Associé',
                code: code
              }
            });
          } catch (e) {}
        }

        // 8. RAFRAÎCHISSEMENT COMPLET DE L'UI
        if (input) input.value = '';
        this.updateProfileModalUI();
        this.updateUI();
        if (window.app && typeof app.renderAll === 'function') {
          app.renderAll();
        }

        if (window.app && app.showToast) {
          const lang = (window.appState && appState.lang) || 'fr';
          const msg = lang === 'ar'
            ? `🎉 متصل بنجاح بمزرعة ${ownerEmail} !`
            : `🎉 Connecté avec succès à la ferme de ${ownerEmail} !`;
          app.showToast(msg);
        }

        return true;
      } catch (err) {
        console.error('[JoinFarm] Erreur critique lors de l\'adhésion:', err);
        this.updateSyncBadge('error');
        if (window.app && app.showToast) {
          app.showToast('Erreur inattendue lors de la connexion à la ferme.', 'danger');
        }
        return false;
      }
    },

    async leaveSharedFarm() {
      const doLeave = async () => {
        try {
          // 1. Repasser en propriétaire avec un nouveau code indépendant
          localStorage.setItem('fermegest_farm_role', 'owner');
          const newCode = this.generateFarmCode();
          localStorage.setItem('fermegest_farm_code', newCode);
          localStorage.removeItem('fermegest_farm_owner_email');
          localStorage.removeItem('fermegest_pending_push');

          // 2. Nettoyer l'ancien canal Realtime partagé
          if (this.collabChannel) {
            try { this.client.removeChannel(this.collabChannel); } catch (e) {}
            this.collabChannel = null;
          }

          // 3. Se réabonner au canal Realtime propre
          this.subscribeCollaborativeRealtime();

          // 4. Si connecté, mettre à jour sa ligne dans user_farms avec le nouveau code et rôle owner
          if (this.currentUser && this.client) {
            const state = this.getAppState();
            await this.client.from('user_farms').upsert({
              user_id: this.currentUser.id,
              data: {
                ...state,
                farmCode: newCode,
                farmRole: 'owner',
                ownerEmail: this.currentUser.email || ''
              },
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });
          }

          // 5. Mettre à jour l'interface du profil
          this.updateProfileModalUI();
          this.updateUI();

          // 6. Notification de confirmation
          if (window.app && app.showToast) {
            const lang = (window.appState && appState.lang) || 'fr';
            const msg = lang === 'ar'
              ? '✅ تم قطع الاتصال بالمزرعة المشتركة والعودة إلى مزرعتك الفردية.'
              : '✅ Vous vous êtes déconnecté de la ferme partagée. Vous êtes de nouveau sur votre élevage individuel.';
            app.showToast(msg);
          }
        } catch (err) {
          console.error('[LeaveSharedFarm] Erreur:', err);
          if (window.app && app.showToast) {
            app.showToast('Erreur lors de la déconnexion de la ferme.', 'danger');
          }
        }
      };

      if (window.app && typeof app.confirmDialog === 'function') {
        const isAr = (window.appState && appState.lang === 'ar');
        app.confirmDialog({
          title: isAr ? 'قطع الاتصال بالمزرعة المشتركة' : 'Se déconnecter de la ferme partagée',
          message: isAr 
            ? 'هل تريد بالتأكيد قطع الاتصال بهذه المزرعة المشتركة والعودة إلى وضع المزرعة الفردية ؟'
            : 'Voulez-vous vraiment vous déconnecter de cette ferme partagée ? Vous repasserez en mode ferme individuelle indépendante.',
          confirmText: isAr ? 'قطع الاتصال' : 'Se déconnecter',
          isDanger: true,
          onConfirm: doLeave
        });
      } else {
        if (confirm('Voulez-vous vraiment vous déconnecter de cette ferme partagée ?')) {
          doLeave();
        }
      }
    },

    // Canal Realtime Collaboratif (Pièce partagée entre deux comptes associés)
    subscribeCollaborativeRealtime() {
      if (!this.client) return;
      const isChannelActive = (ch) => ch && (ch.state === 'joined' || ch.state === 'joining' || ch.state === 'subscribed');
      if (isChannelActive(this.collabChannel)) return;

      const farmCode = this.getFarmCode();

      if (this.collabChannel) {
        try { this.client.removeChannel(this.collabChannel); } catch (e) {}
        this.collabChannel = null;
      }

      try {
        this.collabChannel = this.client
          .channel(`farm_collab_room_${farmCode}`, {
            config: { broadcast: { self: false } }
          })
          .on('broadcast', { event: 'farm_update' }, (payload) => {
            const raw = (payload && payload.payload) ? payload.payload : payload;
            if (!raw) return;
            const data = raw;
            const sender = data.senderEmail || 'Votre associé';
            // Ignorer les messages provenant de cette exacte même session
            if (data.senderSessionId && data.senderSessionId === this.sessionId) return;

            if (data.farmData) {
              const localState = this.getAppState();
              const localHasAnimals = localState.animals && localState.animals.length > 0;
              const incomingHasAnimals = data.farmData.animals && data.farmData.animals.length > 0;
              const isExplicitReset = data.farmData._resetCleared === true;

              // Guardrail anti-écrasement destructif du cheptel
              if (localHasAnimals && !incomingHasAnimals && !isExplicitReset) {
                console.warn('[CollabRoom] 🛡️ Guardrail: Message Realtime avec cheptel vide ignoré pour protéger les animaux locaux.');
                const safeFarmData = { ...data.farmData };
                delete safeFarmData.animals;
                this.applyCloudData(safeFarmData, true);
              } else {
                this.applyCloudData(data.farmData, true);
              }

              this.lastSyncedAt = new Date();
              this.updateUI();
            }
          })
          .on('broadcast', { event: 'request_state' }, (payload) => {
            const raw = (payload && payload.payload) ? payload.payload : payload;
            if (!raw) return;
            if (raw.senderSessionId && raw.senderSessionId === this.sessionId) return;
            // Un associé vient de se connecter, on lui envoie les dernières données
            this.broadcastCurrentState();
          })
          .subscribe((status) => {
            console.log(`[CollabRoom] Subscribed to ${farmCode}:`, status);
            if (status === 'SUBSCRIBED' && this.getFarmRole() === 'partner') {
              try {
                this.collabChannel.send({
                  type: 'broadcast',
                  event: 'request_state',
                  payload: {
                    senderSessionId: this.sessionId,
                    requesterEmail: this.currentUser ? this.currentUser.email : 'Associé',
                    code: farmCode
                  }
                });
              } catch (e) {}
            }
          });
      } catch (e) {
        console.warn('[CollabRoom] Subscribe error:', e);
      }
    },

    broadcastCurrentState() {
      const farmCode = this.getFarmCode();
      const farmRole = this.getFarmRole();
      const state = this.getAppState();

      // Guardrail souverain : Partenaire avec cheptel vide ne diffuse JAMAIS d'état vide vers les autres appareils
      if (farmRole === 'partner' && (!state.animals || state.animals.length === 0) && !state._resetCleared) {
        console.warn('[Broadcast] 🛡️ Guardrail: Partenaire avec 0 animaux, diffusion annulée.');
        return;
      }

      const payload = {
        version: '2.5.0-pro',
        farmCode: farmCode,
        farmRole: this.getFarmRole(),
        ownerEmail: this.currentUser ? this.currentUser.email : '',
        currency: state.currency || 'TND',
        lang: state.lang || 'fr',
        theme: state.theme || 'dark',
        userProfile: state.userProfile || (function() {
          try { return JSON.parse(localStorage.getItem('fermegest_user_profile') || 'null'); } catch(e) { return null; }
        })(),
        eggStock: Number(state.eggStock) || 0,
        eggStocks: state.eggStocks || { poule: Number(state.eggStock) || 0, canard_barbarie: 0 },
          milkStock: Number(state.milkStock) || 0,
          milkHarvests: Array.isArray(state.milkHarvests) ? state.milkHarvests : [],
        eggHarvests: Array.isArray(state.eggHarvests) ? state.eggHarvests : [],
        eggConsumptions: Array.isArray(state.eggConsumptions) ? state.eggConsumptions : [],
        feedStockKg: state.feedStockKg !== undefined ? state.feedStockKg : null,
        feedStockDate: state.feedStockDate || null,
        feedStockCostPerKg: state.feedStockCostPerKg || 1.0,
        feedRationMode: state.feedRationMode || 'custom',
        customDailyFeedKg: (state.customDailyFeedKg !== undefined && state.customDailyFeedKg !== null) ? state.customDailyFeedKg : null,
        sicamCansCount: (state.sicamCansCount !== undefined && state.sicamCansCount !== null) ? state.sicamCansCount : null,
        feedDistributions: Array.isArray(state.feedDistributions) ? state.feedDistributions : [],
        feedTypes: Array.isArray(state.feedTypes) ? state.feedTypes : [],
        animals: Array.isArray(state.animals) ? state.animals : [],
        expenses: Array.isArray(state.expenses) ? state.expenses : [],
        sales: Array.isArray(state.sales) ? state.sales : [],
        incubatorBatches: Array.isArray(state.incubatorBatches) ? state.incubatorBatches : [],
        deletedIds: Array.from(this.getDeletedIds()),
        lastResetAt: state.lastResetAt || null,
        _resetCleared: !!state._resetCleared,
        lastUpdated: Number(state.lastUpdated) || Date.now()
      };

      const broadcastMsg = {
        senderSessionId: this.sessionId,
        senderId: this.currentUser ? this.currentUser.id : null,
        senderEmail: this.currentUser ? this.currentUser.email : 'Utilisateur',
        farmData: payload
      };

      // 1. Broadcast sur le canal de compte utilisateur (synchronise instantanément iPhone et PC sur le même Gmail)
      if (this.userSyncChannel) {
        try {
          this.userSyncChannel.send({
            type: 'broadcast',
            event: 'device_state_update',
            payload: broadcastMsg
          });
        } catch (e) {}
      }

      // 2. Broadcast sur le canal collaboratif partagé (associés avec code ferme)
      if (this.collabChannel) {
        try {
          this.collabChannel.send({
            type: 'broadcast',
            event: 'farm_update',
            payload: broadcastMsg
          });
        } catch (e) {}
      }
    },

    async pullSharedData(code) {
      if (!this.client || !code) return;
      try {
        const { data, error } = await this.client
          .from('user_farms')
          .select('data, updated_at, user_id')
          .contains('data', { farmCode: code })
          .order('updated_at', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          const ownerRow = data.find(r => r.data && (r.data.farmRole === 'owner' || !r.data.farmRole)) || data[0];
          if (ownerRow && ownerRow.data) {
            this.applyCloudData(ownerRow.data, false);
            if (ownerRow.data.ownerEmail) {
              localStorage.setItem('fermegest_farm_owner_email', ownerRow.data.ownerEmail);
            }
          }
          this.lastSyncedAt = new Date();
          this.updateUI();
        }
      } catch (e) {
        console.warn('[SharedPull] error:', e);
      }
    },

    updateProfileModalUI() {
      const roleBadge = document.getElementById('teamRoleBadge');
      const shareCodeDisplay = document.getElementById('teamShareCodeDisplay');
      const joinedCodeDisplay = document.getElementById('teamJoinedCodeDisplay');
      const ownerEmailDisplay = document.getElementById('teamOwnerEmailDisplay');
      const ownerSection = document.getElementById('teamOwnerSection');
      const partnerSection = document.getElementById('teamPartnerSection');
      const joinContainer = document.getElementById('teamJoinContainer');

      const code = this.getFarmCode();
      const role = this.getFarmRole();
      const ownerEmail = this.getFarmOwnerEmail();

      if (shareCodeDisplay) shareCodeDisplay.textContent = code;
      if (joinedCodeDisplay) joinedCodeDisplay.textContent = code;
      if (ownerEmailDisplay) ownerEmailDisplay.textContent = ownerEmail || 'Propriétaire';

      if (role === 'partner') {
        if (roleBadge) {
          roleBadge.textContent = (window.app && app.t) ? app.t('team_role_partner') : 'Associé';
          roleBadge.className = 'team-badge team-badge-partner';
        }
        if (ownerSection) ownerSection.classList.add('hidden');
        if (partnerSection) partnerSection.classList.remove('hidden');
        if (joinContainer) joinContainer.classList.add('hidden');
      } else {
        if (roleBadge) {
          roleBadge.textContent = (window.app && app.t) ? app.t('team_role_owner') : 'Propriétaire';
          roleBadge.className = 'team-badge team-badge-owner';
        }
        if (ownerSection) ownerSection.classList.remove('hidden');
        if (partnerSection) partnerSection.classList.add('hidden');
        if (joinContainer) joinContainer.classList.remove('hidden');
      }
    },

    openModal() {
      const modal = document.getElementById('modalAuth');
      if (modal) modal.classList.remove('hidden');
      const errEl = document.getElementById('authErrorMessage');
      if (errEl) errEl.classList.add('hidden');
    },

    closeModal() {
      const modal = document.getElementById('modalAuth');
      if (modal) modal.classList.add('hidden');
    },

    openProfileModal() {
      const modal = document.getElementById('modalUserProfile');
      if (!modal) return;
      const avatarEl = document.getElementById('profileModalAvatar');
      const emailEl = document.getElementById('profileModalEmail');
      const timeEl = document.getElementById('profileModalLastSync');

      const isAuth = !!this.currentUser;
      const profile = (window.appState && window.appState.userProfile) || (function() {
        try { return JSON.parse(localStorage.getItem('fermegest_user_profile') || 'null'); } catch(e) { return null; }
      })();

      const email = isAuth ? (this.currentUser.email || 'Utilisateur') : (profile ? `${profile.name} (Mode Invité)` : 'Mode Local (Invité)');
      const farmerName = profile ? profile.name : (isAuth && this.currentUser.email ? this.currentUser.email.split('@')[0] : 'Éleveur');
      const age = profile ? profile.age : null;
      const avatarId = profile ? (profile.avatar || 'avatar-m1') : 'avatar-m1';
      const isFemale = profile ? profile.gender === 'female' : false;
      const roleText = window.app && typeof app.t === 'function' 
        ? (profile && profile.avatar && window.AppAvatars ? app.t(window.AppAvatars.getById(avatarId).roleKey) : (isFemale ? 'Éleveuse' : 'Éleveur'))
        : (isFemale ? 'Éleveuse' : 'Éleveur');

      const farmerNameEl = document.getElementById('profileModalFarmerName');
      if (farmerNameEl) farmerNameEl.textContent = farmerName;

      const yearsText = window.app && typeof app.t === 'function' ? (app.t('onboarding_preview_years') || 'ans') : 'ans';
      const ageAndRoleEl = document.getElementById('profileModalAgeAndRole');
      if (ageAndRoleEl) {
        ageAndRoleEl.textContent = age ? `${age} ${yearsText} • ${roleText} 🌾` : `${roleText} 🌾`;
      }

      const animalsEl = document.getElementById('profileModalManagedAnimals');
      if (animalsEl && window.app && typeof app.getManagedAnimalsBadgesHtml === 'function') {
        const managed = (profile && profile.managedAnimals) || (function() {
          try { return JSON.parse(localStorage.getItem('fermegest_managed_animal_types') || 'null'); } catch(e) { return null; }
        })();
        animalsEl.innerHTML = app.getManagedAnimalsBadgesHtml(managed);
      }

      if (avatarEl) {
        if (window.AppAvatars) {
          avatarEl.innerHTML = window.AppAvatars.getSvg(avatarId, 64);
        } else {
          avatarEl.textContent = isAuth && this.currentUser.email ? this.currentUser.email[0].toUpperCase() : '👤';
        }
      }

      const guestBanner = document.getElementById('profileGuestWarningBanner');
      if (guestBanner) {
        if (!isAuth) {
          guestBanner.classList.remove('hidden');
        } else {
          guestBanner.classList.add('hidden');
        }
      }

      if (emailEl) emailEl.textContent = email;
      if (timeEl) {
        timeEl.textContent = this.lastSyncedAt
          ? this.lastSyncedAt.toLocaleTimeString('fr-FR')
          : 'À l\'instant';
      }
      this.updateProfileModalUI();
      modal.classList.remove('hidden');
    },

    closeProfileModal() {
      const modal = document.getElementById('modalUserProfile');
      if (modal) modal.classList.add('hidden');
    }
  };

  window.appAuth = appAuth;
  try { if (typeof globalThis !== "undefined") globalThis.appAuth = appAuth; } catch (e) {}
  window.switchAuthTab = function(mode) { appAuth.switchTab(mode); };
  window.handleAuthSubmit = function(e) { appAuth.handleSubmit(e); };

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => appAuth.init());
  } else {
    appAuth.init();
  }

})(window);
