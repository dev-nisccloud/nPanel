/**
 * In-process lock so two tabs cannot stream the same Zeepo AI session at once.
 * Releases on finally or after TTL (covers crashed turns).
 */
export declare function tryAcquireZeepoAiSessionLock(sessionId: string, ownerId: string, ttlMs?: number): boolean;
export declare function releaseZeepoAiSessionLock(sessionId: string, ownerId: string): void;
export declare function refreshZeepoAiSessionLock(sessionId: string, ownerId: string, ttlMs?: number): void;
