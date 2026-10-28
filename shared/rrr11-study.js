// Generated from data/rrr11-nye-flashcards.json and data/rrr11-kvalitetskrav-flashcards.json by scripts/generate-rrr11-study.mjs.
window.HaugnesRrr11Study = [
  {
    "id": "rrr11-systemlandskap",
    "title": "Regnskapssystem og transaksjonsflyt",
    "description": "Systemlandskap, transaksjonsprosesser, masterdata, kontostreng og kontrollspor fra hendelse til rapport.",
    "cards": [
      {
        "id": "rrr11-systemlandskap-1",
        "q": "Hva er regnskapssystemets fire hovedfunksjoner?",
        "a": "Bokføring, rapportering, finansiell analyse og kostnadskontroll",
        "explanation": "Funksjonene viser at regnskapssystemet både registrerer, forklarer og støtter styring.",
        "topic": "grunnlag",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 6",
        "quiz": {
          "q": "Hva er regnskapssystemets fire hovedfunksjoner?",
          "options": [
            "Bokføring, rapportering, finansiell analyse og kostnadskontroll",
            "Budsjettering, skatt, revisjon og finansiering",
            "Salg, innkjøp, lønn og lager",
            "Planlegging, produksjon, kontroll og markedsføring"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-systemlandskap-2",
        "q": "Hvilke tre lag består et moderne regnskapslandskap av?",
        "a": "Transaksjoner, data og regnskap, samt innsikt og analyse",
        "explanation": "Lagene går fra operative hendelser via strukturert regnskapsdata til beslutningsstøtte.",
        "topic": "systemlandskap",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 8",
        "quiz": {
          "q": "Hvilke tre lag består et moderne regnskapslandskap av?",
          "options": [
            "Kunder, leverandører og ansatte",
            "Transaksjoner, data og regnskap, samt innsikt og analyse",
            "Bokføring, revisjon og skatt",
            "Strategi, taktikk og drift"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-systemlandskap-3",
        "q": "Hva er felles logikk for de sentrale transaksjonsprosessene?",
        "a": "Hendelse → dokumentasjon → registrering → behandling → bokføring → rapportering",
        "explanation": "Kjeden gjør det mulig å følge en økonomisk hendelse hele veien til rapporten.",
        "topic": "transaksjonsflyt",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 11",
        "quiz": {
          "q": "Hva er felles logikk for de sentrale transaksjonsprosessene?",
          "options": [
            "Budsjett → prognose → analyse → vedtak",
            "Bestilling → betaling → levering → rapport",
            "Hendelse → dokumentasjon → registrering → behandling → bokføring → rapportering",
            "Risiko → kontroll → avvik → revisjon"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-systemlandskap-4",
        "q": "Hva er hovedstegene i ordre-til-betaling?",
        "a": "Kundeordre → levering → faktura → innbetaling",
        "explanation": "Prosessen påvirker blant annet inntekt, kundefordring og bank.",
        "topic": "ordre til betaling",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 11",
        "quiz": {
          "q": "Hva er hovedstegene i ordre-til-betaling?",
          "options": [
            "Bestilling → mottak → faktura → betaling",
            "Arbeidstid → lønn → utbetaling → rapportering",
            "Materialer → produksjon → ferdigvare → salg",
            "Kundeordre → levering → faktura → innbetaling"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-systemlandskap-5",
        "q": "Hva er hovedstegene i innkjøp-til-betaling?",
        "a": "Bestilling → mottak → faktura → betaling",
        "explanation": "Prosessen påvirker kostnad eller eiendel, leverandørgjeld og bank.",
        "topic": "innkjøp til betaling",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 11",
        "quiz": {
          "q": "Hva er hovedstegene i innkjøp-til-betaling?",
          "options": [
            "Bestilling → mottak → faktura → betaling",
            "Kundeordre → levering → faktura → innbetaling",
            "Mottak → produksjon → salg → innbetaling",
            "Budsjett → bestilling → bokføring → rapportering"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-systemlandskap-6",
        "q": "Hvorfor er masterdata kritisk i regnskapssystemet?",
        "a": "De registreres én gang og brukes i mange prosesser og rapporter",
        "explanation": "Feil i kunde-, produkt-, leverandør-, konto- eller prosjektdata kan derfor spre seg raskt.",
        "topic": "masterdata",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 12",
        "quiz": {
          "q": "Hvorfor er masterdata kritisk i regnskapssystemet?",
          "options": [
            "De brukes bare ved årsavslutningen",
            "De registreres én gang og brukes i mange prosesser og rapporter",
            "De erstatter behovet for kontroller",
            "De inneholder kun historiske saldotall"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-systemlandskap-7",
        "q": "Hvordan bokføres et varesalg på kreditt ved fakturering?",
        "a": "Debet kundefordring og kredit salgsinntekt",
        "explanation": "Posteringen viser både kravet mot kunden og inntekten.",
        "topic": "salg",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 14",
        "quiz": {
          "q": "Hvordan bokføres et varesalg på kreditt ved fakturering?",
          "options": [
            "Debet bank og kredit salgsinntekt",
            "Debet salgsinntekt og kredit kundefordring",
            "Debet kundefordring og kredit salgsinntekt",
            "Debet varekostnad og kredit leverandørgjeld"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-systemlandskap-8",
        "q": "Hvordan bokføres kundens betaling av en tidligere kredittfaktura?",
        "a": "Debet bank og kredit kundefordring",
        "explanation": "Banken øker, mens fordringen mot kunden reduseres.",
        "topic": "salg",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 14",
        "quiz": {
          "q": "Hvordan bokføres kundens betaling av en tidligere kredittfaktura?",
          "options": [
            "Debet kundefordring og kredit bank",
            "Debet bank og kredit salgsinntekt",
            "Debet kontanter og kredit leverandørgjeld",
            "Debet bank og kredit kundefordring"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-systemlandskap-9",
        "q": "Hvilken risiko oppstår når varer leveres uten at kunden faktureres?",
        "a": "Salgsinntekter og kundefordringer kan bli ufullstendige",
        "explanation": "Leveransen har skjedd, men regnskapet mangler den tilhørende inntekten og fordringen.",
        "topic": "risiko",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 14",
        "quiz": {
          "q": "Hvilken risiko oppstår når varer leveres uten at kunden faktureres?",
          "options": [
            "Salgsinntekter og kundefordringer kan bli ufullstendige",
            "Salgsinntekten blir alltid dobbeltført",
            "Leverandørgjelden blir overvurdert",
            "Bankbeholdningen blir automatisk feilperiodisert"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-systemlandskap-10",
        "q": "Hvilken kontroll kan fange opp leverte, men ikke fakturerte ordre?",
        "a": "Systemet matcher leverte ordre mot fakturerte ordre",
        "explanation": "En slik match er en kontroll nær risikoens kilde.",
        "topic": "kontroll",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 14",
        "quiz": {
          "q": "Hvilken kontroll kan fange opp leverte, men ikke fakturerte ordre?",
          "options": [
            "Årlig varetelling",
            "Systemet matcher leverte ordre mot fakturerte ordre",
            "Godkjenning av lønnskjøring",
            "Avstemming av skattetrekkskonto"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-systemlandskap-11",
        "q": "Hva er kontrollbeviset for leverte, ikke-fakturerte ordre?",
        "a": "En avviksrapport",
        "explanation": "Rapporten dokumenterer hvilke leveranser som mangler faktura og kan følges opp.",
        "topic": "kontrollbevis",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 14",
        "quiz": {
          "q": "Hva er kontrollbeviset for leverte, ikke-fakturerte ordre?",
          "options": [
            "En muntlig bekreftelse",
            "Et budsjett",
            "En avviksrapport",
            "En kontoplan"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-systemlandskap-12",
        "q": "Hva uttrykker kontostrengen utover selve kontoen?",
        "a": "Dimensjoner som selskap, avdeling, produkt, kunde, prosjekt, geografi og scenario",
        "explanation": "Kontoplanen sier hva, mens dimensjonene forklarer hvor, hvem og hvorfor.",
        "topic": "kontostreng",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 18",
        "quiz": {
          "q": "Hva uttrykker kontostrengen utover selve kontoen?",
          "options": [
            "Kun debet og kredit",
            "Bare leverandørens organisasjonsnummer",
            "Kun regnskapsåret og valutaen",
            "Dimensjoner som selskap, avdeling, produkt, kunde, prosjekt, geografi og scenario"
          ],
          "correct": 3
        }
      }
    ]
  },
  {
    "id": "rrr11-kvalitetskrav",
    "title": "Kvalitetskrav og kontrollspor",
    "description": "Regnskapskvalitet, bokføringskrav, påstander og hvilke krav som er viktigst i de ulike rutinene.",
    "cards": [
      {
        "id": "rrr11-kvalitetskrav-1",
        "q": "Hva betyr fullstendighet som kvalitetskrav?",
        "a": "Alle relevante hendelser og transaksjoner er tatt med",
        "explanation": "Kravet retter seg særlig mot det som kan mangle i regnskapet.",
        "topic": "kvalitetskrav",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 15",
        "quiz": {
          "q": "Hva betyr fullstendighet som kvalitetskrav?",
          "options": [
            "Alle registrerte eiendeler finnes fysisk",
            "Alle relevante hendelser og transaksjoner er tatt med",
            "Alle beløp er vurdert til virkelig verdi",
            "Alle transaksjoner er godkjent av revisor"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-kvalitetskrav-2",
        "q": "Hva betyr gyldighet som kvalitetskrav?",
        "a": "Transaksjonen har en legitim og reell forretningsmessig bakgrunn",
        "explanation": "Gyldighet beskytter mot fiktive eller uvedkommende transaksjoner.",
        "topic": "kvalitetskrav",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 15",
        "quiz": {
          "q": "Hva betyr gyldighet som kvalitetskrav?",
          "options": [
            "Transaksjonen er registrert i riktig periode",
            "Alle transaksjoner er med",
            "Transaksjonen har en legitim og reell forretningsmessig bakgrunn",
            "Eiendelen er verdsatt forsiktig"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-kvalitetskrav-3",
        "q": "Hva betyr nøyaktighet i et regnskapssystem?",
        "a": "Beløp, periode, konto og motpart er korrekt",
        "explanation": "Nøyaktighet gjelder riktig behandling av den registrerte hendelsen.",
        "topic": "kvalitetskrav",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 15",
        "quiz": {
          "q": "Hva betyr nøyaktighet i et regnskapssystem?",
          "options": [
            "Alle brukere har tilgang til dataene",
            "Alle dokumenter er lagret på papir",
            "Bare vesentlige transaksjoner bokføres",
            "Beløp, periode, konto og motpart er korrekt"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-kvalitetskrav-4",
        "q": "Hva betyr sporbarhet?",
        "a": "Det finnes et toveis kontrollspor mellom dokumentasjon og rapport",
        "explanation": "Man skal kunne gå både fra bilag til rapport og fra rapport tilbake til bilag.",
        "topic": "kontrollspor",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 15",
        "quiz": {
          "q": "Hva betyr sporbarhet?",
          "options": [
            "Det finnes et toveis kontrollspor mellom dokumentasjon og rapport",
            "Alle transaksjoner spores av revisor i sanntid",
            "Kun endringer i masterdata logges",
            "Rapporter kan ikke endres etter publisering"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-kvalitetskrav-5",
        "q": "Hva betyr sikring av regnskapsdata?",
        "a": "Data bevares, er tilgjengelige og beskyttes mot uautorisert endring",
        "explanation": "Sikring omfatter både tilgjengelighet og beskyttelse mot tap eller manipulasjon.",
        "topic": "sikring",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 15",
        "quiz": {
          "q": "Hva betyr sikring av regnskapsdata?",
          "options": [
            "Data skal alltid være offentlige",
            "Data bevares, er tilgjengelige og beskyttes mot uautorisert endring",
            "Alle ansatte skal ha like tilganger",
            "Data kan slettes når rapporten er sendt"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-kvalitetskrav-6",
        "q": "Hvilke to kvalitetskrav er sentrale for salgsinntekt?",
        "a": "Fullstendighet og riktig måling, inkludert periodisering",
        "explanation": "Salg kan mangle eller bli ført i feil beløp eller periode.",
        "topic": "salgsrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 46",
        "quiz": {
          "q": "Hvilke to kvalitetskrav er sentrale for salgsinntekt?",
          "options": [
            "Eksistens og tilhørighet",
            "Verdsettelse og presentasjon",
            "Fullstendighet og riktig måling, inkludert periodisering",
            "Gyldighet og sikring"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-kvalitetskrav-7",
        "q": "Hvilke to kvalitetskrav er sentrale for kundefordringer?",
        "a": "Verdsettelse og eksistens",
        "explanation": "Fordringen må finnes og være oppført til et beløp som kan forventes innbetalt.",
        "topic": "salgsrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 46",
        "quiz": {
          "q": "Hvilke to kvalitetskrav er sentrale for kundefordringer?",
          "options": [
            "Fullstendighet og gyldighet",
            "Presentasjon og tilhørighet",
            "Riktig måling og sikring",
            "Verdsettelse og eksistens"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-kvalitetskrav-8",
        "q": "Hvilke kvalitetskrav er sentrale for kostnader i innkjøpsrutinen?",
        "a": "Gyldighet og riktig måling",
        "explanation": "Kostnaden må gjelde virksomheten og være bokført med riktig beløp og periode.",
        "topic": "innkjøpsrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 55",
        "quiz": {
          "q": "Hvilke kvalitetskrav er sentrale for kostnader i innkjøpsrutinen?",
          "options": [
            "Gyldighet og riktig måling",
            "Fullstendighet og eksistens",
            "Verdsettelse og tilhørighet",
            "Sporbarhet og sikring"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-kvalitetskrav-9",
        "q": "Hvilket kvalitetskrav er særlig viktig for leverandørgjeld?",
        "a": "Fullstendighet",
        "explanation": "Risikoen er ofte at gjeld eller påløpte kostnader ikke blir bokført.",
        "topic": "innkjøpsrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 55",
        "quiz": {
          "q": "Hvilket kvalitetskrav er særlig viktig for leverandørgjeld?",
          "options": [
            "Kun presentasjon",
            "Fullstendighet",
            "Kun eksistens",
            "Kun tilhørighet"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-kvalitetskrav-10",
        "q": "Hvilke kvalitetskrav står sentralt i lagerrutinen?",
        "a": "Eksistens, tilhørighet og verdsettelse",
        "explanation": "Varene må finnes, eies av virksomheten og være riktig verdsatt.",
        "topic": "lagerrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 61",
        "quiz": {
          "q": "Hvilke kvalitetskrav står sentralt i lagerrutinen?",
          "options": [
            "Fullstendighet, gyldighet og periodisering",
            "Presentasjon, sikring og nøyaktighet",
            "Eksistens, tilhørighet og verdsettelse",
            "Kun eksistens og fullstendighet"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-kvalitetskrav-11",
        "q": "Hvilke kvalitetskrav står sentralt i lønnsrutinen?",
        "a": "Gyldighet, riktig måling og fullstendighet",
        "explanation": "Lønn må gjelde reelle ansatte og arbeid, beregnes korrekt og rapporteres komplett.",
        "topic": "lønnsrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 66",
        "quiz": {
          "q": "Hvilke kvalitetskrav står sentralt i lønnsrutinen?",
          "options": [
            "Eksistens, tilhørighet og verdsettelse",
            "Kun presentasjon og periodisering",
            "Fullstendighet og eksistens alene",
            "Gyldighet, riktig måling og fullstendighet"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-kvalitetskrav-12",
        "q": "Hvilke kvalitetskrav står sentralt i driftsmiddelrutinen?",
        "a": "Eksistens, tilhørighet og korrekt verdsettelse",
        "explanation": "Driftsmidlene må finnes, eies av virksomheten og være riktig balanseført.",
        "topic": "driftsmiddelrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 70",
        "quiz": {
          "q": "Hvilke kvalitetskrav står sentralt i driftsmiddelrutinen?",
          "options": [
            "Eksistens, tilhørighet og korrekt verdsettelse",
            "Gyldighet, fullstendighet og periodisering",
            "Kun presentasjon og sikring",
            "Eksistens og fullstendighet alene"
          ],
          "correct": 0
        }
      }
    ]
  },
  {
    "id": "rrr11-ansvar-styring",
    "title": "Ansvar, styring og regnskapsorganisering",
    "description": "Roller, ansvar, internrapportering, styrearbeid og forholdet mellom styret, daglig leder og revisor.",
    "cards": [
      {
        "id": "rrr11-ansvar-styring-1",
        "q": "Hva menes med regnskapsorganisering?",
        "a": "Organisering, planlegging og gjennomføring av innsamling, bearbeiding og rapportering av opplysninger til regnskaps- og økonomistyring",
        "explanation": "Begrepet omfatter hele prosessen og store deler av organisasjonen.",
        "topic": "grunnbegrep",
        "source": "Regnskapsorganisering Del 1, Ståle Christensen, s. 3",
        "quiz": {
          "q": "Hva menes med regnskapsorganisering?",
          "options": [
            "Kun valg av regnskapsprogram",
            "Bare årsavslutning og revisjon",
            "Organisering, planlegging og gjennomføring av innsamling, bearbeiding og rapportering av opplysninger til regnskaps- og økonomistyring",
            "Kun fordeling av oppgaver i økonomiavdelingen"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-ansvar-styring-2",
        "q": "Hva omfatter intern kontroll i denne sammenhengen?",
        "a": "Alt selskapet gjør for å sikre verdier og legge til rette for forsvarlig drift og måloppnåelse",
        "explanation": "Intern kontroll omfatter metoder, aktiviteter, retningslinjer, prosedyrer og rutiner.",
        "topic": "intern kontroll",
        "source": "Regnskapsorganisering Del 1, Ståle Christensen, s. 12",
        "quiz": {
          "q": "Hva omfatter intern kontroll i denne sammenhengen?",
          "options": [
            "Kun regnskapsmessige avstemminger",
            "Bare revisors kontroller",
            "Kun tiltak mot økonomisk kriminalitet",
            "Alt selskapet gjør for å sikre verdier og legge til rette for forsvarlig drift og måloppnåelse"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-ansvar-styring-3",
        "q": "Hvem har det overordnede ansvaret for intern kontroll?",
        "a": "Styret",
        "explanation": "Styrets forvaltningsansvar omfatter forsvarlig organisering og betryggende kontroll.",
        "topic": "styreansvar",
        "source": "Regnskapsorganisering Del 1, Ståle Christensen, s. 13",
        "quiz": {
          "q": "Hvem har det overordnede ansvaret for intern kontroll?",
          "options": [
            "Styret",
            "Revisor",
            "Regnskapsfører",
            "Daglig leder alene"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-ansvar-styring-4",
        "q": "Hvem har det operative ansvaret for at intern kontroll er iverksatt og fungerer?",
        "a": "Daglig leder",
        "explanation": "Daglig leder skal også sørge for at selskapets regnskap utarbeides.",
        "topic": "ledelsesansvar",
        "source": "Regnskapsorganisering Del 1, Ståle Christensen, s. 14",
        "quiz": {
          "q": "Hvem har det operative ansvaret for at intern kontroll er iverksatt og fungerer?",
          "options": [
            "Generalforsamlingen",
            "Daglig leder",
            "Ekstern revisor",
            "Bankforbindelsen"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-ansvar-styring-5",
        "q": "Har revisor ansvar for virksomhetens interne kontroll?",
        "a": "Nei, revisor vurderer og rapporterer, men har ikke ansvaret",
        "explanation": "Ansvaret ligger hos styret og ledelsen. Revisor ser etter om pliktene er oppfylt.",
        "topic": "revisor",
        "source": "Regnskapsorganisering Del 1, Ståle Christensen, s. 15",
        "quiz": {
          "q": "Har revisor ansvar for virksomhetens interne kontroll?",
          "options": [
            "Ja, alltid",
            "Ja, men bare i små selskaper",
            "Nei, revisor vurderer og rapporterer, men har ikke ansvaret",
            "Bare hvis selskapet har lån"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-ansvar-styring-6",
        "q": "Hva er formålet med tydelig rolledeling mellom eiere, styre og daglig leder?",
        "a": "Å styrke tilliten til selskapet",
        "explanation": "Eierne velger styret, styret delegerer daglig ledelse, og daglig leder utfører.",
        "topic": "corporate governance",
        "source": "Regnskapsorganisering Del 1, Ståle Christensen, s. 17",
        "quiz": {
          "q": "Hva er formålet med tydelig rolledeling mellom eiere, styre og daglig leder?",
          "options": [
            "Å fjerne styrets tilsynsansvar",
            "Å gi revisor beslutningsmyndighet",
            "Å gjøre generalforsamlingen operativ",
            "Å styrke tilliten til selskapet"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-ansvar-styring-7",
        "q": "Hva er styreorganets tre bærebjelker?",
        "a": "Styresammensetning, styrets rutiner og planer, samt styrets kommunikasjon",
        "explanation": "De tre områdene skal gjøre styret kompetent, systematisk og informert.",
        "topic": "styrearbeid",
        "source": "Regnskapsorganisering Del 1, Ståle Christensen, s. 18",
        "quiz": {
          "q": "Hva er styreorganets tre bærebjelker?",
          "options": [
            "Styresammensetning, styrets rutiner og planer, samt styrets kommunikasjon",
            "Budsjett, regnskap og skatt",
            "Strategi, revisjon og finansiering",
            "Salg, drift og personal"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-ansvar-styring-8",
        "q": "Hvorfor er løpende internrapportering viktig?",
        "a": "Den gir ledelsen grunnlag for analyse, beslutninger og korrigerende tiltak",
        "explanation": "Rapporteringen bør være hyppig, vesentlig og knyttet til hvordan utviklingen faktisk styres.",
        "topic": "styringsinformasjon",
        "source": "Regnskapsorganisering Del 1, Ståle Christensen, s. 6",
        "quiz": {
          "q": "Hvorfor er løpende internrapportering viktig?",
          "options": [
            "Den erstatter årsregnskapet",
            "Den gir ledelsen grunnlag for analyse, beslutninger og korrigerende tiltak",
            "Den brukes bare av eksterne långivere",
            "Den fjerner behovet for budsjetter"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-ansvar-styring-9",
        "q": "Hva er hovedoppgavene i kontroll- og styringssirkelen?",
        "a": "Planer, gjennomføring, rapportering, analyse og beslutning",
        "explanation": "Sirkelen viser hvordan ledelsen følger opp mål og korrigerer kursen.",
        "topic": "styring",
        "source": "Regnskapsorganisering Del 1, Ståle Christensen, s. 8",
        "quiz": {
          "q": "Hva er hovedoppgavene i kontroll- og styringssirkelen?",
          "options": [
            "Salg, levering, faktura, betaling og bokføring",
            "Risiko, revisjon, skatt, finans og drift",
            "Planer, gjennomføring, rapportering, analyse og beslutning",
            "Bestilling, mottak, lager, lønn og rapport"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-ansvar-styring-10",
        "q": "Hva kjennetegner god kommunikasjon mellom styreleder og daglig leder?",
        "a": "Tillitsfull åpenhet som gir styret relevant informasjon og daglig leder nødvendig støtte",
        "explanation": "God kommunikasjon er en katalysator for effektivt og proaktivt styrearbeid.",
        "topic": "styrekommunikasjon",
        "source": "Regnskapsorganisering Del 1, Ståle Christensen, s. 20",
        "quiz": {
          "q": "Hva kjennetegner god kommunikasjon mellom styreleder og daglig leder?",
          "options": [
            "Kun skriftlig kontakt én gang i året",
            "At styreleder overtar den daglige ledelsen",
            "At all informasjon går via revisor",
            "Tillitsfull åpenhet som gir styret relevant informasjon og daglig leder nødvendig støtte"
          ],
          "correct": 3
        }
      }
    ]
  },
  {
    "id": "rrr11-risiko-kontroll",
    "title": "Risikostyring og kontrollaktiviteter",
    "description": "Risikovurdering, risikomatrise, kontrolltyper, arbeidsdeling og koblingen fra risiko til kontrollbevis.",
    "cards": [
      {
        "id": "rrr11-risiko-kontroll-1",
        "q": "Hvorfor kan intern kontroll bare gi rimelig og ikke absolutt sikkerhet?",
        "a": "Fordi feil, skjønn, overstyring, samarbeid og eksterne hendelser ikke kan elimineres helt",
        "explanation": "Kontrollnivået må dessuten vurderes mot kostnad og nytte.",
        "topic": "rimelig sikkerhet",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 4",
        "quiz": {
          "q": "Hvorfor kan intern kontroll bare gi rimelig og ikke absolutt sikkerhet?",
          "options": [
            "Fordi intern kontroll bare gjelder små selskaper",
            "Fordi revisor alltid overtar ansvaret",
            "Fordi kontroller ikke kan dokumenteres",
            "Fordi feil, skjønn, overstyring, samarbeid og eksterne hendelser ikke kan elimineres helt"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-risiko-kontroll-2",
        "q": "Hvordan uttrykkes risiko enkelt i en risikomatrise?",
        "a": "Sannsynlighet × konsekvens",
        "explanation": "Begge dimensjoner må vurderes for å prioritere risikoer.",
        "topic": "risikovurdering",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 22",
        "quiz": {
          "q": "Hvordan uttrykkes risiko enkelt i en risikomatrise?",
          "options": [
            "Sannsynlighet × konsekvens",
            "Kostnad × inntekt",
            "Iboende risiko + kontrollrisiko",
            "Sannsynlighet ÷ konsekvens"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-risiko-kontroll-3",
        "q": "Hva består iboende risiko av i materialets modell?",
        "a": "Forretningsrisiko + operasjonell risiko + risiko i kontrollmiljøet",
        "explanation": "Iboende risiko beskriver risikoen før virkningen av etablerte kontroller.",
        "topic": "risikomodell",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 12",
        "quiz": {
          "q": "Hva består iboende risiko av i materialets modell?",
          "options": [
            "Kontrollrisiko + revisjonsrisiko",
            "Forretningsrisiko + operasjonell risiko + risiko i kontrollmiljøet",
            "Sannsynlighet + konsekvens",
            "Likviditetsrisiko + kredittrisiko"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-risiko-kontroll-4",
        "q": "Hvordan uttrykkes samlet risiko i materialets modell?",
        "a": "Iboende risiko × kontrollrisiko",
        "explanation": "Kontrollrisikoen sier noe om faren for at kontrollene ikke forebygger eller oppdager feil.",
        "topic": "risikomodell",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 12",
        "quiz": {
          "q": "Hvordan uttrykkes samlet risiko i materialets modell?",
          "options": [
            "Iboende risiko + kontrollrisiko",
            "Sannsynlighet × kostnad",
            "Iboende risiko × kontrollrisiko",
            "Bruttorisiko − konsekvens"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-risiko-kontroll-5",
        "q": "Hva er forskjellen på bruttorisiko og nettorisiko?",
        "a": "Bruttorisiko er før tiltak, nettorisiko er etter virkningen av tiltak",
        "explanation": "Forskjellen viser hvor mye kontrollene reduserer risikoeksponeringen.",
        "topic": "risikomatrise",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 23",
        "quiz": {
          "q": "Hva er forskjellen på bruttorisiko og nettorisiko?",
          "options": [
            "Bruttorisiko gjelder drift, nettorisiko gjelder regnskap",
            "Bruttorisiko er kvantitativ, nettorisiko er kvalitativ",
            "Det er to navn på samme risiko",
            "Bruttorisiko er før tiltak, nettorisiko er etter virkningen av tiltak"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-risiko-kontroll-6",
        "q": "Hvilke hovedvalg har ledelsen når en risiko er prioritert?",
        "a": "Overføre, avslutte, redusere, akseptere eller optimalisere risikoeksponeringen",
        "explanation": "Valget bør bygge på risiko, kost/nytte og virksomhetens mål.",
        "topic": "risikohåndtering",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 24",
        "quiz": {
          "q": "Hvilke hovedvalg har ledelsen når en risiko er prioritert?",
          "options": [
            "Overføre, avslutte, redusere, akseptere eller optimalisere risikoeksponeringen",
            "Ignorere, skjule, utsette eller slette",
            "Revidere, rapportere eller forsikre",
            "Bokføre, avstemme eller periodisere"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-risiko-kontroll-7",
        "q": "Hva er en preventiv kontroll?",
        "a": "En kontroll som skal hindre feil eller uregelmessigheter før de oppstår",
        "explanation": "Eksempler er arbeidsdeling, autorisasjon og begrenset fysisk tilgang.",
        "topic": "kontrolltyper",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 32",
        "quiz": {
          "q": "Hva er en preventiv kontroll?",
          "options": [
            "En kontroll som bare dokumenterer historiske feil",
            "En kontroll som skal hindre feil eller uregelmessigheter før de oppstår",
            "En prosedyre for å rette opp en kjent feil",
            "En kontroll som utføres av ekstern revisor"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-risiko-kontroll-8",
        "q": "Hva er en oppdagende kontroll?",
        "a": "En kontroll som skal avdekke feil som har sluppet gjennom de preventive kontrollene",
        "explanation": "Avstemminger og etterkontroll er typiske eksempler.",
        "topic": "kontrolltyper",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 32",
        "quiz": {
          "q": "Hva er en oppdagende kontroll?",
          "options": [
            "En kontroll som forhindrer all risiko",
            "En rutine for å godkjenne budsjetter",
            "En kontroll som skal avdekke feil som har sluppet gjennom de preventive kontrollene",
            "En kontroll som bare gjelder IT-systemer"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-risiko-kontroll-9",
        "q": "Hva er en korrektiv kontroll?",
        "a": "En prosedyre for å rette og dokumentere feil som er oppdaget",
        "explanation": "Korrektive kontroller beskriver hvordan typiske feil skal behandles.",
        "topic": "kontrolltyper",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 32",
        "quiz": {
          "q": "Hva er en korrektiv kontroll?",
          "options": [
            "En kontroll som hindrer tilgang",
            "En kontroll som beregner risiko",
            "En kontroll som erstatter bokføring",
            "En prosedyre for å rette og dokumentere feil som er oppdaget"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-risiko-kontroll-10",
        "q": "Hva betyr arbeidsdeling som kontrollaktivitet?",
        "a": "Oppgaver i en transaksjonskjede fordeles slik at ulike personer kontrollerer hverandre",
        "explanation": "En vanlig modell er Prepare – Approve – Do – Review.",
        "topic": "arbeidsdeling",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 31",
        "quiz": {
          "q": "Hva betyr arbeidsdeling som kontrollaktivitet?",
          "options": [
            "Oppgaver i en transaksjonskjede fordeles slik at ulike personer kontrollerer hverandre",
            "Alle oppgaver samles hos én erfaren person",
            "Revisor godkjenner hver transaksjon",
            "Systemet gjør alle vurderinger uten mennesker"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-risiko-kontroll-11",
        "q": "Hva er analyseformelen fra risiko til dokumentasjon?",
        "a": "Risiko → kontrollmål → kontrollaktivitet → kontrollbevis",
        "explanation": "Formelen sikrer at kontrollen faktisk svarer på risikoen og etterlater dokumentasjon.",
        "topic": "kontrolldesign",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 24",
        "quiz": {
          "q": "Hva er analyseformelen fra risiko til dokumentasjon?",
          "options": [
            "Mål → budsjett → regnskap → revisjon",
            "Risiko → kontrollmål → kontrollaktivitet → kontrollbevis",
            "Hendelse → betaling → rapport → skatt",
            "Konto → avdeling → prosjekt → kunde"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-risiko-kontroll-12",
        "q": "Hva er 3-veis match i innkjøpsprosessen?",
        "a": "Sammenligning av bestilling, varemottak og faktura",
        "explanation": "Kontrollen reduserer risikoen for betaling for varer eller tjenester som ikke er bestilt eller mottatt.",
        "topic": "applikasjonskontroll",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 22",
        "quiz": {
          "q": "Hva er 3-veis match i innkjøpsprosessen?",
          "options": [
            "Sammenligning av budsjett, regnskap og prognose",
            "Sammenligning av kunde, faktura og bank",
            "Sammenligning av bestilling, varemottak og faktura",
            "Sammenligning av lager, lønn og skatt"
          ],
          "correct": 2
        }
      }
    ]
  },
  {
    "id": "rrr11-salg-innkjop",
    "title": "Salgsrutinen og innkjøpsrutinen",
    "description": "Aktiviteter, risikoer, bokføring og kontroller i ordre-til-betaling og innkjøp-til-betaling.",
    "cards": [
      {
        "id": "rrr11-salg-innkjop-1",
        "q": "Hvilke hovedaktiviteter inngår i salgsrutinen?",
        "a": "Masterdata, ordre og kredittvurdering, levering, fakturering, bokføring og innbetaling",
        "explanation": "Aktivitetene må henge sammen for å sikre komplett og korrekt inntektsføring.",
        "topic": "salgsrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 47",
        "quiz": {
          "q": "Hvilke hovedaktiviteter inngår i salgsrutinen?",
          "options": [
            "Masterdata, ordre og kredittvurdering, levering, fakturering, bokføring og innbetaling",
            "Bestilling, mottak, fakturakontroll og remittering",
            "Ansettelse, timeregistrering og lønn",
            "Varetelling, ukurans og nedskrivning"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-salg-innkjop-2",
        "q": "Når skal et salg inntektsføres?",
        "a": "Når inntekten er opptjent, ikke nødvendigvis når fakturaen sendes eller betalingen mottas",
        "explanation": "Derfor må opptjent, ikke fakturert inntekt vurderes ved periodeslutt.",
        "topic": "periodisering",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 47",
        "quiz": {
          "q": "Når skal et salg inntektsføres?",
          "options": [
            "Alltid når kunden betaler",
            "Når inntekten er opptjent, ikke nødvendigvis når fakturaen sendes eller betalingen mottas",
            "Alltid når ordren mottas",
            "Kun ved årsavslutningen"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-salg-innkjop-3",
        "q": "Hvilken risiko reduseres ved kredittvurdering av kunden?",
        "a": "Tap på kundefordringer",
        "explanation": "Kredittvurdering bør særlig brukes ved ordre over en fastsatt beløpsgrense.",
        "topic": "salgsrisiko",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 49",
        "quiz": {
          "q": "Hvilken risiko reduseres ved kredittvurdering av kunden?",
          "options": [
            "Manglende lønnsinnberetning",
            "Feil i varetellingen",
            "Tap på kundefordringer",
            "Dobbeltbetaling av leverandørfaktura"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-salg-innkjop-4",
        "q": "Hvordan kontrolleres åpne ordre i salgsrutinen?",
        "a": "Registrerte, ikke-prosesserte ordre følges opp jevnlig",
        "explanation": "Oppfølgingen avdekker ordre som har stoppet før levering eller fakturering.",
        "topic": "salgskontroll",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 50",
        "quiz": {
          "q": "Hvordan kontrolleres åpne ordre i salgsrutinen?",
          "options": [
            "Alle åpne ordre slettes månedlig",
            "Bare betalte ordre gjennomgås",
            "Revisor godkjenner hver ordre",
            "Registrerte, ikke-prosesserte ordre følges opp jevnlig"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-salg-innkjop-5",
        "q": "Hva er den viktigste kontrollen mot at leverte varer ikke faktureres?",
        "a": "Oppfølging eller matching av utleverte, ikke-fakturerte ordre",
        "explanation": "Kontrollen kobler levering til fakturering og støtter fullstendighet.",
        "topic": "salgskontroll",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 50",
        "quiz": {
          "q": "Hva er den viktigste kontrollen mot at leverte varer ikke faktureres?",
          "options": [
            "Oppfølging eller matching av utleverte, ikke-fakturerte ordre",
            "Kredittvurdering etter levering",
            "Varetelling én gang i året",
            "Avstemming av leverandørreskontro"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-salg-innkjop-6",
        "q": "Hvorfor er fullstendighet spesielt kritisk ved kontantsalg?",
        "a": "Fordi kontanter og kortsalg lett kan underslås eller holdes utenfor bokføringen",
        "explanation": "Krav om kasseapparat, synlig beløp, kvittering og summeringsstrimler reduserer risikoen.",
        "topic": "kontantsalg",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 52",
        "quiz": {
          "q": "Hvorfor er fullstendighet spesielt kritisk ved kontantsalg?",
          "options": [
            "Fordi alle kontantsalg skjer på kreditt",
            "Fordi kontanter og kortsalg lett kan underslås eller holdes utenfor bokføringen",
            "Fordi kontantsalg ikke skal bokføres",
            "Fordi kunden alltid faktureres senere"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-salg-innkjop-7",
        "q": "Hva sikrer fullstendighet ved salg av tjenester?",
        "a": "Registrering av avtaler og fortløpende registrering av timer",
        "explanation": "Når vederlaget bygger på tidsforbruk, må timene kunne dokumenteres og fremgå av fakturaen.",
        "topic": "tjenestesalg",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 53",
        "quiz": {
          "q": "Hva sikrer fullstendighet ved salg av tjenester?",
          "options": [
            "Kun signatur fra kunden",
            "Årlig varetelling",
            "Registrering av avtaler og fortløpende registrering av timer",
            "Kontroll av leverandørens bankkonto"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-salg-innkjop-8",
        "q": "Hvilke hovedaktiviteter inngår i innkjøpsrutinen?",
        "a": "Masterdata, bestilling, mottak, fakturamottak, bokføring, betaling og bokføring av betaling",
        "explanation": "Prosessen starter med et behov og avsluttes når betalingen er registrert.",
        "topic": "innkjøpsrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 56",
        "quiz": {
          "q": "Hvilke hovedaktiviteter inngår i innkjøpsrutinen?",
          "options": [
            "Ordre, levering, faktura og kundeinnbetaling",
            "Ansettelse, lønnsberegning og rapportering",
            "Produksjon, ferdigvare, salg og retur",
            "Masterdata, bestilling, mottak, fakturamottak, bokføring, betaling og bokføring av betaling"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-salg-innkjop-9",
        "q": "Hvilken risiko reduseres av automatisk duplikatkontroll?",
        "a": "At samme inngående faktura bokføres eller betales flere ganger",
        "explanation": "Kontrollen kan bruke leverandør, fakturanummer, dato og beløp.",
        "topic": "innkjøpsrisiko",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 58",
        "quiz": {
          "q": "Hvilken risiko reduseres av automatisk duplikatkontroll?",
          "options": [
            "At samme inngående faktura bokføres eller betales flere ganger",
            "At kunden ikke kredittvurderes",
            "At varer blir ukurante",
            "At lønn utbetales til feil ansatt"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-salg-innkjop-10",
        "q": "Hva skal kontrolleres ved varemottak?",
        "a": "Kvantum og kvalitet mot bestilling og pakkseddel",
        "explanation": "Mottaket bør attesteres før fakturaen godkjennes.",
        "topic": "varemottak",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 59",
        "quiz": {
          "q": "Hva skal kontrolleres ved varemottak?",
          "options": [
            "Kun leverandørens bankkonto",
            "Kvantum og kvalitet mot bestilling og pakkseddel",
            "Kundens kredittgrense",
            "Den ansattes skattekort"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-salg-innkjop-11",
        "q": "Hva skal kontrolleres før leverandørfakturaen godkjennes?",
        "a": "Pris mot bestilling og kvantum mot bestilling og varemottak",
        "explanation": "Dette er kjernen i 3-veis match.",
        "topic": "fakturakontroll",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 59",
        "quiz": {
          "q": "Hva skal kontrolleres før leverandørfakturaen godkjennes?",
          "options": [
            "Pris mot salgsbudsjett alene",
            "Kun at fakturaen har logo",
            "Pris mot bestilling og kvantum mot bestilling og varemottak",
            "Bare at betalingen er gjennomført"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-salg-innkjop-12",
        "q": "Hvilken kontroll reduserer risikoen for private kjøp i selskapets regnskap?",
        "a": "Godkjenning av behov, bestilling og faktura av personer med riktig fullmakt",
        "explanation": "Autorisasjon og arbeidsdeling gjør det vanskeligere å føre uvedkommende kostnader.",
        "topic": "innkjøpskontroll",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 58",
        "quiz": {
          "q": "Hvilken kontroll reduserer risikoen for private kjøp i selskapets regnskap?",
          "options": [
            "Automatisk inntektsføring",
            "Kredittvurdering av kunder",
            "Kontroll av ferdigvarer på lager",
            "Godkjenning av behov, bestilling og faktura av personer med riktig fullmakt"
          ],
          "correct": 3
        }
      }
    ]
  },
  {
    "id": "rrr11-lager-lonn-driftsmidler",
    "title": "Lager, lønn og driftsmidler",
    "description": "Kvalitetskrav, risikoer og kontroller i lagerrutinen, lønnsrutinen og driftsmiddelrutinen.",
    "cards": [
      {
        "id": "rrr11-lager-lonn-driftsmidler-1",
        "q": "Hva er hovedtrinnene i lagerrutinen?",
        "a": "Varemottak og registrering, forvaltning av lageret, samt uttak og registrering",
        "explanation": "Registrering ved hver bevegelse er nødvendig for at lagerdataene skal stemme med fysisk beholdning.",
        "topic": "lagerrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 62",
        "quiz": {
          "q": "Hva er hovedtrinnene i lagerrutinen?",
          "options": [
            "Bestilling, fakturering og innbetaling",
            "Varemottak og registrering, forvaltning av lageret, samt uttak og registrering",
            "Ansettelse, lønn og skatt",
            "Investering, avskrivning og salg"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-lager-lonn-driftsmidler-2",
        "q": "Hva er en sentral risiko når balansen bygger på registrert beholdning?",
        "a": "At registrert beholdning ikke stemmer med faktisk beholdning",
        "explanation": "Varetelling brukes for å verifisere eksistensen og avdekke differanser.",
        "topic": "lagerrisiko",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 63",
        "quiz": {
          "q": "Hva er en sentral risiko når balansen bygger på registrert beholdning?",
          "options": [
            "At alle varer er for lavt priset",
            "At leverandørgjeld mangler",
            "At registrert beholdning ikke stemmer med faktisk beholdning",
            "At lønn er feilperiodisert"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-lager-lonn-driftsmidler-3",
        "q": "Hvordan verdsettes varer etter laveste verdis prinsipp?",
        "a": "Til laveste av anskaffelseskost og virkelig verdi",
        "explanation": "Ukurans eller varig prisfall kan derfor utløse nedskrivning.",
        "topic": "lagerverdsettelse",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 65",
        "quiz": {
          "q": "Hvordan verdsettes varer etter laveste verdis prinsipp?",
          "options": [
            "Til høyeste av kost og salgspris",
            "Alltid til historisk kost",
            "Alltid til forventet salgspris",
            "Til laveste av anskaffelseskost og virkelig verdi"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-lager-lonn-driftsmidler-4",
        "q": "Hvilke kontroller er typiske i lagerrutinen?",
        "a": "Arbeidsdeling ved mottak, varetelling og begrenset tilgang til lager",
        "explanation": "Uttak bør kontrolleres mot ordresedler eller plukklister.",
        "topic": "lagerkontroll",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 64",
        "quiz": {
          "q": "Hvilke kontroller er typiske i lagerrutinen?",
          "options": [
            "Arbeidsdeling ved mottak, varetelling og begrenset tilgang til lager",
            "Kredittvurdering og fakturamatch",
            "Lønnsgodkjenning og skattetrekk",
            "Kun ekstern revisjon"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-lager-lonn-driftsmidler-5",
        "q": "Hva er en sentral gyldighetsrisiko i lønnsrutinen?",
        "a": "At lønn utbetales til personer som ikke er ansatte eller for arbeid som ikke er utført",
        "explanation": "Gode masterdata, attestasjon av timer og kontroll av lønnslister reduserer risikoen.",
        "topic": "lønnsrisiko",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 68",
        "quiz": {
          "q": "Hva er en sentral gyldighetsrisiko i lønnsrutinen?",
          "options": [
            "At varer ikke blir telt",
            "At lønn utbetales til personer som ikke er ansatte eller for arbeid som ikke er utført",
            "At kunder ikke faktureres",
            "At driftsmidler avskrives lineært"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-lager-lonn-driftsmidler-6",
        "q": "Hvilke hovedaktiviteter inngår i lønnsrutinen?",
        "a": "Registrere faste og variable opplysninger, beregne og utbetale lønn, bokføre og rapportere offentlige avgifter",
        "explanation": "Rutinen omfatter både medarbeiderdata, beregning, betaling og rapportering.",
        "topic": "lønnsrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 67",
        "quiz": {
          "q": "Hvilke hovedaktiviteter inngår i lønnsrutinen?",
          "options": [
            "Ordre, levering, faktura og innbetaling",
            "Bestilling, mottak og fakturakontroll",
            "Registrere faste og variable opplysninger, beregne og utbetale lønn, bokføre og rapportere offentlige avgifter",
            "Varetelling, ukurans og kassasjon"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-lager-lonn-driftsmidler-7",
        "q": "Hva inngår i lønnskostnaden utover ordinær lønn?",
        "a": "Feriepenger, arbeidsgiveravgift, pensjonskostnader og andre pliktige ytelser",
        "explanation": "Lønn omfatter alt vederlag for arbeid, også enkelte fordeler og uttak.",
        "topic": "lønn",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 69",
        "quiz": {
          "q": "Hva inngår i lønnskostnaden utover ordinær lønn?",
          "options": [
            "Kun skattetrekk",
            "Bare kontant utbetalt lønn",
            "Kundefordringer og merverdiavgift",
            "Feriepenger, arbeidsgiveravgift, pensjonskostnader og andre pliktige ytelser"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-lager-lonn-driftsmidler-8",
        "q": "Hvilke hovedaktiviteter inngår i driftsmiddelrutinen?",
        "a": "Investeringsvedtak, bestilling, mottak og registrering, faktura, bokføring og betaling",
        "explanation": "Et driftsmiddel bør kunne følges fra vedtak og anskaffelse til registrering og betaling.",
        "topic": "driftsmiddelrutinen",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 71",
        "quiz": {
          "q": "Hvilke hovedaktiviteter inngår i driftsmiddelrutinen?",
          "options": [
            "Investeringsvedtak, bestilling, mottak og registrering, faktura, bokføring og betaling",
            "Ordre, levering og kundeinnbetaling",
            "Varetelling og kassasjon",
            "Timeregistrering og lønnskjøring"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-lager-lonn-driftsmidler-9",
        "q": "Hva er en tilhørighetsrisiko for driftsmidler?",
        "a": "At selskapet bokfører driftsmidler det ikke eier",
        "explanation": "Tilhørighet må dokumenteres gjennom avtaler, fakturaer og registrering.",
        "topic": "driftsmiddelrisiko",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 72",
        "quiz": {
          "q": "Hva er en tilhørighetsrisiko for driftsmidler?",
          "options": [
            "At alle driftsmidler er fullt avskrevet",
            "At selskapet bokfører driftsmidler det ikke eier",
            "At lønn utbetales for sent",
            "At kunder betaler kontant"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-lager-lonn-driftsmidler-10",
        "q": "Hva er en fullstendighetsrisiko for driftsmidler?",
        "a": "At driftsmidler selskapet faktisk eier, ikke blir bokført",
        "explanation": "Manglende registrering gir ufullstendig balanse og kan også påvirke avskrivningene.",
        "topic": "driftsmiddelrisiko",
        "source": "Regnskapsorganisering Del 2, Ståle Christensen, s. 72",
        "quiz": {
          "q": "Hva er en fullstendighetsrisiko for driftsmidler?",
          "options": [
            "At driftsmidlet har for lav restverdi",
            "At leverandørfakturaen betales to ganger",
            "At driftsmidler selskapet faktisk eier, ikke blir bokført",
            "At varen ligger på feil lagerplass"
          ],
          "correct": 2
        }
      }
    ]
  },
  {
    "id": "rrr11-erp-data-ai",
    "title": "ERP, data og AI i økonomifunksjonen",
    "description": "Arkitekturmønstre, systemvalg, generelle IT-kontroller, automatisering og ansvar ved bruk av AI.",
    "cards": [
      {
        "id": "rrr11-erp-data-ai-1",
        "q": "Hva kjennetegner en suite-arkitektur?",
        "a": "Én bred plattform med felles datamodell",
        "explanation": "Fordelen er integrasjon og standardisering, mens ulempene kan være stor endring og leverandørbinding.",
        "topic": "ERP-arkitektur",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 28",
        "quiz": {
          "q": "Hva kjennetegner en suite-arkitektur?",
          "options": [
            "Mange uavhengige spesialsystemer uten felles kjerne",
            "Kun regneark og manuelle integrasjoner",
            "Én bred plattform med felles datamodell",
            "En stabil kjerne med utskiftbare komponenter"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-erp-data-ai-2",
        "q": "Hva kjennetegner best-of-breed?",
        "a": "Spesialiserte systemer kobles sammen",
        "explanation": "Løsningen gir dybde og fleksibilitet, men krever flere integrasjoner og datakilder.",
        "topic": "ERP-arkitektur",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 28",
        "quiz": {
          "q": "Hva kjennetegner best-of-breed?",
          "options": [
            "Én bred plattform med felles datamodell",
            "Ingen integrasjoner mellom systemer",
            "Kun en skybasert hovedbok",
            "Spesialiserte systemer kobles sammen"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-erp-data-ai-3",
        "q": "Hva kjennetegner en composable eller hybrid arkitektur?",
        "a": "En stabil kjerne kombineres med utskiftbare kapabiliteter",
        "explanation": "Den muliggjør trinnvis fornyelse, men krever sterk arkitektur- og datastyring.",
        "topic": "ERP-arkitektur",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 28",
        "quiz": {
          "q": "Hva kjennetegner en composable eller hybrid arkitektur?",
          "options": [
            "En stabil kjerne kombineres med utskiftbare kapabiliteter",
            "Alle systemer byttes samtidig",
            "Kun én leverandør kan brukes",
            "Regnskapet føres uten masterdata"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-erp-data-ai-4",
        "q": "Hvilke forhold driver ERP-valget?",
        "a": "Forretningsfit, data og integrasjon, standardisering, sikkerhet, AI, kostnad og gjennomføring",
        "explanation": "Bransje, størrelse, prosesskompleksitet og regulatoriske krav påvirker prioriteringen.",
        "topic": "ERP-valg",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 29",
        "quiz": {
          "q": "Hvilke forhold driver ERP-valget?",
          "options": [
            "Kun lisenspris",
            "Forretningsfit, data og integrasjon, standardisering, sikkerhet, AI, kostnad og gjennomføring",
            "Kun antall brukere",
            "Bare leverandørens markedsandel"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-erp-data-ai-5",
        "q": "Hvorfor feiler ERP-programmer sjelden bare på teknologi?",
        "a": "Fordi prosess, data, mennesker, styring og teknologi må endres samlet",
        "explanation": "Et teknisk systembytte skaper ikke verdi uten organisatorisk gjennomføring.",
        "topic": "ERP-transformasjon",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 31",
        "quiz": {
          "q": "Hvorfor feiler ERP-programmer sjelden bare på teknologi?",
          "options": [
            "Fordi teknologi ikke påvirker regnskap",
            "Fordi revisors rolle alltid er avgjørende",
            "Fordi prosess, data, mennesker, styring og teknologi må endres samlet",
            "Fordi ERP bare brukes til rapportering"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-erp-data-ai-6",
        "q": "Hva skiller automatisering, copilot og agent?",
        "a": "Automatisering følger regler, copilot foreslår, agent planlegger og utfører flere steg",
        "explanation": "Graden av autonomi øker fra deterministiske regler til målrettet handling.",
        "topic": "AI",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 33",
        "quiz": {
          "q": "Hva skiller automatisering, copilot og agent?",
          "options": [
            "De er tre navn på samme løsning",
            "Automatisering beslutter, copilot bokfører, agent lagrer",
            "Copilot er alltid mer autonom enn agent",
            "Automatisering følger regler, copilot foreslår, agent planlegger og utfører flere steg"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-erp-data-ai-7",
        "q": "Hva blir viktigere når en AI-løsning får mer autonomi?",
        "a": "Tydelig mandat, riktig datatilgang, logging og stoppunkter",
        "explanation": "Kontrollrammene må bli sterkere når systemet kan utføre flere handlinger selv.",
        "topic": "AI-kontroll",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 33",
        "quiz": {
          "q": "Hva blir viktigere når en AI-løsning får mer autonomi?",
          "options": [
            "Tydelig mandat, riktig datatilgang, logging og stoppunkter",
            "Færre logger og bredere tilganger",
            "At alle forslag godkjennes automatisk",
            "At menneskelig vurdering fjernes"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-erp-data-ai-8",
        "q": "Hva kan AI gjøre i transaksjonsbehandlingen?",
        "a": "Tolke dokumenter, foreslå kontering, matche og behandle avvik",
        "explanation": "Bruken bør kombineres med regler for godkjenning, logging og oppfølging.",
        "topic": "AI-bruk",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 34",
        "quiz": {
          "q": "Hva kan AI gjøre i transaksjonsbehandlingen?",
          "options": [
            "Erstatte all dokumentasjon",
            "Tolke dokumenter, foreslå kontering, matche og behandle avvik",
            "Fjerne behovet for hovedbok",
            "Fastsette selskapets strategi alene"
          ],
          "correct": 1
        }
      },
      {
        "id": "rrr11-erp-data-ai-9",
        "q": "Hvordan flytter AI kontrollbehovet?",
        "a": "Fra kontroll av registrering til kontroll av data, modell, verktøytilgang, resultat og logging",
        "explanation": "Kontrollbehovet forsvinner ikke; det flyttes før, under og etter agentens handlinger.",
        "topic": "AI-kontroll",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 36",
        "quiz": {
          "q": "Hvordan flytter AI kontrollbehovet?",
          "options": [
            "Kontrollbehovet forsvinner helt",
            "Kontrollen flyttes bare til ekstern revisor",
            "Fra kontroll av registrering til kontroll av data, modell, verktøytilgang, resultat og logging",
            "Kontrollen gjelder kun etter årsavslutningen"
          ],
          "correct": 2
        }
      },
      {
        "id": "rrr11-erp-data-ai-10",
        "q": "Hvilke fem områder må vurderes når AI foreslår en postering?",
        "a": "Datagrunnlag, modell og konfigurasjon, godkjenningsregler, logging og forklarbarhet, samt overstyring og læring",
        "explanation": "Områdene gjør det mulig å styre både input, behandling, beslutning og oppfølging.",
        "topic": "AI-ansvar",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 25",
        "quiz": {
          "q": "Hvilke fem områder må vurderes når AI foreslår en postering?",
          "options": [
            "Pris, lisens, markedsandel, design og hastighet",
            "Konto, kunde, leverandør, ansatt og prosjekt",
            "Budsjett, prognose, skatt, revisjon og finansiering",
            "Datagrunnlag, modell og konfigurasjon, godkjenningsregler, logging og forklarbarhet, samt overstyring og læring"
          ],
          "correct": 3
        }
      },
      {
        "id": "rrr11-erp-data-ai-11",
        "q": "Hva er generelle IT-kontroller?",
        "a": "Kontroller over identitet og tilgang, endringer, drift, gjenoppretting og leverandører",
        "explanation": "De danner fundamentet under automatiserte applikasjonskontroller.",
        "topic": "IT-kontroll",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 21",
        "quiz": {
          "q": "Hva er generelle IT-kontroller?",
          "options": [
            "Kontroller over identitet og tilgang, endringer, drift, gjenoppretting og leverandører",
            "Kontroller av hver enkelt salgsfaktura",
            "Kun manuelle avstemminger",
            "Bare kontroller av årsregnskapet"
          ],
          "correct": 0
        }
      },
      {
        "id": "rrr11-erp-data-ai-12",
        "q": "Hva er den faglige effekten av standardisert e-faktura?",
        "a": "Automatisering, kontroll og datadeling blir enklere",
        "explanation": "Standardiserte dokumentformater gjør det lettere å behandle og kontrollere data maskinelt.",
        "topic": "digitalisering",
        "source": "Regnskaps- og informasjonssystemer, Rune Skjelvan, 12.10.2026, s. 17",
        "quiz": {
          "q": "Hva er den faglige effekten av standardisert e-faktura?",
          "options": [
            "Behovet for dokumentasjon forsvinner",
            "Automatisering, kontroll og datadeling blir enklere",
            "Alle fakturaer bokføres uten kontroll",
            "Kontostrengen blir overflødig"
          ],
          "correct": 1
        }
      }
    ]
  },
  {
    "id": "rrr11-kvalitetskrav-fordypning",
    "title": "Kvalitetskrav i regnskapet",
    "description": "32 krevende flashcards med korte forsider: begreper, skiller og anvendelse. Basert på brukernotater, med faglige rettelser.",
    "difficulty": "avansert",
    "cards": [
      {
        "id": "rrr11-kvalitetskrav-fordypning-1",
        "q": "Hva er de ulike kvalitetskravene?",
        "a": "Fullstendighet; gyldighet; riktig periodisering; eksistens og tilhørighet; riktig verdsettelse; korrekt klassifisering; nøyaktighet.",
        "explanation": "Dette er inndelingen fra notatene dine. Den svarer i hovedsak til regnskapspåstander i revisjon. ISA 315 skiller også ut presentasjon.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-2",
        "q": "Fullstendighet",
        "a": "Alt som skal med i regnskapet, er registrert og opplyst om.",
        "explanation": "Omfatter relevante transaksjoner, hendelser, eiendeler, gjeld, egenkapital og noteopplysninger. Kravet gjelder både resultat og balanse.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-3",
        "q": "Gyldighet",
        "a": "Registrerte transaksjoner og hendelser har faktisk skjedd og vedrører foretaket.",
        "explanation": "Gjelder både inntekter og kostnader. En virkelig transaksjon kan likevel være ugyldig i foretakets regnskap dersom den gjelder en annen enhet.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-4",
        "q": "Riktig periodisering",
        "a": "Transaksjoner og hendelser er ført i riktig regnskapsperiode.",
        "explanation": "For resultatposter er opptjening og sammenstilling sentralt. Betalingsdato og fakturadato avgjør ikke alene perioden.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-5",
        "q": "Eksistens og tilhørighet",
        "a": "Balansepostene finnes; foretaket har rettighetene til eiendelene og ansvaret for forpliktelsene.",
        "explanation": "Eksistens gjelder eiendeler, gjeld og egenkapital på balansedagen. Tilhørighet gjelder rettigheter og forpliktelser, ikke bare hvor noe fysisk befinner seg.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-6",
        "q": "Riktig verdsettelse",
        "a": "Postene er målt til riktige beløp etter gjeldende regnskapsregler.",
        "explanation": "Riktig verdi er ikke alltid markedsverdi. For balanseposter kan avskrivninger, nedskrivninger og andre estimater være nødvendige.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-7",
        "q": "Korrekt klassifisering",
        "a": "Postene er ført på riktige kontoer og i riktige regnskapskategorier.",
        "explanation": "Gjelder både resultat og balanse, for eksempel kostnadsart, omløpsmiddel eller anleggsmiddel og kortsiktig eller langsiktig gjeld.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-8",
        "q": "Nøyaktighet",
        "a": "Beløp og øvrige opplysninger er beregnet og registrert korrekt.",
        "explanation": "For eksempel riktig antall, pris og summering. «Formålstjenlig registrering» alene sier for lite om korrektheten.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-9",
        "q": "Fullstendighet eller gyldighet?",
        "a": "Fullstendighet: Er alt som skal med, tatt med? Gyldighet: Har det registrerte skjedd og vedrører det foretaket?",
        "explanation": "Skill mellom utelatte og uberettiget registrerte transaksjoner. Det samme regnskapet kan ha begge feiltypene.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-10",
        "q": "Gyldighet eller eksistens?",
        "a": "Gyldighet gjelder transaksjoner og hendelser i perioden; eksistens gjelder balanseposter på balansedagen.",
        "explanation": "En faktisk gjennomført transaksjon kan gi opphav til en balansepost som senere er opphørt.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-11",
        "q": "Eksistens eller tilhørighet?",
        "a": "Eksistens: Finnes posten? Tilhørighet: Har foretaket rettigheten eller forpliktelsen?",
        "explanation": "En fysisk opptalt vare kan tilhøre en annen virksomhet.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-12",
        "q": "Nøyaktighet eller verdsettelse?",
        "a": "Nøyaktighet gjelder korrekt beregning og registrering; verdsettelse gjelder riktig regnskapsmessig måling.",
        "explanation": "Et beløp kan være korrekt overført fra fakturaen, men likevel kreve nedskrivning.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-13",
        "q": "Periodisering eller klassifisering?",
        "a": "Periodisering gjelder hvilken periode posten føres i; klassifisering gjelder hvilken konto eller kategori den føres på.",
        "explanation": "Et kjøp kan være ført i riktig periode, men på feil konto.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-14",
        "q": "Fullstendighet: resultat og balanse?",
        "a": "Gjelder begge, blant annet inntekter og gjeld.",
        "explanation": "Utelatte salg svekker fullstendigheten i inntektene. Utelatte forpliktelser svekker fullstendigheten i gjelden. Dette er eksempler, ikke en avgrensning.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-15",
        "q": "Gyldighet: bare kostnader?",
        "a": "Nei. Kravet gjelder både inntekter og kostnader.",
        "explanation": "Fiktive salg er et eksempel på manglende gyldighet på inntektssiden.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-16",
        "q": "Eksistens: hvilke balanseposter?",
        "a": "Eiendeler, gjeld og egenkapital.",
        "explanation": "Egenkapital uttrykker residualen etter fradrag for gjeld. Den er ingen egen beholdning av penger på bankkontoen.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-17",
        "q": "Periodisering: sentrale resultatprinsipper?",
        "a": "Opptjeningsprinsippet og sammenstillingsprinsippet.",
        "explanation": "Inntekt resultatføres når den er opptjent. Utgifter kostnadsføres i samme periode som tilhørende inntekt. Transaksjonsprinsippet er også grunnleggende, men erstatter ikke disse periodiseringsprinsippene.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-18",
        "q": "Transaksjonsprinsippet",
        "a": "Transaksjoner regnskapsføres til verdien av vederlaget på transaksjonstidspunktet.",
        "explanation": "Prinsippet knytter registrering og måling til transaksjonen. Det betyr ikke at all resultatføring følger betalingsdatoen.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-19",
        "q": "Egenkapital = bankinnskudd?",
        "a": "Nei. Egenkapital er eiendeler minus gjeld.",
        "explanation": "Bankinnskudd er én type eiendel. Foretaket kan ha egenkapital bundet i varer, fordringer og driftsmidler.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-20",
        "q": "Laveste verdis prinsipp: hvilke eiendeler?",
        "a": "Hovedregelen gjelder omløpsmidler: laveste av anskaffelseskost og virkelig verdi.",
        "explanation": "Regnskapsloven § 5-2. Det finnes særregler, blant annet for enkelte finansielle eiendeler. Anleggsmidler følger andre hovedregler.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-21",
        "q": "Anleggsmidler: hovedregel for verdsettelse?",
        "a": "Anskaffelseskost, med avskrivning ved begrenset økonomisk levetid og nedskrivning ved ikke-forbigående verdifall.",
        "explanation": "Regnskapsloven § 5-3. En fornuftig avskrivningsplan og vurdering av nedskrivningsbehov inngår i riktig verdsettelse.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-22",
        "q": "Varelageret er telt. Er tilhørighet bevist?",
        "a": "Nei. Foretakets rettigheter til varene må også avklares.",
        "explanation": "Fysisk tilstedeværelse alene avgjør ikke om foretaket har rett til å balanseføre varene.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-23",
        "q": "Kan en post oppfylle ett krav og bryte et annet?",
        "a": "Ja. Kravene prøver forskjellige sider ved samme post.",
        "explanation": "En kundefordring kan eksistere og tilhøre foretaket, men være overvurdert fordi forventet tap ikke er hensyntatt.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-24",
        "q": "Et gjennomført salg er helt utelatt. Hvilket krav brytes?",
        "a": "Fullstendighet.",
        "explanation": "En transaksjon som skulle vært med, mangler. Caset gjelder utelatelse, ikke om salget er reelt.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-25",
        "q": "En oppdiktet konsulenttjeneste er kostnadsført. Hvilket krav brytes?",
        "a": "Gyldighet.",
        "explanation": "Den registrerte transaksjonen har ikke skjedd.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-26",
        "q": "En privat feriereise er ført som foretakets reisekostnad. Hvilket krav brytes?",
        "a": "Gyldighet.",
        "explanation": "Reisen kan være reell, men vedrører ikke foretakets virksomhet. Caset forutsetter at den heller ikke er en avtalt ansattfordel.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-27",
        "q": "Et opptjent desembersalg resultatføres i januar. Hvilket krav brytes?",
        "a": "Riktig periodisering.",
        "explanation": "Inntekten skal tilordnes desember når den er opptjent da. Caset forutsetter at desember og januar tilhører ulike regnskapsår.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-28",
        "q": "En maskin står i balansen, men har aldri eksistert. Hvilket krav brytes?",
        "a": "Eksistens.",
        "explanation": "Den registrerte eiendelen finnes ikke. Verdsettelse av en reell maskin er en annen vurdering.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-29",
        "q": "Andres varer på eget lager er balanseført uten at foretaket har rettighetene. Hvilket krav brytes?",
        "a": "Tilhørighet.",
        "explanation": "Varene finnes fysisk, men foretaket har ikke rettighetene som kreves for å balanseføre dem.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-30",
        "q": "En fordring er korrekt registrert, men nødvendig tapsnedskrivning mangler. Hvilket krav brytes?",
        "a": "Riktig verdsettelse.",
        "explanation": "Fordringen kan være reell og opprinnelig korrekt bokført, samtidig som balanseført beløp er for høyt.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-31",
        "q": "Et kortsiktig lån står som langsiktig gjeld. Hvilket krav brytes?",
        "a": "Korrekt klassifisering.",
        "explanation": "Forpliktelsen er plassert i feil balansegruppe. Caset forutsetter at lånet etter de aktuelle reglene skal klassifiseres som kortsiktig.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      },
      {
        "id": "rrr11-kvalitetskrav-fordypning-32",
        "q": "En faktura på 54 000 er registrert med 45 000. Hvilket krav brytes?",
        "a": "Nøyaktighet.",
        "explanation": "Caset gjelder en feilregistrering av beløpet, med korrekt periode og konto forutsatt.",
        "topic": "kvalitetskrav",
        "difficulty": "avansert",
        "source": "Brukernotater; ISA 315 (revidert 2019), A189–A190; regnskapsloven §§ 4-1, 5-2 og 5-3. Kontrollert 28.10.2026."
      }
    ]
  }
];
