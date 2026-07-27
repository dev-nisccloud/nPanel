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

import * as crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, eq, inArray } from "@npanel/db";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { userProfile } from "@npanel/db/schema/auth-extras";
import { team, teamMember } from "@npanel/db/schema/teams";
import { isAllowedStorefrontBrowserRequest } from "@npanel/auth/landing-page-origins";
import { countries } from "@npanel/location/countries-intl";
import { publicProcedure, router } from "../../trpc";
import { auth } from "@npanel/auth";
import { signStorefrontToken } from "../../lib/storefront-token";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PURCHASE_ROLES = ["OWNER", "ADMIN"] as const;
type PurchaseRole = (typeof PURCHASE_ROLES)[number];

const PROFILE_REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "address",
  "city",
  "country",
  "postalCode",
] as const;
type ProfileRequiredField = (typeof PROFILE_REQUIRED_FIELDS)[number];

/** Max organizations a user may create via the storefront (abuse cap). */
const STOREFRONT_MAX_OWNED_ORGS = 20;

function isPurchaseRole(role: string): role is PurchaseRole {
  return (PURCHASE_ROLES as readonly string[]).includes(role);
}

function trimOrEmpty(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Accept ISO alpha-2 or catalog country name; return canonical name or "". */
function normalizeCountryName(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  const byName = countries.find(
    (c) => c.name.toLowerCase() === value.toLowerCase(),
  );
  if (byName) return byName.name;
  const byCode = countries.find(
    (c) => c.alpha2.toLowerCase() === value.toLowerCase(),
  );
  return byCode?.name ?? "";
}

function evaluateProfileCompleteness(profile: {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
} | null | undefined): {
  complete: boolean;
  missing: ProfileRequiredField[];
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
} {
  const prefill = {
    firstName: trimOrEmpty(profile?.firstName),
    lastName: trimOrEmpty(profile?.lastName),
    phone: trimOrEmpty(profile?.phone),
    address: trimOrEmpty(profile?.address),
    city: trimOrEmpty(profile?.city),
    state: trimOrEmpty(profile?.state),
    country: normalizeCountryName(trimOrEmpty(profile?.country)) || "Kenya",
    postalCode: trimOrEmpty(profile?.postalCode),
  };
  const missing = PROFILE_REQUIRED_FIELDS.filter((field) => !prefill[field]);
  return { complete: missing.length === 0, missing: [...missing], prefill };
}

async function requireStorefrontSessionUser(ctx: {
  session?: { user?: { id?: string; name?: string | null } | null } | null;
  req?: { raw?: { headers?: Headers } };
}): Promise<{ userId: string; displayName: string }> {
  assertLandingPageOrigin(requestHeaders(ctx), "hard");
  const sessionUser = ctx.session?.user;
  if (!sessionUser?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in to nPanel to continue checkout.",
    });
  }
  const displayName =
    (typeof sessionUser.name === "string" && sessionUser.name.trim()) ||
    "nPanel user";
  return { userId: sessionUser.id, displayName };
}

async function loadCallerProfile(userId: string) {
  const [profile] = await db
    .select({
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      phone: userProfile.phone,
      address: userProfile.address,
      city: userProfile.city,
      state: userProfile.state,
      country: userProfile.country,
      postalCode: userProfile.postalCode,
    })
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .limit(1);
  return profile ?? null;
}

/** Derive a URL-safe slug from a company/team name. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/**
 * Ensure the slug is unique against the team table.
 * Appends a short random suffix if a collision exists.
 */
async function resolveUniqueSlug(base: string): Promise<string> {
  const candidate = base || "team";
  const existing = await db.query.team.findFirst({
    where: eq(team.slug, candidate),
    columns: { id: true },
  });
  if (!existing) return candidate;
  // Collision  append 4 random hex chars
  const suffix = crypto.randomBytes(2).toString("hex");
  return `${candidate.slice(0, 56)}-${suffix}`;
}

function requestHeaders(ctx: { req?: { raw?: { headers?: Headers } } }): Headers | undefined {
  return ctx.req?.raw?.headers;
}

function assertLandingPageOrigin(
  headers: Headers | undefined,
  mode: "soft" | "hard",
): boolean {
  if (isAllowedStorefrontBrowserRequest(headers)) return true;
  if (mode === "hard") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action is only available from the Nisc Cloud storefront.",
    });
  }
  return false;
}

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const checkEmailInputSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const registerInputSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(9, "Phone number too short")
    .max(20)
    .regex(/^[+\d\s()-]+$/, "Invalid phone number"),
  companyName: z
    .string()
    .min(1, "Company name is required")
    .max(120, "Company name too long"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  /** Required  must match dashboard sign-up (`acceptedTermsAndConditions`). */
  acceptedTermsAndConditions: z
    .boolean()
    .refine((val) => val === true, {
      message:
        "You must accept the Terms and Conditions before creating an account.",
    }),
  planName: z.string().optional(),
});

