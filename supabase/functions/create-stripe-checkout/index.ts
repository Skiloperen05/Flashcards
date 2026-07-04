import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://qnwjhheoekpqqqhevztw.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJpc3MiOiJIUzI1NiIsInJlZiI6Im" + "Fud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0",
  "gHBvEH" + "-L-zyiW4" + "UnsCxOY2q" + "-HmeIYe5" + "OHSvxhFt7PQ8",
].join(".");
const STRIPE_API_VERSION = "2026-02-25.clover";
const DEFAULT_SITE_URL = "https://bhflashcards.no";
const DEFAULT_PRICE_NOK_ORE = 4900;

const SUBJECTS: Record<string, string> = {
  RET14: "Skatterett",
  SOL1: "Organisasjonsatferd",
  SAM2: "Mikroøkonomi",
  SAM3: "Makroøkonomi",
  MET2: "Metode",
  MAT10: "Matematikk",
  SAM1A: "Mikroøkonomi intro",
  MET1: "Matematikk for økonomer",
  KOM1: "Kommunikasjon",
  RET1A: "Juridiske emner",
  BED1: "Bedriftsøkonomi",
};

const ALL_SUBJECT_CODES = Object.keys(SUBJECTS);

type ProductKind = "subject" | "bundle" | "pass";

type CheckoutProduct = {
  id: string;
  kind: ProductKind;
  name: string;
  description: string;
  unitAmount: number;
  subjectCodes: string[];
  source: string;
};

type DiscountCode = {
  code: string;
  label?: string;
  percent_off?: number | null;
  amount_off_nok_ore?: number | null;
};

function envAmount(name: string, fallback: number) {
  return Number(Deno.env.get(name) || fallback);
}

const BUNDLE_PRODUCTS: Record<string, CheckoutProduct> = {
  "semester-1": {
    id: "semester-1",
    kind: "bundle",
    name: "1. semesterpakke",
    description: "RET1A, MET1, SAM1A, BED1 og KOM1 samlet.",
    unitAmount: envAmount("SEMESTER_1_BUNDLE_PRICE_NOK_ORE", 19900),
    subjectCodes: ["RET1A", "MET1", "SAM1A", "BED1", "KOM1"],
    source: "stripe_bundle",
  },
  "semester-2": {
    id: "semester-2",
    kind: "bundle",
    name: "2. semesterpakke",
    description: "MET2, SAM2 og SOL1 samlet.",
    unitAmount: envAmount("SEMESTER_2_BUNDLE_PRICE_NOK_ORE", 14900),
    subjectCodes: ["MET2", "SAM2", "SOL1"],
    source: "stripe_bundle",
  },
  "valgfag": {
    id: "valgfag",
    kind: "bundle",
    name: "Valgfagspakke",
    description: "RET14, MAT10 og SAM3 samlet.",
    unitAmount: envAmount("ELECTIVES_BUNDLE_PRICE_NOK_ORE", 17900),
    subjectCodes: ["RET14", "MAT10", "SAM3"],
    source: "stripe_bundle",
  },
  "vennepass": {
    id: "vennepass",
    kind: "pass",
    name: "Vennepass",
    description: "All-access til alle fag som ligger ute nå og nye fag som publiseres senere.",
    unitAmount: envAmount("FRIEND_PASS_PRICE_NOK_ORE", 35000),
    subjectCodes: ALL_SUBJECT_CODES,
    source: "stripe_friend_pass",
  },
};

const exactAllowedOrigins = new Set([
  "https://bhflashcards.no",
  "https://www.bhflashcards.no",
  "https://skiloperen05.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
]);

function isAllowedOrigin(origin: string) {
  if (exactAllowedOrigins.has(origin)) return true;

  try {
    const hostname = new URL(origin).hostname;
    return hostname === "bhflashcards.pages.dev" ||
      hostname.endsWith(".bhflashcards.pages.dev") ||
      hostname === "bhflashcards-no.pages.dev" ||
      hostname.endsWith(".bhflashcards-no.pages.dev");
  } catch (_error) {
    return false;
  }
}

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = isAllowedOrigin(origin) ? origin : DEFAULT_SITE_URL;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(req),
  });
}

function code(value: unknown) {
  return String(value || "").toUpperCase().replace(/[\s-]+/g, "");
}

function productId(value: unknown) {
  return String(value || "").toLowerCase().trim().replace(/[^a-z0-9-]+/g, "");
}

function bearerToken(req: Request) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

function serviceRoleKey() {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  const modernKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (modernKeys) {
    try {
      const parsed = JSON.parse(modernKeys);
      if (parsed?.default) return String(parsed.default);
    } catch (_error) {}
  }

  const singleKey = Deno.env.get("SUPABASE_SECRET_KEY");
  if (singleKey) return singleKey;

  throw new Error("Supabase admin-nøkkel mangler.");
}

function adminHeaders(extra?: Record<string, string>) {
  const key = serviceRoleKey();
  const headers: Record<string, string> = { apikey: key, ...(extra || {}) };

  if (!key.startsWith("sb_secret_")) {
    headers.Authorization = `Bearer ${key}`;
  }

  return headers;
}

