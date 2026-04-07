export declare function ensurePleskIntegration(teamOwnerId: string, createdBy: string): Promise<string>;
export declare function provisionToPlesk(input: {
    domainName: string;
    pleskOwnerId: string;
    pleskServicePlanId: string;
    ipAddress?: string;
    description?: string;
    adminDescription?: string;
}): Promise<{
    pleskServiceId: string;
    pleskFtpLogin: string;
    pleskFtpPassword: string;
    pleskStatus: number;
    pleskGuid: string | null;
    pleskResponseData: any;
}>;
