import { TRPCError } from "@trpc/server";
import { t } from "../trpc";

/** Shown to clients when a cloud-hosting upstream error occurs in production. */
export const HIVELOCITY_PUBLIC_ERROR_MESSAGE =
	"A system error occurred. Please try again.";

const PRESERVED_TRPC_CODES = new Set<string>([
	"UNAUTHORIZED",
	"NOT_FOUND",
	"BAD_REQUEST",
	"FORBIDDEN",
	"CONFLICT",
	"PRECONDITION_FAILED",
	"TOO_MANY_REQUESTS",
]);

const PROVIDER_LEAK_PATTERNS = [/hivelocity/i, /core\.hivelocity\.net/i];

export function isHivelocityDevelopmentMode(): boolean {
	return process.env.NODE_ENV === "development";
}

function messageLeaksProvider(msg: string): boolean {
	return PROVIDER_LEAK_PATTERNS.some((pattern) => pattern.test(msg));
}

export function resolveHivelocityPublicMessageFromError(
	error: unknown,
	fallback = HIVELOCITY_PUBLIC_ERROR_MESSAGE,
): string {
	if (isHivelocityDevelopmentMode()) {
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

function sanitizeTrpcErrorForClient(error: TRPCError): TRPCError {
	if (isHivelocityDevelopmentMode()) {
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

	if (PRESERVED_TRPC_CODES.has(error.code) && msg.length > 0 && !messageLeaksProvider(msg)) {
		return error;
	}

	return new TRPCError({
		code: error.code,
		message: HIVELOCITY_PUBLIC_ERROR_MESSAGE,
		cause: error.cause,
	});
}

/** Sanitizes uncaught errors from all Hivelocity tRPC procedures in production. */
export const hivelocityErrorMiddleware = t.middleware(async ({ next }) => {
	try {
		return await next();
	} catch (error) {
		if (error instanceof TRPCError) {
			throw sanitizeTrpcErrorForClient(error);
		}
		console.error("[Hivelocity]", error);
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: resolveHivelocityPublicMessageFromError(error),
		});
	}
});
