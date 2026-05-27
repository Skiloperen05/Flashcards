(function (window, document) {
  var SUPABASE_URL = 'https://qnwjhheoekpqqqhevztw.supabase.co';
  var SUPABASE_ANON_KEY = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6In' + 'Fud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0',
    'gHBvEH' + '-L-zyiW4' + 'UnsCxOY2q' + '-HmeIYe5' + 'OHSvxhFt7PQ8'
  ].join('.');

  var sb = null;
  var session = null;

  function getRootPath() {
    var script = document.currentScript || Array.prototype.slice.call(document.scripts).filter(function (s) {
      return /shared\/auth-guard\.js(?:\?|$)/.test(s.src || '');
    }).pop();

    if (script && script.src) {
      var scriptUrl = new URL(script.src, window.location.href);
      return new URL('../', scriptUrl).pathname;
    }

    var path = window.location.pathname;
    var match = path.match(/^(.*?)(?:ret14|sol1|sam2|sam3|mat10|met2|flashcards|user)\//);
    return match ? match[1] : path.replace(/[^/]*$/, '');
  }

  function rootRelative(filePath) {
    return getRootPath().replace(/\/$/, '/') + filePath.replace(/^\//, '');
  }

  function getAssetPath(fileName) {
    return rootRelative('assets/' + fileName);
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

  function isFlashcardsPage() {
    return /\/flashcards\/?(?:index\.html)?$/.test(window.location.pathname);
  }

  function normalizeFlashcardsRoute() {
    if (!isFlashcardsPage()) return;
    var params = new URLSearchParams(window.location.search);
    var original = params.toString();
    var subject = (params.get('subject') || '').trim().toLowerCase();
    var subjectAliases = {
      'ret': 'ret14',
      'ret-14': 'ret14',
      'skatt': 'ret14',
      'skatterett': 'ret14',
      'sol1': 'subj_sol1',
      'sol-1': 'subj_sol1',
      'sol': 'subj_sol1',
      'organisasjonsatferd': 'subj_sol1',
      'organisasjonsrett': 'subj_sol1',
      'subj-sol1': 'subj_sol1'
    };
    if (subjectAliases[subject]) params.set('subject', subjectAliases[subject]);
    if ((params.get('tool') || '').toLowerCase() === 'quiz' && !params.get('mode')) params.set('mode', 'quiz');
    if (params.toString() !== original) {
      window.history.replaceState(null, '', window.location.pathname + '?' + params.toString() + window.location.hash);
    }
  }

  function injectFlashcardsVisualUpgrade() {
    if (!isFlashcardsPage() || document.getElementById('haugnes-flashcards-upgrade')) return;
    var logoPath = getAssetPath('haugnes-logo-mark.svg');
    var style = document.createElement('style');
    style.id = 'haugnes-flashcards-upgrade';
    style.textContent = ":root{--bg:#06142d;--card:#fff;--primary:#08172f;--accent:#2f62ff;--green:#20b97a;--yellow:#f09828;--red:#ef4444;--text:#14213d;--muted:#65738d;--border:#e1e9f4;--radius:20px;--shadow:0 18px 44px rgba(7,19,41,.12)}body{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:radial-gradient(circle at 18% 10%,rgba(47,98,255,.16),transparent 24%),radial-gradient(circle at 82% 0,rgba(232,188,104,.12),transparent 22%),linear-gradient(180deg,#06142d,#071936 44%,#f6f8fc 44%,#fff);color:var(--text)}.app-header{position:sticky;top:0;z-index:50;background:linear-gradient(135deg,rgba(4,16,38,.96),rgba(8,31,71,.96));backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.1);box-shadow:0 18px 40px rgba(0,0,0,.22);padding:18px 22px}.app-header::before{content:'';width:44px;height:44px;border-radius:14px;background:#0b244e url('" + logoPath + "') center/78% no-repeat;border:1px solid rgba(255,255,255,.14);box-shadow:0 12px 26px rgba(0,0,0,.28);flex:0 0 44px}.app-header h1{font-size:21px;font-weight:900;letter-spacing:-.035em}.app-header p{color:#91a5c8;opacity:1}.header-back,.save-btn{border-radius:13px;font-weight:850}.header-back{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12)}.save-btn{background:linear-gradient(135deg,#20b97a,#13a46f)}.view{max-width:880px;padding:22px 20px}.subject-grid{grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.subject-card,.deck-item,.stats-card,.end-stat,.modal,.review-item,.quiz-q-card,.quiz-end{border:1px solid var(--border);box-shadow:var(--shadow);border-radius:20px}.subject-card{border-width:1px}.subject-card-header{padding:22px 22px 15px}.subject-card-header h3{font-size:19px;font-weight:900;letter-spacing:-.035em}.subject-card-body{padding:15px 22px 18px}.deck-list{gap:13px}.deck-item{padding:18px 20px;background:linear-gradient(180deg,#fff,#f8fbff)}.deck-item h3{font-size:15px;font-weight:850}.filter-btn,.topic-btn,.card-nav-btn,.restart-icon,.nav-arrow{border-radius:12px;font-weight:800}.filter-btn.active,.topic-btn.active{background:#eef3ff;color:#2f62ff;border-color:#b9c8ff}.card-scene{margin:12px 0}.flashcard-inner{min-height:340px}.card-face{border-radius:28px;box-shadow:0 26px 70px rgba(7,19,41,.18);border:1px solid #e2e9f4;background:linear-gradient(180deg,#fff,#f8fbff);padding:42px 34px}.card-content{font-size:20px;line-height:1.6;max-width:650px}.card-label{border-radius:999px;padding:5px 11px;letter-spacing:.08em}.rating-area{gap:12px}.rate-btn{border-radius:16px;max-width:none;font-weight:900}.finish-btn,.end-btn.primary,.btn.primary,.quiz-next-btn{background:linear-gradient(135deg,#2a58ea,#4274ff)!important;color:#fff;box-shadow:0 16px 30px rgba(47,98,255,.24)}.toast{background:#071a38;border:1px solid rgba(255,255,255,.12);box-shadow:0 18px 40px rgba(0,0,0,.25)}@media(max-width:560px){.app-header{padding:14px 14px;gap:9px}.app-header::before{width:38px;height:38px}.app-header h1{font-size:18px}.view{padding:16px 14px}.flashcard-inner{min-height:300px}.card-face{padding:30px 18px}.card-content{font-size:17px}.rating-area{display:grid!important;grid-template-columns:1fr}}";
    document.head.appendChild(style);
    document.title = 'Flashcards — Haugnes';
  }

  function enhanceFlashcardsPage() {
    normalizeFlashcardsRoute();
    injectFlashcardsVisualUpgrade();
  }

  normalizeFlashcardsRoute();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      applyBranding();
      enhanceFlashcardsPage();
    });
  } else {
    applyBranding();
    enhanceFlashcardsPage();
  }

  function getLoginPath() {
    return rootRelative('login.html');
  }

  function getLoginUrlWithNext() {
    return getLoginPath() + '?next=' + encodeURIComponent(window.location.href);
  }

  function getClient() {
    if (!window.supabase) throw new Error('Supabase client is not loaded');
    if (!sb) sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return sb;
  }

  function reveal() {
    document.documentElement.style.visibility = '';
  }

  function requireAuth() {
    document.documentElement.style.visibility = 'hidden';
    try {
      return getClient().auth.getSession().then(function (result) {
        session = result.data && result.data.session;
        if (!session) {
          window.location.replace(getLoginUrlWithNext());
          return null;
        }
        reveal();
        applyBranding();
        enhanceFlashcardsPage();
        return session;
      }).catch(function () {
        window.location.replace(getLoginUrlWithNext());
        return null;
      });
    } catch (e) {
      window.location.replace(getLoginUrlWithNext());
      return Promise.resolve(null);
    }
  }

  function bindUserInfo(labelId, chipId, avatarId) {
    if (!session || !session.user) return;
    var email = session.user.email || '';
    var username = email.split('@')[0] || 'student';
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
    getRootPath: getRootPath,
    applyBranding: applyBranding,
    normalizeFlashcardsRoute: normalizeFlashcardsRoute,
    enhanceFlashcardsPage: enhanceFlashcardsPage
  };
})(window, document);
