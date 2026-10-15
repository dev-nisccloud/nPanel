import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, inArray, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { teamMember } from "@npanel/db/schema/teams";
import { niscEmAudience, niscEmContact, niscEmCampaign } from "@npanel/db/schema";
import { protectedProcedure, router } from "../../trpc";
import {
  audienceCreateInputSchema,
  audienceContactListFiltersSchema,
  audienceContactListResponseSchema,
  audienceContactBulkCreateInputSchema,
  audienceContactUpdateInputSchema,
  audienceDetailSchema,
  audienceListFiltersSchema,
  audienceListResponseSchema,
  audienceSummarySchema,
} from "../email-marketing/schemas";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { assertTeamModulePermission, assertTeamPermission } from "../../lib/team-permissions/assert";
import {
  assertCanLinkNiscEmResource,
  assertTeamHasNiscEmailMarketingSubscription,
} from "../../lib/nisc-email-marketing-billing";

async function assertTeamMember(
  teamId: string,
  userId: string,
  role?: string | null,
) {
  if (isAgencyUserRole(role)) return { id: "agency" };
  const [member] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
    .limit(1);
  if (!member) return null;
  await assertTeamModulePermission({
    teamId,
    userId,
    userRole: role,
    module: "email_marketing",
    access: "read",
  });
  return member;
}

function isAgencyUserRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return ["AGENCY_USER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN"].includes(role);
}

function isAgencySuperAdminRole(role: string | null | undefined): boolean {
  return role === "AGENCY_SUPER_ADMIN";
}

async function assertAudienceAccess(audienceId: string, userId: string) {
  const [aud] = await db
    .select({
      id: niscEmAudience.id,
      userId: niscEmAudience.userId,
      teamId: niscEmAudience.teamId,
    })
    .from(niscEmAudience)
    .where(eq(niscEmAudience.id, audienceId))
    .limit(1);

  if (!aud) throw new TRPCError({ code: "NOT_FOUND", message: "Audience not found" });
  if (aud.userId === userId) return aud;
  if (aud.teamId) {
    const member = await assertTeamMember(aud.teamId, userId);
    if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    return aud;
  }
  throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
}

async function assertAudienceReadAccess(
  audienceId: string,
  userId: string,
  role: string | null | undefined,
) {
  if (isAgencyUserRole(role)) {
    const [aud] = await db
      .select({
        id: niscEmAudience.id,
        userId: niscEmAudience.userId,
        teamId: niscEmAudience.teamId,
      })
      .from(niscEmAudience)
      .where(eq(niscEmAudience.id, audienceId))
      .limit(1);
    if (!aud) throw new TRPCError({ code: "NOT_FOUND", message: "Audience not found" });
    return aud;
  }
  return assertAudienceAccess(audienceId, userId);
}

async function assertAudienceOwnerAccess(
  audienceId: string,
  userId: string,
  role: string | null | undefined,
) {
  const [aud] = await db
    .select({
      id: niscEmAudience.id,
      userId: niscEmAudience.userId,
      teamId: niscEmAudience.teamId,
    })
    .from(niscEmAudience)
    .where(eq(niscEmAudience.id, audienceId))
    .limit(1);

  if (!aud) throw new TRPCError({ code: "NOT_FOUND", message: "Audience not found" });
  if (!isAgencySuperAdminRole(role) && aud.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only the audience creator can modify it" });
  }
  return aud;
}

function splitName(full: string | null | undefined): { firstName: string | null; lastName: string | null } {
  const v = (full ?? "").trim();
  if (!v) return { firstName: null, lastName: null };
  const parts = v.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: null };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

function joinName(firstName: string | null | undefined, lastName: string | null | undefined): string | null {
  const name = [firstName, lastName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");
  return name || null;
}

function descriptionFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>).description;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function metadataWithDescription(
  metadata: unknown,
  description: string | null | undefined,
): Record<string, unknown> | null {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};
  const trimmed = description?.trim() ?? "";
  if (trimmed) base.description = trimmed;
  else delete base.description;
  return Object.keys(base).length > 0 ? base : null;
}

const CONTACT_STATUSES = ["SUBSCRIBED", "UNSUBSCRIBED", "BOUNCED", "COMPLAINED"] as const;

function toApiStatus(status: string | null | undefined) {
  if (status && (CONTACT_STATUSES as readonly string[]).includes(status)) {
    return status as (typeof CONTACT_STATUSES)[number];
  }
  return "SUBSCRIBED" as const;
}

