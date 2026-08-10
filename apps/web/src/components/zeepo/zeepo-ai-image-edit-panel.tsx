"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  Download,
  Eraser,
  ImageIcon,
  Layers,
  Paintbrush,
  Palette,
  Redo2,
  Shuffle,
  Sparkles,
  SplitSquareHorizontal,
  Trash2,
  Type,
  Undo2,
  Wand2,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

type ImageEditMode =
  | "instruct"
  | "style"
  | "erase"
  | "background"
  | "upscale"
  | "text_edit"
  | "variations";

type HistoryEntry = {
  id: string;
  imageUrl: string;
  operationType: string;
  label: string;
  prompt?: string;
  createdAt: string;
};

const STYLE_PRESETS = [
  { id: "watercolor", img: "/image_edit_icons/watercolor.png", label: "Watercolor" },
  { id: "oil_painting", img: "/image_edit_icons/oilpaint.png", label: "Oil Paint" },
  { id: "cinematic", img: "/image_edit_icons/cinematic.png", label: "Cinematic" },
  { id: "anime", img: "/image_edit_icons/anime.png", label: "Anime" },
  { id: "pixel_art", img: "/image_edit_icons/pixel.png", label: "Pixel Art" },
  { id: "neon", img: "/image_edit_icons/neon.png", label: "Neon Glow" },
  { id: "pencil_sketch", img: "/image_edit_icons/sketch.png", label: "Sketch" },
  { id: "vintage", img: "/image_edit_icons/vintage.png", label: "Vintage" },
] as const;

const BG_PRESETS = [
  { id: "studio_white", label: "Studio White", prompt: "Clean white studio background" },
  { id: "gradient_blue", label: "Gradient Blue", prompt: "Soft blue-to-purple gradient background" },
  { id: "outdoor_park", label: "Outdoor Park", prompt: "Lush green park with sunlight and trees" },
  { id: "office_desk", label: "Office Desk", prompt: "Modern office desk environment" },
  { id: "abstract_dark", label: "Abstract Dark", prompt: "Abstract dark textured background" },
  { id: "sunset_beach", label: "Sunset Beach", prompt: "Golden sunset beach with ocean waves" },
] as const;

const EDIT_TABS: { id: ImageEditMode; label: string; icon: React.ReactNode }[] = [
  { id: "instruct", icon: <Wand2 className="size-3" />, label: "Instruct" },
  { id: "style", icon: <Palette className="size-3" />, label: "Style" },
  { id: "erase", icon: <Eraser className="size-3" />, label: "Erase" },
  { id: "background", icon: <Layers className="size-3" />, label: "Background" },
  { id: "upscale", icon: <ZoomIn className="size-3" />, label: "Upscale" },
  { id: "text_edit", icon: <Type className="size-3" />, label: "Text" },
  { id: "variations", icon: <Shuffle className="size-3" />, label: "Variations" },
];

function mockToast(_action: string) {
  // no-op — live edits use sonner success/error
}

