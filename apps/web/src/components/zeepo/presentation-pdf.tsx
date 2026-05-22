/**
 * Zeepo Presentation → PDF renderer.
 * Renders each slide as a landscape A4/widescreen page using @react-pdf/renderer.
 * Supports: title, content, bullets, image-full, two-column, quote, section-break layouts.
 * Background images with text overlay are fully supported.
 */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

export type PresentationTheme = "dark" | "light" | "branded" | "minimal";

export type PresentationSlide = {
  layout:
    | "title" | "content" | "bullets" | "image-full" | "two-column"
    | "quote" | "section-break" | "stats" | "chart" | "timeline" | "big-number";
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  leftContent?: string;
  rightContent?: string;
  imageUrl?: string;
  imagePosition?: "background" | "right" | "left";
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  notes?: string;
  stats?: Array<{ value: string; label: string; delta?: string; icon?: string }>;
  chartData?: {
    type: "bar" | "donut";
    labels: string[];
    values: number[];
    colors?: string[];
    unit?: string;
  };
  timeline?: Array<{ date: string; event: string; detail?: string }>;
};

export type PresentationData = {
  title: string;
  theme: PresentationTheme;
  slides: PresentationSlide[];
};

// ─── Theme palettes ────────────────────────────────────────────────────────────

type Palette = {
  bg: string;
  text: string;
  textMuted: string;
  accent: string;
  bulletDot: string;
  divider: string;
  overlayBg: string; // semi-transparent bg for image overlays
};

const THEMES: Record<PresentationTheme, Palette> = {
  dark: {
    bg: "#0d1117",
    text: "#f0f4ff",
    textMuted: "#8b98b0",
    accent: "#4f8ef7",
    bulletDot: "#4f8ef7",
    divider: "#1e2840",
    overlayBg: "rgba(10,15,30,0.72)",
  },
  light: {
    bg: "#ffffff",
    text: "#111827",
    textMuted: "#6b7280",
    accent: "#2563eb",
    bulletDot: "#2563eb",
    divider: "#e5e7eb",
    overlayBg: "rgba(255,255,255,0.80)",
  },
  branded: {
    bg: "#1e1b4b",
    text: "#ffffff",
    textMuted: "#a5b4fc",
    accent: "#818cf8",
    bulletDot: "#818cf8",
    divider: "#312e81",
    overlayBg: "rgba(30,27,75,0.76)",
  },
  minimal: {
    bg: "#ffffff",
    text: "#000000",
    textMuted: "#555555",
    accent: "#111111",
    bulletDot: "#111111",
    divider: "#dddddd",
    overlayBg: "rgba(255,255,255,0.84)",
  },
};

// Slide dimensions (16:9 widescreen, in pt — 960×540 scaled to A4 landscape for react-pdf)
const W = 841.89; // A4 landscape width in pt
const H = 595.28; // A4 landscape height in pt

const PADDING = 44;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveColor(override: string | undefined, fallback: string): string {
  return override ?? fallback;
}

/**
 * Strip inline markdown markers (**bold**, *italic*) and convert any literal
 * backslash-n sequences (\\n stored as two chars) to real newlines so that
 * react-pdf renders line breaks correctly.
 */
function normText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\\n/g, "\n");
}

/** Compute readable text colour from a hex background. */
function autoFg(hex: string): string {
  try {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.45 ? "#0f172a" : "#f8fafc";
  } catch { return "#f8fafc"; }
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function AccentBar({ color, width = 40 }: { color: string; width?: number }) {
  return (
    <View
      style={{
        width,
        height: 3,
        backgroundColor: color,
        borderRadius: 2,
        marginBottom: 12,
      }}
    />
  );
}

function SlideBullets({ items, color, accent }: { items: string[]; color: string; accent: string }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent, marginTop: 5, flexShrink: 0 }} />
          <Text style={{ fontSize: 13, color, lineHeight: 1.55, flex: 1 }}>{normText(item)}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Layout renderers ─────────────────────────────────────────────────────────

