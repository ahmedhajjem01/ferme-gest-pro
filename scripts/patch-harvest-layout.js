const fs = require('fs');
const path = require('path');

const rootDir = 'C:/Users/espace info/.gemini/antigravity-ide/scratch/ferme-gest-pro';
const indexPath = path.join(rootDir, 'index.html');
const cssPath = path.join(rootDir, 'styles.css');
const appPath = path.join(rootDir, 'app.js');

// 1. PATCH index.html
let html = fs.readFileSync(indexPath, 'utf8');

const targetRegex = /<div class="harvest-cards-grid">[\s\S]*?<!-- Farm Daily Feed & Ration Card/;

const replacement = `<div class="harvest-cards-grid">
          <!-- Stock d'Œufs & Récolte Card -->
          <div class="egg-stock-card" id="eggStockCard">
            <div class="egg-stock-info-group">
              <div class="egg-stock-icon-bubble">🥚</div>
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.15rem;">
                  <h3 style="font-size: 1.05rem; font-weight: 800; margin: 0;" data-i18n="egg_stock_title">Stock d'Œufs & Réserve</h3>
                  <span class="badge-pill text-emerald" data-i18n="egg_stock_badge" style="font-size: 0.72rem;">Disponible</span>
                </div>
                <div style="font-size: 1.7rem; font-weight: 900; color: var(--text-main); line-height: 1.15;">
                  <span id="eggStockMainCount">0</span> <span style="font-size: 0.95rem; font-weight: 600; color: var(--text-secondary);" data-i18n="unit_eggs">œufs</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;" id="eggStockEquiv">
                  ~0 Haras &bull; ~0 Plateaux
                </div>
              </div>
            </div>

            <!-- Action buttons: 2 buttons per line grid -->
            <div class="egg-stock-actions-grid">
              <button type="button" class="btn btn-emerald egg-stock-btn" onclick="app.openDailyEggModal()" data-i18n="btn_record_harvest">
                ➕ Récolte
              </button>
              <button type="button" class="btn btn-secondary egg-stock-btn" onclick="app.openSellEggsModal()" data-i18n="btn_sell_from_stock">
                💰 Vente
              </button>
              <button type="button" class="btn btn-amber egg-stock-btn" onclick="app.openIncubateEggsModal()" data-i18n="btn_incubate_from_stock">
                🐣 Couveuse
              </button>
              <button type="button" class="btn btn-outline egg-stock-btn" onclick="app.openConsumeEggsModal()" data-i18n="btn_consume_stock" title="Déduire consommation ou pertes">
                🍽️ Conso
              </button>
            </div>
          </div>

          <!-- Stock de Lait & Réserve / Tank à Lait Card (Bovins) -->
          <div id="milkStockCard" class="milk-stock-card" style="display: none;">
            <div class="milk-stock-info-group">
              <div class="milk-stock-icon-bubble">🥛</div>
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.15rem;">
                  <h3 style="font-size: 1.05rem; font-weight: 800; margin: 0;" data-i18n="milk_stock_title">Tank à Lait & Réserve</h3>
                  <span class="badge-pill text-sky" data-i18n="milk_stock_badge" style="font-size: 0.72rem; background: rgba(2, 132, 199, 0.15); color: #0284c7;">Frais & Disponible</span>
                </div>
                <div style="font-size: 1.7rem; font-weight: 900; color: var(--text-main); line-height: 1.15;">
                  <span id="milkStockMainCount">0</span> <span style="font-size: 0.95rem; font-weight: 600; color: var(--text-secondary);" data-i18n="unit_liters">Litres</span>
                </div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;" id="milkStockEquiv">
                  ~0 Bidons (20L)
                </div>
              </div>
            </div>

            <!-- Action buttons: 2x2 grid -->
            <div class="egg-stock-actions-grid">
              <button type="button" class="btn btn-sky egg-stock-btn" onclick="app.openDailyMilkModal()" data-i18n="btn_record_milking">
                ➕ Traite
              </button>
              <button type="button" class="btn btn-secondary egg-stock-btn" onclick="app.openSellMilkModal()" data-i18n="btn_sell_milk">
                💰 Vente
              </button>
              <button type="button" class="btn btn-amber egg-stock-btn" onclick="app.openCalfMilkModal()" data-i18n="btn_calf_milk">
                🍼 Veaux
              </button>
              <button type="button" class="btn btn-outline egg-stock-btn" onclick="app.openConsumeMilkModal()" data-i18n="btn_consume_milk" title="Déduire consommation, transformation ou pertes">
                🍽️ Conso
              </button>
            </div>
          </div>
        </div>

        <!-- Statistiques & Courbe de Récolte des Œufs (Line Chart) -->
        <div id="eggProductionChartCard" class="panel-card egg-chart-panel">
          <div class="panel-header" style="flex-wrap: wrap; gap: 0.5rem; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.3rem;">📈</span>
              <div>
                <h3 style="margin: 0; font-size: 1.05rem; font-weight: 800;" data-i18n="egg_chart_title">Statistiques & Courbe des Œufs</h3>
                <small class="text-muted" data-i18n="egg_chart_sub">Évolution journalière de la récolte (Axe X : Date &bull; Axe Y : Nombre d'œufs)</small>
              </div>
            </div>

            <!-- Filtres de période : 7j, 14j, 30j, Tout -->
            <div class="egg-chart-period-filters" style="display: inline-flex; gap: 0.25rem; background: var(--bg-card); padding: 0.25rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <button type="button" class="egg-period-btn active" data-period="7d" onclick="app.setEggChartPeriod('7d')" data-i18n="egg_chart_period_7d">7j</button>
              <button type="button" class="egg-period-btn" data-period="14d" onclick="app.setEggChartPeriod('14d')" data-i18n="egg_chart_period_14d">14j</button>
              <button type="button" class="egg-period-btn" data-period="30d" onclick="app.setEggChartPeriod('30d')" data-i18n="egg_chart_period_30d">30j</button>
              <button type="button" class="egg-period-btn" data-period="all" onclick="app.setEggChartPeriod('all')" data-i18n="egg_chart_period_all">Tout</button>
            </div>
          </div>

          <!-- Bandeau Métriques Clés (Total, Moyenne/j, Record Pic, Taux de ponte) -->
          <div class="egg-chart-metrics-strip" id="eggChartMetricsStrip">
            <!-- Rempli dynamiquement -->
          </div>

          <!-- Conteneur du Graphique Vectoriel (SVG Line Chart) -->
          <div class="panel-body" style="padding: 0.75rem 0.65rem 0.5rem 0.65rem; overflow-x: auto;">
            <div id="eggChartContainer" style="width: 100%; min-width: 300px; position: relative;">
              <!-- Rendu dynamique du graphique -->
            </div>
          </div>
        </div>

        <!-- Statistiques & Courbe de Traite / Production de Lait (Line Chart) -->
        <div id="milkProductionChartCard" class="panel-card milk-chart-panel" style="display: none;">
          <div class="panel-header" style="flex-wrap: wrap; gap: 0.5rem; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.3rem;">🥛</span>
              <div>
                <h3 style="margin: 0; font-size: 1.05rem; font-weight: 800;" data-i18n="milk_chart_title">Statistiques & Courbe du Lait</h3>
                <small class="text-muted" data-i18n="milk_chart_sub">Évolution journalière de la traite (Axe X : Date • Axe Y : Litres de lait)</small>
              </div>
            </div>

            <!-- Filtres de période : 7j, 14j, 30j, Tout -->
            <div class="milk-chart-period-filters" style="display: inline-flex; gap: 0.25rem; background: var(--bg-card); padding: 0.25rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              <button type="button" class="milk-period-btn active" data-period="7d" onclick="app.setMilkChartPeriod('7d')" data-i18n="milk_chart_period_7d">7j</button>
              <button type="button" class="milk-period-btn" data-period="14d" onclick="app.setMilkChartPeriod('14d')" data-i18n="milk_chart_period_14d">14j</button>
              <button type="button" class="milk-period-btn" data-period="30d" onclick="app.setMilkChartPeriod('30d')" data-i18n="milk_chart_period_30d">30j</button>
              <button type="button" class="milk-period-btn" data-period="all" onclick="app.setMilkChartPeriod('all')" data-i18n="milk_chart_period_all">Tout</button>
            </div>
          </div>

          <!-- Bandeau Métriques Clés (Total L, Moyenne L/j, Record Pic, Rendement/vache) -->
          <div class="milk-chart-metrics-strip" id="milkChartMetricsStrip">
            <!-- Rempli dynamiquement -->
          </div>

          <!-- Conteneur du Graphique Vectoriel (SVG Line Chart) -->
          <div class="panel-body" style="padding: 0.75rem 0.65rem 0.5rem 0.65rem; overflow-x: auto;">
            <div id="milkChartContainer" style="width: 100%; min-width: 300px; position: relative;">
              <!-- Rendu dynamique du graphique -->
            </div>
          </div>
        </div>

        <!-- Farm Daily Feed & Ration Card`;

