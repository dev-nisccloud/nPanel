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
     * Register a new customer from the landing page checkout.
     *
     * Steps (all in sequence, partial failures abort with a TRPCError):
     *  1. Re-check email uniqueness (guard against race condition)
     *  2. Generate temporary password
     *  3. Create user via better-auth.api.signUpEmail
     *  4. FORCE role = "CUSTOMER" regardless of any better-auth default
     *  5. Insert user_profile (first_name, last_name, phone)
     *  6. Insert team (company name, KES, created_by = userId)
     *  7. Insert team_member (userId, teamId, role = "OWNER")
     *  8. Sign a short-lived storefrontToken
     *  9. Fire-and-forget: send welcome email with temp password
     * 10. Return { storefrontToken, teamSlug, displayName }  nothing else
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
