import { TRPCError } from "@trpc/server";
import { desc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@npanel/db";
import {
	zeepoAgentActivityLog,
	zeepoAgentGeneration,
	zeepoAgentSession,
} from "@npanel/db/schema/zeepo-agent";
import { router } from "../../trpc";
import { zeepoAgentProcedure } from "./procedures";
import {
	redactZeepoAgentGenerationRow,
	resolveZeepoAgentStoredErrorMessage,
} from "../../lib/zeepo-agent-errors";
import { enqueueZeepoAgentGeneration } from "../../lib/qstash/zeepo-agent";
import { redactReplicateHostedUrlsDeep } from "../../lib/replicate-hosted-url";
import { getGenerationSchema } from "./schemas";

export async function insertAndEnqueueAgentGeneration(params: {
	userId: string;
	teamId: string | null;
	sessionId: string;
	messageId: string | null;
	modelCategory: string;
	modelId: string;
	prompt?: string | null;
	inputs?: unknown;
	ctx: { ipAddress?: string | null; userAgent?: string | null };
	/** Extra seconds to wait before QStash delivers this job to the worker.
	 *  Use when multiple generations are enqueued in the same turn to
	 *  stagger Replicate API calls and avoid HTTP 429 rate-limit errors. */
	delaySeconds?: number;
}): Promise<{ generationId: string }> {
	const {
		userId,
		teamId,
		sessionId,
		messageId,
		modelCategory,
		modelId,
		prompt,
		inputs,
		ctx,
		delaySeconds,
	} = params;
	const generationId = randomUUID();
	const now = new Date();

	await db.insert(zeepoAgentGeneration).values({
		id: generationId,
		sessionId,
		messageId,
		userId,
		teamId,
		modelCategory,
		modelId,
		prompt: prompt ?? null,
		inputs: inputs as any,
		status: "QUEUED",
		errorMessage: null,
		qstashMessageId: null,
		createdAt: now,
		updatedAt: now,
	});

	try {
		const result = await enqueueZeepoAgentGeneration(generationId, { delaySeconds });
		await db
			.update(zeepoAgentGeneration)
			.set({ qstashMessageId: result.messageId, updatedAt: new Date() })
			.where(eq(zeepoAgentGeneration.id, generationId));
	} catch (err) {
		console.error("QStash enqueue failed for Zeepo Agent:", err);
		await db
			.update(zeepoAgentGeneration)
			.set({
				status: "FAILED",
				errorMessage: resolveZeepoAgentStoredErrorMessage(err),
				updatedAt: new Date(),
			})
			.where(eq(zeepoAgentGeneration.id, generationId));
		throw err;
	}

	await db.insert(zeepoAgentActivityLog).values({
		id: randomUUID(),
		sessionId,
		userId,
		action: "GENERATE",
		description: `Started ${modelCategory} generation using ${modelId}`,
		metadata: { generationId, messageId, prompt },
		ipAddress: ctx.ipAddress ?? null,
		userAgent: ctx.userAgent ?? null,
	});

	return { generationId };
}

export const zeepoAgentGenerateRouter = router({
	getGeneration: zeepoAgentProcedure
		.input(getGenerationSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}

			const generation = await db.query.zeepoAgentGeneration.findFirst({
				where: eq(zeepoAgentGeneration.id, input.generationId),
			});

			if (!generation || generation.userId !== userId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Generation not found",
				});
			}

			const safe = redactZeepoAgentGenerationRow({
				...(generation as Record<string, unknown>),
				outputs: redactReplicateHostedUrlsDeep((generation as { outputs?: unknown }).outputs),
			});
			return { data: safe as any };
		}),

	listBySession: zeepoAgentProcedure
		.input(z.object({ sessionId: z.string() }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}

			const session = await db.query.zeepoAgentSession.findFirst({
				where: eq(zeepoAgentSession.id, input.sessionId),
			});
			if (!session || session.userId !== userId) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
			}

			const rows = await db.query.zeepoAgentGeneration.findMany({
				where: eq(zeepoAgentGeneration.sessionId, input.sessionId),
				orderBy: [desc(zeepoAgentGeneration.createdAt)],
				limit: 50,
			});

			const sanitized = (rows as { outputs?: unknown; errorMessage?: string | null }[]).map(
				(row) =>
					redactZeepoAgentGenerationRow({
						...row,
						outputs: redactReplicateHostedUrlsDeep(row.outputs),
					}),
			);
			return { data: sanitized as any[] };
		}),
});
