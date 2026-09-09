import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Production Drive gateway. GitHub Pages serves the static site, so the
// entitlement-protected server work lives here rather than under /api/.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://qnwjhheoekpqqqhevztw.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6In" + "Fud2poaGVvZWtwcXFxaGV2enR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3MTg1NTEsImV4cCI6MjA5MjI5NDU1MX0",
  "gHBvEH" + "-L-zyiW4" + "UnsCxOY2q" + "-HmeIYe5" + "OHSvxhFt7PQ8",
].join(".");
const TOKEN_CONFIG_KEY = "GOOGLE_DRIVE_ADMIN_TOKEN";
const ORIGINS = new Set(["https://bhflashcards.no", "https://www.bhflashcards.no", "https://skiloperen05.github.io", "http://localhost:3000", "http://localhost:5173"]);
type Identity = { id: string; email?: string };
type CachedToken = { token: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.has(origin) ? origin : "https://bhflashcards.no",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Google-Token",
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
async function readCachedToken(): Promise<CachedToken | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken;
  const params = new URLSearchParams({ key: `eq.${TOKEN_CONFIG_KEY}`, select: "value", limit: "1" });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/app_private_config?${params}`, { headers: adminHeaders() });
  if (!response.ok) return null;
  const rows = await response.json();
  try {
    const parsed = Array.isArray(rows) && rows[0]?.value ? JSON.parse(String(rows[0].value)) : null;
    if (parsed?.token && Number(parsed.expiresAt) > Date.now()) {
      cachedToken = { token: String(parsed.token), expiresAt: Number(parsed.expiresAt) };
      return cachedToken;
    }
  } catch (_) {}
  return null;
}
async function saveCachedToken(value: CachedToken) {
  cachedToken = value;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/app_private_config?on_conflict=key`, {
    method: "POST",
    headers: adminHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({ key: TOKEN_CONFIG_KEY, value: JSON.stringify(value), updated_at: new Date().toISOString() }),
  });
  if (!response.ok) throw new Error("Kunne ikke lagre den midlertidige Drive-tokenen.");
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "stream";

  try {
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

    if (action === "list" || action === "info") {
      const auth = await requireAdmin(req);
      if (!auth) return json(req, 403, { error: "Kun administratorer har tilgang til Google Drive-velgeren." });
      const supplied = req.headers.get("x-google-token") || "";
      const saved = supplied ? null : await readCachedToken();
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

    const jwt = token(req); const user = await identity(jwt);
    if (!user) return json(req, 401, { error: "Innlogging kreves for å åpne filen." });
    const fileId = String(url.searchParams.get("id") || "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileId)) return json(req, 400, { error: "Ugyldig filreferanse." });
    const params = new URLSearchParams({ id: `eq.${fileId}`, select: "id,subject_code,title,storage_bucket,storage_path,external_url,mime_type,meta", limit: "1" });
    const fileResponse = await fetch(`${SUPABASE_URL}/rest/v1/subject_files?${params}`, { headers: userHeaders(jwt) });
    const rows = fileResponse.ok ? await fileResponse.json() : [];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return json(req, 404, { error: "Filen ble ikke funnet eller du har ikke tilgang." });
    const id = driveId(row);
    if (!id) return json(req, 400, { error: "Filen er ikke koblet til Google Drive." });
    const saved = await readCachedToken();
    if (!saved) return json(req, 503, { error: "Google Drive-tilkoblingen er utløpt. Be en administrator koble til på nytt." });
    const response = await google(saved.token, `files/${encodeURIComponent(id)}?alt=media`);
    if (!response.ok || !response.body) return json(req, 502, { error: "Kunne ikke hente filen fra Google Drive." });
    const filename = String(row.title || "dokument.pdf").replace(/[\r\n"]/g, "") || "dokument.pdf";
    return new Response(response.body, { status: 200, headers: { ...cors(req), "Content-Type": String(row.mime_type || response.headers.get("content-type") || "application/pdf"), "Content-Disposition": `inline; filename="${filename}"`, "Cache-Control": "private, max-age=1800" } });
  } catch (error) {
    console.error("[drive-proxy]", error instanceof Error ? error.message : error);
    return json(req, 500, { error: "Drive-proxyen fikk en intern feil." });
  }
});
