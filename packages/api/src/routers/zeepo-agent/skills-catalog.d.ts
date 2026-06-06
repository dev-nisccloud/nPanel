/**
 * Premade Zeepo AI Agent skills (server source of truth).
 * UI lists id/category/title/description via `skills.list`; agent directives stay server-only.
 */
export type ZeepoAgentSkillDefinition = {
    id: string;
    category: string;
    title: string;
    description: string;
    /** Instructions appended to the model for this turn only. */
    agentDirectives: string;
};
export declare const ZEEPO_AGENT_SKILLS: readonly ZeepoAgentSkillDefinition[];
export declare function getZeepoAgentSkillById(id: string): ZeepoAgentSkillDefinition | undefined;
export declare function skillSystemAddendum(skill: ZeepoAgentSkillDefinition): string;
