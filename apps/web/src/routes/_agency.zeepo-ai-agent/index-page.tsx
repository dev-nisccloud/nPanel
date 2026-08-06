"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { Link, Navigate, useNavigate } from "react-router";
import { trpc } from "@/utils/trpc";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ChevronRight, Clock, History, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAppFileUpload } from "@/hooks/use-app-file-upload";
import {
  filterZeepoAgentAttachmentFiles,
  mapStorageResultToAttachment,
  uploadErrorMessage,
} from "@/lib/app-file-upload";
import { ZeepoMascot } from "@/components/zeepo/zeepo-mascot";
import { ZeepoDeleteChatDialog } from "@/components/zeepo/zeepo-delete-chat-dialog";
import {
  ZEEPO_SAMPLE_PROMPTS,
  ZEEPO_PROMPT_CATEGORY_META,
  ZEEPO_PROMPT_CATEGORY_ORDER,
  type ZeepoPromptCategory,
} from "@/components/zeepo/zeepo-sample-prompts";
import {
  ZeepoFloatingDock,
  ZeepoComposer,
  ZEEPO_AGENCY_LANDING_CONTENT,
  ZEEPO_AGENCY_LANDING_PAGE,
  ZEEPO_AGENCY_LANDING_SCROLL,
} from "@/components/zeepo/zeepo-chat-ui";
import {
  buildComposeHandoffState,
  startViewTransitionNavigate,
} from "./nav-state";
import {
  useZeepoAgentRoute,
  zeepoAgentCreateSessionInput,
  zeepoAgentSessionPath,
  zeepoAgentSessionsInput,
} from "@/components/zeepo/zeepo-agent-route-context";
import { useZeepoTokenBilling } from "@/components/zeepo/zeepo-token-billing-provider";
import { ZeepoTokenWallet } from "@/components/zeepo/zeepo-token-wallet";
import { captureEvent } from "@/lib/posthog";

type Attachment = { url: string; name: string; mimeType: string; storageKey?: string };

const TYPEWRITER_PHRASES = [
  "write strategies, plans, and proposals",
  "check domain availability and buy instantly",
  "generate images, video, and audio",
  "research anything with live web search",
  "build brand assets and creative copy",
  "run marketing campaigns end to end",
  "handle operational planning and briefs",
];

function useTypewriter(phrases: string[], typingMs = 42, erasingMs = 22, pauseMs = 2200) {
  const [displayed, setDisplayed] = React.useState("");
  const [phraseIdx, setPhraseIdx] = React.useState(0);
  const [charIdx, setCharIdx] = React.useState(0);
  const [erasing, setErasing] = React.useState(false);

  React.useEffect(() => {
    const phrase = phrases[phraseIdx] ?? "";
    if (!erasing) {
      if (charIdx < phrase.length) {
        const t = setTimeout(() => setCharIdx((c) => c + 1), typingMs);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setErasing(true), pauseMs);
        return () => clearTimeout(t);
      }
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => setCharIdx((c) => c - 1), erasingMs);
        return () => clearTimeout(t);
      } else {
        setErasing(false);
        setPhraseIdx((i) => (i + 1) % phrases.length);
      }
    }
  }, [charIdx, erasing, phraseIdx, phrases, typingMs, erasingMs, pauseMs]);

  React.useEffect(() => {
    const phrase = phrases[phraseIdx] ?? "";
    setDisplayed(phrase.slice(0, charIdx));
  }, [charIdx, phraseIdx, phrases]);

  return displayed;
}

function TypewriterLine() {
  const text = useTypewriter(TYPEWRITER_PHRASES);
  return (
    <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto leading-relaxed min-h-[1.5em]">
      I can{" "}
      <span className="font-medium text-foreground">
        {text}
        <span className="inline-block w-[2px] h-[1em] bg-foreground align-middle ml-[1px] animate-[zeepo-cursor-blink_0.8s_step-end_infinite]" aria-hidden />
      </span>
    </p>
  );
}

