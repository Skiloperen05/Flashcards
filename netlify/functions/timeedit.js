const ALLOWED_HOSTS = new Set(['cloud.timeedit.net']);
const ALLOWED_PATH_PREFIX = '/nhh/web/student/';
const MAX_CHARS = 2_000_000;

function headers(contentType = 'application/json; charset=utf-8') {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': contentType,
    'Vary': 'Origin'
  };
}

function validateTarget(rawUrl) {
  if (!rawUrl) throw new Error('Missing url query parameter');
  const target = new URL(rawUrl);
  if (target.protocol !== 'https:') throw new Error('Only https URLs are allowed');
  if (!ALLOWED_HOSTS.has(target.hostname)) throw new Error('Host is not allowed');
  if (!target.pathname.startsWith(ALLOWED_PATH_PREFIX)) throw new Error('Only NHH TimeEdit student URLs are allowed');
  return target;
}

function allowedContentType(contentType) {
  const lower = String(contentType || '').toLowerCase();
  if (lower.includes('text/html')) return 'text/html; charset=utf-8';
  if (lower.includes('text/csv')) return 'text/csv; charset=utf-8';
  if (lower.includes('text/calendar')) return 'text/calendar; charset=utf-8';
  if (lower.includes('application/json')) return 'application/json; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: headers(), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: headers(), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let target;
  try {
    target = validateTarget(event.queryStringParameters && event.queryStringParameters.url);
  } catch (error) {
    return { statusCode: 400, headers: headers(), body: JSON.stringify({ error: error.message }) };
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Haugnes-Flashcards/1.0 (+https://github.com/Skiloperen05/Flashcards)',
        'Accept': 'text/calendar,text/csv,text/html,application/json,text/plain,*/*;q=0.8'
      },
      redirect: 'follow'
    });

    const text = (await upstream.text()).slice(0, MAX_CHARS);
    const contentType = allowedContentType(upstream.headers.get('content-type'));

    return {
      statusCode: upstream.status,
      headers: Object.assign(headers(contentType), {
        'Cache-Control': upstream.ok ? 'public, max-age=900, stale-while-revalidate=3600' : 'no-store'
      }),
      body: text
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: headers(),
      body: JSON.stringify({ error: 'Could not fetch TimeEdit data', detail: error.message })
    };
  }
};
