import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { desc, eq } from "@npanel/db";
import { db } from "@npanel/db";
import {
	nebDesign,
	nebGenerationJob,
	nebMessage,
	nebSession,
} from "@npanel/db/schema/nisc-email-builder";
import { enqueueNebBuildJob } from "../../lib/qstash/nisc-email-builder";
import {
	buildBrandAgentContext,
	enrichWebsiteBrand,
	mergeBrandEnrichment,
} from "../../lib/nisc-email-builder/website-brand-extract";
import type { NebBrief } from "../../lib/nisc-email-builder/types";
import { protectedProcedure, router } from "../../trpc";
import { assertDesignAccess } from "./access";
import {
	approveBuildSchema,
	designIdSchema,
	generateVariationSchema,
	selectVariationSchema,
	sendChatSchema,
	startBuildSchema,
} from "./schemas";

function isBusy(design: { aiStatus: string }) {
	return design.aiStatus === "GENERATING" || design.aiStatus === "HYDRATING_IMAGES";
}

async function enqueueJob(params: {
	designId: string;
	sessionId: string;
	type: string;
	input: Record<string, unknown>;
	userMessageId?: string;
}) {
	const jobId = randomUUID();
	const now = new Date();
	await db.insert(nebGenerationJob).values({
		id: jobId,
		designId: params.designId,
		messageId: params.userMessageId ?? null,
		type: params.type,
		status: "QUEUED",
		input: params.input,
		createdAt: now,
	});
	const { messageId } = await enqueueNebBuildJob(jobId);
	await db
		.update(nebGenerationJob)
		.set({ qstashMessageId: messageId })
		.where(eq(nebGenerationJob.id, jobId));
	return jobId;
}

