/**
 * NISC order processor: runs in the QStash worker to process a single NiscOrder.
 * For each item: no integration → create NiscClientSubscription;
 * Plesk (web_hosting, email_hosting) → ensure integration + provision;
 * OpenProvider (domain_registration) → ensure integration, verify email, register domain;
 * OpenProvider (domain_transfer) → ensure integration, verify email, transfer domain (auth code in item.metadata).
 */
import prisma from "@nPanel/db";
import { Prisma } from "@nPanel/db";

const NO_INTEGRATION_SERVICE_TYPES = [
	"email_marketing",
	"seo",
	"media_buying",
	"social_media",
	"creatives",
	"consulting",
	"custom",
];
const PLESK_SERVICE_TYPES = ["web_hosting", "email_hosting"];
const OPENPROVIDER_SERVICE_TYPES = ["domain_registration", "domain_transfer"];

export type ProcessNiscOrderResult =
	| { ok: true; status: "COMPLETED" | "PARTIAL"; failureReason?: string }
	| { ok: false; status: "FAILED"; failureReason: string };

export async function processNiscOrder(niscOrderId: string): Promise<ProcessNiscOrderResult> {
	const order = await prisma.niscOrder.findUnique({
		where: { id: niscOrderId },
		include: {
			orderItems: {
				include: {
					product: true,
					productPlan: true,
					domainSubscription: true,
				},
			},
			user: true,
			team: true,
		},
	});

	if (!order) {
		return { ok: false, status: "FAILED", failureReason: "Order not found" };
	}

	const now = new Date();
	await prisma.niscOrder.update({
		where: { id: niscOrderId },
		data: { status: "PROCESSING", processedAt: now, updatedAt: now },
	});

	let hasFailure = false;
	let hasSuccess = false;
	const failureReasons: string[] = [];

	for (const item of order.orderItems) {
		if (item.status === "PROVISIONED") {
			hasSuccess = true;
			continue;
		}
		await prisma.niscOrderItem.update({
			where: { id: item.id },
			data: { status: "PROCESSING", updatedAt: now },
		});

		const serviceType = item.product.serviceType;

		try {
			if (NO_INTEGRATION_SERVICE_TYPES.includes(serviceType)) {
				const sub = await createSubscriptionForOrderItem(order, item);
				await prisma.niscOrderItem.update({
					where: { id: item.id },
					data: {
						status: "PROVISIONED",
						niscClientSubscriptionId: sub.id,
						updatedAt: now,
					},
				});
				hasSuccess = true;
				continue;
			}

			if (PLESK_SERVICE_TYPES.includes(serviceType)) {
				const result = await processPleskOrderItem(order, item);
				if (result.ok) {
					await prisma.niscOrderItem.update({
						where: { id: item.id },
						data: {
							status: "PROVISIONED",
							niscClientSubscriptionId: result.subscriptionId,
							updatedAt: now,
						},
					});
					hasSuccess = true;
				} else {
					await prisma.niscOrderItem.update({
						where: { id: item.id },
						data: {
							status: "FAILED",
							provisioningError: result.error,
							updatedAt: now,
						},
					});
					hasFailure = true;
					failureReasons.push(`Item ${item.product.name}: ${result.error}`);
				}
				continue;
			}

			if (OPENPROVIDER_SERVICE_TYPES.includes(serviceType)) {
				const result =
					serviceType === "domain_transfer"
						? await processOpenProviderTransferOrderItem(order, item)
						: await processOpenProviderOrderItem(order, item);
				if (result.ok) {
					await prisma.niscOrderItem.update({
						where: { id: item.id },
						data: {
							status: result.status,
							niscClientSubscriptionId: result.subscriptionId ?? undefined,
							provisioningError: result.pendingVerification ? "Pending email verification" : undefined,
							updatedAt: now,
						},
					});
					hasSuccess = true;
				} else {
					await prisma.niscOrderItem.update({
						where: { id: item.id },
						data: {
							status: "FAILED",
							provisioningError: result.error,
							updatedAt: now,
						},
					});
					hasFailure = true;
					failureReasons.push(`Item ${item.product.name}: ${result.error}`);
				}
				continue;
			}

			// Unknown service type
			await prisma.niscOrderItem.update({
				where: { id: item.id },
				data: {
					status: "FAILED",
					provisioningError: `Unsupported service type: ${serviceType}`,
					updatedAt: now,
				},
			});
			hasFailure = true;
			failureReasons.push(`Item ${item.product.name}: Unsupported service type ${serviceType}`);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			await prisma.niscOrderItem.update({
				where: { id: item.id },
				data: {
					status: "FAILED",
					provisioningError: message,
					updatedAt: now,
				},
			});
			hasFailure = true;
			failureReasons.push(`Item ${item.product.name}: ${message}`);
		}
	}

	const failureReason = failureReasons.length > 0 ? failureReasons.join("; ") : null;
	let orderStatus: "COMPLETED" | "FAILED" | "PARTIAL";
	if (hasFailure && !hasSuccess) {
		orderStatus = "FAILED";
	} else if (hasFailure && hasSuccess) {
		orderStatus = "PARTIAL";
	} else {
		orderStatus = "COMPLETED";
	}

	await prisma.niscOrder.update({
		where: { id: niscOrderId },
		data: {
			status: orderStatus,
			failureReason,
			completedAt: now,
			updatedAt: now,
		},
	});

	if (orderStatus === "FAILED") {
		return { ok: false as const, status: "FAILED" as const, failureReason: failureReason ?? "" };
	}
	return {
		ok: true as const,
		status: orderStatus,
		failureReason: failureReason ?? undefined,
	};
}

