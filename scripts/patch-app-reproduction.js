const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

const reproductionCode = `
  // ==========================================
  // GESTATION, REPRODUCTION & BIRTH MONITORING
  // ==========================================
  getActiveGestations() {
    const gestations = [];
    const today = this.getTodayDate();

    (appState.animals || []).forEach(animal => {
      if (!animal) return;
      const st = String(animal.stage || '').toLowerCase();
      const isPregnantFlag = animal.isPregnant === true || st.includes('gestant') || st.includes('حامل') || st.includes('عشار');
      
      if (isPregnantFlag) {
        const sp = String(animal.species || 'vache_laitiere').toLowerCase();
        const isBovine = (sp.includes('vache') || sp.includes('bovin') || sp.includes('genisse') || sp.includes('cow') || sp.includes('cattle'));
        const isOvine = (sp.includes('brebis') || sp.includes('mouton') || sp.includes('agneau') || sp.includes('sheep'));
        const isCaprine = (sp.includes('chevre') || sp.includes('caprin') || sp.includes('goat'));

        const totalDays = isBovine ? 283 : 150;
        const matingDate = animal.matingDate || this.getTodayStr();
        const birthDate = animal.expectedBirthDate || this.addDays(matingDate, totalDays);
        const dryDate = animal.dryingOffDate || this.addDays(matingDate, isBovine ? 223 : 120);

        const startDateObj = new Date(matingDate);
        const birthDateObj = new Date(birthDate);

        const daysElapsed = Math.max(0, Math.floor((today - startDateObj) / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.ceil((birthDateObj - today) / (1000 * 60 * 60 * 24));
        const progressPct = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));

        const stageInfo = this.getGestationStageInfo(daysElapsed, totalDays, isBovine);

        gestations.push({
          animalId: animal.id,
          animal,
          name: this.getAnimalDisplayName(animal),
          species: animal.species,
          breed: (animal.breed && animal.breed !== '-') ? animal.breed : '',
          isBovine,
          isOvine,
          isCaprine,
          matingDate,
          birthDate,
          dryDate,
          sire: animal.sire || '',
          notes: animal.reproductionNotes || '',
          totalDays,
          daysElapsed,
          daysRemaining,
          progressPct,
          stageInfo
        });
      }
    });

    return gestations;
  },

  getGestationStageInfo(elapsed, total, isBovine) {
    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';

    if (isBovine) {
      if (elapsed < 60) {
        return {
          title: isAr ? '🌱 بداية الحمل (تثبيت الجنين)' : (isEn ? 'Early Gestation' : '🌱 Début de Gestation'),
          desc: isAr ? 'مراقبة الشبق والفحص بالإيكوغرافيا في اليوم +60' : (isEn ? 'Heat check, ultrasound at Day +60' : 'Surveillance des chaleurs. Échographie à J+60.')
        };
      }
      if (elapsed < 150) {
        return {
          title: isAr ? '🔍 ثبوت الحمل وتطور الجنين' : (isEn ? 'Confirmed Gestation' : '🔍 Gestation Confirmée'),
          desc: isAr ? 'تطور فسيولوجي منتظم وتغذية متوازنة' : (isEn ? 'Steady fetal development, balanced diet' : 'Développement fœtal régulier.')
        };
      }
      if (elapsed < 223) {
        return {
          title: isAr ? '📈 نمو الجنين النشط' : (isEn ? 'Active Fetal Growth' : '📈 Croissance Active du Veau'),
          desc: isAr ? 'زيادة احتياجات البقرة من الطاقة والبروتين' : (isEn ? 'Higher energy needs, pre-dryoff prep' : 'Besoins énergétiques accrus.')
        };
      }
      if (elapsed < 276) {
        return {
          title: isAr ? '🥛 فترة التجفيف وراحة الضرع' : (isEn ? 'Dry-off Period' : '🥛 Période de Tarissement'),
          desc: isAr ? 'إيقاف الحلب للراحة وتجهيز اللبأ' : (isEn ? 'Stop milking for udder rest & colostrum' : 'Arrêt de la traite 60j avant vêlage.')
        };
      }
      return {
        title: isAr ? '🚨 اقتراب موعد الولادة (الفطام)' : (isEn ? '🚨 Calving Imminent!' : '🚨 Vêlage Imminent !'),
        desc: isAr ? 'تجهيز مكان الولادة ومراقبة علامات المخاض' : (isEn ? 'Prepare maternity pen & monitor signs' : 'Préparer le box de mise-bas.')
      };
    } else {
      // Ovine / Caprine (150 days)
      if (elapsed < 50) {
        return {
          title: isAr ? '🌱 بداية الحمل والتعشير' : (isEn ? 'Early Gestation' : '🌱 Début de Gestation'),
          desc: isAr ? 'تثبيت الأجنة وفحص الإيكو في اليوم 50' : (isEn ? 'Embryonic development, echo at Day 50' : 'Implantation embryonnaire. Écho vers J+50.')
        };
      }
      if (elapsed < 100) {
        return {
          title: isAr ? '🔍 ثبوت الحمل وتطور الحملان' : (isEn ? 'Confirmed Gestation' : '🔍 Gestation Confirmée'),
          desc: isAr ? 'تغذية متدرجة وتوفير الأملاح' : (isEn ? 'Gradual feeding & mineral support' : 'Développement fœtal.')
        };
      }
      if (elapsed < 140) {
        return {
          title: isAr ? '💉 الثلث الأخير من الحمل' : (isEn ? 'Late Gestation Booster' : '💉 Dernier Tiers de Gestation'),
          desc: isAr ? 'تطعيم قبل الولادة لمناعة اللبأ للخراف' : (isEn ? 'Pre-lambing vaccine for colostrum' : 'Rappel vaccin entérotoxémie.')
        };
      }
      return {
        title: isAr ? '🚨 اقتراب موعد ولادة الخراف' : (isEn ? '🚨 Lambing Imminent!' : '🚨 Agnelage Imminent !'),
        desc: isAr ? 'عزل النعجة في مكان دافئ ونظيف' : (isEn ? 'Isolate ewe in clean, warm pen' : 'Isoler la brebis dans un box propre.')
      };
    }
  },

  renderGestations() {
    const grid = document.getElementById('gestationBatchesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const gestations = this.getActiveGestations();
    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';

    if (gestations.length === 0) {
      grid.innerHTML = \`
        <div class="empty-state-card" style="grid-column: 1/-1; text-align: center; padding: 2.75rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 2px dashed rgba(236, 72, 153, 0.35);">
          <div style="font-size: 3rem; margin-bottom: 0.8rem;">🍼</div>
          <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem;">\${this.t('empty_gestations_title')}</h3>
          <p class="text-muted" style="max-width: 520px; margin: 0 auto 1.5rem; font-size: 0.9rem;">
            \${this.t('empty_gestations_desc')}
          </p>
          <button class="btn btn-primary bold" style="background: linear-gradient(135deg, #ec4899, #be185d); border: none;" onclick="app.openModal('modalAddGestation')">
            <span>🤰</span> <span>\${this.t('btn_add_gestation')}</span>
          </button>
        </div>
      \`;
      return;
    }

    gestations.forEach(g => {
      const icon = g.isBovine ? '🐄' : (g.isCaprine ? '🐐' : '🐑');
      const speciesLabel = g.isBovine 
        ? (isAr ? 'بقرة' : (isEn ? 'Cow' : 'Vache Laitière'))
        : (isAr ? 'نعجة' : (isEn ? 'Ewe' : 'Brebis'));

      const isImminent = g.daysRemaining <= 7;
      const isPastDue = g.daysRemaining <= 0;

      const countdownText = isPastDue
        ? (isAr ? '🚨 موعد الولادة قد حان !' : (isEn ? '🚨 Birth Due Now!' : '🚨 Terme Échu / Mise-bas Imminente !'))
        : \`\${g.daysRemaining} \${isAr ? 'يوماً' : (isEn ? 'days' : 'jours')}\`;

      const card = document.createElement('div');
      card.className = 'batch-card gestation-card';
      card.innerHTML = \`
        <div class="batch-header">
          <div class="batch-icon-title">
            <span class="icon" style="background: rgba(236, 72, 153, 0.18);">\${icon}</span>
            <div>
              <h3 class="batch-name">\${g.name}</h3>
              <p class="batch-species">\${g.breed ? g.breed + ' &bull; ' : ''}\${speciesLabel}\${g.sire ? ' &bull; ' + (isAr ? 'الفحل: ' : 'Sire: ') + g.sire : ''}</p>
            </div>
          </div>
          <span class="badge-pill" style="background: rgba(236, 72, 153, 0.18); color: #ec4899; font-weight: 700;">
            \${g.daysElapsed >= g.totalDays ? '🍼 ' + (isAr ? 'الولادة' : 'Mise-bas') : 'J ' + g.daysElapsed + '/' + g.totalDays}
          </span>
        </div>

        <div class="batch-progress-wrapper">
          <div class="batch-progress-header">
            <span>\${g.isBovine ? (isAr ? 'تقدم الحمل (الولادة)' : 'Progression Gestation Vêlage') : (isAr ? 'تقدم الحمل (الولادة)' : 'Progression Gestation Agnelage')}</span>
            <span class="bold" style="color: #ec4899;">\${g.progressPct}%</span>
          </div>
          <div class="batch-progress-bar">
            <div class="batch-progress-fill gestation-progress-fill" style="width: \${g.progressPct}%;"></div>
          </div>
        </div>

        <div class="batch-countdown-box">
          <div>
            <span class="countdown-label">\${isAr ? 'المرحلة الحالية:' : 'Étape actuelle :'}</span>
            <p class="bold" style="font-size: 0.9rem; color: #f472b6;">\${g.stageInfo.title}</p>
            <small class="text-muted">\${g.stageInfo.desc}</small>
          </div>
          <div style="text-align: right;">
            <span class="countdown-label">\${this.t('lbl_days_before_birth')} :</span>
            <p class="countdown-value" style="color: \${isImminent ? '#f43f5e' : '#ec4899'};">\${countdownText}</p>
            <small class="text-muted">\${this.t('lbl_birth_due')} : \${this.formatDateFR(g.birthDate)}</small>
          </div>
        </div>

        <div class="batch-parameters-row" style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-secondary); flex-wrap:wrap; gap:0.35rem;">
          <span>📅 <strong>\${isAr ? 'التلقيح: ' : 'Saillie : '}\${this.formatDateFR(g.matingDate)}</strong></span>
          <span>🥛 <strong>\${g.isBovine ? (isAr ? 'التجفيف: ' : 'Tarissement : ') : (isAr ? 'التطعيم: ' : 'Vaccin : ')}\${this.formatDateFR(g.dryDate)}</strong></span>
        </div>

        <div class="batch-card-actions" style="display: flex; gap: 0.5rem; margin-top: auto;">
          <button type="button" class="btn btn-sm btn-primary flex-1 bold" style="background: linear-gradient(135deg, #ec4899, #be185d); border: none;" onclick="app.openRecordBirthModal('\${g.animalId}')">
            <span>🍼</span> <span>\${this.t('btn_record_birth')}</span>
          </button>
          <button type="button" class="btn btn-sm btn-outline" style="border-color: rgba(236, 72, 153, 0.4); color: #ec4899;" onclick="app.cancelGestation('\${g.animalId}')" title="\${isAr ? 'إلغاء الحمل' : 'Annuler la gestation'}">
            🗑️
          </button>
        </div>
      \`;
      grid.appendChild(card);
    });
  },

  renderReproductionTab() {
    const managedTypes = this.getUserManagedAnimalTypes();
    const hasPoultry = managedTypes.includes('poultry');
    const hasMammals = managedTypes.includes('cattle') || managedTypes.includes('sheep');

    const titleEl = document.getElementById('reproductionSectionTitle');
    const descEl = document.getElementById('reproductionSectionDesc');
    const btnInc = document.getElementById('btnOpenIncubatorModal');
    const btnGest = document.getElementById('btnOpenGestationModal');
    const filterPills = document.getElementById('reproductionFilterPills');
    const incWrapper = document.getElementById('incubatorSectionWrapper');
    const incSubheader = document.getElementById('incubatorSubheader');
    const gestWrapper = document.getElementById('gestationSectionWrapper');
    const gestSubheader = document.getElementById('gestationSubheader');

    const filter = appState.reproductionFilter || 'all';

    if (hasMammals && !hasPoultry) {
      // Mammals only (Cattle and/or Sheep)
      if (titleEl) {
        titleEl.setAttribute('data-i18n', 'section_gestation_title');
        titleEl.textContent = this.t('section_gestation_title');
      }
      if (descEl) {
        descEl.setAttribute('data-i18n', 'section_gestation_desc');
        descEl.textContent = this.t('section_gestation_desc');
      }
      if (btnInc) btnInc.style.display = 'none';
      if (btnGest) btnGest.style.display = '';
      if (filterPills) filterPills.style.display = 'none';
      if (incWrapper) incWrapper.style.display = 'none';
      if (gestWrapper) {
        gestWrapper.style.display = '';
        gestWrapper.style.marginTop = '0';
      }
      if (gestSubheader) gestSubheader.style.display = 'none';
    } else if (hasPoultry && !hasMammals) {
      // Poultry only
      if (titleEl) {
        titleEl.setAttribute('data-i18n', 'section_incubator_title');
        titleEl.textContent = this.t('section_incubator_title');
      }
      if (descEl) {
        descEl.setAttribute('data-i18n', 'section_incubator_desc');
        descEl.textContent = this.t('section_incubator_desc');
      }
      if (btnInc) btnInc.style.display = '';
      if (btnGest) btnGest.style.display = 'none';
      if (filterPills) filterPills.style.display = 'none';
      if (incWrapper) incWrapper.style.display = '';
      if (incSubheader) incSubheader.style.display = 'none';
      if (gestWrapper) gestWrapper.style.display = 'none';
    } else {
      // Mixed farm (Poultry AND Mammals)
      if (titleEl) {
        titleEl.setAttribute('data-i18n', 'section_reproduction_mixed_title');
        titleEl.textContent = this.t('section_reproduction_mixed_title');
      }
      if (descEl) {
        descEl.setAttribute('data-i18n', 'section_reproduction_mixed_desc');
        descEl.textContent = this.t('section_reproduction_mixed_desc');
      }
      if (btnInc) btnInc.style.display = '';
      if (btnGest) btnGest.style.display = '';
      if (filterPills) filterPills.style.display = '';

      if (filter === 'incubator') {
        if (incWrapper) incWrapper.style.display = '';
        if (incSubheader) incSubheader.style.display = 'none';
        if (gestWrapper) gestWrapper.style.display = 'none';
      } else if (filter === 'gestation') {
        if (incWrapper) incWrapper.style.display = 'none';
        if (gestWrapper) {
          gestWrapper.style.display = '';
          gestWrapper.style.marginTop = '0';
        }
        if (gestSubheader) gestSubheader.style.display = 'none';
      } else {
        // All
        if (incWrapper) incWrapper.style.display = '';
        if (incSubheader) incSubheader.style.display = 'flex';
        if (gestWrapper) {
          gestWrapper.style.display = '';
          gestWrapper.style.marginTop = '1.75rem';
        }
        if (gestSubheader) gestSubheader.style.display = 'flex';
      }
    }

    // Render contents
    this.renderIncubatorBatches();
    this.renderGestations();

    // Update badge count
    const incCount = (appState.incubatorBatches || []).length;
    const gestCount = this.getActiveGestations().length;
    const badge = document.getElementById('countIncubatorBadge');
    if (badge) {
      const totalActive = (hasPoultry ? incCount : 0) + (hasMammals ? gestCount : 0);
      badge.textContent = totalActive;
      badge.style.display = totalActive > 0 ? '' : 'none';
    }
  },

  setReproductionFilter(filter) {
    appState.reproductionFilter = filter || 'all';
    document.querySelectorAll('.reproduction-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-filter') === appState.reproductionFilter);
    });
    this.renderReproductionTab();
  },

  openRecordBirthModal(animalId) {
    const animal = (appState.animals || []).find(a => a.id === animalId);
    if (!animal) return;

    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';

    const sp = String(animal.species || 'vache_laitiere').toLowerCase();
    const isBovine = (sp.includes('vache') || sp.includes('bovin') || sp.includes('genisse'));
    const isOvine = (sp.includes('brebis') || sp.includes('mouton') || sp.includes('agneau'));

    document.getElementById('birthMotherId').value = animal.id;
    document.getElementById('birthMotherName').textContent = this.getAnimalDisplayName(animal);
    document.getElementById('birthMotherIcon').textContent = isBovine ? '🐄' : (isOvine ? '🐑' : '🐐');

    const totalDays = isBovine ? 283 : 150;
    document.getElementById('birthMotherSub').textContent = \`\${animal.breed ? animal.breed + ' • ' : ''}\${isAr ? 'عشار ' + totalDays + ' يوماً' : 'Gestation ' + totalDays + ' jours'}\`;
    document.getElementById('birthTypeBadge').textContent = isBovine 
      ? (isAr ? '🍼 ولادة عجل (فطام)' : '🍼 Vêlage')
      : (isAr ? '🍼 ولادة خراف' : '🍼 Agnelage');

    document.getElementById('birthActualDate').value = this.getTodayStr();
    document.getElementById('birthOffspringCount').value = isBovine ? 1 : 1;
    document.getElementById('birthGender').value = 'femelle';
    document.getElementById('birthName').value = '';
    document.getElementById('birthWeight').value = isBovine ? '38' : '4';
    document.getElementById('birthNotes').value = '';

    // Populate category select
    const catSelect = document.getElementById('birthCategorySelect');
    if (catSelect) {
      if (isBovine) {
        catSelect.innerHTML = \`
          <option value="veau_laitier" selected>\${isAr ? '🐄 عجلة / عجل حلوب (تربية واستبدال)' : (isEn ? 'Dairy Calf / Heifer' : '🐄 Génisse / Veau Laitier (Élevage)')}</option>
          <option value="veau_engraissement">\${isAr ? '🐂 عجل تسمين / لحم' : (isEn ? 'Beef Calf / Fattening' : '🐂 Veau d\\'Engraissement / Viande')}</option>
        \`;
      } else {
        catSelect.innerHTML = \`
          <option value="agneau" selected>\${isAr ? '🐑 خروف / نعجة صغيرة (تربية)' : (isEn ? 'Lamb / Ewe Lamb' : '🐑 Agneau / Agnelle (Élevage)')}</option>
          <option value="agneau_engraissement">\${isAr ? '🥩 خروف تسمين / علوش العيد' : (isEn ? 'Fattening Lamb' : '🥩 Agneau d\\'Engraissement / Tabaski')}</option>
        \`;
      }
    }

    // Populate mother status after delivery
    const statusSelect = document.getElementById('birthMotherStatus');
    if (statusSelect) {
      if (isBovine) {
        statusSelect.innerHTML = \`
          <option value="lactation" selected>\${isAr ? '🥛 بقرة في الإنتاج (حلب يومي)' : '🥛 Vache en lactation (Traite du lait)'}</option>
          <option value="allaitante">\${isAr ? '🍼 مرضعة (ترضع عجلها)' : '🍼 Allaitante (Nourrit son veau au pis)'}</option>
        \`;
      } else {
        statusSelect.innerHTML = \`
          <option value="allaitante" selected>\${isAr ? '🍼 مرضعة (ترضع خرافها)' : '🍼 Allaitante (Nourrit ses agneaux)'}</option>
        \`;
      }
    }

    this.openModal('modalRecordBirth');
  },

  handleBirthGenderChange(gender) {
    const motherId = document.getElementById('birthMotherId')?.value;
    const mother = (appState.animals || []).find(a => a.id === motherId);
    const sp = String(mother?.species || 'vache_laitiere').toLowerCase();
    const isBovine = (sp.includes('vache') || sp.includes('bovin') || sp.includes('genisse'));
    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';

    const catSelect = document.getElementById('birthCategorySelect');
    if (!catSelect) return;

    if (isBovine) {
      if (gender === 'male') {
        catSelect.value = 'veau_engraissement';
      } else {
        catSelect.value = 'veau_laitier';
      }
    }
  },

  handleSaveBirth(e) {
    if (e && e.preventDefault) e.preventDefault();

    const motherId = document.getElementById('birthMotherId')?.value;
    const actualDate = document.getElementById('birthActualDate')?.value || this.getTodayStr();
    const count = Math.max(1, parseInt(document.getElementById('birthOffspringCount')?.value, 10) || 1);
    const gender = document.getElementById('birthGender')?.value || 'femelle';
    const babySpecies = document.getElementById('birthCategorySelect')?.value || 'veau_laitier';
    const customName = document.getElementById('birthName')?.value?.trim();
    const birthWeight = parseFloat(document.getElementById('birthWeight')?.value) || null;
    const motherStatus = document.getElementById('birthMotherStatus')?.value || 'lactation';
    const notes = document.getElementById('birthNotes')?.value?.trim() || '';

    const mother = (appState.animals || []).find(a => a.id === motherId);
    if (!mother) return;

    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';
    const sp = String(mother.species || 'vache_laitiere').toLowerCase();
    const isBovine = (sp.includes('vache') || sp.includes('bovin') || sp.includes('genisse'));

    // Create newborn animal(s)
    const babyId = 'animal-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4);
    const motherDisplayName = this.getAnimalDisplayName(mother);

    let defaultBabyName = '';
    if (isBovine) {
      defaultBabyName = isAr ? \`عجل (\${motherDisplayName})\` : \`Veau de \${motherDisplayName}\`;
    } else {
      defaultBabyName = isAr ? \`خروف (\${motherDisplayName})\` : \`Agneau de \${motherDisplayName}\`;
    }

    const newBaby = {
      id: babyId,
      name: customName || defaultBabyName,
      species: babySpecies,
      stage: isBovine 
        ? (gender === 'male' ? 'veau_engraissement' : 'veau_laitier') 
        : 'agneau',
      currentQuantity: count,
      initialQuantity: count,
      birthDate: actualDate,
      arrivalAgeDays: 0,
      costPerHead: 0,
      breed: mother.breed || '-',
      motherId: mother.id,
      motherName: motherDisplayName,
      sire: mother.sire || '',
      birthWeight: birthWeight,
      gender: gender,
      reproductionNotes: notes ? \`Né le \${actualDate}. \${notes}\` : \`Né le \${actualDate} de \${motherDisplayName}\`,
      createdAt: new Date().toISOString()
    };

    if (!Array.isArray(appState.animals)) appState.animals = [];
    appState.animals.push(newBaby);

    // Update Mother Status
    mother.isPregnant = false;
    mother.lastCalvingDate = actualDate;
    delete mother.expectedBirthDate;
    delete mother.dryingOffDate;

    if (isBovine) {
      mother.stage = motherStatus === 'lactation' 
        ? (isAr ? 'بقرة حلوب' : (isEn ? 'Milking Cow' : 'Vache laitière'))
        : (isAr ? 'مرضعة' : (isEn ? 'Nursing Cow' : 'Vache allaitante'));
    } else {
      mother.stage = isAr ? 'نعجة مرضعة' : (isEn ? 'Nursing Ewe' : 'Brebis allaitante');
    }

    // Check off calendar event
    if (Array.isArray(appState.calendarEvents)) {
      appState.calendarEvents.forEach(ev => {
        if (ev.linkedAnimalId === mother.id && ev.type === 'mise_bas') {
          ev.isDone = true;
          ev.actualDate = actualDate;
        }
      });
    }

    this.saveState();
    if (window.appAuth && typeof window.appAuth.pushData === 'function') {
      window.appAuth.pushData(false, true);
    }

    this.closeModal('modalRecordBirth');
    this.renderAll();

    const toastMsg = isAr 
      ? \`🍼 مبروك ! تم تسجيل الولادة بنجاح وإضافة \${count} مولود إلى القطيع !\`
      : \`🍼 Félicitations ! Naissance enregistrée et \${count} nouveau(x) né(s) ajouté(s) au cheptel !\`;
    this.showToast(toastMsg, 'success');
  },

  cancelGestation(animalId) {
    const animal = (appState.animals || []).find(a => a.id === animalId);
    if (!animal) return;

    const isAr = (appState.lang || this.currentLang) === 'ar';
    const isEn = (appState.lang || this.currentLang) === 'en';

    this.confirmDialog({
      title: isAr ? 'إلغاء حالة الحمل' : 'Annuler la gestation',
      message: isAr ? \`هل تريد بالتأكيد إلغاء حالة الحمل لـ \${this.getAnimalDisplayName(animal)} ؟\` : \`Voulez-vous annuler la gestation pour \${this.getAnimalDisplayName(animal)} ?\`,
      isDanger: true,
      confirmText: isAr ? 'إلغاء الحمل' : 'Annuler la gestation',
      onConfirm: () => {
        animal.isPregnant = false;
        delete animal.expectedBirthDate;
        delete animal.dryingOffDate;
        delete animal.matingDate;

        const sp = String(animal.species || '').toLowerCase();
        const isBovine = (sp.includes('vache') || sp.includes('bovin') || sp.includes('genisse'));
        animal.stage = isBovine ? 'vache_laitiere' : 'brebis';

        if (Array.isArray(appState.calendarEvents)) {
          appState.calendarEvents = appState.calendarEvents.filter(ev => !(ev.linkedAnimalId === animalId && (ev.type === 'mise_bas' || ev.type === 'tarissement' || ev.type === 'echographie')));
        }

        this.saveState();
        if (window.appAuth && typeof window.appAuth.pushData === 'function') {
          window.appAuth.pushData(false, true);
        }
        this.renderAll();
        this.showToast(isAr ? 'تم إلغاء حالة الحمل بنجاح' : 'Gestation annulée avec succès');
      }
    });
  },
`;

