/** Test-wise cue measurements. Length rates use single-answer items only. */

const ABSOLUTE = ["always", "never", "only", "all"];
const STOP = new Set("about after again also and are because been before being between both but can could does each from have into more most must not other over should than that the their them then there these this those through under using what when where which while will with would your".split(" "));
const VERB = /\b(is|are|was|were|has|have|does|do|can|should|will|uses|provides|requires|allows|supports|stores|routes|encrypts|replicates)\b/i;

/** Exams whose rewrite batch has landed. CLF stays empty until that batch is in the tree. */
export const ENFORCED_EXAMS = ["saa-c03"];
export const LONGEST_MAX = 0.35;
export const STRONG_MAX = 0.1;
export const SHORTEST_MIN = 0.15;
export const SHORTEST_MAX = 0.35;
export const COMPTIA_EXAMS = ["220-1201", "220-1202", "n10-009"];

export function choiceLength(text) {
  return String(text ?? "").trim().length;
}

export function isSingleAnswer(item) {
  return Number.isInteger(item.answer) && item.answer >= 0 && item.answer < (item.choices?.length ?? 0);
}

function words(text) {
  return String(text ?? "").toLowerCase().match(/[a-z][a-z0-9-]{4,}/g) ?? [];
}

function hasWord(text, word) {
  return new RegExp(`\\b${word}\\b`, "i").test(text);
}

function norm(text) {
  return String(text ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = i;
    for (let j = 1; j <= b.length; j += 1) {
      const next = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], row[j], previous) + 1;
      row[j - 1] = previous;
      previous = next;
    }
    row[b.length] = previous;
  }
  return row[b.length];
}

export function nearDuplicateChoices(choices) {
  const pairs = [];
  for (let i = 0; i < choices.length; i += 1) {
    for (let j = i + 1; j < choices.length; j += 1) {
      const left = norm(choices[i]);
      const right = norm(choices[j]);
      if (!left || !right) continue;
      if (left === right) { pairs.push([i, j]); continue; }
      const max = Math.max(left.length, right.length);
      if (Math.min(left.length, right.length) >= 24 && distance(left, right) / max <= 0.12) pairs.push([i, j]);
    }
  }
  return pairs;
}

/** A distinctive stem term that appears in the key and in no distractor. */
export function keywordEchoTerm(prompt, choices, keyIndex) {
  if (!Number.isInteger(keyIndex) || keyIndex < 0 || keyIndex >= choices.length) return null;
  const key = choices[keyIndex] ?? "";
  const wrong = choices.filter((_, index) => index !== keyIndex);
  const shared = new Set(words(choices[0] ?? "").filter((word) => choices.every((choice) => hasWord(choice, word))));
  const stemWords = [...new Set(words(prompt).filter((word) => !STOP.has(word) && !shared.has(word)))];
  return stemWords.find((word) => hasWord(key, word) && wrong.every((choice) => !hasWord(choice, word))) ?? null;
}

/** The opening the distractors share when the key does not share those first three words. */
export function oddOneOutOpening(choices, keyIndex) {
  if (!Number.isInteger(keyIndex) || choices.length < 3) return null;
  const opening = (text) => String(text).trim().split(/\s+/).slice(0, 3).join(" ").toLowerCase();
  const wrong = choices.filter((_, index) => index !== keyIndex).map(opening);
  if (wrong.length < 2 || wrong.some((text) => text.split(" ").length < 3)) return null;
  if (new Set(wrong).size !== 1) return null;
  return opening(choices[keyIndex]) === wrong[0] ? null : wrong[0];
}

