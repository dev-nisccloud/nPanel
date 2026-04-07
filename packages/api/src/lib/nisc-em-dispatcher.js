import { db, eq, sql } from "@npanel/db";
import { niscEmCampaign, niscEmEmail } from "@npanel/db/schema";
import { getSesClient, sendSesRawEmail } from "./ses-client";
import { getQuotaStatus } from "./quota-reservation";
import { randomUUID } from "node:crypto";
function envInt(name) {
    const raw = process.env[name];
    if (!raw)
        return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n))
        return undefined;
    return Math.floor(n);
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function toRfc2047Utf8(value) {
    // Minimal RFC2047 Q-encoding for common UTF-8 subjects/names.
    // We only encode when needed (non-ascii).
    if (/^[\x00-\x7F]*$/.test(value))
        return value;
    const buf = Buffer.from(value, "utf8");
    const b64 = buf.toString("base64");
    return `=?UTF-8?B?${b64}?=`;
}
function buildRawMimeEmail(params) {
    const boundary = `npanel-${randomUUID()}`;
    const lines = [];
    lines.push(`From: ${params.from}`);
    lines.push(`To: ${params.to}`);
    lines.push(`Subject: ${toRfc2047Utf8(params.subject)}`);
    if (params.replyTo)
        lines.push(`Reply-To: ${params.replyTo}`);
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
    ratePerSecond;
    lastRefillMs = 0;
    tokens = 0;
    constructor(ratePerSecond) {
        this.ratePerSecond = ratePerSecond;
    }
    async take() {
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
function isRetryableSesError(error) {
    if (!error || typeof error !== "object")
        return false;
    const anyErr = error;
    const name = (anyErr.name ?? "").toLowerCase();
    const msg = (anyErr.message ?? "").toLowerCase();
    return (name.includes("thrott") ||
        name.includes("toomany") ||
        msg.includes("thrott") ||
        msg.includes("rate") ||
        msg.includes("timeout") ||
        msg.includes("temporar") ||
        msg.includes("try again"));
}
async function tryAcquireGlobalDispatchLock() {
    // Use a stable advisory lock key.
    // int4: hashtext('nisc_em_global_dispatch_v1')
    const res = await db.execute(sql `select pg_try_advisory_lock(hashtext('nisc_em_global_dispatch_v1')) as ok`);
    const row = res.rows?.[0];
    return Boolean(row?.ok);
}
async function releaseGlobalDispatchLock() {
    await db.execute(sql `select pg_advisory_unlock(hashtext('nisc_em_global_dispatch_v1'))`);
}
async function claimQueuedEmails(params) {
    const { now, limit } = params;
    // Claim via SKIP LOCKED so multiple invocations don't double-send.
    // Even though we use an advisory lock (single dispatcher), this keeps the queue robust.
    const res = await db.execute(sql `
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
    return res.rows ?? [];
}
export async function dispatchNiscEmEmailQueue(params) {
    const started = Date.now();
    const maxRuntimeMs = clamp(params?.maxRuntimeMs ?? 20_000, 1_000, 55_000);
    const claimBatchSize = clamp(params?.claimBatchSize ?? 200, 1, 2_000);
    const lockOk = await tryAcquireGlobalDispatchLock();
    if (!lockOk)
        return { ran: false, reason: "LOCK_HELD" };
    let claimed = 0;
    let sent = 0;
    let failed = 0;
    let throttled = 0;
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
            if (batch.length === 0)
                break;
            claimed += batch.length;
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
                if (Date.now() - started >= maxRuntimeMs)
                    break;
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
                const from = campaign.fromName?.trim()
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
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : "Unknown SES send error";
                    const retryable = isRetryableSesError(err);
                    if (retryable)
                        throttled += 1;
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
        return {
            ran: true,
            claimed,
            sent,
            failed,
            throttled,
            elapsedMs: Date.now() - started,
        };
    }
    finally {
        try {
            await releaseGlobalDispatchLock();
        }
        catch {
            // ignore (lock will release on connection close)
        }
    }
}
