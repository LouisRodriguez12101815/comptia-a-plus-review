// Pure test-mode logic: builds a timed practice exam from the objective matrix
// (content/objectives.json, the same data behind /coverage) and the question bank.
// No React, filesystem, or browser APIs belong here so Node tests can import it.

/**
 * Published exam formats. CompTIA lists a maximum of 90 questions and 90 minutes
 * for 220-1201, 220-1202, and N10-009. Seconds per question is the pace that
 * format implies (90 min / 90 questions = 60 s). Confirm on comptia.org if the
 * format changes.
 */
export const EXAM_FORMATS = {
  '220-1201': { label: 'A+ Core 1', maxQuestions: 90, minutes: 90, passingScore: 675, scaleMin: 100, scaleMax: 900 },
  '220-1202': { label: 'A+ Core 2', maxQuestions: 90, minutes: 90, passingScore: 700, scaleMin: 100, scaleMax: 900 },
  'n10-009': { label: 'Network+', maxQuestions: 90, minutes: 90, passingScore: 720, scaleMin: 100, scaleMax: 900 },
  'clf-c02': { label: 'AWS Cloud Practitioner', maxQuestions: 65, minutes: 90, passingScore: 700, scaleMin: 100, scaleMax: 1000 },
  'saa-c03': { label: 'AWS Solutions Architect – Associate', maxQuestions: 65, minutes: 130, passingScore: 720, scaleMin: 100, scaleMax: 1000 },
};

export const TEST_LENGTHS = [
  { id: 'full', label: 'Full exam' },
  { id: 'half', label: 'Half exam' },
  { id: 'quick', label: 'Quick check' },
];

export function questionsForLength(examCode, lengthId) {
  const format = EXAM_FORMATS[examCode];
  if (!format) throw new Error(`Unknown exam: ${examCode}`);
  if (lengthId === 'full') return format.maxQuestions;
  if (lengthId === 'half') return Math.ceil(format.maxQuestions / 2);
  if (lengthId === 'quick') return Math.min(15, format.maxQuestions);
  throw new Error(`Unknown test length: ${lengthId}`);
}

export function secondsPerQuestion(examCode) {
  const format = EXAM_FORMATS[examCode];
  if (!format) throw new Error(`Unknown exam: ${examCode}`);
  return Math.round((format.minutes * 60) / format.maxQuestions);
}

/** Legacy CompTIA-only approximation. The UI never uses this as an exam pass line. */
export function approximatePassPercent(examCode) {
  if (examCode === 'clf-c02' || examCode === 'saa-c03') return null;
  const f = EXAM_FORMATS[examCode];
  return Math.round((100 * (f.passingScore - f.scaleMin)) / (f.scaleMax - f.scaleMin));
}

/** Small deterministic PRNG so tests can pin a draw. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const questionCodes = (question, topicCodes) => question.examCodes ?? topicCodes[question.topicId] ?? [];

/**
 * For one exam, lists every domain and objective with the questions that map to it.
 * AWS questions require explicit objective tags; legacy tracks retain topic mapping.
 */
export function buildExamPool({ objectives, questions, topics, examCode }) {
  const exam = objectives.exams.find((item) => item.code === examCode);
  if (!exam) throw new Error(`Unknown exam: ${examCode}`);
  const topicCodes = Object.fromEntries(topics.map((topic) => [topic.id, topic.examCodes ?? []]));
  const eligible = questions.filter((q) => questionCodes(q, topicCodes).includes(examCode));
  const domains = exam.domains.map((domain) => {
    const objectivesInDomain = domain.objectives.map((objective) => {
      const ids = new Set(objective.topics);
      return {
        id: objective.id,
        title: objective.title,
        topics: objective.topics,
        questionIds: eligible.filter((q) => q.objectiveIds?.[examCode]
          ? q.objectiveIds[examCode].includes(objective.id)
          : !['clf-c02', 'saa-c03'].includes(examCode) && ids.has(q.topicId)).map((q) => q.id),
      };
    });
    const unique = new Set(objectivesInDomain.flatMap((o) => o.questionIds));
    return { id: domain.id, title: domain.title, weight: domain.weight, objectives: objectivesInDomain, available: unique.size };
  });
  const totalUnique = new Set(domains.flatMap((d) => d.objectives.flatMap((o) => o.questionIds))).size;
  return { code: exam.code, name: exam.name, domains, totalUnique };
}

