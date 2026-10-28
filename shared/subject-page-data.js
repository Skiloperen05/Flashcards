(function (window) {
  // Only actual catalog content is used; new subjects start empty.
  var pages = {};

  function learningContent() {
    return window.HaugnesLearningContent || null;
  }

  function pageKey(id) {
    var learning = learningContent();
    if (learning && typeof learning.key === 'function') return learning.key(id);
    var value = String(id || '').toLowerCase();
    if (value === 'sol1') return 'subj_sol1';
    return value;
  }

  function mergeRows(first, second) {
    var seen = {};
    return (first || []).concat(second || []).filter(function (row) {
      var key = String((row && (row.id || row.title || row[0])) || '') + '|' + String((row && (row.description || row[1])) || '');
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function mergeGeneratedPage(existing, generated) {
    if (!existing) return generated;
    if (!generated) return existing;
    var merged = Object.assign({}, generated, existing);
    merged.memo = existing.memo || generated.memo;
    merged.sources = mergeRows(existing.sources, generated.sources);
    merged.canvasMaterials = mergeRows(existing.canvasMaterials, generated.canvasMaterials);
    merged.formulaSheet = mergeRows(existing.formulaSheet, generated.formulaSheet);
    merged.examChecklist = mergeRows(existing.examChecklist, generated.examChecklist);
    merged.resources = mergeRows(existing.resources, generated.resources);
    merged.tools = generated.tools || existing.tools;
    merged.toolProfile = generated.toolProfile || existing.toolProfile;
    merged.qualityStatus = generated.qualityStatus || existing.qualityStatus;
    merged.qualityTarget = generated.qualityTarget || existing.qualityTarget;
    merged.preferredStudyMethod = generated.preferredStudyMethod || existing.preferredStudyMethod;
    merged.personalNotes = generated.personalNotes || existing.personalNotes;
    merged.personalWarnings = generated.personalWarnings || existing.personalWarnings;
    merged.examRadar = existing.examRadar || generated.examRadar;
    merged.practice = existing.practice || generated.practice;
    merged.plan = existing.plan || generated.plan;
    merged.next = existing.next || generated.next;
    return merged;
  }

  function applyLearningCatalogPages() {
    var learning = learningContent();
    if (!learning || !Array.isArray(learning.subjects) || typeof learning.pageFor !== 'function') return;
    learning.subjects.forEach(function (subject) {
      var generated = learning.pageFor(subject.id);
      if (!generated || !generated.id) return;
      var id = pageKey(generated.id);
      pages[id] = mergeGeneratedPage(pages[id], generated);
      if (id === 'subj_sol1') pages.sol1 = Object.assign({}, pages[id], { id: 'sol1' });
    });
  }

  applyLearningCatalogPages();

  // Concrete question/answer examples retained from the earlier subject pages.
  var practiceExamples = {
  "mat10": {
    "label": "Metodevalg",
    "intro": "Tre korte kontrollkort før du går inn i regneoppgaver.",
    "cards": [
      [
        "Optimering",
        "Hva må sjekkes etter at den deriverte er null?",
        "Tenk både kandidat og type punkt.",
        "Andrederivert, randpunkter og om punktet faktisk er maksimum/minimum i definisjonsområdet.",
        "Svar med metode, ikke bare tall."
      ],
      [
        "Integral",
        "Når er substitusjon ofte riktig grep?",
        "Se etter indre funksjon og derivert faktor.",
        "Når integranden har en sammensatt funksjon der deriverten av innsiden også finnes i uttrykket.",
        "Kjenn igjen mønster før du regner."
      ],
      [
        "Matrise",
        "Hva betyr det hvis determinanten er null?",
        "Koble til invers og løsning.",
        "Matrisen er ikke inverterbar; lineærsystemet kan ha ingen eller uendelig mange løsninger.",
        "Skriv konsekvensen for oppgaven."
      ]
    ]
  },
  "met2": {
    "label": "Begrep til tolkning",
    "intro": "Kortene trener presis formulering, som ofte er forskjellen på nesten riktig og helt riktig.",
    "cards": [
      [
        "P-verdi",
        "Hva er en p-verdi i én setning?",
        "Ikke si sannsynligheten for at H0 er sann.",
        "Sannsynligheten for å få et minst like ekstremt resultat som observert, gitt at nullhypotesen er sann.",
        "Bruk alltid betingelsen: gitt H0."
      ],
      [
        "KI",
        "Hva betyr et 95% konfidensintervall?",
        "Tolk metoden, ikke akkurat dette intervallet.",
        "Ved gjentatte utvalg vil omtrent 95% av intervallene laget på samme måte dekke den sanne parameteren.",
        "Unngå “95% sannsynlighet for parameteren”."
      ],
      [
        "Regresjon",
        "Hvordan tolker du en koeffisient?",
        "Hold alt annet konstant.",
        "For én enhets økning i X forventes Y å endres med koeffisienten, alt annet likt.",
        "Nevn enhet og fortegn."
      ]
    ]
  }
};
  Object.keys(practiceExamples).forEach(function (id) { if (pages[id]) pages[id].practice = practiceExamples[id]; });

  Object.keys(pages).forEach(function (id) { pages[id].id = id; });

  var CUSTOM_PAGES_KEY = 'hf_custom_subject_pages_v1';
  var DB_PAGES_KEY = 'custom_subject_pages';

  function getSupabaseClient() {
    if (window.HaugnesAuth && typeof window.HaugnesAuth.getClient === 'function') {
      var client = window.HaugnesAuth.getClient();
      if (client) return client;
    }
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    }
    return null;
  }

  function loadCustomPagesLocal() {
    try {
      var raw = window.localStorage.getItem(CUSTOM_PAGES_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveCustomPagesLocal(dict) {
    try {
      window.localStorage.setItem(CUSTOM_PAGES_KEY, JSON.stringify(dict || {}));
    } catch (e) {}
  }

  function synthesizeDefaultPage(subject) {
    if (!subject) return null;
    return {
      id: String(subject.id || subject.code).toLowerCase(),
      code: String(subject.code || subject.id).toUpperCase(),
      name: subject.name || subject.code,
      kicker: subject.kicker || '', accent: subject.accent || '#2563eb',
      lead: subject.description || '', progress: null,
      stats: [], tools: [], notes: [], answers: [], tasks: [], topics: [], plan: [],
      examRadar: null, memo: null, next: '', visibility: {}
    };
  }

  function cleanLegacyPage(page) {
    var clean = Object.assign({}, page);
    // Exact old demo identities; authored notes and attachments are retained.
    clean.notes = (page.notes || []).filter(function (row) {
      return !(row.id === 'note_1' && row.title === 'Forelesning 1: Introduksjon og kjernebegreper' && row.body === '## Hovedpunkter\n- Grunnleggende definisjoner\n- Kjerneforutsetninger i pensum\n- Sentrale eksamensmomenter' && !row.pdfData && !row.pdfUrl);
    });
    clean.answers = (page.answers || []).filter(function (row) {
      return !(row.id === 'ans_1' && / Sensorveiledning & Modellbesvarelse$/.test(row.title || '') && row.desc === 'Strukturert besvarelse av eksamensoppgavene med sensorkommentarer og poengfordeling.' && !row.pdfData && !row.pdfUrl);
    });
    clean.tasks = (page.tasks || []).filter(function (row) {
      return !(row.id === 'task_1' && row.title === 'Oppgave 1: Kjerneanalyse og metodevalg' && row.solution === 'Trinn 1: Klargjør problemstillingen og definer sentrale begreper.\nTrinn 2: Still opp analyseverktøyet og vis trinnvise beregninger.\nTrinn 3: Drøft fallgruver som sensor ofte ser etter.');
    });
    var seedDescriptions = {
      'Introduksjon og kjernebegreper': 'Grunnleggende modeller og rammeverk som danner fundamentet for faget.',
      'Metode, analyse og beregninger': 'Sentrale beregningsmetoder og analyser som kreves til eksamen.',
      'Integrert case og drøfting': 'Anvendelse av teori på praktiske problemstillinger og caseoppgaver.',
      '1. Teorigrunnlag og flashcards': 'Lær deg definisjoner, kjerneformler og begreper utenat først.',
      '2. Oppgaver og regneøkter': 'Jobb gjennom typiske øvingsoppgaver med løsningsforslag.',
      '3. A-besvarelser og eksamensradar': 'Analyser sensorveiledninger og skriv på tidligere eksamener.',
      'Kjernemodeller og begrepsforståelse': 'Sensor tester grundig om kandidaten kan forklare intuisjonen bak modellene, ikke bare gjengi formler.',
      'Metodisk analyse og beregninger': 'Deloppgaver med utregning krever tydelige mellomregninger og begrunnelse for valgte forutsetninger.',
      'Drøfting og case-anvendelse': 'Tydelig struktur med påstand, begrunnelse og nyansert motargumentasjon skiller A fra C.'
    };
    ['topics', 'plan', 'examRadar'].forEach(function (key) {
      if (!Array.isArray(clean[key])) return;
      clean[key] = clean[key].filter(function (row) {
        var title = Array.isArray(row) ? row[0] : row.title || row.theme;
        var description = Array.isArray(row) ? row[2] : row.notes || row.body;
        return !seedDescriptions[title] || description !== seedDescriptions[title];
      });
    });
    if (clean.memo) {
      clean.memo = Object.assign({}, clean.memo);
      if (/^Eksamensfokus og sensorveiledning for [^ .]+\. Vær nøye med presise begreper og vis strukturert drøfting\.$/.test(clean.memo.exam || '')) clean.memo.exam = '';
      if (clean.memo.studyAdvice === 'Start med flashcards for begrepene, drill deretter oppgaver i oppgavebanken, og avslutt med A-besvarelsene.') clean.memo.studyAdvice = '';
    }
    if (clean.stats && clean.stats[0] && clean.stats[0][0] === '100%' && clean.stats[0][1] === 'relevant') clean.stats = [];
    return clean;
  }

  function saveCustomPage(id, pageData) {
    if (!id || !pageData) return Promise.reject(new Error('ID og pagedata er påkrevd.'));
    var key = pageKey(id);
    var custom = loadCustomPagesLocal();
    var existing = custom[key] || {};
    custom[key] = Object.assign({}, existing, pageData, {
      id: key,
      updated_at: new Date().toISOString()
    });
    saveCustomPagesLocal(custom);

    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('haugnes:page-updated', { detail: { id: key, data: custom[key] } }));
    }

    var sb = getSupabaseClient();
    if (!sb) return Promise.resolve(custom[key]);

    var session = window.AuthGuard && typeof window.AuthGuard.getSession === 'function' ? window.AuthGuard.getSession() : null;
    return Promise.resolve(sb.from('admin_content').upsert({
      key: DB_PAGES_KEY,
      content: { pages: custom },
      updated_by: session && session.user ? session.user.id : null,
      updated_at: new Date().toISOString()
    })).then(function () {
      return custom[key];
    }).catch(function (err) {
      console.warn('[subject-page-data] Cloud persist error:', err);
      return custom[key];
    });
  }

  function deleteCustomPage(id) {
    var key = pageKey(id);
    var custom = loadCustomPagesLocal();
    delete custom[key];
    saveCustomPagesLocal(custom);

    var sb = getSupabaseClient();
    if (!sb) return Promise.resolve(true);

    var session = window.AuthGuard && typeof window.AuthGuard.getSession === 'function' ? window.AuthGuard.getSession() : null;
    return Promise.resolve(sb.from('admin_content').upsert({
      key: DB_PAGES_KEY,
      content: { pages: custom },
      updated_by: session && session.user ? session.user.id : null,
      updated_at: new Date().toISOString()
    })).then(function () { return true; }).catch(function () { return true; });
  }

  function syncCustomPages() {
    var sb = getSupabaseClient();
    if (!sb) return Promise.resolve(loadCustomPagesLocal());
    return Promise.resolve(sb.from('admin_content').select('content').eq('key', DB_PAGES_KEY).maybeSingle()).then(function (result) {
      var cloud = result && result.data && result.data.content && typeof result.data.content.pages === 'object' ? result.data.content.pages : null;
      if (cloud) {
        var local = loadCustomPagesLocal();
        var merged = Object.assign({}, cloud, local);
        saveCustomPagesLocal(merged);
      }
      return loadCustomPagesLocal();
    }).catch(function () {
      return loadCustomPagesLocal();
    });
  }

  window.HaugnesSubjectPages = {
    // Source-controlled material only. Studio must not inherit old browser templates.
    getSourcePage: function (id) {
      var key = pageKey(id);
      if (pages[key]) return pages[key];
      var learning = learningContent();
      var generated = learning && typeof learning.pageFor === 'function' ? learning.pageFor(id) : null;
      if (generated) return generated;
      var subject = window.HaugnesSubjects && typeof window.HaugnesSubjects.findById === 'function' ? window.HaugnesSubjects.findById(id) : null;
      return subject ? synthesizeDefaultPage(subject) : null;
    },
    get: function (id) {
      var key = pageKey(id);
      var custom = loadCustomPagesLocal();
      var staticPage = pages[key] || null;
      var learning = learningContent();
      var fromLearning = learning && typeof learning.pageFor === 'function' ? learning.pageFor(id) : null;
      var subject = window.HaugnesSubjects && typeof window.HaugnesSubjects.findById === 'function' ? window.HaugnesSubjects.findById(id) : null;
      var synthesized = subject ? synthesizeDefaultPage(subject) : null;
      var base = staticPage || fromLearning || synthesized || {};

      if (custom[key]) {
        return cleanLegacyPage(Object.assign({}, base, custom[key]));
      }
      if (staticPage) return staticPage;
      if (fromLearning) return fromLearning;
      if (synthesized) return synthesized;
      return null;
    },
    savePage: saveCustomPage,
    deletePage: deleteCustomPage,
    getCustomPages: loadCustomPagesLocal,
    syncWithCloud: syncCustomPages
  };

  syncCustomPages();
})(window);
