export declare function assertUserIsTeamMember(userId: string, teamId: string): Promise<void>;
export declare function assertZeepoAiTeamAccess(params: {
    userId: string;
    userRole: string | null | undefined;
    teamId: string | null | undefined;
}): Promise<string | null>;
export declare function assertZeepoAiSubscriptionForTeam(teamId: string): Promise<void>;
export declare function assertCustomerCanUseZeepoAi(params: {
    userId: string;
    userRole: string | null | undefined;
    teamId: string | null | undefined;
    requireTokens?: boolean;
    tryWelcomeGrant?: boolean;
}): Promise<string | null>;
export declare function getZeepoAiSubscriptionSummary(teamId: string): Promise<{
    hasSubscription: boolean;
    subscriptionId: string | null;
    tokens: number;
}>;
