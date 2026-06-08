/** Shown to clients when a cloud-hosting upstream error occurs in production. */
export declare const HIVELOCITY_PUBLIC_ERROR_MESSAGE = "A system error occurred. Please try again.";
export declare function isHivelocityDevelopmentMode(): boolean;
export declare function resolveHivelocityPublicMessageFromError(error: unknown, fallback?: string): string;
/** Sanitizes uncaught errors from all Hivelocity tRPC procedures in production. */
export declare const hivelocityErrorMiddleware: import("@trpc/server").TRPCMiddlewareBuilder<import("..").Context, object, object, unknown>;
