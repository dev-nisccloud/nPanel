"use client";

import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { Link, Navigate, useParams } from "react-router";
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
  SendIcon,
  AlertCircle,
  RefreshCw,
  Plus,
  Zap,
  X,
  Download,
  Headphones,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

export default function ZeepoAiAgentSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: authSession, isPending: authPending } = authClient.useSession();
  const [draft, setDraft] = React.useState("");
  const [skillsOpen, setSkillsOpen] = React.useState(false);
  const [selectedSkill, setSelectedSkill] = React.useState<ZeepoAgentSkillRow | null>(null);
  const [mediaPreview, setMediaPreview] = React.useState<{
    url: string;
    kind: GenerationMediaKind;
    generationId: string;
  } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

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
    },
  });

  const messagesForThinking = sessionQuery.data?.data?.messages ?? [];
  const hasOptimisticUserBubble = messagesForThinking.some(
    (m: { id?: string }) => typeof m.id === "string" && m.id.startsWith("optimistic-user-"),
  );
  const showAssistantThinking =
    send.isPending || (sessionQuery.isFetching && hasOptimisticUserBubble);

  const sendCurrentDraft = React.useCallback(() => {
    const t = draft.trim();
    if (!t || showAssistantThinking || !sessionId) return;
    setDraft("");
    // Let React commit the cleared controlled textarea before the mutation disables it / runs onMutate,
    // otherwise the field can briefly keep showing the sent prompt.
    queueMicrotask(() => {
      send.mutate({
        sessionId,
        content: t,
        ...(selectedSkill ? { skillId: selectedSkill.id } : {}),
      });
    });
  }, [draft, send, sessionId, selectedSkill, showAssistantThinking]);

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [sessionQuery.data?.data?.messages?.length, showAssistantThinking]);

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
      <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.8))] max-w-3xl mx-auto w-full flex-col px-4 py-4 md:px-6">
        <div className="mb-3 flex items-center gap-3 border-b pb-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/agency/zeepo-ai-agent" aria-label="Back">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-48 max-w-[70%]" />
            <Skeleton className="h-3 w-32" />
          </div>
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
  const messages = sessionRes.messages ?? [];
  const generations = genQuery.data?.data ?? [];
  const genLoading = genQuery.isPending || genQuery.isLoading;
  const genError = genQuery.isError;
  const genErrorMessage = genQuery.error?.message ?? "Could not load generations.";

  return (
    <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.8))] max-w-3xl mx-auto w-full flex-col px-4 py-4 md:px-6">
      <div className="mb-3 flex items-center gap-3 border-b pb-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/agency/zeepo-ai-agent" aria-label="Back">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold">{sessionRes.title || "Chat"}</h1>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 rounded-xl border bg-muted/15 p-3 md:p-4">
        <div className="flex flex-col gap-4 pr-2">
          {messages.length === 0 && !showAssistantThinking ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Say hello to start the conversation.
            </p>
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
              return (
                <div key={m.id} className="flex justify-end gap-2">
                  <div className="flex max-w-[min(85%,28rem)] flex-col items-end gap-1">
                    <div
                      className={cn(
                        "w-full rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm",
                        "bg-primary text-primary-foreground",
                      )}
                    >
                      <AiMarkdownRenderer
                        content={m.content || ""}
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
                      <AiMarkdownRenderer content={m.content || ""} />
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
                  {send.isPending ? "Zeepo is thinking…" : "Updating reply…"}
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
                <AlertDescription className="flex flex-wrap items-center gap-2 text-xs">
                  <span>{genErrorMessage}</span>
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
                          className="flex h-[7rem] w-[7rem] shrink-0 flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-2 text-center"
                          title={g.errorMessage ?? "Failed"}
                        >
                          <AlertCircle className="mb-1 size-5 shrink-0 text-destructive" aria-hidden />
                          <span className="line-clamp-5 text-[10px] leading-tight text-destructive">
                            {g.errorMessage || "Failed"}
                          </span>
                        </div>
                      );
                    }

                    if (completed) {
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
                              setMediaPreview({
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

      <Dialog
        open={Boolean(mediaPreview)}
        onOpenChange={(open) => {
          if (!open) setMediaPreview(null);
        }}
      >
        <DialogContent
          className="max-h-[92vh] max-w-[min(96vw,56rem)] gap-4 overflow-y-auto p-4 sm:p-6"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle className="sr-only">View generation</DialogTitle>
          </DialogHeader>
          {mediaPreview ? (
            <div className="flex min-h-0 flex-col items-center justify-center gap-4">
              {mediaPreview.kind === "image" ? (
                <img
                  src={mediaPreview.url}
                  alt=""
                  className="max-h-[min(78vh,800px)] w-auto max-w-full rounded-lg object-contain"
                />
              ) : null}
              {mediaPreview.kind === "video" ? (
                <video
                  src={mediaPreview.url}
                  controls
                  playsInline
                  className="max-h-[min(78vh,800px)] w-full max-w-full rounded-lg bg-black"
                />
              ) : null}
              {mediaPreview.kind === "audio" ? (
                <audio src={mediaPreview.url} controls className="w-full max-w-md" />
              ) : null}
              <DialogFooter className="w-full flex-row justify-center gap-2 sm:justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const ext = fileExtensionForDownload(mediaPreview.kind, mediaPreview.url);
                    void downloadMediaFile(
                      mediaPreview.url,
                      `zeepo-generation-${mediaPreview.generationId.slice(0, 8)}.${ext}`,
                    );
                  }}
                >
                  <Download className="size-4" />
                  Download
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          sendCurrentDraft();
        }}
      >
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

          <Textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              selectedSkill
                ? `Add details for “${selectedSkill.title}”…`
                : "Describe what you want…"
            }
            className="min-h-[44px] flex-1 resize-none"
            rows={2}
            disabled={showAssistantThinking}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendCurrentDraft();
              }
            }}
          />
          <Button type="submit" size="icon" className="h-[44px] w-[44px] shrink-0" disabled={showAssistantThinking}>
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
  );
}
