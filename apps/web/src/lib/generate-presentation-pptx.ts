/**
 * Browser-side PPTX generator using pptxgenjs.
 * Uses LAYOUT_16x9 (10" × 5.625") — matches all coordinate math below.
 */
import PptxGenJS from "pptxgenjs";
import type { PresentationData, PresentationSlide, PresentationTheme } from "@/components/zeepo/presentation-pdf";

type PptxPalette = {
  bg: string;
  text: string;
  muted: string;
  accent: string;
};

const THEMES: Record<PresentationTheme, PptxPalette> = {
  dark:    { bg: "0A0F1E", text: "F8FAFC", muted: "94A3B8", accent: "6366F1" },
  light:   { bg: "F8FAFC", text: "0F172A", muted: "475569", accent: "2563EB" },
  branded: { bg: "1E1B4B", text: "E0E7FF", muted: "A5B4FC", accent: "818CF8" },
  minimal: { bg: "FFFFFF", text: "18181B", muted: "71717A", accent: "18181B" },
};

// LAYOUT_16x9 in pptxgenjs = exactly 10" × 5.625"
const W = 10;
const H = 5.625;
const PX = 0.5;   // horizontal padding
const PY = 0.42;  // vertical padding
const CW = W - PX * 2; // content width (9")
const ACCENT_H = 0.04; // accent bar height

/** Strip leading '#' for pptxgenjs color strings. */
function c(raw: string | undefined, fallback: string): string {
  const v = raw ?? fallback;
  return v.startsWith("#") ? v.slice(1) : v;
}

/**
 * Convert a text string into a pptxgenjs text-run array that correctly
 * renders line breaks. pptxgenjs ignores \n in plain strings — you must use
 * {breakLine: true} on each subsequent run.
 *
 * Also strips markdown bold/italic markers and normalises literal \\n sequences
 * that the LLM sometimes emits.
 */
function pptxLines(text: string): Array<{ text: string; options?: { breakLine?: boolean } }> {
  const normalised = text
    .replace(/\\n/g, "\n")                    // literal \n → real newline
    .replace(/\*\*([^*]+)\*\*/g, "$1")        // **bold** → text
    .replace(/\*([^*]+)\*/g, "$1");           // *italic* → text

  return normalised.split("\n").map((line, i) => ({
    text: line,
    ...(i > 0 ? { options: { breakLine: true } } : {}),
  }));
}

/** Compute luminance-based contrast text (dark or light). */
function contrastColor(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.45 ? "0F172A" : "F8FAFC";
}

function addBgImage(prs: PptxGenJS, s: PptxGenJS.Slide, url: string, overlayOpacity = 55) {
  s.addImage({ path: url, x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H } });
  s.addShape(prs.ShapeType.rect, {
    x: 0, y: 0, w: W, h: H,
    fill: { color: "000000", transparency: overlayOpacity },
    line: { color: "transparent" },
  });
}

function addAccentBar(prs: PptxGenJS, s: PptxGenJS.Slide, x: number, y: number, accent: string, w = 0.38) {
  s.addShape(prs.ShapeType.rect, {
    x, y, w, h: ACCENT_H,
    fill: { color: accent },
    line: { color: "transparent" },
  });
}

// ─── Slide builders ────────────────────────────────────────────────────────────

async function buildTitleSlide(prs: PptxGenJS, slide: PresentationSlide, p: PptxPalette) {
  const s = prs.addSlide();
  const bg = c(slide.bgColor, p.bg);
  const fg = slide.textColor ? c(slide.textColor, p.text) : contrastColor(`#${bg}`);
  const accent = c(slide.accentColor, p.accent);
  s.background = { color: bg };

  if (slide.imageUrl) addBgImage(prs, s, slide.imageUrl, 48);

  // Centered accent pill (two bars + dot)
  const barW = 0.5;
  const cx = W / 2;
  s.addShape(prs.ShapeType.rect, { x: cx - barW - 0.06, y: H * 0.38, w: barW, h: ACCENT_H, fill: { color: accent }, line: { color: "transparent" } });
  s.addShape(prs.ShapeType.rect, { x: cx + 0.06, y: H * 0.38, w: barW, h: ACCENT_H, fill: { color: accent }, line: { color: "transparent" } });

  if (slide.title) {
    s.addText(pptxLines(slide.title), {
      x: PX, y: H * 0.41, w: CW, h: 1.3,
      align: "center", valign: "middle",
      fontFace: "Calibri", fontSize: 38, bold: true,
      color: fg, charSpacing: -0.5,
    });
  }
  if (slide.subtitle) {
    s.addText(pptxLines(slide.subtitle), {
      x: PX + 1, y: H * 0.68, w: CW - 2, h: 0.9,
      align: "center", valign: "top",
      fontFace: "Calibri", fontSize: 15,
      color: fg,
    });
  }
  if (slide.notes) s.addNotes(slide.notes);
}

