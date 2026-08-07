/** True when this session was created via Better Auth admin impersonation. */
export declare function isImpersonatedSession(session: {
    impersonatedBy?: string | null;
} | null | undefined): boolean;
