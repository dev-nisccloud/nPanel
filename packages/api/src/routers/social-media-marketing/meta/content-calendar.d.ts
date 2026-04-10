import { type Context } from '../../../trpc';
export declare const metaContentCalendarRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Create a new calendar post
     * NOTE: This endpoint ONLY saves to the database. It does NOT publish to Meta.
     * Publishing to Meta will be handled by a separate scheduler/service that runs
     * at the scheduled publish time.
     */
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            pageTokenId: string;
            scheduledPublishTime: unknown;
            message?: string | undefined;
            mediaItems?: {
                mediaType: "PHOTO" | "VIDEO";
                url: string;
                fileName?: string | undefined;
                fileSize?: number | undefined;
                caption?: string | undefined;
                description?: string | undefined;
                order?: number | undefined;
            }[] | undefined;
        };
        output: {
            id: string;
            pageTokenId: string | null;
            pageName: string | null;
            message: string | null;
            scheduledPublishTime: Date;
            status: "DRAFT" | "SCHEDULED" | "FAILED" | "CANCELLED" | "PUBLISHED";
            published: boolean;
            publishedAt: Date | null;
            publishedPostId: string | null;
            publishedPermalink: string | null;
            lastError: string | null;
            retryCount: number;
            lastRetryAt: Date | null;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
            creator?: {
                id: string;
                name: string;
                email: string;
                image: string | null;
            } | undefined;
            qstashJobId?: string | null | undefined;
            mediaItems?: {
                id: string;
                calendarPostId: string;
                mediaType: "PHOTO" | "VIDEO";
                url: string;
                fileName: string | null;
                fileSize: number | null;
                caption: string | null;
                description: string | null;
                order: number;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
        };
        meta: object;
    }>;
    /**
     * Get calendar posts with filters
     */
    getAll: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            pageTokenId?: string | undefined;
            status?: "DRAFT" | "SCHEDULED" | "FAILED" | "CANCELLED" | "PUBLISHED" | undefined;
            limit?: number | undefined;
            offset?: number | undefined;
        };
        output: {
            posts: {
                id: string;
                pageTokenId: string | null;
                pageName: string | null;
                message: string | null;
                scheduledPublishTime: Date;
                status: "DRAFT" | "SCHEDULED" | "FAILED" | "CANCELLED" | "PUBLISHED";
                published: boolean;
                publishedAt: Date | null;
                publishedPostId: string | null;
                publishedPermalink: string | null;
                lastError: string | null;
                retryCount: number;
                lastRetryAt: Date | null;
                createdBy: string;
                createdAt: Date;
                updatedAt: Date;
                creator?: {
                    id: string;
                    name: string;
                    email: string;
                    image: string | null;
                } | undefined;
                qstashJobId?: string | null | undefined;
                mediaItems?: {
                    id: string;
                    calendarPostId: string;
                    mediaType: "PHOTO" | "VIDEO";
                    url: string;
                    fileName: string | null;
                    fileSize: number | null;
                    caption: string | null;
                    description: string | null;
                    order: number;
                    createdAt: Date;
                    updatedAt: Date;
                }[] | undefined;
            }[];
            total: number;
        };
        meta: object;
    }>;
    /**
     * Get calendar post by ID
     */
    getById: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            id: string;
        };
        output: {
            id: string;
            pageTokenId: string | null;
            pageName: string | null;
            message: string | null;
            scheduledPublishTime: Date;
            status: "DRAFT" | "SCHEDULED" | "FAILED" | "CANCELLED" | "PUBLISHED";
            published: boolean;
            publishedAt: Date | null;
            publishedPostId: string | null;
            publishedPermalink: string | null;
            lastError: string | null;
            retryCount: number;
            lastRetryAt: Date | null;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
            creator?: {
                id: string;
                name: string;
                email: string;
                image: string | null;
            } | undefined;
            qstashJobId?: string | null | undefined;
            mediaItems?: {
                id: string;
                calendarPostId: string;
                mediaType: "PHOTO" | "VIDEO";
                url: string;
                fileName: string | null;
                fileSize: number | null;
                caption: string | null;
                description: string | null;
                order: number;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
        };
        meta: object;
    }>;
    /**
     * Update calendar post
     * NOTE: This endpoint ONLY updates the database. It does NOT interact with Meta API.
     */
    update: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
            message?: string | undefined;
            scheduledPublishTime?: unknown;
            status?: "DRAFT" | "SCHEDULED" | "FAILED" | "CANCELLED" | "PUBLISHED" | undefined;
            mediaItems?: {
                mediaType: "PHOTO" | "VIDEO";
                url: string;
                fileName?: string | undefined;
                fileSize?: number | undefined;
                caption?: string | undefined;
                description?: string | undefined;
                order?: number | undefined;
            }[] | undefined;
        };
        output: {
            id: string;
            pageTokenId: string | null;
            pageName: string | null;
            message: string | null;
            scheduledPublishTime: Date;
            status: "DRAFT" | "SCHEDULED" | "FAILED" | "CANCELLED" | "PUBLISHED";
            published: boolean;
            publishedAt: Date | null;
            publishedPostId: string | null;
            publishedPermalink: string | null;
            lastError: string | null;
            retryCount: number;
            lastRetryAt: Date | null;
            createdBy: string;
            createdAt: Date;
            updatedAt: Date;
            creator?: {
                id: string;
                name: string;
                email: string;
                image: string | null;
            } | undefined;
            qstashJobId?: string | null | undefined;
            mediaItems?: {
                id: string;
                calendarPostId: string;
                mediaType: "PHOTO" | "VIDEO";
                url: string;
                fileName: string | null;
                fileSize: number | null;
                caption: string | null;
                description: string | null;
                order: number;
                createdAt: Date;
                updatedAt: Date;
            }[] | undefined;
        };
        meta: object;
    }>;
    /**
     * Delete calendar post
     * NOTE: This endpoint ONLY deletes from the database. It does NOT interact with Meta API.
     */
    delete: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            id: string;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
    /**
     * Get activity logs for a calendar post
     */
    getActivityLogs: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            calendarPostId: string;
        };
        output: {
            id: string;
            userId: string;
            calendarPostId: string;
            action: string;
            description: string | null;
            metadata: any;
            ipAddress: string | null;
            userAgent: string | null;
            createdAt: Date;
        }[];
        meta: object;
    }>;
    /**
     * Update a single media item (caption/description)
     */
    updateMediaItem: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            mediaItemId: string;
            caption?: string | undefined;
            description?: string | undefined;
        };
        output: {
            id: string;
            calendarPostId: string;
            mediaType: "PHOTO" | "VIDEO";
            url: string;
            fileName: string | null;
            fileSize: number | null;
            caption: string | null;
            description: string | null;
            order: number;
            createdAt: Date;
            updatedAt: Date;
        };
        meta: object;
    }>;
    /**
     * Delete a single media item
     */
    deleteMediaItem: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            mediaItemId: string;
        };
        output: {
            success: boolean;
            message: string;
        };
        meta: object;
    }>;
}>>;
