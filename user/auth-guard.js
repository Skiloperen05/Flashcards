(function (window, document) {
  var SHARED_SCRIPT = '../shared/auth-guard.js';

  function loadSharedAuthGuard() {
    return new Promise(function (resolve, reject) {
      if (window.AuthGuard) {
        resolve(window.AuthGuard);
        return;
      }

      var existing = Array.prototype.slice.call(document.scripts).filter(function (script) {
        return /shared\/auth-guard\.js(?:\?|$)/.test(script.src || '');
      })[0];

      if (existing) {
        existing.addEventListener('load', function () { resolve(window.AuthGuard); });
        existing.addEventListener('error', reject);
        return;
      }

      var script = document.createElement('script');
      script.src = SHARED_SCRIPT;
      script.onload = function () { resolve(window.AuthGuard); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function addDashboardStylesheet() {
    if (document.getElementById('haugnes-dashboard-css')) return;
    var link = document.createElement('link');
    link.id = 'haugnes-dashboard-css';
    link.rel = 'stylesheet';
    link.href = '../shared/haugnes-dashboard.css';
    document.head.appendChild(link);
  }

  function applyDashboardBranding() {
    var logoPath = '../assets/haugnes-logo-mark.svg';
    document.querySelectorAll('.logo-mark').forEach(function (mark) {
      mark.textContent = '';
      mark.setAttribute('aria-hidden', 'true');
      mark.style.background = "#0b244e url('" + logoPath + "') center/78% no-repeat";
      mark.style.border = '1px solid rgba(255,255,255,.14)';
      mark.style.boxShadow = '0 14px 30px rgba(0,0,0,.28),0 0 34px rgba(47,98,255,.18)';
      mark.style.overflow = 'hidden';
    });
  }

  function installSharedLogout(AuthGuard) {
    if (!AuthGuard || typeof AuthGuard.logout !== 'function') return;
    window.handleLogout = function () {
      return AuthGuard.logout();
    };
  }

  function standardizeDashboardLinks() {
    var todayStart = document.querySelector('#today .start-btn[href="../ret14/"]');
    if (todayStart) {
      todayStart.href = '../flashcards/?subject=ret14';
      todayStart.textContent = 'Start flashcards';
    }

    var recommendationStart = document.querySelector('.recommend .start-btn[href="../ret14/"]');
    if (recommendationStart) {
      recommendationStart.href = '../flashcards/?subject=ret14';
      recommendationStart.textContent = 'Start nå';
    }

    document.querySelectorAll('.subject-card .subject-btn').forEach(function (button) {
      button.textContent = 'Åpne fag';
    });

    document.querySelectorAll('.subject-card').forEach(function (card) {
      var code = card.querySelector('.subject-code');
      var href = card.getAttribute('href') || '';
      if (!code) return;
      card.setAttribute('aria-label', 'Åpne fagside for ' + code.textContent.trim());
      if (href.indexOf('../ret14/') === 0 || href.indexOf('../sol1/') === 0 || href.indexOf('../sam2/') === 0 || href.indexOf('../sam3/') === 0) {
        card.setAttribute('title', 'Åpne fagside');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      addDashboardStylesheet();
      applyDashboardBranding();
      standardizeDashboardLinks();
    });
  } else {
    addDashboardStylesheet();
    applyDashboardBranding();
    standardizeDashboardLinks();
  }

  loadSharedAuthGuard().then(function (AuthGuard) {
    if (!AuthGuard || typeof AuthGuard.requireAuth !== 'function') {
      window.location.replace('../login.html');
      return;
    }

    AuthGuard.requireAuth().then(function (session) {
      if (!session) return;
      window.__userSession = session;
      addDashboardStylesheet();
      applyDashboardBranding();
      standardizeDashboardLinks();
      installSharedLogout(AuthGuard);
      window.setTimeout(function () {
        installSharedLogout(AuthGuard);
        standardizeDashboardLinks();
      }, 0);
      if (typeof window.onUserAuthorized === 'function') window.onUserAuthorized(session);
    });
  }).catch(function () {
    window.location.replace('../login.html');
  });
})(window, document);
