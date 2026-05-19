"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { Link, Navigate, useNavigate, useParams, useLocation } from "react-router";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AiMarkdownRenderer } from "@/components/ai/ai-markdown-renderer";
import {
  ArrowLeftIcon,
  ArrowRight,
  SendIcon,
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
import { ZeepoDomainPurchaseCard } from "@/components/zeepo/domain-purchase-card";
import type { AgentDomainCheckResult } from "@/stores/zeepo-payment-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadFiles } from "@/hooks/use-uploadthing";
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
 * Successful run_media_generation tool rows are persisted for the model but not shown
 * — the Generations strip is the user-facing surface.
 */
function shouldHideZeepoAgentToolMessageForUi(content: string | null | undefined): boolean {
  if (content == null || content.trim() === "") return false;

  // Successful run_media_generation result — shown in Generations strip instead.
  try {
    const o = JSON.parse(content) as Record<string, unknown>;
    if (o && typeof o === "object" && !Array.isArray(o) && !("error" in o)) {
      const keys = Object.keys(o);
      if (
        keys.length === 4 &&
        o.status === "QUEUED" &&
        typeof o.generationId === "string" &&
        typeof o.modelId === "string" &&
        typeof o.category === "string"
      ) {
        return true;
      }
    }
  } catch {
    // Not JSON — check plain-text markers below.
  }

  // Successful web_search grounding — raw context for the model, not for users.
  const trimmed = content.trimStart();
  if (trimmed.startsWith("WEB SEARCH")) return true;

  // Internal tool results the model synthesises into a reply — hide raw JSON.
  try {
    const o = JSON.parse(content) as Record<string, unknown>;
    if (o && typeof o === "object" && !Array.isArray(o)) {
      const tool = (o as Record<string, unknown>)._tool as string | undefined;
      if (
        tool === "check_domain_availability" ||
        tool === "create_document" ||
        tool === "get_user_session"
      ) {
        return true;
      }
      // create_document success without _tool marker (status: "CREATED")
      if (o.status === "CREATED" && typeof o.title === "string") return true;
    }
  } catch {
    // Not JSON.
  }

  return false;
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
    <div className="flex flex-col gap-4 p-2" aria-busy="true" aria-label="Loading conversation">
      <div className="flex justify-end gap-2">
        <Skeleton className="h-12 w-[min(70%,18rem)] rounded-2xl rounded-br-md" />
      </div>
      <div className="flex justify-start gap-2">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <Skeleton className="h-20 w-[min(80%,22rem)] rounded-2xl rounded-bl-md" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-[min(55%,14rem)] rounded-2xl rounded-br-md" />
      </div>
      <div className="flex justify-start gap-2">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <Skeleton className="h-16 w-[min(75%,20rem)] rounded-2xl rounded-bl-md" />
      </div>
    </div>
  );
}

type ZeepoAgentSkillRow = {
  id: string;
  category: string;
  title: string;
  description: string;
};

type InitialNavState = {
  initialMessage?: string;
  initialSkillId?: string;
  initialAttachments?: Array<{ url: string; name: string; mimeType: string }>;
} | null;