async function buildSectionBreakSlide(prs: PptxGenJS, slide: PresentationSlide, p: PptxPalette) {
  const s = prs.addSlide();
  const bg = c(slide.bgColor, p.accent); // section break uses accent as bg by default
  const fg = slide.textColor ? c(slide.textColor, "FFFFFF") : contrastColor(`#${bg}`);
  s.background = { color: bg };

  if (slide.imageUrl) addBgImage(prs, s, slide.imageUrl, 50);

  // Thin horizontal divider line
  s.addShape(prs.ShapeType.rect, {
    x: W / 2 - 0.5, y: H * 0.38, w: 1.0, h: 0.02,
    fill: { color: fg, transparency: 45 }, line: { color: "transparent" },
  });

  if (slide.title) {
    s.addText(pptxLines(slide.title), {
      x: PX, y: H * 0.40, w: CW, h: 1.2,
      align: "center", valign: "middle",
      fontFace: "Calibri", fontSize: 30, bold: true, color: fg,
    });
  }
  if (slide.subtitle) {
    s.addText(pptxLines(slide.subtitle), {
      x: PX + 0.5, y: H * 0.67, w: CW - 1, h: 0.65,
      align: "center", valign: "top",
      fontFace: "Calibri", fontSize: 14, color: fg,
    });
  }
  if (slide.notes) s.addNotes(slide.notes);
}

async function buildContentSlide(prs: PptxGenJS, slide: PresentationSlide, p: PptxPalette) {
  const s = prs.addSlide();
  const bg = c(slide.bgColor, p.bg);
  const fg = slide.textColor ? c(slide.textColor, p.text) : contrastColor(`#${bg}`);
  const muted = p.muted;
  const accent = c(slide.accentColor, p.accent);
  s.background = { color: bg };

  const hasBg = Boolean(slide.imageUrl && slide.imagePosition === "background");
  const hasRight = Boolean(slide.imageUrl && slide.imagePosition === "right");
  const hasLeft = Boolean(slide.imageUrl && slide.imagePosition === "left");

  if (hasBg && slide.imageUrl) addBgImage(prs, s, slide.imageUrl, 45);

  const imgW = W * 0.42;
  const textX = hasLeft ? imgW + PX * 0.5 : PX;
  const textW = (hasRight || hasLeft) ? W - imgW - PX * 1.5 : CW;
  const bodyColor = hasBg ? fg : muted;

  if (hasLeft && slide.imageUrl) {
    s.addImage({ path: slide.imageUrl, x: 0, y: 0, w: imgW, h: H, sizing: { type: "cover", w: imgW, h: H } });
  }

  addAccentBar(prs, s, textX, PY, accent);

  if (slide.title) {
    s.addText(pptxLines(slide.title), {
      x: textX, y: PY + 0.12, w: textW, h: 0.75,
      fontFace: "Calibri", fontSize: 22, bold: true, color: fg, valign: "top",
    });
  }
  if (slide.body) {
    const bodyY = slide.title ? PY + 1.0 : PY + 0.12;
    s.addText(pptxLines(slide.body), {
      x: textX, y: bodyY, w: textW, h: H - bodyY - PY,
      fontFace: "Calibri", fontSize: 12, color: bodyColor, valign: "top",
    });
  }

  if (hasRight && slide.imageUrl) {
    s.addImage({ path: slide.imageUrl, x: W - imgW, y: 0, w: imgW, h: H, sizing: { type: "cover", w: imgW, h: H } });
  }
  if (slide.notes) s.addNotes(slide.notes);
}

