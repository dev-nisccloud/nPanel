import { type ZeepoModel } from "../zeepo-canvas/models";
/** Default `MODELS` text id for Zeepo Agent orchestration (Replicate). Override with `ZEEPO_AGENT_CHAT_MODEL_ID`. */
export declare const ZEEPO_AGENT_ORCHESTRATION_MODEL_ID_DEFAULT = "anthropic/claude-4.5-haiku";
export type ZeepoCapabilityKey = "images" | "audio" | "video" | "thinking" | "audio_generation" | "design";
export type ZeepoCategory = ZeepoModel["category"];
export declare function modelHasCapabilities(m: ZeepoModel, requires?: ZeepoCapabilityKey[]): boolean;
export declare function filterModelsByRequirements(category: ZeepoCategory, requires?: ZeepoCapabilityKey[]): ZeepoModel[];
export declare function defaultModelFor(category: ZeepoCategory): ZeepoModel;
/**
 * Pick a model, optionally constraining by an explicit id and/or required capability flags.
 * Throws BAD_REQUEST if the requested id is missing, in the wrong category, or lacks required capabilities.
 */
export declare function pickModelForGeneration(category: ZeepoCategory, modelId?: string, requires?: ZeepoCapabilityKey[]): ZeepoModel;
export declare function getZeepoAgentOrchestrationModel(): ZeepoModel;
export type ListedModel = {
    id: string;
    category: ZeepoCategory;
    provider: string;
    label: string;
    description: string;
    is_default: boolean;
    capabilities: Record<ZeepoCapabilityKey, boolean>;
};
export declare function listModelsForTool(args: {
    category?: ZeepoCategory;
    requires?: ZeepoCapabilityKey[];
}): ListedModel[];
/**
 * Short, fact-only overview meant for the agent's system prompt.
 * Does NOT list every id - agent must call `list_models` to discover non-default ids.
 */
export declare function getCatalogOverviewForSystemPrompt(): string;
