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
import {
	createOpenProviderClient,
	OpenProviderApiError,
	buildOpenProviderApiError,
} from "./openprovider-client";
import { niscLog } from "./nisc-order-logger";
import type { OpenProviderCustomerRequest } from "../types/openprovider";

/**
 * Strip IP addresses from nameservers that are not in-bailiwick for the domain being registered.
 * Glue records (IP on the nameserver entry) are only valid when the nameserver hostname is itself
 * a subdomain of the domain being registered. Sending an IP for an out-of-bailiwick nameserver
 * causes registries (e.g. .live, .com) to reject the registration with a generic error (code 199).
 */
function toApiNameServers(
	domainName: string,
	nameServers?: Array<{ name: string; ip?: string }>,
): Array<{ name: string; ip?: string }> | undefined {
	if (!nameServers?.length) return undefined;
	const lower = domainName.toLowerCase();
	return nameServers.map((ns) => {
		const isInBailiwick = ns.name.toLowerCase().endsWith(`.${lower}`);
		return isInBailiwick ? ns : { name: ns.name };
	});
}

function logOpenProviderResponse(params: {
	orderId: string;
	orderItemId: string;
	call: string;
	rawResponse: unknown;
}): void {
	void niscLog("processor_api_raw_response", {
		niscOrderId: params.orderId,
		orderItemId: params.orderItemId,
		provider: "openprovider",
		call: params.call,
		rawResponse: params.rawResponse,
	});
}


const PROFILE_REQUIRED = [
	"firstName",
	"lastName",
	"address",
	"city",
	"country",
	"postalCode",
	"phone",
] as const;

export type ManualRegistrantDetails = {
	firstName: string;
	lastName: string;
	email: string;
	address: string;
	city: string;
	country: string;
	postalCode?: string | null;
	phone: string;
	state?: string | null;
};

export type EnsureOpenProviderResult = {
	subscriptionId?: string;
	pendingVerification: boolean;
};

