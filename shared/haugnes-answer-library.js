(function (window, document) {
  'use strict';

  if (window.__haugnesAnswerLibraryInstalled) return;
  window.__haugnesAnswerLibraryInstalled = true;

  // Display-only catalog (no premium content – just icons, colours, names).
  // Actual package/resource data is fetched from Supabase and protected by RLS.
  var SUBJECTS = [
    { code: 'RET14', name: 'Skatterett', accent: '#2f62ff', icon: '%', summary: 'Eksamenspakker for skatterett samles her når PDF-er legges ut.' },
    { code: 'SOL1', name: 'Organisasjonsatferd', accent: '#20b97a', icon: '♣', summary: 'V25-pakken har to ulike A-besvarelser til samme eksamen. V26-pakken har A-besvarelse og sensorveiledning.' },
    { code: 'SAM2', name: 'Mikroøkonomi', accent: '#f09828', icon: '◔', summary: 'Eksamenspakker for mikroøkonomi samles her når PDF-er legges ut.' },
    { code: 'SAM3', name: 'Makroøkonomi', accent: '#ef4444', icon: '↗', summary: 'V25- og V26-pakkene ligger ute med original eksamen, A-besvarelse og sensorveiledning.' },
    { code: 'MET2', name: 'Metode', accent: '#7c3aed', icon: 'Σ', summary: 'Eksamenspakker for metode samles her når PDF-er legges ut.' },
    { code: 'MAT10', name: 'Matematikk', accent: '#0891b2', icon: '∫', summary: 'Eksamenspakker for matematikk samles her når PDF-er legges ut.' },
    { code: 'SAM1A', name: 'Mikroøkonomi intro', accent: '#f09828', icon: '↗', emblem: '../assets/emblems/SAM1A.png', summary: 'Første-semesterpakke for læringsmål, kompendium og eksamensrelevante modeller.' },
    { code: 'MET1', name: 'Matematikk for økonomer', accent: '#06b6d4', icon: '%', emblem: '../assets/emblems/MET1.png', summary: 'Første-semesterpakke for NNV, rente, annuitet og metodeoppgaver.' },
    { code: 'KOM1', name: 'Kommunikasjon', accent: '#e8bc68', icon: '✎', emblem: '../assets/emblems/KOM1.png', summary: 'Første-semesterpakke for rapport, presentasjon og akademisk skriving.' },
    { code: 'RET1A', name: 'Juridiske emner', accent: '#3b82f6', icon: '§', emblem: '../assets/emblems/RET1A.png', summary: 'H25-pakken ligger ute med A-besvarelse og sensorveiledning.' },
    { code: 'BED1', name: 'Bedriftsøkonomi', accent: '#20b97a', icon: '◆', emblem: '../assets/emblems/BED1.png', summary: 'H25-pakken ligger ute med eksamen, A-besvarelse og løsningsforslag.' }
  ];

  var STORAGE_BUCKET = 'answer-pdfs';
  var SIGNED_URL_TTL = 60 * 60 * 4; // 4 hours – re-signed on every page load.
  var LOCAL_PACKAGES = [
    {
      id: 'sam3-v25',
      subject: 'SAM3',
      term: 'V25',
      title: 'Våren 2025',
      subtitle: 'SAM3 Makroøkonomi',
      description: 'Komplett eksamenspakke med originaloppgave, A-besvarelse og sensorveiledning.',
      sortOrder: 40,
      resources: [
        { id: 'sam3-v25-exam', order: 1, kind: 'Eksamen', title: 'SAM3 skoleeksamen V25', subtitle: 'Original oppgave', desc: 'Original eksamensoppgave for våren 2025. Start her og gjør et eget forsøk før du ser på løsning.', icon: 'E', url: '../sam3/eksamenspakker/v25/sam3-skoleeksamen-v25.pdf', download: '../sam3/eksamenspakker/v25/sam3-skoleeksamen-v25.pdf' },
        { id: 'sam3-v25-answer', order: 2, kind: 'A-besvarelse', title: 'A-besvarelse SAM3 V25', subtitle: 'Makroøkonomi', desc: 'Eksempel på sterk besvarelse. Bruk den etter egen gjennomføring for å sammenligne struktur, modellbruk og drøfting.', icon: 'A', url: '../sam3/eksamenspakker/v25/sam3-a-besvarelse-v25.pdf', download: '../sam3/eksamenspakker/v25/sam3-a-besvarelse-v25.pdf' },
        { id: 'sam3-v25-sensor', order: 3, kind: 'Sensorveiledning', title: 'SAM3 sensorveiledning V25', subtitle: 'Vurderingspunkter', desc: 'Sensorveiledningen viser hva sensor belønner og hvilke momenter som bør være med.', icon: 'S', url: '../sam3/eksamenspakker/v25/sam3-sensorveiledning-v25.pdf', download: '../sam3/eksamenspakker/v25/sam3-sensorveiledning-v25.pdf' }
      ]
    },
    {
      id: 'sam3-v26',
      subject: 'SAM3',
      term: 'V26',
      title: 'Våren 2026',
      subtitle: 'SAM3 Makroøkonomi',
      description: 'Komplett eksamenspakke med originaloppgave, A-besvarelse og sensorveiledning.',
      sortOrder: 41,
      resources: [
        { id: 'sam3-v26-exam', order: 1, kind: 'Eksamen', title: 'SAM3 skoleeksamen V26', subtitle: 'Original oppgave', desc: 'Original eksamensoppgave for våren 2026. Start her og gjør et eget forsøk før du ser på løsning.', icon: 'E', url: '../sam3/eksamenspakker/v26/sam3-skoleeksamen-v26.pdf', download: '../sam3/eksamenspakker/v26/sam3-skoleeksamen-v26.pdf' },
        { id: 'sam3-v26-answer', order: 2, kind: 'A-besvarelse', title: 'A-besvarelse SAM3 V26', subtitle: 'Makroøkonomi', desc: 'Eksempel på sterk besvarelse. Bruk den etter egen gjennomføring for å sammenligne struktur, modellbruk og drøfting.', icon: 'A', url: '../sam3/eksamenspakker/v26/sam3-a-besvarelse-v26.pdf', download: '../sam3/eksamenspakker/v26/sam3-a-besvarelse-v26.pdf' },
        { id: 'sam3-v26-sensor', order: 3, kind: 'Sensorveiledning', title: 'SAM3 sensorveiledning V26', subtitle: 'Vurderingspunkter', desc: 'Sensorveiledningen viser hva sensor belønner og hvilke momenter som bør være med.', icon: 'S', url: '../sam3/eksamenspakker/v26/sam3-sensorveiledning-v26.pdf', download: '../sam3/eksamenspakker/v26/sam3-sensorveiledning-v26.pdf' }
      ]
    },
    {
      id: 'sol1-v25',
      subject: 'SOL1',
      term: 'V25',
      title: 'Våren 2025',
      subtitle: 'SOL1 Organisasjonsatferd',
      description: 'Eksamen, sensorveiledning og to ulike A-besvarelser til samme eksamen. Les dem som to separate eksempler på sterke svar, ikke som én samlet besvarelse.',
      localStatus: 'To A-besvarelser',
      sortOrder: 20,
      resources: [
        { id: 'sol1-v25-exam', order: 1, kind: 'Eksamen', title: 'SOL1 eksamen V25', subtitle: 'Original oppgave', desc: 'Original eksamensoppgave i SOL1 våren 2025.', icon: 'E', url: '../sol1/eksamenspakker/v25/sol1-eksamen-v25.pdf', download: '../sol1/eksamenspakker/v25/sol1-eksamen-v25.pdf' },
        { id: 'sol1-v25-answer-vetle', order: 2, kind: 'A-besvarelse', title: 'A-besvarelse SOL1 V25 · Vetle', subtitle: 'A-besvarelse 1 av 2', desc: 'Den ene av to ulike A-besvarelser til samme SOL1-eksamen våren 2025.', icon: 'A', url: '../sol1/eksamenspakker/v25/sol1-a-besvarelse-vetle-v25.pdf', download: '../sol1/eksamenspakker/v25/sol1-a-besvarelse-vetle-v25.pdf' },
        { id: 'sol1-v25-answer-aksel', order: 3, kind: 'A-besvarelse', title: 'A-besvarelse SOL1 V25 · Aksel', subtitle: 'A-besvarelse 2 av 2', desc: 'Den andre av to ulike A-besvarelser til samme SOL1-eksamen våren 2025. Sammenlign struktur, teorivalg og drøftingsnivå med Vetle-besvarelsen.', icon: 'A', url: '../sol1/eksamenspakker/v25/sol1-a-besvarelse-aksel-v25.pdf', download: '../sol1/eksamenspakker/v25/sol1-a-besvarelse-aksel-v25.pdf' },
        { id: 'sol1-v25-sensor', order: 4, kind: 'Sensorveiledning', title: 'SOL1 sensorveiledning V25', subtitle: 'Vurderingspunkter', desc: 'Sensorveiledning til SOL1-eksamen våren 2025.', icon: 'S', url: '../sol1/eksamenspakker/v25/sol1-sensorveiledning-v25.pdf', download: '../sol1/eksamenspakker/v25/sol1-sensorveiledning-v25.pdf' }
      ]
    },
    {
      id: 'sol1-v26',
      subject: 'SOL1',
      term: 'V26',
      title: 'Våren 2026',
      subtitle: 'SOL1 Organisasjonsatferd',
      description: 'Eksamenspakke med A-besvarelse og sensorveiledning for våren 2026.',
      sortOrder: 21,
      resources: [
        { id: 'sol1-v26-answer', order: 1, kind: 'A-besvarelse', title: 'A-besvarelse SOL1 V26', subtitle: 'Word-dokument', desc: 'A-besvarelse til SOL1-eksamen våren 2026.', icon: 'A', url: '../sol1/eksamenspakker/v26/sol1-a-besvarelse-v26.docx', download: '../sol1/eksamenspakker/v26/sol1-a-besvarelse-v26.docx' },
        { id: 'sol1-v26-sensor', order: 2, kind: 'Sensorveiledning', title: 'SOL1 sensorveiledning V26', subtitle: 'Vurderingspunkter', desc: 'Sensorveiledning til SOL1-eksamen våren 2026.', icon: 'S', url: '../sol1/eksamenspakker/v26/sol1-sensorveiledning-v26.pdf', download: '../sol1/eksamenspakker/v26/sol1-sensorveiledning-v26.pdf' }
      ]
    },
    {
      id: 'bed1-h25',
      subject: 'BED1',
      term: 'H25',
      title: 'Høsten 2025',
      subtitle: 'BED1 Bedriftsøkonomi',
      description: 'Eksamenspakke med original eksamen, A-besvarelse og løsningsforslag.',
      sortOrder: 110,
      resources: [
        { id: 'bed1-h25-exam', order: 1, kind: 'Eksamen', title: 'BED1 eksamen H25', subtitle: 'Original oppgave', desc: 'Original eksamensoppgave i BED1 høsten 2025.', icon: 'E', url: '../bed1/eksamenspakker/h25/bed1-eksamen-h25.pdf', download: '../bed1/eksamenspakker/h25/bed1-eksamen-h25.pdf' },
        { id: 'bed1-h25-answer', order: 2, kind: 'A-besvarelse', title: 'A-besvarelse BED1 H25', subtitle: 'Bedriftsøkonomi', desc: 'Eksempel på sterk besvarelse til BED1-eksamen høsten 2025.', icon: 'A', url: '../bed1/eksamenspakker/h25/bed1-a-besvarelse-h25.pdf', download: '../bed1/eksamenspakker/h25/bed1-a-besvarelse-h25.pdf' },
        { id: 'bed1-h25-solution', order: 3, kind: 'Løsningsforslag', title: 'BED1 løsning H25', subtitle: 'Løsningsforslag', desc: 'Løsningsforslag til BED1-eksamen høsten 2025.', icon: 'L', url: '../bed1/eksamenspakker/h25/bed1-losning-h25.pdf', download: '../bed1/eksamenspakker/h25/bed1-losning-h25.pdf' }
      ]
    },
    {
      id: 'ret1a-h25',
      subject: 'RET1A',
      term: 'H25',
      title: 'Høsten 2025',
      subtitle: 'RET1A Juridiske emner',
      description: 'Eksamenspakke med A-besvarelse og sensorveiledning.',
      sortOrder: 100,
      resources: [
        { id: 'ret1a-h25-answer', order: 1, kind: 'A-besvarelse', title: 'A-besvarelse RET1A H25', subtitle: 'Juridiske emner', desc: 'Eksempel på sterk juridisk besvarelse til RET1A høsten 2025.', icon: 'A', url: '../ret1a/eksamenspakker/h25/ret1a-a-besvarelse-h25.pdf', download: '../ret1a/eksamenspakker/h25/ret1a-a-besvarelse-h25.pdf' },
        { id: 'ret1a-h25-sensor', order: 2, kind: 'Sensorveiledning', title: 'RET1A sensorveiledning H25', subtitle: 'Word-dokument', desc: 'Sensorveiledning til RET1A høsten 2025.', icon: 'S', url: '../ret1a/eksamenspakker/h25/ret1a-sensorveiledning-h25.doc', download: '../ret1a/eksamenspakker/h25/ret1a-sensorveiledning-h25.doc' }
      ]
    }
  ];

  var PACKAGES = [];
  var packagesLoaded = false;
  var packagesPromise = null;
  var lastLoadError = null;

  var state = { subject: null, packageId: null, query: '' };

  function isPage() { return /\/user\/a-besvarelser\.html$/.test(window.location.pathname); }
  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function code(value) { return String(value || '').toUpperCase().replace(/[\s-]+/g, ''); }

  function entitledCodes() {
    if (window.HaugnesEntitlements && typeof window.HaugnesEntitlements.getCodes === 'function') {
      var owned = window.HaugnesEntitlements.getCodes();
      if (window.HaugnesEntitlements.hasBypass && window.HaugnesEntitlements.hasBypass()) {
        return SUBJECTS.map(function (s) { return s.code; });
      }
      return owned;
    }
    return [];
  }

  // Access to the archive is driven purely by subject ownership: unlocking a
  // subject unlocks its A-besvarelser. (The Mine fag selection no longer hides
  // the archive – locked subjects are shown with a padlock instead.)
  function availableCodes() {
    var owned = entitledCodes();
    if (!owned.length && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname) && new URLSearchParams(window.location.search).get('dev') === '1') {
      return SUBJECTS.map(function (s) { return s.code; });
    }
    return owned;
  }

  function isUnlocked(c) {
    return availableCodes().indexOf(code(c)) !== -1;
  }

  function shopUrl() {
    return (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function')
      ? window.AuthGuard.getRootPath().replace(/\/$/, '/') + 'user/butikk.html'
      : 'butikk.html';
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

  function normalizedLocalPackages() {
    return LOCAL_PACKAGES.map(function (p) {
      return Object.assign({}, p, {
        subject: code(p.subject),
        localStatus: p.localStatus || null,
        resources: (p.resources || []).map(function (r) { return Object.assign({ storagePath: null, storageBucket: null }, r); })
      });
    });
  }

  function mergePackages(remotePackages) {
    var byId = {};
    normalizedLocalPackages().forEach(function (p) { byId[p.id] = p; });
    (remotePackages || []).forEach(function (p) {
      var local = byId[p.id];
      if (local && local.resources.length && !p.resources.length) return;
      byId[p.id] = p;
    });
    return Object.keys(byId).map(function (id) { return byId[id]; }).sort(function (a, b) {
      return (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.id).localeCompare(String(b.id));
    });
  }

  // Resources uploaded to Supabase Storage keep only their bucket path in the DB.
  // Turn those into short-lived signed URLs (open + forced-download) at load time.
  function signStorageResources(sb, resources) {
    var stored = resources.filter(function (r) { return r.storage_path; });
    if (!stored.length || !sb || !sb.storage) return Promise.resolve();
    var jobs = stored.map(function (r) {
      var bucket = r.storage_bucket || STORAGE_BUCKET;
      var open = sb.storage.from(bucket).createSignedUrl(r.storage_path, SIGNED_URL_TTL);
      var name = String(r.storage_path).split('/').pop() || (r.title || 'dokument') + '.pdf';
      var dl = sb.storage.from(bucket).createSignedUrl(r.storage_path, SIGNED_URL_TTL, { download: name });
      return Promise.all([open, dl]).then(function (out) {
        if (out[0] && out[0].data && out[0].data.signedUrl) r.__signedUrl = out[0].data.signedUrl;
        if (out[1] && out[1].data && out[1].data.signedUrl) r.__signedDownload = out[1].data.signedUrl;
      }).catch(function () {});
    });
    return Promise.all(jobs).then(function () {});
  }

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
          sb.from('answer_resources').select('id,package_id,kind,title,subtitle,description,icon,url,download_url,order_index,storage_bucket,storage_path').order('order_index')
        ]).then(function (results) {
          var pkgRes = results[0];
          var resRes = results[1];
          if (pkgRes && pkgRes.error) lastLoadError = pkgRes.error;
          if (resRes && resRes.error) lastLoadError = resRes.error;
          var packages = (pkgRes && pkgRes.data ? pkgRes.data : []);
          var resources = (resRes && resRes.data ? resRes.data : []);
          return signStorageResources(sb, resources).then(function () {
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
                    var stored = r.storage_path && (r.storage_bucket || STORAGE_BUCKET);
                    return {
                      id: r.id,
                      order: r.order_index || 0,
                      kind: r.kind,
                      title: r.title,
                      subtitle: r.subtitle || '',
                      desc: r.description || '',
                      icon: r.icon || '',
                      storagePath: r.storage_path || null,
                      storageBucket: stored ? (r.storage_bucket || STORAGE_BUCKET) : null,
                      url: r.__signedUrl || r.url,
                      download: r.__signedDownload || r.download_url || r.__signedUrl || r.url
                    };
                  })
                  .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
              };
            });
          });
        });
      }).then(function (packages) {
        PACKAGES = mergePackages(packages);
        packagesLoaded = true;
        return PACKAGES;
      }).catch(function (e) {
        lastLoadError = e;
        PACKAGES = mergePackages([]);
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
      return { course: r.subject, icon: subject.icon, color: subject.accent, term: r.term, title: r.title, subtitle: r.subtitle, type: (r.kind || '').toLowerCase(), desc: r.desc, meta: [r.kind, /\.pdf($|[?#])/i.test(r.url || r.download || '') ? 'PDF' : 'Dokument', r.term], popular: index + 1, url: r.url, download: r.download };
    });
    window.HaugnesAnswerLibrary = { subjects: enabledSubjects(), packages: enabledPackages(), resources: allResources(), summary: summary, render: render, storageBucket: STORAGE_BUCKET, signedUrlTtl: SIGNED_URL_TTL, reload: function () { return loadPackages(true).then(function () { render(); }); } };
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
      '.hf-status-pill.locked{background:rgba(148,163,184,.16);border-color:rgba(148,163,184,.30);color:#dbe3f0}',
      '.hf-subject-tile.hf-locked{cursor:default;border-color:rgba(148,163,184,.20)}',
      '.hf-subject-tile.hf-locked .hf-tile-icon{background:rgba(148,163,184,.22);box-shadow:none}',
      '.hf-subject-tile.hf-locked h3,.hf-subject-tile.hf-locked p{opacity:.72}',
      '.hf-subject-tile.hf-locked::before{opacity:.10}',
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
      '.hf-flow{display:grid;gap:9px}.hf-flow-item{display:grid;grid-template-columns:44px 1fr;gap:12px;align-items:center;padding:12px;border-radius:15px;background:rgba(255,255,255,.045);border:1px solid var(--line)}',
      '.hf-flow-emblem{width:44px;height:44px;border-radius:14px;overflow:hidden;background:linear-gradient(180deg,#fdfefe,#eaeff5);border:1px solid rgba(126,162,255,.18);box-shadow:0 10px 22px rgba(0,0,0,.20);display:grid;place-items:center}.hf-flow-emblem img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}',
      '.hf-flow-item strong{display:block;font-size:12.5px;color:#fff}.hf-flow-item span:not(.hf-flow-emblem){display:block;color:#8fa5ca;font-size:11px;margin-top:2px}',
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
    if (heroCopy) heroCopy.textContent = 'Fag du har låst opp er åpne. Fag du ikke eier vises med hengelås til du låser dem opp i Butikken.';
    if (stats[0]) stats[0].textContent = s.resources;
    if (stats[1]) stats[1].textContent = s.packages;
    if (stats[2]) stats[2].textContent = s.answers;
    if (labels[0]) labels[0].textContent = 'dokumenter ute';
    if (labels[1]) labels[1].textContent = 'pakker';
    if (labels[2]) labels[2].textContent = 'A-besvarelser';
  }

  function setHash(subject, packageId) { var hash = subject ? '#/' + subject.toLowerCase() + (packageId ? '/' + packageId.replace(subject.toLowerCase() + '-', '') : '') : ''; if (window.location.hash !== hash) window.location.hash = hash; else route(); }
  function parseHash() { var parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean); state.subject = parts[0] ? parts[0].toUpperCase() : null; state.packageId = state.subject && parts[1] ? state.subject.toLowerCase() + '-' + parts[1] : null; if (state.subject && availableCodes().indexOf(state.subject) === -1) { state.subject = null; state.packageId = null; } }
  function breadcrumb() { var html = '<div class="hf-answer-breadcrumb"><button type="button" data-route="home">Fag</button>'; if (state.subject) html += '<span>›</span><button type="button" data-route="subject" data-subject="' + esc(state.subject) + '">' + esc(state.subject) + '</button>'; if (state.packageId) { var pack = packageById(state.packageId); html += '<span>›</span><span>' + esc(pack ? pack.title : 'Pakke') + '</span>'; } return html + '</div>'; }

  function renderSubjects() {
    // Wait for entitlements so we don't briefly show owned subjects as locked.
    if (window.HaugnesEntitlements && typeof window.HaugnesEntitlements.isLoaded === 'function' && !window.HaugnesEntitlements.isLoaded()) {
      return breadcrumb() + '<div class="hf-empty-panel">Laster fagtilgang…</div>';
    }
    var s = summary();
    var q = state.query.toLowerCase().trim();
    var subjects = SUBJECTS.filter(function (subject) { return !q || (subject.code + ' ' + subject.name + ' ' + subject.summary).toLowerCase().indexOf(q) !== -1; });
    var shopHref = shopUrl();
    var toolbar = '<div class="hf-answer-toolbar"><input class="hf-answer-search" id="hfAnswerSearch" type="search" placeholder="Søk i fag..." value="' + esc(state.query) + '"><span class="hf-answer-muted">' + s.subjects + ' av ' + SUBJECTS.length + ' fag låst opp · ' + s.resources + ' dokumenter ute</span></div>';
    if (!subjects.length) return breadcrumb() + toolbar + '<div class="hf-empty-panel">Ingen fag matcher søket.</div>';
    return breadcrumb() + toolbar + '<div class="hf-subject-grid">' + subjects.map(function (subject) {
      if (!isUnlocked(subject.code)) {
        return '<div class="hf-subject-tile hf-locked" style="--accent:' + subject.accent + '"><div class="hf-tile-top"><span class="hf-tile-icon">🔒</span><span class="hf-status-pill locked">Låst</span></div><h3>' + subject.code + '<br>' + subject.name + '</h3><p>Lås opp ' + subject.code + ' i Butikken for å få tilgang til eksamenspakker, A-besvarelser og sensorveiledninger.</p><div class="hf-tile-meta"><a class="hf-primary" href="' + esc(shopHref) + '">Lås opp i Butikk →</a></div></div>';
      }
      var packs = packagesForSubject(subject.code);
      var count = packs.reduce(function (sum, p) { return sum + p.resources.length; }, 0);
      var live = count > 0;
      return '<button class="hf-subject-tile" style="--accent:' + subject.accent + '" data-subject="' + subject.code + '"><div class="hf-tile-top"><span class="hf-tile-icon">' + subject.icon + '</span><span class="hf-status-pill ' + (live ? 'live' : 'planned') + '">' + (live ? 'Publisert' : 'Klar plass') + '</span></div><h3>' + subject.code + '<br>' + subject.name + '</h3><p>' + subject.summary + '</p><div class="hf-tile-meta"><span class="hf-meta">' + packs.length + ' pakke</span><span class="hf-meta">' + count + ' dokumenter</span></div></button>';
    }).join('') + '</div>';
  }

  function renderSubject() {
    var subject = subjectByCode(state.subject);
    if (!subject || availableCodes().indexOf(subject.code) === -1) return renderSubjects();
    var packs = packagesForSubject(subject.code);
    return breadcrumb() + '<div class="hf-answer-toolbar"><div><strong style="color:#fff">' + subject.code + ' · ' + subject.name + '</strong><div class="hf-answer-muted">Velg semester/eksamenspakke. Pakker uten PDF-er er tydelig markert.</div></div><button class="hf-secondary" type="button" data-route="home">Alle fag</button></div><div class="hf-package-list">' + packs.map(function (p) {
      var live = p.resources.length > 0;
      var answerCount = p.resources.filter(function (r) { return r.kind === 'A-besvarelse'; }).length;
      return '<article class="hf-package-card" style="--accent:' + subject.accent + '"><div><div class="hf-resource-kind">' + subject.code + ' · ' + p.term + '</div><h3>' + p.title + '</h3><p>' + p.description + '</p><div class="hf-tile-meta"><span class="hf-meta">' + p.resources.length + ' dokumenter</span><span class="hf-meta">' + answerCount + ' A-besvarelse</span><span class="hf-meta">' + (p.localStatus || (live ? 'Publisert' : 'Venter på filer')) + '</span></div></div><div class="hf-package-actions"><button class="hf-primary" type="button" data-package="' + p.id + '">' + (live ? 'Åpne pakke →' : 'Se pakkeplass →') + '</button></div></article>';
    }).join('') + '</div>';
  }

  function renderPackage() {
    var pack = packageById(state.packageId);
    if (!pack) return renderSubject();
    var subject = subjectByCode(pack.subject);
    var resources = pack.resources.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).filter(function (r) { var q = state.query.toLowerCase().trim(); return !q || (r.title + ' ' + r.kind + ' ' + r.desc + ' ' + r.subtitle).toLowerCase().indexOf(q) !== -1; });
    var html = breadcrumb() + '<div class="hf-answer-toolbar"><input class="hf-answer-search" id="hfAnswerSearch" type="search" placeholder="Søk i ' + esc(pack.title) + '..." value="' + esc(state.query) + '"><button class="hf-secondary" type="button" data-route="subject" data-subject="' + pack.subject + '">Til ' + pack.subject + '</button></div>';
    if (!pack.resources.length) return html + '<div class="hf-empty-panel"><strong>' + esc(pack.subtitle) + ' · ' + esc(pack.title) + '</strong><br>' + esc(pack.localStatus ? pack.description : 'Denne pakken er klar, men har ingen publiserte PDF-er ennå. Når eksamen, A-besvarelse eller sensorveiledning legges ut, vises filene her i samme struktur som SAM3-pakken.') + '</div>';
    return html + '<div class="hf-resource-grid">' + resources.map(function (r) {
      var isPdf = /\.pdf($|[?#])/i.test(r.url || r.download || '');
      return '<article class="hf-resource-card" style="--accent:' + subject.accent + '"><div class="hf-tile-top"><span class="hf-tile-icon">' + esc(r.icon) + '</span><span class="hf-status-pill live">' + (isPdf ? 'PDF' : 'Dokument') + '</span></div><div class="hf-resource-kind">' + esc(r.kind) + '</div><h3>' + esc(r.title) + '</h3><p>' + esc(r.desc) + '</p><div class="hf-resource-actions"><a class="hf-primary" href="' + r.url + '" target="_blank" rel="noopener">' + (isPdf ? 'Åpne PDF' : 'Åpne dokument') + '</a><a class="hf-secondary" href="' + r.download + '">Last ned</a></div></article>';
    }).join('') + '</div>' + (!resources.length ? '<div class="hf-empty-panel">Ingen dokumenter matcher søket.</div>' : '');
  }

  function renderSide() {
    var side = document.querySelector('.side-col'); if (!side) return;
    var resources = allResources();
    var list = resources.length ? resources.map(function (r, i) { return '<a class="popular-item" href="#/' + r.subject.toLowerCase() + '/' + r.packageId.replace(r.subject.toLowerCase() + '-', '') + '"><span class="rank">' + (i + 1) + '</span><div><strong>' + r.subject + ' ' + r.term + '</strong><span>' + esc(r.title) + '</span></div><span class="pop-tag">Dok</span></a>'; }).join('') : '<div class="hf-empty-panel">Ingen dokumenter ligger ute for valgte fag ennå.</div>';
    side.innerHTML = '<section class="side-panel"><div class="side-head"><h2>Publiserte dokumenter</h2></div><div class="popular-list">' + list + '</div></section><section class="side-panel"><div class="side-head"><h2>Anbefalt flyt</h2></div><div class="hf-flow"><div class="hf-flow-item"><span class="hf-flow-emblem"><img src="../assets/emblems/answer-flow-exam.png" alt=""></span><div><strong>Løs eksamen først</strong><span>Ikke åpne A-besvarelsen før du har forsøkt selv.</span></div></div><div class="hf-flow-item"><span class="hf-flow-emblem"><img src="../assets/emblems/answer-flow-compare.png" alt=""></span><div><strong>Sammenlign struktur</strong><span>Se disposisjon, modellbruk og drøftingsspråk.</span></div></div><div class="hf-flow-item"><span class="hf-flow-emblem"><img src="../assets/emblems/answer-flow-sensor.png" alt=""></span><div><strong>Les sensorveiledning</strong><span>Bruk vurderingspunktene til å finne neste øvingsmål.</span></div></div></div></section>';
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
    PACKAGES = mergePackages(PACKAGES);
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
