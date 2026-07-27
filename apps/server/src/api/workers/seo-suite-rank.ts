import type { Context } from "hono";
import { getQStashSigningKeys } from "@npanel/api/lib/qstash/client";
import { processSeoSuiteRankTracker } from "@npanel/api/lib/seo-suite-jobs";
import { verifySignature } from "../../lib/qstash-verify";

interface Payload {
  trackerId: string;
  projectId: string;
  userId?: string;
}

export async function handleSeoSuiteRankCheck(c: Context) {
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

  let body: Payload;
  try {
    body = await request.clone().json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.trackerId || !body.projectId) {
    return c.json({ error: "Missing trackerId or projectId" }, 400);
  }

  const result = await processSeoSuiteRankTracker(body);
  return c.json({ ok: true, ...result });
}
