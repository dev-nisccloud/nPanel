import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { eq } from "@npanel/db";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";

// Schema for notification preferences
const notificationPreferencesSchema = z.object({
    notificationSoundEnabled: z.boolean(),
    browserNotificationsEnabled: z.boolean(),
    notificationSoundVolume: z.number().min(0).max(100),
    browserNotificationPermission: z.enum(["default", "granted", "denied"]).nullable(),
    notificationPreferencesUpdatedAt: z.date().nullable(),
});

const updateNotificationPreferencesInputSchema = z.object({
    notificationSoundEnabled: z.boolean().optional(),
    browserNotificationsEnabled: z.boolean().optional(),
    notificationSoundVolume: z.number().min(0).max(100).optional(),
    browserNotificationPermission: z.enum(["default", "granted", "denied"]).optional(),
});

function getActorId(ctx: { session: { user?: { id?: string } } | null }) {
    const userId = ctx.session?.user?.id;
    if (!userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
    }
    return userId;
}

export const userRouter = router({
    // Get current user's notification preferences
    getNotificationPreferences: protectedProcedure
        .output(notificationPreferencesSchema)
        .query(async ({ ctx }) => {
            const userId = getActorId(ctx);

            const [userRow] = await db
                .select({
                    notificationSoundEnabled: user.notificationSoundEnabled,
                    browserNotificationsEnabled: user.browserNotificationsEnabled,
                    notificationSoundVolume: user.notificationSoundVolume,
                    browserNotificationPermission: user.browserNotificationPermission,
                    notificationPreferencesUpdatedAt: user.notificationPreferencesUpdatedAt,
                })
                .from(user)
                .where(eq(user.id, userId))
                .limit(1);

            if (!userRow) {
                throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
            }

            return {
                notificationSoundEnabled: userRow.notificationSoundEnabled ?? true,
                browserNotificationsEnabled: userRow.browserNotificationsEnabled ?? false,
                notificationSoundVolume: userRow.notificationSoundVolume ?? 100,
                browserNotificationPermission: (userRow.browserNotificationPermission as "default" | "granted" | "denied" | null) ?? "default",
                notificationPreferencesUpdatedAt: userRow.notificationPreferencesUpdatedAt,
            };
        }),

    // Update notification preferences
    updateNotificationPreferences: protectedProcedure
        .input(updateNotificationPreferencesInputSchema)
        .output(notificationPreferencesSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = getActorId(ctx);

            const [updatedUser] = await db
                .update(user)
                .set({
                    ...input,
                    notificationPreferencesUpdatedAt: new Date(),
                })
                .where(eq(user.id, userId))
                .returning({
                    notificationSoundEnabled: user.notificationSoundEnabled,
                    browserNotificationsEnabled: user.browserNotificationsEnabled,
                    notificationSoundVolume: user.notificationSoundVolume,
                    browserNotificationPermission: user.browserNotificationPermission,
                    notificationPreferencesUpdatedAt: user.notificationPreferencesUpdatedAt,
                });

            if (!updatedUser) {
                throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
            }

            return {
                notificationSoundEnabled: updatedUser.notificationSoundEnabled ?? true,
                browserNotificationsEnabled: updatedUser.browserNotificationsEnabled ?? false,
                notificationSoundVolume: updatedUser.notificationSoundVolume ?? 100,
                browserNotificationPermission: (updatedUser.browserNotificationPermission as "default" | "granted" | "denied" | null) ?? "default",
                notificationPreferencesUpdatedAt: updatedUser.notificationPreferencesUpdatedAt,
            };
        }),
});
