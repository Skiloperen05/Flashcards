(function (window, document) {
  'use strict';

  if (window.__haugnesSidebarBottomInstalled) return;
  window.__haugnesSidebarBottomInstalled = true;

  function rootRelative(path) {
    if (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function') return window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '');
    return '../' + path.replace(/^\//, '');
  }

  function isUserPage() { return /\/user\//.test(window.location.pathname); }
  function esc(value) { return String(value || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function name() {
    var current = document.querySelector('.user-mini strong, .profile-card strong');
    if (current && current.textContent.trim()) return current.textContent.trim();
    var session = window.AuthGuard && typeof window.AuthGuard.getSession === 'function' ? window.AuthGuard.getSession() : null;
    var email = session && session.user && session.user.email ? session.user.email : '';
    return email ? email.split('@')[0] : 'Birkhaugnes';
  }

  function injectStyles() {
    if (document.getElementById('haugnes-sidebar-bottom-css')) return;
    var style = document.createElement('style');
    style.id = 'haugnes-sidebar-bottom-css';
    style.textContent = [
      '.sidebar{display:flex!important;flex-direction:column!important;overflow-y:auto;scrollbar-width:thin}',
      '.sidebar .side-bottom{margin-top:auto!important;display:grid!important;gap:12px!important;width:100%!important;padding-top:18px!important;flex:0 0 auto!important}',
      '.sidebar .hf-week-card{display:none!important}',
      '.sidebar .hf-user-card,.sidebar .hf-premium-card,.sidebar .hf-exit-card{box-sizing:border-box;width:100%;border-radius:18px;text-decoration:none;border:1px solid rgba(255,255,255,.12)}',
      '.sidebar .hf-user-card{display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,.055);color:#dbe6ff}',
      '.sidebar .hf-avatar{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#586cff,#e6c795);color:#fff;font-weight:950}',
      '.sidebar .hf-user-card strong{display:block;color:#fff;font-size:14px;line-height:1.1}.sidebar .hf-user-card span span{display:block;color:#9fb0cf;font-size:12px;margin-top:3px}.sidebar .hf-user-card .arrow{margin-left:auto;color:#aebddd;font-size:26px}',
      '.sidebar .hf-premium-card{padding:18px 14px;text-align:center;border-color:rgba(232,188,104,.30);background:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.045));color:#dbe6ff}',
      '.sidebar .hf-premium-card .crown{font-size:22px;color:#ffd36a}.sidebar .hf-premium-card strong{display:block;color:#fff;font-size:18px;margin:6px 0}.sidebar .hf-premium-card span{display:block;color:#c2cde0;font-size:12px;line-height:1.4;margin-bottom:12px}.sidebar .hf-premium-card b{display:block;border-radius:13px;background:linear-gradient(135deg,#2657e9,#4b7dff);padding:11px 10px;color:#fff;font-size:13px}',
      '.sidebar .hf-exit-card{padding:13px 14px;text-align:center;color:#ffd0d4;border-color:rgba(239,68,68,.35);background:rgba(239,68,68,.055);font-weight:950;cursor:pointer}',
      '@media(max-height:900px){.sidebar .hf-premium-card{display:none!important}}',
      '@media(max-height:760px){.sidebar .side-bottom{gap:8px!important;padding-top:12px!important}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function html() {
    var n = name();
    var initial = (n || 'B').trim().charAt(0).toUpperCase() || 'B';
    return '<div class="side-bottom" data-unified-bottom="1">'
      + '<div class="hf-week-card"></div>'
      + '<a class="hf-user-card user-mini" href="' + rootRelative('user/settings.html') + '"><span class="hf-avatar">' + esc(initial) + '</span><span><strong>' + esc(n) + '</strong><span>NHH-student</span></span><span class="arrow">›</span></a>'
      + '<a class="hf-premium-card" href="' + rootRelative('user/settings.html#premium') + '"><span class="crown">♛</span><strong>Premium</strong><span>Få tilgang til eksklusive verktøy og analyser.</span><b>Oppgrader nå →</b></a>'
      + '<a class="hf-exit-card" href="' + rootRelative('login.html') + '">Logg ut</a>'
      + '</div>';
  }

  function render() {
    if (!isUserPage()) return;
    var sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    injectStyles();
    var old = sidebar.querySelector('.side-bottom');
    if (old && old.getAttribute('data-unified-bottom') === '1') return;
    if (old) old.remove();
    sidebar.insertAdjacentHTML('beforeend', html());
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
