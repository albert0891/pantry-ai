// ---------------------------------------------------------------------------
// AI Rate Limit Policy (pure logic, no I/O)
//
// Every AI call costs real money, so each one must pass a set of counters first.
// This module only decides WHICH counters apply and how big they are; the
// storage (Upstash Redis or in-memory) lives in `aiRateLimiter.ts`.
//
// The public demo account is shared by every visitor, so it gets two layers:
// - a per-IP counter, so one visitor cannot drain the demo for everyone else
// - a global counter, which caps the worst-case daily bill no matter how many
//   IPs an attacker rotates through
// ---------------------------------------------------------------------------

export const DEMO_USER_ID = 'public-demo-user';

const HOUR_SECONDS = 60 * 60;
const DAY_SECONDS = 24 * HOUR_SECONDS;

export type AiFeature = 'recipe';

interface WindowLimit {
  limit: number;
  windowSeconds: number;
}

interface FeatureLimits {
  demoPerIp: WindowLimit;
  demoGlobal: WindowLimit;
  perUser: WindowLimit;
}

export const AI_RATE_LIMITS: Record<AiFeature, FeatureLimits> = {
  recipe: {
    demoPerIp: { limit: 5, windowSeconds: HOUR_SECONDS },
    demoGlobal: { limit: 100, windowSeconds: DAY_SECONDS },
    perUser: { limit: 30, windowSeconds: DAY_SECONDS },
  },
};

const FEATURE_LABELS: Record<AiFeature, string> = {
  recipe: 'AI recipe',
};

/** Shared bucket for demo requests whose IP cannot be determined. */
export const UNKNOWN_IP = 'unknown-ip';

export interface RateLimitRule {
  /** Counter namespace, e.g. `recipe:demo-ip`. One counter family per name. */
  name: string;
  /** Who the counter belongs to: an IP, a user id, or a constant for global caps. */
  identifier: string;
  limit: number;
  windowSeconds: number;
}

/**
 * Returns the counters a request must pass, ordered cheapest-to-reject first.
 * The per-IP check runs before the global one, so a single abusive IP is
 * stopped without consuming the global budget that other visitors share.
 */
export function getAiRateLimitRules(
  feature: AiFeature,
  userId: string,
  ip: string | null,
): RateLimitRule[] {
  const limits = AI_RATE_LIMITS[feature];

  if (userId !== DEMO_USER_ID) {
    return [{ name: `${feature}:user`, identifier: userId, ...limits.perUser }];
  }

  return [
    { name: `${feature}:demo-ip`, identifier: ip || UNKNOWN_IP, ...limits.demoPerIp },
    { name: `${feature}:demo-global`, identifier: 'all', ...limits.demoGlobal },
  ];
}

/**
 * Extracts the client IP from proxy headers. On Vercel the platform overwrites
 * `x-forwarded-for`, so its first entry is the real client and cannot be spoofed.
 */
export function getClientIp(headers: Pick<Headers, 'get'>): string | null {
  const forwardedFor = headers.get('x-forwarded-for');
  const firstHop = forwardedFor?.split(',')[0]?.trim();
  if (firstHop) return firstHop;

  return headers.get('x-real-ip')?.trim() || null;
}

/** Builds the user-facing message shown when a counter is exhausted. */
export function formatRateLimitMessage(
  feature: AiFeature,
  resetAtMs: number,
  nowMs: number,
): string {
  const minutes = Math.max(1, Math.ceil((resetAtMs - nowMs) / 60_000));
  const wait =
    minutes >= 120
      ? `${Math.ceil(minutes / 60)} hours`
      : `${minutes} minute${minutes === 1 ? '' : 's'}`;

  return `${FEATURE_LABELS[feature]} limit reached. Please try again in ${wait}.`;
}

export interface RateLimitResult {
  success: boolean;
  /** Unix timestamp (ms) when the current window resets. */
  reset: number;
}

/**
 * Fixed-window counter kept in process memory. Only used in local development
 * when Upstash is not configured: on serverless hosts each instance has its own
 * memory, so this would not enforce a real limit in production.
 */
export function createMemoryRateLimiter(now: () => number = Date.now) {
  const windows = new Map<string, { count: number; reset: number }>();

  return (rule: RateLimitRule): RateLimitResult => {
    const key = `${rule.name}:${rule.identifier}`;
    const currentTime = now();
    let window = windows.get(key);

    if (!window || currentTime >= window.reset) {
      window = { count: 0, reset: currentTime + rule.windowSeconds * 1000 };
      windows.set(key, window);
    }

    if (window.count >= rule.limit) {
      return { success: false, reset: window.reset };
    }

    window.count += 1;
    return { success: true, reset: window.reset };
  };
}
