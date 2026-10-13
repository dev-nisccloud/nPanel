import { router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";
import { loadDeviceSdcId } from "../../lib/etims-config";
import { etimsProcedure, skipEtimsAuthChecks } from "./_procedure";

const isAgencyUser = (role: string | null | undefined) =>
    ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

export const etimsAuthRouter = router({
    /**
     * Get current eTIMS configuration status.
     * Used by the frontend to know if the device is initialized.
     */
    getConfiguration: etimsProcedure
        .query(async ({ ctx }) => {
            if (!skipEtimsAuthChecks() && !isAgencyUser(ctx.session?.user?.role)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Only agency users can view eTIMS configuration.",
                });
            }

            const [config] = await db
                .select()
                .from(eTimsConfiguration)
                .limit(1);

            if (!config) {
                return { isInitialized: false, config: null };
            }

            const sdcId = await loadDeviceSdcId(config);

            return {
                isInitialized: config.isInitialized,
                config: {
                    kraPin: config.kraPin,
                    branchId: config.branchId,
                    deviceSerialNumber: config.deviceSerialNumber,
                    isSandbox: config.isSandbox,
                    sdcId,
                    updatedAt: config.updatedAt,
                },
            };
        }),
});
