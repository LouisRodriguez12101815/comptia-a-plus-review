import { DEFAULT_STUDY_FOCUS, isStudyFocus } from './exam-options.mjs';
export function createEmptyProgress() {
    return {
        studyFocus: DEFAULT_STUDY_FOCUS,
        knownCards: {},
        unknownCards: {},
        quizAttempts: [],
        mockAttempts: [],
        schedules: {},
    };
}
const isRecord = (value) => !!value && typeof value === "object" && !Array.isArray(value);
function flags(value) {
    if (value === undefined)
        return { value: {}, repaired: false };
    if (!isRecord(value))
        return { value: {}, repaired: true };
    const entries = Object.entries(value).filter((entry) => entry[1] === true);
    return { value: Object.fromEntries(entries), repaired: entries.length !== Object.keys(value).length };
}
function isAttemptBase(value) {
    return isRecord(value) && typeof value.topicId === "string" && Number.isFinite(value.correct) && Number.isFinite(value.total)
        && value.total > 0 && Array.isArray(value.missedIds) && Number.isFinite(value.at)
        && (value.questionIds === undefined || (Array.isArray(value.questionIds) && value.questionIds.every((id) => typeof id === "string")));
}
function validChoiceIndex(value) {
    return Number.isInteger(value) && value >= 0;
}
function repairedChoiceMap(value, allowSets) {
    if (value === undefined)
        return { repaired: false };
    if (!isRecord(value))
        return { repaired: true };
    const kept = {};
    let repaired = false;
    for (const [id, choice] of Object.entries(value)) {
        if (validChoiceIndex(choice))
            kept[id] = choice;
        else if (allowSets && Array.isArray(choice) && choice.length > 0 && choice.every(validChoiceIndex))
            kept[id] = [...choice];
        else
            repaired = true;
    }
    return { value: Object.keys(kept).length ? kept : undefined, repaired };
}
function parseQuizAttempt(value) {
    if (!isAttemptBase(value))
        return { attempt: null, repaired: false };
    const input = value;
    const wrong = repairedChoiceMap(input.wrongChoices, false);
    const selected = repairedChoiceMap(input.selectedChoices, true);
    const attempt = { ...input };
    if (wrong.value)
        attempt.wrongChoices = wrong.value;
    else
        delete attempt.wrongChoices;
    if (selected.value)
        attempt.selectedChoices = selected.value;
    else
        delete attempt.selectedChoices;
    return { attempt, repaired: wrong.repaired || selected.repaired };
}
function isMockDomain(value) {
    return isRecord(value) && typeof value.id === "string" && typeof value.title === "string"
        && Number.isFinite(value.correct) && Number.isFinite(value.total) && value.total > 0;
}
function isMockAttempt(value) {
    return isRecord(value) && typeof value.exam === "string" && typeof value.full === "boolean"
        && Number.isFinite(value.correct) && Number.isFinite(value.total) && Number.isFinite(value.percent)
        && Array.isArray(value.domains) && value.domains.every(isMockDomain)
        && Number.isFinite(value.multiCorrect) && Number.isFinite(value.multiTotal)
        && (value.bankVersion === undefined || typeof value.bankVersion === "string")
        && [value.correctIds, value.multiQuestionIds].every(ids => ids === undefined || (Array.isArray(ids) && ids.every(id => typeof id === "string")))
        && (value.questionIds === undefined || (Array.isArray(value.questionIds) && value.questionIds.every((id) => typeof id === "string")))
        && (value.objectiveByQuestion === undefined || (isRecord(value.objectiveByQuestion) && Object.values(value.objectiveByQuestion).every((id) => typeof id === "string")))
        && [value.sureIds, value.guessedIds].every((ids) => ids === undefined || (Array.isArray(ids) && ids.every((id) => typeof id === "string")))
        && (value.wrongChoices === undefined || (isRecord(value.wrongChoices) && Object.values(value.wrongChoices).every((n) => Number.isInteger(n) && n >= 0)))
        && Array.isArray(value.missedIds) && Number.isFinite(value.at);
}
/**
 * Python Class 10 pattern: try the conversion, catch the specific failure, keep what is valid,
 * and report what happened instead of failing silently. Exported for tests.
 */
export function parseProgress(raw) {
    if (!raw)
        return { progress: createEmptyProgress(), problems: [] };
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (error) {
        if (!(error instanceof SyntaxError))
            throw error;
        return { progress: createEmptyProgress(), problems: ["unreadable"] };
    }
    if (!isRecord(parsed))
        return { progress: createEmptyProgress(), problems: ["unreadable"] };
    const known = flags(parsed.knownCards), unknown = flags(parsed.unknownCards);
    const attempts = Array.isArray(parsed.quizAttempts) ? parsed.quizAttempts : [];
    const parsedQuizAttempts = attempts.map(parseQuizAttempt);
    const quizAttempts = parsedQuizAttempts.flatMap(({ attempt }) => attempt ? [attempt] : []);
    const rawMockAttempts = Array.isArray(parsed.mockAttempts) ? parsed.mockAttempts : [];
    const mockAttempts = rawMockAttempts.filter(isMockAttempt);
    const schedules = isRecord(parsed.schedules) ? parsed.schedules : {};
    const repaired = known.repaired || unknown.repaired
        || (parsed.quizAttempts !== undefined && !Array.isArray(parsed.quizAttempts))
        || quizAttempts.length !== attempts.length
        || parsedQuizAttempts.some(({ repaired: optionalRepaired }) => optionalRepaired)
        || (parsed.mockAttempts !== undefined && !Array.isArray(parsed.mockAttempts))
        || mockAttempts.length !== rawMockAttempts.length
        || (parsed.schedules !== undefined && !isRecord(parsed.schedules));
    return {
        progress: {
            studyFocus: isStudyFocus(parsed.studyFocus) ? parsed.studyFocus : DEFAULT_STUDY_FOCUS,
            knownCards: known.value,
            unknownCards: unknown.value,
            quizAttempts,
            mockAttempts,
            schedules,
        },
        problems: repaired ? ["repaired"] : [],
    };
}
