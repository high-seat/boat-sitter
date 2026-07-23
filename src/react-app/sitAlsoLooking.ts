/** Soft social-proof viewer count for a sit (not live presence). Stable per sit + 15m window. */
export function getSitAlsoLookingCount(sitId: string, nowMs = Date.now()): number {
  const windowMs = 15 * 60 * 1000;
  const bucket = Math.floor(nowMs / windowMs);
  let hash = 0;
  const key = `${sitId}:${bucket}`;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return 2 + (hash % 8);
}
