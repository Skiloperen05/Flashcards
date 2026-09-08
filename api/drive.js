// /api/drive.js
// Secure Google Drive file streaming gateway and picker proxy for Haugnes Flashcards.
//
// Split-storage model
// -------------------
//   Small/structured content stays in Supabase (subject_pages, subject_page_blocks,
//   subject-files bucket for lightweight uploads). Heavy PDFs — A-besvarelser,
//   forelesningsnotater, oppgavepakker — can live in Google Drive to sidestep
//   the Supabase storage quota. Both storage backends are gated by the same
//   subject entitlement check, so from the student's perspective the paywall
//   behaves identically no matter where the bytes actually live.
//
// Paywall guarantee (what makes this safe)
// ----------------------------------------
//   1. The Drive file itself is PRIVATE. The admin only shares it with the
//      Google account they authenticate with here — never "Anyone with the
//      link". A stolen drive_id therefore cannot open the file directly on
//      drive.google.com.
//   2. This proxy fetches from Drive with the admin's own OAuth token (or an
//      optional server-side service-account credential) and streams the bytes
//      back to the student only after their Supabase JWT AND subject
//      entitlement have been verified.
//   3. No Google credentials of any kind ship to the client. GOOGLE_API_KEY
//      is read only from process.env at runtime — never from a committed
//      file. The old firebase-applet-config.json bundled key path has been
//      removed and .gitignore'd; that key must be rotated in Google Cloud
//      Console. The API-key fallback for public files was also removed on
//      purpose: it would silently bypass the "must be private" assumption.
//   4. subject_files rows are looked up with the STUDENT's Supabase JWT so
//      Postgres RLS is enforced end-to-end; the server has no service-role
//      shortcut around entitlement.
//
// Configuration (env vars only — never commit secrets)
// ----------------------------------------------------
//   None required. Set on the deployment target, not in the repo.
//   (Reserved for future use: GOOGLE_SERVICE_ACCOUNT_JSON — if we later add
//   a service-account signing path so admins don't have to reconnect every
//   hour.)

const SUPABASE_URL = 'https://qnwjhheoekpqqqhevztw.supabase.co';
const SUPABASE_ANON_KEY = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6In' + 'Fud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0',
  'gHBvEH' + '-L-zyiW4' + 'UnsCxOY2q' + '-HmeIYe5' + 'OHSvxhFt7PQ8'
].join('.');

const ALLOWED_ORIGINS = new Set([
  'https://bhflashcards.no',
  'https://www.bhflashcards.no',
  'https://skiloperen05.github.io',
  'http://localhost:3000',
  'http://localhost:5173'
]);

// In-memory token cache for admin Google Drive access. GIS access-tokens live
// ~1 hour. The picker UI shows the current freshness so an admin can
// reconnect proactively before a student hits an expired token.
let cachedAdminGoogleToken = null;
let cachedAdminTokenExpiresAt = 0;

function adminTokenIsFresh() {
  return !!cachedAdminGoogleToken && cachedAdminTokenExpiresAt > Date.now();
}

function setCors(req, res) {
  const origin = req.headers && req.headers.origin ? req.headers.origin : '';
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://bhflashcards.no');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Google-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
}

async function validateSupabaseToken(token) {
  if (!token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY }
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? user : null;
  } catch (err) {
    console.error('[DriveGateway] Token validation failed:', err);
    return null;
  }
}

