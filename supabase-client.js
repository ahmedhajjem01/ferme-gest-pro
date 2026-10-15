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
    collabChannel: null,
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
        this.subscribeCollaborativeRealtime();
      } else {
        this.currentUser = null;
        if (this.realtimeChannel && this.client) {
          try { this.client.removeChannel(this.realtimeChannel); } catch (e) {}
        }
        if (this.collabChannel && this.client) {
          try { this.client.removeChannel(this.collabChannel); } catch (e) {}
        }
        this.realtimeChannel = null;
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
          alert('Erreur Google: ' + (err.message || err));
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
          alert('Erreur Facebook: ' + (err.message || err));
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

        // Real-time instant broadcast to partner device
        this.broadcastCurrentState();

        if (showToast && window.app && app.showToast) {
          app.showToast('☁️ Données sauvegardées sur le Cloud !');
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
      if (cloudData.incubatorBatches) window.appState.incubatorBatches = cloudData.incubatorBatches;

      if (cloudData.farmCode && this.getFarmRole() === 'partner') {
        localStorage.setItem('fermegest_farm_code', cloudData.farmCode);
      }
      if (cloudData.ownerEmail) {
        localStorage.setItem('fermegest_farm_owner_email', cloudData.ownerEmail);
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
          const role = this.getFarmRole();
          const roleText = role === 'partner' ? '🤝 Associé' : '👑 Propriétaire';
          drawerAuthSection.innerHTML = `
            <div class="drawer-user-card" onclick="if(window.app && app.closeMobileMenu) app.closeMobileMenu(); appAuth.openProfileModal();">
              <div class="user-avatar">${initial}</div>
              <div class="user-details">
                <span class="user-email-text">${email}</span>
                <span class="user-sync-status">🟢 En ligne &bull; ${roleText}</span>
              </div>
            </div>
          `;
        } else {
          drawerAuthSection.innerHTML = `
            <button type="button" class="btn btn-primary btn-full drawer-btn" onclick="if(window.app && app.closeMobileMenu) app.closeMobileMenu(); appAuth.openModal();">
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

    // Team & Shared Farm methods (2 Accounts Collaboration)
    getFarmCode() {
      let code = localStorage.getItem('fermegest_farm_code');
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
      if (!confirm('Voulez-vous vraiment quitter cette ferme partagée ? Vous repasserez en mode ferme individuelle.')) {
        return;
      }

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
    },

    // Canal Realtime Collaboratif (Pièce partagée entre les deux comptes)
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
            if (payload && payload.payload) {
              const data = payload.payload;
              const sender = data.senderEmail || 'Votre associé';
              // Ignorer ses propres messages
              if (this.currentUser && data.senderId === this.currentUser.id) return;

              if (data.farmData) {
                this.applyCloudData(data.farmData);
                this.lastSyncedAt = new Date();
                this.updateUI();
                if (window.app && app.showToast) {
                  const name = sender.split('@')[0];
                  const msg = (window.app && app.t)
                    ? app.t('team_toast_partner_update', { name: name })
                    : `🔄 Mis à jour en direct par votre associé (${name}) !`;
                  app.showToast(msg);
                }
              }
            }
          })
          .on('broadcast', { event: 'request_state' }, (payload) => {
            // L'associé vient de se connecter ou de rejoindre, on lui envoie les dernières données
            this.broadcastCurrentState();
            if (payload && payload.payload && window.app && app.showToast) {
              const requester = payload.payload.requesterEmail || 'Un associé';
              if (!this.currentUser || payload.payload.requesterEmail !== this.currentUser.email) {
                app.showToast((window.app && app.t) ? app.t('team_toast_partner_joined') : `🤝 Associé connecté (${requester.split('@')[0]}) !`);
              }
            }
          })
          .subscribe((status) => {
            console.log(`[CollabRoom] Subscribed to ${farmCode}:`, status);
            if (status === 'SUBSCRIBED' && this.getFarmRole() === 'partner') {
              try {
                this.collabChannel.send({
                  type: 'broadcast',
                  event: 'request_state',
                  payload: {
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
      if (!this.collabChannel) return;
      const farmCode = this.getFarmCode();
      const payload = {
        version: '2.5.0-pro',
        farmCode: farmCode,
        farmRole: this.getFarmRole(),
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
        this.collabChannel.send({
          type: 'broadcast',
          event: 'farm_update',
          payload: {
            senderId: this.currentUser ? this.currentUser.id : null,
            senderEmail: this.currentUser ? this.currentUser.email : 'Associé',
            farmData: payload
          }
        });
      } catch (e) {}
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
          this.applyCloudData(cloudData);
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
      const emailEl = document.getElementById('profileModalEmail');
      const timeEl = document.getElementById('profileModalLastSync');

      if (emailEl) {
        emailEl.textContent = this.currentUser ? this.currentUser.email : 'Mode Local (Invité)';
      }
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
  window.switchAuthTab = function(mode) { appAuth.switchTab(mode); };
  window.handleAuthSubmit = function(e) { appAuth.handleSubmit(e); };

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => appAuth.init());
  } else {
    appAuth.init();
  }

})(window);
