import type { HivelocityItemMetadata } from "../routers/nisc-service-orders-schemas";
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
/** Resolve wholesale billingInfo id (env override or default payment method on the Hivelocity account). */
export declare function resolveHivelocityBillingInfoId(): Promise<number>;
export declare function provisionHivelocityViaDeployment(input: HivelocityDeploymentProvisionInput): Promise<HivelocityDeploymentProvisionResult>;
export declare function clearHivelocityBillingInfoCache(): void;
