"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSidebar } from "@/components/ui/sidebar";
import { ZeepoAiComposer } from "@/components/zeepo/zeepo-ai-composer";
import { ZeepoAiMessageList } from "@/components/zeepo/zeepo-ai-conversation";
import { ZeepoAiClarifyingQuestions } from "@/components/zeepo/zeepo-ai-questions";
import { ZeepoAiDetailPane } from "@/components/zeepo/zeepo-ai-detail-pane";
import { ZeepoDeleteChatDialog } from "@/components/zeepo/zeepo-delete-chat-dialog";
import { ZeepoRenameChatDialog } from "@/components/zeepo/zeepo-rename-chat-dialog";
import {
  useZeepoAiRoute,
} from "@/components/zeepo/zeepo-ai-route-context";
import { streamZeepoAiChat } from "@/components/zeepo/zeepo-ai-stream-client";
import {
  mapApiGeneration,
  mapApiMessage,
  mapApiToolInvocations,
  titleFromMessage,
  type ZeepoAiActivePanel,
  type ZeepoAiChatSession,
  type ZeepoAiGeneration,
  type ZeepoAiMessage,
} from "@/components/zeepo/zeepo-ai-types";
import {
  clearZeepoAiHandoff,
  readZeepoAiHandoff,
  type ZeepoAiHandoffPayload,
} from "@/components/zeepo/zeepo-ai-handoff";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";
import { startViewTransitionNavigate } from "@/routes/_agency.zeepo-ai-agent/nav-state";

type LocationState = {
  initialMessage?: string;
  searchEnabled?: boolean;
  skillId?: string;
  attachmentIds?: string[];
  fromCompose?: boolean;
};

function resolveHandoff(
  sessionId: string,
  locationState: LocationState,
): ZeepoAiHandoffPayload | null {
  const stored = readZeepoAiHandoff(sessionId);
  if (stored?.content) return stored;
  const content = locationState.initialMessage?.trim();
  if (!content) return null;
  return {
    content,
    searchEnabled: locationState.searchEnabled,
    skillId: locationState.skillId,
    attachmentIds: locationState.attachmentIds,
    fromCompose: locationState.fromCompose ?? true,
  };
}

function messagesFromSessionData(fresh: {
  messages: Array<{
    id: string;
    role: string;
    content?: string | null;
    reasoning?: string | null;
    status?: string | null;
    metadata?: unknown;
    createdAt: string | Date;
  }>;
  toolInvocations?: Array<{
    id: string;
    messageId?: string | null;
    toolName: string;
    status?: string | null;
    result?: unknown;
  }>;
}): ZeepoAiMessage[] {
  const byMessage = mapApiToolInvocations(fresh.toolInvocations ?? []);
  const mapped = fresh.messages
    .map((m) => mapApiMessage(m, byMessage.get(m.id)))
    .filter((m): m is ZeepoAiMessage => Boolean(m));

  // Defend against same-ms user/assistant rows (older turns) swapping order on refetch.
  mapped.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (ta !== tb) return ta - tb;
    if (a.role === b.role) return 0;
    if (a.role === "user") return -1;
    if (b.role === "user") return 1;
    return 0;
  });
  return mapped;
}

