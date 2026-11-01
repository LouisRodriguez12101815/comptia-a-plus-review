#!/usr/bin/env node
/** Read one primary learner map; never create, update, verify, sync, or delete. */
import { createHmac } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import twilio from 'twilio';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const HELP = `Usage: node scripts/export-primary-history.mjs
Reads credentials only from repository .env.local (Node 22.6+).
Required: TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET,
TWILIO_SYNC_SERVICE_SID, LEARNER_SESSION_SECRET, LEARNER_ALLOWED_PHONES.
If the allowlist has multiple entries, set LEARNER_PRIMARY_PHONE in .env.local.
The selected number must be allowlisted; no other learner map is read.
Writes data/primary-history.json exclusively (refuses to overwrite an existing file).
Output is a JSON array: questionId, objective (or null if ambiguous), correct,
timestamp (ISO sitting-completion time), fsrsState (null unless explicitly recorded for that question event).
Legacy sittings without usable question IDs are omitted, never inferred.
No SMS, sign-in, remote writes, profile enumeration, or credential output.\n`;
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function phone(value) {
  const digits = String(value ?? '').replace(/[^\d+]/g, '');
  if (/^\+[1-9]\d{7,14}$/.test(digits)) return digits;
  if (/^\d{10}$/.test(digits)) return `+1${digits}`;
  if (/^1\d{10}$/.test(digits)) return `+${digits}`;
  return null;
}
export function configuration(env) {
  for (const [name, prefix] of [['TWILIO_ACCOUNT_SID', 'AC'], ['TWILIO_API_KEY_SID', 'SK'], ['TWILIO_SYNC_SERVICE_SID', 'IS']]) {
    if (!new RegExp(`^${prefix}[0-9a-f]{32}$`, 'i').test(env[name] ?? '')) throw new Error('configuration');
  }
  if (!env.TWILIO_API_KEY_SECRET || (env.LEARNER_SESSION_SECRET ?? '').length < 32) throw new Error('configuration');
  const raw = (env.LEARNER_ALLOWED_PHONES ?? '').split(',').map(v => v.trim()).filter(Boolean);
  const allowed = [...new Set(raw.map(phone))];
  if (!allowed.length || allowed.includes(null)) throw new Error('configuration');
  const selected = env.LEARNER_PRIMARY_PHONE ? phone(env.LEARNER_PRIMARY_PHONE) : allowed.length === 1 ? allowed[0] : null;
  if (!selected || !allowed.includes(selected)) throw new Error('configuration');
  const id = createHmac('sha256', env.LEARNER_SESSION_SECRET).update(`learner:${selected}`).digest('hex').slice(0, 40);
  return { mapName: `learner-${id}` };
}

/** Documented legacy progress item and current application chunk format. */
export function decodeProgress(items) {
  if (!Array.isArray(items) || items.some(item => !isRecord(item) || typeof item.key !== 'string')
    || new Set(items.map(item => item.key)).size !== items.length) throw new Error('history');
  const direct = items.find(item => item.key === 'progress');
  const chunks = items.filter(item => /^progress-\d+$/.test(item.key)).sort((a, b) => Number(a.key.slice(9)) - Number(b.key.slice(9)));
  // Two formats together have no documented freshness rule: refuse to choose.
  if (direct && chunks.length) throw new Error('history');
  let progress;
  if (direct) {
    progress = typeof direct.data?.s === 'string' ? JSON.parse(direct.data.s) : direct.data;
  } else if (chunks.length) {
    if (chunks.length > 40 || chunks.some((item, i) => item.key !== `progress-${i}` || typeof item.data?.s !== 'string' || item.data.s.length > 12000)) throw new Error('history');
    progress = JSON.parse(chunks.map(item => item.data.s).join(''));
  }
  const historyItem = items.find(item => item.key === 'history');
  // No history payload schema is specified in the build report. Accept only
  // explicit per-question rows in an array or events array, never aggregate runs.
  const events = historyItem ? (Array.isArray(historyItem.data) ? historyItem.data : historyItem.data?.events) : [];
  if (historyItem && !Array.isArray(events)) throw new Error('unsupported-history');
  if (progress === undefined && !historyItem) throw new Error('history');
  if (progress !== undefined && (!isRecord(progress) || !['quizAttempts', 'mockAttempts'].every(key => progress[key] === undefined || Array.isArray(progress[key]))
    || !['quizAttempts', 'mockAttempts'].some(key => Array.isArray(progress[key])))) throw new Error('history');
  // Do not copy profile, history display fields, schedules-* or run:* payloads.
  return { ...(progress ?? {}), questionEvents: events };
}

