import { db, eq, sql } from "@npanel/db";
import { niscEmCampaign, niscEmEmail } from "@npanel/db/schema";
import { getSesClient, sendSesRawEmail } from "./ses-client";
import { getQuotaStatus } from "./quota-reservation";
import { randomUUID } from "node:crypto";

type DispatchResult =
  | { ran: false; reason: "LOCK_HELD" }
  | {
      ran: true;
      claimed: number;
      sent: number;
      failed: number;
      throttled: number;
      elapsedMs: number;
    };

export type NiscEmDispatchDebug = {
  startedAt: string;
  maxRuntimeMs: number;
  claimBatchSize: number;
  ratePerSecond: number;
  quota: {
    maxSendRate: number;
    max24HourSend: number;
    sentLast24HoursAtStart: number;
    reservedEmails: number;
    remainingEmails: number;
  };
  queue: {
    eligibleQueuedCountAtStart: number;
    eligibleQueuedCountAtEnd: number;
    eligibleByStatusAtStart: Record<string, number>;
    eligibleByStatusAtEnd: Record<string, number>;
  };
  errors: {
    byMessage: Array<{ message: string; count: number }>;
  };
};

function envInt(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  return Math.floor(n);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function toRfc2047Utf8(value: string): string {
  // Minimal RFC2047 Q-encoding for common UTF-8 subjects/names.
  // We only encode when needed (non-ascii).
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const buf = Buffer.from(value, "utf8");
  const b64 = buf.toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

function buildRawMimeEmail(params: {
  from: string;
  to: string;
  subject: string;
  replyTo?: string | null;
  text?: string | null;
  html?: string | null;
}): Buffer {
  const boundary = `npanel-${randomUUID()}`;
  const lines: string[] = [];
  lines.push(`From: ${params.from}`);
  lines.push(`To: ${params.to}`);
  lines.push(`Subject: ${toRfc2047Utf8(params.subject)}`);
  if (params.replyTo) lines.push(`Reply-To: ${params.replyTo}`);
  lines.push("MIME-Version: 1.0");
  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  lines.push("");

  const text = params.text?.trim() ? params.text : null;
  const html = params.html?.trim() ? params.html : null;

  if (text) {
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 7bit");
    lines.push("");
    lines.push(text);
    lines.push("");
  }

  if (html) {
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 7bit");
    lines.push("");
    lines.push(html);
    lines.push("");
  }

  if (!text && !html) {
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: 7bit");
    lines.push("");
    lines.push("(empty email)");
    lines.push("");
  }

  lines.push(`--${boundary}--`);
  lines.push("");

  // SES expects CRLF.
  return Buffer.from(lines.join("\r\n"), "utf8");
}

class TokenBucketPerSecond {
  private lastRefillMs = 0;
  private tokens = 0;

  constructor(private readonly ratePerSecond: number) {}

  async take(): Promise<void> {
    while (true) {
      const now = Date.now();
      if (this.lastRefillMs === 0) {
        this.lastRefillMs = now;
        this.tokens = this.ratePerSecond;
      }

      const elapsed = now - this.lastRefillMs;
      if (elapsed >= 1000) {
        const refillCount = Math.floor(elapsed / 1000);
        this.tokens = this.ratePerSecond;
        this.lastRefillMs += refillCount * 1000;
      }

      if (this.tokens > 0) {
        this.tokens -= 1;
        return;
      }

      const sleepMs = Math.max(1, 1000 - (now - this.lastRefillMs));
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }
}

function isRetryableSesError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const anyErr = error as { name?: string; message?: string; $metadata?: unknown };
  const name = (anyErr.name ?? "").toLowerCase();
  const msg = (anyErr.message ?? "").toLowerCase();
  return (
    name.includes("thrott") ||
    name.includes("toomany") ||
    msg.includes("thrott") ||
    msg.includes("rate") ||
    msg.includes("timeout") ||
    msg.includes("temporar") ||
    msg.includes("try again")
  );
}

async function tryAcquireGlobalDispatchLock(): Promise<boolean> {
  // Use a stable advisory lock key.
  // int4: hashtext('nisc_em_global_dispatch_v1')
  const res = await db.execute<{ ok: boolean }>(
    sql`select pg_try_advisory_lock(hashtext('nisc_em_global_dispatch_v1')) as ok`,
  );
  const row = (res as unknown as { rows?: Array<{ ok: boolean }> }).rows?.[0];
  return Boolean(row?.ok);
}

async function releaseGlobalDispatchLock(): Promise<void> {
  await db.execute(
    sql`select pg_advisory_unlock(hashtext('nisc_em_global_dispatch_v1'))`,
  );
}

async function claimQueuedEmails(params: {
  now: Date;
  limit: number;
}): Promise<
  Array<{
    id: string;
    campaignId: string;
    toEmail: string;
    fromEmail: string;
    subject: string;
  }>
> {
  const { now, limit } = params;

  // Claim via SKIP LOCKED so multiple invocations don't double-send.
  // Even though we use an advisory lock (single dispatcher), this keeps the queue robust.
  const res = await db.execute<{
    id: string;
    campaignId: string;
    toEmail: string;
    fromEmail: string;
    subject: string;
  }>(sql`
    with cte as (
      select e.id
      from ${niscEmEmail} e
      join ${niscEmCampaign} c on c.id = e.campaign_id
      where e.status = 'QUEUED'
        and (c.status = 'SENDING' or (c.status = 'SCHEDULED' and (c.scheduled_at is null or c.scheduled_at <= ${now})))
      order by
        c.scheduled_at nulls first,
        e.created_at asc
      for update skip locked
      limit ${limit}
    )
    update ${niscEmEmail} e
    set status = 'SENDING',
        updated_at = ${now}
    where e.id in (select id from cte)
    returning e.id as "id",
              e.campaign_id as "campaignId",
              e.to_email as "toEmail",
              e.from_email as "fromEmail",
              e.subject as "subject"
  `);
  return (res as unknown as { rows?: any[] }).rows ?? [];
}

export async function dispatchNiscEmEmailQueue(params?: {
  maxRuntimeMs?: number;
  claimBatchSize?: number;
}): Promise<DispatchResult> {
  const started = Date.now();
  const maxRuntimeMs = clamp(params?.maxRuntimeMs ?? 20_000, 1_000, 55_000);
  const claimBatchSize = clamp(params?.claimBatchSize ?? 200, 1, 2_000);

  const lockOk = await tryAcquireGlobalDispatchLock();
  if (!lockOk) return { ran: false, reason: "LOCK_HELD" };

  let claimed = 0;
  let sent = 0;
  let failed = 0;
  let throttled = 0;
  const touchedCampaignIds = new Set<string>();

  try {
    const quota = await getQuotaStatus(new Date());
    const envRate = envInt("NISC_EM_MAX_SEND_RATE");
    const configuredRate = envRate && envRate > 0 ? envRate : 14;
    const maxRate = Math.max(1, Math.floor(quota.maxSendRate || configuredRate));
    const ratePerSecond = clamp(Math.min(configuredRate, maxRate), 1, 1000);
    const limiter = new TokenBucketPerSecond(ratePerSecond);

    const ses = getSesClient();

    while (Date.now() - started < maxRuntimeMs) {
      const now = new Date();
      const batch = await claimQueuedEmails({ now, limit: claimBatchSize });
      if (batch.length === 0) break;

      claimed += batch.length;
      for (const b of batch) touchedCampaignIds.add(b.campaignId);

      // Prefetch campaigns for content and headers.
      const campaignIds = Array.from(new Set(batch.map((b) => b.campaignId)));
      const campaigns = await db.query.niscEmCampaign.findMany({
        where: (tbl, { inArray }) => inArray(tbl.id, campaignIds),
        columns: {
          id: true,
          subject: true,
          fromEmail: true,
          fromName: true,
          replyTo: true,
          htmlContent: true,
          textContent: true,
        },
      });
      const campaignById = new Map(campaigns.map((c) => [c.id, c]));

      for (const email of batch) {
        if (Date.now() - started >= maxRuntimeMs) break;
        const campaign = campaignById.get(email.campaignId);
        if (!campaign) {
          failed += 1;
          await db
            .update(niscEmEmail)
            .set({
              status: "FAILED",
              errorMessage: "Campaign not found for email row",
              updatedAt: new Date(),
            })
            .where(eq(niscEmEmail.id, email.id));
          continue;
        }

        const from =
          campaign.fromName?.trim()
            ? `${toRfc2047Utf8(campaign.fromName.trim())} <${campaign.fromEmail}>`
            : campaign.fromEmail;

        const raw = buildRawMimeEmail({
          from,
          to: email.toEmail,
          subject: campaign.subject ?? email.subject,
          replyTo: campaign.replyTo,
          text: campaign.textContent,
          html: campaign.htmlContent,
        });

        try {
          await limiter.take();
          const res = await sendSesRawEmail(ses, {
            RawMessage: { Data: raw },
          });

          const messageId = res.MessageId ?? null;
          const completedAt = new Date();

          await db.update(niscEmEmail)
            .set({
              status: "SENT",
              sesMessageId: messageId,
              sentAt: completedAt,
              errorMessage: null,
              updatedAt: completedAt,
            })
            .where(eq(niscEmEmail.id, email.id));

          sent += 1;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown SES send error";
          const retryable = isRetryableSesError(err);
          if (retryable) throttled += 1;
          failed += 1;

          await db.update(niscEmEmail)
            .set({
              status: retryable ? "QUEUED" : "FAILED",
              errorMessage: msg.slice(0, 2000),
              updatedAt: new Date(),
            })
            .where(eq(niscEmEmail.id, email.id));

          // If we get throttled, slow down to avoid hammering.
          if (retryable) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      }
    }

    // Update campaign status + sent counts so UI doesn't get stuck on SCHEDULED/SENDING.
    if (touchedCampaignIds.size > 0) {
      const ids = Array.from(touchedCampaignIds);
      const res = await db.execute<{
        campaignId: string;
        queuedCount: number;
        sendingCount: number;
        sentCount: number;
        failedCount: number;
      }>(sql`
        select
          e.campaign_id as "campaignId",
          count(*) filter (where e.status = 'QUEUED')::int as "queuedCount",
          count(*) filter (where e.status = 'SENDING')::int as "sendingCount",
          count(*) filter (where e.status = 'SENT')::int as "sentCount",
          count(*) filter (where e.status = 'FAILED')::int as "failedCount"
        from ${niscEmEmail} e
        where e.campaign_id = any(${ids}::text[])
        group by e.campaign_id
      `);

      const rows = (res as unknown as { rows?: any[] }).rows ?? [];
      const now = new Date();
      for (const r of rows) {
        const queuedCount = Number(r.queuedCount ?? 0);
        const sendingCount = Number(r.sendingCount ?? 0);
        const sentCount = Number(r.sentCount ?? 0);
        const failedCount = Number(r.failedCount ?? 0);
        const stillInFlight = queuedCount + sendingCount > 0;
        const finalStatus = stillInFlight ? "SENDING" : failedCount > 0 ? "FAILED" : "SENT";

        await db
          .update(niscEmCampaign)
          .set({
            status: finalStatus as any,
            totalSent: sentCount,
            sentAt: sentCount > 0 ? now : null,
            completedAt: stillInFlight ? null : now,
            updatedAt: now,
          })
          .where(eq(niscEmCampaign.id, r.campaignId));
      }
    }

    return {
      ran: true,
      claimed,
      sent,
      failed,
      throttled,
      elapsedMs: Date.now() - started,
    };
  } finally {
    try {
      await releaseGlobalDispatchLock();
    } catch {
      // ignore (lock will release on connection close)
    }
  }
}

async function countEligibleQueuedEmails(now: Date): Promise<number> {
  const res = await db.execute<{ value: number }>(sql`
    select count(*)::int as "value"
    from ${niscEmEmail} e
    join ${niscEmCampaign} c on c.id = e.campaign_id
    where e.status = 'QUEUED'
      and (
        c.status = 'SENDING'
        or (
          c.status = 'SCHEDULED'
          and (c.scheduled_at is null or c.scheduled_at <= ${now})
        )
      )
  `);
  const row = (res as unknown as { rows?: Array<{ value: number }> }).rows?.[0];
  return Number(row?.value ?? 0);
}

async function countEligibleEmailsByStatus(now: Date): Promise<Record<string, number>> {
  const res = await db.execute<{ status: string; value: number }>(sql`
    select e.status as "status", count(*)::int as "value"
    from ${niscEmEmail} e
    join ${niscEmCampaign} c on c.id = e.campaign_id
    where (
      c.status = 'SENDING'
      or (
        c.status = 'SCHEDULED'
        and (c.scheduled_at is null or c.scheduled_at <= ${now})
      )
    )
    group by e.status
  `);
  const rows = (res as unknown as { rows?: Array<{ status: string; value: number }> }).rows ?? [];
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = Number(r.value ?? 0);
  return out;
}

function topErrorMessages(
  counts: Map<string, number>,
  limit = 8,
): Array<{ message: string; count: number }> {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([message, count]) => ({ message, count }));
}

/**
 * Same dispatcher as {@link dispatchNiscEmEmailQueue} but returns extra diagnostics
 * that are useful to correlate with QStash job runs and Cloud Run logs.
 */
export async function dispatchNiscEmEmailQueueWithDebug(params?: {
  maxRuntimeMs?: number;
  claimBatchSize?: number;
}): Promise<{ result: DispatchResult; debug: NiscEmDispatchDebug }> {
  const startedAt = new Date();
  const startedMs = Date.now();
  const maxRuntimeMs = clamp(params?.maxRuntimeMs ?? 20_000, 1_000, 55_000);
  const claimBatchSize = clamp(params?.claimBatchSize ?? 200, 1, 2_000);

  const debugNow = new Date();
  const eligibleQueuedCountAtStart = await countEligibleQueuedEmails(debugNow);
  const eligibleByStatusAtStart = await countEligibleEmailsByStatus(debugNow);

  const lockOk = await tryAcquireGlobalDispatchLock();
  if (!lockOk) {
    return {
      result: { ran: false, reason: "LOCK_HELD" },
      debug: {
        startedAt: startedAt.toISOString(),
        maxRuntimeMs,
        claimBatchSize,
        ratePerSecond: 0,
        quota: {
          maxSendRate: 0,
          max24HourSend: 0,
          sentLast24HoursAtStart: 0,
          reservedEmails: 0,
          remainingEmails: 0,
        },
        queue: {
          eligibleQueuedCountAtStart,
          eligibleQueuedCountAtEnd: eligibleQueuedCountAtStart,
          eligibleByStatusAtStart,
          eligibleByStatusAtEnd: eligibleByStatusAtStart,
        },
        errors: { byMessage: [] },
      },
    };
  }

  const errorCounts = new Map<string, number>();

  try {
    const quota = await getQuotaStatus(new Date());
    const envRate = envInt("NISC_EM_MAX_SEND_RATE");
    const configuredRate = envRate && envRate > 0 ? envRate : 14;
    const maxRate = Math.max(1, Math.floor(quota.maxSendRate || configuredRate));
    const ratePerSecond = clamp(Math.min(configuredRate, maxRate), 1, 1000);

    // Run the real dispatcher logic (inlined to capture debug data without changing its public shape).
    let claimed = 0;
    let sent = 0;
    let failed = 0;
    let throttled = 0;
    const touchedCampaignIds = new Set<string>();

    const limiter = new TokenBucketPerSecond(ratePerSecond);
    const ses = getSesClient();

    while (Date.now() - startedMs < maxRuntimeMs) {
      const now = new Date();
      const batch = await claimQueuedEmails({ now, limit: claimBatchSize });
      if (batch.length === 0) break;

      claimed += batch.length;
      for (const b of batch) touchedCampaignIds.add(b.campaignId);

      const campaignIds = Array.from(new Set(batch.map((b) => b.campaignId)));
      const campaigns = await db.query.niscEmCampaign.findMany({
        where: (tbl, { inArray }) => inArray(tbl.id, campaignIds),
        columns: {
          id: true,
          subject: true,
          fromEmail: true,
          fromName: true,
          replyTo: true,
          htmlContent: true,
          textContent: true,
        },
      });
      const campaignById = new Map(campaigns.map((c) => [c.id, c]));

      for (const email of batch) {
        if (Date.now() - startedMs >= maxRuntimeMs) break;
        const campaign = campaignById.get(email.campaignId);
        if (!campaign) {
          failed += 1;
          await db
            .update(niscEmEmail)
            .set({
              status: "FAILED",
              errorMessage: "Campaign not found for email row",
              updatedAt: new Date(),
            })
            .where(eq(niscEmEmail.id, email.id));
          continue;
        }

        const from =
          campaign.fromName?.trim()
            ? `${toRfc2047Utf8(campaign.fromName.trim())} <${campaign.fromEmail}>`
            : campaign.fromEmail;

        const raw = buildRawMimeEmail({
          from,
          to: email.toEmail,
          subject: campaign.subject ?? email.subject,
          replyTo: campaign.replyTo,
          text: campaign.textContent,
          html: campaign.htmlContent,
        });

        try {
          await limiter.take();
          const res = await sendSesRawEmail(ses, {
            RawMessage: { Data: raw },
          });

          const messageId = res.MessageId ?? null;
          const completedAt = new Date();

          await db.update(niscEmEmail)
            .set({
              status: "SENT",
              sesMessageId: messageId,
              sentAt: completedAt,
              errorMessage: null,
              updatedAt: completedAt,
            })
            .where(eq(niscEmEmail.id, email.id));

          sent += 1;
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown SES send error";
          const retryable = isRetryableSesError(err);
          if (retryable) throttled += 1;
          failed += 1;

          errorCounts.set(msg, (errorCounts.get(msg) ?? 0) + 1);

          await db.update(niscEmEmail)
            .set({
              status: retryable ? "QUEUED" : "FAILED",
              errorMessage: msg.slice(0, 2000),
              updatedAt: new Date(),
            })
            .where(eq(niscEmEmail.id, email.id));

          if (retryable) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      }
    }

    // Keep campaign UI in sync (same as main dispatcher).
    if (touchedCampaignIds.size > 0) {
      const ids = Array.from(touchedCampaignIds);
      const res = await db.execute<{
        campaignId: string;
        queuedCount: number;
        sendingCount: number;
        sentCount: number;
        failedCount: number;
      }>(sql`
        select
          e.campaign_id as "campaignId",
          count(*) filter (where e.status = 'QUEUED')::int as "queuedCount",
          count(*) filter (where e.status = 'SENDING')::int as "sendingCount",
          count(*) filter (where e.status = 'SENT')::int as "sentCount",
          count(*) filter (where e.status = 'FAILED')::int as "failedCount"
        from ${niscEmEmail} e
        where e.campaign_id = any(${ids}::text[])
        group by e.campaign_id
      `);

      const rows = (res as unknown as { rows?: any[] }).rows ?? [];
      const now = new Date();
      for (const r of rows) {
        const queuedCount = Number(r.queuedCount ?? 0);
        const sendingCount = Number(r.sendingCount ?? 0);
        const sentCount = Number(r.sentCount ?? 0);
        const failedCount = Number(r.failedCount ?? 0);
        const stillInFlight = queuedCount + sendingCount > 0;
        const finalStatus = stillInFlight ? "SENDING" : failedCount > 0 ? "FAILED" : "SENT";

        await db
          .update(niscEmCampaign)
          .set({
            status: finalStatus as any,
            totalSent: sentCount,
            sentAt: sentCount > 0 ? now : null,
            completedAt: stillInFlight ? null : now,
            updatedAt: now,
          })
          .where(eq(niscEmCampaign.id, r.campaignId));
      }
    }

    const eligibleQueuedCountAtEnd = await countEligibleQueuedEmails(new Date());
    const eligibleByStatusAtEnd = await countEligibleEmailsByStatus(new Date());

    return {
      result: {
        ran: true,
        claimed,
        sent,
        failed,
        throttled,
        elapsedMs: Date.now() - startedMs,
      },
      debug: {
        startedAt: startedAt.toISOString(),
        maxRuntimeMs,
        claimBatchSize,
        ratePerSecond,
        quota: {
          maxSendRate: quota.maxSendRate,
          max24HourSend: quota.max24HourSend,
          sentLast24HoursAtStart: quota.sentLast24HoursAtStart,
          reservedEmails: quota.reservedEmails,
          remainingEmails: quota.remainingEmails,
        },
        queue: {
          eligibleQueuedCountAtStart,
          eligibleQueuedCountAtEnd,
          eligibleByStatusAtStart,
          eligibleByStatusAtEnd,
        },
        errors: { byMessage: topErrorMessages(errorCounts) },
      },
    };
  } finally {
    try {
      await releaseGlobalDispatchLock();
    } catch {
      // ignore
    }
  }
}

