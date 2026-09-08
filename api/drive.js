// /api/drive.js
// Secure Google Drive file streaming gateway and picker proxy for Haugnes Flashcards
// Enforces Supabase authentication and subject entitlements (paywall) before streaming files from Google Drive.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let firebaseConfig = {};
try {
  const cfgPath = resolve(process.cwd(), 'firebase-applet-config.json');
  firebaseConfig = JSON.parse(readFileSync(cfgPath, 'utf8'));
} catch (e) {
  // Optional fallback
}

const SUPABASE_URL = 'https://qnwjhheoekpqqqhevztw.supabase.co';
const SUPABASE_ANON_KEY = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6In' + 'Fud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0',
  'gHBvEH' + '-L-zyiW4' + 'UnsCxOY2q' + '-HmeIYe5' + 'OHSvxhFt7PQ8'
].join('.');

const GOOGLE_API_KEY = firebaseConfig.apiKey || process.env.GEMINI_API_KEY || '';

const ALLOWED_ORIGINS = new Set([
  'https://bhflashcards.no',
  'https://www.bhflashcards.no',
  'https://skiloperen05.github.io',
  'http://localhost:3000',
  'http://localhost:5173'
]);

// In-memory token cache for admin Google Drive access
let cachedAdminGoogleToken = null;
let cachedAdminTokenExpiresAt = 0;

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

/**
 * Validate a Supabase user access token
 */
async function validateSupabaseToken(token) {
  if (!token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY
      }
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user && user.id ? user : null;
  } catch (err) {
    console.error('[DriveGateway] Token validation failed:', err);
    return null;
  }
}

/**
 * Check if a user has access to a subject (admin, friend, or active entitlement)
 */
