export declare function isAgencyUserRole(role: string | null | undefined): boolean;
/**
 * Agency staff may act on any Plesk webspace. Customers must have a linked
 * nisc_client_subscription (or legacy service_subscription) for a team they can read.
 */
export declare function assertCanAccessPleskSite(params: {
    siteId: number;
    userId: string;
    role: string | null | undefined;
    teamId?: string;
}): Promise<void>;
