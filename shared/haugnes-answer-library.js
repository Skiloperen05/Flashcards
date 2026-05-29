(function (window, document) {
  'use strict';

  if (window.__haugnesAnswerLibraryInstalled) return;
  window.__haugnesAnswerLibraryInstalled = true;

  var SUBJECTS = [
    { code: 'SAM3', name: 'Makroøkonomi', accent: '#ef4444', icon: '↗', summary: 'V25-pakken ligger ute med original eksamen, A-besvarelse og sensorveiledning.' },
    { code: 'RET14', name: 'Skatterett', accent: '#2f62ff', icon: '%', summary: 'Klar til å fylles når første PDF legges ut.' },
    { code: 'SOL1', name: 'Organisasjonsatferd', accent: '#20b97a', icon: '♣', summary: 'Klar til å fylles når første PDF legges ut.' },
    { code: 'SAM2', name: 'Mikroøkonomi', accent: '#f09828', icon: '◔', summary: 'Klar til å fylles når første PDF legges ut.' }
  ];

  var PACKAGES = [
    {
      id: 'sam3-v25', subject: 'SAM3', term: 'V25', title: 'Våren 2025', subtitle: 'SAM3 Makroøkonomi',
      description: 'Komplett eksamenspakke med originaloppgave, A-besvarelse og sensorveiledning.',
      resources: [
        { id: 'sam3-v25-exam', order: 1, kind: 'Eksamen', title: 'SAM3 skoleeksamen V25', subtitle: 'Original oppgave', desc: 'Original eksamensoppgave for våren 2025. Start her og gjør et eget forsøk før du ser på løsning.', icon: 'E', url: 'https://drive.google.com/file/d/1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5/view', download: 'https://drive.google.com/uc?export=download&id=1VKZwcmQF9zGlR2Hwtjy0UnKWlhHEf7_5' },
        { id: 'sam3-v25-answer', order: 2, kind: 'A-besvarelse', title: 'A-besvarelse SAM3 V25', subtitle: 'Makroøkonomi', desc: 'Eksempel på sterk besvarelse. Bruk den etter egen gjennomføring for å sammenligne struktur, modellbruk og drøfting.', icon: 'A', url: 'https://drive.google.com/file/d/1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5/view', download: 'https://drive.google.com/uc?export=download&id=1yCI-f4BKMTllsLc5ZMgh6pj0TIA428x5' },
        { id: 'sam3-v25-sensor', order: 3, kind: 'Sensorveiledning', title: 'SAM3 sensorveiledning V25', subtitle: 'Vurderingspunkter', desc: 'Sensorveiledningen viser hva sensor belønner og hvilke momenter som bør være med.', icon: 'S', url: 'https://drive.google.com/file/d/1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy/view', download: 'https://drive.google.com/uc?export=download&id=1myk7l12OsR-jZ76am6e-W7iS1u6FNuTy' }
      ]
    }
  ];

  var state = { subject: null, packageId: null, query: '' };

  function isPage() { return /\/user\/a-besvarelser\.html$/.test(window.location.pathname); }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function subjectByCode(code) { return SUBJECTS.find(function (s) { return s.code === code; }); }
  function packagesForSubject(code) { return PACKAGES.filter(function (p) { return p.subject === code; }); }
  function subjectsWithPackages() { return SUBJECTS.filter(function (s) { return packagesForSubject(s.code).length > 0; }); }
  function subjectsWithoutPackages() { return SUBJECTS.filter(function (s) { return packagesForSubject(s.code).length === 0; }); }
  function allResources() { return PACKAGES.reduce(function (out, p) { return out.concat(p.resources.map(function (r) { return Object.assign({ subject: p.subject, term: p.term, packageId: p.id, packageTitle: p.title }, r); })); }, []).sort(function (a, b) { return (a.subject + a.order).localeCompare(b.subject + b.order); }); }
  function answerCount() { return allResources().filter(function (r) { return r.kind === 'A-besvarelse'; }).length; }

  function syncLegacyGlobals() {
    window.answers = allResources().map(function (r, index) {
      var subject = subjectByCode(r.subject) || SUBJECTS[0];
      return { course: r.subject, icon: subject.icon, color: subject.accent, term: r.term, title: r.title, subtitle: r.subtitle, type: r.kind.toLowerCase(), desc: r.desc, meta: [r.kind, 'PDF', r.term], popular: index + 1, url: r.url, download: r.download };
    });
    window.HaugnesAnswerLibrary = { subjects: SUBJECTS.slice(), packages: PACKAGES.slice(), resources: allResources(), summary: summary };
  }

  function summary() {
    return { subjects: subjectsWithPackages().length, plannedSubjects: subjectsWithoutPackages().length, packages: PACKAGES.length, resources: allResources().length, answers: answerCount() };
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
      '.hf-status-pill.live{background:rgba(32,185,122,.14);border-color:rgba(32,185,122,.24);color:#b9f6d7}',
      '.hf-subject-tile h3,.hf-package-card h3,.hf-resource-card h3{position:relative;z-index:1;margin:0;color:#fff;font-size:20px;line-height:1.12;letter-spacing:-.04em}',
      '.hf-subject-tile p,.hf-package-card p,.hf-resource-card p{position:relative;z-index:1;color:#bdc9df;font-size:13px;line-height:1.55;margin:0}',
      '.hf-tile-meta{position:relative;z-index:1;margin-top:auto;display:flex;gap:8px;flex-wrap:wrap}',
      '.hf-meta{font-size:11px;color:#aebddd;background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:6px 9px;font-weight:900}',
      '.hf-package-list{display:grid;gap:14px}',
      '.hf-package-card{display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;padding:18px;color:#fff}',
      '.hf-package-actions{position:relative;z-index:1;display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end}',
      '.hf-primary,.hf-secondary{height:38px;padding:0 13px;border-radius:12px;font:950 12px Lora,Georgia,serif;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;border:0;cursor:pointer}',
      '.hf-primary{background:linear-gradient(135deg,#2657e9,#3e72ff);color:#fff}',
      '.hf-secondary{background:rgba(255,255,255,.055);border:1px solid var(--line);color:#cad6ea}',
      '.hf-resource-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}',
      '.hf-resource-card{padding:17px;display:flex;flex-direction:column;gap:12px;min-height:245px}',
      '.hf-resource-kind{position:relative;z-index:1;color:#ffd98f;font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}',
      '.hf-resource-actions{position:relative;z-index:1;margin-top:auto;display:flex;gap:9px;flex-wrap:wrap}',
      '.hf-empty-panel{padding:18px;border-radius:18px;background:rgba(255,255,255,.035);border:1px dashed rgba(126,162,255,.25);color:#aebddd;line-height:1.6}',
      '.hf-planned-list{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.hf-planned-chip{font-size:11px;color:#9fb0cf;background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:999px;padding:7px 9px;font-weight:900}',
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
    var statLabels = document.querySelectorAll('.hero-stat span');
    if (heading) heading.textContent = 'Eksamensarkiv';
    if (intro) intro.textContent = 'Fag → eksamenspakker → PDF-er som faktisk ligger ute.';
    if (heroTitle) heroTitle.innerHTML = 'Finn riktig <span>eksamenspakke</span>.';
    if (heroCopy) heroCopy.textContent = 'Arkivet viser bare publiserte dokumenter. Først velger du fag, deretter semester/eksamenspakke, og til slutt åpner du PDF-en du trenger.';
    if (stats[0]) stats[0].textContent = s.resources;
    if (stats[1]) stats[1].textContent = s.packages;
    if (stats[2]) stats[2].textContent = s.answers;
    if (statLabels[0]) statLabels[0].textContent = 'PDF-er ute';
    if (statLabels[1]) statLabels[1].textContent = s.packages === 1 ? 'pakke' : 'pakker';
    if (statLabels[2]) statLabels[2].textContent = s.answers === 1 ? 'A-besvarelse' : 'A-besvarelser';
  }

  function setHash(subject, packageId) {
    var hash = subject ? '#/' + subject.toLowerCase() + (packageId ? '/' + packageId.replace(subject.toLowerCase() + '-', '') : '') : '';
    if (window.location.hash !== hash) window.location.hash = hash;
    else route();
  }

  function parseHash() {
    var parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    state.subject = parts[0] ? parts[0].toUpperCase() : null;
    state.packageId = state.subject && parts[1] ? state.subject.toLowerCase() + '-' + parts[1] : null;
  }

  function breadcrumb() {
    var html = '<div class="hf-answer-breadcrumb"><button type="button" data-route="home">Fag</button>';
    if (state.subject) html += '<span>›</span><button type="button" data-route="subject" data-subject="' + esc(state.subject) + '">' + esc(state.subject) + '</button>';
    if (state.packageId) { var pack = PACKAGES.find(function (p) { return p.id === state.packageId; }); html += '<span>›</span><span>' + esc(pack ? pack.title : 'Pakke') + '</span>'; }
    return html + '</div>';
  }

  function renderSubjects() {
    var active = subjectsWithPackages();
    var planned = subjectsWithoutPackages();
    var s = summary();
    var html = breadcrumb() + '<div class="hf-answer-toolbar"><input class="hf-answer-search" id="hfAnswerSearch" type="search" placeholder="Søk i publiserte dokumenter..." value="' + esc(state.query) + '"><span class="hf-answer-muted">' + s.subjects + ' aktivt fag · ' + s.resources + ' PDF-er</span></div>';
    html += '<div class="hf-subject-grid">' + active.map(function (subject) {
      var packs = packagesForSubject(subject.code);
      var count = packs.reduce(function (sum, p) { return sum + p.resources.length; }, 0);
      return '<button class="hf-subject-tile" style="--accent:' + subject.accent + '" data-subject="' + subject.code + '"><div class="hf-tile-top"><span class="hf-tile-icon">' + subject.icon + '</span><span class="hf-status-pill live">Publisert</span></div><h3>' + subject.code + '<br>' + subject.name + '</h3><p>' + subject.summary + '</p><div class="hf-tile-meta"><span class="hf-meta">' + packs.length + ' pakke</span><span class="hf-meta">' + count + ' PDF-er</span></div></button>';
    }).join('') + '</div>';
    if (planned.length) html += '<div class="hf-empty-panel"><strong>Planlagte fag uten publiserte dokumenter</strong><br>Disse vises ikke som dokumentkort før faktiske PDF-er er koblet til.<div class="hf-planned-list">' + planned.map(function (s) { return '<span class="hf-planned-chip">' + s.code + ' · ' + s.name + '</span>'; }).join('') + '</div></div>';
    return html;
  }

  function renderSubject() {
    var subject = subjectByCode(state.subject);
    if (!subject) return renderSubjects();
    var packs = packagesForSubject(subject.code);
    if (!packs.length) return breadcrumb() + '<div class="hf-empty-panel"><strong>' + subject.code + ' har ingen publiserte eksamenspakker ennå.</strong><br>Her skal det bare ligge faktiske PDF-er, så vi viser ikke demo-besvarelser eller placeholders som dokumentkort.</div>';
    return breadcrumb() + '<div class="hf-answer-toolbar"><div><strong style="color:#fff">' + subject.code + ' · ' + subject.name + '</strong><div class="hf-answer-muted">Velg semester/eksamen før du åpner filer.</div></div><button class="hf-secondary" type="button" data-route="home">Alle fag</button></div><div class="hf-package-list">' + packs.map(function (p) {
      var answerCount = p.resources.filter(function (r) { return r.kind === 'A-besvarelse'; }).length;
      return '<article class="hf-package-card" style="--accent:' + subject.accent + '"><div><div class="hf-resource-kind">' + subject.code + ' · ' + p.term + '</div><h3>' + p.title + '</h3><p>' + p.description + '</p><div class="hf-tile-meta"><span class="hf-meta">' + p.resources.length + ' PDF-er</span><span class="hf-meta">' + answerCount + ' A-besvarelse</span></div></div><div class="hf-package-actions"><button class="hf-primary" type="button" data-package="' + p.id + '">Åpne pakke →</button></div></article>';
    }).join('') + '</div>';
  }

  function renderPackage() {
    var pack = PACKAGES.find(function (p) { return p.id === state.packageId; });
    if (!pack) return renderSubject();
    var subject = subjectByCode(pack.subject);
    var resources = pack.resources.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).filter(function (r) {
      var q = state.query.toLowerCase().trim();
      return !q || (r.title + ' ' + r.kind + ' ' + r.desc + ' ' + r.subtitle).toLowerCase().indexOf(q) !== -1;
    });
    return breadcrumb() + '<div class="hf-answer-toolbar"><input class="hf-answer-search" id="hfAnswerSearch" type="search" placeholder="Søk i ' + esc(pack.title) + '..." value="' + esc(state.query) + '"><button class="hf-secondary" type="button" data-route="subject" data-subject="' + pack.subject + '">Til ' + pack.subject + '</button></div><div class="hf-resource-grid">' + resources.map(function (r) {
      return '<article class="hf-resource-card" style="--accent:' + subject.accent + '"><div class="hf-tile-top"><span class="hf-tile-icon">' + esc(r.icon) + '</span><span class="hf-status-pill live">PDF</span></div><div class="hf-resource-kind">' + esc(r.kind) + '</div><h3>' + esc(r.title) + '</h3><p>' + esc(r.desc) + '</p><div class="hf-resource-actions"><a class="hf-primary" href="' + r.url + '" target="_blank" rel="noopener">Åpne PDF</a><a class="hf-secondary" href="' + r.download + '">Last ned</a></div></article>';
    }).join('') + '</div>' + (!resources.length ? '<div class="hf-empty-panel">Ingen dokumenter matcher søket.</div>' : '');
  }

  function renderSide() {
    var side = document.querySelector('.side-col');
    if (!side) return;
    side.innerHTML = '<section class="side-panel"><div class="side-head"><h2>Publiserte dokumenter</h2></div><div class="popular-list">' + allResources().map(function (r, i) { return '<a class="popular-item" href="#/' + r.subject.toLowerCase() + '/' + r.packageId.replace(r.subject.toLowerCase() + '-', '') + '"><span class="rank">' + (i + 1) + '</span><div><strong>' + r.subject + ' ' + r.term + '</strong><span>' + esc(r.title) + '</span></div><span class="pop-tag">PDF</span></a>'; }).join('') + '</div></section><section class="side-panel"><div class="side-head"><h2>Anbefalt flyt</h2></div><div class="hf-flow"><div class="hf-flow-item"><span class="rank">1</span><div><strong>Løs eksamen først</strong><span>Ikke åpne A-besvarelsen før du har forsøkt selv.</span></div></div><div class="hf-flow-item"><span class="rank">2</span><div><strong>Sammenlign struktur</strong><span>Se disposisjon, modellbruk og drøftingsspråk.</span></div></div><div class="hf-flow-item"><span class="rank">3</span><div><strong>Les sensorveiledning</strong><span>Bruk vurderingspunktene til å finne neste øvingsmål.</span></div></div></div></section>';
  }

  function render() {
    syncLegacyGlobals();
    updateHero();
    var host = document.querySelector('.workspace > section') || document.getElementById('answerLibraryHost');
    if (!host) return;
    host.innerHTML = '<div class="hf-answer-shell">' + (state.packageId ? renderPackage() : state.subject ? renderSubject() : renderSubjects()) + '</div>';
    renderSide();
    bind();
  }

  function bind() {
    document.querySelectorAll('[data-subject]').forEach(function (el) { el.addEventListener('click', function () { setHash(el.getAttribute('data-subject')); }); });
    document.querySelectorAll('[data-package]').forEach(function (el) { el.addEventListener('click', function () { setHash(state.subject, el.getAttribute('data-package')); }); });
    document.querySelectorAll('[data-route="home"]').forEach(function (el) { el.addEventListener('click', function () { state.query = ''; setHash(null); }); });
    document.querySelectorAll('[data-route="subject"]').forEach(function (el) { el.addEventListener('click', function () { state.query = ''; setHash(el.getAttribute('data-subject') || state.subject); }); });
    var search = document.getElementById('hfAnswerSearch');
    if (search) search.addEventListener('input', function () { state.query = search.value || ''; render(); });
  }

  function route() { parseHash(); render(); }

  function install() {
    if (!isPage()) return;
    injectStyles();
    syncLegacyGlobals();
    window.render = render;
    window.renderPopular = renderSide;
    route();
    window.addEventListener('hashchange', route);
    window.setTimeout(route, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})(window, document);
