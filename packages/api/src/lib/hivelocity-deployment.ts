/**
 * Hivelocity Deployment API provisioning (official multi-step flow).
 * @see https://developers.hivelocity.net/reference/post_deployment_resource
 * @see https://developers.hivelocity.net/reference/put_deployment_id_resource
 * @see https://developers.hivelocity.net/reference/post_deployment_id_resource
 *
 * Step 3 `DeploymentStart` OpenAPI: `billingInfo` is required; `script` is optional.
 * Customer M-Pesa is handled in nPanel - billingInfo is Nisc's wholesale payment method on Hivelocity.
 */
import { hivelocityRequest } from "./hivelocity-client";
import { niscLog } from "./nisc-order-logger";
import type { HivelocityItemMetadata } from "../routers/nisc-service-orders-schemas";

type HivelocityBillingInfoRow = {
	id?: number;
	default?: boolean;
	status?: number;
};

type HivelocityDeployment = {
	deploymentId?: number;
	deploymentName?: string;
	orderNumber?: string;
	startedProvisioning?: boolean;
	price?: number;
	deploymentConfiguration?: unknown[];
};

export type HivelocityDeploymentProvisionInput = {
	deploymentName: string;
	meta: HivelocityItemMetadata;
	/** Optional cloud-init / post-install script for step 3 (never required). */
	script?: string;
};

export type HivelocityDeploymentProvisionResult = {
	deploymentId: number;
	orderNumber: string | null;
	orderId: number | null;
	deviceId: number | null;
	steps: {
		create: unknown;
		configure: unknown;
		start: unknown;
		deploymentStatus: unknown;
		devices: unknown;
	};
};

let cachedBillingInfoId: number | null = null;

/** Resolve wholesale billingInfo id (env override or default payment method on the Hivelocity account). */
export async function resolveHivelocityBillingInfoId(): Promise<number> {
	if (cachedBillingInfoId != null) return cachedBillingInfoId;

	const fromEnv = process.env.HIVELOCITY_BILLING_INFO_ID?.trim();
	if (fromEnv) {
		const parsed = Number(fromEnv);
		if (Number.isFinite(parsed) && parsed > 0) {
			cachedBillingInfoId = parsed;
			return parsed;
		}
	}

	const raw = await hivelocityRequest<unknown>("/billing-info/", { requireApiKey: true });
	const rows = Array.isArray(raw) ? (raw as HivelocityBillingInfoRow[]) : [];
	const active = rows.filter((r) => r.id != null && r.status !== 0);
	const picked =
		active.find((r) => r.default === true) ??
		active[0] ??
		rows.find((r) => r.id != null);

	if (!picked?.id) {
		throw new Error(
			"No Hivelocity billingInfo found. Add a payment method on the Hivelocity account or set HIVELOCITY_BILLING_INFO_ID.",
		);
	}

	cachedBillingInfoId = picked.id;
	return picked.id;
}

function parseDeployment(raw: unknown): HivelocityDeployment {
	if (!raw || typeof raw !== "object") return {};
	return raw as HivelocityDeployment;
}

function parseOrderIdFromOrderNumber(orderNumber: string | null | undefined): number | null {
	if (!orderNumber?.trim()) return null;
	const asNum = Number(orderNumber.trim());
	return Number.isFinite(asNum) && asNum > 0 ? asNum : null;
}

async function fetchDevicesForOrder(orderId: number): Promise<unknown> {
	return hivelocityRequest<unknown>("/device/", {
		requireApiKey: true,
		query: { orderId },
	});
}

function extractDeviceIdFromDeviceList(
	raw: unknown,
	expectedHostname?: string | null,
): number | null {
	if (!Array.isArray(raw) || raw.length === 0) return null;

	const rows = raw.filter((row) => row && typeof row === "object") as Record<string, unknown>[];
	if (!rows.length) return null;

	const hostnameNeedle = expectedHostname?.trim().toLowerCase();
	if (hostnameNeedle) {
		const byHostname = rows.find((obj) => {
			const host = String(obj.hostname ?? obj.name ?? "").trim().toLowerCase();
			return host === hostnameNeedle;
		});
		if (byHostname) {
			const id = Number(byHostname.deviceId ?? byHostname.id);
			if (Number.isFinite(id) && id > 0) return id;
		}
		return null;
	}

	const first = rows[0];
	const id = Number(first.deviceId ?? first.id);
	return Number.isFinite(id) && id > 0 ? id : null;
}

async function waitForDeploymentStart(
	deploymentId: number,
	maxAttempts = 12,
	delayMs = 5000,
): Promise<HivelocityDeployment> {
	let last: HivelocityDeployment = {};
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const raw = await hivelocityRequest<unknown>(`/deploy/${deploymentId}`, { requireApiKey: true });
		last = parseDeployment(raw);
		if (last.startedProvisioning) return last;
		if (attempt < maxAttempts - 1) {
			await new Promise((r) => setTimeout(r, delayMs));
		}
	}
	return last;
}

