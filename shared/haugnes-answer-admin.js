(function (window, document) {
  'use strict';

  if (window.__haugnesAnswerAdminInstalled) return;
  window.__haugnesAnswerAdminInstalled = true;

  var KINDS = ['Eksamen', 'A-besvarelse', 'Sensorveiledning', 'Oppgavesett', 'Notat'];
  var KIND_ICONS = { 'Eksamen': 'E', 'A-besvarelse': 'A', 'Sensorveiledning': 'S', 'Oppgavesett': 'O', 'Notat': 'N' };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

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

  function library() { return window.HaugnesAnswerLibrary || null; }
  function packages() { var lib = library(); return lib && lib.packages ? lib.packages : []; }
  function subjects() { var lib = library(); return lib && lib.subjects ? lib.subjects : []; }
  function packageById(id) { return packages().find(function (p) { return p.id === id; }); }

  function resourceById(id) {
    var found = null;
    packages().forEach(function (p) {
      p.resources.forEach(function (r) { if (r.id === id) found = { pack: p, resource: r }; });
    });
    return found;
  }

  function currentState() {
    var parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    var subject = parts[0] ? parts[0].toUpperCase() : null;
    return {
      subject: subject,
      packageId: subject && parts[1] ? subject.toLowerCase() + '-' + parts[1] : null
    };
  }

  function reloadLibrary() {
    var lib = library();
    if (lib && typeof lib.reload === 'function') return lib.reload();
    return Promise.resolve();
  }

  function injectStyles() {
    if (document.getElementById('hf-answer-admin-css')) return;
    var style = document.createElement('style');
    style.id = 'hf-answer-admin-css';
    style.textContent = [
      '.hf-admin-panel{border-radius:18px;border:1px solid rgba(246,180,60,.36);background:linear-gradient(180deg,rgba(246,180,60,.09),rgba(8,25,57,.72));padding:15px;display:grid;gap:12px}',
      '.hf-admin-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}',
      '.hf-admin-panel-head strong{color:#ffd98f;font-size:13px;letter-spacing:.08em;text-transform:uppercase}',
      '.hf-admin-panel-head span{color:#cbd6eb;font-size:12px}',
      '.hf-admin-actions{display:flex;gap:9px;flex-wrap:wrap}',
      '.hf-admin-btn{height:36px;padding:0 13px;border-radius:12px;border:0;cursor:pointer;font:950 12px Lora,Georgia,serif;display:inline-flex;align-items:center;gap:7px;background:linear-gradient(135deg,#f6b43c,#f09a25);color:#061735;box-shadow:0 12px 24px rgba(240,154,37,.20)}',
      '.hf-admin-btn.ghost{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#e6edfb;box-shadow:none}',
      '.hf-admin-btn.danger{background:rgba(239,68,68,.14);border:1px solid rgba(239,68,68,.32);color:#fecaca;box-shadow:none}',
      '.hf-admin-list{display:grid;gap:8px}',
      '.hf-admin-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:13px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.10);flex-wrap:wrap}',
      '.hf-admin-row b{color:#fff;font-size:13px}.hf-admin-row small{color:#9fb0cf;font-size:11px;display:block;margin-top:2px}',
      '.hf-admin-row .hf-admin-actions{justify-content:flex-end}',
      '.hf-admin-state{color:#cbd6eb;font-size:12px;min-height:16px}',
      '.hf-admin-modal-backdrop{position:fixed;inset:0;z-index:99998;background:rgba(3,10,26,.72);backdrop-filter:blur(4px);display:grid;place-items:center;padding:20px;overflow-y:auto}',
      '.hf-admin-modal{width:min(620px,100%);max-height:calc(100vh - 40px);overflow-y:auto;border-radius:20px;border:1px solid rgba(246,180,60,.34);background:linear-gradient(180deg,#0d2757,#081938);box-shadow:0 30px 80px rgba(0,0,0,.55);padding:20px;display:grid;gap:13px;font-family:Lora,Georgia,serif;color:#fff}',
      '.hf-admin-modal h3{margin:0;font-size:19px;letter-spacing:-.03em}',
      '.hf-admin-modal p{margin:0;color:#9fb0cf;font-size:12.5px;line-height:1.55}',
      '.hf-admin-field{display:grid;gap:5px}',
      '.hf-admin-field span{font-size:11.5px;font-weight:900;color:#cbd6eb;letter-spacing:.05em;text-transform:uppercase}',
      '.hf-admin-field input,.hf-admin-field select,.hf-admin-field textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);border-radius:12px;color:#fff;padding:10px 12px;font:650 13px Lora,Georgia,serif;outline:none}',
      '.hf-admin-field textarea{resize:vertical;min-height:74px}',
      '.hf-admin-field input:focus,.hf-admin-field select:focus,.hf-admin-field textarea:focus{border-color:rgba(246,180,60,.55)}',
      '.hf-admin-field select option{background:#0b2148;color:#fff}',
      '.hf-admin-modal-row{display:grid;grid-template-columns:1fr 1fr;gap:11px}',
      '.hf-admin-modal-foot{display:flex;justify-content:flex-end;gap:10px;align-items:center;flex-wrap:wrap}',
      '@media(max-width:640px){.hf-admin-modal-row{grid-template-columns:1fr}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function closeModal() {
    var backdrop = document.getElementById('hfAdminModalBackdrop');
    if (backdrop) backdrop.remove();
  }

  // fields: [{ name, label, type: 'text'|'textarea'|'select'|'number', value, options, placeholder, required }]
  function openModal(title, intro, fields, onSave) {
    closeModal();
    var backdrop = document.createElement('div');
    backdrop.id = 'hfAdminModalBackdrop';
    backdrop.className = 'hf-admin-modal-backdrop';

    var fieldsHtml = fields.map(function (field) {
      var input;
      if (field.type === 'textarea') {
        input = '<textarea name="' + esc(field.name) + '" placeholder="' + esc(field.placeholder || '') + '">' + esc(field.value) + '</textarea>';
      } else if (field.type === 'select') {
        input = '<select name="' + esc(field.name) + '">' + (field.options || []).map(function (option) {
          return '<option value="' + esc(option.value) + '"' + (String(option.value) === String(field.value) ? ' selected' : '') + '>' + esc(option.label) + '</option>';
        }).join('') + '</select>';
      } else {
        input = '<input type="' + (field.type === 'number' ? 'number' : 'text') + '" name="' + esc(field.name) + '" value="' + esc(field.value) + '" placeholder="' + esc(field.placeholder || '') + '">';
      }
      return '<label class="hf-admin-field' + (field.half ? ' half' : '') + '"><span>' + esc(field.label) + (field.required ? ' *' : '') + '</span>' + input + '</label>';
    });

    // Pair half-width fields into rows
    var bodyHtml = '';
    for (var i = 0; i < fields.length; i += 1) {
      if (fields[i].half && fields[i + 1] && fields[i + 1].half) {
        bodyHtml += '<div class="hf-admin-modal-row">' + fieldsHtml[i] + fieldsHtml[i + 1] + '</div>';
        i += 1;
      } else {
        bodyHtml += fieldsHtml[i];
      }
    }

    backdrop.innerHTML = '<div class="hf-admin-modal" role="dialog" aria-modal="true">'
      + '<h3>' + esc(title) + '</h3>'
      + (intro ? '<p>' + esc(intro) + '</p>' : '')
      + bodyHtml
      + '<div class="hf-admin-modal-foot"><span class="hf-admin-state" id="hfAdminModalState"></span>'
      + '<button type="button" class="hf-admin-btn ghost" id="hfAdminModalCancel">Avbryt</button>'
      + '<button type="button" class="hf-admin-btn" id="hfAdminModalSave">Lagre</button></div>'
      + '</div>';
    document.body.appendChild(backdrop);

    backdrop.addEventListener('click', function (event) { if (event.target === backdrop) closeModal(); });
    backdrop.querySelector('#hfAdminModalCancel').addEventListener('click', closeModal);
    backdrop.querySelector('#hfAdminModalSave').addEventListener('click', function () {
      var values = {};
      var missing = [];
      fields.forEach(function (field) {
        var input = backdrop.querySelector('[name="' + field.name + '"]');
        var value = input ? String(input.value).trim() : '';
        values[field.name] = value;
        if (field.required && !value) missing.push(field.label);
      });
      var stateEl = backdrop.querySelector('#hfAdminModalState');
      if (missing.length) {
        stateEl.textContent = 'Mangler: ' + missing.join(', ');
        return;
      }
      var saveBtn = backdrop.querySelector('#hfAdminModalSave');
      saveBtn.disabled = true;
      stateEl.textContent = 'Lagrer…';
      Promise.resolve(onSave(values)).then(function () {
        closeModal();
      }).catch(function (error) {
        saveBtn.disabled = false;
        stateEl.textContent = 'Kunne ikke lagre: ' + (error && error.message ? error.message : 'ukjent feil');
      });
    });
  }

  function uniquePackageId(subjectCode, term) {
    var base = slug(subjectCode) + '-' + (slug(term) || 'pakke');
    var id = base;
    var n = 2;
    while (packageById(id)) { id = base + '-' + n; n += 1; }
    return id;
  }

  function uniqueResourceId(packageId, kind) {
    var base = packageId + '-' + (slug(kind) || 'ressurs');
    var id = base;
    var n = 2;
    while (resourceById(id)) { id = base + '-' + n; n += 1; }
    return id;
  }

  function savePackage(existing, values) {
    var sb = getClient();
    if (!sb) return Promise.reject(new Error('Supabase er ikke tilgjengelig'));
    var row = {
      id: existing ? existing.id : uniquePackageId(values.subject_code, values.term),
      subject_code: values.subject_code.toUpperCase(),
      term: values.term,
      title: values.title,
      subtitle: values.subtitle || (values.subject_code.toUpperCase() + ' ' + values.term),
      description: values.description || '',
      local_status: values.local_status || null,
      sort_order: parseInt(values.sort_order, 10) || 0,
      updated_at: new Date().toISOString()
    };
    return sb.from('answer_packages').upsert(row).then(function (result) {
      if (result && result.error) throw result.error;
      return reloadLibrary();
    });
  }

  function deletePackage(pack) {
    if (!window.confirm('Slette pakken «' + pack.title + '» (' + pack.subject + ' ' + pack.term + ') og alle PDF-ene i den?')) return;
    var sb = getClient();
    if (!sb) return;
    sb.from('answer_packages').delete().eq('id', pack.id).then(function (result) {
      if (result && result.error) {
        window.alert('Kunne ikke slette: ' + result.error.message);
        return;
      }
      reloadLibrary();
    });
  }

  function saveResource(pack, existing, values) {
    var sb = getClient();
    if (!sb) return Promise.reject(new Error('Supabase er ikke tilgjengelig'));
    var row = {
      id: existing ? existing.id : uniqueResourceId(pack.id, values.kind),
      package_id: pack.id,
      kind: values.kind,
      title: values.title,
      subtitle: values.subtitle || '',
      description: values.description || '',
      icon: values.icon || KIND_ICONS[values.kind] || 'D',
      url: values.url,
      download_url: values.download_url || values.url,
      order_index: parseInt(values.order_index, 10) || 0
    };
    return sb.from('answer_resources').upsert(row).then(function (result) {
      if (result && result.error) throw result.error;
      return reloadLibrary();
    });
  }

  function deleteResource(resource) {
    if (!window.confirm('Slette «' + resource.title + '» fra pakken?')) return;
    var sb = getClient();
    if (!sb) return;
    sb.from('answer_resources').delete().eq('id', resource.id).then(function (result) {
      if (result && result.error) {
        window.alert('Kunne ikke slette: ' + result.error.message);
        return;
      }
      reloadLibrary();
    });
  }

  function subjectOptions(selected) {
    var list = subjects();
    if (!list.length) list = [{ code: 'SAM3', name: 'Makroøkonomi' }];
    return list.map(function (subject) {
      return { value: subject.code, label: subject.code + ' · ' + subject.name };
    });
  }

  function openPackageForm(existing, presetSubject) {
    openModal(
      existing ? 'Rediger pakke' : 'Ny eksamenspakke',
      existing ? 'Endringer publiseres umiddelbart til alle med tilgang til faget.' : 'Pakken vises i arkivet med en gang. PDF-er legger du til etterpå med «Ny PDF».',
      [
        { name: 'subject_code', label: 'Fag', type: 'select', value: existing ? existing.subject : (presetSubject || 'SAM3'), options: subjectOptions(), half: true },
        { name: 'term', label: 'Semester (f.eks. V26)', type: 'text', value: existing ? existing.term : '', required: true, half: true, placeholder: 'V26' },
        { name: 'title', label: 'Tittel', type: 'text', value: existing ? existing.title : '', required: true, placeholder: 'Våren 2026' },
        { name: 'subtitle', label: 'Undertittel', type: 'text', value: existing ? existing.subtitle : '', placeholder: 'SAM3 Makroøkonomi' },
        { name: 'description', label: 'Beskrivelse', type: 'textarea', value: existing ? existing.description : '', placeholder: 'Komplett eksamenspakke med originaloppgave, A-besvarelse og sensorveiledning.' },
        { name: 'local_status', label: 'Statusmerke (valgfritt)', type: 'text', value: existing ? (existing.localStatus || '') : '', half: true, placeholder: 'F.eks. «Kommer snart»' },
        { name: 'sort_order', label: 'Sortering', type: 'number', value: existing ? String(existing.sortOrder || 0) : '0', half: true }
      ],
      function (values) { return savePackage(existing, values); }
    );
  }

  function openResourceForm(pack, existing) {
    openModal(
      existing ? 'Rediger PDF' : 'Ny PDF i ' + pack.subject + ' ' + pack.term,
      'Lim inn en delbar lenke (Google Drive, Supabase Storage eller relativ sti i repoet). Publiseres umiddelbart.',
      [
        { name: 'kind', label: 'Type', type: 'select', value: existing ? existing.kind : 'A-besvarelse', options: KINDS.map(function (kind) { return { value: kind, label: kind }; }), half: true },
        { name: 'order_index', label: 'Rekkefølge', type: 'number', value: existing ? String(existing.order || 0) : String(pack.resources.length + 1), half: true },
        { name: 'title', label: 'Tittel', type: 'text', value: existing ? existing.title : '', required: true, placeholder: 'A-besvarelse ' + pack.subject + ' ' + pack.term },
        { name: 'subtitle', label: 'Undertittel', type: 'text', value: existing ? existing.subtitle : '', placeholder: 'Makroøkonomi' },
        { name: 'description', label: 'Beskrivelse', type: 'textarea', value: existing ? existing.desc : '', placeholder: 'Eksempel på sterk besvarelse …' },
        { name: 'url', label: 'Lenke (åpne)', type: 'text', value: existing ? existing.url : '', required: true, placeholder: 'https://drive.google.com/file/d/…/view' },
        { name: 'download_url', label: 'Lenke (last ned, valgfri)', type: 'text', value: existing ? (existing.download || '') : '', placeholder: 'Tom = samme som åpne-lenken' },
        { name: 'icon', label: 'Ikonbokstav (valgfri)', type: 'text', value: existing ? existing.icon : '', half: true, placeholder: 'A' }
      ],
      function (values) { return saveResource(pack, existing, values); }
    );
  }

  function panelHtml(state) {
    var html = '<div class="hf-admin-panel hf-admin-ui"><div class="hf-admin-panel-head"><strong>Adminverktøy</strong><span>Publiser og rediger eksamenspakker direkte. Endringer er live med en gang.</span></div>';
    html += '<div class="hf-admin-actions"><button type="button" class="hf-admin-btn" data-admin-action="new-package">＋ Ny pakke</button>';

    var pack = state.packageId ? packageById(state.packageId) : null;
    if (pack) {
      html += '<button type="button" class="hf-admin-btn" data-admin-action="new-resource">＋ Ny PDF i denne pakken</button>';
      html += '<button type="button" class="hf-admin-btn ghost" data-admin-action="edit-package" data-id="' + esc(pack.id) + '">Rediger pakke</button>';
      html += '<button type="button" class="hf-admin-btn danger" data-admin-action="delete-package" data-id="' + esc(pack.id) + '">Slett pakke</button>';
    }
    html += '</div>';

    if (pack) {
      html += '<div class="hf-admin-list">' + (pack.resources.length ? pack.resources.map(function (resource) {
        return '<div class="hf-admin-row"><div><b>' + esc(resource.kind) + ' · ' + esc(resource.title) + '</b><small>' + esc(resource.url) + '</small></div>'
          + '<div class="hf-admin-actions"><button type="button" class="hf-admin-btn ghost" data-admin-action="edit-resource" data-id="' + esc(resource.id) + '">Rediger</button>'
          + '<button type="button" class="hf-admin-btn danger" data-admin-action="delete-resource" data-id="' + esc(resource.id) + '">Slett</button></div></div>';
      }).join('') : '<div class="hf-admin-row"><div><b>Ingen PDF-er ennå</b><small>Bruk «Ny PDF» for å publisere eksamen, A-besvarelse eller sensorveiledning.</small></div></div>') + '</div>';
    } else if (state.subject) {
      var packs = packages().filter(function (p) { return p.subject === state.subject; });
      if (packs.length) {
        html += '<div class="hf-admin-list">' + packs.map(function (p) {
          return '<div class="hf-admin-row"><div><b>' + esc(p.term) + ' · ' + esc(p.title) + '</b><small>' + p.resources.length + ' PDF-er</small></div>'
            + '<div class="hf-admin-actions"><button type="button" class="hf-admin-btn ghost" data-admin-action="edit-package" data-id="' + esc(p.id) + '">Rediger</button>'
            + '<button type="button" class="hf-admin-btn danger" data-admin-action="delete-package" data-id="' + esc(p.id) + '">Slett</button></div></div>';
        }).join('') + '</div>';
      }
    }

    return html + '</div>';
  }

  function bindPanel(panelHost, state) {
    panelHost.querySelectorAll('[data-admin-action]').forEach(function (button) {
      button.addEventListener('click', function () {
        var action = button.getAttribute('data-admin-action');
        var id = button.getAttribute('data-id');
        if (action === 'new-package') openPackageForm(null, state.subject);
        else if (action === 'edit-package') { var pack = packageById(id); if (pack) openPackageForm(pack); }
        else if (action === 'delete-package') { var doomed = packageById(id); if (doomed) deletePackage(doomed); }
        else if (action === 'new-resource') { var target = packageById(state.packageId); if (target) openResourceForm(target); }
        else if (action === 'edit-resource') { var hit = resourceById(id); if (hit) openResourceForm(hit.pack, hit.resource); }
        else if (action === 'delete-resource') { var gone = resourceById(id); if (gone) deleteResource(gone.resource); }
      });
    });
  }

  function enhance() {
    document.querySelectorAll('.hf-admin-ui').forEach(function (node) { node.remove(); });
    if (!isAdmin()) return;
    var shell = document.querySelector('.hf-answer-shell');
    if (!shell) return;
    injectStyles();
    var state = currentState();
    var host = document.createElement('div');
    host.innerHTML = panelHtml(state);
    var panel = host.firstChild;
    shell.insertBefore(panel, shell.firstChild);
    bindPanel(panel, state);
  }

  window.addEventListener('haugnes:answer-library-rendered', enhance);
  window.addEventListener('haugnes:entitlements-changed', function () { window.setTimeout(enhance, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance);
  else enhance();

  window.HaugnesAnswerAdmin = { enhance: enhance };
})(window, document);
