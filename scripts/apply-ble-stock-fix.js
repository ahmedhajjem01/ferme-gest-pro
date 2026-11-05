const fs = require('fs');

console.log('=== Applying Ble Stock Persistence Fix ===');

// 1. PATCH supabase-client.js
let sb = fs.readFileSync('supabase-client.js', 'utf8');

// A. Remove staticFeedIds filter from getDeletedIds
const oldGetDeletedIds = `    getDeletedIds() {
      try {
        const raw = localStorage.getItem('fermegest_deleted_ids');
        if (raw) {
          const list = JSON.parse(raw);
          // Protect feed family IDs from being permanently tombstoned
          const staticFeedIds = ['feed-ble', 'feed-bouchon', 'feed-mais', 'feed-son', 'feed-demarrage', 'feed-feverole', 'feed-orge', 'feed-tournesol', 'feed-melange', 'feed-soja', 'feed-concentre', 'feed-croissance'];
          const filtered = list.filter(id => !staticFeedIds.includes(id));
          return new Set(filtered);
        }
      } catch (e) {}
      return new Set();
    },`;

const newGetDeletedIds = `    getDeletedIds() {
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
    },`;

if (sb.replace(/\r\n/g, '\n').includes(oldGetDeletedIds.replace(/\r\n/g, '\n'))) {
  sb = sb.replace(/\r\n/g, '\n').replace(oldGetDeletedIds.replace(/\r\n/g, '\n'), newGetDeletedIds.replace(/\r\n/g, '\n'));
  console.log(' [OK] supabase-client.js: getDeletedIds patched (staticFeedIds exclusion removed)');
} else {
  console.warn(' [!] Warning: oldGetDeletedIds not found in supabase-client.js');
}

// B. In applyCloudData(), filter tombstoned feedTypes
const oldCleanFeeds = `      // Keep feedTypes clean: remove any artificial feed-principal and sync total stock
      if (Array.isArray(state.feedTypes)) {
        state.feedTypes = state.feedTypes.filter(ft => 
          ft.id !== 'feed-principal' &&
          !(ft.name || '').toLowerCase().includes('principal') &&
          !(ft.name || '').includes('علف رئيسي')
        );
        if (state.feedTypes.length > 0) {
          state.feedStockKg = parseFloat(state.feedTypes.reduce((sum, ft) => sum + (Number(ft.stockKg) || 0), 0).toFixed(2));
        }
      }`;

const newCleanFeeds = `      // Keep feedTypes clean: remove any artificial feed-principal, tombstoned feeds, and sync total stock
      if (Array.isArray(state.feedTypes)) {
        const deletedIds = this.getDeletedIds();
        state.feedTypes = state.feedTypes.filter(ft => 
          ft && ft.id !== 'feed-principal' &&
          !deletedIds.has(String(ft.id)) &&
          !(ft.name || '').toLowerCase().includes('principal') &&
          !(ft.name || '').includes('علف رئيسي')
        );
        state.feedStockKg = parseFloat(state.feedTypes.reduce((sum, ft) => sum + (Number(ft.stockKg) || 0), 0).toFixed(2));
      }`;

if (sb.replace(/\r\n/g, '\n').includes(oldCleanFeeds.replace(/\r\n/g, '\n'))) {
  sb = sb.replace(/\r\n/g, '\n').replace(oldCleanFeeds.replace(/\r\n/g, '\n'), newCleanFeeds.replace(/\r\n/g, '\n'));
  console.log(' [OK] supabase-client.js: applyCloudData feedTypes tombstone filter added');
} else {
  console.warn(' [!] Warning: oldCleanFeeds not found in supabase-client.js');
}

fs.writeFileSync('supabase-client.js', sb, 'utf8');

// 2. PATCH app.js
let app = fs.readFileSync('app.js', 'utf8');
app = app.replace(/\r\n/g, '\n');

// A. detectFeedTypeFromText - replace with exact unicode word boundary regex
const oldDetect = `  detectFeedTypeFromText(text) {
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
  },`;