function TitleSlide({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  const bg = resolveColor(slide.bgColor, p.bg);
  const fg = resolveColor(slide.textColor, slide.bgColor ? autoFg(slide.bgColor) : p.text);
  const accent = resolveColor(slide.accentColor, p.accent);
  const hasImage = slide.imageUrl && slide.imagePosition === "background";

  return (
    <View style={{ width: W, height: H, backgroundColor: bg, position: "relative" }}>
      {/* Background image */}
      {hasImage && (
        <Image
          src={slide.imageUrl!}
          style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }}
        />
      )}
      {/* Overlay for readability */}
      {hasImage && (
        <View
          style={{
            position: "absolute", top: 0, left: 0, width: W, height: H,
            backgroundColor: p.overlayBg,
          }}
        />
      )}
      {/* Content — centred */}
      <View
        style={{
          position: "absolute", top: 0, left: 0, width: W, height: H,
          alignItems: "center", justifyContent: "center",
          paddingHorizontal: PADDING * 2,
        }}
      >
        <AccentBar color={accent} width={56} />
        <Text style={{ fontSize: 38, fontFamily: "Helvetica-Bold", color: fg, textAlign: "center", lineHeight: 1.25, marginBottom: 14 }}>
          {normText(slide.title ?? "")}
        </Text>
        {slide.subtitle && (
          <Text style={{ fontSize: 17, color: slide.imageUrl ? fg : p.textMuted, textAlign: "center", lineHeight: 1.5 }}>
            {normText(slide.subtitle)}
          </Text>
        )}
      </View>
    </View>
  );
}

function ContentSlide({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  const bg = resolveColor(slide.bgColor, p.bg);
  const fg = resolveColor(slide.textColor, slide.bgColor ? autoFg(slide.bgColor) : p.text);
  const muted = p.textMuted;
  const accent = resolveColor(slide.accentColor, p.accent);
  const hasRightImage = slide.imageUrl && slide.imagePosition === "right";
  const hasLeftImage = slide.imageUrl && slide.imagePosition === "left";
  const hasBgImage = slide.imageUrl && slide.imagePosition === "background";
  const textWidth = (hasRightImage || hasLeftImage) ? W * 0.55 - PADDING : W - PADDING * 2;

  const textBlock = (
    <View style={{ width: textWidth, paddingHorizontal: PADDING, paddingVertical: PADDING }}>
      <AccentBar color={accent} />
      {slide.title && (
        <Text style={{ fontSize: 24, fontFamily: "Helvetica-Bold", color: fg, marginBottom: 12, lineHeight: 1.3 }}>
          {normText(slide.title)}
        </Text>
      )}
      {slide.body && (
        <Text style={{ fontSize: 13, color: hasBgImage ? fg : muted, lineHeight: 1.65 }}>
          {normText(slide.body)}
        </Text>
      )}
      {slide.bullets && slide.bullets.length > 0 && (
        <SlideBullets items={slide.bullets} color={hasBgImage ? fg : muted} accent={accent} />
      )}
    </View>
  );

  return (
    <View style={{ width: W, height: H, backgroundColor: bg, flexDirection: "row", position: "relative" }}>
      {hasBgImage && (
        <>
          <Image
            src={slide.imageUrl!}
            style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }}
          />
          <View
            style={{
              position: "absolute", top: 0, left: 0, width: W, height: H,
              backgroundColor: p.overlayBg,
            }}
          />
        </>
      )}
      {hasLeftImage && (
        <Image
          src={slide.imageUrl!}
          style={{ width: W * 0.45, height: H, objectFit: "cover" }}
        />
      )}
      {/* Text section */}
      <View style={{ position: hasBgImage ? "absolute" : "relative", top: 0, left: hasLeftImage ? W * 0.45 : 0, width: textWidth, height: H, justifyContent: "center" }}>
        {textBlock}
      </View>
      {hasRightImage && (
        <Image
          src={slide.imageUrl!}
          style={{ width: W * 0.45, height: H, objectFit: "cover" }}
        />
      )}
    </View>
  );
}

