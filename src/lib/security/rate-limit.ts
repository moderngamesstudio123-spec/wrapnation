interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter(t => now - t < 300000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/**
 * Sliding window in-memory rate limiter.
 * @param identifier Unique key (e.g. `login:${ip}` or `order:${ip}`)
 * @param options Window duration in ms and max requests allowed
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60000, maxRequests: 60 }
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter(ts => ts > windowStart);

  if (record.timestamps.length >= options.maxRequests) {
    const earliest = record.timestamps[0];
    const resetMs = Math.max(0, earliest + options.windowMs - now);
    return {
      success: false,
      limit: options.maxRequests,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit: options.maxRequests,
    remaining: options.maxRequests - record.timestamps.length,
    resetMs: options.windowMs,
  };
}

/**
 * Resets the rate limit for a specific identifier (e.g. upon successful authentication).
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}
