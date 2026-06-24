(function (window) {
  var pages = {
    mat10: {
      code: 'MAT10',
      name: 'Matematikk',
      kicker: 'Analyse og lineær algebra',
      accent: '#0891b2',
      progress: '34%',
      lead: 'Formler, regneteknikk og eksamensnære økter for funksjoner, derivasjon, integrasjon, matriser og lineære systemer.',
      stats: [['6', 'kjerneområder'], ['26+', 'eksamenssett'], ['Aktiv', 'flashcards']],
      tools: [
        ['∫', 'Formelbank', 'Samlet oversikt over standardresultater, derivasjonsregler, integraler, matriser og typiske eksamensgrep.', 'Klar', '#formelark', '#0891b2'],
        ['ƒ', 'Regneøkter', 'Temabaserte økter for grenseverdier, optimering, lineær algebra og flervariabel analyse.', 'Oppgaver', '../user/oppgavebank.html?subject=MAT10', '#2f62ff'],
        ['✓', 'Flashcards', 'Korte metodekort for optimering, integrasjon, matriser og økonomisk tolkning.', 'Kort', '../flashcards/?subject=mat10', '#e8bc68']
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
      stats: [['5', 'temaområder'], ['12+', 'oppgavetyper'], ['Aktiv', 'oppgaver']],
      tools: [
        ['Σ', 'Begrepskort', 'Forklaringer av estimator, forventning, varians, konfidensintervall, p-verdi og signifikans.', 'Kort', '../flashcards/?subject=met2', '#7c3aed'],
        ['β', 'Regresjonslab', 'Tolkning av koeffisienter, modellvalg, forutsetninger og vanlige eksamensspørsmål.', 'Oppgaver', '../user/oppgavebank.html?subject=MET2&topic=Regresjon', '#2f62ff'],
        ['?', 'Hypotesetest-quiz', 'Korte beslutningsoppgaver der du velger test, formulerer hypoteser og tolker resultat.', 'Oppgaver', '../user/oppgavebank.html?subject=MET2&topic=Hypotesetest', '#e8bc68']
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
        ['↗', 'Læringsmål', 'Gjør læringsmålene om til konkrete øvingspunkter og korte forklaringskort.', 'Kort', '../flashcards/?subject=sam1a', '#f09828'],
        ['◒', 'Modellkort', 'Markedskryss, elastisitet, overskudd og skift forklart som kort og minioppgaver.', 'Hurtigkort', '#hurtigkort', '#2f62ff'],
        ['✓', 'Eksamenstrening', 'Prioritert oppgavetrening fra tidligere oppgaver og typiske grunnkursgrep.', 'Oppgaver', '../user/oppgavebank.html?subject=SAM1A', '#e8bc68']
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
        ['%', 'Rente og NNV', 'Kort og oppgaver for nåverdi, sluttverdi, annuitet og effektiv rente.', 'Kort', '../flashcards/?subject=met1', '#06b6d4'],
        ['∑', 'Rekker', 'Geometriske rekker og økonomiske anvendelser med små regnedriller.', 'Metoder', '#formelark', '#2f62ff'],
        ['✓', 'Metodekort', 'Fremgangsmåter som hjelper deg å velge riktig formel raskt.', 'Oppgaver', '../user/oppgavebank.html?subject=MET1', '#e8bc68']
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
        ['✎', 'Rapportmal', 'Strukturer problemstilling, analyse, drøfting og konklusjon fra tidligere innleveringer.', 'Kompendium', '#kompendium', '#e8bc68'],
        ['▣', 'Presentasjon', 'Kort for dramaturgi, slideflyt og muntlig formidling.', 'Kort', '../flashcards/?subject=kom1', '#2f62ff'],
        ['✓', 'Språkdrill', 'Presise formuleringer, overganger og akademisk tone.', 'Oppgaver', '../user/oppgavebank.html?subject=KOM1', '#20b97a']
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
        ['§', 'Juridisk metode', 'Tren på vilkår, rettsregel, subsumsjon og konklusjon i korte kort.', 'Kort', '../flashcards/?subject=ret1a', '#3b82f6'],
        ['⚖', 'Eksamensbank', 'Gamle eksamensoppgaver sortert etter tema og drøftingstype.', 'Oppgaver', '../user/oppgavebank.html?subject=RET1A', '#e8bc68'],
        ['✓', 'Teorioppgaver', 'Selskapsrett, pengekrav og gjeldsinndrivelse gjort om til øvingskort.', 'Hurtigkort', '#hurtigkort', '#20b97a']
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
        ['◆', 'Kalkylekort', 'Produktkalkulasjon, relevante kostnader og kostnadsforløp som korte beslutningskort.', 'Kort', '../flashcards/?subject=bed1', '#20b97a'],
        ['▥', 'Regnskapsdrill', 'Resultatberegning, beholdningsendringer og nøkkelforståelse.', 'Oppgaver', '../user/oppgavebank.html?subject=BED1', '#2f62ff'],
        ['✓', 'Eksamensløp', 'Gamle eksamener fra lokale filer prioritert etter tema.', 'Radar', '#eksamensradar', '#e8bc68']
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

  pages.mat10.compendium = [
    ['Kjerneformler', 'Derivasjon, integrasjon, elastisitet, matriser og lineære systemer samlet som hurtigoversikt.', 'Formel først'],
    ['Oppgavetyper', 'Gjenkjenning av optimering, areal, Taylor-intuisjon, nivåkurver og matriseoperasjoner.', 'Velg metode'],
    ['Feilbank', 'Fortegn, parenteser, enheter og vilkår for optimum gjøres om til korte kontrollspørsmål.', 'Sjekk før svar']
  ];
  pages.mat10.examRadar = {
    label: 'Regnetunge temaer',
    summary: 'MAT10-radaren prioriterer oppgavetyper som ofte avgjør poeng: riktig metodevalg, ryddig algebra og kontroll av svar.',
    accent: '#0891b2',
    rows: [['Derivasjon og optimering', 'Standard startpunkt for mange eksamensoppgaver.', '88%'], ['Integrasjon', 'Mye poeng på teknikk og tolkning.', '74%'], ['Lineær algebra', 'Matriser og systemer må sitte mekanisk.', '70%']]
  };
  pages.mat10.formulaSheet = [
    ['Derivasjonsregler', 'Produkt, kvotient, kjede, implisitt og elastisitet.', 'MAT10'],
    ['Integraler', 'Standardintegraler, substitusjon og delvis integrasjon.', 'MAT10'],
    ['Matriser', 'Determinant, invers, rang og løsning av lineære systemer.', 'MAT10']
  ];
  pages.mat10.practice = {
    label: 'Metodevalg',
    intro: 'Tre korte kontrollkort før du går inn i regneoppgaver.',
    cards: [
      ['Optimering', 'Hva må sjekkes etter at den deriverte er null?', 'Tenk både kandidat og type punkt.', 'Andrederivert, randpunkter og om punktet faktisk er maksimum/minimum i definisjonsområdet.', 'Svar med metode, ikke bare tall.'],
      ['Integral', 'Når er substitusjon ofte riktig grep?', 'Se etter indre funksjon og derivert faktor.', 'Når integranden har en sammensatt funksjon der deriverten av innsiden også finnes i uttrykket.', 'Kjenn igjen mønster før du regner.'],
      ['Matrise', 'Hva betyr det hvis determinanten er null?', 'Koble til invers og løsning.', 'Matrisen er ikke inverterbar; lineærsystemet kan ha ingen eller uendelig mange løsninger.', 'Skriv konsekvensen for oppgaven.']
    ]
  };
  pages.mat10.examChecklist = [
    ['Før regning', 'Skriv hvilken metode du bruker og hvorfor den passer.', 'Start'],
    ['Underveis', 'Hold orden på fortegn, parenteser og definisjonsområde.', 'Kontroll'],
    ['Til slutt', 'Tolk svaret i ord og sjekk rimelighet.', 'Svar']
  ];

  pages.met2.compendium = [
    ['Statistisk begrepskart', 'Utvalg, estimator, forventning, varians, standardfeil og samplingfordeling.', 'Begrep'],
    ['Testflyt', 'Fra problemtekst til H0/H1, testobservator, kritisk verdi, p-verdi og konklusjon.', 'Metode'],
    ['Regresjonstolkning', 'Koeffisienter, konfidensintervall, forklaringsgrad og forutsetninger samlet i en fast mal.', 'Output']
  ];
  pages.met2.examRadar = {
    label: 'Tolkning og testvalg',
    summary: 'MET2-radaren legger mest vekt på temaer som krever presist språk i tillegg til regning.',
    accent: '#7c3aed',
    rows: [['Hypotesetesting', 'Velge test og konkludere uten å blande nivåer.', '82%'], ['Konfidensintervall', 'Tolkning, standardfeil og sammenheng med test.', '74%'], ['Regresjon', 'Forklare output, koeffisienter og usikkerhet.', '68%']]
  };
  pages.met2.formulaSheet = [
    ['Forventning og varians', 'Regneregler for snitt, summer og lineærtransformasjoner.', 'MET2'],
    ['Testobservatorer', 'Z, t, andel, differanser og enkel beslutningsregel.', 'MET2'],
    ['Regresjon', 'Koeffisienttolkning, standardfeil, t-verdi og prediksjon.', 'MET2']
  ];
  pages.met2.practice = {
    label: 'Begrep til tolkning',
    intro: 'Kortene trener presis formulering, som ofte er forskjellen på nesten riktig og helt riktig.',
    cards: [
      ['P-verdi', 'Hva er en p-verdi i én setning?', 'Ikke si sannsynligheten for at H0 er sann.', 'Sannsynligheten for å få et minst like ekstremt resultat som observert, gitt at nullhypotesen er sann.', 'Bruk alltid betingelsen: gitt H0.'],
      ['KI', 'Hva betyr et 95% konfidensintervall?', 'Tolk metoden, ikke akkurat dette intervallet.', 'Ved gjentatte utvalg vil omtrent 95% av intervallene laget på samme måte dekke den sanne parameteren.', 'Unngå “95% sannsynlighet for parameteren”.'],
      ['Regresjon', 'Hvordan tolker du en koeffisient?', 'Hold alt annet konstant.', 'For én enhets økning i X forventes Y å endres med koeffisienten, alt annet likt.', 'Nevn enhet og fortegn.']
    ]
  };
  pages.met2.examChecklist = [
    ['Hypoteser', 'Formuler H0 og H1 med parameter og retning.', 'Start'],
    ['Testvalg', 'Begrunn test ut fra data, design og antakelser.', 'Metode'],
    ['Konklusjon', 'Svar i kontekst, ikke bare forkast/ikke forkast.', 'Svar']
  ];

  pages.sam1a.compendium = [
    ['Markedet', 'Tilbud, etterspørsel, likevekt, overskudd og hvordan skift forklares i tekst og figur.', 'Modell'],
    ['Velferd', 'Konsumentoverskudd, produsentoverskudd, effektivitet og dødvektstap.', 'Analyse'],
    ['Markedssvikt', 'Eksternaliteter, kollektive goder, asymmetrisk informasjon og mulige virkemidler.', 'Drøfting']
  ];
  pages.sam1a.examRadar = {
    label: 'Modell og forklaring',
    summary: 'SAM1A-radaren prioriterer temaer der du må kombinere figur, begrep og kort drøfting.',
    accent: '#f09828',
    rows: [['Markedslikevekt', 'Tegn, forklar og tolk endringer i likevekt.', '84%'], ['Elastisitet', 'Regning og økonomisk tolkning av respons.', '72%'], ['Markedssvikt', 'Koble teori til virkemidler og velferdseffekt.', '68%']]
  };
  pages.sam1a.formulaSheet = [
    ['Elastisitet', 'Pris-, inntekts- og krysspriselastisitet med tolkning.', 'SAM1A'],
    ['Overskudd', 'Arealtenkning for konsument- og produsentoverskudd.', 'SAM1A'],
    ['Dødvektstap', 'Trekantlogikk ved skatt, regulering og eksternaliteter.', 'SAM1A']
  ];
  pages.sam1a.canvasMaterials = [
    ['Canvas-eksamener funnet', 'Lokale course export-filer inneholder SAM1A eksamen H24, H24 gjentak og V25 gjentak.', 'Eksamener'],
    ['Kompendium funnet', 'Kompendium SAM1A ligger både i NHH-mappen og Downloads og kan brukes som hovedkilde for kort.', 'Kompendium'],
    ['Læringsmål funnet', 'Læringsmålfilen gir struktur for hvilke begreper og drøftinger som bør prioriteres.', 'Mål']
  ];
  pages.sam1a.practice = {
    label: 'Figur og begrep',
    intro: 'Hurtigkort for standard mikroresonnementer.',
    cards: [
      ['Likevekt', 'Hva skjer med pris og mengde hvis etterspørselen øker?', 'Tenk skift i etterspørselskurven.', 'Etterspørselskurven skifter mot høyre; både likevektspris og likevektsmengde øker.', 'Forklar med figur i eksamenssvar.'],
      ['Elastisitet', 'Hva betyr priselastisitet under -1?', 'Se på absoluttverdi.', 'Etterspørselen er elastisk: mengden reagerer relativt mer enn prisen.', 'Koble til inntektsvirkning.'],
      ['Markedssvikt', 'Hvorfor gir negativ eksternalitet for høy mengde?', 'Privat kostnad er lavere enn samfunnskostnad.', 'Markedet tar ikke inn ekstern kostnad, så likevektsmengden blir høyere enn samfunnsøkonomisk effektiv mengde.', 'Vis MSC over MPC.']
    ]
  };
  pages.sam1a.examChecklist = [
    ['Figur', 'Tegn akser, kurver, skift og ny likevekt tydelig.', 'Start'],
    ['Forklaring', 'Skriv mekanismen bak skiftet før du konkluderer.', 'Drøft'],
    ['Velferd', 'Nevn overskudd, effektivitet eller dødvektstap når relevant.', 'Poeng']
  ];

  pages.met1.compendium = [
    ['Rente og tid', 'Sluttverdi, nåverdi, effektiv rente og sammenheng mellom perioder.', 'Finansmatte'],
    ['Annuitet', 'Fast betaling, restverdi, lån og investeringer med riktig tidsskala.', 'Regning'],
    ['Rekker', 'Geometriske rekker og økonomisk bruk i kontantstrømmer.', 'Metode']
  ];
  pages.met1.examRadar = {
    label: 'Formelvalg',
    summary: 'MET1-radaren er laget rundt raske valg: hvilken kontantstrøm, hvilken rente og hvilket tidspunkt.',
    accent: '#06b6d4',
    rows: [['Nåverdi', 'Kjernen i investering, lån og kontantstrømmer.', '90%'], ['Annuitet', 'Høy sannsynlighet for regneoppgaver.', '80%'], ['Effektiv rente', 'Typisk kilde til små men dyre feil.', '70%']]
  };
  pages.met1.formulaSheet = [
    ['Nåverdi', 'PV = FV / (1 + r)^n og sum av diskonterte kontantstrømmer.', 'MET1'],
    ['Sluttverdi', 'FV = PV(1 + r)^n med periodetilpasning.', 'MET1'],
    ['Annuitet', 'Fast terminbeløp, annuitetsfaktor og restgjeld.', 'MET1']
  ];
  pages.met1.canvasMaterials = [
    ['NNV-oppgaver funnet', 'MET1 NNV og rente finnes som PDF/DOCX og inneholder eksamensnære rente- og nåverdioppgaver.', 'Oppgaver'],
    ['Python-filer funnet', 'Lokale småprogrammer kan senere brukes til fasitkontroll og automatisk regnedrill.', 'Fasit'],
    ['Prioritert import', 'Start med oppgavetyper for NNV, sluttverdi, annuitet og effektiv rente.', 'Neste']
  ];
  pages.met1.practice = {
    label: 'Finansmatte',
    intro: 'Tre kort som trener formelvalg før kalkulatoren kommer frem.',
    cards: [
      ['NNV', 'Når bruker du nåverdi i stedet for sluttverdi?', 'Tenk tidspunkt for sammenligning.', 'Når kontantstrømmer på ulike tidspunkter skal sammenlignes i dag eller mot en investering nå.', 'Diskonter alle beløp til samme tidspunkt.'],
      ['Annuitet', 'Hva kjennetegner en annuitet?', 'Se på betalingene.', 'Like store betalinger med fast intervall over flere perioder.', 'Pass på om betaling skjer forskuddsvis eller etterskuddsvis.'],
      ['Rente', 'Hva er vanlig feil ved effektiv rente?', 'Perioder må matche renten.', 'Å blande periode- og årsrente eller bruke feil antall kapitaliseringer.', 'Gjør rente og periode konsistente først.']
    ]
  };
  pages.met1.examChecklist = [
    ['Tidslinje', 'Tegn tidspunkt og plasser alle kontantstrømmer.', 'Start'],
    ['Rente', 'Sjekk at rente og periode er i samme enhet.', 'Kontroll'],
    ['Svar', 'Oppgi enhet, tidspunkt og avrunding.', 'Svar']
  ];

  pages.kom1.compendium = [
    ['Rapportstruktur', 'Problemstilling, metode, analyse, drøfting og konklusjon som fast skriveflyt.', 'Skriving'],
    ['Argumentasjon', 'Påstand, belegg, forklaring og overgang mellom avsnitt.', 'Tekst'],
    ['Presentasjon', 'Åpning, hovedpoeng, slideøkonomi og muntlig avslutning.', 'Muntlig']
  ];
  pages.kom1.examRadar = {
    label: 'Vurderingskriterier',
    summary: 'KOM1-radaren er ikke en regneradar, men en prioritering av skrive- og formidlingsgrep som løfter innleveringer.',
    accent: '#e8bc68',
    rows: [['Problemstilling', 'Må være presis nok til å styre hele teksten.', '82%'], ['Drøfting', 'Knytte funn, kilder og egne vurderinger sammen.', '76%'], ['Språk og struktur', 'Flyt, presisjon og akademisk tone.', '72%']]
  };
  pages.kom1.canvasMaterials = [
    ['Rapport og presentasjoner funnet', 'KOM1 individuell presentasjon, gruppepresentasjon og strømprisrapport finnes lokalt.', 'Innlevering'],
    ['Forelesningsmateriell funnet', 'KOM1 Forelesning 5 og annen skrive-/presentasjonsstøtte ligger i Downloads.', 'Forelesning'],
    ['Prioritert import', 'Bygg maler for problemstilling, analyseavsnitt, konklusjon og muntlig overgang.', 'Neste']
  ];
  pages.kom1.practice = {
    label: 'Skrivegrep',
    intro: 'Hurtigkortene trener formuleringer og struktur før innlevering.',
    cards: [
      ['Problemstilling', 'Hva gjør en problemstilling god?', 'Den må avgrense og styre analysen.', 'Den er konkret, undersøkbar og tydelig nok til at hvert avsnitt kan kobles tilbake til den.', 'Ikke gjør den bredere enn datagrunnlaget.'],
      ['Avsnitt', 'Hva bør første setning i et analyseavsnitt gjøre?', 'Leseren skal vite poenget raskt.', 'Den bør introdusere hovedpoenget før belegg, forklaring og kobling til problemstillingen.', 'Påstand før bevis.'],
      ['Konklusjon', 'Hva skal konklusjonen ikke gjøre?', 'Unngå nytt stoff.', 'Den skal ikke introdusere nye hovedargumenter, men samle funn og svare på problemstillingen.', 'Kort og presist.']
    ]
  };
  pages.kom1.examChecklist = [
    ['Før skriving', 'Avgrens problemstilling og lag disposisjon.', 'Start'],
    ['Underveis', 'Koble hvert avsnitt til ett tydelig poeng.', 'Flyt'],
    ['Før levering', 'Sjekk kilder, overgangssetninger og konklusjon.', 'Slutt']
  ];

  pages.ret1a.compendium = [
    ['Juridisk metode', 'Problemstilling, rettsregel, vilkår, subsumsjon og konklusjon.', 'Metode'],
    ['Avtalerett', 'Inngåelse, fullmakt, ugyldighet og tolkning som disposisjonskort.', 'Tema'],
    ['Pengekrav og selskap', 'Betaling, mislighold, rente, ansvar og selskapsformer.', 'Tema']
  ];
  pages.ret1a.examRadar = {
    label: 'Drøftingstema',
    summary: 'RET1A-radaren prioriterer temaer der god struktur og presis subsumsjon ofte betyr mer enn lange svar.',
    accent: '#3b82f6',
    rows: [['Avtalerett', 'Hyppige vilkår og faktumsnær drøfting.', '84%'], ['Pengekrav', 'Betaling, mislighold og renter krever ryddig metode.', '74%'], ['Selskapsrett', 'Sammenligning av ansvar, kapital og ledelse.', '66%']]
  };
  pages.ret1a.canvasMaterials = [
    ['Eksamener funnet', 'Lokale filer dekker RET1/RET1A-eksamen fra 2016 til 2025, inkludert H2023, H2024 og V2025.', 'Eksamener'],
    ['Teorioppgaver funnet', 'Selskapsrett, pengekrav og gjeldsinndrivelse ligger som egne teorioppgaver.', 'Teori'],
    ['Manduksjon funnet', 'Eksamensmanduksjon og øvingsoppgaver gir struktur for disposisjon og metodekort.', 'Metode']
  ];
  pages.ret1a.practice = {
    label: 'Juridisk metode',
    intro: 'Korte kort for å holde drøftingen ryddig.',
    cards: [
      ['Metode', 'Hva er rekkefølgen i en juridisk drøftelse?', 'Ikke hopp rett til konklusjon.', 'Problemstilling, rettsregel, vilkår, subsumsjon og konklusjon.', 'Bruk faktum aktivt i subsumsjonen.'],
      ['Vilkår', 'Hvordan håndterer du flere vilkår?', 'Ta ett om gangen.', 'Identifiser hvert vilkår, drøft om faktum oppfyller det, og konkluder delvis før helhetskonklusjonen.', 'Struktur gir poeng.'],
      ['Konklusjon', 'Hva kjennetegner en god konklusjon?', 'Kort, presis og forankret.', 'Den svarer direkte på problemstillingen og viser virkningen av drøftingen.', 'Unngå nye momenter.']
    ]
  };
  pages.ret1a.examChecklist = [
    ['Problemstilling', 'Formuler hva partene er uenige om.', 'Start'],
    ['Rettsregel', 'Få med vilkår og unntak før faktum.', 'Regel'],
    ['Subsumsjon', 'Bruk konkrete fakta, ikke generelle påstander.', 'Poeng']
  ];

  pages.bed1.compendium = [
    ['Kalkyler', 'Bidrag, selvkost, ABC og relevante kostnader samlet i beslutningsflyt.', 'Kjerne'],
    ['Regnskap', 'Resultat, beholdningsendringer og sammenheng mellom kostnad og inntekt.', 'Forståelse'],
    ['Investering', 'Nåverdi, internrente, payback og vurdering av prosjekter.', 'Analyse']
  ];
  pages.bed1.examRadar = {
    label: 'Regneprioritet',
    summary: 'BED1-radaren prioriterer oppgavetyper som er både poengtunge og lette å forbedre med faste fremgangsmåter.',
    accent: '#20b97a',
    rows: [['Produktkalkulasjon', 'Bidrag, selvkost og relevante kostnader.', '86%'], ['Investering', 'Nåverdi og beslutning under usikkerhet.', '76%'], ['Budsjett og resultat', 'Koble tall, begreper og tolkning.', '70%']]
  };
  pages.bed1.formulaSheet = [
    ['Dekningsbidrag', 'Pris minus variable kostnader, total DB og DB-grad.', 'BED1'],
    ['Selvkost', 'Direkte kostnader pluss fordelte indirekte kostnader.', 'BED1'],
    ['Nåverdi', 'Diskonter kontantstrømmer og sammenlign med investering.', 'BED1']
  ];
  pages.bed1.canvasMaterials = [
    ['Eksamener funnet', 'BED1-mappen inneholder eksamener fra 2016-2025, inkludert flere gjentak og duplikatsett.', 'Eksamener'],
    ['Forelesninger funnet', 'Canvas-/OneDrive-filer dekker kostnadsforløp, KRV, prising, investering, kalkulasjon, resultat og budsjettering.', 'Forelesning'],
    ['Gruppeøving funnet', 'Gruppeøving uke 39 gir konkrete kalkyleoppgaver for første kortpakke.', 'Oppgaver']
  ];
  pages.bed1.practice = {
    label: 'Regnegrep',
    intro: 'Korte kort for de vanligste beslutnings- og kalkylegrepene.',
    cards: [
      ['Dekningsbidrag', 'Hva er dekningsbidrag per enhet?', 'Start med salgspris.', 'Salgspris per enhet minus variable kostnader per enhet.', 'Brukes til lønnsomhet og kapasitetsvalg.'],
      ['Relevante kostnader', 'Hva gjør en kostnad relevant i en beslutning?', 'Den må påvirkes av valget.', 'Den er fremtidig og forskjellig mellom alternativene.', 'Historiske kostnader er ofte irrelevante.'],
      ['Nåverdi', 'Hva betyr positiv netto nåverdi?', 'Sammenlign verdi og investering.', 'Prosjektet forventes å skape verdi utover avkastningskravet.', 'Husk å bruke riktig kalkulasjonsrente.']
    ]
  };
  pages.bed1.examChecklist = [
    ['Oppgavetype', 'Avgjør om det er kalkyle, resultat, investering eller budsjett.', 'Start'],
    ['Tallflyt', 'Sett opp tabell før du regner detaljer.', 'Orden'],
    ['Beslutning', 'Skriv anbefaling og økonomisk begrunnelse.', 'Svar']
  ];

  var memos = {
    mat10: {
      intro: 'MAT10 handler om å kjenne igjen riktig matematisk metode raskt og skrive ryddig nok til at regningen blir kontrollerbar.',
      exam: 'Eksamen er typisk regnetung, med høy verdi i metodevalg, mellomregning og kort tolkning av svaret.',
      studyAdvice: 'Start med formelark og korte metodekort før du bruker oppgavebanken til mer sammenhengende regneøkter.'
    },
    met2: {
      intro: 'MET2 samler metode, statistikk og presis tolkning av usikkerhet, tester og regresjon.',
      exam: 'Eksamen belønner både riktig fremgangsmåte og presist språk om p-verdi, konfidensintervall og regresjonsoutput.',
      studyAdvice: 'Bruk begrepskort først, deretter oppgaver der du velger test og skriver konklusjon i kontekst.'
    },
    sam1a: {
      intro: 'SAM1A er grunnmuren i mikro: marked, elastisitet, velferd og markedssvikt forklart med enkle modeller.',
      exam: 'Eksamen krever ofte at figur, begrep og kort forklaring henger sammen i samme svar.',
      studyAdvice: 'Begynn med læringsmålene, tren på standardskift i figurer, og bruk hurtigkort for å låse begrepene.'
    },
    met1: {
      intro: 'MET1 handler om rente, nåverdi, annuitet og økonomisk matematikk der tid og kontantstrøm må holdes ryddig.',
      exam: 'Eksamen tester typisk formelvalg, periodeforståelse og evnen til å konkludere fra tallene.',
      studyAdvice: 'Start med rente- og NNV-kort, og bruk formelark som sjekkliste før lengre regneoppgaver.'
    },
    kom1: {
      intro: 'KOM1 samler rapportskriving, presentasjon og akademisk kommunikasjon til praktiske skrivegrep.',
      exam: 'Vurderingen handler ofte om struktur, presisjon, refleksjon og tydelig kobling mellom problemstilling og argumentasjon.',
      studyAdvice: 'Bruk siden som skriveverksted: bygg disposisjon, øv på analyseavsnitt og repeter overganger før levering.'
    },
    ret1a: {
      intro: 'RET1A handler om juridisk metode i praksis: finne rettsregel, drøfte vilkår og bruke faktum presist.',
      exam: 'Eksamen belønner ryddig struktur, tydelige delkonklusjoner og konkret subsumsjon fremfor lange generelle utlegninger.',
      studyAdvice: 'Tren først på metodekortene, deretter på gamle oppgaver med samme faste drøftingsmal.'
    },
    bed1: {
      intro: 'BED1 samler kalkyler, resultat, investering og budsjettering i beslutninger som må regnes og forklares.',
      exam: 'Eksamen er ofte poengtung på standardoppsett, riktige kostnadsbegreper og en kort økonomisk anbefaling.',
      studyAdvice: 'Start med begreper og formler, gå videre til korte regnedriller, og avslutt med gamle eksamensoppgaver.'
    }
  };

  Object.keys(pages).forEach(function (id) {
    pages[id].id = id;
    pages[id].memo = memos[id] || {
      intro: pages[id].lead,
      exam: 'Eksamensmemoet er klart for fagspesifikk tekst. Bruk denne plassen til form, vurdering og typiske oppgavetyper.',
      studyAdvice: 'Bruk verktøyene i rekkefølge: oversikt, kort øving, oppgaver og til slutt eksamensrettet repetisjon.'
    };
  });

  window.HaugnesSubjectPages = {
    get: function (id) {
      return pages[String(id || '').toLowerCase()] || null;
    }
  };
})(window);