const newDetect = `  detectFeedTypeFromText(text) {
    if (!text) return null;
    const s = String(text);
    if (/(?<!\\p{L})(bouchon|bouchons|ponte|بوشون|بياض|بياضة)(?!\\p{L})/iu.test(s)) return 'bouchon';
    if (/(?<!\\p{L})(son|نخالة|النخالة|sedari|سداري|السداري)(?!\\p{L})/iu.test(s)) return 'son';
    if (/(?<!\\p{L})(blé|ble|قمح|القمح|بليه|البليه)(?!\\p{L})/iu.test(s)) return 'ble';
    if (/(?<!\\p{L})(maïs|mais|ذرة|الذرة|ذرَة|الذرَة)(?!\\p{L})/iu.test(s)) return 'mais';
    if (/(?<!\\p{L})(démarrage|demarrage|بداية|starter)(?!\\p{L})/iu.test(s)) return 'demarrage';
    if (/(?<!\\p{L})(feverole|féverole|feveroles|féveroles|فول|الفول)(?!\\p{L})/iu.test(s)) return 'feverole';
    if (/(?<!\\p{L})(orge|شعير|الشعير|barley)(?!\\p{L})/iu.test(s)) return 'orge';
    if (/(?<!\\p{L})(tournesol|عباد|قلوب|القلوب|sunflower)(?!\\p{L})/iu.test(s)) return 'tournesol';
    if (/(?<!\\p{L})(mélange|melange|خلطة|mixture)(?!\\p{L})/iu.test(s)) return 'melange';
    if (/(?<!\\p{L})(soja|صويا|الصويا|soy)(?!\\p{L})/iu.test(s)) return 'soja';
    if (/(?<!\\p{L})(concentré|concentre|مركز|cmv)(?!\\p{L})/iu.test(s)) return 'concentre';
    if (/(?<!\\p{L})(croissance|engraissement|تسمين|نمو|grower)(?!\\p{L})/iu.test(s)) return 'croissance';
    return null;
  },`;

if (app.includes(oldDetect)) {
  app = app.replace(oldDetect, newDetect);
  console.log(' [OK] app.js: detectFeedTypeFromText patched with unicode lookaround regexes');
} else {
  console.warn(' [!] Warning: oldDetect not found in app.js');
}

// B. isFeedInFamily - clean implementation
const oldIsFeedInFamily = `  isFeedInFamily(ft, family) {
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
  },`;

const newIsFeedInFamily = `  isFeedInFamily(ft, family) {
    if (!ft || !family) return false;
    const id = String(ft.id || '').toLowerCase();
    if (id === 'feed-' + family) return true;
    return this.detectFeedTypeFromText(ft.name) === family || this.detectFeedTypeFromText(id) === family;
  },`;

if (app.includes(oldIsFeedInFamily)) {
  app = app.replace(oldIsFeedInFamily, newIsFeedInFamily);
  console.log(' [OK] app.js: isFeedInFamily patched');
} else {
  console.warn(' [!] Warning: oldIsFeedInFamily not found in app.js');
}

// C. In loadState: do NOT purge deletedFeedIds & filter tombstoned feedTypes
const oldPurgeDeleted = `        // Purge any residual blacklist arrays from previous sessions to guarantee new purchases are never blocked
        appState.deletedFeedFamilies = [];
        appState.deletedFeedNames = [];
        appState.deletedFeedIds = [];

        this.synchronizeAnimalStages();
        this.reconcileFeedTypesFromExpenses();`;

const newPurgeDeleted = `        // Load persisted deleted feed tombstones
        appState.deletedFeedFamilies = Array.isArray(parsed.deletedFeedFamilies) ? parsed.deletedFeedFamilies : [];
        appState.deletedFeedNames = Array.isArray(parsed.deletedFeedNames) ? parsed.deletedFeedNames : [];
        appState.deletedFeedIds = Array.isArray(parsed.deletedFeedIds) ? parsed.deletedFeedIds : [];

        // Filter out any tombstoned feeds from appState.feedTypes
        const activeTombstones = (window.appAuth && typeof window.appAuth.getDeletedIds === 'function')
          ? window.appAuth.getDeletedIds()
          : new Set(appState.deletedFeedIds || []);
        if (Array.isArray(appState.feedTypes)) {
          appState.feedTypes = appState.feedTypes.filter(ft => ft && !activeTombstones.has(String(ft.id)));
        }

        this.synchronizeAnimalStages();
        this.reconcileFeedTypesFromExpenses();`;

if (app.includes(oldPurgeDeleted)) {
  app = app.replace(oldPurgeDeleted, newPurgeDeleted);
  console.log(' [OK] app.js: loadState tombstone persistence patched');
} else {
  console.warn(' [!] Warning: oldPurgeDeleted not found in app.js');
}

// D. In saveState: persist deletedFeedIds and deletedFeedFamilies
const oldSaveFeedTypes = `        feedDistributions: Array.isArray(appState.feedDistributions) ? appState.feedDistributions : [],
        feedTypes: Array.isArray(appState.feedTypes) ? appState.feedTypes : [],`;

