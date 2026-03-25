"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { trpc } from "@/utils/trpc";

/**
 * Prefetches teams data so TeamSwitcher has it on first paint.
 * Renders only on client so tRPC context is available (avoids "Unable to find tRPC Context" when
 * layout streams before root QueryProvider has mounted).
 */
function PrefetchTeamsInner() {
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

export const PrefetchTeams = dynamic(
  () => Promise.resolve(PrefetchTeamsInner),
  { ssr: false }
);


