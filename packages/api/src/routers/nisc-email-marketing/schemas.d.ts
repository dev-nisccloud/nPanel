import { z } from "zod";
export declare const niscEmailDomainStatusSchema: z.ZodEnum<{
    PENDING: "PENDING";
    FAILED: "FAILED";
    VERIFIED: "VERIFIED";
    DELETING: "DELETING";
}>;
export type NiscEmailDomainStatus = z.infer<typeof niscEmailDomainStatusSchema>;
export declare const niscDkimStatusSchema: z.ZodEnum<{
    NotStarted: "NotStarted";
    Pending: "Pending";
    Success: "Success";
    Failed: "Failed";
    TemporaryFailure: "TemporaryFailure";
}>;
export type NiscDkimStatus = z.infer<typeof niscDkimStatusSchema>;
export declare const niscMailFromModeSchema: z.ZodEnum<{
    DEFAULT: "DEFAULT";
    CUSTOM: "CUSTOM";
}>;
export type NiscMailFromMode = z.infer<typeof niscMailFromModeSchema>;
export declare const niscEmailDomainCreateInputSchema: z.ZodObject<{
    domainName: z.ZodString;
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export type NiscEmailDomainCreateInput = z.infer<typeof niscEmailDomainCreateInputSchema>;
export declare const niscEmailDomainVerifyInputSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type NiscEmailDomainVerifyInput = z.infer<typeof niscEmailDomainVerifyInputSchema>;
export declare const niscEmailDomainListFiltersSchema: z.ZodObject<{
    teamId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        PENDING: "PENDING";
        FAILED: "FAILED";
        VERIFIED: "VERIFIED";
        DELETING: "DELETING";
    }>>;
    search: z.ZodDefault<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, z.core.$strip>;
export type NiscEmailDomainListFilters = z.infer<typeof niscEmailDomainListFiltersSchema>;
export declare const niscEmailDomainSummarySchema: z.ZodObject<{
    id: z.ZodString;
    domainName: z.ZodString;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        FAILED: "FAILED";
        VERIFIED: "VERIFIED";
        DELETING: "DELETING";
    }>;
    dkimStatus: z.ZodEnum<{
        NotStarted: "NotStarted";
        Pending: "Pending";
        Success: "Success";
        Failed: "Failed";
        TemporaryFailure: "TemporaryFailure";
    }>;
    mailFromMode: z.ZodEnum<{
        DEFAULT: "DEFAULT";
        CUSTOM: "CUSTOM";
    }>;
    mailFromStatus: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    verifiedAt: z.ZodNullable<z.ZodDate>;
}, z.core.$strip>;
export type NiscEmailDomainSummary = z.infer<typeof niscEmailDomainSummarySchema>;
export declare const niscEmailDomainDetailSchema: z.ZodObject<{
    id: z.ZodString;
    domainName: z.ZodString;
    status: z.ZodEnum<{
        PENDING: "PENDING";
        FAILED: "FAILED";
        VERIFIED: "VERIFIED";
        DELETING: "DELETING";
    }>;
    dkimStatus: z.ZodEnum<{
        NotStarted: "NotStarted";
        Pending: "Pending";
        Success: "Success";
        Failed: "Failed";
        TemporaryFailure: "TemporaryFailure";
    }>;
    mailFromMode: z.ZodEnum<{
        DEFAULT: "DEFAULT";
        CUSTOM: "CUSTOM";
    }>;
    mailFromStatus: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    userId: z.ZodString;
    teamId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    verifiedAt: z.ZodNullable<z.ZodDate>;
    dkimTokens: z.ZodArray<z.ZodString>;
    dnsRecords: z.ZodNullable<z.ZodOptional<z.ZodUnknown>>;
    mailFromDomain: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    feedbackForwardingDisabled: z.ZodBoolean;
}, z.core.$strip>;
export type NiscEmailDomainDetail = z.infer<typeof niscEmailDomainDetailSchema>;
export declare const niscEmailDomainListResponseSchema: z.ZodObject<{
    domains: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        domainName: z.ZodString;
        status: z.ZodEnum<{
            PENDING: "PENDING";
            FAILED: "FAILED";
            VERIFIED: "VERIFIED";
            DELETING: "DELETING";
        }>;
        dkimStatus: z.ZodEnum<{
            NotStarted: "NotStarted";
            Pending: "Pending";
            Success: "Success";
            Failed: "Failed";
            TemporaryFailure: "TemporaryFailure";
        }>;
        mailFromMode: z.ZodEnum<{
            DEFAULT: "DEFAULT";
            CUSTOM: "CUSTOM";
        }>;
        mailFromStatus: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        userId: z.ZodString;
        teamId: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        verifiedAt: z.ZodNullable<z.ZodDate>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
}, z.core.$strip>;
export type NiscEmailDomainListResponse = z.infer<typeof niscEmailDomainListResponseSchema>;
export declare const niscEmailQuotaStatusSchema: z.ZodObject<{
    windowStart: z.ZodDate;
    windowEnd: z.ZodDate;
    maxSendRate: z.ZodNumber;
    max24HourSend: z.ZodNumber;
    sentLast24HoursAtStart: z.ZodNumber;
    reservedEmails: z.ZodNumber;
    remainingEmails: z.ZodNumber;
}, z.core.$strip>;
export type NiscEmailQuotaStatus = z.infer<typeof niscEmailQuotaStatusSchema>;
