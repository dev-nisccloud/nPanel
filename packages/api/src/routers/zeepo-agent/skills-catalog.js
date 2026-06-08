export const ZEEPO_AGENT_SKILLS = [
    {
        id: "validate-business-idea",
        category: "STRATEGY",
        title: "Validate my business idea",
        description: "Describe your idea, get honest feedback on viability, risks, and next steps.",
        agentDirectives: "You are helping the user stress-test a business idea. Focus on viability, risks, differentiation, and realistic next steps. Do not give a long verdict until you understand the idea, target customer, and what they have tried so far.",
    },
    {
        id: "define-value-proposition",
        category: "STRATEGY",
        title: "Define my value proposition",
        description: "Describe what you sell, get a clear \"why you and not them\" statement.",
        agentDirectives: "Guide the user to a sharp value proposition: who it is for, the promise, proof, and how it differs from alternatives. Ask about offer, audience, and competitors before drafting.",
    },
    {
        id: "review-pricing",
        category: "STRATEGY",
        title: "Review my pricing",
        description: "Share your current prices and costs, get feedback on your pricing model and margins.",
        agentDirectives: "Help review pricing and margins. Ask for product/service, current price points, rough costs, geography, and channel before suggesting changes.",
    },
    {
        id: "set-quarterly-goals",
        category: "STRATEGY",
        title: "Set quarterly goals",
        description: "Share where you are now, get a focused plan with 3–5 goals and milestones.",
        agentDirectives: "Help define 3–5 quarterly goals with milestones. Clarify current stage, metrics they track, blockers, and top priority before proposing goals.",
    },
    {
        id: "brainstorm-business-names",
        category: "BRAND & IDENTITY",
        title: "Brainstorm business names",
        description: "Describe your business, get 20+ name ideas with .com availability tips.",
        agentDirectives: "Brainstorm memorable names aligned with the business. Ask about industry, tone, audience, and words to avoid. Remind the user that live domain availability must be verified with a registrar.",
    },
    {
        id: "define-brand-voice",
        category: "BRAND & IDENTITY",
        title: "Define my brand voice",
        description: "Answer a few questions, get a brand voice guide with tone, dos and don'ts.",
        agentDirectives: "Build a concise brand voice guide (tone, personality, dos/don'ts, sample lines). Ask who they serve, how they want to feel, and channels they use before writing.",
    },
    {
        id: "pick-color-palette",
        category: "BRAND & IDENTITY",
        title: "Pick a color palette",
        description: "Describe your vibe, get 3–5 color palettes with hex codes and usage tips.",
        agentDirectives: "Suggest 3–5 cohesive palettes with hex codes and usage (primary, accent, neutrals). Ask about industry, mood keywords, accessibility needs, and existing brand colors first.",
    },
];
const byId = new Map(ZEEPO_AGENT_SKILLS.map((s) => [s.id, s]));
export function getZeepoAgentSkillById(id) {
    return byId.get(id);
}
export function skillSystemAddendum(skill) {
    return `Guided skill: "${skill.title}" (id: ${skill.id}).
${skill.agentDirectives}

Behavior: Ask focused follow-up questions (one or two at a time) until you have enough context. Do not invent missing facts-invite the user to share them. Then deliver structured, actionable help.`;
}
