// Delt tema-mapping for SAM3.
// Brukes av index, eksamensradar og avslutningssidene for kryss-kobling
// mellom radarens prioriteringer, formelquiz-dekk og flashcard-dekk.
window.SAM3_TOPICS=[
  {id:'kortsiktig-makro', name:'Kortsiktig makro under sjokk', short:'Kortsiktig makro', score:9.3,
   desc:'AS-AD/IS-MP på olje-, energi-, handels- eller usikkerhetssjokk.',
   quizDeck:'kortsikt', flashDeck:'d8'},
  {id:'apen-okonomi', name:'Åpen økonomi, kronekurs og trilemma', short:'Åpen økonomi', score:9.0,
   desc:'Kronekurs, UIP, kapitalbevegelser, nettoeksport og importert inflasjon.',
   quizDeck:'apen', flashDeck:'d11'},
  {id:'phillips', name:'Forventninger, Phillips og troverdighet', short:'Phillips og forventninger', score:8.5,
   desc:'Inflasjonsforventninger, Phillipskurve, Fisher og pengepolitisk troverdighet.',
   quizDeck:'kortsikt', flashDeck:'d7'},
  {id:'vekst', name:'Vekst, produktivitet, demografi og TFP', short:'Vekst og TFP', score:7.9,
   desc:'Solow, Romer, TFP, demografi, FoU og strukturell produktivitet.',
   quizDeck:'vekst', flashDeck:'d3'},
  {id:'arbeidsmarked', name:'Arbeidsmarked og naturlig ledighet', short:'Arbeidsmarked', score:7.5,
   desc:'Tilbud/etterspørsel, badekarmodell, matching, Okun og arbeidskraftmangel.',
   quizDeck:'arbeid', flashDeck:'d5'},
  {id:'bnp-regnskap', name:'BNP, regnskap og produksjonsgap', short:'BNP og regnskap', score:6.9,
   desc:'BNP-identiteter, sparing-investering, produksjonsgap og driftsbalanse.',
   quizDeck:'regnskap', flashDeck:'d1'},
  {id:'finanspolitikk', name:'Finanspolitikk og oljepenger', short:'Finanspolitikk', score:6.6,
   desc:'Oljepengebruk, handlingsregel, crowding out og stabiliseringspolitikk.',
   quizDeck:'finans', flashDeck:'d12'},
  {id:'baerekraft', name:'Bærekraft, grønt skifte og institusjoner', short:'Bærekraft', score:5.8,
   desc:'Drøftingsdimensjon i vekst, oljeavhengighet og finanspolitikk.',
   quizDeck:null, flashDeck:null}
];

// Hjelpefunksjoner gjenbrukt på tvers av sidene.
window.SAM3_LINKS={
  quizUrl:(deck)=>deck?`formelquiz.html?deck=${encodeURIComponent(deck)}`:null,
  flashUrl:(deck)=>deck?`flashcards.html?deck=${encodeURIComponent(deck)}`:null,
  topicById:(id)=>window.SAM3_TOPICS.find(t=>t.id===id),
  topicByQuizDeck:(deck)=>window.SAM3_TOPICS.find(t=>t.quizDeck===deck),
  topicByFlashDeck:(deck)=>window.SAM3_TOPICS.find(t=>t.flashDeck===deck)
};