const newSaveFeedTypes = `        feedDistributions: Array.isArray(appState.feedDistributions) ? appState.feedDistributions : [],
        feedTypes: Array.isArray(appState.feedTypes) ? appState.feedTypes : [],
        deletedFeedIds: Array.isArray(appState.deletedFeedIds) ? appState.deletedFeedIds : [],
        deletedFeedFamilies: Array.isArray(appState.deletedFeedFamilies) ? appState.deletedFeedFamilies : [],`;

if (app.includes(oldSaveFeedTypes)) {
  app = app.replace(oldSaveFeedTypes, newSaveFeedTypes);
  console.log(' [OK] app.js: saveState deletedFeedIds persistence added');
} else {
  console.warn(' [!] Warning: oldSaveFeedTypes not found in app.js');
}

// E. deleteFeedType: register deletion in appAuth tombstone set and appState.deletedFeedIds
const oldDeleteFeedType = `  deleteFeedType(id) {
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const ft = (appState.feedTypes || []).find(f => f.id === id);
    if (!ft) return;

    const displayName = this.getFeedDisplayName(ft);

    this.confirmDialog({
      title: isAr ? 'حذف العلف' : 'Supprimer l\\'aliment',
      message: isAr 
        ? \`هل تريد بالتأكيد حذف العلف "\${displayName}" من مخزون المستودع ؟\`
        : \`Voulez-vous vraiment supprimer l'aliment "\${displayName}" du stock en réserve ?\`,
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
        this.showToast(isAr ? \`تم حذف العلف "\${displayName}".\` : (isEn ? \`Feed "\${displayName}" deleted.\` : \`Aliment "\${displayName}" supprimé.\`));
      }
    });
  },`;

const newDeleteFeedType = `  deleteFeedType(id) {
    const isAr = appState.lang === 'ar';
    const isEn = appState.lang === 'en';
    const ft = (appState.feedTypes || []).find(f => f.id === id);
    if (!ft) return;

    const displayName = this.getFeedDisplayName(ft);

    this.confirmDialog({
      title: isAr ? 'حذف العلف' : 'Supprimer l\\'aliment',
      message: isAr 
        ? \`هل تريد بالتأكيد حذف العلف "\${displayName}" من مخزون المستودع ؟\`
        : \`Voulez-vous vraiment supprimer l'aliment "\${displayName}" du stock en réserve ?\`,
      isDanger: true,
      confirmText: isAr ? 'حذف' : 'Supprimer',
      onConfirm: () => {
        const family = this.detectFeedTypeFromText(ft.name) || this.detectFeedTypeFromText(ft.id);

        // 1. Enregistrer dans le système de tombstones (cloud + peer)
        if (window.appAuth && typeof window.appAuth.addDeletedId === 'function') {
          window.appAuth.addDeletedId(id);
          if (family) {
            window.appAuth.addDeletedId('feed-' + family);
          }
        }

        // 2. Mémoriser localement pour empêcher toute réconciliation automatique
        if (!Array.isArray(appState.deletedFeedIds)) appState.deletedFeedIds = [];
        if (!appState.deletedFeedIds.includes(id)) appState.deletedFeedIds.push(id);
        if (family) {
          if (!Array.isArray(appState.deletedFeedFamilies)) appState.deletedFeedFamilies = [];
          if (!appState.deletedFeedFamilies.includes(family)) appState.deletedFeedFamilies.push(family);
        }

        // 3. Détacher les dépenses liées à cet aliment pour qu'elles n'apparaissent plus comme actives dans ce stock
        (appState.expenses || []).forEach(e => {
          if (e.feedTypeId === id || (family && this.detectFeedTypeFromText(e.title) === family)) {
            e.feedStockDetached = true;
            e.feedStockAddedKg = 0;
            delete e.feedTypeId;
          }
        });

        // 4. Supprimer définitivement de feedTypes
        appState.feedTypes = (appState.feedTypes || []).filter(f => f.id !== id && (!family || !this.isFeedInFamily(f, family)));
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
        this.showToast(isAr ? \`تم حذف العلف "\${displayName}".\` : (isEn ? \`Feed "\${displayName}" deleted.\` : \`Aliment "\${displayName}" supprimé.\`));
      }
    });
  },`;

if (app.includes(oldDeleteFeedType)) {
  app = app.replace(oldDeleteFeedType, newDeleteFeedType);
  console.log(' [OK] app.js: deleteFeedType tombstone tracking added');
} else {
  console.warn(' [!] Warning: oldDeleteFeedType not found in app.js');
}

