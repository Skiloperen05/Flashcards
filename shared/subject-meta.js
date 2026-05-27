(function (window) {
  var subjects = [
    {
      id: 'ret14',
      code: 'RET14',
      name: 'Skatterett',
      icon: '⚖️',
      accent: '#2f62ff',
      status: 'active',
      statusText: 'Aktiv',
      progress: 86,
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
      accent: '#20b97a',
      status: 'active',
      statusText: 'Aktiv',
      progress: 72,
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
      accent: '#f09828',
      status: 'exam',
      statusText: 'Eksamen',
      progress: 65,
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
      accent: '#ef4444',
      status: 'active',
      statusText: 'Aktiv',
      progress: 59,
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
      accent: '#7c3aed',
      status: 'build',
      statusText: 'Under bygging',
      progress: 20,
      decks: '—',
      cards: '—',
      tools: 'Plan',
      path: '#',
      flashcards: '#',
      description: 'Planlagt område for metode, statistikk og analyseoppgaver.'
    },
    {
      id: 'mat10',
      code: 'MAT10',
      name: 'Matematikk',
      icon: '∫',
      accent: '#0891b2',
      status: 'build',
      statusText: 'Under bygging',
      progress: 15,
      decks: '—',
      cards: '—',
      tools: 'Plan',
      path: '#',
      flashcards: '#',
      description: 'Planlagt område for matematikk, formler og regnetrening.'
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getAll() {
    return clone(subjects);
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
    findById: findById,
    getFlashcardSubjectId: getFlashcardSubjectId
  };
})(window);