const issueCheckoutTokenInputSchema = z.object({
  teamId: z.string().min(1).max(64),
});

const completeProfileInputSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z
    .string()
    .min(9, "Phone number too short")
    .max(20)
    .regex(/^[+\d\s()-]+$/, "Invalid phone number"),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional().default(""),
  country: z.string().min(2).max(80),
  postalCode: z.string().min(1).max(20),
}).superRefine((data, ctx) => {
  if (!normalizeCountryName(data.country)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["country"],
      message: "Select a valid country from the list",
    });
  }
});

const createOrganizationInputSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(120),
});

const checkoutTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER", "VIEWER"]),
});

const profilePrefillSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  postalCode: z.string(),
});

const checkoutIdentityOutputSchema = z.discriminatedUnion("authenticated", [
  z.object({ authenticated: z.literal(false) }),
  z.object({
    authenticated: z.literal(true),
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    }),
    profile: z.object({
      complete: z.boolean(),
      missing: z.array(z.enum(PROFILE_REQUIRED_FIELDS)),
      prefill: profilePrefillSchema,
    }),
    teams: z.array(checkoutTeamSchema),
  }),
]);

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const storefrontAuthRouter = router({
  /**
   * Check whether an email address is already registered.
   * Returns ONLY { exists: boolean }  never exposes any user data.
   *
   * Rate limit: enforced upstream (server middleware / Cloudflare).
   */
  checkEmail: publicProcedure
    .input(checkEmailInputSchema)
    .query(async ({ input }) => {
      const rows = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, input.email.toLowerCase().trim()))
        .limit(1);

      return { exists: rows.length > 0 };
    }),

  /**
   * Single cart probe: is the browser signed into nPanel?
   * Returns auth flag, display name, profile completeness (for domain-grade KYC),
   * and purchase-eligible organizations for this user only.
   */
  checkoutIdentity: publicProcedure
    .output(checkoutIdentityOutputSchema)
    .query(async ({ ctx }) => {
      if (!assertLandingPageOrigin(requestHeaders(ctx), "soft")) {
        return { authenticated: false as const };
      }

      const sessionUser = ctx.session?.user;
      if (!sessionUser?.id) {
        return { authenticated: false as const };
      }

      const [memberships, profile] = await Promise.all([
        db
          .select({
            id: team.id,
            name: team.name,
            slug: team.slug,
            role: teamMember.role,
          })
          .from(teamMember)
          .innerJoin(team, eq(teamMember.teamId, team.id))
          .where(
            and(
              eq(teamMember.userId, sessionUser.id),
              eq(team.isActive, true),
              inArray(teamMember.role, [...PURCHASE_ROLES]),
            ),
          ),
        loadCallerProfile(sessionUser.id),
      ]);

      const displayName =
        (typeof sessionUser.name === "string" && sessionUser.name.trim()) ||
        "nPanel user";
      const email =
        (typeof sessionUser.email === "string" && sessionUser.email.trim()) ||
        "";
      const profileState = evaluateProfileCompleteness(profile);

      return {
        authenticated: true as const,
        user: {
          id: sessionUser.id,
          name: displayName,
          email,
        },
        profile: {
          complete: profileState.complete,
          missing: profileState.missing,
          prefill: profileState.prefill,
        },
        teams: memberships.map((m) => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          role: m.role as PurchaseRole,
        })),
      };
    }),

  /**
   * Complete the caller's own profile for storefront purchases (domains, etc.).
   * userId is taken only from the session — never from input.
   */
  completeProfile: publicProcedure
    .input(completeProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId, displayName } = await requireStorefrontSessionUser(ctx);
      const now = new Date();
      const values = {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        city: input.city.trim(),
        state: (input.state ?? "").trim() || null,
        country: normalizeCountryName(input.country),
        postalCode: input.postalCode.trim(),
        updatedAt: now,
      };

      if (!values.country) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Select a valid country from the list",
        });
      }

      const existing = await loadCallerProfile(userId);
      if (existing) {
        await db
          .update(userProfile)
          .set(values)
          .where(eq(userProfile.userId, userId));
      } else {
        await db.insert(userProfile).values({
          id: crypto.randomUUID(),
          userId,
          ...values,
          createdAt: now,
        });
      }

      // Keep user.display name in sync when names are provided.
      const fullName = `${values.firstName} ${values.lastName}`.trim();
      if (fullName) {
        await db.update(user).set({ name: fullName }).where(eq(user.id, userId));
      }

      const refreshed = evaluateProfileCompleteness({
        ...values,
        state: values.state,
      });

      return {
        complete: refreshed.complete,
        missing: refreshed.missing,
        displayName: fullName || displayName,
        prefill: refreshed.prefill,
      };
    }),

  /**
   * Create an organization (team) for the signed-in caller as OWNER.
   * Name comes from input; role is always OWNER; no dashboard routers.
   */
  createOrganization: publicProcedure
    .input(createOrganizationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = await requireStorefrontSessionUser(ctx);
      const now = new Date();

      const owned = await db
        .select({ id: teamMember.id })
        .from(teamMember)
        .where(
          and(eq(teamMember.userId, userId), eq(teamMember.role, "OWNER")),
        );
      if (owned.length >= STOREFRONT_MAX_OWNED_ORGS) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You have reached the maximum number of organizations you can create from checkout.",
        });
      }

      const name = input.name.trim();
      const teamSlug = await resolveUniqueSlug(slugify(name));
      const teamId = crypto.randomUUID();

      await db.insert(team).values({
        id: teamId,
        name,
        slug: teamSlug,
        baseCurrency: "KES",
        createdById: userId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(teamMember).values({
        id: crypto.randomUUID(),
        teamId,
        userId,
        role: "OWNER",
        createdAt: now,
        updatedAt: now,
      });

      return {
        id: teamId,
        name,
        slug: teamSlug,
        role: "OWNER" as const,
      };
    }),

  /**
   * Issue a short-lived storefrontToken for an existing session + selected team.
   * Requires complete profile + OWNER/ADMIN membership.
   */
  issueCheckoutToken: publicProcedure
    .input(issueCheckoutTokenInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = await requireStorefrontSessionUser(ctx);

      const profileState = evaluateProfileCompleteness(
        await loadCallerProfile(userId),
      );
      if (!profileState.complete) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Complete your profile details before purchasing. Domains and similar services require full contact information.",
        });
      }

      const [membership] = await db
        .select({
          teamId: team.id,
          teamSlug: team.slug,
          role: teamMember.role,
        })
        .from(teamMember)
        .innerJoin(team, eq(teamMember.teamId, team.id))
        .where(
          and(
            eq(teamMember.userId, userId),
            eq(teamMember.teamId, input.teamId),
            eq(team.isActive, true),
          ),
        )
        .limit(1);

      if (!membership || !isPurchaseRole(membership.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot purchase under the selected organization.",
        });
      }

      return {
        storefrontToken: signStorefrontToken(
          userId,
          membership.teamId,
          membership.teamSlug,
        ),
        teamSlug: membership.teamSlug,
      };
    }),

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
  register: publicProcedure
    .input(registerInputSchema)
    .mutation(async ({ input }) => {
      const email = input.email.toLowerCase().trim();
      const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`;
      const now = new Date();

      // 1. Guard: email must be unique
      const existingRows = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (existingRows.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "An account with this email already exists. Please sign in instead.",
        });
      }

      // 2. Create user via better-auth (handles bcrypt hashing)
      const signupResult = await auth.api.signUpEmail({
        body: {
          email,
          password: input.password,
          name: fullName,
          acceptedTermsAndConditions: true,
        },
      });

      if (!signupResult) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create your account. Please try again.",
        });
      }

      if ("error" in signupResult && signupResult.error) {
        const msg =
          typeof signupResult.error === "object" &&
          "message" in signupResult.error
            ? String(signupResult.error.message)
            : "Failed to create your account. Please try again.";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }

      // Fetch the created user row
      const [createdUser] = await db
        .select({ id: user.id, email: user.email })
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (!createdUser) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Account was created but could not be retrieved.",
        });
      }

      const userId = createdUser.id;

      // 3. ALWAYS force role = "CUSTOMER"  no exceptions, no variables
      await db
        .update(user)
        .set({ role: "CUSTOMER" })
        .where(eq(user.id, userId));

      // 4. Insert user profile
      await db.insert(userProfile).values({
        id: crypto.randomUUID(),
        userId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        country: "KE",
        createdAt: now,
        updatedAt: now,
      });

      // 5. Create team (company)  currency always KES, no members yet
      const baseSlug = slugify(input.companyName);
      const teamSlug = await resolveUniqueSlug(baseSlug);
      const teamId = crypto.randomUUID();

      await db.insert(team).values({
        id: teamId,
        name: input.companyName.trim(),
        slug: teamSlug,
        baseCurrency: "KES",
        createdById: userId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      // 6. Add the user as the sole OWNER of their team
      await db.insert(teamMember).values({
        id: crypto.randomUUID(),
        teamId,
        userId,
        role: "OWNER",
        createdAt: now,
        updatedAt: now,
      });

      // 7. Sign storefront checkout token (20 min TTL)
      const storefrontToken = signStorefrontToken(userId, teamId, teamSlug);

      // 8. Return minimal data  no user id, no password, no role
      return {
        storefrontToken,
        teamSlug,
        displayName: input.firstName.trim(),
      };
    }),
});
