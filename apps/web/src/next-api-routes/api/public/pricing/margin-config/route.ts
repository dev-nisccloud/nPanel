import { appRouter } from "@npanel/api";


export async function GET() {
	try {
		const caller = appRouter.createCaller({
			session: null,
		});

		const result = await caller.publicPricing.getDefaultMarginConfig();

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

