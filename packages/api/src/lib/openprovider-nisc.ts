/**
 * OpenProvider integration for NISC domain orders: ensure customer, email verification, register or transfer domain.
 * Used by the NISC order processor for domain_registration and domain_transfer items.
 */
import * as crypto from "crypto";
import prisma from "@nPanel/db";
import { Prisma } from "@nPanel/db";
import { createOpenProviderClient } from "./openprovider-client";
import type { OpenProviderCustomerRequest } from "../types/openprovider";

const PROFILE_REQUIRED = [
	"firstName",
	"lastName",
	"address",
	"city",
	"country",
	"postalCode",
	"phone",
] as const;

export type EnsureOpenProviderResult = {
	subscriptionId?: string;
	pendingVerification: boolean;
};

export async function ensureOpenProviderAndRegisterDomain(params: {
	ownerId: string;
	createdBy: string;
	domainName: string;
	orderId: string;
	orderItemId: string;
	productId: string;
	productPlanId: string;
	userId: string | null;
	teamId: string | null;
	billingCycle: string | null;
	itemPrice: string;
	currency: string;
}): Promise<EnsureOpenProviderResult> {
	const user = await prisma.user.findUnique({
		where: { id: params.ownerId },
		include: { profile: true },
	});
	if (!user?.profile) {
		throw new Error("User or profile not found. Complete your profile information and retry creating an order.");
	}
	const profile = user.profile;
	const missing = PROFILE_REQUIRED.filter(
		(k) => !(profile as Record<string, unknown>)[k] || String((profile as Record<string, unknown>)[k]).trim() === "",
	);
	if (missing.length > 0) {
		throw new Error(
			"Complete your profile information (first name, last name, address, city, country, postal code, phone) and retry creating an order.",
		);
	}

	let integration = await prisma.customerIntegration.findUnique({
		where: {
			userId_platform: { userId: params.ownerId, platform: "OPENPROVIDER" },
		},
		include: { user: true },
	});

	const client = createOpenProviderClient();
	await client.authenticate({
		username: process.env.OPENPROVIDER_USERNAME!,
		password: process.env.OPENPROVIDER_PASSWORD!,
		ip: process.env.OPENPROVIDER_IP,
	});

	if (!integration) {
		// Create customer on OpenProvider and integration record (profile already validated for required fields)
		const openProviderData = buildOpenProviderCustomerRequest(
			profile as { firstName: string; lastName: string; address: string; city: string; country: string; postalCode: string; state?: string; phone: string },
			user.email ?? "",
		);
		const response = await client.createCustomer(openProviderData);
		if (response.code !== 0) {
			throw new Error(response.desc || "Failed to create OpenProvider customer");
		}
		const handle = response.data?.handle;
		if (!handle) throw new Error("OpenProvider did not return customer handle");

		const now = new Date();
		integration = await prisma.customerIntegration.create({
			data: {
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
				platformData: response.data ?? undefined,
			},
			include: { user: true },
		});

		await client.startEmailVerification({
			email: user.email ?? "",
			handle,
			language: "en",
		});

		const { renderOpenProviderVerifyEmail } = await import("./email-templates");
		const { sendEmail } = await import("./email");
		const html = await renderOpenProviderVerifyEmail({
			recipientName: profile.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : "Customer",
			domainName: params.domainName,
		});
		await sendEmail({
			to: user.email!,
			subject: "Verify your email to complete domain purchase",
			html,
		});

		const sub = await createDomainSubscription(params, integration.id, params.domainName, null, "PENDING");
		return { subscriptionId: sub.id, pendingVerification: true };
	}

	// Check verification status
	const statusResponse = await client.checkEmailVerificationStatus({
		handle: integration.platformCustomerId!,
		email: integration.user.email ?? undefined,
	});
	if (statusResponse.code !== 0) {
		throw new Error(statusResponse.desc || "Failed to check email verification status");
	}
	const results = (statusResponse.data?.results as Array<{ status?: string }>) || [];
	const isVerified = results.some((r) => r.status === "verified");

	if (!isVerified) {
		await client.startEmailVerification({
			email: integration.user.email ?? "",
			handle: integration.platformCustomerId!,
			language: "en",
		});
		const { renderOpenProviderVerifyEmail } = await import("./email-templates");
		const { sendEmail } = await import("./email");
		const html = await renderOpenProviderVerifyEmail({
			recipientName: (integration.user as { name?: string }).name ?? "Customer",
			domainName: params.domainName,
		});
		await sendEmail({
			to: integration.user.email!,
			subject: "Verify your email to complete domain purchase",
			html,
		});
		const sub = await createDomainSubscription(
			params,
			integration.id,
			params.domainName,
			null,
			"PENDING",
		);
		return { subscriptionId: sub.id, pendingVerification: true };
	}

	// Verified: register domain
	const lastDot = params.domainName.lastIndexOf(".");
	if (lastDot <= 0) {
		throw new Error(`Invalid domain name: ${params.domainName}`);
	}
	const name = params.domainName.slice(0, lastDot);
	const extension = params.domainName.slice(lastDot); // e.g. ".com"
	const period = billingCycleToYears(params.billingCycle);

	const regResponse = await client.registerDomain({
		name,
		extension,
		period,
		owner_handle: integration.platformCustomerId!,
		admin_handle: integration.platformCustomerId!,
		tech_handle: integration.platformCustomerId!,
	});

	if (regResponse.code !== 0) {
		throw new Error(regResponse.desc || "Domain registration failed");
	}
	const domainId = regResponse.data?.id;
	const sub = await createDomainSubscription(
		params,
		integration.id,
		params.domainName,
		domainId ?? undefined,
		"ACTIVE",
	);
	return { subscriptionId: sub.id, pendingVerification: false };
}

