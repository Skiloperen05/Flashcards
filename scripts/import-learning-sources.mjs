import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const defaultRoots = ['/Users/birkhaugnes/Documents/Studier/NHH', '/Users/birkhaugnes/Downloads'];
const args = process.argv.slice(2);
const outputArg = valueAfter('--output');
const limit = Number(valueAfter('--limit') || 0);
const jsonToStdout = args.includes('--json');
const dryRun = args.includes('--dry-run') || jsonToStdout;
const roots = valuesAfter('--root');
const scanRoots = (roots.length ? roots : defaultRoots).map((item) => resolve(item)).filter((item) => existsSync(item));
const outputPath = outputArg ? resolve(outputArg) : join(root, 'data', 'learning-source-index.generated.json');

const subjectHints = [
  ['RET14', ['ret14', 'skatterett']],
  ['SOL1', ['sol1', 'psykologi', 'ledelse', 'organisasjonsatferd']],
  ['SAM3', ['sam3', 'makro']],
  ['MAT10', ['mat10', 'analyse', 'line-r', 'linear', 'lineær']],
  ['MET2', ['met2', 'statistikk', 'p-verdi', 'sensorveiledning']],
  ['BED1', ['bed1', 'bed1a', 'bedriftsøkonomi']],
  ['SAM2', ['sam2', 'mikro']],
  ['SAM1A', ['sam1a']],
  ['MET1', ['met1', 'nnv', 'annuitet']],
  ['KOM1', ['kom1', 'kommunikasjon', 'rapport']],
  ['RET1A', ['ret1a', 'ret1']]
];

const readableExts = new Set(['.pdf', '.doc', '.docx', '.pptx', '.txt', '.md', '.html', '.htm', '.csv', '.xlsx', '.xls', '.rtf']);
const directTextExts = new Set(['.txt', '.md', '.html', '.htm', '.csv', '.rtf']);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index === -1 ? '' : args[index + 1] || '';
}

function valuesAfter(flag) {
  const values = [];
  args.forEach((arg, index) => {
    if (arg === flag && args[index + 1]) values.push(args[index + 1]);
  });
  return values;
}

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || entry === 'node_modules' || entry === '__MACOSX') continue;
    const absolute = join(dir, entry);
    let stats;
    try {
      stats = statSync(absolute);
    } catch {
      continue;
    }
    if (stats.isDirectory()) {
      walk(absolute, out);
      continue;
    }
    const ext = extname(entry).toLowerCase();
    if (readableExts.has(ext)) out.push({ absolute, stats, ext });
    if (limit && out.length >= limit) return;
  }
}

function inferSubject(filePath) {
  const needle = filePath.toLowerCase();
  for (const [subject, hints] of subjectHints) {
    if (hints.some((hint) => needle.includes(hint))) return subject;
  }
  return 'UNKNOWN';
}

function inferType(ext, filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes('sensor')) return 'sensor_guide';
  if (lower.includes('eksamen') || lower.includes('exam')) return 'exam';
  if (lower.includes('a-besvarelse') || lower.includes('besvarelse')) return 'answer_example';
  if (lower.includes('memo')) return 'memo';
  if (lower.includes('foreles') || lower.includes('lecture')) return 'lecture';
  if (lower.includes('oppgave') || lower.includes('oving') || lower.includes('øving')) return 'exercise';
  if (ext === '.xlsx' || ext === '.xls') return 'spreadsheet';
  if (ext === '.pptx') return 'slides';
  return 'document';
}

function inferTopics(filePath) {
  const lower = filePath.toLowerCase();
  const topics = [
    ['fradrag', ['fradrag']],
    ['aksjer', ['aksje', 'utbytte', 'fritak']],
    ['hypotesetest', ['hypotese', 'p-verdi', 'pverdi']],
    ['regresjon', ['regresjon', 'regression']],
    ['derivasjon', ['derivasjon', 'derivative']],
    ['integrasjon', ['integrasjon', 'integral']],
    ['matriser', ['matrise', 'matrix']],
    ['kalkyle', ['kalkyle', 'dekningsbidrag', 'selvkost']],
    ['investering', ['investering', 'nnv', 'nåverdi', 'naverdi']],
    ['modell', ['modell', 'is-mp', 'solow', 'as-ad', 'phillips']]
  ];
  return topics.filter(([, hints]) => hints.some((hint) => lower.includes(hint))).map(([topic]) => topic);
}

function cleanSnippet(text) {
  return String(text || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 700);
}

function readDirect(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function readWithTextutil(file) {
  const result = spawnSync('textutil', ['-stdout', '-convert', 'txt', file], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 5 });
  return result.status === 0 ? result.stdout : '';
}

function readWithPython(file, ext) {
  const py = `
import sys, zipfile, re, xml.etree.ElementTree as ET
path, ext = sys.argv[1], sys.argv[2]
out = ""
if ext == ".pdf":
    try:
        import fitz
        doc = fitz.open(path)
        out = "\\n".join(page.get_text("text") for page in doc[:3])
    except Exception:
        out = ""
elif ext in (".pptx", ".xlsx", ".docx"):
    try:
        with zipfile.ZipFile(path) as z:
            names = [n for n in z.namelist() if n.endswith(".xml")]
            chunks = []
            for name in names[:120]:
                try:
                    raw = z.read(name)
                    text = re.sub(r"<[^>]+>", " ", raw.decode("utf-8", "ignore"))
                    if text.strip():
                        chunks.append(text)
                except Exception:
                    pass
            out = "\\n".join(chunks)
    except Exception:
        out = ""
print(out[:5000])
`;
  const result = spawnSync('python3', ['-c', py, file, ext], { encoding: 'utf8', maxBuffer: 1024 * 1024 * 5 });
  return result.status === 0 ? result.stdout : '';
}

function extractSnippet(file, ext) {
  if (directTextExts.has(ext)) return cleanSnippet(readDirect(file));
  if (ext === '.doc' || ext === '.docx') {
    const textutil = readWithTextutil(file);
    if (textutil) return cleanSnippet(textutil);
  }
  if (ext === '.pdf' || ext === '.pptx' || ext === '.xlsx' || ext === '.docx') return cleanSnippet(readWithPython(file, ext));
  return '';
}

function makeRecord(item) {
  const subject = inferSubject(item.absolute);
  return {
    id: `${subject.toLowerCase()}-${basename(item.absolute).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)}`,
    subject,
    title: basename(item.absolute, item.ext),
    type: inferType(item.ext, item.absolute),
    extension: item.ext.replace(/^\./, ''),
    sourcePath: relative('/Users/birkhaugnes', item.absolute),
    bytes: item.stats.size,
    modifiedAt: item.stats.mtime.toISOString(),
    topics: inferTopics(item.absolute),
    rights: subject === 'UNKNOWN' ? 'needs_review' : 'local_private_source',
    status: subject === 'UNKNOWN' ? 'needs_subject_review' : 'candidate',
    suggestedUse: 'Metadataimport. Vurder manuelt for kort, oppgaver, memo eller eksamensradar.',
    textSnippet: extractSnippet(item.absolute, item.ext)
  };
}

const files = [];
scanRoots.forEach((scanRoot) => walk(scanRoot, files));
const records = files.slice(0, limit || files.length).map(makeRecord);
const payload = {
  generatedAt: new Date().toISOString(),
  roots: scanRoots,
  count: records.length,
  records
};

if (jsonToStdout) {
  console.log(JSON.stringify(payload, null, 2));
} else if (!dryRun) {
  writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${relative(root, outputPath)} with ${records.length} source records.`);
} else {
  console.log(`Scanned ${records.length} source records. Use --output to write the index.`);
}