export default function ZeepoAiAgentIndexPage() {
  const { data: session, isPending: authPending } = authClient.useSession();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { basePath, teamId, isCustomer } = useZeepoAgentRoute();
  const { handleBillingError } = useZeepoTokenBilling();

  const [draft, setDraft] = React.useState("");
  const [activePromptTab, setActivePromptTab] = React.useState<ZeepoPromptCategory>("design");
  const [selectedPromptCategory, setSelectedPromptCategory] =
    React.useState<ZeepoPromptCategory | null>(null);
  const [selectedPromptTitle, setSelectedPromptTitle] = React.useState<string | null>(null);
  type PendingFile = { file: File; previewUrl: string; name: string; mimeType: string };
  const [pendingFiles, setPendingFiles] = React.useState<PendingFile[]>([]);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [isHandingOff, setIsHandingOff] = React.useState(false);
  const {
    uploadAgentAttachments,
    isUploading,
    progressPercent: uploadProgressPercent,
  } = useAppFileUpload();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const listQuery = trpc.zeepoAgent.sessions.list.useQuery(
    zeepoAgentSessionsInput({ basePath, teamId, teamSlug: null, isCustomer: Boolean(teamId) }, { page: 1, limit: 30 }),
    { enabled: Boolean(session?.user), retry: 1 },
  );

  const createSession = trpc.zeepoAgent.sessions.create.useMutation();
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title?: string | null } | null>(null);
  const deleteSession = trpc.zeepoAgent.sessions.delete.useMutation({
    onSuccess: () => {
      void utils.zeepoAgent.sessions.list.invalidate();
      setDeleteTarget(null);
      toast.success("Chat deleted");
    },
    onError: (e) => {
      toast.error(e.message || "Failed to delete chat");
    },
  });

  // Auto-resize textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

  React.useEffect(() => {
    if (!draft.trim()) {
      setSelectedPromptCategory(null);
      setSelectedPromptTitle(null);
    }
  }, [draft]);

  const handleSubmit = async (opts?: {
    message?: string;
    skillId?: string;
    attachments?: Attachment[];
  }) => {
    const message = opts?.message ?? draft.trim();
    const staged = [...pendingFiles];
    const presetAttachments = opts?.attachments ?? [];
    if (!message && staged.length === 0 && presetAttachments.length === 0) return;

    const finishHandoff = async (attachments: Attachment[]) => {
      const content = message || (attachments.length ? "See attached." : "");
      try {
        const res = await createSession.mutateAsync(zeepoAgentCreateSessionInput({ basePath, teamId, teamSlug: null, isCustomer: Boolean(teamId) }));
        captureEvent("zeepo_agent_session_created");
        void utils.zeepoAgent.sessions.list.invalidate();
        const id = res.data?.id;
        const created = res.data;
        if (id && created) {
          utils.zeepoAgent.sessions.get.setData(
            { id },
            { data: { ...created, messages: [] } },
          );
          setIsHandingOff(true);
          setDraft("");
          staged.forEach((f) => URL.revokeObjectURL(f.previewUrl));
          setPendingFiles([]);
          const handoffState = buildComposeHandoffState({
            message: content,
            skillId: opts?.skillId,
            attachments: attachments.length ? attachments : undefined,
          });
          startViewTransitionNavigate(() => {
            navigate(zeepoAgentSessionPath(basePath, id), { state: handoffState });
          });
        }
      } catch (e: unknown) {
        setIsHandingOff(false);
        if (!handleBillingError(e)) {
          toast.error(e instanceof Error ? e.message : "Failed to create chat");
        }
      }
    };

    if (staged.length) {
      try {
        const results = await uploadAgentAttachments(staged.map((f) => f.file));
        const uploaded: Attachment[] = results.map((r, i) => {
          const mapped = mapStorageResultToAttachment(r, staged[i]!.file);
          return {
            url: mapped.url,
            name: mapped.name,
            mimeType: mapped.mimeType,
            ...(mapped.storageKey ? { storageKey: mapped.storageKey } : {}),
          };
        });
        await finishHandoff([...presetAttachments, ...uploaded]);
      } catch (e) {
        toast.error(uploadErrorMessage(e));
      }
      return;
    }

    await finishHandoff(presetAttachments);
  };

  /** Stage locally  upload runs on Send. */
  const handleFileSelect = (files: FileList | null) => {
    if (!files?.length) return;
    const room = 4 - pendingFiles.length;
    if (room <= 0) return;
    const { accepted, rejectedMessage } = filterZeepoAgentAttachmentFiles(
      Array.from(files).slice(0, room),
    );
    if (rejectedMessage) toast.error(rejectedMessage);
    if (!accepted.length) return;
    const staged: PendingFile[] = accepted.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      name: f.name,
      mimeType: f.type || "image/*",
    }));
    setPendingFiles((prev) => [...prev, ...staged]);
  };

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
    (draft.trim().length > 0 || pendingFiles.length > 0) &&
    !createSession.isPending &&
    !isUploading;

  return (
    <div className={ZEEPO_AGENCY_LANDING_PAGE}>
      <div className={ZEEPO_AGENCY_LANDING_SCROLL}>
        <div className={ZEEPO_AGENCY_LANDING_CONTENT}>

          {/* Top bar: wallet + history */}
          <div className="mb-6 flex items-center justify-between gap-3">
            {isCustomer ? <ZeepoTokenWallet /> : <span />}
            <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  aria-label="Recent chats"
                >
                  <Clock className="size-4" />
                  <span className="hidden sm:inline text-sm">History</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(calc(100vw-2rem),22rem)] p-0"
                align="end"
                side="bottom"
                sideOffset={8}
                collisionPadding={16}
              >
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">Recent chats</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label="Close"
                    onClick={() => setHistoryOpen(false)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {listQuery.isPending ? (
                    <div className="flex justify-center py-8">
                      <Spinner size={20} className="text-muted-foreground" />
                    </div>
                  ) : rows.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <History className="size-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No chats yet</p>
                      <p className="text-xs text-muted-foreground/60">Start a conversation below</p>
                    </div>
                  ) : (
                    rows.map((s) => (
                      <div
                        key={s.id}
                        className="group relative flex items-center rounded-xl transition-colors hover:bg-muted/50"
                      >
                        <Link
                          to={zeepoAgentSessionPath(basePath, s.id)}
                          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5"
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
                          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                        <button
                          type="button"
                          aria-label="Delete chat"
                          disabled={deleteSession.isPending && deleteTarget?.id === s.id}
                          className={cn(
                            "absolute right-2 flex size-6 items-center justify-center rounded-md text-muted-foreground",
                            "opacity-0 transition-opacity group-hover:opacity-100",
                            "hover:bg-destructive/10 hover:text-destructive",
                            "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            "disabled:pointer-events-none",
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteTarget({ id: s.id, title: s.title });
                          }}
                        >
                          {deleteSession.isPending && deleteTarget?.id === s.id ? (
                            <Spinner size={12} className="text-current" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Main content  fades out on handoff */}
          <div
            className={cn(
              "zeepo-landing-main flex w-full flex-col items-center gap-8 transition-all duration-300 ease-out",
              isHandingOff && "pointer-events-none opacity-0 -translate-y-4 scale-[0.98]",
            )}
          >

            {/* Hero */}
            <div className="zeepo-hero-surface flex w-full flex-col items-center gap-4 pt-6 pb-2 text-center">
              <ZeepoMascot className="h-16 w-16 sm:h-20 sm:w-20" />
              <div className="space-y-2">
                <h1 className="text-[2rem] sm:text-[2.6rem] font-bold tracking-tight text-foreground leading-[1.15]">
                  How can I help you?
                </h1>
                <TypewriterLine />
              </div>
            </div>

            {/* Hidden file input */}
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

            {/* Composer */}
            <div className="zeepo-compose-surface w-full">
              <ZeepoFloatingDock
                isLanding
                composer={
                  <ZeepoComposer
                    value={draft}
                    onChange={setDraft}
                    onSubmit={() => void handleSubmit()}
                    placeholder="Assign a task or ask anything…"
                    disabled={createSession.isPending}
                    isSending={createSession.isPending || isUploading}
                    canSend={canSend}
                    onAttach={() => fileInputRef.current?.click()}
                    attachDisabled={createSession.isPending || pendingFiles.length >= 4}
                    isUploading={isUploading}
                    uploadProgressPercent={uploadProgressPercent}
                    pendingPreviews={pendingFiles.map((f, i) => ({
                      previewUrl: f.previewUrl,
                      name: f.name,
                      onRemove: () => {
                        URL.revokeObjectURL(f.previewUrl);
                        setPendingFiles((p) => p.filter((_, idx) => idx !== i));
                      },
                    }))}
                    promptCategory={
                      selectedPromptCategory
                        ? {
                            label: ZEEPO_PROMPT_CATEGORY_META[selectedPromptCategory].label,
                            className: ZEEPO_PROMPT_CATEGORY_META[selectedPromptCategory].pillClass,
                            icon: ZEEPO_PROMPT_CATEGORY_META[selectedPromptCategory].icon,
                          }
                        : null
                    }
                    onClearPromptCategory={() => {
                      setSelectedPromptCategory(null);
                      setSelectedPromptTitle(null);
                      setDraft("");
                    }}
                    textareaRef={textareaRef}
                  />
                }
              />
            </div>

            {/* Sample prompts  category tabs + chips */}
            <div className="zeepo-hero-surface w-full space-y-3 mt-2">
              {/* Category tab pills */}
              <ScrollArea className="w-full">
                <div className="flex gap-2 flex-nowrap w-max pb-1 pr-2">
                  {ZEEPO_PROMPT_CATEGORY_ORDER.map((category) => {
                    const isActive = activePromptTab === category;
                    const meta = ZEEPO_PROMPT_CATEGORY_META[category];
                    const TabIcon = meta.icon;
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActivePromptTab(category)}
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-background text-foreground hover:bg-muted/50",
                        )}
                      >
                        <TabIcon className="size-3.5 shrink-0" aria-hidden />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              {/* Prompt chips for active category */}
              <div className="flex flex-wrap gap-2">
                {ZEEPO_SAMPLE_PROMPTS.filter((p) => p.category === activePromptTab).map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedPromptTitle === item.title;
                  const meta = ZEEPO_PROMPT_CATEGORY_META[item.category];
                  return (
                    <button
                      key={item.title}
                      type="button"
                      disabled={createSession.isPending}
                      onClick={() => {
                        setDraft(item.prompt);
                        setActivePromptTab(item.category);
                        setSelectedPromptCategory(item.category);
                        setSelectedPromptTitle(item.title);
                        setTimeout(() => textareaRef.current?.focus(), 50);
                      }}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium",
                        "border transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:pointer-events-none disabled:opacity-50",
                        "hover:-translate-y-px hover:shadow-sm",
                        isSelected
                          ? cn("border-transparent shadow-sm", meta.pillClass)
                          : "border-border bg-card text-foreground hover:bg-muted/60",
                      )}
                    >
                      <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                      {item.title}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>

      <ZeepoDeleteChatDialog
        target={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteSession.isPending) setDeleteTarget(null);
        }}
        isPending={deleteSession.isPending}
        onConfirm={async (id) => {
          await deleteSession.mutateAsync({ id });
        }}
      />
    </div>
  );
}
