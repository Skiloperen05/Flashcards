const $=id=>document.getElementById(id);
let deck='all',idx=0,answered=false,currentFocus=null,round=[],symbolOpen=false,symbolStats={};
const norm=s=>(s||'').toString().trim().replace(/\s+/g,'').replace(/−/g,'-').replace(/ᵉ/g,'e').replace(/\*/g,'').replace(/-/g,'').toLowerCase();
const filtered=()=>deck==='all'?cards:cards.filter(c=>c.deck===deck);

function renderDecks(){
  deckList.innerHTML=decks.map(d=>`<button class="deckbtn ${deck===d.id?'active':''}" data-id="${d.id}"><b>${d.title}</b><span>${d.desc}</span></button>`).join('');
  document.querySelectorAll('.deckbtn').forEach(b=>b.onclick=()=>{
    deck=b.dataset.id;idx=0;answered=false;
    document.querySelectorAll('.deckbtn').forEach(x=>x.classList.toggle('active',x.dataset.id===deck));
    feedback.className='feedback';feedback.innerHTML='';
    summary.className='summary';
    render();
  });
}

function renderPad(){
  symbolPad.innerHTML=symbolKeys.map(k=>`<button class="key" type="button">${k}</button>`).join('');
  symbolPad.querySelectorAll('.key').forEach(k=>k.onclick=()=>{
    const input=currentFocus||formulaBox.querySelector('input');
    if(!input)return;
    input.focus();
    const s=input.selectionStart||0;
    input.value=input.value.slice(0,s)+k.textContent+input.value.slice(input.selectionEnd||s);
    input.dispatchEvent(new Event('input'));
    input.setSelectionRange(s+k.textContent.length,s+k.textContent.length);
  });
}

function makeFormula(c){
  let html=c.m.replace(/{{(\d+)}}/g,(m,n)=>`<span class="blank"><input data-i="${n}" autocomplete="off"></span>`);
  formulaBox.innerHTML=html;
  const inputs=[...formulaBox.querySelectorAll('input')];
  inputs.forEach((inp,i)=>{
    inp.onfocus=()=>currentFocus=inp;
    inp.onkeydown=e=>{
      if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();(inputs[i+1]||inputs[0]).focus();}
      if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();(inputs[i-1]||inputs[inputs.length-1]).focus();}
      if(e.key==='Enter'){e.preventDefault();if(answered)next();else check();}
    };
  });
  setTimeout(()=>inputs[0]?.focus(),60);
}

function render(){
  const arr=filtered(),c=arr[idx];if(!c)return;
  answered=false;
  deckTitle.textContent=decks.find(d=>d.id===deck)?.title||'Alle formler';
  counter.textContent=`${idx+1} / ${arr.length}`;
  bar.style.width=`${((idx+1)/arr.length)*100}%`;
  topic.textContent=c.topic;
  question.textContent=c.q;
  hint.textContent=c.hint;
  makeFormula(c);
  figureBtn.disabled=!figures[c.id];
  symbolBtn.disabled=!(typeof symbolQuiz!=='undefined'&&symbolQuiz[c.id]);
  feedback.className='feedback';feedback.innerHTML='';
  closeSymbolPanel();
  renderStats();
}

function check(){
  const c=filtered()[idx];
  const inputs=[...formulaBox.querySelectorAll('input')];
  let ok=true;
  inputs.forEach((inp,i)=>{
    const valid=(c.a[i]||[]).map(norm).includes(norm(inp.value));
    inp.classList.toggle('correct',valid);
    inp.classList.toggle('wrong',!valid);
    if(!valid)ok=false;
  });
  answered=true;
  round.push({id:c.id,q:c.q,answer:c.answer,ok,shown:false,topic:c.topic});
  if(window.SAM3Progress)window.SAM3Progress.recordFormula(c.id,ok,false);
  feedback.className='feedback '+(ok?'good':'bad');
  feedback.innerHTML=`<h3>${ok?'Riktig':'Ikke helt riktig'}</h3><p>${c.explain}</p><div class="answer">${c.answer}</div>${derive(c)}<div class="enterHint">Trykk <kbd>⏎</kbd> for neste spørsmål</div>`;
  renderStats();
}

