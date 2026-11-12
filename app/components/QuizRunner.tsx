"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ExplanationText } from "@/app/components/ExplanationText";
import { ExamFocusPicker } from "@/app/components/ExamFocusPicker";
import { reportContent } from "@/app/components/ReportIssue";
import { useStudyFocus } from "@/app/components/useStudyFocus";
import { getFlashcards, getQuestions, getTopic, getTopics, questions as allQuestions } from "@/lib/content";
import { conceptVideos } from "@/lib/concept-videos";
import { freshFirstIds, shuffleChoiceOrder } from "@/lib/exam-test.mjs";
import { getProgressSnapshot, questionHistory, recordQuiz } from "@/lib/progress";
import { answerLabel, correctIndices, isCorrectPick } from "@/lib/quiz-feedback";
import { selectInlineRemediation } from "@/lib/inline-remediation";
import { rankMissedQuestions } from "@/lib/weak-areas";
import { n10AddressingGuidanceKeys } from "@/lib/n10-remediation";
import { examForStudyQuestion, examForStudyQuestions, isN10Question, sendStudyEvent, sendStudyEventOnNavigation } from "@/lib/study-telemetry";
import { wrongChoicesForQuiz } from "@/lib/quiz-answer-history";
import { visualItemsForTopic } from "@/lib/visuals";
import type { ExamCode, Question, StudyFocus } from "@/lib/types";
import { awsClfAlternatives, awsClfConceptEvidence, awsClfPracticeAt, awsClfRemediation, AWS_RESPONSIBILITY_TOPIC, remediationQuizHref } from "@/lib/aws-clf-remediation";

