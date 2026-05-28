"use client";

import { useState } from "react";

import { SettingsPageShell } from "@/components/settings-page-shell";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

import { BillingSettingsSection } from "./billing-settings-section";
import { ActiveInvitationsSection } from "./active-invitations-section";
import { MembersSection } from "./members-section";
import { TeamHeader, TeamHeaderSkeleton } from "./team-header";

const tabs = [
  { value: "billing", label: "Billing" },
  { value: "invitations", label: "Invitations" },
  { value: "members", label: "Members" },
] as const;

export type TeamSettingsTab = (typeof tabs)[number]["value"];

interface TeamSettingsTabProps {
  teamSlug: string;
}

export function TeamSettingsTab({ teamSlug }: TeamSettingsTabProps) {
  const [activeTab, setActiveTab] = useState<TeamSettingsTab>("billing");

  const { data: teamData, isLoading } = trpc.teams.getTeamIdBySlug.useQuery(
    { slug: teamSlug },
    { enabled: !!teamSlug }
  );

  const teamId = teamData?.id ?? null;

  if (isLoading || !teamSlug) {
    return (
      <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
        <SettingsPageShell
          title="Settings"
          description="Manage your company billing, invitations, and members"
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          navLabel="Company settings"
          header={<TeamHeaderSkeleton />}
        >
          <div className="flex items-center justify-center py-12">
            <Spinner size={24} />
          </div>
        </SettingsPageShell>
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
        <SettingsPageShell
          title="Settings"
          description="Manage your company billing, invitations, and members"
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          navLabel="Company settings"
        >
          <div className="rounded-lg border border-dashed px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Company not found. Please check the URL or try again later.
            </p>
          </div>
        </SettingsPageShell>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-col px-4 py-4 md:px-6 md:py-6 lg:px-8">
      <SettingsPageShell
        title="Settings"
        description="Manage your company billing, invitations, and members"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        navLabel="Company settings"
        header={<TeamHeader name={teamData.name} slug={teamData.slug} />}
      >
        {activeTab === "billing" && <BillingSettingsSection teamId={teamId} />}
        {activeTab === "invitations" && <ActiveInvitationsSection teamId={teamId} />}
        {activeTab === "members" && <MembersSection teamId={teamId} />}
      </SettingsPageShell>
    </div>
  );
}
