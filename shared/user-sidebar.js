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

  function isLoginPage() {
    return /\/login\.html$/i.test(window.location.pathname);
  }

  function isAppSectionPage() {
    return /(?:ret14|sol1|sam2|sam3|met2|mat10|sam1a|met1|kom1|ret1a|bed1|flashcards)\//i.test(window.location.pathname);
  }

  // Global sidebar: every app page outside /user/ (subject hubs, tools,
  // flashcards) gets the same fixed left menu so navigation is always visible.
  function shouldRenderGlobal() {
    return !isUserPage() && !isLoginPage() && isAppSectionPage();
  }

  function icon(name) {
    var icons = {
      home: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/></svg>',
      subjects: '<svg viewBox="0 0 24 24"><path d="M12 6.5C10.5 5 7.5 4.5 4.5 5v13c3-.5 6 0 7.5 1.5 1.5-1.5 4.5-2 7.5-1.5V5c-3-.5-6 0-7.5 1.5z"/><path d="M12 6.5V20"/></svg>',
      shop: '<svg viewBox="0 0 24 24"><path d="M5 9.5 6.2 4h11.6L19 9.5"/><path d="M6 10v9.5h12V10"/><path d="M9 14h6"/></svg>',
      focus: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/></svg>',
      plan: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3.5v3M16 3.5v3M4 9h16M8 13h2M12 13h2M16 13h1M8 16h2M12 16h2"/></svg>',
      flashcards: '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="13" height="13" rx="2"/><path d="M8 3.5h10A1.5 1.5 0 0 1 19.5 5v10"/></svg>',
      tasks: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5M8 17h7"/></svg>',
      answers: '<svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5V8h4"/><path d="M9.5 12h5M9.5 15.5h4"/></svg>',
      memos: '<svg viewBox="0 0 24 24"><path d="M6.5 3.5h11v17l-5.5-3.4-5.5 3.4z"/><path d="M9.5 8h5M9.5 11.5h5"/></svg>',
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
    { id: 'shop', label: 'Butikk', href: 'user/butikk.html', icon: 'shop' },
    { id: 'plan', label: 'Studieplan', href: 'user/studieplan.html', icon: 'plan' },
    { id: 'focus', label: 'Fokus for i dag', href: 'user/index.html#today', icon: 'focus' },
    { id: 'flashcards', label: 'Alle flashcards', href: 'flashcards/', icon: 'flashcards' },
    { id: 'tasks', label: 'Oppgavebank', href: 'user/oppgavebank.html', icon: 'tasks' },
    { id: 'answers', label: 'A-besvarelser', href: 'user/a-besvarelser.html', icon: 'answers' },
    { id: 'memos', label: 'Memoarer', href: 'user/memoarer.html', icon: 'memos' },
    { id: 'exam', label: 'Eksamensanalyse', href: 'user/eksamensanalyse.html', icon: 'exam' },
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
    if (page === 'butikk.html') return 'shop';
    if (page === 'studieplan.html') return 'plan';
    if (/\/flashcards\//.test(path)) return 'flashcards';
    if (page === 'oppgavebank.html') return 'tasks';
    if (page === 'a-besvarelser.html') return 'answers';
    if (page === 'memoarer.html') return 'memos';
    if (page === 'eksamensanalyse.html' || /\/ret14\/eksamen\//.test(path)) return 'exam';
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

  var GS_HIDDEN_KEY = 'hf_global_sidebar_hidden';

  function isDesktop() {
    return !window.matchMedia || window.matchMedia('(min-width:1181px)').matches;
  }

  function globalSidebarOpen() {
    return document.documentElement.classList.contains('hf-gs-open');
  }

  function setGlobalSidebarOpen(open) {
    document.documentElement.classList.toggle('hf-gs-open', !!open);
    if (isDesktop()) {
      try {
        if (open) window.localStorage.removeItem(GS_HIDDEN_KEY);
        else window.localStorage.setItem(GS_HIDDEN_KEY, '1');
      } catch (e) {}
    }
    var toggle = document.getElementById('hfGlobalSidebarToggle');
    if (toggle) {
      toggle.textContent = open ? '‹' : '☰';
      toggle.title = open ? 'Skjul meny' : 'Vis meny';
    }
  }

  function injectGlobalStyles() {
    if (document.getElementById('haugnes-global-sidebar-css')) return;
    var style = document.createElement('style');
    style.id = 'haugnes-global-sidebar-css';
    style.textContent = [
      '.hf-global-sidebar{position:fixed;top:0;left:0;bottom:0;width:248px;z-index:9000;box-sizing:border-box;padding:22px 16px;background:linear-gradient(180deg,rgba(4,16,38,.97),rgba(7,23,51,.97));border-right:1px solid rgba(255,255,255,.11);display:flex;flex-direction:column;gap:18px;overflow-y:auto;font-family:Lora,Georgia,serif;transform:translateX(-100%);transition:transform .22s ease;scrollbar-width:thin}',
      '.hf-global-sidebar,.hf-global-sidebar *{box-sizing:border-box}',
      '.hf-global-sidebar::-webkit-scrollbar{width:7px}.hf-global-sidebar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.10);border-radius:99px}',
      'html.hf-gs-open .hf-global-sidebar{transform:none}',
      'html.hf-gs-open body{margin-left:248px!important}',
      '@media(max-width:1180px){html.hf-gs-open body{margin-left:0!important}}',
      '.hf-global-sidebar .brand{display:flex;align-items:center;gap:12px;padding:0 6px 10px;color:#fff;text-decoration:none}',
      '.hf-global-sidebar .brand>.logo-mark{width:46px;height:46px;flex:0 0 46px;border-radius:14px;border:1px solid rgba(255,255,255,.16);background:#0b244e url("' + rootRelative('assets/Flashcardslogo.png') + '") center center/contain no-repeat}',
      '.hf-global-sidebar .brand>span:not(.logo-mark){display:grid;gap:6px;line-height:1}',
      '.hf-global-sidebar .brand-title{display:block;font-size:20px;font-weight:950;letter-spacing:.20em;text-transform:uppercase;color:#fff;line-height:1}',
      '.hf-global-sidebar .brand-sub{display:block;font-size:9px;font-weight:950;letter-spacing:.42em;text-transform:uppercase;color:#e8bc68;line-height:1}',
      '.hf-global-sidebar .nav{display:grid;gap:5px}',
      '.hf-global-sidebar .nav-link{display:flex;align-items:center;gap:11px;min-height:38px;padding:9px 12px;border-radius:14px;color:#c6d3eb;font-size:14px;font-weight:750;text-decoration:none;transition:background .18s ease,color .18s ease}',
      '.hf-global-sidebar .nav-link:hover{background:rgba(255,255,255,.06);color:#fff}',
      '.hf-global-sidebar .nav-link.active{background:linear-gradient(135deg,#2455ef,#3f73ff);color:#fff;box-shadow:0 12px 26px rgba(47,98,255,.28)}',
      '.hf-global-sidebar .nav-link svg{width:20px;height:20px;flex:0 0 20px;stroke:currentColor;stroke-width:1.9;fill:none;stroke-linecap:round;stroke-linejoin:round}',
      '.hf-global-sidebar .hf-nav-divider{height:1px;background:rgba(255,255,255,.10);margin:8px 8px 5px}',
      '.hf-gs-toggle{position:fixed;bottom:18px;left:14px;z-index:9001;width:42px;height:42px;border-radius:14px;border:1px solid rgba(126,162,255,.35);background:rgba(11,33,72,.94);color:#dce6f7;font-size:17px;font-family:inherit;cursor:pointer;box-shadow:0 14px 30px rgba(0,0,0,.35);transition:left .22s ease}',
      'html.hf-gs-open .hf-gs-toggle{left:192px}',
      '@media(max-height:860px){.hf-global-sidebar .nav{gap:3px}.hf-global-sidebar .nav-link{min-height:34px;padding-top:8px;padding-bottom:8px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function renderGlobal() {
    if (!document.body) return;
    injectGlobalStyles();
    var aside = document.getElementById('hfGlobalSidebar');
    if (!aside) {
      aside = document.createElement('aside');
      aside.id = 'hfGlobalSidebar';
      aside.className = 'hf-global-sidebar';
      aside.setAttribute('aria-label', 'Hovedmeny');
      document.body.appendChild(aside);

      var toggle = document.createElement('button');
      toggle.id = 'hfGlobalSidebarToggle';
      toggle.type = 'button';
      toggle.className = 'hf-gs-toggle';
      toggle.addEventListener('click', function () { setGlobalSidebarOpen(!globalSidebarOpen()); });
      document.body.appendChild(toggle);

      var startOpen = false;
      if (isDesktop()) {
        try { startOpen = window.localStorage.getItem(GS_HIDDEN_KEY) !== '1'; }
        catch (e) { startOpen = true; }
      }
      setGlobalSidebarOpen(startOpen);
    }
    var active = activeId();
    aside.innerHTML = '<a class="brand" href="' + rootRelative('user/index.html') + '"><span class="logo-mark" aria-hidden="true"></span><span><span class="brand-title">Haugnes</span><span class="brand-sub">Flashcards</span></span></a>'
      + '<nav class="nav" aria-label="Brukermeny">' + MENU.map(function (item) {
        return (item.bottom ? '<div class="hf-nav-divider" aria-hidden="true"></div>' : '') + itemHtml(item, active);
      }).join('') + '</nav>';
  }

  function render() {
    if (!isUserPage()) {
      if (shouldRenderGlobal()) renderGlobal();
      return;
    }
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