function derive(c){
  return `<div class="deriveBox"><b>Utledning / logikk</b>${(c.derive||[]).map(x=>`<p>${x}</p>`).join('')}</div>`;
}

function showAnswer(){
  const c=filtered()[idx];
  answered=true;
  round.push({id:c.id,q:c.q,answer:c.answer,ok:false,shown:true,topic:c.topic});
  if(window.SAM3Progress)window.SAM3Progress.recordFormula(c.id,false,true);
  feedback.className='feedback bad';
  feedback.innerHTML=`<h3>Riktig svar</h3><p>${c.explain}</p><div class="answer">${c.answer}</div>${derive(c)}<div class="enterHint">Trykk <kbd>⏎</kbd> for neste spørsmål</div>`;
  renderStats();
}

function next(){const arr=filtered();idx=(idx+1)%arr.length;render();}
function prev(){const arr=filtered();idx=(idx-1+arr.length)%arr.length;render();}

function renderStats(){
  const total=cards.length,right=round.filter(r=>r.ok).length,attempts=round.length;
  statTotal.textContent=total;
  statRight.textContent=right;
  statPct.textContent=attempts?Math.round(100*right/attempts)+'%':'0%';
}

function donutSvg(pct,color){
  const s=112,r=44,c=2*Math.PI*r,p=Math.max(0,Math.min(100,pct||0)),off=c*(1-p/100);
  return `<svg class="donut" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" aria-hidden="true"><circle cx="${s/2}" cy="${s/2}" r="${r}" class="donut-track"/><circle cx="${s/2}" cy="${s/2}" r="${r}" class="donut-value" style="stroke:${color};stroke-dasharray:${c.toFixed(2)};stroke-dashoffset:${off.toFixed(2)}"/><text x="${s/2}" y="${s/2+1}" text-anchor="middle" dominant-baseline="central" class="donut-pct">${Math.round(p)}%</text></svg>`;
}

function symbolStatsData(){
  const weak=[],strong=[];
  let totalRight=0,totalAtt=0;
  Object.keys(symbolStats).forEach(fid=>{
    const card=cards.find(c=>c.id===fid);
    const topic=card?card.topic:fid;
    Object.keys(symbolStats[fid]).forEach(sym=>{
      const s=symbolStats[fid][sym];
      const total=s.right+s.wrong;
      const e={fid,sym,topic,right:s.right,wrong:s.wrong,total,pct:total?Math.round(100*s.right/total):0};
      totalRight+=s.right;totalAtt+=total;
      if(s.wrong>0)weak.push(e);else if(s.right>0)strong.push(e);
    });
  });
  weak.sort((a,b)=>(b.wrong/b.total-a.wrong/a.total)||b.wrong-a.wrong);
  return {weak,strong,totalRight,totalAtt};
}

function tagline(formPct,symPct,hasSymbols){
  const c=hasSymbols?(formPct+symPct)/2:formPct;
  if(c>=90)return 'Imponerende — du sitter trygt med stoffet.';
  if(c>=75)return 'Solid runde. Gå over de siste detaljene og du er der.';
  if(c>=50)return 'God start. Ta en runde til og bruk «Vis figur» der det glipper.';
  if(c>0)return 'Ikke gi opp — figurene gir god intuisjon når formelen ikke sitter.';
  return 'Klar for en ny runde?';
}

function jumpToDeck(deckId){
  deck=deckId;idx=0;answered=false;round=[];symbolStats={};
  document.querySelectorAll('.deckbtn').forEach(x=>x.classList.toggle('active',x.dataset.id===deck));
  summary.className='summary';
  feedback.className='feedback';feedback.innerHTML='';
  render();
  document.querySelector('.quiz')?.scrollIntoView({behavior:'smooth',block:'start'});
}

