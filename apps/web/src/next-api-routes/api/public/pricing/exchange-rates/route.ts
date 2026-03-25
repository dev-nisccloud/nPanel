import { appRouter } from "@npanel/api";


export async function GET(request: Request) {
	try {
		const baseCurrency =
			new URL(request.url).searchParams.get("baseCurrency") ?? undefined;

		const caller = appRouter.createCaller({
			session: null,
		});

		const result = await caller.publicPricing.getExchangeRatesPublic(
			baseCurrency ? { baseCurrency } : undefined,
		);

		return Response.json(result);
	} catch (error) {
		return Response.json(
			{
				success: false,
				data: null,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

