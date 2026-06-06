import { AI_DOMAIN_SUGGESTION_COUNT } from "../lib/ai-domain-search-constants";
export declare const AI_DOMAIN_SEARCH_MODEL = "anthropic/claude-4.5-haiku";
/** @deprecated Import from `@npanel/api/lib/ai-domain-search-constants` */
export { AI_DOMAIN_SUGGESTION_COUNT };
export declare const aiDomainSearchRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    generateNameIdeas: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            businessDescription: string;
        };
        output: {
            suggestions: {
                businessName: string;
                businessDescription: string;
                domainName: string;
                availability: {
                    tld: string;
                    domain: string;
                    available: boolean;
                    status: "unknown" | "available" | "reserved" | "taken";
                    via: "error" | "kenic" | "openprovider";
                    price?: {
                        amount: number;
                        currency: string;
                        formatted: string;
                    } | undefined;
                    isPremium?: boolean | undefined;
                }[];
            }[];
        };
        meta: object;
    }>;
}>>;
