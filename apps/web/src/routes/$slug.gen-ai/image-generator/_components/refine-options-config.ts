/**
 * Refine options for Visual & creative design mode.
 * Options aligned with docs/master-ai-design-prompt-guide.md (7 pillars + formula).
 */

/** Sentinel for "Not specified" — Radix Select does not allow value="". */
export const REFINE_OPTION_NONE = "__none__";

export const STYLE_OPTIONS: { value: string; label: string }[] = [
  { value: REFINE_OPTION_NONE, label: "Not specified" },
  { value: "Minimalism", label: "Minimalism" },
  { value: "Maximalism", label: "Maximalism" },
  { value: "Vintage / Retro", label: "Vintage / Retro" },
  { value: "Luxury / Premium", label: "Luxury / Premium" },
  { value: "Streetwear / Urban", label: "Streetwear / Urban" },
  { value: "Corporate / Professional", label: "Corporate / Professional" },
  { value: "Cyberpunk / Futuristic", label: "Cyberpunk / Futuristic" },
  { value: "Editorial / Magazine", label: "Editorial / Magazine" },
  { value: "Organic / Nature-Inspired", label: "Organic / Nature-Inspired" },
];

export const COMPOSITION_OPTIONS: { value: string; label: string }[] = [
  { value: REFINE_OPTION_NONE, label: "Not specified" },
  { value: "Centered / Symmetrical", label: "Centered / Symmetrical" },
  { value: "Rule of Thirds", label: "Rule of Thirds" },
  { value: "Z-Pattern Layout", label: "Z-Pattern Layout" },
  { value: "F-Pattern Layout", label: "F-Pattern Layout" },
  { value: "Diagonal / Dynamic Flow", label: "Diagonal / Dynamic Flow" },
  { value: "Asymmetrical / Off-Center", label: "Asymmetrical / Off-Center" },
  { value: "Overlapping / Layered", label: "Overlapping / Layered" },
];

export const COLOR_PALETTE_OPTIONS: { value: string; label: string }[] = [
  { value: REFINE_OPTION_NONE, label: "Not specified" },
  { value: "Monochromatic", label: "Monochromatic" },
  { value: "Complementary", label: "Complementary" },
  { value: "Analogous", label: "Analogous" },
  { value: "Triadic", label: "Triadic" },
  { value: "Split-Complementary", label: "Split-Complementary" },
  { value: "Neutral + One Bold Accent", label: "Neutral + One Bold Accent" },
];

export const COLOR_MOOD_OPTIONS: { value: string; label: string }[] = [
  { value: REFINE_OPTION_NONE, label: "Not specified" },
  { value: "Energy / Power", label: "Energy / Power" },
  { value: "Luxury / Premium", label: "Luxury / Premium" },
  { value: "Health / Nature", label: "Health / Nature" },
  { value: "Technology", label: "Technology" },
  { value: "Playful / Fun", label: "Playful / Fun" },
  { value: "Calm / Wellness", label: "Calm / Wellness" },
  { value: "Romance", label: "Romance" },
  { value: "Urgency / Warning", label: "Urgency / Warning" },
  { value: "Trust / Corporate", label: "Trust / Corporate" },
  { value: "Creativity / Art", label: "Creativity / Art" },
];

export const TYPOGRAPHY_OPTIONS: { value: string; label: string }[] = [
  { value: REFINE_OPTION_NONE, label: "Not specified" },
  { value: "Serif", label: "Serif" },
  { value: "Sans-Serif", label: "Sans-Serif" },
  { value: "Display / Decorative", label: "Display / Decorative" },
  { value: "Monospace", label: "Monospace" },
  { value: "Script / Handwritten", label: "Script / Handwritten" },
  { value: "Condensed / Compressed", label: "Condensed / Compressed" },
  { value: "Wide / Expanded", label: "Wide / Expanded" },
];

export const LIGHTING_OPTIONS: { value: string; label: string }[] = [
  { value: REFINE_OPTION_NONE, label: "Not specified" },
  { value: "Soft / Diffused", label: "Soft / Diffused" },
  { value: "Dramatic / Directional", label: "Dramatic / Directional" },
  { value: "Backlit / Rim Light", label: "Backlit / Rim Light" },
  { value: "God Rays / Volumetric", label: "God Rays / Volumetric" },
  { value: "Neon / Artificial", label: "Neon / Artificial" },
  { value: "Natural / Golden Hour", label: "Natural / Golden Hour" },
  { value: "Studio / Product", label: "Studio / Product" },
];

export const TEXTURE_OPTIONS: { value: string; label: string }[] = [
  { value: REFINE_OPTION_NONE, label: "Not specified" },
  { value: "Matte", label: "Matte" },
  { value: "Glossy", label: "Glossy" },
  { value: "Metallic", label: "Metallic" },
  { value: "Grain / Film", label: "Grain / Film" },
  { value: "Risograph", label: "Risograph" },
  { value: "Halftone", label: "Halftone" },
  { value: "Distressed", label: "Distressed" },
  { value: "Embossed", label: "Embossed" },
  { value: "Holographic", label: "Holographic" },
  { value: "Linen / Paper", label: "Linen / Paper" },
];

export const MOOD_PRESETS: { value: string; label: string }[] = [
  { value: REFINE_OPTION_NONE, label: "Not specified" },
  { value: "Energetic and rebellious", label: "Energetic and rebellious" },
  { value: "Calm and meditative", label: "Calm and meditative" },
  { value: "Playful and curious", label: "Playful and curious" },
  { value: "Powerful and intimidating", label: "Powerful and intimidating" },
  { value: "Quiet luxury and confidence", label: "Quiet luxury and confidence" },
  { value: "Electric and euphoric", label: "Electric and euphoric" },
  { value: "Warm and intimate", label: "Warm and intimate" },
  { value: "Raw and authentic", label: "Raw and authentic" },
  { value: "Refined and austere", label: "Refined and austere" },
];

/** Guide: "Name specific colors or provide hex codes" — Primary, Secondary, Accent (e.g. "single bold accent"). */
export const COLOR_ROLE_LABELS = {
  primary: "Primary color",
  secondary: "Secondary color",
  accent: "Accent color",
} as const;

export interface VisualCreativeRefineValues {
  style: string;
  composition: string;
  colorPalette: string;
  colorMood: string;
  /** Hex for primary (main/dominant) color */
  primaryColor: string;
  /** Hex for secondary (supporting/background) color */
  secondaryColor: string;
  /** Hex for accent (single bold accent) color */
  accentColor: string;
  typography: string;
  lighting: string;
  texture: string;
  mood: string;
  audience: string;
  intent: string;
}

export const DEFAULT_REFINE_VALUES: VisualCreativeRefineValues = {
  style: REFINE_OPTION_NONE,
  composition: REFINE_OPTION_NONE,
  colorPalette: REFINE_OPTION_NONE,
  colorMood: REFINE_OPTION_NONE,
  primaryColor: "",
  secondaryColor: "",
  accentColor: "",
  typography: REFINE_OPTION_NONE,
  lighting: REFINE_OPTION_NONE,
  texture: REFINE_OPTION_NONE,
  mood: REFINE_OPTION_NONE,
  audience: "",
  intent: "",
};
