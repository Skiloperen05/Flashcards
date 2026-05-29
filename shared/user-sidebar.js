(function (window, document) {
  'use strict';

  if (window.__haugnesUserSidebarInstalled) return;
  window.__haugnesUserSidebarInstalled = true;

  var rendering = false;
  var observer = null;

  function rootRelative(path) {
    if (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function') {
      return window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '');
    }
    return '../' + path.replace(/^\//, '');
  }

  function currentPath() {
    return window.location.pathname.replace(/\/index\.html$/, '/').toLowerCase();
  }

  function pageName() {
    return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  }

  function isUserPage() {
    return /\/user\//.test(window.location.pathname);
  }

  function icon(name) {
    var icons = {
      home: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/></svg>',
      subjects: '<svg viewBox="0 0 24 24"><path d="M12 6.5C10.5 5 7.5 4.5 4.5 5v13c3-.5 6 0 7.5 1.5 1.5-1.5 4.5-2 7.5-1.5V5c-3-.5-6 0-7.5 1.5z"/><path d="M12 6.5V20"/></svg>',
      focus: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/></svg>',
      plan: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3.5v3M16 3.5v3M4 9h16M8 13h2M12 13h2M16 13h1M8 16h2M12 16h2"/></svg>',
      flashcards: '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="13" height="13" rx="2"/><path d="M8 3.5h10A1.5 1.5 0 0 1 19.5 5v10"/></svg>',
      tasks: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5M8 17h7"/></svg>',
      answers: '<svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5V8h4"/><path d="M9.5 12h5M9.5 15.5h4"/></svg>',
      exam: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 3.5h6v3H9z"/><path d="M8.5 11h7M8.5 15h5"/></svg>',
      notes: '<svg viewBox="0 0 24 24"><path d="M6 4.5h12v15H6z"/><path d="M9 8h6M9 11h6M9 14h4"/></svg>',
      stats: '<svg viewBox="0 0 24 24"><path d="M4 20h16M7 17v-5M12 17V7M17 17v-8"/></svg>',
      achievements: '<svg viewBox="0 0 24 24"><path d="M8 4.5h8v4a4 4 0 0 1-8 0z"/><path d="M8 6H5.5v1.5a3 3 0 0 0 3 3M16 6h2.5v1.5a3 3 0 0 1-3 3M9.5 20h5M12 13v3.5"/></svg>',
      settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a7.2 7.2 0 0 0-1.9-1.1L14.3 3h-4.6l-.3 2.9A7.2 7.2 0 0 0 7.5 7L5.1 6l-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.4 2.4-1a7.2 7.2 0 0 0 1.9 1.1l.3 2.9h4.6l.3-2.9a7.2 7.2 0 0 0 1.9-1.1l2.4 1 2-3.4-2-1.5c.1-.4.1-.7.1-1.1z"/></svg>'
    };
    return icons[name] || '';
  }

  var MENU = [
    { id: 'home', label: 'Hjem', href: 'user/index.html', icon: 'home' },
    { id: 'subjects', label: 'Mine fag', href: 'user/subjects.html', icon: 'subjects' },
    { id: 'plan', label: 'Studieplan', href: 'user/studieplan.html', icon: 'plan' },
    { id: 'focus', label: 'Fokus for i dag', href: 'user/index.html#today', icon: 'focus' },
    { id: 'flashcards', label: 'Alle flashcards', href: 'flashcards/', icon: 'flashcards' },
    { id: 'tasks', label: 'Oppgavebank', href: 'user/oppgavebank.html', icon: 'tasks' },
    { id: 'answers', label: 'A-besvarelser', href: 'user/a-besvarelser.html', icon: 'answers' },
    { id: 'exam', label: 'Eksamensanalyse', href: 'ret14/eksamen/', icon: 'exam' },
    { id: 'notes', label: 'Notater', href: 'user/notater.html', icon: 'notes' },
    { id: 'stats', label: 'Statistikk', href: 'user/progress.html', icon: 'stats' },
    { id: 'achievements', label: 'Prestasjoner', href: 'user/achievements.html', icon: 'achievements' },
    { id: 'settings', label: 'Innstillinger', href: 'user/settings.html', icon: 'settings', bottom: true }
  ];

  function activeId() {
    var page = pageName();
    var path = currentPath();
    if (page === 'index.html' && window.location.hash === '#today') return 'focus';
    if (page === 'index.html') return 'home';
    if (page === 'subjects.html') return 'subjects';
    if (page === 'studieplan.html') return 'plan';
    if (/\/flashcards\//.test(path)) return 'flashcards';
    if (page === 'oppgavebank.html') return 'tasks';
    if (page === 'a-besvarelser.html') return 'answers';
    if (/\/ret14\/eksamen\//.test(path)) return 'exam';
    if (page === 'notater.html') return 'notes';
    if (page === 'progress.html') return 'stats';
    if (page === 'achievements.html') return 'achievements';
    if (page === 'settings.html') return 'settings';
    return '';
  }

  function itemHtml(item, active) {
    return '<a class="nav-link ' + (active === item.id ? 'active' : '') + (item.bottom ? ' hf-nav-bottom' : '') + '" href="' + rootRelative(item.href) + '" data-nav-id="' + item.id + '">' + icon(item.icon) + '<span>' + item.label + '</span></a>';
  }

  function normalizeBrandMarkup() {
    document.querySelectorAll('.sidebar .brand, .mobile-top .brand').forEach(function (brand) {
      var title = brand.querySelector('.brand-title');
      var sub = brand.querySelector('.brand-sub');
      if (title) title.textContent = 'Haugnes';
      if (sub) sub.textContent = 'Flashcards';
    });
  }

  function injectStyles() {
    if (document.getElementById('haugnes-user-sidebar-css')) return;
    var style = document.createElement('style');
    style.id = 'haugnes-user-sidebar-css';
    style.textContent = [
      '.sidebar .brand{display:flex!important;align-items:center!important;gap:12px!important;padding:0 6px 10px!important;min-width:0!important;overflow:visible!important}',
      '.sidebar .brand>.logo-mark,.mobile-top .brand>.logo-mark{width:46px!important;height:46px!important;flex:0 0 46px!important;border-radius:14px!important;background:#0b244e url("' + rootRelative('assets/Flashcardslogo.png') + '") center center/contain no-repeat!important}',
      '.sidebar .brand>span:not(.logo-mark),.mobile-top .brand>span:not(.logo-mark){display:grid!important;gap:6px!important;line-height:1!important;min-width:0!important;overflow:visible!important}',
      '.sidebar .brand-title,.mobile-top .brand-title{display:block!important;font-size:20px!important;font-weight:950!important;letter-spacing:.20em!important;text-transform:uppercase!important;color:#fff!important;white-space:nowrap!important;line-height:1!important}',
      '.sidebar .brand-sub,.mobile-top .brand-sub{display:block!important;font-size:9px!important;font-weight:950!important;letter-spacing:.42em!important;text-transform:uppercase!important;color:#e8bc68!important;white-space:nowrap!important;line-height:1!important;margin-top:0!important}',
      '.sidebar .nav{display:grid!important;gap:5px!important;flex:0 0 auto}',
      '.sidebar .nav-link{min-height:38px!important}',
      '.sidebar .nav-link:not(.active){background:transparent!important}',
      '.sidebar .nav-link svg{width:20px;height:20px;flex:0 0 20px;stroke:currentColor;stroke-width:1.9;fill:none;stroke-linecap:round;stroke-linejoin:round}',
      '.sidebar .nav-link span{min-width:0}',
      '.sidebar .nav .hf-nav-divider{height:1px;background:rgba(255,255,255,.10);margin:8px 8px 5px}',
      '.sidebar .nav-link.hf-nav-bottom{margin-top:4px}',
      '@media(max-height:860px){.sidebar .nav{gap:3px!important}.sidebar .nav-link{padding-top:8px!important;padding-bottom:8px!important;min-height:34px!important}.sidebar .nav .hf-nav-divider{margin-top:5px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function loadBottomNormalizer() {
    if (document.getElementById('haugnes-sidebar-bottom-js')) {
      if (window.HaugnesSidebarBottom && typeof window.HaugnesSidebarBottom.run === 'function') window.HaugnesSidebarBottom.run();
      return;
    }
    var script = document.createElement('script');
    script.id = 'haugnes-sidebar-bottom-js';
    script.src = rootRelative('shared/sidebar-bottom-normalizer.js');
    script.defer = true;
    script.onload = function () { if (window.HaugnesSidebarBottom && typeof window.HaugnesSidebarBottom.run === 'function') window.HaugnesSidebarBottom.run(); };
    document.head.appendChild(script);
  }

  function render() {
    if (!isUserPage()) return;
    var nav = document.querySelector('.sidebar .nav, nav.nav');
    if (!nav) return;
    injectStyles();
    normalizeBrandMarkup();
    rendering = true;
    var active = activeId();
    nav.innerHTML = MENU.map(function (item) {
      return (item.bottom ? '<div class="hf-nav-divider" aria-hidden="true"></div>' : '') + itemHtml(item, active);
    }).join('');
    rendering = false;
    loadBottomNormalizer();
    installObserver(nav);
  }

  function installObserver(nav) {
    if (observer || !window.MutationObserver || !nav) return;
    observer = new MutationObserver(function () {
      if (rendering) return;
      window.clearTimeout(installObserver.timer);
      installObserver.timer = window.setTimeout(function () {
        normalizeBrandMarkup();
        var current = Array.prototype.map.call(nav.querySelectorAll('.nav-link'), function (a) { return a.getAttribute('data-nav-id'); }).join('|');
        var expected = MENU.map(function (item) { return item.id; }).join('|');
        if (current !== expected || !nav.querySelector('.nav-link.active')) render();
      }, 80);
    });
    observer.observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  function run() {
    render();
    window.setTimeout(render, 120);
    window.setTimeout(render, 650);
    window.setTimeout(render, 1400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
  window.addEventListener('hashchange', render);
  window.addEventListener('haugnes:subject-access-changed', render);

  window.HaugnesUserSidebar = { run: run, render: render, menu: MENU.slice() };
})(window, document);