export function ZeepoAiChatSessionPage() {
  const { sessionId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const route = useZeepoAiRoute();
  const locationState = (location.state ?? {}) as LocationState;
  const {
    open: sidebarOpen,
    setOpen: setSidebarOpen,
    openMobile,
    setOpenMobile,
    isMobile,
  } = useSidebar();

  const sessionQuery = trpc.zeepoAi.sessions.get.useQuery(
    { id: sessionId },
    {
      enabled: Boolean(sessionId),
      refetchOnWindowFocus: true,
      refetchInterval: (q) => {
        const gens = q.state.data?.generations ?? [];
        const pending = gens.some(
          (g) => g.status === "PROCESSING" || g.status === "QUEUED",
        );
        return pending ? 4000 : false;
      },
    },
  );
  const feedbackMutation = trpc.zeepoAi.messages.feedback.useMutation();
  const utils = trpc.useUtils();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteSession = trpc.zeepoAi.sessions.delete.useMutation({
    onSuccess: async () => {
      toast.success("Chat deleted");
      setDeleteOpen(false);
      await utils.zeepoAi.sessions.list.invalidate();
      await utils.zeepoAi.sessions.listLibrary.invalidate();
      startViewTransitionNavigate(() => {
        navigate(route.basePath);
      });
    },
    onError: (e) => toast.error(e.message || "Could not delete chat"),
  });

  const renameSession = trpc.zeepoAi.sessions.updateTitle.useMutation({
    onSuccess: async (result) => {
      toast.success("Chat renamed");
      setRenameOpen(false);
      setSession((prev) => (prev ? { ...prev, title: result.title } : prev));
      await utils.zeepoAi.sessions.list.invalidate();
      await utils.zeepoAi.sessions.get.invalidate({ id: sessionId });
    },
    onError: (e) => toast.error(e.message || "Could not rename chat"),
  });

  const [session, setSession] = useState<ZeepoAiChatSession | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ZeepoAiActivePanel>(null);
  const [dismissedQuestionIds, setDismissedQuestionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [connectionBanner, setConnectionBanner] = useState<string | null>(null);
  const [handoffStarting, setHandoffStarting] = useState(false);
  const isStreaming = streamingMessageId != null;
  const abortRef = useRef<AbortController | null>(null);
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const reasoningStartedAt = useRef<number>(0);
  const streamingLockRef = useRef(false);
  const handoffRef = useRef<ZeepoAiHandoffPayload | null>(
    sessionId ? resolveHandoff(sessionId, locationState) : null,
  );

  useEffect(() => {
    streamingLockRef.current = Boolean(streamingMessageId);
  }, [streamingMessageId]);

  useEffect(() => {
    if (!sessionQuery.data) return;
    // Never clobber an in-flight turn or a compose handoff that hasn't landed in DB yet.
    if (streamingLockRef.current) return;
    const handoff = handoffRef.current ?? readZeepoAiHandoff(sessionId);
    if (handoff?.content && (sessionQuery.data.messages?.length ?? 0) === 0) {
      return;
    }
    const messages = messagesFromSessionData(sessionQuery.data);
    const generations = sessionQuery.data.generations.map((g) =>
      mapApiGeneration({
        ...g,
        sessionId: sessionQuery.data.session.id,
        createdAt: g.createdAt,
      }),
    );
    setSession({
      id: sessionQuery.data.session.id,
      title: sessionQuery.data.session.title ?? "New chat",
      updatedAt: sessionQuery.data.session.updatedAt.toISOString?.()
        ? sessionQuery.data.session.updatedAt.toISOString()
        : String(sessionQuery.data.session.updatedAt),
      messages,
      generations,
    });
  }, [sessionQuery.data, sessionId]);

  // Seed visible handoff bubble immediately (before network round-trips).
  useEffect(() => {
    if (!sessionId) return;
    const handoff = handoffRef.current ?? resolveHandoff(sessionId, locationState);
    if (!handoff?.content) return;
    handoffRef.current = handoff;
    setHandoffStarting(true);
    setSession((prev) => {
      if (prev && prev.messages.some((m) => m.role === "user")) return prev;
      const nowIso = new Date().toISOString();
      return {
        id: sessionId,
        title: titleFromMessage(handoff.content),
        updatedAt: nowIso,
        messages: [
          {
            id: `handoff-user-${sessionId}`,
            role: "user",
            content: handoff.content,
            createdAt: nowIso,
            status: "complete",
          },
        ],
        generations: prev?.generations ?? [],
      };
    });
  }, [sessionId, locationState.initialMessage]);

  const applyServerSession = useCallback(
    (fresh: NonNullable<typeof sessionQuery.data>) => {
      const messages = messagesFromSessionData(fresh);
      const generations = fresh.generations.map((g) =>
        mapApiGeneration({
          ...g,
          sessionId: fresh.session.id,
          createdAt: g.createdAt,
        }),
      );
      setSession({
        id: fresh.session.id,
        title: fresh.session.title ?? "New chat",
        updatedAt: fresh.session.updatedAt.toISOString?.()
          ? fresh.session.updatedAt.toISOString()
          : String(fresh.session.updatedAt),
        messages,
        generations,
      });
    },
    [],
  );

  // Safety net: never leave "Connecting to Zeepo…" up forever.
  useEffect(() => {
    if (!handoffStarting || isStreaming) return;
    const timer = window.setTimeout(() => {
      setHandoffStarting(false);
      toast.error("Could not start the reply. Tap Retry on your message.");
    }, 20_000);
    return () => window.clearTimeout(timer);
  }, [handoffStarting, isStreaming]);

  const pendingQuestions = useMemo(() => {
    if (!session) return null;
    const msgs = session.messages;
    let lastIdx = -1;
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i]!;
      if (
        m.role === "assistant" &&
        Array.isArray(m.clarifyingQuestions) &&
        m.clarifyingQuestions.length > 0
      ) {
        lastIdx = i;
      }
    }
    if (lastIdx < 0) return null;
    for (let i = lastIdx + 1; i < msgs.length; i++) {
      if (msgs[i]!.role === "user") return null;
    }
    const m = msgs[lastIdx]!;
    if (dismissedQuestionIds.has(m.id)) return null;
    if (m.status === "streaming") return null;
    return { messageId: m.id, questions: m.clarifyingQuestions! };
  }, [session?.messages, dismissedQuestionIds]);

  const isPreviewPanelOpen = Boolean(activePanel);
  useEffect(() => {
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

  const patchAssistant = useCallback((assistantId: string, patch: Partial<ZeepoAiMessage>) => {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        messages: prev.messages.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)),
      };
    });
  }, []);

  const runAssistantTurn = useCallback(
    async (
      userText: string,
      opts?: {
        skillId?: string;
        searchEnabled?: boolean;
        attachmentIds?: string[];
        /** When retrying, drop this user message and everything after it first. */
        replaceFromUserId?: string;
      },
    ) => {
      if (!sessionId) return;
      if (streamingLockRef.current) return;
      streamingLockRef.current = true;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setConnectionBanner(null);

      const tempUserId = `temp-user-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
      const tempAssistantId = `temp-asst-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
      const userCreatedAt = new Date();
      const assistantCreatedAt = new Date(userCreatedAt.getTime() + 1);
      const userCreatedAtIso = userCreatedAt.toISOString();
      const assistantCreatedAtIso = assistantCreatedAt.toISOString();

      setSession((prev) => {
        let cleanedMessages =
          prev?.messages.filter((m) => !m.id.startsWith("handoff-")) ?? [];
        if (opts?.replaceFromUserId) {
          const cut = cleanedMessages.findIndex((m) => m.id === opts.replaceFromUserId);
          if (cut >= 0) cleanedMessages = cleanedMessages.slice(0, cut);
        }
        const base: ZeepoAiChatSession =
          prev
            ? {
                ...prev,
                messages: cleanedMessages,
              }
            : ({
                id: sessionId,
                title: titleFromMessage(userText),
                updatedAt: userCreatedAtIso,
                messages: [],
                generations: [],
              } satisfies ZeepoAiChatSession);
        return {
          ...base,
          title: base.title === "New chat" ? titleFromMessage(userText) : base.title,
          updatedAt: userCreatedAtIso,
          messages: [
            ...base.messages,
            {
              id: tempUserId,
              role: "user",
              content: userText,
              createdAt: userCreatedAtIso,
              status: "complete",
            },
            {
              id: tempAssistantId,
              role: "assistant",
              content: "",
              createdAt: assistantCreatedAtIso,
              status: "streaming",
              reasoningStatus: "streaming",
              reasoning: "",
            },
          ],
        };
      });

      setStreamingMessageId(tempAssistantId);
      reasoningStartedAt.current = performance.now();

      let serverUserId = tempUserId;
      let serverAssistantId = tempAssistantId;
      let liveAssistantId = tempAssistantId;
      let reasoning = "";
      let content = "";
      let reasoningComplete = false;
      let reasoningDurationMs: number | undefined;
      let uiRaf: number | null = null;
      let pendingUiFlush = false;
      let lastUiFlushAt = 0;

      const flushStreamUi = () => {
        uiRaf = null;
        pendingUiFlush = false;
        lastUiFlushAt = performance.now();
        patchAssistant(liveAssistantId, {
          reasoning,
          content,
          status: "streaming",
          reasoningStatus: reasoningComplete
            ? "complete"
            : reasoning
              ? "streaming"
              : content
                ? "idle"
                : "streaming",
          ...(reasoningDurationMs != null ? { reasoningDurationMs } : {}),
        });
      };

      const scheduleStreamUi = () => {
        if (pendingUiFlush) return;
        pendingUiFlush = true;
        // ~30fps React updates; AiStreamingText interpolates between them.
        const elapsed = performance.now() - lastUiFlushAt;
        const delay = Math.max(0, 32 - elapsed);
        uiRaf = window.setTimeout(() => {
          uiRaf = null;
          flushStreamUi();
        }, delay) as unknown as number;
      };

      const commitServerIds = (extra?: Partial<ZeepoAiMessage>) => {
        setSession((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            updatedAt: new Date().toISOString(),
            generations: prev.generations.map((g) =>
              g.messageId === tempAssistantId || g.messageId === liveAssistantId
                ? { ...g, messageId: serverAssistantId }
                : g,
            ),
            messages: prev.messages.map((m) => {
              if (m.id === tempUserId || m.id === serverUserId) {
                return m.id === serverUserId ? m : { ...m, id: serverUserId };
              }
              if (m.id === tempAssistantId || m.id === liveAssistantId || m.id === serverAssistantId) {
                return {
                  ...m,
                  id: serverAssistantId,
                  reasoning,
                  content,
                  ...extra,
                };
              }
              return m;
            }),
          };
        });
        liveAssistantId = serverAssistantId;
        setStreamingMessageId(serverAssistantId);
      };

      try {
        await streamZeepoAiChat({
          sessionId,
          content: userText,
          skillId: opts?.skillId,
          searchEnabled: opts?.searchEnabled,
          attachmentIds: opts?.attachmentIds,
          replaceFromUserMessageId:
            opts?.replaceFromUserId &&
            !opts.replaceFromUserId.startsWith("temp-") &&
            !opts.replaceFromUserId.startsWith("handoff-")
              ? opts.replaceFromUserId
              : undefined,
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === "ping") return;

            if (event.type === "message_start") {
              serverUserId = event.userMessageId;
              serverAssistantId = event.assistantMessageId;
              // Keep DOM ids on temp-* until the turn finishes so the assistant
              // bubble does not remount mid-stream (that resets the typewriter).
              return;
            }

            if (event.type === "session_title") {
              const nextTitle = event.title.trim();
              if (!nextTitle) return;
              setSession((prev) =>
                prev ? { ...prev, title: nextTitle, updatedAt: new Date().toISOString() } : prev,
              );
              void utils.zeepoAi.sessions.list.invalidate();
              return;
            }

            if (event.type === "reasoning_delta") {
              reasoning += event.text;
              scheduleStreamUi();
              return;
            }

            if (event.type === "text_delta") {
              if (reasoning && !reasoningComplete) {
                reasoningComplete = true;
                reasoningDurationMs = Math.max(
                  500,
                  Math.round(performance.now() - reasoningStartedAt.current),
                );
              }
              content += event.text;
              scheduleStreamUi();
              return;
            }

            if (event.type === "clarifying_questions") {
              if (uiRaf != null) {
                clearTimeout(uiRaf);
                flushStreamUi();
              }
              commitServerIds({
                clarifyingQuestions: event.questions,
                status: "complete",
                reasoningStatus: reasoning ? "complete" : "idle",
              });
              return;
            }

            if (event.type === "tool_result") {
              setSession((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  messages: prev.messages.map((m) => {
                    if (
                      m.id !== tempAssistantId &&
                      m.id !== liveAssistantId &&
                      m.id !== serverAssistantId
                    ) {
                      return m;
                    }
                    const existing = m.toolResults ?? [];
                    if (existing.some((t) => t.toolUseId === event.toolUseId)) return m;
                    return {
                      ...m,
                      toolResults: [
                        ...existing,
                        {
                          toolName: event.toolName,
                          toolUseId: event.toolUseId,
                          result: event.result,
                        },
                      ],
                    };
                  }),
                };
              });
              return;
            }

            if (event.type === "generation_start") {
              const mapped = mapApiGeneration({
                id: event.generationId,
                kind: event.kind,
                status: "PROCESSING",
                provider: "google",
                modelId: "zeepo-design",
                messageId: liveAssistantId,
                sessionId,
                prompt: event.title,
                outputs: {},
                createdAt: new Date().toISOString(),
              });
              setSession((prev) => {
                if (!prev) return prev;
                const without = prev.generations.filter((g) => g.id !== mapped.id);
                return { ...prev, generations: [...without, mapped] };
              });
              return;
            }

            if (event.type === "generation_progress") {
              setSession((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  generations: prev.generations.map((g) =>
                    g.id === event.generationId
                      ? { ...g, status: event.status as ZeepoAiGeneration["status"] }
                      : g,
                  ),
                };
              });
              return;
            }

            if (event.type === "generation") {
              const mapped = mapApiGeneration({
                id: event.generation.id,
                kind: event.generation.kind,
                status: event.generation.status,
                provider: "google",
                modelId: "zeepo",
                messageId: liveAssistantId,
                sessionId,
                prompt: event.generation.title,
                outputs: event.generation.outputs,
                createdAt: new Date().toISOString(),
              });
              setSession((prev) => {
                if (!prev) return prev;
                const without = prev.generations.filter((g) => g.id !== mapped.id);
                return { ...prev, generations: [...without, mapped] };
              });
              return;
            }

            if (event.type === "error") {
              if (uiRaf != null) {
                clearTimeout(uiRaf);
                flushStreamUi();
              }
              setConnectionBanner(event.message);
              toast.error(event.message);
              commitServerIds({
                status: "error",
                interrupted: true,
                reasoningStatus: reasoning ? "complete" : "idle",
                content: content || undefined,
              });
              return;
            }

            if (event.type === "done") {
              if (uiRaf != null) {
                clearTimeout(uiRaf);
                uiRaf = null;
                pendingUiFlush = false;
              }
              const status =
                event.status === "complete"
                  ? "complete"
                  : event.status === "cancelled"
                    ? "cancelled"
                    : "error";
              commitServerIds({
                status,
                interrupted: status !== "complete",
                reasoningStatus: reasoning ? "complete" : "idle",
                reasoningDurationMs:
                  reasoningDurationMs ??
                  (reasoning
                    ? Math.max(500, Math.round(performance.now() - reasoningStartedAt.current))
                    : undefined),
                content,
              });
              if (status === "cancelled") {
                toast.message("Generation stopped", {
                  description:
                    "You can edit your prompt and send again, or tap Retry on your message.",
                });
              }
              void utils.zeepoAi.sessions.list.invalidate();
              void utils.zeepoAi.sessions.get.invalidate({ id: sessionId });
              void utils.zeepoAi.sessions.listLibrary.invalidate();
            }
          },
        });
      } finally {
        if (uiRaf != null) clearTimeout(uiRaf);
        streamingLockRef.current = false;
        setStreamingMessageId(null);
        abortRef.current = null;
      }
    },
    [sessionId, patchAssistant, utils],
  );

  const runAssistantTurnRef = useRef(runAssistantTurn);
  runAssistantTurnRef.current = runAssistantTurn;

  const appendUserAndStream = useCallback(
    async (
      text: string,
      opts?: {
        skillId?: string;
        searchEnabled?: boolean;
        attachmentIds?: string[];
        replaceFromUserId?: string;
      },
    ) => {
      const trimmed = text.trim();
      if (!trimmed || streamingLockRef.current) return;
      await runAssistantTurn(trimmed, opts);
    },
    [runAssistantTurn],
  );

  // Compose → session auto-send.
  // React Strict Mode remounts discard the first mount's setState. We abort the orphan
  // request on cleanup and re-check the server on remount so we never stay stuck on
  // "Connecting to Zeepo…" after a claim that only the dead mount owned.
  useEffect(() => {
    if (!sessionId) return;
    const handoff = handoffRef.current ?? resolveHandoff(sessionId, locationState);
    if (!handoff?.content) return;
    if (sessionQuery.isLoading) return;
    if (sessionQuery.isError) {
      toast.error("Could not load this chat. Try again from the home screen.");
      clearZeepoAiHandoff(sessionId);
      handoffRef.current = null;
      setHandoffStarting(false);
      return;
    }
    if ((sessionQuery.data?.messages?.length ?? 0) > 0) {
      clearZeepoAiHandoff(sessionId);
      handoffRef.current = null;
      setHandoffStarting(false);
      return;
    }

    let cancelled = false;
    handoffRef.current = handoff;
    setHandoffStarting(true);

    void (async () => {
      try {
        // Remount path: a previous Strict Mode mount may already have persisted messages.
        const fresh = await utils.zeepoAi.sessions.get.fetch({ id: sessionId });
        if (cancelled) return;
        if ((fresh.messages?.length ?? 0) > 0) {
          applyServerSession(fresh);
          clearZeepoAiHandoff(sessionId);
          handoffRef.current = null;
          setHandoffStarting(false);
          navigate(location.pathname, { replace: true, state: {} });
          return;
        }

        await runAssistantTurnRef.current(handoff.content, {
          skillId: handoff.skillId,
          searchEnabled: handoff.searchEnabled,
          attachmentIds: handoff.attachmentIds,
        });
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error && err.message
              ? err.message
              : "Could not start the reply. Try sending again.";
          toast.error(message);
        }
      } finally {
        if (!cancelled) {
          clearZeepoAiHandoff(sessionId);
          handoffRef.current = null;
          setHandoffStarting(false);
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    })();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
      streamingLockRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- do not depend on messages.length (would abort mid-stream)
  }, [sessionId, sessionQuery.isLoading, sessionQuery.isError, applyServerSession, utils.zeepoAi.sessions.get]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRetryUser = useCallback(
    (userMessage: ZeepoAiMessage) => {
      if (!session || streamingLockRef.current || handoffStarting) return;
      const text = userMessage.content.trim();
      if (!text) return;
      setConnectionBanner(null);
      void appendUserAndStream(text, { replaceFromUserId: userMessage.id });
    },
    [session, appendUserAndStream, handoffStarting],
  );

  const handleEditUser = useCallback(
    (userMessage: ZeepoAiMessage, nextContent: string) => {
      if (!session || streamingLockRef.current || handoffStarting) return;
      const text = nextContent.trim();
      if (!text) return;
      setConnectionBanner(null);
      void appendUserAndStream(text, { replaceFromUserId: userMessage.id });
    },
    [session, appendUserAndStream, handoffStarting],
  );

  const handleFeedback = useCallback(
    async (messageId: string, feedback: "like" | "dislike" | "clear") => {
      if (
        !messageId ||
        messageId.startsWith("temp-") ||
        messageId.startsWith("handoff-")
      ) {
        toast.error("Wait for the reply to finish, then try again.");
        return;
      }
      const next = feedback === "clear" ? null : feedback;
      const prev = session?.messages.find((m) => m.id === messageId)?.feedback ?? null;
      patchAssistant(messageId, { feedback: next });
      try {
        await feedbackMutation.mutateAsync({ messageId, feedback });
      } catch {
        patchAssistant(messageId, { feedback: prev });
        toast.error("Could not save feedback");
      }
    },
    [feedbackMutation, patchAssistant, session?.messages],
  );

  const handleSubmit = useCallback(
    (payload: {
      message: string;
      searchEnabled?: boolean;
      skillId?: string;
      attachmentIds?: string[];
    }) => {
      void appendUserAndStream(payload.message, {
        searchEnabled: payload.searchEnabled,
        skillId: payload.skillId,
        attachmentIds: payload.attachmentIds,
      });
    },
    [appendUserAndStream],
  );

  if (!sessionId) return <Navigate to={route.basePath} replace />;

  if (sessionQuery.isError && !session) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
        Could not load this chat. It may have been deleted.
      </div>
    );
  }

  const splitColumnPadding = "px-3 sm:px-4 md:px-5";
  const displayTitle = session?.title?.trim() || "New chat";

  return (
    <div
      className={cn(
        "zeepo-ai-root relative flex h-[calc(100svh-theme(spacing.12)-theme(spacing.8))] min-h-0 w-full overflow-hidden transition-all duration-300",
      )}
    >
      <div
        className={cn(
          "relative flex min-h-0 min-w-0 flex-col overflow-hidden transition-all duration-300 ease-in-out",
          activePanel
            ? "hidden md:flex md:h-full md:w-[48%] md:shrink-0 xl:w-[52%] border-r border-border"
            : "flex h-full w-full",
        )}
      >
        <div className={cn("flex h-full min-h-0 flex-1 flex-col overflow-hidden", splitColumnPadding)}>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 py-2">
            <button
              type="button"
              className="group inline-flex min-w-0 max-w-[min(100%,28rem)] items-center gap-1.5 rounded-md px-1.5 py-1 text-left hover:bg-muted/60"
              onClick={() => setRenameOpen(true)}
              title="Rename chat"
            >
              <span className="truncate text-sm font-semibold text-foreground">{displayTitle}</span>
              <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-70" />
            </button>
            <button
              type="button"
              aria-label="Delete chat"
              className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          {connectionBanner ? (
            <div className="mt-2 shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100">
              {connectionBanner}
            </div>
          ) : null}

          <div
            ref={scrollParentRef}
            className="zeepo-ai-chat-surface min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-40"
          >
            {sessionQuery.isLoading && !session ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-sm text-muted-foreground">
                <Spinner size={22} className="text-primary" />
                Loading conversation…
              </div>
            ) : session ? (
              <>
                <ZeepoAiMessageList
                  messages={session.messages}
                  generations={session.generations}
                  streamingMessageId={streamingMessageId}
                  scrollParentRef={scrollParentRef}
                  onOpenGeneration={setActivePanel}
                  onRetryUser={handleRetryUser}
                  onEditUser={handleEditUser}
                  onFeedback={handleFeedback}
                  onCopy={() => toast.success("Copied")}
                />
                {handoffStarting && !isStreaming ? (
                  <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-3 pb-4 text-sm text-muted-foreground sm:px-4 md:px-6">
                    <Spinner size={14} className="text-primary" />
                    Connecting to Zeepo…
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="relative z-10 shrink-0 bg-gradient-to-t from-background via-background to-transparent pb-3 pt-2">
            <div className="mx-auto w-full max-w-3xl space-y-3">
              {pendingQuestions ? (
                <ZeepoAiClarifyingQuestions
                  messageId={pendingQuestions.messageId}
                  questions={pendingQuestions.questions}
                  onDismiss={() => {
                    setDismissedQuestionIds((prev) => {
                      const next = new Set(prev);
                      next.add(pendingQuestions.messageId);
                      return next;
                    });
                  }}
                  onComplete={(compiled) => {
                    setDismissedQuestionIds((prev) => {
                      const next = new Set(prev);
                      next.add(pendingQuestions.messageId);
                      return next;
                    });
                    void appendUserAndStream(compiled);
                  }}
                />
              ) : null}

              <ZeepoAiComposer
                sessionId={sessionId}
                onSubmit={handleSubmit}
                onStop={handleStop}
                showStop={isStreaming}
                placeholder={
                  pendingQuestions
                    ? "Answer the questions above, or skip them…"
                    : isStreaming
                      ? "Zeepo is responding…"
                      : "Message Zeepo…"
                }
                disabled={Boolean(pendingQuestions) || sessionQuery.isLoading}
                showSkills={!pendingQuestions && !isStreaming}
              />
            </div>
          </div>
        </div>
      </div>

      {activePanel ? (
        <div
          className={cn(
            "absolute inset-0 z-40 flex min-h-0 flex-col overflow-hidden bg-background",
            "md:relative md:inset-auto md:z-auto md:min-h-0 md:flex-1",
            "animate-in slide-in-from-right-2 duration-200 md:animate-none",
          )}
        >
          <ZeepoAiDetailPane
            panel={activePanel}
            sessionId={sessionId}
            onClose={() => setActivePanel(null)}
          />
        </div>
      ) : null}

      <ZeepoRenameChatDialog
        target={sessionId ? { id: sessionId, title: displayTitle } : null}
        open={renameOpen}
        onOpenChange={(open) => {
          if (!open && !renameSession.isPending) setRenameOpen(false);
        }}
        isPending={renameSession.isPending}
        onConfirm={async (id, title) => {
          await renameSession.mutateAsync({ id, title });
        }}
      />

      <ZeepoDeleteChatDialog
        target={sessionId ? { id: sessionId, title: displayTitle } : null}
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !deleteSession.isPending) setDeleteOpen(false);
        }}
        isPending={deleteSession.isPending}
        onConfirm={async (id) => {
          await deleteSession.mutateAsync({ id });
        }}
      />
    </div>
  );
}

export default ZeepoAiChatSessionPage;
