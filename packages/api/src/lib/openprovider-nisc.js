/**
 * OpenProvider integration for Nisc domain orders: ensure customer, email verification, register or transfer domain.
 * Used by the Nisc order processor for domain_registration and domain_transfer items.
 */
import * as crypto from "crypto";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import { user as userTable } from "@npanel/db/schema/auth";
import { customerIntegration, userProfile } from "@npanel/db/schema/auth-extras";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { createOpenProviderClient, OpenProviderApiError, } from "./openprovider-client";
import { niscLog } from "./nisc-order-logger";
function logOpenProviderResponse(params) {
    void niscLog("processor_api_raw_response", {
        niscOrderId: params.orderId,
        orderItemId: params.orderItemId,
        provider: "openprovider",
        call: params.call,
        rawResponse: params.rawResponse,
    });
}
/** OpenProvider returns 20000 when the email is already verified; we treat that as success and proceed to register. */
function isAlreadyVerifiedError(e) {
    return (e instanceof OpenProviderApiError &&
        (e.code === 20000 || e.description.toLowerCase().includes("verified already")));
}
const PROFILE_REQUIRED = [
    "firstName",
    "lastName",
    "address",
    "city",
    "country",
    "postalCode",
    "phone",
];
export async function ensureOpenProviderAndRegisterDomain(params) {
    const [userRow] = await db
        .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phone: userProfile.phone,
        address: userProfile.address,
        city: userProfile.city,
        state: userProfile.state,
        country: userProfile.country,
        postalCode: userProfile.postalCode,
        profileUserId: userProfile.userId,
    })
        .from(userTable)
        .leftJoin(userProfile, eq(userProfile.userId, userTable.id))
        .where(eq(userTable.id, params.ownerId))
        .limit(1);
    if (!userRow?.profileUserId) {
        throw new Error("User or profile not found. Complete your profile information and retry creating an order.");
    }
    const ownerUser = {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        profile: {
            firstName: userRow.firstName ?? "",
            lastName: userRow.lastName ?? "",
            address: userRow.address ?? "",
            city: userRow.city ?? "",
            country: userRow.country ?? "",
            postalCode: userRow.postalCode ?? "",
            state: userRow.state ?? null,
            phone: userRow.phone ?? "",
        },
    };
    const profile = ownerUser.profile;
    const missing = PROFILE_REQUIRED.filter((k) => !profile[k] || String(profile[k]).trim() === "");
    if (missing.length > 0) {
        throw new Error("Complete your profile information (first name, last name, address, city, country, postal code, phone) and retry creating an order.");
    }
    const [integrationRow] = await db
        .select({
        id: customerIntegration.id,
        platformCustomerId: customerIntegration.platformCustomerId,
    })
        .from(customerIntegration)
        .where(and(eq(customerIntegration.userId, params.ownerId), eq(customerIntegration.platform, "OPENPROVIDER")))
        .limit(1);
    let integration = integrationRow
        ? {
            id: integrationRow.id,
            platformCustomerId: integrationRow.platformCustomerId ?? "",
            user: { email: ownerUser.email, name: ownerUser.name },
        }
        : null;
    const client = createOpenProviderClient();
    const authResponse = await client.authenticate({
        username: process.env.OPENPROVIDER_USERNAME,
        password: process.env.OPENPROVIDER_PASSWORD,
        ip: process.env.OPENPROVIDER_IP,
    });
    logOpenProviderResponse({
        orderId: params.orderId,
        orderItemId: params.orderItemId,
        call: "auth",
        rawResponse: authResponse,
    });
    if (!integration) {
        // Create customer on OpenProvider and integration record (profile already validated for required fields)
        const openProviderData = buildOpenProviderCustomerRequest(profile, ownerUser.email ?? "");
        const response = await client.createCustomer(openProviderData);
        logOpenProviderResponse({
            orderId: params.orderId,
            orderItemId: params.orderItemId,
            call: "createCustomer",
            rawResponse: response,
        });
        if (response.code !== 0) {
            throw new OpenProviderApiError(response.code, response.desc || "Failed to create OpenProvider customer", undefined, response);
        }
        const handle = response.data?.handle;
        if (!handle)
            throw new Error("OpenProvider did not return customer handle");
        const now = new Date();
        const inserted = await db
            .insert(customerIntegration)
            .values({
            id: crypto.randomUUID(),
            userId: params.ownerId,
            platform: "OPENPROVIDER",
            platformCustomerId: handle,
            isCreated: true,
            isActive: true,
            createdBy: params.createdBy,
            createdAt: now,
            lastSyncedAt: now,
            updatedAt: now,
            platformData: response.data ?? null,
        })
            .returning();
        const createdRow = inserted[0];
        if (!createdRow)
            throw new Error("Failed to create OpenProvider integration");
        integration = {
            id: createdRow.id,
            platformCustomerId: createdRow.platformCustomerId ?? "",
            user: { email: ownerUser.email, name: ownerUser.name },
        };
        let alreadyVerified = false;
        try {
            const startVerifyResp = await client.startEmailVerification({
                email: ownerUser.email ?? "",
                handle,
                language: "en",
            });
            logOpenProviderResponse({
                orderId: params.orderId,
                orderItemId: params.orderItemId,
                call: "startEmailVerification",
                rawResponse: startVerifyResp,
            });
        }
        catch (e) {
            if (e instanceof OpenProviderApiError && e.rawResponse != null) {
                logOpenProviderResponse({
                    orderId: params.orderId,
                    orderItemId: params.orderItemId,
                    call: "startEmailVerification",
                    rawResponse: e.rawResponse,
                });
            }
            if (isAlreadyVerifiedError(e)) {
                alreadyVerified = true;
            }
            else {
                throw e;
            }
        }
        if (!alreadyVerified) {
            const { renderOpenProviderVerifyEmail } = await import("./email-templates");
            const { sendEmail } = await import("./email");
            const html = await renderOpenProviderVerifyEmail({
                recipientName: profile.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : "Customer",
                domainName: params.domainName,
            });
            await sendEmail({
                to: ownerUser.email,
                subject: "Verify your email to complete domain purchase",
                html,
            });
            const sub = await createDomainSubscription({
                ...params,
                productPlanId: params.productPlanId ?? null,
                description: params.description ?? null,
            }, integration.id, params.domainName, null, "PENDING");
            return { subscriptionId: sub.id, pendingVerification: true };
        }
        // alreadyVerified: fall through to domain registration below
    }
    // Check verification status
    const statusResponse = await client.checkEmailVerificationStatus({
        handle: integration.platformCustomerId,
        email: integration.user.email ?? undefined,
    });
    logOpenProviderResponse({
        orderId: params.orderId,
        orderItemId: params.orderItemId,
        call: "checkEmailVerificationStatus",
        rawResponse: statusResponse,
    });
    if (statusResponse.code !== 0) {
        throw new OpenProviderApiError(statusResponse.code, statusResponse.desc || "Failed to check email verification status", undefined, statusResponse);
    }
    const results = statusResponse.data?.results || [];
    const isVerified = results.some((r) => r.status === "verified");
    if (!isVerified) {
        let alreadyVerified = false;
        try {
            const startVerifyResp = await client.startEmailVerification({
                email: integration.user.email ?? "",
                handle: integration.platformCustomerId,
                language: "en",
            });
            logOpenProviderResponse({
                orderId: params.orderId,
                orderItemId: params.orderItemId,
                call: "startEmailVerification",
                rawResponse: startVerifyResp,
            });
        }
        catch (e) {
            if (e instanceof OpenProviderApiError && e.rawResponse != null) {
                logOpenProviderResponse({
                    orderId: params.orderId,
                    orderItemId: params.orderItemId,
                    call: "startEmailVerification",
                    rawResponse: e.rawResponse,
                });
            }
            if (isAlreadyVerifiedError(e)) {
                alreadyVerified = true;
            }
            else {
                throw e;
            }
        }
        if (!alreadyVerified) {
            const { renderOpenProviderVerifyEmail } = await import("./email-templates");
            const { sendEmail } = await import("./email");
            const html = await renderOpenProviderVerifyEmail({
                recipientName: integration.user.name ?? "Customer",
                domainName: params.domainName,
            });
            await sendEmail({
                to: integration.user.email,
                subject: "Verify your email to complete domain purchase",
                html,
            });
            const sub = await createDomainSubscription(params, integration.id, params.domainName, null, "PENDING");
            return { subscriptionId: sub.id, pendingVerification: true };
        }
        // alreadyVerified: fall through to domain registration below
    }
    // Verified: register domain
    const lastDot = params.domainName.lastIndexOf(".");
    if (lastDot <= 0) {
        throw new Error(`Invalid domain name: ${params.domainName}`);
    }
    const name = params.domainName.slice(0, lastDot);
    const extension = params.domainName.slice(lastDot); // e.g. ".com"
    const period = billingCycleToYears(params.billingCycle);
    const registerRequest = {
        name,
        extension,
        period,
        owner_handle: integration.platformCustomerId,
        admin_handle: integration.platformCustomerId,
        tech_handle: integration.platformCustomerId,
    };
    void niscLog("processor_register_domain_request", {
        niscOrderId: params.orderId,
        orderItemId: params.orderItemId,
        provider: "openprovider",
        call: "registerDomain",
        request: registerRequest,
    });
    const regResponse = await client.registerDomain(registerRequest);
    logOpenProviderResponse({
        orderId: params.orderId,
        orderItemId: params.orderItemId,
        call: "registerDomain",
        rawResponse: regResponse,
    });
    if (regResponse.code !== 0) {
        throw new OpenProviderApiError(regResponse.code, regResponse.desc || "Domain registration failed", undefined, regResponse);
    }
    const domainId = regResponse.data?.id;
    const sub = await createDomainSubscription(params, integration.id, params.domainName, domainId ?? undefined, "ACTIVE");
    return { subscriptionId: sub.id, pendingVerification: false };
}
/**
 * Ensure OpenProvider customer + verification, then initiate domain transfer.
 * authCode must be provided (from order item metadata).
 */
