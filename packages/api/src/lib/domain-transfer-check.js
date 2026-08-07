import { isKenicDomain } from "./epp/kenic-tlds";
import { rdapLookup } from "./rdap/client";
import { createOpenProviderClient, OpenProviderApiError } from "./openprovider-client";
export function parseTransferDomain(input) {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed || trimmed.includes(" "))
        return null;
    const parts = trimmed.split(".");
    if (parts.length < 2)
        return null;
    let name;
    let extension;
    if (parts.length >= 3) {
        extension = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
        name = parts.slice(0, -2).join(".");
    }
    else {
        extension = parts[parts.length - 1] ?? "";
        name = parts[0] ?? "";
    }
    if (!name || !extension)
        return null;
    return { name, extension, full: trimmed };
}
function buildReturn(transferStatus, transferrable, provider, parsed, opts) {
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
/**
 * Check if a domain can be transferred and resolve provider pricing.
 * Shared by the domain transfer page and storefront cart upsell quotes.
 */
export async function checkDomainTransferEligibility(domain) {
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
            error: "Invalid domain format. Enter a full domain with a valid TLD (e.g. example.com or example.co.ke).",
        };
    }
    const provider = isKenicDomain(parsed.full) ? "kenic" : "openprovider";
    if (provider === "kenic") {
        const KENIC_STANDARD_TRANSFER_KES = 2100;
        return buildReturn("pending_check", true, "kenic", parsed, {
            price: KENIC_STANDARD_TRANSFER_KES,
            currency: "KES",
            createPrice: KENIC_STANDARD_TRANSFER_KES,
            createCurrency: "KES",
        });
    }
    const rdap = await rdapLookup(parsed.full);
    if (rdap.rdapAvailable) {
        if (!rdap.exists) {
            return buildReturn("available", false, "openprovider", parsed, {
                error: "This domain is available for registration, not transfer.",
            });
        }
        if (rdap.locked) {
            return buildReturn("locked", false, "openprovider", parsed, {
                error: "This domain is locked at the current registrar. Unlock it in your registrar's control panel, then wait about 15 seconds for the change to take effect before checking again.",
            });
        }
    }
    else {
        try {
            const client = createOpenProviderClient();
            await client.authenticate({
                username: process.env.OPENPROVIDER_USERNAME,
                password: process.env.OPENPROVIDER_PASSWORD,
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
        }
        catch (error) {
            const message = error instanceof OpenProviderApiError
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
            username: process.env.OPENPROVIDER_USERNAME,
            password: process.env.OPENPROVIDER_PASSWORD,
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
    }
    catch (error) {
        const message = error instanceof OpenProviderApiError
            ? error.description
            : error instanceof Error
                ? error.message
                : "Failed to get transfer price.";
        return buildReturn("ready", true, "openprovider", parsed, { error: message });
    }
}
