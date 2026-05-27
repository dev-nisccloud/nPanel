/** Resolve the linked Plesk webspace subscription id from a Nisc client subscription. */
export function getPleskSubscriptionId(sub: {
	serviceRefs?: unknown;
	pleskFilterId?: string | null;
}): number | null {
	let pleskId: string | null = null;
	const refs = sub.serviceRefs as Record<string, unknown> | null;
	if (
		refs &&
		(typeof refs.pleskSubscriptionId === "string" || typeof refs.pleskSubscriptionId === "number")
	) {
		pleskId = String(refs.pleskSubscriptionId);
	}
	if (!pleskId && sub.pleskFilterId) {
		pleskId = sub.pleskFilterId;
	}
	if (!pleskId) return null;

	const num = Number.parseInt(pleskId, 10);
	return Number.isFinite(num) && num > 0 ? num : null;
}

export function isPleskLinkedSubscription(sub: {
	serviceRefs?: unknown;
	pleskFilterId?: string | null;
	pleskOwnerId?: string | null;
	pleskFtpLogin?: string | null;
	hostingType?: string | null;
}): boolean {
	return getPleskSubscriptionId(sub) !== null;
}

export function getPleskSubscriptionDisplayName(sub: {
	name?: string | null;
	primaryDomain?: string | null;
}): string {
	return sub.name?.trim() || sub.primaryDomain?.trim() || "hosting subscription";
}