/** Result of ensureOpenProviderAndTransferDomain. */
export type EnsureOpenProviderTransferResult = {
	subscriptionId?: string;
	pendingVerification: boolean;
};

/**
 * Ensure OpenProvider customer + verification, then initiate domain transfer.
 * authCode must be provided (from order item metadata).
 */
export async function ensureOpenProviderAndTransferDomain(params: {
	ownerId: string;
	createdBy: string;
	domainName: string;
	authCode: string;
	orderId: string;
	orderItemId: string;
	productId: string;
	productPlanId: string;
	userId: string | null;
	teamId: string | null;
	billingCycle: string | null;
	itemPrice: string;
	currency: string;
	nameServers?: Array<{ name: string; ip?: string }>;
	period?: number;
}): Promise<EnsureOpenProviderTransferResult> {
	const user = await prisma.user.findUnique({
		where: { id: params.ownerId },
		include: { profile: true },
	});
	if (!user?.profile) {
		throw new Error("User or profile not found. Complete your profile information and retry.");
	}
	const profile = user.profile;
	const missing = PROFILE_REQUIRED.filter(
		(k) => !(profile as Record<string, unknown>)[k] || String((profile as Record<string, unknown>)[k]).trim() === "",
	);
	if (missing.length > 0) {
		throw new Error(
			"Complete your profile information (first name, last name, address, city, country, postal code, phone) and retry.",
		);
	}

	let integration = await prisma.customerIntegration.findUnique({
		where: {
			userId_platform: { userId: params.ownerId, platform: "OPENPROVIDER" },
		},
		include: { user: true },
	});

	const client = createOpenProviderClient();
	await client.authenticate({
		username: process.env.OPENPROVIDER_USERNAME!,
		password: process.env.OPENPROVIDER_PASSWORD!,
		ip: process.env.OPENPROVIDER_IP,
	});

	if (!integration) {
		const openProviderData = buildOpenProviderCustomerRequest(
			profile as { firstName: string; lastName: string; address: string; city: string; country: string; postalCode: string; state?: string; phone: string },
			user.email ?? "",
		);
		const response = await client.createCustomer(openProviderData);
		if (response.code !== 0) {
			throw new Error(response.desc || "Failed to create OpenProvider customer");
		}
		const handle = response.data?.handle;
		if (!handle) throw new Error("OpenProvider did not return customer handle");

		const now = new Date();
		integration = await prisma.customerIntegration.create({
			data: {
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
				platformData: response.data ?? undefined,
			},
			include: { user: true },
		});

		await client.startEmailVerification({
			email: user.email ?? "",
			handle,
			language: "en",
		});
		const { renderOpenProviderVerifyEmail } = await import("./email-templates");
		const { sendEmail } = await import("./email");
		const html = await renderOpenProviderVerifyEmail({
			recipientName: profile.firstName ? `${profile.firstName} ${profile.lastName}`.trim() : "Customer",
			domainName: params.domainName,
		});
		await sendEmail({
			to: user.email!,
			subject: "Verify your email to complete domain transfer",
			html,
		});
		const sub = await createDomainSubscription(
			params,
			integration.id,
			params.domainName,
			null,
			"PENDING",
		);
		return { subscriptionId: sub.id, pendingVerification: true };
	}

	const statusResponse = await client.checkEmailVerificationStatus({
		handle: integration.platformCustomerId!,
		email: integration.user.email ?? undefined,
	});
	if (statusResponse.code !== 0) {
		throw new Error(statusResponse.desc || "Failed to check email verification status");
	}
	const results = (statusResponse.data?.results as Array<{ status?: string }>) || [];
	const isVerified = results.some((r) => r.status === "verified");

	if (!isVerified) {
		await client.startEmailVerification({
			email: integration.user.email ?? "",
			handle: integration.platformCustomerId!,
			language: "en",
		});
		const { renderOpenProviderVerifyEmail } = await import("./email-templates");
		const { sendEmail } = await import("./email");
		const html = await renderOpenProviderVerifyEmail({
			recipientName: (integration.user as { name?: string }).name ?? "Customer",
			domainName: params.domainName,
		});
		await sendEmail({
			to: integration.user.email!,
			subject: "Verify your email to complete domain transfer",
			html,
		});
		const sub = await createDomainSubscription(
			params,
			integration.id,
			params.domainName,
			null,
			"PENDING",
		);
		return { subscriptionId: sub.id, pendingVerification: true };
	}

	const lastDot = params.domainName.lastIndexOf(".");
	if (lastDot <= 0) {
		throw new Error(`Invalid domain name: ${params.domainName}`);
	}
	const name = params.domainName.slice(0, lastDot);
	const extension = params.domainName.slice(lastDot);
	const period = params.period ?? billingCycleToYears(params.billingCycle);

	const transferResponse = await client.transferDomain({
		domain: { name, extension },
		auth_code: params.authCode,
		owner_handle: integration.platformCustomerId!,
		admin_handle: integration.platformCustomerId!,
		tech_handle: integration.platformCustomerId!,
		period,
		name_servers: params.nameServers?.length ? params.nameServers : undefined,
	});

	if (transferResponse.code !== 0) {
		throw new Error(transferResponse.desc || "Domain transfer failed");
	}
	const domainId = transferResponse.data?.id ?? null;
	const sub = await createDomainSubscription(
		params,
		integration.id,
		params.domainName,
		domainId ?? undefined,
		"ACTIVE",
	);
	return { subscriptionId: sub.id, pendingVerification: false };
}

