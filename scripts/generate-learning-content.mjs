import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const inputPath = join(root, 'data', 'learning-content.json');
const outputPath = join(root, 'shared', 'learning-content.js');
const checkOnly = process.argv.includes('--check');

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function compactCode(value) {
  return String(value || '').toUpperCase().replace(/[\s_-]+/g, '');
}

function aliasKey(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function pushMissing(errors, label, object, fields) {
  fields.forEach((field) => {
    if (!hasText(object[field])) errors.push(`${label} mangler ${field}`);
  });
}

function subjectAliases(subjects) {
  const aliases = {};
  subjects.forEach((subject) => {
    [subject.id, subject.code, compactCode(subject.code), aliasKey(subject.id), aliasKey(subject.code)].forEach((alias) => {
      if (alias) aliases[alias] = subject.id;
    });
    if (subject.id === 'subj_sol1') aliases.sol1 = 'subj_sol1';
  });
  return aliases;
}

function subjectKey(value, aliases) {
  const raw = String(value || '').trim();
  return aliases[raw] || aliases[aliasKey(raw)] || aliases[compactCode(raw)] || aliasKey(raw);
}

function validate(data) {
  const errors = [];
  if (!hasText(data.version)) errors.push('Katalogen mangler version');
  if (!hasText(data.updatedAt)) errors.push('Katalogen mangler updatedAt');
  if (!Array.isArray(data.subjects)) errors.push('subjects må være en liste');
  if (!Array.isArray(data.sources)) errors.push('sources må være en liste');
  if (!data.decks || typeof data.decks !== 'object' || Array.isArray(data.decks)) errors.push('decks må være et fagindeksert objekt');
  if (!Array.isArray(data.questions)) errors.push('questions må være en liste');
  if (!data.examAnalyses || typeof data.examAnalyses !== 'object' || Array.isArray(data.examAnalyses)) errors.push('examAnalyses må være et fagindeksert objekt');
  if (!data.formulaItems || typeof data.formulaItems !== 'object' || Array.isArray(data.formulaItems)) errors.push('formulaItems må være et fagindeksert objekt');
  if (!data.learningPaths || typeof data.learningPaths !== 'object' || Array.isArray(data.learningPaths)) errors.push('learningPaths må være et fagindeksert objekt');
  if (!data.memos || typeof data.memos !== 'object' || Array.isArray(data.memos)) errors.push('memos må være et fagindeksert objekt');
  if (!data.recommendations || typeof data.recommendations !== 'object' || Array.isArray(data.recommendations)) errors.push('recommendations må være et fagindeksert objekt');
  if (errors.length) return errors;

  const aliases = subjectAliases(data.subjects);
  const subjectIds = new Set(data.subjects.map((subject) => subject.id));
  const sourceIds = new Set();

  data.subjects.forEach((subject, index) => {
    pushMissing(errors, `subjects[${index}]`, subject, ['id', 'code', 'name', 'accent', 'lead', 'sourceSummary', 'defaultHref', 'flashcardsHref']);
    if (subjectIds.has(subject.id) && data.subjects.filter((item) => item.id === subject.id).length > 1) errors.push(`Duplisert fag-id: ${subject.id}`);
  });

  data.sources.forEach((source, index) => {
    pushMissing(errors, `sources[${index}]`, source, ['id', 'subject', 'title', 'type', 'sourcePath', 'rights', 'status', 'suggestedUse']);
    if (source.id) {
      if (sourceIds.has(source.id)) errors.push(`Duplisert kilde-id: ${source.id}`);
      sourceIds.add(source.id);
    }
    if (source.subject && !subjectIds.has(subjectKey(source.subject, aliases))) errors.push(`sources[${index}] peker til ukjent fag: ${source.subject}`);
  });

  Object.entries(data.decks).forEach(([subject, decks]) => {
    const key = subjectKey(subject, aliases);
    if (!subjectIds.has(key)) errors.push(`decks.${subject} peker til ukjent fag`);
    if (!Array.isArray(decks)) {
      errors.push(`decks.${subject} må være en liste`);
      return;
    }
    decks.forEach((deck, deckIndex) => {
      pushMissing(errors, `decks.${subject}[${deckIndex}]`, deck, ['id', 'title', 'status']);
      if (!hasArray(deck.sourceIds)) errors.push(`decks.${subject}[${deckIndex}] mangler sourceIds`);
      (deck.sourceIds || []).forEach((sourceId) => {
        if (!sourceIds.has(sourceId)) errors.push(`decks.${subject}[${deckIndex}] peker til ukjent kilde: ${sourceId}`);
      });
      if (!hasArray(deck.cards)) errors.push(`decks.${subject}[${deckIndex}] mangler cards`);
      (deck.cards || []).forEach((card, cardIndex) => {
        pushMissing(errors, `decks.${subject}[${deckIndex}].cards[${cardIndex}]`, card, ['q', 'a', 'topic', 'tag', 'source']);
      });
    });
  });

  data.questions.forEach((question, index) => {
    pushMissing(errors, `questions[${index}]`, question, ['id', 'subject', 'title', 'source', 'topic', 'difficulty', 'prompt']);
    if (!hasArray(question.checklist)) errors.push(`questions[${index}] mangler checklist`);
    if (!Number.isFinite(Number(question.minutes))) errors.push(`questions[${index}] mangler gyldig minutes`);
    if (question.subject && !subjectIds.has(subjectKey(question.subject, aliases))) errors.push(`questions[${index}] peker til ukjent fag: ${question.subject}`);
  });

  Object.entries(data.examAnalyses).forEach(([subject, analysis]) => {
    const key = subjectKey(subject, aliases);
    if (!subjectIds.has(key)) errors.push(`examAnalyses.${subject} peker til ukjent fag`);
    pushMissing(errors, `examAnalyses.${subject}`, analysis, ['code', 'name', 'summary']);
    if (!hasArray(analysis.topics)) errors.push(`examAnalyses.${subject} mangler topics`);
  });

  Object.entries(data.formulaItems).forEach(([subject, items]) => {
    const key = subjectKey(subject, aliases);
    if (!subjectIds.has(key)) errors.push(`formulaItems.${subject} peker til ukjent fag`);
    if (!hasArray(items)) errors.push(`formulaItems.${subject} mangler elementer`);
  });

  Object.entries(data.learningPaths).forEach(([subject, steps]) => {
    const key = subjectKey(subject, aliases);
    if (!subjectIds.has(key)) errors.push(`learningPaths.${subject} peker til ukjent fag`);
    if (!hasArray(steps)) errors.push(`learningPaths.${subject} mangler steg`);
    (steps || []).forEach((step, index) => {
      pushMissing(errors, `learningPaths.${subject}[${index}]`, step, ['title', 'detail', 'duration', 'kind']);
    });
  });

  Object.entries(data.memos).forEach(([subject, memo]) => {
    const key = subjectKey(subject, aliases);
    if (!subjectIds.has(key)) errors.push(`memos.${subject} peker til ukjent fag`);
    pushMissing(errors, `memos.${subject}`, memo, ['intro', 'exam', 'studyAdvice']);
  });

  Object.entries(data.recommendations).forEach(([subject, recommendation]) => {
    const key = subjectKey(subject, aliases);
    if (!subjectIds.has(key)) errors.push(`recommendations.${subject} peker til ukjent fag`);
    pushMissing(errors, `recommendations.${subject}`, recommendation, ['title', 'sub', 'href']);
    if (!Number.isFinite(Number(recommendation.cards))) errors.push(`recommendations.${subject} mangler gyldig cards`);
    if (!Number.isFinite(Number(recommendation.minutes))) errors.push(`recommendations.${subject} mangler gyldig minutes`);
  });

  return errors;
}

function runtimeSource(data) {
  const aliases = subjectAliases(data.subjects);
  const json = JSON.stringify({ data, aliases }, null, 2);
  return `// Generated by scripts/generate-learning-content.mjs. Edit data/learning-content.json instead.
(function (window) {
  'use strict';

  var payload = ${json};
  var data = payload.data;
  var aliases = payload.aliases;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function code(value) {
    return String(value || '').toUpperCase().replace(/[\\s_-]+/g, '');
  }

  function aliasKey(value) {
    return String(value || '').trim().toLowerCase().replace(/[\\s-]+/g, '_');
  }

  function key(value) {
    var raw = String(value || '').trim();
    return aliases[raw] || aliases[aliasKey(raw)] || aliases[code(raw)] || aliasKey(raw);
  }

  function subjectFor(value) {
    var wanted = key(value);
    return data.subjects.find(function (subject) { return subject.id === wanted; }) || null;
  }

  function subjectCode(value) {
    var subject = subjectFor(value);
    return subject ? subject.code : code(value);
  }

  function sourceSubjectKey(source) {
    return key(source.subject);
  }

  function sourcesFor(value) {
    var wanted = key(value);
    return clone(data.sources.filter(function (source) { return sourceSubjectKey(source) === wanted; }));
  }

  function decksFor(value) {
    var wanted = key(value);
    var direct = data.decks[wanted] || data.decks[aliasKey(value)] || [];
    return clone(direct);
  }

  function questionsFor(value) {
    if (!value) return clone(data.questions);
    var wanted = key(value);
    return clone(data.questions.filter(function (question) { return key(question.subject) === wanted; }));
  }

  function keyedLookup(map, value) {
    var wanted = key(value);
    return map[wanted] || map[aliasKey(value)] || map[subjectCode(value)] || null;
  }

  function analysisFor(value) {
    return clone(keyedLookup(data.examAnalyses, value));
  }

  function formulaItemsFor(value) {
    return clone(keyedLookup(data.formulaItems, value) || []);
  }

  function learningPathFor(value) {
    return clone(keyedLookup(data.learningPaths, value) || []);
  }

  function memoFor(value) {
    var subject = subjectFor(value);
    var memo = keyedLookup(data.memos, value);
    if (memo) return clone(memo);
    if (!subject) return null;
    return {
      intro: subject.lead,
      exam: 'Faget bruker samme fagsidemal: oversikt, begrep eller formel, oppgaver, eksamensflyt og refleksjon.',
      studyAdvice: 'Start med memo og læringssti, ta en kort økt, og bruk neste anbefalte steg for å holde progresjonen i gang.'
    };
  }

  function recommendationFor(value) {
    var subject = subjectFor(value);
    var recommendation = keyedLookup(data.recommendations, value);
    if (recommendation) return clone(recommendation);
    if (!subject) return null;
    return { title: subject.code + ': første økt', sub: 'Anbefalt start', cards: 10, minutes: 20, href: subject.flashcardsHref };
  }

  function notes() {
    return Object.keys(data.memos).map(function (memoKey) {
      var subject = subjectFor(memoKey);
      var memo = data.memos[memoKey];
      return {
        id: 'memo-' + key(memoKey),
        title: (subject ? subject.code : subjectCode(memoKey)) + ' memo',
        subject: subject ? subject.code : subjectCode(memoKey),
        tags: 'memo, arbeidsmate',
        body: memo.intro + '\\n\\n' + memo.studyAdvice
      };
    });
  }

  function percentFromTopic(topic, fallback) {
    var score = Number(topic && topic[3]);
    if (Number.isFinite(score) && score > 0) return Math.max(45, Math.min(95, Math.round(score * 10))) + '%';
    return fallback || '68%';
  }

  function topicsForPage(subject) {
    var analysis = analysisFor(subject.id);
    if (analysis && analysis.topics && analysis.topics.length) {
      return analysis.topics.slice(0, 4).map(function (topic, index) {
        return [topic[0], topic[1] || topic[2] || 'Prioritert tema', percentFromTopic(topic, ['84%', '74%', '66%', '58%'][index])];
      });
    }
    var seen = {};
    var sourceTopics = [];
    sourcesFor(subject.id).forEach(function (source) {
      (source.topics || []).forEach(function (topic) {
        if (seen[topic]) return;
        seen[topic] = true;
        sourceTopics.push([topic, 'Bygges fra lokalt kildegrunnlag', sourceTopics.length === 0 ? '72%' : sourceTopics.length === 1 ? '64%' : '56%']);
      });
    });
    return sourceTopics.slice(0, 4);
  }

  function toolsForPage(subject) {
    return [
      ['▦', 'Fagmemo', 'Kort arbeidsmåte, eksamensform og beste start for faget.', 'Start', '#memo', subject.accent],
      ['✓', 'Flashcards', 'Korte kort fra katalogen og eksisterende fagpakker.', 'Kort', subject.flashcardsHref, subject.accent],
      ['▣', 'Oppgavebank', 'Eksamensnære oppgaver filtrert på fag og tema.', 'Oppgaver', '../user/oppgavebank.html?subject=' + encodeURIComponent(subject.code), '#2f62ff'],
      ['◈', 'Eksamensradar', 'Prioriter tema etter kilder, sensor og tidligere eksamen.', 'Radar', '#eksamensradar', '#e8bc68']
    ];
  }

  function sourceRowsForPage(subject) {
    return sourcesFor(subject.id).slice(0, 5).map(function (source) {
      return [source.title, source.suggestedUse];
    });
  }

  function canvasRowsForPage(subject) {
    return sourcesFor(subject.id).slice(0, 5).map(function (source) {
      return [source.title, source.sourcePath + ' · ' + source.status, source.type];
    });
  }

  function practiceForPage(subject) {
    var decks = decksFor(subject.id);
    var cards = [];
    decks.forEach(function (deck) {
      (deck.cards || []).forEach(function (card) {
        if (cards.length >= 3) return;
        cards.push([card.tag || card.topic, card.q, 'Kilde: ' + card.source, card.a, card.topic || 'Svar kort og presist.']);
      });
    });
    if (!cards.length) return null;
    return { label: 'Kildekort', intro: 'Hurtigkort laget fra den felles læringskatalogen.', cards: cards };
  }

  function checklistForPage(subject) {
    var question = questionsFor(subject.id)[0];
    if (!question || !question.checklist) return [];
    return question.checklist.map(function (item, index) {
      return [index === 0 ? 'Start' : index === 1 ? 'Metode' : 'Svar', item, question.topic];
    });
  }

  function pageFor(value) {
    var subject = subjectFor(value);
    if (!subject) return null;
    var sources = sourcesFor(subject.id);
    var decks = decksFor(subject.id);
    var cards = decks.reduce(function (sum, deck) { return sum + (deck.cards || []).length; }, 0);
    var analysis = analysisFor(subject.id);
    var path = learningPathFor(subject.id);
    return {
      id: subject.id,
      code: subject.code,
      name: subject.name,
      kicker: subject.stage === 'rich' ? 'Plattformklar fagpakke' : subject.stage === 'mvp_gap' ? 'MVP-løft' : 'Strukturert fagmal',
      accent: subject.accent,
      progress: subject.stage === 'rich' ? '62%' : subject.stage === 'ready_for_import' ? '42%' : subject.stage === 'mvp_gap' ? '34%' : '28%',
      lead: subject.lead,
      stats: [[String(sources.length), 'kilder'], [String(cards || decks.length), cards ? 'kort fra katalogen' : 'kortpakker'], [subject.stage === 'rich' ? 'Aktiv' : 'Bygges', 'plattform']],
      tools: toolsForPage(subject),
      topics: topicsForPage(subject),
      plan: (path.length ? path : [
        { title: '1. Oversikt', detail: 'Les memo og se kildegrunnlag.', duration: '10 min' },
        { title: '2. Kort', detail: 'Ta første kortøkt.', duration: '20 min' },
        { title: '3. Oppgave', detail: 'Løs en eksamensnær oppgave.', duration: '30 min' }
      ]).map(function (step) { return [step.title, step.detail, step.duration]; }),
      sources: sourceRowsForPage(subject),
      canvasMaterials: canvasRowsForPage(subject),
      formulaSheet: formulaItemsFor(subject.id),
      memo: memoFor(subject.id),
      examRadar: analysis ? {
        label: 'Kildebasert prioritet',
        summary: analysis.summary,
        accent: subject.accent,
        rows: analysis.topics.map(function (topic, index) {
          return [topic[0], topic[1], percentFromTopic(topic, ['86%', '76%', '66%', '58%'][index])];
        })
      } : null,
      practice: practiceForPage(subject),
      examChecklist: checklistForPage(subject),
      next: recommendationFor(subject.id).title
    };
  }

  window.HaugnesLearningContent = {
    version: data.version,
    updatedAt: data.updatedAt,
    subjects: clone(data.subjects),
    sources: clone(data.sources),
    decks: clone(data.decks),
    questions: clone(data.questions),
    examAnalyses: clone(data.examAnalyses),
    formulaItems: clone(data.formulaItems),
    learningPaths: clone(data.learningPaths),
    memos: clone(data.memos),
    recommendations: clone(data.recommendations),
    clone: clone,
    code: code,
    key: key,
    bySubject: function (items, value) {
      var wanted = key(value);
      return clone((items || []).filter(function (item) { return key(item.subject) === wanted; }));
    },
    getSubject: function (value) { return clone(subjectFor(value)); },
    sourcesFor: sourcesFor,
    decksFor: decksFor,
    allQuestions: function () { return clone(data.questions); },
    questionsFor: questionsFor,
    analysisFor: analysisFor,
    formulaItemsFor: formulaItemsFor,
    learningPathFor: learningPathFor,
    memoFor: memoFor,
    recommendationFor: recommendationFor,
    notes: function () { return clone(notes()); },
    pageFor: pageFor
  };
})(window);
`;
}

const data = readJson(inputPath);
const errors = validate(data);
if (errors.length) {
  console.error('Learning content validation failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const generated = runtimeSource(data);
if (checkOnly) {
  if (!existsSync(outputPath)) fail(`${relative(root, outputPath)} finnes ikke. Kjor npm run learning:generate.`);
  const current = readFileSync(outputPath, 'utf8');
  if (current !== generated) fail(`${relative(root, outputPath)} er ikke oppdatert. Kjor npm run learning:generate.`);
  console.log('Learning content is valid and generated output is up to date.');
} else {
  writeFileSync(outputPath, generated);
  console.log(`Generated ${relative(root, outputPath)} from ${relative(root, inputPath)}.`);
}
