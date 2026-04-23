import { Context } from "hono";
import { persistNiscEmEmailEventFromSnsNotification } from "@npanel/api/lib/nisc-em-sns-webhook";

/**
 * AWS SNS Webhook Handler
 *
 * SNS always sends Content-Type: text/plain even though the body is JSON.
 * This handler logs every incoming request and automatically confirms
 * SubscriptionConfirmation messages so the SNS subscription becomes active.
 */
export async function handleSnsWebhook(c: Context) {
  const req = c.req.raw;
  try {
    const rawBody = await req.text();

    console.log("[Webhook][SNS] Incoming request");
    console.log("[Webhook][SNS] Headers:", Object.fromEntries(req.headers.entries()));

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      console.warn("[Webhook][SNS] Body is not valid JSON:", rawBody);
      return c.json({ received: true, reason: "invalid_json" }, 200);
    }

    console.log("[Webhook][SNS] Body:", JSON.stringify(body, null, 2));

    const messageType = body["Type"] as string | undefined;

    // SNS requires the subscriber to confirm the subscription before it starts delivering events.
    if (messageType === "SubscriptionConfirmation") {
      console.log("[Webhook][SNS] SubscriptionConfirmation received.");

      const subscribeUrl = body["SubscribeURL"];
      if (typeof subscribeUrl !== "string") {
        console.warn("[Webhook][SNS] SubscriptionConfirmation missing SubscribeURL.");
        return c.json({ success: false, message: "Invalid SubscribeURL" }, 400);
      }

      // Validate the URL is from a trusted AWS SNS hostname before requesting it (SSRF protection).
      // Legitimate URLs look like: https://sns.<region>.amazonaws.com/?Action=ConfirmSubscription&...
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(subscribeUrl);
      } catch {
        console.warn("[Webhook][SNS] SubscriptionConfirmation has unparseable SubscribeURL:", subscribeUrl);
        return c.json({ success: false, message: "Invalid SubscribeURL" }, 400);
      }

      const SNS_HOST_RE = /^sns\.[a-z0-9-]+\.amazonaws\.com$/;
      if (parsedUrl.protocol !== "https:" || !SNS_HOST_RE.test(parsedUrl.hostname)) {
        console.warn(`[Webhook][SNS] SubscriptionConfirmation rejected   disallowed host: ${parsedUrl.hostname}`);
        return c.json({ success: false, message: "Invalid SubscribeURL" }, 400);
      }

      try {
        const confirmResponse = await fetch(subscribeUrl);
        if (confirmResponse.ok) {
          console.log("[Webhook][SNS] Subscription confirmed successfully. Status:", confirmResponse.status);
          return c.json({ success: true, message: "Subscription confirmed" }, 200);
        } else {
          console.error("[Webhook][SNS] Failed to confirm subscription:", confirmResponse.statusText);
          return c.json({ success: false, message: "Failed to confirm subscription" }, 200);
        }
      } catch (err) {
        console.error("[Webhook][SNS] Error confirming subscription:", err);
        return c.json({ success: false, message: "Error confirming subscription" }, 200);
      }
    }

    if (messageType === "UnsubscribeConfirmation") {
      console.log("[Webhook][SNS] UnsubscribeConfirmation received.");
      return c.json({ received: true }, 200);
    }

    if (messageType === "Notification") {
      const topicArn = body["TopicArn"] as string | undefined;
      console.log("[Webhook][SNS] Notification from topic:", topicArn);

      try {
        await persistNiscEmEmailEventFromSnsNotification(rawBody, body);
      } catch (err) {
        console.error("[Webhook][SNS] Failed to persist nisc email event:", err);
        return c.json({ error: "persist_failed" }, 500);
      }

      return c.json({ received: true }, 200);
    }

    console.log("[Webhook][SNS] Unknown message type:", messageType);
    return c.json({ received: true }, 200);
  } catch (error) {
    console.error("[Webhook][SNS] Unexpected error:", error);
    return c.json({ received: true, reason: "error_handled" }, 200);
  }
}
