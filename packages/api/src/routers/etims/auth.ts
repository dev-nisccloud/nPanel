import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { ETimsClient } from "../../lib/etims-client";
import { TRPCError } from "@trpc/server";
import prisma from "@nPanel/db";

export const etimsAuthRouter = router({
    /**
     * Generate OAuth 2.0 access token from KRA eTIMS
     */
    generateToken: protectedProcedure
        .input(z.object({
            teamId: z.string().optional().nullable(),
            grantType: z.literal("client_credentials").default("client_credentials"),
        }))
        .mutation(async ({ input }) => {
            // 1. Fetch eTIMS Configuration
            // If teamId is provided, fetch for team. If not, try to search for a global config (teamId: null) or fail?
            // User said teamId is optional. This likely implies a single global config or optional team association.
            // Let's search by teamId if present, OR if not present, search where teamId is null.

            const whereClause = input.teamId ? { teamId: input.teamId } : { teamId: null };

            // Prisma `findUnique` requires a unique constraint. 
            // `teamId` is unique in schema. `teamId: null` is also unique (mongo sparse index).
            // However, findUnique syntax with nullable fields can be tricky.
            // findFirst is safer if we are unsure about unique constraints on nulls across connectors.
            // But let's try findFirst to be safe.
            const config = await prisma.eTimsConfiguration.findFirst({
                where: whereClause,
            });

            if (!config) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "eTIMS Configuration not found. Please initialize the device first.",
                });
            }

            // 2. Prepare Client Config (Secrets from Env, Branch/PIN from DB)
            const clientConfig = {
                baseUrl: config.isSandbox
                    ? (process.env.ETIMS_SANDBOX_BASE_URL || "https://sbx.kra.go.ke/etims-oscu/api/v1")
                    : (process.env.ETIMS_PRODUCTION_BASE_URL || "https://ra.kra.go.ke/etims-oscu/api/v1"),
                tokenUrl: config.isSandbox
                    ? (process.env.ETIMS_SANDBOX_TOKEN_URL || "https://sbx.kra.go.ke/v1/token/generate")
                    : (process.env.ETIMS_PRODUCTION_TOKEN_URL || "https://ra.kra.go.ke/v1/token/generate"),
                consumerKey: process.env.ETIMS_CONSUMER_KEY || "",
                consumerSecret: process.env.ETIMS_CONSUMER_SECRET || "",
            };

            if (!clientConfig.consumerKey || !clientConfig.consumerSecret) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "System configuration error: eTIMS Consumer Key/Secret missing.",
                });
            }

            const client = new ETimsClient(clientConfig);

            try {
                // 3. Generate Token
                // The client.generateToken() method usually constructs the auth header from consumer key/secret
                const tokenData = await client.generateToken();

                return {
                    success: true,
                    data: tokenData,
                };
            } catch (error: any) {
                console.error("[eTIMS Auth Error]", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: error.message || "Failed to generate eTIMS access token",
                });
            }
        }),

    /**
     * Get current eTIMS configuration status
     */
    getConfiguration: protectedProcedure
        .input(z.object({
            teamId: z.string().optional().nullable(),
        }))
        .query(async ({ input }) => {
            const whereClause = input.teamId ? { teamId: input.teamId } : { teamId: null };

            const config = await prisma.eTimsConfiguration.findFirst({
                where: whereClause,
            });

            if (!config) {
                return {
                    isInitialized: false,
                    config: null
                };
            }

            return {
                isInitialized: config.isInitialized,
                config: {
                    kraPin: config.kraPin,
                    branchId: config.branchId,
                    deviceSerialNumber: config.deviceSerialNumber,
                    isSandbox: config.isSandbox,
                    updatedAt: config.updatedAt
                }
            };
        }),
});
