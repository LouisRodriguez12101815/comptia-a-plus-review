"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ExplanationText } from "@/app/components/ExplanationText";
import { ExamFocusPicker } from "@/app/components/ExamFocusPicker";
import { reportContent } from "@/app/components/ReportIssue";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { getQuestions, getTopics, questions as allQuestions } from "@/lib/content";
import { freshFirstIds, shuffleQuestionChoices } from "@/lib/exam-test.mjs";
import { getProgressSnapshot, questionHistory, recordQuiz } from "@/lib/progress";
import type { Question, StudyFocus } from "@/lib/types";

function correctIndices(question: Question): number[] {
  return Array.isArray(question.answer) ? question.answer : [question.answer];
}

function sameSet(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((value, i) => value === sortedB[i]);
}

function isCorrectPick(question: Question, pick: number | number[] | undefined) {
  if (pick === undefined || pick === null) return false;
  if (Array.isArray(question.answer)) {
    return Array.isArray(pick) && sameSet(pick, question.answer);
  }
  return pick === question.answer;
}

function answerLabel(question: Question, pick: number | number[] | undefined) {
  if (pick === undefined || pick === null) return "—";
  const indices = Array.isArray(pick) ? pick : [pick];
  return indices.map((i) => question.choices[i]).join(" · ");
}

