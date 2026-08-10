"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { FileText, Paperclip, Search, Send, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import {
  filterZeepoAgentAttachmentFiles,
  ZEEPO_AGENT_MAX_ATTACHMENTS,
} from "@/lib/app-file-upload";
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
import {
  ZEEPO_PROMPT_CATEGORY_META,
  ZEEPO_PROMPT_CATEGORY_ORDER,
  ZEEPO_SAMPLE_PROMPTS,
  type ZeepoPromptCategory,
} from "@/components/zeepo/zeepo-sample-prompts";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

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

  const listQuery = trpc.zeepoAi.sessions.list.useQuery(
    { page: 1, limit: 10, ...route.params },
    { refetchOnWindowFocus: true },
  );
  const sessions = listQuery.data?.sessions ?? [];

  const [inputValue, setInputValue] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [activePromptTab, setActivePromptTab] = useState<ZeepoPromptCategory>("design");
  const [selectedPromptCategory, setSelectedPromptCategory] =
    useState<ZeepoPromptCategory | null>(null);
  const [selectedPromptTitle, setSelectedPromptTitle] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    uploadZeepoAiAttachments,
    isUploading,
    progressPercent: uploadProgressPercent,
  } = useAppFileUpload();
  const createSession = trpc.zeepoAi.sessions.create.useMutation();
  const registerAttachment = trpc.zeepoAi.messages.registerAttachment.useMutation();
  const utils = trpc.useUtils();

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
      toast.error(`You can attach up to ${ZEEPO_AGENT_MAX_ATTACHMENTS} files.`);
      return;
    }
    const { accepted, rejectedMessage } = filterZeepoAgentAttachmentFiles(
      Array.from(files).slice(0, room),
    );
    if (rejectedMessage) toast.error(rejectedMessage);
    if (!accepted.length) return;
    const staged: PendingFile[] = accepted.map((f) => ({
      file: f,
      previewUrl: URL.createObjectURL(f),
      name: f.name,
      mimeType: f.type || "application/octet-stream",
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
    const message = inputValue.trim();
    const staged = [...pendingFiles];

    try {
      setIsHandingOff(true);
      const created = await createSession.mutateAsync({
        title: "New chat",
        ...zeepoAiCreateSessionInput(route),
      });
      if (!created?.id) throw new Error("Could not create chat");

      let attachmentIds: string[] | undefined;
      if (staged.length) {
        const uploaded = await uploadZeepoAiAttachments(staged.map((f) => f.file));
        attachmentIds = [];
        for (let i = 0; i < uploaded.length; i++) {
          const up = uploaded[i]!;
          const file = staged[i]?.file;
          const registered = await registerAttachment.mutateAsync({
            sessionId: created.id,
            url: up.publicUrl,
            storageKey: up.key,
            name: file?.name ?? staged[i]?.name ?? "attachment",
            mimeType: up.contentType || staged[i]?.mimeType || "application/octet-stream",
            sizeBytes: up.size,
          });
          attachmentIds.push(registered.id);
        }
      }

      stashZeepoAiHandoff(created.id, {
        content: message,
        searchEnabled,
        attachmentIds,
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
        {/* Recent chats section */}
        {sessions.length > 0 && (
          <div className="mx-auto w-full max-w-2xl px-3 pt-4 sm:px-4 md:px-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Recent Chats</h2>
              <button
                type="button"
                onClick={() => navigate(zeepoAiSessionPath(route.basePath, "library"))}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {sessions.slice(0, 6).map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => {
                    startViewTransitionNavigate(() => {
                      navigate(zeepoAiSessionPath(route.basePath, chat.id));
                    });
                  }}
                  className={cn(
                    "group flex w-full flex-col gap-1 rounded-xl border border-border/70 bg-card p-3 text-left",
                    "transition-all duration-200 hover:border-primary/35 hover:bg-primary/[0.03] hover:shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <span className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {chat.title ?? "New chat"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(chat.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        

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
          </div>
        </div>
      </div>

      {/* Floating chat input + Agent sample prompts — always visible */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-1 pb-1 pt-10 sm:px-2 sm:pb-2 md:px-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-t from-[var(--agency-content-bg,#f8fafb)] via-[var(--agency-content-bg,#f8fafb)]/85 to-transparent" />
        <div
          className={cn(
            "zeepo-ai-compose-surface pointer-events-auto relative mx-auto flex w-full max-w-3xl flex-col gap-3",
            "transition-all duration-300 ease-out",
          )}
        >
          {isHandingOff ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
              <Spinner size={16} className="text-primary" />
              <span>Starting chat…</span>
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv"
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
                {pendingFiles.map((file, index) => {
                  const isImage = file.mimeType.startsWith("image/");
                  return (
                    <div key={`${file.name}-${index}`} className="relative">
                      {isImage ? (
                        <img
                          src={file.previewUrl}
                          alt={file.name}
                          className="size-14 rounded-lg border border-border object-cover"
                        />
                      ) : (
                        <div className="flex size-14 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted/60 px-1">
                          <FileText className="size-4 text-primary" />
                          <span className="w-full truncate text-center text-[9px] text-muted-foreground">
                            {file.name}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                        onClick={() => removePendingFile(index)}
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  );
                })}
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
                  aria-label="Attach files"
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

          {/* Same Agent sample prompts: category tabs + chips */}
          <div
            className={cn(
              "w-full space-y-3",
              isHandingOff && "pointer-events-none opacity-60",
            )}
          >
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
  );
}
