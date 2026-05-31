(function (window) {
  var subjects = [
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
    },
    {
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
      cards: 'Plan',
      tools: '3',
      path: '../met2/',
      flashcards: '#',
      description: 'Metode, statistikk, hypotesetesting, konfidensintervall og regresjon.'
    },
    {
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
      cards: 'Plan',
      tools: '3',
      path: '../mat10/',
      flashcards: '#',
      description: 'Analyse, lineær algebra, formler, regneøkter og eksamensdrill.'
    },
    {
      id: 'sam1a',
      code: 'SAM1A',
      name: 'Mikroøkonomi intro',
      icon: '↗',
      accent: '#f09828',
      status: 'active',
      statusText: 'Ny',
      progress: 18,
      decks: '3',
      cards: 'Plan',
      tools: '3',
      path: '../sam1a/',
      flashcards: '#',
      description: 'Første semester: læringsmål, markedslikevekt, elastisitet og velferdsanalyse.'
    },
    {
      id: 'met1',
      code: 'MET1',
      name: 'Matematikk for økonomer',
      icon: '%',
      accent: '#06b6d4',
      status: 'active',
      statusText: 'Ny',
      progress: 22,
      decks: '3',
      cards: 'Plan',
      tools: '3',
      path: '../met1/',
      flashcards: '#',
      description: 'Første semester: rente, nåverdi, annuitet, rekker og formelvalg.'
    },
    {
      id: 'kom1',
      code: 'KOM1',
      name: 'Kommunikasjon',
      icon: '✎',
      accent: '#e8bc68',
      status: 'active',
      statusText: 'Ny',
      progress: 20,
      decks: '3',
      cards: 'Plan',
      tools: '3',
      path: '../kom1/',
      flashcards: '#',
      description: 'Første semester: rapportstruktur, presentasjon, akademisk språk og refleksjon.'
    },
    {
      id: 'ret1a',
      code: 'RET1A',
      name: 'Juridiske emner',
      icon: '§',
      accent: '#3b82f6',
      status: 'exam',
      statusText: 'Eksamen',
      progress: 24,
      decks: '4',
      cards: 'Plan',
      tools: '3',
      path: '../ret1a/',
      flashcards: '#',
      description: 'Første semester: avtalerett, selskapsrett, pengekrav og juridisk metode.'
    },
    {
      id: 'bed1',
      code: 'BED1',
      name: 'Bedriftsøkonomi',
      icon: '◆',
      accent: '#20b97a',
      status: 'exam',
      statusText: 'Eksamen',
      progress: 26,
      decks: '4',
      cards: 'Plan',
      tools: '3',
      path: '../bed1/',
      flashcards: '#',
      description: 'Første semester: kalkyler, resultat, investering, budsjettering og eksamenstrening.'
    }
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
    return clone(subjects);
  }

  function getAll() {
    var selected = selectedCodes();
    return clone(subjects.filter(function (subject) {
      return selected.indexOf(code(subject.code)) !== -1;
    }));
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
    findById: findById,
    getFlashcardSubjectId: getFlashcardSubjectId
  };
})(window);
