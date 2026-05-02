(function(){
  var SUPABASE_URL = 'https://qnwjhheoekpqqqhevztw.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0.gHBvEH-L-zyiW4UnsCxOY2q-HmeIYe5OHSvxhFt7PQ8';
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
    if (typeof window.onUserAuthorized === 'function') window.onUserAuthorized(session);
  }).catch(function(){
    window.location.href = '../login.html';
  });
})();
