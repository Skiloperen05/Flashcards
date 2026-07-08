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
      '.hf-admin-field input[type=file]{padding:9px 10px;font-size:12px;cursor:pointer}',
      '.hf-admin-field input[type=file]::file-selector-button{margin-right:10px;border:0;border-radius:9px;padding:7px 11px;cursor:pointer;font:900 11px Lora,Georgia,serif;background:linear-gradient(135deg,#f6b43c,#f09a25);color:#061735}',
      '.hf-admin-hint{color:#9fb0cf;font-size:11px;font-weight:600;line-height:1.4}',
      '.hf-admin-or{display:flex;align-items:center;gap:10px;color:#7f91b2;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}',
      '.hf-admin-or::before,.hf-admin-or::after{content:"";flex:1;height:1px;background:rgba(255,255,255,.12)}',
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
      if (field.type === 'divider') {
        return '<div class="hf-admin-or">' + esc(field.label || 'eller') + '</div>';
      }
      if (field.type === 'textarea') {
        input = '<textarea name="' + esc(field.name) + '" placeholder="' + esc(field.placeholder || '') + '">' + esc(field.value) + '</textarea>';
      } else if (field.type === 'select') {
        input = '<select name="' + esc(field.name) + '">' + (field.options || []).map(function (option) {
          return '<option value="' + esc(option.value) + '"' + (String(option.value) === String(field.value) ? ' selected' : '') + '>' + esc(option.label) + '</option>';
        }).join('') + '</select>';
      } else if (field.type === 'file') {
        input = '<input type="file" name="' + esc(field.name) + '" accept="' + esc(field.accept || '') + '"' + (field.multiple ? ' multiple' : '') + '>';
      } else {
        input = '<input type="' + (field.type === 'number' ? 'number' : 'text') + '" name="' + esc(field.name) + '" value="' + esc(field.value) + '" placeholder="' + esc(field.placeholder || '') + '">';
      }
      var hint = field.hint ? '<small class="hf-admin-hint">' + esc(field.hint) + '</small>' : '';
      return '<label class="hf-admin-field' + (field.half ? ' half' : '') + '"><span>' + esc(field.label) + (field.required ? ' *' : '') + '</span>' + input + hint + '</label>';
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
        if (field.type === 'file') {
          var picked = input && input.files ? input.files : null;
          values[field.name] = picked;
          if (field.required && (!picked || !picked.length)) missing.push(field.label);
          return;
        }
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

  function storageBucket() {
    var lib = library();
    return (lib && lib.storageBucket) || 'answer-pdfs';
  }

  function baseName(filename) {
    return String(filename || '').replace(/\.[a-z0-9]+$/i, '');
  }

  // Guess resource kind from a PDF filename so batch uploads land in the right bucket.
  function detectKind(filename) {
    var name = String(filename || '').toLowerCase();
    if (/sensor|veiledn/.test(name)) return 'Sensorveiledning';
    if (/a[-_ ]?besvar|besvarelse|løsning|losning|answer|fasit/.test(name)) return 'A-besvarelse';
    if (/eksamen|exam|oppgave?sett|skoleeksamen/.test(name)) return 'Eksamen';
    if (/notat|sammendrag|kompendium/.test(name)) return 'Notat';
    if (/oppgav/.test(name)) return 'Oppgavesett';
    return 'A-besvarelse';
  }

  function prettyTitle(filename) {
    var name = baseName(filename).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!name) return 'Dokument';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Upload one PDF to the private answer bucket under {packageId}/{resourceId}-{slug}.pdf
  function uploadPdf(packageId, resourceId, file) {
    var sb = getClient();
    if (!sb || !sb.storage) return Promise.reject(new Error('Supabase Storage er ikke tilgjengelig'));
    if (file && file.type && file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name || '')) {
      return Promise.reject(new Error('Kun PDF-filer kan lastes opp'));
    }
    var bucket = storageBucket();
    var safe = slug(baseName(file.name)) || 'dokument';
    var path = packageId + '/' + resourceId + '-' + safe + '.pdf';
    return sb.storage.from(bucket).upload(path, file, { upsert: true, contentType: 'application/pdf' }).then(function (result) {
      if (result && result.error) throw result.error;
      return { bucket: bucket, path: path };
    });
  }

  function removeStorageObject(bucket, path) {
    var sb = getClient();
    if (!sb || !sb.storage || !path) return Promise.resolve();
    return sb.storage.from(bucket || storageBucket()).remove([path]).then(function () {}, function () {});
  }

  // Jump the reader/admin view straight into a package after it is created.
  function navigateToPackage(subjectCode, packageId) {
    var subj = String(subjectCode || '').toLowerCase();
    var tail = packageId.indexOf(subj + '-') === 0 ? packageId.slice(subj.length + 1) : packageId;
    var hash = '#/' + subj + '/' + tail;
    if (window.location.hash === hash) {
      var lib = library();
      if (lib && typeof lib.render === 'function') lib.render();
    } else {
      window.location.hash = hash;
    }
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
    }).then(function () {
      // Open the new package straight away so PDFs can be added without hunting for it.
      if (!existing) navigateToPackage(row.subject_code, row.id);
    });
  }

  function deletePackage(pack) {
    if (!window.confirm('Slette pakken «' + pack.title + '» (' + pack.subject + ' ' + pack.term + ') og alle PDF-ene i den?')) return;
    var sb = getClient();
    if (!sb) return;
    // Remove any uploaded files first; the DB rows cascade on package delete.
    var stored = (pack.resources || []).filter(function (r) { return r.storagePath; });
    var cleanup = stored.length && sb.storage
      ? sb.storage.from(storageBucket()).remove(stored.map(function (r) { return r.storagePath; })).then(function () {}, function () {})
      : Promise.resolve();
    cleanup.then(function () {
      return sb.from('answer_packages').delete().eq('id', pack.id);
    }).then(function (result) {
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
    var id = existing ? existing.id : uniqueResourceId(pack.id, values.kind);
    var file = values.file && values.file.length ? values.file[0] : null;
    var hadStorage = existing && existing.storagePath;

    if (!file && !values.url && !hadStorage) {
      return Promise.reject(new Error('Last opp en PDF, eller lim inn en lenke'));
    }

    var prep = file ? uploadPdf(pack.id, id, file) : Promise.resolve(null);
    return prep.then(function (uploaded) {
      // keepStorage: editing a stored resource without replacing the file or switching to a link.
      var keepStorage = !uploaded && hadStorage && !values.url;
      var row = {
        id: id,
        package_id: pack.id,
        kind: values.kind,
        title: values.title,
        subtitle: values.subtitle || '',
        description: values.description || '',
        icon: values.icon || KIND_ICONS[values.kind] || 'D',
        url: uploaded || keepStorage ? '' : values.url,
        download_url: uploaded || keepStorage ? '' : (values.download_url || values.url),
        storage_bucket: uploaded ? uploaded.bucket : (keepStorage ? (existing.storageBucket || storageBucket()) : null),
        storage_path: uploaded ? uploaded.path : (keepStorage ? existing.storagePath : null),
        order_index: parseInt(values.order_index, 10) || 0
      };
      return sb.from('answer_resources').upsert(row).then(function (result) {
        if (result && result.error) throw result.error;
        // Replaced an uploaded file at a different path? Drop the orphaned object.
        if (uploaded && hadStorage && existing.storagePath !== uploaded.path) {
          return removeStorageObject(existing.storageBucket, existing.storagePath);
        }
      }).then(function () { return reloadLibrary(); });
    });
  }

  // Upload several PDFs into a package at once; each becomes its own resource.
  function saveBatch(pack, values) {
    var sb = getClient();
    if (!sb) return Promise.reject(new Error('Supabase er ikke tilgjengelig'));
    var files = values.file ? Array.prototype.slice.call(values.file) : [];
    if (!files.length) return Promise.reject(new Error('Velg minst én PDF'));
    var used = {};
    function nextId(kind) {
      var base = pack.id + '-' + (slug(kind) || 'ressurs');
      var id = base;
      var n = 2;
      while (resourceById(id) || used[id]) { id = base + '-' + n; n += 1; }
      used[id] = true;
      return id;
    }
    var baseOrder = pack.resources.length;
    var stateEl = document.getElementById('hfAdminModalState');
    var chain = Promise.resolve();
    files.forEach(function (file, index) {
      chain = chain.then(function () {
        if (stateEl) stateEl.textContent = 'Laster opp ' + (index + 1) + '/' + files.length + '…';
        var kind = values.kind && values.kind !== 'auto' ? values.kind : detectKind(file.name);
        var id = nextId(kind);
        return uploadPdf(pack.id, id, file).then(function (uploaded) {
          var row = {
            id: id,
            package_id: pack.id,
            kind: kind,
            title: prettyTitle(file.name),
            subtitle: '',
            description: '',
            icon: KIND_ICONS[kind] || 'D',
            url: '',
            download_url: '',
            storage_bucket: uploaded.bucket,
            storage_path: uploaded.path,
            order_index: baseOrder + index + 1
          };
          return sb.from('answer_resources').upsert(row).then(function (result) {
            if (result && result.error) throw result.error;
          });
        });
      });
    });
    return chain.then(function () { return reloadLibrary(); }).then(function () {
      // Land inside the package so the freshly uploaded PDFs are visible right away.
      navigateToPackage(pack.subject, pack.id);
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
      return removeStorageObject(resource.storageBucket, resource.storagePath).then(function () { reloadLibrary(); });
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
    var hasStored = existing && existing.storagePath;
    var fileHint = hasStored
      ? 'Ligger allerede som opplastet PDF. Velg en ny fil for å erstatte den, eller la stå.'
      : 'Last opp PDF-en direkte (maks 50 MB). Filen lagres privat og vises kun for de med tilgang til faget.';
    openModal(
      existing ? 'Rediger PDF' : 'Ny PDF i ' + pack.subject + ' ' + pack.term,
      'Last opp en PDF, eller lim inn en delbar lenke. Publiseres umiddelbart.',
      [
        { name: 'kind', label: 'Type', type: 'select', value: existing ? existing.kind : 'A-besvarelse', options: KINDS.map(function (kind) { return { value: kind, label: kind }; }), half: true },
        { name: 'order_index', label: 'Rekkefølge', type: 'number', value: existing ? String(existing.order || 0) : String(pack.resources.length + 1), half: true },
        { name: 'title', label: 'Tittel', type: 'text', value: existing ? existing.title : '', required: true, placeholder: 'A-besvarelse ' + pack.subject + ' ' + pack.term },
        { name: 'subtitle', label: 'Undertittel', type: 'text', value: existing ? existing.subtitle : '', placeholder: 'Makroøkonomi' },
        { name: 'description', label: 'Beskrivelse', type: 'textarea', value: existing ? existing.desc : '', placeholder: 'Eksempel på sterk besvarelse …' },
        { name: 'file', label: 'Last opp PDF', type: 'file', accept: 'application/pdf,.pdf', hint: fileHint },
        { name: '__or', label: '', type: 'divider' },
        { name: 'url', label: 'Eller lim inn lenke (åpne)', type: 'text', value: existing && !hasStored ? existing.url : '', placeholder: 'https://drive.google.com/file/d/…/view' },
        { name: 'download_url', label: 'Lenke (last ned, valgfri)', type: 'text', value: existing && !hasStored ? (existing.download || '') : '', placeholder: 'Tom = samme som åpne-lenken' },
        { name: 'icon', label: 'Ikonbokstav (valgfri)', type: 'text', value: existing ? existing.icon : '', half: true, placeholder: 'A' }
      ],
      function (values) { return saveResource(pack, existing, values); }
    );
  }

  function openBatchUploadForm(pack) {
    openModal(
      'Last opp flere PDF-er · ' + pack.subject + ' ' + pack.term,
      'Velg flere PDF-er samtidig (f.eks. en hel mappe). Hver fil blir en egen ressurs. Type gjettes fra filnavnet med mindre du velger en fast type under.',
      [
        { name: 'file', label: 'PDF-er', type: 'file', accept: 'application/pdf,.pdf', multiple: true, required: true, hint: 'Hold Ctrl/Cmd for å velge flere. Maks 50 MB per fil.' },
        { name: 'kind', label: 'Type for alle', type: 'select', value: 'auto', options: [{ value: 'auto', label: 'Gjett fra filnavn' }].concat(KINDS.map(function (kind) { return { value: kind, label: kind }; })) }
      ],
      function (values) { return saveBatch(pack, values); }
    );
  }

  function panelHtml(state) {
    var html = '<div class="hf-admin-panel hf-admin-ui"><div class="hf-admin-panel-head"><strong>Adminverktøy</strong><span>Kun synlig for deg som admin. Publiser og rediger eksamenspakker direkte – endringer er live med en gang.</span></div>';
    html += '<div class="hf-admin-actions"><button type="button" class="hf-admin-btn" data-admin-action="new-package">＋ Ny pakke</button>';

    var pack = state.packageId ? packageById(state.packageId) : null;
    if (pack) {
      html += '<button type="button" class="hf-admin-btn" data-admin-action="upload-resources">⤴ Last opp PDF-er</button>';
      html += '<button type="button" class="hf-admin-btn ghost" data-admin-action="new-resource">＋ Ny PDF (fil eller lenke)</button>';
      html += '<button type="button" class="hf-admin-btn ghost" data-admin-action="edit-package" data-id="' + esc(pack.id) + '">Rediger pakke</button>';
      html += '<button type="button" class="hf-admin-btn danger" data-admin-action="delete-package" data-id="' + esc(pack.id) + '">Slett pakke</button>';
    }
    html += '</div>';

    if (pack) {
      html += '<div class="hf-admin-list">' + (pack.resources.length ? pack.resources.map(function (resource) {
        var loc = resource.storagePath
          ? '⤴ Opplastet · ' + esc(String(resource.storagePath).split('/').pop())
          : esc(resource.url || 'Ingen lenke ennå');
        return '<div class="hf-admin-row"><div><b>' + esc(resource.kind) + ' · ' + esc(resource.title) + '</b><small>' + loc + '</small></div>'
          + '<div class="hf-admin-actions"><button type="button" class="hf-admin-btn ghost" data-admin-action="edit-resource" data-id="' + esc(resource.id) + '">Rediger</button>'
          + '<button type="button" class="hf-admin-btn danger" data-admin-action="delete-resource" data-id="' + esc(resource.id) + '">Slett</button></div></div>';
      }).join('') : '<div class="hf-admin-row"><div><b>Ingen PDF-er ennå</b><small>Bruk «Ny PDF» for å publisere eksamen, A-besvarelse eller sensorveiledning.</small></div></div>') + '</div>';
    } else if (state.subject) {
      var packs = packages().filter(function (p) { return p.subject === state.subject; });
      if (packs.length) {
        html += '<div class="hf-admin-list">' + packs.map(function (p) {
          return '<div class="hf-admin-row"><div><b>' + esc(p.term) + ' · ' + esc(p.title) + '</b><small>' + p.resources.length + ' PDF-er</small></div>'
            + '<div class="hf-admin-actions"><button type="button" class="hf-admin-btn" data-admin-action="upload-to" data-id="' + esc(p.id) + '">⤴ Last opp PDF-er</button>'
            + '<button type="button" class="hf-admin-btn ghost" data-admin-action="open-package" data-id="' + esc(p.id) + '">Åpne</button>'
            + '<button type="button" class="hf-admin-btn ghost" data-admin-action="edit-package" data-id="' + esc(p.id) + '">Rediger</button>'
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
        else if (action === 'upload-resources') { var batchTarget = packageById(state.packageId); if (batchTarget) openBatchUploadForm(batchTarget); }
        else if (action === 'upload-to') { var upTarget = packageById(id); if (upTarget) openBatchUploadForm(upTarget); }
        else if (action === 'open-package') { var openTarget = packageById(id); if (openTarget) navigateToPackage(openTarget.subject, openTarget.id); }
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
