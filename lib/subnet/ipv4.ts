/** IPv4 values use exact unsigned Number arithmetic; no signed 32-bit bitwise coercions. */
/** A typed address that is not four decimal octets. Callers catch this class only, so a real bug is never reported as bad user input. */
export class AddressFormatError extends Error {}
const ADDRESS_MESSAGE = "Enter four decimal octets from 0 to 255; avoid leading zeros.";
/** Class 10: an expected input problem is checked with an if, not an exception. Returns the plain-language message, or null when the text is fine. */
export function addressProblem(raw: unknown): string | null {
  if (typeof raw !== "string") return ADDRESS_MESSAGE;
  const octets = raw.trim().split(".");
  if (octets.length !== 4 || octets.some((s) => !/^(0|[1-9]\d{0,2})$/.test(s) || Number(s) > 255)) return ADDRESS_MESSAGE;
  return null;
}
export function address(text: string): number {
  const problem = addressProblem(text);
  if (problem) throw new AddressFormatError(problem);
  return text.trim().split(".").reduce((value, octet) => value * 256 + Number(octet), 0);
}
export function dotted(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 2 ** 32 - 1) throw new Error("Address is outside unsigned IPv4 space.");
  return [24,16,8,0].map((bits) => Math.floor(value / 2 ** bits) % 256).join(".");
}
export function prefix(value: number) {
  if (!Number.isInteger(value) || value < 0 || value > 30) throw new Error("Use /0 through /30 for these conventional network/broadcast exercises. /31 and /32 have distinct rules and are not supported here.");
  return value;
}
export function calculate(ip: string, bits: number) {
  prefix(bits);
  const value = address(ip), size = 2 ** (32 - bits), network = Math.floor(value / size) * size, broadcast = network + size - 1;
  return { value, prefix: bits, size, start: network, end: broadcast, network: dotted(network), mask: dotted(2 ** 32 - size), broadcast: dotted(broadcast), first: dotted(network+1), last: dotted(broadcast-1), capacity: size-2, isHost: value > network && value < broadcast,
    blockSize: bits % 8 ? 2 ** (8-bits%8) : 256, blockOctet: Math.floor(bits/8)+1 };
}
export function cidr(text: string, aligned = true) {
  const parts = text.trim().split("/");
  if (parts.length !== 2 || !/^(0|[1-9]\d?)$/.test(parts[1])) throw new Error("Enter an IPv4 network and prefix, such as 172.16.8.0/24.");
  const result = calculate(parts[0], Number(parts[1]));
  if (aligned && result.value !== result.start) throw new Error(`Misalignment: /${result.prefix} starts at ${result.network}, not ${parts[0]}. Block size is ${result.size} addresses.`);
  return result;
}
export function smallestPrefix(hosts: number) {
  if (!Number.isInteger(hosts) || hosts < 1 || hosts > 2 ** 32 - 2) throw new Error("Required usable count is invalid.");
  for (let p=30; p>=0; p--) if (2 ** (32-p)-2 >= hosts) return p;
  throw new Error("No IPv4 block has sufficient capacity.");
}
export function equalSubnetCount(parent: number, child: number) {
  prefix(parent); prefix(child);
  if (child < parent) throw new Error("A child prefix must be at least as long as its explicit parent prefix.");
  return 2 ** (child-parent);
}
/** Display only. Grading still trims and parses on its own; this does not accept or reject an answer. */
export function cleanedTypedText(raw: string): { typed: string; cleaned: string; pieces: string[] } {
  const cleaned = raw.trim();
  const pieces = cleaned ? (cleaned.includes("/") ? cleaned.split("/") : cleaned.split(".")) : [];
  return { typed: raw, cleaned, pieces };
}
/** Class 10: a specific error for one octet, like Python's ValueError from int("abc"). */
export class OctetError extends Error {
  readonly problem: TypedProblem;
  constructor(problem: TypedProblem) { super(problem.code); this.name = "OctetError"; this.problem = problem; }
}
export type TypedProblem =
  | { code: "notText" }
  | { code: "empty" }
  | { code: "pieceCount"; count: number }
  | { code: "notNumber"; octet: number; piece: string }
  | { code: "leadingZero"; octet: number; piece: string }
  | { code: "outOfRange"; octet: number; piece: string };
export type TypedCheck = { route: "ok" | "bad"; address: string | null; problems: TypedProblem[]; finished: boolean };
/** Like int(piece): returns a number or throws OctetError. It never returns NaN. */
export function toOctet(piece: string, octet: number): number {
  if (!/^\d+$/.test(piece)) throw new OctetError({ code: "notNumber", octet, piece });
  if (piece.length > 1 && piece.startsWith("0")) throw new OctetError({ code: "leadingZero", octet, piece });
  const value = Number(piece);
  if (value > 255) throw new OctetError({ code: "outOfRange", octet, piece });
  return value;
}
/**
 * Display only, like validate_lead: collects every problem instead of stopping at the first.
 * route "ok" goes to the success sentence, "bad" to the problem list (the LangGraph ok/bad edge).
 * Grading never calls this; a padded or wrong answer is still graded by the existing rules.
 */
export function checkTypedAddress(raw: unknown): TypedCheck {
  const result: TypedCheck = { route: "bad", address: null, problems: [], finished: false };
  try {
    if (typeof raw !== "string") { result.problems.push({ code: "notText" }); return result; }
    const cleaned = raw.trim();
    if (!cleaned) { result.problems.push({ code: "empty" }); return result; }
    const pieces = cleaned.split(".");
    if (pieces.length !== 4) result.problems.push({ code: "pieceCount", count: pieces.length });
    const octets: number[] = [];
    pieces.slice(0, 4).forEach((piece, i) => {
      try {
        octets.push(toOctet(piece, i + 1));
      } catch (error) {
        if (error instanceof OctetError) result.problems.push(error.problem);
        else throw error; // anything unexpected is not ours to hide
      }
    });
    if (!result.problems.length) { result.route = "ok"; result.address = octets.join("."); }
    return result;
  } finally {
    result.finished = true; // runs on every path, even after return, like Python's finally
  }
}
export const overlaps = (a: {start:number;end:number}, b: {start:number;end:number}) => a.start <= b.end && b.start <= a.end;
export const contained = (child: {start:number;end:number}, parent: {start:number;end:number}) => child.start >= parent.start && child.end <= parent.end;
