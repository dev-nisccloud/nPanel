import { z } from "zod";
export type TeamHivelocityResourceCategory = "vps" | "vds" | "dedicated";
/** Optional team scope for Hivelocity device calls - both fields required together. */
export declare const teamHivelocityAccessSchema: z.ZodObject<{
    teamSlug: z.ZodOptional<z.ZodString>;
    teamResourceCategory: z.ZodOptional<z.ZodEnum<{
        vps: "vps";
        vds: "vds";
        dedicated: "dedicated";
    }>>;
}, z.core.$strip>;
export declare const isAgencyUserRole: (role: string | null | undefined) => boolean;
export type TeamHivelocitySubscriptionContext = {
    subscriptionId: string;
    status: string;
    name: string | null;
    agreedPrice: string | null;
    agreedCurrency: string | null;
    billingCycle: string | null;
    productId: string;
    productName: string;
    productPlanName: string | null;
};
/** Subscription rows linked to Hivelocity devices for a team + product category. */
export declare function collectTeamHivelocitySubscriptionContext(teamId: string, category: TeamHivelocityResourceCategory): Promise<Map<number, TeamHivelocitySubscriptionContext>>;
export declare function buildHivelocitySubscriptionServiceLabel(ctx: TeamHivelocitySubscriptionContext): string;
export declare function redactSuspendedHivelocityResourceForCustomer(deviceId: number, resourceType: TeamHivelocityResourceCategory, sub: TeamHivelocitySubscriptionContext): {
    deviceId: number;
    id: number;
    resourceType: TeamHivelocityResourceCategory;
    panelSuspended: true;
    subscriptionId: string;
    serviceLabel: string;
    reactivationAmount: number;
    reactivationCurrency: string;
    billingCycle: string | null;
    productId: string;
};
export declare function getTeamIdBySlugForHivelocity(slug: string): Promise<string | null>;
export declare function assertUserCanReadTeamCloud(teamId: string, userId: string, role: string | null | undefined): Promise<void>;
/**
 * Device IDs linked to the team via nisc_client_subscription.serviceRefs.hivelocityDeviceId
 * for products whose names match the cloud category (same naming as subscription creation UI).
 */
export declare function collectHivelocityDeviceIdsForTeam(teamId: string, category: TeamHivelocityResourceCategory): Promise<Set<number>>;
export declare function assertHivelocityDeviceLinkedToTeam(params: {
    teamSlug: string;
    deviceId: number;
    category: TeamHivelocityResourceCategory;
    userId: string;
    role: string | null | undefined;
}): Promise<void>;
type SessionUser = {
    id: string;
    role: string | null;
};
export declare function maybeAssertTeamHivelocityDeviceAccess(params: {
    ctx: {
        session: {
            user: SessionUser;
        } | null;
    };
    input: {
        deviceId?: number;
        teamSlug?: string;
        teamResourceCategory?: TeamHivelocityResourceCategory;
    };
}): Promise<void>;
export {};
