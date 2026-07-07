(function (window, document) {
  'use strict';

  if (window.__haugnesFlashcardsLibraryFallbackInstalled) return;
  window.__haugnesFlashcardsLibraryFallbackInstalled = true;

  var filter = 'all';

  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function deckStats(subject) {
    var learning = window.HaugnesLearningContent;
    var decks = learning && typeof learning.decksFor === 'function' ? learning.decksFor(subject.id) : [];
    return {
      decks: decks.length || Number(String(subject.decks || '').replace(/\D/g, '')) || 0,
      cards: decks.reduce(function (sum, deck) { return sum + ((deck.cards || []).length); }, 0) || Number(String(subject.cards || '').replace(/\D/g, '')) || 0
    };
  }

  function linkFor(subject) {
    return subject.flashcards || ('../flashcards/?subject=' + encodeURIComponent(subject.id || subject.code));
  }

  function cardHtml(subject) {
    var stats = deckStats(subject);
    var color = subject.accent || '#2f62ff';
    return '<a class="subject-card fade-in" data-id="' + esc(subject.id) + '" href="' + esc(linkFor(subject)) + '">'
      + '<div class="subject-card-header" style="background:linear-gradient(135deg,' + esc(color) + ',' + esc(color) + 'bb)">'
      + '<span class="fc-subject-code">' + esc(subject.code || subject.name) + '</span>'
      + '<h3>' + esc(subject.name || subject.code) + '</h3>'
      + '<p>' + esc(subject.categoryShortLabel || subject.categoryLabel || 'Fag') + ' · ' + stats.decks + ' deck · ' + stats.cards + ' kort</p>'
      + '</div><div class="subject-card-body">'
      + '<p class="hf-subject-desc">' + esc(subject.description || 'Åpne fagpakken for kort, quiz og repetisjon.') + '</p>'
      + '<div class="meta"><span>' + esc(subject.statusText || 'Klar') + '</span><span>' + esc(subject.tools || '0') + ' verktøy</span></div>'
      + '</div></a>';
  }

  function renderFilters() {
    var host = document.getElementById('flashcardSubjectFilters');
    if (!host || host.dataset.fallbackRendered === '1') return;
    var categories = window.HaugnesSubjects && typeof window.HaugnesSubjects.getCategories === 'function' ? window.HaugnesSubjects.getCategories() : [];
    host.innerHTML = '<button class="fc-filter-chip active" type="button" data-filter="all">Alle</button>' + categories.map(function (category) {
      return '<button class="fc-filter-chip" type="button" data-filter="' + esc(category.id) + '">' + esc(category.shortLabel || category.label) + '</button>';
    }).join('');
    host.dataset.fallbackRendered = '1';
    host.querySelectorAll('.fc-filter-chip').forEach(function (button) {
      button.addEventListener('click', function () {
        filter = button.getAttribute('data-filter') || 'all';
        host.querySelectorAll('.fc-filter-chip').forEach(function (btn) { btn.classList.toggle('active', btn === button); });
        render(true);
      });
    });
    var search = document.getElementById('flashcardSubjectSearch');
    if (search && !search.dataset.fallbackBound) {
      search.dataset.fallbackBound = '1';
      search.addEventListener('input', function () { render(true); });
    }
  }

  function render(force) {
    var grid = document.getElementById('subjectGrid');
    if (!grid || !window.HaugnesSubjects || typeof window.HaugnesSubjects.getCatalog !== 'function') return false;
    if (!force && grid.querySelector('.subject-card[data-id]')) return true;

    var all = window.HaugnesSubjects.getCatalog();
    var query = (document.getElementById('flashcardSubjectSearch') && document.getElementById('flashcardSubjectSearch').value || '').trim().toLowerCase();
    var visible = all.filter(function (subject) {
      var text = [subject.code, subject.name, subject.description, subject.categoryLabel].join(' ').toLowerCase();
      return (filter === 'all' || subject.categoryId === filter) && (!query || text.indexOf(query) !== -1);
    });

    var totals = all.reduce(function (out, subject) {
      var stats = deckStats(subject);
      out.decks += stats.decks;
      out.cards += stats.cards;
      return out;
    }, { decks: 0, cards: 0 });
    var subjectCount = document.getElementById('fcSubjectCount');
    var deckCount = document.getElementById('fcDeckCount');
    var cardCount = document.getElementById('fcCardCount');
    if (subjectCount) subjectCount.textContent = String(all.length);
    if (deckCount) deckCount.textContent = String(totals.decks);
    if (cardCount) cardCount.textContent = String(totals.cards);

    var grouped = {};
    visible.forEach(function (subject) {
      var id = subject.categoryId || 'other';
      if (!grouped[id]) grouped[id] = { label: subject.categoryLabel || 'Fag', subjects: [] };
      grouped[id].subjects.push(subject);
    });
    var categories = window.HaugnesSubjects.getCategories ? window.HaugnesSubjects.getCategories() : [];
    var html = categories.map(function (category) {
      var group = grouped[category.id];
      if (!group || !group.subjects.length) return '';
      return '<section class="fc-subject-group"><div class="fc-subject-group-head"><span>' + group.subjects.length + ' fag</span><h2>' + esc(group.label) + '</h2></div><div class="fc-subject-group-grid">' + group.subjects.map(cardHtml).join('') + '</div></section>';
    }).join('');
    if (!visible.length) html = '<section class="fc-empty-state"><strong>Fant ingen fag</strong><span>Prøv et annet søk eller velg alle semestre.</span></section>';
    grid.innerHTML = html;
    return true;
  }

  function run() {
    renderFilters();
    if (!render(false)) window.setTimeout(run, 160);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  window.setTimeout(run, 700);
  window.setTimeout(run, 1600);
})(window, document);
