/**
 * Marketing-site support FAB — UI mirrored from the nPanel dashboard widget.
 * Interactive logic (tickets, AI chat, etc.) will be wired later.
 */

import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  Home,
  MessageCircle,
  MessageSquare,
  Search,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";

type ActiveTab = "home" | "messages" | "help";

export function FloatingActionButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");

  useEffect(() => {
    if (!isOpen) setActiveTab("home");
  }, [isOpen]);

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
            <MessageCircle className="h-6 w-6 text-primary-foreground" strokeWidth={2} />
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
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary">
                        <span className="text-sm font-bold text-primary-foreground">N</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You&apos;ll get replies here and in your email...
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-md dark:bg-card">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted/40"
                      onClick={() => setActiveTab("messages")}
                    >
                      <span className="text-sm font-medium text-foreground">Contact us</span>
                      <ChevronRight className="h-4 w-4 text-primary" />
                    </button>
                  </div>

                  <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-white shadow-md dark:bg-card">
                    <a
                      href="https://docs.nisccloud.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted/40"
                    >
                      <span className="text-sm font-medium text-foreground">Nisc Cloud Docs</span>
                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                    </a>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted/40"
                      onClick={() => setActiveTab("help")}
                    >
                      <span className="text-sm font-medium text-foreground">Support Centre</span>
                      <ExternalLink className="h-3.5 w-3.5 text-primary" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-white px-4 py-3.5 shadow-md transition-colors hover:bg-muted/40 dark:bg-card"
                    onClick={() => setActiveTab("help")}
                  >
                    <span className="text-sm font-medium text-foreground">Search for help</span>
                    <Search className="h-4 w-4 text-primary" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="flex h-full flex-col">
              <div className="flex flex-shrink-0 items-center justify-between border-b px-4 pb-3 pt-4">
                <h2 className="text-base font-semibold text-foreground">Messages</h2>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 w-fit rounded-full bg-muted/50 p-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-base font-semibold">No messages yet</h3>
                <p className="mb-5 max-w-[220px] text-sm text-muted-foreground">
                  Chat support will be available here soon.
                </p>
                <button
                  type="button"
                  className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  onClick={() => setActiveTab("home")}
                >
                  Back to home
                </button>
              </div>
            </div>
          )}

          {activeTab === "help" && (
            <div className="flex h-full flex-col">
              <div className="flex flex-shrink-0 items-center justify-between border-b px-4 pb-3 pt-4">
                <h2 className="text-base font-semibold text-foreground">Help</h2>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-accent"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="border-b px-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search for help"
                    className="w-full rounded-lg border-0 bg-muted/50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium text-foreground">Help centre</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Browse docs while we finish wiring this panel.
                </p>
                <a
                  href="/help"
                  className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                >
                  Open Help Centre
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t bg-background">
          <div className="flex">
            {(
              [
                { id: "home", label: "Home", Icon: Home },
                { id: "messages", label: "Messages", Icon: MessageSquare },
                { id: "help", label: "Help", Icon: BookOpen },
              ] as const
            ).map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "relative flex flex-1 flex-col items-center gap-1 py-3 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" />
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
