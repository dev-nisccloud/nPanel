import { Receiver } from "@upstash/qstash";

type VerifySignatureConfig = {
  currentSigningKey?: string;
  nextSigningKey?: string;
};

/**
 * Minimal Web Fetch signature verifier for QStash jobs.
 * Keeps route handlers framework-agnostic.
 */
export async function verifySignature(
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

  const body = await request.clone().text();
  let url = request.url;

  // Normalize protocol if behind a proxy like ngrok or Vercel
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto && url.startsWith("http://")) {
    url = url.replace("http://", `${forwardedProto}://`);
  }

  await receiver.verify({
    signature,
    body,
    url,
  });

  return true;
}