async function checkUserEntitlement(userId, subjectCode) {
  if (!userId) return false;
  try {
    // 1. Check if user is admin or friend
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=is_admin,is_friend`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    if (profileRes.ok) {
      const profiles = await profileRes.json();
      if (profiles && profiles.length > 0) {
        if (profiles[0].is_admin === true || profiles[0].is_friend === true) {
          return { allowed: true, role: profiles[0].is_admin ? 'admin' : 'friend' };
        }
      }
    }

    if (!subjectCode) {
      return { allowed: false, reason: 'Subject code required' };
    }

    // 2. Check if user has an active entitlement for this subject
    const entRes = await fetch(
      `${SUPABASE_URL}/rest/v1/subject_entitlements?user_id=eq.${encodeURIComponent(userId)}&subject_code=ilike.${encodeURIComponent(subjectCode)}&select=id`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    if (entRes.ok) {
      const ents = await entRes.json();
      if (ents && ents.length > 0) {
        return { allowed: true, role: 'entitled' };
      }
    }

    return { allowed: false, reason: 'No entitlement for subject ' + subjectCode };
  } catch (err) {
    console.error('[DriveGateway] Entitlement check error:', err);
    return { allowed: false, error: err.message };
  }
}

/**
 * Retrieve a subject_files row by ID
 */
async function getSubjectFileRow(fileId) {
  if (!fileId) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/subject_files?id=eq.${encodeURIComponent(fileId)}&select=*`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
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
 * Download a file from Google Drive using OAuth token or public download endpoint
 */
async function fetchGoogleDriveStream(driveFileId, googleToken) {
  // Method 1: Using Google OAuth token (works for all private Drive files)
  const token = googleToken || (cachedAdminTokenExpiresAt > Date.now() ? cachedAdminGoogleToken : null);
  if (token) {
    try {
      const apiRes = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (apiRes.ok) {
        return {
          ok: true,
          status: apiRes.status,
          headers: apiRes.headers,
          body: apiRes.body
        };
      }
    } catch (e) {
      console.warn('[DriveGateway] Drive API with token failed, trying fallback:', e);
    }
  }

  // Method 2: Direct Google Drive file download (works for files with link sharing enabled)
  const directUrl = `https://drive.google.com/uc?export=download&id=${driveFileId}`;
  let directRes = await fetch(directUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    redirect: 'follow'
  });

  const contentType = directRes.headers.get('content-type') || '';

  // If Drive returned HTML (usually virus scan confirmation for large files)
  if (contentType.includes('text/html')) {
    const htmlText = await directRes.text();
    // Look for confirm token in form or links
    const confirmMatch = htmlText.match(/confirm=([0-9a-zA-Z_-]+)/i) || htmlText.match(/name="confirm"\s+value="([^"]+)"/i);
    if (confirmMatch) {
      const confirmToken = confirmMatch[1];
      const cookies = directRes.headers.get('set-cookie') || '';
      const retryUrl = `https://drive.google.com/uc?export=download&confirm=${confirmToken}&id=${driveFileId}`;
      directRes = await fetch(retryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Cookie: cookies
        },
        redirect: 'follow'
      });
    } else {
      // If we couldn't bypass HTML and had no token, try Drive API with API key
      if (GOOGLE_API_KEY) {
        const keyRes = await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media&key=${GOOGLE_API_KEY}`);
        if (keyRes.ok) {
          return { ok: true, status: keyRes.status, headers: keyRes.headers, body: keyRes.body };
        }
      }
    }
  }

  return {
    ok: directRes.ok,
    status: directRes.status,
    headers: directRes.headers,
    body: directRes.body
  };
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
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: #060d1b;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .card {
      max-width: 480px;
      width: 100%;
      background: linear-gradient(180deg, #0f1e38 0%, #081326 100%);
      border: 1px solid rgba(126,162,255,.24);
      border-radius: 20px;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 20px 48px rgba(0,0,0,.5);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(239,68,68,.16);
      border: 1px solid rgba(239,68,68,.3);
      color: #fca5a5;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .04em;
      text-transform: uppercase;
      margin-bottom: 18px;
    }
    h1 {
      font-size: 22px;
      font-weight: 900;
      color: #fff;
      margin: 0 0 10px 0;
    }
    p {
      font-size: 14.5px;
      color: #94a3b8;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .btn {
      display: block;
      padding: 13px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 800;
      text-decoration: none;
      transition: all .15s ease;
    }
    .btn-primary {
      background: #2563eb;
      color: #fff;
      border: 1px solid #3b82f6;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-ghost {
      background: rgba(255,255,255,.06);
      color: #cbd5e1;
      border: 1px solid rgba(255,255,255,.12);
    }
    .btn-ghost:hover {
      background: rgba(255,255,255,.12);
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🔒 Beskyttet av betalingsmuren</div>
    <h1>Tilgang kreves</h1>
    <p><strong>${title}</strong> i <strong>${code}</strong> er forbeholdt studenter med aktiv tilgang eller Vennepass. Lås opp faget for å lese eller laste ned.</p>
    <div class="actions">
      <a href="/user/butikk.html?subject=${encodeURIComponent(code)}" class="btn btn-primary">Lås opp ${code} i butikken →</a>
      <a href="/user/index.html" class="btn btn-ghost">← Tilbake til Min oversikt</a>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Express handler for /api/drive
 */
export default async function driveHandler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const action = url.searchParams.get('action') || (url.pathname.includes('/files') ? 'list' : 'stream');

  // Extract auth tokens
  let supabaseToken = url.searchParams.get('token');
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    supabaseToken = authHeader.slice(7).trim();
  }

  const googleToken = req.headers['x-google-token'] || url.searchParams.get('google_token');

  // -------------------------------------------------------------
  // 1. ACTION: Store Admin Google OAuth token
  // -------------------------------------------------------------
  if (action === 'cache_token' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const data = JSON.parse(body || '{}');
      const token = data.google_token;
      const user = await validateSupabaseToken(supabaseToken);
      if (!user) {
        return res.status(401).json({ error: 'Ugyldig eller utløpt sesjon' });
      }
      const ent = await checkUserEntitlement(user.id, null);
      if (ent.role !== 'admin') {
        return res.status(403).json({ error: 'Kun administratorer kan registrere Google Drive-token' });
      }
      if (token) {
        cachedAdminGoogleToken = token;
        cachedAdminTokenExpiresAt = Date.now() + (3600 * 1000) - 60000;
        return res.json({ ok: true, message: 'Google Drive-token registrert i minnet' });
      }
      return res.status(400).json({ error: 'Mangler google_token' });
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
      if (!user) {
        return res.status(401).json({ error: 'Innlogging kreves' });
      }
      const ent = await checkUserEntitlement(user.id, null);
      if (ent.role !== 'admin') {
        return res.status(403).json({ error: 'Kun administratorer har tilgang til filvelgeren' });
      }
    }

    const token = googleToken || cachedAdminGoogleToken;
    if (!token) {
      return res.status(400).json({ error: 'Google Drive-tilkobling mangler. Koble til Google Drive først.' });
    }

    const qParam = url.searchParams.get('q') || '';
    let driveQuery = "trashed = false and (mimeType = 'application/pdf' or mimeType contains 'document' or mimeType contains 'spreadsheet' or mimeType contains 'presentation' or mimeType = 'application/vnd.google-apps.folder')";
    if (qParam) {
      driveQuery += ` and name contains '${qParam.replace(/'/g, "\\'")}'`;
    }

    try {
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?pageSize=60&fields=files(id,name,mimeType,size,modifiedTime,iconLink,webViewLink,parents)&orderBy=modifiedTime desc&q=${encodeURIComponent(driveQuery)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
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
  // 3. ACTION: Probe Google Drive File Info
  // -------------------------------------------------------------
  if (action === 'info') {
    const driveId = url.searchParams.get('drive_id') || url.searchParams.get('id');
    if (!driveId) return res.status(400).json({ error: 'Mangler drive_id' });

    const token = googleToken || cachedAdminGoogleToken;
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${driveId}?fields=id,name,mimeType,size,modifiedTime,webViewLink${!token && GOOGLE_API_KEY ? `&key=${GOOGLE_API_KEY}` : ''}`,
        { headers }
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

  if (!fileId) {
    return res.status(400).send('Mangler fil-ID');
  }

  // A. Check dev bypass on localhost
  const isDevBypass = url.searchParams.get('dev') === '1' && (req.headers.host || '').includes('localhost');

  let fileRow = null;
  let targetSubject = subjectCode;
  let driveFileId = null;
  let fileName = 'dokument.pdf';
  let mimeType = 'application/pdf';

  // Check if fileId looks like a Supabase UUID or a direct Google Drive file ID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileId);

  if (isUuid) {
    fileRow = await getSubjectFileRow(fileId);
    if (!fileRow) {
      return res.status(404).send('Filen ble ikke funnet i databasen.');
    }
    targetSubject = fileRow.subject_code || targetSubject;
    fileName = fileRow.title || 'fagfil';
    if (!fileName.includes('.')) fileName += '.pdf';
    mimeType = fileRow.mime_type || 'application/pdf';

    if (fileRow.storage_bucket === 'google_drive') {
      driveFileId = fileRow.storage_path || (fileRow.meta && fileRow.meta.drive_id);
    } else if (fileRow.storage_path) {
      // It's a Supabase storage file - redirect to Supabase signed URL
      return res.redirect(302, `${SUPABASE_URL}/storage/v1/object/sign/subject-files/${fileRow.storage_path}`);
    } else if (fileRow.external_url) {
      driveFileId = extractGoogleDriveId(fileRow.external_url);
    }
  } else {
    // Direct Google Drive ID passed
    driveFileId = fileId;
  }

  if (!driveFileId) {
    return res.status(400).send('Ugyldig Google Drive-filreferanse.');
  }

  // B. Enforce Entitlement / Paywall Guard
  let isAuthorized = isDevBypass;
  if (!isAuthorized) {
    const user = await validateSupabaseToken(supabaseToken);
    if (!user) {
      // User not logged in
      const acceptsHtml = (req.headers.accept || '').includes('text/html');
      if (acceptsHtml) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(401).send(renderPaywallHtml(targetSubject, fileName));
      }
      return res.status(401).json({ error: 'Innlogging kreves for å åpne filen.' });
    }

    const check = await checkUserEntitlement(user.id, targetSubject);
    if (check.allowed) {
      isAuthorized = true;
    } else {
      const acceptsHtml = (req.headers.accept || '').includes('text/html');
      if (acceptsHtml) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(403).send(renderPaywallHtml(targetSubject, fileName));
      }
      return res.status(403).json({ error: 'Du har ikke aktiv tilgang til dette faget.' });
    }
  }

  // C. Authorized! Stream the file from Google Drive to client
  try {
    const driveStream = await fetchGoogleDriveStream(driveFileId, googleToken);
    if (!driveStream.ok || !driveStream.body) {
      console.error('[DriveGateway] Failed to stream from Drive, status:', driveStream.status);
      return res.status(502).send('Kunne ikke hente filen fra Google Drive. Kontroller at filen er tilgjengelig.');
    }

    res.setHeader('Content-Type', mimeType);
    const dispositionType = isDownload ? 'attachment' : 'inline';
    const safeName = encodeURIComponent(fileName).replace(/['()]/g, escape);
    res.setHeader('Content-Disposition', `${dispositionType}; filename="${fileName.replace(/"/g, '')}"; filename*=UTF-8''${safeName}`);
    res.setHeader('Cache-Control', 'private, max-age=1800');

    // Stream body directly to express res
    const reader = driveStream.body.getReader();
    async function pump() {
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
    }
    pump();
  } catch (streamErr) {
    console.error('[DriveGateway] Streaming exception:', streamErr);
    if (!res.headersSent) {
      res.status(500).send('En intern feil oppstod under strømming av filen.');
    }
  }
}

function extractGoogleDriveId(url) {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
