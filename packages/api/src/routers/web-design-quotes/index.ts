import * as crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc";
import prisma from "@nPanel/db";
import {
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

			const record = await prisma.webDesignQuoteRequest.create({
				data: {
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
				},
				select: { id: true, createdAt: true },
			});

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
			if (!session?.user?.id) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "You must be logged in to list quote requests",
				});
			}

			const where = input.status ? { status: input.status } : {};
			const [items, total] = await Promise.all([
				prisma.webDesignQuoteRequest.findMany({
					where,
					orderBy: { createdAt: "desc" },
					take: input.limit,
					skip: input.offset,
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
						companyName: true,
						domain: true,
						projectType: true,
						projectDescription: true,
						budget: true,
						targetLaunchDate: true,
						status: true,
						submittedById: true,
						createdAt: true,
						updatedAt: true,
					},
				}),
				prisma.webDesignQuoteRequest.count({ where }),
			]);

			return {
				items: items.map((r) => ({
					id: r.id,
					name: r.name,
					email: r.email,
					phone: r.phone,
					companyName: r.companyName,
					domain: r.domain,
					projectType: r.projectType,
					projectDescription: r.projectDescription,
					budget: r.budget,
					targetLaunchDate: r.targetLaunchDate,
					status: r.status,
					submittedById: r.submittedById,
					createdAt: r.createdAt,
					updatedAt: r.updatedAt,
				})),
				total,
			};
		}),
});
