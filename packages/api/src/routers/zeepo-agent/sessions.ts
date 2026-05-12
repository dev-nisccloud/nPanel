import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import { db } from "@npanel/db";
import {
	zeepoAgentActivityLog,
	zeepoAgentSession,
} from "@npanel/db/schema/zeepo-agent";
import { protectedProcedure, router } from "../../trpc";
import {
	createSessionSchema,
	deleteSessionSchema,
	getSessionSchema,
	listSessionsSchema,
} from "./schemas";

export const zeepoAgentSessionsRouter = router({
	create: protectedProcedure
		.input(createSessionSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}
			const id = randomUUID();
			const now = new Date();
			const title = input.title?.trim() || "New chat";

			await db.insert(zeepoAgentSession).values({
				id,
				userId,
				teamId: input.teamId ?? null,
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

	list: protectedProcedure
		.input(listSessionsSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}

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

	get: protectedProcedure
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

	delete: protectedProcedure
		.input(deleteSessionSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}

			const session = await db.query.zeepoAgentSession.findFirst({
				where: and(
					eq(zeepoAgentSession.id, input.id),
					eq(zeepoAgentSession.userId, userId),
				),
			});

			if (!session) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
			}

			await db.delete(zeepoAgentSession).where(eq(zeepoAgentSession.id, input.id));

			return { success: true as const };
		}),
});
