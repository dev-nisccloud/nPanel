export declare function getTeamLiveDomainsSummary(teamId: string): Promise<{
    total: number;
    active: number;
    expired: number;
}>;
