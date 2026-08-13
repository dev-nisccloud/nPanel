"use client";

import * as React from "react";
import { useLocation } from "react-router";
import { SidebarInset } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const IMAGE_GEN_STUDIO_EDITOR_PATH = "/agency/gen-ai/image-gen-studio/editor";
const ZEEPO_AGENT_PATH = "/agency/zeepo-ai-agent";
const NEB_DESIGN_EDITOR_PATH = /^\/agency\/nisc-email-builder\/[^/]+$/;

function isZeepoAiFitPath(pathname: string | undefined) {
  if (!pathname) return false;
  if (pathname === "/agency/zeepo-ai") return true;
  if (!pathname.startsWith("/agency/zeepo-ai/")) return false;
  return !pathname.startsWith("/agency/zeepo-ai/activity");
}

export function AgencyContentArea({
  contentLayout,
  children,
}: {
  contentLayout: string;
  children: React.ReactNode;
}) {
  const { pathname } = useLocation();
  const isImageGenStudioEditor = pathname?.includes(IMAGE_GEN_STUDIO_EDITOR_PATH);
  const isZeepoAgent = pathname?.startsWith(ZEEPO_AGENT_PATH);
  const isZeepoAiFit = isZeepoAiFitPath(pathname);
  const isNebDesignEditor = NEB_DESIGN_EDITOR_PATH.test(pathname ?? "");

  return (
    <SidebarInset
      data-content-layout={contentLayout}
      className={cn(
        "data-[content-layout=centered]:!mx-auto data-[content-layout=centered]:max-w-screen-2xl",
        "max-[113rem]:peer-data-[variant=inset]:!mr-2 min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto",
        (isImageGenStudioEditor || isZeepoAgent || isZeepoAiFit || isNebDesignEditor) &&
          "min-h-0 max-h-svh overflow-hidden",
        isImageGenStudioEditor &&
          "!max-w-none h-svh max-h-svh min-h-0 min-w-0 overflow-hidden"
      )}
    >
      {children}
    </SidebarInset>
  );
}

export function AgencyContentInner({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isImageGenStudioEditor = pathname?.includes(IMAGE_GEN_STUDIO_EDITOR_PATH);
  const isZeepoAgent = pathname?.startsWith(ZEEPO_AGENT_PATH);
  const isZeepoAiFit = isZeepoAiFitPath(pathname);
  const isNebDesignEditor = NEB_DESIGN_EDITOR_PATH.test(pathname ?? "");
  const isLockedChatShell = isZeepoAgent || isZeepoAiFit || isNebDesignEditor;

  return (
    <div
      data-agency-content-inner=""
      className={cn(
        isZeepoAgent
          ? "bg-background [--agency-content-bg:var(--background)]"
          : "bg-[#f8fafb] dark:bg-background [--agency-content-bg:#f8fafb] dark:[--agency-content-bg:var(--background)]",
        isImageGenStudioEditor
          ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0"
          : isLockedChatShell
            ? "flex h-[calc(100svh-theme(spacing.12))] max-h-[calc(100svh-theme(spacing.12))] min-h-0 flex-col overflow-hidden px-3 pt-2 pb-2 sm:px-4 sm:pt-3 sm:pb-3 md:px-6 md:pt-4 md:pb-4"
            : "h-full p-4 md:p-6"
      )}
    >
      {children}
    </div>
  );
}