async function createSubscriptionForOrderItem(
	order: {
		userId: string | null;
		teamId: string | null;
		createdBy: string | null;
		id: string;
		currency: string;
	},
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		description: string | null;
		product: { name: string };
		productPlan: {
			name: string;
			pricingModel: string;
			price: string | null;
			cost: string | null;
			hostingType: string | null;
		} | null;
	},
) {
	const plan = item.productPlan;
	const name = plan ? `${item.product.name} - ${plan.name}` : item.product.name;
	const pricingModel = (plan?.pricingModel as "FIXED" | "COMMISSION") ?? "FIXED";
	const sub = await prisma.niscClientSubscription.create({
		data: {
			name,
			description: item.description ?? undefined,
			userId: order.userId,
			teamId: order.teamId,
			productId: item.productId,
			productPlanId: item.productPlanId,
			niscOrderId: order.id,
			subscribedBy: order.createdBy,
			status: "ACTIVE",
			subscriptionDate: new Date(),
			billingCycle: item.billingCycle as any ?? null,
			pricingModel,
			agreedPrice: item.itemPrice,
			agreedCurrency: order.currency,
			agreedCost: plan?.cost ?? null,
			agreedCostCurrency: "KES",
			providerCost: plan?.cost ?? null,
			providerCostCurrency: "KES",
			metadata: Prisma.JsonNull,
		},
	});
	return sub;
}

async function processPleskOrderItem(
	order: { teamId: string | null; userId: string | null; createdBy: string | null; id: string; currency: string },
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		primaryDomain: string | null;
		domainSubscriptionId: string | null;
		product: { name: string };
		productPlan: {
			name: string;
			pricingModel: string;
			price: string | null;
			cost: string | null;
			pleskServicePlanId: string | null;
			pleskIpAddress: string | null;
			hostingType: string | null;
		} | null;
		domainSubscription: { name: string | null; primaryDomain: string | null } | null;
	},
): Promise<{ ok: true; subscriptionId: string } | { ok: false; error: string }> {
	if (!item.productPlanId || !item.productPlan) {
		return { ok: false, error: "Hosting item requires a product plan." };
	}
	const domainName =
		item.primaryDomain ||
		item.domainSubscription?.primaryDomain ||
		item.domainSubscription?.name ||
		null;
	if (!domainName) {
		return { ok: false, error: "Domain is required for hosting. Select a domain subscription." };
	}

	const teamOwnerId = order.teamId
		? (await prisma.team.findUnique({ where: { id: order.teamId }, select: { createdById: true } }))?.createdById
		: order.userId;
	if (!teamOwnerId || !order.createdBy) {
		return { ok: false, error: "Order must have a team or user and createdBy for Plesk provisioning." };
	}

	const planId = item.productPlan.pleskServicePlanId;
	if (!planId) {
		return { ok: false, error: "Product plan has no Plesk service plan configured." };
	}

	try {
		const { ensurePleskIntegration, provisionToPlesk } = await import(
			"@nPanel/api/lib/plesk-integration"
		);
		const pleskOwnerId = await ensurePleskIntegration(teamOwnerId, order.createdBy);
		const result = await provisionToPlesk({
			domainName,
			pleskOwnerId,
			pleskServicePlanId: planId,
			ipAddress: item.productPlan.pleskIpAddress ?? undefined,
		});

		const name = `${item.product.name} - ${item.productPlan.name}`;
		const sub = await prisma.niscClientSubscription.create({
			data: {
				name,
				userId: order.userId,
				teamId: order.teamId,
				productId: item.productId,
				productPlanId: item.productPlanId,
				niscOrderId: order.id,
				subscribedBy: order.createdBy,
				status: "ACTIVE",
				subscriptionDate: new Date(),
				billingCycle: item.billingCycle as any ?? null,
				pricingModel: item.productPlan.pricingModel as any,
				agreedPrice: item.itemPrice,
				agreedCurrency: order.currency,
				agreedCost: item.productPlan.cost ?? null,
				agreedCostCurrency: "KES",
				primaryDomain: domainName,
				pleskFilterId: result.pleskServiceId,
				pleskOwnerId,
				pleskFtpLogin: result.pleskFtpLogin,
				pleskFtpPassword: result.pleskFtpPassword,
				hostingType: item.productPlan.hostingType as any ?? null,
				metadata: Prisma.JsonNull,
			},
		});
		return { ok: true, subscriptionId: sub.id };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: message };
	}
}

