import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, exists, isNull, or } from "@npanel/db";
import { db } from "@npanel/db";
import {
	nebDesign,
	nebDesignVersion,
	nebSession,
} from "@npanel/db/schema/nisc-email-builder";
import { teamMember } from "@npanel/db/schema/teams";
import { protectedProcedure, router } from "../../trpc";
import {
	assertDesignAccess,
	isAgencySuperAdminRole,
	isAgencyUserRole,
} from "./access";
import { stripEditorArtifactsFromHtml } from "../../lib/nisc-email-builder/html-sanitize-for-save";
import { processEmailHtml } from "../../lib/nisc-email-builder/pipeline";
import {
	createDesignSchema,
	designIdSchema,
	listDesignsSchema,
	nebDesignRefSchema,
	restoreVersionSchema,
	saveHtmlSchema,
	updateDesignMetaSchema,
} from "./schemas";

export const nebDesignRouter = router({
	create: protectedProcedure.input(createDesignSchema).mutation(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		const userRole = ctx.session?.user?.role;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		if (input.teamId && !isAgencyUserRole(userRole)) {
			const membership = await db.query.teamMember.findFirst({
				where: and(
					eq(teamMember.teamId, input.teamId),
					eq(teamMember.userId, userId),
				),
			});
			if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
		}

		const designId = randomUUID();
		const sessionId = randomUUID();
		const now = new Date();

		await db.insert(nebDesign).values({
			id: designId,
			name: input.name,
			userId,
			teamId: input.teamId ?? null,
			brandKitId: input.brandKitId ?? null,
			htmlContent: "",
			status: "DRAFT",
			workflowPhase: "BRIEF",
			aiStatus: "IDLE",
			createdAt: now,
			updatedAt: now,
		});

		await db.insert(nebSession).values({
			id: sessionId,
			designId,
			userId,
			teamId: input.teamId ?? null,
			createdAt: now,
			updatedAt: now,
		});

		return { id: designId, sessionId };
	}),

	list: protectedProcedure.input(listDesignsSchema).query(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		const userRole = ctx.session?.user?.role;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		const { page, limit, teamId } = input;
		const isAgencyUser = isAgencyUserRole(userRole);

		const baseWhere = teamId
			? isAgencyUser
				? eq(nebDesign.teamId, teamId)
				: and(
						eq(nebDesign.teamId, teamId),
						exists(
							db
								.select()
								.from(teamMember)
								.where(
									and(
										eq(teamMember.teamId, teamId),
										eq(teamMember.userId, userId),
									),
								),
						),
					)
			: isAgencyUser
				? undefined
				: or(
						and(eq(nebDesign.userId, userId), isNull(nebDesign.teamId)),
						exists(
							db
								.select()
								.from(teamMember)
								.where(
									and(
										eq(teamMember.teamId, nebDesign.teamId),
										eq(teamMember.userId, userId),
									),
								),
						),
					);

		const rows = await db
			.select({
				id: nebDesign.id,
				name: nebDesign.name,
				description: nebDesign.subject,
				thumbnailUrl: nebDesign.thumbnailUrl,
				workflowPhase: nebDesign.workflowPhase,
				updatedAt: nebDesign.updatedAt,
				createdAt: nebDesign.createdAt,
				userId: nebDesign.userId,
				teamId: nebDesign.teamId,
			})
			.from(nebDesign)
			.where(baseWhere ?? undefined)
			.orderBy(asc(nebDesign.updatedAt))
			.limit(limit)
			.offset((page - 1) * limit);

		return {
			data: rows.map((row) => ({
				...row,
				isPublic: false,
				description: row.description ?? null,
			})),
			nextPage: rows.length === limit ? page + 1 : null,
		};
	}),

	get: protectedProcedure.input(designIdSchema).query(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		await assertDesignAccess({
			designId: input.designId,
			userId,
			userRole: ctx.session?.user?.role,
		});

		const design = await db.query.nebDesign.findFirst({
			where: eq(nebDesign.id, input.designId),
			with: {
				session: {
					with: {
						messages: {
							orderBy: (m, { asc }) => [asc(m.createdAt)],
						},
					},
				},
				versions: {
					orderBy: [desc(nebDesignVersion.versionNumber)],
					limit: 20,
				},
			},
		});

		if (!design) throw new TRPCError({ code: "NOT_FOUND" });

		return design;
	}),

	updateMeta: protectedProcedure
		.input(updateDesignMetaSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			await assertDesignAccess({
				designId: input.designId,
				userId,
				userRole: ctx.session?.user?.role,
			});

			await db
				.update(nebDesign)
				.set({
					...(input.name !== undefined ? { name: input.name } : {}),
					...(input.subject !== undefined ? { subject: input.subject } : {}),
					...(input.preheader !== undefined ? { preheader: input.preheader } : {}),
					...(input.brandKitId !== undefined
						? { brandKitId: input.brandKitId }
						: {}),
					updatedAt: new Date(),
				})
				.where(eq(nebDesign.id, input.designId));

			return { success: true };
		}),

	delete: protectedProcedure
		.input(nebDesignRefSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			const existing = await db.query.nebDesign.findFirst({
				where: isAgencySuperAdminRole(userRole)
					? eq(nebDesign.id, input.designId)
					: and(eq(nebDesign.id, input.designId), eq(nebDesign.userId, userId)),
			});

			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Design not found or access denied",
				});
			}

			await db.delete(nebDesign).where(eq(nebDesign.id, input.designId));
			return { data: { id: input.designId } };
		}),

	duplicate: protectedProcedure
		.input(nebDesignRefSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			const userRole = ctx.session?.user?.role;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			const original = await db.query.nebDesign.findFirst({
				where: isAgencySuperAdminRole(userRole)
					? eq(nebDesign.id, input.designId)
					: and(eq(nebDesign.id, input.designId), eq(nebDesign.userId, userId)),
			});

			if (!original) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Design not found" });
			}

			const newId = randomUUID();
			const sessionId = randomUUID();
			const now = new Date();

			const [duplicated] = await db
				.insert(nebDesign)
				.values({
					id: newId,
					name: `Copy of ${original.name}`,
					userId,
					teamId: original.teamId,
					status: original.status,
					subject: original.subject,
					preheader: original.preheader,
					htmlContent: original.htmlContent,
					textContent: original.textContent,
					thumbnailUrl: original.thumbnailUrl,
					brandKitId: original.brandKitId,
					brief: original.brief,
					metadata: original.metadata,
					creativeDesignUrl: original.creativeDesignUrl,
					creativeDesignPrompt: original.creativeDesignPrompt,
					designPlan: original.designPlan,
					workflowPhase: original.workflowPhase,
					aiStatus: "IDLE",
					createdAt: now,
					updatedAt: now,
				})
				.returning();

			if (!duplicated) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to duplicate design",
				});
			}

			await db.insert(nebSession).values({
				id: sessionId,
				designId: newId,
				userId,
				teamId: original.teamId,
				createdAt: now,
				updatedAt: now,
			});

			return { data: duplicated };
		}),

	saveHtml: protectedProcedure.input(saveHtmlSchema).mutation(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		const design = await assertDesignAccess({
			designId: input.designId,
			userId,
			userRole: ctx.session?.user?.role,
		});

		const cleaned = stripEditorArtifactsFromHtml(input.html);
		const processed = processEmailHtml(cleaned);
		if (!processed.validation.ok) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: processed.validation.errors.join("; "),
			});
		}

		const now = new Date();

		if (input.inPlace && design.htmlContent === processed.html) {
			return {
				success: true,
				skipped: true,
				versionId: design.currentVersionId,
				htmlContent: processed.html,
				warnings: processed.validation.warnings,
			};
		}

		if (input.inPlace && design.currentVersionId) {
			await db
				.update(nebDesignVersion)
				.set({
					htmlContent: processed.html,
					textContent: processed.text,
					changeSummary: input.changeSummary ?? "Auto-saved edits",
				})
				.where(eq(nebDesignVersion.id, design.currentVersionId));

			await db
				.update(nebDesign)
				.set({
					htmlContent: processed.html,
					textContent: processed.text,
					status: "DRAFT",
					workflowPhase: "READY",
					updatedAt: now,
				})
				.where(eq(nebDesign.id, input.designId));

			return {
				success: true,
				skipped: false,
				versionId: design.currentVersionId,
				htmlContent: processed.html,
				warnings: processed.validation.warnings,
			};
		}

		const versionId = randomUUID();
		const latest = await db.query.nebDesignVersion.findFirst({
			where: eq(nebDesignVersion.designId, input.designId),
			orderBy: [desc(nebDesignVersion.versionNumber)],
		});
		const versionNumber = (latest?.versionNumber ?? 0) + 1;

		await db.insert(nebDesignVersion).values({
			id: versionId,
			designId: input.designId,
			versionNumber,
			htmlContent: processed.html,
			textContent: processed.text,
			changeSummary: input.changeSummary ?? "Manual edits",
			trigger: "MANUAL_EDIT",
			createdAt: now,
		});

		await db
			.update(nebDesign)
			.set({
				htmlContent: processed.html,
				textContent: processed.text,
				currentVersionId: versionId,
				status: "DRAFT",
				workflowPhase: "READY",
				updatedAt: now,
			})
			.where(eq(nebDesign.id, input.designId));

		return {
			success: true,
			skipped: false,
			versionId,
			htmlContent: processed.html,
			warnings: processed.validation.warnings,
		};
	}),

	exportHtml: protectedProcedure.input(designIdSchema).query(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		const design = await assertDesignAccess({
			designId: input.designId,
			userId,
			userRole: ctx.session?.user?.role,
		});

		return {
			html: design.htmlContent,
			text: design.textContent,
			subject: design.subject,
			preheader: design.preheader,
		};
	}),

	restoreVersion: protectedProcedure
		.input(restoreVersionSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			await assertDesignAccess({
				designId: input.designId,
				userId,
				userRole: ctx.session?.user?.role,
			});

			const version = await db.query.nebDesignVersion.findFirst({
				where: and(
					eq(nebDesignVersion.id, input.versionId),
					eq(nebDesignVersion.designId, input.designId),
				),
			});
			if (!version) throw new TRPCError({ code: "NOT_FOUND" });

			const versionId = randomUUID();
			const versionNumber =
				(
					await db.query.nebDesignVersion.findFirst({
						where: eq(nebDesignVersion.designId, input.designId),
						orderBy: [desc(nebDesignVersion.versionNumber)],
					})
				)?.versionNumber ?? 0;

			await db.insert(nebDesignVersion).values({
				id: versionId,
				designId: input.designId,
				versionNumber: versionNumber + 1,
				htmlContent: version.htmlContent,
				textContent: version.textContent,
				changeSummary: `Restored from v${version.versionNumber}`,
				trigger: "RESTORE",
				createdAt: new Date(),
			});

			await db
				.update(nebDesign)
				.set({
					htmlContent: version.htmlContent,
					textContent: version.textContent,
					currentVersionId: versionId,
					updatedAt: new Date(),
				})
				.where(eq(nebDesign.id, input.designId));

			return { success: true };
		}),
});
