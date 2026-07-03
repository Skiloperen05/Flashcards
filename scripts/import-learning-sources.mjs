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
const v1SourceRoles = ['canvas_lecture', 'personal_notes', 'personal_memo', 'exam_archive', 'sensor_guide', 'answer_example', 'exercise_pack', 'spreadsheet', 'owned_assignment'];
const rolePriority = ['personal_memo', 'personal_notes', 'canvas_lecture', 'exercise_pack', 'sensor_guide', 'exam_archive', 'spreadsheet', 'owned_assignment', 'answer_example'];

const subjectBlueprints = {
  RET14: {
    methods: ['Hjemmel', 'Vilkår', 'Subsumsjon', 'Beregning'],
    questions: ['Fradrag', 'Aksjer', 'Personinntekt', 'Tidfesting', 'MVA'],
    radar: ['Fradrag', 'Aksjer og fritaksmetode', 'Personinntekt', 'Tidfesting']
  },
  SOL1: {
    methods: ['Teorivalg', 'Casekobling', 'Drøfting', 'Eksempelsvar'],
    questions: ['Motivasjon', 'Team', 'Ledelse', 'Beslutninger', 'Kultur'],
    radar: ['Teorivalg', 'Casekobling', 'Drøfting', 'Ledelse']
  },
  SAM3: {
    methods: ['Modellvalg', 'Figur/skift', 'Formel', 'Eksamensflyt'],
    questions: ['IS-MP', 'AS-AD', 'Solow', 'Phillips', 'Åpen økonomi'],
    radar: ['IS-MP', 'AS-AD', 'Solow', 'Åpen økonomi']
  },
  MAT10: {
    methods: ['Formelvalg', 'Definisjonsområde', 'Mellomregning', 'Kontroll'],
    questions: ['Derivasjon', 'Integrasjon', 'Matriser', 'Taylor', 'Optimering'],
    radar: ['Derivasjon og optimering', 'Integrasjon', 'Lineær algebra', 'Taylor']
  },
  MET2: {
    methods: ['Testvalg', 'P-verdi', 'Konfidensintervall', 'Regresjonstolkning'],
    questions: ['Hypotesetest', 'Konfidensintervall', 'Regresjon', 'Utvalg', 'Sannsynlighet'],
    radar: ['Hypotesetesting', 'Konfidensintervall', 'Regresjon', 'Utvalg']
  },
  BED1: {
    methods: ['Kalkyle', 'Tabelloppsett', 'Fasitkontroll', 'Beslutning'],
    questions: ['Produktkalkulasjon', 'Investering', 'Budsjett', 'Resultat', 'Relevante kostnader'],
    radar: ['Produktkalkulasjon', 'Investering', 'Budsjett og resultat', 'Beslutning']
  },
  SAM2: {
    methods: ['Figur først', 'Modellvalg', 'Velferd', 'Komparativ statikk'],
    questions: ['Konsumentteori', 'Produsentteori', 'Markedssvikt', 'Monopol', 'Spillteori'],
    radar: ['Konsumentteori', 'Markedssvikt', 'Velferdsanalyse', 'Markedsmakt']
  },
  SAM1A: {
    methods: ['Markedskryss', 'Elastisitet', 'Velferd', 'Markedssvikt'],
    questions: ['Markedslikevekt', 'Elastisitet', 'Regulering', 'Skatt', 'Eksternaliteter'],
    radar: ['Markedslikevekt', 'Elastisitet', 'Velferd', 'Markedssvikt']
  },
  MET1: {
    methods: ['Tidslinje', 'Nåverdi', 'Annuitet', 'Renteperiode'],
    questions: ['Nåverdi', 'Annuitet', 'Effektiv rente', 'Rekker', 'Lån'],
    radar: ['Nåverdi', 'Annuitet', 'Effektiv rente', 'Rekker']
  },
  KOM1: {
    methods: ['Problemstilling', 'Analyseavsnitt', 'Argumentasjon', 'Presentasjon'],
    questions: ['Rapportstruktur', 'Kildebruk', 'Drøfting', 'Språk', 'Muntlig presentasjon'],
    radar: ['Problemstilling', 'Analyseavsnitt', 'Drøfting', 'Presentasjon']
  },
  RET1A: {
    methods: ['Rettsregel', 'Vilkår', 'Subsumsjon', 'Delkonklusjon'],
    questions: ['Avtalerett', 'Pengekrav', 'Selskapsrett', 'Juridisk metode', 'Tolkning'],
    radar: ['Juridisk metode', 'Avtalerett', 'Pengekrav', 'Selskapsrett']
  }
};

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

