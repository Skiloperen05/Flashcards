import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage']);
const htmlFiles = [];
const sourceFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue;

    const absolute = join(dir, entry);
    const stats = statSync(absolute);

    if (stats.isDirectory()) {
      walk(absolute);
    } else if (entry.endsWith('.html')) {
      htmlFiles.push(absolute);
      sourceFiles.push(absolute);
    } else if (entry.endsWith('.js') || entry.endsWith('.ts')) {
      sourceFiles.push(absolute);
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
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

function testRuntimeDoesNotCallLegacyFunctions() {
  const legacyFunctionPath = ['/.', 'net' + 'lify', '/functions/'].join('');
  const offenders = sourceFiles.filter((file) => readFileSync(file, 'utf8').includes(legacyFunctionPath));

  assert(
    offenders.length === 0,
    `Runtime files still call legacy functions: ${offenders.map((file) => relative(root, file)).join(', ')}`,
  );
}

function testSupabaseRuntimeTargets() {
  const functionBase = 'https://qnwjhheoekpqqqhevztw.supabase.co/functions/v1';
  const shop = readFileSync(join(root, 'user/butikk.html'), 'utf8');
  const timeeditProxy = readFileSync(join(root, 'shared/timeedit-fetch-proxy.js'), 'utf8');

  assert(
    shop.includes(`${functionBase}/create-stripe-checkout`),
    'Shop checkout should call the Supabase create-stripe-checkout function',
  );
  assert(
    timeeditProxy.includes(`${functionBase}/timeedit`),
    'TimeEdit proxy should call the Supabase timeedit function',
  );
  assert(
    !timeeditProxy.includes('return originalFetch(input, init).then'),
    'TimeEdit proxy should not try a local API request before Supabase',
  );
}

testHtmlScriptHygiene();
testRuntimeDoesNotCallLegacyFunctions();
testSupabaseRuntimeTargets();

console.log(`Smoke tests passed for Supabase runtime targets and ${htmlFiles.length} HTML files.`);
