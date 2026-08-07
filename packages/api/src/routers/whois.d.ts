/**
 * WHOIS router  pure RDAP.
 *
 * All TLDs (including .ke via https://rdap.kenic.or.ke/) are handled by the
 * single RDAP client. The IANA bootstrap resolves the correct server per TLD.
 *
 * All procedures are public (no session required).
 */
import type { WhoisResult } from "../lib/whois/rdap-client";
export declare const whoisRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Single-domain WHOIS/RDAP lookup.
     * Supports any TLD in the IANA bootstrap (593 registries as of 2026).
     */
    lookup: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            domain: string;
        };
        output: WhoisResult;
        meta: object;
    }>;
    /**
     * Bulk WHOIS lookup for up to 10 domains concurrently.
     * Individual failures are surfaced in each result's error field  the
     * request never fails as a whole due to a single domain failing.
     */
    bulkLookup: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            domains: string[];
        };
        output: {
            results: WhoisResult[];
        };
        meta: object;
    }>;
}>>;