async function waitForDeviceId(
	orderId: number,
	expectedHostname?: string | null,
	maxAttempts = 12,
	delayMs = 5000,
): Promise<number | null> {
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const devicesRaw = await fetchDevicesForOrder(orderId);
		const deviceId = extractDeviceIdFromDeviceList(devicesRaw, expectedHostname);
		if (deviceId != null) return deviceId;
		if (attempt < maxAttempts - 1) {
			await new Promise((r) => setTimeout(r, delayMs));
		}
	}
	return null;
}

async function findDeploymentByName(deploymentName: string): Promise<HivelocityDeployment | null> {
	const raw = await hivelocityRequest<unknown>("/deploy/", { requireApiKey: true });
	const rows = Array.isArray(raw) ? raw : [];
	const needle = deploymentName.trim().toLowerCase();
	for (const row of rows) {
		const parsed = parseDeployment(row);
		const name = parsed.deploymentName?.trim().toLowerCase();
		if (name && name === needle && parsed.deploymentId != null && parsed.deploymentId > 0) {
			return parsed;
		}
	}
	return null;
}

export async function provisionHivelocityViaDeployment(
	input: HivelocityDeploymentProvisionInput,
): Promise<HivelocityDeploymentProvisionResult> {
	const { deploymentName, meta, script } = input;
	const billingInfo = await resolveHivelocityBillingInfoId();

	// Idempotent retry: reuse an existing deployment with this deterministic name
	// (crash after provider start / before nPanel subscription write).
	let createRaw: unknown = null;
	let configureRaw: unknown = null;
	let startRaw: unknown = null;
	let created = (await findDeploymentByName(deploymentName)) ?? {};
	let deploymentId = created.deploymentId;

	if (!deploymentId || deploymentId <= 0) {
		createRaw = await hivelocityRequest<unknown>("/deploy/", {
			method: "POST",
			requireApiKey: true,
			query: { deploymentName },
		});
		created = parseDeployment(createRaw);
		deploymentId = created.deploymentId;
		if (!deploymentId || deploymentId <= 0) {
			// Race: another worker created it — adopt that deployment.
			const raced = await findDeploymentByName(deploymentName);
			deploymentId = raced?.deploymentId;
			created = raced ?? created;
			if (!deploymentId || deploymentId <= 0) {
				throw new Error("Hivelocity deployment create response missing deploymentId.");
			}
		}
	} else {
		createRaw = { reused: true, deployment: created };
		await niscLog("hivelocity_deployment_reused", {
			deploymentId,
			deploymentName,
			startedProvisioning: Boolean(created.startedProvisioning),
		});
	}

	const alreadyStarted = Boolean(created.startedProvisioning) || Boolean(created.orderNumber?.trim());

	// OS is set via `operatingSystem`; `options` is add-ons only (including control panels).
	const optionIds = [...meta.hivelocityOptionIds];

	if (!alreadyStarted) {
		const configureBody: Record<string, unknown> = {
			productId: meta.hivelocityProductId,
			locationCode: meta.hivelocityLocationName,
			operatingSystem: meta.hivelocityOsName,
			hostnames: [meta.hivelocityHostname],
			billingPeriod: meta.hivelocityPeriod,
			quantity: 1,
			...(optionIds.length > 0 ? { options: optionIds } : {}),
		};

		configureRaw = await hivelocityRequest<unknown>(`/deploy/${deploymentId}`, {
			method: "PUT",
			requireApiKey: true,
			body: configureBody,
		});

		const startBody: Record<string, unknown> = { billingInfo };
		if (script?.trim()) {
			startBody.script = script.trim();
		}

		startRaw = await hivelocityRequest<unknown>(`/deploy/${deploymentId}`, {
			method: "POST",
			requireApiKey: true,
			body: startBody,
		});

		await niscLog("hivelocity_deployment_started", {
			deploymentId,
			deploymentName,
			billingInfo,
			hasScript: Boolean(script?.trim()),
			optionCount: optionIds.length,
		});
	} else {
		configureRaw = { skipped: true, reason: "deployment_already_started" };
		startRaw = { skipped: true, reason: "deployment_already_started" };
	}

	const deploymentStatus = await waitForDeploymentStart(deploymentId);
	const orderNumber =
		deploymentStatus.orderNumber?.trim() || created.orderNumber?.trim() || null;
	const orderId = parseOrderIdFromOrderNumber(orderNumber);

	let deviceId: number | null = null;
	let devicesRaw: unknown = null;
	if (orderId != null) {
		devicesRaw = await fetchDevicesForOrder(orderId);
		deviceId = extractDeviceIdFromDeviceList(devicesRaw, meta.hivelocityHostname);
		if (deviceId == null) {
			deviceId = await waitForDeviceId(orderId, meta.hivelocityHostname);
			if (deviceId != null) {
				devicesRaw = await fetchDevicesForOrder(orderId);
			}
		}
	}

	return {
		deploymentId,
		orderNumber,
		orderId,
		deviceId,
		steps: {
			create: createRaw,
			configure: configureRaw,
			start: startRaw,
			deploymentStatus,
			devices: devicesRaw,
		},
	};
}

export function clearHivelocityBillingInfoCache(): void {
	cachedBillingInfoId = null;
}
