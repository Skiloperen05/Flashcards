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

// TEMPORARY: SAM2 and SAM3 have swapped links for a live payment test.
// The ...3F602 link (created for SAM2) charges the 3 kr test price and the
// ...3F603 link (created for SAM3) charges the normal 49 kr. Entitlements
// are still granted for the right subject because the webhook reads the
// subject from client_reference_id, but the Stripe checkout page shows the
// product name of the link. Swap back after the test.
const PAYMENT_LINKS: Record<string, string> = {
  RET14: 'https://buy.stripe.com/eVq00k2M0bjBdWSd9s3F600',
  SOL1: 'https://buy.stripe.com/14AbJ286k1J14mi2uO3F601',
  SAM2: 'https://buy.stripe.com/cNi5kE3Q40EX062glE3F603',
  SAM3: 'https://buy.stripe.com/4gM4gAdqEdrJdWS6L43F602',
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

function paymentLinkUrl(user: { id?: string; email?: string }, subjectCode: string) {
  if (!user.id) throw new Error('Kunne ikke lese bruker.');

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

    return json(req, 200, { url: paymentLinkUrl(user, subjectCode) });
  } catch (error) {
    return json(req, 400, { error: error instanceof Error ? error.message : 'Kunne ikke starte betaling.' });
  }
});
