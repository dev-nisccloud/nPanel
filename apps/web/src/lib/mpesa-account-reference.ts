export const MPESA_ACCOUNT_REFERENCE_MAX_LEN = 12;
export const MPESA_ACCOUNT_REFERENCE_MIN_LEN = 3;

/** Strip invalid characters and enforce M-Pesa max length. */
export function sanitizeMpesaAccountReference(value: string): string {
	return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, MPESA_ACCOUNT_REFERENCE_MAX_LEN);
}

export function validateMpesaAccountReference(value: string): string {
	const sanitized = sanitizeMpesaAccountReference(value.trim());
	if (!sanitized) return "Account reference is required";
	if (sanitized.length < MPESA_ACCOUNT_REFERENCE_MIN_LEN) {
		return "Account reference must be at least 3 characters";
	}
	if (!/^[a-zA-Z0-9]+$/.test(sanitized)) {
		return "Account reference must be alphanumeric only (no spaces or special characters)";
	}
	return "";
}

/**
 * Generate an M-Pesa STK Push account reference (max 12 chars, alphanumeric only).
 * Strips dots, spaces, and other symbols from product labels (e.g. "pro.sm.amd" → "PROSMA…").
 */
export function generateMpesaAccountReference(label: string, fallbackPrefix = "ORD"): string {
	const timestamp = Date.now().toString().slice(-6);
	const prefix =
		label
			.replace(/[^a-zA-Z0-9]/g, "")
			.toUpperCase()
			.slice(0, 6) ||
		fallbackPrefix.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) ||
		"ORD";
	return `${prefix}${timestamp}`.slice(0, MPESA_ACCOUNT_REFERENCE_MAX_LEN);
}
