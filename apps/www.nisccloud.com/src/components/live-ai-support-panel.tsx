import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send, Sparkles, Square } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { Button } from "@/components/ui/button.tsx";
import { AiMarkdownRenderer } from "@/components/ai-markdown-renderer.tsx";
import {
  createAuthSupportAiSession,
  createGuestSupportAiSession,
  fetchAuthSupportAiSession,
  fetchGuestSupportAiSession,
  streamSupportAi,
  openGuestSupportTicket,
  openAuthSupportTicket,
  type SupportAiMessage,
  type SupportAiToolInvocation,
} from "@/lib/live-ai-support-api.ts";
import { LandingSupportToolCards } from "@/components/live-ai-support-cards.tsx";
import { OpenSupportTicketDialog } from "@/components/open-support-ticket-dialog.tsx";
import { buildStorefrontSignInUrl } from "@/lib/storefront-checkout-api.ts";
import { toast } from "sonner";

type ToolResult = { toolUseId: string; toolName: string; result: unknown };

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolResults?: ToolResult[];
};

const GREETING_GUEST =
  "Hi — I'm Zeepo. Ask about domains, hosting, or VPS and I'll keep it short. For your own services, log in or contact us.";
const GREETING_SIGNED_IN =
  "Hi — I'm Zeepo. Ask about domains, hosting, or VPS. For live servers, DNS, and mail on your account, open Live AI Support in the nPanel dashboard.";

export function LiveAiSupportPanel({
  isSignedIn,
  onBack,
  onContactUs,
  onViewTicket,
}: {
  isSignedIn: boolean;
  onBack: () => void;
  onContactUs: () => void;
  onViewTicket?: (ticketId: string) => void;
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const bootstrap = useCallback(async () => {
    setBootstrapping(true);
    setError(null);
    try {
      // Marketing origin is catalog-only even when signed in  live inventory stays on nPanel.
      const session = isSignedIn
        ? await createAuthSupportAiSession()
        : await createGuestSupportAiSession();
      setSessionId(session.id);
      const payload = isSignedIn
        ? await fetchAuthSupportAiSession(session.id)
        : await fetchGuestSupportAiSession(session.id);
      setMessages(mapLoaded(payload.messages, payload.toolInvocations));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start Live AI Support");
    } finally {
      setBootstrapping(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    void bootstrap();
    return () => abortRef.current?.abort();
  }, [bootstrap]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending || !sessionId) return;
    setInput("");
    setError(null);
    setSending(true);
    const assistantId = `local-assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: `local-user-${Date.now()}`, role: "user", content },
      { id: assistantId, role: "assistant", content: "", toolResults: [] },
    ]);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await streamSupportAi({
        sessionId,
        content,
        mode: isSignedIn ? "auth" : "guest",
        signal: ac.signal,
        onEvent: (event) => {
          if (event.type === "text_delta" && typeof event.text === "string") {
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
                          toolUseId: String(event.toolUseId ?? ""),
                          toolName: String(event.toolName ?? ""),
                          result: event.result,
                        },
                      ],
                    }
                  : m,
              ),
            );
          } else if (event.type === "error" && typeof event.message === "string") {
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
          <p className="text-[11px] text-muted-foreground">
            {isSignedIn ? "Zeepo · your account" : "Zeepo · summary answers"}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onContactUs}>
          Messages
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {bootstrapping ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mb-2 h-6 w-6 animate-spin" />
            <p className="text-sm">Starting Zeepo…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-muted/60 px-3 py-2 text-sm leading-relaxed">
                {isSignedIn ? GREETING_SIGNED_IN : GREETING_GUEST}
              </div>
            </div>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div className={cn("max-w-[90%] space-y-2", msg.role === "user" ? "" : "w-full")}>
                  {msg.role === "user" ? (
                    <div className="rounded-2xl rounded-tr-md bg-primary px-3 py-2 text-sm text-primary-foreground">
                      {msg.content}
                    </div>
                  ) : (
                    <>
                      {msg.content ? (
                        <div className="rounded-2xl rounded-tl-md bg-muted/60 px-3 py-2 text-sm leading-relaxed">
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
                        <LandingSupportToolCards
                          results={msg.toolResults}
                          onViewTicket={onViewTicket}
                        />
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error ? <p className="px-3 pb-1 text-xs text-red-600">{error}</p> : null}

      {!isSignedIn ? (
        <div className="flex-shrink-0 border-t px-3 py-2">
          <a
            href={buildStorefrontSignInUrl(typeof window !== "undefined" ? window.location.href : undefined)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Log in for account-specific help
          </a>
        </div>
      ) : null}

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
          <button
            type="button"
            onClick={() => abortRef.current?.abort()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20"
            title="Stop generating"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!input.trim() || !sessionId}
            onClick={() => void handleSend()}
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors",
              input.trim() ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground",
            )}
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
      <OpenSupportTicketDialog
        open={ticketDialogOpen}
        onOpenChange={setTicketDialogOpen}
        submitting={ticketSubmitting}
        onSubmit={async ({ phone, intent }) => {
          if (!sessionId) return;
          setTicketSubmitting(true);
          try {
            const result = isSignedIn
              ? await openAuthSupportTicket({ sessionId, phone, intent })
              : await openGuestSupportTicket({ sessionId, phone, intent });
            setTicketDialogOpen(false);
            toast.success(
              result.alreadyOpen
                ? `Ticket ${result.ticketNumber} is already open`
                : `Ticket ${result.ticketNumber} opened`,
            );
            if (result.ticketId) onViewTicket?.(result.ticketId);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not open a ticket");
          } finally {
            setTicketSubmitting(false);
          }
        }}
      />
    </div>
  );
}

function mapLoaded(
  messages: SupportAiMessage[],
  toolInvocations: SupportAiToolInvocation[],
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