export async function ensureOpenProviderAndRegisterDomain(params: {
	ownerId: string | null;
	createdBy: string;
	domainName: string;
	orderId: string;
	orderItemId: string;
	productId: string;
	productPlanId?: string | null;
	description?: string | null;
	userId: string | null;
	teamId: string | null;
	billingCycle: string | null;
	itemPrice: string;
	currency: string;
	nameServers?: Array<{ name: string; ip?: string }>;
	manualDetails?: ManualRegistrantDetails;
}): Promise<EnsureOpenProviderResult> {
	let ownerUser: { id: string | null; name: string; email: string; profile: ManualRegistrantDetails };
	let integration: {
		id: string;
		platformCustomerId: string;
		user: { email: string; name: string };
	} | null = null;

	if (params.manualDetails) {
		ownerUser = {
			id: null,
			name: `${params.manualDetails.firstName} ${params.manualDetails.lastName}`,
			email: params.manualDetails.email,
			profile: params.manualDetails,
		};
	} else {
		if (!params.ownerId) {
			throw new Error("Owner ID is required when manual details are not provided.");
		}
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
			throw new Error(
				"User or profile not found. Complete your profile information and retry creating an order.",
			);
		}

		ownerUser = {
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

		const [integrationRow] = await db
			.select({
				id: customerIntegration.id,
				platformCustomerId: customerIntegration.platformCustomerId,
			})
			.from(customerIntegration)
			.where(
				and(
					eq(customerIntegration.userId, params.ownerId),
					eq(customerIntegration.platform, "OPENPROVIDER"),
				),
			)
			.limit(1);

		if (integrationRow) {
			integration = {
				id: integrationRow.id,
				platformCustomerId: integrationRow.platformCustomerId ?? "",
				user: { email: ownerUser.email, name: ownerUser.name },
			};
		}
	}

	const profile = ownerUser.profile;

	const client = createOpenProviderClient();
	const authResponse = await client.authenticate({
		username: process.env.OPENPROVIDER_USERNAME!,
		password: process.env.OPENPROVIDER_PASSWORD!,
		ip: process.env.OPENPROVIDER_IP,
	});
	logOpenProviderResponse({
		orderId: params.orderId,
		orderItemId: params.orderItemId,
		call: "auth",
		rawResponse: authResponse,
	});

		if (!integration) {
		// Before creating a new customer, check if one already exists in OpenProvider for this email.
		// This prevents creating duplicate handles on every retry (happens when DB integration record
		// is not found, e.g. manual details path or first-save race condition).
		const existingHandle = await findCustomerHandleByEmail(client, ownerUser.email ?? "");
		logOpenProviderResponse({
			orderId: params.orderId,
			orderItemId: params.orderItemId,
			call: "searchCustomers_pre_create",
			rawResponse: existingHandle ? { found: true, handle: existingHandle } : { found: false },
		});

		const openProviderData = buildOpenProviderCustomerRequest(
			profile as { firstName: string; lastName: string; address: string; city: string; country: string; postalCode: string; state?: string; phone: string },
			ownerUser.email ?? "",
		);

		let handle: string;
		if (existingHandle) {
			// Reuse the existing handle but UPDATE its contact data so any previously stored
			// bad data (wrong address number, wrong phone format, etc.) gets corrected before
			// the domain registration is submitted to the registry.
			handle = existingHandle;
			void niscLog("processor_customer_update_request", {
				niscOrderId: params.orderId,
				orderItemId: params.orderItemId,
				handle,
				data: openProviderData,
			});
			const updateResp = await client.updateCustomer(handle, openProviderData).catch(() => null);
			logOpenProviderResponse({
				orderId: params.orderId,
				orderItemId: params.orderItemId,
				call: "updateCustomer",
				rawResponse: updateResp ?? { skipped: true },
			});
			void niscLog("processor_customer_reused", {
				niscOrderId: params.orderId,
				orderItemId: params.orderItemId,
				handle: existingHandle,
				updated: updateResp !== null,
			});
		} else {
			const response = await client.createCustomer(openProviderData);
			logOpenProviderResponse({
				orderId: params.orderId,
				orderItemId: params.orderItemId,
				call: "createCustomer",
				rawResponse: response,
			});
			if (response.code !== 0) {
				throw buildOpenProviderApiError(response, "Failed to create OpenProvider customer");
			}
			handle = response.data?.handle ?? "";
			if (!handle) throw new Error("OpenProvider did not return customer handle");
		}

		if (ownerUser.id) {
			const now = new Date();
			// ON CONFLICT DO NOTHING prevents unique constraint failures on retry.
			// Fall back to fetching the existing record if the insert was a no-op.
			const inserted = await db
				.insert(customerIntegration)
				.values({
					id: crypto.randomUUID(),
					userId: ownerUser.id,
					platform: "OPENPROVIDER",
					platformCustomerId: handle,
					isCreated: true,
					isActive: true,
					createdBy: params.createdBy,
					createdAt: now,
					lastSyncedAt: now,
					updatedAt: now,
					platformData: null,
				})
				.onConflictDoNothing()
				.returning();

			const savedRow = inserted[0] ?? await db
				.select({ id: customerIntegration.id, platformCustomerId: customerIntegration.platformCustomerId })
				.from(customerIntegration)
				.where(and(eq(customerIntegration.userId, ownerUser.id), eq(customerIntegration.platform, "OPENPROVIDER")))
				.limit(1)
				.then((rows) => rows[0]);

			if (!savedRow) throw new Error("Failed to create or retrieve OpenProvider integration");
			integration = {
				id: savedRow.id,
				platformCustomerId: savedRow.platformCustomerId ?? handle,
				user: { email: ownerUser.email, name: ownerUser.name },
			};
		} else {
			integration = {
				id: "manual",
				platformCustomerId: handle,
				user: { email: ownerUser.email, name: ownerUser.name },
			};
		}

		// Fire-and-forget: start email verification for ICANN compliance. Per OpenProvider docs,
		// email verification is a post-registration step - do NOT block registration on it.
		client.startEmailVerification({ email: ownerUser.email ?? "", handle, language: "en" })
			.then((r) => logOpenProviderResponse({ orderId: params.orderId, orderItemId: params.orderItemId, call: "startEmailVerification", rawResponse: r }))
			.catch((e) => {
				logOpenProviderResponse({ orderId: params.orderId, orderItemId: params.orderItemId, call: "startEmailVerification", rawResponse: (e as OpenProviderApiError).rawResponse ?? { error: String(e) } });
			});
	}

	// Fire-and-forget: trigger email verification for returning customers too.
	client.startEmailVerification({ email: integration.user.email ?? "", handle: integration.platformCustomerId!, language: "en" })
		.then((r) => logOpenProviderResponse({ orderId: params.orderId, orderItemId: params.orderItemId, call: "startEmailVerification", rawResponse: r }))
		.catch((e) => {
			logOpenProviderResponse({ orderId: params.orderId, orderItemId: params.orderItemId, call: "startEmailVerification", rawResponse: (e as OpenProviderApiError).rawResponse ?? { error: String(e) } });
		});

	// Register domain - email verification is a post-registration ICANN compliance step per
	// OpenProvider REST API docs. Registration does NOT wait for email verification.
	const lastDot = params.domainName.lastIndexOf(".");
	if (lastDot <= 0) {
		throw new Error(`Invalid domain name: ${params.domainName}`);
	}
	const name = params.domainName.slice(0, lastDot);
	const extension = params.domainName.slice(lastDot + 1); // e.g. "com" (no leading dot)
	const period = billingCycleToYears(params.billingCycle);

	// Verify the TLD is contracted/enabled for registration in this reseller account.
	// Availability checks (checkDomains) work even without a TLD contract, but registration will
	// fail with code 199 if the TLD hasn't been signed up for. Log the result for debugging.
	const tldResp = await client.getTlds({ extensions: [extension], status: "ACT", limit: 10, with_price: false });
	logOpenProviderResponse({
		orderId: params.orderId,
		orderItemId: params.orderItemId,
		call: "getTlds_pre_check",
		rawResponse: tldResp,
	});
	if (tldResp.code === 0) {
		const extNorm = extension.toLowerCase();
		const tldFound = tldResp.data?.results?.some((t: { name?: string }) => {
			const tName = (t?.name ?? "").toLowerCase().replace(/^\./, "");
			return tName === extNorm;
		});
		void niscLog("processor_tld_availability_check", {
			niscOrderId: params.orderId,
			orderItemId: params.orderItemId,
			extension,
			tldFound: !!tldFound,
			totalTldsReturned: tldResp.data?.total ?? 0,
		});
		if (!tldFound) {
			throw new Error(
				`TLD .${extension} is not enabled for registration in your OpenProvider reseller account. ` +
					`Please log into your OpenProvider control panel, navigate to TLD Settings, and activate the .${extension} TLD, ` +
					`or contact OpenProvider support.`,
			);
		}
	}

	// Pre-registration: check domain availability and detect already-owned domains.
	// Use with_price: true to get the full result including any `reason` field that would indicate
	// soft-quarantine (domain previously dropped and still within the 40-day quarantine window).
	// During quarantine the registry returns status:"free" on availability checks but rejects
	// registration attempts with code 199 - we need `reason` to detect this early.
	const checkResp = await client.checkDomains({ domains: [{ name, extension }], with_price: true });
	logOpenProviderResponse({
		orderId: params.orderId,
		orderItemId: params.orderItemId,
		call: "checkDomains",
		rawResponse: checkResp,
	});
	if (checkResp.code === 0) {
		const checkResult = checkResp.data?.results?.[0] as { status?: string; reason?: string; price?: unknown } | undefined;
		void niscLog("processor_domain_availability_check", {
			niscOrderId: params.orderId,
			orderItemId: params.orderItemId,
			domain: params.domainName,
			status: checkResult?.status ?? "unknown",
			reason: checkResult?.reason ?? null,
		});

		// Treat quarantine as "not available" rather than letting it fail silently at the registry.
		if (checkResult?.status === "free" && checkResult?.reason) {
			throw new Error(
				`Domain ${params.domainName} is listed as free but the registry returned a restriction reason: "${checkResult.reason}". ` +
					`This may indicate the domain is in a quarantine or redemption period. Try again later or contact support.`,
			);
		}
		if (checkResult && checkResult.status !== "free") {
			// Domain is not free - check if we already own it in our OpenProvider account.
			const existingDomain = await findDomainInAccount(client, name, extension);
			logOpenProviderResponse({
				orderId: params.orderId,
				orderItemId: params.orderItemId,
				call: "searchDomains_pre_check",
				rawResponse: existingDomain ?? { found: false },
			});
			if (existingDomain) {
				void niscLog("processor_domain_already_owned", {
					niscOrderId: params.orderId,
					orderItemId: params.orderItemId,
					domain: params.domainName,
					openProviderId: existingDomain.id,
					status: existingDomain.status,
				});
				const sub = await createDomainSubscription(
					params,
					integration.id,
					params.domainName,
					existingDomain.id,
					"ACTIVE",
				);
				return { subscriptionId: sub.id, pendingVerification: false };
			}
			throw new Error(
				`Domain ${params.domainName} is not available for registration (status: ${checkResult.status}). ` +
				`If you believe this is an error, contact support.`,
			);
		}
	}

	// Fetch any additional data fields required for this TLD's domain registrations and registrants.
	// This surfaces missing required fields early, before the registry rejects with code 199.
	const [additionalDataResp, customerAdditionalDataResp, customerDataResp] = await Promise.allSettled([
		client.getAdditionalData({ domain: { extension } }),
		client.getCustomerAdditionalData({ domain: { extension } }),
		client.getCustomer(integration.platformCustomerId!),
	]);
	logOpenProviderResponse({
		orderId: params.orderId,
		orderItemId: params.orderItemId,
		call: "getAdditionalData_domain",
		rawResponse: additionalDataResp.status === "fulfilled" ? additionalDataResp.value : { error: String((additionalDataResp as PromiseRejectedResult).reason) },
	});
	logOpenProviderResponse({
		orderId: params.orderId,
		orderItemId: params.orderItemId,
		call: "getAdditionalData_customer",
		rawResponse: customerAdditionalDataResp.status === "fulfilled" ? customerAdditionalDataResp.value : { error: String((customerAdditionalDataResp as PromiseRejectedResult).reason) },
	});
	logOpenProviderResponse({
		orderId: params.orderId,
		orderItemId: params.orderItemId,
		call: "getCustomer",
		rawResponse: customerDataResp.status === "fulfilled" ? customerDataResp.value : { error: String((customerDataResp as PromiseRejectedResult).reason) },
	});

	// Use TLD capabilities to decide which handle fields to include.
	// Sending admin_handle or tech_handle for TLDs that don't support them (e.g. .live) causes
	// the registry to reject the registration with the generic code 199.
	const tldInfo = tldResp.data?.results?.[0] as {
		owner_handle_supported?: boolean;
		admin_handle_supported?: boolean;
		tech_handle_supported?: boolean;
	} | undefined;
	// OpenProvider REST API requires domain name/extension as a nested "domain" object,
	// NOT as flat top-level fields. Sending them flat causes code 199 from the registry.
	const registerRequest = {
		domain: { name, extension },
		period,
		owner_handle: integration.platformCustomerId!,
		...(tldInfo?.admin_handle_supported !== false && {
			admin_handle: integration.platformCustomerId!,
		}),
		...(tldInfo?.tech_handle_supported !== false && {
			tech_handle: integration.platformCustomerId!,
		}),
		// Strip IPs from out-of-bailiwick nameservers - sending glue-record IPs for nameservers that
		// are not subdomains of the domain being registered causes registry rejection.
		name_servers: toApiNameServers(params.domainName, params.nameServers),
		autorenew: "default" as const,
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
		// Registration failed - before surfacing the error, check whether the domain was actually
		// created in OpenProvider (e.g. partial success: registry accepted but API returned code 199).
		const existingAfter = await findDomainInAccount(client, name, extension);
		logOpenProviderResponse({
			orderId: params.orderId,
			orderItemId: params.orderItemId,
			call: "searchDomains_post_failure",
			rawResponse: existingAfter ?? { found: false },
		});
		if (existingAfter) {
			void niscLog("processor_domain_registered_partial_success", {
				niscOrderId: params.orderId,
				orderItemId: params.orderItemId,
				domain: params.domainName,
				openProviderId: existingAfter.id,
				originalCode: regResponse.code,
			});
			const sub = await createDomainSubscription(
				params,
				integration.id,
				params.domainName,
				existingAfter.id,
				"ACTIVE",
			);
			return { subscriptionId: sub.id, pendingVerification: false };
		}
		throw buildOpenProviderApiError(regResponse, "Domain registration failed");
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
	/** Raw API response from transferDomain (for processor_api_raw_response logging). */
	rawResponse?: unknown;
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
	productPlanId?: string | null;
	description?: string | null;
	userId: string | null;
	teamId: string | null;
	billingCycle: string | null;
	itemPrice: string;
	currency: string;
	nameServers?: Array<{ name: string; ip?: string }>;
	period?: number;
	manualDetails?: ManualRegistrantDetails;
	domainTransferRequestId?: string | null;
	orderCreatedAt?: Date | null;
}): Promise<EnsureOpenProviderTransferResult> {
	let ownerUser: { id: string | null; name: string; email: string; profile: ManualRegistrantDetails };
	let integration: {
		id: string;
		platformCustomerId: string;
		user: { email: string; name: string };
	} | null = null;

	if (params.manualDetails) {
		ownerUser = {
			id: null,
			name: `${params.manualDetails.firstName} ${params.manualDetails.lastName}`,
			email: params.manualDetails.email,
			profile: params.manualDetails,
		};
	} else {
		if (!params.ownerId) {
			throw new Error("Owner ID is required when manual details are not provided.");
		}
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
			throw new Error(
				"User or profile not found. Complete your profile information and retry.",
			);
		}

		ownerUser = {
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

		const [integrationRow] = await db
			.select({
				id: customerIntegration.id,
				platformCustomerId: customerIntegration.platformCustomerId,
			})
			.from(customerIntegration)
			.where(
				and(
					eq(customerIntegration.userId, params.ownerId),
					eq(customerIntegration.platform, "OPENPROVIDER"),
				),
			)
			.limit(1);

		if (integrationRow) {
			integration = {
				id: integrationRow.id,
				platformCustomerId: integrationRow.platformCustomerId ?? "",
				user: { email: ownerUser.email, name: ownerUser.name },
			};
		}
	}

	const profile = ownerUser.profile;

	const client = createOpenProviderClient();
	const authResponse = await client.authenticate({
		username: process.env.OPENPROVIDER_USERNAME!,
		password: process.env.OPENPROVIDER_PASSWORD!,
		ip: process.env.OPENPROVIDER_IP,
	});
	logOpenProviderResponse({
		orderId: params.orderId,
		orderItemId: params.orderItemId,
		call: "auth",
		rawResponse: authResponse,
	});

	if (!integration) {
		// Before creating a new customer, check if one already exists in OpenProvider for this email.
		const existingHandleForTransfer = await findCustomerHandleByEmail(client, ownerUser.email ?? "");
		logOpenProviderResponse({
			orderId: params.orderId,
			orderItemId: params.orderItemId,
			call: "searchCustomers_pre_create",
			rawResponse: existingHandleForTransfer
				? { found: true, handle: existingHandleForTransfer }
				: { found: false },
		});

		const openProviderDataTransfer = buildOpenProviderCustomerRequest(
			profile as { firstName: string; lastName: string; address: string; city: string; country: string; postalCode: string; state?: string; phone: string },
			ownerUser.email ?? "",
		);

		let handle: string;
		if (existingHandleForTransfer) {
			handle = existingHandleForTransfer;
			const updateRespTransfer = await client.updateCustomer(handle, openProviderDataTransfer).catch(() => null);
			logOpenProviderResponse({
				orderId: params.orderId,
				orderItemId: params.orderItemId,
				call: "updateCustomer",
				rawResponse: updateRespTransfer ?? { skipped: true },
			});
			void niscLog("processor_customer_reused", {
				niscOrderId: params.orderId,
				orderItemId: params.orderItemId,
				handle: existingHandleForTransfer,
				updated: updateRespTransfer !== null,
			});
		} else {
			const response = await client.createCustomer(openProviderDataTransfer);
			logOpenProviderResponse({
				orderId: params.orderId,
				orderItemId: params.orderItemId,
				call: "createCustomer",
				rawResponse: response,
			});
			if (response.code !== 0) {
				throw buildOpenProviderApiError(response, "Failed to create OpenProvider customer");
			}
			handle = response.data?.handle ?? "";
			if (!handle) throw new Error("OpenProvider did not return customer handle");
		}

		if (ownerUser.id) {
			const now = new Date();
			const inserted = await db
				.insert(customerIntegration)
				.values({
					id: crypto.randomUUID(),
					userId: ownerUser.id,
					platform: "OPENPROVIDER",
					platformCustomerId: handle,
					isCreated: true,
					isActive: true,
					createdBy: params.createdBy,
					createdAt: now,
					lastSyncedAt: now,
					updatedAt: now,
					platformData: null,
				})
				.onConflictDoNothing()
				.returning();

			const savedRow = inserted[0] ?? await db
				.select({ id: customerIntegration.id, platformCustomerId: customerIntegration.platformCustomerId })
				.from(customerIntegration)
				.where(and(eq(customerIntegration.userId, ownerUser.id), eq(customerIntegration.platform, "OPENPROVIDER")))
				.limit(1)
				.then((rows) => rows[0]);

			if (!savedRow) throw new Error("Failed to create or retrieve OpenProvider integration");
			integration = {
				id: savedRow.id,
				platformCustomerId: savedRow.platformCustomerId ?? handle,
				user: { email: ownerUser.email, name: ownerUser.name },
			};
		} else {
			integration = {
				id: "manual",
				platformCustomerId: handle,
				user: { email: ownerUser.email, name: ownerUser.name },
			};
		}

		// Fire-and-forget: start email verification for ICANN compliance.
		// Per OpenProvider docs, email verification is post-transfer - do NOT block transfer on it.
		client.startEmailVerification({ email: ownerUser.email ?? "", handle, language: "en" })
			.then((r) => logOpenProviderResponse({ orderId: params.orderId, orderItemId: params.orderItemId, call: "startEmailVerification", rawResponse: r }))
			.catch((e) => {
				logOpenProviderResponse({ orderId: params.orderId, orderItemId: params.orderItemId, call: "startEmailVerification", rawResponse: (e as OpenProviderApiError).rawResponse ?? { error: String(e) } });
			});
	}

	// Fire-and-forget email verification for returning customers.
	client.startEmailVerification({ email: integration.user.email ?? "", handle: integration.platformCustomerId!, language: "en" })
		.then((r) => logOpenProviderResponse({ orderId: params.orderId, orderItemId: params.orderItemId, call: "startEmailVerification", rawResponse: r }))
		.catch((e) => {
			logOpenProviderResponse({ orderId: params.orderId, orderItemId: params.orderItemId, call: "startEmailVerification", rawResponse: (e as OpenProviderApiError).rawResponse ?? { error: String(e) } });
		});

	const lastDot = params.domainName.lastIndexOf(".");
	if (lastDot <= 0) {
		throw new Error(`Invalid domain name: ${params.domainName}`);
	}
	const name = params.domainName.slice(0, lastDot);
	const extension = params.domainName.slice(lastDot + 1); // e.g. "com" (no leading dot)
	const period = params.period ?? billingCycleToYears(params.billingCycle);

	// Check TLD capabilities so we only send handle fields the registry supports.
	const tldRespTransfer = await client.getTlds({
		extensions: [extension],
		status: "ACT",
		limit: 10,
		with_price: false,
	});
	logOpenProviderResponse({
		orderId: params.orderId,
		orderItemId: params.orderItemId,
		call: "getTlds_pre_check",
		rawResponse: tldRespTransfer,
	});
	const tldInfoTransfer = tldRespTransfer.data?.results?.[0] as {
		owner_handle_supported?: boolean;
		admin_handle_supported?: boolean;
		tech_handle_supported?: boolean;
	} | undefined;

	const transferRequest = {
		domain: { name, extension },
		auth_code: params.authCode,
		owner_handle: integration.platformCustomerId!,
		...(tldInfoTransfer?.admin_handle_supported !== false && {
			admin_handle: integration.platformCustomerId!,
		}),
		...(tldInfoTransfer?.tech_handle_supported !== false && {
			tech_handle: integration.platformCustomerId!,
		}),
		period,
		// Strip IPs from out-of-bailiwick nameservers - glue records only valid for in-bailiwick NSes.
		name_servers: toApiNameServers(params.domainName, params.nameServers),
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
		throw buildOpenProviderApiError(transferResponse, "Domain transfer failed");
	}
	const domainId = transferResponse.data?.id ?? null;
	const { resolveDomainTransferSubscriptionStartDate } = await import("./nisc-subscription-dates");
	const subscriptionDate = await resolveDomainTransferSubscriptionStartDate({
		domainTransferRequestId: params.domainTransferRequestId,
		orderCreatedAt: params.orderCreatedAt,
	});
	const sub = await createDomainSubscription(
		params,
		integration.id,
		params.domainName,
		domainId ?? undefined,
		"ACTIVE",
		{ subscriptionDate, applyBillingCycleExpiry: true },
	);
	return { subscriptionId: sub.id, pendingVerification: false, rawResponse: transferResponse };
}

