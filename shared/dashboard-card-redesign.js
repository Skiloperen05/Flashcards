(function(){
  var tools={
    RET14:['A-besvarelser','Eksamensanalyse','Forelesningsnotater','Oppgavebank','Kompendium'],
    SAM3:['A-besvarelser','Eksamensanalyse','Sensorveiledning','Memoar','Oppgavebank'],
    BED1:['Eksamensanalyse','Innleveringsoppgaver','Kalkylekort','Oppgavebank','Kompendium'],
    KOM1:['Forelesningsnotater','Innleveringsoppgaver','Rapportmal','Memoar','Kompendium']
  };
  function run(){
    document.querySelectorAll('.subject-card').forEach(function(card){
      if(card.querySelector('.subject-tool-pills'))return;
      var code=card.querySelector('.subject-code');
      var c=code?code.textContent.trim():'';
      var list=tools[c]||['Flashcards','A-besvarelser','Eksamensanalyse','Forelesningsnotater','Kompendium'];
      var wrap=document.createElement('div');
      wrap.className='subject-tool-pills';
      list.slice(0,5).forEach(function(label){
        var pill=document.createElement('span');
        pill.textContent=label;
        wrap.appendChild(pill);
      });
      var ring=card.querySelector('.ring');
      if(ring)card.insertBefore(wrap,ring);
      else card.appendChild(wrap);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  setTimeout(run,300);
  setTimeout(run,900);
  window.HaugnesDashboardCardRedesign={run:run};
})();
