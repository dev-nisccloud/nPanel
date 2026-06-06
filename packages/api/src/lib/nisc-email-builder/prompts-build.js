import { HTML_DIRECT_BUILD_DELIMITER_INSTRUCTION } from "./parse-responses";
import { NEB_ASSISTANT_TEXT_USER_RULES } from "./user-messages";
import { imagePlaceholder } from "./types";
export const SPEC_END_MARKER = "<<<END_NEB_DESIGN_SPEC>>>";
export const SPEC_START_MARKER = "<<<NEB_DESIGN_SPEC>>>";
export const SPEC_META_START = "<<<NEB_SPEC_META>>>";
export const SPEC_META_END = "<<<END_NEB_SPEC_META>>>";
export function buildCreativeSpecSystemPrompt() {
    return `You are a senior email design specification writer for the NISC AI Email Builder.
You receive the APPROVED creative email mockup as an image. Write an exhaustive, pixel-level
specification document that an HTML developer can implement with ZERO creative interpretation.

OUTPUT FORMAT (mandatory - use these exact delimiters):

${SPEC_START_MARKER}
(Your full design specification - as long and detailed as needed. Minimum 3000 words for a typical email.
Work TOP to BOTTOM through the mockup. For EVERY section include:)
- Section name and order number
- Exact background color hex (sample from the image)
- Exact padding/margin in px (top, bottom, left, right)
- Layout structure (single column, 2-col 50/50, 3-col grid, full-bleed image, overlay text on image)
- Every text element: EXACT copy verbatim, font-size px, font-weight, color hex, alignment, line-height
- Every image: describe content precisely + assign placeholder key e.g. hero, card_home, card_office
- Every icon: describe shape, stroke style, color hex, size px - assign key icon_<name> e.g. icon_caliper
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
- Copy must be EXACT - every headline, subhead, body line, CTA, footer line as shown.
- NEVER suggest emoji for icons. Every icon in the mockup MUST appear in image_slots with kind "icon".
- Photo regions (hero, product cards, split layouts) use kind "photo".
- image_slots prompts for icons: isolated icon only, flat line-art or solid style matching the comp, NO TEXT. Put section bg hex only in backgroundColor, never in prompt.
- image_slots prompts for photos: end with NO TEXT, NO LOGOS, NO WATERMARKS.
- Include the maroon/orange decorative border if present, split hero with yellow block, dark CTA footer, etc.
- Be obsessively specific about hex colors, px sizes, and element placement.`;
}
export function buildCreativeSpecUserPrompt(params) {
    return `${params.brandBlock}
${params.webContext ? `\n${params.webContext}\n` : ""}

Approved creative mockup (attached): ${params.creativeDesignUrl}
Design notes: ${params.designNotes ?? "None"}

Brief - Company: ${params.brief.companyName ?? "Brand"}, Goal: ${params.brief.goal ?? "-"}, Audience: ${params.brief.audience ?? "-"}

Write the complete design specification now. Do not summarize - describe every section in full detail.`;
}
export function buildCreativeSpecContinuationSystemPrompt() {
    return `You are continuing an interrupted email design specification.
Output ONLY the continuation - pick up EXACTLY where the previous text stopped.
Do NOT repeat content already written.

When the entire mockup has been fully specified top-to-bottom, end your output with:
${SPEC_END_MARKER}

If more sections remain after this response, do NOT include the end marker yet.`;
}
export function buildCreativeSpecContinuationUserPrompt(params) {
    const tail = params.partialSpec.slice(-2500);
    return `Creative mockup: ${params.creativeDesignUrl}

SPECIFICATION SO FAR (continue immediately after this - do not repeat):

...${tail}

Continue the specification from exactly where it left off.`;
}
export function buildHtmlFromSpecPrompt(params) {
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
- Use EXACT copy from the specification - never paraphrase.
- Use EXACT hex colors from the specification.
- For EVERY image slot key (photos AND icons): <img src="{{NEB_IMG:key}}" ...> - never emoji, never Unicode icons, never inline SVG icons.
- Icons use width/height 40-56px as specified. Photos use width="600" class="fluid".
- Logo: use brand logo URL in <img> if provided in BRAND block.
- 600px container, nested tables only, full responsive CSS in <head> as required.
- 3-column stats/features: use stack-column class on each column for mobile.
- 2-column splits: stack-column on mobile - image first or text first per spec order.
- Match decorative borders, badge overlays, gradient overlays on hero exactly as specified.
- CTA buttons: bulletproof table button with exact colors and label from spec.

Build the complete HTML email using the delimiter format.`;
}
export function buildHtmlContinuationPrompt(params) {
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
// ─────────────────────────────────────────────────────────────────────────────
// DIRECT BUILD - Template-guided HTML generation (no creative mockup step)
// ─────────────────────────────────────────────────────────────────────────────
export function buildDirectHtmlSystemPrompt() {
    return `You are the HTML ARCHITECT for the NISC AI Email Builder.
You produce bulletproof, pixel-perfect, FULLY RESPONSIVE marketing email HTML - Stripe/Linear/Airbnb tier.

YOUR PRIMARY JOB:
Create a stunning, production-ready HTML email perfectly tailored to the user's brief and brand.
You have been provided with 1-2 internal design benchmarks (never mention these to the user) that demonstrate expected quality and HTML patterns.

STUDY THE DESIGN BENCHMARKS (internal - do not reference by name in user-facing text):
- Learn from their layout structure, CSS organization, table nesting, and responsive patterns
- Absorb their design thinking: color application, spacing rhythm, typography hierarchy, CTA prominence
- Note how they handle hero sections, content blocks, icons, product grids, and footers
- Use their structural sophistication as your quality benchmark

YOUR CREATIVE MANDATE:
- Design something NEW and TAILORED - do NOT copy the reference content or branding
- Adapt design patterns to perfectly fit the user's campaign goal, industry, and brand
- Write fresh, specific, on-brand copy - no placeholders, no lorem ipsum
- Create the best possible email for THIS brief, inspired by the reference quality level

${HTML_DIRECT_BUILD_DELIMITER_INSTRUCTION}

━━━ MANDATORY EMAIL HTML RULES ━━━
- Complete HTML document: DOCTYPE, <html lang="en">, <head> (charset utf-8, X-UA-Compatible IE=edge, viewport meta).
- Base content width 600 px. ALL layout via nested <table role="presentation"> - NO flexbox or grid.
- ALL CSS inline on elements. No <script>.
- Include ONE <style> block in <head> for responsive media queries, reset rules, and any Google Fonts @import (see below).
- CTA button: table-based bulletproof button - <a href="..."> with background-color on the <td> AND the <a>. Never an image button.
- Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif (default system stack).
- Body text: #1F2937 on #FFFFFF canvas.

━━━ GOOGLE FONTS (use when they elevate the design) ━━━
You MAY load Google Fonts via a <link> in <head> when a specific font improves the visual quality (e.g. a display heading font, a brand-matching serif, or a modern sans-serif). Example:
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
Rules for Google Fonts:
- Only load fonts you actually USE in the email
- Apply the Google Font to specific elements via inline style (e.g. style="font-family: 'Playfair Display', Georgia, serif;")
- Keep the system font stack as a reliable fallback after the Google Font name
- Limit to 2 font families maximum (one for headings, one for body if needed)
- Only use Google Fonts when they genuinely enhance the design for the brand/industry - do not add them gratuitously
- Use EXACT brand hex values from the BRAND block for headers, CTA, and accents.
- Every <img>: use {{NEB_IMG:key}} placeholder (replace K with actual key), width="600" (or appropriate), height="auto", alt text, border="0", display:block, max-width:100%.
- Footer: small text, unsubscribe link href="{{UNSUBSCRIBE_URL}}", physical address if available.
- No placeholder copy like [Company] or Lorem ipsum - write real, specific, on-brand copy.
- Generous padding: sections ≥ 24 px padding; CTA button ≥ 14 px vertical, 32 px horizontal.

━━━ RESPONSIVENESS (CRITICAL - every email MUST be mobile-perfect) ━━━
Include this <style> block inside <head>:
<style type="text/css">
  /* Reset */
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  /* Mobile */
  @media only screen and (max-width: 600px) {
    .email-container { width: 100% !important; min-width: 100% !important; }
    .fluid { width: 100% !important; max-width: 100% !important; height: auto !important; }
    .fluid-centered { margin: 0 auto !important; }
    .stack-column, .stack-column-center { display: block !important; width: 100% !important; max-width: 100% !important; direction: ltr !important; }
    .stack-column-center { text-align: center !important; }
    .center-on-narrow { text-align: center !important; display: block !important; margin-left: auto !important; margin-right: auto !important; }
    .full-width-on-mobile { width: 100% !important; height: auto !important; }
    .hide-on-mobile { display: none !important; }
    .show-on-mobile { display: block !important; }
    .font-mobile-large { font-size: 28px !important; line-height: 36px !important; }
    .font-mobile-medium { font-size: 20px !important; line-height: 28px !important; }
    .padding-mobile { padding-left: 16px !important; padding-right: 16px !important; }
    .cta-button a { display: block !important; width: auto !important; }
    td[class="hero-td"] img { width: 100% !important; height: auto !important; }
  }
</style>

Rules for applying responsive classes:
- Outer wrapper table: class="email-container", width="600", max-width 600px, margin auto.
- Images: always add class="fluid" and max-width:100%;height:auto; inline.
- Side-by-side columns (2-col layouts): each column <td> gets class="stack-column".
- Headlines: add class="font-mobile-large" to the main headline <td> or <p>.
- Padding cells: add class="padding-mobile" to any <td> that has left/right padding.
- CTA button container: add class="cta-button".

━━━ NO EMOJI - ABSOLUTE RULE ━━━
NEVER place any emoji or Unicode symbol characters anywhere in the HTML.
This includes body copy, headlines, CTA labels, footer, alt text, and anywhere else.
For icons and visual symbols, ALWAYS use an <img src="{{NEB_IMG:icon_*}}"> placeholder.
Emoji in HTML email renders inconsistently across clients. Zero exceptions.

━━━ IMAGE PLACEHOLDERS ━━━
For EVERY image you want to include (hero, product photos, icons), use:
  <img src="${imagePlaceholder("key")}" alt="description" ...>
Replace "key" with a descriptive slug (e.g. hero, product_1, icon_star).
In the meta JSON "image_slots" array, describe each slot precisely.

image_slots rules:
- kind "photo": lifestyle / product photograph. Prompt must end with: NO TEXT, NO LOGOS, NO WATERMARKS.
- kind "icon": flat isolated icon. Prompt must describe ONLY the icon shape, stroke/fill style, and subject - never the section background. NO TEXT. NO EMOJI. Never put hex codes in the icon prompt (models may render them as visible text).
- CRITICAL for icons: include "backgroundColor" as metadata - the EXACT hex of the <td> or section behind the icon (e.g. "#F3F4F6"). Used server-side only to match the fill; do NOT mention this hex in the prompt string.
- NEVER use emoji characters, Unicode symbols, or inline SVG for icons anywhere in the HTML.
- Each key in image_slots must exactly match the key used in the {{NEB_IMG:key}} placeholder in the HTML.

${NEB_ASSISTANT_TEXT_USER_RULES}`;
}
export function buildDirectHtmlUserPrompt(params) {
    const briefLines = [
        params.brief.goal && `Goal: ${params.brief.goal}`,
        params.brief.audience && `Target audience: ${params.brief.audience}`,
        params.brief.tone && `Tone: ${params.brief.tone}`,
        params.brief.emailType && `Email type: ${params.brief.emailType}`,
        params.brief.websiteUrl && `Website: ${params.brief.websiteUrl}`,
        params.brief.instructions && `Special instructions: ${params.brief.instructions}`,
    ]
        .filter(Boolean)
        .join("\n");
    const templateSection = params.templateRefs
        .map((t, i) => `### Design benchmark ${i + 1}: ${t.name}\n\`\`\`html\n${t.html}\n\`\`\``)
        .join("\n\n");
    return `${params.brandBlock}
${params.webContext ? `\n${params.webContext}\n` : ""}

━━━ CAMPAIGN BRIEF ━━━
${briefLines}

━━━ DESIGN BENCHMARKS (internal quality reference - never name these in assistant_text) ━━━
Study the following examples for layout sophistication, HTML structure, and visual rhythm.
Create something NEW tailored to the brief above - do NOT copy their content or branding.

${templateSection}

━━━ YOUR TASK ━━━
Using the benchmarks above as your quality and structural guide:
1. Design and build a complete, production-ready HTML email for the brief above
2. Write all copy fresh - specific, on-brand, and tailored to the company/goal
3. Structure sections to best serve the campaign objective
4. Use the brand colors, logo URL, and CTA URL from the BRAND block above
5. Include appropriate image slots ({{NEB_IMG:key}}) for hero and supporting visuals
6. Output using the delimiter format required by the system prompt

Build the complete email now.`;
}
export function buildDirectHtmlContinuationPrompt(params) {
    return `${params.brandBlock}

BRIEF SUMMARY: ${params.briefSummary}

Your previous HTML output was TRUNCATED. Continue from exactly where it stopped.
Output ONLY the remaining HTML starting from the cut point, then close all open tags through </html>.
After the HTML block, include the meta JSON delimiter block as usual.

TRUNCATED HTML ENDS WITH:
${params.partialHtml.slice(-3000)}`;
}
