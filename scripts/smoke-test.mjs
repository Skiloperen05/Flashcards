import { createRequire } from 'node:module';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const require = createRequire(import.meta.url);
const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage']);
const htmlFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue;

    const absolute = join(dir, entry);
    const stats = statSync(absolute);

    if (stats.isDirectory()) {
      walk(absolute);
    } else if (entry.endsWith('.html')) {
      htmlFiles.push(absolute);
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function testTimeEditProxy() {
  const { handler } = require('../netlify/functions/timeedit.js');
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (url) => {
      assert(String(url).startsWith('https://cloud.timeedit.net/nhh/web/student/'), 'Unexpected upstream URL');
      return new Response('BEGIN:VCALENDAR\nEND:VCALENDAR', {
        status: 200,
        headers: { 'content-type': 'text/calendar' },
      });
    };

    const result = await handler({
      httpMethod: 'GET',
      headers: { origin: 'http://localhost:5173' },
      queryStringParameters: { url: 'https://cloud.timeedit.net/nhh/web/student/test.ics' },
    });

    assert(result.statusCode === 200, 'TimeEdit proxy should return upstream status');
    assert(result.headers['Content-Type'] === 'text/calendar; charset=utf-8', 'TimeEdit proxy should preserve safe calendar type');
    assert(result.body === 'BEGIN:VCALENDAR\nEND:VCALENDAR', 'TimeEdit proxy should return upstream body');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function testHtmlScriptHygiene() {
  walk(root);

  const duplicateSupabase = htmlFiles.filter((file) => {
    const html = readFileSync(file, 'utf8');
    const matches = html.match(/<script[^>]+src=["']https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2/g);
    return matches && matches.length > 1;
  });

  assert(
    duplicateSupabase.length === 0,
    `Duplicate Supabase script tags found in: ${duplicateSupabase.map((file) => relative(root, file)).join(', ')}`,
  );
}

await testTimeEditProxy();
testHtmlScriptHygiene();

console.log(`Smoke tests passed for TimeEdit proxy and ${htmlFiles.length} HTML files.`);
