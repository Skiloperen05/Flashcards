(function (window) {
  'use strict';

  if (window.HaugnesEntitlements) return;

  var ALL_DEV_CODES = ['RET14', 'SOL1', 'SAM2', 'SAM3', 'MET2', 'MAT10', 'SAM1A', 'MET1', 'KOM1', 'RET1A', 'BED1'];
  var PREVIEW_KEY = 'hf_admin_preview_as_student';

  var state = { loaded: false, codes: [], isAdmin: false, isFriend: false };
  var loading = null;

  function code(value) {
    return String(value || '').toUpperCase().replace(/[\s-]+/g, '');
  }

  function getClient() {
    if (!window.AuthGuard || typeof window.AuthGuard.getClient !== 'function') {
      throw new Error('AuthGuard is not loaded');
    }
    return window.AuthGuard.getClient();
  }

  function getSession() {
    if (window.AuthGuard && typeof window.AuthGuard.getSession === 'function') return window.AuthGuard.getSession();
    return null;
  }

  function broadcast() {
    try {
      window.dispatchEvent(new CustomEvent('haugnes:entitlements-changed', {
        detail: { codes: state.codes.slice(), isAdmin: state.isAdmin }
      }));
    } catch (e) {}
  }

  function applySnapshot(codes, isAdmin, isFriend) {
    var unique = (codes || []).map(code).filter(function (item, index, arr) {
      return item && arr.indexOf(item) === index;
    });
    var changed = state.codes.join(',') !== unique.join(',')
      || state.isAdmin !== !!isAdmin
      || state.isFriend !== !!isFriend;
    state.codes = unique;
    state.isAdmin = !!isAdmin;
    state.isFriend = !!isFriend;
    state.loaded = true;
    if (changed) broadcast();
  }

  function load(options) {
    var force = !!(options && options.force);
    if (state.loaded && !force) return Promise.resolve({ codes: state.codes.slice(), isAdmin: state.isAdmin });
    if (loading && !force) return loading;

    loading = (function () {
      var session = getSession();
      if (!session || !session.user) {
        // Don't cache: try again next time once auth has resolved.
        return Promise.resolve({ codes: [], isAdmin: false });
      }

      // Local dev bypass — grant everything when running with ?dev=1
      if (session.user.email === 'dev@student.local') {
        applySnapshot(ALL_DEV_CODES, true, false);
        return Promise.resolve({ codes: ALL_DEV_CODES.slice(), isAdmin: true, isFriend: false });
      }

      var sb;
      try { sb = getClient(); }
      catch (e) {
        applySnapshot([], false, false);
        return Promise.resolve({ codes: [], isAdmin: false, isFriend: false });
      }

      var entitlementsPromise = sb.from('subject_entitlements').select('subject_code');
      var profilePromise = sb.from('profiles').select('is_admin,is_friend').eq('id', session.user.id).maybeSingle();

      return Promise.all([entitlementsPromise, profilePromise]).then(function (results) {
        var entRes = results[0];
        var profRes = results[1];
        var codes = (entRes && entRes.data ? entRes.data : []).map(function (row) { return row.subject_code; });
        var isAdmin = !!(profRes && profRes.data && profRes.data.is_admin);
        var isFriend = !!(profRes && profRes.data && profRes.data.is_friend);
        applySnapshot(codes, isAdmin, isFriend);
        return { codes: codes.map(code), isAdmin: isAdmin, isFriend: isFriend };
      }).catch(function () {
        applySnapshot([], false, false);
        return { codes: [], isAdmin: false, isFriend: false };
      });
    })();

    loading.then(function () { loading = null; }, function () { loading = null; });
    return loading;
  }

  function isPreviewAsStudent() {
    if (!state.isAdmin) return false;
    try { return window.localStorage.getItem(PREVIEW_KEY) === '1'; }
    catch (e) { return false; }
  }

  function setPreviewAsStudent(on) {
    var was = isPreviewAsStudent();
    try {
      if (on) window.localStorage.setItem(PREVIEW_KEY, '1');
      else window.localStorage.removeItem(PREVIEW_KEY);
    } catch (e) {}
    if (was !== !!on) broadcast();
  }

  function effectiveAdmin() {
    return state.isAdmin && !isPreviewAsStudent();
  }

  function hasBypass() {
    if (effectiveAdmin()) return true;
    if (state.isFriend) return true;
    return false;
  }

  function isEntitled(subject) {
    if (hasBypass()) return true;
    return state.codes.indexOf(code(subject)) !== -1;
  }

  function isLoaded() { return state.loaded; }
  function getCodes() { return state.codes.slice(); }
  function isAdmin() { return state.isAdmin; }
  function isFriend() { return state.isFriend; }

  function claim(subjectCode) {
    var session = getSession();
    if (!session || !session.user) return Promise.reject(new Error('Not signed in'));
    var c = code(subjectCode);
    if (!c) return Promise.reject(new Error('Missing subject code'));

    var sb;
    try { sb = getClient(); }
    catch (e) { return Promise.reject(e); }

    return sb.from('subject_entitlements').insert({
      user_id: session.user.id,
      subject_code: c,
      source: 'free'
    }).then(function (result) {
      if (result.error) {
        var msg = String(result.error.message || '');
        // Already-owned (duplicate key) is treated as success
        if (!/duplicate|unique/i.test(msg)) throw result.error;
      }
      return load({ force: true });
    });
  }

  function release(subjectCode) {
    var session = getSession();
    if (!session || !session.user) return Promise.reject(new Error('Not signed in'));
    var c = code(subjectCode);
    var sb;
    try { sb = getClient(); }
    catch (e) { return Promise.reject(e); }
    return sb.from('subject_entitlements').delete()
      .eq('user_id', session.user.id)
      .eq('subject_code', c)
      .then(function (result) {
        if (result.error) throw result.error;
        return load({ force: true });
      });
  }

  window.HaugnesEntitlements = {
    load: load,
    isEntitled: isEntitled,
    isLoaded: isLoaded,
    getCodes: getCodes,
    isAdmin: isAdmin,
    isFriend: isFriend,
    hasBypass: hasBypass,
    effectiveAdmin: effectiveAdmin,
    isPreviewAsStudent: isPreviewAsStudent,
    setPreviewAsStudent: setPreviewAsStudent,
    claim: claim,
    release: release
  };
})(window);
