import { NextResponse } from "next/server";
import { appRouter } from "@nPanel/api";

export const runtime = "nodejs";

export async function GET() {
	try {
		const caller = appRouter.createCaller({
			session: null,
		});

		const result = await caller.publicPricing.getDefaultMarginConfig();

		return NextResponse.json(result);
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				data: null,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

