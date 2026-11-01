import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { GraphQLError } from 'graphql';
import {
  AiFeature,
  RateLimitResult,
  RateLimitRule,
  createMemoryRateLimiter,
  formatRateLimitMessage,
  getAiRateLimitRules,
} from './aiRateLimitPolicy';

// ---------------------------------------------------------------------------
// Design Pattern Note: Strategy + Fail-Closed
//
// The counter storage is picked once at startup:
// - Upstash Redis when configured (shared across all serverless instances)
// - in-memory counters in local development only
// - in production without Redis, AI calls are refused ("fail closed"): an
//   unprotected AI endpoint is an open bill, so availability loses to cost safety.
// The same fail-closed rule applies when Redis itself is unreachable.
// ---------------------------------------------------------------------------

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(client: Redis, rule: RateLimitRule): Ratelimit {
  let limiter = upstashLimiters.get(rule.name);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(rule.limit, `${rule.windowSeconds} s`),
      prefix: `pantry-ai:ratelimit:${rule.name}`,
    });
    upstashLimiters.set(rule.name, limiter);
  }
  return limiter;
}

const checkInMemory = createMemoryRateLimiter();

async function checkRule(rule: RateLimitRule): Promise<RateLimitResult> {
  if (redis) {
    const { success, reset } = await getUpstashLimiter(redis, rule).limit(rule.identifier);
    return { success, reset };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Rate limiter storage is not configured (UPSTASH_REDIS_REST_URL/TOKEN).');
  }

  return checkInMemory(rule);
}

const unavailableError = () =>
  new GraphQLError('AI features are temporarily unavailable. Please try again later.', {
    extensions: { code: 'AI_UNAVAILABLE' },
  });

/**
 * Consumes one unit from every counter that applies to this request.
 * Throws a `RATE_LIMITED` GraphQL error when any counter is exhausted.
 */
export async function enforceAiRateLimit(
  feature: AiFeature,
  userId: string,
  ip: string | null,
): Promise<void> {
  for (const rule of getAiRateLimitRules(feature, userId, ip)) {
    let result: RateLimitResult;
    try {
      result = await checkRule(rule);
    } catch (error) {
      console.error('AI rate limit check failed; refusing the request.', error);
      throw unavailableError();
    }

    if (!result.success) {
      throw new GraphQLError(formatRateLimitMessage(feature, result.reset, Date.now()), {
        extensions: { code: 'RATE_LIMITED', retryAt: new Date(result.reset).toISOString() },
      });
    }
  }
}
