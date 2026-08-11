"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Clock, History, Paperclip, Search, Send, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import {
  filterZeepoAiImageAttachments,
  ZEEPO_AGENT_MAX_ATTACHMENTS,
} from "@/lib/app-file-upload";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GradientOrb } from "@/components/ui/gradient-orb";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UploadProgressRing } from "@/components/upload-progress-ring";
import { useAppFileUpload } from "@/hooks/use-app-file-upload";
import { startViewTransitionNavigate } from "@/routes/_agency.zeepo-ai-agent/nav-state";
import {
  useZeepoAiRoute,
  zeepoAiCreateSessionInput,
  zeepoAiSessionPath,
} from "@/components/zeepo/zeepo-ai-route-context";
import { stashZeepoAiHandoff } from "@/components/zeepo/zeepo-ai-handoff";
import { ZeepoDeleteChatDialog } from "@/components/zeepo/zeepo-delete-chat-dialog";
import {
  ZEEPO_PROMPT_CATEGORY_META,
  ZEEPO_PROMPT_CATEGORY_ORDER,
  ZEEPO_SAMPLE_PROMPTS,
  type ZeepoPromptCategory,
} from "@/components/zeepo/zeepo-sample-prompts";
import { ZeepoAiTokenWallet, ZeepoAiFreeCreditsNudge } from "@/components/zeepo/zeepo-ai-token-wallet";
import { refreshZeepoAiTokenBalance } from "@/hooks/use-zeepo-ai-token-balance";

type PendingFile = {
  file: File;
  previewUrl: string;
  name: string;
  mimeType: string;
};

function getTimeGreeting(date = new Date()): "Hello" | "Good morning" | "Good afternoon" | "Good evening" {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Hello";
}

function getFirstName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