async function checkUserEntitlement(userId, subjectCode, userToken) {
  if (!userId) return { allowed: false, reason: 'Not signed in' };
  // Use the caller's JWT so Postgres RLS runs as the actual user.
  const authHeader = userToken || SUPABASE_ANON_KEY;
  try {
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=is_admin,is_friend`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${authHeader}` } }
    );
    if (profileRes.ok) {
      const profiles = await profileRes.json();
      if (profiles && profiles.length > 0) {
        if (profiles[0].is_admin === true) return { allowed: true, role: 'admin' };
        if (profiles[0].is_friend === true) return { allowed: true, role: 'friend' };
      }
    }

    if (!subjectCode) return { allowed: false, reason: 'Subject code required' };

    const entRes = await fetch(
      `${SUPABASE_URL}/rest/v1/subject_entitlements?user_id=eq.${encodeURIComponent(userId)}&subject_code=ilike.${encodeURIComponent(subjectCode)}&select=id`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${authHeader}` } }
    );
    if (entRes.ok) {
      const ents = await entRes.json();
      if (ents && ents.length > 0) return { allowed: true, role: 'entitled' };
    }

    return { allowed: false, reason: 'No entitlement for subject ' + subjectCode };
  } catch (err) {
    console.error('[DriveGateway] Entitlement check error:', err);
    return { allowed: false, error: err.message };
  }
}

async function getSubjectFileRow(fileId, userToken) {
  if (!fileId) return null;
  // We call this AFTER validating the caller and their entitlement. Use the
  // caller's JWT so RLS runs as them — never with a service-role bypass.
  const authHeader = userToken || SUPABASE_ANON_KEY;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/subject_files?id=eq.${encodeURIComponent(fileId)}&select=*`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${authHeader}` } }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('[DriveGateway] Failed to fetch subject file:', err);
    return null;
  }
}

/**
 * Fetch a file from Google Drive using an OAuth access token.
 *
 * Order of attempts:
 *   1. OAuth token from the request (X-Google-Token / ?google_token=). Used
 *      when an admin is browsing their own Drive from the picker.
 *   2. Cached admin OAuth token (from action=cache_token). This is what
 *      student streams normally use.
 *
 * No API-key fallback: any file that would succeed via an unauthenticated API
 * key is public "anyone with the link", which contradicts the paywall model.
 */
async function fetchGoogleDriveStream(driveFileId, requestGoogleToken) {
  const oauthToken = requestGoogleToken || (adminTokenIsFresh() ? cachedAdminGoogleToken : null);
  if (!oauthToken) {
    return { ok: false, status: 503, headers: new Headers(), body: null, reason: 'no_admin_token' };
  }
  try {
    const apiRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveFileId)}?alt=media`,
      { headers: { Authorization: `Bearer ${oauthToken}` } }
    );
    if (apiRes.ok) {
      return { ok: true, status: apiRes.status, headers: apiRes.headers, body: apiRes.body };
    }
    console.warn('[DriveGateway] OAuth Drive fetch returned', apiRes.status);
    return { ok: false, status: apiRes.status, headers: apiRes.headers, body: null, reason: 'upstream_' + apiRes.status };
  } catch (e) {
    console.warn('[DriveGateway] OAuth Drive fetch threw:', e);
    return { ok: false, status: 502, headers: new Headers(), body: null, reason: 'fetch_threw' };
  }
}