/**
 * Search OpenProvider for an existing customer handle by email address.
 * Returns the first matching handle string, or null if none found.
 * Used to avoid creating duplicate customer handles on every retry.
 */
async function findCustomerHandleByEmail(
	client: ReturnType<typeof createOpenProviderClient>,
	email: string,
): Promise<string | null> {
	if (!email) return null;
	try {
		const resp = await client.searchCustomers({ email_pattern: email, limit: 5 });
		if (resp.code !== 0 || !resp.data?.results?.length) return null;
		const emailLower = email.toLowerCase();
		const match = resp.data.results.find(
			(c: { handle?: string; email?: string }) =>
				(c.email ?? "").toLowerCase() === emailLower && c.handle,
		);
		return match?.handle ?? null;
	} catch {
		return null;
	}
}

/**
 * Search the OpenProvider account for a domain by name + extension.
 * Returns the first matching domain record or null if not found.
 * Used to detect domains that were partially registered (registry accepted but our DB never updated).
 */
async function findDomainInAccount(
	client: ReturnType<typeof createOpenProviderClient>,
	name: string,
	extension: string,
): Promise<{ id: number; status: string } | null> {
	try {
		const searchResp = await client.searchDomains({
			domain_name_pattern: `${name}.${extension}`,
			limit: 5,
		});
		if (searchResp.code !== 0 || !searchResp.data?.results?.length) return null;
		const fullDomain = `${name}.${extension}`;
		const match = searchResp.data.results.find((d: { domain?: string; id?: number; status?: string }) => {
			const dName = (d.domain ?? "").toLowerCase();
			return dName === fullDomain || dName === `${name}${extension}`;
		});
		if (!match || typeof match.id !== "number") return null;
		return { id: match.id, status: match.status ?? "unknown" };
	} catch {
		return null;
	}
}

