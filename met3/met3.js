(function (window, document) {
  'use strict';
  var decks = window.HaugnesLearningContent.decksFor('met3');
  var levels = { grunnleggende: 'Grunnleggende', middels: 'Middels', avansert: 'Avansert' };
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  document.getElementById('met3Counts').innerHTML = [
    [decks.length, 'temadekk'],
    [
      decks.reduce(function (sum, deck) {
        return sum + deck.cards.length;
      }, 0),
      'flashcards',
    ],
    [37, 'Excel-funksjoner'],
  ]
    .map(function (item) {
      return '<div class="hf-stat"><b>' + item[0] + '</b><span>' + item[1] + '</span></div>';
    })
    .join('');
  document.getElementById('met3Decks').innerHTML = decks
    .map(function (deck) {
      var href = '../flashcards/?subject=met3&deck=' + encodeURIComponent(deck.id);
      return (
        '<a class="hf-tool-card" style="--accent:#15803d" href="' +
        href +
        '">' +
        '<div class="hf-tool-top"><span class="hf-tool-icon">ƒ</span><span class="hf-status">' +
        esc(levels[deck.difficulty]) +
        '</span></div>' +
        '<div class="hf-tool-body"><h3>' +
        esc(deck.title) +
        '</h3><p>' +
        esc(deck.description) +
        '</p>' +
        '<div class="hf-tool-foot"><span>' +
        deck.cards.length +
        ' kort</span><span>Start øving →</span></div></div></a>'
      );
    })
    .join('');
})(window, document);