/** Allowlist output fields and bank IDs; never copy profile fields or free text. */
export function exportHistory(progress, { questions, topics, objectives }) {
  const exam = objectives.exams.find(e => e.code === 'n10-009');
  if (!exam) throw new Error('content');
  const validObjectives = new Set(exam.domains.flatMap(d => d.objectives.map(o => o.id)));
  const topicCodes = new Map(topics.map(t => [t.id, t.examCodes ?? []]));
  const bank = new Map(questions.filter(q => (q.examCodes ?? topicCodes.get(q.topicId) ?? []).includes('n10-009')).map(q => [q.id, q]));
  const candidates = q => q.objectiveIds?.['n10-009'] ?? exam.domains.flatMap(d => d.objectives.filter(o => o.topics.includes(q.topicId)).map(o => o.id));
  const rows = [], seen = new Set();
  let omittedSittings = 0, ambiguousObjectives = 0, omittedUnvisitedQuestions = 0, omittedHistoryEvents = 0;
  for (const [kind, attempts] of [['quiz', progress.quizAttempts ?? []], ['mock', progress.mockAttempts ?? []]]) {
    for (const a of attempts) {
      if (!isRecord(a)) throw new Error('history');
      if (kind === 'mock' && a.exam !== 'n10-009') continue;
      if (!Array.isArray(a.questionIds)) { omittedSittings++; continue; }
      const ids = a.questionIds;
      const validIds = values => Array.isArray(values) && values.every(id => typeof id === 'string') && new Set(values).size === values.length;
      if (!validIds(ids) || !validIds(a.missedIds) || !Number.isInteger(a.total) || a.total < ids.length || a.total <= 0
        || a.correct !== a.total - a.missedIds.length || a.correct < 0
        || !Number.isFinite(a.at) || !Number.isFinite(new Date(a.at).getTime())) throw new Error('history');
      // Timed-out mocks store visited questionIds but grade all scheduled questions.
      // correctIds + missedIds identifies that complete graded set without inventing visits.
      if (kind === 'mock' && a.correctIds !== undefined) {
        if (!validIds(a.correctIds) || a.correctIds.length !== a.correct || a.correctIds.some(id => a.missedIds.includes(id))
          || ids.some(id => !a.correctIds.includes(id) && !a.missedIds.includes(id))
          || a.correctIds.some(id => !ids.includes(id))) throw new Error('history');
        omittedUnvisitedQuestions += a.total - ids.length;
      } else {
        if (a.total !== ids.length) { omittedSittings++; continue; }
        if (a.missedIds.some(id => !ids.includes(id))) throw new Error('history');
      }
      const timestamp = new Date(a.at).toISOString();
      for (const id of ids) {
        const q = bank.get(id);
        if (!q) continue;
        const possible = candidates(q).filter(id => validObjectives.has(id));
        const drawnFor = kind === 'mock' ? a.objectiveByQuestion?.[id] : undefined;
        if (drawnFor !== undefined && !possible.includes(drawnFor)) throw new Error('history');
        const objective = drawnFor ?? (possible.length === 1 ? possible[0] : null);
        const row = { questionId: id, objective, correct: !a.missedIds.includes(id), timestamp, fsrsState: null };
        const key = JSON.stringify(row);
        if (seen.has(key)) continue;
        seen.add(key);
        if (objective === null) ambiguousObjectives++;
        rows.push(row);
      }
    }
  }
  for (const event of progress.questionEvents ?? []) {
    if (!isRecord(event) || typeof event.questionId !== 'string' || typeof event.correct !== 'boolean' || !bank.has(event.questionId)) { omittedHistoryEvents++; continue; }
    const time = typeof event.timestamp === 'number' || typeof event.timestamp === 'string' ? new Date(event.timestamp) : null;
    if (!time || !Number.isFinite(time.getTime())) throw new Error('history');
    const possible = candidates(bank.get(event.questionId)).filter(id => validObjectives.has(id));
    if (event.objective != null && !possible.includes(event.objective)) throw new Error('history');
    const objective = event.objective ?? (possible.length === 1 ? possible[0] : null);
    // FSRS remains null unless a question event explicitly carries a numeric state.
    // Flashcard-keyed schedules are never guessed to belong to a question.
    const fsrsState = event.fsrsState == null ? null : event.fsrsState;
    if (fsrsState !== null && ![0, 1, 2, 3].includes(fsrsState)) throw new Error('history');
    rows.push({ questionId: event.questionId, objective, correct: event.correct, timestamp: time.toISOString(), fsrsState });
  }
  // The same sitting can appear in progress and history. Merge identical outcomes;
  // reject contradictions instead of silently preferring one source.
  const merged = new Map();
  for (const row of rows) {
    const key = JSON.stringify([row.questionId, row.timestamp]);
    const prior = merged.get(key);
    if (prior && (prior.correct !== row.correct || (prior.objective !== null && row.objective !== null && prior.objective !== row.objective)
      || (prior.fsrsState !== null && row.fsrsState !== null && prior.fsrsState !== row.fsrsState))) throw new Error('history');
    merged.set(key, prior ? { ...row, objective: row.objective ?? prior.objective, fsrsState: row.fsrsState ?? prior.fsrsState } : row);
  }
  rows.splice(0, rows.length, ...merged.values());
  ambiguousObjectives = rows.filter(row => row.objective === null).length;
  rows.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.questionId.localeCompare(b.questionId));
  return { rows, omittedSittings, ambiguousObjectives, omittedUnvisitedQuestions, omittedHistoryEvents };
}

