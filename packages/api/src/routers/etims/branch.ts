import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { ETimsClient } from "../../lib/etims-client";
import { TRPCError } from "@trpc/server";

export const etimsBranchRouter = router({
    /**
     * Register customer information for a branch
     */
    saveCustomer: protectedProcedure
        .input(z.object({
            tin: z.string(),
            bhfId: z.string(),
            accessToken: z.string().optional(),
            cmcKey: z.string().optional(),
            customer: z.object({
                custNo: z.string(),
                custTin: z.string().regex(/^[A-Z]\d{9}[A-Z]$/, "Invalid TIN format"),
                custNm: z.string(),
                adrs: z.string().nullable(),
                telNo: z.string().nullable(),
                email: z.string().email().nullable(),
                faxNo: z.string().nullable(),
                useYn: z.enum(["Y", "N"]).default("Y"),
                remark: z.string().nullable(),
                regrNm: z.string().default("Admin"),
                regrId: z.string().default("Admin"),
                modrNm: z.string().default("Admin"),
                modrId: z.string().default("Admin")
            })
        }))
        .mutation(async ({ input }) => {
            const config = {
                baseUrl: process.env.ETIMS_BASE_URL || "https://sbx.kra.go.ke/etims-oscu/api/v1",
                tokenUrl: process.env.ETIMS_TOKEN_URL || "https://sbx.kra.go.ke/v1/token/generate",
                consumerKey: process.env.ETIMS_CONSUMER_KEY || "",
                consumerSecret: process.env.ETIMS_CONSUMER_SECRET || "",
            };

            const client = new ETimsClient(config);

            try {
                const result = await client.branchSendCustomerInfo(
                    {
                        tin: input.tin,
                        bhfId: input.bhfId,
                        cmcKey: input.cmcKey,
                        accessToken: input.accessToken
                    },
                    input.customer
                );

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                console.error("[eTIMS Save Customer Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to save eTIMS customer info",
                });
            }
        }),

    /**
     * Create/update branch user account
     */
    saveBranchUser: protectedProcedure
        .input(z.object({
            tin: z.string(),
            bhfId: z.string(),
            accessToken: z.string().optional(),
            cmcKey: z.string().optional(),
            user: z.object({
                userId: z.string().min(1),
                userNm: z.string().min(1),
                pwd: z.string().min(1),
                adrs: z.string().nullable(),
                cntc: z.string().nullable(),
                authCd: z.string().nullable(),
                remark: z.string().nullable(),
                useYn: z.enum(["Y", "N"]).default("Y"),
                regrNm: z.string(),
                regrId: z.string(),
                modrNm: z.string(),
                modrId: z.string()
            })
        }))
        .mutation(async ({ input }) => {
            const config = {
                baseUrl: process.env.ETIMS_BASE_URL || "https://sbx.kra.go.ke/etims-oscu/api/v1",
                tokenUrl: process.env.ETIMS_TOKEN_URL || "https://sbx.kra.go.ke/v1/token/generate",
                consumerKey: process.env.ETIMS_CONSUMER_KEY || "",
                consumerSecret: process.env.ETIMS_CONSUMER_SECRET || "",
            };

            const client = new ETimsClient(config);

            try {
                const result = await client.branchUserAccount(
                    {
                        tin: input.tin,
                        bhfId: input.bhfId,
                        cmcKey: input.cmcKey,
                        accessToken: input.accessToken
                    },
                    input.user
                );

                return {
                    success: true,
                    data: result,
                };
            } catch (error: any) {
                console.error("[eTIMS Save Branch User Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to save eTIMS branch user",
                });
            }
        }),
});
