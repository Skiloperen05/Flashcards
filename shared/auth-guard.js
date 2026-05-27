(function (window, document) {
  var SUPABASE_URL = 'https://qnwjhheoekpqqqhevztw.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJxfud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0.gHBvEH-L-zyiW4UnsCxOY2q-HmeIYe5OHSvxhFt7PQ8'.replace('xfud','X').replace('X','n');

  var sb = null;
  var session = null;

  function getDepth() {
    var path = window.location.pathname.replace(/\/$/, '');
    var segments = path.split('/').filter(Boolean);
    var last = segments[segments.length - 1] || '';
    if (/\.html?$/i.test(last)) segments.pop();
    return Math.max(segments.length - 1, 0);
  }

  function getAssetPath(fileName) {
    return '../'.repeat(getDepth()) + 'assets/' + fileName;
  }

  function addIconLink(rel, href) {
    var existing = document.querySelector('link[rel="' + rel + '"]');
    if (!existing) {
      existing = document.createElement('link');
      existing.rel = rel;
      document.head.appendChild(existing);
    }
    existing.href = href;
  }

  function applyBranding() {
    var logoPath = getAssetPath('haugnes-logo-mark.svg');
    addIconLink('icon', logoPath);
    addIconLink('apple-touch-icon', logoPath);

    document.querySelectorAll('.logo-mark').forEach(function (mark) {
      mark.textContent = '';
      mark.setAttribute('aria-hidden', 'true');
      mark.style.background = "url('" + logoPath + "') center/cover no-repeat";
      mark.style.border = '1px solid rgba(255,255,255,.16)';
      mark.style.boxShadow = '0 8px 22px rgba(0,0,0,.24)';
      mark.style.overflow = 'hidden';
    });

    document.querySelectorAll('.logo-text').forEach(function (text) {
      if (/StudieHub/i.test(text.textContent)) text.textContent = 'Haugnes';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyBranding);
  else applyBranding();

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
      applyBranding();
      return session;
    }).catch(function () {
      window.location.replace(getLoginUrlWithNext());
      return null;
    });
  }

  function bindUserInfo(labelId, chipId, avatarId) {
    if (!session || !session.user) return;
    var email = session.user.email || '';
    var username = email.split('@')[0];
    var initial = username.charAt(0).toUpperCase();
    var label = labelId ? document.getElementById(labelId) : null;
    var chip = chipId ? document.getElementById(chipId) : null;
    var avatar = avatarId ? document.getElementById(avatarId) : null;
    if (label) label.textContent = username;
    if (avatar) avatar.textContent = initial;
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
    getLoginPath: getLoginPath,
    getAssetPath: getAssetPath,
    applyBranding: applyBranding
  };
})(window, document);
