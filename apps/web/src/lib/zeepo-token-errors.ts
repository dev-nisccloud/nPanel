import { TRPCClientError } from "@trpc/client";

const TOKEN_BILLING_PATTERNS = [
	/insufficient tokens/i,
	/no active zeepo ai agent subscription/i,
	/purchase more tokens/i,
	/purchase a plan or token top-up/i,
	/no tokens left/i,
	/you have zero tokens/i,
] as const;

export type ZeepoTokenBillingErrorReason = "depleted" | "no_subscription";

export function getZeepoTokenBillingErrorReason(
	message: string,
): ZeepoTokenBillingErrorReason | null {
	if (!TOKEN_BILLING_PATTERNS.some((p) => p.test(message))) return null;
	if (/no active zeepo ai agent subscription/i.test(message)) return "no_subscription";
	return "depleted";
}

export function isZeepoTokenBillingError(error: unknown): boolean {
	const message = extractErrorMessage(error);
	return message ? getZeepoTokenBillingErrorReason(message) != null : false;
}

export function extractErrorMessage(error: unknown): string | null {
	if (error instanceof TRPCClientError) return error.message;
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	return null;
}

export function getZeepoTokenBillingErrorReasonFromError(
	error: unknown,
): ZeepoTokenBillingErrorReason | null {
	const message = extractErrorMessage(error);
	return message ? getZeepoTokenBillingErrorReason(message) : null;
}
