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
    var memo = page && page.memo;
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
    if (tabbar && memo && !tabbar.querySelector('a[href="#memo"]')) tabbar.insertAdjacentHTML('beforeend', '<a href="#memo">Memo</a>');
    if (tabbar && resourcePanel && !tabbar.querySelector('a[href="#ressurser"]')) tabbar.insertAdjacentHTML('beforeend', '<a href="#ressurser">Ressurser</a>');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})(window, document);
