"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router";
import {
  X,
  MessageCircle,
  RotateCw,
  ArrowLeft,
  Send,
  MoreVertical,
  CheckCircle,
  Circle,
  Sparkles,
  Trash2,
  ChevronRight,
  Search,
  MessageSquare,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTicketsList, useTicketMessages } from "./tickets/use-tickets";
import { useTicketMutations } from "./tickets/use-ticket-mutations";
import type { TicketMessage, TicketStatus } from "./tickets/schema";
import { authClient } from "@/lib/auth-client";
import { MessageAttachment } from "@/components/tickets/message-attachment";
import { useAppFileUpload } from "@/hooks/use-app-file-upload";
import { mapStorageResultToTicketAttachment, uploadErrorMessage } from "@/lib/app-file-upload";
import { STORAGE_PREFIXES } from "@/lib/storage-prefixes";
import { UploadProgressRing } from "@/components/upload-progress-ring";
import { toast } from "@/components/ui/sonner";
import { NotificationSettingsBanner } from "@/components/notification-settings-banner";
import { useNewMessageDetector } from "@/hooks/use-new-message-detector";
import { useGlobalNotificationDetector } from "@/hooks/use-global-notification-detector";
import { useAiHistory, useAiChat, useAiMutations } from "@/hooks/use-ai";
import { AiMarkdownRenderer } from "@/components/ai/ai-markdown-renderer";
import { helpCollections, type HelpCollection, type HelpArticle } from "@/lib/help-docs";

interface FloatingActionButtonProps {
  className?: string;
}

function isTicketOpenStatus(status: TicketStatus): boolean {
  return status === "OPEN" || status === "IN_PROGRESS" || status === "WAITING";
}

function isTicketClosedStatus(status: TicketStatus): boolean {
  return status === "CLOSED" || status === "RESOLVED" || status === "CANCELLED";
}

function getTicketStatusBadgeClass(status: TicketStatus): string {
  if (isTicketClosedStatus(status)) {
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
}

function getTicketStatusLabel(status: TicketStatus): string {
  if (isTicketClosedStatus(status)) return "Closed";
  if (status === "OPEN") return "Open";
  return status.replace("_", " ").toLowerCase();
}

function TicketStatusActionsMenu({
  ticketId,
  status,
  onMarkOpen,
  onMarkClosed,
  stopPropagation = false,
}: {
  ticketId: string;
  status: TicketStatus | undefined;
  onMarkOpen: (id: string) => void;
  onMarkClosed: (id: string) => void;
  stopPropagation?: boolean;
}) {
  const openDisabled = status ? isTicketOpenStatus(status) : false;
  const closedDisabled = status ? isTicketClosedStatus(status) : false;

  return (
    <>
      <DropdownMenuItem
        disabled={openDisabled}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          onMarkOpen(ticketId);
        }}
        className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 data-[disabled]:opacity-50"
      >
        <Circle className="mr-2 h-4 w-4 text-emerald-600" />
        Mark as Open
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled={closedDisabled}
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          onMarkClosed(ticketId);
        }}
        className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30 data-[disabled]:opacity-50"
      >
        <CheckCircle className="mr-2 h-4 w-4 text-red-600" />
        Mark as Closed
      </DropdownMenuItem>
    </>
  );
}

type ChatMessageAttachment = {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
};

type ChatMessage =
  | {
      id: string;
      type: "assistant";
      message: string;
      timestamp: Date;
      attachments?: ChatMessageAttachment[];
      senderLabel?: string;
    }
  | {
      id: string;
      type: "user";
      message: string;
      timestamp: Date;
      attachments?: ChatMessageAttachment[];
      senderLabel?: string;
    };

function resolveTicketSenderLabel(
  msg: TicketMessage,
  opts: {
    isAgency: boolean;
    isFromCurrentUser: boolean;
    currentUserName?: string | null;
    currentUserEmail?: string | null;
  },
): string | undefined {
  if (!opts.isAgency) return undefined;

  const isAgencyMessage =
    msg.senderIsAgency === true ||
    (msg.senderIsAgency === undefined && opts.isFromCurrentUser);

  if (!isAgencyMessage) return undefined;

  const fromSender = msg.sender?.name?.trim() || msg.sender?.email;
  if (fromSender) return fromSender;

  if (opts.isFromCurrentUser) {
    return opts.currentUserName?.trim() || opts.currentUserEmail || "You";
  }

  return "Support agent";
}

function TicketChatBubbleBody({ msg }: { msg: ChatMessage }) {
  return (
    <div
      className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2.5 space-y-2",
        msg.type === "user"
          ? "bg-primary text-primary-foreground"
          : "bg-primary/10 text-foreground",
      )}
    >
      {msg.senderLabel && (
        <p
          className={cn(
            "text-xs font-semibold leading-tight",
            msg.type === "user" ? "text-primary-foreground/85" : "text-foreground/70",
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
              isUserMessage={msg.type === "user"}
            />
          ))}
        </div>
      )}

      {msg.message && (
        <p className="text-sm leading-relaxed whitespace-pre-line">{msg.message}</p>
      )}
    </div>
  );
}

const initialGreetingMessage: ChatMessage = {
  id: "greeting",
  type: "assistant",
  message:
    "👋 How can we help you today?\nPlease describe the issue in detail. Include details about what you're seeing, any service specific details, serviceIDs, custom domains, log output etc",
  timestamp: new Date(),
};

