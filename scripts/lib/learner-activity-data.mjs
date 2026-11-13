import { createHash } from 'node:crypto';
import { decodeProgress } from '../../lib/learner/decode-progress.mjs';
import { parsePersistedStudyEvent } from '../../lib/learner/telemetry.ts';
import { objectiveTopicMap, questionObjectiveIds } from '../../lib/question-objectives.mjs';

export const DAY = 86_400_000;
export const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const validTime = value => Number.isInteger(value) && value >= 0 && Number.isFinite(new Date(value).getTime());
const ids = value => Array.isArray(value) && value.every(id => typeof id === 'string') && new Set(value).size === value.length;
const hash = value => createHash('sha256').update(value).digest('hex');
export const sourceHash = id => hash(`study-source-v1\0${id}`).slice(0, 24);
const unique = values => [...new Set(values)];

// Output allowlist. Provider records, profile fields and free-form text never pass through.
export const ACTIVITY_FIELDS = [
  'timestamp', 'eventType', 'questionId', 'examId', 'certification', 'topicId', 'objectiveId',
  'sourceContext', 'sourceHash', 'selectedAnswer', 'correctAnswer', 'isCorrect', 'missCount',
  'resourceType', 'questionCount', 'correctCount', 'missedCount', 'confidence', 'scoringEvidence',
];

export function bankIndex(content) {
  const exams = new Map(content.objectives.exams.map(e => [e.code, e]));
  const topics = new Map(content.topics.map(t => [t.id, t]));
  const bank = new Map();
  let rejectedQuestions = 0;
  for (const q of content.questions) {
    const answers = Array.isArray(q.answer) ? q.answer : [q.answer];
    const codes = unique(q.examCodes ?? topics.get(q.topicId)?.examCodes ?? []).filter(code => exams.has(code));
    const valid = typeof q.id === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(q.id)
      && topics.has(q.topicId) && typeof q.prompt === 'string' && q.prompt.trim()
      && Array.isArray(q.choices) && q.choices.length >= 2 && q.choices.every(c => typeof c === 'string' && c.trim())
      && answers.length && unique(answers).length === answers.length
      && answers.every(i => Number.isInteger(i) && i >= 0 && i < q.choices.length)
      && typeof q.explanation === 'string' && q.explanation.trim() && codes.length;
    if (!valid) { rejectedQuestions++; continue; }
    if (bank.has(q.id)) throw new Error('duplicate_bank_id');
    const objectives = new Map(codes.map(code => {
      const exam = exams.get(code), valid = new Set(exam.domains.flatMap(d => d.objectives.map(o => o.id)));
      const mapped = ['clf-c02', 'saa-c03'].includes(code) && !Array.isArray(q.objectiveIds?.[code]) ? []
        : questionObjectiveIds(q, code, objectiveTopicMap(exam));
      return [code, unique(mapped.filter(id => valid.has(id))).sort(cmp)];
    }));
    bank.set(q.id, { question: q, codes, objectives });
  }
  return { bank, exams, topics, rejectedQuestions };
}

/** Read-only compatibility with immutable generations; never fall back to stale legacy chunks. */
function storedProgress(items) {
  const committed = items.find(item => item.key === 'progress-head');
  if (!committed) {
    return items.some(i => i.key === 'progress' || i.key === 'history' || /^progress-\d+$/.test(i.key))
      ? decodeProgress(items) : { quizAttempts: [], mockAttempts: [], questionEvents: [] };
  }
  const h = committed.data;
  if (!record(h) || h.v !== 1 || typeof h.generation !== 'string'
    || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(h.generation)
    || !Number.isInteger(h.count) || h.count < 1 || h.count > 40
    || !Number.isInteger(h.bytes) || h.bytes < 1 || h.bytes > 1_920_000
    || typeof h.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(h.sha256)) throw new Error('history');
  const byKey = new Map(items.map(i => [i.key, i.data]));
  const chunks = Array.from({ length: h.count }, (_, i) => byKey.get(`progress-snapshot-${h.generation}-${i}`)?.s);
  if (chunks.some(s => typeof s !== 'string' || s.length > 12000)) throw new Error('history');
  const raw = chunks.join('');
  if (Buffer.byteLength(raw) !== h.bytes || hash(raw) !== h.sha256) throw new Error('history');
  // Reuse the strict legacy decoder on the verified JSON without copying other provider items.
  return decodeProgress([{ key: 'progress', data: { s: raw } }, ...items.filter(i => i.key === 'history')]);
}

