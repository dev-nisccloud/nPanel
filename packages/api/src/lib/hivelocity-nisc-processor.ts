/**
 * Hivelocity provisioning for Nisc orders via the official Deployment API.
 */
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";

import { and, eq, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { niscClientSubscription } from "@npanel/db/schema/products";
import {
	hivelocityItemMetadataSchema,
	type HivelocityItemMetadata,
} from "../routers/nisc-service-orders-schemas";
import { provisionHivelocityViaDeployment } from "./hivelocity-deployment";
import { assertHivelocityOptionIdsExclusive } from "./hivelocity-option-validation";
import { applyHivelocityVpsReactivation } from "./hivelocity-vps-instance-suspend";
import { reloadHivelocityDevice } from "./hivelocity-vps-reload";
import { upgradeHivelocityVpsInstance } from "./hivelocity-vps-upgrade";

function buildHivelocityDeploymentName(orderNumberOrId: string): string {
	const base = orderNumberOrId.trim();
	const name = base.toLowerCase().startsWith("nisc-") ? base : `Nisc-${base}`;
	return name.slice(0, 120);
}

function buildHivelocityErrorDetails(err: unknown): Record<string, unknown> {
	if (err instanceof TRPCError) {
		return {
			provider: "hivelocity",
			code: err.code,
			message: err.message,
		};
	}
	if (err instanceof Error) {
		return {
			provider: "hivelocity",
			message: err.message,
			name: err.name,
		};
	}
	return { provider: "hivelocity", raw: String(err) };
}

function resolveHivelocityServiceType(productServiceType: string): "dedicated" | "vps" | "vds" {
	if (productServiceType === "vps_hosting") return "vps";
	if (productServiceType === "vds_hosting") return "vds";
	return "dedicated";
}

async function findSubscriptionByHivelocityDeviceId(
	deviceId: number,
	teamId: string | null,
): Promise<(typeof niscClientSubscription.$inferSelect) | null> {
	const idStr = String(deviceId);
	const where = teamId
		? and(
				eq(niscClientSubscription.teamId, teamId),
				sql`(${niscClientSubscription.serviceRefs}->>'hivelocityDeviceId') = ${idStr}`,
			)
		: sql`(${niscClientSubscription.serviceRefs}->>'hivelocityDeviceId') = ${idStr}`;

	const [row] = await db.select().from(niscClientSubscription).where(where).limit(1);
	return row ?? null;
}

async function processHivelocityVpsUpgradeOrderItem(
	order: {
		teamId: string | null;
		userId: string | null;
		createdBy: string | null;
		id: string;
		currency: string;
		orderNumber?: string;
	},
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		description: string | null;
		product: { name: string; serviceType: string };
	},
	meta: HivelocityItemMetadata,
): Promise<
	| { ok: true; subscriptionId: string; rawResponse: unknown }
	| { ok: false; error: string; errorDetails?: Record<string, unknown> }
