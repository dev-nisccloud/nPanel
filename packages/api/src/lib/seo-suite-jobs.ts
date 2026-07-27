import * as crypto from "crypto";
import { and, eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
  seoSuiteAuditIssue,
  seoSuiteAuditPage,
  seoSuiteAuditRun,
  seoSuiteProject,
  seoSuiteRankKeyword,
  seoSuiteRankResult,
  seoSuiteRankTracker,
  seoSuiteVendorUsage,
} from "@npanel/db/schema/seo-suite";
import {
  dataForSeoLiveResult,
  dataForSeoRequest,
  type DataForSEOUsageContext,
} from "./dataforseo-client";

function usageWriter(ctx: {
  projectId?: string | null;
  userId?: string | null;
}): DataForSEOUsageContext {
  return {
    projectId: ctx.projectId,
    userId: ctx.userId,
    onUsage: async (info) => {
      await db.insert(seoSuiteVendorUsage).values({
        id: crypto.randomUUID(),
        projectId: ctx.projectId ?? null,
        userId: ctx.userId ?? null,
        api: info.api,
        endpoint: info.endpoint,
        units: info.units,
        costEstimate: info.costEstimate,
        meta: info.meta ?? null,
        createdAt: new Date(),
      });
    },
  };
}

function nextRunAt(schedule: string, from = new Date()): Date {
  const d = new Date(from);
  if (schedule === "daily") d.setDate(d.getDate() + 1);
  else if (schedule === "every_3_days") d.setDate(d.getDate() + 3);
  else d.setDate(d.getDate() + 7);
  return d;
}

export async function processSeoSuiteRankTracker(input: {
  trackerId: string;
  projectId: string;
  userId?: string;
}): Promise<{ checked: number }> {
  const tracker = await db.query.seoSuiteRankTracker.findFirst({
    where: eq(seoSuiteRankTracker.id, input.trackerId),
  });
  const project = await db.query.seoSuiteProject.findFirst({
    where: eq(seoSuiteProject.id, input.projectId),
  });
  if (!tracker || !project) return { checked: 0 };

  const keywords = await db.query.seoSuiteRankKeyword.findMany({
    where: eq(seoSuiteRankKeyword.trackerId, tracker.id),
  });
  const usage = usageWriter({ projectId: project.id, userId: input.userId });
  let checked = 0;

  for (const kw of keywords) {
    try {
      const result = await dataForSeoLiveResult<Record<string, unknown>>(
        "/v3/serp/google/organic/live/advanced",
        [
          {
            keyword: kw.keyword,
            location_code: tracker.locationCode,
            language_code: tracker.languageCode,
            device: tracker.device,
            depth: 20,
          },
        ],
        usage,
      );
      const serp = (result?.[0] ?? null) as {
        items?: Array<Record<string, unknown>>;
        item_types?: string[];
      } | null;
      const items = Array.isArray(serp?.items) ? serp.items : [];
      const features = Array.isArray(serp?.item_types)
        ? (serp.item_types as string[])
        : items.map((i) => String(i.type ?? "")).filter(Boolean);
      const aiOverview = features.includes("ai_overview") || items.some((i) => i.type === "ai_overview");

      const match = items.find((i) => {
        if (i.type !== "organic") return false;
        const domain = String(i.domain ?? "").toLowerCase();
        return domain.includes(project.primaryDomain) || String(i.url ?? "").includes(project.primaryDomain);
      }) as
        | { rank_absolute?: number; rank_group?: number; url?: string }
        | undefined;

      await db.insert(seoSuiteRankResult).values({
        id: crypto.randomUUID(),
        rankKeywordId: kw.id,
        projectId: project.id,
        checkedAt: new Date(),
        rankAbsolute: match?.rank_absolute ?? null,
        rankGroup: match?.rank_group ?? null,
        url: match?.url ?? null,
        serpFeatures: features,
        aiOverview,
        serpSnapshot: { items: items.slice(0, 20) },
      });
      checked += 1;
    } catch (err) {
      console.error(`[seo-suite] rank check failed for ${kw.keyword}:`, err);
    }
  }

  await db
    .update(seoSuiteRankTracker)
    .set({
      lastRunAt: new Date(),
      nextRunAt: nextRunAt(tracker.schedule),
      updatedAt: new Date(),
    })
    .where(eq(seoSuiteRankTracker.id, tracker.id));

  return { checked };
}

