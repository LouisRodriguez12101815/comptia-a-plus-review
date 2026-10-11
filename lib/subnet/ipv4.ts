/** IPv4 values use exact unsigned Number arithmetic; no signed 32-bit bitwise coercions. */
export function address(text: string): number {
  const octets = text.trim().split(".");
  if (octets.length !== 4 || octets.some((s) => !/^(0|[1-9]\d{0,2})$/.test(s) || Number(s) > 255)) throw new Error("Enter four decimal octets from 0 to 255; avoid leading zeros.");
  return octets.reduce((value, octet) => value * 256 + Number(octet), 0);
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
export const overlaps = (a: {start:number;end:number}, b: {start:number;end:number}) => a.start <= b.end && b.start <= a.end;
export const contained = (child: {start:number;end:number}, parent: {start:number;end:number}) => child.start >= parent.start && child.end <= parent.end;
