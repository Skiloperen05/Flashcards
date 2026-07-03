(function (window, document) {
  'use strict';

  if (window.__haugnesAnswerLibraryInstalled) return;
  window.__haugnesAnswerLibraryInstalled = true;

  // Display-only catalog (no premium content – just icons, colours, names).
  // Actual package/resource data is fetched from Supabase and protected by RLS.
  var SUBJECTS = [
    { code: 'RET14', name: 'Skatterett', accent: '#2f62ff', icon: '%', summary: 'Eksamenspakker for skatterett samles her når PDF-er legges ut.' },
    { code: 'SOL1', name: 'Organisasjonsatferd', accent: '#20b97a', icon: '♣', summary: 'Eksamenspakker for organisasjonsatferd samles her når PDF-er legges ut.' },
    { code: 'SAM2', name: 'Mikroøkonomi', accent: '#f09828', icon: '◔', summary: 'Eksamenspakker for mikroøkonomi samles her når PDF-er legges ut.' },
    { code: 'SAM3', name: 'Makroøkonomi', accent: '#ef4444', icon: '↗', summary: 'V25- og V26-pakkene ligger ute med original eksamen, A-besvarelse og sensorveiledning.' },
    { code: 'MET2', name: 'Metode', accent: '#7c3aed', icon: 'Σ', summary: 'Eksamenspakker for metode samles her når PDF-er legges ut.' },
    { code: 'MAT10', name: 'Matematikk', accent: '#0891b2', icon: '∫', summary: 'Eksamenspakker for matematikk samles her når PDF-er legges ut.' },
    { code: 'SAM1A', name: 'Mikroøkonomi intro', accent: '#f09828', icon: '↗', summary: 'Første-semesterpakke for læringsmål, kompendium og eksamensrelevante modeller.' },
    { code: 'MET1', name: 'Matematikk for økonomer', accent: '#06b6d4', icon: '%', summary: 'Første-semesterpakke for NNV, rente, annuitet og metodeoppgaver.' },
    { code: 'KOM1', name: 'Kommunikasjon', accent: '#e8bc68', icon: '✎', summary: 'Første-semesterpakke for rapport, presentasjon og akademisk skriving.' },
    { code: 'RET1A', name: 'Juridiske emner', accent: '#3b82f6', icon: '§', summary: 'Første-semesterpakke for avtalerett, pengekrav, selskapsrett og juridisk metode.' },
    { code: 'BED1', name: 'Bedriftsøkonomi', accent: '#20b97a', icon: '◆', summary: 'Første-semesterpakke for kalkyler, investering, resultat og budsjettering.' }
  ];

  var PACKAGES = [];
  var packagesLoaded = false;
  var packagesPromise = null;
  var lastLoadError = null;

  var state = { subject: null, packageId: null, query: '' };

  function isPage() { return /\/user\/a-besvarelser\.html$/.test(window.location.pathname); }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function code(value) { return String(value || '').toUpperCase().replace(/[\s-]+/g, ''); }
  function readJson(key, fallback) { try { var raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }

  function entitledCodes() {
    if (window.HaugnesEntitlements && typeof window.HaugnesEntitlements.getCodes === 'function') {
      var owned = window.HaugnesEntitlements.getCodes();
      if (window.HaugnesEntitlements.effectiveAdmin && window.HaugnesEntitlements.effectiveAdmin()) {
        return SUBJECTS.map(function (s) { return s.code; });
      }
      return owned;
    }
    return [];
  }

  function selectedCodes() {
    if (window.HaugnesSubjectAccess && typeof window.HaugnesSubjectAccess.getSelected === 'function') {
      return window.HaugnesSubjectAccess.getSelected();
    }
    return readJson('hf_enabled_subjects', SUBJECTS.map(function (s) { return s.code; })).map(code);
  }

  function availableCodes() {
    var owned = entitledCodes();
    var selected = selectedCodes();
    if (!owned.length) return [];
    return selected.filter(function (c) { return owned.indexOf(c) !== -1; });
  }

  function enabledSubjects() {
    var available = availableCodes();
    return SUBJECTS.filter(function (s) { return available.indexOf(s.code) !== -1; });
  }

  function enabledPackages() {
    var available = availableCodes();
    return PACKAGES.filter(function (p) { return available.indexOf(p.subject) !== -1; });
  }

  function subjectByCode(c) { return SUBJECTS.find(function (s) { return s.code === code(c); }); }
  function packagesForSubject(c) { return enabledPackages().filter(function (p) { return p.subject === code(c); }); }
  function packageById(id) { return enabledPackages().find(function (p) { return p.id === id; }); }
  function allResources() { return enabledPackages().reduce(function (out, p) { return out.concat(p.resources.map(function (r) { return Object.assign({ subject: p.subject, term: p.term, packageId: p.id, packageTitle: p.title }, r); })); }, []).sort(function (a, b) { return (a.subject + a.order).localeCompare(b.subject + b.order); }); }
  function publishedPackages() { return enabledPackages().filter(function (p) { return p.resources.length > 0; }); }
  function plannedPackages() { return enabledPackages().filter(function (p) { return p.resources.length === 0; }); }
  function answerCount() { return allResources().filter(function (r) { return r.kind === 'A-besvarelse'; }).length; }
  function summary() { return { subjects: enabledSubjects().length, packages: enabledPackages().length, publishedPackages: publishedPackages().length, plannedPackages: plannedPackages().length, resources: allResources().length, answers: answerCount() }; }

  function loadPackages(force) {
    if (packagesLoaded && !force) return Promise.resolve(PACKAGES);
    if (packagesPromise && !force) return packagesPromise;

    packagesPromise = (function () {
      if (!window.HaugnesEntitlements || !window.AuthGuard || typeof window.AuthGuard.getClient !== 'function') {
        return Promise.resolve([]);
      }
      return window.HaugnesEntitlements.load().then(function () {
        var sb;
        try { sb = window.AuthGuard.getClient(); }
        catch (e) { return []; }
        return Promise.all([
          sb.from('answer_packages').select('id,subject_code,term,title,subtitle,description,local_status,sort_order').order('sort_order'),
          sb.from('answer_resources').select('id,package_id,kind,title,subtitle,description,icon,url,download_url,order_index').order('order_index')
        ]).then(function (results) {
          var pkgRes = results[0];
          var resRes = results[1];
          if (pkgRes && pkgRes.error) lastLoadError = pkgRes.error;
          if (resRes && resRes.error) lastLoadError = resRes.error;
          var packages = (pkgRes && pkgRes.data ? pkgRes.data : []);
          var resources = (resRes && resRes.data ? resRes.data : []);
          return packages.map(function (p) {
            return {
              id: p.id,
              subject: code(p.subject_code),
              term: p.term,
              title: p.title,
              subtitle: p.subtitle,
              description: p.description || '',
              localStatus: p.local_status || null,
              sortOrder: p.sort_order || 0,
              resources: resources
                .filter(function (r) { return r.package_id === p.id; })
                .map(function (r) {
                  return {
                    id: r.id,
                    order: r.order_index || 0,
                    kind: r.kind,
                    title: r.title,
                    subtitle: r.subtitle || '',
                    desc: r.description || '',
                    icon: r.icon || '',
                    url: r.url,
                    download: r.download_url || r.url
                  };
                })
                .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
            };
          });
        });
      }).then(function (packages) {
        PACKAGES = packages;
        packagesLoaded = true;
        return PACKAGES;
      }).catch(function (e) {
        lastLoadError = e;
        PACKAGES = [];
        packagesLoaded = true;
        return PACKAGES;
      });
    })();

    packagesPromise.then(function () { packagesPromise = null; }, function () { packagesPromise = null; });
    return packagesPromise;
  }

  function syncLegacyGlobals() {
    window.answers = allResources().map(function (r, index) {
      var subject = subjectByCode(r.subject) || SUBJECTS[0];
      return { course: r.subject, icon: subject.icon, color: subject.accent, term: r.term, title: r.title, subtitle: r.subtitle, type: (r.kind || '').toLowerCase(), desc: r.desc, meta: [r.kind, 'PDF', r.term], popular: index + 1, url: r.url, download: r.download };
    });
    window.HaugnesAnswerLibrary = { subjects: enabledSubjects(), packages: enabledPackages(), resources: allResources(), summary: summary, render: render, reload: function () { return loadPackages(true).then(function () { render(); }); } };
  }

  function injectStyles() {
    if (document.getElementById('hf-answer-library-css')) return;
    var style = document.createElement('style');
    style.id = 'hf-answer-library-css';
    style.textContent = [
      '.answer-grid,.toolbar,.chip-row{display:none!important}',
      '.hf-answer-shell{display:grid;gap:16px}',
      '.hf-answer-breadcrumb{display:flex;gap:8px;align-items:center;flex-wrap:wrap;color:#9fb0cf;font-size:13px;font-weight:850;margin-bottom:2px}',
      '.hf-answer-breadcrumb button{border:0;background:transparent;color:#b8c9ff;font:900 13px Lora,Georgia,serif;cursor:pointer;padding:0}',
      '.hf-answer-toolbar{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:14px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid var(--line)}',
      '.hf-answer-search{height:42px;min-width:min(430px,100%);flex:1;border:1px solid var(--line);background:rgba(255,255,255,.055);border-radius:14px;color:#fff;padding:0 14px;font:750 13px Lora,Georgia,serif;outline:none}',
      '.hf-answer-muted{color:#91a5c8;font-size:12px;font-weight:800}',
      '.hf-subject-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}',
      '.hf-subject-tile,.hf-package-card,.hf-resource-card{position:relative;overflow:hidden;border-radius:22px;background:linear-gradient(180deg,rgba(15,43,92,.94),rgba(8,25,56,.96));border:1px solid var(--line);box-shadow:0 16px 34px rgba(0,0,0,.20)}',
      '.hf-subject-tile{min-height:210px;padding:18px;display:flex;flex-direction:column;gap:13px;cursor:pointer;text-align:left;color:#fff;border-color:rgba(126,162,255,.22)}',
      '.hf-subject-tile::before,.hf-package-card::before,.hf-resource-card::before{content:"";position:absolute;right:-60px;top:-70px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,var(--accent),transparent 68%);opacity:.22}',
      '.hf-tile-top{display:flex;justify-content:space-between;gap:12px;position:relative;z-index:1}',
      '.hf-tile-icon{width:44px;height:44px;border-radius:15px;background:var(--accent);display:grid;place-items:center;color:#fff;font-weight:950;box-shadow:0 0 28px rgba(47,98,255,.22)}',
      '.hf-status-pill{height:28px;padding:0 9px;border-radius:999px;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.08);color:#cbd7ef;font-size:10.5px;font-weight:950;display:inline-flex;align-items:center}',
      '.hf-status-pill.live{background:rgba(32,185,122,.14);border-color:rgba(32,185,122,.24);color:#b9f6d7}.hf-status-pill.planned{background:rgba(232,188,104,.12);border-color:rgba(232,188,104,.22);color:#ffd98f}',
      '.hf-subject-tile h3,.hf-package-card h3,.hf-resource-card h3{position:relative;z-index:1;margin:0;color:#fff;font-size:20px;line-height:1.12;letter-spacing:-.04em}',
      '.hf-subject-tile p,.hf-package-card p,.hf-resource-card p{position:relative;z-index:1;color:#bdc9df;font-size:13px;line-height:1.55;margin:0}',
      '.hf-tile-meta{position:relative;z-index:1;margin-top:auto;display:flex;gap:8px;flex-wrap:wrap}',
      '.hf-meta{font-size:11px;color:#aebddd;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:6px 9px;font-weight:900}',
      '.hf-package-list{display:grid;gap:14px}',
      '.hf-package-card{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:18px;color:#fff}',
      '.hf-package-actions{position:relative;z-index:1;display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}',
      '.hf-primary,.hf-secondary{height:38px;padding:0 13px;border-radius:12px;font:950 12px Lora,Georgia,serif;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;border:0;cursor:pointer}',
      '.hf-primary{background:linear-gradient(135deg,#2657e9,#3e72ff);color:#fff}.hf-primary[disabled]{opacity:.52;cursor:not-allowed}',
      '.hf-secondary{background:rgba(255,255,255,.055);border:1px solid var(--line);color:#cad6ea}',
      '.hf-resource-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}',
      '.hf-resource-card{padding:17px;display:flex;flex-direction:column;gap:12px;min-height:245px}',
      '.hf-resource-kind{position:relative;z-index:1;color:#ffd98f;font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}',
      '.hf-resource-actions{position:relative;z-index:1;margin-top:auto;display:flex;gap:9px;flex-wrap:wrap}',
      '.hf-empty-panel{padding:18px;border-radius:18px;background:rgba(255,255,255,.035);border:1px dashed rgba(126,162,255,.25);color:#aebddd;line-height:1.6}',
      '.hf-flow{display:grid;gap:9px}.hf-flow-item{display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:start;padding:12px;border-radius:15px;background:rgba(255,255,255,.045);border:1px solid var(--line)}',
      '.hf-flow-item .rank{width:28px;height:28px}.hf-flow-item strong{display:block;font-size:12.5px;color:#fff}.hf-flow-item span{display:block;color:#8fa5ca;font-size:11px;margin-top:2px}',
      '@media(max-width:1320px){.hf-resource-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '@media(max-width:700px){.hf-subject-grid,.hf-resource-grid{grid-template-columns:1fr}.hf-package-card{grid-template-columns:1fr}.hf-package-actions{justify-content:flex-start}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function updateHero() {
    var s = summary();
    var heading = document.querySelector('.hello h1');
    var intro = document.querySelector('.hello p');
    var heroTitle = document.querySelector('.hero-title');
    var heroCopy = document.querySelector('.hero-copy');
    var stats = document.querySelectorAll('.hero-stat b');
    var labels = document.querySelectorAll('.hero-stat span');
    if (heading) heading.textContent = 'Eksamensarkiv';
    if (intro) intro.textContent = 'Fag → eksamenspakker → PDF-er som faktisk ligger ute.';
    if (heroTitle) heroTitle.innerHTML = 'Finn riktig <span>eksamenspakke</span>.';
    if (heroCopy) heroCopy.textContent = 'Arkivet viser kun fag du har låst opp i Butikken.';
    if (stats[0]) stats[0].textContent = s.resources;
    if (stats[1]) stats[1].textContent = s.packages;
    if (stats[2]) stats[2].textContent = s.answers;
    if (labels[0]) labels[0].textContent = 'PDF-er ute';
    if (labels[1]) labels[1].textContent = 'pakker';
    if (labels[2]) labels[2].textContent = 'A-besvarelser';
  }

  function setHash(subject, packageId) { var hash = subject ? '#/' + subject.toLowerCase() + (packageId ? '/' + packageId.replace(subject.toLowerCase() + '-', '') : '') : ''; if (window.location.hash !== hash) window.location.hash = hash; else route(); }
  function parseHash() { var parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); state.subject = parts[0] ? parts[0].toUpperCase() : null; state.packageId = state.subject && parts[1] ? state.subject.toLowerCase() + '-' + parts[1] : null; if (state.subject && availableCodes().indexOf(state.subject) === -1) { state.subject = null; state.packageId = null; } }
  function breadcrumb() { var html = '<div class="hf-answer-breadcrumb"><button type="button" data-route="home">Fag</button>'; if (state.subject) html += '<span>›</span><button type="button" data-route="subject" data-subject="' + esc(state.subject) + '">' + esc(state.subject) + '</button>'; if (state.packageId) { var pack = packageById(state.packageId); html += '<span>›</span><span>' + esc(pack ? pack.title : 'Pakke') + '</span>'; } return html + '</div>'; }

  function renderEmptyState() {
    var rootHref = (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function')
      ? window.AuthGuard.getRootPath().replace(/\/$/, '/') + 'user/butikk.html'
      : 'butikk.html';
    return breadcrumb() + '<div class="hf-empty-panel"><strong>Ingen fag låst opp ennå.</strong><br>'
      + 'Gå til <a href="' + esc(rootHref) + '" style="color:#9eb7ff;font-weight:900">Butikken</a> for å låse opp et fag (gratis), så vises pakker, A-besvarelser og sensorveiledninger her.</div>';
  }

  function renderSubjects() {
    if (!entitledCodes().length) return renderEmptyState();
    var s = summary();
    var q = state.query.toLowerCase().trim();
    var subjects = enabledSubjects().filter(function (subject) { return !q || (subject.code + ' ' + subject.name + ' ' + subject.summary).toLowerCase().indexOf(q) !== -1; });
    if (!subjects.length) return breadcrumb() + '<div class="hf-empty-panel">Ingen valgte fag matcher søket. Endre fagvalg på Mine fag-siden eller lås opp nye fag i Butikken.</div>';
    return breadcrumb() + '<div class="hf-answer-toolbar"><input class="hf-answer-search" id="hfAnswerSearch" type="search" placeholder="Søk i valgte fag..." value="' + esc(state.query) + '"><span class="hf-answer-muted">' + s.subjects + ' valgte fag · ' + s.packages + ' pakker · ' + s.resources + ' PDF-er</span></div><div class="hf-subject-grid">' + subjects.map(function (subject) {
      var packs = packagesForSubject(subject.code);
      var count = packs.reduce(function (sum, p) { return sum + p.resources.length; }, 0);
      var live = count > 0;
      return '<button class="hf-subject-tile" style="--accent:' + subject.accent + '" data-subject="' + subject.code + '"><div class="hf-tile-top"><span class="hf-tile-icon">' + subject.icon + '</span><span class="hf-status-pill ' + (live ? 'live' : 'planned') + '">' + (live ? 'Publisert' : 'Klar plass') + '</span></div><h3>' + subject.code + '<br>' + subject.name + '</h3><p>' + subject.summary + '</p><div class="hf-tile-meta"><span class="hf-meta">' + packs.length + ' pakke</span><span class="hf-meta">' + count + ' PDF-er</span></div></button>';
    }).join('') + '</div>';
  }

  function renderSubject() {
    var subject = subjectByCode(state.subject);
    if (!subject || availableCodes().indexOf(subject.code) === -1) return renderSubjects();
    var packs = packagesForSubject(subject.code);
    return breadcrumb() + '<div class="hf-answer-toolbar"><div><strong style="color:#fff">' + subject.code + ' · ' + subject.name + '</strong><div class="hf-answer-muted">Velg semester/eksamenspakke. Pakker uten PDF-er er tydelig markert.</div></div><button class="hf-secondary" type="button" data-route="home">Alle fag</button></div><div class="hf-package-list">' + packs.map(function (p) {
      var live = p.resources.length > 0;
      var answerCount = p.resources.filter(function (r) { return r.kind === 'A-besvarelse'; }).length;
      return '<article class="hf-package-card" style="--accent:' + subject.accent + '"><div><div class="hf-resource-kind">' + subject.code + ' · ' + p.term + '</div><h3>' + p.title + '</h3><p>' + p.description + '</p><div class="hf-tile-meta"><span class="hf-meta">' + p.resources.length + ' PDF-er</span><span class="hf-meta">' + answerCount + ' A-besvarelse</span><span class="hf-meta">' + (p.localStatus || (live ? 'Publisert' : 'Venter på filer')) + '</span></div></div><div class="hf-package-actions"><button class="hf-primary" type="button" data-package="' + p.id + '">' + (live ? 'Åpne pakke →' : 'Se pakkeplass →') + '</button></div></article>';
    }).join('') + '</div>';
  }

  function renderPackage() {
    var pack = packageById(state.packageId);
    if (!pack) return renderSubject();
    var subject = subjectByCode(pack.subject);
    var resources = pack.resources.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).filter(function (r) { var q = state.query.toLowerCase().trim(); return !q || (r.title + ' ' + r.kind + ' ' + r.desc + ' ' + r.subtitle).toLowerCase().indexOf(q) !== -1; });
    var html = breadcrumb() + '<div class="hf-answer-toolbar"><input class="hf-answer-search" id="hfAnswerSearch" type="search" placeholder="Søk i ' + esc(pack.title) + '..." value="' + esc(state.query) + '"><button class="hf-secondary" type="button" data-route="subject" data-subject="' + pack.subject + '">Til ' + pack.subject + '</button></div>';
    if (!pack.resources.length) return html + '<div class="hf-empty-panel"><strong>' + esc(pack.subtitle) + ' · ' + esc(pack.title) + '</strong><br>' + esc(pack.localStatus ? pack.description : 'Denne pakken er klar, men har ingen publiserte PDF-er ennå. Når eksamen, A-besvarelse eller sensorveiledning legges ut, vises filene her i samme struktur som SAM3-pakken.') + '</div>';
    return html + '<div class="hf-resource-grid">' + resources.map(function (r) { return '<article class="hf-resource-card" style="--accent:' + subject.accent + '"><div class="hf-tile-top"><span class="hf-tile-icon">' + esc(r.icon) + '</span><span class="hf-status-pill live">PDF</span></div><div class="hf-resource-kind">' + esc(r.kind) + '</div><h3>' + esc(r.title) + '</h3><p>' + esc(r.desc) + '</p><div class="hf-resource-actions"><a class="hf-primary" href="' + r.url + '" target="_blank" rel="noopener">Åpne PDF</a><a class="hf-secondary" href="' + r.download + '">Last ned</a></div></article>'; }).join('') + '</div>' + (!resources.length ? '<div class="hf-empty-panel">Ingen dokumenter matcher søket.</div>' : '');
  }

  function renderSide() {
    var side = document.querySelector('.side-col'); if (!side) return;
    var resources = allResources();
    var list = resources.length ? resources.map(function (r, i) { return '<a class="popular-item" href="#/' + r.subject.toLowerCase() + '/' + r.packageId.replace(r.subject.toLowerCase() + '-', '') + '"><span class="rank">' + (i + 1) + '</span><div><strong>' + r.subject + ' ' + r.term + '</strong><span>' + esc(r.title) + '</span></div><span class="pop-tag">PDF</span></a>'; }).join('') : '<div class="hf-empty-panel">Ingen PDF-er ligger ute for valgte fag ennå.</div>';
    side.innerHTML = '<section class="side-panel"><div class="side-head"><h2>Publiserte dokumenter</h2></div><div class="popular-list">' + list + '</div></section><section class="side-panel"><div class="side-head"><h2>Anbefalt flyt</h2></div><div class="hf-flow"><div class="hf-flow-item"><span class="rank">1</span><div><strong>Løs eksamen først</strong><span>Ikke åpne A-besvarelsen før du har forsøkt selv.</span></div></div><div class="hf-flow-item"><span class="rank">2</span><div><strong>Sammenlign struktur</strong><span>Se disposisjon, modellbruk og drøftingsspråk.</span></div></div><div class="hf-flow-item"><span class="rank">3</span><div><strong>Les sensorveiledning</strong><span>Bruk vurderingspunktene til å finne neste øvingsmål.</span></div></div></div></section>';
  }

  function render() {
    syncLegacyGlobals(); updateHero();
    var host = document.querySelector('.workspace > section') || document.getElementById('answerLibraryHost'); if (!host) return;
    host.innerHTML = '<div class="hf-answer-shell">' + (state.packageId ? renderPackage() : state.subject ? renderSubject() : renderSubjects()) + '</div>';
    renderSide(); bind();
    try { window.dispatchEvent(new CustomEvent('haugnes:answer-library-rendered', { detail: { subject: state.subject, packageId: state.packageId } })); } catch (e) {}
  }

  function bind() {
    document.querySelectorAll('[data-subject]').forEach(function (el) { el.addEventListener('click', function () { setHash(el.getAttribute('data-subject')); }); });
    document.querySelectorAll('[data-package]').forEach(function (el) { el.addEventListener('click', function () { setHash(state.subject, el.getAttribute('data-package')); }); });
    document.querySelectorAll('[data-route="home"]').forEach(function (el) { el.addEventListener('click', function () { state.query = ''; setHash(null); }); });
    document.querySelectorAll('[data-route="subject"]').forEach(function (el) { el.addEventListener('click', function () { state.query = ''; setHash(el.getAttribute('data-subject') || state.subject); }); });
    var search = document.getElementById('hfAnswerSearch'); if (search) search.addEventListener('input', function () { state.query = search.value || ''; render(); });
  }

  function route() { parseHash(); render(); }

  function loadAdminTools() {
    if (document.getElementById('haugnes-answer-admin-js')) return;
    var base = (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function')
      ? window.AuthGuard.getRootPath().replace(/\/$/, '/')
      : '../';
    var script = document.createElement('script');
    script.id = 'haugnes-answer-admin-js';
    script.src = base + 'shared/haugnes-answer-admin.js';
    script.defer = true;
    document.head.appendChild(script);
  }

  function install() {
    if (!isPage()) return;
    injectStyles();
    syncLegacyGlobals();
    loadAdminTools();
    window.render = render;
    window.renderPopular = renderSide;
    // First paint (likely empty until fetch completes)
    route();
    // Trigger DB fetch, then re-render
    loadPackages().then(function () { route(); });
    window.addEventListener('hashchange', route);
    window.addEventListener('haugnes:subject-access-changed', route);
    window.addEventListener('haugnes:entitlements-changed', function () { loadPackages(true).then(route); });
    window.setTimeout(route, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})(window, document);
