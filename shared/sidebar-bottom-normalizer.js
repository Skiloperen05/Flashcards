(function (window, document) {
  'use strict';

  if (window.__haugnesSidebarBottomInstalled) return;
  window.__haugnesSidebarBottomInstalled = true;

  function rootRelative(path) {
    if (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function') return window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '');
    var depth = window.location.pathname.split('/').filter(Boolean).length - 1;
    return new Array(Math.max(depth, 0) + 1).join('../') + path.replace(/^\//, '');
  }

  function esc(value) {
    return String(value || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function sessionName() {
    var current = document.querySelector('.hf-user-card strong, .user-mini strong, .profile-card strong');
    if (current && current.textContent.trim() && current.textContent.trim() !== 'Bruker') return current.textContent.trim();
    var session = window.AuthGuard && typeof window.AuthGuard.getSession === 'function' ? window.AuthGuard.getSession() : window.__userSession;
    var email = session && session.user && session.user.email ? session.user.email : '';
    var base = email ? email.split('@')[0] : 'Birkhaugnes';
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  function injectStyles() {
    if (document.getElementById('haugnes-sidebar-bottom-css')) return;
    var style = document.createElement('style');
    style.id = 'haugnes-sidebar-bottom-css';
    style.textContent = [
      '.sidebar,.hf-global-sidebar{display:flex!important;flex-direction:column!important;overflow-y:auto;scrollbar-width:thin}',
      '.sidebar .side-bottom,.hf-global-sidebar .side-bottom{margin-top:auto!important;display:grid!important;gap:10px!important;width:100%!important;padding-top:14px!important;flex:0 0 auto!important}',
      '.sidebar .side-bottom>*:not(.hf-user-card):not(.hf-exit-card),.hf-global-sidebar .side-bottom>*:not(.hf-user-card):not(.hf-exit-card){display:none!important}',
      '.sidebar .hf-user-card,.sidebar .hf-exit-card,.hf-global-sidebar .hf-user-card,.hf-global-sidebar .hf-exit-card{box-sizing:border-box;width:100%;text-decoration:none;font-family:Lora,Georgia,serif}',
      '.sidebar .hf-user-card,.hf-global-sidebar .hf-user-card{display:grid!important;grid-template-columns:38px minmax(0,1fr) 14px!important;align-items:center!important;gap:9px!important;min-height:56px!important;padding:7px 10px!important;border-radius:16px!important;background:linear-gradient(180deg,rgba(18,30,54,.94),rgba(12,24,45,.94));border:1px solid rgba(126,162,255,.20);box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 10px 20px rgba(0,0,0,.16);color:#f7fbff;overflow:hidden}',
      '.sidebar .hf-avatar,.hf-global-sidebar .hf-avatar{width:38px!important;height:38px!important;border-radius:13px!important;display:grid;place-items:center;background:#f8fbff;border:3px solid #456dff;box-shadow:0 7px 16px rgba(47,98,255,.22);overflow:hidden}',
      '.sidebar .hf-avatar img,.hf-global-sidebar .hf-avatar img{width:100%;height:100%;object-fit:contain;padding:4px}',
      '.sidebar .hf-user-copy,.hf-global-sidebar .hf-user-copy{min-width:0;display:block;line-height:1.1}',
      '.sidebar .hf-user-copy strong,.hf-global-sidebar .hf-user-copy strong{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;font-size:13px!important;font-weight:950;letter-spacing:-.01em}',
      '.sidebar .hf-user-copy span,.hf-global-sidebar .hf-user-copy span{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#aab8d8;font-size:10.5px!important;font-weight:750;margin-top:3px!important}',
      '.sidebar .hf-user-arrow,.hf-global-sidebar .hf-user-arrow{width:14px!important;height:14px!important;color:#9fb0cf;stroke:currentColor;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}',
      '.sidebar .hf-exit-card,.hf-global-sidebar .hf-exit-card{display:flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;min-height:42px!important;padding:8px 10px!important;border-radius:16px!important;border:1px solid rgba(239,68,68,.36);background:linear-gradient(180deg,rgba(45,17,36,.72),rgba(28,12,31,.86));color:#ffd0d4;font-size:14px!important;font-weight:950;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}',
      '.sidebar .hf-exit-card svg,.hf-global-sidebar .hf-exit-card svg{width:16px!important;height:16px!important;stroke:currentColor;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round}',
      '.sidebar .hf-user-card.user-mini,.hf-global-sidebar .hf-user-card.user-mini{grid-template-columns:38px minmax(0,1fr) 14px!important;min-height:56px!important;padding:7px 10px!important;border-radius:16px!important}',
      '.sidebar .hf-user-card.user-mini .hf-avatar,.hf-global-sidebar .hf-user-card.user-mini .hf-avatar{width:38px!important;height:38px!important;border-radius:13px!important}',
      '.sidebar .hf-exit-card,.hf-global-sidebar .hf-exit-card{min-height:42px!important;padding:8px 10px!important;border-radius:16px!important;font-size:14px!important}',
      '@media(max-width:1180px){.app>.sidebar{display:none!important}}',
      '@media(max-height:820px){.sidebar .side-bottom,.hf-global-sidebar .side-bottom{gap:8px!important;padding-top:10px!important}.sidebar .hf-user-card.user-mini,.hf-global-sidebar .hf-user-card.user-mini{min-height:52px!important;padding:6px 9px!important;border-radius:15px!important;grid-template-columns:34px minmax(0,1fr) 13px!important}.sidebar .hf-user-card.user-mini .hf-avatar,.hf-global-sidebar .hf-user-card.user-mini .hf-avatar{width:34px!important;height:34px!important;border-radius:12px!important}.sidebar .hf-exit-card,.hf-global-sidebar .hf-exit-card{min-height:40px!important;padding:7px 9px!important;border-radius:15px!important;font-size:13.5px!important}.sidebar .hf-exit-card svg,.hf-global-sidebar .hf-exit-card svg{width:15px!important;height:15px!important}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function html() {
    var name = sessionName();
    return '<div class="side-bottom" data-unified-bottom="1">'
      + '<a class="hf-user-card user-mini" href="' + rootRelative('user/settings.html') + '">'
      + '<span class="hf-avatar"><img src="' + rootRelative('assets/illustrations/01_graduation_cap.png') + '" alt=""></span>'
      + '<span class="hf-user-copy"><strong>' + esc(name) + '</strong><span>NHH-student · 2026</span></span>'
      + '<svg class="hf-user-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
      + '</a>'
      + '<button class="hf-exit-card" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3"/><path d="M10 12H3"/><path d="M6 8l-4 4 4 4"/></svg><span>Logg ut</span></button>'
      + '</div>';
  }

  function bindLogout(container) {
    var button = container.querySelector('.hf-exit-card');
    if (!button) return;
    button.onclick = function () {
      if (typeof window.handleLogout === 'function') return window.handleLogout();
      if (window.AuthGuard && typeof window.AuthGuard.logout === 'function') return window.AuthGuard.logout();
      window.location.href = rootRelative('login.html');
    };
  }

  function renderIn(container) {
    if (!container) return;
    injectStyles();
    var old = container.querySelector('.side-bottom');
    if (old) old.remove();
    container.insertAdjacentHTML('beforeend', html());
    bindLogout(container);
  }

  function render() {
    renderIn(document.querySelector('.sidebar'));
    renderIn(document.querySelector('.hf-global-sidebar'));
  }

  function run() {
    render();
    window.setTimeout(render, 120);
    window.setTimeout(render, 700);
    window.setTimeout(render, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  window.HaugnesSidebarBottom = { run: run, render: render };
})(window, document);
