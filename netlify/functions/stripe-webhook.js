const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qnwjhheoekpqqqhevztw.supabase.co';
const TOLERANCE_SECONDS = 300;

function response(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify(body) };
}

function rawBody(event) {
  return event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
}

function verifySignature(payload, signatureHeader) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET mangler.');
  const parts = String(signatureHeader || '').split(',').reduce((acc, part) => {
    const index = part.indexOf('=');
    if (index > -1) {
      const key = part.slice(0, index);
      const value = part.slice(index + 1);
      if (!acc[key]) acc[key] = [];
      acc[key].push(value);
    }
    return acc;
  }, {});
  const timestamp = Number(parts.t && parts.t[0]);
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE_SECONDS) {
    throw new Error('Ugyldig Stripe-signatur.');
  }
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  const valid = (parts.v1 || []).some((candidate) => {
    var a = Buffer.from(candidate, 'hex');
    var b = Buffer.from(expected, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
  if (!valid) throw new Error('Ugyldig Stripe-signatur.');
}

function code(value) {
  return String(value || '').toUpperCase().replace(/[\s-]+/g, '');
}

async function grantEntitlement(session) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY mangler.');

  const subjectCode = code(session.metadata && session.metadata.subject_code);
  const userId = session.metadata && session.metadata.user_id;
  if (!subjectCode || !userId) throw new Error('Stripe-session mangler entitlement-metadata.');

  const row = {
    user_id: userId,
    subject_code: subjectCode,
    source: 'stripe',
    stripe_checkout_session_id: session.id || null,
    stripe_customer_id: session.customer || null,
    amount_paid: session.amount_total || null,
    currency: session.currency || null
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/subject_entitlements?on_conflict=user_id,subject_code`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal'
    },
    body: JSON.stringify(row)
  });
  if (!response.ok) throw new Error(`Kunne ikke lagre fagtilgang (${response.status}).`);
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed' });

  const payload = rawBody(event);
  try {
    verifySignature(payload, event.headers['stripe-signature'] || event.headers['Stripe-Signature']);
    const stripeEvent = JSON.parse(payload);
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data && stripeEvent.data.object;
      if (session && session.payment_status === 'paid') await grantEntitlement(session);
    }
    return response(200, { received: true });
  } catch (error) {
    return response(400, { error: error.message || 'Webhook failed' });
  }
};