export async function processSeoSuiteAuditRun(input: {
  auditRunId: string;
  projectId: string;
  userId?: string;
}): Promise<{ ok: boolean }> {
  const run = await db.query.seoSuiteAuditRun.findFirst({
    where: and(
      eq(seoSuiteAuditRun.id, input.auditRunId),
      eq(seoSuiteAuditRun.projectId, input.projectId),
    ),
  });
  if (!run) return { ok: false };

  const usage = usageWriter({ projectId: input.projectId, userId: input.userId });

  await db
    .update(seoSuiteAuditRun)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(seoSuiteAuditRun.id, run.id));

  try {
    const post = await dataForSeoRequest<{
      tasks?: Array<{ id?: string }>;
    }>("/v3/on_page/task_post", {
      method: "POST",
      body: [
        {
          target: run.targetUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
          max_crawl_pages: run.maxPages,
          enable_javascript: true,
          load_resources: true,
        },
      ],
      usage,
    });

    const taskId = post.tasks?.[0]?.id;
    if (!taskId) {
      throw new Error("No On-Page task id returned");
    }

    await db
      .update(seoSuiteAuditRun)
      .set({ vendorTaskId: taskId })
      .where(eq(seoSuiteAuditRun.id, run.id));

    // Poll briefly for summary (up to ~45s); remaining progress can be refreshed from UI.
    let summary: unknown = null;
    for (let i = 0; i < 9; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      try {
        const ready = await dataForSeoRequest<{
          tasks?: Array<{ result?: Array<{ id?: string }> }>;
        }>("/v3/on_page/tasks_ready", { method: "GET", usage });
        const ids = ready.tasks?.[0]?.result?.map((t) => t.id) ?? [];
        if (!ids.includes(taskId) && i < 8) continue;

        const sum = await dataForSeoRequest<{
          tasks?: Array<{ result?: unknown[] }>;
        }>(`/v3/on_page/summary/${taskId}`, { method: "GET", usage });
        summary = sum.tasks?.[0]?.result?.[0] ?? null;
        if (summary) break;
      } catch {
        // keep polling
      }
    }

    const summaryObj = (summary ?? {}) as {
      page_metrics?: {
        onpage_score?: number;
        checks?: Record<string, number>;
      };
      crawl_progress?: string;
    };

    const score =
      typeof summaryObj.page_metrics?.onpage_score === "number"
        ? Math.round(summaryObj.page_metrics.onpage_score)
        : null;

    const checks = summaryObj.page_metrics?.checks ?? {};
    const issues = Object.entries(checks)
      .filter(([, count]) => typeof count === "number" && count > 0)
      .slice(0, 50)
      .map(([key, count]) => ({
        id: crypto.randomUUID(),
        auditRunId: run.id,
        projectId: input.projectId,
        category: key.split("_")[0] ?? "onpage",
        severity: Number(count) > 10 ? "error" : "warning",
        title: key.replace(/_/g, " "),
        description: `${count} occurrence(s) detected`,
        url: null as string | null,
        evidence: { count },
      }));

    if (issues.length) {
      await db.insert(seoSuiteAuditIssue).values(issues);
    }

    try {
      const pagesResp = await dataForSeoRequest<{
        tasks?: Array<{ result?: Array<{ items?: Array<Record<string, unknown>> }> }>;
      }>("/v3/on_page/pages", {
        method: "POST",
        body: [{ id: taskId, limit: 50 }],
        usage,
      });
      const pageItems = pagesResp.tasks?.[0]?.result?.[0]?.items ?? [];
      if (pageItems.length) {
        await db.insert(seoSuiteAuditPage).values(
          pageItems.map((p) => ({
            id: crypto.randomUUID(),
            auditRunId: run.id,
            projectId: input.projectId,
            url: String(p.url ?? ""),
            statusCode: typeof p.status_code === "number" ? p.status_code : null,
            score:
              typeof (p as { onpage_score?: number }).onpage_score === "number"
                ? Math.round((p as { onpage_score: number }).onpage_score)
                : null,
            metrics: p,
          })),
        );
      }
    } catch (err) {
      console.warn("[seo-suite] audit pages fetch failed:", err);
    }

    await db
      .update(seoSuiteAuditRun)
      .set({
        status: summary ? "completed" : "running",
        score,
        summary: summaryObj,
        completedAt: summary ? new Date() : null,
      })
      .where(eq(seoSuiteAuditRun.id, run.id));

    return { ok: true };
  } catch (err) {
    await db
      .update(seoSuiteAuditRun)
      .set({
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "Audit failed",
        completedAt: new Date(),
      })
      .where(eq(seoSuiteAuditRun.id, run.id));
    throw err;
  }
}
