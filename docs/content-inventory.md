# Innhold etter oppryddingen

Kontrollert 20. oktober 2026, RRR11 oppdatert 21. oktober. Oversikten gjelder bhflashcards.no, ikke Kompass. Korttallene er standardbiblioteket uten brukeropprettede dekk. Små begrepsdekk er øvingsmateriale, ikke komplette fagpakker.

| Fag | Beholdt innhold |
| --- | --- |
| RRR11 | 110 flashcards med quiz i åtte dekk: COSO separat (30 kort) og sju samlinger fra Aleksander Moe (80 kort) om regnskapssystemer, kvalitetskrav, ansvar/styring, risiko/kontroll, salg/innkjøp, lager/lønn/driftsmidler og ERP/data/AI. Forklaringer og kildehenvisninger følger hvert kort. Fire opplastede forelesningsnotater og én modellbesvarelse i Fagstudio. |
| MET3 | 146 kildebaserte Excel-kort i 13 dekk, metodeoversikt og kildehenvisning. |
| RET14 | 427 kort i 15 dekk, quiz, pensumoversikt og eksisterende eksamensradar. Ingen publisert A-besvarelse i arkivet. |
| SOL1 | 533 kort i 13 dekk i fellesbiblioteket, egne teori- og skriveverktøy, seks eksamensdokumenter fra V25/V26. |
| SAM3 | 171 kort i 14 dekk i fellesbiblioteket, hvorav 166 kort fra den dedikerte katalogen. Formelverktøy, modeller, eksisterende radar og seks eksamensdokumenter fra V25/V26. |
| SAM2 | Personlig memoar med DOCX, eksisterende oppgaveprioritering/radar og ti begrepskort i to dekk. |
| MAT10 | Fire metodekort, tre konkrete spørsmål/svar på fagsiden og metodeoversikt. |
| MET2 | Fem begrepskort, tre konkrete spørsmål/svar på fagsiden og metodeoversikt. |
| BED1 | Forfatterens memoar, tre H25-dokumenter og fire begrepskort. |
| RET1A | Forfatterens memoar og metodeskisse, to H25-dokumenter og fire begrepskort. |
| MET1 | Forfatterens memoar og fire begrepskort. |
| SAM1A | Forfatterens memoar og forklaringsskisse. Ingen flashcardmodul før et dekk for riktig fag finnes. |
| KOM1 | Forfatterens memoar. Fire skrivekort finnes i biblioteket; fagsiden har ingen eksamens- eller flashcardknapp. |

De 17 lokale eksamensfilene ligger i seks pakker for SOL1, SAM3, BED1 og RET1A. RRR11-dokumentene ligger separat i `subject_files`. Egne notater, øvingsresultater, tilganger og kalenderoppføringer er beholdt. De 11 faktisk publiserte Haugnes-vurderingene i `subject_haugnes_ratings` er også beholdt; bare de hardkodede reservevurderingene er fjernet.

## Fjernet

- Automatisk opprettede eksempelnotater, fiktive modellbesvarelser, generiske eksempeloppgaver og tomme ressurskort merket «kommer».
- 66 malblokker i `subject_page_blocks`, generisk memo-/eksamensrådtekst i 11 innebygde fag og «Kommer...» i RRR11s eksamensfelt. MET3s seks kildebaserte blokker og RRR11s egne tekster er beholdt.
- Ti publiserte databasepakker uten dokumenter er avpublisert. ID-er og tilganger er beholdt. Arkivet viser fortsatt de seks lokale pakkene som faktisk har filer.
- 11 importstubbe-dekk med to kort hver, 11 generiske katalogoppgaver, oppdiktet eksamensvekting, importløfter og automatiske anbefalinger. De konkrete hoveddekkene er beholdt.
- Det gamle SAM1A-dekket om mikroøkonomi: det beskrev feil fag. SAM1A er Etikk, økonomi og bærekraft.
- Hardkodede mestringsprosenter, korttall, fagrangeringer, «populære»-besvarelser uten filer, demoøkter, ubekreftede markedsføringstall og kontroller for funksjoner som ikke var implementert.

## Videre vedlikehold

Nye fag starter uten eksempelinnhold. Studentene ser bare fylte seksjoner; administratorer kan fortsatt legge inn innhold i Fagstudio. Ved publisering skal nye dokumenter bli synlige umiddelbart, med de eksisterende tilgangsreglene.

Den automatiske importen fra gamle nettlesermaler er avviklet, slik at den ikke gjenoppretter demoer eller overskriver nyere publiseringer. Eksisterende lokale data er ikke slettet. Generering av læringskatalogen krever ikke lenger fylltekst i tomme felt.

Dataryddingen er gjentakbar i `data/remove-placeholder-content.sql`; konkrete radverdier/tidsstempler beskytter senere endringer. Databasesnapshot før ryddingen er lagret lokalt under `/Users/birkhaugnes/.codex/backups/bhflashcards-20261020/`, utenfor det offentlige repoet.

Eksisterende fagstoff, eksamensradarer og oppgaveprioriteringer er beholdt som materiale. Oppryddingen er ikke en ny faglig kvalitetssikring av alle deres påstander. Ved videre utbygging bør eksamensvekter knyttes til konkrete oppgaver, år og kilder.
