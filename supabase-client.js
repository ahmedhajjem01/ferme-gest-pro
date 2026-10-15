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
    realtimeChannel: null,
    isSyncing: false,
    lastSyncedAt: null,
    _pushTimer: null,

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

        // Auto-reconnect when device comes back online
        window.addEventListener('online', () => {
          if (this.currentUser) {
            this.pullData(true);
          }
        });

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && this.currentUser) {
            this.pullData(true);
          }
        });

      } catch (e) {
        console.error('[SupabaseAuth] Init error:', e);
      }
    },

    async handleAuthStateChange(event, session) {
      if (session && session.user) {
        this.currentUser = session.user;
        this.updateUI();
        await this.pullData(false);
        this.subscribeRealtime();
      } else {
        this.currentUser = null;
        if (this.realtimeChannel && this.client) {
          try { this.client.removeChannel(this.realtimeChannel); } catch (e) {}
        }
        this.realtimeChannel = null;
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
          alert('Erreur Google: ' + (err.message || err));
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
      if (confirm('Voulez-vous vous déconnecter de votre compte ?')) {
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
      }
    },

    // 5. Pull Cloud Data from 'user_farms'
    async pullData(isSilent = false) {
      if (!this.client || !this.currentUser) return;

      try {
        const { data, error } = await this.client
          .from('user_farms')
          .select('data, updated_at')
          .eq('user_id', this.currentUser.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.data && Object.keys(data.data).length > 0) {
          this.applyCloudData(data.data);
          this.lastSyncedAt = new Date();
          this.updateUI();
          if (!isSilent && window.app && app.showToast) {
            app.showToast('☁️ Données synchronisées avec votre compte !');
          }
        } else {
          // New user farm: initialize the cloud row with current local data
          await this.pushData(false);
          this.lastSyncedAt = new Date();
          this.updateUI();
        }
      } catch (err) {
        console.warn('[SupabaseAuth] Pull error:', err);
      }
    },

    // 6. Push Cloud Data to 'user_farms'
    async pushData(showToast = false) {
      if (!this.client || !this.currentUser || this.isSyncing) return;
      this.isSyncing = true;
      this.updateSyncBadge('syncing');

      const payload = {
        version: '2.5.0-pro',
        currency: window.appState ? window.appState.currency : 'TND',
        lang: window.appState ? window.appState.lang : 'fr',
        theme: window.appState ? window.appState.theme : 'dark',
        animals: window.appState ? window.appState.animals : [],
        expenses: window.appState ? window.appState.expenses : [],
        sales: window.appState ? window.appState.sales : [],
        incubatorBatches: window.appState ? window.appState.incubatorBatches : [],
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
        if (showToast && window.app && app.showToast) {
          app.showToast('☁️ Sauvegardé sur votre compte Google !');
        }
      } catch (err) {
        console.error('[SupabaseAuth] Push error:', err);
        this.updateSyncBadge('error');
      } finally {
        this.isSyncing = false;
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

    // 7. Subscribe to Realtime changes across devices
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
                this.applyCloudData(payload.new.data);
                this.lastSyncedAt = new Date();
                this.updateUI();
                if (window.app && app.showToast) {
                  app.showToast('🔄 Synchronisé depuis votre autre téléphone !');
                }
              }
            }
          )
          .subscribe();
      } catch (e) {
        console.warn('[SupabaseAuth] Realtime subscribe error:', e);
      }
    },

    // 8. Apply incoming cloud data into local state & re-render
    applyCloudData(cloudData) {
      if (!cloudData || !window.appState) return;

      if (cloudData.currency) window.appState.currency = cloudData.currency;
      if (Array.isArray(cloudData.animals)) {
        window.appState.animals = cloudData.animals.filter(a => a.species !== 'bovin' && a.species !== 'ovin');
      }
      if (Array.isArray(cloudData.expenses)) {
        window.appState.expenses = cloudData.expenses;
      }
      if (Array.isArray(cloudData.sales)) {
        window.appState.sales = cloudData.sales;
      }
      if (Array.isArray(cloudData.incubatorBatches)) {
        window.appState.incubatorBatches = cloudData.incubatorBatches;
      }

      // Persist to local device storage as well (offline fallback)
      try {
        localStorage.setItem('fermegest_state', JSON.stringify({
          version: '2.5.0-pro',
          currency: window.appState.currency,
          lang: window.appState.lang,
          theme: window.appState.theme,
          animals: window.appState.animals,
          expenses: window.appState.expenses,
          sales: window.appState.sales,
          incubatorBatches: window.appState.incubatorBatches
        }));
      } catch (e) {}

      if (window.app) {
        if (app.updateCurrencySymbols) app.updateCurrencySymbols();
        if (app.renderAll) app.renderAll();
        if (app.runSimulator) app.runSimulator();
      }
    },

    // 9. UI Updates (Header, Drawer, Modals)
    updateUI() {
      const headerAuthBtn = document.getElementById('headerAuthBtn');
      const headerUserChip = document.getElementById('headerUserChip');
      const headerUserText = document.getElementById('headerUserText');
      const drawerAuthSection = document.getElementById('drawerAuthSection');

      const isAuth = !!this.currentUser;
      const email = this.currentUser ? (this.currentUser.email || 'Utilisateur') : '';
      const initial = email ? email[0].toUpperCase() : 'U';

      if (headerAuthBtn) {
        headerAuthBtn.style.display = isAuth ? 'none' : 'inline-flex';
      }
      if (headerUserChip) {
        headerUserChip.style.display = isAuth ? 'inline-flex' : 'none';
        if (headerUserText) {
          headerUserText.textContent = email.split('@')[0];
        }
        const initialEl = document.getElementById('headerUserInitial');
        if (initialEl) initialEl.textContent = initial;
      }

      if (drawerAuthSection) {
        if (isAuth) {
          drawerAuthSection.innerHTML = `
            <div class="drawer-user-card" onclick="appAuth.openProfileModal()">
              <div class="user-avatar">${initial}</div>
              <div class="user-details">
                <span class="user-email-text">${email}</span>
                <span class="user-sync-status">🟢 Synchronisé en direct</span>
              </div>
            </div>
          `;
        } else {
          drawerAuthSection.innerHTML = `
            <button type="button" class="btn btn-primary btn-full drawer-btn" onclick="app.toggleMobileMenu(); appAuth.openModal();">
              <span>👤</span>
              <span>Se Connecter / Synchroniser</span>
            </button>
          `;
        }
      }
    },

    updateSyncBadge(status) {
      const dot = document.getElementById('userSyncDot');
      if (!dot) return;
      dot.className = 'user-status-dot ' + (status || 'online');
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
      const emailEl = document.getElementById('profileModalEmail');
      const timeEl = document.getElementById('profileModalLastSync');

      if (emailEl && this.currentUser) {
        emailEl.textContent = this.currentUser.email;
      }
      if (timeEl) {
        timeEl.textContent = this.lastSyncedAt
          ? this.lastSyncedAt.toLocaleTimeString('fr-FR')
          : 'À l\'instant';
      }
      modal.classList.remove('hidden');
    },

    closeProfileModal() {
      const modal = document.getElementById('modalUserProfile');
      if (modal) modal.classList.add('hidden');
    }
  };

  window.appAuth = appAuth;
  window.switchAuthTab = function(mode) { appAuth.switchTab(mode); };
  window.handleAuthSubmit = function(e) { appAuth.handleSubmit(e); };

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => appAuth.init());
  } else {
    appAuth.init();
  }

})(window);
