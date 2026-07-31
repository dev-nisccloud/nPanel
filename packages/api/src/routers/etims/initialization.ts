import * as crypto from "node:crypto";
import { z } from "zod";
import { eq } from "@npanel/db";
import { router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";
import { buildClientConfigFromEnv, getEtimsClient } from "../../lib/etims-config";
import { EtimsApiError } from "../../lib/etims-client";
import { etimsProcedure, skipEtimsAuthChecks } from "./_procedure";

const isSuperAdmin = (role: string | null | undefined) =>
    role === "AGENCY_SUPER_ADMIN";

export const etimsInitializationRouter = router({
    /**
     * Initialize the OSCU device with KRA and obtain the cmcKey.
     *
     * Correct endpoint: POST /selectInitOsdcInfo
     * Headers:  Authorization: Bearer <token>  (NO tin/bhfId/cmcKey yet)
     * Body:     { tin, bhfId, dvcSrlNo }
     * Response: { resultCd: "000", data: { info: { cmcKey, ... } } }
     */
    initializeDevice: etimsProcedure
        .input(z.object({
            tin: z.string().min(1, "TIN is required"),
            bhfId: z.string().default("00"),
            dvcSrlNo: z.string().min(1, "Device serial number is required"),
            isSandbox: z.boolean().default(true),
        }))
        .mutation(async ({ ctx, input }) => {
            if (!skipEtimsAuthChecks() && !isSuperAdmin(ctx.session?.user?.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only agency super admins can initialize eTIMS devices.",
                });
            }

            const tin = input.tin.trim();
            const bhfId = input.bhfId.trim();
            const dvcSrlNo = input.dvcSrlNo.trim();

            // Build client from env (DB record may not exist yet)
            const clientConfig = buildClientConfigFromEnv(input.isSandbox);
            const client = getEtimsClient(clientConfig);

            // Clear any cached token - initialization must use a fresh one
            await client.clearToken();

            let result: Record<string, unknown>;
            try {
                result = await client.selectInitOsdcInfo({ tin, bhfId, dvcSrlNo }) as Record<string, unknown>;
            } catch (error: unknown) {
                // resultCd 902 = "device already installed"
                // In sandbox this is expected when re-initializing  KRA still returns a cmcKey.
                // In production this is a hard error.
                if (error instanceof EtimsApiError && error.resultCd === "902") {
                    if (!input.isSandbox) {
                        throw new TRPCError({
                            code: "PRECONDITION_FAILED",
                            message:
                                "This eTIMS device is already registered on another machine. " +
                                "Contact KRA support to reset the device registration.",
                        });
                    }
                    result = error.response;
                } else {
                    const msg = error instanceof Error ? error.message : String(error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `eTIMS initialization failed: ${msg}`,
                    });
                }
            }

            // Extract cmcKey: response shape is { data: { info: { cmcKey } } }
            const info = (result as {
                data?: { info?: { cmcKey?: string; taxprNm?: string; bhfNm?: string; sdcId?: string; mrcNo?: string } }
            }).data?.info;

            // Upsert the global eTIMS configuration record
            const now = new Date();
            const [existing] = await db
                .select()
                .from(eTimsConfiguration)
                .limit(1);

            // Sandbox re-init may return 902 without a fresh cmcKey  reuse the stored one.
            let cmcKey = info?.cmcKey ?? null;
            if (!cmcKey && input.isSandbox && existing?.cmcKey) {
                cmcKey = existing.cmcKey;
            }
            if (!cmcKey) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message:
                        "eTIMS initialization did not return a cmcKey. " +
                        "Please verify your TIN, Branch ID, and Device Serial Number.",
                });
            }

            const upsertData = {
                kraPin: tin,
                branchId: bhfId,
                branchName: info?.bhfNm ?? existing?.branchName ?? null,
                deviceSerialNumber: dvcSrlNo,
                cmcKey,
                isSandbox: input.isSandbox,
                isInitialized: true,
                updatedAt: now,
            };

            if (existing) {
                await db
                    .update(eTimsConfiguration)
                    .set(upsertData)
                    .where(eq(eTimsConfiguration.id, existing.id));

                return {
                    success: true,
                    cmcKey,
                    configId: existing.id,
                    info: info ?? null,
                    reusedExistingCmcKey: !info?.cmcKey,
                };
            }

            const newId = crypto.randomUUID();
            await db.insert(eTimsConfiguration).values({
                id: newId,
                ...upsertData,
                lastSyncAt: null,
                createdAt: now,
            });

            return {
                success: true,
                cmcKey,
                configId: newId,
                info: info ?? null,
                reusedExistingCmcKey: false,
            };
        }),
});
