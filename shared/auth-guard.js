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

  function addStylesheet(id, href) {
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function addScript(id, src, onload) {
    var existing = document.getElementById(id);
    if (existing) {
      if (onload) {
        if (id === 'haugnes-subject-meta-js' && window.HaugnesSubjects) onload();
        else existing.addEventListener('load', onload, { once: true });
      }
      return;
    }
    var script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    if (onload) script.onload = onload;
    if (onload) script.onerror = onload;
    document.head.appendChild(script);
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

    document.querySelectorAll('.brand,.logo').forEach(function (brand) {
      if (/StudieHub/i.test(brand.textContent)) {
        var label = brand.querySelector('span:last-child');
        if (label) label.textContent = 'Haugnes';
      }
    });
  }

  function isFlashcardsPage() {
    return /\/flashcards\/?(?:index\.html)?$/.test(window.location.pathname);
  }

  function isRet14QuizPage() {
    return /\/ret14\/quiz\/?(?:index\.html)?$/.test(window.location.pathname);
  }

  function isRet14ExamPage() {
    return /\/ret14\/eksamen\/?(?:index\.html)?$/.test(window.location.pathname);
  }

  function isRet14PensumPage() {
    return /\/ret14\/pensum\/?(?:index\.html)?$/.test(window.location.pathname);
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

  function enhanceFlashcardsPage() {
    if (!isFlashcardsPage()) return;
    normalizeFlashcardsRoute();
    addStylesheet('haugnes-flashcards-css', rootRelative('shared/haugnes-flashcards.css'));
    addScript('haugnes-subject-meta-js', rootRelative('shared/subject-meta.js'), function () {
      addScript('haugnes-flashcards-structure-js', rootRelative('shared/haugnes-flashcards-structure.js'));
    });
    document.title = 'Flashcards — Haugnes';
  }

  function enhanceRet14QuizPage() {
    if (!isRet14QuizPage()) return;
    addStylesheet('haugnes-ret14-quiz-css', rootRelative('shared/haugnes-ret14-quiz.css'));
    document.title = 'RET14 Quiz — Haugnes';
    window.setTimeout(function () {
      applyBranding();
      var brandLabel = document.querySelector('.brand span:last-child');
      if (brandLabel) brandLabel.textContent = 'Haugnes';
    }, 0);
  }

  function ensureToolBackdrop() {
    if (!document.querySelector('.haugnes-tool-backdrop')) {
      var backdrop = document.createElement('div');
      backdrop.className = 'haugnes-tool-backdrop';
      document.body.insertBefore(backdrop, document.body.firstChild);
    }
  }

  function enhanceRet14ExamPage() {
    if (!isRet14ExamPage()) return;
    addStylesheet('haugnes-ret14-eksamen-css', rootRelative('shared/haugnes-ret14-eksamen.css'));
    document.title = 'RET14 Eksamensradar — Haugnes';
    if (!document.querySelector('.haugnes-tool-nav')) {
      var nav = document.createElement('nav');
      nav.className = 'haugnes-tool-nav';
      nav.innerHTML = '<a class="haugnes-tool-brand" href="' + rootRelative('user/index.html') + '"><span class="haugnes-tool-logo"></span><span>Haugnes</span></a><div class="haugnes-tool-links"><a class="haugnes-tool-link primary" href="' + rootRelative('ret14/') + '">← RET14</a><a class="haugnes-tool-link" href="' + rootRelative('ret14/quiz/') + '">Quiz</a><a class="haugnes-tool-link" href="' + rootRelative('flashcards/?subject=ret14') + '">Flashcards</a><a class="haugnes-tool-link" href="' + rootRelative('user/index.html') + '">Dashboard</a></div>';
      document.body.insertBefore(nav, document.body.firstChild);
    }
    ensureToolBackdrop();
  }

  function enhanceRet14PensumPage() {
    if (!isRet14PensumPage()) return;
    addStylesheet('haugnes-ret14-pensum-css', rootRelative('shared/haugnes-ret14-pensum.css'));
    document.title = 'RET14 Pensumoversikt — Haugnes';
    window.setTimeout(function () {
      applyBranding();
      var logoLabel = document.querySelector('.logo span:last-child');
      if (logoLabel) logoLabel.textContent = 'Haugnes';
    }, 0);
    ensureToolBackdrop();
  }

  function enhancePages() {
    applyBranding();
    enhanceFlashcardsPage();
    enhanceRet14QuizPage();
    enhanceRet14ExamPage();
    enhanceRet14PensumPage();
  }

  normalizeFlashcardsRoute();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhancePages);
  } else {
    enhancePages();
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
        enhancePages();
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
    enhanceFlashcardsPage: enhanceFlashcardsPage,
    enhanceRet14QuizPage: enhanceRet14QuizPage,
    enhanceRet14ExamPage: enhanceRet14ExamPage,
    enhanceRet14PensumPage: enhanceRet14PensumPage
  };
})(window, document);
