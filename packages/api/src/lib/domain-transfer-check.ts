import { isKenicDomain } from "./epp/kenic-tlds";
import { rdapLookup, type WhoisResult } from "./whois/rdap-client";
import { createOpenProviderClient, OpenProviderApiError } from "./openprovider-client";

/** User-facing transfer check status for the UI. */
export type TransferStatus =
	| "available"
	| "locked"
	| "ready"
	| "pending_check"
	| "reserved"
	| "unavailable";

export type TransferProvider = "kenic" | "openprovider";

/** Something that stops the transfer today; each code has fixed customer guidance in the UI. */
export type TransferBlockerCode =
	| "registrar_lock"
	| "registry_lock"
	| "recently_registered"
	| "recently_transferred"
	| "pending_transfer"
	| "redemption"
	| "pending_delete";

export type TransferWarningCode = "expired" | "expiring_soon";

/** Public registry (RDAP) facts shown before checkout. Null when the registry did not answer. */
export type TransferDetails = {
	registrar: string | null;
	registrarUrl: string | null;
	registeredAt: string | null;
	expiresAt: string | null;
	lastTransferredAt: string | null;
	/** Registry status values, e.g. "client transfer prohibited". */
	statuses: string[];
	blockers: TransferBlockerCode[];
	warnings: TransferWarningCode[];
	/** When the 60-day window after registration or the last transfer ends. */
	eligibleFrom: string | null;
	checkedAt: string;
};

export type CheckTransferResult = {
	transferStatus: TransferStatus;
	transferrable: boolean;
	provider: TransferProvider | null;
	domain: string;
	name: string | null;
	extension: string | null;
	price: number | null;
	currency: string | null;
	createPrice?: number | null;
	createCurrency?: string | null;
	error: string | null;
	details?: TransferDetails | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
/** ICANN Transfer Policy for gTLDs; Nisc applies the same 60-day window to KeNIC (.ke) as a registrar. */
const TRANSFER_WINDOW_DAYS = 60;
const EXPIRING_SOON_DAYS = 14;
const RDAP_TIMEOUT_MS = 8000;

function hasStatus(statuses: string[], ...needles: string[]): boolean {
	return statuses.some((raw) => {
		const status = raw.toLowerCase().replace(/[\s_-]/g, "");
		return needles.some((needle) => status === needle || status.includes(needle));
	});
}

function parseDate(value: string | null): number | null {
	if (!value) return null;
	const time = new Date(value).getTime();
	return Number.isNaN(time) ? null : time;
}

/** Turn an RDAP record into blockers and warnings. */
export function buildTransferDetails(
	whois: WhoisResult,
	opts: { now?: number } = {},
): TransferDetails {
	const now = opts.now ?? Date.now();
	const statuses = whois.status ?? [];
	const blockers: TransferBlockerCode[] = [];
	const warnings: TransferWarningCode[] = [];

	if (hasStatus(statuses, "pendingdelete")) blockers.push("pending_delete");
	if (hasStatus(statuses, "redemptionperiod", "pendingrestore")) blockers.push("redemption");
	if (hasStatus(statuses, "pendingtransfer")) blockers.push("pending_transfer");
	if (hasStatus(statuses, "servertransferprohibited")) blockers.push("registry_lock");

	let eligibleFrom: number | null = null;
	const registered = parseDate(whois.registrationDate);
	const transferred = parseDate(whois.transferDate);
	if (registered != null && now - registered < TRANSFER_WINDOW_DAYS * DAY_MS) {
		blockers.push("recently_registered");
		eligibleFrom = registered + TRANSFER_WINDOW_DAYS * DAY_MS;
	}
	if (transferred != null && now - transferred < TRANSFER_WINDOW_DAYS * DAY_MS) {
		blockers.push("recently_transferred");
		eligibleFrom = Math.max(eligibleFrom ?? 0, transferred + TRANSFER_WINDOW_DAYS * DAY_MS);
	}

	if (hasStatus(statuses, "clienttransferprohibited")) blockers.push("registrar_lock");

	const expires = parseDate(whois.expiryDate);
	if (expires != null && !blockers.includes("redemption") && !blockers.includes("pending_delete")) {
		if (expires < now) warnings.push("expired");
		else if (expires - now < EXPIRING_SOON_DAYS * DAY_MS) warnings.push("expiring_soon");
	}

	return {
		registrar: whois.registrar?.name ?? null,
		registrarUrl:
			whois.registrar?.url?.startsWith("http") && !/\/entity\/|rdap\./i.test(whois.registrar.url)
				? whois.registrar.url
				: null,
		registeredAt: whois.registrationDate,
		expiresAt: whois.expiryDate,
		lastTransferredAt: whois.transferDate,
		statuses,
		blockers,
		warnings,
		eligibleFrom: eligibleFrom != null ? new Date(eligibleFrom).toISOString() : null,
		checkedAt: new Date(now).toISOString(),
	};
}

async function lookupRegistry(domain: string): Promise<WhoisResult | null> {
	const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), RDAP_TIMEOUT_MS));
	return Promise.race([rdapLookup(domain).catch(() => null), timeout]);
}

