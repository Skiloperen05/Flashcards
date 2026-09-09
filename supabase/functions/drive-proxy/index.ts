import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Production Drive gateway. GitHub Pages serves the static site, so the
// entitlement-protected server work lives here rather than under /api/.
//
// Long-lived Google auth
// ----------------------
// An earlier revision used the GIS implicit token flow — admins had to
// reconnect Drive every hour because Google refused to hand out
// refresh_tokens through that flow. This version does the auth code
// flow instead: the admin authorises once, the Edge Function exchanges
// the code for BOTH an access token and a refresh_token, and every
// subsequent stream call refreshes the access token from that
// refresh_token on demand. The admin never has to reconnect unless
// Google revokes the grant.
//
// Required Edge Function secrets (Supabase → Functions → Env vars):
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET   ← must exist for offline access to work
//   SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)
//
// Backwards compatibility: if GOOGLE_CLIENT_SECRET is unset the old
// implicit-token cache path still works (admin re-auths hourly).
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://qnwjhheoekpqqqhevztw.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6In" + "Fud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0",
  "gHBvEH" + "-L-zyiW4" + "UnsCxOY2q" + "-HmeIYe5" + "OHSvxhFt7PQ8",
].join(".");
const TOKEN_CONFIG_KEY = "GOOGLE_DRIVE_ADMIN_TOKEN";
const REFRESH_CONFIG_KEY = "GOOGLE_DRIVE_REFRESH_TOKEN";
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
const ORIGINS = new Set(["https://bhflashcards.no", "https://www.bhflashcards.no", "https://skiloperen05.github.io", "http://localhost:3000", "http://localhost:5173"]);
type Identity = { id: string; email?: string };
type CachedToken = { token: string; expiresAt: number };
let cachedToken: CachedToken | null = null;
let cachedRefresh: string | null = null;

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.has(origin) ? origin : "https://bhflashcards.no",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Google-Token, X-Requested-With",
    "Vary": "Origin",
  };
}
function json(req: Request, status: number, value: unknown) {
  return new Response(JSON.stringify(value), { status, headers: { ...cors(req), "Content-Type": "application/json; charset=utf-8" } });
}
function token(req: Request) { return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim(); }
function adminKey() {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY");
  if (!key) throw new Error("Supabase server key mangler.");
  return key;
}
function adminHeaders(extra: Record<string, string> = {}) {
  const key = adminKey();
  return { apikey: key, ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }), ...extra };
}
function userHeaders(jwt: string) { return { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${jwt}` }; }

async function identity(jwt: string): Promise<Identity | null> {
  if (!jwt) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: userHeaders(jwt) });
  if (!response.ok) return null;
  const user = await response.json();
  return user?.id ? { id: String(user.id), email: user.email ? String(user.email) : undefined } : null;
}
async function isAdmin(user: Identity, jwt: string) {
  const params = new URLSearchParams({ id: `eq.${user.id}`, select: "is_admin", limit: "1" });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?${params}`, { headers: userHeaders(jwt) });
  if (!response.ok) return false;
  const rows = await response.json();
  return !!(Array.isArray(rows) && rows[0]?.is_admin === true);
}
async function requireAdmin(req: Request) {
  const jwt = token(req); const user = await identity(jwt);
  return user && await isAdmin(user, jwt) ? { user, jwt } : null;
}
async function readConfig(key: string): Promise<string | null> {
  const params = new URLSearchParams({ key: `eq.${key}`, select: "value", limit: "1" });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/app_private_config?${params}`, { headers: adminHeaders() });
  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) && rows[0]?.value ? String(rows[0].value) : null;
}
async function writeConfig(key: string, value: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/app_private_config?on_conflict=key`, {
    method: "POST",
    headers: adminHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error("Kunne ikke lagre konfigurasjonen.");
}
async function readCachedToken(): Promise<CachedToken | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken;
  const raw = await readConfig(TOKEN_CONFIG_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.token && Number(parsed.expiresAt) > Date.now()) {
      cachedToken = { token: String(parsed.token), expiresAt: Number(parsed.expiresAt) };
      return cachedToken;
    }
  } catch (_) {}
  return null;
}
async function saveCachedToken(value: CachedToken) {
  cachedToken = value;
  await writeConfig(TOKEN_CONFIG_KEY, JSON.stringify(value));
}
async function readRefreshToken(): Promise<string | null> {
  if (cachedRefresh) return cachedRefresh;
  const raw = await readConfig(REFRESH_CONFIG_KEY);
  if (raw) cachedRefresh = raw;
  return cachedRefresh;
}
async function saveRefreshToken(value: string) {
  cachedRefresh = value;
  await writeConfig(REFRESH_CONFIG_KEY, value);
}

