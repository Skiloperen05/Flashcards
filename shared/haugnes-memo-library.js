(function (window, document) {
  'use strict';

  if (window.__haugnesMemoLibraryInstalled) return;
  window.__haugnesMemoLibraryInstalled = true;

  // Published memoarer live in Supabase admin_content under this key:
  // { memos: [{ id, subject_code, title, summary, body, link, updated_at }] }
  // Admins edit in place on user/memoarer.html; everyone with the subject
  // selected can read them.
  var CONTENT_KEY = 'published_memos';

  var BUILTIN = [
    {
      id: 'sam2-memoar-v25',
      subject_code: 'SAM2',
      title: 'SAM2 memoar',
      summary: 'Personlig arbeidsmåte og forventningsstyring for mikroøkonomi: faget føles tungt først, men blir bedre med gjentatte modeller og jevn oppgavetrening.',
      body: '',
      link: '../sam2/memoar/',
      builtin: true,
      updated_at: ''
    }
  ];

  var state = { memos: [], loaded: false, error: null };

  function isPage() { return /\/user\/memoarer\.html$/.test(window.location.pathname); }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function code(value) { return String(value || '').toUpperCase().replace(/[\s-]+/g, ''); }

  function slug(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function isAdmin() {
    return !!(window.HaugnesEntitlements && typeof window.HaugnesEntitlements.effectiveAdmin === 'function' && window.HaugnesEntitlements.effectiveAdmin());
  }

  function getClient() {
    if (!window.AuthGuard || typeof window.AuthGuard.getClient !== 'function') return null;
    try { return window.AuthGuard.getClient(); }
    catch (e) { return null; }
  }

  function subjectCatalog() {
    if (window.HaugnesSubjects && typeof window.HaugnesSubjects.getAll === 'function') {
      return window.HaugnesSubjects.getAll();
    }
    return [];
  }

  function subjectMeta(subjectCode) {
    var c = code(subjectCode);
    var match = subjectCatalog().find(function (subject) { return code(subject.code) === c; });
    return match || { code: c, name: c, accent: '#2f62ff', icon: '✦' };
  }

  function entitledCodes() {
    if (!window.HaugnesEntitlements || typeof window.HaugnesEntitlements.getCodes !== 'function') return [];
    if (window.HaugnesEntitlements.effectiveAdmin && window.HaugnesEntitlements.effectiveAdmin()) {
      var all = subjectCatalog().map(function (subject) { return code(subject.code); });
      if (all.length) return all;
    }
    return window.HaugnesEntitlements.getCodes();
  }

  function selectedCodes() {
    if (window.HaugnesSubjectAccess && typeof window.HaugnesSubjectAccess.getSelected === 'function') {
      return window.HaugnesSubjectAccess.getSelected();
    }
    return entitledCodes();
  }

  function availableCodes() {
    var owned = entitledCodes();
    var selected = selectedCodes();
    if (!owned.length) return [];
    return selected.filter(function (c) { return owned.indexOf(c) !== -1; });
  }

  function allMemos() {
    var remoteIds = state.memos.map(function (memo) { return memo.id; });
    var builtins = BUILTIN.filter(function (memo) { return remoteIds.indexOf(memo.id) === -1; });
    return builtins.concat(state.memos);
  }

  function visibleMemos() {
    var available = availableCodes();
    return allMemos().filter(function (memo) { return available.indexOf(code(memo.subject_code)) !== -1; });
  }

  function load() {
    var sb = getClient();
    if (!sb) { state.loaded = true; return Promise.resolve(); }
    return sb.from('admin_content').select('content').eq('key', CONTENT_KEY).maybeSingle().then(function (result) {
      if (result && result.error) state.error = result.error;
      var content = result && result.data && result.data.content;
      state.memos = (content && Array.isArray(content.memos)) ? content.memos : [];
      state.loaded = true;
    }).catch(function (error) {
      state.error = error;
      state.loaded = true;
    });
  }

  function persist() {
    var sb = getClient();
    if (!sb) return Promise.reject(new Error('Supabase er ikke tilgjengelig'));
    var session = window.AuthGuard && typeof window.AuthGuard.getSession === 'function' ? window.AuthGuard.getSession() : null;
    return sb.from('admin_content').upsert({
      key: CONTENT_KEY,
      content: { memos: state.memos },
      updated_by: session && session.user ? session.user.id : null,
      updated_at: new Date().toISOString()
    }).then(function (result) {
      if (result && result.error) throw result.error;
    });
  }

  // Lightweight formatting: "## " → heading, "- " → bullet list, blank-line-
  // separated text → paragraphs. Everything is escaped first.
  function formatBody(body) {
    var lines = String(body || '').split(/\r?\n/);
    var html = '';
    var bullets = [];
    function flushBullets() {
      if (!bullets.length) return;
      html += '<ul>' + bullets.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>';
      bullets = [];
    }
    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (!trimmed) { flushBullets(); return; }
      if (/^##\s+/.test(trimmed)) { flushBullets(); html += '<h4>' + esc(trimmed.replace(/^##\s+/, '')) + '</h4>'; }
      else if (/^[-*]\s+/.test(trimmed)) { bullets.push(esc(trimmed.replace(/^[-*]\s+/, ''))); }
      else { flushBullets(); html += '<p>' + esc(trimmed) + '</p>'; }
    });
    flushBullets();
    return html;
  }

  function formatDate(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString('no-NO', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return ''; }
  }

  function injectStyles() {
    if (document.getElementById('hf-memo-library-css')) return;
    var style = document.createElement('style');
    style.id = 'hf-memo-library-css';
    style.textContent = [
      '.hf-memo-shell{display:grid;gap:16px}',
      '.hf-memo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}',
      '.hf-memo-card{position:relative;overflow:hidden;border-radius:22px;background:linear-gradient(180deg,rgba(15,43,92,.94),rgba(8,25,56,.96));border:1px solid rgba(126,162,255,.22);box-shadow:0 16px 34px rgba(0,0,0,.20);padding:18px;display:flex;flex-direction:column;gap:12px;color:#fff}',
      '.hf-memo-card::before{content:"";position:absolute;right:-60px;top:-70px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,var(--accent),transparent 68%);opacity:.20}',
      '.hf-memo-top{position:relative;z-index:1;display:flex;justify-content:space-between;align-items:flex-start;gap:10px}',
      '.hf-memo-icon{width:44px;height:44px;border-radius:15px;background:var(--accent);display:grid;place-items:center;color:#fff;font-weight:950;font-size:17px}',
      '.hf-memo-badges{display:grid;gap:6px;justify-items:end}',
      '.hf-memo-badge{font-size:10.5px;font-weight:950;padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.08);color:#cbd7ef}',
      '.hf-memo-badge.gold{background:rgba(232,188,104,.12);border-color:rgba(232,188,104,.24);color:#ffd98f}',
      '.hf-memo-card h3{position:relative;z-index:1;margin:0;font-size:19px;line-height:1.15;letter-spacing:-.035em}',
      '.hf-memo-card>p{position:relative;z-index:1;margin:0;color:#bdc9df;font-size:13px;line-height:1.6}',
      '.hf-memo-body{position:relative;z-index:1;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.10)}',
      '.hf-memo-body summary{cursor:pointer;padding:11px 13px;font-weight:900;font-size:12.5px;color:#b8c9ff;list-style:none}',
      '.hf-memo-body summary::-webkit-details-marker{display:none}',
      '.hf-memo-body[open] summary{border-bottom:1px solid rgba(255,255,255,.10)}',
      '.hf-memo-body-inner{padding:13px;display:grid;gap:9px}',
      '.hf-memo-body-inner h4{margin:4px 0 0;font-size:13.5px;color:#ffd98f;letter-spacing:-.01em}',
      '.hf-memo-body-inner p{margin:0;color:#c6d2e8;font-size:12.8px;line-height:1.65}',
      '.hf-memo-body-inner ul{margin:0;padding-left:19px;display:grid;gap:5px;color:#c6d2e8;font-size:12.8px;line-height:1.55}',
      '.hf-memo-actions{position:relative;z-index:1;margin-top:auto;display:flex;gap:9px;flex-wrap:wrap}',
      '.hf-memo-open{height:37px;padding:0 13px;border-radius:12px;background:linear-gradient(135deg,#2657e9,#3e72ff);color:#fff;font:950 12px Lora,Georgia,serif;display:inline-flex;align-items:center;text-decoration:none}',
      '.hf-memo-meta{position:relative;z-index:1;color:#8fa5ca;font-size:11px;font-weight:800}',
      '.hf-memo-empty{padding:18px;border-radius:18px;background:rgba(255,255,255,.035);border:1px dashed rgba(126,162,255,.25);color:#aebddd;line-height:1.6}',
      '.hf-memo-admin{border-radius:18px;border:1px solid rgba(246,180,60,.36);background:linear-gradient(180deg,rgba(246,180,60,.09),rgba(8,25,57,.72));padding:15px;display:grid;gap:11px}',
      '.hf-memo-admin-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}',
      '.hf-memo-admin-head strong{color:#ffd98f;font-size:13px;letter-spacing:.08em;text-transform:uppercase}',
      '.hf-memo-admin-head span{color:#cbd6eb;font-size:12px}',
      '.hf-memo-admin-actions{display:flex;gap:9px;flex-wrap:wrap}',
      '.hf-memo-admin-btn{height:36px;padding:0 13px;border-radius:12px;border:0;cursor:pointer;font:950 12px Lora,Georgia,serif;background:linear-gradient(135deg,#f6b43c,#f09a25);color:#061735}',
      '.hf-memo-admin-btn.ghost{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#e6edfb}',
      '.hf-memo-admin-btn.danger{background:rgba(239,68,68,.14);border:1px solid rgba(239,68,68,.32);color:#fecaca}',
      '@media(max-width:900px){.hf-memo-grid{grid-template-columns:1fr}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function updateHero() {
    var memos = visibleMemos();
    var subjectsCount = memos.map(function (memo) { return code(memo.subject_code); }).filter(function (c, i, arr) { return arr.indexOf(c) === i; }).length;
    var stats = document.querySelectorAll('.hero-stat b');
    var labels = document.querySelectorAll('.hero-stat span');
    if (stats[0]) stats[0].textContent = memos.length;
    if (stats[1]) stats[1].textContent = subjectsCount;
    if (stats[2]) stats[2].textContent = memos.filter(function (memo) { return !memo.builtin; }).length;
    if (labels[0]) labels[0].textContent = 'memoarer';
    if (labels[1]) labels[1].textContent = 'fag';
    if (labels[2]) labels[2].textContent = 'publisert her';
  }

  function memoCard(memo) {
    var meta = subjectMeta(memo.subject_code);
    var editable = !memo.builtin && isAdmin();
    var html = '<article class="hf-memo-card" style="--accent:' + esc(meta.accent) + '" data-memo-id="' + esc(memo.id) + '">'
      + '<div class="hf-memo-top"><span class="hf-memo-icon">' + esc(meta.icon) + '</span>'
      + '<span class="hf-memo-badges"><span class="hf-memo-badge gold">' + esc(code(memo.subject_code)) + '</span>'
      + (memo.builtin ? '<span class="hf-memo-badge">Fagside</span>' : '<span class="hf-memo-badge">Memoar</span>') + '</span></div>'
      + '<h3>' + esc(memo.title) + '</h3>'
      + (memo.summary ? '<p>' + esc(memo.summary) + '</p>' : '');
    if (memo.body) {
      html += '<details class="hf-memo-body"><summary>Les memoaret →</summary><div class="hf-memo-body-inner">' + formatBody(memo.body) + '</div></details>';
    }
    html += '<div class="hf-memo-actions">'
      + (memo.link ? '<a class="hf-memo-open" href="' + esc(memo.link) + '">Åpne memoarside →</a>' : '')
      + (editable ? '<button type="button" class="hf-memo-admin-btn ghost" data-memo-action="edit" data-id="' + esc(memo.id) + '">Rediger</button><button type="button" class="hf-memo-admin-btn danger" data-memo-action="delete" data-id="' + esc(memo.id) + '">Slett</button>' : '')
      + '</div>';
    if (memo.updated_at) html += '<div class="hf-memo-meta">Oppdatert ' + esc(formatDate(memo.updated_at)) + '</div>';
    return html + '</article>';
  }

  function adminPanelHtml() {
    return '<div class="hf-memo-admin"><div class="hf-memo-admin-head"><strong>Adminverktøy</strong><span>Publiser nye memoarer direkte. De vises for alle som har faget.</span></div>'
      + '<div class="hf-memo-admin-actions"><button type="button" class="hf-memo-admin-btn" data-memo-action="new">＋ Nytt memoar</button></div></div>';
  }

  function render() {
    if (!isPage()) return;
    injectStyles();
    updateHero();
    var host = document.querySelector('.workspace > section') || document.getElementById('memoLibraryHost');
    if (!host) return;
    var memos = visibleMemos();
    var html = '<div class="hf-memo-shell">';
    if (isAdmin()) html += adminPanelHtml();
    if (!state.loaded) {
      html += '<div class="hf-memo-empty">Laster memoarer …</div>';
    } else if (!memos.length) {
      html += '<div class="hf-memo-empty"><strong>Ingen memoarer for valgte fag ennå.</strong><br>Memoarer er korte, personlige oppsummeringer av arbeidsmåte, fallgruver og hva som faktisk funker i hvert fag. De dukker opp her når de publiseres.</div>';
    } else {
      html += '<div class="hf-memo-grid">' + memos.map(memoCard).join('') + '</div>';
    }
    html += '</div>';
    host.innerHTML = html;
    renderSide(memos);
    bind(host);
  }

  function renderSide(memos) {
    var side = document.querySelector('.side-col');
    if (!side) return;
    var list = memos.length ? memos.map(function (memo, index) {
      return '<a class="popular-item" href="#" data-memo-jump="' + esc(memo.id) + '"><span class="rank">' + (index + 1) + '</span><div><strong>' + esc(code(memo.subject_code)) + '</strong><span>' + esc(memo.title) + '</span></div><span class="pop-tag">Memoar</span></a>';
    }).join('') : '<div class="hf-memo-empty">Ingen memoarer publisert ennå.</div>';
    side.innerHTML = '<section class="side-panel"><div class="side-head"><h2>Publiserte memoarer</h2></div><div class="popular-list">' + list + '</div></section>'
      + '<section class="side-panel"><div class="side-head"><h2>Hva er et memoar?</h2></div><div class="popular-list">'
      + '<div class="popular-item"><span class="rank">1</span><div><strong>Arbeidsmåte</strong><span>Hvordan faget faktisk bør angripes, uke for uke.</span></div></div>'
      + '<div class="popular-item"><span class="rank">2</span><div><strong>Fallgruver</strong><span>Det som pleier å gå galt – og hvordan du unngår det.</span></div></div>'
      + '<div class="popular-item"><span class="rank">3</span><div><strong>Eksamensfokus</strong><span>Hva som gir uttelling når det nærmer seg.</span></div></div>'
      + '</div></section>';
    side.querySelectorAll('[data-memo-jump]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        var target = document.querySelector('[data-memo-id="' + link.getAttribute('data-memo-jump') + '"]');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  function closeModal() {
    var backdrop = document.getElementById('hfMemoModalBackdrop');
    if (backdrop) backdrop.remove();
  }

  function openMemoForm(existing) {
    closeModal();
    var catalog = subjectCatalog();
    var options = (catalog.length ? catalog : [{ code: 'SAM2', name: 'Mikroøkonomi' }]).map(function (subject) {
      var selected = existing ? code(existing.subject_code) === code(subject.code) : false;
      return '<option value="' + esc(code(subject.code)) + '"' + (selected ? ' selected' : '') + '>' + esc(code(subject.code) + ' · ' + subject.name) + '</option>';
    }).join('');

    var backdrop = document.createElement('div');
    backdrop.id = 'hfMemoModalBackdrop';
    backdrop.className = 'hf-admin-modal-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(3,10,26,.72);display:grid;place-items:center;padding:20px;overflow-y:auto';
    backdrop.innerHTML = '<div style="width:min(640px,100%);max-height:calc(100vh - 40px);overflow-y:auto;border-radius:20px;border:1px solid rgba(246,180,60,.34);background:linear-gradient(180deg,#0d2757,#081938);box-shadow:0 30px 80px rgba(0,0,0,.55);padding:20px;display:grid;gap:12px;font-family:Lora,Georgia,serif;color:#fff">'
      + '<h3 style="margin:0;font-size:19px;letter-spacing:-.03em">' + (existing ? 'Rediger memoar' : 'Nytt memoar') + '</h3>'
      + '<p style="margin:0;color:#9fb0cf;font-size:12.5px;line-height:1.55">Bruk «## Overskrift» for mellomtitler og «- punkt» for kulepunkter i teksten. Publiseres umiddelbart.</p>'
      + '<label class="hf-memo-field"><span>Fag</span><select id="hfMemoSubject">' + options + '</select></label>'
      + '<label class="hf-memo-field"><span>Tittel *</span><input id="hfMemoTitle" type="text" value="' + esc(existing ? existing.title : '') + '" placeholder="SAM3 memoar"></label>'
      + '<label class="hf-memo-field"><span>Kort oppsummering</span><input id="hfMemoSummary" type="text" value="' + esc(existing ? existing.summary : '') + '" placeholder="Én setning om hva memoaret handler om"></label>'
      + '<label class="hf-memo-field"><span>Memoartekst</span><textarea id="hfMemoBody" rows="10" placeholder="## Arbeidsmåte&#10;- Start med modellene&#10;- Regn oppgaver hver uke&#10;&#10;## Fallgruver&#10;…">' + esc(existing ? existing.body : '') + '</textarea></label>'
      + '<label class="hf-memo-field"><span>Lenke til egen side (valgfri)</span><input id="hfMemoLink" type="text" value="' + esc(existing ? (existing.link || '') : '') + '" placeholder="../sam2/memoar/"></label>'
      + '<div style="display:flex;justify-content:flex-end;gap:10px;align-items:center;flex-wrap:wrap"><span id="hfMemoState" style="color:#cbd6eb;font-size:12px;min-height:16px"></span>'
      + '<button type="button" class="hf-memo-admin-btn ghost" id="hfMemoCancel">Avbryt</button>'
      + '<button type="button" class="hf-memo-admin-btn" id="hfMemoSave">Publiser</button></div>'
      + '</div>';
    document.body.appendChild(backdrop);

    if (!document.getElementById('hf-memo-field-css')) {
      var style = document.createElement('style');
      style.id = 'hf-memo-field-css';
      style.textContent = [
        '.hf-memo-field{display:grid;gap:5px}',
        '.hf-memo-field span{font-size:11.5px;font-weight:900;color:#cbd6eb;letter-spacing:.05em;text-transform:uppercase}',
        '.hf-memo-field input,.hf-memo-field select,.hf-memo-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);border-radius:12px;color:#fff;padding:10px 12px;font:650 13px Lora,Georgia,serif;outline:none;resize:vertical}',
        '.hf-memo-field input:focus,.hf-memo-field select:focus,.hf-memo-field textarea:focus{border-color:rgba(246,180,60,.55)}',
        '.hf-memo-field select option{background:#0b2148;color:#fff}'
      ].join('\n');
      document.head.appendChild(style);
    }

    backdrop.addEventListener('click', function (event) { if (event.target === backdrop) closeModal(); });
    backdrop.querySelector('#hfMemoCancel').addEventListener('click', closeModal);
    backdrop.querySelector('#hfMemoSave').addEventListener('click', function () {
      var title = backdrop.querySelector('#hfMemoTitle').value.trim();
      var stateEl = backdrop.querySelector('#hfMemoState');
      if (!title) { stateEl.textContent = 'Tittel mangler.'; return; }
      var subjectCode = code(backdrop.querySelector('#hfMemoSubject').value);
      var memo = {
        id: existing ? existing.id : (slug(subjectCode) + '-' + (slug(title) || 'memoar') + '-' + Date.now().toString(36)),
        subject_code: subjectCode,
        title: title,
        summary: backdrop.querySelector('#hfMemoSummary').value.trim(),
        body: backdrop.querySelector('#hfMemoBody').value.replace(/\r\n/g, '\n'),
        link: backdrop.querySelector('#hfMemoLink').value.trim(),
        updated_at: new Date().toISOString()
      };
      var previous = state.memos.slice();
      if (existing) state.memos = state.memos.map(function (item) { return item.id === existing.id ? memo : item; });
      else state.memos = state.memos.concat([memo]);
      var saveBtn = backdrop.querySelector('#hfMemoSave');
      saveBtn.disabled = true;
      stateEl.textContent = 'Publiserer…';
      persist().then(function () {
        closeModal();
        render();
      }).catch(function (error) {
        state.memos = previous;
        saveBtn.disabled = false;
        stateEl.textContent = 'Kunne ikke lagre: ' + (error && error.message ? error.message : 'ukjent feil');
      });
    });
  }

  function deleteMemo(id) {
    var memo = state.memos.find(function (item) { return item.id === id; });
    if (!memo) return;
    if (!window.confirm('Slette memoaret «' + memo.title + '»?')) return;
    var previous = state.memos.slice();
    state.memos = state.memos.filter(function (item) { return item.id !== id; });
    persist().then(render).catch(function (error) {
      state.memos = previous;
      window.alert('Kunne ikke slette: ' + (error && error.message ? error.message : 'ukjent feil'));
      render();
    });
  }

  function bind(host) {
    host.querySelectorAll('[data-memo-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        var action = button.getAttribute('data-memo-action');
        if (!isAdmin()) return;
        if (action === 'new') openMemoForm(null);
        else if (action === 'edit') {
          var memo = state.memos.find(function (item) { return item.id === button.getAttribute('data-id'); });
          if (memo) openMemoForm(memo);
        } else if (action === 'delete') deleteMemo(button.getAttribute('data-id'));
      });
    });
  }

  function waitForAuth(done) {
    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      if (window.AuthGuard && window.HaugnesEntitlements && typeof window.HaugnesEntitlements.load === 'function') {
        window.clearInterval(timer);
        window.HaugnesEntitlements.load().then(done, done);
        return;
      }
      if (tries > 80) { window.clearInterval(timer); done(); }
    }, 100);
  }

  function install() {
    if (!isPage()) return;
    injectStyles();
    render();
    waitForAuth(function () {
      load().then(render);
    });
    window.addEventListener('haugnes:entitlements-changed', function () { window.setTimeout(render, 0); });
    window.addEventListener('haugnes:subject-access-changed', function () { window.setTimeout(render, 0); });
  }

  window.HaugnesMemoLibrary = {
    render: render,
    reload: function () { return load().then(render); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})(window, document);
