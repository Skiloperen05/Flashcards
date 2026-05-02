(function (window, document) {
  var SUPABASE_URL = 'https://qnwjhheoekpqqqhevztw.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0.gHBvEH-L-zyiW4UnsCxOY2q-HmeIYe5OHSvxhFt7PQ8';

  var sb = null;
  var session = null;

  function getDepth() {
    var path = window.location.pathname.replace(/\/$/, '');
    var segments = path.split('/').filter(Boolean);
    var last = segments[segments.length - 1] || '';
    if (/\.html?$/i.test(last)) segments.pop();
    return Math.max(segments.length - 1, 0);
  }

  function getLoginPath() {
    return '../'.repeat(getDepth()) + 'login.html';
  }

  function getLoginUrlWithNext() {
    return getLoginPath() + '?next=' + encodeURIComponent(window.location.href);
  }

  function getClient() {
    if (!sb) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return sb;
  }

  function reveal() {
    document.documentElement.style.visibility = '';
  }

  function requireAuth() {
    document.documentElement.style.visibility = 'hidden';
    return getClient().auth.getSession().then(function (result) {
      session = result.data && result.data.session;
      if (!session) {
        window.location.replace(getLoginUrlWithNext());
        return null;
      }
      reveal();
      return session;
    }).catch(function () {
      window.location.replace(getLoginUrlWithNext());
      return null;
    });
  }

  function bindUserInfo(labelId, chipId) {
    if (!session || !session.user) return;
    var label = labelId ? document.getElementById(labelId) : null;
    var chip = chipId ? document.getElementById(chipId) : null;
    if (label) label.textContent = (session.user.email || '').split('@')[0];
    if (chip) chip.style.display = 'flex';
  }

  function logout(confirmMessage) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    return getClient().auth.signOut().finally(function () {
      window.location.replace(getLoginPath());
    });
  }

  window.AuthGuard = {
    requireAuth: requireAuth,
    bindUserInfo: bindUserInfo,
    logout: logout,
    getClient: getClient,
    getSession: function () { return session; },
    getLoginPath: getLoginPath
  };
})(window, document);
