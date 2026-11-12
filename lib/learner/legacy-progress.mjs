import { isStudyFocus } from '../exam-options.mjs';
import { parseProgress } from '../progress-parser.mjs';
import { CHUNK, MAX_CHUNKS } from './progress-snapshot.mjs';

/**
 * Shared, read-only validation for the persistence format progress-N.
 * @returns {import('../progress').Progress | null}
 */
export function decodeLegacyProgress(chunks) {
  if (!chunks.length) return null;
  if (chunks.length > MAX_CHUNKS || chunks.some((chunk, index) => {
    const data = chunk.data;
    return chunk.key !== `progress-${index}` || !data || typeof data !== 'object' || Array.isArray(data)
      || typeof data.s !== 'string' || !data.s.length || data.s.length > CHUNK;
  })) throw new Error('invalid_legacy_progress');
  const raw = chunks.map(chunk => chunk.data.s).join('');
  const parsed = parseProgress(raw);
  if (parsed.problems.length) throw new Error('invalid_legacy_progress');
  const value = JSON.parse(raw);
  if (value.studyFocus !== undefined && !isStudyFocus(value.studyFocus)) throw new Error('invalid_legacy_progress');
  if (value.schedules !== undefined) {
    if (!value.schedules || typeof value.schedules !== 'object' || Array.isArray(value.schedules)) throw new Error('invalid_legacy_progress');
    for (const entry of Object.values(value.schedules)) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('invalid_legacy_progress');
      const date = v => {
        if (typeof v !== 'string') return false;
        const parsedDate = new Date(v);
        return Number.isFinite(parsedDate.getTime()) && parsedDate.toISOString() === v;
      };
      const nonnegative = v => typeof v === 'number' && Number.isFinite(v) && v >= 0;
      const count = v => nonnegative(v) && Number.isInteger(v);
      if (!date(entry.due) || (entry.last_review !== undefined && !date(entry.last_review))
        || ![entry.stability, entry.difficulty, entry.elapsed_days, entry.scheduled_days].every(nonnegative)
        || ![entry.reps, entry.lapses].every(count) || (entry.learning_steps !== undefined && !count(entry.learning_steps))
        || !Number.isInteger(entry.state) || entry.state < 0 || entry.state > 3) throw new Error('invalid_legacy_progress');
    }
  }
  return parsed.progress;
}