> {
	const deviceId = meta.hivelocityTargetDeviceId;
	if (!deviceId) {
		return { ok: false, error: "VPS upgrade metadata is missing the target device id." };
	}

	let rawResponse: unknown;
	try {
		rawResponse = await upgradeHivelocityVpsInstance(deviceId, meta.hivelocityProductId);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false,
			error: `VPS upgrade failed: ${message}`,
			errorDetails: buildHivelocityErrorDetails(err),
		};
	}

	const now = new Date();
	const existing = await findSubscriptionByHivelocityDeviceId(deviceId, order.teamId);
	const upgradeRecord = {
		at: now.toISOString(),
		niscOrderId: order.id,
		fromProductId: meta.hivelocityCurrentProductId ?? null,
		toProductId: meta.hivelocityProductId,
		upgradeDeltaUsd: meta.upgradeDeltaUsd ?? null,
	};

	if (existing) {
		const prevMeta =
			existing.metadata && typeof existing.metadata === "object"
				? (existing.metadata as Record<string, unknown>)
				: {};
		const upgrades = Array.isArray(prevMeta.upgrades) ? [...prevMeta.upgrades] : [];

		const [updated] = await db
			.update(niscClientSubscription)
			.set({
				agreedPrice: item.itemPrice,
				agreedCurrency: order.currency,
				providerCost:
					meta.upgradeDeltaUsd != null ? String(meta.upgradeDeltaUsd) : existing.providerCost,
				metadata: {
					...prevMeta,
					hivelocityProductId: meta.hivelocityProductId,
					lastUpgrade: upgradeRecord,
					upgrades: [...upgrades, upgradeRecord],
					provisionMethod: "vps_upgrade_api",
				},
				updatedAt: now,
			})
			.where(eq(niscClientSubscription.id, existing.id))
			.returning();

		if (!updated) {
			return { ok: false, error: "Failed to update subscription after VPS upgrade." };
		}

		return { ok: true, subscriptionId: updated.id, rawResponse };
	}

	const subId = randomUUID();
	const subscriptionName =
		item.description?.trim() ||
		`${item.product.name} upgrade · device ${deviceId}`;

	const inserted = await db
		.insert(niscClientSubscription)
		.values({
			id: subId,
			name: subscriptionName,
			description: item.description ?? null,
			userId: order.userId,
			teamId: order.teamId,
			productId: item.productId,
			productPlanId: null,
			orderId: null,
			niscOrderId: order.id,
			subscribedBy: order.createdBy,
			status: "ACTIVE",
			subscriptionDate: now,
			billingCycle: (item.billingCycle as "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM") ?? null,
			pricingModel: "FIXED",
			agreedPrice: item.itemPrice,
			agreedCurrency: order.currency,
			agreedCost: null,
			agreedCostCurrency: "USD",
			providerCost: meta.upgradeDeltaUsd != null ? String(meta.upgradeDeltaUsd) : null,
			providerCostCurrency: "USD",
			agreedCommissionRate: null as any,
			agreedCommissionBase: null,
			serviceRefs: {
				hivelocityDeviceId: String(deviceId),
				hivelocityServiceType: "vps" as const,
			},
			metadata: {
				hivelocityDeviceId: deviceId,
				hivelocityProductId: meta.hivelocityProductId,
				locationName: meta.hivelocityLocationName,
				osName: meta.hivelocityOsName,
				hostname: meta.hivelocityHostname,
				period: meta.hivelocityPeriod,
				productType: "VPS",
				lastUpgrade: upgradeRecord,
				upgrades: [upgradeRecord],
				provisionedAt: now.toISOString(),
				provisionMethod: "vps_upgrade_api",
			},
		})
		.returning();

	const sub = inserted[0];
	if (!sub) {
		return { ok: false, error: "Failed to create subscription record after VPS upgrade." };
	}

	return { ok: true, subscriptionId: sub.id, rawResponse };
}

async function processHivelocityVpsReloadOrderItem(
	order: {
		teamId: string | null;
		userId: string | null;
		createdBy: string | null;
		id: string;
		currency: string;
		orderNumber?: string;
	},
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		description: string | null;
		product: { name: string; serviceType: string };
	},
	meta: HivelocityItemMetadata,
): Promise<
	| { ok: true; subscriptionId: string; rawResponse: unknown }
	| { ok: false; error: string; errorDetails?: Record<string, unknown> }
