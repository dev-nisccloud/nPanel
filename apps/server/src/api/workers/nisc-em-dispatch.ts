import { Context } from "hono";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { verifySignature } from "../../lib/qstash-verify";
import { dispatchNiscEmEmailQueue } from "@npanel/api/lib/nisc-em-dispatcher";

export async function handleNiscEmDispatch(c: Context) {
  const request = c.req.raw;
  try {
    const signingKeys = getQStashSigningKeys();
    await verifySignature(request, {
      currentSigningKey: signingKeys.current ?? undefined,
      nextSigningKey: signingKeys.next ?? undefined,
    });
  } catch {
    return c.json({ error: "Invalid QStash signature" }, 401);
  }

  // Payload is currently unused; worker is safe to invoke repeatedly.
  // If JSON parse fails, we still run a dispatch (so the endpoint is easy to call manually for ops).
  try {
    await request.clone().json();
  } catch {
    // ignore
  }

  const result = await dispatchNiscEmEmailQueue();
  return c.json(result, 200);
}