function buildOpenProviderCustomerRequest(
	profile: { firstName: string; lastName: string; address: string; city: string; country: string; postalCode: string; state?: string; phone: string },
	email: string,
): OpenProviderCustomerRequest {
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
	} else if (phoneDigits.length >= 9) {
		areaCode = phoneDigits.slice(0, 2);
		subscriberNumber = phoneDigits.slice(2);
	} else {
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

function billingCycleToYears(billingCycle: string | null): number {
	if (!billingCycle) return 1;
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

async function createDomainSubscription(
	params: {
		orderId: string;
		productId: string;
		productPlanId: string;
		userId: string | null;
		teamId: string | null;
		createdBy: string;
		billingCycle: string | null;
		itemPrice: string;
		currency: string;
	},
	_integrationId: string,
	primaryDomain: string,
	openProviderId: number | null,
	status: "PENDING" | "ACTIVE",
) {
	return prisma.niscClientSubscription.create({
		data: {
			name: primaryDomain,
			userId: params.userId,
			teamId: params.teamId,
			productId: params.productId,
			productPlanId: params.productPlanId,
			niscOrderId: params.orderId,
			subscribedBy: params.createdBy,
			status,
			subscriptionDate: new Date(),
			billingCycle: params.billingCycle as any ?? null,
			pricingModel: "FIXED",
			agreedPrice: params.itemPrice,
			agreedCurrency: params.currency,
			primaryDomain,
			openProviderId,
			metadata: Prisma.JsonNull,
		},
	});
}
