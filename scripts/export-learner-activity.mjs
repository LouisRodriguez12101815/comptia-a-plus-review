#!/usr/bin/env node
/** Local-only diagnostic. No application sync, migration, repair or acknowledgement calls. */
import { readFile, lstat, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseEnv } from 'node:util';
import { execFileSync } from 'node:child_process';
import twilio from 'twilio';
import { isExamCode } from '../lib/exams.ts';
import { configuration } from './export-primary-history.mjs';
import { ACTIVITY_FIELDS, collectActivity } from './lib/learner-activity-data.mjs';
import { analyzeActivity, buildFollowup, summaryMarkdown } from './lib/learner-activity-plan.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const HELP = `Usage: npm run export:learner-activity -- [--days 7] [--quiz-size 15] [--exam n10-009]
Node 24 recommended (same TypeScript loader as repository tests).
Reads only .env.local and one explicitly resolved learner Sync Map (GET only).
Multiple allowlisted numbers require LEARNER_PRIMARY_PHONE, as in the existing exporter.
Creates five private files under gitignored tmp/. Refuses existing files or symlink directories.
No production writes, sync, repair, merge, acknowledgement, SMS, or credential output.
Different certifications receive separate quiz plans. JSON plans contain private answer keys;
use their /quiz links for learner-facing Check answer / Next / Finish behavior.
Retention is not a complete last-N-days guarantee. See docs/learner-activity-export.md.\n`;

export function options(args) {
  const result = { days: 7, quizSize: 15 };
  const seen = new Set();
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i], value = args[i + 1];
    if (!['--days', '--quiz-size', '--exam'].includes(key) || seen.has(key) || value === undefined) throw new Error('options');
    seen.add(key);
    if (key === '--exam') { if (!isExamCode(value)) throw new Error('options'); result.exam = value; }
    else {
      if (!/^[1-9]\d*$/.test(value)) throw new Error('options');
      const parsed = Number(value), max = key === '--days' ? 365 : 100;
      if (!Number.isSafeInteger(parsed) || parsed > max) throw new Error('options');
      result[key === '--days' ? 'days' : 'quizSize'] = parsed;
    }
  }
  return result;
}

export function outputNames(days) {
  return [`learner-activity-last-${days}-days.json`, `learner-activity-last-${days}-days.csv`,
    'learner-remediation-summary.json', 'learner-remediation-summary.md', 'learner-followup-quiz.json'];
}

export function activityCsv(rows) {
  const cell = value => {
    let text = value === undefined || value === null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text; // Spreadsheet formula-injection protection.
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return ACTIVITY_FIELDS.map(cell).join(',') + '\n' + rows.map(row => ACTIVITY_FIELDS.map(k => cell(row[k])).join(',')).join('\n') + '\n';
}

/** Restrict the SDK transport to GET as well as exposing only a single scoped item-list call. */
export async function readLearnerItems(env, mapName, clientFactory = twilio) {
  const client = clientFactory(env.TWILIO_API_KEY_SID, env.TWILIO_API_KEY_SECRET, {
    accountSid: env.TWILIO_ACCOUNT_SID, logLevel: 'silent', autoRetry: false, timeout: 15000,
  });
  if (typeof client.request !== 'function') throw new Error('read_only_transport');
  const request = client.request.bind(client);
  client.request = opts => {
    if (String(opts.method).toUpperCase() !== 'GET') throw new Error('read_only_transport');
    return request(opts);
  };
  // SDK pagination follows every page. No map enumeration or total-item truncation.
  return client.sync.v1.services(env.TWILIO_SYNC_SERVICE_SID).syncMaps(mapName).syncMapItems.list({ pageSize: 100 });
}

async function exists(path) {
  try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export async function runExport(args = process.argv.slice(2), { root = ROOT, clientFactory = twilio, now = Date.now, log = console.log, error = console.error } = {}) {
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) { log(HELP); return 0; }
  try {
    const opts = options(args), asOf = now();
    const dir = resolve(root, 'tmp'), paths = outputNames(opts.days).map(name => resolve(dir, name));
    // No configurable output path: prevent accidental placement under public/ or tracked docs.
    const ignore = await readFile(resolve(root, '.gitignore'), 'utf8');
    if (!ignore.split(/\r?\n/).some(line => line.trim() === '/tmp/')) throw new Error('private_output');
    for (const name of outputNames(opts.days)) {
      execFileSync('git', ['check-ignore', '--quiet', '--', 'tmp/' + name], { cwd: root, stdio: 'ignore' });
    }
    const directory = await exists(dir);
    if (directory && (!directory.isDirectory() || directory.isSymbolicLink())) throw new Error('private_output');
    for (const path of paths) if (await exists(path)) throw new Error('output_exists');
    const env = parseEnv(await readFile(resolve(root, '.env.local'), 'utf8'));
    const { mapName } = configuration(env); // Existing allowlist, primary selection and application HMAC.
    const read = async name => JSON.parse(await readFile(resolve(root, 'content', `${name}.json`), 'utf8'));
    const [questions, topics, networkTopics, objectives, concepts] = await Promise.all([
      'questions', 'topics', 'topics-network-plus', 'objectives', 'network-plus-concepts',
    ].map(read));
    const content = { questions, topics: [...topics, ...networkTopics], objectives, concepts };
    const items = await readLearnerItems(env, mapName, clientFactory);
    const activity = collectActivity(items, content, { ...opts, asOf });
    const summary = analyzeActivity(activity), quiz = buildFollowup(summary, content, opts);
    const payloads = [JSON.stringify(activity, null, 2) + '\n', activityCsv(activity.activity),
      JSON.stringify({ ...summary, shortages: quiz.shortages }, null, 2) + '\n', summaryMarkdown(summary, quiz), JSON.stringify(quiz, null, 2) + '\n'];
    await mkdir(dir, { recursive: true, mode: 0o700 });
    for (let i = 0; i < paths.length; i++) await writeFile(paths[i], payloads[i], { flag: 'wx', mode: 0o600 });
    log(`Created five private diagnostic files in ignored tmp/: ${activity.activity.length} activity rows, ${quiz.plans.length} separate exam plans. No provider data changed.`);
    return 0;
  } catch {
    // Never log provider errors, paths, credential-bearing objects, argv, environment or raw history.
    error('Export stopped. Check options, primary allowlist selection, readable history, and absent private output files. Files may be incomplete after a local write failure. No provider data was modified.');
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exitCode = await runExport();
