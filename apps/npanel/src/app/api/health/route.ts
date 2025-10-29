import { NextResponse } from "next/server";
import prisma from "@nPanel/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error in production for monitoring
    if (process.env.NODE_ENV === "production") {
      // Use proper logging service here (e.g., Sentry, LogRocket)
    }
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}