async function downloadUrl(url: string, filename: string) {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** Agent-parity image edit panel — live Zeepo AI Gemini edits. */
export function ZeepoAiImageEditPanel({
  url,
  title,
  generationId,
  sessionId,
  onClose,
  viewOnly = false,
}: {
  url: string;
  title?: string;
  generationId: string;
  sessionId: string;
  onClose?: () => void;
  viewOnly?: boolean;
}) {
  const [panelImageUrl, setPanelImageUrl] = useState(url);
  const [panelImageHistory, setPanelImageHistory] = useState<string[]>([]);
  const [panelRedoStack, setPanelRedoStack] = useState<string[]>([]);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [outputResolution, setOutputResolution] = useState<"1 MP" | "2 MP">("1 MP");
  const [outputFormat, setOutputFormat] = useState<"webp" | "png">("png");
  const [editMode, setEditMode] = useState<ImageEditMode>("instruct");
  const [editPrompt, setEditPrompt] = useState("");
  const [editBrushMode, setEditBrushMode] = useState(false);
  const [brushSize, setBrushSize] = useState(28);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [customBgPrompt, setCustomBgPrompt] = useState("");
  const [editOpPending, setEditOpPending] = useState(false);
  const [editOpLabel, setEditOpLabel] = useState("Applying edit…");
  const [variationsResult, setVariationsResult] = useState<
    { id: string; imageUrl: string }[]
  >([]);
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      id: `${generationId}-original`,
      imageUrl: url,
      operationType: "original",
      label: "Original",
      createdAt: new Date().toISOString(),
    },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panelImgRef = useRef<HTMLImageElement>(null);
  const drawingRef = useRef(false);
  const [historyEntryId, setHistoryEntryId] = useState<string | undefined>();

  const historyQuery = trpc.zeepoAi.imageEdits.listEditHistory.useQuery(
    { generationId },
    { enabled: Boolean(generationId) },
  );
  const instructMut = trpc.zeepoAi.imageEdits.instruct.useMutation();
  const styleMut = trpc.zeepoAi.imageEdits.styleTransfer.useMutation();
  const eraseMut = trpc.zeepoAi.imageEdits.eraseObject.useMutation();
  const bgMut = trpc.zeepoAi.imageEdits.swapBackground.useMutation();
  const upscaleMut = trpc.zeepoAi.imageEdits.upscaleImage.useMutation();
  const textMut = trpc.zeepoAi.imageEdits.editText.useMutation();
  const variationsMut = trpc.zeepoAi.imageEdits.generateVariations.useMutation();
  const saveMut = trpc.zeepoAi.imageEdits.saveEditedImage.useMutation();

  useEffect(() => {
    const rows = historyQuery.data?.history;
    if (!rows?.length) return;
    setHistory(
      rows.map((r) => ({
        id: r.id,
        imageUrl: r.imageUrl,
        operationType: r.operationType,
        label: r.label ?? r.operationType,
        prompt: r.prompt ?? undefined,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt),
      })),
    );
    const latest = rows[rows.length - 1];
    if (latest) {
      setHistoryEntryId(latest.id);
      setPanelImageUrl(latest.imageUrl);
    }
  }, [historyQuery.data]);

  useEffect(() => {
    if (!sessionId || !generationId || !url) return;
    if ((historyQuery.data?.history?.length ?? 0) > 0) return;
    if (historyQuery.isLoading) return;
    void saveMut
      .mutateAsync({
        sessionId,
        generationId,
        imageUrl: url,
        operationType: "original",
        label: "Original",
      })
      .then((res) => {
        if (res.record?.id) setHistoryEntryId(res.record.id);
        void historyQuery.refetch();
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, generationId, url, historyQuery.data, historyQuery.isLoading]);


  useEffect(() => {
    setPanelImageUrl(url);
    setPanelImageHistory([]);
    setPanelRedoStack([]);
    setShowBeforeAfter(false);
    setEditPrompt("");
    setEditBrushMode(false);
    setHasDrawing(false);
    setEditMode("instruct");
    setVariationsResult([]);
    setCustomBgPrompt("");
    setEditOpPending(false);
    setHistory([
      {
        id: `${generationId}-original`,
        imageUrl: url,
        operationType: "original",
        label: "Original",
        createdAt: new Date().toISOString(),
      },
    ]);
  }, [url, generationId]);

  const syncCanvasSize = () => {
    const img = panelImgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const rect = img.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width));
    canvas.height = Math.max(1, Math.round(rect.height));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };

  useEffect(() => {
    if (!editBrushMode) return;
    syncCanvasSize();
    const onResize = () => syncCanvasSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [editBrushMode, panelImageUrl]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawing(false);
  };

  const paintAt = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.fillStyle = "rgba(239, 68, 68, 0.45)";
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    setHasDrawing(true);
  };

  const captureMaskDataUrl = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawing) return null;
    return canvas.toDataURL("image/png");
  };

  const applyEditResult = (nextUrl: string, label: string, recordId?: string) => {
    setPanelImageHistory((h) => [panelImageUrl, ...h]);
    setPanelRedoStack([]);
    setPanelImageUrl(nextUrl);
    if (recordId) setHistoryEntryId(recordId);
    setHistory((prev) => [
      {
        id: recordId ?? `${generationId}-${Date.now()}`,
        imageUrl: nextUrl,
        operationType: editMode,
        label,
        prompt: editPrompt || customBgPrompt || undefined,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setVariationsResult([]);
    toast.success(label);
  };

  const runMockOp = async (label: string, _nextUrl?: string) => {
    if (!sessionId) {
      toast.error("Missing session — reopen the image from chat.");
      return;
    }
    setEditOpPending(true);
    setEditOpLabel(label);
    try {
      let imageUrl = panelImageUrl;
      let recordId: string | undefined;
      if (editMode === "instruct") {
        const maskDataUrl = editBrushMode ? captureMaskDataUrl() ?? undefined : undefined;
        const res = await instructMut.mutateAsync({
          sessionId,
          generationId,
          parentId: historyEntryId,
          imageUrl: panelImageUrl,
          prompt: editPrompt.trim() || label,
          maskDataUrl,
        });
        imageUrl = res.imageUrl;
        recordId = res.record?.id;
      } else if (editMode === "style") {
        const preset = STYLE_PRESETS.find((s) => label.includes(s.label));
        const res = await styleMut.mutateAsync({
          sessionId,
          generationId,
          parentId: historyEntryId,
          imageUrl: panelImageUrl,
          style: (preset?.id ?? "watercolor") as (typeof STYLE_PRESETS)[number]["id"],
        });
        imageUrl = res.imageUrl;
        recordId = res.record?.id;
      } else if (editMode === "erase") {
        const maskDataUrl = captureMaskDataUrl();
        if (!maskDataUrl) throw new Error("Paint a mask first");
        const res = await eraseMut.mutateAsync({
          sessionId,
          generationId,
          parentId: historyEntryId,
          imageUrl: panelImageUrl,
          maskDataUrl,
        });
        imageUrl = res.imageUrl;
        recordId = res.record?.id;
      } else if (editMode === "background") {
        const preset = BG_PRESETS.find((b) => label.includes(b.label));
        const res = await bgMut.mutateAsync({
          sessionId,
          generationId,
          parentId: historyEntryId,
          imageUrl: panelImageUrl,
          bgPrompt: customBgPrompt.trim() || preset?.prompt || "Clean studio background",
          bgPreset: preset?.id,
        });
        imageUrl = res.imageUrl;
        recordId = res.record?.id;
      } else if (editMode === "upscale") {
        const res = await upscaleMut.mutateAsync({
          sessionId,
          generationId,
          parentId: historyEntryId,
          imageUrl: panelImageUrl,
        });
        imageUrl = res.imageUrl;
        recordId = res.record?.id;
      } else if (editMode === "text_edit") {
        const res = await textMut.mutateAsync({
          sessionId,
          generationId,
          parentId: historyEntryId,
          imageUrl: panelImageUrl,
          prompt: editPrompt.trim() || label,
        });
        imageUrl = res.imageUrl;
        recordId = res.record?.id;
      } else if (editMode === "variations") {
        const res = await variationsMut.mutateAsync({
          sessionId,
          generationId,
          parentId: historyEntryId,
          imageUrl: panelImageUrl,
          prompt: editPrompt.trim() || undefined,
        });
        const vars = (res.variations ?? []).filter(Boolean) as Array<{
          imageUrl: string;
          record: { id: string };
        }>;
        setVariationsResult(
          vars.map((v, i) => ({ id: v.record?.id ?? `var-${i}`, imageUrl: v.imageUrl })),
        );
        const first = vars[0];
        if (!first) throw new Error("No variations returned");
        imageUrl = first.imageUrl;
        recordId = first.record?.id;
      } else {
        throw new Error("Unknown edit mode");
      }
      applyEditResult(imageUrl, label, recordId);
      void historyQuery.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Edit failed");
    } finally {
      setEditOpPending(false);
    }
  };

  const undoPanelEdit = () => {
    if (!panelImageHistory.length) return;
    const [prev, ...rest] = panelImageHistory;
    setPanelRedoStack((s) => [panelImageUrl, ...s]);
    setPanelImageHistory(rest);
    setPanelImageUrl(prev!);
  };

  const redoPanelEdit = () => {
    if (!panelRedoStack.length) return;
    const [next, ...rest] = panelRedoStack;
    setPanelImageHistory((h) => [panelImageUrl, ...h]);
    setPanelRedoStack(rest);
    setPanelImageUrl(next!);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header controls */}
      <div className="relative z-20 flex shrink-0 items-center gap-1 border-b bg-background px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="shrink-0 rounded-lg bg-primary/10 p-1.5">
            <ImageIcon className="size-3.5 text-primary" />
          </div>
          <span className="truncate text-sm font-semibold">{title || "Image"}</span>
        </div>

        {!viewOnly && (
          <>
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

            {panelImageHistory.length > 0 ? (
              <Button variant="ghost" size="icon" className="size-7" title="Undo" onClick={undoPanelEdit}>
                <Undo2 className="size-3.5" />
              </Button>
            ) : null}

            {panelRedoStack.length > 0 ? (
              <Button variant="ghost" size="icon" className="size-7" title="Redo" onClick={redoPanelEdit}>
                <Redo2 className="size-3.5" />
              </Button>
            ) : null}

            <Button
              variant="ghost"
              size="icon"
              className={cn("size-7", showHistoryDrawer && "bg-primary/10 text-primary")}
              title="Edit history"
              onClick={() => setShowHistoryDrawer(true)}
            >
              <Clock className="size-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[11px] font-normal text-muted-foreground"
                >
                  {outputResolution} · {outputFormat.toUpperCase()}
                  <ChevronDown className="size-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Resolution
                </p>
                {(["1 MP", "2 MP"] as const).map((r) => (
                  <DropdownMenuItem key={r} onClick={() => setOutputResolution(r)} className="gap-2">
                    {outputResolution === r && <Check className="size-3 text-primary" />}
                    <span className={outputResolution === r ? "" : "pl-5"}>{r}</span>
                  </DropdownMenuItem>
                ))}
                <p className="mt-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Format
                </p>
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

        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          title="Download"
          onClick={() =>
            void downloadUrl(
              panelImageUrl,
              `zeepo-generation-${generationId.slice(0, 8)}.${outputFormat}`,
            )
          }
        >
          <Download className="size-3.5" />
        </Button>

        {onClose ? (
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
        ) : null}
      </div>

      {/* Image body — must shrink; never paint over toolbar */}
      <div className="relative z-0 flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/10">
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-3 sm:p-4">
          {editOpPending ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/75 backdrop-blur-sm">
              <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-xs font-medium text-foreground/80">{editOpLabel}</p>
              <p className="text-[11px] text-muted-foreground">This usually takes 10–30 seconds</p>
            </div>
          ) : null}

          {showBeforeAfter && panelImageHistory.length > 0 ? (
            <div className="flex h-full max-h-full w-full min-h-0 gap-2 overflow-hidden rounded-xl">
              <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-hidden">
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Before
                </span>
                <div className="relative min-h-0 w-full flex-1 overflow-hidden">
                  <img
                    src={panelImageHistory[0] ?? url}
                    alt="before"
                    className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
                    draggable={false}
                  />
                </div>
              </div>
              <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-hidden">
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-primary">
                  After
                </span>
                <div className="relative min-h-0 w-full flex-1 overflow-hidden">
                  <img
                    src={panelImageUrl}
                    alt="after"
                    className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="relative h-full w-full min-h-0 overflow-hidden">
              <img
                ref={panelImgRef}
                src={panelImageUrl}
                alt={title || ""}
                className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
                draggable={false}
                onLoad={syncCanvasSize}
              />
              {(editMode === "instruct" || editMode === "erase") && editBrushMode ? (
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 cursor-crosshair"
                  style={{ touchAction: "none" }}
                  onMouseDown={(e) => {
                    drawingRef.current = true;
                    paintAt(e);
                  }}
                  onMouseMove={(e) => {
                    if (!drawingRef.current) return;
                    paintAt(e);
                  }}
                  onMouseUp={() => {
                    drawingRef.current = false;
                  }}
                  onMouseLeave={() => {
                    drawingRef.current = false;
                  }}
                />
              ) : null}
            </div>
          )}

          {variationsResult.length > 0 ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-2 px-2">
              {variationsResult.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setPanelImageHistory((h) => [panelImageUrl, ...h]);
                    setPanelImageUrl(v.imageUrl);
                    setPanelRedoStack([]);
                  }}
                  className="pointer-events-auto group relative overflow-hidden rounded-lg border-2 border-transparent transition-all hover:border-primary focus:border-primary focus:outline-none"
                  title={`Select variation ${i + 1}`}
                >
                  <img
                    src={v.imageUrl}
                    alt={`Variation ${i + 1}`}
                    className="h-16 w-16 object-cover sm:h-20 sm:w-20"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-center text-[10px] text-white">
                    V{i + 1}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Edit toolbar — always below media, never covered */}
      {!viewOnly && (
        <div className="relative z-20 shrink-0 border-t bg-background">
          <div className="flex items-center gap-0.5 overflow-x-auto border-b px-2 py-1.5 scrollbar-none">
            {EDIT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setEditMode(tab.id);
                setEditBrushMode(tab.id === "erase");
                setVariationsResult([]);
              }}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                editMode === tab.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-2 px-3 py-2.5">
          {editMode === "instruct" ? (
            <>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("size-7 shrink-0", editBrushMode && "bg-primary/10 text-primary")}
                  title="Toggle brush mask"
                  onClick={() => setEditBrushMode((v) => !v)}
                >
                  <Paintbrush className="size-3.5" />
                </Button>
                {editBrushMode ? (
                  <>
                    <input
                      type="range"
                      min={8}
                      max={80}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="h-1.5 flex-1 accent-primary"
                      aria-label="Brush size"
                    />
                    <span className="w-6 shrink-0 text-center text-[11px] text-muted-foreground">
                      {brushSize}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={!hasDrawing}
                      onClick={clearCanvas}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                {["Remove background", "Make it brighter", "Add soft shadow", "Change to dark mode"].map(
                  (chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setEditPrompt(chip)}
                      className="rounded-full border bg-background px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {chip}
                    </button>
                  ),
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={
                    editBrushMode
                      ? "Describe what to put in the painted area…"
                      : "Describe your edit (e.g. change shirt to blue)…"
                  }
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  disabled={editOpPending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && editPrompt.trim()) {
                      e.preventDefault();
                      void runMockOp("Apply instruction");
                    }
                  }}
                  className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 px-3"
                  disabled={
                    !editPrompt.trim() ||
                    editOpPending ||
                    (editBrushMode && !hasDrawing)
                  }
                  onClick={() => void runMockOp("Apply instruction")}
                >
                  <Wand2 className="size-3.5" />
                  Apply
                </Button>
              </div>
            </>
          ) : null}

          {editMode === "style" ? (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1.5">
                {STYLE_PRESETS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => void runMockOp(`Style · ${s.label}`)}
                    disabled={editOpPending}
                    className="flex flex-col items-center gap-1 rounded-xl border bg-background px-1 py-2 text-center transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <img
                      src={s.img}
                      alt={s.label}
                      className="h-8 w-8 rounded-md object-cover"
                      draggable={false}
                    />
                    <span className="text-[10px] font-medium leading-tight text-foreground/80">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {editMode === "erase" ? (
            <>
              <div className="flex items-center gap-2">
                <Eraser className="size-3.5 shrink-0 text-muted-foreground" />
                <input
                  type="range"
                  min={8}
                  max={80}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="h-1.5 flex-1 accent-primary"
                  aria-label="Brush size"
                />
                <span className="w-6 shrink-0 text-center text-[11px] text-muted-foreground">
                  {brushSize}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={!hasDrawing}
                  onClick={clearCanvas}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                Paint over the object you want to remove, then click Erase.
              </p>
              <Button
                type="button"
                size="sm"
                className="h-8 w-full gap-1.5"
                disabled={!hasDrawing || editOpPending}
                onClick={() => void runMockOp("Erase region")}
              >
                <Eraser className="size-3.5" />
                Erase Selected Region
              </Button>
            </>
          ) : null}

          {editMode === "background" ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {BG_PRESETS.map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => {
                      setCustomBgPrompt(bg.prompt);
                      void runMockOp(`Background · ${bg.label}`);
                    }}
                    disabled={editOpPending}
                    className="rounded-full border bg-background px-2.5 py-1 text-[11px] transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customBgPrompt.trim()) {
                      e.preventDefault();
                      void runMockOp("Background swap");
                    }
                  }}
                  className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 px-3"
                  disabled={!customBgPrompt.trim() || editOpPending}
                  onClick={() => void runMockOp("Background swap")}
                >
                  <Sparkles className="size-3.5" />
                  Swap
                </Button>
              </div>
            </div>
          ) : null}

          {editMode === "upscale" ? (
            <div className="space-y-2 text-center">
              <p className="text-[11px] text-muted-foreground">
                Sharpen and enhance this image using AI upscaling. Best for logos, designs, and
                portraits.
              </p>
              <Button
                type="button"
                size="sm"
                className="h-8 w-full gap-1.5"
                disabled={editOpPending}
                onClick={() => void runMockOp("Enhance & upscale")}
              >
                <ZoomIn className="size-3.5" />
                Enhance & Upscale
              </Button>
            </div>
          ) : null}

          {editMode === "text_edit" ? (
            <>
              <div className="flex flex-wrap gap-1">
                {["Change headline to…", "Fix spelling in…", "Translate text to English"].map(
                  (chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setEditPrompt(chip)}
                      className="rounded-full border bg-background px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {chip}
                    </button>
                  ),
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Change 'GRAND OPENING' to 'SOLD OUT'"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  disabled={editOpPending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editPrompt.trim()) {
                      e.preventDefault();
                      void runMockOp("Edit text");
                    }
                  }}
                  className="flex-1 rounded-lg border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 px-3"
                  disabled={!editPrompt.trim() || editOpPending}
                  onClick={() => void runMockOp("Edit text")}
                >
                  <Type className="size-3.5" />
                  Edit
                </Button>
              </div>
            </>
          ) : null}

          {editMode === "variations" ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Optional: describe how variations should differ…"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                disabled={editOpPending}
                className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <Button
                type="button"
                size="sm"
                className="h-8 w-full gap-1.5"
                disabled={editOpPending}
                onClick={() => void runMockOp("Generate variations")}
              >
                <Shuffle className="size-3.5" />
                Generate 3 Variations
              </Button>
              {variationsResult.length > 0 ? (
                <p className="text-center text-[10px] text-muted-foreground/70">
                  Click a variation above to apply it.
                </p>
              ) : null}
            </div>
          ) : null}
          </div>
        </div>
      )}

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
              <div className="flex flex-col gap-0">
                {history.map((entry, i) => {
                  const isCurrent = entry.imageUrl === panelImageUrl && i === 0
                    ? true
                    : entry.imageUrl === panelImageUrl;
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-start gap-3 border-b px-4 py-3 last:border-b-0 transition-colors",
                        isCurrent && "bg-primary/5",
                      )}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={entry.imageUrl}
                          alt=""
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        {isCurrent ? (
                          <div className="absolute inset-0 rounded-lg ring-2 ring-primary" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="truncate text-[11px] font-medium text-foreground">
                            {entry.label}
                          </span>
                          {i === history.length - 1 ? (
                            <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                              Original
                            </span>
                          ) : null}
                        </div>
                        {entry.prompt ? (
                          <p className="mt-0.5 line-clamp-1 text-[10px] italic text-muted-foreground/70">
                            {entry.prompt}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        {!isCurrent ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => {
                              setPanelImageHistory((h) => [panelImageUrl, ...h]);
                              setPanelRedoStack([]);
                              setPanelImageUrl(entry.imageUrl);
                            }}
                          >
                            Restore
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px]"
                          onClick={() =>
                            void downloadUrl(entry.imageUrl, `version-${i + 1}.png`)
                          }
                        >
                          <Download className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
