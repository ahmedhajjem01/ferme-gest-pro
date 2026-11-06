const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Update Tab 6 section
const oldTab6Regex = /<!-- ============================================== -->\s*<!-- TAB 6: INCUBATEUR & ÉCLOSION D'ŒUFS -->\s*<!-- ============================================== -->\s*<section id="tab-incubator" class="content-tab">[\s\S]*?<\/section>/;

const newTab6 = `<!-- ============================================== -->
        <!-- TAB 6: REPRODUCTION, COUVEUSE & NAISSANCES -->
        <!-- ============================================== -->
        <section id="tab-incubator" class="content-tab">
          <div class="section-header" style="flex-wrap: wrap; gap: 0.85rem; justify-content: space-between; align-items: center;">
            <div>
              <h2 class="section-title" id="reproductionSectionTitle" data-i18n="section_incubator_title">Incubateur & Gestion d'Éclosion</h2>
              <p class="section-desc" id="reproductionSectionDesc" data-i18n="section_incubator_desc">Date de mise en couveuse ("hachage"), étapes de mirage, transfert à l'éclosoir et compte à rebours de sortie de l'œuf.</p>
            </div>
            <div id="reproductionActionButtons" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button id="btnOpenIncubatorModal" class="btn btn-amber bold" onclick="app.openModal('modalAddBatch')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span data-i18n="btn_put_in_incubator">Mettre en Couveuse</span>
              </button>
              <button id="btnOpenGestationModal" class="btn btn-primary bold" style="background: linear-gradient(135deg, #ec4899, #be185d); border: none; display: none;" onclick="app.openModal('modalAddGestation')">
                <span>🤰</span>
                <span data-i18n="btn_add_gestation">+ Gestation / Saillie</span>
              </button>
            </div>
          </div>

          <!-- Filter Pills for Mixed Farms (Shown when farm has both poultry and cattle/sheep) -->
          <div id="reproductionFilterPills" style="display: none; margin-top: 0.75rem; margin-bottom: 1.15rem;">
            <div style="display: inline-flex; gap: 0.35rem; background: var(--bg-card); padding: 0.3rem 0.4rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); flex-wrap: wrap;">
              <button type="button" class="btn btn-xs bold reproduction-filter-btn active" data-filter="all" onclick="app.setReproductionFilter('all')">
                🌟 <span data-i18n="filter_all_births">Tout afficher</span>
              </button>
              <button type="button" class="btn btn-xs bold reproduction-filter-btn" data-filter="incubator" onclick="app.setReproductionFilter('incubator')">
                🐣 <span data-i18n="filter_incubator_only">Couveuse & Éclosions</span>
              </button>
              <button type="button" class="btn btn-xs bold reproduction-filter-btn" data-filter="gestation" onclick="app.setReproductionFilter('gestation')">
                🤰 <span data-i18n="filter_gestation_only">Gestations & Naissances</span>
              </button>
            </div>
          </div>

          <!-- Section A: Incubateur & Éclosions d'Œufs (Aviculture) -->
          <div id="incubatorSectionWrapper">
            <div id="incubatorSubheader" style="display: none; margin-top: 1rem; margin-bottom: 0.65rem; align-items: center; justify-content: space-between;">
              <h3 style="font-size: 1.05rem; font-weight: 800; color: #f59e0b; display: flex; align-items: center; gap: 0.4rem; margin: 0;">
                <span>🐣</span> <span data-i18n="filter_incubator_only">Couveuse & Éclosions d'Œufs</span>
              </h3>
            </div>
            <div class="incubator-batches-grid mt-2" id="incubatorBatchesGrid">
              <!-- Rendered by JS -->
            </div>
          </div>

          <!-- Section B: Gestations & Naissances (Bovins, Ovins, Caprins - Maternité) -->
          <div id="gestationSectionWrapper" style="display: none; margin-top: 1.5rem;">
            <div id="gestationSubheader" style="display: flex; margin-bottom: 0.65rem; align-items: center; justify-content: space-between;">
              <h3 style="font-size: 1.05rem; font-weight: 800; color: #ec4899; display: flex; align-items: center; gap: 0.4rem; margin: 0;">
                <span>🤰</span> <span data-i18n="section_gestation_title">Gestation & Suivi des Naissances (Vaches & Brebis)</span>
              </h3>
            </div>
            <div class="incubator-batches-grid mt-2" id="gestationBatchesGrid">
              <!-- Rendered by JS -->
            </div>
          </div>
        </section>`;

