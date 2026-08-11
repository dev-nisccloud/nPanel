"use client";

import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, Library, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ZeepoDeleteChatDialog } from "@/components/zeepo/zeepo-delete-chat-dialog";
import { ZeepoRenameChatDialog } from "@/components/zeepo/zeepo-rename-chat-dialog";
import {
  useZeepoAiRoute,
  zeepoAiLibraryPath,
  zeepoAiSessionPath,
  zeepoAiSessionsInput,
} from "@/components/zeepo/zeepo-ai-route-context";
import { startViewTransitionNavigate } from "@/routes/_agency.zeepo-ai-agent/nav-state";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

function formatChatTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Session chat paths + library (not the landing).
 * Agency: `/agency/zeepo-ai/:segment`
 * Customer: `/:slug/zeepo-ai/:segment`
 */
export function isZeepoAiChatSessionPath(pathname: string | undefined): boolean {
  if (!pathname) return false;
  return (
    /^\/agency\/zeepo-ai\/[^/]+/.test(pathname) ||
    /^\/[^/]+\/zeepo-ai\/[^/]+/.test(pathname)
  );
}

export function NavZeepoAiHistory() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { sessionId } = useParams();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const route = useZeepoAiRoute();
  const collapsed = state === "collapsed" && !isMobile;
  const libraryHref = zeepoAiLibraryPath(route.basePath);
  const libraryActive = pathname === libraryHref;
  const utils = trpc.useUtils();

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title?: string | null } | null>(
    null,
  );
  const [renameTarget, setRenameTarget] = useState<{ id: string; title?: string | null } | null>(
    null,
  );

  const listQuery = trpc.zeepoAi.sessions.list.useQuery(
    zeepoAiSessionsInput(route, { page: 1, limit: 30 }),
    { refetchOnWindowFocus: true },
  );

  const deleteSession = trpc.zeepoAi.sessions.delete.useMutation({
    onSuccess: async (_data, vars) => {
      toast.success("Chat deleted");
      setDeleteTarget(null);
      await utils.zeepoAi.sessions.list.invalidate();
      await utils.zeepoAi.sessions.listLibrary.invalidate();
      if (sessionId === vars.id) {
        startViewTransitionNavigate(() => {
          navigate(route.basePath);
        });
      }
    },
    onError: (e) => toast.error(e.message || "Could not delete chat"),
  });

  const renameSession = trpc.zeepoAi.sessions.updateTitle.useMutation({
    onSuccess: async () => {
      toast.success("Chat renamed");
      setRenameTarget(null);
      await utils.zeepoAi.sessions.list.invalidate();
      if (sessionId) {
        await utils.zeepoAi.sessions.get.invalidate({ id: sessionId });
      }
    },
    onError: (e) => toast.error(e.message || "Could not rename chat"),
  });

  const sessions = listQuery.data?.sessions ?? [];

  const goToLanding = () => {
    if (isMobile) setOpenMobile(false);
    startViewTransitionNavigate(() => {
      navigate(route.basePath, { replace: true });
    });
  };

  const goToLibrary = () => {
    if (isMobile) setOpenMobile(false);
    startViewTransitionNavigate(() => {
      navigate(libraryHref);
    });
  };

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <>
      <SidebarGroup className="pb-1">
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Back to Zeepo AI" onClick={goToLanding}>
                <ArrowLeft />
                <span>Back to Zeepo AI</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Library"
                isActive={libraryActive}
                onClick={goToLibrary}
              >
                <Library />
                <span>Library</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {collapsed ? (
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="New chat" onClick={goToLanding}>
                  <Plus />
                  <span>New chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ) : (
            <button
              type="button"
              onClick={goToLanding}
              className={cn(
                "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl",
                "border border-border/70 bg-gradient-to-b from-card to-card/80",
                "px-3 py-2.5 text-left shadow-sm",
                "transition-all duration-200 ease-out",
                "hover:border-primary/35 hover:bg-primary/[0.04] hover:shadow-md",
                "hover:-translate-y-px active:translate-y-0 active:scale-[0.99]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  "bg-primary text-primary-foreground shadow-sm",
                  "transition-transform duration-200 group-hover:scale-105",
                )}
              >
                <Plus className="size-4" strokeWidth={2.5} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold tracking-tight text-foreground">
                  New chat
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  Start a fresh conversation
                </span>
              </span>
            </button>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Recent</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {listQuery.isLoading ? (
              <SidebarMenuItem>
                <span className="px-2 py-1.5 text-xs text-muted-foreground">Loading…</span>
              </SidebarMenuItem>
            ) : sessions.length === 0 ? (
              <SidebarMenuItem>
                <span className="px-2 py-1.5 text-xs text-muted-foreground">No chats yet</span>
              </SidebarMenuItem>
            ) : (
              sessions.map((chat) => {
                const href = zeepoAiSessionPath(route.basePath, chat.id);
                const active =
                  !libraryActive && (sessionId === chat.id || pathname === href);
                return (
                  <SidebarMenuItem key={chat.id}>
                    <div
                      className={cn(
                        "group/chat relative flex w-full min-w-0 items-start",
                        !collapsed && "pr-14",
                      )}
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={chat.title ?? "New chat"}
                        className={cn(!collapsed && "h-auto min-h-8 flex-1 items-start py-2")}
                      >
                        <Link
                          to={href}
                          onClick={closeMobile}
                          className="flex w-full min-w-0 items-start justify-between gap-2"
                        >
                          <span className="truncate font-medium">{chat.title ?? "New chat"}</span>
                          {!collapsed ? (
                            <span className="shrink-0 pt-0.5 text-[10px] font-normal tabular-nums text-muted-foreground">
                              {formatChatTime(chat.updatedAt)}
                            </span>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>

                      {!collapsed ? (
                        <div className="absolute right-1 top-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/chat:opacity-100 group-focus-within/chat:opacity-100">
                          <button
                            type="button"
                            aria-label="Rename chat"
                            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setRenameTarget({ id: chat.id, title: chat.title });
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete chat"
                            disabled={deleteSession.isPending && deleteTarget?.id === chat.id}
                            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteTarget({ id: chat.id, title: chat.title });
                            }}
                          >
                            {deleteSession.isPending && deleteTarget?.id === chat.id ? (
                              <Spinner size={12} className="text-current" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </SidebarMenuItem>
                );
              })
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <ZeepoDeleteChatDialog
        target={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleteSession.isPending) setDeleteTarget(null);
        }}
        isPending={deleteSession.isPending}
        onConfirm={async (id) => {
          await deleteSession.mutateAsync({ id });
        }}
      />

      <ZeepoRenameChatDialog
        target={renameTarget}
        open={Boolean(renameTarget)}
        onOpenChange={(open) => {
          if (!open && !renameSession.isPending) setRenameTarget(null);
        }}
        isPending={renameSession.isPending}
        onConfirm={async (id, title) => {
          await renameSession.mutateAsync({ id, title });
        }}
      />
    </>
  );
}
