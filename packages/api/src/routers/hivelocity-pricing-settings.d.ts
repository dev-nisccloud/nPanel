export declare const hivelocityPricingSettingsRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    get: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            productType: "DEDICATED_SERVERS" | "VPS" | "VDS";
        };
        output: {
            success: boolean;
            data: {
                id: string;
                userId: string;
                productType: string;
                marginType: string | null;
                percentageMargin: string | null;
                fixedMargin: string | null;
                roundOff: string | null;
                osMarginType: string | null;
                osPercentageMargin: string | null;
                osFixedMargin: string | null;
                osRoundOff: string | null;
                addonsMarginType: string | null;
                addonsPercentageMargin: string | null;
                addonsFixedMargin: string | null;
                addonsRoundOff: string | null;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                _count: {
                    activityLogs: number;
                };
            } | null;
        };
        meta: object;
    }>;
    upsert: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            productType: "DEDICATED_SERVERS" | "VPS" | "VDS";
            marginType?: "FIXED" | "PERCENTAGE" | null | undefined;
            percentageMargin?: string | null | undefined;
            fixedMargin?: string | null | undefined;
            roundOff?: string | null | undefined;
            osMarginType?: "FIXED" | "PERCENTAGE" | null | undefined;
            osPercentageMargin?: string | null | undefined;
            osFixedMargin?: string | null | undefined;
            osRoundOff?: string | null | undefined;
            addonsMarginType?: "FIXED" | "PERCENTAGE" | null | undefined;
            addonsPercentageMargin?: string | null | undefined;
            addonsFixedMargin?: string | null | undefined;
            addonsRoundOff?: string | null | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                userId: string;
                productType: string;
                marginType: string | null;
                percentageMargin: string | null;
                fixedMargin: string | null;
                roundOff: string | null;
                osMarginType: string | null;
                osPercentageMargin: string | null;
                osFixedMargin: string | null;
                osRoundOff: string | null;
                addonsMarginType: string | null;
                addonsPercentageMargin: string | null;
                addonsFixedMargin: string | null;
                addonsRoundOff: string | null;
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
                _count: {
                    activityLogs: number;
                };
            };
        };
        meta: object;
    }>;
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            productType: "DEDICATED_SERVERS" | "VPS" | "VDS";
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    getActivityLogs: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            productType: "DEDICATED_SERVERS" | "VPS" | "VDS";
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: string;
                userId: string;
                hivelocityPricingSettingsId: string;
                action: string;
                description: string | null;
                metadata: any;
                ipAddress: string | null;
                userAgent: string | null;
                createdAt: Date;
            }[];
            pagination: {
                total: number;
                limit: number;
                offset: number;
                hasMore: boolean;
            };
        };
        meta: object;
    }>;
}>>;