type ActiveTab = "home" | "messages" | "help";
type MessagesSubView = "list" | "chat" | "zepo-history" | "zepo";
type HelpSubView = "collections" | "collection-detail" | "article-detail";

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const navigate = useNavigate();
  const params = useParams<{ slug?: string }>();

  // Tab state
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("home");
  const [messagesSubView, setMessagesSubView] = React.useState<MessagesSubView>("list");
  const [helpSubView, setHelpSubView] = React.useState<HelpSubView>("collections");

  // Messages state
  const [messageInput, setMessageInput] = React.useState("");
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null);
  const [selectedAiChatId, setSelectedAiChatId] = React.useState<string | null>(null);
  const [isNewTicket, setIsNewTicket] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [loadingChatId, setLoadingChatId] = React.useState<string | null>(null);
  const [deletingAiChatId, setDeletingAiChatId] = React.useState<string | null>(null);
  const [optimisticAiMessages, setOptimisticAiMessages] = React.useState<ChatMessage[]>([]);
  const [thinkingMessageIndex, setThinkingMessageIndex] = React.useState(0);
  const [locallyReadIds, setLocallyReadIds] = React.useState<Set<string>>(new Set());

  // Help state
  const [helpSearch, setHelpSearch] = React.useState("");
  const [selectedCollection, setSelectedCollection] = React.useState<HelpCollection | null>(null);
  const [selectedArticle, setSelectedArticle] = React.useState<HelpArticle | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const aiMessagesEndRef = React.useRef<HTMLDivElement>(null);
  const humanMessagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = React.useCallback((type: "ai" | "human" = "ai") => {
    const ref = type === "ai" ? aiMessagesEndRef : humanMessagesEndRef;
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, []);

  // Auth
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;
  const currentUserName = session?.user?.name;
  const currentUserEmail = session?.user?.email;
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAgency =
    userRole === "AGENCY_USER" ||
    userRole === "AGENCY_ADMIN" ||
    userRole === "AGENCY_SUPER_ADMIN";

  // Data hooks
  const {
    tickets,
    isLoading: isLoadingTickets,
    isRefetching: isRefetchingTickets,
    isError: isErrorTickets,
    error: ticketsError,
    refetch: refetchTickets,
  } = useTicketsList();

  const shouldFetchMessages = !isNewTicket && !!selectedChatId;
  const {
    messages,
    isLoading: isLoadingMessages,
    isError: isErrorMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useTicketMessages(shouldFetchMessages ? selectedChatId : null);

  const { createTicket, createMessage, updateStatus, markAllTicketMessagesAsRead } =
    useTicketMutations({ currentUserId });

  const {
    uploadBatch,
    isUploading: isUploadingFiles,
    progressPercent: uploadProgressPercent,
  } = useAppFileUpload();

  const {
    history: aiHistory,
    isLoading: isLoadingAiHistory,
    isRefetching: isRefetchingAiHistory,
    refetch: refetchAiHistory,
  } = useAiHistory();

  const {
    messages: aiMessagesData,
    isLoading: isLoadingAiMessages,
    isError: isErrorAiMessages,
    error: aiMessagesError,
  } = useAiChat(selectedAiChatId === "new" ? null : selectedAiChatId);

  const {
    startChat: startAiChat,
    sendMessage: sendAiMessage,
    escalateChat: directEscalateChat,
    deleteChat: deleteAiChat,
  } = useAiMutations();

  // New message handler
  const handleNewMessage = React.useCallback(() => {
    if (selectedChatId) {
      markAllTicketMessagesAsRead.mutate({ ticketId: selectedChatId });
    }
  }, [selectedChatId, markAllTicketMessagesAsRead]);

  const isChatOpen =
    isOpen && activeTab === "messages" && messagesSubView === "chat";
  useNewMessageDetector(messages, currentUserId, selectedChatId, isChatOpen, handleNewMessage);
  useGlobalNotificationDetector(tickets, selectedChatId);

  // Transform messages
  const chatMessages: ChatMessage[] = React.useMemo(() => {
    if (isNewTicket) return [initialGreetingMessage];
    if (messages && messages.length > 0) {
      return messages.map((msg) => {
        const isFromCurrentUser = msg.senderId === currentUserId;
        return {
          id: msg.id,
          type: isFromCurrentUser ? "user" : "assistant",
          message: msg.content,
          timestamp: msg.createdAt,
          senderLabel: resolveTicketSenderLabel(msg, {
            isAgency,
            isFromCurrentUser,
            currentUserName,
            currentUserEmail,
          }),
          attachments: msg.attachments?.map((att) => ({
            id: att.id,
            fileName: att.fileName,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            fileUrl: att.fileUrl,
          })),
        };
      });
    }
    return [initialGreetingMessage];
  }, [messages, isNewTicket, currentUserId, isAgency, currentUserName, currentUserEmail]);

  const transformedAiMessages: ChatMessage[] = React.useMemo(() => {
    let baseMessages: ChatMessage[] = [];
    if (aiMessagesData && aiMessagesData.length > 0) {
      baseMessages = aiMessagesData
        .filter((msg) => msg.role === "user" || (msg.role === "assistant" && msg.content))
        .map((msg) => ({
          id: msg.id,
          type: (msg.role === "user" ? "user" : "assistant") as "user" | "assistant",
          message: msg.content || "",
          timestamp: new Date(msg.createdAt),
        })) as ChatMessage[];
    }
    const filteredOptimistic = optimisticAiMessages.filter(
      (om) => !baseMessages.find((bm) => bm.message === om.message && bm.type === om.type),
    );
    return [...baseMessages, ...filteredOptimistic];
  }, [aiMessagesData, selectedAiChatId, optimisticAiMessages]);

  React.useEffect(() => {
    if (aiMessagesData && aiMessagesData.length > 0) {
      setOptimisticAiMessages([]);
    }
  }, [aiMessagesData]);

  React.useEffect(() => {
    if (messagesSubView === "zepo") {
      scrollToBottom("ai");
      const timer = setTimeout(() => scrollToBottom("ai"), 100);
      return () => clearTimeout(timer);
    }
  }, [transformedAiMessages, optimisticAiMessages, isSending, messagesSubView, scrollToBottom]);

  React.useEffect(() => {
    if (messagesSubView === "chat") {
      scrollToBottom("human");
      const timer = setTimeout(() => scrollToBottom("human"), 100);
      return () => clearTimeout(timer);
    }
  }, [chatMessages, isSending, messagesSubView, scrollToBottom]);

  React.useEffect(() => {
    if (!isSending) {
      setThinkingMessageIndex(0);
      return;
    }
    const thinkingMessages = [
      "Zepo is thinking...",
      "Searching for answers...",
      "Analyzing your request...",
      "Generating response...",
    ];
    const timer = setInterval(() => {
      setThinkingMessageIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [isSending]);

  // Reset on close
  React.useEffect(() => {
    if (!isOpen) {
      setActiveTab("home");
      setMessagesSubView("list");
      setHelpSubView("collections");
      setMessageInput("");
      setSelectedFiles([]);
      setSelectedChatId(null);
      setSelectedAiChatId(null);
      setIsNewTicket(false);
      setSelectedCollection(null);
      setSelectedArticle(null);
      setHelpSearch("");
    }
  }, [isOpen]);

  // Handlers
  const handleChatWithHuman = (ticketId?: string) => {
    if (ticketId && ticketId !== "new") {
      setSelectedChatId(ticketId);
      setIsNewTicket(false);
      setLocallyReadIds((prev) => new Set(prev).add(ticketId));
      markAllTicketMessagesAsRead.mutate({ ticketId });
    } else {
      setIsNewTicket(true);
      setSelectedChatId(null);
    }
    setMessagesSubView("chat");
  };

  const handleZepoChat = () => {
    setIsOpen(false);
    const role = (session?.user as { role?: string } | undefined)?.role;
    const isAgencyRole =
      role === "AGENCY_USER" || role === "AGENCY_ADMIN" || role === "AGENCY_SUPER_ADMIN";
    if (isAgencyRole) {
      navigate("/agency/zeepo-ai-agent");
    } else {
      const slug = params.slug;
      if (slug) navigate(`/${slug}/zeepo-ai-agent`);
    }
  };

  const handleStartNewZepoChat = () => {
    setSelectedAiChatId("new");
    setMessagesSubView("zepo");
  };

  const handleSelectPastZepoChat = (chatId: string) => {
    if (deletingAiChatId === chatId) return;
    setSelectedAiChatId(chatId);
    setMessagesSubView("zepo");
  };

  const handleDeleteAiChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (deletingAiChatId) return;
    try {
      setDeletingAiChatId(chatId);
      await deleteAiChat.mutateAsync({ id: chatId });
    } catch (error) {
      console.error("Failed to delete AI chat:", error);
    } finally {
      setDeletingAiChatId(null);
    }
  };

  const handleEscalateToHuman = async () => {
    if (!selectedAiChatId) return;
    try {
      setIsSending(true);
      await directEscalateChat.mutateAsync({
        chatId: selectedAiChatId,
        reason: "User requested human agent via button.",
      });
      setMessagesSubView("list");
      refetchTickets();
    } catch (error) {
      console.error("Escalation failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateInput: Date | string) => {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const handleMarkAsOpen = async (chatId: string) => {
    try {
      await updateStatus.mutateAsync({ ticketId: chatId, status: "OPEN" });
    } catch (error) {
      console.error("Failed to mark ticket as open:", error);
    }
  };

  const handleMarkAsClosed = async (chatId: string) => {
    try {
      await updateStatus.mutateAsync({ ticketId: chatId, status: "CLOSED" });
    } catch (error) {
      console.error("Failed to mark ticket as closed:", error);
    }
  };

  const selectedTicket = selectedChatId
    ? tickets.find((t) => t.id === selectedChatId)
    : undefined;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    const oversizedFiles: File[] = [];
    const validFiles: File[] = [];
    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) oversizedFiles.push(file);
      else validFiles.push(file);
    });
    if (oversizedFiles.length > 0) {
      toast.error(`${oversizedFiles.length} file(s) exceed the 50MB limit.`, {
        description: oversizedFiles.map((f) => f.name).join(", "),
      });
    }
    if (validFiles.length > 0) setSelectedFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentClick = () => fileInputRef.current?.click();

  const handleSendMessage = async () => {
    if (isSending || (!messageInput.trim() && selectedFiles.length === 0)) return;

    if (messagesSubView === "zepo") {
      if (!messageInput.trim() || !selectedAiChatId) return;
      setIsSending(true);
      try {
        const input = messageInput;
        setMessageInput("");
        const userMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          type: "user",
          message: input,
          timestamp: new Date(),
        };
        setOptimisticAiMessages((prev) => [...prev, userMessage]);
        if (selectedAiChatId === "new") {
          const newChat = await startAiChat.mutateAsync({ initialMessage: input });
          setSelectedAiChatId(newChat.id);
        } else {
          await sendAiMessage.mutateAsync({ chatId: selectedAiChatId, content: input });
        }
      } catch (error) {
        console.error("Failed to send AI message:", error);
        toast.error("Failed to send message to Zepo.");
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Human chat
    if (!messageInput.trim() && selectedFiles.length === 0) return;
    setIsSending(true);
    try {
      let ticketId = selectedChatId;
      let attachments: Array<{
        fileName: string;
        fileSize: number;
        mimeType: string;
        fileUrl: string;
        storageKey?: string;
      }> = [];

      if (selectedFiles.length > 0) {
        try {
          const uploadResponse = await uploadBatch(selectedFiles, STORAGE_PREFIXES.FILES);
          attachments = uploadResponse.map((file, index) =>
            mapStorageResultToTicketAttachment(file, selectedFiles[index]!),
          );
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          toast.error(uploadErrorMessage(uploadError));
          return;
        }
      }

      if (isNewTicket || !ticketId) {
        const newTicket = await createTicket.mutateAsync({
          subject: messageInput.substring(0, 100) || undefined,
          description: messageInput,
          type: "GENERAL",
          priority: "NORMAL",
          source: "CHAT",
        });
        ticketId = newTicket.id;
        setSelectedChatId(ticketId);
        setIsNewTicket(false);
        await createMessage.mutateAsync({
          ticketId,
          content: messageInput || (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : ""),
          isInternal: false,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        await refetchMessages();
      } else {
        await createMessage.mutateAsync({
          ticketId,
          content: messageInput || (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : ""),
          isInternal: false,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
      }
      setMessageInput("");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send message. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  };

  // Total unread count for notification badge on FAB
  const totalUnread = tickets.reduce((acc, t) => {
    const effective = locallyReadIds.has(t.id) ? 0 : t.unreadCount;
    return acc + effective;
  }, 0);

  // Help docs filtering
  const filteredCollections = React.useMemo(() => {
    if (!helpSearch.trim()) return helpCollections;
    const q = helpSearch.toLowerCase();
    return helpCollections
      .map((col) => ({
        ...col,
        articles: col.articles.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.summary.toLowerCase().includes(q) ||
            a.tags?.some((t) => t.includes(q)),
        ),
      }))
      .filter((col) => col.articles.length > 0 || col.title.toLowerCase().includes(q));
  }, [helpSearch]);

  // Sub-view in messages requiring full height (no show tabs change layout)
  const isInSubView =
    activeTab === "messages" && messagesSubView !== "list";

  const thinkingMessages = [
    "Zepo is thinking...",
    "Searching for answers...",
    "Analyzing your request...",
    "Generating response...",
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
      {/* ── FAB Trigger ── */}
      <PopoverTrigger asChild>
        <button
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "flex h-14 w-14 items-center justify-center rounded-full",
            "bg-primary shadow-lg hover:shadow-xl hover:scale-105",
            "transition-all duration-200 active:scale-95",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            className,
          )}
          aria-label="Open support"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
          ) : (
            <MessageCircle className="h-6 w-6 text-primary-foreground" strokeWidth={2} />
          )}
          {/* Unread badge */}
          {!isOpen && totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      {/* ── Popup ── */}
      <PopoverContent
        align="end"
        side="top"
        sideOffset={16}
        className={cn(
          "w-[360px] p-0 rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-background",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=top]:slide-in-from-bottom-4",
          "h-[580px] flex flex-col",
        )}
      >
        {/* ── Content area (scrollable per tab) ── */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

          {/* ═══════════════════════════════════════
              HOME TAB
          ═══════════════════════════════════════ */}
          {activeTab === "home" && (
            <div className="flex flex-col h-full relative overflow-hidden">
              {/* Fading green gradient  solid at top, fades to transparent */}
              <div
                className="absolute inset-x-0 top-0 pointer-events-none"
                style={{
                  height: "52%",
                  background: "linear-gradient(to bottom, var(--primary) 55%, transparent 100%)",
                }}
              />

              {/* Top bar: logo + close */}
              <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-0 flex-shrink-0">
                <img
                  src="/nisclogooriginal.png"
                  alt="Nisc Cloud"
                  className="h-12 w-auto brightness-0 invert"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Greeting text */}
              <div className="relative z-10 px-5 pt-5 pb-8 flex-shrink-0">
                <h2 className="text-[1.65rem] font-bold text-white leading-tight tracking-tight">
                  Hi there 👋
                </h2>
                <p className="text-[1.35rem] font-semibold text-white/90 mt-0.5 leading-snug">
                  How can we help?
                </p>
              </div>

              {/* Scrollable cards  sit on top of the fading gradient */}
              <div className="relative z-10 flex-1 min-h-0 overflow-y-auto">
                <div className="px-4 pb-4 space-y-2.5">

                  {/* Recent message card */}
                  <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-md border border-border/60">
                    <div className="px-4 py-3 border-b border-border/60">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Recent message
                      </p>
                    </div>
                    {tickets.length > 0 ? (() => {
                      const latest = tickets[0];
                      const effectiveUnread = locallyReadIds.has(latest.id) ? 0 : latest.unreadCount;
                      return (
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
                          onClick={() => {
                            setActiveTab("messages");
                            handleChatWithHuman(latest.id);
                          }}
                        >
                          {/* Brand icon square  like DigiTax */}
                          <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-foreground">N</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground line-clamp-1">
                                {latest.subject || "Nisc Cloud Support"}
                              </p>
                              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                {latest.lastMessageAt ? formatTime(latest.lastMessageAt) : ""}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {latest.lastMessage || "You'll get replies here and in your email..."}
                            </p>
                          </div>
                          {effectiveUnread > 0 && (
                            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                              {effectiveUnread}
                            </span>
                          )}
                        </button>
                      );
                    })() : (
                      <div className="px-4 py-3.5 flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-foreground">N</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You'll get replies here and in your email...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Contact us */}
                  <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-md border border-border/60">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors"
                      onClick={() => {
                        setActiveTab("messages");
                        handleChatWithHuman("new");
                      }}
                    >
                      <span className="text-sm font-medium text-foreground">Contact us</span>
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </button>
                  </div>

                  {/* External links */}
                  <div className="bg-white dark:bg-card rounded-2xl overflow-hidden shadow-md border border-border/60 divide-y divide-border/60">
                    <a
                      href="https://docs.nisccloud.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground">Nisc Cloud Docs</span>
                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                    </a>
                    <button
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/40 transition-colors"
                      onClick={() => setActiveTab("help")}
                    >
                      <span className="text-sm font-medium text-foreground">Support Centre</span>
                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                    </button>
                  </div>

                  {/* Search for help */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white dark:bg-card rounded-2xl shadow-md border border-border/60 hover:bg-muted/40 transition-colors"
                    onClick={() => setActiveTab("help")}
                  >
                    <span className="text-sm font-medium text-foreground">Search for help</span>
                    <Search className="h-4 w-4 text-primary" />
                  </button>

                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════
              MESSAGES TAB
          ═══════════════════════════════════════ */}
          {activeTab === "messages" && (
            <div className="flex flex-col h-full">
              {/* ── Ticket List ── */}
              {messagesSubView === "list" && (
                <>
                  <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b flex-shrink-0">
                    <h2 className="text-base font-semibold text-foreground">Messages</h2>
                    <div className="flex items-center gap-1">
                      {!isAgency && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => handleChatWithHuman("new")}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          New
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-accent"
                        onClick={() => refetchTickets()}
                        disabled={isRefetchingTickets}
                      >
                        {isRefetchingTickets ? (
                          <Spinner size={14} />
                        ) : (
                          <RotateCw className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-accent"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    <NotificationSettingsBanner />

                    {isLoadingTickets ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <Spinner size={28} className="mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Loading messages...</p>
                        </div>
                      </div>
                    ) : isErrorTickets ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <h3 className="mb-2 text-base font-semibold">Failed to load</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                          {ticketsError?.message || "An error occurred."}
                        </p>
                        <Button onClick={() => refetchTickets()} variant="outline" size="sm">
                          Try Again
                        </Button>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="mb-4 p-4 bg-muted/50 rounded-full w-fit mx-auto">
                          <Icons.LiveChat className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="mb-1 text-base font-semibold">No messages yet</h3>
                        {!isAgency && (
                          <p className="mb-5 text-sm text-muted-foreground max-w-[220px]">
                            Start a conversation with our support team.
                          </p>
                        )}
                        {!isAgency && (
                          <Button
                            onClick={() => handleChatWithHuman("new")}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
                          >
                            Contact us
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {tickets.map((ticket) => {
                          const effectiveUnread = locallyReadIds.has(ticket.id)
                            ? 0
                            : ticket.unreadCount;
                          const ticketTitle = isAgency
                            ? ticket.customerName || `Ticket #${ticket.ticketNumber}`
                            : ticket.subject ||
                              ticket.lastMessage?.slice(0, 50) ||
                              `Ticket #${ticket.ticketNumber}`;

                          return (
                            <div
                              key={ticket.id}
                              className="flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors group"
                            >
                              <button
                                onClick={() => handleChatWithHuman(ticket.id)}
                                className="flex-1 flex items-start gap-3 text-left"
                                disabled={loadingChatId === ticket.id}
                              >
                                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                                  <MessageSquare className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-sm text-foreground line-clamp-1 flex-1">
                                      {ticketTitle}
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {loadingChatId === ticket.id && (
                                        <Spinner size={12} className="text-primary" />
                                      )}
                                      {effectiveUnread > 0 && (
                                        <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                                          {effectiveUnread}
                                        </span>
                                      )}
                                      {ticket.lastMessageAt && (
                                        <span className="text-[10px] text-muted-foreground">
                                          {formatTime(ticket.lastMessageAt)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                    {ticket.lastMessage || "No messages yet"}
                                  </p>
                                  <span
                                    className={cn(
                                      "inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded capitalize",
                                      getTicketStatusBadgeClass(ticket.status),
                                    )}
                                  >
                                    {getTicketStatusLabel(ticket.status)}
                                  </span>
                                </div>
                              </button>

                              {isAgency && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <TicketStatusActionsMenu
                                      ticketId={ticket.id}
                                      status={ticket.status}
                                      onMarkOpen={handleMarkAsOpen}
                                      onMarkClosed={handleMarkAsClosed}
                                      stopPropagation
                                    />
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Contact us footer */}
                  {!isAgency && tickets.length > 0 && (
                    <div className="px-4 py-3 border-t flex-shrink-0">
                      <Button
                        onClick={() => handleChatWithHuman("new")}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full gap-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Contact us
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* ── Zepo AI History ── */}
              {messagesSubView === "zepo-history" && (
                <>
                  <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-accent"
                        onClick={() => setMessagesSubView("list")}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <h2 className="text-base font-semibold text-foreground">AI Chat History</h2>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-full hover:bg-accent",
                          (isLoadingAiHistory || isRefetchingAiHistory) && "animate-spin",
                        )}
                        onClick={() => refetchAiHistory()}
                        disabled={isLoadingAiHistory || isRefetchingAiHistory}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-accent"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="px-4 pt-3 pb-3 border-b flex-shrink-0">
                    <Button
                      onClick={handleStartNewZepoChat}
                      disabled={isSending || isLoadingAiHistory}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isSending ? (
                        <Spinner size={16} className="mr-2 border-primary-foreground" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {isSending ? "Starting Chat..." : "Start New Zepo Chat"}
                    </Button>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    {isLoadingAiHistory ? (
                      <div className="flex items-center justify-center py-12">
                        <Spinner size={28} className="mx-auto" />
                      </div>
                    ) : aiHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <p className="text-sm text-muted-foreground">No recent Zepo chats.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {aiHistory.map((chat) => (
                          <div
                            key={chat.id}
                            onClick={() => handleSelectPastZepoChat(chat.id)}
                            className={cn(
                              "w-full px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer relative group flex items-start gap-3",
                              deletingAiChatId === chat.id && "opacity-50 pointer-events-none",
                            )}
                          >
                            <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                              <img
                                src="/zepo.png"
                                alt="Zepo"
                                width={36}
                                height={36}
                                className="h-9 w-9 object-cover"
                              />
                            </div>
                            <div className="flex flex-col gap-1 pr-8 min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-foreground">
                                  {chat.title || "Zepo Chat"}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                  {formatTime(chat.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {chat.lastMessage}
                              </p>
                            </div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={(e) => handleDeleteAiChat(e, chat.id)}
                                      disabled={!!deletingAiChatId}
                                    >
                                      {deletingAiChatId === chat.id ? (
                                        <Spinner size={14} />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete chat history</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </>
              )}

              {/* ── Human Chat ── */}
              {messagesSubView === "chat" && (() => {
                const chatTitle = isNewTicket
                  ? "Nisc Cloud Support"
                  : selectedChatId
                    ? tickets.find((t) => t.id === selectedChatId)?.customerName ||
                      tickets.find((t) => t.id === selectedChatId)?.subject ||
                      "Nisc Cloud Support"
                    : "Nisc Cloud Support";
                const userInitial = (currentUserName || currentUserEmail || "U")
                  .charAt(0)
                  .toUpperCase();

                return (
                  <>
                    {/* ── Chat Header ── */}
                    <div className="flex items-center px-3 pt-3 pb-3 border-b flex-shrink-0">
                      {/* Back */}
                      <button
                        onClick={() => setMessagesSubView("list")}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors flex-shrink-0 mr-1"
                      >
                        <ArrowLeft className="h-4 w-4 text-foreground" />
                      </button>

                      {/* Stacked avatars */}
                      <div className="relative flex-shrink-0 mr-2.5" style={{ width: 40, height: 32 }}>
                        {/* Brand avatar (back) */}
                        <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center border-2 border-background z-0">
                          <span className="text-xs font-bold text-primary-foreground">N</span>
                        </div>
                        {/* User avatar (front) */}
                        <div className="absolute left-4 top-0 h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center z-10">
                          <span className="text-xs font-semibold text-foreground">{userInitial}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <span className="flex-1 text-sm font-semibold text-foreground truncate">
                        {chatTitle}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                        {isAgency && !isNewTicket && selectedChatId && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <TicketStatusActionsMenu
                                ticketId={selectedChatId}
                                status={selectedTicket?.status}
                                onMarkOpen={handleMarkAsOpen}
                                onMarkClosed={handleMarkAsClosed}
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <button
                          onClick={() => setIsOpen(false)}
                          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                        >
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    {/* ── Messages ── */}
                    <ScrollArea className="flex-1 min-h-0">
                      {isLoadingMessages && chatMessages.length <= 1 ? (
                        <div className="p-5 space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={cn(
                                "flex items-end gap-2",
                                i % 2 === 0 ? "justify-end" : "justify-start",
                              )}
                            >
                              {i % 2 !== 0 && (
                                <div className="h-6 w-6 rounded-full bg-muted animate-pulse flex-shrink-0 mb-1" />
                              )}
                              <div
                                className={cn(
                                  "rounded-2xl px-4 py-2.5 animate-pulse",
                                  i % 2 === 0
                                    ? "bg-primary/20 max-w-[80%] w-32"
                                    : "bg-muted max-w-[70%] w-48",
                                )}
                              >
                                <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : isErrorMessages ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                          <h3 className="mb-2 text-base font-semibold">Failed to load</h3>
                          <p className="mb-4 text-sm text-muted-foreground">
                            {messagesError?.message || "An error occurred."}
                          </p>
                          <Button onClick={() => refetchMessages()} variant="outline" size="sm">
                            Try Again
                          </Button>
                        </div>
                      ) : (
                        <div>
                          {/* Greeting banner  customer only */}
                          {!isAgency && (isNewTicket || chatMessages.length <= 1) && (
                            <div className="px-5 pt-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                              Ask us anything, or share your feedback. For quick replies email{" "}
                              <a
                                href="mailto:support@nisccloud.com"
                                className="text-primary hover:underline"
                              >
                                support@nisccloud.com
                              </a>{" "}
                              or call{" "}
                              <a
                                href="tel:+254748777666"
                                className="text-primary hover:underline"
                              >
                                +254748777666
                              </a>
                              .
                            </div>
                          )}

                          <div className="px-4 pt-3 pb-4 space-y-3">
                            {chatMessages
                              .filter((m) => m.id !== "greeting")
                              .map((msg) => (
                                <div
                                  key={msg.id}
                                  className={cn(
                                    "flex items-end gap-2",
                                    msg.type === "user" ? "justify-end" : "justify-start",
                                  )}
                                >
                                  {msg.type === "assistant" && (
                                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mb-0.5">
                                      <span className="text-[10px] font-bold text-primary-foreground">
                                        N
                                      </span>
                                    </div>
                                  )}
                                  <TicketChatBubbleBody msg={msg} />
                                </div>
                              ))}
                            {isSending && (
                              <div className="flex justify-start items-end gap-2">
                                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 animate-pulse">
                                  <span className="text-[10px] font-bold text-primary-foreground">
                                    N
                                  </span>
                                </div>
                                <div className="bg-muted rounded-2xl px-4 py-3">
                                  <div className="flex gap-1 items-center">
                                    <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                                    <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                                  </div>
                                </div>
                              </div>
                            )}
                            <div ref={humanMessagesEndRef} />
                          </div>
                        </div>
                      )}
                    </ScrollArea>

                    {/* ── Input area ── */}
                    <div className="border-t flex-shrink-0">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        multiple
                        accept="image/*,video/*,application/pdf"
                        disabled={isSending}
                      />

                      {/* File previews */}
                      {selectedFiles.length > 0 && (
                        <div className="px-3 pt-2 flex gap-2 flex-wrap items-center">
                          {isUploadingFiles ? (
                            <UploadProgressRing
                              percent={uploadProgressPercent}
                              size={48}
                              strokeWidth={4}
                            />
                          ) : null}
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1 text-xs"
                            >
                              <span className="max-w-[90px] truncate">{file.name}</span>
                              <button
                                onClick={() => handleRemoveFile(index)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Textarea */}
                      <div className="px-4 pt-3 pb-2">
                        <textarea
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Message..."
                          className={cn(
                            "w-full bg-transparent border-0 focus:outline-none resize-none min-h-[20px] max-h-[80px] text-sm text-foreground",
                            "placeholder:text-muted-foreground/60",
                            isSending && "opacity-50 cursor-not-allowed",
                          )}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          rows={1}
                          disabled={isSending}
                        />
                      </div>

                      {/* Icon row */}
                      <div className="flex items-center justify-between px-3 pb-3">
                        <div className="flex items-center">
                          <button
                            onClick={handleAttachmentClick}
                            disabled={isSending}
                            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors disabled:opacity-40"
                            title="Attach file"
                          >
                            <Icons.File size={20} className="text-muted-foreground" />
                          </button>
                        </div>

                        {/* Send button */}
                        <button
                          onClick={handleSendMessage}
                          disabled={
                            (!messageInput.trim() && selectedFiles.length === 0) ||
                            isSending ||
                            isUploadingFiles
                          }
                          className={cn(
                            "h-9 w-9 flex items-center justify-center rounded-full transition-all duration-200",
                            messageInput.trim() || selectedFiles.length > 0
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "bg-muted text-muted-foreground cursor-not-allowed",
                          )}
                        >
                          {isUploadingFiles ? (
                            <UploadProgressRing
                              percent={uploadProgressPercent}
                              size={28}
                              strokeWidth={3}
                              className="gap-0 [&_span]:text-[10px]"
                            />
                          ) : isSending ? (
                            <Spinner size={14} className="text-primary-foreground" />
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2.5}>
                              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* ── Zepo Chat ── */}
              {messagesSubView === "zepo" && (
                <>
                  <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-accent"
                        onClick={() => setMessagesSubView("zepo-history")}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <img
                        src="/nisclogooriginal.png"
                        alt="Nisc Cloud"
                        className="h-6 w-auto"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={handleEscalateToHuman}
                        disabled={isSending}
                      >
                        Speak to human
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-accent"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 min-h-0" viewportClassName="p-4">
                    {isLoadingAiMessages &&
                    transformedAiMessages.length === 0 &&
                    optimisticAiMessages.length === 0 ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex items-end gap-2",
                              i % 2 === 0 ? "justify-end" : "justify-start",
                            )}
                          >
                            {i % 2 !== 0 && (
                              <div className="h-6 w-6 rounded-full bg-muted animate-pulse flex-shrink-0 mb-1" />
                            )}
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2.5 space-y-2 animate-pulse",
                                i % 2 === 0
                                  ? "bg-primary/20 max-w-[80%] w-32"
                                  : "bg-muted max-w-[70%] w-48",
                              )}
                            >
                              <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                              {i === 2 && (
                                <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : isErrorAiMessages ? (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                        <h3 className="mb-2 text-lg font-semibold">Failed to load messages</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                          {aiMessagesError?.message || "An error occurred."}
                        </p>
                        <Button onClick={() => refetchAiHistory()} variant="outline" size="sm">
                          Try Again
                        </Button>
                      </div>
                    ) : transformedAiMessages.length === 0 &&
                      optimisticAiMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-12 text-center animate-in fade-in duration-500">
                        <div className="mb-3 flex justify-center">
                          <img
                            src="/zepo.png"
                            alt="Zepo"
                            width={120}
                            height={120}
                            className="h-28 w-28 object-contain"
                          />
                        </div>
                        <h3 className="text-2xl font-bold text-primary mb-2">Hi! I'm Zepo</h3>
                        <p className="text-muted-foreground max-w-[240px] leading-relaxed mb-8">
                          Your AI support assistant. I can help you with services, account
                          questions, and more!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {transformedAiMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex items-end gap-2",
                              msg.type === "user" ? "justify-end" : "justify-start",
                            )}
                          >
                            {msg.type === "assistant" && (
                              <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0 mb-1 bg-muted">
                                <img
                                  src="/zepo.png"
                                  alt="Zepo"
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 object-cover"
                                />
                              </div>
                            )}
                            <div
                              className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-2.5",
                                msg.type === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-primary/10 text-foreground",
                              )}
                            >
                              <AiMarkdownRenderer content={msg.message} />
                            </div>
                          </div>
                        ))}
                        {isSending && (
                          <div className="flex justify-start gap-2">
                            <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0 animate-pulse bg-muted">
                              <img
                                src="/zepo.png"
                                alt="Zepo"
                                width={24}
                                height={24}
                                className="h-6 w-6 object-cover"
                              />
                            </div>
                            <div className="bg-primary/5 rounded-xl px-4 py-2 border border-primary/10 overflow-hidden relative">
                              <p className="text-xs text-muted-foreground">
                                {thinkingMessages[thinkingMessageIndex]}
                              </p>
                              <div className="flex gap-1 mt-1.5">
                                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0ms]" />
                                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:150ms]" />
                                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:300ms]" />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={aiMessagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  <div className="px-3 py-3 border-t flex items-end gap-2 flex-shrink-0">
                    <div className="flex-1">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={isSending ? "Zepo is responding..." : "Ask Zepo anything..."}
                        className={cn(
                          "w-full bg-muted/50 border-0 rounded-xl px-3 py-2 focus:ring-0 resize-none min-h-[36px] max-h-[100px] text-sm",
                          "placeholder:text-muted-foreground/50",
                          isSending && "opacity-50 cursor-not-allowed",
                        )}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={1}
                        disabled={isSending}
                      />
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || isSending}
                      className={cn(
                        "h-9 w-9 rounded-full flex-shrink-0",
                        messageInput.trim() ? "bg-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isSending ? (
                        <Spinner size={14} className="text-primary-foreground" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════
              HELP TAB
          ═══════════════════════════════════════ */}
          {activeTab === "help" && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b flex-shrink-0">
                <div className="flex items-center gap-2">
                  {(helpSubView === "collection-detail" || helpSubView === "article-detail") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-accent"
                      onClick={() => {
                        if (helpSubView === "article-detail") {
                          setHelpSubView("collection-detail");
                          setSelectedArticle(null);
                        } else {
                          setHelpSubView("collections");
                          setSelectedCollection(null);
                        }
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <h2 className="text-base font-semibold text-foreground">
                    {helpSubView === "collections" && "Help"}
                    {helpSubView === "collection-detail" && (selectedCollection?.title ?? "Articles")}
                    {helpSubView === "article-detail" && (selectedArticle?.title ?? "Article")}
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Collections list */}
              {helpSubView === "collections" && (
                <>
                  {/* Search */}
                  <div className="px-4 py-3 border-b flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search for help"
                        value={helpSearch}
                        onChange={(e) => setHelpSearch(e.target.value)}
                        className="w-full bg-muted/50 rounded-lg pl-9 pr-3 py-2 text-sm border-0 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      {helpSearch && (
                        <button
                          onClick={() => setHelpSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  <ScrollArea className="flex-1 min-h-0">
                    <div className="px-4 py-3">
                      {helpSearch && (
                        <p className="text-xs text-muted-foreground mb-3">
                          {filteredCollections.reduce((acc, c) => acc + c.articles.length, 0)}{" "}
                          result{filteredCollections.reduce((acc, c) => acc + c.articles.length, 0) !== 1 ? "s" : ""} found
                        </p>
                      )}
                      {!helpSearch && (
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                          {helpCollections.length} collections
                        </p>
                      )}

                      <div className="space-y-2">
                        {filteredCollections.map((collection) => (
                          <button
                            key={collection.id}
                            className="w-full flex items-center gap-3 px-4 py-3.5 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors text-left"
                            onClick={() => {
                              setSelectedCollection(collection);
                              setHelpSubView("collection-detail");
                            }}
                          >
                            <span className="text-xl flex-shrink-0">{collection.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">
                                {collection.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {collection.description}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {collection.articles.length} article
                                {collection.articles.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </button>
                        ))}
                      </div>

                      {filteredCollections.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
                          <p className="text-sm font-medium text-foreground mb-1">No results found</p>
                          <p className="text-xs text-muted-foreground">
                            Try different keywords or browse all collections.
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 text-primary"
                            onClick={() => setHelpSearch("")}
                          >
                            Clear search
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}

              {/* Collection detail  articles list */}
              {helpSubView === "collection-detail" && selectedCollection && (
                <ScrollArea className="flex-1 min-h-0">
                  <div className="px-4 py-4 space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">
                      {selectedCollection.description}
                    </p>
                    {(helpSearch
                      ? selectedCollection.articles.filter(
                          (a) =>
                            a.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
                            a.summary.toLowerCase().includes(helpSearch.toLowerCase()),
                        )
                      : selectedCollection.articles
                    ).map((article) => (
                      <button
                        key={article.id}
                        className="w-full flex items-start gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          setSelectedArticle(article);
                          setHelpSubView("article-detail");
                        }}
                      >
                        <BookOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{article.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {article.summary}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Article detail */}
              {helpSubView === "article-detail" && selectedArticle && (
                <ScrollArea className="flex-1 min-h-0">
                  <div className="px-4 py-4">
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {selectedArticle.summary}
                    </p>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                        {selectedArticle.content}
                      </p>
                    </div>
                    {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-5">
                        {selectedArticle.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-6 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-2 text-center">
                        Didn't find what you were looking for?
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full rounded-full"
                        onClick={() => {
                          setActiveTab("messages");
                          setMessagesSubView("list");
                          handleChatWithHuman("new");
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex-shrink-0 border-t bg-background">
          <div className="flex">
            {          (
              [
                { id: "home", label: "Home", Icon: Icons.Home },
                { id: "messages", label: "Messages", Icon: Icons.LiveChat },
                { id: "help", label: "Help", Icon: Icons.Help },
              ] as { id: ActiveTab; label: string; Icon: React.ComponentType<{ className?: string; size?: number }> }[]
            ).map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              const unreadForTab = id === "messages" ? totalUnread : 0;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setActiveTab(id);
                  }}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <div className="relative">
                    <Icon size={22} />
                    {unreadForTab > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unreadForTab > 9 ? "9+" : unreadForTab}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium">{label}</span>
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
