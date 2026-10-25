/**
 * How many reverse proxies in front of the app Express should trust when it
 * reads the client IP (`req.ip`, which the per-IP throttler keys on).
 *
 * - `TRUST_PROXY_HOPS=0` — trust nobody: use the TCP peer address and ignore
 *   `X-Forwarded-For` (a caller cannot choose its own tracker).
 * - `TRUST_PROXY_HOPS=1` — one proxy (nginx in Docker, Vercel) in front.
 *
 * Defaults to 1 in production and 0 everywhere else: production is the only
 * place where a real proxy sits in front, and in tests/dev trusting
 * `X-Forwarded-For` would let whoever sends the header dodge the login
 * throttle. See SECURITY.md R-04.
 */
export const DEFAULT_PRODUCTION_TRUST_PROXY_HOPS = 1;
export const DEFAULT_TRUST_PROXY_HOPS = 0;

export function resolveTrustProxyHops(
  env: {
    TRUST_PROXY_HOPS?: string;
    NODE_ENV?: string;
  } = {
    TRUST_PROXY_HOPS: process.env.TRUST_PROXY_HOPS,
    NODE_ENV: process.env.NODE_ENV,
  },
): number {
  const raw = env.TRUST_PROXY_HOPS?.trim();
  if (raw) {
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return env.NODE_ENV === 'production'
    ? DEFAULT_PRODUCTION_TRUST_PROXY_HOPS
    : DEFAULT_TRUST_PROXY_HOPS;
}
