export declare const niscEmailMarketingSesUsageRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    quotaLive: import("@trpc/server").TRPCQueryProcedure<{
        input: Record<string, never> | undefined;
        output: {
            maxSendRate: number;
            max24HourSend: number;
            sentLast24Hours: number;
            remaining24HourSend: number;
        };
        meta: object;
    }>;
    listDomainsLive: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            limit?: number | undefined;
        } | undefined;
        output: {
            domains: {
                id: string;
                domainName: string;
                status: string;
                verificationStatus: import("@aws-sdk/client-ses").VerificationStatus;
                dnsRecords: {
                    record: "MX" | "CNAME" | "TXT";
                    type: "MX" | "CNAME" | "TXT";
                    name: string;
                    value: string;
                }[];
                connected: boolean;
                connectedDomainId: string | null;
                connectedTeamId: string | null;
            }[];
        };
        meta: object;
    }>;
    verifyDomainLive: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domainName: string;
        };
        output: {
            domainName: string;
            status: string;
            verificationStatus: import("@aws-sdk/client-ses").VerificationStatus;
            dnsRecords: {
                record: "MX" | "CNAME" | "TXT";
                type: "MX" | "CNAME" | "TXT";
                name: string;
                value: string;
            }[];
        };
        meta: object;
    }>;
    connectToNPanel: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domainName: string;
            teamId?: string | null | undefined;
        };
        output: {
            id: string;
            domainName: string;
            alreadyConnected: boolean;
        };
        meta: object;
    }>;
    disconnectFromNPanel: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            domainName: string;
        };
        output: {
            ok: boolean;
        };
        meta: object;
    }>;
}>>;
