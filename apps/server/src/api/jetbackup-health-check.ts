import { Context } from "hono";
import { appRouter } from "@npanel/api/routers/index";
import { createContext, t } from "@npanel/api";

const appCaller = t.createCallerFactory(appRouter);

/**
 * API route for JetBackup 5 health check endpoint.
 */
export async function handleJetBackupHealthCheck(c: Context) {
  try {
    // Create standard tRPC context
    const ctx = await createContext({
      context: c,
      createCaller: (ctx) => appCaller(ctx),
    });

    const caller = appCaller(ctx);
    const result = await caller.jetbackup.jobs.listBackup({});

    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error) {
    console.error("[Webhook][JetBackupHealth] Error:", error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }, 500);
  }
}
