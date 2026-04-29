import { router, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { eTimsConfiguration } from "@npanel/db/schema/etims";

const isAgencyUser = (role: string | null | undefined) =>
    ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role ?? "");

export const etimsAuthRouter = router({
    /**
     * Get current eTIMS configuration status.
     * Used by the frontend to know if the device is initialized.
     */
    getConfiguration: protectedProcedure
        .query(async ({ ctx }) => {
            if (!isAgencyUser(ctx.session?.user?.role)) {
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

            return {
                isInitialized: config.isInitialized,
                config: {
                    kraPin: config.kraPin,
                    branchId: config.branchId,
                    deviceSerialNumber: config.deviceSerialNumber,
                    isSandbox: config.isSandbox,
                    updatedAt: config.updatedAt,
                },
            };
        }),
});
