"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { X, MessageCircle, ChevronRight, RotateCw, Phone, Bot, ArrowLeft, Paperclip, Send, ChevronDown, Sparkles, Trash2 } from "lucide-react";
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
import { Spinner } from "@/components/npanel-ui/spinner";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AiMarkdownRenderer } from "./ai/ai-markdown-renderer";
import { useTicketsList, useTicketMessages } from "./tickets/use-tickets";
import { useTicketMutations } from "./tickets/use-ticket-mutations";
import { authClient } from "@/lib/auth-client";
import { useLocation } from "react-router";
import { trpc } from "@/utils/trpc";
import { uploadFiles } from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { toast } from "@/components/ui/sonner";
import { NotificationSettingsBanner } from "@/components/notification-settings-banner";
import { useNewMessageDetector } from "@/hooks/use-new-message-detector";
import { useGlobalNotificationDetector } from "@/hooks/use-global-notification-detector";
import { MessageAttachment } from "./tickets/message-attachment";
import { useAiHistory, useAiChat, useAiMutations } from "@/hooks/use-ai";

interface FloatingActionButtonProps {
  className?: string;
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
  }
  | {
    id: string;
    type: "user";
    message: string;
    timestamp: Date;
    attachments?: ChatMessageAttachment[];
  };



// WhatsApp Icon Component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.375a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// No mock data - using real data from API

// Action options matching the reference design
const getActionOptions = () => [
  {
    id: "live-chat",
    title: "Chat with a human",
    icon: Icons.LiveChat,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    onClick: () => {
      // Handle live chat - will show ticket list
      console.log("Chat with a human");
    },
  },
  {
    id: "zepo",
    title: "Live AI support",
    icon: Icons.AISupport,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    id: "call",
    title: "Call us",
    icon: Phone,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    onClick: () => {
      // Handle phone call
      const phoneNumber = process.env.VITE_PUBLIC_PHONE_NUMBER || "+254748777666";
      window.open(`tel:${phoneNumber}`, "_blank");
    },
  },
];

// Initial greeting message for new tickets
const initialGreetingMessage: ChatMessage = {
  id: "greeting",
  type: "assistant",
  message: "👋 How can we help you today?\nPlease describe the issue in detail. Include details about what you're seeing, any service specific details, serviceIDs, custom domains, log output etc",
  timestamp: new Date(),
};

