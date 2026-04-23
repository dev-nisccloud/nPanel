import { and, db, eq, inArray, sql } from "@npanel/db";
import { niscEmCampaign, niscEmEmail } from "@npanel/db/schema";
import { randomUUID } from "node:crypto";

import { getRedisClient } from "./redis";
import { getSesSendQuotaSnapshot } from "./ses-quota";
import { getSesClient, sendSesRawEmail } from "./ses-client";

// =============================================================================
// Types
// =============================================================================

type DispatchResult =
  | { ran: false; reason: "LOCK_HELD" }
  | {
      ran: true;
      claimed: number;
      sent: number;
      /** Rows we re-queued for a later retry (retryable SES errors). */
      requeued: number;
      /** Rows we marked FAILED permanently (non-retryable SES errors). */
      permanentlyFailed: number;
      /** Rows where SES threw a throttle-flavoured error, regardless of disposition. */
      throttled: number;
      elapsedMs: number;
      /**
       * True when the dispatcher stopped while there were still eligible emails
       * (either QUEUED or orphaned SENDING rows past the visibility timeout).
       * The caller should re-enqueue another dispatch to continue draining.
       */
      workRemaining: boolean;
      /** Count of eligible emails still pending at the end of the run. */
      remainingEligible: number;
    };

export type NiscEmDispatchDebug = {
  startedAt: string;
  maxRuntimeMs: number;
  claimBatchSize: number;
  ratePerSecond: number;
  rateLimiterMode: "redis_global" | "local_fallback";
  lockHolder: string | null;
  quota: {
    maxSendRate: number;
    max24HourSend: number;
    sentLast24Hours: number;
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
  warnings: string[];
};

// =============================================================================
// Constants
// =============================================================================

/**
 * How long an email row is allowed to sit in SENDING before another dispatcher
 * is allowed to reclaim it. This is our "visibility timeout" for orphaned rows
 * (e.g. when a previous run was killed by a Cloud Run timeout mid-batch).
 *
 * Must comfortably exceed the longest realistic SES sendRawEmail latency so we
 * never double-send a row that is actively in flight.
 */
const STALE_SENDING_RECLAIM_MS = 3 * 60 * 1000;

/** TTL granted on each lease acquisition. Heartbeats extend this. */
const LOCK_LEASE_MS = 60 * 1000;

/** How often the dispatcher heartbeats to extend its lease. */
const LOCK_HEARTBEAT_MS = 15 * 1000;

const LOCK_KEY_PREFIX = "nisc_em_dispatch";

/** Campaign statuses that are allowed to absorb the final state transition. */
const CAMPAIGN_TERMINAL_GUARD = ["SENDING", "SCHEDULED"] as const;

/** How many sends we buffer before flushing a campaign-status update. */
const CAMPAIGN_STATUS_UPDATE_INTERVAL_MS = 4_000;

// =============================================================================
// Env helpers
// =============================================================================

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

// =============================================================================
// MIME encoding
// =============================================================================

/**
 * RFC 2047 "encoded-word" (B-encoding) for non-ASCII header values.
 * We keep headers 7-bit safe so SES's RawMessage parser accepts them on every edge case.
 */
function toRfc2047Utf8(value: string): string {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  const buf = Buffer.from(value, "utf8");
  const b64 = buf.toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}

/**
 * Remove characters that would break a header line or allow header injection:
 *   - CR / LF (would split the header into multiple header lines)
 *   - NUL
 * We also collapse repeated whitespace and trim. Quoted-ness is handled by the caller.
 */
function sanitizeHeaderText(value: string): string {
  return value.replace(/[\r\n\x00]/g, "").replace(/\s+/g, " ").trim();
}

/** Escape for use inside a quoted-string RFC 5322 header (e.g. phrase in From). */
function quoteIfNeeded(value: string): string {
  if (!/["(),:;<>@\[\\\]]/.test(value)) return value;
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Format `From: Name <email>` in an RFC 5322-safe way:
 *   1. Sanitize raw name (strip CRLF/NUL, collapse whitespace).
 *   2. Quote it if it contains special chars.
 *   3. Q-encode (RFC 2047) if it has non-ASCII bytes.
 */
function formatFromHeader(fromEmail: string, fromName: string | null | undefined): string {
  const cleanedEmail = sanitizeHeaderText(fromEmail);
  if (!fromName?.trim()) return cleanedEmail;
  const name = sanitizeHeaderText(fromName);
  if (!name) return cleanedEmail;
  const quoted = quoteIfNeeded(name);
  const encoded = toRfc2047Utf8(quoted);
  return `${encoded} <${cleanedEmail}>`;
}

/**
 * Base64-encode a UTF-8 body, wrapping at 76-char lines as required by RFC 2045.
 * Base64 is used instead of quoted-printable because it guarantees every line of
 * MIME output is short, 7-bit clean, and CRLF-safe regardless of the input   HTML
 * content generated by the email builder frequently contains very long lines and
 * arbitrary UTF-8 bytes, both of which blow up a raw `Content-Transfer-Encoding: 7bit`
 * body and can make SES reject or silently truncate messages.
 */
function encodeBase64Wrapped(input: string): string {
  const b64 = Buffer.from(input, "utf8").toString("base64");
  const out: string[] = [];
  for (let i = 0; i < b64.length; i += 76) {
    out.push(b64.slice(i, i + 76));
  }
  return out.join("\r\n");
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
  lines.push(`To: ${sanitizeHeaderText(params.to)}`);
  lines.push(`Subject: ${toRfc2047Utf8(sanitizeHeaderText(params.subject))}`);
  if (params.replyTo) {
    const cleaned = sanitizeHeaderText(params.replyTo);
    if (cleaned) lines.push(`Reply-To: ${cleaned}`);
  }
  lines.push("MIME-Version: 1.0");
  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  lines.push("");

  const text = params.text?.trim() ? params.text : null;
  const html = params.html?.trim() ? params.html : null;

  if (text) {
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(encodeBase64Wrapped(text));
    lines.push("");
  }

  if (html) {
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/html; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(encodeBase64Wrapped(html));
    lines.push("");
  }

  if (!text && !html) {
    lines.push(`--${boundary}`);
    lines.push('Content-Type: text/plain; charset="UTF-8"');
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(encodeBase64Wrapped("(empty email)"));
    lines.push("");
  }

  lines.push(`--${boundary}--`);
  lines.push("");

  return Buffer.from(lines.join("\r\n"), "utf8");
}

// =============================================================================
// Rate limiter
// =============================================================================

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

/**
 * Account-wide fixed-window limiter backed by Upstash Redis.
 *
 * Why this exists:
 * - SES maxSendRate is account/global, not per worker/process.
 * - Multiple campaign workers can run concurrently (by design).
 * - A local in-process token bucket cannot coordinate across those workers.
 *
 * Algorithm:
 * - key = `nisc_em_ses_rate:<region>:<epochSecond>`
 * - INCR key
 * - first hit sets a short TTL (2s)
 * - allow only when counter <= configured rate
 */
class RedisFixedWindowPerSecondLimiter {
  constructor(
    private readonly ratePerSecond: number,
    private readonly keyPrefix: string,
  ) {}

  async take(): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
      throw new Error("UPSTASH_REDIS_UNAVAILABLE");
    }

    while (true) {
      const now = Date.now();
      const epochSecond = Math.floor(now / 1000);
      const key = `${this.keyPrefix}:${epochSecond}`;

      const used = Number(await redis.incr(key));
      if (used === 1) {
        // Keep key briefly for late arrivals / retries in same second window.
        await redis.expire(key, 2);
      }

      if (used <= this.ratePerSecond) {
        return;
      }

      // Window exhausted: wait for next second boundary.
      const sleepMs = Math.max(5, 1000 - (now % 1000));
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }
}

// =============================================================================
// SES error classification
// =============================================================================

/**
 * Retryable SES errors. Anything that smells like "try again in a moment":
 *   - Throttling / rate-limit (Throttling, ThrottlingException, TooManyRequestsException)
 *   - Transient 5xx from SES (ServiceUnavailable, InternalServerError)
 *   - Network errors (ECONNRESET, ETIMEDOUT, ENOTFOUND, socket hang up, etc.)
 *   - Generic "timeout" / "temporar" / "try again" messages
 *
 * Deliberately excludes:
 *   - MessageRejected (bad email address / content policy   permanent)
 *   - MailFromDomainNotVerified (config problem   permanent)
 *   - AccountSendingPausedException (SES has disabled sending   we want to stop, not retry)
 */
function isRetryableSesError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const anyErr = error as {
    name?: string;
    message?: string;
    code?: string;
    errno?: string;
    $metadata?: { httpStatusCode?: number };
  };
  const name = (anyErr.name ?? "").toLowerCase();
  const code = (anyErr.code ?? "").toLowerCase();
  const msg = (anyErr.message ?? "").toLowerCase();
  const errno = (anyErr.errno ?? "").toString().toLowerCase();
  const status = anyErr.$metadata?.httpStatusCode ?? 0;

  // Never retry the SES "sending paused" signal: it's an account-wide stop and we
  // shouldn't burn retries against it.
  if (name.includes("sendingpaused") || msg.includes("sending paused")) return false;

  // Classic SES throttling.
  if (
    name.includes("thrott") ||
    name.includes("toomany") ||
    code.includes("thrott") ||
    msg.includes("thrott") ||
    msg.includes("rate exceeded") ||
    msg.includes("maximum sending rate")
  ) {
    return true;
  }

  // SES service-side transient failures.
  if (
    name.includes("serviceunavailable") ||
    name.includes("internal") ||
    name.includes("internalfailure") ||
    msg.includes("service unavailable") ||
    msg.includes("internal error") ||
    msg.includes("temporar") ||
    msg.includes("try again")
  ) {
    return true;
  }

  // Network layer errors (AWS SDK surfaces via name/code/errno/message).
  if (
    name.includes("timeout") ||
    code.includes("timeout") ||
    msg.includes("timeout") ||
    errno.includes("timeout") ||
    ["econnreset", "etimedout", "enotfound", "eai_again", "epipe", "econnaborted", "enetunreach"].some(
      (c) => name === c || code === c || errno === c,
    ) ||
    msg.includes("socket hang up") ||
    msg.includes("network error")
  ) {
    return true;
  }

  // Any 5xx response is retryable by default.
  if (status >= 500 && status <= 599) return true;

  // 429 (rate limit)   retryable.
  if (status === 429) return true;

  return false;
}

// =============================================================================
// TTL lease lock (replaces session advisory lock)
// =============================================================================
// A previous implementation used pg_try_advisory_lock / pg_advisory_unlock on a
// pooled connection. Two failure modes made that unreliable:
//
//   1. node-postgres returns a *different* connection for the release, so the
//      lock silently leaked on the connection that acquired it   once the pool
//      closed that connection the lock eventually released, but in the meantime
//      any other dispatcher call saw LOCK_HELD.
//   2. If the worker process crashed before release (Cloud Run OOM / SIGTERM),
//      the pg backend's lock hung around until the TCP keepalive expired, which
//      on managed Postgres can be many minutes.
//
// The lease table (`nisc_em_dispatcher_lease`, created by drizzle migration
// 0016_melodic_stardust) is self-cleaning (expires_at < now => stealable) and
// holder-scoped (heartbeat / release only target the current run).

function buildLeaseKey(campaignId: string): string {
  return `${LOCK_KEY_PREFIX}:${campaignId}`;
}

async function tryAcquireLease(
  lockKey: string,
  holder: string,
  now: Date,
): Promise<boolean> {
  const expiresAt = new Date(now.getTime() + LOCK_LEASE_MS);

  // Insert a fresh lease. On conflict, steal it only if the previous lease is expired.
  // RETURNING holder lets us detect whether we actually own it.
  const res = await db.execute<{ holder: string }>(sql`
    insert into nisc_em_dispatcher_lease (lock_key, holder, acquired_at, expires_at, heartbeat_at)
    values (${lockKey}, ${holder}, ${now}, ${expiresAt}, ${now})
    on conflict (lock_key) do update
      set holder = excluded.holder,
          acquired_at = excluded.acquired_at,
          expires_at = excluded.expires_at,
          heartbeat_at = excluded.heartbeat_at
      where nisc_em_dispatcher_lease.expires_at <= ${now}
    returning holder
  `);
  const row = (res as unknown as { rows?: Array<{ holder: string }> }).rows?.[0];
  return row?.holder === holder;
}

async function heartbeatLease(lockKey: string, holder: string, now: Date): Promise<void> {
  const expiresAt = new Date(now.getTime() + LOCK_LEASE_MS);
  await db.execute(sql`
    update nisc_em_dispatcher_lease
       set expires_at = ${expiresAt},
           heartbeat_at = ${now}
     where lock_key = ${lockKey}
       and holder = ${holder}
  `);
}

async function releaseLease(lockKey: string, holder: string): Promise<void> {
  await db.execute(sql`
    delete from nisc_em_dispatcher_lease
     where lock_key = ${lockKey}
       and holder = ${holder}
  `);
}

// =============================================================================
// Queue query helpers
// =============================================================================

async function claimQueuedEmails(params: {
  now: Date;
  limit: number;
  campaignId: string;
}): Promise<
  Array<{
    id: string;
    campaignId: string;
    toEmail: string;
    fromEmail: string;
    subject: string;
  }>
> {
  const { now, limit, campaignId } = params;

  // Claim via SKIP LOCKED so multiple invocations don't double-send.
  //
  // We claim both:
  //   - QUEUED rows on an eligible campaign, AND
  //   - SENDING rows that have been sitting past the visibility timeout. These
  //     are orphans from a previous run that got killed mid-batch and would
  //     otherwise be stuck forever because nothing else flips them back to QUEUED.
  const staleCutoff = new Date(now.getTime() - STALE_SENDING_RECLAIM_MS);
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
      where (
              e.status = 'QUEUED'
              or (e.status = 'SENDING' and e.updated_at <= ${staleCutoff})
            )
        and c.id = ${campaignId}
        and (
          c.status = 'SENDING'
          or (
            c.status = 'SCHEDULED'
            and (c.scheduled_at is null or c.scheduled_at <= ${now})
          )
        )
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

/**
 * Counts emails that should be picked up on the next dispatcher run.
 * Mirrors the `claimQueuedEmails` selector (QUEUED + stale SENDING, eligible campaign).
 */
async function countEligiblePending(now: Date, campaignId: string): Promise<number> {
  const staleCutoff = new Date(now.getTime() - STALE_SENDING_RECLAIM_MS);
  const res = await db.execute<{ value: number }>(sql`
    select count(*)::int as "value"
    from ${niscEmEmail} e
    join ${niscEmCampaign} c on c.id = e.campaign_id
    where (
            e.status = 'QUEUED'
            or (e.status = 'SENDING' and e.updated_at <= ${staleCutoff})
          )
      and c.id = ${campaignId}
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

async function countEligibleQueuedEmails(now: Date, campaignId: string): Promise<number> {
  const res = await db.execute<{ value: number }>(sql`
    select count(*)::int as "value"
    from ${niscEmEmail} e
    join ${niscEmCampaign} c on c.id = e.campaign_id
    where e.status = 'QUEUED'
      and c.id = ${campaignId}
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

async function countEligibleEmailsByStatus(
  now: Date,
  campaignId: string,
): Promise<Record<string, number>> {
  const res = await db.execute<{ status: string; value: number }>(sql`
    select e.status as "status", count(*)::int as "value"
    from ${niscEmEmail} e
    join ${niscEmCampaign} c on c.id = e.campaign_id
    where c.id = ${campaignId}
      and (
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

// =============================================================================
// Email row write-back helpers
// =============================================================================

/**
 * Update the email row after SES accepted it. Retries transient DB errors so we
 * never leave a row in SENDING after SES actually delivered   the stale-reclaim
 * path would otherwise double-send it after the visibility timeout.
 */
async function writeSentStatusWithRetry(
  emailId: string,
  sesMessageId: string | null,
  sentAt: Date,
  warnings: string[],
): Promise<boolean> {
  const attempts = 5;
  for (let i = 0; i < attempts; i++) {
    try {
      await db
        .update(niscEmEmail)
        .set({
          status: "SENT",
          sesMessageId,
          sentAt,
          errorMessage: null,
          updatedAt: sentAt,
        })
        .where(eq(niscEmEmail.id, emailId));
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown DB error";
      const isLastAttempt = i === attempts - 1;
      if (isLastAttempt) {
        warnings.push(`sent_write_failed_after_retries:${emailId}:${msg.slice(0, 200)}`);
        console.error(
          JSON.stringify({
            msg: "nisc_em_dispatch_sent_write_failed",
            emailId,
            error: msg,
            attempts: attempts,
          }),
        );
        return false;
      }
      const backoffMs = 100 * 2 ** i;
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  return false;
}

/** Write the failure disposition for an email row. Best-effort with short retry. */
async function writeFailureStatus(
  emailId: string,
  retryable: boolean,
  message: string,
  now: Date,
): Promise<void> {
  const attempts = 3;
  for (let i = 0; i < attempts; i++) {
    try {
      await db
        .update(niscEmEmail)
        .set({
          status: retryable ? "QUEUED" : "FAILED",
          errorMessage: message.slice(0, 2000),
          updatedAt: now,
        })
        .where(eq(niscEmEmail.id, emailId));
      return;
    } catch (err) {
      const isLastAttempt = i === attempts - 1;
      if (isLastAttempt) {
        console.error(
          JSON.stringify({
            msg: "nisc_em_dispatch_failure_write_failed",
            emailId,
            retryable,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
        return;
      }
      await new Promise((r) => setTimeout(r, 100 * 2 ** i));
    }
  }
}

/**
 * Rows claimed into SENDING but never attempted in this run (because runtime
 * budget elapsed mid-batch) must be returned to QUEUED immediately.
 *
 * If we leave them as fresh SENDING, the next chained run won't reclaim them
 * until the stale timeout elapses, which makes the campaign appear "stuck"
 * despite healthy SES and no explicit errors.
 */
async function requeueUnattemptedBatchEmails(emailIds: string[], now: Date): Promise<void> {
  if (emailIds.length === 0) return;
  await db
    .update(niscEmEmail)
    .set({
      status: "QUEUED",
      updatedAt: now,
    })
    .where(inArray(niscEmEmail.id, emailIds));
}

/**
 * Re-aggregate email counts per touched campaign and update campaign status.
 *
 * Preserves CANCELLED   a user may cancel a campaign mid-drain and we must not
 * resurrect it to SENDING/SENT on the next flush. We guard by only UPDATE-ing
 * rows whose current status is in {SENDING, SCHEDULED}.
 */
async function updateCampaignStatuses(campaignId: string): Promise<void> {
  const rows = await db
    .select({
      campaignId: niscEmEmail.campaignId,
      queuedCount: sql<number>`count(*) filter (where ${niscEmEmail.status} = 'QUEUED')`,
      sendingCount: sql<number>`count(*) filter (where ${niscEmEmail.status} = 'SENDING')`,
      sentCount: sql<number>`count(*) filter (
        where ${niscEmEmail.status} in ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED')
      )`,
      failedCount: sql<number>`count(*) filter (where ${niscEmEmail.status} = 'FAILED')`,
    })
    .from(niscEmEmail)
    .where(eq(niscEmEmail.campaignId, campaignId))
    .groupBy(niscEmEmail.campaignId);

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
        sentAt: sentCount > 0 ? sql`coalesce(${niscEmCampaign.sentAt}, ${now})` : null,
        completedAt: stillInFlight ? null : now,
        updatedAt: now,
      })
      .where(
        and(
          eq(niscEmCampaign.id, r.campaignId),
          inArray(niscEmCampaign.status, [...CAMPAIGN_TERMINAL_GUARD]),
        ),
      );
  }
}

// =============================================================================
// Main dispatcher
// =============================================================================

export async function dispatchNiscEmEmailQueueWithDebug(params?: {
  campaignId: string;
  maxRuntimeMs?: number;
  claimBatchSize?: number;
}): Promise<{ result: DispatchResult; debug: NiscEmDispatchDebug }> {
  const startedAt = new Date();
  const startedMs = Date.now();
  const maxRuntimeMs = clamp(params?.maxRuntimeMs ?? 20_000, 1_000, 55_000);
  const claimBatchSize = clamp(params?.claimBatchSize ?? 200, 1, 2_000);
  const warnings: string[] = [];

  const campaignId = params?.campaignId;
  if (!campaignId) {
    throw new Error("dispatchNiscEmEmailQueueWithDebug requires campaignId");
  }

  const debugNow = new Date();
  const eligibleQueuedCountAtStart = await countEligibleQueuedEmails(debugNow, campaignId);
  const eligibleByStatusAtStart = await countEligibleEmailsByStatus(debugNow, campaignId);

  const lockKey = buildLeaseKey(campaignId);
  const holder = `${process.pid}-${randomUUID()}`;
  const lockOk = await tryAcquireLease(lockKey, holder, new Date());
  if (!lockOk) {
    return {
      result: { ran: false, reason: "LOCK_HELD" },
      debug: {
        startedAt: startedAt.toISOString(),
        maxRuntimeMs,
        claimBatchSize,
        ratePerSecond: 0,
        rateLimiterMode: "redis_global",
        lockHolder: null,
        quota: {
          maxSendRate: 0,
          max24HourSend: 0,
          sentLast24Hours: 0,
        },
        queue: {
          eligibleQueuedCountAtStart,
          eligibleQueuedCountAtEnd: eligibleQueuedCountAtStart,
          eligibleByStatusAtStart,
          eligibleByStatusAtEnd: eligibleByStatusAtStart,
        },
        errors: { byMessage: [] },
        warnings,
      },
    };
  }

  // Periodic heartbeat so the lease never expires while we're actively working.
  const heartbeatTimer = setInterval(() => {
    heartbeatLease(lockKey, holder, new Date()).catch((err) => {
      console.error(
        JSON.stringify({
          msg: "nisc_em_dispatch_heartbeat_failed",
          holder,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    });
  }, LOCK_HEARTBEAT_MS);
  // @ts-expect-error - node setInterval has unref; browsers don't. We're on node.
  heartbeatTimer.unref?.();

  const errorCounts = new Map<string, number>();

  let claimed = 0;
  let sent = 0;
  let requeued = 0;
  let permanentlyFailed = 0;
  let throttled = 0;
  let ratePerSecond = 0;
  let rateLimiterMode: "redis_global" | "local_fallback" = "redis_global";
  let consecutiveThrottleCount = 0;
  let lastStatusFlushMs = startedMs;
  try {
    const sesQuota = await getSesSendQuotaSnapshot();
    const envRate = envInt("NISC_EM_MAX_SEND_RATE");
    const configuredRate = envRate && envRate > 0 ? envRate : 14;
    const maxRate = Math.max(1, Math.floor(sesQuota.maxSendRate || configuredRate));
    ratePerSecond = clamp(Math.min(configuredRate, maxRate), 1, 1000);
    const sesRegion = (process.env.AWS_SES_REGION ?? "unknown").trim().toLowerCase();
    const redisLimiter = new RedisFixedWindowPerSecondLimiter(
      ratePerSecond,
      `nisc_em_ses_rate:${sesRegion}`,
    );
    const localLimiter = new TokenBucketPerSecond(ratePerSecond);
    let usingLocalLimiterFallback = false;
    const ses = getSesClient();

    while (Date.now() - startedMs < maxRuntimeMs) {
      const now = new Date();
      const batch = await claimQueuedEmails({ now, limit: claimBatchSize, campaignId });
      if (batch.length === 0) break;

      claimed += batch.length;

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

      let cutShortAtIndex: number | null = null;
      for (let i = 0; i < batch.length; i++) {
        if (Date.now() - startedMs >= maxRuntimeMs) {
          cutShortAtIndex = i;
          break;
        }
        const email = batch[i]!;

        const campaign = campaignById.get(email.campaignId);
        if (!campaign) {
          permanentlyFailed += 1;
          await writeFailureStatus(email.id, false, "Campaign not found for email row", new Date());
          continue;
        }

        const fromHeader = formatFromHeader(campaign.fromEmail, campaign.fromName);
        const raw = buildRawMimeEmail({
          from: fromHeader,
          to: email.toEmail,
          subject: campaign.subject ?? email.subject,
          replyTo: campaign.replyTo,
          text: campaign.textContent,
          html: campaign.htmlContent,
        });

        // ---------------------------------------------------------------------
        // SES send   isolate so DB write errors can't be classified as SES errors
        // ---------------------------------------------------------------------
        let sesResponse:
          | { ok: true; messageId: string | null }
          | { ok: false; error: unknown };
        try {
          try {
            await redisLimiter.take();
          } catch (limiterErr) {
            // Fallback safety: if Redis is unavailable, keep local limiting so we
            // still throttle each worker and avoid a complete fail-stop.
            if (!usingLocalLimiterFallback) {
              usingLocalLimiterFallback = true;
              rateLimiterMode = "local_fallback";
              const message =
                limiterErr instanceof Error ? limiterErr.message : String(limiterErr);
              warnings.push(`redis_global_rate_limiter_unavailable:${message}`);
              console.error(
                JSON.stringify({
                  msg: "nisc_em_dispatch_global_rate_limiter_unavailable",
                  error: message,
                  fallback: "local_token_bucket",
                }),
              );
            }
            await localLimiter.take();
          }
          const res = await sendSesRawEmail(ses, { RawMessage: { Data: raw } });
          sesResponse = { ok: true, messageId: res.MessageId ?? null };
          if (!res.MessageId) {
            warnings.push(`ses_missing_message_id:${email.id}`);
            console.warn(
              JSON.stringify({
                msg: "nisc_em_dispatch_ses_missing_message_id",
                emailId: email.id,
                campaignId: email.campaignId,
              }),
            );
          }
        } catch (err) {
          sesResponse = { ok: false, error: err };
        }

        // ---------------------------------------------------------------------
        // Disposition   DB writes happen outside the SES try so a DB outage
        // doesn't show up as a "SES error" and requeue an already-sent email.
        // ---------------------------------------------------------------------
        if (sesResponse.ok) {
          consecutiveThrottleCount = 0;
          const ok = await writeSentStatusWithRetry(
            email.id,
            sesResponse.messageId,
            new Date(),
            warnings,
          );
          if (ok) sent += 1;
          // If the SENT write failed after retries we cannot safely double-send:
          // the row stays SENDING, and the stale-reclaim visibility timeout
          // eventually flips it so someone can retry. We intentionally do NOT
          // resend here.
        } else {
          const err = sesResponse.error;
          const msg = err instanceof Error ? err.message : "Unknown SES send error";
          const retryable = isRetryableSesError(err);
          errorCounts.set(msg, (errorCounts.get(msg) ?? 0) + 1);
          if (retryable) {
            throttled += 1;
            requeued += 1;
            consecutiveThrottleCount += 1;
          } else {
            consecutiveThrottleCount = 0;
            permanentlyFailed += 1;
          }

          await writeFailureStatus(email.id, retryable, msg, new Date());

          if (retryable) {
            // Exponential backoff capped at 8s to let the token bucket recover.
            const backoffMs = Math.min(
              8_000,
              250 * 2 ** Math.min(consecutiveThrottleCount - 1, 5),
            );
            await new Promise((r) => setTimeout(r, backoffMs));
          }
        }

        // Flush campaign-status rollups periodically so the UI doesn't freeze
        // while a large campaign drains.
        if (Date.now() - lastStatusFlushMs > CAMPAIGN_STATUS_UPDATE_INTERVAL_MS) {
          lastStatusFlushMs = Date.now();
          // Best-effort; never let a partial-rollup error kill the run.
          updateCampaignStatuses(campaignId).catch((e) => {
            console.error(
              JSON.stringify({
                msg: "nisc_em_dispatch_rollup_flush_failed",
                error: e instanceof Error ? e.message : String(e),
              }),
            );
          });
        }
      }

      if (cutShortAtIndex != null) {
        const unattempted = batch.slice(cutShortAtIndex).map((e) => e.id);
        if (unattempted.length > 0) {
          await requeueUnattemptedBatchEmails(unattempted, new Date());
          requeued += unattempted.length;
          warnings.push(`requeued_unattempted_claimed_rows:${unattempted.length}`);
          console.log(
            JSON.stringify({
              msg: "nisc_em_dispatch_requeued_unattempted_claimed_rows",
              count: unattempted.length,
              claimBatchSize,
              elapsedMs: Date.now() - startedMs,
            }),
          );
        }
      }
    }

    // Final rollup   authoritative state once we stop the main loop.
    try {
      await updateCampaignStatuses(campaignId);
    } catch (err) {
      warnings.push(
        `final_rollup_failed:${err instanceof Error ? err.message : String(err)}`,
      );
    }

    const eligibleQueuedCountAtEnd = await countEligibleQueuedEmails(new Date(), campaignId);
    const eligibleByStatusAtEnd = await countEligibleEmailsByStatus(new Date(), campaignId);
    const remainingEligible = await countEligiblePending(new Date(), campaignId);

    return {
      result: {
        ran: true,
        claimed,
        sent,
        requeued,
        permanentlyFailed,
        throttled,
        elapsedMs: Date.now() - startedMs,
        workRemaining: remainingEligible > 0,
        remainingEligible,
      },
      debug: {
        startedAt: startedAt.toISOString(),
        maxRuntimeMs,
        claimBatchSize,
        ratePerSecond,
        rateLimiterMode,
        lockHolder: holder,
        quota: {
          maxSendRate: sesQuota.maxSendRate,
          max24HourSend: sesQuota.max24HourSend,
          sentLast24Hours: sesQuota.sentLast24Hours,
        },
        queue: {
          eligibleQueuedCountAtStart,
          eligibleQueuedCountAtEnd,
          eligibleByStatusAtStart,
          eligibleByStatusAtEnd,
        },
        errors: { byMessage: topErrorMessages(errorCounts) },
        warnings,
      },
    };
  } finally {
    clearInterval(heartbeatTimer);
    try {
      await releaseLease(lockKey, holder);
    } catch (err) {
      console.error(
        JSON.stringify({
          msg: "nisc_em_dispatch_release_lock_failed",
          holder,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }
}
