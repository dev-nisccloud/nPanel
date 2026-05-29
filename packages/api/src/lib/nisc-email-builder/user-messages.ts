/**
 * User-facing chat copy for Nisc Email Builder completions.
 * Never expose internal templates, filenames, or build mechanics.
 */

const SUGGESTED_NEXT_STEPS = `**Suggested next steps**
- Open **Email preview** to review the full layout on desktop and mobile widths
- Use **Edit** mode to adjust copy, colours, spacing, and links
- Check **CTA buttons** — wording, destination URL, and visibility on small screens
- Update **images** via the image panel or your media library
- Ask in chat for targeted tweaks (e.g. “shorten the intro”, “stronger CTA”, “swap the hero image”)`;

const READY_FOOTER = `**Your email is ready** — review it in the **Email preview** tab.

${SUGGESTED_NEXT_STEPS}`;

const REBUILT_FOOTER = `**Your email has been rebuilt** — review the updated version in the **Email preview** tab.

${SUGGESTED_NEXT_STEPS}`;

/** Strip internal leakage (template filenames, reference notes) from model copy. */
export function sanitizeNebAssistantTextForUser(text: string): string {
	let out = text.trim();
	if (!out) return "";

	out = out.replace(/\*?\s*Built using design references?:[^\n*]*/gi, "");
	out = out.replace(/\*?\s*using (?:design )?references?:[^\n*]*/gi, "");
	out = out.replace(/\b(?:reference|sample)\s+templates?\b/gi, "design");
	out = out.replace(/\b[\w][\w-]*_\d+\.html\b/gi, "");
	out = out.replace(/\n{3,}/g, "\n\n").trim();
	return out;
}

export function buildNebHtmlReadyChatMessage(
	assistantText: string,
	options?: { variant?: "ready" | "rebuilt" },
): string {
	const cleaned = sanitizeNebAssistantTextForUser(assistantText);
	const footer = options?.variant === "rebuilt" ? REBUILT_FOOTER : READY_FOOTER;
	return cleaned ? `${cleaned}\n\n${footer}` : footer;
}

/** Guidance for models writing assistant_text in build outputs. */
export const NEB_ASSISTANT_TEXT_USER_RULES = `assistant_text rules (user-facing):
- Write 2-3 warm, specific sentences about the email you created (goal, tone, standout sections).
- Speak as a creative partner — never as an engineer.
- NEVER mention templates, reference files, .html filenames, placeholders, image_slots, or how the email was built internally.
- Do not list technical steps or tooling.`;
