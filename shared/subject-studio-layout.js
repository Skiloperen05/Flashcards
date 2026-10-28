(function (window, document) {
  'use strict';
  if (window.HaugnesSubjectLayout) return;
  var latest, selected = '', dragging = '', enabled = true;
  var anchors = new WeakMap();
  var params = new URLSearchParams(window.location.search);
  var canvas = params.get('studio') === '1' && window.parent !== window;
  var labels = { intro:'Egne forklaringer', notes:'Forelesningsnotater', answers:'Eksamensdokumenter', tasks:'Oppgavebank', study:'Flashcards og quiz', overview:'Temaer og øvingsløp', radar:'Eksamensradar', resources:'Ressurser', learning:'Metoder og kontrollspørsmål', tools:'Læringsverktøy', reading:'Memoar', supplements:'Notater og tilleggsinnhold' };
  function editing() { return canvas && enabled && !!window.HaugnesEntitlements?.isAdmin(); }
  function send(data) { if (canvas) { data.subject_code=String(latest?.subject_code || latest?.code || params.get('id') || params.get('subject') || window.location.pathname.split('/').filter(Boolean)[0] || '').toUpperCase(); window.parent.postMessage(data, window.location.origin); } }
  function nodes() {
    var definitions = [['intro','#memo'],['notes','#notater'],['answers','#besvarelser'],['tasks','#oppgaver'],['study','#flashcards'],['overview','#topicsAndPlanGrid'],['radar','#eksamensradar'],['resources','#ressurser'],['learning','#learningSuite'],['tools','#toolGrid,#met3Decks,main .hf-card-grid'],['reading','.semester-layout'],['supplements','#studioCourseContent']];
    if (!document.getElementById('subjectTabBar')) definitions=definitions.filter(function(entry){return ['study','tools','reading','supplements'].includes(entry[0]);});
    return definitions.map(function (entry) {
      var node = document.querySelector('[data-studio-layout-key="' + entry[0] + '"]') || document.querySelector(entry[1]);
      return node ? { key:entry[0], label:labels[entry[0]], node:node } : null;
    }).filter(Boolean);
  }
  function visibility(page, key) {
    var vis = page.visibility || {};
    if (key === 'overview') return vis.topics !== false || vis.plan !== false;
    if (key === 'intro') key = 'overview';
    if (key === 'study') key = 'flashcards';
    return vis[key] !== false;
  }
  function empty(page, key) {
    var files = page.files;
    if (key === 'notes') return !(files ? files.memo : page.notes)?.length;
    if (key === 'answers') return !(files ? files.answer : page.answers)?.length;
    if (key === 'tasks') return !(files ? files.task : page.tasks)?.length;
    if (key === 'radar') return !(page.blocks ? page.blocks.radar : Array.isArray(page.examRadar) ? page.examRadar : page.examRadar?.rows)?.length;
    if (key === 'overview') return !(page.topics?.length || page.plan?.length);
    if (key === 'tools') return !document.querySelector('#toolGrid a,#met3Decks a,main .hf-card-grid a');
    return false;
  }
  function apply(page) {
    if (!page) return;
    latest = page;
    var items = nodes().filter(function (item) { return !(String(page.code || page.subject_code || '').toUpperCase() === 'RRR11' && item.key === 'tools'); }).sort(function (a,b) { return a.node.compareDocumentPosition(b.node) & 4 ? -1 : 1; });
    var order = (Array.isArray(page.visibility?.section_order) ? page.visibility.section_order : []).filter(function (key, index, all) { return labels[key] && all.indexOf(key) === index; });
    var edit = editing();
    if (order.length || edit) {
      items.forEach(function(item){
        var heading=item.node.previousElementSibling;
        if(item.key==='tools' && !item.node.hasAttribute('data-studio-tool-group') && heading?.classList.contains('hf-section-head')){
          var wrapper=document.createElement('div');wrapper.dataset.studioLayoutKey='tools';wrapper.dataset.studioToolGroup='1';
          heading.before(wrapper);delete item.node.dataset.studioLayoutKey;wrapper.append(heading,item.node);item.node=wrapper;
        }
      });
    }
    if (order.length) {
      var host = document.querySelector('.hf-subject-layout>div') || document.querySelector('main>.hf-shell') || document.querySelector('main');
      var ordered = order.map(function (key) { return items.find(function (item) { return item.key === key; }); }).filter(Boolean);
      items.forEach(function (item) { if (!order.includes(item.key)) ordered.push(item); });
      if (host) {
        var anchor=anchors.get(host);
        if(!anchor || anchor.parentNode!==host){
          anchor=document.createComment('Studio section order');
          var first=Array.from(host.children).find(function(node){return items.some(function(item){return item.node===node;});});
          host.insertBefore(anchor,first || host.firstChild);anchors.set(host,anchor);
        }
        var previous=anchor;
        ordered.forEach(function(item){if(previous.nextSibling!==item.node)host.insertBefore(item.node,previous.nextSibling);previous=item.node;});
      }
      items = ordered;
    }
    document.body.classList.toggle('hf-studio-canvas',canvas && !!window.HaugnesEntitlements?.isAdmin());
    document.body.classList.toggle('hf-studio-canvas-editing', edit);
    items.forEach(function (item) {
      var node = item.node;
      node.dataset.studioLayoutKey = item.key;
      var handle = node.querySelector(':scope>.studio-layout-handle');
      if (edit) {
        if (!handle) {
          handle = document.createElement('div'); handle.className = 'studio-layout-handle'; handle.draggable = true;
          handle.innerHTML = '<span aria-hidden="true">⠿</span><span></span><small>Dra for å flytte</small>';
          node.prepend(handle);
        }
        var isEmpty = empty(page, item.key);
        var hidden = !visibility(page, item.key);
        handle.children[1].textContent = item.label + (hidden ? ' · skjult' : isEmpty ? ' · tom seksjon' : '');
        node.classList.toggle('studio-layout-empty', isEmpty);
        node.classList.toggle('studio-layout-selected', selected === item.key);
        if (isEmpty || hidden) { node.dataset.studioRestoreDisplay = 'none'; node.style.display = selected === item.key ? 'block' : 'none'; }
        else if (node.dataset.studioRestoreDisplay) { node.style.display = ''; delete node.dataset.studioRestoreDisplay; }
      } else {
        if (handle) handle.remove();
        node.classList.remove('studio-layout-empty','studio-layout-selected');
        if (node.dataset.studioRestoreDisplay) { node.style.display = node.dataset.studioRestoreDisplay; delete node.dataset.studioRestoreDisplay; }
      }
    });
    if (edit) send({ type:'HF_STUDIO_MODULES', modules:items.map(function (item) { return { key:item.key, label:item.label, visible:visibility(page,item.key), empty:empty(page,item.key) }; }) });
  }
  function pick(key) { selected = key; apply(latest); send({ type:'HF_STUDIO_SELECT', key:key }); }
  document.addEventListener('click', function (event) {
    if (!editing()) return;
    var field = event.target.closest('#subjectTitle,.hf-hero h1,.semester-heading h1,#subjectLead,.hf-hero .hf-lead,.semester-lead,#subjectKicker,.hf-hero .hf-kicker,.semester-eyebrow');
    if (field) {
      event.preventDefault(); event.stopImmediatePropagation();
      send({ type:'HF_STUDIO_SELECT', key:'header' }); return;
    }
    var box = event.target.closest('[data-studio-layout-key]');
    if (box) { event.preventDefault(); event.stopImmediatePropagation(); pick(box.dataset.studioLayoutKey); }
  }, true);
  document.addEventListener('dragstart', function (event) {
    if (!editing() || !event.target.closest('.studio-layout-handle')) return;
    dragging = event.target.closest('[data-studio-layout-key]').dataset.studioLayoutKey;
    event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', dragging);
  });
  document.addEventListener('dragover', function (event) {
    if (!editing() || !dragging) return;
    var box = event.target.closest('[data-studio-layout-key]');
    if (box) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; box.classList.add('studio-layout-drop'); }
  });
  document.addEventListener('dragleave', function (event) { event.target.closest?.('[data-studio-layout-key]')?.classList.remove('studio-layout-drop'); });
  document.addEventListener('drop', function (event) {
    var box = event.target.closest('[data-studio-layout-key]');
    if (!editing() || !dragging || !box) return;
    event.preventDefault();
    var keys = nodes().filter(function (item) { return item.node.style.display !== 'none' && item.node.querySelector(':scope>.studio-layout-handle'); }).sort(function (a,b) { return a.node.compareDocumentPosition(b.node) & 4 ? -1 : 1; }).map(function (item) { return item.key; });
    var target = keys.indexOf(box.dataset.studioLayoutKey), from = keys.indexOf(dragging);
    if (from !== target) { keys.splice(from,1); keys.splice(target,0,dragging); send({ type:'HF_STUDIO_ORDER', order:keys }); }
    dragging = ''; document.querySelectorAll('.studio-layout-drop').forEach(function (node) { node.classList.remove('studio-layout-drop'); });
  });
  document.addEventListener('dragend', function () { dragging = ''; document.querySelectorAll('.studio-layout-drop').forEach(function (node) { node.classList.remove('studio-layout-drop'); }); });
  window.addEventListener('message', function (event) {
    if (!canvas || event.origin !== window.location.origin || event.source !== window.parent) return;
    var message = event.data || {};
    if (message.type === 'HF_STUDIO_DRAFT' && window.HaugnesEntitlements?.isAdmin()) {
      if (window.SubjectPageStudioBridge?.preview) window.SubjectPageStudioBridge.preview(message.subject);
      else if (window.HaugnesStudioLive) window.HaugnesStudioLive.render(message.subject);
    }
    if (message.type === 'HF_STUDIO_EDITING') { enabled = !!message.enabled; apply(latest); }
    if (message.type === 'HF_STUDIO_HIGHLIGHT') { selected = message.key; apply(latest); document.querySelector('[data-studio-layout-key="' + selected + '"]')?.scrollIntoView({ block:'center', behavior:'smooth' }); }
  });
  window.addEventListener('haugnes:page-updated', function (event) { if (event.detail?.data) window.requestAnimationFrame(function () { apply(event.detail.data); }); });
  var css = document.createElement('link'); css.rel='stylesheet'; css.href=(window.AuthGuard?.getRootPath() || '../').replace(/\/?$/,'/')+'shared/subject-studio-layout.css?v=20261028-canvas'; document.head.appendChild(css);
  window.HaugnesSubjectLayout = { apply:apply };
  if (canvas) send({ type:'HF_STUDIO_READY' });
})(window, document);
