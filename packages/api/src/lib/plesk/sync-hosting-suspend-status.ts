import { eq, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { hostingSubscription } from "@npanel/db/schema/hosting";
import {
	niscClientSubscription,
	niscClientSubscriptionActivityLog,
} from "@npanel/db/schema/products";
import { serviceSubscription } from "@npanel/db/schema/service-subscriptions";

export type LocalHostingOperationalAction = "suspend" | "unsuspend";

function isPast(date: Date | null | undefined): boolean {
	return !!date && date.getTime() < Date.now();
}

function resolveLocalStatus(params: {
	action: LocalHostingOperationalAction;
	currentStatus: string | null | undefined;
	expiryDate?: Date | null;
}): string | null {
	if (params.currentStatus === "CANCELLED") return null;

	if (params.action === "suspend") return "SUSPENDED";

	if (isPast(params.expiryDate)) return "EXPIRED";
	return "ACTIVE";
}

async function findLinkedNiscSubscription(pleskId: number) {
	const idStr = String(pleskId);
	const [direct] = await db
		.select({
			id: niscClientSubscription.id,
			status: niscClientSubscription.status,
			expiryDate: niscClientSubscription.expiryDate,
			hostingSubscriptionId: niscClientSubscription.hostingSubscriptionId,
		})
		.from(niscClientSubscription)
		.where(
			or(
				eq(niscClientSubscription.pleskFilterId, idStr),
				sql`(${niscClientSubscription.serviceRefs}->>'pleskSubscriptionId') = ${idStr}`,
			),
		)
		.limit(1);
	if (direct) return direct;

	const [viaHosting] = await db
		.select({
			id: niscClientSubscription.id,
			status: niscClientSubscription.status,
			expiryDate: niscClientSubscription.expiryDate,
			hostingSubscriptionId: niscClientSubscription.hostingSubscriptionId,
		})
		.from(niscClientSubscription)
		.innerJoin(
			hostingSubscription,
			eq(niscClientSubscription.hostingSubscriptionId, hostingSubscription.id),
		)
		.where(eq(hostingSubscription.pleskFilterId, idStr))
		.limit(1);
	return viaHosting ?? null;
}

/**
 * After Plesk webspace suspend/unsuspend succeeds, mirror status onto local rows.
 * Missing local rows are ignored so Plesk-only webspaces still succeed.
 */
export async function syncLocalHostingStatusAfterPlesk(params: {
	pleskSubscriptionId: number;
	pleskStatus: number;
	action: LocalHostingOperationalAction;
	userId?: string | null;
}): Promise<{ niscSubscriptionId: string | null; hostingSubscriptionId: string | null }> {
	const idStr = String(params.pleskSubscriptionId);
	const now = new Date();
	const linked = await findLinkedNiscSubscription(params.pleskSubscriptionId);

	if (linked) {
		const nextStatus = resolveLocalStatus({
			action: params.action,
			currentStatus: linked.status,
			expiryDate: linked.expiryDate,
		});

		if (nextStatus) {
			await db
				.update(niscClientSubscription)
				.set({
					status: nextStatus,
					updatedAt: now,
				})
				.where(eq(niscClientSubscription.id, linked.id));
		}

		if (params.userId) {
			await db.insert(niscClientSubscriptionActivityLog).values({
				id: crypto.randomUUID(),
				subscriptionId: linked.id,
				userId: params.userId,
				action: params.action === "suspend" ? "SUSPEND" : "UNSUSPEND",
				description:
					params.action === "suspend"
						? "Hosting subscription suspended in Plesk"
						: "Hosting subscription reactivated in Plesk",
				metadata: {
					pleskSubscriptionId: idStr,
					pleskStatus: params.pleskStatus,
					previousStatus: linked.status,
					nextStatus,
				},
				ipAddress: null,
				userAgent: null,
			});
		}
	}

	const hostingById = new Map<
		string,
		{ id: string; status: string; expiryDate: Date | null }
	>();

	if (linked?.hostingSubscriptionId) {
		const [linkedHosting] = await db
			.select({
				id: hostingSubscription.id,
				status: hostingSubscription.status,
				expiryDate: hostingSubscription.expiryDate,
			})
			.from(hostingSubscription)
			.where(eq(hostingSubscription.id, linked.hostingSubscriptionId))
			.limit(1);
		if (linkedHosting) hostingById.set(linkedHosting.id, linkedHosting);
	}

	const [hostingByPlesk] = await db
		.select({
			id: hostingSubscription.id,
			status: hostingSubscription.status,
			expiryDate: hostingSubscription.expiryDate,
		})
		.from(hostingSubscription)
		.where(eq(hostingSubscription.pleskFilterId, idStr))
		.limit(1);
	if (hostingByPlesk) hostingById.set(hostingByPlesk.id, hostingByPlesk);

	for (const row of hostingById.values()) {
		const nextStatus = resolveLocalStatus({
			action: params.action,
			currentStatus: row.status,
			expiryDate: row.expiryDate,
		});

		await db
			.update(hostingSubscription)
			.set({
				...(nextStatus ? { status: nextStatus } : {}),
				pleskStatus: params.pleskStatus,
				updatedAt: now,
			})
			.where(eq(hostingSubscription.id, row.id));

		if (nextStatus) {
			await db
				.update(serviceSubscription)
				.set({
					status: nextStatus,
					updatedAt: now,
				})
				.where(eq(serviceSubscription.hostingSubscriptionId, row.id));
		}
	}

	return {
		niscSubscriptionId: linked?.id ?? null,
		hostingSubscriptionId:
			hostingByPlesk?.id ?? linked?.hostingSubscriptionId ?? null,
	};
}
