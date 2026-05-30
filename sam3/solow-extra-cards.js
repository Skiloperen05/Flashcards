(function(){
  function addSolowCards(){
    var decks=window.SAM3_FLASHCARD_DECKS||[];
    var deck=decks.find(function(d){return d.id==='d3';});
    if(!deck||!Array.isArray(deck.cards))return;
    var cards=[
      {
        tag:'Eksamen',
        q:'Hvordan kan du forklare Solow-modellen presist i et eksamenssvar?',
        a:'Solow-modellen forklarer hvordan produksjon per arbeider bestemmes av kapital per arbeider, sparing/investering, avskrivning, befolkningsvekst og teknologi. Økt sparing gir mer kapital og høyere produksjonsnivå, men på grunn av avtakende marginalprodukt beveger økonomien mot en steady state. Uten teknologisk fremgang stopper veksten i produksjon per arbeider; varig vekst krever vekst i teknologi/TFP.'
      },
      {
        tag:'Presisjon',
        q:'Hva er den viktigste presiseringen når du skriver om sparing og vekst i Solow?',
        a:'Skill mellom nivå og vekstrate. En høyere sparerate flytter økonomien til en ny steady state med høyere k og y per arbeider. Det gir overgangsvekst mens kapital bygges opp, men ikke permanent høyere vekstrate i y per arbeider. I Solow kommer langsiktig vekst i levestandard fra teknologisk fremgang.'
      }
    ];
    cards.forEach(function(card){
      if(!deck.cards.some(function(existing){return existing.q===card.q;}))deck.cards.push(card);
    });
  }
  addSolowCards();
})();
