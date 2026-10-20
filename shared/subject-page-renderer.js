(function () {
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function toolHtml(tool) {
    return '<a class="hf-tool-card ' + (tool[4] === '#' ? 'hf-disabled' : '') + '" style="--accent:' + esc(tool[5]) + '" href="' + esc(tool[4]) + '">'
      + '<div class="hf-tool-top"><div class="hf-tool-icon">' + esc(tool[0]) + '</div><span class="hf-status ' + (tool[4] === '#' ? 'soon' : '') + '">' + esc(tool[3]) + '</span></div>'
      + '<div class="hf-tool-body"><h3>' + esc(tool[1]) + '</h3><p>' + esc(tool[2]) + '</p><div class="hf-tool-foot"><span>' + (tool[4] === '#' ? 'Neste steg' : 'Åpne') + '</span><span>' + esc(tool[3]) + '</span></div></div>'
      + '</a>';
  }

  function topicHtml(topic, accent) {
    var title = Array.isArray(topic) ? topic[0] : (topic.title || topic.name || topic.theme || '');
    var desc = Array.isArray(topic) ? topic[1] : (topic.desc || topic.subtitle || topic.weight || '');
    var pct = Array.isArray(topic) ? topic[2] : (topic.pct || topic.weight || '');
    return '<div class="hf-topic"><div><strong>' + esc(title) + '</strong><span>' + esc(desc) + '</span></div></div>';
  }

  function planHtml(item) {
    var step = Array.isArray(item) ? item[0] : (item.step || item.title || '');
    var desc = Array.isArray(item) ? item[1] : (item.desc || '');
    var time = Array.isArray(item) ? item[2] : (item.time || item.duration || '30 min');
    return '<div class="hf-priority"><div><b>' + esc(step) + '</b><span>' + esc(desc) + '</span></div><span>' + esc(time) + '</span></div>';
  }

  function sourcesHtml(items) {
    if (!items || !items.length) return '';
    return '<section class="hf-info-card hf-source-card"><h3>Lokalt grunnlag</h3>' + items.map(function (item) {
      return '<div class="hf-source-item"><strong>' + esc(item[0]) + '</strong><span>' + esc(item[1]) + '</span></div>';
    }).join('') + '</section>';
  }

  function memoHtml(memo) {
    if (!memo || ![memo.intro, memo.exam, memo.studyAdvice].some(function (text) { return String(text || '').trim(); })) return '';
    return '<section class="hf-memo-grid" id="memo">'
      + memoCard('Kort intro', memo.intro)
      + memoCard('Eksamen', memo.exam)
      + memoCard('Slik bruker du siden', memo.studyAdvice)
      + '</section>';
  }

  function memoCard(title, text) {
    if (!text) return '';
    return '<article class="hf-info-card hf-memo-card"><span>' + esc(title) + '</span><p>' + esc(text) + '</p></article>';
  }

  function personalHtml(page) {
    var rows = [];
    if (page.preferredStudyMethod) rows.push(['Arbeidsmåte', page.preferredStudyMethod, 'Fra notater']);
    if (page.personalNotes && page.personalNotes.summary) rows.push(['Kildebruk', page.personalNotes.summary, 'Canvas/notater']);
    (page.personalWarnings || []).slice(0, 4).forEach(function (warning) {
      rows.push(['Fallgruve', warning, 'Sjekk']);
    });
    return listCard('Personlig arbeidsmåte', rows, 'hf-personal-card', 'personlig');
  }

  function listCard(title, items, className, id) {
    if (!items || !items.length) return '';
    return '<section class="hf-info-card ' + esc(className || '') + '"' + (id ? ' id="' + esc(id) + '"' : '') + '><h3>' + esc(title) + '</h3>' + items.map(function (item) {
      return '<div class="hf-learning-row"><div><strong>' + esc(item[0]) + '</strong><span>' + esc(item[1]) + '</span></div><em>' + esc(item[2]) + '</em></div>';
    }).join('') + '</section>';
  }

  function examRadarHtml(radar) {
    if (!radar || !radar.rows || !radar.rows.length || document.getElementById('radarContent')) return '';
    var rows = (radar.rows || []).map(function (row) {
      return '<div class="hf-radar-row"><div><strong>' + esc(row[0]) + '</strong><span>' + esc(row[1]) + '</span></div><div class="hf-radar-meter" style="--p:' + esc(row[2]) + ';--accent:' + esc(radar.accent || '#e8bc68') + '"><i></i></div><b>' + esc(row[2]) + '</b></div>';
    }).join('');
    return '<section class="hf-info-card hf-radar-card" id="eksamensradar"><div class="hf-card-heading"><h3>Eksamensradar</h3><span>' + esc(radar.label || 'Prioritering') + '</span></div><p class="hf-card-copy">' + esc(radar.summary || '') + '</p>' + rows + '</section>';
  }

  function learningHtml(page) {
    var html = '';
    html += listCard('Kompendium og oversikt', page.compendium, 'hf-compendium-card', 'kompendium');
    html += personalHtml(page);
    html += examRadarHtml(page.examRadar);
    html += listCard('Formelark og metoder', page.formulaSheet, 'hf-formula-card', 'formelark');
    html += listCard('Canvas- og filgrunnlag', page.canvasMaterials, 'hf-material-card', 'materiale');
    html += practiceHtml(page.practice);
    html += listCard('Eksamenssjekkliste', page.examChecklist, 'hf-checklist-card', 'sjekkliste');
    if (!html) return '';
    return '<div id="learningSuite" class="hf-learning-suite">' + html + '</div>';
  }

  function pageResources(page) {
    var api = window.HaugnesSubjectResources;
    return (page.resources || (api && typeof api.forSubject === 'function' ? api.forSubject(page.id || page.code) : [])).filter(function (item) { return item.status === 'available' && item.href; });
  }

  function resourcesHtml(page) {
    var api = window.HaugnesSubjectResources;
    var resources = pageResources(page);
    if (!resources || !resources.length) return '';
    var labels = api && api.typeLabels || {};
    var tabs = unique(resources.map(function (resource) { return resource.type || 'annet'; })).map(function (type, index) {
      return '<button class="hf-resource-tab ' + (index === 0 ? 'active' : '') + '" type="button" data-resource-filter="' + esc(type) + '">' + esc(labels[type] || type) + '</button>';
    }).join('');
    return '<section class="hf-info-card hf-resource-panel" id="ressurser"><div class="hf-card-heading"><h3>Ressurser</h3><span>Kompendium · formelark · eksamen</span></div>'
      + '<div class="hf-resource-tabs"><button class="hf-resource-tab active" type="button" data-resource-filter="all">Alle</button>' + tabs + '</div>'
      + '<div class="hf-resource-list">' + resources.map(function (resource) {
        var available = resource.status === 'available' && resource.href;
        var tag = labels[resource.type] || resource.type || 'Ressurs';
        var status = resource.status === 'available' ? 'Tilgjengelig' : 'Kommer';
        var action = available ? '<a href="' + esc(resource.href) + '">Åpne →</a>' : '<span>Kommer</span>';
        return '<article class="hf-resource-item" data-resource-type="' + esc(resource.type || 'annet') + '"><div><em>' + esc(tag) + '</em><strong>' + esc(resource.title) + '</strong><p>' + esc(resource.description || '') + '</p></div><div class="hf-resource-action"><b class="' + (available ? 'ready' : 'soon') + '">' + esc(status) + '</b>' + action + '</div></article>';
      }).join('') + '</div></section>';
  }

  function unique(items) {
    return items.filter(function (item, index, arr) { return item && arr.indexOf(item) === index; });
  }

  function practiceHtml(practice) {
    if (!practice || !practice.cards || !practice.cards.length) return '';
    return '<section class="hf-info-card hf-practice-card" id="hurtigkort"><div class="hf-card-heading"><h3>Hurtigkort</h3><span>' + esc(practice.label || 'Øving') + '</span></div><p class="hf-card-copy">' + esc(practice.intro || '') + '</p><div class="hf-practice-list">' + practice.cards.map(function (card, index) {
      return '<button class="hf-flip-card" type="button" data-card-index="' + index + '"><span class="hf-card-tag">' + esc(card[0]) + '</span><strong>' + esc(card[1]) + '</strong><em>' + esc(card[2]) + '</em><small>Trykk for fasit</small></button>';
    }).join('') + '</div></section>';
  }

  function addLearningTabs(page) {
    var tabbar = document.querySelector('.hf-tabbar');
    if (!tabbar) return;
    tabbar.querySelectorAll('[data-learning-tab]').forEach(function (tab) { tab.remove(); });
    [['kompendium', 'Kompendium'], ['memo', 'Memo'], ['personlig', 'Arbeidsmåte'],
      ['ressurser', 'Ressurser'], ['formelark', 'Formelark'], ['materiale', 'Materiale'],
      ['hurtigkort', 'Hurtigkort'], ['sjekkliste', 'Sjekkliste']].forEach(function (entry) {
      var target = document.getElementById(entry[0]);
      if (target && !tabbar.querySelector('a[href="#' + entry[0] + '"]')) {
        tabbar.insertAdjacentHTML('beforeend', '<a data-learning-tab href="#' + entry[0] + '">' + entry[1] + '</a>');
      }
    });
  }

  function bindPractice(page) {
    if (!page.practice || !page.practice.cards) return;
    document.querySelectorAll('.hf-flip-card').forEach(function (button) {
      button.addEventListener('click', function () {
        var index = Number(button.getAttribute('data-card-index'));
        var card = page.practice.cards[index];
        if (!card) return;
        var flipped = button.classList.toggle('is-flipped');
        button.querySelector('strong').textContent = flipped ? card[3] : card[1];
        button.querySelector('em').textContent = flipped ? card[4] : card[2];
        button.querySelector('small').textContent = flipped ? 'Trykk for spørsmål' : 'Trykk for fasit';
      });
    });
  }

  function bindResources() {
    document.querySelectorAll('.hf-resource-tab').forEach(function (button) {
      button.addEventListener('click', function () {
        var panel = button.closest('.hf-resource-panel');
        if (!panel) return;
        var filter = button.getAttribute('data-resource-filter');
        panel.querySelectorAll('.hf-resource-tab').forEach(function (tab) { tab.classList.toggle('active', tab === button); });
        panel.querySelectorAll('.hf-resource-item').forEach(function (item) {
          item.style.display = filter === 'all' || item.getAttribute('data-resource-type') === filter ? '' : 'none';
        });
      });
    });
  }

  function isAdminUser() {
    return !!(window.HaugnesEntitlements && typeof window.HaugnesEntitlements.effectiveAdmin === 'function' && window.HaugnesEntitlements.effectiveAdmin());
  }

  function adminBarHtml(page) {
    if (!isAdminUser()) return '';
    var code = page.code || page.id;
    return '<div class="hf-admin-subject-bar" style="background:rgba(47,98,255,.14);border:1px solid rgba(126,162,255,.28);border-radius:14px;padding:10px 16px;margin:16px auto;max-width:1200px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">'
      + '<div style="display:flex;align-items:center;gap:10px">'
      + '<span style="background:#2563eb;color:#fff;font-size:11px;font-weight:900;text-transform:uppercase;padding:4px 8px;border-radius:999px;letter-spacing:.08em">Admin-modus</span>'
      + '<span style="color:#dce6f7;font-size:13px;font-weight:700">Du administrerer <strong>' + esc(code) + '</strong></span>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
      + '<a href="../user/admin.html?subject=' + encodeURIComponent(code) + '&tab=overview" class="hf-btn" style="padding:6px 12px;font-size:12px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);border-radius:10px">✏️ Rediger fagoversikt</a>'
      + '<a href="../user/admin.html?subject=' + encodeURIComponent(code) + '&tab=radar" class="hf-btn" style="padding:6px 12px;font-size:12px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);border-radius:10px">📋 Eksamensradar</a>'
      + '<a href="../user/admin.html?subject=' + encodeURIComponent(code) + '&tab=answers" class="hf-btn" style="padding:6px 12px;font-size:12px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);border-radius:10px">➕ A-besvarelse</a>'
      + '<a href="../user/admin.html?subject=' + encodeURIComponent(code) + '&tab=memos" class="hf-btn" style="padding:6px 12px;font-size:12px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);border-radius:10px">📚 Forelesningsnotat</a>'
      + '<a href="../user/admin.html?subject=' + encodeURIComponent(code) + '&tab=tasks" class="hf-btn" style="padding:6px 12px;font-size:12px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);border-radius:10px">🎯 Oppgave</a>'
      + '</div>'
      + '</div>';
  }

  function isRrrWorkspace(page) {
    return String(page.id || page.code || '').trim().toLowerCase() === 'rrr11';
  }

  // RRR11 has two real learning surfaces; the generic template's tool cards,
  // exam advice and percentage display do not describe this course.
  function decorateWorkspace(page) {
    if (!page || !isRrrWorkspace(page)) return;
    document.body.dataset.subjectLayout = 'rrr11';
    var vis = page.visibility || {};
    var toolGrid = document.getElementById('toolGrid');
    if (toolGrid) toolGrid.replaceChildren();
    ['memo', 'learningSuite', 'sourceCard'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.remove();
    });
    document.querySelectorAll('#subjectTabBar a[href="#memo"],#subjectTabBar a[href="#oversikt"]').forEach(function (link) { link.remove(); });
    var lead = document.getElementById('subjectLead');
    if (lead) lead.textContent = vis.answers !== false && (page.answers || []).length ? 'Forelesningsnotater, A-besvarelser og COSO-øving, samlet her i faget.' : 'Les forelesningsnotatene, og øv videre på COSO med flashcards og quiz. Alt samlet her i faget.';
    var primary = document.getElementById('heroPrimaryAction');
    if (primary) {
      primary.href = vis.notes !== false ? '#notater' : '#flashcards';
      primary.textContent = vis.notes !== false ? 'Les forelesningsnotatene ↓' : 'Øv på COSO →';
      primary.style.display = vis.notes !== false || vis.flashcards !== false ? 'inline-flex' : 'none';
    }
    var flashTab = document.getElementById('flashcardsTabLink');
    if (flashTab) { flashTab.href = '#flashcards'; flashTab.dataset.subjectStudy = '1'; flashTab.textContent = 'Flashcards og quiz'; }
    var notesTab = document.getElementById('tabNotes');
    if (notesTab) notesTab.textContent = 'Forelesningsnotater';
    var tabbar = document.getElementById('subjectTabBar');
    function activeTab(hash) {
      if (!tabbar) return;
      tabbar.querySelectorAll('a').forEach(function (link) {
        var active = link.hash === hash;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    activeTab(window.location.hash || (vis.notes !== false ? '#notater' : '#flashcards'));
    if (tabbar && !tabbar.dataset.workspaceBound) {
      tabbar.dataset.workspaceBound = '1';
      document.addEventListener('click', function (event) {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        var link = event.target.closest('a');
        if (link && (link.hash === '#notater' || link.hash === '#flashcards')) activeTab(link.hash);
        else if (event.target.closest('[data-sfc-open]')) activeTab('#flashcards');
      });
      window.addEventListener('hashchange', function () { activeTab(window.location.hash); });
    }
    var notes = document.getElementById('notater');
    if (notes) {
      var heading = notes.querySelector('h3');
      if (heading) {
        heading.textContent = 'Forelesningsnotater';
        if (!notes.querySelector('.rrr-workspace-step')) heading.insertAdjacentHTML('beforebegin', '<span class="rrr-workspace-step">01 · Les og forstå</span>');
      }
      var copy = notes.querySelector('.hf-section-title-sub');
      if (copy) copy.textContent = 'Åpne notatene og jobb deg gjennom temaene i faget.';
      var next = notes.querySelector('[data-rrr-study-link]');
      if (!next) {
        notes.insertAdjacentHTML('beforeend', '<a class="rrr-study-link" data-rrr-study-link data-subject-study="1" href="#flashcards"><span>Vil du øve på intern kontroll?</span> Test deg på COSO med flashcards og quiz <span aria-hidden="true">→</span></a>');
        next = notes.querySelector('[data-rrr-study-link]');
      }
      next.hidden = vis.flashcards === false;
      var room = document.getElementById('flashcards');
      if (room) {
        if (room.previousElementSibling !== notes) notes.after(room);
        var returnLink = room.querySelector('.sfc-notes-link');
        if (returnLink) returnLink.hidden = vis.notes === false;
      }
    }
  }

  function render(page) {
    if (!page) return;
    document.title = page.code + ' ' + page.name + ' — Haugnes Flashcards';
    document.body.style.setProperty('--subject-accent', page.accent);
    document.body.style.setProperty('--subject-progress', page.progress);
    var kicker = document.getElementById('subjectKicker');
    if (kicker) kicker.textContent = page.kicker + ' · ' + page.code;
    var title = document.getElementById('subjectTitle');
    if (title) title.innerHTML = esc(page.code) + ' <span>' + esc(page.name) + '</span>';
    var lead = document.getElementById('subjectLead');
    if (lead) lead.textContent = page.lead;
    var stats = document.getElementById('subjectStats');
    if (stats && page.stats) {
      stats.innerHTML = page.stats.map(function (stat) {
        return '<div class="hf-stat"><b>' + esc(stat[0]) + '</b><span>' + esc(stat[1]) + '</span></div>';
      }).join('');
    }
    var toolGrid = document.getElementById('toolGrid');
    if (toolGrid && page.tools) toolGrid.innerHTML = isRrrWorkspace(page) ? '' : page.tools.map(toolHtml).join('');
    var topicList = document.getElementById('topicList');
    if (topicList && page.topics) topicList.innerHTML = page.topics.map(function (topic) { return topicHtml(topic, page.accent); }).join('');
    var planList = document.getElementById('planList');
    if (planList && page.plan) planList.innerHTML = page.plan.map(planHtml).join('');
    if (!isRrrWorkspace(page)) {
      ['memo', 'learningSuite', 'sourceCard', 'ressurser'].forEach(function (id) { var node = document.getElementById(id); if (node) node.remove(); });
      var planHost = planList ? planList.closest('.hf-wide-grid') : null;
      if (planHost && page.memo && !document.getElementById('memo')) {
        planHost.insertAdjacentHTML('beforebegin', memoHtml(page.memo));
      }
      if (planHost && page.sources && page.sources.length && !document.getElementById('sourceCard')) {
        planHost.insertAdjacentHTML('afterend', '<div id="sourceCard" class="hf-source-grid">' + sourcesHtml(page.sources) + '</div>');
      }
      if (planHost && !document.getElementById('ressurser')) {
        var resourceAnchor = document.getElementById('sourceCard') || planHost;
        resourceAnchor.insertAdjacentHTML('afterend', resourcesHtml(page));
        bindResources();
      }
      if (planHost && (page.compendium || page.preferredStudyMethod || (page.personalWarnings && page.personalWarnings.length) || page.examRadar || page.formulaSheet || page.canvasMaterials || page.practice || page.examChecklist) && !document.getElementById('learningSuite')) {
        var sourceCard = document.getElementById('sourceCard');
        (sourceCard || planHost).insertAdjacentHTML('afterend', learningHtml(page));
        bindPractice(page);
      }
    }
    var nextStep = document.getElementById('nextStep');
    if (nextStep && page.next) nextStep.textContent = page.next;
    var progressVal = document.getElementById('progressValue');
    if (progressVal && page.progress) progressVal.textContent = page.progress;

    // Apply section visibility
    var vis = Object.assign({
      radar: true,
      answers: true,
      notes: true,
      tasks: true,
      flashcards: true,
      topics: true,
      plan: true
    }, page.visibility || {});

    var topicsCard = document.getElementById('topicsCard');
    if (topicsCard) topicsCard.style.display = vis.topics !== false ? '' : 'none';

    var planCard = document.getElementById('planCard');
    if (planCard) planCard.style.display = vis.plan !== false ? '' : 'none';

    var wideGrid = document.getElementById('topicsAndPlanGrid');
    if (wideGrid) wideGrid.style.display = (vis.topics !== false || vis.plan !== false) ? '' : 'none';

    var radarSec = document.getElementById('eksamensradar');
    if (radarSec) radarSec.style.display = vis.radar !== false ? '' : 'none';
    var radarTab = document.getElementById('tabRadar');
    if (radarTab) radarTab.style.display = vis.radar !== false ? '' : 'none';

    var answersSec = document.getElementById('besvarelser');
    if (answersSec) answersSec.style.display = vis.answers !== false ? '' : 'none';
    var answersTab = document.getElementById('tabAnswers');
    if (answersTab) answersTab.style.display = vis.answers !== false ? '' : 'none';

    var notesSec = document.getElementById('notater') || document.getElementById('memo');
    if (notesSec) notesSec.style.display = vis.notes !== false ? '' : 'none';
    var notesTab = document.getElementById('tabNotes');
    if (notesTab) notesTab.style.display = vis.notes !== false ? '' : 'none';

    var tasksSec = document.getElementById('oppgaver');
    if (tasksSec) tasksSec.style.display = vis.tasks !== false ? '' : 'none';
    var tasksTab = document.getElementById('tabTasks');
    if (tasksTab) tasksTab.style.display = vis.tasks !== false ? '' : 'none';

    var flashTab = document.getElementById('flashcardsTabLink');
    if (flashTab) flashTab.style.display = vis.flashcards !== false ? '' : 'none';
    var heroFlash = document.getElementById('heroPrimaryAction');
    if (heroFlash) heroFlash.style.display = vis.flashcards !== false ? '' : 'none';
    var ctaFlash = document.getElementById('ctaAction');
    if (ctaFlash) ctaFlash.style.display = vis.flashcards !== false ? '' : 'none';
    var asideFlash = document.getElementById('asideFlashcardsLink');
    if (asideFlash && asideFlash.parentElement) asideFlash.parentElement.style.display = vis.flashcards !== false ? '' : 'none';

    var adminHost = document.querySelector('.hf-hero') || document.querySelector('.page-hero') || document.querySelector('.hf-main');
    if (adminHost && !document.querySelector('.hf-admin-subject-bar')) {
      adminHost.insertAdjacentHTML('beforebegin', adminBarHtml(page));
    }
    decorateWorkspace(page);
    applyContentVisibility(page);
    addLearningTabs(page);
  }

  function applyContentVisibility(page, editing) {
    var admin = editing === undefined ? isAdminUser() && !document.body.classList.contains('hf-student-preview-active') : editing;
    var visibility = page.visibility || {};
    var present = {};
    function section(id, tabId, key, rows) {
      var populated = Array.isArray(rows) ? rows.length > 0 : !!(rows && rows.rows && rows.rows.length);
      present[key] = visibility[key] !== false && populated;
      var show = visibility[key] !== false && (populated || admin);
      var el = document.getElementById(id);
      if (el) el.style.display = show ? 'block' : 'none';
      var tab = document.getElementById(tabId);
      if (tab) tab.style.display = present[key] ? 'inline-block' : 'none';
      return show;
    }
    section('eksamensradar', 'tabRadar', 'radar', page.examRadar);
    section('besvarelser', 'tabAnswers', 'answers', page.answers);
    section('notater', 'tabNotes', 'notes', page.notes);
    section('oppgaver', 'tabTasks', 'tasks', page.tasks);
    var topicCard = document.getElementById('topicsCard') || document.getElementById('topicList')?.closest('section');
    var planCard = document.getElementById('planCard') || document.getElementById('planList')?.closest('section');
    if (topicCard) topicCard.style.display = visibility.topics !== false && (admin || (page.topics || []).length) ? '' : 'none';
    if (planCard) planCard.style.display = visibility.plan !== false && (admin || (page.plan || []).length) ? '' : 'none';
    var grid = document.getElementById('topicsAndPlanGrid') || topicCard?.closest('.hf-wide-grid');
    if (grid) grid.style.display = [topicCard, planCard].some(function (card) { return card && card.style.display !== 'none'; }) ? '' : 'none';
    var stats = document.getElementById('subjectStats');
    if (stats) { var panel = stats.closest('aside'); if (panel) panel.style.display = stats.children.length ? '' : 'none'; }
    var tools = document.getElementById('toolGrid');
    if (tools) {
      var targets = { '#eksamensradar': 'radar', '#besvarelser': 'answers', '#notater': 'notes', '#oppgaver': 'tasks' };
      tools.querySelectorAll('a').forEach(function (link) {
        var key = targets[link.getAttribute('href')];
        var href = link.getAttribute('href') || '';
        link.style.display = key && !present[key] || href === '#' || href.includes('user/oppgavebank.html') ? 'none' : '';
      });
      var hasTools = Array.from(tools.children).some(function (item) { return item.style.display !== 'none'; });
      tools.style.display = hasTools ? '' : 'none';
      var heading = Array.from(tools.parentElement.children).find(function (node) { return node.classList.contains('hf-section-head'); });
      if (heading && heading.classList.contains('hf-section-head')) heading.style.display = hasTools ? '' : 'none';
    }
    // Course-completion percentages were template values, never learner results.
    var progress = document.getElementById('progressValue');
    if (progress) progress.closest('section')?.remove();
    var next = document.getElementById('nextStep');
    if (next) next.closest('.hf-cta').style.display = page.next ? '' : 'none';
    document.querySelectorAll('.hf-subject-aside a[href^="#"]').forEach(function (link) {
      var target = document.getElementById(link.hash.slice(1));
      link.closest('.hf-priority').style.display = target && target.style.display !== 'none' ? '' : 'none';
    });
  }

  function resolveSubjectId() {
    if (window.HAUGNES_SUBJECT_ID) return window.HAUGNES_SUBJECT_ID;
    if (window.location.search) {
      var sp = new URLSearchParams(window.location.search);
      var param = sp.get('id') || sp.get('subject');
      if (param) return param;
    }
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length && parts[0] !== 'user' && parts[0] !== 'flashcards' && parts[0] !== 'subject') {
      return parts[0];
    }
    return null;
  }

  var targetId = resolveSubjectId();
  var page = window.HaugnesSubjectPages && targetId ? window.HaugnesSubjectPages.get(targetId) : null;
  if (page) render(page);

  window.HaugnesSubjectRenderer = {
    render: render,
    decorateWorkspace: decorateWorkspace,
    applyContentVisibility: applyContentVisibility,
    resolveSubjectId: resolveSubjectId
  };
})();
