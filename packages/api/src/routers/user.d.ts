export declare const userRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    getNotificationPreferences: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            notificationSoundEnabled: boolean;
            browserNotificationsEnabled: boolean;
            notificationSoundVolume: number;
            browserNotificationPermission: "default" | "granted" | "denied" | null;
            notificationPreferencesUpdatedAt: Date | null;
        };
        meta: object;
    }>;
    updateNotificationPreferences: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            notificationSoundEnabled?: boolean | undefined;
            browserNotificationsEnabled?: boolean | undefined;
            notificationSoundVolume?: number | undefined;
            browserNotificationPermission?: "default" | "granted" | "denied" | undefined;
        };
        output: {
            notificationSoundEnabled: boolean;
            browserNotificationsEnabled: boolean;
            notificationSoundVolume: number;
            browserNotificationPermission: "default" | "granted" | "denied" | null;
            notificationPreferencesUpdatedAt: Date | null;
        };
        meta: object;
    }>;
}>>;
