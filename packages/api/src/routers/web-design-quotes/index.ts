import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { db } from "@npanel/db";
import { webDesignQuoteRequest } from "@npanel/db/schema/web-design-quotes";
import { and, count, desc, eq } from "@npanel/db";
import { protectedProcedure, router } from "../../trpc";
import {
	apiWebDesignProjectTypeSchema,
	apiWebDesignQuoteStatusSchema,
	webDesignQuoteCreateInputSchema,
	webDesignQuoteCreateOutputSchema,
	webDesignQuoteListInputSchema,
	webDesignQuoteListOutputSchema,
} from "./schemas";

export const webDesignQuotesRouter = router({
	create: protectedProcedure
		.input(webDesignQuoteCreateInputSchema)
		.output(webDesignQuoteCreateOutputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to submit a quote request",
				});
			}

			const id = crypto.randomUUID();

			const [record] = await db
				.insert(webDesignQuoteRequest)
				.values({
					id,
					name: input.name,
					email: input.email,
					phone: input.phone,
					companyName: input.companyName,
					domain: input.domain ?? null,
					projectType: input.projectType,
					projectDescription: input.projectDescription,
					budget: input.budget,
					targetLaunchDate: input.targetLaunchDate ?? null,
					submittedById: userId,
				})
				.returning({
					id: webDesignQuoteRequest.id,
					createdAt: webDesignQuoteRequest.createdAt,
				});

			if (!record) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create quote request",
				});
			}

			return {
				id: record.id,
				createdAt: record.createdAt,
			};
		}),

	list: protectedProcedure
		.input(webDesignQuoteListInputSchema)
		.output(webDesignQuoteListOutputSchema)
		.query(async ({ ctx, input }) => {
			const session = ctx.session;
			const actorId = session?.user?.id;
			const actorRole = session?.user?.role;
			if (!actorId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to list quote requests",
				});
			}
			const isAgencyUser =
				actorRole === "AGENCY_USER" ||
				actorRole === "AGENCY_ADMIN" ||
				actorRole === "AGENCY_SUPER_ADMIN";

			const whereClause = and(
				input.status ? eq(webDesignQuoteRequest.status, input.status) : undefined,
				isAgencyUser ? undefined : eq(webDesignQuoteRequest.submittedById, actorId),
			);

			const [items, total] = await Promise.all([
				db
					.select({
						id: webDesignQuoteRequest.id,
						name: webDesignQuoteRequest.name,
						email: webDesignQuoteRequest.email,
						phone: webDesignQuoteRequest.phone,
						companyName: webDesignQuoteRequest.companyName,
						domain: webDesignQuoteRequest.domain,
						projectType: webDesignQuoteRequest.projectType,
						projectDescription: webDesignQuoteRequest.projectDescription,
						budget: webDesignQuoteRequest.budget,
						targetLaunchDate: webDesignQuoteRequest.targetLaunchDate,
						status: webDesignQuoteRequest.status,
						submittedById: webDesignQuoteRequest.submittedById,
						createdAt: webDesignQuoteRequest.createdAt,
						updatedAt: webDesignQuoteRequest.updatedAt,
					})
					.from(webDesignQuoteRequest)
					.where(whereClause)
					.orderBy(desc(webDesignQuoteRequest.createdAt))
					.limit(input.limit)
					.offset(input.offset),
				db
					.select({ total: count() })
					.from(webDesignQuoteRequest)
					.where(whereClause),
			]);

			return {
				items: items.map((r) => ({
					id: r.id,
					name: r.name,
					email: r.email,
					phone: r.phone,
					companyName: r.companyName,
					domain: r.domain,
					projectType: apiWebDesignProjectTypeSchema.parse(r.projectType),
					projectDescription: r.projectDescription,
					budget: r.budget,
					targetLaunchDate: r.targetLaunchDate,
					status: apiWebDesignQuoteStatusSchema.parse(r.status),
					submittedById: r.submittedById,
					createdAt: r.createdAt,
					updatedAt: r.updatedAt,
				})),
				total: total[0]?.total ?? 0,
			};
		}),
});
