import { hivelocityRequest } from "./hivelocity-client";

export type ReloadHivelocityDeviceInput = {
	deviceId: number;
	operatingSystemId: number;
	publicSshKeyIds?: number[];
	script?: string;
};

/**
 * POST /device/{deviceId}/reload - device must be powered off.
 * @see https://developers.hivelocity.net/reference/post_device_reload_resource.md
 */
export async function reloadHivelocityDevice(
	input: ReloadHivelocityDeviceInput,
): Promise<unknown> {
	const body: Record<string, unknown> = {
		operatingSystemId: input.operatingSystemId,
	};
	if (input.publicSshKeyIds?.length) {
		body.publicSshKeyIds = input.publicSshKeyIds;
	}
	if (input.script?.trim()) {
		body.script = input.script.trim();
	}
	return hivelocityRequest<unknown>(`/device/${input.deviceId}/reload`, {
		method: "POST",
		body,
		requireApiKey: true,
	});
}
