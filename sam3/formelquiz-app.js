const $=id=>document.getElementById(id);
let deck='all',idx=0,answered=false,currentFocus=null,round=[],symbolOpen=false,symbolStats={};
const norm=s=>(s||'').toString().trim().replace(/\s+/g,'').replace(/−/g,'-').replace(/ᵉ/g,'e').replace(/\*/g,'').replace(/-/g,'').toLowerCase();
const filtered=()=>deck==='all'?cards:cards.filter(c=>c.deck===deck);

function renderDecks(){
  deckList.innerHTML=decks.map(d=>`<button class="deckbtn ${deck===d.id?'active':''}" data-id="${d.id}"><b>${d.title}</b><span>${d.desc}</span></button>`).join('');
  document.querySelectorAll('.deckbtn').forEach(b=>b.onclick=()=>{
    deck=b.dataset.id;idx=0;answered=false;
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

function renderSymbolStatsBlock(){
  const weak=[],strong=[];
  Object.keys(symbolStats).forEach(fid=>{
    Object.keys(symbolStats[fid]).forEach(sym=>{
      const s=symbolStats[fid][sym];
      const entry={fid,sym,right:s.right,wrong:s.wrong,total:s.right+s.wrong};
      if(s.wrong>0)weak.push(entry);
      else if(s.right>0)strong.push(entry);
    });
  });
  if(!weak.length&&!strong.length)return '';
  weak.sort((a,b)=>(b.wrong/b.total)-(a.wrong/a.total)||b.wrong-a.wrong);
  const weakHtml=weak.length?`<h4>Bør øves mer</h4><div class="symbolStatsGrid">${weak.map(w=>`<span class="symbolStatChip bad" title="${w.fid}">${w.sym}<small>${w.wrong}✗ / ${w.total}</small></span>`).join('')}</div>`:'';
  const strongHtml=strong.length?`<h4>Sitter godt</h4><div class="symbolStatsGrid">${strong.map(w=>`<span class="symbolStatChip good" title="${w.fid}">${w.sym}<small>${w.right}✓</small></span>`).join('')}</div>`:'';
  const totalRight=weak.reduce((a,b)=>a+b.right,0)+strong.reduce((a,b)=>a+b.right,0);
  const totalAtt=weak.reduce((a,b)=>a+b.total,0)+strong.reduce((a,b)=>a+b.total,0);
  return `<div class="symbolStats"><h3>Symbolquiz-resultater</h3><p class="sub">${totalRight} av ${totalAtt} symbolforsøk riktige i denne runden.</p>${weakHtml}${strongHtml}</div>`;
}

function startNewRound(){
  round=[];symbolStats={};
  summary.className='summary';
  renderStats();
}

function finishRound(){
  const attempts=round.length,right=round.filter(r=>r.ok).length,shown=round.filter(r=>r.shown).length,wrong=attempts-right-shown;
  const weak=[...new Set(round.filter(r=>!r.ok).map(r=>r.topic))];
  summary.className='summary show';
  summary.innerHTML=`<div class="summaryCard"><h2>Oppsummering av runden</h2><div class="summaryGrid"><div class="summaryStat"><b>${attempts}</b><span>Besvart</span></div><div class="summaryStat"><b>${right}</b><span>Riktig</span></div><div class="summaryStat"><b>${wrong}</b><span>Feil</span></div><div class="summaryStat"><b>${shown}</b><span>Vist fasit</span></div></div><p style="font-size:13px;color:#64748b;margin-top:4px">Jobb mer med: ${weak.length?weak.join(', '):'ingen tydelige svake områder i denne runden'}.</p><div class="summaryList">${round.map(r=>`<div class="summaryItem ${r.ok?'good':r.shown?'shown':'bad'}"><b>${r.ok?'✅':r.shown?'👁️':'❌'} ${r.q}</b><p>${r.answer}</p></div>`).join('')}</div>${renderSymbolStatsBlock()}<button class="btn primary" style="margin-top:14px" onclick="startNewRound()">Start ny runde</button></div>`;
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

renderDecks();
renderPad();
render();
