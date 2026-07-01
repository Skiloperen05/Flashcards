(function (window, document) {
  var SHARED_SCRIPT = '../shared/auth-guard.js';
  var MODEL_PAGES = {
    'butikk.html': { label: 'Butikk', icon: '⚷', subtitle: 'Lås opp fag' },
    'a-besvarelser.html': { label: 'A-besvarelser', icon: '▤', subtitle: 'Se sterke tidligere svar' },
    'oppgavebank.html': { label: 'Oppgavebank', icon: '▣', subtitle: 'Øv på eksamensnære oppgaver' },
    'notater.html': { label: 'Notater', icon: '▥', subtitle: 'Samle egne fagnotater' },
    'studieplan.html': { label: 'Studieplan', icon: '☷', subtitle: 'Planlegg ukens økter' },
    'settings.html': { label: 'Innstillinger', icon: '⚙', subtitle: 'Profil og preferanser' }
  };

  function loadSharedAuthGuard() {
    return new Promise(function (resolve, reject) {
      if (window.AuthGuard) return resolve(window.AuthGuard);
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

  function addScript(id, src, onload) {
    var existing = document.getElementById(id);
    if (existing) {
      if (onload) {
        if ((id === 'haugnes-subject-meta-js' && window.HaugnesSubjects) || (id === 'haugnes-subject-access-js' && window.HaugnesSubjectAccess) || (id === 'timeedit-fetch-proxy-js' && window.HaugnesTimeEditProxy) || (id === 'nhh-schedule-api-js' && window.NHHScheduleAPI) || (id === 'nhh-schedule-normalizer-js' && window.NHHScheduleAPI && window.NHHScheduleAPI.normalizeEvents) || (id === 'nhh-strict-course-filter-js' && window.NHHScheduleAPI && window.NHHScheduleAPI.strictCourseFilter) || (id === 'haugnes-studyplan-js' && window.HaugnesStudyplan) || (id === 'haugnes-answer-library-js' && window.__haugnesAnswerLibraryInstalled)) onload();
        else existing.addEventListener('load', onload, { once: true });
      }
      return;
    }
    var script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    if (onload) script.onload = onload;
    document.head.appendChild(script);
  }

  function currentUserPage() {
    return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function isModelPage(page) { return !!MODEL_PAGES[page]; }

  function addPageStylesheet() {
    var page = currentUserPage();
    if (page === 'achievements.html') addStylesheet('haugnes-achievements-css', '../shared/haugnes-achievements.css');
    else if (page === 'progress.html') addStylesheet('haugnes-progress-css', '../shared/haugnes-progress.css');
    else if (page === 'subjects.html') addStylesheet('haugnes-subjects-css', '../shared/haugnes-subjects.css');
    else if (!isModelPage(page)) addStylesheet('haugnes-dashboard-css', '../shared/haugnes-dashboard.css');
  }

  function installNavVisibilityStyles() {
    if (document.getElementById('haugnes-user-nav-visibility-fix')) return;
    var style = document.createElement('style');
    style.id = 'haugnes-user-nav-visibility-fix';
    style.textContent = [
      '.sidebar{overflow-y:auto;scrollbar-width:thin}',
      '.sidebar::-webkit-scrollbar{width:8px}',
      '.sidebar::-webkit-scrollbar-thumb{background:rgba(126,162,255,.25);border-radius:999px}',
      '.sidebar .nav{gap:5px}',
      '.sidebar .nav-link{min-height:38px;padding:9px 11px}',
      '.sidebar .side-bottom{margin-top:14px}',
      '.side-col .small-list{max-height:none}',
      '@media(max-height:820px){.sidebar{padding-top:16px;padding-bottom:16px}.brand{padding-bottom:6px}.streak-card{padding:13px}.streak-number{font-size:26px}.user-mini{padding:9px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function loadSubjectMeta(onload) {
    if (window.HaugnesSubjects) {
      if (onload) onload();
      return;
    }
    addScript('haugnes-subject-meta-js', '../shared/subject-meta.js', onload);
  }

  function loadSubjectAccess(onload) {
    loadSubjectMeta(function () {
      addScript('haugnes-subject-access-js', '../shared/subject-access.js', function () {
        if (window.HaugnesSubjectAccess && typeof window.HaugnesSubjectAccess.enhanceCurrentPage === 'function') window.HaugnesSubjectAccess.enhanceCurrentPage();
        if (onload) onload();
      });
    });
  }

  function applyDashboardBranding() {
    var logoPath = '../assets/Flashcardslogo.png';
    document.querySelectorAll('.logo-mark').forEach(function (mark) {
      mark.textContent = '';
      mark.setAttribute('aria-hidden', 'true');
      mark.style.background = "#0b244e url('" + logoPath + "') center center/contain no-repeat";
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
    window.handleLogout = function () { return AuthGuard.logout(); };
  }

  function renderDashboardSubjects() {
    if (currentUserPage() !== 'index.html' || !window.HaugnesSubjects) return;
    var container = document.querySelector('.subjects');
    if (!container) return;
    var subjects = window.HaugnesSubjects.getAll().filter(function (subject) { return subject.status !== 'build'; });
    container.innerHTML = subjects.map(function (subject) {
      var emblem = subject.emblem ? '<img class="emblem-img" src="' + subject.emblem + '" alt="" onerror="this.remove()">' : '';
      return '<a class="subject-card" style="--accent:' + subject.accent + ';--pct:' + (subject.progress || 0) + '" href="' + subject.path + '">'
        + '<div class="subject-top"><span class="subject-icon">' + emblem + '<span class="emblem-fallback">' + subject.icon + '</span></span><span class="dots">⋮</span></div>'
        + '<div class="subject-code">' + subject.code + '</div><div class="subject-name">' + subject.name + '</div>'
        + '<div class="ring"><svg viewBox="0 0 120 120"><circle class="ring-bg" cx="60" cy="60" r="52"/><circle class="ring-fg" cx="60" cy="60" r="52"/></svg><div class="ring-label">' + (subject.progress || 0) + '%</div></div>'
        + '<div class="ring-sub">Ikke startet ennå</div><span class="subject-cta">Start øving</span></a>';
    }).join('') || '<div class="panel"><div class="panel-inner">Du har ingen fag i Mine fag ennå. <a href="butikk.html">Gå til Butikk</a> for å kjøpe et fag.</div></div>';
    var sectionLink = document.querySelector('#mine-fag a');
    if (sectionLink) { sectionLink.href = 'subjects.html'; sectionLink.textContent = 'Administrer fag →'; }
  }

  function standardizeDashboardLinks() {
    var subjectsNav = document.querySelector('.nav-link[href="#mine-fag"]');
    if (subjectsNav) subjectsNav.href = 'subjects.html';
    var todayStart = document.querySelector('#today .start-btn[href="../ret14/"]');
    if (todayStart) { todayStart.href = '../flashcards/?subject=ret14'; todayStart.textContent = 'Start økt →'; }
    var todayPlan = document.querySelector('#today .ghost-link[href="../ret14/"]');
    if (todayPlan) todayPlan.href = '../ret14/';
    var recommendationStart = document.querySelector('.recommend .start-btn[href="../ret14/"]');
    if (recommendationStart) { recommendationStart.href = '../flashcards/?subject=ret14'; recommendationStart.textContent = 'Start nå →'; }
    document.querySelectorAll('.subject-card .subject-cta').forEach(function (button) { button.textContent = 'Start øving'; });
    document.querySelectorAll('.subject-card .subject-btn').forEach(function (button) { button.textContent = 'Åpne fag'; });
  }

  function createNavLink(href, config, isActive) {
    var link = document.createElement('a');
    link.className = 'nav-link' + (isActive ? ' active' : '');
    link.href = href;
    link.innerHTML = '<span class="nav-ico">' + config.icon + '</span>' + config.label;
    return link;
  }

  function installModelPageLinks() {
    var page = currentUserPage();
    var nav = document.querySelector('.sidebar .nav, nav.nav');
    if (nav) {
      var insertionAnchor = nav.querySelector('a[href="../ret14/eksamen/"]') || nav.querySelector('a[href="subjects.html"]') || nav.querySelector('a[href="progress.html"]');
      Object.keys(MODEL_PAGES).forEach(function (href) {
        if (nav.querySelector('a[href="' + href + '"]')) return;
        var link = createNavLink(href, MODEL_PAGES[href], page === href);
        if (insertionAnchor && insertionAnchor.parentNode === nav) { insertionAnchor.insertAdjacentElement('afterend', link); insertionAnchor = link; }
        else nav.appendChild(link);
      });
      if (isModelPage(page)) {
        document.querySelectorAll('.nav-link.active').forEach(function (active) { if (active.getAttribute('href') !== page) active.classList.remove('active'); });
        var current = nav.querySelector('a[href="' + page + '"]');
        if (current) current.classList.add('active');
      }
    }
    if (page === 'index.html') installDashboardShortcuts();
  }

  function installDashboardShortcuts() {
    var shortcuts = document.querySelector('.side-col .small-list');
    if (!shortcuts) return;
    ['a-besvarelser.html', 'oppgavebank.html', 'notater.html', 'studieplan.html', 'settings.html'].forEach(function (href) {
      if (shortcuts.querySelector('a[href="' + href + '"]')) return;
      var config = MODEL_PAGES[href];
      var item = document.createElement('a');
      item.className = 'small-item';
      item.href = href;
      item.innerHTML = '<div><strong>' + config.label + '</strong><span>' + config.subtitle + '</span></div><span>→</span>';
      shortcuts.appendChild(item);
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

  function loadStudyplanTools() {
    if (currentUserPage() !== 'studieplan.html') return;
    loadSubjectAccess(function () {
      addScript('timeedit-fetch-proxy-js', '../shared/timeedit-fetch-proxy.js', function () {
        addScript('nhh-schedule-api-js', '../shared/nhh-schedule-api.js', function () {
          addScript('nhh-schedule-normalizer-js', '../shared/nhh-schedule-normalizer.js', function () {
            addScript('nhh-strict-course-filter-js', '../shared/nhh-strict-course-filter.js', function () {
              addScript('haugnes-studyplan-js', '../shared/haugnes-studyplan.js', function () {
                if (window.HaugnesStudyplan && typeof window.HaugnesStudyplan.render === 'function') window.HaugnesStudyplan.render();
                if (window.HaugnesSubjectAccess && typeof window.HaugnesSubjectAccess.enhanceCurrentPage === 'function') window.HaugnesSubjectAccess.enhanceCurrentPage();
              });
            });
          });
        });
      });
    });
  }

  function loadAnswerLibrary() {
    if (currentUserPage() !== 'a-besvarelser.html') return;
    loadSubjectAccess(function () {
      addScript('haugnes-answer-library-js', '../shared/haugnes-answer-library.js');
    });
  }

  function runEnhancements() {
    addPageStylesheet();
    installNavVisibilityStyles();
    applyDashboardBranding();
    loadSubjectAccess(function () {
      standardizeDashboardLinks();
      installModelPageLinks();
      enhanceAchievementsPage();
      loadStudyplanTools();
      loadAnswerLibrary();
      if (currentUserPage() === 'index.html') renderDashboardSubjects();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runEnhancements);
  else runEnhancements();

  window.addEventListener('haugnes:subject-access-changed', function () {
    runEnhancements();
    if (window.HaugnesDashboardProgress && typeof window.HaugnesDashboardProgress.run === 'function') window.HaugnesDashboardProgress.run();
    if (window.HaugnesAnswerLibrary && typeof window.HaugnesAnswerLibrary.render === 'function') window.HaugnesAnswerLibrary.render();
  });

  loadSharedAuthGuard().then(function (AuthGuard) {
    if (!AuthGuard || typeof AuthGuard.requireAuth !== 'function') { window.location.replace('../login.html'); return; }
    AuthGuard.requireAuth().then(function (session) {
      if (!session) return;
      window.__userSession = session;
      runEnhancements();
      installSharedLogout(AuthGuard);
      window.setTimeout(function () { installSharedLogout(AuthGuard); runEnhancements(); }, 0);
      if (typeof window.onUserAuthorized === 'function') window.onUserAuthorized(session);
    });
  }).catch(function () { window.location.replace('../login.html'); });
})(window, document);
