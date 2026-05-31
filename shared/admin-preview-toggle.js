(function (window, document) {
  'use strict';

  if (window.__haugnesAdminPreviewInstalled) return;
  window.__haugnesAdminPreviewInstalled = true;

  function ent() { return window.HaugnesEntitlements; }
  function isAdmin() { return !!(ent() && ent().isAdmin && ent().isAdmin()); }
  function isPreview() { return !!(ent() && ent().isPreviewAsStudent && ent().isPreviewAsStudent()); }

  function injectStyles() {
    if (document.getElementById('hf-admin-preview-css')) return;
    var style = document.createElement('style');
    style.id = 'hf-admin-preview-css';
    style.textContent = [
      '.hf-admin-toggle{position:fixed;right:18px;bottom:18px;z-index:99999;display:none;align-items:center;gap:10px;padding:11px 15px;border-radius:14px;background:rgba(11,33,72,.94);border:1px solid rgba(126,162,255,.40);box-shadow:0 18px 38px rgba(0,0,0,.40);font-family:Lora,Georgia,serif;color:#fff;cursor:pointer;backdrop-filter:blur(8px);transition:transform .15s ease,border-color .15s ease}',
      '.hf-admin-toggle:hover{transform:translateY(-1px);border-color:rgba(126,162,255,.65)}',
      '.hf-admin-toggle.show{display:inline-flex}',
      '.hf-admin-toggle .dot{width:10px;height:10px;border-radius:50%;background:#20b97a;box-shadow:0 0 14px rgba(32,185,122,.7);flex:0 0 10px}',
      '.hf-admin-toggle.preview .dot{background:#e8bc68;box-shadow:0 0 14px rgba(232,188,104,.7)}',
      '.hf-admin-toggle .label{display:flex;flex-direction:column;line-height:1.15;text-align:left}',
      '.hf-admin-toggle .label strong{font-weight:900;font-size:13px;letter-spacing:-.01em}',
      '.hf-admin-toggle .label small{font-size:9.5px;color:#9eb7ff;letter-spacing:.10em;text-transform:uppercase;font-weight:900;margin-top:2px}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function mount() {
    if (document.getElementById('hfAdminPreviewToggle')) return;
    if (!document.body) return;
    var btn = document.createElement('button');
    btn.id = 'hfAdminPreviewToggle';
    btn.type = 'button';
    btn.className = 'hf-admin-toggle';
    btn.title = 'Skift mellom admin- og student-visning';
    btn.addEventListener('click', function () {
      if (!ent() || typeof ent().setPreviewAsStudent !== 'function') return;
      ent().setPreviewAsStudent(!isPreview());
      update();
    });
    document.body.appendChild(btn);
  }

  function update() {
    var btn = document.getElementById('hfAdminPreviewToggle');
    if (!btn) return;
    if (!isAdmin()) { btn.classList.remove('show'); return; }
    var preview = isPreview();
    btn.classList.add('show');
    btn.classList.toggle('preview', preview);
    btn.innerHTML = '<span class="dot"></span><span class="label"><strong>' + (preview ? 'Student-visning' : 'Admin-visning') + '</strong><small>' + (preview ? 'Klikk for admin' : 'Klikk for student') + '</small></span>';
  }

  function boot() {
    injectStyles();
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount, { once: true });
    update();
    if (!isAdmin()) {
      var tries = 0;
      var wait = setInterval(function () {
        tries += 1;
        if (ent() && ent().isLoaded && ent().isLoaded()) {
          clearInterval(wait);
          if (!document.getElementById('hfAdminPreviewToggle')) mount();
          update();
          return;
        }
        if (tries > 60) clearInterval(wait);
      }, 100);
    }
    window.addEventListener('haugnes:entitlements-changed', function () {
      if (!document.getElementById('hfAdminPreviewToggle')) mount();
      update();
    });
  }

  window.HaugnesAdminPreviewToggle = { mount: mount, update: update };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
