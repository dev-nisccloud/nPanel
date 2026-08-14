"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { format } from "date-fns";
import { Bot, CheckCircle, CircleDot, Mail, Phone, Send } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { MessageAttachment } from "@/components/tickets/message-attachment";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  useTicket,
  useTicketMessages,
} from "@/routes/agency/_components/tickets/use-tickets";
import { useTicketMutations } from "@/routes/agency/_components/tickets/use-ticket-mutations";
import type {
  TicketMessage,
  TicketStatus,
} from "@/routes/agency/_components/tickets/schema";

type ChatBubble = {
  id: string;
  type: "agency" | "customer";
  message: string;
  timestamp: Date;
  senderLabel?: string;
  attachments?: NonNullable<TicketMessage["attachments"]>;
};

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function toChatBubbles(
  messages: TicketMessage[],
  currentUserId: string | undefined,
  guestContact?: { name: string; email: string; phone: string | null } | null,
): ChatBubble[] {
  return messages
    .filter((msg) => !msg.deletedAt)
    .map((msg) => {
      const isFromCurrentUser = msg.senderId === currentUserId;
      const isAgencyMessage =
        msg.senderIsAgency === true ||
        (msg.senderIsAgency === undefined && isFromCurrentUser);

      const guestLabel = guestContact
        ? guestContact.email
          ? `${guestContact.name} (${guestContact.email})`
          : guestContact.name
        : null;

      const senderLabel = isAgencyMessage
        ? msg.sender?.name?.trim() ||
          msg.sender?.email ||
          (isFromCurrentUser ? "You" : "Support agent")
        : guestLabel ||
          msg.sender?.name?.trim() ||
          msg.sender?.email ||
          "Customer";

      return {
        id: msg.id,
        type: isAgencyMessage ? ("agency" as const) : ("customer" as const),
        message: msg.content,
        timestamp: msg.createdAt,
        senderLabel,
        attachments: msg.attachments,
      };
    });
}