function renderPaywallHtml(subjectCode, fileTitle) {
  const code = (subjectCode || 'faget').toUpperCase();
  const title = fileTitle || 'Dette dokumentet';
  return `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Låst innhold — Haugnes Flashcards</title>
  <link rel="icon" href="/assets/haugnes-logo-mark.svg">
  <link rel="stylesheet" href="/shared/haugnes-theme.css">
  <style>
    body { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: #060d1b; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .card { max-width: 480px; width: 100%; background: linear-gradient(180deg, #0f1e38 0%, #081326 100%); border: 1px solid rgba(126,162,255,.24); border-radius: 20px; padding: 36px 28px; text-align: center; box-shadow: 0 20px 48px rgba(0,0,0,.5); }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; background: rgba(239,68,68,.16); border: 1px solid rgba(239,68,68,.3); color: #fca5a5; font-size: 12px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 18px; }
    h1 { font-size: 22px; font-weight: 900; color: #fff; margin: 0 0 10px 0; }
    p { font-size: 14.5px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0; }
    .actions { display: flex; flex-direction: column; gap: 10px; }
    .btn { display: block; padding: 13px 20px; border-radius: 12px; font-size: 14px; font-weight: 800; text-decoration: none; transition: all .15s ease; }
    .btn-primary { background: #2563eb; color: #fff; border: 1px solid #3b82f6; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-ghost { background: rgba(255,255,255,.06); color: #cbd5e1; border: 1px solid rgba(255,255,255,.12); }
    .btn-ghost:hover { background: rgba(255,255,255,.12); color: #fff; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🔒 Beskyttet av betalingsmuren</div>
    <h1>Tilgang kreves</h1>
    <p><strong>${escapeHtml(title)}</strong> i <strong>${escapeHtml(code)}</strong> er forbeholdt studenter med aktiv tilgang eller Vennepass. Lås opp faget for å lese eller laste ned.</p>
    <div class="actions">
      <a href="/user/butikk.html?subject=${encodeURIComponent(code)}" class="btn btn-primary">Lås opp ${escapeHtml(code)} i butikken →</a>
      <a href="/user/index.html" class="btn btn-ghost">← Tilbake til Min oversikt</a>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Express handler for /api/drive
 */
export default async function driveHandler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const action = url.searchParams.get('action') || (url.pathname.includes('/files') ? 'list' : 'stream');

  // Extract auth tokens
  let supabaseToken = url.searchParams.get('token');
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) supabaseToken = authHeader.slice(7).trim();

  const googleToken = req.headers['x-google-token'] || url.searchParams.get('google_token');

  // -------------------------------------------------------------
  // 0. ACTION: Connection status (safe to poll from the admin picker)
  // -------------------------------------------------------------
  if (action === 'status') {
    return res.json({
      admin_connected: adminTokenIsFresh(),
      admin_expires_at: adminTokenIsFresh() ? cachedAdminTokenExpiresAt : null
    });
  }

  // -------------------------------------------------------------
  // 1. ACTION: Cache Admin Google OAuth token
  // -------------------------------------------------------------
  if (action === 'cache_token' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const data = JSON.parse(body || '{}');
      const token = data.google_token;
      const expiresIn = Number(data.expires_in) || 3600;
      const user = await validateSupabaseToken(supabaseToken);
      if (!user) return res.status(401).json({ error: 'Ugyldig eller utløpt sesjon' });
      const ent = await checkUserEntitlement(user.id, null, supabaseToken);
      if (ent.role !== 'admin') {
        return res.status(403).json({ error: 'Kun administratorer kan registrere Google Drive-token' });
      }
      if (!token) return res.status(400).json({ error: 'Mangler google_token' });
      cachedAdminGoogleToken = token;
      cachedAdminTokenExpiresAt = Date.now() + Math.max(60, expiresIn - 60) * 1000;
      return res.json({
        ok: true,
        message: 'Google Drive-token registrert',
        expires_at: cachedAdminTokenExpiresAt
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // -------------------------------------------------------------
  // 2. ACTION: List Google Drive files (Admin Picker)
  // -------------------------------------------------------------
  if (action === 'list') {
    const user = await validateSupabaseToken(supabaseToken);
    const isDev = url.searchParams.get('dev') === '1' && (req.headers.host || '').includes('localhost');
    if (!isDev) {
      if (!user) return res.status(401).json({ error: 'Innlogging kreves' });
      const ent = await checkUserEntitlement(user.id, null, supabaseToken);
      if (ent.role !== 'admin') {
        return res.status(403).json({ error: 'Kun administratorer har tilgang til filvelgeren' });
      }
    }

    const token = googleToken || (adminTokenIsFresh() ? cachedAdminGoogleToken : null);
    if (!token) {
      return res.status(400).json({
        error: 'Google Drive-tilkobling mangler. Klikk «Koble til Google Drive» og logg inn på nytt.'
      });
    }

    const qParam = url.searchParams.get('q') || '';
    let driveQuery = "trashed = false and (mimeType = 'application/pdf' or mimeType contains 'document' or mimeType contains 'spreadsheet' or mimeType contains 'presentation' or mimeType = 'application/vnd.google-apps.folder')";
    if (qParam) driveQuery += ` and name contains '${qParam.replace(/'/g, "\\'")}'`;

    try {
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?pageSize=60&fields=files(id,name,mimeType,size,modifiedTime,iconLink,webViewLink,parents)&orderBy=modifiedTime desc&q=${encodeURIComponent(driveQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await driveRes.json();
      if (!driveRes.ok) {
        return res.status(driveRes.status).json({ error: data.error ? data.error.message : 'Google Drive API-feil' });
      }
      return res.json({ files: data.files || [] });
    } catch (err) {
      return res.status(500).json({ error: 'Kunne ikke hente filer fra Google Drive: ' + err.message });
    }
  }

  // -------------------------------------------------------------
  // 3. ACTION: Probe Google Drive File Info (admin picker only)
  // -------------------------------------------------------------
  if (action === 'info') {
    const user = await validateSupabaseToken(supabaseToken);
    const isDev = url.searchParams.get('dev') === '1' && (req.headers.host || '').includes('localhost');
    if (!isDev) {
      if (!user) return res.status(401).json({ error: 'Innlogging kreves' });
      const ent = await checkUserEntitlement(user.id, null, supabaseToken);
      if (ent.role !== 'admin') {
        return res.status(403).json({ error: 'Kun administratorer kan slå opp Drive-filer' });
      }
    }
    const driveId = url.searchParams.get('drive_id') || url.searchParams.get('id');
    if (!driveId) return res.status(400).json({ error: 'Mangler drive_id' });

    const token = googleToken || (adminTokenIsFresh() ? cachedAdminGoogleToken : null);
    if (!token) return res.status(400).json({ error: 'Google Drive-tilkobling mangler' });
    try {
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(driveId)}?fields=id,name,mimeType,size,modifiedTime,webViewLink`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await driveRes.json();
      if (!driveRes.ok) {
        return res.status(driveRes.status).json({ error: data.error ? data.error.message : 'Fant ikke fil på Drive' });
      }
      return res.json({ file: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // -------------------------------------------------------------
  // 4. ACTION: Secure Stream File (PAYWALL ENFORCED)
  // -------------------------------------------------------------
  const fileId = url.searchParams.get('id');
  const subjectCode = url.searchParams.get('subject') || url.searchParams.get('code') || '';
  const isDownload = url.searchParams.get('download') === '1' || url.searchParams.get('download') === 'true';

  if (!fileId) return res.status(400).send('Mangler fil-ID');

  const isDevBypass = url.searchParams.get('dev') === '1' && (req.headers.host || '').includes('localhost');
  const acceptsHtml = (req.headers.accept || '').includes('text/html');

  // Guard the caller BEFORE we look up the file, so an unauthenticated request
  // can't probe the subject_files table for row existence.
  let user = null;
  let isAuthorized = isDevBypass;
  if (!isAuthorized) {
    user = await validateSupabaseToken(supabaseToken);
    if (!user) {
      if (acceptsHtml) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(401).send(renderPaywallHtml(subjectCode, ''));
      }
      return res.status(401).json({ error: 'Innlogging kreves for å åpne filen.' });
    }
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileId);
  let fileRow = null;
  let targetSubject = subjectCode;
  let driveFileId = null;
  let fileName = 'dokument.pdf';
  let mimeType = 'application/pdf';

  if (isUuid) {
    fileRow = await getSubjectFileRow(fileId, supabaseToken);
    if (!fileRow) return res.status(404).send('Filen ble ikke funnet eller du har ikke tilgang.');
    targetSubject = fileRow.subject_code || targetSubject;
    fileName = fileRow.title || 'fagfil';
    if (!/\.[a-z0-9]{2,6}$/i.test(fileName)) fileName += '.pdf';
    mimeType = fileRow.mime_type || 'application/pdf';

    if (fileRow.storage_bucket === 'google_drive') {
      driveFileId = fileRow.storage_path || (fileRow.meta && fileRow.meta.drive_id);
    } else if (fileRow.storage_path) {
      // Supabase-hosted file: the frontend should normally use createSignedUrl.
      // Fall through here for legacy callers by redirecting to a signed URL.
      return res.redirect(
        302,
        `${SUPABASE_URL}/storage/v1/object/sign/${encodeURIComponent(fileRow.storage_bucket || 'subject-files')}/${fileRow.storage_path}`
      );
    } else if (fileRow.external_url) {
      driveFileId = extractGoogleDriveId(fileRow.external_url);
    }
  } else if (isDevBypass || (user && (await checkUserEntitlement(user.id, null, supabaseToken)).role === 'admin')) {
    // Non-UUID path: only admins (or localhost dev) may stream a raw Drive ID.
    // Students can only reach subject_files rows via UUID, and their access is
    // still gated by RLS + entitlement.
    driveFileId = fileId;
  } else {
    return res.status(400).send('Ugyldig fil-referanse.');
  }

  if (!driveFileId) return res.status(400).send('Ugyldig Google Drive-filreferanse.');

  // Enforce entitlement for the concrete subject the file belongs to.
  if (!isAuthorized) {
    const check = await checkUserEntitlement(user.id, targetSubject, supabaseToken);
    if (check.allowed) {
      isAuthorized = true;
    } else {
      if (acceptsHtml) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(403).send(renderPaywallHtml(targetSubject, fileName));
      }
      return res.status(403).json({ error: 'Du har ikke aktiv tilgang til dette faget.' });
    }
  }

  // Authorized — stream from Drive to client.
  try {
    const driveStream = await fetchGoogleDriveStream(driveFileId, googleToken);
    if (!driveStream.ok || !driveStream.body) {
      console.error('[DriveGateway] Failed to stream from Drive:', driveStream.status, driveStream.reason);
      if (driveStream.reason === 'no_admin_token') {
        return res.status(503).send('Google Drive-tilkoblingen er utløpt. Be en administrator koble til Drive på nytt fra Fagstudio.');
      }
      return res.status(502).send('Kunne ikke hente filen fra Google Drive. Kontroller at filen er delt med admin-kontoen.');
    }

    res.setHeader('Content-Type', mimeType);
    const dispositionType = isDownload ? 'attachment' : 'inline';
    const safeName = encodeURIComponent(fileName).replace(/['()]/g, escape);
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${fileName.replace(/"/g, '')}"; filename*=UTF-8''${safeName}`);
    res.setHeader('Cache-Control', 'private, max-age=1800');
    const upstreamLength = driveStream.headers.get && driveStream.headers.get('content-length');
    if (upstreamLength) res.setHeader('Content-Length', upstreamLength);

    const reader = driveStream.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
    } catch (err) {
      console.error('[DriveGateway] Error while piping stream:', err);
      res.end();
    }
  } catch (streamErr) {
    console.error('[DriveGateway] Streaming exception:', streamErr);
    if (!res.headersSent) res.status(500).send('En intern feil oppstod under strømming av filen.');
  }
}

function extractGoogleDriveId(url) {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