/** Cue report for one item. Multi-answer items are described but excluded from length rates. */
export function analyzeItem(item) {
  const choices = (item.choices ?? []).map((choice) => String(choice));
  const single = isSingleAnswer(item);
  const keyIndexes = single ? [item.answer] : Array.isArray(item.answer) ? item.answer.filter((index) => Number.isInteger(index)) : [];
  const keyIndex = single ? item.answer : null;
  const lengths = choices.map(choiceLength);
  const keyLength = keyIndex === null ? null : lengths[keyIndex] ?? null;
  const others = keyIndex === null ? [] : lengths.filter((_, index) => index !== keyIndex);
  const longer = keyLength === null ? null : others.filter((length) => length > keyLength).length;
  const strictlyLongest = keyLength !== null && others.length > 0 && others.every((length) => keyLength > length);
  const strictlyShortest = keyLength !== null && others.length > 0 && others.every((length) => keyLength < length);
  const meanOther = others.length ? others.reduce((sum, length) => sum + length, 0) / others.length : null;
  const ratio = keyLength !== null && meanOther ? keyLength / meanOther : null;
  const stronglyBiased = strictlyLongest && ratio !== null && ratio >= 1.3;
  const key = keyIndex === null ? "" : choices[keyIndex] ?? "";
  const wrong = choices.filter((_, index) => index !== keyIndex);
  const stemWords = [...new Set(words(item.prompt).filter((word) => !STOP.has(word)))];
  const stemWord = stemWords.find((word) => hasWord(key, word) && wrong.every((choice) => !hasWord(choice, word))) ?? null;
  const absoluteWords = ABSOLUTE.filter((word) => wrong.some((choice) => hasWord(choice, word)) && !hasWord(key, word));
  const allNone = choices.some((choice) => /\b(?:all|none) of the above\b/i.test(choice));
  const complete = (choice) => choice.trim().split(/\s+/).length >= 6 && VERB.test(choice);
  const onlyComplete = single && complete(key) && wrong.every((choice) => !complete(choice));
  const duplicates = nearDuplicateChoices(choices);
  const shape = choiceShapeCues(item);
  return {
    id: item.id,
    source: item.source,
    lengthGate: item.lengthGate !== false,
    exams: item.exams,
    single,
    keyIndex,
    keyLetter: keyIndex === null ? null : String.fromCharCode(65 + keyIndex),
    keyIndexes,
    lengths,
    keyLength,
    lengthRank: keyLength === null ? null : longer + 1,
    meanOther,
    ratio,
    strictlyLongest,
    strictlyShortest,
    stronglyBiased,
    stemWord,
    keywordEcho: keywordEchoTerm(item.prompt, choices, keyIndex),
    oddOneOut: oddOneOutOpening(choices, keyIndex),
    absoluteWords,
    allNone,
    onlyComplete,
    nearDuplicate: duplicates.length > 0,
    selfDisqualifying: shape.selfDisqualifying,
    notParallel: shape.notParallel,
  };
}

const PRODUCT_PREFIX = /^(?:amazon |aws )?(?:fsx for (?:windows file server|lustre|netapp ontap|openzfs)|s3 file gateway|elastic file system|efs|elasticache for (?:redis|memcached|valkey))\b/i;
const PURPOSE = /\b(for|with|via|using|without|instead|because|while|when|into|from|through|over|than|that|which|until|leaving|expecting|before|after|during|on|so)\b/i;
const GIVEAWAY = /\b(instead of|rather than|with the expectation|on the view that|expecting|expect)\b|\b(?:and|with|but) no\b|\bbecause\b/i;
const VERBISH = /\b(is|are|was|were|keep|keeps|replace|replaces|use|uses|run|runs|send|sends|move|moves|turn|turns|add|adds|allow|allows|deny|denies|delete|deletes|copy|copies|launch|patch|edit|store|stores|create|creates|put|puts|serve|serves|scale|scales|measure|grant|make|makes|leave|leaves|stop|stops|share|shares|rotate|wait|waits|disable|disables|drop|drops|publish|remove|removes|spread|require|requires|raise|raises|release|releases|treat|treats|attach|attaches|inspect|filter|filters|invoke|invokes|deploy|open)\b/i;

