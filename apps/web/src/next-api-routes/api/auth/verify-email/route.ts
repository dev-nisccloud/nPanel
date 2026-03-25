import { auth } from "@npanel/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return Response.json(
        { error: "Missing verification token" },
        { status: 400 }
      );
    }

    console.log("Email verification request received:", { token: token ? "present" : "missing" });

    // Call Better Auth's verifyEmail API
    const result = await auth.api.verifyEmail({
      query: {
        token: token,
      },
    });

    console.log("Email verification API result:", result);

    // Check if the result has an error property
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("Email verification error:", result.error);
      return Response.json(
        { error: (result.error as Error).message || "Failed to verify email" },
        { status: 400 }
      );
    }

    console.log("Ã¢Å“â€¦ Email verification successful via API");
    return Response.json({ success: true, message: "Email verified successfully" });

  } catch (error: unknown) {
    console.error("Email verification API error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to verify email" },
      { status: 500 }
    );
  }
}
