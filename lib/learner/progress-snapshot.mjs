import { createHash, randomUUID } from 'node:crypto';

export const PROGRESS_HEAD = 'progress-head';
export const CHUNK = 12_000;
export const MAX_CHUNKS = 40;

/** @typedef {{v: 1, generation: string, count: number, bytes: number, sha256: string}} ProgressHead */

/** @param {unknown} value @returns {ProgressHead} */
export function progressHead(value) {
  const h = /** @type {ProgressHead | null} */ (value);
  if (!h || h.v !== 1 || typeof h.generation !== 'string'
    || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(h.generation)
    || !Number.isInteger(h.count) || h.count < 1 || h.count > MAX_CHUNKS
    || !Number.isInteger(h.bytes) || h.bytes < 1 || h.bytes > CHUNK * MAX_CHUNKS * 4
    || typeof h.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(h.sha256)) {
    throw new Error('invalid_progress_snapshot');
  }
  return h;
}

/** @param {ProgressHead} head */
export function snapshotKeys(head) {
  return Array.from({ length: head.count }, (_, i) => `progress-snapshot-${head.generation}-${i}`);
}

/** @param {string} raw */
export function splitChunks(raw) {
  const out = [];
  for (let i = 0; i < raw.length; i += CHUNK) out.push(raw.slice(i, i + CHUNK));
  return out.length ? out : [''];
}

/** @param {string} raw */
export function makeSnapshot(raw) {
  const chunks = splitChunks(raw);
  if (chunks.length > MAX_CHUNKS || chunks.some(s => Buffer.byteLength(JSON.stringify({ s }), 'utf8') > 16 * 1024)) {
    throw new Error('too_large');
  }
  const head = progressHead({
    v: 1, generation: randomUUID(), count: chunks.length,
    bytes: Buffer.byteLength(raw, 'utf8'), sha256: createHash('sha256').update(raw).digest('hex'),
  });
  return { head, chunks };
}

/** @param {unknown} value @param {unknown[]} chunks */
export function decodeSnapshot(value, chunks) {
  const head = progressHead(value);
  if (chunks.length !== head.count || chunks.some(data => !data || typeof data !== 'object'
    || typeof /** @type {{s?: unknown}} */ (data).s !== 'string'
    || /** @type {{s: string}} */ (data).s.length > CHUNK)) throw new Error('invalid_progress_snapshot');
  const raw = chunks.map(data => /** @type {{s: string}} */ (data).s).join('');
  if (Buffer.byteLength(raw, 'utf8') !== head.bytes || createHash('sha256').update(raw).digest('hex') !== head.sha256) {
    throw new Error('invalid_progress_snapshot');
  }
  return raw;
}
