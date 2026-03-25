"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, CircleHelp } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { VisualCreativeRefineValues } from "./refine-options-config";
import {
  STYLE_OPTIONS,
  COMPOSITION_OPTIONS,
  COLOR_PALETTE_OPTIONS,
  COLOR_MOOD_OPTIONS,
  COLOR_ROLE_LABELS,
  TYPOGRAPHY_OPTIONS,
  LIGHTING_OPTIONS,
  TEXTURE_OPTIONS,
  MOOD_PRESETS,
} from "./refine-options-config";

const COMPOSITION_TOOLTIP = `Where elements sit and how the eye moves. Affects layout and balance.

Centered / Symmetrical: Everything aligns to the center. Safe, balanced. Good for logos, badges, formal invites.

Rule of Thirds: 3Ãƒâ€”3 grid; place key subjects at intersections. Good for photos, editorial, social.

Z-Pattern: Eye moves top-left Ã¢â€ â€™ top-right Ã¢â€ â€™ bottom-left Ã¢â€ â€™ bottom-right. Good for pages with visuals and text.

F-Pattern: Eye scans across the top then down. Good for text-heavy layouts (newsletters, menus).

Diagonal / Dynamic: Elements along a diagonal for motion and energy. Good for sports, action campaigns.

Asymmetrical / Off-Center: Subject to one side, negative space on the other. Modern, tense. Good for editorial, luxury.

Overlapping / Layered: Elements overlap for depth. Good for collage, fashion, cultural posters.`;

const STYLE_TOOLTIP = `The overall look. Shapes the whole visual feel of the design.

Minimalism: Clean space, one or two colors, strong typography. Restrained, refined. Good for luxury, editorial.

Maximalism: Dense, layered, abundant. Pattern, color, detail. Good for bold campaigns, cultural brands.

Vintage / Retro: Aged, nostalgic, era-specific. Specify decade (50s, 70s, 90s). Grain, faded colors. Good for nostalgia, period pieces.

Luxury / Premium: Refined, expensive. Black, white, gold, jewel tones. Elegant serif or thin sans. Good for high-end, bespoke.

Streetwear / Urban: Bold, raw, high-contrast. Oversized type, black/white + one accent. Good for youth, culture, rebellion.

Corporate / Professional: Clean, trustworthy, grid-based. 2Ã¢â‚¬â€œ3 colors, readable sans-serif. Good for business, stability.

Cyberpunk / Futuristic: Dark, neon, tech dystopia. Cyan, magenta, green. Glitch, scan lines. Good for tech, gaming, sci-fi.

Editorial / Magazine: Typography as visual element. Bold + thin mix, asymmetry. Good for magazines, headlines.

Organic / Nature-Inspired: Earthy, handmade. Earth tones, botanical, paper texture. Good for wellness, artisan, natural.`;

const COLOR_PALETTE_TOOLTIP = `How colors work together. Guides color harmony in the design.

Monochromatic: One hue in many shades. Unified, elegant. Good for minimal, premium.

Complementary: Two colors opposite on the wheel. High contrast, punchy. Good for energy, impact.

Analogous: Colors next to each other on the wheel. Harmonious, soothing. Good for calm, cohesive.

Triadic: Three evenly spaced colors. Vibrant but balanced. Good for bold, playful.

Split-Complementary: One base + two near its complement. Sophisticated. Good for refined contrast.

Neutral + One Bold Accent: Charcoal, white, etc. plus one pop color. Safe for premium. Good for focus, clarity.`;

const COLOR_MOOD_TOOLTIP = `The feeling colors should give. Steers which colors are used.

Energy / Power: Neon yellow, electric blue, hot red, black.

Luxury / Premium: Deep black, gold, ivory, burgundy.

Health / Nature: Forest green, earth tones, terracotta, cream.

Technology: Electric blue, silver, white, dark grey.

Playful / Fun: Bright primaries, pastels, rainbow.

Calm / Wellness: Soft sage, dusty blue, lavender, warm white.

Romance: Blush pink, rose gold, deep burgundy, soft cream.

Urgency / Warning: Red, orange, black, white.

Trust / Corporate: Navy blue, white, silver, mid-grey.

Creativity / Art: Deep jewel tones, unexpected color clashes.`;

const PRIMARY_COLOR_TOOLTIP = `Main color in the design. Used for key elements and dominant areas. Pick a hex or use the swatch. The refined prompt will use this as the primary brand or dominant color.`;

const SECONDARY_COLOR_TOOLTIP = `Supporting color. Often used for backgrounds or secondary elements. Complements the primary and fills the layout.`;

const ACCENT_COLOR_TOOLTIP = `One bold pop color for highlights. Draws the eye to CTAs, badges, or key details. "Neutral + one accent" is a strong premium approach.`;