export default function ZeepoAiAgentSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: authSession, isPending: authPending } = authClient.useSession();
  const [draft, setDraft] = React.useState("");
  const [skillsOpen, setSkillsOpen] = React.useState(false);
  const [selectedSkill, setSelectedSkill] = React.useState<ZeepoAgentSkillRow | null>(null);
  type ActivePanel =
    | { type: "media"; url: string; kind: GenerationMediaKind; generationId: string }
    | { type: "document"; title: string; content: string }
    | null;
  const [activePanel, setActivePanel] = React.useState<ActivePanel>(null);
  const [docCopied, setDocCopied] = React.useState(false);

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

  const [questionFlow, setQuestionFlow] = React.useState<QuestionFlowState | null>(null);
  const [dismissedQuestionIds, setDismissedQuestionIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [pendingAttachments, setPendingAttachments] = React.useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = React.useState(false);
  const [isSwitchingChat, setIsSwitchingChat] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
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

  // Loaded lazily when the chat history dropdown opens.
  const chatHistoryQuery = trpc.zeepoAgent.sessions.list.useQuery(
    { page: 1, limit: 50 },
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
      const res = await createSession.mutateAsync({});
      void utils.zeepoAgent.sessions.list.invalidate();
      const id = res.data?.id;
      if (id) navigate(`/agency/zeepo-ai-agent/${id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create chat");
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
    },
    onError: (e) => { setEditOpPending(false); toast.error(e.message || "Image edit failed"); },
  });

  const styleTransfer = trpc.zeepoAgent.imageEdits.styleTransfer.useMutation({
    onSuccess: (r) => { applyEditResult(r.imageUrl, r.record.id); },
    onError: (e) => { setEditOpPending(false); toast.error(e.message || "Style transfer failed"); },
  });

  const eraseObject = trpc.zeepoAgent.imageEdits.eraseObject.useMutation({
    onSuccess: (r) => { applyEditResult(r.imageUrl, r.record.id); },
    onError: (e) => { setEditOpPending(false); toast.error(e.message || "Erase failed"); },
  });

  const swapBackground = trpc.zeepoAgent.imageEdits.swapBackground.useMutation({
    onSuccess: (r) => { applyEditResult(r.imageUrl, r.record.id); },
    onError: (e) => { setEditOpPending(false); toast.error(e.message || "Background swap failed"); },
  });

  const upscaleImage = trpc.zeepoAgent.imageEdits.upscaleImage.useMutation({
    onSuccess: (r) => { applyEditResult(r.imageUrl, r.record.id); },
    onError: (e) => { setEditOpPending(false); toast.error(e.message || "Upscale failed"); },
  });

  const editText = trpc.zeepoAgent.imageEdits.editText.useMutation({
    onSuccess: (r) => { applyEditResult(r.imageUrl, r.record.id); setEditPrompt(""); },
    onError: (e) => { setEditOpPending(false); toast.error(e.message || "Text edit failed"); },
  });

  const generateVariations = trpc.zeepoAgent.imageEdits.generateVariations.useMutation({
    onSuccess: (r) => {
      setEditOpPending(false);
      setVariationsResult((r.variations ?? []).filter(Boolean) as typeof variationsResult);
    },
    onError: (e) => { setEditOpPending(false); toast.error(e.message || "Variations failed"); },
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

  const utils = trpc.useUtils();
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
      toast.error(e.message || "Failed to send");
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
  const showAssistantThinking =
    send.isPending || (sessionQuery.isFetching && hasOptimisticUserBubble);

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

  async function handleFileSelect(files: FileList | null, onUploaded?: (a: Attachment) => void) {
    if (!files?.length) return;
    setIsUploading(true);
    try {
      const results = await uploadFiles("zeepoAgentAttachment", { files: Array.from(files) });
      const uploaded: Attachment[] = results.map((r, i) => ({
        url: r.url,
        name: files[i]?.name ?? r.name ?? "attachment",
        mimeType: files[i]?.type ?? "image/*",
      }));
      if (onUploaded) {
        uploaded.forEach(onUploaded);
      } else {
        setPendingAttachments((prev) => [...prev, ...uploaded].slice(0, 4));
      }
    } catch (err) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  const sendCurrentDraft = React.useCallback(() => {
    const t = draft.trim();
    if (!t || showAssistantThinking || !sessionId) return;
    const attachmentsToSend = pendingAttachments.length ? [...pendingAttachments] : undefined;
    setDraft("");
    setPendingAttachments([]);
    // Let React commit the cleared controlled textarea before the mutation disables it / runs onMutate,
    // otherwise the field can briefly keep showing the sent prompt.
    queueMicrotask(() => {
      send.mutate({
        sessionId,
        content: t,
        ...(selectedSkill ? { skillId: selectedSkill.id } : {}),
        ...(attachmentsToSend ? { attachments: attachmentsToSend } : {}),
      });
    });
  }, [draft, pendingAttachments, send, sessionId, selectedSkill, showAssistantThinking]);

  // ── Auto-send initial message from index page navigation state ──────────
  const autoSentRef = React.useRef(false);
  const sendRef = React.useRef(send.mutate);
  sendRef.current = send.mutate;

  React.useEffect(() => {
    if (autoSentRef.current) return;
    if (!sessionId) return;
    const navState = location.state as InitialNavState;
    if (!navState) return;

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
    }, 2000);
    return () => clearInterval(id);
  }, [send.isPending, sessionId, utils]);

  // Once the route param changes the new session has loaded — clear the switching flag
  // and reset the title-generation guard so it can fire for the new session.
  React.useEffect(() => {
    setIsSwitchingChat(false);
    titleGenFired.current = false;
  }, [sessionId]);

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [sessionQuery.data?.data?.messages?.length, showAssistantThinking]);

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
    return <Navigate to="/agency/zeepo-ai-agent" replace />;
  }

  const sessionLoading = sessionQuery.isPending || sessionQuery.isLoading;
  const sessionError = sessionQuery.isError;
  const sessionErr = sessionQuery.error;
  const notFound =
    sessionErr instanceof TRPCClientError && sessionErr.data?.code === "NOT_FOUND";
  const sessionErrorMessage = sessionErr?.message ?? "Could not load this chat.";

  if (sessionLoading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.8))] max-w-3xl mx-auto w-full flex-col px-4 py-2 md:px-6">
        <div className="mb-2 flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
            <Link to="/agency/zeepo-ai-agent" aria-label="Back">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <Skeleton className="h-7 flex-1 rounded-md" />
          <div className="size-8 shrink-0" />
        </div>
        <div className="min-h-0 flex-1 rounded-md border bg-muted/15 p-3">
          <ChatLoadingSkeleton />
        </div>
        <div className="mt-3 flex gap-2 opacity-50">
          <Skeleton className="h-[44px] flex-1 rounded-md" />
          <Skeleton className="h-[44px] w-[44px] rounded-md" />
        </div>
      </div>
    );
  }

  if (sessionError || !sessionQuery.data?.data) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 md:px-6">
        <Button variant="ghost" size="sm" className="w-fit gap-2" asChild>
          <Link to="/agency/zeepo-ai-agent">
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
  const generations = genQuery.data?.data ?? [];
  const genLoading = genQuery.isPending || genQuery.isLoading;
  const genError = genQuery.isError;
  const genErrorMessage = genQuery.error?.message ?? "Could not load generations.";

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

  return (
    <div className={cn(
      "relative flex h-[calc(100vh-theme(spacing.12)-theme(spacing.8))] w-full overflow-hidden transition-all duration-300",
      !activePanel && "max-w-3xl mx-auto",
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
        "flex min-w-0 flex-col py-2 transition-all duration-300 ease-in-out",
        activePanel
          ? "hidden md:flex md:w-[48%] xl:w-[52%] shrink-0 px-3 md:px-4 border-r"
          : "flex-1 px-4 md:px-6",
      )}>
      {/* ── Compact header ─────────────────────────────────── */}
      <div className="mb-2 flex items-center gap-0.5">
        {/* Back */}
        <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground" asChild>
          <Link to="/agency/zeepo-ai-agent" aria-label="Back to chats">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>

        {/* Chat title dropdown */}
        <Popover open={chatHistoryOpen} onOpenChange={setChatHistoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="min-w-0 flex-1 justify-start gap-1.5 px-2 h-8 text-sm font-semibold hover:bg-muted/60"
              aria-label="Open chat history"
            >
              <span className="truncate">
                {generateTitle.isPending ? "Naming…" : (sessionRes.title || "New chat")}
              </span>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(calc(100vw-2rem),22rem)] p-0"
            align="start"
            side="bottom"
            sideOffset={4}
            collisionPadding={12}
          >
            <Command>
              <CommandInput placeholder="Search chats…" className="h-9" />
              <CommandList className="max-h-72">
                <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                  No chats found.
                </CommandEmpty>
                <CommandGroup>
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
                            navigate(`/agency/zeepo-ai-agent/${s.id}`);
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

        {/* New chat */}
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground"
          aria-label="New chat"
          disabled={createSession.isPending}
          onClick={() => void handleNewChat()}
        >
          {createSession.isPending ? (
            <Spinner size={14} className="text-muted-foreground" />
          ) : (
            <Plus className="size-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1 rounded-xl bg-muted/15 p-3 md:p-4">
        <div className="flex flex-col gap-4 pr-2">
          {messages.length === 0 && !showAssistantThinking ? (
            <div className="flex flex-col items-center justify-center py-14 gap-5">
              <img src="/zepo.png" alt="Zeepo" className="h-75 w-75 object-contain drop-shadow-sm" width={144} height={144} />
              <div className="flex flex-col items-center gap-1.5 text-center max-w-sm">
                <p className="text-sm font-medium text-foreground">
                  {selectedSkill ? selectedSkill.title : "Your AI agent, ready to work"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedSkill
                    ? `Tell me what you need and I'll take it from here — ask follow-up questions, refine, and deliver.`
                    : "Describe what you need in plain language. Zeepo plans, executes, and iterates — writing, research, strategy, images, video, audio, and more."}
                </p>
              </div>
            </div>
          ) : null}

          {messages.map(
            (m: {
              id: string;
              role: string;
              content: string | null;
              createdAt?: Date | string | null;
            }) => {
            if (m.role === "user") {
              const ts = formatChatBubbleTime(m.createdAt);
              const msgMeta = (m.metadata ?? {}) as Record<string, unknown>;
              const msgAttachments = (msgMeta.attachments ?? []) as Attachment[];
              return (
                <div key={m.id} className="flex justify-end gap-2">
                  <div className="flex max-w-[min(85%,28rem)] flex-col items-end gap-1">
                    {/* Attachment thumbnails above the text bubble */}
                    {msgAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {msgAttachments.map((a, i) => (
                          <a
                            key={i}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-xl overflow-hidden border border-white/20 shadow-sm hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={a.url}
                              alt={a.name}
                              className="h-[5.5rem] w-auto max-w-[8rem] object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    <div
                      className={cn(
                        "w-full rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm",
                        "bg-primary text-primary-foreground",
                      )}
                    >
                      <AiMarkdownRenderer
                        content={sanitizeUserMessageForDisplay(m.content || "")}
                        className="text-primary-foreground prose-headings:text-primary-foreground prose-p:text-primary-foreground prose-li:text-primary-foreground prose-strong:text-primary-foreground prose-a:text-primary-foreground/90 prose-code:bg-white/20 prose-code:text-primary-foreground prose-pre:bg-white/15"
                      />
                    </div>
                    {ts ? (
                      <time
                        dateTime={typeof m.createdAt === "string" ? m.createdAt : m.createdAt?.toISOString()}
                        className="px-1 text-[10px] tabular-nums text-muted-foreground"
                      >
                        {ts}
                      </time>
                    ) : null}
                  </div>
                </div>
              );
            }

            if (m.role === "assistant") {
              const ts = formatChatBubbleTime(m.createdAt);
              const displayContent = sanitizeZeepoAgentAssistantDisplayMarkdown(m.content || "");
              return (
                <div key={m.id} className="flex justify-start gap-2">
                  <div className="mb-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                    <img src="/zepo.png" alt="" className="size-8 object-cover" width={32} height={32} />
                  </div>
                  <div className="flex min-w-0 max-w-[min(85%,28rem)] flex-1 flex-col items-start gap-1">
                    <div
                      className={cn(
                        "w-full rounded-2xl rounded-bl-md border bg-card px-4 py-2.5 shadow-sm",
                        "text-foreground",
                      )}
                    >
                      <AiMarkdownRenderer content={displayContent} />
                    </div>
                    {ts ? (
                      <time
                        dateTime={typeof m.createdAt === "string" ? m.createdAt : m.createdAt?.toISOString()}
                        className="px-1 text-[10px] tabular-nums text-muted-foreground"
                      >
                        {ts}
                      </time>
                    ) : null}
                  </div>
                </div>
              );
            }

            if (m.role === "tool") {
              const domainResult = parseDomainCheckResult(m.content);
              if (domainResult) {
                return (
                  <div key={m.id} className="flex justify-start gap-2">
                    <div className="mb-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                      <img src="/zepo.png" alt="" className="size-8 object-cover" width={32} height={32} />
                    </div>
                    <ZeepoDomainPurchaseCard result={domainResult} />
                  </div>
                );
              }
              if (shouldHideZeepoAgentToolMessageForUi(m.content)) {
                return null;
              }
              const ts = formatChatBubbleTime(m.createdAt);
              return (
                <div key={m.id} className="flex justify-center px-1">
                  <div className="flex max-w-full flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-full rounded-xl border border-dashed bg-muted/50 px-3 py-2 text-left",
                        "font-mono text-xs text-muted-foreground",
                      )}
                    >
                      <span className="mb-0.5 block text-[10px] font-sans font-medium uppercase tracking-wide text-muted-foreground/80">
                        Tool result
                      </span>
                      <span className="whitespace-pre-wrap break-all">{m.content}</span>
                    </div>
                    {ts ? (
                      <time
                        dateTime={typeof m.createdAt === "string" ? m.createdAt : m.createdAt?.toISOString()}
                        className="text-[10px] tabular-nums text-muted-foreground"
                      >
                        {ts}
                      </time>
                    ) : null}
                  </div>
                </div>
              );
            }

            return null;
          })}

          {showAssistantThinking ? (
            <div className="flex justify-start gap-2" aria-live="polite" aria-busy="true">
              <div className="mb-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                <img src="/zepo.png" alt="" className="size-8 object-cover" width={32} height={32} />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border bg-card px-4 py-3 shadow-sm">
                <Spinner variant="ellipsis" className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {hasIntermediateReplies ? "Still working…" : "Zeepo is thinking…"}
                </span>
              </div>
            </div>
          ) : null}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="mt-2 shrink-0">
        {generations.length > 0 || genLoading || genError ? (
          <div className="rounded-xl border bg-card p-2 shadow-sm">
            <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Generations</p>
            {genError ? (
              <Alert variant="destructive" className="mb-2 py-2">
                <AlertCircle className="size-4" />
                <AlertTitle className="text-sm">Could not refresh</AlertTitle>
                <AlertDescription className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
                  <span className="min-w-0 max-w-full break-words">{genErrorMessage}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => void genQuery.refetch()}
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="-mx-1 overflow-x-auto overflow-y-hidden px-1 pb-1">
              <div className="flex min-h-[7.25rem] w-max max-w-none gap-2 pb-1">
                {genLoading && generations.length === 0 && !genError
                  ? [0, 1, 2].map((i) => (
                      <Skeleton
                        key={`gen-skel-${i}`}
                        className="h-[7rem] w-[7rem] shrink-0 rounded-xl"
                        aria-busy="true"
                        aria-label="Loading generations"
                      />
                    ))
                  : null}
                {generations.map(
                  (g: {
                    id: string;
                    status: string;
                    modelCategory: string;
                    outputs: unknown;
                    errorMessage: string | null;
                  }) => {
                    const pending = g.status === "QUEUED" || g.status === "PROCESSING";
                    const failed = g.status === "FAILED";
                    const completed = g.status === "COMPLETED";

                    if (pending) {
                      return (
                        <div
                          key={g.id}
                          className="relative h-[7rem] w-[7rem] shrink-0 overflow-hidden rounded-xl border bg-muted/25"
                          aria-busy="true"
                          aria-label="Generation in progress"
                        >
                          <Skeleton className="absolute inset-0 rounded-xl" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Spinner variant="ellipsis" className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    }

                    if (failed) {
                      return (
                        <div
                          key={g.id}
                          className="flex h-[7rem] w-[7rem] min-w-0 shrink-0 flex-col overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5 p-1.5"
                          title={g.errorMessage ?? "Failed"}
                        >
                          <AlertCircle
                            className="mb-0.5 size-4 shrink-0 self-center text-destructive"
                            aria-hidden
                          />
                          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
                            <p className="break-words text-left text-[10px] leading-snug text-destructive [overflow-wrap:anywhere]">
                              {g.errorMessage || "Failed"}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    if (completed) {
                      // Document card — no media URL, just markdown content.
                      if (g.modelCategory === "document") {
                        const doc = extractDocument(g.outputs);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            className="relative flex h-[7rem] w-[7rem] shrink-0 flex-col overflow-hidden rounded-xl border bg-primary/5 p-2 text-left ring-offset-background transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() =>
                              doc &&
                              setActivePanel({
                                type: "document",
                                title: doc.title,
                                content: doc.content,
                              })
                            }
                          >
                            <FileText className="mb-1 size-4 shrink-0 text-primary" aria-hidden />
                            <p className="line-clamp-5 flex-1 overflow-hidden text-[10px] font-medium leading-snug text-foreground/80 [overflow-wrap:anywhere]">
                              {doc?.title ?? "Document"}
                            </p>
                          </button>
                        );
                      }

                      const mediaUrl = firstMediaUrl(g.outputs);
                      const textPreview = extractOutputPreview(g.outputs);

                      if (mediaUrl) {
                        const kind = guessMediaKind(mediaUrl, g.modelCategory);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            className="relative h-[7rem] w-[7rem] shrink-0 overflow-hidden rounded-xl border bg-muted ring-offset-background transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() =>
                              setActivePanel({
                                type: "media",
                                url: mediaUrl,
                                kind,
                                generationId: g.id,
                              })
                            }
                          >
                            {kind === "image" ? (
                              <img src={mediaUrl} alt="" className="size-full object-cover" loading="lazy" />
                            ) : kind === "video" ? (
                              <video
                                src={mediaUrl}
                                className="size-full object-cover"
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <div className="flex size-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-muted to-muted/70">
                                <Headphones className="size-9 text-muted-foreground" aria-hidden />
                              </div>
                            )}
                          </button>
                        );
                      }

                      return (
                        <div
                          key={g.id}
                          className="flex h-[7rem] w-[7rem] shrink-0 flex-col rounded-xl border bg-muted/40 p-2"
                          title={textPreview ?? ""}
                        >
                          <ImageIcon className="mb-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
                          <p className="line-clamp-6 flex-1 overflow-hidden text-[10px] leading-snug text-muted-foreground whitespace-pre-wrap">
                            {textPreview || "—"}
                          </p>
                        </div>
                      );
                    }

                    return null;
                  },
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <form
        className="mt-3 flex flex-col gap-2"
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
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
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
                              const results = await uploadFiles("zeepoAgentAttachment", {
                                files: [file],
                              });
                              const uploaded: Attachment = {
                                url: results[0].url,
                                name: file.name,
                                mimeType: file.type,
                              };
                              // Hold the upload for user confirmation — don't advance yet.
                              setQuestionFlow((prev) =>
                                prev
                                  ? { ...prev, isUploadingForStep: false, pendingUploadForStep: uploaded }
                                  : prev,
                              );
                            } catch {
                              toast.error("Upload failed. Please try again.");
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

        {selectedSkill ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs text-foreground">
              <Zap className="size-3 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 truncate font-medium">{selectedSkill.title}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedSkill(null)}
                disabled={showAssistantThinking}
                aria-label="Remove skill"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* Pending attachment thumbnails */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pendingAttachments.map((a, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <img
                    src={a.url}
                    alt={a.name}
                    className="h-16 w-16 rounded-lg object-cover border border-border shadow-sm"
                  />
                  <button
                    type="button"
                    aria-label="Remove attachment"
                    className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm hover:scale-110 transition-transform"
                    onClick={() =>
                      setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i))
                    }
                  >
                    <X className="size-3" />
                  </button>
                </div>
                <span className="max-w-[4rem] truncate text-[10px] text-muted-foreground leading-tight">
                  {a.name}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file input for the main chat upload */}
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

        <div className="flex gap-2 items-end">
          <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-[44px] w-[44px] shrink-0"
                disabled={showAssistantThinking || skillsQuery.isPending}
                aria-label="Choose a skill"
                aria-expanded={skillsOpen}
              >
                <Plus className="size-5" />
              </Button>
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

          {/* Attach image button */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-[44px] w-[44px] shrink-0"
            disabled={
              showAssistantThinking ||
              Boolean(pendingQuestionsInfo && questionFlow) ||
              isUploading ||
              pendingAttachments.length >= 4
            }
            aria-label="Attach image"
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? <Spinner className="size-4" /> : <Paperclip className="size-5" />}
          </Button>

          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              pendingQuestionsInfo && questionFlow
                ? "Answer the question above first…"
                : selectedSkill
                ? `Add details for “${selectedSkill.title}”…`
                : "Describe what you want… (or attach an image)"
            }
            className="min-h-[44px] flex-1 resize-none"
            rows={2}
            disabled={showAssistantThinking || Boolean(pendingQuestionsInfo && questionFlow)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendCurrentDraft();
              }
            }}
          />
          <Button type="submit" size="icon" className="h-[44px] w-[44px] shrink-0" disabled={showAssistantThinking || Boolean(pendingQuestionsInfo && questionFlow)}>
            {send.isPending ? (
              <Spinner variant="ellipsis" className="h-4 w-4 text-primary-foreground" />
            ) : (
              <SendIcon className="size-4" />
            )}
          </Button>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground px-1">
          Agents can make mistakes. Verify important info. Don&apos;t share sensitive data.
        </p>
      </form>
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
                  : activePanel.type === "media" && activePanel.kind === "audio"
                  ? <Headphones className="size-3.5 text-primary" />
                  : <ImageIcon className="size-3.5 text-primary" />}
              </div>
              <span className="truncate text-sm font-semibold">
                {activePanel.type === "document"
                  ? activePanel.title
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
              <Button variant="ghost" size="icon" className="size-7" aria-label="Close panel" onClick={() => { setActivePanel(null); setDocCopied(false); setShowHistoryDrawer(false); }}>
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
            <SheetContent side="right" className="w-72 sm:w-80 flex flex-col p-0">
              <SheetHeader className="border-b px-4 py-3">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <Clock className="size-4 text-primary" /> Edit History
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1">
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
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}
