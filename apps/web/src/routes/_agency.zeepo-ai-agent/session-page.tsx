// @refresh reset
"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { Link, Navigate, useNavigate, useParams, useLocation } from "react-router";
import { trpc } from "@/utils/trpc";
import { refreshZeepoTokenBalance } from "@/lib/zeepo-token-balance-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AiMarkdownRenderer } from "@/components/ai/ai-markdown-renderer";
import {
  ArrowLeftIcon,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Plus,
  Zap,
  X,
  Download,
  Headphones,
  ImageIcon,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Upload,
  Undo2,
  Paintbrush,
  Wand2,
  Trash2,
  Minus,
  Redo2,
  Eraser,
  Palette,
  Type,
  Shuffle,
  ZoomIn,
  Layers,
  Clock,
  SplitSquareHorizontal,
  Sparkles,
  Presentation,
  ArrowUpRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { pdf } from "@react-pdf/renderer";
import { ZeepoDocumentPdf } from "@/components/zeepo/document-pdf";
import { generatePresentationPdfBlob } from "@/components/zeepo/presentation-pdf";
import type { PresentationData } from "@/components/zeepo/presentation-pdf";
import { generatePresentationPptx } from "@/lib/generate-presentation-pptx";
import { ZeepoDomainPurchaseCard } from "@/components/zeepo/domain-purchase-card";
import type { AgentDomainCheckResult } from "@/stores/zeepo-payment-store";
import { RotatingText } from "@/components/rotating-text";
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer, PieChart, Pie } from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ZeepoMascot } from "@/components/zeepo/zeepo-mascot";
import {
  ZeepoAgentIdentity,
  ZeepoAssistantMessage,
  ZeepoEmptyThread,
  ZeepoFloatingDock,
  ZeepoComposer,
  ZeepoGenerationProgressCard,
  ZeepoStepIndicator,
  ZeepoThinkingBlock,
  ZeepoUserMessage,
  ZEEPO_AGENCY_PAGE_CONTENT,
  ZEEPO_AGENCY_PAGE_SHELL,
  ZEEPO_CHAT_COMPOSE_COLUMN,
} from "@/components/zeepo/zeepo-chat-ui";
import { ZeepoGenerationsPanel } from "@/components/zeepo/zeepo-generations-panel";
import { ZeepoSessionTitle } from "@/components/zeepo/zeepo-session-title";
import { ZeepoTokenWallet } from "@/components/zeepo/zeepo-token-wallet";
import {
  uploadErrorMessage,
  uploadThingFileUrl,
  uploadZeepoAgentFiles,
} from "@/hooks/use-uploadthing";
import { formatDistanceToNow } from "date-fns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { TRPCClientError } from "@trpc/client";
import { isReplicateHostedMediaUrl } from "@npanel/api/lib/replicate-hosted-url";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  hasComposeHandoff,
  type ZeepoComposeHandoffState,
} from "./nav-state";
import {
  useZeepoAgentRoute,
  zeepoAgentCreateSessionInput,
  zeepoAgentSessionPath,
  zeepoAgentSessionsInput,
} from "@/components/zeepo/zeepo-agent-route-context";
import { useZeepoTokenBilling } from "@/components/zeepo/zeepo-token-billing-provider";

function extractOutputPreview(outputs: unknown): string | null {
  if (outputs == null) return null;
  if (typeof outputs === "string") return outputs.slice(0, 4000);
  if (typeof outputs === "object" && outputs !== null && "text" in (outputs as object)) {
    const t = (outputs as { text?: string }).text;
    if (typeof t === "string") return t;
  }
  try {
    return JSON.stringify(outputs).slice(0, 2000);
  } catch {
    return String(outputs);
  }
}

type GenerationMediaKind = "image" | "video" | "audio";

type ClarifyingQuestion = { question: string; options: string[]; allow_upload?: boolean };
type Attachment = { url: string; name: string; mimeType: string };

type QuestionFlowState = {
  triggerMessageId: string;
  currentIndex: number;
  answers: string[];
  customText: string;
  showCustom: boolean;
  uploadAttachments: Attachment[];
  /** Set while the upload is in flight */
  isUploadingForStep: boolean;
  /** Uploaded but not yet confirmed by the user — shows a preview card */
  pendingUploadForStep?: Attachment;
};

function guessMediaKind(url: string, modelCategory: string): GenerationMediaKind {
  const lower = url.toLowerCase().split("?")[0] ?? url;
  if (modelCategory === "video" || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(lower)) return "video";
  if (modelCategory === "audio" || /\.(mp3|wav|m4a|aac|ogg|flac)(\?|$)/i.test(lower)) {
    return "audio";
  }
  return "image";
}

function fileExtensionForDownload(kind: GenerationMediaKind, url: string): string {
  const pathPart = url.split("?")[0] ?? url;
  const ext = pathPart.includes(".") ? pathPart.split(".").pop()?.toLowerCase() : "";
  if (ext && /^[a-z0-9]{2,5}$/.test(ext)) return ext;
  if (kind === "video") return "mp4";
  if (kind === "audio") return "mp3";
  return "png";
}

async function downloadMediaFile(url: string, suggestedName: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = suggestedName || "download";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function firstMediaUrl(outputs: unknown): string | null {
  if (typeof outputs === "string" && outputs.startsWith("http")) {
    return isReplicateHostedMediaUrl(outputs) ? null : outputs;
  }
  if (Array.isArray(outputs) && typeof outputs[0] === "string" && outputs[0].startsWith("http")) {
    return isReplicateHostedMediaUrl(outputs[0]) ? null : outputs[0];
  }
  if (typeof outputs === "object" && outputs !== null) {
    for (const v of Object.values(outputs as Record<string, unknown>)) {
      if (typeof v === "string" && v.startsWith("http")) {
        if (!isReplicateHostedMediaUrl(v)) return v;
      }
      const nested = firstMediaUrl(v);
      if (nested) return nested;
    }
  }
  return null;
}

function extractDocument(outputs: unknown): { title: string; content: string } | null {
  if (!outputs || typeof outputs !== "object" || Array.isArray(outputs)) return null;
  const doc = (outputs as Record<string, unknown>).document;
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return null;
  const d = doc as Record<string, unknown>;
  const title = typeof d.title === "string" ? d.title : "Document";
  const content = typeof d.content === "string" ? d.content : null;
  if (!content) return null;
  return { title, content };
}

function extractPresentation(outputs: unknown): PresentationData | null {
  if (!outputs || typeof outputs !== "object" || Array.isArray(outputs)) return null;
  const pres = (outputs as Record<string, unknown>).presentation;
  if (!pres || typeof pres !== "object" || Array.isArray(pres)) return null;
  const p = pres as Record<string, unknown>;
  if (typeof p.title !== "string" || !Array.isArray(p.slides)) return null;
  return pres as PresentationData;
}

type ImagePresentationSlide = {
  prompt: string;
  imageUrl?: string;
  caption?: string;
  notes?: string;
};
type ImagePresentationData = {
  title: string;
  slides: ImagePresentationSlide[];
};

function extractImagePresentation(outputs: unknown): ImagePresentationData | null {
  if (!outputs || typeof outputs !== "object" || Array.isArray(outputs)) return null;
  const pres = (outputs as Record<string, unknown>).imagePresentation;
  if (!pres || typeof pres !== "object" || Array.isArray(pres)) return null;
  const p = pres as Record<string, unknown>;
  if (typeof p.title !== "string" || !Array.isArray(p.slides)) return null;
  return pres as ImagePresentationData;
}

const UUID_SEGMENT = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

/** Strip job / generation UUIDs from assistant copy (defense in depth vs model drift). */
function sanitizeZeepoAgentAssistantDisplayMarkdown(content: string): string {
  let s = content;

  // If the stored content is raw orchestration JSON (e.g. from a failed parse that
  // slipped through), extract just the assistant_text value so users never see JSON.
  const trimmed = s.trimStart();
  if (trimmed.startsWith("{") && /"assistant_text"\s*:/.test(trimmed)) {
    const match = trimmed.match(/"assistant_text"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
    if (match?.[1]) {
      s = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .trim();
    }
  }
  s = s.replace(new RegExp(String.raw`\(\s*ID\s*:\s*${UUID_SEGMENT}\s*\)`, "g"), "");
  s = s.replace(new RegExp(String.raw`\(\s*id\s*:\s*${UUID_SEGMENT}\s*\)`, "g"), "");
  s = s.replace(
    new RegExp(
      String.raw`\b(?:generation\s*(?:id|ID)|job\s*(?:id|ID))\s*[:#]?\s*${UUID_SEGMENT}\b`,
      "g",
    ),
    "",
  );
  s = s.replace(new RegExp(String.raw`[,;]?\s*\bID\s*:\s*${UUID_SEGMENT}\b`, "g"), "");

  // Convert bare file/CDN URLs into masked markdown links so users never see raw URLs.
  // Match URLs that are NOT already inside a markdown link ([text](url)).
  s = s.replace(
    /(?<!\]\()https?:\/\/(?:utfs\.io|uploadthing\.com|utweb\.utfs\.io)[^\s)\]"'>]+/g,
    (url) => {
      // Derive a friendly label from the path's last segment or generic fallback.
      const seg = url.split("/").pop()?.split("?")[0] ?? "";
      const isImage = /\.(jpe?g|png|webp|gif|svg)$/i.test(seg);
      const label = isImage ? "View image" : seg || "View file";
      return `[${label}](${url})`;
    },
  );
  // Also mask bare ATTACHMENT markers that the model might echo in its text.
  s = s.replace(/\[ATTACHMENT_\d+[^\]]*\]/g, "");

  s = s.replace(/  +/g, " ");
  s = s.replace(/\s+\./g, ".").replace(/\s+,/g, ",");
  s = s.replace(/\(\s*\)/g, "");
  return s.trim();
}

/**
 * Strips or prettifies internal markers from user-bubble content so raw technical text
 * never leaks to the display. Specifically handles the compiled question-answer format.
 */
function sanitizeUserMessageForDisplay(content: string): string {
  // Replace [Uploaded: filename] markers with a nice italic label.
  return content.replace(
    /\[Uploaded:\s*([^\]]+)\]/g,
    (_match, name: string) => `*📎 ${name.trim()}*`,
  );
}

/**
 * Parses a tool message content string and returns a DomainCheckResult if it
 * contains check_domain_availability data, or null otherwise.
 */
function parseDomainCheckResult(
  content: string | null | undefined,
): AgentDomainCheckResult | null {
  if (!content) return null;
  try {
    const o = JSON.parse(content) as Record<string, unknown>;
    if (
      o &&
      typeof o === "object" &&
      !Array.isArray(o) &&
      (o as { _tool?: unknown })._tool === "check_domain_availability"
    ) {
      return o as unknown as AgentDomainCheckResult;
    }
  } catch {
    // Not JSON or not the right shape.
  }
  return null;
}

function formatChatBubbleTime(value: Date | string | undefined | null): string {
  if (value == null) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  if (d.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return new Intl.DateTimeFormat(undefined, opts).format(d);
}

function ChatLoadingSkeleton() {
  return (
    <div className="flex w-full flex-col gap-8 py-4" aria-busy="true" aria-label="Loading conversation">
      <div className="flex justify-end">
        <Skeleton className="h-24 w-[min(70%,20rem)] rounded-2xl" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-24 rounded-md" />
        <Skeleton className="h-32 w-full max-w-md rounded-md" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-16 w-[min(55%,16rem)] rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Presentation viewer (slide-by-slide with CSS rendering) ─────────────────

type GenerationRow = {
  id: string;
  modelCategory: string;
  outputs: unknown;
  status: string;
};

type PresentationViewerProps = {
  data: PresentationData;
  slideIndex: number;
  onSlideChange: (i: number) => void;
  /** All session generations — used to resolve image generationId for the edit panel. */
  generations: GenerationRow[];
  /** Open an image URL in the full media edit panel. */
  onOpenImage: (url: string, generationId: string) => void;
};

/** Inline markdown: **bold**, *italic*, \n → <br /> */
function InlineMarkdown({ text }: { text: string }) {
  // Normalise literal \n sequences (LLM sometimes emits them) before splitting
  const normalised = text.replace(/\\n/g, "\n");
  const parts = normalised.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
        return part.split("\n").map((line, j, arr) => (
          <React.Fragment key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</React.Fragment>
        ));
      })}
    </>
  );
}

/** Return #0f172a (dark) or #f8fafc (light) depending on bg luminance, ensuring legible contrast. */
function autoTextColor(hexBg: string): string {
  try {
    const h = hexBg.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.45 ? "#0f172a" : "#f8fafc";
  } catch {
    return "#f8fafc";
  }
}

const CHART_PALETTE = ["#6366f1","#22d3ee","#f59e0b","#10b981","#f43f5e","#a78bfa","#34d399","#fbbf24"];

function SlideBarChart({ labels, values, colors, unit, fg, muted, accent }: {
  labels: string[]; values: number[]; colors?: string[]; unit?: string;
  fg: string; muted: string; accent: string;
}) {
  const data = labels.map((l, i) => ({ name: l, value: values[i] ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 16, right: 8, bottom: 18, left: 8 }} barCategoryGap="28%">
        <XAxis
          dataKey="name"
          tick={{ fontSize: 9, fill: muted, fontFamily: "Inter,system-ui" }}
          axisLine={{ stroke: `${muted}44` }}
          tickLine={false}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}
          label={{ position: "top", fontSize: 9, fill: fg, fontFamily: "Inter,system-ui",
                   formatter: (v: number) => `${v}${unit ?? ""}` }}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors?.[i] ?? CHART_PALETTE[i % CHART_PALETTE.length] ?? accent} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function SlideDonutChart({ labels, values, colors, fg, accent }: {
  labels: string[]; values: number[]; colors?: string[];
  fg: string; accent: string;
}) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const data = labels.map((l, i) => ({ name: l, value: values[i] ?? 0, pct: Math.round((values[i] ?? 0) / total * 100) }));
  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct, name }: Record<string, number> & { name: string }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 1.45;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return pct < 5 ? null : (
      <text x={x} y={y} fill={fg} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central"
            fontSize={8} fontFamily="Inter,system-ui">
        {name} {pct}%
      </text>
    );
  };
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart margin={{ top: 8, right: 40, bottom: 8, left: 40 }}>
        <Pie data={data} cx="50%" cy="50%" innerRadius={38} outerRadius={62}
             dataKey="value" labelLine={false} label={renderLabel}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors?.[i] ?? CHART_PALETTE[i % CHART_PALETTE.length] ?? accent} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

type SlideData = PresentationData["slides"][0];

