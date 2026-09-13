(function () {
  'use strict';
  var params = new URLSearchParams(window.location.search);
  var fileId = params.get('file');
  var proxy = 'https://qnwjhheoekpqqqhevztw.supabase.co/functions/v1/drive-proxy';
  var status = document.getElementById('status');
  var download = document.getElementById('download');
  var preview = document.getElementById('preview');
  var objectUrl;
  var started = false;

  function message(text, error) { status.textContent = text; status.className = error ? 'error' : ''; }
  function request(action) {
    return window.AuthGuard.getClient().auth.getSession().then(function (result) {
      var session = result.data && result.data.session;
      if (!session) throw new Error('Logg inn for å åpne dokumentet.');
      return fetch(proxy + '?action=' + action + '&id=' + encodeURIComponent(fileId), {
        headers: { Authorization: 'Bearer ' + session.access_token }, cache: 'no-store'
      });
    }).then(function (response) {
      if (response.ok) return response;
      return response.json().catch(function () { return {}; }).then(function (body) {
        throw new Error(body.error || 'Dokumentet finnes ikke, eller du mangler tilgang til faget.');
      });
    });
  }
  function startDownload() {
    download.disabled = true;
    message('Klargjør nedlasting ...');
    return request('ticket').then(function (response) { return response.json(); }).then(function (body) {
      if (!body.url) throw new Error('Kunne ikke klargjøre nedlastingen.');
      var target = new URL(body.url);
      target.searchParams.set('download', '1');
      // A real navigation preserves Content-Disposition in Safari.
      window.location.assign(target.href);
      message('Nedlastingen er startet.');
    }).catch(function (error) { message(error.message, true); }).finally(function () { download.disabled = false; });
  }
  download.addEventListener('click', startDownload);

  function loadWordReader() {
    return new Promise(function (resolve, reject) {
      if (window.mammoth) return resolve(window.mammoth);
      var script = document.createElement('script');
      script.src = '../shared/vendor/mammoth-1.11.0.browser.min.js';
      script.onload = function () { resolve(window.mammoth); };
      script.onerror = function () { reject(new Error('Forhåndsvisningen kunne ikke lastes. Du kan fortsatt laste ned originalfilen.')); };
      document.head.appendChild(script);
    });
  }

  async function load() {
    if (started) return;
    started = true;
    if (!/^[0-9a-f-]{36}$/i.test(fileId || '')) { message('Ugyldig dokumentlenke.', true); return; }
    try {
      var result = await window.AuthGuard.getClient().from('subject_files').select('title,subject_code').eq('id', fileId).maybeSingle();
      if (result.error || !result.data) throw new Error('Dokumentet finnes ikke, eller du mangler tilgang til faget.');
      document.getElementById('title').textContent = result.data.title || 'Dokument';
      document.title = (result.data.title || 'Dokument') + ' | Haugnes Flashcards';
      document.getElementById('back').href = '../subject/?id=' + encodeURIComponent(result.data.subject_code.toLowerCase());
      document.getElementById('back').textContent = 'Til ' + result.data.subject_code;
      download.disabled = false;
      if (params.get('download') === '1') { await startDownload(); return; }
      message('Henter dokument ...');
      var response = await request('stream');
      var mime = (response.headers.get('Content-Type') || '').split(';')[0];
      var blob = await response.blob();
      if (!blob.size) throw new Error('Filen er tom.');
      if (mime === 'application/pdf') {
        objectUrl = URL.createObjectURL(blob);
        var frame = document.createElement('iframe');
        frame.title = result.data.title || 'Dokument';
        frame.src = objectUrl;
        preview.appendChild(frame);
        message('');
      } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        var reader = await loadWordReader();
        var text = await reader.extractRawText({ arrayBuffer: await blob.arrayBuffer() });
        var article = document.createElement('article');
        article.textContent = text.value;
        preview.appendChild(article);
        message('Tekstvisning. Original formatering og figurer følger med i nedlastingen.');
      } else if (/^image\/(png|jpeg|webp)$/.test(mime)) {
        objectUrl = URL.createObjectURL(blob);
        var img = document.createElement('img');
        img.alt = result.data.title || 'Dokument'; img.src = objectUrl; preview.appendChild(img); message('');
      } else if (/^text\/(plain|markdown)$/.test(mime)) {
        var content = document.createElement('article'); content.textContent = await blob.text(); preview.appendChild(content); message('');
      } else message('Forhåndsvisning er ikke tilgjengelig for denne filtypen. Last ned originalfilen for å åpne den.');
    } catch (error) { message(error.message || 'Kunne ikke åpne dokumentet.', true); }
  }
  window.addEventListener('pagehide', function () { if (objectUrl) URL.revokeObjectURL(objectUrl); preview.replaceChildren(); });
  window.addEventListener('pageshow', function (event) { if (event.persisted) { started = false; load(); } });
  window.AuthGuard.requireAuth().then(function (session) { if (session) load(); });
})();