export async function runExport(args = process.argv.slice(2), { root = ROOT, clientFactory = twilio, log = console.log, error = console.error } = {}) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) { log(HELP); return 0; }
  if (args.length) { error('Unknown option. Use --help.'); return 1; }
  try {
    const env = parseEnv(await readFile(resolve(root, '.env.local'), 'utf8'));
    const { mapName } = configuration(env);
    const read = async name => JSON.parse(await readFile(resolve(root, 'content', `${name}.json`), 'utf8'));
    const [questions, baseTopics, networkTopics, objectives] = await Promise.all(['questions', 'topics', 'topics-network-plus', 'objectives'].map(read));
    // Explicitly silence SDK logs; do not print SDK errors (which can include identifiers).
    const client = clientFactory(env.TWILIO_API_KEY_SID, env.TWILIO_API_KEY_SECRET, { accountSid: env.TWILIO_ACCOUNT_SID, logLevel: 'silent', autoRetry: false, timeout: 15000 });
    // SDK list follows every page with no total-item limit; never enumerate maps.
    const items = await client.sync.v1.services(env.TWILIO_SYNC_SERVICE_SID).syncMaps(mapName).syncMapItems.list({ pageSize: 100 });
    const result = exportHistory(decodeProgress(items), { questions, topics: [...baseTopics, ...networkTopics], objectives });
    if (!result.rows.length) { error('No exportable Network+ question history; no file written. Legacy records may lack usable question IDs or a supported history payload.'); return 1; }
    await mkdir(resolve(root, 'data'), { recursive: true, mode: 0o700 });
    await writeFile(resolve(root, 'data/primary-history.json'), `${JSON.stringify(result.rows, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    log(`Exported ${result.rows.length} Network+ records for the primary learner profile. Omitted sittings without usable question IDs: ${result.omittedSittings}. Unvisited scheduled mock questions omitted: ${result.omittedUnvisitedQuestions}. Aggregate, unknown or non-Network+ history events omitted: ${result.omittedHistoryEvents}. Records with ambiguous objective: ${result.ambiguousObjectives}. Flashcard-only FSRS is not joined to questions.`);
    return 0;
  } catch (failure) {
    if (failure?.code === 'EEXIST') error('Export file already exists; move it aside yourself before exporting again.');
    else error('Export failed; no usable export produced. Check .env.local, primary-profile selection, read access, and history integrity. No credentials or provider details were logged.');
    return 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = await runExport();