function telemetry(items, gaps) {
  const records = new Map();
  const independent = items.filter(i => /^telemetry-event-/.test(i.key)).sort((a, b) => cmp(a.key, b.key));
  const complete = items.some(i => i.key === 'telemetry-migration-v1' && i.data?.complete === true);
  const chunks = items.filter(i => /^telemetry-\d+$/.test(i.key)).sort((a, b) => Number(a.key.slice(10)) - Number(b.key.slice(10)));
  if (!complete && chunks.length) {
    try {
      if (chunks.length > 8 || chunks.some((item, i) => item.key !== `telemetry-${i}` || typeof item.data?.s !== 'string' || item.data.s.length > 12000)) throw new Error('history');
      const values = JSON.parse(chunks.map(i => i.data.s).join(''));
      if (!Array.isArray(values)) throw new Error('history');
      values.forEach((e, i) => records.set(`telemetry-event-legacy-${String(i).padStart(6, '0')}`, e));
    } catch {
      if (!independent.length) throw new Error('history');
      gaps.interruptedLegacyTelemetry++;
    }
  }
  for (const item of independent) records.set(item.key, item.data?.e);
  const events = [];
  const keys = ['v', 'type', 'at', 'exam', 'sessionId', 'questionId', 'topicId', 'objectiveId', 'correct', 'missCount', 'resourceType', 'questionCount', 'correctCount', 'missedCount'];
  for (const value of records.values()) {
    try {
      if (!record(value)) throw new Error('history');
      if (Object.keys(value).some(k => !keys.includes(k))) gaps.redactedRecords++;
      const projected = Object.fromEntries(keys.filter(k => value[k] !== undefined).map(k => [k, value[k]]));
      events.push(parsePersistedStudyEvent(projected));
    } catch { gaps.invalidTelemetry++; }
  }
  return events;
}

function selectedIndex(value, q) {
  if (Array.isArray(value) !== Array.isArray(q.answer)) return undefined;
  const values = Array.isArray(value) ? value : [value];
  if (!values.length || unique(values).length !== values.length || values.some(i => !Number.isInteger(i) || i < 0 || i >= q.choices.length)) return undefined;
  return Array.isArray(value) ? [...value].sort((a, b) => a - b) : value;
}

