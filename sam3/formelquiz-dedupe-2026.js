// Rydder og integrerer formelquiz-datasettet etter at det utvidede formelarket er lastet.
// Målet er ett kort per faglig unike formel/variant, uten dobbeltspørsmål.
(function(){
  const addDeck=(d)=>{ if(!decks.some(x=>x.id===d.id)) decks.push(d); };
  const removeCards=(ids)=>ids.forEach(id=>{
    let i=cards.findIndex(c=>c.id===id);
    while(i!==-1){ cards.splice(i,1); i=cards.findIndex(c=>c.id===id); }
    if(typeof symbolQuiz!=='undefined') delete symbolQuiz[id];
  });
  const upsert=(card)=>{
    const old=cards.find(c=>c.id===card.id);
    if(old) Object.assign(old, card);
    else cards.push(card);
  };
  const setDeck=(ids,deck)=>ids.forEach(id=>{ const c=cards.find(x=>x.id===id); if(c)c.deck=deck; });

  addDeck({id:'kortsikt',title:'Kortsiktig makro',desc:'IS-MP, Phillips, AD-AS og multiplikator'});
  addDeck({id:'finans',title:'Finanspolitikk',desc:'Gjeld, handlingsregel og budsjett'});
  if(window.SAM3_TOPICS){
    const kort=window.SAM3_TOPICS.find(x=>x.id==='kortsiktig-makro'); if(kort) kort.quizDeck='kortsikt';
    const ph=window.SAM3_TOPICS.find(x=>x.id==='phillips'); if(ph) ph.quizDeck='kortsikt';
    const fin=window.SAM3_TOPICS.find(x=>x.id==='finanspolitikk'); if(fin) fin.quizDeck='finans';
  }

  // Fjern rene dobbeltkort. Innholdet er enten integrert i eksisterende kort nedenfor,
  // eller dekket av en tydeligere variant fra det utvidede formelarket.
  removeCards([
    'nx-si',              // integrert i S = I + NX-kortet som NX = S − I
    'output-gap-percent', // prosentvarianten forklares i output-gap-kortet
    'okun-sam3',          // integrert i Okun-kortet
    'is-sam3',            // integrert i is-curve
    'mp-sam3',            // integrert i mp-rule
    'ad-sam3',            // integrert i ad-curve
    'as-sam3',            // samme ligning som Phillips med adaptive forventninger
    'rer-norway',         // integrert i realkurs
    'uip-risk',           // integrert i uip
    'solow-y',            // samme som y = Ak^α / per-worker
    'romer-ideas'         // erstattet av nivåform og vekstrateform: romer-delta-a og romer-ga
  ]);

  upsert({
    id:'s-i-nx',deck:'regnskap',topic:'Sparing i åpen økonomi',
    q:'Hva er sammenhengen mellom sparing, investering og nettoeksport?',
    hint:'Bruk Y=C+I+G+NX og S=Y−C−G.',
    m:'S = {{0}} + {{1}}',a:[['I'],['NX','CA']],answer:'S = I + NX  ⇔  NX = S − I',
    explain:'I åpen økonomi kan sparing finansiere investering hjemme eller netto utlån til utlandet. Samme identitet kan også skrives NX = S − I.',
    derive:['Start: Y = C + I + G + NX.','Flytt C og G til venstre: Y − C − G = I + NX.','Siden S = Y − C − G får vi S = I + NX, som også gir NX = S − I.']
  });

  upsert({
    id:'output-gap',deck:'regnskap',topic:'Produksjonsgap',
    q:'Hva er produksjonsgapet?',hint:'Faktisk minus potensiell produksjon, delt på potensiell produksjon.',
    m:'Ŷ<sub>t</sub> = ({{0}} − {{1}}) / {{2}}',
    a:[['Yt','Y_t'],['Ybar_t','Ȳt','Ypot','barYt','Y*'],['Ybar_t','Ȳt','Ypot','barYt','Y*']],
    answer:'Ŷ_t = (Y_t − Ȳ_t)/Ȳ_t. I prosent: ((Y_t − Ȳ_t)/Ȳ_t)·100.',
    explain:'Y_t er faktisk BNP/produksjon. Ȳ_t er potensiell eller trendmessig produksjon. Ŷ_t er produksjonsgapet.',
    derive:['Mål avviket: Y_t − Ȳ_t.','Del på Ȳ_t for å få et relativt avvik.','Gang med 100 hvis svaret skal stå i prosent.']
  });

  upsert({
    id:'okun',deck:'arbeid',topic:'Okuns lov',
    q:'Hva er Okuns lov?',hint:'Produksjonsgap og ledighetsgap beveger seg motsatt vei.',
    m:'<span class="blank tilde">{{0}}</span> = −{{1}}({{2}} − <span class="blank star">{{3}}</span>)',
    a:[['Y~','y~','Ytilde','Ŷ','Yhat','Ỹ'],['β','beta','2'],['u'],['u*','u^*']],
    answer:'Ŷ = −β(u−u*)  ⇔  u−u* = −β̃Ŷ. I SAM3 brukes ofte u−u* ≈ −0,5Ŷ.',
    explain:'Ŷ er produksjonsgapet, u er faktisk ledighet, u* er naturlig ledighet, og β/β̃ måler styrken i sammenhengen. Positivt produksjonsgap gir lavere ledighet enn normalt.',
    derive:['Når u > u*, er økonomien svak og produksjonsgapet negativt.','Derfor har sammenhengen minusfortegn.','Forelesningsvarianten u−u*≈−0,5Ŷ er samme idé med ledighetsgapet på venstre side.']
  });

  upsert({
    id:'phillips',deck:'kortsikt',topic:'Phillipskurve',
    q:'Hva er Phillipskurven med forventninger og sjokk?',
    hint:'Faktisk inflasjon er forventet inflasjon pluss press i økonomien pluss kostnadssjokk.',
    m:'π<sub>t</sub> = {{0}} + {{1}}·{{2}} + {{3}}',
    a:[['πe_t','π_t^e','πᵉt','pi_e'],['v','κ','kappa'],['Ŷt','Ŷ_t','Yhat_t','Ỹt','Y~'],['ot','o_t']],
    answer:'π_t = π_t^e + vŶ_t + o_t',
    explain:'π_t er inflasjon, π_t^e forventet inflasjon, v/κ følsomhet for produksjonsgapet, Ŷ_t produksjonsgap, og o_t kostnads-/tilbudssjokk.',
    derive:['Forventet inflasjon er utgangspunktet.','Positivt produksjonsgap gir økt prispress.','Kostnads- og tilbudssjokk flytter inflasjonen direkte.']
  });

  upsert({
    id:'is-curve',deck:'kortsikt',topic:'IS-kurven',
    q:'Hva er IS-kurven i SAM3-form?',
    hint:'Produksjonsgapet avhenger negativt av realrenten relativt til normal realrente.',
    m:'Ŷ<sub>t</sub> = {{0}} − {{1}}(R<sub>t</sub> − {{2}})',
    a:[['abar','ā','a_bar'],['bbar','b','b_bar'],['rbar','r̄','r_bar']],
    answer:'Ŷ_t = ā − b̄(R_t − r̄)',
    explain:'Ŷ_t er produksjonsgap. ā samler autonome etterspørselsforhold/sjokk. b̄ er rentefølsomhet. R_t er realrente. r̄ er normal/nøytral realrente.',
    derive:['Høyere realrente demper konsum, investering og etterspørsel.','Derfor faller produksjonsgapet når R_t stiger relativt til r̄.']
  });

  upsert({
    id:'mp-rule',deck:'kortsikt',topic:'MP-kurven',
    q:'Hva er den enkle MP-kurven/Taylor-regelen i SAM3?',
    hint:'Realrenten reagerer på inflasjonsgapet.',
    m:'R<sub>t</sub> = {{0}} + {{1}}(π<sub>t</sub> − {{2}})',
    a:[['rbar','r̄','r_bar'],['mbar','m','m_bar'],['pibar','πbar','π̄','pi_bar']],
    answer:'R_t = r̄ + m̄(π_t − π̄)',
    explain:'R_t er realrente, r̄ normal realrente, m̄ sentralbankens reaksjonsstyrke, π_t inflasjon og π̄ inflasjonsmålet.',
    derive:['Sentralbanken setter høyere realrente når inflasjonen er over målet.','Hvor kraftig renten økes bestemmes av m̄.']
  });

  upsert({
    id:'ad-curve',deck:'kortsikt',topic:'AD-kurven',
    q:'Hva blir AD-kurven når MP settes inn i IS?',
    hint:'Sett R_t − r̄ = m̄(π_t − π̄) inn i IS.',
    m:'Ŷ<sub>t</sub> = {{0}} − {{1}}{{2}}(π<sub>t</sub> − {{3}})',
    a:[['abar','ā','a_bar'],['bbar','b','b_bar'],['mbar','m','m_bar'],['pibar','πbar','π̄','pi_bar']],
    answer:'Ŷ_t = ā − b̄m̄(π_t − π̄)',
    explain:'AD viser negativ sammenheng mellom inflasjon og produksjonsgap fordi høyere inflasjon gir høyere rente og lavere etterspørsel.',
    derive:['IS: Ŷ_t = ā − b̄(R_t − r̄).','MP: R_t − r̄ = m̄(π_t − π̄).','Sett MP inn i IS.']
  });

  upsert({
    id:'realkurs',deck:'apen',topic:'Realvalutakurs',
    q:'Hva er realvalutakursen når S er kroner per utenlandsk valuta?',
    hint:'Nominell kurs ganger utenlandsk prisnivå delt på norsk prisnivå.',
    m:'Q = {{0}} · {{1}} / {{2}}',a:[['S','e'],['P*','P^*'],['P']],
    answer:'Q = SP*/P',
    explain:'Q er realvalutakurs. S er nominell valutakurs i kroner per utenlandsk valuta. P* er utenlandsk prisnivå. P er norsk prisnivå.',
    derive:['Gjør utenlandske priser om til kroner: SP*.','Sammenlign med norske priser ved å dele på P.','Med norsk konvensjon betyr S opp svakere krone.']
  });

  upsert({
    id:'uip',deck:'apen',topic:'UIP',
    q:'Hva er udekket renteparitet med risikopremie?',
    hint:'Innenlandsk rente lik utenlandsk rente pluss forventet depresiering pluss risikopremie.',
    m:'i = {{0}} + ({{1}} − {{2}})/{{3}} + {{4}}',
    a:[['i*','i^*'],['S_e','S^e_{t+1}','Se'],['S_t','St','S'],['S_t','St','S'],['ρ','rho']],
    answer:'i = i* + (S^e_{t+1} − S_t)/S_t + ρ',
    explain:'i er innenlandsk rente, i* utenlandsk rente, S_t dagens valutakurs, S^e_{t+1} forventet fremtidig valutakurs, og ρ risikopremie.',
    derive:['Investorer sammenligner forventet avkastning hjemme og ute.','Forventet kronesvekkelse er (S^e_{t+1}−S_t)/S_t.','Risikopremien ρ legges til hvis norske aktiva krever ekstra kompensasjon.']
  });

  setDeck(['phillips-adaptive','phillips-delta','phillips-unemployment','multiplier','multiplier-tax','multiplier-import','asad-steady-y','asad-steady-pi','asad-steady-r'],'kortsikt');

  Object.assign(symbolQuiz,{
    's-i-nx':{formula:'S = I + NX ⇔ NX = S − I',items:[['S',['sparing','nasjonal sparing']],['I',['investering','investeringer']],['NX',['nettoeksport','eksport minus import']]]},
    'output-gap':{formula:'Ŷ_t = (Y_t − Ȳ_t)/Ȳ_t',items:[['Ŷ_t',['produksjonsgap']],['Y_t',['faktisk bnp','faktisk produksjon']],['Ȳ_t',['potensiell produksjon','trendproduksjon','potensielt bnp']]]},
    okun:{formula:'Ŷ = −β(u−u*) ⇔ u−u*≈−0,5Ŷ',items:[['Ŷ',['produksjonsgap']],['β',['okun-koeffisient','følsomhet']],['u',['ledighet','ledighetsrate']],['u*',['naturlig ledighet']]]},
    phillips:{formula:'π_t = π_t^e + vŶ_t + o_t',items:[['π_t',['inflasjon','faktisk inflasjon']],['π_t^e',['forventet inflasjon']],['v',['følsomhet','respons på produksjonsgap']],['Ŷ_t',['produksjonsgap']],['o_t',['kostnadssjokk','tilbudssjokk','inflasjonssjokk']]]},
    'is-curve':{formula:'Ŷ_t = ā − b̄(R_t − r̄)',items:[['Ŷ_t',['produksjonsgap']],['ā',['autonom etterspørsel','etterspørselssjokk']],['b̄',['rentefølsomhet']],['R_t',['realrente']],['r̄',['normal realrente','nøytral realrente']]]},
    'mp-rule':{formula:'R_t = r̄ + m̄(π_t − π̄)',items:[['R_t',['realrente']],['r̄',['normal realrente','nøytral realrente']],['m̄',['reaksjonsstyrke','pengepolitisk respons']],['π_t',['inflasjon']],['π̄',['inflasjonsmål']]]},
    'ad-curve':{formula:'Ŷ_t = ā − b̄m̄(π_t − π̄)',items:[['Ŷ_t',['produksjonsgap']],['ā',['autonom etterspørsel']],['b̄',['rentefølsomhet']],['m̄',['pengepolitisk respons']],['π_t',['inflasjon']],['π̄',['inflasjonsmål']]]},
    realkurs:{formula:'Q = SP*/P',items:[['Q',['realvalutakurs','realkurs']],['S',['nominell valutakurs','kroner per utenlandsk valuta']],['P*',['utenlandsk prisnivå']],['P',['innenlandsk prisnivå','norsk prisnivå']]]},
    uip:{formula:'i = i* + (S^e_{t+1}−S_t)/S_t + ρ',items:[['i',['innenlandsk rente','norsk rente']],['i*',['utenlandsk rente']],['S_t',['dagens valutakurs']],['S^e_{t+1}',['forventet fremtidig valutakurs']],['ρ',['risikopremie']]]}
  });

  // En siste sikkerhetsventil: dersom to kort likevel har samme id etter fremtidige endringer,
  // behold første og fjern resten. Dette endrer ikke faglig innhold, bare unngår teknisk duplisering.
  const seen=new Set();
  for(let i=cards.length-1;i>=0;i--){
    if(seen.has(cards[i].id)) cards.splice(i,1);
    else seen.add(cards[i].id);
  }
})();
