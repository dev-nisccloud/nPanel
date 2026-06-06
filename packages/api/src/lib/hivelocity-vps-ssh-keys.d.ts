export type HivelocitySshKey = {
    sshKeyId: number;
    name: string;
    publicKey: string;
};
export declare function normalizeSshKeyList(raw: unknown): HivelocitySshKey[];
export declare function assertValidSshPublicKey(publicKey: string): void;
export declare function listHivelocitySshKeys(): Promise<HivelocitySshKey[]>;
export declare function createHivelocitySshKey(name: string, publicKey: string): Promise<HivelocitySshKey>;
export declare function deleteHivelocitySshKey(sshKeyId: number): Promise<void>;
/** VPS catalog product for PUT /vps/{deviceId} — not the generic /device/ productId. */
export declare function resolveVpsCurrentProductId(deviceId: number): Promise<number>;
/** Run over an existing SSH session (Terminal tab) when provider PUT deploy is unavailable. */
export declare function buildAuthorizedKeysInstallScript(publicKeys: string[]): string;
export declare function updateVpsDeployedSshKeys(deviceId: number, sshKeyIds: number[]): Promise<unknown>;
export declare function fingerprintSshPublicKey(publicKey: string): string;
