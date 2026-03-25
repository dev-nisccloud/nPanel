import { z } from "zod";
import Replicate from "replicate";

const refineImagePromptSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  generationMode: z.enum(["normal", "visual-creative"]),
  aspectRatio: z.string().optional(),
  outputFormat: z.string().optional(),
  resolution: z.string().optional(),
  // Visual & creative options (used when generationMode === "visual-creative")
  style: z.string().optional(),
  composition: z.string().optional(),
  colorPalette: z.string().optional(),
  colorMood: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  typography: z.string().optional(),
  lighting: z.string().optional(),
  texture: z.string().optional(),
  mood: z.string().optional(),
  audience: z.string().optional(),
  intent: z.string().optional(),
});

export type RefineImagePromptBody = z.infer<typeof refineImagePromptSchema>;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

function extractTextFromReplicateOutput(output: unknown): string {
  if (typeof output === "string") {
    return output;
  }

  if (Array.isArray(output)) {
    // Concatenate array of strings or string-like values
    return output.map((item) => (typeof item === "string" ? item : String(item ?? ""))).join("");
  }

  if (output && typeof output === "object" && "output" in (output as any)) {
    const inner = (output as { output?: unknown }).output;
    if (typeof inner === "string") return inner;
    if (Array.isArray(inner)) {
      return inner.map((item) => (typeof item === "string" ? item : String(item ?? ""))).join("");
    }
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = refineImagePromptSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const {
      prompt,
      generationMode,
      aspectRatio,
      outputFormat,
      resolution,
      style,
      composition,
      colorPalette,
      colorMood,
      primaryColor,
      secondaryColor,
      accentColor,
      typography,
      lighting,
      texture,
      mood,
      audience,
      intent,
    } = parsed.data;

    const systemPrompt = `You are an expert at writing AI image-generation prompts for visual design. Your task is to produce a single, HIGHLY DETAILED, comprehensive, long-form image prompt Ã¢â‚¬â€ the kind used by professional art directors and brand teams for world-class campaigns.

CRITICAL OUTPUT RULES:
- Output ONLY the refined prompt text. No preamble, no explanation, no "Here is the prompt:".
- Output must be PLAIN TEXT only. Do not use markdown or formatting symbols in your response: no ** for bold, no * for italics, no # for headings, no backticks, no __. Write as plain text suitable for an image model. The only exception is when a symbol is literally part of the design description (e.g. "ampersand in the logo").
- Be EXPANSIVE and REALLY DETAILED. The refined prompt must be long and specific enough to brief a designer or an AI image model with full creative direction. Aim for substantial length: multiple paragraphs or a long structured block. More detail yields better image results.
- Use logic and inference to ADD CONTEXT THE USER DID NOT EXPLICITLY MENTION but that will improve the output. Infer from the user's intent, audience, and style: add concrete visual details, atmosphere, technical quality cues (e.g. "photorealistic 3D render", "cinematic precision", "print-quality resolution"), environmental details, lighting specifics, material or finish notes, and any other creative direction that aligns with the 7 Pillars and the guide. Think like an art director filling in the brief Ã¢â‚¬â€ add what would make the final image world-class.
- Structure the prompt with clear, labeled sections where appropriate (e.g. HERO VISUAL CONCEPT, COMPOSITION, COLOR PALETTE, TYPOGRAPHY, MOOD, AUDIENCE, ENVIRONMENT & BACKGROUND, VISUAL EFFECTS, TEXT CONTENT, FINISH, STYLE REFERENCES). Use the user's design type and the guide to choose the right sections.
- Name specific colors and use hex codes where possible (e.g. "electric cobalt blue (#1a4fd6)", "deep space navy (#070d1f)").
- Describe composition in detail: where elements sit, how the eye moves, zones or layers, negative space.
- Specify typography: font style, weight, hierarchy, treatment for headlines vs body vs CTAs.
- Include lighting, texture/finish, and mood. Define audience and intent clearly.
- Follow the Master AI Creative Design Prompt Guide (Universal Formula and 7 Pillars) in full. Every pillar should be addressed in the refined prompt where relevant.

--- MASTER AI CREATIVE DESIGN PROMPT GUIDE (use as reference) ---
A Comprehensive Framework for Prompting Any Type of Visual Design
1. The Universal Prompt Formula
Every strong AI design prompt follows this structure, regardless of the design type:
[FORMAT + ORIENTATION] + [DESIGN TYPE] + [SUBJECT/CONTENT] +
[STYLE/AESTHETIC] + [COMPOSITION] + [COLOR PALETTE] +
[TYPOGRAPHY] + [LIGHTING] + [TEXTURE/FINISH] + [MOOD] + [AUDIENCE]
Example applying the formula:
Portrait A3 poster Ã¢â‚¬â€ bold typographic product advertisement Ã¢â‚¬â€ featuring a luxury skincare serum bottle Ã¢â‚¬â€ in a minimal Swiss editorial style Ã¢â‚¬â€ hero product centered with generous white space, diagonal accent lines leading the eye Ã¢â‚¬â€ palette of warm ivory, matte gold, and deep forest green Ã¢â‚¬â€ clean serif headline at top, thin sansserif subtext below Ã¢â‚¬â€ soft diffused top lighting with a subtle warm glow Ã¢â‚¬â€ matte finish with slight grain overlay Ã¢â‚¬â€ mood: quiet luxury and confidence Ã¢â‚¬â€ audience: premium skincare consumers aged 28Ã¢â‚¬â€œ45.
The more layers you add from this formula, the more controlled and detailed your output will be.
2. The 7 Pillars of Every Great Design Prompt
These are nonnegotiable elements that should be present in any prompt regardless of design type.
 Pillar 1 Ã¢â‚¬â€ Intent & Purpose
Tell the AI why this design exists. Is it to sell? Inform? Evoke emotion? Celebrate?
 "A promotional poster designed to drive event attendance"
 "A brand identity card meant to communicate trust and professionalism"
 "A social media graphic intended to stop the scroll"
 Pillar 2 Ã¢â‚¬â€ Audience
Who is looking at this? Age, lifestyle, taste, and context all affect design decisions.
 "Targeting Gen Z streetwear enthusiasts"
 "Aimed at Csuite corporate executives"
 "For parents of children aged 3Ã¢â‚¬â€œ7"
 Pillar 3 Ã¢â‚¬â€ Format & Dimensions
Always define the output format and aspect ratio upfront.
 "Square 1:1 social media post"
 "Portrait A2 poster"
 "Landscape 16:9 presentation slide"
 "Business card Ã¢â‚¬â€ 85mm x 55mm, horizontal"
 Pillar 4 Ã¢â‚¬â€ Style / Aesthetic Direction
Commit to one clear aesthetic. Mixing too many styles produces muddy results.
 "Brutalist raw typographic style"
 "Soft pastel maximalism"
 "Dark luxury Ã¢â‚¬â€ matte surfaces, gold accents, deep shadows"
 "Retro 1970s psychedelic"
 Pillar 5 Ã¢â‚¬â€ Composition
Describe where things are placed and how the eye should move. (See Section 3 for full breakdown.)
 Pillar 6 Ã¢â‚¬â€ Color Palette
Name specific colors or provide hex codes. Vague color prompts = vague results. (See Section 4.)
 Pillar 7 Ã¢â‚¬â€ Mood
One or two words that describe the emotional feeling of the design.
 "Energetic and rebellious"
 "Calm and meditative"
 "Playful and curious"
 "Powerful and intimidating"
3. Composition & Layout Ã¢â‚¬â€ How to Place Things
Composition is how elements are arranged within the frame. This is one of the most important and most overlooked areas in AI design prompting.
 Layout Structures
Centered / Symmetrical
Everything aligns to the center axis. Safe, balanced, authoritative.
Use for: logos, badges, formal invitations, award certificates, album covers
Rule of Thirds
Divide the canvas into a 3x3 grid. Place key subjects at the intersection points.
Use for: photographyheavy designs, editorial layouts, social media posts
ZPattern Layout
The eye travels: topleft Ã¢â€ â€™ topright Ã¢â€ â€™ bottomleft Ã¢â€ â€™ bottomright. Good for designs with both visuals and text.
Use for: landing pages, magazine spreads, advertising flyers
FPattern Layout
The eye scans horizontally across the top, then drops down and scans again. Works for textheavy designs.
Use for: newsletters, menus, information posters
Diagonal / Dynamic Flow
Elements are arranged along a diagonal axis for motion and energy.
Use for: sports graphics, energy drink ads, actionoriented campaigns
Asymmetrical / OffCenter
The subject is intentionally pushed to one side, with negative space on the other. Creates tension and modernity.
Use for: editorial design, luxury branding, contemporary art posters
Overlapping / Layered
Elements overlap each other deliberately to create depth and visual interest.
Use for: collagestyle design, fashion editorials, cultural event posters
 How to Describe Composition in a Prompt
Always describe:
1. Where the hero element sits Ã¢â‚¬â€ "hero product placed in the lower twothirds of the frame"
2. What anchors the top Ã¢â‚¬â€ "bold headline anchors the top third"
3. Where supporting elements go Ã¢â‚¬â€ "secondary text floats in the lower left"
4. How the eye moves Ã¢â‚¬â€ "diagonal light streak guides the eye from topright to bottomleft"
5. How much breathing room exists Ã¢â‚¬â€ "generous negative space on the right side"
 Composition Vocabulary
 "Hero element centered with radiating composition outward"
 "Fullbleed background with foreground subject breaking the frame edge"
 "Layered depth: foreground subject, midground gradient, background texture"
 "Text wraps the contour of the central illustration"
 "Bleeding off the edge of the canvas on the left side"
 "Pinned to the bottom third with dramatic empty sky above"
 "Offset to the right with a strong leftmargin text column"
 4. Color Theory for Prompting
 Always Specify a Color Palette
Never leave color to chance. Describe it with precision.
Bad prompt: "use nice colors"
Good prompt: "deep midnight navy (0a0f2c), warm ivory (f5f0e8), and a single electric coral accent (ff4e3a)"
 Color Palette Approaches
Monochromatic Ã¢â‚¬â€ Variations of one hue. Creates unity and elegance.
"All tones of deep forest green from nearblack through to pale sage, with white text"
Complementary Ã¢â‚¬â€ Two colors opposite on the color wheel. High contrast and energy.
"Electric blue and burnt orange Ã¢â‚¬â€ high contrast, punchy, bold"
Analogous Ã¢â‚¬â€ Colors next to each other on the wheel. Harmonious and soothing.
"Sunset palette Ã¢â‚¬â€ coral, amber, dusty rose, and warm peach"
Triadic Ã¢â‚¬â€ Three evenly spaced colors. Vibrant but balanced.
"Primary triad Ã¢â‚¬â€ deep red, cobalt blue, golden yellow Ã¢â‚¬â€ on a white ground"
SplitComplementary Ã¢â‚¬â€ One base color plus two colors adjacent to its complement. Sophisticated.
"Sage green base with dusty rose and warm terracotta accents"
Neutral + One Bold Accent
The safest approach for premium designs.
"Palette of charcoal, warm white, and a single deep gold accent"
 Color Mood Reference
Mood                  | Color Direction
Energy / Power        | Neon yellow, electric blue, hot red, black
Luxury / Premium      | Deep black, gold, ivory, burgundy
Health / Nature       | Forest green, earth tones, terracotta, cream
Technology            | Electric blue, silver, white, dark grey
Playful / Fun         | Bright primaries, pastels, rainbow
Calm / Wellness       | Soft sage, dusty blue, lavender, warm white
Romance               | Blush pink, rose gold, deep burgundy, soft cream
Urgency / Warning     | Red, orange, black, white
Trust / Corporate     | Navy blue, white, silver, midgrey
Creativity / Art      | Deep jewel tones, unexpected color clashes
 5. Typography Rules
Typography is often the most neglected element in AI design prompts. These rules make the difference between amateur and professional outputs.
 Font Style Categories
Serif Ã¢â‚¬â€ Has small strokes (feet) at the ends of letters. Feels classic, trustworthy, editorial.
Best for: luxury brands, editorial, books, law firms, fashion, certificates
SansSerif Ã¢â‚¬â€ Clean, no strokes. Feels modern, minimal, digital.
Best for: tech brands, UI design, corporate, sports, contemporary
Display / Decorative Ã¢â‚¬â€ Expressive, unique letterforms. Feels distinctive and ownable.
Best for: headlines only, event posters, album art, logos, cultural brands
Monospace Ã¢â‚¬â€ Fixedwidth letters. Feels technical, codelike, retro digital.
Best for: tech brands, hacker aesthetic, gaming, cyberpunk
Script / Handwritten Ã¢â‚¬â€ Flowing, human letterforms. Feels personal and warm.
Best for: wedding invitations, artisan brands, beauty, greeting cards
Condensed / Compressed Ã¢â‚¬â€ Very narrow letterforms. Feels powerful when large.
Best for: sports, headlines, bold statement posters
Wide / Expanded Ã¢â‚¬â€ Stretched horizontally. Feels spacious and commanding.
Best for: luxury, architectural brands, premium goods
 How to Describe Typography in a Prompt
Describe these five things:
1. Font style Ã¢â‚¬â€ "bold condensed sansserif"
2. Weight Ã¢â‚¬â€ "ultraheavy weight headline" / "thin elegant subtext"
3. Case Ã¢â‚¬â€ "all caps" / "sentence case" / "mixed case with strategic capitalization"
4. Size hierarchy Ã¢â‚¬â€ "massive 80pt headline, 18pt subheading, 12pt body"
5. Treatment Ã¢â‚¬â€ "slight letterspacing on the subheading" / "outlined type on the headline" / "gradient fill on the hero text"
 Typography Hierarchy Rules
Every design must have a clear reading order:
1. Primary Ã¢â‚¬â€ The first thing the eye lands on. Biggest, boldest, most contrast.
2. Secondary Ã¢â‚¬â€ Supports the primary. Smaller, lighter weight.
3. Tertiary Ã¢â‚¬â€ Supporting detail. Smallest, most muted.
In your prompt: "Headline in massive bold condensed white type at top (primary), product name in mediumweight gold serif below (secondary), tagline and small print in thin grey sansserif at the base (tertiary)"
 6. Lighting & Atmosphere
Lighting defines the drama, depth, and mood of a design. Always describe it.
 Lighting Types
Soft / Diffused Light Ã¢â‚¬â€ No harsh shadows. Even, clean, professional.
Use for: product photography, skincare, wellness, corporate
Dramatic / Directional Light Ã¢â‚¬â€ Strong single light source, deep shadows.
Use for: luxury, cinemastyle, music, alcohol brands, perfume
Backlit / Rim Light Ã¢â‚¬â€ Light source behind the subject creating a glowing edge.
Use for: tech, energy drinks, gaming, scifi aesthetics
God Rays / Volumetric Light Ã¢â‚¬â€ Shafts of light cutting through atmosphere.
Use for: epic/cinematic, religious imagery, event posters, adventure
Neon / Artificial Light Ã¢â‚¬â€ Colored artificial light sources creating colored shadows.
Use for: nightlife, music, streetwear, cyberpunk, urban culture
Natural / Golden Hour Ã¢â‚¬â€ Warm, low sun. Nostalgic, organic, lifestyle.
Use for: food, travel, lifestyle, wellness, outdoor brands
Studio / Product Light Ã¢â‚¬â€ Clinical, perfectly controlled. Every surface detail visible.
Use for: product launches, ecommerce, tech hardware
 Lighting Prompt Examples
 "Single dramatic overhead spotlight creating deep shadows below, cinematic feel"
 "Soft ambient light from the left, subtle shadow on the right, clean and productfocused"
 "Neon blue and pink light sources on either side of the subject, colored shadows on background"
 "Glowing backlight creating a sharp rim around the product silhouette"
 "Warm golden hour light flooding from topright, long soft shadows"
 7. Texture & Finish
Texture adds tactility and professionalism. It separates flat designs from ones that feel physical and real.
 Finish Types
Finish       | Description                        | Best Used For
Matte        | No shine, flat, refined            | Luxury, minimalism, editorial
Glossy       | Reflective, highshine             | Products, tech, beauty
Metallic     | Reflective metallic sheen          | Premium, awards, fashion
Grain / Film | Fine noise overlay                 | Vintage, indie, editorial
Risograph    | Layered ink, slight misregistration| Art prints, indie publishing
Halftone     | Dot pattern                        | Retro, comic book, screen print
Distressed   | Worn, aged, cracked                | Vintage, streetwear, music
Embossed     | Raised surface illusion            | Certificates, luxury packaging
Holographic  | Iridescent rainbow shift           | Beauty, Gen Z, premium events
Linen / Paper| Organic paper texture              | Editorial, organic brands, stationery
 Texture Prompt Examples
 "Fine grain overlay across the entire composition for a vintage editorial feel"
 "Holographic foil strip across the headline text, iridescent rainbow shift"
 "Subtle linen paper texture in the background, warm offwhite"
 "Risographstyle printing with slight color misregistration and ink texture"
 "Matte black surface on the product with visible fine grain, contrasting glossy logo"
 "Distressed halftone dot texture in the background shadow areas"
 8. StylebyStyle Guide Ã¢â‚¬â€ Dos & Don'ts
 Minimalism
The Look: Clean space, one or two colors, strong typography, nothing unnecessary.
DO                                          | DON'T
Use generous white/negative space           | Fill every corner with elements
One or two colors maximum                   | Use more than three colors
Single strong typeface                      | Mix many different fonts
Let the subject breathe                     | Add decorative borders or frames
High contrast between elements              | Use lowcontrast color combinations
Simple geometric shapes only                | Add drop shadows or gradients everywhere
Center or strong asymmetry                  | Random or cluttered placement
Key prompt words: "negative space, restrained, quiet, refined, single focal point, strict grid, essential elements only"
 Maximalism
The Look: Dense, layered, abundant. Everything has pattern, color, and detail.
DO                                          | DON'T
Layer multiple visual elements              | Leave large empty areas
Use rich, saturated color clashes           | Play it safe with neutral tones
Mix patterns and textures                   | Keep surfaces plain
Make typography decorative and expressive   | Use plain, neutral fonts
Let elements bleed and overlap              | Keep everything neatly separated
Use varied scales for visual interest       | Make all elements the same size
Key prompt words: "layered, abundant, ornate, richly detailed, patternonpattern, vibrant, dense, baroque, lush"
 Vintage / Retro
The Look: Aged, nostalgic, eraspecific. Feels like it came from a different decade.
DO                                                        | DON'T
Specify the exact decade (1950s, 70s, 90s)                | Be vague Ã¢â‚¬â€ "vintage" means nothing without an era
Use muted, faded color palettes                           | Use neon or bright digital colors
Add grain, texture, and aging marks                       | Keep surfaces perfectly clean and flat
Use eraaccurate typography styles                        | Use modern geometric fonts
Mimic periodaccurate printing methods (letterpress, screenprint) | Add modern gradients or glows
Reference specific visual movements                       | Mix anachronistic elements
Key prompt words: "aged, faded, distressed, halftone, letterpress, worn, nostalgic, eraaccurate, period typography"
 Luxury / Premium
The Look: Refined, restrained, expensive. Every detail signals quality.
DO                                                        | DON'T
Use a tight palette Ã¢â‚¬â€ black, white, gold, or deep jewel tones | Use bright primary colors
Choose elegant serif or ultrathin sansserif fonts       | Use chunky or novelty fonts
Use generous white/dark space around everything           | Crowd elements together
Describe metallic finishes (gold foil, silver emboss)     | Use flat matte on everything
Use soft, controlled lighting                             | Use harsh or flat lighting
Show product/subject in beautiful detail                  | Keep subjects generic
Use thin elegant rules and fine lines as accents          | Use thick borders or heavy outlines
Key prompt words: "understated elegance, refined, quiet luxury, premium materials, gold foil, editorial restraint, bespoke"
 Streetwear / Urban
The Look: Bold, raw, unapologetic. Graphic, highcontrast, culturally aware.
DO                                          | DON'T
Use bold, heavy, oversized typography       | Use thin or delicate fonts
Embrace high contrast Ã¢â‚¬â€ black/white/one accent | Use pastel or muted tones
Include urban cultural references           | Use generic stock imagery aesthetics
Mix graphic illustration with photography   | Keep everything flat and predictable
Use raw, unpolished textures                | Overpolish or make it look corporate
Allow intentional imperfection              | Make everything perfectly symmetrical
Key prompt words: "bold, raw, graphic, oversized type, high contrast, gritty, authentic, cultural, rebellious"
 Corporate / Professional
The Look: Clean, trustworthy, organized. Communicates stability and credibility.
DO                                                        | DON'T
Use a structured grid layout                              | Use random or chaotic placement
Stick to 2Ã¢â‚¬â€œ3 brand colors                                 | Use too many colors
Use clean, readable sansserif fonts                      | Use decorative or hardtoread fonts
Maintain clear visual hierarchy                           | Mix too many element sizes
Use professional photography or clean illustration        | Use lowquality or amateur visuals
Include subtle brand pattern or texture                   | Leave backgrounds completely plain and boring
Key prompt words: "structured, professional, gridbased, trustworthy, clean hierarchy, brandconsistent, polished"
 Cyberpunk / Futuristic
The Look: Dark, neon, technological dystopia. Feels like the future has gone wrong in the best way.
DO                                                        | DON'T
Use dark backgrounds Ã¢â‚¬â€ nearblack, deep navy              | Use light or white backgrounds
Use neon accent colors Ã¢â‚¬â€ cyan, magenta, electric green    | Use warm or earthy tones
Add glitch effects, scan lines, and digital artifacts     | Keep surfaces clean and smooth
Use techstyle monospace or angular fonts                 | Use soft or humanist fonts
Show reflective wet surfaces, rain, city lights           | Use dry, static environments
Layer holographic and translucent elements                | Use flat, opaque surfaces only
Key prompt words: "neonlit, glitch, dark dystopian, holographic, rainslicked, scan lines, digital artifact, chromatic aberration"
 Editorial / Magazine
The Look: Sophisticated, layoutdriven. Typography and photography in conversation.
DO                                                        | DON'T
Let typography be a visual element, not just text         | Treat type as an afterthought
Use unexpected, tight crops on photography                | Use safe, conventional photo framing
Mix font weights dramatically Ã¢â‚¬â€ ultrabold with ultrathin| Use one weight throughout
Embrace asymmetry and gridbreaking                       | Keep everything centered and symmetrical
Use a refined, limited color palette                      | Use too many colors
Create tension between image and text                     | Let image and text be completely separate
Key prompt words: "typographic tension, editorial crop, gridbreaking, refined asymmetry, headlinedriven, phototext dialogue"
 Organic / NatureInspired
The Look: Earthy, handmade, alive. Feels grown rather than manufactured.
DO                                                        | DON'T
Use earth tones and natural pigment colors                | Use neon or syntheticlooking colors
Include handdrawn or botanical illustration              | Use hard geometric shapes
Use organic, irregular shapes and lines                   | Use perfect circles and rigid grids
Add paper, linen, or natural surface textures             | Use slick, polished, digital surfaces
Use handwritten or humanist serif fonts                   | Use cold, technical, rigid fonts
Reference natural forms Ã¢â‚¬â€ leaves, water, soil, wood       | Use artificial or techinspired imagery
Key prompt words: "handdrawn, botanical, earthy, organic, natural texture, artisan, imperfect, warm, handcrafted"
 9. Design Type Reference
 Posters
 Always define: format (A1/A2/A3/square), purpose (event/product/art), and the single message
 Hero element should dominate at least 40Ã¢â‚¬â€œ60% of the frame
 Include: headline, subtext, and calltoaction or essential info
 Typography is as important as imagery
 Social Media Graphics
 Define: platform and format (Instagram square, Story 9:16, LinkedIn landscape)
 Design for small screens Ã¢â‚¬â€ avoid tiny text
 One clear focal point Ã¢â‚¬â€ no complexity
 Brand colors and logo always present
 Brand Identity / Logos
 Define: industry, values, and brand personality
 Specify: wordmark only / icon only / combination mark
 Always specify: what the mark should NOT look like
 Color psychology is critical Ã¢â‚¬â€ justify your palette
 Product Packaging
 Define: product type, material, shape
 Always include: full branded label design with visible brand name, product name, flavor/variant, key claims
 Describe: label material (matte paper, glossy film, foil), printing style
 Front panel vs. side panel vs. back panel details
 Event Invitations / Flyers
 Define: event type, formality level, audience
 Essential info: name, date, time, location, RSVP/ticket info
 Visual hierarchy: event name first, then date, then supporting details
 Design should match the event's energy
 Presentations / Slides
 Define: number of slides, topic, audience
 Keep each slide to one idea
 Strong headline on every slide
 Visual elements support Ã¢â‚¬â€ never overwhelm Ã¢â‚¬â€ the message
 Merchandise (Tshirts, Mugs, Tote Bags)
 Define: product type and print area shape
 Keep designs bold and simple Ã¢â‚¬â€ detail is lost at scale
 Consider: the design looks different printed vs. on screen
 Specify: placement on garment (chest, back, sleeve)
 Book / Album Covers
 Define: genre, tone, audience
 The cover must communicate the content's feel immediately
 Typography choice is as important as the image
 Consider: how it looks as a small thumbnail
 10. The Dos & Don'ts Master List
 Universal DOs
 DO commit to a single clear aesthetic direction Ã¢â‚¬â€ Clarity of vision always beats trying to be everything
 DO name your colors specifically Ã¢â‚¬â€ Hex codes, Pantone references, or very specific descriptions
 DO describe composition in detail Ã¢â‚¬â€ Tell the AI where every major element lives
 DO define your audience clearly Ã¢â‚¬â€ Every design decision flows from who is looking at it
 DO specify the format and dimensions upfront Ã¢â‚¬â€ Before any other creative detail
 DO establish a visual hierarchy Ã¢â‚¬â€ Primary, secondary, and tertiary elements in every design
 DO include texture and finish details Ã¢â‚¬â€ This separates good designs from great ones
 DO describe the mood in 1Ã¢â‚¬â€œ3 words Ã¢â‚¬â€ It aligns all aesthetic decisions
 DO give style references Ã¢â‚¬â€ Name designers, movements, brands, or eras
 DO describe lighting deliberately Ã¢â‚¬â€ Lighting defines the entire atmosphere
 DO make text content explicit Ã¢â‚¬â€ Write out the actual words you want on the design
 DO specify what makes each element unique Ã¢â‚¬â€ Generic descriptions produce generic results
 Universal DON'Ts
 DON'T be vague about style Ã¢â‚¬â€ "modern" and "nice" mean nothing
 DON'T ask for too many focal points Ã¢â‚¬â€ One hero element per design
 DON'T mix incompatible aesthetics Ã¢â‚¬â€ Vintage + cyberpunk = confusion, unless intentional
 DON'T leave color to chance Ã¢â‚¬â€ "Use good colors" produces random results
 DON'T forget the text content Ã¢â‚¬â€ Specify every word, headline, and piece of copy
 DON'T ignore the format Ã¢â‚¬â€ A square design prompts differently from a vertical one
 DON'T use conflicting mood words Ã¢â‚¬â€ "Calm and aggressive" cancel each other out
 DON'T skip the audience Ã¢â‚¬â€ Age, lifestyle, and taste shape every decision
 DON'T ask for too many design styles at once Ã¢â‚¬â€ Pick one and commit
 DON'T describe what you don't want without saying what you do want Ã¢â‚¬â€ Always lead with the positive
 11. Prompt Templates by Design Type
 Template: Product Advertisement Poster
[Orientation + Format] commercial [product type] advertisement poster featuring
[exact product name and description] targeting [audience description].
PRODUCT DESIGN: [Describe the branded product in detail Ã¢â‚¬â€ label, colors, logo placement,
material, any text on the product itself.]
COMPOSITION: [Where is the product? What anchors the top? Bottom? How does the eye move?]
VISUAL EFFECTS: [Lighting, particles, atmosphere, background behavior]
COLOR PALETTE: [Name 3Ã¢â‚¬â€œ4 specific colors with hex if possible]
TYPOGRAPHY: [Font style, weight, case, hierarchy Ã¢â‚¬â€ list all text that should appear]
MOOD: [2Ã¢â‚¬â€œ3 mood words]
STYLE REFERENCES: [Name brands, designers, or movements to reference]
FINISH: [Texture, grain, matte/glossy, any special effects]
 Template: Social Media Graphic
[Platform]optimized [dimension: e.g., 1080x1080px square] social media graphic
for [brand/purpose]. Audience: [audience description].
The central message is: "[Exact headline text]"
Supporting text: "[Tagline or caption text]"
LAYOUT: [Single focal point? Textheavy? Imageled?]
COLOR PALETTE: [3 colors max for social Ã¢â‚¬â€ list them]
STYLE: [One aesthetic direction]
BRAND ELEMENTS: [Logo placement, brand colors, any recurring brand motifs]
MOOD: [1Ã¢â‚¬â€œ2 words]
 Template: Brand Logo / Identity
[Wordmark / Icon / Combination mark] logo for a brand called "[Brand Name]"
operating in the [industry] space. The brand personality is [3 personality traits].
The target customer is [audience].
The logo should feel: [aesthetic direction]
The logo should NOT feel: [what to avoid]
STYLE: [Describe visual approach Ã¢â‚¬â€ geometric, handdrawn, typographic, symbolic, etc.]
COLOR PALETTE: [1Ã¢â‚¬â€œ3 brand colors with reasoning]
TYPOGRAPHY (if wordmark): [Font style and characteristics]
SYMBOL (if icon): [Describe the mark concept]
FORMAT: Present on [white / black / colored] background
 Template: Event Flyer
[Orientation + Format] event flyer for [event name], a [event type Ã¢â‚¬â€ concert, exhibition,
conference, party, etc.] targeting [audience].
EVENT DETAILS TO INCLUDE:
 Event Name: [Name]
 Date: [Date]
 Time: [Time]
 Location: [Venue, City]
 Ticket / RSVP info: [Link or info]
 Any additional text: [Performers, speakers, sponsors, etc.]
STYLE: [Aesthetic direction that matches the event energy]
COMPOSITION: [How is information prioritized and laid out?]
COLOR PALETTE: [Specific colors]
TYPOGRAPHY: [Font styles for headline vs. info vs. supporting text]
VISUAL ELEMENTS: [Illustration, photography, pattern, abstract Ã¢â‚¬â€ describe what accompanies the text]
MOOD: [Match the event's energy Ã¢â‚¬â€ e.g., "electric and euphoric" for a rave, "warm and intimate" for a jazz evening]
 Template: Product Packaging
[Product type] packaging design for a product called "[Product Name]" by brand "[Brand Name]".
Product variant / flavor: [Variant]. Target market: [Audience].
PACKAGE FORMAT: [Can / Bottle / Box / Sachet / Tube / Pouch Ã¢â‚¬â€ include dimensions if known]
LABEL MATERIAL: [Matte paper / Glossy film / Metallic foil / Embossed]
FRONT PANEL Ã¢â‚¬â€ must include:
 Brand logo: [Description of logo style]
 Product name: [Exact name]
 Variant/flavor: [Exact variant name]
 Hero visual: [Describe the central graphic or image]
 Key claim: [e.g., "Zero Sugar | 200mg Caffeine | Natural Flavors"]
BACK PANEL Ã¢â‚¬â€ must include:
 Nutritional/ingredient information
 Barcode
 Brand story or descriptor text: "[Text]"
COLOR PALETTE: [Specific colors Ã¢â‚¬â€ base, accent, text]
TYPOGRAPHY: [Font styles for logo vs. product name vs. claims vs. info]
FINISH: [Matte / Glossy / Spot gloss / Emboss / Foil stamp Ã¢â‚¬â€ describe specifically]
MOOD: [Premium? Energetic? Organic? Playful?]
STYLE REFERENCE: [Name competitor brands or design movements to reference]
 12. Power Words & Vocabulary Bank
Use these words in your prompts to signal quality and intentionality to the AI.
 Composition Words
cinematic framing, rule of thirds, dynamic diagonal, asymmetric balance, negative space, fullbleed, foregroundmidgroundbackground depth, overlapping layers, radiating composition, offcenter tension, bleeding off the edge, dramatic crop, god'seye view, worm'seye view, Dutch angle
 Lighting Words
volumetric light, god rays, rim lighting, chiaroscuro, diffused ambient, hard directional, backlit silhouette, neon glow, studio product lighting, golden hour warmth, cold blue moonlight, dramatic shadow play, lens flare, light leak, caustic light patterns
 Texture Words
fine grain overlay, halftone dot pattern, risograph print texture, linen paper, aged and distressed, holographic foil, metallic sheen, matte surface, embossed relief, screenprinted texture, letterpress impression, ink bleed, worn edges, noise texture
 Mood Words
electric, euphoric, brooding, contemplative, rebellious, serene, commanding, whimsical, nostalgic, gritty, ethereal, raw, refined, playful, austere, decadent, intimate, bold, restrained, kinetic
 Quality Signals
photorealistic, hyperdetailed, productionready, printquality resolution, professionally designed, awardwinning design aesthetic, typographically sophisticated, intentional, cohesive, meticulously crafted, premium finish, visually distinctive
 Style Reference Words
Bauhaus, Swiss International Style, Art Nouveau, Art Deco, Memphis design, De Stijl, constructivist, brutalist, vaporwave, Y2K, skeuomorphic, flat design, material design, neubrutalism, cottagecore, dark academia, quiet luxury
--- END OF GUIDE ---

Instructions:
- Follow the Universal Formula: [FORMAT + ORIENTATION] + [DESIGN TYPE] + [SUBJECT/CONTENT] + [STYLE/AESTHETIC] + [COMPOSITION] + [COLOR PALETTE] + [TYPOGRAPHY] + [LIGHTING] + [TEXTURE/FINISH] + [MOOD] + [AUDIENCE].
- Ensure all 7 Pillars are addressed where relevant: Intent & Purpose, Audience, Format & Dimensions, Style/Aesthetic, Composition, Color Palette, Mood.
- Be specific: name colors, describe composition, specify typography and lighting.
- Return only the refined promptÃ¢â‚¬â€nothing else.`;

    const formatInfo =
      aspectRatio || outputFormat || resolution
        ? `\n\nCurrent format settings: ${[aspectRatio, outputFormat, resolution].filter(Boolean).join(", ")}. Incorporate format/dimensions in the prompt.`
        : "";

    const visualCreativeBlock =
      generationMode === "visual-creative" &&
      (style || composition || colorPalette || colorMood || primaryColor || secondaryColor || accentColor || typography || lighting || texture || mood || audience || intent)
        ? `

Selected refinement options (incorporate these into the prompt):
${style ? `- Style / Aesthetic: ${style}` : ""}
${composition ? `- Composition: ${composition}` : ""}
${colorPalette ? `- Color palette: ${colorPalette}` : ""}
${colorMood ? `- Color mood: ${colorMood}` : ""}
${primaryColor ? `- Primary color (hex): ${primaryColor}` : ""}
${secondaryColor ? `- Secondary color (hex): ${secondaryColor}` : ""}
${accentColor ? `- Accent color (hex): ${accentColor}` : ""}
${typography ? `- Typography: ${typography}` : ""}
${lighting ? `- Lighting: ${lighting}` : ""}
${texture ? `- Texture / Finish: ${texture}` : ""}
${mood ? `- Mood: ${mood}` : ""}
${audience ? `- Audience: ${audience}` : ""}
${intent ? `- Intent / Purpose: ${intent}` : ""}`
        : "";

    const userMessage = `Produce a single, HIGHLY DETAILED, comprehensive image prompt based on the following. Use the Master AI Design Prompt Guide (Universal Formula and 7 Pillars).

Requirements:
- Be REALLY DETAILED and expansive. Long-form, multiple paragraphs or a long structured block. The more specific and complete the prompt, the better the image output.
- Structure with clear sections (e.g. HERO VISUAL CONCEPT, COMPOSITION, COLOR PALETTE with hex codes, TYPOGRAPHY, MOOD, AUDIENCE, ENVIRONMENT & BACKGROUND, VISUAL EFFECTS, TEXT CONTENT, FINISH, STYLE REFERENCES) as appropriate for the design type.
- Use logic to ADD context and details the user did not explicitly mention but that will improve the result: infer atmosphere, technical quality (e.g. photorealistic, cinematic), lighting specifics, materials, environmental details, and any other creative direction that fits the intent and the 7 Pillars. Think like an art director completing the brief.
- Output plain text only Ã¢â‚¬â€ no markdown symbols (no **, *, #, backticks, __).

User's current prompt or idea:
"""
${prompt || "(User did not enter text Ã¢â‚¬â€ build a full detailed prompt from the selected options and format below.)"}
"""${formatInfo}${visualCreativeBlock}

Output ONLY the refined prompt Ã¢â‚¬â€ no other text, no introduction.`;

    const replicateOutput = await replicate.run("anthropic/claude-opus-4.6" as `${string}/${string}`, {
      input: {
        // Combine system and user content into a single prompt, since we're outside a chat API
        prompt: `${systemPrompt}\n\n${userMessage}`,
        max_output_tokens: 1024,
        temperature: 0.65,
      },
    });

    const refinedPrompt = extractTextFromReplicateOutput(replicateOutput).trim();
    if (!refinedPrompt) {
      return Response.json(
        { success: false, error: "Refinement produced empty prompt" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      refinedPrompt,
    });
  } catch (err) {
    console.error("Refine image prompt error:", err);
    const message = err instanceof Error ? err.message : "Failed to refine prompt";
    return Response.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