function buildOpenProviderCustomerRequest(
	profile: { firstName: string; lastName: string; address: string; city: string; country: string; postalCode: string; state?: string; phone: string },
	email: string,
): OpenProviderCustomerRequest {
	// --- Phone normalisation ---
	// Strip everything except digits, then normalise to international format.
	// Kenyan numbers: 0712345678 → country=254, area=71, subscriber=2345678
	//                 254712345678 → country=254, area=71, subscriber=2345678
	const phoneStr = profile.phone || "";
	const phoneDigits = phoneStr.replace(/\D/g, "");
	let countryCode = "254";
	let areaCode = "0";
	let subscriberNumber = "0000000";

	if (phoneDigits.startsWith("254") && phoneDigits.length > 3) {
		// Already in international format (with or without +)
		countryCode = "254";
		const national = phoneDigits.slice(3); // digits after country code
		areaCode = national.slice(0, 2);
		subscriberNumber = national.slice(2) || "0000000";
	} else if (phoneDigits.startsWith("0") && phoneDigits.length >= 9) {
		// Local format with trunk prefix - strip the leading 0
		const national = phoneDigits.slice(1);
		areaCode = national.slice(0, 2);
		subscriberNumber = national.slice(2) || "0000000";
	} else if (phoneDigits.length >= 7) {
		// No leading 0 and no country code - use as-is
		areaCode = phoneDigits.slice(0, 2);
		subscriberNumber = phoneDigits.slice(2) || "0000000";
	}

	// --- Address normalisation ---
	// OpenProvider requires a separate street name and house number.
	// Attempt to extract a leading numeric/alphanumeric token (e.g. "123", "4B") as the house
	// number. If none is found, default to "1" and use the full address as the street.
	const addressStr = (profile.address || "").trim();
	let street: string;
	let houseNumber: string;
	const leadingNumMatch = addressStr.match(/^(\d+[A-Za-z]?)\s+(.+)$/);
	if (leadingNumMatch) {
		houseNumber = leadingNumMatch[1]!;
		street = leadingNumMatch[2]!;
	} else {
		houseNumber = "1";
		street = addressStr || "N/A";
	}

	// Normalise country: accept full name "Kenya" or common variants and map to ISO 3166-1 alpha-2
	const countryMap: Record<string, string> = {
		kenya: "KE", "united states": "US", "united kingdom": "GB",
		tanzania: "TZ", uganda: "UG", ethiopia: "ET", nigeria: "NG",
		ghana: "GH", "south africa": "ZA",
	};
	const countryRaw = (profile.country || "").trim();
	const country = countryRaw.length === 2
		? countryRaw.toUpperCase()
		: (countryMap[countryRaw.toLowerCase()] ?? countryRaw.toUpperCase());

	return {
		name: { first_name: profile.firstName, last_name: profile.lastName },
		address: {
			street,
			number: houseNumber,
			zipcode: profile.postalCode || "00100",
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

/** Order item description "transfer" → subscription description "domain-transfer". */
function domainSubscriptionDescription(orderDescription?: string | null): string | null {
	if (orderDescription === "transfer") return "domain-transfer";
	return orderDescription ?? null;
}

async function createDomainSubscription(
	params: {
		orderId: string;
		productId: string;
		productPlanId?: string | null;
		description?: string | null;
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
	options?: { subscriptionDate?: Date; applyBillingCycleExpiry?: boolean },
) {
	const subscriptionDate = options?.subscriptionDate ?? new Date();
	const applyExpiry = options?.applyBillingCycleExpiry !== false;
	let expiryDate: Date | null = null;
	let nextRenewalDate: Date | null = null;
	if (applyExpiry) {
		const { resolveSubscriptionPeriodDates } = await import("./nisc-subscription-dates");
		const period = resolveSubscriptionPeriodDates(subscriptionDate, params.billingCycle);
		expiryDate = period.expiryDate;
		nextRenewalDate = period.nextRenewalDate;
	}

	const subId = crypto.randomUUID();
	const [sub] = await db
		.insert(niscClientSubscription)
		.values({
			id: subId,
			name: primaryDomain,
			description: domainSubscriptionDescription(params.description),
			userId: params.userId,
			teamId: params.teamId,
			productId: params.productId,
			productPlanId: params.productPlanId ?? null,
			niscOrderId: params.orderId,
			subscribedBy: params.createdBy,
			status,
			subscriptionDate,
			expiryDate,
			nextRenewalDate,
			billingCycle: (params.billingCycle as any) ?? null,
			pricingModel: "FIXED",
			agreedPrice: params.itemPrice,
			agreedCurrency: params.currency,
			primaryDomain,
			openProviderId,
			agreedCommissionRate: null as any,
			agreedCommissionBase: null,
			metadata: null,
		})
		.returning();

	if (!sub) throw new Error("Failed to create OpenProvider domain subscription");
	return sub;
}
