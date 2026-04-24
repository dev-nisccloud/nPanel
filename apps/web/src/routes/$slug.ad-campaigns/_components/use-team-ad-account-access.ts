"use client";

import * as React from "react";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

type AdPlatform = "META_ADS" | "GOOGLE_ADS" | "LINKEDIN_ADS";

interface UseTeamAdAccountAccessInput {
  teamSlug: string;
  platform: AdPlatform;
  accountIds: string[];
  redirectPath: string;
  navigate: (path: string) => void;
}

export function useTeamAdAccountAccess(input: UseTeamAdAccountAccessInput) {
  const sanitizedAccountIds = React.useMemo(
    () => input.accountIds.map((id) => id.trim()).filter((id) => id.length > 0),
    [input.accountIds],
  );

  const { data: linkedAccountIds = [], isLoading: isLoadingLinkedAccounts } =
    trpc.clientSubscriptions.listLinkedAdAccountsForTeam.useQuery(
      { teamSlug: input.teamSlug, platform: input.platform },
      { enabled: input.teamSlug.length > 0 },
    );

  const hasTeamAccess = React.useMemo(
    () => sanitizedAccountIds.some((id) => linkedAccountIds.includes(id)),
    [sanitizedAccountIds, linkedAccountIds],
  );

  React.useEffect(() => {
    if (isLoadingLinkedAccounts || sanitizedAccountIds.length === 0) return;
    if (!hasTeamAccess) {
      toast.error("You do not have access to this ad account.");
      input.navigate(input.redirectPath);
    }
  }, [
    isLoadingLinkedAccounts,
    sanitizedAccountIds.length,
    hasTeamAccess,
    input.navigate,
    input.redirectPath,
  ]);

  return {
    hasTeamAccess,
    isLoadingLinkedAccounts,
  };
}