const TYPOGRAPHY_TOOLTIP = `Font style. Affects how text looks and feels in the design.

Serif: Small strokes on letters. Classic, trustworthy. Good for luxury, editorial, books.

Sans-Serif: Clean, no strokes. Modern, minimal. Good for tech, corporate, sports.

Display / Decorative: Expressive, unique. Good for headlines only, posters, logos.

Monospace: Fixed-width, code-like. Good for tech, gaming, cyberpunk.

Script / Handwritten: Flowing, human. Good for weddings, artisan, beauty.

Condensed / Compressed: Narrow letters. Powerful when large. Good for sports, headlines.

Wide / Expanded: Stretched horizontally. Spacious, commanding. Good for luxury, architecture.`;

const LIGHTING_TOOLTIP = `How light hits the scene. Adds depth, drama, or softness.

Soft / Diffused: No harsh shadows. Even, clean. Good for product, wellness, corporate.

Dramatic / Directional: Strong single source, deep shadows. Good for luxury, cinema, perfume.

Backlit / Rim Light: Light behind subject, glowing edge. Good for tech, gaming, sci-fi.

God Rays / Volumetric: Shafts of light through atmosphere. Good for epic, cinematic, adventure.

Neon / Artificial: Colored light, colored shadows. Good for nightlife, streetwear, cyberpunk.

Natural / Golden Hour: Warm, low sun. Nostalgic, organic. Good for food, travel, lifestyle.

Studio / Product: Controlled, clinical. Every detail visible. Good for e-commerce, tech hardware.`;

const TEXTURE_TOOLTIP = `Surface feel. Adds tactility and polish to the design.

Matte: No shine, flat, refined. Good for luxury, minimalism, editorial.

Glossy: Reflective, high-shine. Good for products, tech, beauty.

Metallic: Metallic sheen. Good for premium, awards, fashion.

Grain / Film: Fine noise overlay. Good for vintage, indie, editorial.

Risograph: Layered ink, slight misregistration. Good for art prints, indie.

Halftone: Dot pattern. Good for retro, comic, screen print.

Distressed: Worn, aged, cracked. Good for vintage, streetwear, music.

Embossed: Raised surface illusion. Good for certificates, luxury packaging.

Holographic: Iridescent rainbow shift. Good for beauty, Gen Z, premium events.

Linen / Paper: Organic paper texture. Good for editorial, organic brands.`;

const MOOD_TOOLTIP = `Emotional feel of the design. One or two words that set the tone.

Energetic and rebellious: Bold, defiant, high energy.

Calm and meditative: Peaceful, reflective, still.

Playful and curious: Fun, light, exploratory.

Powerful and intimidating: Strong, commanding, serious.

Quiet luxury and confidence: Understated, assured, refined.

Electric and euphoric: High energy, celebratory, bright.

Warm and intimate: Close, personal, inviting.

Raw and authentic: Unpolished, honest, real.

Refined and austere: Minimal, strict, elegant.`;

const AUDIENCE_TOOLTIP = `Who the design is for. Age, lifestyle, and context shape every design choice.

Examples: "Gen Z streetwear enthusiasts", "C-suite executives", "parents of children 3Ã¢â‚¬â€œ7". Be specific so the refined prompt can target the right look and message.`;

const INTENT_TOOLTIP = `Why the design exists. Guides the message and visual strategy.

Examples: "Promotional poster to drive event attendance", "Brand card to communicate trust", "Social graphic to stop the scroll". Sell, inform, inspire, or celebrate.`;

