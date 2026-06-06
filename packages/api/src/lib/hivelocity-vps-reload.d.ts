export type ReloadHivelocityDeviceInput = {
    deviceId: number;
    operatingSystemId: number;
    publicSshKeyIds?: number[];
    script?: string;
};
/**
 * POST /device/{deviceId}/reload — device must be powered off.
 * @see https://developers.hivelocity.net/reference/post_device_reload_resource.md
 */
export declare function reloadHivelocityDevice(input: ReloadHivelocityDeviceInput): Promise<unknown>;
