export declare function processSeoSuiteRankTracker(input: {
    trackerId: string;
    projectId: string;
    userId?: string;
}): Promise<{
    checked: number;
}>;
export declare function processSeoSuiteAuditRun(input: {
    auditRunId: string;
    projectId: string;
    userId?: string;
}): Promise<{
    ok: boolean;
}>;
