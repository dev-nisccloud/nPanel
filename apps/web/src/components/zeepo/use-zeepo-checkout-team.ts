"use client";

import { useZeepoAgentRoute } from "@/components/zeepo/zeepo-agent-route-context";
import { useZeepoAiRoute } from "@/components/zeepo/zeepo-ai-route-context";

/** Team for checkout: Zeepo Agent route if set, otherwise Zeepo AI (customer slug). */
export function useZeepoCheckoutTeam(): {
  teamId: string | null;
  teamSlug: string | null;
} {
  const agent = useZeepoAgentRoute();
  const ai = useZeepoAiRoute();
  if (agent.teamId || agent.teamSlug) {
    return { teamId: agent.teamId, teamSlug: agent.teamSlug };
  }
  return { teamId: ai.teamId, teamSlug: ai.teamSlug };
}
