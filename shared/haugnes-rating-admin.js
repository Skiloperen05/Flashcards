(function (window, document) {
  'use strict';

  if (window.__haugnesRatingAdminInstalled) return;
  window.__haugnesRatingAdminInstalled = true;

  var TABLE = 'subject_haugnes_ratings';
  var SAVE_STATUS_MS = 1800;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function clampRating(value) {
    value = Number(value);
    if (!Number.isFinite(value)) return 0;
    value = Math.round(value);
    if (value < 1) return 1;
    if (value > 5) return 5;
    return value;
  }

  function criteria() {
    return Array.isArray(window.CRITERIA) ? window.CRITERIA : [];
  }

  function subjects() {
    return Array.isArray(window.SUBJECTS) ? window.SUBJECTS : [];
  }

  function ratingsStore() {
    if (!window.HAUGNES_RATINGS) window.HAUGNES_RATINGS = {};
    return window.HAUGNES_RATINGS;
  }

  function getRating(subjectId) {
    return ratingsStore()[subjectId] || {};
  }

  function fromDb(row) {
    return {
      workload: clampRating(row.workload),
      relevance: clampRating(row.relevance),
      examDifficulty: clampRating(row.exam_difficulty),
      curriculum: clampRating(row.curriculum),
      lectureValue: clampRating(row.lecture_value),
      verdict: row.verdict || ''
    };
  }

  function toDb(subjectId, rating) {
    var session = window.AuthGuard && window.AuthGuard.getSession ? window.AuthGuard.getSession() : null;
    return {
      subject_id: subjectId,
      workload: clampRating(rating.workload),
      relevance: clampRating(rating.relevance),
      exam_difficulty: clampRating(rating.examDifficulty),
      curriculum: clampRating(rating.curriculum),
      lecture_value: clampRating(rating.lectureValue),
      verdict: String(rating.verdict || '').trim(),
      updated_by: session && session.user ? session.user.id : null,
      updated_at: new Date().toISOString()
    };
  }

  function isAdmin() {
    return !!(
      window.HaugnesEntitlements &&
      typeof window.HaugnesEntitlements.effectiveAdmin === 'function' &&
      window.HaugnesEntitlements.effectiveAdmin()
    );
  }

  function getClient() {
    if (!window.AuthGuard || typeof window.AuthGuard.getClient !== 'function') return null;
    try { return window.AuthGuard.getClient(); }
    catch (_e) { return null; }
  }

  function subjectIds() {
    return subjects().map(function (subject) { return subject.id; }).filter(Boolean);
  }

  function injectStyles() {
    if (document.getElementById('hf-haugnes-rating-admin-css')) return;
    var style = document.createElement('style');
    style.id = 'hf-haugnes-rating-admin-css';
    style.textContent = [
      '.hf-haugnes-editor{margin-top:14px;border-color:rgba(246,180,60,.36);background:linear-gradient(180deg,rgba(246,180,60,.10),rgba(8,25,57,.72))}',
      '.hf-haugnes-editor summary{cursor:pointer}',
      '.hf-haugnes-admin-badge{display:inline-flex;margin-left:8px;padding:4px 8px;border-radius:999px;background:rgba(246,180,60,.14);border:1px solid rgba(246,180,60,.32);color:#f7cf79;font-size:10px;font-weight:900;letter-spacing:.10em;text-transform:uppercase}',
      '.hf-haugnes-save-row{display:flex;align-items:center;gap:12px;margin-top:12px;flex-wrap:wrap}',
      '.hf-haugnes-save{border:0;border-radius:12px;padding:11px 16px;background:linear-gradient(135deg,#f6b43c,#f09a25);color:#061735;font-family:inherit;font-weight:950;cursor:pointer;box-shadow:0 14px 28px rgba(240,154,37,.22)}',
      '.hf-haugnes-save:disabled{opacity:.62;cursor:wait}',
      '.hf-haugnes-save-state{font-size:12px;color:#cbd6eb}',
      '.hf-haugnes-editor textarea{width:100%;resize:vertical}',
      '.hf-haugnes-editor .rating-note{margin-top:12px}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function renderEditor(subjectId) {
    var rating = getRating(subjectId);
    var fields = criteria().map(function (criterion) {
      var value = clampRating(rating[criterion.key]) || 3;
      return '<label class="rating-row"><span class="rating-row-head"><b>' + escapeHtml(criterion.label) + '</b><strong data-haugnes-value="' + subjectId + '-' + criterion.key + '">' + value + '</strong></span>'
        + '<input type="range" min="1" max="5" step="1" value="' + value + '" data-haugnes-subject="' + subjectId + '" data-haugnes-rating="' + criterion.key + '">'
        + '<span class="rating-scale"><small>' + escapeHtml(criterion.low) + '</small><small>' + escapeHtml(criterion.high) + '</small></span></label>';
    }).join('');

    return '<details class="rating-box hf-haugnes-editor" data-haugnes-editor="' + subjectId + '">'
      + '<summary><span>Rediger Haugnes-vurdering <em class="hf-haugnes-admin-badge">Admin</em></span><b>Offisiell</b></summary>'
      + '<div class="rating-total"><span>Offisiell Haugnes-score</span><strong>' + (window.formatScore ? window.formatScore(window.scoreHaugnes(subjectId)) : '') + '</strong></div>'
      + '<div class="rating-fields">' + fields + '</div>'
      + '<label class="rating-note"><span>Haugnes-kommentar</span><textarea rows="3" data-haugnes-subject="' + subjectId + '" data-haugnes-verdict placeholder="Skriv Haugnesvurderingen som vises til studentene">' + escapeHtml(rating.verdict || '') + '</textarea></label>'
      + '<div class="hf-haugnes-save-row"><button class="hf-haugnes-save" type="button" data-save-haugnes="' + subjectId + '">Lagre Haugnes-vurdering</button><span class="hf-haugnes-save-state" data-haugnes-state="' + subjectId + '"></span></div>'
      + '</details>';
  }

  function getSubjectIdFromCard(card) {
    var marker = card.querySelector('[data-rating-summary]');
    return marker ? marker.getAttribute('data-rating-summary') : '';
  }

  function enhanceCards() {
    injectStyles();
    if (!isAdmin()) {
      document.querySelectorAll('.hf-haugnes-editor').forEach(function (node) { node.remove(); });
      return;
    }
    document.querySelectorAll('.subject-card').forEach(function (card) {
      var subjectId = getSubjectIdFromCard(card);
      if (!subjectId || card.querySelector('[data-haugnes-editor="' + subjectId + '"]')) return;
      var official = card.querySelector('.official-rating');
      if (!official) return;
      official.insertAdjacentHTML('afterend', renderEditor(subjectId));
    });
  }

  function rerender() {
    if (typeof window.renderSubjects === 'function') window.renderSubjects();
    enhanceCards();
  }

  function patchRenderSubjects() {
    if (window.__haugnesRatingRenderPatched || typeof window.renderSubjects !== 'function') return;
    window.__haugnesRatingRenderPatched = true;
    var original = window.renderSubjects;
    window.renderSubjects = function () {
      var result = original.apply(this, arguments);
      window.setTimeout(enhanceCards, 0);
      return result;
    };
  }

  function mergeRemoteRatings(rows) {
    if (!Array.isArray(rows)) return;
    rows.forEach(function (row) {
      if (!row || !row.subject_id) return;
      ratingsStore()[row.subject_id] = fromDb(row);
    });
  }

  function loadRemoteRatings() {
    var sb = getClient();
    var ids = subjectIds();
    if (!sb || !ids.length) return Promise.resolve();
    return sb.from(TABLE).select('*').in('subject_id', ids).then(function (result) {
      if (result && result.data) {
        mergeRemoteRatings(result.data);
        rerender();
      }
    }).catch(function () {});
  }

  function waitForAuthAndEntitlements(done) {
    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      if (window.AuthGuard && window.HaugnesEntitlements && typeof window.HaugnesEntitlements.load === 'function') {
        window.clearInterval(timer);
        window.HaugnesEntitlements.load().then(done, done);
        return;
      }
      if (tries > 80) {
        window.clearInterval(timer);
        done();
      }
    }, 100);
  }

  function readEditor(subjectId) {
    var editor = document.querySelector('[data-haugnes-editor="' + subjectId + '"]');
    var out = {};
    if (!editor) return out;
    criteria().forEach(function (criterion) {
      var input = editor.querySelector('[data-haugnes-rating="' + criterion.key + '"]');
      out[criterion.key] = clampRating(input ? input.value : 0);
    });
    var verdict = editor.querySelector('[data-haugnes-verdict]');
    out.verdict = verdict ? verdict.value.trim() : '';
    return out;
  }

  function setState(subjectId, text) {
    var target = document.querySelector('[data-haugnes-state="' + subjectId + '"]');
    if (target) target.textContent = text || '';
  }

  function setSaving(subjectId, saving) {
    var btn = document.querySelector('[data-save-haugnes="' + subjectId + '"]');
    if (btn) {
      btn.disabled = !!saving;
      btn.textContent = saving ? 'Lagrer…' : 'Lagre Haugnes-vurdering';
    }
  }

  function saveHaugnesRating(subjectId) {
    if (!isAdmin()) return;
    var sb = getClient();
    if (!sb) {
      setState(subjectId, 'Kunne ikke koble til Supabase.');
      return;
    }
    var rating = readEditor(subjectId);
    var row = toDb(subjectId, rating);
    setSaving(subjectId, true);
    setState(subjectId, 'Lagrer…');
    sb.from(TABLE).upsert(row, { onConflict: 'subject_id' }).then(function (result) {
      if (result && result.error) throw result.error;
      ratingsStore()[subjectId] = rating;
      setState(subjectId, 'Lagret.');
      rerender();
      window.setTimeout(function () { setState(subjectId, ''); }, SAVE_STATUS_MS);
    }).catch(function (error) {
      setState(subjectId, 'Kunne ikke lagre: ' + (error && error.message ? error.message : 'ukjent feil'));
    }).finally(function () {
      setSaving(subjectId, false);
    });
  }

  function bindEvents() {
    document.addEventListener('input', function (event) {
      var subjectId = event.target.getAttribute('data-haugnes-subject');
      var key = event.target.getAttribute('data-haugnes-rating');
      if (subjectId && key) {
        var valueTarget = document.querySelector('[data-haugnes-value="' + subjectId + '-' + key + '"]');
        if (valueTarget) valueTarget.textContent = event.target.value;
      }
    });

    document.addEventListener('click', function (event) {
      var subjectId = event.target.getAttribute('data-save-haugnes');
      if (subjectId) saveHaugnesRating(subjectId);
    });

    window.addEventListener('haugnes:entitlements-changed', function () {
      window.setTimeout(enhanceCards, 0);
    });
  }

  function boot() {
    patchRenderSubjects();
    bindEvents();
    waitForAuthAndEntitlements(function () {
      patchRenderSubjects();
      enhanceCards();
      loadRemoteRatings();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
