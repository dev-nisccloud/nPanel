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
		console.error("Public domain search error:", error);
		return Response.json(
			{
				success: false,
				error:
					"An error occurred. Please try again or contact support about your issue.",
			},
			{ status: 500 },
		);
	}
}

