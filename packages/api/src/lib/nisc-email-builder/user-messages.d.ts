/**
 * User-facing chat copy for Nisc Email Builder completions.
 * Never expose internal templates, filenames, or build mechanics.
 */
/** Strip internal leakage (template filenames, reference notes) from model copy. */
export declare function sanitizeNebAssistantTextForUser(text: string): string;
export declare function buildNebHtmlReadyChatMessage(assistantText: string, options?: {
    variant?: "ready" | "rebuilt";
}): string;
/** Guidance for models writing assistant_text in build outputs. */
export declare const NEB_ASSISTANT_TEXT_USER_RULES = "assistant_text rules (user-facing):\n- Write 2-3 warm, specific sentences about the email you created (goal, tone, standout sections).\n- Speak as a creative partner - never as an engineer.\n- NEVER mention templates, reference files, .html filenames, placeholders, image_slots, or how the email was built internally.\n- Do not list technical steps or tooling.";