function inferSourceRole(ext, filePath, type) {
  const lower = filePath.toLowerCase();
  if (type === 'answer_example') return 'answer_example';
  if (type === 'sensor_guide') return 'sensor_guide';
  if (type === 'exam') return 'exam_archive';
  if (type === 'memo') return 'personal_memo';
  if (type === 'spreadsheet') return 'spreadsheet';
  if (lower.includes('innlevering') || lower.includes('rapport') || lower.includes('presentasjon') || lower.includes('submission')) return 'owned_assignment';
  if (type === 'exercise') return 'exercise_pack';
  if (type === 'lecture' || type === 'slides' || lower.includes('canvas') || lower.includes('foreles')) return 'canvas_lecture';
  if (ext === '.doc' || ext === '.docx' || ext === '.txt' || ext === '.md' || ext === '.rtf') return 'personal_notes';
  return 'personal_notes';
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

function suggestedUseForRole(role, subject, topics) {
  const topicText = topics && topics.length ? ` Tema: ${topics.join(', ')}.` : '';
  const uses = {
    canvas_lecture: 'Kilde for metodekort, fagmemo og begrepsforklaringer.',
    personal_notes: 'Prioritert kilde for personlig arbeidsmåte, fallgruver og kort.',
    personal_memo: 'Førstekilde for onboarding, anbefalt økt og personlige fallgruver.',
    exam_archive: 'Kilde for eksamensradar, oppgavetyper og beskyttet eksamensflyt.',
    sensor_guide: 'Kilde for sjekklister, poengkriterier og eksamensnær kvalitetssikring.',
    answer_example: 'Brukes kun som beskyttet sammenligning etter eget forsøk.',
    exercise_pack: 'Kilde for oppgavebank, regnedrill og eksamensnære økter.',
    spreadsheet: 'Kilde for fasitkontroll, regneoppsett og scenariooppgaver.',
    owned_assignment: 'Kilde for skrivekort, strukturmaler og presentasjonsdrill.'
  };
  return `${subject}: ${uses[role] || 'Kilde for manuell vurdering.'}${topicText}`;
}

function reviewStatusForRole(role) {
  if (role === 'answer_example' || role === 'sensor_guide' || role === 'exam_archive') return 'protected_review_required';
  return 'manual_quality_review';
}

function publishPolicyForRole(role) {
  if (role === 'answer_example' || role === 'sensor_guide' || role === 'exam_archive') return 'metadata_only_until_explicit_clearance';
  return 'derived_content_only';
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
  const type = inferType(item.ext, item.absolute);
  const topics = inferTopics(item.absolute);
  const sourceRole = inferSourceRole(item.ext, item.absolute, type);
  return {
    id: `${subject.toLowerCase()}-${basename(item.absolute).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)}`,
    subject,
    title: basename(item.absolute, item.ext),
    type,
    sourceRole,
    extension: item.ext.replace(/^\./, ''),
    sourcePath: relative('/Users/birkhaugnes', item.absolute),
    bytes: item.stats.size,
    modifiedAt: item.stats.mtime.toISOString(),
    topics,
    rights: subject === 'UNKNOWN' ? 'needs_review' : 'local_private_source',
    status: subject === 'UNKNOWN' ? 'needs_subject_review' : 'candidate',
    reviewStatus: subject === 'UNKNOWN' ? 'needs_subject_review' : reviewStatusForRole(sourceRole),
    publishPolicy: publishPolicyForRole(sourceRole),
    suggestedUse: suggestedUseForRole(sourceRole, subject, topics),
    textSnippet: extractSnippet(item.absolute, item.ext)
  };
}

function groupBySubject(records) {
  const grouped = {};
  records.forEach((record) => {
    if (!grouped[record.subject]) grouped[record.subject] = [];
    grouped[record.subject].push(record);
  });
  return grouped;
}

function countBy(items, field) {
  return items.reduce((acc, item) => {
    const key = item[field] || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function curatedSources(records) {
  return records
    .slice()
    .sort((a, b) => {
      const roleScore = rolePriority.indexOf(a.sourceRole) - rolePriority.indexOf(b.sourceRole);
      if (roleScore) return roleScore;
      if ((b.topics || []).length !== (a.topics || []).length) return (b.topics || []).length - (a.topics || []).length;
      return new Date(b.modifiedAt) - new Date(a.modifiedAt);
    })
    .slice(0, 12)
    .map((record) => ({
      id: record.id,
      title: record.title,
      sourceRole: record.sourceRole,
      type: record.type,
      sourcePath: record.sourcePath,
      topics: record.topics,
      reviewStatus: record.reviewStatus,
      publishPolicy: record.publishPolicy,
      suggestedUse: record.suggestedUse
    }));
}

function contentProposal(subject, records) {
  const blueprint = subjectBlueprints[subject] || { methods: [], questions: [], radar: [] };
  const sourceRoles = countBy(records, 'sourceRole');
  return {
    targetQuality: 'exam_ready',
    deckTargets: blueprint.methods.map((method, index) => ({
      title: `${subject} ${method}`,
      targetCards: index === 0 ? 10 : 8,
      sourceRoles: Object.keys(sourceRoles).slice(0, 4),
      status: 'needs_manual_review'
    })),
    questionTargets: blueprint.questions.map((topic) => ({
      topic,
      targetQuestions: 2,
      status: 'needs_manual_review'
    })),
    methodSheet: blueprint.methods.map((method) => [method, `Lag kontrollpunkt og eksamenssjekk for ${method}.`, subject]),
    examRadarTopics: blueprint.radar.map((topic, index) => [topic, 'Prioriteres fra lokale kilder og tidligere eksamensmønstre.', index < 2 ? 'Høy' : 'Middels']),
    rightsNote: 'Publiser bare bearbeidede kort/oppgaver. Rå Canvas-, sensor- og A-besvarelsesfiler holdes private.'
  };
}

function subjectPackages(records) {
  const grouped = groupBySubject(records);
  return Object.keys(grouped)
    .filter((subject) => subject !== 'UNKNOWN')
    .sort()
    .map((subject) => {
      const items = grouped[subject];
      return {
        subject,
        recordCount: items.length,
        sourceRoles: countBy(items, 'sourceRole'),
        fileTypes: countBy(items, 'type'),
        curatedSources: curatedSources(items),
        contentProposal: contentProposal(subject, items)
      };
    });
}

const files = [];
scanRoots.forEach((scanRoot) => walk(scanRoot, files));
const records = files.slice(0, limit || files.length).map(makeRecord);
const payload = {
  generatedAt: new Date().toISOString(),
  roots: scanRoots,
  v1SourceRoles,
  count: records.length,
  subjectPackages: subjectPackages(records),
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
