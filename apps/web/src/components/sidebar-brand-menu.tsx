"use client";

import { ExternalLink } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";

/** Must be set at Vite build time (`VITE_LANDING_PAGE_URL`). Runtime Cloud Run env is ignored. */
const LANDING_PAGE_URL = (
  (import.meta.env.VITE_LANDING_PAGE_URL as string | undefined)?.trim() ||
  "https://www.nisccloud.com"
).replace(/\/+$/, "");

export function SidebarBrandMenu() {
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  const handleBackToWebsite = () => {
    window.location.assign(LANDING_PAGE_URL);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          type="button"
          className="!h-auto !w-fit max-w-full justify-start overflow-visible px-2 py-1.5 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-1"
          aria-label={`${APP_CONFIG.name} menu`}
        >
          {isExpanded ? (
            <img
              src="/nisclogooriginal.png"
              alt={APP_CONFIG.name}
              width={1131}
              height={203}
              className="h-auto w-auto max-h-8 max-w-full object-contain object-left"
            />
          ) : (
            <img
              src="/nisciconoriginal.png"
              alt={APP_CONFIG.name}
              width={3459}
              height={2124}
              className="size-6 object-contain"
            />
          )}
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" className="min-w-44">
        <DropdownMenuItem onClick={handleBackToWebsite}>
          <ExternalLink className="h-4 w-4" />
          Back to website
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
