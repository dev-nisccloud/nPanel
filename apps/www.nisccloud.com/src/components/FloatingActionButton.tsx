/**
 * Marketing-site support FAB  guest cookie sessions or logged-in credentialed tickets.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Home,
  Loader2,
  MessageCircle,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";
import { useNavbarAuth } from "@/pages/_components/NavbarAuth.tsx";
import {
  claimGuestSupportTickets,
  createAuthTicket,
  createGuestTicket,
  fetchGuestSupportSession,
  getAuthMessages,
  getGuestMessages,
  listAuthTickets,
  listGuestTickets,
  markAuthTicketRead,
  markGuestTicketRead,
  sendAuthMessage,
  sendGuestMessage,
  startGuestSupportSession,
  type SupportTicketListItem,
  type SupportTicketMessage,
} from "@/lib/support-tickets-api.ts";

type ActiveTab = "home" | "messages";
type MessagesView = "list" | "chat" | "guest-form";

function formatTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FloatingActionButton({ className }: { className?: string }) {
  const auth = useNavbarAuth();
  const isSignedIn = auth.status === "signed-in";

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [messagesView, setMessagesView] = useState<MessagesView>("list");
  const [guestReady, setGuestReady] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicketListItem[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [startingGuest, setStartingGuest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const claimedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mySenderIdRef = useRef<string | null>(null);

  const refreshGuestSession = useCallback(async () => {
    const session = await fetchGuestSupportSession();
    setGuestReady(session.active);
    if (session.active) {
      setGuestName(session.name ?? "");
      setGuestEmail(session.email ?? "");
      setGuestPhone(session.phone ?? "");
    }
    return session.active;
  }, []);

  const loadTickets = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      if (isSignedIn) {
        if (!claimedRef.current) {
          claimedRef.current = true;
          await claimGuestSupportTickets();
        }
        const list = await listAuthTickets();
        setTickets(list);
      } else {
        const active = await refreshGuestSession();
        if (!active) {
          setTickets([]);
          return;
        }
        const list = await listGuestTickets();
        setTickets(list);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoadingList(false);
    }
  }, [isSignedIn, refreshGuestSession]);

  const loadMessages = useCallback(
    async (ticketId: string) => {
      setLoadingChat(true);
      setError(null);
      try {
        const result = isSignedIn
          ? await getAuthMessages(ticketId)
          : await getGuestMessages(ticketId);
        setMessages(result.messages);
        if (isSignedIn) {
          await markAuthTicketRead(ticketId).catch(() => undefined);
        } else {
          await markGuestTicketRead(ticketId).catch(() => undefined);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load conversation");
      } finally {
        setLoadingChat(false);
      }
    },
    [isSignedIn],
  );

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("home");
      setMessagesView("list");
      setSelectedTicketId(null);
      setMessageInput("");
      setFormError(null);
      setError(null);
      return;
    }
    void refreshGuestSession();
    if (isSignedIn || guestReady) {
      void loadTickets();
    }
  }, [isOpen, isSignedIn, guestReady, loadTickets, refreshGuestSession]);

  useEffect(() => {
    if (!isOpen || activeTab !== "messages" || messagesView !== "list") return;
    if (!isSignedIn && !guestReady) return;
    const id = window.setInterval(() => {
      void loadTickets();
    }, 10_000);
    return () => window.clearInterval(id);
  }, [isOpen, activeTab, messagesView, isSignedIn, guestReady, loadTickets]);

  useEffect(() => {
    if (!isOpen || !selectedTicketId || messagesView !== "chat") return;
    const id = window.setInterval(() => {
      void loadMessages(selectedTicketId);
    }, 3_000);
    return () => window.clearInterval(id);
  }, [isOpen, selectedTicketId, messagesView, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesView]);

  useEffect(() => {
    if (isSignedIn && auth.status === "signed-in") {
      setGuestName(auth.name);
      setGuestEmail(auth.email);
    }
  }, [isSignedIn, auth]);

  const openMessagesTab = () => {
    setActiveTab("messages");
    if (isSignedIn) {
      setMessagesView("list");
      void loadTickets();
      return;
    }
    if (guestReady) {
      setMessagesView("list");
      void loadTickets();
      return;
    }
    setMessagesView("guest-form");
  };

  const handleStartGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!guestName.trim() || !guestEmail.trim()) {
      setFormError("Name and email are required");
      return;
    }
    setStartingGuest(true);
    try {
      await startGuestSupportSession({
        name: guestName.trim(),
        email: guestEmail.trim(),
        phone: guestPhone.trim() || null,
      });
      setGuestReady(true);
      setMessagesView("list");
      await loadTickets();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not start support session");
    } finally {
      setStartingGuest(false);
    }
  };

  const openTicket = async (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setMessagesView("chat");
    await loadMessages(ticketId);
  };

  const startNewConversation = async () => {
    setSelectedTicketId(null);
    setMessages([]);
    setMessagesView("chat");
    setMessageInput("");
    mySenderIdRef.current = null;
  };

  const handleSend = async () => {
    const content = messageInput.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      if (!selectedTicketId) {
        if (isSignedIn) {
          const created = await createAuthTicket({
            subject: content.slice(0, 80),
          });
          await sendAuthMessage(created.id, content);
          setSelectedTicketId(created.id);
          await loadMessages(created.id);
        } else {
          const created = await createGuestTicket({ message: content });
          setSelectedTicketId(created.ticketId);
          mySenderIdRef.current = null;
          await loadMessages(created.ticketId);
        }
      } else if (isSignedIn) {
        await sendAuthMessage(selectedTicketId, content);
        await loadMessages(selectedTicketId);
      } else {
        await sendGuestMessage(selectedTicketId, content);
        await loadMessages(selectedTicketId);
      }
      setMessageInput("");
      void loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const totalUnread = tickets.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

  const customerSenderId =
    messages.find((m) => !m.isSystem)?.senderId ?? mySenderIdRef.current;

  const messageIsMine = (msg: SupportTicketMessage) => {
    if (isSignedIn && auth.status === "signed-in" && msg.sender?.email) {
      return msg.sender.email.toLowerCase() === auth.email.toLowerCase();
    }
    if (msg.sender?.email?.includes("@guests.nisccloud.internal")) return true;
    if (customerSenderId) return msg.senderId === customerSenderId;
    return false;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "flex h-14 w-14 items-center justify-center rounded-full",
            "bg-primary shadow-lg hover:shadow-xl hover:scale-105",
            "transition-all duration-200 active:scale-95",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            className,
          )}
          aria-label={isOpen ? "Close support" : "Open support"}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
          ) : (
            <>
              <MessageCircle className="h-6 w-6 text-primary-foreground" strokeWidth={2} />
              {totalUnread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              ) : null}
            </>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="top"
        sideOffset={16}
        className={cn(
          "flex h-[580px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-background p-0 shadow-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=top]:slide-in-from-bottom-4",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {activeTab === "home" && (
            <div className="relative flex h-full flex-col overflow-hidden">
              <div
                className="pointer-events-none absolute inset-x-0 top-0"
                style={{
                  height: "52%",
                  background:
                    "linear-gradient(to bottom, var(--primary) 55%, transparent 100%)",
                }}
              />

              <div className="relative z-10 flex flex-shrink-0 items-center justify-between px-5 pb-0 pt-5">
                <img
                  src="/nisccloud-logo.svg"
                  alt="Nisc Cloud"
                  className="h-10 w-auto brightness-0 invert"
                />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/20"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              <div className="relative z-10 flex-shrink-0 px-5 pb-8 pt-5">
                <h2 className="text-[1.65rem] font-bold leading-tight tracking-tight text-white">
                  Hi there 👋
                </h2>
                <p className="mt-0.5 text-[1.35rem] font-semibold leading-snug text-white/90">
                  How can we help?
                </p>
              </div>

              <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
                <div className="space-y-2.5 px-4 pb-4">
                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-md dark:bg-card">
                    <div className="border-b border-border/60 px-4 py-3">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Recent message
                      </p>
                    </div>
                    {tickets[0] ? (
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                        onClick={() => {
                          setActiveTab("messages");
                          void openTicket(tickets[0].id);
                        }}
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
                          <span className="text-sm font-bold text-primary-foreground">N</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {tickets[0].subject || "Support"}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {tickets[0].lastMessage || "Open conversation"}
                          </p>
                        </div>
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
                          <span className="text-sm font-bold text-primary-foreground">N</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You&apos;ll get replies here and in your email...
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-md dark:bg-card">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted/40"
                      onClick={openMessagesTab}
                    >
                      <span className="text-sm font-medium text-foreground">Contact us</span>
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </button>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-md dark:bg-card">
                    <a
                      href="https://docs.nisccloud.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      <span className="text-sm font-medium text-foreground">Nisc Cloud Docs</span>
                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="flex h-full flex-col">
              {messagesView === "guest-form" && (
                <>
                  <div className="flex flex-shrink-0 items-center justify-between border-b px-4 pb-3 pt-4">
                    <h2 className="text-base font-semibold text-foreground">Contact us</h2>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form
                    onSubmit={handleStartGuest}
                    className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
                  >
                    <p className="text-sm text-muted-foreground">
                      Tell us how to reach you. You can keep chatting in this browser without signing in.
                    </p>
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">Name</span>
                      <input
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                        placeholder="Your name"
                        autoComplete="name"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">Email</span>
                      <input
                        required
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">
                        Phone <span className="text-muted-foreground">(optional)</span>
                      </span>
                      <input
                        type="tel"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                        placeholder="+254..."
                        autoComplete="tel"
                      />
                    </label>
                    {formError ? (
                      <p className="text-xs text-red-600">{formError}</p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={startingGuest}
                      className="mt-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      {startingGuest ? "Starting..." : "Continue to chat"}
                    </button>
                  </form>
                </>
              )}

              {messagesView === "list" && (
                <>
                  <div className="flex flex-shrink-0 items-center justify-between border-b px-4 pb-3 pt-4">
                    <h2 className="text-base font-semibold text-foreground">Messages</h2>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void startNewConversation()}
                        className="rounded-full px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                      >
                        New
                      </button>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {loadingList ? (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Loader2 className="mb-2 h-6 w-6 animate-spin" />
                        <p className="text-sm">Loading...</p>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="mb-4 w-fit rounded-full bg-muted/50 p-4">
                          <MessageSquare className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="mb-1 text-base font-semibold">No messages yet</h3>
                        <p className="mb-5 max-w-[220px] text-sm text-muted-foreground">
                          Start a conversation and our team will reply here.
                        </p>
                        <button
                          type="button"
                          className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                          onClick={() => void startNewConversation()}
                        >
                          Start chat
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {tickets.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                            onClick={() => void openTicket(t.id)}
                          >
                            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                              <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold">
                                  {t.subject || t.ticketNumber}
                                </p>
                                <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                                  {formatTime(t.lastMessageAt)}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {t.lastMessage || "No messages yet"}
                              </p>
                            </div>
                            {t.unreadCount > 0 ? (
                              <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {t.unreadCount}
                              </span>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {messagesView === "chat" && (
                <>
                  <div className="flex flex-shrink-0 items-center gap-2 border-b px-3 pb-3 pt-4">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent"
                      onClick={() => {
                        setMessagesView("list");
                        setSelectedTicketId(null);
                        void loadTickets();
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h2 className="flex-1 truncate text-base font-semibold text-foreground">
                      {selectedTicketId
                        ? tickets.find((t) => t.id === selectedTicketId)?.subject ||
                          "Conversation"
                        : "New conversation"}
                    </h2>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {loadingChat && messages.length === 0 ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        {messages.length === 0 ? (
                          <p className="py-8 text-center text-sm text-muted-foreground">
                            Describe your issue and we&apos;ll get back to you.
                          </p>
                        ) : null}
                        {messages.map((msg) => {
                          const mine = messageIsMine(msg);
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex",
                                mine ? "justify-end" : "justify-start",
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                                  mine
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground",
                                )}
                              >
                                {!mine ? (
                                  <p className="mb-1 text-[11px] font-semibold opacity-70">
                                    Nisc Cloud Support
                                  </p>
                                ) : null}
                                {msg.content}
                                <p
                                  className={cn(
                                    "mt-1 text-[10px]",
                                    mine ? "text-primary-foreground/70" : "text-muted-foreground",
                                  )}
                                >
                                  {formatTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={bottomRef} />
                      </>
                    )}
                  </div>

                  {error ? (
                    <p className="px-4 pb-1 text-xs text-red-600">{error}</p>
                  ) : null}

                  <div className="flex flex-shrink-0 items-end gap-2 border-t px-3 py-3">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      rows={1}
                      placeholder="Type a message..."
                      className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      disabled={!messageInput.trim() || sending}
                      onClick={() => void handleSend()}
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors",
                        messageInput.trim()
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t bg-background">
          <div className="flex">
            {(
              [
                { id: "home", label: "Home", Icon: Home },
                { id: "messages", label: "Messages", Icon: MessageSquare },
              ] as const
            ).map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (id === "messages") openMessagesTab();
                    else setActiveTab("home");
                  }}
                  className={cn(
                    "relative flex flex-1 flex-col items-center gap-1 py-3 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className="relative">
                    <Icon className="h-[22px] w-[22px]" />
                    {id === "messages" && totalUnread > 0 ? (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                        {totalUnread > 9 ? "9+" : totalUnread}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[11px] font-medium">{label}</span>
                  {isActive ? (
                    <div className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default FloatingActionButton;
