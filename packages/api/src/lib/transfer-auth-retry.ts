/**
 * Detect a rejected domain-transfer authorization code and decide which
 * order items must receive a new code before a retry is queued.
 */

const RETRYABLE_ITEM_STATUSES = new Set(["FAILED", "SKIPPED", "PROCESSING"]);

export function isInvalidTransferAuthCodeError(message: string | null | undefined): boolean {
	if (!message) return false;
	const text = message.toLowerCase();
	if (text.includes("(t07)") || /\bt07\b/.test(text)) return true;
	if (text.includes("auth info password")) return true;
	if (text.includes("invalid authorization")) return true;
	if (text.includes("transfer auth code is required")) return true;
	const mentionsAuth =
		text.includes("auth code") ||
		text.includes("authcode") ||
		text.includes("authorization code") ||
		text.includes("epp code") ||
		text.includes("auth info");
	const mentionsBad =
		text.includes("invalid") ||
		text.includes("incorrect") ||
		text.includes("expired") ||
		text.includes("wrong") ||
		text.includes("required");
	return mentionsAuth && mentionsBad;
}

export function isDomainTransferOrderItem(item: {
	description?: string | null;
	metadata?: unknown;
	serviceType?: string | null;
	product?: { serviceType?: string | null } | null;
}): boolean {
	const raw = (item.product?.serviceType ?? item.serviceType ?? "").trim();
	const base = raw === "domains" ? "domain_registration" : raw;
	if (base === "domain_transfer") return true;
	const looksLikeDomain = base === "domain_registration" || raw.toLowerCase().includes("domain");
	if (!looksLikeDomain) return false;
	const meta =
		item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
			? (item.metadata as { transferAuthCode?: string })
			: null;
	return item.description === "transfer" || Boolean(meta?.transferAuthCode?.trim());
}

export function transferItemNeedsNewAuthCode(
	item: {
		status: string;
		description?: string | null;
		metadata?: unknown;
		provisioningError?: string | null;
		serviceType?: string | null;
		product?: { serviceType?: string | null } | null;
	},
	orderFailureReason: string | null | undefined,
): boolean {
	if (!RETRYABLE_ITEM_STATUSES.has(item.status)) return false;
	if (!isDomainTransferOrderItem(item)) return false;
	if (isInvalidTransferAuthCodeError(item.provisioningError)) return true;
	if (item.provisioningError?.trim()) return false;
	return isInvalidTransferAuthCodeError(orderFailureReason);
}