export function QuizRunner({ initialTopic, questionIds, scoped = false, scopedExam }: { initialTopic: string; questionIds?: string[]; scoped?: boolean; scopedExam?: ExamCode }) {
  const t = useTranslations("quizRunner");
  const remediationT = useTranslations("weakAreas.remediation");
  const addressingT = useTranslations("weakAreas.addressingRemediation");
  const [focus, setFocus] = useStudyFocus();
  const [topicId, setTopicId] = useState(initialTopic);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, number | number[]>>({});
  const [done, setDone] = useState(false);
  const telemetryAnswered = useRef(new Set<string>());
  const telemetryRemediation = useRef(new Set<string>());
  const telemetryCompleted = useRef(false);
  const displayedOrders = useRef<Record<string, number[]>>({});
  const recordedIds = useRef(new Set<string>());
  const activeDeck = useRef<Question[] | null>(null);
  const [runExam, setRunExam] = useState<ExamCode | undefined>(scopedExam);

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
  const revealed = current !== undefined && answers[current.id] !== undefined;
  const correct = current !== undefined && revealed && isCorrectPick(current, answers[current.id]);
  const correctCount = quiz.filter((question) =>
    isCorrectPick(question, answers[question.id]),
  ).length;
  const inlineRemediation = useMemo(() => {
    if (!current || !revealed || correct) return undefined;
    const priorMisses = rankMissedQuestions(getProgressSnapshot(), allQuestions)
      .find((row) => row.question.id === current.id)?.misses ?? 0;
    const resourceFocus = current.examCodes?.[0] ?? getTopic(current.topicId)?.examCodes[0] ?? focus;
    const pick = answers[current.id];
    return selectInlineRemediation(current, {
      selectedChoice: typeof pick === "number" ? pick : undefined,
      priorMisses,
      flashcards: getFlashcards(awsClfRemediation(current) ? AWS_RESPONSIBILITY_TOPIC : current.topicId, resourceFocus),
      videos: conceptVideos,
      visualsForTopic: visualItemsForTopic,
      questions: allQuestions,
    });
  }, [answers, correct, current, focus, revealed]);

  const guidance = (section: string, key: string) => n10AddressingGuidanceKeys.has(key)
    ? addressingT(`${section}.${key}` as never)
    : remediationT(`${section}.${key}` as never);

  function changeFocus(nextFocus: StudyFocus) {
    setFocus(nextFocus);
    setTopicId("all");
  }

  function begin(sources: Question[], preferred?: ExamCode, eventTopicId = topicId) {
    displayedOrders.current = {};
    const deck = sources.map((source) => {
      const choiceOrder = shuffleChoiceOrder(source);
      displayedOrders.current[source.id] = choiceOrder;
      const answer = Array.isArray(source.answer)
        ? choiceOrder.map((authored) => (source.answer as number[]).indexOf(authored)).filter((index) => index >= 0).sort((a, b) => a - b)
        : choiceOrder.indexOf(source.answer as number);
      return { ...source, choices: choiceOrder.map((choice) => source.choices[choice]), answer };
    });
    activeDeck.current = deck;
    setQuiz(deck);
    setIndex(0);
    setPicked([]);
    setAnswers({});
    setDone(false);
    telemetryAnswered.current.clear();
    telemetryRemediation.current.clear();
    telemetryCompleted.current = false;
    recordedIds.current.clear();
    const exam = examForStudyQuestions(deck, preferred);
    setRunExam(exam);
    if (exam) {
      sendStudyEvent({
        type: "quiz_started",
        exam,
        topicId: eventTopicId === "all" || eventTopicId === "weak" ? undefined : eventTopicId,
        questionCount: deck.length,
      });
    }
    setStarted(true);
  }

  function start() {
    const byId = new Map(pool.map((q) => [q.id, q]));
    const order = freshFirstIds(pool.map((q) => q.id), questionHistory(getProgressSnapshot()));
    begin(order.slice(0, Math.min(15, order.length)).map(id => byId.get(id)!), scopedExam ?? (focus !== "all" ? focus : undefined));
  }

  /** Commit answered items once before replacing the deck or leaving its results. */
  function persistAnswers() {
    if (activeDeck.current !== quiz) return;
    const pending = quiz.filter(question => answers[question.id] !== undefined && !recordedIds.current.has(question.id));
    if (!pending.length) return;
    pending.forEach(question => recordedIds.current.add(question.id));
    const missed = pending.filter(question => !isCorrectPick(question, answers[question.id])).map(question => question.id);
    // Scoped repeats need distinct merge identities even under a fixed/low-resolution clock.
    // Other tracks keep their existing recording timestamp behavior.
    const at = pending.every(question => awsClfRemediation(question))
      ? awsClfPracticeAt(getProgressSnapshot(), Date.now())
      : undefined;
    recordQuiz({ topicId, correct: pending.length - missed.length, total: pending.length,
      questionIds: pending.map(question => question.id), missedIds: missed,
      wrongChoices: wrongChoicesForQuiz(pending, answers, displayedOrders.current) }, at);
  }

  function practiceAws(questionId: string, sourceQuestion: Question) {
    if (activeDeck.current !== quiz) return;
    const source = allQuestions.find(question => question.id === questionId);
    if (!source || !awsClfRemediation(source) || awsClfRemediation(source)?.id !== awsClfRemediation(sourceQuestion)?.id) return;
    if (source.id !== sourceQuestion.id) sendStudyEvent({ type: "similar_question_started", question: sourceQuestion, exam: "clf-c02", resourceType: "retry" });
    persistAnswers();
    setTopicId(source.topicId);
    begin([source], "clf-c02", source.topicId);
  }

  function awsPracticeActions(question: Question) {
    const authored = allQuestions.find(source => source.id === question.id);
    if (!authored || !awsClfRemediation(authored)) return null;
    const seen = new Set([...questionHistory(getProgressSnapshot()), ...Object.keys(answers)]);
    const alternatives = awsClfAlternatives(authored, allQuestions).sort((a, b) => Number(seen.has(a)) - Number(seen.has(b)) || a.localeCompare(b));
    return <div className="flex flex-wrap items-center gap-3" data-aws-practice-actions>
      <button type="button" onClick={() => practiceAws(authored.id, authored)} className="min-h-11 text-teal-200 underline underline-offset-4">{t("repeatQuestion")}</button>
      {alternatives[0]
        ? <button type="button" onClick={() => practiceAws(alternatives[0], authored)} className="min-h-11 text-teal-200 underline underline-offset-4">{t("practiceConcept")}</button>
        : <p className="text-sm text-slate-400">{t("awsNoAlternative")}</p>}
    </div>;
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
    if (!current || picked.length === 0 || revealed || telemetryAnswered.current.has(current.id)) return;
    const answer = multi ? picked : picked[0];
    telemetryAnswered.current.add(current.id);
    const exam = examForStudyQuestion(current, runExam);
    if (exam) {
      const correctAnswer = isCorrectPick(current, answer);
      const priorMisses = rankMissedQuestions(getProgressSnapshot(), allQuestions)
        .find((row) => row.question.id === current.id)?.misses ?? 0;
      sendStudyEvent({
        type: "question_answered",
        exam,
        question: current,
        correct: correctAnswer,
        missCount: correctAnswer ? undefined : priorMisses + 1,
      });
    }
    setAnswers({ ...answers, [current.id]: answer });
  }

  /** After the last explanation: record the sitting once and show the score. */
  function finish() {
    if (activeDeck.current !== quiz) return;
    persistAnswers();
    if (!telemetryCompleted.current) {
      telemetryCompleted.current = true;
      const exam = runExam;
      if (exam) {
        sendStudyEvent({
          type: "quiz_completed",
          exam,
          topicId: topicId === "all" || topicId === "weak" ? undefined : topicId,
          questionCount: quiz.length,
          correctCount: quiz.filter((question) => isCorrectPick(question, answers[question.id])).length,
          missedCount: quiz.filter((question) => !isCorrectPick(question, answers[question.id])).length,
        });
      }
    }
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
    const conceptIds = new Set<string | undefined>(quiz.map(question => awsClfRemediation(question)?.id));
    const evidence = awsClfConceptEvidence(getProgressSnapshot(), allQuestions).filter(row => conceptIds.has(row.conceptId));
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
        {evidence.map(row => <section key={row.conceptId} data-aws-concept-evidence className="space-y-2 rounded-xl border border-slate-700 p-4" aria-label={remediationT(`clusters.${row.labelKey}` as never)}>
          <h2 className="font-semibold text-white">{remediationT(`clusters.${row.labelKey}` as never)}</h2>
          <p className="text-sm text-slate-300">{t("awsRepeatedEvidence", { count: row.repeatedCorrect })}</p>
          <p className="text-sm text-slate-300">{t("awsTransferEvidence", { count: row.transferCorrect })}</p>
          {row.currentlyRecovered && <p className="text-sm text-teal-200">{t("awsRecoveryEvidence")}</p>}
        </section>)}
        {quiz.filter(question => awsClfRemediation(question)).map(question => <section key={question.id} className="space-y-2">
          <p className="text-sm text-slate-300">{question.prompt}</p>
          {awsPracticeActions(question)}
        </section>)}
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
          {awsPracticeActions(current)}
          {!correct && inlineRemediation && (
            <details data-inline-remediation onToggle={(event) => {
              if (event.currentTarget.open && !telemetryRemediation.current.has(current.id) && (isN10Question(current) || awsClfRemediation(current))) {
                telemetryRemediation.current.add(current.id);
                sendStudyEvent({ type: "remediation_opened", question: current });
              }
            }} className="mt-4 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
              <summary data-inline-remediation-toggle className="cursor-pointer font-semibold text-amber-200">{t("learnThisNow")}</summary>
              <div className="mt-3 space-y-3 text-slate-300">
                <p className="text-xs uppercase tracking-wide text-slate-400">{t("learnThisNowIntro")}</p>
                {inlineRemediation.priorMisses > 0 && <p data-inline-repeated-miss className="text-amber-200">{t("repeatedMiss", { count: inlineRemediation.priorMisses + 1 })}</p>}
                {inlineRemediation.whyWrongKey && <p data-inline-why-wrong><strong>{t("whyWrong")}</strong> {guidance("whyWrong", inlineRemediation.whyWrongKey)}</p>}
                {inlineRemediation.examClueKey && <p data-inline-exam-clue><strong>{t("examClue")}</strong> {guidance("examClues", inlineRemediation.examClueKey)}</p>}
                {inlineRemediation.memoryRuleKey && <p data-inline-memory-rule><strong>{t("memoryRule")}</strong> {guidance("memoryRules", inlineRemediation.memoryRuleKey)}</p>}
                {inlineRemediation.visual && <a data-inline-visual href={`/visuals/${inlineRemediation.visual.file}`} onClick={() => sendStudyEventOnNavigation({ type: "remediation_resource_opened", question: current, resourceType: "visual" })} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">{t("viewVisual", { title: inlineRemediation.visual.title })}</a>}
                {inlineRemediation.flashcards.length > 0 && <section data-inline-flashcards aria-label={t("flashcards")}>
                  <h3 className="font-semibold text-white">{t("flashcards")}</h3>
                  <ul className="mt-2 space-y-2">
                    {inlineRemediation.flashcards.map((card) => <li key={card.id} className="rounded-lg border border-slate-700 px-3 py-2"><details onToggle={(event) => {
                      if (event.currentTarget.open && (isN10Question(current) || awsClfRemediation(current))) sendStudyEvent({ type: "remediation_resource_opened", question: current, resourceType: "flashcard" });
                    }}><summary className="cursor-pointer font-medium text-slate-100">{card.front}</summary><p className="mt-2 text-slate-400">{card.back}</p></details></li>)}
                  </ul>
                </section>}
                {inlineRemediation.video && <Link data-inline-video href={`/networking/videos/${inlineRemediation.video.slug}`} onClick={() => sendStudyEventOnNavigation({ type: "remediation_resource_opened", question: current, resourceType: "video" })} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">{t("watchVideo", { title: inlineRemediation.video.title })}</Link>}
                <Link data-inline-notes href={inlineRemediation.notesHref} onClick={() => sendStudyEventOnNavigation({ type: "remediation_resource_opened", question: current, resourceType: "notes" })} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">{t("reviewNotes")}</Link>
                {inlineRemediation.retryQuestionIds.length > 0 && !awsClfRemediation(current) && <Link data-inline-retry href={remediationQuizHref(inlineRemediation.retryQuestionIds, inlineRemediation.retryExam ?? "n10-009")} onClick={() => sendStudyEventOnNavigation({ type: "similar_question_started", question: current, resourceType: "retry" })} className="inline-flex min-h-11 items-center text-teal-200 underline underline-offset-4">{t("trySimilar")}</Link>}
              </div>
            </details>
          )}
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
