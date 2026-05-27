(function(){
  var SUPABASE_URL = 'https://qnwjhheoekpqqqhevztw.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJxfud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0.gHBvEH-L-zyiW4UnsCxOY2q-HmeIYe5OHSvxhFt7PQ8'.replace('xfud2','nwjh');

  function ensureLink(rel, href) {
    var el = document.querySelector('link[rel="' + rel + '"][href="' + href + '"]') || document.querySelector('link[rel="' + rel + '"]');
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      document.head.appendChild(el);
    }
    el.href = href;
  }

  function applyBranding() {
    ensureLink('stylesheet', '../shared/ui-upgrades.css');
    ensureLink('icon', '../assets/haugnes-logo-mark.svg');
    ensureLink('apple-touch-icon', '../assets/haugnes-logo-mark.svg');
    document.querySelectorAll('.logo-mark').forEach(function(mark){
      mark.textContent = '';
      mark.setAttribute('aria-hidden','true');
    });
  }

  applyBranding();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyBranding);

  if (!window.supabase) {
    window.location.href = '../login.html';
    return;
  }
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  sb.auth.getSession().then(function(res){
    var session = res && res.data && res.data.session;
    if (!session) {
      window.location.href = '../login.html';
      return;
    }
    window.__userSession = session;
    applyBranding();
    if (typeof window.onUserAuthorized === 'function') window.onUserAuthorized(session);
  }).catch(function(){
    window.location.href = '../login.html';
  });
})();