/** Stem requirement paired with the term that contradicts it inside a wrong choice. */
const OPPOSITES = [
  { id: "windows", stem: /\bwindows\b/i, other: /\b(?:linux|nfs)\b/i },
  { id: "linux", stem: /\blinux\b/i, other: /\b(?:windows|smb|cifs|ntfs)\b/i },
  { id: "multi-az", stem: /\bmulti[-\s]?az\b|\bmultiple availability zones\b|\baz outage\b|\bsurvive an availability zone\b/i, other: /\bsingle[-\s]?az\b|\bsingle availability zone\b|\bone availability zone\b/i },
  { id: "single-az", stem: /\bsingle[-\s]?az\b|\bone availability zone\b|\ba single availability zone\b/i, other: /\bmulti[-\s]?az\b|\bmultiple availability zones\b/i },
  { id: "global", stem: /\bglobal\b/i, other: /\bregional\b/i },
  { id: "regional", stem: /\bregional\b/i, other: /\bglobal\b/i },
  { id: "in-transit", stem: /\bin transit\b/i, other: /\bat rest\b/i },
  { id: "at-rest", stem: /\bat rest\b/i, other: /\bin transit\b/i },
  { id: "private", stem: /\bprivate\b|\bwithout public\b|\bno public\b|\bnot public\b/i, other: /\bpublic\b/i, mask: /\b(?:without|no|not)\s+public\b/gi },
  { id: "keep-multi-az", stem: /\b(?:retain|retaining|keeping|keep)\b[^.]{0,80}\bmulti-az\b/i, other: /\breplace multi-az\b|\bturn off multi-az\b/i },
  { id: "already-measured", stem: /\b(?:has|have) measured\b/i, other: /\bbefore measuring\b/i },
  { id: "public", stem: /\bpublic\b/i, other: /\bprivate\b/i, skipWhen: /\bprivate\b|\bwithout public\b|\bno public\b|\bnot public\b/i },
  { id: "https", stem: /\bhttps\b|\btls\b|\bencrypted in transit\b/i, other: /\bhttp\b(?!s)/i },
  { id: "durable", stem: /\bdurable\b|\bdurability\b|\bmust survive\b/i, other: /\bscratch\b|\bephemeral\b|\btemporary\b/i },
  { id: "scratch", stem: /\bscratch\b|\btemporary\b|\blose its data\b/i, other: /\bdurable\b|\bpersistent\b/i },
  { id: "sync", stem: /\bsynchronous\b/i, other: /\basynchronous\b/i },
  { id: "async", stem: /\basynchronous\b/i, other: /\bsynchronous\b/i },
  { id: "file", stem: /\bfile (?:system|share|server)\b|\bwindows file\b/i, other: /\bobject storage\b/i },
  { id: "object", stem: /\bobject (?:storage|blobs|data)\b/i, other: /\bfile (?:system|share)\b/i },
  { id: "strong", stem: /\bstrong consistency\b|\bstrongly consistent\b/i, other: /\beventual consistency\b|\beventually consistent\b/i },
  { id: "eventual", stem: /\beventual consistency\b|\beventually consistent\b/i, other: /\bstrong consistency\b|\bstrongly consistent\b/i },
];

function hasQualifier(choice) {
  const text = String(choice ?? "").trim().replace(/\s+/g, " ");
  if (GIVEAWAY.test(text)) return true;
  if (PRODUCT_PREFIX.test(text)) return text.replace(PRODUCT_PREFIX, "").trim().length > 0;
  return PURPOSE.test(text);
}

function bareName(choice) {
  const text = String(choice ?? "").trim().replace(/\s+/g, " ");
  if (PRODUCT_PREFIX.test(text) && !text.replace(PRODUCT_PREFIX, "").trim()) return true;
  const words = text.split(" ").filter(Boolean);
  if (words.length > 6) return false;
  if (hasQualifier(text) || VERBISH.test(text)) return false;
  return true;
}

/** Wrong-choice contradictions and bare-vs-qualified mismatch. Multi-answer items are not scored. */
export function choiceShapeCues(item) {
  const choices = (item.choices ?? []).map((choice) => String(choice));
  if (!isSingleAnswer(item)) return { selfDisqualifying: [], notParallel: false };
  const prompt = String(item.prompt ?? "");
  const wrong = choices.filter((_, index) => index !== item.answer);
  const selfDisqualifying = [];
  for (const choice of wrong) {
    if (GIVEAWAY.test(choice)) selfDisqualifying.push({ choice, label: "giveaway" });
    for (const rule of OPPOSITES) {
      if (rule.skipWhen?.test(prompt)) continue;
      const stemForOther = rule.mask ? prompt.replace(rule.mask, " ") : prompt;
      if (!rule.stem.test(prompt) || rule.other.test(stemForOther)) continue;
      if (rule.other.test(choice) && !rule.stem.test(choice)) selfDisqualifying.push({ choice, label: rule.id });
    }
  }
  const keyBare = bareName(choices[item.answer]);
  const wrongBare = wrong.filter(bareName).length;
  const notParallel = wrong.length >= 2 && ((keyBare && wrong.length - wrongBare >= 2) || (!keyBare && wrongBare === wrong.length));
  return { selfDisqualifying, notParallel };
}

export function examBuckets(exams) {
  const buckets = new Set(exams);
  if (exams.some((exam) => COMPTIA_EXAMS.includes(exam))) buckets.add("comptia");
  return [...buckets];
}