// F. In reconcileFeedTypesFromExpenses: do NOT create deleted feeds
const oldReconcileCreate = `      if (!ft) {
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
      } else {`;

const newReconcileCreate = `      if (!ft) {
        // Respecter les suppressions de l'utilisateur : ne JAMAIS ressusciter un aliment supprimé
        const deletedIds = (window.appAuth && typeof window.appAuth.getDeletedIds === 'function')
          ? window.appAuth.getDeletedIds()
          : new Set(appState.deletedFeedIds || []);
        const deletedFamilies = new Set(appState.deletedFeedFamilies || []);
        if (group.feedTypeId && deletedIds.has(String(group.feedTypeId))) return;
        if (group.family && (deletedFamilies.has(group.family) || deletedIds.has('feed-' + group.family))) return;

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
      } else {`;

if (app.includes(oldReconcileCreate)) {
  app = app.replace(oldReconcileCreate, newReconcileCreate);
  console.log(' [OK] app.js: reconcileFeedTypesFromExpenses deletion guard added');
} else {
  console.warn(' [!] Warning: oldReconcileCreate not found in app.js');
}

// G. In addFeedType: untombstone feed if explicitly re-added
const oldAddNewFeed = `    if (!Array.isArray(appState.feedTypes)) {
      appState.feedTypes = [];
    }
    appState.feedTypes.push(newType);`;

const newAddNewFeed = `    if (!Array.isArray(appState.feedTypes)) {
      appState.feedTypes = [];
    }
    appState.feedTypes.push(newType);

    // Si cet aliment avait été précédemment supprimé, lever le tombstone
    if (window.appAuth && typeof window.appAuth.removeDeletedId === 'function') {
      window.appAuth.removeDeletedId(newType.id);
      if (family) window.appAuth.removeDeletedId('feed-' + family);
    }
    if (Array.isArray(appState.deletedFeedIds)) {
      appState.deletedFeedIds = appState.deletedFeedIds.filter(id => id !== newType.id);
    }
    if (family && Array.isArray(appState.deletedFeedFamilies)) {
      appState.deletedFeedFamilies = appState.deletedFeedFamilies.filter(f => f !== family);
    }`;

if (app.includes(oldAddNewFeed)) {
  app = app.replace(oldAddNewFeed, newAddNewFeed);
  console.log(' [OK] app.js: addFeedType untombstone logic added');
} else {
  console.warn(' [!] Warning: oldAddNewFeed not found in app.js');
}

// H. In sanitizeFeedTypes: do not default blank to Blé & filter tombstoned feeds
const oldSanitizeBle = `      if (!name || name === 'قمح /' || name === 'Blé /') {
        name = 'Blé';
      }`;

const newSanitizeBle = `      if (name === 'قمح /' || name === 'Blé /') {
        name = 'Blé';
      }
      if (!name) {
        name = ft.id ? ft.id.replace(/^feed-/, '') : 'Aliment';
      }`;

if (app.includes(oldSanitizeBle)) {
  app = app.replace(oldSanitizeBle, newSanitizeBle);
  console.log(' [OK] app.js: sanitizeFeedTypes default name patched');
} else {
  console.warn(' [!] Warning: oldSanitizeBle not found in app.js');
}

// I. In sanitizeFeedTypes: filter out tombstoned feeds
const oldSanitizeFilter = `    // Eradicate any synthetic feed-principal
    list = list.filter(ft => 
      ft.id !== 'feed-principal' &&
      !(ft.name || '').toLowerCase().includes('principal') &&
      !(ft.name || '').includes('علف رئيسي')
    );`;

const newSanitizeFilter = `    // Eradicate any synthetic feed-principal or tombstoned feeds
    const activeTombstones = (window.appAuth && typeof window.appAuth.getDeletedIds === 'function')
      ? window.appAuth.getDeletedIds()
      : new Set((window.appState && window.appState.deletedFeedIds) || []);
    list = list.filter(ft => 
      ft &&
      ft.id !== 'feed-principal' &&
      !activeTombstones.has(String(ft.id)) &&
      !(ft.name || '').toLowerCase().includes('principal') &&
      !(ft.name || '').includes('علف رئيسي')
    );`;

if (app.includes(oldSanitizeFilter)) {
  app = app.replace(oldSanitizeFilter, newSanitizeFilter);
  console.log(' [OK] app.js: sanitizeFeedTypes tombstone filtering added');
} else {
  console.warn(' [!] Warning: oldSanitizeFilter not found in app.js');
}

fs.writeFileSync('app.js', app, 'utf8');

console.log('=== All Patches Applied Successfully ===');
