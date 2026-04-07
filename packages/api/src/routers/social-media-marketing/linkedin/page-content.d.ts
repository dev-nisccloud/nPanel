export declare const linkedinPageContentRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get organization posts/content
     * Note: LinkedIn API has limited support for fetching posts directly.
     * This endpoint attempts to fetch posts using the UGC Posts API.
     */
    getContent: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            orgId: string;
            limit?: number | undefined;
            accessToken?: string | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: any;
            pagination: {
                previous: null;
                next: null;
                cursors: null;
            };
            meta: {
                retrieved_at: string;
                org_id: string;
                content_type: string;
                total_items: any;
                note?: undefined;
            };
        } | {
            success: boolean;
            data: never[];
            pagination: {
                previous: null;
                next: null;
                cursors: null;
            };
            meta: {
                retrieved_at: string;
                org_id: string;
                content_type: string;
                total_items: number;
                note: string;
            };
        };
        meta: object;
    }>;
    /**
     * Publish a post to a LinkedIn Organization
     * Supports text posts, photo posts, video posts, and scheduled posts
     */
    publishPost: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            orgId: string;
            commentary?: string | undefined;
            photos?: {
                url: string;
            }[] | undefined;
            video?: {
                url: string;
            } | undefined;
            scheduledPublishTime?: number | undefined;
            accessToken?: string | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: {
                postId: string;
                urn: string;
                permalink: string;
            };
            meta: {
                published_at: string;
                org_id: string;
                note?: undefined;
            };
        } | {
            success: boolean;
            data: {
                postId: string | undefined;
                urn: string;
                permalink: string;
            };
            meta: {
                published_at: string;
                org_id: string;
                note: string;
            };
        };
        meta: object;
    }>;
}>>;