function startNewRound(){
  round=[];symbolStats={};
  summary.className='summary';
  renderStats();
  render();
}

function finishRound(){
  const attempts=round.length,right=round.filter(r=>r.ok).length,shown=round.filter(r=>r.shown).length,wrong=attempts-right-shown;
  const formulaPct=attempts?Math.round(100*right/attempts):0;
  const sym=symbolStatsData();
  const hasSym=sym.totalAtt>0;
  const symbolPct=hasSym?Math.round(100*sym.totalRight/sym.totalAtt):0;

  const weakTopics=[...new Set(round.filter(r=>!r.ok).map(r=>r.topic))];
  const weakDeckIds=[...new Set(round.filter(r=>!r.ok).map(r=>cards.find(c=>c.id===r.id)?.deck).filter(Boolean))];
  const suggestDecks=deck==='all'?weakDeckIds.slice(0,2):[];

  const heroTitle=attempts?`${right} av ${attempts} formler riktig`:'Ingen formler besvart enda';
  const heroSub=tagline(formulaPct,symbolPct,hasSym);

  const scoreCards=`<div class="scoreCards${hasSym?'':' single'}">
    <div class="scoreCard">
      <span class="scoreCard-label">Formler</span>
      ${donutSvg(formulaPct,'#dc2626')}
      <div class="scoreCard-meta"><b>${right}<span class="of">/ ${attempts}</span></b><span>riktige</span></div>
      <div class="scoreCard-foot">${wrong} feil${shown?` · ${shown} med fasit`:''}</div>
    </div>
    ${hasSym?`<div class="scoreCard">
      <span class="scoreCard-label">Symboler</span>
      ${donutSvg(symbolPct,'#15803d')}
      <div class="scoreCard-meta"><b>${sym.totalRight}<span class="of">/ ${sym.totalAtt}</span></b><span>riktige forsøk</span></div>
      <div class="scoreCard-foot">${sym.weak.length?`${sym.weak.length} symbol${sym.weak.length===1?'':'er'} å øve mer på`:'Alle symboler sitter'}</div>
    </div>`:`<div class="scoreCard ghost">
      <span class="scoreCard-label">Symboler</span>
      <div class="scoreCard-empty"><span class="scoreCard-emptyIcon">∑</span><p>Ikke øvd på symboler denne runden</p><small>Trykk «Øv på symboler» under en formel for å teste hva hvert symbol betyr.</small></div>
    </div>`}
  </div>`;

  const weakTopicsHtml=weakTopics.length?`<div class="summarySection">
    <h3>Temaer å gå over</h3>
    <div class="topicChips">${weakTopics.map(t=>`<span class="topicChip">${t}</span>`).join('')}</div>
  </div>`:'';

  const weakSymbolsHtml=sym.weak.length?`<div class="summarySection">
    <h3>Symboler å øve mer på</h3>
    <div class="weakSymbolList">${sym.weak.slice(0,10).map(w=>`<div class="weakSymbolRow">
      <span class="weakSymbolSym">${w.sym}</span>
      <div class="weakSymbolInfo"><b>${w.topic}</b><div class="weakBar"><div class="weakBar-fill" style="width:${w.pct}%"></div></div></div>
      <span class="weakSymbolCount">${w.right}<small>/${w.total}</small></span>
    </div>`).join('')}</div>
  </div>`:'';

  const strongSymbolsHtml=sym.strong.length?`<div class="summarySection compact">
    <h3>Symboler du har på plass</h3>
    <div class="topicChips good">${sym.strong.map(s=>`<span class="topicChip good">${s.sym}</span>`).join('')}</div>
  </div>`:'';

  const perQuestion=attempts?`<details class="summaryDetails">
    <summary>Alle spørsmål i runden (${attempts})</summary>
    <div class="summaryList">${round.map(r=>`<div class="summaryItem ${r.ok?'good':r.shown?'shown':'bad'}"><b>${r.ok?'✅':r.shown?'👁️':'❌'} ${r.q}</b><p>${r.answer}</p></div>`).join('')}</div>
  </details>`:'';

  const deckBtns=suggestDecks.map(did=>{
    const d=decks.find(x=>x.id===did);
    return d?`<button class="btn secondary" onclick="jumpToDeck('${d.id}')">Øv på ${d.title} →</button>`:'';
  }).join('');

  // Kryss-kobling: tilhørende flashcard-dekk via topic-mapping
  let flashCta='';
  if(deck!=='all'&&window.SAM3_LINKS&&window.SAM3_LINKS.topicByQuizDeck){
    const t=window.SAM3_LINKS.topicByQuizDeck(deck);
    if(t&&t.flashDeck)flashCta=`<a class="btn secondary" href="${window.SAM3_LINKS.flashUrl(t.flashDeck)}">Test deg på flashcards →</a>`;
  }

  const actions=`<div class="summaryActions">
    <button class="btn primary" onclick="startNewRound()">Start ny runde</button>
    ${deckBtns}
    ${flashCta}
  </div>`;

  summary.className='summary show';
  summary.innerHTML=`<div class="summaryCard">
    <header class="summaryHero">
      <span class="summaryEyebrow">Runde fullført</span>
      <h2>${heroTitle}</h2>
      <p class="summaryTagline">${heroSub}</p>
    </header>
    ${scoreCards}
    ${weakTopicsHtml}
    ${weakSymbolsHtml}
    ${strongSymbolsHtml}
    ${perQuestion}
    ${actions}
  </div>`;
  summary.scrollIntoView({behavior:'smooth',block:'start'});
}