/** Largest-remainder split of `total` by weight, capped by each domain's available questions. */
export function allocateByWeight(domains, total) {
  const quota = Object.fromEntries(domains.map((d) => [d.id, 0]));
  let remaining = Math.min(total, domains.reduce((sum, d) => sum + d.available, 0));
  // Repeat: spread what is left across domains that still have spare questions.
  while (remaining > 0) {
    const open = domains.filter((d) => quota[d.id] < d.available);
    if (open.length === 0) break;
    const weightSum = open.reduce((sum, d) => sum + d.weight, 0) || open.length;
    const raw = open.map((d) => ({ d, share: (remaining * (weightSum === open.length && !d.weight ? 1 : d.weight)) / weightSum }));
    let given = 0;
    for (const { d, share } of raw) {
      const take = Math.min(Math.floor(share), d.available - quota[d.id]);
      quota[d.id] += take;
      given += take;
    }
    let left = remaining - given;
    const byRemainder = raw
      .map(({ d, share }) => ({ d, rem: share - Math.floor(share) }))
      .sort((a, b) => b.rem - a.rem || b.d.weight - a.d.weight);
    for (const { d } of byRemainder) {
      if (left === 0) break;
      if (quota[d.id] < d.available) { quota[d.id] += 1; left -= 1; }
    }
    if (left === remaining) break; // nothing could be placed
    remaining = left;
  }
  return quota;
}

/**
 * Drafts a test: domain counts follow exam weights, questions rotate through each
 * domain's objectives so one chapter cannot crowd out the rest, and the final
 * order is shuffled the way a real sitting mixes domains.
 */
/**
 * Orders question ids so ones never shown come first, then the ones shown longest
 * ago. `history` lists ids from older sittings to newer ones. With no history the
 * order is the plain shuffle, so seeded draws are unchanged.
 */
function freshFirst(ids, rng, lastSeen) {
  const shuffled = shuffle(ids, rng);
  if (lastSeen.size === 0) return shuffled;
  return shuffled
    .map((id, index) => ({ id, index, seen: lastSeen.has(id) ? lastSeen.get(id) : -1 }))
    .sort((a, b) => a.seen - b.seen || a.index - b.index)
    .map((entry) => entry.id);
}

/** Public form of freshFirst for other practice modes. `history` lists ids oldest first. */
export function freshFirstIds(ids, history = [], rng = Math.random) {
  const lastSeen = new Map();
  history.forEach((id, index) => lastSeen.set(id, index));
  return freshFirst(ids, rng, lastSeen);
}

export function draftTest(pool, requested, rng = Math.random, options = {}) {
  const lastSeen = new Map();
  (options.history ?? []).forEach((id, index) => lastSeen.set(id, index));
  const target = Math.min(requested, pool.totalUnique);
  const quota = allocateByWeight(pool.domains, target);
  const used = new Set();
  const picks = [];
  // Scarcest domains draw first so shared questions are not used up by larger domains.
  const order = [...pool.domains].sort((a, b) => a.available - b.available);
  for (const domain of order) {
    const queues = domain.objectives
      .map((o) => ({ objective: o, queue: freshFirst(o.questionIds, rng, lastSeen) }))
      .filter((o) => o.queue.length > 0);
    let need = quota[domain.id];
    let progress = true;
    for (const start = shuffle(queues, rng); need > 0 && progress;) {
      progress = false;
      for (const entry of start) {
        if (need === 0) break;
        while (entry.queue.length && used.has(entry.queue[0])) entry.queue.shift();
        const id = entry.queue.shift();
        if (id === undefined) continue;
        used.add(id);
        picks.push({ questionId: id, domainId: domain.id, objectiveId: entry.objective.id });
        need -= 1;
        progress = true;
      }
    }
  }
  // Overlap between domains can leave a shortfall; top up from anything unused.
  if (picks.length < target) {
    const spareItems = pool.domains.flatMap((d) => d.objectives.flatMap((o) =>
      o.questionIds.map((questionId) => ({ questionId, domainId: d.id, objectiveId: o.id }))));
    const spareOrder = freshFirst(spareItems.map((_, index) => index), rng, new Map(
      spareItems.flatMap((item, index) => (lastSeen.has(item.questionId) ? [[index, lastSeen.get(item.questionId)]] : []))));
    const spare = spareOrder.map((index) => spareItems[index]);
    for (const item of spare) {
      if (picks.length >= target) break;
      if (used.has(item.questionId)) continue;
      used.add(item.questionId);
      picks.push(item);
    }
  }
  return shuffle(picks, rng);
}

