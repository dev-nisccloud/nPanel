/** Shown when an unexpected failure leaks SQL, stacks, or other internals. */
export const GENERIC_USER_ERROR_MESSAGE =
	"An error occurred. Please try again or contact support if the issue persists.";

export function isAgencySuperAdminRole(role?: string | null): boolean {
	return role === "AGENCY_SUPER_ADMIN";
}

const CLIENT_SAFE_CODES = new Set([
	"BAD_REQUEST",
	"UNAUTHORIZED",
	"FORBIDDEN",
	"NOT_FOUND",
	"METHOD_NOT_SUPPORTED",
	"TIMEOUT",
	"CONFLICT",
	"PRECONDITION_FAILED",
	"PAYLOAD_TOO_LARGE",
	"TOO_MANY_REQUESTS",
	"CLIENT_CLOSED_REQUEST",
	"UNPROCESSABLE_CONTENT",
]);

function looksLikeInternalLeak(message: string): boolean {
	return (
		/Failed query:/i.test(message) ||
		/select\s+"[^"]+"[\s\S]*from\s+"/i.test(message) ||
		/column .+ does not exist/i.test(message) ||
		/relation .+ does not exist/i.test(message) ||
		/\bECONNREFUSED\b|\bETIMEDOUT\b|\bECONNRESET\b/i.test(message) ||
		/\bnode_modules\b/.test(message) ||
		/\bat\s+\S+\s+\(.*:\d+:\d+\)/.test(message)
	);
}

/**
 * Hide raw internals from everyone except agency super admins.
 * Expected client errors (not found, forbidden, validation) keep their message.
 */
export function formatUserFacingErrorMessage(opts: {
	message: string;
	code?: string | null;
	role?: string | null;
}): string {
	const message = opts.message?.trim() || GENERIC_USER_ERROR_MESSAGE;
	if (isAgencySuperAdminRole(opts.role)) return message;
	const code = opts.code ?? "";
	if (code === "INTERNAL_SERVER_ERROR" || !CLIENT_SAFE_CODES.has(code) || looksLikeInternalLeak(message)) {
		return GENERIC_USER_ERROR_MESSAGE;
	}
	return message;
}