async function buildBulletsSlide(prs: PptxGenJS, slide: PresentationSlide, p: PptxPalette) {
  const s = prs.addSlide();
  const bg = c(slide.bgColor, p.bg);
  const fg = slide.textColor ? c(slide.textColor, p.text) : contrastColor(`#${bg}`);
  const muted = p.muted;
  const accent = c(slide.accentColor, p.accent);
  s.background = { color: bg };

  const hasBg = Boolean(slide.imageUrl && slide.imagePosition === "background");
  const hasRight = Boolean(slide.imageUrl && slide.imagePosition === "right");

  if (hasBg && slide.imageUrl) addBgImage(prs, s, slide.imageUrl, 45);

  const imgW = W * 0.38;
  const textW = hasRight ? W - imgW - PX * 1.5 : CW;
  const bodyColor = hasBg ? fg : muted;

  addAccentBar(prs, s, PX, PY, accent);

  if (slide.title) {
    s.addText(pptxLines(slide.title), {
      x: PX, y: PY + 0.12, w: textW, h: 0.7,
      fontFace: "Calibri", fontSize: 22, bold: true, color: fg, valign: "top",
    });
  }
  if (slide.subtitle) {
    s.addText(pptxLines(slide.subtitle), {
      x: PX, y: PY + 0.90, w: textW, h: 0.36,
      fontFace: "Calibri", fontSize: 12, italic: true, color: bodyColor, valign: "top",
    });
  }

  const bullets = slide.bullets ?? [];
  if (bullets.length > 0) {
    const bulletY = slide.title ? PY + (slide.subtitle ? 1.36 : 0.98) : PY + 0.2;
    const bulletItems = bullets.map((b) => ({
      text: b.replace(/\\n/g, " ").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1"),
      options: {
        bullet: { color: accent, indent: 15 },
        fontFace: "Calibri",
        fontSize: 12,
        color: bodyColor,
        paraSpaceAfter: 5,
      } as PptxGenJS.TextPropsOptions,
    }));
    s.addText(bulletItems, {
      x: PX, y: bulletY, w: textW, h: H - bulletY - PY, valign: "top",
    });
  }

  if (hasRight && slide.imageUrl) {
    s.addImage({ path: slide.imageUrl, x: W - imgW, y: 0, w: imgW, h: H, sizing: { type: "cover", w: imgW, h: H } });
  }
  if (slide.notes) s.addNotes(slide.notes);
}

async function buildImageFullSlide(prs: PptxGenJS, slide: PresentationSlide, p: PptxPalette) {
  const s = prs.addSlide();
  s.background = { color: c(slide.bgColor, p.accent) };

  if (slide.imageUrl) {
    s.addImage({ path: slide.imageUrl, x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H } });
  }
  // Bottom gradient overlay
  s.addShape(prs.ShapeType.rect, {
    x: 0, y: H * 0.46, w: W, h: H * 0.54,
    fill: { color: "000000", transparency: 28 }, line: { color: "transparent" },
  });

  const accent = c(slide.accentColor, p.accent);
  addAccentBar(prs, s, PX, H - 1.32, accent, 0.3);

  if (slide.title) {
    s.addText(pptxLines(slide.title), {
      x: PX, y: H - 1.15, w: W * 0.72, h: 0.78,
      fontFace: "Calibri", fontSize: 26, bold: true, color: "FFFFFF", valign: "top",
    });
  }
  const body = slide.subtitle ?? slide.body;
  if (body) {
    s.addText(pptxLines(body), {
      x: PX, y: H - 0.44, w: W * 0.72, h: 0.38,
      fontFace: "Calibri", fontSize: 12, color: "C8D6E8", valign: "top",
    });
  }
  if (slide.notes) s.addNotes(slide.notes);
}

