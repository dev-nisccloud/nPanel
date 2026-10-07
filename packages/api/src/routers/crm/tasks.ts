import { and, db, desc, eq, gte, lte, sql } from "@npanel/db";
import { crmTask } from "@npanel/db/schema";
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
import { createTaskSchema, idSchema, listTasksSchema, updateTaskSchema } from "./lib/schemas";

export const tasksRouter = router({
  list: protectedProcedure.input(listTasksSchema).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);
    const { page, limit } = validatePagination(input);

    return handleDatabaseOperation(async () => {
      const conditions = [];
      if (input.status) conditions.push(eq(crmTask.status, input.status));
      if (input.priority) conditions.push(eq(crmTask.priority, input.priority));
      if (input.companyId) conditions.push(eq(crmTask.companyId, input.companyId));
      if (input.contactId) conditions.push(eq(crmTask.contactId, input.contactId));
      if (input.dealId) conditions.push(eq(crmTask.dealId, input.dealId));
      if (input.assignedToId) conditions.push(eq(crmTask.assignedToId, input.assignedToId));
      if (input.createdById) conditions.push(eq(crmTask.createdById, input.createdById));
      if (input.dueDateFrom) conditions.push(gte(crmTask.dueDate, input.dueDateFrom));
      if (input.dueDateTo) conditions.push(lte(crmTask.dueDate, input.dueDateTo));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db.query.crmTask.findMany({
        where: whereClause,
        with: {
          assignedTo: { columns: { id: true, name: true } },
        },
        orderBy: [desc(crmTask.dueDate), desc(crmTask.createdAt)],
        limit,
        offset: (page - 1) * limit,
      });

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(crmTask)
        .where(whereClause);

      return {
        data,
        pagination: buildPaginationMetadata({ page, limit, total: readCount(countRow) }),
      };
    }, "list tasks");
  }),

  get: protectedProcedure.input(z.object({ id: idSchema })).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const task = await db.query.crmTask.findFirst({
        where: eq(crmTask.id, input.id),
        with: { company: true, contact: true, deal: true },
      });
      if (!task) throwNotFound("Task");
      return task;
    }, "get task");
  }),

  create: protectedProcedure.input(createTaskSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const [task] = await db
        .insert(crmTask)
        .values({
          id: nanoid(),
          ...input,
          customFields: input.customFields || {},
          createdById: user.id,
        })
        .returning();

      return task;
    }, "create task");
  }),

  update: protectedProcedure.input(updateTaskSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);
    const { id, ...data } = input;

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmTask.findFirst({
        where: eq(crmTask.id, id),
      });
      if (!existing) throwNotFound("Task");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "task",
      });

      const [updated] = await db
        .update(crmTask)
        .set(data)
        .where(eq(crmTask.id, id))
        .returning();

      return updated;
    }, "update task");
  }),

  delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmTask.findFirst({
        where: eq(crmTask.id, input.id),
      });
      if (!existing) throwNotFound("Task");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "task",
      });

      await db.delete(crmTask).where(eq(crmTask.id, input.id));
      return { success: true };
    }, "delete task");
  }),

  complete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmTask.findFirst({
        where: eq(crmTask.id, input.id),
      });
      if (!existing) throwNotFound("Task");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "task",
      });

      const [updated] = await db
        .update(crmTask)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(crmTask.id, input.id))
        .returning();

      return updated;
    }, "complete task");
  }),
});
