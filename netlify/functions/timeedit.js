const ALLOWED_HOSTS = new Set(['cloud.timeedit.net']);
const ALLOWED_PATH_PREFIX = '/nhh/web/student/';
const MAX_BYTES = 2_000_000;
const ALLOWED_ORIGINS = new Set([
  'https://bhflashcards.no',
  'https://www.bhflashcards.no',
  'https://skiloperen05.github.io',
  'http://localhost:3000',
  'http://localhost:5173'
]);

function headers(contentType = 'application/json; charset=utf-8', origin = '') {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://bhflashcards.no',
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

async function readLimitedText(response) {
  const reader = response.body && response.body.getReader ? response.body.getReader() : null;
  if (!reader) {
    const text = await response.text();
    return text.slice(0, MAX_BYTES);
  }

  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    received += value.byteLength;
    if (received > MAX_BYTES) {
      throw new Error('Response too large');
    }

    chunks.push(Buffer.from(value));
  }

  return Buffer.concat(chunks).toString('utf8');
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: headers(undefined, event.headers && event.headers.origin), body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: headers(undefined, event.headers && event.headers.origin), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let target;
  try {
    target = validateTarget(event.queryStringParameters && event.queryStringParameters.url);
  } catch (error) {
    return { statusCode: 400, headers: headers(undefined, event.headers && event.headers.origin), body: JSON.stringify({ error: error.message }) };
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Haugnes-Flashcards/1.0 (+https://github.com/Skiloperen05/Flashcards)',
        'Accept': 'text/calendar,text/csv,text/html,application/json,text/plain,*/*;q=0.8'
      },
      redirect: 'follow'
    });

    const text = await readLimitedText(upstream);
    const contentType = allowedContentType(upstream.headers.get('content-type'));

    return {
      statusCode: upstream.status,
      headers: Object.assign(headers(contentType, event.headers && event.headers.origin), {
        'Cache-Control': upstream.ok ? 'public, max-age=900, stale-while-revalidate=3600' : 'no-store'
      }),
      body: text
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: headers(undefined, event.headers && event.headers.origin),
      body: JSON.stringify({ error: 'Could not fetch TimeEdit data', detail: error.message })
    };
  }
};
