// @ts-nocheck
import { TRPCError } from "@trpc/server";
import { asc, desc, eq } from "@npanel/db";
import { randomUUID } from "node:crypto";
import Replicate from "replicate";
import { db } from "@npanel/db";
import {
	zeepoAgentActivityLog,
	zeepoAgentGeneration,
	zeepoAgentMessage,
	zeepoAgentSession,
} from "@npanel/db/schema/zeepo-agent";
import { user as userTable } from "@npanel/db/schema/auth";
import { team as teamTable } from "@npanel/db/schema/teams";
import { env } from "@npanel/env/server";
import { protectedProcedure, router } from "../../trpc";
import { sendMessageSchema } from "./schemas";
import { insertAndEnqueueAgentGeneration } from "./generate";
import {
	getZeepoAgentOrchestrationModel,
	listModelsForTool,
	pickModelForGeneration,
	type ZeepoCapabilityKey,
} from "./model-helpers";
import { getZeepoAgentSkillById } from "./skills-catalog";
import {
	checkDomainAvailabilityArgsSchema,
	listModelsArgsSchema,
	runMediaGenerationArgsSchema,
	webSearchArgsSchema,
} from "./agent-tools";
import {
	agentCheckDomainAvailability,
	DEFAULT_DOMAIN_EXTENSIONS,
	DEFAULT_DISPLAY_CURRENCY,
} from "../../lib/agent-internal-tools";
import { callBraveLlmContext } from "../../lib/brave-search";
import {
	buildAgentIdentityPrompt,
	buildRecentGenerationsBlock,
	buildSessionContextBlock,
	buildSkillSystemBlock,
	type AgentSessionContext,
	type RecentGenerationSummary,
} from "./prompts";
import {
	type AgentOrchestrationMessage,
	type AgentToolCall,
	runOrchestrationTurnWithRepair,
	toolCallSignature,
} from "./replicate-agent-orchestration";
import { isReplicateHostedMediaUrl } from "../../lib/replicate-hosted-url";

function mapRowToAgentMessage(m: {
	role: string;
	content: string | null;
	toolCalls: unknown;
	toolCallId: string | null;
}): AgentOrchestrationMessage {
	return {
		role: m.role as AgentOrchestrationMessage["role"],
		content: m.content ?? "",
		...(m.toolCalls ? { toolCalls: m.toolCalls } : {}),
		...(m.toolCallId ? { toolCallId: m.toolCallId } : {}),
	};
}

/** First public HTTP URL that is not a Replicate ephemeral delivery URL. */
function firstHttpUrl(value: unknown): string | null {
	if (typeof value === "string" && value.startsWith("http")) {
		return isReplicateHostedMediaUrl(value) ? null : value;
	}
	if (Array.isArray(value)) {
		for (const v of value) {
			const found = firstHttpUrl(v);
			if (found) return found;
		}
	}
	if (value && typeof value === "object") {
		for (const v of Object.values(value as Record<string, unknown>)) {
			const found = firstHttpUrl(v);
			if (found) return found;
		}
	}
	return null;
}

async function fetchRecentGenerationSummaries(sessionId: string): Promise<RecentGenerationSummary[]> {
	const rows = await db.query.zeepoAgentGeneration.findMany({
		where: eq(zeepoAgentGeneration.sessionId, sessionId),
		orderBy: [desc(zeepoAgentGeneration.createdAt)],
		limit: 8,
	});
	return rows.map((g) => ({
		id: g.id,
		status: g.status,
		modelCategory: g.modelCategory,
		modelId: g.modelId,
		prompt: g.prompt,
		previewUrl: firstHttpUrl(g.outputs),
		errorMessage: g.errorMessage,
		createdAtIso: (g.createdAt instanceof Date
			? g.createdAt
			: new Date(g.createdAt)
		).toISOString(),
	}));
}

