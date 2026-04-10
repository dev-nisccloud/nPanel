import { TRPCError } from "@trpc/server";
import * as crypto from "crypto";
import { and, desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
  cronWorkflowEdgeSnapshot,
  cronWorkflowRun,
  cronWorkflowRunInvoice,
} from "@npanel/db/schema/cron-workflow-runs";
import { z } from "zod";

import { getRedisClient } from "../lib/redis";
import { protectedProcedure, router } from "../trpc";

const RUN_STATUSES = ["running", "paused", "completed", "failed", "cancelled"] as const;
const PLATFORMS = ["meta", "google", "linkedin"] as const;

const cacheKey = (runId: string) => `cronflow:run:${runId}`;
const CACHE_TTL_SEC = 900;

const jobKeySchema = z.string().min(1).max(128);
const runStatusSchema = z.enum(RUN_STATUSES);

function defaultRunName(jobKey: string): string {
  const label =
    jobKey === "media-buying-eom-total-spend-invoices"
      ? "Media Buying"
      : jobKey.replace(/-/g, " ");
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `Untitled workflow run (${label} – ${dd}-${mm}-${yyyy} ${hh}:${min})`;
}

async function getRunForUser(runId: string, userId: string) {
  const rows = await db
    .select()
    .from(cronWorkflowRun)
    .where(and(eq(cronWorkflowRun.id, runId), eq(cronWorkflowRun.createdById, userId)))
    .limit(1);
  return rows[0] ?? null;
}

async function invalidateRunCache(runId: string) {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.del(cacheKey(runId));
  } catch {
    /* ignore */
  }
}

