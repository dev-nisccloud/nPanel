import { TRPCError } from "@trpc/server";
import { env } from "@npanel/env/server";
import { MODELS, type ZeepoModel } from "../zeepo-canvas/models";

/** Default `MODELS` text id for Zeepo Agent orchestration (Replicate). Override with `ZEEPO_AGENT_CHAT_MODEL_ID`. */
export const ZEEPO_AGENT_ORCHESTRATION_MODEL_ID_DEFAULT = "anthropic/claude-4.5-haiku";

export type ZeepoCapabilityKey =
	| "images"
	| "audio"
	| "video"
	| "thinking"
	| "audio_generation";

export type ZeepoCategory = ZeepoModel["category"];

const ALL_CAPS: ZeepoCapabilityKey[] = [
	"images",
	"audio",
	"video",
	"thinking",
	"audio_generation",
];

export function modelHasCapabilities(
	m: ZeepoModel,
	requires?: ZeepoCapabilityKey[],
): boolean {
	if (!requires?.length) return true;
	return requires.every((c) => m.capabilities?.[c] === true);
}

export function filterModelsByRequirements(
	category: ZeepoCategory,
	requires?: ZeepoCapabilityKey[],
): ZeepoModel[] {
	return MODELS.filter(
		(m) => m.category === category && modelHasCapabilities(m, requires),
	);
}

export function defaultModelFor(category: ZeepoCategory): ZeepoModel {
	const inCategory = MODELS.filter((m) => m.category === category);
	if (inCategory.length === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `No models registered for category: ${category}`,
		});
	}
	return inCategory.find((m) => m.default) ?? inCategory[0]!;
}

/**
 * Pick a model, optionally constraining by an explicit id and/or required capability flags.
 * Throws BAD_REQUEST if the requested id is missing, in the wrong category, or lacks required capabilities.
 */
export function pickModelForGeneration(
	category: ZeepoCategory,
	modelId?: string,
	requires?: ZeepoCapabilityKey[],
): ZeepoModel {
	const eligible = filterModelsByRequirements(category, requires);
	if (eligible.length === 0) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `No "${category}" models match required capabilities${
				requires?.length ? `: ${requires.join(", ")}` : ""
			}.`,
		});
	}
	if (modelId) {
		const inCategoryAny = MODELS.find(
			(m) => m.id === modelId && m.category === category,
		);
		if (!inCategoryAny) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Model "${modelId}" is not a registered ${category} model.`,
			});
		}
		const found = eligible.find((m) => m.id === modelId);
		if (!found) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `Model "${modelId}" does not support required capabilities: ${
					requires?.join(", ") ?? "(none)"
				}.`,
			});
		}
		return found;
	}
	return eligible.find((m) => m.default) ?? eligible[0]!;
}

export function getZeepoAgentOrchestrationModel(): ZeepoModel {
	const id = env.ZEEPO_AGENT_CHAT_MODEL_ID?.trim();
	return pickModelForGeneration(
		"text",
		id && id.length > 0 ? id : ZEEPO_AGENT_ORCHESTRATION_MODEL_ID_DEFAULT,
	);
}

export type ListedModel = {
	id: string;
	category: ZeepoCategory;
	provider: string;
	label: string;
	description: string;
	is_default: boolean;
	capabilities: Record<ZeepoCapabilityKey, boolean>;
};

function serializeCapabilities(m: ZeepoModel): Record<ZeepoCapabilityKey, boolean> {
	const out = {} as Record<ZeepoCapabilityKey, boolean>;
	for (const c of ALL_CAPS) {
		out[c] = m.capabilities?.[c] === true;
	}
	return out;
}

function toListedModel(m: ZeepoModel): ListedModel {
	return {
		id: m.id,
		category: m.category,
		provider: m.provider,
		label: m.label,
		description: m.description,
		is_default: m.default === true,
		capabilities: serializeCapabilities(m),
	};
}

export function listModelsForTool(args: {
	category?: ZeepoCategory;
	requires?: ZeepoCapabilityKey[];
}): ListedModel[] {
	const requires = args.requires?.filter((c) => ALL_CAPS.includes(c)) ?? [];
	const rows = args.category
		? filterModelsByRequirements(args.category, requires)
		: MODELS.filter((m) => modelHasCapabilities(m, requires));
	return rows.map(toListedModel);
}

/**
 * Short, fact-only overview meant for the agent's system prompt.
 * Does NOT list every id — agent must call `list_models` to discover non-default ids.
 */
export function getCatalogOverviewForSystemPrompt(): string {
	const cats: ZeepoCategory[] = [
		"text",
		"image",
		"video",
		"audio",
		"background-remover",
	];
	const lines: string[] = [];
	for (const cat of cats) {
		const inCat = MODELS.filter((m) => m.category === cat);
		if (inCat.length === 0) continue;
		const def = inCat.find((m) => m.default) ?? inCat[0]!;
		const capSet = new Set<ZeepoCapabilityKey>();
		for (const m of inCat) {
			for (const c of ALL_CAPS) {
				if (m.capabilities?.[c]) capSet.add(c);
			}
		}
		lines.push(
			`- ${cat}: ${inCat.length} models registered. Default: "${def.id}".${
				capSet.size
					? ` Optional capabilities you may require: ${[...capSet].join(", ")}.`
					: ""
			}`,
		);
	}
	return lines.join("\n");
}
