#!/usr/bin/env node
/*
 * Turns caption files saved by yt-dlp into private, timestamped source notes.
 *
 *   node scripts/video-captions-to-notes.mjs [folder]
 *
 * The folder defaults to sources/private/videos, which Git ignores. For each
 * <video id>*.vtt file it writes <video id>.notes.md: a filled-in source-note
 * header (from <video id>.info.json when present), blank review fields, and the
 * transcript grouped into roughly 30-second paragraphs with [mm:ss] stamps.
 *
 * The notes are for your own review. Transcripts are the creator's work, so
 * they stay out of the repository; only original explanations, questions and
 * flashcards written from them belong in content/.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CUE_TIMING = /^(\d{1,2}:)?(\d{2}):(\d{2})[.,](\d{3})\s+-->/;

function toSeconds(match) {
  const hours = match[1] ? Number(match[1].slice(0, -1)) : 0;
  return hours * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function clean(line) {
  return line
    .replace(/<\d{2}:\d{2}:\d{2}[.,]\d{3}>/g, "")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses WebVTT text into [{ start, text }] lines. Automatic captions repeat
 * each line as it scrolls, so a line already emitted is skipped.
 */
export function vttToLines(vtt) {
  const lines = [];
  const seen = new Set();
  let start = null;
  for (const raw of vtt.replace(/\r/g, "").split("\n")) {
    const timing = CUE_TIMING.exec(raw.trim());
    if (timing) { start = toSeconds(timing); continue; }
    if (start === null) continue;
    const text = clean(raw);
    if (!text || /^\d+$/.test(text)) continue;
    if (seen.has(text)) continue;
    seen.add(text);
    lines.push({ start, text });
  }
  return lines;
}

export function stamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Groups caption lines into paragraphs that each start with a [mm:ss] stamp. */
export function paragraphs(lines, seconds = 30) {
  const out = [];
  let current = null;
  for (const line of lines) {
    if (!current || line.start - current.start >= seconds) {
      current = { start: line.start, words: [] };
      out.push(current);
    }
    current.words.push(line.text);
  }
  return out.map((p) => `[${stamp(p.start)}] ${p.words.join(" ")}`);
}

function readInfo(folder, id) {
  const file = path.join(folder, `${id}.info.json`);
  if (!existsSync(file)) return {};
  try { return JSON.parse(readFileSync(file, "utf8")); } catch { return {}; }
}

function uploadDate(value) {
  return /^\d{8}$/.test(value ?? "") ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}` : "";
}

export function notesFor(id, info, lines) {
  const url = info.webpage_url ?? `https://www.youtube.com/watch?v=${id}`;
  return [
    "<!-- Private source notes. Do not commit or publish this file. -->",
    "",
    `Source title: ${info.title ?? ""}`,
    `Author or speaker: ${info.channel ?? info.uploader ?? ""}`,
    `Source date: ${uploadDate(info.upload_date)}`,
    `URL or private file reference: ${url}`,
    `Length: ${info.duration ? stamp(info.duration) : ""}`,
    "Relevant timestamps or pages:",
    "Certification and objective version: 220-1202",
    "",
    "What the source teaches:",
    "Worked examples:",
    "Terms or commands to verify:",
    "Unclear passages:",
    "Possible objective mappings:",
    "Reuse permission or restrictions: transcript is the creator's work; use it for review only",
    "",
    "## Transcript (automatic captions, check unclear words against the video)",
    "",
    ...paragraphs(lines),
    "",
  ].join("\n");
}

function main() {
  const folder = path.resolve(process.argv[2] ?? "sources/private/videos");
  if (!existsSync(folder)) {
    console.error(`Folder not found: ${folder}`);
    process.exit(1);
  }
  if (!folder.split(path.sep).join("/").includes("sources/private")) {
    console.warn("Warning: this folder is not under sources/private, so Git may track the transcripts.");
  }
  const byId = new Map();
  for (const name of readdirSync(folder).sort()) {
    if (!name.endsWith(".vtt")) continue;
    const id = name.split(".")[0];
    if (!byId.has(id)) byId.set(id, name);
  }
  if (byId.size === 0) {
    console.error(`No .vtt caption files in ${folder}. Run the yt-dlp step first.`);
    process.exit(1);
  }
  for (const [id, name] of byId) {
    const lines = vttToLines(readFileSync(path.join(folder, name), "utf8"));
    const info = readInfo(folder, id);
    const out = path.join(folder, `${id}.notes.md`);
    writeFileSync(out, notesFor(id, info, lines));
    console.log(`${id}: ${lines.length} caption lines -> ${path.relative(process.cwd(), out)}${info.title ? `  (${info.title})` : ""}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
