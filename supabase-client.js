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

        // Listen for authentication changes
        this.client.auth.onAuthStateChange((event, session) => {
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

        // Connect userProfile (Name, Age, Avatar) to Supabase user metadata
        const profile = (window.appState && window.appState.userProfile) || (function() {
          try { return JSON.parse(localStorage.getItem('fermegest_user_profile') || 'null'); } catch(e) { return null; }
        })();
        if (profile && this.client && this.client.auth) {
          try {
            this.client.auth.updateUser({
              data: {
                full_name: profile.name,
                age: profile.age,
                avatar: profile.avatar,
                farmer_name: profile.name
              }
            }).catch(() => {});
          } catch (e) {}
        }

        // Close all onboarding and auth prompt modals
        if (window.app && typeof app.closeModal === 'function') {
          app.closeModal('modalOnboarding');
          app.closeModal('modalAuthPrompt');
          app.closeModal('modalGuestWarning');
          app.closeModal('modalAuth');

          // Open animal selection if not completed yet
          const animalsDone = localStorage.getItem('fermegest_animals_selection_completed') === 'true';
          if (!animalsDone && typeof app.openAnimalSelectionModal === 'function') {
            setTimeout(() => {
              app.openAnimalSelectionModal();
            }, 400);
          }
        }
        try {
          localStorage.setItem('fermegest_onboarding_completed', 'true');
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
        localStorage.removeItem('fermegest_onboarding_completed');
        localStorage.removeItem('fermegest_animals_selection_completed');
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

        if (!userRowErr && userRow && userRow.data) {
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
          const ownerRow = rows.find(r => r.data && r.data.farmRole === 'owner' && r.user_id !== this.currentUser.id);
          const isPartner = this.getFarmRole() === 'partner';
          const localState = this.getAppState();
          const localHasData = (localState.animals && localState.animals.length > 0) || (localState.expenses && localState.expenses.length > 0);

          for (const row of rows) {
            if (row && row.data && Object.keys(row.data).length > 0) {
              const isDirectOwnerSelf = (row.user_id === this.currentUser.id);
              const cloudHasData = (row.data.animals && row.data.animals.length > 0) || (row.data.expenses && row.data.expenses.length > 0);
              // Si le terminal local est vierge (ex: nouvelle install APK sur mobile) et que le Cloud détient la ferme du compte,
              // forcer l'adoption intégrale (doMerge = false) pour une parité immédiate à 100% avec le Web !
              const shouldDirectHydrate = isDirectOwnerSelf && !localHasData && cloudHasData;

              this.applyCloudData(row.data, !shouldDirectHydrate);
            }
          }

          // Si le compte courant est un associé (ex: le frère), et que le propriétaire a des données plus fraîches ou complètes,
          // fusionner intelligemment avec la vérité canonique du propriétaire sans jamais écraser les données locales
          if (isPartner && ownerRow && ownerRow.data) {
            this.applyCloudData(ownerRow.data, !localHasData ? false : true);
          }

          if (window.app && typeof app.renderAll === 'function') {
            app.renderAll();
          }
        }

        // 2. Push unified merged data back to user_farms
        const state = this.getAppState();
        const farmRole = this.getFarmRole();
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
          lastUpdated: Date.now()
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

        if (state.userProfile && this.client && this.client.auth) {
          try {
            this.client.auth.updateUser({
              data: {
                full_name: state.userProfile.name,
                farmer_name: state.userProfile.name,
                birth_date: state.userProfile.birthDate,
                age: state.userProfile.age,
                avatar: state.userProfile.avatar,
                gender: state.userProfile.gender
              }
            }).catch(() => {});
          } catch (e) {}
        }

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
      this.isSyncing = true;
      this.updateSyncBadge('syncing');

      const farmCode = this.getFarmCode();
      const farmRole = this.getFarmRole();
      const ownerEmail = farmRole === 'owner'
        ? (this.currentUser ? this.currentUser.email : '')
        : this.getFarmOwnerEmail();

      const state = this.getAppState();
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
        lastUpdated: Date.now()
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
              this.applyCloudData(data.farmData, true);
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
      const localLastEdit = Number((typeof localStorage !== 'undefined' ? localStorage.getItem('fermegest_last_local_edit') : 0)) || Number(state.lastUpdated) || 0;
      const cloudLastUpdated = Number(cloudData.lastUpdated) || 0;

      // Protection souveraine : si le terminal local a des modifications en attente de push,
      // ou si l'horodatage local est strictement plus récent qu'un cloud valide, le cloud n'est PAS plus frais
      const isCloudFresher = (cloudLastUpdated > localLastEdit) && !hasPendingLocalPush;

      // Protection anti-écrasement destructive :
      // Interdire le mode destructif (doMerge = false) si le terminal local possède déjà des données réelles
      const localDataCount = (state.animals || []).length + 
                             (state.expenses || []).length + 
                             (state.feedTypes || []).length + 
                             (state.sales || []).length + 
                             (state.eggHarvests || []).length + 
                             (state.feedDistributions || []).length;
      const effectiveDoMerge = doMerge || (localDataCount > 0) || hasPendingLocalPush;

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
        const localManaged = (state.userProfile && Array.isArray(state.userProfile.managedAnimals)) ? state.userProfile.managedAnimals : [];
        const cloudManaged = Array.isArray(cloudData.userProfile.managedAnimals) ? cloudData.userProfile.managedAnimals : [];
        const mergedManaged = Array.from(new Set([...cloudManaged, ...localManaged]));

        state.userProfile = {
          ...cloudData.userProfile,
          managedAnimals: mergedManaged.length > 0 ? mergedManaged : ['poultry'],
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
              state.eggStocks[sp] = cloudVal;
            } else {
              // Si localLastEdit >= cloudLastUpdated : la décrémentation locale (vente/consommation/incubation) fait foi !
              // Ne JAMAIS faire Math.max(localVal, cloudVal) qui empêche tout chiffre de diminuer !
              state.eggStocks[sp] = (localLastEdit >= cloudLastUpdated && localLastEdit > 0) ? localVal : cloudVal;
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
          state.eggStocks.poule = cloudEggs;
        } else {
          const localEggs = Number(state.eggStocks.poule) || Number(state.eggStock) || 0;
          state.eggStocks.poule = (localLastEdit >= cloudLastUpdated && localLastEdit > 0) ? localEggs : cloudEggs;
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

      // Preserve all animal species (bovins, ovins, volailles)
      state.animals = Array.isArray(state.animals) ? state.animals : [];
      if (state.animals.length > 0 && state.userProfile) {
        state.userProfile.managedAnimals = Array.isArray(state.userProfile.managedAnimals) ? state.userProfile.managedAnimals : ['poultry'];
        state.animals.forEach(a => {
          const sp = (a.species || '').toLowerCase();
          const isBovine = sp.includes('vache') || sp.includes('bovin') || sp.includes('genisse') || sp.includes('veau') || sp.includes('taureau');
          const isOvine = sp.includes('mouton') || sp.includes('ovin') || sp.includes('brebis') || sp.includes('agneau') || sp.includes('belier') || sp.includes('chevre') || sp.includes('caprin');
          const isPoultry = sp.includes('poulet') || sp.includes('poule') || sp.includes('poussin') || sp.includes('dinde') || sp.includes('canard') || sp.includes('caille');
          if (isBovine && !state.userProfile.managedAnimals.includes('bovine')) state.userProfile.managedAnimals.push('bovine');
          if (isOvine && !state.userProfile.managedAnimals.includes('ovine')) state.userProfile.managedAnimals.push('ovine');
          if (isPoultry && !state.userProfile.managedAnimals.includes('poultry')) state.userProfile.managedAnimals.push('poultry');
        });
        try {
          localStorage.setItem('fermegest_managed_animal_types', JSON.stringify(state.userProfile.managedAnimals));
          localStorage.setItem('fermegest_user_profile', JSON.stringify(state.userProfile));
        } catch (e) {}
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
        window.appState.userProfile = state.userProfile;
        window.appState.currency = state.currency;
        window.appState.lang = state.lang;
        window.appState.theme = state.theme;
        window.appState.eggStock = state.eggStock;
        window.appState.eggStocks = state.eggStocks ? { ...state.eggStocks } : { poule: state.eggStock, canard_barbarie: 0 };
        window.appState.milkStock = state.milkStock;
        window.appState.milkHarvests = state.milkHarvests;
        window.appState.eggHarvests = state.eggHarvests;
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
      }

      // Persist to local device storage as well (offline fallback)
      try {
        const serialized = JSON.stringify({
          version: '2.5.0-pro',
          currency: state.currency,
          lang: state.lang,
          theme: state.theme,
          userProfile: state.userProfile,
          eggStock: state.eggStock,
          eggStocks: state.eggStocks,
          milkStock: state.milkStock,
          milkHarvests: state.milkHarvests,
          eggHarvests: state.eggHarvests,
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
          calendarEvents: state.calendarEvents
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
      const inviteMsg = `🌾 Salut ! Rejoins la gestion de notre élevage sur FermeGest Pro avec le code : ${code}\n\n📲 Ouvre l'application directement ici : https://fermegestpro.vercel.app`;

      if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('Share')) {
        try {
          window.Capacitor.Plugins.Share.share({
            title: 'Invitation FermeGest Pro',
            text: inviteMsg,
            url: 'https://fermegestpro.vercel.app',
            dialogTitle: 'Partager le code de la ferme'
          });
          return;
        } catch (e) {}
      }

      if (navigator.share) {
        navigator.share({
          title: 'Invitation FermeGest Pro',
          text: inviteMsg,
          url: 'https://fermegestpro.vercel.app'
        }).catch(() => {
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMsg)}`, '_blank');
        });
      } else {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(inviteMsg)}`, '_blank');
      }
    },

    async joinFarmWithCode() {
      const input = document.getElementById('teamJoinCodeInput');
      if (!input) return;
      let code = input.value.trim().toUpperCase().replace(/\s+/g, '');
      if (!code) {
        if (window.app && app.showToast) app.showToast('Veuillez entrer un code valide.');
        return;
      }
      if (!code.startsWith('FERME-')) {
        code = 'FERME-' + code;
      }

      // Enregistrer le rôle d'associé et le code
      localStorage.setItem('fermegest_farm_code', code);
      localStorage.setItem('fermegest_farm_role', 'partner');

      // Se brancher sur le canal Realtime de cette ferme partagée
      this.subscribeCollaborativeRealtime();

      // Demander l'état actuel de la ferme dans la pièce
      if (this.collabChannel) {
        try {
          this.collabChannel.send({
            type: 'broadcast',
            event: 'request_state',
            payload: {
              requesterEmail: this.currentUser ? this.currentUser.email : 'Associé',
              code: code
            }
          });
        } catch (e) {}
      }

      // 1. Enregistrer immédiatement le farmCode dans la base pour activer les droits RLS
      const state = this.getAppState();
      await this.client.from('user_farms').upsert({
        user_id: this.currentUser.id,
        data: {
          ...state,
          farmCode: code,
          farmRole: 'partner'
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      // 2. Forcer le chargement de la ferme du propriétaire
      await this.forcePullFromCloud(false);

      this.updateProfileModalUI();
      input.value = '';

      if (window.app && app.showToast) {
        app.showToast((window.app && app.t) ? app.t('team_toast_joined_success') : '🎉 Connecté à la ferme partagée !');
      }
    },

    async leaveSharedFarm() {
      const doLeave = async () => {
        // Repasser en propriétaire avec un nouveau code indépendant
        localStorage.setItem('fermegest_farm_role', 'owner');
        const newCode = this.generateFarmCode();
        localStorage.setItem('fermegest_farm_code', newCode);
        localStorage.removeItem('fermegest_farm_owner_email');

        this.subscribeCollaborativeRealtime();
        await this.pushData(false);
        this.updateProfileModalUI();

        if (window.app && app.showToast) {
          app.showToast((window.app && app.t) ? app.t('team_toast_left_farm') : 'Vous avez quitté la ferme partagée.');
        }
      };

      if (window.app && typeof app.confirmDialog === 'function') {
        const isAr = (window.appState && appState.lang === 'ar');
        app.confirmDialog({
          title: isAr ? 'مغادرة المزرعة المشتركة' : 'Quitter la ferme partagée',
          message: isAr 
            ? 'هل تريد مغادرة هذه المزرعة المشتركة والعودة إلى وضع المزرعة الفردية ؟'
            : 'Voulez-vous vraiment quitter cette ferme partagée ? Vous repasserez en mode ferme individuelle.',
          confirmText: isAr ? 'مغادرة' : 'Quitter',
          isDanger: true,
          onConfirm: doLeave
        });
      } else {
        doLeave();
      }
    },

    // Canal Realtime Collaboratif (Pièce partagée entre deux comptes associés)
    subscribeCollaborativeRealtime() {
      if (!this.client) return;
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
              this.applyCloudData(data.farmData, true);
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
      const state = this.getAppState();
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
        lastUpdated: Date.now()
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
          for (const row of data) {
            if (row && row.data && Object.keys(row.data).length > 0) {
              this.applyCloudData(row.data, true);
              if (row.data.ownerEmail) {
                localStorage.setItem('fermegest_farm_owner_email', row.data.ownerEmail);
              }
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
      } else {
        if (roleBadge) {
          roleBadge.textContent = (window.app && app.t) ? app.t('team_role_owner') : 'Propriétaire';
          roleBadge.className = 'team-badge team-badge-owner';
        }
        if (ownerSection) ownerSection.classList.remove('hidden');
        if (partnerSection) partnerSection.classList.add('hidden');
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