function ChatBubbleBody({ msg }: { msg: ChatBubble }) {
  const isAgency = msg.type === "agency";

  return (
    <div
      className={cn(
        "max-w-[85%] space-y-2 rounded-2xl px-4 py-2.5 sm:max-w-[75%]",
        isAgency
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground",
      )}
    >
      {msg.senderLabel && (
        <p
          className={cn(
            "text-xs font-semibold leading-tight",
            isAgency ? "text-primary-foreground/85" : "text-muted-foreground",
          )}
        >
          {msg.senderLabel}
        </p>
      )}

      {msg.attachments && msg.attachments.length > 0 && (
        <div className="space-y-2">
          {msg.attachments.map((attachment) => (
            <MessageAttachment
              key={attachment.id}
              attachment={attachment}
              isUserMessage={isAgency}
            />
          ))}
        </div>
      )}

      {msg.message && (
        <p className="whitespace-pre-line text-sm leading-relaxed">
          {msg.message}
        </p>
      )}

      <p
        className={cn(
          "text-[10px]",
          isAgency ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        {format(msg.timestamp, "MMM d, h:mm a")}
      </p>
    </div>
  );
}

type TicketChatSheetProps = {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TicketChatSheet({
  ticketId,
  open,
  onOpenChange,
}: TicketChatSheetProps) {
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const [draft, setDraft] = React.useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const markedReadRef = React.useRef<string | null>(null);

  const { ticket, isLoading: isTicketLoading } = useTicket(
    open ? ticketId : null,
  );
  const {
    messages,
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    error: messagesError,
    refetch: refetchMessages,
  } = useTicketMessages(open ? ticketId : null);

  const {
    createMessage,
    updateStatus,
    markAllTicketMessagesAsRead,
  } = useTicketMutations({ currentUserId });

  const bubbles = React.useMemo(
    () => toChatBubbles(messages, currentUserId, ticket?.guestContact),
    [messages, currentUserId, ticket?.guestContact],
  );

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  React.useEffect(() => {
    if (!open || !ticketId) return;
    const t = window.setTimeout(() => scrollToBottom("auto"), 50);
    return () => window.clearTimeout(t);
  }, [open, ticketId, bubbles.length, scrollToBottom]);

  React.useEffect(() => {
    if (!open || !ticketId) {
      markedReadRef.current = null;
      setDraft("");
      return;
    }
    if (markedReadRef.current === ticketId) return;
    markedReadRef.current = ticketId;
    markAllTicketMessagesAsRead.mutate({ ticketId });
  }, [open, ticketId]);

  const handleSend = async () => {
    if (!ticketId || !draft.trim() || createMessage.isPending) return;

    const content = draft.trim();
    setDraft("");

    try {
      await createMessage.mutateAsync({
        ticketId,
        content,
        isInternal: false,
      });
      captureEvent("support_ticket_replied", { is_agent: true });
      scrollToBottom();
    } catch {
      setDraft(content);
      toast.error("Failed to send message");
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!ticketId) return;
    try {
      await updateStatus.mutateAsync({ ticketId, status });
      toast.success(`Ticket marked as ${formatStatusLabel(status)}`);
      if (status === "CLOSED") captureEvent("support_ticket_closed");
      if (status === "OPEN" || status === "REOPENED") captureEvent("support_ticket_reopened");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const guestContact = ticket?.guestContact;
  const title =
    (guestContact
      ? guestContact.email
        ? `${guestContact.name} (${guestContact.email})`
        : guestContact.name
      : null) ||
    ticket?.createdBy?.name ||
    ticket?.createdBy?.email ||
    ticket?.subject ||
    "Support ticket";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        size="wide"
        side="right"
        className="flex h-full flex-col p-0"
        title={title}
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="shrink-0 space-y-3 border-b px-5 pb-4 pt-5 text-left sm:px-6">
            <div className="flex items-start justify-between gap-3 pr-8">
              <div className="min-w-0 space-y-1">
                <SheetTitle className="truncate text-base font-semibold">
                  {isTicketLoading ? "Loading..." : title}
                </SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-2 text-xs">
                  {ticket?.ticketNumber && (
                    <span className="font-medium text-foreground">
                      {ticket.ticketNumber}
                    </span>
                  )}
                  {ticket?.subject && (
                    <span className="truncate text-muted-foreground">
                      · {ticket.subject}
                    </span>
                  )}
                  {guestContact ? (
                    <Badge variant="secondary" className="font-normal">
                      Guest
                    </Badge>
                  ) : null}
                  {guestContact?.phone ? (
                    <span className="text-muted-foreground">
                      · {guestContact.phone}
                    </span>
                  ) : null}
                </SheetDescription>
              </div>
            </div>

            {ticket && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {formatStatusLabel(ticket.type)}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {formatStatusLabel(ticket.priority)}
                </Badge>
                <Select
                  value={ticket.status}
                  onValueChange={(v) =>
                    void handleStatusChange(v as TicketStatus)
                  }
                  disabled={updateStatus.isPending}
                >
                  <SelectTrigger className="h-8 w-[150px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "OPEN",
                        "IN_PROGRESS",
                        "WAITING",
                        "RESOLVED",
                        "CLOSED",
                        "CANCELLED",
                      ] as TicketStatus[]
                    ).map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="ml-auto flex items-center gap-1.5">
                  {ticket.status !== "OPEN" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => void handleStatusChange("OPEN")}
                      disabled={updateStatus.isPending}
                    >
                      <CircleDot className="h-3.5 w-3.5" />
                      Reopen
                    </Button>
                  )}
                  {ticket.status !== "CLOSED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => void handleStatusChange("CLOSED")}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Close
                    </Button>
                  )}
                </div>
              </div>
            )}
          </SheetHeader>

          {ticket?.metadata &&
            typeof ticket.metadata === "object" &&
            !Array.isArray(ticket.metadata) &&
            (ticket.metadata as Record<string, unknown>).openedBy === "zeepo_ai" && (
              <div className="shrink-0 border-b bg-blue-50 px-4 py-3 dark:bg-blue-950/30 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        AI-Generated Ticket
                      </p>
                      <Badge variant="outline" className="border-blue-300 bg-blue-100 text-[10px] text-blue-700 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {(ticket.metadata as Record<string, unknown>).sourceSurface === "support_fab"
                          ? "From Live AI Support"
                          : "From Zeepo AI"}
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-200">
                      This ticket was created automatically by AI based on the customer's chat conversation. 
                      It's informational only — reply directly to the customer using their contact details below.
                    </p>
                    {guestContact || (ticket.metadata as Record<string, unknown>).callbackPhone ? (
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {guestContact?.email && (
                          <a
                            href={`mailto:${guestContact.email}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {guestContact.email}
                          </a>
                        )}
                        {(guestContact?.phone || (ticket.metadata as Record<string, unknown>).callbackPhone) && (
                          <a
                            href={`tel:${guestContact?.phone || (ticket.metadata as Record<string, unknown>).callbackPhone}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {guestContact?.phone || (ticket.metadata as Record<string, unknown>).callbackPhone}
                          </a>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
            {isMessagesLoading && bubbles.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <Spinner size={28} />
              </div>
            ) : isMessagesError ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm font-medium">Failed to load messages</p>
                <p className="text-xs text-muted-foreground">
                  {messagesError?.message || "Please try again."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refetchMessages()}
                >
                  Try again
                </Button>
              </div>
            ) : bubbles.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-sm font-medium">No messages yet</p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Send a reply below to start the conversation with the
                  customer.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bubbles.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-end gap-2",
                      msg.type === "agency" ? "justify-end" : "justify-start",
                    )}
                  >
                    {msg.type === "customer" && (
                      <div className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                        {(msg.senderLabel || "C").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <ChatBubbleBody msg={msg} />
                  </div>
                ))}
                {createMessage.isPending && (
                  <div className="flex justify-end">
                    <div className="rounded-2xl bg-primary/20 px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="shrink-0 border-t bg-background p-4 sm:px-6">
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a reply… (Enter to send, Shift+Enter for new line)"
                className="min-h-[44px] max-h-36 flex-1 resize-none"
                rows={2}
                disabled={!ticketId || createMessage.isPending}
              />
              <Button
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={() => void handleSend()}
                disabled={!draft.trim() || !ticketId || createMessage.isPending}
                title="Send"
              >
                {createMessage.isPending ? (
                  <Spinner size={16} />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-2 flex justify-end sm:hidden">
              <SheetClose asChild>
                <Button variant="ghost" size="sm">
                  Close
                </Button>
              </SheetClose>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
