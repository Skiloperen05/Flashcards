(function (window) {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function learningContent() {
    return window.HaugnesLearningContent || null;
  }

  function mergeById(primary, secondary) {
    var seen = {};
    return (primary || []).concat(secondary || []).filter(function (item) {
      var id = item && item.id;
      if (!id) return true;
      if (seen[id]) return false;
      seen[id] = true;
      return true;
    });
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
    // ─── RET14 — Skatterett ───────────────────────────────────────────
    { id: 'ret14-v24-fradrag', subject: 'RET14', title: 'Fradragsrett og tilknytning', source: 'RET14 V24-stil', topic: 'Fradrag', difficulty: 'Vanskelig', minutes: 35, exam: true, prompt: 'Drøft om kostnaden kan fradragsføres. Start med oppofrelse og tilknytning, og vurder deretter spesialregler.', checklist: ['Skriv hovedregelen i sktl. § 6-1', 'Skill mellom privat og virksomhetsrelatert kostnad', 'Konkluder kort og presist'] },
    { id: 'ret14-v25-fritak', subject: 'RET14', title: 'Fritaksmetoden og lavskattland', source: 'RET14 V25-signal', topic: 'Aksjer', difficulty: 'Vanskelig', minutes: 45, exam: true, prompt: 'Vurder om utbytte eller gevinst omfattes av fritaksmetoden når selskapet er hjemmehørende i utlandet.', checklist: ['Identifiser subjekt og objekt', 'Vurder EØS/lavskattland', 'Nevn 3 %-regelen der den passer'] },
    { id: 'ret14-vedlikehold', subject: 'RET14', title: 'Vedlikehold eller påkostning?', source: 'RET14 grensedragning', topic: 'Fradrag', difficulty: 'Vanskelig', minutes: 30, exam: true, prompt: 'Eier bytter tak og samtidig etterisolerer huset. Drøft om kostnaden er fradragsberettiget vedlikehold eller aktiveringspliktig påkostning.', checklist: ['Definer vedlikehold vs påkostning', 'Skill ut den delen som tilbakefører opprinnelig stand', 'Vurder splitting og tidspunkt for arbeidet'] },
    { id: 'ret14-aksjonaermodell', subject: 'RET14', title: 'Aksjonærmodellen og skjerming', source: 'RET14 personskatt', topic: 'Aksjer', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Personlig aksjonær mottar utbytte over skjermingsfradraget. Beregn skattepliktig beløp og forklar oppjusteringsfaktoren.', checklist: ['Finn skjermingsgrunnlag og skjermingsrente', 'Trekk skjerming fra utbytte', 'Bruk oppjusteringsfaktor og forklar hvorfor'] },
    { id: 'ret14-virksomhet', subject: 'RET14', title: 'Lønn, kapital eller virksomhet?', source: 'RET14 klassifisering', topic: 'Personinntekt', difficulty: 'Vanskelig', minutes: 35, exam: true, prompt: 'Aktiv eier driver utleie i tillegg til lønnet stilling. Klassifiser inntekten som lønn, kapital eller virksomhet og vurder følgene.', checklist: ['Bruk vilkår: omfang, varighet, risiko, overskuddsevne', 'Skill aktivitet fra passiv forvaltning', 'Konkluder med konsekvens for skattegrunnlag'] },
    { id: 'ret14-tidfesting', subject: 'RET14', title: 'Tidfesting av inntekt', source: 'RET14 metode', topic: 'Tidfesting', difficulty: 'Middels', minutes: 20, exam: false, prompt: 'En faktura fra desember betales i januar. Forklar når inntekten og kostnaden skal tidfestes etter realisasjonsprinsippet.', checklist: ['Hovedregel: realisasjonsprinsippet', 'Drøft kontantprinsippet for personinntekt', 'Konkluder for både selger og kjøper'] },
    { id: 'ret14-bolig', subject: 'RET14', title: 'Gevinst ved salg av bolig', source: 'RET14 særregler', topic: 'Bolig', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Eier selger bolig etter 14 måneders eiertid og 9 måneders botid. Drøft om gevinsten er skattefri.', checklist: ['Sjekk kravene til eier- og botid (sktl. § 9-3)', 'Skill mellom bolig, fritidsbolig og tomt', 'Konkluder presist'] },
    { id: 'ret14-mva', subject: 'RET14', title: 'Inngående MVA og fradragsrett', source: 'RET14 mva', topic: 'MVA', difficulty: 'Middels', minutes: 20, exam: false, prompt: 'En avgiftspliktig virksomhet kjøper både kontorrekvisita og en representasjonsmiddag. Vurder fradragsretten for inngående MVA.', checklist: ['Hovedregel: tilknytning til avgiftspliktig omsetning', 'Identifiser avskårede poster (representasjon, kost)', 'Splitt dersom delvis bruk'] },

    // ─── SAM2 — Mikroøkonomi ──────────────────────────────────────────
    { id: 'sam2-market-failure', subject: 'SAM2', title: 'Negativ eksternalitet', source: 'Mikro standardoppgave', topic: 'Markedssvikt', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Tegn og forklar hvorfor markedet produserer for mye når det finnes en negativ eksternalitet.', checklist: ['Tegn MPC og MSC', 'Marker markedslikevekt og effektiv mengde', 'Forklar dødvektstap'] },
    { id: 'sam2-elasticity-tax', subject: 'SAM2', title: 'Elastisitet og skattebyrde', source: 'Eksamensnær mikro', topic: 'Elastisitet', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Forklar hvordan elastisitet påvirker hvem som bærer en skatt.', checklist: ['Sammenlign relativ elastisitet', 'Vis ny pris til kjøper og selger', 'Konkluder om byrdefordeling'] },
    { id: 'sam2-pigou', subject: 'SAM2', title: 'Pigou-skatt på utslipp', source: 'SAM2 virkemidler', topic: 'Virkemidler', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'En produsent forurenser med MEC = 20. Vis hvordan en Pigou-skatt gjenoppretter samfunnsøkonomisk effektivitet.', checklist: ['Sett skatten lik marginal ekstern kostnad', 'Vis at MPC + t = MSC', 'Forklar at dødvektstapet forsvinner'] },
    { id: 'sam2-monopol', subject: 'SAM2', title: 'Monopol og velferd', source: 'SAM2 markedsformer', topic: 'Monopol', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Sammenlign pris, mengde og samfunnsøkonomisk overskudd i monopol versus fullkommen konkurranse.', checklist: ['Bruk MR = MC for monopol', 'Marker pris og mengde i begge tilfeller', 'Vis dødvektstapet og forklar'] },
    { id: 'sam2-konsumentvalg', subject: 'SAM2', title: 'Optimalt konsumentvalg', source: 'SAM2 konsumentteori', topic: 'Konsumentteori', difficulty: 'Easy', minutes: 20, exam: false, prompt: 'Bruk indifferenskurver og budsjettlinje til å vise konsumentens optimale tilpasning.', checklist: ['Tegn budsjettlinje med riktig stigning', 'Vis at MRS = prisforholdet', 'Forklar effekt av prisendring'] },
    { id: 'sam2-spillteori', subject: 'SAM2', title: 'Fangenes dilemma', source: 'SAM2 spillteori', topic: 'Spillteori', difficulty: 'Middels', minutes: 20, exam: true, prompt: 'Sett opp en betalingsmatrise for fangenes dilemma og finn Nash-likevekten.', checklist: ['Identifiser dominante strategier', 'Marker Nash-likevekten', 'Forklar hvorfor utfallet er pareto-suboptimalt'] },
    { id: 'sam2-velferd', subject: 'SAM2', title: 'Velferdsanalyse av prisregulering', source: 'SAM2 reguleringer', topic: 'Velferd', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Myndighetene innfører bindende maksimalpris. Analyser virkningen på konsument-, produsent- og samfunnsøkonomisk overskudd.', checklist: ['Vis etterspørselsoverskudd', 'Beregn endring i overskudd', 'Identifiser dødvektstap'] },
    { id: 'sam2-kollektivt-gode', subject: 'SAM2', title: 'Kollektive goder og gratispassasjerer', source: 'SAM2 goder', topic: 'Goder', difficulty: 'Easy', minutes: 15, exam: false, prompt: 'Definer kollektive goder og forklar hvorfor markedet underproduserer slike goder.', checklist: ['Forklar ikke-rivaliserende og ikke-ekskluderbar', 'Drøft gratispassasjerproblemet', 'Nevn løsning (offentlig tilbud)'] },

    // ─── SAM3 — Makroøkonomi ──────────────────────────────────────────
    { id: 'sam3-is-mp-shock', subject: 'SAM3', title: 'IS-MP ved etterspørselssjokk', source: 'Makro modelløving', topic: 'IS-MP', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Analyser et negativt etterspørselssjokk med IS-MP og forklar mulig pengepolitisk respons.', checklist: ['Vis skift i IS', 'Forklar produksjon og rente', 'Drøft respons fra sentralbanken'] },
    { id: 'sam3-solow-saving', subject: 'SAM3', title: 'Sparerate i Solow', source: 'Makro modellkort', topic: 'Solow', difficulty: 'Middels', minutes: 30, exam: false, prompt: 'Forklar effekten av høyere sparerate på steady state og langsiktig vekst.', checklist: ['Tegn investering og break-even', 'Skill nivåeffekt fra vekstrate', 'Forklar overgangsdynamikk'] },
    { id: 'sam3-as-ad', subject: 'SAM3', title: 'AS-AD ved tilbudssjokk', source: 'SAM3 V25-pakke', topic: 'AS-AD', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Et negativt tilbudssjokk treffer økonomien. Analyser kort- og langsiktige effekter i AS-AD-modellen.', checklist: ['Skift SRAS opp/venstre', 'Vis stagflasjon på kort sikt', 'Forklar tilpasning tilbake til LRAS'] },
    { id: 'sam3-phillips', subject: 'SAM3', title: 'Phillipskurven og forventninger', source: 'SAM3 inflasjon', topic: 'Phillips', difficulty: 'Vanskelig', minutes: 30, exam: true, prompt: 'Forklar forskjellen mellom kortsiktig og langsiktig Phillipskurve, og betydningen av forventet inflasjon.', checklist: ['Skill mellom adaptive og rasjonelle forventninger', 'Forklar NAIRU', 'Drøft hvorfor langsiktig Phillipskurve er vertikal'] },
    { id: 'sam3-aapen-okonomi', subject: 'SAM3', title: 'UIP og valutakurs', source: 'SAM3 åpen økonomi', topic: 'Åpen økonomi', difficulty: 'Vanskelig', minutes: 30, exam: true, prompt: 'Norges rente øker mens utenlandsk rente er konstant. Bruk UIP til å forklare effekten på valutakursen.', checklist: ['Skriv UIP-betingelsen', 'Forklar kapitalmobilitet', 'Vis appresiering på kort sikt'] },
    { id: 'sam3-multiplikator', subject: 'SAM3', title: 'Finanspolitisk multiplikator', source: 'SAM3 finanspolitikk', topic: 'IS-MP', difficulty: 'Middels', minutes: 20, exam: false, prompt: 'Forklar hvorfor en økning i offentlige utgifter har en multiplikatoreffekt på BNP.', checklist: ['Definer marginal konsumtilbøyelighet', 'Regn enkel multiplikator 1/(1-MPC)', 'Drøft crowding out via rente'] },
    { id: 'sam3-solow-teknologi', subject: 'SAM3', title: 'Teknologisk vekst i Solow', source: 'SAM3 vekstmodell', topic: 'Solow', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Vis hvordan eksogen teknologisk fremgang påvirker langsiktig vekst per arbeider i Solow-modellen.', checklist: ['Innfør effektivitetsarbeidere', 'Forklar vekst i steady state', 'Skill nivå- fra vekstrateeffekt'] },

    // ─── SOL1 — Organisasjonsatferd ───────────────────────────────────
    { id: 'sol1-motivation', subject: 'SOL1', title: 'Indre og ytre motivasjon', source: 'SOL1 teorioppgave', topic: 'Motivasjon', difficulty: 'Easy', minutes: 20, exam: true, prompt: 'Drøft når ytre belønning kan styrke eller svekke motivasjon.', checklist: ['Definer indre/ytre motivasjon', 'Bruk crowding out', 'Knytt til jobbdesign'] },
    { id: 'sol1-team', subject: 'SOL1', title: 'Team og sosial loffing', source: 'SOL1 case', topic: 'Gruppe', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Analyser hvorfor et team presterer dårligere enn forventet og foreslå tiltak.', checklist: ['Identifiser sosial loffing', 'Drøft psykologisk trygghet', 'Foreslå tydelige roller og ansvar'] },
    { id: 'sol1-ledelse', subject: 'SOL1', title: 'Transformasjonsledelse vs transaksjonsledelse', source: 'SOL1 ledelse', topic: 'Ledelse', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Sammenlign transformasjons- og transaksjonsledelse med tanke på når hver stil fungerer best.', checklist: ['Definer 4 I-er i transformasjonsledelse', 'Forklar betinget belønning i transaksjonsledelse', 'Drøft kontekstuelle faktorer'] },
    { id: 'sol1-bias', subject: 'SOL1', title: 'Beslutningsbias i case', source: 'SOL1 beslutninger', topic: 'Beslutninger', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Identifiser tre vanlige bias i en lederbeslutning og foreslå hvordan organisasjonen kan redusere dem.', checklist: ['Eksempler: bekreftelsesbias, ankerbias, tilgjengelighetsbias', 'Knytt til konkret case', 'Foreslå strukturelle mottiltak'] },
    { id: 'sol1-personlighet', subject: 'SOL1', title: 'Big Five og jobbprestasjon', source: 'SOL1 personlighet', topic: 'Personlighet', difficulty: 'Easy', minutes: 20, exam: false, prompt: 'Forklar hvilke Big Five-trekk som best predikerer jobbprestasjon, og hvorfor.', checklist: ['List Big Five-trekkene', 'Pek på samvittighetsfullhet', 'Knytt til seleksjon og utvikling'] },
    { id: 'sol1-gruppenormer', subject: 'SOL1', title: 'Psykologisk trygghet i team', source: 'SOL1 gruppe', topic: 'Gruppe', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Hvordan kan en leder skape psykologisk trygghet i et nytt team, og hvorfor er det viktig for læring?', checklist: ['Definer psykologisk trygghet (Edmondson)', 'Drøft konkrete lederatferder', 'Knytt til læring og innovasjon'] },

    // ─── MET2 — Statistikk og metode ──────────────────────────────────
    { id: 'met2-pvalue', subject: 'MET2', title: 'P-verdi og konklusjon', source: 'MET2 metode', topic: 'Hypotesetest', difficulty: 'Easy', minutes: 15, exam: false, prompt: 'Forklar p-verdi og skriv en korrekt konklusjon ved 5 % signifikansnivå.', checklist: ['Tolk gitt H0', 'Sammenlign med alfa', 'Svar i kontekst'] },
    { id: 'met2-konfidensintervall', subject: 'MET2', title: 'Tolkning av 95% KI', source: 'MET2 KI', topic: 'Konfidensintervall', difficulty: 'Easy', minutes: 15, exam: true, prompt: 'Et 95% konfidensintervall for gjennomsnitt er [42, 58]. Tolk intervallet korrekt og forklar vanlige feiltolkninger.', checklist: ['Tolkning: gjentatte utvalg', 'Unngå "95% sannsynlighet for parameter"', 'Knytt til hypotesetest'] },
    { id: 'met2-regresjon', subject: 'MET2', title: 'Tolkning av regresjonskoeffisient', source: 'MET2 regresjon', topic: 'Regresjon', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'En regresjon gir β₁ = 1.8 (SE = 0.6). Tolk koeffisienten, vurder signifikans og forklar R².', checklist: ['Tolk β i opprinnelige enheter', 'Beregn t-verdi og konkluder', 'Forklar R² som forklaringskraft'] },
    { id: 'met2-feil', subject: 'MET2', title: 'Type I- og type II-feil', source: 'MET2 hypotesetest', topic: 'Hypotesetest', difficulty: 'Middels', minutes: 20, exam: true, prompt: 'Forklar sammenhengen mellom signifikansnivå, type I-feil, type II-feil og styrke.', checklist: ['Definer α, β og 1-β', 'Vis trade-off ved valg av α', 'Knytt til utvalgsstørrelse'] },
    { id: 'met2-utvalg', subject: 'MET2', title: 'Sampling og bias', source: 'MET2 metode', topic: 'Utvalg', difficulty: 'Easy', minutes: 15, exam: false, prompt: 'Drøft hvordan ikke-tilfeldig utvalg kan skape bias, og hvordan man kan motvirke det.', checklist: ['Eksempel: selvseleksjon', 'Konsekvenser for ekstern validitet', 'Foreslå randomisering eller vekting'] },
    { id: 'met2-sannsynlighet', subject: 'MET2', title: 'Forventning og varians', source: 'MET2 sannsynlighet', topic: 'Sannsynlighet', difficulty: 'Middels', minutes: 20, exam: false, prompt: 'Beregn forventning og varians for summen av to uavhengige stokastiske variabler X og Y.', checklist: ['E(X+Y) = E(X) + E(Y)', 'Var(X+Y) = Var(X) + Var(Y) ved uavhengighet', 'Vis effekt av kovarians om avhengig'] },

    // ─── MAT10 — Matematikk ───────────────────────────────────────────
    { id: 'mat10-optimization', subject: 'MAT10', title: 'Optimering med randpunkter', source: 'MAT10 regnedrill', topic: 'Optimering', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Finn maksimum/minimum for en funksjon på et lukket intervall.', checklist: ['Deriver og finn kritiske punkt', 'Sjekk randpunkter', 'Sammenlign funksjonsverdier'] },
    { id: 'mat10-integrasjon', subject: 'MAT10', title: 'Substitusjon i integrasjon', source: 'MAT10 integral', topic: 'Integrasjon', difficulty: 'Middels', minutes: 20, exam: true, prompt: 'Løs ∫ 2x·e^(x²) dx ved substitusjon og forklar metodevalget.', checklist: ['Sett u = x²', 'Finn du = 2x dx', 'Skriv tilbake til x og legg til konstant'] },
    { id: 'mat10-matriser', subject: 'MAT10', title: 'Invers matrise og lineært system', source: 'MAT10 lineær algebra', topic: 'Matriser', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Gitt et 2×2-system Ax = b: beregn determinant, finn invers og løs systemet.', checklist: ['Sjekk det(A) ≠ 0', 'Finn A⁻¹ med formel', 'Multipliser for å få x'] },
    { id: 'mat10-elastisitet', subject: 'MAT10', title: 'Elastisitet i økonomi', source: 'MAT10 derivasjon', topic: 'Derivasjon', difficulty: 'Easy', minutes: 15, exam: false, prompt: 'Beregn priselastisiteten for q(p) = 100 − 2p ved p = 20 og tolk resultatet.', checklist: ['Bruk E = (dq/dp)·(p/q)', 'Sett inn tall', 'Tolk tegn og absoluttverdi'] },
    { id: 'mat10-funksjoner', subject: 'MAT10', title: 'Grenseverdi og kontinuitet', source: 'MAT10 funksjoner', topic: 'Funksjoner', difficulty: 'Middels', minutes: 20, exam: false, prompt: 'Undersøk om f(x) = (x²−1)/(x−1) er kontinuerlig i x = 1.', checklist: ['Faktoriser teller', 'Finn grenseverdien', 'Konkluder om kontinuitet og diskontinuitetstype'] },
    { id: 'mat10-rekker', subject: 'MAT10', title: 'Geometrisk rekke', source: 'MAT10 rekker', topic: 'Rekker', difficulty: 'Easy', minutes: 15, exam: false, prompt: 'Beregn summen av en uendelig geometrisk rekke med a₁ = 5 og k = 0.4, og forklar når formelen er gyldig.', checklist: ['Sjekk |k| < 1', 'Bruk S = a₁/(1−k)', 'Forklar konvergens'] },

    // ─── MET1 — Matematikk for økonomer ───────────────────────────────
    { id: 'met1-nv', subject: 'MET1', title: 'Netto nåverdi av prosjekt', source: 'MET1 investering', topic: 'Nåverdi', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Et prosjekt krever 100 i investering og gir 40 i 3 år. Beregn netto nåverdi ved 8 % avkastningskrav og konkluder.', checklist: ['Diskonter hver kontantstrøm', 'Trekk fra investering', 'Konkluder: gjennomfør om NNV > 0'] },
    { id: 'met1-annuitet', subject: 'MET1', title: 'Annuitetslån', source: 'MET1 finans', topic: 'Annuitet', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Beregn årlig terminbeløp på et annuitetslån på 500 000 over 10 år med 5 % rente.', checklist: ['Bruk annuitetsfaktor', 'Sjekk at rente og periode matcher', 'Tolk resultatet'] },
    { id: 'met1-effektiv-rente', subject: 'MET1', title: 'Nominell vs effektiv rente', source: 'MET1 rente', topic: 'Rente', difficulty: 'Easy', minutes: 15, exam: false, prompt: 'En bank oppgir 6 % nominell rente med månedlig kapitalisering. Beregn effektiv årlig rente.', checklist: ['Bruk (1 + r/n)^n − 1', 'Sett r=0.06, n=12', 'Forklar hvorfor effektiv > nominell'] },

    // ─── SAM1A — Mikroøkonomi intro ───────────────────────────────────
    { id: 'sam1a-likevekt', subject: 'SAM1A', title: 'Skift i tilbud og etterspørsel', source: 'SAM1A grunnkurs', topic: 'Likevekt', difficulty: 'Easy', minutes: 15, exam: true, prompt: 'Forklar hvordan et negativt tilbudssjokk og økt etterspørsel samtidig påvirker pris og mengde.', checklist: ['Skift begge kurver', 'Konkluder entydig om pris', 'Mengdeendring kan være tvetydig'] },
    { id: 'sam1a-regulering', subject: 'SAM1A', title: 'Maksimalpris i boligmarkedet', source: 'SAM1A regulering', topic: 'Regulering', difficulty: 'Middels', minutes: 20, exam: true, prompt: 'Drøft virkninger av en bindende maksimalpris på leiemarkedet.', checklist: ['Vis etterspørselsoverskudd', 'Drøft kø og kvalitetsreduksjon', 'Vurder velferdseffekter'] },
    { id: 'sam1a-velferd', subject: 'SAM1A', title: 'Dødvektstap ved skatt', source: 'SAM1A velferd', topic: 'Velferd', difficulty: 'Easy', minutes: 15, exam: false, prompt: 'Forklar hvorfor en stykkavgift på en vare gir dødvektstap.', checklist: ['Vis ny markedslikevekt', 'Identifiser trekanten DWL', 'Knytt til elastisitet'] },

    // ─── KOM1 — Kommunikasjon ─────────────────────────────────────────
    { id: 'kom1-rapport', subject: 'KOM1', title: 'Struktur i analyseavsnitt', source: 'KOM1 skriving', topic: 'Rapport', difficulty: 'Easy', minutes: 15, exam: true, prompt: 'Skriv et analyseavsnitt om en gitt case som følger PBFK-strukturen (Påstand–Belegg–Forklaring–Konklusjon).', checklist: ['Tydelig påstand først', 'Konkret belegg fra case', 'Avslutt med kobling til problemstilling'] },
    { id: 'kom1-presentasjon', subject: 'KOM1', title: 'Slidedesign og budskap', source: 'KOM1 muntlig', topic: 'Presentasjon', difficulty: 'Easy', minutes: 15, exam: false, prompt: 'Forklar prinsipper for én tydelig idé per slide og hvordan dette styrker formidlingen.', checklist: ['Maks ett kjernepoeng', 'Visuell hierarki', 'Bruk overskrift som påstand'] },
    { id: 'kom1-overganger', subject: 'KOM1', title: 'Overganger i akademisk tekst', source: 'KOM1 språk', topic: 'Språk', difficulty: 'Easy', minutes: 15, exam: false, prompt: 'Skriv tre eksempler på overgangssetninger som tydeliggjør sammenhengen mellom avsnitt.', checklist: ['Bruk koblingsord', 'Vis logikk: kontrast, årsak, eksempel', 'Knytt tilbake til hovedpoeng'] },

    // ─── RET1A — Juridiske emner ──────────────────────────────────────
    { id: 'ret1a-method', subject: 'RET1A', title: 'Avtalerettslig drøftelse', source: 'RET1A metode', topic: 'Juridisk metode', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Drøft om en avtale er bindende med tydelig regel, subsumsjon og konklusjon.', checklist: ['Formuler problemstilling', 'Ta vilkår i riktig rekkefølge', 'Bruk faktum konkret'] },
    { id: 'ret1a-tolkning', subject: 'RET1A', title: 'Avtaletolkning', source: 'RET1A avtalerett', topic: 'Avtaletolkning', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Partene er uenige om hva avtalen betyr. Drøft tolkningen med utgangspunkt i ordlyd, formål og partsforutsetninger.', checklist: ['Objektiv tolkning av ordlyden', 'Bruk avtalens formål', 'Vurder partenes felles forutsetninger'] },
    { id: 'ret1a-erstatning', subject: 'RET1A', title: 'Vilkår for erstatning', source: 'RET1A erstatningsrett', topic: 'Erstatning', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Drøft de tre kumulative vilkårene for erstatning utenfor kontrakt.', checklist: ['Ansvarsgrunnlag (skyld/objektivt)', 'Økonomisk tap', 'Adekvat årsakssammenheng'] },
    { id: 'ret1a-konklusjon', subject: 'RET1A', title: 'God konklusjon i juridisk drøftelse', source: 'RET1A metode', topic: 'Konklusjon', difficulty: 'Easy', minutes: 10, exam: false, prompt: 'Skriv en konklusjon som svarer presist på problemstillingen uten å introdusere nye momenter.', checklist: ['Speil problemstillingen', 'Konkluder kort og presist', 'Unngå ny drøftelse'] },

    // ─── BED1 — Bedriftsøkonomi ───────────────────────────────────────
    { id: 'bed1-db', subject: 'BED1', title: 'Dekningsbidrag og kapasitet', source: 'BED1 gruppeøving', topic: 'Kalkyle', difficulty: 'Middels', minutes: 30, exam: true, prompt: 'Velg hvilket produkt som bør prioriteres når kapasiteten er begrenset.', checklist: ['Regn DB per enhet', 'Finn DB per knapp faktor', 'Skriv beslutning'] },
    { id: 'bed1-selvkost', subject: 'BED1', title: 'Selvkost vs bidragskalkyle', source: 'BED1 kalkyler', topic: 'Kalkyle', difficulty: 'Middels', minutes: 25, exam: true, prompt: 'Sammenlign selvkost- og bidragskalkyle for samme produkt og forklar når hver metode passer best.', checklist: ['Definer begge metodene', 'Vis hvordan faste kostnader behandles', 'Drøft beslutningsrelevans'] },
    { id: 'bed1-beslutning', subject: 'BED1', title: 'Relevante kostnader i beslutning', source: 'BED1 beslutning', topic: 'Beslutning', difficulty: 'Middels', minutes: 20, exam: true, prompt: 'Bedriften vurderer å akseptere en ekstraordre under normal pris. Identifiser relevante og irrelevante kostnader.', checklist: ['Drøft alternativkostnad', 'Skill faste fra variable kostnader', 'Vurder kapasitetsbegrensninger'] },
    { id: 'bed1-investering', subject: 'BED1', title: 'Investeringsanalyse med NNV og IR', source: 'BED1 investering', topic: 'Investering', difficulty: 'Vanskelig', minutes: 35, exam: true, prompt: 'Sammenlign to gjensidig utelukkende prosjekter med ulik størrelse ved bruk av NNV og internrente.', checklist: ['Beregn NNV for begge', 'Finn IR og diskuter avkastningskravet', 'Forklar konflikt mellom metodene'] }
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

  var noteSeeds = [];

  function subjectKey(id) {
    var value = String(id || '').toLowerCase();
    if (value === 'subj_sol1') return 'sol1';
    return value;
  }

  function decksFor(id) {
    var learning = learningContent();
    var generated = learning && typeof learning.decksFor === 'function' ? learning.decksFor(id) : [];
    return clone(mergeById(generated, flashcardDecks[subjectKey(id)] || []));
  }

  function questions() {
    var learning = learningContent();
    var generated = learning && Array.isArray(learning.questions) ? learning.questions : [];
    return clone(mergeById(generated, questionBank));
  }

  function analysisFor(id) {
    var learning = learningContent();
    var generated = learning && typeof learning.analysisFor === 'function' ? learning.analysisFor(id) : null;
    return clone(generated || examAnalysis[subjectKey(id)] || null);
  }

  function notes() {
    var learning = learningContent();
    var generated = learning && typeof learning.notes === 'function' ? learning.notes() : [];
    return clone(mergeById(generated, noteSeeds));
  }

  window.HaugnesStudyData = {
    decksFor: decksFor,
    questions: questions,
    analysisFor: analysisFor,
    notes: notes
  };
})(window);
