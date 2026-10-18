import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { JSDOM } from 'jsdom';
const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('sam3/sam3-flashcards-data.js', root), 'utf8');
// The dedicated SAM3 app uses the same repair for this legacy gzip payload.
const payload = source.split('`')[1].replace('o7eksowow8ez', 'o7eksow8ez');
const decks = JSON.parse(gunzipSync(Buffer.from(payload, 'base64')));
const dom = new JSDOM('');
function text(html) {
  const el = dom.window.document.createElement('div');
  el.innerHTML = String(html || '').replace(/<br\s*\/?\s*>|<\/(?:div|p|li)>/gi, '\n');
  return el.textContent.replace(/\n{3,}/g, '\n\n').trim();
}
const result = decks.map((deck) => ({
  id: `sam3-${deck.id}`,
  legacyId: deck.id,
  title: deck.title,
  description: deck.desc,
  cards: deck.cards.map((card) => ({
    q: text(card.q),
    a: text(card.a),
    tag: card.tag || '',
    topic: deck.id,
    source: `SAM3 · ${deck.title}`,
  })),
}));
const output =
  '// Generated from sam3/sam3-flashcards-data.js by scripts/generate-sam3-flashcards.mjs.\nwindow.HaugnesSam3Flashcards = ' +
  JSON.stringify(result, null, 2) +
  ';\n';
const target = new URL('shared/sam3-flashcard-catalog.js', root);
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== output)
    throw new Error('SAM3-katalogen er utdatert. Kjør npm run sam3:generate.');
} else writeFileSync(target, output);
dom.window.close();
console.log(
  `SAM3 flashcard catalog: ${result.length} decks, ${result.reduce((n, deck) => n + deck.cards.length, 0)} cards.`,
);
