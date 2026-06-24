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
    sam1a: [
      { type: 'kompendium', title: 'Kompendium og læringsmål', description: 'Lokalt grunnlag er funnet og kan struktureres til kort og oversikt.', status: 'coming' },
      { type: 'eksamen', title: 'Canvas-eksamener', description: 'Canvas-funn kan kobles til oppgavebank når filene er klargjort.', status: 'coming', href: '../user/oppgavebank.html?subject=SAM1A' }
    ],
    met1: [
      { type: 'kompendium', title: 'NNV og rente', description: 'Lokale oppgaver for nåverdi, sluttverdi, annuitet og effektiv rente.', status: 'coming' },
      { type: 'formelark', title: 'Finansmatematikk', description: 'Formler for rente, annuitet, rekker og kontantstrømmer.', status: 'coming' },
      { type: 'eksamen', title: 'Regneoppgaver', description: 'Oppgaver samles i oppgavebanken etter tema.', status: 'available', href: '../user/oppgavebank.html?subject=MET1' }
    ],
    kom1: [
      { type: 'kompendium', title: 'Rapport og presentasjon', description: 'Plass for rapportmal, skrivegrep og presentasjonsstruktur.', status: 'coming' },
      { type: 'annet', title: 'Skrivekort', description: 'Problemstilling, analyseavsnitt og overganger kobles til flashcards.', status: 'available', href: '../flashcards/?subject=kom1' }
    ],
    ret1a: [
      { type: 'kompendium', title: 'Juridisk metode', description: 'Vilkår, subsumsjon og konklusjon som repetisjonsgrunnlag.', status: 'coming' },
      { type: 'eksamen', title: 'Eksamensøving', description: 'Tidligere eksamener og teorioppgaver kan samles i oppgavebanken.', status: 'available', href: '../user/oppgavebank.html?subject=RET1A' },
      { type: 'a_besvarelse', title: 'A-besvarelser', description: 'Kobles til beskyttet eksamensarkiv når dokumentene er klare for deling.', status: 'coming', href: '../user/a-besvarelser.html#/ret1a' }
    ],
    bed1: [
      { type: 'formelark', title: 'Kalkyle- og investeringsark', description: 'Dekningsbidrag, selvkost, NNV og beslutningsregler.', status: 'coming' },
      { type: 'eksamen', title: 'Eksamensoppgaver', description: 'Gamle eksamener og gruppeøvinger kan struktureres i oppgavebanken.', status: 'available', href: '../user/oppgavebank.html?subject=BED1' },
      { type: 'a_besvarelse', title: 'A-besvarelser', description: 'Kobles til beskyttet eksamensarkiv når dokumentene er klare for deling.', status: 'coming', href: '../user/a-besvarelser.html#/bed1' }
    ]
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
