"use client";

import { useEffect } from "react";
import { trpc } from "@/utils/trpc";

/**
 * Prefetches teams data so TeamSwitcher has it on first paint.
 */
export function PrefetchTeams() {
  const utils = trpc.useUtils();
  useEffect(() => {
    utils.teams.getUserTeams
      .prefetch(undefined, { staleTime: 10 * 60 * 1000 })
      .catch((error) => {
        console.warn("Failed to prefetch teams:", error);
      });
  }, [utils]);
  return null;
}