// Initial greeting for Zepo AI
const initialZepoMessage: ChatMessage = {
  id: "zepo-greeting",
  type: "assistant",
  message: "👋 Hi! I'm Zepo, your AI support assistant. How can I help you today?\nFeel free to ask me anything about your services, account, or any questions you might have!",
  timestamp: new Date(),
};

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<"main" | "ticket-list" | "chat" | "zepo" | "zepo-history">("main");
  const [messageInput, setMessageInput] = React.useState("");
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);
  const [selectedAiChatId, setSelectedAiChatId] = React.useState<string | null>(null);
  const [isNewTicket, setIsNewTicket] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [loadingChatId, setLoadingChatId] = React.useState<string | null>(null);
  const [loadingAiChatId, setLoadingAiChatId] = React.useState<string | null>(null);
  const [deletingAiChatId, setDeletingAiChatId] = React.useState<string | null>(null);
  const [optimisticAiMessages, setOptimisticAiMessages] = React.useState<ChatMessage[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const actionOptions = getActionOptions();

  // Get current user
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  // Get team slug from pathname and then team ID
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1];
  const { data: teamData } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    {
      enabled: !!teamSlug,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Data fetching hooks
  const { tickets, isLoading: isLoadingTickets, isRefetching: isRefetchingTickets, isError: isErrorTickets, error: ticketsError, refetch: refetchTickets } = useTicketsList({
    teamId: teamData?.id,
  });
  // Only fetch messages if we have a ticket ID AND it's not a new ticket
  const shouldFetchMessages = !isNewTicket && !!selectedTicketId;
  const { messages, isLoading: isLoadingMessages, isError: isErrorMessages, error: messagesError, refetch: refetchMessages } = useTicketMessages(
    shouldFetchMessages ? selectedTicketId : null
  );
  const { createTicket, createMessage, markMessageRead, markAllTicketMessagesAsRead } = useTicketMutations({ currentUserId });

  // AI Data fetching hooks
  const { history: aiHistory, isLoading: isLoadingAiHistory, isRefetching: isRefetchingAiHistory, refetch: refetchAiHistory } = useAiHistory({
    teamId: teamData?.id,
  });
  const { messages: aiMessagesData, isLoading: isLoadingAiMessages } = useAiChat(selectedAiChatId === "new" ? null : selectedAiChatId);
  const { startChat: startAiChat, sendMessage: sendAiMessage, escalateChat: directEscalateChat, deleteChat: deleteAiChat } = useAiMutations();

  // Callback for when a new message is received while chat is open
  const handleNewMessage = React.useCallback((message: any) => {
    // Auto-mark messages as read when user is actively viewing the chat
    if (selectedTicketId) {
      markAllTicketMessagesAsRead.mutate({ ticketId: selectedTicketId });
    }
  }, [selectedTicketId, markAllTicketMessagesAsRead]);

  // Initialize new message detectors
  const isChatOpen = isOpen && currentView === "chat";
  useNewMessageDetector(messages, currentUserId, selectedTicketId, isChatOpen, handleNewMessage);
  useGlobalNotificationDetector(tickets, selectedTicketId);

  // Transform API messages to ChatMessage format
  const chatMessages: ChatMessage[] = React.useMemo(() => {
    // For new tickets, always show just the greeting - NO MESSAGE FETCHING
    if (isNewTicket) {
      return [initialGreetingMessage];
    }

    // If we have messages, transform them
    if (messages && messages.length > 0) {
      return messages.map((msg) => {
        const isFromCurrentUser = msg.senderId === currentUserId;

        return {
          id: msg.id,
          type: isFromCurrentUser ? "user" : "assistant",
          message: msg.content,
          timestamp: msg.createdAt,
          attachments: msg.attachments?.map(att => ({
            id: att.id,
            fileName: att.fileName,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            fileUrl: att.fileUrl,
          })),
        };
      });
    }

    // If no messages but ticket exists, show greeting
    return [initialGreetingMessage];
  }, [messages, isNewTicket, currentUserId]);

  // Transform AI messages
  const transformedAiMessages: ChatMessage[] = React.useMemo(() => {
    let baseMessages: ChatMessage[] = [];

    if (aiMessagesData && aiMessagesData.length > 0) {
      baseMessages = aiMessagesData
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({
          id: msg.id,
          type: (msg.role === "user" ? "user" : "assistant") as "user" | "assistant",
          message: msg.content || "",
          timestamp: new Date(msg.createdAt),
        })) as ChatMessage[];
    } else if (selectedAiChatId === "new") {
      baseMessages = [initialZepoMessage];
    } else {
      // Transition state: we have an ID but data hasn't arrived/finished loading
      baseMessages = [initialZepoMessage];
    }

    // Merge with optimistic messages
    // We only keep optimistic messages that aren't already in the real data (comparing content)
    const filteredOptimistic = optimisticAiMessages.filter(
      om => !baseMessages.find(bm =>
        bm.message === om.message && bm.type === om.type
      )
    );

    return [...baseMessages, ...filteredOptimistic];
  }, [aiMessagesData, selectedAiChatId, optimisticAiMessages]);

  // Clear optimistic messages when actual data starts coming in for the current chat
  React.useEffect(() => {
    if (aiMessagesData && aiMessagesData.length > 0) {
      setOptimisticAiMessages([]);
    }
  }, [aiMessagesData]);

  // Reset view when popover closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentView("main");
      setMessageInput("");
      setSelectedFiles([]);
      setSelectedTicketId(null);
      setSelectedAiChatId(null);
      setIsNewTicket(false);
    }
  }, [isOpen]);

  const handleViewTickets = () => {
    setCurrentView("ticket-list");
  };

  const handleChatWithHuman = (ticketId?: string) => {
    // "new" or no id = create new ticket: no message fetch, show greeting only
    if (ticketId && ticketId !== "new") {
      setSelectedTicketId(ticketId);
      setIsNewTicket(false);

      // Run mutation in the background
      markAllTicketMessagesAsRead.mutate({ ticketId });
    } else {
      setIsNewTicket(true);
      setSelectedTicketId(null);
    }
    setCurrentView("chat");
  };

  const handleZepoChat = () => {
    setCurrentView("zepo-history");
  };

  const handleStartNewZepoChat = () => {
    setSelectedAiChatId("new");
    setCurrentView("zepo");
  };

  const handleSelectPastZepoChat = (chatId: string) => {
    if (deletingAiChatId === chatId) return;
    setSelectedAiChatId(chatId);
    setCurrentView("zepo");
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
      setCurrentView("ticket-list");
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

    if (hours < 1) {
      return "Just now";
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

    // Validate file sizes
    const oversizedFiles: File[] = [];
    const validFiles: File[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(file);
      } else {
        validFiles.push(file);
      }
    });

    // Show warning for oversized files
    if (oversizedFiles.length > 0) {
      toast.error(
        `${oversizedFiles.length} file(s) exceed the 50MB limit. Please select smaller files.`,
        {
          description: oversizedFiles.map(f => f.name).join(", "),
        }
      );
    }

    // Only add valid files
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendMessage = async () => {
    if (isSending || (!messageInput.trim() && selectedFiles.length === 0)) return;

    if (currentView === "zepo") {
      if (!messageInput.trim() || !selectedAiChatId) return;

      setIsSending(true);
      try {
        const input = messageInput;
        setMessageInput(""); // Optimistically clear input

        // Add user message optimistically
        const userMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          type: "user",
          message: input,
          timestamp: new Date(),
        };
        setOptimisticAiMessages(prev => [...prev, userMessage]);

        if (selectedAiChatId === "new") {
          const newChat = await startAiChat.mutateAsync({
            initialMessage: input,
          });
          setSelectedAiChatId(newChat.id);
        } else {
          await sendAiMessage.mutateAsync({
            chatId: selectedAiChatId,
            content: input,
          });
        }
      } catch (error) {
        console.error("Failed to send AI message:", error);
        toast.error("Failed to send message to Zepo.");
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Human chat - with files
    if (!messageInput.trim() && selectedFiles.length === 0) return;

    setIsSending(true);
    try {
      let ticketId = selectedTicketId;

      // Upload files first if any
      let attachments: Array<{
        fileName: string;
        fileSize: number;
        mimeType: string;
        fileUrl: string;
        storageKey?: string;
      }> = [];

      if (selectedFiles.length > 0) {
        try {
          const uploadResponse = await uploadFiles(UPLOAD_ENDPOINTS.FILE, {
            files: selectedFiles,
            onUploadProgress: (progress) => {
              // You can add progress tracking here if needed
              console.log("Upload progress:", progress);
            },
          });

          if (uploadResponse && uploadResponse.length > 0) {
            attachments = uploadResponse.map((file, index) => ({
              fileName: selectedFiles[index]?.name || file.name || "unknown",
              fileSize: file.size || selectedFiles[index]?.size || 0,
              mimeType: file.type || selectedFiles[index]?.type || "application/octet-stream",
              fileUrl: file.ufsUrl || file.url || "",
              storageKey: file.key,
            }));
          } else {
            throw new Error("Failed to upload files");
          }
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
          toast.error("Failed to upload files. Please try again.");
          return;
        }
      }

      // If new ticket, create it now (after files are uploaded) - this is the FIRST message
      if (isNewTicket || !ticketId) {
        if (!teamData?.id) {
          toast.error("Team ID not available. Please refresh the page.");
          return;
        }

        // Create the ticket with the first message
        const newTicket = await createTicket.mutateAsync({
          subject: messageInput.substring(0, 100) || undefined,
          description: messageInput,
          type: "GENERAL",
          priority: "NORMAL",
          source: "CHAT",
          teamId: teamData.id,
        });
        captureEvent("support_ticket_created", { category: "GENERAL", priority: "NORMAL" });
        ticketId = newTicket.id;
        setSelectedTicketId(ticketId);
        setIsNewTicket(false); // Next render: shouldFetchMessages=true, useTicketMessages(ticketId) will fetch

        // Now create the first message for this ticket
        await createMessage.mutateAsync({
          ticketId: ticketId,
          content: messageInput || (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : ""),
          isInternal: false,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        // Refresh ticket list so the new ticket appears when user goes back to the list
        await refetchTickets();
        // createMessage.onSuccess invalidates getMessages; with new selectedTicketId, messages will load
      } else {
        // Existing ticket - just create the message
        await createMessage.mutateAsync({
          ticketId: ticketId,
          content: messageInput || (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : ""),
          isInternal: false,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
      }

      setMessageInput("");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:shadow-xl transition-all duration-200",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            className
          )}
          aria-label="Open support options"
        >
          {isOpen ? (
            <ChevronDown className="h-10 w-10" />
          ) : (
            <Icons.FAB className="h-10 w-10" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="top"
        sideOffset={16}
        className={cn(
          "w-[360px] p-0 rounded-2xl overflow-hidden border-0 shadow-xl bg-background/98 backdrop-blur-md",
          (currentView === "ticket-list" || currentView === "chat" || currentView === "zepo" || currentView === "zepo-history") && "h-[600px] flex flex-col"
        )}
      >
        {/* Subtle neutral tint only when in chat/zepo views - avoid generic gradient look */}
        {(currentView === "ticket-list" || currentView === "chat" || currentView === "zepo" || currentView === "zepo-history") && (
          <div className="absolute inset-0 bg-muted/20 pointer-events-none rounded-2xl" />
        )}

        <div className="relative flex flex-col z-10 h-full">
          {currentView === "main" ? (
            <>
              {/* Header with logo - no sign in button */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div className="flex items-center gap-2">
                  <img
                    src="/nisclogooriginal.png"
                    alt="Nisc Cloud"
                    width={100}
                    height={32}
                    className="h-8 w-auto"
                  />
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

              {/* Greeting message */}
              <div className="px-5 pb-6">
                <h2 className="text-lg font-semibold text-foreground text-center">
                  Hi! How can we help you today?
                </h2>
              </div>

              {/* Action buttons */}
              <div className="px-4 pb-5 space-y-2">
                {actionOptions.map((option) => {
                  const IconComponent = option.icon;

                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (option.id === "live-chat") {
                          handleViewTickets();
                        } else if (option.id === "zepo") {
                          handleZepoChat();
                        } else {
                          option.onClick?.();
                          setIsOpen(false);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 rounded-xl",
                        "bg-muted/50 hover:bg-muted transition-colors",
                        "border border-border/50",
                        "group"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          option.bgColor
                        )}>
                          {option.id === "whatsapp" ? (
                            <WhatsAppIcon className={cn("h-5 w-5", option.color)} />
                          ) : option.id === "live-chat" || option.id === "zepo" ? (
                            <IconComponent className={cn("h-5 w-5", option.color)} />
                          ) : (
                            <IconComponent className={cn("h-5 w-5", option.color)} />
                          )}
                        </div>
                        <span className={cn(
                          "font-medium text-sm",
                          option.color
                        )}>
                          {option.title}
                        </span>
                      </div>
                      <ChevronRight className={cn(
                        "h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors",
                        option.color
                      )} />
                    </button>
                  );
                })}
              </div>
            </>
          ) : currentView === "ticket-list" ? (
            <>
              {/* Ticket List Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-accent"
                    onClick={() => setCurrentView("main")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold text-foreground">Support Tickets</h2>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-accent"
                    onClick={() => refetchTickets()}
                    disabled={isRefetchingTickets}
                    aria-label="Refresh tickets"
                  >
                    {isRefetchingTickets ? (
                      <Spinner size={16} />
                    ) : (
                      <RotateCw className="h-4 w-4" />
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

              {/* Create New Ticket Button */}
              <div className="px-4 pt-4 pb-3 border-b">
                <Button
                  onClick={() => handleChatWithHuman("new")}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Icons.LiveChat className="mr-2 h-4 w-4" />
                  Create New Ticket
                </Button>
              </div>

              {/* Ticket List */}
              <ScrollArea className="flex-1">
                <NotificationSettingsBanner />

                {isLoadingTickets ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Spinner size={32} className="mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Loading tickets...</p>
                    </div>
                  </div>
                ) : isErrorTickets ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="mb-4">
                      <svg
                        className="mx-auto h-12 w-12 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">Failed to load tickets</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      {ticketsError?.message || "An error occurred while fetching tickets."}
                    </p>
                    <Button onClick={() => refetchTickets()} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="mb-4 p-4 bg-muted/50 rounded-full w-fit mx-auto">
                      <Icons.LiveChat className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">No support tickets</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      You don't have any support tickets yet. Create a new ticket to get started.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => handleChatWithHuman(ticket.id)}
                        className="w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                        disabled={loadingChatId === ticket.id}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">
                              {ticket.ticketNumber}
                            </span>
                            <div className="flex items-center gap-2">
                              {loadingChatId === ticket.id && (
                                <Spinner size={14} className="text-primary" />
                              )}
                              {ticket.unreadCount > 0 && (
                                <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                  {ticket.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {ticket.lastMessage || "No messages yet"}
                            </p>
                            {ticket.lastMessageAt && (
                              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                                {formatTime(ticket.lastMessageAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : currentView === "zepo-history" ? (
            <>
              {/* Zepo History Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-accent"
                    onClick={() => setCurrentView("main")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold text-foreground">AI Chat History</h2>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 rounded-full hover:bg-accent",
                      (isLoadingAiHistory || isRefetchingAiHistory) && "animate-spin"
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

              {/* Start New AI Chat Button */}
              <div className="px-4 pt-4 pb-3 border-b">
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
                  {isSending ? "Starting Chat..." : "Start New AI Chat"}
                </Button>
              </div>

              {/* AI Chat History List */}
              <ScrollArea className="flex-1">
                {isLoadingAiHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Spinner size={32} className="mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Loading chats...</p>
                    </div>
                  </div>
                ) : aiHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <p className="text-sm text-muted-foreground">No recent AI chats.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {aiHistory.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleSelectPastZepoChat(chat.id)}
                        className={cn(
                          "w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left cursor-pointer relative group flex items-start gap-3",
                          deletingAiChatId === chat.id && "opacity-50 pointer-events-none"
                        )}
                      >
                        <div className="h-9 w-9 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                          <img src="/zepo.png" alt="Zepo" width={36} height={36} className="h-9 w-9 object-cover" />
                        </div>
                        <div className="flex flex-col gap-1 pr-8 min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">
                              {chat.title || "AI Chat"}
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
          ) : currentView === "chat" ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-accent"
                    onClick={() => setCurrentView("ticket-list")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {isNewTicket
                        ? "New Ticket"
                        : selectedTicketId
                          ? tickets.find(t => t.id === selectedTicketId)?.ticketNumber || "Support Chat"
                          : "Support Chat"
                      }
                    </h2>
                  </div>
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

              {/* Chat Messages Area */}
              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="p-4 flex flex-col gap-4">
                  {isNewTicket ? (
                    // For new tickets, show greeting immediately without any loading/error states
                    <div className="space-y-4">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex items-end gap-2",
                            msg.type === "user" ? "justify-end" : "justify-start"
                          )}
                        >
                          {msg.type === "assistant" && (
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mb-1">
                              <Icons.LiveChat className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2.5",
                              msg.type === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/10 text-foreground"
                            )}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-line">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : shouldFetchMessages && isLoadingMessages ? (
                    <div className="space-y-4">
                      {/* Skeleton loader for messages */}
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-end gap-2",
                            i % 2 === 0 ? "justify-end" : "justify-start"
                          )}
                        >
                          {i % 2 !== 0 && (
                            <div className="h-6 w-6 rounded-full bg-muted animate-pulse flex-shrink-0 mb-1" />
                          )}
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 space-y-2 animate-pulse",
                              i % 2 === 0 ? "bg-primary/20 max-w-[80%]" : "bg-muted max-w-[70%]"
                            )}
                          >
                            <div className="h-4 bg-muted-foreground/20 rounded w-full" />
                            {i === 2 && <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : shouldFetchMessages && isErrorMessages ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4">
                        <svg
                          className="mx-auto h-12 w-12 text-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">Failed to load messages</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        {messagesError?.message || "An error occurred while fetching messages."}
                      </p>
                      <Button onClick={() => refetchMessages()} variant="outline" size="sm">
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="mb-4 p-4 bg-muted/50 rounded-full w-fit mx-auto">
                            <MessageCircle className="h-12 w-12 text-muted-foreground" />
                          </div>
                          <h3 className="mb-2 text-lg font-semibold">No messages yet</h3>
                          <p className="text-sm text-muted-foreground">
                            Start the conversation by sending a message.
                          </p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex items-end gap-2",
                              msg.type === "user" ? "justify-end" : "justify-start"
                            )}
                          >
                            {msg.type === "assistant" && (
                              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mb-1">
                                <Icons.LiveChat className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <div
                              className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-2.5 space-y-2",
                                msg.type === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-primary/10 text-foreground"
                              )}
                            >
                              {/* Attachments - show before message text */}
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

                              {/* Message text */}
                              {msg.message && (
                                <p className="text-sm leading-relaxed whitespace-pre-line">{msg.message}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-background/50 backdrop-blur-sm z-20">
                {selectedFiles.length > 0 && (
                  <div className="flex gap-2 pb-3 overflow-x-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group bg-muted rounded-lg p-2 min-w-[120px] max-w-[120px]">
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          disabled={isSending}
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="flex flex-col items-center justify-center text-center h-full">
                          <Paperclip className="h-4 w-4 text-muted-foreground mb-1" />
                          <span className="text-xs truncate w-full">{file.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}


                <div className="flex items-end gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                    accept="image/*,video/*,application/pdf"
                    disabled={isSending}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 flex-shrink-0"
                    onClick={handleAttachmentClick}
                    disabled={isSending}
                  >
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  </Button>

                  <div className="flex-1 relative">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={isSending ? "Sending..." : "Type a message..."}
                      className={cn(
                        "w-full bg-muted/50 border-0 rounded-xl px-4 py-2.5 focus:ring-0 resize-none min-h-[40px] max-h-[120px] text-sm",
                        "placeholder:text-muted-foreground/50",
                        isSending && "opacity-50 cursor-not-allowed"
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
                    disabled={(!messageInput.trim() && selectedFiles.length === 0) || isSending}
                    className={cn(
                      "h-10 w-10 rounded-full flex-shrink-0 transition-all duration-200",
                      messageInput.trim() || selectedFiles.length > 0 ? "bg-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isSending ? (
                      <Spinner size={16} className="text-primary-foreground" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Zepo Chat Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-accent"
                    onClick={() => setCurrentView("zepo-history")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <img
                      src="/nisclogooriginal.png"
                      alt="Nisc Cloud"
                      width={80}
                      height={24}
                      className="h-6 w-auto"
                    />
                  </div>
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

              {/* Zepo Chat Messages Area */}
              <ScrollArea className="flex-1 px-4 py-4">
                {isLoadingAiMessages && transformedAiMessages.length <= 1 && optimisticAiMessages.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-end gap-2",
                          i % 2 === 0 ? "justify-end" : "justify-start"
                        )}
                      >
                        {i % 2 !== 0 && (
                          <div className="h-6 w-6 rounded-full bg-muted animate-pulse flex-shrink-0 mb-1" />
                        )}
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 space-y-2 animate-pulse",
                            i % 2 === 0 ? "bg-primary/20 max-w-[80%] w-32" : "bg-muted max-w-[70%] w-48"
                          )}
                        >
                          <div className="h-3 bg-muted-foreground/20 rounded w-full" />
                          {i === 2 && <div className="h-3 bg-muted-foreground/20 rounded w-3/4" />}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : transformedAiMessages.length === 0 && optimisticAiMessages.length === 0 ? (
                  // Welcome View (No Chat ID or New Chat)
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center animate-in fade-in duration-500">
                    <div className="mb-3 flex justify-center">
                      <img
                        src="/zepo.png"
                        alt="Zepo"
                        width={160}
                        height={160}
                        className="h-40 w-40 object-contain"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-2">
                      Hi! I'm Zepo
                    </h3>
                    <p className="text-muted-foreground max-w-[260px] leading-relaxed mb-8">
                      Your AI support assistant. I can help you with services, account questions, and more!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transformedAiMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex items-end gap-2",
                          msg.type === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.type === "assistant" && (
                          <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0 mb-1 bg-muted">
                            <img src="/zepo.png" alt="Zepo" width={24} height={24} className="h-6 w-6 object-cover" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2.5",
                            msg.type === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/10 text-foreground"
                          )}
                        >
                          <AiMarkdownRenderer content={msg.message} />
                        </div>
                      </div>
                    ))}
                    {isSending && (
                      <div className="flex justify-start gap-2">
                        <div className="h-6 w-6 rounded-full overflow-hidden flex-shrink-0 animate-pulse bg-muted">
                          <img src="/zepo.png" alt="Zepo" width={24} height={24} className="h-6 w-6 object-cover" />
                        </div>
                        <div className="bg-primary/10 rounded-2xl px-4 py-2.5">
                          <Spinner size={16} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Zepo Message Input - No attachment */}
              <div className="border-t px-4 py-3 bg-background">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Type message here"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-full bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  </div>
                  <Button
                    size="icon"
                    type="button"
                    className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleSendMessage}
                    disabled={
                      !messageInput.trim() ||
                      isSending ||
                      createMessage.isPending ||
                      startAiChat.isPending ||
                      sendAiMessage.isPending
                    }
                  >
                    {isSending || createMessage.isPending || startAiChat.isPending || sendAiMessage.isPending ? (
                      <Spinner size={16} />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
