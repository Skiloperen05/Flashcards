// SAM3 progresjon: localStorage-første, valgfri Supabase-sync.
// Brukes av flashcards (Leitner, ratings), formelquiz (treff), index (streak).
(function(){
const STORE_KEY='sam3_progress_v1';
const TABLE='sam3_progress';
const DAY_MS=86400000;

const LEITNER_INTERVALS=[0,1,3,7,14]; // dager fra boks 1 til 5

function readStore(){
  try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{}');}catch{return {};}
}
function writeStore(s){
  try{localStorage.setItem(STORE_KEY,JSON.stringify(s));}catch{}
}

let store=readStore();
let supabase=null,user=null,syncTimer=null,pendingKeys=new Set();

function ensureBuckets(){
  store.visits=store.visits||{};
  store.flashcards=store.flashcards||{}; // {[deckId:idx]:{box,nextReview,counts:{bad,mid,good},lastSeen}}
  store.formulas=store.formulas||{};     // {[id]:{right,wrong,shown,lastSeen}}
  store.symbols=store.symbols||{};       // {[fid:sym]:{right,wrong,lastSeen}}
}
ensureBuckets();

function todayISO(){return new Date().toISOString().slice(0,10);}
function daysBetween(a,b){return Math.round((new Date(b)-new Date(a))/DAY_MS);}

function getStreak(){
  const days=Object.keys(store.visits||{}).sort();
  if(!days.length)return {current:0,longest:0,lastDate:null,recent:[]};
  let longest=0,current=0,run=0,prev=null;
  days.forEach(d=>{
    if(prev&&daysBetween(prev,d)===1)run++;else run=1;
    prev=d;if(run>longest)longest=run;
  });
  const today=todayISO();
  const last=days[days.length-1];
  const gap=daysBetween(last,today);
  if(gap<=0)current=run;
  else if(gap===1)current=run; // i går
  else current=0;
  const recent=[];for(let i=13;i>=0;i--){const d=new Date(Date.now()-i*DAY_MS).toISOString().slice(0,10);recent.push({d,had:!!store.visits[d]});}
  return {current,longest,lastDate:last,recent};
}

function getTotals(){
  let flashRated=0,flashGood=0,flashWeak=0;
  Object.values(store.flashcards).forEach(e=>{
    flashRated++;
    if(e.box>=4)flashGood++;
    else if(e.counts&&(e.counts.bad>0||e.counts.mid>0))flashWeak++;
  });
  let formulaRight=0,formulaTotal=0;
  Object.values(store.formulas).forEach(e=>{formulaRight+=e.right||0;formulaTotal+=(e.right||0)+(e.wrong||0);});
  let symbolRight=0,symbolTotal=0;
  Object.values(store.symbols).forEach(e=>{symbolRight+=e.right||0;symbolTotal+=(e.right||0)+(e.wrong||0);});
  return {flashRated,flashGood,flashWeak,formulaRight,formulaTotal,symbolRight,symbolTotal};
}

function recordVisit(){
  const d=todayISO();
  if(!store.visits[d]){store.visits[d]=Date.now();writeStore(store);queueSync('visits:'+d);}
}

function recordFlashcard(deckId,cardIdx,rating){
  const key=deckId+':'+cardIdx;
  const e=store.flashcards[key]||{box:1,nextReview:todayISO(),counts:{bad:0,mid:0,good:0}};
  e.counts=e.counts||{bad:0,mid:0,good:0};
  e.counts[rating]=(e.counts[rating]||0)+1;
  e.lastRating=rating;
  e.lastSeen=new Date().toISOString();
  // Leitner: bad → 1, mid → bli, good → opp
  if(rating==='bad')e.box=1;
  else if(rating==='good')e.box=Math.min(5,(e.box||1)+1);
  // mid: bli i samme boks
  const idays=LEITNER_INTERVALS[(e.box||1)-1]||0;
  e.nextReview=new Date(Date.now()+idays*DAY_MS).toISOString().slice(0,10);
  store.flashcards[key]=e;
  writeStore(store);queueSync('flashcard:'+key);
  return e;
}

function getFlashcardState(deckId,cardIdx){return store.flashcards[deckId+':'+cardIdx]||null;}

function getDueFlashcards(deckId){
  const today=todayISO();
  const out=[];
  Object.keys(store.flashcards).forEach(k=>{
    const [d,idx]=k.split(':');
    if(d!==deckId)return;
    const e=store.flashcards[k];
    if(!e.nextReview||e.nextReview<=today)out.push({idx:parseInt(idx,10),box:e.box});
  });
  return out;
}

function countDueInDeck(deckId,totalCards){
  const today=todayISO();
  let due=0;
  // Aldri ratede kort regnes som boks 1 = due i dag
  for(let i=0;i<totalCards;i++){
    const e=store.flashcards[deckId+':'+i];
    if(!e||!e.nextReview||e.nextReview<=today)due++;
  }
  return due;
}

function recordFormula(id,ok,shown){
  const e=store.formulas[id]||{right:0,wrong:0,shown:0};
  if(shown)e.shown=(e.shown||0)+1;
  else if(ok)e.right=(e.right||0)+1;
  else e.wrong=(e.wrong||0)+1;
  e.lastSeen=new Date().toISOString();
  store.formulas[id]=e;
  writeStore(store);queueSync('formula:'+id);
}

function recordSymbol(fid,sym,ok){
  const k=fid+':'+sym;
  const e=store.symbols[k]||{right:0,wrong:0};
  if(ok)e.right=(e.right||0)+1;else e.wrong=(e.wrong||0)+1;
  e.lastSeen=new Date().toISOString();
  store.symbols[k]=e;
  writeStore(store);queueSync('symbol:'+k);
}

// ===== Supabase sync (best effort, graceful fallback) =====
async function initSupabase(){
  try{
    if(!window.supabase||!window.AuthGuard)return;
    if(typeof AuthGuard.getClient==='function')supabase=AuthGuard.getClient();
    if(!supabase&&typeof AuthGuard.requireAuth==='function'){
      const s=await AuthGuard.requireAuth();
      if(s&&s.user)user=s.user;
      // Hent supabase-klient på flere mulige måter
      if(window._sb)supabase=window._sb;
    }
    if(!supabase)return;
    if(!user){const {data}=await supabase.auth.getUser();user=data?.user||null;}
    if(!user)return;
    await pullFromSupabase();
  }catch(e){console.warn('SAM3Progress sync init failed (localStorage only):',e.message);}
}

async function pullFromSupabase(){
  if(!supabase||!user)return;
  try{
    const {data,error}=await supabase.from(TABLE).select('key,value,updated_at').eq('user_id',user.id);
    if(error)return; // tabell finnes ikke ennå — fall tilbake
    if(!data)return;
    data.forEach(row=>{
      const [bucket,...rest]=row.key.split(':');
      const subKey=rest.join(':');
      if(!store[bucket])store[bucket]={};
      const local=store[bucket][subKey];
      const remoteSeen=row.value&&(row.value.lastSeen||row.updated_at);
      const localSeen=local&&local.lastSeen;
      if(!local||(remoteSeen&&(!localSeen||remoteSeen>localSeen))){
        store[bucket][subKey]=row.value;
      }
    });
    writeStore(store);
  }catch(e){console.warn('pull failed',e.message);}
}

function queueSync(fullKey){
  if(!supabase||!user)return;
  pendingKeys.add(fullKey);
  if(syncTimer)clearTimeout(syncTimer);
  syncTimer=setTimeout(flushSync,2000);
}

async function flushSync(){
  if(!supabase||!user)return;
  const keys=[...pendingKeys];pendingKeys.clear();
  const rows=keys.map(k=>{
    const [bucket,...rest]=k.split(':');
    const subKey=rest.join(':');
    const value=store[bucket]?store[bucket][subKey]:null;
    if(!value)return null;
    return {user_id:user.id,key:k,value};
  }).filter(Boolean);
  if(!rows.length)return;
  try{
    await supabase.from(TABLE).upsert(rows,{onConflict:'user_id,key'});
  }catch(e){console.warn('sync flush failed',e.message);}
}

window.SAM3Progress={
  init(){return initSupabase();},
  recordVisit,recordFlashcard,recordFormula,recordSymbol,
  getFlashcardState,getDueFlashcards,countDueInDeck,
  getStreak,getTotals,
  forceSync:flushSync,
  _store:()=>store
};

// Selv-initialiser besøk når lastet
recordVisit();
initSupabase();
})();
