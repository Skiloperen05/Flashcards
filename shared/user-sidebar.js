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

  function isPublicPage() {
    var path = currentPath();
    return /\/login\.html$/.test(path) || (!window.AuthGuard && /\/$/.test(path));
  }

  function entitlements() {
    return window.HaugnesEntitlements || null;
  }

  function isAdminMode() {
    var ent = entitlements();
    return !!(ent && ent.effectiveAdmin && ent.effectiveAdmin());
  }

  function isActualAdmin() {
    var ent = entitlements();
    return !!(ent && ent.isAdmin && ent.isAdmin());
  }

  function icon(name) {
    var icons = {
      home: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/></svg>',
      subjects:
        '<svg viewBox="0 0 24 24"><path d="M12 6.5C10.5 5 7.5 4.5 4.5 5v13c3-.5 6 0 7.5 1.5 1.5-1.5 4.5-2 7.5-1.5V5c-3-.5-6 0-7.5 1.5z"/><path d="M12 6.5V20"/></svg>',
      shop: '<svg viewBox="0 0 24 24"><path d="M5 9.5 6.2 4h11.6L19 9.5"/><path d="M6 10v9.5h12V10"/><path d="M9 14h6"/></svg>',
      plan: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3.5v3M16 3.5v3M4 9h16M8 13h2M12 13h2M16 13h1M8 16h2M12 16h2"/></svg>',
      flashcards:
        '<svg viewBox="0 0 24 24"><rect x="4" y="7" width="13" height="13" rx="2"/><path d="M8 3.5h10A1.5 1.5 0 0 1 19.5 5v10"/></svg>',
      tasks:
        '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5M8 17h7"/></svg>',
      answers:
        '<svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20.5H7z"/><path d="M14 3.5V8h4"/><path d="M9.5 12h5M9.5 15.5h4"/></svg>',
      exam: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 3.5h6v3H9z"/><path d="M8.5 11h7M8.5 15h5"/></svg>',
      notes: '<svg viewBox="0 0 24 24"><path d="M6 4.5h12v15H6z"/><path d="M9 8h6M9 11h6M9 14h4"/></svg>',
      admin: '<svg viewBox="0 0 24 24"><path d="M4 20V4M4 20h16"/><path d="M8 17v-5M13 17V8M18 17v-7"/></svg>',
      users:
        '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M18 20a6 6 0 0 0-3-5"/></svg>',
      payments:
        '<svg viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="11" rx="2"/><path d="M3.5 10h17"/></svg>',
      settings:
        '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a7.2 7.2 0 0 0-1.9-1.1L14.3 3h-4.6l-.3 2.9A7.2 7.2 0 0 0 7.5 7L5.1 6l-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.4 2.4-1a7.2 7.2 0 0 0 1.9 1.1l.3 2.9h4.6l.3-2.9a7.2 7.2 0 0 0 1.9-1.1l2.4 1 2-3.4-2-1.5c.1-.4.1-.7.1-1.1z"/></svg>',
    };
    return icons[name] || '';
  }

  var GROUPS = [
    {
      label: 'Læring',
      items: [
        { id: 'home', label: 'Hjem', href: 'user/index.html', icon: 'home' },
        { id: 'flashcards', label: 'Alle flashcards', href: 'flashcards/', icon: 'flashcards' },
        { id: 'plan', label: 'Studieplan', href: 'user/studieplan.html', icon: 'plan' },
      ],
    },
    {
      label: 'Innhold',
      items: [
        { id: 'subjects', label: 'Mine fag', href: 'user/subjects.html', icon: 'subjects' },
        { id: 'tasks', label: 'Oppgavebank', href: 'user/oppgavebank.html', icon: 'tasks' },
        { id: 'answers', label: 'A-besvarelser', href: 'user/a-besvarelser.html', icon: 'answers' },
        { id: 'notes', label: 'Notater', href: 'user/notater.html', icon: 'notes' },
        { id: 'exam', label: 'Eksamensanalyse', href: 'user/eksamensanalyse.html', icon: 'exam' },
      ],
    },
    {
      label: 'Administrasjon',
      adminOnly: true,
      items: [
        { id: 'admin', label: 'Admin hjem', href: 'user/admin.html', icon: 'admin' },
        { id: 'admin-users', label: 'Brukerstatistikk', href: 'user/admin.html#brukere', icon: 'users' },
        { id: 'admin-payments', label: 'Betalinger', href: 'user/admin.html#betaling', icon: 'payments' },
        { id: 'admin-shop', label: 'Butikkadmin', href: 'user/butikk.html#admin', icon: 'shop' },
      ],
    },
    {
      label: 'Konto',
      items: [
        { id: 'shop', label: 'Butikk', href: 'user/butikk.html', icon: 'shop' },
        { id: 'settings', label: 'Innstillinger', href: 'user/settings.html', icon: 'settings' },
      ],
    },
  ];

  function flatMenu(includeAdmin) {
    var items = [];
    GROUPS.forEach(function (group) {
      if (group.adminOnly && !includeAdmin) return;
      group.items.forEach(function (item) {
        items.push(item);
      });
    });
    return items;
  }

  function activeId() {
    var page = pageName();
    var path = currentPath();
    if (page === 'admin.html') {
      if (window.location.hash === '#brukere') return 'admin-users';
      if (window.location.hash === '#betaling') return 'admin-payments';
      return 'admin';
    }
    if (/\/user\/$/.test(path) || (isUserPage() && page === 'index.html')) return 'home';
    if (page === 'subjects.html') return 'subjects';
    if (page === 'butikk.html') return window.location.hash === '#admin' ? 'admin-shop' : 'shop';
    if (page === 'studieplan.html') return 'plan';
    if (/\/flashcards\//.test(path)) return 'flashcards';
    if (page === 'oppgavebank.html') return 'tasks';
    if (page === 'a-besvarelser.html') return 'answers';
    if (page === 'eksamensanalyse.html') return 'exam';
    if (/\/ret14\/eksamen\//.test(path) || /\/sam2\/eksamen\//.test(path) || /\/sam3\/eksamensradar/.test(path))
      return 'exam';
    if (page === 'notater.html') return 'notes';
    if (page === 'settings.html') return 'settings';
    return '';
  }

  function itemHtml(item, active) {
    return (
      '<a class="nav-link hf-navlink' +
      (active === item.id ? ' active' : '') +
      '" href="' +
      rootRelative(item.href) +
      '" data-nav-id="' +
      item.id +
      '"' +
      (active === item.id ? ' aria-current="page"' : '') +
      '>' +
      icon(item.icon) +
      '<span>' +
      item.label +
      '</span></a>'
    );
  }

  function groupHtml(group, active) {
    return (
      '<div class="hf-nav-group"><div class="hf-nav-group-label">' +
      group.label +
      '</div>' +
      group.items
        .map(function (item) {
          return itemHtml(item, active);
        })
        .join('') +
      '</div>'
    );
  }

  function expectedIds(includeAdmin) {
    return flatMenu(includeAdmin)
      .map(function (item) {
        return item.id;
      })
      .join('|');
  }

  function normalizeBrandMarkup() {
    document.querySelectorAll('.sidebar .brand, .mobile-top .brand').forEach(function (brand) {
      var title = brand.querySelector('.brand-title');
      var sub = brand.querySelector('.brand-sub');
      if (title) title.textContent = 'Haugnes';
      if (sub) sub.textContent = 'Flashcards';
    });
  }

  function ensureSidebar() {
    var sidebar = document.querySelector('.sidebar');
    if (sidebar) return sidebar;
    if (isPublicPage() || !window.AuthGuard) return null;
    sidebar = document.createElement('aside');
    sidebar.className = 'sidebar hf-global-sidebar';
    sidebar.innerHTML =
      '<a class="brand" href="' +
      rootRelative('index.html') +
      '"><span class="logo-mark"></span><span><span class="brand-title">Haugnes</span><span class="brand-sub">Flashcards</span></span></a><nav class="nav" aria-label="Hovedmeny"></nav><div class="side-bottom"><a class="user-mini" href="' +
      rootRelative('user/settings.html') +
      '"><div class="avatar">?</div><div><strong>Bruker</strong><span>NHH-student</span></div></a></div>';
    document.body.insertBefore(sidebar, document.body.firstChild);
    document.documentElement.classList.add('hf-has-global-sidebar');
    return sidebar;
  }

  function updateFooterRole() {
    var role = isAdminMode() ? 'Administrator' : 'NHH-student';
    document.querySelectorAll('.sidebar .user-mini span, .sidebar .hf-user__role').forEach(function (el) {
      el.textContent = role;
    });
  }

  function injectStyles() {
    if (document.getElementById('haugnes-user-sidebar-css')) return;
    var style = document.createElement('style');
    style.id = 'haugnes-user-sidebar-css';
    style.textContent = [
      '.sidebar{width:264px!important;flex:0 0 264px!important;overflow-y:auto!important;scrollbar-width:thin!important}',
      '.sidebar::-webkit-scrollbar{width:8px}.sidebar::-webkit-scrollbar-thumb{background:rgba(126,162,255,.25);border-radius:999px}',
      '.sidebar .brand{display:flex!important;align-items:center!important;gap:12px!important;padding:0 6px 10px!important;min-width:0!important;overflow:visible!important}',
      '.sidebar .brand>.logo-mark,.mobile-top .brand>.logo-mark{width:46px!important;height:46px!important;flex:0 0 46px!important;border-radius:14px!important;background:#0b244e url("' +
        rootRelative('assets/Flashcardslogo.png') +
        '") center center/contain no-repeat!important}',
      '.sidebar .brand>span:not(.logo-mark),.mobile-top .brand>span:not(.logo-mark){display:grid!important;gap:6px!important;line-height:1!important;min-width:0!important;overflow:visible!important}',
      '.sidebar .brand-title,.mobile-top .brand-title{display:block!important;font-size:20px!important;font-weight:950!important;letter-spacing:.20em!important;text-transform:uppercase!important;color:#fff!important;white-space:nowrap!important;line-height:1!important}',
      '.sidebar .brand-sub,.mobile-top .brand-sub{display:block!important;font-size:9px!important;font-weight:950!important;letter-spacing:.42em!important;text-transform:uppercase!important;color:#e8bc68!important;white-space:nowrap!important;line-height:1!important;margin-top:0!important}',
      '.sidebar .nav{display:flex!important;flex-direction:column!important;gap:16px!important;flex:0 0 auto}',
      '.sidebar .hf-nav-group{display:grid!important;gap:5px!important}',
      '.sidebar .hf-nav-group-label{padding:0 12px 3px;color:#7f93b5!important;font-size:10px!important;font-weight:950!important;letter-spacing:.14em!important;text-transform:uppercase!important}',
      '.sidebar .nav-link{min-height:38px!important;border:1px solid transparent!important}',
      '.sidebar .nav-link:not(.active){background:transparent!important}',
      '.sidebar .nav-link[aria-current="page"]{background:linear-gradient(135deg,#2455ef,#3f73ff)!important;color:#fff!important;box-shadow:0 12px 26px rgba(47,98,255,.28)!important}',
      '.sidebar .nav-link svg{width:20px;height:20px;flex:0 0 20px;stroke:currentColor;stroke-width:1.9;fill:none;stroke-linecap:round;stroke-linejoin:round}',
      '.sidebar .nav-link span{min-width:0}',
      '.hf-global-sidebar{position:fixed!important;inset:0 auto 0 0!important;z-index:60!important;height:100vh!important;padding:22px 16px!important;background:linear-gradient(180deg,rgba(4,16,38,.97),rgba(7,23,51,.96))!important;border-right:1px solid rgba(255,255,255,.10)!important;display:flex!important;flex-direction:column!important;gap:18px!important}',
      'html.hf-has-global-sidebar body{padding-left:264px!important}',
      'html.hf-has-global-sidebar .topbar,html.hf-has-global-sidebar .top{left:264px}',
      '.sidebar .side-bottom{margin-top:auto!important}',
      '.sidebar .user-mini{display:flex!important;align-items:center!important;gap:11px!important;padding:11px!important;border-radius:16px!important;background:rgba(255,255,255,.05)!important;border:1px solid rgba(255,255,255,.10)!important;color:#fff!important}',
      '.sidebar .avatar{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#2f62ff,#e8bc68);font-weight:900;color:#fff;flex:0 0 40px}',
      '@media(max-width:1180px){html.hf-has-global-sidebar body{padding-left:0!important}.hf-global-sidebar{display:none!important}.app>.sidebar:not(.hf-global-sidebar){display:none!important}}',
      '@media(max-height:860px){.sidebar .nav{gap:12px!important}.sidebar .nav-link{padding-top:8px!important;padding-bottom:8px!important;min-height:34px!important}.sidebar .hf-nav-group-label{padding-bottom:1px!important}}',
    ].join('\n');
    document.head.appendChild(style);
  }

  function loadBottomNormalizer() {
    if (document.getElementById('haugnes-sidebar-bottom-js')) {
      if (window.HaugnesSidebarBottom && typeof window.HaugnesSidebarBottom.run === 'function')
        window.HaugnesSidebarBottom.run();
      return;
    }
    var script = document.createElement('script');
    script.id = 'haugnes-sidebar-bottom-js';
    script.src = rootRelative('shared/sidebar-bottom-normalizer.js');
    script.defer = true;
    script.onload = function () {
      if (window.HaugnesSidebarBottom && typeof window.HaugnesSidebarBottom.run === 'function')
        window.HaugnesSidebarBottom.run();
    };
    document.head.appendChild(script);
  }

  function render() {
    var sidebar = ensureSidebar();
    var nav = sidebar ? sidebar.querySelector('.nav') : document.querySelector('.sidebar .nav, nav.nav');
    if (!nav) return;
    injectStyles();
    normalizeBrandMarkup();
    updateFooterRole();
    rendering = true;
    var includeAdmin = isAdminMode();
    var active = activeId();
    nav.innerHTML = GROUPS.map(function (group) {
      if (group.adminOnly && !includeAdmin) return '';
      return groupHtml(group, active);
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
        updateFooterRole();
        var current = Array.prototype.map
          .call(nav.querySelectorAll('.nav-link'), function (a) {
            return a.getAttribute('data-nav-id');
          })
          .join('|');
        if (current !== expectedIds(isAdminMode()) || !nav.querySelector('.nav-link[aria-current="page"]')) render();
      }, 80);
    });
    observer.observe(nav, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-current'],
    });
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
  window.addEventListener('haugnes:entitlements-changed', render);

  window.HaugnesUserSidebar = { run: run, render: render, groups: GROUPS.slice(), menu: flatMenu(isActualAdmin()) };
})(window, document);
