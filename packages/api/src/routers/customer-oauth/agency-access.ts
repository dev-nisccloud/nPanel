const AGENCY_ROLES = new Set(["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"]);

export function isAgencyRole(role: string | null | undefined): boolean {
  return AGENCY_ROLES.has(role ?? "");
}

export function sessionIsAgency(user: { role?: string | null }): boolean {
  return isAgencyRole(user.role);
}