const BLOCKER_SUMMARY: Record<TransferBlockerCode, string> = {
	pending_delete: "This domain is about to be deleted by the registry and cannot be transferred.",
	redemption: "This domain expired and is in its redemption period. Restore it at the current registrar first.",
	pending_transfer: "A transfer for this domain is already in progress.",
	registry_lock: "The registry has locked this domain. Ask the current registrar to remove the registry lock.",
	recently_registered: "This domain was registered less than 60 days ago. It can transfer once 60 days have passed.",
	recently_transferred: "This domain was transferred less than 60 days ago. It can transfer again once 60 days have passed.",
	registrar_lock: "This domain is locked at the current registrar. Unlock it there, then check again.",
};

export function parseTransferDomain(
	input: string,
): { name: string; extension: string; full: string } | null {
	const trimmed = input.trim().toLowerCase();
	if (!trimmed || trimmed.includes(" ")) return null;
	const parts = trimmed.split(".");
	if (parts.length < 2) return null;
	let name: string;
	let extension: string;
	if (parts.length >= 3) {
		extension = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
		name = parts.slice(0, -2).join(".");
	} else {
		extension = parts[parts.length - 1] ?? "";
		name = parts[0] ?? "";
	}
	if (!name || !extension) return null;
	return { name, extension, full: trimmed };
}

function buildReturn(
	transferStatus: TransferStatus,
	transferrable: boolean,
	provider: TransferProvider | null,
	parsed: { name: string; extension: string; full: string },
	opts: {
		price?: number | null;
		currency?: string | null;
		createPrice?: number | null;
		createCurrency?: string | null;
		error?: string | null;
		details?: TransferDetails | null;
	},
): CheckTransferResult {
	return {
		details: opts.details ?? null,
		transferStatus,
		transferrable,
		provider,
		domain: parsed.full,
		name: parsed.name,
		extension: parsed.extension,
		price: opts.price ?? null,
		currency: opts.currency ?? null,
		createPrice: opts.createPrice ?? null,
		createCurrency: opts.createCurrency ?? null,
		error: opts.error ?? null,
	};
}

/**
 * Check if a domain can be transferred and resolve provider pricing.
 * Shared by the domain transfer page and storefront cart upsell quotes.
 */