async function fetchSessionContext(params: {
	sessionId: string;
	sessionTitle: string | null;
	sessionCreatedAt: Date;
	turnCount: number;
	userId: string;
	teamId: string | null;
}): Promise<AgentSessionContext> {
	const u = await db.query.user.findFirst({
		where: eq(userTable.id, params.userId),
		columns: { name: true, email: true },
	});
	let teamInfo = {
		id: params.teamId,
		name: null as string | null,
		slug: null as string | null,
		baseCurrency: null as string | null,
	};
	if (params.teamId) {
		const t = await db.query.team.findFirst({
			where: eq(teamTable.id, params.teamId),
			columns: { id: true, name: true, slug: true, baseCurrency: true },
		});
		if (t) {
			teamInfo = {
				id: t.id,
				name: t.name,
				slug: t.slug,
				baseCurrency: t.baseCurrency ?? null,
			};
		}
	}
	return {
		nowIso: new Date().toISOString(),
		user: { name: u?.name ?? null, email: u?.email ?? null },
		team: teamInfo,
		sessionTitle: params.sessionTitle,
		sessionCreatedAtIso: params.sessionCreatedAt.toISOString(),
		turnCount: params.turnCount,
	};
}

function safeCapsArray(input: unknown): ZeepoCapabilityKey[] | undefined {
	if (!Array.isArray(input)) return undefined;
	const allowed: ZeepoCapabilityKey[] = [
		"images",
		"audio",
		"video",
		"thinking",
		"audio_generation",
	];
	const out: ZeepoCapabilityKey[] = [];
	for (const v of input) {
		if (typeof v === "string" && allowed.includes(v as ZeepoCapabilityKey)) {
			out.push(v as ZeepoCapabilityKey);
		}
	}
	return out.length ? out : undefined;
}

