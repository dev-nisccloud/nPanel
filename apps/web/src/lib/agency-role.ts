import { authClient } from "@/lib/auth-client";

const AGENCY_ROLES = new Set(["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"]);

export function isAgencyRole(role: string | null | undefined) {
  return AGENCY_ROLES.has(role ?? "");
}

export function useIsAgencyRole() {
  const { data: session } = authClient.useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  return isAgencyRole(role);
}