export async function checkDomainTransferEligibility(
	domain: string,
): Promise<CheckTransferResult> {
	const parsed = parseTransferDomain(domain);
	if (!parsed) {
		return {
			transferStatus: "unavailable",
			transferrable: false,
			provider: null,
			domain,
			name: null,
			extension: null,
			price: null,
			currency: null,
			error:
				"Invalid domain format. Enter a full domain with a valid TLD (e.g. example.com or example.co.ke).",
		};
	}

	const provider: TransferProvider = isKenicDomain(parsed.full) ? "kenic" : "openprovider";

	const whois = await lookupRegistry(parsed.full);
	const registryAnswered = whois != null && (whois.error == null || whois.error === "Domain not found");
	const details =
		whois && whois.error == null
			? buildTransferDetails(whois)
			: null;

	if (registryAnswered && whois?.error === "Domain not found" && provider === "openprovider") {
		return buildReturn("available", false, provider, parsed, {
			error: "This domain is available for registration, not transfer.",
		});
	}

	if (details && details.blockers.length > 0) {
		const onlyLocks = details.blockers.every((b) => b === "registrar_lock" || b === "registry_lock");
		return buildReturn(onlyLocks ? "locked" : "unavailable", false, provider, parsed, {
			error: BLOCKER_SUMMARY[details.blockers[0]!],
			details,
		});
	}

	if (provider === "kenic") {
		const KENIC_STANDARD_TRANSFER_KES = 2100;
		return buildReturn("pending_check", true, "kenic", parsed, {
			price: KENIC_STANDARD_TRANSFER_KES,
			currency: "KES",
			createPrice: KENIC_STANDARD_TRANSFER_KES,
			createCurrency: "KES",
			details,
		});
	}

	if (!registryAnswered) {
		try {
			const client = createOpenProviderClient();
			await client.authenticate({
				username: process.env.OPENPROVIDER_USERNAME!,
				password: process.env.OPENPROVIDER_PASSWORD!,
				ip: process.env.OPENPROVIDER_IP,
			});
			const checkResponse = await client.checkDomains({
				domains: [
					{
						name: parsed.name,
						extension: parsed.extension.startsWith(".")
							? parsed.extension.slice(1)
							: parsed.extension,
					},
				],
				with_price: true,
				with_whois: true,
			});
			if (checkResponse.code !== 0) {
				return buildReturn("unavailable", false, "openprovider", parsed, {
					error: checkResponse.desc ?? "Could not check domain status.",
				});
			}
			const result = checkResponse.data.results?.[0];
			if (!result) {
				return buildReturn("unavailable", false, "openprovider", parsed, {
					error: "No result returned for this domain.",
				});
			}
			const status = result.status?.toLowerCase?.();
			if (status === "free") {
				return buildReturn("available", false, "openprovider", parsed, {
					error: "This domain is available for registration, not transfer.",
				});
			}
			if (status === "reserved") {
				return buildReturn("reserved", false, "openprovider", parsed, {
					error: "This domain is reserved and cannot be transferred.",
				});
			}
			if (status !== "active" && status !== "in use") {
				return buildReturn("unavailable", false, "openprovider", parsed, {
					error: result.reason ?? `Domain status is "${result.status}". It cannot be transferred.`,
				});
			}
		} catch (error) {
			const message =
				error instanceof OpenProviderApiError
					? error.description
					: error instanceof Error
						? error.message
						: "Failed to check transfer eligibility.";
			return buildReturn("unavailable", false, "openprovider", parsed, { error: message });
		}
	}

	try {
		const client = createOpenProviderClient();
		await client.authenticate({
			username: process.env.OPENPROVIDER_USERNAME!,
			password: process.env.OPENPROVIDER_PASSWORD!,
			ip: process.env.OPENPROVIDER_IP,
		});
		const pricingResponse = await client.getDomainPricing({
			domain: {
				name: parsed.name,
				extension: parsed.extension.startsWith(".")
					? parsed.extension.slice(1)
					: parsed.extension,
			},
			operation: "transfer",
			period: 1,
		});
		if (pricingResponse.code !== 0) {
			return buildReturn("ready", true, "openprovider", parsed, {
				error: pricingResponse.desc ?? "Transfer price could not be retrieved.",
				details,
			});
		}
		const priceObj = pricingResponse.data?.price;
		const priceData = priceObj?.reseller ?? priceObj?.product;
		const price = priceData?.price ?? null;
		const currency = priceData?.currency ?? "USD";
		return buildReturn("ready", true, "openprovider", parsed, {
			price: price != null ? Number(price) : null,
			currency: price != null ? currency : null,
			details,
		});
	} catch (error) {
		const message =
			error instanceof OpenProviderApiError
				? error.description
				: error instanceof Error
					? error.message
					: "Failed to get transfer price.";
		return buildReturn("ready", true, "openprovider", parsed, { error: message, details });
	}
}
