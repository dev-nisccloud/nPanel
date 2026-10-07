import { asc, db, desc, eq, sql } from "@npanel/db";
import { crmPipeline, crmPipelineStage } from "@npanel/db/schema";
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
  createPipelineSchema,
  createStageSchema,
  idSchema,
  listPipelinesSchema,
  updatePipelineSchema,
  updateStageSchema,
} from "./lib/schemas";

export const pipelinesRouter = router({
  list: protectedProcedure.input(listPipelinesSchema).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);
    const { page, limit } = validatePagination(input);

    return handleDatabaseOperation(async () => {
      const data = await db.query.crmPipeline.findMany({
        with: {
          stages: { orderBy: [asc(crmPipelineStage.displayOrder)] },
        },
        orderBy: [desc(crmPipeline.createdAt)],
        limit,
        offset: (page - 1) * limit,
      });

      const [countRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(crmPipeline);

      return {
        data,
        pagination: buildPaginationMetadata({ page, limit, total: readCount(countRow) }),
      };
    }, "list pipelines");
  }),

  get: protectedProcedure.input(z.object({ id: idSchema })).query(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const pipeline = await db.query.crmPipeline.findFirst({
        where: eq(crmPipeline.id, input.id),
        with: {
          stages: { orderBy: [asc(crmPipelineStage.displayOrder)] },
          deals: {
            with: {
              company: true,
              primaryContact: true,
              stage: true,
            },
          },
        },
      });
      if (!pipeline) throwNotFound("Pipeline");
      return pipeline;
    }, "get pipeline");
  }),

  create: protectedProcedure.input(createPipelineSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const [pipeline] = await db
        .insert(crmPipeline)
        .values({
          id: nanoid(),
          ...input,
          createdById: user.id,
        })
        .returning();

      return pipeline;
    }, "create pipeline");
  }),

  update: protectedProcedure.input(updatePipelineSchema).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);
    const { id, ...data } = input;

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmPipeline.findFirst({
        where: eq(crmPipeline.id, id),
      });
      if (!existing) throwNotFound("Pipeline");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "pipeline",
      });

      const [updated] = await db
        .update(crmPipeline)
        .set(data)
        .where(eq(crmPipeline.id, id))
        .returning();

      return updated;
    }, "update pipeline");
  }),

  delete: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    const user = getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmPipeline.findFirst({
        where: eq(crmPipeline.id, input.id),
      });
      if (!existing) throwNotFound("Pipeline");

      assertCanAccessResource({
        userId: user.id,
        ownerId: existing.createdById,
        role: user.role,
        resourceType: "pipeline",
      });

      await db.delete(crmPipeline).where(eq(crmPipeline.id, input.id));
      return { success: true };
    }, "delete pipeline");
  }),

  createStage: protectedProcedure.input(createStageSchema).mutation(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const [stage] = await db
        .insert(crmPipelineStage)
        .values({ id: nanoid(), ...input })
        .returning();
      return stage;
    }, "create stage");
  }),

  updateStage: protectedProcedure.input(updateStageSchema).mutation(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);
    const { id, ...data } = input;

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmPipelineStage.findFirst({
        where: eq(crmPipelineStage.id, id),
      });
      if (!existing) throwNotFound("Stage");

      const [updated] = await db
        .update(crmPipelineStage)
        .set(data)
        .where(eq(crmPipelineStage.id, id))
        .returning();

      return updated;
    }, "update stage");
  }),

  deleteStage: protectedProcedure.input(z.object({ id: idSchema })).mutation(async ({ ctx, input }) => {
    getAuthenticatedUser(ctx);

    return handleDatabaseOperation(async () => {
      const existing = await db.query.crmPipelineStage.findFirst({
        where: eq(crmPipelineStage.id, input.id),
      });
      if (!existing) throwNotFound("Stage");

      await db.delete(crmPipelineStage).where(eq(crmPipelineStage.id, input.id));
      return { success: true };
    }, "delete stage");
  }),
});
