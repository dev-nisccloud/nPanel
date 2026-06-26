/**
 * Storefront auth procedures — public landing page only.
 *
 * Security rules enforced here:
 *  • Role is ALWAYS "CUSTOMER" — it is NEVER taken from input, NEVER variable.
 *  • A forced db.update({ role: "CUSTOMER" }) runs after better-auth creates
 *    the account, neutralising any default better-auth may assign.
 *  • Input schema has no `role` field at all.
 *  • `checkEmail` returns only { exists: boolean } — no names, IDs, or metadata.
 *  • `register` returns only a short-lived storefrontToken + minimal display data.
 */

import * as crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "@npanel/db";
import { db } from "@npanel/db";
import { user } from "@npanel/db/schema/auth";
import { userProfile } from "@npanel/db/schema/auth-extras";
import { team, teamMember } from "@npanel/db/schema/teams";
import { publicProcedure, router } from "../../trpc";
import { auth } from "@npanel/auth";
import { signStorefrontToken } from "../../lib/storefront-token";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  // Collision — append 4 random hex chars
  const suffix = crypto.randomBytes(2).toString("hex");
  return `${candidate.slice(0, 56)}-${suffix}`;
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
  /** Required — must match dashboard sign-up (`acceptedTermsAndConditions`). */
  acceptedTermsAndConditions: z
    .boolean()
    .refine((val) => val === true, {
      message:
        "You must accept the Terms and Conditions before creating an account.",
    }),
  planName: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const storefrontAuthRouter = router({
  /**
   * Check whether an email address is already registered.
   * Returns ONLY { exists: boolean } — never exposes any user data.
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
   *  8. Return { storefrontToken, teamSlug, displayName } — nothing else
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

      // 3. ALWAYS force role = "CUSTOMER" — no exceptions, no variables
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

      // 5. Create team (company) — currency always KES, no members yet
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

      // 8. Return minimal data — no user id, no password, no role
      return {
        storefrontToken,
        teamSlug,
        displayName: input.firstName.trim(),
      };
    }),
});
