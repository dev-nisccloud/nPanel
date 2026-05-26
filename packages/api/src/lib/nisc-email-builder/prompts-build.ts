import type { NebBrief } from "./types";

export const SPEC_END_MARKER = "<<<END_NEB_DESIGN_SPEC>>>";
export const SPEC_START_MARKER = "<<<NEB_DESIGN_SPEC>>>";
export const SPEC_META_START = "<<<NEB_SPEC_META>>>";
export const SPEC_META_END = "<<<END_NEB_SPEC_META>>>";

export function buildCreativeSpecSystemPrompt(): string {
	return `You are a senior email design specification writer for the NISC AI Email Builder.
You receive the APPROVED creative email mockup as an image. Write an exhaustive, pixel-level
specification document that an HTML developer can implement with ZERO creative interpretation.

OUTPUT FORMAT (mandatory — use these exact delimiters):

${SPEC_START_MARKER}
(Your full design specification — as long and detailed as needed. Minimum 3000 words for a typical email.
Work TOP to BOTTOM through the mockup. For EVERY section include:)
- Section name and order number
- Exact background color hex (sample from the image)
- Exact padding/margin in px (top, bottom, left, right)
- Layout structure (single column, 2-col 50/50, 3-col grid, full-bleed image, overlay text on image)
- Every text element: EXACT copy verbatim, font-size px, font-weight, color hex, alignment, line-height
- Every image: describe content precisely + assign placeholder key e.g. hero, card_home, card_office
- Every icon: describe shape, stroke style, color hex, size px — assign key icon_<name> e.g. icon_caliper
- CTA buttons: exact label, bg hex, text hex, border-radius px, padding, shadow/border if visible
- Decorative elements: bars, gradients, badges (e.g. "48 HOURS ONLY" orange box placement)
- Mobile stacking rules: which columns stack and in what order at ≤600px
${SPEC_END_MARKER}

${SPEC_META_START}
{
  "subject": "under 60 chars",
  "preheader": "under 90 chars",
  "image_slots": [
    {
      "key": "hero",
      "kind": "photo",
      "prompt": "detailed generation prompt for this photo region",
      "alt": "alt text",
      "aspectRatio": "16:9",
      "imageSize": "2K"
    },
    {
      "key": "icon_caliper",
      "kind": "icon",
      "prompt": "Single isolated flat line-art caliper measuring tool icon, orange #E44D26 stroke, white/transparent background, no text, no shadow, centered, 128px equivalent, email UI icon",
      "alt": "Years of experience icon",
      "aspectRatio": "1:1",
      "imageSize": "1K"
    }
  ]
}
${SPEC_META_END}

CRITICAL RULES:
- READ THE IMAGE. Do not invent elements not visible in the mockup.
- Copy must be EXACT — every headline, subhead, body line, CTA, footer line as shown.
- NEVER suggest emoji for icons. Every icon in the mockup MUST appear in image_slots with kind "icon".
- Photo regions (hero, product cards, split layouts) use kind "photo".
- image_slots prompts for icons: isolated icon only, flat line-art or solid style matching the comp, NO TEXT.
- image_slots prompts for photos: end with NO TEXT, NO LOGOS, NO WATERMARKS.
- Include the maroon/orange decorative border if present, split hero with yellow block, dark CTA footer, etc.
- Be obsessively specific about hex colors, px sizes, and element placement.`;
}

export function buildCreativeSpecUserPrompt(params: {
	brief: NebBrief;
	brandBlock: string;
	creativeDesignUrl: string;
	designNotes?: string;
	webContext?: string | null;
}): string {
	return `${params.brandBlock}
${params.webContext ? `\n${params.webContext}\n` : ""}

Approved creative mockup (attached): ${params.creativeDesignUrl}
Design notes: ${params.designNotes ?? "None"}

Brief — Company: ${params.brief.companyName ?? "Brand"}, Goal: ${params.brief.goal ?? "—"}, Audience: ${params.brief.audience ?? "—"}

Write the complete design specification now. Do not summarize — describe every section in full detail.`;
}

export function buildCreativeSpecContinuationSystemPrompt(): string {
	return `You are continuing an interrupted email design specification.
Output ONLY the continuation — pick up EXACTLY where the previous text stopped.
Do NOT repeat content already written.

When the entire mockup has been fully specified top-to-bottom, end your output with:
${SPEC_END_MARKER}

If more sections remain after this response, do NOT include the end marker yet.`;
}

export function buildCreativeSpecContinuationUserPrompt(params: {
	partialSpec: string;
	creativeDesignUrl: string;
}): string {
	const tail = params.partialSpec.slice(-2500);
	return `Creative mockup: ${params.creativeDesignUrl}

SPECIFICATION SO FAR (continue immediately after this — do not repeat):

...${tail}

Continue the specification from exactly where it left off.`;
}

export function buildHtmlFromSpecPrompt(params: {
	designSpecification: string;
	specMetaJson: string;
	brandBlock: string;
	creativeDesignUrl: string;
}): string {
	return `${params.brandBlock}

━━━ APPROVED CREATIVE MOCKUP URL ━━━
${params.creativeDesignUrl}

━━━ AUTHORITATIVE DESIGN SPECIFICATION ━━━
Implement this specification EXACTLY. You are a developer, not a designer.
Do NOT change layout, colors, copy, or structure. Do NOT simplify sections.

${params.designSpecification}

━━━ METADATA & IMAGE PLACEHOLDERS ━━━
${params.specMetaJson}

━━━ IMPLEMENTATION RULES ━━━
- Use EXACT copy from the specification — never paraphrase.
- Use EXACT hex colors from the specification.
- For EVERY image slot key (photos AND icons): <img src="{{NEB_IMG:key}}" ...> — never emoji, never Unicode icons, never inline SVG icons.
- Icons use width/height 40-56px as specified. Photos use width="600" class="fluid".
- Logo: use brand logo URL in <img> if provided in BRAND block.
- 600px container, nested tables only, full responsive CSS in <head> as required.
- 3-column stats/features: use stack-column class on each column for mobile.
- 2-column splits: stack-column on mobile — image first or text first per spec order.
- Match decorative borders, badge overlays, gradient overlays on hero exactly as specified.
- CTA buttons: bulletproof table button with exact colors and label from spec.

Build the complete HTML email using the delimiter format.`;
}

export function buildHtmlContinuationPrompt(params: {
	designSpecification: string;
	specMetaJson: string;
	brandBlock: string;
	partialHtml: string;
}): string {
	return `${params.brandBlock}

DESIGN SPECIFICATION (reference):
${params.designSpecification.slice(0, 12000)}

METADATA:
${params.specMetaJson}

Your previous HTML output was TRUNCATED. Continue from exactly where it stopped.
Output ONLY the remaining HTML starting from the cut point, then close all open tags through </html>.
After the HTML block, include the meta JSON delimiter block as usual.

TRUNCATED HTML ENDS WITH:
${params.partialHtml.slice(-3000)}`;
}
