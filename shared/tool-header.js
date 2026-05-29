(function (window, document) {
  'use strict';

  if (window.__haugnesToolHeaderInstalled) return;
  window.__haugnesToolHeaderInstalled = true;

  var SUBJECTS = {
    ret14: { code: 'RET14', name: 'Skatterett', href: 'ret14/' },
    sol1: { code: 'SOL1', name: 'Organisasjonsatferd', href: 'sol1/' },
    sam2: { code: 'SAM2', name: 'Mikroøkonomi', href: 'sam2/' },
    sam3: { code: 'SAM3', name: 'Makroøkonomi', href: 'sam3/' },
    met2: { code: 'MET2', name: 'Metode', href: 'met2/' },
    mat10: { code: 'MAT10', name: 'Matematikk', href: 'mat10/' }
  };

  function rootRelative(path) {
    if (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function') return window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '');
    return '/' + path.replace(/^\//, '');
  }

  function path() { return window.location.pathname.toLowerCase(); }
  function fileName() { return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase(); }
  function isUserPage() { return /\/user\//.test(path()); }
  function isLoginOrFrontPage() { return /\/(login\.html|index\.html)?$/.test(path()) && !/(ret14|sol1|sam2|sam3|met2|mat10|flashcards|user)\//.test(path()); }
  function esc(value) { return String(value || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function subjectFromUrl() {
    var p = path();
    var match = p.match(/\/(ret14|sol1|sam2|sam3|met2|mat10)\//);
    if (match && SUBJECTS[match[1]]) return SUBJECTS[match[1]];
    if (/\/flashcards\//.test(p)) {
      var subject = (new URLSearchParams(window.location.search).get('subject') || '').toLowerCase();
      if (subject.indexOf('sol1') !== -1) return SUBJECTS.sol1;
      if (subject.indexOf('sam2') !== -1) return SUBJECTS.sam2;
      if (subject.indexOf('sam3') !== -1) return SUBJECTS.sam3;
      if (subject.indexOf('ret14') !== -1 || subject.indexOf('ret') !== -1) return SUBJECTS.ret14;
    }
    return null;
  }

  function toolLabel() {
    var p = path();
    var f = fileName();
    if (/\/flashcards\//.test(p) || f === 'flashcards.html') return 'Flashcards';
    if (f === 'formelquiz.html') return 'Formelquiz';
    if (f === 'formelark.html') return 'Formelark';
    if (f === 'multiple-choice.html') return 'Flervalgsquiz';
    if (f === 'mock-eksamen.html') return 'Mock-eksamen';
    if (f === 'eksamensradar-v3.html' || /\/eksamen\//.test(p)) return 'Eksamensanalyse';
    if (/\/quiz\//.test(p)) return 'Quiz';
    if (/\/pensum\//.test(p)) return 'Pensum';
    if (/\/oppgaver-klikkbar\//.test(p)) return 'Oppgaver';
    return 'Verktøy';
  }

  function shouldRun() {
    if (isUserPage() || isLoginOrFrontPage()) return false;
    return /(ret14|sol1|sam2|sam3|met2|mat10|flashcards)\//.test(path());
  }

  function injectStyles() {
    if (document.getElementById('haugnes-tool-header-css')) return;
    var style = document.createElement('style');
    style.id = 'haugnes-tool-header-css';
    style.textContent = [
      '.hf-tool-header{height:76px;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:0 clamp(18px,4vw,44px);background:linear-gradient(180deg,rgba(7,18,42,.98),rgba(8,22,50,.96));border-bottom:1px solid rgba(255,255,255,.08);box-shadow:0 18px 42px rgba(0,0,0,.22);position:relative;z-index:50;font-family:Lora,Georgia,serif}',
      '.hf-tool-brand{display:inline-flex;align-items:center;gap:14px;text-decoration:none;color:#fff;min-width:0}',
      '.hf-tool-logo{width:44px;height:44px;border-radius:14px;background:#0b244e url("' + rootRelative('assets/haugnes-logo-mark.svg') + '") center/78% no-repeat;border:1px solid rgba(255,255,255,.16);box-shadow:0 12px 28px rgba(0,0,0,.28),0 0 28px rgba(47,98,255,.16);flex:0 0 44px}',
      '.hf-tool-wordmark{display:grid;line-height:1}.hf-tool-wordmark strong{font-size:22px;letter-spacing:.18em;color:#fff}.hf-tool-wordmark span{font-size:11px;letter-spacing:.42em;color:#ffd98f;margin-top:6px;font-weight:950}',
      '.hf-tool-crumb{display:flex;align-items:center;gap:10px;min-width:0;color:#99abc8;font-size:14px;font-weight:900;white-space:nowrap}',
      '.hf-tool-crumb a{color:#aebfff;text-decoration:none}.hf-tool-crumb a:hover{color:#fff}.hf-tool-crumb b{color:#fff;font-weight:950}.hf-tool-sep{opacity:.55}',
      '.topbar.hf-replaced,.haugnes-tool-nav.hf-replaced{display:none!important}',
      'body:has(.hf-tool-header) .topbar:not(.hf-tool-header){display:none!important}',
      '@media(max-width:760px){.hf-tool-header{height:auto;min-height:72px;padding:12px 16px;align-items:flex-start;flex-direction:column}.hf-tool-wordmark strong{font-size:18px}.hf-tool-wordmark span{font-size:9px}.hf-tool-crumb{font-size:12px;flex-wrap:wrap;white-space:normal}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function headerHtml(subject, label) {
    var subjectLink = subject ? '<a href="' + rootRelative(subject.href) + '">' + esc(subject.code) + '</a><span class="hf-tool-sep">›</span>' : '';
    return '<header class="hf-tool-header"><a class="hf-tool-brand" href="' + rootRelative('user/index.html') + '"><span class="hf-tool-logo" aria-hidden="true"></span><span class="hf-tool-wordmark"><strong>HAUGNES</strong><span>FLASHCARDS</span></span></a><nav class="hf-tool-crumb"><a href="' + rootRelative('user/index.html') + '">Dashboard</a><span class="hf-tool-sep">›</span>' + subjectLink + '<b>' + esc(label) + '</b></nav></header>';
  }

  function render() {
    if (!shouldRun()) return;
    injectStyles();
    var oldHeader = document.querySelector('.hf-tool-header');
    var subject = subjectFromUrl();
    var label = toolLabel();
    var html = headerHtml(subject, label);
    if (oldHeader) {
      oldHeader.outerHTML = html;
      return;
    }
    var target = document.querySelector('header.topbar, .topbar, nav.haugnes-tool-nav, .haugnes-tool-nav, header');
    if (target && !target.classList.contains('hf-tool-header')) {
      target.insertAdjacentHTML('beforebegin', html);
      target.classList.add('hf-replaced');
    } else {
      document.body.insertAdjacentHTML('afterbegin', html);
    }
  }

  function run() {
    render();
    window.setTimeout(render, 100);
    window.setTimeout(render, 650);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  window.HaugnesToolHeader = { run: run, render: render };
})(window, document);
