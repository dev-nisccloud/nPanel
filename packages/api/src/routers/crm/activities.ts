import { and, db, desc, eq, gte, lte, sql } from "@npanel/db";
import { crmActivity } from "@npanel/db/schema";
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
import {
  createActivitySchema,
  idSchema,
  listActivitiesSchema,
  updateActivitySchema,
} from "./lib/schemas";

export const activitiesRouter = router({
  list: protectedProcedure.input(listActivitiesSchema).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);
    const { page, limit } = validatePagination(input);

    return handleDatabaseOperation(async () => {
      const conditions = [];
      if (input.activityType) conditions.push(eq(crmActivity.activityType, input.activityType));
      if (input.companyId) conditions.push(eq(crmActivity.companyId, input.companyId));
      if (input.contactId) conditions.push(eq(crmActivity.contactId, input.contactId));
      if (input.dealId) conditions.push(eq(crmActivity.dealId, input.dealId));
      if (input.isCompleted !== undefined) {
        conditions.push(eq(crmActivity.isCompleted, input.isCompleted));
      }
      if (input.createdById) conditions.push(eq(crmActivity.createdById, input.createdById));
      if (input.scheduledFrom) conditions.push(gte(crmActivity.scheduledAt, input.scheduledFrom));
      if (input.scheduledTo) conditions.push(lte(crmActivity.scheduledAt, input.scheduledTo));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db.query.crmActivity.findMany({
        where: whereClause,
        with: { company: true, contact: true, deal: true },
        orderBy: [desc(crmActivity.createdAt)],
        limit,
        offset: (page - 1) * limit,
      });

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(crmActivity)
        .where(whereClause);

      return {
        data,
        pagination: buildPaginationMetadata({ page, limit, total: readCount(countRow) }),
      };
    }, "list activities");
  }),

  get: protectedProcedure.input(z.object({ id: idSchema })).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const activity = await db.query.crmActivity.findFirst({
        where: eq(crmActivity.id, input.id),
        with: { company: true, contact: true, deal: true },
      });
      if (!activity) throwNotFound("Activity");
      return activity;
    }, "get activity");
  }),

  create: protectedProcedure.input(createActivitySchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const [activity] = await db
        .insert(crmActivity)
        .values({
          id: nanoid(),
          ...input,
          customFields: input.customFields || {},
          createdById: user.id,
        })
        .returning();

      return activity;
    }, "create activity");
  }),

  update: protectedProcedure.input(updateActivitySchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);
    const { id, ...data } = input;

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmActivity.findFirst({
        where: eq(crmActivity.id, id),
      });
      if (!existing) throwNotFound("Activity");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "activity",
      });

      const [updated] = await db
        .update(crmActivity)
        .set(data)
        .where(eq(crmActivity.id, id))
        .returning();

      return updated;
    }, "update activity");
  }),

  delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmActivity.findFirst({
        where: eq(crmActivity.id, input.id),
      });
      if (!existing) throwNotFound("Activity");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "activity",
      });

      await db.delete(crmActivity).where(eq(crmActivity.id, input.id));
      return { success: true };
    }, "delete activity");
  }),
});
