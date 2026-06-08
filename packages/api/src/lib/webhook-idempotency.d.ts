/**
 * Claim a webhook/event id exactly once. Returns true if this is the first
 * delivery; false if already processed. When Redis is down, returns true
 * (DB-level guards should still apply).
 */
export declare function claimWebhookEvent(namespace: string, eventId: string, ttlSec?: number): Promise<boolean>;