// Popup-mode GIS uses the origin of the calling page as redirect_uri. It must
// be the same value at both ends of the authorization-code exchange.
async function exchangeAuthCode(code: string, redirectUri: string): Promise<{ ok: true; accessToken: string; refreshToken?: string; expiresIn: number } | { ok: false; error: string }> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return { ok: false, error: "GOOGLE_CLIENT_SECRET er ikke satt i Edge Function-secrets. Legg til hemmeligheten fra Google Cloud Console (OAuth-klienten må være type «Web application»)." };
  }
  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();
  if (!response.ok) return { ok: false, error: data?.error_description || data?.error || "Google avviste autorisasjonskoden." };
  return {
    ok: true,
    accessToken: String(data.access_token || ""),
    refreshToken: data.refresh_token ? String(data.refresh_token) : undefined,
    expiresIn: Number(data.expires_in || 3600),
  };
}

// Use the stored refresh_token to mint a new access_token when the cached
// one has expired. Cache the fresh access token so parallel stream calls
// don't refresh in a stampede.
async function refreshAccessToken(): Promise<CachedToken | null> {
  const refresh = await readRefreshToken();
  if (!refresh || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refresh,
    grant_type: "refresh_token",
  });
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("[drive-proxy] refresh failed:", data);
      return null;
    }
    const expiresIn = Math.max(60, Number(data.expires_in || 3600) - 60);
    const value: CachedToken = { token: String(data.access_token || ""), expiresAt: Date.now() + expiresIn * 1000 };
    if (!value.token) return null;
    await saveCachedToken(value);
    return value;
  } catch (err) {
    console.error("[drive-proxy] refresh exception:", err);
    return null;
  }
}

// Callers use this instead of readCachedToken directly. Order:
//   1. In-memory or DB-cached access token that is still valid.
//   2. Fresh access token minted from the stored refresh_token.
//   3. null → the admin needs to (re)connect Drive.
async function getFreshDriveToken(): Promise<CachedToken | null> {
  const cached = await readCachedToken();
  if (cached) return cached;
  return await refreshAccessToken();
}
async function google(tokenValue: string, path: string) {
  return fetch(`https://www.googleapis.com/drive/v3/${path}`, { headers: { Authorization: `Bearer ${tokenValue}` } });
}
function driveId(row: Record<string, unknown>) {
  if (row.storage_bucket === "google_drive" && row.storage_path) return String(row.storage_path);
  const meta = row.meta && typeof row.meta === "object" ? row.meta as Record<string, unknown> : {};
  if (meta.drive_id) return String(meta.drive_id);
  const url = String(row.external_url || "");
  const match = url.match(/\/d\/([A-Za-z0-9_-]+)/) || url.match(/[?&]id=([A-Za-z0-9_-]+)/);
  return match ? match[1] : "";
}

