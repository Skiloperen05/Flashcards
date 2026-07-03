import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const inputPath = join(root, 'data', 'learning-content.json');
const outputPath = join(root, 'shared', 'learning-content.js');
const checkOnly = process.argv.includes('--check');
const V1_MIN_CARDS = 25;
const V1_MIN_QUESTIONS = 8;

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
  if (data.v1 && typeof data.v1 !== 'object') errors.push('v1 må være et objekt');
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
    pushMissing(errors, `subjects[${index}]`, subject, ['toolProfile', 'qualityStatus', 'qualityTarget', 'preferredStudyMethod']);
    if (subjectIds.has(subject.id) && data.subjects.filter((item) => item.id === subject.id).length > 1) errors.push(`Duplisert fag-id: ${subject.id}`);
    if (!hasArray(subject.primaryTools)) errors.push(`subjects[${index}] mangler primaryTools`);
    (subject.primaryTools || []).forEach((tool, toolIndex) => {
      pushMissing(errors, `subjects[${index}].primaryTools[${toolIndex}]`, tool, ['icon', 'title', 'description', 'status', 'href']);
    });
    if (!subject.personalNotes || typeof subject.personalNotes !== 'object' || Array.isArray(subject.personalNotes)) {
      errors.push(`subjects[${index}] mangler personalNotes`);
    } else {
      pushMissing(errors, `subjects[${index}].personalNotes`, subject.personalNotes, ['summary']);
      if (!hasArray(subject.personalNotes.sourceIds)) errors.push(`subjects[${index}].personalNotes mangler sourceIds`);
      if (!hasArray(subject.personalNotes.useInApp)) errors.push(`subjects[${index}].personalNotes mangler useInApp`);
    }
    if (!hasArray(subject.personalWarnings)) errors.push(`subjects[${index}] mangler personalWarnings`);
  });

  data.sources.forEach((source, index) => {
    pushMissing(errors, `sources[${index}]`, source, ['id', 'subject', 'title', 'type', 'sourceRole', 'sourcePath', 'rights', 'status', 'suggestedUse']);
    if (source.id) {
      if (sourceIds.has(source.id)) errors.push(`Duplisert kilde-id: ${source.id}`);
      sourceIds.add(source.id);
    }
    if (source.subject && !subjectIds.has(subjectKey(source.subject, aliases))) errors.push(`sources[${index}] peker til ukjent fag: ${source.subject}`);
  });

  data.subjects.forEach((subject, index) => {
    ((subject.personalNotes && subject.personalNotes.sourceIds) || []).forEach((sourceId) => {
      if (!sourceIds.has(sourceId)) errors.push(`subjects[${index}].personalNotes peker til ukjent kilde: ${sourceId}`);
    });
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

  data.subjects.forEach((subject) => {
    if (subject.qualityStatus !== 'exam_ready') return;
    const decks = data.decks[subject.id] || [];
    const cardCount = decks.reduce((sum, deck) => sum + ((deck.cards || []).length), 0);
    const questionCount = data.questions.filter((question) => subjectKey(question.subject, aliases) === subject.id).length;
    const formulaCount = (keyedMapLookup(data.formulaItems, subject, aliases) || []).length;
    const pathCount = (keyedMapLookup(data.learningPaths, subject, aliases) || []).length;
    const analysis = keyedMapLookup(data.examAnalyses, subject, aliases);
    const memo = keyedMapLookup(data.memos, subject, aliases);
    const recommendation = keyedMapLookup(data.recommendations, subject, aliases);
    if (cardCount < V1_MIN_CARDS) errors.push(`${subject.code} er exam_ready, men har bare ${cardCount}/${V1_MIN_CARDS} kort`);
    if (questionCount < V1_MIN_QUESTIONS) errors.push(`${subject.code} er exam_ready, men har bare ${questionCount}/${V1_MIN_QUESTIONS} oppgaver`);
    if (formulaCount < 3) errors.push(`${subject.code} er exam_ready, men mangler metodeark/formelark med minst 3 punkter`);
    if (pathCount < 3) errors.push(`${subject.code} er exam_ready, men mangler læringssti`);
    if (!analysis || !hasArray(analysis.topics)) errors.push(`${subject.code} er exam_ready, men mangler eksamensradar`);
    if (!memo) errors.push(`${subject.code} er exam_ready, men mangler fagmemo`);
    if (!recommendation) errors.push(`${subject.code} er exam_ready, men mangler anbefalt neste økt`);
  });

  return errors;
}

function keyedMapLookup(map, subject, aliases) {
  return map[subject.id] || map[subject.code] || map[aliasKey(subject.code)] || map[subjectKey(subject.code, aliases)] || null;
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

  function toolsFor(value) {
    var subject = subjectFor(value);
    return clone(subject && subject.primaryTools ? subject.primaryTools : []);
  }

  function roleLabel(role) {
    var labels = {
      canvas_lecture: 'Canvas',
      canvas_export: 'Canvas-eksport',
      exam_archive: 'Eksamen/sensor',
      protected_exam_pack: 'Beskyttet eksamenspakke',
      exam_and_method_notes: 'Eksamen + metode',
      canvas_and_spreadsheet: 'Canvas + regneark',
      personal_notes: 'Egne notater',
      personal_memo: 'Memoar',
      canvas_and_exam: 'Canvas + eksamen',
      local_exercise_pack: 'Lokale oppgaver',
      owned_assignment: 'Egne innleveringer',
      canvas_and_personal_notes: 'Canvas + egne notater'
    };
    return labels[role] || role || 'Kilde';
  }

  function sourceRolesFor(value) {
    var subject = subjectFor(value);
    var sources = sourcesFor(value);
    var roles = {};
    sources.forEach(function (source) {
      var role = source.sourceRole || 'unknown';
      roles[role] = (roles[role] || 0) + 1;
    });
    return {
      code: subject ? subject.code : subjectCode(value),
      roles: roles,
      sources: sources.map(function (source) {
        return {
          id: source.id,
          title: source.title,
          role: source.sourceRole,
          roleLabel: roleLabel(source.sourceRole),
          status: source.status,
          suggestedUse: source.suggestedUse
        };
      })
    };
  }

  function qualityFor(value) {
    var subject = subjectFor(value);
    if (!subject) return null;
    var decks = decksFor(subject.id);
    var cards = decks.reduce(function (sum, deck) { return sum + (deck.cards || []).length; }, 0);
    return {
      code: subject.code,
      status: subject.qualityStatus,
      target: subject.qualityTarget,
      stage: subject.stage,
      sourceSummary: subject.sourceSummary,
      sourceCount: sourcesFor(subject.id).length,
      deckCount: decks.length,
      cardCount: cards,
      questionCount: questionsFor(subject.id).length
    };
  }

  function personalMemoFor(value) {
    var subject = subjectFor(value);
    if (!subject) return null;
    return {
      code: subject.code,
      memo: memoFor(subject.id),
      preferredStudyMethod: subject.preferredStudyMethod,
      notes: clone(subject.personalNotes || null),
      warnings: clone(subject.personalWarnings || [])
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
        topic: 'Arbeidsmåte',
        questionType: 'memo',
        source: 'learning_catalog',
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
    if (subject.primaryTools && subject.primaryTools.length) {
      return subject.primaryTools.map(function (tool) {
        return [tool.icon, tool.title, tool.description, tool.status, tool.href, tool.accent || subject.accent];
      });
    }
    return [
      ['▦', 'Fagmemo', 'Kort arbeidsmåte, eksamensform og beste start for faget.', 'Start', '#memo', subject.accent],
      ['✓', 'Flashcards', 'Korte kort fra katalogen og eksisterende fagpakker.', 'Kort', subject.flashcardsHref, subject.accent],
      ['▣', 'Oppgavebank', 'Eksamensnære oppgaver filtrert på fag og tema.', 'Oppgaver', '../user/oppgavebank.html?subject=' + encodeURIComponent(subject.code), '#2f62ff'],
      ['◈', 'Eksamensradar', 'Prioriter tema etter kilder, sensor og tidligere eksamen.', 'Radar', '#eksamensradar', '#e8bc68']
    ];
  }

  function sourceRowsForPage(subject) {
    return sourcesFor(subject.id).slice(0, 5).map(function (source) {
      return [source.title, roleLabel(source.sourceRole) + ': ' + source.suggestedUse];
    });
  }

  function canvasRowsForPage(subject) {
    return sourcesFor(subject.id).slice(0, 5).map(function (source) {
      return [source.title, roleLabel(source.sourceRole) + ' · ' + source.sourcePath + ' · ' + source.status, source.type];
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

  function kickerForPage(subject) {
    if (subject.qualityStatus === 'exam_ready') return 'Eksamensklar V1';
    if (subject.stage === 'rich') return 'Plattformklar fagpakke';
    if (subject.stage === 'mvp_gap') return 'MVP-løft';
    return 'Strukturert fagmal';
  }

  function progressForPage(subject) {
    if (subject.qualityStatus === 'exam_ready') return '100%';
    if (subject.stage === 'rich') return '62%';
    if (subject.stage === 'ready_for_import') return '42%';
    if (subject.stage === 'mvp_gap') return '34%';
    return '28%';
  }

  function statusForPage(subject) {
    if (subject.qualityStatus === 'exam_ready') return 'Eksamensklar';
    return subject.stage === 'rich' ? 'Aktiv' : 'Bygges';
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
      kicker: kickerForPage(subject),
      accent: subject.accent,
      progress: progressForPage(subject),
      lead: subject.lead,
      toolProfile: subject.toolProfile,
      qualityStatus: subject.qualityStatus,
      qualityTarget: subject.qualityTarget,
      preferredStudyMethod: subject.preferredStudyMethod,
      personalNotes: subject.personalNotes,
      personalWarnings: subject.personalWarnings,
      stats: [[String(sources.length), 'kilder'], [String(cards || decks.length), cards ? 'kort fra katalogen' : 'kortpakker'], [statusForPage(subject), 'V1-status']],
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
    v1: clone(data.v1 || null),
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
    toolsFor: toolsFor,
    qualityFor: qualityFor,
    personalMemoFor: personalMemoFor,
    sourceRolesFor: sourceRolesFor,
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
