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
          size="lg"
          className="!h-auto min-h-12 !overflow-visible !px-4 !py-3 group-data-[collapsible=icon]:!size-auto group-data-[collapsible=icon]:!h-auto group-data-[collapsible=icon]:!w-full group-data-[collapsible=icon]:!p-2"
          aria-label={`${APP_CONFIG.name} menu`}
        >
          {isExpanded ? (
            <img
              src="/nisclogooriginal.png"
              alt={APP_CONFIG.name}
              className="h-12 w-auto max-w-full shrink-0"
            />
          ) : (
            <img
              src="/nisciconoriginal.png"
              alt={APP_CONFIG.name}
              className="h-11 w-auto max-w-full shrink-0 object-contain"
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
