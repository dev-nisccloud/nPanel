import { and, db, desc, eq, sql } from "@npanel/db";
import { crmNote } from "@npanel/db/schema";
import { nanoid } from "nanoid";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";
import {
  assertCanAccessResource,
  buildPaginationMetadata,
  readCount,
  getAuthenticatedUser,
  handleDatabaseOperation,
  throwNotFound,
  validatePagination,
} from "./lib/permissions";
import { createNoteSchema, idSchema, listNotesSchema, updateNoteSchema } from "./lib/schemas";

export const notesRouter = router({
  list: protectedProcedure.input(listNotesSchema).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);
    const { page, limit } = validatePagination(input);

    return handleDatabaseOperation(async () => {
      const conditions = [];
      if (input.companyId) conditions.push(eq(crmNote.companyId, input.companyId));
      if (input.contactId) conditions.push(eq(crmNote.contactId, input.contactId));
      if (input.dealId) conditions.push(eq(crmNote.dealId, input.dealId));
      if (input.isPinned !== undefined) conditions.push(eq(crmNote.isPinned, input.isPinned));
      if (input.createdById) conditions.push(eq(crmNote.createdById, input.createdById));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db.query.crmNote.findMany({
        where: whereClause,
        with: {
          createdBy: { columns: { id: true, name: true } },
        },
        orderBy: [desc(crmNote.isPinned), desc(crmNote.createdAt)],
        limit,
        offset: (page - 1) * limit,
      });

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(crmNote)
        .where(whereClause);

      return {
        data,
        pagination: buildPaginationMetadata({ page, limit, total: readCount(countRow) }),
      };
    }, "list notes");
  }),

  get: protectedProcedure.input(z.object({ id: idSchema })).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const note = await db.query.crmNote.findFirst({
        where: eq(crmNote.id, input.id),
        with: { company: true, contact: true, deal: true },
      });
      if (!note) throwNotFound("Note");
      return note;
    }, "get note");
  }),

  create: protectedProcedure.input(createNoteSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const [note] = await db
        .insert(crmNote)
        .values({
          id: nanoid(),
          ...input,
          createdById: user.id,
        })
        .returning();

      return note;
    }, "create note");
  }),

  update: protectedProcedure.input(updateNoteSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);
    const { id, ...data } = input;

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmNote.findFirst({
        where: eq(crmNote.id, id),
      });
      if (!existing) throwNotFound("Note");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "note",
      });

      const [updated] = await db
        .update(crmNote)
        .set(data)
        .where(eq(crmNote.id, id))
        .returning();

      return updated;
    }, "update note");
  }),

  delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmNote.findFirst({
        where: eq(crmNote.id, input.id),
      });
      if (!existing) throwNotFound("Note");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "note",
      });

      await db.delete(crmNote).where(eq(crmNote.id, input.id));
      return { success: true };
    }, "delete note");
  }),
});
