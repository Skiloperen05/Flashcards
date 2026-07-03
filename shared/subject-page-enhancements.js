(function (window, document) {
  'use strict';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function subjectId() {
    if (window.HAUGNES_SUBJECT_ID) return String(window.HAUGNES_SUBJECT_ID).toLowerCase();
    var part = window.location.pathname.split('/').filter(Boolean).pop();
    var parent = window.location.pathname.split('/').filter(Boolean).slice(-2)[0];
    return part === 'index.html' ? String(parent || '').toLowerCase() : String(part || '').toLowerCase();
  }

  var fallbackMemos = {
    ret14: {
      intro: 'RET14 samler skatteregler, metode og beregninger i ett fag der struktur og hjemmelsbruk betyr mye.',
      exam: 'Eksamen tester ofte evnen til å identifisere skattesubjekt, velge regel, drøfte vilkår og regne ryddig.',
      studyAdvice: 'Start med pensumoversikten, bruk eksamensradaren til prioritering, og avslutt med kort eller quiz på svake temaer.'
    },
    sam2: {
      intro: 'SAM2 bygger videre på mikroøkonomi med konsument, produsent, marked, velferd og strategisk tilpasning.',
      exam: 'Eksamen er typisk modell- og figurorientert, med poeng for riktig fremgangsmåte og klar økonomisk tolkning.',
      studyAdvice: 'Bruk oppgaveprioriteringen først, tegn figur før regning, og kontroller temaet mot eksamensradaren.'
    },
    sam3: {
      intro: 'SAM3 handler om makromodeller, politikk og økonomiske sjokk forklart med tydelige mekanismer.',
      exam: 'Eksamen belønner modellvalg, forklaring av skift og kobling til pengepolitikk, finanspolitikk eller åpen økonomi.',
      studyAdvice: 'Repeter begreper med flashcards, lås formlene med formelquiz, og bruk V26-flyten som eksamensnær trening.'
    },
    subj_sol1: {
      intro: 'SOL1 samler organisasjonsatferd, ledelse, motivasjon, grupper og beslutninger i teorier som må brukes på case.',
      exam: 'Eksamen krever ofte presis teoriforklaring, relevant anvendelse og tydelig drøfting av tiltak eller konsekvenser.',
      studyAdvice: 'Start med begrepskort, tren på casekobling, og skriv korte teorisvar med begrep, anvendelse og konklusjon.'
    },
    sol1: {
      intro: 'SOL1 samler organisasjonsatferd, ledelse, motivasjon, grupper og beslutninger i teorier som må brukes på case.',
      exam: 'Eksamen krever ofte presis teoriforklaring, relevant anvendelse og tydelig drøfting av tiltak eller konsekvenser.',
      studyAdvice: 'Start med begrepskort, tren på casekobling, og skriv korte teorisvar med begrep, anvendelse og konklusjon.'
    }
  };

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

  function resourcesHtml(id) {
    var api = window.HaugnesSubjectResources;
    if (!api || typeof api.forSubject !== 'function') return '';
    var resources = api.forSubject(id);
    if (!resources.length) return '';
    var labels = api.typeLabels || {};
    var types = resources.map(function (resource) { return resource.type || 'annet'; }).filter(function (type, index, arr) { return arr.indexOf(type) === index; });
    return '<section class="hf-info-card hf-resource-panel" id="ressurser"><div class="hf-card-heading"><h3>Ressurser</h3><span>Kompendium · formelark · eksamen</span></div>'
      + '<div class="hf-resource-tabs"><button class="hf-resource-tab active" type="button" data-resource-filter="all">Alle</button>' + types.map(function (type) {
        return '<button class="hf-resource-tab" type="button" data-resource-filter="' + esc(type) + '">' + esc(labels[type] || type) + '</button>';
      }).join('') + '</div><div class="hf-resource-list">' + resources.map(function (resource) {
        var available = resource.status === 'available' && resource.href;
        var status = resource.status === 'available' ? 'Tilgjengelig' : 'Kommer';
        return '<article class="hf-resource-item" data-resource-type="' + esc(resource.type || 'annet') + '"><div><em>' + esc(labels[resource.type] || resource.type || 'Ressurs') + '</em><strong>' + esc(resource.title) + '</strong><p>' + esc(resource.description || '') + '</p></div><div class="hf-resource-action"><b class="' + (available ? 'ready' : 'soon') + '">' + esc(status) + '</b>' + (available ? '<a href="' + esc(resource.href) + '">Åpne →</a>' : '<span>Kommer</span>') + '</div></article>';
      }).join('') + '</div></section>';
  }

  function bindResources() {
    document.querySelectorAll('.hf-resource-tab').forEach(function (button) {
      button.addEventListener('click', function () {
        var panel = button.closest('.hf-resource-panel');
        var filter = button.getAttribute('data-resource-filter');
        if (!panel) return;
        panel.querySelectorAll('.hf-resource-tab').forEach(function (tab) { tab.classList.toggle('active', tab === button); });
        panel.querySelectorAll('.hf-resource-item').forEach(function (item) {
          item.style.display = filter === 'all' || item.getAttribute('data-resource-type') === filter ? '' : 'none';
        });
      });
    });
  }

  function install() {
    var id = subjectId();
    var page = window.HaugnesSubjectPages && window.HaugnesSubjectPages.get(id);
    var memo = page && page.memo || fallbackMemos[id];
    var mainColumn = document.querySelector('.hf-subject-layout > div:first-child');
    if (!mainColumn) return;
    var firstWideGrid = mainColumn.querySelector('.hf-wide-grid');
    var resourcePanel = resourcesHtml(id);
    if (firstWideGrid && memo && !document.getElementById('memo')) {
      firstWideGrid.insertAdjacentHTML('beforebegin', memoHtml(memo));
    }
    var cta = mainColumn.querySelector('.hf-cta');
    if (cta && resourcePanel && !document.getElementById('ressurser')) {
      cta.insertAdjacentHTML('beforebegin', resourcePanel);
      bindResources();
    }
    var tabbar = document.querySelector('.hf-tabbar');
    if (tabbar && !tabbar.querySelector('a[href="#memo"]')) tabbar.insertAdjacentHTML('beforeend', '<a href="#memo">Memo</a>');
    if (tabbar && resourcePanel && !tabbar.querySelector('a[href="#ressurser"]')) tabbar.insertAdjacentHTML('beforeend', '<a href="#ressurser">Ressurser</a>');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})(window, document);
