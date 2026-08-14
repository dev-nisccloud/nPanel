export declare const webDesignQuotesRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    create: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
            email: string;
            phone: string;
            companyName: string;
            projectType: "OTHER" | "NEW_WEBSITE" | "REDESIGN" | "ECOMMERCE" | "LANDING_PAGE" | "WEB_APP";
            projectDescription: string;
            budget: string;
            domain?: string | undefined;
            targetLaunchDate?: unknown;
        };
        output: {
            id: string;
            createdAt: Date;
        };
        meta: object;
    }>;
    list: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            limit?: number | undefined;
            offset?: number | undefined;
            status?: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CONTACTED" | "QUOTED" | undefined;
        };
        output: {
            items: {
                id: string;
                name: string;
                email: string;
                phone: string;
                companyName: string;
                domain: string | null;
                projectType: "OTHER" | "NEW_WEBSITE" | "REDESIGN" | "ECOMMERCE" | "LANDING_PAGE" | "WEB_APP";
                projectDescription: string;
                budget: string;
                targetLaunchDate: Date | null;
                status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CONTACTED" | "QUOTED";
                submittedById: string | null;
                createdAt: Date;
                updatedAt: Date;
            }[];
            total: number;
        };
        meta: object;
    }>;
}>>;
