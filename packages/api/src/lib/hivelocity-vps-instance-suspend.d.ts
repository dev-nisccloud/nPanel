export declare function suspendHivelocityVpsInstance(params: {
    deviceId: number;
    subscriptionId: string;
    userId: string;
    role: string | null | undefined;
}): Promise<{
    upstreamPoweredOff: boolean;
}>;
export declare function applyHivelocityVpsReactivation(params: {
    deviceId: number;
    subscriptionId: string;
}): Promise<{
    upstreamPoweredOn: boolean;
}>;
export declare function reactivateHivelocityVpsInstance(params: {
    deviceId: number;
    subscriptionId: string;
    userId: string;
    role: string | null | undefined;
}): Promise<{
    upstreamPoweredOn: boolean;
}>;
