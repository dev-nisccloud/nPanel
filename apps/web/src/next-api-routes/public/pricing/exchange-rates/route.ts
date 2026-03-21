import { NextRequest, NextResponse } from "next/server";
import { appRouter } from "@nPanel/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		const baseCurrency =
			request.nextUrl.searchParams.get("baseCurrency") ?? undefined;

		const caller = appRouter.createCaller({
			session: null,
		});

		const result = await caller.publicPricing.getExchangeRatesPublic(
			baseCurrency ? { baseCurrency } : undefined,
		);

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

