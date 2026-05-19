// SAM3 Flashcards — interaktiv læringsmodus
// Visuell refresh + localStorage-rating + "Øv på svake"-modus + avslutningsside.
(function(){
const $=id=>document.getElementById(id);
const STORE_KEY='sam3_flash_v1';
const TOPICS=window.SAM3_TOPICS||[];
const LINKS=window.SAM3_LINKS||{};

// ===== Datadekomprimering =====
function unzipSAM3(s){
  const bin=atob(s),bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return JSON.parse(pako.ungzip(bytes,{to:'string'}));
}
let decks=window.SAM3_FLASHCARD_DECKS||[];
if(!decks.length&&window.SAM3_FLASHCARDS_GZIP){
  try{decks=unzipSAM3(window.SAM3_FLASHCARDS_GZIP.replace('o7eksowow8ez','o7eksow8ez'));}
  catch(e){console.error('SAM3 datafeil',e);}
}

// ===== Persistens =====
function loadStore(){
  try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{}');}catch{return{};}
}
function saveStore(s){
  try{localStorage.setItem(STORE_KEY,JSON.stringify(s));}catch{}
}
let store=loadStore();
function cardKey(deckId,idx){return deckId+':'+idx;}
function getRating(deckId,idx){return store[cardKey(deckId,idx)]?.lastRating||null;}
function setRating(deckId,idx,rating){
  const k=cardKey(deckId,idx);
  const e=store[k]||{counts:{bad:0,mid:0,good:0}};
  e.lastRating=rating;
  e.counts=e.counts||{bad:0,mid:0,good:0};
  e.counts[rating]=(e.counts[rating]||0)+1;
  e.lastSeen=new Date().toISOString();
  store[k]=e;
  saveStore(store);
}
function deckProgress(deck){
  const total=deck.cards.length;
  let rated=0,bad=0,mid=0,good=0;
  for(let i=0;i<total;i++){
    const r=getRating(deck.id,i);
    if(r){rated++;if(r==='bad')bad++;else if(r==='mid')mid++;else if(r==='good')good++;}
  }
  return {total,rated,bad,mid,good,weak:bad+mid};
}

// ===== State =====
let current=null,idx=0,flipped=false,mode='all',visibleCards=[],round=[];
const hub=$('hub'),study=$('study'),summary=$('summary'),grid=$('deck-grid'),search=$('search');

// ===== Hub render =====
function renderDecks(){
  const q=(search.value||'').toLowerCase();
  grid.innerHTML='';
  const list=decks.filter(d=>(d.num+d.title+d.desc+d.difficulty).toLowerCase().includes(q));
  list.forEach(d=>{
    const p=deckProgress(d);
    const weakBadge=p.weak>0?`<span class="weakBadge">${p.weak} svake</span>`:'';
    const btn=document.createElement('button');
    btn.className='deck';
    btn.innerHTML=`
      <div class="deck-head"><span class="num">${d.num||''}</span><span class="pill">${d.difficulty||''}</span></div>
      <div class="deck-title">${d.title}</div>
      <div class="desc">${d.desc||''}</div>
      <div class="foot"><span>${d.cards.length} kort${p.rated?` · ${p.rated} ratet`:''}</span>${weakBadge||'<span class="open">Start →</span>'}</div>`;
    btn.onclick=()=>start(d.id);
    grid.appendChild(btn);
  });
  $('stat-decks').textContent=decks.length;
  const totalCards=decks.reduce((s,d)=>s+d.cards.length,0);
  $('stat-cards').textContent=totalCards;
  const totalRated=decks.reduce((s,d)=>s+deckProgress(d).rated,0);
  $('stat-ready').textContent=totalRated;
  if(!grid.children.length){
    grid.innerHTML='<div class="status-msg error">Ingen kort kunne lastes. Prøv hard refresh.</div>';
  }
}

// ===== Study start =====
function start(deckId){
  current=decks.find(d=>d.id===deckId);
  if(!current)return;
  idx=0;flipped=false;round=[];mode='all';
  hub.classList.add('hidden');
  summary.className='summary';
  study.classList.add('active');
  $('study-title').textContent=(current.num?current.num+' — ':'')+current.title;
  updateModeSwitch();
  refreshVisibleCards();
  if(!visibleCards.length){
    mode='all';
    updateModeSwitch();
    refreshVisibleCards();
  }
  show();
}

function refreshVisibleCards(){
  if(mode==='weak'){
    visibleCards=current.cards.map((c,i)=>({c,i})).filter(x=>{
      const r=getRating(current.id,x.i);
      return r==='bad'||r==='mid';
    });
  }else{
    visibleCards=current.cards.map((c,i)=>({c,i}));
  }
}

function updateModeSwitch(){
  const p=deckProgress(current);
  const allBtn=$('mode-all'),weakBtn=$('mode-weak');
  allBtn.classList.toggle('active',mode==='all');
  weakBtn.classList.toggle('active',mode==='weak');
  weakBtn.textContent=`Bare svake (${p.weak})`;
  weakBtn.disabled=p.weak===0;
}

function show(){
  if(!visibleCards.length){
    finishRound();
    return;
  }
  const entry=visibleCards[idx];
  const c=entry.c;
  flipped=false;
  $('card').classList.remove('flipped');
  $('tag').textContent=c.tag||'SAM3';
  $('label-front').textContent='Spørsmål';
  $('label-back').textContent='Svar';
  $('front-text').innerHTML=c.q;
  $('back-text').innerHTML=c.a;
  $('hint-front').textContent='Klikk for å se svar  ·  mellomrom = snu';
  $('hint-back').textContent='Klikk for å gå tilbake  ·  1 = vanskelig  ·  2 = halvveis  ·  3 = kunne det';
  $('counter').textContent=(idx+1)+' / '+visibleCards.length;
  $('bar').style.width=((idx+1)/visibleCards.length*100)+'%';
  updateRatingButtons();
}

function updateRatingButtons(){
  document.querySelectorAll('.rate').forEach(b=>b.disabled=!flipped);
  $('ratingHint').textContent=flipped?'Vurder hvor godt du kunne kortet':'Snu kortet for å rate svaret';
}

function flip(){
  flipped=!flipped;
  $('card').classList.toggle('flipped',flipped);
  updateRatingButtons();
}

function rate(level){
  if(!flipped||!current||!visibleCards.length)return;
  const entry=visibleCards[idx];
  setRating(current.id,entry.i,level);
  round.push({cardIdx:entry.i,q:entry.c.q,rating:level});
  next();
}

function next(){
  if(!visibleCards.length){finishRound();return;}
  if(idx>=visibleCards.length-1){finishRound();return;}
  idx++;show();
}
function prev(){
  if(!visibleCards.length)return;
  if(idx===0)return;
  idx--;show();
}

function switchMode(newMode){
  if(mode===newMode)return;
  mode=newMode;
  idx=0;flipped=false;
  refreshVisibleCards();
  updateModeSwitch();
  if(!visibleCards.length){
    finishRound();
  }else{
    summary.className='summary';
    show();
  }
}

// ===== Avslutningsside =====
function donutSvg(pct,color){
  const s=112,r=44,c=2*Math.PI*r,p=Math.max(0,Math.min(100,pct||0)),off=c*(1-p/100);
  return `<svg class="donut" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" aria-hidden="true"><circle cx="${s/2}" cy="${s/2}" r="${r}" class="donut-track"/><circle cx="${s/2}" cy="${s/2}" r="${r}" class="donut-value" style="stroke:${color};stroke-dasharray:${c.toFixed(2)};stroke-dashoffset:${off.toFixed(2)}"/><text x="${s/2}" y="${s/2+1}" text-anchor="middle" dominant-baseline="central" class="donut-pct">${Math.round(p)}%</text></svg>`;
}

function tagline(goodPct,total){
  if(total===0)return 'Du har ikke ratet noen kort enda — gå tilbake og prøv på nytt.';
  if(goodPct>=90)return 'Imponerende — du sitter trygt med begrepene.';
  if(goodPct>=70)return 'Solid. Gå over de svake kortene en gang til.';
  if(goodPct>=40)return 'God start. Bruk «Bare svake» og kjør en runde til.';
  return 'Tett på stoffet — bla gjennom kortene én gang til og bruk figurene i quizen.';
}

function finishRound(){
  const total=round.length;
  const bad=round.filter(r=>r.rating==='bad').length;
  const mid=round.filter(r=>r.rating==='mid').length;
  const good=round.filter(r=>r.rating==='good').length;
  const goodPct=total?Math.round(100*good/total):0;
  const overallPct=total?Math.round(100*(good*1+mid*0.5)/total):0;

  const heroTitle=total?`${good} av ${total} kort sitter`:'Ingen kort ratet enda';
  const heroSub=tagline(goodPct,total);

  const weakRound=round.filter(r=>r.rating!=='good');
  const weakHtml=weakRound.length?`<div class="summarySection"><h3>Kort som trenger mer øving</h3><div class="weakList">${weakRound.slice(0,8).map(w=>`<div class="weakItem"><span class="chip ${w.rating}">${w.rating==='bad'?'Vanskelig':'Halvveis'}</span><p>${w.q}</p></div>`).join('')}</div></div>`:'';

  const perCardHtml=total?`<details class="summaryDetails"><summary>Alle ratet i runden (${total})</summary><div class="summaryList">${round.map(r=>`<div class="summaryItem ${r.rating}"><b>${r.rating==='good'?'✅':r.rating==='mid'?'🟡':'❌'} ${r.q}</b></div>`).join('')}</div></details>`:'';

  // Kryss-kobling: tilhørende quiz-deck via topic-mapping
  const topic=LINKS.topicByFlashDeck?LINKS.topicByFlashDeck(current.id):null;
  const quizCta=topic&&topic.quizDeck&&LINKS.quizUrl?`<a class="btn secondary" href="${LINKS.quizUrl(topic.quizDeck)}">Test deg på formler →</a>`:'';
  const weakInDeck=deckProgress(current).weak;
  const weakModeBtn=weakInDeck>0&&mode==='all'?`<button class="btn secondary" id="sumWeakBtn">Bare svake (${weakInDeck}) →</button>`:'';

  const distHtml=total?`<div class="distBar"><div class="d-bad" style="width:${(bad/total)*100}%"></div><div class="d-mid" style="width:${(mid/total)*100}%"></div><div class="d-good" style="width:${(good/total)*100}%"></div></div><div class="distLegend"><span><i class="i-bad"></i>${bad} vanskelig</span><span><i class="i-mid"></i>${mid} halvveis</span><span><i class="i-good"></i>${good} kunne det</span></div>`:'';

  summary.className='summary show';
  summary.innerHTML=`<div class="summaryCard">
    <header class="summaryHero">
      <span class="summaryEyebrow">Runde fullført</span>
      <h2>${heroTitle}</h2>
      <p class="summaryTagline">${heroSub}</p>
    </header>
    <div class="scoreCards">
      <div class="scoreCard">
        <span class="scoreCard-label">Treff</span>
        ${donutSvg(overallPct,'#dc2626')}
        <div class="scoreCard-meta"><b>${good}<span class="of">/ ${total}</span></b><span>helt riktige</span></div>
        <div class="scoreCard-foot">${bad+mid} kort trenger mer øving</div>
      </div>
      <div class="scoreCard">
        <span class="scoreCard-label">Fordeling</span>
        ${distHtml}
      </div>
    </div>
    ${weakHtml}
    ${perCardHtml}
    <div class="summaryActions">
      <button class="btn primary" id="sumRestartBtn">Start runden på nytt</button>
      ${weakModeBtn}
      <button class="btn ghost" id="sumHubBtn">← Alle dekker</button>
      ${quizCta}
    </div>
  </div>`;
  summary.scrollIntoView({behavior:'smooth',block:'start'});
  $('sumRestartBtn').onclick=()=>{idx=0;round=[];summary.className='summary';refreshVisibleCards();updateModeSwitch();if(visibleCards.length)show();};
  $('sumHubBtn').onclick=backToHub;
  const sw=$('sumWeakBtn');if(sw)sw.onclick=()=>{round=[];switchMode('weak');};
}

function backToHub(){
  study.classList.remove('active');
  hub.classList.remove('hidden');
  summary.className='summary';
  current=null;round=[];
  renderDecks();
}

// ===== Init =====
document.getElementById('card').onclick=flip;
document.getElementById('back-to-hub').onclick=backToHub;
document.getElementById('mode-all').onclick=()=>switchMode('all');
document.getElementById('mode-weak').onclick=()=>switchMode('weak');
document.getElementById('prev').onclick=prev;
document.getElementById('next').onclick=next;
document.querySelectorAll('.rate').forEach(b=>{
  b.onclick=()=>rate(b.dataset.rating);
});
search.oninput=renderDecks;

document.addEventListener('keydown',e=>{
  if(!current){
    if(e.key==='Escape'&&summary.classList.contains('show')){summary.className='summary';}
    return;
  }
  const tag=document.activeElement?.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA')return;
  if(e.key===' '){e.preventDefault();flip();return;}
  if(e.key==='ArrowRight'){e.preventDefault();next();return;}
  if(e.key==='ArrowLeft'){e.preventDefault();prev();return;}
  if(e.key==='Escape'){e.preventDefault();backToHub();return;}
  if(flipped&&(e.key==='1'||e.key==='2'||e.key==='3')){
    e.preventDefault();
    rate(e.key==='1'?'bad':e.key==='2'?'mid':'good');
  }
});

// URL-param ?deck=<id> hopper rett inn
const paramDeck=new URLSearchParams(location.search).get('deck');
renderDecks();
if(paramDeck&&decks.find(d=>d.id===paramDeck)){
  start(paramDeck);
}
})();
