"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { FileText, ImageIcon, Library, Presentation } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { ZeepoAiDetailPane } from "@/components/zeepo/zeepo-ai-detail-pane";
import { cn } from "@/lib/utils";
import {
  generationToPanel,
  mapApiGeneration,
  type ZeepoAiActivePanel,
  type ZeepoAiGeneration,
} from "@/components/zeepo/zeepo-ai-types";
import {
  useZeepoAiRoute,
  zeepoAiLibraryInput,
  zeepoAiSessionPath,
} from "@/components/zeepo/zeepo-ai-route-context";
import { trpc } from "@/utils/trpc";

type Filter = "all" | "image" | "document" | "presentation";

function kindLabel(kind: string) {
  if (kind === "image") return "Image";
  if (kind === "presentation" || kind === "image-presentation") return "Presentation";
  return "Document";
}

function KindIcon({ kind }: { kind: string }) {
  if (kind === "image" || kind === "image-presentation") {
    return <ImageIcon className="size-4 text-primary" />;
  }
  if (kind === "presentation") return <Presentation className="size-4 text-primary" />;
  return <FileText className="size-4 text-primary" />;
}

export function ZeepoAiLibraryPage() {
  const route = useZeepoAiRoute();
  const [filter, setFilter] = useState<Filter>("all");
  const [activePanel, setActivePanel] = useState<ZeepoAiActivePanel>(null);
  const {
    open: sidebarOpen,
    setOpen: setSidebarOpen,
    openMobile,
    setOpenMobile,
    isMobile,
  } = useSidebar();
  const { data: authSession } = authClient.useSession();
  const userRole = authSession?.user?.role;
  const isAgencySuperAdmin = userRole === "AGENCY_SUPER_ADMIN";

  const libraryEnabled = !route.isCustomer || Boolean(route.teamId);
  const libraryQuery = trpc.zeepoAi.sessions.listLibrary.useQuery(
    zeepoAiLibraryInput(route, { page: 1, limit: 100, kind: filter }),
    {
      enabled: libraryEnabled,
      refetchOnWindowFocus: false,
    },
  );

  const items = useMemo(() => {
    return (libraryQuery.data?.items ?? []).map((row) => {
      const mapped = mapApiGeneration({
        id: row.id,
        kind: row.kind,
        status: row.status,
        provider: row.provider,
        modelId: row.modelId,
        messageId: row.messageId,
        sessionId: row.sessionId,
        prompt: row.prompt,
        outputs: row.outputs,
        createdAt: row.createdAt,
      });
      return {
        ...mapped,
        sessionTitle: row.sessionTitle,
      };
    });
  }, [libraryQuery.data?.items]);

  const isPreviewPanelOpen = Boolean(activePanel);
  useEffect(() => {
    if (!isPreviewPanelOpen) return;
    if (isMobile) {
      if (openMobile) setOpenMobile(false);
      return;
    }
    if (sidebarOpen) setSidebarOpen(false);
  }, [isPreviewPanelOpen, isMobile, sidebarOpen, openMobile, setSidebarOpen, setOpenMobile]);

  const openItem = (g: ZeepoAiGeneration) => {
    const panel = generationToPanel(g);
    if (panel) setActivePanel(panel);
  };

  return (
    <div className="zeepo-ai-root relative flex h-full min-h-0 w-full overflow-hidden">
      <div
        className={cn(
          "relative flex min-h-0 min-w-0 flex-col overflow-hidden transition-all duration-300 ease-in-out",
          activePanel
            ? "hidden md:flex md:h-full md:w-[48%] md:shrink-0 xl:w-[52%] border-r border-border"
            : "h-full flex-1",
        )}
      >
        <div
          className={cn(
            "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
            activePanel ? "px-4 pt-3 sm:px-5 sm:pt-4 md:px-5 md:pt-5 lg:px-6" : "px-3 sm:px-4 md:px-6",
          )}
        >
          <header className="mb-4 flex shrink-0 flex-col gap-3 pt-1">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Library className="size-4 text-primary" />
              </span>
              <div className="min-w-0">
                <h1 className="text-base font-semibold tracking-tight text-foreground">Library</h1>
                <p className="text-[12px] text-muted-foreground">
                  {route.isCustomer
                    ? "All images, documents, and presentations for this organization"
                    : "All images, documents, and presentations across your chats"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["all", "All"],
                  ["image", "Images"],
                  ["document", "Documents"],
                  ["presentation", "Presentations"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                    filter === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto pb-6">
            {!libraryEnabled || libraryQuery.isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading library…</p>
              </div>
            ) : libraryQuery.isError ? (
              <div className="flex h-40 items-center justify-center px-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {libraryQuery.error.message || "Could not load this library."}
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <p className="text-sm text-muted-foreground">No items in this library yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {items.map((g) => {
                  const active =
                    activePanel && "generationId" in activePanel
                      ? activePanel.generationId === g.id
                      : false;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => openItem(g)}
                      className={cn(
                        "group overflow-hidden rounded-xl border bg-card text-left shadow-sm transition",
                        "hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "border-primary ring-2 ring-primary/20" : "border-border/70",
                      )}
                    >
                      {g.kind === "image" && g.imageUrl ? (
                        <div className="aspect-square overflow-hidden bg-muted">
                          <img
                            src={g.imageUrl}
                            alt={g.title || ""}
                            className="size-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-muted/40">
                          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                            <KindIcon kind={g.kind} />
                          </span>
                        </div>
                      )}
                      <div className="space-y-0.5 px-2.5 py-2">
                        <p className="truncate text-[13px] font-medium leading-tight text-foreground">
                          {g.title || kindLabel(g.kind)}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {kindLabel(g.kind)} ·{" "}
                          <Link
                            to={zeepoAiSessionPath(route.basePath, g.sessionId ?? "")}
                            className="hover:text-foreground hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {g.sessionTitle}
                          </Link>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {activePanel ? (
        <div
          className={cn(
            "absolute inset-0 z-40 flex min-h-0 flex-col overflow-hidden bg-background",
            "md:relative md:inset-auto md:z-auto md:min-h-0 md:flex-1",
            "animate-in slide-in-from-right-2 duration-200 md:animate-none",
          )}
        >
          <ZeepoAiDetailPane
            panel={activePanel}
            onClose={() => setActivePanel(null)}
            viewOnly
            isAgencySuperAdmin={isAgencySuperAdmin}
          />
        </div>
      ) : null}
    </div>
  );
}

export default ZeepoAiLibraryPage;
