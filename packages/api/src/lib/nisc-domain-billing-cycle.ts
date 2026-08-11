/**
 * Client-safe domain billing-cycle helpers (no DB / env imports).
 * Keep this module free of @npanel/db so web SSR can import it.
 */

/** Domains (registration + transfer) are billed yearly when checkout omits a cycle. */
export const DOMAIN_DEFAULT_BILLING_CYCLE = "YEARLY" as const;

export function resolveDomainBillingCycle(
	billingCycle: string | null | undefined,
): string {
	const cycle = billingCycle?.trim();
	return cycle && cycle.length > 0 ? cycle : DOMAIN_DEFAULT_BILLING_CYCLE;
}

/** Map registration duration (years) to a supported billing-cycle enum value. */
export function domainBillingCycleFromYears(years: number): string {
	const y = Number.isFinite(years) ? Math.max(1, Math.floor(years)) : 1;
	if (y >= 4) return "QUADRENNIALLY";
	if (y === 3) return "TRIENNIALLY";
	if (y === 2) return "BIENNIALLY";
	return "YEARLY";
}

/**
 * Years to register/transfer at the provider.
 * Prefer explicit metadata.registrationPeriodYears (from multi-year checkout),
 * else derive from billing cycle.
 */
export function resolveDomainRegistrationPeriodYears(
	billingCycle: string | null | undefined,
	metadata?: unknown,
): number {
	const meta = metadata as { registrationPeriodYears?: unknown } | null;
	const fromMeta = meta?.registrationPeriodYears;
	if (typeof fromMeta === "number" && Number.isFinite(fromMeta)) {
		return Math.min(10, Math.max(1, Math.floor(fromMeta)));
	}
	if (typeof fromMeta === "string" && fromMeta.trim()) {
		const n = Number.parseInt(fromMeta, 10);
		if (Number.isFinite(n)) return Math.min(10, Math.max(1, n));
	}
	const cycle = resolveDomainBillingCycle(billingCycle).toUpperCase();
	if (cycle === "QUADRENNIALLY") return 4;
	if (cycle === "TRIENNIALLY") return 3;
	if (cycle === "BIENNIALLY") return 2;
	return 1;
}