function BulletsSlide({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  const bg = resolveColor(slide.bgColor, p.bg);
  const fg = resolveColor(slide.textColor, slide.bgColor ? autoFg(slide.bgColor) : p.text);
  const muted = p.textMuted;
  const accent = resolveColor(slide.accentColor, p.accent);
  const hasBgImage = slide.imageUrl && slide.imagePosition === "background";
  const hasRightImage = slide.imageUrl && slide.imagePosition === "right";
  const textWidth = hasRightImage ? W * 0.55 : W - PADDING * 2;

  return (
    <View style={{ width: W, height: H, backgroundColor: bg, flexDirection: "row", position: "relative" }}>
      {hasBgImage && (
        <>
          <Image
            src={slide.imageUrl!}
            style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }}
          />
          <View
            style={{
              position: "absolute", top: 0, left: 0, width: W, height: H,
              backgroundColor: p.overlayBg,
            }}
          />
        </>
      )}
      <View
        style={{
          position: hasBgImage ? "absolute" : "relative",
          top: 0, left: 0, width: textWidth, height: H,
          paddingHorizontal: PADDING, paddingVertical: PADDING,
          justifyContent: "center",
        }}
      >
        <AccentBar color={accent} />
        {slide.title && (
          <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: fg, marginBottom: 18, lineHeight: 1.3 }}>
            {normText(slide.title)}
          </Text>
        )}
        {slide.subtitle && (
          <Text style={{ fontSize: 13, color: hasBgImage ? fg : muted, marginBottom: 14, lineHeight: 1.5 }}>
            {normText(slide.subtitle)}
          </Text>
        )}
        {slide.bullets && slide.bullets.length > 0 && (
          <SlideBullets items={slide.bullets} color={hasBgImage ? fg : muted} accent={accent} />
        )}
      </View>
      {hasRightImage && (
        <Image
          src={slide.imageUrl!}
          style={{ width: W * 0.45, height: H, objectFit: "cover" }}
        />
      )}
    </View>
  );
}

