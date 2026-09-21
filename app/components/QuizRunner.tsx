"use client";

import { useMemo, useState } from "react";
import { ExamFocusPicker } from "@/app/components/ExamFocusPicker";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { getQuestions, getTopics } from "@/lib/content";
import { recordQuiz } from "@/lib/progress";
import type { Question, StudyFocus } from "@/lib/types";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function QuizRunner({ initialTopic }: { initialTopic: string }) {
  const [focus, setFocus] = useStudyFocus();
  const [topicId, setTopicId] = useState(initialTopic);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const pool = useMemo(() => getQuestions(topicId, focus), [topicId, focus]);
  const topicOptions = getTopics(focus);
  const [quiz, setQuiz] = useState<Question[]>([]);

  const current = quiz[index];
  const correctCount = quiz.filter((question) => answers[question.id] === question.answer).length;

  function changeFocus(nextFocus: StudyFocus) {
    setFocus(nextFocus);
    setTopicId("all");
  }

  function start() {
    const deck = shuffle(pool).slice(0, Math.min(15, pool.length));
    setQuiz(deck);
    setIndex(0);
    setSelected(null);
    setAnswers({});
    setDone(false);
    setStarted(true);
  }

  function submit() {
    if (selected === null || !current) return;
    const nextAnswers = { ...answers, [current.id]: selected };
    setAnswers(nextAnswers);
    if (index + 1 >= quiz.length) {
      const missed = quiz
        .filter((question) => nextAnswers[question.id] !== question.answer)
        .map((question) => question.id);
      const correct = quiz.length - missed.length;
      recordQuiz({ topicId, correct, total: quiz.length, missedIds: missed });
      setDone(true);
      return;
    }
    setIndex(index + 1);
    setSelected(null);
  }

  if (!started) {
    return (
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <ExamFocusPicker focus={focus} onChange={changeFocus} />
        </section>
        <select
          value={topicId}
          onChange={(event) => setTopicId(event.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 sm:w-auto"
        >
          <option value="all">Mixed focused quiz</option>
          <option value="weak">Weak areas only</option>
          {topicOptions.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.chapter}: {topic.title}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-400">
          {pool.length} original practice questions in this focused pool. A sitting uses up to 15,
          shuffled. Scores stay on this device.
        </p>
        <button
          type="button"
          onClick={start}
          disabled={pool.length === 0}
          className="rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950 hover:bg-teal-400 disabled:opacity-40"
        >
          Start quiz
        </button>
      </div>
    );
  }

  if (done) {
    const missed = quiz.filter((question) => answers[question.id] !== question.answer);
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
          <p className="text-sm text-teal-300">Score</p>
          <p className="mt-2 text-4xl font-semibold text-white">
            {correctCount}/{quiz.length}
          </p>
          <p className="mt-2 text-slate-400">
            {Math.round((correctCount / quiz.length) * 100)}% on this device
          </p>
        </div>
        {missed.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-medium text-white">Review missed questions</h2>
            {missed.map((question) => (
              <article
                key={question.id}
                className="rounded-xl border border-amber-900/70 bg-slate-900 p-4"
              >
                <p className="font-medium text-white">{question.prompt}</p>
                <p className="mt-2 text-sm text-red-300">
                  Your answer: {question.choices[answers[question.id]]}
                </p>
                <p className="mt-1 text-sm text-teal-200">
                  Correct: {question.choices[question.answer]}
                </p>
                <p className="mt-2 text-sm text-slate-400">{question.explanation}</p>
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
          Another quiz
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Question {index + 1} of {quiz.length}
        {current.weak ? " · Weak area" : ""}
      </p>
      <h2 className="text-xl font-medium text-white">{current.prompt}</h2>
      <ul className="space-y-2">
        {current.choices.map((choice, choiceIndex) => {
          const isPicked = selected === choiceIndex;
          const revealed = answers[current.id] !== undefined;
          const isCorrect = choiceIndex === current.answer;
          const showFeedback = revealed && (isPicked || isCorrect);
          return (
            <li key={choice}>
              <button
                type="button"
                onClick={() => setSelected(choiceIndex)}
                className={`w-full rounded-xl border px-4 py-3 text-left ${
                  isPicked
                    ? "border-teal-400 bg-teal-950/50"
                    : "border-slate-700 bg-slate-900"
                } ${showFeedback && isCorrect ? "ring-1 ring-teal-400" : ""}`}
              >
                {choice}
              </button>
            </li>
          );
        })}
      </ul>
      {answers[current.id] !== undefined && (
        <p className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300">
          {current.explanation}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          if (answers[current.id] === undefined) {
            if (selected === null) return;
            setAnswers({ ...answers, [current.id]: selected });
            return;
          }
          submit();
        }}
        className="rounded-full bg-teal-500 px-5 py-2 font-medium text-slate-950 hover:bg-teal-400"
      >
        {answers[current.id] === undefined
          ? "Check answer"
          : index + 1 === quiz.length
            ? "Finish"
            : "Next"}
      </button>
    </div>
  );
}
