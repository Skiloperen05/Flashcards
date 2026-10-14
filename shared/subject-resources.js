(function (window) {
  'use strict';

  var typeLabels = {
    kompendium: 'Kompendium',
    formelark: 'Formelark',
    eksamen: 'Eksamen',
    memoar: 'Memoar',
    a_besvarelse: 'A-besvarelse',
    sensorveiledning: 'Sensorveiledning',
    annet: 'Annet'
  };

  var resources = {
    ret14: [
      { type: 'kompendium', title: 'Pensumoversikt', description: 'Interaktiv oversikt over skatteregler, lovhjemler og typiske eksamensfeller.', status: 'available', href: '../ret14/pensum/' },
      { type: 'eksamen', title: 'Eksamensradar', description: 'Analyse av tidligere RET14-eksamener og temaer som går igjen.', status: 'available', href: '../ret14/eksamen/' },
      { type: 'a_besvarelse', title: 'A-besvarelser', description: 'Beskyttet eksamensarkiv. Vises via brukerområdet når tilgang og filer er klare.', status: 'available', href: '../user/a-besvarelser.html#/ret14' }
    ],
    subj_sol1: [
      { type: 'kompendium', title: 'Teorier, modeller og begreper', description: 'Samlet SOL1-side for teorier, modeller og begreper.', status: 'available', href: '../sol1/teorier-modeller-begreper-flashcards.html' },
      { type: 'eksamen', title: 'Teoriskriving', description: 'Ressurs for å øve på teoridel og struktur i skriftlige svar.', status: 'available', href: '../sol1/teorideler-teoriskriving.html' },
      { type: 'a_besvarelse', title: 'A-besvarelser', description: 'Kobles til beskyttet eksamensarkiv når dokumentene er klare for deling.', status: 'coming', href: '../user/a-besvarelser.html#/sol1' }
    ],
    sam2: [
      { type: 'memoar', title: 'SAM2 memoar', description: 'To korte startmemoarer om forventninger til faget og hvordan du bør jobbe mot eksamen.', status: 'available', href: '../sam2/memoar/' },
      { type: 'eksamen', title: 'Eksamensradar', description: 'Prioritering av mikrotemaer, oppgavetyper og modellvalg.', status: 'available', href: '../sam2/eksamen/' },
      { type: 'kompendium', title: 'Oppgaver og figurer', description: 'Oppgaveprioritering og klikkbar oppgavetrening.', status: 'available', href: '../sam2/oppgaver-klikkbar/' },
      { type: 'a_besvarelse', title: 'A-besvarelser', description: 'Kobles til beskyttet eksamensarkiv når dokumentene er klare for deling.', status: 'coming', href: '../user/a-besvarelser.html#/sam2' }
    ],
    sam3: [
      { type: 'formelark', title: 'Formelark', description: 'Formler og makromodeller samlet for rask repetisjon.', status: 'available', href: '../sam3/formelark.html' },
      { type: 'kompendium', title: 'Sentrale modeller', description: 'Solow, Romer, IS-MP, Phillips, AS-AD og åpen økonomi.', status: 'available', href: '../sam3/sentrale-modeller.html' },
      { type: 'eksamen', title: 'Eksamensradar', description: 'Makroøkonomiske temaer og modellkoblinger fra tidligere eksamener.', status: 'available', href: '../sam3/eksamensradar-v3.html' },
      { type: 'a_besvarelse', title: 'SAM3 V26-pakke', description: 'Eksamen, A-besvarelse og sensorveiledning ligger i beskyttet eksamensarkiv.', status: 'available', href: '../user/a-besvarelser.html#/sam3/v26' }
    ],
    met2: [
      { type: 'kompendium', title: 'Metodekompendium', description: 'Plass for samlet metodeoversikt fra notater, forelesning og oppgaver.', status: 'coming' },
      { type: 'formelark', title: 'Test- og regresjonsark', description: 'Standardtester, konfidensintervall og regresjonstolkning.', status: 'coming' },
      { type: 'eksamen', title: 'Eksamensoppgaver', description: 'Kobles til oppgavebank og Canvas-funn når materialet er strukturert.', status: 'coming', href: '../user/oppgavebank.html?subject=MET2' }
    ],
    mat10: [
      { type: 'formelark', title: 'Formelbank', description: 'Derivasjon, integrasjon, matriser og økonomisk tolkning.', status: 'coming' },
      { type: 'eksamen', title: 'Eksamensdrill', description: 'Oppgaver og metodevalg samles i oppgavebanken.', status: 'available', href: '../user/oppgavebank.html?subject=MAT10' },
      { type: 'a_besvarelse', title: 'A-besvarelser', description: 'Kobles til beskyttet eksamensarkiv når dokumentene er klare for deling.', status: 'coming', href: '../user/a-besvarelser.html#/mat10' }
    ],
    // first-semester:start (generated)
    bed1: [
      {
        "type": "memoar",
        "title": "Memoar BED1",
        "description": "Faget jeg ville brukt mest tid på i første semester. Kunnskapen om budsjett, regnskap og bedriftsøkonomiske beslutninger følger deg videre i studiet.",
        "status": "available",
        "href": "../bed1/#memo"
      },
      {
        "type": "a_besvarelse",
        "title": "A-besvarelse BED1 H25",
        "description": "Høsten 2025",
        "status": "available",
        "href": "../bed1/eksamenspakker/h25/bed1-a-besvarelse-h25.pdf"
      },
      {
        "type": "eksamen",
        "title": "Eksamensoppgave BED1 H25",
        "description": "Høsten 2025",
        "status": "available",
        "href": "../bed1/eksamenspakker/h25/bed1-eksamen-h25.pdf"
      },
      {
        "type": "annet",
        "title": "Løsningsforslag BED1 H25",
        "description": "Høsten 2025",
        "status": "available",
        "href": "../bed1/eksamenspakker/h25/bed1-losning-h25.pdf"
      }
    ],
    ret1a: [
      {
        "type": "memoar",
        "title": "Memoar RET1A",
        "description": "Et omfattende første møte med forretningsjuss. I memoaret trekker jeg særlig frem avtalerett, dispositive utsagn og grunnleggende skatterett.",
        "status": "available",
        "href": "../ret1a/#memo"
      },
      {
        "type": "a_besvarelse",
        "title": "A-besvarelse RET1A H25",
        "description": "Høsten 2025",
        "status": "available",
        "href": "../ret1a/eksamenspakker/h25/ret1a-a-besvarelse-h25.pdf"
      },
      {
        "type": "sensorveiledning",
        "title": "Sensorveiledning RET1A H25",
        "description": "Høsten 2025",
        "status": "available",
        "href": "../ret1a/eksamenspakker/h25/ret1a-sensorveiledning-h25.doc"
      }
    ],
    met1: [
      {
        "type": "memoar",
        "title": "Memoar MET1",
        "description": "Det første møtet med økonomisk matematikk. Jeg opplevde mye av pensum som kjent fra R1, men eksamen kunne by på uventede vridninger.",
        "status": "available",
        "href": "../met1/#memo"
      }
    ],
    sam1a: [
      {
        "type": "memoar",
        "title": "Memoar SAM1A",
        "description": "Begreper, eksperimenter og atferdsøkonomi. Flashcards hjalp meg å huske stoffet, men på eksamen måtte jeg også kunne utdype temaene.",
        "status": "available",
        "href": "../sam1a/#memo"
      }
    ],
    kom1: [
      {
        "type": "memoar",
        "title": "Memoar KOM1",
        "description": "Mitt råd er å levere det obligatoriske og bruke mesteparten av tiden på de andre fagene. I mitt semester var vurderingen godkjent / ikke godkjent, uten eksamen.",
        "status": "available",
        "href": "../kom1/#memo"
      }
    ]
    // first-semester:end
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function key(value) {
    var id = String(value || '').toLowerCase();
    if (id === 'sol1') return 'subj_sol1';
    return id;
  }

  function forSubject(id) {
    return clone(resources[key(id)] || []);
  }

  window.HaugnesSubjectResources = {
    typeLabels: clone(typeLabels),
    forSubject: forSubject
  };
})(window);
