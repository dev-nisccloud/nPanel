import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");
  const { token } = await params;

  const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3002";

  console.log("Password reset redirect received (dynamic route):", { 
    token: token ? "present" : "missing", 
    error 
  });

  // If there's an error, redirect to frontend with error
  if (error) {
    console.log("Redirecting with error:", error);
    return NextResponse.redirect(`${frontendUrl}/reset-password?error=${error}`);
  }

  // If no token, redirect to frontend with error
  if (!token) {
    console.log("No token provided, redirecting with error");
    return NextResponse.redirect(`${frontendUrl}/reset-password?error=INVALID_TOKEN`);
  }

  // Redirect to frontend with the token
  console.log("Redirecting to frontend with token:", token);
  return NextResponse.redirect(`${frontendUrl}/reset-password?token=${token}`);
}
