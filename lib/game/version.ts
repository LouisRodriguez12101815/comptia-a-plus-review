export const ROOM_PROTOCOL_VERSION = 3;
const commit = process.env.NEXT_PUBLIC_OUTAGE_OPS_BUILD_COMMIT;
export const BUILD_COMMIT = commit && /^[a-f0-9]{40}$/i.test(commit) ? commit : "unknown";
