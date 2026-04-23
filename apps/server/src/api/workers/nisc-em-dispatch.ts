import { Context } from "hono";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { dispatchNiscEmEmailQueueWithDebug } from "@npanel/api/lib/nisc-em-dispatcher";
import { enqueueNiscEmDispatch } from "@npanel/api/lib/qstash/nisc-em-dispatch";
import type { NiscEmDispatchJobPayload } from "@npanel/api/lib/qstash/types";

import { verifySignature } from "../../lib/qstash-verify";

/**
 * Backoff applied when a dispatcher run claimed rows but made no forward progress
 * (sent === 0). Prevents a tight QStash self-chain loop if SES / the DB is stuck.
 */
const CHAIN_BACKOFF_MS_ON_NO_PROGRESS = 30_000;

function pickQStashHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of headers.entries()) {
    const key = k.toLowerCase();
    if (key.startsWith("upstash-")) out[key] = v;
    if (key === "x-forwarded-for" || key === "x-forwarded-proto") out[key] = v;
  }
  return out;
}

export async function handleNiscEmDispatch(c: Context) {
  const request = c.req.raw;
  const qstashHeaders = pickQStashHeaders(request.headers);
  try {
    const signingKeys = getQStashSigningKeys();
    await verifySignature(request, {
      currentSigningKey: signingKeys.current ?? undefined,
      nextSigningKey: signingKeys.next ?? undefined,
    });
  } catch {
    console.error(
      JSON.stringify({
        msg: "nisc_em_dispatch_signature_invalid",
        qstashHeaders,
      }),
    );
    return c.json({ error: "Invalid QStash signature", qstashHeaders }, 401);
  }

  // Campaign-scoped payload is required so one run cannot interfere with others.
  let payloadOk = true;
  let payload: NiscEmDispatchJobPayload | null = null;
  try {
    const parsed = await request.clone().json();
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as { kind?: string }).kind === "NISC_EM_DISPATCH" &&
      typeof (parsed as { campaignId?: string }).campaignId === "string" &&
      (parsed as { campaignId: string }).campaignId.length > 0
    ) {
      payload = parsed as NiscEmDispatchJobPayload;
    } else {
      payloadOk = false;
    }
  } catch {
    payloadOk = false;
  }
  if (!payload) {
    return c.json({ error: "Invalid payload: campaignId is required", qstashHeaders }, 400);
  }

  const { result, debug } = await dispatchNiscEmEmailQueueWithDebug({
    campaignId: payload.campaignId,
  });

  // ---------------------------------------------------------------------------
  // Self-chain with a progress-based circuit breaker.
  //
  // Baseline behaviour: a single run is capped by maxRuntimeMs (~20s) and serial
  // SES latency, so one run only drains ~60-80 emails. When work remains we
  // immediately enqueue another dispatch so a campaign fully drains without
  // needing an external cron.
  //
  // Circuit breaker rules:
  //   A) If the run was locked out (ran: false) do NOT chain — someone else is
  //      already draining and will do the chaining themselves.
  //   B) If no work is left (remainingEligible === 0) we're done.
  //   C) If the run claimed rows but sent zero of them (sent === 0), we're
  //      almost certainly hitting a systemic issue (DB write failures, SES
  //      account-level block, misconfiguration). Chaining immediately would
  //      spin QStash + SES without doing useful work, so we chain with a
  //      backoff delay.
  //   D) Otherwise (we made forward progress) chain immediately.
  // ---------------------------------------------------------------------------
  let chainedMessageId: string | null = null;
  let chainError: string | null = null;
  let chainStrategy: "none" | "immediate" | "backoff" = "none";

  if (result.ran && result.workRemaining && result.remainingEligible > 0) {
    const madeProgress = result.sent > 0;
    const attemptedButStuck = result.claimed > 0 && result.sent === 0;
    chainStrategy = attemptedButStuck ? "backoff" : "immediate";

    const scheduledFor =
      chainStrategy === "backoff"
        ? new Date(Date.now() + CHAIN_BACKOFF_MS_ON_NO_PROGRESS)
        : null;

    try {
      const next = await enqueueNiscEmDispatch(payload.campaignId, scheduledFor);
      chainedMessageId = next.messageId ?? null;
    } catch (err) {
      chainError = err instanceof Error ? err.message : "Unknown enqueue error";
      console.error(
        JSON.stringify({
          msg: "nisc_em_dispatch_chain_enqueue_failed",
          error: chainError,
          strategy: chainStrategy,
          campaignId: payload.campaignId,
          remainingEligible: result.remainingEligible,
          sent: result.sent,
          claimed: result.claimed,
          madeProgress,
        }),
      );
    }
  }

  console.log(
    JSON.stringify({
      msg: "nisc_em_dispatch_completed",
      payloadOk,
      qstashHeaders,
      campaignId: payload.campaignId,
      result,
      chained: {
        strategy: chainStrategy,
        messageId: chainedMessageId,
        error: chainError,
      },
      debug: {
        startedAt: debug.startedAt,
        elapsedMs: result.ran ? result.elapsedMs : undefined,
        ratePerSecond: debug.ratePerSecond,
        rateLimiterMode: debug.rateLimiterMode,
        lockHolder: debug.lockHolder,
        queue: debug.queue,
        errors: debug.errors,
        warnings: debug.warnings,
      },
    }),
  );

  // If the chain failed, surface a 500 so QStash retries (which will re-run this
  // handler and try to chain again). Never fail the response on successful drain.
  if (chainStrategy !== "none" && chainError) {
    return c.json({ payloadOk, qstashHeaders, result, debug, chainError }, 500);
  }

  return c.json(
    { payloadOk, qstashHeaders, result, debug, chainedMessageId, chainStrategy },
    200,
  );
}
