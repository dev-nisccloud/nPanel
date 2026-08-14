import { getRedisClient } from "./redis";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

/**
 * Fixed-window rate limiter. Returns allowed=true when Redis is unavailable
 * so traffic is never blocked due to cache outage.
 */
export async function checkRateLimit(params: {
  key: string;
  limit: number;
  windowSec: number;
  /** When Redis is down, deny instead of allowing (use on paid LLM / abuse-sensitive routes). */
  failClosed?: boolean;
}): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    if (params.failClosed) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: params.limit };
  }

  const limit = Math.max(1, Math.floor(params.limit));
  const windowSec = Math.max(1, Math.floor(params.windowSec));
  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const key = `npanel:rl:${params.key}:${bucket}`;

  try {
    const used = Number(await redis.incr(key));
    if (used === 1) {
      await redis.expire(key, windowSec + 1);
    }
    const remaining = Math.max(0, limit - used);
    return { allowed: used <= limit, remaining };
  } catch (error) {
    console.error("[rate-limit] check failed:", error);
    if (params.failClosed) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: limit };
  }
}

/** Per-path limits: heavy billing/subscription routes get tighter caps. */
export function resolveProcedureRateLimit(path: string): {
  authenticated: number;
  apiKey: number;
  anonymous: number;
  windowSec: number;
} {
  if (path === "storefront.auth.checkoutIdentity") {
    return { authenticated: 30, apiKey: 30, anonymous: 20, windowSec: 60 };
  }
  if (path === "storefront.auth.issueCheckoutToken") {
    return { authenticated: 10, apiKey: 10, anonymous: 5, windowSec: 60 };
  }
  if (path === "storefront.auth.completeProfile") {
    return { authenticated: 8, apiKey: 8, anonymous: 3, windowSec: 60 };
  }
  if (path === "storefront.auth.createOrganization") {
    return { authenticated: 5, apiKey: 5, anonymous: 2, windowSec: 60 };
  }

  // Presigned uploads  keep below the default so spam cannot mint endless URLs.
  if (path === "objectStorage.createUploadUrl") {
    return { authenticated: 40, apiKey: 40, anonymous: 5, windowSec: 60 };
  }

  // Landing guest support  tight anonymous caps to limit abuse.
  if (path === "support.guest.startSession") {
    return { authenticated: 10, apiKey: 10, anonymous: 5, windowSec: 3600 };
  }
  if (path === "support.guest.create") {
    return { authenticated: 10, apiKey: 10, anonymous: 3, windowSec: 3600 };
  }
  if (path === "support.guest.createMessage") {
    return { authenticated: 60, apiKey: 60, anonymous: 30, windowSec: 3600 };
  }
  if (path === "zeepoAiSupport.guest.getOrCreate") {
    return { authenticated: 20, apiKey: 20, anonymous: 10, windowSec: 3600 };
  }
	if (path === "zeepoAiSupport.guest.getSession") {
    return { authenticated: 60, apiKey: 60, anonymous: 40, windowSec: 60 };
  }
  if (path === "zeepoAiSupport.guest.openTicket") {
    return { authenticated: 8, apiKey: 8, anonymous: 5, windowSec: 3600 };
  }
  if (path === "zeepoAiSupport.openTicket" || path === "zeepoAi.sessions.openSupportTicket") {
    return { authenticated: 8, apiKey: 8, anonymous: 3, windowSec: 3600 };
  }
  if (
    path === "support.guest.getList" ||
    path === "support.guest.getMessages" ||
    path === "support.guest.getSession" ||
    path === "support.guest.markAllRead" ||
    path === "support.guest.claimToAccount"
  ) {
    return { authenticated: 60, apiKey: 60, anonymous: 40, windowSec: 60 };
  }

  const heavyPrefixes = [
    "clientSubscriptions.",
    "invoicing.",
    "orders.",
    "teams.",
    "hivelocity",
  ];
  const isHeavy = heavyPrefixes.some((p) => path.includes(p));

  if (isHeavy) {
    return { authenticated: 60, apiKey: 120, anonymous: 20, windowSec: 60 };
  }
  return { authenticated: 120, apiKey: 240, anonymous: 40, windowSec: 60 };
}
