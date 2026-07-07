(function (window, document) {
  'use strict';

  if (window.__haugnesLogoNormalizerInstalled) return;
  window.__haugnesLogoNormalizerInstalled = true;

  function rootRelative(path) {
    if (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function') {
      return window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '');
    }
    var current = window.location.pathname;
    var match = current.match(/^(.*?)(?:ret14|sol1|sam2|sam3|mat10|met2|sam1a|met1|kom1|ret1a|bed1|flashcards|user)\//);
    return (match ? match[1] : current.replace(/[^/]*$/, '')).replace(/\/$/, '/') + path.replace(/^\//, '');
  }

  function logoUrl() {
    return rootRelative('assets/Flashcardslogo.png');
  }

  function fallbackUrl() {
    return rootRelative('assets/haugnes-logo-mark.svg');
  }

  function injectStyles() {
    if (document.getElementById('haugnes-logo-normalizer-css')) return;
    var style = document.createElement('style');
    style.id = 'haugnes-logo-normalizer-css';
    style.textContent = [
      '.hf-logo-normalized{background:#0b244e!important;background-image:none!important;display:grid!important;place-items:center!important;overflow:hidden!important;position:relative!important}',
      '.hf-logo-normalized>img{display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;object-position:center center!important;padding:0!important;margin:0!important}',
      '.hf-logo-normalized>img.hf-logo-fallback{padding:8%!important}',
      '.sidebar .brand>.logo-mark.hf-logo-normalized,.mobile-top .brand>.logo-mark.hf-logo-normalized{width:46px!important;height:46px!important;flex:0 0 46px!important;border-radius:14px!important}',
      '.hf-logo.hf-logo-normalized,.hf-brand>.hf-logo.hf-logo-normalized{width:46px!important;height:46px!important;flex:0 0 46px!important;border-radius:14px!important}',
      '.brand-mark.hf-logo-normalized{width:54px!important;height:54px!important;border-radius:17px!important}',
      '.topbar .logo span:first-child.hf-logo-normalized,.hf-tool-logo.hf-logo-normalized,.haugnes-tool-logo.hf-logo-normalized{width:44px!important;height:44px!important;flex:0 0 44px!important;border-radius:14px!important}',
      '.card>.logo.hf-logo-normalized{width:116px!important;height:116px!important;border-radius:28px!important;margin:0 auto 14px!important}',
      '.verify-icon.hf-logo-normalized{width:74px!important;height:74px!important;border-radius:20px!important;margin:0 auto 14px!important}',
      '@media(max-width:560px){.hf-logo.hf-logo-normalized,.hf-brand>.hf-logo.hf-logo-normalized{width:40px!important;height:40px!important;flex-basis:40px!important}}',
      '.hf-models-card{border-color:rgba(239,68,68,.34)!important;background:linear-gradient(135deg,rgba(239,68,68,.13),rgba(47,98,255,.07))!important}',
      '.hf-models-card .hf-tool-icon{background:rgba(239,68,68,.16)!important;color:#fecaca!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function normalizeElement(el) {
    if (!el) return;
    if (el.dataset.hfLogoNormalized === '1' && el.querySelector('img')) return;
    el.dataset.hfLogoNormalized = '1';
    el.classList.add('hf-logo-normalized');
    el.textContent = '';
    el.setAttribute('aria-hidden', 'true');
    el.style.backgroundImage = 'none';
    var img = document.createElement('img');
    img.src = logoUrl();
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'eager';
    img.onerror = function () {
      if (img.dataset.usedFallback === '1') return;
      img.dataset.usedFallback = '1';
      img.classList.add('hf-logo-fallback');
      img.src = fallbackUrl();
    };
    el.appendChild(img);
  }

  function normalizeLinks() {
    var href = logoUrl();
    ['icon', 'shortcut icon', 'apple-touch-icon'].forEach(function (rel) {
      var link = document.querySelector('link[rel="' + rel + '"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
      if (/icon/i.test(rel)) link.type = 'image/png';
    });
  }

  function injectSam3ModelsCard() {
    var path = window.location.pathname;
    if (!/\/sam3\/?(?:index\.html)?$/.test(path)) return;
    if (document.querySelector('a[href="sentrale-modeller.html"]')) return;
    var grid = document.querySelector('.hf-card-grid');
    if (!grid) return;
    var card = document.createElement('a');
    card.className = 'hf-tool-card hf-models-card';
    card.style.setProperty('--accent', '#ef4444');
    card.href = 'sentrale-modeller.html';
    card.innerHTML = '<div class="hf-tool-top"><div class="hf-tool-icon">◇</div><span class="hf-status">Nytt</span></div><div class="hf-tool-body"><h3>Sentrale modeller</h3><p>PDF-modellark for Solow, Romer, AS-AD, IS-MP, Phillipskurven og åpen økonomi.</p><div class="hf-tool-foot"><span>PDF-ark →</span><span>modellbibliotek</span></div></div>';
    grid.insertBefore(card, grid.firstChild);
    var tabs = document.querySelector('.hf-tabbar');
    if (tabs && !tabs.querySelector('a[href="sentrale-modeller.html"]')) {
      var tab = document.createElement('a');
      tab.href = 'sentrale-modeller.html';
      tab.textContent = 'Sentrale modeller';
      tabs.appendChild(tab);
    }
  }

  function run() {
    injectStyles();
    normalizeLinks();
    if (/StudieHub/i.test(document.title)) document.title = document.title.replace(/StudieHub/gi, 'Haugnes Flashcards');
    [
      '.logo-mark',
      '.hf-logo',
      '.brand-mark',
      '.hf-tool-logo',
      '.haugnes-tool-logo',
      '.topbar .logo span:first-child',
      '.card>.logo',
      '.verify-icon'
    ].forEach(function (selector) {
      document.querySelectorAll(selector).forEach(normalizeElement);
    });
    document.querySelectorAll('.brand,.logo').forEach(function (brand) {
      if (!/StudieHub/i.test(brand.textContent)) return;
      var label = brand.querySelector('span:last-child') || brand;
      label.textContent = 'Haugnes';
    });
    document.querySelectorAll('footer,.footer').forEach(function (footer) {
      if (/StudieHub/i.test(footer.textContent)) footer.textContent = footer.textContent.replace(/StudieHub/gi, 'Haugnes Flashcards');
    });
    injectSam3ModelsCard();
  }

  function schedule() {
    run();
    window.setTimeout(run, 120);
    window.setTimeout(run, 650);
    window.setTimeout(run, 1400);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();

  if (window.MutationObserver) {
    new MutationObserver(function () { window.clearTimeout(schedule.timer); schedule.timer = window.setTimeout(run, 80); })
      .observe(document.documentElement, { childList: true, subtree: true });
  }

  window.HaugnesLogoNormalizer = { run: run, logoUrl: logoUrl };
})(window, document);
