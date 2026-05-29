(function (window) {
  var pages = {
    mat10: {
      code: 'MAT10',
      name: 'Matematikk',
      kicker: 'Analyse og lineær algebra',
      accent: '#0891b2',
      progress: '34%',
      lead: 'Formler, regneteknikk og eksamensnære økter for funksjoner, derivasjon, integrasjon, matriser og lineære systemer.',
      stats: [['6', 'kjerneområder'], ['26+', 'eksamenssett'], ['Plan', 'flashcards']],
      tools: [
        ['∫', 'Formelbank', 'Samlet oversikt over standardresultater, derivasjonsregler, integraler, matriser og typiske eksamensgrep.', 'Bygges fra MAT10-mappen', '#', '#0891b2'],
        ['ƒ', 'Regneøkter', 'Temabaserte økter for grenseverdier, optimering, lineær algebra og flervariabel analyse.', 'Klargjøres', '#', '#2f62ff'],
        ['✓', 'Eksamensdrill', 'Prioritert trening fra tidligere oppgaver og løsningsmønstre.', 'Planlagt', '#', '#e8bc68']
      ],
      topics: [['Derivasjon og optimering', 'Høy eksamensverdi', '86%'], ['Integrasjon og areal', 'Mange standardgrep', '72%'], ['Matriser og lineære systemer', 'Krever repetisjon', '68%']],
      plan: [['1. Formelbank', 'Start med regler og typiske fallgruver', '15 min'], ['2. Regneøkter', 'Løs korte oppgaver med fasitnær tenkning', '30 min'], ['3. Eksamensdrill', 'Prioriter gamle eksamensoppgaver', '45 min']],
      next: 'Bygg første komplette MAT10-kortpakke fra lokale forelesnings- og eksamensfiler.'
    },
    met2: {
      code: 'MET2',
      name: 'Statistikk og metode',
      kicker: 'Metode · andre semester',
      accent: '#7c3aed',
      progress: '28%',
      lead: 'Et samlet område for metodeforståelse, hypotesetesting, regresjon og tolkning av statistiske resultater.',
      stats: [['5', 'temaområder'], ['12+', 'oppgavetyper'], ['Plan', 'quiz']],
      tools: [
        ['Σ', 'Begrepskort', 'Forklaringer av estimator, forventning, varians, konfidensintervall, p-verdi og signifikans.', 'Klargjøres', '#', '#7c3aed'],
        ['β', 'Regresjonslab', 'Tolkning av koeffisienter, modellvalg, forutsetninger og vanlige eksamensspørsmål.', 'Planlagt', '#', '#2f62ff'],
        ['?', 'Hypotesetest-quiz', 'Korte beslutningsoppgaver der du velger test, formulerer hypoteser og tolker resultat.', 'Planlagt', '#', '#e8bc68']
      ],
      topics: [['Hypotesetesting', 'Må sitte presist', '78%'], ['Konfidensintervall', 'Standard eksamensgrep', '70%'], ['Regresjon og tolkning', 'Høy praktisk verdi', '64%']],
      plan: [['1. Begrepskort', 'Få presisjon i språk og definisjoner', '20 min'], ['2. Testvalg', 'Velg riktig metode ut fra oppgavetekst', '25 min'], ['3. Regresjon', 'Tolk output og begrunn modellvalg', '35 min']],
      next: 'Fylle MET2 med faktiske kort fra notater, forelesninger og oppgavesett.'
    },
    sam1a: {
      code: 'SAM1A',
      name: 'Mikroøkonomi intro',
      kicker: 'Første semester',
      accent: '#f09828',
      progress: '18%',
      lead: 'Grunnleggende samfunnsøkonomi med etterspørsel, tilbud, markedslikevekt, velferd og sentrale modeller fra læringsmålene.',
      stats: [['1', 'kompendium'], ['1', 'læringsmålfil'], ['Ny', 'fagside']],
      tools: [
        ['↗', 'Læringsmål', 'Gjør læringsmålene om til konkrete øvingspunkter og korte forklaringskort.', 'Basert på lokal fil', '#', '#f09828'],
        ['◒', 'Modellkort', 'Markedskryss, elastisitet, overskudd og skift forklart som kort og minioppgaver.', 'Planlagt', '#', '#2f62ff'],
        ['✓', 'Eksamenstrening', 'Prioritert oppgavetrening når gamle oppgaver og egne notater er strukturert.', 'Planlagt', '#', '#e8bc68']
      ],
      topics: [['Markedslikevekt', 'Kjerne i faget', '82%'], ['Elastisitet', 'Regne- og tolkningsoppgaver', '70%'], ['Velferdsanalyse', 'Modellforståelse', '62%']],
      plan: [['1. Læringsmål', 'Oversett hvert mål til spørsmål', '20 min'], ['2. Modellkort', 'Tegn og forklar standardskift', '25 min'], ['3. Oppgaver', 'Koble kort til eksamensstil', '30 min']],
      sources: [
        ['Læringsmålene.docx', 'Etikk, standard økonomisk teori, atferdsøkonomi, markedssvikt, samfunnsansvar, ulikhet og tillit.'],
        ['Kompendium SAM1A', 'Brukes som kilde for å bygge kort rundt sentrale begreper, modeller og diskusjonsoppgaver.'],
        ['Neste import', 'Første kortpakke bør starte med fullkomne markeder, kilder til markedssvikt og etisk teori.']
      ],
      next: 'Importere læringsmål og kompendium til kortpakker.'
    },
    met1: {
      code: 'MET1',
      name: 'Matematikk for økonomer',
      kicker: 'Første semester',
      accent: '#06b6d4',
      progress: '22%',
      lead: 'Nåverdi, rente, rekker og grunnleggende metode samlet i en rolig treningsside for første semester.',
      stats: [['2', 'lokale filer'], ['NNV', 'hovedtema'], ['Ny', 'fagside']],
      tools: [
        ['%', 'Rente og NNV', 'Kort og oppgaver for nåverdi, sluttverdi, annuitet og effektiv rente.', 'Basert på lokale notater', '#', '#06b6d4'],
        ['∑', 'Rekker', 'Geometriske rekker og økonomiske anvendelser med små regnedriller.', 'Planlagt', '#', '#2f62ff'],
        ['✓', 'Metodekort', 'Fremgangsmåter som hjelper deg å velge riktig formel raskt.', 'Planlagt', '#', '#e8bc68']
      ],
      topics: [['Nåverdi', 'Svært sentralt', '88%'], ['Annuitet', 'Typisk eksamen', '76%'], ['Effektiv rente', 'Presis formelbruk', '66%']],
      plan: [['1. Formelvalg', 'Kjenn igjen oppgavetypen', '15 min'], ['2. NNV-oppgaver', 'Regn korte sett', '30 min'], ['3. Feilbank', 'Samle vanlige glipper', '10 min']],
      sources: [
        ['MET1 NNV og rente', 'Lokale oppgaver samler høst/vår-sett fra 2018-2023 og gir et naturlig grunnlag for regnedrill.'],
        ['Python-notater', 'Små lokale regnefiler peker mot automatiserte fasit- og kontrolloppgaver senere.'],
        ['Neste import', 'Lag først kort for NNV, sluttverdi, annuitet og effektiv rente.']
      ],
      next: 'Bygge kort fra MET1 NNV- og renteoppgaver.'
    },
    kom1: {
      code: 'KOM1',
      name: 'Kommunikasjon',
      kicker: 'Første semester',
      accent: '#e8bc68',
      progress: '20%',
      lead: 'Skriving, presentasjon og akademisk kommunikasjon basert på rapporter, refleksjonstekster og presentasjonsmateriale.',
      stats: [['7', 'lokale dokumenter'], ['Rapport', 'hovedprodukt'], ['Ny', 'fagside']],
      tools: [
        ['✎', 'Rapportmal', 'Strukturer problemstilling, analyse, drøfting og konklusjon fra tidligere innleveringer.', 'Klargjøres', '#', '#e8bc68'],
        ['▣', 'Presentasjon', 'Kort for dramaturgi, slideflyt og muntlig formidling.', 'Planlagt', '#', '#2f62ff'],
        ['✓', 'Språkdrill', 'Presise formuleringer, overganger og akademisk tone.', 'Planlagt', '#', '#20b97a']
      ],
      topics: [['Problemstilling', 'Må være skarp', '78%'], ['Rapportstruktur', 'Avgjørende for flyt', '74%'], ['Presentasjon', 'Muntlig levering', '63%']],
      plan: [['1. Struktur', 'Lag disposisjon før skriving', '20 min'], ['2. Belegg', 'Koble på kilder og data', '25 min'], ['3. Språk', 'Stram inn formuleringer', '15 min']],
      sources: [
        ['Strømprisrapport', 'Rapporten om NO2, Tyskland, NordLink, volatilitet og energimiks gir konkret skrive- og analysegrunnlag.'],
        ['Presentasjoner', 'Individuell presentasjon og gruppeoppgave kan bli korte kort for muntlig struktur og slideflyt.'],
        ['Neste import', 'Bygg skrivekort for problemstilling, analyseavsnitt, kildebruk og konklusjon.']
      ],
      next: 'Lage skrivekort fra KOM1-innleveringene.'
    },
    ret1a: {
      code: 'RET1A',
      name: 'Juridiske emner',
      kicker: 'Første semester',
      accent: '#3b82f6',
      progress: '24%',
      lead: 'Avtalerett, selskapsrett, pengekrav og eksamensdrøfting samlet i én fagside med juridisk metode i sentrum.',
      stats: [['14+', 'eksamensfiler'], ['4', 'teoriområder'], ['Ny', 'fagside']],
      tools: [
        ['§', 'Juridisk metode', 'Tren på vilkår, rettsregel, subsumsjon og konklusjon i korte kort.', 'Klargjøres', '#', '#3b82f6'],
        ['⚖', 'Eksamensbank', 'Gamle eksamensoppgaver sortert etter tema og drøftingstype.', 'Planlagt', '#', '#e8bc68'],
        ['✓', 'Teorioppgaver', 'Selskapsrett, pengekrav og gjeldsinndrivelse gjort om til øvingskort.', 'Planlagt', '#', '#20b97a']
      ],
      topics: [['Avtalerett', 'Hyppig eksamenstema', '80%'], ['Pengekrav', 'Vilkårsdrøfting', '72%'], ['Selskapsrett', 'Teori og anvendelse', '62%']],
      plan: [['1. Rettsregel', 'Memorer vilkår og unntak', '20 min'], ['2. Subsumsjon', 'Bruk faktum aktivt', '30 min'], ['3. Konklusjon', 'Skriv presist og kort', '10 min']],
      sources: [
        ['Selskapsrett', 'Lokal teorioppgave sammenligner aksjeselskap og ansvarlig selskap med ansvar, kapital, ledelse, uttak og skatt.'],
        ['Eksamensøving', 'Gamle eksamensfiler fra 2016-2025 gir et godt grunnlag for juridisk metode og disposisjon.'],
        ['Neste import', 'Lag kort for vilkår, lovhjemler, subsumsjon og typiske delkonklusjoner.']
      ],
      next: 'Strukturere RET1A-eksamensøving og teorioppgaver.'
    },
    bed1: {
      code: 'BED1',
      name: 'Bedriftsøkonomi',
      kicker: 'Første semester',
      accent: '#20b97a',
      progress: '26%',
      lead: 'Resultat, kalkyler, investering, budsjettering og eksamensoppgaver samlet som første-semester økonomitrening.',
      stats: [['18+', 'eksamensfiler'], ['4', 'gruppeøvinger'], ['Ny', 'fagside']],
      tools: [
        ['◆', 'Kalkylekort', 'Produktkalkulasjon, relevante kostnader og kostnadsforløp som korte beslutningskort.', 'Klargjøres', '#', '#20b97a'],
        ['▥', 'Regnskapsdrill', 'Resultatberegning, beholdningsendringer og nøkkelforståelse.', 'Planlagt', '#', '#2f62ff'],
        ['✓', 'Eksamensløp', 'Gamle eksamener fra lokale filer prioritert etter tema.', 'Planlagt', '#', '#e8bc68']
      ],
      topics: [['Produktkalkulasjon', 'Svært eksamensnært', '84%'], ['Investering', 'Regning og vurdering', '73%'], ['Budsjettering', 'Helhetsforståelse', '65%']],
      plan: [['1. Begreper', 'Skill mellom kostnadstyper', '15 min'], ['2. Regnedrill', 'Løs korte standardoppgaver', '35 min'], ['3. Eksamen', 'Tren på gamle sett', '45 min']],
      sources: [
        ['Gruppeøving uke 39', 'Lokale notater dekker bidragskalkyle, selvkost, ABC-kalkyle, ledig kapasitet og dekningsbidrag.'],
        ['Eksamensfiler', 'BED1-mappen har eksamener fra 2016-2025 og flere gruppeøvinger som kan sorteres etter tema.'],
        ['Neste import', 'Start med kalkylekort og korte regnedriller før full eksamensbank bygges.']
      ],
      next: 'Bygge BED1-kort fra eksamens- og gruppeøvingsfilene.'
    }
  };

  window.HaugnesSubjectPages = {
    get: function (id) {
      return pages[String(id || '').toLowerCase()] || null;
    }
  };
})(window);
