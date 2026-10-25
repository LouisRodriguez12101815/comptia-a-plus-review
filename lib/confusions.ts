import { confusionGroups, type ConfusionGroup, type ConfusionTerm } from "@/content/confusion-groups";
import type { MockAttempt } from "@/lib/progress";
import type { Question } from "@/lib/types";

export { confusionGroups, type ConfusionGroup, type ConfusionTerm };
export type TermRef = { group: ConfusionGroup; term: ConfusionTerm };

const compiled = confusionGroups.flatMap((group) => group.terms.map((term) => ({ group, term, re: new RegExp(term.match, "i") })));

/** The one term a choice names, or undefined when it names none or more than one. */
export function termFor(text: string): TermRef | undefined {
  const hits = compiled.filter((c) => c.re.test(text.trim()));
  return hits.length === 1 ? { group: hits[0].group, term: hits[0].term } : undefined;
}

export type Confusion = { groupId: string; answer: TermRef; picked: TermRef };

/**
 * When a wrong pick and the right answer name two different terms from the
 * same group, that is a look-alike mix-up. Multi-answer questions are skipped.
 */
export function confusionFor(question: Question, picked: number | undefined): Confusion | undefined {
  if (picked === undefined || Array.isArray(question.answer) || picked === question.answer) return undefined;
  const answer = termFor(question.choices[question.answer] ?? "");
  const wrong = termFor(question.choices[picked] ?? "");
  if (!answer || !wrong || answer.group.id !== wrong.group.id || answer.term.id === wrong.term.id) return undefined;
  return { groupId: answer.group.id, answer, picked: wrong };
}

export type ConfusionPair = {
  key: string;
  group: ConfusionGroup;
  answer: ConfusionTerm;
  picked: ConfusionTerm;
  count: number;
  lastAt: number;
  questionIds: string[];
};

/** Every look-alike mix-up in saved sittings for one exam, most frequent first. */
export function confusionPairs(attempts: MockAttempt[], exam: string, questionsById: Record<string, Question>): ConfusionPair[] {
  const pairs = new Map<string, ConfusionPair>();
  for (const attempt of attempts) {
    if (attempt.exam !== exam) continue;
    for (const [questionId, picked] of Object.entries(attempt.wrongChoices ?? {})) {
      const question = questionsById[questionId];
      if (!question) continue;
      const c = confusionFor(question, picked);
      if (!c) continue;
      const key = `${c.groupId}:${c.answer.term.id}>${c.picked.term.id}`;
      const pair = pairs.get(key) ?? { key, group: c.answer.group, answer: c.answer.term, picked: c.picked.term, count: 0, lastAt: 0, questionIds: [] };
      pair.count += 1;
      pair.lastAt = Math.max(pair.lastAt, attempt.at);
      if (!pair.questionIds.includes(questionId)) pair.questionIds.push(questionId);
      pairs.set(key, pair);
    }
  }
  return [...pairs.values()].sort((a, b) => b.count - a.count || b.lastAt - a.lastAt);
}

/**
 * Questions for drilling one pair: the ones where the mix-up happened, then any
 * other single-answer question whose answer is either term and that offers the
 * other one as a choice, then ones whose answer is either term.
 */
export function drillQuestionIds(pair: Pick<ConfusionPair, "group" | "answer" | "picked" | "questionIds">, bank: Question[], limit = 8): string[] {
  const ids = new Set(pair.questionIds);
  const pairIds = new Set([pair.answer.id, pair.picked.id]);
  const contrast: string[] = [];
  const either: string[] = [];
  for (const q of bank) {
    if (ids.has(q.id) || Array.isArray(q.answer)) continue;
    const answer = termFor(q.choices[q.answer] ?? "");
    if (!answer || answer.group.id !== pair.group.id || !pairIds.has(answer.term.id)) continue;
    const other = answer.term.id === pair.answer.id ? pair.picked.id : pair.answer.id;
    const offersOther = q.choices.some((choice, i) => { const ref = i === q.answer ? undefined : termFor(choice); return ref?.group.id === pair.group.id && ref.term.id === other; });
    (offersOther ? contrast : either).push(q.id);
  }
  return [...ids, ...contrast, ...either].slice(0, limit);
}

/** Reads a pair key such as "remote-access:ssh>telnet" back into its two terms. */
export function pairFromKey(key: string): { group: ConfusionGroup; answer: ConfusionTerm; picked: ConfusionTerm } | undefined {
  const match = /^([\w-]+):([\w-]+)>([\w-]+)$/.exec(key);
  if (!match) return undefined;
  const group = confusionGroups.find((g) => g.id === match[1]);
  const answer = group?.terms.find((term) => term.id === match[2]);
  const picked = group?.terms.find((term) => term.id === match[3]);
  return group && answer && picked && answer !== picked ? { group, answer, picked } : undefined;
}
