import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://qnwjhheoekpqqqhevztw.supabase.co';
const SUPABASE_ANON_KEY =
  Deno.env.get('SUPABASE_ANON_KEY') ||
  [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6In' +
      'Fud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0',
    'gHBvEH' + '-L-zyiW4' + 'UnsCxOY2q' + '-HmeIYe5' + 'OHSvxhFt7PQ8',
  ].join('.');
const DEFAULT_SITE_URL = 'https://bhflashcards.no';
const DEFAULT_PRICE_NOK_ORE = 4900;

const SUBJECTS: Record<string, string> = {
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
  BED1: 'Bedriftsøkonomi',
};

// Fallback when no Stripe secret key is configured. These links have their
// price baked in on the Stripe side, so per-subject prices in subject_prices
// only take effect through the dynamic Checkout Session flow below.
const PAYMENT_LINKS: Record<string, string> = {
  RET14: 'https://buy.stripe.com/eVq00k2M0bjBdWSd9s3F600',
  SOL1: 'https://buy.stripe.com/14AbJ286k1J14mi2uO3F601',
  SAM2: 'https://buy.stripe.com/4gM4gAdqEdrJdWS6L43F602',
  SAM3: 'https://buy.stripe.com/cNi5kE3Q40EX062glE3F603',
  MET2: 'https://buy.stripe.com/cNibJ272g5Zh6uq8Tc3F604',
  MAT10: 'https://buy.stripe.com/6oUeVe72g0EX7yu5H03F605',
  SAM1A: 'https://buy.stripe.com/8x2bJ29ao3R94mifhA3F606',
  MET1: 'https://buy.stripe.com/3cI5kE9aofzR062d9s3F607',
  KOM1: 'https://buy.stripe.com/7sY14o86k3R97yu3yS3F608',
  RET1A: 'https://buy.stripe.com/14AeVe86kcnF3ieb1k3F609',
  BED1: 'https://buy.stripe.com/5kQbJ21HWfzRcSO4CW3F60a',
};

const exactAllowedOrigins = new Set([
  'https://bhflashcards.no',
  'https://www.bhflashcards.no',
  'https://skiloperen05.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
]);

function isAllowedOrigin(origin: string) {
  if (exactAllowedOrigins.has(origin)) return true;

  try {
    const hostname = new URL(origin).hostname;
    return (
      hostname === 'bhflashcards.pages.dev' ||
      hostname.endsWith('.bhflashcards.pages.dev') ||
      hostname === 'bhflashcards-no.pages.dev' ||
      hostname.endsWith('.bhflashcards-no.pages.dev')
    );
  } catch (_error) {
    return false;
  }
}

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = isAllowedOrigin(origin) ? origin : DEFAULT_SITE_URL;
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    Vary: 'Origin',
  };
}

function siteUrl(req: Request) {
  const origin = req.headers.get('origin') || '';
  return isAllowedOrigin(origin) ? origin : DEFAULT_SITE_URL;
}

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(req),
  });
}

function code(value: unknown) {
  return String(value || '')
    .toUpperCase()
    .replace(/[\s-]+/g, '');
}

function bearerToken(req: Request) {
  return (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
}

async function getUser(accessToken: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) throw new Error('Du må være logget inn for å kjøpe fag.');
  return response.json();
}

function serviceRoleKey() {
  const legacyKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacyKey) return legacyKey;

  const modernKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (modernKeys) {
    try {
      const parsed = JSON.parse(modernKeys);
      if (parsed?.default) return String(parsed.default);
    } catch (_error) {
      // Fall through to the single-key fallback below.
    }
  }

  const singleKey = Deno.env.get('SUPABASE_SECRET_KEY');
  if (singleKey) return singleKey;

  throw new Error('Supabase admin-nøkkel mangler.');
}

