import { and, db, desc, eq, gte, ilike, lte, sql } from "@npanel/db";
import { crmActivityLog, crmDeal, crmPipelineStage } from "@npanel/db/schema";
import { nanoid } from "nanoid";
import { z } from "zod";

import { protectedProcedure, router } from "../../trpc";
import {
  generateChanges,
  logCreation,
  logDealClose,
  logDeletion,
  logStageChange,
  logUpdate,
} from "./lib/activity-log";
import {
  assertCanAccessResource,
  buildPaginationMetadata,
  readCount,
  throwOperationFailed,
  getAuthenticatedUser,
  handleDatabaseOperation,
  throwNotFound,
  validatePagination,
} from "./lib/permissions";
import {
  closeDealSchema,
  createDealSchema,
  idSchema,
  listDealsSchema,
  updateDealSchema,
} from "./lib/schemas";

export const dealsRouter = router({
  list: protectedProcedure.input(listDealsSchema).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);
    const { page, limit } = validatePagination(input);

    return handleDatabaseOperation(async () => {
      const conditions = [];

      if (input.search) conditions.push(ilike(crmDeal.name, `%${input.search}%`));
      if (input.pipelineId) conditions.push(eq(crmDeal.pipelineId, input.pipelineId));
      if (input.stageId) conditions.push(eq(crmDeal.stageId, input.stageId));
      if (input.companyId) conditions.push(eq(crmDeal.companyId, input.companyId));
      if (input.contactId) conditions.push(eq(crmDeal.primaryContactId, input.contactId));
      if (input.ownerId) conditions.push(eq(crmDeal.ownerId, input.ownerId));
      if (input.isActive !== undefined) conditions.push(eq(crmDeal.isActive, input.isActive));
      if (input.isClosed !== undefined) conditions.push(eq(crmDeal.isClosed, input.isClosed));
      if (input.isWon !== undefined) conditions.push(eq(crmDeal.isWon, input.isWon));
      if (input.expectedCloseDateFrom) {
        conditions.push(gte(crmDeal.expectedCloseDate, input.expectedCloseDateFrom));
      }
      if (input.expectedCloseDateTo) {
        conditions.push(lte(crmDeal.expectedCloseDate, input.expectedCloseDateTo));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const data = await db.query.crmDeal.findMany({
        where: whereClause,
        with: {
          pipeline: true,
          stage: true,
          company: { columns: { id: true, name: true } },
          primaryContact: { columns: { id: true, fullName: true, firstName: true, lastName: true } },
          tags: { with: { tag: { columns: { id: true, name: true, color: true } } } },
        },
        orderBy: [desc(crmDeal.updatedAt)],
        limit,
        offset: (page - 1) * limit,
      });

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(crmDeal)
        .where(whereClause);

      return {
        data,
        pagination: buildPaginationMetadata({ page, limit, total: readCount(countRow) }),
      };
    }, "list deals");
  }),

  get: protectedProcedure.input(z.object({ id: idSchema })).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const deal = await db.query.crmDeal.findFirst({
        where: eq(crmDeal.id, input.id),
        with: {
          pipeline: true,
          stage: true,
          company: true,
          primaryContact: true,
          owner: { columns: { id: true, name: true, email: true } },
          tags: { with: { tag: true } },
        },
      });
      if (!deal) throwNotFound("Deal");
      return deal;
    }, "get deal");
  }),

  create: protectedProcedure.input(createDealSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const { ownerId, ...data } = input;
      const [deal] = await db
        .insert(crmDeal)
        .values({
          id: nanoid(),
          ...data,
          customFields: data.customFields || {},
          isActive: true,
          createdById: user.id,
          ownerId: ownerId || user.id,
        })
        .returning();
      if (!deal) throwOperationFailed("create deal");

      await logCreation({
        db: db,
        entityType: "deal",
        entityId: deal.id,
        entityName: deal.name,
        userId: user.id,
        ctx,
      });

      return deal;
    }, "create deal");
  }),

  update: protectedProcedure.input(updateDealSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);
    const { id, ...updates } = input;

    return handleDatabaseOperation(async () => {
      const current = await db.query.crmDeal.findFirst({
        where: eq(crmDeal.id, id),
      });
      if (!current) throwNotFound("Deal");

      assertCanAccessResource({
        userId: user.id,
        ownerId: current.ownerId,
        role: user.role,
        resourceType: "deal",
      });

      const [updated] = await db
        .update(crmDeal)
        .set(updates)
        .where(eq(crmDeal.id, id))
        .returning();
      if (!updated) throwOperationFailed("update deal");

      const changes = generateChanges(current, updates);
      if (changes.length > 0) {
        await logUpdate({
          db: db,
          entityType: "deal",
          entityId: id,
          entityName: updated.name,
          changes,
          userId: user.id,
          ctx,
        });
      }

      if (updates.stageId && updates.stageId !== current.stageId) {
        const [fromStage, toStage] = await Promise.all([
          db.query.crmPipelineStage.findFirst({
            where: eq(crmPipelineStage.id, current.stageId),
          }),
          db.query.crmPipelineStage.findFirst({
            where: eq(crmPipelineStage.id, updates.stageId),
          }),
        ]);

        await logStageChange({
          db: db,
          dealId: id,
          dealName: updated.name,
          oldStage: fromStage?.name ?? current.stageId,
          newStage: toStage?.name ?? updates.stageId,
          userId: user.id,
          ctx,
        });
      }

      return updated;
    }, "update deal");
  }),

  delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const deal = await db.query.crmDeal.findFirst({
        where: eq(crmDeal.id, input.id),
      });
      if (!deal) throwNotFound("Deal");

      assertCanAccessResource({
        userId: user.id,
        ownerId: deal.ownerId,
        role: user.role,
        resourceType: "deal",
      });

      await db.update(crmDeal).set({ isActive: false }).where(eq(crmDeal.id, input.id));

      await logDeletion({
        db: db,
        entityType: "deal",
        entityId: input.id,
        entityName: deal.name,
        userId: user.id,
        ctx,
      });

      return { success: true };
    }, "delete deal");
  }),

  restore: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const deal = await db.query.crmDeal.findFirst({
        where: eq(crmDeal.id, input.id),
      });
      if (!deal) throwNotFound("Deal");

      assertCanAccessResource({
        userId: user.id,
        ownerId: deal.ownerId,
        role: user.role,
        resourceType: "deal",
      });

      const [restored] = await db
        .update(crmDeal)
        .set({ isActive: true })
        .where(eq(crmDeal.id, input.id))
        .returning();

      return restored;
    }, "restore deal");
  }),

  close: protectedProcedure.input(closeDealSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const deal = await db.query.crmDeal.findFirst({
        where: eq(crmDeal.id, input.id),
      });
      if (!deal) throwNotFound("Deal");

      assertCanAccessResource({
        userId: user.id,
        ownerId: deal.ownerId,
        role: user.role,
        resourceType: "deal",
      });

      const [updated] = await db
        .update(crmDeal)
        .set({
          isClosed: true,
          isWon: input.isWon,
          lostReason: input.isWon ? null : input.lostReason ?? null,
          actualCloseDate: input.actualCloseDate ?? new Date(),
        })
        .where(eq(crmDeal.id, input.id))
        .returning();

      await logDealClose({
        db: db,
        dealId: input.id,
        dealName: deal.name,
        isWon: input.isWon,
        lostReason: input.lostReason,
        userId: user.id,
        ctx,
      });

      return updated;
    }, "close deal");
  }),

  getActivityTimeline: protectedProcedure
    .input(z.object({ id: idSchema }))
    .query(async ({ ctx, input }) => {
      getAuthenticatedUser(ctx);

      return handleDatabaseOperation(async () => {
        const deal = await db.query.crmDeal.findFirst({
          where: eq(crmDeal.id, input.id),
        });
        if (!deal) throwNotFound("Deal");

        return db.query.crmActivityLog.findMany({
          where: and(eq(crmActivityLog.entityType, "deal"), eq(crmActivityLog.entityId, input.id)),
          orderBy: [desc(crmActivityLog.createdAt)],
          limit: 100,
        });
      }, "get deal activity timeline");
    }),
});
