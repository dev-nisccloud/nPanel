export declare function isAgencyUserRole(role: string | null | undefined): boolean;
/** DB-backed agency check (role or assigned agency RBAC role). */
export declare function userIsAgencyStaff(userId: string): Promise<boolean>;
export declare function getMemberTeamIds(userId: string): Promise<string[]>;
export declare function assertAgencyStaff(userId: string): Promise<void>;
/** DB role must be AGENCY_SUPER_ADMIN. Session role is not trusted. */
export declare function assertAgencySuperAdmin(userId: string): Promise<void>;
