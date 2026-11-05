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
import { answerLabel, correctIndices, isCorrectPick } from "@/lib/quiz-feedback";
import type { Question, StudyFocus } from "@/lib/types";

export function QuizRunner({ initialTopic, questionIds, scoped = false }: { initialTopic: string; questionIds?: string[]; scoped?: boolean }) {
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

  /** Locks in the pick so the right answer and explanation show. Moving on is a separate step. */
  function submit() {
    if (!current || picked.length === 0) return;
    setAnswers({ ...answers, [current.id]: multi ? picked : picked[0] });
  }

  /** After the last explanation: record the sitting once and show the score. */
  function finish() {
    const missed = quiz
      .filter((question) => !isCorrectPick(question, answers[question.id]))
      .map((question) => question.id);
    recordQuiz({ topicId, correct: quiz.length - missed.length, total: quiz.length, questionIds: quiz.map((question) => question.id), missedIds: missed });
    setDone(true);
  }

  if (!started) {
    return (
      <div className="space-y-5">
        {scoped ? null : (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <ExamFocusPicker focus={focus} onChange={changeFocus} />
          </section>
        )}
        {scoped ? null : <select
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
        </select>}
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
  const correct = revealed && isCorrectPick(current, answers[current.id]);

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
      <h2 data-quiz-question className="text-xl font-medium text-white">{current.prompt}</h2>
      <ul data-quiz-choices className="space-y-2">
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
        <div
          data-quiz-feedback
          role="status"
          aria-live="polite"
          className={`space-y-2 rounded-xl border bg-slate-950 px-4 py-3 text-sm ${
            correct
              ? "border-teal-300/50 text-teal-100"
              : "border-rose-300/50 text-rose-100"
          }`}
        >
          <p className="font-semibold">
            {t(correct ? "correctStatus" : "incorrectStatus")}
          </p>
          <p>
            {t("yourAnswer", {
              answer: answerLabel(current, answers[current.id]),
            })}
          </p>
          <p>
            {t("correctAnswer", {
              answer: answerLabel(current, current.answer),
            })}
          </p>
          <p className="text-slate-300">
            <ExplanationText text={current.explanation} />
          </p>
        </div>
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
            finish();
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
