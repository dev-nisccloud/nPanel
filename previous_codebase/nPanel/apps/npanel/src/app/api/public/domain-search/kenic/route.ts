import { NextRequest, NextResponse } from "next/server";
import { appRouter } from "@nPanel/api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
	try {
		const input = await request.json();

		const caller = appRouter.createCaller({
			session: null,
		});

		const result = await caller.kenic.domainCheck.check(input);

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

