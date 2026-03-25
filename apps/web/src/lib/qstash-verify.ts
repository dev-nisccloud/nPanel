import { Receiver } from "@upstash/qstash";

type VerifySignatureConfig = {
  currentSigningKey?: string;
  nextSigningKey?: string;
};

/**
 * Minimal Web Fetch signature verifier for QStash jobs.
 * Keeps route handlers framework-agnostic.
 */
export async function verifySignatureAppRouter(
  request: Request,
  config: VerifySignatureConfig = {},
): Promise<boolean> {
  const signature = request.headers.get("upstash-signature");
  if (!signature) {
    throw new Error("Missing QStash signature header");
  }

  const receiver = new Receiver({
    currentSigningKey: config.currentSigningKey,
    nextSigningKey: config.nextSigningKey,
  });

  await receiver.verify({
    signature,
    body: await request.clone().text(),
    url: request.url,
  });

  return true;
}
