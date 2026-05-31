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

function setCors(res) {
  const origin = res.req && res.req.headers ? res.req.headers.origin : '';
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.has(origin) ? origin : 'https://bhflashcards.no');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function validateTarget(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Missing url query parameter');
  }

  let target;
  try {
    target = new URL(rawUrl);
  } catch (error) {
    throw new Error('Invalid url');
  }

  if (target.protocol !== 'https:') {
    throw new Error('Only https URLs are allowed');
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    throw new Error('Host is not allowed');
  }

  if (!target.pathname.startsWith(ALLOWED_PATH_PREFIX)) {
    throw new Error('Only NHH TimeEdit student URLs are allowed');
  }

  return target;
}

function allowedContentType(contentType) {
  const lower = String(contentType || '').toLowerCase();
  if (!lower) return 'text/plain; charset=utf-8';
  if (lower.includes('text/html')) return 'text/html; charset=utf-8';
  if (lower.includes('text/csv')) return 'text/csv; charset=utf-8';
  if (lower.includes('text/calendar')) return 'text/calendar; charset=utf-8';
  if (lower.includes('application/json')) return 'application/json; charset=utf-8';
  if (lower.includes('text/plain')) return 'text/plain; charset=utf-8';
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
    received += value.byteLength;
    if (received > MAX_BYTES) {
      throw new Error('Response too large');
    }
    chunks.push(value);
  }

  const buffer = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  return buffer.toString('utf8');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let target;
  try {
    target = validateTarget(req.query.url);
  } catch (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  try {
    const upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Haugnes-Flashcards/1.0 (+https://github.com/Skiloperen05/Flashcards)',
        'Accept': 'text/calendar,text/csv,text/html,application/json,text/plain,*/*;q=0.8'
      },
      redirect: 'follow'
    });

    const body = await readLimitedText(upstream);
    const contentType = allowedContentType(upstream.headers.get('content-type'));

    res.status(upstream.status);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', upstream.ok ? 's-maxage=900, stale-while-revalidate=3600' : 'no-store');
    res.send(body);
  } catch (error) {
    res.status(502).json({ error: 'Could not fetch TimeEdit data', detail: error.message });
  }
}