function adminHeaders() {
  const key = serviceRoleKey();
  const headers: Record<string, string> = { apikey: key };

  if (!key.startsWith('sb_secret_')) {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

async function privateConfig(key: string) {
  const params = new URLSearchParams({ key: `eq.${key}`, select: 'value', limit: '1' });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/app_private_config?${params.toString()}`, {
    headers: adminHeaders(),
  });

  if (!response.ok) return null;
  const rows = await response.json();
  const value = Array.isArray(rows) && rows[0]?.value;
  return value ? String(value) : null;
}

async function stripeSecretKey() {
  return Deno.env.get('STRIPE_SECRET_KEY') || (await privateConfig('STRIPE_SECRET_KEY'));
}

async function subjectPriceOre(subjectCode: string) {
  const params = new URLSearchParams({
    subject_code: `eq.${subjectCode}`,
    select: 'price_nok_ore',
    limit: '1',
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/subject_prices?${params.toString()}`, {
    headers: adminHeaders(),
  });

  if (!response.ok) return DEFAULT_PRICE_NOK_ORE;
  const rows = await response.json();
  const price = Array.isArray(rows) && Number(rows[0]?.price_nok_ore);
  return price && price > 0 ? price : DEFAULT_PRICE_NOK_ORE;
}

async function isEntitled(userId: string, subjectCode: string) {
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    subject_code: `eq.${subjectCode}`,
    select: 'id',
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/subject_entitlements?${params.toString()}`, {
    headers: adminHeaders(),
  });

  if (!response.ok) throw new Error('Kunne ikke sjekke fagtilgang.');
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0;
}

async function createCheckoutSession(
  req: Request,
  secretKey: string,
  user: { id: string; email?: string },
  subjectCode: string,
  subjectName: string,
) {
  const baseUrl = siteUrl(req);
  const priceOre = await subjectPriceOre(subjectCode);

  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'nok');
  params.set('line_items[0][price_data][unit_amount]', String(priceOre));
  params.set('line_items[0][price_data][product_data][name]', `${subjectCode} · ${subjectName}`);
  params.set(
    'line_items[0][price_data][product_data][description]',
    'Tilgang til alt innhold i faget på Haugnes Flashcards.',
  );
  params.set(
    'success_url',
    `${baseUrl}/user/butikk.html?payment=success&fag=${encodeURIComponent(subjectCode)}&session_id={CHECKOUT_SESSION_ID}`,
  );
  params.set('cancel_url', `${baseUrl}/user/butikk.html?payment=cancel&fag=${encodeURIComponent(subjectCode)}`);
  params.set('client_reference_id', `${user.id}__${subjectCode}`);
  if (user.email) params.set('customer_email', user.email);
  params.set('metadata[user_id]', user.id);
  params.set('metadata[subject_code]', subjectCode);
  params.set('metadata[source]', 'stripe');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const session = await response.json();
  if (!response.ok || !session?.url) {
    throw new Error(session?.error?.message || 'Kunne ikke starte betaling.');
  }

  return String(session.url);
}

function paymentLinkUrl(user: { id: string; email?: string }, subjectCode: string) {
  const link = PAYMENT_LINKS[subjectCode];
  if (!link) throw new Error('Stripe-lenke mangler for faget.');

  const url = new URL(link);
  url.searchParams.set('client_reference_id', `${user.id}__${subjectCode}`);
  if (user.email) url.searchParams.set('prefilled_email', user.email);
  return url.toString();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== 'POST') {
    return json(req, 405, { error: 'Method not allowed' });
  }

  try {
    const accessToken = bearerToken(req);
    if (!accessToken) throw new Error('Du må være logget inn for å kjøpe fag.');

    const payload = await req.json().catch(() => ({}));
    const subjectCode = code(payload.subjectCode);
    const subjectName = SUBJECTS[subjectCode];
    if (!subjectName) throw new Error('Ukjent fag.');

    const user = await getUser(accessToken);
    if (!user?.id) throw new Error('Kunne ikke lese bruker.');

    if (await isEntitled(user.id, subjectCode)) {
      return json(req, 409, { error: 'Du har allerede låst opp dette faget.' });
    }

    const secretKey = await stripeSecretKey();
    const url = secretKey
      ? await createCheckoutSession(req, secretKey, user, subjectCode, subjectName)
      : paymentLinkUrl(user, subjectCode);

    return json(req, 200, { url });
  } catch (error) {
    return json(req, 400, { error: error instanceof Error ? error.message : 'Kunne ikke starte betaling.' });
  }
});
