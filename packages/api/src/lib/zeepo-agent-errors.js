import { TRPCError } from "@trpc/server";
import { t } from "../trpc";
/** Shown to clients when an upstream/provider error occurs in production. */
export const ZEEPO_AGENT_PUBLIC_ERROR_MESSAGE = "A system error occurred. Please try again.";
const PRESERVED_TRPC_CODES = new Set([
    "UNAUTHORIZED",
    "NOT_FOUND",
    "BAD_REQUEST",
    "FORBIDDEN",
    "CONFLICT",
    "PRECONDITION_FAILED",
    "TOO_MANY_REQUESTS",
]);
/** True when the whole stack is running in development (NODE_ENV=development). */
export function isZeepoAgentDevelopmentMode() {
    return process.env.NODE_ENV === "development";
}
export function resolveZeepoAgentPublicMessage(raw, fallback = ZEEPO_AGENT_PUBLIC_ERROR_MESSAGE) {
    if (isZeepoAgentDevelopmentMode()) {
        const trimmed = typeof raw === "string" ? raw.trim() : "";
        return trimmed || fallback;
    }
    return ZEEPO_AGENT_PUBLIC_ERROR_MESSAGE;
}
export function resolveZeepoAgentPublicMessageFromError(error, fallback = ZEEPO_AGENT_PUBLIC_ERROR_MESSAGE) {
    if (isZeepoAgentDevelopmentMode()) {
        if (error instanceof TRPCError) {
            return error.message?.trim() || fallback;
        }
        if (error instanceof Error) {
            return error.message.trim() || fallback;
        }
        if (typeof error === "string") {
            return error.trim() || fallback;
        }
    }
    return fallback;
}
/** Safe in production: timeout / slow-response copy only. */
export function resolveZeepoAgentOrchestrationClientMessage(error) {
    const raw = error instanceof TRPCError
        ? error.message
        : error instanceof Error
            ? error.message
            : String(error ?? "");
    if (raw.includes("timed out") || raw.includes("took too long")) {
        return "The assistant took too long to respond. Please try again.";
    }
    return resolveZeepoAgentPublicMessageFromError(error);
}
/** Persisted on generation rows - redacted in production. */
export function resolveZeepoAgentStoredErrorMessage(error) {
    if (isZeepoAgentDevelopmentMode()) {
        const raw = resolveZeepoAgentPublicMessageFromError(error, "Unknown error");
        return raw.slice(0, 500);
    }
    return ZEEPO_AGENT_PUBLIC_ERROR_MESSAGE;
}
export function redactZeepoAgentGenerationRow(row) {
    if (isZeepoAgentDevelopmentMode() || !row.errorMessage) {
        return row;
    }
    return { ...row, errorMessage: ZEEPO_AGENT_PUBLIC_ERROR_MESSAGE };
}
/** Tool-result payloads returned to the agent UI thread. */
export function formatZeepoAgentToolError(actionLabel, error) {
    if (isZeepoAgentDevelopmentMode()) {
        const detail = error instanceof Error
            ? error.message
            : typeof error === "string"
                ? error
                : "Unknown error";
        return `${actionLabel}: ${detail}`;
    }
    return ZEEPO_AGENT_PUBLIC_ERROR_MESSAGE;
}
function sanitizeTrpcErrorForClient(error) {
    if (isZeepoAgentDevelopmentMode()) {
        return error;
    }
    if (PRESERVED_TRPC_CODES.has(error.code)) {
        return error;
    }
    const msg = error.message?.trim() ?? "";
    if (msg.includes("took too long") || msg.includes("timed out")) {
        return new TRPCError({
            code: error.code,
            message: msg,
            cause: error.cause,
        });
    }
    return new TRPCError({
        code: error.code,
        message: ZEEPO_AGENT_PUBLIC_ERROR_MESSAGE,
        cause: error.cause,
    });
}
/** Sanitizes uncaught errors from all Zeepo Agent tRPC procedures in production. */
export const zeepoAgentErrorMiddleware = t.middleware(async ({ next }) => {
    try {
        return await next();
    }
    catch (error) {
        if (error instanceof TRPCError) {
            throw sanitizeTrpcErrorForClient(error);
        }
        console.error("[ZeepoAgent]", error);
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: resolveZeepoAgentPublicMessageFromError(error),
        });
    }
});
