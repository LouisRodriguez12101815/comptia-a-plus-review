import { decodeSnapshot, PROGRESS_HEAD, progressHead, snapshotKeys } from './progress-snapshot.mjs';

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Pure decoder shared by offline exports and authenticated server reads. */
export function decodeProgress(items) {
  if (!Array.isArray(items) || items.some(item => !isRecord(item) || typeof item.key !== 'string')
    || new Set(items.map(item => item.key)).size !== items.length) throw new Error('history');
  const direct = items.find(item => item.key === 'progress');
  const committed = items.find(item => item.key === PROGRESS_HEAD);
  const chunks = items.filter(item => /^progress-\d+$/.test(item.key)).sort((a, b) => Number(a.key.slice(9)) - Number(b.key.slice(9)));
  if (!committed && direct && chunks.length) throw new Error('history');
  let progress;
  if (committed) {
    const head = progressHead(committed.data);
    const byKey = new Map(items.map(item => [item.key, item.data]));
    progress = JSON.parse(decodeSnapshot(head, snapshotKeys(head).map(key => byKey.get(key))));
  } else if (direct) {
    progress = typeof direct.data?.s === 'string' ? JSON.parse(direct.data.s) : direct.data;
  } else if (chunks.length) {
    if (chunks.length > 40 || chunks.some((item, i) => item.key !== `progress-${i}` || typeof item.data?.s !== 'string' || item.data.s.length > 12000)) throw new Error('history');
    progress = JSON.parse(chunks.map(item => item.data.s).join(''));
  }
  const historyItem = items.find(item => item.key === 'history');
  const events = historyItem ? (Array.isArray(historyItem.data) ? historyItem.data : historyItem.data?.events) : [];
  if (historyItem && !Array.isArray(events)) throw new Error('unsupported-history');
  if (progress === undefined && !historyItem) throw new Error('history');
  if (progress !== undefined && (!isRecord(progress) || !['quizAttempts', 'mockAttempts'].every(key => progress[key] === undefined || Array.isArray(progress[key]))
    || !['quizAttempts', 'mockAttempts'].some(key => Array.isArray(progress[key])))) throw new Error('history');
  return { ...(progress ?? {}), questionEvents: events };
}
