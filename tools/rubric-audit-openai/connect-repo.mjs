#!/usr/bin/env node
/** Add repository shortcuts and a README link. Does not run Git or the API. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(toolDirectory, '../..');
const toolRelative = path.relative(root, toolDirectory).split(path.sep).join('/');
const python = 'tools/rubric-audit-openai/.venv/bin/python';
const additions = {
  'audit:rubric:openai': `${python} -m rubric_audit_openai`,
  'test:rubric:openai': `${python} -m unittest discover -s tools/rubric-audit-openai/tests -v`,
  'demo:rubric:openai': `${python} -m rubric_audit_openai demo --engine langgraph`,
};
const runbook = 'tools/rubric-audit-openai/REPO_COMMANDS.md';
const heading = '## OpenAI rubric assessment';
const section = [
  heading,
  '',
  'The independent OpenAI/LangGraph workflow compares the supported local study',
  'content with a selected certification rubric. See the',
  `[assessment runbook](${runbook}) for installation, exam selection,`,
  'API runs, checkpoint recovery, reports, and reference review.',
  '',
  'Use `npm run audit:rubric:openai -- --help` to list commands and',
  '`npm run test:rubric:openai` to check the assessment implementation.',
  'Assessment output is kept outside the repository.',
  '',
].join('\n');

try {
  if (toolRelative !== 'tools/rubric-audit-openai' || !fs.existsSync(path.join(root, '.git'))) {
    throw new Error('Place this file at tools/rubric-audit-openai/connect-repo.mjs inside your Git checkout.');
  }
  for (const name of ['package.json', 'README.md', runbook, 'tools/rubric-audit-openai/pyproject.toml']) {
    if (!fs.statSync(path.join(root, name)).isFile()) throw new Error(`Required file missing: ${name}`);
  }
  const packagePath = path.join(root, 'package.json');
  const readmePath = path.join(root, 'README.md');
  const originalPackage = fs.readFileSync(packagePath, 'utf8');
  const originalReadme = fs.readFileSync(readmePath, 'utf8');
  const pkg = JSON.parse(originalPackage);
  if (pkg.name !== 'comptia-a-plus-review') throw new Error('This is not the expected comptia-a-plus-review package.');
  if (pkg.scripts !== undefined && (!pkg.scripts || typeof pkg.scripts !== 'object' || Array.isArray(pkg.scripts))) {
    throw new Error('package.json scripts must be an object.');
  }
  pkg.scripts ??= {};
  for (const [name, command] of Object.entries(additions)) {
    if (Object.hasOwn(pkg.scripts, name) && pkg.scripts[name] !== command) {
      throw new Error(`Existing npm command differs: ${name}. Review it before changing anything.`);
    }
  }
  if (originalReadme.includes(heading) && !originalReadme.includes(`](${runbook})`)) {
    throw new Error('README.md already has an OpenAI rubric assessment section. Merge the runbook link manually.');
  }

  const hasNewScripts = Object.keys(additions).some(name => !Object.hasOwn(pkg.scripts, name));
  Object.assign(pkg.scripts, additions);
  const indent = originalPackage.match(/\n([ \t]+)"/)?.[1] ?? '  ';
  const newline = originalPackage.includes('\r\n') ? '\r\n' : '\n';
  const updatedPackage = hasNewScripts ? (JSON.stringify(pkg, null, indent) + '\n').replaceAll('\n', newline) : originalPackage;
  const readmeNewline = originalReadme.includes('\r\n') ? '\r\n' : '\n';
  const separator = originalReadme.endsWith(readmeNewline + readmeNewline) ? '' :
    originalReadme.endsWith(readmeNewline) ? readmeNewline : readmeNewline + readmeNewline;
  const updatedReadme = originalReadme.includes(`](${runbook})`) ? originalReadme :
    originalReadme + separator + section.replaceAll('\n', readmeNewline);

  for (const [filename, before, after] of [
    [packagePath, originalPackage, updatedPackage],
    [readmePath, originalReadme, updatedReadme],
  ]) {
    if (before !== after) fs.writeFileSync(filename, after, 'utf8');
    console.log(`${before === after ? 'Already configured' : 'Updated'}: ${path.relative(root, filename)}`);
  }
  console.log('Next: npm run audit:rubric:openai -- --help');
} catch (error) {
  console.error(`Setup stopped: ${error.message}`);
  process.exitCode = 1;
}
