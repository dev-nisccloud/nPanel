import * as crypto from "node:crypto";
import { z } from "zod";
import { eq } from "@npanel/db";
import { router, protectedProcedure } from "../../trpc";
import { ETimsClient } from "../../lib/etims-client";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";

export const etimsInitializationRouter = router({
    /**
     * Initialize OSCU device and obtain communication key (cmcKey)
     */
    /**
     * Initialize OSCU device and obtain communication key (cmcKey)
     */
    initializeDevice: protectedProcedure
        .input(z.object({
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

                // 3. Call Initialization API (KRA docs: /initialize, response has resultCd and data.info.cmcKey)
                const result = (await client.initializeDevice(
                    tin,
                    bhfId,
                    dvcSrlNo,
                    accessToken
                )) as {
                    resultCd?: string;
                    resultMsg?: string;
                    data?: { info?: { cmcKey?: string }; cmcKey?: string };
                    responseHeader?: { customerMessage?: string; debugMessage?: string };
                    responseBody?: {
                        resultCd?: string;
                        resultMsg?: string;
                        data?: { info?: { cmcKey?: string }; cmcKey?: string } | null;
                    };
                };

                // Normalize: API may return flat body (docs) or wrapped { responseHeader, responseBody }
                const body = result.responseBody ?? result;
                const resultCode = body.resultCd;
                const resultMessage =
                    body.resultMsg ??
                    result.responseHeader?.customerMessage ??
                    result.responseHeader?.debugMessage ??
                    "Unknown eTIMS initialization response";

                // Handle non-success: resultCd "000" = success per KRA docs
                if (resultCode && resultCode !== "000") {
                    if (resultCode === "902") {
                        // 902 = "device already installed".
                        // In PRODUCTION this is a hard error (someone else owns the device).
                        // In SANDBOX, KRA still returns a cmcKey in the 902 body, and
                        // re-initializing is the standard way to refresh an expired test session.
                        // So in sandbox we treat 902 as a soft warning and continue.
                        if (!input.isSandbox) {
                            throw new TRPCError({
                                code: "PRECONDITION_FAILED",
                                message:
                                    "This eTIMS device is already installed on another machine. " +
                                    "Contact KRA support to reset the device registration if you need to move it.",
                                cause: result,
                            });
                        }
                        // Sandbox: fall through   extract cmcKey below and refresh the session.
                    } else {
                        throw new TRPCError({
                            code: "INTERNAL_SERVER_ERROR",
                            message: `eTIMS initialization failed: ${resultMessage}`,
                            cause: result,
                        });
                    }
                }

                // 4. Extract cmcKey per KRA docs: data.info.cmcKey
                const data = body.data;
                const cmcKey =
                    data?.info?.cmcKey ?? (data as { cmcKey?: string } | undefined)?.cmcKey ?? (result as { cmcKey?: string }).cmcKey;

                if (!cmcKey) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to retrieve cmcKey from eTIMS response.",
                        cause: result
                    });
                }

                // 5. Upsert single global Configuration
                const [existingConfig] = await db
                    .select({ id: eTimsConfiguration.id })
                    .from(eTimsConfiguration)
                    .limit(1);

                const now = new Date();

                if (existingConfig) {
                    await db
                        .update(eTimsConfiguration)
                        .set({
                            kraPin: input.tin,
                            branchId: input.bhfId,
                            deviceSerialNumber: input.dvcSrlNo,
                            cmcKey,
                            isInitialized: true,
                            isSandbox: input.isSandbox,
                            updatedAt: now,
                        })
                        .where(eq(eTimsConfiguration.id, existingConfig.id));
                    return {
                        success: true,
                        data: {
                            ...result,
                            configId: existingConfig.id
                        },
                    };
                }

                const newId = crypto.randomUUID();
                await db.insert(eTimsConfiguration).values({
                    id: newId,
                    kraPin: input.tin,
                    branchId: input.bhfId,
                    branchName: null,
                    deviceSerialNumber: input.dvcSrlNo,
                    cmcKey,
                    isSandbox: input.isSandbox,
                    isInitialized: true,
                    lastSyncAt: null,
                    createdAt: now,
                    updatedAt: now,
                });
                return {
                    success: true,
                    data: {
                        ...result,
                        configId: newId
                    },
                };

            } catch (error: unknown) {
                if (error instanceof TRPCError) throw error;
                console.error("[eTIMS Initialization Error]", error);

                const err = error as { message?: string };
                let customMessage = "Failed to initialize eTIMS device";
                if (err.message?.includes("{")) {
                    try {
                        const jsonPart = err.message.substring(err.message.indexOf("{"));
                        const kraError = JSON.parse(jsonPart) as {
                            responseBody?: { resultMsg?: string };
                            header?: { customerMessage?: string };
                            responseHeader?: { customerMessage?: string };
                        };
                        if (kraError.responseBody?.resultMsg) {
                            customMessage = `KRA Error: ${kraError.responseBody.resultMsg}`;
                        } else if (kraError.header?.customerMessage) {
                            customMessage = `KRA Error: ${kraError.header.customerMessage}`;
                        } else if (kraError.responseHeader?.customerMessage) {
                            customMessage = `KRA Error: ${kraError.responseHeader.customerMessage}`;
                        }
                    } catch {
                        // keep default message
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
