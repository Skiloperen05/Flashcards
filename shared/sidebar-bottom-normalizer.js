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
      '.sidebar .side-bottom,.hf-global-sidebar .side-bottom{margin-top:auto!important;display:grid!important;gap:14px!important;width:100%!important;padding-top:18px!important;flex:0 0 auto!important}',
      '.sidebar .side-bottom>*:not(.hf-user-card):not(.hf-exit-card),.hf-global-sidebar .side-bottom>*:not(.hf-user-card):not(.hf-exit-card){display:none!important}',
      '.sidebar .hf-user-card,.sidebar .hf-exit-card,.hf-global-sidebar .hf-user-card,.hf-global-sidebar .hf-exit-card{box-sizing:border-box;width:100%;text-decoration:none;font-family:Lora,Georgia,serif}',
      '.sidebar .hf-user-card,.hf-global-sidebar .hf-user-card{display:grid!important;grid-template-columns:58px minmax(0,1fr) 20px;align-items:center;gap:14px;min-height:88px;padding:14px 16px;border-radius:26px;background:linear-gradient(180deg,rgba(18,30,54,.94),rgba(12,24,45,.94));border:1px solid rgba(126,162,255,.20);box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 18px 34px rgba(0,0,0,.22);color:#f7fbff;overflow:hidden}',
      '.sidebar .hf-avatar,.hf-global-sidebar .hf-avatar{width:58px;height:58px;border-radius:20px;display:grid;place-items:center;background:#f8fbff;border:4px solid #456dff;box-shadow:0 10px 24px rgba(47,98,255,.28);overflow:hidden}',
      '.sidebar .hf-avatar img,.hf-global-sidebar .hf-avatar img{width:100%;height:100%;object-fit:contain;padding:5px}',
      '.sidebar .hf-user-copy,.hf-global-sidebar .hf-user-copy{min-width:0;display:block;line-height:1.1}',
      '.sidebar .hf-user-copy strong,.hf-global-sidebar .hf-user-copy strong{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff;font-size:18px;font-weight:950;letter-spacing:-.01em}',
      '.sidebar .hf-user-copy span,.hf-global-sidebar .hf-user-copy span{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#aab8d8;font-size:14px;font-weight:750;margin-top:6px}',
      '.sidebar .hf-user-arrow,.hf-global-sidebar .hf-user-arrow{width:18px;height:18px;color:#9fb0cf;stroke:currentColor;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}',
      '.sidebar .hf-exit-card,.hf-global-sidebar .hf-exit-card{display:flex!important;align-items:center;justify-content:center;gap:13px;min-height:66px;padding:15px 16px;border-radius:24px;border:1px solid rgba(239,68,68,.36);background:linear-gradient(180deg,rgba(45,17,36,.72),rgba(28,12,31,.86));color:#ffd0d4;font-size:18px;font-weight:950;cursor:pointer;box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}',
      '.sidebar .hf-exit-card svg,.hf-global-sidebar .hf-exit-card svg{width:22px;height:22px;stroke:currentColor;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round}',
      '@media(max-width:1180px){.app>.sidebar{display:none!important}}',
      '@media(max-height:820px){.sidebar .side-bottom,.hf-global-sidebar .side-bottom{gap:10px!important;padding-top:12px!important}.sidebar .hf-user-card,.hf-global-sidebar .hf-user-card{min-height:72px;border-radius:22px;grid-template-columns:48px minmax(0,1fr) 18px}.sidebar .hf-avatar,.hf-global-sidebar .hf-avatar{width:48px;height:48px;border-radius:17px}.sidebar .hf-exit-card,.hf-global-sidebar .hf-exit-card{min-height:54px;border-radius:20px}}'
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
