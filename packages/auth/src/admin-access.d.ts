/**
 * Better Auth admin AC mapped onto nPanel's existing `user.role` values.
 * Only AGENCY_SUPER_ADMIN may impersonate; other admin plugin actions stay disabled
 * (agency user management already goes through tRPC).
 */
export declare const adminStatement: {
    readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
    readonly session: readonly ["list", "revoke", "delete"];
};
export declare const adminAcController: {
    newRole<K extends "user" | "session">(statements: import("better-auth/plugins").Subset<K, {
        readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
        readonly session: readonly ["list", "revoke", "delete"];
    }>): {
        authorize<K_1 extends K>(request: K_1 extends infer T extends K_2 ? { [key in T]?: import("better-auth/plugins").Subset<K, {
            readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
            readonly session: readonly ["list", "revoke", "delete"];
        }>[key] | {
            actions: import("better-auth/plugins").Subset<K, {
                readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
                readonly session: readonly ["list", "revoke", "delete"];
            }>[key];
            connector: "OR" | "AND";
        } | undefined; } : never, connector?: "OR" | "AND"): import("better-auth/plugins").AuthorizeResponse;
        statements: import("better-auth/plugins").Subset<K, {
            readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
            readonly session: readonly ["list", "revoke", "delete"];
        }>;
    };
    statements: {
        readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
        readonly session: readonly ["list", "revoke", "delete"];
    };
};
/** Agency super admins: impersonate customers only. */
export declare const agencySuperAdminAc: {
    authorize<K_1 extends "user" | "session">(request: K_1 extends infer T extends K ? { [key in T]?: import("better-auth/plugins").Subset<"user" | "session", {
        readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
        readonly session: readonly ["list", "revoke", "delete"];
    }>[key] | {
        actions: import("better-auth/plugins").Subset<"user" | "session", {
            readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
            readonly session: readonly ["list", "revoke", "delete"];
        }>[key];
        connector: "OR" | "AND";
    } | undefined; } : never, connector?: "OR" | "AND"): import("better-auth/plugins").AuthorizeResponse;
    statements: import("better-auth/plugins").Subset<"user" | "session", {
        readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
        readonly session: readonly ["list", "revoke", "delete"];
    }>;
};
export declare const adminAccessRoles: {
    readonly AGENCY_SUPER_ADMIN: {
        authorize<K_1 extends "user" | "session">(request: K_1 extends infer T extends K ? { [key in T]?: import("better-auth/plugins").Subset<"user" | "session", {
            readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
            readonly session: readonly ["list", "revoke", "delete"];
        }>[key] | {
            actions: import("better-auth/plugins").Subset<"user" | "session", {
                readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
                readonly session: readonly ["list", "revoke", "delete"];
            }>[key];
            connector: "OR" | "AND";
        } | undefined; } : never, connector?: "OR" | "AND"): import("better-auth/plugins").AuthorizeResponse;
        statements: import("better-auth/plugins").Subset<"user" | "session", {
            readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
            readonly session: readonly ["list", "revoke", "delete"];
        }>;
    };
    readonly AGENCY_ADMIN: {
        authorize<K_1 extends "user" | "session">(request: K_1 extends infer T extends K ? { [key in T]?: import("better-auth/plugins").Subset<"user" | "session", {
            readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
            readonly session: readonly ["list", "revoke", "delete"];
        }>[key] | {
            actions: import("better-auth/plugins").Subset<"user" | "session", {
                readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
                readonly session: readonly ["list", "revoke", "delete"];
            }>[key];
            connector: "OR" | "AND";
        } | undefined; } : never, connector?: "OR" | "AND"): import("better-auth/plugins").AuthorizeResponse;
        statements: import("better-auth/plugins").Subset<"user" | "session", {
            readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
            readonly session: readonly ["list", "revoke", "delete"];
        }>;
    };
    readonly AGENCY_USER: {
        authorize<K_1 extends "user" | "session">(request: K_1 extends infer T extends K ? { [key in T]?: import("better-auth/plugins").Subset<"user" | "session", {
            readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
            readonly session: readonly ["list", "revoke", "delete"];
        }>[key] | {
            actions: import("better-auth/plugins").Subset<"user" | "session", {
                readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
                readonly session: readonly ["list", "revoke", "delete"];
            }>[key];
            connector: "OR" | "AND";
        } | undefined; } : never, connector?: "OR" | "AND"): import("better-auth/plugins").AuthorizeResponse;
        statements: import("better-auth/plugins").Subset<"user" | "session", {
            readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
            readonly session: readonly ["list", "revoke", "delete"];
        }>;
    };
    readonly CUSTOMER: {
        authorize<K_1 extends "user" | "session">(request: K_1 extends infer T extends K ? { [key in T]?: import("better-auth/plugins").Subset<"user" | "session", {
            readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
            readonly session: readonly ["list", "revoke", "delete"];
        }>[key] | {
            actions: import("better-auth/plugins").Subset<"user" | "session", {
                readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
                readonly session: readonly ["list", "revoke", "delete"];
            }>[key];
            connector: "OR" | "AND";
        } | undefined; } : never, connector?: "OR" | "AND"): import("better-auth/plugins").AuthorizeResponse;
        statements: import("better-auth/plugins").Subset<"user" | "session", {
            readonly user: readonly ["create", "list", "set-role", "ban", "impersonate", "impersonate-admins", "delete", "set-password", "get", "update"];
            readonly session: readonly ["list", "revoke", "delete"];
        }>;
    };
};
/** Roles that must never be impersonation targets (agency staff). */
export declare const agencyAdminRoles: readonly ["AGENCY_SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_USER"];
export declare const IMPERSONATION_SESSION_DURATION_SEC: number;
