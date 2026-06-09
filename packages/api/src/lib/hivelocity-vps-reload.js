import { hivelocityRequest } from "./hivelocity-client";
/**
 * POST /device/{deviceId}/reload - device must be powered off.
 * @see https://developers.hivelocity.net/reference/post_device_reload_resource.md
 */
export async function reloadHivelocityDevice(input) {
    const body = {
        operatingSystemId: input.operatingSystemId,
    };
    if (input.publicSshKeyIds?.length) {
        body.publicSshKeyIds = input.publicSshKeyIds;
    }
    if (input.script?.trim()) {
        body.script = input.script.trim();
    }
    return hivelocityRequest(`/device/${input.deviceId}/reload`, {
        method: "POST",
        body,
        requireApiKey: true,
    });
}
