"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { Link, Navigate, useNavigate } from "react-router";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ArrowUpRight, Plus, ChevronRight, X, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  uploadErrorMessage,
  uploadThingFileUrl,
  uploadZeepoAgentFiles,
} from "@/hooks/use-uploadthing";
import { RotatingText } from "@/components/rotating-text";
import { ZeepoMascot } from "@/components/zeepo/zeepo-mascot";
import {
  ZEEPO_PROMPT_CATEGORY_META,
  ZEEPO_PROMPT_CATEGORY_ORDER,
  ZEEPO_SAMPLE_PROMPTS,
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

type Attachment = { url: string; name: string; mimeType: string };


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
  const [isUploading, setIsUploading] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [isHandingOff, setIsHandingOff] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const listQuery = trpc.zeepoAgent.sessions.list.useQuery(
    zeepoAgentSessionsInput({ basePath, teamId, teamSlug: null, isCustomer: Boolean(teamId) }, { page: 1, limit: 30 }),
    { enabled: Boolean(session?.user), retry: 1 },
  );

  const createSession = trpc.zeepoAgent.sessions.create.useMutation();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const deleteSession = trpc.zeepoAgent.sessions.delete.useMutation({
    onSuccess: () => {
      void utils.zeepoAgent.sessions.list.invalidate();
    },
    onSettled: () => {
      setDeletingId(null);
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
      setIsUploading(true);
      try {
        const results = await uploadZeepoAgentFiles({ files: staged.map((f) => f.file) });
        const uploaded: Attachment[] = results.map((r, i) => ({
          url: uploadThingFileUrl(r),
          name: staged[i]?.name ?? r.name ?? "attachment",
          mimeType: staged[i]?.mimeType ?? "image/*",
        }));
        await finishHandoff([...presetAttachments, ...uploaded]);
      } catch (e) {
        toast.error(uploadErrorMessage(e));
      } finally {
        setIsUploading(false);
      }
      return;
    }

    await finishHandoff(presetAttachments);
  };

  /** Stage locally â€” upload runs on Send (same as session chat). */
  const handleFileSelect = (files: FileList | null) => {
    if (!files?.length) return;
    const room = 4 - pendingFiles.length;
    if (room <= 0) return;
    const incoming = Array.from(files).slice(0, room);
    const staged: PendingFile[] = incoming.map((f) => ({
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
          <div className="mb-4 flex items-center justify-between gap-3">
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
                  <span className="hidden sm:inline text-sm">Recent chats</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(calc(100vw-2rem),20rem)] p-0"
                align="end"
                side="bottom"
                sideOffset={8}
                collisionPadding={16}
              >
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h2 className="text-sm font-semibold">Recent chats</h2>
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
                <div className="max-h-72 overflow-y-auto p-2">
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
                          disabled={deletingId === s.id}
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
                            setDeletingId(s.id);
                            deleteSession.mutate({ id: s.id });
                          }}
                        >
                          {deletingId === s.id ? (
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

          <div
            className={cn(
              "flex w-full flex-col items-center gap-8 transition-all duration-300 ease-out",
              isHandingOff && "pointer-events-none opacity-0 -translate-y-3 scale-[0.99]",
            )}
          >
        {/* Heading */}
        <div className="zeepo-hero-surface flex w-full flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            <ZeepoMascot />
            <h1
              className="text-[2rem] sm:text-[2.75rem] font-serif tracking-tight text-foreground text-center leading-tight"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              What can I do for you?
            </h1>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            I can{" "}
            <RotatingText
              texts={[
                "write strategies, plans, and proposals",
                "check domain availability and buy instantly",
                "generate images, video, and audio",
                "research anything with live web search",
                "build brand assets and creative copy",
                "run marketing campaigns end to end",
                "handle operational planning and briefs",
              ]}
              className="font-medium text-foreground"
            />
          </p>
        </div>

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

        <div className="zeepo-compose-surface w-full">
          <ZeepoFloatingDock
            composer={
              <ZeepoComposer
                value={draft}
                onChange={setDraft}
                onSubmit={() => void handleSubmit()}
                placeholder="Assign a task or ask anything"
                disabled={createSession.isPending}
                isSending={createSession.isPending || isUploading}
                canSend={canSend}
                onAttach={() => fileInputRef.current?.click()}
                attachDisabled={createSession.isPending || pendingFiles.length >= 4}
                isUploading={isUploading}
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

        {/* Sample prompts — category pill tabs (like domain TLD categories) */}
        <div className="zeepo-hero-surface w-full space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Sample prompts</p>
          <ScrollArea className="w-full">
            <div className="flex gap-2 flex-nowrap w-max pb-1 pr-2">
              {ZEEPO_PROMPT_CATEGORY_ORDER.map((category) => {
                const isActive = activePromptTab === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActivePromptTab(category)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-foreground hover:bg-muted/50",
                    )}
                  >
                    {ZEEPO_PROMPT_CATEGORY_META[category].label}
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ZEEPO_SAMPLE_PROMPTS.filter((p) => p.category === activePromptTab).map((item) => {
              const Icon = item.icon;
              const isSelected = selectedPromptTitle === item.title;
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
                    "group relative flex flex-col items-start gap-2.5 rounded-2xl border bg-card p-3.5 text-left shadow-sm",
                    "transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:pointer-events-none disabled:opacity-50",
                    isSelected
                      ? "border-primary ring-1 ring-primary/25"
                      : "border-border hover:border-border/80",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg",
                      item.bg,
                    )}
                  >
                    <Icon className={cn("size-4", item.color)} strokeWidth={1.75} />
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-snug pr-4">
                    {item.title}
                  </p>
                  <p className="line-clamp-2 text-[10px] text-muted-foreground leading-relaxed pr-2">
                    {item.prompt.slice(0, 88).trimEnd()}…
                  </p>
                  <ArrowUpRight className="absolute bottom-3 right-3 size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
