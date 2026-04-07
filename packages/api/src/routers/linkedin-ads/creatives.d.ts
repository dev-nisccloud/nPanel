export declare const linkedInAdsCreativesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    listAccountCreatives: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accountId: string;
            pageSize?: number | undefined;
            pageToken?: string | undefined;
            campaignIds?: string[] | undefined;
        };
        output: {
            success: boolean;
            data: {
                id: any;
                name: any;
                campaign: any;
                account: any;
                intendedStatus: string | null;
                reviewStatus: string | null;
                isServing: boolean;
                servingHoldReasons: string[];
                contentReference: any;
                inlineContent: any;
                leadgenCallToAction: {
                    label: string | null;
                    destination: any;
                } | null;
                createdAt: any;
                lastModifiedAt: any;
            }[];
            meta: {
                retrieved_at: string;
                total_creatives: number;
                nextPageToken: string | null;
            };
        };
        meta: object;
    }>;
    getCreativePreview: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accountId: string;
            creativeId: string;
            livePreviewCreative?: {
                campaign: string;
                intendedStatus?: string | undefined;
                contentReference?: string | undefined;
                inlineContent?: Record<any, unknown> | undefined;
            } | undefined;
        };
        output: {
            success: boolean;
            data: {
                preview: any;
                creative: any;
                placement: any;
            }[];
            meta: {
                retrieved_at: string;
                total_previews: number;
                previewSource: "none" | "accurate" | "live_action";
                unsupportedCreativeType: boolean;
                message?: undefined;
            };
        } | {
            success: boolean;
            data: never[];
            meta: {
                retrieved_at: string;
                total_previews: number;
                unsupportedCreativeType: boolean;
                message: string;
                previewSource?: undefined;
            };
        };
        meta: object;
    }>;
    /**
     * List creatives (ads) for a campaign
     * Returns creatives directly from LinkedIn API with optional insights
     */
    listCreatives: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            accountId: string;
            campaignId: string;
            timeRange?: {
                since?: string | undefined;
                until?: string | undefined;
            } | undefined;
        };
        output: {
            success: boolean;
            data: any[];
            meta: {
                retrieved_at: string;
                total_creatives: number;
                paging: {
                    count?: number;
                    start?: number;
                    links?: Array<{
                        rel: string;
                        href: string;
                    }>;
                } | undefined;
            };
        };
        meta: object;
    }>;
    /**
     * Get creative details
     */
    getCreativeDetails: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            campaignId: string;
            creativeId: string;
        };
        output: {
            success: boolean;
            data: any;
        };
        meta: object;
    }>;
}>>;
