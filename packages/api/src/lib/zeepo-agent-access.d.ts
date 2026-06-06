export declare function assertUserIsTeamMember(userId: string, teamId: string): Promise<void>;
/** Customers must pass teamId and be a member; agency users may omit teamId. */
export declare function assertZeepoAgentTeamAccess(params: {
    userId: string;
    userRole: string | null | undefined;
    teamId: string | null | undefined;
}): Promise<string | null>;
export declare function assertZeepoAgentSubscriptionForTeam(teamId: string): Promise<void>;
/** Customer session create: must have active subscription (PAYG counts). */
export declare function assertCustomerCanUseZeepoAgent(params: {
    userId: string;
    userRole: string | null | undefined;
    teamId: string | null | undefined;
    requireTokens?: boolean;
}): Promise<string | null>;
export declare function getZeepoAgentSubscriptionSummary(teamId: string): Promise<{
    hasSubscription: boolean;
    subscriptionId: string | null;
    tokens: number;
}>;
