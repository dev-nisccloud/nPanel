import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { isKenicDomain } from "../lib/epp/kenic-tlds";
import { getKenicPricingForTld } from "../lib/epp/kenic-pricing";
import { rdapLookup } from "../lib/rdap/client";
import { createOpenProviderClient, OpenProviderApiError } from "../lib/openprovider-client";

/**
 * Parse domain into name and extension (extension without leading dot).
 * Handles multi-part TLDs (e.g. example.co.ke -> name: example, extension: co.ke).
 */
function parseDomain(input: string): { name: string; extension: string; full: string } | null {
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

const checkTransferInputSchema = z.object({
	domain: z.string().min(1, "Domain is required"),
});

/** User-facing transfer check status for the UI. */
export type TransferStatus =
	| "available"   // Domain is free — suggest registration (CTA to register page)
	| "locked"      // Domain is registered but transfer-locked — show unlock instructions
	| "ready"       // Can transfer now — show price and purchase
	| "pending_check" // KENIC: TLD pricing only, no availability; show Continue, no "Ready" badge
	| "reserved"    // Domain is reserved
	| "unavailable"; // Invalid, error, or other (show error / why transfer failed)

function buildReturn(
	transferStatus: TransferStatus,
	transferrable: boolean,
	provider: "kenic" | "openprovider" | null,
	parsed: { name: string; extension: string; full: string },
	opts: {
		price?: number | null;
		currency?: string | null;
		createPrice?: number | null;
		createCurrency?: string | null;
		error?: string | null;
	}
) {
	return {
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

export const domainTransferRouter = router({
	/**
	 * Check if a domain can be transferred and get the price.
	 * Identifies TLD first (same as domain search): KENIC for .ke/.co.ke/etc., OpenProvider for others.
	 * KENIC: EPP domain check only → available or ready + price.
	 * OpenProvider: RDAP for status (available / locked / ready), then transfer pricing when ready.
	 */
	checkTransfer: publicProcedure
		.input(checkTransferInputSchema)
		.mutation(async ({ input }) => {
			const parsed = parseDomain(input.domain);
			if (!parsed) {
				return {
					transferStatus: "unavailable" as const,
					transferrable: false,
					provider: null,
					domain: input.domain,
					name: null,
					extension: null,
					price: null,
					currency: null,
					error: "Invalid domain format. Enter a full domain with a valid TLD (e.g. example.com or example.co.ke).",
				};
			}

			// Identify TLD and route to the correct provider (same as domain search).
			const provider: "kenic" | "openprovider" = isKenicDomain(parsed.full) ? "kenic" : "openprovider";

			if (provider === "kenic") {
				// KENIC TLDs: get TLD pricing via a random placeholder domain (no availability claim). Show Continue, no "Ready" badge.
				const pricing = await getKenicPricingForTld(parsed.extension);
				if (pricing === null) {
					return buildReturn("unavailable", false, "kenic", parsed, {
						error: "Could not get ." + parsed.extension + " pricing. Please try again.",
					});
				}
				const transferFee = pricing.transferFee;
				const createFee = pricing.createFee;
				if (!transferFee) {
					return buildReturn("unavailable", false, "kenic", parsed, {
						error: "Transfer price not available for ." + parsed.extension + ".",
					});
				}
				return buildReturn("pending_check", true, "kenic", parsed, {
					price: transferFee.amount,
					currency: transferFee.currency,
					createPrice: createFee?.amount ?? null,
					createCurrency: createFee?.currency ?? null,
				});
			} else {
				// OpenProvider/gTLD: use RDAP for status, then OpenProvider for pricing when ready.
				const rdap = await rdapLookup(parsed.full);
				if (rdap.rdapAvailable) {
					if (!rdap.exists) {
						return buildReturn("available", false, "openprovider", parsed, {
							error: "This domain is available for registration, not transfer.",
						});
					}
					if (rdap.locked) {
						return buildReturn("locked", false, "openprovider", parsed, {
							error:
								"This domain is locked at the current registrar. Unlock it in your registrar's control panel, then try the transfer again.",
						});
					}
					// exists && !locked → ready; get price below
				} else {
					// RDAP failed for this TLD — fall back to OpenProvider domain check
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
									extension: parsed.extension.startsWith(".") ? parsed.extension.slice(1) : parsed.extension,
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
						// active/in use → ready; get price below
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
			}

			// Ready to transfer — get price from OpenProvider (KENIC returns earlier with pending_check)
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
						extension: parsed.extension.startsWith(".") ? parsed.extension.slice(1) : parsed.extension,
					},
					operation: "transfer",
					period: 1,
				});
				if (pricingResponse.code !== 0) {
					return buildReturn("ready", true, "openprovider", parsed, {
						error: pricingResponse.desc ?? "Transfer price could not be retrieved.",
					});
				}
				const priceObj = pricingResponse.data?.price;
				const priceData = priceObj?.reseller ?? priceObj?.product;
				const price = priceData?.price ?? null;
				const currency = priceData?.currency ?? "USD";
				return buildReturn("ready", true, "openprovider", parsed, {
					price: price != null ? Number(price) : null,
					currency: price != null ? currency : null,
				});
			} catch (error) {
				const message =
					error instanceof OpenProviderApiError
						? error.description
						: error instanceof Error
							? error.message
							: "Failed to get transfer price.";
				return buildReturn("ready", true, "openprovider", parsed, { error: message });
			}
		}),
});
