// SAM3 cross-tool search. Bygger en lett indeks fra formelquiz-data + flashcards-gzip + radar-temaer.
(function(){
window.SAM3Search={
  index:[],
  ready:false,
  init(){
    if(this.ready)return Promise.resolve();
    const idx=[];
    // Radar-temaer
    (window.SAM3_TOPICS||[]).forEach(t=>{
      idx.push({type:'radar',label:t.name,sub:t.desc,url:'eksamensradar-v3.html',keywords:(t.name+' '+t.desc+' '+(t.short||'')).toLowerCase()});
    });
    // Formelquiz-formler
    if(typeof cards!=='undefined'){
      cards.forEach(c=>{
        idx.push({type:'formel',label:c.q,sub:c.topic+' · '+c.answer,url:'formelquiz.html?deck='+encodeURIComponent(c.deck),keywords:(c.q+' '+c.topic+' '+c.answer+' '+c.id+' '+(c.hint||'')).toLowerCase()});
      });
    }
    // Flashcards (gzip)
    function unzip(s){const bin=atob(s),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return JSON.parse(pako.ungzip(bytes,{to:'string'}));}
    let fdecks=window.SAM3_FLASHCARD_DECKS||[];
    if(!fdecks.length&&window.SAM3_FLASHCARDS_GZIP&&window.pako){
      try{fdecks=unzip(window.SAM3_FLASHCARDS_GZIP.replace('o7eksowow8ez','o7eksow8ez'));}catch(e){}
    }
    fdecks.forEach(d=>{
      d.cards.forEach(c=>{
        const plain=(c.q+' '+c.a).replace(/<[^>]+>/g,' ');
        const snippet=plain.replace(/\s+/g,' ').slice(0,80);
        idx.push({type:'flashcard',label:snippet,sub:d.num+' · '+d.title,url:'flashcards.html?deck='+encodeURIComponent(d.id),keywords:plain.toLowerCase()});
      });
    });
    this.index=idx;this.ready=true;
    return Promise.resolve();
  },
  search(q){
    const t=(q||'').trim().toLowerCase();
    if(t.length<2)return [];
    const tokens=t.split(/\s+/);
    const scored=this.index.map(it=>{
      let score=0;
      tokens.forEach(tok=>{
        if(it.keywords.includes(tok))score+=1;
        if(it.label.toLowerCase().includes(tok))score+=2;
      });
      return {it,score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    return scored.slice(0,12).map(x=>x.it);
  }
};
})();
