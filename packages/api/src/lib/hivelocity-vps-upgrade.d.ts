export declare function isVpsPoweredOff(powerStatus: string): boolean;
export declare function fetchVpsPowerStatus(deviceId: number): Promise<string>;
export declare function assertVpsPoweredOffForUpgrade(deviceId: number): Promise<void>;
export declare function upgradeHivelocityVpsInstance(deviceId: number, productId: number): Promise<unknown>;
