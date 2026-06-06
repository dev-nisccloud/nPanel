export declare function isAgencyUserRole(role: string | null | undefined): boolean;
/** DB-backed agency check (role or assigned agency RBAC role). */
export declare function userIsAgencyStaff(userId: string): Promise<boolean>;
export declare function getMemberTeamIds(userId: string): Promise<string[]>;
