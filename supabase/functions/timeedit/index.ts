import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedOrigins = new Set([
  "https://bhflashcards.no",
  "https://www.bhflashcards.no",
  "https://skiloperen05.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = allowedOrigins.has(origin) ? origin : "https://bhflashcards.no";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Vary": "Origin",
  };
}

const ALLOWED_HOST = "cloud.timeedit.net";
const ALLOWED_PATH_PREFIX = "/nhh/web/student/";
const MAX_BYTES = 2_000_000;

function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function allowedContentType(contentType: string | null) {
  const lower = String(contentType || "").toLowerCase();
  if (lower.includes("text/html")) return "text/html; charset=utf-8";
  if (lower.includes("text/csv")) return "text/csv; charset=utf-8";
  if (lower.includes("text/calendar")) return "text/calendar; charset=utf-8";
  if (lower.includes("application/json")) return "application/json; charset=utf-8";
  if (lower.includes("text/plain")) return "text/plain; charset=utf-8";
  return "text/plain; charset=utf-8";
}

function validateTarget(raw: string | null) {
  if (!raw) throw new Error("Missing url query parameter");

  let target: URL;
  try {
    target = new URL(raw);
  } catch (_error) {
    throw new Error("Invalid url");
  }

  if (target.protocol !== "https:") throw new Error("Only https URLs are allowed");
  if (target.hostname !== ALLOWED_HOST) throw new Error("Host is not allowed");
  if (!target.pathname.startsWith(ALLOWED_PATH_PREFIX)) {
    throw new Error("Only NHH TimeEdit student URLs are allowed");
  }

  return target;
}

async function limitedText(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return (await response.text()).slice(0, MAX_BYTES);

  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    received += value.byteLength;
    if (received > MAX_BYTES) throw new Error("Response too large");
    chunks.push(value);
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8").decode(merged);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "GET") {
    return json(req, 405, { error: "Method not allowed" });
  }

  let target: URL;
  try {
    const reqUrl = new URL(req.url);
    target = validateTarget(reqUrl.searchParams.get("url"));
  } catch (error) {
    return json(req, 400, { error: error instanceof Error ? error.message : String(error) });
  }

  try {
    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Haugnes-Flashcards/1.0 (+https://github.com/Skiloperen05/Flashcards)",
        "Accept": "text/calendar,text/csv,text/html,application/json,text/plain,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const body = await limitedText(upstream);
    return new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders(req),
        "Content-Type": allowedContentType(upstream.headers.get("content-type")),
        "Cache-Control": upstream.ok ? "public, max-age=900, stale-while-revalidate=3600" : "no-store",
      },
    });
  } catch (error) {
    return json(req, 502, {
      error: "Could not fetch TimeEdit data",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});
