(function () {
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function toolHtml(tool) {
    return '<a class="hf-tool-card ' + (tool[4] === '#' ? 'hf-disabled' : '') + '" style="--accent:' + esc(tool[5]) + '" href="' + esc(tool[4]) + '">'
      + '<div class="hf-tool-top"><div class="hf-tool-icon">' + esc(tool[0]) + '</div><span class="hf-status ' + (tool[4] === '#' ? 'soon' : '') + '">' + esc(tool[3]) + '</span></div>'
      + '<div class="hf-tool-body"><h3>' + esc(tool[1]) + '</h3><p>' + esc(tool[2]) + '</p><div class="hf-tool-foot"><span>' + (tool[4] === '#' ? 'Neste steg' : 'Åpne') + '</span><span>' + esc(tool[3]) + '</span></div></div>'
      + '</a>';
  }

  function topicHtml(topic, accent) {
    return '<div class="hf-topic"><div><strong>' + esc(topic[0]) + '</strong><span>' + esc(topic[1]) + '</span></div><div class="hf-meter" style="--accent:' + esc(accent) + ';--p:' + esc(topic[2]) + '"><i></i></div></div>';
  }

  function planHtml(item) {
    return '<div class="hf-priority"><div><b>' + esc(item[0]) + '</b><span>' + esc(item[1]) + '</span></div><span>' + esc(item[2]) + '</span></div>';
  }

  function render(page) {
    document.title = page.code + ' ' + page.name + ' — Haugnes Flashcards';
    document.body.style.setProperty('--subject-accent', page.accent);
    document.body.style.setProperty('--subject-progress', page.progress);
    document.getElementById('subjectKicker').textContent = page.kicker + ' · ' + page.code;
    document.getElementById('subjectTitle').innerHTML = esc(page.code) + ' <span>' + esc(page.name) + '</span>';
    document.getElementById('subjectLead').textContent = page.lead;
    document.getElementById('subjectStats').innerHTML = page.stats.map(function (stat) {
      return '<div class="hf-stat"><b>' + esc(stat[0]) + '</b><span>' + esc(stat[1]) + '</span></div>';
    }).join('');
    document.getElementById('toolGrid').innerHTML = page.tools.map(toolHtml).join('');
    document.getElementById('topicList').innerHTML = page.topics.map(function (topic) { return topicHtml(topic, page.accent); }).join('');
    document.getElementById('planList').innerHTML = page.plan.map(planHtml).join('');
    document.getElementById('nextStep').textContent = page.next;
    document.getElementById('progressValue').textContent = page.progress;
  }

  var page = window.HaugnesSubjectPages && window.HaugnesSubjectPages.get(window.HAUGNES_SUBJECT_ID);
  if (page) render(page);
})();