async function buildTwoColumnSlide(prs: PptxGenJS, slide: PresentationSlide, p: PptxPalette) {
  const s = prs.addSlide();
  const bg = c(slide.bgColor, p.bg);
  const fg = slide.textColor ? c(slide.textColor, p.text) : contrastColor(`#${bg}`);
  const muted = p.muted;
  const accent = c(slide.accentColor, p.accent);
  s.background = { color: bg };

  const titleH = slide.title ? 0.72 : 0;
  const colY = PY + titleH + (slide.title ? 0.18 : 0);
  const colH = H - colY - PY;
  const colW = (CW - 0.2) / 2;

  addAccentBar(prs, s, PX, PY, accent);
  if (slide.title) {
    s.addText(pptxLines(slide.title), {
      x: PX, y: PY + 0.12, w: CW, h: titleH,
      fontFace: "Calibri", fontSize: 20, bold: true, color: fg, valign: "top",
    });
  }
  // Divider
  s.addShape(prs.ShapeType.line, {
    x: PX + colW + 0.1, y: colY, w: 0, h: colH,
    line: { color: muted, width: 0.5, transparency: 60 },
  });

  if (slide.leftContent) {
    s.addText(pptxLines(slide.leftContent), {
      x: PX, y: colY, w: colW, h: colH,
      fontFace: "Calibri", fontSize: 11, color: muted, valign: "top",
    });
  }
  if (slide.rightContent) {
    s.addText(pptxLines(slide.rightContent), {
      x: PX + colW + 0.2, y: colY, w: colW, h: colH,
      fontFace: "Calibri", fontSize: 11, color: muted, valign: "top",
    });
  }
  if (slide.notes) s.addNotes(slide.notes);
}

async function buildQuoteSlide(prs: PptxGenJS, slide: PresentationSlide, p: PptxPalette) {
  const s = prs.addSlide();
  const bg = c(slide.bgColor, p.bg);
  const fg = slide.textColor ? c(slide.textColor, p.text) : contrastColor(`#${bg}`);
  const accent = c(slide.accentColor, p.accent);
  s.background = { color: bg };

  if (slide.imageUrl && slide.imagePosition === "background") addBgImage(prs, s, slide.imageUrl, 40);

  s.addText("\u201C", {
    x: W / 2 - 0.6, y: 0.22, w: 1.2, h: 0.9,
    fontFace: "Calibri", fontSize: 72, bold: true, color: accent, align: "center",
  });
  s.addText(pptxLines(slide.body ?? slide.title ?? ""), {
    x: PX + 0.5, y: 1.0, w: CW - 1, h: 2.8,
    fontFace: "Calibri", fontSize: 19, italic: true,
    color: fg, align: "center", valign: "middle",
  });
  if (slide.subtitle) {
    s.addText(pptxLines(slide.subtitle), {
      x: PX, y: H - 0.85, w: CW, h: 0.45,
      fontFace: "Calibri", fontSize: 13, bold: true,
      color: accent, align: "center",
    });
  }
  if (slide.notes) s.addNotes(slide.notes);
}

async function buildStatsSlide(prs: PptxGenJS, slide: PresentationSlide, p: PptxPalette) {
  const s = prs.addSlide();
  const bg = c(slide.bgColor, p.bg);
  const fg = slide.textColor ? c(slide.textColor, p.text) : contrastColor(`#${bg}`);
  const accent = c(slide.accentColor, p.accent);
  s.background = { color: bg };

  addAccentBar(prs, s, PX, PY, accent);
  if (slide.title) {
    s.addText(pptxLines(slide.title), {
      x: PX, y: PY + 0.12, w: CW, h: 0.65,
      fontFace: "Calibri", fontSize: 20, bold: true, color: fg, valign: "top",
    });
  }

  const items = slide.stats ?? [];
  const cols = Math.min(items.length, 4);
  const gap = 0.12;
  const colW = (CW - gap * (cols - 1)) / cols;
  const boxY = slide.title ? PY + 0.88 : PY + 0.2;
  const boxH = H - boxY - PY;

  items.slice(0, 4).forEach((item, i) => {
    const bx = PX + i * (colW + gap);
    s.addShape(prs.ShapeType.rect, {
      x: bx, y: boxY, w: colW, h: boxH,
      fill: { color: accent, transparency: 88 },
      line: { color: accent, transparency: 70, width: 0.5 },
    });
    s.addText(pptxLines(item.value), {
      x: bx + 0.06, y: boxY + 0.18, w: colW - 0.12, h: 0.76,
      fontFace: "Calibri", fontSize: 32, bold: true,
      color: accent, align: "center", valign: "middle",
    });
    s.addText(pptxLines(item.label), {
      x: bx + 0.06, y: boxY + 0.98, w: colW - 0.12, h: 0.42,
      fontFace: "Calibri", fontSize: 10, bold: true,
      color: fg, align: "center", valign: "top",
    });
    if (item.delta) {
      const deltaFg = (item.delta.startsWith("\u2193") || item.delta.startsWith("-")) ? "F87171" : "34D399";
      s.addText(pptxLines(item.delta), {
        x: bx + 0.06, y: boxY + boxH - 0.38, w: colW - 0.12, h: 0.3,
        fontFace: "Calibri", fontSize: 10, bold: true,
        color: deltaFg, align: "center", valign: "middle",
      });
    }
  });
  if (slide.notes) s.addNotes(slide.notes);
}