export function summarize(rows) {
  const byExam = new Map();
  for (const row of rows) {
    for (const exam of examBuckets(row.exams)) {
      const bucket = byExam.get(exam) ?? [];
      bucket.push(row);
      byExam.set(exam, bucket);
    }
  }
  const result = {};
  for (const [exam, bucket] of byExam) {
    const single = bucket.filter((row) => row.single && row.lengthGate && row.keyLength !== null);
    const longest = single.filter((row) => row.strictlyLongest).length;
    const shortest = single.filter((row) => row.strictlyShortest).length;
    const strong = single.filter((row) => row.stronglyBiased).length;
    const positions = {};
    for (const row of single) positions[row.keyLetter] = (positions[row.keyLetter] ?? 0) + 1;
    result[exam] = {
      items: bucket.length,
      single: single.length,
      longest,
      longestRate: single.length ? longest / single.length : 0,
      shortest,
      shortestRate: single.length ? shortest / single.length : 0,
      strong,
      strongRate: single.length ? strong / single.length : 0,
      positions,
      stemWord: bucket.filter((row) => row.stemWord).length,
      absoluteWords: bucket.filter((row) => row.absoluteWords.length).length,
      allNone: bucket.filter((row) => row.allNone).length,
      onlyComplete: bucket.filter((row) => row.onlyComplete).length,
      nearDuplicate: bucket.filter((row) => row.nearDuplicate).length,
      selfDisqualifying: single.filter((row) => row.selfDisqualifying.length > 0).length,
      notParallel: single.filter((row) => row.notParallel).length,
      keywordEcho: single.filter((row) => row.keywordEcho).length,
      oddOneOut: single.filter((row) => row.oddOneOut).length,
    };
  }
  return result;
}

export function rateFailures(summary, enforced = ENFORCED_EXAMS) {
  const failures = [];
  for (const exam of enforced) {
    const row = summary[exam];
    if (!row) { failures.push(`${exam}: no single-answer items`); continue; }
    if (row.longestRate > LONGEST_MAX) failures.push(`${exam}: key-is-longest ${(row.longestRate * 100).toFixed(1)}% (${row.longest}/${row.single}) exceeds 35%`);
    if (row.strongRate > STRONG_MAX) failures.push(`${exam}: strongly length-biased ${(row.strongRate * 100).toFixed(1)}% (${row.strong}/${row.single}) exceeds 10%`);
    if (row.selfDisqualifying > 0) failures.push(`${exam}: self-disqualifying ${row.selfDisqualifying} exceeds 0`);
    if (row.notParallel > 0) failures.push(`${exam}: choices not parallel ${row.notParallel} exceeds 0`);
  }
  return failures;
}

export function itemFailures(rows, ids, exceptions = new Map()) {
  const failures = [];
  for (const row of rows) {
    if (!ids.has(row.id) || !row.stronglyBiased) continue;
    if (exceptions.has(row.id)) continue;
    failures.push(`${row.id}: strictly longest by ${row.ratio.toFixed(2)}× with no approved exception`);
  }
  return failures;
}

/** Lengthen the shortest wrong choice using words already in its explanation. Returns null when it cannot. */
export function equalizeStrongCue(question) {
  if (!isSingleAnswer(question)) return null;
  const row = analyzeItem({ ...question, exams: question.examCodes ?? [], source: "edit" });
  if (!row.stronglyBiased) return null;
  const choices = [...question.choices];
  const lines = String(question.explanation ?? "").split("\n");
  const keyLength = choiceLength(choices[question.answer]);
  const wrongIndexes = choices.map((_, index) => index).filter((index) => index !== question.answer);
  const target = wrongIndexes.sort((a, b) => choiceLength(choices[a]) - choiceLength(choices[b]) || a - b)[0];
  const line = lines[target] ?? "";
  const prefix = `Option: ${choices[target]} — `;
  if (!line.startsWith(prefix)) return null;
  const why = line.slice(prefix.length).replace(/^(?:Incorrect|Correct):\s*/, "").replace(/\s+/g, " ").trim();
  const sentence = why.split(/(?<=\.)\s/).find((part) => part.length > 24 && !/^it does not\b/i.test(part)) ?? why;
  if (!sentence || choices[target].includes(sentence)) return null;
  const addition = sentence.replace(/[.]+$/, "");
  let next = `${choices[target]} (${addition})`;
  if (choiceLength(next) < keyLength) next = `${choices[target]} (${why.replace(/[.]+$/, "")})`;
  if (choiceLength(next) < keyLength) return null;
  if (choices.some((choice, index) => index !== target && norm(choice) === norm(next))) return null;
  const updated = [...choices];
  updated[target] = next;
  const updatedLines = [...lines];
  updatedLines[target] = `Option: ${next} — ${line.slice(prefix.length)}`;
  const edited = { ...question, choices: updated, explanation: updatedLines.join("\n") };
  const after = analyzeItem({ ...edited, exams: question.examCodes ?? [], source: "edit" });
  if (after.stronglyBiased || after.strictlyLongest) return null;
  if (edited.answer !== question.answer) return null;
  return edited;
}
