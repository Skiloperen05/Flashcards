// SAM3 Multiple choice — 4-alternatives quiz reuses formelquiz-data.
(function(){
const $=id=>document.getElementById(id);
const LINKS=window.SAM3_LINKS||{};

let queue=[],idx=0,answered=false,picked=null,round=[],deckFilter='all',count=10;

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function pickDistractors(card){
  // Forsøk å hente fra samme dekk, fallback til alle
  const pool=cards.filter(c=>c.id!==card.id&&(c.deck===card.deck||card.deck==='all'));
  let candidates=pool.length>=3?pool:cards.filter(c=>c.id!==card.id);
  shuffle(candidates);
  return candidates.slice(0,3).map(c=>c.answer);
}

function renderDeckSel(){
  const sel=$('deckSel');
  sel.innerHTML=decks.map(d=>`<option value="${d.id}">${d.title}</option>`).join('');
}

function startQuiz(){
  deckFilter=$('deckSel').value;
  count=parseInt($('countSel').value,10);
  const pool=deckFilter==='all'?cards.slice():cards.filter(c=>c.deck===deckFilter);
  if(!pool.length){alert('Ingen formler i dette dekket.');return;}
  shuffle(pool);
  const n=count===0?pool.length:Math.min(count,pool.length);
  queue=pool.slice(0,n).map(c=>{
    const alts=shuffle([c.answer,...pickDistractors(c)]);
    return {card:c,alts,correctIdx:alts.indexOf(c.answer)};
  });
  idx=0;round=[];
  $('startPanel').style.display='none';
  $('quizPanel').style.display='block';
  $('summary').className='summary';
  $('deckTitle').textContent=(decks.find(d=>d.id===deckFilter)?.title||'Alle formler')+' · MC';
  show();
}

function show(){
  if(idx>=queue.length){finish();return;}
  const q=queue[idx];
  answered=false;picked=null;
  $('counter').textContent=`${idx+1} / ${queue.length}`;
  $('bar').style.width=`${((idx+1)/queue.length)*100}%`;
  $('topic').textContent=q.card.topic;
  $('question').textContent=q.card.q;
  $('hint').textContent=q.card.hint||'';
  $('feedback').className='feedback';
  $('feedback').innerHTML='';
  const altsHtml=q.alts.map((alt,i)=>`<button class="mcAlt" data-i="${i}"><span class="mcLetter">${String.fromCharCode(65+i)}</span><span>${alt}</span></button>`).join('');
  $('mcAlts').innerHTML=altsHtml;
  document.querySelectorAll('.mcAlt').forEach(b=>b.onclick=()=>pick(parseInt(b.dataset.i,10)));
}

function pick(i){
  if(answered)return;
  answered=true;picked=i;
  const q=queue[idx];
  const ok=i===q.correctIdx;
  document.querySelectorAll('.mcAlt').forEach((b,bi)=>{
    b.disabled=true;
    if(bi===q.correctIdx)b.classList.add('correct');
    else if(bi===i)b.classList.add('wrong');
    else b.classList.add('dim');
  });
  round.push({id:q.card.id,q:q.card.q,answer:q.card.answer,ok,topic:q.card.topic});
  $('feedback').className='feedback '+(ok?'good':'bad');
  $('feedback').innerHTML=`<h3>${ok?'Riktig':'Ikke helt riktig'}</h3><p>${q.card.explain}</p><div class="answer">${q.card.answer}</div><div class="enterHint">Trykk <kbd>⏎</kbd> for neste</div>`;
}

function next(){
  if(!answered&&queue[idx]){
    // Behandle som "skip" / feil
    round.push({id:queue[idx].card.id,q:queue[idx].card.q,answer:queue[idx].card.answer,ok:false,topic:queue[idx].card.topic,skipped:true});
  }
  idx++;show();
}

function donutSvg(pct,color){
  const s=112,r=44,c=2*Math.PI*r,p=Math.max(0,Math.min(100,pct||0)),off=c*(1-p/100);
  return `<svg class="donut" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}"><circle cx="${s/2}" cy="${s/2}" r="${r}" class="donut-track"/><circle cx="${s/2}" cy="${s/2}" r="${r}" class="donut-value" style="stroke:${color};stroke-dasharray:${c.toFixed(2)};stroke-dashoffset:${off.toFixed(2)}"/><text x="${s/2}" y="${s/2+1}" text-anchor="middle" dominant-baseline="central" class="donut-pct">${Math.round(p)}%</text></svg>`;
}

function finish(){
  const total=round.length;
  const right=round.filter(r=>r.ok).length;
  const pct=total?Math.round(100*right/total):0;
  const wrongList=round.filter(r=>!r.ok);
  const heroTitle=total?`${right} av ${total} riktig`:'Ingen besvart';
  const tagline=pct>=90?'Imponerende — du gjenkjenner formlene raskt.':pct>=70?'Solid runde. Gå over de feile en gang til.':pct>=40?'Brukbart — kjør en runde til for repetisjon.':'Frisk opp formlene i flashcards eller formelquiz.';

  // Kryss-kobling
  let flashCta='';
  if(deckFilter!=='all'&&LINKS.topicByQuizDeck){
    const t=LINKS.topicByQuizDeck(deckFilter);
    if(t&&t.flashDeck)flashCta=`<a class="btn secondary" href="${LINKS.flashUrl(t.flashDeck)}">Test deg på flashcards →</a>`;
  }
  const quizCta=`<a class="btn secondary" href="formelquiz.html${deckFilter!=='all'?'?deck='+encodeURIComponent(deckFilter):''}">Åpne fyll-inn-quiz →</a>`;

  $('quizPanel').style.display='none';
  $('summary').className='summary show';
  $('summary').innerHTML=`<div class="summaryCard">
    <header class="summaryHero">
      <span class="summaryEyebrow">Runde fullført</span>
      <h2>${heroTitle}</h2>
      <p class="summaryTagline">${tagline}</p>
    </header>
    <div class="scoreCards single">
      <div class="scoreCard">
        <span class="scoreCard-label">Treff</span>
        ${donutSvg(pct,'#dc2626')}
        <div class="scoreCard-meta"><b>${right}<span class="of">/ ${total}</span></b><span>riktige</span></div>
      </div>
    </div>
    ${wrongList.length?`<div class="summarySection"><h3>Spørsmål du bommet på</h3><div class="summaryList">${wrongList.map(r=>`<div class="summaryItem bad"><b>❌ ${r.q}</b><p>${r.answer}</p></div>`).join('')}</div></div>`:''}
    <div class="summaryActions">
      <button class="btn primary" id="mcRestart">Start ny runde</button>
      ${quizCta}
      ${flashCta}
    </div>
  </div>`;
  $('mcRestart').onclick=()=>{$('summary').className='summary';$('startPanel').style.display='block';};
  $('summary').scrollIntoView({behavior:'smooth',block:'start'});
}

// Init
renderDeckSel();
$('startBtn').onclick=startQuiz;
$('nextBtn').onclick=next;
$('finishBtn').onclick=finish;
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&answered&&$('quizPanel').style.display!=='none'){e.preventDefault();next();}
  if(answered)return;
  // 1-4 keys
  const k=parseInt(e.key,10);
  if(k>=1&&k<=4&&queue[idx]){e.preventDefault();pick(k-1);}
});
// URL-param deck=
const p=new URLSearchParams(location.search).get('deck');
if(p&&decks.find(d=>d.id===p)){$('deckSel').value=p;}
})();