async function buildBigNumberSlide(prs: PptxGenJS, slide: PresentationSlide, p: PptxPalette) {
  const s = prs.addSlide();
  const bg = c(slide.bgColor, p.bg);
  const fg = slide.textColor ? c(slide.textColor, p.text) : contrastColor(`#${bg}`);
  const accent = c(slide.accentColor, p.accent);
  s.background = { color: bg };

  if (slide.imageUrl) addBgImage(prs, s, slide.imageUrl, 40);

  if (slide.title) {
    s.addText(pptxLines(slide.title), {
      x: PX, y: H * 0.12, w: CW, h: 1.8,
      fontFace: "Calibri", fontSize: 88, bold: true,
      color: accent, align: "center", valign: "middle",
    });
  }
  if (slide.subtitle) {
    s.addText(pptxLines(slide.subtitle), {
      x: PX, y: H * 0.62, w: CW, h: 0.55,
      fontFace: "Calibri", fontSize: 18, bold: true,
      color: fg, align: "center", valign: "middle",
    });
  }
  if (slide.body) {
    s.addText(pptxLines(slide.body), {
      x: PX + 1.5, y: H * 0.77, w: CW - 3, h: 0.65,
      fontFace: "Calibri", fontSize: 12,
      color: p.muted, align: "center", valign: "top",
    });
  }
  if (slide.notes) s.addNotes(slide.notes);
}

async function buildTimelineSlide(prs: PptxGenJS, slide: PresentationSlide, p: PptxPalette) {
  const s = prs.addSlide();
  const bg = c(slide.bgColor, p.bg);
  const fg = slide.textColor ? c(slide.textColor, p.text) : contrastColor(`#${bg}`);
  const accent = c(slide.accentColor, p.accent);
  s.background = { color: bg };

  addAccentBar(prs, s, PX, PY, accent);
  if (slide.title) {
    s.addText(pptxLines(slide.title), {
      x: PX, y: PY + 0.12, w: CW, h: 0.65,
      fontFace: "Calibri", fontSize: 20, bold: true, color: fg, valign: "top",
    });
  }

  const events = slide.timeline ?? [];
  const cnt = Math.min(events.length, 6);
  const lineY = H * 0.52;
  const stepW = CW / Math.max(cnt, 1);

  // Timeline connector line
  s.addShape(prs.ShapeType.line, {
    x: PX, y: lineY, w: CW, h: 0,
    line: { color: accent, transparency: 55, width: 1.5 },
  });

  events.slice(0, 6).forEach((ev, i) => {
    const cx = PX + stepW * i + stepW / 2;
    const dotR = 0.12;
    const dotColor = i === 0 ? accent : p.muted;
    s.addShape(prs.ShapeType.ellipse, {
      x: cx - dotR, y: lineY - dotR, w: dotR * 2, h: dotR * 2,
      fill: { color: dotColor }, line: { color: "transparent" },
    });
    s.addText(pptxLines(ev.date), {
      x: cx - stepW * 0.44, y: lineY - 0.52, w: stepW * 0.88, h: 0.28,
      fontFace: "Calibri", fontSize: 9, bold: true, color: accent, align: "center",
    });
    s.addText(pptxLines(ev.event), {
      x: cx - stepW * 0.44, y: lineY + 0.18, w: stepW * 0.88, h: 0.52,
      fontFace: "Calibri", fontSize: 11, bold: true, color: fg, align: "center",
    });
    if (ev.detail) {
      s.addText(pptxLines(ev.detail), {
        x: cx - stepW * 0.44, y: lineY + 0.74, w: stepW * 0.88, h: 0.55,
        fontFace: "Calibri", fontSize: 9, color: p.muted, align: "center",
      });
    }
  });
  if (slide.notes) s.addNotes(slide.notes);
}

