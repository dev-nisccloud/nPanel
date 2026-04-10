export declare const metaRouter: import("@trpc/server").TRPCBuiltRouter<{
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
                    tokenType: string;
                    expiresIn: number;
                    expiresAt: string;
                };
                meta: {
                    generated_at: string;
                    integration_id: string;
                };
            };
            meta: object;
        }>;
        getPageToken: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userAccessToken: string;
                pageId: string;
                teamId?: string | null | undefined;
            };
            output: {
                success: boolean;
                data: {
                    accessToken: string;
                    pageId: string;
                    pageInfo: {
                        pageName?: string;
                        pageUsername?: string;
                        pagePicture?: string;
                        pageCategory?: string;
                    };
                };
                meta: {
                    retrieved_at: string;
                    page_id: string;
                    team_id: string | null;
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
     * Pages list management endpoints
     */
    pages: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        getPages: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                fields?: string[] | undefined;
                accessToken?: string | undefined;
                apiVersion?: string | undefined;
                useStoredToken?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: any;
                meta: {
                    retrieved_at: string;
                    total_pages: any;
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
        getPage: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pageId: string;
                fields?: string[] | undefined;
                accessToken?: string | undefined;
                apiVersion?: string | undefined;
                useStoredToken?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: any;
                meta: {
                    retrieved_at: string;
                    page_id: string;
                };
            };
            meta: object;
        }>;
        getPageInsights: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pageId: string;
                metrics?: string[] | undefined;
                period?: "day" | "week" | "days_28" | undefined;
                since?: string | undefined;
                until?: string | undefined;
                accessToken?: string | undefined;
                apiVersion?: string | undefined;
                useStoredToken?: boolean | undefined;
            };
            output: {
                success: boolean;
                data: any;
                meta: {
                    retrieved_at: string;
                    page_id: string;
                };
            };
            meta: object;
        }>;
    }>>;
    /**
     * Page content management endpoints (posts, photos, videos, events)
     */
    content: import("@trpc/server").TRPCBuiltRouter<{
        ctx: import("../../..").Context;
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
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
        getPosts: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pageId: string;
                accessToken?: string | undefined;
                fields?: string[] | undefined;
                since?: string | undefined;
                until?: string | undefined;
                limit?: number | undefined;
                apiVersion?: string | undefined;
                useStoredToken?: boolean | undefined;
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
        getPhotos: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pageId: string;
                accessToken?: string | undefined;
                fields?: string[] | undefined;
                since?: string | undefined;
                until?: string | undefined;
                limit?: number | undefined;
                apiVersion?: string | undefined;
                useStoredToken?: boolean | undefined;
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
        getVideos: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pageId: string;
                accessToken?: string | undefined;
                fields?: string[] | undefined;
                since?: string | undefined;
                until?: string | undefined;
                limit?: number | undefined;
                apiVersion?: string | undefined;
                useStoredToken?: boolean | undefined;
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
        getEvents: import("@trpc/server").TRPCQueryProcedure<{
            input: {
                pageId: string;
                accessToken?: string | undefined;
                fields?: string[] | undefined;
                since?: string | undefined;
                until?: string | undefined;
                limit?: number | undefined;
                apiVersion?: string | undefined;
                useStoredToken?: boolean | undefined;
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