/** A copy of the pool without the given question ids, with counts recomputed. */
function withoutQuestions(pool, exclude) {
  const domains = pool.domains.map((domain) => {
    const objectives = domain.objectives.map((objective) => ({
      ...objective,
      questionIds: objective.questionIds.filter((id) => !exclude.has(id)),
    }));
    const unique = new Set(objectives.flatMap((objective) => objective.questionIds));
    return { ...domain, objectives, available: unique.size };
  });
  const totalUnique = new Set(domains.flatMap((d) => d.objectives.flatMap((o) => o.questionIds))).size;
  return { ...pool, domains, totalUnique };
}

/**
 * Drafts a test that leans on chosen objectives. `share` of the questions (0.6 by
 * default, 1 for a retest) come from those objectives, unseen first; the rest is a
 * normal weighted draft from everything else. Falls back to a normal draft when
 * the objectives have no questions.
 */
export function draftFocused(pool, requested, rng = Math.random, options = {}) {
  const wanted = new Set(options.objectiveIds ?? []);
  const share = options.share ?? 0.6;
  const lastSeen = new Map();
  (options.history ?? []).forEach((id, index) => lastSeen.set(id, index));
  const meta = new Map();
  for (const domain of pool.domains) {
    for (const objective of domain.objectives) {
      if (!wanted.has(objective.id)) continue;
      for (const id of objective.questionIds) {
        if (!meta.has(id)) meta.set(id, { questionId: id, domainId: domain.id, objectiveId: objective.id });
      }
    }
  }
  if (meta.size === 0) return draftTest(pool, requested, rng, { history: options.history });
  const target = Math.min(requested, pool.totalUnique);
  const focusCount = Math.min(meta.size, share >= 1 ? target : Math.round(target * share));
  const focusIds = freshFirst([...meta.keys()], rng, lastSeen).slice(0, focusCount);
  const focusPicks = focusIds.map((id) => meta.get(id));
  const rest = target - focusPicks.length;
  const restPicks = rest > 0 ? draftTest(withoutQuestions(pool, new Set(focusIds)), rest, rng, { history: options.history }) : [];
  return shuffle([...focusPicks, ...restPicks], rng);
}

export function isCorrect(question, pick) {
  if (pick === undefined || pick === null) return false;
  if (Array.isArray(question.answer)) {
    if (!Array.isArray(pick) || pick.length !== question.answer.length) return false;
    const a = [...pick].sort((x, y) => x - y);
    const b = [...question.answer].sort((x, y) => x - y);
    return a.every((value, i) => value === b[i]);
  }
  return (Array.isArray(pick) ? pick[0] : pick) === question.answer && (!Array.isArray(pick) || pick.length === 1);
}

/** Scores a finished sitting overall and per domain. */
export function gradeTest({ pool, picks, questionsById, responses }) {
  const domains = pool.domains.map((d) => ({ id: d.id, title: d.title, weight: d.weight, total: 0, correct: 0 }));
  const byId = Object.fromEntries(domains.map((d) => [d.id, d]));
  let correct = 0;
  let timedOut = 0;
  for (const pick of picks) {
    const response = responses[pick.questionId];
    const ok = isCorrect(questionsById[pick.questionId], response?.answer);
    if (response?.timedOut) timedOut += 1;
    byId[pick.domainId].total += 1;
    if (ok) { byId[pick.domainId].correct += 1; correct += 1; }
  }
  const percent = picks.length ? Math.round((100 * correct) / picks.length) : 0;
  return { correct, total: picks.length, percent, timedOut, domains: domains.filter((d) => d.total > 0) };
}

/** Display positions are independent of authored answer indices. */
export function shuffleChoiceOrder(question, rng = Math.random) {
  return shuffle(question.choices.map((_, index) => index), rng);
}

export function shuffleQuestionChoices(question, rng = Math.random) {
  const order = shuffleChoiceOrder(question, rng);
  const keys = Array.isArray(question.answer) ? question.answer : [question.answer];
  const answer = keys.map(key => order.indexOf(key));
  return { ...question, choices: order.map(i => question.choices[i]), answer: Array.isArray(question.answer) ? answer.sort((a,b) => a-b) : answer[0] };
}

/** A content fingerprint, not a security hash; edits invalidate saved practice evidence. */
export function assessmentVersion(questions) {
  const text = JSON.stringify([...questions].sort((a,b) => a.id.localeCompare(b.id)).map(q => [q.id,q.prompt,q.choices,q.answer,q.explanation,q.objectiveIds]));
  let hash = 2166136261;
  for (let i=0;i<text.length;i++) hash = Math.imul(hash ^ text.charCodeAt(i),16777619);
  return 'review-v2-' + (hash >>> 0).toString(16);
}

export function sessionDurationSeconds(examCode, count) {
  const format = EXAM_FORMATS[examCode];
  return Math.round(format.minutes * 60 * count / format.maxQuestions);
}
