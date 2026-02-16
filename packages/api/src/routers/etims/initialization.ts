import { z } from "zod";
import { router, protectedProcedure } from "../../trpc";
import { ETimsClient } from "../../lib/etims-client";
import { TRPCError } from "@trpc/server";
import prisma from "@nPanel/db";

export const etimsInitializationRouter = router({
    /**
     * Initialize OSCU device and obtain communication key (cmcKey)
     */
    /**
     * Initialize OSCU device and obtain communication key (cmcKey)
     */
    initializeDevice: protectedProcedure
        .input(z.object({
            teamId: z.string().optional().nullable(),
            tin: z.string().regex(/^[A-Z]\d{9}[A-Z]$/, "Invalid TIN format (e.g., A123456789Z)"),
            bhfId: z.string().default("00"),
            dvcSrlNo: z.string().min(1, "Device serial number is required"),
            isSandbox: z.boolean().default(true),
        }))
        .mutation(async ({ input }) => {
            // Trim inputs to avoid whitespace issues
            const tin = input.tin.trim();
            const bhfId = input.bhfId.trim();
            const dvcSrlNo = input.dvcSrlNo.trim();

            // 1. Prepare Client Config
            const clientConfig = {
                baseUrl: input.isSandbox
                    ? (process.env.ETIMS_SANDBOX_BASE_URL || "https://sbx.kra.go.ke/etims-oscu/api/v1")
                    : (process.env.ETIMS_PRODUCTION_BASE_URL || "https://ra.kra.go.ke/etims-oscu/api/v1"),
                tokenUrl: input.isSandbox
                    ? (process.env.ETIMS_SANDBOX_TOKEN_URL || "https://sbx.kra.go.ke/v1/token/generate")
                    : (process.env.ETIMS_PRODUCTION_TOKEN_URL || "https://ra.kra.go.ke/v1/token/generate"),
                consumerKey: process.env.ETIMS_CONSUMER_KEY || "",
                consumerSecret: process.env.ETIMS_CONSUMER_SECRET || "",
            };

            if (!clientConfig.consumerKey || !clientConfig.consumerSecret) {
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "eTIMS Consumer Key and Secret are not configured.",
                });
            }

            const client = new ETimsClient(clientConfig);

            try {
                // 2. Generate Access Token (Required for Initialization)
                const tokenResponse = await client.generateToken();
                const accessToken = tokenResponse.access_token;

                if (!accessToken) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to generate eTIMS access token for initialization."
                    });
                }

                // 3. Call Initialization API
                // Note: The client.initializeDevice method signature might need adjustment if it doesn't take dvcSrlNo directly
                // but based on previous usage: client.initializeDevice(tin, bhfId, dvcSrlNo)
                const result = await client.initializeDevice(
                    tin,
                    bhfId,
                    dvcSrlNo,
                    accessToken // Pass the generated token
                );

                // 4. Extract cmcKey from result
                // The structure depends on the client implementation. 
                // Assuming result.data.info.cmcKey or result.cmcKey as seen in other files.
                // Based on `invoicing/index.ts`: const cmcKey = response.data?.info?.cmcKey || response.data?.cmcKey || response.cmcKey;
                const cmcKey = (result as any).data?.info?.cmcKey || (result as any).data?.cmcKey || (result as any).cmcKey;

                if (!cmcKey) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to retrieve cmcKey from eTIMS response.",
                        cause: result
                    });
                }

                // 4. Upsert Configuration
                // Use findFirst + update/create logic since unique constraint on nullable might be tricky for upsert in all providers
                // Or try upsert with simple logic if unique constraint holds.
                // To be safe and consistent with findFirst pattern:

                const whereClause = input.teamId ? { teamId: input.teamId } : { teamId: null };

                const existingConfig = await prisma.eTimsConfiguration.findFirst({
                    where: whereClause
                });

                if (existingConfig) {
                    await prisma.eTimsConfiguration.update({
                        where: { id: existingConfig.id },
                        data: {
                            kraPin: input.tin,
                            branchId: input.bhfId,
                            deviceSerialNumber: input.dvcSrlNo,
                            cmcKey: cmcKey,
                            isInitialized: true,
                            isSandbox: input.isSandbox,
                            updatedAt: new Date()
                        }
                    });
                    return {
                        success: true,
                        data: {
                            ...result,
                            configId: existingConfig.id
                        },
                    };
                } else {
                    const newConfig = await prisma.eTimsConfiguration.create({
                        data: {
                            id: crypto.randomUUID(),
                            teamId: input.teamId || null,
                            kraPin: input.tin,
                            branchId: input.bhfId,
                            deviceSerialNumber: input.dvcSrlNo,
                            cmcKey: cmcKey,
                            isInitialized: true,
                            isSandbox: input.isSandbox
                        }
                    });
                    return {
                        success: true,
                        data: {
                            ...result,
                            configId: newConfig.id
                        },
                    };
                }

            } catch (error: any) {
                console.error("[eTIMS Initialization Error]", error);

                // Try to parse KRA error message from the error string if possible
                let customMessage = "Failed to initialize eTIMS device";
                if (error.message && error.message.includes("{")) {
                    try {
                        const jsonPart = error.message.substring(error.message.indexOf("{"));
                        const kraError = JSON.parse(jsonPart);
                        if (kraError.responseBody?.resultMsg) {
                            customMessage = `KRA Error: ${kraError.responseBody.resultMsg}`;
                        } else if (kraError.header?.customerMessage) {
                            customMessage = `KRA Error: ${kraError.header.customerMessage}`;
                        } else if (kraError.responseHeader?.customerMessage) {
                            customMessage = `KRA Error: ${kraError.responseHeader.customerMessage}`;
                        }
                    } catch (e) {
                        // Failed to parse, stick to default or raw message
                    }
                }

                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: customMessage,
                    cause: error
                });
            }
        }),
});