/** Metadata stored on NiscOrderItem for domain_transfer (auth code, optional nameservers). */
type DomainTransferItemMetadata = { transferAuthCode?: string; nameServers?: Array<{ name: string; ip?: string }> } | null;

async function processOpenProviderTransferOrderItem(
	order: { teamId: string | null; userId: string | null; createdBy: string | null; id: string; currency: string },
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		primaryDomain: string | null;
		description: string | null;
		metadata: unknown;
		product: { name: string };
		productPlan: { name: string; pricingModel: string; price: string | null; cost: string | null } | null;
	},
): Promise<
	| { ok: true; subscriptionId?: string; status: "PROVISIONED" | "PENDING"; pendingVerification?: boolean }
	| { ok: false; error: string }
> {
	const domainName = item.primaryDomain;
	if (!domainName) {
		return { ok: false, error: "Primary domain is required for domain transfer." };
	}
	const meta = item.metadata as DomainTransferItemMetadata;
	const authCode = meta?.transferAuthCode?.trim();
	if (!authCode) {
		return { ok: false, error: "Transfer auth code is required. Provide it in the order item metadata (transferAuthCode)." };
	}

	const ownerId = order.teamId
		? (await prisma.team.findUnique({ where: { id: order.teamId }, select: { createdById: true } }))?.createdById
		: order.userId;
	if (!ownerId || !order.createdBy) {
		return { ok: false, error: "Order must have a team or user and createdBy for domain transfer." };
	}

	try {
		const openProvider = await import("@nPanel/api/lib/openprovider-nisc");
		const result = await openProvider.ensureOpenProviderAndTransferDomain({
			ownerId,
			createdBy: order.createdBy,
			domainName,
			authCode,
			orderId: order.id,
			orderItemId: item.id,
			productId: item.productId,
			productPlanId: item.productPlanId ?? undefined,
			description: item.description ?? undefined,
			userId: order.userId,
			teamId: order.teamId,
			billingCycle: item.billingCycle,
			itemPrice: item.itemPrice,
			currency: order.currency,
			nameServers: meta?.nameServers,
		});
		return {
			ok: true,
			subscriptionId: result.subscriptionId,
			status: result.pendingVerification ? "PENDING" : "PROVISIONED",
			pendingVerification: result.pendingVerification,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: message };
	}
}

async function processOpenProviderOrderItem(
	order: { teamId: string | null; userId: string | null; createdBy: string | null; id: string; currency: string },
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		primaryDomain: string | null;
		description: string | null;
		product: { name: string };
		productPlan: { name: string; pricingModel: string; price: string | null; cost: string | null } | null;
	},
): Promise<
	| { ok: true; subscriptionId?: string; status: "PROVISIONED" | "PENDING"; pendingVerification?: boolean }
	| { ok: false; error: string }
> {
	const domainName = item.primaryDomain;
	if (!domainName) {
		return { ok: false, error: "Primary domain is required for domain registration." };
	}

	const ownerId = order.teamId
		? (await prisma.team.findUnique({ where: { id: order.teamId }, select: { createdById: true } }))?.createdById
		: order.userId;
	if (!ownerId || !order.createdBy) {
		return { ok: false, error: "Order must have a team or user and createdBy for domain registration." };
	}

	try {
		const openProvider = await import("@nPanel/api/lib/openprovider-nisc");
		const result = await openProvider.ensureOpenProviderAndRegisterDomain({
			ownerId,
			createdBy: order.createdBy,
			domainName,
			orderId: order.id,
			orderItemId: item.id,
			productId: item.productId,
			productPlanId: item.productPlanId ?? undefined,
			description: item.description ?? undefined,
			userId: order.userId,
			teamId: order.teamId,
			billingCycle: item.billingCycle,
			itemPrice: item.itemPrice,
			currency: order.currency,
		});
		if (result.subscriptionId) {
			return {
				ok: true,
				subscriptionId: result.subscriptionId,
				status: result.pendingVerification ? "PENDING" : "PROVISIONED",
				pendingVerification: result.pendingVerification,
			};
		}
		return {
			ok: true,
			status: result.pendingVerification ? "PENDING" : "PROVISIONED",
			pendingVerification: result.pendingVerification,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, error: message };
	}
}
