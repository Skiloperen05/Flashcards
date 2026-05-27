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

  function addStylesheet(id, href) {
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function currentUserPage() {
    var file = window.location.pathname.split('/').pop() || 'index.html';
    return file.toLowerCase();
  }

  function addPageStylesheet() {
    var page = currentUserPage();
    if (page === 'achievements.html') {
      addStylesheet('haugnes-achievements-css', '../shared/haugnes-achievements.css');
    } else if (page === 'progress.html') {
      addStylesheet('haugnes-progress-css', '../shared/haugnes-progress.css');
    } else if (page === 'subjects.html') {
      addStylesheet('haugnes-subjects-css', '../shared/haugnes-subjects.css');
    } else {
      addStylesheet('haugnes-dashboard-css', '../shared/haugnes-dashboard.css');
    }
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
    document.querySelectorAll('.logo-text').forEach(function (text) {
      if (/StudieHub/i.test(text.textContent)) text.textContent = 'Haugnes';
    });
  }

  function installSharedLogout(AuthGuard) {
    if (!AuthGuard || typeof AuthGuard.logout !== 'function') return;
    window.handleLogout = function () {
      return AuthGuard.logout();
    };
  }

  function standardizeDashboardLinks() {
    var subjectsNav = document.querySelector('.nav-link[href="#mine-fag"]');
    if (subjectsNav) subjectsNav.href = 'subjects.html';

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

  function enhanceAchievementsPage() {
    if (currentUserPage() !== 'achievements.html') return;
    document.title = 'Prestasjoner — Haugnes Flashcards';
    var heroTitle = document.querySelector('.hero-title');
    var heroSub = document.querySelector('.hero-sub');
    var back = document.querySelector('.header-back');
    if (heroTitle) heroTitle.innerHTML = 'Bygg en <span>streak</span>.';
    if (heroSub) heroSub.textContent = 'Lås opp badges når du fullfører økter, repeterer kort og treffer nye milepæler.';
    if (back) back.lastChild.textContent = ' Dashboard';
  }

  function runEnhancements() {
    addPageStylesheet();
    applyDashboardBranding();
    standardizeDashboardLinks();
    enhanceAchievementsPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runEnhancements);
  } else {
    runEnhancements();
  }

  loadSharedAuthGuard().then(function (AuthGuard) {
    if (!AuthGuard || typeof AuthGuard.requireAuth !== 'function') {
      window.location.replace('../login.html');
      return;
    }

    AuthGuard.requireAuth().then(function (session) {
      if (!session) return;
      window.__userSession = session;
      runEnhancements();
      installSharedLogout(AuthGuard);
      window.setTimeout(function () {
        installSharedLogout(AuthGuard);
        runEnhancements();
      }, 0);
      if (typeof window.onUserAuthorized === 'function') window.onUserAuthorized(session);
    });
  }).catch(function () {
    window.location.replace('../login.html');
  });
})(window, document);
