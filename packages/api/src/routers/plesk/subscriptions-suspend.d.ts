/**
 * Plesk webspace status values (objectStatus / plesk_common.xsd).
 * @see https://docs.plesk.com/en-US/obsidian/api-rpc/about-xml-api/reference/managing-subscriptions/subscription-settings/general-subscription-information/node-gen_setup-type-setgensetuptype.33860/
 */
export declare const PLESK_WEBSPACE_STATUS: {
    readonly ACTIVE: 0;
    readonly DISABLED_BY_ADMIN: 16;
    readonly DISABLED_BY_RESELLER: 32;
    readonly DISABLED_BY_CUSTOMER: 64;
};
export declare const subscriptionsSuspendRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Suspend a subscription (webspace) by setting gen_setup.status.
     * Default: 16 (disabled by Administrator).
     */
    suspend: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: number;
            suspendedBy?: "admin" | "customer" | "reseller" | undefined;
        };
        output: {
            raw: string;
            parsed: Record<string, unknown>;
            status: number;
        };
        meta: object;
    }>;
    /**
     * Reactivate a suspended subscription (status 0 = active).
     */
    unsuspend: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: number;
        };
        output: {
            raw: string;
            parsed: Record<string, unknown>;
            status: number;
        };
        meta: object;
    }>;
}>>;
