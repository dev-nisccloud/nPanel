"use client";

import { useEffect } from "react";
import { trpc } from "@/utils/trpc";

/**
 * Client component that prefetches teams data to ensure it's available
 * when the layout and sidebar components render. This prevents loading states
 * in TeamSwitcher on initial page load.
 */
export function PrefetchTeams() {
  const utils = trpc.useUtils();

  useEffect(() => {
    // Prefetch teams data with same caching options as TeamSwitcher
    utils.teams.getUserTeams.prefetch(undefined, {
      staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    }).catch((error) => {
      // Silently handle errors - TeamSwitcher will handle loading/error states
      console.warn("Failed to prefetch teams:", error);
    });
  }, [utils]);

  return null;
}


