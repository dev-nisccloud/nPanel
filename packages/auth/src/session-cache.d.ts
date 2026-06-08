import type { IdleSessionValidation } from "./session-policy";
export declare function readCachedSessionValidation(sessionId: string): Promise<IdleSessionValidation | null>;
export declare function writeCachedSessionValidation(sessionId: string, result: IdleSessionValidation): Promise<void>;
export declare function invalidateSessionCache(sessionId: string): Promise<void>;
