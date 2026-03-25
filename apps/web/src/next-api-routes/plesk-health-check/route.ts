import { appRouter } from "@npanel/api";
import { auth } from "@npanel/auth";

/**
 * API route for Plesk health check endpoints.
 *
 * Usage:
 * - GET /api/plesk-health-check?type=xml - Test XML API
 * - GET /api/plesk-health-check?type=rest - Test REST API
 * - GET /api/plesk-health-check?type=all - Test both APIs
 * - GET /api/plesk-health-check - Test both APIs (default)
 */
export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const type = searchParams.get("type") || "all";

    // Create tRPC context
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const ctx = {
      session,
    };

    // Call the appropriate tRPC endpoint
    let result;
    const caller = appRouter.createCaller(ctx);

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

    return Response.json({
      success: true,
      type: type.toLowerCase(),
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error) {
    console.error("Plesk health check error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        type: "error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}


