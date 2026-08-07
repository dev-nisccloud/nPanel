import { type SQL } from "@npanel/db";
import { nebDesign } from "@npanel/db/schema/nisc-email-builder";
export declare function isAgencyUserRole(role: string | null | undefined): boolean;
export declare function isAgencySuperAdminRole(role: string | null | undefined): boolean;
/** Only agency super admins may list or modify designs they do not own. */
export declare function canManageAllNebDesigns(role: string | null | undefined): boolean;
/**
 * List filter: everyone sees only their own designs; super admin may see all
 * (optionally scoped by teamId).
 */
export declare function buildNebDesignListWhere(params: {
    userId: string;
    userRole?: string | null;
    teamId?: string;
}): SQL | undefined;
/**
 * Check READ access: Owner, team member, or agency user can view.
 */
export declare function assertDesignReadAccess(params: {
    designId: string;
    userId: string;
    userRole?: string | null;
}): Promise<typeof nebDesign.$inferSelect>;
/**
 * Check MUTATION access: Only owner OR agency super admin can mutate.
 */
export declare function assertDesignMutateAccess(params: {
    designId: string;
    userId: string;
    userRole?: string | null;
}): Promise<typeof nebDesign.$inferSelect>;
/**
 * Legacy: For backward compatibility, use read access.
 * @deprecated Use assertDesignReadAccess or assertDesignMutateAccess explicitly.
 */
export declare function assertDesignAccess(params: {
    designId: string;
    userId: string;
    userRole?: string | null;
}): Promise<typeof nebDesign.$inferSelect>;
