import { appRouter } from "@npanel/api";


export async function POST(request: Request) {
	try {
		const input = await request.json();

		const caller = appRouter.createCaller({
			session: null,
		});

		const result = await caller.openProvider.domains.checkAvailability(input);

		return Response.json(result);
	} catch (error) {
		return Response.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

