import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rate-limit';

describe('Security: Sliding-Window Rate Limiting', () => {
  const testIp = '192.168.1.100';

  beforeEach(() => {
    resetRateLimit(`test:${testIp}`);
  });

  it('allows requests within threshold limit', () => {
    const key = `test:${testIp}`;
    const opts = { windowMs: 10000, maxRequests: 3 };

    expect(checkRateLimit(key, opts).success).toBe(true);
    expect(checkRateLimit(key, opts).success).toBe(true);
    expect(checkRateLimit(key, opts).success).toBe(true);
  });

  it('blocks requests exceeding threshold limit', () => {
    const key = `test:${testIp}`;
    const opts = { windowMs: 10000, maxRequests: 2 };

    checkRateLimit(key, opts);
    checkRateLimit(key, opts);

    const third = checkRateLimit(key, opts);
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.resetMs).toBeGreaterThan(0);
  });

  it('resets rate limit correctly on demand', () => {
    const key = `test:${testIp}`;
    const opts = { windowMs: 10000, maxRequests: 1 };

    checkRateLimit(key, opts);
    expect(checkRateLimit(key, opts).success).toBe(false);

    resetRateLimit(key);
    expect(checkRateLimit(key, opts).success).toBe(true);
  });
});