function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const record = current as { code?: string; message?: string; cause?: unknown };
    if (record.code === "23505") return true;
    if (
      typeof record.message === "string" &&
      record.message.includes("nisc_em_contact_audienceId_email_idx")
    ) {
      return true;
    }
    current = record.cause;
  }
  return false;
}

export const niscEmailMarketingAudiencesRouter = router({
  create: protectedProcedure.input(audienceCreateInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    if (!isAgencyUserRole(userRole) && !input.teamId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "teamId is required for customer audience creation",
      });
    }

    if (input.teamId) {
      const member = await assertTeamMember(input.teamId, userId, userRole);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      await assertTeamPermission({
        teamId: input.teamId,
        userId,
        userRole,
        key: "email_marketing.audiences",
        access: "write",
      });
      await assertTeamHasNiscEmailMarketingSubscription(input.teamId);
    }

    const now = new Date();
    const id = randomUUID();
    await db.insert(niscEmAudience).values({
      id,
      teamId: input.teamId ?? null,
      userId,
      name: input.name,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return { id };
  }),

  linkOrganization: protectedProcedure
    .input(z.object({ id: z.string().min(1), teamId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      const [aud] = await db
        .select({ id: niscEmAudience.id, teamId: niscEmAudience.teamId })
        .from(niscEmAudience)
        .where(eq(niscEmAudience.id, input.id))
        .limit(1);
      if (!aud) throw new TRPCError({ code: "NOT_FOUND", message: "Audience not found" });

      await assertCanLinkNiscEmResource({
        role: userRole,
        currentTeamId: aud.teamId,
        nextTeamId: input.teamId,
      });

      await db
        .update(niscEmAudience)
        .set({ teamId: input.teamId, updatedAt: new Date() })
        .where(eq(niscEmAudience.id, aud.id));

      return { ok: true as const };
    }),

  getById: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    await assertAudienceReadAccess(input.id, userId, userRole);

    const [aud] = await db
      .select({
        id: niscEmAudience.id,
        name: niscEmAudience.name,
        description: niscEmAudience.description,
        userId: niscEmAudience.userId,
        teamId: niscEmAudience.teamId,
        createdAt: niscEmAudience.createdAt,
        updatedAt: niscEmAudience.updatedAt,
      })
      .from(niscEmAudience)
      .where(eq(niscEmAudience.id, input.id))
      .limit(1);

    if (!aud) throw new TRPCError({ code: "NOT_FOUND", message: "Audience not found" });

    const [counts] = await db
      .select({
        contactsCount: sql<number>`count(*)`,
        subscribedCount: sql<number>`count(*) filter (where ${niscEmContact.status} = 'SUBSCRIBED')`,
        unsubscribedCount: sql<number>`count(*) filter (where ${niscEmContact.status} = 'UNSUBSCRIBED')`,
      })
      .from(niscEmContact)
      .where(eq(niscEmContact.audienceId, input.id));

    return audienceDetailSchema.parse({
      ...aud,
      description: aud.description ?? null,
      userId: aud.userId ?? null,
      teamId: aud.teamId ?? null,
      contactsCount: Number(counts?.contactsCount ?? 0),
      subscribedCount: Number(counts?.subscribedCount ?? 0),
      unsubscribedCount: Number(counts?.unsubscribedCount ?? 0),
    });
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    await assertAudienceOwnerAccess(input.id, userId, userRole);

    // Prevent deletion if referenced by campaigns (safety)
    const [campaignCountRes] = await db
      .select({ value: count() })
      .from(niscEmCampaign)
      .where(eq(niscEmCampaign.audienceId, input.id));
    const campaignCount = Number(campaignCountRes?.value ?? 0);
    if (campaignCount > 0) {
      throw new TRPCError({ code: "CONFLICT", message: "Cannot delete audience referenced by campaigns" });
    }

    await db.delete(niscEmAudience).where(eq(niscEmAudience.id, input.id));
    return { ok: true };
  }),

  list: protectedProcedure.input(audienceListFiltersSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    const userRole = ctx.session?.user?.role;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    const conditions = [];
    if (isAgencyUserRole(userRole)) {
      // Agency-side view: list all audiences globally.
    } else if (input.teamId) {
      // Team-scoped: allow members
      const member = await assertTeamMember(input.teamId, userId, userRole);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      conditions.push(eq(niscEmAudience.teamId, input.teamId));
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "teamId is required for customer audience listing",
      });
    }

    if (input.search) {
      conditions.push(
        or(
          ilike(niscEmAudience.name, `%${input.search}%`),
          ilike(sql`coalesce(${niscEmAudience.description}, '')`, `%${input.search}%`),
        ),
      );
    }

    const whereClause = and(...conditions);

    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: niscEmAudience.id,
          name: niscEmAudience.name,
          description: niscEmAudience.description,
          userId: niscEmAudience.userId,
          teamId: niscEmAudience.teamId,
          createdAt: niscEmAudience.createdAt,
          updatedAt: niscEmAudience.updatedAt,
          contactsCount: count(niscEmContact.id),
        })
        .from(niscEmAudience)
        .leftJoin(niscEmContact, eq(niscEmContact.audienceId, niscEmAudience.id))
        .where(whereClause)
        .groupBy(
          niscEmAudience.id,
          niscEmAudience.name,
          niscEmAudience.description,
          niscEmAudience.userId,
          niscEmAudience.teamId,
          niscEmAudience.createdAt,
          niscEmAudience.updatedAt,
        )
        .orderBy(desc(niscEmAudience.createdAt))
        .limit(input.limit)
        .offset(input.offset),
      db
        .select({ value: count() })
        .from(niscEmAudience)
        .where(whereClause),
    ]);

    return audienceListResponseSchema.parse({
      audiences: rows.map((r) =>
        audienceSummarySchema.parse({
          ...r,
          description: r.description ?? null,
          userId: r.userId ?? null,
          teamId: r.teamId ?? null,
          contactsCount: Number(r.contactsCount ?? 0),
        }),
      ),
      total: Number(totalRow?.[0]?.value ?? 0),
    });
  }),

  addContactsBulk: protectedProcedure
    .input(audienceContactBulkCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      await assertAudienceOwnerAccess(input.audienceId, userId, userRole);

      const now = new Date();
      const seen = new Set<string>();
      let skippedDuplicate = 0;
      let skippedMissingEmail = 0;
      const rows: Array<typeof niscEmContact.$inferInsert> = [];

      for (const contact of input.contacts) {
        const email = (contact.emailAddress ?? "").trim().toLowerCase();
        if (!email) {
          skippedMissingEmail += 1;
          continue;
        }
        if (seen.has(email)) {
          skippedDuplicate += 1;
          continue;
        }
        seen.add(email);

        const { firstName, lastName } = splitName(contact.name ?? null);
        const description = contact.description?.trim() || null;
        const status = contact.status ?? "SUBSCRIBED";
        rows.push({
          id: randomUUID(),
          audienceId: input.audienceId,
          email,
          firstName,
          lastName,
          company: contact.company?.trim() || null,
          phone: contact.phoneNumber?.trim() || null,
          status,
          metadata: description ? { description } : null,
          subscribedAt: status === "SUBSCRIBED" ? now : null,
          unsubscribedAt: status === "UNSUBSCRIBED" ? now : null,
          bouncedAt: status === "BOUNCED" ? now : null,
          complainedAt: status === "COMPLAINED" ? now : null,
          createdAt: now,
          updatedAt: now,
        });
      }

      // One round-trip per chunk. Row-by-row inserts on a few thousand contacts
      // outlive the request and leave a partial audience behind.
      const CHUNK_SIZE = 400;
      let added = 0;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const inserted = await db
          .insert(niscEmContact)
          .values(chunk)
          .onConflictDoNothing({
            target: [niscEmContact.audienceId, niscEmContact.email],
          })
          .returning({ id: niscEmContact.id });
        added += inserted.length;
      }

      skippedDuplicate += rows.length - added;
      return { added, skippedDuplicate, skippedMissingEmail };
    }),

  deleteContact: protectedProcedure
    .input(z.object({ id: z.string().min(1), audienceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
      await assertAudienceOwnerAccess(input.audienceId, userId, userRole);
      await db.delete(niscEmContact).where(and(eq(niscEmContact.id, input.id), eq(niscEmContact.audienceId, input.audienceId)));
      return { ok: true };
    }),

  updateContact: protectedProcedure
    .input(audienceContactUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
      await assertAudienceOwnerAccess(input.audienceId, userId, userRole);

      const [existing] = await db
        .select()
        .from(niscEmContact)
        .where(and(eq(niscEmContact.id, input.id), eq(niscEmContact.audienceId, input.audienceId)))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });

      const nextEmail =
        input.emailAddress !== undefined
          ? (input.emailAddress ?? "").trim().toLowerCase()
          : existing.email;
      if (!nextEmail) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email address is required" });
      }

      const now = new Date();
      const namePatch = input.name !== undefined ? splitName(input.name) : null;

      try {
        await db
          .update(niscEmContact)
          .set({
            email: nextEmail,
            ...(namePatch
              ? { firstName: namePatch.firstName, lastName: namePatch.lastName }
              : {}),
            ...(input.phoneNumber !== undefined
              ? { phone: input.phoneNumber?.trim() || null }
              : {}),
            ...(input.company !== undefined ? { company: input.company?.trim() || null } : {}),
            ...(input.description !== undefined
              ? { metadata: metadataWithDescription(existing.metadata, input.description) }
              : {}),
            ...(input.status
              ? {
                  status: input.status,
                  ...(input.status === "SUBSCRIBED"
                    ? { subscribedAt: existing.subscribedAt ?? now }
                    : {}),
                  ...(input.status === "UNSUBSCRIBED" ? { unsubscribedAt: now } : {}),
                  ...(input.status === "BOUNCED" ? { bouncedAt: existing.bouncedAt ?? now } : {}),
                  ...(input.status === "COMPLAINED"
                    ? { complainedAt: existing.complainedAt ?? now }
                    : {}),
                }
              : {}),
            updatedAt: now,
          })
          .where(eq(niscEmContact.id, existing.id));
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A contact with this email already exists in this audience",
          });
        }
        throw error;
      }

      return { ok: true as const };
    }),

  deleteContacts: protectedProcedure
    .input(
      z.object({
        audienceId: z.string().min(1),
        ids: z.array(z.string().min(1)).min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
      await assertAudienceOwnerAccess(input.audienceId, userId, userRole);

      const deletedRows = await db
        .delete(niscEmContact)
        .where(
          and(
            eq(niscEmContact.audienceId, input.audienceId),
            inArray(niscEmContact.id, input.ids),
          ),
        )
        .returning({ id: niscEmContact.id });
      return { deleted: deletedRows.length };
    }),

  deleteAllContacts: protectedProcedure
    .input(z.object({ audienceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
      await assertAudienceOwnerAccess(input.audienceId, userId, userRole);

      const deletedRows = await db
        .delete(niscEmContact)
        .where(eq(niscEmContact.audienceId, input.audienceId))
        .returning({ id: niscEmContact.id });
      return { deleted: deletedRows.length };
    }),

  listContacts: protectedProcedure
    .input(audienceContactListFiltersSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      const userRole = ctx.session?.user?.role;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      await assertAudienceReadAccess(input.audienceId, userId, userRole);

      const conditions = [eq(niscEmContact.audienceId, input.audienceId)];
      if (input.status) conditions.push(eq(niscEmContact.status, input.status));
      if (input.search) {
        const pattern = `%${input.search}%`;
        conditions.push(
          or(
            ilike(niscEmContact.email, pattern),
            ilike(niscEmContact.firstName, pattern),
            ilike(niscEmContact.lastName, pattern),
            ilike(niscEmContact.phone, pattern),
            ilike(niscEmContact.company, pattern),
            sql`concat_ws(' ', coalesce(${niscEmContact.firstName}, ''), coalesce(${niscEmContact.lastName}, '')) ILIKE ${pattern}`,
            sql`coalesce(${niscEmContact.metadata}->>'description', '') ILIKE ${pattern}`,
          )!,
        );
      }
      if (input.from) conditions.push(sql`${niscEmContact.createdAt} >= ${input.from}`);
      if (input.to) conditions.push(sql`${niscEmContact.createdAt} <= ${input.to}`);

      const whereClause = and(...conditions);

      const [rows, totalRow] = await Promise.all([
        db
          .select({
            id: niscEmContact.id,
            audienceId: niscEmContact.audienceId,
            firstName: niscEmContact.firstName,
            lastName: niscEmContact.lastName,
            phoneNumber: niscEmContact.phone,
            emailAddress: niscEmContact.email,
            metadata: niscEmContact.metadata,
            company: niscEmContact.company,
            status: niscEmContact.status,
            createdAt: niscEmContact.createdAt,
            updatedAt: niscEmContact.updatedAt,
          })
          .from(niscEmContact)
          .where(whereClause)
          .orderBy(desc(niscEmContact.createdAt))
          .limit(input.limit)
          .offset(input.offset),
        db.select({ value: count() }).from(niscEmContact).where(whereClause),
      ]);

      return audienceContactListResponseSchema.parse({
        contacts: rows.map((r) => ({
          id: r.id,
          audienceId: r.audienceId,
          name: joinName(r.firstName, r.lastName),
          phoneNumber: r.phoneNumber ?? null,
          emailAddress: r.emailAddress ?? null,
          description: descriptionFromMetadata(r.metadata),
          company: r.company ?? null,
          status: toApiStatus(r.status),
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        total: Number(totalRow?.[0]?.value ?? 0),
      });
    }),
});

