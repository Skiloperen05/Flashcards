import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { disposition, readDriveFile } from '../supabase/functions/drive-proxy/files.ts';

const root = 'https://project.supabase.co';
const fileId = '11111111-1111-4111-8111-111111111111';
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const source = stripTypeScriptTypes(readFileSync(new URL('../supabase/functions/drive-proxy/index.ts', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, ''));

function gateway() {
  const state = { entitled: true, published: true, publicDrive: false, admin: false, native: false, google401: false, calls: [], writes: [] };
  let handler;
  const row = { id: fileId, subject_code: 'RRR11', kind: 'memo', title: 'Skatt', storage_bucket: 'google_drive', storage_path: 'private_drive_id', mime_type: 'application/msword', meta: {} };
  const fetch = async (input, init = {}) => {
    const url = new URL(input);
    state.calls.push(url.pathname + url.search);
    const bearer = init.headers?.Authorization;
    if (url.hostname === 'oauth2.googleapis.com') return json({ access_token: 'refreshed-google', expires_in: 3600 });
    if (url.hostname === 'www.googleapis.com') {
      if (state.google401 && bearer !== 'Bearer refreshed-google') return json({}, 401);
      if (url.pathname.endsWith('/permissions')) return json({ permissions: [{ type: state.publicDrive ? 'anyone' : 'user' }] });
      if (url.searchParams.has('alt') || url.pathname.endsWith('/export')) return new Response('document-bytes', { headers: { 'Content-Type': state.native ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } });
      return json({ name: 'Skatt – øving.docx', mimeType: state.native ? 'application/vnd.google-apps.document' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: '14', capabilities: { canDownload: true } });
    }
    if (url.pathname === '/auth/v1/user') return bearer === 'Bearer valid-user' ? json({ id: 'user-id' }) : json({}, 401);
    if (url.pathname === '/auth/v1/admin/users/user-id') return json({ id: 'user-id' });
    if (url.pathname.endsWith('/profiles')) return json([{ is_admin: state.admin, is_friend: false }]);
    if (url.pathname.endsWith('/subject_entitlements')) return json(state.entitled ? [{ id: 1 }] : []);
    if (url.pathname.endsWith('/subject_pages')) return json([{ is_published: state.published }]);
    if (url.pathname.endsWith('/app_private_config')) {
      if (init.method === 'POST') return new Response(null, { status: 204 });
      const key = url.searchParams.get('key');
      return json([{ value: key.includes('REFRESH') ? 'refresh-token' : JSON.stringify({ token: 'google-token', expiresAt: Date.now() + 3600000 }) }]);
    }
    if (url.pathname.endsWith('/subject_files')) {
      if (init.method === 'POST' || init.method === 'PATCH') {
        state.writes.push(JSON.parse(init.body)); return json([JSON.parse(init.body)]);
      }
      return json((bearer === 'Bearer server-key' || state.admin || (state.entitled && state.published)) && url.searchParams.get('id') === 'eq.' + fileId ? [row] : []);
    }
    throw new Error('Unexpected network request: ' + url.pathname);
  };
  vm.runInNewContext(source, {
    Deno: { env: { get: key => ({ SUPABASE_URL: root, SUPABASE_ANON_KEY: 'anon-key', SUPABASE_SERVICE_ROLE_KEY: 'server-key', GOOGLE_CLIENT_ID: 'client', GOOGLE_CLIENT_SECRET: 'secret' })[key] }, serve: fn => { handler = fn; } },
    readDriveFile, disposition, fetch, console, crypto: webcrypto, Request, Response, URL, URLSearchParams, TextEncoder, TextDecoder, Uint8Array, btoa, atob,
  });
  return { state, request: (query, init = {}) => handler(new Request(root + '/drive-proxy?' + query, { headers: { Authorization: 'Bearer valid-user' }, ...init })) };
}

let g = gateway();
let response = await g.request('action=ticket&id=' + fileId);
assert.equal(response.status, 200);
let link = new URL((await response.json()).url);
assert.equal(link.pathname, '/functions/v1/drive-proxy', 'Public ticket must retain the gateway prefix');
response = await g.request(link.search.slice(1) + '&download=1', { headers: {} });
assert.equal(response.status, 200);
assert.match(response.headers.get('Content-Disposition'), /filename\*=UTF-8''Skatt/);
assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
assert.equal(await response.text(), 'document-bytes');
g.state.entitled = false;
const before = g.state.calls.filter(x => x.startsWith('/drive/v3/')).length;
assert.equal((await g.request(link.search.slice(1), { headers: {} })).status, 403, 'Revoked access must invalidate an issued ticket');
assert.equal(g.state.calls.filter(x => x.startsWith('/drive/v3/')).length, before);
assert.equal((await g.request('action=ticket&id=' + fileId)).status, 404);
assert.equal((await g.request('id=' + fileId, { headers: {} })).status, 401);
assert.equal((await g.request('id=private_drive_id')).status, 400);
assert.equal((await g.request('action=download&ticket=forged', { headers: {} })).status, 401);

g = gateway();
g.state.native = true;
g.state.google401 = true;
response = await g.request('id=' + fileId);
assert.equal(response.status, 200);
assert.equal(response.headers.get('Content-Type'), 'application/pdf');
assert.ok(g.state.calls.some(x => x.includes('/export?')));
assert.ok(g.state.calls.includes('/token'), 'Rejected cached Google token must be refreshed');
g.state.publicDrive = true;
assert.equal((await g.request('id=' + fileId)).status, 503, 'Public sharing must fail closed');

g = gateway();
assert.equal((await g.request('action=import', { method: 'POST', body: '{}' })).status, 403);
g.state.admin = true;
response = await g.request('action=import', { method: 'POST', body: JSON.stringify({ subject_code: 'RRR11', kind: 'memo', title: 'Skatt', drive_id: 'private_drive_id' }) });
assert.equal(response.status, 200);
assert.equal(g.state.writes[0].storage_bucket, 'google_drive');
assert.equal(g.state.writes[0].storage_path, 'private_drive_id');
assert.ok(!g.state.calls.some(x => x.startsWith('/storage/')), 'Drive documents must never be copied to Supabase Storage');
g.state.publicDrive = true;
assert.equal((await g.request('action=import', { method: 'POST', body: JSON.stringify({ subject_code: 'RRR11', drive_id: 'private_drive_id' }) })).status, 422);
assert.equal(g.state.writes.length, 1, 'Failed validation must not publish metadata');

assert.doesNotThrow(() => new Headers({ 'Content-Disposition': disposition('Øving – skatt.pdf', true) }));

// Exercise the real viewer bootstrap: AuthGuard.requireAuth resolves a session,
// it does not invoke onUserAuthorized on standalone shared-guard pages.
const viewerSource = readFileSync(new URL('../shared/document-viewer.js', import.meta.url), 'utf8');
async function viewer(entitled) {
  const dom = new JSDOM('<a id="back"></a><h1 id="title"></h1><button id="download" disabled></button><p id="status"></p><main id="preview"></main>', {
    url: 'https://bhflashcards.no/user/document.html?file=' + fileId, runScripts: 'outside-only'
  });
  const win = dom.window;
  let requests = 0;
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: entitled ? { title: 'Skatt', subject_code: 'RRR11' } : null }) };
  win.AuthGuard = { requireAuth: async () => ({ user: { id: 'user-id' } }), getClient: () => ({ from: () => query, auth: { getSession: async () => ({ data: { session: { access_token: 'valid-user' } } }) } }) };
  win.fetch = async () => { requests++; return new Response('<script>not executable</script>\nNotes', { headers: { 'Content-Type': 'text/plain' } }); };
  win.eval(viewerSource);
  await new Promise(resolve => setTimeout(resolve, 30));
  if (entitled) {
    assert.equal(win.document.querySelector('article').textContent, '<script>not executable</script>\nNotes');
    assert.equal(win.document.querySelector('#preview script'), null);
    assert.equal(win.document.getElementById('download').disabled, false);
  } else {
    assert.equal(requests, 0, 'Viewer must not fetch bytes before metadata authorization');
    assert.match(win.document.getElementById('status').textContent, /mangler tilgang/);
    assert.equal(win.document.getElementById('download').disabled, true);
  }
  dom.window.close();
}
await viewer(true);
await viewer(false);
console.log('Document access tests passed: route prefix, auth, revocation, Drive-only storage, native export, token refresh, private sharing, Unicode filenames.');
