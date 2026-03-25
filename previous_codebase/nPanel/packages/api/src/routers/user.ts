import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import prisma from "@npanel/db";

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

export const userRouter = router({
    // Get current user's notification preferences
    getNotificationPreferences: protectedProcedure
        .output(notificationPreferencesSchema)
        .query(async ({ ctx }) => {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new Error("Unauthorized");
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    notificationSoundEnabled: true,
                    browserNotificationsEnabled: true,
                    notificationSoundVolume: true,
                    browserNotificationPermission: true,
                    notificationPreferencesUpdatedAt: true,
                },
            });

            if (!user) {
                throw new Error("User not found");
            }

            return {
                notificationSoundEnabled: user.notificationSoundEnabled ?? true,
                browserNotificationsEnabled: user.browserNotificationsEnabled ?? false,
                notificationSoundVolume: user.notificationSoundVolume ?? 100,
                browserNotificationPermission: (user.browserNotificationPermission as "default" | "granted" | "denied" | null) ?? "default",
                notificationPreferencesUpdatedAt: user.notificationPreferencesUpdatedAt,
            };
        }),

    // Update notification preferences
    updateNotificationPreferences: protectedProcedure
        .input(updateNotificationPreferencesInputSchema)
        .output(notificationPreferencesSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session?.user?.id;
            if (!userId) {
                throw new Error("Unauthorized");
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    ...input,
                    notificationPreferencesUpdatedAt: new Date(),
                },
                select: {
                    notificationSoundEnabled: true,
                    browserNotificationsEnabled: true,
                    notificationSoundVolume: true,
                    browserNotificationPermission: true,
                    notificationPreferencesUpdatedAt: true,
                },
            });

            return {
                notificationSoundEnabled: updatedUser.notificationSoundEnabled ?? true,
                browserNotificationsEnabled: updatedUser.browserNotificationsEnabled ?? false,
                notificationSoundVolume: updatedUser.notificationSoundVolume ?? 100,
                browserNotificationPermission: (updatedUser.browserNotificationPermission as "default" | "granted" | "denied" | null) ?? "default",
                notificationPreferencesUpdatedAt: updatedUser.notificationPreferencesUpdatedAt,
            };
        }),
});
