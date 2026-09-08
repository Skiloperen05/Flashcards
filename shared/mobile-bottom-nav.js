(function (window, document) {
  'use strict';

  if (window.__mobileBottomNavInstalled) return;
  window.__mobileBottomNavInstalled = true;

  var BREAKPOINT = 768;
  var NAV_ID = 'mobileBottomNav';

  function rootRelative(path) {
    if (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function') {
      return window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '');
    }
    var script = document.currentScript || (function () {
      var scripts = document.querySelectorAll('script[src*="mobile-bottom-nav"]');
      return scripts.length ? scripts[scripts.length - 1] : null;
    })();
    if (script && script.src) {
      try {
        var scriptUrl = new URL(script.src, window.location.href);
        return new URL('../' + path.replace(/^\//, ''), scriptUrl).pathname;
      } catch (e) { /* fall through */ }
    }
    var depth = window.location.pathname.split('/').filter(Boolean).length - 1;
    return new Array(Math.max(depth, 0) + 1).join('../') + path.replace(/^\//, '');
  }

  function currentPage() {
    var path = window.location.pathname;
    if (/\/user\/index\.html$|\/user\/?$/.test(path)) return 'home';
    if (/\/flashcards\/?(?:index\.html)?$/.test(path)) return 'flashcards';
    if (/\/user\/subjects\.html/.test(path)) return 'subjects';
    if (/\/user\/butikk\.html/.test(path)) return 'butikk';
    if (/\/user\/eksamensanalyse\.html|\/user\/a-besvarelser\.html/.test(path)) return 'analyse';
    if (/\/user\/settings\.html/.test(path)) return 'settings';
    if (/\/(ret14|sam2|sam3|sol1|bed1|kom1|met1|met2|mat10|ret1a|sam1a)\//.test(path)) return 'subject';
    if (/\/index\.html$|\/$/.test(path) && !/\/user\//.test(path) && !/\/flashcards\//.test(path)) return 'landing';
    return '';
  }

  function shouldShow() {
    var page = currentPage();
    return page !== 'landing' && page !== '' && window.innerWidth <= BREAKPOINT;
  }

  function isActive(page) {
    var current = currentPage();
    if (page === 'home' && current === 'home') return true;
    if (page === 'flashcards' && (current === 'flashcards' || current === 'subject')) return true;
    if (page === 'subjects' && current === 'subjects') return true;
    if (page === 'butikk' && current === 'butikk') return true;
    if (page === 'settings' && current === 'settings') return true;
    return false;
  }

  function cls(page) {
    return isActive(page) ? ' class="active"' : '';
  }

  function buildNav() {
    var nav = document.createElement('nav');
    nav.id = NAV_ID;
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('aria-label', 'Mobilmeny');
    nav.innerHTML =
      '<a href="' + rootRelative('user/index.html') + '"' + cls('home') + '>' +
        '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/></svg>' +
        '<span>Hjem</span></a>' +
      '<a href="' + rootRelative('flashcards/') + '"' + cls('flashcards') + '>' +
        '<svg viewBox="0 0 24 24"><rect x="7" y="4" width="12" height="16" rx="2"/><path d="M5 8h10"/><path d="M5 12h10"/></svg>' +
        '<span>Flashcards</span></a>' +
      '<a href="' + rootRelative('user/subjects.html') + '"' + cls('subjects') + '>' +
        '<svg viewBox="0 0 24 24"><path d="M12 6.5C10.5 5 7.5 4.5 4.5 5v13c3-.5 6 0 7.5 1.5 1.5-1.5 4.5-2 7.5-1.5V5c-3-.5-6 0-7.5 1.5z"/><path d="M12 6.5V20"/></svg>' +
        '<span>Fag</span></a>' +
      '<a href="' + rootRelative('user/butikk.html') + '"' + cls('butikk') + '>' +
        '<svg viewBox="0 0 24 24"><path d="M5 9.5 6.2 4h11.6L19 9.5"/><path d="M6 10v9.5h12V10"/><path d="M9 14h6"/></svg>' +
        '<span>Butikk</span></a>' +
      '<a href="' + rootRelative('user/settings.html') + '"' + cls('settings') + '>' +
        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a7.2 7.2 0 0 0-1.9-1.1L14.3 3h-4.6l-.3 2.9A7.2 7.2 0 0 0 7.5 7L5.1 6l-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.4 2.4-1a7.2 7.2 0 0 0 1.9 1.1l.3 2.9h4.6l.3-2.9a7.2 7.2 0 0 0 1.9-1.1l2.4 1 2-3.4-2-1.5c.1-.4.1-.7.1-1.1z"/></svg>' +
        '<span>Innstillinger</span></a>';
    return nav;
  }

  function inject() {
    var existing = document.getElementById(NAV_ID);
    if (shouldShow()) {
      if (!existing) {
        document.body.appendChild(buildNav());
        document.body.classList.add('has-mobile-nav');
      }
    } else {
      if (existing) {
        existing.remove();
        document.body.classList.remove('has-mobile-nav');
      }
    }
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    inject();
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(inject, 100);
    });
  });

  window.MobileBottomNav = { inject: inject };
})(window, document);
