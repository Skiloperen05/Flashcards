(function (window, document) {
  'use strict';

  if (window.__haugnesSubjectGateInstalled) return;
  window.__haugnesSubjectGateInstalled = true;

  var SUBJECT_DIRS = {
    ret14: 'RET14',
    sol1: 'SOL1',
    sam2: 'SAM2',
    sam3: 'SAM3',
    met2: 'MET2',
    mat10: 'MAT10',
    sam1a: 'SAM1A',
    met1: 'MET1',
    kom1: 'KOM1',
    ret1a: 'RET1A',
    bed1: 'BED1'
  };

  var SUBJECT_QUERY_ALIASES = {
    ret14: 'RET14', 'ret-14': 'RET14', skatt: 'RET14', skatterett: 'RET14',
    sol1: 'SOL1', 'sol-1': 'SOL1', 'subj-sol1': 'SOL1', subj_sol1: 'SOL1', sol: 'SOL1',
    organisasjonsatferd: 'SOL1', organisasjonsrett: 'SOL1',
    sam2: 'SAM2', mikro: 'SAM2', 'mikroøkonomi': 'SAM2',
    sam3: 'SAM3', makro: 'SAM3', 'makroøkonomi': 'SAM3',
    met2: 'MET2', mat10: 'MAT10', sam1a: 'SAM1A', met1: 'MET1', kom1: 'KOM1', ret1a: 'RET1A', bed1: 'BED1'
  };

  function rootRelative(path) {
    if (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function') {
      return window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '');
    }
    return '../' + path.replace(/^\//, '');
  }

  function detectSubjectFromPath() {
    var match = window.location.pathname.match(/\/(ret14|sol1|sam2|sam3|met2|mat10|sam1a|met1|kom1|ret1a|bed1)(?:\/|$)/i);
    if (!match) return null;
    return SUBJECT_DIRS[match[1].toLowerCase()] || null;
  }

  function detectSubjectFromQuery() {
    if (!/\/flashcards\/?(?:index\.html)?$/.test(window.location.pathname)) return null;
    var params = new URLSearchParams(window.location.search);
    var raw = (params.get('subject') || '').trim().toLowerCase();
    if (!raw) return null;
    return SUBJECT_QUERY_ALIASES[raw] || null;
  }

  function detectSubject() {
    return detectSubjectFromPath() || detectSubjectFromQuery();
  }

  function redirectToButikk(subject) {
    var target = rootRelative('user/butikk.html') + '?fag=' + encodeURIComponent(subject) + '&reason=lock';
    window.location.replace(target);
  }

  function gate() {
    var subject = detectSubject();
    if (!subject) return;
    if (!window.HaugnesEntitlements) return;
    // Only act when the user is actually signed in. If no session yet,
    // AuthGuard.requireAuth() will redirect to /login, and gate() will
    // be called again from enhancePages after auth resolves.
    if (!window.AuthGuard || typeof window.AuthGuard.getSession !== 'function') return;
    var session = window.AuthGuard.getSession();
    if (!session || !session.user) return;
    window.HaugnesEntitlements.load().then(function () {
      if (window.HaugnesEntitlements.isEntitled(subject)) return;
      redirectToButikk(subject);
    }).catch(function () {});
  }

  window.HaugnesSubjectGate = {
    gate: gate,
    detectSubject: detectSubject
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', gate);
  else gate();
})(window, document);