interface RefineOptionsProps {
  values: VisualCreativeRefineValues;
  onChange: (values: VisualCreativeRefineValues) => void;
  disabled?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export function RefineOptions({
  values,
  onChange,
  disabled = false,
  defaultOpen = true,
  className,
}: RefineOptionsProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  const update = (key: keyof VisualCreativeRefineValues, value: string) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "rounded-lg bg-black/5 dark:bg-white/5 border border-transparent dark:border-white/10",
        className
      )}
    >
      <CollapsibleTrigger
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium transition-colors",
          "hover:bg-black/10 dark:hover:bg-white/10 rounded-t-lg",
          !open && "rounded-b-lg",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span>Refine options (7 pillars)</span>
        {open ? (
          <ChevronUp className="h-4 w-4 opacity-70" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-70" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-1 gap-3 p-3 pt-1 sm:grid-cols-2">
          <SelectField
            label="Style / Aesthetic"
            tooltip={STYLE_TOOLTIP}
            value={values.style}
            onValueChange={(v) => update("style", v)}
            options={STYLE_OPTIONS}
            disabled={disabled}
          />
          <SelectField
            label="Composition"
            tooltip={COMPOSITION_TOOLTIP}
            value={values.composition}
            onValueChange={(v) => update("composition", v)}
            options={COMPOSITION_OPTIONS}
            disabled={disabled}
          />
          <SelectField
            label="Color palette"
            tooltip={COLOR_PALETTE_TOOLTIP}
            value={values.colorPalette}
            onValueChange={(v) => update("colorPalette", v)}
            options={COLOR_PALETTE_OPTIONS}
            disabled={disabled}
          />
          <SelectField
            label="Color mood"
            tooltip={COLOR_MOOD_TOOLTIP}
            value={values.colorMood}
            onValueChange={(v) => update("colorMood", v)}
            options={COLOR_MOOD_OPTIONS}
            disabled={disabled}
          />
          <ColorPickerField
            label={COLOR_ROLE_LABELS.primary}
            tooltip={PRIMARY_COLOR_TOOLTIP}
            value={values.primaryColor}
            onChange={(v) => update("primaryColor", v)}
            disabled={disabled}
          />
          <ColorPickerField
            label={COLOR_ROLE_LABELS.secondary}
            tooltip={SECONDARY_COLOR_TOOLTIP}
            value={values.secondaryColor}
            onChange={(v) => update("secondaryColor", v)}
            disabled={disabled}
          />
          <ColorPickerField
            label={COLOR_ROLE_LABELS.accent}
            tooltip={ACCENT_COLOR_TOOLTIP}
            value={values.accentColor}
            onChange={(v) => update("accentColor", v)}
            disabled={disabled}
          />
          <SelectField
            label="Typography"
            tooltip={TYPOGRAPHY_TOOLTIP}
            value={values.typography}
            onValueChange={(v) => update("typography", v)}
            options={TYPOGRAPHY_OPTIONS}
            disabled={disabled}
          />
          <SelectField
            label="Lighting"
            tooltip={LIGHTING_TOOLTIP}
            value={values.lighting}
            onValueChange={(v) => update("lighting", v)}
            options={LIGHTING_OPTIONS}
            disabled={disabled}
          />
          <SelectField
            label="Texture / Finish"
            tooltip={TEXTURE_TOOLTIP}
            value={values.texture}
            onValueChange={(v) => update("texture", v)}
            options={TEXTURE_OPTIONS}
            disabled={disabled}
          />
          <SelectField
            label="Mood"
            tooltip={MOOD_TOOLTIP}
            value={values.mood}
            onValueChange={(v) => update("mood", v)}
            options={MOOD_PRESETS}
            disabled={disabled}
          />
          <div className="sm:col-span-2 space-y-1">
            <LabelWithTooltip
              label="Audience"
              tooltip={AUDIENCE_TOOLTIP}
            />
            <Input
              placeholder="e.g. Gen Z streetwear enthusiasts"
              value={values.audience}
              onChange={(e) => update("audience", e.target.value)}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <LabelWithTooltip
              label="Intent / Purpose"
              tooltip={INTENT_TOOLTIP}
            />
            <Input
              placeholder="e.g. Promotional poster to drive event attendance"
              value={values.intent}
              onChange={(e) => update("intent", e.target.value)}
              disabled={disabled}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function LabelWithTooltip({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex cursor-help text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label={`Help for ${label}`}
          >
            <CircleHelp className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="w-56 max-h-52 overflow-hidden p-0"
        >
          <ScrollArea className="h-48 w-full">
            <p className="whitespace-pre-line px-3 py-2 text-xs">
              {tooltip}
            </p>
          </ScrollArea>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function SelectField({
  label,
  tooltip,
  value,
  onValueChange,
  options,
  disabled,
}: {
  label: string;
  tooltip?: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const selectValue = value || options[0]?.value;
  const labelEl = tooltip ? (
    <LabelWithTooltip label={label} tooltip={tooltip} />
  ) : (
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
  );
  return (
    <div className="space-y-1">
      {labelEl}
      <Select
        value={selectValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 w-full text-sm" size="sm">
          <SelectValue placeholder="Not specified" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const HEX_REGEX = /^#([0-9A-Fa-f]{3}){1,2}$/;

function ColorPickerField({
  label,
  tooltip,
  value,
  onChange,
  disabled,
}: {
  label: string;
  tooltip?: string;
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  const hex = value.trim();
  const isValidHex = HEX_REGEX.test(hex);
  const swatchValue = isValidHex ? hex : "#9ca3af";

  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v) onChange(v);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.trim();
    if (v === "") {
      onChange("");
      return;
    }
    if (v.startsWith("#") && HEX_REGEX.test(v)) onChange(v);
    else if (/^[0-9A-Fa-f]{3,6}$/.test(v)) onChange(`#${v}`);
  };

  const labelEl = tooltip ? (
    <LabelWithTooltip label={label} tooltip={tooltip} />
  ) : (
    <label className="text-xs font-medium text-muted-foreground">{label}</label>
  );

  return (
    <div className="space-y-1">
      {labelEl}
      <div className="flex h-8 items-center gap-2">
        <input
          type="color"
          value={swatchValue}
          onChange={handleColorInput}
          disabled={disabled}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:rounded"
          aria-label={label}
        />
        <Input
          placeholder="#000000"
          value={hex}
          onChange={handleHexInput}
          disabled={disabled}
          className="h-8 flex-1 font-mono text-xs"
        />
      </div>
    </div>
  );
}
