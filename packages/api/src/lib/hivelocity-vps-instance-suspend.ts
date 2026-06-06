/**
 * Agency suspend / reactivate for Hivelocity VPS instances.
 * - Panel: NISC subscription status SUSPENDED / ACTIVE (blocks customer self-service)
 * - Upstream: power off on suspend, boot on reactivate when we initiated the shutdown
 *
 * Hivelocity does not expose a reversible "pause billing" API. Powering off stops the
 * instance but monthly wholesale fees may still accrue until formal cancellation.
 */
import { TRPCError } from "@trpc/server";
import { db, eq } from "@npanel/db";
import { niscClientSubscription } from "@npanel/db/schema/products";
import { hivelocityRequest } from "./hivelocity-client";
import { fetchVpsPowerStatus, isVpsPoweredOff } from "./hivelocity-vps-upgrade";
import { getRedisClient } from "./redis";

const UPSTREAM_SUSPENDED_REF = "hivelocityUpstreamSuspended";

const VPS_POWER_ACTION_KEY = (deviceId: number) => `vps:power-action:${deviceId}`;

const isAgencyUserRole = (role: string | null | undefined) =>
	["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

async function setPendingPowerAction(
	deviceId: number,
	targetStatus: "ON" | "OFF",
	action: string,
): Promise<void> {
	const redis = getRedisClient();
	if (!redis) return;

	await redis
		.setex(
			VPS_POWER_ACTION_KEY(deviceId),
			600,
			JSON.stringify({
				targetStatus,
				action,
				timestamp: Date.now(),
			}),
		)
		.catch((e) => console.error("Redis set pending power action error:", e));
}

async function shutdownHivelocityDevice(deviceId: number): Promise<void> {
	const raw = await hivelocityRequest<unknown>(`/device/${deviceId}/power`, {
		method: "POST",
		query: { action: "shutdown" },
		requireApiKey: true,
	});

	if (raw && typeof raw === "object" && (raw as { success?: boolean }).success === false) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Hivelocity rejected the power-off request",
		});
	}

	await setPendingPowerAction(deviceId, "OFF", "off");
}

async function bootHivelocityDevice(deviceId: number): Promise<void> {
	const raw = await hivelocityRequest<unknown>(`/device/${deviceId}/power`, {
		method: "POST",
		query: { action: "boot" },
		requireApiKey: true,
	});

	if (raw && typeof raw === "object" && (raw as { success?: boolean }).success === false) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Hivelocity rejected the power-on request",
		});
	}

	await setPendingPowerAction(deviceId, "ON", "on");
}

function getLinkedHivelocityDeviceId(serviceRefs: unknown): string | null {
	if (!serviceRefs || typeof serviceRefs !== "object") return null;
	const id = (serviceRefs as Record<string, unknown>).hivelocityDeviceId;
	return id == null ? null : String(id);
}

async function loadLinkedSubscription(subscriptionId: string, deviceId: number) {
	const [subscription] = await db
		.select()
		.from(niscClientSubscription)
		.where(eq(niscClientSubscription.id, subscriptionId))
		.limit(1);

	if (!subscription) {
		throw new TRPCError({ code: "NOT_FOUND", message: "Subscription not found" });
	}

	const linkedDeviceId = getLinkedHivelocityDeviceId(subscription.serviceRefs);
	if (!linkedDeviceId || linkedDeviceId !== String(deviceId)) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Subscription is not linked to this VPS device",
		});
	}

	return subscription;
}

export async function suspendHivelocityVpsInstance(params: {
	deviceId: number;
	subscriptionId: string;
	userId: string;
	role: string | null | undefined;
}): Promise<{ upstreamPoweredOff: boolean }> {
	if (!isAgencyUserRole(params.role)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only agency staff can suspend VPS instances",
		});
	}

	const subscription = await loadLinkedSubscription(params.subscriptionId, params.deviceId);
	if (subscription.status === "SUSPENDED") {
		return { upstreamPoweredOff: false };
	}

	const powerStatus = await fetchVpsPowerStatus(params.deviceId);
	let upstreamPoweredOff = false;
	if (!isVpsPoweredOff(powerStatus)) {
		await shutdownHivelocityDevice(params.deviceId);
		upstreamPoweredOff = true;
	}

	const existingRefs =
		subscription.serviceRefs && typeof subscription.serviceRefs === "object"
			? { ...(subscription.serviceRefs as Record<string, string | string[]>) }
			: {};

	const nextRefs = { ...existingRefs };
	if (upstreamPoweredOff) {
		nextRefs[UPSTREAM_SUSPENDED_REF] = "true";
	} else {
		delete nextRefs[UPSTREAM_SUSPENDED_REF];
	}

	await db
		.update(niscClientSubscription)
		.set({
			status: "SUSPENDED",
			serviceRefs: nextRefs,
			updatedAt: new Date(),
		})
		.where(eq(niscClientSubscription.id, params.subscriptionId));

	return { upstreamPoweredOff };
}

export async function applyHivelocityVpsReactivation(params: {
	deviceId: number;
	subscriptionId: string;
}): Promise<{ upstreamPoweredOn: boolean }> {
	const subscription = await loadLinkedSubscription(params.subscriptionId, params.deviceId);
	if (subscription.status === "ACTIVE") {
		return { upstreamPoweredOn: false };
	}

	const existingRefs =
		subscription.serviceRefs && typeof subscription.serviceRefs === "object"
			? { ...(subscription.serviceRefs as Record<string, string | string[]>) }
			: {};

	const shouldBoot = existingRefs[UPSTREAM_SUSPENDED_REF] === "true";
	let upstreamPoweredOn = false;

	if (shouldBoot) {
		const powerStatus = await fetchVpsPowerStatus(params.deviceId);
		if (!isVpsPoweredOff(powerStatus)) {
			delete existingRefs[UPSTREAM_SUSPENDED_REF];
		} else {
			await bootHivelocityDevice(params.deviceId);
			upstreamPoweredOn = true;
			delete existingRefs[UPSTREAM_SUSPENDED_REF];
		}
	}

	await db
		.update(niscClientSubscription)
		.set({
			status: "ACTIVE",
			serviceRefs: existingRefs,
			updatedAt: new Date(),
		})
		.where(eq(niscClientSubscription.id, params.subscriptionId));

	return { upstreamPoweredOn };
}

export async function reactivateHivelocityVpsInstance(params: {
	deviceId: number;
	subscriptionId: string;
	userId: string;
	role: string | null | undefined;
}): Promise<{ upstreamPoweredOn: boolean }> {
	if (!isAgencyUserRole(params.role)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Only agency staff can reactivate VPS instances",
		});
	}

	return applyHivelocityVpsReactivation({
		deviceId: params.deviceId,
		subscriptionId: params.subscriptionId,
	});
}
