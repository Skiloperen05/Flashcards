import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://qnwjhheoekpqqqhevztw.supabase.co";
const TOLERANCE_SECONDS = 300;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function code(value: unknown) {
  return String(value || "").toUpperCase().replace(/[\s-]+/g, "");
}

function codesFromMetadata(metadata: Record<string, unknown>) {
  const subjectCodes = String(metadata.subject_codes || "")
    .split(",")
    .map(code)
    .filter(Boolean);
  const single = code(metadata.subject_code);
  const all = subjectCodes.length ? subjectCodes : single ? [single] : [];
  return all.filter((subjectCode, index, arr) => arr.indexOf(subjectCode) === index);
}

function parseStripeSignature(header: string) {
  const parts = new Map<string, string[]>();

  for (const part of header.split(",")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index);
    const value = part.slice(index + 1);
    const values = parts.get(key) || [];
    values.push(value);
    parts.set(key, values);
  }

  return parts;
}

function hexToBytes(hex: string) {
  if (!/^[\da-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifySignature(payload: string, signatureHeader: string | null) {
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET mangler.");

  const parts = parseStripeSignature(signatureHeader || "");
  const timestamp = Number(parts.get("t")?.[0]);
  const signatures = parts.get("v1") || [];

  if (!timestamp || signatures.length === 0 || Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) {
    throw new Error("Ugyldig Stripe-signatur.");
  }

  const expected = hexToBytes(await hmacSha256Hex(secret, `${timestamp}.${payload}`));
  if (!expected) throw new Error("Ugyldig Stripe-signatur.");

  const isValid = signatures.some((candidate) => {
    const received = hexToBytes(candidate);
    return received ? timingSafeEqual(received, expected) : false;
  });

  if (!isValid) throw new Error("Ugyldig Stripe-signatur.");
}

async function grantSubjectEntitlements(session: Record<string, unknown>, userId: string, subjectCodes: string[], source: string) {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY mangler.");

  const rows = subjectCodes.map((subjectCode) => ({
    user_id: userId,
    subject_code: subjectCode,
    source,
    stripe_checkout_session_id: session.id || null,
    stripe_customer_id: session.customer || null,
    amount_paid: session.amount_total || null,
    currency: session.currency || null,
  }));

  const response = await fetch(`${SUPABASE_URL}/rest/v1/subject_entitlements?on_conflict=user_id,subject_code`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) throw new Error(`Kunne ikke lagre fagtilgang (${response.status}).`);
}

async function grantFriendPass(userId: string) {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY mangler.");

  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ is_friend: true }),
  });

  if (!response.ok) throw new Error(`Kunne ikke aktivere Vennepass (${response.status}).`);
}

async function grantPurchase(session: Record<string, unknown>) {
  const metadata = (session.metadata || {}) as Record<string, unknown>;
  const userId = String(metadata.user_id || "");
  const subjectCodes = codesFromMetadata(metadata);
  const productKind = String(metadata.product_kind || "subject");
  const source = String(metadata.source || (productKind === "bundle" ? "stripe_bundle" : "stripe"));

  if (!userId || !subjectCodes.length) throw new Error("Stripe-session mangler kjøpsmetadata.");

  await grantSubjectEntitlements(session, userId, subjectCodes, source);
  if (productKind === "pass") await grantFriendPass(userId);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const payload = await req.text();

  try {
    await verifySignature(payload, req.headers.get("stripe-signature"));
    const stripeEvent = JSON.parse(payload);

    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data?.object;
      if (session?.payment_status === "paid") await grantPurchase(session);
    }

    return json(200, { received: true });
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : "Webhook failed" });
  }
});
