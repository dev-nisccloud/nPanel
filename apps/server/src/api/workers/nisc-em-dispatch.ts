import { Context } from "hono";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { verifySignature } from "../../lib/qstash-verify";
import { dispatchNiscEmEmailQueueWithDebug } from "@npanel/api/lib/nisc-em-dispatcher";

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

  // Payload is currently unused; worker is safe to invoke repeatedly.
  // If JSON parse fails, we still run a dispatch (so the endpoint is easy to call manually for ops).
  let payloadOk = true;
  try {
    await request.clone().json();
  } catch {
    // ignore
    payloadOk = false;
  }

  const { result, debug } = await dispatchNiscEmEmailQueueWithDebug();
  console.log(
    JSON.stringify({
      msg: "nisc_em_dispatch_completed",
      payloadOk,
      qstashHeaders,
      result,
      debug: {
        startedAt: debug.startedAt,
        elapsedMs: result.ran ? result.elapsedMs : undefined,
        ratePerSecond: debug.ratePerSecond,
        queue: debug.queue,
        errors: debug.errors,
      },
    }),
  );
  return c.json({ payloadOk, qstashHeaders, result, debug }, 200);
}

