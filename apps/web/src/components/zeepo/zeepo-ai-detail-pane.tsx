"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Download,
  FileText,
  Presentation,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ZeepoAiImageEditPanel } from "@/components/zeepo/zeepo-ai-image-edit-panel";
import { ZeepoDocumentPdf } from "@/components/zeepo/document-pdf";
import {
  generatePresentationPdfBlob,
  type PresentationData,
  type PresentationSlide,
  type PresentationTheme,
} from "@/components/zeepo/presentation-pdf";
import { generatePresentationPptx } from "@/lib/generate-presentation-pptx";
import { downloadBlob, slugifyFilename } from "@/lib/download-blob";
import type {
  ZeepoAiActivePanel,
  ZeepoAiPresentationData,
} from "@/components/zeepo/zeepo-ai-types";

const SLIDE_LAYOUTS = new Set([
  "title",
  "content",
  "bullets",
  "image-full",
  "two-column",
  "quote",
  "section-break",
  "stats",
  "chart",
  "timeline",
  "big-number",
]);

function toPresentationData(data: ZeepoAiPresentationData): PresentationData {
  const themeRaw = (data.theme ?? "light").toLowerCase();
  const theme: PresentationTheme =
    themeRaw === "dark" ||
    themeRaw === "branded" ||
    themeRaw === "minimal" ||
    themeRaw === "light"
      ? themeRaw
      : "light";

  const slides: PresentationSlide[] = (data.slides ?? []).map((s) => {
    const layout =
      s.layout && SLIDE_LAYOUTS.has(s.layout)
        ? (s.layout as PresentationSlide["layout"])
        : s.bullets?.length
          ? "bullets"
          : "content";
    return {
      layout,
      title: s.title,
      subtitle: s.subtitle,
      body: s.body,
      bullets: s.bullets,
    };
  });

  return {
    title: data.title || "Presentation",
    theme,
    slides: slides.length > 0 ? slides : [{ layout: "title", title: data.title || "Presentation" }],
  };
}

export function ZeepoAiDetailPane({
  panel,
  sessionId,
  onClose,
  className,
  viewOnly = false,
}: {
  panel: NonNullable<ZeepoAiActivePanel>;
  sessionId?: string;
  onClose: () => void;
  className?: string;
  viewOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [exporting, setExporting] = useState(false);

  const title =
    panel.type === "image"
      ? panel.title || "Generated image"
      : panel.type === "document"
        ? panel.title
        : panel.data.title;

  const copyDoc = async () => {
    if (panel.type !== "document") return;
    try {
      await navigator.clipboard.writeText(panel.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };

  const downloadMd = () => {
    if (panel.type !== "document") return;
    const slug = slugifyFilename(panel.title, "document");
    downloadBlob(`${slug}.md`, new Blob([panel.content], { type: "text/markdown;charset=utf-8" }));
  };

  const downloadDocPdf = async () => {
    if (panel.type !== "document") return;
    setExporting(true);
    try {
      const blob = await pdf(
        <ZeepoDocumentPdf title={panel.title} content={panel.content} />,
      ).toBlob();
      downloadBlob(`${slugifyFilename(panel.title, "document")}.pdf`, blob);
    } catch {
      toast.error("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const downloadPresentationPdf = async () => {
    if (panel.type !== "presentation") return;
    setExporting(true);
    try {
      const blob = await generatePresentationPdfBlob(toPresentationData(panel.data));
      downloadBlob(`${slugifyFilename(panel.data.title, "presentation")}.pdf`, blob);
    } catch {
      toast.error("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const downloadPresentationPptx = async () => {
    if (panel.type !== "presentation") return;
    setExporting(true);
    try {
      const blob = await generatePresentationPptx(toPresentationData(panel.data));
      downloadBlob(`${slugifyFilename(panel.data.title, "presentation")}.pptx`, blob);
    } catch {
      toast.error("PPTX export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (panel.type === "image") {
    return (
      <aside className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden bg-background", className)}>
        <ZeepoAiImageEditPanel
          url={panel.url}
          title={title}
          generationId={panel.generationId}
          sessionId={sessionId ?? ""}
          onClose={onClose}
          viewOnly={viewOnly}
        />
      </aside>
    );
  }

  return (
    <aside className={cn("flex h-full min-h-0 w-full flex-col overflow-hidden bg-background", className)}>
      <div className="relative z-20 flex shrink-0 items-center gap-2 border-b bg-background px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="shrink-0 rounded-lg bg-primary/10 p-1.5">
            {panel.type === "document" ? (
              <FileText className="size-3.5 text-primary" />
            ) : (
              <Presentation className="size-3.5 text-primary" />
            )}
          </div>
          <span className="truncate text-sm font-semibold">{title}</span>
        </div>

        {panel.type === "document" ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Copy"
              onClick={copyDoc}
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Download markdown"
              onClick={downloadMd}
            >
              <Download className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              disabled={exporting}
              onClick={() => void downloadDocPdf()}
            >
              <FileText className="size-3.5" />
              PDF
            </Button>
          </>
        ) : null}

        {panel.type === "presentation" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 px-2.5 text-xs"
                disabled={exporting}
              >
                <Download className="size-3.5" /> Export{" "}
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => void downloadPresentationPdf()}>
                <FileText className="mr-2 size-4" /> Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void downloadPresentationPptx()}>
                <Download className="mr-2 size-4" /> Download PPTX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Close panel"
          onClick={onClose}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {panel.type === "document" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="prose prose-sm dark:prose-invert max-w-none px-4 py-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{panel.content}</ReactMarkdown>
          </div>
        </div>
      ) : null}

      {panel.type === "presentation" ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex min-h-full flex-col justify-center rounded-xl border border-border bg-muted/20 px-5 py-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Slide {slideIndex + 1} / {panel.data.slides.length}
              </p>
              <h3 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
                {panel.data.slides[slideIndex]?.title}
              </h3>
              {panel.data.slides[slideIndex]?.subtitle ? (
                <p className="mb-2 text-sm text-muted-foreground">
                  {panel.data.slides[slideIndex]?.subtitle}
                </p>
              ) : null}
              {panel.data.slides[slideIndex]?.body ? (
                <p className="text-sm leading-relaxed text-foreground/85">
                  {panel.data.slides[slideIndex]?.body}
                </p>
              ) : null}
              {panel.data.slides[slideIndex]?.bullets?.length ? (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-foreground/85">
                  {panel.data.slides[slideIndex]?.bullets?.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          <div className="relative z-20 flex shrink-0 items-center justify-between border-t bg-background px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={slideIndex === 0}
              onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="size-3.5" />
              Prev
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={slideIndex >= panel.data.slides.length - 1}
              onClick={() =>
                setSlideIndex((i) => Math.min(panel.data.slides.length - 1, i + 1))
              }
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </>
      ) : null}
    </aside>
  );
}