export function ZeepoAiAssistantInterface() {
  const navigate = useNavigate();
  const route = useZeepoAiRoute();
  const { data: session } = authClient.useSession();
  const firstName = getFirstName(session?.user?.name);
  const greeting = useMemo(() => {
    const salutation = getTimeGreeting();
    return firstName ? `${salutation}, ${firstName}` : salutation;
  }, [firstName]);

  // Customer-only: claim one-time welcome grant when opening Zeepo AI (not agency).
  const claimWelcomeGrant = trpc.zeepoAi.sessions.claimWelcomeGrant.useMutation();
  const utils = trpc.useUtils();
  const welcomeClaimedRef = useRef(false);

  useEffect(() => {
    if (!route.isCustomer || !route.teamId || !session?.user) return;
    if (welcomeClaimedRef.current) return;
    if (sessionStorage.getItem("zeepo-ai-welcome-shown") === "true") return;

    welcomeClaimedRef.current = true;
    void claimWelcomeGrant
      .mutateAsync({ teamId: route.teamId })
      .then((result) => {
        sessionStorage.setItem("zeepo-ai-welcome-shown", "true");
        if (result.granted) {
          refreshZeepoAiTokenBalance(utils, route.teamId);
          toast.success(
            `Welcome to Zeepo AI — ${result.tokensGranted} free tokens are on your team wallet to try it out.`,
            { duration: 7000 },
          );
        } else if (result.reason === "no_qualifying_service") {
          toast.message("Free credits unlock with a service", {
            description:
              "Your balance starts at 0. Add hosting (or any active subscription) and we’ll gift you free Zeepo AI tokens.",
            duration: 9000,
          });
        }
      })
      .catch(() => {
        welcomeClaimedRef.current = false;
      });
    // Intentionally omit mutation object from deps — fire once per mount when team is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.isCustomer, route.teamId, session?.user?.id]);

  const [inputValue, setInputValue] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [activePromptTab, setActivePromptTab] = useState<ZeepoPromptCategory>("design");
  const [selectedPromptCategory, setSelectedPromptCategory] =
    useState<ZeepoPromptCategory | null>(null);
  const [selectedPromptTitle, setSelectedPromptTitle] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title?: string | null } | null>(
    null,
  );

  const listQuery = trpc.zeepoAi.sessions.list.useQuery(
    { page: 1, limit: 50, ...(route.teamId ? { teamId: route.teamId } : {}) },
    { enabled: historyOpen && Boolean(session?.user), staleTime: 30_000 },
  );
  const sessions = listQuery.data?.sessions ?? [];

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadZeepoAiAttachments,
    isUploading,
    progressPercent: uploadProgressPercent,
  } = useAppFileUpload();
  const createSession = trpc.zeepoAi.sessions.create.useMutation();
  const registerAttachment = trpc.zeepoAi.messages.registerAttachment.useMutation();
  const deleteSession = trpc.zeepoAi.sessions.delete.useMutation({
    onSuccess: () => {
      void utils.zeepoAi.sessions.list.invalidate();
      setDeleteTarget(null);
      toast.success("Chat deleted");
    },
    onError: (e) => {
      toast.error(e.message || "Failed to delete chat");
    },
  });

  useEffect(() => {
    return () => {
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
    // Only revoke on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (!files?.length) return;
    const room = ZEEPO_AGENT_MAX_ATTACHMENTS - pendingFiles.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${ZEEPO_AGENT_MAX_ATTACHMENTS} images.`);
      return;
    }
    const { accepted, rejectedMessage } = filterZeepoAiImageAttachments(
      Array.from(files).slice(0, room),
    );
    if (rejectedMessage) toast.error(rejectedMessage);
    if (!accepted.length) return;
    const staged: PendingFile[] = accepted.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      name: f.name,
      mimeType: f.type || "image/jpeg",
    }));
    setPendingFiles((prev) => [...prev, ...staged]);
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const clearPromptCategory = () => {
    setSelectedPromptCategory(null);
    setSelectedPromptTitle(null);
    setInputValue("");
  };

  const selectSamplePrompt = (title: string, category: ZeepoPromptCategory, prompt: string) => {
    setInputValue(prompt);
    setActivePromptTab(category);
    setSelectedPromptCategory(category);
    setSelectedPromptTitle(title);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const [isHandingOff, setIsHandingOff] = useState(false);

  const canSend =
    Boolean(inputValue.trim() || pendingFiles.length > 0) &&
    !isUploading &&
    !isHandingOff;

  const handleSendMessage = async () => {
    if (!canSend) return;
    const staged = [...pendingFiles];
    const message =
      inputValue.trim() || (staged.length ? "See attached." : "");
    if (!message) return;

    try {
      setIsHandingOff(true);
      const created = await createSession.mutateAsync({
        title: "New chat",
        ...zeepoAiCreateSessionInput(route),
      });
      if (!created?.id) throw new Error("Could not create chat");

      let attachmentIds: string[] | undefined;
      let attachments:
        | Array<{ url: string; name: string; mimeType: string }>
        | undefined;
      if (staged.length) {
        const uploaded = await uploadZeepoAiAttachments(staged.map((f) => f.file));
        attachmentIds = [];
        attachments = [];
        for (let i = 0; i < uploaded.length; i++) {
          const up = uploaded[i]!;
          const file = staged[i]?.file;
          const mime = up.contentType || staged[i]?.mimeType || "image/jpeg";
          const registered = await registerAttachment.mutateAsync({
            sessionId: created.id,
            url: up.publicUrl,
            storageKey: up.key,
            name: file?.name ?? staged[i]?.name ?? "attachment",
            mimeType: mime,
            sizeBytes: up.size,
          });
          attachmentIds.push(registered.id);
          attachments.push({
            url: registered.url,
            name: registered.name,
            mimeType: registered.mimeType,
          });
        }
      }

      stashZeepoAiHandoff(created.id, {
        content: message,
        searchEnabled,
        attachmentIds,
        attachments,
        fromCompose: true,
      });

      staged.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setPendingFiles([]);
      setInputValue("");
      setSelectedPromptCategory(null);
      setSelectedPromptTitle(null);
      void utils.zeepoAi.sessions.list.invalidate();
      startViewTransitionNavigate(() => {
        navigate(zeepoAiSessionPath(route.basePath, created.id), {
          state: {
            initialMessage: message,
            searchEnabled,
            attachmentIds,
            attachments,
            fromCompose: true,
          },
        });
      });
    } catch (e) {
      setIsHandingOff(false);
      toast.error(e instanceof Error ? e.message : "Failed to start chat");
    }
  };

  const selectedCategoryMeta = selectedPromptCategory
    ? ZEEPO_PROMPT_CATEGORY_META[selectedPromptCategory]
    : null;
  const SelectedCategoryIcon = selectedCategoryMeta?.icon;

  return (
    <div className="zeepo-ai-root relative flex h-[calc(100svh-theme(spacing.12)-theme(spacing.8))] min-h-0 w-full flex-col overflow-hidden md:h-[calc(100svh-theme(spacing.12)-theme(spacing.12))]">
      {/* Scrollable landing content */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        {/* Top bar: recent chats popover (Agent-parity) */}
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-3 pt-4 sm:px-4 md:px-6">
          <ZeepoAiTokenWallet />
          <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                aria-label="View recent chats"
              >
                <Clock className="size-4" />
                <span className="text-sm">View recent chats</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[min(calc(100vw-2rem),22rem)] p-0"
              align="end"
              side="bottom"
              sideOffset={8}
              collisionPadding={16}
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Recent chats</p>
                </div>
              </div>
              <Command shouldFilter>
                <CommandInput placeholder="Search chats…" className="h-9" />
                <CommandList className="max-h-72">
                  {listQuery.isPending ? (
                    <div className="flex justify-center py-8">
                      <Spinner size={20} className="text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                        {sessions.length === 0 ? "No chats yet" : "No matching chats"}
                      </CommandEmpty>
                      <CommandGroup>
                        {sessions.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={`${s.title ?? "New chat"} ${s.id}`}
                            onSelect={() => {
                              setHistoryOpen(false);
                              startViewTransitionNavigate(() => {
                                navigate(zeepoAiSessionPath(route.basePath, s.id));
                              });
                            }}
                            className="group/item flex cursor-pointer items-center gap-2 px-3 py-2"
                          >
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="truncate text-sm font-medium leading-tight">
                                {s.title || "New chat"}
                              </p>
                            </div>
                            <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground group-hover/item:hidden">
                              {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}
                            </span>
                            <button
                              type="button"
                              aria-label={`Delete ${s.title || "chat"}`}
                              disabled={deleteSession.isPending && deleteTarget?.id === s.id}
                              className="hidden size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover/item:flex disabled:pointer-events-none"
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
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div
          className={cn(
            "zeepo-ai-hero-surface mx-auto flex w-full max-w-2xl flex-col items-center px-1 py-5 sm:px-2 md:px-4 pb-72",
            "transition-all duration-300 ease-out",
            isHandingOff && "pointer-events-none opacity-60",
          )}
        >
          <div className="mb-6 flex w-full flex-col items-center gap-5 pt-2 pb-2 text-center sm:mb-8 sm:pt-4">
            <div className="relative h-40 w-40 sm:h-52 sm:w-52" aria-hidden>
              <GradientOrb />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <h1 className="text-[2rem] font-bold leading-[1.15] tracking-tight text-foreground sm:text-[2.6rem]">
                {greeting}
              </h1>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
                Ask me anything or try one of the suggestions below
              </p>
            </motion.div>
            <ZeepoAiFreeCreditsNudge className="w-full max-w-lg text-left" />
          </div>
        </div>
      </div>

      {/* Floating chat input + Agent sample prompts  always visible */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-1 pb-1 pt-10 sm:px-2 sm:pb-2 md:px-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-t from-[var(--agency-content-bg,#f8fafb)] via-[var(--agency-content-bg,#f8fafb)]/85 to-transparent" />
        <div
          className={cn(
            "zeepo-ai-compose-surface pointer-events-auto relative mx-auto flex w-full max-w-3xl flex-col gap-3",
            "transition-all duration-300 ease-out",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFileSelect(e.target.files);
              e.target.value = "";
            }}
          />

          <div
            className={cn(
              "zeepo-composer-shell zeepo-floating-dock-shadow zeepo-composer-glow overflow-hidden rounded-2xl border border-border/70 bg-card",
              "transition-[border-color,box-shadow,opacity] duration-300",
              isHandingOff && "pointer-events-none opacity-70",
            )}
          >
            {pendingFiles.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-b border-border/60 px-3 py-2">
                {pendingFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative">
                    <img
                      src={file.previewUrl}
                      alt={file.name}
                      className="size-14 rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                      onClick={() => removePendingFile(index)}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {selectedCategoryMeta ? (
              <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2">
                <span
                  className={cn(
                    "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    selectedCategoryMeta.pillClass,
                  )}
                >
                  {SelectedCategoryIcon ? (
                    <SelectedCategoryIcon className="size-3.5 shrink-0" aria-hidden />
                  ) : null}
                  <span className="truncate">{selectedCategoryMeta.label}</span>
                  <button
                    type="button"
                    aria-label="Clear prompt category"
                    className="ml-0.5 rounded-full p-0.5 opacity-70 transition hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearPromptCategory();
                      inputRef.current?.focus();
                    }}
                  >
                    <X className="size-3" />
                  </button>
                </span>
                {selectedPromptTitle ? (
                  <span className="truncate text-[11px] text-muted-foreground">
                    {selectedPromptTitle}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="px-4 pt-3.5 pb-2">
              <input
                ref={inputRef}
                type="text"
                placeholder={isHandingOff ? "Starting chat…" : "Ask me anything..."}
                value={inputValue}
                disabled={isHandingOff}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (!e.target.value.trim()) {
                    setSelectedPromptCategory(null);
                    setSelectedPromptTitle(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                className="w-full bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>

            <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-0.5">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSearchEnabled((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors",
                    searchEnabled
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}
                >
                  <Search className="size-3.5" />
                  <span className="hidden sm:inline">Search</span>
                </button>

                <button
                  type="button"
                  aria-label="Attach images"
                  disabled={isUploading || pendingFiles.length >= ZEEPO_AGENT_MAX_ATTACHMENTS}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors",
                    "text-muted-foreground hover:bg-muted hover:text-foreground",
                    "disabled:pointer-events-none disabled:opacity-40",
                  )}
                >
                  {isUploading ? (
                    <UploadProgressRing percent={uploadProgressPercent} size={14} strokeWidth={2} />
                  ) : (
                    <Paperclip className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {isUploading ? "Uploading…" : "Attach"}
                  </span>
                </button>
              </div>

              <button
                type="button"
                aria-label={isHandingOff ? "Starting chat" : "Send"}
                onClick={() => void handleSendMessage()}
                disabled={!canSend}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full transition-colors",
                  canSend || isHandingOff
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "cursor-not-allowed bg-muted text-muted-foreground",
                )}
              >
                {isHandingOff ? (
                  <Spinner size={18} className="text-current" />
                ) : (
                  <Send className="size-5" />
                )}
              </button>
            </div>
          </div>

          {/* Sample prompts: dropdown menus on mobile, tabs + chips on md+ */}
          <div
            className={cn(
              "w-full",
              isHandingOff && "pointer-events-none opacity-60",
            )}
          >
            {/* Mobile: category tabs open a menu of suggestions */}
            <div className="flex flex-wrap gap-2 md:hidden">
              {ZEEPO_PROMPT_CATEGORY_ORDER.map((category) => {
                const meta = ZEEPO_PROMPT_CATEGORY_META[category];
                const TabIcon = meta.icon;
                const isActive = activePromptTab === category;
                const items = ZEEPO_SAMPLE_PROMPTS.filter((p) => p.category === category);
                return (
                  <DropdownMenu key={category}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        disabled={createSession.isPending || isHandingOff}
                        onClick={() => setActivePromptTab(category)}
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "disabled:pointer-events-none disabled:opacity-50",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-background text-foreground hover:bg-muted/50",
                        )}
                      >
                        <TabIcon className="size-3.5 shrink-0" aria-hidden />
                        {meta.label}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="top"
                      className="max-h-72 w-[min(calc(100vw-2rem),18rem)] overflow-y-auto"
                    >
                      {items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem
                            key={item.title}
                            className="gap-2"
                            onSelect={() =>
                              selectSamplePrompt(item.title, item.category, item.prompt)
                            }
                          >
                            <Icon className="size-3.5 shrink-0 opacity-70" aria-hidden />
                            <span className="truncate">{item.title}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>

            {/* Desktop: category tabs + suggestion chips */}
            <div className="hidden space-y-3 md:block">
              <ScrollArea className="w-full">
                <div className="flex w-max flex-nowrap gap-2 pb-1 pr-2">
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

              <div className="flex flex-wrap gap-2">
                {ZEEPO_SAMPLE_PROMPTS.filter((p) => p.category === activePromptTab).map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedPromptTitle === item.title;
                  const meta = ZEEPO_PROMPT_CATEGORY_META[item.category];
                  return (
                    <button
                      key={item.title}
                      type="button"
                      disabled={createSession.isPending || isHandingOff}
                      onClick={() => selectSamplePrompt(item.title, item.category, item.prompt)}
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