export const nebChatRouter = router({
	/** Step 1: generate Nano Banana creative mockup */
	startBuild: protectedProcedure.input(startBuildSchema).mutation(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		const design = await assertDesignAccess({
			designId: input.designId,
			userId,
			userRole: ctx.session?.user?.role,
		});

		if (isBusy(design)) {
			throw new TRPCError({ code: "CONFLICT", message: "A job is already in progress" });
		}

		const session = await db.query.nebSession.findFirst({
			where: eq(nebSession.designId, input.designId),
		});
		if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session missing" });

		const userMessageId = randomUUID();
		const now = new Date();

		let brief: NebBrief = { ...input.brief };
		let brandEnrichment: Awaited<ReturnType<typeof enrichWebsiteBrand>> | null = null;

		if (brief.websiteUrl?.trim()) {
			brandEnrichment = await enrichWebsiteBrand(brief.websiteUrl, {
				companyHint: brief.companyName,
			});
			brief = mergeBrandEnrichment(brief, brandEnrichment) as NebBrief;
		}

		const webContext = brandEnrichment?.webContext
			? brandEnrichment.webContext
			: brandEnrichment
				? buildBrandAgentContext(brief, brandEnrichment)
				: null;

		const userContent = [
			input.brief.companyName && `Company: ${input.brief.companyName}`,
			brief.companyName &&
				brief.companyName !== input.brief.companyName &&
				`Company (from site): ${brief.companyName}`,
			input.brief.goal && `Goal: ${input.brief.goal}`,
			input.brief.audience && `Audience: ${input.brief.audience}`,
			input.brief.tone && `Tone: ${input.brief.tone}`,
			input.brief.emailType && `Type: ${input.brief.emailType}`,
			brief.websiteUrl && `Website: ${brief.websiteUrl}`,
			input.brief.instructions,
		]
			.filter(Boolean)
			.join("\n");

		await db.insert(nebMessage).values({
			id: userMessageId,
			sessionId: session.id,
			role: "user",
			content: userContent || "Create my email design",
			metadata: {
				brief,
				brandEnrichment: brandEnrichment
					? {
							logoUrl: brandEnrichment.logoUrl,
							logoSource: brandEnrichment.logoSource,
							brandColors: brandEnrichment.brandColors,
							companyContext: brandEnrichment.companyContext,
							webSearchFound: brandEnrichment.webSearchFound,
							warnings: brandEnrichment.warnings,
						}
					: undefined,
			},
			createdAt: now,
		});

		const prevMeta =
			design.metadata && typeof design.metadata === "object"
				? (design.metadata as Record<string, unknown>)
				: {};

		await db
			.update(nebDesign)
			.set({
				brief,
				metadata: {
					...prevMeta,
					brandWebContext: webContext,
					companyContext: brandEnrichment?.companyContext ?? prevMeta.companyContext,
					webSearchFound: brandEnrichment?.webSearchFound ?? prevMeta.webSearchFound,
					brandEnrichment: brandEnrichment
						? {
								logoSource: brandEnrichment.logoSource,
								colorSources: brandEnrichment.colorSources,
								webSearchConducted: brandEnrichment.webSearchConducted,
							}
						: prevMeta.brandEnrichment,
				},
				aiStatus: "GENERATING",
				workflowPhase: "DESIGNING",
				updatedAt: now,
			})
			.where(eq(nebDesign.id, input.designId));

		const jobId = await enqueueJob({
			designId: input.designId,
			sessionId: session.id,
			type: "CREATIVE_DESIGN",
			input: { brief, webContext },
			userMessageId,
		});

		return {
			jobId,
			brandPreview: brandEnrichment
				? {
						logoUrl: brandEnrichment.logoUrl,
						brandColors: brandEnrichment.brandColors,
						companyContext: brandEnrichment.companyContext,
						webSearchFound: brandEnrichment.webSearchFound,
						warnings: brandEnrichment.warnings,
					}
				: null,
		};
	}),

	/** Step 2: user approved mockup → build HTML + hydrate images */
	approveBuild: protectedProcedure.input(approveBuildSchema).mutation(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		const design = await assertDesignAccess({
			designId: input.designId,
			userId,
			userRole: ctx.session?.user?.role,
		});

		if (!design.creativeDesignUrl) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Generate a creative design first",
			});
		}

		if (isBusy(design)) {
			throw new TRPCError({ code: "CONFLICT", message: "Wait for the current job to finish" });
		}

		const session = await db.query.nebSession.findFirst({
			where: eq(nebSession.designId, input.designId),
		});
		if (!session) throw new TRPCError({ code: "NOT_FOUND" });

		const now = new Date();
		const userMessageId = randomUUID();

		await db.insert(nebMessage).values({
			id: userMessageId,
			sessionId: session.id,
			role: "user",
			content: "Approved — please build the HTML email template.",
			createdAt: now,
		});

		await db
			.update(nebDesign)
			.set({
				aiStatus: "GENERATING",
				workflowPhase: "BUILDING",
				updatedAt: now,
			})
			.where(eq(nebDesign.id, input.designId));

		const meta =
			design.metadata && typeof design.metadata === "object"
				? (design.metadata as Record<string, unknown>)
				: {};
		const storedWebContext =
			typeof meta.brandWebContext === "string" ? meta.brandWebContext : null;

		const jobId = await enqueueJob({
			designId: input.designId,
			sessionId: session.id,
			type: "BUILD_EMAIL",
			input: {
				brief: design.brief,
				webContext: storedWebContext,
			},
			userMessageId,
		});

		return { jobId };
	}),

	/** Zeepo-style chat — routes by workflow phase */
	sendMessage: protectedProcedure.input(sendChatSchema).mutation(async ({ ctx, input }) => {
		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		const design = await assertDesignAccess({
			designId: input.designId,
			userId,
			userRole: ctx.session?.user?.role,
		});

		if (isBusy(design)) {
			throw new TRPCError({ code: "CONFLICT", message: "Wait for the current job to finish" });
		}

		const session = await db.query.nebSession.findFirst({
			where: eq(nebSession.designId, input.designId),
		});
		if (!session) throw new TRPCError({ code: "NOT_FOUND" });

		const userMessageId = randomUUID();
		const now = new Date();
		const brief = (design.brief ?? {}) as NebBrief;
		const hasHtml = Boolean(design.htmlContent?.trim());

		await db.insert(nebMessage).values({
			id: userMessageId,
			sessionId: session.id,
			role: "user",
			content: input.message,
			createdAt: now,
		});

		let jobType: string;
		if (hasHtml) {
			jobType = "REVISION";
		} else if (design.workflowPhase === "AWAITING_APPROVAL") {
			jobType = "CHAT";
		} else {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Start with a creative brief first",
			});
		}

		await db
			.update(nebDesign)
			.set({ aiStatus: "GENERATING", updatedAt: now })
			.where(eq(nebDesign.id, input.designId));

		const jobId = await enqueueJob({
			designId: input.designId,
			sessionId: session.id,
			type: jobType,
			input: { message: input.message, brief },
			userMessageId,
		});

		return { jobId };
	}),

	/** Generate another design variation — reuses stored brief + webContext */
	generateVariation: protectedProcedure
		.input(generateVariationSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			const design = await assertDesignAccess({
				designId: input.designId,
				userId,
				userRole: ctx.session?.user?.role,
			});

			if (isBusy(design)) {
				throw new TRPCError({ code: "CONFLICT", message: "A job is already in progress" });
			}

			if (!design.brief) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Submit a brief first before generating variations",
				});
			}

			const session = await db.query.nebSession.findFirst({
				where: eq(nebSession.designId, input.designId),
			});
			if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session missing" });

			const meta =
				design.metadata && typeof design.metadata === "object"
					? (design.metadata as Record<string, unknown>)
					: {};
			const storedWebContext =
				typeof meta.brandWebContext === "string" ? meta.brandWebContext : null;

			const now = new Date();

			await db
				.update(nebDesign)
				.set({
					aiStatus: "GENERATING",
					workflowPhase: "DESIGNING",
					updatedAt: now,
				})
				.where(eq(nebDesign.id, input.designId));

			const jobId = await enqueueJob({
				designId: input.designId,
				sessionId: session.id,
				type: "CREATIVE_DESIGN",
				input: { brief: design.brief, webContext: storedWebContext },
			});

			return { jobId };
		}),

	/** Select which variation to use for building the HTML email */
	selectVariation: protectedProcedure
		.input(selectVariationSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

			const design = await assertDesignAccess({
				designId: input.designId,
				userId,
				userRole: ctx.session?.user?.role,
			});

			const meta =
				design.metadata && typeof design.metadata === "object"
					? (design.metadata as Record<string, unknown>)
					: {};

			type Variation = { id: string; url: string; notes?: string };
			const variations: Variation[] = Array.isArray(meta.designVariations)
				? (meta.designVariations as Variation[])
				: [];

			const chosen = variations.find((v) => v.id === input.variationId);
			if (!chosen) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Variation not found" });
			}

			await db
				.update(nebDesign)
				.set({
					creativeDesignUrl: chosen.url,
					metadata: {
						...meta,
						design_notes: chosen.notes ?? meta.design_notes,
					},
					workflowPhase: "AWAITING_APPROVAL",
					updatedAt: new Date(),
				})
				.where(eq(nebDesign.id, input.designId));

			return { url: chosen.url };
		}),

	jobStatus: protectedProcedure.input(designIdSchema).query(async ({ ctx, input }) => {		const userId = ctx.session?.user?.id;
		if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

		await assertDesignAccess({
			designId: input.designId,
			userId,
			userRole: ctx.session?.user?.role,
		});

		const design = await db.query.nebDesign.findFirst({
			where: eq(nebDesign.id, input.designId),
		});

		const [job] = await db
			.select()
			.from(nebGenerationJob)
			.where(eq(nebGenerationJob.designId, input.designId))
			.orderBy(desc(nebGenerationJob.createdAt))
			.limit(1);

		return {
			aiStatus: design?.aiStatus ?? "IDLE",
			workflowPhase: design?.workflowPhase ?? "BRIEF",
			creativeDesignUrl: design?.creativeDesignUrl ?? null,
			job: job
				? {
						id: job.id,
						type: job.type,
						status: job.status,
						errorMessage: job.errorMessage,
					}
				: null,
		};
	}),
});
