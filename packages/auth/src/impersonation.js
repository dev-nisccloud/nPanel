/** True when this session was created via Better Auth admin impersonation. */
export function isImpersonatedSession(session) {
    const by = session?.impersonatedBy;
    return typeof by === "string" && by.length > 0;
}