if (oldTab6Regex.test(html)) {
  html = html.replace(oldTab6Regex, newTab6);
  console.log('✔ Tab 6 successfully updated to Reproduction & Naissances!');
} else {
  console.error('ERROR: oldTab6Regex did not match!');
  process.exit(1);
}

// 2. Add IDs to Nav items
html = html.replace(
  '<span data-i18n="nav_incubator">Incubateur & Éclosion</span>',
  '<span id="navIncubatorText" data-i18n="nav_incubator">Incubateur & Éclosion</span>'
);

html = html.replace(
  '<span data-i18n="nav_incubator">Couveuse</span>',
  '<span id="mobileNavIncubatorText" data-i18n="nav_incubator">Couveuse</span>'
);

// 3. Add modalRecordBirth right after modalAddGestation
const modalBirthHtml = `

  <!-- Modal: Enregistrer une Naissance / Mise-Bas (Vêlage & Agnelage) -->
  <div id="modalRecordBirth" class="modal-overlay hidden">
    <div class="modal-card" style="max-width: 520px;">
      <div class="modal-header">
        <h3 style="display: flex; align-items: center; gap: 0.5rem;">
          <span>🍼</span> <span data-i18n="modal_record_birth_title">Déclarer une Naissance (Vêlage / Agnelage)</span>
        </h3>
        <button type="button" class="modal-close" onclick="app.closeModal('modalRecordBirth')">&times;</button>
      </div>
      <form id="formRecordBirth" novalidate onsubmit="app.handleSaveBirth(event)">
        <input type="hidden" id="birthMotherId">
        <div class="modal-body">
          
          <!-- Mother Info Summary Card -->
          <div id="birthMotherSummaryBox" style="background: rgba(236, 72, 153, 0.08); border: 1.5px solid rgba(236, 72, 153, 0.3); border-radius: var(--radius-md); padding: 0.75rem 0.9rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <span id="birthMotherIcon" style="font-size: 2rem;">🐄</span>
              <div>
                <h4 id="birthMotherName" style="margin: 0; font-size: 1rem; font-weight: 800; color: var(--text-main);">Vache Noiraude</h4>
                <small id="birthMotherSub" class="text-muted">Montbéliarde &bull; Gestation 283 jours</small>
              </div>
            </div>
            <span id="birthTypeBadge" class="badge-pill" style="background: rgba(236, 72, 153, 0.2); color: #ec4899; font-weight: 700;">🍼 Vêlage</span>
          </div>

          <!-- Date de mise-bas & Nombre de nouveau-nés -->
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="birthActualDate" class="form-label bold" data-i18n="lbl_birth_actual_date">Date réelle de mise-bas</label>
              <input type="date" id="birthActualDate" class="input-field" required>
            </div>
            <div class="form-group flex-1">
              <label for="birthOffspringCount" class="form-label bold" data-i18n="lbl_newborn_count">Nombre de petits nés</label>
              <input type="number" id="birthOffspringCount" class="input-field" min="1" max="10" value="1" required>
            </div>
          </div>

          <!-- Sexe & Destination / Catégorie du nouveau-né -->
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="birthGender" class="form-label bold" data-i18n="lbl_newborn_gender">Sexe du nouveau-né</label>
              <select id="birthGender" class="input-field">
                <option value="femelle" selected data-i18n="opt_gender_female">♀️ Femelle (Génisse / Agnelle)</option>
                <option value="male" data-i18n="opt_gender_male">♂️ Mâle (Veau mâle / Agneau)</option>
                <option value="mixte" data-i18n="opt_gender_mixed">Mixte (Jumeaux)</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label for="birthCategorySelect" class="form-label bold" data-i18n="lbl_newborn_category">Type à ajouter au cheptel</label>
              <select id="birthCategorySelect" class="input-field">
                <!-- Rempli dynamiquement selon espèce bovine vs ovine -->
              </select>
            </div>
          </div>

          <!-- Identifiant / Boucle & Poids de Naissance -->
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="birthName" class="form-label">
                <span data-i18n="lbl_newborn_name">Nom / N° Boucle du petit</span> <small class="text-muted" data-i18n="lbl_optional">(Optionnel)</small>
              </label>
              <input type="text" id="birthName" class="input-field" placeholder="Ex: TN-2026-001">
            </div>
            <div class="form-group flex-1">
              <label for="birthWeight" class="form-label">
                <span data-i18n="lbl_newborn_weight">Poids de naissance</span> (<span data-i18n="unit_kg">kg</span>) <small class="text-muted" data-i18n="lbl_optional">(Optionnel)</small>
              </label>
              <input type="number" id="birthWeight" class="input-field" step="0.5" min="0" placeholder="Ex: 40">
            </div>
          </div>

          <!-- Statut de la mère après mise-bas -->
          <div class="form-group">
            <label for="birthMotherStatus" class="form-label bold" data-i18n="lbl_mother_status_after">Statut de la mère après mise-bas</label>
            <select id="birthMotherStatus" class="input-field">
              <option value="lactation" selected data-i18n="opt_mother_dairy">🥛 Vache en lactation (Traite du lait)</option>
              <option value="allaitante" data-i18n="opt_mother_nursing">🍼 Allaitante (Nourrit ses petits)</option>
            </select>
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label for="birthNotes" class="form-label">
              <span data-i18n="lbl_notes">Notes / Observations</span> <small class="text-muted" data-i18n="lbl_optional">(Optionnel)</small>
            </label>
            <textarea id="birthNotes" class="input-field" rows="2" placeholder="Facilité de mise-bas, prise du colostrum, vigueur du petit..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" onclick="app.closeModal('modalRecordBirth')" data-i18n="btn_cancel">Annuler</button>
          <button type="submit" class="btn btn-primary bold" style="background: linear-gradient(135deg, #10b981, #059669); border: none;">
            <span>🍼</span> <span data-i18n="btn_save_birth">Ajouter le Nouveau-Né au Cheptel</span>
          </button>
        </div>
      </form>
    </div>
  </div>`;

if (!html.includes('id="modalRecordBirth"')) {
  const gestationCloseDiv = '</form>\n    </div>\n  </div>\n\n  <!-- Modal: Programmer un Vaccin';
  const gestationCloseDivCRLF = '</form>\r\n    </div>\r\n  </div>\r\n\r\n  <!-- Modal: Programmer un Vaccin';
  if (html.includes(gestationCloseDiv)) {
    html = html.replace(gestationCloseDiv, '</form>\n    </div>\n  </div>' + modalBirthHtml + '\n\n  <!-- Modal: Programmer un Vaccin');
    console.log('✔ modalRecordBirth added to index.html (LF)!');
  } else if (html.includes(gestationCloseDivCRLF)) {
    html = html.replace(gestationCloseDivCRLF, '</form>\r\n    </div>\r\n  </div>' + modalBirthHtml + '\r\n\r\n  <!-- Modal: Programmer un Vaccin');
    console.log('✔ modalRecordBirth added to index.html (CRLF)!');
  } else {
    console.warn('Could not find exact boundary for modalRecordBirth');
  }
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('✔ index.html updated successfully!');