export function collectActivity(items, content, { days = 7, asOf, exam } = {}) {
  if (!validTime(asOf) || !Number.isInteger(days) || days < 1 || days > 365) throw new Error('options');
  if (!Array.isArray(items) || !items.length || items.some(i => !record(i) || typeof i.key !== 'string')
    || new Set(items.map(i => i.key)).size !== items.length) throw new Error('missing_or_invalid_learner');
  const index = bankIndex(content);
  if (exam && !index.exams.has(exam)) throw new Error('options');
  const gaps = { invalidTelemetry: 0, interruptedLegacyTelemetry: 0, redactedRecords: 0, unknownQuestions: 0,
    ambiguousExams: 0, invalidAttempts: 0, aggregateOnlyAttempts: 0, outsideWindow: 0, duplicateRows: 0, supplementalResults: 0, omittedUnvisitedQuestions: 0, invalidObjectives: 0 };
  const rows = [], start = asOf - days * DAY;
  const metadata = (id, code, objective) => {
    const entry = index.bank.get(id);
    if (!entry) { gaps.unknownQuestions++; return null; }
    if (!code) code = entry.codes.length === 1 ? entry.codes[0] : undefined;
    if (!code || !entry.codes.includes(code)) { gaps.ambiguousExams++; return null; }
    if (exam && code !== exam) return null;
    const mapped = entry.objectives.get(code);
    const objectiveId = objective && mapped.includes(objective) ? objective : mapped.length === 1 ? mapped[0] : null;
    if (objective && !mapped.includes(objective)) gaps.invalidObjectives++;
    return { questionId: id, examId: code, certification: index.exams.get(code).name,
      topicId: entry.question.topicId, objectiveId, correctAnswer: structuredClone(entry.question.answer) };
  };
  const add = (at, fields) => {
    if (!validTime(at) || at < start || at > asOf) { gaps.outsideWindow++; return; }
    rows.push({ timestamp: new Date(at).toISOString(), ...fields });
  };
  for (const event of telemetry(items, gaps)) {
    if (exam && event.exam !== exam) continue;
    const meta = event.questionId ? metadata(event.questionId, event.exam, event.objectiveId) : {
      examId: event.exam, certification: index.exams.get(event.exam)?.name,
      ...(index.topics.get(event.topicId)?.examCodes?.includes(event.exam) ? { topicId: event.topicId } : {}),
    };
    if (!meta) continue;
    add(event.at, { ...meta, eventType: event.type, sourceContext: 'telemetry', sourceHash: sourceHash(event.sessionId),
      ...(typeof event.correct === 'boolean' ? { isCorrect: event.correct } : {}),
      ...Object.fromEntries(['missCount', 'resourceType', 'questionCount', 'correctCount', 'missedCount'].filter(k => event[k] !== undefined).map(k => [k, event[k]])) });
  }
  const progress = storedProgress(items);
  for (const [kind, attempts] of [['quiz', progress.quizAttempts ?? []], ['mock', progress.mockAttempts ?? []]]) {
    for (const attempt of attempts) {
      if (!record(attempt)) { gaps.invalidAttempts++; continue; }
      if (!validTime(attempt.at) || attempt.at < start || attempt.at > asOf) { gaps.outsideWindow++; continue; }
      if (!Array.isArray(attempt.questionIds)) { gaps.aggregateOnlyAttempts++; continue; }
      if (kind === 'mock' && !index.exams.has(attempt.exam)) { gaps.invalidAttempts++; continue; }
      const shown = attempt.questionIds, missed = attempt.missedIds;
      const fullMock = kind === 'mock' && attempt.correctIds !== undefined;
      if (!ids(shown) || !shown.length || !ids(missed) || !Number.isInteger(attempt.total) || attempt.total < shown.length
        || !Number.isInteger(attempt.correct) || attempt.correct < 0 || attempt.correct > attempt.total
        || attempt.correct + missed.length !== attempt.total
        || (!fullMock && (attempt.total !== shown.length || missed.some(id => !shown.includes(id))))
        || (fullMock && (!ids(attempt.correctIds) || attempt.correctIds.length !== attempt.correct
          || attempt.correctIds.some(id => missed.includes(id) || !shown.includes(id))
          || shown.some(id => !attempt.correctIds.includes(id) && !missed.includes(id))))) { gaps.invalidAttempts++; continue; }
      if (fullMock) gaps.omittedUnvisitedQuestions += attempt.total - shown.length;
      const candidates = shown.map(id => index.bank.get(id)?.codes ?? []);
      const coherent = candidates.length ? candidates[0].filter(code => candidates.every(codes => codes.includes(code))) : [];
      for (const id of shown) {
        const code = kind === 'mock' ? attempt.exam : coherent.length === 1 ? coherent[0] : undefined;
        const meta = metadata(id, code, attempt.objectiveByQuestion?.[id]);
        if (!meta) continue;
        const q = index.bank.get(id).question;
        const pick = selectedIndex(attempt.selectedChoices?.[id] ?? attempt.wrongChoices?.[id], q);
        const sure = ids(attempt.sureIds) && attempt.sureIds.includes(id), guess = ids(attempt.guessedIds) && attempt.guessedIds.includes(id);
        const confidence = sure === guess ? undefined : sure ? 'sure' : 'guess';
        add(attempt.at, { ...meta, eventType: 'question_answered', sourceContext: `${kind}-progress`, isCorrect: !missed.includes(id),
          ...(pick !== undefined ? { selectedAnswer: pick } : {}), ...(confidence ? { confidence } : {}) });
      }
    }
  }
  for (const event of progress.questionEvents ?? []) {
    if (!record(event) || typeof event.correct !== 'boolean') { gaps.invalidAttempts++; continue; }
    const meta = metadata(event.questionId, event.exam, event.objective);
    if (meta) add(typeof event.timestamp === 'number' ? event.timestamp : Date.parse(event.timestamp), {
      ...meta, eventType: 'question_answered', sourceContext: 'history', isCorrect: event.correct,
    });
  }
  // Event identity excludes outcome, so contradictory copies cannot masquerade as two attempts.
  const deduped = new Map();
  for (const row of rows) {
    const key = JSON.stringify([row.timestamp, row.eventType, row.questionId, row.examId, row.sourceContext, row.sourceHash, row.topicId, row.resourceType]);
    const previous = deduped.get(key);
    if (previous) {
      const allowed = value => JSON.stringify(ACTIVITY_FIELDS.map(k => value[k]));
      if (allowed(previous) !== allowed(row)) throw new Error('conflicting_history');
      gaps.duplicateRows++;
      continue;
    }
    deduped.set(key, row);
  }
  const activity = [...deduped.values()];
  // No shared attempt ID exists across progress and telemetry. Choose the stream
  // containing the latest result, not a guessed timestamp join or double-counted union.
  const precedence = { telemetry: 0, 'quiz-progress': 1, 'mock-progress': 1, history: 2 };
  const stream = row => row.sourceContext.endsWith('-progress') ? 'progress' : row.sourceContext;
  const best = new Map();
  for (const row of activity) if (row.questionId && typeof row.isCorrect === 'boolean') {
    const key = `${row.examId}:${row.questionId}`;
    const previous = best.get(key), candidate = { at: row.timestamp, rank: precedence[row.sourceContext], stream: stream(row) };
    if (!previous || candidate.at > previous.at || (candidate.at === previous.at && candidate.rank < previous.rank)) best.set(key, candidate);
  }
  for (const row of activity) {
    row.scoringEvidence = row.questionId !== undefined && typeof row.isCorrect === 'boolean'
      && stream(row) === best.get(`${row.examId}:${row.questionId}`)?.stream;
    if (row.questionId && typeof row.isCorrect === 'boolean' && !row.scoringEvidence) gaps.supplementalResults++;
  }
  activity.sort((a, b) => cmp(b.timestamp, a.timestamp) || cmp(JSON.stringify(a), JSON.stringify(b)));
  const sanitized = activity.map(row => Object.fromEntries(ACTIVITY_FIELDS.filter(k => row[k] !== undefined).map(k => [k, row[k]])));
  return { window: { days, start: new Date(start).toISOString(), end: new Date(asOf).toISOString() }, activity: sanitized, gaps,
    limitations: ['retained-history-not-a-complete-time-window', 'session-source-hashes-are-not-device-identities',
      'no-cross-stream-attempt-id', 'no-duration-or-question-review-count-in-current-server-schema', 'current-bank-answer-key-not-historical-regrading'],
    evidencePolicy: 'one stream per question containing its latest result; ties prefer telemetry, then completed quiz/mock progress, then history; supplemental copies do not add attempts',
    bankPolicy: 'repository-authored, schema-validated questions; no independent per-question verification flag exists' };
}
