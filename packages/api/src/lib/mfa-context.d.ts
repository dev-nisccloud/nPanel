export type MfaContextState = {
    mfaRequired: boolean;
    mfaVerified: boolean;
};
/**
 * Single round-trip MFA lookup for tRPC context creation.
 * Replaces two sequential queries (settings, then pending session).
 */
export declare function resolveMfaContextState(sessionUserId: string, sessionId: string): Promise<MfaContextState>;
