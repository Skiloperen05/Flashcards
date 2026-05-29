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
    html += examRadarHtml(page.examRadar);
    html += listCard('Formelark og metoder', page.formulaSheet, 'hf-formula-card', 'formelark');
    html += listCard('Canvas- og filgrunnlag', page.canvasMaterials, 'hf-material-card', 'materiale');
    html += practiceHtml(page.practice);
    html += listCard('Eksamenssjekkliste', page.examChecklist, 'hf-checklist-card', 'sjekkliste');
    if (!html) return '';
    return '<div id="learningSuite" class="hf-learning-suite">' + html + '</div>';
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
    if (planHost && page.sources && !document.getElementById('sourceCard')) {
      planHost.insertAdjacentHTML('afterend', '<div id="sourceCard" class="hf-source-grid">' + sourcesHtml(page.sources) + '</div>');
    }
    if (planHost && (page.compendium || page.examRadar || page.formulaSheet || page.canvasMaterials || page.practice || page.examChecklist) && !document.getElementById('learningSuite')) {
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