export function QuizRunner({ initialTopic, questionIds }: { initialTopic: string; questionIds?: string[] }) {
  const t = useTranslations("quizRunner");
  const [focus, setFocus] = useStudyFocus();
  const [topicId, setTopicId] = useState(initialTopic);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | number[]>>({});
  const [done, setDone] = useState(false);

  const idKey = questionIds ? questionIds.join("|") : null;
  const pool = useMemo(() => {
    if (idKey === null) return getQuestions(topicId, focus);
    const wanted = new Set(idKey.split("|"));
    return allQuestions.filter((q) => wanted.has(q.id));
  }, [topicId, focus, idKey]);
  const topicOptions = getTopics(focus);
  const [quiz, setQuiz] = useState<Question[]>([]);

  const current = quiz[index];
  const multi = current !== undefined && Array.isArray(current.answer);
  const correctCount = quiz.filter((question) =>
    isCorrectPick(question, answers[question.id]),
  ).length;

  function changeFocus(nextFocus: StudyFocus) {
    setFocus(nextFocus);
    setTopicId("all");
  }

  function start() {
    // Questions not seen in earlier quizzes or tests come first, then the ones seen longest ago.
    const byId = new Map(pool.map((q) => [q.id, q]));
    const order = freshFirstIds(pool.map((q) => q.id), questionHistory(getProgressSnapshot()));
    const deck = order.slice(0, Math.min(15, order.length)).map((id) => shuffleQuestionChoices(byId.get(id)!));
    setQuiz(deck);
    setIndex(0);
    setPicked([]);
    setAnswers({});
    setDone(false);
    setStarted(true);
  }

  function togglePick(choiceIndex: number) {
    setPicked((prev) =>
      prev.includes(choiceIndex)
        ? prev.filter((i) => i !== choiceIndex)
        : [...prev, choiceIndex],
    );
  }

  function submit() {
    if (!current || picked.length === 0) return;
    const value = multi ? picked : picked[0];
    const nextAnswers = { ...answers, [current.id]: value };
    setAnswers(nextAnswers);
    if (index + 1 >= quiz.length) {
      const missed = quiz
        .filter((question) => !isCorrectPick(question, nextAnswers[question.id]))
        .map((question) => question.id);
      const correct = quiz.length - missed.length;
      recordQuiz({ topicId, correct, total: quiz.length, questionIds: quiz.map((question) => question.id), missedIds: missed });
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setPicked([]);
  }

  if (!started) {
    return (
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <ExamFocusPicker focus={focus} onChange={changeFocus} />
        </section>
        <select
          aria-label={t("chooseQuiz")}
          value={topicId}
          onChange={(event) => setTopicId(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 sm:w-auto"
        >
          <option value="all">{t("mixedFocused")}</option>
          <option value="weak">{t("weakOnly")}</option>
          {topicOptions.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.chapter}: {topic.title}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-400">
          {t("poolSummary", { count: pool.length })}
        </p>
        <button
          type="button"
          onClick={start}
          disabled={pool.length === 0}
          className="rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950 hover:bg-teal-400 disabled:opacity-40"
        >
          {t("startQuiz")}
        </button>
      </div>
    );
  }

  if (done) {
    const missed = quiz.filter(
      (question) => !isCorrectPick(question, answers[question.id]),
    );
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <p className="text-sm text-teal-300">{t("score")}</p>
          <p className="mt-2 text-4xl font-semibold text-white">
            {correctCount}/{quiz.length}
          </p>
          <p className="mt-2 text-slate-400">
            {t("percentOnDevice", { percent: Math.round((correctCount / quiz.length) * 100) })}
          </p>
        </div>
        {missed.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-white">{t("reviewMissed")}</h2>
            {missed.map((question) => (
              <article
                key={question.id}
                className="rounded-xl border border-amber-900/70 bg-slate-900 p-4"
              >
                <p className="font-medium text-white">{question.prompt}</p>
                <p className="mt-2 text-sm text-red-300">
                  {t("yourAnswer", { answer: answerLabel(question, answers[question.id]) })}
                </p>
                <p className="mt-1 text-sm text-teal-200">
                  {t("correctAnswer", { answer: answerLabel(question, question.answer) })}
                </p>
                <p className="mt-2 text-sm text-slate-400"><ExplanationText text={question.explanation} /></p>
              </article>
            ))}
          </section>
        )}
        <button
          type="button"
          onClick={() => {
            setStarted(false);
            setDone(false);
          }}
          className="rounded-full border border-slate-600 px-4 py-2 text-sm"
        >
          {t("anotherQuiz")}
        </button>
      </div>
    );
  }

  const revealed = answers[current.id] !== undefined;

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        {t("questionProgress", {
          current: index + 1,
          total: quiz.length,
          weak: current.weak ? "yes" : "no",
          multi: multi ? "yes" : "no",
        })}
      </p>
      <h2 className="text-xl font-medium text-white">{current.prompt}</h2>
      <ul className="space-y-2">
        {current.choices.map((choice, choiceIndex) => {
          const isPicked = picked.includes(choiceIndex);
          const isRight = correctIndices(current).includes(choiceIndex);
          const showFeedback = revealed && (isPicked || isRight);
          const feedbackState = showFeedback
            ? isRight
              ? " ring-1 ring-teal-400"
              : " ring-1 ring-red-400"
            : "";
          return (
            <li key={choice}>
              <button
                type="button"
                onClick={() => {
                  if (!revealed) togglePick(choiceIndex);
                }}
                className={`w-full rounded-xl border px-4 py-3 text-left ${
                  isPicked
                    ? "border-teal-400 bg-teal-950/50"
                    : "border-slate-700 bg-slate-900"
                }${feedbackState}`}
              >
                {choice}
              </button>
            </li>
          );
        })}
      </ul>
      {revealed && (
        <p className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
          <ExplanationText text={current.explanation} />
        </p>
      )}
      <button
        type="button"
        onClick={() => reportContent(`Question ${current.id}: ${current.prompt}`, "Wrong answer key")}
        className="block min-h-11 text-left text-xs text-slate-400 underline decoration-dotted underline-offset-4 hover:text-amber-200"
      >
        {t("disputeQuestion")}
      </button>
      <button
        type="button"
        onClick={() => {
          if (!revealed) {
            submit();
            return;
          }
          if (index + 1 === quiz.length) {
            setDone(true);
            return;
          }
          setIndex(index + 1);
          setPicked([]);
        }}
        disabled={!revealed && picked.length === 0}
        className="rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950 hover:bg-teal-400 disabled:opacity-40"
      >
        {!revealed ? t("checkAnswer") : index + 1 === quiz.length ? t("finish") : t("next")}
      </button>
    </div>
  );
}