function ImageFullSlide({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  const bg = resolveColor(slide.bgColor, p.bg);
  const fg = resolveColor(slide.textColor, "#ffffff");
  const accent = resolveColor(slide.accentColor, p.accent);
  const hasText = slide.title || slide.subtitle || slide.body;

  return (
    <View style={{ width: W, height: H, backgroundColor: bg, position: "relative" }}>
      {slide.imageUrl && (
        <Image
          src={slide.imageUrl}
          style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }}
        />
      )}
      {/* Gradient overlay at bottom */}
      {hasText && slide.imageUrl && (
        <View
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            height: H * 0.52,
            backgroundColor: "rgba(0,0,0,0.62)",
          }}
        />
      )}
      {hasText && (
        <View
          style={{
            position: "absolute",
            bottom: PADDING, left: PADDING * 1.2, right: PADDING * 1.2,
          }}
        >
          <AccentBar color={accent} width={36} />
          {slide.title && (
            <Text style={{ fontSize: 28, fontFamily: "Helvetica-Bold", color: fg, lineHeight: 1.3, marginBottom: 8 }}>
              {normText(slide.title)}
            </Text>
          )}
          {slide.subtitle && (
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.84)", lineHeight: 1.5 }}>
              {normText(slide.subtitle)}
            </Text>
          )}
          {slide.body && !slide.subtitle && (
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.80)", lineHeight: 1.6 }}>
              {normText(slide.body)}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function TwoColumnSlide({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  const bg = resolveColor(slide.bgColor, p.bg);
  const fg = resolveColor(slide.textColor, slide.bgColor ? autoFg(slide.bgColor) : p.text);
  const muted = p.textMuted;
  const accent = resolveColor(slide.accentColor, p.accent);
  const colW = (W - PADDING * 2 - 24) / 2;

  return (
    <View style={{ width: W, height: H, backgroundColor: bg, paddingHorizontal: PADDING, paddingVertical: PADDING }}>
      {slide.title && (
        <>
          <AccentBar color={accent} />
          <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: fg, marginBottom: 18, lineHeight: 1.3 }}>
            {normText(slide.title)}
          </Text>
        </>
      )}
      <View style={{ flexDirection: "row", gap: 24, flex: 1 }}>
        <View style={{ width: colW, borderRight: `1pt solid ${p.divider}`, paddingRight: 16 }}>
          {slide.leftContent ? (
            <Text style={{ fontSize: 12, color: muted, lineHeight: 1.65 }}>{normText(slide.leftContent)}</Text>
          ) : null}
        </View>
        <View style={{ width: colW, paddingLeft: 8 }}>
          {slide.rightContent ? (
            <Text style={{ fontSize: 12, color: muted, lineHeight: 1.65 }}>{normText(slide.rightContent)}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function QuoteSlide({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  const bg = resolveColor(slide.bgColor, p.bg);
  const fg = resolveColor(slide.textColor, p.text);
  const accent = resolveColor(slide.accentColor, p.accent);
  const hasBgImage = slide.imageUrl && slide.imagePosition === "background";

  return (
    <View style={{ width: W, height: H, backgroundColor: bg, position: "relative" }}>
      {hasBgImage && (
        <>
          <Image
            src={slide.imageUrl!}
            style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }}
          />
          <View
            style={{
              position: "absolute", top: 0, left: 0, width: W, height: H,
              backgroundColor: p.overlayBg,
            }}
          />
        </>
      )}
      <View
        style={{
          position: "absolute", top: 0, left: 0, width: W, height: H,
          alignItems: "center", justifyContent: "center",
          paddingHorizontal: PADDING * 2.5,
        }}
      >
        {/* Large opening quote mark */}
        <Text
          style={{
            fontSize: 72,
            fontFamily: "Helvetica-Bold",
            color: accent,
            lineHeight: 0.8,
            marginBottom: 8,
            opacity: 0.7,
          }}
        >
          "
        </Text>
        <Text style={{ fontSize: 20, fontFamily: "Helvetica-Oblique", color: fg, textAlign: "center", lineHeight: 1.55, marginBottom: 18 }}>
          {normText(slide.body ?? slide.title ?? "")}
        </Text>
        {slide.subtitle && (
          <Text style={{ fontSize: 13, color: p.textMuted, textAlign: "center", fontFamily: "Helvetica-Bold" }}>
            {normText(slide.subtitle)}
          </Text>
        )}
      </View>
    </View>
  );
}

function SectionBreakSlide({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  const bg = resolveColor(slide.bgColor, p.accent);
  const fg = resolveColor(slide.textColor, "#ffffff");
  const accent2 = resolveColor(slide.accentColor, "rgba(255,255,255,0.35)");
  const hasBgImage = slide.imageUrl && slide.imagePosition === "background";

  return (
    <View style={{ width: W, height: H, backgroundColor: bg, position: "relative" }}>
      {hasBgImage && (
        <>
          <Image
            src={slide.imageUrl!}
            style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }}
          />
          <View
            style={{
              position: "absolute", top: 0, left: 0, width: W, height: H,
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          />
        </>
      )}
      <View
        style={{
          position: "absolute", top: 0, left: 0, width: W, height: H,
          alignItems: "center", justifyContent: "center",
          paddingHorizontal: PADDING * 2,
        }}
      >
        <View
          style={{
            width: 60,
            height: 2,
            backgroundColor: accent2,
            marginBottom: 18,
          }}
        />
        <Text style={{ fontSize: 30, fontFamily: "Helvetica-Bold", color: fg, textAlign: "center", lineHeight: 1.3 }}>
          {normText(slide.title ?? "")}
        </Text>
        {slide.subtitle && (
          <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
            {normText(slide.subtitle)}
          </Text>
        )}
      </View>
    </View>
  );
}

function StatsSlide({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  const bg = resolveColor(slide.bgColor, p.bg);
  const fg = resolveColor(slide.textColor, slide.bgColor ? autoFg(slide.bgColor) : p.text);
  const accent = resolveColor(slide.accentColor, p.accent);
  const items = slide.stats ?? [];
  const colW = (W - PADDING * 2 - (items.length - 1) * 12) / Math.max(items.length, 1);

  return (
    <View style={{ width: W, height: H, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: PADDING, paddingTop: PADDING, paddingBottom: PADDING / 2 }}>
        <AccentBar color={accent} />
        {slide.title && (
          <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: fg, marginBottom: 20 }}>
            {normText(slide.title)}
          </Text>
        )}
        <View style={{ flexDirection: "row", gap: 12 }}>
          {items.map((s, i) => (
            <View key={i} style={{ width: colW, borderRadius: 6, padding: 16, backgroundColor: `${accent}22`, borderWidth: 1, borderColor: `${accent}44` }}>
              {s.icon && <Text style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</Text>}
              <Text style={{ fontSize: 34, fontFamily: "Helvetica-Bold", color: accent, lineHeight: 1, marginBottom: 8 }}>{normText(s.value)}</Text>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: fg, marginBottom: 4, lineHeight: 1.3 }}>{normText(s.label)}</Text>
              {s.delta && <Text style={{ fontSize: 10, color: s.delta.startsWith("↓") || s.delta.startsWith("-") ? "#f87171" : "#34d399" }}>{s.delta}</Text>}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const CHART_PALETTE = ["#6366F1", "#22D3EE", "#F59E0B", "#10B981", "#F43F5E", "#A78BFA", "#34D399", "#FBBF24"];

function ChartSlide({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  const bg = resolveColor(slide.bgColor, p.bg);
  const fg = resolveColor(slide.textColor, slide.bgColor ? autoFg(slide.bgColor) : p.text);
  const accent = resolveColor(slide.accentColor, p.accent);
  const cd = slide.chartData;

  if (!cd) return <ContentSlide slide={slide} p={p} />;

  const isDonut = cd.type === "donut";
  const total = cd.values.reduce((a, b) => a + b, 0) || 1;
  const max = Math.max(...cd.values, 1);
  const chartW = W - PADDING * 2;
  const barH = 20;

  return (
    <View style={{ width: W, height: H, backgroundColor: bg, paddingHorizontal: PADDING, paddingVertical: PADDING }}>
      <AccentBar color={accent} />
      {slide.title && (
        <Text style={{ fontSize: 20, fontFamily: "Helvetica-Bold", color: fg, marginBottom: 6, lineHeight: 1.3 }}>
          {normText(slide.title)}
        </Text>
      )}
      {slide.subtitle && (
        <Text style={{ fontSize: 12, color: p.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
          {normText(slide.subtitle)}
        </Text>
      )}
      {/* Horizontal bar chart — compatible with react-pdf */}
      <View style={{ flex: 1, justifyContent: "center", gap: 10 }}>
        {cd.labels.map((label, i) => {
          const fill = cd.colors?.[i] ?? CHART_PALETTE[i % CHART_PALETTE.length];
          const pct = isDonut ? (cd.values[i] / total) * 100 : (cd.values[i] / max) * 100;
          const displayVal = isDonut
            ? `${Math.round(pct)}%`
            : `${cd.values[i]}${cd.unit ?? ""}`;

          return (
            <View key={i}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={{ fontSize: 11, color: fg }}>{normText(label)}</Text>
                <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: p.textMuted }}>{displayVal}</Text>
              </View>
              {/* Track */}
              <View style={{ width: chartW, height: barH, backgroundColor: p.divider, borderRadius: 4 }}>
                {/* Fill — percentage width relative to parent */}
                <View
                  style={{
                    width: `${Math.max(pct, 2)}%` as unknown as number,
                    height: barH,
                    backgroundColor: fill,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
      {/* Legend label for bar charts */}
      {!isDonut && cd.unit && (
        <Text style={{ fontSize: 9, color: p.textMuted, marginTop: 8 }}>Unit: {cd.unit}</Text>
      )}
    </View>
  );
}

function BigNumberSlide({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  const bg = resolveColor(slide.bgColor, p.bg);
  const fg = resolveColor(slide.textColor, slide.bgColor ? autoFg(slide.bgColor) : p.text);
  const accent = resolveColor(slide.accentColor, p.accent);

  return (
    <View style={{ width: W, height: H, backgroundColor: bg, alignItems: "center", justifyContent: "center", paddingHorizontal: PADDING * 2 }}>
      {slide.title && (
        <Text style={{ fontSize: 90, fontFamily: "Helvetica-Bold", color: accent, textAlign: "center", lineHeight: 1 }}>
          {normText(slide.title)}
        </Text>
      )}
      {slide.subtitle && (
        <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: fg, textAlign: "center", marginTop: 12 }}>
          {normText(slide.subtitle)}
        </Text>
      )}
      {slide.body && (
        <Text style={{ fontSize: 13, color: p.textMuted, textAlign: "center", marginTop: 14, lineHeight: 1.6, maxWidth: W * 0.6 }}>
          {normText(slide.body)}
        </Text>
      )}
    </View>
  );
}

function TimelineSlide({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  const bg = resolveColor(slide.bgColor, p.bg);
  const fg = resolveColor(slide.textColor, slide.bgColor ? autoFg(slide.bgColor) : p.text);
  const accent = resolveColor(slide.accentColor, p.accent);
  const events = slide.timeline ?? [];
  const colW = events.length ? (W - PADDING * 2) / events.length : W;

  return (
    <View style={{ width: W, height: H, backgroundColor: bg }}>
      <View style={{ paddingHorizontal: PADDING, paddingTop: PADDING }}>
        <AccentBar color={accent} />
        {slide.title && (
          <Text style={{ fontSize: 22, fontFamily: "Helvetica-Bold", color: fg, marginBottom: 24 }}>
            {normText(slide.title)}
          </Text>
        )}
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {events.map((ev, i) => (
            <View key={i} style={{ width: colW, alignItems: "center" }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: accent, opacity: i === 0 ? 1 : 0.45, marginBottom: 10 }} />
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: accent, marginBottom: 6, textAlign: "center" }}>{normText(ev.date)}</Text>
              <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: fg, textAlign: "center", marginBottom: 4, lineHeight: 1.3 }}>{normText(ev.event)}</Text>
              {ev.detail && <Text style={{ fontSize: 9, color: p.textMuted, textAlign: "center", lineHeight: 1.4 }}>{normText(ev.detail)}</Text>}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Slide dispatcher ─────────────────────────────────────────────────────────

function SlideRenderer({ slide, p }: { slide: PresentationSlide; p: Palette }) {
  switch (slide.layout) {
    case "title": return <TitleSlide slide={slide} p={p} />;
    case "content": return <ContentSlide slide={slide} p={p} />;
    case "bullets": return <BulletsSlide slide={slide} p={p} />;
    case "image-full": return <ImageFullSlide slide={slide} p={p} />;
    case "two-column": return <TwoColumnSlide slide={slide} p={p} />;
    case "quote": return <QuoteSlide slide={slide} p={p} />;
    case "section-break": return <SectionBreakSlide slide={slide} p={p} />;
    case "stats": return <StatsSlide slide={slide} p={p} />;
    case "chart": return <ChartSlide slide={slide} p={p} />;
    case "timeline": return <TimelineSlide slide={slide} p={p} />;
    case "big-number": return <BigNumberSlide slide={slide} p={p} />;
    default: return <ContentSlide slide={slide} p={p} />;
  }
}

// ─── Public component ─────────────────────────────────────────────────────────

interface ZeepoPresentationPdfProps {
  data: PresentationData;
}

export function ZeepoPresentationPdf({ data }: ZeepoPresentationPdfProps) {
  const p = THEMES[data.theme] ?? THEMES.dark;

  return (
    <Document
      title={data.title}
      author="Zeepo by Nisc Cloud"
      creator="Zeepo AI Agent"
    >
      {data.slides.map((slide, i) => (
        <Page
          key={i}
          size={{ width: W, height: H }}
          style={{ padding: 0, backgroundColor: resolveColor(slide.bgColor, p.bg) }}
        >
          <SlideRenderer slide={slide} p={p} />
        </Page>
      ))}
    </Document>
  );
}

/** Helper: generate a PDF blob from presentation data (call from the browser). */
export async function generatePresentationPdfBlob(data: PresentationData): Promise<Blob> {
  return pdf(<ZeepoPresentationPdf data={data} />).toBlob();
}
