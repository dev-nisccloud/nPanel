/** Shown to clients when an upstream/provider error occurs in production. */
export declare const ZEEPO_AGENT_PUBLIC_ERROR_MESSAGE = "A system error occurred. Please try again.";
/** True when the whole stack is running in development (NODE_ENV=development). */
export declare function isZeepoAgentDevelopmentMode(): boolean;
export declare function resolveZeepoAgentPublicMessage(raw: string | null | undefined, fallback?: string): string;
export declare function resolveZeepoAgentPublicMessageFromError(error: unknown, fallback?: string): string;
/** Safe in production: timeout / slow-response copy only. */
export declare function resolveZeepoAgentOrchestrationClientMessage(error: unknown): string;
/** Persisted on generation rows - redacted in production. */
export declare function resolveZeepoAgentStoredErrorMessage(error: unknown): string;
export declare function redactZeepoAgentGenerationRow<T extends {
    errorMessage?: string | null;
}>(row: T): T;
/** Tool-result payloads returned to the agent UI thread. */
export declare function formatZeepoAgentToolError(actionLabel: string, error: unknown): string;
/** Sanitizes uncaught errors from all Zeepo Agent tRPC procedures in production. */
export declare const zeepoAgentErrorMiddleware: import("@trpc/server").TRPCMiddlewareBuilder<import("..").Context, object, object, unknown>;