export const cronWorkflowRunRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          jobKey: jobKeySchema.optional(),
          limit: z.number().min(1).max(100).optional().default(50),
        })
        .optional()
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const where =
        input.jobKey != null
          ? and(eq(cronWorkflowRun.createdById, userId), eq(cronWorkflowRun.jobKey, input.jobKey))
          : eq(cronWorkflowRun.createdById, userId);

      const rows = await db
        .select({
          id: cronWorkflowRun.id,
          jobKey: cronWorkflowRun.jobKey,
          name: cronWorkflowRun.name,
          status: cronWorkflowRun.status,
          version: cronWorkflowRun.version,
          createdAt: cronWorkflowRun.createdAt,
          updatedAt: cronWorkflowRun.updatedAt,
        })
        .from(cronWorkflowRun)
        .where(where)
        .orderBy(desc(cronWorkflowRun.updatedAt))
        .limit(input.limit ?? 50);

      return { runs: rows };
    }),

  create: protectedProcedure
    .input(
      z.object({
        jobKey: jobKeySchema,
        name: z.string().min(1).max(512).optional(),
        teamId: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const id = crypto.randomUUID();
      const name = input.name?.trim() || defaultRunName(input.jobKey);
      const now = new Date();

      await db.insert(cronWorkflowRun).values({
        id,
        jobKey: input.jobKey,
        name,
        status: "running",
        graphStateJson: null,
        version: 1,
        lastError: null,
        createdById: userId,
        teamId: input.teamId ?? null,
        createdAt: now,
        updatedAt: now,
      });

      return { id, name, version: 1 };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const redis = getRedisClient();
      if (redis) {
        try {
          const raw = await redis.get(cacheKey(input.id));
          if (typeof raw === "string") {
            const parsed = JSON.parse(raw) as { createdById?: string };
            if (parsed.createdById === userId) {
              return parsed as typeof parsed & { graphStateJson: unknown; version: number };
            }
          }
        } catch {
          /* miss */
        }
      }

      const row = await getRunForUser(input.id, userId);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workflow run not found." });
      }

      const invoices = await db
        .select({
          platform: cronWorkflowRunInvoice.platform,
          invoiceId: cronWorkflowRunInvoice.invoiceId,
        })
        .from(cronWorkflowRunInvoice)
        .where(eq(cronWorkflowRunInvoice.runId, row.id));

      const payload = {
        id: row.id,
        jobKey: row.jobKey,
        name: row.name,
        status: row.status,
        version: row.version,
        graphStateJson: row.graphStateJson ?? null,
        lastError: row.lastError ?? null,
        teamId: row.teamId ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        createdById: userId,
        invoices,
      };

      if (redis) {
        try {
          await redis.setex(cacheKey(input.id), CACHE_TTL_SEC, JSON.stringify(payload));
        } catch {
          /* ignore */
        }
      }

      return payload;
    }),

  patch: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(512).optional(),
        status: runStatusSchema.optional(),
        lastError: z.string().max(4000).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const row = await getRunForUser(input.id, userId);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workflow run not found." });
      }

      const patch: Partial<typeof cronWorkflowRun.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (input.name !== undefined) patch.name = input.name.trim();
      if (input.status !== undefined) patch.status = input.status;
      if (input.lastError !== undefined) patch.lastError = input.lastError;

      await db.update(cronWorkflowRun).set(patch).where(eq(cronWorkflowRun.id, input.id));
      await invalidateRunCache(input.id);

      const next = await getRunForUser(input.id, userId);
      return {
        id: input.id,
        name: next!.name,
        status: next!.status,
        version: next!.version,
        updatedAt: next!.updatedAt,
      };
    }),

  saveGraph: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        version: z.number().int().min(1),
        graphStateJson: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const row = await getRunForUser(input.id, userId);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workflow run not found." });
      }
      if (row.version !== input.version) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This run was updated elsewhere. Reload and try again.",
        });
      }

      const nextVersion = row.version + 1;
      await db
        .update(cronWorkflowRun)
        .set({
          graphStateJson: input.graphStateJson as Record<string, unknown>,
          version: nextVersion,
          updatedAt: new Date(),
        })
        .where(eq(cronWorkflowRun.id, input.id));

      await invalidateRunCache(input.id);
      return { version: nextVersion };
    }),

  recordEdgeSnapshot: protectedProcedure
    .input(
      z.object({
        runId: z.string().min(1),
        edgeId: z.string().min(1).max(512),
        sourceNodeId: z.string().min(1).max(256),
        targetNodeId: z.string().min(1).max(256),
        payload: z.record(z.string(), z.unknown()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const row = await getRunForUser(input.runId, userId);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workflow run not found." });
      }

      const existingRows = await db
        .select({ id: cronWorkflowEdgeSnapshot.id })
        .from(cronWorkflowEdgeSnapshot)
        .where(
          and(
            eq(cronWorkflowEdgeSnapshot.runId, input.runId),
            eq(cronWorkflowEdgeSnapshot.edgeId, input.edgeId),
          ),
        )
        .limit(1);
      if (existingRows[0]) {
        return { ok: true as const, skipped: true as const };
      }

      await db.insert(cronWorkflowEdgeSnapshot).values({
        id: crypto.randomUUID(),
        runId: input.runId,
        edgeId: input.edgeId,
        sourceNodeId: input.sourceNodeId,
        targetNodeId: input.targetNodeId,
        payloadJson: input.payload as Record<string, unknown>,
        capturedAt: new Date(),
      });

      return { ok: true as const, skipped: false as const };
    }),

  linkInvoice: protectedProcedure
    .input(
      z.object({
        runId: z.string().min(1),
        platform: z.enum(PLATFORMS),
        invoiceId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id;
      const row = await getRunForUser(input.runId, userId);
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workflow run not found." });
      }

      await db.transaction(async (tx) => {
        await tx
          .delete(cronWorkflowRunInvoice)
          .where(
            and(
              eq(cronWorkflowRunInvoice.runId, input.runId),
              eq(cronWorkflowRunInvoice.platform, input.platform),
            ),
          );
        await tx.insert(cronWorkflowRunInvoice).values({
          id: crypto.randomUUID(),
          runId: input.runId,
          platform: input.platform,
          invoiceId: input.invoiceId,
          createdAt: new Date(),
        });
      });

      await invalidateRunCache(input.runId);
      return { ok: true as const };
    }),
});
