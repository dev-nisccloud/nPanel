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
    getEmailPreferences: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            generalEmailsAccepted: boolean | null;
            invoiceEmailsAccepted: boolean | null;
            supportEmailsAccepted: boolean | null;
            productEmailsAccepted: boolean | null;
            domainEmailsAccepted: boolean | null;
            affiliateEmailsAccepted: boolean | null;
            marketingEmailsAccepted: boolean | null;
            smsMarketingAccepted: boolean | null;
        };
        meta: object;
    }>;
    updateEmailPreferences: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            generalEmailsAccepted?: boolean | null | undefined;
            invoiceEmailsAccepted?: boolean | null | undefined;
            supportEmailsAccepted?: boolean | null | undefined;
            productEmailsAccepted?: boolean | null | undefined;
            domainEmailsAccepted?: boolean | null | undefined;
            affiliateEmailsAccepted?: boolean | null | undefined;
            marketingEmailsAccepted?: boolean | null | undefined;
            smsMarketingAccepted?: boolean | null | undefined;
        };
        output: {
            generalEmailsAccepted: boolean | null;
            invoiceEmailsAccepted: boolean | null;
            supportEmailsAccepted: boolean | null;
            productEmailsAccepted: boolean | null;
            domainEmailsAccepted: boolean | null;
            affiliateEmailsAccepted: boolean | null;
            marketingEmailsAccepted: boolean | null;
            smsMarketingAccepted: boolean | null;
        };
        meta: object;
    }>;
}>>;
