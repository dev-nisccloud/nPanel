import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, or, sql } from "@npanel/db";
import { db } from "@npanel/db";
import { teamMember } from "@npanel/db/schema/teams";
import { niscEmAudience, niscEmContact, niscEmCampaign } from "@npanel/db/schema";
import { protectedProcedure, router } from "../../trpc";
import {
  audienceCreateInputSchema,
  audienceContactListFiltersSchema,
  audienceContactListResponseSchema,
  audienceContactBulkCreateInputSchema,
  audienceDetailSchema,
  audienceListFiltersSchema,
  audienceListResponseSchema,
  audienceSummarySchema,
} from "../email-marketing/schemas";
import { z } from "zod";
import { randomUUID } from "node:crypto";

async function assertTeamMember(teamId: string, userId: string) {
  const [member] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
    .limit(1);
  return member ?? null;
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

function splitName(full: string | null | undefined): { firstName: string | null; lastName: string | null } {
  const v = (full ?? "").trim();
  if (!v) return { firstName: null, lastName: null };
  const parts = v.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: null };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

export const niscEmailMarketingAudiencesRouter = router({
  create: protectedProcedure.input(audienceCreateInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    if (input.teamId) {
      const member = await assertTeamMember(input.teamId, userId);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    }

    const now = new Date();
    const id = randomUUID();
    await db.insert(niscEmAudience).values({
      id,
      teamId: input.teamId ?? null,
      userId: input.teamId ? null : userId,
      name: input.name,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return { id };
  }),

  getById: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    await assertAudienceAccess(input.id, userId);

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
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    const aud = await assertAudienceAccess(input.id, userId);

    // Prevent deletion if referenced by campaigns (safety)
    const [campaignCountRes] = await db
      .select({ value: count() })
      .from(niscEmCampaign)
      .where(eq(niscEmCampaign.audienceId, input.id));
    const campaignCount = Number(campaignCountRes?.value ?? 0);
    if (campaignCount > 0) {
      throw new TRPCError({ code: "CONFLICT", message: "Cannot delete audience referenced by campaigns" });
    }

    // Team-owned deletion: require membership
    if (aud.teamId) {
      const member = await assertTeamMember(aud.teamId, userId);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    }

    await db.delete(niscEmAudience).where(eq(niscEmAudience.id, input.id));
    return { ok: true };
  }),

  list: protectedProcedure.input(audienceListFiltersSchema).query(async ({ ctx, input }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

    const conditions = [];
    if (input.teamId) {
      // Team-scoped: allow members
      const member = await assertTeamMember(input.teamId, userId);
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      conditions.push(eq(niscEmAudience.teamId, input.teamId));
    } else {
      // Personal audiences: only user
      conditions.push(eq(niscEmAudience.userId, userId));
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
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      await assertAudienceAccess(input.audienceId, userId);

      const now = new Date();
      const rows = input.contacts.map((c) => {
        const { firstName, lastName } = splitName(c.name ?? null);
        return {
          id: randomUUID(),
          audienceId: input.audienceId,
          email: (c.emailAddress ?? "").trim().toLowerCase(),
          firstName,
          lastName,
          company: c.company ?? null,
          phone: c.phoneNumber ?? null,
          status: (c.status ?? "SUBSCRIBED") as any,
          metadata: null,
          subscribedAt: (c.status ?? "SUBSCRIBED") === "SUBSCRIBED" ? now : null,
          unsubscribedAt: (c.status ?? "SUBSCRIBED") === "UNSUBSCRIBED" ? now : null,
          bouncedAt: null,
          complainedAt: null,
          createdAt: now,
          updatedAt: now,
        };
      });

      const valid = rows.filter((r) => r.email);
      if (valid.length === 0) {
        return { added: 0 };
      }

      // Insert best-effort; duplicates in same audience are ignored by unique index
      // by catching and continuing row-by-row (small batches from UI).
      let added = 0;
      for (const r of valid) {
        try {
          await db.insert(niscEmContact).values(r);
          added += 1;
        } catch {
          // ignore duplicates/invalid
        }
      }

      return { added };
    }),

  deleteContact: protectedProcedure
    .input(z.object({ id: z.string().min(1), audienceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
      await assertAudienceAccess(input.audienceId, userId);
      await db.delete(niscEmContact).where(and(eq(niscEmContact.id, input.id), eq(niscEmContact.audienceId, input.audienceId)));
      return { ok: true };
    }),

  deleteAllContacts: protectedProcedure
    .input(z.object({ audienceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });
      await assertAudienceAccess(input.audienceId, userId);

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
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "User session not found" });

      await assertAudienceAccess(input.audienceId, userId);

      const conditions = [eq(niscEmContact.audienceId, input.audienceId)];
      if (input.status) conditions.push(eq(niscEmContact.status, input.status));
      if (input.search) {
        conditions.push(ilike(niscEmContact.email, `%${input.search}%`));
      }
      if (input.from) conditions.push(sql`${niscEmContact.createdAt} >= ${input.from}`);
      if (input.to) conditions.push(sql`${niscEmContact.createdAt} <= ${input.to}`);

      const whereClause = and(...conditions);

      const [rows, totalRow] = await Promise.all([
        db
          .select({
            id: niscEmContact.id,
            audienceId: niscEmContact.audienceId,
            name: sql<string | null>`null`,
            phoneNumber: niscEmContact.phone,
            emailAddress: niscEmContact.email,
            description: sql<string | null>`null`,
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
          ...r,
          name: null,
          phoneNumber: r.phoneNumber ?? null,
          emailAddress: r.emailAddress ?? null,
          description: null,
          company: r.company ?? null,
          status: (r.status as any) ?? null,
        })),
        total: Number(totalRow?.[0]?.value ?? 0),
      });
    }),
});