function PresentationSlideView({ slide, theme }: { slide: SlideData; theme: PresentationData["theme"] }) {
  const themes: Record<PresentationData["theme"], { bg: string; text: string; muted: string; accent: string; surface: string }> = {
    dark:    { bg: "#0a0f1e", text: "#f8fafc", muted: "#94a3b8", accent: "#6366f1", surface: "rgba(255,255,255,0.06)" },
    light:   { bg: "#f8fafc", text: "#0f172a", muted: "#475569", accent: "#2563eb", surface: "rgba(0,0,0,0.04)" },
    branded: { bg: "#1e1b4b", text: "#e0e7ff", muted: "#a5b4fc", accent: "#818cf8", surface: "rgba(255,255,255,0.07)" },
    minimal: { bg: "#ffffff", text: "#18181b", muted: "#71717a", accent: "#18181b", surface: "rgba(0,0,0,0.04)" },
  };
  const t = themes[theme] ?? themes.dark;
  const bg     = slide.bgColor ?? t.bg;
  // Smart contrast: if no explicit textColor, compute from background to avoid white-on-white / dark-on-dark
  const fg     = slide.textColor ?? autoTextColor(bg);
  const muted  = slide.textColor ? `${fg}99` : t.muted;
  const accent = slide.accentColor ?? t.accent;
  const surface = t.surface;

  const hasBgImage   = Boolean(slide.imageUrl && slide.imagePosition === "background");
  const hasRightImg  = Boolean(slide.imageUrl && slide.imagePosition === "right");
  const hasLeftImg   = Boolean(slide.imageUrl && slide.imagePosition === "left");

  const base: React.CSSProperties = {
    width: "100%", aspectRatio: "16/9", backgroundColor: bg,
    position: "relative", overflow: "hidden", display: "flex",
    flexDirection: "row", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
  };

  const fullBleed: React.CSSProperties = {
    position: "absolute", inset: 0,
    backgroundImage: `url(${slide.imageUrl})`,
    backgroundSize: "cover", backgroundPosition: "center",
  };

  const overlay = (opacity = 0.55): React.CSSProperties => ({
    position: "absolute", inset: 0,
    backgroundColor: `rgba(0,0,0,${opacity})`,
  });

  const pad: React.CSSProperties = {
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column", justifyContent: "center",
    padding: "6% 7%",
    flex: (hasRightImg || hasLeftImg) ? "0 0 58%" : 1,
  };

  // ── Decorative accent pill ──────────────────────────────────────────────────
  const AccentPill = ({ short = false }: { short?: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "4%" }}>
      <div style={{ width: short ? 24 : 36, height: 3, backgroundColor: accent, borderRadius: 99 }} />
      {!short && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: accent, opacity: 0.5 }} />}
    </div>
  );

  // ── TITLE SLIDE ────────────────────────────────────────────────────────────
  if (slide.layout === "title") {
    return (
      <div style={base}>
        {hasBgImage && <><div style={fullBleed} /><div style={overlay(0.52)} /></>}
        {/* Geometric bg decoration (only when no image) */}
        {!hasBgImage && (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <div style={{ position: "absolute", right: "-10%", top: "-20%", width: "55%", aspectRatio: "1", borderRadius: "50%", background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)` }} />
            <div style={{ position: "absolute", left: "-5%", bottom: "-25%", width: "40%", aspectRatio: "1", borderRadius: "50%", background: `radial-gradient(circle, ${accent}15 0%, transparent 70%)` }} />
          </div>
        )}
        <div style={{ ...pad, alignItems: "center", justifyContent: "center", textAlign: "center", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "5%", justifyContent: "center" }}>
            <div style={{ width: 40, height: 3, backgroundColor: accent, borderRadius: 99 }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: accent }} />
            <div style={{ width: 40, height: 3, backgroundColor: accent, borderRadius: 99 }} />
          </div>
          {slide.title && <h1 style={{ fontSize: "clamp(1.5rem, 4.5vw, 3rem)", fontWeight: 800, color: fg, lineHeight: 1.15, marginBottom: "3%", letterSpacing: "-0.01em" }}>{slide.title}</h1>}
          {slide.subtitle && <p style={{ fontSize: "clamp(0.8rem, 2vw, 1.15rem)", color: hasBgImage ? `${fg}cc` : muted, lineHeight: 1.55, maxWidth: "75%", margin: "0 auto" }}>{slide.subtitle}</p>}
        </div>
      </div>
    );
  }

  // ── SECTION BREAK ──────────────────────────────────────────────────────────
  if (slide.layout === "section-break") {
    const sectionBg = slide.bgColor ?? accent;
    const sectionFg = slide.textColor ?? autoTextColor(sectionBg);
    return (
      <div style={{ ...base, backgroundColor: sectionBg }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 60%)` }} />
        <div style={{ ...pad, alignItems: "center", justifyContent: "center", textAlign: "center", flex: 1 }}>
          <div style={{ width: 48, height: 2, backgroundColor: `${sectionFg}50`, marginBottom: "4%", alignSelf: "center", borderRadius: 99 }} />
          {slide.title && <h2 style={{ fontSize: "clamp(1.3rem, 4vw, 2.4rem)", fontWeight: 800, color: sectionFg, lineHeight: 1.2, letterSpacing: "-0.01em" }}>{slide.title}</h2>}
          {slide.subtitle && <p style={{ fontSize: "clamp(0.75rem, 1.8vw, 1rem)", color: `${sectionFg}bb`, marginTop: "3%", lineHeight: 1.5 }}>{slide.subtitle}</p>}
        </div>
      </div>
    );
  }

  // ── IMAGE FULL ─────────────────────────────────────────────────────────────
  if (slide.layout === "image-full") {
    return (
      <div style={base}>
        {slide.imageUrl
          ? <div style={fullBleed} />
          : <div style={{ position: "absolute", inset: 0, backgroundColor: accent }} />
        }
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)" }} />
        <div style={{ position: "absolute", bottom: "7%", left: "7%", right: "20%", zIndex: 1 }}>
          <div style={{ width: 28, height: 3, backgroundColor: accent, borderRadius: 99, marginBottom: "2.5%" }} />
          {slide.title && <h2 style={{ fontSize: "clamp(1.1rem, 3vw, 2rem)", fontWeight: 800, color: "#ffffff", lineHeight: 1.2, marginBottom: "1.5%", letterSpacing: "-0.01em" }}>{slide.title}</h2>}
          {(slide.subtitle ?? slide.body) && <p style={{ fontSize: "clamp(0.7rem, 1.6vw, 0.95rem)", color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}><InlineMarkdown text={slide.subtitle ?? slide.body ?? ""} /></p>}
        </div>
      </div>
    );
  }

  // ── QUOTE ──────────────────────────────────────────────────────────────────
  if (slide.layout === "quote") {
    return (
      <div style={base}>
        {hasBgImage && <><div style={fullBleed} /><div style={overlay(0.6)} /></>}
        {!hasBgImage && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${bg} 60%, ${accent}18 100%)` }} />}
        <div style={{ ...pad, flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <div style={{ fontSize: "clamp(4rem, 10vw, 7rem)", fontWeight: 900, color: accent, lineHeight: 0.6, marginBottom: "2%", opacity: 0.6, fontFamily: "Georgia,serif" }}>"</div>
          <p style={{ fontSize: "clamp(0.9rem, 2.4vw, 1.4rem)", fontStyle: "italic", color: fg, lineHeight: 1.6, marginBottom: "5%", maxWidth: "78%" }}>
            <InlineMarkdown text={slide.body ?? slide.title ?? ""} />
          </p>
          {slide.subtitle && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <div style={{ width: 20, height: 1, backgroundColor: accent }} />
              <p style={{ fontSize: "clamp(0.65rem, 1.5vw, 0.85rem)", color: accent, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{slide.subtitle}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── TWO COLUMN ─────────────────────────────────────────────────────────────
  if (slide.layout === "two-column") {
    return (
      <div style={base}>
        <div style={{ ...pad, flex: 1 }}>
          <AccentPill />
          {slide.title && <h2 style={{ fontSize: "clamp(0.9rem, 2.3vw, 1.45rem)", fontWeight: 800, color: fg, marginBottom: "4%", lineHeight: 1.25 }}>{slide.title}</h2>}
          <div style={{ display: "flex", flex: 1, gap: "4%" }}>
            <div style={{ flex: 1, paddingRight: "4%", borderRight: `1px solid ${accent}28`, fontSize: "clamp(0.62rem, 1.4vw, 0.82rem)", color: muted, lineHeight: 1.7 }}>
              {slide.leftContent && <InlineMarkdown text={slide.leftContent} />}
            </div>
            <div style={{ flex: 1, fontSize: "clamp(0.62rem, 1.4vw, 0.82rem)", color: muted, lineHeight: 1.7 }}>
              {slide.rightContent && <InlineMarkdown text={slide.rightContent} />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STATS / KPI ────────────────────────────────────────────────────────────
  if (slide.layout === "stats" && slide.stats?.length) {
    const cols = slide.stats.length <= 2 ? 2 : slide.stats.length === 3 ? 3 : 4;
    return (
      <div style={base}>
        {!hasBgImage && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(140deg, ${bg} 50%, ${accent}12 100%)` }} />}
        {hasBgImage && <><div style={fullBleed} /><div style={overlay(0.65)} /></>}
        <div style={{ ...pad, flex: 1, justifyContent: "center" }}>
          <AccentPill />
          {slide.title && <h2 style={{ fontSize: "clamp(0.85rem, 2vw, 1.2rem)", fontWeight: 700, color: fg, marginBottom: "5%", lineHeight: 1.3 }}>{slide.title}</h2>}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "3%" }}>
            {slide.stats.map((s, i) => (
              <div key={i} style={{ backgroundColor: surface, borderRadius: 8, padding: "5% 4%", border: `1px solid ${accent}20` }}>
                {s.icon && <div style={{ fontSize: "clamp(1rem, 2.5vw, 1.6rem)", marginBottom: "4%" }}>{s.icon}</div>}
                <div style={{ fontSize: "clamp(1.4rem, 4vw, 2.6rem)", fontWeight: 900, color: accent, lineHeight: 1, marginBottom: "6%" }}>{s.value}</div>
                <div style={{ fontSize: "clamp(0.55rem, 1.3vw, 0.75rem)", color: fg, fontWeight: 600, marginBottom: "3%", lineHeight: 1.3 }}>{s.label}</div>
                {s.delta && <div style={{ fontSize: "clamp(0.5rem, 1.1vw, 0.65rem)", color: s.delta.startsWith("↓") || s.delta.startsWith("-") ? "#f87171" : "#34d399", fontWeight: 700 }}>{s.delta}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── CHART ──────────────────────────────────────────────────────────────────
  if (slide.layout === "chart" && slide.chartData) {
    const cd = slide.chartData;
    return (
      <div style={base}>
        <div style={{ ...pad, flex: 1 }}>
          <AccentPill />
          {slide.title && <h2 style={{ fontSize: "clamp(0.85rem, 2vw, 1.2rem)", fontWeight: 800, color: fg, marginBottom: slide.subtitle ? "1%" : "5%", lineHeight: 1.25 }}>{slide.title}</h2>}
          {slide.subtitle && <p style={{ fontSize: "clamp(0.58rem, 1.3vw, 0.78rem)", color: muted, marginBottom: "4%", lineHeight: 1.4 }}>{slide.subtitle}</p>}
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            {cd.type === "donut"
              ? <SlideDonutChart labels={cd.labels} values={cd.values} colors={cd.colors} fg={fg} muted={muted} accent={accent} />
              : <SlideBarChart labels={cd.labels} values={cd.values} colors={cd.colors} unit={cd.unit} fg={fg} muted={muted} accent={accent} />
            }
          </div>
        </div>
      </div>
    );
  }

  // ── TIMELINE ───────────────────────────────────────────────────────────────
  if (slide.layout === "timeline" && slide.timeline?.length) {
    const events = slide.timeline;
    return (
      <div style={base}>
        <div style={{ ...pad, flex: 1, justifyContent: "center" }}>
          <AccentPill />
          {slide.title && <h2 style={{ fontSize: "clamp(0.85rem, 2vw, 1.2rem)", fontWeight: 800, color: fg, marginBottom: "5%", lineHeight: 1.25 }}>{slide.title}</h2>}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 0, position: "relative" }}>
            {/* Connector line */}
            <div style={{ position: "absolute", top: "11px", left: 0, right: 0, height: 2, backgroundColor: `${accent}30`, zIndex: 0 }} />
            {events.map((ev, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative", zIndex: 1, paddingLeft: i > 0 ? "2%" : 0, paddingRight: i < events.length - 1 ? "2%" : 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: i === 0 ? accent : `${accent}50`, border: `3px solid ${bg}`, marginBottom: "8%", flexShrink: 0 }} />
                <div style={{ fontSize: "clamp(0.5rem, 1.1vw, 0.65rem)", color: accent, fontWeight: 700, marginBottom: "4%", letterSpacing: "0.04em" }}>{ev.date}</div>
                <div style={{ fontSize: "clamp(0.58rem, 1.3vw, 0.78rem)", color: fg, fontWeight: 700, lineHeight: 1.3, marginBottom: "4%" }}>{ev.event}</div>
                {ev.detail && <div style={{ fontSize: "clamp(0.5rem, 1.1vw, 0.63rem)", color: muted, lineHeight: 1.45 }}>{ev.detail}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── BIG NUMBER ─────────────────────────────────────────────────────────────
  if (slide.layout === "big-number") {
    return (
      <div style={base}>
        {!hasBgImage && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${bg} 40%, ${accent}18 100%)` }} />}
        {hasBgImage && <><div style={fullBleed} /><div style={overlay(0.62)} /></>}
        <div style={{ ...pad, flex: 1, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          {slide.title && <div style={{ fontSize: "clamp(3rem, 10vw, 6.5rem)", fontWeight: 900, color: accent, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: "2%" }}>{slide.title}</div>}
          {slide.subtitle && <div style={{ fontSize: "clamp(0.9rem, 2.2vw, 1.3rem)", fontWeight: 700, color: fg, marginBottom: "3%", letterSpacing: "0.02em", textTransform: "uppercase" }}>{slide.subtitle}</div>}
          {slide.body && <p style={{ fontSize: "clamp(0.68rem, 1.6vw, 0.9rem)", color: muted, lineHeight: 1.6, maxWidth: "60%", margin: "0 auto" }}><InlineMarkdown text={slide.body} /></p>}
        </div>
      </div>
    );
  }

  // ── CONTENT / BULLETS (default) ────────────────────────────────────────────
  return (
    <div style={base}>
      {hasBgImage && <><div style={fullBleed} /><div style={overlay(0.5)} /></>}
      {hasLeftImg && (
        <div style={{ width: "42%", flexShrink: 0, backgroundImage: `url(${slide.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div style={{ height: "100%", background: "linear-gradient(to right, transparent 70%, rgba(0,0,0,0.18) 100%)" }} />
        </div>
      )}
      <div style={pad}>
        <AccentPill />
        {slide.title && <h2 style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.6rem)", fontWeight: 800, color: fg, marginBottom: "3%", lineHeight: 1.2, letterSpacing: "-0.01em" }}>{slide.title}</h2>}
        {slide.subtitle && <p style={{ fontSize: "clamp(0.62rem, 1.5vw, 0.85rem)", color: muted, marginBottom: "4%", lineHeight: 1.5, fontStyle: "italic" }}><InlineMarkdown text={slide.subtitle} /></p>}
        {slide.body && <p style={{ fontSize: "clamp(0.62rem, 1.5vw, 0.82rem)", color: hasBgImage ? `${fg}ee` : muted, lineHeight: 1.75 }}><InlineMarkdown text={slide.body} /></p>}
        {slide.bullets && slide.bullets.length > 0 && (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "2.5%" }}>
            {slide.bullets.map((b, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "2.5%", fontSize: "clamp(0.62rem, 1.45vw, 0.83rem)", color: hasBgImage ? `${fg}ee` : muted, lineHeight: 1.55 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: accent, flexShrink: 0, marginTop: "0.35em" }} />
                <span><InlineMarkdown text={b} /></span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasRightImg && (
        <div style={{ width: "42%", flexShrink: 0, backgroundImage: `url(${slide.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}>
          <div style={{ height: "100%", background: "linear-gradient(to left, transparent 70%, rgba(0,0,0,0.18) 100%)" }} />
        </div>
      )}
    </div>
  );
}

// ─── Image Presentation Viewer ────────────────────────────────────────────────

function ImagePresentationViewer({
  data,
  slideIndex,
  onSlideChange,
}: {
  data: ImagePresentationData;
  slideIndex: number;
  onSlideChange: (i: number) => void;
}) {
  const total = data.slides.length;
  const slide = data.slides[Math.min(slideIndex, total - 1)];
  const prev = () => onSlideChange(Math.max(0, slideIndex - 1));
  const next = () => onSlideChange(Math.min(total - 1, slideIndex + 1));

  return (
    <div className="flex h-full flex-col bg-black select-none">
      {/* Slide canvas */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {slide?.imageUrl ? (
          <img
            key={slide.imageUrl}
            src={slide.imageUrl}
            alt={slide.caption ?? `Slide ${slideIndex + 1}`}
            className="max-h-full max-w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/40">
            <ImageIcon className="size-12 opacity-30" />
            <p className="text-sm">Generating slide {slideIndex + 1}…</p>
            <p className="text-xs max-w-xs text-center leading-relaxed opacity-70">{slide?.prompt}</p>
          </div>
        )}

        {/* Caption overlay */}
        {slide?.caption && slide.imageUrl && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-6 py-4">
            <p className="text-center text-sm text-white/90 font-medium">{slide.caption}</p>
          </div>
        )}

        {/* Nav arrows */}
        {slideIndex > 0 && (
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
          </button>
        )}
        {slideIndex < total - 1 && (
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
          </button>
        )}

        {/* Slide counter */}
        <div className="absolute top-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-xs text-white/80 backdrop-blur-sm">
          {slideIndex + 1} / {total}
        </div>
      </div>

      {/* Dot navigation */}
      {total > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-1.5 py-3">
          {data.slides.map((s, i) => (
            <button
              key={i}
              onClick={() => onSlideChange(i)}
              className={cn(
                "rounded-full transition-all",
                i === slideIndex
                  ? "size-2.5 bg-white"
                  : s.imageUrl
                  ? "size-1.5 bg-white/40 hover:bg-white/60"
                  : "size-1.5 bg-white/20 hover:bg-white/40",
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PresentationViewer({ data, slideIndex, onSlideChange, generations, onOpenImage }: PresentationViewerProps) {
  const total = data.slides.length;
  const slide = data.slides[slideIndex];
  const [showImageHint, setShowImageHint] = React.useState(false);

  /** Find the generationId for a given image URL by scanning session generations. */
  function findGenerationIdForUrl(url: string): string {
    for (const g of generations) {
      const found = findUrlInOutputs(g.outputs, url);
      if (found) return g.id;
    }
    return "";
  }

  function findUrlInOutputs(outputs: unknown, target: string): boolean {
    if (typeof outputs === "string") return outputs === target;
    if (Array.isArray(outputs)) return outputs.some((v) => findUrlInOutputs(v, target));
    if (outputs && typeof outputs === "object") {
      return Object.values(outputs as Record<string, unknown>).some((v) => findUrlInOutputs(v, target));
    }
    return false;
  }

  const slideImageUrl = slide?.imageUrl;

  return (
    <div className="flex h-full flex-col bg-black/5">
      {/* Slide preview */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden p-4"
        onMouseEnter={() => setShowImageHint(true)}
        onMouseLeave={() => setShowImageHint(false)}
      >
        <div className="w-full max-w-3xl" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.25)", borderRadius: 8, overflow: "hidden" }}>
          {slide && <PresentationSlideView slide={slide} theme={data.theme} />}
        </div>

        {/* "Open slide image" overlay button — only shows when slide has an image */}
        {slideImageUrl && showImageHint && (
          <button
            type="button"
            className="absolute bottom-6 right-6 flex items-center gap-1.5 rounded-lg border bg-background/90 px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-md backdrop-blur-sm transition hover:bg-background"
            onClick={() => {
              const genId = findGenerationIdForUrl(slideImageUrl);
              onOpenImage(slideImageUrl, genId);
            }}
          >
            <ImageIcon className="size-3.5 text-primary" />
            Open slide image
          </button>
        )}
      </div>

      {/* Navigation bar */}
      <div className="flex shrink-0 items-center justify-between border-t bg-background px-4 py-2.5">
        <button
          type="button"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          disabled={slideIndex === 0}
          onClick={() => onSlideChange(Math.max(0, slideIndex - 1))}
        >
          <ChevronLeft className="size-4" /> Prev
        </button>
        <div className="flex items-center gap-1">
          {data.slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={cn(
                "rounded-full transition-all",
                i === slideIndex
                  ? "w-4 h-2 bg-primary"
                  : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
              onClick={() => onSlideChange(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          disabled={slideIndex === total - 1}
          onClick={() => onSlideChange(Math.min(total - 1, slideIndex + 1))}
        >
          Next <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Speaker notes */}
      {slide?.notes && (
        <div className="shrink-0 border-t bg-muted/30 px-4 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Speaker notes</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{slide.notes}</p>
        </div>
      )}
    </div>
  );
}

type ZeepoAgentSkillRow = {
  id: string;
  category: string;
  title: string;
  description: string;
};

export default function ZeepoAiAgentSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { basePath, teamId } = useZeepoAgentRoute();
  const routeConfig = React.useMemo(
    () => ({ basePath, teamId, teamSlug: null, isCustomer: Boolean(teamId) }),
    [basePath, teamId],
  );
  const utils = trpc.useUtils();
  const refreshTokenBalance = React.useCallback(() => {
    refreshZeepoTokenBalance(utils, teamId);
  }, [utils, teamId]);
  const { handleBillingError } = useZeepoTokenBilling();

  const isComposeHandoff = hasComposeHandoff(location.state);
  const { data: authSession, isPending: authPending } = authClient.useSession();
  const [draft, setDraft] = React.useState("");
  const [skillsOpen, setSkillsOpen] = React.useState(false);
  const [selectedSkill, setSelectedSkill] = React.useState<ZeepoAgentSkillRow | null>(null);
  type ActivePanel =
    | { type: "media"; url: string; kind: GenerationMediaKind; generationId: string }
    | { type: "document"; title: string; content: string }
    | { type: "presentation"; data: PresentationData }
    | { type: "image-presentation"; data: ImagePresentationData }
    | null;
  const [activePanel, setActivePanel] = React.useState<ActivePanel>(null);
  const { open: sidebarOpen, setOpen: setSidebarOpen, openMobile, setOpenMobile, isMobile } =
    useSidebar();
  const [presentationSlideIndex, setPresentationSlideIndex] = React.useState(0);
  const [imagePresentationSlideIndex, setImagePresentationSlideIndex] = React.useState(0);
  const [docCopied, setDocCopied] = React.useState(false);
  const [generationsOpen, setGenerationsOpen] = React.useState(false);

  // ── Image-edit panel state ──────────────────────────────────────────────
  /** The image currently shown in the panel (may differ from activePanel.url after edits). */
  const [panelImageUrl, setPanelImageUrl] = React.useState("");
  /** Stack of previous image URLs for undo. */
  const [panelImageHistory, setPanelImageHistory] = React.useState<string[]>([]);
  /** Stack of URLs that were undone — cleared whenever a new edit is applied. */
  const [panelRedoStack, setPanelRedoStack] = React.useState<string[]>([]);
  const [editPrompt, setEditPrompt] = React.useState("");
  /** When true, the canvas brush overlay is active (inpainting mode). */
  const [editBrushMode, setEditBrushMode] = React.useState(false);
  const [brushSize, setBrushSize] = React.useState(28);
  const [hasDrawing, setHasDrawing] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const panelImgRef = React.useRef<HTMLImageElement>(null);
  const isDrawingOnCanvas = React.useRef(false);

  // ── Extended image-edit panel state ────────────────────────────────────────
  type ImageEditMode = "instruct" | "style" | "erase" | "background" | "upscale" | "text_edit" | "variations";
  const [editMode, setEditMode] = React.useState<ImageEditMode>("instruct");
  const [outputFormat, setOutputFormat] = React.useState<"webp" | "png">("webp");
  const [outputResolution, setOutputResolution] = React.useState<"1 MP" | "2 MP">("1 MP");
  const [showBeforeAfter, setShowBeforeAfter] = React.useState(false);
  const [customBgPrompt, setCustomBgPrompt] = React.useState("");
  const [variationsResult, setVariationsResult] = React.useState<Array<{ imageUrl: string; record: { id: string; label?: string | null } }>>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = React.useState(false);
  /** Tracks the current history entry id so next edits chain correctly. */
  const [panelHistoryEntryId, setPanelHistoryEntryId] = React.useState<string>("");
  /** True while any image-edit operation (style, erase, bg, etc.) is running. */
  const [editOpPending, setEditOpPending] = React.useState(false);
  /** Label for the loading overlay. */
  const [editOpLabel, setEditOpLabel] = React.useState("AI is editing your image…");

  const showEditError = React.useCallback(
    (error: unknown, fallback: string) => {
      setEditOpPending(false);
      if (!handleBillingError(error)) {
        const message = error instanceof Error ? error.message : fallback;
        toast.error(message || fallback);
      }
    },
    [handleBillingError],
  );

  const [questionFlow, setQuestionFlow] = React.useState<QuestionFlowState | null>(null);
  const [dismissedQuestionIds, setDismissedQuestionIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  /**
   * Pending attachments — stored as local File objects with a local preview URL.
   * Upload to UploadThing only happens when the user presses Send.
   */
  type PendingFile = { file: File; previewUrl: string; name: string; mimeType: string };
  const [pendingFiles, setPendingFiles] = React.useState<PendingFile[]>([]);
  /** Keep backwards-compat alias for already-uploaded attachments (e.g. from question flow). */
  const [pendingAttachments, setPendingAttachments] = React.useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = React.useState(false);
  const [isSwitchingChat, setIsSwitchingChat] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const threadScrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  /** Used only inside the question flow for per-question uploads */
  const questionFileInputRef = React.useRef<HTMLInputElement>(null);

  const sessionQuery = trpc.zeepoAgent.sessions.get.useQuery(
    { id: sessionId! },
    { enabled: Boolean(sessionId && authSession?.user), retry: 1 },
  );

  const genQuery = trpc.zeepoAgent.generate.listBySession.useQuery(
    { sessionId: sessionId! },
    {
      enabled: Boolean(sessionId && authSession?.user),
      retry: 1,
      refetchInterval: (q) => {
        const rows = q.state.data?.data ?? [];
        const pending = rows.some(
          (g: { status?: string }) => g.status === "QUEUED" || g.status === "PROCESSING",
        );
        return pending ? 2000 : false;
      },
    },
  );

  /**
   * Set of image URLs referenced by at least one presentation slide.
   * Drives the "Slide" badge on image generation cards.
   * Must stay before any early returns.
   */
  const slideImageUrls = React.useMemo<Set<string>>(() => {
    const urls = new Set<string>();
    for (const g of genQuery.data?.data ?? []) {
      if (g.modelCategory === "presentation") {
        const pres = extractPresentation(g.outputs);
        if (pres) for (const slide of pres.slides) { if (slide.imageUrl) urls.add(slide.imageUrl); }
      } else if (g.modelCategory === "image-presentation") {
        const pres = extractImagePresentation(g.outputs);
        if (pres) for (const slide of pres.slides) { if (slide.imageUrl) urls.add(slide.imageUrl); }
      }
    }
    return urls;
  }, [genQuery.data?.data]);

  // Loaded lazily when the chat history dropdown opens.
  const chatHistoryQuery = trpc.zeepoAgent.sessions.list.useQuery(
    zeepoAgentSessionsInput(routeConfig, { page: 1, limit: 50 }),
    { enabled: chatHistoryOpen && Boolean(authSession?.user), staleTime: 30_000 },
  );

  const generateTitle = trpc.zeepoAgent.chat.generateTitle.useMutation({
    onSuccess: (result) => {
      if (!sessionId || !result.title) return;
      utils.zeepoAgent.sessions.get.setData({ id: sessionId }, (prev) =>
        prev?.data
          ? { ...prev, data: { ...prev.data, title: result.title } }
          : prev,
      );
      void utils.zeepoAgent.sessions.list.invalidate();
    },
    onError: () => {
      // Silently fail — title stays "New chat", no toast needed for background task.
      titleGenFired.current = false; // allow a retry next time the user sends a message
    },
  });

  const createSession = trpc.zeepoAgent.sessions.create.useMutation();

  const handleNewChat = async () => {
    try {
      const res = await createSession.mutateAsync(zeepoAgentCreateSessionInput(routeConfig));
      void utils.zeepoAgent.sessions.list.invalidate();
      const id = res.data?.id;
      if (id) navigate(zeepoAgentSessionPath(basePath, id));
    } catch (e: unknown) {
      if (!handleBillingError(e)) {
        toast.error(e instanceof Error ? e.message : "Failed to create chat");
      }
    }
  };

  /** Shared helper — called after any image edit operation completes. */
  const applyEditResult = React.useCallback((newUrl: string, historyId?: string) => {
    setPanelImageHistory((h) => [panelImageUrl, ...h]);
    setPanelRedoStack([]);
    setPanelImageUrl(newUrl);
    if (historyId) setPanelHistoryEntryId(historyId);
    setHasDrawing(false);
    setVariationsResult([]);
    setEditOpPending(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current)
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelImageUrl]);

  const editImage = trpc.zeepoAgent.chat.editImage.useMutation({
    onSuccess: (result) => {
      if (!result.imageUrl) return;
      applyEditResult(result.imageUrl);
      setEditPrompt("");
      refreshTokenBalance();
    },
    onError: (e) => showEditError(e, "Image edit failed"),
  });

  const styleTransfer = trpc.zeepoAgent.imageEdits.styleTransfer.useMutation({
    onSuccess: (r) => {
      applyEditResult(r.imageUrl, r.record.id);
      refreshTokenBalance();
    },
    onError: (e) => showEditError(e, "Style transfer failed"),
  });

  const eraseObject = trpc.zeepoAgent.imageEdits.eraseObject.useMutation({
    onSuccess: (r) => {
      applyEditResult(r.imageUrl, r.record.id);
      refreshTokenBalance();
    },
    onError: (e) => showEditError(e, "Erase failed"),
  });

  const swapBackground = trpc.zeepoAgent.imageEdits.swapBackground.useMutation({
    onSuccess: (r) => {
      applyEditResult(r.imageUrl, r.record.id);
      refreshTokenBalance();
    },
    onError: (e) => showEditError(e, "Background swap failed"),
  });

  const upscaleImage = trpc.zeepoAgent.imageEdits.upscaleImage.useMutation({
    onSuccess: (r) => {
      applyEditResult(r.imageUrl, r.record.id);
      refreshTokenBalance();
    },
    onError: (e) => showEditError(e, "Upscale failed"),
  });

  const editText = trpc.zeepoAgent.imageEdits.editText.useMutation({
    onSuccess: (r) => {
      applyEditResult(r.imageUrl, r.record.id);
      setEditPrompt("");
      refreshTokenBalance();
    },
    onError: (e) => showEditError(e, "Text edit failed"),
  });

  const generateVariations = trpc.zeepoAgent.imageEdits.generateVariations.useMutation({
    onSuccess: (r) => {
      setEditOpPending(false);
      setVariationsResult((r.variations ?? []).filter(Boolean) as typeof variationsResult);
      refreshTokenBalance();
    },
    onError: (e) => showEditError(e, "Variations failed"),
  });

  const saveEditedImage = trpc.zeepoAgent.imageEdits.saveEditedImage.useMutation({
    onSuccess: (r) => setPanelHistoryEntryId(r.record.id),
  });

  const panelGenerationId =
    activePanel?.type === "media" ? (activePanel as { generationId?: string }).generationId ?? "" : "";

  const editHistoryQuery = trpc.zeepoAgent.imageEdits.listEditHistory.useQuery(
    { generationId: panelGenerationId },
    { enabled: showHistoryDrawer && Boolean(panelGenerationId), staleTime: 0 },
  );

  const skillsQuery = trpc.zeepoAgent.skills.list.useQuery(undefined, {
    enabled: Boolean(authSession?.user),
    staleTime: 60 * 60 * 1000,
  });

  const skillsByCategory = React.useMemo(() => {
    const rows: ZeepoAgentSkillRow[] = skillsQuery.data?.data ?? [];
    const order: string[] = [];
    const buckets = new Map<string, ZeepoAgentSkillRow[]>();
    for (const s of rows) {
      if (!buckets.has(s.category)) {
        order.push(s.category);
        buckets.set(s.category, []);
      }
      buckets.get(s.category)!.push(s);
    }
    return order.map((cat) => [cat, buckets.get(cat)!] as const);
  }, [skillsQuery.data?.data]);

  const send = trpc.zeepoAgent.chat.sendMessage.useMutation({
    onMutate: async (variables) => {
      const { sessionId: sid, content, skillId } = variables;
      await utils.zeepoAgent.sessions.get.cancel({ id: sid });
      const previous = utils.zeepoAgent.sessions.get.getData({ id: sid });
      if (!previous?.data) return { previous };

      const optimisticMessage = {
        id: `optimistic-user-${Date.now()}`,
        sessionId: sid,
        role: "user" as const,
        content,
        toolCalls: null,
        toolCallId: null,
        metadata: skillId ? { skillId } : null,
        createdAt: new Date(),
      };

      utils.zeepoAgent.sessions.get.setData({ id: sid }, {
        ...previous,
        data: {
          ...previous.data,
          messages: [...(previous.data.messages ?? []), optimisticMessage],
        },
      });
      return { previous };
    },
    onError: (e, variables, context) => {
      if (context?.previous) {
        utils.zeepoAgent.sessions.get.setData({ id: sessionId! }, context.previous);
      }
      if (variables?.content) {
        setDraft(variables.content);
      }
      if (!handleBillingError(e)) {
        toast.error(e.message || "Failed to send");
      }
    },
    onSuccess: (result) => {
      setDraft("");
      // Apply server session immediately so assistant + tool rows appear without waiting
      // for invalidate/refetch (avoids a blank frame where isPending is false but messages lag).
      if (sessionId && result?.data) {
        utils.zeepoAgent.sessions.get.setData({ id: sessionId }, (prev) =>
          prev ? { ...prev, data: result.data } : prev,
        );
      }
      void utils.zeepoAgent.sessions.get.invalidate({ id: sessionId! });
      void utils.zeepoAgent.generate.listBySession.invalidate({ sessionId: sessionId! });
      refreshTokenBalance();

      // Auto-generate title after the 3rd user message if still "New chat".
      if (!sessionId) return;
      const currentTitle = (result?.data?.title ?? "").trim();
      if (currentTitle && currentTitle !== "New chat") return;
      const userCount = (result?.data?.messages ?? []).filter(
        (m: { role?: string }) => m.role === "user",
      ).length;
      if (userCount >= 3) {
        generateTitle.mutate({ sessionId });
      }
    },
  });

  const messagesForThinking = sessionQuery.data?.data?.messages ?? [];
  const hasOptimisticUserBubble = messagesForThinking.some(
    (m: { id?: string }) => typeof m.id === "string" && m.id.startsWith("optimistic-user-"),
  );
  const hasAssistantReply = (sessionQuery.data?.data?.messages ?? []).some(
    (m: { role?: string }) => m.role === "assistant",
  );
  const showAssistantThinking =
    send.isPending ||
    (sessionQuery.isFetching && hasOptimisticUserBubble) ||
    (isComposeHandoff && !hasAssistantReply);

  // True once the agent has emitted at least one assistant message in the current pending turn
  // (i.e. intermediate messages from tool iterations are already visible).
  const hasIntermediateReplies = React.useMemo(() => {
    if (!send.isPending) return false;
    const msgs = sessionQuery.data?.data?.messages ?? [];
    const lastUserIdx = [...msgs].reverse().findIndex(
      (m: { role?: string }) => m.role === "user",
    );
    if (lastUserIdx < 0) return false;
    const afterUser = msgs.slice(msgs.length - lastUserIdx);
    return afterUser.some((m: { role?: string }) => m.role === "assistant");
  }, [send.isPending, sessionQuery.data?.data?.messages]);

  // Detect pending clarifying questions: last assistant message with questions,
  // no user message after it, and not dismissed by the user.
  const pendingQuestionsInfo = React.useMemo<{
    messageId: string;
    questions: ClarifyingQuestion[];
  } | null>(() => {
    const msgs = sessionQuery.data?.data?.messages ?? [];
    let lastAsstWithQIdx = -1;
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i] as { role: string; id: string; metadata?: unknown };
      if (m.role === "assistant") {
        const meta = m.metadata as Record<string, unknown> | null | undefined;
        const qs = meta?.clarifyingQuestions;
        if (Array.isArray(qs) && qs.length > 0) lastAsstWithQIdx = i;
      }
    }
    if (lastAsstWithQIdx < 0) return null;
    // Answered: a user message exists after the question message.
    for (let i = lastAsstWithQIdx + 1; i < msgs.length; i++) {
      if ((msgs[i] as { role: string }).role === "user") return null;
    }
    const m = msgs[lastAsstWithQIdx] as { id: string; metadata?: unknown };
    if (dismissedQuestionIds.has(m.id)) return null;
    const meta = m.metadata as Record<string, unknown>;
    return {
      messageId: m.id,
      questions: meta.clarifyingQuestions as ClarifyingQuestion[],
    };
  }, [sessionQuery.data?.data?.messages, dismissedQuestionIds]);

  // Sync questionFlow state when a new trigger message appears.
  React.useEffect(() => {
    if (!pendingQuestionsInfo) {
      setQuestionFlow(null);
      return;
    }
    setQuestionFlow((prev) => {
      if (prev?.triggerMessageId === pendingQuestionsInfo.messageId) return prev;
      return {
        triggerMessageId: pendingQuestionsInfo.messageId,
        currentIndex: 0,
        answers: [],
        customText: "",
        showCustom: false,
        uploadAttachments: [],
        isUploadingForStep: false,
        pendingUploadForStep: undefined,
      };
    });
  }, [pendingQuestionsInfo?.messageId]);

  function compileQuestionAnswers(questions: ClarifyingQuestion[], answers: string[]): string {
    return questions
      .map((q, i) => `${i + 1}. ${q.question}\n   → ${answers[i] ?? "(no answer)"}`)
      .join("\n\n");
  }

  function advanceQuestion(answer: string, uploadedAttachment?: Attachment) {
    if (!questionFlow || !pendingQuestionsInfo) return;
    // Update the answer at the current index (supports re-answering revisited steps).
    const newAnswers = [...questionFlow.answers];
    newAnswers[questionFlow.currentIndex] = answer;
    // Track any upload attachment for this step so it's sent with the final answers.
    const newUploadAttachments = [...(questionFlow.uploadAttachments ?? [])];
    if (uploadedAttachment) newUploadAttachments.push(uploadedAttachment);
    const nextIndex = questionFlow.currentIndex + 1;
    const isLast = nextIndex >= pendingQuestionsInfo.questions.length;
    if (isLast) {
      const compiled = compileQuestionAnswers(pendingQuestionsInfo.questions, newAnswers);
      setQuestionFlow(null);
      setDraft("");
      queueMicrotask(() => {
        send.mutate({
          sessionId: sessionId!,
          content: compiled,
          ...(newUploadAttachments.length ? { attachments: newUploadAttachments } : {}),
        });
      });
      return;
    }
    // Restore custom-text state if the next question already has a non-option answer.
    const nextAnswer = newAnswers[nextIndex];
    const nextQ = pendingQuestionsInfo.questions[nextIndex];
    const nextIsCustom =
      nextAnswer !== undefined && nextQ !== undefined && !nextQ.options.includes(nextAnswer);
    setQuestionFlow({
      ...questionFlow,
      currentIndex: nextIndex,
      answers: newAnswers,
      uploadAttachments: newUploadAttachments,
      customText: nextIsCustom ? nextAnswer : "",
      showCustom: nextIsCustom,
      isUploadingForStep: false,
      pendingUploadForStep: undefined,
    });
  }

  /** Navigate to any already-visited or already-answered step. */
  function goToQuestion(targetIndex: number) {
    if (!questionFlow || !pendingQuestionsInfo) return;
    if (targetIndex < 0 || targetIndex >= pendingQuestionsInfo.questions.length) return;
    const existingAnswer = questionFlow.answers[targetIndex];
    const targetQ = pendingQuestionsInfo.questions[targetIndex];
    const isCustom =
      existingAnswer !== undefined &&
      targetQ !== undefined &&
      !targetQ.options.includes(existingAnswer);
    setQuestionFlow({
      ...questionFlow,
      currentIndex: targetIndex,
      customText: isCustom ? existingAnswer : "",
      showCustom: isCustom,
    });
  }

  function handleQuestionOptionSelect(opt: string) {
    if (opt === "__other__") {
      setQuestionFlow((prev) => (prev ? { ...prev, showCustom: true, customText: "" } : prev));
      return;
    }
    advanceQuestion(opt);
  }

  /**
   * Stage files locally — create a blob preview URL, do NOT upload yet.
   * Upload happens in sendCurrentDraft just before sending.
   * When onUploaded is provided (question-flow uploads) we upload immediately
   * because the answer needs the real URL.
   */
  async function handleFileSelect(files: FileList | null, onUploaded?: (a: Attachment) => void) {
    if (!files?.length) return;

    // Immediate-upload path: used by question flow or other callers that need a real URL now.
    if (onUploaded) {
      setIsUploading(true);
      try {
        const results = await uploadZeepoAgentFiles({ files: Array.from(files) });
        const uploaded: Attachment[] = results.map((r, i) => ({
          url: uploadThingFileUrl(r),
          name: files[i]?.name ?? r.name ?? "attachment",
          mimeType: files[i]?.type ?? "image/*",
        }));
        uploaded.forEach(onUploaded);
      } catch (e) {
        toast.error(uploadErrorMessage(e));
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // Deferred-upload path: stage locally for the main chat input.
    const incoming = Array.from(files).slice(0, 4);
    const staged: PendingFile[] = incoming.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      name: f.name,
      mimeType: f.type || "image/*",
    }));
    setPendingFiles((prev) => {
      // Revoke old blobs that will be replaced to avoid leaks
      const combined = [...prev, ...staged].slice(0, 4);
      return combined;
    });
  }

  const sendCurrentDraft = React.useCallback(() => {
    const t = draft.trim();
    const stagedFiles = pendingFiles.length ? [...pendingFiles] : [];
    const alreadyUploaded = pendingAttachments.length ? [...pendingAttachments] : [];
    const hasContent = Boolean(t) || stagedFiles.length > 0 || alreadyUploaded.length > 0;
    if (!hasContent || showAssistantThinking || isUploading || !sessionId) return;
    const messageText = t || (stagedFiles.length || alreadyUploaded.length ? "See attached." : "");

    // Upload staged files on Send, then persist message with returned URLs.
    if (stagedFiles.length) {
      setIsUploading(true);
      uploadZeepoAgentFiles({ files: stagedFiles.map((f) => f.file) })
        .then((results) => {
          const uploaded: Attachment[] = results.map((r, i) => ({
            url: uploadThingFileUrl(r),
            name: stagedFiles[i]?.name ?? r.name ?? "attachment",
            mimeType: stagedFiles[i]?.mimeType ?? "image/*",
          }));
          const allAttachments = [...alreadyUploaded, ...uploaded];
          setDraft("");
          setPendingFiles((prev) => {
            prev.forEach((f) => URL.revokeObjectURL(f.previewUrl));
            return [];
          });
          setPendingAttachments([]);
          send.mutate({
            sessionId: sessionId!,
            content: messageText,
            ...(selectedSkill ? { skillId: selectedSkill.id } : {}),
            ...(allAttachments.length ? { attachments: allAttachments } : {}),
          });
        })
        .catch((e) => {
          toast.error(uploadErrorMessage(e));
        })
        .finally(() => setIsUploading(false));
      return;
    }

    setDraft("");
    setPendingAttachments([]);
    queueMicrotask(() => {
      send.mutate({
        sessionId: sessionId!,
        content: messageText,
        ...(selectedSkill ? { skillId: selectedSkill.id } : {}),
        ...(alreadyUploaded.length ? { attachments: alreadyUploaded } : {}),
      });
    });
  }, [draft, pendingFiles, pendingAttachments, send, sessionId, selectedSkill, showAssistantThinking, isUploading]);

  // ── Auto-send initial message from index page navigation state ──────────
  const autoSentRef = React.useRef(false);
  const sendRef = React.useRef(send.mutate);
  sendRef.current = send.mutate;

  React.useEffect(() => {
    if (autoSentRef.current) return;
    if (!sessionId) return;
    const navState = location.state as ZeepoComposeHandoffState | null;
    if (!navState?.fromCompose) return;

    const { initialMessage, initialSkillId, initialAttachments } = navState;
    // Wait until the session has loaded before sending
    if (!sessionQuery.data?.data) return;
    // Only fire when session has no messages yet
    if ((sessionQuery.data.data.messages ?? []).length > 0) return;

    autoSentRef.current = true;

    // Pre-select skill if provided
    if (initialSkillId) {
      const allSkills = skillsQuery.data?.data ?? [];
      const skill = allSkills.find((s) => s.id === initialSkillId);
      if (skill) setSelectedSkill(skill);
    }

    if (initialMessage?.trim()) {
      queueMicrotask(() => {
        sendRef.current({
          sessionId: sessionId!,
          content: initialMessage.trim(),
          ...(initialSkillId ? { skillId: initialSkillId } : {}),
          ...(initialAttachments?.length ? { attachments: initialAttachments } : {}),
        });
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionQuery.data?.data, sessionId, location.state]);

  // While a send mutation is in-flight the agent iterates multiple turns, each writing new
  // On page load: if the session already has ≥3 user messages but still carries the
  // default title, kick off title generation immediately in the background.
  // titleGenFired prevents duplicate calls across re-renders.
  const titleGenFired = React.useRef(false);
  const generateTitleRef = React.useRef(generateTitle.mutate);
  generateTitleRef.current = generateTitle.mutate;

  React.useEffect(() => {
    if (titleGenFired.current) return;
    if (!sessionId) return;
    const session = sessionQuery.data?.data;
    if (!session) return;
    const currentTitle = (session.title ?? "").trim();
    if (currentTitle && currentTitle !== "New chat") return;
    const userCount = (session.messages ?? []).filter(
      (m: { role?: string }) => m.role === "user",
    ).length;
    if (userCount < 3) return;
    titleGenFired.current = true;
    generateTitleRef.current({ sessionId });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionQuery.data?.data?.title, sessionQuery.data?.data?.messages?.length, sessionId]);

  // assistant + tool messages to the DB. Poll the session every 2 s so those intermediate
  // bubbles appear progressively instead of all at once when the mutation finally resolves.
  React.useEffect(() => {
    if (!send.isPending || !sessionId) return;
    const id = setInterval(() => {
      void utils.zeepoAgent.sessions.get.refetch({ id: sessionId });
      void utils.zeepoAgent.generate.listBySession.refetch({ sessionId });
      refreshTokenBalance();
    }, 2000);
    return () => clearInterval(id);
  }, [send.isPending, sessionId, utils, refreshTokenBalance]);

  const hadPendingGeneration = React.useRef(false);
  React.useEffect(() => {
    if (!teamId) return;
    const rows = genQuery.data?.data ?? [];
    const pending = rows.some(
      (g: { status?: string }) => g.status === "QUEUED" || g.status === "PROCESSING",
    );
    if (pending) {
      hadPendingGeneration.current = true;
      const id = setInterval(() => refreshTokenBalance(), 2000);
      return () => clearInterval(id);
    }
    if (hadPendingGeneration.current) {
      hadPendingGeneration.current = false;
      refreshTokenBalance();
    }
  }, [genQuery.data?.data, teamId, refreshTokenBalance]);

  // Once the route param changes the new session has loaded — clear the switching flag
  // and reset the title-generation guard so it can fire for the new session.
  React.useEffect(() => {
    setIsSwitchingChat(false);
    titleGenFired.current = false;
  }, [sessionId]);

  React.useEffect(() => {
    const el = threadScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [sessionQuery.data?.data?.messages?.length, showAssistantThinking]);

  // Collapse the agency nav sidebar when any preview panel opens (only if currently expanded).
  const isPreviewPanelOpen = Boolean(activePanel);
  const isImageEditPanelOpen =
    activePanel?.type === "media" && activePanel.kind === "image";

  React.useEffect(() => {
    if (!isPreviewPanelOpen) return;
    if (isMobile) {
      if (openMobile) setOpenMobile(false);
      return;
    }
    if (sidebarOpen) setSidebarOpen(false);
  }, [
    isPreviewPanelOpen,
    isMobile,
    sidebarOpen,
    openMobile,
    setSidebarOpen,
    setOpenMobile,
  ]);

  // Reset image-edit state whenever we open a new image in the panel.
  React.useEffect(() => {
    if (activePanel?.type === "media" && activePanel.kind === "image") {
      setPanelImageUrl(activePanel.url);
      setPanelImageHistory([]);
      setPanelRedoStack([]);
      setEditPrompt("");
      setEditBrushMode(false);
      setHasDrawing(false);
      setEditMode("instruct");
      setVariationsResult([]);
      setShowBeforeAfter(false);
      setPanelHistoryEntryId("");
      setCustomBgPrompt("");
      setEditOpPending(false);
      // Persist the original image as the first history snapshot (fire-and-forget).
      if (sessionId && activePanel.generationId) {
        saveEditedImage.mutate({
          sessionId,
          generationId: activePanel.generationId,
          imageUrl: activePanel.url,
          operationType: "original",
          label: "Original",
        });
      }
    }
  // Depend on the image URL specifically so it fires when a different image is opened.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel?.type === "media" ? (activePanel as { type: "media"; url: string }).url : ""]);

  // Sync canvas dimensions to the rendered image whenever brush mode activates or image changes.
  React.useEffect(() => {
    if (!editBrushMode) return;
    const sync = () => {
      const img = panelImgRef.current;
      const canvas = canvasRef.current;
      if (!img || !canvas) return;
      canvas.width = img.clientWidth;
      canvas.height = img.clientHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawing(false);
    };
    const raf = requestAnimationFrame(sync);
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sync);
    };
  }, [editBrushMode, panelImageUrl]);

  /**
   * Resolve the theme's --primary colour to a canvas-compatible rgba() string.
   * Lets the browser resolve hsl(var(--primary)) via a hidden DOM element,
   * then blends toward white for a lighter brush tint. Cached in a ref.
   */
  const brushColorRef = React.useRef<string>("");
  const getBrushColor = React.useCallback((): string => {
    if (brushColorRef.current) return brushColorRef.current;
    try {
      const el = document.createElement("div");
      el.setAttribute(
        "style",
        "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;color:hsl(var(--primary))",
      );
      document.body.appendChild(el);
      const rgb = getComputedStyle(el).color; // "rgb(R, G, B)"
      document.body.removeChild(el);
      const m = rgb.match(/\d+/g);
      if (m && m.length >= 3) {
        const r = Math.round(parseInt(m[0]!) * 0.5 + 255 * 0.5);
        const g = Math.round(parseInt(m[1]!) * 0.5 + 255 * 0.5);
        const b = Math.round(parseInt(m[2]!) * 0.5 + 255 * 0.5);
        brushColorRef.current = `rgba(${r},${g},${b},0.82)`;
        return brushColorRef.current;
      }
    } catch { /* fall through */ }
    brushColorRef.current = "rgba(96,165,250,0.82)";
    return brushColorRef.current;
  }, []);

  if (authPending) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <Spinner size={32} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  }

  if (!authSession?.user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!sessionId) {
    return <Navigate to={basePath} replace />;
  }

  const sessionLoading =
    !sessionQuery.data?.data &&
    (sessionQuery.isPending || sessionQuery.isLoading);
  const sessionError = sessionQuery.isError;
  const sessionErr = sessionQuery.error;
  const notFound =
    sessionErr instanceof TRPCClientError && sessionErr.data?.code === "NOT_FOUND";
  const sessionErrorMessage = sessionErr?.message ?? "Could not load this chat.";

  if (sessionLoading) {
    return (
      <div className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden", ZEEPO_AGENCY_PAGE_SHELL)}>
        <div
          className={cn(
            "grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden",
            ZEEPO_AGENCY_PAGE_CONTENT,
          )}
        >
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <Skeleton className="h-8 min-w-0 flex-1 rounded-md" />
          <Skeleton className="size-8 shrink-0 rounded-md" />
        </div>
        <div className="zeepo-chat-thread min-h-0 overflow-y-auto">
          <ChatLoadingSkeleton />
        </div>
        <div className="w-full opacity-50">
          <Skeleton className="h-[120px] w-full rounded-2xl" />
        </div>
        </div>
      </div>
    );
  }

  if (sessionError || !sessionQuery.data?.data) {
    return (
      <div className={cn("flex w-full flex-col gap-4", ZEEPO_AGENCY_PAGE_SHELL)}>
        <div className={cn("flex flex-col gap-4", ZEEPO_AGENCY_PAGE_CONTENT)}>
        <Button variant="ghost" size="sm" className="w-fit gap-2" asChild>
          <Link to={basePath}>
            <ArrowLeftIcon className="size-4" />
            All chats
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{notFound ? "Chat not found" : "Something went wrong"}</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0">
              {notFound
                ? "This conversation may have been deleted or the link is invalid."
                : sessionErrorMessage}
            </span>
            {!notFound ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-2 border-destructive/40"
                onClick={() => void sessionQuery.refetch()}
              >
                <RefreshCw className="size-3.5" />
                Try again
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
        </div>
      </div>
    );
  }

  const sessionRes = sessionQuery.data.data;

  // Deduplicate messages to prevent the optimistic user bubble (added in onMutate)
  // from appearing alongside the real DB user message during the polling window.
  // Rules:
  //   1. Drop exact ID duplicates (shouldn't happen, but belt-and-suspenders).
  //   2. Drop any optimistic-user-* entry if a real message with the same role+content exists.
  const messages = (() => {
    const raw: Array<{ id: string; role: string; content: string | null }> =
      sessionRes.messages ?? [];
    const seenIds = new Set<string>();
    const deduped = raw.filter((m) => {
      if (seenIds.has(m.id)) return false;
      seenIds.add(m.id);
      return true;
    });
    const realUserContents = new Set(
      deduped
        .filter((m) => m.role === "user" && !m.id.startsWith("optimistic-"))
        .map((m) => m.content),
    );
    return deduped.filter((m) => {
      if (m.id.startsWith("optimistic-") && realUserContents.has(m.content)) {
        return false;
      }
      return true;
    });
  })();

  const composeHandoffUserMessage = (() => {
    if (!isComposeHandoff) return null;
    const nav = location.state as ZeepoComposeHandoffState;
    const content = nav.initialMessage?.trim();
    if (!content) return null;
    if (messages.some((m) => m.role === "user")) return null;
    return {
      id: "compose-handoff-user",
      role: "user" as const,
      content,
      createdAt: new Date(),
      metadata: nav.initialAttachments?.length
        ? { attachments: nav.initialAttachments }
        : null,
    };
  })();

  const displayMessages = composeHandoffUserMessage
    ? [...messages, composeHandoffUserMessage]
    : messages;

  const generations = genQuery.data?.data ?? [];
  const genLoading = genQuery.isPending || genQuery.isLoading;
  const genError = genQuery.isError;
  const genErrorMessage = genQuery.error?.message ?? "Could not load generations.";

  const skillTitleById = new Map<string, string>();
  for (const s of skillsQuery.data?.data ?? []) {
    skillTitleById.set(s.id, s.title);
  }

  const pendingGenerations = generations.filter(
    (g: { status: string }) => g.status === "QUEUED" || g.status === "PROCESSING",
  );
  const activityDockActive = showAssistantThinking || pendingGenerations.length > 0;

  const lastUserMsg = [...displayMessages].reverse().find((m) => m.role === "user");
  const lastUserText = (lastUserMsg?.content ?? "").trim();
  const lastUserSnippet = !lastUserText
    ? "Working on your request"
    : lastUserText.length > 56
    ? `${lastUserText.slice(0, 56)}…`
    : lastUserText;

  const activityTaskLabel = showAssistantThinking
    ? lastUserSnippet
    : pendingGenerations.length > 0
    ? (() => {
        const g = pendingGenerations[0] as { modelCategory?: string };
        const cat = g.modelCategory ?? "output";
        const labels: Record<string, string> = {
          image: "Generating image",
          video: "Generating video",
          audio: "Generating audio",
          document: "Writing document",
          presentation: "Building presentation",
          "image-presentation": "Building slide deck",
        };
        return labels[cat] ?? "Creating output";
      })()
    : "Zeepo";

  const activityDetail =
    pendingGenerations.length > 1
      ? `Generating ${pendingGenerations.length} items`
      : showAssistantThinking && pendingGenerations.length > 0
      ? "Planning and generating"
      : showAssistantThinking
      ? hasIntermediateReplies
        ? "Refining response"
        : "Analyzing your request"
      : pendingGenerations.length === 1
      ? "In progress"
      : undefined;

  const activityThumbnail = (() => {
    const completed = [...generations].reverse().find(
      (g: { status: string; outputs: unknown; modelCategory: string }) => {
        if (g.status !== "COMPLETED") return false;
        return Boolean(firstMediaUrl(g.outputs));
      },
    );
    if (!completed) return null;
    return firstMediaUrl((completed as { outputs: unknown }).outputs);
  })();

  const primaryPendingGen = pendingGenerations[0] as
    | { modelCategory?: string; status?: string }
    | undefined;

  const inlineProgressTitle = primaryPendingGen
    ? activityTaskLabel
    : null;
  const inlineProgressSubtitle =
    pendingGenerations.length > 1
      ? `${pendingGenerations.length} outputs in total`
      : "This may take a moment";

  // ── Canvas drawing handlers ──────────────────────────────────────────────
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => ({
    x: e.nativeEvent.offsetX,
    y: e.nativeEvent.offsetY,
  });

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    isDrawingOnCanvas.current = true;
    const { x, y } = getCanvasPos(e);
    const color = getBrushColor();
    // Draw a filled dot at the click point.
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    // Start a fresh stroke path from this point so continueDraw connects correctly.
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasDrawing(true);
  };

  const continueDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingOnCanvas.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = getBrushColor();
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDraw = () => {
    isDrawingOnCanvas.current = false;
    canvasRef.current?.getContext("2d")?.beginPath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  };

  /** Build a black-and-white PNG mask from the brush canvas (white = edit area). */
  const getMaskDataUrl = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawing) return null;
    const src = canvas.getContext("2d");
    if (!src) return null;
    const src_data = src.getImageData(0, 0, canvas.width, canvas.height);

    const tmp = document.createElement("canvas");
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const dst = tmp.getContext("2d")!;
    const mask = dst.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < src_data.data.length; i += 4) {
      const isMarked = (src_data.data[i + 3] ?? 0) > 10;
      mask.data[i] = isMarked ? 255 : 0;
      mask.data[i + 1] = isMarked ? 255 : 0;
      mask.data[i + 2] = isMarked ? 255 : 0;
      mask.data[i + 3] = 255;
    }
    dst.putImageData(mask, 0, 0);
    return tmp.toDataURL("image/png");
  };

  const applyImageEdit = () => {
    if (!sessionId || !panelImageUrl || !editPrompt.trim()) return;
    const maskDataUrl = editBrushMode && hasDrawing ? getMaskDataUrl() : undefined;
    setEditOpLabel(maskDataUrl ? "Regenerating selected region…" : "AI is editing your image…");
    setEditOpPending(true);
    editImage.mutate({
      sessionId,
      generationId: panelGenerationId || undefined,
      parentId: panelHistoryEntryId || undefined,
      imageUrl: panelImageUrl,
      prompt: editPrompt.trim(),
      maskDataUrl: maskDataUrl ?? undefined,
      outputFormat,
      resolution: outputResolution,
    });
  };

  const applyStyleTransfer = (style: string) => {
    if (!sessionId || !panelImageUrl || !panelGenerationId) return;
    setEditOpLabel(`Applying ${style.replace("_", " ")} style…`);
    setEditOpPending(true);
    styleTransfer.mutate({
      sessionId,
      generationId: panelGenerationId,
      parentId: panelHistoryEntryId || undefined,
      imageUrl: panelImageUrl,
      style: style as Parameters<typeof styleTransfer.mutate>[0]["style"],
      outputFormat,
      resolution: outputResolution,
    });
  };

  const applyErase = () => {
    if (!sessionId || !panelImageUrl || !panelGenerationId || !hasDrawing) return;
    const maskDataUrl = getMaskDataUrl();
    if (!maskDataUrl) return;
    setEditOpLabel("Erasing selected region…");
    setEditOpPending(true);
    eraseObject.mutate({
      sessionId,
      generationId: panelGenerationId,
      parentId: panelHistoryEntryId || undefined,
      imageUrl: panelImageUrl,
      maskDataUrl,
    });
  };

  const applyBackgroundSwap = (bgPrompt: string, bgPreset?: string) => {
    if (!sessionId || !panelImageUrl || !panelGenerationId || !bgPrompt.trim()) return;
    setEditOpLabel("Swapping background…");
    setEditOpPending(true);
    swapBackground.mutate({
      sessionId,
      generationId: panelGenerationId,
      parentId: panelHistoryEntryId || undefined,
      imageUrl: panelImageUrl,
      bgPrompt: bgPrompt.trim(),
      bgPreset: bgPreset as Parameters<typeof swapBackground.mutate>[0]["bgPreset"] | undefined,
    });
  };

  const applyUpscale = () => {
    if (!sessionId || !panelImageUrl || !panelGenerationId) return;
    setEditOpLabel("Upscaling and enhancing…");
    setEditOpPending(true);
    upscaleImage.mutate({
      sessionId,
      generationId: panelGenerationId,
      parentId: panelHistoryEntryId || undefined,
      imageUrl: panelImageUrl,
    });
  };

  const applyTextEdit = () => {
    if (!sessionId || !panelImageUrl || !panelGenerationId || !editPrompt.trim()) return;
    setEditOpLabel("Editing text in image…");
    setEditOpPending(true);
    editText.mutate({
      sessionId,
      generationId: panelGenerationId,
      parentId: panelHistoryEntryId || undefined,
      imageUrl: panelImageUrl,
      prompt: editPrompt.trim(),
    });
  };

  const applyGenerateVariations = () => {
    if (!sessionId || !panelImageUrl || !panelGenerationId) return;
    setEditOpLabel("Generating 3 variations…");
    setEditOpPending(true);
    generateVariations.mutate({
      sessionId,
      generationId: panelGenerationId,
      parentId: panelHistoryEntryId || undefined,
      imageUrl: panelImageUrl,
      prompt: editPrompt.trim() || undefined,
      outputFormat,
    });
  };

  const undoPanelEdit = () => {
    if (!panelImageHistory.length) return;
    const [prev, ...rest] = panelImageHistory;
    setPanelRedoStack((r) => [panelImageUrl, ...r]);
    setPanelImageUrl(prev!);
    setPanelImageHistory(rest);
    setHasDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current)
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const redoPanelEdit = () => {
    if (!panelRedoStack.length) return;
    const [next, ...rest] = panelRedoStack;
    setPanelImageHistory((h) => [panelImageUrl, ...h]);
    setPanelRedoStack(rest);
    setPanelImageUrl(next!);
    setHasDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current)
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const chatSessions = chatHistoryQuery.data?.data ?? [];
  const useAgencyPageLayout = !activePanel;
  /** Breathing room between chat content and the preview / image-edit panel. */
  const splitColumnPadding = activePanel
    ? cn(
        "px-4 pt-3 sm:px-5 sm:pt-4 md:px-5 md:pt-5",
        isImageEditPanelOpen ? "lg:pl-5 lg:pr-8" : "lg:px-6",
      )
    : "";

  return (
    <div className={cn(
      "zeepo-chat-surface relative flex h-full min-h-0 w-full overflow-hidden transition-all duration-300",
      isComposeHandoff && "animate-in fade-in duration-300",
    )}>
      {/* ── Chat-switching overlay ───────────────────────────── */}
      {isSwitchingChat && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <Spinner size={28} className="text-primary" />
          <p className="text-sm text-muted-foreground">Loading chat…</p>
        </div>
      )}

      {/* ── Chat column ──────────────────────────────────────── */}
      <div className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden transition-all duration-300 ease-in-out",
        activePanel
          ? "hidden md:flex md:h-full md:w-[48%] md:shrink-0 xl:w-[52%] border-r border-border"
          : "h-full flex-1",
      )}>
      <div
        className={cn(
          "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
          splitColumnPadding,
          useAgencyPageLayout && ZEEPO_AGENCY_PAGE_SHELL,
        )}
      >
      <div
        className={cn(
          "grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden",
          useAgencyPageLayout && ZEEPO_AGENCY_PAGE_CONTENT,
        )}
      >
      {/* ── Header: back · title · history (single row) ───── */}
      <div
        className={cn(
          "mb-3 flex shrink-0 items-center gap-2",
          activePanel ? "px-0" : useAgencyPageLayout ? "pr-2 sm:pr-3 md:pr-4" : "px-3 md:px-4",
        )}
      >
        <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground" asChild>
          <Link to={basePath} aria-label="Back to chats">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>

        <ZeepoSessionTitle
          sessionId={sessionId!}
          title={sessionRes.title || "New chat"}
          isAutoNaming={generateTitle.isPending}
          disabled={isSwitchingChat}
          inline
          className="min-w-0 flex-1"
        />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ZeepoTokenWallet />

          <Popover open={chatHistoryOpen} onOpenChange={setChatHistoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground"
                  aria-label="Chat history"
                >
                  <Clock className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(calc(100vw-2rem),22rem)] p-0"
                align="end"
                side="bottom"
                sideOffset={6}
                collisionPadding={12}
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <p className="text-sm font-semibold text-foreground">Recent chats</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                    disabled={createSession.isPending}
                    onClick={() => {
                      setChatHistoryOpen(false);
                      void handleNewChat();
                    }}
                  >
                    {createSession.isPending ? (
                      <Spinner size={12} />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    New
                  </Button>
                </div>
                <Command>
                  <CommandInput placeholder="Search chats…" className="h-9" />
                  <CommandList className="max-h-72">
                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                      No other chats yet
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value={`current ${sessionRes.title ?? ""} ${sessionId}`}
                        className="flex items-center gap-2 px-3 py-2.5 bg-muted/50"
                        onSelect={() => setChatHistoryOpen(false)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{sessionRes.title || "New chat"}</p>
                          <p className="text-[11px] text-muted-foreground">Current chat</p>
                        </div>
                      </CommandItem>
                      {chatHistoryQuery.isPending ? (
                        <div className="space-y-1.5 p-2">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-9 w-full rounded-md" />
                          ))}
                        </div>
                      ) : (
                        chatSessions
                          .filter((s: { id: string }) => s.id !== sessionId)
                          .map((s: { id: string; title?: string | null; updatedAt: Date | string }) => (
                            <CommandItem
                              key={s.id}
                              value={`${s.title ?? "New chat"} ${s.id}`}
                              onSelect={() => {
                                setChatHistoryOpen(false);
                                setIsSwitchingChat(true);
                                navigate(zeepoAgentSessionPath(basePath, s.id));
                              }}
                              className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                            >
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium leading-tight">
                                  {s.title || "New chat"}
                                </p>
                              </div>
                              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                                {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}
                              </span>
                            </CommandItem>
                          ))
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
        </Popover>
        </div>
      </div>

      <div
        ref={threadScrollRef}
        className="zeepo-chat-thread min-h-0 overflow-x-hidden overflow-y-auto overscroll-y-contain"
      >
        <div className="flex w-full flex-col gap-8 py-2 md:py-4">
          {displayMessages.length === 0 && !showAssistantThinking ? (
            <ZeepoEmptyThread
              skillTitle={selectedSkill?.title}
              rotatingCapability={
                <RotatingText
                  texts={[
                    "write strategies, plans, and proposals",
                    "check domain availability and buy instantly",
                    "generate images, video, and audio",
                    "research anything with live web search",
                    "build brand assets and creative copy",
                    "create slide decks and presentations",
                    "handle operational planning and briefs",
                  ]}
                  className="font-medium text-foreground"
                />
              }
            />
          ) : null}

          {displayMessages.map(
            (m: {
              id: string;
              role: string;
              content: string | null;
              createdAt?: Date | string | null;
              metadata?: unknown;
            }) => {
            if (m.role === "user") {
              const ts = formatChatBubbleTime(m.createdAt);
              const msgMeta = (m.metadata ?? {}) as Record<string, unknown>;
              const msgAttachments = (msgMeta.attachments ?? []) as Attachment[];
              const skillId = typeof msgMeta.skillId === "string" ? msgMeta.skillId : null;
              const skillLabel = skillId ? skillTitleById.get(skillId) ?? null : null;
              return (
                <ZeepoUserMessage
                  key={m.id}
                  content={sanitizeUserMessageForDisplay(m.content || "")}
                  skillLabel={skillLabel}
                  attachments={msgAttachments}
                  timestamp={ts}
                />
              );
            }

            if (m.role === "assistant") {
              const ts = formatChatBubbleTime(m.createdAt);
              const displayContent = sanitizeZeepoAgentAssistantDisplayMarkdown(m.content || "");
              return (
                <ZeepoAssistantMessage
                  key={m.id}
                  content={displayContent}
                  timestamp={ts}
                />
              );
            }

            if (m.role === "tool") {
              const domainResult = parseDomainCheckResult(m.content);
              if (domainResult) {
                return (
                  <div key={m.id} className="flex w-full min-w-0 flex-col gap-3">
                    <ZeepoAgentIdentity />
                    <ZeepoDomainPurchaseCard result={domainResult} />
                  </div>
                );
              }
              return null;
            }

            return null;
          })}

          {showAssistantThinking ? (
            <div aria-live="polite" aria-busy="true" className="flex w-full min-w-0 flex-col gap-3">
              <ZeepoThinkingBlock
                label={lastUserSnippet}
                showIntermediate={hasIntermediateReplies}
              />
              {inlineProgressTitle ? (
                <ZeepoGenerationProgressCard
                  title={inlineProgressTitle}
                  subtitle={inlineProgressSubtitle}
                  pending
                  thumbnailUrl={activityThumbnail}
                />
              ) : null}
            </div>
          ) : null}

          {!showAssistantThinking && pendingGenerations.length > 0 && inlineProgressTitle ? (
            <div className="flex w-full min-w-0 flex-col gap-3">
              <ZeepoStepIndicator label={inlineProgressTitle} />
              <ZeepoGenerationProgressCard
                title={inlineProgressTitle}
                subtitle={inlineProgressSubtitle}
                pending
                thumbnailUrl={activityThumbnail}
              />
            </div>
          ) : null}

          <div ref={scrollRef} />
        </div>
      </div>

      <div
        className={cn(
          "zeepo-compose-anchor z-10 flex shrink-0 justify-center pt-2",
          activePanel || useAgencyPageLayout ? "px-0" : "px-3 md:px-4",
        )}
      >
      <form
        className={cn(
          "flex w-full flex-col gap-3 border-t border-border bg-background pt-2",
          ZEEPO_CHAT_COMPOSE_COLUMN,
        )}
        onSubmit={(e) => {
          e.preventDefault();
          sendCurrentDraft();
        }}
      >
        {/* ── Step-by-step clarifying questions panel ───────────────────── */}
        {pendingQuestionsInfo && questionFlow && !showAssistantThinking && (() => {
          const currentQ = pendingQuestionsInfo.questions[questionFlow.currentIndex];
          if (!currentQ) return null;
          const total = pendingQuestionsInfo.questions.length;
          return (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Header: nav arrows + progress dots + step counter + dismiss */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b bg-muted/40">
                {/* Back arrow */}
                <button
                  type="button"
                  aria-label="Previous question"
                  disabled={questionFlow.currentIndex === 0}
                  className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30"
                  onClick={() => goToQuestion(questionFlow.currentIndex - 1)}
                >
                  <ChevronLeft className="size-3.5" />
                </button>

                {/* Progress dots (clickable) */}
                <div className="flex gap-1.5 items-center">
                  {pendingQuestionsInfo.questions.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Go to question ${idx + 1}`}
                      disabled={idx > questionFlow.answers.length}
                      className={cn(
                        "rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none",
                        idx < questionFlow.currentIndex
                          ? "size-2 bg-primary hover:opacity-70"
                          : idx === questionFlow.currentIndex
                          ? "size-2.5 bg-primary ring-2 ring-primary/30"
                          : idx <= questionFlow.answers.length - 1
                          ? "size-2 bg-primary/50 hover:opacity-70"
                          : "size-2 bg-muted-foreground/25",
                      )}
                      onClick={() => goToQuestion(idx)}
                    />
                  ))}
                </div>

                <span className="text-[11px] font-medium text-muted-foreground">
                  {questionFlow.currentIndex + 1} / {total}
                </span>
                <span className="text-[11px] text-muted-foreground/50 mx-0.5">·</span>
                <span className="text-[11px] text-muted-foreground/70 leading-tight truncate">
                  Answering helps me give you a better result
                </span>

                {/* Forward arrow */}
                <button
                  type="button"
                  aria-label="Next question"
                  disabled={
                    questionFlow.currentIndex + 1 >= total ||
                    questionFlow.currentIndex >= questionFlow.answers.length
                  }
                  className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30"
                  onClick={() => goToQuestion(questionFlow.currentIndex + 1)}
                >
                  <ChevronRight className="size-3.5" />
                </button>

                {/* Dismiss */}
                <button
                  type="button"
                  aria-label="Skip questions"
                  className="ml-1 rounded-md p-1 text-muted-foreground/60 hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    setDismissedQuestionIds((prev) => {
                      const next = new Set(prev);
                      next.add(pendingQuestionsInfo.messageId);
                      return next;
                    });
                    setQuestionFlow(null);
                  }}
                >
                  <X className="size-3.5" />
                </button>
              </div>

              {/* Question text */}
              <div className="px-4 pt-3.5 pb-2">
                <p className="text-sm font-semibold text-foreground leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Option chips */}
              {(() => {
                const currentAnswer = questionFlow.answers[questionFlow.currentIndex];
                const isCurrentAnswerCustom =
                  currentAnswer !== undefined && !currentQ.options.includes(currentAnswer);
                return (
                  <div className="px-4 pb-3 pt-1 flex flex-wrap gap-2">
                    {currentQ.options.map((opt) => {
                      const isSelected = currentAnswer === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={cn(
                            "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border hover:bg-primary hover:text-primary-foreground hover:border-primary",
                          )}
                          onClick={() => handleQuestionOptionSelect(opt)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                    {/* "Other" always appended */}
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        questionFlow.showCustom || isCurrentAnswerCustom
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-primary hover:text-primary-foreground hover:border-primary",
                      )}
                      onClick={() => handleQuestionOptionSelect("__other__")}
                    >
                      Other
                    </button>
                    {/* "Upload file" chip — shown when allow_upload is set or question hints at assets */}
                    {currentQ.allow_upload && (
                      <>
                        <input
                          ref={questionFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setQuestionFlow((prev) =>
                              prev ? { ...prev, isUploadingForStep: true, pendingUploadForStep: undefined } : prev,
                            );
                            e.target.value = "";
                            try {
                              const results = await uploadZeepoAgentFiles({
                                files: [file],
                              });
                              const uploaded: Attachment = {
                                url: uploadThingFileUrl(results[0]),
                                name: file.name,
                                mimeType: file.type,
                              };
                              // Hold the upload for user confirmation — don't advance yet.
                              setQuestionFlow((prev) =>
                                prev
                                  ? { ...prev, isUploadingForStep: false, pendingUploadForStep: uploaded }
                                  : prev,
                              );
                            } catch (e) {
                              toast.error(uploadErrorMessage(e));
                              setQuestionFlow((prev) =>
                                prev ? { ...prev, isUploadingForStep: false } : prev,
                              );
                            }
                          }}
                        />
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            questionFlow.isUploadingForStep
                              ? "opacity-60 cursor-not-allowed"
                              : "bg-background text-foreground border-border hover:bg-primary hover:text-primary-foreground hover:border-primary",
                          )}
                          disabled={questionFlow.isUploadingForStep}
                          onClick={() => questionFileInputRef.current?.click()}
                        >
                          {questionFlow.isUploadingForStep ? (
                            <Spinner className="size-3" />
                          ) : (
                            <Upload className="size-3.5" />
                          )}
                          Upload file
                        </button>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Pending upload preview — shown after upload, awaiting confirmation */}
              {questionFlow.pendingUploadForStep && (
                <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <img
                    src={questionFlow.pendingUploadForStep.url}
                    alt={questionFlow.pendingUploadForStep.name}
                    className="h-14 w-14 shrink-0 rounded-lg object-cover border border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {questionFlow.pendingUploadForStep.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Ready to use</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button
                      type="button"
                      size="icon"
                      className="size-7 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      aria-label="Confirm upload"
                      onClick={() => {
                        const a = questionFlow.pendingUploadForStep!;
                        setQuestionFlow((prev) =>
                          prev ? { ...prev, pendingUploadForStep: undefined } : prev,
                        );
                        advanceQuestion(`[Uploaded: ${a.name}]`, a);
                      }}
                    >
                      <Check className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-7 rounded-full"
                      aria-label="Remove upload"
                      onClick={() =>
                        setQuestionFlow((prev) =>
                          prev ? { ...prev, pendingUploadForStep: undefined } : prev,
                        )
                      }
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Custom answer input (visible when "Other" is selected) */}
              {questionFlow.showCustom && (
                <div className="px-4 pb-3 flex gap-2 items-end animate-in fade-in slide-in-from-top-1 duration-150">
                  <Textarea
                    autoFocus
                    placeholder="Type your answer…"
                    value={questionFlow.customText}
                    onChange={(e) =>
                      setQuestionFlow((prev) =>
                        prev ? { ...prev, customText: e.target.value } : prev,
                      )
                    }
                    className="min-h-[36px] flex-1 resize-none text-sm"
                    rows={1}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        !e.shiftKey &&
                        questionFlow.customText.trim()
                      ) {
                        e.preventDefault();
                        advanceQuestion(questionFlow.customText.trim());
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="size-9 shrink-0"
                    disabled={!questionFlow.customText.trim()}
                    onClick={() => advanceQuestion(questionFlow.customText.trim())}
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              )}

              {/* Footer: skip hint */}
              <div className="px-4 py-2.5 border-t bg-muted/20 flex items-center justify-between gap-3">
                <p className="text-[11px] text-muted-foreground/70 leading-snug">
                  Skip these if you prefer — just type your reply below and I&apos;ll work with what you give me. You can also ask me to ask again.
                </p>
                <button
                  type="button"
                  className="shrink-0 text-[11px] font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none"
                  onClick={() => {
                    setDismissedQuestionIds((prev) => {
                      const next = new Set(prev);
                      next.add(pendingQuestionsInfo.messageId);
                      return next;
                    });
                    setQuestionFlow(null);
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          );
        })()}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFileSelect(e.target.files);
            e.target.value = "";
          }}
        />

        <ZeepoFloatingDock
          activity={
            activityDockActive || generations.length > 0 || genLoading || genError ? (
              <ZeepoGenerationsPanel
                active={activityDockActive}
                taskLabel={activityTaskLabel}
                detail={activityDetail}
                progressCurrent={
                  pendingGenerations.length > 0
                    ? generations.filter((g: { status: string }) => g.status === "COMPLETED").length + 1
                    : 0
                }
                progressTotal={
                  pendingGenerations.length > 0 ? generations.length : 0
                }
                thumbnailUrl={activityThumbnail}
                expanded={generationsOpen}
                onToggleExpanded={() => setGenerationsOpen((o) => !o)}
                generations={generations}
                genLoading={genLoading}
                genError={genError}
                genErrorMessage={genErrorMessage}
                onRetry={() => void genQuery.refetch()}
                slideImageUrls={slideImageUrls}
                firstMediaUrl={firstMediaUrl}
                extractOutputPreview={extractOutputPreview}
                extractDocument={extractDocument}
                extractPresentation={extractPresentation}
                extractImagePresentation={extractImagePresentation}
                guessMediaKind={guessMediaKind}
                onOpenPanel={setActivePanel}
                onPresentationOpen={(pres) => {
                  setPresentationSlideIndex(0);
                  setActivePanel({ type: "presentation", data: pres });
                }}
                onImagePresentationOpen={(pres) => {
                  setImagePresentationSlideIndex(0);
                  setActivePanel({ type: "image-presentation", data: pres });
                }}
              />
            ) : null
          }
          composer={
            <>
              <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
                <PopoverTrigger asChild>
                  <span className="sr-only" aria-hidden tabIndex={-1} />
                </PopoverTrigger>
                <PopoverContent
                  className="w-[min(calc(100vw-2rem),26rem)] p-0"
                  side="top"
                  align="start"
                  sideOffset={8}
                  collisionPadding={16}
                >
                  <div className="flex items-center gap-2 border-b px-4 py-3">
                    <Zap className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="text-sm font-semibold">All skills</span>
                  </div>
                  <ScrollArea className="h-[min(50vh,360px)]">
                    <div className="space-y-1 p-2 pb-4">
                      {skillsQuery.isPending ? (
                        <div className="space-y-3 p-2" aria-busy="true">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-14 w-full rounded-lg" />
                          <Skeleton className="h-14 w-full rounded-lg" />
                        </div>
                      ) : skillsQuery.isError ? (
                        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                          Could not load skills. Try again later.
                        </p>
                      ) : (
                        skillsByCategory.map(([category, skills]) => (
                          <div key={category}>
                            <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {category}
                            </p>
                            <ul className="space-y-0.5">
                              {skills.map((s) => (
                                <li key={s.id}>
                                  <button
                                    type="button"
                                    className={cn(
                                      "flex w-full gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                                      "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    )}
                                    onClick={() => {
                                      setSelectedSkill(s);
                                      setSkillsOpen(false);
                                      queueMicrotask(() => textareaRef.current?.focus());
                                    }}
                                  >
                                    <Zap className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-semibold leading-snug">{s.title}</div>
                                      <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                                        {s.description}
                                      </div>
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              <ZeepoComposer
                value={draft}
                onChange={setDraft}
                onSubmit={sendCurrentDraft}
                placeholder={
                  pendingQuestionsInfo && questionFlow
                    ? "Answer the question above first…"
                    : selectedSkill
                    ? `Add details for “${selectedSkill.title}”…`
                    : "Message Zeepo"
                }
                disabled={
                  showAssistantThinking || Boolean(pendingQuestionsInfo && questionFlow)
                }
                isSending={send.isPending || isUploading}
                canSend={
                  (draft.trim().length > 0 ||
                    pendingFiles.length > 0 ||
                    pendingAttachments.length > 0) &&
                  !showAssistantThinking &&
                  !isUploading &&
                  !Boolean(pendingQuestionsInfo && questionFlow)
                }
                onAttach={() => fileInputRef.current?.click()}
                attachDisabled={
                  showAssistantThinking ||
                  Boolean(pendingQuestionsInfo && questionFlow) ||
                  isUploading ||
                  pendingFiles.length + pendingAttachments.length >= 4
                }
                isUploading={isUploading}
                onSkills={() => setSkillsOpen(true)}
                skillsDisabled={showAssistantThinking || skillsQuery.isPending}
                selectedSkillTitle={selectedSkill?.title}
                onClearSkill={() => setSelectedSkill(null)}
                pendingPreviews={pendingFiles.map((f, i) => ({
                  previewUrl: f.previewUrl,
                  name: f.name,
                  onRemove: () => {
                    URL.revokeObjectURL(f.previewUrl);
                    setPendingFiles((prev) => prev.filter((_, idx) => idx !== i));
                  },
                }))}
                textareaRef={textareaRef}
              />
            </>
          }
        />

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground px-1 pt-1">
          Agents can make mistakes. Verify important info. Don&apos;t share sensitive data.
        </p>
      </form>
      </div>
      </div>
      </div>
      </div>

      {/* ── Side panel (sibling to chat column) ─────────────── */}
      {activePanel && (
        <div
          className={cn(
            "absolute inset-0 z-40 flex flex-col bg-background",
            "md:relative md:inset-auto md:z-auto md:flex-1",
            "animate-in slide-in-from-right-2 duration-200 md:animate-none",
          )}
        >
          {/* ── Panel header ───────────────────────────────── */}
          <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5 shrink-0">
                {activePanel.type === "document"
                  ? <FileText className="size-3.5 text-primary" />
                  : activePanel.type === "presentation"
                  ? <Presentation className="size-3.5 text-indigo-500" />
                  : activePanel.type === "image-presentation"
                  ? <ImageIcon className="size-3.5 text-violet-500" />
                  : activePanel.type === "media" && activePanel.kind === "audio"
                  ? <Headphones className="size-3.5 text-primary" />
                  : <ImageIcon className="size-3.5 text-primary" />}
              </div>
              <span className="truncate text-sm font-semibold">
                {activePanel.type === "document"
                  ? activePanel.title
                  : activePanel.type === "presentation"
                  ? activePanel.data.title
                  : activePanel.type === "image-presentation"
                  ? activePanel.data.title
                  : activePanel.type === "media" && activePanel.kind === "audio"
                  ? "Audio"
                  : activePanel.type === "media" && activePanel.kind === "video"
                  ? "Video"
                  : "Image"}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {/* Image-specific header controls */}
              {activePanel.type === "media" && activePanel.kind === "image" && (
                <>
                  {/* Before / After toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("size-7", showBeforeAfter && "bg-primary/10 text-primary")}
                    title={showBeforeAfter ? "Viewing original" : "Compare with original"}
                    onClick={() => setShowBeforeAfter((v) => !v)}
                    disabled={!panelImageHistory.length}
                  >
                    <SplitSquareHorizontal className="size-3.5" />
                  </Button>
                  {/* Undo */}
                  {panelImageHistory.length > 0 && (
                    <Button variant="ghost" size="icon" className="size-7" title="Undo" onClick={undoPanelEdit}>
                      <Undo2 className="size-3.5" />
                    </Button>
                  )}
                  {/* Redo */}
                  {panelRedoStack.length > 0 && (
                    <Button variant="ghost" size="icon" className="size-7" title="Redo" onClick={redoPanelEdit}>
                      <Redo2 className="size-3.5" />
                    </Button>
                  )}
                  {/* History */}
                  {panelGenerationId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("size-7", showHistoryDrawer && "bg-primary/10 text-primary")}
                      title="Edit history"
                      onClick={() => setShowHistoryDrawer(true)}
                    >
                      <Clock className="size-3.5" />
                    </Button>
                  )}
                  {/* Format / Resolution */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[11px] font-normal text-muted-foreground">
                        {outputResolution} · {outputFormat.toUpperCase()}
                        <ChevronDown className="size-3 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Resolution</p>
                      {(["1 MP", "2 MP"] as const).map((r) => (
                        <DropdownMenuItem key={r} onClick={() => setOutputResolution(r)} className="gap-2">
                          {outputResolution === r && <Check className="size-3 text-primary" />}
                          <span className={outputResolution === r ? "" : "pl-5"}>{r}</span>
                        </DropdownMenuItem>
                      ))}
                      <p className="mt-1 px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Format</p>
                      {(["webp", "png"] as const).map((f) => (
                        <DropdownMenuItem key={f} onClick={() => setOutputFormat(f)} className="gap-2">
                          {outputFormat === f && <Check className="size-3 text-primary" />}
                          <span className={outputFormat === f ? "" : "pl-5"}>{f.toUpperCase()}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              {/* Download */}
              {activePanel.type === "media" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  title="Download"
                  onClick={() => {
                    if (activePanel.type !== "media") return;
                    const url = activePanel.kind === "image" ? panelImageUrl || activePanel.url : activePanel.url;
                    const ext = fileExtensionForDownload(activePanel.kind, url);
                    void downloadMediaFile(url, `zeepo-generation-${activePanel.generationId.slice(0, 8)}.${ext}`);
                  }}
                >
                  <Download className="size-3.5" />
                </Button>
              )}
              {/* Document export */}
              {activePanel.type === "presentation" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2.5 text-xs">
                      <Download className="size-3.5" /> Export <ChevronDown className="size-3 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={async () => {
                        if (activePanel.type !== "presentation") return;
                        try {
                          const blob = await generatePresentationPdfBlob(activePanel.data);
                          const slug = activePanel.data.title.replace(/[^a-z0-9 \-_]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() || "presentation";
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a"); a.href = url; a.download = `${slug}.pdf`; a.click(); URL.revokeObjectURL(url);
                        } catch (err) { toast.error("PDF export failed. Please try again."); }
                      }}
                    >
                      <FileText className="mr-2 size-4" /> Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        if (activePanel.type !== "presentation") return;
                        try {
                          const blob = await generatePresentationPptx(activePanel.data);
                          const slug = activePanel.data.title.replace(/[^a-z0-9 \-_]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() || "presentation";
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a"); a.href = url; a.download = `${slug}.pptx`; a.click(); URL.revokeObjectURL(url);
                        } catch (err) { toast.error("PPTX export failed. Please try again."); }
                      }}
                    >
                      <Download className="mr-2 size-4" /> Download PPTX
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        if (activePanel.type !== "presentation") return;
                        try {
                          const [{ getDocument, GlobalWorkerOptions }, JSZip] = await Promise.all([
                            import("pdfjs-dist"),
                            import("jszip").then(m => m.default),
                          ]);
                          GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
                          const blob = await generatePresentationPdfBlob(activePanel.data);
                          const arrayBuffer = await blob.arrayBuffer();
                          const pdfDoc = await getDocument({ data: arrayBuffer }).promise;
                          const slug = activePanel.data.title.replace(/[^a-z0-9 \-_]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() || "presentation";
                          const zip = new JSZip();
                          for (let i = 1; i <= pdfDoc.numPages; i++) {
                            const page = await pdfDoc.getPage(i);
                            const viewport = page.getViewport({ scale: 3 });
                            const canvas = document.createElement("canvas");
                            canvas.width = viewport.width;
                            canvas.height = viewport.height;
                            const ctx = canvas.getContext("2d")!;
                            await page.render({ canvasContext: ctx, viewport }).promise;
                            const pngBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/png"));
                            if (pngBlob) {
                              zip.file(`${slug}-slide-${String(i).padStart(2, "0")}.png`, pngBlob);
                            }
                          }
                          const zipBlob = await zip.generateAsync({ type: "blob" });
                          const url = URL.createObjectURL(zipBlob);
                          const a = document.createElement("a"); a.href = url; a.download = `${slug}-slides.zip`; a.click(); URL.revokeObjectURL(url);
                        } catch (err) { toast.error("PNG export failed. Please try again."); }
                      }}
                    >
                      <ImageIcon className="mr-2 size-4" /> Download PNGs (ZIP)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {/* Image presentation export — download ZIP of all slide images */}
              {activePanel.type === "image-presentation" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2.5 text-xs"
                  onClick={async () => {
                    if (activePanel.type !== "image-presentation") return;
                    const slides = activePanel.data.slides.filter(s => s.imageUrl);
                    if (slides.length === 0) { toast.error("No images are ready yet. Please wait for generation to complete."); return; }
                    try {
                      const JSZip = await import("jszip").then(m => m.default);
                      const zip = new JSZip();
                      const slug = activePanel.data.title.replace(/[^a-z0-9 \-_]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() || "image-deck";
                      await Promise.all(slides.map(async (slide, i) => {
                        const res = await fetch(slide.imageUrl!);
                        const blob = await res.blob();
                        const ext = blob.type.includes("png") ? "png" : "jpg";
                        zip.file(`${slug}-slide-${String(i + 1).padStart(2, "0")}.${ext}`, blob);
                      }));
                      const zipBlob = await zip.generateAsync({ type: "blob" });
                      const url = URL.createObjectURL(zipBlob);
                      const a = document.createElement("a"); a.href = url; a.download = `${slug}-slides.zip`; a.click(); URL.revokeObjectURL(url);
                    } catch { toast.error("Export failed. Please try again."); }
                  }}
                >
                  <Download className="size-3.5" /> Download ZIP
                </Button>
              )}
              {activePanel.type === "document" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2.5 text-xs">
                      <Download className="size-3.5" /> Export <ChevronDown className="size-3 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={async () => { if (activePanel.type !== "document") return; try { await navigator.clipboard.writeText(activePanel.content); setDocCopied(true); setTimeout(() => setDocCopied(false), 2000); } catch { /* ignore */ } }}>
                      {docCopied ? <Check className="mr-2 size-4 text-green-500" /> : <Copy className="mr-2 size-4" />}
                      {docCopied ? "Copied!" : "Copy document"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { if (activePanel.type !== "document") return; const slug = activePanel.title.replace(/[^a-z0-9 \-_]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() || "document"; const blob = new Blob([activePanel.content], { type: "text/markdown;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${slug}.md`; a.click(); URL.revokeObjectURL(url); }}>
                      <Download className="mr-2 size-4" /> Download Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => { if (activePanel.type !== "document") return; try { const blob = await pdf(<ZeepoDocumentPdf title={activePanel.title} content={activePanel.content} />).toBlob(); const slug = activePanel.title.replace(/[^a-z0-9 \-_]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() || "document"; const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${slug}.pdf`; a.click(); URL.revokeObjectURL(url); } catch (err) { console.error("PDF generation failed:", err); } }}>
                      <FileText className="mr-2 size-4" /> Download PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button variant="ghost" size="icon" className="size-7" aria-label="Close panel" onClick={() => { setActivePanel(null); setDocCopied(false); setShowHistoryDrawer(false); setPresentationSlideIndex(0); }}>
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* ── Panel body ───────────────────────────────── */}
          <div className="min-h-0 flex-1 overflow-hidden">
            {activePanel.type === "media" ? (
              <div className="flex size-full flex-col items-center justify-center gap-4 p-4">
                {activePanel.kind === "image" ? (
                  <div className="relative flex min-h-0 flex-1 w-full items-center justify-center">
                    {/* Loading overlay for any edit operation */}
                    {(editOpPending || editImage.isPending) && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-xl bg-background/75 backdrop-blur-sm">
                        <Spinner size={28} className="text-primary" />
                        <p className="text-xs font-medium text-foreground/80">{editOpLabel}</p>
                        <p className="text-[11px] text-muted-foreground">This usually takes 10–30 seconds</p>
                      </div>
                    )}
                    {/* Before / After split view */}
                    {showBeforeAfter && panelImageHistory.length > 0 ? (
                      <div className="flex h-full w-full gap-2 overflow-hidden rounded-xl">
                        <div className="flex flex-1 flex-col items-center gap-1 overflow-hidden">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Before</span>
                          <img src={panelImageHistory[panelImageHistory.length - 1] ?? ""} alt="before" className="max-h-full w-auto max-w-full rounded-lg object-contain" draggable={false} />
                        </div>
                        <div className="flex flex-1 flex-col items-center gap-1 overflow-hidden">
                          <span className="text-[10px] font-medium text-primary uppercase tracking-wide">After</span>
                          <img src={panelImageUrl || activePanel.url} alt="after" className="max-h-full w-auto max-w-full rounded-lg object-contain" draggable={false} />
                        </div>
                      </div>
                    ) : (
                      <>
                        <img
                          ref={panelImgRef}
                          src={panelImageUrl || activePanel.url}
                          alt=""
                          className="max-h-full w-auto max-w-full rounded-xl object-contain"
                          draggable={false}
                        />
                        {(editMode === "instruct" || editMode === "erase") && editBrushMode && (
                          <canvas
                            ref={canvasRef}
                            className="absolute inset-0 cursor-crosshair rounded-xl"
                            style={{ touchAction: "none" }}
                            onMouseDown={startDraw}
                            onMouseMove={continueDraw}
                            onMouseUp={stopDraw}
                            onMouseLeave={stopDraw}
                          />
                        )}
                      </>
                    )}
                    {/* Variations strip */}
                    {variationsResult.length > 0 && (
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 px-2">
                        {variationsResult.map((v, i) => (
                          <button
                            key={v.record.id}
                            onClick={() => applyEditResult(v.imageUrl, v.record.id)}
                            className="group relative overflow-hidden rounded-lg border-2 border-transparent hover:border-primary focus:border-primary focus:outline-none transition-all"
                            title={`Select variation ${i + 1}`}
                          >
                            <img src={v.imageUrl} alt={`Variation ${i + 1}`} className="h-20 w-20 object-cover" />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-center text-[10px] text-white">V{i + 1}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : activePanel.kind === "video" ? (
                  <video src={activePanel.url} controls playsInline className="max-h-full w-full max-w-full rounded-xl bg-black" />
                ) : (
                  <div className="flex w-full max-w-md flex-col items-center gap-4">
                    <Headphones className="size-12 text-muted-foreground" />
                    <audio src={activePanel.url} controls className="w-full" />
                  </div>
                )}
              </div>
            ) : activePanel.type === "document" ? (
              <ScrollArea className="h-full w-full">
                <div className="p-5 md:p-6">
                  <div className="max-w-none text-foreground/90">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node: _n, ...props }) => <h1 className="text-2xl font-bold text-foreground mt-8 mb-4 pb-2 border-b border-muted" {...props} />,
                        h2: ({ node: _n, ...props }) => <h2 className="text-xl font-bold text-foreground mt-8 mb-3" {...props} />,
                        h3: ({ node: _n, ...props }) => <h3 className="text-base font-bold text-foreground mt-6 mb-2" {...props} />,
                        h4: ({ node: _n, ...props }) => <h4 className="text-sm font-bold text-foreground/90 mt-4 mb-2 uppercase tracking-wide" {...props} />,
                        h5: ({ node: _n, ...props }) => <h5 className="text-sm font-semibold text-foreground/80 mt-4 mb-1" {...props} />,
                        h6: ({ node: _n, ...props }) => <h6 className="text-xs font-semibold text-muted-foreground mt-4 mb-1 uppercase" {...props} />,
                        p: ({ node: _n, ...props }) => <p className="leading-7 mb-4 text-foreground/80" {...props} />,
                        em: ({ node: _n, ...props }) => <em className="italic text-foreground/70" {...props} />,
                        strong: ({ node: _n, ...props }) => <strong className="font-bold text-primary" {...props} />,
                        ul: ({ node: _n, ...props }) => <ul className="list-disc pl-6 mb-5 space-y-1.5 text-foreground/80" {...props} />,
                        ol: ({ node: _n, ...props }) => <ol className="list-decimal pl-6 mb-5 space-y-1.5 text-foreground/80" {...props} />,
                        li: ({ node: _n, children, ...props }) => <li className="leading-relaxed" {...props}>{children}</li>,
                        blockquote: ({ node: _n, ...props }) => <blockquote className="border-l-4 border-primary/40 pl-4 py-1 my-5 bg-primary/5 rounded-r-lg italic text-foreground/70" {...props} />,
                        code: ({ node: _n, className, children, ...props }: any) => { const isBlock = className?.includes("language-"); return isBlock ? <code className={`block text-sm font-mono ${className ?? ""}`} {...props}>{children}</code> : <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-[0.85em] font-mono" {...props}>{children}</code>; },
                        pre: ({ node: _n, ...props }) => <pre className="bg-muted/60 border border-muted rounded-xl p-4 my-5 overflow-x-auto text-sm font-mono leading-relaxed" {...props} />,
                        hr: ({ node: _n, ...props }) => <hr className="my-8 border-muted" {...props} />,
                        a: ({ node: _n, ...props }) => <a className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer" {...props} />,
                        table: ({ node: _n, ...props }) => <div className="overflow-x-auto my-6 rounded-xl border border-muted shadow-sm"><table className="w-full text-sm text-left border-collapse" {...props} /></div>,
                        thead: ({ node: _n, ...props }) => <thead className="bg-muted/60 text-foreground font-semibold" {...props} />,
                        tbody: ({ node: _n, ...props }) => <tbody className="divide-y divide-muted/60" {...props} />,
                        tr: ({ node: _n, ...props }) => <tr className="hover:bg-muted/20 transition-colors" {...props} />,
                        th: ({ node: _n, ...props }) => <th className="px-4 py-3 text-left font-semibold text-foreground border-b border-muted whitespace-nowrap" {...props} />,
                        td: ({ node: _n, ...props }) => <td className="px-4 py-2.5 text-foreground/75 align-top" {...props} />,
                      }}
                    >{activePanel.content}</ReactMarkdown>
                  </div>
                </div>
              </ScrollArea>
            ) : activePanel.type === "presentation" ? (
              <PresentationViewer
                data={activePanel.data}
                slideIndex={presentationSlideIndex}
                onSlideChange={setPresentationSlideIndex}
                generations={generations}
                onOpenImage={(url, generationId) => {
                  setActivePanel({
                    type: "media",
                    url,
                    kind: "image",
                    generationId,
                  });
                  setPresentationSlideIndex(0);
                }}
              />
            ) : activePanel.type === "image-presentation" ? (
              <ImagePresentationViewer
                data={activePanel.data}
                slideIndex={imagePresentationSlideIndex}
                onSlideChange={setImagePresentationSlideIndex}
              />
            ) : null}
          </div>

          {/* ── Image edit toolbar — full revamp ───────────────── */}
          {activePanel.type === "media" && activePanel.kind === "image" && (
            <div className="shrink-0 border-t bg-muted/20">
              {/* Mode tabs */}
              <div className="flex items-center gap-0.5 overflow-x-auto border-b px-2 py-1.5 scrollbar-none">
                {([
                  { id: "instruct", icon: <Wand2 className="size-3" />, label: "Instruct" },
                  { id: "style",    icon: <Palette className="size-3" />, label: "Style" },
                  { id: "erase",    icon: <Eraser className="size-3" />, label: "Erase" },
                  { id: "background", icon: <Layers className="size-3" />, label: "Background" },
                  { id: "upscale",  icon: <ZoomIn className="size-3" />, label: "Upscale" },
                  { id: "text_edit", icon: <Type className="size-3" />, label: "Text" },
                  { id: "variations", icon: <Shuffle className="size-3" />, label: "Variations" },
                ] as { id: ImageEditMode; icon: React.ReactNode; label: string }[]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setEditMode(tab.id); setEditBrushMode(tab.id === "erase"); setVariationsResult([]); }}
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                      editMode === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>

              {/* Mode content */}
              <div className="px-3 py-2.5 space-y-2">
                {/* ── Instruct mode ── */}
                {editMode === "instruct" && (
                  <>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className={cn("size-7 shrink-0", editBrushMode && "bg-primary/10 text-primary")} title="Toggle brush mask" onClick={() => setEditBrushMode((v) => !v)}>
                        <Paintbrush className="size-3.5" />
                      </Button>
                      {editBrushMode && (
                        <>
                          <input type="range" min={8} max={80} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="h-1.5 flex-1 accent-primary" aria-label="Brush size" />
                          <span className="w-6 shrink-0 text-center text-[11px] text-muted-foreground">{brushSize}</span>
                          <Button type="button" variant="ghost" size="icon" className="size-7" disabled={!hasDrawing} onClick={clearCanvas}><Trash2 className="size-3.5" /></Button>
                        </>
                      )}
                    </div>
                    {/* Prompt chips */}
                    <div className="flex flex-wrap gap-1">
                      {["Remove background", "Make it brighter", "Add soft shadow", "Change to dark mode"].map((chip) => (
                        <button key={chip} onClick={() => setEditPrompt(chip)} className="rounded-full border bg-background px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary hover:text-primary transition-colors">{chip}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={editBrushMode ? "Describe what to put in the painted area…" : "Describe your edit (e.g. change shirt to blue)…"}
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        disabled={editOpPending || editImage.isPending}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); applyImageEdit(); } }}
                        className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                      />
                      <Button type="button" size="sm" className="h-8 shrink-0 gap-1.5 px-3" disabled={!editPrompt.trim() || editOpPending || editImage.isPending || (editBrushMode && !hasDrawing)} onClick={applyImageEdit}>
                        {(editOpPending || editImage.isPending) ? <Spinner size={13} className="text-primary-foreground" /> : <Wand2 className="size-3.5" />}
                        {(editOpPending || editImage.isPending) ? "Applying…" : "Apply"}
                      </Button>
                    </div>
                  </>
                )}

                {/* ── Style mode ── */}
                {editMode === "style" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-1.5">
                      {([
                        { id: "watercolor",    img: "/image_edit_icons/watercolor.png", label: "Watercolor" },
                        { id: "oil_painting",  img: "/image_edit_icons/oilpaint.png",   label: "Oil Paint" },
                        { id: "cinematic",     img: "/image_edit_icons/cinematic.png",  label: "Cinematic" },
                        { id: "anime",         img: "/image_edit_icons/anime.png",      label: "Anime" },
                        { id: "pixel_art",     img: "/image_edit_icons/pixel.png",      label: "Pixel Art" },
                        { id: "neon",          img: "/image_edit_icons/neon.png",       label: "Neon Glow" },
                        { id: "pencil_sketch", img: "/image_edit_icons/sketch.png",     label: "Sketch" },
                        { id: "vintage",       img: "/image_edit_icons/vintage.png",    label: "Vintage" },
                      ] as { id: string; img: string; label: string }[]).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => applyStyleTransfer(s.id)}
                          disabled={editOpPending}
                          className="flex flex-col items-center gap-1 rounded-xl border bg-background px-1 py-2 text-center hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <img src={s.img} alt={s.label} className="h-8 w-8 rounded-md object-cover" draggable={false} />
                          <span className="text-[10px] font-medium text-foreground/80 leading-tight">{s.label}</span>
                        </button>
                      ))}
                    </div>
                    {editOpPending && <p className="text-center text-[11px] text-primary animate-pulse">Applying style…</p>}
                  </div>
                )}

                {/* ── Erase mode ── */}
                {editMode === "erase" && (
                  <>
                    <div className="flex items-center gap-2">
                      <Eraser className="size-3.5 shrink-0 text-muted-foreground" />
                      <input type="range" min={8} max={80} value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="h-1.5 flex-1 accent-primary" aria-label="Brush size" />
                      <span className="w-6 shrink-0 text-center text-[11px] text-muted-foreground">{brushSize}</span>
                      <Button type="button" variant="ghost" size="icon" className="size-7" disabled={!hasDrawing} onClick={clearCanvas}><Trash2 className="size-3.5" /></Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70">Paint over the object you want to remove, then click Erase.</p>
                    <Button type="button" size="sm" className="h-8 w-full gap-1.5" disabled={!hasDrawing || editOpPending} onClick={applyErase}>
                      {editOpPending ? <Spinner size={13} className="text-primary-foreground" /> : <Eraser className="size-3.5" />}
                      {editOpPending ? "Erasing…" : "Erase Selected Region"}
                    </Button>
                  </>
                )}

                {/* ── Background swap mode ── */}
                {editMode === "background" && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {([
                        { id: "studio_white",  label: "Studio White",  prompt: "Clean white studio background" },
                        { id: "gradient_blue", label: "Gradient Blue",  prompt: "Soft blue-to-purple gradient background" },
                        { id: "outdoor_park",  label: "Outdoor Park",   prompt: "Lush green park with sunlight and trees" },
                        { id: "office_desk",   label: "Office Desk",    prompt: "Modern office desk environment" },
                        { id: "abstract_dark", label: "Abstract Dark",  prompt: "Abstract dark textured background" },
                        { id: "sunset_beach",  label: "Sunset Beach",   prompt: "Golden sunset beach with ocean waves" },
                      ] as { id: string; label: string; prompt: string }[]).map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => { setCustomBgPrompt(bg.prompt); applyBackgroundSwap(bg.prompt, bg.id); }}
                          disabled={editOpPending}
                          className="rounded-full border bg-background px-2.5 py-1 text-[11px] hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Or describe a custom background…"
                        value={customBgPrompt}
                        onChange={(e) => setCustomBgPrompt(e.target.value)}
                        disabled={editOpPending}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyBackgroundSwap(customBgPrompt); } }}
                        className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                      />
                      <Button type="button" size="sm" className="h-8 shrink-0 gap-1.5 px-3" disabled={!customBgPrompt.trim() || editOpPending} onClick={() => applyBackgroundSwap(customBgPrompt)}>
                        {editOpPending ? <Spinner size={13} className="text-primary-foreground" /> : <Sparkles className="size-3.5" />}
                        {editOpPending ? "Swapping…" : "Swap"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Upscale mode ── */}
                {editMode === "upscale" && (
                  <div className="space-y-2 text-center">
                    <p className="text-[11px] text-muted-foreground">Sharpen and enhance this image using AI upscaling. Best for logos, designs, and portraits.</p>
                    <Button type="button" size="sm" className="h-8 w-full gap-1.5" disabled={editOpPending} onClick={applyUpscale}>
                      {editOpPending ? <Spinner size={13} className="text-primary-foreground" /> : <ZoomIn className="size-3.5" />}
                      {editOpPending ? "Enhancing…" : "Enhance & Upscale"}
                    </Button>
                  </div>
                )}

                {/* ── Text edit mode ── */}
                {editMode === "text_edit" && (
                  <>
                    <div className="flex flex-wrap gap-1">
                      {["Change headline to…", "Fix spelling in…", "Translate text to English"].map((chip) => (
                        <button key={chip} onClick={() => setEditPrompt(chip)} className="rounded-full border bg-background px-2 py-0.5 text-[10px] text-muted-foreground hover:border-primary hover:text-primary transition-colors">{chip}</button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Change 'GRAND OPENING' to 'SOLD OUT'"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        disabled={editOpPending}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyTextEdit(); } }}
                        className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                      />
                      <Button type="button" size="sm" className="h-8 shrink-0 gap-1.5 px-3" disabled={!editPrompt.trim() || editOpPending} onClick={applyTextEdit}>
                        {editOpPending ? <Spinner size={13} className="text-primary-foreground" /> : <Type className="size-3.5" />}
                        {editOpPending ? "Editing…" : "Edit"}
                      </Button>
                    </div>
                  </>
                )}

                {/* ── Variations mode ── */}
                {editMode === "variations" && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Optional: describe how variations should differ…"
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      disabled={editOpPending}
                      className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                    <Button type="button" size="sm" className="h-8 w-full gap-1.5" disabled={editOpPending} onClick={applyGenerateVariations}>
                      {editOpPending ? <Spinner size={13} className="text-primary-foreground" /> : <Shuffle className="size-3.5" />}
                      {editOpPending ? "Generating…" : "Generate 3 Variations"}
                    </Button>
                    {variationsResult.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/70 text-center">Click a variation above to apply it.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Edit history drawer (Sheet) ─────────────────── */}
          <Sheet open={showHistoryDrawer} onOpenChange={setShowHistoryDrawer}>
            <SheetContent
              side="right"
              className="flex h-full max-h-svh w-72 flex-col gap-0 overflow-hidden p-0 sm:w-80"
            >
              <SheetHeader className="shrink-0 border-b px-4 py-3">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-primary" /> Edit History
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-0 min-h-0 flex-1">
                <div className="pr-3">
                {editHistoryQuery.isPending ? (
                  <div className="flex flex-col gap-2 p-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                  </div>
                ) : (editHistoryQuery.data?.history ?? []).length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">No history yet.</div>
                ) : (
                  <div className="flex flex-col gap-0">
                    {(editHistoryQuery.data?.history ?? []).map((entry, i) => {
                      const opIcons: Record<string, React.ReactNode> = {
                        original: <ImageIcon className="size-3 text-muted-foreground" />,
                        instruction: <Wand2 className="size-3 text-blue-500" />,
                        style: <Palette className="size-3 text-violet-500" />,
                        erase: <Eraser className="size-3 text-red-400" />,
                        background_swap: <Layers className="size-3 text-green-500" />,
                        upscale: <ZoomIn className="size-3 text-amber-500" />,
                        text_edit: <Type className="size-3 text-cyan-500" />,
                        variation: <Shuffle className="size-3 text-pink-500" />,
                      };
                      const isCurrent = entry.imageUrl === panelImageUrl;
                      return (
                        <div key={entry.id} className={cn("flex items-start gap-3 border-b px-4 py-3 last:border-b-0 transition-colors", isCurrent && "bg-primary/5")}>
                          {/* Thumbnail */}
                          <div className="relative shrink-0">
                            <img src={entry.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                            {isCurrent && <div className="absolute inset-0 rounded-lg ring-2 ring-primary" />}
                          </div>
                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              {opIcons[entry.operationType] ?? opIcons["original"]}
                              <span className="truncate text-[11px] font-medium text-foreground">{entry.label ?? entry.operationType}</span>
                              {i === 0 && <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">Original</span>}
                            </div>
                            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                            </p>
                            {entry.prompt && <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground/70 italic">{entry.prompt}</p>}
                          </div>
                          {/* Actions */}
                          <div className="flex shrink-0 flex-col gap-1">
                            {!isCurrent && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                onClick={() => {
                                  setPanelImageHistory((h) => [panelImageUrl, ...h]);
                                  setPanelRedoStack([]);
                                  setPanelImageUrl(entry.imageUrl);
                                  setPanelHistoryEntryId(entry.id);
                                }}
                              >
                                Restore
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => {
                                if (activePanel?.type !== "media") return;
                                const ext = entry.imageUrl.includes(".png") ? "png" : "webp";
                                void downloadMediaFile(entry.imageUrl, `version-${i + 1}.${ext}`);
                              }}
                            >
                              <Download className="size-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}
