import { and, db, desc, eq, ilike, sql } from "@npanel/db";
import { crmCompanyTag, crmContactTag, crmDealTag, crmTag } from "@npanel/db/schema";
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
import { assignTagSchema, createTagSchema, idSchema, listTagsSchema, updateTagSchema } from "./lib/schemas";

export const tagsRouter = router({
  list: protectedProcedure.input(listTagsSchema).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);
    const { page, limit } = validatePagination({ ...input, limit: input.limit ?? 50 });

    return handleDatabaseOperation(async () => {
      const conditions = [];
      if (input.search) conditions.push(ilike(crmTag.name, `%${input.search}%`));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db.query.crmTag.findMany({
        where: whereClause,
        orderBy: [desc(crmTag.createdAt)],
        limit,
        offset: (page - 1) * limit,
      });

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(crmTag)
        .where(whereClause);

      return {
        data,
        pagination: buildPaginationMetadata({ page, limit, total: readCount(countRow) }),
      };
    }, "list tags");
  }),

  get: protectedProcedure.input(z.object({ id: idSchema })).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const tag = await db.query.crmTag.findFirst({
        where: eq(crmTag.id, input.id),
      });
      if (!tag) throwNotFound("Tag");
      return tag;
    }, "get tag");
  }),

  create: protectedProcedure.input(createTagSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const [tag] = await db
        .insert(crmTag)
        .values({
          id: nanoid(),
          ...input,
          createdById: user.id,
        })
        .returning();

      return tag;
    }, "create tag");
  }),

  update: protectedProcedure.input(updateTagSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);
    const { id, ...data } = input;

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmTag.findFirst({
        where: eq(crmTag.id, id),
      });
      if (!existing) throwNotFound("Tag");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "tag",
      });

      const [updated] = await db
        .update(crmTag)
        .set(data)
        .where(eq(crmTag.id, id))
        .returning();

      return updated;
    }, "update tag");
  }),

  delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmTag.findFirst({
        where: eq(crmTag.id, input.id),
      });
      if (!existing) throwNotFound("Tag");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "tag",
      });

      await db.delete(crmTag).where(eq(crmTag.id, input.id));
      return { success: true };
    }, "delete tag");
  }),

  assignToCompany: protectedProcedure
    .input(assignTagSchema.extend({ companyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      getAuthenticatedUser(ctx);
      return handleDatabaseOperation(async () => {
        const [assignment] = await db
          .insert(crmCompanyTag)
          .values({ id: nanoid(), tagId: input.tagId, companyId: input.companyId })
          .returning();
        return assignment;
      }, "assign tag to company");
    }),

  removeFromCompany: protectedProcedure
    .input(z.object({ tagId: z.string(), companyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      getAuthenticatedUser(ctx);
      return handleDatabaseOperation(async () => {
        await db
          .delete(crmCompanyTag)
          .where(and(eq(crmCompanyTag.tagId, input.tagId), eq(crmCompanyTag.companyId, input.companyId)));
        return { success: true };
      }, "remove tag from company");
    }),

  assignToContact: protectedProcedure
    .input(assignTagSchema.extend({ contactId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      getAuthenticatedUser(ctx);
      return handleDatabaseOperation(async () => {
        const [assignment] = await db
          .insert(crmContactTag)
          .values({ id: nanoid(), tagId: input.tagId, contactId: input.contactId })
          .returning();
        return assignment;
      }, "assign tag to contact");
    }),

  removeFromContact: protectedProcedure
    .input(z.object({ tagId: z.string(), contactId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      getAuthenticatedUser(ctx);
      return handleDatabaseOperation(async () => {
        await db
          .delete(crmContactTag)
          .where(and(eq(crmContactTag.tagId, input.tagId), eq(crmContactTag.contactId, input.contactId)));
        return { success: true };
      }, "remove tag from contact");
    }),

  assignToDeal: protectedProcedure
    .input(assignTagSchema.extend({ dealId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      getAuthenticatedUser(ctx);
      return handleDatabaseOperation(async () => {
        const [assignment] = await db
          .insert(crmDealTag)
          .values({ id: nanoid(), tagId: input.tagId, dealId: input.dealId })
          .returning();
        return assignment;
      }, "assign tag to deal");
    }),

  removeFromDeal: protectedProcedure
    .input(z.object({ tagId: z.string(), dealId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      getAuthenticatedUser(ctx);
      return handleDatabaseOperation(async () => {
        await db
          .delete(crmDealTag)
          .where(and(eq(crmDealTag.tagId, input.tagId), eq(crmDealTag.dealId, input.dealId)));
        return { success: true };
      }, "remove tag from deal");
    }),
});
