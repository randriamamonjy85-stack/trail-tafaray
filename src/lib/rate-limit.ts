/** Rate limit simple en mémoire (par instance serveur). */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(
  key: string,
  limit = 8,
  windowMs = 60_000
): { ok: boolean; remaining: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.reset) {
    b = { count: 0, reset: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > limit) return { ok: false, remaining: 0 };
  return { ok: true, remaining: limit - b.count };
}
