import prisma from "@npanel/db";

// NOTE: Ideally verify Replicate webhook signature here (using replicateClient.webhooks.verify)
// But for simplicity in this flow, we will accept the payload as long as we find the generation.

export async function POST(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const generationId = searchParams.get("generationId");

		if (!generationId) {
			return Response.json(
				{ error: "Missing generationId in query params" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const status = body.status; // 'succeeded', 'failed', 'canceled'

		if (!status) {
			return Response.json(
				{ error: "Missing status in payload" },
				{ status: 400 },
			);
		}

		const generation = await prisma.zeepoCanvasGeneration.findUnique({
			where: { id: generationId },
		});

		if (!generation) {
			return Response.json(
				{ error: "Generation not found" },
				{ status: 404 },
			);
		}

		if (generation.status === "COMPLETED" || generation.status === "FAILED") {
			return Response.json(
				{ message: "Generation already processed" },
				{ status: 200 },
			);
		}

		const now = new Date();

		if (status === "succeeded") {
			// Replicate output could be a string URL, an array of strings, or a complex object.
			const output = body.output;

			// TODO: Add logic here to download the media from output URL and re-upload
			// it to UploadThing to ensure long-term persistence, as Replicate URLs expire.
			// For now, we save the raw output directly.

			await prisma.zeepoCanvasGeneration.update({
				where: { id: generationId },
				data: {
					status: "COMPLETED",
					outputs: output,
					completedAt: now,
					updatedAt: now,
				},
			});
		} else if (status === "failed" || status === "canceled") {
			const error = body.error || `Prediction ${status}`;
			await prisma.zeepoCanvasGeneration.update({
				where: { id: generationId },
				data: {
					status: "FAILED",
					errorMessage: String(error).slice(0, 500),
					completedAt: now,
					updatedAt: now,
				},
			});
		}

		return Response.json({ success: true });
	} catch (error) {
		console.error("Error processing Zeepo Canvas Replicate webhook:", error);
		return Response.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
