(function (window) {
  'use strict';

  if (window.__haugnesTimeEditFetchProxyInstalled) return;
  window.__haugnesTimeEditFetchProxyInstalled = true;

  var SUPABASE_FUNCTION_URL = 'https://qnwjhheoekpqqqhevztw.supabase.co/functions/v1/timeedit';
  var originalFetch = window.fetch ? window.fetch.bind(window) : null;

  if (!originalFetch) return;

  function shouldProxy(input) {
    var url = typeof input === 'string' ? input : input && input.url;
    if (!url) return false;
    var parsed;
    try {
      parsed = new URL(url, window.location.origin);
      return parsed.pathname === '/api/timeedit' && parsed.searchParams.has('url');
    } catch (_e) {
      return false;
    }
  }

  function toSupabaseUrl(input) {
    var url = typeof input === 'string' ? input : input && input.url;
    var parsed = new URL(url, window.location.origin);
    return SUPABASE_FUNCTION_URL + '?url=' + encodeURIComponent(parsed.searchParams.get('url'));
  }

  window.fetch = function (input, init) {
    if (!shouldProxy(input)) return originalFetch(input, init);

    return originalFetch(toSupabaseUrl(input), init);
  };

  window.HaugnesTimeEditProxy = {
    supabaseUrl: SUPABASE_FUNCTION_URL,
    installed: true,
  };
})(window);
