import { NextRequest, NextResponse } from "next/server";
import { auth } from "@nPanel/auth";
import prisma from "@nPanel/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    console.log("Password reset request received for email:", email);

    // Check if user exists in database first
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      console.log("User not found:", email);
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      );
    }

    console.log("User found, proceeding with password reset:", user.email);

    // Call Better Auth's requestPasswordReset API
    const result = await auth.api.requestPasswordReset({
      body: {
        email: email,
      },
    });

    console.log("Password reset API result:", result);

    // Check if the result has an error property
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      console.error("Password reset error:", result.error);
      return NextResponse.json(
        { error: (result.error as Error).message || "Failed to send password reset email" },
        { status: 400 }
      );
    }

    console.log("✅ Password reset email sent successfully");
    return NextResponse.json({ 
      success: true, 
      message: "Password reset instructions sent to your email" 
    });

  } catch (error: unknown) {
    console.error("Password reset API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send password reset email" },
      { status: 500 }
    );
  }
}
