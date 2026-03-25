"use client";

import { trpc } from "@/utils/trpc";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { BillingSettingsSection } from "./billing-settings-section";
import { ActiveInvitationsSection } from "./active-invitations-section";
import { MembersSection } from "./members-section";

interface TeamSettingsTabProps {
  teamSlug: string;
}

export function TeamSettingsTab({ teamSlug }: TeamSettingsTabProps) {
  const { data: teamData, isLoading } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    { enabled: !!teamSlug }
  );

  const teamId = teamData?.id ?? null;

  if (isLoading || !teamSlug) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} />
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        <p>Company not found. Please check the URL or try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <BillingSettingsSection teamId={teamId} />
      <ActiveInvitationsSection teamId={teamId} />
      <MembersSection teamId={teamId} />
    </div>
  );
}