if (!targetRegex.test(html)) {
  console.error('ERROR: targetRegex did not match in index.html!');
  process.exit(1);
}

html = html.replace(targetRegex, replacement);
fs.writeFileSync(indexPath, html, 'utf8');
console.log('✔ index.html successfully updated with clean harvest layout!');

// 2. PATCH styles.css
let css = fs.readFileSync(cssPath, 'utf8');

// Update harvest-cards-grid styling
const cssGridRegex = /\/\* Responsive container when both egg & milk harvest cards are visible \*\/[\s\S]*?@media \(min-width: 960px\) \{[\s\S]*?\}\s*\}/;

const newCssGrid = `/* Responsive container when both egg & milk harvest cards are visible */
.harvest-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.15rem;
  margin-bottom: 1.35rem;
}
@media (min-width: 1024px) {
  .harvest-cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(460px, 1fr));
    align-items: stretch;
  }
  .harvest-cards-grid .egg-stock-card,
  .harvest-cards-grid .milk-stock-card {
    margin-bottom: 0;
    height: 100%;
  }
}`;

if (cssGridRegex.test(css)) {
  css = css.replace(cssGridRegex, newCssGrid);
  console.log('✔ Updated .harvest-cards-grid CSS rule');
} else {
  console.warn('⚠ Could not match cssGridRegex, checking if new rule exists');
}

