/**
 * Storefront auth procedures  public landing page only.
 *
 * Security rules enforced here:
 *  • Role is ALWAYS "CUSTOMER"  it is NEVER taken from input, NEVER variable.
 *  • A forced db.update({ role: "CUSTOMER" }) runs after better-auth creates
 *    the account, neutralising any default better-auth may assign.
 *  • Input schema has no `role` field at all.
 *  • `checkEmail` returns only { exists: boolean }  no names, IDs, or metadata.
 *  • `register` returns only a short-lived storefrontToken + minimal display data.
 *  • `checkoutIdentity` / `issueCheckoutToken` / `completeProfile` /
 *    `createOrganization` may read an optional Better Auth session from
 *    LANDING_PAGE_ORIGINS only; they never call dashboard routers.
 *  • Profile + organization mutations always scope to `ctx.session.user.id`
 *    (never accept a userId from input). Organization role is always OWNER.
 */
export declare const storefrontAuthRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: import("../..").Context;
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    /**
     * Check whether an email address is already registered.
     * Returns ONLY { exists: boolean }  never exposes any user data.
     *
     * Rate limit: enforced upstream (server middleware / Cloudflare).
     */
    checkEmail: import("@trpc/server").TRPCQueryProcedure<{
        input: {
            email: string;
        };
        output: {
            exists: boolean;
        };
        meta: object;
    }>;
    /**
     * Single cart probe: is the browser signed into nPanel?
     * Returns auth flag, display name, profile completeness (for domain-grade KYC),
     * and purchase-eligible organizations for this user only.
     */
    checkoutIdentity: import("@trpc/server").TRPCQueryProcedure<{
        input: void;
        output: {
            authenticated: false;
        } | {
            authenticated: true;
            user: {
                id: string;
                name: string;
                email: string;
            };
            profile: {
                complete: boolean;
                missing: ("city" | "country" | "postalCode" | "phone" | "firstName" | "lastName" | "address")[];
                prefill: {
                    firstName: string;
                    lastName: string;
                    phone: string;
                    address: string;
                    city: string;
                    state: string;
                    country: string;
                    postalCode: string;
                };
            };
            teams: {
                id: string;
                name: string;
                slug: string;
                role: "MEMBER" | "OWNER" | "ADMIN" | "VIEWER";
            }[];
        };
        meta: object;
    }>;
    /**
     * Complete the caller's own profile for storefront purchases (domains, etc.).
     * userId is taken only from the session  never from input.
     */
    completeProfile: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            firstName: string;
            lastName: string;
            phone: string;
            address: string;
            city: string;
            country: string;
            postalCode: string;
            state?: string | undefined;
        };
        output: {
            complete: boolean;
            missing: ("city" | "country" | "postalCode" | "phone" | "firstName" | "lastName" | "address")[];
            displayName: string;
            prefill: {
                firstName: string;
                lastName: string;
                phone: string;
                address: string;
                city: string;
                state: string;
                country: string;
                postalCode: string;
            };
        };
        meta: object;
    }>;
    /**
     * Create an organization (team) for the signed-in caller as OWNER.
     * Name comes from input; role is always OWNER; no dashboard routers.
     */
    createOrganization: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            name: string;
        };
        output: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            name: string;
            slug: string;
            role: "OWNER";
        };
        meta: object;
    }>;
    /**
     * Issue a short-lived storefrontToken for an existing session + selected team.
     * Requires complete profile + OWNER/ADMIN membership.
     */
    issueCheckoutToken: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            teamId: string;
        };
        output: {
            storefrontToken: string;
            teamSlug: string;
        };
        meta: object;
    }>;
    /**
     * Register a new customer from the landing page checkout.
     *
     * Steps (all in sequence, partial failures abort with a TRPCError):
     *  1. Re-check email uniqueness (guard against race condition)
     *  2. Create user via better-auth.api.signUpEmail (password from checkout form)
     *  3. FORCE role = "CUSTOMER" regardless of any better-auth default
     *  4. Insert user_profile (first_name, last_name, phone)
     *  5. Insert team (company name, KES, created_by = userId)
     *  6. Insert team_member (userId, teamId, role = "OWNER")
     *  7. Sign a short-lived storefrontToken
     *  8. Return { storefrontToken, teamSlug, displayName }  nothing else
     *
     * Role is NEVER accepted from input. It is always "CUSTOMER". Period.
     */
    register: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            companyName: string;
            password: string;
            acceptedTermsAndConditions: boolean;
            planName?: string | undefined;
        };
        output: {
            storefrontToken: string;
            teamSlug: string;
            displayName: string;
        };
        meta: object;
    }>;
}>>;
