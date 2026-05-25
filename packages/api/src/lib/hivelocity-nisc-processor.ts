/**
 * Hivelocity provisioning for Nisc orders via the official Deployment API.
 */
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";

import { db } from "@npanel/db";
import { niscClientSubscription } from "@npanel/db/schema/products";
import {
	hivelocityItemMetadataSchema,
	type HivelocityItemMetadata,
} from "../routers/nisc-service-orders-schemas";
import { provisionHivelocityViaDeployment } from "./hivelocity-deployment";
import { assertHivelocityOptionIdsExclusive } from "./hivelocity-option-validation";

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
	const subscriptionName = `${item.product.name} — ${hivelocityOsName} @ ${hivelocityLocationName}`;
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
