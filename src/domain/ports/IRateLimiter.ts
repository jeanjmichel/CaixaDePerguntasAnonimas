export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

export interface IRateLimiter {
  check(key: string): RateLimitResult;
}
