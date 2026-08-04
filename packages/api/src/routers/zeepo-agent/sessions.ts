import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { db } from "@npanel/db";
import {
	zeepoAgentActivityLog,
	zeepoAgentGeneration,
	zeepoAgentImageEditHistory,
	zeepoAgentMessage,
	zeepoAgentSession,
} from "@npanel/db/schema/zeepo-agent";
import { router } from "../../trpc";
import { zeepoAgentProcedure } from "./procedures";
import {
	assertCustomerCanUseZeepoAgent,
	assertZeepoAgentTeamAccess,
} from "../../lib/zeepo-agent-access";
import {
	collectHttpUrls,
	collectObjectKeysFromUrls,
	purgeObjectStorageKeys,
} from "../../lib/zeepo-agent-session-media";
import {
	createSessionSchema,
	deleteSessionSchema,
	getSessionSchema,
	listSessionsSchema,
	updateSessionTitleSchema,
} from "./schemas";

async function purgeSessionMedia(sessionId: string): Promise<void> {
	const [messages, generations, edits] = await Promise.all([
		db.query.zeepoAgentMessage.findMany({
			where: eq(zeepoAgentMessage.sessionId, sessionId),
			columns: { metadata: true },
		}),
		db.query.zeepoAgentGeneration.findMany({
			where: eq(zeepoAgentGeneration.sessionId, sessionId),
			columns: { outputs: true, inputs: true },
		}),
		db.query.zeepoAgentImageEditHistory.findMany({
			where: eq(zeepoAgentImageEditHistory.sessionId, sessionId),
			columns: { imageUrl: true },
		}),
	]);

	const urls = new Set<string>();
	const storageKeys: string[] = [];

	for (const message of messages) {
		const meta = message.metadata as
			| { attachments?: Array<{ url?: string; storageKey?: string }> }
			| null
			| undefined;
		for (const attachment of meta?.attachments ?? []) {
			if (attachment.storageKey?.trim()) storageKeys.push(attachment.storageKey.trim());
			if (attachment.url) urls.add(attachment.url);
		}
	}

	for (const generation of generations) {
		collectHttpUrls(generation.outputs, urls);
		collectHttpUrls(generation.inputs, urls);
	}

	for (const edit of edits) {
		if (edit.imageUrl) urls.add(edit.imageUrl);
	}

	const keys = collectObjectKeysFromUrls(urls, storageKeys);
	if (keys.length === 0) return;

	const result = await purgeObjectStorageKeys(keys);
	console.log(
		`[zeepo-agent] Purged session media for ${sessionId}: deleted=${result.deleted} failed=${result.failed}`,
	);
}

export const zeepoAgentSessionsRouter = router({
	create: zeepoAgentProcedure
		.input(createSessionSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}

			const teamId = await assertCustomerCanUseZeepoAgent({
				userId,
				userRole: ctx.session?.user?.role,
				teamId: input.teamId,
				requireTokens: true,
			});

			const id = randomUUID();
			const now = new Date();
			const title = input.title?.trim() || "New chat";

			await db.insert(zeepoAgentSession).values({
				id,
				userId,
				teamId,
				title,
				status: "ACTIVE",
				createdAt: now,
				updatedAt: now,
			});

			await db.insert(zeepoAgentActivityLog).values({
				id: randomUUID(),
				sessionId: id,
				userId,
				action: "CREATE_SESSION",
				description: `Created session: ${title}`,
				metadata: null,
				ipAddress: ctx.ipAddress ?? null,
				userAgent: ctx.req.header("user-agent") ?? null,
			});

			const session = await db.query.zeepoAgentSession.findFirst({
				where: eq(zeepoAgentSession.id, id),
			});

			return { data: session };
		}),

	list: zeepoAgentProcedure
		.input(listSessionsSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}

			await assertZeepoAgentTeamAccess({
				userId,
				userRole: ctx.session?.user?.role,
				teamId: input.teamId,
			});

			const offset = (input.page - 1) * input.limit;
			const conditions = [eq(zeepoAgentSession.userId, userId)];
			if (input.teamId) {
				conditions.push(eq(zeepoAgentSession.teamId, input.teamId));
			}

			const rows = await db.query.zeepoAgentSession.findMany({
				where: and(...conditions),
				orderBy: [desc(zeepoAgentSession.updatedAt)],
				limit: input.limit,
				offset,
			});

			const [{ value: total }] = await db
				.select({ value: count() })
				.from(zeepoAgentSession)
				.where(and(...conditions));

			return {
				data: rows,
				total,
				page: input.page,
				limit: input.limit,
			};
		}),

	get: zeepoAgentProcedure
		.input(getSessionSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}

			const session = await db.query.zeepoAgentSession.findFirst({
				where: and(
					eq(zeepoAgentSession.id, input.id),
					eq(zeepoAgentSession.userId, userId),
				),
				with: {
					messages: {
						orderBy: (m, { asc }) => [asc(m.createdAt)],
					},
				},
			});

			if (!session) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
			}

			return { data: session };
		}),

	updateTitle: zeepoAgentProcedure
		.input(updateSessionTitleSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			const session = await db.query.zeepoAgentSession.findFirst({
				where: and(
					eq(zeepoAgentSession.id, input.id),
					eq(zeepoAgentSession.userId, userId),
				),
			});
			if (!session) throw new TRPCError({ code: "NOT_FOUND" });

			await db
				.update(zeepoAgentSession)
				.set({ title: input.title, updatedAt: new Date() })
				.where(eq(zeepoAgentSession.id, input.id));

			return { success: true as const, title: input.title };
		}),

	delete: zeepoAgentProcedure
		.input(deleteSessionSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}

			// Ownership-only: the session creator alone may delete.
			// Role (including AGENCY_SUPER_ADMIN) never grants delete of another user's chat.
			const session = await db.query.zeepoAgentSession.findFirst({
				where: and(
					eq(zeepoAgentSession.id, input.id),
					eq(zeepoAgentSession.userId, userId),
				),
			});

			if (!session) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chat not found or you do not have permission to delete it.",
				});
			}

			// Remove durable media from object storage before cascading DB delete.
			await purgeSessionMedia(input.id);

			await db.delete(zeepoAgentSession).where(
				and(eq(zeepoAgentSession.id, input.id), eq(zeepoAgentSession.userId, userId)),
			);

			return { success: true as const };
		}),
});