async function privateConfig(key: string) {
  const params = new URLSearchParams({ key: `eq.${key}`, select: "value", limit: "1" });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/app_private_config?${params.toString()}`, {
    headers: adminHeaders(),
  });

  if (!response.ok) return null;
  const rows = await response.json();
  const value = Array.isArray(rows) && rows[0]?.value;
  return value ? String(value) : null;
}

async function stripeSecretKey() {
  return Deno.env.get("STRIPE_SECRET_KEY") || (await privateConfig("STRIPE_SECRET_KEY"));
}

async function subjectPriceOre(subjectCode: string) {
  const params = new URLSearchParams({
    subject_code: `eq.${subjectCode}`,
    select: "price_nok_ore",
    limit: "1",
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/subject_prices?${params.toString()}`, {
    headers: adminHeaders(),
  });

  if (!response.ok) return DEFAULT_PRICE_NOK_ORE;
  const rows = await response.json();
  const price = Array.isArray(rows) && Number(rows[0]?.price_nok_ore);
  return price && price > 0 ? price : DEFAULT_PRICE_NOK_ORE;
}

async function productPriceOre(product: CheckoutProduct) {
  if (product.kind === "subject") return product.unitAmount;

  const params = new URLSearchParams({
    product_id: `eq.${product.id}`,
    select: "price_nok_ore,active",
    limit: "1",
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/commerce_products?${params.toString()}`, {
    headers: adminHeaders(),
  });

  if (!response.ok) return product.unitAmount;
  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return product.unitAmount;
  if (row.active === false) throw new Error("Produktet er ikke aktivt akkurat nå.");

  const price = Number(row.price_nok_ore);
  return price >= 0 ? price : product.unitAmount;
}

async function commerceProduct(productIdValue: string) {
  const id = productId(productIdValue);
  if (!id) return null;

  const params = new URLSearchParams({
    product_id: `eq.${id}`,
    select: "product_id,label,product_kind,subject_codes,description,price_nok_ore,active",
    limit: "1",
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/commerce_products?${params.toString()}`, {
    headers: adminHeaders(),
  });

  if (!response.ok) return null;
  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;
  if (row.active === false) throw new Error("Produktet er ikke aktivt akkurat nå.");

  const subjectCodes = Array.isArray(row.subject_codes)
    ? row.subject_codes.map(code).filter(Boolean)
    : [];
  const kind = row.product_kind === "pass" ? "pass" : "bundle";
  const codes = kind === "pass" && !subjectCodes.length ? ALL_SUBJECT_CODES : subjectCodes;
  if (!codes.length) throw new Error("Produktet mangler fag.");

  return {
    id: row.product_id,
    kind,
    name: row.label || row.product_id,
    description: row.description || "Tilgang til fagpakke på Haugnes Flashcards.",
    unitAmount: Number(row.price_nok_ore),
    subjectCodes: codes,
    source: kind === "pass" ? "stripe_friend_pass" : "stripe_bundle",
  } satisfies CheckoutProduct;
}

async function discountFromCode(rawCode: unknown) {
  const normalized = String(rawCode || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!normalized) return null;

  const params = new URLSearchParams({
    code: `eq.${normalized}`,
    select: "code,label,percent_off,amount_off_nok_ore,active,expires_at,max_redemptions,redeemed_count",
    limit: "1",
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/discount_codes?${params.toString()}`, {
    headers: adminHeaders(),
  });

  if (!response.ok) throw new Error("Kunne ikke sjekke rabattkode.");
  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row || row.active === false) throw new Error("Rabattkoden er ikke gyldig.");
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) throw new Error("Rabattkoden er utløpt.");
  if (row.max_redemptions && Number(row.redeemed_count || 0) >= Number(row.max_redemptions)) {
    throw new Error("Rabattkoden er brukt opp.");
  }

  return {
    code: normalized,
    label: row.label || normalized,
    percent_off: row.percent_off == null ? null : Number(row.percent_off),
    amount_off_nok_ore: row.amount_off_nok_ore == null ? null : Number(row.amount_off_nok_ore),
  } satisfies DiscountCode;
}

function applyDiscount(unitAmount: number, discount: DiscountCode | null) {
  if (!discount) return unitAmount;
  let discounted = unitAmount;
  if (discount.percent_off) discounted = Math.round(unitAmount * (100 - discount.percent_off) / 100);
  if (discount.amount_off_nok_ore) discounted = unitAmount - discount.amount_off_nok_ore;
  return Math.max(0, discounted);
}

async function getUser(accessToken: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) throw new Error("Du må være logget inn for å kjøpe fag.");
  return response.json();
}

async function getEntitledCodes(userId: string) {
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    select: "subject_code",
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/subject_entitlements?${params.toString()}`, {
    headers: adminHeaders(),
  });

  if (!response.ok) throw new Error("Kunne ikke sjekke fagtilgang.");
  const rows = await response.json();
  return Array.isArray(rows) ? rows.map((row) => code(row.subject_code)) : [];
}

async function getProfile(userId: string) {
  const params = new URLSearchParams({
    id: `eq.${userId}`,
    select: "is_admin,is_friend",
  });

  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?${params.toString()}`, {
    headers: adminHeaders(),
  });

  if (!response.ok) throw new Error("Kunne ikke sjekke profil.");
  const rows = await response.json();
  return Array.isArray(rows) && rows[0] ? rows[0] as { is_admin?: boolean; is_friend?: boolean } : {};
}

async function productFromPayload(payload: Record<string, unknown>) {
  const requestedProductId = productId(payload.productId || payload.bundleCode);
  const managedProduct = await commerceProduct(requestedProductId);
  if (managedProduct) return managedProduct;

  const bundle = BUNDLE_PRODUCTS[requestedProductId];
  if (bundle) return { ...bundle, unitAmount: await productPriceOre(bundle) };

  const subjectCode = code(payload.subjectCode);
  const subjectName = SUBJECTS[subjectCode];
  if (!subjectName) return null;

  return {
    id: `subject-${subjectCode.toLowerCase()}`,
    kind: "subject",
    name: `${subjectCode} · ${subjectName}`,
    description: "Tilgang til alt innhold i faget på Haugnes Flashcards.",
    unitAmount: await subjectPriceOre(subjectCode),
    subjectCodes: [subjectCode],
    source: "stripe",
  } satisfies CheckoutProduct;
}

function isProductOwned(product: CheckoutProduct, ownedCodes: string[], profile: { is_admin?: boolean; is_friend?: boolean }) {
  if (profile.is_admin || profile.is_friend) return true;
  return product.subjectCodes.every((subjectCode) => ownedCodes.includes(subjectCode));
}

function siteUrl(req: Request) {
  const origin = req.headers.get("origin") || "";
  return isAllowedOrigin(origin) ? origin : DEFAULT_SITE_URL;
}

async function createCheckoutSession(req: Request, user: { id?: string; email?: string }, product: CheckoutProduct, discount: DiscountCode | null) {
  const secretKey = await stripeSecretKey();
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY mangler.");
  if (!user.id) throw new Error("Kunne ikke lese bruker.");

  const baseUrl = siteUrl(req);
  const finalAmount = applyDiscount(product.unitAmount, discount);
  if (finalAmount < 100) throw new Error("Rabattkoden gjør beløpet for lavt for Stripe-betaling.");
  const successQuery = product.kind === "subject"
    ? `fag=${encodeURIComponent(product.subjectCodes[0])}`
    : `produkt=${encodeURIComponent(product.id)}`;
  const cancelQuery = product.kind === "subject"
    ? `fag=${encodeURIComponent(product.subjectCodes[0])}`
    : `produkt=${encodeURIComponent(product.id)}`;
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "nok");
  params.set("line_items[0][price_data][unit_amount]", String(finalAmount));
  params.set("line_items[0][price_data][product_data][name]", product.name);
  params.set("line_items[0][price_data][product_data][description]", product.description);
  params.set("success_url", `${baseUrl}/user/butikk.html?payment=success&${successQuery}&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${baseUrl}/user/butikk.html?payment=cancel&${cancelQuery}`);
  params.set("client_reference_id", user.id);
  if (user.email) params.set("customer_email", user.email);
  params.set("metadata[user_id]", user.id);
  params.set("metadata[product_id]", product.id);
  params.set("metadata[product_kind]", product.kind);
  params.set("metadata[subject_codes]", product.subjectCodes.join(","));
  params.set("metadata[source]", product.source);
  params.set("metadata[original_amount]", String(product.unitAmount));
  params.set("metadata[final_amount]", String(finalAmount));
  if (discount) {
    params.set("metadata[discount_code]", discount.code);
    params.set("metadata[discount_label]", discount.label || discount.code);
  }
  if (product.kind === "subject") params.set("metadata[subject_code]", product.subjectCodes[0]);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": STRIPE_API_VERSION,
    },
    body: params,
  });

  const session = await response.json();
  if (!response.ok) {
    throw new Error(session?.error?.message || "Kunne ikke starte betaling.");
  }

  return session;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return json(req, 405, { error: "Method not allowed" });
  }

  try {
    const accessToken = bearerToken(req);
    if (!accessToken) throw new Error("Du må være logget inn for å kjøpe fag.");

    const payload = await req.json().catch(() => ({}));
    const product = await productFromPayload(payload as Record<string, unknown>);
    if (!product) throw new Error("Ukjent produkt.");
    const discount = await discountFromCode((payload as Record<string, unknown>).discountCode);

    const user = await getUser(accessToken);
    if (!user?.id) throw new Error("Kunne ikke lese bruker.");

    const [ownedCodes, profile] = await Promise.all([getEntitledCodes(user.id), getProfile(user.id)]);
    if (isProductOwned(product, ownedCodes, profile)) {
      return json(req, 409, { error: "Du har allerede tilgang til dette produktet." });
    }

    const session = await createCheckoutSession(req, user, product, discount);
    return json(req, 200, { url: session.url });
  } catch (error) {
    return json(req, 400, { error: error instanceof Error ? error.message : "Kunne ikke starte betaling." });
  }
});
