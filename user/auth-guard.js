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

  function applyDashboardBranding() {
    var logoPath = '../assets/haugnes-logo-mark.svg';
    document.querySelectorAll('.logo-mark').forEach(function (mark) {
      mark.textContent = '';
      mark.setAttribute('aria-hidden', 'true');
      mark.style.background = "#0b244e url('" + logoPath + "') center/78% no-repeat";
      mark.style.border = '1px solid rgba(255,255,255,.14)';
      mark.style.boxShadow = '0 14px 30px rgba(0,0,0,.28)';
      mark.style.overflow = 'hidden';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyDashboardBranding);
  } else {
    applyDashboardBranding();
  }

  loadSharedAuthGuard().then(function (AuthGuard) {
    if (!AuthGuard || typeof AuthGuard.requireAuth !== 'function') {
      window.location.replace('../login.html');
      return;
    }

    AuthGuard.requireAuth().then(function (session) {
      if (!session) return;
      window.__userSession = session;
      applyDashboardBranding();
      if (typeof window.onUserAuthorized === 'function') window.onUserAuthorized(session);
    });
  }).catch(function () {
    window.location.replace('../login.html');
  });
})(window, document);
