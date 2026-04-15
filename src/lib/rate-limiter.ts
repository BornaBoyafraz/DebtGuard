interface RateEntry { count: number; resetAt: number; }
const store = new Map<string, RateEntry>();

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  // Clean stale entries when store grows large
  if (store.size > 1000) {
    for (const [k, v] of store) if (v.resetAt < now) store.delete(k);
  }
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (entry.count >= maxAttempts) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

export function recordAttempt(identifier: string): void {
  const entry = store.get(identifier);
  if (entry) {
    entry.count++;
  }
}

export function resetLimit(identifier: string): void {
  store.delete(identifier);
}

export function cleanupExpired(): void {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.resetAt < now) store.delete(k);
  }
}

// Automatically clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpired, 5 * 60 * 1000);
}
