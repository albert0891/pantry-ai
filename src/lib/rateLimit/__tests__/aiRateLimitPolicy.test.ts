import { describe, it, expect } from 'vitest';
import {
  AI_RATE_LIMITS,
  DEMO_USER_ID,
  UNKNOWN_IP,
  createMemoryRateLimiter,
  formatRateLimitMessage,
  getAiRateLimitRules,
  getClientIp,
} from '../aiRateLimitPolicy';

const headersOf = (entries: Record<string, string>) => new Headers(entries);

describe('getAiRateLimitRules', () => {
  it('gives a signed-in user a single per-user counter', () => {
    const rules = getAiRateLimitRules('recipe', 'cognito-123', '1.2.3.4');
    expect(rules).toEqual([
      { name: 'recipe:user', identifier: 'cognito-123', ...AI_RATE_LIMITS.recipe.perUser },
    ]);
  });

  it('checks the demo per-IP counter before the global demo counter', () => {
    const rules = getAiRateLimitRules('recipe', DEMO_USER_ID, '1.2.3.4');
    expect(rules.map((r) => r.name)).toEqual(['recipe:demo-ip', 'recipe:demo-global']);
    expect(rules[0].identifier).toBe('1.2.3.4');
    expect(rules[1].identifier).toBe('all');
  });

  it('puts demo requests without an IP into one shared bucket', () => {
    const [ipRule] = getAiRateLimitRules('recipe', DEMO_USER_ID, null);
    expect(ipRule.identifier).toBe(UNKNOWN_IP);
  });
});

describe('getClientIp', () => {
  it('takes the first hop of x-forwarded-for', () => {
    expect(getClientIp(headersOf({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' }))).toBe('9.9.9.9');
  });

  it('falls back to x-real-ip', () => {
    expect(getClientIp(headersOf({ 'x-real-ip': '8.8.8.8' }))).toBe('8.8.8.8');
  });

  it('returns null when no proxy header is present', () => {
    expect(getClientIp(headersOf({}))).toBeNull();
  });
});

describe('formatRateLimitMessage', () => {
  const now = 1_000_000;

  it('rounds up to whole minutes and never shows zero', () => {
    expect(formatRateLimitMessage('recipe', now + 1_000, now)).toBe(
      'AI recipe limit reached. Please try again in 1 minute.',
    );
    expect(formatRateLimitMessage('recipe', now + 23 * 60_000 - 5, now)).toContain('23 minutes');
  });

  it('switches to hours for long waits', () => {
    expect(formatRateLimitMessage('recipe', now + 5 * 60 * 60_000, now)).toContain('5 hours');
  });
});

describe('createMemoryRateLimiter', () => {
  const rule = { name: 'recipe:user', identifier: 'u1', limit: 2, windowSeconds: 60 };

  it('allows up to the limit, then blocks until the window resets', () => {
    let time = 0;
    const check = createMemoryRateLimiter(() => time);

    expect(check(rule).success).toBe(true);
    expect(check(rule).success).toBe(true);
    const blocked = check(rule);
    expect(blocked.success).toBe(false);
    expect(blocked.reset).toBe(60_000);

    time = 60_000;
    expect(check(rule).success).toBe(true);
  });

  it('keeps separate counters per identifier', () => {
    const check = createMemoryRateLimiter(() => 0);
    check(rule);
    check(rule);
    expect(check({ ...rule, identifier: 'u2' }).success).toBe(true);
  });
});
