import { type SQL } from "@npanel/db";
type ActorRole = string | null | undefined;
export declare function isAgencyUserRole(role: ActorRole): boolean;
export declare function resolveReportReadScope(params: {
    userId: string;
    role: ActorRole;
    requestedTeamIds?: string[];
}): Promise<{
    isAgencyUser: boolean;
    userId: string;
    teamIds: string[];
}>;
export declare function buildOwnerOrTeamReadScope(params: {
    isAgencyUser: boolean;
    ownerCondition: SQL<unknown>;
    teamColumn: any;
    teamIds: string[];
}): SQL<unknown> | undefined;
export declare function buildTeamReadScope(params: {
    isAgencyUser: boolean;
    teamColumn: any;
    teamIds: string[];
}): SQL<unknown> | undefined;
export {};
