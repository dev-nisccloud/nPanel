/**
 * Nisc order processor branch for upgrading an existing subscription after payment.
 * Plesk hosting/email/wordpress: official switch-subscription, then update local settings.
 * Other catalog services: update the existing nisc_client_subscription in place.
 */
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { hostingPlan, hostingSubscription } from "@npanel/db/schema/hosting";
import {
	niscClientSubscription,
	niscClientSubscriptionActivityLog,
	niscProductPlan,
} from "@npanel/db/schema/products";
import { agreedPriceIncVatFromOrderLine } from "./convert-price";
import { niscLog } from "./nisc-order-logger";
import {
	resolvePleskServicePlanGuid,
	switchPleskSubscriptionPlan,
} from "./plesk/switch-subscription";
import {
	getPleskWebspaceId,
	isHigherCatalogPlan,
	PLESK_UPGRADE_SERVICE_TYPES,
	resolveCurrentCatalogPlanFromDb,
	toCatalogPlanIdentity,
} from "./subscription-upgrade";

export const NISC_ORDER_UPGRADE_DESCRIPTION = "upgrade";

type UpgradeItemMeta = {
	upgradeFromSubscriptionId?: unknown;
	existingSubscriptionId?: unknown;
};

export function isUpgradeOrderItem(item: {
	description: string | null;
	metadata: unknown;
}): boolean {
	if (item.description?.trim().toLowerCase() === NISC_ORDER_UPGRADE_DESCRIPTION) {
		return true;
	}
	const meta = parseItemMeta(item.metadata);
	return (
		typeof meta.upgradeFromSubscriptionId === "string" &&
		Boolean(meta.upgradeFromSubscriptionId.trim())
	);
}

function parseItemMeta(metadata: unknown): UpgradeItemMeta {
	if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
	return metadata as UpgradeItemMeta;
}

function resolveUpgradeSubscriptionId(item: {
	description: string | null;
	metadata: unknown;
}): string | null {
	const meta = parseItemMeta(item.metadata);
	if (typeof meta.upgradeFromSubscriptionId === "string" && meta.upgradeFromSubscriptionId.trim()) {
		return meta.upgradeFromSubscriptionId.trim();
	}
	if (typeof meta.existingSubscriptionId === "string" && meta.existingSubscriptionId.trim()) {
		return meta.existingSubscriptionId.trim();
	}
	return null;
}

