(function (window) {
  var categories = [
    { id: 'semester1', label: 'Første semester', shortLabel: '1. semester', order: 10 },
    { id: 'semester2', label: 'Andre semester', shortLabel: '2. semester', order: 20 },
    { id: 'semester4', label: 'Fjerde semester', shortLabel: '4. semester', order: 40 },
    { id: 'electives', label: 'Valgfag', shortLabel: 'Valgfag', order: 90 }
  ];

  var categoryById = categories.reduce(function (out, category) {
    out[category.id] = category;
    return out;
  }, {});

  function withCategory(subject, categoryId, sortOrder) {
    var category = categoryById[categoryId] || categories[0];
    subject.categoryId = category.id;
    subject.categoryLabel = category.label;
    subject.categoryShortLabel = category.shortLabel;
    subject.categoryOrder = category.order;
    subject.sortOrder = sortOrder;
    return subject;
  }

  var subjects = [
    withCategory({
      id: 'ret14',
      code: 'RET14',
      name: 'Skatterett',
      icon: '⚖️',
      emblem: '../assets/emblems/RET14.png',
      accent: '#2f62ff',
      status: 'active',
      statusText: 'Aktiv',
      progress: 0,
      decks: '15+',
      cards: '1450',
      tools: '4',
      path: '../ret14/',
      flashcards: '../flashcards/?subject=ret14',
      description: 'Skatt, fradrag, aksjer, personinntekt, arv og eksamensanalyse.'
    }, 'electives', 20),
    withCategory({
      id: 'subj_sol1',
      aliases: ['sol1'],
      code: 'SOL1',
      name: 'Organisasjonsatferd',
      icon: '🧠',
      emblem: '../assets/emblems/SOL1.png',
      accent: '#20b97a',
      status: 'active',
      statusText: 'Aktiv',
      progress: 0,
      decks: '13+',
      cards: '438',
      tools: '4',
      path: '../sol1/',
      flashcards: '../flashcards/?subject=subj_sol1',
      description: 'Begreper, teorier, modeller, caseforståelse og teoriskriving.'
    }, 'semester2', 30),
    withCategory({
      id: 'sam2',
      code: 'SAM2',
      name: 'Mikroøkonomi',
      icon: '📈',
      emblem: '../assets/emblems/SAM2.png',
      accent: '#f09828',
      status: 'exam',
      statusText: 'Eksamen',
      progress: 0,
      decks: '24',
      cards: '66',
      tools: '3',
      path: '../sam2/',
      flashcards: '../sam2/oppgaver-klikkbar/',
      description: 'Oppgaveprioritering, eksamensradar, figurer og modellvalg.'
    }, 'semester2', 20),
    withCategory({
      id: 'sam3',
      code: 'SAM3',
      name: 'Makroøkonomi',
      icon: '🌍',
      emblem: '../assets/emblems/SAM3.png',
      accent: '#ef4444',
      status: 'active',
      statusText: 'Aktiv',
      progress: 0,
      decks: '12+',
      cards: '—',
      tools: '6',
      path: '../sam3/',
      flashcards: '../sam3/flashcards.html',
      description: 'Makromodeller, formler, quiz, eksamensradar og mock-eksamen.'
    }, 'semester4', 10),
    withCategory({
      id: 'met2',
      code: 'MET2',
      name: 'Metode',
      icon: 'Σ',
      emblem: '../assets/emblems/MET2.png',
      accent: '#7c3aed',
      status: 'active',
      statusText: 'MVP',
      progress: 28,
      decks: '5',
      cards: '5+',
      tools: '3',
      path: '../met2/',
      flashcards: '../flashcards/?subject=met2',
      description: 'Metode, statistikk, hypotesetesting, konfidensintervall og regresjon.'
    }, 'semester2', 10),
    withCategory({
      id: 'mat10',
      code: 'MAT10',
      name: 'Matematikk',
      icon: '∫',
      emblem: '../assets/emblems/MAT10.png',
      accent: '#0891b2',
      status: 'active',
      statusText: 'MVP',
      progress: 34,
      decks: '6',
      cards: '4+',
      tools: '3',
      path: '../mat10/',
      flashcards: '../flashcards/?subject=mat10',
      description: 'Analyse, lineær algebra, formler, regneøkter og eksamensdrill.'
    }, 'electives', 10),
    withCategory({
      id: 'sam1a',
      code: 'SAM1A',
      name: 'Mikroøkonomi intro',
      icon: '↗',
      accent: '#f09828',
      status: 'active',
      statusText: 'Ny',
      progress: 18,
      decks: '3',
      cards: '4+',
      tools: '3',
      path: '../sam1a/',
      flashcards: '../flashcards/?subject=sam1a',
      description: 'Første semester: læringsmål, markedslikevekt, elastisitet og velferdsanalyse.'
    }, 'semester1', 30),
    withCategory({
      id: 'met1',
      code: 'MET1',
      name: 'Matematikk for økonomer',
      icon: '%',
      accent: '#06b6d4',
      status: 'active',
      statusText: 'Ny',
      progress: 22,
      decks: '3',
      cards: '4+',
      tools: '3',
      path: '../met1/',
      flashcards: '../flashcards/?subject=met1',
      description: 'Første semester: rente, nåverdi, annuitet, rekker og formelvalg.'
    }, 'semester1', 20),
    withCategory({
      id: 'kom1',
      code: 'KOM1',
      name: 'Kommunikasjon',
      icon: '✎',
      accent: '#e8bc68',
      status: 'active',
      statusText: 'Ny',
      progress: 20,
      decks: '3',
      cards: '4+',
      tools: '3',
      path: '../kom1/',
      flashcards: '../flashcards/?subject=kom1',
      description: 'Første semester: rapportstruktur, presentasjon, akademisk språk og refleksjon.'
    }, 'semester1', 50),
    withCategory({
      id: 'ret1a',
      code: 'RET1A',
      name: 'Juridiske emner',
      icon: '§',
      accent: '#3b82f6',
      status: 'exam',
      statusText: 'Eksamen',
      progress: 24,
      decks: '4',
      cards: '4+',
      tools: '3',
      path: '../ret1a/',
      flashcards: '../flashcards/?subject=ret1a',
      description: 'Første semester: avtalerett, selskapsrett, pengekrav og juridisk metode.'
    }, 'semester1', 10),
    withCategory({
      id: 'bed1',
      code: 'BED1',
      name: 'Bedriftsøkonomi',
      icon: '◆',
      accent: '#20b97a',
      status: 'exam',
      statusText: 'Eksamen',
      progress: 26,
      decks: '4',
      cards: '4+',
      tools: '3',
      path: '../bed1/',
      flashcards: '../flashcards/?subject=bed1',
      description: 'Første semester: kalkyler, resultat, investering, budsjettering og eksamenstrening.'
    }, 'semester1', 40)
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function code(value) {
    return String(value || '').toUpperCase().replace(/[\s-]+/g, '');
  }

  function selectedCodes() {
    try {
      var raw = window.localStorage.getItem('hf_enabled_subjects');
      var parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return parsed.map(code);
    } catch (e) {}
    return ['RET14', 'SOL1', 'SAM2', 'SAM3', 'MET2', 'MAT10', 'SAM1A', 'MET1', 'KOM1', 'RET1A', 'BED1'];
  }

  function getCatalog() {
    return clone(subjects).sort(sortSubjects);
  }

  function getAll() {
    var selected = selectedCodes();
    return clone(subjects.filter(function (subject) {
      return selected.indexOf(code(subject.code)) !== -1;
    })).sort(sortSubjects);
  }

  function sortSubjects(a, b) {
    return (a.categoryOrder - b.categoryOrder) || (a.sortOrder - b.sortOrder) || String(a.code).localeCompare(String(b.code));
  }

  function getCategories() {
    return clone(categories);
  }

  function groupByCategory(list) {
    var subjectsToGroup = (list || getAll()).slice().sort(sortSubjects);
    return getCategories().map(function (category) {
      return {
        id: category.id,
        label: category.label,
        shortLabel: category.shortLabel,
        subjects: subjectsToGroup.filter(function (subject) { return subject.categoryId === category.id; })
      };
    }).filter(function (group) { return group.subjects.length; });
  }

  function findById(id) {
    var needle = String(id || '').toLowerCase();
    var subject = subjects.find(function (s) {
      return s.id.toLowerCase() === needle || s.code.toLowerCase() === needle || (s.aliases || []).some(function (alias) { return alias.toLowerCase() === needle; });
    });
    return subject ? clone(subject) : null;
  }

  function getFlashcardSubjectId(id) {
    var subject = findById(id);
    return subject ? subject.id : id;
  }

  window.HaugnesSubjects = {
    getAll: getAll,
    getCatalog: getCatalog,
    getAllOriginal: getCatalog,
    getCategories: getCategories,
    groupByCategory: groupByCategory,
    findById: findById,
    getFlashcardSubjectId: getFlashcardSubjectId
  };
})(window);
