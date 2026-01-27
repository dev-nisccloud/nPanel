import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import prisma from "@nPanel/db";
import {
	emailTemplateCreateInputSchema,
	emailTemplateUpdateInputSchema,
	emailTemplateListFiltersSchema,
	emailTemplateDetailSchema,
	emailTemplateListResponseSchema,
} from "./schemas";

export const emailMarketingTemplatesRouter = router({
	create: protectedProcedure
		.input(emailTemplateCreateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const now = new Date();
			const template = await prisma.emailTemplate.create({
				data: {
					id: crypto.randomUUID(),
					name: input.name,
					description: input.description ?? null,
					subject: input.subject ?? null,
					htmlContent: input.htmlContent ?? null,
					textContent: input.textContent ?? null,
					variables: input.variables ?? undefined,
					userId,
					teamId: input.teamId ?? null,
					isActive: true,
					createdAt: now,
					updatedAt: now,
				},
			});

			return emailTemplateDetailSchema.parse({
				...template,
				description: template.description ?? null,
				subject: template.subject ?? null,
				htmlContent: template.htmlContent ?? null,
				textContent: template.textContent ?? null,
				variables: template.variables ?? null,
				metadata: null,
				teamId: template.teamId ?? null,
			});
		}),

	getById: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const template = await prisma.emailTemplate.findUnique({
				where: { id: input.id },
			});

			if (!template) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found",
				});
			}

			// Check access
			if (template.userId !== userId) {
				if (template.teamId) {
					const teamMember = await prisma.teamMember.findUnique({
						where: {
							teamId_userId: {
								teamId: template.teamId,
								userId,
							},
						},
					});

					if (!teamMember) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: "Access denied",
						});
					}
				} else {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Access denied",
					});
				}
			}

			return emailTemplateDetailSchema.parse({
				...template,
				description: template.description ?? null,
				subject: template.subject ?? null,
				htmlContent: template.htmlContent ?? null,
				textContent: template.textContent ?? null,
				variables: template.variables ?? null,
				metadata: null,
				teamId: template.teamId ?? null,
			});
		}),

	list: protectedProcedure
		.input(emailTemplateListFiltersSchema)
		.query(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const where: any = {
				OR: [
					{ userId },
					...(input.teamId
						? [
								{
									teamId: input.teamId,
									team: {
										members: {
											some: { userId },
										},
									},
								},
							]
						: []),
				],
			};

			if (input.isActive !== undefined) {
				where.isActive = input.isActive;
			}

			if (input.search) {
				where.name = { contains: input.search, mode: "insensitive" };
			}

			const [templates, total] = await Promise.all([
				prisma.emailTemplate.findMany({
					where,
					skip: input.offset,
					take: input.limit,
					orderBy: { createdAt: "desc" },
				}),
				prisma.emailTemplate.count({ where }),
			]);

			return emailTemplateListResponseSchema.parse({
				templates: templates.map((t) => ({
					...t,
					description: t.description ?? null,
					subject: t.subject ?? null,
					teamId: t.teamId ?? null,
				})),
				total,
			});
		}),

	update: protectedProcedure
		.input(emailTemplateUpdateInputSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const template = await prisma.emailTemplate.findUnique({
				where: { id: input.id },
			});

			if (!template) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found",
				});
			}

			// Check access
			if (template.userId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			const updatedTemplate = await prisma.emailTemplate.update({
				where: { id: input.id },
				data: {
					...(input.name && { name: input.name }),
					...(input.description !== undefined && {
						description: input.description,
					}),
					...(input.subject !== undefined && { subject: input.subject }),
					...(input.htmlContent !== undefined && {
						htmlContent: input.htmlContent,
					}),
					...(input.textContent !== undefined && {
						textContent: input.textContent,
					}),
					...(input.variables !== undefined && { 
						variables: input.variables ?? undefined 
					}),
					...(input.isActive !== undefined && { isActive: input.isActive }),
					updatedAt: new Date(),
				},
			});

			return emailTemplateDetailSchema.parse({
				...updatedTemplate,
				description: updatedTemplate.description ?? null,
				subject: updatedTemplate.subject ?? null,
				htmlContent: updatedTemplate.htmlContent ?? null,
				textContent: updatedTemplate.textContent ?? null,
				variables: updatedTemplate.variables ?? null,
				metadata: null,
				teamId: updatedTemplate.teamId ?? null,
			});
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "User session not found",
				});
			}

			const template = await prisma.emailTemplate.findUnique({
				where: { id: input.id },
			});

			if (!template) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Template not found",
				});
			}

			// Check access
			if (template.userId !== userId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "Access denied",
				});
			}

			await prisma.emailTemplate.delete({
				where: { id: input.id },
			});

			return { success: true };
		}),
});