export async function ensureOpenProviderAndTransferDomain(params) {
    const [userRow] = await db
        .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phone: userProfile.phone,
        address: userProfile.address,
        city: userProfile.city,
        state: userProfile.state,
        country: userProfile.country,
        postalCode: userProfile.postalCode,
        profileUserId: userProfile.userId,
    })
        .from(userTable)
        .leftJoin(userProfile, eq(userProfile.userId, userTable.id))
        .where(eq(userTable.id, params.ownerId))
        .limit(1);
    if (!userRow?.profileUserId) {
        throw new Error("User or profile not found. Complete your profile information and retry.");
    }
    const ownerUser = {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        profile: {
            firstName: userRow.firstName ?? "",
            lastName: userRow.lastName ?? "",
            phone: userRow.phone ?? "",
            address: userRow.address ?? "",
            city: userRow.city ?? "",
            state: userRow.state ?? null,
            country: userRow.country ?? "",
            postalCode: userRow.postalCode ?? "",
        },
    };
    const profile = ownerUser.profile;
    const missing = PROFILE_REQUIRED.filter((k) => !profile[k] || String(profile[k]).trim() === "");
    if (missing.length > 0) {
        throw new Error("Complete your profile information (first name, last name, address, city, country, postal code, phone) and retry.");
    }
    const [integrationRow] = await db
        .select({
        id: customerIntegration.id,
        platformCustomerId: customerIntegration.platformCustomerId,
    })
        .from(customerIntegration)
        .where(and(eq(customerIntegration.userId, params.ownerId), eq(customerIntegration.platform, "OPENPROVIDER")))
        .limit(1);
    let integration = integrationRow
        ? {
            id: integrationRow.id,
            platformCustomerId: integrationRow.platformCustomerId ?? "",
            user: { email: ownerUser.email, name: ownerUser.name },
        }
        : null;
    const client = createOpenProviderClient();
    const authResponse = await client.authenticate({
        username: process.env.OPENPROVIDER_USERNAME,
        password: process.env.OPENPROVIDER_PASSWORD,
        ip: process.env.OPENPROVIDER_IP,
    });
    logOpenProviderResponse({
        orderId: params.orderId,
        orderItemId: params.orderItemId,
        call: "auth",
        rawResponse: authResponse,
    });
    if (!integration) {
        const openProviderData = buildOpenProviderCustomerRequest(profile, ownerUser.email ?? "");
        const response = await client.createCustomer(openProviderData);
        logOpenProviderResponse({
            orderId: params.orderId,
            orderItemId: params.orderItemId,
            call: "createCustomer",
            rawResponse: response,
        });
        if (response.code !== 0) {
            throw new OpenProviderApiError(response.code, response.desc || "Failed to create OpenProvider customer", undefined, response);
        }
        const handle = response.data?.handle;
        if (!handle)
            throw new Error("OpenProvider did not return customer handle");
        const now = new Date();
        const inserted = await db
            .insert(customerIntegration)
            .values({
            id: crypto.randomUUID(),
            userId: params.ownerId,
            platform: "OPENPROVIDER",
            platformCustomerId: handle,
            isCreated: true,
            isActive: true,
            createdBy: params.createdBy,
            createdAt: now,
            lastSyncedAt: now,
            updatedAt: now,
            platformData: response.data ?? null,
        })
            .returning();
        const createdRow = inserted[0];
        if (!createdRow)
            throw new Error("Failed to create OpenProvider integration");
        integration = {
            id: createdRow.id,
            platformCustomerId: createdRow.platformCustomerId ?? "",
            user: { email: ownerUser.email, name: ownerUser.name },
        };
        let alreadyVerified = false;
        try {
            const startVerifyResp = await client.startEmailVerification({
                email: ownerUser.email ?? "",
                handle,
                language: "en",
            });
            logOpenProviderResponse({
                orderId: params.orderId,
                orderItemId: params.orderItemId,
                call: "startEmailVerification",
                rawResponse: startVerifyResp,
            });
        }
        catch (e) {
            if (e instanceof OpenProviderApiError && e.rawResponse != null) {
                logOpenProviderResponse({
                    orderId: params.orderId,
                    orderItemId: params.orderItemId,
                    call: "startEmailVerification",
                    rawResponse: e.rawResponse,
                });
            }
            if (isAlreadyVerifiedError(e)) {
                alreadyVerified = true;
            }
            else {
                throw e;
            }
        }
        if (!alreadyVerified) {
            const { renderOpenProviderVerifyEmail } = await import("./email-templates");
            const { sendEmail } = await import("./email");
            const html = await renderOpenProviderVerifyEmail({
                recipientName: profile.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : "Customer",
                domainName: params.domainName,
            });
            await sendEmail({
                to: ownerUser.email,
                subject: "Verify your email to complete domain transfer",
                html,
            });
            const sub = await createDomainSubscription(params, integration.id, params.domainName, null, "PENDING");
            return { subscriptionId: sub.id, pendingVerification: true };
        }
    }
    const statusResponse = await client.checkEmailVerificationStatus({
        handle: integration.platformCustomerId,
        email: integration.user.email ?? undefined,
    });
    logOpenProviderResponse({
        orderId: params.orderId,
        orderItemId: params.orderItemId,
        call: "checkEmailVerificationStatus",
        rawResponse: statusResponse,
    });
    if (statusResponse.code !== 0) {
        throw new OpenProviderApiError(statusResponse.code, statusResponse.desc || "Failed to check email verification status", undefined, statusResponse);
    }
    const results = statusResponse.data?.results || [];
    const isVerified = results.some((r) => r.status === "verified");
    if (!isVerified) {
        let alreadyVerifiedTransfer = false;
        try {
            const startVerifyResp = await client.startEmailVerification({
                email: integration.user.email ?? "",
                handle: integration.platformCustomerId,
                language: "en",
            });
            logOpenProviderResponse({
                orderId: params.orderId,
                orderItemId: params.orderItemId,
                call: "startEmailVerification",
                rawResponse: startVerifyResp,
            });
        }
        catch (e) {
            if (e instanceof OpenProviderApiError && e.rawResponse != null) {
                logOpenProviderResponse({
                    orderId: params.orderId,
                    orderItemId: params.orderItemId,
                    call: "startEmailVerification",
                    rawResponse: e.rawResponse,
                });
            }
            if (isAlreadyVerifiedError(e)) {
                alreadyVerifiedTransfer = true;
            }
            else {
                throw e;
            }
        }
        if (!alreadyVerifiedTransfer) {
            const { renderOpenProviderVerifyEmail } = await import("./email-templates");
            const { sendEmail } = await import("./email");
            const html = await renderOpenProviderVerifyEmail({
                recipientName: integration.user.name ?? "Customer",
                domainName: params.domainName,
            });
            await sendEmail({
                to: integration.user.email,
                subject: "Verify your email to complete domain transfer",
                html,
            });
            const sub = await createDomainSubscription(params, integration.id, params.domainName, null, "PENDING");
            return { subscriptionId: sub.id, pendingVerification: true };
        }
    }
    const lastDot = params.domainName.lastIndexOf(".");
    if (lastDot <= 0) {
        throw new Error(`Invalid domain name: ${params.domainName}`);
    }
    const name = params.domainName.slice(0, lastDot);
    const extension = params.domainName.slice(lastDot);
    const period = params.period ?? billingCycleToYears(params.billingCycle);
    const transferRequest = {
        domain: { name, extension },
        auth_code: params.authCode,
        owner_handle: integration.platformCustomerId,
        admin_handle: integration.platformCustomerId,
        tech_handle: integration.platformCustomerId,
        period,
        name_servers: params.nameServers?.length ? params.nameServers : undefined,
    };
    void niscLog("processor_transfer_domain_request", {
        niscOrderId: params.orderId,
        orderItemId: params.orderItemId,
        provider: "openprovider",
        call: "transferDomain",
        request: { ...transferRequest, auth_code: transferRequest.auth_code ? "[REDACTED]" : undefined },
    });
    const transferResponse = await client.transferDomain(transferRequest);
    logOpenProviderResponse({
        orderId: params.orderId,
        orderItemId: params.orderItemId,
        call: "transferDomain",
        rawResponse: transferResponse,
    });
    if (transferResponse.code !== 0) {
        throw new OpenProviderApiError(transferResponse.code, transferResponse.desc || "Domain transfer failed", undefined, transferResponse);
    }
    const domainId = transferResponse.data?.id ?? null;
    const sub = await createDomainSubscription(params, integration.id, params.domainName, domainId ?? undefined, "ACTIVE");
    return { subscriptionId: sub.id, pendingVerification: false, rawResponse: transferResponse };
}
function buildOpenProviderCustomerRequest(profile, email) {
    const phoneStr = profile.phone || "";
    const phoneDigits = phoneStr.replace(/\D/g, "");
    let countryCode = "254";
    let areaCode = "";
    let subscriberNumber = "";
    if (phoneDigits.startsWith("254")) {
        countryCode = "254";
        const remaining = phoneDigits.slice(3);
        areaCode = remaining.slice(0, 2);
        subscriberNumber = remaining.slice(2);
    }
    else if (phoneDigits.length >= 9) {
        areaCode = phoneDigits.slice(0, 2);
        subscriberNumber = phoneDigits.slice(2);
    }
    else {
        areaCode = phoneDigits.slice(0, 1) || "0";
        subscriberNumber = phoneDigits.slice(1) || phoneDigits;
    }
    const addressParts = (profile.address || "").split(/\s+/);
    const street = addressParts.slice(0, -1).join(" ") || profile.address || "";
    const number = addressParts[addressParts.length - 1] || "1";
    const country = profile.country === "Kenya" ? "KE" : profile.country;
    return {
        name: { first_name: profile.firstName, last_name: profile.lastName },
        address: {
            street,
            number,
            zipcode: profile.postalCode,
            city: profile.city,
            country,
            state: profile.state,
        },
        phone: {
            country_code: countryCode,
            area_code: areaCode,
            subscriber_number: subscriberNumber,
        },
        email,
    };
}
function billingCycleToYears(billingCycle) {
    if (!billingCycle)
        return 1;
    switch (billingCycle) {
        case "BIENNIALLY":
            return 2;
        case "YEARLY":
            return 1;
        case "MONTHLY":
            return 1; // OpenProvider typically min 1 year for registration
        default:
            return 1;
    }
}
async function createDomainSubscription(params, _integrationId, primaryDomain, openProviderId, status) {
    const subId = crypto.randomUUID();
    const [sub] = await db
        .insert(niscClientSubscription)
        .values({
        id: subId,
        name: primaryDomain,
        description: params.description ?? null,
        userId: params.userId,
        teamId: params.teamId,
        productId: params.productId,
        productPlanId: params.productPlanId ?? null,
        niscOrderId: params.orderId,
        subscribedBy: params.createdBy,
        status,
        subscriptionDate: new Date(),
        billingCycle: params.billingCycle ?? null,
        pricingModel: "FIXED",
        agreedPrice: params.itemPrice,
        agreedCurrency: params.currency,
        primaryDomain,
        openProviderId,
        agreedCommissionRate: null,
        agreedCommissionBase: null,
        metadata: null,
    })
        .returning();
    if (!sub)
        throw new Error("Failed to create OpenProvider domain subscription");
    return sub;
}
