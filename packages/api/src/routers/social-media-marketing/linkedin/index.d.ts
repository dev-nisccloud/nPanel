export declare const linkedinRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Authentication and token management endpoints
     */
    auth: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        generateToken: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                code: string;
                redirectUri?: string | undefined;
            };
            output: {
                success: boolean;
                data: {
                    accessToken: string;
                    refreshToken: string;
                    expiresIn: number;
                    expiresAt: string;
                    refreshExpiresAt: string;
                    scope: string;
                };
                meta: {
                    generated_at: string;
                    integration_id: string;
                };
            };
            meta: object;
        }>;
        refreshToken: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                refreshToken: string;
            };
            output: {
                success: boolean;
                data: {
                    accessToken: string;
                    refreshToken: string;
                    expiresIn: number;
                    expiresAt: string;
                    refreshExpiresAt: string;
                };
            };
            meta: object;
        }>;
        generateAuthUrl: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                redirectUri?: string | undefined;
            };
            output: {
                success: boolean;
                data: {
                    url: string;
                    state: string;
                };
                meta: {
                    generated_at: string;
                };
            };
            meta: object;
        }>;
        getStoredCredentials: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                success: boolean;
                data: null;
                meta: {
                    has_credentials: boolean;
                    created_at?: undefined;
                    updated_at?: undefined;
                };
            } | {
                success: boolean;
                data: {
                    integrationId: string;
                    hasAccessToken: boolean;
                    accessTokenExpiresAt: string | null;
                    isExpired: boolean | null;
                    scope: string | null;
                    status: string;
                    userId: string;
                };
                meta: {
                    has_credentials: boolean;
                    created_at: string;
                    updated_at: string;
                };
            };
            meta: object;
        }>;
    }>>;
    /**
     * Organizations list management endpoints
     */
    pages: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getOrganizations: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                accessToken?: string | undefined;
                apiVersion?: string | undefined;
                useStoredToken?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: any;
                meta: {
                    retrieved_at: string;
                    total_organizations: any;
                };
            };
            meta: object;
        }>;
        getPageTokenId: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pageId: string;
            };
            output: {
                success: boolean;
                data: {
                    pageTokenId: string;
                    pageId: string;
                    pageName: string | null;
                };
            };
            meta: object;
        }>;
        getOrganization: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                orgId: string;
                accessToken?: string | undefined;
                apiVersion?: string | undefined;
                useStoredToken?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: any;
                meta: {
                    retrieved_at: string;
                    organization_id: string;
                };
            };
            meta: object;
        }>;
    }>>;
    /**
     * Organization content and publishing endpoints
     */
    content: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
    /**
     * Content calendar management endpoints (CRUD operations for scheduled posts)
     */
    contentCalendar: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
                status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
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
        getAll: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pageTokenId?: string | undefined;
                status?: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED" | undefined;
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
                    status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
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
                status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
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
        update: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                id: string;
                message?: string | undefined;
                scheduledPublishTime?: unknown;
                status?: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED" | undefined;
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
                status: "DRAFT" | "SCHEDULED" | "CANCELLED" | "FAILED" | "PUBLISHED";
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
}>>;
