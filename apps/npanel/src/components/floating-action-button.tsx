"use client";

import * as React from "react";
import { X, MessageCircle, ChevronRight, RotateCw, Phone, Bot, ArrowLeft, Paperclip, Send, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FloatingActionButtonProps {
  className?: string;
}

type ChatMessage = 
  | {
      id: string;
      type: "assistant";
      message: string;
      timestamp: Date;
    }
  | {
      id: string;
      type: "user";
      message: string;
      timestamp: Date;
      files?: string[];
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

// Action options matching the reference design
const getActionOptions = () => [
  {
    id: "live-chat",
    title: "Chat with a human",
    icon: Icons.LiveChat,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    onClick: () => {
      // Handle live chat
      console.log("Chat with a human");
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
  {
    id: "whatsapp",
    title: "Continue on WhatsApp",
    icon: WhatsAppIcon,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    onClick: () => {
      // Handle WhatsApp - use env variable
      const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || "https://wa.me/254748777666";
      window.open(whatsappUrl, "_blank");
    },
  },
  {
    id: "sms",
    title: "Text us via SMS",
    icon: MessageCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    onClick: () => {
      // Handle SMS - use env variable
      const smsUrl = process.env.NEXT_PUBLIC_SMS_URL || "sms:+254748777666";
      window.open(smsUrl, "_blank");
    },
  },
  {
    id: "call",
    title: "Call us",
    icon: Phone,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    onClick: () => {
      // Handle phone call
      const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER || "+254748777666";
      window.open(`tel:${phoneNumber}`, "_blank");
    },
  },
];

// Mock chat messages - starting with the greeting for human chat
const mockChatMessages: ChatMessage[] = [
  {
    id: "1",
    type: "assistant",
    message: "👋 How can we help you today?\nPlease describe the issue in detail. Include details about what you're seeing, any service specific details, serviceIDs, custom domains, log output etc",
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
  },
];

// Mock chat messages for Zeepo AI
const mockZeepoMessages: ChatMessage[] = [
  {
    id: "1",
    type: "assistant",
    message: "👋 Hi! I'm Zeepo, your AI support assistant. How can I help you today?\nFeel free to ask me anything about your services, account, or any questions you might have!",
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
  },
];

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<"main" | "chat" | "zeepo">("main");
  const [messageInput, setMessageInput] = React.useState("");
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(mockChatMessages);
  const [zeepoMessages, setZeepoMessages] = React.useState<ChatMessage[]>(mockZeepoMessages);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const actionOptions = getActionOptions();
  
  // Reset view when popover closes
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentView("main");
      setMessageInput("");
      setSelectedFiles([]);
    }
  }, [isOpen]);
  
  const handleChatWithHuman = () => {
    setCurrentView("chat");
  };
  
  const handleZeepoChat = () => {
    setCurrentView("zeepo");
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
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
  
  const handleSendMessage = () => {
    if (currentView === "zeepo") {
      // Zeepo chat - no files
      if (!messageInput.trim()) return;
      
      const newUserMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        message: messageInput,
        timestamp: new Date(),
      };
      
      setZeepoMessages([...zeepoMessages, newUserMessage]);
      setMessageInput("");
      
      // Simulate Zeepo AI response after a delay
      setTimeout(() => {
        const zeepoResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          message: "Thank you for your message! I'm Zeepo, your AI assistant. Let me help you with that.",
          timestamp: new Date(),
        };
        setZeepoMessages(prev => [...prev, zeepoResponse]);
      }, 1000);
    } else {
      // Human chat - with files
      if (!messageInput.trim() && selectedFiles.length === 0) return;
      
      // Add user message
      const newUserMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "user",
        message: messageInput || `Sent ${selectedFiles.length} file(s)`,
        timestamp: new Date(),
        files: selectedFiles.length > 0 ? selectedFiles.map(f => f.name) : undefined,
      };
      
      setChatMessages([...chatMessages, newUserMessage]);
      setMessageInput("");
      setSelectedFiles([]);
      
      // Simulate assistant response after a delay
      setTimeout(() => {
        const assistantResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          message: "Thank you for your message. I'm here to help!",
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, assistantResponse]);
      }, 1000);
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
          (currentView === "chat" || currentView === "zeepo") && "h-[600px] flex flex-col"
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
                          handleChatWithHuman();
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
          ) : currentView === "chat" ? (
            <>
              {/* Chat Header */}
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

              {/* Chat Messages Area */}
              <ScrollArea className="flex-1 px-4 py-4">
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
                        {msg.type === "user" && msg.files && msg.files.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-primary/20">
                            <div className="flex flex-wrap gap-1">
                              {msg.files.map((fileName: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-1 text-xs opacity-90">
                                  <Paperclip className="h-3 w-3" />
                                  <span className="truncate max-w-[100px]">{fileName}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="border-t px-4 py-2 bg-muted/30">
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-border text-sm"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="max-w-[150px] truncate text-xs">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="border-t px-4 py-3 bg-background">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
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
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-9 w-9 rounded-full hover:bg-accent"
                    onClick={handleAttachmentClick}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    type="button"
                    className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() && selectedFiles.length === 0}
                  >
                    <Send className="h-4 w-4" />
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
    </Popover>
  );
}
