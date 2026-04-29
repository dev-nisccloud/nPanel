import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, or } from "@npanel/db";
import * as crypto from "crypto";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { domainTransferRequest } from "@npanel/db/schema/domain-transfer-requests";
import { teamMember } from "@npanel/db/schema/teams";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { isKenicDomain } from "../lib/epp/kenic-tlds";
import { rdapLookup } from "../lib/rdap/client";
import { createOpenProviderClient, OpenProviderApiError } from "../lib/openprovider-client";
import { executeKenicTransferRequest } from "../lib/kenic-transfer-request";
/**
 * Parse domain into name and extension (extension without leading dot).
 * Handles multi-part TLDs (e.g. example.co.ke -> name: example, extension: co.ke).
 */
function parseDomain(input) {
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
const checkTransferInputSchema = z.object({
    domain: z.string().min(1, "Domain is required"),
});
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
const isAgencyUserRole = (role) => ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");
async function getMemberTeamIds(userId) {
    const memberships = await db
        .select({ teamId: teamMember.teamId })
        .from(teamMember)
        .where(eq(teamMember.userId, userId));
    return memberships.map((m) => m.teamId);
}
export const domainTransferRouter = router({
    /**
     * Check if a domain can be transferred and get the price.
     * Identifies TLD first (same as domain search): KENIC for .ke/.co.ke/etc., OpenProvider for others.
     * KENIC: EPP domain check only Ã¢â€ â€™ available or ready + price.
     * OpenProvider: RDAP for status (available / locked / ready), then transfer pricing when ready.
     */
    checkTransfer: publicProcedure
        .input(checkTransferInputSchema)
        .mutation(async ({ input }) => {
        const parsed = parseDomain(input.domain);
        if (!parsed) {
            return {
                transferStatus: "unavailable",
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
        const provider = isKenicDomain(parsed.full) ? "kenic" : "openprovider";
        if (provider === "kenic") {
            // KENIC TLDs: EPP fee extension returns 0; use standard rate so we can show a price and send transfer requests.
            const KENIC_STANDARD_TRANSFER_KES = 2100;
            return buildReturn("pending_check", true, "kenic", parsed, {
                price: KENIC_STANDARD_TRANSFER_KES,
                currency: "KES",
                createPrice: KENIC_STANDARD_TRANSFER_KES,
                createCurrency: "KES",
            });
        }
        else {
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
                        error: "This domain is locked at the current registrar. Unlock it in your registrar's control panel, then try the transfer again.",
                    });
                }
                // exists && !locked Ã¢â€ â€™ ready; get price below
            }
            else {
                // RDAP failed for this TLD Ã¢â‚¬â€ fall back to OpenProvider domain check
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
                    // active/in use Ã¢â€ â€™ ready; get price below
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
        }
        // Ready to transfer Ã¢â‚¬â€ get price from OpenProvider (KENIC returns earlier with pending_check)
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
        }
        catch (error) {
            const message = error instanceof OpenProviderApiError
                ? error.description
                : error instanceof Error
                    ? error.message
                    : "Failed to get transfer price.";
            return buildReturn("ready", true, "openprovider", parsed, { error: message });
        }
    }),
    /**
     * Initiate domain transfer: save to DB (DomainTransferRequest) then send to provider (KENIC or OpenProvider).
     * EPP/auth code is required. Caller must be authenticated.
     */
    initiateTransfer: protectedProcedure
        .input(z.object({
        domain: z.string().min(1, "Domain is required"),
        authCode: z.string().min(1, "Authorization code (EPP code) is required"),
        provider: z.enum(["kenic", "openprovider"]),
        domainName: z.string().min(1),
        extension: z.string().min(1),
        providerPriceAmount: z.string().optional(),
        providerPriceCurrency: z.string().optional(),
        customerPriceAmount: z.string().optional(),
        customerPriceCurrency: z.string().optional(),
        teamId: z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id;
        const userRole = ctx.session.user.role;
        const now = new Date();
        const id = crypto.randomUUID();
        if (input.teamId && !isAgencyUserRole(userRole)) {
            const [membership] = await db
                .select({ id: teamMember.id })
                .from(teamMember)
                .where(and(eq(teamMember.teamId, input.teamId), eq(teamMember.userId, userId)))
                .limit(1);
            if (!membership) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You do not have access to this team.",
                });
            }
        }
        await db.insert(domainTransferRequest).values({
            id,
            domainName: input.domain,
            authCode: input.authCode,
            provider: input.provider === "kenic" ? "KENIC" : "OPENPROVIDER",
            status: "PENDING",
            providerPriceAmount: input.providerPriceAmount ?? null,
            providerPriceCurrency: input.providerPriceCurrency ?? null,
            customerPriceAmount: input.customerPriceAmount ?? null,
            customerPriceCurrency: input.customerPriceCurrency ?? null,
            teamId: input.teamId ?? null,
            createdById: userId,
            createdAt: now,
            updatedAt: now,
            niscOrderId: null,
            submittedToProviderAt: null,
            providerResponse: null,
        });
        try {
            if (input.provider === "kenic") {
                const result = await executeKenicTransferRequest({
                    name: input.domain,
                    authCode: input.authCode,
                    period: 1,
                });
                await db
                    .update(domainTransferRequest)
                    .set({
                    status: "SUBMITTED_TO_PROVIDER",
                    submittedToProviderAt: new Date(),
                    providerResponse: result,
                    updatedAt: new Date(),
                })
                    .where(eq(domainTransferRequest.id, id));
                return { success: true, id, pending: result.pending, domain: result.domain };
            }
            const client = createOpenProviderClient();
            await client.authenticate({
                username: process.env.OPENPROVIDER_USERNAME,
                password: process.env.OPENPROVIDER_PASSWORD,
                ip: process.env.OPENPROVIDER_IP,
            });
            const ext = input.extension.startsWith(".") ? input.extension.slice(1) : input.extension;
            const response = await client.transferDomain({
                domain: { name: input.domainName, extension: ext },
                auth_code: input.authCode,
                owner_handle: "default",
                admin_handle: "default",
                tech_handle: "default",
                autorenew: "default",
            });
            if (response.code !== 0) {
                await db
                    .update(domainTransferRequest)
                    .set({
                    status: "FAILED",
                    providerResponse: { code: response.code, desc: response.desc },
                    updatedAt: new Date(),
                })
                    .where(eq(domainTransferRequest.id, id));
                throw new TRPCError({ code: "BAD_REQUEST", message: response.desc ?? "Transfer failed" });
            }
            await db
                .update(domainTransferRequest)
                .set({
                status: "SUBMITTED_TO_PROVIDER",
                submittedToProviderAt: new Date(),
                providerResponse: { success: true, data: response.data },
                updatedAt: new Date(),
            })
                .where(eq(domainTransferRequest.id, id));
            return {
                success: true,
                id,
                domain: `${input.domainName}.${ext}`,
            };
        }
        catch (error) {
            if (error instanceof TRPCError)
                throw error;
            const message = error instanceof Error ? error.message : String(error);
            await db
                .update(domainTransferRequest)
                .set({
                status: "FAILED",
                providerResponse: { error: message },
                updatedAt: new Date(),
            })
                .where(eq(domainTransferRequest.id, id))
                .catch(() => { });
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: message,
            });
        }
    }),
    /**
     * List domain transfer requests for the agency (all requests; auth required).
     * Does not return authCode for security.
     */
    listTransferRequests: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const userRole = ctx.session.user.role;
        let whereClause;
        if (!isAgencyUserRole(userRole)) {
            const memberTeamIds = await getMemberTeamIds(userId);
            const scopes = [eq(domainTransferRequest.createdById, userId)];
            if (memberTeamIds.length > 0) {
                scopes.push(inArray(domainTransferRequest.teamId, memberTeamIds));
            }
            whereClause = scopes.length === 1 ? scopes[0] : or(...scopes);
        }
        const rows = await db
            .select({
            id: domainTransferRequest.id,
            domainName: domainTransferRequest.domainName,
            provider: domainTransferRequest.provider,
            status: domainTransferRequest.status,
            providerPriceAmount: domainTransferRequest.providerPriceAmount,
            providerPriceCurrency: domainTransferRequest.providerPriceCurrency,
            customerPriceAmount: domainTransferRequest.customerPriceAmount,
            customerPriceCurrency: domainTransferRequest.customerPriceCurrency,
            submittedToProviderAt: domainTransferRequest.submittedToProviderAt,
            createdAt: domainTransferRequest.createdAt,
            updatedAt: domainTransferRequest.updatedAt,
            createdBy: {
                id: userTable.id,
                name: userTable.name,
                email: userTable.email,
            },
        })
            .from(domainTransferRequest)
            .innerJoin(userTable, eq(domainTransferRequest.createdById, userTable.id))
            .where(whereClause ?? undefined)
            .orderBy(desc(domainTransferRequest.createdAt));
        return rows.map((r) => ({
            ...r,
            createdBy: r.createdBy,
        }));
    }),
});