// Rename existing renderIncubator to renderIncubatorBatches and create new renderIncubator wrapper
if (!js.includes('renderReproductionTab()')) {
  // Replace renderIncubator() header
  js = js.replace(
    'renderIncubator() {',
    reproductionCode + '\n  renderIncubator() {\n    this.renderReproductionTab();\n  },\n\n  renderIncubatorBatches() {'
  );

  // Update updateDynamicAnimalLabels to also adjust Tab 6 Nav labels
  const navUpdateMarker = "const kpiLivestockTitle = document.querySelector('.card-livestock .metric-title');";
  const navUpdateCode = `
    // Dynamic Reproduction Nav Labels (Incubateur vs Gestation & Naissances)
    const navIncText = document.getElementById('navIncubatorText');
    const mobileNavIncText = document.getElementById('mobileNavIncubatorText');
    const hasMammals = hasCattle || hasSheep;

    if (navIncText) {
      if (hasMammals && !hasPoultry) {
        navIncText.setAttribute('data-i18n', 'nav_gestation');
        navIncText.textContent = this.t('nav_gestation') || 'Gestation & Naissances';
      } else if (hasMammals && hasPoultry) {
        navIncText.setAttribute('data-i18n', 'nav_mixed_births');
        navIncText.textContent = this.t('nav_mixed_births') || 'Naissances & Couveuse';
      } else {
        navIncText.setAttribute('data-i18n', 'nav_incubator');
        navIncText.textContent = this.t('nav_incubator') || 'Incubateur & Éclosion';
      }
    }
    if (mobileNavIncText) {
      if (hasMammals && !hasPoultry) {
        mobileNavIncText.textContent = (appState.lang || this.currentLang) === 'ar' ? 'الولادات' : 'Naissances';
      } else if (hasMammals && hasPoultry) {
        mobileNavIncText.textContent = (appState.lang || this.currentLang) === 'ar' ? 'الولادات' : 'Naissances';
      } else {
        mobileNavIncText.textContent = (appState.lang || this.currentLang) === 'ar' ? 'الحاضنة' : 'Couveuse';
      }
    }
`;

  js = js.replace(navUpdateMarker, navUpdateCode + '\n    ' + navUpdateMarker);

  fs.writeFileSync('app.js', js, 'utf8');
  console.log('✔ app.js successfully patched with complete Gestation & Reproduction module!');
} else {
  console.log('Reproduction code already present in app.js');
}
