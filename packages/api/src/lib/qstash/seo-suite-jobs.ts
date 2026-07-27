import { env } from "@npanel/env/server";
import { getQStashClient } from "./client";

export type SeoSuiteRankJobPayload = {
  trackerId: string;
  projectId: string;
  userId?: string;
};

export type SeoSuiteAuditJobPayload = {
  auditRunId: string;
  projectId: string;
  userId?: string;
};

function isLoopbackUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  } catch {
    return false;
  }
}

/**
 * Enqueue rank check via QStash when a public worker URL is configured.
 * Returns `{ queued: false }` so callers can run inline (local/dev).
 */
export async function enqueueSeoSuiteRankJob(
  payload: SeoSuiteRankJobPayload,
): Promise<{ queued: boolean; messageId?: string }> {
  const url = env.QSTASH_SEO_SUITE_RANK_WORKER_ENDPOINT?.replace(/\/$/, "");
  if (!url || isLoopbackUrl(url)) {
    return { queued: false };
  }
  try {
    const client = getQStashClient();
    const result = await client.publishJSON({
      url,
      body: payload,
      timeout: 900,
      retries: 1,
    });
    const messageId =
      "messageId" in result && typeof (result as { messageId?: string }).messageId === "string"
        ? (result as { messageId: string }).messageId
        : "";
    return { queued: true, messageId };
  } catch (err) {
    console.warn("[seo-suite] QStash rank enqueue failed, falling back inline:", err);
    return { queued: false };
  }
}

export async function enqueueSeoSuiteAuditJob(
  payload: SeoSuiteAuditJobPayload,
): Promise<{ queued: boolean; messageId?: string }> {
  const url = env.QSTASH_SEO_SUITE_AUDIT_WORKER_ENDPOINT?.replace(/\/$/, "");
  if (!url || isLoopbackUrl(url)) {
    return { queued: false };
  }
  try {
    const client = getQStashClient();
    const result = await client.publishJSON({
      url,
      body: payload,
      timeout: 900,
      retries: 1,
    });
    const messageId =
      "messageId" in result && typeof (result as { messageId?: string }).messageId === "string"
        ? (result as { messageId: string }).messageId
        : "";
    return { queued: true, messageId };
  } catch (err) {
    console.warn("[seo-suite] QStash audit enqueue failed, falling back inline:", err);
    return { queued: false };
  }
}
