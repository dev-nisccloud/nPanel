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
function normalizePowerStatus(raw) {
    if (!raw || typeof raw !== "object") {
        return String(raw ?? "").toLowerCase();
    }
    const ps = raw.powerStatus ?? raw.status;
    if (ps && typeof ps === "object" && "status" in ps) {
        return String(ps.status ?? "").toLowerCase();
    }
    return String(ps ?? "").toLowerCase();
}
export function isVpsPoweredOff(powerStatus) {
    const s = powerStatus.toLowerCase();
    return ["off", "stopped", "inactive", "shutdown", "powered off"].includes(s);
}
export async function fetchVpsPowerStatus(deviceId) {
    const raw = await hivelocityRequest(`/device/${deviceId}/power`, { requireApiKey: true });
    return normalizePowerStatus(raw);
}
export async function assertVpsPoweredOffForUpgrade(deviceId) {
    const status = await fetchVpsPowerStatus(deviceId);
    if (!isVpsPoweredOff(status)) {
        throw new Error("VPS must be powered off before upgrading. Shut down the instance from the overview tab, wait until it is off, then retry.");
    }
}
export async function upgradeHivelocityVpsInstance(deviceId, productId) {
    await assertVpsPoweredOffForUpgrade(deviceId);
    return hivelocityRequest(`/vps/${deviceId}`, {
        method: "PUT",
        body: { productId },
        requireApiKey: true,
    });
}
