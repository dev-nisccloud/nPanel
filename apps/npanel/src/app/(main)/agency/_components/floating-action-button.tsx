"use client";

import * as React from "react";
import { X, MessageCircle, ChevronRight, RotateCw, Phone, Bot, ArrowLeft, Paperclip, Send, ChevronDown, MoreVertical, CheckCircle, Circle, UserPlus, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTicketsList, useTicketMessages } from "./tickets/use-tickets";
import { useTicketMutations } from "./tickets/use-ticket-mutations";
import type { TicketMessage } from "./tickets/schema";
import { authClient } from "@/lib/auth-client";
import { MessageAttachment } from "@/components/tickets/message-attachment";
import { uploadFiles } from "@/hooks/use-uploadthing";
import { UPLOAD_ENDPOINTS } from "@/lib/uploadthing";
import { toast } from "sonner";
import { NotificationSettingsBanner } from "@/components/notification-settings-banner";
import { useNewMessageDetector } from "@/hooks/use-new-message-detector";
import { useGlobalNotificationDetector } from "@/hooks/use-global-notification-detector";

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
    title: "View support tickets",
    icon: Icons.LiveChat,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    onClick: () => {
      // Handle support tickets - will show chat list
      console.log("View support tickets");
    },
  },
  {
    id: "zeepo",
    title: "Live AI support",
    icon: Icons.AISupport,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    onClick: () => {
      // Handle Zeepo AI chat - use env variable
      const zeepoUrl = process.env.NEXT_PUBLIC_ZEEPO_URL;
      if (zeepoUrl) {
        window.open(zeepoUrl, "_blank");
      } else {
        console.log("Chat with Zeepo");
      }
    },
  },
  // {
  //   id: "whatsapp",
  //   title: "Continue on WhatsApp",
  //   icon: WhatsAppIcon,
  //   color: "text-green-600",
  //   bgColor: "bg-green-50 dark:bg-green-950/20",
  //   onClick: () => {
  //     // Handle WhatsApp - use env variable
  //     const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/254748777666";
  //     window.open(whatsappUrl, "_blank");
  //   },
  // },
  // {
  //   id: "sms",
  //   title: "Text us via SMS",
  //   icon: MessageCircle,
  //   color: "text-blue-600",
  //   bgColor: "bg-blue-50 dark:bg-blue-950/20",
  //   onClick: () => {
  //     // Handle SMS - use env variable
  //     const smsUrl = process.env.NEXT_PUBLIC_SMS_URL || "sms:+254748777666";
  //     window.open(smsUrl, "_blank");
  //   },
  // },
  // {
  //   id: "call",
  //   title: "Call us",
  //   icon: Phone,
  //   color: "text-blue-600",
  //   bgColor: "bg-blue-50 dark:bg-blue-950/20",
  //   onClick: () => {
  //     // Handle phone call
  //     const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER || "+254748777666";
  //     window.open(`tel:${phoneNumber}`, "_blank");
  //   },
  // },
];

// Initial greeting message for new tickets
const initialGreetingMessage: ChatMessage = {
  id: "greeting",
  type: "assistant",
  message: "👋 How can we help you today?\nPlease describe the issue in detail. Include details about what you're seeing, any service specific details, serviceIDs, custom domains, log output etc",
  timestamp: new Date(),
};

