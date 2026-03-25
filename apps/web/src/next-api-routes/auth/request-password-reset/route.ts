import { auth } from "@npanel/auth";
import prisma from "@npanel/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, redirectTo } = body as { email?: string; redirectTo?: string };

    if (!email) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists before sending any reset email (avoids misleading success + server "User not found" logs)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json(
        {
          error:
            "No account found with this email address. The email may be invalid or not registered. Please check the address or sign up for an account.",
        },
        { status: 404 }
      );
    }

    // Call Better Auth's requestPasswordReset API (user exists, so we can send the email)
    const result = await auth.api.requestPasswordReset({
      body: {
        email,
        ...(redirectTo && { redirectTo }),
      },
    });

    if (result && typeof result === "object" && "error" in result && result.error) {
      return Response.json(
        {
          error:
            (result.error as Error).message || "Failed to send password reset email",
        },
        { status: 400 }
      );
    }
    return Response.json({
      success: true,
      message: "Password reset instructions sent to your email"
    });

  } catch (error: unknown) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to send password reset email" },
      { status: 500 }
    );
  }
}