function symbolQuizHtml(id,withClose){
  const q=(typeof symbolQuiz!=='undefined'&&symbolQuiz[id])?symbolQuiz[id]:null;
  if(!q)return '<div class="symbolQuiz"><h3>Symbolquiz</h3><p>Symbolfasit er ikke lagt inn for denne formelen ennå.</p></div>';
  const closeBtn=withClose?`<button class="symbolClose" type="button" onclick="closeSymbolPanel()" aria-label="Lukk">✕</button>`:'';
  return `<div class="symbolQuiz" data-formula="${id}">
    <div class="symbolQuizHead">
      <div><h3>Øv på symbolene</h3><p>Hva står hvert symbol for i formelen?</p></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <div class="symbolFormula">${q.formula}</div>
        ${closeBtn}
      </div>
    </div>
    <div class="symbolRows">${q.items.map((it,i)=>`<label class="symbolRow"><span>${it[0]} =</span><input data-i="${i}" placeholder="Skriv betydningen ..." autocomplete="off"></label>`).join('')}</div>
    <div class="symbolActions">
      <button class="btn primary" type="button" onclick="checkSymbolQuiz('${id}')">Sjekk symboler</button>
      <button class="btn secondary" type="button" onclick="showSymbolAnswers('${id}')">Vis fasit</button>
    </div>
    <div class="symbolFeedback" data-feedback="${id}"></div>
  </div>`;
}

function symbolScope(id){
  // Foretrekk inline-panelet hvis åpent, ellers modal-versjonen
  return document.querySelector(`#symbolPanel .symbolQuiz[data-formula="${id}"]`)
      || document.querySelector(`#figureStage .symbolQuiz[data-formula="${id}"]`)
      || document.querySelector(`.symbolQuiz[data-formula="${id}"]`);
}

