import { Context } from "hono";
import { appRouter } from "@npanel/api/routers/index";
import { auth } from "@npanel/auth";
import { createContext, t } from "@npanel/api";

const appCaller = t.createCallerFactory(appRouter);

/**
 * API route for Plesk health check endpoints.
 */
export async function handlePleskHealthCheck(c: Context) {
  try {
    const type = c.req.query("type") || "all";

    // Create standard tRPC context using the same helper as the main TRPC middleware
    const ctx = await createContext({
      context: c,
      createCaller: (ctx) => appCaller(ctx),
    });

    const caller = appCaller(ctx);

    let result;
    switch (type.toLowerCase()) {
      case "xml":
        result = await caller.plesk.healthCheck.testXmlConnection();
        break;
      case "rest":
        result = await caller.plesk.healthCheck.testRestConnection();
        break;
      case "all":
      default:
        result = await caller.plesk.healthCheck.testAll();
        break;
    }

    return c.json({
      success: true,
      type: type.toLowerCase(),
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error) {
    console.error("[Webhook][PleskHealth] Error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, 500);
  }
}
