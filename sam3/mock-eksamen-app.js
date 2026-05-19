// SAM3 Mock-eksamen — tidssatt multiple-choice mot hele formelquiz-pensum.
(function(){
const $=id=>document.getElementById(id);

let queue=[],idx=0,answered=false,round=[],startTime=0,duration=0,tick=null,timeLeft=0;

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function pickDistractors(card){
  const pool=cards.filter(c=>c.id!==card.id);
  shuffle(pool);
  return pool.slice(0,3).map(c=>c.answer);
}

function startExam(){
  const count=parseInt($('countSel').value,10);
  duration=parseInt($('timeSel').value,10);
  const pool=cards.slice();
  shuffle(pool);
  const n=count===0?pool.length:Math.min(count,pool.length);
  queue=pool.slice(0,n).map(c=>{
    const alts=shuffle([c.answer,...pickDistractors(c)]);
    return {card:c,alts,correctIdx:alts.indexOf(c.answer)};
  });
  idx=0;round=[];
  $('configPanel').style.display='none';
  $('quizPanel').style.display='block';
  $('summary').className='summary';
  $('quizTitle').textContent=`Mock-eksamen — ${queue.length} spørsmål`;
  startTime=Date.now();
  if(duration>0){
    timeLeft=duration;
    updateTimer();
    tick=setInterval(()=>{timeLeft--;updateTimer();if(timeLeft<=0)finish(true);},1000);
  }else{
    $('topRight').innerHTML='<span class="meta">Uten klokke</span>';
  }
  show();
}

function updateTimer(){
  const m=Math.floor(timeLeft/60),s=timeLeft%60;
  const txt=m+':'+(s<10?'0':'')+s;
  $('topRight').innerHTML=`<span class="timer${timeLeft<=60?' warn':''}">⏱ ${txt}</span>`;
}

function show(){
  if(idx>=queue.length){finish();return;}
  const q=queue[idx];
  answered=false;
  $('bar').style.width=`${((idx+1)/queue.length)*100}%`;
  $('topic').textContent=q.card.topic;
  $('question').textContent=q.card.q;
  $('hint').textContent=q.card.hint||'';
  $('feedback').className='feedback';$('feedback').innerHTML='';
  $('mcAlts').innerHTML=q.alts.map((alt,i)=>`<button class="mcAlt" data-i="${i}"><span class="mcLetter">${String.fromCharCode(65+i)}</span><span class="answer" style="background:transparent;border:0;padding:0;margin:0;display:inline">${alt}</span></button>`).join('');
  if(window.SAM3Math)window.SAM3Math.prettifyInElement($('mcAlts'));
  document.querySelectorAll('.mcAlt').forEach(b=>b.onclick=()=>pick(parseInt(b.dataset.i,10)));
}

function pick(i){
  if(answered)return;
  answered=true;
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
  if(window.SAM3Math)window.SAM3Math.prettifyInElement($('feedback'));
}

function next(){
  if(!answered&&queue[idx]){
    round.push({id:queue[idx].card.id,q:queue[idx].card.q,answer:queue[idx].card.answer,ok:false,topic:queue[idx].card.topic,skipped:true});
  }
  idx++;show();
}

function donutSvg(pct,color){
  const s=124,r=50,c=2*Math.PI*r,p=Math.max(0,Math.min(100,pct||0)),off=c*(1-p/100);
  return `<svg class="donut" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}"><circle cx="${s/2}" cy="${s/2}" r="${r}" class="donut-track"/><circle cx="${s/2}" cy="${s/2}" r="${r}" class="donut-value" style="stroke:${color};stroke-dasharray:${c.toFixed(2)};stroke-dashoffset:${off.toFixed(2)}"/><text x="${s/2}" y="${s/2+1}" text-anchor="middle" dominant-baseline="central" class="donut-pct">${Math.round(p)}%</text></svg>`;
}

function finish(timedOut){
  if(tick){clearInterval(tick);tick=null;}
  const total=round.length;
  const right=round.filter(r=>r.ok).length;
  const pct=total?Math.round(100*right/total):0;
  const elapsed=Math.round((Date.now()-startTime)/1000);
  const elapsedTxt=Math.floor(elapsed/60)+':'+(elapsed%60<10?'0':'')+(elapsed%60);

  // Per-tema breakdown
  const byTopic={};
  round.forEach(r=>{
    if(!byTopic[r.topic])byTopic[r.topic]={right:0,total:0};
    byTopic[r.topic].total++;
    if(r.ok)byTopic[r.topic].right++;
  });
  const topicRows=Object.keys(byTopic).map(t=>{
    const s=byTopic[t],p=Math.round(100*s.right/s.total);
    return `<div class="topicRow"><b>${t}</b><div class="pctbar"><div style="width:${p}%"></div></div><span class="score">${s.right}/${s.total}</span></div>`;
  }).join('');

  const heroTitle=total?`${right} av ${total} riktig`:'Ingen besvart';
  const sub=timedOut?'Tiden gikk ut.':total<queue.length?'Du avsluttet før alle spørsmål var besvart.':'Du fullførte hele mock-eksamen.';
  const tagline=pct>=85?'Eksamenklar — du gjenkjenner formlene under press.':pct>=65?'Godt grunnlag. Repetér de svakeste temaene.':pct>=40?'OK start. Bruk flashcards på temaene du bommet mest på.':'Tett på stoffet i flashcards/formelquiz før neste mock.';

  // Weakest topic shortcut
  let weakCta='';
  const weak=Object.keys(byTopic).map(t=>{const s=byTopic[t];return {t,pct:s.right/s.total};}).sort((a,b)=>a.pct-b.pct);
  if(weak.length&&weak[0].pct<1){
    const card=cards.find(c=>c.topic===weak[0].t);
    if(card){
      const deck=card.deck;
      weakCta=`<a class="btn secondary" href="formelquiz.html?deck=${encodeURIComponent(deck)}">Øv på ${weak[0].t} →</a>`;
    }
  }

  $('quizPanel').style.display='none';
  $('summary').className='summary show';
  $('summary').innerHTML=`<div class="summaryCard">
    <header class="summaryHero">
      <span class="summaryEyebrow">Mock-eksamen ferdig</span>
      <h2>${heroTitle}</h2>
      <p class="summaryTagline">${sub} ${tagline}</p>
    </header>
    <div class="scoreCards">
      <div class="scoreCard">
        <span class="scoreCard-label">Treff</span>
        ${donutSvg(pct,'#dc2626')}
        <div class="scoreCard-meta"><b>${right}<span class="of">/ ${total}</span></b><span>riktige</span></div>
      </div>
      <div class="scoreCard">
        <span class="scoreCard-label">Tid brukt</span>
        <div style="font-size:38px;font-weight:900;color:var(--ink);letter-spacing:-1px;margin:14px 0 4px">${elapsedTxt}</div>
        <div class="scoreCard-foot">${duration>0?'av '+Math.round(duration/60)+' min':'uten klokke'}</div>
      </div>
    </div>
    <div class="summarySection">
      <h3>Treff per tema</h3>
      <div class="topicBreakdown">${topicRows||'<p style="font-size:12px;color:var(--muted)">Ingen data.</p>'}</div>
    </div>
    <details class="summaryDetails"><summary>Alle spørsmål (${total})</summary>
      <div class="summaryList">${round.map(r=>`<div class="summaryItem ${r.ok?'good':'bad'}"><b>${r.ok?'✅':'❌'} ${r.q}</b><p>${r.answer}</p></div>`).join('')}</div>
    </details>
    <div class="summaryActions">
      <button class="btn primary" id="restartMock">Ny mock-eksamen</button>
      ${weakCta}
    </div>
  </div>`;
  $('restartMock').onclick=()=>{$('summary').className='summary';$('configPanel').style.display='block';$('topRight').innerHTML='';};
  if(window.SAM3Math)window.SAM3Math.prettifyInElement($('summary'));
  $('summary').scrollIntoView({behavior:'smooth',block:'start'});
}

$('startBtn').onclick=startExam;
$('nextBtn').onclick=next;
$('finishBtn').onclick=()=>finish(false);
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&answered&&$('quizPanel').style.display!=='none'){e.preventDefault();next();}
  if(answered||$('quizPanel').style.display==='none')return;
  const k=parseInt(e.key,10);
  if(k>=1&&k<=4&&queue[idx]){e.preventDefault();pick(k-1);}
});
})();
