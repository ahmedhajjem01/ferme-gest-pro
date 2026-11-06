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
        return Number(item.updatedAt || item.timestamp || (item.date ? new Date(item.date).getTime() : 0)) || 0;
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

        seenIds.add(key);
        if (localMap.has(key)) {
          const localItem = localMap.get(key);
          const now = Date.now();
          const cloudTs = Math.min(getTs(cloudItem), now);
          const localTs = Math.min(getTs(localItem), now);

          // Priorité aux ajustements manuels récents de l'éleveur local
          // et protection absolue des stocks d'aliments :
          // 1. Si le stock local a été décrémenté par distribution (local < cloud), préserver strictement local
          // 2. Si le stock local a été ajusté manuellement ou avec un horodatage >= cloud, préserver local
          const isFeedType = key.startsWith('feed-') || localItem.stockKg !== undefined;
          if (isFeedType) {
            if (Number(localItem.stockKg) < Number(cloudItem.stockKg)) {
              merged.push({ ...cloudItem, ...localItem });
            } else if (localTs >= cloudTs) {
              merged.push({ ...cloudItem, ...localItem });
            } else if (cloudTs > localTs && !localItem.manuallyAdjusted) {
              merged.push({ ...localItem, ...cloudItem });
            } else {
              merged.push({ ...cloudItem, ...localItem });
            }
          } else if (localItem.manuallyAdjusted && localTs >= cloudTs) {
            merged.push({ ...cloudItem, ...localItem });
          } else if (cloudTs && localTs) {
            merged.push(cloudTs > localTs ? { ...localItem, ...cloudItem } : { ...cloudItem, ...localItem });
          } else if (localTs && !cloudTs) {
            merged.push({ ...cloudItem, ...localItem });
          } else if (cloudTs && !localTs) {
            merged.push({ ...localItem, ...cloudItem });
          } else {
            // Priorité absolue aux modifications locales sur l'appareil actuel si aucun timestamp explicite
            merged.push({ ...cloudItem, ...localItem });
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
        console.warn('[SupabaseAuth] Supabase SDK not found on window.');
        return;
      }

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
            this.updateUI();
          }
        }).catch(err => {
          console.warn('[SupabaseAuth] getSession error:', err);
          this.updateUI();
        });

        const handleWakeup = () => {
          if (this.currentUser) {
            this.pullData(true);
            this.reconnectRealtimeIfNeeded();
          }
        };

        // Multi-device wake-up listeners (Mobile screen unlock, returning to tab, reconnecting)
        window.addEventListener('online', handleWakeup);
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
              this.pullData(true);
            }
          }, 20000);
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

        // Close auth prompt modals
        if (window.app && typeof app.closeModal === 'function') {
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
    async signOut() {
      if (!this.client) return;
      const doSignOut = async () => {
        try {
          await this.client.auth.signOut();
          this.currentUser = null;
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

    // 5. Pull Cloud Data from 'user_farms' with Smart Merging
    async pullData(isSilent = false) {
      if (!this.client || !this.currentUser || this.isSyncing) return;
      this.isSyncing = true;

      try {
        const { data, error } = await this.client
          .from('user_farms')
          .select('data, updated_at')
          .eq('user_id', this.currentUser.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.data && Object.keys(data.data).length > 0) {
          const cloudUpdatedAt = data.updated_at || (data.data && data.data.lastUpdated);
          if (!isSilent || !this._lastCloudTimestamp || this._lastCloudTimestamp !== cloudUpdatedAt) {
            this._lastCloudTimestamp = cloudUpdatedAt;
            this.applyCloudData(data.data, true);
            this.lastSyncedAt = new Date();
            this.updateUI();
            if (!isSilent && window.app && app.showToast) {
              app.showToast('☁️ Données synchronisées avec votre compte !');
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

    // 5b. Smart Manual Sync: pull + merge + save + push + broadcast
    async syncNow(showToast = true, adWatched = false) {
      if (showToast && !adWatched && window.MobileBridge && typeof window.MobileBridge.promptRewardedAd === 'function' && this.currentUser) {
        window.MobileBridge.promptRewardedAd('cloud_sync', () => {
          this.syncNow(showToast, true);
        });
        return;
      }
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
        // 1. Fetch latest data from user_farms
        const { data, error } = await this.client
          .from('user_farms')
          .select('data, updated_at')
          .eq('user_id', this.currentUser.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.data && Object.keys(data.data).length > 0) {
          // Smart merge cloud data with local data
          this.applyCloudData(data.data, true);
        }

        // 2. Push unified merged data back to user_farms
        const state = this.getAppState();
        const farmCode = this.getFarmCode();
        const farmRole = this.getFarmRole();
        const ownerEmail = farmRole === 'owner'
          ? (this.currentUser ? this.currentUser.email : '')
          : this.getFarmOwnerEmail();

        const payload = {
          version: '2.5.0-pro',
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
          milkStock: Number(state.milkStock) || 0,
          milkHarvests: Array.isArray(state.milkHarvests) ? state.milkHarvests : [],
          eggHarvests: Array.isArray(state.eggHarvests) ? state.eggHarvests : [],
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
          milkStock: Number(state.milkStock) || 0,
          milkHarvests: Array.isArray(state.milkHarvests) ? state.milkHarvests : [],
        eggHarvests: Array.isArray(state.eggHarvests) ? state.eggHarvests : [],
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

        this.lastSyncedAt = new Date();
        this.updateSyncBadge('connected');

        // Real-time instant broadcast to all other open sessions/devices
        this.broadcastCurrentState();

        if (showToast && window.app && app.showToast) {
          app.showToast('☁️ Données sauvegardées sur le Cloud !');
        }
      } catch (err) {
        console.error('[SupabaseAuth] Push error:', err);
        this.updateSyncBadge('error');
      } finally {
        this.isSyncing = false;
        if (this._needPushAgain) {
          this._needPushAgain = false;
          setTimeout(() => this.pushData(false), 300);
        }
      }
    },

    // Auto-save debouncer triggered whenever app.saveState() runs
    schedulePush() {
      if (!this.currentUser) return;
      clearTimeout(this._pushTimer);
      this._pushTimer = setTimeout(() => {
        this.pushData(false);
      }, 1000);
    },

    // 7. Subscribe to Postgres Realtime changes across devices
    subscribeRealtime() {
      if (!this.client || !this.currentUser) return;
      if (this.realtimeChannel) {
        try { this.client.removeChannel(this.realtimeChannel); } catch (e) {}
      }

      try {
        this.realtimeChannel = this.client
          .channel(`user_farm_realtime_${this.currentUser.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_farms',
              filter: `user_id=eq.${this.currentUser.id}`
            },
            (payload) => {
              if (payload.new && payload.new.data) {
                this.applyCloudData(payload.new.data, true);
                this.lastSyncedAt = new Date();
                this.updateUI();
              }
            }
          )
          .subscribe();
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

      // Ingest deletedIds if provided by cloud
      if (Array.isArray(cloudData.deletedIds)) {
        cloudData.deletedIds.forEach(id => this.addDeletedId(id));
      }

      if (cloudData.currency) state.currency = cloudData.currency;
      if (cloudData.lang && !localStorage.getItem('fermegest_lang_manual')) {
        state.lang = cloudData.lang;
      }

      // Restore userProfile if provided by cloud
      if (cloudData.userProfile && typeof cloudData.userProfile === 'object') {
        const localProf = state.userProfile;
        if (!localProf || (cloudData.userProfile.updatedAt && Number(cloudData.userProfile.updatedAt) >= Number(localProf.updatedAt || 0))) {
          state.userProfile = cloudData.userProfile;
          try {
            localStorage.setItem('fermegest_user_profile', JSON.stringify(cloudData.userProfile));
            localStorage.setItem('fermegest_onboarding_completed', 'true');
          } catch (e) {}
        }
      }

      // Egg & feed stock handling
      if (cloudData.eggStock !== undefined) {
        const cloudEggs = Number(cloudData.eggStock) || 0;
        const localEggs = Number(state.eggStock) || 0;
        state.eggStock = doMerge ? Math.max(localEggs, cloudEggs) : cloudEggs;
      }
      if (cloudData.milkStock !== undefined) {
        const cloudMilk = Number(cloudData.milkStock) || 0;
        const localMilk = Number(state.milkStock) || 0;
        state.milkStock = doMerge ? Math.max(localMilk, cloudMilk) : cloudMilk;
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
        const shouldAcceptCloud = !doMerge || (cloudTs > localTs && cloudStock !== null);
        if (shouldAcceptCloud) {
          state.feedStockKg = cloudStock;
          state.feedStockDate = cloudData.feedStockDate || null;
          state.feedStockCostPerKg = cloudData.feedStockCostPerKg ? Number(cloudData.feedStockCostPerKg) : 1.0;
          state.feedStockUpdatedAt = cloudTs;
        }
      }
      state.customDailyFeedKg = null;
      state.sicamCansCount = null;

      if (doMerge) {
        state.animals = this.mergeCollections(state.animals, cloudData.animals || []);
        state.expenses = this.mergeCollections(state.expenses, cloudData.expenses || []);
        state.sales = this.mergeCollections(state.sales, cloudData.sales || []);
        state.incubatorBatches = this.mergeCollections(state.incubatorBatches, cloudData.incubatorBatches || []);
        state.eggHarvests = this.mergeCollections(state.eggHarvests, cloudData.eggHarvests || []);
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
        if (Array.isArray(cloudData.milkHarvests)) state.milkHarvests = cloudData.milkHarvests;
        if (Array.isArray(cloudData.feedDistributions)) state.feedDistributions = cloudData.feedDistributions;
        if (Array.isArray(cloudData.feedTypes)) state.feedTypes = cloudData.feedTypes;
      }

      // Keep feedTypes clean: remove any artificial feed-principal, tombstoned feeds, and sync total stock
      if (Array.isArray(state.feedTypes)) {
        const deletedIds = this.getDeletedIds();
        state.feedTypes = state.feedTypes.filter(ft => 
          ft && ft.id !== 'feed-principal' &&
          !deletedIds.has(String(ft.id)) &&
          !(ft.name || '').toLowerCase().includes('principal') &&
          !(ft.name || '').includes('علف رئيسي')
        );
        state.feedStockKg = parseFloat(state.feedTypes.reduce((sum, ft) => sum + (Number(ft.stockKg) || 0), 0).toFixed(2));
      }

      // Preserve all animal species (bovins, ovins, volailles)
      state.animals = Array.isArray(state.animals) ? state.animals : [];

      // Keep farm code in sync
      if (cloudData.farmCode) {
        localStorage.setItem('fermegest_farm_code', cloudData.farmCode);
      }
      if (cloudData.farmRole) {
        localStorage.setItem('fermegest_farm_role', cloudData.farmRole);
      }
      if (cloudData.farmRole === 'partner' && cloudData.farmCode) {
        // Auto pull latest shared data from the owner
        setTimeout(() => this.pullSharedData(cloudData.farmCode), 100);
      }
      if (cloudData.ownerEmail) {
        localStorage.setItem('fermegest_farm_owner_email', cloudData.ownerEmail);
      }

      // Sync window.appState
      if (window.appState) {
        window.appState.currency = state.currency;
        window.appState.lang = state.lang;
        window.appState.theme = state.theme;
        window.appState.eggStock = state.eggStock;
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
        if ((state.animals && state.animals.length > 0) || (state.sales && state.sales.length > 0) || (state.expenses && state.expenses.length > 0)) {
          localStorage.setItem('fermegest_state_backup', serialized);
        }
      } catch (e) {}

      if (window.app) {
        if (app.updateCurrencySymbols) app.updateCurrencySymbols();
        if (app.renderAll) app.renderAll();
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

      // Tenter de charger les données cloud si présentes
      await this.pullSharedData(code);

      // Sauvegarder sur son propre compte cloud
      await this.pushData(false);

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
          milkStock: Number(state.milkStock) || 0,
          milkHarvests: Array.isArray(state.milkHarvests) ? state.milkHarvests : [],
        eggHarvests: Array.isArray(state.eggHarvests) ? state.eggHarvests : [],
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
      if (!this.client) return;
      try {
        const { data, error } = await this.client
          .from('user_farms')
          .select('data, updated_at, user_id')
          .contains('data', { farmCode: code })
          .order('updated_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0 && data[0].data) {
          const cloudData = data[0].data;
          this.applyCloudData(cloudData, true);
          if (cloudData.ownerEmail) {
            localStorage.setItem('fermegest_farm_owner_email', cloudData.ownerEmail);
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
