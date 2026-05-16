"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { Link, Navigate, useNavigate } from "react-router";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowUp,
  Plus,
  TrendingUp,
  Target,
  Mic,
  Lightbulb,
  Palette,
  ChevronRight,
  X,
  Clock,
  Zap,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { uploadFiles } from "@/hooks/use-uploadthing";

type Attachment = { url: string; name: string; mimeType: string };

const SUGGESTION_CHIPS = [
  {
    id: "validate-business-idea",
    label: "Validate business idea",
    icon: TrendingUp,
  },
  {
    id: "define-value-proposition",
    label: "Define value proposition",
    icon: Target,
  },
  {
    id: "define-brand-voice",
    label: "Define brand voice",
    icon: Mic,
  },
  {
    id: "brainstorm-business-names",
    label: "Brainstorm names",
    icon: Lightbulb,
  },
  {
    id: "pick-color-palette",
    label: "Pick a color palette",
    icon: Palette,
  },
] as const;

export default function ZeepoAiAgentIndexPage() {
  const { data: session, isPending: authPending } = authClient.useSession();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [draft, setDraft] = React.useState("");
  const [pendingAttachments, setPendingAttachments] = React.useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [skillsSheetOpen, setSkillsSheetOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const listQuery = trpc.zeepoAgent.sessions.list.useQuery(
    { page: 1, limit: 30 },
    { enabled: Boolean(session?.user), retry: 1 },
  );

  const skillsQuery = trpc.zeepoAgent.skills.list.useQuery(undefined, {
    enabled: Boolean(session?.user),
    staleTime: 60 * 60 * 1000,
  });

  const createSession = trpc.zeepoAgent.sessions.create.useMutation();

  // Auto-resize textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

  const handleSubmit = async (opts?: {
    message?: string;
    skillId?: string;
    attachments?: Attachment[];
  }) => {
    const message = opts?.message ?? draft.trim();
    const attachments = opts?.attachments ?? pendingAttachments;
    if (!message && attachments.length === 0) return;

    try {
      const res = await createSession.mutateAsync({});
      void utils.zeepoAgent.sessions.list.invalidate();
      const id = res.data?.id;
      if (id) {
        navigate(`/agency/zeepo-ai-agent/${id}`, {
          state: {
            initialMessage: message,
            initialSkillId: opts?.skillId,
            initialAttachments: attachments.length ? attachments : undefined,
          },
        });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create chat");
    }
  };

  const handleChipClick = async (skillId: string) => {
    try {
      const res = await createSession.mutateAsync({});
      void utils.zeepoAgent.sessions.list.invalidate();
      const id = res.data?.id;
      if (id) {
        navigate(`/agency/zeepo-ai-agent/${id}`, {
          state: { initialSkillId: skillId, initialMessage: "" },
        });
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create chat");
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsUploading(true);
    try {
      const fileArray = Array.from(files);
      const results = await uploadFiles("zeepoAgentAttachment", { files: fileArray });
      setPendingAttachments((prev) =>
        [
          ...prev,
          ...results.map((r, i) => ({
            url: r.url,
            name: fileArray[i]?.name ?? r.name ?? "attachment",
            mimeType: fileArray[i]?.type ?? "image/*",
          })),
        ].slice(0, 4),
      );
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Group skills by category for the "All skills" sheet
  const skillsByCategory = React.useMemo(() => {
    const rows = skillsQuery.data?.data ?? [];
    const order: string[] = [];
    const buckets = new Map<string, typeof rows>();
    for (const s of rows) {
      if (!buckets.has(s.category)) {
        order.push(s.category);
        buckets.set(s.category, []);
      }
      buckets.get(s.category)!.push(s);
    }
    return order.map((cat) => [cat, buckets.get(cat)!] as const);
  }, [skillsQuery.data?.data]);

  if (authPending) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <Spinner size={32} className="text-muted-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/auth/login" replace />;
  }

  const rows = listQuery.data?.data ?? [];
  const canSend =
    (draft.trim().length > 0 || pendingAttachments.length > 0) &&
    !createSession.isPending &&
    !isUploading;

  return (
    <div className="relative flex h-[calc(100vh-theme(spacing.12)-theme(spacing.8))] flex-col items-center justify-center px-4">
      {/* History + Actions row — top right */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setHistoryOpen(true)}
        >
          <Clock className="size-4" />
          <span className="hidden sm:inline text-sm">Recent chats</span>
        </Button>
      </div>

      {/* ── Main compose area ──────────────────────────────── */}
      <div className="w-full max-w-[580px] flex flex-col items-center gap-7">
        {/* Heading */}
        <h1
          className="text-[2.75rem] font-serif tracking-tight text-foreground text-center leading-tight"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
        >
          What can I do for you?
        </h1>

        {/* Compose box */}
        <div className="w-full rounded-2xl border bg-card shadow-sm overflow-hidden">
          {/* Pending attachment thumbnails */}
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-3">
              {pendingAttachments.map((a, i) => (
                <div key={i} className="relative">
                  <img
                    src={a.url}
                    alt={a.name}
                    className="h-14 w-14 rounded-lg object-cover border border-border"
                  />
                  <button
                    type="button"
                    aria-label="Remove attachment"
                    className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm hover:scale-110 transition-transform"
                    onClick={() =>
                      setPendingAttachments((p) => p.filter((_, idx) => idx !== i))
                    }
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Assign a task or ask anything"
            rows={2}
            className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none min-h-[64px] max-h-[200px] overflow-y-auto leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            disabled={createSession.isPending}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1">
            {/* Left: attachment + (future: more tools) */}
            <div className="flex items-center gap-1">
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
              <button
                type="button"
                aria-label="Attach file"
                disabled={isUploading || createSession.isPending}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Spinner size={16} />
                ) : (
                  <Plus className="size-5" />
                )}
              </button>
            </div>

            {/* Right: send button */}
            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                canSend
                  ? "bg-foreground text-background hover:bg-foreground/85"
                  : "bg-muted text-muted-foreground cursor-not-allowed",
              )}
              onClick={() => void handleSubmit()}
            >
              {createSession.isPending ? (
                <Spinner size={14} className="text-current" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </button>
          </div>
        </div>

        {/* ── Suggestion chips ───────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTION_CHIPS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              disabled={createSession.isPending}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground",
                "hover:text-foreground hover:bg-muted/50 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:pointer-events-none disabled:opacity-50",
              )}
              onClick={() => void handleChipClick(id)}
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </button>
          ))}

          {/* More → opens all skills sheet */}
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground",
              "hover:text-foreground hover:bg-muted/50 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            onClick={() => setSkillsSheetOpen(true)}
          >
            <LayoutGrid className="size-3.5 shrink-0" />
            More
          </button>
        </div>
      </div>

      {/* ── History panel (popover on desktop) ────────────────── */}
      {historyOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] sm:hidden"
            onClick={() => setHistoryOpen(false)}
          />
          <div
            className={cn(
              "absolute right-4 top-14 z-50 w-[min(calc(100vw-2rem),20rem)]",
              "rounded-2xl border bg-card shadow-xl",
              "animate-in fade-in slide-in-from-top-2 duration-200",
            )}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-semibold">Recent chats</h2>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setHistoryOpen(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>

            <ScrollArea className="max-h-80">
              <div className="p-2">
                {listQuery.isPending ? (
                  <div className="flex justify-center py-6">
                    <Spinner size={20} className="text-muted-foreground" />
                  </div>
                ) : rows.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No chats yet
                  </p>
                ) : (
                  rows.map((s) => (
                    <Link
                      key={s.id}
                      to={`/agency/zeepo-ai-agent/${s.id}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors"
                      onClick={() => setHistoryOpen(false)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-tight">
                          {s.title || "Untitled"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(s.updatedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      )}

      {/* ── All skills sheet ────────────────────────────────── */}
      <Sheet open={skillsSheetOpen} onOpenChange={setSkillsSheetOpen}>
        <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl px-0 pb-0">
          <SheetHeader className="border-b px-6 pb-4 pt-2">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Zap className="size-4 text-muted-foreground" />
              All skills
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(70vh-5rem)]">
            <div className="px-4 py-4 pb-8">
              {skillsQuery.isPending ? (
                <div className="flex justify-center py-8">
                  <Spinner size={24} className="text-muted-foreground" />
                </div>
              ) : skillsByCategory.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No skills available.
                </p>
              ) : (
                skillsByCategory.map(([cat, skills]) => (
                  <div key={cat} className="mb-6">
                    <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {cat}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {skills.map((skill) => (
                        <button
                          key={skill.id}
                          type="button"
                          disabled={createSession.isPending}
                          className={cn(
                            "flex flex-col items-start gap-1 rounded-xl border bg-card/60 px-4 py-3 text-left transition-colors",
                            "hover:bg-muted/50 hover:border-border/80",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            "disabled:pointer-events-none disabled:opacity-50",
                          )}
                          onClick={() => {
                            setSkillsSheetOpen(false);
                            void handleChipClick(skill.id);
                          }}
                        >
                          <span className="text-sm font-medium text-foreground">
                            {skill.title}
                          </span>
                          <span className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                            {skill.description}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