export async function processNiscOrderUpgradeItem(params: {
	order: {
		id: string;
		userId: string | null;
		teamId: string | null;
		createdBy: string | null;
		currency: string;
	};
	item: {
		id: string;
		productId: string;
		productPlanId: string | null;
		billingCycle: string | null;
		itemPrice: string;
		itemSubtotal: string;
		description: string | null;
		metadata: unknown;
		primaryDomain: string | null;
		product: { name: string; serviceType: string };
		productPlan: {
			name: string;
			pricingModel: string;
			price: string | null;
			currency: string | null;
			cost: string | null;
			costCurrency: string | null;
			commissionRate: unknown;
			commissionBase: string | null;
			hostingType: string | null;
			pleskServicePlanId: string | null;
			billingCycle: string | null;
		} | null;
	};
	serviceType: string;
}): Promise<{ subscriptionId: string; pleskSwitched: boolean; rawResponse?: unknown }> {
	const { order, item, serviceType } = params;
	const subscriptionId = resolveUpgradeSubscriptionId(item);
	if (!subscriptionId) {
		throw new Error("Upgrade order item is missing upgradeFromSubscriptionId");
	}
	if (!item.productPlanId || !item.productPlan) {
		throw new Error("Upgrade order item requires a product plan");
	}

	const existing = await db.query.niscClientSubscription.findFirst({
		where: eq(niscClientSubscription.id, subscriptionId),
		with: { productPlan: true },
	});
	if (!existing) {
		throw new Error("Subscription to upgrade was not found");
	}
	if (existing.productId !== item.productId) {
		throw new Error("Upgrade plan does not belong to this subscription's product");
	}

	const [targetPlan] = await db
		.select()
		.from(niscProductPlan)
		.where(eq(niscProductPlan.id, item.productPlanId))
		.limit(1);
	if (!targetPlan) {
		throw new Error("Upgrade target plan was not found");
	}

	const siblingPlans = await db
		.select()
		.from(niscProductPlan)
		.where(eq(niscProductPlan.productId, existing.productId));
	const currentCatalogPlan = await resolveCurrentCatalogPlanFromDb(siblingPlans, existing);
	if (!isHigherCatalogPlan(toCatalogPlanIdentity(targetPlan), currentCatalogPlan)) {
		throw new Error("Downgrades are not allowed. Choose a higher plan.");
	}

	const webspaceId = getPleskWebspaceId(existing);
	let pleskSwitched = false;
	let rawResponse: unknown;

	if (PLESK_UPGRADE_SERVICE_TYPES.has(serviceType) && webspaceId != null) {
		if (!targetPlan.pleskServicePlanId?.trim()) {
			throw new Error("The selected plan is not linked to a Plesk service plan");
		}
		const planGuid = await resolvePleskServicePlanGuid(targetPlan.pleskServicePlanId);
		rawResponse = await switchPleskSubscriptionPlan({ webspaceId, planGuid });
		pleskSwitched = true;
		await niscLog("processor_upgrade_plesk_switched", {
			niscOrderId: order.id,
			orderItemId: item.id,
			subscriptionId,
			webspaceId,
			planGuid,
		});
	}

	const now = new Date();
	const nextBillingCycle = item.billingCycle ?? targetPlan.billingCycle ?? existing.billingCycle;
	await db
		.update(niscClientSubscription)
		.set({
			productPlanId: targetPlan.id,
			agreedPrice: agreedPriceIncVatFromOrderLine(item),
			agreedCurrency: order.currency ?? targetPlan.currency ?? existing.agreedCurrency ?? "KES",
			agreedCost: targetPlan.cost ?? existing.agreedCost,
			agreedCostCurrency: targetPlan.costCurrency ?? existing.agreedCostCurrency,
			pricingModel: targetPlan.pricingModel ?? existing.pricingModel,
			billingCycle: nextBillingCycle,
			hostingType: targetPlan.hostingType ?? existing.hostingType,
			agreedCommissionRate:
				targetPlan.commissionRate != null
					? String(targetPlan.commissionRate)
					: existing.agreedCommissionRate,
			agreedCommissionBase: targetPlan.commissionBase ?? existing.agreedCommissionBase,
			niscOrderId: order.id,
			upgradedAt: now,
			updatedAt: now,
			status:
				existing.status === "PENDING" ||
				existing.status === "EXPIRED" ||
				existing.status === "SUSPENDED"
					? "ACTIVE"
					: existing.status,
		})
		.where(eq(niscClientSubscription.id, existing.id));

	if (existing.hostingSubscriptionId) {
		const hostingPatch: Record<string, unknown> = {
			niscPrice: agreedPriceIncVatFromOrderLine(item),
			niscCurrency: order.currency ?? existing.agreedCurrency ?? "KES",
			updatedAt: now,
		};
		if (nextBillingCycle && nextBillingCycle !== "ONE_TIME") {
			hostingPatch.billingCycle = nextBillingCycle;
		}
		if (targetPlan.hostingType) hostingPatch.hostingType = targetPlan.hostingType;
		if (targetPlan.pleskServicePlanId) {
			const [legacyPlan] = await db
				.select({ id: hostingPlan.id })
				.from(hostingPlan)
				.where(eq(hostingPlan.pleskServicePlanId, targetPlan.pleskServicePlanId))
				.limit(1);
			if (legacyPlan) hostingPatch.hostingPlanId = legacyPlan.id;
		}
		await db
			.update(hostingSubscription)
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			.set(hostingPatch as any)
			.where(eq(hostingSubscription.id, existing.hostingSubscriptionId));
	}

	const actorId = order.createdBy ?? order.userId;
	if (actorId) {
		await db.insert(niscClientSubscriptionActivityLog).values({
			id: crypto.randomUUID(),
			subscriptionId: existing.id,
			userId: actorId,
			action: "UPGRADE",
			description: `Upgraded from ${existing.productPlan?.name ?? "current plan"} to ${targetPlan.name}`,
			metadata: {
				niscOrderId: order.id,
				orderItemId: item.id,
				previousProductPlanId: existing.productPlanId,
				newProductPlanId: targetPlan.id,
				pleskSwitched,
			},
			ipAddress: null,
			userAgent: null,
		});
	}

	return { subscriptionId: existing.id, pleskSwitched, rawResponse };
}
