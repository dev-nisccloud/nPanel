/**
 * TEMPORARY  KRA Developer Platform automated certification testing.
 * Set ETIMS_CERTIFICATION_PUBLIC=1 in apps/server/.env to allow unauthenticated
 * calls to eTIMS routers. Remove / set to 0 after certification is complete.
 */
export declare const isEtimsCertificationPublic: () => boolean;
export declare const etimsProcedure: import("@trpc/server").TRPCProcedureBuilder<import("../..").Context, object, {}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
export declare function skipEtimsAuthChecks(): boolean;
