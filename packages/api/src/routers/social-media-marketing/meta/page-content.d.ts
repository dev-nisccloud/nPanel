export declare const metaPageContentRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Get page content (posts, photos, videos, or events)
     */
    getContent: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pageId: string;
            contentType?: "events" | "posts" | "photos" | "videos" | undefined;
            fields?: string[] | undefined;
            limit?: number | undefined;
            since?: string | undefined;
            until?: string | undefined;
            accessToken?: string | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: any;
            pagination: {
                previous: any;
                next: any;
                cursors: any;
            };
            meta: {
                retrieved_at: string;
                page_id: string;
                content_type: "events" | "posts" | "photos" | "videos";
                total_items: any;
            };
        };
        meta: object;
    }>;
    /**
     * Get page posts
     */
    getPosts: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pageId: string;
            accessToken?: string | undefined;
            fields?: string[] | undefined;
            limit?: number | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
            since?: string | undefined;
            until?: string | undefined;
            contentType?: "posts" | undefined;
        };
        output: {
            success: boolean;
            data: any;
            pagination: {
                previous: any;
                next: any;
                cursors: any;
            };
            meta: {
                retrieved_at: string;
                page_id: string;
                total_posts: any;
            };
        };
        meta: object;
    }>;
    /**
     * Get page photos
     */
    getPhotos: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pageId: string;
            accessToken?: string | undefined;
            fields?: string[] | undefined;
            limit?: number | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
            since?: string | undefined;
            until?: string | undefined;
            contentType?: "photos" | undefined;
        };
        output: {
            success: boolean;
            data: any;
            pagination: {
                previous: any;
                next: any;
                cursors: any;
            };
            meta: {
                retrieved_at: string;
                page_id: string;
                total_photos: any;
            };
        };
        meta: object;
    }>;
    /**
     * Get page videos
     */
    getVideos: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pageId: string;
            accessToken?: string | undefined;
            fields?: string[] | undefined;
            limit?: number | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
            since?: string | undefined;
            until?: string | undefined;
            contentType?: "videos" | undefined;
        };
        output: {
            success: boolean;
            data: any;
            pagination: {
                previous: any;
                next: any;
                cursors: any;
            };
            meta: {
                retrieved_at: string;
                page_id: string;
                total_videos: any;
            };
        };
        meta: object;
    }>;
    /**
     * Get page events
     */
    getEvents: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pageId: string;
            accessToken?: string | undefined;
            fields?: string[] | undefined;
            limit?: number | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
            since?: string | undefined;
            until?: string | undefined;
            contentType?: "events" | undefined;
        };
        output: {
            success: boolean;
            data: any;
            pagination: {
                previous: any;
                next: any;
                cursors: any;
            };
            meta: {
                retrieved_at: string;
                page_id: string;
                total_events: any;
            };
        };
        meta: object;
    }>;
    /**
     * Publish a post to a Facebook Page
     * Supports text posts, photo posts, video posts, and scheduled posts
     */
    publishPost: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            pageId: string;
            message?: string | undefined;
            photos?: {
                url: string;
                caption?: string | undefined;
            }[] | undefined;
            video?: {
                file_url: string;
                description?: string | undefined;
            } | undefined;
            scheduledPublishTime?: number | undefined;
            published?: boolean | undefined;
            accessToken?: string | undefined;
            apiVersion?: string | undefined;
            useStoredToken?: boolean | undefined;
        };
        output: {
            success: boolean;
            data: {
                postId: any;
                permalink: any;
            };
            meta: {
                published_at: string;
                page_id: string;
            };
        };
        meta: object;
    }>;
}>>;