> {
	const deviceId = meta.hivelocityTargetDeviceId;
	const operatingSystemId = meta.hivelocityOsOptionId;
	if (!deviceId) {
		return { ok: false, error: "VPS reload metadata is missing the target device id." };
	}
	if (!operatingSystemId) {
		return { ok: false, error: "VPS reload metadata is missing the target operating system id." };
	}

	let rawResponse: unknown;
	try {
		rawResponse = await reloadHivelocityDevice({
			deviceId,
			operatingSystemId,
			publicSshKeyIds: meta.hivelocityPublicSshKeyIds,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false,
			error: `VPS OS reload failed: ${message}`,
			errorDetails: buildHivelocityErrorDetails(err),
		};
	}

	const now = new Date();
	const existing = await findSubscriptionByHivelocityDeviceId(deviceId, order.teamId);
	const reloadRecord = {
		at: now.toISOString(),
		niscOrderId: order.id,
		osName: meta.hivelocityOsName,
		osOptionId: operatingSystemId,
		osPriceUsd: meta.osPriceUsd ?? null,
	};

	if (existing) {
		const prevMeta =
			existing.metadata && typeof existing.metadata === "object"
				? (existing.metadata as Record<string, unknown>)
				: {};
		const reloads = Array.isArray(prevMeta.reloads) ? [...prevMeta.reloads] : [];

		const [updated] = await db
			.update(niscClientSubscription)
			.set({
				metadata: {
					...prevMeta,
					osName: meta.hivelocityOsName,
					lastReload: reloadRecord,
					reloads: [...reloads, reloadRecord],
					provisionMethod: "vps_reload_api",
				},
				updatedAt: now,
			})
			.where(eq(niscClientSubscription.id, existing.id))
			.returning();

		if (!updated) {
			return { ok: false, error: "Failed to update subscription after VPS OS reload." };
		}

		return { ok: true, subscriptionId: updated.id, rawResponse };
	}

	const subId = randomUUID();
	const subscriptionName =
		item.description?.trim() ||
		`${item.product.name} OS reload · device ${deviceId}`;

	const inserted = await db
		.insert(niscClientSubscription)
		.values({
			id: subId,
			name: subscriptionName,
			description: item.description ?? null,
			userId: order.userId,
			teamId: order.teamId,
			productId: item.productId,
			productPlanId: null,
			orderId: null,
			niscOrderId: order.id,
			subscribedBy: order.createdBy,
			status: "ACTIVE",
			subscriptionDate: now,
			billingCycle: (item.billingCycle as "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM") ?? null,
			pricingModel: "FIXED",
			agreedPrice: item.itemPrice,
			agreedCurrency: order.currency,
			agreedCost: null,
			agreedCostCurrency: "USD",
			providerCost: meta.osPriceUsd != null ? String(meta.osPriceUsd) : null,
			providerCostCurrency: "USD",
			agreedCommissionRate: null as any,
			agreedCommissionBase: null,
			serviceRefs: {
				hivelocityDeviceId: String(deviceId),
				hivelocityServiceType: "vps" as const,
			},
			metadata: {
				hivelocityDeviceId: deviceId,
				hivelocityProductId: meta.hivelocityProductId,
				locationName: meta.hivelocityLocationName,
				osName: meta.hivelocityOsName,
				hostname: meta.hivelocityHostname,
				period: meta.hivelocityPeriod,
				productType: "VPS",
				lastReload: reloadRecord,
				reloads: [reloadRecord],
				provisionedAt: now.toISOString(),
				provisionMethod: "vps_reload_api",
			},
		})
		.returning();

	const sub = inserted[0];
	if (!sub) {
		return { ok: false, error: "Failed to create subscription record after VPS OS reload." };
	}

	return { ok: true, subscriptionId: sub.id, rawResponse };
}

async function processHivelocityVpsReactivateOrderItem(
	order: {
		teamId: string | null;
		id: string;
	},
	item: {
		id: string;
		description: string | null;
	},
	meta: HivelocityItemMetadata,
): Promise<
	| { ok: true; subscriptionId: string; rawResponse: unknown }
	| { ok: false; error: string; errorDetails?: Record<string, unknown> }
> {
	const deviceId = meta.hivelocityTargetDeviceId;
	const subscriptionId = meta.niscSubscriptionId;
	if (!deviceId) {
		return { ok: false, error: "VPS reactivation metadata is missing the target device id." };
	}
	if (!subscriptionId) {
		return { ok: false, error: "VPS reactivation metadata is missing the subscription id." };
	}

	const existing = await findSubscriptionByHivelocityDeviceId(deviceId, order.teamId);
	if (!existing || existing.id !== subscriptionId) {
		return {
			ok: false,
			error: "Subscription is not linked to this VPS for your organization.",
		};
	}
	if (existing.status !== "SUSPENDED") {
		return { ok: false, error: "This VPS subscription is not suspended." };
	}

	let rawResponse: unknown;
	try {
		rawResponse = await applyHivelocityVpsReactivation({
			deviceId,
			subscriptionId,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false,
			error: `VPS reactivation failed: ${message}`,
			errorDetails: buildHivelocityErrorDetails(err),
		};
	}

	const now = new Date();
	const prevMeta =
		existing.metadata && typeof existing.metadata === "object"
			? (existing.metadata as Record<string, unknown>)
			: {};
	const reactivations = Array.isArray(prevMeta.reactivations) ? [...prevMeta.reactivations] : [];
	const record = {
		at: now.toISOString(),
		niscOrderId: order.id,
		amount: item.description ?? null,
	};

	await db
		.update(niscClientSubscription)
		.set({
			metadata: {
				...prevMeta,
				lastReactivation: record,
				reactivations: [...reactivations, record],
			},
			updatedAt: now,
		})
		.where(eq(niscClientSubscription.id, subscriptionId));

	return { ok: true, subscriptionId, rawResponse };
}

export async function processHivelocityOrderItem(
	order: {
		teamId: string | null;
		userId: string | null;
		createdBy: string | null;
		id: string;
		currency: string;
		orderNumber?: string;
	},
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		description: string | null;
		metadata: unknown;
		product: { name: string; serviceType: string };
	},
): Promise<
	| { ok: true; subscriptionId: string; rawResponse: unknown }
	| { ok: false; error: string; errorDetails?: Record<string, unknown> }
> {
	const metaResult = hivelocityItemMetadataSchema.safeParse(item.metadata);
	if (!metaResult.success) {
		return {
			ok: false,
			error: "Invalid Hivelocity provisioning metadata on order item.",
			errorDetails: { zodError: metaResult.error.flatten() },
		};
	}

	const meta: HivelocityItemMetadata = metaResult.data;

	if (meta.operation === "vps_upgrade") {
		return processHivelocityVpsUpgradeOrderItem(order, item, meta);
	}

	if (meta.operation === "vps_reload") {
		return processHivelocityVpsReloadOrderItem(order, item, meta);
	}

	if (meta.operation === "vps_reactivate") {
		return processHivelocityVpsReactivateOrderItem(order, item, meta);
	}

	if (meta.hivelocityPeriod === "hourly") {
		return {
			ok: false,
			error: "Hourly billing is not supported for customer orders.",
		};
	}

	const {
		hivelocityProductId,
		hivelocityLocationName,
		hivelocityOsName,
		hivelocityHostname,
		hivelocityPeriod,
		hivelocityOptionIds,
	} = meta;

	let deploymentResult;
	try {
		await assertHivelocityOptionIdsExclusive(hivelocityProductId, hivelocityOptionIds);
		deploymentResult = await provisionHivelocityViaDeployment({
			deploymentName: buildHivelocityDeploymentName(order.orderNumber ?? item.id),
			meta,
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			ok: false,
			error: `Hivelocity provisioning failed: ${message}`,
			errorDetails: buildHivelocityErrorDetails(err),
		};
	}

	const now = new Date();
	const subId = randomUUID();
	const subscriptionName = `${item.product.name} - ${hivelocityOsName} @ ${hivelocityLocationName}`;
	const hivelocityServiceType = resolveHivelocityServiceType(item.product.serviceType);
	const hivelocityOrderId =
		deploymentResult.orderId ??
		(deploymentResult.orderNumber ? Number(deploymentResult.orderNumber) : null);

	const inserted = await db
		.insert(niscClientSubscription)
		.values({
			id: subId,
			name: subscriptionName,
			description: item.description ?? null,
			userId: order.userId,
			teamId: order.teamId,
			productId: item.productId,
			productPlanId: null,
			orderId: null,
			niscOrderId: order.id,
			subscribedBy: order.createdBy,
			status: "ACTIVE",
			subscriptionDate: now,
			billingCycle: (item.billingCycle as "MONTHLY" | "YEARLY" | "BIENNIALLY" | "CUSTOM") ?? null,
			pricingModel: "FIXED",
			agreedPrice: item.itemPrice,
			agreedCurrency: order.currency,
			agreedCost: null,
			agreedCostCurrency: "USD",
			providerCost: meta.basePriceUsd != null ? String(meta.basePriceUsd) : null,
			providerCostCurrency: "USD",
			agreedCommissionRate: null as any,
			agreedCommissionBase: null,
			serviceRefs: deploymentResult.deviceId
				? {
						hivelocityDeviceId: String(deploymentResult.deviceId),
						hivelocityServiceType,
					}
				: null,
			metadata: {
				hivelocityDeploymentId: deploymentResult.deploymentId,
				hivelocityOrderId:
					hivelocityOrderId != null && Number.isFinite(hivelocityOrderId) ? hivelocityOrderId : null,
				hivelocityOrderNumber: deploymentResult.orderNumber,
				hivelocityDeviceId: deploymentResult.deviceId,
				hivelocityProductId,
				locationName: hivelocityLocationName,
				osName: hivelocityOsName,
				hostname: hivelocityHostname,
				period: hivelocityPeriod,
				optionIds: hivelocityOptionIds,
				osOptionId: meta.hivelocityOsOptionId ?? null,
				productType: meta.productType ?? null,
				provisionedAt: now.toISOString(),
				provisionMethod: "deployment_api",
			},
		})
		.returning();

	const sub = inserted[0];
	if (!sub) {
		throw new Error("Failed to create Nisc subscription for Hivelocity order.");
	}

	return {
		ok: true,
		subscriptionId: sub.id,
		rawResponse: deploymentResult.steps,
	};
}