// Initial greeting for Zeepo AI
const initialZeepoMessage: ChatMessage = {
  id: "zeepo-greeting",
  type: "assistant",
  message: "👋 Hi! I'm Zeepo, your AI support assistant. How can I help you today?\nFeel free to ask me anything about your services, account, or any questions you might have!",
  timestamp: new Date(),
};

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<"main" | "chat-list" | "chat" | "zeepo">("main");
  const [messageInput, setMessageInput] = React.useState("");
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>(null);
  const [isNewTicket, setIsNewTicket] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [loadingChatId, setLoadingChatId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const actionOptions = getActionOptions();

  // Get current user
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  // Data fetching hooks
  const { tickets, isLoading: isLoadingTickets, isRefetching: isRefetchingTickets, isError: isErrorTickets, error: ticketsError, refetch: refetchTickets } = useTicketsList();
  // Only fetch messages if we have a ticket ID AND it's not a new ticket
  const shouldFetchMessages = !isNewTicket && !!selectedChatId;
  const { messages, isLoading: isLoadingMessages, isError: isErrorMessages, error: messagesError, refetch: refetchMessages } = useTicketMessages(
    shouldFetchMessages ? selectedChatId : null
  );
  const { createTicket, createMessage, updateStatus, assignTicket, archiveTicket, markMessageRead, markAllTicketMessagesAsRead } = useTicketMutations({ currentUserId });

  // Callback for when a new message is received while chat is open
  const handleNewMessage = React.useCallback((message: any) => {
    // Auto-mark messages as read when user is actively viewing the chat
    if (selectedChatId) {
      markAllTicketMessagesAsRead.mutate({ ticketId: selectedChatId });
    }
  }, [selectedChatId, markAllTicketMessagesAsRead]);

  // Initialize new message detectors
  const isChatOpen = isOpen && currentView === "chat";
  useNewMessageDetector(messages, currentUserId, selectedChatId, isChatOpen, handleNewMessage);
  useGlobalNotificationDetector(tickets, selectedChatId);

  // Transform API messages to ChatMessage format
  const chatMessages: ChatMessage[] = React.useMemo(() => {
    // For new tickets, always show just the greeting - NO MESSAGE FETCHING
    if (isNewTicket) {
      return [initialGreetingMessage];
    }

    // If we have messages, transform them
    if (messages && messages.length > 0) {
      return messages.map((msg) => {
        // For agency side: if sender is not current user and not internal, it's from customer (user)
        // If sender is current user or internal, it's from agent (assistant)
        const isFromCurrentUser = msg.senderId === currentUserId;
        const isFromCustomer = !msg.isInternal && !isFromCurrentUser;

        return {
          id: msg.id,
          type: isFromCustomer ? "user" : "assistant",
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

  const zeepoMessages = React.useState<ChatMessage[]>([initialZeepoMessage])[0];

  // Reset view when popover closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentView("main");
      setMessageInput("");
      setSelectedFiles([]);
      setSelectedChatId(null);
      setIsNewTicket(false);
    }
  }, [isOpen]);

  const handleViewSupportTickets = () => {
    setCurrentView("chat-list");
  };

  const handleChatWithHuman = (ticketId?: string) => {
    // "new" or no id = create new ticket: no message fetch, show greeting only
    if (ticketId && ticketId !== "new") {
      setSelectedChatId(ticketId);
      setIsNewTicket(false);

      // Run mutation in the background
      markAllTicketMessagesAsRead.mutate({ ticketId });
    } else {
      setIsNewTicket(true);
      setSelectedChatId(null);
    }
    setCurrentView("chat");
  };

  const handleZeepoChat = () => {
    setCurrentView("zeepo");
  };

  const formatTime = (date: Date) => {
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

  const handleMarkAsOpen = async (chatId: string) => {
    try {
      await updateStatus.mutateAsync({
        ticketId: chatId,
        status: "OPEN",
      });
    } catch (error) {
      console.error("Failed to mark ticket as open:", error);
    }
  };

  const handleMarkAsClosed = async (chatId: string) => {
    try {
      await updateStatus.mutateAsync({
        ticketId: chatId,
        status: "CLOSED",
      });
    } catch (error) {
      console.error("Failed to mark ticket as closed:", error);
    }
  };

  const handleAssignToUser = async (chatId: string) => {
    // TODO: Open dialog/modal to select user
    console.log("Assign to user:", chatId);
    // For now, just log - will implement user selection dialog later
  };

  const handleArchive = async (chatId: string) => {
    try {
      await archiveTicket.mutateAsync({
        ticketId: chatId,
      });
    } catch (error) {
      console.error("Failed to archive ticket:", error);
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
    if (currentView === "zeepo") {
      // Zeepo chat - no files (handled separately, not implemented yet)
      if (!messageInput.trim()) return;
      // TODO: Implement Zeepo AI integration
      console.log("Zeepo message:", messageInput);
      setMessageInput("");
      return;
    }

    // Human chat - with files
    if (!messageInput.trim() && selectedFiles.length === 0) return;

    setIsSending(true);
    try {
      let ticketId = selectedChatId;

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
        const newTicket = await createTicket.mutateAsync({
          subject: messageInput.substring(0, 100) || undefined,
          description: messageInput,
          type: "GENERAL",
          priority: "NORMAL",
          source: "CHAT",
        });
        ticketId = newTicket.id;
        setSelectedChatId(ticketId);
        setIsNewTicket(false); // This will trigger message fetching

        // Now create the first message for this ticket
        await createMessage.mutateAsync({
          ticketId: ticketId,
          content: messageInput || (attachments.length > 0 ? `Sent ${attachments.length} file(s)` : ""),
          isInternal: false,
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        // Refetch messages after creating the first message
        await refetchMessages();
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
          (currentView === "chat-list" || currentView === "chat" || currentView === "zeepo") && "h-[600px] flex flex-col"
        )}
      >
        {/* Background gradient effect - must have - prominent blue glow - clipped to rounded corners */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-200/60 via-blue-100/40 to-transparent pointer-events-none rounded-2xl" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 pointer-events-none rounded-t-2xl"
          style={{
            background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.4) 0%, rgba(147, 197, 253, 0.2) 40%, transparent 70%)"
          }}
        />

        <div className="relative flex flex-col z-10 h-full">
          {currentView === "main" ? (
            <>
              {/* Header with logo - no sign in button */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div className="flex items-center gap-2">
                  <Image
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
                          handleViewSupportTickets();
                        } else if (option.id === "zeepo") {
                          handleZeepoChat();
                        } else {
                          option.onClick();
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
                          ) : option.id === "live-chat" || option.id === "zeepo" ? (
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
          ) : currentView === "chat-list" ? (
            <>
              {/* Chat List Header */}
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

              {/* Chat List */}
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
                      There are no support tickets at the moment.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors group"
                      >
                        <button
                          onClick={() => handleChatWithHuman(ticket.id)}
                          className="flex-1 flex flex-col gap-1 text-left"
                          disabled={loadingChatId === ticket.id}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-foreground">
                              {ticket.customerName || "Unknown Customer"}
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
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkAsOpen(ticket.id); }}>
                              <Circle className="mr-2 h-4 w-4" />
                              Mark as Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkAsClosed(ticket.id); }}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Closed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleAssignToUser(ticket.id); }}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign to User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleArchive(ticket.id); }}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                    onClick={() => setCurrentView("chat-list")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {isNewTicket
                        ? "New Ticket"
                        : selectedChatId
                          ? tickets.find(t => t.id === selectedChatId)?.customerName || "Support Chat"
                          : "Support Chat"
                      }
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-accent"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleMarkAsOpen(selectedChatId || "")}>
                        <Circle className="mr-2 h-4 w-4" />
                        Mark as Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleMarkAsClosed(selectedChatId || "")}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Closed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAssignToUser(selectedChatId || "")}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign to User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleArchive(selectedChatId || "")}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                    disabled={isSending} // Disable file input during sending
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
              {/* Zeepo Chat Header */}
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
                  <div className="flex items-center gap-2">
                    <Image
                      src="/nisclogooriginal.png"
                      alt="Nisc Cloud"
                      width={80}
                      height={24}
                      className="h-6 w-auto"
                    />
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

              {/* Zeepo Chat Messages Area */}
              <ScrollArea className="flex-1 px-4 py-4">
                <div className="space-y-4">
                  {zeepoMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex items-end gap-2",
                        msg.type === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.type === "assistant" && (
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mb-1">
                          <Icons.AISupport className="h-4 w-4 text-primary" />
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
              </ScrollArea>

              {/* Zeepo Message Input - No attachment */}
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
                    disabled={!messageInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover >
  );
}
