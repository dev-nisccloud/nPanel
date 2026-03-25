import { NextRequest, NextResponse } from "next/server";
import { auth } from "@nPanel/auth";

export async function GET(request: NextRequest) {
  const { searchParams, pathname } = new URL(request.url);
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  // Handle token in URL path (Better Auth format): /api/auth/reset-password/TOKEN
  const pathSegments = pathname.split('/');
  const tokenFromPath = pathSegments[pathSegments.length - 1];
  
  // Use token from query param if available, otherwise from path
  const actualToken = token || tokenFromPath;

  const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";

  console.log("Password reset redirect received:", { 
    token: actualToken ? "present" : "missing", 
    error,
    tokenSource: token ? "query" : "path"
  });

  // If there's an error, redirect to frontend with error
  if (error) {
    console.log("Redirecting with error:", error);
    return NextResponse.redirect(`${frontendUrl}/reset-password?error=${error}`);
  }

  // If no token, redirect to frontend with error
  if (!actualToken) {
    console.log("No token provided, redirecting with error");
    return NextResponse.redirect(`${frontendUrl}/reset-password?error=INVALID_TOKEN`);
  }

  // Redirect to frontend with the token
  console.log("Redirecting to frontend with token:", actualToken);
  return NextResponse.redirect(`${frontendUrl}/reset-password?token=${actualToken}`);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newPassword, token } = body;

    console.log("Password reset request received:", { token: token ? "present" : "missing" });

    if (!newPassword || !token) {
      return NextResponse.json(
        { error: "Missing newPassword or token" },
        { status: 400 }
      );
    }

    // Call Better Auth's resetPassword API
    const result = await auth.api.resetPassword({
      body: {
        newPassword: newPassword,
        token: token,
      },
    });

    console.log("Password reset API result:", result);

    // Check if the result has an error property
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("Password reset error:", result.error);
      return NextResponse.json(
        { error: (result.error as Error).message || "Failed to reset password" },
        { status: 400 }
      );
    }

    console.log("✅ Password reset successful via API");
    return NextResponse.json({ success: true, message: "Password reset successfully" });

  } catch (error: unknown) {
    console.error("Password reset API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset password" },
      { status: 500 }
    );
  }
}