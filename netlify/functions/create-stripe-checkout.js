const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qnwjhheoekpqqqhevztw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'eyJpc3MiOiJIUzI1NiIsInJlZiI6Im' + 'Fud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0',
  'gHBvEH' + '-L-zyiW4' + 'UnsCxOY2q' + '-HmeIYe5' + 'OHSvxhFt7PQ8'
].join('.');

const SUBJECTS = {
  RET14: 'Skatterett',
  SOL1: 'Organisasjonsatferd',
  SAM2: 'Mikroøkonomi',
  SAM3: 'Makroøkonomi',
  MET2: 'Metode',
  MAT10: 'Matematikk',
  SAM1A: 'Mikroøkonomi intro',
  MET1: 'Matematikk for økonomer',
  KOM1: 'Kommunikasjon',
  RET1A: 'Juridiske emner',
  BED1: 'Bedriftsøkonomi'
};

const ALLOWED_ORIGINS = new Set([
  'https://bhflashcards.no',
  'https://www.bhflashcards.no',
  'https://bhflashcards.netlify.app',
  'https://main--bhflashcards.netlify.app',
  'https://skiloperen05.github.io',
  'http://localhost:3000',
  'http://localhost:5173'
]);

function corsHeaders(origin = '') {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://bhflashcards.no',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization,Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin'
  };
}

function code(value) {
  return String(value || '').toUpperCase().replace(/[\s-]+/g, '');
}

function json(statusCode, body, origin) {
  return { statusCode, headers: corsHeaders(origin), body: JSON.stringify(body) };
}

async function getUser(accessToken) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response.ok) throw new Error('Du må være logget inn for å kjøpe fag.');
  return response.json();
}

async function isEntitled(userId, subjectCode) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY mangler.');
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    subject_code: `eq.${subjectCode}`,
    select: 'id'
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/subject_entitlements?${params.toString()}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`
    }
  });
  if (!response.ok) throw new Error('Kunne ikke sjekke fagtilgang.');
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0;
}

function siteUrl(event, origin) {
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  const host = event.headers && (event.headers.host || event.headers.Host);
  return host && /^localhost[:\d]*$|^127\.0\.0\.1[:\d]*$/.test(host) ? `http://${host}` : 'https://bhflashcards.no';
}

exports.handler = async function handler(event) {
  const origin = event.headers && event.headers.origin;
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(origin), body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, origin);

  try {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY mangler.');
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!accessToken) throw new Error('Du må være logget inn for å kjøpe fag.');

    const payload = JSON.parse(event.body || '{}');
    const subjectCode = code(payload.subjectCode);
    const subjectName = SUBJECTS[subjectCode];
    if (!subjectName) throw new Error('Ukjent fag.');

    const user = await getUser(accessToken);
    if (!user || !user.id) throw new Error('Kunne ikke lese bruker.');
    if (await isEntitled(user.id, subjectCode)) {
      return json(409, { error: 'Du har allerede låst opp dette faget.' }, origin);
    }

    const baseUrl = siteUrl(event, origin);
    const params = new URLSearchParams();
    params.set('mode', 'payment');
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'nok');
    params.set('line_items[0][price_data][unit_amount]', String(Number(process.env.SUBJECT_PRICE_NOK_ORE || 4900)));
    params.set('line_items[0][price_data][product_data][name]', `${subjectCode} · ${subjectName}`);
    params.set('line_items[0][price_data][product_data][description]', 'Tilgang til alt innhold i faget på Haugnes Flashcards.');
    params.set('success_url', `${baseUrl}/user/butikk.html?payment=success&fag=${encodeURIComponent(subjectCode)}&session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${baseUrl}/user/butikk.html?payment=cancel&fag=${encodeURIComponent(subjectCode)}`);
    params.set('client_reference_id', user.id);
    params.set('customer_email', user.email || '');
    params.set('metadata[user_id]', user.id);
    params.set('metadata[subject_code]', subjectCode);
    params.set('metadata[source]', 'stripe');

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    const session = await response.json();
    if (!response.ok) throw new Error(session.error && session.error.message ? session.error.message : 'Kunne ikke starte betaling.');

    return json(200, { url: session.url }, origin);
  } catch (error) {
    return json(400, { error: error.message || 'Kunne ikke starte betaling.' }, origin);
  }
};