function checkSymbolQuiz(id){
  const q=symbolQuiz[id];if(!q)return;
  const root=symbolScope(id);if(!root)return;
  let ok=0;
  if(!symbolStats[id])symbolStats[id]={};
  root.querySelectorAll('.symbolRow').forEach((row,i)=>{
    const inp=row.querySelector('input');
    const v=norm(inp.value);
    const good=v.length>0&&q.items[i][1].some(a=>norm(a)===v);
    row.classList.toggle('ok',good);
    row.classList.toggle('bad',!good);
    if(good)ok++;
    const sym=q.items[i][0];
    if(!symbolStats[id][sym])symbolStats[id][sym]={right:0,wrong:0};
    if(good)symbolStats[id][sym].right++;else symbolStats[id][sym].wrong++;
    if(window.SAM3Progress)window.SAM3Progress.recordSymbol(id,sym,good);
  });
  const fb=root.querySelector('.symbolFeedback');
  fb.className='symbolFeedback show';
  fb.innerHTML=`<b>${ok} av ${q.items.length} riktige</b><p>${ok===q.items.length?'Sterkt — du kobler symbolene til økonomisk mening.':'Se over de røde feltene, eller vis fasit og prøv igjen senere.'}</p>`;
}

function showSymbolAnswers(id){
  const q=symbolQuiz[id];if(!q)return;
  const root=symbolScope(id);if(!root)return;
  const fb=root.querySelector('.symbolFeedback');
  fb.className='symbolFeedback show';
  fb.innerHTML=`<b>Fasit</b><div class="symbolAnswerGrid">${q.items.map(it=>`<div><span>${it[0]}</span><p>${it[1][0]}</p></div>`).join('')}</div>`;
}

function openFigure(){
  const c=filtered()[idx],f=figures[c.id];if(!f)return;
  figureTitle.textContent=f.title;
  figureSub.textContent=f.sub;
  figureStage.innerHTML=f.svg();
  figureOverlay.classList.add('show');
}

function closeFigure(){figureOverlay.classList.remove('show');}

function toggleSymbolPanel(){
  const c=filtered()[idx];
  if(!c||!symbolQuiz[c.id])return;
  if(symbolOpen){closeSymbolPanel();return;}
  symbolPanel.innerHTML=symbolQuizHtml(c.id,true);
  symbolOpen=true;
  symbolBtn.classList.add('active');
  attachSymbolKeys(symbolPanel,c.id);
  setTimeout(()=>symbolPanel.querySelector('.symbolRow input')?.focus(),120);
  symbolPanel.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function attachSymbolKeys(root,id){
  const inputs=[...root.querySelectorAll('.symbolRow input')];
  inputs.forEach((inp,i)=>{
    inp.onkeydown=e=>{
      if(e.key==='ArrowRight'||e.key==='ArrowDown'){
        e.preventDefault();(inputs[i+1]||inputs[0]).focus();
      }else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){
        e.preventDefault();(inputs[i-1]||inputs[inputs.length-1]).focus();
      }else if(e.key==='Enter'){
        e.preventDefault();
        const checked=root.querySelector('.symbolFeedback.show');
        if(checked)next();
        else checkSymbolQuiz(id);
      }
    };
  });
}

function closeSymbolPanel(){
  symbolPanel.innerHTML='';
  symbolOpen=false;
  symbolBtn.classList.remove('active');
}

checkBtn.onclick=check;
showBtn.onclick=showAnswer;
nextBtn.onclick=next;
prevBtn.onclick=prev;
finishBtn.onclick=finishRound;
figureBtn.onclick=openFigure;
symbolBtn.onclick=toggleSymbolPanel;
closeFig.onclick=closeFigure;
figureOverlay.onclick=e=>{if(e.target===figureOverlay)closeFigure();};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFigure();});

// URL-param ?deck=<id> — sett deck før første render
const paramDeck=new URLSearchParams(location.search).get('deck');
if(paramDeck&&decks.find(d=>d.id===paramDeck))deck=paramDeck;

renderDecks();
renderPad();
render();
