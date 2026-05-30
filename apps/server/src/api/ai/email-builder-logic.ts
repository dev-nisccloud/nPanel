import Replicate from "replicate";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiContext {
	companyName?: string;
	productName?: string;
	audience?: string;
	goal?: string;
	tone?: string;
	instructions?: string;
	brandColors?: string[];
	emailType?: string;
	imageCount?: number;
}

export interface ImageRequest {
	blockId: string;
	prompt: string;
	aspectRatio?: "1:1" | "3:2" | "16:9" | "4:3";
	darkStyle?: boolean;
}

export interface AiEmailOutput {
	emailDocument: Record<string, EmailBlock>;
	imageRequests: ImageRequest[];
}

export interface EmailBlock {
	type: string;
	data: Record<string, any>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LLM_MODEL = "anthropic/claude-4.5-haiku";
export const IMAGE_MODEL = "google/nano-banana-pro";
export const FALLBACK_IMAGE_URL =
	"https://placehold.co/1200x800/F3F4F6/9CA3AF?text=Image+Unavailable";

// ---------------------------------------------------------------------------
// Prompt Builders
// ---------------------------------------------------------------------------

export function buildSystemPrompt(context: AiContext): string {
	const brandColorsSection = context.brandColors?.length
		? `BRAND IDENTITY:
- PRIMARY COLORS: ${context.brandColors.join(", ")}
- COLOR STRATEGY:
  • Use the PRIMARY color for the main CTA button background (buttonBackgroundColor).
  • Derive a very light tint of the primary (10–15% opacity or a near-white mix) for section/container backgrounds.
  • Use a second brand color (if provided) for accents: divider lines, category labels, small icon fills.
  • Keep the canvas (#FFFFFF) and body text (#1F2937) neutral so the brand color pops.
  • NEVER use the brand color as a body text color - only for buttons, labels, and accents.`
		: `BRAND IDENTITY:
- COLOR STRATEGY:
  • Select a purposeful accent colour that matches the email's tone:
    – Trust/Finance/Tech → deep navy (#1E3A5F) or slate blue (#2563EB)
    – Health/Nature → forest green (#166534) or teal (#0D9488)
    – Luxury/Beauty → deep plum (#581C87) or warm gold (#B45309)
    – Energy/Food → burnt orange (#C2410C) or crimson (#BE123C)
  • Use that accent for the CTA button and any highlight labels.
  • Backdrop: light neutral (#F9FAFB or #F3F4F6).
  • Canvas: crisp white (#FFFFFF).
  • Body text: high-contrast charcoal (#1F2937).`;

	return `You are a MASTER EMAIL ARCHITECT with 20 years of experience designing high-converting emails for companies like Airbnb, Stripe, Linear, Notion, and Apple. You understand information hierarchy, visual rhythm, persuasion psychology, and the technical constraints of email rendering.

You will be given a brand brief. Your job is to produce a single, cohesive JSON document that defines every block of the email - no filler, no lorem ipsum, no generic copy. Every word must be written as if a senior copywriter reviewed it.

══════════════════════════════════════════════════
STEP 1 - MANDATORY INTERNAL REASONING (before JSON)
══════════════════════════════════════════════════
Before writing any JSON, silently answer these questions in your reasoning:

  A) ARCHETYPE: Which of the 5 archetypes fits this brief? (See archetypes below.)
  B) STRUCTURE: What is the exact sequence of blocks? Name each block type in order.
  C) HIERARCHY: What is the ONE thing the reader must understand above the fold?
  D) CTA: What is the single action verb that drives the button? (Must be specific - NOT "Click here" or "Learn more".)
  E) IMAGE ROLE: If there is an image, what exact scene does it show? Is it a product, a lifestyle shot, a UI screenshot, or abstract?
  F) COLOR: What background, accent, and button color will be used, and why?

Only after answering A–F internally, output the JSON.

══════════════════════════════════════════════════
REQUIRED OUTPUT FORMAT
══════════════════════════════════════════════════
Output RAW JSON ONLY. No preamble. No explanation. No markdown fences. No trailing commas.

{
  "emailDocument": { ...block map... },
  "imageRequests": [
    {
      "blockId": "exact-block-id-that-has-__IMAGE_PLACEHOLDER__",
      "prompt": "Detailed, art-directed image prompt. See IMAGE PROMPT RULES below.",
      "aspectRatio": "1:1" | "3:2" | "16:9" | "4:3",
      "darkStyle": boolean
    }
  ]
}

If there are no images, imageRequests must be an empty array [].

══════════════════════════════════════════════════
EMAIL ARCHETYPES - CHOOSE EXACTLY ONE
══════════════════════════════════════════════════

1. TRANSACTIONAL (Booking / Order / Receipt):
   Pattern: Logo → Bold status heading (e.g. "Your booking is confirmed") → Info card (Container with light BG, rows of label|value pairs using ColumnsContainer) → Divider → Secondary details → Single primary Button.
   Copy style: Factual, reassuring, ultra-clear. No marketing language.
   Image: Optional. If used: product photo or venue exterior, 16:9.
   DO: Use ColumnsContainer for label|value rows (e.g. "Date | June 12" / "Guests | 2").
   DON'T: Add more than one CTA. Don't use promotional language.

2. SAAS / PRODUCT UPDATE (Feature launch, changelog, milestone):
   Pattern: Logo → Bold H1 heading → 2–3 sentences of context → Hero Image (product screenshot or UI) → Bullet-style feature list (ColumnsContainer: icon-col | text-col) → Primary Button.
   Copy style: Direct, confident, utility-focused. Lead with the benefit, not the feature name.
   Image: Product screenshot or abstract dashboard UI, dark or light depending on product aesthetic.
   DO: Use ColumnsContainer for the feature list. Give each feature a concrete benefit ("Cuts review time by 40%", not "Faster").
   DON'T: Use generic stock imagery. Don't have more than 3 feature bullets.

3. PROMOTIONAL / LAUNCH (Sale, new product, event):
   Pattern: Hero Image (full-bleed, editorial) → Short punchy H1 → 1–2 lines of evocative copy → CTA Button → Optional: 2-col product grid (ColumnsContainer with images).
   Copy style: Desire-driven, emotive, urgency without desperation. Short sentences. Strong verbs.
   Image: Product hero, lifestyle photography, editorial. Aspect ratio 16:9 or 3:2.
   DO: Lead with the image - it earns attention before the words do.
   DON'T: Write more than 40 words above the CTA. Avoid corporate language.

4. NEWSLETTER / CONTENT (Digest, roundup, editorial):
   Pattern: Masthead (Text with publication name + date) → Divider → H2 section heading → Body text → optional Image → Divider → repeat for 2nd section → Footer text.
   Copy style: Conversational, intelligent, opinionated. Write as if a smart friend is sharing what they know.
   Image: Editorial illustration or thematic photo. 3:2 or 16:9.
   DO: Use Dividers to separate sections. Use H2 for section titles, body Text for content.
   DON'T: Add a CTA for every section. One CTA at the end is enough.

5. ONBOARDING / WELCOME (New user, trial start, account created):
   Pattern: Logo → Warm H1 welcome → Personal body text (address the user's goal) → 3-step checklist (ColumnsContainer: number-col | step-col) → Primary CTA ("Complete your setup") → Secondary soft link text.
   Copy style: Warm, encouraging, clarity-first. Make the user feel capable, not overwhelmed.
   Image: Optional. If used: app screenshot or abstract "getting started" visual.
   DO: Number the steps explicitly. Make the CTA go directly to the first action.
   DON'T: List more than 3 steps. Don't overwhelm with features - focus on ONE win.

══════════════════════════════════════════════════
BLOCK SCHEMAS - EXACT NATIVE FORMAT
══════════════════════════════════════════════════

▸ ROOT (id="root", ALWAYS REQUIRED - must be first):
{
  "root": {
    "type": "EmailLayout",
    "data": {
      "backdropColor": "#F2F5F7",
      "canvasColor": "#FFFFFF",
      "textColor": "#1F2937",
      "fontFamily": "MODERN_SANS",
      "childrenIds": ["b-logo", "b-hero-img", "b-heading", ...]
    }
  }
}
⚠ EmailLayout data is FLAT - no props/style wrapper.
⚠ fontFamily must be one of: MODERN_SANS | GEOMETRIC_SANS | MODERN_SERIF
  – MODERN_SANS: Clean, contemporary (Inter-like). Use for SaaS, Transactional, Onboarding.
  – GEOMETRIC_SANS: Structured, confident (Futura-like). Use for Promotional, bold brands.
  – MODERN_SERIF: Editorial, premium (Playfair-like). Use for Newsletter, luxury brands.

▸ TEXT:
{
  "type": "Text",
  "data": {
    "props": { "text": "Your actual copy here. No placeholders." },
    "style": {
      "color": "#4B5563",
      "fontSize": 16,
      "textAlign": "left",
      "padding": { "top": 0, "right": 24, "bottom": 16, "left": 24 }
    }
  }
}
fontSize guidance: 14 = caption/footer, 16 = body (default), 18 = lead paragraph.

▸ HEADING:
{
  "type": "Heading",
  "data": {
    "props": { "text": "Your headline here", "level": "h1" },
    "style": {
      "color": "#111827",
      "fontWeight": "bold",
      "textAlign": "left",
      "padding": { "top": 0, "right": 24, "bottom": 8, "left": 24 }
    }
  }
}
level: "h1" (28–32px, hero headline), "h2" (22–24px, section title), "h3" (18px, sub-section).

▸ BUTTON:
{
  "type": "Button",
  "data": {
    "props": {
      "text": "Action verb phrase",
      "url": "https://example.com",
      "buttonBackgroundColor": "#1E40AF",
      "buttonTextColor": "#FFFFFF",
      "buttonStyle": "rounded",
      "size": "large"
    },
    "style": {
      "textAlign": "center",
      "padding": { "top": 16, "right": 24, "bottom": 32, "left": 24 }
    }
  }
}
buttonStyle: "rectangle" for bold/editorial brands, "rounded" for friendly/SaaS brands.
⚠ The button text must be a specific action verb - NEVER "Click here", "Learn more", or "Submit".
   Good examples: "View my booking", "Open the dashboard", "Claim your discount", "Start free trial", "Read this week's issue".

▸ IMAGE:
{
  "type": "Image",
  "data": {
    "props": {
      "url": "__IMAGE_PLACEHOLDER__",
      "alt": "Descriptive alt text for screen readers",
      "contentAlignment": "middle"
    },
    "style": {
      "textAlign": "center",
      "padding": { "top": 0, "right": 0, "bottom": 0, "left": 0 }
    }
  }
}
⚠ EVERY Image block MUST have a corresponding entry in imageRequests.
⚠ Use padding 0 for full-bleed hero images. Use padding { top:16, right:24, bottom:16, left:24 } for inset images.

▸ CONTAINER (groups blocks with a background):
{
  "type": "Container",
  "data": {
    "props": { "childrenIds": ["b-detail-row-1", "b-detail-row-2"] },
    "style": {
      "backgroundColor": "#F0F7FF",
      "borderRadius": 8,
      "padding": { "top": 24, "right": 0, "bottom": 24, "left": 0 }
    }
  }
}
Use Container when you need a visually distinct section (e.g. a booking info card, a feature highlight box).

▸ COLUMNS CONTAINER (2-column layout):
{
  "type": "ColumnsContainer",
  "data": {
    "props": {
      "columnsCount": 2,
      "columnsGap": 16,
      "columns": [
        { "childrenIds": ["b-col1-label"] },
        { "childrenIds": ["b-col2-value"] },
        { "childrenIds": [] }
      ]
    },
    "style": {
      "padding": { "top": 8, "right": 24, "bottom": 8, "left": 24 }
    }
  }
}
⚠ The "columns" array MUST always contain EXACTLY 3 objects (third is empty for 2-col layout).
⚠ Each childrenId inside columns must exist as a top-level block in emailDocument.

▸ DIVIDER:
{
  "type": "Divider",
  "data": {
    "props": { "lineHeight": 1, "lineColor": "#E5E7EB" },
    "style": { "padding": { "top": 16, "right": 24, "bottom": 16, "left": 24 } }
  }
}

══════════════════════════════════════════════════
IMAGE PROMPT RULES - BE A PHOTO ART DIRECTOR
══════════════════════════════════════════════════
Each image prompt must include ALL of the following layers:

  1. SUBJECT: What exactly is shown? (Not "a person" - "a young woman in her 30s in a bright coworking space, looking at a laptop with a satisfied expression")
  2. ENVIRONMENT: Where is it? ("Scandinavian-style open-plan office, large windows, afternoon light")
  3. STYLE: Photography style or rendering style ("shot on Canon EOS R5, 35mm, f/1.8 bokeh background, editorial colour grade")
  4. LIGHTING: ("warm golden hour side-light", "soft diffused studio light", "dramatic single-source key light")
  5. COLOUR PALETTE: ("muted sage greens and warm creams", "high-contrast monochrome with electric blue accent")
  6. NEGATIVE CONSTRAINTS: Always end with "NO TEXT, NO LOGOS, NO WATERMARKS, NO PEOPLE if not needed, photorealistic only"

Bad prompt (too vague):  "A professional person working on a laptop"
Good prompt: "A focused woman in her early 30s seated at a minimalist white desk, MacBook Pro open, glass of water beside her. Scandinavian home office, large frosted window behind her casting soft diffused daylight. Shot on Sony A7IV, 50mm prime, shallow depth of field, muted warm tones - sage, cream, and pale oak. Editorial lifestyle photography. NO TEXT, NO LOGOS, NO WATERMARKS."

══════════════════════════════════════════════════
COPY WRITING RULES - WRITE LIKE A PRO
══════════════════════════════════════════════════
1. SPECIFICITY: Replace every generic word. Not "great features" → "automatic syncing across all devices". Not "we're excited" → state the fact and let the reader be excited.
2. SCANNABILITY: Max 3 sentences per Text block. If you have more to say, use a new block or a Heading.
3. VOICE CONSISTENCY: Choose one voice (warm/direct/authoritative) and maintain it throughout every block.
4. SUBJECT LINE LOGIC: The H1 heading IS the subject line - it must answer "why should I keep reading?" in under 10 words.
5. FOOTER: Always include a short footer Text block with unsubscribe language: "You're receiving this because you signed up at [company]. Unsubscribe."

══════════════════════════════════════════════════
STRUCTURAL RULES - WHAT TO AVOID
══════════════════════════════════════════════════
✗ NO Spacer blocks - use padding on adjacent blocks instead.
✗ NO placeholder text ("Your company name", "Lorem ipsum", "[Product]").
✗ NO generic CTAs ("Click here", "Learn more", "Submit", "Read more").
✗ NO more than one primary CTA button - secondary actions use a Text block with a plain link.
✗ NO dangling childrenIds - every ID referenced in childrenIds must exist in emailDocument.
✗ NO more than 8 top-level blocks (inside root.childrenIds) - group with Containers if needed.
✗ NEVER nest a ColumnsContainer inside another ColumnsContainer.

${brandColorsSection}`;
}

export function buildUserPrompt(context: AiContext): string {
	const imageCountInstruction =
		context.imageCount != null
			? context.imageCount === 0
				? `Include ZERO images. This is a text-only email. Do not add any Image blocks.`
				: `Include EXACTLY ${context.imageCount} Image block(s). Each must use url = "__IMAGE_PLACEHOLDER__" and have a matching entry in imageRequests.`
			: `Image guidance: Include 1 Image block if the email meaningfully benefits from one (hero shot, product screenshot, lifestyle photo). Only add a second if the archetype explicitly calls for it (e.g. a 2-col product grid in a promotional email). If in doubt, skip the image - a clean text email often converts better than a generic one.`;

	const emailTypeInstruction = context.emailType
		? `Email type / archetype to use: ${context.emailType}. Apply that archetype's structure and copy style from the system prompt.`
		: `Choose the most fitting archetype from the system prompt based on the goal below.`;

	return `You are designing a complete marketing email. Follow every rule in the system prompt.

══════════════════════════════════════
BRAND BRIEF
══════════════════════════════════════
Company:          ${context.companyName || "A professional brand"}
${context.productName ? `Product/Service:   ${context.productName}` : ""}
Target audience:  ${context.audience || "General professional audience"}
Primary goal:     ${context.goal || "Engage and inform the reader"}
Tone:             ${context.tone || "Professional and friendly"}
${emailTypeInstruction}
${context.instructions ? `Special instructions: ${context.instructions}` : ""}

══════════════════════════════════════
IMAGE REQUIREMENT
══════════════════════════════════════
${imageCountInstruction}

══════════════════════════════════════
CHECKLIST - VERIFY BEFORE OUTPUTTING
══════════════════════════════════════
Before writing JSON, reason through each item:

[ ] I have chosen an archetype and will follow its block sequence.
[ ] My H1 heading answers "why keep reading?" in under 10 words.
[ ] My CTA button uses a specific action verb (NOT "Click here" / "Learn more").
[ ] Every Text block has ≤ 3 sentences. If more is needed, I split into multiple blocks.
[ ] Every Image block has a corresponding imageRequests entry with a detailed, art-directed prompt.
[ ] No Spacer blocks - spacing is handled via padding.
[ ] root.childrenIds references only IDs that exist in emailDocument.
[ ] ColumnsContainer.props.columns has EXACTLY 3 items.
[ ] I have a footer Text block with unsubscribe copy.
[ ] All copy is specific to THIS brand - zero placeholders or lorem ipsum.

Now output the JSON.`;
}

// ---------------------------------------------------------------------------
// Normalization - maps AI output to exact native waypoint schema
// ---------------------------------------------------------------------------

function normalizeLevel(level: any): "h1" | "h2" | "h3" {
	if (level === 1 || level === "1" || level === "h1") return "h1";
	if (level === 2 || level === "2" || level === "h2") return "h2";
	if (level === 3 || level === "3" || level === "h3") return "h3";
	return "h2";
}

function normalizeFontWeight(fw: any): "bold" | "normal" | undefined {
	if (!fw) return undefined;
	const s = String(fw);
	if (s === "bold" || s === "700" || s === "600") return "bold";
	if (s === "normal" || s === "400" || s === "300") return "normal";
	return undefined;
}

function normalizePadding(
	p: any
): { top: number; right: number; bottom: number; left: number } | undefined {
	if (!p || typeof p !== "object") return undefined;
	return {
		top: Number(p.top ?? 0),
		right: Number(p.right ?? 0),
		bottom: Number(p.bottom ?? 0),
		left: Number(p.left ?? 0),
	};
}

/**
 * Converts the AI-generated emailDocument into the exact native waypoint block
 * schema that the editor, preview, and HTML renderer all expect.
 *
 * Handles two AI output patterns:
 *   A) Flat:   data = { text: "...", color: "#...", level: 1 }
 *   B) Nested: data = { props: { text: "...", level: "h1" }, style: { color: "#..." } }
 *
 * Both are normalised to the canonical:
 *   { props: { ...content fields... }, style: { ...visual fields... } }
 * except EmailLayout which stays flat.
 */
export function normalizeAiEmailDocument(
	doc: Record<string, any>
): Record<string, any> {
	const out: Record<string, any> = {};

	for (const [id, block] of Object.entries(doc)) {
		const type: string = block.type;
		const raw: Record<string, any> = block.data ?? {};

		// Support both flat (AI format A) and nested (AI format B / already native)
		const flatSrc: Record<string, any> = raw.props
			? { ...raw.props, ...raw.style }
			: { ...raw };

		const nestedProps: Record<string, any> = raw.props ?? {};
		const nestedStyle: Record<string, any> = raw.style ?? {};

		switch (type) {
			case "EmailLayout": {
				const p = raw.props ?? {};
				out[id] = {
					type: "EmailLayout",
					data: {
						backdropColor:
							raw.backdropColor ?? p.backdropColor ?? "#F4F4F5",
						canvasColor: raw.canvasColor ?? p.canvasColor ?? "#FFFFFF",
						textColor: raw.textColor ?? p.textColor ?? "#1A1A1A",
						fontFamily:
							raw.fontFamily ??
							p.fontFamily ??
							"MODERN_SANS",
						borderRadius: raw.borderRadius ?? p.borderRadius ?? 0,
						borderColor:
							raw.borderColor ?? p.borderColor ?? undefined,
						childrenIds: raw.childrenIds ?? p.childrenIds ?? [],
					},
				};
				break;
			}

			case "Heading": {
				out[id] = {
					type: "Heading",
					data: {
						props: {
							text: nestedProps.text ?? flatSrc.text ?? "",
							level: normalizeLevel(
								nestedProps.level ?? flatSrc.level
							),
						},
						style: {
							color: nestedStyle.color ?? flatSrc.color,
							backgroundColor:
								nestedStyle.backgroundColor ??
								flatSrc.backgroundColor,
							fontWeight: normalizeFontWeight(
								nestedStyle.fontWeight ?? flatSrc.fontWeight
							),
							textAlign:
								nestedStyle.textAlign ?? flatSrc.textAlign,
							padding: normalizePadding(
								nestedStyle.padding ?? flatSrc.padding
							),
						},
					},
				};
				break;
			}

			case "Text": {
				out[id] = {
					type: "Text",
					data: {
						props: {
							text: nestedProps.text ?? flatSrc.text ?? "",
						},
						style: {
							color: nestedStyle.color ?? flatSrc.color,
							fontSize:
								nestedStyle.fontSize ?? flatSrc.fontSize,
							fontWeight: normalizeFontWeight(
								nestedStyle.fontWeight ?? flatSrc.fontWeight
							),
							textAlign:
								nestedStyle.textAlign ?? flatSrc.textAlign,
							padding: normalizePadding(
								nestedStyle.padding ?? flatSrc.padding
							),
						},
					},
				};
				break;
			}

			case "Button": {
				const btnBg =
					nestedProps.buttonBackgroundColor ??
					nestedProps.backgroundColor ??
					flatSrc.buttonBackgroundColor ??
					flatSrc.backgroundColor ??
					"#1E40AF";
				const btnColor =
					nestedProps.buttonTextColor ??
					nestedProps.color ??
					flatSrc.buttonTextColor ??
					flatSrc.color ??
					"#FFFFFF";
				out[id] = {
					type: "Button",
					data: {
						props: {
							text: nestedProps.text ?? flatSrc.text ?? "",
							url: nestedProps.url ?? flatSrc.url ?? "#",
							buttonBackgroundColor: btnBg,
							buttonTextColor: btnColor,
							buttonStyle:
								nestedProps.buttonStyle ??
								flatSrc.buttonStyle ??
								"rounded",
							size:
								nestedProps.size ?? flatSrc.size ?? "large",
						},
						style: {
							textAlign:
								nestedStyle.textAlign ??
								flatSrc.textAlign ??
								"center",
							padding: normalizePadding(
								nestedStyle.padding ?? flatSrc.padding
							),
						},
					},
				};
				break;
			}

			case "Image": {
				out[id] = {
					type: "Image",
					data: {
						props: {
							url:
								nestedProps.url ??
								flatSrc.url ??
								"__IMAGE_PLACEHOLDER__",
							alt: nestedProps.alt ?? flatSrc.alt ?? "",
							width: nestedProps.width ?? flatSrc.width ?? 600,
							height:
								nestedProps.height ?? flatSrc.height ?? 300,
							contentAlignment:
								nestedProps.contentAlignment ??
								flatSrc.contentAlignment ??
								"middle",
						},
						style: {
							textAlign:
								nestedStyle.textAlign ??
								flatSrc.textAlign ??
								"center",
							padding: normalizePadding(
								nestedStyle.padding ?? flatSrc.padding
							),
						},
					},
				};
				break;
			}

			case "Spacer": {
				out[id] = {
					type: "Spacer",
					data: {
						props: {
							height: nestedProps.height ?? flatSrc.height ?? 16,
						},
					},
				};
				break;
			}

			case "Divider": {
				out[id] = {
					type: "Divider",
					data: {
						props: {
							lineHeight:
								nestedProps.lineHeight ??
								flatSrc.lineHeight ??
								1,
							lineColor:
								nestedProps.lineColor ??
								flatSrc.lineColor ??
								"#E5E7EB",
						},
						style: {
							padding: normalizePadding(
								nestedStyle.padding ?? flatSrc.padding
							),
						},
					},
				};
				break;
			}

			case "Container": {
				const childrenIds =
					nestedProps.childrenIds ??
					raw.childrenIds ??
					flatSrc.childrenIds ??
					[];
				out[id] = {
					type: "Container",
					data: {
						props: { childrenIds },
						style: {
							backgroundColor:
								nestedStyle.backgroundColor ??
								flatSrc.backgroundColor,
							borderRadius:
								nestedStyle.borderRadius ??
								flatSrc.borderRadius,
							borderColor:
								nestedStyle.borderColor ??
								flatSrc.borderColor,
							padding: normalizePadding(
								nestedStyle.padding ?? flatSrc.padding
							),
						},
					},
				};
				break;
			}

			case "ColumnsContainer": {
				const columns =
					nestedProps.columns ?? flatSrc.columns ?? [];
				out[id] = {
					type: "ColumnsContainer",
					data: {
						props: {
							columnsCount:
								nestedProps.columnsCount ??
								flatSrc.columnsCount ??
								2,
							columnsGap:
								nestedProps.columnsGap ??
								flatSrc.columnsGap ??
								16,
							columns,
						},
						style: {
							padding: normalizePadding(
								nestedStyle.padding ?? flatSrc.padding
							),
							backgroundColor:
								nestedStyle.backgroundColor ??
								flatSrc.backgroundColor,
						},
					},
				};
				break;
			}

			default:
				out[id] = block;
		}
	}

	return out;
}

// ---------------------------------------------------------------------------
// Structural Validation (runs AFTER normalization)
// ---------------------------------------------------------------------------

export function validateEmailDocument(doc: Record<string, any>): void {
	if (!doc || typeof doc !== "object") {
		throw new Error("emailDocument is missing or not an object");
	}
	if (!doc["root"] || doc["root"].type !== "EmailLayout") {
		throw new Error("Missing required 'root' EmailLayout block");
	}

	const rootChildren: string[] =
		doc["root"].data?.childrenIds ?? [];
	if (!rootChildren.length) {
		throw new Error(
			"root EmailLayout has no childrenIds - email would be empty"
		);
	}

	const allIds = new Set(Object.keys(doc));
	const dangling: string[] = [];

	for (const block of Object.values(doc)) {
		const d = (block as any).data ?? {};
		const ids: string[] = [
			...(d.childrenIds ?? []),
			...(d.props?.childrenIds ?? []),
			...(d.props?.columns ?? []).flatMap(
				(col: any) => col.childrenIds ?? []
			),
			...(d.columns ?? []).flatMap(
				(col: any) => col.childrenIds ?? []
			),
		];
		for (const cid of ids) {
			if (!allIds.has(cid)) dangling.push(cid);
		}
	}

	if (dangling.length) {
		throw new Error(
			`emailDocument has dangling childrenIds: ${dangling.join(", ")}`
		);
	}
}

// ---------------------------------------------------------------------------
// Image Generation Helper
// ---------------------------------------------------------------------------

/**
 * Builds a production-quality image prompt by layering the AI's intent
 * with strict technical and aesthetic directives. This compensates for
 * the absence of extended thinking on Replicate-hosted models.
 */
export function buildEnrichedImagePrompt(req: ImageRequest): string {
	const lightingDirective = req.darkStyle
		? "dramatic single-source key light, deep shadows, rich dark atmosphere, cinematic noir colour grade"
		: "soft diffused natural light, bright and airy, clean shadows, editorial lifestyle colour grade";

	const qualityTags = [
		"ultra high resolution",
		"professional commercial photography",
		"shot on Phase One IQ4, 80mm",
		"colour-graded in Capture One",
		"suitable for premium email marketing",
		"photorealistic",
	].join(", ");

	const exclusions =
		"NO TEXT OVERLAYS, NO LOGOS, NO WATERMARKS, NO STOCK-PHOTO CLICHÉS, NO LENS FLARE, NO OVERSATURATION";

	return `${req.prompt}. ${lightingDirective}. ${qualityTags}. ${exclusions}`;
}

export async function generateImage(
	replicate: Replicate,
	req: ImageRequest
): Promise<string> {
	const enrichedPrompt = buildEnrichedImagePrompt(req);

	const prediction = await replicate.run(IMAGE_MODEL, {
		input: {
			prompt: enrichedPrompt,
			aspect_ratio: req.aspectRatio ?? "3:2",
			output_format: "png",
		},
	});

	const url = Array.isArray(prediction)
		? prediction[0]
		: (prediction as string);

	if (!url || typeof url !== "string" || !url.startsWith("http")) {
		throw new Error(
			`Unexpected image output format: ${JSON.stringify(prediction)}`
		);
	}

	return url;
}