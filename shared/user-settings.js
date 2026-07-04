(function (window, document) {
  'use strict';

  if (window.__haugnesUserSettingsInstalled) return;
  window.__haugnesUserSettingsInstalled = true;

  var STORAGE_KEY = 'hf_user_settings_v2';
  var LAST_SEEN_KEY = 'hf_last_seen_at';

  var ACCENTS = {
    bla: { main: '#2f62ff', light: '#4b7dff', ink: '#fff' },
    gull: { main: '#e8bc68', light: '#f3c469', ink: '#2a1e06' },
    gronn: { main: '#20b97a', light: '#22c55e', ink: '#04231a' },
    oransje: { main: '#f09828', light: '#fb923c', ink: '#2a1706' },
    lilla: { main: '#a855f7', light: '#8b5cf6', ink: '#fff' },
    cyan: { main: '#06b6d4', light: '#38bdd8', ink: '#052027' }
  };
  var BACKGROUNDS = {
    standard: 'radial-gradient(1200px 720px at 10% -8%, rgba(47,98,255,.20), transparent 60%), radial-gradient(1100px 720px at 112% 4%, rgba(232,188,104,.12), transparent 55%), linear-gradient(180deg,#04142f,#020817)',
    midnatt: 'radial-gradient(1000px 640px at 14% -10%, rgba(47,98,255,.13), transparent 60%), linear-gradient(180deg,#030c20,#010410)',
    skumring: 'radial-gradient(1100px 720px at 90% -8%, rgba(232,188,104,.20), transparent 58%), radial-gradient(1000px 720px at 4% 6%, rgba(124,58,237,.18), transparent 60%), linear-gradient(180deg,#0a0920,#050412)'
  };
  var AVATARS = {
    cap: 'assets/illustrations/01_graduation_cap.png',
    brain: 'assets/illustrations/04_brain_idea.png',
    target: 'assets/illustrations/07_target_arrow.png',
    lightbulb: 'assets/illustrations/08_lightbulb.png',
    medal: 'assets/illustrations/17_medal.png',
    rocket: 'assets/illustrations/24_rocket_clean.png',
    coffee: 'assets/illustrations/14_coffee_mug.png',
    book: 'assets/illustrations/19_open_book_clean.png',
    growth: 'assets/illustrations/06_growth_arrow.png',
    calendar: 'assets/illustrations/11_calendar_star.png',
    chart: 'assets/illustrations/12_pie_chart.png'
  };
  var DEFAULTS = {
    avatar: 'cap',
    displayName: '',
    username: '',
    program: 'Master i økonomi og administrasjon',
    kull: '2026',
    accent: 'bla',
    bg: 'standard',
    density: 'komfort',
    sessionLen: 50,
    startWith: 'repetisjon',
    organizing: 'fag',
    autoDiff: true,
    examMode: true,
    language: 'norsk',
    checkIn: true,
    checkInAfter: 'maaned',
    examAlerts: true,
    sound: false,
    appNotice: true,
    email: false,
    analytics: true,
    recommend: true,
    shareGroup: false,
    fontSize: 15,
    reducedMotion: false,
    highContrast: false,
    updatedAt: ''
  };
  var CHECKIN_DAYS = { uke: 7, to_uker: 14, maaned: 30 };

  var settings = load();
  var identityTimer = null;
  var checkinHandled = false;

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function load() {
    var stored = readJson(STORAGE_KEY, {});
    var out = {};
    Object.keys(DEFAULTS).forEach(function (key) { out[key] = DEFAULTS[key]; });
    Object.keys(stored || {}).forEach(function (key) { if (key in DEFAULTS) out[key] = stored[key]; });
    return out;
  }

  function rootRelative(path) {
    if (window.AuthGuard && typeof window.AuthGuard.getRootPath === 'function') {
      return window.AuthGuard.getRootPath().replace(/\/$/, '/') + path.replace(/^\//, '');
    }
    return '../' + path.replace(/^\//, '');
  }

  function isUserPage() {
    return /\/user\//.test(window.location.pathname);
  }

  function isSettingsPage() {
    return /\/user\/settings\.html$/i.test(window.location.pathname);
  }

  function hexToRgba(hex, alpha) {
    var num = parseInt(String(hex || '').replace('#', ''), 16);
    return 'rgba(' + ((num >> 16) & 255) + ',' + ((num >> 8) & 255) + ',' + (num & 255) + ',' + alpha + ')';
  }

  function clampNumber(value, min, max, fallback) {
    var n = parseInt(value, 10);
    if (!Number.isFinite(n)) n = fallback;
    return Math.max(min, Math.min(max, n));
  }

  function injectCss() {
    if (document.getElementById('haugnes-user-settings-css')) return;
    var style = document.createElement('style');
    style.id = 'haugnes-user-settings-css';
    style.textContent = [
      'html.hf-reduce *{transition:none!important;animation:none!important;scroll-behavior:auto!important}',
      'html.hf-accented .sidebar .nav-link.active{background:var(--ux-accent-grad)!important;color:var(--ux-accent-ink)!important;box-shadow:0 12px 26px var(--ux-accent-glow)!important}',
      'html.hf-accented .start-btn,html.hf-accented .up-btn,html.hf-accented .hf-premium-card b{background:var(--ux-accent-grad)!important;color:var(--ux-accent-ink)!important;box-shadow:0 14px 28px var(--ux-accent-glow)!important}',
      'html.hf-userbg body{background:var(--ux-page-bg)!important}',
      'html.hf-no-recommend .recommend{display:none!important}',
      '.hf-checkin-banner{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9500;display:flex;align-items:center;gap:13px;max-width:min(92vw,520px);padding:13px 15px 13px 18px;border-radius:18px;border:1px solid rgba(126,162,255,.30);background:linear-gradient(180deg,rgba(13,36,77,.97),rgba(8,23,50,.97));color:#eaf1ff;font:700 14px/1.45 Lora,Georgia,serif;box-shadow:0 18px 44px rgba(0,0,0,.42)}',
      '.hf-checkin-banner a{color:var(--ux-accent-2,#8fb0ff);font-weight:800;text-decoration:none;white-space:nowrap}',
      '.hf-checkin-banner button{flex:0 0 auto;border:0;border-radius:10px;padding:7px 11px;background:rgba(255,255,255,.08);color:#cdd9f2;font:800 12px Lora,Georgia,serif;cursor:pointer}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function applyTheme() {
    var root = document.documentElement;
    var accent = ACCENTS[settings.accent] || ACCENTS.bla;
    root.style.setProperty('--ux-accent', accent.main);
    root.style.setProperty('--ux-accent-2', accent.light);
    root.style.setProperty('--ux-accent-grad', 'linear-gradient(135deg,' + accent.main + ',' + accent.light + ')');
    root.style.setProperty('--ux-accent-fill', hexToRgba(accent.main, .15));
    root.style.setProperty('--ux-accent-line', hexToRgba(accent.main, .35));
    root.style.setProperty('--ux-accent-glow', hexToRgba(accent.main, .34));
    root.style.setProperty('--ux-accent-ink', accent.ink);
    root.style.setProperty('--ux-page-bg', BACKGROUNDS[settings.bg] || BACKGROUNDS.standard);
    root.style.setProperty('--ux-row-pad', settings.density === 'kompakt' ? '14px 16px' : '19px 20px');
    root.style.setProperty('--ux-text', clampNumber(settings.fontSize, 13, 20, 15) + 'px');
    root.style.setProperty('--ux-muted', settings.highContrast ? '#dfe8fb' : '#91a5c8');

    root.classList.toggle('hf-accented', settings.accent !== 'bla');
    root.classList.toggle('hf-userbg', settings.bg !== 'standard' && isUserPage());
    root.classList.toggle('hf-reduce', !!settings.reducedMotion);
    root.classList.toggle('hf-no-recommend', settings.recommend === false);
    root.lang = settings.language === 'engelsk' ? 'en' : 'no';

    // Muted/secondary text only on the dark /user/ shell; tool pages have
    // their own light palettes where these values would hurt readability.
    if (settings.highContrast && isUserPage()) {
      root.style.setProperty('--muted', '#dfe8fb');
      root.style.setProperty('--soft', '#e8eefc');
      root.style.setProperty('--text-secondary', '#e8eefc');
    } else {
      root.style.removeProperty('--muted');
      root.style.removeProperty('--soft');
      root.style.removeProperty('--text-secondary');
    }

    if (document.body) {
      var size = clampNumber(settings.fontSize, 13, 20, 15);
      // The settings page previews font size itself via --ux-text.
      if (size !== 15 && !isSettingsPage()) document.body.style.zoom = String(Math.round(size / 15 * 1000) / 1000);
      else document.body.style.zoom = '';
    }
  }

  function avatarSrc() {
    var file = AVATARS[settings.avatar];
    return file ? rootRelative(file) : '';
  }

  function displayName() {
    return String(settings.displayName || settings.username || '').trim();
  }

  function setAvatarTile(el, src) {
    var img = el.querySelector('img');
    if (!img) {
      el.textContent = '';
      img = document.createElement('img');
      img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;padding:3px;display:block';
      el.style.background = 'linear-gradient(180deg,#fdfefe,#eaeff5)';
      el.style.overflow = 'hidden';
      el.appendChild(img);
    }
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
  }

  function applyIdentity() {
    var src = avatarSrc();
    if (src) {
      document.querySelectorAll('[data-avatar-img]').forEach(function (img) {
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      });
      document.querySelectorAll('.sidebar .hf-avatar, #sideAvatar').forEach(function (el) {
        setAvatarTile(el, src);
      });
    }
    var name = displayName();
    if (name) {
      document.querySelectorAll('#sideName, .hf-user-card strong, [data-username]').forEach(function (el) {
        if (el.textContent !== name) el.textContent = name;
      });
      var hero = document.getElementById('heroName');
      var first = name.split(/\s+/)[0];
      if (hero && hero.textContent !== first) hero.textContent = first;
    }
    var subtitle = settings.kull ? 'NHH-student · ' + settings.kull : 'NHH-student';
    document.querySelectorAll('.hf-user-card span span, .user-mini-text span, .profile-copy span').forEach(function (el) {
      if (/^NHH-student/.test(el.textContent.trim()) && el.textContent !== subtitle) el.textContent = subtitle;
    });
  }

  function maybeShowCheckIn() {
    if (checkinHandled || !document.body || !isUserPage()) return;
    checkinHandled = true;
    var now = Date.now();
    var last = 0;
    try { last = parseInt(window.localStorage.getItem(LAST_SEEN_KEY), 10) || 0; } catch (e) {}
    try { window.localStorage.setItem(LAST_SEEN_KEY, String(now)); } catch (e) {}
    if (!last || !settings.checkIn || !settings.appNotice) return;
    var thresholdMs = (CHECKIN_DAYS[settings.checkInAfter] || 30) * 24 * 60 * 60 * 1000;
    if (now - last < thresholdMs) return;
    var banner = document.createElement('div');
    banner.className = 'hf-checkin-banner';
    banner.setAttribute('role', 'status');
    var text = document.createElement('span');
    text.textContent = 'Alt bra? Kortene venter når du er klar 💙 ';
    var link = document.createElement('a');
    link.href = rootRelative('flashcards/');
    link.textContent = 'Start en kort økt →';
    text.appendChild(link);
    var close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Lukk';
    close.addEventListener('click', function () { banner.remove(); });
    banner.appendChild(text);
    banner.appendChild(close);
    document.body.appendChild(banner);
    window.setTimeout(function () { banner.remove(); }, 20000);
  }

  function apply() {
    settings = load();
    injectCss();
    applyTheme();
    applyIdentity();
    maybeShowCheckIn();
  }

  function scheduleIdentity() {
    window.clearTimeout(identityTimer);
    identityTimer = window.setTimeout(applyIdentity, 120);
  }

  function installObservers() {
    if (!document.body || !window.MutationObserver || installObservers.done) return;
    installObservers.done = true;
    // Sidebar/profile widgets are (re)rendered by other shared scripts and
    // page-local auth callbacks; re-apply identity when the DOM settles.
    new MutationObserver(scheduleIdentity).observe(document.body, { childList: true, subtree: true });
  }

  function syncFromRemote() {
    if (syncFromRemote.done) return;
    if (!window.AuthGuard || typeof window.AuthGuard.getSession !== 'function' || typeof window.AuthGuard.getClient !== 'function') return;
    var session = window.AuthGuard.getSession();
    if (!session || !session.user || !session.user.id || session.user.email === 'dev@student.local') return;
    syncFromRemote.done = true;
    var client;
    try { client = window.AuthGuard.getClient(); } catch (e) { return; }
    client.from('user_custom_data').select('data').eq('user_id', session.user.id).maybeSingle().then(function (result) {
      var data = result && result.data && result.data.data && typeof result.data.data === 'object' ? result.data.data : {};
      var remote = data.settings && typeof data.settings === 'object' ? data.settings : null;
      if (!remote) return;
      var remoteTime = Date.parse(remote.updatedAt || '') || 0;
      var localTime = Date.parse(load().updatedAt || '') || 0;
      if (remoteTime <= localTime) return;
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remote)); } catch (e) {}
      apply();
    }).catch(function () {});
  }

  function run() {
    apply();
    installObservers();
    [200, 800, 1700, 3500].forEach(function (delay) {
      window.setTimeout(function () {
        applyIdentity();
        syncFromRemote();
      }, delay);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  window.addEventListener('storage', function (event) {
    if (!event || !event.key || event.key === STORAGE_KEY) apply();
  });

  window.HaugnesUserSettings = {
    apply: apply,
    reload: apply,
    getAll: function () { return load(); },
    get: function (key) { return load()[key]; },
    DEFAULTS: DEFAULTS,
    ACCENTS: ACCENTS,
    BACKGROUNDS: BACKGROUNDS,
    AVATARS: AVATARS
  };
})(window, document);
