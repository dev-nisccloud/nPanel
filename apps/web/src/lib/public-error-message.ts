export const PUBLIC_SYSTEM_ERROR_MESSAGE = "A system error occurred. Please try again.";

/** Prefer server-sanitized tRPC messages; show raw detail only in local development. */
export function resolveClientErrorMessage(
	error: { message?: string } | null | undefined,
	fallback = PUBLIC_SYSTEM_ERROR_MESSAGE,
): string {
	if (import.meta.env.DEV) {
		const trimmed = error?.message?.trim();
		if (trimmed) return trimmed;
	}
	return fallback;
}
