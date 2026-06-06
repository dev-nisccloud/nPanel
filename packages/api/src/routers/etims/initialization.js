import * as crypto from "node:crypto";
import { z } from "zod";
import { eq } from "@npanel/db";
import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";
import { buildClientConfigFromEnv, getEtimsClient } from "../../lib/etims-config";
const isSuperAdmin = (role) => role === "AGENCY_SUPER_ADMIN";
export const etimsInitializationRouter = router({
    /**
     * Initialize the OSCU device with KRA and obtain the cmcKey.
     *
     * Correct endpoint: POST /selectInitOsdcInfo
     * Headers:  Authorization: Bearer <token>  (NO tin/bhfId/cmcKey yet)
     * Body:     { tin, bhfId, dvcSrlNo }
     * Response: { resultCd: "000", data: { info: { cmcKey, ... } } }
     */
    initializeDevice: protectedProcedure
        .input(z.object({
        tin: z.string().min(1, "TIN is required"),
        bhfId: z.string().default("00"),
        dvcSrlNo: z.string().min(1, "Device serial number is required"),
        isSandbox: z.boolean().default(true),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!isSuperAdmin(ctx.session?.user?.role)) {
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
        let result;
        try {
            result = await client.selectInitOsdcInfo({ tin, bhfId, dvcSrlNo });
        }
        catch (error) {
            const err = error;
            const msg = err.message ?? "";
            // resultCd 902 = "device already installed"
            // In sandbox this is expected when re-initializing - KRA still returns a cmcKey.
            // In production this is a hard error.
            if (msg.includes("resultCd=902")) {
                if (!input.isSandbox) {
                    throw new TRPCError({
                        code: "PRECONDITION_FAILED",
                        message: "This eTIMS device is already registered on another machine. " +
                            "Contact KRA support to reset the device registration.",
                    });
                }
                // Sandbox: attempt to parse cmcKey from the error payload if present
                // (KRA returns the body even on 902 in sandbox)
                // We'll fall through with an empty result and handle below
            }
            else {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `eTIMS initialization failed: ${msg}`,
                });
            }
            // For sandbox 902, try to re-parse as a soft result
            result = {};
        }
        // Extract cmcKey: response shape is { data: { info: { cmcKey } } }
        const info = result.data?.info;
        const cmcKey = info?.cmcKey;
        if (!cmcKey) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "eTIMS initialization did not return a cmcKey. " +
                    "Please verify your TIN, Branch ID, and Device Serial Number.",
            });
        }
        // Upsert the global eTIMS configuration record
        const now = new Date();
        const [existing] = await db
            .select({ id: eTimsConfiguration.id })
            .from(eTimsConfiguration)
            .limit(1);
        const upsertData = {
            kraPin: tin,
            branchId: bhfId,
            branchName: info?.bhfNm ?? null,
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
        };
    }),
});