// Give the downloaded file a name that matches its mime type, so
// "Skatt" (title) + docx becomes "Skatt.docx" in the browser's
// Downloads folder rather than the extension-less title.
function extensionFor(mime: string): string {
  const m = String(mime || "").toLowerCase();
  if (m.includes("pdf")) return ".pdf";
  if (m.includes("wordprocessingml")) return ".docx";
  if (m.includes("msword")) return ".doc";
  if (m.includes("presentationml")) return ".pptx";
  if (m.includes("ms-powerpoint")) return ".ppt";
  if (m.includes("spreadsheetml")) return ".xlsx";
  if (m.includes("ms-excel")) return ".xls";
  if (m.includes("png")) return ".png";
  if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
  if (m.includes("webp")) return ".webp";
  if (m.includes("markdown")) return ".md";
  if (m.includes("plain")) return ".txt";
  return "";
}
function downloadFilename(title: string, mime: string): string {
  const clean = String(title || "dokument").replace(/[\r\n"\\/]/g, "").trim() || "dokument";
  if (/\.[a-z0-9]{2,6}$/i.test(clean)) return clean;
  return clean + (extensionFor(mime) || ".bin");
}

// A browser cannot attach the student's Supabase JWT to a normal navigation,
// which is what Safari needs to reliably honour Content-Disposition downloads.
// Issue a short-lived, HMAC-signed ticket instead. It contains no Drive ID and
// cannot be forged without the server-only Supabase secret.
type DownloadTicket = { fileId: string; userId: string; expiresAt: number };
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
async function ticketKey() {
  return crypto.subtle.importKey("raw", textEncoder.encode(adminKey()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
async function issueDownloadTicket(fileId: string, userId: string) {
  const ticket: DownloadTicket = { fileId, userId, expiresAt: Date.now() + 30 * 60 * 1000 };
  const payload = base64Url(textEncoder.encode(JSON.stringify(ticket)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await ticketKey(), textEncoder.encode(payload)));
  return `${payload}.${base64Url(signature)}`;
}
async function verifyDownloadTicket(ticket: string): Promise<DownloadTicket | null> {
  try {
    const [payload, signature, extra] = ticket.split(".");
    if (!payload || !signature || extra) return null;
    const valid = await crypto.subtle.verify("HMAC", await ticketKey(), fromBase64Url(signature), textEncoder.encode(payload));
    if (!valid) return null;
    const parsed = JSON.parse(textDecoder.decode(fromBase64Url(payload))) as DownloadTicket;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.fileId || "")) return null;
    if (!parsed.userId || !Number.isFinite(parsed.expiresAt) || parsed.expiresAt <= Date.now()) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "stream";

  try {
    // Auth-code flow: admin authorises once via GIS initCodeClient, POSTs the
    // resulting code from an allowed origin, and we
    // exchange it for a refresh_token that we keep around indefinitely.
    if (action === "exchange_code" && req.method === "POST") {
      const auth = await requireAdmin(req);
      if (!auth) return json(req, 403, { error: "Kun administratorer kan koble til Google Drive." });
      const origin = req.headers.get("origin") || "";
      if (!ORIGINS.has(origin) || req.headers.get("x-requested-with") !== "XMLHttpRequest") {
        return json(req, 400, { error: "Ugyldig autorisasjonsforespørsel." });
      }
      const body = await req.json().catch(() => ({}));
      const code = String(body.code || "");
      if (!code) return json(req, 400, { error: "Mangler autorisasjonskode." });
      const result = await exchangeAuthCode(code, origin);
      if (!result.ok) return json(req, 400, { error: result.error });
      const expiresIn = Math.max(60, result.expiresIn - 60);
      const expiresAt = Date.now() + expiresIn * 1000;
      await saveCachedToken({ token: result.accessToken, expiresAt });
      if (result.refreshToken) await saveRefreshToken(result.refreshToken);
      return json(req, 200, { ok: true, expires_at: expiresAt, has_refresh: !!(result.refreshToken || cachedRefresh) });
    }

    // Legacy implicit-token cache (kept for backwards compat when
    // GOOGLE_CLIENT_SECRET is not configured).
    if (action === "cache_token" && req.method === "POST") {
      const auth = await requireAdmin(req);
      if (!auth) return json(req, 403, { error: "Kun administratorer kan koble til Google Drive." });
      const body = await req.json().catch(() => ({}));
      const accessToken = String(body.google_token || "");
      const expiresIn = Math.max(60, Number(body.expires_in || 3600) - 60);
      if (!accessToken) return json(req, 400, { error: "Mangler google_token." });
      const expiresAt = Date.now() + expiresIn * 1000;
      await saveCachedToken({ token: accessToken, expiresAt });
      return json(req, 200, { ok: true, expires_at: expiresAt });
    }

    if (action === "status") {
      const fresh = await getFreshDriveToken();
      return json(req, 200, {
        admin_connected: !!fresh,
        expires_at: fresh?.expiresAt || null,
        offline_ready: !!cachedRefresh || !!(await readRefreshToken()),
        client_secret_configured: !!GOOGLE_CLIENT_SECRET,
      });
    }

    if (action === "list" || action === "info") {
      const auth = await requireAdmin(req);
      if (!auth) return json(req, 403, { error: "Kun administratorer har tilgang til Google Drive-velgeren." });
      const supplied = req.headers.get("x-google-token") || "";
      const saved = supplied ? null : await getFreshDriveToken();
      const accessToken = supplied || saved?.token || "";
      if (!accessToken) return json(req, 400, { error: "Google Drive-tilkobling mangler. Koble til på nytt." });
      if (action === "list") {
        const query = String(url.searchParams.get("q") || "").replace(/'/g, "\\'");
        let driveQuery = "trashed = false and (mimeType = 'application/pdf' or mimeType contains 'document' or mimeType contains 'spreadsheet' or mimeType contains 'presentation' or mimeType = 'application/vnd.google-apps.folder')";
        if (query) driveQuery += ` and name contains '${query}'`;
        const response = await google(accessToken, `files?pageSize=60&fields=files(id,name,mimeType,size,modifiedTime,iconLink,webViewLink,parents)&orderBy=modifiedTime%20desc&q=${encodeURIComponent(driveQuery)}`);
        const data = await response.json();
        return json(req, response.status, response.ok ? { files: data.files || [] } : { error: data?.error?.message || "Google Drive API-feil" });
      }
      const id = String(url.searchParams.get("drive_id") || "");
      if (!id) return json(req, 400, { error: "Mangler drive_id." });
      const response = await google(accessToken, `files/${encodeURIComponent(id)}?fields=id,name,mimeType,size,modifiedTime,webViewLink`);
      const data = await response.json();
      return json(req, response.status, response.ok ? { file: data } : { error: data?.error?.message || "Fant ikke fil på Drive" });
    }

    const requestedFileId = String(url.searchParams.get("id") || "");
    const isFileId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // The ticket endpoint is called with the student's bearer token while
    // rendering the page. RLS makes the entitlement decision here, before a
    // short-lived browser-download URL is issued.
    if (action === "ticket") {
      const jwt = token(req); const user = await identity(jwt);
      if (!user) return json(req, 401, { error: "Innlogging kreves for å åpne filen." });
      if (!isFileId.test(requestedFileId)) return json(req, 400, { error: "Ugyldig filreferanse." });
      const ticketParams = new URLSearchParams({ id: `eq.${requestedFileId}`, select: "id", limit: "1" });
      const ticketResponse = await fetch(`${SUPABASE_URL}/rest/v1/subject_files?${ticketParams}`, { headers: userHeaders(jwt) });
      const ticketRows = ticketResponse.ok ? await ticketResponse.json() : [];
      if (!Array.isArray(ticketRows) || !ticketRows[0]?.id) return json(req, 404, { error: "Filen ble ikke funnet eller du har ikke tilgang." });
      const ticket = await issueDownloadTicket(requestedFileId, user.id);
      return json(req, 200, { url: `${url.origin}${url.pathname}?action=download&ticket=${encodeURIComponent(ticket)}` });
    }

    const downloadTicket = action === "download" ? await verifyDownloadTicket(String(url.searchParams.get("ticket") || "")) : null;
    if (action === "download" && !downloadTicket) return json(req, 401, { error: "Nedlastingslenken er utløpt. Last siden på nytt og prøv igjen." });
    const jwt = token(req); const user = downloadTicket ? null : await identity(jwt);
    if (!downloadTicket && !user) return json(req, 401, { error: "Innlogging kreves for å åpne filen." });
    const fileId = downloadTicket ? downloadTicket.fileId : requestedFileId;
    if (!isFileId.test(fileId)) return json(req, 400, { error: "Ugyldig filreferanse." });
    const params = new URLSearchParams({ id: `eq.${fileId}`, select: "id,subject_code,title,storage_bucket,storage_path,external_url,mime_type,meta", limit: "1" });
    const fileResponse = await fetch(`${SUPABASE_URL}/rest/v1/subject_files?${params}`, { headers: downloadTicket ? adminHeaders() : userHeaders(jwt) });
    const rows = fileResponse.ok ? await fileResponse.json() : [];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return json(req, 404, { error: "Filen ble ikke funnet eller du har ikke tilgang." });
    const id = driveId(row);
    if (!id) return json(req, 400, { error: "Filen er ikke koblet til Google Drive." });
    const saved = await getFreshDriveToken();
    if (!saved) return json(req, 503, { error: "Google Drive-tilkoblingen er utløpt. Be en administrator koble til på nytt." });
    let response = await google(saved.token, `files/${encodeURIComponent(id)}?alt=media`);
    // A 401 here means Google rejected the cached token even though it
    // was still marked fresh — usually because the grant was revoked and
    // then re-granted. Try one refresh round before giving up.
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) response = await google(refreshed.token, `files/${encodeURIComponent(id)}?alt=media`);
    }
    if (!response.ok || !response.body) {
      let detail = "";
      try { detail = (await response.clone().text()).slice(0, 200); } catch (_) {}
      console.warn("[drive-proxy] Drive fetch failed:", response.status, detail);
      return json(req, 502, { error: "Kunne ikke hente filen fra Google Drive." });
    }
    const filename = downloadFilename(String(row.title || ""), String(row.mime_type || response.headers.get("content-type") || ""));
    const contentType = String(row.mime_type || response.headers.get("content-type") || "application/octet-stream");
    // Only PDFs and images render sensibly inline; everything else
    // (docx, xlsx, pptx…) should default to a download rather than
    // trying to render in the browser.
    const forceDownload = url.searchParams.get("download") === "1";
    const disposition = forceDownload || !/^(application\/pdf|image\/)/i.test(contentType) ? "attachment" : "inline";
    return new Response(response.body, {
      status: 200,
      headers: {
        ...cors(req),
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Cache-Control": "private, max-age=1800",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("[drive-proxy]", error instanceof Error ? error.message : error);
    return json(req, 500, { error: "Drive-proxyen fikk en intern feil." });
  }
});