export const zeepoAgentChatRouter = router({
	sendMessage: protectedProcedure
		.input(sendMessageSchema)
		.mutation(async ({ ctx, input }) => {
			const userId = ctx.session?.user?.id;
			if (!userId) {
				throw new TRPCError({ code: "UNAUTHORIZED" });
			}

			if (!env.REPLICATE_API_TOKEN) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "REPLICATE_API_TOKEN is not configured",
				});
			}

			const session = await db.query.zeepoAgentSession.findFirst({
				where: eq(zeepoAgentSession.id, input.sessionId),
			});

			if (!session || session.userId !== userId) {
				throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
			}

			let skillForTurn: ReturnType<typeof getZeepoAgentSkillById> = undefined;
			if (input.skillId) {
				skillForTurn = getZeepoAgentSkillById(input.skillId);
				if (!skillForTurn) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Unknown skill",
					});
				}
			}

			const now = new Date();
			await db.insert(zeepoAgentMessage).values({
				id: randomUUID(),
				sessionId: input.sessionId,
				role: "user",
				content: input.content,
				metadata: skillForTurn ? { skillId: skillForTurn.id } : null,
				createdAt: now,
			});

			await db.insert(zeepoAgentActivityLog).values({
				id: randomUUID(),
				sessionId: input.sessionId,
				userId,
				action: "SEND_MESSAGE",
				description: "User message",
				metadata: {
					length: input.content.length,
					...(skillForTurn ? { skillId: skillForTurn.id } : {}),
				},
				ipAddress: ctx.ipAddress ?? null,
				userAgent: ctx.req.header("user-agent") ?? null,
			});

			const rows = await db.query.zeepoAgentMessage.findMany({
				where: eq(zeepoAgentMessage.sessionId, input.sessionId),
				orderBy: [asc(zeepoAgentMessage.createdAt)],
			});

			const sessionCtx = await fetchSessionContext({
				sessionId: input.sessionId,
				sessionTitle: session.title ?? null,
				sessionCreatedAt:
					session.createdAt instanceof Date
						? session.createdAt
						: new Date(session.createdAt as any),
				turnCount: rows.length,
				userId,
				teamId: session.teamId ?? null,
			});

			const recentGens = await fetchRecentGenerationSummaries(input.sessionId);
			const recentBlock = buildRecentGenerationsBlock(recentGens);

			const systemMessages: AgentOrchestrationMessage[] = [
				{ role: "system", content: buildAgentIdentityPrompt() },
				{ role: "system", content: buildSessionContextBlock(sessionCtx) },
				...(recentBlock ? [{ role: "system" as const, content: recentBlock }] : []),
				...(skillForTurn
					? [
							{
								role: "system" as const,
								content: buildSkillSystemBlock({
									id: skillForTurn.id,
									title: skillForTurn.title,
									directives: skillForTurn.agentDirectives,
								}),
							},
						]
					: []),
			];

			const agentMessages: AgentOrchestrationMessage[] = [
				...systemMessages,
				...rows.map(mapRowToAgentMessage),
			];

			const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
			const orchModel = getZeepoAgentOrchestrationModel();

			let iteration = 0;
			const maxIterations = 6;
			let lastContent = "";
			const recentToolSignatures: string[] = [];

			while (iteration < maxIterations) {
				iteration++;

				// Larger budget early & on tool-using turns (deliverables can be long), smaller late.
				const maxTokens = iteration === 1 ? 6000 : iteration <= 3 ? 4000 : 2500;

				let parseResult;
				let rawAttempts: string[] = [];
				let repairUsed = false;
				try {
					const r = await runOrchestrationTurnWithRepair({
						replicate,
						model: orchModel,
						messages: agentMessages,
						maxMs: 180_000,
						maxTokens,
					});
					parseResult = r.parsed;
					rawAttempts = r.rawAttempts;
					repairUsed = r.repairUsed;
				} catch (e: any) {
					const msg = e?.message || "Orchestration failed";
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: msg.includes("timed out")
							? "The assistant took too long to respond. Please try again."
							: msg,
					});
				}

				const assistantText = parseResult.ok
					? parseResult.assistant_text
					: parseResult.raw.slice(0, 24_000);
				const toolCalls: AgentToolCall[] = parseResult.ok ? parseResult.tool_calls : [];

				const syntheticToolCalls =
					toolCalls.length > 0
						? toolCalls.map((tc) => ({
								id: `call_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
								type: "function" as const,
								function: {
									name: tc.name,
									arguments: JSON.stringify(tc.arguments ?? {}),
								},
							}))
						: null;

				const assistantRowId = randomUUID();
				await db.insert(zeepoAgentMessage).values({
					id: assistantRowId,
					sessionId: input.sessionId,
					role: "assistant",
					content: assistantText || "",
					toolCalls: syntheticToolCalls as any,
					metadata: {
						orchestrationModelId: orchModel.id,
						iteration,
						parseOk: parseResult.ok,
						repairUsed,
						rawAttempts: rawAttempts.length,
					},
					createdAt: new Date(),
				});

				agentMessages.push({
					role: "assistant",
					content: assistantText || "",
					...(syntheticToolCalls?.length
						? { toolCalls: syntheticToolCalls }
						: {}),
				});

				lastContent = assistantText || "";

				if (!toolCalls.length) break;

				// Loop-guard: if the agent issues the same tool call twice in a row, stop.
				const sigs = toolCalls.map(toolCallSignature);
				const repeated = sigs.some(
					(s) =>
						recentToolSignatures.length > 0 &&
						recentToolSignatures[recentToolSignatures.length - 1] === s,
				);
				recentToolSignatures.push(...sigs);
				if (repeated) {
					await db.insert(zeepoAgentMessage).values({
						id: randomUUID(),
						sessionId: input.sessionId,
						role: "tool",
						content: JSON.stringify({
							error:
								"Loop detected: identical tool call repeated. Stopping iteration. Reply to the user with what you have or ask a clarifying question.",
						}),
						toolCallId: syntheticToolCalls![0]!.id,
						createdAt: new Date(),
					});
					break;
				}

				for (let i = 0; i < toolCalls.length; i++) {
					const tc = toolCalls[i]!;
					const toolCallId = syntheticToolCalls![i]!.id;
					const rawArgs = (tc.arguments ?? {}) as Record<string, unknown>;
					let resultPayload: unknown;

					if (tc.name === "check_domain_availability") {
						const parsedArgs =
							checkDomainAvailabilityArgsSchema.safeParse(rawArgs);
						if (!parsedArgs.success) {
							resultPayload = {
								error: `check_domain_availability received invalid arguments: ${parsedArgs.error.message}`,
							};
						} else {
							try {
								resultPayload = await agentCheckDomainAvailability({
									name: parsedArgs.data.name,
									extensions:
										parsedArgs.data.extensions ??
										DEFAULT_DOMAIN_EXTENSIONS,
									targetCurrency:
										sessionCtx.team.baseCurrency ??
										DEFAULT_DISPLAY_CURRENCY,
								});
							} catch (e: any) {
								resultPayload = {
									error: `Domain check failed: ${e?.message ?? "Unknown error"}`,
								};
							}
						}
					} else if (tc.name === "web_search") {
						const braveKey = env.BRAVE_SEARCH_API_KEY;
						if (!braveKey) {
							resultPayload = {
								error: "Web search is not available (BRAVE_SEARCH_API_KEY not configured). Proceed without web context or let the user know you cannot search the web right now.",
							};
						} else {
							const parsedArgs = webSearchArgsSchema.safeParse(rawArgs);
							if (!parsedArgs.success) {
								resultPayload = {
									error: `web_search received invalid arguments: ${parsedArgs.error.message}`,
								};
							} else {
								try {
									const grounding = await callBraveLlmContext({
										apiKey: braveKey,
										query: parsedArgs.data.query,
										depth: parsedArgs.data.depth,
										freshness: parsedArgs.data.freshness,
										country: parsedArgs.data.country,
									});
									// Return the grounding text directly so it reads naturally in the
									// message history and the UI can detect it by prefix.
									resultPayload = grounding;
								} catch (e: any) {
									resultPayload = {
										error: `web_search failed: ${e?.message ?? "Unknown error"}. Proceed with your existing knowledge and note the limitation.`,
									};
								}
							}
						}
					} else if (tc.name === "list_models") {
						const parsedArgs = listModelsArgsSchema.safeParse(rawArgs);
						if (!parsedArgs.success) {
							resultPayload = {
								error: `list_models received invalid arguments: ${parsedArgs.error.message}`,
							};
						} else {
							const models = listModelsForTool({
								category: parsedArgs.data.category,
								requires: parsedArgs.data.requires,
							});
							resultPayload = {
								count: models.length,
								models,
							};
						}
					} else if (tc.name === "run_media_generation") {
						const parsedArgs = runMediaGenerationArgsSchema.safeParse(rawArgs);
						if (!parsedArgs.success) {
							resultPayload = {
								error: `run_media_generation received invalid arguments: ${parsedArgs.error.message}`,
								hint: "Inspect the tool definition and call list_models first if you are unsure of valid model ids.",
							};
						} else {
							try {
								const requires = safeCapsArray(parsedArgs.data.requires);
								const model = pickModelForGeneration(
									parsedArgs.data.category,
									parsedArgs.data.model_id || undefined,
									requires,
								);
								const { generationId } = await insertAndEnqueueAgentGeneration({
									userId,
									teamId: session.teamId ?? null,
									sessionId: input.sessionId,
									messageId: assistantRowId,
									modelCategory: model.category,
									modelId: model.id,
									prompt: parsedArgs.data.prompt,
									inputs: parsedArgs.data.inputs ?? {},
									ctx: {
										ipAddress: ctx.ipAddress ?? null,
										userAgent: ctx.req.header("user-agent") ?? null,
									},
								});
								resultPayload = {
									generationId,
									status: "QUEUED",
									modelId: model.id,
									category: model.category,
								};
							} catch (e: any) {
								resultPayload = {
									error: e?.message || "Failed to start generation",
								};
							}
						}
					} else {
						resultPayload = {
							error: `Unknown tool "${tc.name}". Available: check_domain_availability, web_search, list_models, run_media_generation.`,
						};
					}

					const toolResultString =
						typeof resultPayload === "string"
							? resultPayload
							: JSON.stringify(resultPayload);

					await db.insert(zeepoAgentMessage).values({
						id: randomUUID(),
						sessionId: input.sessionId,
						role: "tool",
						content: toolResultString,
						toolCallId,
						createdAt: new Date(),
					});

					agentMessages.push({
						role: "tool",
						content: toolResultString,
						toolCallId,
					});
				}
			}

			await db
				.update(zeepoAgentSession)
				.set({ updatedAt: new Date() })
				.where(eq(zeepoAgentSession.id, input.sessionId));

			const sessionOut = await db.query.zeepoAgentSession.findFirst({
				where: eq(zeepoAgentSession.id, input.sessionId),
				with: {
					messages: {
						orderBy: (m, { asc }) => [asc(m.createdAt)],
					},
				},
			});

			return {
				data: sessionOut,
				lastAssistantPreview: lastContent.slice(0, 200),
			};
		}),
});
