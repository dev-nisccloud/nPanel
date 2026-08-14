"use client";

import * as React from "react";
import { ArrowLeft, Send, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { AiMarkdownRenderer } from "@/components/ai/ai-markdown-renderer";
import { ZeepoToolResultCards } from "@/components/zeepo/zeepo-tool-result-cards";
import { streamZeepoAiChat } from "@/components/zeepo/zeepo-ai-stream-client";
import {
  ZeepoAiRouteProvider,
  type ZeepoAiRouteConfig,
} from "@/components/zeepo/zeepo-ai-route-context";
import { trpc } from "@/utils/trpc";
import { OpenSupportTicketDialog } from "@/components/support/open-support-ticket-dialog";
import { toast } from "sonner";

type ToolResult = { toolUseId: string; toolName: string; result: unknown };

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolResults?: ToolResult[];
};

const GREETING =
  "Hi — I'm Zeepo. Ask about domains, hosting, VPS, or your services. I'll keep it short; tap a card to buy.";

export function LiveAiSupportPanel({
  teamId,
  teamSlug,
  onBack,
  onContactUs,
  onViewTicket,
}: {
  teamId: string | null;
  teamSlug: string | null;
  onBack: () => void;
  onContactUs: () => void;
  onViewTicket?: (ticketId: string) => void;
}) {
  const config = React.useMemo<ZeepoAiRouteConfig>(
    () => ({
      basePath: teamSlug ? `/${teamSlug}/zeepo-ai` : "/agency/zeepo-ai",
      teamId,
      teamSlug,
      isCustomer: Boolean(teamSlug),
    }),
    [teamId, teamSlug],
  );

  return (
    <ZeepoAiRouteProvider config={config}>
      <LiveAiSupportChat
        teamId={teamId}
        onBack={onBack}
        onContactUs={onContactUs}
        onViewTicket={onViewTicket}
      />
    </ZeepoAiRouteProvider>
  );
}

function LiveAiSupportChat({
  teamId,
  onBack,
  onContactUs,
  onViewTicket,
}: {
  teamId: string | null;
  onBack: () => void;
  onContactUs: () => void;
  onViewTicket?: (ticketId: string) => void;
}) {
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = React.useState(true);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const getOrCreate = trpc.zeepoAiSupport.getOrCreate.useMutation();
  const openTicket = trpc.zeepoAiSupport.openTicket.useMutation();
  const [ticketDialogOpen, setTicketDialogOpen] = React.useState(false);
  const utils = trpc.useUtils();

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getOrCreate.mutateAsync(teamId ? { teamId } : {});
        if (!session?.id || cancelled) return;
        setSessionId(session.id);
        const payload = await utils.zeepoAiSupport.getSession.fetch({ id: session.id });
        if (cancelled) return;
        setMessages(mapLoadedMessages(payload.messages, payload.toolInvocations));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Couldn't start Live AI Support");
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
    // Intentionally once per mount / team
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending || !sessionId) return;
    setInput("");
    setError(null);
    setSending(true);

    const userId = `local-user-${Date.now()}`;
    const assistantId = `local-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content },
      { id: assistantId, role: "assistant", content: "", toolResults: [] },
    ]);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      await streamZeepoAiChat({
        sessionId,
        content,
        teamId: teamId ?? undefined,
        searchEnabled: false,
        signal: ac.signal,
        onEvent: (event) => {
          if (event.type === "text_delta") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + event.text } : m,
              ),
            );
          } else if (event.type === "tool_result") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      toolResults: [
                        ...(m.toolResults ?? []),
                        {
                          toolUseId: event.toolUseId,
                          toolName: event.toolName,
                          result: event.result,
                        },
                      ],
                    }
                  : m,
              ),
            );
          } else if (event.type === "error") {
            setError(event.message);
          }
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send that message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-shrink-0 items-center gap-2 border-b px-3 pb-3 pt-4">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Live AI Support</p>
          <p className="text-[11px] text-muted-foreground">Zeepo · short answers</p>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onContactUs}>
          Messages
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 px-3 py-3">
          {bootstrapping ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Spinner size={18} />
              <p className="mt-2 text-sm">Starting Zeepo…</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-muted/60 px-3 py-2 text-sm leading-relaxed">
                  {GREETING}
                </div>
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[90%] space-y-2",
                      msg.role === "user"
                        ? "rounded-2xl rounded-tr-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                        : "w-full",
                    )}
                  >
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <>
                        {msg.content ? (
                          <div className="rounded-2xl rounded-tl-md bg-muted/60 px-3 py-2 text-sm">
                            <AiMarkdownRenderer content={msg.content} />
                          </div>
                        ) : sending && msg.id.startsWith("local-assistant") ? (
                          <div className="flex items-center gap-1.5 rounded-2xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                            <div className="flex gap-0.5">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
                            </div>
                            <span>Zeepo is answering…</span>
                          </div>
                        ) : null}
                        {msg.toolResults && msg.toolResults.length > 0 ? (
                          <div className="overflow-x-auto">
                            <ZeepoToolResultCards
                              results={msg.toolResults}
                              onViewTicket={onViewTicket}
                            />
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      </ScrollArea>

      {error ? <p className="px-3 pb-1 text-xs text-red-600">{error}</p> : null}

      <div className="flex flex-shrink-0 items-end gap-2 border-t px-3 py-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          rows={1}
          disabled={sending || bootstrapping || !sessionId}
          placeholder={sending ? "Zeepo is answering…" : "Ask about hosting, VPS, domains…"}
          className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/40"
        />
        {sending ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="h-10 w-10 shrink-0 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
            onClick={() => abortRef.current?.abort()}
            title="Stop generating"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            disabled={!input.trim() || !sessionId}
            onClick={() => void handleSend()}
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
      <OpenSupportTicketDialog
        open={ticketDialogOpen}
        onOpenChange={setTicketDialogOpen}
        showPhone={false}
        submitting={openTicket.isPending}
        onSubmit={async ({ phone, intent }) => {
          if (!sessionId) return;
          try {
            const result = await openTicket.mutateAsync({ sessionId, phone, intent });
            setTicketDialogOpen(false);
            toast.success(
              result.alreadyOpen
                ? `Ticket ${result.ticketNumber} is already open`
                : `Ticket ${result.ticketNumber} opened`,
            );
            if (result.ticketId) onViewTicket?.(result.ticketId);
            void utils.tickets.getList.invalidate();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not open a ticket");
          }
        }}
      />
    </div>
  );
}

function mapLoadedMessages(
  messages: Array<{
    id: string;
    role: string;
    content?: string | null;
    status?: string | null;
  }>,
  toolInvocations: Array<{
    id: string;
    messageId?: string | null;
    toolName: string;
    status?: string | null;
    result?: unknown;
  }>,
): ChatMsg[] {
  const byMessage = new Map<string, ToolResult[]>();
  for (const row of toolInvocations) {
    if (!row.messageId || !row.result) continue;
    if (row.status && row.status !== "succeeded" && row.status !== "failed") continue;
    const list = byMessage.get(row.messageId) ?? [];
    list.push({ toolUseId: row.id, toolName: row.toolName, result: row.result });
    byMessage.set(row.messageId, list);
  }

  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content ?? "",
      toolResults: byMessage.get(m.id),
    }));
}
