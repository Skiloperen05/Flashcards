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
    return '<div class="hf-topic"><div><strong>' + esc(topic[0]) + '</strong><span>' + esc(topic[1]) + '</span></div><div class="hf-meter" style="--accent:' + esc(accent) + ';--p:' + esc(topic[2]) + '"><i></i></div></div>';
  }

  function planHtml(item) {
    return '<div class="hf-priority"><div><b>' + esc(item[0]) + '</b><span>' + esc(item[1]) + '</span></div><span>' + esc(item[2]) + '</span></div>';
  }

  function sourcesHtml(items) {
    if (!items || !items.length) return '';
    return '<section class="hf-info-card hf-source-card"><h3>Lokalt grunnlag</h3>' + items.map(function (item) {
      return '<div class="hf-source-item"><strong>' + esc(item[0]) + '</strong><span>' + esc(item[1]) + '</span></div>';
    }).join('') + '</section>';
  }

  function memoHtml(memo) {
    if (!memo) return '';
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
    if (!radar) return '';
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
    return page.resources || (api && typeof api.forSubject === 'function' ? api.forSubject(page.id || page.code) : []);
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
    if (page.compendium) tabbar.insertAdjacentHTML('beforeend', '<a href="#kompendium">Kompendium</a>');
    if (page.memo) tabbar.insertAdjacentHTML('beforeend', '<a href="#memo">Memo</a>');
    if (page.preferredStudyMethod || (page.personalWarnings && page.personalWarnings.length)) tabbar.insertAdjacentHTML('beforeend', '<a href="#personlig">Personlig</a>');
    if (pageResources(page).length) tabbar.insertAdjacentHTML('beforeend', '<a href="#ressurser">Ressurser</a>');
    if (page.examRadar) tabbar.insertAdjacentHTML('beforeend', '<a href="#eksamensradar">Eksamensradar</a>');
    if (page.formulaSheet) tabbar.insertAdjacentHTML('beforeend', '<a href="#formelark">Formelark</a>');
    if (page.canvasMaterials) tabbar.insertAdjacentHTML('beforeend', '<a href="#materiale">Materiale</a>');
    if (page.practice) tabbar.insertAdjacentHTML('beforeend', '<a href="#hurtigkort">Hurtigkort</a>');
    if (page.examChecklist) tabbar.insertAdjacentHTML('beforeend', '<a href="#sjekkliste">Sjekkliste</a>');
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

  function render(page) {
    document.title = page.code + ' ' + page.name + ' — Haugnes Flashcards';
    document.body.style.setProperty('--subject-accent', page.accent);
    document.body.style.setProperty('--subject-progress', page.progress);
    document.getElementById('subjectKicker').textContent = page.kicker + ' · ' + page.code;
    document.getElementById('subjectTitle').innerHTML = esc(page.code) + ' <span>' + esc(page.name) + '</span>';
    document.getElementById('subjectLead').textContent = page.lead;
    document.getElementById('subjectStats').innerHTML = page.stats.map(function (stat) {
      return '<div class="hf-stat"><b>' + esc(stat[0]) + '</b><span>' + esc(stat[1]) + '</span></div>';
    }).join('');
    document.getElementById('toolGrid').innerHTML = page.tools.map(toolHtml).join('');
    document.getElementById('topicList').innerHTML = page.topics.map(function (topic) { return topicHtml(topic, page.accent); }).join('');
    document.getElementById('planList').innerHTML = page.plan.map(planHtml).join('');
    addLearningTabs(page);
    var planHost = document.getElementById('planList').closest('.hf-wide-grid');
    if (planHost && page.memo && !document.getElementById('memo')) {
      planHost.insertAdjacentHTML('beforebegin', memoHtml(page.memo));
    }
    if (planHost && page.sources && !document.getElementById('sourceCard')) {
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
    document.getElementById('nextStep').textContent = page.next;
    document.getElementById('progressValue').textContent = page.progress;
  }

  var page = window.HaugnesSubjectPages && window.HaugnesSubjectPages.get(window.HAUGNES_SUBJECT_ID);
  if (page) render(page);
})();
