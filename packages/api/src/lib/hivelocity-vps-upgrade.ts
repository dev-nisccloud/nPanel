/**
 * Hivelocity VPS in-place upgrade (scale up).
 * @see https://developers.hivelocity.net/docs/vps-device-management
 * @see https://developers.hivelocity.net/reference/put_vps_id_resource
 *
 * Requirements (official):
 * - PUT /vps/{deviceId} with body `{ productId: number, sshKeyIds?: number[] }`
 * - Instance must be powered off before the change
 * - Upgrades only (no downgrades); data is preserved; additional wholesale charges apply
 */
import { hivelocityRequest } from "./hivelocity-client";

function normalizePowerStatus(raw: unknown): string {
	if (!raw || typeof raw !== "object") {
		return String(raw ?? "").toLowerCase();
	}
	const ps = (raw as { powerStatus?: unknown; status?: unknown }).powerStatus ?? (raw as { status?: unknown }).status;
	if (ps && typeof ps === "object" && "status" in (ps as object)) {
		return String((ps as { status?: unknown }).status ?? "").toLowerCase();
	}
	return String(ps ?? "").toLowerCase();
}

export function isVpsPoweredOff(powerStatus: string): boolean {
	const s = powerStatus.toLowerCase();
	return ["off", "stopped", "inactive", "shutdown", "powered off"].includes(s);
}

export async function fetchVpsPowerStatus(deviceId: number): Promise<string> {
	const raw = await hivelocityRequest<unknown>(`/device/${deviceId}/power`, { requireApiKey: true });
	return normalizePowerStatus(raw);
}

export async function assertVpsPoweredOffForUpgrade(deviceId: number): Promise<void> {
	const status = await fetchVpsPowerStatus(deviceId);
	if (!isVpsPoweredOff(status)) {
		throw new Error(
			"VPS must be powered off before upgrading. Shut down the instance from the overview tab, wait until it is off, then retry.",
		);
	}
}

export async function upgradeHivelocityVpsInstance(
	deviceId: number,
	productId: number,
): Promise<unknown> {
	await assertVpsPoweredOffForUpgrade(deviceId);
	return hivelocityRequest<unknown>(`/vps/${deviceId}`, {
		method: "PUT",
		body: { productId },
		requireApiKey: true,
	});
}
