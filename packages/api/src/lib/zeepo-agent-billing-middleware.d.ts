import { type ZeepoBillingContext } from "./zeepo-agent-tokens";
/** Every tRPC path that triggers Replicate / billable AI work. */
export declare const ZEEPO_AGENT_BILLABLE_PATHS: Set<string>;
export declare function isBillableZeepoAgentPath(path: string): boolean;
/** Resolve team + session for token billing from procedure input. */
export declare function resolveZeepoBillingContext(params: {
    userId: string;
    userRole: string | null | undefined;
    rawInput: unknown;
}): Promise<ZeepoBillingContext>;
/** Pre-flight token check for billable Zeepo agent mutations (customers only). */
export declare function assertZeepoBillableRequestAllowed(params: {
    path: string;
    userId: string;
    userRole: string | null | undefined;
    rawInput: unknown;
}): Promise<ZeepoBillingContext | null>;
export type ZeepoAgentContext = {
    zeepoBilling?: {
        teamId: string | null;
        sessionId: string | null;
    } | null;
};
/**
 * Runs before every Zeepo agent procedure: for customer billable mutations,
 * enforce team access + minimum token balance before handler executes.
 */
export declare const zeepoAgentBillingMiddleware: import("@trpc/server").TRPCMiddlewareBuilder<import("..").Context, object, {
    zeepoBilling: {
        teamId: string | null;
        sessionId: string | null;
    } | null;
    session: import("..").Session;
    ipAddress: string | null | undefined;
    apiKey: {
        id: string;
        permissions: string[];
    } | undefined;
    mfaRequired: boolean | undefined;
    mfaVerified: boolean | undefined;
    mfaSetupRequired: boolean | undefined;
    createCaller: ((ctx: import("..").Context) => unknown) | undefined;
    apiKeyError: string | null | undefined;
    req: import("hono").HonoRequest<any, unknown>;
}, unknown>;
