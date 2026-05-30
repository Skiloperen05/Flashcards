(function (window) {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  var flashcardDecks = {
    sam2: [
      {
        id: 'sam2-market-failure',
        title: 'Markedssvikt og velferd',
        cards: [
          { q: 'Hva er markedssvikt?', a: 'En situasjon der markedslikevekten ikke gir samfunnsøkonomisk effektiv ressursbruk.', topic: 'markedssvikt', tag: 'Markedssvikt' },
          { q: 'Hva er en negativ eksternalitet?', a: 'En kostnad ved produksjon eller konsum som påføres andre uten å prises inn i markedet.', topic: 'markedssvikt', tag: 'Markedssvikt' },
          { q: 'Hvordan korrigerer en Pigou-skatt en negativ eksternalitet?', a: 'Skatten settes lik marginal ekstern kostnad slik at privat kostnad reflekterer samfunnskostnaden.', topic: 'virkemidler', tag: 'Virkemidler' },
          { q: 'Hva er dødvektstap?', a: 'Tapt samfunnsøkonomisk overskudd fordi mengden avviker fra effektivt nivå.', topic: 'velferd', tag: 'Velferd' },
          { q: 'Når er et gode kollektivt?', a: 'Når det er ikke-rivaliserende og vanskelig å ekskludere brukere.', topic: 'goder', tag: 'Goder' }
        ]
      },
      {
        id: 'sam2-elasticity',
        title: 'Elastisitet og markedslikevekt',
        cards: [
          { q: 'Hva måler priselastisitet?', a: 'Hvor mange prosent etterspurt mengde endres når prisen endres med én prosent.', topic: 'elastisitet', tag: 'Elastisitet' },
          { q: 'Hva betyr elastisk etterspørsel?', a: 'At absoluttverdien av priselastisiteten er større enn 1, slik at mengden reagerer relativt sterkt.', topic: 'elastisitet', tag: 'Elastisitet' },
          { q: 'Hva skjer med pris og mengde når etterspørselen øker?', a: 'Etterspørselskurven skifter mot høyre, og både likevektspris og likevektsmengde øker.', topic: 'likevekt', tag: 'Likevekt' },
          { q: 'Hva er konsumentoverskudd?', a: 'Forskjellen mellom betalingsvillighet og faktisk pris, summert for kjøperne.', topic: 'velferd', tag: 'Velferd' },
          { q: 'Hva er produsentoverskudd?', a: 'Forskjellen mellom prisen selger får og minste pris selger ville akseptert.', topic: 'velferd', tag: 'Velferd' }
        ]
      }
    ],
    sam3: [
      {
        id: 'sam3-models',
        title: 'Makromodeller',
        cards: [
          { q: 'Hva forklarer Solow-modellen?', a: 'Langsiktig vekst gjennom kapitalakkumulasjon, befolkningsvekst og teknologisk utvikling.', topic: 'solow', tag: 'Solow' },
          { q: 'Hva betyr steady state i Solow?', a: 'Et punkt der investering per arbeider akkurat dekker kapitalslitasje og kapitaluttynning.', topic: 'solow', tag: 'Solow' },
          { q: 'Hva viser IS-kurven?', a: 'Kombinasjoner av rente og produksjon der varemarkedet er i likevekt.', topic: 'is-mp', tag: 'IS-MP' },
          { q: 'Hva skjer i IS-MP ved ekspansiv pengepolitikk?', a: 'Lavere styringsrente øker etterspørselen og flytter økonomien mot høyere produksjon.', topic: 'is-mp', tag: 'IS-MP' },
          { q: 'Hva beskriver Phillipskurven?', a: 'Sammenhengen mellom aktivitetsnivå/arbeidsledighet og inflasjonspress.', topic: 'phillips', tag: 'Phillips' }
        ]
      }
    ],
    met2: [
      {
        id: 'met2-tests',
        title: 'Hypotesetesting og tolkning',
        cards: [
          { q: 'Hva er en p-verdi?', a: 'Sannsynligheten for et minst like ekstremt resultat som observert, gitt at nullhypotesen er sann.', topic: 'test', tag: 'Test' },
          { q: 'Hva betyr signifikansnivå?', a: 'Maksimal sannsynlighet for type I-feil som forskeren aksepterer før testen.', topic: 'test', tag: 'Test' },
          { q: 'Hvordan tolkes et 95% konfidensintervall?', a: 'Ved gjentatte utvalg vil omtrent 95% av slike intervaller dekke den sanne parameteren.', topic: 'ki', tag: 'KI' },
          { q: 'Hva er type I-feil?', a: 'Å forkaste en sann nullhypotese.', topic: 'feil', tag: 'Feil' },
          { q: 'Hva er type II-feil?', a: 'Å ikke forkaste en falsk nullhypotese.', topic: 'feil', tag: 'Feil' }
        ]
      }
    ],
    mat10: [
      {
        id: 'mat10-methods',
        title: 'Metodevalg i matematikk',
        cards: [
          { q: 'Hva bør sjekkes etter at den deriverte er null?', a: 'Type punkt, randpunkter og om kandidaten ligger i definisjonsområdet.', topic: 'optimering', tag: 'Optimering' },
          { q: 'Når passer substitusjon i integrasjon?', a: 'Når integranden inneholder en sammensatt funksjon og derivert av innsiden finnes i uttrykket.', topic: 'integrasjon', tag: 'Integrasjon' },
          { q: 'Hva betyr determinant lik null?', a: 'Matrisen er ikke inverterbar, og lineærsystemet kan ha ingen eller uendelig mange løsninger.', topic: 'matriser', tag: 'Matriser' },
          { q: 'Hva er elastisitet matematisk?', a: 'Prosentvis endring i en variabel relativt til prosentvis endring i en annen.', topic: 'derivasjon', tag: 'Derivasjon' }
        ]
      }
    ],
    sam1a: [
      {
        id: 'sam1a-intro',
        title: 'Marked, elastisitet og velferd',
        cards: [
          { q: 'Hva skjer når tilbudet øker?', a: 'Tilbudskurven skifter mot høyre, prisen faller og omsatt mengde øker.', topic: 'likevekt', tag: 'Likevekt' },
          { q: 'Hva er inntektselastisitet?', a: 'Hvor mange prosent etterspurt mengde endres når inntekt endres med én prosent.', topic: 'elastisitet', tag: 'Elastisitet' },
          { q: 'Hva er en bindende maksimalpris?', a: 'Et pristak under markedslikevekten som skaper etterspørselsoverskudd.', topic: 'regulering', tag: 'Regulering' },
          { q: 'Hvorfor gir skatt ofte dødvektstap?', a: 'Fordi skatten reduserer omsatt mengde under effektivt nivå.', topic: 'velferd', tag: 'Velferd' }
        ]
      }
    ],
    met1: [
      {
        id: 'met1-finance',
        title: 'Nåverdi og rente',
        cards: [
          { q: 'Hva er nåverdi?', a: 'Dagens verdi av en fremtidig kontantstrøm diskontert med relevant rente.', topic: 'nv', tag: 'Nåverdi' },
          { q: 'Hva betyr positiv netto nåverdi?', a: 'Prosjektet skaper verdi utover avkastningskravet.', topic: 'nv', tag: 'Nåverdi' },
          { q: 'Hva er en annuitet?', a: 'En serie like store betalinger med faste tidsintervaller.', topic: 'annuitet', tag: 'Annuitet' },
          { q: 'Hvorfor må rente og periode samsvare?', a: 'Fordi månedlige kontantstrømmer må diskonteres med månedlig rente, og årlige med årlig rente.', topic: 'rente', tag: 'Rente' }
        ]
      }
    ],
    kom1: [
      {
        id: 'kom1-writing',
        title: 'Rapport og presentasjon',
        cards: [
          { q: 'Hva kjennetegner en god problemstilling?', a: 'Den er avgrenset, analyserbar og styrer resten av teksten.', topic: 'rapport', tag: 'Rapport' },
          { q: 'Hva bør et analyseavsnitt inneholde?', a: 'Påstand, belegg, forklaring og kobling tilbake til problemstillingen.', topic: 'rapport', tag: 'Rapport' },
          { q: 'Hva er god slideflyt?', a: 'Én tydelig idé per slide og en rekkefølge som bygger argumentet gradvis.', topic: 'presentasjon', tag: 'Presentasjon' },
          { q: 'Hvorfor er overganger viktige?', a: 'De viser leseren hvordan avsnitt og poenger henger sammen.', topic: 'sprak', tag: 'Språk' }
        ]
      }
    ],
    ret1a: [
      {
        id: 'ret1a-method',
        title: 'Juridisk metode',
        cards: [
          { q: 'Hva er rekkefølgen i en juridisk drøftelse?', a: 'Problemstilling, rettsregel, vilkår, subsumsjon og konklusjon.', topic: 'metode', tag: 'Metode' },
          { q: 'Hvordan drøfter du flere vilkår?', a: 'Ta ett vilkår om gangen, bruk faktum konkret og lag delkonklusjon før helhetskonklusjon.', topic: 'metode', tag: 'Metode' },
          { q: 'Hva kjennetegner god subsumsjon?', a: 'At konkrete fakta kobles direkte til rettsregelens vilkår.', topic: 'subsumsjon', tag: 'Subsumsjon' },
          { q: 'Hva bør ikke komme i konklusjonen?', a: 'Nye momenter eller ny drøftelse.', topic: 'konklusjon', tag: 'Konklusjon' }
        ]
      }
    ],
    bed1: [
      {
        id: 'bed1-calculation',
        title: 'Kalkyler og beslutninger',
        cards: [
          { q: 'Hva er dekningsbidrag per enhet?', a: 'Salgspris per enhet minus variable kostnader per enhet.', topic: 'kalkyle', tag: 'Kalkyle' },
          { q: 'Hva gjør en kostnad relevant?', a: 'Den er fremtidig og forskjellig mellom alternativene.', topic: 'beslutning', tag: 'Beslutning' },
          { q: 'Hva betyr selvkost?', a: 'Direkte kostnader pluss fordelte indirekte kostnader.', topic: 'kalkyle', tag: 'Kalkyle' },
          { q: 'Hva betyr positiv netto nåverdi i BED1?', a: 'Investeringen forventes å gi avkastning over kravet.', topic: 'investering', tag: 'Investering' }
        ]
      }
    ]
  };

  var questionBank = [
    { id: 'ret14-v24-fradrag', subject: 'RET14', title: 'Fradragsrett og tilknytning', source: 'RET14 V24-stil', topic: 'Fradrag', difficulty: 'Vanskelig', minutes: 35, exam: true, prompt: 'Drøft om kostnaden kan fradragsføres. Start med oppofrelse og tilknytning, og vurder deretter spesialregler.', checklist: ['Skriv hovedregelen i sktl. § 6-1', 'Skill mellom privat og virksomhetsrelatert kostnad', 'Konkluder kort og presist'] },
    { id: 'ret14-v25-fritak', subject: 'RET14', title: 'Fritaksmetoden og lavskattland', source: 'RET14 V25-signal', topic: 'Aksjer', difficulty: 'Vanskelig', minutes: 45, exam: true, prompt: 'Vurder om utbytte eller gevinst omfattes av fritaksmetoden når selskapet er hjemmehørende i utlandet.', checklist: ['Identifiser subjekt og objekt', 'Vurder EØS/lavskattland', 'Nevn 3 %-regelen der den passer'] },
    { id: 'sam2-market-failure', subject: 'SAM2', title: 'Negativ eksternalitet', source: 'Mikro standardoppgave', topic: 'Markedssvikt', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Tegn og forklar hvorfor markedet produserer for mye når det finnes en negativ eksternalitet.', checklist: ['Tegn MPC og MSC', 'Marker markedslikevekt og effektiv mengde', 'Forklar dødvektstap'] },
    { id: 'sam2-elasticity-tax', subject: 'SAM2', title: 'Elastisitet og skattebyrde', source: 'Eksamensnær mikro', topic: 'Elastisitet', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Forklar hvordan elastisitet påvirker hvem som bærer en skatt.', checklist: ['Sammenlign relativ elastisitet', 'Vis ny pris til kjøper og selger', 'Konkluder om byrdefordeling'] },
    { id: 'sam3-is-mp-shock', subject: 'SAM3', title: 'IS-MP ved etterspørselssjokk', source: 'Makro modelløving', topic: 'IS-MP', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Analyser et negativt etterspørselssjokk med IS-MP og forklar mulig pengepolitisk respons.', checklist: ['Vis skift i IS', 'Forklar produksjon og rente', 'Drøft respons fra sentralbanken'] },
    { id: 'sam3-solow-saving', subject: 'SAM3', title: 'Sparerate i Solow', source: 'Makro modellkort', topic: 'Solow', difficulty: 'Middels', minutes: 30, exam: false, prompt: 'Forklar effekten av høyere sparerate på steady state og langsiktig vekst.', checklist: ['Tegn investering og break-even', 'Skill nivåeffekt fra vekstrate', 'Forklar overgangsdynamikk'] },
    { id: 'sol1-motivation', subject: 'SOL1', title: 'Indre og ytre motivasjon', source: 'SOL1 teorioppgave', topic: 'Motivasjon', difficulty: 'Easy', minutes: 20, exam: true, prompt: 'Drøft når ytre belønning kan styrke eller svekke motivasjon.', checklist: ['Definer indre/ytre motivasjon', 'Bruk crowding out', 'Knytt til jobbdesign'] },
    { id: 'sol1-team', subject: 'SOL1', title: 'Team og sosial loffing', source: 'SOL1 case', topic: 'Gruppe', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Analyser hvorfor et team presterer dårligere enn forventet og foreslå tiltak.', checklist: ['Identifiser sosial loffing', 'Drøft psykologisk trygghet', 'Foreslå tydelige roller og ansvar'] },
    { id: 'met2-pvalue', subject: 'MET2', title: 'P-verdi og konklusjon', source: 'MET2 metode', topic: 'Hypotesetest', difficulty: 'Easy', minutes: 15, exam: false, prompt: 'Forklar p-verdi og skriv en korrekt konklusjon ved 5 % signifikansnivå.', checklist: ['Tolk gitt H0', 'Sammenlign med alfa', 'Svar i kontekst'] },
    { id: 'mat10-optimization', subject: 'MAT10', title: 'Optimering med randpunkter', source: 'MAT10 regnedrill', topic: 'Optimering', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Finn maksimum/minimum for en funksjon på et lukket intervall.', checklist: ['Deriver og finn kritiske punkt', 'Sjekk randpunkter', 'Sammenlign funksjonsverdier'] },
    { id: 'ret1a-method', subject: 'RET1A', title: 'Avtalerettslig drøftelse', source: 'RET1A metode', topic: 'Juridisk metode', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Drøft om en avtale er bindende med tydelig regel, subsumsjon og konklusjon.', checklist: ['Formuler problemstilling', 'Ta vilkår i riktig rekkefølge', 'Bruk faktum konkret'] },
    { id: 'bed1-db', subject: 'BED1', title: 'Dekningsbidrag og kapasitet', source: 'BED1 gruppeøving', topic: 'Kalkyle', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Velg hvilket produkt som bør prioriteres når kapasiteten er begrenset.', checklist: ['Regn DB per enhet', 'Finn DB per knapp faktor', 'Skriv beslutning'] }
  ];

  var examAnalysis = {
    sam2: {
      code: 'SAM2',
      name: 'Mikroøkonomi',
      summary: 'SAM2-analysen prioriterer modelloppgaver der figur, intuisjon og velferdsforklaring henger sammen.',
      topics: [
        ['Markedssvikt', 'Eksternaliteter, kollektive goder og virkemidler.', 'Høy', 10, 'Ja'],
        ['Elastisitet', 'Tolkning, skattebyrde og inntektsvirkning.', 'Høy', 8, 'Ja'],
        ['Velferdsanalyse', 'Konsument-/produsentoverskudd og dødvektstap.', 'Høy', 8, 'Ja'],
        ['Monopol', 'Pris, mengde, profitt og regulering.', 'Middels', 6, 'Delvis'],
        ['Spillteori', 'Strategiske valg og Nash-likevekt.', 'Middels', 5, 'Delvis']
      ]
    },
    sam3: {
      code: 'SAM3',
      name: 'Makroøkonomi',
      summary: 'SAM3-analysen løfter frem modellkoblinger og forklaringsoppgaver som ofte skiller sterke svar.',
      topics: [
        ['IS-MP', 'Etterspørselssjokk, rente og produksjon.', 'Høy', 9, 'Ja'],
        ['Solow', 'Steady state, sparing og teknologisk vekst.', 'Høy', 8, 'Ja'],
        ['Phillipskurven', 'Inflasjon, ledighet og forventninger.', 'Høy', 7, 'Ja'],
        ['AS-AD', 'Kort og lang sikt ved tilbuds- og etterspørselssjokk.', 'Middels', 6, 'Delvis'],
        ['Åpen økonomi', 'Valuta, UIP og kapitalmobilitet.', 'Middels', 5, 'Delvis']
      ]
    },
    sol1: {
      code: 'SOL1',
      name: 'Organisasjonsatferd',
      summary: 'SOL1-analysen prioriterer teorier som er lette å bruke i case og drøfting.',
      topics: [
        ['Motivasjon', 'Indre/ytre motivasjon, mål og jobbdesign.', 'Høy', 9, 'Ja'],
        ['Beslutninger', 'Bias, heuristikker og gruppebeslutninger.', 'Høy', 8, 'Ja'],
        ['Grupper og team', 'Sosial loffing, psykologisk trygghet og normer.', 'Høy', 7, 'Ja'],
        ['Ledelse', 'Transformasjonsledelse, styringsledelse og destruktiv ledelse.', 'Middels', 6, 'Delvis'],
        ['Personlighet', 'Big Five, seleksjon og jobbprestasjon.', 'Middels', 5, 'Delvis']
      ]
    },
    met2: {
      code: 'MET2',
      name: 'Statistikk og metode',
      summary: 'MET2-analysen fokuserer på presis tolkning, testvalg og regresjonsspråk.',
      topics: [
        ['Hypotesetesting', 'H0/H1, testobservator, p-verdi og konklusjon.', 'Høy', 9, 'Ja'],
        ['Konfidensintervall', 'Tolkning og kobling til tester.', 'Høy', 8, 'Ja'],
        ['Regresjon', 'Koeffisienter, standardfeil og forklaringskraft.', 'Høy', 7, 'Ja'],
        ['Sannsynlighet', 'Forventning, varians og fordelinger.', 'Middels', 6, 'Delvis'],
        ['Utvalg', 'Sampling, bias og usikkerhet.', 'Middels', 5, 'Delvis']
      ]
    },
    mat10: {
      code: 'MAT10',
      name: 'Matematikk',
      summary: 'MAT10-analysen prioriterer metodevalg og regnetyper med høy poengverdi.',
      topics: [
        ['Derivasjon og optimering', 'Kritiske punkt, randpunkter og økonomisk tolkning.', 'Høy', 9, 'Ja'],
        ['Integrasjon', 'Standardintegraler, substitusjon og areal.', 'Høy', 7, 'Ja'],
        ['Lineær algebra', 'Matriser, invers og lineære systemer.', 'Høy', 7, 'Ja'],
        ['Funksjoner', 'Grenseverdier, kontinuitet og grafisk forståelse.', 'Middels', 6, 'Delvis'],
        ['Rekker', 'Geometriske rekker og anvendelser.', 'Middels', 4, 'Delvis']
      ]
    }
  };

  var noteSeeds = [
    { id: 'seed-ret14-fradrag', title: 'Fradragsrett', subject: 'RET14', tags: 'fradrag, metode', body: 'Start med hovedregelen i sktl. § 6-1. Del drøftelsen i oppofrelse og tilknytning, og vurder deretter om en spesialregel endrer resultatet.' },
    { id: 'seed-sol1-motivasjon', title: 'Motivasjon', subject: 'SOL1', tags: 'indre, ytre, jobbdesign', body: 'Skill tydelig mellom indre og ytre motivasjon. Bruk selvbestemmelsesteorien, crowding out og jobbkarakteristika-modellen i case.' },
    { id: 'seed-sam3-ismp', title: 'IS-MP', subject: 'SAM3', tags: 'modell, rente', body: 'IS viser varemarkedet, MP viser sentralbankens rentesetting. Ved sjokk: forklar først skiftet, deretter virkningen på produksjon og rente.' },
    { id: 'seed-sam2-markedssvikt', title: 'Markedssvikt', subject: 'SAM2', tags: 'eksternalitet, velferd', body: 'Ved negativ eksternalitet ligger MSC over MPC. Markedet produserer for mye, og Pigou-skatt kan korrigere ved å prise ekstern kostnad.' }
  ];

  function subjectKey(id) {
    var value = String(id || '').toLowerCase();
    if (value === 'subj_sol1') return 'sol1';
    return value;
  }

  function decksFor(id) {
    return clone(flashcardDecks[subjectKey(id)] || []);
  }

  function questions() {
    return clone(questionBank);
  }

  function analysisFor(id) {
    return clone(examAnalysis[subjectKey(id)] || null);
  }

  function notes() {
    return clone(noteSeeds);
  }

  window.HaugnesStudyData = {
    decksFor: decksFor,
    questions: questions,
    analysisFor: analysisFor,
    notes: notes
  };
})(window);