async function buildChartSlide(prs: PptxGenJS, slide: PresentationSlide, p: PptxPalette) {
  // pptxgenjs supports native charts — fall back to stats-style text if no data
  const s = prs.addSlide();
  const bg = c(slide.bgColor, p.bg);
  const fg = slide.textColor ? c(slide.textColor, p.text) : contrastColor(`#${bg}`);
  const accent = c(slide.accentColor, p.accent);
  s.background = { color: bg };

  addAccentBar(prs, s, PX, PY, accent);
  if (slide.title) {
    s.addText(pptxLines(slide.title), {
      x: PX, y: PY + 0.12, w: CW, h: 0.65,
      fontFace: "Calibri", fontSize: 20, bold: true, color: fg, valign: "top",
    });
  }

  const cd = slide.chartData;
  if (!cd) { if (slide.notes) s.addNotes(slide.notes); return; }

  const PALETTE = ["6366F1","22D3EE","F59E0B","10B981","F43F5E","A78BFA","34D399","FBBF24"];
  const chartColors = cd.labels.map((_, i) =>
    ({ type: "solid" as const, color: (cd.colors?.[i] ? c(cd.colors[i], PALETTE[i % PALETTE.length]) : PALETTE[i % PALETTE.length]) })
  );
  const chartData = [{ name: slide.title ?? "Data", labels: cd.labels, values: cd.values }];
  const chartY = slide.title ? PY + 0.88 : PY + 0.2;
  const chartH = H - chartY - PY;

  if (cd.type === "donut") {
    s.addChart(prs.ChartType.doughnut, chartData, {
      x: PX, y: chartY, w: CW, h: chartH,
      chartColors: chartColors.map(c => c.color),
      dataLabelFontSize: 9,
      showLegend: true, legendPos: "b", legendFontSize: 9,
      holeSize: 50,
    });
  } else {
    s.addChart(prs.ChartType.bar, chartData, {
      x: PX, y: chartY, w: CW, h: chartH,
      barDir: "col",
      chartColors: chartColors.map(c => c.color),
      dataLabelFontSize: 8,
      showValue: true,
      catAxisLabelFontSize: 9,
      valAxisHidden: true,
      catGridLine: { style: "none" },
      valGridLine: { style: "none" },
    });
  }
  if (slide.notes) s.addNotes(slide.notes);
}

// ─── Public export ─────────────────────────────────────────────────────────────

export async function generatePresentationPptx(data: PresentationData): Promise<Blob> {
  const prs = new PptxGenJS();
  // IMPORTANT: LAYOUT_16x9 = 10" × 5.625" — matches all W/H constants above.
  prs.layout = "LAYOUT_16x9";
  prs.title = data.title;
  prs.subject = "Generated by Zeepo AI Agent — Nisc Cloud";
  prs.author = "Zeepo";

  const p = THEMES[data.theme] ?? THEMES.dark;

  for (const slide of data.slides) {
    switch (slide.layout) {
      case "title":         await buildTitleSlide(prs, slide, p); break;
      case "content":       await buildContentSlide(prs, slide, p); break;
      case "bullets":       await buildBulletsSlide(prs, slide, p); break;
      case "image-full":    await buildImageFullSlide(prs, slide, p); break;
      case "two-column":    await buildTwoColumnSlide(prs, slide, p); break;
      case "quote":         await buildQuoteSlide(prs, slide, p); break;
      case "section-break": await buildSectionBreakSlide(prs, slide, p); break;
      case "stats":         await buildStatsSlide(prs, slide, p); break;
      case "chart":         await buildChartSlide(prs, slide, p); break;
      case "big-number":    await buildBigNumberSlide(prs, slide, p); break;
      case "timeline":      await buildTimelineSlide(prs, slide, p); break;
      default:              await buildContentSlide(prs, slide, p); break;
    }
  }

  return prs.write({ outputType: "blob" }) as Promise<Blob>;
}