// Ensure .milk-stock-card is included in mobile media query
const oldMediaQuery = `@media (max-width: 680px) {
  .egg-stock-card {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
    gap: 0.9rem;
  }
  .egg-stock-actions-grid {
    max-width: 100%;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
}`;

const newMediaQuery = `@media (max-width: 680px) {
  .egg-stock-card,
  .milk-stock-card {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
    gap: 0.9rem;
  }
  .egg-stock-actions-grid {
    max-width: 100%;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
}`;

if (css.includes(oldMediaQuery)) {
  css = css.replace(oldMediaQuery, newMediaQuery);
  console.log('✔ Updated @media (max-width: 680px) to include .milk-stock-card');
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('✔ styles.css successfully updated!');

// 3. PATCH app.js to toggle harvest-cards-grid display
let appJs = fs.readFileSync(appPath, 'utf8');

const targetAppJs = `    const milkChartCard = document.getElementById('milkProductionChartCard');
    if (milkChartCard) {
      milkChartCard.style.display = hasCattle ? '' : 'none';
    }`;

const replacementAppJs = `    const milkChartCard = document.getElementById('milkProductionChartCard');
    if (milkChartCard) {
      milkChartCard.style.display = hasCattle ? '' : 'none';
    }

    const harvestCardsGrid = document.querySelector('.harvest-cards-grid');
    if (harvestCardsGrid) {
      harvestCardsGrid.style.display = (hasPoultry || hasCattle) ? '' : 'none';
    }`;

if (appJs.includes(targetAppJs) && !appJs.includes('const harvestCardsGrid =')) {
  appJs = appJs.replace(targetAppJs, replacementAppJs);
  fs.writeFileSync(appPath, appJs, 'utf8');
  console.log('✔ app.js successfully updated with harvestCardsGrid toggle!');
}

console.log('All patches applied cleanly!');
