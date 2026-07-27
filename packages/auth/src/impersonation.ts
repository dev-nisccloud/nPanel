/** True when this session was created via Better Auth admin impersonation. */
export function isImpersonatedSession(session: {
  impersonatedBy?: string | null;
} | null | undefined): boolean {
  const by = session?.impersonatedBy;
  return typeof by === "string" && by.length > 0;
}
